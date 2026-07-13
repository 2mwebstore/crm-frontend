<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Deposits</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage client deposit transactions</p>
      </div>
      <RouterLink to="/deposits/create" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Deposit
      </RouterLink>
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
      <input v-model="filters.search" @input="debouncedLoad" type="text" class="input w-52" placeholder="Transaction no, client…" />
      <div><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <!-- <input v-model="filters.date_from" @change="load" type="date" class="input w-36" />
      <span class="self-center text-gray-400 text-sm">to</span>
      <input v-model="filters.date_to" @change="load" type="date" class="input w-36" /> -->
      <SearchableSelect v-model="filters.status" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="load" />
      <SearchableSelect v-model="filters.currency" :options="[{id:'USD',name:'USD'},{id:'KHR',name:'KHR'}]" value-key="id" label-key="name" placeholder="All currencies" all-label="All currencies" class="w-36" @update:modelValue="load" />
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-sm flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" />
        More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- More Filters Panel -->
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Client</label>
        <SearchableSelect v-model="filters.client_id" :options="clients" placeholder="All clients" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Company Bank</label>
        <SearchableSelect v-model="filters.bank_type_id" :options="bankTypes" placeholder="All company banks" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Product</label>
        <SearchableSelect v-model="filters.product_type_id" :options="products" placeholder="All products" @update:modelValue="load" />
      </div>
    </div>

    <!-- Today's Deposits banner (mobile only) -->
    <div class="sm:hidden rounded-xl p-5 text-white" style="background:#22C55E">
      <div class="flex items-center justify-between text-sm font-medium">
        <span class="flex items-center gap-1.5"><ArrowDownTrayIcon class="w-4 h-4" /> Today's Deposits — {{ todayLabel }}</span>
        <span class="text-xs text-white/80">{{ todayDeposit.count }} TRANSACTIONS</span>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-4">
        <div class="bg-white/15 rounded-lg p-2.5">
          <p class="text-xs text-white/70 uppercase tracking-wide">Deposit USD</p>
          <p class="font-bold mt-0.5">{{ fmtCurrency(todayDeposit.usd, 'USD') }}</p>
        </div>
        <div class="bg-white/15 rounded-lg p-2.5">
          <p class="text-xs text-white/70 uppercase tracking-wide">Deposit KHR</p>
          <p class="font-bold mt-0.5">{{ fmtCurrency(todayDeposit.khr, 'KHR') }}</p>
        </div>
        <div class="bg-white/15 rounded-lg p-2.5">
          <p class="text-xs text-white/70 uppercase tracking-wide">Bonus USD</p>
          <p class="font-bold mt-0.5">+{{ fmtCurrency(todayDeposit.bonusUsd, 'USD') }}</p>
        </div>
        <div class="bg-white/15 rounded-lg p-2.5">
          <p class="text-xs text-white/70 uppercase tracking-wide">Bonus KHR</p>
          <p class="font-bold mt-0.5">+{{ fmtCurrency(todayDeposit.bonusKhr, 'KHR') }}</p>
        </div>
      </div>
    </div>

    <!-- Table (desktop) -->
    <div class="hidden sm:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Date</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Client</th>
              <th class="table-header">Client Bank</th>
              <th class="table-header">Account Id</th>
              <th class="table-header">Company Bank</th>
              <th class="table-header">Amount</th>
              <th class="table-header">Bonus Option</th>
              <th class="table-header">Bonus</th>
              <th class="table-header">Status</th>
              <th class="table-header">Approved Date</th>
              <th class="table-header">Approved By</th>
              <th class="table-header">Remark</th>
              <th class="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="18" class="table-cell text-center py-10">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="18" class="table-cell text-center py-10 text-gray-400">No deposits found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (currentPage - 1) * currentPageSize + idx + 1 }}</td>
              <td class="table-cell text-sm text-gray-700 whitespace-nowrap">{{ fmtDate(row.date) }}</td>
              <td class="table-cell text-sm text-gray-700  whitespace-nowrap">{{ row.created_by?.name || '—' }}</td>
              <td class="table-cell">
                <p class="font-medium text-gray-800 text-sm whitespace-nowrap">{{ row.client?.name || '—' }}</p>
                <p class="text-xs text-gray-400 font-mono  whitespace-nowrap">{{ row.client?.code }}</p>
              </td>
              <td class="table-cell">
                <p class="text-sm text-gray-700  whitespace-nowrap">{{ row.client_bank?.bank_type?.name || '—' }}</p>
                <p class="text-xs text-gray-400 font-mono  whitespace-nowrap">{{ row.client_bank?.account_no }}</p>
              </td>
              <td class="table-cell"><span class="font-mono text-xs text-gray-600  whitespace-nowrap">{{ row.client_product?.account_id || '—' }}</span></td>
              <td class="table-cell text-sm text-gray-700  whitespace-nowrap">{{ row.company_bank?.account_name || '—' }}</td>
              <td class="table-cell">
                <span class="font-semibold text-gray-800 whitespace-nowrap">{{ fmtCurrency(row.amount, row.currency) }}</span>
              </td>
              <td class="table-cell text-sm text-gray-600  whitespace-nowrap">{{ row.bonus_option?.name || '—' }}</td>
              <td class="table-cell">
                <span v-if="row.bonus_amount > 0" class="text-green-600 font-medium text-sm whitespace-nowrap">+{{ fmtCurrency(row.bonus_amount, row.currency) }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell"><span :class="['badge', statusColor(row.status)]">{{ row.status }}</span></td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.approved_at) }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ row.approved_by?.name || '—' }}</td>
              <td class="table-cell max-w-40"><p class="text-xs text-gray-600 truncate">{{ row.remark || '—' }}</p></td>
              <td class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink :to="`/deposits/${row.id}`" class="btn-icon bg-gray-100" title="View"><EyeIcon class="w-4 h-4" /></RouterLink>
                  <RouterLink :to="`/deposits/${row.id}/edit`" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></RouterLink>
                  <button v-if="row.status === 'pending'" @click="doApprove(row, 'approved')" class="btn-icon bg-green-50 text-green-600" title="Approve"><CheckCircleIcon class="w-4 h-4" /></button>
                  <button v-if="row.status === 'pending'" @click="doApprove(row, 'rejected')" class="btn-icon bg-red-50 text-red-500" title="Reject"><XCircleIcon class="w-4 h-4" /></button>
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

    <!-- Card list (mobile) — Edit/View link to the existing full pages -->
    <div class="sm:hidden space-y-3">
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-400 text-sm">No deposits found</div>
      <div
        v-for="row in items"
        :key="row.id"
        class="card p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
            <ArrowDownTrayIcon class="w-5 h-5 text-green-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate">{{ row.client?.name || '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5 truncate">{{ row.client?.code }} <span v-if="row.company_bank">· {{ row.company_bank.account_name }}</span></p>
            <p class="text-xs text-gray-400 mt-0.5">{{ fmtDate(row.date) }}</p>
          </div>
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span class="font-bold whitespace-nowrap" style="color:#938af4">{{ fmtCurrency(row.amount, row.currency) }}</span>
            <span :class="['badge text-xs', statusColor(row.status)]">{{ row.status }}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
          <RouterLink :to="`/deposits/${row.id}`" class="btn-icon bg-gray-100" title="View"><EyeIcon class="w-4 h-4" /></RouterLink>
          <RouterLink :to="`/deposits/${row.id}/edit`" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></RouterLink>
          <button v-if="row.status === 'pending'" @click="doApprove(row, 'approved')" class="btn-icon bg-green-50 text-green-600" title="Approve"><CheckCircleIcon class="w-4 h-4" /></button>
          <button v-if="row.status === 'pending'" @click="doApprove(row, 'rejected')" class="btn-icon bg-red-50 text-red-500" title="Reject"><XCircleIcon class="w-4 h-4" /></button>
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

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getDeposits, deleteDeposit, approveDeposit } from '@/api/transactions'
import { useToast } from '@/composables/useToast'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'
import { getClients } from '@/api/clients'
import { useLookupStore } from '@/stores/lookup'
import { nowForDatePicker } from '@/utils/datetime'


const { success, error } = useToast()
const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(10)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
let debounceTimer  = null
const showMoreFilters = ref(false)
const branches   = ref([])
const users      = ref([])
const clients    = ref([])
const bankTypes = ref([])
const products   = ref([])
const lookup     = useLookupStore()

// Mobile-only "Today's Deposits" banner. Fetched separately from the
// paginated/filtered `items` above (which is the current results page,
// not necessarily today's data), the same date_from/date_to params the
// desktop filters already use.
const today = nowForDatePicker().split(' ')[0]
const todayLabel = computed(() => {
  const [y, m, d] = today.split('-')
  return `${d}/${m}/${y}`
})
const todayDeposit = ref({ usd: 0, khr: 0, bonusUsd: 0, bonusKhr: 0, count: 0 })
async function loadTodayDeposit() {
  try {
    const res = await getDeposits({ date_from: today, date_to: today, page: 1, page_size: 1000, status: 'approved' })
    const rows = res.data || []
    todayDeposit.value = {
      usd: rows.filter(r => r.currency === 'USD').reduce((s, r) => s + Number(r.amount || 0), 0),
      khr: rows.filter(r => r.currency === 'KHR').reduce((s, r) => s + Number(r.amount || 0), 0),
      bonusUsd: rows.filter(r => r.currency === 'USD').reduce((s, r) => s + Number(r.bonus_amount || 0), 0),
      bonusKhr: rows.filter(r => r.currency === 'KHR').reduce((s, r) => s + Number(r.bonus_amount || 0), 0),
      count: res.meta?.total_items ?? rows.length,
    }
  } catch { }
}

const currentPage     = computed(() => page.value)
const currentPageSize = computed(() => pageSize.value)

const filters    = ref({ search: '', date_from: '', date_to: '', status: null, currency: null, branch_id: null, created_by_id: null, client_id: null, bank_type_id: null, product_type_id: null })
const statusOpts = [{ id: 'pending', name: 'Pending' }, { id: 'approved', name: 'Approved' }, { id: 'rejected', name: 'Rejected' }]

const totalRecords  = computed(() => meta.value?.total_items ?? items.value.length)
const totalUSD      = computed(() => items.value.filter(i => i.currency === 'USD').reduce((sum, i) => sum + Number(i.amount || 0), 0))
const totalKHR      = computed(() => items.value.filter(i => i.currency === 'KHR').reduce((sum, i) => sum + Number(i.amount || 0), 0))
const totalApproved = computed(() => items.value.filter(i => i.status === 'approved').length)
const totalPending  = computed(() => items.value.filter(i => i.status === 'pending').length)
const totalRejected = computed(() => items.value.filter(i => i.status === 'rejected').length)

const activeMoreFilters = computed(() =>
  [filters.value.branch_id, filters.value.created_by_id, filters.value.client_id,
   filters.value.client_bank_id, filters.value.product_type_id].filter(Boolean).length
)

function statusColor(s) {
  return { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600'
}
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
function fmtCurrency(val, cur) {
  if (cur === 'KHR') return Number(val || 0).toLocaleString() + ' ៛'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val || 0)
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, sort_by: 'date', sort_dir: 'desc' }
    if (filters.value.search)    params.search    = filters.value.search
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.currency)       params.currency        = filters.value.currency
    if (filters.value.branch_id)      params.branch_id       = filters.value.branch_id
    if (filters.value.created_by_id)  params.created_by_id   = filters.value.created_by_id
    if (filters.value.client_id)      params.client_id       = filters.value.client_id
    if (filters.value.bank_type_id)   params.bank_type_id    = filters.value.bank_type_id
    if (filters.value.product_type_id) params.product_type_id = filters.value.product_type_id
    const res = await getDeposits(params)
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { loading.value = false }
}

function debouncedLoad()   { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
function onPageSizeChange() { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function resetFilters()     { filters.value = { search: '', date_from: '', date_to: '', status: null, currency: null, branch_id: null, created_by_id: null, client_id: null, bank_type_id: null, product_type_id: null }; page.value = 1; load() }
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }
async function doDelete() {
  try { await deleteDeposit(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}
async function doApprove(row, status) {
  try { await approveDeposit(row.id, { status }); success(`Deposit ${status}`); load() }
  catch (e) { error(e?.error || 'Failed') }
}

onMounted(async () => {
  load()
  loadTodayDeposit()
  lookup.loadAll()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {}
  try { const r = await getClients({ page:1, page_size:500 }); clients.value = (r.data||[]).map(c=>({id:c.id,name:c.name,sub:c.code})) } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {}
  // users and banks loaded from lookup store after loadAll
  setTimeout(() => {
    products.value = lookup.productTypes.map(p=>({id:p.id,name:p.name}))
    bankTypes.value = lookup.bankTypes.map(b=>({id:b.id,name:b.name,sub:b.code}))
  }, 500)
})
</script>