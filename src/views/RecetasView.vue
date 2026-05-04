<template>
  <div class="recetas-page">
    <!-- Header -->
    <div class="recetas-header">
      <h2>Recetas para ti</h2>
      <p>Sugerencias basadas en tu perfil y semáforo</p>
    </div>

    <!-- No profile -->
    <div v-if="!store.hasProfile" class="no-profile-card card">
      <div class="np-icon">🍽️</div>
      <h3>Completa tu perfil</h3>
      <p>Las recetas se generarán con base en tus datos y padecimientos.</p>
      <router-link to="/perfil" class="btn btn-primary">Ir a mi perfil</router-link>
    </div>

    <template v-else>
      <!-- Caloric target -->
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

      <!-- Meal type tabs -->
      <div class="meal-tabs" role="tablist">
        <button
          v-for="m in mealTypes" :key="m.key"
          role="tab" :aria-selected="mealTab === m.key"
          class="meal-tab" :class="{ active: mealTab === m.key }"
          @click="mealTab = m.key"
        >
          <span>{{ m.icon }}</span>
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- COMING SOON overlay note -->
      <div class="coming-soon-bar">
        <span>🚀</span>
        <p>En producción, las recetas se generarán con IA usando tus datos y la base de alimentos de Supabase.</p>
      </div>

      <!-- Recipe cards (mock data) -->
      <div class="recipe-grid">
        <div
          v-for="recipe in filteredRecipes" :key="recipe.id"
          class="recipe-card card"
          @click="selectedRecipe = recipe"
        >
          <div class="recipe-img" :style="{ background: recipe.color }">
            <span class="recipe-emoji">{{ recipe.emoji }}</span>
            <div class="recipe-badges">
              <span v-for="b in recipe.badges" :key="b" class="r-badge">{{ b }}</span>
            </div>
          </div>
          <div class="recipe-body">
            <h4 class="recipe-name">{{ recipe.name }}</h4>
            <p class="recipe-desc">{{ recipe.desc }}</p>
            <div class="recipe-meta">
              <span class="meta-item">⏱ {{ recipe.time }} min</span>
              <span class="meta-item">🔥 {{ recipe.kcal }} kcal</span>
              <span class="meta-item">👤 {{ recipe.porciones }} porciones</span>
            </div>
            <div class="nutrients-mini">
              <div class="nm-item" v-for="n in recipe.nutrients" :key="n.label">
                <div class="nm-bar" :style="{ width: n.pct + '%', background: n.color }"></div>
                <span>{{ n.label }} {{ n.val }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Supabase note -->
      <div class="supabase-note card">
        <div class="supa-header">
          <span>⚡</span>
          <h4>Versión de producción</h4>
        </div>
        <p>Las recetas se cargarán desde <strong>Supabase</strong> filtrando por:</p>
        <ul class="supa-list">
          <li>✅ Ingredientes en semáforo verde/amarillo para tu perfil</li>
          <li>✅ Calorías cercanas a tu TDEE ({{ tdee }} kcal)</li>
          <li>✅ Exclusión de alérgenos según padecimientos</li>
          <li>✅ Distribución de macronutrimentos personalizada</li>
        </ul>
      </div>
    </template>

    <!-- Recipe detail modal -->
    <transition name="modal">
      <div v-if="selectedRecipe" class="modal-overlay" @click.self="selectedRecipe = null">
        <div class="modal-card">
          <div class="modal-img" :style="{ background: selectedRecipe.color }">
            <button class="modal-close" @click="selectedRecipe = null">✕</button>
            <span class="modal-emoji">{{ selectedRecipe.emoji }}</span>
          </div>
          <div class="modal-body">
            <h3>{{ selectedRecipe.name }}</h3>
            <p class="modal-desc">{{ selectedRecipe.desc }}</p>
            <div class="modal-meta">
              <div class="meta-stat"><span>⏱</span><strong>{{ selectedRecipe.time }} min</strong><small>Tiempo</small></div>
              <div class="meta-stat"><span>🔥</span><strong>{{ selectedRecipe.kcal }} kcal</strong><small>Por porción</small></div>
              <div class="meta-stat"><span>👤</span><strong>{{ selectedRecipe.porciones }}</strong><small>Porciones</small></div>
            </div>
            <div class="modal-section">
              <h5>🛒 Ingredientes</h5>
              <ul class="ingredient-list">
                <li v-for="ing in selectedRecipe.ingredients" :key="ing.name" class="ingredient-item">
                  <span class="ing-dot" :class="ing.status"></span>
                  <span>{{ ing.amount }} de {{ ing.name }}</span>
                  <span class="ing-status-label" :class="ing.status">{{ statusLabel(ing.status) }}</span>
                </li>
              </ul>
            </div>
            <div class="modal-section">
              <h5>👨‍🍳 Preparación</h5>
              <ol class="steps-list">
                <li v-for="(step, i) in selectedRecipe.steps" :key="i">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const mealTab = ref('desayuno')
const selectedRecipe = ref(null)

const condLabels = { celiaquía: '🌾 Celiaquía', hipertensión: '💊 Hipertensión', diabetes: '🩸 Diabetes' }
const activeConditions = computed(() => {
  const c = store.profile?.condiciones || {}
  return Object.fromEntries(Object.entries(c).filter(([, v]) => v))
})

const tmb = computed(() => {
  const { peso, estatura, edad, sexo } = store.profile || {}
  if (!peso || !estatura || !edad || !sexo) return 1800
  return sexo === 'M'
    ? Math.round(10 * peso + 6.25 * estatura - 5 * edad + 5)
    : Math.round(10 * peso + 6.25 * estatura - 5 * edad - 161)
})
const tdee = computed(() => Math.round(tmb.value * parseFloat(store.profile?.actividad || 1.375)))

const mealTypes = [
  { key: 'desayuno', label: 'Desayuno', icon: '🌅' },
  { key: 'comida', label: 'Comida', icon: '☀️' },
  { key: 'cena', label: 'Cena', icon: '🌙' },
  { key: 'snack', label: 'Snack', icon: '🍎' },
]

const statusLabel = (s) => ({ verde: 'Libre', amarillo: 'Moderar', rojo: 'Evitar' }[s] || '')

const allRecipes = [
  {
    id: 1, meal: 'desayuno', name: 'Avena con frutas y miel', emoji: '🥣',
    color: 'linear-gradient(135deg, #FFB800, #FF6B35)',
    desc: 'Tazón de avena cremosa con fresas, plátano y un toque de miel de abeja.',
    time: 10, kcal: 320, porciones: 1,
    badges: ['Sin gluten*', 'Alto en fibra'],
    nutrients: [
      { label: 'Prot', val: '12g', pct: 40, color: '#4361EE' },
      { label: 'Carbs', val: '52g', pct: 75, color: '#FFB800' },
      { label: 'Grasas', val: '6g', pct: 25, color: '#FF4757' },
    ],
    ingredients: [
      { name: 'Avena sin gluten', amount: '½ taza', status: 'verde' },
      { name: 'Fresas', amount: '½ taza', status: 'verde' },
      { name: 'Plátano', amount: '½ pieza', status: 'amarillo' },
      { name: 'Miel', amount: '1 cdita', status: 'amarillo' },
      { name: 'Leche descremada', amount: '1 taza', status: 'verde' },
    ],
    steps: [
      'Calienta la leche a fuego medio en una olla.',
      'Agrega la avena y cocina por 5 min, moviendo constantemente.',
      'Retira del fuego y vierte en un tazón.',
      'Añade las frutas y la miel. ¡Listo para servir!',
    ]
  },
  {
    id: 2, meal: 'comida', name: 'Ensalada de pollo a la plancha', emoji: '🥗',
    color: 'linear-gradient(135deg, #00C896, #4361EE)',
    desc: 'Pechuga de pollo a la plancha sobre cama de lechuga, jitomate y pepino, con aderezo de limón.',
    time: 20, kcal: 380, porciones: 2,
    badges: ['Sin gluten', 'Bajo en sodio', 'Bajo IG'],
    nutrients: [
      { label: 'Prot', val: '35g', pct: 85, color: '#4361EE' },
      { label: 'Carbs', val: '18g', pct: 35, color: '#FFB800' },
      { label: 'Grasas', val: '12g', pct: 40, color: '#FF4757' },
    ],
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g', status: 'verde' },
      { name: 'Lechuga romana', amount: '2 tazas', status: 'verde' },
      { name: 'Jitomate', amount: '1 pieza', status: 'verde' },
      { name: 'Pepino', amount: '½ pieza', status: 'verde' },
      { name: 'Aceite de oliva', amount: '1 cdita', status: 'amarillo' },
      { name: 'Limón', amount: '1 pieza', status: 'verde' },
    ],
    steps: [
      'Sazona el pollo con pimienta y ajo en polvo (sin sal extra).',
      'Cocina a la plancha 6 min por cada lado hasta dorar.',
      'Corta en tiras y reserva.',
      'Mezcla las verduras en un tazón grande.',
      'Agrega el pollo, rocía con aceite y jugo de limón.',
    ]
  },
  {
    id: 3, meal: 'cena', name: 'Sopa de lentejas con verduras', emoji: '🍲',
    color: 'linear-gradient(135deg, #FF6B35, #FFB800)',
    desc: 'Sopa nutritiva de lentejas con zanahoria, apio y espinaca. Alta en proteína vegetal y fibra.',
    time: 35, kcal: 290, porciones: 4,
    badges: ['Vegano', 'Alto en fibra', 'Sin gluten'],
    nutrients: [
      { label: 'Prot', val: '18g', pct: 55, color: '#4361EE' },
      { label: 'Carbs', val: '40g', pct: 60, color: '#FFB800' },
      { label: 'Grasas', val: '4g', pct: 15, color: '#FF4757' },
    ],
    ingredients: [
      { name: 'Lentejas', amount: '1 taza', status: 'verde' },
      { name: 'Zanahoria', amount: '1 pieza', status: 'verde' },
      { name: 'Apio', amount: '2 ramas', status: 'verde' },
      { name: 'Espinaca', amount: '1 taza', status: 'verde' },
      { name: 'Caldo de verduras bajo en sodio', amount: '4 tazas', status: 'amarillo' },
    ],
    steps: [
      'Lava y escurre las lentejas.',
      'En una olla, sofríe zanahoria y apio 3 min.',
      'Agrega las lentejas y el caldo. Lleva a hervor.',
      'Cocina 25 min a fuego bajo hasta que las lentejas estén tiernas.',
      'Añade espinaca 2 min antes de apagar.',
    ]
  },
  {
    id: 4, meal: 'snack', name: 'Jícama con chile y limón', emoji: '🥒',
    color: 'linear-gradient(135deg, #4361EE, #00C896)',
    desc: 'Bastones de jícama fresca con chile piquín y limón. Snack crujiente, bajo en calorías.',
    time: 5, kcal: 80, porciones: 1,
    badges: ['Sin gluten', 'Muy bajo IG', 'Bajo sodio'],
    nutrients: [
      { label: 'Prot', val: '2g', pct: 10, color: '#4361EE' },
      { label: 'Carbs', val: '18g', pct: 30, color: '#FFB800' },
      { label: 'Grasas', val: '0g', pct: 2, color: '#FF4757' },
    ],
    ingredients: [
      { name: 'Jícama', amount: '1 taza', status: 'verde' },
      { name: 'Chile piquín', amount: '1 cdita', status: 'verde' },
      { name: 'Limón', amount: '1 pieza', status: 'verde' },
    ],
    steps: [
      'Pela y corta la jícama en bastones.',
      'Exprime el limón sobre la jícama.',
      'Espolvorea chile piquín al gusto.',
    ]
  },
]

