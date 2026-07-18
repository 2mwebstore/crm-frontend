<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Roles & Permissions</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage access control</p>
      </div>
      <button @click="openCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Role
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap items-end gap-3">
      <div class="flex-1 min-w-[200px]">
        <label class="label">Search by name</label>
        <input
          v-model="filters.name"
          type="text"
          placeholder="e.g. Manager"
          class="input"
        />
      </div>

      <div v-if="auth.isSuperAdmin" class="min-w-[200px]">
        <label class="label">Created By</label>
        <select v-model="filters.created_by" class="input">
          <option :value="null">All</option>
          <option v-for="creator in creatorOptions" :key="creator.id" :value="creator.id">
            {{ creator.name }}
          </option>
        </select>
      </div>

      <button @click="resetFilters" class="btn-secondary" :disabled="!hasActiveFilters">
        Clear
      </button>
    </div>

    <!-- Role table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th class="text-left px-4 py-3 font-medium">Name</th>
              <th class="text-left px-4 py-3 font-medium">Description</th>
              <th class="text-left px-4 py-3 font-medium">Created By</th>
              <th class="text-left px-4 py-3 font-medium">Permissions</th>
              <th class="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!pagedItems.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">No roles found</td>
            </tr>
            <tr v-for="role in pagedItems" :key="role.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-800">{{ role.name }}</span>
                  <span v-if="role.is_system" class="badge text-xs flex-shrink-0" style="background:#938af4;color:#fff">System</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ role.description || '—' }}</td>
              <td class="px-4 py-3 text-gray-500">{{ role.created_by?.name || 'No Root' }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="p in (role.permissions || []).slice(0, 3)" :key="p.id"
                    class="badge bg-gray-100 text-gray-600 text-xs">{{ p.display_name }}</span>
                  <span v-if="(role.permissions || []).length > 3"
                    class="badge bg-gray-100 text-gray-500 text-xs">+{{ role.permissions.length - 3 }} more</span>
                  <span v-if="!(role.permissions || []).length" class="text-xs text-gray-400">No permissions</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-1">
                  <button
                    v-if="auth.isSuperAdmin || !role.is_system"
                    @click="openEdit(role)"
                    class="btn-icon" title="Edit role"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    v-if="auth.isSuperAdmin || !role.is_system"
                    @click="confirmDelete(role)"
                    class="btn-icon text-red-500" title="Delete"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
        <PageSizeSelector v-model="pageSize" />

        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>{{ rangeLabel }}</span>
          <div class="flex items-center gap-1 ml-2">
            <button
              class="btn-icon"
              :disabled="page <= 1"
              @click="page--"
              title="Previous page"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="px-2 text-gray-700">{{ page }} / {{ totalPages }}</span>
            <button
              class="btn-icon"
              :disabled="page >= totalPages"
              @click="page++"
              title="Next page"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Role modal -->
    <AppModal v-model="modal" :title="editing ? `Edit Role — ${editing.name}` : 'New Role'" size="lg">
      <div class="space-y-4">

        <!-- Name + Description -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" class="input" placeholder="e.g. Manager" required />
          </div>
          <div>
            <label class="label">Description</label>
            <input v-model="form.description" class="input" placeholder="Optional" />
          </div>
        </div>

        <!-- Permissions grid — show on create AND on edit (SA always, non-SA only own roles) -->
        <div v-if="showPerms">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <label class="label mb-0">Permissions
              <span class="text-gray-400 font-normal text-xs ml-1">{{ form.permission_ids.length }}/{{ totalPerms }} selected</span>
            </label>
            <div class="flex items-center gap-3">
              <button @click="checkAll"   type="button" class="text-xs text-primary font-medium hover:underline">Check all</button>
              <button @click="uncheckAll" type="button" class="text-xs text-gray-400 font-medium hover:underline">Uncheck all</button>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <div v-for="section in sections" :key="section.key">
              <!-- Section header (CRM / Management Attendance) -->
              <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">{{ section.label }}</span>
              </div>
              <div v-for="{ group, perms } in section.groups" :key="group" class="border-b border-gray-100 last:border-b-0">
              <!-- Group header -->
              <div class="flex items-center justify-between px-4 py-2 bg-gray-50 sticky top-0">
                <div class="flex items-center gap-2">
                  <input type="checkbox"
                    class="accent-primary w-4 h-4"
                    :checked="isGroupChecked(perms)"
                    :indeterminate="isGroupIndeterminate(perms)"
                    @change="toggleGroup(perms, $event.target.checked)"
                  />
                  <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ groupLabel(group) }}</span>
                </div>
                <span class="text-xs text-gray-400">{{ groupSelectedCount(perms) }}/{{ perms.length }}</span>
              </div>
              <!-- Permission rows -->
              <div class="grid grid-cols-2 gap-0 px-2 py-1">
                <label v-for="p in perms" :key="p.id"
                  class="flex items-start gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5">
                  <input type="checkbox" :value="p.id" v-model="form.permission_ids"
                    class="accent-primary w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p class="font-medium text-gray-800">{{ p.display_name }}</p>
                    <p v-if="p.description" class="text-gray-400 mt-0.5 leading-tight">{{ p.description }}</p>
                  </div>
                </label>
              </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <template #footer>
        <button @click="modal = false" class="btn-secondary">Cancel</button>
        <button @click="handleSave" class="btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : (editing ? 'Update Role' : 'Create Role') }}
        </button>
      </template>
    </AppModal>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import PageSizeSelector from '@/components/common/PageSizeSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { getRoles, createRole, updateRole, assignPermissions, deleteRole, getPermissionsGrouped } from '@/api/roles'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()
