import api from './index'

// ── Super Admin endpoints ─────────────────────────────────────────────────────
export const adminListUsers   = ()        => api.get('/users/admin')
export const adminCreateUser  = (data)    => api.post('/users/admin', data)
export const adminUpdateUser  = (id, data) => api.put(`/users/admin/${id}`, data)
export const adminDeleteUser  = (id)      => api.delete(`/users/admin/${id}`)

// ── Simple / Sub-user endpoints ───────────────────────────────────────────────
export const getSubUsers    = ()        => api.get('/users/sub-users')
export const getSubUser     = (id)      => api.get(`/users/sub-users/${id}`)
export const createSubUser  = (data)    => api.post('/users/sub-users', data)
export const updateSubUser  = (id, data) => api.put(`/users/sub-users/${id}`, data)
export const deleteSubUser  = (id)      => api.delete(`/users/sub-users/${id}`)

export const adminGetUsers = () => api.get('/users/admin')

export const getUsersInScope = () => api.get('/users/in-scope')
