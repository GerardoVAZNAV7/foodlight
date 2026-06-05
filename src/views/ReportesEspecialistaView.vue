<template>
  <div class="reportes-esp-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>📊 Reportes de pacientes</h2>
        <p>Analiza el historial alimenticio de tus pacientes</p>
      </div>
    </div>

    <!-- Selector de paciente -->
    <div class="selector-card card">
      <div class="selector-row">
        <div class="field" style="flex:1">
          <label>Paciente</label>
          <select v-model="pacienteSeleccionado" class="input" @change="onCambioPaciente">
            <option value="">— Seleccionar paciente —</option>
            <option v-for="p in pacientes" :key="p.id" :value="p.id">
              {{ p.nombre || p.email || p.id }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Período</label>
          <div class="period-tabs">
            <button v-for="p in periods" :key="p.key"
              class="period-tab" :class="{ active: config.period === p.key }"
              @click="setPeriod(p.key)">{{ p.label }}</button>
          </div>
        </div>
      </div>
      <div v-if="config.period === 'custom'" class="date-range">
        <input v-model="config.fechaInicio" type="date" class="input" :max="hoy()" />
        <span class="date-sep">→</span>
        <input v-model="config.fechaFin" type="date" class="input" :max="hoy()" />
      </div>
      <div v-else-if="pacienteSeleccionado" class="fecha-display">
        <span class="fecha-chip">📅 {{ fechaInicioFormateada }} → {{ fechaFinFormateada }}</span>
      </div>
    </div>

    <!-- Sin paciente seleccionado -->
    <div v-if="!pacienteSeleccionado" class="empty-card card">
      <div class="empty-icon">📊</div>
      <h3>Selecciona un paciente</h3>
      <p>Elige un paciente de la lista para ver su reporte nutricional.</p>
    </div>

    <div v-else-if="cargando" class="loading-card card">
      <div class="spinner-lg"></div>
      <p>Analizando historial alimenticio...</p>
    </div>

    <template v-else-if="stats">
      <!-- Info del paciente -->
      <div v-if="pacienteInfo" class="paciente-banner card">
        <div class="pb-avatar" :style="{ background: avatarColor(pacienteInfo.nombre) }">
          {{ inicial(pacienteInfo.nombre) }}
        </div>
        <div class="pb-info">
          <h3>{{ pacienteInfo.nombre || 'Sin nombre' }}</h3>
          <div class="pb-conds">
            <span v-for="c in condicionesActivas(pacienteInfo)" :key="c.key" class="cond-badge" :class="c.key">
              {{ c.icon }} {{ c.label }}
            </span>
          </div>
        </div>
        <div class="pb-stats">
          <div class="pbs-item">
            <span class="pbs-val">{{ pacienteInfo.peso_kg ? pacienteInfo.peso_kg + ' kg' : '—' }}</span>
            <span class="pbs-lbl">Peso</span>
          </div>
          <div class="pbs-item">
            <span class="pbs-val">{{ imc(pacienteInfo) }}</span>
            <span class="pbs-lbl">IMC</span>
          </div>
          <div class="pbs-item">
            <span class="pbs-val">{{ tdee }} kcal</span>
            <span class="pbs-lbl">{{ pacienteInfo?._dieta?.kcal_objetivo ? 'Meta' : 'TDEE' }}</span>
          </div>
        </div>
        <div class="pb-export">
          <button class="btn-export pdf" :disabled="!!generando" @click="exportarPDF">
            <span v-if="generando === 'pdf'" class="spinner-sm-w"></span>
            <span v-else>📄</span>
            {{ generando === 'pdf' ? 'Generando...' : 'PDF' }}
          </button>
          <button class="btn-export excel" :disabled="!!generando" @click="exportarExcel">
            <span v-if="generando === 'excel'" class="spinner-sm-w"></span>
            <span v-else>📊</span>
            {{ generando === 'excel' ? 'Generando...' : 'Excel' }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-box card">
          <span class="stat-num">{{ stats.diasConRegistro }}</span>
          <span class="stat-lbl">Días registrados</span>
          <span class="stat-sub">de {{ stats.totalDias }} en el período</span>
        </div>
        <div class="stat-box card">
          <span class="stat-num" style="color:var(--green)">{{ stats.promedioKcal }}</span>
          <span class="stat-lbl">kcal promedio/día</span>
          <span class="stat-sub">Meta: {{ tdee }} kcal</span>
        </div>
        <div class="stat-box card">
          <span class="stat-num">{{ stats.totalEntradas }}</span>
          <span class="stat-lbl">Registros totales</span>
          <span class="stat-sub">alimentos y recetas</span>
        </div>
        <div class="stat-box card">
          <span class="stat-num" :style="{ color: colorCumplimiento }">{{ stats.cumplimientoMeta }}%</span>
          <span class="stat-lbl">Días en meta calórica</span>
          <span class="stat-sub">±10% del TDEE</span>
        </div>
      </div>

      <!-- Semáforo resumen -->
      <div class="semaforo-card card">
        <h4 class="chart-title">🚦 Distribución semáforo</h4>
        <div class="sem-bar-row">
          <div class="sem-bar-wrap">
            <div class="sem-seg verde"    :style="{ flex: stats.semaforo.verde || 0 }"></div>
            <div class="sem-seg amarillo" :style="{ flex: stats.semaforo.amarillo || 0 }"></div>
            <div class="sem-seg rojo"     :style="{ flex: stats.semaforo.rojo || 0 }"></div>
          </div>
          <div class="sem-counts">
            <span class="sem-dot verde">🟢 {{ stats.semaforo.verde }}</span>
            <span class="sem-dot amarillo">🟡 {{ stats.semaforo.amarillo }}</span>
            <span class="sem-dot rojo">🔴 {{ stats.semaforo.rojo }}</span>
          </div>
        </div>
      </div>

      <!-- Gráfica kcal por día -->
      <div class="chart-card card">
        <h4 class="chart-title">🔥 Calorías por día</h4>
        <canvas :key="'kcal-' + chartKey" ref="chartKcal" height="200"></canvas>
      </div>

      <!-- Macros y por tipo -->
      <div class="charts-row">
        <div class="chart-card card">
          <h4 class="chart-title">🥗 Macros promedio (g/día)</h4>
          <canvas :key="'macros-' + chartKey" ref="chartMacros" height="220"></canvas>
        </div>
        <div class="chart-card card">
          <h4 class="chart-title">🍴 kcal por tipo de comida</h4>
          <canvas :key="'meals-' + chartKey" ref="chartMeals" height="220"></canvas>
        </div>
      </div>

      <!-- Top alimentos -->
      <div class="top-card card">
        <h4 class="chart-title">🍽️ Alimentos más consumidos</h4>
        <div class="top-list">
          <div v-for="(item, i) in stats.topAlimentos" :key="item.nombre" class="top-item">
            <span class="top-rank" :class="rankClass(i)">{{ i + 1 }}</span>
            <span class="top-nombre">{{ item.nombre }}</span>
            <div class="top-bar-wrap">
              <div class="top-bar" :style="{ width: (item.count / stats.topAlimentos[0].count * 100) + '%', background: semColorBar(item) }"></div>
            </div>
            <span class="top-count">{{ item.count }}x</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!cargando && stats === null && pacienteSeleccionado" class="empty-card card">
      <div class="empty-icon">📭</div>
      <h3>Sin registros en este período</h3>
      <p>El paciente no tiene entradas en el diario para este rango de fechas.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const route = useRoute()
const toast = reactive({ show: false, message: '', type: 'success' })

const pacientes = ref([])
const pacienteSeleccionado = ref('')
const pacienteInfo = ref(null)
const stats = ref(null)
const cargando = ref(false)
const generando = ref(null)
const chartKey = ref(0)
const chartKcal = ref(null)
const chartMacros = ref(null)
const chartMeals = ref(null)
let chartInstances = {}

const periods = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
  { key: 'custom', label: 'Personalizado' },
]
const config = reactive({ period: 'week', fechaInicio: '', fechaFin: '' })

const COND_META = {
  celiaquía:    { label: 'Celiaquía',    icon: '🌾' },
  hipertension: { label: 'Hipertensión', icon: '💊' },
  diabetes_t2:  { label: 'Diabetes',     icon: '🩸' },
}

function hoy() { return new Date().toISOString().split('T')[0] }

function getPeriodDates(period) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  switch (period) {
    case 'week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const lunes = new Date(now); lunes.setDate(diff)
      return { inicio: fmt(lunes), fin: fmt(now) }
    }
    case 'month': return { inicio: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fin: fmt(now) }
    case 'year':  return { inicio: fmt(new Date(now.getFullYear(), 0, 1)), fin: fmt(now) }
    default: return { inicio: config.fechaInicio, fin: config.fechaFin }
  }
}

