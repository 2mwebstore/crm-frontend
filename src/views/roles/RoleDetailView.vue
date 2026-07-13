<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <RouterLink to="/roles" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold text-gray-800">{{ role?.name }}</h1>
          <span v-if="role?.is_system" class="badge text-xs" style="background:#938af4;color:#fff">System</span>
        </div>
        <p class="text-sm text-gray-500">{{ role?.description }}</p>
      </div>
      <!-- SA can always save; regular users only if not system role -->
      <button
        v-if="canEdit"
        @click="save"
        class="btn-primary flex items-center gap-2"
        :disabled="saving"
      >
        <CheckIcon class="w-4 h-4" />
        {{ saving ? 'Saving…' : 'Save Permissions' }}
      </button>
    </div>

    <!-- Read-only notice for non-SA on system roles -->
    <div v-if="role?.is_system && !auth.isSuperAdmin" class="card p-4 bg-amber-50 border border-amber-200 text-sm text-amber-800">
      System roles can only be edited by Super Admin.
    </div>

    <!-- Permission groups -->
    <div class="card p-5" v-if="role">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="text-sm font-semibold text-gray-700">
          Permissions
          <span class="text-gray-400 font-normal">({{ selected.length }} selected)</span>
        </h2>
        <div v-if="canEdit" class="flex gap-3">
          <button @click="checkAll" type="button" class="text-xs text-primary font-medium hover:underline">Check all</button>
          <button @click="uncheckAll" type="button" class="text-xs text-gray-400 font-medium hover:underline">Uncheck all</button>
        </div>
      </div>

      <div v-for="(perms, group) in grouped" :key="group"
        class="border border-gray-100 rounded-xl mb-3 overflow-hidden">
        <!-- Group header with check-all -->
        <div class="flex items-center justify-between px-4 py-2 bg-gray-50">
          <div class="flex items-center gap-2">
            <input v-if="canEdit"
              type="checkbox"
              class="accent-primary w-4 h-4"
              :checked="isGroupChecked(perms)"
              :indeterminate="isGroupIndeterminate(perms)"
              @change="toggleGroup(perms, $event.target.checked)"
            />
            <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {{ group.replace(/_/g, ' ') }}
            </span>
          </div>
          <span class="text-xs text-gray-400">{{ groupSelectedCount(perms) }}/{{ perms.length }}</span>
        </div>

        <!-- Permission checkboxes -->
        <div class="grid grid-cols-2 gap-0 px-2 py-1">
          <label v-for="p in perms" :key="p.id"
            :class="[
              'flex items-start gap-2 text-xs rounded px-2 py-2 transition-colors',
              canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default',
              selected.includes(p.id) ? 'bg-primary-50/30' : ''
            ]"
          >
            <input
              type="checkbox"
              :value="p.id"
              v-model="selected"
              :disabled="!canEdit"
              class="accent-primary w-4 h-4 mt-0.5 flex-shrink-0"
            />
            <div>
              <p class="font-medium text-gray-800">{{ p.display_name }}</p>
              <p v-if="p.description" class="text-gray-400 mt-0.5 leading-tight">{{ p.description }}</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { getRole, assignPermissions, getPermissionsGrouped } from '@/api/roles'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const auth = useAuthStore()
const { success, error } = useToast()
const role    = ref(null)
const grouped = ref({})
const selected = ref([])
const saving  = ref(false)

// Super Admin can edit any role (including system); others only non-system
const canEdit = computed(() => {
  if (!role.value) return false
  if (auth.isSuperAdmin) return true       // SA can always edit
  return !role.value.is_system             // Non-SA can only edit non-system
})

const allPermIds = computed(() =>
  Object.values(grouped.value).flatMap(perms => perms.map(p => p.id))
)

function checkAll()   { if (canEdit.value) selected.value = [...allPermIds.value] }
function uncheckAll() { if (canEdit.value) selected.value = [] }

function groupSelectedCount(perms) {
  return perms.filter(p => selected.value.includes(p.id)).length
}
function isGroupChecked(perms) {
  return perms.length > 0 && groupSelectedCount(perms) === perms.length
}
function isGroupIndeterminate(perms) {
  const n = groupSelectedCount(perms)
  return n > 0 && n < perms.length
}
function toggleGroup(perms, checked) {
  const groupIds = perms.map(p => p.id)
  if (checked) {
    const s = new Set(selected.value)
    groupIds.forEach(id => s.add(id))
    selected.value = [...s]
  } else {
    const remove = new Set(groupIds)
    selected.value = selected.value.filter(id => !remove.has(id))
  }
}

onMounted(async () => {
  try {
    const [roleRes, permRes] = await Promise.all([
      getRole(route.params.id),
      getPermissionsGrouped()
    ])
    role.value    = roleRes.data
    grouped.value = permRes.data || {}
    selected.value = (role.value.permissions || []).map(p => p.id)
  } catch { error('Failed to load role') }
})

async function save() {
  saving.value = true
  try {
    await assignPermissions(route.params.id, { permission_ids: selected.value })
    success('Permissions updated')
  } catch (e) { error(e?.error || 'Failed to save') } finally { saving.value = false }
}
</script>
