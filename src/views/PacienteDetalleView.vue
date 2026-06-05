<template>
  <div class="paciente-detalle-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div><p>Cargando datos del paciente...</p>
    </div>

    <template v-else-if="paciente">
      <!-- Header -->
      <div class="paciente-header card">
        <button class="back-btn" @click="$router.back()">← Volver</button>
        <div class="ph-content">
          <div class="ph-avatar" :style="{ background: avatarColor(paciente.nombre) }">
            {{ inicial(paciente.nombre) }}
          </div>
          <div class="ph-info">
            <h2>{{ paciente.nombre || 'Sin nombre' }}</h2>
            <p class="ph-sub">{{ paciente._edad ? `${paciente._edad} años` : 'Edad no registrada' }} · {{ sexoLabel }}</p>
            <div class="ph-conds">
              <span v-for="c in condicionesActivas" :key="c.key" class="cond-badge" :class="c.key">
                {{ c.icon }} {{ c.label }}
              </span>
              <span v-if="!condicionesActivas.length" class="cond-badge none">Sin padecimientos</span>
            </div>
          </div>
          <div class="ph-stats">
            <div class="phs-item"><span class="phs-val">{{ paciente.peso_kg ? paciente.peso_kg + ' kg' : '—' }}</span><span class="phs-lbl">Peso</span></div>
            <div class="phs-item"><span class="phs-val">{{ paciente.talla_cm ? paciente.talla_cm + ' cm' : '—' }}</span><span class="phs-lbl">Talla</span></div>
            <div class="phs-item"><span class="phs-val">{{ imc }}</span><span class="phs-lbl">IMC</span></div>
            <div class="phs-item"><span class="phs-val" :style="{ color: imcColor }">{{ imcLabel }}</span><span class="phs-lbl">Estado</span></div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button v-for="t in tabs" :key="t.key" class="tab-btn" :class="{ active: tabActual === t.key }" @click="tabActual = t.key">
          <span>{{ t.icon }}</span> {{ t.label }}
        </button>
      </div>

      <!-- ── TAB: PERFIL ── -->
      <div v-if="tabActual === 'perfil'" class="tab-content">
        <div class="form-section card">
          <h3 class="section-title"><span>📋</span> Datos personales</h3>
          <div class="form-grid">
            <div class="field">
              <label>Nombre completo</label>
              <input v-model="editForm.nombre" type="text" class="input" />
            </div>
            <div class="field">
              <label>Fecha de nacimiento</label>
              <input v-model="editForm.fecha_nacimiento" type="date" class="input" />
            </div>
            <div class="field">
              <label>Sexo</label>
              <select v-model="editForm.sexo" class="input">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div class="field">
              <label>Peso (kg)</label>
              <input v-model.number="editForm.peso_kg" type="number" class="input" min="20" max="300" step="0.1" />
            </div>
            <div class="field">
              <label>Talla (cm)</label>
              <input v-model.number="editForm.talla_cm" type="number" class="input" min="50" max="250" />
            </div>
            <div class="field">
              <label>Nivel de actividad</label>
              <select v-model="editForm.actividad" class="input">
                <option value="1.2">Sedentario</option>
                <option value="1.375">Ligero (1–3 días/sem)</option>
                <option value="1.55">Moderado (3–5 días/sem)</option>
                <option value="1.725">Activo (6–7 días/sem)</option>
                <option value="1.9">Muy activo</option>
              </select>
            </div>
          </div>

          <div v-if="isDirty" class="unsaved-bar">💡 Tienes cambios sin guardar</div>

          <button class="btn btn-primary" :disabled="guardando" @click="guardarPerfil">
            <span v-if="guardando" class="spinner-sm"></span>
            {{ guardando ? 'Guardando...' : '💾 Guardar cambios' }}
          </button>
        </div>

        <!-- Padecimientos -->
        <div class="conds-section card">
          <h3 class="section-title"><span>🩺</span> Padecimientos</h3>
          <p class="section-hint">Activa o desactiva las condiciones médicas del paciente.</p>
          <div class="cond-chips">
            <label v-for="cond in todasCondiciones" :key="cond.id" class="cond-chip-edit" :class="{ selected: editForm.condiciones[cond.clave] }">
              <input type="checkbox" v-model="editForm.condiciones[cond.clave]" class="sr-only" />
              <span class="cond-icon">{{ cond.icono || '🩺' }}</span>
              <span>{{ cond.nombre }}</span>
              <span class="check-mark">{{ editForm.condiciones[cond.clave] ? '✓' : '' }}</span>
            </label>
          </div>
          <button class="btn btn-outline" :disabled="guardandoConds" @click="guardarCondiciones">
            <span v-if="guardandoConds" class="spinner-sm"></span>
            {{ guardandoConds ? 'Guardando...' : '🩺 Guardar padecimientos' }}
          </button>
        </div>
      </div>

      <!-- ── TAB: DIARIO HOY ── -->
      <div v-if="tabActual === 'diario'" class="tab-content">
        <div class="diario-nav">
          <button class="nav-btn" @click="irDia(-1)">‹ Anterior</button>
          <span class="fecha-badge">{{ fechaFormateada }}</span>
          <button class="nav-btn" @click="irDia(1)" :disabled="fechaDiario >= hoy()">Siguiente ›</button>
        </div>

        <div class="resumen-mini card">
          <div class="rm-item"><span class="rm-val" :style="{ color: colorKcal }">{{ totalKcal }}</span><span class="rm-lbl">kcal</span></div>
          <div class="rm-div"></div>
          <div class="rm-item"><span class="rm-val">{{ tdee }}</span><span class="rm-lbl">meta</span></div>
          <div class="rm-div"></div>
          <div class="rm-semaforo">
            <span class="rs-dot verde">{{ totalesSem.verde }}</span>
            <span class="rs-dot amarillo">{{ totalesSem.amarillo }}</span>
            <span class="rs-dot rojo">{{ totalesSem.rojo }}</span>
          </div>
        </div>

        <div v-if="!entradasDiario.length" class="empty-diario card">
          <span>📭</span><p>Sin registros para esta fecha</p>
        </div>

        <div v-else class="entradas-por-tipo">
          <div v-for="meal in mealTypes" :key="meal.key">
            <div v-if="entradasPorTipo[meal.key]?.length" class="meal-block">
              <div class="meal-title"><span>{{ meal.icon }}</span> {{ meal.label }}</div>
              <div v-for="e in entradasPorTipo[meal.key]" :key="e.id" class="entrada-row" :class="e.color_semaforo || 'verde'">
                <span class="er-dot" :class="e.color_semaforo || 'verde'"></span>
                <span class="er-nombre">{{ e.origen === 'receta' ? e.receta_nombre : e.alimento_nombre }}</span>
                <span class="er-kcal">{{ e.origen === 'receta' ? e.receta_kcal : e.alimento_kcal }} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB: DIETAS ASIGNADAS ── -->
      <div v-if="tabActual === 'dietas'" class="tab-content">
        <div v-if="!dietasPaciente.length" class="empty-card card">
          <div class="empty-icon">🥗</div>
          <h3>Sin dietas asignadas</h3>
          <p>Ve a la sección de Dietas para asignar un plan a este paciente.</p>
          <router-link to="/esp/dietas" class="btn btn-primary">Ir a Dietas</router-link>
        </div>
        <div v-else class="dietas-list">
          <div v-for="d in dietasPaciente" :key="d.id" class="dieta-item card">
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
            <p v-if="d.notas" class="di-notas">📝 {{ d.notas }}</p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-card card">
      <div class="empty-icon">👤</div>
      <h3>Paciente no encontrado</h3>
      <button class="btn btn-primary" @click="$router.back()">← Volver</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const route = useRoute()
