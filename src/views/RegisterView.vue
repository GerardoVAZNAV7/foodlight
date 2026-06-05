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
      <div class="progress-bar" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="3">
        <div class="progress-step" :class="{ active: step >= 1, done: step > 1 }">
          <div class="step-dot">{{ step > 1 ? '✓' : '1' }}</div>
          <span>Cuenta</span>
        </div>
        <div class="progress-line" :class="{ active: step > 1 }"></div>
        <div class="progress-step" :class="{ active: step >= 2, done: step > 2 }">
          <div class="step-dot">{{ step > 2 ? '✓' : '2' }}</div>
          <span>Rol</span>
        </div>
        <div class="progress-line" :class="{ active: step > 2 }"></div>
        <div class="progress-step" :class="{ active: step >= 3 }">
          <div class="step-dot">3</div>
          <span>Confirmar</span>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           STEP 1 — Datos de cuenta
      ═══════════════════════════════════ -->
      <form v-if="step === 1" @submit.prevent="nextStep1" novalidate>
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

      <!-- ═══════════════════════════════════
           STEP 2 — Selección de ROL
      ═══════════════════════════════════ -->
      <div v-if="step === 2" class="role-step">
        <h3>¿Cuál es tu rol?</h3>
        <p class="role-hint">Esto determina cómo usarás FoodLight.</p>

        <div class="role-cards">
          <!-- PACIENTE -->
          <button
            type="button"
            class="role-card"
            :class="{ selected: form.especialista === false }"
            @click="selectRole(false)"
          >
            <div class="role-icon">🧑‍⚕️</div>
            <div class="role-info">
              <strong>Paciente</strong>
              <span>Monitoreo personal de alimentación y salud</span>
            </div>
            <div class="role-check">{{ form.especialista === false ? '✓' : '' }}</div>
          </button>

          <!-- ESPECIALISTA -->
          <button
            type="button"
            class="role-card"
            :class="{ selected: form.especialista === true }"
            @click="selectRole(true)"
          >
            <div class="role-icon">👨‍🔬</div>
            <div class="role-info">
              <strong>Especialista</strong>
              <span>Nutriólogo / médico que monitorea pacientes</span>
            </div>
            <div class="role-check">{{ form.especialista === true ? '✓' : '' }}</div>
          </button>
        </div>

        <!-- Si es PACIENTE → seleccionar especialista asignado -->
        <div v-if="form.especialista === false" class="especialista-select-wrap">
          <div class="field">
            <label for="especialista-select">
              Especialista asignado
              <span class="opt-badge">opcional</span>
            </label>
            <div v-if="loadingEspecialistas" class="loading-esp">
              <div class="spinner-xs"></div> Cargando especialistas...
            </div>
            <select
              v-else
              id="especialista-select"
              v-model="form.especialista_id"
              class="input"
            >
              <option value="">— Sin especialista asignado —</option>
              <option
                v-for="esp in especialistas"
                :key="esp.id"
                :value="esp.id"
              >{{ esp.nombre || esp.email }}</option>
            </select>
            <span class="field-hint">Podrás asignarte más tarde desde tu perfil.</span>
          </div>
        </div>

        <div v-if="errors.role" class="field-error center-error">{{ errors.role }}</div>

        <div class="step-btns">
          <button type="button" class="btn btn-ghost" @click="step = 1">← Atrás</button>
          <button type="button" class="btn btn-primary" @click="nextStep2">Continuar →</button>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           STEP 3 — Confirmar
      ═══════════════════════════════════ -->
      <div v-if="step === 3" class="confirm-step">
        <div class="confirm-icon">🎉</div>
        <h3>¡Todo listo!</h3>
        <p>Tu cuenta será creada con:</p>
        <div class="confirm-data">
          <div class="confirm-row"><span>Nombre</span><strong>{{ form.name }}</strong></div>
          <div class="confirm-row"><span>Correo</span><strong>{{ form.email }}</strong></div>
          <div class="confirm-row">
            <span>Rol</span>
            <strong>{{ form.especialista ? '👨‍🔬 Especialista' : '🧑‍⚕️ Paciente' }}</strong>
          </div>
          <div v-if="!form.especialista && form.especialista_id" class="confirm-row">
            <span>Especialista</span>
            <strong>{{ especialistaNombre }}</strong>
          </div>
        </div>
        <button class="btn btn-primary btn-full" @click="handleRegister" :disabled="loading">
          <span v-if="loading" class="spinner-sm"></span>
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
        <button class="btn btn-ghost btn-full" @click="step = 2">← Modificar datos</button>
      </div>

      <!-- ═══════════════════════════════════
           STEP 4 — Confirmación de email
      ═══════════════════════════════════ -->
      <div v-if="step === 4" class="confirm-email-step">
        <div class="confirm-icon">📧</div>
        <h3>Revisa tu correo</h3>
        <p>Te enviamos un enlace de confirmación a <strong>{{ form.email }}</strong>.</p>
        <p class="hint">Una vez confirmado, podrás iniciar sesión.</p>
        <router-link to="/login" class="btn btn-primary btn-full">Ir a iniciar sesión</router-link>
      </div>

      <div v-if="step < 4" class="demo-hint">
        <span>¿Ya tienes cuenta?</span>
        <router-link to="/login" class="link-green">Inicia sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store   = useUserStore()
