<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Clients</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage your client records</p>
      </div>
      <RouterLink to="/clients/create" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Client
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" type="text" class="input w-52" placeholder="Search name, code…" />
      <SearchableSelect v-model="filters.is_active" :options="activeOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="load" />
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-sm flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" />
        More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- More Filters Panel -->
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Contact Source</label>
        <SearchableSelect v-model="filters.contact_source_id" :options="contactSources" placeholder="All sources" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Level</label>
        <SearchableSelect v-model="filters.level_id" :options="levels" placeholder="All levels" @update:modelValue="load" />
      </div>
    </div>

    <!-- Table (desktop) -->
    <div class="hidden sm:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Code</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Name</th>
              <th class="table-header">Phone</th>
              <th class="table-header">Account Id</th>
              <th class="table-header">Bank</th>
              <th class="table-header">Contact Source</th>
              <th class="table-header">Join Date</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Enable</th>
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
              <td colspan="12" class="table-cell text-center py-10 text-gray-400">No clients found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (currentPage - 1) * currentPageSize + idx + 1 }}</td>
              <td class="table-cell">
                <span class="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{{ row.code }}</span>
              </td>
              <td class="table-cell">
                <div v-if="row.branch" class="text-sm text-gray-700">
                  {{ row.branch.name }}
                </div>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <p class="font-medium text-gray-800 whitespace-nowrap">{{ row.name }}</p>
              </td>
              <td class="table-cell">
                <span v-if="primaryPhone(row)" class="text-sm text-gray-700 whitespace-nowrap">{{ primaryPhone(row) }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span v-if="firstAccountId(row)" class="font-mono text-xs text-gray-600">{{ firstAccountId(row) }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span v-if="firstBank(row)" class="text-sm text-gray-700 whitespace-nowrap">{{ firstBank(row) }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span v-if="row.contact_source" class="badge bg-blue-50 text-blue-700">{{ row.contact_source.name }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.date_joined) }}</td>
              <td class="table-cell">
                <span class="text-sm text-gray-700">{{ row.created_by?.name || '—' }}</span>
              </td>
              <td class="table-cell">
                <span :class="['badge', row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                  {{ row.is_active ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink :to="`/clients/${row.id}`" class="btn-icon bg-gray-100" title="View"><EyeIcon class="w-4 h-4" /></RouterLink>
                  <RouterLink :to="`/clients/${row.id}/edit`" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></RouterLink>
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

    <!-- Card list (mobile). Edit/View go to the existing full pages rather
         than a bottom sheet — Client records carry bank/product
         relationships that make the full form meaningfully more complex
         than Interesting Clients, so the full page is kept as-is here. -->
    <div class="sm:hidden space-y-3">
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-400 text-sm">No clients found</div>
      <div v-for="row in items" :key="row.id" class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-50 text-green-600">
            {{ row.name?.charAt(0)?.toUpperCase() }}{{ row.name?.charAt(1)?.toUpperCase() || '' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate">{{ row.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
              <span v-if="primaryPhone(row)">{{ maskPhone(primaryPhone(row)) }}</span>
              <span v-if="firstAccountId(row)">· {{ firstAccountId(row) }}</span>
              <span v-if="firstBank(row)">· {{ firstBank(row) }}</span>
            </p>
            <p class="text-xs text-gray-400 mt-0.5">{{ fmtDateOnly(row.date_joined) }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
          <RouterLink :to="`/clients/${row.id}`" class="btn-icon bg-gray-100" title="View"><EyeIcon class="w-4 h-4" /></RouterLink>
          <RouterLink :to="`/clients/${row.id}/edit`" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></RouterLink>
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

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import { getClients, deleteClient } from '@/api/clients'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'
import { useLookupStore } from '@/stores/lookup'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()
const lookup = useLookupStore()

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(10)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const showMoreFilters = ref(false)

const branches       = ref([])
const users          = ref([])
const contactSources = ref([])
const levels         = ref([])

const filters  = ref({ search: '', is_active: null, branch_id: null, created_by_id: null, contact_source_id: null, level_id: null })
let debounceTimer = null

const currentPage     = computed(() => page.value)
const currentPageSize = computed(() => pageSize.value)

const activeOpts = [{ id: 'true', name: 'Enabled' }, { id: 'false', name: 'Disabled' }]

const activeMoreFilters = computed(() =>
  [filters.value.branch_id, filters.value.created_by_id, filters.value.contact_source_id, filters.value.level_id].filter(Boolean).length
)

function primaryPhone(row) {
  if (!row.phones?.length) return null
  return (row.phones.find(p => p.is_primary && p.is_active !== false) || row.phones[0])?.phone || null
}
function firstAccountId(row) {
  if (!row.banks?.length) return null
  return (row.banks.find(b => b.is_active && b.account_no) || row.banks[0])?.account_no || null
}
function firstBank(row) {
  if (!row.banks?.length) return null
  return (row.banks.find(b => b.is_active && b.account_name) || row.banks[0])?.account_name || null
}
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
function fmtDateOnly(d) { return d ? new Date(d).toISOString().slice(0, 10) : '—' }
function maskPhone(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length <= 4) return phone
  return '****' + digits.slice(-4)
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.search)            params.search            = filters.value.search
    if (filters.value.is_active !== null && filters.value.is_active !== '') params.is_active = filters.value.is_active
    if (filters.value.branch_id)         params.branch_id         = filters.value.branch_id
    if (filters.value.created_by_id)     params.created_by_id     = filters.value.created_by_id
    if (filters.value.contact_source_id) params.contact_source_id = filters.value.contact_source_id
    if (filters.value.level_id)          params.level_id          = filters.value.level_id
    const res = await getClients(params)
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { loading.value = false }
}

function debouncedLoad()   { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
function onPageSizeChange() { page.value = 1; load() }
function goPage(p)          { page.value = p; load() }
function resetFilters()     { filters.value = { search: '', is_active: null, branch_id: null, created_by_id: null, contact_source_id: null, level_id: null }; page.value = 1; load() }
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }
async function doDelete() {
  try { await deleteClient(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

onMounted(async () => {
  load()
  await lookup.loadAll()
  contactSources.value = lookup.contactSources.map(s => ({ id: s.id, name: s.name }))
  levels.value         = lookup.levels.map(l => ({ id: l.id, name: l.name }))
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,code:b.code,sub:b.code})) } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {}
})
</script>