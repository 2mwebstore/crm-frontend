<template>
  <input
    :value="localValue"
    type="datetime-local"
    class="input"
    :disabled="disabled"
    :required="required"
    @input="onInput"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, null],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  useNowIfEmpty: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

function getCambodiaNow() {
  const now = new Date()

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)

  const p = {}
  parts.forEach(x => {
    p[x.type] = x.value
  })

  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

function toLocal(date) {
  if (!date) return ''

  const d = new Date(date)

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(d)

  const p = {}
  parts.forEach(x => {
    p[x.type] = x.value
  })

  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

const localValue = computed(() => {
  if (!props.modelValue && props.useNowIfEmpty) {
    return getCambodiaNow()
  }

  return toLocal(props.modelValue)
})

function onInput(e) {
  const value = e.target.value

  if (!value) {
    emit('update:modelValue', null)
    return
  }

  emit('update:modelValue', `${value}:00+07:00`)
}
</script>