<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div><label class="label">Date Range</label><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <div class="w-36"><label class="label">Status</label>
        <SearchableSelect v-model="filters.status" :options="statusOpts" value-key="id" label-key="name" placeholder="All" @update:modelValue="load" />
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
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div><label class="label text-xs">Branch</label><SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" /></div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Deposits</p>
        <p class="text-base font-bold mt-1 text-green-600">${{ depositUSD }}</p>
        <p class="text-base font-bold mt-0.5 text-purple-600">៛{{ depositKHR.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Withdrawals</p>
        <p class="text-base font-bold mt-1 text-orange-600">-${{ withdrawalUSD }}</p>
        <p class="text-base font-bold mt-0.5 text-blue-600">-៛{{ withdrawalKHR.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Total Bonus Given</p>
        <p class="text-base font-bold mt-1 text-amber-600">-${{ bonusUSD }}</p>
        <p class="text-base font-bold mt-0.5 text-amber-500">-៛{{ bonusKHR.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">Net Profit / Loss</p>
        <p class="text-base font-bold mt-1" :class="netUSDNum >= 0 ? 'text-green-600' : 'text-red-600'">{{ netUSDNum >= 0 ? '' : '-' }}${{ Math.abs(netUSDNum).toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
        <p class="text-base font-bold mt-0.5" :class="netKHRNum >= 0 ? 'text-purple-600' : 'text-red-600'">{{ netKHRNum >= 0 ? '' : '-' }}៛{{ Math.abs(netKHRNum).toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</p>
      </div>
    </div>

    <!-- Context card: turnover volume (not part of the P&L calc, shown for reference) -->
    <div class="card p-4 flex items-center gap-3">
      <ScaleIcon class="w-5 h-5 text-gray-400 flex-shrink-0" />
      <p class="text-sm text-gray-600">
        Reference — total turnover (betting volume) in this period:
        <span class="font-semibold text-indigo-600">${{ turnoverUSD }}</span>
        <span class="mx-1 text-gray-300">/</span>
        <span class="font-semibold text-purple-600">៛{{ turnoverKHR.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
        <span class="text-gray-400"> (not counted in Net Profit / Loss above)</span>
      </p>
    </div>

    <!-- Breakdown by branch -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Deposits</th>
              <th class="table-header">Withdrawals</th>
              <th class="table-header">Bonus Given</th>
              <th class="table-header">Net P&amp;L</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="6" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!branchSummary.length"><td colspan="6" class="table-cell text-center py-10 text-gray-400">No records</td></tr>
            <tr v-else v-for="(row, i) in branchSummary" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ i+1 }}</td>
              <td class="table-cell text-sm font-medium text-gray-800">{{ row.name }}</td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-green-600">${{ row.depositUSD.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
                <p class="text-xs text-purple-600">៛{{ row.depositKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-orange-600">-${{ row.withdrawalUSD.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
                <p class="text-xs text-blue-600">-៛{{ row.withdrawalKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-amber-600">-${{ row.bonusUSD.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
                <p class="text-xs text-amber-500">-៛{{ row.bonusKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap font-semibold">
                <p :class="row.netUSD >= 0 ? 'text-green-600' : 'text-red-600'">{{ row.netUSD >= 0 ? '' : '-' }}${{ Math.abs(row.netUSD).toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
                <p :class="row.netKHR >= 0 ? 'text-purple-600' : 'text-red-600'">{{ row.netKHR >= 0 ? '' : '-' }}៛{{ Math.abs(row.netKHR).toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
            </tr>
            <!-- Totals row -->
            <tr v-if="branchSummary.length" class="bg-gray-50 font-semibold border-t-2 border-gray-200">
              <td colspan="2" class="table-cell text-right text-sm text-gray-600">Totals</td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-green-600">${{ depositUSD }}</p>
                <p class="text-xs text-purple-600">៛{{ depositKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-orange-600">-${{ withdrawalUSD }}</p>
                <p class="text-xs text-blue-600">-៛{{ withdrawalKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap">
                <p class="text-sm text-amber-600">-${{ bonusUSD }}</p>
                <p class="text-xs text-amber-500">-៛{{ bonusKHR.toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
              <td class="table-cell whitespace-nowrap">
                <p :class="netUSDNum >= 0 ? 'text-green-600' : 'text-red-600'">{{ netUSDNum >= 0 ? '' : '-' }}${{ Math.abs(netUSDNum).toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
                <p :class="netKHRNum >= 0 ? 'text-purple-600' : 'text-red-600'">{{ netKHRNum >= 0 ? '' : '-' }}៛{{ Math.abs(netKHRNum).toLocaleString(undefined,{maximumFractionDigits:2}) }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowDownTrayIcon, FunnelIcon, ScaleIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getBranches } from '@/api/branches'
import { getDeposits, getWithdrawals } from '@/api/transactions'
import { getTurnoverBets } from '@/api/turnover-bets'

const deposits    = ref([])
const withdrawals = ref([])
const turnovers   = ref([])
const loading     = ref(false)
const showMoreFilters = ref(false)
const branches    = ref([])

function todayStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function todayEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }

// Defaults to 'approved' - only finalized/settled transactions count toward
// realized profit and loss. Switch to All/Pending/Rejected if you want to
// see a projected or unfiltered view instead.
const filters = ref({ date_from: todayStart(), date_to: todayEnd(), status: '', branch_id: null })

const activeMoreFilters = computed(() => [filters.value.branch_id].filter(Boolean).length)
const statusOpts = [{ id:'pending',name:'Pending' }, { id:'approved',name:'Approved' }, { id:'rejected',name:'Rejected' }]

function sumBy(list, currency, field) {
  return list.filter(r => r.currency === currency).reduce((s, r) => s + (r[field] || 0), 0)
}

const depositUSD    = computed(() => sumBy(deposits.value, 'USD', 'amount').toLocaleString(undefined, { maximumFractionDigits: 2 }))
const depositKHR    = computed(() => sumBy(deposits.value, 'KHR', 'amount'))
const withdrawalUSD = computed(() => sumBy(withdrawals.value, 'USD', 'amount').toLocaleString(undefined, { maximumFractionDigits: 2 }))
const withdrawalKHR = computed(() => sumBy(withdrawals.value, 'KHR', 'amount'))
const bonusUSD       = computed(() => (sumBy(deposits.value, 'USD', 'bonus_amount') + sumBy(withdrawals.value, 'USD', 'bonus_amount')).toLocaleString(undefined, { maximumFractionDigits: 2 }))
const bonusKHR       = computed(() => sumBy(deposits.value, 'KHR', 'bonus_amount') + sumBy(withdrawals.value, 'KHR', 'bonus_amount'))
const turnoverUSD    = computed(() => sumBy(turnovers.value, 'USD', 'amount').toLocaleString(undefined, { maximumFractionDigits: 2 }))
const turnoverKHR    = computed(() => sumBy(turnovers.value, 'KHR', 'amount'))

const netUSDNum = computed(() => Number(depositUSD.value.replace(/,/g,'')) - Number(withdrawalUSD.value.replace(/,/g,'')) - Number(bonusUSD.value.replace(/,/g,'')))
const netKHRNum = computed(() => depositKHR.value - withdrawalKHR.value - bonusKHR.value)

const branchSummary = computed(() => {
  const map = {}
  function ensure(id, name) {
    const key = id || 'none'
    if (!map[key]) map[key] = { id: key, name: name || 'Unassigned', depositUSD:0, depositKHR:0, withdrawalUSD:0, withdrawalKHR:0, bonusUSD:0, bonusKHR:0 }
    return map[key]
  }
  deposits.value.forEach(d => {
    const b = ensure(d.branch_id, d.branch?.name)
    if (d.currency === 'KHR') { b.depositKHR += d.amount||0; b.bonusKHR += d.bonus_amount||0 }
    else { b.depositUSD += d.amount||0; b.bonusUSD += d.bonus_amount||0 }
  })
  withdrawals.value.forEach(w => {
    const b = ensure(w.branch_id, w.branch?.name)
    if (w.currency === 'KHR') { b.withdrawalKHR += w.amount||0; b.bonusKHR += w.bonus_amount||0 }
    else { b.withdrawalUSD += w.amount||0; b.bonusUSD += w.bonus_amount||0 }
  })
  return Object.values(map).map(b => ({
    ...b,
    netUSD: b.depositUSD - b.withdrawalUSD - b.bonusUSD,
    netKHR: b.depositKHR - b.withdrawalKHR - b.bonusKHR,
  })).sort((a, b) => a.name.localeCompare(b.name))
})

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 1000, sort_by: 'date', sort_dir: 'desc' }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const [depRes, wdrRes, toRes] = await Promise.all([
      getDeposits(params),
      getWithdrawals(params),
      getTurnoverBets(params),
    ])
    deposits.value    = depRes.data || []
    withdrawals.value = wdrRes.data || []
    turnovers.value   = toRes.data || []
  } catch {} finally { loading.value = false }
}

function resetFilters() {
  filters.value = { date_from: todayStart(), date_to: todayEnd(), status: '', branch_id: null }
  load()
}

function exportCSV() {
  const headers = ['Branch', 'Deposits USD', 'Deposits KHR', 'Withdrawals USD', 'Withdrawals KHR', 'Bonus USD', 'Bonus KHR', 'Net USD', 'Net KHR']
  const rows = branchSummary.value.map(b => [
    b.name, b.depositUSD, b.depositKHR, b.withdrawalUSD, b.withdrawalKHR, b.bonusUSD, b.bonusKHR, b.netUSD, b.netKHR
  ])
  rows.push(['TOTAL', depositUSD.value, depositKHR.value, withdrawalUSD.value, withdrawalKHR.value, bonusUSD.value, bonusKHR.value, netUSDNum.value, netKHRNum.value])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'profit_loss_report.csv'; a.click()
}

onMounted(async () => {
  load()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {}
})
</script>