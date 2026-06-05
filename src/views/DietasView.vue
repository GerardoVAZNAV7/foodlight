<template>
  <div class="dietas-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>🥗 Dietas</h2>
        <p>Crea y asigna planes de dieta a tus pacientes</p>
      </div>
      <button class="btn btn-primary" @click="abrirModal()">+ Nueva dieta</button>
    </div>

    <!-- Filtros -->
    <div class="filters-row">
      <input v-model="busqueda" type="search" class="input" placeholder="🔍 Buscar dieta por nombre…" />
      <select v-model="pacienteFiltro" class="input select-sm">
        <option value="">Todos los pacientes</option>
        <option v-for="p in pacientes" :key="p.id" :value="p.id">{{ p.nombre || p.id }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div><p>Cargando dietas...</p>
    </div>

    <div v-else-if="!dietasFiltradas.length" class="empty-card card">
      <div class="empty-icon">🥗</div>
      <h3>{{ busqueda || pacienteFiltro ? 'Sin resultados' : 'Sin dietas registradas' }}</h3>
      <p>{{ busqueda || pacienteFiltro ? 'Prueba cambiando los filtros.' : 'Crea tu primera dieta para asignarla a un paciente.' }}</p>
      <button v-if="!busqueda && !pacienteFiltro" class="btn btn-primary" @click="abrirModal()">+ Nueva dieta</button>
    </div>

    <div v-else class="dietas-grid">
      <div v-for="d in dietasFiltradas" :key="d.id" class="dieta-card card">
        <div class="dc-header">
          <div class="dc-icon">🥗</div>
          <div class="dc-info">
            <h4>{{ d.nombre }}</h4>
            <span class="dc-paciente">
              {{ d._paciente_nombre ? '👤 ' + d._paciente_nombre : '📋 Sin asignar' }}
            </span>
          </div>
          <div class="dc-badge" :class="d.activa ? 'activa' : 'inactiva'">
            {{ d.activa ? 'Activa' : 'Inactiva' }}
          </div>
        </div>

        <p v-if="d.descripcion" class="dc-desc">{{ d.descripcion }}</p>

        <div class="dc-stats">
          <div class="dc-stat">
            <span class="dc-stat-val">{{ d.kcal_objetivo ?? '—' }}</span>
            <span class="dc-stat-lbl">kcal/día</span>
          </div>
          <div class="dc-stat">
            <span class="dc-stat-val">{{ d.duracion_dias ?? '—' }}</span>
            <span class="dc-stat-lbl">días</span>
          </div>
          <div class="dc-stat">
            <span class="dc-stat-val">{{ d.prot_g ?? '—' }}g</span>
            <span class="dc-stat-lbl">proteína</span>
          </div>
          <div class="dc-stat">
            <span class="dc-stat-val">{{ d.carbs_g ?? '—' }}g</span>
            <span class="dc-stat-lbl">carbos</span>
          </div>
        </div>

        <div v-if="d.notas" class="dc-notas">
          <span>📝</span> {{ d.notas }}
        </div>

        <div class="dc-actions">
          <button class="dc-btn" @click="abrirModal(d)">✏️ Editar</button>
          <button class="dc-btn" @click="toggleActiva(d)">
            {{ d.activa ? '⏸ Pausar' : '▶ Activar' }}
          </button>
          <button class="dc-btn danger" @click="confirmDelete = d">🗑️ Eliminar</button>
        </div>
      </div>
    </div>

    <!-- ══ MODAL DIETA ══ -->
    <transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-head">
            <h3>{{ modal.editando ? 'Editar dieta' : 'Nueva dieta' }}</h3>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>

          <div class="form-scroll">
            <div class="form-grid">
              <div class="field span-2">
                <label>Nombre de la dieta *</label>
                <input v-model="form.nombre" type="text" class="input" placeholder="Ej. Dieta hipocalórica para diabetes" />
              </div>

              <div class="field span-2">
                <label>Asignar a paciente</label>
                <select v-model="form.paciente_id" class="input">
                  <option value="">— Sin asignar —</option>
                  <option v-for="p in pacientes" :key="p.id" :value="p.id">{{ p.nombre || p.id }}</option>
                </select>
              </div>

              <div class="field span-2">
                <label>Descripción</label>
                <textarea v-model="form.descripcion" class="input textarea" rows="3"
                  placeholder="Objetivo y enfoque de la dieta…"></textarea>
              </div>

              <div class="field">
                <label>kcal objetivo/día</label>
                <input v-model.number="form.kcal_objetivo" type="number" class="input" min="500" max="6000" step="50" />
              </div>
              <div class="field">
                <label>Duración (días)</label>
                <input v-model.number="form.duracion_dias" type="number" class="input" min="1" max="365" />
              </div>

              <div class="nutrient-section span-2">
                <p class="nutrient-title">🥗 Objetivos de macronutrientes por día</p>
              </div>

              <div class="field">
                <label>Proteína (g)</label>
                <input v-model.number="form.prot_g" type="number" class="input" min="0" step="5" />
              </div>
              <div class="field">
                <label>Carbohidratos (g)</label>
                <input v-model.number="form.carbs_g" type="number" class="input" min="0" step="5" />
              </div>
              <div class="field">
                <label>Grasas (g)</label>
                <input v-model.number="form.grasas_g" type="number" class="input" min="0" step="5" />
              </div>
              <div class="field">
                <label>Fibra (g)</label>
                <input v-model.number="form.fibra_g" type="number" class="input" min="0" step="1" />
              </div>

              <div class="field span-2">
                <label>Notas para el paciente</label>
                <textarea v-model="form.notas" class="input textarea" rows="3"
                  placeholder="Instrucciones especiales, alimentos a evitar, horarios…"></textarea>
              </div>

              <div class="field span-2 activa-field">
                <label class="activa-label">
                  <input type="checkbox" v-model="form.activa" />
                  <span>✅ Dieta activa</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardar">
              <span v-if="guardando" class="spinner-sm"></span>
              {{ guardando ? 'Guardando...' : modal.editando ? 'Actualizar' : 'Crear dieta' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal confirmar eliminación -->
    <transition name="modal">
      <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
        <div class="modal-card modal-sm">
          <h3>¿Eliminar dieta?</h3>
          <p>Esto eliminará <strong>{{ confirmDelete.nombre }}</strong>. Esta acción no se puede deshacer.</p>
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
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()
const toast = reactive({ show: false, message: '', type: 'success' })
const loading = ref(false)
const guardando = ref(false)
const eliminando = ref(false)
const dietas = ref([])
const pacientes = ref([])
const busqueda = ref('')
const pacienteFiltro = ref('')
const confirmDelete = ref(null)
const modal = reactive({ open: false, editando: false, id: null })

const formBase = () => ({
  nombre: '', descripcion: '', paciente_id: '',
  kcal_objetivo: null, duracion_dias: null,
  prot_g: null, carbs_g: null, grasas_g: null, fibra_g: null,
  notas: '', activa: true,
})
const form = reactive(formBase())

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const dietasFiltradas = computed(() => {
  let arr = dietas.value
  if (busqueda.value) arr = arr.filter(d => d.nombre.toLowerCase().includes(busqueda.value.toLowerCase()))
  if (pacienteFiltro.value) arr = arr.filter(d => d.paciente_id === pacienteFiltro.value)
  return arr
})

async function cargar() {
  loading.value = true
  const uid = store.authUser?.id
  try {
    const [{ data: dietasData }, { data: pacs }] = await Promise.all([
      supabase.from('dietas').select('*').eq('especialista_id', uid).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nombre').eq('especialista_id', uid).eq('especialista', false).order('nombre'),
    ])
    pacientes.value = pacs || []
    const pacMap = Object.fromEntries((pacs || []).map(p => [p.id, p.nombre]))
    dietas.value = (dietasData || []).map(d => ({
      ...d,
      _paciente_nombre: d.paciente_id ? (pacMap[d.paciente_id] || 'Paciente no encontrado') : null,
    }))
  } catch (e) {
    showToast('Error al cargar dietas: ' + e.message, 'error')
    dietas.value = []
    pacientes.value = []
  } finally {
    loading.value = false
  }
}

function abrirModal(d = null) {
  Object.assign(form, formBase())
  if (d) {
    Object.assign(form, {
      nombre:        d.nombre || '',
      descripcion:   d.descripcion || '',
      paciente_id:   d.paciente_id || '',
      kcal_objetivo: d.kcal_objetivo ?? null,
      duracion_dias: d.duracion_dias ?? null,
      prot_g:        d.prot_g ?? null,
      carbs_g:       d.carbs_g ?? null,
      grasas_g:      d.grasas_g ?? null,
      fibra_g:       d.fibra_g ?? null,
      notas:         d.notas || '',
      activa:        d.activa ?? true,
    })
    modal.editando = true; modal.id = d.id
  } else {
    modal.editando = false; modal.id = null
  }
  modal.open = true
}

function cerrarModal() { modal.open = false }

async function guardar() {
  if (!form.nombre.trim()) { showToast('El nombre es obligatorio.', 'error'); return }
  guardando.value = true
  showToast('Guardando...', 'loading')
  try {
    const payload = {
      ...form,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      notas: form.notas.trim() || null,
      paciente_id: form.paciente_id || null,
      especialista_id: store.authUser.id,
    }
    let error
    if (modal.editando) {
      ;({ error } = await supabase.from('dietas').update(payload).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('dietas').insert(payload))
    }
    if (error) throw error
    showToast(modal.editando ? 'Dieta actualizada ✅' : 'Dieta creada ✅', 'success')
    cerrarModal(); cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardando.value = false
  }
}

async function toggleActiva(d) {
  const { error } = await supabase.from('dietas').update({ activa: !d.activa }).eq('id', d.id)
  if (!error) { showToast(d.activa ? 'Dieta pausada' : 'Dieta activada', 'info'); cargar() }
  else showToast('Error: ' + error.message, 'error')
}

async function confirmarEliminar() {
  if (!confirmDelete.value) return
  eliminando.value = true
  try {
    const { error } = await supabase.from('dietas').delete().eq('id', confirmDelete.value.id)
    if (error) throw error
    showToast('Dieta eliminada', 'info'); confirmDelete.value = null; cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    eliminando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.dietas-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.filters-row { display: flex; gap: 10px; }
.filters-row .input { flex: 1; }
.select-sm { flex: 0 0 200px; font-size: 13px; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.empty-icon { font-size: 48px; }
.empty-card h3 { font-size: 18px; font-weight: 700; }
.empty-card p  { font-size: 14px; color: var(--text-secondary); }

.dietas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.dieta-card { display: flex; flex-direction: column; gap: 12px; }
.dc-header { display: flex; align-items: flex-start; gap: 12px; }
.dc-icon { font-size: 28px; flex-shrink: 0; }
.dc-info { flex: 1; min-width: 0; }
.dc-info h4 { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.dc-paciente { font-size: 12px; color: var(--text-muted); margin-top: 2px; display: block; }
.dc-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0; }
.dc-badge.activa   { background: var(--green-light); color: var(--green-dark); }
.dc-badge.inactiva { background: var(--gray-100);    color: var(--gray-400); }

.dc-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.dc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.dc-stat { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.dc-stat-val { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.dc-stat-lbl { font-size: 10px; color: var(--text-muted); }

.dc-notas { font-size: 12px; color: var(--text-muted); background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 8px 12px; display: flex; gap: 6px; }
.dc-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 10px; }
.dc-btn { flex: 1; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; color: var(--text-secondary); }
.dc-btn:hover { background: var(--green-light); border-color: var(--green); color: var(--green-dark); }
.dc-btn.danger:hover { background: var(--red-light); border-color: var(--red); color: var(--red); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-width: 560px; background: var(--bg-surface); border-radius: 24px 24px 0 0; display: flex; flex-direction: column; max-height: 92vh; }
.modal-sm { max-width: 400px; padding: 24px; gap: 16px; border-radius: 24px 24px 0 0; }
.modal-sm h3 { font-size: 18px; font-weight: 700; }
.modal-sm p { font-size: 14px; color: var(--text-secondary); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 0; }
.modal-head h3 { font-size: 18px; font-weight: 700; }
.modal-close { background: var(--bg-elevated); border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px; }
.form-scroll { overflow-y: auto; flex: 1; padding: 16px 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.span-2 { grid-column: 1 / -1; }
.textarea { resize: vertical; min-height: 80px; font-family: var(--font); }
.nutrient-section { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 12px; margin: 4px 0; }
.nutrient-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.activa-field { margin-top: 4px; }
.activa-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.activa-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--green); cursor: pointer; }
.modal-footer { display: flex; gap: 10px; padding: 14px 20px 20px; border-top: 1px solid var(--border-light); }
.modal-footer .btn { flex: 1; }
.confirm-btns { display: flex; gap: 10px; margin-top: 4px; }
.confirm-btns .btn { flex: 1; }
.btn-danger { background: var(--red); color: white; border: none; }
.btn-danger:hover { background: #d93749; }
.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
.modal-enter-active, .modal-leave-active { transition: opacity .3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@media (max-width: 600px) {
  .filters-row { flex-direction: column; }
  .select-sm { flex: unset; }
  .dietas-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: 1; }
}
</style>