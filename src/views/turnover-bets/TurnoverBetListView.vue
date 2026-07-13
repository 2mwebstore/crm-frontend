<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Turn Over Bet</h1>
        <p class="text-sm text-gray-500 mt-0.5">Record and manage turnover bets</p>
      </div>
      <button @click="openCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Record
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Records</p>
        <p class="mt-2 text-3xl font-bold text-gray-800">{{ totalRecords }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Amount</p>
        <div class="mt-2 space-y-1">
          <p class="text-xl font-bold text-indigo-600">${{ totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          <p class="text-xl font-bold text-purple-600">៛{{ totalKHR.toLocaleString() }}</p>
        </div>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Approved</p>
        <p class="mt-2 text-3xl font-bold text-green-600">{{ totalApproved }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Pending</p>
        <p class="mt-2 text-3xl font-bold text-amber-600">{{ totalPending }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Rejected</p>
        <p class="mt-2 text-3xl font-bold text-red-600">{{ totalRejected }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <div><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <SearchableSelect v-model="filters.status" :options="statusOpts" value-key="id" label-key="name"
        placeholder="All status" all-label="All status" class="w-36" @update:modelValue="load" />
      <SearchableSelect v-model="filters.currency" :options="[{id:'USD',name:'USD'},{id:'KHR',name:'KHR'}]"
        value-key="id" label-key="name" placeholder="All currencies" all-label="All currencies" class="w-36" @update:modelValue="load" />
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-sm flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" />
        More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- More Filters Panel -->
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Product</label>
        <SearchableSelect v-model="filters.product_type_id" :options="lookup.productTypes" placeholder="All products" @update:modelValue="load" />
      </div>
    </div>

    <!-- Table (desktop) -->
    <div class="hidden sm:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Created Date</th>
              <th class="table-header">Date</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Product</th>
              <th class="table-header">Amount</th>
              <th class="table-header">Remark</th>
              <th class="table-header">Status</th>
              <th class="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="10" class="table-cell text-center py-10">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="10" class="table-cell text-center py-10 text-gray-400">No records found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (currentPage - 1) * currentPageSize + idx + 1 }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-700 whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
              <td class="table-cell text-sm text-gray-700 whitespace-nowrap">{{ fmtDate(row.date) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.created_by?.name || '—' }}</td>
              <td class="table-cell">
                <span class="text-sm font-medium text-gray-800">{{ row.product_type?.name || '—' }}</span>
              </td>
              <td class="table-cell font-semibold text-gray-800 whitespace-nowrap">{{ fmtCurrency(row.amount, row.currency) }}</td>
              <td class="table-cell max-w-40"><p class="text-xs text-gray-600 truncate">{{ row.remark || '—' }}</p></td>
              <td class="table-cell"><span :class="['badge', statusColor(row.status)]">{{ row.status }}</span></td>
              <td class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="row.status==='pending'" @click="doApprove(row,'approved')" class="btn-icon bg-green-50 text-green-600" title="Approve"><CheckCircleIcon class="w-4 h-4" /></button>
                  <button v-if="row.status==='pending'" @click="doApprove(row,'rejected')" class="btn-icon bg-red-50 text-red-500" title="Reject"><XCircleIcon class="w-4 h-4" /></button>
                  <button v-if="row.status==='pending'" @click="openEdit(row)" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></button>
                  <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span class="text-xs">Showing {{ (currentPage - 1) * currentPageSize + 1 }}–{{ Math.min(currentPage * currentPageSize, meta.total_items) }} of {{ meta.total_items }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Card list (mobile) — same items/actions/modals as the desktop table -->
    <div class="sm:hidden space-y-3">
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-400 text-sm">No records found</div>
      <div v-for="row in items" :key="row.id" class="card p-4">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
            <ArrowTrendingUpIcon class="w-5 h-5 text-green-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate">{{ row.product_type?.name || '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5 truncate">{{ fmtDate(row.date) }} <span v-if="row.created_by?.name">· {{ row.created_by.name }}</span></p>
            <p v-if="row.remark" class="text-xs text-gray-500 mt-1 truncate">"{{ row.remark }}"</p>
          </div>
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span class="font-bold whitespace-nowrap" style="color:#938af4">{{ fmtCurrency(row.amount, row.currency) }}</span>
            <span :class="['badge text-xs', statusColor(row.status)]">{{ row.status }}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
          <button v-if="row.status==='pending'" @click="doApprove(row,'approved')" class="btn-icon bg-green-50 text-green-600" title="Approve"><CheckCircleIcon class="w-4 h-4" /></button>
          <button v-if="row.status==='pending'" @click="doApprove(row,'rejected')" class="btn-icon bg-red-50 text-red-500" title="Reject"><XCircleIcon class="w-4 h-4" /></button>
          <button v-if="row.status==='pending'" @click="openEdit(row)" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></button>
          <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between pt-1 text-sm text-gray-500">
        <span class="text-xs">{{ meta.total_items }} total</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <AppModal v-model="modal" :title="editing ? 'Edit Turnover Bet' : 'New Turnover Bet'" size="md">
      <div class="space-y-4">

        <!-- Branch (create only) -->
        <div v-if="!editing">
          <label class="label">Branch <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="form.branch_id" :options="branches" placeholder="Select branch" @update:modelValue="onFormBranchChange" />
        </div>

        <div>
          <label class="label">Date</label>
          <DatePicker v-model="form.date" placeholder="Select date & time…" />
        </div>
        <div>
          <label class="label">Product <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.product_type_id"
            :options="modalProductOptions"
            :placeholder="form.branch_id ? 'Select product…' : 'Select a branch first…'"
            :show-all="false"
            :disabled="!form.branch_id"
          />
          <p v-if="form.branch_id && !modalProductOptions.length && !loadingModalProducts" class="text-xs text-amber-600 mt-1">
            No products found for this branch.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Amount <span class="text-red-500">*</span></label>
            <input v-model.number="form.amount" type="number" min="0.01" step="0.01" class="input" required />
          </div>
          <div>
            <label class="label">Currency</label>
            <SearchableSelect v-model="form.currency" :options="[{id:'USD',name:'USD'},{id:'KHR',name:'KHR'}]"
              value-key="id" label-key="name" placeholder="USD" :show-all="false" />
          </div>
        </div>
        <div>
          <label class="label">Remark</label>
          <textarea v-model="form.remark" class="input resize-none" rows="2" placeholder="Optional notes…" />
        </div>
      </div>
      <template #footer>
        <button @click="handleCancel" class="btn-secondary">Cancel</button>
        <RequiredFieldsGuard :fields="requiredFields" v-slot="{ isValid, missing }">
          <button
            @click="handleSave"
            class="btn-primary"
            :disabled="saving || !isValid"
            :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </RequiredFieldsGuard>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import RequiredFieldsGuard from '@/components/ui/RequiredFieldsGuard.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import { getTurnoverBets, createTurnoverBet, updateTurnoverBet, deleteTurnoverBet, approveTurnoverBet } from '@/api/turnover-bets'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'
import { getProductTypes } from '@/api/lookup'
import { useLookupStore } from '@/stores/lookup'
import { useToast } from '@/composables/useToast'
import { nowForDatePicker } from '@/utils/datetime'

const { success, error } = useToast()
const lookup   = useLookupStore()
const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(10)
const saving   = ref(false)
const modal    = ref(false)
const editing  = ref(null)
const branches = ref([])
const users    = ref([])
const showMoreFilters = ref(false)
const deleteTarget = ref(null)
const deleteDialog = ref(false)

// Branch-scoped product list for the create modal only (separate from the
// page-level "All products" filter, which intentionally shows every product).
const modalProducts        = ref([])
const loadingModalProducts = ref(false)

const currentPage     = computed(() => page.value)
const currentPageSize = computed(() => pageSize.value)

const filters = ref({ date_from: '', date_to: '', status: null, currency: null, branch_id: null, created_by_id: null, product_type_id: null })
const activeMoreFilters = computed(() =>
  [filters.value.branch_id, filters.value.created_by_id, filters.value.product_type_id].filter(Boolean).length
)

const statusOpts = [
  { id: 'pending',  name: 'Pending' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
]

const defaultForm = () => ({
  branch_id:       null,
  date:            nowForDatePicker(),
  product_type_id: null,
  amount:          0,
  currency:        'USD',
  remark:          '',
})
const form = ref(defaultForm())

const modalProductOptions = computed(() => modalProducts.value)

const requiredFields = computed(() => {
  const fields = { Product: form.value.product_type_id, Amount: form.value.amount }
  if (!editing.value) fields.Branch = form.value.branch_id
  return fields
})

function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
function fmtCurrency(val, cur) {
  if (cur === 'KHR') return Number(val || 0).toLocaleString() + ' ៛'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val || 0)
}
function statusColor(s) {
  return { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600'
}

async function loadModalProducts(branchId = null, autoSelect = true) {
  if (!branchId) {
    modalProducts.value = []
    return
  }
  loadingModalProducts.value = true
  try {
    const res = await getProductTypes({ branch_id: branchId })
    modalProducts.value = res.data || []
    if (autoSelect && modalProducts.value.length === 1) {
      form.value.product_type_id = modalProducts.value[0].id
    }
  } catch {} finally { loadingModalProducts.value = false }
}

async function onFormBranchChange(branchId) {
  form.value.product_type_id = null
  await loadModalProducts(branchId)
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, sort_by: 'date', sort_dir: 'desc' }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.currency)       params.currency        = filters.value.currency
    if (filters.value.branch_id)      params.branch_id       = filters.value.branch_id
    if (filters.value.created_by_id)  params.created_by_id   = filters.value.created_by_id
    if (filters.value.product_type_id) params.product_type_id = filters.value.product_type_id
    const res = await getTurnoverBets(params)
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { loading.value = false }
}

const totalRecords  = computed(() => meta.value?.total_items ?? items.value.length)
const totalUSD      = computed(() => items.value.filter(i => i.currency === 'USD').reduce((s, i) => s + Number(i.amount || 0), 0))
const totalKHR      = computed(() => items.value.filter(i => i.currency === 'KHR').reduce((s, i) => s + Number(i.amount || 0), 0))
const totalApproved = computed(() => items.value.filter(i => i.status === 'approved').length)
const totalPending  = computed(() => items.value.filter(i => i.status === 'pending').length)
const totalRejected = computed(() => items.value.filter(i => i.status === 'rejected').length)

function resetFilters()    { filters.value = { date_from: '', date_to: '', status: null, currency: null, branch_id: null, created_by_id: null, product_type_id: null }; page.value = 1; load() }
function onPageSizeChange() { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }

async function openCreate() {
  editing.value = null
  form.value = defaultForm()
  modalProducts.value = []
  if (branches.value.length === 1) {
    form.value.branch_id = branches.value[0].id
    await onFormBranchChange(form.value.branch_id)
  }
  modal.value = true
}

function handleCancel() {
  modal.value = false
  form.value.branch_id = null
  form.value.product_type_id = null
  modalProducts.value = []
}

async function openEdit(row) {
  editing.value = row
  form.value = {
    branch_id:       row.branch_id || null,
    date:            row.date || '',
    product_type_id: row.product_type_id,
    amount:          row.amount,
    currency:        row.currency,
    remark:          row.remark || '',
  }
  await loadModalProducts(row.branch_id, false)
  modal.value = true
}

async function handleSave() {
  if (!editing.value && !form.value.branch_id) { error('Please select a branch'); return }
  if (!form.value.product_type_id)             { error('Please select a product'); return }
  if (!form.value.amount || form.value.amount <= 0) { error('Amount must be greater than 0'); return }
  saving.value = true
  try {
    if (editing.value) {
      await updateTurnoverBet(editing.value.id, {
        date:            form.value.date,
        product_type_id: form.value.product_type_id,
        amount:          form.value.amount,
        currency:        form.value.currency,
        remark:          form.value.remark,
      })
      success('Updated')
    } else {
      await createTurnoverBet(form.value)
      success('Created')
    }
    modal.value = false
    load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }
async function doDelete() {
  try { await deleteTurnoverBet(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}
async function doApprove(row, status) {
  try { await approveTurnoverBet(row.id, { status }); success(`Turnover bet ${status}`); load() }
  catch (e) { error(e?.error || 'Failed') }
}

onMounted(async () => {
  lookup.loadAll()
  load()
  try {
    const bRes = await getBranches({ show_all: false })
    branches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, code: b.code, sub: b.code }))
  } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {}
})
</script>