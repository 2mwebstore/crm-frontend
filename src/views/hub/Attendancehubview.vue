<template>
  <div class="space-y-6 pb-4">
    <!-- Banner -->
    <div class="rounded-xl p-6 text-white" style="background:#3B82F6">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-lg flex items-center justify-center bg-white/20 flex-shrink-0">
          <MapPinIcon class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <p class="text-lg font-bold truncate">Attendance</p>
          <p class="text-sm text-white/80 truncate">{{ todayStatusLabel }}</p>
        </div>
      </div>
    </div>

    <!-- My -->
    <div v-if="myTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">My</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in myTiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Manage -->
    <div v-if="manageTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Manage</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in manageTiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Reports -->
    <div v-if="reportTiles.length">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Reports</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RouterLink
          v-for="t in reportTiles"
          :key="t.label"
          :to="t.to"
          class="flex flex-col gap-2.5 bg-white rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: `${t.tint}1f` }">
            <component :is="t.icon" class="w-5 h-5" :style="{ color: t.tint }" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ t.label }}</p>
            <p class="text-xs text-gray-400 truncate">{{ t.sub }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getTodayAttendance } from '@/api/attendance'
import {
  MapPinIcon, ClockIcon, CalendarDaysIcon, TagIcon, ChartBarIcon,
  DocumentTextIcon, ClipboardDocumentListIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const todayAttendance = ref(null)

const todayStatusLabel = computed(() => {
  const a = todayAttendance.value
  if (!a?.check_in_at) return 'Not checked in yet today'
  if (!a?.check_out_at) return 'Checked in — not checked out yet'
  return 'Checked in and out today'
})

// "My" — self-service pages, each gated by that feature's own Request
// permission (a sibling to View/Approve below, not a prerequisite for
// them — see permission.go for the full reasoning).
const allMyTiles = computed(() => [
  { label: 'My Attendance', sub: 'Check in / out', to: '/attendance/my', icon: MapPinIcon, tint: '#3B82F6', show: auth.isSuperAdmin || auth.can('attendance.request') },
  { label: 'Leave Request', sub: 'Submit leave', to: '/leave/request', icon: CalendarDaysIcon, tint: '#22C55E', show: auth.isSuperAdmin || auth.can('leave_requests.request') },
  { label: 'Overtime Request', sub: 'Submit overtime', to: '/overtime/request', icon: ClockIcon, tint: '#F97316', show: auth.isSuperAdmin || auth.can('overtime_requests.request') },
  { label: 'Activity Request', sub: 'Submit activity', to: '/activity/request', icon: MapPinIcon, tint: '#938af4', show: auth.isSuperAdmin || auth.can('activity_requests.request') },
])
const myTiles = computed(() => allMyTiles.value.filter(t => t.show))

// "Manage" — seeing/approving OTHER people's records, plus the
// admin-managed lookup entities (Leave Types, Schedule Overrides).
const allManageTiles = computed(() => [
  { label: 'List Attendance', sub: 'All staff records', to: '/attendance/list', icon: MapPinIcon, tint: '#3B82F6', show: auth.isSuperAdmin || auth.can('attendance.view') },
  { label: 'List Leave', sub: 'View & approve', to: '/leave/list', icon: CalendarDaysIcon, tint: '#22C55E', show: auth.isSuperAdmin || auth.canAny('leave_requests.view', 'leave_requests.approve') },
  { label: 'List Overtime', sub: 'View & approve', to: '/overtime/list', icon: ClockIcon, tint: '#F97316', show: auth.isSuperAdmin || auth.canAny('overtime_requests.view', 'overtime_requests.approve') },
  { label: 'List Activity', sub: 'View requests', to: '/activity/list', icon: MapPinIcon, tint: '#938af4', show: auth.isSuperAdmin || auth.can('activity_requests.view') },
  { label: 'Leave Types', sub: 'Manage categories', to: '/leave/types', icon: TagIcon, tint: '#EAB308', show: auth.isSuperAdmin || auth.can('leave_types.view') },
  { label: 'Schedule Overrides', sub: 'Temporary shift changes', to: '/schedule-overrides', icon: ClockIcon, tint: '#6B7280', show: auth.isSuperAdmin || auth.canAny('schedule_overrides.view', 'schedule_overrides.create', 'schedule_overrides.edit', 'schedule_overrides.delete') },
])
const manageTiles = computed(() => allManageTiles.value.filter(t => t.show))


// "Reports" — all five gated by the single unified attendance_reports.view
// permission, separate from each feature's own View permission above.
const allReportTiles = computed(() => [
  { label: 'Report Attendance', sub: 'Attendance summary', to: '/attendance/report', icon: ChartBarIcon, tint: '#3B82F6', show: auth.isSuperAdmin || auth.can('attendance_reports.view') },
  { label: 'Attendance Detail', sub: 'Per-day breakdown', to: '/attendance/summary', icon: ClipboardDocumentListIcon, tint: '#6366F1', show: auth.isSuperAdmin || auth.can('attendance_reports.view') },
  { label: 'Report Leave', sub: 'Leave summary', to: '/leave/report', icon: DocumentTextIcon, tint: '#22C55E', show: auth.isSuperAdmin || auth.can('attendance_reports.view') },
  { label: 'Report Overtime', sub: 'Overtime summary', to: '/overtime/report', icon: DocumentTextIcon, tint: '#F97316', show: auth.isSuperAdmin || auth.can('attendance_reports.view') },
  { label: 'Report Activity', sub: 'Activity summary', to: '/activity/report', icon: DocumentTextIcon, tint: '#938af4', show: auth.isSuperAdmin || auth.can('attendance_reports.view') },
])
const reportTiles = computed(() => allReportTiles.value.filter(t => t.show))

onMounted(async () => {
  try {
    const res = await getTodayAttendance()
    todayAttendance.value = res.data
  } catch { }
})
</script>