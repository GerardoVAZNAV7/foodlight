// src/stores/userStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useUserStore = defineStore('user', () => {
  const authUser = ref(null)
  const profile  = ref(null)
  const isLoggedIn = computed(() => !!authUser.value)
  // Verificar que el perfil tenga los datos mínimos para calcular TDEE
  const hasProfile = computed(() =>
    !!profile.value?.fecha_nacimiento &&
    !!profile.value?.sexo &&
    !!profile.value?.peso &&
    !!profile.value?.estatura
  )

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      authUser.value = { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name }
      await loadProfile(session.user.id)
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        authUser.value = { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name }
        await loadProfile(session.user.id)
      } else {
        authUser.value = null
        profile.value  = null
      }
    })
  }

  async function register(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    if (error) throw new Error(error.message)
    authUser.value = { id: data.user.id, email, name }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    authUser.value = { id: data.user.id, email, name: data.user.user_metadata?.name }
    await loadProfile(data.user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    authUser.value = null
    profile.value  = null
  }

  async function loadProfile(userId) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    const { data: conds } = await supabase
      .from('usuario_condiciones')
      .select('condicion_id, activa, condiciones_medicas(clave)')
      .eq('usuario_id', userId)
      .eq('activa', true)

    const condiciones = {}
    for (const c of conds || []) {
      condiciones[c.condiciones_medicas.clave] = true
    }

    if (p) {
      profile.value = {
        // Guardamos la fecha RAW para el input[type=date]
        fecha_nacimiento: p.fecha_nacimiento || '',
        // Calculamos edad solo para mostrar (no para lógica de negocio)
        edad:      calcularEdad(p.fecha_nacimiento),
        sexo:      p.sexo,
        peso:      parseFloat(p.peso_kg) || null,
        estatura:  parseFloat(p.talla_cm) || null,
        actividad: String(p.actividad || '1.375'),
        condiciones,
        _raw: p
      }
    } else {
      // Sin perfil en DB aún, inicializar vacío
      profile.value = {
        fecha_nacimiento: '',
        edad: null,
        sexo: '',
        peso: null,
        estatura: null,
        actividad: '1.375',
        condiciones,
      }
    }
  }

  
  async function saveProfile(data) {
  const userId = authUser.value.id

  const { error: pErr } = await supabase
    .from('profiles')
    .upsert({
      id:               userId,
      sexo:             data.sexo,
      peso_kg:          data.peso,
      talla_cm:         data.estatura,
      actividad:        parseFloat(data.actividad) || 1.375,
      fecha_nacimiento: data.fecha_nacimiento,
      updated_at:       new Date().toISOString()
    })
  if (pErr) throw new Error(pErr.message)

  const { data: todasConds, error: cErr } = await supabase
    .from('condiciones_medicas')
    .select('id, clave')
  if (cErr) throw new Error(cErr.message)

  const hoy = new Date().toISOString().split('T')[0]

  // ── Un solo upsert con todas las condiciones en lote ──
  const rows = (todasConds || []).map(cond => ({
    usuario_id:   userId,
    condicion_id: cond.id,
    activa:       !!data.condiciones?.[cond.clave],
    fecha_inicio: hoy,
  }))

  const { error: ucErr } = await supabase
    .from('usuario_condiciones')
    .upsert(rows, { onConflict: 'usuario_id,condicion_id' })

  if (ucErr) throw new Error(ucErr.message)

  await loadProfile(userId)
}

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    // Parsear como fecha local, no UTC
    const [year, month, day] = fechaNacimiento.split('-').map(Number)
    const nac = new Date(year, month - 1, day)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const cumpleEsteAnio = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
    if (hoy < cumpleEsteAnio) edad--
    return edad
  }

  return { authUser, isLoggedIn, profile, hasProfile, init, register, login, logout, saveProfile }
})