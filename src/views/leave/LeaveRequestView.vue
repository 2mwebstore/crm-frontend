<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Leave Request</h1>
      <p class="text-sm text-gray-500 mt-0.5">Submit and track your Leave requests</p>
    </div>

    <div v-if="branchOptions.length > 1" class="w-56">
      <label class="label text-xs">Branch</label>
      <SearchableSelect v-model="branchId" :options="branchOptions" placeholder="Select a branch" @update:modelValue="loadLeaveTypes" />
    </div>

    <!-- Submit a request -->
    <div class="card p-5">
      <h2 class="text-sm font-semibold text-gray-700 pb-3 mb-4 border-b border-gray-100">Submit a Leave Request</h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Leave Type <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="form.leave_type_id" :options="leaveTypes" placeholder="Select leave type" />
        </div>
        <div>
          <label class="label">Day Type <span class="text-red-500">*</span></label>
          <div class="flex gap-1">
            <button
              v-for="d in dayTypes" :key="d.id"
              type="button"
              @click="onDayTypeChange(d.id)"
              :class="['btn-secondary btn-xs flex-1', form.day_type === d.id ? '!bg-primary-600 !text-white hover:!bg-primary-700' : '']"
            >
              {{ d.name }}
            </button>
          </div>
        </div>

        <div v-if="isHalfDay">
          <label class="label">Date <span class="text-red-500">*</span></label>
          <SingleDatePicker
            :model-value="form.date_from"
            @update:model-value="v => { form.date_from = v; form.date_to = v }"
            placeholder="Select date"
          />
        </div>
        <div v-else class="col-span-2">
          <label class="label">Date From <span class="text-red-500">*</span> — Date To <span class="text-red-500">*</span></label>
          <DateRangePicker
            :model-value="[form.date_from, form.date_to]"
            @update:model-value="v => { form.date_from = v[0]; form.date_to = v[1] }"
          />
        </div>

        <div v-if="form.date_from && form.date_to" class="col-span-2 -mt-1">
          <p class="text-xs text-gray-500">Duration: <span class="font-semibold text-gray-700">{{ duration }} day{{ duration === 1 ? '' : 's' }}</span></p>
        </div>

        <div class="col-span-2">
          <label class="label">Reason <span class="text-red-500">*</span></label>
          <textarea v-model="form.reason" class="input resize-none" rows="2" placeholder="Why are you requesting leave?" />
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button @click="submitRequest" class="btn-primary" :disabled="submitting || !canSubmit">
          {{ submitting ? 'Submitting…' : 'Submit Request' }}
        </button>
      </div>
    </div>

    <!-- My request history -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-700">My Leave Requests</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Dates</th>
              <th class="table-header">Leave Type</th>
              <th class="table-header">Day Type</th>
              <th class="table-header">Duration</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Status</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loadingRequests">
              <td colspan="7" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!myRequests.length">
              <td colspan="7" class="table-cell text-center py-10 text-gray-400">No requests yet</td>
            </tr>
            <tr v-else v-for="r in myRequests" :key="r.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(r.date_from) }}<span v-if="r.date_to !== r.date_from"> → {{ fmtDate(r.date_to) }}</span></td>
              <td class="table-cell text-sm text-gray-800">{{ r.leave_type?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ dayTypeLabel(r.day_type) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ r.duration }} day{{ r.duration === 1 ? '' : 's' }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-52 truncate">{{ r.reason || '—' }}</td>
              <td class="table-cell">
                <span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span>
                <p v-if="r.status === 'rejected' && r.reject_reason" class="text-xs text-red-500 mt-0.5">{{ r.reject_reason }}</p>
              </td>
              <td class="table-cell text-right">
                <div v-if="r.status === 'pending'" class="flex justify-end gap-1">
                  <button @click="openEdit(r)" class="btn-icon" title="Edit reason"><PencilIcon class="w-4 h-4" /></button>
                  <button @click="openCancel(r)" class="btn-icon text-red-500" title="Cancel request"><XMarkIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit reason modal -->
    <AppModal v-model="editModal" title="Edit Reason" size="sm">
      <div>
        <label class="label">Reason <span class="text-red-500">*</span></label>
        <textarea v-model="editReason" class="input resize-none" rows="3" />
      </div>
      <template #footer>
        <button @click="editModal = false" class="btn-secondary">Cancel</button>
        <button @click="doEdit" class="btn-primary" :disabled="editing || !editReason.trim()">
          {{ editing ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>

    <!-- Cancel confirm -->
    <ConfirmDialog v-model="cancelModal" message="Cancel this leave request? This can't be undone." @confirm="doCancel" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PencilIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import SingleDatePicker from '@/components/ui/SingleDatePicker.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { createLeaveRequest, editLeaveReason, cancelLeaveRequest, getMyLeaveRequests } from '@/api/leave-requests'
import { getLeaveTypes } from '@/api/leave-types'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { fmtDate } from '@/utils/datetime'
const auth = useAuthStore()
const { success, error } = useToast()

const branchOptions = ref([])
const branchId = ref(null)
const leaveTypes = ref([])

const dayTypes = [
  { id: 'full', name: 'Full Day' },
  { id: 'half_morning', name: 'Half Day (Morning)' },
  { id: 'half_afternoon', name: 'Half Day (Afternoon)' },
]

function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = ref({ leave_type_id: null, day_type: 'full', date_from: todayDateString(), date_to: todayDateString(), reason: '' })
const isHalfDay = computed(() => form.value.day_type === 'half_morning' || form.value.day_type === 'half_afternoon')
// Matches the backend's own day-counting exactly (services/leave_request_service.go):
// Half Day is always 0.5, Full Day is (dateTo - dateFrom in days) + 1.
const duration = computed(() => {
  if (isHalfDay.value) return 0.5
  if (!form.value.date_from || !form.value.date_to) return 0
  const from = new Date(form.value.date_from + 'T00:00:00')
  const to = new Date(form.value.date_to + 'T00:00:00')
  const days = Math.round((to - from) / 86400000) + 1
  return days < 1 ? 1 : days
})
function onDayTypeChange(id) {
  form.value.day_type = id
  if (id !== 'full') form.value.date_to = form.value.date_from
}
const submitting = ref(false)
const canSubmit = computed(() => !!form.value.leave_type_id && !!form.value.date_from && !!form.value.date_to && !!form.value.reason.trim())

const myRequests = ref([])
const loadingRequests = ref(false)

function dayTypeLabel(d) {
  return d === 'half_morning' ? 'Half Day - Morning' : d === 'half_afternoon' ? 'Half Day - Afternoon' : 'Full Day'
}
function statusBadge(s) {
  switch (s) {
    case 'approved':  return 'bg-emerald-100 text-emerald-700'
    case 'rejected':  return 'bg-red-100 text-red-700'
    case 'cancelled': return 'bg-gray-200 text-gray-500'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

async function loadMyRequests() {
  loadingRequests.value = true
  try {
    const res = await getMyLeaveRequests({ page: 1, page_size: 20 })
    myRequests.value = res.data?.items || []
  } catch {} finally { loadingRequests.value = false }
}

// Edit reason — pending requests only, enforced server-side too
const editModal = ref(false)
const editReason = ref('')
const editing = ref(false)
const editTarget = ref(null)
function openEdit(r) {
  editTarget.value = r
  editReason.value = r.reason || ''
  editModal.value = true
}
async function doEdit() {
  editing.value = true
  try {
    await editLeaveReason(editTarget.value.id, editReason.value)
    success('Reason updated')
    editModal.value = false
    await loadMyRequests()
  } catch (e) {
    error(e?.error || 'Failed to update reason')
  } finally { editing.value = false }
}

// Cancel — pending requests only, enforced server-side too. Frees up the
// date and the leave type's monthly/annual limit automatically, since the
// backend only counts pending/approved requests toward either.
const cancelModal = ref(false)
const cancelTarget = ref(null)
function openCancel(r) {
  cancelTarget.value = r
  cancelModal.value = true
}
async function doCancel() {
  try {
    await cancelLeaveRequest(cancelTarget.value.id)
    success('Request cancelled')
    await Promise.all([loadMyRequests(), loadLeaveTypes()])
  } catch (e) {
    error(e?.error || 'Failed to cancel request')
  }
}

async function loadLeaveTypes() {
  try {
    const params = { show_all: false }
    if (branchId.value) params.branch_id = branchId.value
    const res = await getLeaveTypes(params)
    leaveTypes.value = (res.data || []).map(l => {
      const parts = [l.name]
      if (l.branch?.name) parts.push(l.branch.name)
      if (l.monthly_limit != null) parts.push(`${l.monthly_used ?? 0}/${l.monthly_limit} used this month`)
      return { id: l.id, name: parts.join(' — ') }
    })
  } catch {}
}

async function submitRequest() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await createLeaveRequest({
      branch_id: branchId.value,
      leave_type_id: form.value.leave_type_id,
      day_type: form.value.day_type,
      date_from: form.value.date_from,
      date_to: form.value.date_to,
      reason: form.value.reason,
    })
    success('Leave request submitted')
    form.value = { leave_type_id: null, day_type: 'full', date_from: todayDateString(), date_to: todayDateString(), reason: '' }
    await Promise.all([loadMyRequests(), loadLeaveTypes()])
  } catch (e) {
    error(e?.error || 'Failed to submit request')
  } finally { submitting.value = false }
}

onMounted(async () => {
  if (!auth.isSuperAdmin && auth.user?.branches?.length) {
    branchOptions.value = auth.user.branches.map(b => ({ id: b.id, name: b.name, sub: b.code }))
  } else {
    try {
      const res = await getBranches({ show_all: false })
      branchOptions.value = (res.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
    } catch {}
  }
  if (branchOptions.value.length === 1) branchId.value = branchOptions.value[0].id
  await loadLeaveTypes()
  loadMyRequests()
})
</script>
