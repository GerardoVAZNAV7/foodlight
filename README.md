# 🚦 FoodLight

App de guía nutricional personalizada con semáforo de alimentos.

---

## 📂 Dónde poner tus archivos CSV

Coloca los dos CSV en:

```
foodlight/
└── public/
    └── data/
        ├── alimentos.csv        ← tu archivo alimentos__2_.csv (renombrado)
        └── grupos_alimentos.csv ← tu archivo grupos_alimentos.csv
```

> ⚠️ Renombra `alimentos__2_.csv` a simplemente `alimentos.csv`

---

## 🚀 Cómo levantar el proyecto

```bash
cd foodlight
npm install
npm run dev
```

Abre en el navegador: http://localhost:5173

---

## 🏗️ Estructura del proyecto

```
src/
├── assets/global.css         → Variables CSS y estilos globales
├── components/
│   ├── NavBar.vue             → Barra superior con nombre y logout
│   ├── BottomNav.vue          → Navegación inferior (tabs)
│   └── StatusToast.vue        → Notificaciones de estado (heurística #1)
├── composables/
│   └── useFoodData.js         → Carga CSV y lógica de clasificación
├── router/index.js            → Vue Router con guard de autenticación
├── stores/userStore.js        → Pinia: auth + perfil en localStorage
└── views/
    ├── LoginView.vue          → Login simulado
    ├── RegisterView.vue       → Alta de usuario (2 pasos)
    ├── ProfileView.vue        → Datos personales + padecimientos
    ├── SemaforoView.vue       → Semáforo de alimentos (✅ / ⚠️ / 🚫)
    └── RecetasView.vue        → Boceto de recetas sugeridas
```

---

## ✅ Heurísticas de Nielsen implementadas

| # | Heurística | Dónde se aplica |
|---|------------|-----------------|
| 1 | **Visibilidad del estado del sistema** | StatusToast en cada acción (loading, error, éxito). Barra de progreso al cargar CSV. |
| 2 | **Coincidencia con el mundo real** | Lenguaje médico claro ("celiaquía", "hipertensión"), iconos reconocibles |
| 3 | **Control y libertad del usuario** | Botones "← Volver", registro en 2 pasos, edición de perfil siempre disponible |
| 5 | **Prevención de errores** | Validación en tiempo real de formularios, indicador "cambios sin guardar" |
| 6 | **Reconocimiento antes que recuerdo** | Íconos + etiquetas en toda la UI, chips de padecimientos visibles |

---

## 🔮 Para producción (Supabase)

Reemplaza `useFoodData.js` para consultar tu cliente Supabase:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data } = await supabase
  .from('alimentos')
  .select('*, grupos_alimentos(nombre)')
```

El store de usuario también puede conectarse a `supabase.auth` reemplazando
los métodos `login()`, `register()` y `logout()` del store.

---

## 🗃️ Lógica del semáforo

| Condición | Rojo | Amarillo | Verde |
|-----------|------|----------|-------|
| Celiaquía | `contiene_gluten = TRUE` | — | Sin gluten |
| Hipertensión | `sodio_mg > 400` | `sodio_mg 150–400` | `sodio_mg < 150` |
| Diabetes | `IG > 70` o `azúcar > 15g` | `IG 55–70` o `azúcar 8–15g` | `IG < 55` |
