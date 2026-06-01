<template>
  <div class="reporte-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="reporte-header">
      <div>
        <h2>📊 Reportes</h2>
        <p>Exporta tu historial alimenticio con análisis y gráficas</p>
      </div>
    </div>

    <div v-if="!store.hasProfile" class="empty-card card">
      <div class="empty-icon">📊</div>
      <h3>Completa tu perfil primero</h3>
      <p>Necesitamos tus datos para generar reportes personalizados.</p>
      <router-link to="/perfil" class="btn btn-primary">Ir a mi perfil</router-link>
    </div>

    <template v-else>
      <div class="config-card card">
        <h3 class="section-title"><span>⚙️</span> Configurar reporte</h3>
        <div class="config-grid">
          <div class="field span-2">
            <label>Período</label>
            <div class="period-tabs">
              <button
                v-for="p in periods" :key="p.key"
                class="period-tab" :class="{ active: config.period === p.key }"
                @click="setPeriod(p.key)"
              >{{ p.label }}</button>
            </div>
          </div>
          <div class="field span-2" v-if="config.period === 'custom'">
            <label>Rango personalizado</label>
            <div class="date-range">
              <input v-model="config.fechaInicio" type="date" class="input" :max="hoy()" />
              <span class="date-sep">→</span>
              <input v-model="config.fechaFin" type="date" class="input" :max="hoy()" />
            </div>
          </div>
          <div v-else class="fecha-display span-2">
            <span class="fecha-chip">📅 {{ fechaInicioFormateada }} → {{ fechaFinFormateada }}</span>
          </div>
        </div>
        <div class="export-btns">
          <button class="btn btn-export pdf" :disabled="!!generando" @click="exportarPDF">
            <span v-if="generando === 'pdf'" class="spinner-sm-w"></span>
            <span v-else>📄</span>
            {{ generando === 'pdf' ? 'Generando...' : 'Exportar PDF' }}
          </button>
          <button class="btn btn-export excel" :disabled="!!generando" @click="exportarExcel">
            <span v-if="generando === 'excel'" class="spinner-sm-w"></span>
            <span v-else>📊</span>
            {{ generando === 'excel' ? 'Generando...' : 'Exportar Excel' }}
          </button>
        </div>
      </div>

      <div v-if="cargando" class="loading-card card">
        <div class="spinner-lg"></div>
        <p>Analizando tu historial alimenticio...</p>
      </div>

      <template v-else-if="stats">
        <div class="stats-section">
          <h3 class="section-title"><span>📈</span> Resumen del período</h3>
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-num">{{ stats.diasConRegistro }}</span>
              <span class="stat-lbl">Días registrados</span>
              <span class="stat-sub">de {{ stats.totalDias }} en el período</span>
            </div>
            <div class="stat-box">
              <span class="stat-num" :style="{ color: 'var(--green)' }">{{ stats.promedioKcal }}</span>
              <span class="stat-lbl">kcal promedio/día</span>
              <span class="stat-sub">Meta: {{ tdee }} kcal</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ stats.totalEntradas }}</span>
              <span class="stat-lbl">Registros totales</span>
              <span class="stat-sub">alimentos y recetas</span>
            </div>
            <div class="stat-box">
              <span class="stat-num" :style="{ color: colorCumplimiento }">{{ stats.cumplimientoMeta }}%</span>
              <span class="stat-lbl">Días en meta calórica</span>
              <span class="stat-sub">±10% del TDEE</span>
            </div>
          </div>
        </div>

        <div class="chart-card card">
          <h4 class="chart-title">🔥 Calorías por día</h4>
          <div class="chart-wrap">
            <canvas :key="'kcal-' + chartKey" ref="chartKcal" height="200"></canvas>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card card">
            <h4 class="chart-title">🥗 Macros promedio (g/día)</h4>
            <div class="chart-wrap">
              <canvas :key="'macros-' + chartKey" ref="chartMacros" height="220"></canvas>
            </div>
          </div>
          <div class="chart-card card">
            <h4 class="chart-title">🚦 Distribución semáforo</h4>
            <div class="chart-wrap semaforo-wrap">
              <canvas :key="'sem-' + chartKey" ref="chartSemaforo" height="220"></canvas>
            </div>
            <div class="semaforo-legend">
              <span class="sl-dot verde"></span><span>Verde ({{ stats.semaforo.verde }})</span>
              <span class="sl-dot amarillo"></span><span>Amarillo ({{ stats.semaforo.amarillo }})</span>
              <span class="sl-dot rojo"></span><span>Rojo ({{ stats.semaforo.rojo }})</span>
            </div>
          </div>
        </div>

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

        <div class="chart-card card">
          <h4 class="chart-title">🍴 Calorías por tipo de comida</h4>
          <div class="chart-wrap">
            <canvas :key="'meals-' + chartKey" ref="chartMeals" height="180"></canvas>
          </div>
        </div>
      </template>

      <div v-else-if="!cargando && stats === null" class="empty-period card">
        <span>📭</span>
        <p>Sin registros en este período</p>
        <small>Agrega entradas en tu diario alimenticio para ver el reporte.</small>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()

