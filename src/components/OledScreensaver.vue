<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useScreensaverStore } from '@/stores/screensaver';
import { useTimezonesStore } from '@/stores/timezones';
import { Moon, Music } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'wake'): void;
}>();

const spotify = useSpotifyStore();
const screensaverStore = useScreensaverStore();
const timezones = useTimezonesStore();

const hours = ref('00');
const minutes = ref('00');
const ampm = ref('');
const rawHours = ref(0);
const rawMinutes = ref(0);
const dateString = ref('');

const updateDateTime = () => {
  const now = new Date();
  rawHours.value = now.getHours();
  rawMinutes.value = now.getMinutes();

  if (timezones.timeFormat === '12h') {
    const h12 = rawHours.value % 12 || 12;
    hours.value = String(h12).padStart(2, '0');
    ampm.value = rawHours.value >= 12 ? 'PM' : 'AM';
  } else {
    hours.value = String(rawHours.value).padStart(2, '0');
    ampm.value = '';
  }

  minutes.value = String(rawMinutes.value).padStart(2, '0');
  dateString.value = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

watch(() => timezones.timeFormat, () => {
  updateDateTime();
});

// Word clock matrix calculation
const wordMatrixState = computed(() => {
  const h = rawHours.value % 12 || 12;
  const m = rawMinutes.value;

  // Round to nearest 5 minutes
  const roundedM = Math.round(m / 5) * 5;
  const nextH = (h % 12) + 1;

  const activeWords = new Set<string>(['IT', 'IS']);

  if (roundedM === 0 || roundedM === 60) {
    activeWords.add("O'CLOCK");
    activeWords.add(getHourWord(roundedM === 60 ? nextH : h));
  } else if (roundedM === 15) {
    activeWords.add('QUARTER');
    activeWords.add('PAST');
    activeWords.add(getHourWord(h));
  } else if (roundedM === 30) {
    activeWords.add('HALF');
    activeWords.add('PAST');
    activeWords.add(getHourWord(h));
  } else if (roundedM === 45) {
    activeWords.add('QUARTER');
    activeWords.add('TO');
    activeWords.add(getHourWord(nextH));
  } else if (roundedM < 30) {
    activeWords.add('PAST');
    activeWords.add(getMinuteWord(roundedM));
    activeWords.add(getHourWord(h));
  } else {
    activeWords.add('TO');
    activeWords.add(getMinuteWord(60 - roundedM));
    activeWords.add(getHourWord(nextH));
  }

  return activeWords;
});

const getMinuteWord = (min: number): string => {
  switch (min) {
    case 5: return 'FIVE';
    case 10: return 'TEN';
    case 20: return 'TWENTY';
    case 25: return 'TWENTYFIVE';
    default: return '';
  }
};

const getHourWord = (hour: number): string => {
  switch (hour) {
    case 1: return 'ONE';
    case 2: return 'TWO';
    case 3: return 'THREE';
    case 4: return 'FOUR';
    case 5: return 'FIVE';
    case 6: return 'SIX';
    case 7: return 'SEVEN';
    case 8: return 'EIGHT';
    case 9: return 'NINE';
    case 10: return 'TEN';
    case 11: return 'ELEVEN';
    case 12: return 'TWELVE';
    default: return 'TWELVE';
  }
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

const handleWake = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
  emit('wake');
};
</script>

<template>
  <Teleport to="body">
    <div
      @pointerdown.stop.prevent="handleWake"
      @click.stop.prevent="handleWake"
      class="oled-screensaver fixed z-[99999] bg-black text-white flex flex-col items-center justify-between p-6 sm:p-10 cursor-pointer select-none overflow-hidden transition-opacity duration-700"
      style="position: fixed; inset: -6px; width: calc(100vw + 12px); height: calc(100vh + 12px); background-color: #000000 !important; color: #FFFFFF !important; border: none !important;"
    >
      <!-- Top hint & Theme Switcher -->
      <!-- Top Status: Subtle Ambient Indicator -->
      <div class="w-full flex items-center justify-between text-xs font-mono tracking-widest text-neutral-600">
        <div class="flex items-center gap-2">
          <Moon class="w-3.5 h-3.5 text-neutral-600" />
          <span class="hidden sm:inline uppercase">AMOLED Standby • Tap anywhere to wake</span>
          <span class="sm:hidden uppercase">Standby</span>
        </div>
      </div>

    <!-- Center Display Area -->
    <div class="flex flex-col items-center text-center space-y-4 max-w-2xl px-4">
      <!-- THEME 1: Minimalist Typography (Inherits Active Theme Font & Styling) -->
      <template v-if="screensaverStore.theme === 'minimalist'">
        <div class="flex items-baseline justify-center gap-2.5 font-inherit">
          <span class="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight text-white/90 drop-shadow-sm font-inherit">
            {{ hours }}:{{ minutes }}
          </span>
          <span v-if="ampm" class="text-xl sm:text-2xl font-bold font-mono text-neutral-500 uppercase tracking-wider">
            {{ ampm }}
          </span>
        </div>
        <div class="text-sm sm:text-base lg:text-lg font-medium tracking-widest text-neutral-500 uppercase font-inherit">
          {{ dateString }}
        </div>
      </template>

      <!-- THEME 2: Retro Flip Clock (Explicit Deep OLED Black, never turned white) -->
      <template v-else-if="screensaverStore.theme === 'flip'">
        <div class="flex items-center gap-2.5 sm:gap-4 font-mono font-bold">
          <!-- Hours Flap -->
          <div class="relative w-28 sm:w-36 h-28 sm:h-36 bg-[#0E0E12] border border-[#1E1E26] rounded-2xl flex items-center justify-center text-5xl sm:text-7xl text-white shadow-2xl overflow-hidden">
            <div class="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 z-10"></div>
            <span>{{ hours }}</span>
          </div>
          <span class="text-4xl sm:text-6xl text-neutral-600 font-light">:</span>
          <!-- Minutes Flap -->
          <div class="relative w-28 sm:w-36 h-28 sm:h-36 bg-[#0E0E12] border border-[#1E1E26] rounded-2xl flex items-center justify-center text-5xl sm:text-7xl text-white shadow-2xl overflow-hidden">
            <div class="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 z-10"></div>
            <span>{{ minutes }}</span>
          </div>
          <!-- 12h AM/PM Flap Pill -->
          <div v-if="ampm" class="px-2.5 py-1.5 rounded-xl bg-[#0E0E12] border border-[#1E1E26] text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest shadow-lg">
            {{ ampm }}
          </div>
        </div>
        <div class="text-sm sm:text-base font-medium tracking-widest text-neutral-500 uppercase font-inherit">
          {{ dateString }}
        </div>
      </template>

      <!-- THEME 3: Word Clock Matrix -->
      <template v-else-if="screensaverStore.theme === 'word'">
        <div class="flex flex-col items-center gap-1 font-mono text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.35em] leading-relaxed uppercase">
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('IT') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">IT</span>
            <span :class="wordMatrixState.has('IS') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">IS</span>
            <span :class="wordMatrixState.has('HALF') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">HALF</span>
            <span :class="wordMatrixState.has('TEN') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">TEN</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('QUARTER') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">QUARTER</span>
            <span :class="wordMatrixState.has('TWENTY') || wordMatrixState.has('TWENTYFIVE') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">TWENTY</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('FIVE') && !wordMatrixState.has('O\'CLOCK') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">FIVE</span>
            <span :class="wordMatrixState.has('PAST') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">PAST</span>
            <span :class="wordMatrixState.has('TO') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">TO</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('ONE') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">ONE</span>
            <span :class="wordMatrixState.has('TWO') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">TWO</span>
            <span :class="wordMatrixState.has('THREE') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">THREE</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('FOUR') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">FOUR</span>
            <span :class="wordMatrixState.has('SIX') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">SIX</span>
            <span :class="wordMatrixState.has('SEVEN') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">SEVEN</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('EIGHT') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">EIGHT</span>
            <span :class="wordMatrixState.has('NINE') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">NINE</span>
            <span :class="wordMatrixState.has('ELEVEN') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">ELEVEN</span>
          </div>
          <div class="flex gap-3">
            <span :class="wordMatrixState.has('TWELVE') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">TWELVE</span>
            <span :class="wordMatrixState.has('O\'CLOCK') ? 'text-white font-bold drop-shadow' : 'text-neutral-800/60'">O'CLOCK</span>
          </div>
        </div>
      </template>

      <!-- Daily Stoic / Mindset Quote (Zero widget slot penalty, dimmed text) -->
      <div
        @click.stop="screensaverStore.nextQuote"
        class="mt-4 pt-3 border-t border-[#1C1C24] max-w-lg cursor-pointer hover:text-neutral-400 transition-colors"
        title="Tap to cycle quote"
      >
        <p class="text-xs sm:text-sm text-neutral-500 font-serif italic tracking-wide leading-relaxed">
          "{{ screensaverStore.currentQuote.quote }}"
        </p>
        <span class="block mt-1 text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
          — {{ screensaverStore.currentQuote.author }}
        </span>
      </div>

      <!-- Subtle Paused Track Indicator (if track exists, true black chip) -->
      <div
        v-if="spotify.currentTrack"
        class="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E0E12] border border-[#1E1E26] text-neutral-400 text-xs font-inherit"
      >
        <Music class="w-3.5 h-3.5 text-neutral-500" />
        <span class="max-w-[240px] truncate font-medium">
          {{ spotify.currentTrack.name }} • {{ spotify.currentTrack.artists[0]?.name }}
        </span>
      </div>
    </div>

    <!-- Bottom subtext -->
    <div class="text-[10px] font-mono tracking-wider text-neutral-700">
      ArcDock Standby — True-Black Pixel Extinction Active
    </div>
  </div>
  </Teleport>
</template>
