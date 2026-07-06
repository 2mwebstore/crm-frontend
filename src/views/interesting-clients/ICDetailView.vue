<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  <div v-else-if="ic" class="max-w-4xl mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/interesting-clients" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-gray-800">{{ ic.full_name }}</h1>
            <span :class="['badge', priorityColor(ic.priority)]">{{ ic.priority }}</span>
            <span :class="['badge', ic.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ ic.is_active ? 'Active' : 'Inactive' }}</span>
            <span v-if="ic.is_converted" class="badge bg-teal-100 text-teal-700">Converted</span>
          </div>
          <p class="text-sm text-gray-500 font-mono mt-0.5">{{ ic.code }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <RouterLink :to="`/interesting-clients/${ic.id}/edit`" class="btn-secondary btn-sm flex items-center gap-1">
          <PencilIcon class="w-4 h-4" /> Edit
        </RouterLink>
        <button v-if="!ic.is_converted" @click="doConvert" class="btn-primary btn-sm flex items-center gap-1">
          <ArrowRightCircleIcon class="w-4 h-4" /> Convert to Client
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Left col -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Basic info -->
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Basic Information</h2>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div><dt class="text-xs text-gray-400">Full Name</dt><dd class="font-medium text-gray-800">{{ ic.full_name }}</dd></div>
            <div><dt class="text-xs text-gray-400">Company</dt><dd class="text-gray-700">{{ ic.company_name || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Email</dt><dd class="text-gray-700">{{ ic.email || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Position</dt><dd class="text-gray-700">{{ ic.position || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Contact Source</dt><dd class="text-gray-700">{{ ic.contact_source?.name || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Level</dt><dd class="text-gray-700">{{ ic.level?.name || '—' }}</dd></div>
            <div><dt class="text-xs text-gray-400">Date Joined</dt><dd class="text-gray-700">{{ fmtDate(ic.date_joined) }}</dd></div>
            <div><dt class="text-xs text-gray-400">Next Follow Up</dt><dd class="text-gray-700">{{ fmtDate(ic.next_follow_up_at) }}</dd></div>
          </dl>
          <div v-if="ic.remark" class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-400 mb-1">Remark</p>
            <p class="text-sm text-gray-700">{{ ic.remark }}</p>
          </div>
        </div>

        <!-- Phones -->
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Phones</h2>
          <div v-if="!ic.phones?.length" class="text-sm text-gray-400 text-center py-4">No phones</div>
          <table v-else class="w-full text-sm">
            <thead><tr class="border-b border-gray-100"><th class="table-header">#</th><th class="table-header">Phone</th><th class="table-header">Label</th><th class="table-header">Primary</th><th class="table-header">Status</th></tr></thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(ph, i) in ic.phones" :key="ph.id">
                <td class="table-cell text-gray-400">{{ i + 1 }}</td>
                <td class="table-cell font-medium">{{ ph.phone }}</td>
                <td class="table-cell text-gray-500 capitalize">{{ ph.label }}</td>
                <td class="table-cell"><span :class="['badge text-xs', ph.is_primary ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500']">{{ ph.is_primary ? 'Yes' : 'No' }}</span></td>
                <td class="table-cell"><span :class="['badge text-xs', ph.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ ph.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Converted client -->
        <div v-if="ic.converted_client" class="card p-5 border-l-4" style="border-left-color:#938af4">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Converted Client</h2>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background:#938af4">
              {{ ic.converted_client.name?.charAt(0) }}
            </div>
            <div>
              <p class="font-medium text-gray-800">{{ ic.converted_client.name }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ ic.converted_client.code }}</p>
            </div>
            <RouterLink :to="`/clients/${ic.converted_client.id}`" class="ml-auto btn-secondary btn-sm">View Client</RouterLink>
          </div>
        </div>
      </div>

      <!-- Right col: scoring -->
      <div class="space-y-5">
        <div class="card p-5 space-y-4">
          <h2 class="text-sm font-semibold text-gray-700">Scoring</h2>
          <div>
            <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Interest Score</span><span class="font-semibold">{{ ic.interest_score }}/100</span></div>
            <div class="h-2 bg-gray-100 rounded-full"><div class="h-2 rounded-full" :style="{ width: ic.interest_score + '%', background: '#938af4' }" /></div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Opportunity</span><span class="font-semibold text-gray-800">{{ fmtCurrency(ic.opportunity_value, ic.currency) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Bonus</span><span class="text-green-600">+{{ fmtCurrency(ic.bonus_amount, ic.currency) }}</span></div>
            <div class="flex justify-between border-t border-gray-100 pt-2"><span class="text-gray-500 font-medium">Total</span><span class="font-bold" style="color:#938af4">{{ fmtCurrency(ic.total_value, ic.currency) }}</span></div>
            <div class="flex justify-between text-xs text-gray-400"><span>≈ USD</span><span>{{ fmtCurrency(ic.value_in_usd, 'USD') }}</span></div>
            <div class="flex justify-between text-xs text-gray-400"><span>≈ KHR</span><span>{{ Number(ic.value_in_khr || 0).toLocaleString() }} ៛</span></div>
          </div>
        </div>

        <div class="card p-5 space-y-2 text-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Meta</h2>
          <div class="flex justify-between"><span class="text-gray-500">Marked by</span><span>{{ ic.marked_by?.name || '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Created by</span><span>{{ ic.created_by?.name || '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Created</span><span>{{ fmtDate(ic.created_at) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Updated</span><span>{{ fmtDate(ic.updated_at) }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, PencilIcon, ArrowRightCircleIcon } from '@heroicons/vue/24/outline'
import { getIC, convertIC } from '@/api/interesting-clients'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success, error } = useToast()
const ic = ref(null)
const loading = ref(true)

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function fmtCurrency(val, cur) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(val || 0) }
function priorityColor(p) { return { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' }[p] || 'bg-gray-100 text-gray-600' }

async function doConvert() {
  if (!confirm('Convert this interesting client to a full client?')) return
  try { await convertIC(ic.value.id, {}); success('Converted!'); load() }
  catch (e) { error(e?.error || 'Failed') }
}

async function load() {
  loading.value = true
  try { const res = await getIC(route.params.id); ic.value = res.data }
  catch { error('Failed to load') }
  finally { loading.value = false }
}

onMounted(load)
</script>
