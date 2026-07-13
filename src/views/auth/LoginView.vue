<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:#f8f8f8">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="card p-6 sm:p-8">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style="background:#938af4">
            <span class="text-white font-bold text-xl">C</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">CRM Admin</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label">Email address</label>
            <input v-model="form.email" type="email" class="input" placeholder="admin@crm" required />
          </div>
          <div>
            <label class="label">Password</label>
            <div class="relative">
              <input v-model="form.password" :type="showPw ? 'text' : 'password'" class="input pr-10" placeholder="••••••••" required />
              <button type="button" @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon v-if="!showPw" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

          <button type="submit" class="btn-primary w-full py-2.5" :disabled="loading">
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Signing in...
            </span>
            <span v-else>Sign in</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookup'

const auth = useAuthStore()
const lookup = useLookupStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPw = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value)
    await lookup.loadAll()
    router.push('/dashboard')
  } catch (e) {
    error.value = e?.error || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>