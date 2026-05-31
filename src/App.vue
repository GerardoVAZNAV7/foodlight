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
         <router-link to="/reportes" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">📈</span>
          <span class="sidebar-label">Reportes</span>
          <kbd class="shortcut-hint">Alt+F</kbd>
        </router-link>
      </nav>

      <!-- Footer con dropdown de usuario estilo Google -->
      <div class="sidebar-footer" ref="footerRef">
        <button class="sidebar-user-btn" @click="toggleUserMenu" :class="{ open: userMenuOpen }">
          <div class="sidebar-avatar">{{ initials }}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ store.authUser?.name?.split(' ')[0] }}</span>
            <span class="sidebar-user-email">{{ store.authUser?.email }}</span>
          </div>
          <span class="chevron">{{ userMenuOpen ? '▲' : '▼' }}</span>
        </button>

        <!-- Dropdown popup -->
        <transition name="user-menu">
          <div v-if="userMenuOpen" class="user-dropdown">
            <!-- Header con saludo y avatar -->
            <div class="ud-header">
              <div class="ud-avatar">{{ initials }}</div>
              <div class="ud-info">
                <span class="ud-greeting">Hola, {{ store.authUser?.name?.split(' ')[0] }} 👋</span>
                <span class="ud-name">{{ store.authUser?.name }}</span>
                <span class="ud-email">{{ store.authUser?.email }}</span>
              </div>
            </div>

            <div class="ud-divider"></div>

            <!-- Acciones -->
            <div class="ud-actions">
              <router-link to="/perfil" class="ud-item" @click="userMenuOpen = false">
                <span class="ud-item-icon">👤</span>
                <span>Ver perfil</span>
              </router-link>
              <button class="ud-item ud-logout" @click="logout">
                <span class="ud-item-icon">↩</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </transition>
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



// DESPUÉS
  const initials = computed(() => {
  const n = store.authUser?.name || store.authUser?.email || ''
  if (!n) return '?'
  return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

// ── Dropdown de usuario ──────────────────────────────────────────────────────
const userMenuOpen = ref(false)
const footerRef = ref(null)

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function logout() {
  userMenuOpen.value = false
  store.logout()
  router.push('/login')
}

// Cerrar al hacer clic fuera
function onClickOutside(e) {
  if (footerRef.value && !footerRef.value.contains(e.target)) {
    userMenuOpen.value = false
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
  if (!store.isLoggedIn) return
  const tag = document.activeElement?.tagName
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
    if (!(e.altKey && e.key === 'b')) return
  }
  if (!e.altKey) return

  switch (e.key) {
    case 's':
      e.preventDefault()
      router.push('/semaforo')
      showShortcut('🚦 Semáforo')
      break
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
      if (router.currentRoute.value.path !== '/semaforo') {
        router.push('/semaforo').then(focusSearch)
      } else {
        focusSearch()
      }
      showShortcut('🔍 Buscador')
      break
      case 'f':
      e.preventDefault()
      if (router.currentRoute.value.path !== '/reportes') {
        router.push('/reportes').then(focusSearch)
      } else {
        focusSearch()
      }
      showShortcut('📈 Reportes')
      break
  }
}

function focusSearch() {
  setTimeout(() => {
    const el = document.getElementById('semaforo-search')
    if (el) { el.focus(); el.select() }
  }, 120)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutside)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutside)
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

.sidebar { display: none; }

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

.shortcut-hint {
  font-size: 10px; font-weight: 700;
  background: var(--gray-100); color: var(--gray-400);
  border: 1px solid var(--gray-200);
  border-radius: 4px; padding: 2px 5px;
  font-family: monospace; letter-spacing: .02em;
  opacity: 0; transition: opacity .15s; pointer-events: none;
}
.sidebar-link:hover .shortcut-hint,
.sidebar-link.active .shortcut-hint { opacity: 1; }

/* ── Sidebar footer con dropdown ── */
.sidebar-footer {
  border-top: 1px solid var(--gray-100);
  padding-top: 12px;
  position: relative;
}

.sidebar-user-btn {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: transparent; border: none; border-radius: var(--radius-md);
  cursor: pointer; transition: background .2s; text-align: left;
}
.sidebar-user-btn:hover { background: var(--gray-100); }
.sidebar-user-btn.open  { background: var(--gray-100); }

.sidebar-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.sidebar-user-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.sidebar-user-name {
  font-size: 13px; font-weight: 700; color: var(--gray-800);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-user-email {
  font-size: 11px; color: var(--gray-400);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.chevron { font-size: 9px; color: var(--gray-400); flex-shrink: 0; }

/* ── User dropdown ── */
.user-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0; right: 0;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.06);
  overflow: hidden;
  z-index: 200;
}

.ud-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
}
.ud-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
}
.ud-info { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.ud-greeting {
  font-size: 13px; font-weight: 800; color: var(--green-dark);
}
.ud-name {
  font-size: 13px; font-weight: 600; color: var(--gray-800);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ud-email {
  font-size: 11px; color: var(--gray-500);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.ud-divider { height: 1px; background: var(--gray-100); }

.ud-actions { padding: 6px; display: flex; flex-direction: column; gap: 2px; }

.ud-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; color: var(--gray-700);
  text-decoration: none; background: none; border: none;
  cursor: pointer; transition: background .15s; width: 100%; text-align: left;
}
.ud-item:hover { background: var(--gray-100); }
.ud-item-icon { font-size: 16px; width: 20px; text-align: center; }

.ud-logout { color: var(--red); }
.ud-logout:hover { background: var(--red-light); }

/* ── Transición dropdown ── */
.user-menu-enter-active { transition: opacity .15s ease, transform .15s ease; }
.user-menu-leave-active { transition: opacity .12s ease, transform .12s ease; }
.user-menu-enter-from  { opacity: 0; transform: translateY(6px); }
.user-menu-leave-to    { opacity: 0; transform: translateY(4px); }

/* ── Mobile nav padding ── */
.main-content.with-nav { padding-bottom: 80px; }

/* ── Page transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to   { opacity: 0; transform: translateY(-6px); }

/* ── Shortcut feedback toast ── */
.shortcut-toast {
  position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
  z-index: 8000; background: rgba(15,23,42,.88); color: white;
  font-size: 13px; font-weight: 600; padding: 8px 18px;
  border-radius: 99px; pointer-events: none; white-space: nowrap;
  backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0,0,0,.25);
}
.shortcut-toast-enter-active { transition: opacity .15s ease, transform .15s ease; }
.shortcut-toast-leave-active  { transition: opacity .3s ease, transform .3s ease; }
.shortcut-toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.shortcut-toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
</style>