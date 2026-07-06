<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div><h1 class="text-xl font-semibold text-gray-800">{{ title }}</h1><p class="text-sm text-gray-500">{{ subtitle }}</p></div>
      <button v-if="auth.canAny('configuration.manage', 'lookup.manage')" @click="openCreate" class="btn-primary flex items-center gap-2"><PlusIcon class="w-4 h-4" />New</button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <input v-model="search" type="text" class="input w-52" placeholder="Search name…" />
      <SearchableSelect v-model="statusFilter" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" />
      <SearchableSelect v-model="branchFilter" :options="branches" placeholder="All branches" all-label="All branches" class="w-44" />
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <AppTable :columns="columns" :rows="filteredItems" :loading="loading">
      <template v-for="col in colorCols" :key="col" #[`cell-${col}`]="{ value }">
        <div class="flex items-center gap-2">
          <div v-if="value" class="w-4 h-4 rounded-full border border-gray-200" :style="{ background: value }" />
          <span class="text-sm text-gray-700">{{ value || '—' }}</span>
        </div>
      </template>
      <template #cell-branch="{ row }">
        <span v-if="row.branch" class="badge bg-indigo-50 text-indigo-700 font-mono text-xs">{{ row.branch.code }}</span>
        <span v-else class="text-gray-400 text-xs">—</span>
      </template>
      <template #cell-created_by="{ row }">
        <span class="text-sm text-gray-600">{{ row.created_by?.name || '—' }}</span>
      </template>
      <template #cell-is_active="{ value }">
        <span :class="['badge', value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ value ? 'Active' : 'Inactive' }}</span>
      </template>
      <template #cell-calc_type="{ value }">
        <span class="badge bg-blue-100 text-blue-700">{{ value }}</span>
      </template>
      <template #cell-is_base="{ value }">
        <span :class="['badge', value ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500']">{{ value ? 'Base' : '—' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button v-if="auth.canAny('configuration.manage', 'lookup.manage')" @click="openEdit(row)" class="btn-icon"><PencilIcon class="w-4 h-4" /></button>
          <button v-if="auth.canAny('configuration.manage', 'lookup.manage')" @click="confirmDelete(row)" class="btn-icon text-red-500"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </template>
    </AppTable>

    <!-- Create/Edit Modal -->
    <AppModal v-model="modal" :title="editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`" size="md">
      <div class="space-y-3">
        <!-- Branch select - applies to all lookup types -->
        <div>
          <label class="label">Branch</label>
          <SearchableSelect v-model="form.branch_id" :options="branches" placeholder="No branch (global)" />
        </div>
        <slot name="form" :form="form" />
      </div>
      <template #footer>
        <button @click="modal = false" class="btn-secondary">Cancel</button>
        <button @click="handleSave" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppTable from '@/components/common/AppTable.vue'
import AppModal from '@/components/common/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { getBranches } from '@/api/branches'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  title: String,
  subtitle: String,
  columns: Array,
  defaultForm: Object,
  colorCols: { type: Array, default: () => [] },
  fetchFn: Function,
  createFn: Function,
  updateFn: Function,
  deleteFn: Function,
})

const auth = useAuthStore()
const { success, error } = useToast()
const items        = ref([])
const allItems     = ref([])
const loading      = ref(false)
const modal        = ref(false)
const branches     = ref([])
const search       = ref('')
const statusFilter = ref(null)
const branchFilter = ref(null)
const statusOpts   = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]

const filteredItems = computed(() => {
  let list = allItems.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(i => i.name?.toLowerCase().includes(s) || i.code?.toLowerCase().includes(s))
  }
  if (statusFilter.value !== null && statusFilter.value !== '') {
    list = list.filter(i => i.is_active === (statusFilter.value === 'true'))
  }
  if (branchFilter.value) {
    list = list.filter(i => i.branch_id === branchFilter.value || i.branch?.id === branchFilter.value)
  }
  return list
})
function resetFilters() { search.value = ''; statusFilter.value = null; branchFilter.value = null }
const editing = ref(null)
const saving = ref(false)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const form = ref({ ...props.defaultForm })

async function load() {
  loading.value = true
  try { const res = await props.fetchFn(); items.value = res.data || []; allItems.value = res.data || [] } catch { } finally { loading.value = false }
}

function openCreate() { form.value = { ...props.defaultForm, branch_id: null }; editing.value = null; modal.value = true }
function openEdit(row) { form.value = { ...row, branch_id: row.branch_id || null }; editing.value = row; modal.value = true }
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }

async function handleSave() {
  saving.value = true
  try {
    if (editing.value) { await props.updateFn(editing.value.id, form.value); success('Updated') }
    else { await props.createFn(form.value); success('Created') }
    modal.value = false; load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

async function doDelete() {
  try { await props.deleteFn(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

onMounted(async () => {
  load()
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code })) } catch {}
})
defineExpose({ load, form })
</script>