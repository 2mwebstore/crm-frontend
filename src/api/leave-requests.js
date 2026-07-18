import api from './index'

export const createLeaveRequest  = (data) => api.post('/leave-requests', data)
export const editLeaveReason     = (id, reason) => api.patch(`/leave-requests/${id}`, { reason })
export const cancelLeaveRequest  = (id) => api.post(`/leave-requests/${id}/cancel`)
export const getMyLeaveRequests  = (params = {}) => api.get('/leave-requests/mine', { params })
export const getLeaveRequests    = (params = {}) => api.get('/leave-requests', { params })
export const getLeaveRequest     = (id) => api.get(`/leave-requests/${id}`)
export const approveLeaveRequest = (id) => api.post(`/leave-requests/${id}/approve`)
export const rejectLeaveRequest  = (id, reason) => api.post(`/leave-requests/${id}/reject`, { reason })