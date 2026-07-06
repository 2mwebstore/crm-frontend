<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div><label class="label">Search</label><input v-model="filters.search" @input="debouncedLoad" type="text" class="input w-52" placeholder="Name, code…" /></div>
      <div>
        <label class="label">Date Range</label>
        <DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" />
      </div>
      <div class="w-40">
        <label class="label">Status</label>
        <SearchableSelect v-model="filters.is_converted" :options="[{id:'false',name:'Not converted'},{id:'true',name:'Converted'}]" value-key="id" label-key="name" placeholder="All Status" all-label="All Status" @update:modelValue="load" />
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
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-4"><p class="text-xs text-gray-500">Total</p><p class="text-2xl font-bold text-gray-800 mt-1">{{ summary.total }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Converted</p><p class="text-2xl font-bold text-teal-600 mt-1">{{ summary.converted }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Active</p><p class="text-2xl font-bold mt-1" style="color:#938af4">{{ summary.active }}</p></div>

    </div>

    <!-- Table -->
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
              <th class="table-header">Contact Source</th>
              <th class="table-header">Status</th>
              <th class="table-header">Join Date</th>
              <th class="table-header">Created By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="9" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="9" class="table-cell text-center py-10 text-gray-400">No records</td></tr>
            <tr v-else v-for="(row, i) in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ i + 1 }}</td>
              <td class="table-cell font-mono text-xs text-gray-500">{{ row.code }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell">
                <p class="font-medium text-gray-800 text-sm">{{ row.full_name }}</p>
                <p v-if="row.company_name" class="text-xs text-gray-400">{{ row.company_name }}</p>
              </td>
              <td class="table-cell text-sm text-gray-700">{{ primaryPhone(row) || '—' }}</td>
              <td class="table-cell"><span v-if="row.contact_source" class="badge bg-blue-50 text-blue-700">{{ row.contact_source.name }}</span><span v-else class="text-gray-400 text-xs">—</span></td>
              <td class="table-cell">
                <span :class="['badge', row.is_converted ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500']">{{ row.is_converted ? 'Converted' : 'Pending' }}</span>
              </td>
              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.date_joined) }}</td>
              <td class="table-cell text-sm text-gray-700">{{ row.created_by?.name || '—' }}</td>
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
import { getBranches } from '@/api/branches'
import { useLookupStore } from '@/stores/lookup'
import { getUsersInScope } from '@/api/users'
import { getICs } from '@/api/interesting-clients'

const items   = ref([])
const loading = ref(false)

function todayStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function todayEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }
const lookup = useLookupStore()
const showMoreFilters = ref(false)
const branches = ref([])
const users    = ref([])
const filters = ref({ date_from: todayStart(), date_to: todayEnd(), is_converted: null, branch_id: null, created_by_id: null, contact_source_id: null, search: '' })

const activeMoreFilters = computed(() => [filters.value.branch_id, filters.value.created_by_id, filters.value.contact_source_id].filter(Boolean).length)
const summary = computed(() => ({
  total:     items.value.length,
  converted: items.value.filter(i => i.is_converted).length,
  active:    items.value.filter(i => i.is_active).length,
}))

function primaryPhone(row) {
  if (!row.phones?.length) return null
  return (row.phones.find(p => p.is_primary) || row.phones[0])?.phone || null
}
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }

let debounceTimer = null
function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }

async function load() {
  loading.value = true
  try {
    const params = { page: 1, page_size: 500 }
    if (filters.value.is_converted !== null && filters.value.is_converted !== undefined && filters.value.is_converted !== '')
      params.is_converted = filters.value.is_converted
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.search)            params.search            = filters.value.search
    if (filters.value.branch_id)        params.branch_id        = filters.value.branch_id
    if (filters.value.created_by_id)    params.created_by_id    = filters.value.created_by_id
    if (filters.value.contact_source_id) params.contact_source_id = filters.value.contact_source_id
    const res = await getICs(params)
    items.value = res.data || []
  } catch {} finally { loading.value = false }
}

function resetFilters() { filters.value = { date_from:todayStart(), date_to:todayEnd(), is_converted:null, branch_id:null, created_by_id:null, contact_source_id:null, search:'' }; load() }

function exportCSV() {
  const headers = ['Code','Name','Company','Phone','Contact Source','Level','Priority','Score','Opportunity','Currency','Status','Created Date','Created By']
  const rows = items.value.map(r => [
    r.code, r.full_name, r.company_name||'', primaryPhone(r)||'',
    r.contact_source?.name||'', r.is_converted?'Converted':'Pending',
    fmtDate(r.created_at), r.created_by?.name||''
  ])
  downloadCSV('interesting_clients_report.csv', headers, rows)
}

function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = filename; a.click()
}

onMounted(async () => { load(); lookup.loadAll(); try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {} try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {} })
</script>