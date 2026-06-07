<template>
  <!-- ── Sidebar SOLO desktop ── -->
  <aside class="sidebar-esp">
    <transition name="shortcut-toast">
      <div v-if="shortcutLabel" class="shortcut-toast">{{ shortcutLabel }}</div>
    </transition>
    <div class="sidebar-brand">
      <span class="brand-icon">🚦</span>
      <span class="brand-name">FoodLight</span>
      <span class="esp-badge">Especialista</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/dashboard" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">🏥</span>
        <span class="sidebar-label">Dashboard</span>
        <kbd class="shortcut-hint">Alt+D</kbd>
      </router-link>

      <router-link to="/esp/reportes" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">📊</span>
        <span class="sidebar-label">Reportes</span>
        <kbd class="shortcut-hint">Alt+R</kbd>
      </router-link>

      <router-link to="/esp/dietas" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">🥗</span>
        <span class="sidebar-label">Dietas</span>
        <kbd class="shortcut-hint">Alt+I</kbd>
      </router-link>

      <router-link to="/esp/recetas" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">🍽️</span>
        <span class="sidebar-label">Recetas</span>
        <kbd class="shortcut-hint">Alt+E</kbd>
      </router-link>

      <div class="nav-divider">CATÁLOGOS</div>

      <router-link to="/esp/alimentos" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">🍎</span>
        <span class="sidebar-label">Alimentos</span>
        <kbd class="shortcut-hint">Alt+A</kbd>
      </router-link>

      <router-link to="/esp/padecimientos" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">🩺</span>
        <span class="sidebar-label">Padecimientos</span>
        <kbd class="shortcut-hint">Alt+P</kbd>
      </router-link>

      <div class="nav-divider">MI CUENTA</div>

      <router-link to="/esp/perfil" class="sidebar-link" active-class="active">
        <span class="sidebar-icon">👤</span>
        <span class="sidebar-label">Mi perfil</span>
        <kbd class="shortcut-hint">Alt+M</kbd>
      </router-link>
    </nav>

    <!-- Toggle tema -->
    <div class="sidebar-theme-row">
      <span class="theme-label">{{ isDarkMode ? 'Modo oscuro' : 'Modo claro' }}</span>
      <DarkModeToggle @change="onThemeChange" />
    </div>

    <!-- Footer usuario -->
    <div class="sidebar-footer" ref="footerRef">
      <button class="sidebar-user-btn" @click="toggleUserMenu" :class="{ open: userMenuOpen }">
        <div class="sidebar-avatar">{{ initials }}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">{{ nombreCorto }}</span>
          <span class="sidebar-user-email">{{ store.authUser?.email }}</span>
        </div>
        <span class="chevron">{{ userMenuOpen ? '▲' : '▼' }}</span>
      </button>

      <transition name="user-menu">
        <div v-if="userMenuOpen" class="user-dropdown">
          <div class="ud-header">
            <div class="ud-avatar">{{ initials }}</div>
            <div class="ud-info">
              <span class="ud-greeting">Especialista 👨‍🔬</span>
              <span class="ud-name">{{ store.profile?.nombre || store.authUser?.email }}</span>
              <span class="ud-email">{{ store.authUser?.email }}</span>
            </div>
          </div>
          <div class="ud-divider"></div>
          <div class="ud-actions">
            <router-link to="/esp/perfil" class="ud-item" @click="userMenuOpen = false">
              <span class="ud-item-icon">👤</span><span>Mi perfil</span>
            </router-link>
            <button class="ud-item ud-logout" @click="logout">
              <span class="ud-item-icon">↩</span><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </aside>

  <!-- ── Top navbar SOLO móvil ── -->
  <header class="navbar-esp-mobile">
    <div class="nem-brand">
      <span class="nem-icon">🚦</span>
      <span class="nem-name">FoodLight</span>
      <span class="nem-badge">Especialista</span>
    </div>

    <div class="nem-actions">
      <DarkModeToggle @change="onThemeChange" />
      <div class="nem-avatar-wrap">
        <button class="nem-avatar" @click="toggleUserMenu">{{ initials }}</button>
        <transition name="dropdown">
          <div v-if="userMenuOpen" class="nem-dropdown">
            <div class="nem-dd-header">
              <div class="nem-dd-avatar">{{ initials }}</div>
              <div class="nem-dd-info">
                <span class="nem-dd-name">{{ store.profile?.nombre || store.authUser?.email }}</span>
                <span class="nem-dd-email">{{ store.authUser?.email }}</span>
              </div>
            </div>
            <div class="nem-dd-divider"></div>
            <router-link to="/esp/perfil" class="nem-dd-item" @click="userMenuOpen = false">
              <span>👤</span> Mi perfil
            </router-link>
            <button class="nem-dd-item nem-dd-logout" @click="logout">
              <span>↩</span> Cerrar sesión
            </button>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="userMenuOpen" class="nem-overlay" @click="userMenuOpen = false"></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

