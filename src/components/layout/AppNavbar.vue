<template>
  <header class="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0" style="background:#ffffff">
    <!-- Left: Hamburger + breadcrumb -->
    <div class="flex items-center gap-3">
      <button @click="$emit('toggle-sidebar')" class="btn-icon">
        <Bars3Icon class="w-5 h-5" />
      </button>
      <nav class="hidden sm:flex items-center gap-1 text-sm text-gray-500">
        <span>{{ currentSection }}</span>
        <span v-if="currentPage !== currentSection" class="text-gray-300">/</span>
        <span v-if="currentPage !== currentSection" class="text-gray-800 font-medium">{{ currentPage }}</span>
      </nav>
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-2">
      <!-- Notification bell -->
      <button class="btn-icon relative">
        <BellIcon class="w-5 h-5" />
      </button>

      <!-- User menu -->
      <div class="relative" ref="menuRef">
        <button @click="menuOpen = !menuOpen" class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style="background:#938af4">
            {{ userInitial }}
          </div>
          <span class="hidden sm:block text-sm font-medium text-gray-700">
            <span v-if="branchName">{{ branchName }}@</span>{{ auth.user?.name || 'User' }}
          </span>
          <ChevronDownIcon class="w-4 h-4 text-gray-400" />
        </button>

        <Transition name="menu">
          <div v-if="menuOpen" class="absolute right-0 top-full mt-1 w-48 card shadow-lg py-1 z-50">
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-xs font-medium text-gray-800">{{ auth.user?.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</p>
              <p v-if="branchName" class="text-xs text-gray-400 truncate mt-0.5">{{ branchName }}</p>
            </div>
            <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <UserIcon class="w-4 h-4" /> Profile
            </button>
            <button @click="doLogout" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <ArrowRightOnRectangleIcon class="w-4 h-4" /> Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { Bars3Icon, BellIcon, ChevronDownIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'

defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const menuRef = ref(null)

onClickOutside(menuRef, () => (menuOpen.value = false))

const userInitial = computed(() => (auth.user?.name || 'U').charAt(0).toUpperCase())
const currentPage = computed(() => route.name?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard')
const currentSection = computed(() => {
  const path = route.path.split('/')[1]
  return path ? path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ') : 'Dashboard'
})

// Only shows the "BranchName@" prefix when the user has exactly one
// branch assigned. Hidden entirely (empty string) for a Super Admin / no
// branch assigned, and also hidden for a user with 2+ branches — showing
// a partial/truncated multi-branch list next to the name was more
// confusing than just omitting it.
const branchName = computed(() => {
  const branches = (auth.user?.branches || []).filter(b => b?.name)
  return branches.length === 1 ? branches[0].name : ''
})

function doLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.menu-enter-active, .menu-leave-active { transition: opacity .15s, transform .15s; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>