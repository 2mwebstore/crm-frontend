import api from './index'

export const startTodayBalance = (branchId) => api.post('/daily-balances/start', { branch_id: branchId })
export const closeTodayBalance = (branchId) => api.post('/daily-balances/close', { branch_id: branchId })
export const getTodayBalance   = (branchId) => api.get('/daily-balances/today', { params: { branch_id: branchId } })
export const getBalanceHistory = (branchId, params = {}) => api.get('/daily-balances/history', { params: { branch_id: branchId, ...params } })
export const getShiftBalanceTransactions = (shiftId) => api.get(`/daily-balances/${shiftId}/balance-transactions`)