function setPeriod(p) {
  config.period = p
  if (p !== 'custom') {
    const d = getPeriodDates(p)
    config.fechaInicio = d.inicio
    config.fechaFin = d.fin
  }
}

const fechaActual = computed(() => {
  if (config.period === 'custom') return { inicio: config.fechaInicio, fin: config.fechaFin }
  return getPeriodDates(config.period)
})

const fmtOpts = { day: 'numeric', month: 'long', year: 'numeric' }
const fechaInicioFormateada = computed(() =>
  fechaActual.value.inicio ? new Date(fechaActual.value.inicio + 'T12:00').toLocaleDateString('es-MX', fmtOpts) : ''
)
const fechaFinFormateada = computed(() =>
  fechaActual.value.fin ? new Date(fechaActual.value.fin + 'T12:00').toLocaleDateString('es-MX', fmtOpts) : ''
)

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const AVATAR_COLORS = ['#00C896','#4361EE','#FF4757','#FFB800','#9B59B6','#1ABC9C','#E67E22']
function avatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0]
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}
function inicial(nombre) { return (nombre || '?').charAt(0).toUpperCase() }

function imc(p) {
  if (!p?.peso_kg || !p?.talla_cm) return '—'
  const h = p.talla_cm / 100
  return (p.peso_kg / (h * h)).toFixed(1)
}

