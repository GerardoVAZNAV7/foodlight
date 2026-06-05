<template>
  <div class="auth-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Hero -->
    <div class="auth-hero">
      <div class="hero-blob"></div>
      <div class="hero-content">
        <div class="app-logo">🚦</div>
        <h1 class="app-title">FoodLight</h1>
        <p class="app-subtitle">Tu guía nutricional personalizada</p>
      </div>
    </div>

    <!-- Card -->
    <div class="auth-card">
      <h2 class="form-title">Iniciar sesión</h2>

      <form @submit.prevent="handleLogin" novalidate>
        <div class="form-fields">
          <div class="field">
            <label for="email">Correo electrónico</label>
            <input
              id="email" v-model="form.email" type="email"
              class="input" :class="{ 'input-error': errors.email }"
              placeholder="tu@correo.com"
              autocomplete="email"
              @blur="validateField('email')"
            />
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <div class="input-group">
              <input
                id="password" v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="input" :class="{ 'input-error': errors.password }"
                placeholder="••••••••"
                autocomplete="current-password"
                @blur="validateField('password')"
              />
              <button type="button" class="eye-btn" @click="showPass = !showPass"
                :aria-label="showPass ? 'Ocultar' : 'Mostrar'">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner-sm"></span>
          {{ loading ? 'Verificando...' : 'Entrar' }}
        </button>
      </form>

      <div class="demo-hint">
        <span>¿Primera vez?</span>
        <router-link to="/register" class="link-green">Crea tu cuenta</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import StatusToast from '@/components/StatusToast.vue'

const router  = useRouter()
const store   = useUserStore()

const form    = reactive({ email: '', password: '' })
const errors  = reactive({ email: '', password: '' })
const loading = ref(false)
const showPass = ref(false)
const toast   = reactive({ show: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = message; toast.type = type; toast.show = true }, 50)
}

function validateField(field) {
  if (field === 'email') {
    if (!form.email)                            errors.email = 'El correo es requerido.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Correo no válido.'
    else                                        errors.email = ''
  }
  if (field === 'password') {
    errors.password = form.password ? '' : 'La contraseña es requerida.'
  }
}

async function handleLogin() {
  validateField('email')
  validateField('password')
  if (errors.email || errors.password) return

  loading.value = true
  showToast('Verificando credenciales...', 'loading')

  try {
    await store.login(form.email, form.password)
    showToast('¡Bienvenido de vuelta! 🎉', 'success')
    await new Promise(r => setTimeout(r, 500))

    // ── Redirección por rol ──────────────────────────────────────
    if (store.isEspecialista) {
      router.push('/dashboard')
    } else {
      router.push(store.hasProfile ? '/semaforo' : '/perfil')
    }

  } catch (e) {
    const msg = translateError(e.message)
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (msg.includes('Email not confirmed'))        return 'Confirma tu correo antes de entrar.'
  if (msg.includes('Too many requests'))          return 'Demasiados intentos. Espera un momento.'
  return msg
}
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex; flex-direction: column;
  background: var(--bg-page);
}
.auth-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #00C896 0%, #4361EE 100%);
  padding: 60px 24px 80px;
  display: flex; align-items: center; justify-content: center;
}
.hero-blob {
  position: absolute; top: -40px; right: -60px;
  width: 200px; height: 200px;
  background: rgba(255,255,255,.1); border-radius: 50%;
}
.hero-content { text-align: center; position: relative; }
.app-logo     { font-size: 56px; line-height: 1; margin-bottom: 12px; }
.app-title    { font-size: 36px; font-weight: 800; color: white; letter-spacing: -.5px; }
.app-subtitle { font-size: 16px; color: rgba(255,255,255,.85); margin-top: 6px; }

.auth-card {
  flex: 1;
  background: var(--bg-surface);
  border-radius: 28px 28px 0 0;
  margin-top: -24px;
  padding: 32px 24px;
  display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 -4px 30px rgba(0,0,0,.08);
  transition: background .3s;
}
.form-title  { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.form-fields { display: flex; flex-direction: column; gap: 16px; }

.input-group            { position: relative; }
.input-group .input     { padding-right: 48px; width: 100%; }
.eye-btn {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 18px; padding: 0;
}

.demo-hint {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--text-muted); justify-content: center;
}
.link-green { color: var(--green); font-weight: 600; text-decoration: none; }
.link-green:hover { text-decoration: underline; }

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: white;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>