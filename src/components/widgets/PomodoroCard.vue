<script setup lang="ts">
import { usePomodoroStore } from '@/stores/pomodoro';
import { Play, Pause, SkipForward } from 'lucide-vue-next';

const pomodoro = usePomodoroStore();

defineEmits<{
  (e: 'expand'): void;
}>();
</script>

<template>
  <div
    @click="$emit('expand')"
    class="h-full flex flex-col justify-between cursor-pointer select-none group"
  >
    <!-- Center Timer Display -->
    <div class="flex-1 flex flex-col items-center justify-center py-1">
      <!-- Phase Indicator Pill -->
      <div
        class="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold"
        :class="{
          'text-rose-400 bg-rose-500/10 border border-rose-500/20': pomodoro.phase === 'focus',
          'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': pomodoro.phase === 'short_break' || pomodoro.phase === 'long_break',
          'text-neutral-400 bg-neutral-800 border border-neutral-700': pomodoro.phase === 'idle',
        }"
      >
        <span v-if="pomodoro.phase === 'focus'">🔥 Focus Session</span>
        <span v-else-if="pomodoro.phase === 'short_break'">☕ Short Break</span>
        <span v-else-if="pomodoro.phase === 'long_break'">🌴 Long Break</span>
        <span v-else>Ready to Focus</span>
      </div>

      <!-- Large Countdown -->
      <div class="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-sm group-hover:text-rose-300 transition-colors">
        {{ pomodoro.formattedTime }}
      </div>

      <!-- Mini Progress Line -->
      <div class="w-32 h-1 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
        <div
          class="h-full transition-all duration-300"
          :class="pomodoro.phase === 'focus' ? 'bg-rose-500' : 'bg-emerald-500'"
          :style="{ width: `${pomodoro.progressPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="flex items-center justify-center gap-2 pt-1 border-t border-white/5">
      <button
        @click.stop="pomodoro.togglePlayPause"
        class="flex items-center gap-1.5 min-h-[38px] px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
        :class="pomodoro.isRunning
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
          : 'bg-rose-500 text-black hover:bg-rose-400'"
      >
        <Pause v-if="pomodoro.isRunning" class="w-4 h-4" />
        <Play v-else class="w-4 h-4 fill-current" />
        <span>{{ pomodoro.isRunning ? 'Pause' : 'Start' }}</span>
      </button>

      <button
        v-if="pomodoro.phase !== 'idle'"
        @click.stop="pomodoro.skipPhase"
        class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
        title="Skip phase"
      >
        <SkipForward class="w-4 h-4" />
      </button>

      <span class="text-[10px] font-mono text-neutral-500 ml-1">
        {{ pomodoro.completedSessions }} today
      </span>
    </div>
  </div>
</template>