const store = useUserStore()
const router = useRouter()

const isDarkMode = ref(false)
const userMenuOpen = ref(false)
const footerRef = ref(null)
const shortcutLabel = ref('')
let shortcutTimer = null

const shortcutMap = {
  KeyD: { path: '/dashboard',        label: 'Dashboard' },
  KeyR: { path: '/esp/reportes',     label: 'Reportes' },
  KeyI: { path: '/esp/dietas',       label: 'Dietas' },
  KeyE: { path: '/esp/recetas',      label: 'Recetas' },
  KeyA: { path: '/esp/alimentos',    label: 'Alimentos' },
  KeyP: { path: '/esp/padecimientos',label: 'Padecimientos' },
  KeyM: { path: '/esp/perfil',       label: 'Mi perfil' },
}

function showShortcut(label) {
  shortcutLabel.value = label
  clearTimeout(shortcutTimer)
  shortcutTimer = setTimeout(() => { shortcutLabel.value = '' }, 1400)
}

function onKeydown(e) {
  if (!e.altKey || !store.isLoggedIn || !store.isEspecialista) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const s = shortcutMap[e.code]
  if (!s) return
  e.preventDefault()
  if (router.currentRoute.value.path === s.path) return
  router.push(s.path)
  showShortcut(s.label)
}

function onThemeChange() {
  isDarkMode.value = document.documentElement.hasAttribute('data-theme')
}

const nombreCorto = computed(() => {
  const n = store.profile?.nombre?.trim() || store.authUser?.email?.split('@')[0] || '—'
  return n.split(' ')[0]
})

const initials = computed(() => {
  const n = store.profile?.nombre?.trim() || store.authUser?.email || '?'
  return n.charAt(0).toUpperCase()
})

function toggleUserMenu() { userMenuOpen.value = !userMenuOpen.value }

function logout() {
  userMenuOpen.value = false
  store.logout()
  router.push('/login')
}

function onClickOutside(e) {
  if (footerRef.value && !footerRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
  isDarkMode.value = document.documentElement.hasAttribute('data-theme')
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(shortcutTimer)
})
</script>

<style scoped>
/* ══════════════════════════════════════════
   SIDEBAR — solo visible en desktop (≥768px)
══════════════════════════════════════════ */
.sidebar-esp {
  display: none; /* oculta en móvil por defecto */
  flex-direction: column;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  height: 100dvh;
  padding: 20px 14px;
  gap: 4px;
  transition: background .3s, border-color .3s;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .sidebar-esp {
    display: flex; /* visible solo en desktop */
  }
}

