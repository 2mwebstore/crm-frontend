<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div><h1 class="text-xl font-semibold text-gray-800">{{ title }}</h1><p class="text-sm text-gray-500">{{ subtitle }}</p></div>
      <button v-if="canCreate" @click="openCreate" class="btn-primary flex items-center gap-2"><PlusIcon class="w-4 h-4" />New</button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <input v-model="search" type="text" class="input w-52" placeholder="Search name…" />
      <SearchableSelect v-model="statusFilter" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" />
      <SearchableSelect v-model="branchFilter" :options="branches" placeholder="All branches" all-label="All branches" class="w-44" />
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <AppTable :columns="columns" :rows="filteredItems" :loading="loading">
      <template v-for="col in colorCols" :key="col" #[`cell-${col}`]="{ value }">
        <div class="flex items-center gap-2">
          <div v-if="value" class="w-4 h-4 rounded-full border border-gray-200" :style="{ background: value }" />
          <span class="text-sm text-gray-700">{{ value || '—' }}</span>
        </div>
      </template>
      <template #cell-branch="{ row }">
        <span v-if="row.branch" class="badge bg-indigo-50 text-indigo-700 font-mono text-xs">{{ row.branch.code }}</span>
        <span v-else class="text-gray-400 text-xs">—</span>
      </template>
      <template #cell-bank_type="{ row }">
        <span v-if="row.bank_type" class="text-sm text-gray-700">{{ row.bank_type.name }}</span>
        <span v-else class="text-gray-400 text-xs">—</span>
      </template>
      <template #cell-currency_type="{ row }">
        <span v-if="row.currency_type" class="badge bg-emerald-50 text-emerald-700 font-mono text-xs">{{ row.currency_type.code }}</span>
        <span v-else class="text-gray-400 text-xs">—</span>
      </template>
      <template #cell-cash="{ value }">
        <span class="font-mono text-sm text-gray-700">{{ Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      </template>
      <template #cell-credit="{ value }">
        <span class="font-mono text-sm text-gray-700">{{ Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      </template>
      <template #cell-created_by="{ row }">
        <span class="text-sm text-gray-600">{{ row.created_by?.name || '—' }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span :class="['badge', value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ value ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #cell-calc_type="{ value }">
        <span class="badge bg-blue-100 text-blue-700">{{ value }}</span>
      </template>
      <template #cell-is_base="{ value }">
        <span :class="['badge', value ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500']">{{ value ? 'Base' : '—' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button v-if="topupField && topupFn && canBalance" @click="openBalanceModal(row, 'topup')" class="btn-icon text-emerald-600" title="Top Up">
            <BanknotesIcon class="w-4 h-4" />
          </button>
          <button v-if="topupField && withdrawFn && canBalance" @click="openBalanceModal(row, 'withdrawal')" class="btn-icon text-orange-600" title="Withdraw">
            <MinusCircleIcon class="w-4 h-4" />
          </button>
          <button v-if="topupField && entityType" @click="goToHistory(row)" class="btn-icon text-gray-500" title="History">
            <ClockIcon class="w-4 h-4" />
          </button>
          <button v-if="canEdit" @click="openEdit(row)" class="btn-icon"><PencilIcon class="w-4 h-4" /></button>
          <button v-if="canDelete" @click="confirmDelete(row)" class="btn-icon text-red-500"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </template>
    </AppTable>

    <!-- Create/Edit Modal -->
    <AppModal v-model="modal" :title="editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`" size="md">
      <div class="space-y-3">
        <!-- Branch select - applies to all lookup types -->
        <div>
          <label class="label">Branch</label>
          <SearchableSelect v-model="form.branch_id" :options="branches" placeholder="No branch (global)" />
        </div>
        <slot name="form" :form="form" />
      </div>
      <template #footer>
        <button @click="modal = false" class="btn-secondary">Cancel</button>
        <button @click="handleSave" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </template>
    </AppModal>

    <!-- Top Up / Withdraw Modal (standalone from create/edit — atomically changes the balance) -->
    <AppModal v-if="topupField" v-model="balanceModal" :title="balanceMode === 'withdrawal' ? `Withdraw ${topupLabel}` : `Top Up ${topupLabel}`" size="sm">
      <div class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Name</span>
            <span class="font-medium text-gray-800">{{ balanceTarget?.name || balanceTarget?.account_name || '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Code</span>
            <span class="font-mono text-gray-700">{{ balanceTarget?.code || balanceTarget?.account_number || '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Currency</span>
            <span class="font-mono text-gray-700">{{ balanceTarget?.currency_type?.code || '—' }}</span>
          </div>
          <div class="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200">
            <span class="text-gray-500">Current {{ topupLabel }}</span>
            <span class="font-mono font-semibold text-gray-800">
              {{ Number(balanceTarget?.[topupField] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
          </div>
        </div>
        <div>
          <label class="label">Amount to {{ balanceMode === 'withdrawal' ? 'withdraw' : 'add' }}</label>
          <input
            v-model="balanceAmountDisplay"
            type="text"
            inputmode="decimal"
            class="input font-mono"
            placeholder="0.00"
            @focus="onBalanceAmountFocus"
          />
          <p class="text-xs mt-1" :class="balanceAmountInvalid ? 'text-red-500' : 'text-gray-400'">
            <template v-if="balanceAmountInvalid">Enter a valid positive amount</template>
            <template v-else-if="balanceMode === 'withdrawal'">Withdrawal fails if it would take the balance below zero</template>
            <template v-else>Enter how much to add</template>
          </p>
        </div>
        <div>
          <label class="label">Remark</label>
          <input v-model="balanceRemark" class="input" placeholder="Optional note for this transaction" />
        </div>
      </div>
      <template #footer>
        <button @click="balanceModal = false" class="btn-secondary" :disabled="balanceSaving">Cancel</button>
        <button
          @click="doBalanceChange"
          :class="['btn-primary', balanceMode === 'withdrawal' ? '!bg-orange-600 hover:!bg-orange-700' : '']"
          :disabled="balanceSaving || !canSubmitBalance"
        >
          {{ balanceSaving ? 'Saving...' : (balanceMode === 'withdrawal' ? 'Withdraw' : 'Top Up') }}
        </button>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon, MinusCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import AppTable from '@/components/common/AppTable.vue'
import AppModal from '@/components/common/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { getBranches } from '@/api/branches'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  title: String,
  subtitle: String,
  columns: Array,
  defaultForm: Object,
  colorCols: { type: Array, default: () => [] },
  fetchFn: Function,
  createFn: Function,
  updateFn: Function,
  deleteFn: Function,
  // Optional standalone Top Up / Withdraw feature — set topupField plus at
  // least one of topupFn/withdrawFn to enable the corresponding button.
  // topupField: the row property holding the current balance (e.g. 'cash', 'credit')
  // topupFn/withdrawFn: async (id, amount, remark) => Promise — call the backend's atomic endpoint
  // entityType: the BalanceEntityType string (e.g. 'company_bank', 'product_type') —
  //   set this (alongside topupField) to enable the History button, which
  //   navigates to the full-page ledger view instead of opening a modal.
  // topupLabel: display label, defaults to a capitalized topupField
  // balancePerm: permission name gating the Top Up/Withdraw buttons
  //   specifically (e.g. 'company_banks.topup', 'product_types.topup') —
  //   separate from the Create/Edit/Delete permissions, so a role can be
  //   granted one without the other. If not set, the buttons stay hidden
  //   for non-Super-Admins (there's no broader fallback permission anymore).
  // permGroup: the permission group name for this lookup entity (e.g.
  //   'bank_types', 'levels') — automatically checks '{group}.create' /
  //   '{group}.edit' / '{group}.delete' for the New/Edit/Delete buttons
  //   respectively. If not set, those buttons stay hidden for non-Super-
  //   Admins (there's no broader fallback permission anymore).
  topupField: { type: String, default: null },
  topupFn: { type: Function, default: null },
  withdrawFn: { type: Function, default: null },
  entityType: { type: String, default: null },
  topupLabel: { type: String, default: '' },
  balancePerm: { type: String, default: null },
  permGroup: { type: String, default: null },
})

const auth = useAuthStore()
const router = useRouter()
const { success, error } = useToast()

// Super Admin always bypasses these (auth.can/canAny already return true
// for them internally) — for everyone else, each button now depends
// entirely on its own specific permission with no broader fallback.
const canCreate = computed(() => props.permGroup ? auth.can(`${props.permGroup}.create`) : false)
const canEdit = computed(() => props.permGroup ? auth.can(`${props.permGroup}.edit`) : false)
const canDelete = computed(() => props.permGroup ? auth.can(`${props.permGroup}.delete`) : false)
const canBalance = computed(() => props.balancePerm ? auth.can(props.balancePerm) : false)

const items        = ref([])
const allItems     = ref([])
const loading      = ref(false)
const modal        = ref(false)
const branches     = ref([])
const search       = ref('')
const statusFilter = ref(null)
const branchFilter = ref(null)
const statusOpts   = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]

const filteredItems = computed(() => {
  let list = allItems.value
  if (search.value) {
    const s = search.value.toLowerCase()
    // Most lookups match on name/code; entities like CompanyBank use
    // account_name/account_number instead, so check both.
    list = list.filter(i =>
      i.name?.toLowerCase().includes(s) ||
      i.code?.toLowerCase().includes(s) ||
      i.account_name?.toLowerCase().includes(s) ||
      i.account_number?.toLowerCase().includes(s)
    )
  }
  if (statusFilter.value !== null && statusFilter.value !== '') {
    list = list.filter(i => i.is_active === (statusFilter.value === 'true'))
  }
  if (branchFilter.value) {
    list = list.filter(i => i.branch_id === branchFilter.value || i.branch?.id === branchFilter.value)
  }
  return list
})
function resetFilters() { search.value = ''; statusFilter.value = null; branchFilter.value = null }
const editing = ref(null)
const saving = ref(false)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const form = ref({ ...props.defaultForm })

const balanceModal   = ref(false)
const balanceTarget  = ref(null)
const balanceMode    = ref('topup') // 'topup' | 'withdrawal'
const balanceSaving  = ref(false)
const balanceRemark  = ref('')
// Raw, unformatted numeric string as the user types (e.g. "1234.56").
// Kept separate from the formatted display value so we always have a clean
// value to parse/submit, no matter what commas/spacing the display shows.
const balanceAmountRaw = ref('')
const topupLabel = computed(() =>
  props.topupLabel || (props.topupField ? props.topupField.charAt(0).toUpperCase() + props.topupField.slice(1) : '')
)

// Strips anything that isn't a digit/decimal point, collapses multiple
// decimal points to one, and caps to 2 decimal places — so
// balanceAmountRaw can never become an unparseable string. No minus sign is
// allowed: direction (add vs withdraw) is chosen via balanceMode instead of
// the sign of the amount, which removes an entire class of "did they mean
// to deduct?" ambiguity.
function sanitizeAmountInput(val) {
  if (val == null) return ''
  let s = String(val).replace(/[^0-9.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
    const [intPart, decPart] = s.split('.')
    s = intPart + '.' + decPart.slice(0, 2)
  }
  return s
}

// v-model target for the input: formats the integer part with thousands
// separators live as the user types, while writes go through the sanitizer
// above so the underlying raw value stays clean.
const balanceAmountDisplay = computed({
  get() {
    if (balanceAmountRaw.value === '') return ''
    const [intPart, decPart] = balanceAmountRaw.value.split('.')
    const formattedInt = intPart === '' ? '0' : Number(intPart).toLocaleString('en-US')
    return formattedInt + (decPart !== undefined ? '.' + decPart : '')
  },
  set(val) { balanceAmountRaw.value = sanitizeAmountInput(val) }
})

// Parsed numeric value, or null if not currently a valid positive number.
// This is the single source of truth for validation and for what actually
// gets sent to the API — never the display string.
const balanceAmountNumber = computed(() => {
  if (balanceAmountRaw.value === '' || balanceAmountRaw.value === '.') return null
  const n = Number(balanceAmountRaw.value)
  return Number.isFinite(n) ? n : null
})

const balanceAmountInvalid = computed(() =>
  balanceAmountRaw.value !== '' && (balanceAmountNumber.value === null || balanceAmountNumber.value <= 0)
)

const canSubmitBalance = computed(() =>
  balanceAmountNumber.value !== null && balanceAmountNumber.value > 0
)

function onBalanceAmountFocus(e) { e.target.select() }

async function load() {
  loading.value = true
  try { const res = await props.fetchFn(); items.value = res.data || []; allItems.value = res.data || [] } catch { } finally { loading.value = false }
}

function openCreate() { form.value = { ...props.defaultForm, branch_id: null }; editing.value = null; modal.value = true }
function openEdit(row) { form.value = { ...row, branch_id: row.branch_id || null }; editing.value = row; modal.value = true }
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }

async function handleSave() {
  saving.value = true
  try {
    if (editing.value) { await props.updateFn(editing.value.id, form.value); success('Updated') }
    else { await props.createFn(form.value); success('Created') }
    modal.value = false; load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

async function doDelete() {
  try { await props.deleteFn(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

function openBalanceModal(row, mode) {
  balanceTarget.value    = row
  balanceMode.value      = mode
  balanceAmountRaw.value = ''
  balanceRemark.value    = ''
  balanceModal.value     = true
}

async function doBalanceChange() {
  if (!canSubmitBalance.value) return
  balanceSaving.value = true
  try {
    const fn = balanceMode.value === 'withdrawal' ? props.withdrawFn : props.topupFn
    await fn(balanceTarget.value.id, balanceAmountNumber.value, balanceRemark.value)
    success(`${topupLabel.value} ${balanceMode.value === 'withdrawal' ? 'withdrawn' : 'topped up'}`)
    balanceModal.value = false
    load()
  } catch (e) { error(e?.error || 'Transaction failed') } finally { balanceSaving.value = false }
}

function goToHistory(row) {
  router.push({
    name: 'balance-history',
    params: { entityType: props.entityType, entityId: row.id },
    query: {
      label: topupLabel.value,
      name: row.name || row.account_name || '',
      code: row.code || row.account_number || '',
      currency: row.currency_type?.code || '',
      balance: row[props.topupField] ?? 0,
    },
  })
}

onMounted(async () => {
  load()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code })) } catch {}
})
defineExpose({ load, form })
</script>