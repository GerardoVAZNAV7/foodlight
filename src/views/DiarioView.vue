<template>
  <div class="diario-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Header + navegación de días -->
    <div class="diario-header">
      <div class="header-top">
        <h2>Diario Alimenticio</h2>
        <span class="fecha-badge">{{ fechaFormateada }}</span>
      </div>
      <div class="nav-dias">
        <button class="nav-btn" @click="irDia(-1)">‹ Ayer</button>
        <button class="nav-btn today" @click="irHoy" :disabled="esHoy">Hoy</button>
        <button class="nav-btn" @click="irDia(1)" :disabled="esHoy">Mañana ›</button>
      </div>
    </div>

    <!-- Sin perfil -->
    <div v-if="!store.hasProfile" class="empty-card card">
      <div class="empty-icon">📒</div>
      <h3>Completa tu perfil primero</h3>
      <p>Necesitamos tu TDEE y padecimientos para analizar tu diario.</p>
      <router-link to="/perfil" class="btn btn-primary">Ir a mi perfil</router-link>
    </div>

    <template v-else>
      <!-- Resumen del día -->
      <div class="resumen-card card">
        <div class="resumen-header">
          <span class="resumen-titulo">Resumen del día</span>
          <span class="tdee-ref">Meta: <strong>{{ tdee }} kcal</strong></span>
        </div>

        <div class="kcal-section">
          <div class="kcal-numbers">
            <div class="kcal-main">
              <span class="kcal-val" :style="{ color: colorKcal }">{{ totales.kcal }}</span>
              <span class="kcal-unit">/ {{ tdee }} kcal</span>
            </div>
            <span class="kcal-resto" :style="{ color: colorKcal }">{{ restoKcal }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: pctKcal + '%', background: colorKcal }"></div>
          </div>
        </div>

        <div class="macros-row">
          <div class="macro-item" v-for="m in macros" :key="m.key">
            <div class="macro-circle" :style="{ '--pct': m.pct.value + '%', '--color': m.color }">
              <span class="macro-num">{{ totales[m.key] }}g</span>
            </div>
            <span class="macro-lbl">{{ m.label }}</span>
          </div>
        </div>

        <div v-if="metricasExtra.length" class="extras-row">
          <div v-for="ex in metricasExtra" :key="ex.key" class="extra-chip" :class="ex.level">
            <span>{{ ex.icon }}</span>
            <div>
              <span class="extra-val">{{ totales[ex.key] }}{{ ex.unit }}</span>
              <span class="extra-lbl">{{ ex.label }}</span>
            </div>
          </div>
        </div>

        <div class="semaforo-dia">
          <span class="sd-label">Semáforo del día</span>
          <div class="sd-bar">
            <div class="sd-seg verde"    :style="{ flex: totales.verde    || 0 }"></div>
            <div class="sd-seg amarillo" :style="{ flex: totales.amarillo || 0 }"></div>
            <div class="sd-seg rojo"     :style="{ flex: totales.rojo     || 0 }"></div>
          </div>
          <div class="sd-counts">
            <span class="sd-dot verde">{{ totales.verde }}</span>
            <span class="sd-dot amarillo">{{ totales.amarillo }}</span>
            <span class="sd-dot rojo">{{ totales.rojo }}</span>
          </div>
        </div>
      </div>

      <!-- Secciones por tiempo de comida -->
      <div v-for="meal in mealTypes" :key="meal.key" class="meal-section">
        <div class="meal-header">
          <div class="meal-title">
            <span class="meal-icon">{{ meal.icon }}</span>
            <span>{{ meal.label }}</span>
            <span class="meal-kcal-badge">{{ kcalPorTipo[meal.key] }} kcal</span>
          </div>
          <button class="add-btn" @click="abrirModal(meal.key)">+ Agregar</button>
        </div>

        <div v-if="entradasPorTipo[meal.key]?.length" class="entradas-list">
          <div
            v-for="entrada in entradasPorTipo[meal.key]"
            :key="entrada.id"
            class="entrada-item"
            :class="entrada.color_semaforo || 'verde'"
          >
            <div class="entrada-dot" :class="entrada.color_semaforo || 'verde'"></div>
            <div class="entrada-info">
              <span class="entrada-nombre">
                {{ entrada.origen === 'receta' ? entrada.receta_nombre : entrada.alimento_nombre }}
              </span>
              <span class="entrada-meta">
                <template v-if="entrada.origen === 'alimento'">{{ entrada.cantidad_g }}g</template>
                <template v-else>{{ entrada.receta_porciones }} porción(es)</template>
              </span>
            </div>
            <span class="entrada-kcal">
              {{ entrada.origen === 'receta' ? entrada.receta_kcal : entrada.alimento_kcal }} kcal
            </span>
            <button class="del-btn" @click="eliminarEntrada(entrada.id)" title="Eliminar">✕</button>
          </div>
        </div>
        <div v-else class="meal-empty">
          <span>Sin registros — <button class="link-btn" @click="abrirModal(meal.key)">agregar</button></span>
        </div>
      </div>
    </template>

    <!-- Modal para agregar entrada -->
    <transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Agregar a {{ mealTypes.find(m => m.key === modal.tipo)?.label }}</h3>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>

          <!-- Tabs -->
          <div class="modal-tabs">
            <button class="modal-tab" :class="{ active: modal.origen === 'alimento' }" @click="switchOrigen('alimento')">🥗 Alimento</button>
            <button class="modal-tab" :class="{ active: modal.origen === 'receta' }"   @click="switchOrigen('receta')">🍽️ Receta</button>
          </div>

          <!-- Tab: Alimento -->
          <template v-if="modal.origen === 'alimento'">
            <input v-model="modal.busqueda" type="search" class="input"
              placeholder="🔍 Buscar alimento..." @input="buscarAlimentos" />

            <div v-if="modal.resultados.length" class="resultados-list">
              <button
                v-for="a in modal.resultados" :key="a.id"
                class="resultado-item" :class="{ selected: modal.seleccionado?.id === a.id }"
                @click="seleccionarAlimento(a)"
              >
                <span class="r-dot" :class="colorAlimento(a)"></span>
                <span class="r-nombre">{{ a.nombre }}</span>
                <span class="r-kcal">{{ a.energia_kcal }} kcal</span>
              </button>
            </div>
            <p v-else-if="modal.busqueda.length > 1" class="no-results">Sin resultados</p>

            <div v-if="modal.seleccionado" class="cantidad-row">
              <div class="field">
                <label>Cantidad (g)</label>
                <input v-model.number="modal.cantidad" type="number" min="1" max="2000" class="input" />
              </div>
              <div class="preview-kcal">
                <span>≈</span>
                <strong>{{ kcalPreview }}</strong>
                <small>kcal</small>
              </div>
            </div>
          </template>

          <!-- Tab: Receta -->
          <template v-else>
            <input v-model="modal.busqueda" type="search" class="input"
              placeholder="🔍 Buscar receta..." @input="buscarRecetas" />

            <div v-if="modal.cargandoRecetas" class="loading-recetas">
              <div class="spinner-sm-verde"></div>
              <span>Buscando recetas...</span>
            </div>

            <div v-else-if="modal.resultadosRecetas.length" class="resultados-list">
              <button
                v-for="r in modal.resultadosRecetas" :key="r.id"
                class="resultado-item" :class="{ selected: modal.seleccionado?.id === r.id }"
                @click="seleccionarReceta(r)"
              >
                <!-- Dot con color semáforo real de la receta -->
                <span class="r-dot" :class="colorReceta(r)"></span>
                <span class="r-nombre">{{ r.nombre }}</span>
                <span class="r-kcal r-kcal-receta">
                  <template v-if="r._kcalPorPorcion != null">{{ r._kcalPorPorcion }} kcal/p</template>
                  <template v-else>{{ r.tiempo_min }} min</template>
                </span>
              </button>
            </div>
            <p v-else-if="modal.busqueda.length > 0 && !modal.cargandoRecetas" class="no-results">
              Sin resultados para "{{ modal.busqueda }}"
            </p>
            <p v-else-if="modal.busqueda.length === 0" class="no-results hint">
              Escribe para buscar recetas disponibles
            </p>

            <div v-if="modal.seleccionado" class="cantidad-row">
              <div class="field">
                <label>Porciones</label>
                <div class="porciones-input-wrap">
                  <input v-model.number="modal.porciones" type="number" min="0.5" step="0.5" class="input"
                    @change="modal.porciones = Math.max(0.5, modal.porciones || 0.5)" />
                  <div class="porciones-arrows">
                    <button type="button" @click="modal.porciones = +(modal.porciones + 0.5).toFixed(1)">▲</button>
                    <button type="button" @click="modal.porciones = +(Math.max(0.5, modal.porciones - 0.5)).toFixed(1)">▼</button>
                  </div>
                </div>
              </div>
              <div class="preview-kcal" :class="{ 'preview-unknown': kcalPreviewReceta === '?' }">
                <span>≈</span>
                <strong>{{ kcalPreviewReceta }}</strong>
                <small>kcal</small>
              </div>
            </div>

            <div v-if="modal.seleccionado && kcalPreviewReceta === '?'" class="kcal-warning">
              ℹ️ No se pudo calcular el total calórico. Se registrará sin kcal.
            </div>

            <div v-if="modal.seleccionado" class="receta-info-row">
              <span>📋 Receta rinde <strong>{{ modal.seleccionado.porciones }}</strong> porción(es)</span>
              <span v-if="modal.seleccionado._kcalPorPorcion != null">
                · <strong>{{ modal.seleccionado._kcalPorPorcion }}</strong> kcal/porción
              </span>
            </div>
          </template>

          <button
            class="btn btn-primary btn-full"
            :disabled="!modal.seleccionado || guardando"
            @click="guardarEntrada"
          >
            <span v-if="guardando" class="spinner-sm"></span>
            {{ guardando ? 'Guardando...' : '✓ Agregar al diario' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useFoodData } from '@/composables/useFoodData'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const { getAlimentos, clasificarAlimento } = useFoodData()

// ── Fecha ──────────────────────────────────────────────────────────────────────
const fechaActual = ref(hoy())
const entradas    = ref([])
const guardando   = ref(false)
const toast       = reactive({ show: false, message: '', type: 'success' })

// Mapa de alimentos cargado una sola vez
const alimentoMap = ref(new Map())

function hoy() {
  const d  = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
function irDia(delta) {
  const d = new Date(fechaActual.value + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  fechaActual.value = d.toISOString().split('T')[0]
}
function irHoy() { fechaActual.value = hoy() }
const esHoy = computed(() => fechaActual.value === hoy())
const fechaFormateada = computed(() =>
  new Date(fechaActual.value + 'T12:00:00')
    .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
)

// ── TDEE ───────────────────────────────────────────────────────────────────────
const tdee = computed(() => {
  const p = store.profile
  if (!p?.peso || !p?.estatura || !p?.edad || !p?.sexo) return 2000
  const tmb = p.sexo === 'M'
    ? 10 * p.peso + 6.25 * p.estatura - 5 * p.edad + 5
    : 10 * p.peso + 6.25 * p.estatura - 5 * p.edad - 161
  return Math.round(tmb * parseFloat(p.actividad || 1.375))
})
const condiciones = computed(() => store.profile?.condiciones || {})

// ── user_id ─────────────────────────────────────────────────────────────────
const userId = computed(() => store.authUser?.id)

// ── Normalizar texto para búsqueda en mapa ─────────────────────────────────
function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// ── Cargar mapa de alimentos (una sola vez) ────────────────────────────────
async function ensureAlimentoMap() {
  if (alimentoMap.value.size > 0) return
  const data = await getAlimentos()
  alimentoMap.value = new Map(data.map(a => [normalizar(a.nombre), a]))
}

// ── Tipos de comida ────────────────────────────────────────────────────────────
const mealTypes = [
  { key: 'desayuno', label: 'Desayuno', icon: '🌅' },
  { key: 'comida',   label: 'Comida',   icon: '☀️'  },
  { key: 'cena',     label: 'Cena',     icon: '🌙'  },
  { key: 'snack',    label: 'Snack',    icon: '🍎'  },
]

const entradasPorTipo = computed(() => {
  const m = {}
  for (const meal of mealTypes)
    m[meal.key] = entradas.value.filter(e => e.tipo_comida === meal.key)
  return m
})

const kcalPorTipo = computed(() => {
  const m = {}
  for (const meal of mealTypes) {
    m[meal.key] = Math.round(
      (entradasPorTipo.value[meal.key] || []).reduce((acc, e) =>
        acc + parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0)), 0)
    )
  }
  return m
})

const totales = computed(() => {
  const t = { kcal:0, prot:0, carbs:0, grasas:0, fibra:0, sodio:0, azucar:0, verde:0, amarillo:0, rojo:0 }
  for (const e of entradas.value) {
    t.kcal   += parseFloat(e.origen === 'receta' ? (e.receta_kcal || 0) : (e.alimento_kcal || 0))
    t.prot   += parseFloat(e.alimento_prot   || 0)
    t.carbs  += parseFloat(e.alimento_carbs  || 0)
    t.grasas += parseFloat(e.alimento_grasas || 0)
    t.fibra  += parseFloat(e.alimento_fibra  || 0)
    t.sodio  += parseFloat(e.alimento_sodio  || 0)
    t.azucar += parseFloat(e.alimento_azucar || 0)
    if (e.color_semaforo && ['verde','amarillo','rojo'].includes(e.color_semaforo))
      t[e.color_semaforo]++
  }
  for (const k of Object.keys(t))
    if (!['verde','amarillo','rojo'].includes(k)) t[k] = Math.round(t[k] * 10) / 10
  return t
})

const pctKcal   = computed(() => Math.min(100, Math.round((totales.value.kcal / tdee.value) * 100)))
const colorKcal = computed(() => {
  if (pctKcal.value > 110) return 'var(--red)'
  if (pctKcal.value > 90)  return 'var(--yellow)'
  return 'var(--green)'
})
const restoKcal = computed(() => {
  const diff = tdee.value - totales.value.kcal
  return diff >= 0 ? `${diff} kcal restantes` : `${Math.abs(diff)} kcal de exceso`
})

const macros = [
  { key: 'prot',   label: 'Proteína', color: '#4361EE', max: 150 },
  { key: 'carbs',  label: 'Carbos',   color: '#FFB800', max: 300 },
  { key: 'grasas', label: 'Grasas',   color: '#FF4757', max: 80  },
].map(m => ({
  ...m,
  pct: computed(() => Math.min(100, Math.round((totales.value[m.key] / m.max) * 100))),
}))

const metricasExtra = computed(() => {
  const ex = []
  if (condiciones.value.hipertension) {
    const sodio = totales.value.sodio
    ex.push({ key: 'sodio', icon: '🧂', label: 'Sodio', unit: 'mg',
      level: sodio > 2300 ? 'nivel-rojo' : sodio > 1500 ? 'nivel-amarillo' : 'nivel-verde' })
  }
  if (condiciones.value.diabetes_t2) {
    const azucar = totales.value.azucar
    ex.push({ key: 'azucar', icon: '🩸', label: 'Azúcar', unit: 'g',
      level: azucar > 50 ? 'nivel-rojo' : azucar > 25 ? 'nivel-amarillo' : 'nivel-verde' })
  }
  return ex
})

// ── Color semáforo de un alimento del modal ────────────────────────────────
function colorAlimento(a) {
  return clasificarAlimento(a, condiciones.value)
}

// ── Color semáforo de una receta: peor color entre sus ingredientes ─────────
// Orden de prioridad: rojo > amarillo > verde
function colorReceta(receta) {
  const ings = receta._ingredientes || []
  if (ings.some(ing => {
    const a = alimentoMap.value.get(normalizar(ing.alimento_nombre || ing.notas || ''))
    return a && clasificarAlimento(a, condiciones.value) === 'rojo'
  })) return 'rojo'
  if (ings.some(ing => {
    const a = alimentoMap.value.get(normalizar(ing.alimento_nombre || ing.notas || ''))
    return a && clasificarAlimento(a, condiciones.value) === 'amarillo'
  })) return 'amarillo'
  return 'verde'
}

// ── color_semaforo para guardar en DB (receta) ─────────────────────────────
function calcularColorReceta(receta) {
  return colorReceta(receta)
}

// ── Modal ──────────────────────────────────────────────────────────────────────
const modal = reactive({
  open: false, tipo: 'desayuno', origen: 'alimento',
  busqueda: '', resultados: [], resultadosRecetas: [],
  cargandoRecetas: false, seleccionado: null,
  cantidad: 100, porciones: 1,
})

function abrirModal(tipo) {
  Object.assign(modal, {
    open: true, tipo, origen: 'alimento',
    busqueda: '', resultados: [], resultadosRecetas: [],
    cargandoRecetas: false, seleccionado: null,
    cantidad: 100, porciones: 1,
  })
}
function cerrarModal() { modal.open = false }
function switchOrigen(o) {
  modal.origen = o; modal.busqueda = ''
  modal.resultados = []; modal.resultadosRecetas = []
  modal.seleccionado = null; modal.cargandoRecetas = false
}

// ── Búsqueda alimentos ─────────────────────────────────────────────────────
let alimentoTimer = null
function buscarAlimentos() {
  clearTimeout(alimentoTimer)
  alimentoTimer = setTimeout(async () => {
    const q = modal.busqueda.trim()
    if (q.length < 2) { modal.resultados = []; return }
    const { data } = await supabase
      .from('alimentos')
      .select('*, grupos_alimentos(nombre)')
      .ilike('nombre', `%${q}%`)
      .order('nombre')
      .limit(10)
    modal.resultados = (data || []).map(a => ({
      ...a, grupo_nombre: a.grupos_alimentos?.nombre || 'Otro'
    }))
  }, 200)
}

// ── Nutrición de receta via JOIN ───────────────────────────────────────────
async function calcularNutricionReceta(recetaId) {
  const { data: ings, error } = await supabase
    .from('receta_ingredientes')
    .select(`
      cantidad,
      alimentos ( energia_kcal, proteina_g, lipidos_g, hidratos_carbono_g,
                  fibra_g, sodio_mg, azucar_g, peso_neto_g )
    `)
    .eq('receta_id', recetaId)

  if (error || !ings?.length) return null

  const tot = { kcal:0, prot:0, carbs:0, grasas:0, fibra:0, sodio:0, azucar:0 }
  let encontrados = 0

  for (const ing of ings) {
    const a = ing.alimentos
    if (!a) continue
    const cantidadG   = parseFloat(ing.cantidad) || 0
    const pesoPorcion = parseFloat(a.peso_neto_g) || 100
    if (!cantidadG) continue
    encontrados++
    const f = cantidadG / pesoPorcion
    tot.kcal   += (parseFloat(a.energia_kcal)       || 0) * f
    tot.prot   += (parseFloat(a.proteina_g)         || 0) * f
    tot.carbs  += (parseFloat(a.hidratos_carbono_g) || 0) * f
    tot.grasas += (parseFloat(a.lipidos_g)          || 0) * f
    tot.fibra  += (parseFloat(a.fibra_g)            || 0) * f
    tot.sodio  += (parseFloat(a.sodio_mg)           || 0) * f
    tot.azucar += (parseFloat(a.azucar_g)           || 0) * f
  }

  if (!encontrados) return null
  for (const k of Object.keys(tot)) tot[k] = Math.round(tot[k] * 10) / 10
  return tot
}

// ── Búsqueda recetas — también carga ingredientes para calcular color ───────
let recetaTimer = null
async function buscarRecetas() {
  const q = modal.busqueda.trim()
  if (!q) { modal.resultadosRecetas = []; return }
  clearTimeout(recetaTimer)
  recetaTimer = setTimeout(async () => {
    modal.cargandoRecetas = true
    modal.resultadosRecetas = []
    try {
      // Aseguramos que el mapa de alimentos esté listo
      await ensureAlimentoMap()

      const { data, error } = await supabase
        .from('recetas')
        .select('id, nombre, tiempo_min, porciones, tipo_comida')
        .ilike('nombre', `%${q}%`)
        .eq('activa', true)
        .order('nombre')
        .limit(10)

      if (error || !data?.length) return

      // Para cada receta traemos sus ingredientes (para color semáforo)
      const ids = data.map(r => r.id)
      const { data: ingsData } = await supabase
        .from('receta_ingredientes')
        .select('receta_id, cantidad, alimento_nombre, notas')
        .in('receta_id', ids)

      // Agrupar ingredientes por receta
      const ingPorReceta = {}
      for (const ing of ingsData || []) {
        if (!ingPorReceta[ing.receta_id]) ingPorReceta[ing.receta_id] = []
        ingPorReceta[ing.receta_id].push(ing)
      }

      const recetasConNutricion = await Promise.all(
        data.map(async rec => {
          const nutricion = await calcularNutricionReceta(rec.id)
          return {
            ...rec,
            _ingredientes: ingPorReceta[rec.id] || [],
            _kcalPorPorcion: nutricion ? Math.round(nutricion.kcal / (rec.porciones || 1)) : null,
            _kcalTotal:      nutricion ? Math.round(nutricion.kcal) : null,
            _nutricionTotal: nutricion,
          }
        })
      )
      modal.resultadosRecetas = recetasConNutricion
    } finally {
      modal.cargandoRecetas = false
    }
  }, 300)
}

function seleccionarAlimento(a) {
  modal.seleccionado = a
  modal.cantidad = parseFloat(a.peso_neto_g) || 100
}
function seleccionarReceta(r) {
  modal.seleccionado = r
  modal.porciones = 1
}

const kcalPreview = computed(() => {
  if (!modal.seleccionado || modal.origen !== 'alimento') return 0
  const kcalP = parseFloat(modal.seleccionado.energia_kcal) || 0
  const pesoP = parseFloat(modal.seleccionado.peso_neto_g)  || 100
  return Math.round((kcalP / pesoP) * (modal.cantidad || 0))
})

const kcalPreviewReceta = computed(() => {
  if (!modal.seleccionado || modal.origen !== 'receta') return '?'
  const kpp = modal.seleccionado._kcalPorPorcion
  if (kpp == null) return '?'
  return Math.round(kpp * (modal.porciones || 1))
})

// ── CRUD Diario ────────────────────────────────────────────────────────────────
async function cargarEntradas() {
  if (!userId.value) return
  const { data, error } = await supabase
    .from('diario_alimenticio')
    .select('*')
    .eq('user_id', userId.value)
    .eq('fecha', fechaActual.value)
    .order('created_at')
  if (!error) entradas.value = data || []
}

async function guardarEntrada() {
  if (!modal.seleccionado || !userId.value) return
  guardando.value = true
  try {
    const payload = {
      user_id:     userId.value,
      fecha:       fechaActual.value,
      tipo_comida: modal.tipo,
      origen:      modal.origen,
    }

    if (modal.origen === 'alimento') {
      const a     = modal.seleccionado
      const kP    = parseFloat(a.energia_kcal) || 0
      const pesoP = parseFloat(a.peso_neto_g)  || 100
      const fact  = (modal.cantidad || 100) / pesoP
      const color = clasificarAlimento(a, condiciones.value)
      Object.assign(payload, {
        alimento_nombre: a.nombre,
        alimento_kcal:   r(kP * fact),
        alimento_prot:   r((parseFloat(a.proteina_g)         || 0) * fact),
        alimento_carbs:  r((parseFloat(a.hidratos_carbono_g) || 0) * fact),
        alimento_grasas: r((parseFloat(a.lipidos_g)          || 0) * fact),
        alimento_fibra:  r((parseFloat(a.fibra_g)            || 0) * fact),
        alimento_sodio:  r((parseFloat(a.sodio_mg)           || 0) * fact),
        alimento_azucar: r((parseFloat(a.azucar_g)           || 0) * fact),
        alimento_ig:     parseFloat(a.indice_glucemico) || null,
        contiene_gluten: a.contiene_gluten === true || a.contiene_gluten === 't',
        color_semaforo:  color,
        cantidad_g:      modal.cantidad,
      })
    } else {
      const rec     = modal.seleccionado
      const porTot  = rec.porciones || 1
      const porUsu  = modal.porciones || 1
      const factP   = porUsu / porTot
      const nutri   = rec._nutricionTotal
      const kcalCal = typeof kcalPreviewReceta.value === 'number' ? kcalPreviewReceta.value : null

      // Color semáforo de la receta: peor ingrediente gana
      const colorSem = calcularColorReceta(rec)

      Object.assign(payload, {
        receta_id:        rec.id,
        receta_nombre:    rec.nombre,
        receta_kcal:      kcalCal,
        receta_porciones: porUsu,
        color_semaforo:   colorSem,
        alimento_prot:   nutri ? r(nutri.prot   * factP) : null,
        alimento_carbs:  nutri ? r(nutri.carbs  * factP) : null,
        alimento_grasas: nutri ? r(nutri.grasas * factP) : null,
        alimento_fibra:  nutri ? r(nutri.fibra  * factP) : null,
        alimento_sodio:  nutri ? r(nutri.sodio  * factP) : null,
        alimento_azucar: nutri ? r(nutri.azucar * factP) : null,
      })
    }

    const { error } = await supabase.from('diario_alimenticio').insert(payload)
    if (error) throw error
    await cargarEntradas()
    cerrarModal()
    showToast('Entrada guardada ✅', 'success')
  } catch (e) {
    console.error(e)
    showToast('Error al guardar. Intenta de nuevo.', 'error')
  } finally {
    guardando.value = false
  }
}

function r(n) { return Math.round(n * 10) / 10 }

async function eliminarEntrada(id) {
  const { error } = await supabase.from('diario_alimenticio').delete().eq('id', id)
  if (!error) {
    entradas.value = entradas.value.filter(e => e.id !== id)
    showToast('Entrada eliminada', 'info')
  }
}

function showToast(message, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = message; toast.type = type; toast.show = true }, 50)
}

