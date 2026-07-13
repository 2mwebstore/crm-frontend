<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Reports</h1>
      <p class="text-sm text-gray-500 mt-0.5">Analytics and data export for all modules</p>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap border-b border-gray-200 gap-1">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        :class="['px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
          activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700']">
        <component :is="t.icon" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
        {{ t.label }}
      </button>
    </div>

    <ICReport         v-if="activeTab === 'ic'" />
    <ClientReport     v-if="activeTab === 'clients'" />
    <DepositReport    v-if="activeTab === 'deposits'" />
    <WithdrawalReport v-if="activeTab === 'withdrawals'" />
    <TurnoverReport   v-if="activeTab === 'turnover'" />
    <FollowUpReport   v-if="activeTab === 'followups'" />
    <PLReport         v-if="activeTab === 'pl'" />
    <TransactionsFeedReport v-if="activeTab === 'transactions'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { StarIcon, UserGroupIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CurrencyDollarIcon, CalendarDaysIcon, ScaleIcon, QueueListIcon } from '@heroicons/vue/24/outline'
import ICReport         from './ICReport.vue'
import ClientReport     from './ClientReport.vue'
import DepositReport    from './DepositReport.vue'
import WithdrawalReport from './WithdrawalReport.vue'
import TurnoverReport   from './TurnoverReport.vue'
import FollowUpReport   from './FollowUpReport.vue'
import PLReport         from './PLReport.vue'
import TransactionsFeedReport from './TransactionsFeedReport.vue'

const tabs = [
  { id: 'ic',            label: 'Interesting Clients', icon: StarIcon },
  { id: 'clients',       label: 'Clients',             icon: UserGroupIcon },
  { id: 'deposits',      label: 'Deposits',            icon: ArrowDownTrayIcon },
  { id: 'withdrawals',   label: 'Withdrawals',         icon: ArrowUpTrayIcon },
  { id: 'turnover',      label: 'Turn Over Bet',       icon: CurrencyDollarIcon },
  { id: 'followups',     label: 'Follow Ups',          icon: CalendarDaysIcon },
  { id: 'pl',            label: 'Profit & Loss',       icon: ScaleIcon },
  { id: 'transactions',  label: 'All Transactions',    icon: QueueListIcon },
]

// Lets links like /reports?tab=deposits (used by the new Reports hub page)
// open straight on that tab. Falls back to the original default ('ic')
// when there's no ?tab= or it doesn't match a known tab id — existing
// behavior for anyone who just clicks "Reports" in the sidebar/nav.
const route = useRoute()
const activeTab = ref(tabs.some(t => t.id === route.query.tab) ? route.query.tab : 'ic')
</script>