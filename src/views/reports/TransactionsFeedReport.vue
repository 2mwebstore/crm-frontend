<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label class="label">Date Range</label>
        <DateRangePicker
          :model-value="[dateFrom, dateTo]"
          @update:model-value="v => { dateFrom = v[0]; dateTo = v[1]; applyFilters() }"
        />
      </div>
      <div class="w-36">
        <label class="label">Status</label>
        <SearchableSelect v-model="status" :options="statusOpts" value-key="id" label-key="name" placeholder="All" all-label="All" @update:modelValue="applyFilters" />
      </div>
      <div class="w-36">
        <label class="label">Currency</label>
        <SearchableSelect v-model="currency" :options="currencyOpts" value-key="id" label-key="name" placeholder="All" all-label="All" @update:modelValue="applyFilters" />
      </div>
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-lg self-end flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" /> More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-lg self-end">Reset</button>
    </div>
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="branchId" :options="branches" placeholder="All branches" @update:modelValue="onBranchChange" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="createdById" :options="users" placeholder="All users" @update:modelValue="applyFilters" />
      </div>
      <div>
        <label class="label text-xs">Client</label>
        <SearchableSelect v-model="clientId" :options="clientOptions" placeholder="All clients" @update:modelValue="applyFilters" />
      </div>
      <div>
        <label class="label text-xs">Product</label>
        <SearchableSelect v-model="productTypeId" :options="lookup.productTypes" placeholder="All products" @update:modelValue="applyFilters" />
      </div>
      <div>
        <label class="label text-xs">Approved By</label>
        <SearchableSelect v-model="approvedById" :options="approvedByUsers" placeholder="All" @update:modelValue="applyFilters" />
      </div>
      <div>
        <label class="label text-xs">Company Bank</label>
        <SearchableSelect v-model="companyBankId" :options="companyBankOptions" placeholder="All company banks" @update:modelValue="applyFilters" />
      </div>
    </div>

    <!-- Bank Summary table -->
    <div class="card overflow-hidden">
      <div class="px-4 pt-4">
        <h2 class="text-sm font-semibold text-gray-700">Bank Summary</h2>
      </div>
      <div class="overflow-x-auto mt-2">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th rowspan="2" class="table-header align-bottom">Bank</th>
              <th colspan="2" class="table-header text-center border-l border-gray-100">Deposit</th>
              <th colspan="2" class="table-header text-center border-l border-gray-100">Withdrawal</th>
              <th colspan="2" class="table-header text-center border-l border-gray-100">Total</th>
              <th colspan="2" class="table-header text-center border-l border-gray-100">Bonus</th>
            </tr>
            <tr>
              <th class="table-header text-right border-l border-gray-100">USD</th>
              <th class="table-header text-right">KHR</th>
              <th class="table-header text-right border-l border-gray-100">USD</th>
              <th class="table-header text-right">KHR</th>
              <th class="table-header text-right border-l border-gray-100">USD</th>
              <th class="table-header text-right">KHR</th>
              <th class="table-header text-right border-l border-gray-100">USD</th>
              <th class="table-header text-right">KHR</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="summaryLoading">
              <td colspan="9" class="table-cell text-center py-8">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!summaryRows.length">
              <td colspan="9" class="table-cell text-center py-8 text-gray-400">No data for this filter</td>
            </tr>
            <tr v-else v-for="row in summaryRows" :key="row.bank" class="hover:bg-gray-50/60">
              <td class="table-cell font-medium text-gray-800">{{ row.bank }}</td>
              <td class="table-cell text-right font-mono border-l border-gray-50">{{ usd(row.deposit.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(row.deposit.khr) }}</td>
              <td class="table-cell text-right font-mono border-l border-gray-50">{{ usd(row.withdrawal.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(row.withdrawal.khr) }}</td>
              <td class="table-cell text-right font-mono border-l border-gray-50">{{ usd(row.total.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(row.total.khr) }}</td>
              <td class="table-cell text-right font-mono border-l border-gray-50">{{ usd(row.bonus.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(row.bonus.khr) }}</td>
            </tr>
            <tr v-if="grandTotal" class="font-semibold bg-gray-50 border-t-2 border-gray-200">
              <td class="table-cell text-gray-800">Grand Total</td>
              <td class="table-cell text-right font-mono border-l border-gray-100">{{ usd(grandTotal.deposit.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(grandTotal.deposit.khr) }}</td>
              <td class="table-cell text-right font-mono border-l border-gray-100">{{ usd(grandTotal.withdrawal.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(grandTotal.withdrawal.khr) }}</td>
              <td class="table-cell border-l border-gray-100"></td>
              <td class="table-cell"></td>
              <td class="table-cell text-right font-mono border-l border-gray-100">{{ usd(grandTotal.bonus.usd) }}</td>
              <td class="table-cell text-right font-mono">{{ khr(grandTotal.bonus.khr) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Overall total mini-block -->
    <div v-if="overallTotal" class="inline-block card overflow-hidden">
      <table class="text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="table-header">Total</th>
            <th class="table-header text-right">USD</th>
            <th class="table-header text-right">KHR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="table-cell"></td>
            <td class="table-cell text-right font-mono font-semibold">{{ usd(overallTotal.usd) }}</td>
            <td class="table-cell text-right font-mono font-semibold">{{ khr(overallTotal.khr) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transactions feed -->
    <div class="card overflow-hidden">
      <div class="px-4 pt-4">
        <h2 class="text-sm font-semibold text-gray-700">Transactions</h2>
      </div>
      <div class="overflow-x-auto mt-2">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Type</th>
              <th class="table-header">Transaction No</th>
              <th class="table-header">Date</th>
              <th class="table-header">Client</th>
              <th class="table-header">Product</th>
              <th class="table-header">Account ID</th>
              <th class="table-header">Company Bank</th>
              <th class="table-header text-right">Amount</th>
              <th class="table-header">Currency</th>
              <th class="table-header">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="txLoading">
              <td colspan="11" class="table-cell text-center py-10">
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
              <td colspan="11" class="table-cell text-center py-10 text-gray-400">No transactions found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="`${row.type}-${row.id}`" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ (page - 1) * pageSize + idx + 1 }}</td>
              <td class="table-cell">
                <span :class="['badge', row.type === 'withdrawal' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700']">
                  {{ row.type === 'withdrawal' ? 'Withdrawal' : 'Deposit' }}
                </span>
              </td>
              <td class="table-cell font-mono text-xs">{{ row.transaction_no || '—' }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.date) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.client?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.client_product?.product_type?.name || '—' }}</td>
              <td class="table-cell font-mono text-xs text-gray-600">{{ row.client_product?.account_id || '—' }}</td>
              <td class="table-cell text-sm text-gray-700">
                {{ row.company_bank?.account_name || '—' }}<span v-if="row.company_bank?.bank_type?.name" class="text-gray-400"> ({{ row.company_bank.bank_type.name }})</span>
              </td>
              <td class="table-cell text-right font-mono text-sm" :class="row.type === 'withdrawal' ? 'text-orange-600' : 'text-emerald-600'">
                {{ row.type === 'withdrawal' ? '-' : '+' }}{{ Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </td>
              <td class="table-cell text-xs font-mono text-gray-500">{{ row.currency }}</td>
              <td class="table-cell">
                <span :class="['badge', statusClass(row.status)]">{{ row.status || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span>Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, meta.total_items) }} of {{ meta.total_items }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" @click="goPage(page - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ page }} / {{ meta.total_pages }}</span>
          <button :disabled="page >= meta.total_pages" @click="goPage(page + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import { getAllTransactions } from '@/api/reports'
import { getBranches } from '@/api/branches'
import { getClients } from '@/api/clients'
import { getCompanyBanks, getBankTypes } from '@/api/lookup'
import { getUsersInScope } from '@/api/users'
import { useLookupStore } from '@/stores/lookup'

const lookup = useLookupStore()

// ── Shared filter state ───────────────────────────────────────────────────
const branches = ref([])
const clients = ref([])
const companyBanks = ref([])
const users = ref([])
const approvedByUsers = ref([])
const showMoreFilters = ref(false)

const branchId       = ref(null)
const clientId       = ref(null)
const productTypeId  = ref(null)
const companyBankId  = ref(null)
const createdById    = ref(null)
const approvedById   = ref(null)
const status         = ref(null)
const currency       = ref(null)

const statusOpts   = [{ id: 'pending', name: 'Pending' }, { id: 'approved', name: 'Approved' }, { id: 'rejected', name: 'Rejected' }]
const currencyOpts  = [{ id: 'USD', name: 'USD' }, { id: 'KHR', name: 'KHR' }]

const activeMoreFilters = computed(() =>
  [branchId.value, createdById.value, clientId.value, productTypeId.value, approvedById.value, companyBankId.value].filter(Boolean).length
)

function monthStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function monthEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }

const dateFrom = ref(monthStart())
const dateTo   = ref(monthEnd())

const clientOptions = computed(() => clients.value.map(c => ({ id: c.id, name: c.name, sub: c.code })))
const companyBankOptions = computed(() =>
  companyBanks.value.map(cb => ({ id: cb.id, name: `${cb.account_name}${cb.bank_type?.name ? ' — ' + cb.bank_type.name : ''}`, sub: cb.account_number }))
)

function buildParams(extra = {}) {
  const params = { ...extra }
  if (branchId.value)       params.branch_id = branchId.value
  if (clientId.value)       params.client_id = clientId.value
  if (productTypeId.value)  params.product_type_id = productTypeId.value
  if (companyBankId.value)  params.company_bank_id = companyBankId.value
  if (createdById.value)    params.created_by_id = createdById.value
  if (approvedById.value)   params.approved_by_id = approvedById.value
  if (status.value)         params.status = status.value
  if (currency.value)       params.currency = currency.value
  if (dateFrom.value)       params.date_from = dateFrom.value
  if (dateTo.value)         params.date_to = dateTo.value
  return params
}

async function onBranchChange(bid) {
  clientId.value = null
  companyBankId.value = null
  clients.value = []
  companyBanks.value = []
  try { const r = await getClients({ page: 1, page_size: 500, is_active: true, branch_id: bid || undefined }); clients.value = r.data || [] } catch {}
  try { const r = await getCompanyBanks({ branch_id: bid || undefined, show_all: false }); companyBanks.value = r.data || [] } catch {}
  applyFilters()
}

function resetFilters() {
  branchId.value = null
  clientId.value = null
  productTypeId.value = null
  companyBankId.value = null
  createdById.value = null
  approvedById.value = null
  status.value = null
  currency.value = null
  dateFrom.value = monthStart()
  dateTo.value = monthEnd()
  applyFilters()
}

// ── Bank Summary section ─────────────────────────────────────────────────
const summaryLoading = ref(false)
const summaryRows    = ref([])
const grandTotal     = ref(null)
const overallTotal   = ref(null)

function usd(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function khr(v) { return `${Number(v || 0).toLocaleString()}៛` }

function round(v) { return Math.round((v + Number.EPSILON) * 100) / 100 }

// Computes the Bank Summary directly from the SAME transaction records
// shown in the feed below — rather than trusting a separate backend
// aggregation endpoint that could disagree with what's actually displayed.
// Fetches every matching transaction (no pagination) plus the full list of
// configured bank types (so every bank shows a row, even at $0.00, exactly
// like the paginated feed's own filters/scope), then groups + sums in JS.
async function loadSummary() {
  summaryLoading.value = true
  try {
    const [txRes, btRes] = await Promise.all([
      getAllTransactions(buildParams({ page: 1, page_size: 100000 })),
      getBankTypes({ show_all: true }).catch(() => ({ data: [] })),
    ])
    const allItems  = txRes.data || []
    const bankTypes = btRes.data || []

    const rowsMap = {}
    const order = []
    function getRow(label) {
      if (!rowsMap[label]) {
        rowsMap[label] = {
          bank: label,
          deposit: { usd: 0, khr: 0 },
          withdrawal: { usd: 0, khr: 0 },
          total: { usd: 0, khr: 0 },
          bonus: { usd: 0, khr: 0 },
        }
        order.push(label)
      }
      return rowsMap[label]
    }

    // Pre-seed every configured bank type so it always shows a row, even
    // with zero activity in the current filter window.
    bankTypes.forEach(bt => {
      const label = bt.code || bt.name
      if (label) getRow(label)
    })

    allItems.forEach(row => {
      const label = row.company_bank?.bank_type?.code
        || row.company_bank?.bank_type?.name
        || 'Unknown'
      const r = getRow(label)
      const cur = row.currency === 'KHR' ? 'khr' : 'usd'
      const amt   = Number(row.amount || 0)
      const bonus = Number(row.bonus_amount || 0)
      if (row.type === 'withdrawal') {
        r.withdrawal[cur] += amt
      } else {
        r.deposit[cur] += amt
      }
      r.bonus[cur] += bonus
    })

    order.sort()
    const grand = { deposit: { usd: 0, khr: 0 }, withdrawal: { usd: 0, khr: 0 }, bonus: { usd: 0, khr: 0 } }
    const rows = order.map(label => {
      const r = rowsMap[label]
      r.total.usd = round(r.deposit.usd - r.withdrawal.usd)
      r.total.khr = round(r.deposit.khr - r.withdrawal.khr)
      r.deposit.usd    = round(r.deposit.usd);    r.deposit.khr    = round(r.deposit.khr)
      r.withdrawal.usd = round(r.withdrawal.usd); r.withdrawal.khr = round(r.withdrawal.khr)
      r.bonus.usd      = round(r.bonus.usd);      r.bonus.khr      = round(r.bonus.khr)
      grand.deposit.usd    += r.deposit.usd;    grand.deposit.khr    += r.deposit.khr
      grand.withdrawal.usd += r.withdrawal.usd; grand.withdrawal.khr += r.withdrawal.khr
      grand.bonus.usd      += r.bonus.usd;      grand.bonus.khr      += r.bonus.khr
      return r
    })
    grand.deposit.usd    = round(grand.deposit.usd);    grand.deposit.khr    = round(grand.deposit.khr)
    grand.withdrawal.usd = round(grand.withdrawal.usd); grand.withdrawal.khr = round(grand.withdrawal.khr)
    grand.bonus.usd      = round(grand.bonus.usd);      grand.bonus.khr      = round(grand.bonus.khr)
    grand.total = {
      usd: round(grand.deposit.usd - grand.withdrawal.usd),
      khr: round(grand.deposit.khr - grand.withdrawal.khr),
    }

    summaryRows.value  = rows
    grandTotal.value   = grand
    overallTotal.value = grand.total
  } catch {} finally { summaryLoading.value = false }
}

// ── Transactions feed section ────────────────────────────────────────────
const txLoading = ref(false)
const items     = ref([])
const meta      = ref(null)
const page      = ref(1)
const pageSize  = ref(20)

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') +
    ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function statusClass(s) {
  if (s === 'approved') return 'bg-green-100 text-green-700'
  if (s === 'rejected') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

async function loadTransactions() {
  txLoading.value = true
  try {
    const res = await getAllTransactions(buildParams({ page: page.value, page_size: pageSize.value }))
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { txLoading.value = false }
}

function goPage(p)          { page.value = p; loadTransactions() }
function onPageSizeChange() { page.value = 1; loadTransactions() }

// ── Shared Apply — reloads both sections together ────────────────────────
function applyFilters() {
  page.value = 1
  loadSummary()
  loadTransactions()
}

onMounted(async () => {
  applyFilters()
  lookup.loadAll()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code })) } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email })) } catch {}
  try { const r = await getClients({ page: 1, page_size: 500 }); clients.value = r.data || [] } catch {}
  try { const r = await getUsersInScope(); approvedByUsers.value = (r.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email })) } catch {}
  try { const r = await getCompanyBanks({ show_all: false }); companyBanks.value = r.data || [] } catch {}
})
</script>