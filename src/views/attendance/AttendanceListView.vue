<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">List Attendance</h1>
      <p class="text-sm text-gray-500 mt-0.5">Check-in/check-out records across all staff and branches</p>
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
      <label class="flex items-center gap-2 text-xs text-gray-600 mb-1.5">
        <input type="checkbox" v-model="filters.outdoorOnly" @change="reload" class="accent-primary" />
        Outdoor Activity only
      </label>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
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
              <th class="table-header">Status</th>
              <th class="table-header">Check Out</th>
              <th class="table-header">Note</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">No records found</td>
            </tr>
            <tr v-else v-for="row in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell font-medium text-gray-800">{{ fmtDateOnly(row.date) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.user?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm">
                <span v-if="row.check_in_at" class="text-gray-700">{{ fmtDatetime(row.check_in_at) }}</span>
                <span v-else class="text-gray-300">—</span>
                <span v-if="row.check_in_distance != null" class="text-xs text-gray-400 ml-1">({{ Math.round(row.check_in_distance) }}m)</span>
                <a v-if="row.check_in_lat != null" :href="mapUrl(row.check_in_lat, row.check_in_lng)" target="_blank" rel="noopener" class="inline-block align-middle ml-1 text-primary-500 hover:text-primary-700" title="Open in map">
                  <MapPinIcon class="w-3.5 h-3.5" />
                </a>
                <span v-if="row.check_in_via_outdoor" class="badge ml-1 bg-purple-100 text-purple-700">Outdoor</span>
                <p v-if="row.check_in_reason" class="text-xs text-gray-400 mt-0.5 max-w-40 truncate">{{ row.check_in_reason }}</p>
              </td>
              <td class="table-cell">
                <span v-if="row.check_in_status" :class="['badge', checkInStatusBadge(row.check_in_status)]">{{ checkInStatusLabel(row.check_in_status) }}</span>
                <span v-else class="text-gray-300 text-sm">—</span>
              </td>
              <td class="table-cell text-sm">
                <span v-if="row.check_out_at" class="text-gray-700">{{ fmtDatetime(row.check_out_at) }}</span>
                <span v-else class="text-gray-300">—</span>
                <span v-if="row.check_out_distance != null" class="text-xs text-gray-400 ml-1">({{ Math.round(row.check_out_distance) }}m)</span>
                <a v-if="row.check_out_lat != null" :href="mapUrl(row.check_out_lat, row.check_out_lng)" target="_blank" rel="noopener" class="inline-block align-middle ml-1 text-primary-500 hover:text-primary-700" title="Open in map">
                  <MapPinIcon class="w-3.5 h-3.5" />
                </a>
                <span v-if="row.check_out_status" :class="['badge ml-1', checkInStatusBadge(row.check_out_status)]">{{ checkInStatusLabel(row.check_out_status) }}</span>
                <span v-if="row.check_out_via_outdoor" class="badge ml-1 bg-purple-100 text-purple-700">Outdoor</span>
                <p v-if="row.check_out_reason" class="text-xs text-gray-400 mt-0.5 max-w-40 truncate">{{ row.check_out_reason }}</p>
              </td>
              <td class="table-cell">
                <span v-if="!row.check_out_at && row.check_in_at" class="badge bg-amber-100 text-amber-700">Still In</span>
              </td>
              <td class="table-cell text-right">
                <button v-if="canEdit" @click="openEdit(row)" class="btn-icon" title="Edit check-in/check-out"><PencilIcon class="w-4 h-4" /></button>
              </td>
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

    <!-- Edit check-in/check-out modal -->
    <AppModal v-model="editModal" title="Edit Attendance" size="sm">
      <p class="text-sm text-gray-500 mb-4">{{ editTarget?.user?.name }} — {{ fmtDateOnly(editTarget?.date) }}</p>
      <div class="space-y-4">
        <div>
          <label class="label">Check In</label>
          <input v-model="editForm.check_in_at" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="label">Check Out</label>
          <input v-model="editForm.check_out_at" type="datetime-local" class="input" />
        </div>
        <p class="text-xs text-gray-400">Status labels (Early/On Time/Late) are recalculated automatically based on the new time and this user's shift.</p>
      </div>
      <template #footer>
        <button @click="editModal = false" class="btn-secondary">Cancel</button>
        <button @click="submitEdit" class="btn-primary" :disabled="savingEdit">
          {{ savingEdit ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import AppModal from '@/components/common/AppModal.vue'
import { getAttendanceList, updateAttendance } from '@/api/attendance'
import { fmtDatetime } from '@/utils/datetime'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()
const canEdit = computed(() => auth.isSuperAdmin || auth.can('attendance.edit'))

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => meta.value ? Math.max(1, Math.ceil(meta.value.total / pageSize.value)) : 1)

const filters = ref({ date_from: '', date_to: '', user_id: null, branch_id: null, outdoorOnly: false })
const users = ref([])
const branches = ref([])

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
function mapUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// Extracts "YYYY-MM-DDTHH:MM" directly from the raw ISO-ish string via
// regex, rather than going through `new Date()` — the raw value already
// carries the Cambodia offset (+07:00), so slicing it directly preserves
// exactly the wall-clock time as recorded, regardless of what timezone
// the browser viewing this happens to be in.
function toDatetimeLocalValue(v) {
  if (!v) return ''
  const match = String(v).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return match ? `${match[1]}T${match[2]}` : ''
}

const editModal = ref(false)
const editTarget = ref(null)
const editForm = ref({ check_in_at: '', check_out_at: '' })
const savingEdit = ref(false)
function openEdit(row) {
  editTarget.value = row
  editForm.value = {
    check_in_at: toDatetimeLocalValue(row.check_in_at),
    check_out_at: toDatetimeLocalValue(row.check_out_at),
  }
  editModal.value = true
}
async function submitEdit() {
  savingEdit.value = true
  try {
    await updateAttendance(editTarget.value.id, {
      check_in_at: editForm.value.check_in_at,
      check_out_at: editForm.value.check_out_at,
    })
    success('Attendance updated')
    editModal.value = false
    await load()
  } catch (e) {
    error(e?.error || 'Failed to update attendance')
  } finally { savingEdit.value = false }
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    if (filters.value.outdoorOnly) params.outdoor_only = true
    const res = await getAttendanceList(params)
    items.value = res.data?.items || []
    meta.value  = { total: res.data?.total || 0 }
  } catch { items.value = []; meta.value = { total: 0 } } finally { loading.value = false }
}

function reload()          { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function onPageSizeChange() { page.value = 1; load() }
function resetFilters() {
  filters.value = { date_from: '', date_to: '', user_id: null, branch_id: null, outdoorOnly: false }
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