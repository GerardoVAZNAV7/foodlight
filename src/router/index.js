import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
  { path: '/perfil', component: () => import('@/views/ProfileView.vue') },
  { path: '/semaforo', component: () => import('@/views/SemaforoView.vue') },
  { path: '/recetas', component: () => import('@/views/RecetasView.vue') },
  // Agrega esta nueva línea:
  { path: '/diario', component: () => import('@/views/DiarioView.vue') }, 
]
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  const store = useUserStore()
  // Esperar a que la sesión esté lista antes de decidir
  if (!store._initialized) {
    await store.init()
  }
  if (!to.meta.public && !store.isLoggedIn) return '/login'
})

export default router
