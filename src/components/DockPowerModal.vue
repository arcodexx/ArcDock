<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import {
  X,
  RotateCcw,
  Server,
  Zap,
  RefreshCw,
  Power
} from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const ha = useHomeAssistantStore();

const isReloadingUi = ref(false);
const isRestartingHa = ref(false);
const haCountdown = ref(15);
const isRestartingServer = ref(false);

const handleReloadUi = () => {
  isReloadingUi.value = true;
  // If running in Fully Kiosk Browser, clear WebView disk cache directly
  try {
    (window as any).fully?.clearCache?.(true);
  } catch {}
  setTimeout(() => {
    const freshUrl = window.location.origin + window.location.pathname + '?t=' + Date.now();
    window.location.href = freshUrl;
  }, 200);
};

const handleRestartHa = async () => {
  if (isRestartingHa.value) return;
  isRestartingHa.value = true;
  haCountdown.value = 15;

  try {
    await ha.restartHomeAssistant();
  } catch (err) {
    console.warn('[DockPower] HA restart service call sent (or failed if not connected):', err);
  }

  const interval = window.setInterval(() => {
    if (haCountdown.value > 1) {
      haCountdown.value--;
    } else {
      window.clearInterval(interval);
      isRestartingHa.value = false;
    }
  }, 1000);
};

const handleRestartServer = async () => {
  if (isRestartingServer.value) return;
  isRestartingServer.value = true;

  try {
    await fetch('/api/system/restart-server', { method: 'POST' });
  } catch (err) {
    console.warn('[DockPower] Restart request dispatched:', err);
  }

  // Wait 2.5s for python to respawn and bind port 3000, then reload page
  setTimeout(() => {
    const freshUrl = window.location.origin + window.location.pathname + '?t=' + Date.now();
    window.location.href = freshUrl;
  }, 2500);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-md select-none"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-lg max-h-[94vh] rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl p-3.5 sm:p-5 flex flex-col overflow-hidden space-y-2.5 sm:space-y-3.5"
          @click.stop
        >
          <!-- Top Bar: Header & Close Button -->
          <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div class="p-1.5 sm:p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">
                <Power class="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide truncate">Dock Power & Restart</h3>
                <p class="text-[10px] sm:text-xs text-neutral-400 truncate">
                  Reload web app, respawn Python server, or restart Home Assistant
                </p>
              </div>
            </div>

            <button
              @click="emit('close')"
              class="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Close"
            >
              <X class="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <!-- Actions Grid: Scrollable if viewport is ultra-short -->
          <div class="flex-1 overflow-y-auto no-scrollbar space-y-2 sm:space-y-2.5 pt-0.5 pr-0.5">
            <!-- 1. Hard Reload Dashboard -->
            <div class="p-2.5 sm:p-3 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-colors">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <RotateCcw class="w-4 h-4 sm:w-5 sm:h-5" :class="{ 'animate-spin': isReloadingUi }" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white">Reload Dashboard</span>
                    <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      Instant • ~1s
                    </span>
                  </div>
                  <p class="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Flushes WebView cache & reloads to immediately show newly deployed code.
                  </p>
                </div>
              </div>

              <button
                @click="handleReloadUi"
                :disabled="isReloadingUi"
                class="min-h-[38px] sm:min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center"
              >
                {{ isReloadingUi ? 'Reloading...' : 'Reload UI' }}
              </button>
            </div>

            <!-- 2. Restart Home Assistant -->
            <div class="p-2.5 sm:p-3 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
                  <Zap class="w-4 h-4 sm:w-5 sm:h-5" :class="{ 'animate-pulse': isRestartingHa }" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white">Restart Home Assistant</span>
                    <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Core • ~15s
                    </span>
                  </div>
                  <p class="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Reboots Home Assistant Core event loop & SQLite engine without restarting phone.
                  </p>
                </div>
              </div>

              <button
                @click="handleRestartHa"
                :disabled="isRestartingHa"
                class="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                <RefreshCw v-if="isRestartingHa" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isRestartingHa ? `Rebooting (${haCountdown}s)` : 'Restart HA' }}</span>
              </button>
            </div>

            <!-- 3. Restart ArcDock Server -->
            <div class="p-2.5 sm:p-3 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-between gap-3 hover:border-violet-500/30 transition-colors">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20 shrink-0">
                  <Server class="w-4 h-4 sm:w-5 sm:h-5" :class="{ 'animate-pulse': isRestartingServer }" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white">Restart ArcDock Server</span>
                    <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                      Server • ~3s
                    </span>
                  </div>
                  <p class="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Restarts the Python HTTP server on port 3000 to apply backend updates.
                  </p>
                </div>
              </div>

              <button
                @click="handleRestartServer"
                :disabled="isRestartingServer"
                class="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs tracking-wide active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                <RefreshCw v-if="isRestartingServer" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isRestartingServer ? 'Restarting...' : 'Restart Server' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
