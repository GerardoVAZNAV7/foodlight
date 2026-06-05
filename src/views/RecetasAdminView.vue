<template>
  <div class="recetas-admin-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>🍽️ Recetas</h2>
        <p>Administra el catálogo de recetas</p>
      </div>
      <router-link to="/esp/recetas/nueva" class="btn btn-primary">+ Nueva receta</router-link>
    </div>

    <div class="filters-row">
      <input v-model="busqueda" type="search" class="input" placeholder="🔍 Buscar receta…" />
      <select v-model="filtroTipo" class="input select-sm">
        <option value="">Todos los tipos</option>
        <option value="desayuno">🌅 Desayuno</option>
        <option value="comida">☀️ Comida</option>
        <option value="cena">🌙 Cena</option>
        <option value="snack">🍎 Snack</option>
      </select>
    </div>

    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div><p>Cargando recetas...</p>
    </div>

    <div v-else-if="!recetasFiltradas.length" class="empty-card card">
      <div class="empty-icon">🍽️</div>
      <h3>{{ busqueda || filtroTipo ? 'Sin resultados' : 'Sin recetas registradas' }}</h3>
      <p>{{ busqueda || filtroTipo ? 'Prueba cambiando los filtros.' : 'Crea tu primera receta.' }}</p>
      <router-link v-if="!busqueda && !filtroTipo" to="/esp/recetas/nueva" class="btn btn-primary">+ Nueva receta</router-link>
    </div>

    <div v-else class="recetas-grid">
      <div v-for="r in recetasFiltradas" :key="r.id" class="receta-card card">
        <div class="rc-header">
          <div class="rc-icon">{{ mealIcon(r.tipo_comida) }}</div>
          <div class="rc-info">
            <h4>{{ r.nombre }}</h4>
            <span class="rc-meta">{{ r.tiempo_min ? `⏱ ${r.tiempo_min} min` : '' }} · {{ r.porciones }} porciones</span>
          </div>
          <div class="rc-badge" :class="r.activa ? 'activa' : 'inactiva'">
            {{ r.activa ? 'Activa' : 'Inactiva' }}
          </div>
        </div>
        <p v-if="r.descripcion" class="rc-desc">{{ r.descripcion }}</p>
        <div class="rc-actions">
          <router-link :to="`/esp/recetas/${r.id}`" class="rc-btn">✏️ Editar</router-link>
          <button class="rc-btn" @click="toggleActiva(r)">
            {{ r.activa ? '⏸ Pausar' : '▶ Activar' }}
          </button>
          <button class="rc-btn danger" @click="confirmDelete = r">🗑️ Eliminar</button>
        </div>
      </div>
    </div>

    <transition name="modal">
      <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
        <div class="modal-card modal-sm">
          <h3>¿Eliminar receta?</h3>
          <p>Esto eliminará <strong>{{ confirmDelete.nombre }}</strong> y sus ingredientes. Esta acción no se puede deshacer.</p>
          <div class="confirm-btns">
            <button class="btn btn-secondary" @click="confirmDelete = null">Cancelar</button>
            <button class="btn btn-danger" :disabled="eliminando" @click="confirmarEliminar">
              <span v-if="eliminando" class="spinner-sm"></span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const toast = reactive({ show: false, message: '', type: 'success' })
const loading = ref(false)
const eliminando = ref(false)
const recetas = ref([])
const busqueda = ref('')
const filtroTipo = ref('')
const confirmDelete = ref(null)

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const recetasFiltradas = computed(() => {
  let arr = recetas.value
  if (busqueda.value) arr = arr.filter(r => r.nombre.toLowerCase().includes(busqueda.value.toLowerCase()))
  if (filtroTipo.value) arr = arr.filter(r => r.tipo_comida === filtroTipo.value)
  return arr
})

function mealIcon(tipo) {
  return { desayuno: '🌅', comida: '☀️', cena: '🌙', snack: '🍎' }[tipo] || '🍽️'
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await supabase.from('recetas').select('*').order('nombre')
    recetas.value = data || []
  } catch (e) {
    showToast('Error al cargar recetas: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function toggleActiva(r) {
  const { error } = await supabase.from('recetas').update({ activa: !r.activa }).eq('id', r.id)
  if (!error) { showToast(r.activa ? 'Receta pausada' : 'Receta activada', 'info'); cargar() }
  else showToast('Error: ' + error.message, 'error')
}

async function confirmarEliminar() {
  if (!confirmDelete.value) return
  eliminando.value = true
  try {
    await supabase.from('receta_ingredientes').delete().eq('receta_id', confirmDelete.value.id)
    const { error } = await supabase.from('recetas').delete().eq('id', confirmDelete.value.id)
    if (error) throw error
    showToast('Receta eliminada', 'info')
    confirmDelete.value = null
    cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    eliminando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.recetas-admin-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.filters-row { display: flex; gap: 10px; }
.filters-row .input { flex: 1; }
.select-sm { flex: 0 0 180px; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); }

.recetas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.receta-card { display: flex; flex-direction: column; gap: 10px; }
.rc-header { display: flex; align-items: flex-start; gap: 10px; }
.rc-icon { font-size: 26px; flex-shrink: 0; }
.rc-info { flex: 1; min-width: 0; }
.rc-info h4 { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.rc-meta { font-size: 11px; color: var(--text-muted); }
.rc-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0; }
.rc-badge.activa   { background: var(--green-light); color: var(--green-dark); }
.rc-badge.inactiva { background: var(--gray-100); color: var(--gray-400); }
.rc-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.rc-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 10px; }
.rc-btn { flex: 1; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; color: var(--text-secondary); text-align: center; text-decoration: none; }
.rc-btn:hover { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }
.rc-btn.danger:hover { background: var(--red-light); border-color: var(--red); color: var(--red); }

.modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-width: 560px; background: var(--bg-surface); border-radius: 24px 24px 0 0; display: flex; flex-direction: column; max-height: 92vh; }
.modal-sm { max-width: 400px; padding: 24px; gap: 16px; border-radius: 24px 24px 0 0; }
.modal-sm h3 { font-size: 18px; font-weight: 700; }
.modal-sm p { font-size: 14px; color: var(--text-secondary); }
.confirm-btns { display: flex; gap: 10px; margin-top: 4px; }
.confirm-btns .btn { flex: 1; }
.btn-danger { background: var(--red); color: white; border: none; }
.btn-danger:hover { background: #d93749; }
.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
.modal-enter-active, .modal-leave-active { transition: opacity .3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .filters-row { flex-direction: column; }
  .select-sm { flex: unset; }
  .recetas-grid { grid-template-columns: 1fr; }
}
</style>
