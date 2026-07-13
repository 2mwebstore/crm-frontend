<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Follow Ups</h1>
        <p class="text-sm text-gray-500 mt-0.5">Track client follow-up activities</p>
      </div>
      <button @click="openCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Follow Up
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <div><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <div class="w-52">
        <SearchableSelect v-model="filters.client_id" :options="clientOptions" placeholder="All clients" all-label="All clients" @update:modelValue="load" />
      </div>
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-sm flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" />
        More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- More Filters Panel -->
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Bonus Option</label>
        <SearchableSelect v-model="filters.bonus_option_id" :options="lookup.bonusOptions" placeholder="All bonus" @update:modelValue="load" />
      </div>
    </div>

    <!-- Table (desktop) -->
    <div class="hidden sm:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Created Date</th>
              <th class="table-header">Follow Up Date</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Client</th>
              <th class="table-header">Bonus Option</th>
              <th class="table-header">Interest</th>
              <th class="table-header">Given Account</th>
              <th class="table-header">Bank Account</th>
              <th class="table-header">Remark</th>
              <th class="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="12" class="table-cell text-center py-10">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="12" class="table-cell text-center py-10 text-gray-400">No follow-ups found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (currentPage - 1) * currentPageSize + idx + 1 }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
              <td class="table-cell text-sm text-gray-700 whitespace-nowrap">{{ fmtDate(row.follow_up_at) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.created_by?.name || '—' }}</td>
              <td class="table-cell">
                <p class="text-sm font-medium text-gray-800">{{ row.client?.name || '—' }}</p>
                <p class="text-xs text-gray-400 font-mono">{{ row.client?.code }}</p>
              </td>
              <td class="table-cell">
                <span v-if="row.bonus_option" class="badge bg-purple-100 text-purple-700">{{ row.bonus_option.name }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span :class="['badge', row.interest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">{{ row.interest ? 'Yes' : 'No' }}</span>
              </td>
              <td class="table-cell">
                <span :class="['badge', row.given_account ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400']">{{ row.given_account ? 'Yes' : 'No' }}</span>
              </td>
              <td class="table-cell">
                <span :class="['badge', row.bank_account ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400']">{{ row.bank_account ? 'Yes' : 'No' }}</span>
              </td>
              <td class="table-cell max-w-40"><p class="text-xs text-gray-600 truncate">{{ row.remark || '—' }}</p></td>
              <td class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span>Showing {{ (currentPage - 1) * currentPageSize + 1 }}–{{ Math.min(currentPage * currentPageSize, meta.total_items) }} of {{ meta.total_items }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Card list (mobile). Note: there's no edit capability for follow-ups
         in this codebase (only Create + Delete — see the script below),
         so the card only gets a Delete icon rather than inventing an edit
         action that doesn't exist. -->
    <div class="sm:hidden space-y-3">
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-400 text-sm">No follow-ups found</div>
      <div v-for="row in items" :key="row.id" class="card p-4">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-50 text-indigo-600">
            {{ (row.client?.name || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate">{{ row.client?.name || '—' }}</p>
            <p class="text-xs text-gray-400 mt-0.5 truncate">{{ row.client?.code }} · {{ fmtDate(row.follow_up_at) }}</p>
            <span v-if="row.bank_account" class="inline-block badge bg-amber-100 text-amber-700 text-xs mt-1.5">Bank Given</span>
            <p v-if="row.remark" class="text-xs text-gray-500 mt-1 truncate">"{{ row.remark }}"</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
          <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between pt-1 text-sm text-gray-500">
        <span class="text-xs">{{ meta.total_items }} total</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <AppModal v-model="modal" title="New Follow Up" size="md">
      <div class="space-y-4">
        <div>
          <label class="label">Branch <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="form.branch_id" :options="branches" placeholder="Select branch" @update:modelValue="onFormBranchChange" />
        </div>
        <div>
          <label class="label">Follow Up Date</label>
          <DatePicker v-model="form.follow_up_at" placeholder="Select date & time…" />
        </div>
        <div>
          <label class="label">Client <span class="text-red-500">*</span></label>
          <SearchableSelect
            v-model="form.client_id"
            :options="modalClientOptions"
            :placeholder="form.branch_id ? 'Search and select client…' : 'Select a branch first…'"
            :show-all="false"
            :disabled="!form.branch_id"
          />
          <p v-if="form.branch_id && !modalClientOptions.length && !loadingModalClients" class="text-xs text-amber-600 mt-1">
            No clients found for this branch.
          </p>
        </div>
        <div>
          <label class="label">Bonus Option</label>
          <SearchableSelect
            v-model="form.bonus_option_id"
            :options="modalBonusOptions"
            :placeholder="form.branch_id ? 'No bonus' : 'Select a branch first…'"
            :disabled="!form.branch_id"
          />
        </div>
        <div>
          <label class="label">Remark <span class="text-red-500">*</span></label>
          <textarea v-model="form.remark" class="input resize-none" rows="3" placeholder="Follow-up notes…" required />
        </div>
        <div class="grid grid-cols-3 gap-3 pt-1">
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" v-model="form.interest" class="accent-primary w-4 h-4" /> Interest
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" v-model="form.given_account" class="accent-primary w-4 h-4" /> Given Account
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" v-model="form.bank_account" class="accent-primary w-4 h-4" /> Bank Account
          </label>
        </div>
      </div>
      <template #footer>
        <button @click="handleCancel" class="btn-secondary">Cancel</button>
        <RequiredFieldsGuard :fields="requiredFields" v-slot="{ isValid, missing }">
          <button
            @click="handleSave"
            class="btn-primary"
            :disabled="saving || !isValid"
            :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
          >
            {{ saving ? 'Saving…' : 'Create' }}
          </button>
        </RequiredFieldsGuard>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import RequiredFieldsGuard from '@/components/ui/RequiredFieldsGuard.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import { getFollowUps, createFollowUp, deleteFollowUp } from '@/api/follow-ups'
import { getClients } from '@/api/clients'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'
import { getBonusOptions } from '@/api/lookup'
import { useLookupStore } from '@/stores/lookup'
import { useToast } from '@/composables/useToast'
import { nowForDatePicker } from '@/utils/datetime'

const { success, error } = useToast()
const lookup      = useLookupStore()
const items       = ref([])
const meta        = ref(null)
const loading     = ref(false)
const page        = ref(1)
const pageSize    = ref(20)
const saving      = ref(false)
const modal       = ref(false)
const allClients  = ref([])
const branches    = ref([])
const users       = ref([])
const showMoreFilters = ref(false)
const deleteTarget = ref(null)
const deleteDialog = ref(false)

// Branch-scoped lists for the create modal only (separate from the
// page-level "All clients" filter, which intentionally shows every client).
const modalClients        = ref([])
const modalBonusOptionsList = ref([])
const loadingModalClients = ref(false)

const currentPage     = computed(() => page.value)
const currentPageSize = computed(() => pageSize.value)

const filters = ref({ date_from: '', date_to: '', client_id: null, branch_id: null, created_by_id: null, bonus_option_id: null })

const defaultForm = () => ({
  branch_id:       null,
  follow_up_at:    nowForDatePicker(),
  client_id:       null,
  bonus_option_id: null,
  remark:          '',
  interest:        false,
  given_account:   false,
  bank_account:    false,
})
const form = ref(defaultForm())

const clientOptions = computed(() =>
  allClients.value.map(c => ({ id: c.id, name: c.name, sub: c.code }))
)

const modalClientOptions = computed(() =>
  modalClients.value.map(c => ({ id: c.id, name: c.name, sub: c.code }))
)
const modalBonusOptions = computed(() => modalBonusOptionsList.value)

const requiredFields = computed(() => ({
  Branch: form.value.branch_id,
  Client: form.value.client_id,
  Remark: form.value.remark,
}))

const activeMoreFilters = computed(() =>
  [filters.value.branch_id, filters.value.created_by_id, filters.value.bonus_option_id].filter(Boolean).length
)

function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }

async function loadClients() {
  try {
    const res = await getClients({ page: 1, page_size: 500, is_active: true })
    allClients.value = res.data || []
  } catch {}
}

async function loadModalClients(branchId = null) {
  if (!branchId) {
    modalClients.value = []
    return
  }
  loadingModalClients.value = true
  try {
    const res = await getClients({ page: 1, page_size: 500, is_active: true, branch_id: branchId })
    modalClients.value = res.data || []
    if (modalClients.value.length === 1) {
      form.value.client_id = modalClients.value[0].id
    }
  } catch {} finally { loadingModalClients.value = false }
}

async function loadModalBonusOptions(branchId = null) {
  if (!branchId) {
    modalBonusOptionsList.value = []
    return
  }
  try {
    const res = await getBonusOptions({ branch_id: branchId })
    modalBonusOptionsList.value = res.data || []
    if (modalBonusOptionsList.value.length === 1) {
      form.value.bonus_option_id = modalBonusOptionsList.value[0].id
    }
  } catch {}
}

async function onFormBranchChange(branchId) {
  form.value.client_id = null
  form.value.bonus_option_id = null
  await Promise.all([loadModalClients(branchId), loadModalBonusOptions(branchId)])
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value, sort_by: 'follow_up_at', sort_dir: 'desc' }
    if (filters.value.date_from)      params.date_from      = filters.value.date_from
    if (filters.value.date_to)        params.date_to        = filters.value.date_to
    if (filters.value.client_id)      params.client_id      = filters.value.client_id
    if (filters.value.branch_id)      params.branch_id      = filters.value.branch_id
    if (filters.value.created_by_id)  params.created_by_id  = filters.value.created_by_id
    if (filters.value.bonus_option_id) params.bonus_option_id = filters.value.bonus_option_id
    const res = await getFollowUps(params)
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { loading.value = false }
}

function resetFilters()    { filters.value = { date_from: '', date_to: '', client_id: null, branch_id: null, created_by_id: null, bonus_option_id: null }; page.value = 1; load() }
function onPageSizeChange() { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }

async function openCreate() {
  form.value = defaultForm()
  modalClients.value = []
  modalBonusOptionsList.value = []
  if (branches.value.length === 1) {
    form.value.branch_id = branches.value[0].id
    await onFormBranchChange(form.value.branch_id)
  }
  modal.value = true
}

function handleCancel() {
  modal.value = false
  form.value.branch_id = null
  form.value.client_id = null
  form.value.bonus_option_id = null
  modalClients.value = []
  modalBonusOptionsList.value = []
}

function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }

async function handleSave() {
  if (!form.value.branch_id)     { error('Please select a branch'); return }
  if (!form.value.client_id)     { error('Please select a client'); return }
  if (!form.value.remark.trim()) { error('Remark is required'); return }
  saving.value = true
  try {
    await createFollowUp(form.value)
    success('Follow-up created')
    modal.value = false
    load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

async function doDelete() {
  try { await deleteFollowUp(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

onMounted(async () => {
  lookup.loadAll()
  loadClients()
  load()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,code:b.code,sub:b.code})) } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {}
})
</script>