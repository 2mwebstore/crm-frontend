<template>
  <LookupCrudView
    title="Bonus Options"
    subtitle="Bonus calculation rules applied to clients"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getBonusOptions"
    :create-fn="createBonusOption"
    :update-fn="updateBonusOption"
    :delete-fn="deleteBonusOption"
    perm-group="bonus_options"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. 10% Commission" />
      </div>
      <div>
        <label class="label">Code <span class="text-red-500">*</span></label>
        <input v-model="form.code" class="input font-mono" required placeholder="e.g. PCT_10" />
      </div>
      <div>
        <label class="label">Calculation Type <span class="text-red-500">*</span></label>
        <SearchableSelect v-model="form.calc_type" :options="[{id:'fixed',name:'Fixed Amount'},{id:'percentage',name:'Percentage (%)'}]" value-key="id" label-key="name" placeholder="Select type" :show-all="false" />
      </div>
      <div>
        <label class="label">
          Bonus Value <span class="text-red-500">*</span>
          <span class="text-gray-400 font-normal ml-1">{{ form.calc_type === 'percentage' ? '(e.g. 10 = 10%)' : '(flat amount)' }}</span>
        </label>
        <input v-model.number="form.bonus_value" type="number" min="0" step="0.0001" class="input" required />
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
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { getBonusOptions, createBonusOption, updateBonusOption, deleteBonusOption } from '@/api/lookup'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'calc_type', label: 'Type' },
  { key: 'bonus_value', label: 'Value' },
  { key: 'branch',     label: 'Branch'     },
  { key: 'created_by', label: 'Created By' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { name: '', code: '', description: '', calc_type: 'fixed', bonus_value: 0, sort_order: 0, is_active: true }
</script>