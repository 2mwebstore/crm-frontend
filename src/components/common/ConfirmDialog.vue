<template>
  <AppModal :model-value="modelValue" :title="title" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-sm text-gray-600">{{ message }}</p>
    <template #footer>
      <button @click="$emit('update:modelValue', false)" class="btn-secondary">Cancel</button>
      <button @click="confirm" :class="variant === 'primary' ? 'btn-primary' : 'btn-danger'" :disabled="loading">
        <span v-if="loading" class="flex items-center gap-1">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {{ confirmingLabel }}
        </span>
        <span v-else>{{ confirmLabel }}</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref } from 'vue'
import AppModal from './AppModal.vue'

const props = defineProps({
  modelValue: Boolean,
  message: { type: String, default: 'Are you sure you want to delete this item? This action cannot be undone.' },
  // Generalized so this dialog can be reused for non-destructive
  // confirmations too (e.g. Start/Close Shift), not just deletes — every
  // prop below defaults to the exact original delete-confirmation wording
  // and styling, so no existing caller needs to change.
  title:           { type: String, default: 'Confirm' },
  confirmLabel:    { type: String, default: 'Delete' },
  confirmingLabel: { type: String, default: 'Deleting...' },
  // 'danger' (red, default — matches original) or 'primary' (blue) for a
  // non-destructive confirmation like starting/closing a shift.
  variant:         { type: String, default: 'danger' },
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