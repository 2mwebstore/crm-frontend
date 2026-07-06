<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div><label class="label">Search</label><input v-model="filters.search" @input="load" type="text" class="input w-52" placeholder="Name, code…" /></div>
      <div><label class="label">Date Range</label><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <div class="w-40"><label class="label">Status</label>
        <SearchableSelect v-model="filters.is_active" :options="statusOpts" value-key="id" label-key="name" placeholder="All Status" all-label="All Status" @update:modelValue="load" />
      </div>
<button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-lg self-end flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" /> More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-lg self-end">Reset</button>
      <button @click="exportCSV" class="btn-primary btn-lg self-end flex items-center gap-1">
        <ArrowDownTrayIcon class="w-4 h-4" /> Export CSV
      </button>
    </div>
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 gap-3">
      <div><label class="label text-xs">Branch</label><SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Created By</label><SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Contact Source</label><SearchableSelect v-model="filters.contact_source_id" :options="lookup.contactSources" placeholder="All sources" @update:modelValue="load" /></div>
      <div><label class="label text-xs">Level</label><SearchableSelect v-model="filters.level_id" :options="lookup.levels" placeholder="All levels" @update:modelValue="load" /></div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-4"><p class="text-xs text-gray-500">Total Clients</p><p class="text-2xl font-bold text-gray-800 mt-1">{{ items.length }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Active</p><p class="text-2xl font-bold text-green-600 mt-1">{{ items.filter(c=>c.is_active).length }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Contact Source</p><p class="text-2xl font-bold text-blue-600 mt-1">{{ new Set(items.filter(i=>i.contact_source).map(i=>i.contact_source.id)).size }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Companies</p><p class="text-2xl font-bold text-gray-800 mt-1">{{ items.filter(c=>c.type==='company').length }}</p></div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Code</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Name</th>
              <th class="table-header">Phone</th>
              <th class="table-header">Account Id</th>
              <th class="table-header">Bank</th>
              <th class="table-header">Contact Source</th>
              <th class="table-header">Level</th>
              <th class="table-header">Status</th>
              <th class="table-header">Join Date</th>
              <th class="table-header">Created By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="14" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="14" class="table-cell text-center py-10 text-gray-400">No records</td></tr>
            <tr v-else v-for="(row, i) in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ i+1 }}</td>
              <td class="table-cell font-mono text-xs text-gray-500">{{ row.code }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell">
                <p class="font-medium text-gray-800 text-sm">{{ row.name }}</p>
              </td>
              <td class="table-cell text-sm text-gray-700">{{ primaryPhone(row)||'—' }}</td>
              <td class="table-cell font-mono text-xs text-gray-600">{{ firstAccountId(row)||'—' }}</td>
              <td class="table-cell text-sm text-gray-700">{{ firstBank(row)||'—' }}</td>
              <td class="table-cell"><span v-if="row.contact_source" class="badge bg-blue-50 text-blue-700">{{ row.contact_source.name }}</span><span v-else class="text-gray-400 text-xs">—</span></td>
              <td class="table-cell"><span v-if="row.level" class="badge text-white text-xs" :style="{background:row.level.color||'#938af4'}">{{ row.level.name }}</span><span v-else class="text-gray-400 text-xs">—</span></td>
              <td class="table-cell"><span :class="['badge', row.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500']">{{ row.is_active?'Yes':'No' }}</span></td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.date_joined) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.created_by?.name||'—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowDownTrayIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getClients } from '@/api/clients'
import { useLookupStore } from '@/stores/lookup'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'

const items = ref([]); const loading = ref(false)

function todayStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function todayEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }
const lookup = useLookupStore()
const showMoreFilters = ref(false)
const branches = ref([])
const users    = ref([])
const filters = ref({ is_active: null, branch_id: null, created_by_id: null, contact_source_id: null, level_id: null, search: '', date_from: todayStart(), date_to: todayEnd() })
const activeMoreFilters = computed(() => [filters.value.branch_id, filters.value.created_by_id, filters.value.contact_source_id, filters.value.level_id].filter(Boolean).length)
const statusOpts = [{id:'true',name:'Enable'},{id:'false',name:'Disable'}]

function primaryPhone(row) { return (row.phones?.find(p=>p.is_primary)||row.phones?.[0])?.phone||null }
function firstAccountId(row) { return (row.products?.find(p=>p.is_active&&p.account_id)||row.products?.[0])?.account_id||null }
function firstBank(row) { return (row.banks?.find(b=>b.is_active)||row.banks?.[0])?.bank_type?.name||null }
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
function statusColor(s) { return {lead:'bg-blue-100 text-blue-700',prospect:'bg-purple-100 text-purple-700',active:'bg-green-100 text-green-700',inactive:'bg-gray-100 text-gray-600',churned:'bg-red-100 text-red-700'}[s]||'bg-gray-100 text-gray-600' }

async function load() {
  loading.value = true
  try {
    const params = { page:1, page_size:500 }
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.search)    params.search    = filters.value.search
    if (filters.value.is_active !== null && filters.value.is_active !== '') params.is_active = filters.value.is_active
    if (filters.value.branch_id)        params.branch_id        = filters.value.branch_id
    if (filters.value.created_by_id)    params.created_by_id    = filters.value.created_by_id
    if (filters.value.contact_source_id) params.contact_source_id = filters.value.contact_source_id
    if (filters.value.level_id)          params.level_id          = filters.value.level_id
    const res = await getClients(params)
    items.value = res.data || []
  } catch {} finally { loading.value = false }
}

function resetFilters() { filters.value = { is_active:null, branch_id:null, created_by_id:null, contact_source_id:null, level_id:null, search:'', date_from:todayStart(), date_to:todayEnd() }; load() }

function exportCSV() {
  const headers = ['Code','Name','Phone','Account Id','Bank','Contact Source','Level','Status','Created Date','Created By']
  const rows = items.value.map(r => [
    r.code, r.name, primaryPhone(r)||'', firstAccountId(r)||'', firstBank(r)||'',
    r.contact_source?.name||'', r.level?.name||'',
    r.is_active?'Enable':'Disable', fmtDate(r.created_at), r.created_by?.name||''
  ])
  const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='clients_report.csv'; a.click()
}

onMounted(async () => { load(); lookup.loadAll(); try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {} try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {} })
</script>