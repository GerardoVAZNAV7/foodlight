<template>
  <div class="app-shell" :class="{ 'logged-in': store.isLoggedIn }">
    <!-- Desktop Sidebar Nav -->
    <aside v-if="store.isLoggedIn" class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🚦</span>
        <span class="brand-name">FoodLight</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/semaforo" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">🚦</span>
          <span class="sidebar-label">Semáforo</span>
          <kbd class="shortcut-hint">Alt+S</kbd>
        </router-link>
        
        <router-link to="/diario" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">📅</span>
          <span class="sidebar-label">Diario</span>
          <kbd class="shortcut-hint">Alt+D</kbd>
        </router-link>

        <router-link to="/perfil" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">👤</span>
          <span class="sidebar-label">Perfil</span>
          <kbd class="shortcut-hint">Alt+P</kbd>
        </router-link>
        <router-link to="/recetas" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">🍽️</span>
          <span class="sidebar-label">Recetas</span>
          <kbd class="shortcut-hint">Alt+R</kbd>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">{{ initials }}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ store.authUser?.name?.split(' ')[0] }}</span>
            <span class="sidebar-user-email">{{ store.authUser?.email }}</span>
          </div>
        </div>
        <button class="sidebar-logout" @click="logout" title="Cerrar sesión">
          <span>↩</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Top Navbar -->
    <NavBar v-if="store.isLoggedIn" />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'with-nav': store.isLoggedIn }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Nav -->
    <BottomNav v-if="store.isLoggedIn" />

    <!-- Shortcut toast -->
    <transition name="shortcut-toast">
      <div v-if="shortcutLabel" class="shortcut-toast" aria-live="polite">
        {{ shortcutLabel }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'

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

// ── Shortcut feedback toast ──────────────────────────────────────────────────
const shortcutLabel = ref('')
let shortcutTimer = null

function showShortcut(label) {
  shortcutLabel.value = label
  clearTimeout(shortcutTimer)
  shortcutTimer = setTimeout(() => { shortcutLabel.value = '' }, 1400)
}

// ── Global keyboard shortcuts ────────────────────────────────────────────────
function onKeydown(e) {
  // Solo cuando el usuario está logueado
  if (!store.isLoggedIn) return

  // No activar si está escribiendo en un input/textarea/select
  const tag = document.activeElement?.tagName
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
    // Excepción: Alt+B sí puede activarse desde cualquier lado (va AL buscador, no desde él)
    if (!(e.altKey && e.key === 'b')) return
  }

  if (!e.altKey) return

 switch (e.key) {
    case 's':
      e.preventDefault()
      router.push('/semaforo')
      showShortcut('🚦 Semáforo')
      break
    // Agrega este nuevo caso para el Diario:
    case 'd':
      e.preventDefault()
      router.push('/diario')
      showShortcut('📅 Diario')
      break
    case 'p':
      e.preventDefault()
      router.push('/perfil')
      showShortcut('👤 Perfil')
      break
    case 'r':
      e.preventDefault()
      router.push('/recetas')
      showShortcut('🍽️ Recetas')
      break
    case 'b':
      e.preventDefault()
      // Navega al semáforo si no estamos ahí, luego enfoca el buscador
      if (router.currentRoute.value.path !== '/semaforo') {
        router.push('/semaforo').then(focusSearch)
      } else {
        focusSearch()
      }
      showShortcut('🔍 Buscador')
      break
  }
}

function focusSearch() {
  // Espera al próximo tick para que el DOM esté listo tras la navegación
  setTimeout(() => {
    const el = document.getElementById('semaforo-search')
    if (el) {
      el.focus()
      el.select()
    }
  }, 120)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(shortcutTimer)
})
</script>

<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Shell: mobile-first, desktop grid ── */
.app-shell {
  min-height: 100dvh;
  background: var(--gray-50);
  display: flex;
  flex-direction: column;
}

/* Sidebar hidden on mobile */
.sidebar { display: none; }

/* Mobile: centered card (existing behavior) */
@media (max-width: 767px) {
  .app-shell {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0,0,0,.08);
  }
}

/* ── Desktop Layout ── */
@media (min-width: 768px) {
  .app-shell.logged-in {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 1fr;
    grid-template-areas: "sidebar main";
    min-height: 100dvh;
    max-width: none;
  }

  .app-shell.logged-in .mobile-only-navbar { display: none; }

  .sidebar {
    display: flex;
    flex-direction: column;
    grid-area: sidebar;
    background: white;
    border-right: 1px solid var(--gray-200);
    position: sticky;
    top: 0;
    height: 100dvh;
    padding: 24px 16px;
    gap: 8px;
  }

  .main-content {
    grid-area: main;
    padding-bottom: 0 !important;
    overflow-y: auto;
  }

  .app-shell.logged-in nav.bottom-nav { display: none; }
  .app-shell.logged-in header.navbar { display: none; }
}

@media (min-width: 1200px) {
  .app-shell.logged-in { grid-template-columns: 260px 1fr; }
}

/* ── Sidebar styles ── */
.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px 20px;
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: 8px;
}
.sidebar-brand .brand-icon { font-size: 24px; }
.sidebar-brand .brand-name {
  font-size: 22px; font-weight: 800;
  background: linear-gradient(135deg, var(--green), var(--blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

.sidebar-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  text-decoration: none; color: var(--gray-600);
  font-size: 14px; font-weight: 600;
  transition: all .2s;
}
.sidebar-link:hover { background: var(--gray-100); color: var(--gray-900); }
.sidebar-link.active { background: var(--green-light); color: var(--green-dark); }
.sidebar-icon { font-size: 18px; }
.sidebar-label { font-size: 14px; flex: 1; }

/* ── Shortcut hint badge en sidebar ── */
.shortcut-hint {
  font-size: 10px; font-weight: 700;
  background: var(--gray-100); color: var(--gray-400);
  border: 1px solid var(--gray-200);
  border-radius: 4px; padding: 2px 5px;
  font-family: monospace; letter-spacing: .02em;
  opacity: 0;
  transition: opacity .15s;
  pointer-events: none;
}
.sidebar-link:hover .shortcut-hint,
.sidebar-link.active .shortcut-hint {
  opacity: 1;
}

.sidebar-footer {
  border-top: 1px solid var(--gray-100); padding-top: 16px;
  display: flex; align-items: center; gap: 8px;
}
.sidebar-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.sidebar-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sidebar-user-info { display: flex; flex-direction: column; min-width: 0; }
.sidebar-user-name {
  font-size: 13px; font-weight: 700; color: var(--gray-800);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-user-email {
  font-size: 11px; color: var(--gray-400);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-logout {
  background: var(--gray-100); border: none; border-radius: var(--radius-sm);
  padding: 8px; cursor: pointer; color: var(--gray-500); font-size: 16px;
  transition: all .2s; flex-shrink: 0;
}
.sidebar-logout:hover { background: var(--red-light); color: var(--red); }

/* ── Mobile nav padding ── */
.main-content.with-nav { padding-bottom: 80px; }

/* ── Page transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Shortcut feedback toast ── */
.shortcut-toast {
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8000;
  background: rgba(15, 23, 42, .88);
  color: white;
  font-size: 13px; font-weight: 600;
  padding: 8px 18px;
  border-radius: 99px;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0,0,0,.25);
}

.shortcut-toast-enter-active { transition: opacity .15s ease, transform .15s ease; }
.shortcut-toast-leave-active  { transition: opacity .3s ease, transform .3s ease; }
.shortcut-toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.shortcut-toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
</style>