watch(fechaActual, cargarEntradas)
onMounted(async () => {
  if (store.hasProfile) {
    await ensureAlimentoMap()
    cargarEntradas()
  }
})
</script>

<style scoped>
.diario-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.diario-header { display: flex; flex-direction: column; gap: 10px; }
.header-top { display: flex; align-items: center; justify-content: space-between; }
.header-top h2 { font-size: 22px; font-weight: 800; }
.fecha-badge {
  font-size: 12px; font-weight: 600; color: var(--gray-500);
  background: var(--gray-100); padding: 4px 12px;
  border-radius: 99px; text-transform: capitalize;
}
.nav-dias { display: flex; gap: 8px; }
.nav-btn {
  flex: 1; padding: 8px 14px; border-radius: var(--radius-sm);
  background: var(--gray-100); border: 2px solid transparent;
  font-size: 13px; font-weight: 600; color: var(--gray-600);
  cursor: pointer; transition: all .2s;
}
.nav-btn:hover:not(:disabled) { background: var(--gray-200); }
.nav-btn.today { background: var(--green-light); color: var(--green-dark); border-color: var(--green); }
.nav-btn:disabled { opacity: .4; cursor: not-allowed; }

.resumen-card { display: flex; flex-direction: column; gap: 16px; }
.resumen-header { display: flex; justify-content: space-between; align-items: center; }
.resumen-titulo { font-size: 15px; font-weight: 700; }
.tdee-ref { font-size: 13px; color: var(--gray-500); }
.kcal-section { display: flex; flex-direction: column; gap: 8px; }
.kcal-numbers { display: flex; justify-content: space-between; align-items: baseline; }
.kcal-main { display: flex; align-items: baseline; gap: 4px; }
.kcal-val { font-size: 32px; font-weight: 800; transition: color .3s; }
.kcal-unit { font-size: 14px; color: var(--gray-400); }
.kcal-resto { font-size: 12px; font-weight: 600; }
.progress-track { width: 100%; height: 8px; background: var(--gray-100); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 99px; transition: width .5s ease, background .3s; }

