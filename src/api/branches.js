import api from './index'
export const getBranches    = (params)   => api.get('/branches', { params })
export const getBranch      = (id)       => api.get(`/branches/${id}`)
export const createBranch   = (data)     => api.post('/branches', data)
export const updateBranch   = (id, data) => api.put(`/branches/${id}`, data)
export const deleteBranch   = (id)       => api.delete(`/branches/${id}`)
export const assignUserBranches = (userId, branchIds) => api.put(`/users/admin/${userId}/branches`, { branch_ids: branchIds })
export const getUserBranches    = (userId) => api.get(`/users/admin/${userId}`)
