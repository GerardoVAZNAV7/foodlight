<template>
  <div class="auth-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="auth-hero small">
      <div class="hero-content">
        <div class="app-logo">🚦</div>
        <h1 class="app-title">FoodLight</h1>
        <p class="app-subtitle">Crea tu cuenta gratuita</p>
      </div>
    </div>

    <div class="auth-card">
      <div class="back-row">
        <router-link to="/login" class="back-btn">← Volver</router-link>
        <h2 class="form-title">Registro</h2>
      </div>

      <!-- Progress -->
      <div class="progress-bar" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="2">
        <div class="progress-step" :class="{ active: step >= 1, done: step > 1 }">
          <div class="step-dot">{{ step > 1 ? '✓' : '1' }}</div>
          <span>Cuenta</span>
        </div>
        <div class="progress-line" :class="{ active: step > 1 }"></div>
        <div class="progress-step" :class="{ active: step >= 2 }">
          <div class="step-dot">2</div>
          <span>Confirmar</span>
        </div>
      </div>

      <!-- Step 1 -->
      <form v-if="step === 1" @submit.prevent="nextStep" novalidate>
        <div class="form-fields">
          <div class="field">
            <label for="name">Nombre completo</label>
            <input id="name" v-model="form.name" type="text" class="input"
              :class="{ 'input-error': errors.name }"
              placeholder="María García" @blur="validate('name')" />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>
          <div class="field">
            <label for="reg-email">Correo electrónico</label>
            <input id="reg-email" v-model="form.email" type="email" class="input"
              :class="{ 'input-error': errors.email }"
              placeholder="tu@correo.com" @blur="validate('email')" />
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>
          <div class="field">
            <label for="reg-pass">Contraseña</label>
            <input id="reg-pass" v-model="form.password" type="password" class="input"
              :class="{ 'input-error': errors.password }"
              placeholder="Mínimo 6 caracteres" @blur="validate('password')" />
            <div class="password-strength" v-if="form.password">
              <div class="strength-bar">
                <div class="strength-fill" :style="{ width: strengthPct + '%', background: strengthColor }"></div>
              </div>
              <span :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Continuar →</button>
      </form>

      <!-- Step 2 -->
      <div v-if="step === 2" class="confirm-step">
        <div class="confirm-icon">🎉</div>
        <h3>¡Todo listo!</h3>
        <p>Tu cuenta será creada con:</p>
        <div class="confirm-data">
          <div class="confirm-row"><span>Nombre</span><strong>{{ form.name }}</strong></div>
          <div class="confirm-row"><span>Correo</span><strong>{{ form.email }}</strong></div>
        </div>
        <button class="btn btn-primary btn-full" @click="handleRegister" :disabled="loading">
          <span v-if="loading" class="spinner-sm"></span>
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
        <button class="btn btn-ghost btn-full" @click="step = 1">← Modificar datos</button>
      </div>

      <div class="demo-hint">
        <span>¿Ya tienes cuenta?</span>
        <router-link to="/login" class="link-green">Inicia sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import StatusToast from '@/components/StatusToast.vue'

const router = useRouter()
const store = useUserStore()
const step = ref(1)
const loading = ref(false)
const toast = reactive({ show: false, message: '', type: 'success' })
const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const strengthPct = computed(() => {
  const p = form.password
  let s = 0
  if (p.length >= 6) s += 25
  if (p.length >= 10) s += 25
  if (/[A-Z]/.test(p)) s += 25
  if (/[0-9!@#$%^&*]/.test(p)) s += 25
  return s
})
const strengthColor = computed(() => {
  if (strengthPct.value < 26) return '#FF4757'
  if (strengthPct.value < 51) return '#FFB800'
  if (strengthPct.value < 76) return '#00C896'
  return '#4361EE'
})
const strengthLabel = computed(() => {
  if (strengthPct.value < 26) return 'Muy débil'
  if (strengthPct.value < 51) return 'Débil'
  if (strengthPct.value < 76) return 'Buena'
  return 'Excelente'
})

function validate(field) {
  if (field === 'name') errors.name = form.name.trim() ? '' : 'El nombre es requerido.'
  if (field === 'email') {
    if (!form.email) errors.email = 'El correo es requerido.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Correo no válido.'
    else errors.email = ''
  }
  if (field === 'password') {
    if (!form.password) errors.password = 'La contraseña es requerida.'
    else if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres.'
    else errors.password = ''
  }
}

function nextStep() {
  validate('name'); validate('email'); validate('password')
  if (!errors.name && !errors.email && !errors.password) step.value = 2
}

async function handleRegister() {
  loading.value = true
  showToast('Creando tu cuenta...', 'loading')
  await new Promise(r => setTimeout(r, 1000))
  try {
    store.register(form.name, form.email, form.password)
    showToast('¡Cuenta creada! Completa tu perfil 🎉', 'success')
    await new Promise(r => setTimeout(r, 700))
    router.push('/perfil')
  } catch (e) {
    showToast(e.message, 'error')
    step.value = 1
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100dvh; display: flex; flex-direction: column; }
.auth-hero {
  background: linear-gradient(135deg, #00C896, #4361EE);
  padding: 40px 24px 60px;
  text-align: center;
}
.auth-hero.small { padding: 30px 24px 50px; }
.app-logo { font-size: 40px; }
.app-title { font-size: 28px; font-weight: 800; color: white; }
.app-subtitle { font-size: 15px; color: rgba(255,255,255,.85); margin-top: 4px; }
.auth-card {
  flex: 1; background: white; border-radius: 28px 28px 0 0; margin-top: -20px;
  padding: 28px 24px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 -4px 30px rgba(0,0,0,.08);
}
.back-row { display: flex; align-items: center; gap: 12px; }
.back-btn { font-size: 14px; color: var(--green); font-weight: 600; text-decoration: none; }
.form-title { font-size: 20px; font-weight: 700; }
.form-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

.progress-bar { display: flex; align-items: center; gap: 0; }
.progress-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.step-dot {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  background: var(--gray-200); color: var(--gray-500);
  transition: all .3s;
}
.progress-step.active .step-dot { background: var(--green); color: white; }
.progress-step.done .step-dot { background: var(--green); color: white; }
.progress-step span { font-size: 11px; color: var(--gray-400); font-weight: 600; }
.progress-line { flex: 1; height: 2px; background: var(--gray-200); margin: 0 8px; transition: background .3s; }
.progress-line.active { background: var(--green); }

.password-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.strength-bar { flex: 1; height: 4px; background: var(--gray-200); border-radius: 99px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 99px; transition: all .3s; }
.strength-bar + span { font-size: 12px; font-weight: 600; white-space: nowrap; }

.confirm-step { display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; }
.confirm-icon { font-size: 48px; }
.confirm-step h3 { font-size: 22px; font-weight: 700; }
.confirm-step p { color: var(--gray-500); font-size: 14px; }
.confirm-data { width: 100%; background: var(--gray-50); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.confirm-row { display: flex; justify-content: space-between; font-size: 14px; }
.confirm-row span { color: var(--gray-500); }

.demo-hint { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--gray-500); justify-content: center; }
.link-green { color: var(--green); font-weight: 600; text-decoration: none; }
.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
