/**
 * Formats a monetary amount for display, given its currency code.
 * USD uses Intl.NumberFormat's standard $ prefix; KHR uses the ៛ symbol,
 * also prefixed, for visual consistency between the two. Both are capped
 * at 2 decimal places.
 */
export function formatCurrency(val, currency) {
  const amount = Number(val || 0)
  if (currency === 'KHR') {
    return '៛' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)
}

/**
 * Same grouping/decimal rules as formatCurrency, but without the currency
 * symbol - for places that prepend their own symbol/sign (e.g. summary
 * cards showing "-$1,234.00" with a separate minus sign, or a shared
 * color/style wrapper around just the symbol). Always capped at 2 decimal
 * places, for every currency - a bare number with no explicit cap can show
 * up to 3 fraction digits by default, which reads inconsistently next to
 * everywhere else that's pinned to 2.
 */
export function formatNumber(val) {
  return Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Sums a numeric field across a list of records, restricted to a given
 * currency. Used throughout the reports to build per-currency totals.
 */
export function sumByCurrency(items, currency, field) {
  return (items || []).filter(i => i.currency === currency).reduce((s, i) => s + (i[field] || 0), 0)
}