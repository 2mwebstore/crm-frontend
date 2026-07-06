<template>
  <div class="relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
      {{ currency === 'KHR' ? '៛' : '$' }}
    </span>
    <input
      type="text"
      inputmode="decimal"
      class="input pl-7"
      :class="[disabled ? 'bg-gray-50 text-gray-500' : '']"
      :value="displayValue"
      :disabled="disabled"
      :required="required"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      placeholder="0"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  currency:   { type: String, default: 'USD' }, // 'USD' | 'KHR'
  disabled:   { type: Boolean, default: false },
  required:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const displayValue = ref('')
const focused = ref(false)

function formatForDisplay(raw, currency) {
  const num = Number(String(raw ?? '').replace(/,/g, '')) || 0
  if (currency === 'KHR') return Math.round(num).toLocaleString('en-US')
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function onFocus() {
  focused.value = true
}

function onInput(e) {
  let cleaned = e.target.value.replace(/[^0-9.]/g, '')
  if (props.currency === 'KHR') cleaned = cleaned.replace(/\./g, '') // no decimals for riel

  // keep only the first decimal point
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }

  const [intPart, decPart] = cleaned.split('.')
  const intFormatted = intPart ? Number(intPart).toLocaleString('en-US') : ''
  displayValue.value = decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted

  emit('update:modelValue', Number(cleaned) || 0)
}

function onBlur() {
  focused.value = false
  displayValue.value = formatForDisplay(props.modelValue, props.currency)
}

watch(
  () => [props.modelValue, props.currency],
  ([val, cur]) => {
    if (focused.value) return // don't clobber while user is typing
    displayValue.value = formatForDisplay(val, cur)
  },
  { immediate: true }
)
</script>