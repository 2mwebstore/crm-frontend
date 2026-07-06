<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">Loading…</div>
  <div v-else-if="withdrawal" class="max-w-3xl mx-auto space-y-5">

    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/withdrawals" class="btn-icon"><ArrowLeftIcon class="w-5 h-5" /></RouterLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-gray-800">Withdrawal</h1>
            <span class="badge bg-orange-100 text-orange-700 font-mono text-xs">{{ withdrawal.transaction_no }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-0.5">{{ fmtDate(withdrawal.date) }}</p>
        </div>
      </div>
      <RouterLink :to="`/withdrawals/${withdrawal.id}/edit`" class="btn-secondary btn-sm flex items-center gap-1">
        <PencilIcon class="w-4 h-4" /> Edit
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-5">
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Transaction Info</h2>
          <dl class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Client</dt>
              <dd class="font-medium text-gray-800">{{ withdrawal.client?.name || '—' }}</dd>
              <dd class="text-xs text-gray-400 font-mono">{{ withdrawal.client?.code }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Product</dt>
              <dd class="text-gray-700">{{ withdrawal.client_product?.product_type?.name || '—' }}</dd>
              <dd class="text-xs text-gray-400 font-mono">{{ withdrawal.client_product?.account_id }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Client Bank</dt>
              <dd class="text-gray-700">{{ withdrawal.client_bank?.bank_type?.name || '—' }}</dd>
              <dd class="text-xs text-gray-400 font-mono">{{ withdrawal.client_bank?.account_no }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Company Bank</dt>
              <dd class="text-gray-700">{{ withdrawal.company_bank?.name || '—' }}</dd>
              <dd class="text-xs text-gray-400 font-mono">{{ withdrawal.company_bank?.code }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Currency</dt>
              <dd class="text-gray-700 font-mono">{{ withdrawal.currency }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 mb-0.5">Bonus Option</dt>
              <dd class="text-gray-700">{{ withdrawal.bonus_option?.name || '—' }}</dd>
            </div>
          </dl>
          <div v-if="withdrawal.remark" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400 mb-1">Remark</p>
            <p class="text-sm text-gray-700">{{ withdrawal.remark }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="card p-5 space-y-3">
          <h2 class="text-sm font-semibold text-gray-700">Amounts</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Amount</span>
              <span class="font-semibold text-orange-600 text-base">-{{ fmtCurrency(withdrawal.amount, withdrawal.currency) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Bonus</span>
              <span class="text-green-600 font-medium">+{{ fmtCurrency(withdrawal.bonus_amount, withdrawal.currency) }}</span>
            </div>
            <div class="flex justify-between py-2 border-y border-gray-100">
              <span class="font-semibold text-gray-700">Bal (Balance)</span>
              <span class="font-bold text-base" :class="withdrawal.bal >= 0 ? 'text-gray-700' : 'text-red-600'">
                {{ fmtCurrency(withdrawal.bal, withdrawal.currency) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">TO (Turnover)</span>
              <span class="text-gray-700">{{ fmtCurrency(withdrawal.to, withdrawal.currency) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">OS (Outstanding)</span>
              <span :class="['font-semibold', withdrawal.os >= 0 ? 'text-blue-600' : 'text-red-600']">
                {{ fmtCurrency(withdrawal.os, withdrawal.currency) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Play</span>
              <span class="text-gray-700">{{ fmtCurrency(withdrawal.play, withdrawal.currency) }}</span>
            </div>
          </div>
        </div>

        <div class="card p-5 space-y-2 text-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Meta</h2>
          <div class="flex justify-between"><span class="text-gray-500">Created by</span><span>{{ withdrawal.created_by?.name || '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Created</span><span>{{ fmtDate(withdrawal.created_at) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Updated</span><span>{{ fmtDate(withdrawal.updated_at) }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { getWithdrawal } from '@/api/transactions'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { error } = useToast()
const withdrawal = ref(null)
const loading = ref(true)

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }
function fmtCurrency(val, cur) {
  if (cur === 'KHR') return Number(val || 0).toLocaleString() + ' ៛'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val || 0)
}

onMounted(async () => {
  try { const res = await getWithdrawal(route.params.id); withdrawal.value = res.data }
  catch { error('Failed to load withdrawal') }
  finally { loading.value = false }
})
</script>
