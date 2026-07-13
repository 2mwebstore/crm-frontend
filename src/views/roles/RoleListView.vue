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

    <!-- Role cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="role in items" :key="role.id" class="card p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-800 truncate">{{ role.name }}</h3>
              <span v-if="role.is_system" class="badge text-xs flex-shrink-0" style="background:#938af4;color:#fff">System</span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5 truncate">{{ role.description || 'No description' }}</p>
          </div>
          <div class="flex gap-1 ml-2 flex-shrink-0">
            <!-- Edit: SA can edit any role; non-SA can only edit own non-system roles -->
            <button
              v-if="auth.isSuperAdmin || !role.is_system"
              @click="openEdit(role)"
              class="btn-icon" title="Edit role"
            >
              <PencilIcon class="w-4 h-4" />
            </button>
            <!-- Delete: SA can delete any; non-SA cannot delete system roles -->
            <button
              v-if="auth.isSuperAdmin || !role.is_system"
              @click="confirmDelete(role)"
              class="btn-icon text-red-500" title="Delete"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-1 mt-2">
          <span v-for="p in (role.permissions || []).slice(0, 4)" :key="p.id"
            class="badge bg-gray-100 text-gray-600 text-xs">{{ p.display_name }}</span>
          <span v-if="(role.permissions || []).length > 4"
            class="badge bg-gray-100 text-gray-500 text-xs">+{{ role.permissions.length - 4 }} more</span>
          <span v-if="!(role.permissions || []).length" class="text-xs text-gray-400">No permissions</span>
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
            <div v-for="{ group, perms } in orderedGroups" :key="group" class="border-b border-gray-100 last:border-b-0">
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
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
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
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const form = ref({ name: '', description: '', permission_ids: [] })

// Show permission grid when:
// - Creating a new role (always)
// - Editing: SA can always edit perms; non-SA can only edit non-system role perms
const showPerms = computed(() => {
  if (!editing.value) return true                         // creating
  if (auth.isSuperAdmin) return true                      // SA can always edit perms
  return !editing.value.is_system                         // non-SA only on own roles
})

// ── Permission group ordering & labels ────────────────────────────────────────
// Preferred display order — related groups clustered together: client-facing
// data first, then transactions, then reports, then lookups/configuration,
// then system administration last. Anything the backend returns that isn't
// in this list (e.g. a brand new permission group added later) just falls
// back to alphabetical order at the end — nothing breaks, it just won't be
// specifically clustered until this list is updated too.
// Mirrors AppSidebar.vue's own section order exactly, so the Roles page
// clusters permissions the same way the nav clusters pages:
//   (Dashboard has no permission group)
//   CRM        → Interesting Clients, Clients
//   Transactions → Deposits, Withdrawals, Turn Over Bet, Follow Ups, Reports
//   Management → Users, Roles & Permissions, Branches
//   Configuration → Levels, Contact Sources, Bank Types, Company Banks,
//                    Product Types, Bonus Options, Currencies
// Any group with no sidebar nav item (lookup/configuration/phone — broad
// umbrella permissions rather than a page of their own) is appended after,
// and anything entirely unrecognized falls back to alphabetical at the very
// end — nothing silently disappears if a new group shows up later.
const GROUP_ORDER = [
  // CRM
  'interesting_clients', 'clients',
  // Transactions
  'deposits', 'withdrawals', 'turnover_bets', 'follow_ups', 'reports',
  // Management
  'users', 'roles', 'branch',
  // Configuration
  'levels', 'contact_sources', 'bank_types', 'company_banks', 'product_types', 'bonus_options', 'currencies',
  // Broad umbrella permissions with no dedicated sidebar page
  'lookup', 'configuration', 'phone',
]

// Labels matched to AppSidebar.vue's own item labels verbatim, so the same
// thing is called the same name in both places (e.g. sidebar literally
// says "Turn Over Bet", not "Turnover Bets" — kept identical here).
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
  lookup: 'Lookup (General)',
  configuration: 'Configuration',
  phone: 'Phone Numbers',
}

function groupLabel(g) {
  if (GROUP_LABELS[g]) return GROUP_LABELS[g]
  return g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Reorders whatever groups the backend returns according to GROUP_ORDER,
// appending any unlisted group (alphabetically) at the end.
const orderedGroups = computed(() => {
  const keys = Object.keys(grouped.value)
  const known = GROUP_ORDER.filter(g => keys.includes(g))
  const unknown = keys.filter(g => !GROUP_ORDER.includes(g)).sort()
  return [...known, ...unknown].map(group => ({ group, perms: grouped.value[group] }))
})

// ── Permission helpers ─────────────────────────────────────────────────────────
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
  try { const res = await getRoles(); items.value = res.data || [] } catch { }
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
    // Pre-check current permissions
    permission_ids: (role.permissions || []).map(p => p.id)
  }
  modal.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) { error('Name is required'); return }
  saving.value = true
  try {
    if (editing.value) {
      // Update name + description
      await updateRole(editing.value.id, { name: form.value.name, description: form.value.description })
      // Update permissions if shown (SA always; non-SA only own roles)
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