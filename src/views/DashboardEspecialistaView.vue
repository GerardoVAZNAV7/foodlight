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

    <!-- Buscador de pacientes -->
    <div class="search-row">
      <input
        v-model="busqueda"
        type="search"
        class="input"
        placeholder="🔍 Buscar paciente por nombre..."
      />
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div>
      <p>Cargando pacientes...</p>
    </div>

    <!-- Sin pacientes -->
    <div v-else-if="!pacientesFiltrados.length && !busqueda" class="empty-card card">
      <div class="empty-icon">👥</div>
      <h3>Sin pacientes asignados</h3>
      <p>Aún no hay pacientes que te hayan seleccionado como especialista al registrarse.</p>
      <p class="empty-hint">
        Cuando un paciente se registre y te elija como su especialista, aparecerá aquí automáticamente.
      </p>
    </div>

    <div v-else-if="!pacientesFiltrados.length && busqueda" class="empty-card card">
      <div class="empty-icon">🔍</div>
      <h3>Sin resultados</h3>
      <p>No se encontró ningún paciente con "{{ busqueda }}".</p>
    </div>

    <!-- Lista de pacientes -->
    <div v-else class="pacientes-grid">
      <div
        v-for="p in pacientesFiltrados"
        :key="p.id"
        class="paciente-card card"
        @click="verPaciente(p)"
      >
        <!-- Avatar + nombre -->
        <div class="pc-header">
          <div class="pc-avatar" :style="{ background: avatarColor(p.nombre) }">
            {{ inicial(p.nombre) }}
          </div>
          <div class="pc-info">
            <h4 class="pc-nombre">{{ p.nombre || 'Sin nombre' }}</h4>
            <span class="pc-edad">{{ p.edad !== null ? `${p.edad} años` : 'Edad no registrada' }}</span>
          </div>
          <!-- Badge actividad hoy -->
          <div class="pc-hoy-badge" :class="p._registroHoy ? 'activo' : 'inactivo'">
            {{ p._registroHoy ? '✓ Hoy' : 'Sin registro' }}
          </div>
        </div>

        <!-- Métricas rápidas -->
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

        <!-- Condiciones médicas -->
        <div v-if="condicionesActivas(p).length" class="pc-conds">
          <span
            v-for="c in condicionesActivas(p)"
            :key="c"
            class="cond-badge"
          >{{ c }}</span>
        </div>

        <!-- Semáforo del día -->
        <div v-if="p._semaforo" class="pc-semaforo">
          <div class="pcs-bar">
            <div class="pcs-seg verde"    :style="{ flex: p._semaforo.verde || 0 }"></div>
            <div class="pcs-seg amarillo" :style="{ flex: p._semaforo.amarillo || 0 }"></div>
            <div class="pcs-seg rojo"     :style="{ flex: p._semaforo.rojo || 0 }"></div>
          </div>
          <div class="pcs-counts">
            <span class="pcs-dot verde">{{ p._semaforo.verde }}</span>
            <span class="pcs-dot amarillo">{{ p._semaforo.amarillo }}</span>
            <span class="pcs-dot rojo">{{ p._semaforo.rojo }}</span>
          </div>
        </div>
        <div v-else class="pc-semaforo-empty">Sin entradas hoy</div>
      </div>
    </div>

    <!-- Modal detalle del paciente -->
    <transition name="modal">
      <div v-if="pacienteSeleccionado" class="modal-overlay" @click.self="pacienteSeleccionado = null">
        <div class="modal-card">
          <button class="modal-close" @click="pacienteSeleccionado = null">✕</button>
          <div class="modal-avatar" :style="{ background: avatarColor(pacienteSeleccionado.nombre) }">
            {{ inicial(pacienteSeleccionado.nombre) }}
          </div>
          <h3 class="modal-nombre">{{ pacienteSeleccionado.nombre || 'Sin nombre' }}</h3>
          <p class="modal-sub">{{ pacienteSeleccionado.edad ? `${pacienteSeleccionado.edad} años` : '' }}</p>

          <div class="modal-stats">
            <div class="ms-item"><span class="ms-v">{{ pacienteSeleccionado.peso_kg ?? '—' }}</span><span class="ms-l">kg</span></div>
            <div class="ms-item"><span class="ms-v">{{ pacienteSeleccionado.talla_cm ?? '—' }}</span><span class="ms-l">cm</span></div>
            <div class="ms-item"><span class="ms-v">{{ imc(pacienteSeleccionado) }}</span><span class="ms-l">IMC</span></div>
            <div class="ms-item">
              <span class="ms-v" :style="{ color: colorKcalHoy(pacienteSeleccionado) }">
                {{ pacienteSeleccionado._kcalHoy ?? '—' }}
              </span>
              <span class="ms-l">kcal/hoy</span>
            </div>
          </div>

          <div v-if="condicionesActivas(pacienteSeleccionado).length" class="modal-conds">
            <h5>Condiciones médicas</h5>
            <div class="conds-row">
              <span v-for="c in condicionesActivas(pacienteSeleccionado)" :key="c" class="cond-badge">{{ c }}</span>
            </div>
          </div>

          <div v-if="pacienteSeleccionado._entradasHoy?.length" class="modal-entradas">
            <h5>Registro de hoy</h5>
            <div class="entradas-list">
              <div
                v-for="e in pacienteSeleccionado._entradasHoy"
                :key="e.id"
                class="entrada-row"
                :class="e.color_semaforo || 'verde'"
              >
                <span class="er-dot" :class="e.color_semaforo || 'verde'"></span>
                <span class="er-nombre">{{ e.origen === 'receta' ? e.receta_nombre : e.alimento_nombre }}</span>
                <span class="er-tipo">{{ tipoLabel(e.tipo_comida) }}</span>
                <span class="er-kcal">{{ e.origen === 'receta' ? e.receta_kcal : e.alimento_kcal }} kcal</span>
              </div>
            </div>
          </div>
          <div v-else class="modal-empty-hoy">Sin entradas registradas hoy</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const toast = reactive({ show: false, message: '', type: 'success' })

