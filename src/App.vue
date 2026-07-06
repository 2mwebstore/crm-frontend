<template>
  <RouterView />
  <AppToast ref="toastRef" />
</template>

<script setup>
import { ref } from 'vue'
import AppToast from '@/components/common/AppToast.vue'
import { useToast } from '@/composables/useToast'

const { toastRef } = useToast()
</script>
