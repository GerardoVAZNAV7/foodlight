<template>
  <div class="alimentos-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>🍎 Catálogo de Alimentos</h2>
        <p>Agrega, edita o elimina alimentos del catálogo global</p>
      </div>
      <button class="btn btn-primary" @click="abrirModal()">+ Nuevo alimento</button>
    </div>

    <!-- Búsqueda y filtro por grupo -->
    <div class="filters-row">
      <input v-model="busqueda" type="search" class="input" placeholder="🔍 Buscar alimento…" />
      <select v-model="grupoFiltro" class="input select-sm">
        <option value="">Todos los grupos</option>
        <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
      </select>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div><p>Cargando alimentos...</p>
    </div>

    <!-- Tabla de alimentos -->
    <div v-else class="tabla-wrap card">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Grupo</th>
            <th>kcal</th>
            <th>Sodio mg</th>
            <th>IG</th>
            <th>Gluten</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in alimentosFiltrados" :key="a.id">
            <td class="td-nombre">{{ a.nombre }}</td>
            <td class="td-grupo">{{ a.grupo_nombre }}</td>
            <td>{{ a.energia_kcal }}</td>
            <td>{{ a.sodio_mg ?? '—' }}</td>
            <td>{{ a.indice_glucemico ?? '—' }}</td>
            <td>
              <span :class="a.contiene_gluten ? 'badge-red' : 'badge-green'">
                {{ a.contiene_gluten ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="td-actions">
              <button class="icon-btn" @click="abrirModal(a)" title="Editar">✏️</button>
              <button class="icon-btn danger" @click="eliminar(a)" title="Eliminar">🗑️</button>
            </td>
          </tr>
          <tr v-if="!alimentosFiltrados.length">
            <td colspan="7" class="td-empty">Sin alimentos con ese criterio</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ MODAL NUEVO / EDITAR ALIMENTO ══ -->
    <transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-head">
            <h3>{{ modal.editando ? 'Editar alimento' : 'Nuevo alimento' }}</h3>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>

          <div class="form-scroll">
            <div class="form-grid">
              <div class="field span-2">
                <label>Nombre *</label>
                <input v-model="form.nombre" type="text" class="input" placeholder="Ej. Manzana roja" />
              </div>

              <div class="field span-2">
                <label>Grupo alimenticio *</label>
                <select v-model="form.grupo_id" class="input">
                  <option value="">Seleccionar grupo</option>
                  <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
                </select>
              </div>

              <div class="field">
                <label>Cantidad sugerida</label>
                <input v-model="form.cantidad_sugerida" type="text" class="input" placeholder="1 pieza" />
              </div>
              <div class="field">
                <label>Unidad</label>
                <input v-model="form.unidad" type="text" class="input" placeholder="pieza, g, ml…" />
              </div>

              <div class="field">
                <label>Peso bruto (g)</label>
                <input v-model.number="form.peso_bruto_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Peso neto (g)</label>
                <input v-model.number="form.peso_neto_g" type="number" class="input" min="0" step="0.1" />
              </div>

              <div class="nutrient-section span-2">
                <p class="nutrient-title">⚡ Macronutrientes (por porción)</p>
              </div>

              <div class="field">
                <label>Energía (kcal)</label>
                <input v-model.number="form.energia_kcal" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Proteína (g)</label>
                <input v-model.number="form.proteina_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Lípidos (g)</label>
                <input v-model.number="form.lipidos_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Hidratos de carbono (g)</label>
                <input v-model.number="form.hidratos_carbono_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Azúcar (g)</label>
                <input v-model.number="form.azucar_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Fibra (g)</label>
                <input v-model.number="form.fibra_g" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Sodio (mg)</label>
                <input v-model.number="form.sodio_mg" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Colesterol (mg)</label>
                <input v-model.number="form.colesterol_mg" type="number" class="input" min="0" step="0.1" />
              </div>
              <div class="field">
                <label>Índice glucémico</label>
                <input v-model.number="form.indice_glucemico" type="number" class="input" min="0" max="100" step="1" />
              </div>
              <div class="field">
                <label>Carga glucémica</label>
                <input v-model.number="form.carga_glucemica" type="number" class="input" min="0" step="0.1" />
              </div>

              <div class="field span-2 gluten-field">
                <label class="gluten-label">
                  <input type="checkbox" v-model="form.contiene_gluten" />
                  <span>🌾 Contiene gluten</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardar">
              <span v-if="guardando" class="spinner-sm"></span>
              {{ guardando ? 'Guardando...' : modal.editando ? 'Actualizar' : 'Crear alimento' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal confirmar eliminación -->
    <transition name="modal">
      <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
        <div class="modal-card modal-sm">
          <h3>¿Eliminar alimento?</h3>
          <p>Esto eliminará <strong>{{ confirmDelete.nombre }}</strong> del catálogo. Esta acción no se puede deshacer.</p>
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
const loading   = ref(false)
const guardando = ref(false)
const eliminando = ref(false)
const alimentos = ref([])
const grupos    = ref([])
const busqueda  = ref('')
const grupoFiltro = ref('')
const confirmDelete = ref(null)

const modal = reactive({ open: false, editando: false, id: null })

const formBase = () => ({
  nombre: '', grupo_id: '', cantidad_sugerida: '', unidad: '',
  peso_bruto_g: null, peso_neto_g: null,
  energia_kcal: null, proteina_g: null, lipidos_g: null,
  hidratos_carbono_g: null, azucar_g: null, fibra_g: null,
  sodio_mg: null, colesterol_mg: null,
  indice_glucemico: null, carga_glucemica: null,
  contiene_gluten: false,
})

const form = reactive(formBase())

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const alimentosFiltrados = computed(() => {
  let arr = alimentos.value
  if (busqueda.value) arr = arr.filter(a => a.nombre.toLowerCase().includes(busqueda.value.toLowerCase()))
  if (grupoFiltro.value) arr = arr.filter(a => a.grupo_id == grupoFiltro.value)
  return arr
})

async function cargar() {
  loading.value = true
  const [{ data: als }, { data: grps }] = await Promise.all([
    supabase.from('alimentos').select('*, grupos_alimentos(nombre)').order('nombre'),
    supabase.from('grupos_alimentos').select('*').order('nombre'),
  ])
  alimentos.value = (als || []).map(a => ({ ...a, grupo_nombre: a.grupos_alimentos?.nombre || '—' }))
  grupos.value = grps || []
  loading.value = false
}

function abrirModal(alimento = null) {
  Object.assign(form, formBase())
  if (alimento) {
    Object.assign(form, {
      nombre: alimento.nombre || '',
      grupo_id: alimento.grupo_id || '',
      cantidad_sugerida: alimento.cantidad_sugerida || '',
      unidad: alimento.unidad || '',
      peso_bruto_g: alimento.peso_bruto_g ?? null,
      peso_neto_g: alimento.peso_neto_g ?? null,
      energia_kcal: alimento.energia_kcal ?? null,
      proteina_g: alimento.proteina_g ?? null,
      lipidos_g: alimento.lipidos_g ?? null,
      hidratos_carbono_g: alimento.hidratos_carbono_g ?? null,
      azucar_g: alimento.azucar_g ?? null,
      fibra_g: alimento.fibra_g ?? null,
      sodio_mg: alimento.sodio_mg ?? null,
      colesterol_mg: alimento.colesterol_mg ?? null,
      indice_glucemico: alimento.indice_glucemico ?? null,
      carga_glucemica: alimento.carga_glucemica ?? null,
      contiene_gluten: alimento.contiene_gluten || false,
    })
    modal.editando = true
    modal.id = alimento.id
  } else {
    modal.editando = false
    modal.id = null
  }
  modal.open = true
}

function cerrarModal() { modal.open = false }

async function guardar() {
  if (!form.nombre.trim() || !form.grupo_id) {
    showToast('El nombre y grupo son obligatorios.', 'error'); return
  }
  guardando.value = true
  showToast('Guardando...', 'loading')
  try {
    const payload = { ...form, nombre: form.nombre.trim() }
    let error
    if (modal.editando) {
      ;({ error } = await supabase.from('alimentos').update(payload).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('alimentos').insert(payload))
    }
    if (error) throw error
    showToast(modal.editando ? 'Alimento actualizado ✅' : 'Alimento creado ✅', 'success')
    cerrarModal()
    cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardando.value = false
  }
}

function eliminar(a) { confirmDelete.value = a }

async function confirmarEliminar() {
  if (!confirmDelete.value) return
  eliminando.value = true
  try {
    const { error } = await supabase.from('alimentos').delete().eq('id', confirmDelete.value.id)
    if (error) throw error
    showToast('Alimento eliminado', 'info')
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
.alimentos-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.filters-row { display: flex; gap: 10px; }
.filters-row .input { flex: 1; }
.select-sm { flex: 0 0 180px; font-size: 13px; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.tabla-wrap { padding: 0; overflow-x: auto; }
.tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabla thead th { background: var(--bg-elevated); padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 2px solid var(--border-color); white-space: nowrap; }
.tabla tbody tr { border-bottom: 1px solid var(--border-light); transition: background .1s; }
.tabla tbody tr:hover { background: var(--bg-elevated); }
.tabla tbody td { padding: 11px 14px; color: var(--text-primary); }
.td-nombre { font-weight: 600; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-grupo { color: var(--text-muted); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-actions { display: flex; gap: 6px; justify-content: flex-end; }
.td-empty { text-align: center; padding: 32px; color: var(--text-muted); font-style: italic; }

.icon-btn { background: none; border: 1px solid var(--border-color); padding: 5px 10px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; transition: all .15s; }
.icon-btn:hover { background: var(--bg-elevated); }
.icon-btn.danger:hover { background: var(--red-light); border-color: var(--red); }

.badge-green { background: var(--green-light); color: var(--green-dark); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.badge-red   { background: var(--red-light);   color: var(--red);        font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }

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

.nutrient-section { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 12px; margin: 4px 0; }
.nutrient-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); }

.gluten-field { margin-top: 4px; }
.gluten-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.gluten-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--green); cursor: pointer; }

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
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: 1; }
}
</style>