<template>
  <div class="receta-alta-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <div class="page-header">
      <div>
        <h2>🍳 {{ editando ? 'Editar receta' : 'Nueva receta' }}</h2>
        <p>{{ editando ? 'Modifica los datos de la receta' : 'Crea una receta con ingredientes del catálogo' }}</p>
      </div>
      <router-link to="/esp/recetas" class="btn btn-secondary">← Volver</router-link>
    </div>

    <div class="form-layout">
      <!-- Columna izquierda: datos de la receta -->
      <div class="form-col">
        <div class="card form-card">
          <h3 class="section-title"><span>📝</span> Información general</h3>

          <div class="field">
            <label>Nombre de la receta *</label>
            <input v-model="form.nombre" type="text" class="input" placeholder="Ej. Ensalada de quinoa" />
          </div>

          <div class="field">
            <label>Descripción</label>
            <textarea v-model="form.descripcion" class="input textarea" rows="2" placeholder="Breve descripción…"></textarea>
          </div>

          <div class="form-row-3">
            <div class="field">
              <label>Tipo de comida</label>
              <select v-model="form.tipo_comida" class="input">
                <option value="desayuno">🌅 Desayuno</option>
                <option value="comida">☀️ Comida</option>
                <option value="cena">🌙 Cena</option>
                <option value="snack">🍎 Snack</option>
              </select>
            </div>
            <div class="field">
              <label>Porciones</label>
              <input v-model.number="form.porciones" type="number" class="input" min="1" max="50" />
            </div>
            <div class="field">
              <label>Tiempo (min)</label>
              <input v-model.number="form.tiempo_min" type="number" class="input" min="1" max="1440" />
            </div>
          </div>

          <div class="field">
              <label>Instrucciones</label>
              <textarea v-model="form.instrucciones" class="input textarea" rows="5"
                placeholder="1. Lava y corta los ingredientes.&#10;2. Mezcla en un bowl.&#10;3. Sirve y disfruta."></textarea>
            </div>

          <div class="field">
            <label>URL de imagen (opcional)</label>
            <input v-model="form.imagen_url" type="url" class="input" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>

          <label class="activa-label">
            <input type="checkbox" v-model="form.activa" />
            <span>✅ Receta activa (visible para pacientes)</span>
          </label>
        </div>

        <!-- Resumen nutricional -->
        <div v-if="ingredientes.length" class="card summary-card">
          <h3 class="section-title"><span>🥗</span> Resumen nutricional (por porción)</h3>
          <div class="nutri-grid">
            <div class="nutri-item"><span class="nutri-val">{{ resumen.kcal }}</span><span class="nutri-lbl">kcal</span></div>
            <div class="nutri-item"><span class="nutri-val">{{ resumen.proteinas }}g</span><span class="nutri-lbl">Proteína</span></div>
            <div class="nutri-item"><span class="nutri-val">{{ resumen.carbs }}g</span><span class="nutri-lbl">Carbohidratos</span></div>
            <div class="nutri-item"><span class="nutri-val">{{ resumen.grasas }}g</span><span class="nutri-lbl">Grasas</span></div>
            <div class="nutri-item"><span class="nutri-val">{{ resumen.fibra }}g</span><span class="nutri-lbl">Fibra</span></div>
            <div class="nutri-item"><span class="nutri-val">{{ resumen.sodio }}mg</span><span class="nutri-lbl">Sodio</span></div>
          </div>
          <p class="nutri-note">* Valores calculados automáticamente desde los ingredientes</p>
        </div>
      </div>

      <!-- Columna derecha: ingredientes -->
      <div class="form-col">
        <div class="card ingredientes-card">
          <div class="ing-header">
            <h3 class="section-title"><span>🛒</span> Ingredientes</h3>
            <button class="btn btn-outline btn-sm" @click="abrirSelector">+ Agregar</button>
          </div>

          <div v-if="!ingredientes.length" class="empty-ing">
            <span class="empty-icon">🍽️</span>
            <p>No hay ingredientes aún. Agrega alimentos del catálogo.</p>
          </div>

          <div v-else class="ing-list">
            <div v-for="(ing, i) in ingredientes" :key="i" class="ing-row" :class="ingColor(ing)">
              <span class="ing-color-dot" :class="ingColor(ing)"></span>
              <div class="ing-info">
                <span class="ing-nombre">{{ ing._alimento?.nombre || ing.alimento_nombre }}</span>
                <span class="ing-nutri">{{ ing._kcal }} kcal | {{ ing._prot }}g prot</span>
              </div>
              <div class="ing-qty-group">
                <input v-model.number="ing.cantidad" type="number" class="input input-xs" min="1" step="10" @input="recalcular" />
                <select v-model="ing.unidad" class="input input-xs input-unit">
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pz">pz</option>
                  <option value="taza">taza</option>
                  <option value="cda">cda</option>
                  <option value="cdta">cdta</option>
                  <option value="al gusto">al gusto</option>
                </select>
              </div>
              <button class="ing-remove" @click="quitarIngrediente(i)" title="Quitar">✕</button>
            </div>
          </div>
        </div>

        <!-- Botón guardar -->
        <button class="btn btn-primary btn-full btn-save" :disabled="guardando" @click="guardar">
          <span v-if="guardando" class="spinner-sm"></span>
          {{ guardando ? 'Guardando...' : editando ? '💾 Actualizar receta' : '💾 Crear receta' }}
        </button>
      </div>
    </div>

    <!-- Modal selector de ingredientes -->
    <transition name="modal">
      <div v-if="selectorOpen" class="modal-overlay" @click.self="selectorOpen = false">
        <div class="modal-card modal-selector">
          <div class="modal-head">
            <h3>Agregar ingrediente</h3>
            <button class="modal-close" @click="selectorOpen = false">✕</button>
          </div>
          <div class="modal-body">
            <input v-model="busquedaAlimento" type="search" class="input" placeholder="🔍 Buscar alimento…" ref="searchInput" />

            <div v-if="alimentosFiltrados.length" class="alimento-list">
              <button
                v-for="a in alimentosFiltrados" :key="a.id"
                class="alimento-item"
                :class="{ seleccionado: alimentoSeleccionado?.id === a.id }"
                @click="seleccionarAlimento(a)"
              >
                <div class="ai-info">
                  <span class="ai-nombre">{{ a.nombre }}</span>
                  <span class="ai-grupo">{{ a._grupo_nombre }}</span>
                </div>
                <div class="ai-nutri">
                  <span>{{ a.energia_kcal || 0 }} kcal</span>
                  <span>{{ a.proteina_g || 0 }}g prot</span>
                </div>
              </button>
            </div>
            <div v-else class="empty-ing">
              <p>{{ busquedaAlimento ? 'Sin resultados' : 'Cargando alimentos...' }}</p>
            </div>

            <div v-if="alimentoSeleccionado" class="selector-footer">
              <div class="sf-row">
                <div class="field">
                  <label>Cantidad (en gramos)</label>
                  <input v-model.number="cantidadAgregar" type="number" class="input" min="1" step="10" placeholder="100" />
                </div>
                <div class="field">
                  <label>Unidad</label>
                  <select v-model="unidadAgregar" class="input">
                    <option value="g">gramos (g)</option>
                    <option value="ml">mililitros (ml)</option>
                    <option value="pz">pieza(s)</option>
                    <option value="taza">taza(s)</option>
                    <option value="cda">cucharada(s)</option>
                    <option value="cdta">cucharadita(s)</option>
                    <option value="al gusto">al gusto</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary btn-full" @click="agregarAlimento">
                + Agregar a la receta
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const route = useRoute()
const router = useRouter()
const store = useUserStore()
const toast = reactive({ show: false, message: '', type: 'success' })

