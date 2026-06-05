<template>
  <div class="dashboard-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Header -->
    <div class="dash-header">
      <div class="dash-header-info">
        <p class="dash-greeting">Panel del especialista 👨‍🔬</p>
        <h2>{{ nombreEspecialista }}</h2>
      </div>
      <div class="dash-stats-mini">
        <div class="mini-stat">
          <span class="ms-num">{{ pacientes.length }}</span>
          <span class="ms-lbl">Pacientes</span>
        </div>
        <div class="mini-stat">
          <span class="ms-num" style="color:var(--green)">{{ pacientesConRegistroHoy }}</span>
          <span class="ms-lbl">Con registro hoy</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="search-wrap">
        <input v-model="busqueda" type="search" class="input" placeholder="🔍 Buscar paciente por nombre…" />
      </div>
      <div class="cond-filters">
        <button
          v-for="c in condFiltros" :key="c.key"
          class="cond-pill" :class="{ active: filtroCondicion === c.key }"
          @click="filtroCondicion = filtroCondicion === c.key ? '' : c.key"
        >
          <span>{{ c.icon }}</span> {{ c.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div>
      <p>Cargando pacientes...</p>
    </div>

    <div v-else-if="!pacientesFiltrados.length && !busqueda && !filtroCondicion" class="empty-card card">
      <div class="empty-icon">👥</div>
      <h3>Sin pacientes asignados</h3>
      <p>Cuando un paciente te seleccione como su especialista al registrarse, aparecerá aquí automáticamente.</p>
    </div>

    <div v-else-if="!pacientesFiltrados.length" class="empty-card card">
      <div class="empty-icon">🔍</div>
      <h3>Sin resultados</h3>
      <p>Prueba cambiando los filtros de búsqueda.</p>
    </div>

    <div v-else class="pacientes-grid">
      <div
        v-for="p in pacientesFiltrados"
        :key="p.id"
        class="paciente-card card"
        @click="verPaciente(p)"
      >
        <div class="pc-header">
          <div class="pc-avatar" :style="{ background: avatarColor(p.nombre) }">
            {{ inicial(p.nombre) }}
          </div>
          <div class="pc-info">
            <h4 class="pc-nombre">{{ p.nombre || 'Sin nombre' }}</h4>
            <span class="pc-edad">{{ p.edad !== null ? `${p.edad} años` : 'Edad no registrada' }}</span>
          </div>
          <div class="pc-hoy-badge" :class="p._registroHoy ? 'activo' : 'inactivo'">
            {{ p._registroHoy ? '✓ Hoy' : 'Sin registro' }}
          </div>
        </div>

        <div class="pc-metrics">
          <div class="pcm-item">
            <span class="pcm-val">{{ p.peso_kg ? `${p.peso_kg} kg` : '—' }}</span>
            <span class="pcm-lbl">Peso</span>
          </div>
          <div class="pcm-item">
            <span class="pcm-val">{{ p.talla_cm ? `${p.talla_cm} cm` : '—' }}</span>
            <span class="pcm-lbl">Talla</span>
          </div>
          <div class="pcm-item">
            <span class="pcm-val">{{ imc(p) }}</span>
            <span class="pcm-lbl">IMC</span>
          </div>
          <div class="pcm-item">
            <span class="pcm-val" :style="{ color: colorKcalHoy(p) }">
              {{ p._kcalHoy ?? '—' }}
            </span>
            <span class="pcm-lbl">kcal hoy</span>
          </div>
        </div>

        <div v-if="condicionesActivas(p).length" class="pc-conds">
          <span v-for="c in condicionesActivas(p)" :key="c.key" class="cond-badge" :class="c.key">
            {{ c.icon }} {{ c.label }}
          </span>
        </div>

        <div v-if="p._semaforo" class="pc-semaforo">
          <div class="pcs-bar">
            <div class="pcs-seg verde"    :style="{ flex: p._semaforo.verde    || 0 }"></div>
            <div class="pcs-seg amarillo" :style="{ flex: p._semaforo.amarillo || 0 }"></div>
            <div class="pcs-seg rojo"     :style="{ flex: p._semaforo.rojo     || 0 }"></div>
          </div>
          <div class="pcs-counts">
            <span class="pcs-dot verde">{{ p._semaforo.verde }}</span>
            <span class="pcs-dot amarillo">{{ p._semaforo.amarillo }}</span>
            <span class="pcs-dot rojo">{{ p._semaforo.rojo }}</span>
          </div>
        </div>
        <div v-else class="pc-semaforo-empty">Sin entradas hoy</div>

        <div class="pc-actions" @click.stop>
          <button class="pc-btn" @click="editarPaciente(p)" title="Editar perfil">✏️ Editar</button>
          <button class="pc-btn" @click="verReportePaciente(p)" title="Ver reporte">📊 Reporte</button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL DETALLE / EDICIÓN PACIENTE ══ -->
    <transition name="modal">
      <div v-if="modalPaciente" class="modal-overlay" @click.self="modalPaciente = null">
        <div class="modal-card modal-grande">
          <div class="modal-header-row">
            <div class="modal-avatar" :style="{ background: avatarColor(modalPaciente.nombre) }">
              {{ inicial(modalPaciente.nombre) }}
            </div>
            <div>
              <h3 class="modal-nombre">{{ modalPaciente.nombre || 'Sin nombre' }}</h3>
              <p class="modal-sub">{{ modalPaciente.edad ? `${modalPaciente.edad} años` : '' }}</p>
            </div>
            <div class="modal-header-tabs">
              <button :class="{ active: modalTab === 'detalle' }" @click="modalTab = 'detalle'">📋 Detalle</button>
              <button :class="{ active: modalTab === 'editar' }"  @click="modalTab = 'editar'">✏️ Editar</button>
            </div>
            <button class="modal-close" @click="modalPaciente = null">✕</button>
          </div>

          <!-- TAB: Detalle -->
          <div v-if="modalTab === 'detalle'" class="modal-body">
            <div class="modal-stats">
              <div class="ms-item"><span class="ms-v">{{ modalPaciente.peso_kg ?? '—' }}</span><span class="ms-l">kg</span></div>
              <div class="ms-item"><span class="ms-v">{{ modalPaciente.talla_cm ?? '—' }}</span><span class="ms-l">cm</span></div>
              <div class="ms-item"><span class="ms-v">{{ imc(modalPaciente) }}</span><span class="ms-l">IMC</span></div>
              <div class="ms-item">
                <span class="ms-v" :style="{ color: colorKcalHoy(modalPaciente) }">{{ modalPaciente._kcalHoy ?? '—' }}</span>
                <span class="ms-l">kcal/hoy</span>
              </div>
            </div>

            <div v-if="condicionesActivas(modalPaciente).length" class="modal-section">
              <h5>Condiciones médicas</h5>
              <div class="conds-row">
                <span v-for="c in condicionesActivas(modalPaciente)" :key="c.key" class="cond-badge" :class="c.key">
                  {{ c.icon }} {{ c.label }}
                </span>
              </div>
            </div>

            <div v-if="modalPaciente._entradasHoy?.length" class="modal-section">
              <h5>Registro de hoy</h5>
              <div class="entradas-list">
                <div v-for="e in modalPaciente._entradasHoy" :key="e.id" class="entrada-row" :class="e.color_semaforo || 'verde'">
                  <span class="er-dot" :class="e.color_semaforo || 'verde'"></span>
                  <span class="er-nombre">{{ e.origen === 'receta' ? e.receta_nombre : e.alimento_nombre }}</span>
                  <span class="er-tipo">{{ tipoLabel(e.tipo_comida) }}</span>
                  <span class="er-kcal">{{ e.origen === 'receta' ? e.receta_kcal : e.alimento_kcal }} kcal</span>
                </div>
              </div>
            </div>
            <div v-else class="modal-empty-hoy">Sin entradas registradas hoy</div>
          </div>

          <!-- TAB: Editar -->
          <div v-if="modalTab === 'editar'" class="modal-body">
            <!-- Indicador de carga de condiciones -->
            <div v-if="cargandoCondiciones" class="conds-loading">
              <div class="spinner-sm-verde"></div>
              <span>Cargando padecimientos...</span>
            </div>

            <div class="edit-grid">
              <div class="field">
                <label>Nombre</label>
                <input v-model="editForm.nombre" type="text" class="input" placeholder="Nombre completo" />
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
                <input v-model.number="editForm.peso_kg" type="number" class="input" min="20" max="300" />
              </div>
              <div class="field">
                <label>Talla (cm)</label>
                <input v-model.number="editForm.talla_cm" type="number" class="input" min="50" max="250" />
              </div>
            </div>

            <div class="edit-conds-section">
              <h5>🩺 Padecimientos</h5>
              <p class="edit-conds-hint">Activa o desactiva las condiciones médicas del paciente</p>
              <div class="cond-chips-edit">
                <label
                  v-for="cond in todasCondiciones"
                  :key="cond.id"
                  class="cond-chip-edit"
                  :class="{ selected: editForm.condiciones[cond.clave] }"
                >
                  <input type="checkbox" v-model="editForm.condiciones[cond.clave]" class="sr-only" />
                  <span class="cond-icon">{{ cond.icono || '🩺' }}</span>
                  <span>{{ cond.nombre }}</span>
                  <span class="check-mark">{{ editForm.condiciones[cond.clave] ? '✓' : '' }}</span>
                </label>
              </div>
            </div>

            <button class="btn btn-primary btn-full" :disabled="guardandoEdit" @click="guardarEdicion">
              <span v-if="guardandoEdit" class="spinner-sm"></span>
              {{ guardandoEdit ? 'Guardando...' : '💾 Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store   = useUserStore()
const router  = useRouter()
const toast   = reactive({ show: false, message: '', type: 'success' })

const pacientes            = ref([])
const loading              = ref(false)
const busqueda             = ref('')
const filtroCondicion      = ref('')
const modalPaciente        = ref(null)
const modalTab             = ref('detalle')
const guardandoEdit        = ref(false)
const cargandoCondiciones  = ref(false)
const todasCondiciones     = ref([])

const editForm = reactive({
  nombre: '', fecha_nacimiento: '', sexo: '',
  peso_kg: null, talla_cm: null,
  condiciones: {},
})

const condFiltros = [
  { key: 'hipertension', label: 'Hipertensión', icon: '💊' },
  { key: 'diabetes_t2',  label: 'Diabetes',     icon: '🩸' },
  { key: 'celiaquía',    label: 'Celiaquía',     icon: '🌾' },
]

const COND_META = {
  celiaquía:    { label: 'Celiaquía',     icon: '🌾' },
  hipertension: { label: 'Hipertensión',  icon: '💊' },
  diabetes_t2:  { label: 'Diabetes',      icon: '🩸' },
}

const nombreEspecialista = computed(() =>
  store.profile?.nombre || store.authUser?.email?.split('@')[0] || 'Especialista'
)

const pacientesConRegistroHoy = computed(() =>
  pacientes.value.filter(p => p._registroHoy).length
)

const pacientesFiltrados = computed(() => {
  let arr = pacientes.value
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    arr = arr.filter(p => (p.nombre || '').toLowerCase().includes(q))
  }
  if (filtroCondicion.value) {
    arr = arr.filter(p => p._condiciones?.[filtroCondicion.value])
  }
  return arr
})

const AVATAR_COLORS = ['#00C896','#4361EE','#FF4757','#FFB800','#9B59B6','#1ABC9C','#E67E22']
function avatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0]
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}
function inicial(nombre) { return (nombre || '?').charAt(0).toUpperCase() }

function imc(p) {
  if (!p.peso_kg || !p.talla_cm) return '—'
  const h = p.talla_cm / 100
  return (p.peso_kg / (h * h)).toFixed(1)
}

function condicionesActivas(p) {
  return Object.entries(p._condiciones || {})
    .filter(([, v]) => v)
    .map(([k]) => ({ key: k, ...(COND_META[k] || { label: k, icon: '🩺' }) }))
}

function tipoLabel(t) {
  return { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[t] || t
}

const TDEE_FALLBACK = 2000
function tdeeDeP(p) {
  if (!p.peso_kg || !p.talla_cm || !p.edad || !p.sexo) return TDEE_FALLBACK
  const tmb = p.sexo === 'M'
    ? 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p.edad + 5
    : 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p.edad - 161
  return Math.round(tmb * parseFloat(p.actividad || 1.375))
}
function colorKcalHoy(p) {
  const k = p._kcalHoy
  if (!k) return 'var(--gray-400)'
  const tdee = tdeeDeP(p)
  if (k > tdee * 1.1) return 'var(--red)'
  if (k > tdee * 0.9) return 'var(--green)'
  return 'var(--yellow)'
}

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

// ── Cargar todas las condiciones médicas disponibles ──────────────────────
async function cargarCondiciones() {
  const { data } = await supabase.from('condiciones_medicas').select('*').order('nombre')
  todasCondiciones.value = data || []
}

// ── Cargar pacientes ─────────────────────────────────────────────────────
async function cargarPacientes() {
  const userId = store.authUser?.id
  if (!userId) return
  loading.value = true

  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .eq('especialista_id', userId)
      .eq('especialista', false)
      .order('nombre')

    if (!profs?.length) { pacientes.value = []; return }

    const ids = profs.map(p => p.id)
    const hoy = new Date().toISOString().split('T')[0]

    const [{ data: conds }, { data: diario }] = await Promise.all([
      supabase.from('usuario_condiciones')
        .select('usuario_id, activa, condiciones_medicas(clave)')
        .in('usuario_id', ids),          // ← Quitamos .eq('activa', true) aquí para obtener todas
      supabase.from('diario_alimenticio')
        .select('*').in('user_id', ids).eq('fecha', hoy).order('created_at'),
    ])

    // Construir mapa de condiciones: solo las activas
    const condPorPaciente = {}
    for (const c of conds || []) {
      if (!c.activa) continue                   // ← filtramos inactivas aquí
      if (!condPorPaciente[c.usuario_id]) condPorPaciente[c.usuario_id] = {}
      condPorPaciente[c.usuario_id][c.condiciones_medicas.clave] = true
    }

    const diarioPorPaciente = {}
    for (const e of diario || []) {
      if (!diarioPorPaciente[e.user_id]) diarioPorPaciente[e.user_id] = []
      diarioPorPaciente[e.user_id].push(e)
    }

    pacientes.value = profs.map(p => {
      const entradas = diarioPorPaciente[p.id] || []
      const kcalHoy = entradas.reduce((s, e) =>
        s + parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0)), 0)
      const semaforo = { verde: 0, amarillo: 0, rojo: 0 }
      for (const e of entradas) {
        if (e.color_semaforo && semaforo[e.color_semaforo] !== undefined) semaforo[e.color_semaforo]++
      }
      let edad = null
      if (p.fecha_nacimiento) {
        const [y, m, d] = p.fecha_nacimiento.split('-').map(Number)
        const hoyDate = new Date()
        edad = hoyDate.getFullYear() - y
        if (new Date(hoyDate.getFullYear(), m - 1, d) > hoyDate) edad--
      }
      return {
        ...p, edad,
        _condiciones: condPorPaciente[p.id] || {},
        _entradasHoy: entradas,
        _kcalHoy: entradas.length ? Math.round(kcalHoy) : null,
        _registroHoy: entradas.length > 0,
        _semaforo: entradas.length ? semaforo : null,
      }
    })
  } catch (e) {
    showToast('Error al cargar pacientes: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

// ── Acciones ─────────────────────────────────────────────────────────────
function verPaciente(p) {
  modalPaciente.value = p
  modalTab.value = 'detalle'
}

async function editarPaciente(p) {
  modalPaciente.value = p
  modalTab.value = 'editar'

  // Datos básicos del formulario
  editForm.nombre = p.nombre || ''
  editForm.fecha_nacimiento = p.fecha_nacimiento || ''
  editForm.sexo = p.sexo || ''
  editForm.peso_kg = p.peso_kg || null
  editForm.talla_cm = p.talla_cm || null

  // Cargar condiciones con estado actual (fresh desde DB)
  cargandoCondiciones.value = true
  try {
    const { data: condsActuales } = await supabase
      .from('usuario_condiciones')
      .select('condicion_id, activa, condiciones_medicas(clave)')
      .eq('usuario_id', p.id)

    // Construir mapa clave → activa
    const condMap = {}
    for (const c of condsActuales || []) {
      condMap[c.condiciones_medicas.clave] = !!c.activa
    }

    // Inicializar todas las condiciones disponibles
    const conds = {}
    for (const c of todasCondiciones.value) {
      // Si el paciente ya tiene registro de esa condición, usar ese valor
      // Si no tiene registro, usar false por defecto
      conds[c.clave] = condMap.hasOwnProperty(c.clave) ? condMap[c.clave] : false
    }
    editForm.condiciones = conds
  } catch (e) {
    // Fallback: usar condiciones del objeto en memoria
    const conds = {}
    for (const c of todasCondiciones.value) {
      conds[c.clave] = !!p._condiciones?.[c.clave]
    }
    editForm.condiciones = conds
  } finally {
    cargandoCondiciones.value = false
  }
}

function verReportePaciente(p) {
  router.push({ path: '/esp/reportes', query: { paciente: p.id } })
}

async function guardarEdicion() {
  if (!modalPaciente.value) return
  guardandoEdit.value = true
  showToast('Guardando...', 'loading')
  try {
    const uid = modalPaciente.value.id

    // ── Actualizar perfil del paciente
    // La política RLS permite al especialista actualizar si especialista_id = auth.uid()
    const { error: pErr } = await supabase.from('profiles').update({
      nombre: editForm.nombre.trim(),
      fecha_nacimiento: editForm.fecha_nacimiento || null,
      sexo: editForm.sexo || null,
      peso_kg: editForm.peso_kg || null,
      talla_cm: editForm.talla_cm || null,
      updated_at: new Date().toISOString(),
    }).eq('id', uid)

    if (pErr) throw new Error(`Error al actualizar perfil: ${pErr.message}`)

    // ── Actualizar condiciones médicas
    // Usamos upsert con onConflict para cada condición activa/inactiva
    const hoy = new Date().toISOString().split('T')[0]
    const rows = todasCondiciones.value.map(cond => ({
      usuario_id: uid,
      condicion_id: cond.id,
      activa: !!editForm.condiciones[cond.clave],
      fecha_inicio: hoy,
    }))

    const { error: ucErr } = await supabase
      .from('usuario_condiciones')
      .upsert(rows, { onConflict: 'usuario_id,condicion_id' })

    if (ucErr) throw new Error(`Error al actualizar condiciones: ${ucErr.message}`)

    showToast('Cambios guardados ✅', 'success')
    modalPaciente.value = null
    cargarPacientes()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    guardandoEdit.value = false
  }
}

onMounted(async () => {
  await cargarCondiciones()
  cargarPacientes()
})
</script>

<style scoped>
.dashboard-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.dash-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
  border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;
}
.dash-greeting { font-size: 11px; font-weight: 700; color: var(--green-dark); text-transform: uppercase; letter-spacing: .05em; }
.dash-header-info h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 2px; }
.dash-stats-mini { display: flex; gap: 16px; }
.mini-stat { text-align: center; }
.ms-num { display: block; font-size: 24px; font-weight: 800; color: var(--text-primary); }
.ms-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; }

