<template>
  <div class="card overflow-hidden">
    <!-- Toolbar -->
    <div v-if="$slots.toolbar" class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
      <slot name="toolbar" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th v-for="col in columns" :key="col.key" class="table-header whitespace-nowrap">
              {{ col.label }}
            </th>
            <th v-if="$slots.actions" class="table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="table-cell text-center py-10">
              <div class="flex items-center justify-center gap-2 text-gray-400">
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Loading...
              </div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + 1" class="table-cell text-center py-10 text-gray-400">
              No data to display
            </td>
          </tr>
          <template v-else>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td v-for="col in columns" :key="col.key" class="table-cell">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </td>
              <td v-if="$slots.actions" class="table-cell text-right">
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
      <span>Showing {{ ((meta.page - 1) * meta.page_size) + 1 }}–{{ Math.min(meta.page * meta.page_size, meta.total_items) }} of {{ meta.total_items }}</span>
      <div class="flex items-center gap-1">
        <button :disabled="meta.page <= 1" @click="$emit('page', meta.page - 1)" class="btn-icon disabled:opacity-40">
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ meta.page }} / {{ meta.total_pages }}</span>
        <button :disabled="meta.page >= meta.total_pages" @click="$emit('page', meta.page + 1)" class="btn-icon disabled:opacity-40">
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  meta: Object
})
defineEmits(['page'])
</script>
