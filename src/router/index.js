// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login',    component: () => import('@/views/LoginView.vue'),    meta: { public: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },

  // ── Rutas comunes ──────────────────────────────────────────────────────────
  { path: '/perfil',   component: () => import('@/views/ProfileView.vue') },
  { path: '/semaforo', component: () => import('@/views/SemaforoView.vue') },
  { path: '/recetas',  component: () => import('@/views/RecetasView.vue') },
  { path: '/diario',   component: () => import('@/views/DiarioView.vue') },
  { path: '/reportes', component: () => import('@/views/ReporteView.vue') },

  // ── Ruta exclusiva de especialista ────────────────────────────────────────
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardEspecialistaView.vue'),
    meta: { requiresEspecialista: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const store = useUserStore()

  // Esperar inicialización
  if (!store._initialized) {
    await store.init()
  }

  // Rutas públicas — siempre permitidas
  if (to.meta.public) return true

  // Sin sesión → login
  if (!store.isLoggedIn) return '/login'

  // Ruta exclusiva de especialista
  if (to.meta.requiresEspecialista && !store.isEspecialista) return '/semaforo'

  // Paciente que intenta entrar al dashboard de especialista
  // (ya cubierto arriba, pero por claridad)
  if (to.path === '/dashboard' && !store.isEspecialista) return '/semaforo'

  return true
})

export default router