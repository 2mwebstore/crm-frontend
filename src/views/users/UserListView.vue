<template>
  <div class="space-y-6">
    <!-- Header with button -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">User Management</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          <span v-if="auth.isSuperAdmin">Super Admin — full control over all users</span>
          <span v-else>Manage your sub-users</span>
        </p>
      </div>
      <button v-if="auth.isSuperAdmin" @click="openAdminCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New User
      </button>
      <button v-else @click="openCreate" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Sub User
      </button>
    </div>

    <!-- ── SUPER ADMIN VIEW ─────────────────────────────────────────────────── -->
    <template v-if="auth.isSuperAdmin">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-4">
          <p class="text-xs text-gray-500 font-medium uppercase">Total Users</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ allUsers.length }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500 font-medium uppercase">Root (Simple) Users</p>
          <p class="text-2xl font-bold mt-1" style="color:#938af4">{{ rootUsers.length }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500 font-medium uppercase">Sub Users</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ allUsers.filter(u => !u.is_super_admin).length }}</p>
        </div>
      </div>

      <!-- Search -->
      <div class="card p-4 flex flex-wrap gap-3">
        <input v-model="search" @input="applyFilter" type="text" class="input w-52" placeholder="Search name, email…" />
        <SearchableSelect v-model="typeFilter" :options="typeOpts" value-key="id" label-key="name" placeholder="All types" all-label="All types" class="w-36" @update:modelValue="applyFilter" />
        <SearchableSelect v-model="statusFilter" :options="statusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="applyFilter" />
        <button @click="resetSearch" class="btn-secondary btn-sm">Reset</button>
      </div>

      <AppTable :columns="adminColumns" :rows="pagedUsers" :loading="loading">
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                 :style="{ background: row.is_super_admin ? '#ef4444' : '#938af4' }">
              {{ row.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-800 text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-400">{{ row.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-type="{ row }">
          <span v-if="row.is_super_admin" class="badge bg-red-100 text-red-700">Super Admin</span>
          <span v-else class="badge bg-primary-100 text-primary-700">Simple User</span>
        </template>

        <template #cell-parent="{ row }">
          <span v-if="row.parent_id" class="text-xs text-gray-600">
            {{ parentLabel(row.parent_id) }}
          </span>
          <span v-else class="badge bg-gray-100 text-gray-500">Root</span>
        </template>

        <template #cell-role="{ row }">
          <span v-if="row.role" class="badge bg-blue-100 text-blue-700">{{ row.role.name }}</span>
          <span v-else class="text-xs text-gray-400">No role</span>
        </template>
        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div v-if="!row.is_super_admin" class="flex items-center justify-end gap-1">
            <button @click="openAdminEdit(row)" class="btn-icon"><PencilIcon class="w-4 h-4" /></button>
            <button @click="confirmAdminDelete(row)" class="btn-icon text-red-500"><TrashIcon class="w-4 h-4" /></button>
          </div>
          <span v-else class="text-xs text-gray-400 pr-2">Protected</span>
        </template>
      </AppTable>

      <div v-if="filteredUsers.length > 0" class="card flex items-center justify-between px-4 py-3 text-sm text-gray-500">
        <PageSizeSelect v-model="userPageSize" @update:modelValue="onUserPageSizeChange" />
        <span class="text-xs">Showing {{ (userPage-1)*userPageSize+1 }}–{{ Math.min(userPage*userPageSize, filteredUsers.length) }} of {{ filteredUsers.length }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="userPage <= 1" @click="userPage--" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ userPage }} / {{ totalUserPages }}</span>
          <button :disabled="userPage >= totalUserPages" @click="userPage++" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Admin create/edit modal -->
      <AppModal v-model="adminModal" :title="adminEditing ? 'Edit User' : 'New User'" size="md">
        <div class="space-y-3">
          <!-- Branches multi-select -->
          <div>
            <label class="label">Branches <span class="text-red-500">*</span> <span class="text-gray-400 font-normal">(Super Admin assigns)</span></label>
            <!-- Branch picker -->
            <SearchableSelect
              v-model="branchToAdd"
              :options="unselectedBranches"
              placeholder="Add a branch…"
              :show-all="false"
              @update:modelValue="addBranch"
            />
            <!-- Selected branch tags -->
            <div v-if="adminForm.branch_ids.length" class="flex flex-wrap gap-2 mt-2">
              <span v-for="id in adminForm.branch_ids" :key="id"
                class="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-2.5 py-1 rounded-full">
                <span class="font-mono">{{ branchLabel(id) }}</span>
                <button type="button" @click="removeBranch(id)" class="text-primary-400 hover:text-primary-700 leading-none">×</button>
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 mt-1">No branches assigned.</p>
          </div>

          <div><label class="label">Name <span class="text-red-500">*</span></label>
            <input v-model="adminForm.name" class="input" required @input="onAdminNameInput" /></div>
          <div v-if="!adminEditing"><label class="label">Email <span class="text-red-500">*</span></label>
            <input
              v-model="adminForm.email"
              type="text"
              class="input"
              required
              :readonly="adminForm.branch_ids.length === 1"
              :class="adminForm.branch_ids.length === 1 ? 'bg-gray-50 cursor-not-allowed' : ''"
            />
            <p v-if="adminForm.branch_ids.length === 1" class="text-xs text-gray-400 mt-1">Auto-generated from name + branch name — assign more than one branch to enter a custom email.</p>
          </div>
          <div><label class="label">{{ adminEditing ? 'New Password (blank = keep)' : 'Password *' }}</label>
            <input v-model="adminForm.password" type="password" class="input" :required="!adminEditing" /></div>
          <div v-if="!adminEditing?.is_super_admin">
            <label class="label">Role</label>
            <SearchableSelect v-model="adminForm.role_id" :options="roles" placeholder="No role" all-label="— No role —" />
          </div>
          <div v-else class="bg-red-50 rounded-lg p-3 text-xs text-red-600 border border-red-100">
            Super Admin — role cannot be changed
          </div>

          <!-- Parent (who created this user) -->
          <div v-if="!adminEditing?.is_super_admin">
            <label class="label">Parent <span class="text-gray-400 font-normal">(nil = root/simple user)</span></label>
            <SearchableSelect
              v-model="adminForm.parent_id"
              :options="parentOptions"
              placeholder="No parent — root user"
              all-label="— No parent (root user) —"
            />
          </div>

          <div>
            <label class="label">Shift Type</label>
            <div class="flex gap-1">
              <button
                v-for="t in shiftTypes" :key="t.id"
                type="button"
                @click="adminForm.shift_type = t.id"
                :class="['btn-secondary btn-sm flex-1', adminForm.shift_type === t.id ? '!bg-primary-600 !text-white hover:!bg-primary-700' : '']"
              >{{ t.name }}</button>
            </div>
            <p v-if="adminForm.shift_type === 'cross_day'" class="text-xs text-gray-400 mt-1">Night Shift — check-in and check-out can fall on different calendar dates; duplicate-date checks on Leave/Overtime requests are relaxed for this user.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Shift In Time</label>
              <TimePicker v-model="adminForm.shift_check_in_time" placeholder="Check-in time" class="w-full" />
            </div>
            <div>
              <label class="label">Shift Out Time</label>
              <TimePicker v-model="adminForm.shift_check_out_time" placeholder="Check-out time" class="w-full" />
            </div>
          </div>

          <div v-if="adminEditing" class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="adminForm.is_active" class="accent-primary" />
            <span>Active</span>
          </div>
        </div>
        <template #footer>
          <button @click="adminModal = false" class="btn-secondary">Cancel</button>
          <RequiredFieldsGuard
            :fields="{
              Branch: adminForm.branch_ids.length ? true : 0,
              Name: adminForm.name,
              Email: adminEditing ? true : adminForm.email,
              Password: adminEditing ? true : adminForm.password,
            }"
            v-slot="{ isValid, missing }"
          >
            <button
              @click="handleAdminSave"
              class="btn-primary"
              :disabled="saving || !isValid"
              :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </RequiredFieldsGuard>
        </template>
      </AppModal>

      <ConfirmDialog v-model="adminDeleteDialog" @confirm="doAdminDelete" />
    </template>

    <!-- ── SIMPLE / SUB-USER VIEW ────────────────────────────────────────────── -->
    <template v-else>
      <div v-if="filteredUsers.length > 0" class="card flex items-center justify-between px-4 py-3 text-sm text-gray-500">
        <PageSizeSelect v-model="userPageSize" @update:modelValue="onUserPageSizeChange" />
        <span class="text-xs">Showing {{ (userPage-1)*userPageSize+1 }}–{{ Math.min(userPage*userPageSize, filteredUsers.length) }} of {{ filteredUsers.length }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="userPage <= 1" @click="userPage--" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ userPage }} / {{ totalUserPages }}</span>
          <button :disabled="userPage >= totalUserPages" @click="userPage++" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Simple User Filters -->
      <div class="card p-4 flex flex-wrap gap-3">
        <input v-model="subSearch" @input="applySubFilter" type="text" class="input w-52" placeholder="Search name, email…" />
        <SearchableSelect v-model="subStatusFilter" :options="subStatusOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="applySubFilter" />
        <button @click="resetSubFilters" class="btn-secondary btn-sm">Reset</button>
      </div>

      <AppTable :columns="subColumns" :rows="pagedSubUsers" :loading="loading">
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gray-400">
              {{ row.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-800 text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-400">{{ row.email }}</p>
            </div>
          </div>
        </template>

        <template #cell-parent="{ row }">
          <span class="text-xs text-gray-600">{{ parentLabel(row.parent_id) }}</span>
        </template>

        <template #cell-role="{ row }">
          <span v-if="row.role" class="badge bg-primary-100 text-primary-700">{{ row.role.name }}</span>
          <span v-else class="text-xs text-gray-400">No role</span>
        </template>
        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button @click="openEdit(row)" class="btn-icon"><PencilIcon class="w-4 h-4" /></button>
            <button @click="confirmDelete(row)" class="btn-icon text-red-500"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </template>
      </AppTable>

      <div v-if="filteredSubUsers.length > 0" class="card flex items-center justify-between px-4 py-3 text-sm text-gray-500">
        <PageSizeSelect v-model="subPageSize" @update:modelValue="subPage = 1" />
        <span class="text-xs">Showing {{ (subPage-1)*subPageSize+1 }}–{{ Math.min(subPage*subPageSize, filteredSubUsers.length) }} of {{ filteredSubUsers.length }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="subPage <= 1" @click="subPage--" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ subPage }} / {{ totalSubPages }}</span>
          <button :disabled="subPage >= totalSubPages" @click="subPage++" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <AppModal v-model="modal" :title="editing ? 'Edit Sub User' : 'New Sub User'" size="md">
        <div class="space-y-3">
          <!-- Branches multi-select — same pattern as the Super Admin's Edit User modal -->
          <div>
            <label class="label">Branches <span class="text-red-500">*</span></label>
            <SearchableSelect
              v-model="subBranchToAdd"
              :options="unselectedSubBranches"
              placeholder="Add a branch…"
              :show-all="false"
              @update:modelValue="addSubBranch"
            />
            <div v-if="form.branch_ids.length" class="flex flex-wrap gap-2 mt-2">
              <span v-for="id in form.branch_ids" :key="id"
                class="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-2.5 py-1 rounded-full">
                <span class="font-mono">{{ branchLabel(id) }}</span>
                <button type="button" @click="removeSubBranch(id)" class="text-primary-400 hover:text-primary-700 leading-none">×</button>
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 mt-1">No branches assigned.</p>
          </div>

          <div><label class="label">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" class="input" required @input="onSubUserNameInput" /></div>
          <div v-if="!editing"><label class="label">Email <span class="text-red-500">*</span></label>
            <input
              v-model="form.email"
              type="text"
              class="input"
              required
              :readonly="form.branch_ids.length === 1"
              :class="form.branch_ids.length === 1 ? 'bg-gray-50 cursor-not-allowed' : ''"
            />
            <p v-if="form.branch_ids.length === 1" class="text-xs text-gray-400 mt-1">Auto-generated from name + branch name — assign more than one branch to enter a custom email.</p>
          </div>
          <div><label class="label">{{ editing ? 'New Password (blank = keep)' : 'Password *' }}</label>
            <input v-model="form.password" type="password" class="input" :required="!editing" /></div>
          <div>
            <label class="label">Role <span class="text-red-500">*</span></label>
            <SearchableSelect v-model="form.role_id" :options="roles" placeholder="Select a role" />
          </div>

          <div>
            <label class="label">Shift Type</label>
            <div class="flex gap-1">
              <button
                v-for="t in shiftTypes" :key="t.id"
                type="button"
                @click="form.shift_type = t.id"
                :class="['btn-secondary btn-sm flex-1', form.shift_type === t.id ? '!bg-primary-600 !text-white hover:!bg-primary-700' : '']"
              >{{ t.name }}</button>
            </div>
            <p v-if="form.shift_type === 'cross_day'" class="text-xs text-gray-400 mt-1">Night Shift — check-in and check-out can fall on different calendar dates; duplicate-date checks on Leave/Overtime requests are relaxed for this user.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Shift In Time</label>
              <TimePicker v-model="form.shift_check_in_time" placeholder="Check-in time" class="w-full" />
            </div>
            <div>
              <label class="label">Shift Out Time</label>
              <TimePicker v-model="form.shift_check_out_time" placeholder="Check-out time" class="w-full" />
            </div>
          </div>

          <div v-if="editing" class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="form.is_active" class="accent-primary" />
            <span>Active</span>
          </div>
        </div>
        <template #footer>
          <button @click="modal = false" class="btn-secondary">Cancel</button>
          <RequiredFieldsGuard
            :fields="{
              Branch: form.branch_ids.length ? true : 0,
              Name: form.name,
              Email: editing ? true : form.email,
              Password: editing ? true : form.password,
              Role: form.role_id,
            }"
            v-slot="{ isValid, missing }"
          >
            <button
              @click="handleSave"
              class="btn-primary"
              :disabled="saving || !isValid"
              :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </RequiredFieldsGuard>
        </template>
      </AppModal>

      <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import AppTable from '@/components/common/AppTable.vue'
