<template>
  <div class="profile-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Header con bienvenida -->
    <div class="profile-header">
      <div class="avatar-circle">{{ initials }}</div>
      <div class="profile-header-info">
        <p class="profile-welcome">¡Hola, {{ primerNombre }}! 👋</p>
        <h2 class="profile-name">{{ nombreCompleto }}</h2>
        <p class="profile-sub">
          <span v-if="store.hasProfile" class="badge badge-green">✓ Perfil completo</span>
          <span v-else class="badge badge-yellow">⚠ Completa tu perfil</span>
        </p>
      </div>
    </div>

    <!-- Stats summary si el perfil existe -->
    <div v-if="store.hasProfile" class="stats-row">
      <div class="stat-card">
        <span class="stat-val">{{ store.profile.peso }}</span>
        <span class="stat-lbl">kg</span>
      </div>
      <div class="stat-card">
        <span class="stat-val">{{ store.profile.estatura }}</span>
        <span class="stat-lbl">cm</span>
      </div>
      <div class="stat-card">
        <span class="stat-val">{{ imc }}</span>
        <span class="stat-lbl">IMC</span>
      </div>
      <div class="stat-card" :style="{ background: imcColor + '15' }">
        <span class="stat-val" style="font-size:14px" :style="{ color: imcColor }">{{ imcLabel }}</span>
        <span class="stat-lbl">Estado</span>
      </div>
    </div>

    <!-- Requerimiento calórico -->
    <div v-if="store.hasProfile" class="caloric-card card">
      <div class="caloric-header">
        <span>🔥</span>
        <div>
          <h4>Requerimiento calórico</h4>
          <p v-if="store.profile.dieta">Meta de dieta: {{ store.profile.dieta.nombre }}</p>
          <p v-else>Estimado con fórmula Mifflin-St Jeor · {{ store.profile.edad }} años</p>
        </div>
      </div>
      <div class="caloric-values">
        <div class="caloric-item">
          <span class="caloric-num">{{ tmb }}</span>
          <span class="caloric-label">kcal/día basal</span>
        </div>
        <div class="caloric-divider"></div>
        <div class="caloric-item">
          <span class="caloric-num" style="color:var(--green)">{{ tdee }}</span>
          <span class="caloric-label">{{ store.profile.dieta ? 'Meta dieta' : 'kcal/día total' }}</span>
        </div>
      </div>
      <div v-if="store.profile.dieta" class="caloric-diet-macros">
        <span v-if="store.profile.dieta.prot_g">🥩 {{ store.profile.dieta.prot_g }}g proteína</span>
        <span v-if="store.profile.dieta.carbs_g">🌾 {{ store.profile.dieta.carbs_g }}g carbohidratos</span>
        <span v-if="store.profile.dieta.grasas_g">🧈 {{ store.profile.dieta.grasas_g }}g grasas</span>
      </div>
    </div>

    <!-- Formulario -->
    <div class="form-section card">
      <h3 class="section-title">
        <span>📋</span> Datos personales
      </h3>

      <form @submit.prevent="saveProfile" novalidate>
        <div class="form-grid">

          <!-- Fecha de nacimiento -->
          <div class="field span-2">
            <label for="fecha_nacimiento">Fecha de nacimiento</label>
            <input
              id="fecha_nacimiento"
              v-model="form.fecha_nacimiento"
              type="date"
              class="input"
              :class="{ 'input-error': errors.fecha_nacimiento }"
              :max="fechaMaxima"
              :min="fechaMinima"
              @blur="v('fecha_nacimiento')"
            />
            <span v-if="errors.fecha_nacimiento" class="field-error">{{ errors.fecha_nacimiento }}</span>
            <span v-if="edadCalculada !== null" class="edad-hint">
              {{ edadCalculada }} años
            </span>
          </div>

          <div class="field">
            <label for="sexo">Sexo</label>
            <select id="sexo" v-model="form.sexo" class="input" :class="{ 'input-error': errors.sexo }" @blur="v('sexo')">
              <option value="" disabled>Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <span v-if="errors.sexo" class="field-error">{{ errors.sexo }}</span>
          </div>

          <div class="field">
            <label for="peso">Peso (kg)</label>
            <input id="peso" v-model.number="form.peso" type="number" step="0.1" min="20" max="300" class="input"
              :class="{ 'input-error': errors.peso }" placeholder="70" @blur="v('peso')" />
            <span v-if="errors.peso" class="field-error">{{ errors.peso }}</span>
          </div>

          <div class="field">
            <label for="estatura">Estatura (cm)</label>
            <input id="estatura" v-model.number="form.estatura" type="number" min="50" max="250" class="input"
              :class="{ 'input-error': errors.estatura }" placeholder="170" @blur="v('estatura')" />
            <span v-if="errors.estatura" class="field-error">{{ errors.estatura }}</span>
          </div>

          <div class="field span-2">
            <label for="actividad">Nivel de actividad física</label>
            <select id="actividad" v-model="form.actividad" class="input">
              <option value="1.2">Sedentario (poco o sin ejercicio)</option>
              <option value="1.375">Ligero (1–3 días/semana)</option>
              <option value="1.55">Moderado (3–5 días/semana)</option>
              <option value="1.725">Activo (6–7 días/semana)</option>
              <option value="1.9">Muy activo (2x/día o trabajo físico)</option>
            </select>
          </div>
        </div>

        <!-- Preview en tiempo real del TDEE -->
        <div v-if="tmbPreview !== '—'" class="tdee-preview">
          <div class="tdee-icon">🔥</div>
          <div class="tdee-content">
            <span class="tdee-label">TDEE estimado</span>
            <span class="tdee-value">{{ tdeePreview }} <small>kcal/día</small></span>
          </div>
          <div class="tdee-formula">
            TMB {{ tmbPreview }} × {{ form.actividad }}
          </div>
        </div>

        <!-- Padecimientos -->
        <div class="diseases-section">
          <h4 class="section-subtitle">🩺 Padecimientos / alergias</h4>
          <p class="section-hint">El semáforo de alimentos se ajustará automáticamente.</p>
          <div class="disease-grid">
            <label v-for="d in diseases" :key="d.key" class="disease-chip" :class="{ selected: form.condiciones[d.key] }">
              <input type="checkbox" v-model="form.condiciones[d.key]" class="sr-only" />
              <span class="disease-icon">{{ d.icon }}</span>
              <span class="disease-name">{{ d.label }}</span>
              <span class="check-mark">{{ form.condiciones[d.key] ? '✓' : '' }}</span>
            </label>
          </div>
        </div>

        <!-- Condiciones auto-calculadas por IMC -->
        <div class="auto-conds-section">
          <h4 class="section-subtitle">⚖️ Condiciones por IMC</h4>
          <p class="section-hint">Calculadas automáticamente según tu peso y estatura.</p>
          <div class="disease-grid">
            <div v-for="ac in autoConditions" :key="ac.key" class="disease-chip auto"
              :class="{ selected: ac.active }">
              <span class="disease-icon">{{ ac.icon }}</span>
              <span class="disease-name">{{ ac.label }}</span>
              <span class="auto-badge" :class="ac.active ? 'on' : 'off'">
                {{ ac.active ? ac.label : '—' }}
              </span>
              <span class="auto-lock">🔒</span>
            </div>
          </div>
        </div>

        <!-- Indicador de cambios sin guardar -->
        <div v-if="isDirty" class="unsaved-bar" role="status">
          <span>💡 Tienes cambios sin guardar</span>
        </div>

        <button type="submit" class="btn btn-primary btn-full save-btn" :disabled="saving">
          <span v-if="saving" class="spinner-sm"></span>
          {{ saving ? 'Guardando...' : '💾 Guardar perfil' }}
        </button>
      </form>
    </div>

    <!-- CTA al semáforo -->
    <div v-if="store.hasProfile" class="cta-card card">
      <p>✅ Perfil guardado. Consulta tu semáforo de alimentos personalizado.</p>
      <router-link to="/semaforo" class="btn btn-outline btn-full">Ver semáforo 🚦</router-link>
    </div>

    <!-- Dietas asignadas -->
    <div v-if="store.hasProfile" class="dietas-section card">
      <h3 class="section-title"><span>🥗</span> Dietas asignadas</h3>
      <div v-if="loadingDietas" class="loading-dietas">
        <span class="spinner-sm"></span> Cargando dietas...
      </div>
      <div v-else-if="!dietas.length" class="empty-dietas">
        <p>No tienes dietas asignadas por el momento.</p>
      </div>
      <div v-else class="dietas-list">
        <div v-for="d in dietas" :key="d.id" class="dieta-item">
          <div class="di-header">
            <span class="di-icon">🥗</span>
            <div class="di-info">
              <h4>{{ d.nombre }}</h4>
              <span class="di-badge" :class="d.activa ? 'activa' : 'inactiva'">{{ d.activa ? 'Activa' : 'Inactiva' }}</span>
            </div>
          </div>
          <p v-if="d.descripcion" class="di-desc">{{ d.descripcion }}</p>
          <div class="di-stats">
            <span>🔥 {{ d.kcal_objetivo ?? '—' }} kcal/día</span>
            <span>📅 {{ d.duracion_dias ?? '—' }} días</span>
          </div>
          <div v-if="d.prot_g || d.carbs_g || d.grasas_g" class="di-macros">
            <span v-if="d.prot_g">🥩 {{ d.prot_g }}g prot</span>
            <span v-if="d.carbs_g">🌾 {{ d.carbs_g }}g carbs</span>
            <span v-if="d.grasas_g">🧈 {{ d.grasas_g }}g grasas</span>
          </div>
          <p v-if="d.notas" class="di-notas">📝 {{ d.notas }}</p>
        </div>
      </div>
    </div>

    <!-- Mi Especialista -->
    <div v-if="store.hasProfile && especialistaInfo" class="especialista-section card">
      <h3 class="section-title"><span>👨‍⚕️</span> Mi Especialista</h3>
      <div class="esp-card">
        <div class="esp-header">
          <div class="esp-avatar">{{ especialistaInicial }}</div>
          <div class="esp-info">
            <h4 class="esp-nombre">{{ especialistaInfo.nombre || 'Especialista' }}</h4>
            <span v-if="especialistaInfo.especialidad" class="esp-especialidad">{{ especialistaInfo.especialidad }}</span>
          </div>
        </div>
        <div v-if="especialistaInfo.descripcion" class="esp-desc">{{ especialistaInfo.descripcion }}</div>
        <div class="esp-details">
          <div v-if="especialistaInfo.telefono" class="esp-row">
            <span class="esp-row-icon">📞</span>
            <span>{{ especialistaInfo.telefono }}</span>
          </div>
          <div v-if="especialistaInfo.institucion" class="esp-row">
            <span class="esp-row-icon">🏥</span>
            <span>{{ especialistaInfo.institucion }}</span>
          </div>
          <div v-if="especialistaInfo.cedula" class="esp-row">
            <span class="esp-row-icon">🪪</span>
            <span>Cédula: {{ especialistaInfo.cedula }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="store.hasProfile && !cargandoEspecialista" class="especialista-section card">
      <h3 class="section-title"><span>👨‍⚕️</span> Mi Especialista</h3>
      <p class="esp-empty">No tienes un especialista asignado. Pregunta a tu especialista para que te agregue.</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const saving = ref(false)
const isDirty = ref(false)
const toast = reactive({ show: false, message: '', type: 'success' })
const dietas = ref([])
const loadingDietas = ref(false)
const especialistaInfo = ref(null)
const cargandoEspecialista = ref(false)

const diseases = [
  { key: 'celiaquía',    label: 'Celiaquía',    icon: '🌾' },
  { key: 'hipertension', label: 'Hipertensión', icon: '💊' },
  { key: 'diabetes_t2',  label: 'Diabetes',     icon: '🩸' },
]

const autoConditions = computed(() => {
  const c = store.profile?.condiciones || {}
  return [
    { key: 'obesidad',  label: 'Obesidad',  icon: '⚖️', active: !!c.obesidad },
    { key: 'sobrepeso', label: 'Sobrepeso', icon: '⚖️', active: !!c.sobrepeso },
  ]
})

// ── Nombre desde profiles (con fallback) ─────────────────────────────────────
const nombreCompleto = computed(() => {
  if (store.profile?.nombre?.trim()) return store.profile.nombre.trim()
  if (store.authUser?.name?.trim()) return store.authUser.name.trim()
  return store.authUser?.email?.split('@')[0] || '—'
})

const primerNombre = computed(() => nombreCompleto.value.split(' ')[0])

// Solo la primera inicial del primer nombre
const initials = computed(() => {
  const n = nombreCompleto.value
  if (!n || n === '—') return '?'
  return n.charAt(0).toUpperCase()
})

// ── Límites para el input de fecha ───────────────────────────────────────────
const fechaMaxima = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().split('T')[0]
})
const fechaMinima = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 120)
  return d.toISOString().split('T')[0]
})

