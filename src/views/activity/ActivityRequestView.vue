<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Activity Request</h1>
      <p class="text-sm text-gray-500 mt-0.5">Declare field/activity work for a date — for today, this also checks you in or out automatically</p>
    </div>

    <div v-if="branchOptions.length > 1" class="w-56">
      <label class="label text-xs">Branch</label>
      <SearchableSelect v-model="branchId" :options="branchOptions" placeholder="Select a branch" @update:modelValue="loadToday" />
    </div>

    <!-- Today's attendance status, since a request for today drives it -->
    <div v-if="branchId && today" class="card p-4 flex items-center gap-6 text-sm">
      <div>
        <span class="text-gray-500">Check In today: </span>
        <span :class="today.check_in_at ? 'text-emerald-600 font-medium' : 'text-gray-400'">{{ today.check_in_at ? fmtTime(today.check_in_at) : 'Not yet' }}</span>
      </div>
      <div>
        <span class="text-gray-500">Check Out today: </span>
        <span :class="today.check_out_at ? 'text-emerald-600 font-medium' : 'text-gray-400'">{{ today.check_out_at ? fmtTime(today.check_out_at) : 'Not yet' }}</span>
      </div>
    </div>

    <!-- Submit a request -->
    <div class="card p-5">
      <h2 class="text-sm font-semibold text-gray-700 pb-3 mb-4 border-b border-gray-100">Submit an Activity Request</h2>

      <p v-if="attendanceComplete && isToday" class="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
        You've already checked in and checked out today — an Activity request for today isn't needed.
      </p>

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Date</label>
          <input :value="form.date" type="text" class="input bg-gray-50 cursor-not-allowed" readonly />
          <p class="text-xs text-gray-400 mt-1">Always today — Activity drives attendance for the current day only.</p>
        </div>
        <div class="col-span-2">
          <label class="label">Reason <span class="text-red-500">*</span></label>
          <textarea v-model="form.reason" class="input resize-none" rows="2" placeholder="Why are you outside the branch today?" />
        </div>
      </div>

      <p v-if="geoError" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{{ geoError }}</p>

      <div class="mt-4 flex justify-end">
        <button @click="submitRequest" class="btn-primary" :disabled="submitting || !canSubmit">
          {{ submitting ? 'Submitting…' : 'Submit Request' }}
        </button>
      </div>
    </div>

    <!-- My request history -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-700">My Activity Requests</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Date</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loadingRequests">
              <td colspan="3" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!myRequests.length">
              <td colspan="3" class="table-cell text-center py-10 text-gray-400">No requests yet</td>
            </tr>
            <tr v-else v-for="r in myRequests" :key="r.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-800 whitespace-nowrap">{{ r.date }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-52 truncate">{{ r.reason || '—' }}</td>
              <td class="table-cell"><span class="badge bg-emerald-100 text-emerald-700">{{ r.status }}</span></td>
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
import { getTodayAttendance } from '@/api/attendance'
import { createActivityRequest, getMyActivityRequests } from '@/api/activity-requests'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()

const branchOptions = ref([])
const branchId = ref(null)
const today = ref(null)
const geoError = ref('')

function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = ref({ date: todayDateString(), reason: '' })
const isToday = computed(() => form.value.date === todayDateString())
const attendanceComplete = computed(() => !!(today.value?.check_in_at && today.value?.check_out_at))
const submitting = ref(false)
const canSubmit = computed(() => !!form.value.date && !!form.value.reason.trim() && !(isToday.value && attendanceComplete.value))

const myRequests = ref([])
const loadingRequests = ref(false)

function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// Wraps the browser Geolocation API in a Promise — captures a fresh
// position (never cached) so the backend can drive Check In/Check Out
// with real coordinates when this request covers today.
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(err.message || 'Failed to get your location — please allow location access')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

async function loadToday() {
  if (!branchId.value) return
  try { const res = await getTodayAttendance(branchId.value); today.value = res.data } catch { today.value = null }
}

async function loadMyRequests() {
  loadingRequests.value = true
  try {
    const res = await getMyActivityRequests({ page: 1, page_size: 20 })
    myRequests.value = res.data?.items || []
  } catch {} finally { loadingRequests.value = false }
}

async function submitRequest() {
  if (!canSubmit.value) return
  submitting.value = true
  geoError.value = ''
  try {
    const payload = {
      branch_id: branchId.value,
      date: form.value.date,
      reason: form.value.reason,
    }
    // Best-effort — this request drives Check In/Check Out automatically
    // on the backend using this location when it covers today, but the
    // request itself should still go through even if location access
    // fails or is denied; it just won't auto-drive attendance in that
    // case (still doable manually from My Attendance).
    try {
      const coords = await getPosition()
      payload.latitude = coords.latitude
      payload.longitude = coords.longitude
    } catch (e) {
      geoError.value = e?.message || 'Could not get your location — request will still be submitted'
    }
    await createActivityRequest(payload)
    success('Activity request submitted')
    form.value = { date: todayDateString(), reason: '' }
    await loadMyRequests()
    await loadToday()
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
  if (branchId.value) loadToday()
  loadMyRequests()
})
</script>
