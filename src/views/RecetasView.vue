<template>
  <div class="recetas-page">

    <!-- Header -->
    <div class="recetas-header">
      <h2>Recetas para ti</h2>
      <p>Sugerencias basadas en tu perfil y semáforo</p>
    </div>

    <!-- Sin perfil -->
    <div v-if="!store.hasProfile" class="no-profile-card card">
      <div class="np-icon">🍽️</div>
      <h3>Completa tu perfil</h3>
      <p>Las recetas se generarán con base en tus datos y padecimientos.</p>
      <router-link to="/perfil" class="btn btn-primary">Ir a mi perfil</router-link>
    </div>

    <template v-else>
      <!-- Objetivo calórico -->
      <div class="caloric-target card">
        <div class="target-icon">🎯</div>
        <div class="target-info">
          <h4>Tu objetivo: <strong>{{ tdee }} kcal/día</strong></h4>
          <p>Estas recetas están optimizadas para cubrir tus necesidades</p>
        </div>
        <div class="target-badges">
          <span v-for="(val, key) in activeConditions" :key="key" class="badge badge-red">{{ condLabels[key] }}</span>
        </div>
      </div>

      <!-- Tabs de tipo de comida -->
      <div class="meal-tabs" role="tablist">
        <button
          v-for="m in mealTypes" :key="m.key"
          role="tab" :aria-selected="mealTab === m.key"
          class="meal-tab" :class="{ active: mealTab === m.key }"
          @click="switchTab(m.key)"
        >
          <span>{{ m.icon }}</span>
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- Estado de carga -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando recetas…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state card">
        <span>⚠️</span>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadRecetas(mealTab)">Reintentar</button>
      </div>

      <!-- Sin recetas para esta categoría -->
      <div v-else-if="recetas.length === 0" class="empty-state card">
        <span>🍽️</span>
        <p>No hay recetas disponibles para esta categoría.</p>
        <small v-if="hasActiveConditions" class="empty-hint">
          Algunas recetas fueron ocultadas porque contienen ingredientes que debes evitar según tu perfil.
        </small>
      </div>

      <template v-else>
        <!-- Sección favoritas (solo si hay alguna en esta categoría) -->
        <div v-if="recetasFavoritas.length" class="section-block">
          <div class="section-label">
            <span class="section-label-icon">❤️</span>
            <span>Mis favoritas</span>
          </div>
          <div class="recipe-grid">
            <div
              v-for="recipe in recetasFavoritas" :key="'fav-' + recipe.id"
              class="recipe-card card"
              @click="openRecipe(recipe)"
            >
              <div class="recipe-img">
                <img v-if="recipe.imagen_url" :src="recipe.imagen_url" :alt="recipe.nombre"
                  class="recipe-photo" @error="onImgError($event)" />
                <div v-else class="recipe-img-fallback"><span>{{ currentMeal.icon }}</span></div>
                <!-- Botón favorito -->
                <button
                  class="fav-btn fav-btn-img"
                  :class="{ active: favoritosIds.has(recipe.id) }"
                  @click.stop="toggleFavorito(recipe)"
                  :title="favoritosIds.has(recipe.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                >{{ favoritosIds.has(recipe.id) ? '❤️' : '🤍' }}</button>
              </div>
              <div class="recipe-body">
                <h4 class="recipe-name">{{ recipe.nombre }}</h4>
                <p class="recipe-desc">{{ recipe.descripcion }}</p>
                <div class="recipe-meta">
                  <span class="meta-item">⏱ {{ recipe.tiempo_min }} min</span>
                  <span class="meta-item">👤 {{ recipe.porciones }} porciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Todas las recetas -->
        <div class="section-block">
          <div v-if="recetasFavoritas.length" class="section-label">
            <span class="section-label-icon">🍽️</span>
            <span>Todas las recetas</span>
          </div>
          <div class="recipe-grid">
            <div
              v-for="recipe in recetas" :key="recipe.id"
              class="recipe-card card"
              @click="openRecipe(recipe)"
            >
              <div class="recipe-img">
                <img v-if="recipe.imagen_url" :src="recipe.imagen_url" :alt="recipe.nombre"
                  class="recipe-photo" @error="onImgError($event)" />
                <div v-else class="recipe-img-fallback"><span>{{ currentMeal.icon }}</span></div>
                <!-- Botón favorito -->
                <button
                  class="fav-btn fav-btn-img"
                  :class="{ active: favoritosIds.has(recipe.id) }"
                  @click.stop="toggleFavorito(recipe)"
                  :title="favoritosIds.has(recipe.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                >{{ favoritosIds.has(recipe.id) ? '❤️' : '🤍' }}</button>
              </div>
              <div class="recipe-body">
                <h4 class="recipe-name">{{ recipe.nombre }}</h4>
                <p class="recipe-desc">{{ recipe.descripcion }}</p>
                <div class="recipe-meta">
                  <span class="meta-item">⏱ {{ recipe.tiempo_min }} min</span>
                  <span class="meta-item">👤 {{ recipe.porciones }} porciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Modal detalle de receta -->
    <transition name="modal">
      <div v-if="selectedRecipe" class="modal-overlay" @click.self="selectedRecipe = null">
        <div class="modal-card">

          <div class="modal-img-wrap">
            <img v-if="selectedRecipe.imagen_url" :src="selectedRecipe.imagen_url"
              :alt="selectedRecipe.nombre" class="modal-photo" @error="onImgError($event)" />
            <div v-else class="modal-img-fallback"><span>{{ currentMeal.icon }}</span></div>
            <button class="modal-close" @click="selectedRecipe = null">✕</button>
            <!-- Favorito en modal -->
            <button
              class="fav-btn fav-btn-modal"
              :class="{ active: favoritosIds.has(selectedRecipe.id) }"
              @click.stop="toggleFavorito(selectedRecipe)"
              :title="favoritosIds.has(selectedRecipe.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            >
              {{ favoritosIds.has(selectedRecipe.id) ? '❤️' : '🤍' }}
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-title-row">
              <h3>{{ selectedRecipe.nombre }}</h3>
            </div>
            <p class="modal-desc">{{ selectedRecipe.descripcion }}</p>

            <div class="modal-meta">
              <div class="meta-stat">
                <span>⏱</span>
                <strong>{{ selectedRecipe.tiempo_min }} min</strong>
                <small>Tiempo</small>
              </div>
              <div class="meta-stat">
                <span>👤</span>
                <strong>{{ selectedRecipe.porciones }}</strong>
                <small>Porciones</small>
              </div>
            </div>

            <!-- Ingredientes con color semáforo -->
            <div v-if="selectedRecipe.ingredientes?.length" class="modal-section">
              <h5>🛒 Ingredientes</h5>
              <ul class="ingredient-list">
                <li
                  v-for="ing in selectedRecipe.ingredientes"
                  :key="ing.id"
                  class="ingredient-item"
                  :class="ingColor(ing)"
                >
                  <span class="ing-color-dot" :class="ingColor(ing)"></span>
                  <span class="ing-qty">{{ ing.cantidad }} {{ ing.unidad }}</span>
                  <span class="ing-name">{{ ing.notas || ing.alimento_nombre || '' }}</span>
                </li>
              </ul>
            </div>

            <!-- Instrucciones -->
            <div v-if="selectedRecipe.instrucciones" class="modal-section">
              <h5>👨‍🍳 Preparación</h5>
              <ol class="steps-list">
                <li v-for="(step, i) in parsedSteps(selectedRecipe.instrucciones)" :key="i">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import { useFoodData } from '@/composables/useFoodData'

