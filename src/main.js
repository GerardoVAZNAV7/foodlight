import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Inicializar sesión de Supabase antes de montar
import { useUserStore } from '@/stores/userStore'
const store = useUserStore()
store.init().then(() => app.mount('#app'))