import RequiredFieldsGuard from '@/components/ui/RequiredFieldsGuard.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import TimePicker from '@/components/ui/TimePicker.vue'
import { useAuthStore } from '@/stores/auth'
import { adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, getSubUsers, createSubUser, updateSubUser, deleteSubUser } from '@/api/users'
import { getRolesForAssignment } from '@/api/roles'
import { getBranches } from '@/api/branches'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const { success, error } = useToast()

const allUsers     = ref([])
const search       = ref('')
const typeFilter   = ref(null)
const typeOpts     = [{ id: 'sa', name: 'Super Admin' }, { id: 'simple', name: 'Simple User' }]
const statusFilter = ref(null)
const statusOpts   = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]
const filteredUsers  = ref([])
const userPage       = ref(1)
const userPageSize   = ref(20)
const pagedUsers     = computed(() => filteredUsers.value.slice((userPage.value-1)*userPageSize.value, userPage.value*userPageSize.value))
const totalUserPages = computed(() => Math.ceil(filteredUsers.value.length / userPageSize.value))
function onUserPageSizeChange() { userPage.value = 1 }
const subUsers         = ref([])
const subSearch        = ref('')
const subStatusFilter  = ref(null)
const subStatusOpts    = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]
const filteredSubUsers = ref([])
const subPage          = ref(1)
const subPageSize      = ref(20)
const pagedSubUsers    = computed(() => filteredSubUsers.value.slice((subPage.value-1)*subPageSize.value, subPage.value*subPageSize.value))
const totalSubPages    = computed(() => Math.ceil(filteredSubUsers.value.length / subPageSize.value))
const roles     = ref([])
const loading   = ref(false)
const saving    = ref(false)
const allBranches = ref([])

