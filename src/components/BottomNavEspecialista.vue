<template>
  <nav class="bottom-nav-esp">
    <router-link to="/dashboard" class="nav-item" active-class="active">
      <span class="nav-icon">🏥</span>
      <span class="nav-label">Dashboard</span>
    </router-link>
    <router-link to="/esp/reportes" class="nav-item" active-class="active">
      <span class="nav-icon">📊</span>
      <span class="nav-label">Reportes</span>
    </router-link>
    <router-link to="/esp/dietas" class="nav-item" active-class="active">
      <span class="nav-icon">🥗</span>
      <span class="nav-label">Dietas</span>
    </router-link>
    <router-link to="/esp/recetas" class="nav-item" active-class="active">
      <span class="nav-icon">🍽️</span>
      <span class="nav-label">Recetas</span>
    </router-link>
    <router-link to="/esp/perfil" class="nav-item" active-class="active">
      <span class="nav-icon">👤</span>
      <span class="nav-label">Perfil</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav-esp {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 100;
  display: flex;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  padding: 10px 0 max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  padding: 6px 0;
  transition: all 0.2s;
}

.nav-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.2s;
}

.nav-item.active .nav-label {
  color: var(--green);
}

.nav-item.active .nav-icon {
  transform: scale(1.15);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

/* En desktop la sidebar del especialista ya provee navegación */
@media (min-width: 768px) {
  .bottom-nav-esp {
    display: none;
  }
}
</style>