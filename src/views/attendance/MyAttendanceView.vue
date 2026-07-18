<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">My Attendance</h1>
      <p class="text-sm text-gray-500 mt-0.5">Check in/out for the day</p>
    </div>

    <div v-if="branchOptions.length > 1" class="w-56">
      <label class="label text-xs">Branch</label>
      <SearchableSelect v-model="branchId" :options="branchOptions" placeholder="Select a branch" @update:modelValue="loadToday" />
    </div>

    <div v-if="!branchId" class="card p-8 text-center text-gray-400">
      No branch available.
    </div>

    <div v-else class="card p-5">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Check In</p>
          <p v-if="today?.check_in_at" class="text-lg font-bold text-gray-800 mt-1">{{ fmtDatetime(today.check_in_at) }}</p>
          <p v-else class="text-lg font-bold text-gray-300 mt-1">Not yet</p>
          <span v-if="today?.check_in_status" :class="['badge mt-1', checkInStatusBadge(today.check_in_status)]">{{ checkInStatusLabel(today.check_in_status) }}</span>
          <p v-if="today?.check_in_via_outdoor" class="text-xs text-purple-600 mt-1">Via approved Outdoor Activity</p>
          <p v-else-if="today?.check_in_distance != null" class="text-xs text-gray-400 mt-1">{{ Math.round(today.check_in_distance) }}m from branch</p>
          <p v-if="today?.check_in_reason" class="text-xs text-gray-500 mt-1 max-w-xs">{{ today.check_in_reason }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Out</p>
          <p v-if="today?.check_out_at" class="text-lg font-bold text-gray-800 mt-1">{{ fmtDatetime(today.check_out_at) }}</p>
          <p v-else class="text-lg font-bold text-gray-300 mt-1">Not yet</p>
          <span v-if="today?.check_out_status" :class="['badge mt-1', checkInStatusBadge(today.check_out_status)]">{{ checkInStatusLabel(today.check_out_status) }}</span>
          <p v-if="today?.check_out_via_outdoor" class="text-xs text-purple-600 mt-1">Via approved Outdoor Activity</p>
          <p v-else-if="today?.check_out_distance != null" class="text-xs text-gray-400 mt-1">{{ Math.round(today.check_out_distance) }}m from branch</p>
          <p v-if="today?.check_out_reason" class="text-xs text-gray-500 mt-1 max-w-xs">{{ today.check_out_reason }}</p>
        </div>
      </div>

      <p v-if="geoError" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{{ geoError }}</p>

      <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <button
          @click="doCheckIn()"
          class="btn-primary flex items-center gap-2"
          :disabled="checkingIn || !!today?.check_in_at"
        >
          <MapPinIcon class="w-4 h-4" />
          {{ checkingIn ? 'Checking in…' : (today?.check_in_at ? 'Checked In' : 'Check In') }}
        </button>
        <button
          @click="doCheckOut()"
          class="btn-secondary flex items-center gap-2"
          :disabled="checkingOut || !!today?.check_out_at"
        >
          <MapPinIcon class="w-4 h-4" />
          {{ checkingOut ? 'Checking out…' : (today?.check_out_at ? 'Checked Out' : 'Check Out') }}
        </button>
      </div>
    </div>

    <!-- Reason prompt — only appears when the backend requires one for a
         late check-in or early check-out -->
    <AppModal v-model="reasonPromptOpen" :title="reasonPromptType === 'checkin' ? 'Late Check In' : 'Early Check Out'" size="sm">
      <p class="text-sm text-gray-500 mb-3">{{ reasonPromptMessage }}</p>
      <div>
        <label class="label">Reason <span class="text-red-500">*</span></label>
        <textarea v-model="reasonPromptText" class="input resize-none" rows="3" placeholder="Why are you late / leaving early?" />
      </div>
      <template #footer>
        <button @click="reasonPromptOpen = false" class="btn-secondary">Cancel</button>
        <button @click="submitReasonPrompt" class="btn-primary" :disabled="!reasonPromptText.trim() || checkingIn || checkingOut">
          Submit
        </button>
      </template>
    </AppModal>

    <!-- My attendance history -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-700">My Attendance History</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">Date</th>
              <th class="table-header">Check In</th>
              <th class="table-header">Check Out</th>
              <th class="table-header">Note</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loadingHistory">
              <td colspan="4" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!history.length">
              <td colspan="4" class="table-cell text-center py-10 text-gray-400">No attendance records yet</td>
            </tr>
            <tr v-else v-for="row in history" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm font-medium text-gray-800 whitespace-nowrap">{{ fmtDate(row.date) }}</td>
              <td class="table-cell text-sm">
                <span v-if="row.check_in_at" class="text-gray-700">{{ fmtDatetime(row.check_in_at) }}</span>
                <span v-else class="text-gray-300">—</span>
                <span v-if="row.check_in_status" :class="['badge ml-1', checkInStatusBadge(row.check_in_status)]">{{ checkInStatusLabel(row.check_in_status) }}</span>
                <span v-if="row.check_in_via_outdoor" class="badge ml-1 bg-purple-100 text-purple-700">Outdoor</span>
                <p v-if="row.check_in_reason" class="text-xs text-gray-400 mt-0.5 max-w-52 truncate">{{ row.check_in_reason }}</p>
              </td>
              <td class="table-cell text-sm">
                <span v-if="row.check_out_at" class="text-gray-700">{{ fmtDatetime(row.check_out_at) }}</span>
                <span v-else class="text-gray-300">—</span>
                <span v-if="row.check_out_status" :class="['badge ml-1', checkInStatusBadge(row.check_out_status)]">{{ checkInStatusLabel(row.check_out_status) }}</span>
                <span v-if="row.check_out_via_outdoor" class="badge ml-1 bg-purple-100 text-purple-700">Outdoor</span>
                <p v-if="row.check_out_reason" class="text-xs text-gray-400 mt-0.5 max-w-52 truncate">{{ row.check_out_reason }}</p>
              </td>
              <td class="table-cell">
                <span v-if="row.check_in_at && !row.check_out_at" class="badge bg-amber-100 text-amber-700">Still In</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="historyMeta && historyMeta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="historyPageSize" @update:modelValue="onHistoryPageSizeChange" />
        <span>Showing {{ (historyPage - 1) * historyPageSize + 1 }}–{{ Math.min(historyPage * historyPageSize, historyMeta.total) }} of {{ historyMeta.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="historyPage <= 1" @click="goHistoryPage(historyPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ historyPage }} / {{ historyTotalPages }}</span>
          <button :disabled="historyPage >= historyTotalPages" @click="goHistoryPage(historyPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { MapPinIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import AppModal from '@/components/common/AppModal.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import { checkIn, checkOut, getTodayAttendance, getMyAttendance } from '@/api/attendance'
import { getBranches } from '@/api/branches'
import { fmtDatetime,fmtDate } from '@/utils/datetime'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()

const branchOptions = ref([])
const branchId = ref(null)
const today = ref(null)
const checkingIn = ref(false)
const checkingOut = ref(false)
const geoError = ref('')

// Labels/colors for Attendance.check_in_status, computed server-side by
// comparing check-in time against the user's own configured shift time.
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


// Wraps the browser Geolocation API in a Promise — every check-in/out
// action needs a fresh position, never a cached one, since the whole
// point is confirming where the person actually is right now.
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

const history = ref([])
const historyMeta = ref(null)
const loadingHistory = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotalPages = computed(() => historyMeta.value ? Math.max(1, Math.ceil(historyMeta.value.total / historyPageSize.value)) : 1)

async function loadHistory() {
  loadingHistory.value = true
  try {
    const res = await getMyAttendance({ page: historyPage.value, page_size: historyPageSize.value })
    history.value = res.data?.items || []
    historyMeta.value = { total: res.data?.total || 0 }
  } catch { history.value = []; historyMeta.value = { total: 0 } } finally { loadingHistory.value = false }
}
function goHistoryPage(p)          { historyPage.value = p; loadHistory() }
function onHistoryPageSizeChange() { historyPage.value = 1; loadHistory() }

async function doCheckIn(reason = '') {
  geoError.value = ''
  checkingIn.value = true
  try {
    const coords = pendingCoords.value || await getPosition()
    pendingCoords.value = coords
    await checkIn(branchId.value, coords.latitude, coords.longitude, reason)
    success('Checked in')
    reasonPromptOpen.value = false
    pendingCoords.value = null
    await Promise.all([loadToday(), loadHistory()])
  } catch (e) {
    const msg = e?.error || e?.message || 'Check-in failed'
    if (msg.includes('please provide a reason')) {
      openReasonPrompt('checkin', msg)
    } else {
      pendingCoords.value = null
      geoError.value = msg
    }
  } finally { checkingIn.value = false }
}

async function doCheckOut(reason = '') {
  geoError.value = ''
  checkingOut.value = true
  try {
    const coords = pendingCoords.value || await getPosition()
    pendingCoords.value = coords
    await checkOut(branchId.value, coords.latitude, coords.longitude, reason)
    success('Checked out')
    reasonPromptOpen.value = false
    pendingCoords.value = null
    await Promise.all([loadToday(), loadHistory()])
  } catch (e) {
    const msg = e?.error || e?.message || 'Check-out failed'
    if (msg.includes('please provide a reason')) {
      openReasonPrompt('checkout', msg)
    } else {
      pendingCoords.value = null
      geoError.value = msg
    }
  } finally { checkingOut.value = false }
}

// Reason prompt — only shown when the backend rejects a late check-in or
// early check-out for missing a reason. Reuses the coordinates already
// captured on the first attempt rather than asking for location twice.
const reasonPromptOpen = ref(false)
const reasonPromptType = ref('')
const reasonPromptMessage = ref('')
const reasonPromptText = ref('')
const pendingCoords = ref(null)
function openReasonPrompt(type, message) {
  reasonPromptType.value = type
  reasonPromptMessage.value = message
  reasonPromptText.value = ''
  reasonPromptOpen.value = true
}
async function submitReasonPrompt() {
  if (!reasonPromptText.value.trim()) return
  if (reasonPromptType.value === 'checkin') await doCheckIn(reasonPromptText.value)
  else await doCheckOut(reasonPromptText.value)
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
  if (branchOptions.value.length === 1) {
    branchId.value = branchOptions.value[0].id
  }
  if (branchId.value) loadToday()
  loadHistory()
})
</script>