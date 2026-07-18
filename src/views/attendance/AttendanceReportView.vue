<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Report Attendance</h1>
      <p class="text-sm text-gray-500 mt-0.5">Check-in/check-out summary for the selected period</p>
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

    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wide">Total Records</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ items.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wide">Late Check-ins</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ countByCheckInStatus('late') }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wide">On Time</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">{{ countByCheckInStatus('good') }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wide">Still In</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ stillInCount }}</p>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Date</th>
              <th class="table-header">User</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Check In</th>
              <th class="table-header">Check Out</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="5" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="5" class="table-cell text-center py-10 text-gray-400">No attendance records in this period</td>
            </tr>
            <tr v-else v-for="row in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell font-medium text-gray-800">{{ fmtDateOnly(row.date) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.user?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm">
                <span v-if="row.check_in_at" class="text-gray-700">{{ fmtDatetime(row.check_in_at) }}</span>
                <span v-else class="text-gray-300">—</span>
                <span v-if="row.check_in_status" :class="['badge ml-1', checkInStatusBadge(row.check_in_status)]">{{ checkInStatusLabel(row.check_in_status) }}</span>
              </td>
              <td class="table-cell text-sm">
                <span v-if="row.check_out_at" class="text-gray-700">{{ fmtDatetime(row.check_out_at) }}</span>
                <span v-else class="badge bg-amber-100 text-amber-700">Still In</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getAttendanceList } from '@/api/attendance'
import { fmtDatetime } from '@/utils/datetime'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function lastDayOfMonth() {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}

const items   = ref([])
const loading = ref(false)

const filters = ref({ date_from: firstDayOfMonth(), date_to: lastDayOfMonth(), user_id: null, branch_id: null })
const users = ref([])
const branches = ref([])

function countByCheckInStatus(s) { return items.value.filter(r => r.check_in_status === s).length }
const stillInCount = computed(() => items.value.filter(r => r.check_in_at && !r.check_out_at).length)

function fmtDateOnly(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
}
function checkInStatusLabel(s) {
  return s === 'early' ? 'Early' : s === 'good' ? 'On Time' : s === 'late' ? 'Late' : ''
}
function checkInStatusBadge(s) {
  switch (s) {
    case 'early': return 'bg-blue-100 text-blue-700'
    case 'good':  return 'bg-emerald-100 text-emerald-700'
    case 'late':  return 'bg-red-100 text-red-700'
    default:      return 'bg-gray-100 text-gray-600'
  }
}

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 500 }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getAttendanceList(params)
    items.value = res.data?.items || []
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
