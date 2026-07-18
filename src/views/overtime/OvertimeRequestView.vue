<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Overtime Request</h1>
      <p class="text-sm text-gray-500 mt-0.5">Submit and track your Overtime requests</p>
    </div>

    <div v-if="branchOptions.length > 1" class="w-56">
      <label class="label text-xs">Branch</label>
      <SearchableSelect v-model="branchId" :options="branchOptions" placeholder="Select a branch" />
    </div>

    <!-- Submit a request -->
    <div class="card p-5">
      <h2 class="text-sm font-semibold text-gray-700 pb-3 mb-4 border-b border-gray-100">Submit an Overtime Request</h2>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="label">Date <span class="text-red-500">*</span></label>
          <SingleDatePicker v-model="form.date" placeholder="Select date" class="w-full" />
        </div>
        <div>
          <label class="label">Start Time</label>
          <TimePicker v-model="form.start_time" placeholder="Start time" class="w-full" />
        </div>
        <div>
          <label class="label">End Time</label>
          <TimePicker v-model="form.end_time" placeholder="End time" class="w-full" />
        </div>
        <div v-if="duration != null" class="col-span-3 -mt-1">
          <p class="text-xs text-gray-500">Duration: <span class="font-semibold text-gray-700">{{ duration }} hour{{ duration === 1 ? '' : 's' }}</span></p>
        </div>
        <div class="col-span-3">
          <label class="label">Reason <span class="text-red-500">*</span></label>
          <textarea v-model="form.reason" class="input resize-none" rows="2" placeholder="Why are you requesting overtime?" />
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
        <h2 class="text-sm font-semibold text-gray-700">My Overtime Requests</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Date</th>
              <th class="table-header">Time</th>
              <th class="table-header">Duration</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Status</th>
              <th class="table-header">Submitted</th>
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
              <td class="table-cell text-sm text-gray-800 whitespace-nowrap">{{ fmtDate(r.date) }}</td>
              <td class="table-cell text-sm text-gray-600">{{ fmtTime(r.start_time) || '—' }}–{{ fmtTime(r.end_time) || '—' }}</td>
              <td class="table-cell text-sm text-gray-700">{{ r.duration != null ? `${r.duration}h` : '—' }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-52 truncate">{{ r.reason || '—' }}</td>
              <td class="table-cell">
                <span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span>
                <p v-if="r.status === 'rejected' && r.reject_reason" class="text-xs text-red-500 mt-0.5">{{ r.reject_reason }}</p>
              </td>
              <td class="table-cell text-sm text-gray-800 whitespace-nowrap">{{ fmtDatetime(r.created_at) }}</td>
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
    <ConfirmDialog v-model="cancelModal" message="Cancel this overtime request? This can't be undone." @confirm="doCancel" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PencilIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import SingleDatePicker from '@/components/ui/SingleDatePicker.vue'
import TimePicker from '@/components/ui/TimePicker.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { createOvertimeRequest, editOvertimeReason, cancelOvertimeRequest, getMyOvertimeRequests } from '@/api/overtime-requests'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { fmtDate,fmtDatetime,fmtTime } from '@/utils/datetime'

const auth = useAuthStore()
const { success, error } = useToast()

const branchOptions = ref([])
const branchId = ref(null)

function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = ref({ date: todayDateString(), start_time: '', end_time: '', reason: '' })
const submitting = ref(false)
const canSubmit = computed(() => !!form.value.date && !!form.value.reason.trim())

// Live preview of the duration — mirrors the backend's own computeDuration
// (services/overtime_request_service.go) so what's shown here matches
// what actually gets stored, including the "crosses midnight" case.
const duration = computed(() => {
  if (!form.value.start_time || !form.value.end_time) return null
  const [sh, sm] = form.value.start_time.split(':').map(Number)
  const [eh, em] = form.value.end_time.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
})

const myRequests = ref([])
const loadingRequests = ref(false)

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
    const res = await getMyOvertimeRequests({ page: 1, page_size: 20 })
    myRequests.value = res.data?.items || []
  } catch {} finally { loadingRequests.value = false }
}

async function submitRequest() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await createOvertimeRequest({
      branch_id: branchId.value,
      date: form.value.date,
      start_time: form.value.start_time || null,
      end_time: form.value.end_time || null,
      reason: form.value.reason,
    })
    success('Overtime request submitted')
    form.value = { date: todayDateString(), start_time: '', end_time: '', reason: '' }
    await loadMyRequests()
  } catch (e) {
    error(e?.error || 'Failed to submit request')
  } finally { submitting.value = false }
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
    await editOvertimeReason(editTarget.value.id, editReason.value)
    success('Reason updated')
    editModal.value = false
    await loadMyRequests()
  } catch (e) {
    error(e?.error || 'Failed to update reason')
  } finally { editing.value = false }
}

// Cancel — pending requests only, enforced server-side too
const cancelModal = ref(false)
const cancelTarget = ref(null)
function openCancel(r) {
  cancelTarget.value = r
  cancelModal.value = true
}
async function doCancel() {
  try {
    await cancelOvertimeRequest(cancelTarget.value.id)
    success('Request cancelled')
    await loadMyRequests()
  } catch (e) {
    error(e?.error || 'Failed to cancel request')
  }
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
  loadMyRequests()
})
</script>
