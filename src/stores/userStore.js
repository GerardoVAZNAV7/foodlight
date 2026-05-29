// src/stores/userStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useUserStore = defineStore('user', () => {
  const authUser = ref(null)
  const profile  = ref(null)
  const isLoggedIn = computed(() => !!authUser.value)
  const hasProfile = computed(() => !!profile.value?.edad)

  // ── Llamar al iniciar la app ──────────────────────────────────────────────
  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      authUser.value = { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name }
      await loadProfile(session.user.id)
    }
    // Escuchar cambios de sesión
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

  // ── Perfil ────────────────────────────────────────────────────────────────
  async function loadProfile(userId) {
    // Leer datos biométricos
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Leer condiciones activas
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
        edad:      calcularEdad(p.fecha_nacimiento),
        sexo:      p.sexo,
        peso:      parseFloat(p.peso_kg),
        estatura:  parseFloat(p.talla_cm),
        actividad: '1.375',   // puedes agregar columna en profiles si quieres
        condiciones,
        // guardar raw para edición
        _raw: p
      }
    }
  }

  async function saveProfile(data) {
    const userId = authUser.value.id
    const hoy = new Date()
    // Convertir edad → fecha_nacimiento aproximada
    const nacimiento = new Date(hoy.getFullYear() - data.edad, hoy.getMonth(), hoy.getDate())
      .toISOString().split('T')[0]

    // Upsert en profiles
    const { error: pErr } = await supabase
      .from('profiles')
      .upsert({
        id:              userId,
        sexo:            data.sexo,
        peso_kg:         data.peso,
        talla_cm:        data.estatura,
        fecha_nacimiento: nacimiento,
        updated_at:      new Date().toISOString()
      })
    if (pErr) throw new Error(pErr.message)

    // Obtener IDs de condiciones médicas
    const { data: todasConds } = await supabase
      .from('condiciones_medicas')
      .select('id, clave')

    for (const cond of todasConds || []) {
      const activa = !!data.condiciones?.[cond.clave]
      await supabase
        .from('usuario_condiciones')
        .upsert({
          usuario_id:  userId,
          condicion_id: cond.id,
          activa,
          fecha_inicio: activa ? new Date().toISOString().split('T')[0] : null
        }, { onConflict: 'usuario_id,condicion_id' })
    }

    await loadProfile(userId)
  }

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nac = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nac.getFullYear()
    if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--
    return edad
  }

  return { authUser, isLoggedIn, profile, hasProfile, init, register, login, logout, saveProfile }
})