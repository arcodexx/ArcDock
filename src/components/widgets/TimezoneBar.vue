<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTimezonesStore } from '@/stores/timezones';
import { Moon, Sun, Sunset } from 'lucide-vue-next';

const timezonesStore = useTimezonesStore();

defineEmits<{
  (e: 'expand'): void;
}>();

const now = ref(new Date());
let interval: number | null = null;

onMounted(() => {
  now.value = new Date();
  interval = window.setInterval(() => {
    now.value = new Date();
  }, 10_000);
});

onUnmounted(() => {
  if (interval) window.clearInterval(interval);
});
</script>

<template>
  <div
    @click="$emit('expand')"
    class="h-full flex flex-col justify-between cursor-pointer select-none group"
  >
    <!-- Top Header: Local Time Reference & Format -->
    <div class="flex items-center justify-between pb-1 text-[11px] font-mono border-b border-white/5">
      <div class="flex items-center gap-1.5 text-neutral-300">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <span class="font-bold text-white">Local:</span>
        <span class="font-bold text-cyan-300">{{ timezonesStore.getLocalTimeInfo(now).timeStr }}</span>
      </div>
      <button
        @click.stop="timezonesStore.toggleTimeFormat"
        class="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
        title="Toggle 12h/24h"
      >
        {{ timezonesStore.timeFormat }}
      </button>
    </div>

    <!-- Timezones Mini Grid (Compact) -->
    <div class="flex-1 overflow-y-auto space-y-1 py-0.5 pr-0.5 custom-scrollbar">
      <div
        v-for="slot in timezonesStore.slots"
        :key="slot.id"
        class="flex items-center justify-between p-1 px-2 rounded-lg bg-neutral-950/60 border border-neutral-800/50 hover:border-neutral-700/60 transition-colors"
      >
        <!-- Left: City & Label -->
        <div class="min-w-0 pr-1.5">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-white truncate">{{ slot.city }}</span>
            <span class="text-[8px] font-medium text-neutral-400 bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">
              {{ slot.label }}
            </span>
          </div>
          <div class="text-[8px] text-neutral-500 font-mono">
            {{ timezonesStore.getTimeInfo(slot.timezone, now).dayDelta }}
          </div>
        </div>

        <!-- Right: Time & Status -->
        <div class="flex flex-col items-end">
          <div class="text-xs font-black font-mono text-white tracking-tight">
            {{ timezonesStore.getTimeInfo(slot.timezone, now).timeStr }}
          </div>
          <div
            class="flex items-center gap-0.5 text-[8px] font-semibold px-1 py-0.2 rounded-full border mt-0.5"
            :class="timezonesStore.getTimeInfo(slot.timezone, now).colorClass"
          >
            <Sun v-if="timezonesStore.getTimeInfo(slot.timezone, now).status === 'working'" class="w-2 h-2" />
            <Sunset v-else-if="timezonesStore.getTimeInfo(slot.timezone, now).status === 'evening'" class="w-2 h-2" />
            <Moon v-else class="w-2 h-2" />
            <span>{{ timezonesStore.getTimeInfo(slot.timezone, now).statusLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