const step    = ref(1)
const loading = ref(false)
const toast   = reactive({ show: false, message: '', type: 'success' })

const form = reactive({
  name: '',
  email: '',
  password: '',
  especialista: null,     // null = sin elegir, true/false = elegido
  especialista_id: '',    // uuid del especialista si es paciente
})

const errors = reactive({ name: '', email: '', password: '', role: '' })

// ── Lista de especialistas disponibles ──────────────────────────────────────
const especialistas = ref([])
const loadingEspecialistas = ref(false)

async function cargarEspecialistas() {
  loadingEspecialistas.value = true
  try {
    // Traemos profiles donde especialista = true con su email desde auth (via función o vista)
    // Como no tenemos acceso directo a auth.users desde el cliente, usamos una consulta
    // que une profiles con la función RPC o simplemente filtra profiles con especialista=true
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre')
      .eq('especialista', true)
      .order('nombre')

    if (!error && data) {
      especialistas.value = data
    }
  } catch (e) {
    console.error('Error cargando especialistas:', e)
  } finally {
    loadingEspecialistas.value = false
  }
}

const especialistaNombre = computed(() => {
  if (!form.especialista_id) return '—'
  const esp = especialistas.value.find(e => e.id === form.especialista_id)
  return esp?.nombre || esp?.email || form.especialista_id
})

// ── Fortaleza contraseña ─────────────────────────────────────────────────────
const strengthPct = computed(() => {
  const p = form.password; let s = 0
  if (p.length >= 6)  s += 25
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

// ── Validaciones ─────────────────────────────────────────────────────────────
function validate(field) {
  if (field === 'name')    errors.name = form.name.trim() ? '' : 'El nombre es requerido.'
  if (field === 'email') {
    if (!form.email)                        errors.email = 'El correo es requerido.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Correo no válido.'
    else                                    errors.email = ''
  }
  if (field === 'password') {
    if (!form.password)                errors.password = 'La contraseña es requerida.'
    else if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres.'
    else                               errors.password = ''
  }
}

function nextStep1() {
  validate('name'); validate('email'); validate('password')
  if (!errors.name && !errors.email && !errors.password) {
    step.value = 2
    // Cargar especialistas al entrar al step 2
    if (!especialistas.value.length) cargarEspecialistas()
  }
}

function selectRole(esEspecialista) {
  form.especialista = esEspecialista
  errors.role = ''
  if (esEspecialista) form.especialista_id = ''
}

function nextStep2() {
  if (form.especialista === null) {
    errors.role = 'Selecciona un rol para continuar.'
    return
  }
  errors.role = ''
  step.value = 3
}

// ── Registro ──────────────────────────────────────────────────────────────────
function showToast(msg, type) {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

// Reemplaza handleRegister completo por esto:
async function handleRegister() {
  loading.value = true
  showToast('Creando tu cuenta...', 'loading')
  try {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    })
    if (error) throw new Error(error.message)

    const userId = data?.user?.id

    // Sin userId = necesita confirmar email
    if (!userId) { step.value = 4; return }

    // ── Esperar a que la sesión esté activa ──
    // signUp en Supabase a veces necesita un tick antes de
    // que auth.uid() esté disponible para las policies RLS
    await new Promise(r => setTimeout(r, 400))

    const profilePayload = {
      id:              userId,
      nombre:          form.name,
      especialista:    form.especialista === true,
      especialista_id: form.especialista === false && form.especialista_id
                         ? form.especialista_id
                         : null,
      updated_at: new Date().toISOString(),
    }

    const { error: pErr } = await supabase
      .from('profiles')
      .upsert(profilePayload)

    if (pErr) {
      // Si falla el upsert de profile, igual continuamos
      // porque el usuario ya fue creado en auth
      console.warn('Profile upsert warning:', pErr.message)
    }

    showToast('Cuenta creada correctamente', 'success')
    await new Promise(r => setTimeout(r, 500))

    await store.login(form.email, form.password)
    window.location.href = store.isEspecialista ? '/dashboard' : '/perfil'

  } catch (e) {
    showToast(translateError(e.message), 'error')
    step.value = 1
  } finally {
    loading.value = false
  }
}

function translateError(msg) {
  if (msg.includes('already registered'))  return 'Este correo ya está registrado. Inicia sesión.'
  if (msg.includes('Password should be'))  return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('Unable to validate'))  return 'Correo no válido.'
  if (msg.includes('Too many requests'))   return 'Demasiados intentos. Espera un momento.'
  return msg
}

