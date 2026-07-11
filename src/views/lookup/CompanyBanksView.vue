<template>
  <LookupCrudView
    title="Company Banks"
    subtitle="Our own bank accounts for receiving client deposits"
    :columns="columns"
    :default-form="defaultForm"
    :fetch-fn="getCompanyBanks"
    :create-fn="createCompanyBank"
    :update-fn="updateCompanyBank"
    :delete-fn="deleteCompanyBank"
    topup-field="cash"
    topup-label="Cash"
    entity-type="company_bank"
    balance-perm="company_banks.topup"
    adjustment-perm="company_banks.adjustment"
    perm-group="company_banks"
    :topup-fn="(id, amount, remark) => topupCompanyBankCash(id, amount, remark)"
    :withdraw-fn="(id, amount, remark) => withdrawCompanyBankCash(id, amount, remark)"
    :adjust-fn="(id, direction, amount, remark) => adjustCompanyBankCash(id, direction, amount, remark)"
  >
    <template #form="{ form }">
      <div>
        <label class="label">Bank <span class="text-red-500">*</span></label>
        <SearchableSelect v-model="form.bank_type_id" :options="bankTypes" placeholder="Select bank" />
      </div>
      <div>
        <label class="label">Account Number <span class="text-red-500">*</span></label>
        <input v-model="form.account_number" class="input font-mono" required placeholder="e.g. 000123456" />
      </div>
      <div>
        <label class="label">Account Name <span class="text-red-500">*</span></label>
        <input v-model="form.account_name" class="input" required placeholder="e.g. ABC COMPANY LTD" />
      </div>
      <div>
        <label class="label">Currency</label>
        <SearchableSelect v-model="form.currency_type_id" :options="currencyTypes" placeholder="Select currency" />
      </div>
      <div>
        <label class="label">QR Code URL</label>
        <input v-model="form.qr_code_url" class="input" placeholder="https://…/khqr.png" />
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
import { getCompanyBanks, createCompanyBank, updateCompanyBank, deleteCompanyBank, topupCompanyBankCash, withdrawCompanyBankCash, adjustCompanyBankCash } from '@/api/lookup'
import { getBankTypes, getCurrencies } from '@/api/lookup'

const columns = [
  { key: 'account_name',   label: 'Account Name' },
  { key: 'account_number', label: 'Account No' },
  { key: 'bank_type',      label: 'Bank' },
  { key: 'currency_type',  label: 'Currency' },
  { key: 'cash',           label: 'Cash' },
  { key: 'branch',         label: 'Branch' },
  { key: 'sort_order',     label: 'Order' },
  { key: 'is_active',      label: 'Status' },
]
const defaultForm = {
  bank_type_id: null, branch_id: null, account_number: '', account_name: '',
  currency_type_id: null, qr_code_url: '', sort_order: 0, is_active: true
}

const bankTypes     = ref([])
const currencyTypes = ref([])

onMounted(async () => {
  try { const r = await getBankTypes({ show_all: false }); bankTypes.value = (r.data || []).map(b => ({ id: b.id, name: b.name })) } catch {}
  try { const r = await getCurrencies({ show_all: false }); currencyTypes.value = (r.data || []).map(c => ({ id: c.id, name: c.name })) } catch {}
})
</script>