const filteredRecipes = computed(() => allRecipes.filter(r => r.meal === mealTab.value))
</script>

<style scoped>
.recetas-page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.recetas-header h2 { font-size: 22px; font-weight: 800; }
.recetas-header p { font-size: 14px; color: var(--gray-500); margin-top: 4px; }

.no-profile-card { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 40px 24px; }
.np-icon { font-size: 48px; }
.no-profile-card h3 { font-size: 18px; font-weight: 700; }
.no-profile-card p { font-size: 14px; color: var(--gray-500); }

.caloric-target {
  display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
  border: 1px solid var(--green);
}
.target-icon { font-size: 32px; }
.target-info { flex: 1; }
.target-info h4 { font-size: 15px; font-weight: 600; }
.target-info p { font-size: 12px; color: var(--gray-500); margin-top: 2px; }
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

.coming-soon-bar {
  display: flex; align-items: flex-start; gap: 10px;
  background: var(--blue-light); border: 1px solid var(--blue);
  border-radius: var(--radius-md); padding: 12px 14px;
  font-size: 13px; color: var(--blue);
}
.coming-soon-bar span { font-size: 18px; flex-shrink: 0; }

.recipe-grid { display: flex; flex-direction: column; gap: 16px; }
.recipe-card { padding: 0; overflow: hidden; cursor: pointer; transition: transform .2s, box-shadow .2s; }
.recipe-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.recipe-img {
  position: relative; padding: 24px; min-height: 100px;
  display: flex; align-items: flex-end;
}
.recipe-emoji { font-size: 40px; line-height: 1; }
.recipe-badges { position: absolute; top: 12px; right: 12px; display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.r-badge {
  background: rgba(0,0,0,.4); color: white; font-size: 10px; font-weight: 600;
  padding: 3px 8px; border-radius: 99px; backdrop-filter: blur(4px);
}
.recipe-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.recipe-name { font-size: 17px; font-weight: 700; }
.recipe-desc { font-size: 13px; color: var(--gray-500); line-height: 1.5; }
.recipe-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.meta-item { font-size: 12px; font-weight: 600; color: var(--gray-500); }

.nutrients-mini { display: flex; flex-direction: column; gap: 5px; }
.nm-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--gray-500); }
.nm-bar { height: 4px; border-radius: 99px; min-width: 4px; }