// ── Inicializar form desde el store ──────────────────────────────────────────
const defaultForm = () => ({
  fecha_nacimiento: store.profile?.fecha_nacimiento || '',
  sexo:      store.profile?.sexo      || '',
  peso:      store.profile?.peso      || '',
  estatura:  store.profile?.estatura  || '',
  actividad: store.profile?.actividad || '1.375',
  condiciones: {
    celiaquía:    store.profile?.condiciones?.celiaquía    || false,
    hipertension: store.profile?.condiciones?.hipertension || false,
    diabetes_t2:  store.profile?.condiciones?.diabetes_t2  || false,
  }
})

const form = reactive(defaultForm())
const errors = reactive({ fecha_nacimiento: '', sexo: '', peso: '', estatura: '' })

// Recalcular form si el perfil se carga después del montaje
watch(() => store.profile, (p) => {
  if (!p) return
  form.fecha_nacimiento = p.fecha_nacimiento || ''
  form.sexo      = p.sexo      || ''
  form.peso      = p.peso      || ''
  form.estatura  = p.estatura  || ''
  form.actividad = p.actividad || '1.375'
  form.condiciones.celiaquía    = p.condiciones?.celiaquía    || false
  form.condiciones.hipertension = p.condiciones?.hipertension || false
  form.condiciones.diabetes_t2  = p.condiciones?.diabetes_t2  || false
  isDirty.value = false
  cargarDietas()
  cargarEspecialista()
}, { immediate: true })

