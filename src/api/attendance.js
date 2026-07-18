import api from './index'

export const checkIn = (branchId, latitude, longitude, reason = '') =>
  api.post('/attendance/check-in', { branch_id: branchId, latitude, longitude, reason })
export const checkOut = (branchId, latitude, longitude, reason = '') =>
  api.post('/attendance/check-out', { branch_id: branchId, latitude, longitude, reason })
export const getTodayAttendance = (branchId) => api.get('/attendance/today', { params: { branch_id: branchId } })
export const getMyAttendance = (params = {}) => api.get('/attendance/mine', { params })
export const getAttendanceList = (params = {}) => api.get('/attendance', { params })
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data)
export const getAttendanceSummary = (params = {}) => api.get('/attendance/summary', { params })
export const getPayrollExport = (params = {}) => api.get('/attendance/payroll-export', { params, responseType: 'blob' })