<template>
  <span :class="['badge', colorClass]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String, type: { type: String, default: 'client' } })

const config = {
  client: {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    lead: 'bg-blue-100 text-blue-700',
    prospect: 'bg-purple-100 text-purple-700',
    churned: 'bg-red-100 text-red-700',
  },
  priority: {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  },
  bool: {
    true: 'bg-green-100 text-green-700',
    false: 'bg-gray-100 text-gray-500',
  }
}

const colorClass = computed(() => {
  const map = config[props.type] || config.client
  return map[String(props.status)] || 'bg-gray-100 text-gray-600'
})
const label = computed(() => {
  if (props.type === 'bool') return props.status ? 'Yes' : 'No'
  return String(props.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
})
</script>