watch(form, () => { isDirty.value = true }, { deep: true })

onMounted(() => {
  if (store.authUser?.id) cargarDietas()
})

// ── Edad calculada en tiempo real ────────────────────────────────────────────
const edadCalculada = computed(() => {
  if (!form.fecha_nacimiento) return null
  const [year, month, day] = form.fecha_nacimiento.split('-').map(Number)
  const nac = new Date(year, month - 1, day)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
  if (hoy < cumple) edad--
  return edad >= 0 && edad <= 120 ? edad : null
})

// ── Métricas del perfil ──────────────────────────────────────────────────────
const imc = computed(() => {
  if (!form.peso || !form.estatura) return '—'
  const h = form.estatura / 100
  return (form.peso / (h * h)).toFixed(1)
})

const imcColor = computed(() => {
  const v = parseFloat(imc.value)
  if (isNaN(v)) return 'var(--gray-400)'
  if (v < 18.5) return '#4361EE'
  if (v < 25)   return '#00C896'
  if (v < 30)   return '#FFB800'
  return '#FF4757'
})
const imcLabel = computed(() => {
  const v = parseFloat(imc.value)
  if (isNaN(v)) return '—'
  if (v < 18.5) return 'Bajo peso'
  if (v < 25)   return 'Normal'
  if (v < 30)   return 'Sobrepeso'
  return 'Obesidad'
})

