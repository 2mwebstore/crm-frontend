import api from './index'
export const getICs = (params) => api.get('/interesting-clients', { params })
export const getIC = (id) => api.get(`/interesting-clients/${id}`)
export const createIC = (data) => api.post('/interesting-clients', data)
export const updateIC = (id, data) => api.put(`/interesting-clients/${id}`, data)
export const deleteIC = (id) => api.delete(`/interesting-clients/${id}`)
export const convertIC = (id, data) => api.post(`/interesting-clients/${id}/convert`, data)
export const updateICPhone = (id, phoneId, data) => api.put(`/interesting-clients/${id}/phones/${phoneId}`, data)
export const deleteICPhone = (id, phoneId) => api.delete(`/interesting-clients/${id}/phones/${phoneId}`)

export const checkICCode = (code, excludeId) => api.get('/interesting-clients/check-code', { params: { code, exclude_id: excludeId || '' } })

export const previewICCode = (branchId) => api.get('/interesting-clients/preview-code', { params: { branch_id: branchId } })
