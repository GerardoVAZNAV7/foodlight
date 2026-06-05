<template>
  <div class="perfil-esp-page">
    <StatusToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <!-- Header -->
    <div class="page-header">
      <div class="avatar-xl">{{ initials }}</div>
      <div class="header-info">
        <h2>Mi perfil de especialista</h2>
        <p>Esta información es visible para tus pacientes</p>
      </div>
    </div>

    <div class="form-card card">
      <h3 class="section-title"><span>👤</span> Información personal</h3>

      <form @submit.prevent="guardar" novalidate>
        <div class="form-grid">

          <div class="field">
            <label>Nombre(s)</label>
            <input v-model="form.nombre" type="text" class="input"
              :class="{ 'input-error': errors.nombre }"
              placeholder="María" @blur="v('nombre')" />
            <span v-if="errors.nombre" class="field-error">{{ errors.nombre }}</span>
          </div>

          <div class="field">
            <label>Apellido(s)</label>
            <input v-model="form.apellido" type="text" class="input"
              placeholder="García López" />
          </div>

          <div class="field span-2">
            <label>Especialidad / Profesión</label>
            <input v-model="form.especialidad" type="text" class="input"
              placeholder="Nutrióloga clínica, Médico internista…" />
          </div>

          <div class="field">
            <label>Cédula profesional</label>
            <input v-model="form.cedula" type="text" class="input"
              placeholder="Ej. 12345678" />
          </div>

          <div class="field">
            <label>Teléfono de contacto</label>
            <input v-model="form.telefono" type="tel" class="input"
              placeholder="+52 667 000 0000" />
          </div>

          <div class="field span-2">
            <label>Institución / Consultorio</label>
            <input v-model="form.institucion" type="text" class="input"
              placeholder="Hospital General, Clínica Santa Fe…" />
          </div>

          <div class="field span-2">
            <label>Descripción / Presentación</label>
            <textarea v-model="form.descripcion" class="input textarea"
              placeholder="Cuéntale a tus pacientes sobre ti, tu experiencia y tu enfoque de atención…"
              rows="4"></textarea>
            <span class="char-count">{{ form.descripcion.length }} / 500</span>
          </div>
        </div>

        <div v-if="isDirty" class="unsaved-bar">
          💡 Tienes cambios sin guardar
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="saving">
          <span v-if="saving" class="spinner-sm"></span>
          {{ saving ? 'Guardando...' : '💾 Guardar perfil' }}
        </button>
      </form>
    </div>

    <!-- Card info de cuenta (solo lectura) -->
    <div class="info-card card">
      <h3 class="section-title"><span>🔐</span> Cuenta</h3>
      <div class="info-row">
        <span class="info-label">Correo electrónico</span>
        <span class="info-value">{{ store.authUser?.email }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Rol</span>
        <span class="info-value esp-role-badge">👨‍🔬 Especialista</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pacientes asignados</span>
        <span class="info-value">{{ totalPacientes }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/services/supabase'
import StatusToast from '@/components/StatusToast.vue'

const store = useUserStore()

const saving = ref(false)
const isDirty = ref(false)
const totalPacientes = ref(0)
const toast = reactive({ show: false, message: '', type: 'success' })

const form = reactive({
  nombre: '',
  apellido: '',
  especialidad: '',
  cedula: '',
  telefono: '',
  institucion: '',
  descripcion: '',
})

const errors = reactive({ nombre: '' })

const initials = computed(() => {
  const n = (form.nombre || store.authUser?.email || '?')
  return n.charAt(0).toUpperCase()
})

function v(field) {
  if (field === 'nombre') errors.nombre = !form.nombre.trim() ? 'El nombre es requerido.' : ''
}

function showToast(msg, type = 'success') {
  toast.show = false
  setTimeout(() => { toast.message = msg; toast.type = type; toast.show = true }, 50)
}

async function cargarPerfil() {
  const uid = store.authUser?.id
  if (!uid) return

  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()

    if (data) {
      form.nombre = data.nombre || ''
      form.apellido = data.apellido || ''
      form.especialidad = data.especialidad || ''
      form.cedula = data.cedula || ''
      form.telefono = data.telefono || ''
      form.institucion = data.institucion || ''
      form.descripcion = data.descripcion || ''
    }
  } catch (e) {
    console.error('Error cargando perfil:', e)
  }

  // Total de pacientes — sin head:true para evitar problema con RLS
  try {
    const { data: pacs } = await supabase
      .from('profiles')
      .select('id')
      .eq('especialista_id', uid)
      .eq('especialista', false)

    totalPacientes.value = pacs?.length || 0
  } catch (e) {
    console.error('Error contando pacientes:', e)
    totalPacientes.value = 0
  }

  isDirty.value = false
}

async function guardar() {
  v('nombre')
  if (errors.nombre) return
  saving.value = true
  showToast('Guardando...', 'loading')
  try {
    // La tabla profiles solo tiene columnas: nombre, especialista, updated_at, etc.
    // Las columnas extra (apellido, especialidad, cedula, etc.) deben existir en Supabase.
    const payload = {
      id: store.authUser.id,
      nombre: form.nombre.trim(),
      updated_at: new Date().toISOString(),
    }

    // Solo incluir campos si la columna existe (opcional: enviar todos y que Supabase ignore los que no existen)
    const extraFields = {
      apellido: form.apellido.trim(),
      especialidad: form.especialidad.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      institucion: form.institucion.trim(),
      descripcion: form.descripcion.trim().slice(0, 500),
    }

    // Intentar guardar con todos los campos; si falla, reintentar solo con los básicos
    const { error } = await supabase
      .from('profiles')
      .update({ ...payload, ...extraFields, especialista: true })
      .eq('id', store.authUser.id)

    if (error) {
      // Reintentar solo con columnas base si el error es de columna inexistente
      if (error.message?.includes('column') || error.code === '42703') {
        const { error: e2 } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', store.authUser.id)
        if (e2) throw e2
      } else {
        throw error
      }
    }

    // Actualizar store
    if (store.profile) store.profile.nombre = form.nombre.trim()
    isDirty.value = false
    showToast('Perfil guardado correctamente ✅', 'success')
  } catch (e) {
    showToast('Error: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

watch(form, () => { isDirty.value = true }, { deep: true })

onMounted(cargarPerfil)
</script>

<style scoped>
.perfil-esp-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; max-width: 720px; }

.page-header { display: flex; align-items: center; gap: 18px; }
.avatar-xl {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--green), var(--blue));
  color: white; font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.header-info h2 { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.header-info p  { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

.form-card { display: flex; flex-direction: column; gap: 20px; }
.section-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-primary); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.span-2 { grid-column: 1 / -1; }
.textarea { resize: vertical; min-height: 100px; font-family: var(--font); }
.char-count { font-size: 11px; color: var(--text-muted); text-align: right; margin-top: 2px; }

.unsaved-bar {
  background: var(--yellow-light); border: 1px solid var(--yellow);
  border-radius: var(--radius-sm); padding: 10px 14px;
  font-size: 13px; color: #7A5800; font-weight: 500;
}

.info-card { display: flex; flex-direction: column; gap: 12px; }
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--border-light);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.info-value { font-size: 13px; color: var(--text-primary); font-weight: 600; }
.esp-role-badge {
  background: linear-gradient(135deg, var(--green-light), var(--blue-light));
  color: var(--green-dark); padding: 4px 12px; border-radius: 99px; font-size: 12px;
}

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .perfil-esp-page { padding: 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: 1; }
}
</style>