.macros-row { display: flex; justify-content: space-around; gap: 8px; }
.macro-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.macro-circle {
  width: 64px; height: 64px; border-radius: 50%;
  background: conic-gradient(var(--color) var(--pct), var(--gray-100) 0);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.macro-circle::before { content:''; position:absolute; inset:8px; background:white; border-radius:50%; }
.macro-num { position:relative; z-index:1; font-size:11px; font-weight:700; color:var(--gray-800); }
.macro-lbl { font-size:11px; color:var(--gray-500); font-weight:600; }

.extras-row { display: flex; gap: 10px; }
.extra-chip { flex:1; display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:var(--radius-md); background:var(--gray-50); }
.extra-chip span:first-child { font-size:22px; }
.extra-chip > div { display:flex; flex-direction:column; }
.extra-val { font-size:16px; font-weight:700; }
.extra-lbl { font-size:11px; color:var(--gray-400); }
.nivel-verde    { border-left:3px solid var(--green); }
.nivel-amarillo { border-left:3px solid var(--yellow); }
.nivel-rojo     { border-left:3px solid var(--red); }

.semaforo-dia { display:flex; align-items:center; gap:10px; }
.sd-label { font-size:12px; font-weight:600; color:var(--gray-500); white-space:nowrap; }
.sd-bar { flex:1; height:10px; border-radius:99px; overflow:hidden; display:flex; gap:2px; }
.sd-seg { height:100%; min-width:4px; transition:flex .4s ease; }
.sd-seg.verde    { background:var(--green); }
.sd-seg.amarillo { background:var(--yellow); }
.sd-seg.rojo     { background:var(--red); }
.sd-counts { display:flex; gap:8px; }
.sd-dot { font-size:12px; font-weight:700; padding:2px 8px; border-radius:99px; }
.sd-dot.verde    { background:var(--green-light);  color:var(--green-dark); }
.sd-dot.amarillo { background:var(--yellow-light); color:#7A5800; }
.sd-dot.rojo     { background:var(--red-light);    color:var(--red); }

.meal-section { background:white; border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); overflow:hidden; }
.meal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--gray-100); }
.meal-title { display:flex; align-items:center; gap:8px; font-weight:700; font-size:15px; }
.meal-icon { font-size:18px; }
.meal-kcal-badge { font-size:12px; font-weight:600; color:var(--gray-400); background:var(--gray-100); padding:2px 8px; border-radius:99px; }
.add-btn { padding:6px 14px; background:var(--green-light); color:var(--green-dark); border:none; border-radius:var(--radius-sm); font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
.add-btn:hover { background:var(--green); color:white; }
.entradas-list { display:flex; flex-direction:column; }
.entrada-item { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--gray-50); border-left:3px solid transparent; transition:background .15s; }
.entrada-item:last-child { border-bottom:none; }
.entrada-item:hover { background:var(--gray-50); }
.entrada-item.verde    { border-left-color:var(--green); }
.entrada-item.amarillo { border-left-color:var(--yellow); }
.entrada-item.rojo     { border-left-color:var(--red); }
.entrada-dot { flex-shrink:0; width:8px; height:8px; border-radius:50%; }
.entrada-dot.verde    { background:var(--green); }
.entrada-dot.amarillo { background:var(--yellow); }
.entrada-dot.rojo     { background:var(--red); }
.entrada-info { flex:1; min-width:0; }
.entrada-nombre { display:block; font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.entrada-meta { font-size:11px; color:var(--gray-400); }
.entrada-kcal { font-size:13px; font-weight:700; color:var(--gray-600); white-space:nowrap; }
.del-btn { background:none; border:none; color:var(--gray-300); cursor:pointer; font-size:12px; padding:4px; border-radius:4px; transition:all .2s; }
.del-btn:hover { background:var(--red-light); color:var(--red); }
.meal-empty { padding:16px; font-size:13px; color:var(--gray-400); text-align:center; }
.link-btn { background:none; border:none; color:var(--green); font-weight:600; cursor:pointer; font-size:13px; text-decoration:underline; }
.empty-card { display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; padding:40px 24px; }
.empty-icon { font-size:48px; }

.modal-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.5); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
.modal-card { width:100%; max-width:480px; background:white; border-radius:24px 24px 0 0; padding:24px; display:flex; flex-direction:column; gap:16px; max-height:90vh; overflow-y:auto; }
.modal-header { display:flex; align-items:center; justify-content:space-between; }
.modal-header h3 { font-size:18px; font-weight:700; }
.modal-close { background:var(--gray-100); border:none; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:14px; }
.modal-tabs { display:flex; gap:8px; }
.modal-tab { flex:1; padding:10px; border-radius:var(--radius-sm); background:var(--gray-100); border:2px solid transparent; font-size:13px; font-weight:600; color:var(--gray-500); cursor:pointer; transition:all .2s; }
.modal-tab.active { border-color:var(--green); background:var(--green-light); color:var(--green-dark); }
.resultados-list { display:flex; flex-direction:column; gap:4px; max-height:220px; overflow-y:auto; }
.resultado-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-sm); background:var(--gray-50); border:2px solid transparent; text-align:left; cursor:pointer; transition:all .15s; }
.resultado-item:hover { background:var(--gray-100); }
.resultado-item.selected { border-color:var(--green); background:var(--green-light); }
.r-dot { flex-shrink:0; width:8px; height:8px; border-radius:50%; }
.r-dot.verde    { background:var(--green); }
.r-dot.amarillo { background:var(--yellow); }
.r-dot.rojo     { background:var(--red); }
.r-nombre { flex:1; font-size:14px; font-weight:500; }
.r-kcal { font-size:12px; color:var(--gray-400); font-weight:600; }
.r-kcal-receta { color:var(--green-dark); }
.no-results { font-size:13px; color:var(--gray-400); text-align:center; padding:12px; }
.no-results.hint { color:var(--gray-300); font-style:italic; }
.loading-recetas { display:flex; align-items:center; gap:10px; padding:12px; color:var(--gray-500); font-size:13px; }
.spinner-sm-verde { width:16px; height:16px; border:2px solid var(--gray-200); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
.cantidad-row { display:flex; align-items:flex-end; gap:14px; }
.cantidad-row .field { flex:1; }
.porciones-input-wrap { display:flex; border:2px solid var(--green); border-radius:var(--radius-sm); overflow:hidden; }
.porciones-input-wrap .input { flex:1; border:none; border-radius:0; font-size:18px; font-weight:700; -moz-appearance:textfield; }
.porciones-input-wrap .input::-webkit-outer-spin-button,
.porciones-input-wrap .input::-webkit-inner-spin-button { -webkit-appearance:none; }
.porciones-arrows { display:flex; flex-direction:column; border-left:2px solid var(--green); }
.porciones-arrows button { flex:1; width:32px; padding:0; border:none; background:var(--gray-50); cursor:pointer; font-size:9px; color:var(--gray-500); transition:background .15s; line-height:1; font-family:var(--font); }
.porciones-arrows button:hover { background:var(--green-light); color:var(--green-dark); }
.porciones-arrows button:first-child { border-bottom:1px solid var(--green); }
.preview-kcal { display:flex; align-items:baseline; gap:4px; padding-bottom:14px; white-space:nowrap; }
.preview-kcal span   { font-size:16px; color:var(--gray-400); }
.preview-kcal strong { font-size:20px; font-weight:800; color:var(--green); }
.preview-kcal small  { font-size:12px; color:var(--gray-400); }
.preview-kcal.preview-unknown strong { color:var(--gray-300); }
.receta-info-row { font-size:12px; color:var(--gray-500); display:flex; flex-wrap:wrap; gap:4px; }
.kcal-warning { font-size:12px; color:#7A5800; background:var(--yellow-light); border:1px solid var(--yellow); border-radius:var(--radius-sm); padding:8px 12px; }
.spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.modal-enter-active, .modal-leave-active { transition:opacity .3s ease; }
.modal-enter-from, .modal-leave-to { opacity:0; }
</style>