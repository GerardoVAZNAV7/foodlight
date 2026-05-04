import { ref } from 'vue'
import Papa from 'papaparse'

let cachedAlimentos = null
let cachedGrupos = null

export function useFoodData() {
  const loading = ref(false)
  const error = ref(null)

  async function loadCSV(path) {
    const res = await fetch(path)
    if (!res.ok) throw new Error(`No se pudo cargar ${path}`)
    const text = await res.text()
    return Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true }).data
  }

  async function getAlimentos() {
    if (cachedAlimentos) return cachedAlimentos
    loading.value = true
    error.value = null
    try {
      const [alimentos, grupos] = await Promise.all([
        loadCSV('/data/alimentos.csv'),
        loadCSV('/data/grupos_alimentos.csv')
      ])
      const grupoMap = {}
      grupos.forEach(g => { grupoMap[g.id] = g.nombre })
      cachedAlimentos = alimentos.map(a => ({ ...a, grupo_nombre: grupoMap[a.grupo_id] || 'Otro' }))
      cachedGrupos = grupos
      return cachedAlimentos
    } finally {
      loading.value = false
    }
  }

  /**
   * Classify a food item based on user conditions.
   * Returns 'verde', 'amarillo', or 'rojo'
   */
  function clasificarAlimento(alimento, condiciones) {
    const flags = { verde: 0, amarillo: 0, rojo: 0 }

    if (condiciones.celiaquía) {
      if (alimento.contiene_gluten === true || alimento.contiene_gluten === 'TRUE') flags.rojo++
      else flags.verde++
    }

    if (condiciones.hipertensión) {
      const sodio = parseFloat(alimento.sodio_mg) || 0
      if (sodio > 400) flags.rojo++
      else if (sodio > 150) flags.amarillo++
      else flags.verde++
    }

    if (condiciones.diabetes) {
      const ig = parseFloat(alimento.indice_glucemico) || 0
      const azucar = parseFloat(alimento.azucar_g) || 0
      if (ig > 70 || azucar > 15) flags.rojo++
      else if (ig > 55 || azucar > 8) flags.amarillo++
      else flags.verde++
    }

    // No conditions → classify by general nutritional quality
    if (!condiciones.celiaquía && !condiciones.hipertensión && !condiciones.diabetes) {
      const kcal = parseFloat(alimento.energia_kcal) || 0
      const fibra = parseFloat(alimento.fibra_g) || 0
      if (fibra > 3 || alimento.grupo_id === 19 || alimento.grupo_id === 10) return 'verde'
      if (kcal > 300) return 'amarillo'
      return 'verde'
    }

    if (flags.rojo > 0) return 'rojo'
    if (flags.amarillo > 0) return 'amarillo'
    return 'verde'
  }

  return { loading, error, getAlimentos, clasificarAlimento }
}
