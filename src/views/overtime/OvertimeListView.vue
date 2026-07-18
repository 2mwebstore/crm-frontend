<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">List Overtime</h1>
      <p class="text-sm text-gray-500 mt-0.5">Overtime requests from all staff</p>
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
      <div class="w-36">
        <label class="label text-xs">Status</label>
        <SearchableSelect v-model="filters.status" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" @update:modelValue="reload" />
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
              <th class="table-header">Time</th>
              <th class="table-header">Duration</th>
              <th class="table-header">Reason</th>
              <th class="table-header">Status</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="table-cell text-center py-10 text-gray-400">No overtime requests found</td>
            </tr>
            <tr v-else v-for="r in items" :key="r.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-sm text-gray-800">{{ r.user?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600">{{ r.branch?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ r.date }}</td>
              <td class="table-cell text-sm text-gray-700">{{ r.start_time || '—' }}–{{ r.end_time || '—' }}</td>
              <td class="table-cell text-sm text-gray-700">{{ r.duration != null ? `${r.duration}h` : '—' }}</td>
              <td class="table-cell text-sm text-gray-500 max-w-48 truncate">{{ r.reason || '—' }}</td>
              <td class="table-cell">
                <span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span>
                <p v-if="r.status !== 'pending'" class="text-xs text-gray-400 mt-0.5">{{ r.approved_by?.name || '—' }}</p>
              </td>
              <td class="table-cell text-right">
                <div v-if="r.status === 'pending' && canApprove" class="flex justify-end gap-1">
                  <button @click="doApprove(r)" class="btn-icon text-emerald-600" title="Approve"><CheckIcon class="w-4 h-4" /></button>
                  <button @click="openReject(r)" class="btn-icon text-red-500" title="Reject"><XMarkIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject reason modal -->
    <AppModal v-model="rejectModal" title="Reject Overtime Request" size="sm">
      <div>
        <label class="label">Reason <span class="text-gray-400 font-normal">(optional)</span></label>
        <textarea v-model="rejectReason" class="input resize-none" rows="3" placeholder="Why is this being rejected?" />
      </div>
      <template #footer>
        <button @click="rejectModal = false" class="btn-secondary">Cancel</button>
        <button @click="doReject" class="btn-primary !bg-red-600 hover:!bg-red-700" :disabled="rejecting">
          {{ rejecting ? 'Rejecting…' : 'Reject' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import AppModal from '@/components/common/AppModal.vue'
import { getOvertimeRequests, approveOvertimeRequest, rejectOvertimeRequest } from '@/api/overtime-requests'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()
const canApprove = computed(() => auth.isSuperAdmin || auth.can('overtime_requests.approve'))

const items   = ref([])
const loading = ref(false)

const filters = ref({ date_from: '', date_to: '', user_id: null, branch_id: null, status: null })
const users = ref([])
const branches = ref([])
const statusOpts = [
  { id: 'pending', name: 'Pending' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
  { id: 'cancelled', name: 'Cancelled' },
]

function statusBadge(s) {
  switch (s) {
    case 'approved':  return 'bg-emerald-100 text-emerald-700'
    case 'rejected':  return 'bg-red-100 text-red-700'
    case 'cancelled': return 'bg-gray-200 text-gray-500'
    default:          return 'bg-gray-100 text-gray-600'
  }
}

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 100 }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    if (filters.value.status)    params.status    = filters.value.status
    const res = await getOvertimeRequests(params)
    items.value = res.data?.items || []
  } catch { items.value = [] } finally { loading.value = false }
}

function reload() { load() }
function resetFilters() {
  filters.value = { date_from: '', date_to: '', user_id: null, branch_id: null, status: null }
  reload()
}

async function doApprove(r) {
  try {
    await approveOvertimeRequest(r.id)
    success('Request approved')
    load()
  } catch (e) { error(e?.error || 'Failed to approve') }
}

const rejectModal = ref(false)
const rejectReason = ref('')
const rejecting = ref(false)
const rejectTarget = ref(null)
function openReject(r) {
  rejectTarget.value = r
  rejectReason.value = ''
  rejectModal.value = true
}
async function doReject() {
  rejecting.value = true
  try {
    await rejectOvertimeRequest(rejectTarget.value.id, rejectReason.value)
    success('Request rejected')
    rejectModal.value = false
    load()
  } catch (e) { error(e?.error || 'Failed to reject') } finally { rejecting.value = false }
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
