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
        <template v-for="item in group.items" :key="item.to || item.label">
          <!-- Leaf item -->
          <RouterLink
            v-if="!item.children"
            :to="item.to"
            class="sidebar-item"
            active-class="active"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!collapsed" class="truncate flex-1">{{ item.label }}</span>
          </RouterLink>

          <!-- Parent item with sub-menu -->
          <template v-else>
            <button
              type="button"
              class="sidebar-item w-full"
              :class="{ active: isParentActive(item) }"
              @click="toggleExpanded(item.label)"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="!collapsed" class="truncate flex-1 text-left">{{ item.label }}</span>
              <ChevronDownIcon
                v-if="!collapsed"
                class="w-4 h-4 flex-shrink-0 transition-transform"
                :class="{ 'rotate-180': isExpanded(item.label) }"
              />
            </button>
            <div v-if="!collapsed && isExpanded(item.label)" class="pl-4">
              <RouterLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="sidebar-item text-sm"
                :class="{ active: isChildActive(child.to) }"
              >
                <span class="truncate flex-1">{{ child.label }}</span>
              </RouterLink>
            </div>
          </template>
        </template>
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useNavGroups } from '@/composables/useNavGroups'

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const { visibleGroups } = useNavGroups()
const route = useRoute()

// Which parent sub-menus are currently expanded, keyed by label.
const expanded = ref(new Set())
function isExpanded(label) { return expanded.value.has(label) }
function toggleExpanded(label) {
  const next = new Set(expanded.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  expanded.value = next
}

// RouterLink's built-in active-class matches on the route record/path
// only — it doesn't distinguish query params. Several of our children
// share the same base path with only a different query string (e.g.
// /staff-requests?type=leave vs ?type=overtime), so without this they'd
// all show active simultaneously. Active here means: same path, AND
// every query param present on the link's own `to` matches the current
// route (extra query params on the current route that the link doesn't
// care about are ignored).
function isChildActive(to) {
  const [path, queryString] = to.split('?')
  if (route.path !== path) return false
  if (!queryString) return true
  const params = new URLSearchParams(queryString)
  for (const [key, value] of params) {
    if (route.query[key] !== value) return false
  }
  return true
}

// The parent toggle button itself never navigates anywhere, so it needs
// its own active check — true whenever one of its children is the
// current route, so the parent row highlights too, not just the child
// underneath it.
function isParentActive(item) {
  return item.children.some(c => isChildActive(c.to))
}

// Auto-expand whichever parent contains the current route, so landing on
// e.g. /attendance/leave directly (not via clicking through the menu)
// still shows it nested correctly instead of looking collapsed/hidden.
function expandForCurrentRoute() {
  const next = new Set()
  for (const group of visibleGroups.value) {
    for (const item of group.items) {
      if (!item.children) continue
      const match = item.children.some(c => {
        const childPath = c.to.split('?')[0]
        return route.path === childPath
      })
      if (match) next.add(item.label)
    }
  }
  expanded.value = next
}
expandForCurrentRoute()
watch(() => route.path, expandForCurrentRoute)
</script>