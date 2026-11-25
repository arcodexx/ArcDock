<script setup lang="ts">
import { ref } from 'vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
const japanImageLoaded = ref(true);
const appleImageLoaded = ref(true);

const onJapanImgError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  // If local asset failed, fallback to remote CDN
  if (target.src.includes('/assets/images/mount_fuji.jpg')) {
    target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Chureito_Pagoda_and_Mount_Fuji.jpg/1920px-Chureito_Pagoda_and_Mount_Fuji.jpg';
  } else {
    japanImageLoaded.value = false;
  }
};

const onAppleImgError = () => {
  appleImageLoaded.value = false;
};
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
    <!-- =======================================================================
         1. ANIME JAPAN ZEN (REAL HIGH-RES MOUNT FUJI, SAKURA, RAMEN & TORII)
         ======================================================================= -->
    <div
      v-if="themeStore.currentTheme === 'japan'"
      class="absolute inset-0 transition-opacity duration-700 bg-[#FFF5F8]"
    >
      <!-- Base sunny Japanese morning pastel gradient (underlayer) -->
      <div class="absolute inset-0 bg-gradient-to-b from-[#C8E4F8] via-[#F4E8EE] to-[#FFF5F8]"></div>

      <!-- Real, breathtaking photographic Mount Fuji image from Web/Local -->
      <img
        v-if="japanImageLoaded"
        src="/assets/images/mount_fuji.jpg"
        alt="Mount Fuji with Cherry Blossoms"
        class="absolute inset-0 w-full h-full object-cover object-center opacity-85 transition-opacity duration-700 pointer-events-none"
        @error="onJapanImgError"
      />

      <!-- Soft sunny morning daylight gradient overlay (enhances contrast & ensures text readability) -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#FFF5F8]/70 via-white/20 to-sky-300/15 pointer-events-none"></div>

      <!-- Sun Glow Behind Mount Fuji Peak -->
      <div class="absolute top-8 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-t from-[#FFEAA7]/40 to-white/50 blur-3xl pointer-events-none"></div>

      <!-- Traditional Red Torii Shrine Gate on Left Horizon -->
      <div class="absolute bottom-5 left-6 sm:left-10 opacity-90 drop-shadow-md z-10 pointer-events-none">
        <svg class="w-20 h-20 sm:w-24 sm:h-24" viewBox="0 0 120 120" fill="none">
          <path d="M5 24 Q60 16 115 24 L112 32 Q60 24 8 32 Z" fill="#E84855" />
          <path d="M5 24 L10 24 L8 32 L5 32 Z" fill="#F4A261" />
          <path d="M110 24 L115 24 L115 32 L112 32 Z" fill="#F4A261" />
          <rect x="15" y="42" width="90" height="5" rx="1.5" fill="#E84855" />
          <rect x="57" y="24" width="6" height="18" fill="#E84855" />
          <path d="M28 32 L24 120 L33 120 L35 32 Z" fill="#C73643" />
          <path d="M85 32 L87 120 L96 120 L92 32 Z" fill="#C73643" />
          <rect x="22" y="112" width="13" height="8" rx="1" fill="#4A4E69" />
          <rect x="85" y="112" width="13" height="8" rx="1" fill="#4A4E69" />
        </svg>
      </div>

      <!-- Steaming Ramen Bowl with Chopsticks on Right Bottom -->
      <div class="absolute bottom-4 right-6 sm:right-10 flex flex-col items-center drop-shadow-md z-10 pointer-events-none">
        <div class="flex gap-1.5 mb-1">
          <span class="w-1 h-4 bg-white/95 rounded-full animate-steam" style="animation-delay: 0s;"></span>
          <span class="w-1 h-5 bg-white rounded-full animate-steam" style="animation-delay: 0.8s;"></span>
          <span class="w-1 h-4 bg-white/95 rounded-full animate-steam" style="animation-delay: 1.4s;"></span>
        </div>
        <svg class="w-16 h-12 sm:w-20 sm:h-14" viewBox="0 0 100 80" fill="none">
          <path d="M10 25 C10 65, 90 65, 90 25 Z" fill="#E84855" />
          <path d="M15 25 C15 35, 85 35, 85 25 Z" fill="#FFF5EB" />
          <ellipse cx="50" cy="25" rx="40" ry="8" fill="#FCEADE" />
          <ellipse cx="50" cy="25" rx="36" ry="6" fill="#F4A261" />
          <circle cx="42" cy="25" r="4.5" fill="#FFFFFF" />
          <circle cx="42" cy="25" r="2.5" fill="#FFB7C5" />
          <circle cx="58" cy="24" r="2.5" fill="#7BA23F" />
          <circle cx="53" cy="26" r="2" fill="#7BA23F" />
          <circle cx="62" cy="27" r="1.8" fill="#7BA23F" />
          <line x1="12" y1="18" x2="88" y2="28" stroke="#8D5B4C" stroke-width="3" stroke-linecap="round" />
          <line x1="10" y1="23" x2="86" y2="33" stroke="#A66E5B" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Drifting Sakura Cherry Blossom Petals -->
      <div
        class="absolute w-3.5 h-3.5 bg-[#FFB7C5] rounded-[140%_15%_140%_15%] shadow-[0_1px_3px_rgba(255,150,170,0.6)] top-4 left-1/4 animate-sakura pointer-events-none"
        style="animation-duration: 7s;"
      ></div>
      <div
        class="absolute w-4 h-3.5 bg-[#FFB7C5] rounded-[140%_15%_140%_15%] shadow-[0_1px_3px_rgba(255,150,170,0.6)] top-12 left-1/2 animate-sakura pointer-events-none"
        style="animation-duration: 10s; animation-delay: 2s;"
      ></div>
      <div
        class="absolute w-3 h-3 bg-[#FFB7C5] rounded-[140%_15%_140%_15%] shadow-[0_1px_3px_rgba(255,150,170,0.6)] top-2 left-3/4 animate-sakura pointer-events-none"
        style="animation-duration: 8.5s; animation-delay: 4s;"
      ></div>
      <div
        class="absolute w-2.5 h-2.5 bg-[#FFB7C5] rounded-[140%_15%_140%_15%] shadow-[0_1px_3px_rgba(255,150,170,0.6)] top-20 left-10 animate-sakura pointer-events-none"
        style="animation-duration: 9s; animation-delay: 1.5s;"
      ></div>
      <div
        class="absolute w-3 h-2.5 bg-[#FFB7C5] rounded-[140%_15%_140%_15%] shadow-[0_1px_3px_rgba(255,150,170,0.6)] top-1/2 right-16 animate-sakura pointer-events-none"
        style="animation-duration: 11s; animation-delay: 3s;"
      ></div>
    </div>

    <!-- =======================================================================
         2. APPLE LIQUID GLASS (MACOS SONOMA DYNAMIC ABSTRACT WALLPAPER)
         ======================================================================= -->
    <div
      v-else-if="themeStore.currentTheme === 'apple'"
      class="absolute inset-0 transition-opacity duration-700 bg-[#0B0C16]"
    >
      <img
        v-if="appleImageLoaded"
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80"
        alt="Apple Sonoma Liquid Glass Wallpaper"
        class="w-full h-full object-cover object-center opacity-65 mix-blend-screen scale-105 pointer-events-none"
        @error="onAppleImgError"
      />
      <!-- Specular Acrylic Light Blooms -->
      <div class="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-purple-600/35 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-sky-500/30 blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>

      <!-- macOS Traffic Lights Indicator Bar (Top Left Accent) -->
      <div class="absolute top-3 left-4 flex items-center gap-1.5 opacity-70 z-10 pointer-events-none">
        <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-sm"></span>
        <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-sm"></span>
        <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-sm"></span>
      </div>
    </div>

    <!-- =======================================================================
         3. SIMPLE RETRO RADIO (1960s BRAUN / DIETER RAMS INTEGRATED CONSOLE)
         ======================================================================= -->
    <div
      v-else-if="themeStore.currentTheme === 'retro'"
      class="absolute inset-0 transition-opacity duration-700 bg-[#141210]"
    >
      <!-- Perforated Speaker Grille Mesh Texture Pattern across entire chassis -->
      <div
        class="absolute inset-0 opacity-25"
        style="background-image: radial-gradient(#2E2822 1.5px, transparent 1.5px); background-size: 7px 7px;"
      ></div>

      <!-- Warm Vacuum Tube Amber Ambient Center Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-64 rounded-full bg-[#D99B43]/10 blur-3xl pointer-events-none"></div>

      <!-- Cleanly Integrated Horizontal Radio Tuning Scale Glass Header Strip -->
      <div class="absolute top-11 left-0 right-0 h-8 sm:h-9 bg-[#191613]/95 border-b border-[#383025] flex items-center justify-between px-3 sm:px-6 z-10 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#D99B43] animate-pulse"></span>
          <span class="text-[9px] sm:text-[10px] font-mono font-extrabold text-[#D99B43] tracking-widest uppercase">
            BRAUN RT20 // FM
          </span>
        </div>

        <!-- Frequency Scale with Illuminated Analog Red Needle -->
        <div class="flex-1 max-w-xl mx-3 sm:mx-6 flex flex-col justify-center gap-0.5">
          <div class="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-[#A89885] font-semibold">
            <span>88</span>
            <span>92</span>
            <span>96</span>
            <span class="text-[#FAF5EE] font-bold">100.5</span>
            <span>104</span>
            <span>108 MHz</span>
          </div>
          <div class="relative h-1.5 w-full bg-[#0E0C0A] rounded border border-[#2D261E] overflow-hidden">
            <div class="absolute inset-0 flex justify-between px-1 items-center">
              <span v-for="i in 36" :key="i" class="w-px h-1 bg-[#4A4035]" :class="{ 'h-1.5 bg-[#8C7B68]': i % 4 === 0 }"></span>
            </div>
            <!-- Red Indicator Needle Line -->
            <div class="absolute top-0 bottom-0 left-[58%] w-0.5 bg-[#E84855] shadow-[0_0_6px_#E84855]"></div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-[9px] font-mono text-[#8C7B68]">
          <span class="text-[#D99B43] font-bold">AFC ON</span>
          <span class="hidden sm:inline">• HI-FI</span>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         4. CYBERPUNK 2077 HUD (NETRUNNER TACTICAL TELEMETRY & RETICLES)
         ======================================================================= -->
    <div
      v-else-if="themeStore.currentTheme === 'cyberpunk'"
      class="absolute inset-0 transition-opacity duration-700 bg-[#07070B]"
    >
      <!-- Neon Grid Floor Perspective Lines -->
      <div
        class="absolute inset-0 opacity-15"
        style="background: linear-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.15) 1px, transparent 1px); background-size: 40px 40px;"
      ></div>

      <!-- CRT Horizontal Scanlines Overlay -->
      <div
        class="absolute inset-0 opacity-25"
        style="background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.8) 50%); background-size: 100% 4px;"
      ></div>

      <!-- Live Tactical Netrunner Telemetry Ticker across Top -->
      <div class="absolute top-1 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-[#00F0FF]/60 select-none z-10 pointer-events-none">
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse"></span>
          [SYS: ONLINE] // ICE: BYPASSED // MEM: 84%
        </span>
        <span class="text-[#FCEE0A]/70 hidden sm:inline">
          LOC: NIGHT_CITY // SECTOR_04 // NEURAL_LINK: STABLE
        </span>
        <span class="text-[#FF0055]/70 font-bold">
          ネットランナー // HUD
        </span>
      </div>

      <!-- Tactical Targeting Reticle & Wireframe Compass in Center-Right Background -->
      <div class="absolute top-1/2 right-12 -translate-y-1/2 w-48 h-48 opacity-20 pointer-events-none">
        <svg class="w-full h-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#00F0FF" stroke-width="0.8" stroke-dasharray="4 2" />
          <circle cx="50" cy="50" r="35" stroke="#FCEE0A" stroke-width="0.5" />
          <line x1="50" y1="5" x2="50" y2="20" stroke="#00F0FF" stroke-width="1.5" />
          <line x1="50" y1="80" x2="50" y2="95" stroke="#00F0FF" stroke-width="1.5" />
          <line x1="5" y1="50" x2="20" y2="50" stroke="#00F0FF" stroke-width="1.5" />
          <line x1="80" y1="50" x2="95" y2="50" stroke="#00F0FF" stroke-width="1.5" />
        </svg>
      </div>

      <!-- Yellow Caution Hazard Stripes Accent (Bottom Left) -->
      <div
        class="absolute bottom-3 left-4 h-3 w-40 opacity-40 rounded-sm pointer-events-none"
        style="background: repeating-linear-gradient(45deg, #FCEE0A 0, #FCEE0A 8px, #000 8px, #000 16px);"
      ></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes steam {
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-12px) scaleX(1.3); opacity: 0; }
}

@keyframes sakura {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.9; }
  50% { transform: translate(60px, 80px) rotate(180deg); opacity: 0.7; }
  100% { transform: translate(140px, 180px) rotate(360deg); opacity: 0; }
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-steam {
  animation: steam 2.4s infinite ease-out;
}

.animate-sakura {
  animation: sakura 10s infinite linear;
}

.animate-spin-slow {
  animation: spinSlow 30s linear infinite;
}
</style>
