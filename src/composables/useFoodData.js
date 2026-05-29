// src/composables/useFoodData.js
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

let cachedAlimentos = null

export function useFoodData() {
  const loading = ref(false)
  const error   = ref(null)

  async function getAlimentos() {
    if (cachedAlimentos) return cachedAlimentos
    loading.value = true
    error.value   = null
    try {
      // Trae todos los alimentos con el nombre del grupo
      const { data, error: err } = await supabase
        .from('alimentos')
        .select(`
          *,
          grupos_alimentos ( nombre )
        `)
        .order('nombre')

      if (err) throw new Error(err.message)

      cachedAlimentos = data.map(a => ({
        ...a,
        grupo_nombre: a.grupos_alimentos?.nombre || 'Otro'
      }))
      return cachedAlimentos
    } finally {
      loading.value = false
    }
  }

  // Esta función NO cambia — recibe el objeto alimento y las condiciones
  function clasificarAlimento(alimento, condiciones) {
    const flags = { verde: 0, amarillo: 0, rojo: 0 }

    if (condiciones.celiaquía) {
      if (alimento.contiene_gluten) flags.rojo++
      else flags.verde++
    }
    if (condiciones.hipertensión) {
      const sodio = parseFloat(alimento.sodio_mg) || 0
      if (sodio > 400)       flags.rojo++
      else if (sodio > 150)  flags.amarillo++
      else                   flags.verde++
    }
    if (condiciones.diabetes) {
      const ig     = parseFloat(alimento.indice_glucemico) || 0
      const azucar = parseFloat(alimento.azucar_g) || 0
      if (ig > 70 || azucar > 15)       flags.rojo++
      else if (ig > 55 || azucar > 8)   flags.amarillo++
      else                               flags.verde++
    }

    if (!condiciones.celiaquía && !condiciones.hipertensión && !condiciones.diabetes) {
      const fibra = parseFloat(alimento.fibra_g) || 0
      const kcal  = parseFloat(alimento.energia_kcal) || 0
      if (fibra > 3) return 'verde'
      if (kcal > 300) return 'amarillo'
      return 'verde'
    }

    if (flags.rojo > 0)     return 'rojo'
    if (flags.amarillo > 0) return 'amarillo'
    return 'verde'
  }

  // Búsqueda directa en Supabase (para el modal del Diario, si prefieres no cargar todo)
  async function searchAlimentos(query) {
    if (!query || query.length < 2) return []
    const { data } = await supabase
      .from('alimentos')
      .select('*, grupos_alimentos(nombre)')
      .ilike('nombre', `%${query}%`)
      .order('nombre')
      .limit(20)
    return (data || []).map(a => ({ ...a, grupo_nombre: a.grupos_alimentos?.nombre || 'Otro' }))
  }

  return { loading, error, getAlimentos, clasificarAlimento, searchAlimentos }
}