import { computed } from 'vue'
import {
  HomeIcon, StarIcon, UserGroupIcon, UsersIcon, ShieldCheckIcon,
  TagIcon, Squares2X2Icon, BanknotesIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ChartBarIcon, CurrencyDollarIcon, CalendarDaysIcon,
  BuildingOfficeIcon, BuildingLibraryIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

// Single source of truth for the app's navigation structure + permission
// gating. AppSidebar.vue (desktop) and MobileTabBar.vue (mobile "More"
// sheet) both consume this so the two never drift out of sync.
export function useNavGroups() {
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

  return { groups, visibleGroups }
}
