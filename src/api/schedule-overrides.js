import api from './index'

export const getScheduleOverrides    = (params = {}) => api.get('/schedule-overrides', { params })
export const getScheduleOverridesForUser = (userId) => api.get('/schedule-overrides/for-user', { params: { user_id: userId } })
export const createScheduleOverride  = (data) => api.post('/schedule-overrides', data)
export const updateScheduleOverride  = (id, data) => api.put(`/schedule-overrides/${id}`, data)
export const deleteScheduleOverride  = (id) => api.delete(`/schedule-overrides/${id}`)