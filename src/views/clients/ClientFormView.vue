<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/clients" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">{{ isEdit ? 'Edit Client' : 'New Client' }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ isEdit ? `Code: ${form.code}` : 'Select branch to auto-generate code' }}
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

          <!-- 2. Auto code preview -->
          <div>
            <label class="label">Code (auto-generated)</label>
            <div class="input bg-gray-50 flex items-center gap-2 cursor-default select-none">
              <span v-if="codePreview" class="font-mono font-bold text-sm" style="color:#938af4">{{ codePreview }}</span>
              <span v-else class="text-gray-400 text-sm">Select branch to preview</span>
              <span v-if="loadingCode" class="ml-auto">
                <svg class="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </span>
            </div>
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
          <div class="col-span-4"><SearchableSelect v-model="pr.product_type_id" :options="productTypeOptions" placeholder="Product type*" @update:modelValue="onProductTypeChange(pr)" /></div>
          <div class="col-span-5">
            <div class="flex items-center gap-0">
              <span class="inline-flex items-center px-2 h-9 rounded-l-lg border border-r-0 border-gray-200 bg-white text-xs font-mono font-bold whitespace-nowrap" style="color:#938af4">
                {{ productPrefix(pr) || '—' }}
              </span>
              <input
                v-model="pr.account_suffix"
                :class="['input rounded-l-none font-mono text-sm flex-1', isDuplicateRow(pr) ? 'border-red-400 focus:border-red-500' : '']"
                :placeholder="productPrefix(pr) ? '001' : 'Select product first'"
                :disabled="!productPrefix(pr)"
                maxlength="3"
                required
                @input="pr.account_suffix = pr.account_suffix.replace(/[^a-zA-Z0-9]/g, '').slice(0,3); pr.account_id = productPrefix(pr) + pr.account_suffix"
              />
            </div>
            <p v-if="isDuplicateRow(pr)" class="text-xs text-red-500 mt-0.5">Duplicate account ID: {{ pr.account_id }}</p>
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
          :disabled="saving || (!isEdit && !selectedBranchId) || !form.phones.length || !form.products.length || duplicateAccountIds.size"
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
import { getClient, createClient, updateClient, previewClientCode } from '@/api/clients'
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
const codePreview = ref('')
const loadingCode = ref(false)

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

// Product dropdown shows "Name (CODE)" so the user can tell products apart by code.
const productTypeOptions = computed(() =>
  (lookup.productTypes || []).map(p => ({ id: p.id, name: p.code ? `${p.name} (${p.code})` : p.name, code: p.code }))
)

// Each product row's account prefix now comes from the selected product's own
// code, not the branch code — different products can have different prefixes.
function productPrefix(pr) {
  const pt = (lookup.productTypes || []).find(p => p.id === pr.product_type_id)
  return pt?.code || ''
}

function onProductTypeChange(pr) {
  // Product changed → prefix source changed, rebuild this row's account_id
  // from its existing suffix against the new product's code.
  pr.account_id = productPrefix(pr) + (pr.account_suffix || '')
}

// account_id has a DB-level uniqueIndex (a client's product account ID must
// be unique across the whole system) — this catches the common local case
// (two rows in THIS form ending up with the same account_id) before submit,
// so the person sees it immediately instead of waiting on a round trip to
// the backend. Cross-client duplicates (same account_id already used by a
// different client entirely) can only be caught server-side, which still
// surfaces its own clear error via the catch block in handleSubmit below.
const duplicateAccountIds = computed(() => {
  const seen = new Set()
  const dupes = new Set()
  for (const pr of form.value.products) {
    if (!pr.account_id) continue
    if (seen.has(pr.account_id)) dupes.add(pr.account_id)
    seen.add(pr.account_id)
  }
  return dupes
})
function isDuplicateRow(pr) {
  return !!pr.account_id && duplicateAccountIds.value.has(pr.account_id)
}

async function onBranchChange(id) {
  codePreview.value = ''
  if (!id) return
  loadingCode.value = true
  try {
    const res = await previewClientCode(id)
    codePreview.value = res.data?.code || ''
  } catch { codePreview.value = '' }
  finally { loadingCode.value = false }
}

function addPhone()   { form.value.phones.push({ phone: '', label: 'primary', is_primary: form.value.phones.length === 0, is_active: true, sort_order: form.value.phones.length }) }
function addBank()    { form.value.banks.push({ bank_type_id: lookup.bankTypes.length === 1 ? lookup.bankTypes[0].id : null, account_no: '', account_name: '', is_active: true, sort_order: form.value.banks.length }) }
function addProduct() {
  const defaultId = lookup.productTypes.length === 1 ? lookup.productTypes[0].id : null
  const row = { product_type_id: defaultId, account_id: '', account_suffix: '', is_active: true, sort_order: form.value.products.length }
  form.value.products.push(row)
}

onMounted(async () => {
  await lookup.loadAll()
  const bRes = await getBranches({ show_all: false })
  branches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, code: b.code, sub: b.code }))

  if (!isEdit.value) {
    if (branches.value.length === 1) {
      selectedBranchId.value = branches.value[0].id
      await onBranchChange(selectedBranchId.value)
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
      codePreview.value = d.code || ''
      // Restore branch selection (code stays fixed on edit — not regenerated)
      const branch = branches.value.find(b => b.id === form.value.branch_id)
      if (branch) {
        selectedBranchId.value = branch.id
      }
      // Split each product's account_id into its suffix using that product's
      // own code as the prefix (each product type can have a different code).
      form.value.products = form.value.products.map(p => {
        const prefix = productPrefix(p)
        return {
          ...p,
          account_suffix: p.account_id && prefix && p.account_id.startsWith(prefix)
            ? p.account_id.slice(prefix.length)
            : (p.account_id || '')
        }
      })
    } catch { error('Failed to load client') }
  }
})

async function handleSubmit() {
  if (!isEdit.value && !selectedBranchId.value) { error('Select a branch'); return }
  if (!form.value.phones.length)   { error('At least one phone is required'); return }
  if (!form.value.products.length) { error('At least one product is required'); return }
  if (duplicateAccountIds.value.size) {
    error('Duplicate account ID: ' + [...duplicateAccountIds.value].join(', '))
    return
  }
  saving.value = true
  try {
    const payload = { ...form.value, branch_id: selectedBranchId.value || form.value.branch_id }
    // Don't send code on create — backend generates it from the branch sequence
    if (!isEdit.value) delete payload.code
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