const editando = ref(false)
const recetaId = ref(null)
const guardando = ref(false)
const selectorOpen = ref(false)
const busquedaAlimento = ref('')
const searchInput = ref(null)
const cantidadAgregar = ref(100)
const unidadAgregar = ref('g')
const alimentoSeleccionado = ref(null)

const todosAlimentos = ref([])
const gruposAlimentos = ref([])

const form = reactive({
  nombre: '',
  descripcion: '',
  tipo_comida: 'comida',
  porciones: 1,
  tiempo_min: 15,
  instrucciones: '',
  imagen_url: '',
  activa: true,
})

const ingredientes = reactive([])

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

const alimentosFiltrados = computed(() => {
  if (!busquedaAlimento.value) return todosAlimentos.value.slice(0, 30)
  const q = busquedaAlimento.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return todosAlimentos.value.filter(a =>
    a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
  ).slice(0, 30)
})

// ── Calcular resumen nutricional ──
const resumen = computed(() => {
  const porciones = form.porciones || 1
  let kcal = 0, prot = 0, carbs = 0, grasas = 0, fibra = 0, sodio = 0
  for (const ing of ingredientes) {
    kcal  += ing._kcal || 0
    prot  += ing._prot || 0
    carbs += ing._carbs || 0
    grasas += ing._grasas || 0
    fibra += ing._fibra || 0
    sodio += ing._sodio || 0
  }
  return {
    kcal: Math.round(kcal / porciones),
    proteinas: Math.round(prot / porciones),
    carbs: Math.round(carbs / porciones),
    grasas: Math.round(grasas / porciones),
    fibra: Math.round(fibra / porciones),
    sodio: Math.round(sodio / porciones),
  }
})

