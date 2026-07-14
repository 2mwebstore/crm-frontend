<template>
  <div class="space-y-5">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Audit Log</h1>
        <p class="text-sm text-gray-500 mt-0.5">Every user action, by branch — created/updated/deleted records, top-ups, shifts, and more</p>
      </div>
      <div v-if="canDelete" class="flex items-center gap-2">
        <span class="text-xs text-gray-400">Delete entries older than:</span>
        <button @click="confirmDelete('week')" class="btn-secondary btn-sm">Last Week</button>
        <button @click="confirmDelete('month')" class="btn-secondary btn-sm">Last Month</button>
      </div>
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
        <label class="label text-xs">User</label>
        <SearchableSelect v-model="filters.user_id" :options="users" placeholder="All users" all-label="All users" @update:modelValue="reload" />
      </div>
      <div v-if="branches.length > 1" class="w-44">
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" all-label="All branches" @update:modelValue="reload" />
      </div>
      <div class="w-36">
        <label class="label text-xs">Method</label>
        <SearchableSelect v-model="filters.method" :options="methodOpts" value-key="id" label-key="name" placeholder="All methods" all-label="All methods" @update:modelValue="reload" />
      </div>
      <div class="w-56">
        <label class="label text-xs">Path contains</label>
        <input v-model="filters.search" @keyup.enter="reload" type="text" class="input" placeholder="e.g. /deposits" />
      </div>
      <button @click="reload" class="btn-secondary btn-sm">Search</button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header"></th>
              <th class="table-header">Date/Time</th>
              <th class="table-header">User</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Method</th>
              <th class="table-header">Path</th>
              <th class="table-header">Status</th>
              <th class="table-header">IP</th>
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
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">No actions found</td>
            </tr>
            <template v-else v-for="row in items" :key="row.id">
              <tr class="hover:bg-gray-50/60 transition-colors">
                <td class="table-cell">
                  <button v-if="row.request_body" @click="toggleRow(row.id)" class="btn-icon">
                    <ChevronRightIcon class="w-4 h-4 transition-transform" :class="{ 'rotate-90': expandedRows.has(row.id) }" />
                  </button>
                </td>
                <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
                <td class="table-cell text-sm text-gray-800">{{ row.user?.name || '—' }}</td>
                <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
                <td class="table-cell">
                  <span :class="['badge', methodBadge(row.method)]">{{ row.method }}</span>
                </td>
                <td class="table-cell font-mono text-xs text-gray-600">{{ row.path }}</td>
                <td class="table-cell">
                  <span :class="['badge', row.status_code < 400 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">{{ row.status_code }}</span>
                </td>
                <td class="table-cell text-xs text-gray-400 font-mono whitespace-nowrap">{{ row.ip_address || '—' }}</td>
              </tr>
              <tr v-if="expandedRows.has(row.id) && row.request_body" class="bg-gray-50/60">
                <td></td>
                <td colspan="7" class="px-4 pb-3">
                  <p class="text-xs font-semibold text-gray-500 mt-2 mb-1">Request body</p>
                  <pre class="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto font-mono text-gray-700">{{ prettyBody(row.request_body) }}</pre>
                  <p v-if="row.user_agent" class="text-xs text-gray-400 mt-2">{{ row.user_agent }}</p>
                </td>
              </tr>
            </template>
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

    <ConfirmDialog v-model="deleteDialog" :message="deleteMessage" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { getAuditLogs, deleteOldAuditLogs } from '@/api/audit-logs'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()
const canDelete = computed(() => auth.isSuperAdmin || auth.can('audit_logs.delete'))

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => meta.value ? Math.max(1, Math.ceil(meta.value.total / pageSize.value)) : 1)

const filters = ref({ date_from: '', date_to: '', user_id: null, branch_id: null, method: null, search: '' })
const users = ref([])
const branches = ref([])
const methodOpts = [
  { id: 'POST',   name: 'POST (Create)' },
  { id: 'PUT',    name: 'PUT (Update)' },
  { id: 'PATCH',  name: 'PATCH (Update)' },
  { id: 'DELETE', name: 'DELETE' },
]

function methodBadge(method) {
  switch (method) {
    case 'POST':   return 'bg-emerald-100 text-emerald-700'
    case 'PUT':
    case 'PATCH':  return 'bg-blue-100 text-blue-700'
    case 'DELETE': return 'bg-red-100 text-red-700'
    default:       return 'bg-gray-100 text-gray-600'
  }
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') +
    ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

// Request bodies are stored as a single-line JSON string (with sensitive
// fields already redacted server-side) — pretty-print for readability,
// falling back to the raw string if it's somehow not valid JSON (e.g. was
// truncated at the backend's length cap).
function prettyBody(raw) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const expandedRows = ref(new Set())
function toggleRow(id) {
  const next = new Set(expandedRows.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedRows.value = next
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    if (filters.value.method)    params.method    = filters.value.method
    if (filters.value.search)    params.search    = filters.value.search
    const res = await getAuditLogs(params)
    items.value = res.data?.items || []
    meta.value  = { total: res.data?.total || 0 }
  } catch { items.value = []; meta.value = { total: 0 } } finally { loading.value = false }
}

function reload()          { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function onPageSizeChange() { page.value = 1; load() }
function resetFilters() {
  filters.value = {
    date_from: '', date_to: '', user_id: null, method: null, search: '',
    // Keep the single-branch default — the filter is hidden in that case
    // (see the v-if above), so clearing it here would leave no way to
    // set it back.
    branch_id: branches.value.length === 1 ? branches.value[0].id : null,
  }
  reload()
}

// Delete-old-entries — a destructive bulk action, so it goes through the
// same ConfirmDialog pattern used everywhere else in this app rather than
// executing immediately on click.
const deleteDialog = ref(false)
const pendingDeletePeriod = ref(null)
const deleteMessage = computed(() =>
  `Permanently delete every audit log entry older than the last ${pendingDeletePeriod.value}? This cannot be undone.`
)
function confirmDelete(period) {
  pendingDeletePeriod.value = period
  deleteDialog.value = true
}
async function doDelete() {
  try {
    const res = await deleteOldAuditLogs(pendingDeletePeriod.value)
    success(`Deleted ${res.data?.deleted ?? 0} entries`)
    reload()
  } catch (e) {
    error(e?.error || 'Failed to delete old entries')
  }
}

onMounted(async () => {
  try {
    const res = await getUsersInScope()
    users.value = (res.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email }))
  } catch {}
  try {
    const res = await getBranches({ show_all: false })
    branches.value = (res.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
    // Only one branch in scope — select it by default and hide the
    // filter entirely (see the v-if on the Branch filter above), since
    // there's nothing meaningful to choose between.
    if (branches.value.length === 1) {
      filters.value.branch_id = branches.value[0].id
    }
  } catch {}
  load()
})
</script>