const items   = ref([])
const grouped = ref({})
const modal   = ref(false)
const editing = ref(null)
const saving  = ref(false)
const loading = ref(false)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const form = ref({ name: '', description: '', permission_ids: [] })

// ── Filters ────────────────────────────────────────────────────────────────────
const filters = ref({ name: '', created_by: null })
const hasActiveFilters = computed(() => !!filters.value.name || filters.value.created_by !== null)

function resetFilters() {
  filters.value = { name: '', created_by: null }
}

// Debounce filter-triggered reloads (name typing especially) so we don't
// hit the API on every keystroke.
let debounceTimer = null
watch(filters, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
}, { deep: true })

// Distinct creators seen so far, used to populate the "Created By" filter.
// Backed by whatever's currently loaded rather than a dedicated endpoint —
// swap this out for a proper /users lookup if/when one is available.
const creatorOptions = computed(() => {
  const map = new Map()
  for (const role of items.value) {
    if (role.created_by?.id) map.set(role.created_by.id, role.created_by)
  }
  return [...map.values()]
})

// ── Pagination (client-side — backend doesn't paginate roles yet) ──────────────
const page = ref(1)
const pageSize = ref(20)

watch(pageSize, () => { page.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return items.value.slice(start, start + pageSize.value)
})
const rangeLabel = computed(() => {
  if (!items.value.length) return '0 results'
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, items.value.length)
  return `${start}–${end} of ${items.value.length}`
})

// Keep page in range if filtering shrinks the result set
watch(totalPages, (tp) => { if (page.value > tp) page.value = tp })

// Show permission grid when:
// - Creating a new role (always)
// - Editing: SA can always edit perms; non-SA can only edit non-system role perms
const showPerms = computed(() => {
  if (!editing.value) return true                         // creating
  if (auth.isSuperAdmin) return true                      // SA can always edit perms
  return !editing.value.is_system                         // non-SA only on own roles
})

// ── Permission group ordering & labels ────────────────────────────────────────
const GROUP_ORDER = [
  'interesting_clients', 'clients',
  'deposits', 'withdrawals', 'turnover_bets', 'follow_ups', 'reports',
  'users', 'roles', 'branch',
  'levels', 'contact_sources', 'bank_types', 'company_banks', 'product_types', 'bonus_options', 'currencies',
  'audit_logs',
  'lookup', 'configuration', 'phone',
]

// Groups belonging to the "Management Attendance" section — everything
// else in GROUP_ORDER (plus any unrecognized/unknown group) falls under
// "CRM" instead.
const ATTENDANCE_GROUPS = [
  'attendance', 'leave_requests', 'leave_types', 'overtime_requests', 'activity_requests', 'schedule_overrides',
]

const SECTION_LABELS = { crm: 'CRM', attendance_mgmt: 'Management Attendance' }

