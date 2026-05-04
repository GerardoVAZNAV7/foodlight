<template>
  <transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`" role="status" aria-live="polite">
      <span class="toast-icon">{{ icons[type] }}</span>
      <span>{{ message }}</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ message: String, type: { type: String, default: 'success' }, show: Boolean })
const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', loading: '⏳' }
const visible = ref(false)
let timer = null
watch(() => props.show, (v) => {
  if (v) {
    visible.value = true
    clearTimeout(timer)
    if (props.type !== 'loading') timer = setTimeout(() => visible.value = false, 3000)
  } else {
    visible.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.toast {
  position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
  z-index: 9999;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px;
  border-radius: var(--radius-md);
  font-size: 14px; font-weight: 600;
  box-shadow: var(--shadow-lg);
  white-space: nowrap;
  max-width: 360px;
}
.toast-success { background: var(--green); color: white; }
.toast-error { background: var(--red); color: white; }
.toast-info { background: var(--blue); color: white; }
.toast-warning { background: var(--yellow); color: white; }
.toast-loading { background: var(--gray-800); color: white; }

.toast-enter-active, .toast-leave-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