const store = useUserStore()
const toast = reactive({ show: false, message: '', type: 'success' })

const loading = ref(false)
const guardando = ref(false)
const guardandoConds = ref(false)
const paciente = ref(null)
const todasCondiciones = ref([])
const entradasDiario = ref([])
const dietasPaciente = ref([])
const tabActual = ref('perfil')
const isDirty = ref(false)
const fechaDiario = ref(hoy())

const editForm = reactive({
  nombre: '', fecha_nacimiento: '', sexo: '',
  peso_kg: null, talla_cm: null, actividad: '1.375',
  condiciones: {},
})

const tabs = [
  { key: 'perfil', label: 'Perfil', icon: '👤' },
  { key: 'diario', label: 'Diario', icon: '📅' },
  { key: 'dietas', label: 'Dietas', icon: '🥗' },
]

const mealTypes = [
  { key: 'desayuno', label: 'Desayuno', icon: '🌅' },
  { key: 'comida',   label: 'Comida',   icon: '☀️' },
  { key: 'cena',     label: 'Cena',     icon: '🌙' },
  { key: 'snack',    label: 'Snack',    icon: '🍎' },
]

const COND_META = {
  celiaquía:    { label: 'Celiaquía',    icon: '🌾' },
  hipertension: { label: 'Hipertensión', icon: '💊' },
  diabetes_t2:  { label: 'Diabetes',     icon: '🩸' },
  obesidad:     { label: 'Obesidad',     icon: '⚖️' },
  sobrepeso:    { label: 'Sobrepeso',    icon: '⚖️' },
}

