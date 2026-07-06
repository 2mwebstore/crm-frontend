<!--
  RequiredFieldsGuard.vue

  Wraps content (typically a submit button) and tells you whether every
  required field has a value, via a scoped slot. Keeps "is this form
  actually fillable?" logic in one place instead of duplicating manual
  `:disabled="saving || !branchId || !form.client_id || ..."` checks in
  every form view.

  Usage:
    <RequiredFieldsGuard
      :fields="{ Branch: branchId, Client: form.client_id, Amount: form.amount }"
      v-slot="{ isValid, missing }"
    >
      <button :disabled="saving || !isValid" :title="missing.join(', ')">
        Save
      </button>
    </RequiredFieldsGuard>

  A field counts as "missing" if its value is null, undefined, '', or 0
  (0 is treated as unset for required numeric fields like Amount - a
  deposit/withdrawal of 0 isn't a valid submission).
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Map of { "Field Label": currentValue }
  fields: { type: Object, required: true }
})

function isEmpty(v) {
  return v === null || v === undefined || v === '' || v === 0
}

const missing = computed(() =>
  Object.entries(props.fields)
    .filter(([, value]) => isEmpty(value))
    .map(([label]) => label)
)

const isValid = computed(() => missing.value.length === 0)

defineExpose({ isValid, missing })
</script>

<template>
  <slot :is-valid="isValid" :missing="missing" />
</template>