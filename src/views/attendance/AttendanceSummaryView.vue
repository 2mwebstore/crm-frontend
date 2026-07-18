<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-gray-800">Attendance Detail Report</h1>
      <p class="text-sm text-gray-500 mt-0.5">Per-day Attend / Absent / Leave breakdown for each staff member</p>
    </div>

    <div class="card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="label text-xs">Date Range</label>
        <DateRangePicker
          :model-value="[filters.date_from, filters.date_to]"
          @update:model-value="v => { filters.date_from = v[0]; filters.date_to = v[1]; reload() }"
        />
      </div>
      <div class="w-44">
        <label class="label text-xs">User</label>
        <SearchableSelect v-model="filters.user_id" :options="users" placeholder="All users" all-label="All users" @update:modelValue="reload" />
      </div>
      <div class="w-44">
        <label class="label text-xs">Branch</label>
        <SearchableSelect v-model="filters.branch_id" :options="branches" placeholder="All branches" all-label="All branches" @update:modelValue="reload" />
      </div>
      <button @click="resetFilters" class="btn-secondary btn-sm">This Month</button>
      <button @click="downloadTableImage" class="btn-secondary btn-sm flex items-center gap-1.5" :disabled="downloadingTable">
        <CameraIcon class="w-4 h-4" />
        {{ downloadingTable ? 'Generating…' : 'Download Table' }}
      </button>
      <button @click="downloadPayrollXlsx" class="btn-secondary btn-sm flex items-center gap-1.5" :disabled="downloadingXlsx">
        {{ downloadingXlsx ? 'Generating…' : 'Export Payroll XLSX' }}
      </button>
    </div>

    <div v-if="loading" class="card p-10 text-center text-gray-400">Loading…</div>
    <div v-else-if="!rows.length" class="card p-10 text-center text-gray-400">No staff found for this period</div>

    <div v-else ref="tableRef" class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="table-header"></th>
              <th class="table-header"></th>
              <th class="table-header">User</th>
              <th class="table-header">Branch</th>
              <th class="table-header text-center">ATTEND</th>
              <th class="table-header text-center">ABSENT</th>
              <th class="table-header text-center">LEAVE</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <template v-for="r in rows" :key="r.user_id">
              <tr class="hover:bg-gray-50/60 cursor-pointer" @click="toggleExpanded(r.user_id)">
                <td class="table-cell w-10">
                  <button
                    @click.stop="downloadUserImage(r)"
                    class="btn-icon bg-gray-100 flex-shrink-0"
                    title="Download this staff member's detail as an image"
                    :disabled="downloadingId === r.user_id"
                  >
                    <svg v-if="downloadingId === r.user_id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <CameraIcon v-else class="w-4 h-4" />
                  </button>
                </td>
                <td class="table-cell w-8">
                  <ChevronRightIcon class="w-4 h-4 text-gray-400 transition-transform" :class="{ 'rotate-90': isExpanded(r.user_id) }" />
                </td>
                <td class="table-cell text-sm font-medium text-gray-800">{{ r.user_name }}</td>
                <td class="table-cell text-sm text-gray-600">{{ r.branch_names || '—' }}</td>
                <td class="table-cell text-center text-sm font-medium text-emerald-600">{{ fmtCount(r.attend) }}</td>
                <td class="table-cell text-center text-sm font-medium text-red-600">{{ fmtCount(r.absent) }}</td>
                <td class="table-cell text-center text-sm font-medium text-blue-600">{{ fmtCount(r.leave) }}</td>
              </tr>
              <tr v-if="isExpanded(r.user_id)">
                <td colspan="7" class="px-4 pb-3 pt-2 bg-gray-50/50">
                  <!-- This wrapper (rounded, overflow-hidden, white bg) is exactly
                       what downloadUserImage() captures — kept as one clean,
                       self-contained "receipt" element so the exported PNG has
                       no clipped edges or transparent gaps around it. -->
                  <div
                    :ref="el => setDetailRef(r.user_id, el)"
                    class="rounded-xl overflow-hidden bg-white border border-gray-100 p-4"
                  >
                    <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div>
                        <p class="text-sm font-semibold text-gray-800">{{ r.user_name }}</p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          {{ r.branch_names || '—' }} · {{ filters.date_from }} → {{ filters.date_to }}
                        </p>
                      </div>
                      <div class="flex gap-3 text-xs">
                        <span class="text-emerald-600 font-medium">Attend {{ fmtCount(r.attend) }}</span>
                        <span class="text-red-600 font-medium">Absent {{ fmtCount(r.absent) }}</span>
                        <span class="text-blue-600 font-medium">Leave {{ fmtCount(r.leave) }}</span>
                      </div>
                    </div>
                    <table class="w-full text-xs border border-gray-200 rounded overflow-hidden">
                      <thead class="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th class="table-header">Date</th>
                          <th class="table-header">Day</th>
                          <th class="table-header">Status</th>
                          <th class="table-header">Check In</th>
                          <th class="table-header">Check Out</th>
                          <th class="table-header">Reason</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                        <tr v-for="d in r.days" :key="d.date">
                          <td class="table-cell align-top text-gray-700 whitespace-nowrap">{{ fmtDate(d.date) }}</td>
                          <td class="table-cell align-top text-gray-500">{{ d.weekday }}</td>
                          <td class="table-cell align-top">
                            <span :class="['badge', dayStatusBadge(d.status)]" :style="dayStatusColor(d.status)">{{ d.status }}</span>
                          </td>
                          <td class="table-cell align-top text-gray-600">
                            <span v-if="d.check_in_at">{{ fmtTime(d.check_in_at) }}</span><span v-else>—</span>
                            <span v-if="d.check_in_status" :class="['badge ml-1', checkInStatusBadge(d.check_in_status)]">{{ checkInStatusLabel(d.check_in_status) }}</span>
                            <span v-if="d.check_in_via_activity" class="badge ml-1 bg-purple-100 text-purple-700">Activity</span>
                          </td>
                          <td class="table-cell align-top text-gray-600">
                            <span v-if="d.check_out_at">{{ fmtTime(d.check_out_at) }}</span><span v-else>—</span>
                            <span v-if="d.check_out_status" :class="['badge ml-1', checkInStatusBadge(d.check_out_status)]">{{ checkInStatusLabel(d.check_out_status) }}</span>
                            <span v-if="d.check_out_via_activity" class="badge ml-1 bg-purple-100 text-purple-700">Activity</span>
                          </td>
                          <td class="table-cell align-top text-gray-500 max-w-64">
                            <template v-if="d.check_in_reason || d.check_out_reason">
                              <p v-if="d.check_in_reason">CheckIn : {{ d.check_in_reason }}</p>
                              <p v-if="d.check_out_reason">CheckOut : {{ d.check_out_reason }}</p>
                            </template>
                            <span v-else>—</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ChevronRightIcon, CameraIcon } from '@heroicons/vue/24/outline'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import DateRangePicker from '@/components/ui/DateRangePicker.vue'