const store = useUserStore()
const { getAlimentos, clasificarAlimento } = useFoodData()

const mealTab       = ref('desayuno')
const selectedRecipe = ref(null)
const recetas       = ref([])
const loading       = ref(false)
const error         = ref(null)

// IDs de recetas favoritas del usuario (Set para O(1) lookup)
const favoritosIds  = ref(new Set())

// Mapa global de alimentos por nombre normalizado
const alimentoMap   = ref(new Map())

const condLabels = {
  celiaquía:    '🌾 Celiaquía',
  hipertensión: '💊 Hipertensión',
  diabetes:     '🩸 Diabetes',
}

const activeConditions = computed(() => {
  const c = store.profile?.condiciones || {}
  return Object.fromEntries(Object.entries(c).filter(([, v]) => v))
})
const hasActiveConditions = computed(() => Object.keys(activeConditions.value).length > 0)

const tdee = computed(() => {
  if (store.profile?.dieta?.kcal_objetivo) return store.profile.dieta.kcal_objetivo
  const { peso, estatura, edad, sexo } = store.profile || {}
  if (!peso || !estatura || !edad || !sexo) return 2000
  const tmb = sexo === 'M'
    ? Math.round(10 * peso + 6.25 * estatura - 5 * edad + 5)
    : Math.round(10 * peso + 6.25 * estatura - 5 * edad - 161)
  return Math.round(tmb * parseFloat(store.profile?.actividad || 1.375))
})

