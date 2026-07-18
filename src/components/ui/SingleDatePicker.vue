<template>
  <div ref="root" class="relative inline-block">
    <!-- Trigger -->
    <div
      class="input flex items-center gap-2 cursor-pointer min-w-[180px] select-none"
      @click="toggle"
    >
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
      <div class="p-4 w-64">
        <div class="flex items-center justify-between mb-3">
          <button @click="prev" class="p-1 rounded hover:bg-gray-100"><ChevronLeftIcon class="w-4 h-4 text-gray-500" /></button>
          <span class="text-sm font-semibold text-gray-700">{{ MONTHS[viewM] }}  {{ viewY }}</span>
          <button @click="next" class="p-1 rounded hover:bg-gray-100"><ChevronRightIcon class="w-4 h-4 text-gray-500" /></button>
        </div>
        <div class="grid grid-cols-7 mb-1">
          <div v-for="d in DAYS" :key="d" class="text-xs text-center text-gray-400 font-medium py-1">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7">
          <button
            v-for="day in days" :key="day.str"
            :disabled="!day.cur"
            @click="pick(day.str)"
            class="h-8 w-full text-xs flex items-center justify-center transition-colors"
            :class="cellClass(day)"
          >{{ day.label }}</button>
        </div>
        <button class="w-full mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium" @click="pick(todayStr)">Today</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Select date…' },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const pos  = ref({})

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function toStr(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const todayStr = toStr(new Date())

// View month starts on whatever's currently selected, falling back to today.
const initial = props.modelValue ? new Date(props.modelValue + 'T00:00:00') : new Date()
const viewY = ref(initial.getFullYear())
const viewM = ref(initial.getMonth())

function prev() { if (viewM.value === 0) { viewM.value = 11; viewY.value-- } else viewM.value-- }
function next() { if (viewM.value === 11) { viewM.value = 0; viewY.value++ } else viewM.value++ }

const days = computed(() => {
  const firstDow = new Date(viewY.value, viewM.value, 1).getDay()
  const lastDate = new Date(viewY.value, viewM.value + 1, 0).getDate()
  const prevLast = new Date(viewY.value, viewM.value, 0).getDate()
  const out = []
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(viewY.value, viewM.value - 1, prevLast - i)
    out.push({ str: toStr(d), label: prevLast - i, cur: false })
  }
  for (let i = 1; i <= lastDate; i++) {
    const d = new Date(viewY.value, viewM.value, i)
    out.push({ str: toStr(d), label: i, cur: true })
  }
  while (out.length < 42) {
    const i = out.length - firstDow - lastDate + 1
    const d = new Date(viewY.value, viewM.value + 1, i)
    out.push({ str: toStr(d), label: i, cur: false })
  }
  return out
})

function cellClass(day) {
  if (!day.cur) return 'text-gray-300 cursor-default'
  if (day.str === props.modelValue) return 'bg-indigo-600 text-white font-bold rounded-full cursor-pointer'
  if (day.str === todayStr) return 'text-indigo-600 font-semibold cursor-pointer hover:bg-gray-100 rounded-full'
  return 'text-gray-700 cursor-pointer hover:bg-gray-100 rounded-full'
}

const display = computed(() => {
  if (!props.modelValue) return ''
  const [y, m, d] = props.modelValue.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[+m - 1]} ${y}`
})

function pick(dateStr) {
  emit('update:modelValue', dateStr)
  open.value = false
}
function clear() {
  emit('update:modelValue', '')
}

async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const rect = root.value.getBoundingClientRect()
  pos.value = {
    top:  `${rect.bottom + 6}px`,
    left: `${Math.min(rect.left, window.innerWidth - 280)}px`,
  }
}

function onMousedown(e) {
  if (open.value && root.value && !root.value.contains(e.target)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onMousedown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onMousedown))
</script>