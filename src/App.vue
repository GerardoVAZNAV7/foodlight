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
        </router-link>
        <router-link to="/perfil" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">👤</span>
          <span class="sidebar-label">Perfil</span>
        </router-link>
        <router-link to="/recetas" class="sidebar-link" active-class="active">
          <span class="sidebar-icon">🍽️</span>
          <span class="sidebar-label">Recetas</span>
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
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

  /* Hide mobile navbar on desktop */
  .app-shell.logged-in .mobile-only-navbar {
    display: none;
  }

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

  /* Hide mobile nav on desktop */
  .app-shell.logged-in nav.bottom-nav {
    display: none;
  }

  /* Hide mobile topbar on desktop */
  .app-shell.logged-in header.navbar {
    display: none;
  }
}

@media (min-width: 1200px) {
  .app-shell.logged-in {
    grid-template-columns: 260px 1fr;
  }
}

/* ── Sidebar styles ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 20px;
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: 8px;
}
.sidebar-brand .brand-icon { font-size: 24px; }
.sidebar-brand .brand-name {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--green), var(--blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--gray-600);
  font-size: 14px;
  font-weight: 600;
  transition: all .2s;
}
.sidebar-link:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}
.sidebar-link.active {
  background: var(--green-light);
  color: var(--green-dark);
}
.sidebar-icon { font-size: 18px; }
.sidebar-label { font-size: 14px; }

.sidebar-footer {
  border-top: 1px solid var(--gray-100);
  padding-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sidebar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user-email {
  font-size: 11px;
  color: var(--gray-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-logout {
  background: var(--gray-100);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px;
  cursor: pointer;
  color: var(--gray-500);
  font-size: 16px;
  transition: all .2s;
  flex-shrink: 0;
}
.sidebar-logout:hover {
  background: var(--red-light);
  color: var(--red);
}

/* ── Mobile nav padding ── */
.main-content.with-nav {
  padding-bottom: 80px;
}

/* ── Page transitions ── */
.fade-enter-active, .fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>