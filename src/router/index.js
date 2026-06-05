import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login',    component: () => import('@/views/LoginView.vue'),    meta: { public: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },

  // ── Rutas PACIENTE ────────────────────────────────────────────────────────
  { path: '/perfil',   component: () => import('@/views/ProfileView.vue'),   meta: { requiresPaciente: true } },
  { path: '/semaforo', component: () => import('@/views/SemaforoView.vue'),  meta: { requiresPaciente: true } },
  { path: '/recetas',  component: () => import('@/views/RecetasView.vue'),   meta: { requiresPaciente: true } },
  { path: '/diario',   component: () => import('@/views/DiarioView.vue'),    meta: { requiresPaciente: true } },
  { path: '/reportes', component: () => import('@/views/ReporteView.vue'),   meta: { requiresPaciente: true } },

  // ── Rutas ESPECIALISTA ────────────────────────────────────────────────────
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardEspecialistaView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/perfil',
    component: () => import('@/views/EspecialistaPerfilView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/reportes',
    component: () => import('@/views/ReportesEspecialistaView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/dietas',
    component: () => import('@/views/DietasView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/paciente/:id',
    component: () => import('@/views/PacienteDetalleView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/padecimientos',
    component: () => import('@/views/PadecimientosAdminView.vue'),
    meta: { requiresEspecialista: true },
  },
  {
    path: '/esp/alimentos',
    component: () => import('@/views/AlimentosAdminView.vue'),
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
  if (!store._initialized) await store.init()

  if (to.meta.public) return true
  if (!store.isLoggedIn) return '/login'

  if (to.meta.requiresEspecialista && !store.isEspecialista) return '/semaforo'
  if (to.meta.requiresPaciente && store.isEspecialista) return '/dashboard'

  return true
})

export default router