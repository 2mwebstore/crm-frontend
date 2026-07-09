import api from './index'
export const getClients = (params) => api.get('/clients', { params })
export const getClient = (id) => api.get(`/clients/${id}`)
export const createClient = (data) => api.post('/clients', data)
export const updateClient = (id, data) => api.put(`/clients/${id}`, data)
export const deleteClient = (id) => api.delete(`/clients/${id}`)
export const uploadPicture = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/clients/${id}/picture`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const addBank = (id, data) => api.post(`/clients/${id}/banks`, data)
export const updateBank = (id, bankId, data) => api.put(`/clients/${id}/banks/${bankId}`, data)
export const deleteBank = (id, bankId) => api.delete(`/clients/${id}/banks/${bankId}`)
export const addProduct = (id, data) => api.post(`/clients/${id}/products`, data)
export const updateProduct = (id, pId, data) => api.put(`/clients/${id}/products/${pId}`, data)
export const deleteProduct = (id, pId) => api.delete(`/clients/${id}/products/${pId}`)
export const getFollowUps = (id, params) => api.get(`/clients/${id}/follow-ups`, { params })
export const addFollowUp = (id, data) => api.post(`/clients/${id}/follow-ups`, data)
export const deleteFollowUp = (id, fuId) => api.delete(`/clients/${id}/follow-ups/${fuId}`)

// Helpers used by transaction forms
export const getClientBanks    = (id) => api.get(`/clients/${id}`).then(r => (r.data?.banks    || []))
export const getClientProducts = (id) => api.get(`/clients/${id}`).then(r => (r.data?.products || []))

export const checkClientCode = (code, excludeId) => api.get('/clients/check-code', { params: { code, exclude_id: excludeId || '' } })
export const previewClientCode = (branchId) => api.get('/clients/preview-code', { params: { branch_id: branchId } })