// Branch multi-select state (Admin modal)
const branchToAdd = ref(null)

const unselectedBranches = computed(() =>
  allBranches.value.filter(b => !adminForm.value.branch_ids.includes(b.id))
)

function branchLabel(id) {
  return allBranches.value.find(b => b.id === id)?.name || id
}

// Branch names can contain spaces (e.g. "Phnom Penh"), unlike branch
// codes — stripped here the same way Name already is, so the
// auto-generated email doesn't end up with a space in it.
function branchNameForEmail(id) {
  const name = allBranches.value.find(b => b.id === id)?.name || ''
  return name.replace(/\s/g, '')
}

// Auto-fills Email as "name@branchname" once exactly one branch is
// assigned and a name has been entered. Only meaningful while creating —
// Email is hidden entirely while editing, so isEditingRef being truthy
// just skips this outright. Re-run on every name keystroke and every
// branch add/remove, so whichever happened most recently always wins;
// this only ever overwrites Email automatically, never blocks someone
// from then typing their own value over it.
function autoFillEmail(formRef, isEditingRef) {
  if (isEditingRef.value) return
  if (formRef.value.branch_ids.length !== 1) return
  const name = branchNameForEmail(formRef.value.branch_ids[0])
  if (!name || !formRef.value.name) return
  formRef.value.email = `${formRef.value.name}@${name}`
}

