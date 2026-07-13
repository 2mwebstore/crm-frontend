<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40" @click="$emit('update:modelValue', false)" />
        <div :class="['relative card shadow-xl w-full', sizeClass]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-base font-semibold text-gray-800">{{ title }}</h2>
            <button @click="$emit('update:modelValue', false)" class="btn-icon">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <!-- Body -->
          <div class="px-6 py-4 overflow-y-auto" :style="{ maxHeight: '75vh' }">
            <slot />
          </div>
          <!-- Footer -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }
})
defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl'
}[props.size] || 'max-w-lg'))
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform .2s; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(.96); }
</style>
