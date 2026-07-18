<template>
  <div ref="root" class="relative inline-block">
    <!-- Trigger -->
    <div
      class="input flex items-center gap-2 cursor-pointer min-w-[140px] select-none"
      @click="toggle"
    >
      <ClockIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span class="text-sm flex-1" :class="display ? 'text-gray-700' : 'text-gray-400'">
        {{ display || placeholder }}
      </span>
      <XMarkIcon v-if="display" class="w-4 h-4 text-gray-400 hover:text-gray-600" @click.stop="clear" />
    </div>

    <!-- Panel -->
    <div
      v-if="open"
      class="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-56"
      :style="pos"
      @mousedown.stop
    >
      <div class="grid grid-cols-3 gap-3">
        <div>
          <p class="text-base text-gray-400 font-medium mb-1 text-center">Hour</p>
          <div class="h-40 overflow-y-auto flex flex-col gap-0.5 pr-1">
            <button
              v-for="h in hours" :key="h"
              @click="selectHour(h)"
              class="h-7 text-base rounded-lg transition-colors"
              :class="hour === h ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
            >{{ String(h).padStart(2, '0') }}</button>
          </div>
        </div>
        <div>
          <p class="text-base text-gray-400 font-medium mb-1 text-center">Min</p>
          <div class="h-40 overflow-y-auto flex flex-col gap-0.5 pr-1">
            <button
              v-for="m in minutes" :key="m"
              @click="minute = m"
              class="h-7 text-base rounded-lg transition-colors"
              :class="minute === m ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
            >{{ String(m).padStart(2, '0') }}</button>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium mb-1 text-center">&nbsp;</p>
          <div class="flex flex-col gap-0.5">
            <button
              v-for="p in ['AM', 'PM']" :key="p"
              @click="period = p"
              class="h-7 text-base rounded-lg transition-colors"
              :class="period === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
            >{{ p }}</button>
          </div>
        </div>
      </div>
      <button
        class="w-full mt-3 text-sm py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
        :disabled="hour == null || minute == null || period == null"
        @click="apply"
      >Apply</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ClockIcon, XMarkIcon } from '@heroicons/vue/24/outline'

// modelValue is a "HH:MM" 24-hour string (e.g. "18:00"), matching what
// the backend StaffRequest.StartTime/EndTime fields expect — the picker
// itself works in 12-hour + AM/PM internally since that's easier for
// someone to pick, then converts on apply/parse.
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Select time…' },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const pos  = ref({})

const hours = Array.from({ length: 12 }, (_, i) => i + 1)
const minutes = Array.from({ length: 60 }, (_, i) => i);

const hour = ref(null)
const minute = ref(null)
const period = ref(null)

function parseModelValue(v) {
  if (!v) { hour.value = null; minute.value = null; period.value = null; return }
  const [hStr, mStr] = v.split(':')
  let h24 = Number(hStr)
  const m = Number(mStr)
  period.value = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  hour.value = h12
  // Snap to the nearest 5-minute button so an odd stored value still
  // shows a sensible selection rather than nothing highlighted.
  minute.value = minutes.reduce((closest, cur) => Math.abs(cur - m) < Math.abs(closest - m) ? cur : closest, 0)
}
parseModelValue(props.modelValue)
watch(() => props.modelValue, parseModelValue)

const display = computed(() => {
  if (!props.modelValue) return ''
  const [hStr, mStr] = props.modelValue.split(':')
  let h24 = Number(hStr)
  const p = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${mStr} ${p}`
})

function apply() {
  if (hour.value == null || minute.value == null || period.value == null) return
  let h24 = hour.value % 12
  if (period.value === 'PM') h24 += 12
  const hh = String(h24).padStart(2, '0')
  const mm = String(minute.value).padStart(2, '0')
  emit('update:modelValue', `${hh}:${mm}`)
  open.value = false
}
function clear() {
  emit('update:modelValue', '')
}

function selectHour(h) {
  hour.value = h

  // Default minute to 00 when an hour is selected
  if (minute.value == null) {
    minute.value = 0
  }
}

async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const rect = root.value.getBoundingClientRect()
  pos.value = {
    top:  `${rect.bottom + 6}px`,
    left: `${Math.min(rect.left, window.innerWidth - 240)}px`,
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