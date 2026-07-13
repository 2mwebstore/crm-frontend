<template>
  <RouterView />
  <AppToast ref="toastRef" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppToast from '@/components/common/AppToast.vue'
import { useToast } from '@/composables/useToast'
import { installDevToolsGuard } from '@/composables/useDevToolsGuard'

const { toastRef } = useToast()

onMounted(() => {
  // Only in production builds — local dev needs DevTools to work.
  if (import.meta.env.PROD) {
    installDevToolsGuard()
  }
})
</script>