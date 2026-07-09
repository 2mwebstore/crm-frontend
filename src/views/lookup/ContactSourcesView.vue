<template>
  <LookupCrudView
    title="Contact Sources"
    subtitle="How clients were acquired"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getContactSources"
    :create-fn="createContactSource"
    :update-fn="updateContactSource"
    :delete-fn="deleteContactSource"
    perm-group="contact_sources"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. Referral" />
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" placeholder="Optional" />
      </div>
      <div>
        <label class="label">Icon</label>
        <input v-model="form.icon" class="input" placeholder="e.g. people" />
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
import { getContactSources, createContactSource, updateContactSource, deleteContactSource } from '@/api/lookup'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'icon', label: 'Icon' },
  { key: 'branch',     label: 'Branch'     },
  { key: 'created_by', label: 'Created By' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { name: '', description: '', icon: '', is_active: true }
</script>