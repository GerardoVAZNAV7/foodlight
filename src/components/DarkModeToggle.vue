<template>
  <button
    class="theme-toggle"
    :class="{ dark: isDark, animate: isAnimating }"
    @click="toggle"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="isDark ? 'Modo claro' : 'Modo oscuro'"
  >
    <div class="toggle-track">
      <!-- Estrellas (solo en dark) -->
      <span class="star s1"></span>
      <span class="star s2"></span>
      <span class="star s3"></span>
      <!-- Nubes (solo en light) -->
      <span class="cloud c1"></span>
      <span class="cloud c2"></span>
      <!-- Thumb con sol/luna -->
      <div class="toggle-thumb">
        <div class="sun-moon">
          <!-- Sol -->
          <div class="sun">
            <span class="ray r1"></span>
            <span class="ray r2"></span>
            <span class="ray r3"></span>
            <span class="ray r4"></span>
            <span class="ray r5"></span>
            <span class="ray r6"></span>
            <span class="ray r7"></span>
            <span class="ray r8"></span>
            <div class="sun-core"></div>
          </div>
          <!-- Luna -->
          <div class="moon">
            <div class="crater cr1"></div>
            <div class="crater cr2"></div>
            <div class="crater cr3"></div>
          </div>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)
const isAnimating = ref(false)

function applyTheme(dark) {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  localStorage.setItem('foodlight-theme', dark ? 'dark' : 'light')
}

function toggle() {
  isAnimating.value = true
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  setTimeout(() => { isAnimating.value = false }, 600)
}

onMounted(() => {
  const saved = localStorage.getItem('foodlight-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : prefersDark
  applyTheme(isDark.value)
})
</script>

<style scoped>
/* ── Toggle base ── */
.theme-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toggle-track {
  position: relative;
  width: 52px;
  height: 28px;
  border-radius: 99px;
  background: linear-gradient(135deg, #87CEEB 0%, #98D8F0 100%);
  transition: background .5s ease;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.3);
}

/* ── Thumb ── */
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFF9E6;
  box-shadow: 0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.8);
  transition: transform .45s cubic-bezier(.34, 1.56, .64, 1), background .4s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 3;
}

/* ── Sol / Luna ── */
.sun-moon {
  position: relative;
  width: 100%;
  height: 100%;
}

.sun, .moon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .3s ease, transform .4s ease;
}

/* SOL */
.sun { opacity: 1; transform: rotate(0deg) scale(1); }

.sun-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFB800;
  position: relative;
  z-index: 2;
  box-shadow: 0 0 4px #FFD700;
}

.ray {
  position: absolute;
  width: 2px;
  height: 5px;
  background: #FFB800;
  border-radius: 1px;
  transform-origin: 50% 100%;
}

.r1 { transform: rotate(0deg)   translateY(-7px) scaleY(1); }
.r2 { transform: rotate(45deg)  translateY(-7px) scaleY(1); }
.r3 { transform: rotate(90deg)  translateY(-7px) scaleY(1); }
.r4 { transform: rotate(135deg) translateY(-7px) scaleY(1); }
.r5 { transform: rotate(180deg) translateY(-7px) scaleY(1); }
.r6 { transform: rotate(225deg) translateY(-7px) scaleY(1); }
.r7 { transform: rotate(270deg) translateY(-7px) scaleY(1); }
.r8 { transform: rotate(315deg) translateY(-7px) scaleY(1); }

/* LUNA */
.moon { opacity: 0; transform: rotate(-30deg) scale(0.6); }

.moon::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #E8E8E8;
  box-shadow: inset -2px -1px 0 rgba(0,0,0,.1);
}

.moon::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #c8c8d8;
  top: 1px;
  left: 5px;
}

.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(0,0,0,.08);
  border: 1px solid rgba(0,0,0,.05);
}
.cr1 { width: 5px; height: 5px; top: 3px; left: 4px; }
.cr2 { width: 3px; height: 3px; top: 9px; left: 7px; }
.cr3 { width: 4px; height: 4px; top: 6px; left: 12px; }

/* ── Nubes (modo claro) ── */
.cloud {
  position: absolute;
  border-radius: 99px;
  background: rgba(255,255,255,.7);
  transition: opacity .4s ease, transform .4s ease;
}
.c1 {
  width: 18px; height: 7px;
  top: 8px; right: 8px;
  opacity: 1;
}
.c1::before {
  content: '';
  position: absolute;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: rgba(255,255,255,.7);
  top: -4px; left: 3px;
}
.c2 {
  width: 10px; height: 5px;
  top: 14px; right: 14px;
  opacity: .6;
}

/* ── Estrellas (modo oscuro) ── */
.star {
  position: absolute;
  border-radius: 50%;
  background: white;
  opacity: 0;
  transition: opacity .4s ease, transform .4s ease;
}
.s1 { width: 3px; height: 3px; top: 5px; right: 12px; }
.s2 { width: 2px; height: 2px; top: 10px; right: 8px; }
.s3 { width: 2px; height: 2px; top: 16px; right: 14px; }

/* ══════════════════════════
   ESTADO OSCURO
══════════════════════════ */
.dark .toggle-track {
  background: linear-gradient(135deg, #1a1a3e 0%, #0f0f2d 100%);
  box-shadow: inset 0 1px 3px rgba(0,0,0,.5), 0 0 0 1px rgba(100,100,200,.2);
}

.dark .toggle-thumb {
  transform: translateX(24px);
  background: #2D2B6B;
  box-shadow: 0 2px 8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1);
}

.dark .sun { opacity: 0; transform: rotate(60deg) scale(0.5); }
.dark .moon { opacity: 1; transform: rotate(0deg) scale(1); }

/* nubes ocultas en dark */
.dark .c1, .dark .c2 { opacity: 0; transform: translateX(-6px); }

/* estrellas visibles en dark */
.dark .s1 { opacity: 1; }
.dark .s2 { opacity: .7; }
.dark .s3 { opacity: .5; }

/* ── Animación al hacer clic ── */
.animate .toggle-thumb {
  animation: pulse-bounce .5s ease;
}

@keyframes pulse-bounce {
  0%   { box-shadow: 0 2px 8px rgba(0,0,0,.25); }
  30%  { box-shadow: 0 0 0 6px rgba(0,200,150,.25), 0 2px 8px rgba(0,0,0,.25); }
  60%  { box-shadow: 0 0 0 10px rgba(0,200,150,.1), 0 2px 8px rgba(0,0,0,.25); }
  100% { box-shadow: 0 2px 8px rgba(0,0,0,.25); }
}

.animate.dark .toggle-thumb {
  animation: pulse-bounce-dark .5s ease;
}

@keyframes pulse-bounce-dark {
  0%   { box-shadow: 0 2px 8px rgba(0,0,0,.6); }
  30%  { box-shadow: 0 0 0 6px rgba(100,100,255,.3), 0 2px 8px rgba(0,0,0,.6); }
  60%  { box-shadow: 0 0 0 10px rgba(100,100,255,.1), 0 2px 8px rgba(0,0,0,.6); }
  100% { box-shadow: 0 2px 8px rgba(0,0,0,.6); }
}

/* ── Rayos girando en hover ── */
.theme-toggle:hover .sun { animation: spin-rays 3s linear infinite; }

@keyframes spin-rays {
  to { transform: rotate(360deg); }
}

.theme-toggle:hover .moon { animation: wobble-moon 1.5s ease-in-out infinite; }

@keyframes wobble-moon {
  0%, 100% { transform: rotate(-5deg) scale(1); }
  50%       { transform: rotate(5deg) scale(1.05); }
}
</style>