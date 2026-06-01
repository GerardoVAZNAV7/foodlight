<template>
  <header class="navbar">
    <div class="brand">
      <span class="traffic-light">🚦</span>
      <h1 class="brand-name">FoodLight</h1>
    </div>

    <div class="user-section">
      <!-- Toggle de tema (solo en mobile - oculto en desktop por CSS) -->
      <DarkModeToggle class="mobile-theme-toggle" />

      <span class="greeting">Hola {{ username }}!</span>
      
      <div class="avatar-wrapper">
        <div class="avatar" @click="toggleMenu">
          {{ userInitial }}
        </div>

        <transition name="dropdown">
          <div v-if="isMenuOpen" class="profile-dropdown">
            <div class="dropdown-header">
              <div class="avatar large">{{ userInitial }}</div>
              <div class="user-info">
                <p class="user-email">{{ fullEmail }}</p>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-actions">
              <button @click="handleLogout" class="logout-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

const store = useUserStore()
const router = useRouter()

const isMenuOpen = ref(false)

const fullEmail = computed(() => {
  return store.authUser?.email || store.profile?.email || ''
})

const username = computed(() => {
  const email = fullEmail.value
  if (email && email.includes('@')) {
    return email.split('@')[0]
  }
  return 'usuario' 
})

const userInitial = computed(() => {
  return fullEmail.value ? fullEmail.value.charAt(0).toUpperCase() : 'U'
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleLogout = async () => {
  isMenuOpen.value = false
  if (store.logout) {
    await store.logout()
  }
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--bg-surface);
  position: relative;
  z-index: 50;
  border-bottom: 1px solid var(--border-light);
  transition: background .3s ease, border-color .3s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00bfa5;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.greeting {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* ── Toggle sólo visible en mobile ── */
.mobile-theme-toggle {
  display: flex;
}

/* En desktop, el toggle va en la sidebar; aquí lo ocultamos */
@media (min-width: 768px) {
  .mobile-theme-toggle {
    display: none;
  }
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1976D2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.avatar.large {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  margin: 0 auto 0.5rem auto;
  cursor: default;
}

.profile-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 280px;
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 1rem 0;
  z-index: 100;
  border: 1px solid var(--border-color);
  transition: background .3s, border-color .3s;
}

.dropdown-header {
  text-align: center;
  padding: 0.5rem 1.5rem 1rem 1.5rem;
}

.user-email {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  word-break: break-all;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-light);
  margin: 0.5rem 0;
}

.dropdown-actions {
  padding: 0 0.5rem;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  padding: 0.75rem;
  color: #d32f2f;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: var(--red-light);
}

.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
}

@media (max-width: 380px) {
  .greeting {
    display: none;
  }
}
</style>