<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  <div v-else-if="client" class="max-w-5xl mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <RouterLink to="/clients" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
        <div class="flex items-center gap-3">
          <img v-if="client.picture" :src="client.picture" class="w-12 h-12 rounded-xl object-cover" />
          <div v-else class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background:#938af4">{{ client.name?.charAt(0) }}</div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-semibold text-gray-800">{{ client.name }}</h1>
              <span :class="['badge', statusColor(client.status)]">{{ client.status }}</span>
              <span :class="['badge', client.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ client.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
            <p class="text-sm text-gray-500 font-mono">{{ client.code }} · {{ client.type }}</p>
          </div>
        </div>
      </div>
      <RouterLink :to="`/clients/${client.id}/edit`" class="btn-secondary btn-sm flex items-center gap-1"><PencilIcon class="w-4 h-4" />Edit</RouterLink>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 gap-1">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        :class="['px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700']">
        {{ t.label }}
      </button>
    </div>

    <!-- Overview tab -->
    <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-5">
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Information</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-xs text-gray-400">Contact Source</dt><dd>{{ client.contact_source?.name || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Level</dt><dd>{{ client.level?.name || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Date Joined</dt><dd>{{ fmtDate(client.date_joined) }}</dd></div>
            <div><dt class="text-xs text-gray-400">Email</dt><dd>{{ client.email || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Website</dt><dd>{{ client.website || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Created by</dt><dd>{{ client.created_by?.name || '—' }}</dd></div>
          </dl>
          <div v-if="client.remark" class="mt-3 pt-3 border-t border-gray-100"><p class="text-xs text-gray-400 mb-1">Remark</p><p class="text-sm text-gray-700">{{ client.remark }}</p></div>
          <div v-if="client.description" class="mt-3 pt-3 border-t border-gray-100"><p class="text-xs text-gray-400 mb-1">Description</p><p class="text-sm text-gray-700">{{ client.description }}</p></div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="card p-5 space-y-3 text-sm">
          <h2 class="text-sm font-semibold text-gray-700">Financials</h2>
          <div class="flex justify-between"><span class="text-gray-500">Revenue</span><span class="font-medium">{{ fmtCurrency(client.annual_revenue, client.currency) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Bonus</span><span class="text-green-600">+{{ fmtCurrency(client.bonus_amount, client.currency) }}</span></div>
          <div class="flex justify-between border-t pt-2"><span class="font-medium text-gray-700">Total</span><span class="font-bold" style="color:#938af4">{{ fmtCurrency(client.total_value, client.currency) }}</span></div>
          <div class="flex justify-between text-xs text-gray-400"><span>≈ USD</span><span>{{ fmtCurrency(client.value_in_usd, 'USD') }}</span></div>
          <div class="flex justify-between text-xs text-gray-400"><span>≈ KHR</span><span>{{ Number(client.value_in_khr || 0).toLocaleString() }} ៛</span></div>
        </div>
      </div>
    </div>

    <!-- Phones tab -->
    <div v-if="activeTab === 'phones'" class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100"><tr><th class="table-header">#</th><th class="table-header">Phone</th><th class="table-header">Label</th><th class="table-header">Is Primary</th><th class="table-header">Status</th><th class="table-header">Enable</th></tr></thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="!client.phones?.length"><td colspan="6" class="table-cell text-center py-8 text-gray-400">No phones</td></tr>
          <tr v-for="(ph, i) in client.phones" :key="ph.id">
            <td class="table-cell text-gray-400">{{ i + 1 }}</td>
            <td class="table-cell font-medium">{{ ph.phone }}</td>
            <td class="table-cell text-gray-500 capitalize">{{ ph.label }}</td>
            <td class="table-cell"><span :class="['badge text-xs', ph.is_primary ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500']">{{ ph.is_primary ? 'Yes' : 'No' }}</span></td>
            <td class="table-cell"><span :class="['badge text-xs', ph.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ ph.status }}</span></td>
            <td class="table-cell"><span :class="['badge text-xs', ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ ph.is_active ? 'Yes' : 'No' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Banks tab -->
    <div v-if="activeTab === 'banks'" class="space-y-4">
      <div class="flex justify-end"><button @click="bankModal = true" class="btn-primary btn-sm flex items-center gap-1"><PlusIcon class="w-3.5 h-3.5" />Add Bank</button></div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100"><tr><th class="table-header">#</th><th class="table-header">Bank</th><th class="table-header">Account No</th><th class="table-header">Account Name</th><th class="table-header">Enable</th><th class="table-header text-right">Actions</th></tr></thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="!client.banks?.length"><td colspan="6" class="table-cell text-center py-8 text-gray-400">No banks added</td></tr>
            <tr v-for="(bk, i) in client.banks" :key="bk.id">
              <td class="table-cell text-gray-400">{{ i + 1 }}</td>
              <td class="table-cell font-medium">{{ bk.bank_type?.name || '—' }}</td>
              <td class="table-cell font-mono text-xs">{{ bk.account_no }}</td>
              <td class="table-cell">{{ bk.account_name }}</td>
              <td class="table-cell"><span :class="['badge text-xs', bk.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ bk.is_active ? 'Yes' : 'No' }}</span></td>
              <td class="table-cell text-right"><button @click="deleteBank(bk.id)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Products tab -->
    <div v-if="activeTab === 'products'" class="space-y-4">
      <div class="flex justify-end"><button @click="productModal = true" class="btn-primary btn-sm flex items-center gap-1"><PlusIcon class="w-3.5 h-3.5" />Add Product</button></div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100"><tr><th class="table-header">#</th><th class="table-header">Product</th><th class="table-header">Account ID</th><th class="table-header">Enable</th><th class="table-header text-right">Actions</th></tr></thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="!client.products?.length"><td colspan="5" class="table-cell text-center py-8 text-gray-400">No products added</td></tr>
            <tr v-for="(pr, i) in client.products" :key="pr.id">
              <td class="table-cell text-gray-400">{{ i + 1 }}</td>
              <td class="table-cell font-medium">{{ pr.product_type?.name || '—' }}</td>
              <td class="table-cell font-mono text-xs">{{ pr.account_id }}</td>
              <td class="table-cell"><span :class="['badge text-xs', pr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ pr.is_active ? 'Yes' : 'No' }}</span></td>
              <td class="table-cell text-right"><button @click="deleteProduct(pr.id)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Follow Ups tab -->
    <div v-if="activeTab === 'followups'" class="space-y-4">
      <div class="flex justify-end"><button @click="fuModal = true" class="btn-primary btn-sm flex items-center gap-1"><PlusIcon class="w-3.5 h-3.5" />Log Follow Up</button></div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100"><tr><th class="table-header">#</th><th class="table-header">Interest</th><th class="table-header">Given Account</th><th class="table-header">Bank Account</th><th class="table-header">Remark</th><th class="table-header">Date</th><th class="table-header">By</th><th class="table-header text-right">Actions</th></tr></thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="!followUps.length"><td colspan="8" class="table-cell text-center py-8 text-gray-400">No follow-ups yet</td></tr>
            <tr v-for="(fu, i) in followUps" :key="fu.id">
              <td class="table-cell text-gray-400">{{ i + 1 }}</td>
              <td class="table-cell"><span :class="['badge text-xs', fu.interest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ fu.interest ? 'Yes' : 'No' }}</span></td>
              <td class="table-cell"><span :class="['badge text-xs', fu.given_account ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ fu.given_account ? 'Yes' : 'No' }}</span></td>
              <td class="table-cell"><span :class="['badge text-xs', fu.bank_account ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ fu.bank_account ? 'Yes' : 'No' }}</span></td>
              <td class="table-cell max-w-xs truncate">{{ fu.remark }}</td>
              <td class="table-cell text-xs text-gray-500">{{ fmtDate(fu.follow_up_at) }}</td>
              <td class="table-cell text-xs text-gray-500">{{ fu.created_by?.name || '—' }}</td>
              <td class="table-cell text-right"><button @click="deleteFU(fu.id)" class="btn-icon text-red-400"><TrashIcon class="w-4 h-4" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Bank Modal -->
    <AppModal v-model="bankModal" title="Add Bank Account" size="md">
      <div class="space-y-3">
        <div><label class="label">Bank <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="bankForm.bank_type_id" :options="lookup.bankTypes" placeholder="Select bank" :show-all="false" />
        </div>
        <div><label class="label">Account No <span class="text-red-500">*</span></label><input v-model="bankForm.account_no" class="input" required /></div>
        <div><label class="label">Account Name <span class="text-red-500">*</span></label><input v-model="bankForm.account_name" class="input" required /></div>
        <div class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="bankForm.is_active" class="accent-primary" /><span>Enable</span></div>
      </div>
      <template #footer>
        <button @click="bankModal = false" class="btn-secondary">Cancel</button>
        <button @click="saveBank" class="btn-primary">Add Bank</button>
      </template>
    </AppModal>

    <!-- Add Product Modal -->
    <AppModal v-model="productModal" title="Add Product (Player)" size="md">
      <div class="space-y-3">
        <div><label class="label">Product <span class="text-red-500">*</span></label>
          <SearchableSelect v-model="productForm.product_type_id" :options="lookup.productTypes" placeholder="Select product" :show-all="false" />
        </div>
        <div><label class="label">Account ID <span class="text-red-500">*</span></label><input v-model="productForm.account_id" class="input" required /></div>
        <div class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="productForm.is_active" class="accent-primary" /><span>Enable</span></div>
      </div>
      <template #footer>
        <button @click="productModal = false" class="btn-secondary">Cancel</button>
        <button @click="saveProduct" class="btn-primary">Add Product</button>
      </template>
    </AppModal>

    <!-- Follow Up Modal -->
    <AppModal v-model="fuModal" title="Log Follow Up" size="md">
      <div class="space-y-3">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="fuForm.interest" class="accent-primary" />Interest</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="fuForm.given_account" class="accent-primary" />Given Account</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="fuForm.bank_account" class="accent-primary" />Bank Account</label>
        </div>
        <div><label class="label">Remark <span class="text-red-500">*</span></label><textarea v-model="fuForm.remark" class="input resize-none" rows="3" required /></div>
        <div><label class="label">Follow Up Date <span class="text-red-500">*</span></label><input v-model="fuForm.follow_up_at" type="datetime-local" class="input" required /></div>
      </div>
      <template #footer>
        <button @click="fuModal = false" class="btn-secondary">Cancel</button>
        <button @click="saveFU" class="btn-primary">Log</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/common/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useLookupStore } from '@/stores/lookup'
import { getClient, addBank, deleteBank as apiDeleteBank, addProduct, deleteProduct as apiDeleteProduct, addFollowUp, deleteFollowUp, getFollowUps } from '@/api/clients'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const lookup = useLookupStore()
const { success, error } = useToast()
const client = ref(null)
const loading = ref(true)
const followUps = ref([])
const activeTab = ref('overview')
const bankModal = ref(false)
const productModal = ref(false)
const fuModal = ref(false)

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'phones', label: 'Phones' },
  { id: 'banks', label: 'Banks' },
  { id: 'products', label: 'Products' },
  { id: 'followups', label: 'Follow Ups' },
]

const bankForm = ref({ bank_type_id: null, account_no: '', account_name: '', is_active: true })
const productForm = ref({ product_type_id: null, account_id: '', is_active: true })
const fuForm = ref({ interest: false, given_account: false, bank_account: false, remark: '', follow_up_at: '' })

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function fmtCurrency(val, cur) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(val || 0) }
function statusColor(s) { return { lead: 'bg-blue-100 text-blue-700', prospect: 'bg-purple-100 text-purple-700', active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', churned: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600' }

async function load() {
  loading.value = true
  try { const res = await getClient(route.params.id); client.value = res.data } catch { error('Failed to load') } finally { loading.value = false }
  try { const res = await getFollowUps(route.params.id, {}); followUps.value = res.data || [] } catch { }
}

async function saveBank() {
  try { await addBank(route.params.id, bankForm.value); success('Bank added'); bankModal.value = false; bankForm.value = { bank_type_id: null, account_no: '', account_name: '', is_active: true }; load() }
  catch (e) { error(e?.error || 'Failed') }
}
async function deleteBank(id) {
  if (!confirm('Remove bank?')) return
  try { await apiDeleteBank(route.params.id, id); success('Removed'); load() } catch (e) { error(e?.error || 'Failed') }
}
async function saveProduct() {
  try { await addProduct(route.params.id, productForm.value); success('Product added'); productModal.value = false; productForm.value = { product_type_id: null, account_id: '', is_active: true }; load() }
  catch (e) { error(e?.error || 'Failed') }
}
async function deleteProduct(id) {
  if (!confirm('Remove product?')) return
  try { await apiDeleteProduct(route.params.id, id); success('Removed'); load() } catch (e) { error(e?.error || 'Failed') }
}
async function saveFU() {
  try { await addFollowUp(route.params.id, fuForm.value); success('Follow-up logged'); fuModal.value = false; fuForm.value = { interest: false, given_account: false, bank_account: false, remark: '', follow_up_at: '' }; load() }
  catch (e) { error(e?.error || 'Failed') }
}
async function deleteFU(id) {
  if (!confirm('Delete follow-up?')) return
  try { await deleteFollowUp(route.params.id, id); success('Deleted'); load() } catch (e) { error(e?.error || 'Failed') }
}

onMounted(async () => { await lookup.loadAll(); load() })
</script>
