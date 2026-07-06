<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div><label class="label">Date Range</label><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <div class="w-36"><label class="label">Status</label>
        <SearchableSelect v-model="filters.status" :options="statusOpts" value-key="id" label-key="name" placeholder="All" all-label="All" @update:modelValue="load" />
      </div>
      <div class="w-36"><label class="label">Currency</label>
        <SearchableSelect v-model="filters.currency" :options="currencyOpts" value-key="id" label-key="name" placeholder="All" all-label="All" @update:modelValue="load" />
      </div>
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-lg self-end flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" /> More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-lg self-end">Reset</button>
      <button @click="exportCSV" class="btn-primary btn-lg self-end flex items-center gap-1">
        <ArrowDownTrayIcon class="w-4 h-4" /> Export CSV
      </button>
    </div>
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 gap-3">
      <div><label class="label text-xs">Branch</label><SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Created By</label><SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Product</label><SearchableSelect v-model="filters.product_type_id" :options="lookup.productTypes" placeholder="All products" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Approved By</label><SearchableSelect v-model="filters.approved_by_id" :options="approvedByUsers" placeholder="All" @update:modelValue="load" /></div>
    </div>
    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Records</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ items.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Amount</p>
        <p class="text-base font-bold mt-1 text-indigo-600">${{ totalUSD }}</p>
        <p class="text-base font-bold mt-0.5 text-purple-600">៛{{ totalKHR }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Approved</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ items.filter(i=>i.status==='approved').length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Pending</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ items.filter(i=>i.status==='pending').length }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Created Date</th>
              <th class="table-header">Date</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Product</th>
              <th class="table-header">Amount</th>
              <th class="table-header">Currency</th>
              <th class="table-header">Status</th>
              <th class="table-header">Approved Date</th>
              <th class="table-header">Approved By</th>
              <th class="table-header">Remark</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="12" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="12" class="table-cell text-center py-10 text-gray-400">No records</td></tr>
            <tr v-else v-for="(row, i) in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ i+1 }}</td>
              <td class="table-cell text-sm whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
              <td class="table-cell text-sm whitespace-nowrap">{{ fmtDate(row.date) }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm">{{ row.created_by?.name||'—' }}</td>
              <td class="table-cell text-sm font-medium text-gray-800">{{ row.product_type?.name||'—' }}</td>
              <td class="table-cell font-semibold text-gray-800 whitespace-nowrap">{{ fmt(row.amount, row.currency) }}</td>
              <td class="table-cell">
                <span :class="['badge text-xs', row.currency==='USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700']">{{ row.currency }}</span>
              </td>
              <td class="table-cell"><span :class="['badge', statusColor(row.status)]">{{ row.status }}</span></td>
              <td class="table-cell text-sm whitespace-nowrap">{{ fmtDate(row.approved_at) }}</td>
              <td class="table-cell text-sm">{{ row.approved_by?.name||'—' }}</td>
              <td class="table-cell text-xs text-gray-600 max-w-32 truncate">{{ row.remark||'—' }}</td>
            </tr>
            <!-- Totals row -->
            <tr v-if="items.length" class="bg-gray-50 font-semibold border-t-2 border-gray-200">
              <td colspan="6" class="table-cell text-right text-sm text-gray-600">Totals</td>
              <td class="table-cell text-sm whitespace-nowrap">
                <span v-if="totalUSDRaw > 0" class="block" style="color:#938af4">${{ totalUSD }}</span>
                <span v-if="totalKHRRaw > 0" class="block text-blue-600">៛{{ totalKHR }}</span>
              </td>
              <td colspan="6" class="table-cell"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowDownTrayIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getBranches } from '@/api/branches'
import { useLookupStore } from '@/stores/lookup'
import { getUsersInScope } from '@/api/users'
import { getTurnoverBets } from '@/api/turnover-bets'
import { formatCurrency, formatNumber, sumByCurrency } from '@/utils/currency'

const items   = ref([])
const loading = ref(false)
function todayStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function todayEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }
const lookup = useLookupStore()
const showMoreFilters = ref(false)
const approvedByUsers = ref([])
const branches = ref([])
const users    = ref([])
const filters = ref({ date_from: todayStart(), date_to: todayEnd(), status: null, currency: null, branch_id: null, created_by_id: null, product_type_id: null, approved_by_id: null })

const activeMoreFilters = computed(() => [filters.value.branch_id, filters.value.created_by_id, filters.value.product_type_id, filters.value.approved_by_id].filter(Boolean).length)
const statusOpts   = [{ id:'pending',name:'Pending' }, { id:'approved',name:'Approved' }, { id:'rejected',name:'Rejected' }]
const currencyOpts = [{ id:'USD', name:'USD' }, { id:'KHR', name:'KHR' }]

const totalUSDRaw = computed(() => sumByCurrency(items.value, 'USD', 'amount'))
const totalKHRRaw = computed(() => sumByCurrency(items.value, 'KHR', 'amount'))
const totalUSD = computed(() => formatNumber(totalUSDRaw.value))
const totalKHR = computed(() => formatNumber(totalKHRRaw.value))

function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
const fmt = formatCurrency
function statusColor(s) { return { pending:'bg-yellow-100 text-yellow-700', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600' }

async function load() {
  loading.value = true
  try {
    const params = { page:1, page_size:500, sort_by:'date', sort_dir:'desc' }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.currency)      params.currency      = filters.value.currency
    if (filters.value.branch_id)     params.branch_id     = filters.value.branch_id
    if (filters.value.created_by_id)  params.created_by_id  = filters.value.created_by_id
    if (filters.value.product_type_id)  params.product_type_id = filters.value.product_type_id
    if (filters.value.approved_by_id)   params.approved_by_id  = filters.value.approved_by_id
    const res = await getTurnoverBets(params)
    items.value = res.data || []
  } catch {} finally { loading.value = false }
}

function resetFilters() { filters.value = { date_from:todayStart(), date_to:todayEnd(), status:null, currency:null, branch_id:null, created_by_id:null, product_type_id:null, approved_by_id:null }; load() }

function exportCSV() {
  const headers = ['#','Created Date','Date','Created By','Product','Amount','Currency','Status','Approved Date','Approved By','Remark']
  const rows = items.value.map((r, i) => [
    i+1, fmtDate(r.created_at), fmtDate(r.date), r.created_by?.name||'',
    r.product_type?.name||'', r.amount, r.currency,
    r.status, fmtDate(r.approved_at), r.approved_by?.name||'', r.remark||''
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'turnover_bets_report.csv'; a.click()
}

onMounted(async () => { load(); lookup.loadAll(); try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {} try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {} try { const r = await getUsersInScope(); approvedByUsers.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {} })
</script>