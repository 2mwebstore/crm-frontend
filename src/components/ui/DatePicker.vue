<template>
  <div ref="root" class="relative inline-block w-full">
    <!-- Trigger -->
    <div class="input flex items-center gap-2 cursor-pointer select-none" @click="toggle">
      <CalendarIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span class="text-sm flex-1" :class="display ? 'text-gray-700' : 'text-gray-400'">
        {{ display || placeholder }}
      </span>
      <XMarkIcon v-if="display" class="w-4 h-4 text-gray-400 hover:text-gray-600" @click.stop="clear" />
    </div>

    <!-- Panel -->
    <div
      v-if="open"
      class="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100"
      :style="pos"
      @mousedown.stop
    >
      <!-- Calendar -->
      <div class="p-4 w-72">
        <!-- Month nav -->
        <div class="flex items-center justify-between mb-3">
          <button type="button" @click="prev" class="p-1 rounded hover:bg-gray-100"><ChevronLeftIcon class="w-4 h-4 text-gray-500" /></button>
          <span class="text-sm font-semibold text-gray-700">{{ MONTHS[viewMonth] }}  {{ viewYear }}</span>
          <button type="button" @click="next" class="p-1 rounded hover:bg-gray-100"><ChevronRightIcon class="w-4 h-4 text-gray-500" /></button>
        </div>
        <!-- Day names -->
        <div class="grid grid-cols-7 mb-1">
          <div v-for="d in DAYS" :key="d" class="text-xs text-center text-gray-400 font-medium py-1">{{ d }}</div>
        </div>
        <!-- Day cells -->
        <div class="grid grid-cols-7">
          <button
            type="button"
            v-for="(day, i) in days" :key="i"
            :disabled="!day.cur"
            @click="pickDay(day)"
            class="h-8 w-full text-xs flex items-center justify-center transition-colors"
            :class="dayClass(day)"
          >{{ day.label }}</button>
        </div>

        <!-- Time picker -->
        <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 justify-center">
          <input
            type="number" min="1" max="12" v-model.number="hour"
            class="input w-18 text-center text-sm" @change="emitVal"
          />
          <span class="text-gray-400 font-bold">:</span>
          <input
            type="number" min="0" max="59" v-model.number="minute"
            class="input w-18 text-center text-sm" @change="emitVal"
          />
          <select v-model="ampm" class="input w-16 text-sm" @change="emitVal">
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 px-4 py-3 border-t border-gray-100">
        <button type="button" class="btn-secondary text-sm px-4 py-1.5" @click="open = false">Cancel</button>
        <button
          type="button"
          class="text-sm px-5 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
          :disabled="!selectedDate"
          @click="apply"
        >Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { pad } from '@/utils/datetime'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Select date & time…' },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const pos  = ref({})

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

const now = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())

// Selection
const selectedDate = ref('') // YYYY-MM-DD
const hour   = ref(12)
const minute = ref(0)
const ampm   = ref('AM')

// Init from modelValue - watch handles both initial value and async loads
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      selectedDate.value = ''
      hour.value = 12
      minute.value = 0
      ampm.value = 'AM'
      return
    }

    // support:
    // 2026-07-06 09:24:51           (naive, already local -> use digits as-is)
    // 2026-07-06T09:24:51           (naive, already local -> use digits as-is)
    // 2026-07-06T02:24:51Z          (real UTC instant -> convert to PP local)
    // 2026-07-06T02:24:51+00:00     (real UTC/offset instant -> convert to PP local)
    let y, mo, d, hh, mm

    if (/Z$|[+-]\d{2}:?\d{2}$/.test(val.trim())) {
      // Has an explicit timezone marker -> it's a real instant, not a naive
      // wall-clock string. Convert to Phnom Penh (UTC+7) local time.
      const instant = new Date(val)
      const pp = new Date(instant.getTime() + 7 * 60 * 60000)
      y  = pp.getUTCFullYear()
      mo = pp.getUTCMonth()
      d  = pp.getUTCDate()
      hh = pp.getUTCHours()
      mm = pp.getUTCMinutes()
    } else {
      // Naive string, already represents local wall-clock time - use digits as-is
      const [datePart, timePart = '00:00:00'] = val.replace('T', ' ').split(' ')
      const [yy, mmo, dd] = datePart.split('-').map(Number)
      y = yy
      mo = mmo - 1
      d = dd
      ;[hh, mm] = timePart.split(':').map(Number)
    }

    selectedDate.value = `${y}-${pad(mo + 1)}-${pad(d)}`
    viewYear.value = y
    viewMonth.value = mo

    ampm.value = hh >= 12 ? 'PM' : 'AM'

    if (hh === 0)
      hh = 12
    else if (hh > 12)
      hh -= 12

    hour.value = hh
    minute.value = mm
  },
  { immediate: true }
)

const display = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-')
  return `${d} ${MONTHS[Number(m)-1]} ${y} ${pad(hour.value)}:${pad(minute.value)} ${ampm.value}`
})

function buildDays() {
  const firstDow = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const lastDate = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const prevLast = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const days = []
  for (let i = firstDow - 1; i >= 0; i--) days.push({ str: '', label: prevLast - i, cur: false })
  for (let i = 1; i <= lastDate; i++) {
    const s = `${viewYear.value}-${pad(viewMonth.value + 1)}-${pad(i)}`
    days.push({ str: s, label: i, cur: true })
  }
  while (days.length < 42) days.push({ str: '', label: days.length - firstDow - lastDate + 1, cur: false })
  return days
}

const days = computed(() => buildDays())

const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`

function dayClass(day) {
  if (!day.cur) return 'text-gray-300 cursor-default'
  if (day.str === selectedDate.value) return 'bg-indigo-600 text-white font-bold rounded-full cursor-pointer'
  if (day.str === todayStr) return 'text-indigo-600 font-semibold cursor-pointer hover:bg-gray-100 rounded-full'
  return 'text-gray-700 cursor-pointer hover:bg-gray-100 rounded-full'
}

function pickDay(day) {
  if (!day.cur) return
  selectedDate.value = day.str
}

function prev() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function next() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function buildISO() {
  if (!selectedDate.value) return ''

  let h = hour.value

  if (ampm.value === 'PM' && h !== 12)
    h += 12

  if (ampm.value === 'AM' && h === 12)
    h = 0

  return `${selectedDate.value} ${pad(h)}:${pad(minute.value)}:00`
}

function apply() {
  emit('update:modelValue', buildISO())
  open.value = false
}

function clear() {
  selectedDate.value = ''
  emit('update:modelValue', '')
}

function emitVal() {
  if (selectedDate.value) emit('update:modelValue', buildISO())
}

async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const rect = root.value.getBoundingClientRect()
  pos.value = {
    top:  `${rect.bottom + 6}px`,
    left: `${Math.min(rect.left, window.innerWidth - 300)}px`,
  }
}

function onOutside(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>