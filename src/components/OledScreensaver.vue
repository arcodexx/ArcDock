<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { Moon, Music } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'wake'): void;
}>();

const spotify = useSpotifyStore();

const timeString = ref('');
const dateString = ref('');

const updateDateTime = () => {
  const now = new Date();
  timeString.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  dateString.value = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

let timer: number | null = null;
let minuteSyncTimeout: number | null = null;

onMounted(() => {
  updateDateTime();
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  minuteSyncTimeout = window.setTimeout(() => {
    updateDateTime();
    timer = window.setInterval(updateDateTime, 60_000);
  }, msToNextMinute);
});

onUnmounted(() => {
  if (minuteSyncTimeout) window.clearTimeout(minuteSyncTimeout);
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <div
    @click="emit('wake')"
    class="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between p-12 cursor-pointer select-none overflow-hidden transition-opacity duration-700"
  >
    <!-- Top hint -->
    <div class="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-600 uppercase">
      <Moon class="w-3.5 h-3.5 text-neutral-600" />
      <span>AMOLED Deep Sleep • Tap anywhere to wake</span>
    </div>

    <!-- Center: Glowing Minimalist Clock -->
    <div class="flex flex-col items-center text-center space-y-2">
      <div class="text-7xl lg:text-9xl font-black tracking-tight text-white/90 font-sans drop-shadow-sm">
        {{ timeString }}
      </div>
      <div class="text-lg lg:text-xl font-medium tracking-wide text-neutral-500 uppercase">
        {{ dateString }}
      </div>

      <!-- Subtle Paused Track Indicator -->
      <div
        v-if="spotify.currentTrack"
        class="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950 border border-neutral-900 text-neutral-400 text-xs"
      >
        <Music class="w-3.5 h-3.5 text-neutral-500" />
        <span class="max-w-[280px] truncate font-medium">
          {{ spotify.currentTrack.name }} • {{ spotify.currentTrack.artists[0]?.name }}
        </span>
      </div>
    </div>

    <!-- Bottom subtext -->
    <div class="text-[11px] font-mono tracking-wider text-neutral-700">
      ArcDock Standby — True-Black Pixel Extinction Active
    </div>
  </div>
</template>