const AVATAR_COLORS = ['#00C896','#4361EE','#FF4757','#FFB800','#9B59B6','#1ABC9C','#E67E22']
function avatarColor(nombre) { return AVATAR_COLORS[(nombre || '?').charCodeAt(0) % AVATAR_COLORS.length] }
function inicial(nombre) { return (nombre || '?').charAt(0).toUpperCase() }
function hoy() { return new Date().toISOString().split('T')[0] }

const sexoLabel = computed(() =>
  paciente.value?.sexo === 'M' ? 'Masculino' : paciente.value?.sexo === 'F' ? 'Femenino' : ''
)

const condicionesActivas = computed(() =>
  Object.entries(paciente.value?._condiciones || {})
    .filter(([, v]) => v)
    .map(([k]) => ({ key: k, ...(COND_META[k] || { label: k, icon: '🩺' }) }))
)

const imc = computed(() => {
  const p = paciente.value
  if (!p?.peso_kg || !p?.talla_cm) return '—'
  const h = p.talla_cm / 100
  return (p.peso_kg / (h * h)).toFixed(1)
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

const tdee = computed(() => {
  const p = paciente.value
  const dietaActiva = dietasPaciente.value.find(d => d.activa)
  if (dietaActiva?.kcal_objetivo) return dietaActiva.kcal_objetivo
  if (!p?.peso_kg || !p?.talla_cm || !p?._edad || !p?.sexo) return 2000
  const tmb = p.sexo === 'M'
    ? 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p._edad + 5
    : 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p._edad - 161
  return Math.round(tmb * parseFloat(p.actividad || 1.375))
})

const totalKcal = computed(() =>
  Math.round(entradasDiario.value.reduce((s, e) =>
    s + parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0)), 0))
)
const colorKcal = computed(() => {
  const pct = totalKcal.value / tdee.value
  return pct > 1.1 ? 'var(--red)' : pct > 0.9 ? 'var(--green)' : 'var(--yellow)'
})
const totalesSem = computed(() => {
  const t = { verde: 0, amarillo: 0, rojo: 0 }
  for (const e of entradasDiario.value) {
    const c = e.color_semaforo
    if (c && t[c] !== undefined) t[c]++
  }
  return t
})
const entradasPorTipo = computed(() => {
  const m = {}
  for (const meal of mealTypes)
    m[meal.key] = entradasDiario.value.filter(e => e.tipo_comida === meal.key)
  return m
})

