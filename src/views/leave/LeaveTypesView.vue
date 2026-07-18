<template>
  <LookupCrudView
    title="Leave Types"
    subtitle="Categories staff can request leave under (Sick, AL, Day Off, etc.)"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getLeaveTypes"
    :create-fn="createLeaveType"
    :update-fn="updateLeaveType"
    :delete-fn="deleteLeaveType"
    perm-group="leave_types"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Name <span class="text-red-500">*</span></label>
        <input v-model="form.name" class="input" required placeholder="e.g. Annual Leave" />
      </div>
      <div>
        <label class="label">Code</label>
        <input v-model="form.code" class="input font-mono uppercase" placeholder="e.g. AL" maxlength="20" />
      </div>
      <div>
        <label class="label">Sort Order</label>
        <input v-model.number="form.sort_order" type="number" class="input" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Annual Limit <span class="text-gray-400 font-normal">(days/year)</span></label>
          <input v-model.number="form.annual_limit" type="number" min="0" class="input" placeholder="Unlimited" />
        </div>
        <div>
          <label class="label">Monthly Limit <span class="text-gray-400 font-normal">(days/month)</span></label>
          <input v-model.number="form.monthly_limit" type="number" min="0" class="input" placeholder="Unlimited" />
        </div>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="form.is_active" class="accent-primary" />
        <span>Active</span>
      </div>
    </template>
  </LookupCrudView>
</template>

<script setup>
import LookupCrudView from '../lookup/LookupCrudView.vue'
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from '@/api/leave-types'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'branch', label: 'Branch' },
  { key: 'annual_limit', label: 'Annual Limit' },
  { key: 'monthly_limit', label: 'Monthly Limit' },
  { key: 'sort_order', label: 'Order' },
  { key: 'is_active', label: 'Status' },
]
const defaultForm = { name: '', code: '', branch_id: null, sort_order: 0, is_active: true, annual_limit: null, monthly_limit: null }
</script>