const pacientes           = ref([])
const loading             = ref(false)
const busqueda            = ref('')
const pacienteSeleccionado = ref(null)

const nombreEspecialista = computed(() =>
  store.profile?.nombre || store.authUser?.email?.split('@')[0] || 'Especialista'
)

// ── Utilidades ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#00C896','#4361EE','#FF4757','#FFB800','#9B59B6','#1ABC9C','#E67E22']
function avatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0]
  const idx = nombre.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
function inicial(nombre) {
  return (nombre || '?').charAt(0).toUpperCase()
}
function imc(p) {
  if (!p.peso_kg || !p.talla_cm) return '—'
  const h = p.talla_cm / 100
  return (p.peso_kg / (h * h)).toFixed(1)
}
function condicionesActivas(p) {
  return Object.entries(p._condiciones || {})
    .filter(([, v]) => v)
    .map(([k]) => ({
      celiaquía:    '🌾 Celiaquía',
      hipertension: '💊 Hipertensión',
      diabetes_t2:  '🩸 Diabetes',
    }[k] || k))
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

const pacientesConRegistroHoy = computed(() => pacientes.value.filter(p => p._registroHoy).length)

const pacientesFiltrados = computed(() => {
  if (!busqueda.value) return pacientes.value
  const q = busqueda.value.toLowerCase()
  return pacientes.value.filter(p => (p.nombre || '').toLowerCase().includes(q))
})

// ── Cargar pacientes ─────────────────────────────────────────────────────────
async function cargarPacientes() {
  const userId = store.authUser?.id
  if (!userId) return
  loading.value = true
  try {
    // 1. Pacientes que tienen a este especialista asignado
    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('especialista_id', userId)
      .eq('especialista', false)
      .order('nombre')

    if (profErr) throw profErr
    if (!profs?.length) { pacientes.value = []; return }

    const ids = profs.map(p => p.id)

    // 2. Condiciones médicas activas de cada paciente
    const { data: conds } = await supabase
      .from('usuario_condiciones')
      .select('usuario_id, activa, condiciones_medicas(clave)')
      .in('usuario_id', ids)
      .eq('activa', true)

    // 3. Entradas del diario de HOY de cada paciente
    const hoy = new Date().toISOString().split('T')[0]
    const { data: diario } = await supabase
      .from('diario_alimenticio')
      .select('*')
      .in('user_id', ids)
      .eq('fecha', hoy)
      .order('created_at')

    // ── Enriquecer cada paciente ────────────────────────────────────────────
    const condPorPaciente = {}
    for (const c of conds || []) {
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
      const kcalHoy  = entradas.reduce((s, e) =>
        s + parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0)), 0)
      const semaforo = { verde: 0, amarillo: 0, rojo: 0 }
      for (const e of entradas) {
        const c = e.color_semaforo
        if (c && semaforo[c] !== undefined) semaforo[c]++
      }

      // Calcular edad desde fecha_nacimiento
      let edad = null
      if (p.fecha_nacimiento) {
        const [y, m, d] = p.fecha_nacimiento.split('-').map(Number)
        const hoyDate = new Date()
        edad = hoyDate.getFullYear() - y
        if (new Date(hoyDate.getFullYear(), m - 1, d) > hoyDate) edad--
      }

      return {
        ...p,
        edad,
        _condiciones:  condPorPaciente[p.id] || {},
        _entradasHoy:  entradas,
        _kcalHoy:      entradas.length ? Math.round(kcalHoy) : null,
        _registroHoy:  entradas.length > 0,
        _semaforo:     entradas.length ? semaforo : null,
      }
    })

  } catch (e) {
    console.error('Error cargando pacientes:', e)
    toast.show = false
    setTimeout(() => {
      toast.message = 'Error al cargar pacientes: ' + e.message
      toast.type    = 'error'
      toast.show    = true
    }, 50)
  } finally {
    loading.value = false
  }
}

