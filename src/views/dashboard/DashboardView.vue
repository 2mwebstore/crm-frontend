<template>
  <div class="space-y-6 pb-8">
    <!-- ============ Greeting banner ============ -->
    <div class="rounded-xl p-6 text-white" style="background:#938af4">
      <p class="text-xl sm:text-2xl font-bold truncate">{{ greeting }}, {{ auth.user?.name || 'there' }}</p>
      <p class="text-sm text-white/80 mt-1">{{ todayLabel }}<span v-if="branchName"> — {{ branchName }}</span></p>
      <div class="flex flex-wrap gap-2 mt-4">
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/15">{{ todayDepositCount }} deposits today</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/15">{{ todayWithdrawalCount }} withdrawals today</span>
        <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-white/15">{{ todayNewClients }} new clients</span>
      </div>
    </div>

    <!-- ============ Today ============ -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Today</p>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-green-50">
            <ArrowDownTrayIcon class="w-5 h-5 text-green-600" />
          </div>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deposit</p>
          <p class="text-2xl font-bold text-gray-900 mt-1 truncate">{{ fmtUSD(todayDepositUSD) }}</p>
          <p class="text-sm font-semibold mt-0.5 truncate" style="color:#8B4513">{{ fmtKHR(todayDepositKHR) }}</p>
          <p class="text-xs text-gray-400 mt-1.5">{{ todayDepositCount }} transaction{{ todayDepositCount === 1 ? '' : 's' }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-orange-50">
            <ArrowUpTrayIcon class="w-5 h-5 text-orange-600" />
          </div>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Withdrawal</p>
          <p class="text-2xl font-bold text-gray-900 mt-1 truncate">{{ fmtUSD(todayWithdrawalUSD) }}</p>
          <p class="text-sm font-semibold mt-0.5 truncate" style="color:#8B4513">{{ fmtKHR(todayWithdrawalKHR) }}</p>
          <p class="text-xs text-gray-400 mt-1.5">{{ todayWithdrawalCount }} transaction{{ todayWithdrawalCount === 1 ? '' : 's' }}</p>
        </div>
      </div>
    </div>

    <!-- ============ Net — Today ============ -->
    <div class="rounded-xl p-5 text-white flex items-center justify-between gap-4" style="background:#6D5FD8">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wider text-white/70">Net — Today</p>
        <p class="text-2xl font-bold mt-1">{{ netUSD >= 0 ? '+' : '' }}{{ fmtUSD(netUSD) }}</p>
      </div>
      <div class="text-right min-w-0">
        <p class="text-xs font-semibold uppercase tracking-wider text-white/70">Net KHR</p>
        <p class="text-2xl font-bold mt-1">{{ netKHR >= 0 ? '+' : '' }}{{ fmtKHR(netKHR) }}</p>
      </div>
    </div>

    <!-- ============ All Time ============ -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">All Time</p>
      <div class="flex overflow-x-auto snap-x snap-mandatory gap-1 -mx-4 sm:mx-0">
        <div
          v-for="(s, idx) in allTimeStats"
          :key="s.label"
          :class="[
            'w-[40%] flex-shrink-0 snap-start bg-white rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)]',
            idx === 0 ? 'ml-4' : '',
            idx === allTimeStats.length - 1 ? 'mr-4' : ''
          ]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" :style="{ background: `${s.tint}1f` }">
            <component :is="s.icon" class="w-5 h-5" :style="{ color: s.tint }" />
          </div>
          <p class="text-xs font-medium text-gray-400">{{ s.label }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1 truncate">{{ s.value }}</p>
          <p class="text-xs mt-1.5 truncate" :class="s.subColor || 'text-gray-400'">{{ s.sub }}</p>
        </div>
      </div>
    </div>

    <!-- ============ Quick Actions ============ -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Quick Actions</p>
      <div class="grid grid-cols-3 gap-3">
        <RouterLink
          v-for="a in quickActions"
          :key="a.label"
          :to="a.to"
          class="flex flex-col items-center justify-center gap-2 bg-white rounded-lg py-5 px-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(147,138,244,0.22)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
        >
          <div class="w-11 h-11 rounded-lg flex items-center justify-center" style="background:rgba(147,138,244,0.12)">
            <component :is="a.icon" class="w-5 h-5" style="color:#938af4" />
          </div>
          <span class="text-xs font-semibold text-gray-700 text-center leading-tight">{{ a.label }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getClients } from '@/api/clients'
import { getICs } from '@/api/interesting-clients'
import { getDeposits, getWithdrawals } from '@/api/transactions'
import { sumByCurrency } from '@/utils/currency'
import { nowForDatePicker } from '@/utils/datetime'
import {
  ArrowDownTrayIcon, ArrowUpTrayIcon, UserGroupIcon, StarIcon,
  ArrowPathIcon, CalendarDaysIcon, BanknotesIcon, ChartBarIcon
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()

// Same permission-gated quick actions as before — each links to a real,
// existing route.
const quickActions = computed(() => {
  const isSA = auth.isSuperAdmin
  const all = [
    { label: 'Clients',      to: '/clients',             icon: UserGroupIcon,  show: isSA || auth.can('clients.view') },
    { label: 'Interesting',  to: '/interesting-clients',  icon: StarIcon,       show: isSA || auth.can('interesting_clients.view') },
    { label: 'Deposits',     to: '/deposits',             icon: ArrowDownTrayIcon, show: isSA || auth.can('deposits.view') },
    { label: 'Withdrawals',  to: '/withdrawals',          icon: ArrowUpTrayIcon,   show: isSA || auth.can('withdrawals.view') },
    { label: 'Turn Over',    to: '/turnover-bets',        icon: ArrowPathIcon,     show: isSA || auth.can('turnover_bets.view') },
    { label: 'Follow Ups',   to: '/follow-ups',           icon: CalendarDaysIcon,  show: isSA || auth.can('follow_ups.view') },
    { label: 'Daily Balance', to: '/daily-balance',       icon: BanknotesIcon,     show: isSA || auth.canAny('daily_balance.view', 'daily_balance.start', 'daily_balance.close') },
    { label: 'Reports',      to: '/reports',              icon: ChartBarIcon,      show: true },
  ]
  return all.filter(a => a.show)
})

const branchName = computed(() => {
  const branches = (auth.user?.branches || []).filter(b => b?.name)
  return branches.length === 1 ? branches[0].name : ''
})

// Phnom Penh wall-clock "now", reused for both the greeting and for
// picking today's date string used in the date_from/date_to filters below.
const ppNow = new Date(nowForDatePicker().replace(' ', 'T'))
const today = nowForDatePicker().split(' ')[0] // YYYY-MM-DD

const greeting = computed(() => {
  const h = ppNow.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const todayLabel = computed(() =>
  ppNow.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
)

function fmtUSD(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0)
}
function fmtKHR(v) {
  return Number(v || 0).toLocaleString() + '៛'
}

// ---- Today ----
const todayDepositUSD = ref(0)
const todayDepositKHR = ref(0)
const todayDepositCount = ref(0)
const todayWithdrawalUSD = ref(0)
const todayWithdrawalKHR = ref(0)
const todayWithdrawalCount = ref(0)
const todayNewClients = ref(0)

const netUSD = computed(() => todayDepositUSD.value - todayWithdrawalUSD.value)
const netKHR = computed(() => todayDepositKHR.value - todayWithdrawalKHR.value)

// ---- All time ----
const allTimeDepUSD = ref(0)
const allTimeDepKHR = ref(0)
const allTimeWdUSD = ref(0)
const allTimeWdKHR = ref(0)
const clientCount = ref('—')
const icCount = ref('—')

const allTimeStats = computed(() => [
  { label: 'Dep USD', value: fmtUSD(allTimeDepUSD.value), sub: 'All time', icon: ArrowDownTrayIcon, tint: '#22C55E' },
  { label: 'Dep KHR', value: fmtKHR(allTimeDepKHR.value), sub: 'All time', icon: ArrowDownTrayIcon, tint: '#22C55E' },
  { label: 'WD USD',  value: fmtUSD(allTimeWdUSD.value),  sub: 'All time', icon: ArrowUpTrayIcon,   tint: '#F97316' },
  { label: 'WD KHR',  value: fmtKHR(allTimeWdKHR.value),  sub: 'All time', icon: ArrowUpTrayIcon,   tint: '#F97316' },
  { label: 'Clients', value: String(clientCount.value),   sub: 'Total clients', icon: UserGroupIcon, tint: '#938af4' },
  { label: 'Interesting', value: String(icCount.value),   sub: 'Not converted', icon: StarIcon,       tint: '#F59E0B' },
])

onMounted(async () => {
  // Today's deposits/withdrawals — filtered server-side via date_from/date_to,
  // same param names DepositListView/WithdrawalListView already use.
  try {
    const res = await getDeposits({ date_from: today, date_to: today, page: 1, page_size: 1000 })
    const items = res.data || []
    todayDepositUSD.value = sumByCurrency(items, 'USD', 'amount')
    todayDepositKHR.value = sumByCurrency(items, 'KHR', 'amount')
    todayDepositCount.value = res.meta?.total_items ?? items.length
  } catch { }

  try {
    const res = await getWithdrawals({ date_from: today, date_to: today, page: 1, page_size: 1000 })
    const items = res.data || []
    todayWithdrawalUSD.value = sumByCurrency(items, 'USD', 'amount')
    todayWithdrawalKHR.value = sumByCurrency(items, 'KHR', 'amount')
    todayWithdrawalCount.value = res.meta?.total_items ?? items.length
  } catch { }

  // Clients API has no date_from/date_to filter (and, unlike deposits/
  // withdrawals, no sort_by/sort_dir either), so "new clients today" is
  // approximated by pulling a large page and counting how many fall on
  // today's date client-side. page_size is generous rather than relying
  // on any assumed default ordering.
  try {
    const res = await getClients({ page: 1, page_size: 1000 })
    todayNewClients.value = (res.data || []).filter(c => (c.date_joined || '').slice(0, 10) === today).length
    clientCount.value = res.meta?.total_items ?? '—'
  } catch { }

  try {
    const res = await getICs({ page: 1, page_size: 1 })
    icCount.value = res.meta?.total_items ?? '—'
  } catch { }

  // All-time totals — same "fetch a big page, sum client-side with
  // sumByCurrency" pattern already used by DepositReport.vue / WithdrawalReport.vue.
  try {
    const res = await getDeposits({ page: 1, page_size: 500, sort_by: 'date', sort_dir: 'desc' })
    const items = res.data || []
    allTimeDepUSD.value = sumByCurrency(items, 'USD', 'amount')
    allTimeDepKHR.value = sumByCurrency(items, 'KHR', 'amount')
  } catch { }

  try {
    const res = await getWithdrawals({ page: 1, page_size: 500, sort_by: 'date', sort_dir: 'desc' })
    const items = res.data || []
    allTimeWdUSD.value = sumByCurrency(items, 'USD', 'amount')
    allTimeWdKHR.value = sumByCurrency(items, 'KHR', 'amount')
  } catch { }
})
</script>