/* Supabase note */
.supabase-note { display: flex; flex-direction: column; gap: 10px; background: var(--gray-900); color: white; }
.supa-header { display: flex; align-items: center; gap: 10px; }
.supa-header span { font-size: 24px; }
.supa-header h4 { font-size: 16px; font-weight: 700; }
.supabase-note p { font-size: 13px; color: var(--gray-400); }
.supa-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.supa-list li { font-size: 13px; color: var(--gray-300); }

/* Modal */
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
.modal-img {
  position: relative; padding: 40px 24px 24px;
  display: flex; align-items: flex-end;
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: rgba(0,0,0,.3); border: none; color: white;
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 14px;
}
.modal-emoji { font-size: 52px; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.modal-body h3 { font-size: 22px; font-weight: 800; }
.modal-desc { font-size: 14px; color: var(--gray-500); line-height: 1.6; }
.modal-meta { display: flex; justify-content: space-around; background: var(--gray-50); border-radius: var(--radius-md); padding: 16px; }
.meta-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
.meta-stat span { font-size: 20px; }
.meta-stat strong { font-size: 16px; font-weight: 700; }
.meta-stat small { font-size: 11px; color: var(--gray-400); }
.modal-section { display: flex; flex-direction: column; gap: 10px; }
.modal-section h5 { font-size: 15px; font-weight: 700; }

.ingredient-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.ingredient-item { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.ing-dot { flex-shrink: 0; width: 10px; height: 10px; border-radius: 50%; }
.ing-dot.verde { background: var(--green); }
.ing-dot.amarillo { background: var(--yellow); }
.ing-dot.rojo { background: var(--red); }
.ing-status-label { margin-left: auto; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
.ing-status-label.verde { background: var(--green-light); color: var(--green-dark); }
.ing-status-label.amarillo { background: var(--yellow-light); color: #7A5800; }
.ing-status-label.rojo { background: var(--red-light); color: var(--red); }

.steps-list { list-style: decimal; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.steps-list li { font-size: 14px; color: var(--gray-700); line-height: 1.5; }

.modal-enter-active, .modal-leave-active { transition: opacity .3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
