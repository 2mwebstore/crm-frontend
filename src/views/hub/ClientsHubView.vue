<template>
  <div class="space-y-6 pb-4">
    <!-- Banner -->
    <div class="rounded-xl p-6 text-white" style="background:#938af4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
          <UserGroupIcon class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <p class="text-lg font-bold truncate">Client Management</p>
          <p class="text-sm text-white/80 truncate">{{ clientCount }} clients · {{ icCount }} interesting clients</p>
        </div>
      </div>
    </div>

    <!-- Manage -->
    <div>
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Manage</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in tiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getClients } from '@/api/clients'
import { getICs } from '@/api/interesting-clients'
import { UserPlusIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const clientCount = ref('—')
const icCount = ref('—')

// Only "Interesting Client", "Clients" and "Follow-ups" exist as real
// pages today. The reference design also showed Bonus / Bonus FU /
// Inactive / Recycle Bin / Blacklist tiles, but there's no matching
// route/feature for those yet, so they're intentionally left out rather
// than linking to something that doesn't exist.
const allTiles = computed(() => [
  { label: 'Interesting Client', sub: 'View & manage',   to: '/interesting-clients', icon: UserPlusIcon,          tint: '#22C55E', show: auth.isSuperAdmin || auth.can('interesting_clients.view') },
  { label: 'Clients',            sub: 'View & manage',   to: '/clients',             icon: UserGroupIcon,         tint: '#938af4', show: auth.isSuperAdmin || auth.can('clients.view') },
  { label: 'Follow-ups',         sub: 'Client follow-ups', to: '/follow-ups',        icon: ChatBubbleLeftRightIcon, tint: '#3B82F6', show: auth.isSuperAdmin || auth.can('follow_ups.view') },
])
const tiles = computed(() => allTiles.value.filter(t => t.show))

onMounted(async () => {
  try {
    const res = await getClients({ page: 1, page_size: 1 })
    clientCount.value = res.meta?.total_items ?? '—'
  } catch { }
  try {
    const res = await getICs({ page: 1, page_size: 1 })
    icCount.value = res.meta?.total_items ?? '—'
  } catch { }
})
</script>
