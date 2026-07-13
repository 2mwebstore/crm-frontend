<template>
  <aside
    :class="[
      'hidden lg:flex flex-col flex-shrink-0 h-screen border-r border-gray-100 bg-white transition-all duration-200 overflow-hidden',
      collapsed ? 'w-16' : 'w-60'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center px-4 h-16 border-b border-gray-100 flex-shrink-0">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#938af4">
        <span class="text-white text-sm font-bold">C</span>
      </div>
      <span v-if="!collapsed" class="ml-3 font-semibold text-gray-800 truncate">CRM Admin</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-2">
      <div v-for="group in visibleGroups" :key="group.label" class="mb-1">
        <p v-if="!collapsed && group.label"
           class="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="sidebar-item"
          active-class="active"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!collapsed" class="truncate flex-1">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- Collapse toggle -->
    <button
      @click="$emit('toggle')"
      class="sidebar-item mx-2 mb-2 border-t border-gray-100 pt-2 flex-shrink-0"
    >
      <ChevronLeftIcon v-if="!collapsed" class="w-5 h-5 flex-shrink-0" />
      <ChevronRightIcon v-else class="w-5 h-5 flex-shrink-0" />
      <span v-if="!collapsed" class="truncate">Collapse</span>
    </button>
  </aside>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useNavGroups } from '@/composables/useNavGroups'

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const { visibleGroups } = useNavGroups()
</script>