import { getAttendanceSummary, getPayrollExport } from '@/api/attendance'
import { getUsersInScope } from '@/api/users'
import { getBranches } from '@/api/branches'
import { fmtTime } from '@/utils/datetime'
import { useToast } from '@/composables/useToast'

const { error } = useToast()

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function lastDayOfMonth() {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}
function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// Default end date is capped at TODAY, not the calendar end of month —
// otherwise this report would compute ABSENT for days that haven't
// happened yet.
function defaultDateTo() {
  const today = todayDateString()
  const last = lastDayOfMonth()
  return today < last ? today : last
}
function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
// Attend/Absent/Leave can be fractional (half-day leave, or a check-in
// with no check-out docking 0.5) — show a clean "1.5" rather than
// floating point noise, and drop the decimal entirely for whole numbers.
function fmtCount(n) {
  const rounded = Math.round((n || 0) * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function dayStatusBadge(s) {
  if (s.includes('+'))        return 'bg-amber-100 text-amber-700' // any combined status (e.g. "ATTEND + LEAVE", "ATTEND + Half Day - Morning")
  if (s.includes('ATTEND'))   return 'bg-emerald-100 text-emerald-700'
  if (s.includes('LEAVE'))    return 'bg-blue-100 text-blue-700'
  if (s.includes('ABSENT'))   return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}
// Explicit hex pairs matching dayStatusBadge's Tailwind classes, applied
// as an inline style on the badge in addition to the class — html2canvas
// doesn't always reliably resolve Tailwind's utility classes at capture
// time, so this gives it an unambiguous color to fall back on rather than
// risking a blank/white background in the exported image.
function dayStatusColor(s) {
  if (s.includes('+'))      return { backgroundColor: '#fde68a', color: '#b45309' } // amber-200/amber-700-ish
  if (s.includes('ATTEND')) return { backgroundColor: '#d1fae5', color: '#047857' } // emerald-100/emerald-700
  if (s.includes('LEAVE'))  return { backgroundColor: '#dbeafe', color: '#1d4ed8' } // blue-100/blue-700
  if (s.includes('ABSENT')) return { backgroundColor: '#fee2e2', color: '#b91c1c' } // red-100/red-700
  return { backgroundColor: '#f3f4f6', color: '#4b5563' } // gray-100/gray-600
}
function checkInStatusLabel(s) {
  return s === 'early' ? 'Early' : s === 'good' ? 'On Time' : s === 'late' ? 'Late' : ''
}
function checkInStatusBadge(s) {
  switch (s) {
    case 'early': return 'bg-blue-100 text-blue-700'
    case 'good':  return 'bg-emerald-100 text-emerald-700'
    case 'late':  return 'bg-red-100 text-red-700'
    default:      return 'bg-gray-100 text-gray-600'
  }
}

const rows    = ref([])
const loading = ref(false)

const filters = ref({ date_from: firstDayOfMonth(), date_to: defaultDateTo(), user_id: null, branch_id: null })
const users = ref([])
const branches = ref([])

const expanded = ref(new Set())
function isExpanded(userId) { return expanded.value.has(userId) }
function toggleExpanded(userId) {
  const next = new Set(expanded.value)
  if (next.has(userId)) next.delete(userId)
  else next.add(userId)
  expanded.value = next
}

// ---- Download a staff member's detail as an image --------------------
// Same pattern as Daily Balance's shift-image download: capture the
// rendered "receipt" div for that user's expanded row with html2canvas,
// not the whole page.
const detailRefs = ref({})
function setDetailRef(userId, el) { if (el) detailRefs.value[userId] = el }

const downloadingId = ref(null)

async function downloadUserImage(r) {
  if (downloadingId.value) return
  downloadingId.value = r.user_id
  try {
    // Auto-expand the row if it isn't already, so a single click on the
    // camera icon is enough — no need to expand first.
    if (!isExpanded(r.user_id)) toggleExpanded(r.user_id)

    // Wait for the DOM to actually render the now-expanded row before
    // capturing. nextTick only guarantees Vue has flushed the DOM update
    // — it does NOT guarantee the browser has finished layout/paint for a
    // multi-line cell (the 2-line Reason text), which is what was
    // clipping content in the exported image. requestAnimationFrame
    // (twice — the first fires before the frame that follows the DOM
    // change, the second confirms that frame has actually been painted)
    // is the reliable way to wait for a real paint, not just a timer.
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    await new Promise(resolve => setTimeout(resolve, 300))

    const el = detailRefs.value[r.user_id]
    if (!el) { error('Could not find attendance detail to capture'); return }

    // Reading offsetHeight forces the browser to commit any pending
    // layout synchronously (a reflow) right before capture, instead of
    // possibly still having a stale/queued layout when html2canvas reads
    // computed styles.
    void el.offsetHeight

    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2, // sharper output for a receipt-style image
      useCORS: true,
      // Deliberately NOT forcing height/width here — an earlier attempt
      // passed el.scrollHeight explicitly, but if that measurement was
      // taken even slightly before the browser finished growing a row
      // for wrapped text, it locks html2canvas into that stale (too
      // short) height, which CAUSES clipping rather than preventing it.
      // Better to let html2canvas measure the element itself once the
      // reflow above has actually settled.
    })

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `attendance-${r.user_name.replace(/\s+/g, '-').toLowerCase()}-${filters.value.date_from}-to-${filters.value.date_to}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    error('Failed to generate image — is html2canvas installed? (npm install html2canvas)')
  } finally {
    downloadingId.value = null
  }
}

// ---- Download the whole summary table as one image --------------------
// Separate from downloadUserImage/detailRefs above — this captures the
// collapsed summary table (User/Branch/Attend/Absent/Leave, all rows) as
// a single image, not any one user's per-day detail.
const tableRef = ref(null)
const downloadingTable = ref(false)

async function downloadTableImage() {
  if (downloadingTable.value) return
  downloadingTable.value = true
  try {
    // Collapse any expanded rows first, so the captured image is always
    // the clean summary table — not whatever detail happened to be open
    // when the button was clicked.
    expanded.value = new Set()

    await nextTick()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    await new Promise(resolve => setTimeout(resolve, 300))

    const el = tableRef.value
    if (!el) { error('Could not find the table to capture'); return }

    void el.offsetHeight

    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `attendance-summary-${filters.value.date_from}-to-${filters.value.date_to}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    error('Failed to generate image — is html2canvas installed? (npm install html2canvas)')
  } finally {
    downloadingTable.value = false
  }
}

