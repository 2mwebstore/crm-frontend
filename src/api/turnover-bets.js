import api from './index'
export const getTurnoverBets   = (params)   => api.get('/turnover-bets', { params })
export const getTurnoverBet    = (id)       => api.get(`/turnover-bets/${id}`)
export const createTurnoverBet = (data)     => api.post('/turnover-bets', data)
export const updateTurnoverBet = (id, data) => api.put(`/turnover-bets/${id}`, data)
export const deleteTurnoverBet = (id)       => api.delete(`/turnover-bets/${id}`)
export const approveTurnoverBet= (id, data) => api.put(`/turnover-bets/${id}/approve`, data)

export const previewTurnoverCode = (branchId) => api.get('/turnover-bets/preview-code', { params: { branch_id: branchId } })
