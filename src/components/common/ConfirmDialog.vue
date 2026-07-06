<template>
  <AppModal :model-value="modelValue" title="Confirm" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-sm text-gray-600">{{ message }}</p>
    <template #footer>
      <button @click="$emit('update:modelValue', false)" class="btn-secondary">Cancel</button>
      <button @click="confirm" class="btn-danger" :disabled="loading">
        <span v-if="loading" class="flex items-center gap-1">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Deleting...
        </span>
        <span v-else>Delete</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref } from 'vue'
import AppModal from './AppModal.vue'

const props = defineProps({
  modelValue: Boolean,
  message: { type: String, default: 'Are you sure you want to delete this item? This action cannot be undone.' }
})
const emit = defineEmits(['update:modelValue', 'confirm'])
const loading = ref(false)

async function confirm() {
  loading.value = true
  emit('confirm')
  loading.value = false
  emit('update:modelValue', false)
}
</script>
