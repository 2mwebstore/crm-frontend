<template>
  <div class="space-y-5">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Schedule Overrides</h1>
        <p class="text-sm text-gray-500 mt-0.5">Temporarily change a staff member's shift times for a date range</p>
      </div>
      <button v-if="canCreate" @click="openCreate" class="btn-primary flex items-center gap-1.5">
        <PlusIcon class="w-4 h-4" /> Add Override
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap items-end gap-3">
      <div class="w-56">
        <label class="label text-xs">Search</label>
        <input v-model="filters.search" @keyup.enter="reload" type="text" class="input" placeholder="Name or email…" />
      </div>
      <div class="w-56">
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" all-label="All branches" @update:modelValue="reload" />
      </div>
      <button @click="reload" class="btn-secondary btn-sm">Search</button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- List -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Staff</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Dates</th>
              <th class="table-header">Shift In</th>
              <th class="table-header">Shift Out</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Created By</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">No schedule overrides found</td>
            </tr>
            <tr v-else v-for="o in items" :key="o.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-800">{{ o.user?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ (o.user?.branches || []).map(b => b.name).join(', ') || '—' }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(o.date_from) }}<span v-if="toDateOnly(o.date_to) !== toDateOnly(o.date_from)"> → {{ fmtDate(o.date_to) }}</span></td>
              <td class="table-cell text-sm text-gray-700">{{ o.shift_check_in_time ? fmtTime(o.shift_check_in_time) : '—' }}</td>
              <td class="table-cell text-sm text-gray-700">{{ o.shift_check_out_time ? fmtTime(o.shift_check_out_time) : '—' }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-48 truncate">{{ o.reason || '—' }}</td>
              <td class="table-cell text-sm text-gray-500">{{ o.created_by?.name || '—' }}</td>
              <td class="table-cell text-right">
                <div class="flex justify-end gap-1">
                  <button v-if="canEdit" @click="openEdit(o)" class="btn-icon" title="Edit"><PencilIcon class="w-4 h-4" /></button>
                  <button v-if="canDelete" @click="openDelete(o)" class="btn-icon text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
                </div>
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

    <!-- Create/Edit modal -->
    <AppModal v-model="modal" :title="editing ? 'Edit Override' : 'Add Override'">
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Staff Member <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="form.user_id" :options="users" placeholder="Select a user" />
        </div>
        <div class="col-span-2">
          <label class="label">Date From <span class="text-red-500">*</span> — Date To <span class="text-red-500">*</span></label>
          <DateRangePicker
            :model-value="[form.date_from, form.date_to]"
            @update:model-value="v => { form.date_from = v[0]; form.date_to = v[1] }"
          />
        </div>
        <div>
          <label class="label">Shift In Time</label>
          <TimePicker v-model="form.shift_check_in_time" placeholder="Check-in time" class="w-full" />
        </div>
        <div>
          <label class="label">Shift Out Time</label>
          <TimePicker v-model="form.shift_check_out_time" placeholder="Check-out time" class="w-full" />
        </div>
        <p class="col-span-2 text-xs text-gray-400 -mt-1">Leave either time blank to keep that side at the user's normal shift time — you don't have to override both.</p>
        <div class="col-span-2">
          <label class="label">Reason</label>
          <textarea v-model="form.reason" class="input resize-none" rows="2" placeholder="e.g. Covering the evening shift this week" />
        </div>
      </div>
      <template #footer>
        <button @click="modal = false" class="btn-secondary">Cancel</button>
        <button @click="submit" class="btn-primary" :disabled="submitting || !canSubmit">
          {{ submitting ? 'Saving…' : (editing ? 'Save' : 'Add Override') }}
        </button>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" message="Delete this schedule override? This can't be undone." @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import TimePicker from '@/components/ui/TimePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { getScheduleOverrides, createScheduleOverride, updateScheduleOverride, deleteScheduleOverride } from '@/api/schedule-overrides'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()
const canCreate = computed(() => auth.isSuperAdmin || auth.can('schedule_overrides.create'))
const canEdit   = computed(() => auth.isSuperAdmin || auth.can('schedule_overrides.edit'))
const canDelete = computed(() => auth.isSuperAdmin || auth.can('schedule_overrides.delete'))

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => meta.value ? Math.max(1, Math.ceil(meta.value.total / pageSize.value)) : 1)

const filters = ref({ search: '', branch_id: null })
const users = ref([])
const branches = ref([])

// The date columns can come back from the backend as either a clean
// "2026-06-30" or, due to a MySQL driver quirk on DATE columns (parseTime
// round-tripping through time.Time), "2026-06-30T00:00:00+07:00" — this
// strips anything after a "T" so both forms display the same way, and so
// the value going INTO DateRangePicker on edit is always a clean date,
// never the raw timestamp string.
function toDateOnly(v) {
  if (!v) return ''
  return String(v).split('T')[0]
}
function fmtDate(v) {
  const d = toDateOnly(v)
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}-${m}-${y}`
}
function fmtTime(v) {
  if (!v) return ''
  const [hStr, mStr] = v.split(':')
  let h24 = Number(hStr)
  const p = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${mStr} ${p}`
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.search)    params.search    = filters.value.search
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getScheduleOverrides(params)
    items.value = res.data?.items || []
    meta.value  = { total: res.data?.total || 0 }
  } catch { items.value = []; meta.value = { total: 0 } } finally { loading.value = false }
}

function reload()          { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function onPageSizeChange() { page.value = 1; load() }
function resetFilters() {
  filters.value = { search: '', branch_id: null }
  reload()
}

function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const modal = ref(false)
const editing = ref(null)
const form = ref({ user_id: null, date_from: todayDateString(), date_to: todayDateString(), shift_check_in_time: '', shift_check_out_time: '', reason: '' })
const submitting = ref(false)
const canSubmit = computed(() =>
  !!form.value.user_id && !!form.value.date_from && !!form.value.date_to &&
  (!!form.value.shift_check_in_time || !!form.value.shift_check_out_time)
)

function openCreate() {
  editing.value = null
  form.value = { user_id: null, date_from: todayDateString(), date_to: todayDateString(), shift_check_in_time: '', shift_check_out_time: '', reason: '' }
  modal.value = true
}
function openEdit(o) {
  editing.value = o
  form.value = {
    user_id: o.user_id,
    date_from: toDateOnly(o.date_from),
    date_to: toDateOnly(o.date_to),
    shift_check_in_time: o.shift_check_in_time || '',
    shift_check_out_time: o.shift_check_out_time || '',
    reason: o.reason || '',
  }
  modal.value = true
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      user_id: form.value.user_id,
      date_from: form.value.date_from,
      date_to: form.value.date_to,
      shift_check_in_time: form.value.shift_check_in_time || null,
      shift_check_out_time: form.value.shift_check_out_time || null,
      reason: form.value.reason,
    }
    if (editing.value) { await updateScheduleOverride(editing.value.id, payload); success('Override updated') }
    else                { await createScheduleOverride(payload);                    success('Override added') }
    modal.value = false
    await load()
  } catch (e) {
    error(e?.error || 'Failed to save override')
  } finally { submitting.value = false }
}

const deleteDialog = ref(false)
const deleteTarget = ref(null)
function openDelete(o) {
  deleteTarget.value = o
  deleteDialog.value = true
}
async function doDelete() {
  try {
    await deleteScheduleOverride(deleteTarget.value.id)
    success('Override deleted')
    await load()
  } catch (e) {
    error(e?.error || 'Failed to delete override')
  }
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
