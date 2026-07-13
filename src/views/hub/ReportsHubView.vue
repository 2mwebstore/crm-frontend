<template>
  <div class="space-y-6 pb-4">
    <!-- Banner -->
    <div class="rounded-xl p-6 text-white" style="background:#938af4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
          <ChartBarIcon class="w-6 h-6" />
        </div>
        <p class="text-lg font-bold">Reports</p>
      </div>
    </div>

    <!-- Transactions -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Transactions</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in txTiles"
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

    <!-- Analytics -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Analytics</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in analyticsTiles"
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
// The reference design also showed "By Bank / By Client / By Product" and
// "Wd By Bank / By Client / By Product" as separate tiles, but the
// underlying ReportView.vue only has 8 tabs (no per-bank/client/product
// breakdown tabs), so those are intentionally left out.
import { computed } from 'vue'
import {
  ChartBarIcon, QueueListIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  StarIcon, UserGroupIcon, ArrowPathIcon, CalendarDaysIcon, ScaleIcon
} from '@heroicons/vue/24/outline'

const txTiles = computed(() => [
  { label: 'All Transaction', sub: 'Dep + Wd',         to: '/reports?tab=transactions', icon: QueueListIcon,     tint: '#6B7280' },
  { label: 'Deposit',         sub: 'Deposit detail',    to: '/reports?tab=deposits',     icon: ArrowDownTrayIcon, tint: '#22C55E' },
  { label: 'Withdrawal',      sub: 'Withdrawal detail', to: '/reports?tab=withdrawals',  icon: ArrowUpTrayIcon,   tint: '#F97316' },
])

const analyticsTiles = computed(() => [
  { label: 'Interesting Clients', sub: 'IC report',        to: '/reports?tab=ic',         icon: StarIcon,          tint: '#F59E0B' },
  { label: 'Clients',             sub: 'Client report',    to: '/reports?tab=clients',     icon: UserGroupIcon,     tint: '#938af4' },
  { label: 'Turn Over',           sub: 'Turnover report',   to: '/reports?tab=turnover',    icon: ArrowPathIcon,     tint: '#EAB308' },
  { label: 'Follow Ups',          sub: 'Follow-up report',  to: '/reports?tab=followups',   icon: CalendarDaysIcon, tint: '#3B82F6' },
  { label: 'Profit & Loss',       sub: 'P&L report',        to: '/reports?tab=pl',          icon: ScaleIcon,        tint: '#EF4444' },
])
</script>
