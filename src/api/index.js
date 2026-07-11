import axios from 'axios'

const api = axios.create({
  // baseURL: '/api/v1',
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('crm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    // A 401 from the login endpoint itself just means "wrong credentials"
    // — that should surface as an inline error on the login form, not
    // trigger a full page reload. Only an authenticated request getting
    // rejected (an actual expired/invalid session) should force a
    // logout-redirect.
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('crm_token')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api