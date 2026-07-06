import api from './index'
export const getFollowUps   = (params)   => api.get('/follow-ups', { params })
export const getFollowUp    = (id)       => api.get(`/follow-ups/${id}`)
export const createFollowUp = (data)     => api.post('/follow-ups', data)
export const deleteFollowUp = (id)       => api.delete(`/follow-ups/${id}`)

export const previewFollowUpCode = (branchId) => api.get('/follow-ups/preview-code', { params: { branch_id: branchId } })