const fechaFormateada = computed(() =>
  new Date(fechaDiario.value + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
)

function irDia(delta) {
  const d = new Date(fechaDiario.value + 'T12:00')
  d.setDate(d.getDate() + delta)
  fechaDiario.value = d.toISOString().split('T')[0]
}

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

async function cargar() {
  loading.value = true
  const uid = route.params.id
  const [{ data: p }, { data: conds }, { data: todasConds }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('usuario_condiciones').select('condicion_id, activa, condiciones_medicas(clave)').eq('usuario_id', uid).eq('activa', true),
    supabase.from('condiciones_medicas').select('*').order('nombre'),
  ])
  todasCondiciones.value = todasConds || []
  const condiciones = {}
  for (const c of conds || []) condiciones[c.condiciones_medicas.clave] = true
  let edad = null
  if (p?.fecha_nacimiento) {
    const [y, m, d] = p.fecha_nacimiento.split('-').map(Number)
    const hoyDate = new Date(); edad = hoyDate.getFullYear() - y
    if (new Date(hoyDate.getFullYear(), m - 1, d) > hoyDate) edad--
  }
  paciente.value = { ...p, _condiciones: condiciones, _edad: edad }
  // Poblar form
  editForm.nombre = p?.nombre || ''
  editForm.fecha_nacimiento = p?.fecha_nacimiento || ''
  editForm.sexo = p?.sexo || ''
  editForm.peso_kg = p?.peso_kg || null
  editForm.talla_cm = p?.talla_cm || null
  editForm.actividad = String(p?.actividad || '1.375')
  const c = {}
  for (const cond of todasConds || []) c[cond.clave] = !!condiciones[cond.clave]
  editForm.condiciones = c
  isDirty.value = false
  await cargarDiario()
  await cargarDietas()
  loading.value = false
}

async function cargarDiario() {
  const { data } = await supabase
    .from('diario_alimenticio')
    .select('*')
    .eq('user_id', route.params.id)
    .eq('fecha', fechaDiario.value)
    .order('created_at')
  entradasDiario.value = data || []
}

async function cargarDietas() {
  const { data } = await supabase
    .from('dietas')
    .select('*')
    .eq('paciente_id', route.params.id)
    .order('created_at', { ascending: false })
  dietasPaciente.value = data || []
}

async function guardarPerfil() {
  guardando.value = true
  showToast('Guardando...', 'loading')
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: route.params.id,
      nombre: editForm.nombre.trim(),
      fecha_nacimiento: editForm.fecha_nacimiento || null,
      sexo: editForm.sexo || null,
      peso_kg: editForm.peso_kg || null,
      talla_cm: editForm.talla_cm || null,
      actividad: parseFloat(editForm.actividad) || 1.375,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    showToast('Perfil actualizado ✅', 'success')
    isDirty.value = false
    await cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardando.value = false
  }
}

async function guardarCondiciones() {
  guardandoConds.value = true
  showToast('Guardando padecimientos...', 'loading')
  try {
    // Auto-calcular obesidad/sobrepeso desde IMC
    const peso = parseFloat(editForm.peso_kg)
    const talla = parseFloat(editForm.talla_cm)
    if (peso && talla) {
      const h = talla / 100
      const bmi = peso / (h * h)
      editForm.condiciones.obesidad = bmi >= 30
      editForm.condiciones.sobrepeso = bmi >= 25 && bmi < 30
    }
    const hoyStr = new Date().toISOString().split('T')[0]
    const rows = todasCondiciones.value.map(cond => ({
      usuario_id: route.params.id,
      condicion_id: cond.id,
      activa: !!editForm.condiciones[cond.clave],
      fecha_inicio: hoyStr,
    }))
    const { error } = await supabase
      .from('usuario_condiciones')
      .upsert(rows, { onConflict: 'usuario_id,condicion_id' })
    if (error) throw error
    showToast('Padecimientos actualizados ✅', 'success')
    await cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardandoConds.value = false
  }
}

watch(editForm, () => { isDirty.value = true }, { deep: true })
watch(fechaDiario, cargarDiario)
onMounted(cargar)
</script>

