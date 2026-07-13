<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Daily Start Balance</h1>
        <p class="text-sm text-gray-500 mt-0.5">Record each shift's opening + closing cash/credit totals, and track income during that shift</p>
      </div>
      <div v-if="branchOptions.length > 1" class="w-56">
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="branchId" :options="branchOptions" placeholder="Select a branch" @update:modelValue="onBranchChange" />
      </div>
    </div>

    <div v-if="!branchId" class="card p-8 text-center text-gray-400">
      No branch available to manage.
    </div>

    <template v-else>
      <!-- Today card -->
      <div class="card p-5">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Company Bank Cash</p>
            <p class="text-lg font-bold text-gray-800 mt-1">{{ usd(today?.current_cash?.usd) }}</p>
            <p class="text-lg font-bold text-purple-600">{{ khr(today?.current_cash?.khr) }}</p>
            <button v-if="today?.company_banks?.length" @click="showBankDetail = !showBankDetail" class="text-xs font-medium mt-1" style="color:#938af4">
              {{ showBankDetail ? 'Hide' : 'View' }} details ({{ today.company_banks.length }})
            </button>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Product Credit</p>
            <p class="text-lg font-bold text-gray-800 mt-1">{{ usd(today?.current_credit?.usd) }}</p>
            <p class="text-lg font-bold text-purple-600">{{ khr(today?.current_credit?.khr) }}</p>
            <button v-if="today?.product_types?.length" @click="showProductDetail = !showProductDetail" class="text-xs font-medium mt-1" style="color:#938af4">
              {{ showProductDetail ? 'Hide' : 'View' }} details ({{ today.product_types.length }})
            </button>
          </div>
          <div v-if="today?.snapshot">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Top-Ups (This Shift)</p>

            <p class="text-xs text-gray-500 mt-1.5">Company Bank</p>
            <p class="text-sm font-bold text-emerald-600">{{ usd(shiftLedgerByEntity.company_bank.depUsd) }}</p>
            <p class="text-sm font-bold text-emerald-600">{{ khr(shiftLedgerByEntity.company_bank.depKhr) }}</p>
            <p class="text-xs text-gray-400">{{ shiftLedgerByEntity.company_bank.depCount }} top-up{{ shiftLedgerByEntity.company_bank.depCount === 1 ? '' : 's' }}</p>

            <p class="text-xs text-gray-500 mt-2">Product Type</p>
            <p class="text-sm font-bold text-emerald-600">{{ usd(shiftLedgerByEntity.product_type.depUsd) }}</p>
            <p class="text-sm font-bold text-emerald-600">{{ khr(shiftLedgerByEntity.product_type.depKhr) }}</p>
            <p class="text-xs text-gray-400">{{ shiftLedgerByEntity.product_type.depCount }} top-up{{ shiftLedgerByEntity.product_type.depCount === 1 ? '' : 's' }}</p>
          </div>
          <div v-if="today?.snapshot">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Withdrawals (This Shift)</p>

            <p class="text-xs text-gray-500 mt-1.5">Company Bank</p>
            <p class="text-sm font-bold text-orange-600">{{ usd(shiftLedgerByEntity.company_bank.witUsd) }}</p>
            <p class="text-sm font-bold text-orange-600">{{ khr(shiftLedgerByEntity.company_bank.witKhr) }}</p>
            <p class="text-xs text-gray-400">{{ shiftLedgerByEntity.company_bank.witCount }} withdrawal{{ shiftLedgerByEntity.company_bank.witCount === 1 ? '' : 's' }}</p>

            <p class="text-xs text-gray-500 mt-2">Product Type</p>
            <p class="text-sm font-bold text-orange-600">{{ usd(shiftLedgerByEntity.product_type.witUsd) }}</p>
            <p class="text-sm font-bold text-orange-600">{{ khr(shiftLedgerByEntity.product_type.witKhr) }}</p>
            <p class="text-xs text-gray-400">{{ shiftLedgerByEntity.product_type.witCount }} withdrawal{{ shiftLedgerByEntity.product_type.witCount === 1 ? '' : 's' }}</p>
          </div>
          <div v-if="today?.snapshot">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Income So Far (Cash)</p>
            <p class="text-lg font-bold mt-1" :class="incomeColor(today.income_cash?.usd)">{{ signedUsd(today.income_cash?.usd) }}</p>
            <p class="text-lg font-bold" :class="incomeColor(today.income_cash?.khr)">{{ signedKhr(today.income_cash?.khr) }}</p>
            <button v-if="bankIncomeDetail.length" @click="showBankIncomeDetail = !showBankIncomeDetail" class="text-xs font-medium mt-1" style="color:#938af4">
              {{ showBankIncomeDetail ? 'Hide' : 'View' }} details ({{ bankIncomeDetail.length }})
            </button>
          </div>
          <div v-if="today?.snapshot">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Income So Far (Credit)</p>
            <p class="text-lg font-bold mt-1" :class="incomeColor(today.income_credit?.usd)">{{ signedUsd(today.income_credit?.usd) }}</p>
            <p class="text-lg font-bold" :class="incomeColor(today.income_credit?.khr)">{{ signedKhr(today.income_credit?.khr) }}</p>
            <button v-if="productIncomeDetail.length" @click="showProductIncomeDetail = !showProductIncomeDetail" class="text-xs font-medium mt-1" style="color:#938af4">
              {{ showProductIncomeDetail ? 'Hide' : 'View' }} details ({{ productIncomeDetail.length }})
            </button>
          </div>
        </div>

        <!-- Income breakdown: Cash (per Company Bank) -->
        <div v-if="showBankIncomeDetail && bankIncomeDetail.length" class="mt-4 border border-gray-100 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header">Account</th>
                <th class="table-header">Currency</th>
                <th class="table-header text-right">Opening</th>
                <th class="table-header text-right">Current</th>
                <th class="table-header text-right">Income</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="b in bankIncomeDetail" :key="b.id">
                <td class="table-cell text-gray-800">{{ b.account_name }} <span class="text-gray-400 font-mono text-xs">{{ b.account_number }}</span></td>
                <td class="table-cell font-mono text-xs text-gray-500">{{ b.currency || 'USD' }}</td>
                <td class="table-cell text-right font-mono">{{ fmtAmt(b.open_amount, b.currency) }}</td>
                <td class="table-cell text-right font-mono">{{ fmtAmt(b.cash, b.currency) }}</td>
                <td class="table-cell text-right font-mono" :class="incomeColor(b.income)">{{ fmtSignedAmt(b.income, b.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Income breakdown: Credit (per Product Type) -->
        <div v-if="showProductIncomeDetail && productIncomeDetail.length" class="mt-4 border border-gray-100 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header">Product</th>
                <th class="table-header">Currency</th>
                <th class="table-header text-right">Opening</th>
                <th class="table-header text-right">Current</th>
                <th class="table-header text-right">Income</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in productIncomeDetail" :key="p.id">
                <td class="table-cell text-gray-800">{{ p.name }}</td>
                <td class="table-cell font-mono text-xs text-gray-500">{{ p.currency || 'USD' }}</td>
                <td class="table-cell text-right font-mono">{{ fmtAmt(p.open_amount, p.currency) }}</td>
                <td class="table-cell text-right font-mono">{{ fmtAmt(p.credit, p.currency) }}</td>
                <td class="table-cell text-right font-mono" :class="incomeColor(p.income)">{{ fmtSignedAmt(p.income, p.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Company Bank breakdown -->
        <div v-if="showBankDetail && today?.company_banks?.length" class="mt-4 border border-gray-100 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header">Account</th>
                <th class="table-header">Bank</th>
                <th class="table-header">Currency</th>
                <th class="table-header text-right">Cash</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="b in today.company_banks" :key="b.id">
                <td class="table-cell text-gray-800">{{ b.account_name }} <span class="text-gray-400 font-mono text-xs">{{ b.account_number }}</span></td>
                <td class="table-cell text-gray-600">{{ b.bank_type_name || '—' }}</td>
                <td class="table-cell font-mono text-xs text-gray-500">{{ b.currency || 'USD' }}</td>
                <td class="table-cell text-right font-mono">{{ b.currency === 'KHR' ? khr(b.cash) : usd(b.cash) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Product Type breakdown -->
        <div v-if="showProductDetail && today?.product_types?.length" class="mt-4 border border-gray-100 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header">Product</th>
                <th class="table-header">Code</th>
                <th class="table-header">Currency</th>
                <th class="table-header text-right">Credit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in today.product_types" :key="p.id">
                <td class="table-cell text-gray-800">{{ p.name }}</td>
                <td class="table-cell text-gray-600 font-mono text-xs">{{ p.code || '—' }}</td>
                <td class="table-cell font-mono text-xs text-gray-500">{{ p.currency || 'USD' }}</td>
                <td class="table-cell text-right font-mono">{{ p.currency === 'KHR' ? khr(p.credit) : usd(p.credit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Current shift summary -->
        <div class="mt-5 pt-4 border-t border-gray-100">
          <div v-if="today?.snapshot" class="text-sm text-gray-500">
            <p class="font-medium text-gray-700 mb-1">Current Shift — Opened</p>
            {{ fmtTime(today.snapshot.created_at) }} by <span class="font-medium text-gray-700">{{ today.snapshot.created_by?.name || '—' }}</span>
            <br />opening cash <span class="font-mono">{{ usd(today.snapshot.cash_usd) }} / {{ khr(today.snapshot.cash_khr) }}</span>
            <br />opening credit <span class="font-mono">{{ usd(today.snapshot.credit_usd) }} / {{ khr(today.snapshot.credit_khr) }}</span>
          </div>
          <div v-else class="text-sm text-gray-400">
            No shift is currently open for this branch. Past shifts (including their closing totals) are in History below.
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-3">
          <button
            v-if="canStartShift"
            @click="doStart"
            class="btn-primary flex items-center gap-2"
            :disabled="starting || !!today?.snapshot"
          >
            <PlayIcon class="w-4 h-4" />
            {{ starting ? 'Starting…' : (today?.snapshot ? 'Shift In Progress' : 'Start Shift') }}
          </button>
          <button
            v-if="canCloseShift"
            @click="doClose"
            class="btn-secondary flex items-center gap-2"
            :disabled="closing || !today?.snapshot"
          >
            <StopIcon class="w-4 h-4" />
            {{ closing ? 'Closing…' : (today?.snapshot ? 'Close Shift' : 'No Shift Open') }}
          </button>
        </div>
      </div>

      <!-- History -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">History</h2>
          <p class="text-xs text-gray-400">Totals row reflects this page only</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="table-header"></th>
                <th class="table-header">Start Date</th>
                <th class="table-header">Close Date</th>
                <th class="table-header text-right" colspan="2">Opening Cash</th>
                <th class="table-header text-right" colspan="2">Opening Credit</th>
                <th class="table-header text-right" colspan="2">Closing Cash</th>
                <th class="table-header text-right" colspan="2">Closing Credit</th>
                <th class="table-header text-right" colspan="2">Income Cash</th>
                <th class="table-header text-right" colspan="2">Income Credit</th>
                <th class="table-header">Started By</th>
                <th class="table-header">Closed By</th>
              </tr>
              <tr>
                <th class="table-header"></th>
                <th class="table-header"></th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header text-right">USD</th>
                <th class="table-header text-right">KHR</th>
                <th class="table-header"></th>
                <th class="table-header"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="loadingHistory">
                <td colspan="16" class="table-cell text-center py-10 text-gray-400">Loading…</td>
              </tr>
              <tr v-else-if="!history.length">
                <td colspan="16" class="table-cell text-center py-10 text-gray-400">No history yet</td>
              </tr>
              <template v-else v-for="row in history" :key="row.id">
                <tr class="hover:bg-gray-50/60">
                  <td class="table-cell">
                    <button @click="toggleRow(row.id)" class="btn-icon">
                      <ChevronRightIcon class="w-4 h-4 transition-transform" :class="{ 'rotate-90': expandedRows.has(row.id) }" />
                    </button>
                  </td>
                  <td class="table-cell font-medium text-gray-800 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <button
                        @click="downloadShiftImage(row)"
                        class="btn-icon bg-gray-100 flex-shrink-0"
                        title="Download this shift as an image"
                        :disabled="downloadingId === row.id"
                      >
                        <svg v-if="downloadingId === row.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <CameraIcon v-else class="w-4 h-4" />
                      </button>
                      <span>{{ fmtTime(row.created_at) }}</span>
                    </div>
                  </td>
                  <td class="table-cell font-medium text-gray-800 whitespace-nowrap">{{ fmtTime(row.closed_at) }}</td>
                  <td class="table-cell text-right font-mono">{{ usd(row.cash_usd) }}</td>
                  <td class="table-cell text-right font-mono">{{ khr(row.cash_khr) }}</td>
                  <td class="table-cell text-right font-mono">{{ usd(row.credit_usd) }}</td>
                  <td class="table-cell text-right font-mono">{{ khr(row.credit_khr) }}</td>
                  <td class="table-cell text-right font-mono">{{ row.closed_at ? usd(row.close_cash_usd) : '—' }}</td>
                  <td class="table-cell text-right font-mono">{{ row.closed_at ? khr(row.close_cash_khr) : '—' }}</td>
                  <td class="table-cell text-right font-mono">{{ row.closed_at ? usd(row.close_credit_usd) : '—' }}</td>
                  <td class="table-cell text-right font-mono">{{ row.closed_at ? khr(row.close_credit_khr) : '—' }}</td>
                  <td class="table-cell text-right font-mono" :class="row.closed_at ? incomeColor(row.close_cash_usd - row.cash_usd) : ''">{{ row.closed_at ? signedUsd(row.close_cash_usd - row.cash_usd) : '—' }}</td>
                  <td class="table-cell text-right font-mono" :class="row.closed_at ? incomeColor(row.close_cash_khr - row.cash_khr) : ''">{{ row.closed_at ? signedKhr(row.close_cash_khr - row.cash_khr) : '—' }}</td>
                  <td class="table-cell text-right font-mono" :class="row.closed_at ? incomeColor(row.close_credit_usd - row.credit_usd) : ''">{{ row.closed_at ? signedUsd(row.close_credit_usd - row.credit_usd) : '—' }}</td>
                  <td class="table-cell text-right font-mono" :class="row.closed_at ? incomeColor(row.close_credit_khr - row.credit_khr) : ''">{{ row.closed_at ? signedKhr(row.close_credit_khr - row.credit_khr) : '—' }}</td>
                  <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ row.created_by?.name || '—' }}</td>
                  <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ row.closed_by?.name || '—' }}</td>
                </tr>
                <tr v-if="expandedRows.has(row.id)" class="bg-gray-50/60">
                  <td></td>
                  <td colspan="15" class="px-4 pb-3">
                    <!-- This wrapper (rounded, overflow-hidden, white bg) is exactly
                         what downloadShiftImage() captures — kept as one clean,
                         self-contained "receipt" element so the exported PNG has
                         no clipped edges or transparent gaps around it. -->
                    <div
                      :ref="el => setDetailRef(row.id, el)"
                      class="rounded-xl overflow-hidden bg-white border border-gray-100 p-4"
                    >
                      <div class="flex items-center justify-between mb-3">
                        <div>
                          <p class="text-sm font-semibold text-gray-800">Shift — {{ fmtTime(row.created_at) }}</p>
                          <p class="text-xs text-gray-500 mt-0.5">
                            Opened by {{ row.created_by?.name || '—' }}
                            <span v-if="row.closed_at"> · Closed {{ fmtTime(row.closed_at) }} by {{ row.closed_by?.name || '—' }}</span>
                            <span v-else> · Still open</span>
                          </p>
                        </div>
                        <span v-if="shiftLedgerLoading === row.id" class="text-xs text-gray-400">Loading…</span>
                      </div>

                      <!-- Same data as the main table row (Opening/Closing
                           Cash/Credit, Income, Started/Closed By) — included
                           here so the downloaded image is a complete receipt
                           on its own, not missing what the row itself shows. -->
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-gray-50 rounded-lg p-3">
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Opening Cash</p>
                          <p class="text-sm font-mono text-gray-800">{{ usd(row.cash_usd) }} / {{ khr(row.cash_khr) }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Opening Credit</p>
                          <p class="text-sm font-mono text-gray-800">{{ usd(row.credit_usd) }} / {{ khr(row.credit_khr) }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Closing Cash</p>
                          <p class="text-sm font-mono text-gray-800">{{ row.closed_at ? `${usd(row.close_cash_usd)} / ${khr(row.close_cash_khr)}` : '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Closing Credit</p>
                          <p class="text-sm font-mono text-gray-800">{{ row.closed_at ? `${usd(row.close_credit_usd)} / ${khr(row.close_credit_khr)}` : '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Income Cash</p>
                          <p
                            class="text-sm font-mono"
                            :class="row.closed_at ? incomeColor(row.close_cash_usd - row.cash_usd) : 'text-gray-800'"
                          >{{ row.closed_at ? `${signedUsd(row.close_cash_usd - row.cash_usd)} / ${signedKhr(row.close_cash_khr - row.cash_khr)}` : '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Income Credit</p>
                          <p
                            class="text-sm font-mono"
                            :class="row.closed_at ? incomeColor(row.close_credit_usd - row.credit_usd) : 'text-gray-800'"
                          >{{ row.closed_at ? `${signedUsd(row.close_credit_usd - row.credit_usd)} / ${signedKhr(row.close_credit_khr - row.credit_khr)}` : '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Started By</p>
                          <p class="text-sm text-gray-800">{{ row.created_by?.name || '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Closed By</p>
                          <p class="text-sm text-gray-800">{{ row.closed_by?.name || '—' }}</p>
                        </div>
                      </div>
                      <table v-if="shiftLedgerRows(row).length" class="w-full text-xs border border-gray-200 rounded overflow-hidden bg-white">
                        <thead class="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th class="table-header">Type</th>
                            <th class="table-header">Label</th>
                            <th class="table-header">Currency</th>
                            <th class="table-header text-right">Opening (01)</th>
                            <th class="table-header text-right">Dep (02a)</th>
                            <th class="table-header text-right">Wit (02b)</th>
                            <th class="table-header text-right">Txn Principal (03a)</th>
                            <th class="table-header text-right">Txn Bonus (03b)</th>
                            <th class="table-header text-right">Adj + (03c)</th>
                            <th class="table-header text-right">Adj − (03d)</th>
                            <th class="table-header text-right">Closing (04)</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                          <tr v-for="r in shiftLedgerRows(row)" :key="r.key">
                            <td class="table-cell text-gray-700">{{ r.type }}</td>
                            <td class="table-cell text-gray-800">{{ r.label }}</td>
                            <td class="table-cell font-mono text-gray-500">{{ r.currency }}</td>
                            <td class="table-cell text-right font-mono">{{ fmtAmt(r.opening, r.currency) }}</td>
                            <td class="table-cell text-right font-mono text-emerald-600">{{ r.dep > 0 ? '+' + fmtAmt(r.dep, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono text-orange-600">{{ r.wit > 0 ? '-' + fmtAmt(r.wit, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono" :class="incomeColor(r.transactionPrincipal)">{{ r.transactionPrincipal !== 0 ? fmtSignedAmt(r.transactionPrincipal, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono" :class="incomeColor(r.transactionBonus)">{{ r.transactionBonus !== 0 ? fmtSignedAmt(r.transactionBonus, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono text-emerald-600">{{ r.adjAdd > 0 ? '+' + fmtAmt(r.adjAdd, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono text-orange-600">{{ r.adjSub > 0 ? '-' + fmtAmt(r.adjSub, r.currency) : '—' }}</td>
                            <td class="table-cell text-right font-mono font-semibold">{{ fmtAmt(r.closing, r.currency) }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p v-else-if="shiftLedgerLoading !== row.id" class="text-xs text-gray-400">No ledger entries for this shift.</p>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot v-if="history.length" class="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <tr>
                <td></td>
                <td class="table-cell text-gray-700">Total</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td class="table-cell text-right font-mono" :class="incomeColor(historyTotals.incomeCashUsd)">{{ signedUsd(historyTotals.incomeCashUsd) }}</td>
                <td class="table-cell text-right font-mono" :class="incomeColor(historyTotals.incomeCashKhr)">{{ signedKhr(historyTotals.incomeCashKhr) }}</td>
                <td class="table-cell text-right font-mono" :class="incomeColor(historyTotals.incomeCreditUsd)">{{ signedUsd(historyTotals.incomeCreditUsd) }}</td>
                <td class="table-cell text-right font-mono" :class="incomeColor(historyTotals.incomeCreditKhr)">{{ signedKhr(historyTotals.incomeCreditKhr) }}</td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="meta && meta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, meta.total) }} of {{ meta.total }}</span>
          <div class="flex items-center gap-1">
            <button :disabled="page <= 1" @click="goPage(page - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
            <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ page }} / {{ totalPages }}</span>
            <button :disabled="page >= totalPages" @click="goPage(page + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { PlayIcon, StopIcon, ChevronLeftIcon, ChevronRightIcon, CameraIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { startTodayBalance, closeTodayBalance, getTodayBalance, getBalanceHistory, getShiftBalanceTransactions } from '@/api/daily-balances'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const canStartShift = computed(() => auth.isSuperAdmin || auth.can('daily_balance.start'))
const canCloseShift = computed(() => auth.isSuperAdmin || auth.can('daily_balance.close'))
const { success, error } = useToast()

// Branch selection — non-SA users pick from their own assigned branches
// (already loaded on auth.user.branches at login); a Super Admin has no
// fixed branch assignment, so their options come from the full branch list.
const branchOptions = ref([])
const branchId = ref(null)

const today = ref(null)
const starting = ref(false)
const closing = ref(false)
const showBankDetail = ref(false)
const showProductDetail = ref(false)
const showBankIncomeDetail = ref(false)
const showProductIncomeDetail = ref(false)

// Resolves a BalanceTransaction row's entity name/currency by cross-
// referencing the already-loaded today.company_banks/today.product_types
// lists — the ledger row itself only stores a raw entity_id, no label.
// Falls back gracefully if the account has since been deactivated/removed
// from the live list (won't be found there anymore).
function findEntity(bt) {
  if (!today.value) return null
  const list = bt.entity_type === 'product_type' ? today.value.product_types : today.value.company_banks
  return (list || []).find(e => e.id === bt.entity_id) || null
}
function entityCurrency(bt) {
  const e = findEntity(bt)
  return e?.currency || 'USD'
}

// Everything in this feature is derived from the balance_transactions
// LEDGER only — never from Deposit/Withdrawal records directly. Each row's
// explicit `source` field (not remark-matching) says whether it came from
// a client Deposit/Withdrawal ("transaction"), a direct admin action
// ("configuration"), or a manual correction ("adjustment").

// Builds the full pivoted ledger table for ONE shift — one row per entity
// (Company Bank account / Product), using that shift's own persisted
// opening detail (row.details, phase='open') plus whatever ledger entries
// have been loaded for it (shiftLedgers[row.id]).
//
// Dep and Wit are each scoped to source='configuration' only (direct admin
// Top Up / Withdraw on the entity) and kept as two SEPARATE totals rather
// than netted into one figure — Dep is the sum of configuration top-ups,
// Wit is the sum of configuration withdrawals. Transaction and Adjustment
// are each their own separate netted total too (source='transaction' — a
// client Deposit/Withdrawal side effect — and source='adjustment' — a
// manual correction — respectively), rather than blended together as one
// "Using in Shift" figure. Closing = Opening + Dep - Wit + Transaction +
// Adjustment.
// Dep and Wit are each scoped to source='configuration' only (direct admin
// Top Up / Withdraw on the entity) and kept as two SEPARATE totals rather
// than netted into one figure — Dep is the sum of configuration top-ups,
// Wit is the sum of configuration withdrawals. Adjustment gets the same
// treatment — AdjAdd/AdjSub kept separate rather than netted — since
// seeing "added 50, subtracted 30" is more useful for an audit than just
// "+20". Transaction (source='transaction', a client Deposit/Withdrawal
// side effect) is split into its own principal vs bonus using each ledger
// row's bonus_amount field, so it's visible how much of a deposit's credit
// effect was the client's real money vs a promotional bonus. Closing =
// Opening + Dep - Wit + TransactionPrincipal + TransactionBonus + AdjAdd -
// AdjSub.
function shiftLedgerRows(row) {
  const openingByKey = {}
  const labelByKey = {}
  const currencyByKey = {}
  const typeByKey = {}
  for (const d of row.details || []) {
    if (d.phase !== 'open') continue
    const key = `${d.entity_type}-${d.entity_id}`
    openingByKey[key] = d.amount
    labelByKey[key] = d.label
    currencyByKey[key] = d.currency
    typeByKey[key] = d.entity_type === 'product_type' ? 'Product' : 'Company Bank'
  }

  const depByKey = {}
  const witByKey = {}
  const transactionPrincipalByKey = {}
  const transactionBonusByKey = {}
  const adjAddByKey = {}
  const adjSubByKey = {}
  for (const bt of shiftLedgers.value[row.id] || []) {
    const key = `${bt.entity_type}-${bt.entity_id}`
    if (!(key in labelByKey)) {
      labelByKey[key] = `#${bt.entity_id}`
      typeByKey[key] = bt.entity_type === 'product_type' ? 'Product' : 'Company Bank'
      currencyByKey[key] = currencyByKey[key] || 'USD'
    }
    const amt = Number(bt.amount || 0)
    if (bt.source === 'configuration') {
      if (bt.type === 'withdrawal') witByKey[key] = (witByKey[key] || 0) + amt
      else depByKey[key] = (depByKey[key] || 0) + amt
    } else if (bt.source === 'adjustment') {
      if (bt.type === 'withdrawal') adjSubByKey[key] = (adjSubByKey[key] || 0) + amt
      else adjAddByKey[key] = (adjAddByKey[key] || 0) + amt
    } else {
      // source === 'transaction' (a client Deposit/Withdrawal side effect)
      // — also the fallback for any unrecognized/legacy source value.
      // bonus_amount (0 for anything that isn't a Deposit's credit effect)
      // is split out of amount into its own bucket — the remainder is the
      // client's actual principal.
      const bonus = Number(bt.bonus_amount || 0)
      const principal = amt - bonus
      const sign = bt.type === 'withdrawal' ? -1 : 1
      transactionPrincipalByKey[key] = (transactionPrincipalByKey[key] || 0) + sign * principal
      transactionBonusByKey[key] = (transactionBonusByKey[key] || 0) + sign * bonus
    }
  }

  return Object.keys(labelByKey).map(key => {
    const opening = openingByKey[key] ?? 0
    const dep = depByKey[key] || 0
    const wit = witByKey[key] || 0
    const transactionPrincipal = transactionPrincipalByKey[key] || 0
    const transactionBonus = transactionBonusByKey[key] || 0
    const adjAdd = adjAddByKey[key] || 0
    const adjSub = adjSubByKey[key] || 0
    return {
      key,
      type: typeByKey[key],
      label: labelByKey[key],
      currency: currencyByKey[key] || 'USD',
      opening, dep, wit, transactionPrincipal, transactionBonus, adjAdd, adjSub,
      closing: opening + dep - wit + transactionPrincipal + transactionBonus + adjAdd - adjSub,
    }
  })
}


// Quick-glance breakdown for the "Top-Ups / Withdrawals" stat card —
// mirrors shiftLedgerRows' split (Dep/Wit scoped to source='configuration')
// but rolled up per ENTITY TYPE (Company Bank vs Product Type) instead of
// per individual entity, since this card is a summary, not the full
// ledger. Transaction/Adjustment activity is tracked here too (for
// potential future display) but not currently shown in the stat card
// itself, which only surfaces Dep/Wit.
function emptyLedgerBucket() {
  return {
    depCount: 0, witCount: 0, depUsd: 0, depKhr: 0, witUsd: 0, witKhr: 0,
    transactionCount: 0, transactionUsd: 0, transactionKhr: 0,
    adjustmentCount: 0, adjustmentUsd: 0, adjustmentKhr: 0,
    netUsd: 0, netKhr: 0,
  }
}
const shiftLedgerByEntity = computed(() => {
  const result = { company_bank: emptyLedgerBucket(), product_type: emptyLedgerBucket() }
  for (const bt of today.value?.balance_transactions || []) {
    const bucket = bt.entity_type === 'product_type' ? result.product_type : result.company_bank
    const cur = entityCurrency(bt)
    const amt = Number(bt.amount || 0)
    if (bt.source === 'configuration') {
      if (bt.type === 'withdrawal') {
        bucket.witCount++
        if (cur === 'KHR') bucket.witKhr += amt
        else bucket.witUsd += amt
      } else {
        bucket.depCount++
        if (cur === 'KHR') bucket.depKhr += amt
        else bucket.depUsd += amt
      }
    } else if (bt.source === 'adjustment') {
      bucket.adjustmentCount++
      const delta = bt.type === 'withdrawal' ? -amt : amt
      if (cur === 'KHR') bucket.adjustmentKhr += delta
      else bucket.adjustmentUsd += delta
    } else {
      bucket.transactionCount++
      const delta = bt.type === 'withdrawal' ? -amt : amt
      if (cur === 'KHR') bucket.transactionKhr += delta
      else bucket.transactionUsd += delta
    }
  }
  for (const bucket of Object.values(result)) {
    bucket.netUsd = bucket.depUsd - bucket.witUsd + bucket.transactionUsd + bucket.adjustmentUsd
    bucket.netKhr = bucket.depKhr - bucket.witKhr + bucket.transactionKhr + bucket.adjustmentKhr
  }
  return result
})

// Matches each currently-open shift's "open" phase detail rows (stored on
// today.snapshot.details) against the live current company_banks/
// product_types by entity ID, so we can show income (current - opening)
// per individual bank/product — not just the two blended totals.
const bankIncomeDetail = computed(() => {
  if (!today.value?.snapshot || !today.value?.company_banks?.length) return []
  const openMap = {}
  ;(today.value.snapshot.details || [])
    .filter(d => d.entity_type === 'company_bank' && d.phase === 'open')
    .forEach(d => { openMap[d.entity_id] = d.amount })
  return today.value.company_banks.map(b => {
    const openAmount = openMap[b.id] ?? 0
    return { ...b, open_amount: openAmount, income: b.cash - openAmount }
  })
})
const productIncomeDetail = computed(() => {
  if (!today.value?.snapshot || !today.value?.product_types?.length) return []
  const openMap = {}
  ;(today.value.snapshot.details || [])
    .filter(d => d.entity_type === 'product_type' && d.phase === 'open')
    .forEach(d => { openMap[d.entity_id] = d.amount })
  return today.value.product_types.map(p => {
    const openAmount = openMap[p.id] ?? 0
    return { ...p, open_amount: openAmount, income: p.credit - openAmount }
  })
})

function fmtAmt(v, currency) { return currency === 'KHR' ? khr(v) : usd(v) }
function fmtSignedAmt(v, currency) { return currency === 'KHR' ? signedKhr(v) : signedUsd(v) }

const history = ref([])
const shiftLedgers = ref({})        // { [shiftId]: BalanceTransaction[] } — cached once loaded
const shiftLedgerLoading = ref(null) // shiftId currently loading, or null

async function loadShiftLedger(shiftId) {
  shiftLedgerLoading.value = shiftId
  try {
    const res = await getShiftBalanceTransactions(shiftId)
    shiftLedgers.value = { ...shiftLedgers.value, [shiftId]: res.data || [] }
  } catch {
    shiftLedgers.value = { ...shiftLedgers.value, [shiftId]: [] }
  } finally {
    shiftLedgerLoading.value = null
  }
}

// Sums every numeric column across the current page of history rows —
// including per-row income (close - open, only for rows that are actually
// closed; still-open rows contribute 0 to income since there's nothing to
// diff against yet).
const historyTotals = computed(() => {
  const t = {
    cashUsd: 0, cashKhr: 0, creditUsd: 0, creditKhr: 0,
    closeCashUsd: 0, closeCashKhr: 0, closeCreditUsd: 0, closeCreditKhr: 0,
    incomeCashUsd: 0, incomeCashKhr: 0, incomeCreditUsd: 0, incomeCreditKhr: 0,
  }
  for (const row of history.value) {
    t.cashUsd += Number(row.cash_usd || 0)
    t.cashKhr += Number(row.cash_khr || 0)
    t.creditUsd += Number(row.credit_usd || 0)
    t.creditKhr += Number(row.credit_khr || 0)
    if (row.closed_at) {
      t.closeCashUsd += Number(row.close_cash_usd || 0)
      t.closeCashKhr += Number(row.close_cash_khr || 0)
      t.closeCreditUsd += Number(row.close_credit_usd || 0)
      t.closeCreditKhr += Number(row.close_credit_khr || 0)
      t.incomeCashUsd += Number(row.close_cash_usd || 0) - Number(row.cash_usd || 0)
      t.incomeCashKhr += Number(row.close_cash_khr || 0) - Number(row.cash_khr || 0)
      t.incomeCreditUsd += Number(row.close_credit_usd || 0) - Number(row.credit_usd || 0)
      t.incomeCreditKhr += Number(row.close_credit_khr || 0) - Number(row.credit_khr || 0)
    }
  }
  return t
})

const expandedRows = ref(new Set())
function toggleRow(id) {
  const next = new Set(expandedRows.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
    // Auto-fetch the ledger the first time a row is expanded, rather than
    // requiring a separate click — it's cached afterward so re-toggling
    // the same row doesn't refetch.
    if (!shiftLedgers.value[id]) loadShiftLedger(id)
  }
  expandedRows.value = next
}

// ---- Download shift detail as an image -----------------------------
// Element refs for each expanded row's "receipt" card (see the
// :ref="el => setDetailRef(row.id, el)" div in the template), keyed by
// shift id, so downloadShiftImage() can grab exactly the right DOM node
// to capture — never the whole wide history table.
const detailRefs = ref({})
function setDetailRef(id, el) { if (el) detailRefs.value[id] = el }

const downloadingId = ref(null)

async function downloadShiftImage(row) {
  if (downloadingId.value) return
  downloadingId.value = row.id
  try {
    // Auto-expand the row (and load its ledger) if it isn't already, so a
    // single click on the camera icon is enough — no need to expand first.
    if (!expandedRows.value.has(row.id)) toggleRow(row.id)
    if (!shiftLedgers.value[row.id]) await loadShiftLedger(row.id)

    // Wait for the DOM to actually render the now-expanded row before
    // capturing — one tick for the v-if to mount, a second so the browser
    // has painted it (html2canvas reads live layout/computed styles).
    await nextTick()
    await nextTick()

    const el = detailRefs.value[row.id]
    if (!el) { error('Could not find shift detail to capture'); return }

    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2, // sharper output for a receipt-style image
      useCORS: true,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const dateStr = (row.created_at || '').slice(0, 10) || 'shift'
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `shift-${dateStr}-${row.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    error('Failed to generate image — is html2canvas installed? (npm install html2canvas)')
  } finally {
    downloadingId.value = null
  }
}

const meta = ref(null)
const loadingHistory = ref(false)
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => meta.value ? Math.max(1, Math.ceil(meta.value.total / pageSize.value)) : 1)

function usd(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function khr(v) { return `${Number(v || 0).toLocaleString()}៛` }
function signedUsd(v) {
  const n = Number(v || 0)
  return (n >= 0 ? '+' : '-') + `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function signedKhr(v) {
  const n = Number(v || 0)
  return (n >= 0 ? '+' : '-') + `${Math.abs(n).toLocaleString()}៛`
}
function incomeColor(v) { return Number(v || 0) >= 0 ? 'text-emerald-600' : 'text-red-600' }
function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
}
function fmtTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') +
    ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

async function loadToday() {
  if (!branchId.value) return
  try { const res = await getTodayBalance(branchId.value); today.value = res.data } catch {}
}

async function loadHistory() {
  if (!branchId.value) return
  loadingHistory.value = true
  try {
    const res = await getBalanceHistory(branchId.value, { page: page.value, page_size: pageSize.value })
    history.value = res.data?.items || []
    meta.value = { total: res.data?.total || 0 }
  } catch {} finally { loadingHistory.value = false }
}

function goPage(p) { page.value = p; loadHistory() }

async function onBranchChange() {
  page.value = 1
  today.value = null
  await Promise.all([loadToday(), loadHistory()])
}

async function doStart() {
  starting.value = true
  try {
    await startTodayBalance(branchId.value)
    success("Today's balance started")
    await Promise.all([loadToday(), loadHistory()])
  } catch (e) { error(e?.error || 'Failed to start today') } finally { starting.value = false }
}

async function doClose() {
  closing.value = true
  try {
    await closeTodayBalance(branchId.value)
    success("Today's balance closed")
    await Promise.all([loadToday(), loadHistory()])
  } catch (e) { error(e?.error || 'Failed to close today') } finally { closing.value = false }
}

onMounted(async () => {
  // Non-SA: use the branches already assigned to this user (loaded with
  // auth.user at login) — no extra API call needed.
  if (!auth.isSuperAdmin && auth.user?.branches?.length) {
    branchOptions.value = auth.user.branches.map(b => ({ id: b.id, name: b.name, sub: b.code }))
  } else {
    // Super Admin (or a non-SA user with no branches assigned) — fall
    // back to the full branch list.
    try {
      const res = await getBranches({ show_all: false })
      branchOptions.value = (res.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
    } catch {}
  }

  if (branchOptions.value.length === 1) {
    branchId.value = branchOptions.value[0].id
  }

  if (branchId.value) {
    loadToday()
    loadHistory()
  }
})
</script>