<template>
  <div class="semaforo-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Header -->
    <div class="semaforo-header">
      <h2>Semáforo Alimenticio</h2>
      <p v-if="store.hasProfile">
        Ajustado para:
        <span v-for="(val, key) in activeConditions" :key="key" class="cond-chip">{{ condLabels[key] }}</span>
        <span v-if="Object.keys(activeConditions).length === 0" class="cond-chip neutral">Sin padecimientos</span>
      </p>
    </div>

    <!-- No profile warning -->
    <div v-if="!store.hasProfile" class="no-profile-card card">
      <div class="np-icon">⚠️</div>
      <h3>Completa tu perfil primero</h3>
      <p>Para personalizar el semáforo necesitamos tus datos y padecimientos.</p>
      <router-link to="/perfil" class="btn btn-primary">Ir a mi perfil</router-link>
    </div>

    <template v-else>
      <!-- Loading state -->
      <div v-if="loadingData" class="loading-section" role="status" aria-label="Cargando alimentos">
        <div class="loading-semaforo">
          <div class="light red blinking"></div>
          <div class="light yellow blinking delay1"></div>
          <div class="light green blinking delay2"></div>
        </div>
        <p>Analizando alimentos según tu perfil...</p>
        <div class="loading-bar"><div class="loading-fill" :style="{ width: loadProgress + '%' }"></div></div>
        <span>{{ loadProgress }}%</span>
      </div>

      <!-- Error -->
      <div v-else-if="dataError" class="error-card card">
        <div>❌</div>
        <h3>Error al cargar alimentos</h3>
        <p>{{ dataError }}</p>
        <p class="error-hint">Revisa que los archivos CSV estén en <code>public/data/</code></p>
        <button class="btn btn-primary" @click="loadData">Reintentar</button>
      </div>

      <template v-else>
        <!-- Filters -->
        <div class="filters-row">
          <input
            v-model="search"
            type="search"
            class="input search-input"
            id="semaforo-search"
            placeholder="🔍 Buscar alimento... (Alt + B)"
            aria-label="Buscar alimento"
          />
          <select v-model="grupoFilter" class="input select-small">
            <option value="">Todos los grupos</option>
            <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
          </select>
        </div>

        <!-- Traffic light legend -->
        <div class="legend-row">
          <button
            v-for="s in semaforos" :key="s.key"
            class="legend-pill"
            :class="[s.key, { active: activeFilter === s.key }]"
            @click="activeFilter = activeFilter === s.key ? '' : s.key"
            :aria-pressed="activeFilter === s.key"
          >
            <span class="pill-dot"></span>
            <span>{{ s.label }}</span>
            <span class="pill-count">{{ counts[s.key] }}</span>
          </button>
        </div>

        <!-- Main semaforo visual -->
        <div class="semaforo-visual card">
          <div class="traffic-light">
            <div class="tl-body">
              <div class="tl-light red" :class="{ active: !activeFilter || activeFilter === 'rojo' }" @click="activeFilter = activeFilter === 'rojo' ? '' : 'rojo'">
                <span>{{ counts.rojo }}</span>
              </div>
              <div class="tl-light yellow" :class="{ active: !activeFilter || activeFilter === 'amarillo' }" @click="activeFilter = activeFilter === 'amarillo' ? '' : 'amarillo'">
                <span>{{ counts.amarillo }}</span>
              </div>
              <div class="tl-light green" :class="{ active: !activeFilter || activeFilter === 'verde' }" @click="activeFilter = activeFilter === 'verde' ? '' : 'verde'">
                <span>{{ counts.verde }}</span>
              </div>
            </div>
          </div>
          <div class="semaforo-summary">
            <div v-for="s in semaforos" :key="s.key" class="summary-row">
              <span class="dot" :class="s.key"></span>
              <div>
                <strong>{{ s.label }}</strong>
                <p>{{ s.desc }}</p>
              </div>
              <span class="count-badge" :class="s.key">{{ counts[s.key] }}</span>
            </div>
          </div>
        </div>

        <!-- Food grid -->
        <div class="food-grid" v-if="filtered.length">
          <div
            v-for="item in paginated" :key="item.nombre"
            class="food-card"
            :class="clasificacion(item)"
            @click="selected = item"
          >
            <div class="food-status-dot" :class="clasificacion(item)"></div>
            <div class="food-info">
              <span class="food-name">{{ item.nombre }}</span>
              <span class="food-group">{{ item.grupo_nombre }}</span>
            </div>
            <div class="food-kcal">{{ item.energia_kcal }}<small>kcal</small></div>
          </div>
        </div>
        <div v-else class="empty-state">
          <span>🔍</span><p>No hay alimentos con ese criterio</p>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination" role="navigation" aria-label="Paginación">
          <button class="btn btn-secondary" :disabled="page === 1" @click="page--">← Anterior</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-secondary" :disabled="page === totalPages" @click="page++">Siguiente →</button>
        </div>
      </template>
    </template>

    <!-- Food detail modal -->
    <transition name="modal">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-card" :class="clasificacion(selected)">
          <button class="modal-close" @click="selected = null">✕</button>
          <div class="modal-status" :class="clasificacion(selected)">
            {{ { verde: '✅ Consumo libre', amarillo: '⚠️ Consumir con moderación', rojo: '🚫 Evitar' }[clasificacion(selected)] }}
          </div>
          <h3 class="modal-title">{{ selected.nombre }}</h3>
          <p class="modal-group">{{ selected.grupo_nombre }}</p>
          <div class="nutrients-grid">
            <div class="nutrient"><span class="n-val">{{ selected.energia_kcal }}</span><span class="n-lbl">kcal</span></div>
            <div class="nutrient"><span class="n-val">{{ selected.proteina_g }}g</span><span class="n-lbl">Proteína</span></div>
            <div class="nutrient"><span class="n-val">{{ selected.hidratos_carbono_g }}g</span><span class="n-lbl">Carbos</span></div>
            <div class="nutrient"><span class="n-val">{{ selected.lipidos_g }}g</span><span class="n-lbl">Grasas</span></div>
            <div class="nutrient"><span class="n-val">{{ selected.fibra_g || '—' }}g</span><span class="n-lbl">Fibra</span></div>
            <div class="nutrient"><span class="n-val">{{ selected.sodio_mg || '—' }}mg</span><span class="n-lbl">Sodio</span></div>
          </div>
          <div v-if="selected.contiene_gluten === true || selected.contiene_gluten === 'TRUE'" class="gluten-warn">
            ⚠️ Contiene gluten
          </div>
          <div class="modal-serving">
            <span>🍽️ Porción sugerida:</span>
            <strong>{{ selected.cantidad_sugerida }} {{ selected.unidad }} ({{ selected.peso_neto_g }}g)</strong>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useFoodData } from '@/composables/useFoodData'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const { getAlimentos, clasificarAlimento } = useFoodData()

