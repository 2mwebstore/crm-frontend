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
    try {
      const [l, cs, bt, pt, bo, cur] = await Promise.all([
        getLevels(), getContactSources(), getBankTypes(),
        getProductTypes(), getBonusOptions(), getCurrencies()
      ])
      levels.value = l.data || []
      contactSources.value = cs.data || []
      bankTypes.value = bt.data || []
      productTypes.value = pt.data || []
      bonusOptions.value = bo.data || []
      currencies.value = cur.data || []
      loaded.value = true
    } catch (e) {
      console.error('Failed to load lookup data', e)
    }
  }

  function refresh() {
    loaded.value = false
    loadAll()
  }

  return { levels, contactSources, bankTypes, productTypes, bonusOptions, currencies, loaded, loadAll, refresh }
})
