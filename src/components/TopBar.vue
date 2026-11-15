<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { useNetworkStore } from '@/stores/network';
import {
  Settings,
  Armchair,
  Car,
  CloudSun,
  Lock,
  Delete
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'openSettings'): void;
  (e: 'toggleMode'): void;
  (e: 'openControlCenter'): void;
  (e: 'openFullScreen', target: 'weather' | 'network'): void;
}>();

const props = defineProps<{
  mode: 'desk' | 'car';
}>();

const weatherStore = useWeatherStore();
const networkStore = useNetworkStore();

const currentTime = ref('');
const showConfirmModal = ref(false);
const showPinModal = ref(false);
const enteredPin = ref('');
const pinError = ref(false);
const failedAttempts = ref(0);
const lockoutSeconds = ref(0);
let lockoutTimer: number | null = null;

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

let timer: number | null = null;
let minuteSyncTimeout: number | null = null;

// Touch swipe down detection on header (Desk Mode only)
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  if (props.mode === 'desk') {
    touchStartY = e.touches[0].clientY;
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (props.mode === 'desk') {
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (deltaY > 30) {
      emit('openControlCenter');
    }
  }
};

onMounted(() => {
  updateClock();
  weatherStore.startPolling();
  networkStore.startMonitoring();

  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  minuteSyncTimeout = window.setTimeout(() => {
    updateClock();
    timer = window.setInterval(updateClock, 60_000);
  }, msToNextMinute);
});

onUnmounted(() => {
  if (minuteSyncTimeout) window.clearTimeout(minuteSyncTimeout);
  if (timer) window.clearInterval(timer);
  if (lockoutTimer) window.clearInterval(lockoutTimer);
  weatherStore.stopPolling();
  networkStore.stopMonitoring();
});

const startLockout = (seconds: number = 30) => {
  lockoutSeconds.value = seconds;
  if (lockoutTimer) window.clearInterval(lockoutTimer);
  lockoutTimer = window.setInterval(() => {
    if (lockoutSeconds.value > 1) {
      lockoutSeconds.value--;
    } else {
      lockoutSeconds.value = 0;
      failedAttempts.value = 0;
      if (lockoutTimer) {
        window.clearInterval(lockoutTimer);
        lockoutTimer = null;
      }
    }
  }, 1000);
};

const handleModeClick = () => {
  if (props.mode === 'desk') {
    // Switching from Desk to Car Mode: confirm modal
    showConfirmModal.value = true;
  } else {
    // Switching from Car back to Desk Mode: require PIN unlock
    enteredPin.value = '';
    pinError.value = false;
    showPinModal.value = true;
  }
};

const confirmModeSwitch = () => {
  showConfirmModal.value = false;
  emit('toggleMode');
};

const cancelModeSwitch = () => {
  showConfirmModal.value = false;
};

// PIN Unlock Keypad Handlers
const handlePinDigit = (digit: string) => {
  if (lockoutSeconds.value > 0) return;

  if (enteredPin.value.length < 4) {
    enteredPin.value += digit;
    pinError.value = false;

    if (enteredPin.value.length === 4) {
      const savedPin = localStorage.getItem('arcdock_desk_pin') || '0000';
      if (enteredPin.value === savedPin) {
        showPinModal.value = false;
        enteredPin.value = '';
        failedAttempts.value = 0;
        emit('toggleMode');
      } else {
        pinError.value = true;
        failedAttempts.value++;
        if (failedAttempts.value >= 5) {
          startLockout(30);
        }
        setTimeout(() => {
          enteredPin.value = '';
          pinError.value = false;
        }, 800);
      }
    }
  }
};

const handlePinDelete = () => {
  if (lockoutSeconds.value > 0) return;
  enteredPin.value = enteredPin.value.slice(0, -1);
  pinError.value = false;
};

const cancelPinModal = () => {
  showPinModal.value = false;
  enteredPin.value = '';
  pinError.value = false;
};
</script>