.filters-bar { display: flex; flex-direction: column; gap: 10px; }
.search-wrap .input { width: 100%; }
.cond-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.cond-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 99px;
  background: var(--bg-elevated); border: 2px solid var(--border-color);
  font-size: 12px; font-weight: 700; color: var(--text-secondary);
  cursor: pointer; transition: all .2s;
}
.cond-pill:hover { border-color: var(--green); color: var(--green-dark); }
.cond-pill.active { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); max-width: 320px; }

.pacientes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.paciente-card { cursor: pointer; padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: transform .15s, box-shadow .15s; }
.paciente-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.pc-header { display: flex; align-items: center; gap: 12px; }
.pc-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; color: white; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.pc-info { flex: 1; min-width: 0; }
.pc-nombre { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.pc-edad { font-size: 12px; color: var(--text-muted); }
.pc-hoy-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0; }
.pc-hoy-badge.activo   { background: var(--green-light); color: var(--green-dark); }
.pc-hoy-badge.inactivo { background: var(--gray-100);    color: var(--gray-400); }

.pc-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.pcm-item { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pcm-val { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pcm-lbl { font-size: 10px; color: var(--text-muted); }

.pc-conds { display: flex; flex-wrap: wrap; gap: 6px; }
.cond-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px; }
.cond-badge.hipertension { background: var(--blue-light); color: var(--blue); }
.cond-badge.diabetes_t2  { background: var(--red-light);  color: var(--red); }
.cond-badge.celiaquía    { background: var(--yellow-light); color: #7A5800; }
.cond-badge:not(.hipertension):not(.diabetes_t2):not(.celiaquía) { background: var(--gray-100); color: var(--gray-600); }

.pc-semaforo { display: flex; align-items: center; gap: 8px; }
.pcs-bar { flex: 1; height: 8px; border-radius: 99px; overflow: hidden; display: flex; gap: 2px; background: var(--gray-100); }
.pcs-seg { height: 100%; min-width: 4px; }
.pcs-seg.verde    { background: var(--green); }
.pcs-seg.amarillo { background: var(--yellow); }
.pcs-seg.rojo     { background: var(--red); }
.pcs-counts { display: flex; gap: 6px; }
.pcs-dot { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 99px; }
.pcs-dot.verde    { background: var(--green-light);  color: var(--green-dark); }
.pcs-dot.amarillo { background: var(--yellow-light); color: #7A5800; }
.pcs-dot.rojo     { background: var(--red-light);    color: var(--red); }
.pc-semaforo-empty { font-size: 12px; color: var(--text-muted); font-style: italic; }

.pc-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 10px; }
.pc-btn { flex: 1; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; color: var(--text-secondary); }
.pc-btn:hover { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-width: 560px; background: var(--bg-surface); border-radius: 24px 24px 0 0; padding: 0; max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-grande { max-width: 600px; }

.modal-header-row { display: flex; align-items: center; gap: 12px; padding: 20px 20px 0; flex-wrap: wrap; }
.modal-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; color: white; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.modal-nombre { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.modal-sub { font-size: 12px; color: var(--text-muted); }
.modal-header-tabs { display: flex; gap: 6px; margin-left: auto; }
.modal-header-tabs button { padding: 7px 14px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); background: var(--bg-elevated); font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-secondary); transition: all .2s; }
.modal-header-tabs button.active { border-color: var(--green); background: var(--green-light); color: var(--green-dark); }
.modal-close { background: var(--bg-elevated); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 14px; flex-shrink: 0; margin-left: 8px; }

.modal-body { padding: 16px 20px 24px; display: flex; flex-direction: column; gap: 16px; }

.modal-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: var(--bg-elevated); border-radius: var(--radius-md); padding: 16px; }
.ms-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ms-v { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.ms-l { font-size: 11px; color: var(--text-muted); }

.modal-section h5 { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.conds-row { display: flex; flex-wrap: wrap; gap: 8px; }

.entradas-list { display: flex; flex-direction: column; gap: 6px; }
.entrada-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: var(--radius-sm); border-left: 3px solid transparent; }
.entrada-row.verde    { background: var(--green-light);  border-left-color: var(--green); }
.entrada-row.amarillo { background: var(--yellow-light); border-left-color: var(--yellow); }
.entrada-row.rojo     { background: var(--red-light);    border-left-color: var(--red); }
.er-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.er-dot.verde    { background: var(--green); }
.er-dot.amarillo { background: var(--yellow); }
.er-dot.rojo     { background: var(--red); }
.er-nombre { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.er-tipo   { font-size: 11px; color: var(--text-muted); }
.er-kcal   { font-size: 12px; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }
.modal-empty-hoy { font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px; font-style: italic; }

/* Carga de condiciones */
.conds-loading {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; font-size: 13px; color: var(--text-muted);
}
.spinner-sm-verde {
  width: 16px; height: 16px;
  border: 2px solid var(--gray-200); border-top-color: var(--green);
  border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
}

/* Edit form */
.edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.edit-conds-section { display: flex; flex-direction: column; gap: 8px; }
.edit-conds-section h5 { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.edit-conds-hint { font-size: 12px; color: var(--text-muted); margin-top: -4px; }
.cond-chips-edit { display: flex; flex-wrap: wrap; gap: 8px; }
.cond-chip-edit {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px; border-radius: var(--radius-md);
  background: var(--bg-elevated); border: 2px solid var(--border-color);
  cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-secondary);
  transition: all .2s; position: relative;
}
.cond-chip-edit:hover { border-color: var(--green); }
.cond-chip-edit.selected { border-color: var(--green); background: var(--green-light); color: var(--green-dark); }
.cond-icon { font-size: 16px; }
.check-mark { font-size: 12px; color: var(--green); font-weight: 800; margin-left: 2px; }

.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

.modal-enter-active, .modal-leave-active { transition: opacity .3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .pacientes-grid { grid-template-columns: 1fr; }
  .modal-stats { grid-template-columns: repeat(2, 1fr); }
  .edit-grid { grid-template-columns: 1fr; }
  .modal-header-tabs { order: 3; width: 100%; }
}
</style>