function verPaciente(p) {
  pacienteSeleccionado.value = p
}

onMounted(cargarPacientes)
</script>

<style scoped>
.dashboard-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

/* Header */
.dash-header {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg); padding: 20px;
}
.dash-greeting { font-size: 12px; font-weight: 700; color: var(--green-dark); text-transform: uppercase; letter-spacing: .05em; }
.dash-header-info h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 2px; }
.dash-stats-mini { display: flex; gap: 16px; }
.mini-stat { text-align: center; }
.ms-num { display: block; font-size: 24px; font-weight: 800; color: var(--text-primary); }
.ms-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; }

/* Buscador */
.search-row { display: flex; }
.search-row .input { flex: 1; }

/* Loading */
.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); }
.empty-hint    { font-size: 12px !important; color: var(--text-muted) !important; max-width: 300px; line-height: 1.6; }

/* Grid de pacientes */
.pacientes-grid { display: flex; flex-direction: column; gap: 12px; }

.paciente-card {
  cursor: pointer; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  transition: transform .15s, box-shadow .15s;
}
.paciente-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

/* Header de card */
.pc-header { display: flex; align-items: center; gap: 12px; }
.pc-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  color: white; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pc-info { flex: 1; min-width: 0; }
.pc-nombre { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.pc-edad   { font-size: 12px; color: var(--text-muted); }

.pc-hoy-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0;
}
.pc-hoy-badge.activo   { background: var(--green-light); color: var(--green-dark); }
.pc-hoy-badge.inactivo { background: var(--gray-100);    color: var(--gray-400); }

/* Métricas */
.pc-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.pcm-item {
  background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.pcm-val { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pcm-lbl { font-size: 10px; color: var(--text-muted); }

/* Condiciones */
.pc-conds { display: flex; flex-wrap: wrap; gap: 6px; }
.cond-badge {
  font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  background: var(--blue-light); color: var(--blue);
}

/* Semáforo del día */
.pc-semaforo { display: flex; align-items: center; gap: 8px; }
.pcs-bar {
  flex: 1; height: 8px; border-radius: 99px; overflow: hidden; display: flex; gap: 2px;
  background: var(--gray-100);
}
.pcs-seg { height: 100%; min-width: 4px; transition: flex .4s; }
.pcs-seg.verde    { background: var(--green); }
.pcs-seg.amarillo { background: var(--yellow); }
.pcs-seg.rojo     { background: var(--red); }
.pcs-counts { display: flex; gap: 6px; }
.pcs-dot { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 99px; }
.pcs-dot.verde    { background: var(--green-light);  color: var(--green-dark); }
.pcs-dot.amarillo { background: var(--yellow-light); color: #7A5800; }
.pcs-dot.rojo     { background: var(--red-light);    color: var(--red); }
.pc-semaforo-empty { font-size: 12px; color: var(--text-muted); font-style: italic; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
}
.modal-card {
  width: 100%; max-width: 480px;
  background: var(--bg-surface); border-radius: 24px 24px 0 0;
  padding: 24px; max-height: 88vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-close {
  align-self: flex-end; background: var(--bg-elevated); border: none;
  width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px;
}
.modal-avatar {
  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto;
  color: white; font-size: 26px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.modal-nombre { font-size: 22px; font-weight: 800; text-align: center; color: var(--text-primary); }
.modal-sub    { font-size: 13px; color: var(--text-muted); text-align: center; margin-top: -8px; }

.modal-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  background: var(--bg-elevated); border-radius: var(--radius-md); padding: 16px;
}
.ms-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ms-v { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.ms-l { font-size: 11px; color: var(--text-muted); }

.modal-conds h5,
.modal-entradas h5 { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.conds-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }

.entradas-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.entrada-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}
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

.modal-enter-active, .modal-leave-active { transition: opacity .3s; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }

@media (max-width: 480px) {
  .dash-header { flex-direction: column; gap: 14px; align-items: flex-start; }
  .pc-metrics  { grid-template-columns: repeat(2, 1fr); }
  .modal-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>