function recalcular() {
  for (const ing of ingredientes) {
    const a = ing._alimento
    if (!a) continue
    const factor = (ing.cantidad || 0) / 100
    ing._kcal  = Math.round((a.energia_kcal || 0) * factor)
    ing._prot  = Math.round((a.proteina_g || 0) * factor * 10) / 10
    ing._carbs = Math.round((a.hidratos_carbono_g || 0) * factor * 10) / 10
    ing._grasas = Math.round((a.lipidos_g || 0) * factor * 10) / 10
    ing._fibra = Math.round((a.fibra_g || 0) * factor * 10) / 10
    ing._sodio = Math.round((a.sodio_mg || 0) * factor * 10) / 10
  }
}

function ingColor(ing) {
  if (!ing._alimento) return 'verde'
  const conds = store.profile?.condiciones || {}
  if (!Object.keys(conds).length) return 'verde'
  // Clasificación simple para mostrar
  if (conds.celiaquía && ing._alimento.contiene_gluten) return 'rojo'
  if (conds.hipertension && ing._alimento.sodio_mg > 400) return 'rojo'
  if (conds.hipertension && ing._alimento.sodio_mg > 150) return 'amarillo'
  if (conds.diabetes_t2 && (ing._alimento.indice_glucemico > 70 || (ing._alimento.azucar_g || 0) > 15)) return 'rojo'
  if (conds.diabetes_t2 && (ing._alimento.indice_glucemico > 55 || (ing._alimento.azucar_g || 0) > 8)) return 'amarillo'
  return 'verde'
}

// ── Selector de ingredientes ──
async function abrirSelector() {
  selectorOpen.value = true
  busquedaAlimento.value = ''
  alimentoSeleccionado.value = null
  cantidadAgregar.value = 100
  unidadAgregar.value = 'g'
  await nextTick()
  searchInput.value?.focus()
}

function seleccionarAlimento(a) {
  alimentoSeleccionado.value = a
}

function agregarAlimento() {
  if (!alimentoSeleccionado.value) return
  const a = alimentoSeleccionado.value
  const factor = (cantidadAgregar.value || 100) / 100
  ingredientes.push({
    _alimento: a,
    alimento_id: a.id,
    alimento_nombre: a.nombre,
    cantidad: cantidadAgregar.value || 100,
    unidad: unidadAgregar.value,
    notas: a.nombre,
    _kcal: Math.round((a.energia_kcal || 0) * factor),
    _prot: Math.round((a.proteina_g || 0) * factor * 10) / 10,
    _carbs: Math.round((a.hidratos_carbono_g || 0) * factor * 10) / 10,
    _grasas: Math.round((a.lipidos_g || 0) * factor * 10) / 10,
    _fibra: Math.round((a.fibra_g || 0) * factor * 10) / 10,
    _sodio: Math.round((a.sodio_mg || 0) * factor * 10) / 10,
  })
  alimentoSeleccionado.value = null
  cantidadAgregar.value = 100
}

