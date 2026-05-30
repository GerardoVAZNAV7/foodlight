// src/composables/useFoodData.js
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

// Caché en módulo (shared entre instancias en la misma sesión)
let cachedAlimentos = null
let cacheUserId     = null   // invalida caché si cambia de usuario

export function useFoodData() {
  const loading = ref(false)
  const error   = ref(null)

  /**
   * Trae todos los alimentos con el nombre del grupo desde Supabase.
   * Usa caché en memoria para no re-consultar en cada navegación.
   * @param {boolean} force — forzar recarga ignorando caché
   */
  async function getAlimentos(force = false) {
    // Obtener sesión actual para validar caché por usuario
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id || null

    if (!force && cachedAlimentos && cacheUserId === userId) {
      return cachedAlimentos
    }

    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('alimentos')
        .select(`
          *,
          grupos_alimentos ( nombre )
        `)
        .order('nombre')

      if (err) throw new Error(err.message)

      cachedAlimentos = (data || []).map(a => ({
        ...a,
        grupo_nombre: a.grupos_alimentos?.nombre || 'Otro',
      }))
      cacheUserId = userId
      return cachedAlimentos
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Invalida la caché (útil al cerrar sesión o cambiar perfil) */
  function clearCache() {
    cachedAlimentos = null
    cacheUserId     = null
  }

  /**
   * Clasifica un alimento en verde / amarillo / rojo
   * según las condiciones del perfil del usuario.
   */
  function clasificarAlimento(alimento, condiciones = {}) {
    const flags = { verde: 0, amarillo: 0, rojo: 0 }

    if (condiciones.celiaquía) {
      const gluten = alimento.contiene_gluten
      if (gluten === true || gluten === 'TRUE' || gluten === 't') flags.rojo++
      else flags.verde++
    }

    if (condiciones.hipertension) {          // ← sin acento
      const sodio = parseFloat(alimento.sodio_mg) || 0
      if (sodio > 400)      flags.rojo++
      else if (sodio > 150) flags.amarillo++
      else                  flags.verde++
    }

    if (condiciones.diabetes_t2) {           // ← clave correcta
      const ig     = parseFloat(alimento.indice_glucemico) || 0
      const azucar = parseFloat(alimento.azucar_g)         || 0
      if (ig > 70 || azucar > 15)     flags.rojo++
      else if (ig > 55 || azucar > 8) flags.amarillo++
      else                            flags.verde++
    }

    // Sin condiciones → clasificación general por fibra/kcal
    if (!condiciones.celiaquía && !condiciones.hipertension && !condiciones.diabetes_t2) {
      const fibra = parseFloat(alimento.fibra_g)      || 0
      const kcal  = parseFloat(alimento.energia_kcal) || 0
      if (fibra > 3)  return 'verde'
      if (kcal > 300) return 'amarillo'
      return 'verde'
    }

    if (flags.rojo > 0)     return 'rojo'
    if (flags.amarillo > 0) return 'amarillo'
    return 'verde'
  }

  /**
   * Búsqueda directa en Supabase (para el modal del Diario).
   */
  async function searchAlimentos(query) {
    if (!query || query.length < 2) return []
    const { data, error: err } = await supabase
      .from('alimentos')
      .select('*, grupos_alimentos(nombre)')
      .ilike('nombre', `%${query}%`)
      .order('nombre')
      .limit(20)
    if (err) return []
    return (data || []).map(a => ({
      ...a,
      grupo_nombre: a.grupos_alimentos?.nombre || 'Otro',
    }))
  }

  return { loading, error, getAlimentos, clearCache, clasificarAlimento, searchAlimentos }
}