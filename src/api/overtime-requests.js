import api from './index'

export const createOvertimeRequest  = (data) => api.post('/overtime-requests', data)
export const editOvertimeReason     = (id, reason) => api.patch(`/overtime-requests/${id}`, { reason })
export const cancelOvertimeRequest  = (id) => api.post(`/overtime-requests/${id}/cancel`)
export const getMyOvertimeRequests  = (params = {}) => api.get('/overtime-requests/mine', { params })
export const getOvertimeRequests    = (params = {}) => api.get('/overtime-requests', { params })
export const getOvertimeRequest     = (id) => api.get(`/overtime-requests/${id}`)
export const approveOvertimeRequest = (id) => api.post(`/overtime-requests/${id}/approve`)
export const rejectOvertimeRequest  = (id, reason) => api.post(`/overtime-requests/${id}/reject`, { reason })