import { ref } from 'vue'

const toastRef = ref(null)

export function useToast() {
  function show(message, type = 'info') {
    toastRef.value?.show(message, type)
  }
  return { toastRef, show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), info: (m) => show(m, 'info') }
}
