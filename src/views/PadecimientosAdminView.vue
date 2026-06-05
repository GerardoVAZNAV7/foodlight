<template>
  <div class="padecimientos-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>🩺 Padecimientos</h2>
        <p>Gestiona las condiciones médicas disponibles en el sistema</p>
      </div>
      <button class="btn btn-primary" @click="abrirModal()">+ Nuevo padecimiento</button>
    </div>

    <div v-if="loading" class="loading-card card">
      <div class="spinner-lg"></div><p>Cargando padecimientos...</p>
    </div>

    <div v-else class="conds-grid">
      <div v-for="c in condiciones" :key="c.id" class="cond-card card">
        <div class="cond-header">
          <span class="cond-big-icon">{{ c.icono || '🩺' }}</span>
          <div class="cond-info">
            <h4>{{ c.nombre }}</h4>
            <code class="cond-clave">{{ c.clave }}</code>
          </div>
          <div class="cond-actions">
            <button class="icon-btn" @click="abrirModal(c)" title="Editar">✏️</button>
            <button class="icon-btn danger" @click="confirmDelete = c" title="Eliminar">🗑️</button>
          </div>
        </div>
        <p v-if="c.descripcion" class="cond-desc">{{ c.descripcion }}</p>

        <!-- Reglas del semáforo -->
        <div class="reglas-section">
          <div class="reglas-header">
            <span class="reglas-title">Reglas de semáforo</span>
            <button class="mini-btn" @click="abrirRegla(c)">+ Regla</button>
          </div>
          <div v-if="reglasPorCond[c.id]?.length" class="reglas-list">
            <div v-for="r in reglasPorCond[c.id]" :key="r.id" class="regla-item" :class="r.color">
              <span class="regla-dot" :class="r.color"></span>
              <span class="regla-campo">{{ r.campo_nutriente }}</span>
              <span class="regla-rango">
                {{ r.umbral_min ?? '—' }} → {{ r.umbral_max ?? '—' }}
              </span>
              <button class="mini-del" @click="eliminarRegla(r)">✕</button>
            </div>
          </div>
          <p v-else class="reglas-empty">Sin reglas definidas</p>
        </div>
      </div>

      <div v-if="!condiciones.length" class="empty-card">
        <span>🩺</span><p>Sin padecimientos registrados</p>
      </div>
    </div>

    <!-- ══ MODAL PADECIMIENTO ══ -->
    <transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-head">
            <h3>{{ modal.editando ? 'Editar padecimiento' : 'Nuevo padecimiento' }}</h3>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>
          <div class="form-body">
            <div class="form-grid">
              <div class="field span-2">
                <label>Nombre *</label>
                <input v-model="form.nombre" type="text" class="input" placeholder="Ej. Hipertensión arterial" />
              </div>
              <div class="field span-2">
                <label>Clave interna *</label>
                <input v-model="form.clave" type="text" class="input" placeholder="Ej. hipertension (sin espacios ni tildes)" />
                <span class="field-hint">Se usa en el código para identificar la condición. Solo letras, números y _</span>
              </div>
              <div class="field">
                <label>Ícono (emoji)</label>
                <input v-model="form.icono" type="text" class="input" placeholder="💊" maxlength="4" />
              </div>
              <div class="field span-2">
                <label>Descripción</label>
                <textarea v-model="form.descripcion" class="input textarea" rows="3"
                  placeholder="Descripción breve para el paciente…"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardando" @click="guardar">
              <span v-if="guardando" class="spinner-sm"></span>
              {{ guardando ? 'Guardando...' : modal.editando ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL REGLA SEMÁFORO ══ -->
    <transition name="modal">
      <div v-if="modalRegla.open" class="modal-overlay" @click.self="modalRegla.open = false">
        <div class="modal-card modal-sm">
          <div class="modal-head">
            <h3>Nueva regla — {{ modalRegla.condNombre }}</h3>
            <button class="modal-close" @click="modalRegla.open = false">✕</button>
          </div>
          <div class="form-body">
            <div class="form-grid">
              <div class="field span-2">
                <label>Campo nutriente *</label>
                <select v-model="reglaForm.campo_nutriente" class="input">
                  <option value="">Seleccionar…</option>
                  <option value="sodio_mg">Sodio (mg)</option>
                  <option value="azucar_g">Azúcar (g)</option>
                  <option value="indice_glucemico">Índice glucémico</option>
                  <option value="contiene_gluten">Contiene gluten</option>
                  <option value="energia_kcal">Energía (kcal)</option>
                  <option value="lipidos_g">Lípidos (g)</option>
                  <option value="colesterol_mg">Colesterol (mg)</option>
                </select>
              </div>
              <div class="field">
                <label>Color semáforo *</label>
                <select v-model="reglaForm.color" class="input">
                  <option value="">Seleccionar…</option>
                  <option value="verde">🟢 Verde</option>
                  <option value="amarillo">🟡 Amarillo</option>
                  <option value="rojo">🔴 Rojo</option>
                </select>
              </div>
              <div class="field">
                <label>Prioridad</label>
                <input v-model.number="reglaForm.prioridad" type="number" class="input" min="1" max="10" />
              </div>
              <div class="field">
                <label>Umbral mínimo</label>
                <input v-model.number="reglaForm.umbral_min" type="number" class="input" step="0.1" placeholder="Dejar vacío = sin mínimo" />
              </div>
              <div class="field">
                <label>Umbral máximo</label>
                <input v-model.number="reglaForm.umbral_max" type="number" class="input" step="0.1" placeholder="Dejar vacío = sin máximo" />
              </div>
              <div class="field span-2">
                <label>Descripción</label>
                <input v-model="reglaForm.descripcion" type="text" class="input" placeholder="Ej. Sodio alto para hipertensión" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="modalRegla.open = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="guardandoRegla" @click="guardarRegla">
              <span v-if="guardandoRegla" class="spinner-sm"></span>
              {{ guardandoRegla ? 'Guardando...' : 'Agregar regla' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal confirmar eliminación -->
    <transition name="modal">
      <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
        <div class="modal-card modal-sm">
          <h3>¿Eliminar padecimiento?</h3>
          <p>Esto eliminará <strong>{{ confirmDelete.nombre }}</strong> y todas sus reglas. Esta acción no se puede deshacer.</p>
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
const guardando = ref(false)
const guardandoRegla = ref(false)
const eliminando = ref(false)
const condiciones = ref([])
const reglas = ref([])
const confirmDelete = ref(null)

const modal = reactive({ open: false, editando: false, id: null })
const modalRegla = reactive({ open: false, condId: null, condNombre: '' })

const form = reactive({ nombre: '', clave: '', icono: '', descripcion: '' })
const reglaForm = reactive({
  campo_nutriente: '', color: '', umbral_min: null, umbral_max: null,
  descripcion: '', prioridad: 1,
})

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const reglasPorCond = computed(() => {
  const m = {}
  for (const r of reglas.value) {
    if (!m[r.condicion_id]) m[r.condicion_id] = []
    m[r.condicion_id].push(r)
  }
  return m
})

async function cargar() {
  loading.value = true
  const [{ data: conds }, { data: regs }] = await Promise.all([
    supabase.from('condiciones_medicas').select('*').order('nombre'),
    supabase.from('reglas_semaforo').select('*').order('prioridad'),
  ])
  condiciones.value = conds || []
  reglas.value = regs || []
  loading.value = false
}

function abrirModal(c = null) {
  Object.assign(form, { nombre: '', clave: '', icono: '', descripcion: '' })
  if (c) {
    form.nombre = c.nombre; form.clave = c.clave
    form.icono = c.icono || ''; form.descripcion = c.descripcion || ''
    modal.editando = true; modal.id = c.id
  } else {
    modal.editando = false; modal.id = null
  }
  modal.open = true
}

function cerrarModal() { modal.open = false }

async function guardar() {
  if (!form.nombre.trim() || !form.clave.trim()) {
    showToast('Nombre y clave son obligatorios.', 'error'); return
  }
  guardando.value = true
  showToast('Guardando...', 'loading')
  try {
    const payload = {
      nombre: form.nombre.trim(),
      clave: form.clave.trim().toLowerCase().replace(/\s+/g, '_'),
      icono: form.icono.trim() || null,
      descripcion: form.descripcion.trim() || null,
    }
    let error
    if (modal.editando) {
      ;({ error } = await supabase.from('condiciones_medicas').update(payload).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('condiciones_medicas').insert(payload))
    }
    if (error) throw error
    showToast(modal.editando ? 'Padecimiento actualizado ✅' : 'Padecimiento creado ✅', 'success')
    cerrarModal()
    cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardando.value = false
  }
}

async function confirmarEliminar() {
  if (!confirmDelete.value) return
  eliminando.value = true
  try {
    const { error } = await supabase.from('condiciones_medicas').delete().eq('id', confirmDelete.value.id)
    if (error) throw error
    showToast('Padecimiento eliminado', 'info')
    confirmDelete.value = null
    cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    eliminando.value = false
  }
}

function abrirRegla(cond) {
  Object.assign(reglaForm, { campo_nutriente: '', color: '', umbral_min: null, umbral_max: null, descripcion: '', prioridad: 1 })
  modalRegla.condId = cond.id
  modalRegla.condNombre = cond.nombre
  modalRegla.open = true
}

async function guardarRegla() {
  if (!reglaForm.campo_nutriente || !reglaForm.color) {
    showToast('Campo y color son obligatorios.', 'error'); return
  }
  guardandoRegla.value = true
  showToast('Guardando regla...', 'loading')
  try {
    const { error } = await supabase.from('reglas_semaforo').insert({
      condicion_id: modalRegla.condId,
      campo_nutriente: reglaForm.campo_nutriente,
      color: reglaForm.color,
      umbral_min: reglaForm.umbral_min ?? null,
      umbral_max: reglaForm.umbral_max ?? null,
      descripcion: reglaForm.descripcion || null,
      prioridad: reglaForm.prioridad || 1,
    })
    if (error) throw error
    showToast('Regla agregada ✅', 'success')
    modalRegla.open = false
    cargar()
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardandoRegla.value = false
  }
}

async function eliminarRegla(r) {
  const { error } = await supabase.from('reglas_semaforo').delete().eq('id', r.id)
  if (!error) { showToast('Regla eliminada', 'info'); cargar() }
}

onMounted(cargar)
</script>

<style scoped>
.padecimientos-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.loading-card { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px; }
.spinner-lg { width: 40px; height: 40px; border: 4px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.conds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.cond-card { display: flex; flex-direction: column; gap: 12px; }

.cond-header { display: flex; align-items: flex-start; gap: 12px; }
.cond-big-icon { font-size: 32px; flex-shrink: 0; }
.cond-info { flex: 1; min-width: 0; }
.cond-info h4 { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.cond-clave { font-size: 11px; background: var(--bg-elevated); color: var(--text-muted); padding: 2px 7px; border-radius: 4px; font-family: monospace; }
.cond-actions { display: flex; gap: 6px; flex-shrink: 0; }
.cond-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

.reglas-section { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.reglas-header { display: flex; align-items: center; justify-content: space-between; }
.reglas-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.mini-btn { background: var(--green-light); color: var(--green-dark); border: none; border-radius: var(--radius-sm); padding: 4px 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background .15s; }
.mini-btn:hover { background: var(--green); color: white; }

.reglas-list { display: flex; flex-direction: column; gap: 6px; }
.regla-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: var(--radius-sm); border-left: 3px solid transparent; background: var(--bg-surface); font-size: 12px; }
.regla-item.verde    { border-left-color: var(--green); }
.regla-item.amarillo { border-left-color: var(--yellow); }
.regla-item.rojo     { border-left-color: var(--red); }
.regla-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.regla-dot.verde    { background: var(--green); }
.regla-dot.amarillo { background: var(--yellow); }
.regla-dot.rojo     { background: var(--red); }
.regla-campo { font-weight: 600; color: var(--text-primary); flex: 1; font-family: monospace; font-size: 11px; }
.regla-rango { color: var(--text-muted); font-size: 11px; }
.mini-del { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 11px; padding: 2px 5px; border-radius: 3px; transition: all .1s; }
.mini-del:hover { color: var(--red); background: var(--red-light); }
.reglas-empty { font-size: 12px; color: var(--text-muted); font-style: italic; }

.empty-card { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg); }
.empty-card span { font-size: 40px; }

.icon-btn { background: none; border: 1px solid var(--border-color); padding: 5px 8px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; transition: all .15s; }
.icon-btn:hover { background: var(--bg-elevated); }
.icon-btn.danger:hover { background: var(--red-light); border-color: var(--red); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-width: 500px; background: var(--bg-surface); border-radius: 24px 24px 0 0; display: flex; flex-direction: column; max-height: 92vh; }
.modal-sm { max-width: 400px; padding: 24px; gap: 16px; }
.modal-sm h3 { font-size: 18px; font-weight: 700; }
.modal-sm p { font-size: 14px; color: var(--text-secondary); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 0; }
.modal-head h3 { font-size: 18px; font-weight: 700; }
.modal-close { background: var(--bg-elevated); border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px; }
.form-body { overflow-y: auto; padding: 16px 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.span-2 { grid-column: 1 / -1; }
.field-hint { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
.textarea { resize: vertical; min-height: 80px; font-family: var(--font); }
.modal-footer { display: flex; gap: 10px; padding: 14px 20px 20px; border-top: 1px solid var(--border-light); }
.modal-footer .btn { flex: 1; }
.confirm-btns { display: flex; gap: 10px; }
.confirm-btns .btn { flex: 1; }
.btn-danger { background: var(--red); color: white; border: none; }
.btn-danger:hover { background: #d93749; }
.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
.modal-enter-active, .modal-leave-active { transition: opacity .3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>