function quitarIngrediente(i) {
  ingredientes.splice(i, 1)
}

// ── Cargar datos iniciales ──
async function cargarAlimentos() {
  const [{ data: alis }, { data: grups }] = await Promise.all([
    supabase.from('alimentos').select('*').order('nombre'),
    supabase.from('grupos_alimentos').select('*').order('nombre'),
  ])
  gruposAlimentos.value = grups || []
  const grupoMap = Object.fromEntries((grups || []).map(g => [g.id, g.nombre]))
  todosAlimentos.value = (alis || []).map(a => ({
    ...a,
    _grupo_nombre: grupoMap[a.grupo_id] || '—',
  }))
}

async function cargarReceta(id) {
  const { data: rec } = await supabase.from('recetas').select('*').eq('id', id).single()
  if (!rec) return
  editando.value = true
  recetaId.value = rec.id
  form.nombre = rec.nombre || ''
  form.descripcion = rec.descripcion || ''
  form.tipo_comida = rec.tipo_comida || 'comida'
  form.porciones = rec.porciones || 1
  form.tiempo_min = rec.tiempo_min || 15
  form.instrucciones = rec.instrucciones || ''
  form.imagen_url = rec.imagen_url || ''
  form.activa = rec.activa !== false

  const { data: ings } = await supabase
    .from('receta_ingredientes')
    .select('*')
    .eq('receta_id', id)

  const ids = (ings || []).map(i => i.alimento_id)
  const { data: alis } = ids.length
    ? await supabase.from('alimentos').select('*').in('id', ids)
    : { data: [] }
  const alimMap = new Map((alis || []).map(a => [a.id, a]))

  for (const ing of ings || []) {
    const a = alimMap.get(ing.alimento_id)
    const factor = (ing.cantidad || 0) / 100
    ingredientes.push({
      _alimento: a || null,
      alimento_id: ing.alimento_id,
      alimento_nombre: a?.nombre || '',
      cantidad: ing.cantidad,
      unidad: ing.unidad || 'g',
      notas: ing.notas || a?.nombre || '',
      _kcal: a ? Math.round((a.energia_kcal || 0) * factor) : 0,
      _prot: a ? Math.round((a.proteina_g || 0) * factor * 10) / 10 : 0,
      _carbs: a ? Math.round((a.hidratos_carbono_g || 0) * factor * 10) / 10 : 0,
      _grasas: a ? Math.round((a.lipidos_g || 0) * factor * 10) / 10 : 0,
      _fibra: a ? Math.round((a.fibra_g || 0) * factor * 10) / 10 : 0,
      _sodio: a ? Math.round((a.sodio_mg || 0) * factor * 10) / 10 : 0,
    })
  }
}

// ── Guardar receta ──
async function guardar() {
  if (!form.nombre.trim()) { showToast('El nombre es obligatorio.', 'error'); return }
  if (!ingredientes.length) { showToast('Agrega al menos un ingrediente.', 'error'); return }
  guardando.value = true
  showToast('Guardando...', 'loading')
  try {
    const recetaPayload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo_comida: form.tipo_comida,
      porciones: form.porciones || 1,
      tiempo_min: form.tiempo_min || null,
      instrucciones: form.instrucciones.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
      activa: form.activa,
      updated_at: new Date().toISOString(),
    }

    let newId
    if (editando.value) {
      const { error } = await supabase.from('recetas').update(recetaPayload).eq('id', recetaId.value)
      if (error) throw error
      newId = recetaId.value
      await supabase.from('receta_ingredientes').delete().eq('receta_id', newId)
    } else {
      const { data, error } = await supabase.from('recetas').insert(recetaPayload).select('id').single()
      if (error) throw error
      newId = data.id
    }

    const ingRows = ingredientes.map(ing => ({
      receta_id: newId,
      alimento_id: ing.alimento_id,
      cantidad: ing.cantidad || 100,
      unidad: ing.unidad || 'g',
      notas: ing.notas || null,
    }))
    const { error: ingErr } = await supabase.from('receta_ingredientes').insert(ingRows)
    if (ingErr) throw ingErr

    showToast(editando.value ? 'Receta actualizada ✅' : 'Receta creada ✅', 'success')
    router.push('/esp/recetas')
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  await cargarAlimentos()
  if (route.params.id) {
    await cargarReceta(route.params.id)
  }
})
</script>