function condicionesActivas(p) {
  return Object.entries(p?._condiciones || {})
    .filter(([, v]) => v)
    .map(([k]) => ({ key: k, ...(COND_META[k] || { label: k, icon: '🩺' }) }))
}

const tdee = computed(() => {
  const p = pacienteInfo.value
  if (p?._dieta?.kcal_objetivo) return p._dieta.kcal_objetivo
  if (!p?.peso_kg || !p?.talla_cm || !p?._edad || !p?.sexo) return 2000
  const tmb = p.sexo === 'M'
    ? 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p._edad + 5
    : 10 * p.peso_kg + 6.25 * p.talla_cm - 5 * p._edad - 161
  return Math.round(tmb * parseFloat(p.actividad || 1.375))
})

const colorCumplimiento = computed(() => {
  if (!stats.value) return 'var(--gray-400)'
  const c = stats.value.cumplimientoMeta
  return c >= 70 ? 'var(--green)' : c >= 40 ? 'var(--yellow)' : 'var(--red)'
})
function rankClass(i) { return i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal' }
function semColorBar(item) {
  return { verde: '#00C896', amarillo: '#FFB800', rojo: '#FF4757' }[item.color] || '#94A3B8'
}

async function cargarPacientes() {
  const uid = store.authUser?.id
  if (!uid) return
  const { data } = await supabase
    .from('profiles')
    .select('id, nombre')
    .eq('especialista_id', uid)
    .eq('especialista', false)
    .order('nombre')
  pacientes.value = data || []
}

async function onCambioPaciente() {
  if (!pacienteSeleccionado.value) { pacienteInfo.value = null; stats.value = null; return }
  await cargarInfoPaciente()
  await cargarDatos()
}

async function cargarInfoPaciente() {
  const uid = pacienteSeleccionado.value
  const [{ data: p }, { data: conds }, { data: dietasData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('usuario_condiciones')
      .select('condicion_id, activa, condiciones_medicas(clave)')
      .eq('usuario_id', uid).eq('activa', true),
    supabase.from('dietas').select('*').eq('paciente_id', uid).eq('activa', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const condiciones = {}
  for (const c of conds || []) condiciones[c.condiciones_medicas.clave] = true
  const dieta = dietasData || null

  let edad = null
  if (p?.fecha_nacimiento) {
    const [y, m, d] = p.fecha_nacimiento.split('-').map(Number)
    const hoyDate = new Date()
    edad = hoyDate.getFullYear() - y
    if (new Date(hoyDate.getFullYear(), m - 1, d) > hoyDate) edad--
  }

  pacienteInfo.value = { ...p, _condiciones: condiciones, _edad: edad, _dieta: dieta }
}

function destroyCharts() {
  for (const inst of Object.values(chartInstances)) { try { inst.destroy() } catch (_) {} }
  chartInstances = {}
}

function waitForCanvases(maxMs = 800) {
  return new Promise(resolve => {
    const interval = 30; let elapsed = 0
    const check = () => {
      if (chartKcal.value?.offsetWidth > 0) { resolve(); return }
      elapsed += interval
      if (elapsed >= maxMs) { resolve(); return }
      setTimeout(check, interval)
    }
    check()
  })
}

async function cargarDatos() {
  const { inicio, fin } = fechaActual.value
  if (!inicio || !fin || !pacienteSeleccionado.value) return
  destroyCharts()
  cargando.value = true
  stats.value = null
  try {
    const { data, error } = await supabase
      .from('diario_alimenticio')
      .select('*')
      .eq('user_id', pacienteSeleccionado.value)
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha')
    if (error) throw error
    if (!data?.length) { cargando.value = false; return }
    stats.value = calcularStats(data, inicio, fin)
    chartKey.value++
    cargando.value = false
    await nextTick()
    await nextTick()
    await waitForCanvases()
    await renderCharts()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
    cargando.value = false
  }
}

function diffDias(inicio, fin) {
  return Math.round((new Date(fin) - new Date(inicio)) / 86400000) + 1
}

function r(n) { return Math.round(n * 10) / 10 }

function calcularStats(data, inicio, fin) {
  const totalDias = diffDias(inicio, fin)
  const porFecha = {}
  for (const e of data) {
    if (!porFecha[e.fecha]) porFecha[e.fecha] = { kcal: 0, prot: 0, carbs: 0, grasas: 0 }
    const d = porFecha[e.fecha]
    d.kcal   += parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0))
    d.prot   += parseFloat(e.alimento_prot   || 0)
    d.carbs  += parseFloat(e.alimento_carbs  || 0)
    d.grasas += parseFloat(e.alimento_grasas || 0)
  }
  const diasArr = Object.keys(porFecha).sort()
  const diasConRegistro = diasArr.length
  const promedioKcal = diasConRegistro
    ? Math.round(diasArr.reduce((s, d) => s + porFecha[d].kcal, 0) / diasConRegistro) : 0
  const kcalPorDia = []; const fechaLabels = []
  let cur = new Date(inicio + 'T12:00')
  const finDate = new Date(fin + 'T12:00')
  while (cur <= finDate) {
    const key = cur.toISOString().split('T')[0]
    fechaLabels.push(key)
    kcalPorDia.push(Math.round(porFecha[key]?.kcal || 0))
    cur.setDate(cur.getDate() + 1)
  }
  const totalProt   = r(data.reduce((s, e) => s + parseFloat(e.alimento_prot   || 0), 0) / (diasConRegistro || 1))
  const totalCarbs  = r(data.reduce((s, e) => s + parseFloat(e.alimento_carbs  || 0), 0) / (diasConRegistro || 1))
  const totalGrasas = r(data.reduce((s, e) => s + parseFloat(e.alimento_grasas || 0), 0) / (diasConRegistro || 1))
  const semaforo = { verde: 0, amarillo: 0, rojo: 0 }
  for (const e of data) { const c = e.color_semaforo; if (c && semaforo[c] !== undefined) semaforo[c]++ }
  const freq = {}
  for (const e of data) {
    const nombre = e.origen === 'receta' ? (e.receta_nombre || '') : (e.alimento_nombre || '')
    const color  = e.color_semaforo || 'verde'
    if (!nombre) continue
    if (!freq[nombre]) freq[nombre] = { count: 0, color }
    freq[nombre].count++
  }
  const topAlimentos = Object.entries(freq)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 8)
    .map(([nombre, v]) => ({ nombre, count: v.count, color: v.color }))
  const porTipo = { desayuno: 0, comida: 0, cena: 0, snack: 0 }
  for (const e of data) {
    const k = e.tipo_comida
    const kcal = parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0))
    if (porTipo[k] !== undefined) porTipo[k] += kcal
  }
  const enMeta = diasArr.filter(d => {
    const k = porFecha[d].kcal
    return k >= tdee.value * 0.9 && k <= tdee.value * 1.1
  }).length
  const cumplimientoMeta = diasConRegistro ? Math.round((enMeta / diasConRegistro) * 100) : 0
  return {
    totalDias, diasConRegistro, promedioKcal, totalEntradas: data.length, cumplimientoMeta,
    kcalPorDia, fechaLabels, macros: { prot: totalProt, carbs: totalCarbs, grasas: totalGrasas },
    semaforo, topAlimentos,
    porTipo: Object.entries(porTipo).map(([k, v]) => ({ tipo: k, kcal: Math.round(v) })),
    rawData: data, porFecha,
  }
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

