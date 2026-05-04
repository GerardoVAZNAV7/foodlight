<template>
  <nav class="bottom-nav">
    <router-link to="/perfil" class="nav-item" active-class="active">
      <span class="nav-icon">👤</span>
      <span class="nav-label">Perfil</span>
    </router-link>
    <router-link to="/semaforo" class="nav-item" active-class="active">
      <span class="nav-icon">🚦</span>
      <span class="nav-label">Semáforo</span>
    </router-link>
    <router-link to="/recetas" class="nav-item" active-class="active">
      <span class="nav-icon">🍽️</span>
      <span class="nav-label">Recetas</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; z-index: 100;
  display: flex;
  background: white;
  border-top: 1px solid var(--gray-100);
  padding: 10px 0 max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 20px rgba(0,0,0,.06);
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  text-decoration: none; padding: 6px 0;
  transition: all .2s;
}
.nav-icon { font-size: 22px; transition: transform .2s; }
.nav-label { font-size: 11px; font-weight: 600; color: var(--gray-400); transition: color .2s; }
.nav-item.active .nav-label { color: var(--green); }
.nav-item.active .nav-icon { transform: scale(1.15); }
.nav-item:hover .nav-icon { transform: scale(1.1); }
</style>
