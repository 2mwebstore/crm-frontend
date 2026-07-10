import api from './index'
export const getLevels = (params) => api.get('/levels', { params })
export const createLevel = (d) => api.post('/levels', d)
export const updateLevel = (id, d) => api.put(`/levels/${id}`, d)
export const deleteLevel = (id) => api.delete(`/levels/${id}`)

export const getContactSources = (params) => api.get('/contact-sources', { params })
export const createContactSource = (d) => api.post('/contact-sources', d)
export const updateContactSource = (id, d) => api.put(`/contact-sources/${id}`, d)
export const deleteContactSource = (id) => api.delete(`/contact-sources/${id}`)

export const getBankTypes = (params) => api.get('/bank-types', { params })
export const createBankType = (d) => api.post('/bank-types', d)
export const updateBankType = (id, d) => api.put(`/bank-types/${id}`, d)
export const deleteBankType = (id) => api.delete(`/bank-types/${id}`)

export const getCompanyBanks = (params) => api.get('/company-banks', { params })
export const createCompanyBank = (d) => api.post('/company-banks', d)
export const updateCompanyBank = (id, d) => api.put(`/company-banks/${id}`, d)
export const deleteCompanyBank = (id) => api.delete(`/company-banks/${id}`)
export const topupCompanyBankCash      = (id, amount, remark) => api.post(`/company-banks/${id}/topup`, { amount, remark })
export const withdrawCompanyBankCash   = (id, amount, remark) => api.post(`/company-banks/${id}/withdraw`, { amount, remark })
export const adjustCompanyBankCash     = (id, direction, amount, remark) => api.post(`/company-banks/${id}/adjust`, { direction, amount, remark })


export const getProductTypes = (params) => api.get('/product-types', { params })
export const createProductType = (d) => api.post('/product-types', d)
export const updateProductType = (id, d) => api.put(`/product-types/${id}`, d)
export const deleteProductType = (id) => api.delete(`/product-types/${id}`)
export const topupProductTypeCredit    = (id, amount, remark) => api.post(`/product-types/${id}/topup`, { amount, remark })
export const withdrawProductTypeCredit = (id, amount, remark) => api.post(`/product-types/${id}/withdraw`, { amount, remark })
export const adjustProductTypeCredit   = (id, direction, amount, remark) => api.post(`/product-types/${id}/adjust`, { direction, amount, remark })

export const getBonusOptions = (params) => api.get('/bonus-option-types', { params })
export const createBonusOption = (d) => api.post('/bonus-option-types', d)
export const updateBonusOption = (id, d) => api.put(`/bonus-option-types/${id}`, d)
export const deleteBonusOption = (id) => api.delete(`/bonus-option-types/${id}`)

export const getCurrencies = (params) => api.get('/currency-types', { params })
export const createCurrency = (d) => api.post('/currency-types', d)
export const updateCurrency = (id, d) => api.put(`/currency-types/${id}`, d)
export const deleteCurrency = (id) => api.delete(`/currency-types/${id}`)

// export const getBalanceTransactions    = (entityType, entityId) => api.get('/balance-transactions', { params: { entity_type: entityType, entity_id: entityId } })
export const getBalanceTransactions = (entityType, entityId, params = {}) => api.get('/balance-transactions', { params: { entity_type: entityType, entity_id: entityId, ...params } })