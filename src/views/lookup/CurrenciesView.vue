<template>
  <LookupCrudView
    title="Currencies"
    subtitle="Supported currency types"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getCurrencies"
    :create-fn="createCurrency"
    :update-fn="updateCurrency"
    :delete-fn="deleteCurrency"
    perm-group="currencies"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Code <span class="text-red-500">*</span></label>
        <input v-model="form.code" class="input font-mono uppercase" required placeholder="e.g. USD" maxlength="10" />
      </div>
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. US Dollar" />
      </div>
      <div>
        <label class="label">Symbol</label>
        <input v-model="form.symbol" class="input" placeholder="e.g. $" maxlength="10" />
      </div>
      <div>
        <label class="label">Sort Order</label>
        <input v-model.number="form.sort_order" type="number" class="input" />
      </div>
      <div class="flex items-center gap-4 text-sm">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="form.is_base" class="accent-primary" />
          <span>Base currency</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="form.is_active" class="accent-primary" />
          <span>Active</span>
        </label>
      </div>
    </template>
  </LookupCrudView>
</template>

<script setup>
import LookupCrudView from './LookupCrudView.vue'
import { getCurrencies, createCurrency, updateCurrency, deleteCurrency } from '@/api/lookup'

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'is_base', label: 'Base' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { code: '', name: '', symbol: '', is_base: false, is_active: true, sort_order: 0 }
</script>