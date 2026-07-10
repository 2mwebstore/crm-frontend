<template>
  <LookupCrudView
    title="Product Types"
    subtitle="Products and services offered"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getProductTypes"
    :create-fn="createProductType"
    :update-fn="updateProductType"
    :delete-fn="deleteProductType"
    topup-field="credit"
    topup-label="Credit"
    entity-type="product_type"
    balance-perm="product_types.topup"
    adjustment-perm="product_types.adjustment"
    perm-group="product_types"
    :topup-fn="(id, amount, remark) => topupProductTypeCredit(id, amount, remark)"
    :withdraw-fn="(id, amount, remark) => withdrawProductTypeCredit(id, amount, remark)"
    :adjust-fn="(id, direction, amount, remark) => adjustProductTypeCredit(id, direction, amount, remark)"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. Personal Loan" />
      </div>
      <div>
        <label class="label">Code <span class="text-red-500">*</span></label>
        <input v-model="form.code" class="input font-mono" required placeholder="e.g. PERSONAL_LOAN" />
      </div>
      <div>
        <label class="label">Currency</label>
        <SearchableSelect v-model="form.currency_type_id" :options="currencyTypes" placeholder="Select currency" />
      </div>
      <div>
        <label class="label">Description</label>
        <input v-model="form.description" class="input" />
      </div>
      <div>
        <label class="label">Icon</label>
        <input v-model="form.icon" class="input" placeholder="e.g. cash" />
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
import { ref, onMounted } from 'vue'
import LookupCrudView from './LookupCrudView.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { getProductTypes, createProductType, updateProductType, deleteProductType, getCurrencies, topupProductTypeCredit, withdrawProductTypeCredit, adjustProductTypeCredit } from '@/api/lookup'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'currency_type', label: 'Currency' },
  { key: 'credit', label: 'Credit' },
  { key: 'icon', label: 'Icon' },
  { key: 'sort_order', label: 'Order' },
  { key: 'branch',     label: 'Branch'     },
  { key: 'created_by', label: 'Created By' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = {
  name: '', code: '', description: '', icon: '', currency_type_id: null,
  sort_order: 0, is_active: true
}

const currencyTypes = ref([])

onMounted(async () => {
  try { const r = await getCurrencies({ show_all: false }); currencyTypes.value = (r.data || []).map(c => ({ id: c.id, name: c.name })) } catch {}
})
</script>