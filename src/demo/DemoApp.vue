<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Maximize2,
  Minimize2,
  Moon,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Car,
  Github,
  ExternalLink,
  Palette,
  Smartphone,
} from 'lucide-vue-next';

const isFullscreen = ref(false);
const isPortrait = ref(false);
const isMobileDevice = ref(false);
const dismissedRotatePrompt = ref(false);
const activeTheme = ref<string>('default');
const isPlaying = ref(true);
const dockIframe = ref<HTMLIFrameElement | null>(null);

const dockSrc = computed(() => {
  const url = new URL(window.location.href);
  let pathname = url.pathname;
  if (!pathname.endsWith('/')) {
    if (pathname.endsWith('.html')) {
      pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else {
      pathname = pathname + '/';
    }
  }
  if (pathname.endsWith('/demo/')) {
    pathname = pathname.slice(0, -6) + '/';
  }
  return `${url.origin}${pathname}demo-dock.html`;
});

const themes = [
  { id: 'default', name: 'OLED Black', icon: '🌑' },
  { id: 'japan', name: 'Japan Zen', icon: '🌸' },
  { id: 'apple', name: 'Apple Glass', icon: '🍏' },
  { id: 'retro', name: 'Retro Radio', icon: '📻' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡' },
];

const checkOrientation = () => {
  const portrait = window.innerWidth < window.innerHeight && window.innerWidth < 800;
  isPortrait.value = portrait;
  isMobileDevice.value = window.innerWidth < 800 || window.innerHeight < 550;
  if (!portrait) {
    dismissedRotatePrompt.value = false;
  }
};

const sendToDock = (message: any) => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((f) => {
    try {
      f.contentWindow?.postMessage(message, '*');
    } catch {}
  });
};

const onIframeLoad = (e?: Event) => {
  // Sync default theme as soon as the iframe finishes loading
  sendToDock({ type: 'SET_THEME', theme: activeTheme.value });
  if (e && e.target) {
    try {
      (e.target as HTMLIFrameElement).contentWindow?.postMessage(
        { type: 'SET_THEME', theme: activeTheme.value },
        '*'
      );
    } catch {}
  }
};

const selectTheme = (themeId: string) => {
  activeTheme.value = themeId;
  sendToDock({ type: 'SET_THEME', theme: themeId });
};

const triggerScreensaver = () => {
  sendToDock({ type: 'TRIGGER_SCREENSAVER' });
};

const togglePlayback = () => {
  isPlaying.value = !isPlaying.value;
  sendToDock({ type: 'TOGGLE_PLAYBACK' });
};

const nextTrack = () => {
  sendToDock({ type: 'NEXT_TRACK' });
};

const prevTrack = () => {
  sendToDock({ type: 'PREV_TRACK' });
};

const toggleCarMode = () => {
  sendToDock({ type: 'TOGGLE_MODE' });
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// Listen for messages from dock iframe
const handleMessage = (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'DOCK_READY') {
    // Sync default theme on load
    sendToDock({ type: 'SET_THEME', theme: activeTheme.value });
  }
};

onMounted(() => {
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  window.addEventListener('message', handleMessage);

  // Read saved theme if present
  const saved = localStorage.getItem('arcdock_theme');
  if (saved && themes.some((t) => t.id === saved)) {
    activeTheme.value = saved;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  window.removeEventListener('orientationchange', checkOrientation);
  window.removeEventListener('message', handleMessage);
});
</script>

<template>
  <!-- Fullscreen Mode Overlay -->
  <div v-if="isFullscreen" class="fixed inset-0 z-[999] bg-black w-screen h-screen">
    <iframe
      ref="dockIframe"
      :src="dockSrc"
      @load="onIframeLoad"
      class="w-full h-full border-0 select-none"
    ></iframe>
    <button
      @click="toggleFullscreen"
      class="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 shadow-lg text-xs font-medium backdrop-blur-md transition-all active:scale-95"
      title="Exit Fullscreen View"
    >
      <Minimize2 class="w-3.5 h-3.5" />
      <span>Exit Fullscreen</span>
    </button>
  </div>

  <!-- Regular Option A Showcase Layout -->
  <div v-else class="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 pb-12">
    <!-- Mobile Portrait Rotate Pop-up Modal -->
    <div
      v-if="isPortrait && !dismissedRotatePrompt"
      class="fixed inset-0 z-[250] bg-zinc-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200"
    >
      <div class="max-w-xs w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
        <!-- Animated Phone Rotating Graphic -->
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 relative">
          <Smartphone class="w-8 h-8 animate-phone-rotate text-emerald-400" />
        </div>

        <h3 class="text-base font-bold text-white mb-1.5">Rotate to Landscape</h3>
        <p class="text-xs text-zinc-400 leading-relaxed mb-6">
          ArcDock is crafted for landscape touch displays. Turn your phone horizontally to experience the 120Hz desk dock with full touch controls.
        </p>

        <button
          @click="dismissedRotatePrompt = true"
          class="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition active:scale-95"
        >
          Continue in Portrait Anyway
        </button>
      </div>
    </div>

    <!-- Mobile Landscape Quick Fullscreen Helper Banner -->
    <div
      v-if="isMobileDevice && !isPortrait"
      class="w-full bg-emerald-500/15 border-b border-emerald-500/30 px-3 py-1.5 text-center text-xs text-emerald-300 flex items-center justify-center gap-2 cursor-pointer active:bg-emerald-500/25 transition shrink-0"
      @click="toggleFullscreen"
    >
      <Maximize2 class="w-3.5 h-3.5 text-emerald-400" />
      <span>Mobile detected: <strong>Tap here for 100% Fullscreen Dock</strong></span>
    </div>

    <!-- Top Header Navigation -->
    <header class="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-11 sm:h-12 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              ArcDock
            </span>
            <span class="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Live Demo
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            @click="toggleFullscreen"
            class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition active:scale-95"
          >
            <Maximize2 class="w-3.5 h-3.5 text-zinc-400" />
            <span class="hidden sm:inline">Go Fullscreen</span>
            <span class="sm:hidden">Fullscreen</span>
          </button>

          <a
            href="https://github.com/arcodexx/ArcDock"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Github class="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ExternalLink class="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>
    </header>

    <!-- Main Showcase Section -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center">
      <!-- Interactive Demo Toolbar -->
      <div class="w-full max-w-4xl mb-3 sm:mb-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0">
        <!-- Theme Switcher Pills -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span class="text-xs text-zinc-400 font-medium mr-1 flex items-center gap-1 hidden sm:flex">
            <Palette class="w-3.5 h-3.5 text-zinc-400" />
            Themes:
          </span>
          <button
            v-for="t in themes"
            :key="t.id"
            @click="selectTheme(t.id)"
            class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all active:scale-95 whitespace-nowrap"
            :class="
              activeTheme === t.id
                ? 'bg-emerald-500 text-black font-semibold shadow-sm shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/40'
            "
          >
            <span>{{ t.icon }}</span>
            <span>{{ t.name }}</span>
          </button>
        </div>

        <!-- Quick Interactive Triggers -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Screensaver Trigger -->
          <button
            @click="triggerScreensaver"
            class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-xs font-medium transition active:scale-95"
            title="Preview OLED screensaver sleep mode"
          >
            <Moon class="w-3 h-3 text-cyan-400" />
            <span>Screensaver</span>
          </button>

          <!-- Music Controls Simulation -->
          <div class="flex items-center bg-zinc-800/80 rounded-lg border border-zinc-700/50 p-0.5">
            <button
              @click="prevTrack"
              class="p-1 hover:text-white text-zinc-400 transition rounded"
              title="Previous Track"
            >
              <SkipBack class="w-3 h-3" />
            </button>
            <button
              @click="togglePlayback"
              class="px-2 py-0.5 hover:text-white text-zinc-200 text-xs font-medium flex items-center gap-1 transition"
              title="Play / Pause"
            >
              <component :is="isPlaying ? Pause : Play" class="w-3 h-3 text-emerald-400" />
            </button>
            <button
              @click="nextTrack"
              class="p-1 hover:text-white text-zinc-400 transition rounded"
              title="Next Track"
            >
              <SkipForward class="w-3 h-3" />
            </button>
          </div>

          <!-- Car Mode Toggle -->
          <button
            @click="toggleCarMode"
            class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-xs font-medium transition active:scale-95"
            title="Switch between Desk Mode & Car Mode (Exit PIN: 0000)"
          >
            <Car class="w-3 h-3 text-amber-400" />
            <span>Car Mode</span>
            <span class="text-[10px] text-zinc-400 bg-zinc-950/60 px-1 rounded">PIN 0000</span>
          </button>
        </div>
      </div>

      <!-- Smartphone Frame Mockup (Option A) -->
      <div class="w-full flex justify-center items-center relative py-1 sm:py-3 shrink-0">
        <!-- Ambient Desk Glow underneath frame -->
        <div class="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 rounded-[60px] blur-3xl opacity-70 pointer-events-none"></div>

        <!-- Phone Chassis: Responsive width & aspect ratio with minimum height on mobile -->
        <div
          class="relative w-full max-w-[960px] lg:max-w-[1020px] bg-zinc-900 rounded-[20px] sm:rounded-[36px] md:rounded-[40px] border-[4px] sm:border-[8px] md:border-[10px] border-zinc-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-300 mx-auto"
          style="aspect-ratio: 20 / 9; min-height: 240px;"
        >
          <!-- Subtle Top Bezel Punch Hole Camera (Landscape orientation) -->
          <div class="absolute top-1/2 left-3 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-800/80 z-30 pointer-events-none flex items-center justify-center opacity-80 hidden sm:flex">
            <div class="w-1.5 h-1.5 rounded-full bg-zinc-900"></div>
          </div>

          <!-- Subtle Speaker Slit -->
          <div class="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-7 rounded-full bg-zinc-700/60 z-30 pointer-events-none hidden sm:block"></div>

          <!-- Live Embedded ArcDock Instance -->
          <iframe
            ref="dockIframe"
            :src="dockSrc"
            @load="onIframeLoad"
            class="w-full h-full border-0 select-none bg-black"
          ></iframe>
        </div>
      </div>

      <!-- Desk Stand Perspective Reflection Footprint -->
      <div class="w-72 h-2.5 bg-zinc-800/40 rounded-full blur-md -mt-1 mb-5 opacity-80 pointer-events-none shrink-0 hidden sm:block"></div>

      <!-- Feature Highlights & Quick Guide -->
      <div class="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left shrink-0 mt-3 sm:mt-0">
        <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">🎵</span>
            <h3 class="text-xs font-semibold text-zinc-100">Spotify Connect Remote</h3>
          </div>
          <p class="text-[11px] text-zinc-400 leading-snug">
            Controls playback on connected speakers or workstation. Tap album art to browse queues, playlists & catalog.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">🏠</span>
            <h3 class="text-xs font-semibold text-zinc-100">Smart Desk IoT Core</h3>
          </div>
          <p class="text-[11px] text-zinc-400 leading-snug">
            Connected to local Home Assistant. Toggle desk lights, dim brightness, or adjust SmartThings AC climate.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">🛠️</span>
            <h3 class="text-xs font-semibold text-zinc-100">Glanceable Widgets</h3>
          </div>
          <p class="text-[11px] text-zinc-400 leading-snug">
            Swipe down from top bar for Control Center drawer. Open calendar meetings, GitHub streaks, deliveries & timer.
          </p>
        </div>
      </div>

      <!-- Setup Callout Footer -->
      <div class="w-full max-w-4xl mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-indigo-950/30 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
        <div>
          <h4 class="text-[11px] font-semibold text-zinc-200 uppercase tracking-wider mb-0.5">Turn Your Spare Phone into ArcDock</h4>
          <p class="text-[11px] text-zinc-400">Works on standard Android with Termux. No root, bootloader unlocking, or external server needed.</p>
        </div>
        <a
          href="https://github.com/arcodexx/ArcDock#readme"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition active:scale-95 whitespace-nowrap shadow-sm"
        >
          View Setup Guide →
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@keyframes phone-rotate {
  0%, 15% {
    transform: rotate(0deg);
  }
  45%, 80% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
.animate-phone-rotate {
  animation: phone-rotate 3s ease-in-out infinite;
}
</style>