// TMB/TDEE usando la edad calculada en tiempo real
const tmbPreview = computed(() => {
  const { peso, estatura, sexo } = form
  const edad = edadCalculada.value
  if (!peso || !estatura || !edad || !sexo) return '—'
  const val = sexo === 'M'
    ? 10 * peso + 6.25 * estatura - 5 * edad + 5
    : 10 * peso + 6.25 * estatura - 5 * edad - 161
  return Math.round(val)
})
const tdeePreview = computed(() => {
  if (tmbPreview.value === '—') return '—'
  return Math.round(tmbPreview.value * parseFloat(form.actividad))
})

// Para la tarjeta de resumen (usa datos guardados del store)
const tmb = computed(() => {
  if (store.profile?.dieta?.kcal_objetivo) return '—'
  const { peso, estatura, edad, sexo } = store.profile || {}
  if (!peso || !estatura || !edad || !sexo) return '—'
  const val = sexo === 'M'
    ? 10 * peso + 6.25 * estatura - 5 * edad + 5
    : 10 * peso + 6.25 * estatura - 5 * edad - 161
  return Math.round(val)
})
const tdee = computed(() => {
  if (store.profile?.dieta?.kcal_objetivo) return store.profile.dieta.kcal_objetivo
  if (tmb.value === '—') return '—'
  return Math.round(tmb.value * parseFloat(store.profile?.actividad || 1.375))
})

