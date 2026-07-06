<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Dashboard</h1>
      <p class="text-sm text-gray-500 mt-0.5">Welcome back, {{ auth.user?.name }}</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="s in stats" :key="s.label" class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ s.label }}</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">{{ s.value }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ s.sub }}</p>
          </div>
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.color]">
            <component :is="s.icon" class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Two columns: recent clients + recent ICs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent clients -->
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Recent Clients</h2>
          <RouterLink to="/clients" class="text-xs font-medium" style="color:#938af4">View all →</RouterLink>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-if="loadingClients" class="flex items-center justify-center py-8 text-gray-400 text-sm">Loading…</div>
          <div v-else-if="!recentClients.length" class="flex items-center justify-center py-8 text-gray-400 text-sm">No clients yet</div>
          <RouterLink
            v-for="c in recentClients"
            :key="c.id"
            :to="`/clients/${c.id}`"
            class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style="background:#938af4">
              {{ c.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ c.name }}</p>
              <p class="text-xs text-gray-400">{{ c.code }} · {{ c.status }}</p>
            </div>
            <span :class="['badge text-xs', c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
              {{ c.is_active ? 'Active' : 'Inactive' }}
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- Recent interesting clients -->
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Recent Interesting Clients</h2>
          <RouterLink to="/interesting-clients" class="text-xs font-medium" style="color:#938af4">View all →</RouterLink>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-if="loadingICs" class="flex items-center justify-center py-8 text-gray-400 text-sm">Loading…</div>
          <div v-else-if="!recentICs.length" class="flex items-center justify-center py-8 text-gray-400 text-sm">No records yet</div>
          <RouterLink
            v-for="ic in recentICs"
            :key="ic.id"
            :to="`/interesting-clients/${ic.id}`"
            class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-amber-400">
              {{ ic.full_name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ ic.full_name }}</p>
              <p class="text-xs text-gray-400">{{ ic.code }} · Score: {{ ic.interest_score }}</p>
            </div>
            <span :class="['badge text-xs', priorityColor(ic.priority)]">{{ ic.priority }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Two columns: recent deposits + recent withdrawals -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent deposits -->
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Recent Deposits</h2>
          <RouterLink to="/deposits" class="text-xs font-medium" style="color:#938af4">View all →</RouterLink>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-if="loadingDeposits" class="flex items-center justify-center py-8 text-gray-400 text-sm">Loading…</div>
          <div v-else-if="!recentDeposits.length" class="flex items-center justify-center py-8 text-gray-400 text-sm">No deposits yet</div>
          <RouterLink
            v-for="d in recentDeposits"
            :key="d.id"
            :to="`/deposits/${d.id}`"
            class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
              <ArrowDownTrayIcon class="w-4 h-4 text-green-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 font-mono">{{ d.transaction_no }}</p>
              <p class="text-xs text-gray-400 truncate">{{ d.client?.name }} · {{ fmtDate(d.date) }}</p>
            </div>
            <span class="text-sm font-semibold" style="color:#938af4">{{ fmtCurrency(d.amount, d.currency) }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Recent withdrawals -->
      <div class="card">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Recent Withdrawals</h2>
          <RouterLink to="/withdrawals" class="text-xs font-medium" style="color:#938af4">View all →</RouterLink>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-if="loadingWithdrawals" class="flex items-center justify-center py-8 text-gray-400 text-sm">Loading…</div>
          <div v-else-if="!recentWithdrawals.length" class="flex items-center justify-center py-8 text-gray-400 text-sm">No withdrawals yet</div>
          <RouterLink
            v-for="w in recentWithdrawals"
            :key="w.id"
            :to="`/withdrawals/${w.id}`"
            class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100">
              <ArrowUpTrayIcon class="w-4 h-4 text-orange-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 font-mono">{{ w.transaction_no }}</p>
              <p class="text-xs text-gray-400 truncate">{{ w.client?.name }} · {{ fmtDate(w.date) }}</p>
            </div>
            <span class="text-sm font-semibold text-orange-600">-{{ fmtCurrency(w.amount, w.currency) }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getClients } from '@/api/clients'
import { getICs } from '@/api/interesting-clients'
import { getDeposits, getWithdrawals } from '@/api/transactions'
import {
  UserGroupIcon, StarIcon, ArrowDownTrayIcon, ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const recentClients     = ref([])
const recentICs         = ref([])
const recentDeposits    = ref([])
const recentWithdrawals = ref([])
const loadingClients     = ref(true)
const loadingICs         = ref(true)
const loadingDeposits    = ref(true)
const loadingWithdrawals = ref(true)

const stats = ref([
  { label: 'Total Clients',      value: '—', sub: 'All time',          icon: UserGroupIcon,    color: 'bg-primary' },
  { label: 'Interesting Clients', value: '—', sub: 'Not converted',     icon: StarIcon,         color: 'bg-amber-400' },
  { label: 'Total Deposits',     value: '—', sub: 'All time',          icon: ArrowDownTrayIcon, color: 'bg-green-500' },
  { label: 'Total Withdrawals',  value: '—', sub: 'All time',          icon: ArrowUpTrayIcon,   color: 'bg-orange-500' },
])

function priorityColor(p) {
  return { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' }[p] || 'bg-gray-100 text-gray-600'
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—' }

function fmtCurrency(val, cur) {
  if (cur === 'KHR') return Number(val || 0).toLocaleString() + '៛'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)
}

onMounted(async () => {
  // Clients
  try {
    const res = await getClients({ page: 1, page_size: 5, sort_by: 'created_at', sort_dir: 'desc' })
    recentClients.value = res.data || []
    stats.value[0].value = res.meta?.total_items ?? '—'
  } catch { } finally { loadingClients.value = false }

  // Interesting clients
  try {
    const res = await getICs({ page: 1, page_size: 5, sort_by: 'created_at', sort_dir: 'desc' })
    recentICs.value = res.data || []
    stats.value[1].value = res.meta?.total_items ?? '—'
  } catch { } finally { loadingICs.value = false }

  // Deposits
  try {
    const res = await getDeposits({ page: 1, page_size: 5, sort_by: 'date', sort_dir: 'desc' })
    recentDeposits.value = res.data || []
    stats.value[2].value = res.meta?.total_items ?? '—'
  } catch { } finally { loadingDeposits.value = false }

  // Withdrawals
  try {
    const res = await getWithdrawals({ page: 1, page_size: 5, sort_by: 'date', sort_dir: 'desc' })
    recentWithdrawals.value = res.data || []
    stats.value[3].value = res.meta?.total_items ?? '—'
  } catch { } finally { loadingWithdrawals.value = false }
})
</script>
