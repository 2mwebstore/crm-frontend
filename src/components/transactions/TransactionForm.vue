<template>
  <form @submit.prevent="$emit('submit', form)" class="space-y-5">

    <!-- Transaction details -->
    <div class="card p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Transaction Details</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">
            Transaction No
            <span v-if="!isEdit" class="text-gray-400 font-normal text-xs ml-1">(auto if empty)</span>
          </label>
          <input v-model="form.transaction_no" class="input font-mono"
            :placeholder="isEdit ? '' : type === 'deposit' ? 'DEP-YYYYMMDD-XXXX' : 'WDR-YYYYMMDD-XXXX'"
            :readonly="isEdit && !canEditTransactionNo" :class="{ 'bg-gray-50 text-gray-500': isEdit && !canEditTransactionNo }" />
        </div>
        <div>
          <label class="label">Date <span class="text-red-500">*</span></label>
          <DatePicker v-model="form.date" placeholder="Select date & time…" />
        </div>
      </div>
    </div>

    <!-- Client linkage -->
    <div class="card p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Client Linkage</h2>
      <div class="grid grid-cols-2 gap-4">

        <!-- Branch slot — injected before Client -->
        <slot name="client-linkage-prepend" />

        <div class="col-span-2">
          <label class="label">Client <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.client_id"
            :options="clientOptions"
            :placeholder="branchId ? 'Search and select client…' : 'Select a branch first…'"
            :show-all="false"
            :disabled="isEdit || !branchId"
          />
          <p v-if="branchId && !clientOptions.length && !loadingClients" class="text-xs text-amber-600 mt-1">
            No clients found for this branch.
          </p>
        </div>

        <div>
          <label class="label">Product <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.client_product_id"
            :options="productOptions"
            :placeholder="form.client_id ? 'Select product…' : 'Select a client first…'"
            :show-all="false"
            :disabled="isEdit || !form.client_id"
          />
          <p v-if="form.client_id && !productOptions.length && !loadingClient" class="text-xs text-amber-600 mt-1">
            No products found. Add one in the client's Player section.
          </p>
        </div>

        <div>
          <label class="label">Client Bank <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.client_bank_id"
            :options="bankOptions"
            :placeholder="form.client_id ? 'Select bank…' : 'Select a client first…'"
            :show-all="false"
            :disabled="isEdit || !form.client_id"
          />
          <p v-if="form.client_id && !bankOptions.length && !loadingClient" class="text-xs text-amber-600 mt-1">
            No banks found. Add one in the client's Bank section.
          </p>
        </div>

        <div>
          <label class="label">Company Bank <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.company_bank_id"
            :options="companyBankOptions"
            :placeholder="branchId ? 'Select company bank…' : 'Select a branch first…'"
            :show-all="false"
            :disabled="!branchId"
          />
          <p v-if="branchId && !companyBankOptions.length && !loadingCompanyBanks" class="text-xs text-amber-600 mt-1">
            No company banks found for this branch.
          </p>
        </div>
      </div>
    </div>

    <!-- Amounts -->
    <div class="card p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Amounts</h2>
      <div class="grid grid-cols-2 gap-4">

        <div>
          <label class="label">Amount <span class="text-red-500">*</span></label>
          <input
            ref="amountInputEl"
            :value="amountDisplay"
            type="text"
            inputmode="decimal"
            class="input font-mono"
            placeholder="0.00"
            @input="onAmountInput"
            @focus="onAmountFocus"
          />
        </div>

        <div>
          <label class="label">Currency</label>
          <div class="input bg-gray-50 flex items-center gap-2 cursor-default select-none">
            <span v-if="selectedCompanyBankCurrency" class="font-mono font-semibold text-sm text-gray-700">
              {{ selectedCompanyBankCurrency }}
            </span>
            <span v-else class="text-gray-400 text-sm">Select a company bank first…</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Set automatically from the selected Company Bank</p>
        </div>

        <div>
          <label class="label">Bonus Option</label>
          <SearchableSelect
            v-model="form.bonus_option_id"
            :options="bonusOptions"
            :placeholder="branchId ? 'No bonus' : 'Select a branch first…'"
            :disabled="!branchId"
          />
        </div>

        <div>
          <label class="label">Bonus Amount <span class="text-xs text-gray-400 font-normal ml-1">(manual)</span></label>
          <input v-model.number="form.bonus_amount" type="number" step="0.01" class="input" @blur="form.bonus_amount = form.bonus_amount || 0" />
        </div>

        <div>
          <label class="label">Bal <span class="text-xs text-gray-400 font-normal ml-1">(Balance — manual)</span></label>
          <input v-model.number="form.bal" type="number" step="0.01" class="input" @blur="form.bal = form.bal || 0" />
        </div>

        <div>
          <label class="label">TO <span class="text-xs text-gray-400 font-normal ml-1">(Turnover — manual)</span></label>
          <input v-model.number="form.to" type="number" step="0.01" class="input" @blur="form.to = form.to || 0" />
        </div>

        <div>
          <label class="label">OS <span class="text-xs text-gray-400 font-normal ml-1">(Outstanding — manual)</span></label>
          <input v-model.number="form.os" type="number" step="0.01" class="input" @blur="form.os = form.os || 0" />
        </div>

        <div>
          <label class="label">Play <span class="text-xs text-gray-400 font-normal ml-1">(manual)</span></label>
          <input v-model.number="form.play" type="number" step="0.01" class="input" @blur="form.play = form.play || 0" />
        </div>

      </div>
    </div>

    <!-- Remark -->
    <div class="card p-5">
      <label class="label">Remark</label>
      <textarea v-model="form.remark" class="input resize-none" rows="2" placeholder="Optional notes..." />
    </div>

    <div class="flex justify-end gap-3 pb-4">
      <slot name="actions" />
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useLookupStore } from '@/stores/lookup'
import { useAuthStore } from '@/stores/auth'
import { getClients, getClient } from '@/api/clients'
import { getBonusOptions, getCompanyBanks } from '@/api/lookup'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
const props = defineProps({
  modelValue:         { type: Object, required: true },
  type:               { type: String, default: 'deposit' },
  isEdit:             { type: Boolean, default: false },
  branchId:           { type: [Number, String], default: null },
  initialProduct:     { type: Object, default: null },
  initialBank:        { type: Object, default: null },
  initialCompanyBank: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const lookup = useLookupStore()
const auth   = useAuthStore()

// Transaction No stays locked in edit mode by default, unless the user is a
// super admin or has the {type}s.edit permission (e.g. "deposits.edit" /
// "withdrawals.edit").
const canEditTransactionNo = computed(() => auth.isSuperAdmin || auth.can(`${props.type}s.edit`))
const clients          = ref([])
const clientBanks      = ref([])
const clientProducts   = ref([])
const companyBanks        = ref([])
const bonusOptionsList    = ref([])
const loadingClient       = ref(false)
const loadingClients      = ref(false)
const loadingCompanyBanks = ref(false)
const loadingBonusOptions = ref(false)

const form = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const clientOptions = computed(() =>
  clients.value.map(c => ({ id: c.id, name: c.name, sub: c.code }))
)

const productOptions = computed(() => {
  const list = clientProducts.value.length > 0
    ? clientProducts.value
    : (props.initialProduct ? [props.initialProduct] : [])
  return list.map(p => ({ id: p.id, name: p.product_type?.name || 'Product', sub: p.account_id || '' }))
})

const bankOptions = computed(() => {
  const list = clientBanks.value.length > 0
    ? clientBanks.value
    : (props.initialBank ? [props.initialBank] : [])
  return list.map(b => ({
    id: b.id,
    name: b.bank_type?.name || 'Bank',
    sub: b.account_no + (b.account_name ? ` (${b.account_name})` : '')
  }))
})

const companyBankOptions = computed(() => {
  const list = companyBanks.value.length > 0
    ? companyBanks.value
    : (props.initialCompanyBank ? [props.initialCompanyBank] : [])
  return list.map(cb => ({
    id: cb.id,
    name: `${cb.account_name}${cb.bank_type?.name ? ' — ' + cb.bank_type.name : ''}`,
    sub: cb.account_number + (cb.currency_type?.code ? ` · ${cb.currency_type.code}` : ''),
  }))
})

// Currency is no longer picked manually — it's derived from whichever
// company bank is currently selected (each company bank account has its
// own fixed currency), and kept in sync via the watcher below.
const selectedCompanyBank = computed(() => {
  const list = companyBanks.value.length > 0 ? companyBanks.value : (props.initialCompanyBank ? [props.initialCompanyBank] : [])
  return list.find(cb => cb.id === form.value.company_bank_id) || null
})
const selectedCompanyBankCurrency = computed(() => selectedCompanyBank.value?.currency_type?.code || '')

// Live-formatted Amount input, with the cursor kept in the right place as
// you type — not just formatted on blur.
//
// amountRaw is the actual source of truth: a plain digit/decimal-point
// string (e.g. "1234.5"). form.amount is kept in sync with it on every
// keystroke. We can't use form.amount itself as the source of truth for
// display, because a real Number can't represent an in-progress value like
// "12." (trailing dot) or "12.50" (trailing zero) — it would collapse to
// 12, losing exactly what the user just typed.
const amountInputEl = ref(null)
const amountRaw = ref(form.value.amount ? String(form.value.amount) : '')

const amountDisplay = computed(() => {
  if (amountRaw.value === '') return ''
  const [intPart, decPart] = amountRaw.value.split('.')
  const formattedInt = intPart === '' ? '0' : Number(intPart).toLocaleString('en-US')
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
})

// Counts digit characters in str before index `pos` — used to find "how
// many digits has the user typed up to the cursor", which stays meaningful
// even after we reformat the string with commas.
function countDigitsBefore(str, pos) {
  let count = 0
  for (let i = 0; i < pos && i < str.length; i++) {
    if (str[i] >= '0' && str[i] <= '9') count++
  }
  return count
}
// Inverse: finds the index in `str` right after the Nth digit character —
// i.e. where the cursor should land so it stays after the same digits the
// user was originally positioned after, even though commas shifted things.
function positionAfterNDigits(str, n) {
  if (n <= 0) return 0
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= '0' && str[i] <= '9') {
      count++
      if (count === n) return i + 1
    }
  }
  return str.length
}

