<template>
  <LookupCrudView
    title="Bank Types"
    subtitle="Banks and financial institutions"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getBankTypes"
    :create-fn="createBankType"
    :update-fn="updateBankType"
    :delete-fn="deleteBankType"
    perm-group="bank_types"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. ABA Bank" />
      </div>
      <div>
        <label class="label">Code <span class="text-red-500">*</span></label>
        <input v-model="form.code" class="input font-mono" required placeholder="e.g. ABA" />
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" />
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
import { getBankTypes, createBankType, updateBankType, deleteBankType } from '@/api/lookup'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'sort_order', label: 'Order' },
  { key: 'branch',     label: 'Branch'     },
  { key: 'created_by', label: 'Created By' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { name: '', code: '', description: '', sort_order: 0, is_active: true }
</script>