<template>
  <LookupCrudView
    title="Levels"
    subtitle="Client classification tiers"
    :columns="columns"
    :default-form="defaultForm"
    :color-cols="['color']"
    :fetch-fn="getLevels"
    :create-fn="createLevel"
    :update-fn="updateLevel"
    :delete-fn="deleteLevel"
    perm-group="levels"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. Gold" />
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" placeholder="Optional description" />
      </div>
      <div>
        <label class="label">Color</label>
        <div class="flex items-center gap-3">
          <input type="color" v-model="form.color" class="h-9 w-16 rounded border border-gray-200 cursor-pointer" />
          <input v-model="form.color" class="input flex-1 font-mono text-sm" placeholder="#6366f1" />
        </div>
      </div>
      <div>
        <label class="label">Sort Order</label>
        <input v-model.number="form.sort_order" type="number" class="input" />
      </div>
      <div class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="form.is_active" class="accent-primary" />
        <span>Active</span>
      </div>
    </template>
  </LookupCrudView>
</template>

<script setup>
import LookupCrudView from './LookupCrudView.vue'
import { getLevels, createLevel, updateLevel, deleteLevel } from '@/api/lookup'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'sort_order', label: 'Order' },
  { key: 'branch',     label: 'Branch'     },
  { key: 'created_by', label: 'Created By' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { name: '', description: '', color: '#938af4', sort_order: 0, is_active: true }
</script>