const allAlimentos = ref([])
const loadingData = ref(false)
const dataError = ref('')
const loadProgress = ref(0)
const search = ref('')
const grupoFilter = ref('')
const activeFilter = ref('')
const page = ref(1)
const selected = ref(null)
const PAGE_SIZE = 20

const toast = reactive({ show: false, message: '', type: 'success' })

const semaforos = [
  { key: 'verde', label: 'Consumo libre', desc: 'Alimentos seguros y recomendados para tu perfil.' },
  { key: 'amarillo', label: 'Moderar', desc: 'Consúmelos con moderación y controla las porciones.' },
  { key: 'rojo', label: 'Evitar', desc: 'Pueden afectar negativamente tu salud según tus padecimientos.' },
]

const condLabels = { celiaquía: '🌾 Celiaquía', hipertension: '💊 Hipertensión', diabetes_t2: '🩸 Diabetes tipo 2', obesidad: '⚖️ Obesidad', sobrepeso: '⚖️ Sobrepeso' }

const activeConditions = computed(() => {
  const c = store.profile?.condiciones || {}
  return Object.fromEntries(Object.entries(c).filter(([, v]) => v))
})

const grupos = computed(() => {
  const seen = new Set()
  return allAlimentos.value
    .filter(a => { if (seen.has(a.grupo_id)) return false; seen.add(a.grupo_id); return true })
    .map(a => ({ id: a.grupo_id, nombre: a.grupo_nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

function clasificacion(item) {
  return clasificarAlimento(item, store.profile?.condiciones || {})
}

const filtered = computed(() => {
  let items = allAlimentos.value
  if (search.value) items = items.filter(a => a.nombre.toLowerCase().includes(search.value.toLowerCase()))
  if (grupoFilter.value) items = items.filter(a => a.grupo_id == grupoFilter.value)
  if (activeFilter.value) items = items.filter(a => clasificacion(a) === activeFilter.value)
  return items
})

watch([search, grupoFilter, activeFilter], () => { page.value = 1 })

const totalPages = computed(() => Math.ceil(filtered.value.length / PAGE_SIZE))
const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const counts = computed(() => ({
  verde: allAlimentos.value.filter(a => clasificacion(a) === 'verde').length,
  amarillo: allAlimentos.value.filter(a => clasificacion(a) === 'amarillo').length,
  rojo: allAlimentos.value.filter(a => clasificacion(a) === 'rojo').length,
}))

async function loadData(force = false) {
  if (!store.hasProfile) return
  loadingData.value = true
  dataError.value = ''
  loadProgress.value = 0

  const ticker = setInterval(() => {
    if (loadProgress.value < 85) loadProgress.value += 15
  }, 200)

  try {
    const data = await getAlimentos(force)   // ← pasa force
    clearInterval(ticker)
    loadProgress.value = 100
    await new Promise(r => setTimeout(r, 300))
    allAlimentos.value = data
    toast.show = false
    setTimeout(() => { toast.message = `${data.length} alimentos analizados ✅`; toast.type = 'success'; toast.show = true }, 50)
  } catch (e) {
    clearInterval(ticker)
    dataError.value = e.message
  } finally {
    loadingData.value = false
  }
}

function onCloseModal() { selected.value = null }

onMounted(() => {
  loadData()
  window.addEventListener('foodlight:close-modal', onCloseModal)
})

// Recargar cuando cambien las condiciones del perfil
watch(
  () => store.profile?.condiciones,
  (newConds, oldConds) => {
    if (JSON.stringify(newConds) !== JSON.stringify(oldConds)) {
      loadData(true)   // ← force: true
    }
  },
  { deep: true }
)
onUnmounted(() => {
  window.removeEventListener('foodlight:close-modal', onCloseModal)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   ESTILOS BASE (desktop) — idénticos al original
   ═══════════════════════════════════════════════ */
.semaforo-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.semaforo-header h2 { font-size: 22px; font-weight: 800; }
.semaforo-header p { font-size: 13px; color: var(--gray-500); margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cond-chip {
  padding: 3px 10px; border-radius: 99px;
  background: var(--green-light); color: var(--green-dark); font-size: 12px; font-weight: 600;
}
.cond-chip.neutral { background: var(--gray-100); color: var(--gray-600); }

/* Loading */
.loading-section {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 40px 20px; background: white; border-radius: var(--radius-lg);
}
.loading-section p { font-size: 15px; font-weight: 600; color: var(--gray-600); }
.loading-section span { font-size: 13px; color: var(--gray-400); }
.loading-bar { width: 100%; height: 6px; background: var(--gray-200); border-radius: 99px; overflow: hidden; }
.loading-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--blue)); border-radius: 99px; transition: width .3s; }

.loading-semaforo {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: #1a1a2e; padding: 16px 20px; border-radius: var(--radius-md);
}
.light { width: 40px; height: 40px; border-radius: 50%; opacity: .3; transition: opacity .3s; }
.light.red { background: var(--red); }
.light.yellow { background: var(--yellow); }
.light.green { background: var(--green); }
.light.blinking { animation: blink 1.2s ease-in-out infinite; }
.light.delay1 { animation-delay: .4s; }
.light.delay2 { animation-delay: .8s; }
@keyframes blink { 0%, 100% { opacity: .3; } 50% { opacity: 1; box-shadow: 0 0 20px currentColor; } }

/* No profile */
.no-profile-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.np-icon { font-size: 48px; }
.no-profile-card h3 { font-size: 18px; font-weight: 700; }
.no-profile-card p { font-size: 14px; color: var(--gray-500); }

/* Error */
.error-card { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.error-card div:first-child { font-size: 40px; }
.error-hint { font-size: 12px; color: var(--gray-400); }
.error-hint code { background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }

/* Filters */
.filters-row { display: flex; gap: 10px; }
.search-input { flex: 1; }
.select-small { flex: 0 0 140px; font-size: 13px; padding: 10px 12px; }

/* Legend */
.legend-row { display: flex; gap: 8px; }
.legend-pill {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 8px;
  border: 2px solid transparent; border-radius: var(--radius-md);
  background: var(--gray-100); cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all .2s;
}
.legend-pill .pill-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-pill.verde .pill-dot { background: var(--green); }
.legend-pill.amarillo .pill-dot { background: var(--yellow); }
.legend-pill.rojo .pill-dot { background: var(--red); }
.legend-pill.verde.active { border-color: var(--green); background: var(--green-light); color: var(--green-dark); }
.legend-pill.amarillo.active { border-color: var(--yellow); background: var(--yellow-light); color: #7A5800; }
.legend-pill.rojo.active { border-color: var(--red); background: var(--red-light); color: var(--red); }
.pill-count { background: white; padding: 2px 7px; border-radius: 99px; font-size: 11px; }

/* Semaforo visual */
.semaforo-visual { display: flex; gap: 20px; align-items: flex-start; }
.traffic-light { flex-shrink: 0; }
.tl-body {
  background: #1C1C2E; border-radius: 20px; padding: 16px 12px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,.3);
}
.tl-light {
  width: 56px; height: 56px; border-radius: 50%; opacity: .25;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .3s; font-size: 14px; font-weight: 700; color: white;
}
.tl-light.active { opacity: 1; }
.tl-light.red { background: var(--red); }
.tl-light.red.active { box-shadow: 0 0 24px var(--red); }
.tl-light.yellow { background: var(--yellow); }
.tl-light.yellow.active { box-shadow: 0 0 24px var(--yellow); }
.tl-light.green { background: var(--green); }
.tl-light.green.active { box-shadow: 0 0 24px var(--green); }

.semaforo-summary { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.summary-row { display: flex; align-items: flex-start; gap: 10px; }
.dot { flex-shrink: 0; width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; }
.dot.verde { background: var(--green); }
.dot.amarillo { background: var(--yellow); }
.dot.rojo { background: var(--red); }
.summary-row strong { font-size: 14px; display: block; }
.summary-row p { font-size: 12px; color: var(--gray-500); margin-top: 2px; }
.count-badge {
  flex-shrink: 0; padding: 4px 10px; border-radius: 99px; font-size: 13px; font-weight: 700; margin-left: auto;
}
.count-badge.verde { background: var(--green-light); color: var(--green-dark); }
.count-badge.amarillo { background: var(--yellow-light); color: #7A5800; }
.count-badge.rojo { background: var(--red-light); color: var(--red); }

/* Food grid */
.food-grid { display: flex; flex-direction: column; gap: 8px; }
.food-card {
  background: white; border-radius: var(--radius-md);
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer;
  border-left: 4px solid transparent;
  box-shadow: var(--shadow-sm);
  transition: all .15s;
}
.food-card:hover { transform: translateX(3px); box-shadow: var(--shadow-md); }
.food-card.verde { border-left-color: var(--green); }
.food-card.amarillo { border-left-color: var(--yellow); }
.food-card.rojo { border-left-color: var(--red); }

.food-status-dot { flex-shrink: 0; width: 10px; height: 10px; border-radius: 50%; }
.food-status-dot.verde { background: var(--green); }
.food-status-dot.amarillo { background: var(--yellow); }
.food-status-dot.rojo { background: var(--red); }

.food-info { flex: 1; min-width: 0; }
.food-name { display: block; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.food-group { display: block; font-size: 11px; color: var(--gray-400); margin-top: 2px; }
.food-kcal { font-size: 13px; font-weight: 700; color: var(--gray-600); white-space: nowrap; }
.food-kcal small { font-size: 10px; font-weight: 400; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; }
.pagination span { font-size: 14px; font-weight: 600; color: var(--gray-500); }

/* Empty */
.empty-state { text-align: center; padding: 40px; color: var(--gray-400); }
.empty-state span { font-size: 32px; display: block; margin-bottom: 8px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
}
.modal-card {
  background: white; width: 100%; max-width: 480px;
  border-radius: 24px 24px 0 0; padding: 24px;
  display: flex; flex-direction: column; gap: 14px;
  border-top: 4px solid transparent;
  max-height: 90vh; overflow-y: auto;
}
.modal-card.verde { border-top-color: var(--green); }
.modal-card.amarillo { border-top-color: var(--yellow); }
.modal-card.rojo { border-top-color: var(--red); }
.modal-close {
  align-self: flex-end; background: var(--gray-100); border: none;
  width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px;
}
.modal-status {
  padding: 8px 14px; border-radius: 99px; font-size: 13px; font-weight: 700; width: fit-content;
}
.modal-status.verde { background: var(--green-light); color: var(--green-dark); }
.modal-status.amarillo { background: var(--yellow-light); color: #7A5800; }
.modal-status.rojo { background: var(--red-light); color: var(--red); }
.modal-title { font-size: 20px; font-weight: 800; }
.modal-group { font-size: 13px; color: var(--gray-400); }
.nutrients-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.nutrient {
  background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.n-val { font-size: 18px; font-weight: 700; }
.n-lbl { font-size: 11px; color: var(--gray-400); }
.gluten-warn { background: var(--red-light); color: var(--red); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; }
.modal-serving { background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 14px; font-size: 14px; display: flex; align-items: center; gap: 8px; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: all .3s cubic-bezier(.4,0,.2,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }

/* No-profile */
.error-card { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 32px 24px; }


/* ═══════════════════════════════════════════════
   RESPONSIVE MÓVIL — solo afecta pantallas ≤ 480px
   El desktop queda 100% idéntico al original
   ═══════════════════════════════════════════════ */
@media (max-width: 480px) {

  /* Página */
  .semaforo-page {
    padding: 14px;
    gap: 12px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }

  /* Header */
  .semaforo-header h2 { font-size: 19px; }
  .semaforo-header p  { font-size: 12px; }

  /* Filtros: búsqueda arriba, select abajo (columna) */
  .filters-row {
    flex-direction: column;
    gap: 8px;
  }
  .select-small {
    flex: unset;
    width: 100%;
    /* font-size 16px evita el zoom automático de iOS al hacer focus */
    font-size: 16px;
  }
  /* Igual para el input de búsqueda */
  .search-input { font-size: 16px; }

  /* Pills de leyenda: más compactas */
  .legend-pill {
    flex-direction: column;
    gap: 4px;
    padding: 8px 4px;
    font-size: 11px;
  }
  .legend-pill .pill-dot { width: 8px; height: 8px; }
  .pill-count { font-size: 10px; padding: 1px 5px; }

  /* Semáforo visual:
     El semáforo queda igual pero más pequeño.
     El resumen pasa a columna debajo del semáforo. */
  .semaforo-visual {
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
  }
  /* Semáforo centrado horizontalmente */
  .traffic-light {
    display: flex;
    justify-content: center;
  }
  .tl-body {
    /* Horizontal en móvil: los 3 focos en fila */
    flex-direction: row;
    gap: 14px;
    padding: 14px 20px;
    border-radius: 99px;
  }
  .tl-light {
    width: 52px;
    height: 52px;
    font-size: 13px;
  }

  /* Resumen ocupa todo el ancho */
  .semaforo-summary { gap: 10px; }
  .summary-row strong { font-size: 13px; }
  .summary-row p { font-size: 11px; }
  .count-badge { font-size: 12px; padding: 3px 8px; }

  /* Cards de alimentos: target táctil más alto */
  .food-card {
    padding: 14px 12px;
    min-height: 56px;
    /* Sin hover translate en táctil */
    transition: background .12s;
  }
  .food-card:hover { transform: none; }
  .food-card:active { background: var(--gray-50); }
  .food-name { font-size: 13px; }
  .food-group { font-size: 10px; }
  .food-kcal { font-size: 12px; }

  /* Paginación: botones más grandes */
  .pagination { gap: 10px; }
  .pagination .btn { padding: 10px 16px; font-size: 13px; min-height: 44px; }
  .pagination span { font-size: 13px; }

  /* Modal: botón cerrar más grande, modal más alto */
  .modal-card {
    padding: 20px 18px;
    gap: 12px;
    max-height: 88dvh;
    /* Handle drag visual */
    padding-top: 0;
  }
  /* Handle visual tipo bottom-sheet */
  .modal-card::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--gray-200);
    margin: 14px auto 8px;
    flex-shrink: 0;
  }
  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 15px;
  }
  .modal-title { font-size: 18px; }
  .modal-status { font-size: 12px; padding: 7px 12px; }
  .n-val { font-size: 16px; }
  .n-lbl { font-size: 10px; }
  .nutrients-grid { gap: 7px; }
  .nutrient { padding: 10px 6px; }
  .modal-serving {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font-size: 13px;
  }

  /* Modal overlay con safe area para iPhone home bar */
  .modal-overlay {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>