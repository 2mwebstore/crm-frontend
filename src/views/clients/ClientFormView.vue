<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/clients" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">{{ isEdit ? 'Edit Client' : 'New Client' }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ isEdit ? `Full Code: ${form.code}` : 'Select branch first, then enter the code suffix' }}
        </p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Basic Information</h2>
        <div class="grid grid-cols-2 gap-4">

          <!-- 1. Branch (first) -->
          <div>
            <label class="label">Branch</label>
            <SearchableSelect v-model="selectedBranchId" :options="branches" placeholder="Select branch" @update:modelValue="onBranchChange" />
          </div>

          <!-- 2. Code = prefix + suffix input -->
          <div>
            <label class="label">Code <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-0">
              <!-- Prefix from branch -->
              <span class="inline-flex items-center px-3 h-10 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm font-mono font-bold text-primary whitespace-nowrap" style="color:#938af4">
                {{ selectedBranchCode || '—' }}
              </span>
              <!-- Suffix input (max 3 chars) -->
              <div class="relative flex-1">
                <input
                  v-model="codeSuffix"
                  class="input rounded-l-none font-mono uppercase"
                  :placeholder="selectedBranchCode ? '001' : 'Select branch first'"
                  :disabled="!selectedBranchCode"
                  maxlength="3"
                  @input="codeSuffix = codeSuffix.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3); onCodeInput()"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-300">{{ codeSuffix.length }}/3</span>
              </div>
            </div>
            <!-- Preview -->
            <p class="text-xs mt-1" :class="codeStatus === 'ok' ? 'text-green-500' : codeStatus === 'taken' ? 'text-red-500' : 'text-gray-400'">
              <template v-if="selectedBranchCode && codeSuffix">
                Full code: <span class="font-mono font-bold">{{ fullCode }}</span>
                <span v-if="codeStatus === 'ok'"> ✓ available</span>
                <span v-else-if="codeStatus === 'taken'"> ✗ already taken</span>
              </template>
              <template v-else>Enter branch + suffix (e.g. CRNS + 001 → CRNS001)</template>
            </p>
          </div>

          <div class="col-span-2">
            <label class="label">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" class="input" required placeholder="Client name" />
          </div>

          <div>
            <label class="label">Contact Source</label>
            <SearchableSelect v-model="form.contact_source_id" :options="lookup.contactSources" placeholder="Select source" />
          </div>
          <div>
            <label class="label">Level</label>
            <SearchableSelect v-model="form.level_id" :options="lookup.levels" placeholder="Select level" />
          </div>
          <div>
            <label class="label">Date Joined</label>
            <DatePicker v-model="form.date_joined" placeholder="Select date & time…" />
          </div>
          <div>
            <label class="label">Active</label>
            <SearchableSelect v-model="form.is_active" :options="enableOpts" value-key="id" label-key="name" placeholder="Select" :show-all="false" />
          </div>
        </div>
        <div>
          <label class="label">Remark</label>
          <textarea v-model="form.remark" class="input resize-none" rows="2" placeholder="Notes..." />
        </div>
      </div>

      <!-- Phone section -->
      <div class="card p-5 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">
            Phone Section <span class="text-red-500">*</span>
          </h2>
          <button type="button" @click="addPhone" class="btn-secondary btn-sm flex items-center gap-1">
            <PlusIcon class="w-3.5 h-3.5" /> Add Phone
          </button>
        </div>
        <div v-if="!form.phones.length" class="text-sm text-amber-600 text-center py-3">
          At least one phone is required.
        </div>
        <div v-for="(ph, i) in form.phones" :key="i" class="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
          <div class="col-span-5"><input v-model="ph.phone" class="input bg-white text-sm" placeholder="Phone number*" required /></div>
          <div class="col-span-3">
            <SearchableSelect v-model="ph.label" :options="labelOpts" value-key="id" label-key="name" placeholder="Label" :show-all="false" />
          </div>
          <div class="col-span-2 flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" v-model="ph.is_primary" class="accent-primary" /> Primary
          </div>
          <div class="col-span-1 flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" v-model="ph.is_active" class="accent-primary" /> On
          </div>
          <div class="col-span-1 text-right">
            <button type="button" @click="form.phones.splice(i, 1)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <!-- Bank section -->
      <div class="card p-5 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">
            Bank Section
          </h2>
          <button type="button" @click="addBank" class="btn-secondary btn-sm flex items-center gap-1">
            <PlusIcon class="w-3.5 h-3.5" /> Add Bank
          </button>
        </div>
        <div v-if="!form.banks.length" class="text-sm text-gray-400 text-center py-3">No banks added</div>
        <div v-for="(bk, i) in form.banks" :key="i" class="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
          <div class="col-span-3"><SearchableSelect v-model="bk.bank_type_id" :options="lookup.bankTypes" placeholder="Bank*" /></div>
          <div class="col-span-3"><input v-model="bk.account_no" class="input bg-white text-sm" placeholder="Account No*" required /></div>
          <div class="col-span-3"><input v-model="bk.account_name" class="input bg-white text-sm" placeholder="Account Name*" required /></div>
          <div class="col-span-2 flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" v-model="bk.is_active" class="accent-primary" /> Enable
          </div>
          <div class="col-span-1 text-right">
            <button type="button" @click="form.banks.splice(i, 1)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <!-- Player / Product section -->
      <div class="card p-5 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">
            Player Section <span class="text-red-500">*</span>
          </h2>
          <button type="button" @click="addProduct" class="btn-secondary btn-sm flex items-center gap-1">
            <PlusIcon class="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
        <div v-if="!form.products.length" class="text-sm text-amber-600 text-center py-3">
          At least one product is required.
        </div>
        <div v-for="(pr, i) in form.products" :key="i" class="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
          <div class="col-span-4"><SearchableSelect v-model="pr.product_type_id" :options="lookup.productTypes" placeholder="Product type*" /></div>
          <div class="col-span-5">
            <div class="flex items-center gap-0">
              <span class="inline-flex items-center px-2 h-9 rounded-l-lg border border-r-0 border-gray-200 bg-white text-xs font-mono font-bold whitespace-nowrap" style="color:#938af4">
                {{ selectedBranchCode || '—' }}
              </span>
              <input
                v-model="pr.account_suffix"
                class="input rounded-l-none font-mono text-sm flex-1"
                :placeholder="selectedBranchCode ? '001' : 'Select branch first'"
                :disabled="!selectedBranchCode"
                maxlength="3"
                required
                @input="pr.account_suffix = pr.account_suffix.replace(/[^0-9]/g,'').slice(0,3); pr.account_id = selectedBranchCode + pr.account_suffix"
              />
            </div>
          </div>
          <div class="col-span-2 flex items-center gap-1.5 text-xs text-gray-600">
            <input type="checkbox" v-model="pr.is_active" class="accent-primary" /> Enable
          </div>
          <div class="col-span-1 text-right">
            <button type="button" @click="form.products.splice(i, 1)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pb-4">
        <RouterLink to="/clients" class="btn-secondary">Cancel</RouterLink>
        <button
          type="submit"
          class="btn-primary"
          :disabled="saving || codeStatus === 'taken' || (!isEdit && !fullCode) || !form.phones.length || !form.products.length"
        >
          {{ saving ? 'Saving...' : (isEdit ? 'Update Client' : 'Create Client') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useLookupStore } from '@/stores/lookup'
import { getClient, createClient, updateClient, checkClientCode } from '@/api/clients'
import { getBranches } from '@/api/branches'
import { useToast } from '@/composables/useToast'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import { nowForDatePicker } from '@/utils/datetime'

const route = useRoute(); const router = useRouter()
const lookup = useLookupStore(); const { success, error } = useToast()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const branches = ref([])
const selectedBranchId = ref(null)
const selectedBranchCode = ref('')
const codeSuffix = ref('')
const codeStatus = ref('') // '' | 'ok' | 'taken'
let codeTimer = null

// Full code = branch prefix + suffix
const fullCode = computed(() => {
  if (!selectedBranchCode.value || !codeSuffix.value) return ''
  return selectedBranchCode.value + codeSuffix.value
})

const enableOpts = [{ id: true, name: 'Yes' }, { id: false, name: 'No' }]
const labelOpts  = [
  { id: 'primary', name: 'Primary' }, { id: 'work', name: 'Work' },
  { id: 'mobile', name: 'Mobile' },   { id: 'home', name: 'Home' }
]
const form = ref({
  code: '', name: '', date_joined: nowForDatePicker(), is_active: true, remark: '',
  branch_id: null, level_id: null, contact_source_id: null,
  phones: [], banks: [], products: []
})

function onBranchChange(id) {
  const b = branches.value.find(x => x.id === id)
  selectedBranchCode.value = b?.code || ''
  codeSuffix.value = ''
  codeStatus.value = ''
  // Branch prefix changed - rebuild every product's account_id from its
  // existing suffix against the new prefix.
  form.value.products.forEach(pr => {
    pr.account_id = selectedBranchCode.value + (pr.account_suffix || '')
  })
}

function onCodeInput() {
  codeStatus.value = ''
  clearTimeout(codeTimer)
  if (!fullCode.value) return
  codeTimer = setTimeout(async () => {
    try {
      const excludeId = isEdit.value ? route.params.id : null
      const res = await checkClientCode(fullCode.value, excludeId)
      codeStatus.value = res.data?.available ? 'ok' : 'taken'
    } catch { codeStatus.value = '' }
  }, 400)
}

function addPhone()   { form.value.phones.push({ phone: '', label: 'primary', is_primary: form.value.phones.length === 0, is_active: true, sort_order: form.value.phones.length }) }
function addBank()    { form.value.banks.push({ bank_type_id: lookup.bankTypes.length === 1 ? lookup.bankTypes[0].id : null, account_no: '', account_name: '', is_active: true, sort_order: form.value.banks.length }) }
function addProduct() {
  form.value.products.push({
    product_type_id: lookup.productTypes.length === 1 ? lookup.productTypes[0].id : null,
    account_id: '', account_suffix: '', is_active: true, sort_order: form.value.products.length
  })
}

onMounted(async () => {
  await lookup.loadAll()
  const bRes = await getBranches({ show_all: false })
  branches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, code: b.code, sub: b.code }))

  if (!isEdit.value) {
    if (branches.value.length === 1) {
      selectedBranchId.value = branches.value[0].id
      onBranchChange(selectedBranchId.value)
    }
    if (lookup.contactSources.length === 1) {
      form.value.contact_source_id = lookup.contactSources[0].id
    }
  }

  if (isEdit.value) {
    try {
      const res = await getClient(route.params.id); const d = res.data
      const banks    = (d.banks    || []).map(b => ({ ...b, bank_type_id:    b.bank_type_id    || b.bank_type?.id    || null }))
      const products = (d.products || []).map(p => ({ ...p, product_type_id: p.product_type_id || p.product_type?.id || null }))
      Object.assign(form.value, {
        ...d,
        date_joined: d.date_joined || '',
        branch_id: d.branch_id || d.branch?.id || null,
        phones: d.phones || [], banks, products
      })
      // Restore branch + code split for edit
      const branch = branches.value.find(b => b.id === form.value.branch_id)
      if (branch) {
        selectedBranchId.value = branch.id
        selectedBranchCode.value = branch.code
        // suffix = everything after the branch code prefix
        codeSuffix.value = d.code.startsWith(branch.code) ? d.code.slice(branch.code.length) : d.code
        // Same split for each product's account_id, now that we know the branch prefix
        form.value.products = form.value.products.map(p => ({
          ...p,
          account_suffix: p.account_id && p.account_id.startsWith(branch.code)
            ? p.account_id.slice(branch.code.length)
            : (p.account_id || '')
        }))
      }
      codeStatus.value = 'ok'
    } catch { error('Failed to load client') }
  }
})

async function handleSubmit() {
  if (!isEdit.value && !fullCode.value) { error('Select branch and enter code'); return }
  if (codeStatus.value === 'taken') { error('Code already taken'); return }
  if (!form.value.phones.length)   { error('At least one phone is required'); return }
  if (!form.value.products.length) { error('At least one product is required'); return }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      code: isEdit.value ? (fullCode.value || form.value.code) : fullCode.value,
      branch_id: selectedBranchId.value || form.value.branch_id,
    }
    if (!payload.date_joined) delete payload.date_joined
    payload.products = payload.products.map(({ account_suffix, ...p }) => p)
    if (isEdit.value) {
      await updateClient(route.params.id, payload); success('Client updated')
    } else {
      await createClient(payload); success('Client created')
    }
    router.push('/clients')
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}
</script>