<template>
  <header
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    class="h-11 w-full flex items-center justify-between px-3 sm:px-6 z-20 shrink-0 select-none bg-black/40 backdrop-blur-sm border-b border-white/5"
  >
    <!-- Left: Operational Mode Button + Mini Weather Pill -->
    <div class="flex items-center gap-2">
      <button
        @click="handleModeClick"
        class="p-2 rounded-xl border active:scale-90 transition-all cursor-pointer shadow-sm"
        :class="[
          mode === 'desk'
            ? 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-400/30 text-blue-400'
            : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-400'
        ]"
        :title="mode === 'desk' ? 'Desk Mode (Tap to switch to Car Mode)' : 'Car Remote Mode (Tap to unlock Desk Mode)'"
      >
        <Armchair v-if="mode === 'desk'" class="w-4 h-4" />
        <Car v-else class="w-4 h-4" />
      </button>

      <!-- Mini Weather Pill (Desk Mode ONLY) -->
      <button
        v-if="mode === 'desk'"
        @click="emit('openFullScreen', 'weather')"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all cursor-pointer"
        title="Open Weather Station"
      >
        <CloudSun class="w-3.5 h-3.5 text-sky-400" />
        <span>{{ weatherStore.weather?.currentTemp ?? 25 }}°C</span>
      </button>
    </div>

    <!-- Center: Digital Clock & Grab Handle Pill for Desk Control Center -->
    <div
      @click="mode === 'desk' ? emit('openControlCenter') : undefined"
      class="flex flex-col items-center justify-center px-4 py-1"
      :class="mode === 'desk' ? 'cursor-pointer group' : ''"
      :title="mode === 'desk' ? 'Swipe down or tap for Control Center' : 'ArcDock Car Remote'"
    >
      <div class="text-sm sm:text-base font-bold tracking-tight text-white/90 drop-shadow-sm font-sans">
        {{ currentTime }}
      </div>
      <!-- Discreet central grab pill ━ ONLY in Desk Mode -->
      <div v-if="mode === 'desk'" class="w-7 h-1 rounded-full bg-white/20 group-hover:bg-spotify-green transition-colors mt-0.5" />
    </div>

    <!-- Right: Ping Badge + Global Settings Trigger (Desk Mode ONLY - Hidden in Car Mode) -->
    <div class="flex items-center gap-2">
      <!-- Network Latency Badge (Desk Mode only) -->
      <button
        v-if="mode === 'desk'"
        @click="emit('openFullScreen', 'network')"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
        :class="[
          networkStore.status === 'stable' ? 'text-emerald-400' :
          networkStore.status === 'elevated' ? 'text-amber-400' :
          'text-rose-400'
        ]"
        title="Network Latency"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="[
            networkStore.status === 'stable' ? 'bg-emerald-400' :
            networkStore.status === 'elevated' ? 'bg-amber-400' :
            'bg-rose-400'
          ]"
        />
        <span>{{ networkStore.pingMs }}ms</span>
      </button>

      <!-- Settings Button (Desk Mode ONLY - Hidden in Car Mode for absolute privacy) -->
      <button
        v-if="mode === 'desk'"
        @click="emit('openSettings')"
        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>

    <!-- Mode Switch Confirmation Modal (Desk -> Car) Teleported to Body -->
    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        @click.self="cancelModeSwitch"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-100"
      >
        <div class="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
          <div class="flex items-center gap-3 text-amber-400">
            <Car class="w-6 h-6 shrink-0" />
            <h3 class="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Switch to Car Remote?
            </h3>
          </div>

          <p class="text-xs text-neutral-300 leading-relaxed">
            Maximizes Spotify to full-screen glanceable controls and <span class="font-bold text-white">locks access to personal smart home, GitHub, and settings</span>.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              @click="cancelModeSwitch"
              class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="confirmModeSwitch"
              class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-400/20"
            >
              Lock & Enter Car Mode
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Secure PIN Unlock Keypad Modal (Car -> Desk) Teleported to Body -->
    <Teleport to="body">
      <div
        v-if="showPinModal"
        @click.self="cancelPinModal"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none animate-in fade-in duration-100"
      >
        <div
          class="w-full max-w-xs bg-neutral-900 border rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-3.5 transition-all"
          :class="pinError ? 'border-rose-500 shadow-rose-500/20 animate-shake' : 'border-white/20'"
        >
          <!-- Header -->
          <div class="flex flex-col items-center text-center space-y-1">
            <div class="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Lock class="w-5 h-5" />
            </div>
            <h3 class="text-sm font-extrabold text-white">Enter Desk PIN</h3>
            <p class="text-[11px] text-neutral-400">
              {{ lockoutSeconds > 0 ? `Too many attempts. Wait ${lockoutSeconds}s` : pinError ? 'Incorrect PIN. Try again' : 'Protected personal desk command center' }}
            </p>
          </div>

          <!-- 4 PIN Dots -->
          <div class="flex items-center gap-3 py-1">
            <div
              v-for="i in 4"
              :key="i"
              class="w-3.5 h-3.5 rounded-full border transition-all"
              :class="[
                pinError
                  ? 'bg-rose-500 border-rose-400'
                  : enteredPin.length >= i
                  ? 'bg-amber-400 border-amber-300 scale-110'
                  : 'bg-white/5 border-white/20'
              ]"
            />
          </div>

          <!-- Touch Number Keypad (3x4 Grid) with generous touch targets -->
          <div class="grid grid-cols-3 gap-2 w-full pt-1" :class="{ 'opacity-50 pointer-events-none': lockoutSeconds > 0 }">
            <button
              v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
              :key="n"
              @click="handlePinDigit(n)"
              :disabled="lockoutSeconds > 0"
              class="h-11 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white font-mono font-bold text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-white/5"
            >
              {{ n }}
            </button>

            <!-- Bottom Row: Cancel, 0, Backspace -->
            <button
              @click="cancelPinModal"
              class="h-11 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-neutral-400 text-xs font-semibold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              @click="handlePinDigit('0')"
              :disabled="lockoutSeconds > 0"
              class="h-11 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white font-mono font-bold text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-white/5"
            >
              0
            </button>

            <button
              @click="handlePinDelete"
              :disabled="lockoutSeconds > 0"
              class="h-11 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-neutral-400 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              title="Delete"
            >
              <Delete class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>
