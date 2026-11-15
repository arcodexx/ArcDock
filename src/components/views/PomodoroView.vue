<script setup lang="ts">
import { ref } from 'vue';
import { usePomodoroStore } from '@/stores/pomodoro';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sliders,
  Flame,
  Sparkles,
  Maximize,
  Minimize
} from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const pomodoro = usePomodoroStore();

const showSettingsDrawer = ref(false);
const isZenMode = ref(false);

const handleSaveSettings = () => {
  pomodoro.saveSettings();
  showSettingsDrawer.value = false;
};
</script>

<template>
  <div class="h-full flex flex-col p-2 sm:p-4 max-w-4xl mx-auto w-full select-none overflow-y-auto custom-scrollbar relative">
    <!-- Compact Top Toolbar -->
    <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800 shrink-0">
      <div class="flex items-center gap-2">
        <Timer class="w-4 h-4 text-rose-400 shrink-0" />
        <span class="text-xs font-mono font-bold text-white uppercase tracking-wider">
          {{ pomodoro.phase === 'focus' ? 'Focus Session Active' : pomodoro.phase === 'idle' ? 'Timer Ready' : pomodoro.phaseLabel }}
        </span>
        <span class="text-xs text-neutral-500 font-mono hidden sm:inline">• {{ pomodoro.completedSessions }} sessions today</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="isZenMode = true"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-xs font-semibold tracking-wide transition-colors"
          title="Distraction-Free Full-Screen Focus"
        >
          <Maximize class="w-3.5 h-3.5 text-rose-400" />
          <span>Zen Focus</span>
        </button>

        <button
          @click="showSettingsDrawer = !showSettingsDrawer"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold tracking-wide transition-colors"
          :class="showSettingsDrawer
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>HA Automation</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area: Responsive Compact Layout -->
    <div class="flex-1 flex flex-row items-center justify-center gap-4 sm:gap-8 py-2 my-auto">
      <!-- Circular Dial (Responsive scale) -->
      <div class="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 shrink-0 flex items-center justify-center">
        <!-- SVG Progress Ring -->
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <!-- Track -->
          <circle
            cx="50"
            cy="50"
            r="44"
            class="stroke-neutral-800/80"
            stroke-width="6"
            fill="transparent"
          />
          <!-- Progress Indicator -->
          <circle
            cx="50"
            cy="50"
            r="44"
            :class="pomodoro.phase === 'focus' ? 'stroke-rose-500' : 'stroke-emerald-400'"
            stroke-width="6"
            stroke-linecap="round"
            fill="transparent"
            stroke-dasharray="276.46"
            :stroke-dashoffset="276.46 * (1 - pomodoro.progressPercent / 100)"
            class="transition-all duration-300"
          />
        </svg>

        <!-- Inside Ring Text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            :class="{
              'text-rose-400 bg-rose-500/10 border border-rose-500/20': pomodoro.phase === 'focus',
              'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break',
              'text-neutral-500 bg-neutral-900': pomodoro.phase === 'idle',
            }"
          >
            <span v-if="pomodoro.phase === 'focus'">🔥 Focus</span>
            <span v-else-if="pomodoro.phase === 'short_break'">☕ Short Break</span>
            <span v-else-if="pomodoro.phase === 'long_break'">🌴 Long Break</span>
            <span v-else>Ready</span>
          </span>

          <div class="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {{ pomodoro.formattedTime }}
          </div>

          <div class="flex items-center gap-1 text-[11px] text-neutral-400 mt-1 font-medium">
            <Flame class="w-3 h-3 text-amber-400 shrink-0" />
            <span>{{ pomodoro.completedSessions }} completed</span>
          </div>
        </div>
      </div>

      <!-- Controls & Presets Column -->
      <div class="flex flex-col items-start gap-3 shrink-0 max-w-xs">
        <!-- Main Action Buttons -->
        <div class="flex items-center gap-2">
          <button
            @click="pomodoro.togglePlayPause"
            class="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-transform active:scale-95 shadow-lg"
            :class="pomodoro.isRunning
              ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
              : 'bg-rose-500 text-black hover:bg-rose-400 shadow-rose-500/20'"
          >
            <Pause v-if="pomodoro.isRunning" class="w-3.5 h-3.5" />
            <Play v-else class="w-3.5 h-3.5 fill-current" />
            <span>{{ pomodoro.isRunning ? 'Pause' : 'Start Focus' }}</span>
          </button>

          <button
            @click="pomodoro.resetTimer"
            class="p-2 sm:p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Reset timer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>

          <button
            v-if="pomodoro.phase !== 'idle'"
            @click="pomodoro.skipPhase"
            class="p-2 sm:p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            title="Skip to next phase"
          >
            <SkipForward class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Presets -->
        <div class="space-y-1 w-full">
          <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Interval Presets</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              @click="pomodoro.setPreset(25, 5)"
              class="px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-colors"
              :class="pomodoro.focusDurationMinutes === 25
                ? 'bg-neutral-800 border-rose-500/50 text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'"
            >
              25m / 5m
            </button>

            <button
              @click="pomodoro.setPreset(50, 10)"
              class="px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-colors"
              :class="pomodoro.focusDurationMinutes === 50
                ? 'bg-neutral-800 border-rose-500/50 text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'"
            >
              50m / 10m
            </button>
          </div>
        </div>

        <!-- Automation Status Pill -->
        <div class="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-900/60 border border-neutral-800/80 px-2.5 py-1 rounded-xl">
          <Sparkles class="w-3 h-3 text-amber-400" />
          <span>HA Auto:</span>
          <span class="font-bold" :class="pomodoro.automateScenes ? 'text-emerald-400' : 'text-neutral-500'">
            {{ pomodoro.automateScenes ? 'Active' : 'Disabled' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Home Assistant Scene Drawer Modal -->
    <div
      v-if="showSettingsDrawer"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-md w-full space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <h3 class="text-base font-bold text-white">Smart Desk Scene Automation</h3>
          </div>
          <button @click="showSettingsDrawer = false" class="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-neutral-400 leading-relaxed">
          Automatically switch your room lighting and climate scenes in Home Assistant when you start a focus session or take a break.
        </p>

        <!-- Master Toggle -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div>
            <div class="text-xs font-bold text-white">Automate Desk Scenes</div>
            <div class="text-[10px] text-neutral-500">Trigger scenes on phase transitions</div>
          </div>
          <input
            v-model="pomodoro.automateScenes"
            type="checkbox"
            class="toggle-checkbox w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </div>

        <!-- Focus Scene Entity -->
        <div>
          <label class="block text-xs font-semibold text-neutral-300 mb-1">
            Focus Scene Entity ID
          </label>
          <input
            v-model="pomodoro.focusSceneEntity"
            type="text"
            placeholder="e.g. scene.focus"
            class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
          />
          <span class="block text-[10px] text-neutral-500 mt-1">
            Triggered when Focus timer starts (cool white desk lamp, optimal AC temp).
          </span>
        </div>

        <!-- Break Scene Entity -->
        <div>
          <label class="block text-xs font-semibold text-neutral-300 mb-1">
            Break Scene Entity ID
          </label>
          <input
            v-model="pomodoro.breakSceneEntity"
            type="text"
            placeholder="e.g. scene.relax"
            class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
          />
          <span class="block text-[10px] text-neutral-500 mt-1">
            Triggered when Break timer starts (warm amber lighting).
          </span>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="showSettingsDrawer = false"
            class="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSaveSettings"
            class="px-4 py-2 rounded-xl bg-rose-500 text-black font-semibold text-xs hover:bg-rose-400 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Dedicated Full-Screen Zen Focus Overlay -->
    <div
      v-if="isZenMode"
      class="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
    >
      <!-- Top Zen Bar -->
      <div class="w-full flex items-center justify-between text-neutral-500 text-xs font-mono">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="pomodoro.phase === 'focus' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'" />
          <span class="text-white font-bold uppercase tracking-wider">{{ pomodoro.phaseLabel }}</span>
          <span>• Session {{ pomodoro.completedSessions + 1 }}</span>
        </div>

        <button
          @click="isZenMode = false"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Exit Full-Screen Zen Focus"
        >
          <Minimize class="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>
      </div>

      <!-- Center Huge Dial -->
      <div class="relative w-52 h-52 sm:w-72 sm:h-72 flex items-center justify-center my-auto">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" class="stroke-neutral-900" stroke-width="5" fill="transparent" />
          <circle
            cx="50"
            cy="50"
            r="44"
            :class="pomodoro.phase === 'focus' ? 'stroke-rose-500' : 'stroke-emerald-400'"
            stroke-width="5"
            stroke-linecap="round"
            fill="transparent"
            stroke-dasharray="276.46"
            :stroke-dashoffset="276.46 * (1 - pomodoro.progressPercent / 100)"
            class="transition-all duration-300"
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-xs font-mono font-bold tracking-widest uppercase mb-1" :class="pomodoro.phase === 'focus' ? 'text-rose-400' : 'text-emerald-400'">
            {{ pomodoro.phase === 'focus' ? '🔥 Focus' : '☕ Break' }}
          </span>
          <div class="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-xl">
            {{ pomodoro.formattedTime }}
          </div>
          <div class="flex items-center gap-1 text-xs text-neutral-500 mt-2 font-mono">
            <span>{{ pomodoro.isRunning ? 'Active Sprint' : 'Paused' }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Zen Action Controls -->
      <div class="flex items-center gap-4">
        <button
          @click="pomodoro.togglePlayPause"
          class="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm tracking-wide transition-transform active:scale-95 shadow-xl cursor-pointer"
          :class="pomodoro.isRunning
            ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
            : 'bg-rose-500 text-black hover:bg-rose-400 shadow-rose-500/20'"
        >
          <Pause v-if="pomodoro.isRunning" class="w-4 h-4" />
          <Play v-else class="w-4 h-4 fill-current" />
          <span>{{ pomodoro.isRunning ? 'Pause' : 'Resume Focus' }}</span>
        </button>

        <button
          v-if="pomodoro.phase !== 'idle'"
          @click="pomodoro.skipPhase"
          class="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Skip to next phase"
        >
          <SkipForward class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