async function onAmountInput(e) {
  const rawInput = e.target.value
  const cursorPos = e.target.selectionStart ?? rawInput.length
  const digitsBeforeCursor = countDigitsBefore(rawInput, cursorPos)

  // Sanitize: strip everything except digits and a single decimal point,
  // cap to 2 decimal places.
  let s = rawInput.replace(/[^0-9.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
    const [intPart, decPart] = s.split('.')
    s = intPart + '.' + decPart.slice(0, 2)
  }
  amountRaw.value = s
  form.value.amount = (s === '' || s === '.') ? 0 : Number(s)

  // Wait for Vue to re-render the input with the newly formatted value,
  // then move the cursor back to sit after the same digits the user just
  // typed (rather than wherever it lands by default, usually the end).
  await nextTick()
  if (amountInputEl.value) {
    const newPos = positionAfterNDigits(amountDisplay.value, digitsBeforeCursor)
    amountInputEl.value.setSelectionRange(newPos, newPos)
  }
}

function onAmountFocus(e) { e.target.select() }

// Keep amountRaw in sync with external changes to form.amount (e.g. the
// parent view replacing the whole form object on edit-mode load) — skip it
// when the new value matches what we just wrote ourselves, so typing isn't
// disrupted by our own updates echoing back.
watch(() => form.value.amount, (val) => {
  const current = amountRaw.value === '' ? 0 : Number(amountRaw.value)
  if (val !== current) {
    amountRaw.value = val ? String(val) : ''
  }
})

async function loadCompanyBanks(branchId = null) {
  if (!branchId) {
    companyBanks.value = []
    return
  }
  loadingCompanyBanks.value = true
  try {
    const res = await getCompanyBanks({ branch_id: branchId, show_all: false })
    companyBanks.value = res.data || []
    if (!props.isEdit && companyBanks.value.length === 1) {
      form.value.company_bank_id = companyBanks.value[0].id
    }
  } catch {} finally { loadingCompanyBanks.value = false }
}

const bonusOptions = computed(() => bonusOptionsList.value)

async function loadBonusOptions(branchId = null) {
  if (!branchId) {
    bonusOptionsList.value = []
    return
  }
  loadingBonusOptions.value = true
  try {
    const res = await getBonusOptions({ branch_id: branchId })
    bonusOptionsList.value = res.data || []
  } catch {} finally { loadingBonusOptions.value = false }
}

async function loadClients(branchId = null) {
  if (!branchId) {
    clients.value = []
    return
  }
  loadingClients.value = true
  try {
    const res = await getClients({ page: 1, page_size: 500, is_active: true, branch_id: branchId })
    clients.value = res.data || []
    if (!props.isEdit && clients.value.length === 1) {
      form.value.client_id = clients.value[0].id
    }
  } catch {} finally { loadingClients.value = false }
}

async function loadClientData(clientId, resetSelections = true) {
  if (!clientId) return
  loadingClient.value = true
  try {
    const res = await getClient(clientId)
    const c = res.data
    clientBanks.value    = (c.banks    || []).filter(b => b.is_active)
    clientProducts.value = (c.products || []).filter(p => p.is_active)
    if (resetSelections) {
      form.value.client_bank_id    = clientBanks.value.length    === 1 ? clientBanks.value[0].id    : null
      form.value.client_product_id = clientProducts.value.length === 1 ? clientProducts.value[0].id : null
    }
  } catch {} finally { loadingClient.value = false }
}

watch(() => form.value.client_id, async (cid) => {
  if (props.isEdit) return
  form.value.client_bank_id    = null
  form.value.client_product_id = null
  clientBanks.value    = []
  clientProducts.value = []
  if (cid) await loadClientData(cid, true)
})

// Currency always mirrors the selected company bank's own currency — it's
// no longer a manual choice. Fires on both explicit user selection and the
// initial edit-mode/auto-select population of company_bank_id.
watch(selectedCompanyBankCurrency, (cur) => {
  if (cur) form.value.currency = cur
})

// Clear selections that belonged to the previous branch, then refetch the
// client list, company banks, and bonus options scoped to the new branch —
// in that order, so any single-result auto-select from the loaders below
// doesn't get immediately wiped out by the reset. Skipped while editing so
// we don't clobber the record's existing selections on initial load.
watch(() => props.branchId, async (bid) => {
  if (!props.isEdit) {
    form.value.client_id         = null
    form.value.client_bank_id    = null
    form.value.client_product_id = null
    form.value.company_bank_id   = null
    form.value.bonus_option_id   = null
    form.value.currency          = ''
    clientBanks.value    = []
    clientProducts.value = []
  }
  await Promise.all([loadClients(bid), loadCompanyBanks(bid), loadBonusOptions(bid)])
})

onMounted(async () => {
  await lookup.loadAll()
  await Promise.all([loadClients(props.branchId), loadCompanyBanks(props.branchId), loadBonusOptions(props.branchId)])
  if (props.isEdit && form.value.client_id) await loadClientData(form.value.client_id, false)
})
</script>