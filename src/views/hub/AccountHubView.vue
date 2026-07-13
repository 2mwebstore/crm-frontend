<template>
  <div class="space-y-6 pb-4">
    <!-- Banner -->
    <div class="rounded-xl p-6 text-white" style="background:#22C55E">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
          <CreditCardIcon class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <p class="text-lg font-bold truncate">Account</p>
          <p class="text-sm text-white/80 truncate">Today — Dep: {{ fmtUSD(todayDeposits) }} · Wd: {{ fmtUSD(todayWithdrawals) }}</p>
        </div>
      </div>
    </div>

    <!-- Direct Entry -->
    <div v-if="entryTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Direct Entry</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in entryTiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Bet Records -->
    <div v-if="betTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Bet Records</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in betTiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getDeposits, getWithdrawals } from '@/api/transactions'
import { sumByCurrency } from '@/utils/currency'
import { nowForDatePicker } from '@/utils/datetime'
import {
  CreditCardIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, BanknotesIcon, ArrowPathIcon
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const todayDeposits = ref(0)
const todayWithdrawals = ref(0)

// The reference design also showed "Request Quick / Deposit / Withdrawal"
// (an approval-queue workflow), a "Quick" fast-entry tile, "Transfer
// between products", and a "Bonus" tile. None of those exist as routes or
// API endpoints in this project yet, so they're intentionally omitted
// rather than linking to something that isn't built.
const allEntryTiles = computed(() => [
  { label: 'Deposit',    sub: 'View & manage deposits',    to: '/deposits',    icon: ArrowDownTrayIcon, tint: '#22C55E', show: auth.isSuperAdmin || auth.can('deposits.view') },
  { label: 'Withdrawal', sub: 'View & manage withdrawals', to: '/withdrawals', icon: ArrowUpTrayIcon,   tint: '#F97316', show: auth.isSuperAdmin || auth.can('withdrawals.view') },
  { label: 'Daily Balance', sub: 'Start / close shift',     to: '/daily-balance', icon: BanknotesIcon,  tint: '#938af4', show: auth.isSuperAdmin || auth.canAny('daily_balance.view', 'daily_balance.start', 'daily_balance.close') },
])
const entryTiles = computed(() => allEntryTiles.value.filter(t => t.show))

const allBetTiles = computed(() => [
  { label: 'Turn Over Bet', sub: 'Bet records', to: '/turnover-bets', icon: ArrowPathIcon, tint: '#EAB308', show: auth.isSuperAdmin || auth.can('turnover_bets.view') },
])
const betTiles = computed(() => allBetTiles.value.filter(t => t.show))

function fmtUSD(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0)
}

onMounted(async () => {
  const today = nowForDatePicker().split(' ')[0] // YYYY-MM-DD, Phnom Penh local

  // No dedicated "today summary" endpoint exists, so this follows the same
  // pattern already used by DepositReport.vue / WithdrawalReport.vue:
  // fetch a large page filtered to today and sum client-side with
  // sumByCurrency. Only the USD total is shown here to match the banner;
  // KHR is available the same way if you want it added.
  try {
    const res = await getDeposits({ date_from: today, date_to: today, page: 1, page_size: 1000 })
    todayDeposits.value = sumByCurrency(res.data || [], 'USD', 'amount')
  } catch { }
  try {
    const res = await getWithdrawals({ date_from: today, date_to: today, page: 1, page_size: 1000 })
    todayWithdrawals.value = sumByCurrency(res.data || [], 'USD', 'amount')
  } catch { }
})
</script>
