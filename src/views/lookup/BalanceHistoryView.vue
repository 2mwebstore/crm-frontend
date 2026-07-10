<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></button>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">{{ label }} History</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ contextName }} <span v-if="contextCode" class="font-mono">· {{ contextCode }}</span></p>
      </div>
    </div>

    <!-- Context card -->
    <div class="card p-4 flex flex-wrap items-center gap-6">
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wide">Currency</p>
        <p class="font-mono text-sm text-gray-700 mt-0.5">{{ contextCurrency || '—' }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wide">Current {{ label }}</p>
        <p class="font-mono font-semibold text-gray-800 mt-0.5">
          {{ Number(contextBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-400 uppercase tracking-wide">Total Transactions</p>
        <p class="font-mono text-sm text-gray-700 mt-0.5">{{ meta?.total ?? 0 }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === tab.id
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="label text-xs">Date Range</label>
        <DateRangePicker
          :model-value="[filters.date_from, filters.date_to]"
          @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; reload() }"
        />
      </div>
      <div class="w-44">
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" all-label="All users" @update:modelValue="reload" />
      </div>
      <SearchableSelect v-model="typeFilter" :options="typeOpts" value-key="id" label-key="name" placeholder="All types" all-label="All types" class="w-40" @update:modelValue="reload" />
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Date</th>
              <th class="table-header">Type</th>
              <th class="table-header text-right">Old</th>
              <th class="table-header text-right">Amount</th>
              <th class="table-header text-right">New</th>
              <th class="table-header">By</th>
              <th class="table-header">Remark</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="table-cell text-center py-10">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">No transactions found</td>
            </tr>
            <tr v-else v-for="(tx, idx) in items" :key="tx.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (page - 1) * pageSize + idx + 1 }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(tx.created_at) }}</td>
              <td class="table-cell">
                <span :class="['badge', tx.type === 'withdrawal' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700']">
                  {{ typeLabel(tx.type) }}
                </span>
              </td>
              <td class="table-cell text-right font-mono text-sm text-gray-500">
                {{ Number(tx.old_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </td>
              <td class="table-cell text-right font-mono text-sm" :class="tx.type === 'withdrawal' ? 'text-orange-600' : 'text-emerald-600'">
                {{ tx.type === 'withdrawal' ? '-' : '+' }}{{ Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </td>
              <td class="table-cell text-right font-mono text-sm font-semibold text-gray-800">
                {{ Number(tx.new_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ tx.created_by?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-500">{{ tx.remark || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span>Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, meta.total) }} of {{ meta.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" @click="goPage(page - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="goPage(page + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import { getBalanceTransactions } from '@/api/lookup'
import { getUsersInScope } from '@/api/users'

const route = useRoute()
const router = useRouter()

const entityType = route.params.entityType
const entityId   = route.params.entityId

// Context passed via query from the list view (name/code/currency/balance of
// the entity at the moment the History button was clicked). This avoids an
// extra API call for the common case (navigating from the list), at the
// cost of these fields being blank if the page is opened via a bare/shared
// URL without the query params — the transaction table itself still loads
// correctly either way since that always comes from the API.
const label           = route.query.label || 'Balance'
const contextName      = route.query.name || ''
const contextCode      = route.query.code || ''
const contextCurrency  = route.query.currency || ''
const contextBalance   = route.query.balance ?? 0

// Two tabs, each mapping straight to a BalanceTransaction `source` value —
// "Top Up / Withdraw" is routine business (source=configuration), while
// "Adjustment" is a manual correction (source=adjustment). These are
// mutually exclusive on the backend, so switching tabs is really just
// swapping which source filter gets sent.
const tabs = [
  { id: 'configuration', label: 'Top Up / Withdraw' },
  { id: 'adjustment',    label: 'Adjustment' },
]
const activeTab = ref('configuration')

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(20)
const typeFilter = ref(null)
const filters = ref({ date_from: '', date_to: '', created_by_id: null })
const users = ref([])

const typeOpts = [
  { id: 'topup', name: 'Top Up' },
  { id: 'withdrawal', name: 'Withdrawal' },
]

// Adjustment ledger rows are stored with the same underlying topup/
// withdrawal type as ordinary ones — label them Addition/Subtraction on
// that tab instead, since that's the language used when creating them.
function typeLabel(txType) {
  if (activeTab.value === 'adjustment') {
    return txType === 'withdrawal' ? 'Subtraction' : 'Addition'
  }
  return txType === 'withdrawal' ? 'Withdraw' : 'Top Up'
}

const totalPages = computed(() => meta.value ? Math.max(1, Math.ceil(meta.value.total / pageSize.value)) : 1)

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') +
    ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, source: activeTab.value }
    if (typeFilter.value) params.type = typeFilter.value
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.created_by_id) params.created_by_id = filters.value.created_by_id
    const res = await getBalanceTransactions(entityType, entityId, params)
    items.value = res.data?.items || []
    meta.value  = { total: res.data?.total || 0 }
  } catch { items.value = []; meta.value = { total: 0 } } finally { loading.value = false }
}

function reload()          { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function onPageSizeChange() { page.value = 1; load() }
function resetFilters()     { typeFilter.value = null; filters.value = { date_from: '', date_to: '', created_by_id: null }; reload() }
function switchTab(id)      { if (activeTab.value === id) return; activeTab.value = id; resetFilters() }
function goBack()           { router.back() }

onMounted(async () => {
  load()
  try {
    const res = await getUsersInScope()
    users.value = (res.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email }))
  } catch {}
})
</script>