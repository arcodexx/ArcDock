<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  Settings,
  Armchair,
  Car,
  Check,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'openSettings'): void;
  (e: 'toggleMode'): void;
}>();

defineProps<{
  mode: 'desk' | 'car';
}>();

const currentTime = ref('');
const showConfirmModal = ref(false);

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

let timer: number | null = null;
let minuteSyncTimeout: number | null = null;

onMounted(() => {
  updateClock();
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  minuteSyncTimeout = window.setTimeout(() => {
    updateClock();
    timer = window.setInterval(updateClock, 60_000);
  }, msToNextMinute);
});

onUnmounted(() => {
  if (minuteSyncTimeout) window.clearTimeout(minuteSyncTimeout);
  if (timer) window.clearInterval(timer);
});

const handleModeClick = () => {
  showConfirmModal.value = true;
};

const confirmModeSwitch = () => {
  showConfirmModal.value = false;
  emit('toggleMode');
};

const cancelModeSwitch = () => {
  showConfirmModal.value = false;
};
</script>

<template>
  <header class="h-11 w-full flex items-center justify-between px-3 sm:px-6 z-20 shrink-0 select-none">
    <!-- Left: Operational Mode Button (Icon Only) -->
    <div class="flex items-center gap-2">
      <button
        @click="handleModeClick"
        class="p-2 rounded-xl border active:scale-90 transition-all cursor-pointer shadow-sm"
        :class="[
          mode === 'desk'
            ? 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-400/30 text-blue-400'
            : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-400'
        ]"
        :title="mode === 'desk' ? 'Desk Mode (Tap to switch)' : 'Car Mode (Tap to switch)'"
      >
        <Armchair v-if="mode === 'desk'" class="w-4 h-4" />
        <Car v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Center: Digital Clock -->
    <div class="text-sm sm:text-base font-bold tracking-tight text-white/90 drop-shadow-sm font-sans">
      {{ currentTime }}
    </div>

    <!-- Right: Global Settings Trigger -->
    <div class="flex items-center gap-2">
      <button
        @click="emit('openSettings')"
        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>

    <!-- Mode Switch Confirmation Modal (Teleported to Body with z-[100] so drag line never overlaps) -->
    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        @click.self="cancelModeSwitch"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4 select-none animate-in fade-in duration-100"
      >
        <div class="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
          <!-- Modal Icon + Title -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :class="mode === 'desk' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'"
            >
              <Car v-if="mode === 'desk'" class="w-5 h-5" />
              <Armchair v-else class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white leading-tight">
                Switch to {{ mode === 'desk' ? 'Car Mode' : 'Desk Mode' }}?
              </h3>
            </div>
          </div>

          <!-- Plain, Friendly Description -->
          <p class="text-xs text-neutral-300 leading-relaxed">
            <template v-if="mode === 'desk'">
              Smart home controls will be turned off to keep the focus on music and driving.
            </template>
            <template v-else>
              Turn on your desk lights and smart home controls.
            </template>
          </p>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-1">
            <button
              @click="cancelModeSwitch"
              class="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 font-semibold text-xs active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              @click="confirmModeSwitch"
              class="flex-1 py-2 px-3 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
              :class="[
                mode === 'desk'
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                  : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
              ]"
            >
              <Check class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Switch</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>
