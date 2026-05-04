import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const LS_KEY_USER = 'fl_user'
const LS_KEY_PROFILE = 'fl_profile'

export const useUserStore = defineStore('user', () => {
  // Auth
  const authUser = ref(JSON.parse(localStorage.getItem(LS_KEY_USER) || 'null'))
  const isLoggedIn = computed(() => !!authUser.value)

  // Profile health data
  const profile = ref(JSON.parse(localStorage.getItem(LS_KEY_PROFILE) || 'null'))

  // Mock users DB (demo)
  const mockUsers = ref(JSON.parse(localStorage.getItem('fl_mock_users') || '[]'))

  function register(name, email, password) {
    const exists = mockUsers.value.find(u => u.email === email)
    if (exists) throw new Error('El correo ya está registrado.')
    const newUser = { id: Date.now(), name, email, password }
    mockUsers.value.push(newUser)
    localStorage.setItem('fl_mock_users', JSON.stringify(mockUsers.value))
    authUser.value = { id: newUser.id, name, email }
    localStorage.setItem(LS_KEY_USER, JSON.stringify(authUser.value))
  }

  function login(email, password) {
    const user = mockUsers.value.find(u => u.email === email && u.password === password)
    if (!user) throw new Error('Correo o contraseña incorrectos.')
    authUser.value = { id: user.id, name: user.name, email: user.email }
    localStorage.setItem(LS_KEY_USER, JSON.stringify(authUser.value))
  }

  function logout() {
    authUser.value = null
    localStorage.removeItem(LS_KEY_USER)
  }

  function saveProfile(data) {
    profile.value = { ...data, updatedAt: new Date().toISOString() }
    localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(profile.value))
  }

  const hasProfile = computed(() => !!profile.value?.edad)

  return { authUser, isLoggedIn, profile, hasProfile, register, login, logout, saveProfile }
})