<style scoped>
.receta-alta-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 960px; margin: 0 auto; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-header h2 { font-size: 22px; font-weight: 800; }
.page-header p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.form-col { display: flex; flex-direction: column; gap: 16px; }

.form-card, .ingredientes-card, .summary-card { display: flex; flex-direction: column; gap: 14px; }
.section-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-primary); }

.form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.textarea { resize: vertical; min-height: 80px; font-family: var(--font); }

.activa-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-secondary); padding: 8px 0; }
.activa-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--green); cursor: pointer; }

/* ── Resumen nutricional ── */
.nutri-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.nutri-item { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.nutri-val { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.nutri-lbl { font-size: 10px; color: var(--text-muted); }
.nutri-note { font-size: 11px; color: var(--text-muted); font-style: italic; }

/* ── Ingredientes ── */
.ing-header { display: flex; align-items: center; justify-content: space-between; }
.btn-sm { padding: 8px 16px; font-size: 13px; }

.empty-ing { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; text-align: center; }
.empty-icon { font-size: 36px; }
.empty-ing p { font-size: 13px; color: var(--text-muted); }

.ing-list { display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto; }
.ing-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
}
.ing-row.verde    { background: var(--green-light);  border-left-color: var(--green); }
.ing-row.amarillo { background: var(--yellow-light); border-left-color: var(--yellow); }
.ing-row.rojo     { background: var(--red-light);    border-left-color: var(--red); }
.ing-color-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.ing-color-dot.verde    { background: var(--green); }
.ing-color-dot.amarillo { background: var(--yellow); }
.ing-color-dot.rojo     { background: var(--red); }
.ing-info { flex: 1; min-width: 0; }
.ing-nombre { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ing-nutri { font-size: 10px; color: var(--text-muted); }
.ing-qty-group { display: flex; gap: 4px; }
.input-xs { width: 70px; padding: 6px 8px; font-size: 12px; }
.input-unit { width: 65px; }
.ing-remove { background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text-muted); padding: 4px; }
.ing-remove:hover { color: var(--red); }

.btn-save { margin-top: 8px; }

/* ── Modal selector ── */
.modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-width: 560px; background: var(--bg-surface); border-radius: 24px 24px 0 0; display: flex; flex-direction: column; max-height: 92vh; }
.modal-selector { max-width: 520px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 0; }
.modal-head h3 { font-size: 18px; font-weight: 700; }
.modal-close { background: var(--bg-elevated); border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px; flex-shrink: 0; }
.modal-body { padding: 16px 20px 24px; display: flex; flex-direction: column; gap: 12px; }

.alimento-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
.alimento-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  background: var(--bg-elevated); border: 2px solid transparent;
  cursor: pointer; transition: all .15s; text-align: left; width: 100%;
}
.alimento-item:hover { border-color: var(--green); }
.alimento-item.seleccionado { border-color: var(--green); background: var(--green-light); }
.ai-nombre { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ai-grupo { font-size: 11px; color: var(--text-muted); }
.ai-nutri { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: 11px; color: var(--text-secondary); font-weight: 600; flex-shrink: 0; }

.selector-footer { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); }
.sf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: opacity .25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .form-layout { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr; }
  .nutri-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