<style scoped>
.paciente-detalle-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.paciente-header { display: flex; flex-direction: column; gap: 14px; }
.back-btn { background: none; border: none; color: var(--green); font-size: 13px; font-weight: 600; cursor: pointer; align-self: flex-start; padding: 0; }
.ph-content { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.ph-avatar { width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0; color: white; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.ph-info { flex: 1; min-width: 0; }
.ph-info h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.ph-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.ph-conds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.cond-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px; }
.cond-badge.hipertension { background: var(--blue-light); color: var(--blue); }
.cond-badge.diabetes_t2  { background: var(--red-light);  color: var(--red); }
.cond-badge.celiaquía    { background: var(--yellow-light); color: #7A5800; }
.cond-badge.obesidad     { background: #FFF3E0; color: #E65100; }
.cond-badge.sobrepeso    { background: #FFF3E0; color: #E65100; }
.cond-badge.none         { background: var(--gray-100); color: var(--gray-500); }
.ph-stats { display: flex; gap: 14px; }
.phs-item { text-align: center; }
.phs-val { display: block; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.phs-lbl { font-size: 11px; color: var(--text-muted); }

.tabs-bar { display: flex; gap: 8px; border-bottom: 2px solid var(--border-light); padding-bottom: 2px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -2px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all .2s; }
.tab-btn.active { color: var(--green); border-bottom-color: var(--green); }

.tab-content { display: flex; flex-direction: column; gap: 14px; }

.form-section { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-primary); }
.section-hint { font-size: 13px; color: var(--text-muted); margin-top: -8px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.unsaved-bar { background: var(--yellow-light); border: 1px solid var(--yellow); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 13px; color: #7A5800; font-weight: 500; }

.conds-section { display: flex; flex-direction: column; gap: 12px; }
.cond-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cond-chip-edit { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: var(--radius-md); background: var(--bg-elevated); border: 2px solid var(--border-color); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-secondary); transition: all .2s; }
.cond-chip-edit:hover { border-color: var(--green); }
.cond-chip-edit.selected { border-color: var(--green); background: var(--green-light); color: var(--green-dark); }
.cond-icon { font-size: 16px; }
.check-mark { font-size: 12px; color: var(--green); font-weight: 800; }

.diario-nav { display: flex; align-items: center; gap: 10px; }
.nav-btn { flex: 1; padding: 8px 14px; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 2px solid var(--border-color); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; color: var(--text-secondary); }
.nav-btn:hover:not(:disabled) { border-color: var(--green); color: var(--green); }
.nav-btn:disabled { opacity: .4; cursor: not-allowed; }
.fecha-badge { flex: 2; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); background: var(--bg-elevated); padding: 8px; border-radius: var(--radius-sm); text-transform: capitalize; }

.resumen-mini { display: flex; align-items: center; gap: 14px; padding: 14px 18px; }
.rm-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.rm-val { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.rm-lbl { font-size: 11px; color: var(--text-muted); }
.rm-div { width: 1px; height: 32px; background: var(--border-light); }
.rm-semaforo { display: flex; gap: 8px; }
.rs-dot { font-size: 13px; font-weight: 700; padding: 3px 8px; border-radius: 99px; }

.empty-diario { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 32px; color: var(--text-muted); font-size: 14px; }
.empty-diario span { font-size: 28px; }

.entradas-por-tipo { display: flex; flex-direction: column; gap: 10px; }
.meal-block { background: var(--bg-surface); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); }
.meal-title { display: flex; align-items: center; gap: 8px; padding: 10px 14px; font-size: 14px; font-weight: 700; color: var(--text-primary); background: var(--bg-elevated); border-bottom: 1px solid var(--border-light); }
.entrada-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border-light); border-left: 3px solid transparent; }
.entrada-row:last-child { border-bottom: none; }
.entrada-row.verde    { border-left-color: var(--green); }
.entrada-row.amarillo { border-left-color: var(--yellow); }
.entrada-row.rojo     { border-left-color: var(--red); }
.er-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.er-dot.verde    { background: var(--green); }
.er-dot.amarillo { background: var(--yellow); }
.er-dot.rojo     { background: var(--red); }
.er-nombre { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.er-kcal   { font-size: 12px; font-weight: 700; color: var(--text-muted); }

.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); }

.dietas-list { display: flex; flex-direction: column; gap: 12px; }
.dieta-item { display: flex; flex-direction: column; gap: 8px; }
.di-header { display: flex; align-items: center; gap: 12px; }
.di-icon { font-size: 24px; }
.di-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.di-info h4 { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.di-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.di-badge.activa   { background: var(--green-light); color: var(--green-dark); }
.di-badge.inactiva { background: var(--gray-100); color: var(--gray-400); }
.di-desc  { font-size: 13px; color: var(--text-secondary); }
.di-stats { display: flex; gap: 14px; font-size: 12px; font-weight: 600; color: var(--text-muted); }
.di-notas { font-size: 12px; color: var(--text-muted); background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 8px 12px; }

.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .ph-stats { display: none; }
}
</style>