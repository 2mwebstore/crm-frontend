<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-800">Interesting Clients</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage hot prospects and leads</p>
      </div>
      <RouterLink to="/interesting-clients/create" class="btn-primary flex items-center gap-2">
        <PlusIcon class="w-4 h-4" /> New Record
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-3">
      <input v-model="filters.search" @input="debouncedLoad" type="text" class="input w-52" placeholder="Search name, code…" />
      <SearchableSelect v-model="filters.is_active" :options="activeOpts" value-key="id" label-key="name" placeholder="All status" all-label="All status" class="w-36" @update:modelValue="load" />
      <SearchableSelect v-model="filters.is_converted" :options="convertedOpts" value-key="id" label-key="name" placeholder="All Convert" all-label="All Convert" class="w-40" @update:modelValue="load" />
      <button @click="showMoreFilters = !showMoreFilters" class="btn-secondary btn-sm flex items-center gap-1">
        <FunnelIcon class="w-4 h-4" />
        More Filters
        <span v-if="activeMoreFilters > 0" class="bg-primary-600 text-white text-xs rounded-full px-1.5 leading-5">{{ activeMoreFilters }}</span>
      </button>
      <button @click="resetFilters" class="btn-secondary btn-sm">Reset</button>
    </div>

    <!-- More Filters Panel -->
    <div v-if="showMoreFilters" class="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div>
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Created By</label>
        <SearchableSelect v-model="filters.created_by_id" :options="users" placeholder="All users" @update:modelValue="load" />
      </div>
      <div>
        <label class="label text-xs">Contact Source</label>
        <SearchableSelect v-model="filters.contact_source_id" :options="contactSources" placeholder="All sources" @update:modelValue="load" />
      </div>

    </div>

    <!-- Table (desktop) -->
    <div class="hidden sm:block card overflow-hidden">
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
              <th class="table-header">Join Date</th>
              <th class="table-header">Created By</th>
              <th class="table-header">Converted</th>
              <th class="table-header">Active</th>
              <th class="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="11" class="table-cell text-center py-10">
                <div class="flex items-center justify-center gap-2 text-gray-400">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading…
                </div>
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="11" class="table-cell text-center py-10 text-gray-400">No records found</td>
            </tr>
            <tr v-else v-for="(row, idx) in items" :key="row.id" class="hover:bg-gray-50/60 transition-colors">
              <td class="table-cell text-gray-400 text-xs">{{ (currentPage - 1) * currentPageSize + idx + 1 }}</td>
              <td class="table-cell">
                <span class="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{{ row.code }}</span>
              </td>
              <td class="table-cell">
                <div v-if="row.branch" class="text-sm text-gray-700">
                  {{ row.branch.name }}
                </div>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-amber-400 flex-shrink-0">
                    {{ row.full_name?.charAt(0)?.toUpperCase() }}
                  </div>
                  <p class="font-medium text-gray-800 whitespace-nowrap">{{ row.full_name }}</p>
                </div>
              </td>
              <td class="table-cell">
                <span v-if="primaryPhone(row)" class="text-sm text-gray-700 whitespace-nowrap">{{ primaryPhone(row) }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span v-if="row.contact_source" class="badge bg-blue-50 text-blue-700">{{ row.contact_source.name }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>

              <td class="table-cell text-sm text-gray-600 whitespace-nowrap">{{ fmtDate(row.date_joined) }}</td>
              <td class="table-cell">
                <span class="text-sm text-gray-700">{{ row.created_by?.name || '—' }}</span>
              </td>
              <td class="table-cell">
                <span v-if="row.is_converted" class="badge bg-teal-100 text-teal-700 text-xs">✓ Converted</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="table-cell">
                <span :class="['badge', row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                  {{ row.is_active ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="table-cell">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink :to="`/interesting-clients/${row.id}`" class="btn-icon bg-gray-100" title="View"><EyeIcon class="w-4 h-4" /></RouterLink>
                  <RouterLink :to="`/interesting-clients/${row.id}/edit`" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></RouterLink>
                  <button v-if="!row.is_converted" @click="openConvert(row)" class="btn-icon bg-teal-50 text-teal-600" title="Convert to client">
                    <ArrowRightCircleIcon class="w-4 h-4" />
                  </button>
                  <span v-else class="text-xs text-teal-600 px-1">Converted</span>
                  <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <PageSizeSelect v-model="pageSize" @update:modelValue="onPageSizeChange" />
        <span>Showing {{ (currentPage - 1) * currentPageSize + 1 }}–{{ Math.min(currentPage * currentPageSize, meta.total_items) }} of {{ meta.total_items }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Card list (mobile) — tap a row to open the detail sheet; edit/delete
         icons stop propagation so they act directly without opening it. -->
    <div class="sm:hidden space-y-3">
      <div v-if="loading" class="flex items-center justify-center gap-2 text-gray-400 py-10 text-sm">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-400 text-sm">No records found</div>
      <div
        v-for="row in items"
        :key="row.id"
        class="card p-4"
      >
        <div @click="openDetail(row)" class="flex items-center gap-3 active:opacity-70 transition-opacity cursor-pointer">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-50 text-green-600">
            {{ row.full_name?.charAt(0)?.toUpperCase() }}{{ row.full_name?.charAt(1)?.toUpperCase() || '' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate">{{ row.full_name }}</p>
            <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <span v-if="primaryPhone(row)">{{ maskPhone(primaryPhone(row)) }}</span>
              <span v-if="primaryPhone(row) && row.contact_source">·</span>
              <span v-if="row.contact_source">{{ row.contact_source.name }}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
          <button
            v-if="!row.is_converted"
            @click="openConvert(row)"
            class="btn-icon bg-teal-50 text-teal-600"
            title="Convert to client"
          >
            <ArrowRightCircleIcon class="w-4 h-4" />
          </button>
          <span v-else class="badge bg-teal-100 text-teal-700 text-xs" title="Already converted">✓ Converted</span>
          <button @click="openEditDirect(row)" class="btn-icon bg-gray-100" title="Edit"><PencilIcon class="w-4 h-4" /></button>
          <button @click="confirmDelete(row)" class="btn-icon bg-red-50 text-red-500" title="Delete"><TrashIcon class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Mobile pagination -->
      <div v-if="meta && meta.total_items > 0" class="flex items-center justify-between pt-1 text-sm text-gray-500">
        <span class="text-xs">{{ meta.total_items }} total</span>
        <div class="flex items-center gap-1">
          <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-icon disabled:opacity-40"><ChevronLeftIcon class="w-4 h-4" /></button>
          <span class="px-3 py-1 bg-gray-100 rounded text-xs">{{ currentPage }} / {{ meta.total_pages }}</span>
          <button :disabled="currentPage >= meta.total_pages" @click="goPage(currentPage + 1)" class="btn-icon disabled:opacity-40"><ChevronRightIcon class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <ConfirmDialog v-model="deleteDialog" @confirm="doDelete" />

    <!-- Convert modal -->
    <AppModal v-model="convertModal" title="Convert to Client" size="md">
      <div class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-amber-400 flex-shrink-0">
            {{ convertTarget?.full_name?.charAt(0)?.toUpperCase() }}
          </div>
          <div>
            <p class="font-semibold text-gray-800">{{ convertTarget?.full_name }}</p>
            <span class="font-mono text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">{{ convertTarget?.code }}</span>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100 text-sm text-teal-800">
          <ArrowRightCircleIcon class="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <p>Creates a new Client record with all phone numbers copied. Set the branch below and the code will be generated automatically.</p>
        </div>
        <div>
          <label class="label">Branch</label>
          <SearchableSelect v-model="convertForm.branch_id" :options="branches" placeholder="Select branch" @update:modelValue="onConvertBranchChange" />
        </div>
        <div>
          <label class="label">Client Code (auto-generated)</label>
          <div class="input bg-gray-50 flex items-center gap-2 cursor-default select-none">
            <span v-if="convertCodePreview" class="font-mono font-bold text-sm" style="color:#938af4">{{ convertCodePreview }}</span>
            <span v-else class="text-gray-400 text-sm">Select branch to preview</span>
            <span v-if="convertLoadingCode" class="ml-auto">
              <svg class="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <button @click="convertModal = false" class="btn-secondary" :disabled="converting">Cancel</button>
        <button @click="doConvert" class="btn-primary flex items-center gap-2"
          :disabled="converting || !convertForm.branch_id || !convertCodePreview">
          <svg v-if="converting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <ArrowRightCircleIcon v-else class="w-4 h-4" />
          {{ converting ? 'Converting…' : 'Convert to Client' }}
        </button>
      </template>
    </AppModal>

    <!-- ============ Mobile: Detail bottom sheet ============ -->
    <Teleport to="body">
      <Transition name="sheet-fade">
        <div v-if="detailRow" class="fixed inset-0 z-50 sm:hidden">
          <div class="absolute inset-0 bg-black/40" @click="closeDetail" />
          <Transition name="sheet-slide" appear>
            <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
              <div class="flex items-center justify-center pt-2.5 pb-1 flex-shrink-0">
                <div class="w-10 h-1.5 rounded-full bg-gray-200"></div>
              </div>
              <div class="px-5 pb-3 flex-shrink-0">
                <h2 class="text-xl font-bold text-gray-900">{{ detailRow.full_name }}</h2>
              </div>
              <div class="overflow-y-auto px-5 pb-4 divide-y divide-gray-100">
                <div class="py-3">
                  <p class="font-semibold text-gray-900">{{ detailRow.full_name }}</p>
                  <p class="text-sm text-gray-400 mt-0.5">{{ detailRow.code }}</p>
                </div>
                <div class="py-3 flex items-center justify-between">
                  <span class="text-sm text-gray-400">Source</span>
                  <span class="text-sm font-semibold text-gray-800">{{ detailRow.contact_source?.name || '—' }}</span>
                </div>
                <div class="py-3 flex items-center justify-between">
                  <span class="text-sm text-gray-400">Joined</span>
                  <span class="text-sm font-semibold text-gray-800">{{ fmtDateOnly(detailRow.date_joined) }}</span>
                </div>
                <div class="py-3 flex items-center justify-between">
                  <span class="text-sm text-gray-400">Status</span>
                  <span :class="['text-sm font-semibold flex items-center gap-1.5', detailRow.is_active ? 'text-green-600' : 'text-gray-400']">
                    <span class="w-1.5 h-1.5 rounded-full" :class="detailRow.is_active ? 'bg-green-500' : 'bg-gray-300'"></span>
                    {{ detailRow.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="py-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <PhoneIcon class="w-3.5 h-3.5" /> Phones
                  </p>
                  <div v-if="!detailRow.phones?.length" class="text-sm text-gray-400">No phones</div>
                  <div v-for="ph in detailRow.phones" :key="ph.id" class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                    <span class="text-sm font-medium text-gray-800">{{ ph.phone }}</span>
                    <div class="flex items-center gap-1.5">
                      <span v-if="ph.is_primary" class="badge text-xs" style="background:#EEF2FF;color:#938af4">Primary</span>
                      <span :class="['badge text-xs', ph.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ ph.is_active !== false ? 'On' : 'Off' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="px-5 pb-5 pt-2 flex-shrink-0" style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))">
                <div class="grid grid-cols-3 gap-2">
                  <button @click="openEditFromDetail" class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold" style="background:#EEF2FF;color:#4F46E5">
                    <PencilIcon class="w-4 h-4" /> Edit
                  </button>
                  <button
                    v-if="!detailRow.is_converted"
                    @click="convertFromDetail(detailRow)"
                    class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold bg-green-50 text-green-700"
                  >
                    <ArrowRightCircleIcon class="w-4 h-4" /> Convert
                  </button>
                  <span v-else class="flex items-center justify-center rounded-xl py-2.5 text-sm font-semibold bg-teal-50 text-teal-700">Converted</span>
                  <button @click="deleteFromDetail(detailRow)" class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold bg-red-50 text-red-600">
                    <TrashIcon class="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ============ Mobile: Edit bottom sheet ============ -->
    <!-- Reuses the same fields/logic as ICFormView.vue's edit mode (Full
         Name, Contact Source, Date Joined, Active, Phones) so behavior
         matches the full edit page exactly, minus Branch/Code (fixed once
         created). "Level" is included since interesting_clients records do
         carry a real level_id (see ICDetailView.vue's ic.level?.name) even
         though the desktop ICFormView.vue doesn't currently expose it. -->
    <Teleport to="body">
      <Transition name="sheet-fade">
        <div v-if="editSheetOpen" class="fixed inset-0 z-50 sm:hidden">
          <div class="absolute inset-0 bg-black/40" @click="closeEditSheet" />
          <Transition name="sheet-slide" appear>
            <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
              <div class="flex items-center justify-center pt-2.5 pb-1 flex-shrink-0">
                <div class="w-10 h-1.5 rounded-full bg-gray-200"></div>
              </div>
              <div class="px-5 pb-3 flex items-center justify-between flex-shrink-0">
                <h2 class="text-xl font-bold text-gray-900">Edit Lead</h2>
                <button class="btn-icon" @click="closeEditSheet"><XMarkIcon class="w-5 h-5" /></button>
              </div>

              <div class="overflow-y-auto px-5 pb-4 space-y-4">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserPlusIcon class="w-3.5 h-3.5" /> Lead Information
                  </p>
                  <label class="label">Full Name <span class="text-red-500">*</span></label>
                  <input v-model="editForm.full_name" class="input" required placeholder="Full name" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Source <span class="text-red-500">*</span></label>
                    <SearchableSelect v-model="editForm.contact_source_id" :options="contactSources" placeholder="Select source" />
                  </div>
                  <div>
                    <label class="label">Level</label>
                    <SearchableSelect v-model="editForm.level_id" :options="levelOptions" placeholder="— None —" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label class="label">Date Joined</label>
                    <DatePicker v-model="editForm.date_joined" placeholder="Select date…" />
                  </div>
                  <label class="flex items-center gap-2 pb-2.5">
                    <input type="checkbox" v-model="editForm.is_active" class="w-4 h-4 accent-primary" />
                    <span class="text-sm font-medium text-green-600">Active</span>
                  </label>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <PhoneIcon class="w-3.5 h-3.5" /> Phone Numbers <span class="text-red-500">*</span>
                    </p>
                    <button type="button" @click="addEditPhone" class="btn-icon"><PlusIcon class="w-4 h-4" /></button>
                  </div>
                  <div v-for="(ph, i) in editForm.phones" :key="i" class="bg-gray-50 rounded-xl p-3 mb-2">
                    <div class="flex items-center gap-2">
                      <PhoneIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input v-model="ph.phone" class="input bg-white flex-1" placeholder="Phone number" required />
                      <button type="button" @click="editForm.phones.splice(i, 1)" class="btn-icon text-gray-400 flex-shrink-0"><XMarkIcon class="w-4 h-4" /></button>
                    </div>
                    <div class="flex items-center gap-4 mt-2 pl-6">
                      <label class="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <input type="radio" :name="'primary-'+i" :checked="ph.is_primary" @change="setEditPrimary(i)" class="accent-primary" />
                        <StarIcon class="w-3.5 h-3.5" :class="ph.is_primary ? 'text-blue-500' : 'text-gray-300'" /> Primary
                      </label>
                      <label class="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <input type="checkbox" v-model="ph.is_active" class="accent-primary" /> Enable
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-5 pt-2 flex-shrink-0" style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))">
                <button
                  @click="saveEditSheet"
                  :disabled="editSaving || !editForm.full_name || !editForm.phones.length"
                  class="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                >
                  <CheckIcon class="w-5 h-5" /> {{ editSaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowRightCircleIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon,
  PhoneIcon, UserPlusIcon, StarIcon, XMarkIcon, CheckIcon
} from '@heroicons/vue/24/outline'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AppModal from '@/components/common/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import PageSizeSelect from '@/components/common/PageSizeSelect.vue'
import { getICs, deleteIC, convertIC, updateIC } from '@/api/interesting-clients'
import { getBranches } from '@/api/branches'
import { previewClientCode } from '@/api/clients'
import { getUsersInScope } from '@/api/users'
import { useLookupStore } from '@/stores/lookup'
import { useToast } from '@/composables/useToast'
import { nowForDatePicker } from '@/utils/datetime'

const router = useRouter()
const { success, error } = useToast()
const lookup = useLookupStore()

const items    = ref([])
const meta     = ref(null)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(10)
const branches = ref([])
const users    = ref([])
const contactSources = ref([])

const showMoreFilters = ref(false)

const currentPage     = computed(() => page.value)
const currentPageSize = computed(() => pageSize.value)

const deleteTarget  = ref(null)
const deleteDialog  = ref(false)
const convertTarget = ref(null)
const convertModal  = ref(false)
const converting    = ref(false)

const convertForm         = ref({ branch_id: null })
const convertCodePreview  = ref('')
const convertLoadingCode  = ref(false)
let debounceTimer         = null

const filters       = ref({ search: '', is_active: null, is_converted: null, branch_id: null, created_by_id: null, contact_source_id: null})
const activeOpts    = [{ id: 'true', name: 'Active' }, { id: 'false', name: 'Inactive' }]
const convertedOpts = [{ id: 'false', name: 'Not Converted' }, { id: 'true', name: 'Converted' }]

const activeMoreFilters = computed(() =>
  [filters.value.branch_id, filters.value.created_by_id, filters.value.contact_source_id].filter(Boolean).length
)

function primaryPhone(row) {
  if (!row.phones?.length) return null
  return (row.phones.find(p => p.is_primary && p.is_active !== false) || row.phones[0])?.phone || null
}
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-') + ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }

// Mobile-only helpers ---------------------------------------------------
function fmtDateOnly(d) { return d ? new Date(d).toISOString().slice(0, 10) : '—' }
function maskPhone(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length <= 4) return phone
  return '****' + digits.slice(-4)
}

const levelOptions = computed(() => lookup.levels.map(l => ({ id: l.id, name: l.name })))

// ---- Detail sheet ----
const detailRow = ref(null)
function openDetail(row)  { detailRow.value = row }
function closeDetail()    { detailRow.value = null }

// Closes the sheet first, then opens the shared Convert popup (same
// AppModal component desktop uses) on the next tick — avoids both being
// teleported to <body> in the same instant, which could race for
// stacking order and made Convert look broken/behind on mobile.
function convertFromDetail(row) {
  closeDetail()
  nextTick(() => openConvert(row))
}

// ---- Edit sheet ----
// Mirrors ICFormView.vue's edit-mode fields exactly (see that file) minus
// Branch/Code, which aren't editable once a record exists there either.
const editSheetOpen = ref(false)
const editSaving    = ref(false)
const editTargetId  = ref(null)
const editForm = ref({
  full_name: '', contact_source_id: null, level_id: null,
  date_joined: nowForDatePicker(), is_active: true, phones: []
})

function populateEditForm(row) {
  editTargetId.value = row.id
  editForm.value = {
    full_name: row.full_name || '',
    contact_source_id: row.contact_source_id || row.contact_source?.id || null,
    level_id: row.level_id || row.level?.id || null,
    date_joined: row.date_joined ? row.date_joined.slice(0, 10) : '',
    is_active: row.is_active ?? true,
    phones: (row.phones || []).map(p => ({ ...p })),
  }
}

function openEditFromDetail() {
  populateEditForm(detailRow.value)
  closeDetail()
  editSheetOpen.value = true
}
function openEditDirect(row) {
  populateEditForm(row)
  editSheetOpen.value = true
}
function closeEditSheet() { editSheetOpen.value = false }

function addEditPhone() {
  editForm.value.phones.push({ phone: '', label: 'primary', is_primary: editForm.value.phones.length === 0, is_active: true })
}
function setEditPrimary(i) {
  editForm.value.phones.forEach((p, idx) => { p.is_primary = idx === i })
}

async function saveEditSheet() {
  if (!editForm.value.full_name || !editForm.value.phones.length) return
  editSaving.value = true
  try {
    await updateIC(editTargetId.value, { ...editForm.value })
    success('Updated successfully')
    editSheetOpen.value = false
    load()
  } catch (e) { error(e?.error || 'Save failed') }
  finally { editSaving.value = false }
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.value.search)            params.search            = filters.value.search
    if (filters.value.is_active    !== null && filters.value.is_active    !== '') params.is_active    = filters.value.is_active
    if (filters.value.is_converted !== null && filters.value.is_converted !== '') params.is_converted = filters.value.is_converted
    if (filters.value.branch_id)         params.branch_id         = filters.value.branch_id
    if (filters.value.created_by_id)     params.created_by_id     = filters.value.created_by_id
    if (filters.value.contact_source_id) params.contact_source_id = filters.value.contact_source_id
    const res = await getICs(params)
    items.value = res.data || []
    meta.value  = res.meta
  } catch {} finally { loading.value = false }
}

function debouncedLoad()   { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
function goPage(p)          { page.value = p; load() }
function onPageSizeChange() { page.value = 1; load() }
function resetFilters()     { filters.value = { search: '', is_active: null, is_converted: null, branch_id: null, created_by_id: null, contact_source_id: null}; page.value = 1; load() }
function confirmDelete(row) { deleteTarget.value = row; deleteDialog.value = true }
function deleteFromDetail(row) {
  closeDetail()
  nextTick(() => confirmDelete(row))
}

async function doDelete() {
  try { await deleteIC(deleteTarget.value.id); success('Deleted successfully'); load() }
  catch (e) { error(e?.error || 'Delete failed') }
}

function openConvert(row) {
  convertTarget.value        = row
  convertForm.value          = { branch_id: null }
  convertCodePreview.value   = ''
  convertModal.value         = true
}

async function onConvertBranchChange(id) {
  convertCodePreview.value = ''
  if (!id) return
  convertLoadingCode.value = true
  try {
    const res = await previewClientCode(id)
    convertCodePreview.value = res.data?.code || ''
  } catch { convertCodePreview.value = '' }
  finally { convertLoadingCode.value = false }
}

async function doConvert() {
  if (!convertForm.value.branch_id) { error('Select a branch'); return }
  if (!convertCodePreview.value)    { error('Code preview not ready yet'); return }
  converting.value = true
  try {
    const res = await convertIC(convertTarget.value.id, { code: convertCodePreview.value, branch_id: convertForm.value.branch_id })
    success(`"${convertTarget.value.full_name}" converted to client!`)
    convertModal.value = false
    const clientId = res.data?.id
    if (clientId) router.push(`/clients/${clientId}/edit`)
    else load()
  } catch (e) { error(e?.error || 'Conversion failed') }
  finally { converting.value = false }
}

onMounted(async () => {
  load()
  await lookup.loadAll()
  contactSources.value = lookup.contactSources.map(s => ({ id: s.id, name: s.name }))
  try { const r = await getBranches({ show_all: false }); branches.value = (r.data||[]).map(b=>({id:b.id,name:b.name,code:b.code,sub:b.code})) } catch {}
  try { const r = await getUsersInScope(); users.value = (r.data||[]).map(u=>({id:u.id,name:u.name,sub:u.email})) } catch {}
})
</script>

<style scoped>
.sheet-fade-enter-active, .sheet-fade-leave-active { transition: opacity .2s ease; }
.sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; }
.sheet-slide-enter-active, .sheet-slide-leave-active { transition: transform .25s cubic-bezier(.32,.72,0,1); }
.sheet-slide-enter-from, .sheet-slide-leave-to { transform: translateY(100%); }
</style>