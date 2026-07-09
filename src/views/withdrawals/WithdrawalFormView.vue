<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/withdrawals" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">{{ isEdit ? 'Edit Withdrawal' : 'New Withdrawal' }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ isEdit ? `Transaction: ${form.transaction_no}` : 'Transaction No will be auto-generated' }}
        </p>
      </div>
    </div>

    <TransactionForm
      v-model="form"
      type="withdrawal"
      :is-edit="isEdit"
      :branch-id="branchId"
      :initial-product="initialProduct"
      :initial-bank="initialBank"
      :initial-company-bank="initialCompanyBank"
      @submit="handleSubmit"
    >
      <template #client-linkage-prepend>
        <div class="col-span-2">
          <label class="label">Branch <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="branchId" :options="branches" placeholder="Select branch" />
        </div>
      </template>

      <template #actions>
        <RouterLink to="/withdrawals" class="btn-secondary">Cancel</RouterLink>
        <RequiredFieldsGuard
          :fields="{
            Branch: branchId,
            Client: form.client_id,
            Product: form.client_product_id,
            'Client Bank': form.client_bank_id,
            'Company Bank': form.company_bank_id,
            Amount: form.amount,
          }"
          v-slot="{ isValid, missing }"
        >
          <div class="flex flex-col items-end gap-1">
            <p v-if="!isValid" class="text-xs text-amber-600">
              Missing: {{ missing.join(', ') }}
            </p>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving || !isValid"
              :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
              @click="submitForm"
            >
              {{ saving ? 'Saving…' : (isEdit ? 'Update Withdrawal' : 'Create Withdrawal') }}
            </button>
          </div>
        </RequiredFieldsGuard>
      </template>
    </TransactionForm>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import TransactionForm from '@/components/transactions/TransactionForm.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import RequiredFieldsGuard from '@/components/ui/RequiredFieldsGuard.vue'
import { createWithdrawal, updateWithdrawal, getWithdrawal } from '@/api/transactions'
import { getBranches } from '@/api/branches'
import { useToast } from '@/composables/useToast'
import { nowForDatePicker } from '@/utils/datetime'

const route  = useRoute()
const router = useRouter()
const { success, error } = useToast()

const isEdit  = computed(() => !!route.params.id)
const saving  = ref(false)
const branches = ref([])
const branchId = ref(null)

const initialProduct     = ref(null)
const initialBank        = ref(null)
const initialCompanyBank = ref(null)

const form = ref({
  transaction_no: '', date: nowForDatePicker(),
  client_id: null, client_product_id: null, client_bank_id: null, company_bank_id: null,
  amount: 0, currency: 'USD', bonus_option_id: null, bonus_amount: 0, to: 0, bal: 0, os: 0, play: 0, remark: '',
})

onMounted(async () => {
  const bRes = await getBranches({ show_all: false })
  branches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, code: b.code, sub: b.code }))
  if (!isEdit.value && branches.value.length === 1) {
    branchId.value = branches.value[0].id
  }

  if (isEdit.value) {
    try {
      const res = await getWithdrawal(route.params.id)
      const d = res.data
      if (d.client_product) initialProduct.value     = d.client_product
      if (d.client_bank)    initialBank.value        = d.client_bank
      if (d.company_bank)   initialCompanyBank.value = d.company_bank
      branchId.value = d.branch_id || null
      form.value = {
        transaction_no:    d.transaction_no,
        date:              d.date || '',
        client_id:         d.client_id,
        client_product_id: d.client_product_id || d.client_product?.id || null,
        client_bank_id:    d.client_bank_id    || d.client_bank?.id    || null,
        company_bank_id:   d.company_bank_id   || d.company_bank?.id   || null,
        amount:            d.amount,
        currency:          d.currency,
        bonus_option_id:   d.bonus_option_id || null,
        bonus_amount:      d.bonus_amount || 0,
        to: d.to || 0, bal: d.bal || 0, os: d.os || 0, play: d.play || 0,
        remark: d.remark || '',
      }
    } catch { error('Failed to load withdrawal') }
  }
})

function submitForm() {
  document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

async function handleSubmit(formData) {
  if (!branchId.value) { error('Branch is required'); return }
  saving.value = true
  try {
    const payload = { ...formData, branch_id: branchId.value || undefined }
    if (!payload.transaction_no) delete payload.transaction_no
    payload.bal            = payload.bal            || 0
    payload.to             = payload.to             || 0
    payload.os             = payload.os             || 0
    payload.play           = payload.play           || 0
    // A *uint on the backend can't tell "field omitted" apart from "field
    // sent as null" - both unmarshal to nil. Sending 0 instead gives the
    // backend a real, non-nil value it can recognize as "clear this".
    payload.bonus_option_id = payload.bonus_option_id || 0
    if (isEdit.value) {
      await updateWithdrawal(route.params.id, {
        branch_id:       branchId.value || undefined,
        date:            payload.date,
        client_bank_id:  payload.client_bank_id,
        company_bank_id: payload.company_bank_id,
        amount:          payload.amount,
        bonus_option_id: payload.bonus_option_id,
        bonus_amount:    payload.bonus_amount,
        to: payload.to, bal: payload.bal, os: payload.os, play: payload.play,
        remark: payload.remark,
      })
      success('Withdrawal updated')
    } else {
      await createWithdrawal(payload)
      success('Withdrawal created')
    }
    router.push('/withdrawals')
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}
</script>