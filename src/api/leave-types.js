import api from './index'

// annual_limit/monthly_limit are *int on the backend — an empty number
// input leaves them as '' (not automatically null), which Go's *int can't
// unmarshal at all. Normalized here rather than inside LookupCrudView,
// since that's a shared component used by every other lookup type too.
function normalizeLimits(data) {
  const out = { ...data }
  for (const key of ['annual_limit', 'monthly_limit']) {
    out[key] = out[key] === '' || out[key] === undefined ? null : out[key]
    if (Number.isNaN(out[key])) out[key] = null
  }
  return out
}

export const getLeaveTypes  = (params = {}) => api.get('/leave-types', { params })
export const createLeaveType = (data) => api.post('/leave-types', normalizeLimits(data))
export const updateLeaveType = (id, data) => api.put(`/leave-types/${id}`, normalizeLimits(data))
export const deleteLeaveType = (id) => api.delete(`/leave-types/${id}`)