function onAdminNameInput() {
  adminForm.value.name = adminForm.value.name.replace(/\s/g, '')
  autoFillEmail(adminForm, adminEditing)
}

function onSubUserNameInput() {
  form.value.name = form.value.name.replace(/\s/g, '')
  autoFillEmail(form, editing)
}

function addBranch(id) {
  if (!id) return
  if (!adminForm.value.branch_ids.includes(id)) {
    adminForm.value.branch_ids = [...adminForm.value.branch_ids, id]
  }
  branchToAdd.value = null
  autoFillEmail(adminForm, adminEditing)
}

function removeBranch(id) {
  adminForm.value.branch_ids = adminForm.value.branch_ids.filter(i => i !== id)
  autoFillEmail(adminForm, adminEditing)
}

// Branch multi-select state (Sub User modal) — same pattern as the Admin
// modal above, kept as separate refs/functions since the two modals have
// entirely independent form state (adminForm vs form).
const subBranchToAdd = ref(null)

const unselectedSubBranches = computed(() =>
  allBranches.value.filter(b => !form.value.branch_ids.includes(b.id))
)

function addSubBranch(id) {
  if (!id) return
  if (!form.value.branch_ids.includes(id)) {
    form.value.branch_ids = [...form.value.branch_ids, id]
  }
  subBranchToAdd.value = null
  autoFillEmail(form, editing)
}

