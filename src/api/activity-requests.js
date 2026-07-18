import api from './index'

export const createActivityRequest = (data) => api.post('/activity-requests', data)
export const getMyActivityRequests = (params = {}) => api.get('/activity-requests/mine', { params })
export const getActivityRequests   = (params = {}) => api.get('/activity-requests', { params })
export const getActivityRequest    = (id) => api.get(`/activity-requests/${id}`)