const mealTypes = [
  { key: 'desayuno', label: 'Desayuno', icon: '🌅' },
  { key: 'comida',   label: 'Comida',   icon: '☀️' },
  { key: 'cena',     label: 'Cena',     icon: '🌙' },
  { key: 'snack',    label: 'Snack',    icon: '🍎' },
]
const currentMeal = computed(() => mealTypes.find(m => m.key === mealTab.value) || mealTypes[0])

// Recetas favoritas filtradas por el tab actual
const recetasFavoritas = computed(() =>
  recetas.value.filter(r => favoritosIds.value.has(r.id))
)

// ── Normalizar ──────────────────────────────────────────────────────────────
function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// ── Color semáforo de un ingrediente ───────────────────────────────────────
function ingColor(ing) {
  if (!ing._alimento) return 'verde'
  return clasificarAlimento(ing._alimento, store.profile?.condiciones || {})
}

// ── ¿Receta tiene ingrediente rojo? ────────────────────────────────────────
function recetaTieneIngredienteRojo(ingredientes) {
  return ingredientes.some(ing => ing._alimento &&
    clasificarAlimento(ing._alimento, store.profile?.condiciones || {}) === 'rojo'
  )
}

// ── Cargar favoritos del usuario ────────────────────────────────────────────
async function loadFavoritos() {
  const userId = store.authUser?.id
  if (!userId) return
  const { data } = await supabase
    .from('favoritos_recetas')
    .select('receta_id')
    .eq('usuario_id', userId)
  favoritosIds.value = new Set((data || []).map(f => f.receta_id))
}

// ── Toggle favorito ─────────────────────────────────────────────────────────
async function toggleFavorito(recipe) {
  const userId = store.authUser?.id
  if (!userId) return
  const isFav = favoritosIds.value.has(recipe.id)

  // Optimistic update
  const newSet = new Set(favoritosIds.value)
  if (isFav) {
    newSet.delete(recipe.id)
    favoritosIds.value = newSet
    await supabase
      .from('favoritos_recetas')
      .delete()
      .eq('usuario_id', userId)
      .eq('receta_id', recipe.id)
  } else {
    newSet.add(recipe.id)
    favoritosIds.value = newSet
    await supabase
      .from('favoritos_recetas')
      .insert({ usuario_id: userId, receta_id: recipe.id })
  }
}

