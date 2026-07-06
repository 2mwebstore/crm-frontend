<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div class="flex items-center gap-3">
      <RouterLink to="/interesting-clients" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">{{ isEdit ? 'Edit Interesting Client' : 'New Interesting Client' }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ isEdit ? `Code: ${form.code}` : 'Select branch to auto-generate code' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Basic Information</h2>
        <div class="grid grid-cols-2 gap-4">

          <!-- Branch -->
          <div>
            <label class="label">Branch <span class="text-red-500">*</span></label>
            <SearchableSelect v-model="form.branch_id" :options="branches" placeholder="Select branch" @update:modelValue="onBranchChange" />
          </div>

          <!-- Auto code preview -->
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
            <!-- <p class="text-xs text-gray-400 mt-1">Counter increments automatically on save</p> -->
          </div>

          <!-- Full Name -->
          <div class="col-span-2">
            <label class="label">Full Name <span class="text-red-500">*</span></label>
            <input v-model="form.full_name" class="input" required placeholder="Full name" />
          </div>

          <div>
            <label class="label">Contact Source</label>
            <SearchableSelect
              v-model="form.contact_source_id"
              :options="contactSources"
              :placeholder="form.branch_id ? 'Select source' : 'Select a branch first…'"
              :disabled="!form.branch_id"
            />
            <p v-if="form.branch_id && !contactSources.length && !loadingContactSources" class="text-xs text-amber-600 mt-1">
              No contact sources found for this branch.
            </p>
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

      <!-- Phones -->
      <div class="card p-5 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Phone Section</h2>
          <button type="button" @click="addPhone" class="btn-secondary btn-sm flex items-center gap-1">
            <PlusIcon class="w-3.5 h-3.5" /> Add Phone
          </button>
        </div>
        <div v-if="!form.phones.length" class="text-sm text-gray-400 text-center py-2">No phones added</div>
        <div v-for="(ph, i) in form.phones" :key="i" class="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <div class="flex-1"><input v-model="ph.phone" class="input bg-white" placeholder="Phone number" required /></div>
          <div class="w-28">
            <SearchableSelect v-model="ph.label" :options="labelOpts" value-key="id" label-key="name" placeholder="Label" :show-all="false" />
          </div>
          <label class="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
            <input type="checkbox" v-model="ph.is_primary" class="accent-primary" /> Primary
          </label>
          <button type="button" @click="form.phones.splice(i, 1)" class="btn-icon text-red-400">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/interesting-clients" class="btn-secondary">Cancel</RouterLink>
        <RequiredFieldsGuard
          :fields="{ Branch: form.branch_id, 'Full Name': form.full_name }"
          v-slot="{ isValid, missing }"
        >
          <button
            type="submit"
            class="btn-primary"
            :disabled="saving || !isValid"
            :title="!isValid ? `Missing: ${missing.join(', ')}` : ''"
          >
            {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
          </button>
        </RequiredFieldsGuard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useLookupStore } from '@/stores/lookup'
import { getIC, createIC, updateIC, previewICCode } from '@/api/interesting-clients'
import { getBranches } from '@/api/branches'
import { getContactSources } from '@/api/lookup'
import { useToast } from '@/composables/useToast'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import RequiredFieldsGuard from '@/components/ui/RequiredFieldsGuard.vue'
import { nowForDatePicker } from '@/utils/datetime'

const route = useRoute(); const router = useRouter()
const lookup = useLookupStore(); const { success, error } = useToast()
const isEdit = computed(() => !!route.params.id)
const saving     = ref(false)
const branches   = ref([])
const codePreview = ref('')
const loadingCode = ref(false)

const contactSources        = ref([])
const loadingContactSources = ref(false)

const enableOpts = [{ id: true, name: 'Yes' }, { id: false, name: 'No' }]
const labelOpts  = [
  { id: 'primary', name: 'Primary' }, { id: 'work', name: 'Work' },
  { id: 'mobile', name: 'Mobile' },   { id: 'home', name: 'Home' }
]

const form = ref({
  full_name: '', contact_source_id: null,
  date_joined: nowForDatePicker(), remark: '', is_active: true,
  branch_id: null, code: '',
  phones: []
})

async function loadContactSources(branchId = null) {
  if (!branchId) {
    contactSources.value = []
    return
  }
  loadingContactSources.value = true
  try {
    const res = await getContactSources({ branch_id: branchId })
    contactSources.value = res.data || []
    if (!isEdit.value && contactSources.value.length === 1) {
      form.value.contact_source_id = contactSources.value[0].id
    }
  } catch {} finally { loadingContactSources.value = false }
}

async function onBranchChange(id) {
  codePreview.value = ''
  if (!isEdit.value) form.value.contact_source_id = null
  if (!id) { contactSources.value = []; return }
  loadingCode.value = true
  try {
    const res = await previewICCode(id)
    codePreview.value = res.data?.code || ''
  } catch { codePreview.value = '' }
  finally { loadingCode.value = false }
  await loadContactSources(id)
}

function addPhone() {
  form.value.phones.push({ phone: '', label: 'primary', is_primary: form.value.phones.length === 0, is_active: true })
}

onMounted(async () => {
  await lookup.loadAll()
  const bRes = await getBranches({ show_all: false })
  branches.value = (bRes.data || []).map(b => ({ id: b.id, name: b.name, code: b.code, sub: b.code }))
  if (!isEdit.value && branches.value.length === 1) {
    form.value.branch_id = branches.value[0].id
  }

  if (isEdit.value) {
    try {
      const res = await getIC(route.params.id)
      const d   = res.data
      form.value.full_name         = d.full_name         || ''
      form.value.contact_source_id = d.contact_source_id || null
      form.value.date_joined       = d.date_joined ? d.date_joined.slice(0, 10) : ''
      form.value.remark            = d.remark            || ''
      form.value.is_active         = d.is_active         ?? true
      form.value.branch_id         = d.branch_id         || d.branch?.id || null
      form.value.code              = d.code              || ''
      form.value.phones            = d.phones            || []
      codePreview.value            = d.code              || ''
    } catch { error('Failed to load') }
  }

  // Load code preview + branch-scoped contact sources for whichever branch
  // ended up selected above (edit record's branch, or the create-mode
  // single-branch auto-select).
  if (form.value.branch_id) {
    loadingCode.value = true
    try {
      const res = await previewICCode(form.value.branch_id)
      if (!isEdit.value) codePreview.value = res.data?.code || ''
    } catch {} finally { loadingCode.value = false }
    await loadContactSources(form.value.branch_id)
  }
})

async function handleSubmit() {
  saving.value = true
  try {
    const payload = { ...form.value }
    // Don't send code on create — backend generates from branch sequence
    // On edit, don't change code unless user explicitly wants to
    if (!isEdit.value) delete payload.code
    if (!payload.date_joined) delete payload.date_joined
    if (isEdit.value) { await updateIC(route.params.id, payload); success('Updated successfully') }
    else              { await createIC(payload);                   success('Created successfully') }
    router.push('/interesting-clients')
  } catch (e) { error(e?.error || 'Save failed') } finally { saving.value = false }
}
</script>