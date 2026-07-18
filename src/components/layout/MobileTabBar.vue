<template>
  <!-- Bottom tab bar: only rendered below the lg breakpoint (see .mobile-tab-bar) -->
  <nav class="mobile-tab-bar transition-transform duration-300 ease-in-out" :class="{ 'translate-y-full': hidden }">
    <RouterLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="mobile-tab-item"
      :class="{ active: isActive(t) }"
    >
      <component :is="t.icon" class="w-6 h-6" />
      <span class="text-[11px] font-medium">{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import {
  HomeIcon, UserGroupIcon, CreditCardIcon, ChartBarIcon, Cog6ToothIcon, MapPinIcon
} from '@heroicons/vue/24/outline'

defineProps({ hidden: { type: Boolean, default: false } })

const route = useRoute()

// Bottom nav — was a fixed 5-tab bar matching the reference mobile app;
// now 6 with Attendance added. Each tab is a hub page (views/hub/*) that
// links into the real existing routes — see those files for what's
// included/omitted and why.
const tabs = [
  { to: '/dashboard',   label: 'Home',    icon: HomeIcon,       match: ['/dashboard'] },
  { to: '/hub/clients', label: 'Clients', icon: UserGroupIcon,  match: ['/hub/clients', '/clients', '/interesting-clients', '/follow-ups'] },
  { to: '/hub/account', label: 'Account', icon: CreditCardIcon, match: ['/hub/account', '/deposits', '/withdrawals', '/daily-balance', '/turnover-bets'] },
  { to: '/hub/attendance', label: 'Attendance', icon: MapPinIcon, match: ['/hub/attendance', '/attendance', '/leave', '/overtime', '/activity', '/schedule-overrides'] },
  { to: '/hub/reports', label: 'Report',  icon: ChartBarIcon,   match: ['/hub/reports', '/reports'] },
  { to: '/hub/setup',   label: 'Setup',   icon: Cog6ToothIcon,  match: ['/hub/setup', '/users', '/roles', '/branches', '/lookup'] },
]

function isActive(tab) {
  return tab.match.some(p => route.path === p || route.path.startsWith(p + '/'))
}
</script>