// ── Cargar recetas ──────────────────────────────────────────────────────────
async function loadRecetas(tipo) {
  loading.value = true
  error.value   = null
  recetas.value = []

  try {
    const { data: recetasData, error: recetasErr } = await supabase
      .from('recetas')
      .select('*')
      .eq('activa', true)
      .eq('tipo_comida', tipo)
      .order('id')

    if (recetasErr) throw recetasErr
    if (!recetasData?.length) return

    const ids = recetasData.map(r => r.id)
    const { data: ingredientesData, error: ingErr } = await supabase
      .from('receta_ingredientes')
      .select('*')
      .in('receta_id', ids)
      .order('id')

    if (ingErr) throw ingErr

    // Mapa de alimentos
    const alimentosDB = await getAlimentos()
    alimentoMap.value = new Map(alimentosDB.map(a => [normalizar(a.nombre), a]))

    // Enriquecer ingredientes con su alimento
    const ingEnriquecidos = (ingredientesData || []).map(ing => {
      const key     = normalizar(ing.alimento_nombre || ing.notas || '')
      const alimento = alimentoMap.value.get(key) || null
      return { ...ing, _alimento: alimento }
    })

    // Agrupar por receta
    const ingPorReceta = {}
    for (const ing of ingEnriquecidos) {
      if (!ingPorReceta[ing.receta_id]) ingPorReceta[ing.receta_id] = []
      ingPorReceta[ing.receta_id].push(ing)
    }

    const recetasCombinadas = recetasData.map(r => ({
      ...r,
      ingredientes: ingPorReceta[r.id] || [],
    }))

    if (hasActiveConditions.value) {
      recetas.value = recetasCombinadas.filter(r => !recetaTieneIngredienteRojo(r.ingredientes))
    } else {
      recetas.value = recetasCombinadas
    }

  } catch (e) {
    console.error('Error cargando recetas:', e)
    error.value = 'No se pudieron cargar las recetas. Verifica tu conexión.'
  } finally {
    loading.value = false
  }
}

function switchTab(tipo) {
  mealTab.value = tipo
  loadRecetas(tipo)
}

function openRecipe(recipe) { selectedRecipe.value = recipe }

function parsedSteps(instrucciones) {
  if (!instrucciones) return []
  return instrucciones.split(/\d+\.\s+/).map(s => s.trim()).filter(Boolean)
}

function onImgError(e) {
  e.target.style.display = 'none'
  const fallback = e.target.parentElement?.querySelector('.recipe-img-fallback, .modal-img-fallback')
  if (fallback) fallback.style.display = 'flex'
}

onMounted(async () => {
  if (store.hasProfile) {
    await loadFavoritos()
    loadRecetas(mealTab.value)
  }
})
</script>

<style scoped>
.recetas-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.recetas-header h2 { font-size: 22px; font-weight: 800; }
.recetas-header p  { font-size: 14px; color: var(--gray-500); margin-top: 4px; }

.no-profile-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.np-icon { font-size: 48px; }
.no-profile-card h3 { font-size: 18px; font-weight: 700; }
.no-profile-card p  { font-size: 14px; color: var(--gray-500); }

.caloric-target {
  display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
  border: 1px solid var(--green);
}
.target-icon { font-size: 32px; }
.target-info { flex: 1; }
.target-info h4 { font-size: 15px; font-weight: 600; }
.target-info p  { font-size: 12px; color: var(--gray-500); margin-top: 2px; }
.target-badges { display: flex; flex-wrap: wrap; gap: 6px; }

.meal-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.meal-tab {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 16px; border-radius: var(--radius-md);
  background: var(--gray-100); border: 2px solid transparent;
  font-size: 12px; font-weight: 600; color: var(--gray-500);
  cursor: pointer; flex-shrink: 0; transition: all .2s;
}
.meal-tab span:first-child { font-size: 20px; }
.meal-tab.active { background: white; border-color: var(--green); color: var(--green); box-shadow: var(--shadow-sm); }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: var(--gray-500); font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--green); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px; text-align: center; }
.error-state span { font-size: 32px; }
.error-state p { font-size: 14px; color: var(--gray-500); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; text-align: center; }
.empty-state span { font-size: 40px; }
.empty-state p { font-size: 14px; color: var(--gray-500); }
.empty-hint { font-size: 12px; color: var(--gray-400); line-height: 1.5; max-width: 280px; }

/* ── Secciones (Favoritas / Todas) ── */
.section-block { display: flex; flex-direction: column; gap: 12px; }

.section-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 800; color: var(--gray-700);
  padding-bottom: 2px;
  border-bottom: 2px solid var(--gray-100);
  padding-bottom: 8px;
}
.section-label-icon { font-size: 16px; }

