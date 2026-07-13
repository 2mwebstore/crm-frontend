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
  const isProdMode = import.meta.env.MODE === true
  if (isProdMode) {
    installDevToolsGuard()
  }
})
</script>