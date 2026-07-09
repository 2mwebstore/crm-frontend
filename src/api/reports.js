import api from './index'
export const getBankSummary     = (params) => api.get('/reports/bank-summary', { params })
export const getAllTransactions = (params) => api.get('/reports/transactions', { params })