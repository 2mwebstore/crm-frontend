<template>
  <RouterView />
  <AppToast ref="toastRef" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppToast from '@/components/common/AppToast.vue'
import { useToast } from '@/composables/useToast'
import { installDevToolsGuard } from '@/composables/useDevToolsGuard'
import { useAuthStore } from '@/stores/auth'

const { toastRef } = useToast()
const auth = useAuthStore()

// Keeps the logged-in user's role/permissions from silently going stale
// during a long-lived session (e.g. an admin reassigns their role while
// they already have a tab open). fetchMe() hits /auth/me, which always
// queries the DB fresh — so this both refreshes what's displayed AND, if
// the session has actually been invalidated (see TokenVersion in the
// backend), naturally surfaces a 401 that the axios interceptor in
// api/index.js already handles with a clean logout — without needing the
// user to happen to click something else first.
let refreshInterval = null
function silentRefresh() {
  if (auth.isLoggedIn) auth.fetchMe().catch(() => {}) // 401s are handled globally by the interceptor
}
function onVisibilityChange() {
  if (document.visibilityState === 'visible') silentRefresh()
}

onMounted(() => {
  // TEMP: forced on for local testing. Restore the PROD check below
  // before deploying, or dev mode will redirect you to /login too.
  // if (import.meta.env.PROD) {
    // installDevToolsGuard()
  // }

  refreshInterval = setInterval(silentRefresh, 2 * 30 * 1000) // every 2 minutes
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>