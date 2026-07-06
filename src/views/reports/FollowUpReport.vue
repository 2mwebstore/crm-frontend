<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-wrap gap-3 items-end">
      <div><label class="label">Date Range</label><DateRangePicker :model-value="[filters.date_from, filters.date_to]" @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; load() }" /></div>
      <!-- <div class="w-52"><label class="label">Client</label>
        <SearchableSelect v-model="filters.client_id" :options="clientOptions" placeholder="All clients" all-label="All clients" @update:modelValue="load" />
      </div> -->
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
      <div><label class="label text-xs">Client</label><SearchableSelect v-model="filters.client_id" :options="clientOptions" placeholder="All clients" @update:modelValue="load" /></div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-4"><p class="text-xs text-gray-500">Total Records</p><p class="text-2xl font-bold text-gray-800 mt-1">{{ items.length }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">With Interest</p><p class="text-2xl font-bold text-green-600 mt-1">{{ items.filter(i=>i.interest).length }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Account Given</p><p class="text-2xl font-bold mt-1" style="color:#938af4">{{ items.filter(i=>i.given_account).length }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">Bank Account</p><p class="text-2xl font-bold text-blue-600 mt-1">{{ items.filter(i=>i.bank_account).length }}</p></div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header">#</th>
              <th class="table-header">Created Date</th>
              <th class="table-header">Follow Up Date</th>
              <th class="table-header">Branch</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Client</th>
              <th class="table-header">Bonus Option</th>
              <th class="table-header">Interest</th>
              <th class="table-header">Given Account</th>
              <th class="table-header">Bank Account</th>
              <th class="table-header">Remark</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading"><td colspan="11" class="table-cell text-center py-10 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="11" class="table-cell text-center py-10 text-gray-400">No records</td></tr>
            <tr v-else v-for="(row,i) in items" :key="row.id" class="hover:bg-gray-50/60">
              <td class="table-cell text-gray-400 text-xs">{{ i+1 }}</td>
              <td class="table-cell text-sm whitespace-nowrap">{{ fmtDate(row.created_at) }}</td>
              <td class="table-cell text-sm whitespace-nowrap">{{ fmtDate(row.follow_up_at) }}</td>
              <td class="table-cell text-sm text-gray-600">{{ row.branch?.name || '—' }}</td>
              <td class="table-cell text-sm">{{ row.created_by?.name||'—' }}</td>
              <td class="table-cell">
                <p class="text-sm font-medium text-gray-800">{{ row.client?.name||'—' }}</p>
                <p class="text-xs text-gray-400 font-mono">{{ row.client?.code }}</p>
              </td>
              <td class="table-cell"><span v-if="row.bonus_option" class="badge bg-primary-100 text-primary-700">{{ row.bonus_option.name }}</span><span v-else class="text-gray-400 text-xs">—</span></td>
              <td class="table-cell"><span :class="['badge', row.interest?'bg-green-100 text-green-700':'bg-gray-100 text-gray-400']">{{ row.interest?'Yes':'No' }}</span></td>
              <td class="table-cell"><span :class="['badge', row.given_account?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-400']">{{ row.given_account?'Yes':'No' }}</span></td>
              <td class="table-cell"><span :class="['badge', row.bank_account?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-400']">{{ row.bank_account?'Yes':'No' }}</span></td>
              <td class="table-cell text-xs text-gray-600 max-w-40 truncate">{{ row.remark||'—' }}</td>
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
import { getFollowUps } from '@/api/follow-ups'
import { getBranches } from '@/api/branches'
import { getUsersInScope } from '@/api/users'
import { getClients } from '@/api/clients'

const items=ref([]); const loading=ref(false)
function todayStart() { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}` }
function todayEnd()   { const d = new Date(); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}` }
const showMoreFilters = ref(false)
const branches = ref([])
const users    = ref([])
const allClients=ref([])
const filters=ref({ date_from:todayStart(), date_to:todayEnd(), client_id:null, branch_id:null, created_by_id:null })
const activeMoreFilters = computed(() => [filters.value.branch_id, filters.value.created_by_id].filter(Boolean).length)
const clientOptions=computed(()=>allClients.value.map(c=>({id:c.id,name:c.name,sub:c.code})))

function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }

async function loadClients(){
  try{ const res=await getClients({page:1,page_size:500}); allClients.value=res.data||[] }catch{}
}

async function load(){
  loading.value=true
  try{
    const params={page:1,page_size:500,sort_by:'follow_up_at',sort_dir:'desc'}
    if(filters.value.date_from) params.date_from=filters.value.date_from
    if(filters.value.date_to)   params.date_to=filters.value.date_to
    if(filters.value.client_id)      params.client_id     =filters.value.client_id
    if(filters.value.branch_id)      params.branch_id     =filters.value.branch_id
    if(filters.value.created_by_id)  params.created_by_id =filters.value.created_by_id
    const res=await getFollowUps(params); items.value=res.data||[]
  }catch{}finally{loading.value=false}
}

function resetFilters(){filters.value={date_from:todayStart(),date_to:todayEnd(),client_id:null,branch_id:null,created_by_id:null};load()}

function exportCSV(){
  const headers=['#','Created Date','Follow Up Date','Created By','Client','Client Code','Bonus Option','Interest','Given Account','Bank Account','Remark']
  const rows=items.value.map((r,i)=>[
    i+1, fmtDate(r.created_at), fmtDate(r.follow_up_at), r.created_by?.name||'',
    r.client?.name||'', r.client?.code||'', r.bonus_option?.name||'',
    r.interest?'Yes':'No', r.given_account?'Yes':'No', r.bank_account?'Yes':'No', r.remark||''
  ])
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='follow_ups_report.csv';a.click()
}

onMounted(async ()=>{ loadClients(); load(); try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,sub:b.code})) } catch {} try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {} })
</script>
