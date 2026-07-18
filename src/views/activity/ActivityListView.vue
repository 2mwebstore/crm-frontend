<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Activity Requests</h1>
      <p class="text-sm text-gray-500 mt-0.5">Activity requests from all staff — always auto-approved on submission</p>
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
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">User</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Date</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="5" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="5" class="table-cell text-center py-10 text-gray-400">No activity requests found</td>
            </tr>
            <tr v-else v-for="r in items" :key="r.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-800">{{ r.user?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ r.branch?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ r.date }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-64 truncate">{{ r.reason || '—' }}</td>
              <td class="table-cell"><span class="badge bg-emerald-100 text-emerald-700">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getActivityRequests } from '@/api/activity-requests'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'

const items   = ref([])
const loading = ref(false)

const filters = ref({ date_from: '', date_to: '', user_id: null, branch_id: null })
const users = ref([])
const branches = ref([])

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 100 }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getActivityRequests(params)
    items.value = res.data?.items || []
  } catch { items.value = [] } finally { loading.value = false }
}

function reload() { load() }
function resetFilters() {
  filters.value = { date_from: '', date_to: '', user_id: null, branch_id: null }
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