const GROUP_LABELS = {
  interesting_clients: 'Interesting Clients',
  turnover_bets: 'Turn Over Bet',
  follow_ups: 'Follow Ups',
  roles: 'Roles & Permissions',
  branch: 'Branches',
  contact_sources: 'Contact Sources',
  bank_types: 'Bank Types',
  company_banks: 'Company Banks',
  product_types: 'Product Types',
  bonus_options: 'Bonus Options',
  currencies: 'Currencies',
  attendance: 'Attendance',
  leave_requests: 'Leave',
  leave_types: 'Leave Types',
  overtime_requests: 'Overtime',
  activity_requests: 'Activity',
  schedule_overrides: 'Schedule Overrides',
  audit_logs: 'Audit Log',
  lookup: 'Lookup (General)',
  configuration: 'Configuration',
  phone: 'Phone Numbers',
}

function groupLabel(g) {
  if (GROUP_LABELS[g]) return GROUP_LABELS[g]
  return g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// All known groups (CRM + Attendance), ordered within each, followed by
// any unrecognized group (sorted, filed under CRM as a catch-all).
const orderedGroups = computed(() => {
  const keys = Object.keys(grouped.value)
  const known = GROUP_ORDER.filter(g => keys.includes(g))
  const unknown = keys.filter(g => !GROUP_ORDER.includes(g)).sort()
  return [...known, ...unknown].map(group => ({ group, perms: grouped.value[group] }))
})

// orderedGroups split into the two top-level sections for rendering —
// each section only appears if it actually has at least one group with
// permissions loaded.
const sections = computed(() => {
  const crm = []
  const attendanceMgmt = []
  for (const entry of orderedGroups.value) {
    if (ATTENDANCE_GROUPS.includes(entry.group)) attendanceMgmt.push(entry)
    else crm.push(entry)
  }
  const out = []
  if (crm.length) out.push({ key: 'crm', label: SECTION_LABELS.crm, groups: crm })
  if (attendanceMgmt.length) out.push({ key: 'attendance_mgmt', label: SECTION_LABELS.attendance_mgmt, groups: attendanceMgmt })
  return out
})

const totalPerms = computed(() =>
  Object.values(grouped.value).reduce((s, perms) => s + perms.length, 0)
)
const allPermIds = computed(() =>
  Object.values(grouped.value).flatMap(perms => perms.map(p => p.id))
)
function groupSelectedCount(perms) {
  return perms.filter(p => form.value.permission_ids.includes(p.id)).length
}
function isGroupChecked(perms) {
  return perms.length > 0 && groupSelectedCount(perms) === perms.length
}
function isGroupIndeterminate(perms) {
  const n = groupSelectedCount(perms)
  return n > 0 && n < perms.length
}
function checkAll()   { form.value.permission_ids = [...allPermIds.value] }
function uncheckAll() { form.value.permission_ids = [] }
function toggleGroup(perms, checked) {
  const groupIds = perms.map(p => p.id)
  if (checked) {
    const s = new Set(form.value.permission_ids)
    groupIds.forEach(id => s.add(id))
    form.value.permission_ids = [...s]
  } else {
    const remove = new Set(groupIds)
    form.value.permission_ids = form.value.permission_ids.filter(id => !remove.has(id))
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.name) params.name = filters.value.name
    if (filters.value.created_by !== null) params.created_by = filters.value.created_by
    const res = await getRoles(params)
    items.value = res.data || []
  } catch {
    // keep previous items on failure
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', description: '', permission_ids: [] }
  modal.value = true
}

function openEdit(role) {
  editing.value = role
  form.value = {
    name: role.name,
    description: role.description || '',
    permission_ids: (role.permissions || []).map(p => p.id)
  }
  modal.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) { error('Name is required'); return }
  saving.value = true
  try {
    if (editing.value) {
      await updateRole(editing.value.id, { name: form.value.name, description: form.value.description })
      if (showPerms.value) {
        await assignPermissions(editing.value.id, { permission_ids: form.value.permission_ids })
      }
      success('Role updated')
    } else {
      await createRole(form.value)
      success('Role created')
    }
    modal.value = false
    form.value = { name: '', description: '', permission_ids: [] }
    load()
  } catch (e) { error(e?.error || 'Failed') } finally { saving.value = false }
}

function confirmDelete(role) { deleteTarget.value = role; deleteDialog.value = true }
async function doDelete() {
  try { await deleteRole(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Cannot delete role — it may be in use') }
}

onMounted(async () => {
  load()
  try { const res = await getPermissionsGrouped(); grouped.value = res.data || {} } catch { }
})
</script>