import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getMe } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(localStorage.getItem('crm_token') || null)

  const isLoggedIn   = computed(() => !!token.value)
  const isSuperAdmin = computed(() => !!user.value?.is_super_admin)

  const userPermissions = computed(() => {
    if (!user.value?.role?.permissions) return []
    return user.value.role.permissions.map(p => p.name)
  })

  // Returns true if user has the given permission (or is Super Admin)
  function can(perm) {
    if (user.value?.is_super_admin) return true
    return userPermissions.value.includes(perm)
  }

  // Returns true if user has ANY of the given permissions (or is Super Admin)
  function canAny(...perms) {
    if (user.value?.is_super_admin) return true
    return perms.some(p => userPermissions.value.includes(p))
  }

  // Returns true if user has ALL of the given permissions (or is Super Admin)
  function canAll(...perms) {
    if (user.value?.is_super_admin) return true
    return perms.every(p => userPermissions.value.includes(p))
  }

  async function login(credentials) {
    const res = await apiLogin(credentials)
    token.value = res.data.token
    user.value  = res.data.user
    localStorage.setItem('crm_token', res.data.token)
  }

  async function fetchMe() {
    try {
      const res = await getMe()
      user.value = res.data
    } catch {
      logout()
    }
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('crm_token')
  }

  return {
    user, token,
    isLoggedIn, isSuperAdmin,
    userPermissions,
    can, canAny, canAll,
    login, fetchMe, logout
  }
})