/* ── Grid de recetas ── */
.recipe-grid { display: flex; flex-direction: column; gap: 14px; }
.recipe-card { padding: 0; overflow: hidden; cursor: pointer; transition: transform .2s, box-shadow .2s; }
.recipe-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.recipe-img { position: relative; width: 100%; height: 180px; overflow: hidden; background: var(--gray-100); }
.recipe-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.recipe-img-fallback {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light)); font-size: 52px;
}

/* ── Botón favorito ── */
.fav-btn {
  border: none; background: rgba(0,0,0,.30); backdrop-filter: blur(4px);
  border-radius: 50%; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px;
  transition: transform .2s, background .2s;
  line-height: 1;
}
.fav-btn:hover { transform: scale(1.15); background: rgba(0,0,0,.45); }
.fav-btn.active { background: rgba(255,255,255,.85); }

/* Posición sobre la imagen en cards */
.fav-btn-img {
  position: absolute; top: 12px; right: 12px; z-index: 2;
}
/* Posición sobre la imagen en modal (a la izquierda del close) */
.fav-btn-modal {
  position: absolute; top: 16px; right: 56px; z-index: 2;
}

.recipe-body   { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.recipe-name   { font-size: 17px; font-weight: 700; }
.recipe-desc   { font-size: 13px; color: var(--gray-500); line-height: 1.5; }
.recipe-meta   { display: flex; flex-wrap: wrap; gap: 10px; }
.meta-item     { font-size: 12px; font-weight: 600; color: var(--gray-500); }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.modal-card {
  width: 100%; max-width: 480px; margin: 0 auto;
  background: white; border-radius: 24px 24px 0 0;
  overflow: hidden; max-height: 92vh; overflow-y: auto;
}
.modal-img-wrap { position: relative; width: 100%; height: 220px; overflow: hidden; background: var(--gray-100); }
.modal-photo    { width: 100%; height: 100%; object-fit: cover; display: block; }
.modal-img-fallback {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light)); font-size: 64px;
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: rgba(0,0,0,.35); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}

.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.modal-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.modal-title-row h3 { font-size: 22px; font-weight: 800; flex: 1; }
.modal-desc { font-size: 14px; color: var(--gray-500); line-height: 1.6; }

.modal-meta {
  display: flex; justify-content: space-around;
  background: var(--gray-50); border-radius: var(--radius-md); padding: 16px;
}
.meta-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
.meta-stat span   { font-size: 20px; }
.meta-stat strong { font-size: 16px; font-weight: 700; }
.meta-stat small  { font-size: 11px; color: var(--gray-400); }

.modal-section { display: flex; flex-direction: column; gap: 10px; }
.modal-section h5 { font-size: 15px; font-weight: 700; }

/* ── Ingredientes con semáforo ── */
.ingredient-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.ingredient-item {
  display: flex; align-items: center; gap: 10px; font-size: 14px;
  padding: 8px 10px; border-radius: var(--radius-sm); border-left: 3px solid transparent;
}
.ingredient-item.verde    { background: var(--green-light);  border-left-color: var(--green); }
.ingredient-item.amarillo { background: var(--yellow-light); border-left-color: var(--yellow); }
.ingredient-item.rojo     { background: var(--red-light);    border-left-color: var(--red); }

.ing-color-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
.ing-color-dot.verde    { background: var(--green); }
.ing-color-dot.amarillo { background: var(--yellow); }
.ing-color-dot.rojo     { background: var(--red); }

.ing-qty { flex-shrink: 0; font-weight: 700; min-width: 60px; font-size: 12px; }
.ingredient-item.verde    .ing-qty { color: var(--green-dark); }
.ingredient-item.amarillo .ing-qty { color: #7A5800; }
.ingredient-item.rojo     .ing-qty { color: var(--red); }
.ing-name { color: var(--gray-700); line-height: 1.4; flex: 1; }

.steps-list { list-style: decimal; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.steps-list li { font-size: 14px; color: var(--gray-700); line-height: 1.5; }

.modal-enter-active, .modal-leave-active { transition: opacity .3s ease; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }
</style>