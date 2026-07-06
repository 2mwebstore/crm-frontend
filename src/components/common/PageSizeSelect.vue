<!-- Reusable page size selector -->
<template>
  <div class="flex items-center gap-2 text-sm text-gray-500">
    <span>Show</span>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', Number($event.target.value))"
      class="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white outline-none focus:border-primary"
    >
      <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
    </select>
    <span>per page</span>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: Number, default: 20 } })
defineEmits(['update:modelValue'])
const sizes = [10, 20, 50, 100]
</script>