// ── Validación ───────────────────────────────────────────────────────────────
function v(field) {
  if (field === 'fecha_nacimiento') {
    if (!form.fecha_nacimiento) {
      errors.fecha_nacimiento = 'La fecha de nacimiento es requerida.'
    } else if (edadCalculada.value === null || edadCalculada.value < 1 || edadCalculada.value > 120) {
      errors.fecha_nacimiento = 'Fecha inválida (edad entre 1 y 120 años).'
    } else {
      errors.fecha_nacimiento = ''
    }
  }
  if (field === 'sexo')     errors.sexo     = !form.sexo ? 'Selecciona una opción.' : ''
  if (field === 'peso')     errors.peso     = (!form.peso || form.peso < 20 || form.peso > 300) ? 'Peso inválido (20–300 kg).' : ''
  if (field === 'estatura') errors.estatura = (!form.estatura || form.estatura < 50 || form.estatura > 250) ? 'Estatura inválida (50–250 cm).' : ''
}

function showToast(msg, type) {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

async function cargarDietas() {
  if (!store.authUser?.id) return
  loadingDietas.value = true
  const { data } = await supabase
    .from('dietas')
    .select('*')
    .eq('paciente_id', store.authUser.id)
    .order('created_at', { ascending: false })
  dietas.value = data || []
  loadingDietas.value = false
}

const especialistaInicial = computed(() => {
  const n = especialistaInfo.value?.nombre?.trim()
  return n ? n.charAt(0).toUpperCase() : '👨‍⚕️'
})

async function cargarEspecialista() {
  const espId = store.profile?.especialista_id
  if (!espId) { especialistaInfo.value = null; return }
  cargandoEspecialista.value = true
  try {
    const { data } = await supabase
      .from('profiles')
      .select('nombre, especialidad, telefono, cedula, institucion, descripcion')
      .eq('id', espId)
      .maybeSingle()
    especialistaInfo.value = data || null
  } catch {
    especialistaInfo.value = null
  } finally {
    cargandoEspecialista.value = false
  }
}

async function saveProfile() {
  ['fecha_nacimiento', 'sexo', 'peso', 'estatura'].forEach(f => v(f))
  if (Object.values(errors).some(e => e)) {
    showToast('Corrige los errores antes de guardar.', 'error')
    return
  }
  saving.value = true
  showToast('Guardando perfil...', 'loading')
  try {
    await store.saveProfile({ ...form })
    isDirty.value = false
    showToast('¡Perfil actualizado correctamente! ✅', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.profile-header {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
}
.avatar-circle {
  width: 60px; height: 60px; flex-shrink: 0; border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 26px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.profile-header-info { display: flex; flex-direction: column; gap: 2px; }
.profile-welcome {
  font-size: 13px; font-weight: 600;
  color: var(--green-dark);
  margin-bottom: 1px;
}
.profile-name { font-size: 18px; font-weight: 700; color: var(--gray-900); }
.profile-sub { margin-top: 4px; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stat-card {
  background: white; border-radius: var(--radius-md); padding: 14px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  box-shadow: var(--shadow-sm);
}
.stat-val { font-size: 20px; font-weight: 800; color: var(--gray-900); }
.stat-lbl { font-size: 11px; color: var(--gray-400); font-weight: 600; }

.caloric-card { display: flex; flex-direction: column; gap: 14px; }
.caloric-header { display: flex; align-items: center; gap: 12px; }
.caloric-header span { font-size: 28px; }
.caloric-header h4 { font-size: 15px; font-weight: 700; }
.caloric-header p { font-size: 12px; color: var(--gray-400); }
.caloric-values {
  display: flex; align-items: center; justify-content: space-around;
  background: var(--gray-50); border-radius: var(--radius-md); padding: 16px;
}
.caloric-item { text-align: center; }
.caloric-num { display: block; font-size: 28px; font-weight: 800; color: var(--gray-900); }
.caloric-label { font-size: 12px; color: var(--gray-500); }
.caloric-divider { width: 1px; height: 40px; background: var(--gray-200); }

.form-section { display: flex; flex-direction: column; gap: 20px; }
.section-title { font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.section-subtitle { font-size: 15px; font-weight: 600; color: var(--gray-700); }
.section-hint { font-size: 13px; color: var(--gray-500); margin-top: 2px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.span-2 { grid-column: 1 / -1; }

.edad-hint {
  display: inline-block; margin-top: 4px;
  font-size: 12px; font-weight: 600; color: var(--green-dark);
  background: var(--green-light); padding: 2px 10px; border-radius: 99px;
}

.tdee-preview {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(135deg, var(--green-light), #f0fdf9);
  border: 1.5px solid var(--green);
  border-radius: var(--radius-md); padding: 14px 16px;
  pointer-events: none; user-select: none;
}
.tdee-icon { font-size: 22px; flex-shrink: 0; }
.tdee-content { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.tdee-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--green-dark); opacity: .75;
}
.tdee-value {
  font-size: 22px; font-weight: 800; color: var(--green-dark); line-height: 1.1;
}
.tdee-value small { font-size: 13px; font-weight: 600; opacity: .7; }
.tdee-formula {
  font-size: 11px; font-weight: 600; color: var(--gray-400);
  background: rgba(0,0,0,.04); border-radius: var(--radius-sm);
  padding: 4px 10px; white-space: nowrap; flex-shrink: 0;
}

.diseases-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.auto-conds-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; padding-top: 8px; border-top: 1px solid var(--gray-200); }
.disease-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.disease-chip {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px;
  background: var(--gray-50); border: 2px solid var(--gray-200);
  border-radius: var(--radius-md); cursor: pointer;
  transition: all .2s; text-align: center; position: relative;
}
.disease-chip:hover { border-color: var(--green); background: var(--green-light); }
.disease-chip.selected { border-color: var(--green); background: var(--green-light); }
.disease-chip.auto { cursor: default; opacity: .85; }
.disease-chip.auto.selected { border-color: var(--gray-300); background: var(--gray-100); }
.disease-icon { font-size: 24px; }
.disease-name { font-size: 12px; font-weight: 600; color: var(--gray-700); }
.check-mark {
  position: absolute; top: 6px; right: 8px;
  font-size: 12px; color: var(--green); font-weight: 700;
}
.auto-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px;
}
.auto-badge.on  { background: var(--green-light); color: var(--green-dark); }
.auto-badge.off { background: var(--gray-100); color: var(--gray-400); }
.auto-lock {
  position: absolute; top: 6px; right: 8px;
  font-size: 10px; opacity: .5;
}

.unsaved-bar {
  background: var(--yellow-light); border: 1px solid var(--yellow);
  border-radius: var(--radius-sm); padding: 10px 14px;
  font-size: 13px; color: #7A5800; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}

.cta-card { display: flex; flex-direction: column; gap: 12px; text-align: center; }
.cta-card p { font-size: 14px; color: var(--gray-600); }

.save-btn { margin-top: 8px; }

.dietas-section { display: flex; flex-direction: column; gap: 12px; }
.loading-dietas { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-500); }
.empty-dietas { text-align: center; padding: 24px; color: var(--gray-500); font-size: 14px; }
.dietas-list { display: flex; flex-direction: column; gap: 12px; }
.dieta-item { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--gray-50); border-radius: var(--radius-md); }
.di-header { display: flex; align-items: center; gap: 12px; }
.di-icon { font-size: 24px; }
.di-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.di-info h4 { font-size: 15px; font-weight: 700; color: var(--gray-900); }
.di-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.di-badge.activa   { background: var(--green-light); color: var(--green-dark); }
.di-badge.inactiva { background: var(--gray-100); color: var(--gray-400); }
.di-desc  { font-size: 13px; color: var(--gray-600); }
.di-stats { display: flex; gap: 14px; font-size: 12px; font-weight: 600; color: var(--gray-500); }
.di-macros { display: flex; gap: 12px; font-size: 12px; font-weight: 600; color: var(--gray-500); }
.di-notas { font-size: 12px; color: var(--gray-500); background: white; border-radius: var(--radius-sm); padding: 8px 12px; }

.caloric-diet-macros { display: flex; gap: 14px; font-size: 12px; font-weight: 600; color: var(--gray-500); background: var(--gray-50); border-radius: var(--radius-md); padding: 10px 16px; justify-content: center; }

.especialista-section { display: flex; flex-direction: column; gap: 14px; }
.esp-card { display: flex; flex-direction: column; gap: 12px; }
.esp-header { display: flex; align-items: center; gap: 14px; }
.esp-avatar {
  width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.esp-info { flex: 1; min-width: 0; }
.esp-nombre { font-size: 16px; font-weight: 700; color: var(--gray-900); }
.esp-especialidad { font-size: 12px; color: var(--green-dark); font-weight: 600; background: var(--green-light); padding: 2px 10px; border-radius: 99px; display: inline-block; margin-top: 4px; }
.esp-desc { font-size: 13px; color: var(--gray-600); line-height: 1.5; padding: 10px 14px; background: var(--gray-50); border-radius: var(--radius-md); }
.esp-details { display: flex; flex-direction: column; gap: 6px; }
.esp-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--gray-600); }
.esp-row-icon { font-size: 15px; width: 20px; text-align: center; }
.esp-empty { font-size: 13px; color: var(--gray-500); text-align: center; padding: 16px; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>