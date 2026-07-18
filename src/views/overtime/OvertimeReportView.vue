<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Report Overtime</h1>
      <p class="text-sm text-gray-500 mt-0.5">Overtime by staff member for the selected period</p>
    </div>

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
      <div class="w-44">
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" all-label="All branches" @update:modelValue="reload" />
      </div>
      <button @click="resetFilters" class="btn-secondary btn-sm">This Month</button>
    </div>

    <div v-if="loading" class="card p-10 text-center text-gray-400">Loading…</div>
    <div v-else-if="!groups.length" class="card p-10 text-center text-gray-400">No overtime requests in this period</div>

    <template v-else>
      <!-- Summary overview -->
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">User</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="g in groups" :key="g.userId" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-800">{{ g.userName }}</td>
              <td class="table-cell text-sm text-gray-600">{{ g.branchNames }}</td>
              <td class="table-cell text-sm font-medium text-primary-600">{{ fmtDuration(g.totalHours) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-6">
      <div v-for="g in groups" :key="g.userId">
        <h2 class="text-lg font-semibold text-primary-600 mb-2">{{ g.userName }}</h2>
        <div class="card overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header">Date</th>
                <th class="table-header">From Time</th>
                <th class="table-header">To Time</th>
                <th class="table-header">Reason</th>
                <th class="table-header">Status</th>
                <th class="table-header">Created Date</th>
                <th class="table-header">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="r in g.rows" :key="r.id" class="hover:bg-gray-50/60">
                <td class="table-cell text-sm text-gray-800 whitespace-nowrap">{{ fmtDateMonth(r.date) }}</td>
                <td class="table-cell text-sm text-gray-700">{{ fmtTime(r.start_time) || '—' }}</td>
                <td class="table-cell text-sm text-gray-700">{{ fmtTime(r.end_time) || '—' }}</td>
                <td class="table-cell text-sm text-gray-500 max-w-64 truncate">{{ r.reason || '—' }}</td>
                <td class="table-cell text-sm">{{ r.status }}</td>
                <td class="table-cell text-sm">{{ fmtDatetime(r.created_at) }}</td>
                <td class="table-cell text-sm text-gray-700">{{ fmtDuration(r.duration) }}</td>
              </tr>
              <tr>
                <td colspan="5" class="table-cell text-sm text-primary-600 font-medium">Total: {{ fmtDuration(g.totalHours) }}</td>
                <td class="table-cell"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getOvertimeRequests } from '@/api/overtime-requests'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { fmtDateMonth,fmtTime,fmtDatetime } from '@/utils/datetime'
function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function lastDayOfMonth() {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}
// Matches the "30m" / "2h" / "1h 30m" style from the reference layout.
function fmtDuration(hours) {
  if (hours == null) return '—'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const items   = ref([])
const loading = ref(false)

const filters = ref({ date_from: firstDayOfMonth(), date_to: lastDayOfMonth(), user_id: null, branch_id: null })
const users = ref([])
const branches = ref([])

// One section per user, each with its own rows and a summed total —
// matches the reference layout (name heading, table, "Total: X" row).
const groups = computed(() => {
  const byUser = new Map()
  for (const r of items.value) {
    const key = r.user_id
    if (!byUser.has(key)) {
      byUser.set(key, { userId: key, userName: r.user?.name || '—', branches: new Set(), rows: [], totalHours: 0 })
    }
    const g = byUser.get(key)
    g.rows.push(r)
    g.totalHours += Number(r.duration) || 0
    if (r.branch?.name) g.branches.add(r.branch.name)
  }
  return [...byUser.values()]
    .map(g => ({ ...g, branchNames: [...g.branches].join(', ') || '—' }))
    .sort((a, b) => a.userName.localeCompare(b.userName))
})

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 500 }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getOvertimeRequests(params)
    items.value = (res.data?.items || []).filter(r => r.status === 'approved' || r.status === 'pending')
  } catch { items.value = [] } finally { loading.value = false }
}

function reload() { load() }
function resetFilters() {
  filters.value = { date_from: firstDayOfMonth(), date_to: lastDayOfMonth(), user_id: null, branch_id: null }
  reload()
}

onMounted(async () => {
  load()
  try {
    const res = await getUsersInScope()
    users.value = (res.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email }))
  } catch {}
  try {
    const res = await getBranches({ show_all: false })
    branches.value = (res.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
  } catch {}
})
</script>