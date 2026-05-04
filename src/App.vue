<template>
  <div class="app-shell">
    <NavBar v-if="store.isLoggedIn" />
    <main class="main-content" :class="{ 'with-nav': store.isLoggedIn }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <BottomNav v-if="store.isLoggedIn" />
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/userStore'
import NavBar from '@/components/NavBar.vue'
import BottomNav from '@/components/BottomNav.vue'
const store = useUserStore()
</script>

<style>
.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  background: var(--gray-50);
  box-shadow: 0 0 40px rgba(0,0,0,.08);
}
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.main-content.with-nav {
  padding-bottom: 80px;
}

/* Page transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