const downloadingXlsx = ref(false)
async function downloadPayrollXlsx() {
  if (downloadingXlsx.value) return
  downloadingXlsx.value = true
  try {
    const params = {}
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getPayrollExport(params)
    // The shared axios instance's response interceptor (api/index.js)
    // unwraps `.data` globally for every request, so `res` here IS
    // already the blob itself — not an axios response object with a
    // .data property. Using res.data would create a Blob from
    // `[undefined]`, producing exactly the "file format is not valid"
    // corrupt-download Excel error.
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payroll-${filters.value.date_from}-to-${filters.value.date_to}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    error('Failed to generate the payroll export')
  } finally {
    downloadingXlsx.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.user_id)   params.user_id   = filters.value.user_id
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    const res = await getAttendanceSummary(params)
    rows.value = res.data || []
    // Filtering down to one specific person is a request to SEE their
    // detail, not just their totals — expand it automatically instead
    // of requiring an extra click on top of the filter they just set.
    if (filters.value.user_id && rows.value.length === 1) {
      expanded.value = new Set([rows.value[0].user_id])
    }
  } catch { rows.value = [] } finally { loading.value = false }
}

function reload() { load() }
function resetFilters() {
  filters.value = { date_from: firstDayOfMonth(), date_to: defaultDateTo(), user_id: null, branch_id: null }
  reload()
}

onMounted(async () => {
  load()
  try {
    const res = await getUsersInScope()
    users.value = (res.data || []).map(u => ({ id: u.id, name: u.name, sub: u.email }))
  } catch {}
  try {
    const res = await getBranches({ show_all: false })
    branches.value = (res.data || []).map(b => ({ id: b.id, name: b.name, sub: b.code }))
  } catch {}
})
</script>