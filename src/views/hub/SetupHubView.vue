<template>
  <div class="space-y-6 pb-4">
    <!-- Banner -->
    <div class="rounded-xl p-6 text-white" style="background:#4B5563">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
          <Cog6ToothIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-lg font-bold">Setup</p>
          <p class="text-sm text-white/80">System configuration</p>
        </div>
      </div>
    </div>

    <!-- Configuration -->
    <div v-if="configTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Configuration</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in configTiles"
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

    <!-- Management -->
    <div v-if="mgmtTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Management</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in mgmtTiles"
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
// The reference design also showed "Marketing Products" and "Marketing
// Types" tiles, but there's no matching lookup table/route in this
// project (only Contact Source exists for lead sources), so those are
// intentionally left out rather than linking to something that isn't
// built. Users / Roles / Branches aren't in the reference screenshot at
// all, but they're real existing routes that still need a home now that
// the sidebar's flat list isn't the only way to navigate on mobile — they
// live here under "Management" so nothing becomes unreachable.
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  Cog6ToothIcon, BuildingLibraryIcon, BuildingOfficeIcon, CubeIcon,
  MegaphoneIcon, GiftIcon, CurrencyDollarIcon, TagIcon,
  UsersIcon, ShieldCheckIcon, BuildingOffice2Icon
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const isSA = computed(() => auth.isSuperAdmin)

const allConfigTiles = computed(() => [
  { label: 'Banks',           sub: 'Bank master list',  to: '/lookup/bank-types',      icon: BuildingLibraryIcon, tint: '#3B82F6', show: isSA.value || auth.can('bank_types.view') },
  { label: 'Company Banks',   sub: 'Company accounts',  to: '/lookup/company-banks',   icon: BuildingOfficeIcon, tint: '#10B981', show: isSA.value || auth.can('company_banks.view') },
  { label: 'Products',       sub: 'Game products',      to: '/lookup/product-types',   icon: CubeIcon,            tint: '#6366F1', show: isSA.value || auth.can('product_types.view') },
  { label: 'Contact Source',  sub: 'Lead sources',       to: '/lookup/contact-sources', icon: MegaphoneIcon,       tint: '#938af4', show: isSA.value || auth.can('contact_sources.view') },
  { label: 'Bonus Options',   sub: 'Bonus multipliers',  to: '/lookup/bonus-options',   icon: GiftIcon,            tint: '#938af4', show: isSA.value || auth.can('bonus_options.view') },
  { label: 'Currencies',      sub: 'Supported currencies', to: '/lookup/currencies',    icon: CurrencyDollarIcon,  tint: '#22C55E', show: isSA.value || auth.can('currencies.view') },
  { label: 'Levels',          sub: 'Client levels',      to: '/lookup/levels',          icon: TagIcon,             tint: '#F59E0B', show: isSA.value || auth.can('levels.view') },
])
const configTiles = computed(() => allConfigTiles.value.filter(t => t.show))

const allMgmtTiles = computed(() => [
  { label: 'Users',    sub: 'User accounts',        to: '/users',    icon: UsersIcon,          tint: '#938af4', show: isSA.value || auth.can('users.view') },
  { label: 'Roles',    sub: 'Roles & permissions',  to: '/roles',    icon: ShieldCheckIcon,     tint: '#EF4444', show: isSA.value || auth.can('roles.view') },
  { label: 'Branches', sub: 'Branch management',    to: '/branches', icon: BuildingOffice2Icon, tint: '#0EA5E9', show: isSA.value || auth.can('branch.view') },
])
const mgmtTiles = computed(() => allMgmtTiles.value.filter(t => t.show))
</script>
