<template>
  <aside
    :class="[
      'flex flex-col flex-shrink-0 h-screen border-r border-gray-100 bg-white transition-all duration-200 overflow-hidden',
      collapsed ? 'w-16' : 'w-60'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center px-4 h-16 border-b border-gray-100 flex-shrink-0">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#938af4">
        <span class="text-white text-sm font-bold">C</span>
      </div>
      <span v-if="!collapsed" class="ml-3 font-semibold text-gray-800 truncate">CRM Admin</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-2">
      <div v-for="group in visibleGroups" :key="group.label" class="mb-1">
        <p v-if="!collapsed && group.label"
           class="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="sidebar-item"
          active-class="active"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!collapsed" class="truncate flex-1">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- Collapse toggle -->
    <button
      @click="$emit('toggle')"
      class="sidebar-item mx-2 mb-2 border-t border-gray-100 pt-2 flex-shrink-0"
    >
      <ChevronLeftIcon v-if="!collapsed" class="w-5 h-5 flex-shrink-0" />
      <ChevronRightIcon v-else class="w-5 h-5 flex-shrink-0" />
      <span v-if="!collapsed" class="truncate">Collapse</span>
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import {
  HomeIcon, StarIcon, UserGroupIcon, UsersIcon, ShieldCheckIcon,
  ChevronLeftIcon, ChevronRightIcon,
  TagIcon, Squares2X2Icon, BanknotesIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ChartBarIcon, CurrencyDollarIcon, CalendarDaysIcon,
  BuildingOfficeIcon, BuildingLibraryIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const auth = useAuthStore()
const isSA = computed(() => auth.isSuperAdmin)

const groups = computed(() => [
  {
    label: '',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: HomeIcon, show: true },
      { to: '/daily-balance', label: 'Daily Balance', icon: BanknotesIcon, show: isSA.value || auth.canAny('daily_balance.view', 'daily_balance.start', 'daily_balance.close') },
    ]
  },
  {
    label: 'CRM',
    items: [
      { to: '/interesting-clients', label: 'Interesting Clients', icon: StarIcon,       show: isSA.value || auth.can('interesting_clients.view') },
      { to: '/clients',             label: 'Clients',             icon: UserGroupIcon,  show: isSA.value || auth.can('clients.view') },
    ]
  },
  {
    label: 'Transactions',
    items: [
      { to: '/deposits',      label: 'Deposits',      icon: ArrowDownTrayIcon,  show: isSA.value || auth.can('deposits.view') },
      { to: '/withdrawals',   label: 'Withdrawals',   icon: ArrowUpTrayIcon,    show: isSA.value || auth.can('withdrawals.view') },
      { to: '/turnover-bets', label: 'Turn Over Bet', icon: CurrencyDollarIcon, show: isSA.value || auth.can('turnover_bets.view') },
      { to: '/follow-ups',    label: 'Follow Ups',    icon: CalendarDaysIcon,   show: isSA.value || auth.can('follow_ups.view') },
      { to: '/reports',       label: 'Reports',       icon: ChartBarIcon,       show: true },
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/users',    label: 'Users',               icon: UsersIcon,          show: isSA.value || auth.can('users.view') },
      { to: '/roles',    label: 'Roles & Permissions', icon: ShieldCheckIcon,    show: isSA.value || auth.can('roles.view') },
      { to: '/branches', label: 'Branches',            icon: BuildingOfficeIcon, show: isSA.value || auth.can('branch.view') },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { to: '/lookup/levels',          label: 'Levels',          icon: TagIcon,             show: isSA.value || auth.can('levels.view') },
      { to: '/lookup/contact-sources', label: 'Contact Sources', icon: Squares2X2Icon,      show: isSA.value || auth.can('contact_sources.view') },
      { to: '/lookup/bank-types',      label: 'Bank Types',      icon: BuildingLibraryIcon, show: isSA.value || auth.can('bank_types.view') },
      { to: '/lookup/company-banks',   label: 'Company Banks',   icon: BanknotesIcon,       show: isSA.value || auth.can('company_banks.view') },
      { to: '/lookup/product-types',   label: 'Product Types',   icon: Squares2X2Icon,      show: isSA.value || auth.can('product_types.view') },
      { to: '/lookup/bonus-options',   label: 'Bonus Options',   icon: BanknotesIcon,       show: isSA.value || auth.can('bonus_options.view') },
      { to: '/lookup/currencies',      label: 'Currencies',      icon: CurrencyDollarIcon,  show: isSA.value || auth.can('currencies.view') },
    ]
  }
])

const visibleGroups = computed(() =>
  groups.value
    .map(g => ({ ...g, items: g.items.filter(i => i.show) }))
    .filter(g => g.items.length > 0)
)
</script>