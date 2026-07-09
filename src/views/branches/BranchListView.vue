<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Branches</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage organizational branches and their code prefixes</p>
      </div>
      <button v-if="auth.isSuperAdmin" @click="openCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Branch
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <input v-model="search" @input="applyFilter" type="text" class="input w-52" placeholder="Search name, code…" />
      <SearchableSelect v-model="statusFilter" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="applyFilter" />
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Name</th>
              <th class="table-header">Code (Prefix)</th>
              <th class="table-header">Description</th>
              <th class="table-header">Status</th>
              <th class="table-header">Created By</th>
              <th v-if="auth.isSuperAdmin" class="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="8" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="8" class="table-cell text-center py-10 text-gray-400">No branches found</td></tr>
            <tr v-else v-for="(row, idx) in pagedItems" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ (page - 1) * pageSize + idx + 1 }}</td>
              <td class="table-cell">
                <p class="font-medium text-gray-800">{{ row.name }}</p>
              </td>
              <td class="table-cell">
                <span class="font-mono text-sm font-bold px-2 py-0.5 rounded" style="background:#938af4;color:#fff">{{ row.code }}</span>
              </td>
              <td class="table-cell text-sm text-gray-600">{{ row.description || '—' }}</td>
              <td class="table-cell">
                <span :class="['badge', row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="table-cell text-sm text-gray-600">{{ row.created_by?.name || '—' }}</td>
              <td v-if="auth.isSuperAdmin" class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="auth.canAny('branch.manage')" @click="openEdit(row)" class="btn-icon"><PencilIcon class="w-4 h-4" /></button>
                  <button v-if="auth.canAny('branch.manage')" @click="confirmDelete(row)" class="btn-icon text-red-500"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination inside card -->
      <div v-if="items.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span class="text-xs">Showing {{ (page-1)*pageSize+1 }}–{{ Math.min(page*pageSize, items.length) }} of {{ items.length }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" @click="page--" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="page++" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal v-model="modal" :title="editing ? 'Edit Branch' : 'New Branch'" size="md">
      <div class="space-y-4">
        <div>
          <label class="label">Branch Name <span class="text-red-500">*</span></label>
          <input v-model="form.name" class="input" placeholder="e.g. Phnom Penh" required />
        </div>
        <div>
          <label class="label">Code Prefix <span class="text-red-500">*</span></label>
          <input v-model="form.code" class="input font-mono uppercase" placeholder="e.g. PHNM" maxlength="10" required />
          <p class="text-xs text-gray-400 mt-1">
            Uppercase letters only, max 10 chars. Codes will look like:
            <span class="font-mono font-semibold" style="color:#938af4">{{ form.code || 'ER' }}-0000001</span>
          </p>
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input resize-none" rows="2" placeholder="Optional description…" />
        </div>
        <div v-if="editing" class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.is_active" class="accent-primary w-4 h-4" />
          <span>Active</span>
        </div>
      </div>
      <template #footer>
        <button @click="modal = false" class="btn-secondary">Cancel</button>
        <button @click="handleSave" class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { getBranches, createBranch, updateBranch, deleteBranch } from '@/api/branches'
import { useToast } from '@/composables/useToast'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'

const auth = useAuthStore()
const { success, error } = useToast()

const items      = ref([])
const allItems   = ref([])
const search     = ref('')
const statusFilter = ref(null)
const statusOpts  = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]
const page         = ref(1)
const pageSize     = ref(20)
const pagedItems   = computed(() => items.value.slice((page.value-1)*pageSize.value, page.value*pageSize.value))
const totalPages   = computed(() => Math.ceil(items.value.length / pageSize.value))
function onPageSizeChange() { page.value = 1 }
const loading = ref(false)
const saving  = ref(false)
const modal   = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const deleteDialog = ref(false)

const defaultForm = () => ({ name: '', code: '', description: '', is_active: true })
const form = ref(defaultForm())

async function load() {
  loading.value = true
  try {
    const res = await getBranches({ show_all: true })
    allItems.value = res.data || []
    applyFilter()
  } catch {} finally { loading.value = false }
}

function applyFilter() { page.value = 1;
  let list = allItems.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(b => b.name?.toLowerCase().includes(s) || b.code?.toLowerCase().includes(s))
  }
  if (statusFilter.value !== null && statusFilter.value !== '') {
    const active = statusFilter.value === 'true'
    list = list.filter(b => b.is_active === active)
  }
  items.value = list
}
function resetFilters() { search.value = ''; statusFilter.value = null; page.value = 1; applyFilter() }

function openCreate() { editing.value = null; form.value = defaultForm(); modal.value = true }
function openEdit(row) {
  editing.value = row
  form.value = { name: row.name, code: row.code, description: row.description || '', is_active: row.is_active }
  modal.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.code) { error('Name and Code are required'); return }
  form.value.code = form.value.code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  saving.value = true
  try {
    if (editing.value) {
      await updateBranch(editing.value.id, form.value); success('Branch updated')
    } else {
      await createBranch(form.value); success('Branch created')
    }
    modal.value = false; load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }
async function doDelete() {
  try { await deleteBranch(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

onMounted(load)
</script>