const toast = reactive({ show: false, message: '', type: 'success' })
function showToast(message, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = message; toast.type = type; toast.show = true }, 50)
}

const nombreUsuario = computed(() => {
  const u = store.authUser
  if (u?.name && u.name.trim()) return u.name.trim()
  const p = store.profile?._raw
  if (p?.nombre && p.nombre.trim()) return p.nombre.trim()
  if (u?.email) return u.email.split('@')[0]
  return '—'
})

const periods = [
  { key: 'day',    label: 'Hoy' },
  { key: 'week',   label: 'Semana' },
  { key: 'month',  label: 'Mes' },
  { key: 'year',   label: 'Año' },
  { key: 'custom', label: 'Personalizado' },
]

const config = reactive({ period: 'week', fechaInicio: '', fechaFin: '' })

function hoy() {
  return new Date().toISOString().split('T')[0]
}

function getPeriodDates(period) {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  switch (period) {
    case 'day': { const h = fmt(now); return { inicio: h, fin: h } }
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

const fechaActual = computed(() => {
  if (config.period === 'custom') return { inicio: config.fechaInicio, fin: config.fechaFin }
  return getPeriodDates(config.period)
})

function setPeriod(p) {
  config.period = p
  if (p !== 'custom') {
    const d = getPeriodDates(p)
    config.fechaInicio = d.inicio
    config.fechaFin    = d.fin
  }
}

const fmtOpts = { day: 'numeric', month: 'long', year: 'numeric' }
const fechaInicioFormateada = computed(() =>
  fechaActual.value.inicio
    ? new Date(fechaActual.value.inicio + 'T12:00').toLocaleDateString('es-MX', fmtOpts)
    : ''
)
const fechaFinFormateada = computed(() =>
  fechaActual.value.fin
    ? new Date(fechaActual.value.fin + 'T12:00').toLocaleDateString('es-MX', fmtOpts)
    : ''
)

const tdee = computed(() => {
  const p = store.profile
  if (!p?.peso || !p?.estatura || !p?.edad || !p?.sexo) return 2000
  const tmb = p.sexo === 'M'
    ? 10 * p.peso + 6.25 * p.estatura - 5 * p.edad + 5
    : 10 * p.peso + 6.25 * p.estatura - 5 * p.edad - 161
  return Math.round(tmb * parseFloat(p.actividad || 1.375))
})

const stats     = ref(null)
const cargando  = ref(false)
const generando = ref(null)
const chartKey  = ref(0)

let chartInstances = {}

function destroyCharts() {
  for (const inst of Object.values(chartInstances)) {
    try { inst.destroy() } catch (_) {}
  }
  chartInstances = {}
}

const chartKcal     = ref(null)
const chartMacros   = ref(null)
const chartSemaforo = ref(null)
const chartMeals    = ref(null)

// Espera activa hasta que el primer canvas tenga dimensiones reales
function waitForCanvases(maxMs = 800) {
  return new Promise(resolve => {
    const interval = 30
    let elapsed = 0
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
  if (!inicio || !fin || !store.authUser?.id) return

  // 1. Destruir instancias Chart.js existentes
  destroyCharts()

  cargando.value = true
  stats.value = null

  try {
    const { data, error } = await supabase
      .from('diario_alimenticio')
      .select('*')
      .eq('user_id', store.authUser.id)
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha')
    if (error) throw error

    if (!data?.length) {
      stats.value = null
      cargando.value = false
      return
    }

    stats.value = calcularStats(data, inicio, fin)

    // 2. Incrementar key → Vue desmonta canvas viejos y prepara nuevos
    chartKey.value++

    // 3. BAJAR cargando ANTES de esperar el DOM
    //    Los canvas están dentro del v-else-if="stats" que solo
    //    se renderiza cuando cargando es false — si no bajamos aquí,
    //    waitForCanvases espera canvas que todavía no existen.
    cargando.value = false

    // 4. Esperar a que Vue aplique el nuevo DOM
    await nextTick()
    await nextTick()

    // 5. Esperar a que el navegador asigne dimensiones reales al canvas
    await waitForCanvases()

    // 6. Renderizar
    await renderCharts()

  } catch (e) {
    showToast('Error al cargar datos: ' + e.message, 'error')
    cargando.value = false
  }
}

function diffDias(inicio, fin) {
  return Math.round((new Date(fin) - new Date(inicio)) / 86400000) + 1
}

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
    totalDias, diasConRegistro, promedioKcal, totalEntradas: data.length,
    cumplimientoMeta, kcalPorDia, fechaLabels,
    macros: { prot: totalProt, carbs: totalCarbs, grasas: totalGrasas },
    semaforo, topAlimentos,
    porTipo: Object.entries(porTipo).map(([k, v]) => ({ tipo: k, kcal: Math.round(v) })),
    rawData: data, porFecha,
  }
}

function r(n) { return Math.round(n * 10) / 10 }

const colorCumplimiento = computed(() => {
  if (!stats.value) return 'var(--gray-400)'
  const c = stats.value.cumplimientoMeta
  return c >= 70 ? 'var(--green)' : c >= 40 ? 'var(--yellow)' : 'var(--red)'
})
function rankClass(i) { return i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal' }
function semColorBar(item) {
  return { verde: '#00C896', amarillo: '#FFB800', rojo: '#FF4757' }[item.color] || '#94A3B8'
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

async function ensureChartJS() {
  if (window.Chart) return
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js')
}

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) return
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await new Promise(res => setTimeout(res, 200))
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
  await new Promise(res => setTimeout(res, 150))
}

async function renderCharts() {
  await ensureChartJS()
  if (!stats.value) return
  const { kcalPorDia, fechaLabels, macros, semaforo, porTipo } = stats.value
  const C = window.Chart

  const labelsFecha = fechaLabels.map(f => {
    const d = new Date(f + 'T12:00')
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  })

  if (chartKcal.value) {
    chartInstances.kcal = new C(chartKcal.value, {
      type: 'bar',
      data: {
        labels: labelsFecha,
        datasets: [{
          label: 'kcal',
          data: kcalPorDia,
          backgroundColor: kcalPorDia.map(k =>
            k > tdee.value * 1.1 ? 'rgba(255,71,87,.7)' :
            k > tdee.value * 0.9 ? 'rgba(0,200,150,.7)' :
            'rgba(148,163,184,.5)'
          ),
          borderRadius: 6,
        }, {
          label: 'Meta TDEE',
          data: kcalPorDia.map(() => tdee.value),
          type: 'line',
          borderColor: 'rgba(67,97,238,.6)',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
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

  const total = semaforo.verde + semaforo.amarillo + semaforo.rojo
  if (chartSemaforo.value && total > 0) {
    chartInstances.semaforo = new C(chartSemaforo.value, {
      type: 'doughnut',
      data: { labels: ['Verde', 'Amarillo', 'Rojo'], datasets: [{ data: [semaforo.verde, semaforo.amarillo, semaforo.rojo], backgroundColor: ['#00C896', '#FFB800', '#FF4757'], borderWidth: 0 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, cutout: '60%' }
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

async function renderChartsOffscreen() {
  await ensureChartJS()
  if (!stats.value) return {}
  const { kcalPorDia, fechaLabels, macros, semaforo, porTipo } = stats.value
  const C = window.Chart

  const labelsFecha = fechaLabels.map(f =>
    new Date(f + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  )

  function makeCanvas(w = 800, h = 400) {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    return c
  }

  const images = {}

  const cKcal = makeCanvas(800, 320)
  const instKcal = new C(cKcal, {
    type: 'bar',
    data: {
      labels: labelsFecha,
      datasets: [{
        label: 'kcal', data: kcalPorDia,
        backgroundColor: kcalPorDia.map(k =>
          k > tdee.value * 1.1 ? 'rgba(255,71,87,.85)' :
          k > tdee.value * 0.9 ? 'rgba(0,200,150,.85)' :
          'rgba(148,163,184,.6)'
        ),
        borderRadius: 6,
      }, {
        label: 'Meta TDEE', data: kcalPorDia.map(() => tdee.value),
        type: 'line', borderColor: 'rgba(67,97,238,.7)',
        borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false,
      }]
    },
    options: { responsive: false, animation: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
  })
  images.kcal = cKcal.toDataURL('image/png')
  instKcal.destroy()

  const cMacros = makeCanvas(600, 320)
  const instMacros = new C(cMacros, {
    type: 'bar',
    data: {
      labels: ['Proteína', 'Carbohidratos', 'Grasas'],
      datasets: [{ label: 'g/día promedio', data: [macros.prot, macros.carbs, macros.grasas], backgroundColor: ['rgba(67,97,238,.85)', 'rgba(255,184,0,.85)', 'rgba(255,71,87,.85)'], borderRadius: 8 }]
    },
    options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  })
  images.macros = cMacros.toDataURL('image/png')
  instMacros.destroy()

  const totalSem = semaforo.verde + semaforo.amarillo + semaforo.rojo
  if (totalSem > 0) {
    const cSem = makeCanvas(400, 400)
    const instSem = new C(cSem, {
      type: 'doughnut',
      data: { labels: ['Verde', 'Amarillo', 'Rojo'], datasets: [{ data: [semaforo.verde, semaforo.amarillo, semaforo.rojo], backgroundColor: ['#00C896', '#FFB800', '#FF4757'], borderWidth: 0 }] },
      options: { responsive: false, animation: false, plugins: { legend: { display: false } }, cutout: '60%' }
    })
    images.semaforo = cSem.toDataURL('image/png')
    instSem.destroy()
  }

  const cMeals = makeCanvas(600, 280)
  const instMeals = new C(cMeals, {
    type: 'bar',
    data: {
      labels: porTipo.map(t => ({ desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[t.tipo])),
      datasets: [{ label: 'kcal totales', data: porTipo.map(t => t.kcal), backgroundColor: ['rgba(0,200,150,.85)', 'rgba(255,184,0,.85)', 'rgba(67,97,238,.85)', 'rgba(255,71,87,.85)'], borderRadius: 8 }]
    },
    options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  })
  images.meals = cMeals.toDataURL('image/png')
  instMeals.destroy()

  return images
}

async function exportarPDF() {
  if (!stats.value) { showToast('Sin datos para exportar', 'warning'); return }
  generando.value = 'pdf'
  showToast('Generando PDF...', 'loading')
  try {
    await ensureJsPDF()

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    if (typeof doc.autoTable !== 'function') {
      throw new Error('El plugin autoTable no se cargó correctamente. Intenta de nuevo.')
    }

    const imgs = await renderChartsOffscreen()

    const W = doc.internal.pageSize.getWidth()
    let y = 0

    doc.setFillColor(0, 200, 150)
    doc.rect(0, 0, W, 38, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
    doc.text('FoodLight — Reporte Nutricional', 14, 15)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Periodo: ${fechaInicioFormateada.value} - ${fechaFinFormateada.value}`, 14, 24)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 14, 31)
    y = 44

    const p    = store.profile || {}
    const user = store.authUser || {}
    const condActivas = Object.entries(p.condiciones || {})
      .filter(([, v]) => v)
      .map(([k]) => ({ celiaquía: 'Celiaquía', hipertension: 'Hipertension', diabetes_t2: 'Diabetes T2' }[k] || k))
      .join(', ') || 'Ninguna'

    doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('Datos del usuario', 14, y); y += 6
    doc.autoTable({
      startY: y,
      body: [
        ['Nombre',  nombreUsuario.value,               'Correo',        user.email || '—'],
        ['Edad',    p.edad ? `${p.edad} años` : '—',  'Sexo',          p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : '—'],
        ['Peso',    p.peso ? `${p.peso} kg` : '—',    'Estatura',      p.estatura ? `${p.estatura} cm` : '—'],
        ['TDEE',    `${tdee.value} kcal/día`,          'Padecimientos', condActivas],
      ],
      theme: 'plain', styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 28 },
        1: { cellWidth: 52 },
        2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 28 },
        3: { cellWidth: 52 },
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10

    const s = stats.value
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('Resumen estadistico', 14, y); y += 6
    doc.autoTable({
      startY: y,
      head: [['Metrica', 'Valor', 'Referencia']],
      body: [
        ['Dias con registro',     `${s.diasConRegistro} de ${s.totalDias}`, `${Math.round(s.diasConRegistro / s.totalDias * 100)}% del periodo`],
        ['Promedio kcal/dia',     `${s.promedioKcal} kcal`,                  `Meta: ${tdee.value} kcal`],
        ['Total de registros',    `${s.totalEntradas}`,                       ''],
        ['Dias en meta calorica', `${s.cumplimientoMeta}%`,                   '+/-10% del TDEE'],
        ['Alimentos verdes',      `${s.semaforo.verde}`,                      `${Math.round(s.semaforo.verde / Math.max(1, s.semaforo.verde + s.semaforo.amarillo + s.semaforo.rojo) * 100)}% del total`],
        ['Alimentos amarillos',   `${s.semaforo.amarillo}`,                   ''],
        ['Alimentos rojos',       `${s.semaforo.rojo}`,                       ''],
      ],
      headStyles: { fillColor: [0, 200, 150], textColor: 255 },
      styles: { fontSize: 10 }, margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text('Macronutrientes promedio por dia', 14, y); y += 6
    doc.autoTable({
      startY: y,
      head: [['Macronutriente', 'Promedio/dia']],
      body: [
        ['Proteina',      `${s.macros.prot} g`],
        ['Carbohidratos', `${s.macros.carbs} g`],
        ['Grasas',        `${s.macros.grasas} g`],
      ],
      headStyles: { fillColor: [67, 97, 238], textColor: 255 },
      styles: { fontSize: 10 }, margin: { left: 14, right: 14 },
    })

    if (imgs.kcal) {
      doc.addPage()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(30, 41, 59)
      doc.text('Calorías por día', 14, 20)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
      doc.text(`Meta TDEE: ${tdee.value} kcal/día  ·  Verde = en meta  ·  Gris = sin registro  ·  Rojo = exceso`, 14, 28)
      doc.addImage(imgs.kcal, 'PNG', 14, 36, W - 28, 120)
    }

    if (imgs.macros) {
      doc.addPage()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(30, 41, 59)
      doc.text('Macronutrientes promedio por día', 14, 20)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
      doc.text('Gramos promedio consumidos por día durante el período', 14, 28)
      doc.addImage(imgs.macros, 'PNG', 14, 36, W - 28, 120)
    }

    if (imgs.semaforo) {
      doc.addPage()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(30, 41, 59)
      doc.text('Distribución semáforo', 14, 20)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
      doc.text(`Total: ${s.semaforo.verde + s.semaforo.amarillo + s.semaforo.rojo}  ·  Verde: ${s.semaforo.verde}  ·  Amarillo: ${s.semaforo.amarillo}  ·  Rojo: ${s.semaforo.rojo}`, 14, 28)
      const cx = (W - 28) / 2
      doc.addImage(imgs.semaforo, 'PNG', 14 + cx / 2, 36, cx, cx)
    }

    if (imgs.meals) {
      doc.addPage()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(30, 41, 59)
      doc.text('Calorías por tipo de comida', 14, 20)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
      doc.text('Total de kilocalorías acumuladas por categoría durante el período', 14, 28)
      doc.addImage(imgs.meals, 'PNG', 14, 36, W - 28, 120)
    }

    y = 14
    if (s.topAlimentos.length) {
      doc.addPage()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(30, 41, 59)
      doc.text('Alimentos mas consumidos', 14, y); y += 6
      doc.autoTable({
        startY: y,
        head: [['#', 'Alimento', 'Veces', 'Semaforo']],
        body: s.topAlimentos.map((a, i) => [
          i + 1, a.nombre, a.count,
          { verde: 'Verde', amarillo: 'Amarillo', rojo: 'Rojo' }[a.color] || a.color,
        ]),
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        styles: { fontSize: 10 }, margin: { left: 14, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 10

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      doc.text('Calorias por tipo de comida', 14, y); y += 6
      doc.autoTable({
        startY: y,
        head: [['Tipo de comida', 'kcal totales en el periodo']],
        body: s.porTipo.map(t => [
          { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[t.tipo],
          `${t.kcal.toLocaleString()} kcal`,
        ]),
        headStyles: { fillColor: [0, 166, 126], textColor: 255 },
        styles: { fontSize: 10 }, margin: { left: 14, right: 14 },
      })
    }

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
      doc.text(`FoodLight · Reporte generado automaticamente · Pagina ${i} de ${pageCount}`, 14, 290)
    }

    doc.save(`FoodLight_Reporte_${config.period}_${hoy()}.pdf`)
    showToast('PDF descargado correctamente ✅', 'success')
  } catch (e) {
    console.error(e)
    showToast('Error al generar PDF: ' + e.message, 'error')
  } finally {
    generando.value = null
  }
}

async function exportarExcel() {
  if (!stats.value) { showToast('Sin datos para exportar', 'warning'); return }
  generando.value = 'excel'
  showToast('Generando Excel...', 'loading')
  try {
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
      await new Promise(res => setTimeout(res, 200))
    }
    const XLSX = window.XLSX
    const wb   = XLSX.utils.book_new()
    const s    = stats.value
    const p    = store.profile || {}
    const user = store.authUser || {}

    const condActivas = Object.entries(p.condiciones || {})
      .filter(([, v]) => v)
      .map(([k]) => ({ celiaquía: 'Celiaquía', hipertension: 'Hipertension', diabetes_t2: 'Diabetes T2' }[k] || k))
      .join(', ') || 'Ninguna'

    const wsResumen = XLSX.utils.aoa_to_sheet([
      ['FOODLIGHT — REPORTE NUTRICIONAL'],
      [],
      ['PERIODO', `${fechaInicioFormateada.value} - ${fechaFinFormateada.value}`],
      ['Generado', new Date().toLocaleDateString('es-MX')],
      [],
      ['DATOS DEL USUARIO'],
      ['Nombre',        nombreUsuario.value],
      ['Correo',        user.email || '—'],
      ['Edad',          p.edad ? `${p.edad} años` : '—'],
      ['Sexo',          p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : '—'],
      ['Peso',          p.peso ? `${p.peso} kg` : '—'],
      ['Estatura',      p.estatura ? `${p.estatura} cm` : '—'],
      ['TDEE',          `${tdee.value} kcal/dia`],
      ['Padecimientos', condActivas],
      [],
      ['ESTADISTICAS'],
      ['Dias en el periodo',      s.totalDias],
      ['Dias con registro',       s.diasConRegistro],
      ['% cobertura',             `${Math.round(s.diasConRegistro / s.totalDias * 100)}%`],
      ['Promedio kcal/dia',       s.promedioKcal],
      ['Meta kcal/dia (TDEE)',    tdee.value],
      ['Diferencia promedio',     s.promedioKcal - tdee.value],
      ['Total registros',         s.totalEntradas],
      ['% dias en meta (+/-10%)', `${s.cumplimientoMeta}%`],
      [],
      ['SEMAFORO'],
      ['Verdes',    s.semaforo.verde],
      ['Amarillos', s.semaforo.amarillo],
      ['Rojos',     s.semaforo.rojo],
      [],
      ['MACROS PROMEDIO/DIA'],
      ['Proteina (g)',      s.macros.prot],
      ['Carbohidratos (g)', s.macros.carbs],
      ['Grasas (g)',        s.macros.grasas],
      [],
      ['CALORIAS POR TIPO DE COMIDA'],
      ...s.porTipo.map(t => [
        { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[t.tipo],
        t.kcal,
      ]),
    ])
    wsResumen['!cols'] = [{ wch: 28 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    const wsKcal = XLSX.utils.aoa_to_sheet([
      ['Fecha', 'kcal consumidas', 'Meta TDEE', 'Diferencia', 'Estado'],
      ...s.fechaLabels.map((f, i) => {
        const k = s.kcalPorDia[i]
        const diff = k - tdee.value
        const estado = k === 0 ? 'Sin registro' : diff > tdee.value * 0.1 ? 'Exceso' : diff < -tdee.value * 0.1 ? 'Deficit' : 'En meta'
        return [f, k, tdee.value, diff, estado]
      }),
    ])
    wsKcal['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsKcal, 'Calorias por dia')

    const wsTop = XLSX.utils.aoa_to_sheet([
      ['#', 'Alimento', 'Veces consumido', 'Semaforo'],
      ...s.topAlimentos.map((a, i) => [i + 1, a.nombre, a.count, { verde: 'Verde', amarillo: 'Amarillo', rojo: 'Rojo' }[a.color] || a.color]),
    ])
    wsTop['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top alimentos')

    const wsDetalle = XLSX.utils.aoa_to_sheet([
      ['Fecha', 'Tipo comida', 'Origen', 'Nombre', 'kcal', 'Proteina g', 'Carbos g', 'Grasas g', 'Fibra g', 'Sodio mg', 'Semaforo'],
      ...s.rawData.map(e => [
        e.fecha,
        { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' }[e.tipo_comida] || e.tipo_comida,
        e.origen === 'receta' ? 'Receta' : 'Alimento',
        e.origen === 'receta' ? (e.receta_nombre || '') : (e.alimento_nombre || ''),
        e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0),
        e.alimento_prot || 0, e.alimento_carbs || 0, e.alimento_grasas || 0,
        e.alimento_fibra || 0, e.alimento_sodio || 0,
        { verde: 'Verde', amarillo: 'Amarillo', rojo: 'Rojo' }[e.color_semaforo] || (e.color_semaforo || ''),
      ]),
    ])
    wsDetalle['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 35 },
      { wch: 8 }, { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 11 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle completo')

    XLSX.writeFile(wb, `FoodLight_Reporte_${config.period}_${hoy()}.xlsx`)
    showToast('Excel descargado correctamente ✅', 'success')
  } catch (e) {
    console.error(e)
    showToast('Error al generar Excel: ' + e.message, 'error')
  } finally {
    generando.value = null
  }
}

watch(() => fechaActual.value, (v) => {
  if (v.inicio && v.fin) cargarDatos()
}, { deep: true })

onMounted(() => {
  setPeriod('week')
  cargarDatos()
})
</script>

<style scoped>
.reporte-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.reporte-header h2 { font-size: 22px; font-weight: 800; }
.reporte-header p  { font-size: 14px; color: var(--gray-500); margin-top: 4px; }

.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }

.config-card { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.span-2 { grid-column: 1 / -1; }

.period-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.period-tab {
  padding: 8px 14px; border-radius: var(--radius-sm);
  background: var(--gray-100); border: 2px solid transparent;
  font-size: 13px; font-weight: 600; color: var(--gray-600); cursor: pointer; transition: all .2s;
}
.period-tab.active { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }

.date-range { display: flex; align-items: center; gap: 8px; }
.date-sep { color: var(--gray-400); font-size: 18px; }
.fecha-display { grid-column: 1 / -1; }
.fecha-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
  border-radius: 99px; background: var(--blue-light); color: var(--blue); font-size: 13px; font-weight: 600;
}

.export-btns { display: flex; gap: 10px; }
.btn-export {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 20px; border-radius: var(--radius-md); border: none;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s;
}
.btn-export.pdf   { background: var(--red);   color: white; }
.btn-export.excel { background: var(--green); color: white; }
.btn-export:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-export:disabled { opacity: .5; cursor: not-allowed; transform: none; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.stats-section { display: flex; flex-direction: column; gap: 10px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.stat-box { background: white; border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 2px; box-shadow: var(--shadow-sm); }
.stat-num { font-size: 28px; font-weight: 800; color: var(--gray-900); }
.stat-lbl { font-size: 13px; font-weight: 600; color: var(--gray-600); }
.stat-sub { font-size: 11px; color: var(--gray-400); }

.chart-card { padding: 16px; }
.chart-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.chart-wrap { position: relative; width: 100%; }
.semaforo-wrap { max-width: 200px; margin: 0 auto; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.semaforo-legend { display: flex; align-items: center; gap: 8px; justify-content: center; flex-wrap: wrap; font-size: 12px; font-weight: 600; margin-top: 8px; }
.sl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.sl-dot.verde    { background: var(--green); }
.sl-dot.amarillo { background: var(--yellow); }
.sl-dot.rojo     { background: var(--red); }

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
.top-count { font-size: 12px; font-weight: 700; color: var(--gray-500); white-space: nowrap; }

.empty-period { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; text-align: center; }
.empty-period span { font-size: 40px; }
.empty-period p { font-size: 15px; font-weight: 600; }
.empty-period small { font-size: 13px; color: var(--gray-400); }

.spinner-sm-w { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

@media (max-width: 480px) {
  .reporte-page { padding: 14px; gap: 12px; }
  .charts-row { grid-template-columns: 1fr; }
  .export-btns { flex-direction: column; }
  .config-grid { grid-template-columns: 1fr; }
}
</style>