<template>
  <div class="flex h-screen overflow-hidden" style="background:#f8f8f8">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppNavbar @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />
      <main ref="mainEl" @scroll="onScroll" class="flex-1 overflow-y-auto p-4 sm:p-6 app-main-scroll">
        <RouterView />
      </main>
    </div>
    <MobileTabBar :hidden="tabBarHidden" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppNavbar from './AppNavbar.vue'
import MobileTabBar from './MobileTabBar.vue'

const sidebarCollapsed = ref(false)

// Hide the mobile bottom tab bar while scrolling down (more room for
// content), reveal it again when scrolling up or once back near the top.
const mainEl = ref(null)
const tabBarHidden = ref(false)
let lastScrollTop = 0

function onScroll() {
  const el = mainEl.value
  if (!el) return
  const st = el.scrollTop

  if (st < 40) {
    tabBarHidden.value = false // always show near the top
  } else if (st > lastScrollTop + 4) {
    tabBarHidden.value = true // scrolling down
  } else if (st < lastScrollTop - 4) {
    tabBarHidden.value = false // scrolling up
  }
  lastScrollTop = st
}
</script>
