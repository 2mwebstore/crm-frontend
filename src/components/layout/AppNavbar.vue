<template>
  <header class="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0" style="background:#ffffff">
    <!-- Left: Back-to-hub (mobile) / Hamburger + breadcrumb (desktop) -->
    <div class="flex items-center gap-3">
      <RouterLink v-if="hubBackTo" :to="hubBackTo" class="btn-icon flex lg:hidden">
        <ArrowLeftIcon class="w-5 h-5" />
      </RouterLink>
      <button @click="$emit('toggle-sidebar')" class="btn-icon hidden lg:inline-flex">
        <Bars3Icon class="w-5 h-5" />
      </button>
      <nav class="hidden sm:flex items-center gap-1 text-sm text-gray-500">
        <span>{{ currentSection }}</span>
        <span v-if="currentPage !== currentSection" class="text-gray-300">/</span>
        <span v-if="currentPage !== currentSection" class="text-gray-800 font-medium">{{ currentPage }}</span>
      </nav>
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-1">
      <!-- Notification bell -->
      <button class="btn-icon relative flex items-center whitespace-nowrap">
        <BuildingOfficeIcon class="w-5 h-5" />
        <span v-if="branchName" class="text-sm font-medium text-bold">{{ branchName }}</span>
      </button>

      <!-- User menu -->
      <div class="relative" ref="menuRef">
        <button @click="menuOpen = !menuOpen" class="flex items-center gap-0 sm:gap-2 pl-0 pr-0 sm:pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors max-w-[180px] sm:max-w-none">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style="background:#938af4">
            {{ userInitial }}
          </div>
          <span class="flex flex-col items-start min-w-0 leading-tight">
            <span class="hidden sm:block text-sm font-medium text-gray-800 truncate max-w-[180px]">
              {{ auth.user?.name || 'User' }}
            </span>
            <span class="hidden sm:block text-xs text-gray-400 truncate max-w-[180px]">{{ auth.user?.email }}</span>
          </span>
          <ChevronDownIcon class="w-4 h-4 text-gray-400 flex-shrink-0 hidden sm:block" />
        </button>

        <Transition name="menu">
          <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-52 card py-2 z-50" style="box-shadow: 0 12px 32px rgba(0,0,0,0.12)">
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-xs font-medium text-gray-800">{{ auth.user?.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</p>
              <p v-if="branchName" class="text-xs text-gray-400 truncate mt-0.5">{{ branchName }}</p>
            </div>
            <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <UserIcon class="w-4 h-4" /> Profile
            </button>
            <button @click="openChangePassword" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <LockClosedIcon class="w-4 h-4" /> Change Password
            </button>
            <button @click="doLogout" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <ArrowRightOnRectangleIcon class="w-4 h-4" /> Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Change Password modal -->
    <AppModal v-model="passwordModal" title="Change Password" size="sm">
      <div class="space-y-3">
        <div>
          <label class="label">Current Password <span class="text-red-500">*</span></label>
          <div class="relative">
            <input v-model="passwordForm.old_password" :type="showOldPassword ? 'text' : 'password'" class="input pr-9" autocomplete="current-password" />
            <button type="button" @click="showOldPassword = !showOldPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeSlashIcon v-if="showOldPassword" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label class="label">New Password <span class="text-red-500">*</span></label>
          <div class="relative">
            <input v-model="passwordForm.new_password" :type="showNewPassword ? 'text' : 'password'" class="input pr-9" autocomplete="new-password" placeholder="At least 6 characters" />
            <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeSlashIcon v-if="showNewPassword" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label class="label">Confirm New Password <span class="text-red-500">*</span></label>
          <div class="relative">
            <input v-model="passwordForm.confirm_password" :type="showConfirmPassword ? 'text' : 'password'" class="input pr-9" autocomplete="new-password" />
            <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeSlashIcon v-if="showConfirmPassword" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="passwordMismatch" class="text-xs text-red-500 mt-1">Passwords don't match</p>
        </div>
      </div>
      <template #footer>
        <button @click="passwordModal = false" class="btn-secondary" :disabled="changingPassword">Cancel</button>
        <button
          @click="submitChangePassword"
          class="btn-primary"
          :disabled="changingPassword || !canSubmitPasswordChange"
        >
          {{ changingPassword ? 'Saving...' : 'Change Password' }}
        </button>
      </template>
    </AppModal>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { Bars3Icon, BellIcon, ChevronDownIcon, UserIcon, LockClosedIcon, ArrowRightOnRectangleIcon, EyeIcon, EyeSlashIcon, BuildingOfficeIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import { changePassword } from '@/api/auth'
import { useToast } from '@/composables/useToast'

defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { success, error } = useToast()
const menuOpen = ref(false)
const menuRef = ref(null)

onClickOutside(menuRef, () => (menuOpen.value = false))

const userInitial = computed(() => (auth.user?.name || 'U').charAt(0).toUpperCase())
const currentPage = computed(() => route.name?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard')
const currentSection = computed(() => {
  const path = route.path.split('/')[1]
  return path ? path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ') : 'Dashboard'
})




// Maps each list page that's reached via a hub tile back to that hub, so
// mobile users (who don't have the sidebar) have a way back. Only the
// exact list-root paths are included — detail/create/edit sub-pages
// already have their own "back to list" link in-page, so they're left
// alone here rather than skipping a level.
const HUB_BACK_MAP = {
  '/interesting-clients': '/hub/clients',
  '/clients':             '/hub/clients',
  '/follow-ups':          '/hub/clients',
  '/deposits':             '/hub/account',
  '/withdrawals':          '/hub/account',
  '/daily-balance':        '/hub/account',
  '/turnover-bets':        '/hub/account',
  '/attendance/my':          '/hub/attendance',
  '/attendance/list':        '/hub/attendance',
  '/attendance/report':      '/hub/attendance',
  '/attendance/summary':     '/hub/attendance',
  '/leave/list':             '/hub/attendance',
  '/leave/report':           '/hub/attendance',
  '/leave/request':          '/hub/attendance',
  '/leave/types':            '/hub/attendance',
  '/overtime/list':          '/hub/attendance',
  '/overtime/report':        '/hub/attendance',
  '/overtime/request':       '/hub/attendance',
  '/activity/list':          '/hub/attendance',
  '/activity/report':        '/hub/attendance',
  '/activity/request':       '/hub/attendance',
  '/schedule-overrides':     '/hub/attendance',
  '/reports':              '/hub/reports',
  '/users':               '/hub/setup',
  '/roles':               '/hub/setup',
  '/branches':            '/hub/setup',
  '/lookup/levels':           '/hub/setup',
  '/lookup/contact-sources':  '/hub/setup',
  '/lookup/bank-types':       '/hub/setup',
  '/lookup/company-banks':   '/hub/setup',
  '/lookup/product-types':   '/hub/setup',
  '/lookup/bonus-options':   '/hub/setup',
  '/lookup/currencies':       '/hub/setup',
}
const hubBackTo = computed(() => HUB_BACK_MAP[route.path] || null)

// Only shows the "BranchName@" prefix when the user has exactly one
// branch assigned. Hidden entirely (empty string) for a Super Admin / no
// branch assigned, and also hidden for a user with 2+ branches — showing
// a partial/truncated multi-branch list next to the name was more
// confusing than just omitting it.
const branchName = computed(() => {
  const branches = (auth.user?.branches || []).filter(b => b?.name)
  return branches.length === 1 ? branches[0].name : ''
})

// Change Password modal
const passwordModal = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordMismatch = computed(() =>
  passwordForm.value.confirm_password !== '' && passwordForm.value.new_password !== passwordForm.value.confirm_password
)
const canSubmitPasswordChange = computed(() =>
  passwordForm.value.old_password !== '' &&
  passwordForm.value.new_password.length >= 6 &&
  passwordForm.value.new_password === passwordForm.value.confirm_password
)

function openChangePassword() {
  passwordForm.value = { old_password: '', new_password: '', confirm_password: '' }
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  menuOpen.value = false
  passwordModal.value = true
}

async function submitChangePassword() {
  if (!canSubmitPasswordChange.value) return
  changingPassword.value = true
  try {
    await changePassword({
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
    })
    success('Password changed')
    passwordModal.value = false
  } catch (e) {
    error(e?.error || 'Failed to change password')
  } finally {
    changingPassword.value = false
  }
}

function doLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.menu-enter-active, .menu-leave-active { transition: opacity .15s, transform .15s; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>