import api from './index'

export const getAuditLogs = (params = {}) => api.get('/audit-logs', { params })
export const deleteOldAuditLogs = (period) => api.delete('/audit-logs', { params: { period } })