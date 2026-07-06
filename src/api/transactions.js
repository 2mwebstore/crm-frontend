import api from './index'

// ── Deposits ──────────────────────────────────────────────────────────────────
export const getDeposits       = (params)    => api.get('/deposits', { params })
export const getDeposit        = (id)        => api.get(`/deposits/${id}`)
export const createDeposit     = (data)      => api.post('/deposits', data)
export const updateDeposit     = (id, data)  => api.put(`/deposits/${id}`, data)
export const deleteDeposit     = (id)        => api.delete(`/deposits/${id}`)
export const approveDeposit    = (id, data)  => api.put(`/deposits/${id}/approve`, data)
export const getDepositBalance = (clientId, productId) =>
  api.get('/deposits/balance', { params: { client_id: clientId, client_product_id: productId } })

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const getWithdrawals       = (params)   => api.get('/withdrawals', { params })
export const getWithdrawal        = (id)       => api.get(`/withdrawals/${id}`)
export const createWithdrawal     = (data)     => api.post('/withdrawals', data)
export const updateWithdrawal     = (id, data) => api.put(`/withdrawals/${id}`, data)
export const deleteWithdrawal     = (id)       => api.delete(`/withdrawals/${id}`)
export const approveWithdrawal    = (id, data) => api.put(`/withdrawals/${id}/approve`, data)
export const getWithdrawalBalance = (clientId, productId) =>
  api.get('/withdrawals/balance', { params: { client_id: clientId, client_product_id: productId } })

export const previewDepositCode    = (branchId)              => api.get('/deposits/preview-code',    { params: { branch_id: branchId } })

export const checkDepositCode      = (code, excludeId)       => api.get('/deposits/check-code',      { params: { code, exclude_id: excludeId || '' } })
export const previewWithdrawalCode = (branchId)              => api.get('/withdrawals/preview-code', { params: { branch_id: branchId } })
export const checkWithdrawalCode   = (code, excludeId)       => api.get('/withdrawals/check-code',   { params: { code, exclude_id: excludeId || '' } })