async function ensureChartJS() {
  if (window.Chart) return
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js')
}

async function renderCharts() {
  await ensureChartJS()
  if (!stats.value) return
  const { kcalPorDia, fechaLabels, macros, porTipo } = stats.value
  const C = window.Chart
  const labelsFecha = fechaLabels.map(f =>
    new Date(f + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  )
  if (chartKcal.value) {
    chartInstances.kcal = new C(chartKcal.value, {
      type: 'bar',
      data: {
        labels: labelsFecha,
        datasets: [{
          label: 'kcal', data: kcalPorDia,
          backgroundColor: kcalPorDia.map(k =>
            k > tdee.value * 1.1 ? 'rgba(255,71,87,.7)' :
            k > tdee.value * 0.9 ? 'rgba(0,200,150,.7)' : 'rgba(148,163,184,.5)'
          ), borderRadius: 6,
        }, {
          label: 'Meta TDEE', data: kcalPorDia.map(() => tdee.value),
          type: 'line', borderColor: 'rgba(67,97,238,.6)',
          borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false,
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    })
  }
  if (chartMacros.value) {
    chartInstances.macros = new C(chartMacros.value, {
      type: 'bar',
      data: {
        labels: ['Proteína', 'Carbohidratos', 'Grasas'],
        datasets: [{ label: 'g/día promedio', data: [macros.prot, macros.carbs, macros.grasas], backgroundColor: ['rgba(67,97,238,.7)', 'rgba(255,184,0,.7)', 'rgba(255,71,87,.7)'], borderRadius: 8 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
  }
  if (chartMeals.value) {
    chartInstances.meals = new C(chartMeals.value, {
      type: 'bar',
      data: {
        labels: porTipo.map(t => ({ desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[t.tipo])),
        datasets: [{ label: 'kcal totales', data: porTipo.map(t => t.kcal), backgroundColor: ['rgba(0,200,150,.7)', 'rgba(255,184,0,.7)', 'rgba(67,97,238,.7)', 'rgba(255,71,87,.7)'], borderRadius: 8 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
  }
}

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) return
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await new Promise(res => setTimeout(res, 200))
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
  await new Promise(res => setTimeout(res, 150))
}

async function exportarPDF() {
  if (!stats.value || !pacienteInfo.value) return
  generando.value = 'pdf'
  showToast('Generando PDF...', 'loading')
  try {
    await ensureJsPDF()
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const p = pacienteInfo.value
    const s = stats.value
    doc.setFillColor(0, 200, 150); doc.rect(0, 0, W, 38, 'F')
    doc.setTextColor(255,255,255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
    doc.text('FoodLight — Reporte de Paciente', 14, 14)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Paciente: ${p.nombre || '—'}`, 14, 23)
    doc.text(`Período: ${fechaInicioFormateada.value} - ${fechaFinFormateada.value}`, 14, 30)
    let y = 44
    doc.setTextColor(30,41,59); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('Datos del paciente', 14, y); y += 6
    doc.autoTable({
      startY: y,
      body: [
        ['Peso', p.peso_kg ? `${p.peso_kg} kg` : '—', 'Talla', p.talla_cm ? `${p.talla_cm} cm` : '—'],
        ['Edad', p._edad ? `${p._edad} años` : '—', 'IMC', imc(p)],
        ['TDEE', `${tdee.value} kcal/día`, 'Padecimientos', condicionesActivas(p).map(c => c.label).join(', ') || 'Ninguno'],
      ],
      theme: 'plain', styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [71,85,105], cellWidth: 28 }, 1: { cellWidth: 52 }, 2: { fontStyle: 'bold', textColor: [71,85,105], cellWidth: 28 }, 3: { cellWidth: 52 } },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('Resumen estadístico', 14, y); y += 6
    doc.autoTable({
      startY: y,
      head: [['Métrica', 'Valor', 'Referencia']],
      body: [
        ['Días con registro', `${s.diasConRegistro} de ${s.totalDias}`, `${Math.round(s.diasConRegistro / s.totalDias * 100)}%`],
        ['Promedio kcal/día', `${s.promedioKcal} kcal`, `Meta: ${tdee.value} kcal`],
        ['Total registros', `${s.totalEntradas}`, ''],
        ['Días en meta', `${s.cumplimientoMeta}%`, '±10% TDEE'],
        ['Alimentos verdes', `${s.semaforo.verde}`, ''],
        ['Alimentos amarillos', `${s.semaforo.amarillo}`, ''],
        ['Alimentos rojos', `${s.semaforo.rojo}`, ''],
      ],
      headStyles: { fillColor: [0,200,150], textColor: 255 },
      styles: { fontSize: 10 }, margin: { left: 14, right: 14 },
    })
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148,163,184)
      doc.text(`FoodLight · Reporte generado automáticamente · Página ${i} de ${pageCount}`, 14, 290)
    }
    doc.save(`FoodLight_Paciente_${p.nombre?.replace(/\s/g,'_') || 'reporte'}_${hoy()}.pdf`)
    showToast('PDF descargado ✅', 'success')
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    generando.value = null
  }
}

async function exportarExcel() {
  if (!stats.value || !pacienteInfo.value) return
  generando.value = 'excel'
  showToast('Generando Excel...', 'loading')
  try {
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
      await new Promise(res => setTimeout(res, 200))
    }
    const XLSX = window.XLSX; const wb = XLSX.utils.book_new()
    const p = pacienteInfo.value; const s = stats.value
    const ws = XLSX.utils.aoa_to_sheet([
      ['FOODLIGHT — REPORTE DE PACIENTE'],
      ['Paciente', p.nombre || '—'],
      ['Período', `${fechaInicioFormateada.value} - ${fechaFinFormateada.value}`],
      [], ['ESTADÍSTICAS'],
      ['Días registrados', s.diasConRegistro],
      ['Promedio kcal/día', s.promedioKcal],
      ['Meta TDEE', tdee.value],
      ['Total registros', s.totalEntradas],
      ['% en meta calórica', `${s.cumplimientoMeta}%`],
      [], ['SEMÁFORO'],
      ['Verdes', s.semaforo.verde],
      ['Amarillos', s.semaforo.amarillo],
      ['Rojos', s.semaforo.rojo],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
    const wsDetalle = XLSX.utils.aoa_to_sheet([
      ['Fecha', 'Tipo', 'Nombre', 'kcal', 'Semáforo'],
      ...s.rawData.map(e => [
        e.fecha,
        { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[e.tipo_comida] || e.tipo_comida,
        e.origen === 'receta' ? (e.receta_nombre || '') : (e.alimento_nombre || ''),
        e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0),
        e.color_semaforo || '',
      ]),
    ])
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle')
    XLSX.writeFile(wb, `FoodLight_Paciente_${p.nombre?.replace(/\s/g,'_') || 'reporte'}_${hoy()}.xlsx`)
    showToast('Excel descargado ✅', 'success')
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    generando.value = null
  }
}

watch(() => fechaActual.value, (v) => {
  if (v.inicio && v.fin && pacienteSeleccionado.value) cargarDatos()
}, { deep: true })

onMounted(async () => {
  await cargarPacientes()
  setPeriod('week')
  // Si viene con ?paciente=uuid desde el dashboard
  if (route.query.paciente) {
    pacienteSeleccionado.value = route.query.paciente
    await onCambioPaciente()
  }
})
</script>

<style scoped>
.reportes-esp-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.selector-card { display: flex; flex-direction: column; gap: 12px; }
.selector-row { display: flex; gap: 14px; flex-wrap: wrap; }
.period-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.period-tab { padding: 7px 12px; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 2px solid transparent; font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all .2s; }
.period-tab.active { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }
.date-range { display: flex; align-items: center; gap: 8px; }
.date-sep { color: var(--text-muted); font-size: 18px; }
.fecha-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px; background: var(--blue-light); color: var(--blue); font-size: 13px; font-weight: 600; }

.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.paciente-banner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; background: linear-gradient(135deg, var(--green-light), var(--blue-light)); border: 1px solid var(--border-color); }
.pb-avatar { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; color: white; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.pb-info { flex: 1; min-width: 0; }
.pb-info h3 { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.pb-conds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.cond-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 99px; }
.cond-badge.hipertension { background: var(--blue-light); color: var(--blue); }
.cond-badge.diabetes_t2  { background: var(--red-light);  color: var(--red); }
.cond-badge.celiaquía    { background: var(--yellow-light); color: #7A5800; }
.pb-stats { display: flex; gap: 16px; }
.pbs-item { text-align: center; }
.pbs-val { display: block; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.pbs-lbl { font-size: 11px; color: var(--text-muted); }
.pb-export { display: flex; gap: 8px; margin-left: auto; }
.btn-export { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-sm); border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-export.pdf   { background: var(--red);   color: white; }
.btn-export.excel { background: var(--green); color: white; }
.btn-export:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.btn-export:disabled { opacity: .5; cursor: not-allowed; transform: none; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.stat-box { padding: 16px; display: flex; flex-direction: column; gap: 2px; }
.stat-num { font-size: 28px; font-weight: 800; color: var(--text-primary); }
.stat-lbl { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.stat-sub { font-size: 11px; color: var(--text-muted); }

.semaforo-card { padding: 16px; }
.chart-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); }
.sem-bar-row { display: flex; flex-direction: column; gap: 10px; }
.sem-bar-wrap { height: 14px; border-radius: 99px; overflow: hidden; display: flex; gap: 2px; background: var(--bg-elevated); }
.sem-seg { height: 100%; min-width: 6px; border-radius: 99px; }
.sem-seg.verde    { background: var(--green); }
.sem-seg.amarillo { background: var(--yellow); }
.sem-seg.rojo     { background: var(--red); }
.sem-counts { display: flex; gap: 14px; font-size: 13px; font-weight: 600; }

.chart-card { padding: 16px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.top-card { padding: 16px; }
.top-list { display: flex; flex-direction: column; gap: 8px; }
.top-item { display: flex; align-items: center; gap: 10px; }
.top-rank { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
.top-rank.gold   { background: #FFD700; color: #7A5800; }
.top-rank.silver { background: #C0C0C0; color: #555; }
.top-rank.bronze { background: #CD7F32; color: white; }
.top-rank.normal { background: var(--gray-100); color: var(--gray-500); }
.top-nombre { font-size: 13px; font-weight: 600; min-width: 80px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-bar-wrap { flex: 1; height: 8px; background: var(--gray-100); border-radius: 99px; overflow: hidden; }
.top-bar { height: 100%; border-radius: 99px; transition: width .4s ease; }
.top-count { font-size: 12px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }

.spinner-sm-w { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

@media (max-width: 600px) {
  .charts-row { grid-template-columns: 1fr; }
  .selector-row { flex-direction: column; }
  .pb-stats { display: none; }
}
</style>