.sidebar-brand {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 16px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.sidebar-brand .brand-icon { font-size: 20px; }
.sidebar-brand .brand-name {
  font-size: 18px; font-weight: 800;
  background: linear-gradient(135deg, var(--green), var(--blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.esp-badge {
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; padding: 2px 7px; border-radius: 99px; margin-left: auto;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }

.nav-divider {
  font-size: 10px; font-weight: 800; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .08em;
  padding: 10px 10px 4px;
}

.sidebar-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-md);
  text-decoration: none; color: var(--text-secondary);
  font-size: 13px; font-weight: 600; transition: all .2s;
}
.sidebar-link:hover { background: var(--gray-100); color: var(--text-primary); }
.sidebar-link.active { background: var(--green-light); color: var(--green-dark); }
.sidebar-icon { font-size: 16px; }
.sidebar-label { flex: 1; }

.shortcut-hint {
  font-size: 10px; font-weight: 700; background: var(--gray-100); color: var(--text-muted);
  border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 5px;
  font-family: monospace; opacity: 0; transition: opacity .15s; pointer-events: none;
}
.sidebar-link:hover .shortcut-hint,
.sidebar-link.active .shortcut-hint { opacity: 1; }

.sidebar-theme-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: var(--radius-md);
  border: 1px solid var(--border-light); background: var(--bg-elevated);
  margin: 6px 0; transition: background .3s, border-color .3s;
}
.theme-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

.sidebar-footer { border-top: 1px solid var(--border-light); padding-top: 10px; position: relative; }

.sidebar-user-btn {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; background: transparent; border: none;
  border-radius: var(--radius-md); cursor: pointer; transition: background .2s; text-align: left;
}
.sidebar-user-btn:hover { background: var(--gray-100); }
.sidebar-user-btn.open { background: var(--gray-100); }

.sidebar-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.sidebar-user-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.sidebar-user-name { font-size: 12px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-email { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chevron { font-size: 9px; color: var(--text-muted); flex-shrink: 0; }

.user-dropdown {
  position: absolute; bottom: calc(100% + 8px); left: 0; right: 0;
  background: var(--bg-elevated); border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 0 0 1px var(--border-color);
  overflow: hidden; z-index: 200;
}
.ud-header { display: flex; align-items: center; gap: 10px; padding: 14px; background: linear-gradient(135deg, var(--green-light), var(--blue-light)); }
.ud-avatar { width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--green), var(--blue)); color: white; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.ud-info { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.ud-greeting { font-size: 11px; font-weight: 800; color: var(--green-dark); }
.ud-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ud-email { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ud-divider { height: 1px; background: var(--border-light); }
.ud-actions { padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.ud-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: var(--text-secondary); text-decoration: none; background: none; border: none; cursor: pointer; transition: background .15s; width: 100%; text-align: left; }
.ud-item:hover { background: var(--gray-100); }
.ud-item-icon { font-size: 14px; width: 18px; text-align: center; }
.ud-logout { color: var(--red); }
.ud-logout:hover { background: var(--red-light); }

.user-menu-enter-active { transition: opacity .15s ease, transform .15s ease; }
.user-menu-leave-active { transition: opacity .12s ease, transform .12s ease; }
.user-menu-enter-from { opacity: 0; transform: translateY(6px); }
.user-menu-leave-to { opacity: 0; transform: translateY(4px); }

.shortcut-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 9999;
  padding: 10px 22px; border-radius: 99px;
  background: var(--gray-900); color: white;
  font-size: 13px; font-weight: 600; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,.3);
  pointer-events: none; backdrop-filter: blur(8px);
}
.shortcut-toast-enter-active { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
.shortcut-toast-leave-active { transition: all .2s ease; }
.shortcut-toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.shortcut-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-4px); }


/* ══════════════════════════════════════════
   TOP NAVBAR MÓVIL — solo visible en móvil (<768px)
══════════════════════════════════════════ */
.navbar-esp-mobile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background .3s, border-color .3s;
}

@media (min-width: 768px) {
  .navbar-esp-mobile {
    display: none; /* En desktop la sidebar ya provee navegación */
  }
}

.nem-brand {
  display: flex; align-items: center; gap: 8px;
}
.nem-icon { font-size: 22px; }
.nem-name {
  font-size: 18px; font-weight: 800;
  background: linear-gradient(135deg, var(--green), var(--blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.nem-badge {
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; padding: 2px 7px; border-radius: 99px;
}

.nem-actions {
  display: flex; align-items: center; gap: 10px;
}

.nem-avatar-wrap { position: relative; }

.nem-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 15px; font-weight: 700;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform .2s, box-shadow .2s;
}
.nem-avatar:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(0,200,150,.3); }

.nem-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 240px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.15), 0 0 0 1px var(--border-color);
  overflow: hidden;
  z-index: 200;
}
.nem-dd-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
}
.nem-dd-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 15px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.nem-dd-info { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.nem-dd-name { font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nem-dd-email { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nem-dd-divider { height: 1px; background: var(--border-light); }
.nem-dd-item {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; font-size: 13px; font-weight: 600;
  color: var(--text-secondary); text-decoration: none;
  background: none; border: none; cursor: pointer;
  transition: background .15s; width: 100%; text-align: left;
}
.nem-dd-item:hover { background: var(--gray-100); }
.nem-dd-logout { color: var(--red); }
.nem-dd-logout:hover { background: var(--red-light); }

.nem-overlay {
  position: fixed; inset: 0; z-index: 190;
}

.dropdown-enter-active { transition: opacity .2s ease, transform .2s ease; }
.dropdown-leave-active { transition: opacity .15s ease, transform .15s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>