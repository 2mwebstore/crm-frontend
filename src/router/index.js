import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
        { path: 'daily-balance', name: 'DailyBalance', component: () => import('@/views/dashboard/DailyBalanceView.vue'), meta: { perms: ['daily_balance.view', 'daily_balance.start', 'daily_balance.close'] } },
        { path: 'audit-logs', name: 'AuditLogs', component: () => import('@/views/audit-logs/AuditLogListView.vue'), meta: { perms: ['audit_logs.view'] } },
        { path: 'attendance/my', name: 'MyAttendance', component: () => import('@/views/attendance/MyAttendanceView.vue') },
        { path: 'leave/list', name: 'LeaveList', component: () => import('@/views/leave/LeaveListView.vue'), meta: { perms: ['leave_requests.view', 'leave_requests.approve'] } },
        { path: 'leave/report', name: 'LeaveReport', component: () => import('@/views/leave/LeaveReportView.vue'), meta: { perms: ['leave_requests.view', 'leave_requests.approve'] } },
        { path: 'leave/request', name: 'LeaveRequest', component: () => import('@/views/leave/LeaveRequestView.vue') },
        { path: 'leave/types',   name: 'LeaveTypes',   component: () => import('@/views/leave/LeaveTypesView.vue'),   meta: { perms: ['leave_types.view'] } },
      
        { path: 'overtime/list', name: 'OvertimeList', component: () => import('@/views/overtime/OvertimeListView.vue'), meta: { perms: ['overtime_requests.view', 'overtime_requests.approve'] } },
        { path: 'overtime/report', name: 'OvertimeReport', component: () => import('@/views/overtime/OvertimeReportView.vue'), meta: { perms: ['overtime_requests.view', 'overtime_requests.approve'] } },
        { path: 'overtime/request', name: 'OvertimeRequest', component: () => import('@/views/overtime/OvertimeRequestView.vue') },
        { path: 'activity/list', name: 'ActivityList', component: () => import('@/views/activity/ActivityListView.vue'), meta: { perms: ['activity_requests.view'] } },
        { path: 'activity/report', name: 'ActivityReport', component: () => import('@/views/activity/ActivityReportView.vue'), meta: { perms: ['activity_requests.view'] } },
        { path: 'activity/request', name: 'ActivityRequest', component: () => import('@/views/activity/ActivityRequestView.vue') },
        { path: 'attendance/list', name: 'AttendanceList', component: () => import('@/views/attendance/AttendanceListView.vue'), meta: { perms: ['attendance.view'] } },
        { path: 'attendance/report', name: 'AttendanceReport', component: () => import('@/views/attendance/AttendanceReportView.vue'), meta: { perms: ['attendance.view'] } },
        { path: 'attendance/summary', name: 'AttendanceSummary', component: () => import('@/views/attendance/AttendanceSummaryView.vue'), meta: { perms: ['attendance.view'] } },
       
        { path: 'schedule-overrides', name: 'ScheduleOverrides', component: () => import('@/views/attendance/ScheduleOverridesView.vue'), meta: { perms: ['schedule_overrides.view', 'schedule_overrides.create', 'schedule_overrides.edit', 'schedule_overrides.delete'] } },
        // Hub pages (mobile bottom-tab landing pages). Purely navigational —
        // each links into the existing routes below, so nothing here
        // duplicates or changes any existing page's logic.
        { path: 'hub/clients', name: 'ClientsHub', component: () => import('@/views/hub/ClientsHubView.vue') },
        { path: 'hub/account', name: 'AccountHub', component: () => import('@/views/hub/AccountHubView.vue') },
        { path: 'hub/reports', name: 'ReportsHub', component: () => import('@/views/hub/ReportsHubView.vue') },
        { path: 'hub/setup',   name: 'SetupHub',   component: () => import('@/views/hub/SetupHubView.vue') },
        { path: 'hub/attendance', name: 'AttendanceHub', component: () => import('@/views/hub/AttendanceHubView.vue') },

        // Interesting Clients
        { path: 'interesting-clients',          name: 'InterestingClients', component: () => import('@/views/interesting-clients/ICListView.vue'),   meta: { perms: ['interesting_clients.view'] } },
        { path: 'interesting-clients/create',   name: 'ICCreate',           component: () => import('@/views/interesting-clients/ICFormView.vue'),   meta: { perms: ['interesting_clients.create'] } },
        { path: 'interesting-clients/:id/edit', name: 'ICEdit',             component: () => import('@/views/interesting-clients/ICFormView.vue'),   meta: { perms: ['interesting_clients.edit'] } },
        { path: 'interesting-clients/:id',      name: 'ICDetail',           component: () => import('@/views/interesting-clients/ICDetailView.vue'), meta: { perms: ['interesting_clients.view'] } },

        // Clients
        { path: 'clients',          name: 'Clients',      component: () => import('@/views/clients/ClientListView.vue'),   meta: { perms: ['clients.view'] } },
        { path: 'clients/create',   name: 'ClientCreate', component: () => import('@/views/clients/ClientFormView.vue'),   meta: { perms: ['clients.create'] } },
        { path: 'clients/:id/edit', name: 'ClientEdit',   component: () => import('@/views/clients/ClientFormView.vue'),   meta: { perms: ['clients.edit'] } },
        { path: 'clients/:id',      name: 'ClientDetail', component: () => import('@/views/clients/ClientDetailView.vue'), meta: { perms: ['clients.view'] } },

        // Deposits
        { path: 'deposits',          name: 'Deposits',      component: () => import('@/views/deposits/DepositListView.vue'),   meta: { perms: ['deposits.view'] } },
        { path: 'deposits/create',   name: 'DepositCreate', component: () => import('@/views/deposits/DepositFormView.vue'),   meta: { perms: ['deposits.create'] } },
        { path: 'deposits/:id/edit', name: 'DepositEdit',   component: () => import('@/views/deposits/DepositFormView.vue'),   meta: { perms: ['deposits.edit'] } },
        { path: 'deposits/:id',      name: 'DepositDetail', component: () => import('@/views/deposits/DepositDetailView.vue') },

        // Withdrawals
        { path: 'withdrawals',          name: 'Withdrawals',      component: () => import('@/views/withdrawals/WithdrawalListView.vue'),   meta: { perms: ['withdrawals.view'] } },
        { path: 'withdrawals/create',   name: 'WithdrawalCreate', component: () => import('@/views/withdrawals/WithdrawalFormView.vue'),   meta: { perms: ['withdrawals.create'] } },
        { path: 'withdrawals/:id/edit', name: 'WithdrawalEdit',   component: () => import('@/views/withdrawals/WithdrawalFormView.vue'),   meta: { perms: ['withdrawals.edit'] } },
        { path: 'withdrawals/:id',      name: 'WithdrawalDetail', component: () => import('@/views/withdrawals/WithdrawalDetailView.vue') },

        // Turnover Bets
        { path: 'turnover-bets', name: 'TurnoverBets', component: () => import('@/views/turnover-bets/TurnoverBetListView.vue'), meta: { perms: ['turnover_bets.view'] } },

        // Follow Ups
        { path: 'follow-ups', name: 'FollowUps', component: () => import('@/views/follow-ups/FollowUpListView.vue'), meta: { perms: ['follow_ups.view'] } },

        // Reports — visible to all authenticated users
        { path: 'reports', name: 'Reports', component: () => import('@/views/reports/ReportView.vue') },

        // Management
        { path: 'users',     name: 'Users',      component: () => import('@/views/users/UserListView.vue'),       meta: { perms: ['users.view'] } },
        { path: 'roles',     name: 'Roles',      component: () => import('@/views/roles/RoleListView.vue'),       meta: { perms: ['roles.view'] } },
        { path: 'roles/:id', name: 'RoleDetail', component: () => import('@/views/roles/RoleDetailView.vue'),     meta: { perms: ['roles.view'] } },
        { path: 'branches',  name: 'Branches',   component: () => import('@/views/branches/BranchListView.vue'),  meta: { perms: ['branch.view'] } },

        // Configuration (lookup tables)
        { path: 'lookup/levels',          name: 'Levels',         component: () => import('@/views/lookup/LevelsView.vue'),         meta: { perms: ['levels.view'] } },
        { path: 'lookup/contact-sources', name: 'ContactSources', component: () => import('@/views/lookup/ContactSourcesView.vue'), meta: { perms: ['contact_sources.view'] } },
        { path: 'lookup/bank-types',      name: 'BankTypes',      component: () => import('@/views/lookup/BankTypesView.vue'),      meta: { perms: ['bank_types.view'] } },
        { path: 'lookup/product-types',   name: 'ProductTypes',   component: () => import('@/views/lookup/ProductTypesView.vue'),   meta: { perms: ['product_types.view'] } },
        { path: 'lookup/bonus-options',   name: 'BonusOptions',   component: () => import('@/views/lookup/BonusOptionsView.vue'),   meta: { perms: ['bonus_options.view'] } },
        { path: 'lookup/currencies',      name: 'Currencies',     component: () => import('@/views/lookup/CurrenciesView.vue'),     meta: { perms: ['currencies.view'] } },
        { path: 'lookup/company-banks',   name: 'CompanyBanks',   component: () => import('@/views/lookup/CompanyBanksView.vue'),   meta: { perms: ['company_banks.view'] } },
        { path: '/balance-history/:entityType/:entityId',name: 'balance-history',component: () => import('@/views/lookup/BalanceHistoryView.vue'),},

      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return '/login'
  if (!auth.user) await auth.fetchMe()

  // Super Admin only routes
  if (to.meta.superAdminOnly && !auth.isSuperAdmin) return '/dashboard'

  // Super Admin bypasses all other permission checks
  if (auth.isSuperAdmin) return true

  // Check route permissions (OR logic — any perm passes)
  const perms = to.meta.perms
  if (perms && perms.length > 0) {
    const hasAny = perms.some(p => auth.can(p))
    if (!hasAny) return '/dashboard'
  }

  return true
})

export default router