function removeSubBranch(id) {
  form.value.branch_ids = form.value.branch_ids.filter(i => i !== id)
  autoFillEmail(form, editing)
}

// Options for the "Parent" picker in the admin modal — every non-super-admin
// user except the one currently being edited (a user can't be its own parent).
const parentOptions = computed(() =>
  allUsers.value
    .filter(u => !u.is_super_admin && u.id !== adminEditing.value?.id)
    .map(u => ({ id: u.id, name: u.name, sub: u.email }))
)

// Resolves a parent_id to a display label by looking the user up in
// whichever list is currently loaded (allUsers for Super Admin, subUsers
// for a Simple/Sub user managing their own sub-users).
function parentLabel(parentId) {
  if (!parentId) return 'Root'
  const pool = auth.isSuperAdmin ? allUsers.value : subUsers.value
  const p = pool.find(u => u.id === parentId)
  if (p) return p.name
  if (auth.user && parentId === auth.user.id) return auth.user.name || 'You'
  return `#${parentId}`
}

// Admin modal
const adminModal        = ref(false)
const adminEditing      = ref(null)
const adminDeleteTarget = ref(null)
const adminDeleteDialog = ref(false)
const shiftTypes = [
  { id: 'normal', name: 'Normal Day' },
  { id: 'cross_day', name: 'Cross Day (Night Shift)' },
]
const adminForm = ref({ name: '', email: '', password: '', role_id: null, parent_id: null, is_active: true, branch_ids: [], shift_check_in_time: '08:00', shift_check_out_time: '17:00', shift_type: 'normal' })

// Sub-user modal
const modal        = ref(false)
const editing      = ref(null)
const deleteTarget = ref(null)
const deleteDialog = ref(false)
const form = ref({ name: '', email: '', password: '', role_id: null, branch_ids: [], is_active: true, shift_check_in_time: '08:00', shift_check_out_time: '17:00', shift_type: 'normal' })

const rootUsers       = computed(() => allUsers.value.filter(u => !u.is_super_admin))

const adminColumns = [
  { key: 'name', label: 'User' }, { key: 'type', label: 'Type' },
  { key: 'parent', label: 'Parent' },
  { key: 'role', label: 'Role' }, { key: 'is_active', label: 'Status' },
]
const subColumns = [
  { key: 'name', label: 'User' },
  { key: 'parent', label: 'Parent' },
  { key: 'role', label: 'Role' }, { key: 'is_active', label: 'Status' },
]

function applyFilter() {
  userPage.value = 1
  let list = allUsers.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))
  }
  if (typeFilter.value === 'sa')     list = list.filter(u => u.is_super_admin)
  if (typeFilter.value === 'simple') list = list.filter(u => !u.is_super_admin)
  if (statusFilter.value !== null && statusFilter.value !== '') {
    const active = statusFilter.value === 'true'
    list = list.filter(u => u.is_active === active)
  }
  filteredUsers.value = list
}
function resetSearch() { search.value = ''; typeFilter.value = null; statusFilter.value = null; userPage.value = 1; applyFilter() }

