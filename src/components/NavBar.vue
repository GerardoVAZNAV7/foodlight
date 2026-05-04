<template>
  <header class="navbar">
    <div class="navbar-brand">
      <span class="brand-icon">🚦</span>
      <span class="brand-name">FoodLight</span>
    </div>
    <div class="navbar-right">
      <span class="user-greeting">Hola, {{ store.authUser?.name?.split(' ')[0] }} 👋</span>
      <button class="avatar-btn" @click="logout" title="Cerrar sesión">
        {{ initials }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

const store = useUserStore()
const router = useRouter()

const initials = computed(() => {
  const n = store.authUser?.name || ''
  return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

function logout() {
  if (confirm('¿Cerrar sesión?')) {
    store.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid var(--gray-100);
  backdrop-filter: blur(12px);
}
.navbar-brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { font-size: 22px; }
.brand-name { font-size: 20px; font-weight: 800; color: var(--gray-900);
  background: linear-gradient(135deg, var(--green), var(--blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.navbar-right { display: flex; align-items: center; gap: 10px; }
.user-greeting { font-size: 13px; color: var(--gray-500); }
.avatar-btn {
  width: 36px; height: 36px;
  border-radius: 50%; border: none;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: transform .2s;
}
.avatar-btn:hover { transform: scale(1.05); }
</style>
