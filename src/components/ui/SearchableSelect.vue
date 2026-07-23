<!-- src/components/ui/SearchableSelect.vue -->
<template>
  <div class="relative" ref="wrapper">
    <!-- Trigger -->
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg
             px-3 py-2 text-[13.5px] bg-white outline-none text-left
             hover:border-gray-300 transition-colors"
      :class="open ? 'border-primary ring-1 ring-primary/20' : ''"
      @click="toggle"
    >
      <span :class="hasValue ? 'text-gray-800' : 'text-gray-400'">
        {{ hasValue ? labelOf(modelValue) : placeholder }}
      </span>
      <span class="flex items-center gap-1 shrink-0">
        <button
          v-if="hasValue && clearable"
          type="button"
          class="text-gray-300 hover:text-gray-500 p-0.5"
          @click.stop="clear"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
        <ChevronDownIcon
          class="w-3.5 h-3.5 text-gray-400 transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </span>
    </button>

    <!-- Dropdown (teleported to body  to avoid overflow clipping) -->
    <Teleport to="body">
      <div
        v-if="open"
        :style="dropStyle"
        data-searchable-drop
        class="fixed z-[9000] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        style="min-width:200px"
      >
        <!-- Search -->
        <div class="px-2.5 pt-2.5 pb-1.5 border-b border-gray-100">
          <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <MagnifyingGlassIcon class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref="searchRef"
              v-model="query"
              @input="onQueryInput"
              class="bg-transparent outline-none text-sm flex-1 text-gray-800"
              :placeholder="`Search…`"
            />
            <button v-if="query" type="button" @click="query = ''" class="text-gray-300 hover:text-gray-500">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Options -->
        <div class="overflow-y-auto" style="max-height:220px">
          <div v-if="isAsync && asyncLoading" class="px-3 py-4 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Searching…
          </div>
          <div v-else-if="!filtered.length" class="px-3 py-4 text-sm text-gray-400 text-center">
            No results
          </div>

          <!-- All / None option -->
          <button
            v-if="showAll"
            type="button"
            class="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors flex items-center gap-2"
            :class="!hasValue ? 'text-primary font-medium bg-primary/5' : 'text-gray-500'"
            @mousedown.prevent="pick(null)"
          >
            <CheckIcon class="w-3 h-3 flex-shrink-0" :class="!hasValue ? 'opacity-100 text-primary' : 'opacity-0'" />
            {{ allLabel }}
          </button>

          <button
            v-for="item in filtered"
            :key="item[valueKey]"
            type="button"
            class="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors flex items-center gap-2"
            :class="isSelected(item[valueKey]) ? 'text-primary font-medium bg-primary/5' : 'text-gray-800'"
            @mousedown.prevent="pick(item[valueKey])"
          >
            <CheckIcon class="w-3 h-3 flex-shrink-0 text-primary" :class="isSelected(item[valueKey]) ? 'opacity-100' : 'opacity-0'" />
            <span class="truncate">{{ item[labelKey] }}</span>
            <span v-if="item.sub" class="ml-auto text-xs text-gray-400 truncate">{{ item.sub }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { XMarkIcon, ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue: { default: null },
  options:    { type: Array, default: () => [] },
  valueKey:   { type: String, default: 'id' },
  labelKey:   { type: String, default: 'name' },
  placeholder:{ type: String, default: 'Select…' },
  allLabel:   { type: String, default: '— Select —' },
  showAll:    { type: Boolean, default: true },   // show the "All/None" option
  clearable:  { type: Boolean, default: true },
  // Optional async/server-side search — when provided, typing in the
  // dropdown's search box calls this function (debounced) instead of
  // filtering the static `options` prop client-side. Needed for large
  // lists (e.g. every client in the system) where loading everything
  // upfront isn't practical — without this, a static preloaded page
  // (e.g. the first 500 clients) silently can't ever surface anything
  // beyond that first batch, no matter what's typed.
  // Signature: (query: string) => Promise<Array<option>>
  searchFn: { type: Function, default: null },
  // Optional — the display label for whatever modelValue already IS when
  // this component mounts, before any search has run. Needed specifically
  // for async mode on an edit form: modelValue might already be set (e.g.
  // client_id: 42 loaded from an existing record) but asyncOptions is
  // still empty since no search has happened yet, so labelOf would
  // otherwise have nothing to show but the raw ID. Once the user actually
  // searches/picks something, the real option data takes over and this is
  // no longer consulted.
  initialLabel: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])

const open      = ref(false)
const query     = ref('')
const wrapper   = ref(null)
const searchRef = ref(null)
const dropStyle = ref({})

// Async search state — only used when props.searchFn is set.
const asyncOptions = ref([])
const asyncLoading = ref(false)
let asyncDebounce = null
// Remembers the full option object for whatever was last picked via this
// dropdown, so its label keeps displaying correctly even after a later
// search's results no longer include it (the whole point of async mode
// is that most options AREN'T loaded at any given moment).
const selectedOptionCache = ref(null)

const isAsync = computed(() => typeof props.searchFn === 'function')

const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '')

function isSelected(val) {
  return props.modelValue === val
}

function labelOf(val) {
  if (val === null || val === undefined || val === '') return props.placeholder
  if (isAsync.value && selectedOptionCache.value && selectedOptionCache.value[props.valueKey] === val) {
    return selectedOptionCache.value[props.labelKey]
  }
  const pool = isAsync.value ? asyncOptions.value : props.options
  const item = pool.find(o => o[props.valueKey] === val)
  if (item) return item[props.labelKey]
  if (isAsync.value && props.initialLabel) return props.initialLabel
  return String(val)
}

const filtered = computed(() => {
  // Async mode: the server already filtered by query — show its results
  // as-is, no further client-side narrowing.
  if (isAsync.value) return asyncOptions.value
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(o =>
    String(o[props.labelKey] || '').toLowerCase().includes(q) ||
    String(o.sub || '').toLowerCase().includes(q)
  )
})

async function runAsyncSearch(q) {
  asyncLoading.value = true
  try {
    asyncOptions.value = await props.searchFn(q)
  } catch {
    asyncOptions.value = []
  } finally {
    asyncLoading.value = false
  }
}

function onQueryInput() {
  if (!isAsync.value) return
  clearTimeout(asyncDebounce)
  asyncDebounce = setTimeout(() => runAsyncSearch(query.value), 300)
}

function calcDropStyle() {
  if (!wrapper.value) return
  const r = wrapper.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - r.bottom
  const above = spaceBelow < 280

  dropStyle.value = {
    width: Math.max(r.width, 220) + 'px',
    left:  r.left + 'px',
    ...(above
      ? { bottom: (window.innerHeight - r.top + 4) + 'px', top: 'auto' }
      : { top:    (r.bottom + 4) + 'px',                   bottom: 'auto' }),
  }
}

async function toggle() {
  if (open.value) { open.value = false; return }
  calcDropStyle()
  open.value = true
  query.value = ''
  await nextTick()
  searchRef.value?.focus()
  if (isAsync.value) runAsyncSearch('')
}

function pick(val) {
  if (isAsync.value) {
    selectedOptionCache.value = asyncOptions.value.find(o => o[props.valueKey] === val) || selectedOptionCache.value
  }
  emit('update:modelValue', val)
  open.value = false
  query.value = ''
}

function clear() {
  emit('update:modelValue', null)
}

function onOutside(e) {
  if (!open.value) return
  if (wrapper.value?.contains(e.target)) return
  const drop = document.querySelector('[data-searchable-drop]')
  if (drop?.contains(e.target)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutside)
  clearTimeout(asyncDebounce)
})
</script>