function applySubFilter() {
  subPage.value = 1
  let list = subUsers.value
  if (subSearch.value) {
    const s = subSearch.value.toLowerCase()
    list = list.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))
  }
  if (subStatusFilter.value !== null && subStatusFilter.value !== '') {
    const active = subStatusFilter.value === 'true'
    list = list.filter(u => u.is_active === active)
  }
  filteredSubUsers.value = list
}
function resetSubFilters() { subSearch.value = ''; subStatusFilter.value = null; applySubFilter() }

async function load() {
  loading.value = true
  try {
    if (auth.isSuperAdmin) {
      const res = await adminListUsers(); allUsers.value = res.data || []; applyFilter()
    } else {
      const res = await getSubUsers(); subUsers.value = res.data || []; applySubFilter()
    }
  } catch {} finally { loading.value = false }
}

function openAdminCreate() {
  adminForm.value = { name: '', email: '', password: '', role_id: null, parent_id: null, is_active: true, branch_ids: [], shift_check_in_time: '08:00', shift_check_out_time: '17:00', shift_type: 'normal' }
  branchToAdd.value = null
  adminEditing.value = null
  adminModal.value = true
}

function openAdminEdit(row) {
  adminForm.value = {
    name: row.name, password: '', role_id: row.role_id || null,
    parent_id: row.parent_id || null,
    is_active: row.is_active, _id: row.id,
    branch_ids: (row.branches || []).map(b => b.id),
    shift_check_in_time: row.shift_check_in_time || '',
    shift_check_out_time: row.shift_check_out_time || '',
    shift_type: row.shift_type || 'normal',
  }
  branchToAdd.value = null
  adminEditing.value = row
  adminModal.value = true
}

function confirmAdminDelete(row) { adminDeleteTarget.value = row; adminDeleteDialog.value = true }

async function handleAdminSave() {
  saving.value = true
  try {
    const payload = {
      ...adminForm.value,
      branch_ids: adminForm.value.branch_ids || [],
      role_id: adminForm.value.role_id ?? 0,
      parent_id: adminForm.value.parent_id ?? 0, // 0 = make root user
    }
    if (!payload.password) delete payload.password
    payload.shift_check_in_time = payload.shift_check_in_time || null
    payload.shift_check_out_time = payload.shift_check_out_time || null
    if (adminEditing.value) { await adminUpdateUser(adminEditing.value.id, payload); success('User updated') }
    else                    { await adminCreateUser(payload);                         success('User created') }
    adminModal.value = false; load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

async function doAdminDelete() {
  try { await adminDeleteUser(adminDeleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

function openCreate() {
  form.value = { name: '', email: '', password: '', role_id: null, branch_ids: [], is_active: true, shift_check_in_time: '08:00', shift_check_out_time: '17:00', shift_type: 'normal' }
  subBranchToAdd.value = null
  editing.value = null; modal.value = true
}
function openEdit(row) {
  form.value = {
    name: row.name, password: '', role_id: row.role_id || null,
    branch_ids: (row.branches || []).map(b => b.id),
    is_active: row.is_active,
    shift_check_in_time: row.shift_check_in_time || '',
    shift_check_out_time: row.shift_check_out_time || '',
    shift_type: row.shift_type || 'normal',
  }
  subBranchToAdd.value = null
  editing.value = row; modal.value = true
}
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }

async function handleSave() {
  saving.value = true
  try {
 
    const payload = { ...form.value, branch_ids: form.value.branch_ids || [] }
    if (!payload.password) delete payload.password
    payload.shift_check_in_time = payload.shift_check_in_time || null
    payload.shift_check_out_time = payload.shift_check_out_time || null
    if (editing.value) { await updateSubUser(editing.value.id, payload); success('Updated') }
    else               { await createSubUser(payload);                    success('Sub user created') }
    modal.value = false; load()
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}

async function doDelete() {
  try { await deleteSubUser(deleteTarget.value.id); success('Deleted'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

onMounted(async () => {
  load()
  try { const res = await getRolesForAssignment(); roles.value = res.data || [] } catch {}
  try {
    const bRes = await getBranches({ show_all: false })
    allBranches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
  } catch {}
})
</script>