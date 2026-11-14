<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { Lightbulb, Snowflake, Power, Plus, Minus } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-climate'): void;
}>();

const ha = useHomeAssistantStore();

const primaryAc = computed(() => ha.climates[0] || null);

const deskLamp = computed(() => ha.entities['light.desk_lamp'] || null);
const screenBar = computed(() => ha.entities['light.screen_bar'] || null);

const handleToggle = (id?: string) => {
  if (id) ha.toggleLight(id);
};

const handleTempStep = (delta: number) => {
  if (!primaryAc.value) return;
  const curr = primaryAc.value.attributes.temperature ?? 24;
  ha.setTemperature(primaryAc.value.entity_id, curr + delta);
};
</script>

<template>
  <div class="w-full h-10 flex items-center justify-between gap-1.5 p-1 rounded-xl bg-neutral-950/90 border border-white/10 select-none shrink-0">
    <!-- Quick Light 1: Desk Lamp -->
    <button
      v-if="deskLamp"
      @click="handleToggle(deskLamp.entity_id)"
      class="flex-1 h-full px-2 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 min-w-0"
      :class="[
        deskLamp.state === 'on'
          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 font-bold'
          : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
      ]"
      title="Toggle Desk Lamp"
    >
      <Lightbulb class="w-3.5 h-3.5 shrink-0" :class="deskLamp.state === 'on' ? 'text-amber-400' : 'text-neutral-500'" />
      <span class="text-[11px] truncate leading-none">Lamp</span>
    </button>

    <!-- Quick Light 2: Screen Lightbar -->
    <button
      v-if="screenBar"
      @click="handleToggle(screenBar.entity_id)"
      class="flex-1 h-full px-2 rounded-lg border text-left transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 min-w-0"
      :class="[
        screenBar.state === 'on'
          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 font-bold'
          : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
      ]"
      title="Toggle Lightbar"
    >
      <Lightbulb class="w-3.5 h-3.5 shrink-0" :class="screenBar.state === 'on' ? 'text-amber-400' : 'text-neutral-500'" />
      <span class="text-[11px] truncate leading-none">Bar</span>
    </button>

    <!-- Quick AC Pill with inline + / - or tap to view -->
    <div
      v-if="primaryAc"
      class="flex-1 h-full flex items-center justify-between px-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-white min-w-0"
    >
      <button
        @click="emit('open-climate')"
        class="flex items-center gap-1 cursor-pointer flex-1 min-w-0"
        title="Open AC Controls"
      >
        <Snowflake class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span class="text-[11px] font-mono font-black truncate leading-none">
          {{ primaryAc.attributes.temperature ?? 24 }}°
        </span>
      </button>

      <div class="flex items-center gap-0.5 shrink-0 ml-1">
        <button
          @click.stop="handleTempStep(-0.5)"
          class="w-5 h-5 rounded bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer text-white"
        >
          <Minus class="w-2.5 h-2.5" />
        </button>
        <button
          @click.stop="handleTempStep(0.5)"
          class="w-5 h-5 rounded bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer text-white"
        >
          <Plus class="w-2.5 h-2.5" />
        </button>
      </div>
    </div>

    <!-- One-Tap All Off Button -->
    <button
      @click="ha.activateScene('scene.all_off')"
      class="w-8 h-full rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
      title="Turn All Off"
    >
      <Power class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
