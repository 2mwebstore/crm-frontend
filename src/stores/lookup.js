import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLevels, getContactSources, getBankTypes, getProductTypes, getBonusOptions, getCurrencies } from '@/api/lookup'

export const useLookupStore = defineStore('lookup', () => {
  const levels = ref([])
  const contactSources = ref([])
  const bankTypes = ref([])
  const productTypes = ref([])
  const bonusOptions = ref([])
  const currencies = ref([])
  const loaded = ref(false)

  async function loadAll() {
    if (loaded.value) return
    // Promise.allSettled, not Promise.all: these six lookup types are
    // gated by six SEPARATE permissions (levels.view, contact_sources.view,
    // bank_types.view, product_types.view, bonus_options.view,
    // currencies.view). A role can easily have some but not all of them —
    // with Promise.all, a single 403 (e.g. missing levels.view) rejected
    // the whole batch and silently left every OTHER lookup type empty
    // too, even ones the user was fully permitted to see. Each request
    // now succeeds or fails on its own.
    const [l, cs, bt, pt, bo, cur] = await Promise.allSettled([
      getLevels(), getContactSources(), getBankTypes(),
      getProductTypes(), getBonusOptions(), getCurrencies()
    ])
    if (l.status === 'fulfilled')   levels.value        = l.value.data || []
    if (cs.status === 'fulfilled')  contactSources.value = cs.value.data || []
    if (bt.status === 'fulfilled')  bankTypes.value      = bt.value.data || []
    if (pt.status === 'fulfilled')  productTypes.value   = pt.value.data || []
    if (bo.status === 'fulfilled')  bonusOptions.value   = bo.value.data || []
    if (cur.status === 'fulfilled') currencies.value     = cur.value.data || []

    for (const [label, result] of [
      ['levels', l], ['contactSources', cs], ['bankTypes', bt],
      ['productTypes', pt], ['bonusOptions', bo], ['currencies', cur],
    ]) {
      if (result.status === 'rejected') {
        console.error(`Failed to load ${label} (likely missing permission):`, result.reason)
      }
    }

    loaded.value = true
  }

  function refresh() {
    loaded.value = false
    loadAll()
  }

  return { levels, contactSources, bankTypes, productTypes, bonusOptions, currencies, loaded, loadAll, refresh }
})