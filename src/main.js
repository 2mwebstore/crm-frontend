import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Restore user session before first render
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
if (auth.token) {
  auth.fetchMe().finally(() => app.mount('#app'))
} else {
  app.mount('#app')
}