onMounted(() => {
  // Pre-cargar especialistas si ya estamos en step 2 (recarga de página)
  if (step.value === 2) cargarEspecialistas()
})
</script>

<style scoped>
.auth-page    { min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg-page); }
.auth-hero    {
  background: linear-gradient(135deg, #00C896, #4361EE);
  padding: 40px 24px 60px; text-align: center;
}
.auth-hero.small { padding: 30px 24px 50px; }
.app-logo  { font-size: 40px; }
.app-title { font-size: 28px; font-weight: 800; color: white; }
.app-subtitle { font-size: 15px; color: rgba(255,255,255,.85); margin-top: 4px; }

.auth-card {
  flex: 1;
  background: var(--bg-surface);
  border-radius: 28px 28px 0 0; margin-top: -20px;
  padding: 28px 24px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 -4px 30px rgba(0,0,0,.08);
  transition: background .3s;
}
.back-row  { display: flex; align-items: center; gap: 12px; }
.back-btn  { font-size: 14px; color: var(--green); font-weight: 600; text-decoration: none; }
.form-title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.form-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

/* Progress */
.progress-bar  { display: flex; align-items: center; }
.progress-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.step-dot {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  background: var(--gray-200); color: var(--gray-500); transition: all .3s;
}
.progress-step.active .step-dot,
.progress-step.done .step-dot { background: var(--green); color: white; }
.progress-step span { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.progress-line {
  flex: 1; height: 2px; background: var(--gray-200); margin: 0 8px; transition: background .3s;
}
.progress-line.active { background: var(--green); }

/* Password strength */
.password-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.strength-bar      { flex: 1; height: 4px; background: var(--gray-200); border-radius: 99px; overflow: hidden; }
.strength-fill     { height: 100%; border-radius: 99px; transition: all .3s; }
.strength-bar + span { font-size: 12px; font-weight: 600; white-space: nowrap; }

/* ── STEP 2: Rol ── */
.role-step { display: flex; flex-direction: column; gap: 16px; }
.role-step h3 { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.role-hint { font-size: 13px; color: var(--text-muted); margin-top: -8px; }

.role-cards { display: flex; flex-direction: column; gap: 12px; }

.role-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer; text-align: left; width: 100%;
  transition: all .2s;
}
.role-card:hover {
  border-color: var(--green);
  background: var(--green-light);
}
.role-card.selected {
  border-color: var(--green);
  background: var(--green-light);
  box-shadow: 0 0 0 3px rgba(0,200,150,.15);
}
.role-icon { font-size: 32px; flex-shrink: 0; }
.role-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.role-info strong { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.role-info span   { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.role-check {
  width: 24px; height: 24px; flex-shrink: 0;
  border-radius: 50%;
  background: var(--green);
  color: white; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .2s;
}
.role-card.selected .role-check { opacity: 1; }

/* Especialista select */
.especialista-select-wrap {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  animation: fadeIn .25s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

.opt-badge {
  margin-left: 6px; font-size: 10px; font-weight: 700;
  background: var(--blue-light); color: var(--blue);
  padding: 2px 7px; border-radius: 99px;
  text-transform: uppercase; letter-spacing: .04em;
  vertical-align: middle;
}
.field-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.loading-esp {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--text-muted); padding: 12px 0;
}
.spinner-xs {
  width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid var(--gray-200); border-top-color: var(--green);
  border-radius: 50%; animation: spin .7s linear infinite;
}

.center-error { text-align: center; font-size: 13px; color: var(--red); font-weight: 500; }

.step-btns { display: flex; gap: 10px; }
.step-btns .btn { flex: 1; }

/* ── STEP 3: Confirmar ── */
.confirm-step {
  display: flex; flex-direction: column; gap: 16px;
  align-items: center; text-align: center;
}
.confirm-icon  { font-size: 48px; }
.confirm-step h3 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.confirm-step p  { color: var(--text-secondary); font-size: 14px; }
.confirm-data {
  width: 100%; background: var(--bg-elevated); border-radius: var(--radius-md);
  padding: 16px; display: flex; flex-direction: column; gap: 10px;
  border: 1px solid var(--border-color);
}
.confirm-row  { display: flex; justify-content: space-between; font-size: 14px; }
.confirm-row span   { color: var(--text-muted); }
.confirm-row strong { color: var(--text-primary); }

/* ── STEP 4: Email ── */
.confirm-email-step {
  display: flex; flex-direction: column; gap: 14px;
  align-items: center; text-align: center;
}
.confirm-email-step h3 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.confirm-email-step p  { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
.hint { font-size: 13px !important; color: var(--text-muted) !important; }

.demo-hint {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--text-muted); justify-content: center;
}
.link-green { color: var(--green); font-weight: 600; text-decoration: none; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>