<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HassEntity } from '@/types/homeAssistant';
import { Lightbulb, SunMedium, Check } from 'lucide-vue-next';

const props = defineProps<{
  entity: HassEntity;
}>();

const emit = defineEmits<{
  (e: 'toggle', entityId: string): void;
  (e: 'set-brightness', entityId: string, percent: number): void;
}>();

const isAdjusting = ref(false);
const sliderRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

const isOn = computed(() => props.entity.state === 'on');

const brightnessPercent = computed(() => {
  if (!isOn.value) return 0;
  const raw = props.entity.attributes.brightness;
  if (raw === undefined || raw === null) return 100;
  return Math.round((raw / 255) * 100);
});

const calculatePercentFromPointer = (e: PointerEvent): number => {
  if (!sliderRef.value) return 0;
  const rect = sliderRef.value.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clampedX = Math.max(0, Math.min(rect.width, clickX));
  return Math.round((clampedX / rect.width) * 100);
};

const onPointerDown = (e: PointerEvent) => {
  isDragging.value = true;
  (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  const percent = calculatePercentFromPointer(e);
  emit('set-brightness', props.entity.entity_id, percent);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return;
  const percent = calculatePercentFromPointer(e);
  emit('set-brightness', props.entity.entity_id, percent);
};

const onPointerUp = (e: PointerEvent) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  try {
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
  } catch {}
};

const openBrightness = () => {
  isAdjusting.value = true;
};

const closeBrightness = () => {
  isAdjusting.value = false;
};

const setPreset = (percent: number) => {
  emit('set-brightness', props.entity.entity_id, percent);
};
</script>

<template>
  <div>
    <!-- Square Light Card -->
    <div
      @click="emit('toggle', entity.entity_id)"
      class="relative min-h-[92px] p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none active:scale-[0.98]"
      :class="[
        isOn
          ? 'bg-amber-500/15 border-amber-400/40 shadow-sm'
          : 'bg-neutral-900 border-white/5'
      ]"
    >
      <!-- Top Row: Light Icon + Single Brightness Trigger Icon -->
      <div class="flex items-center justify-between gap-1.5">
        <!-- Glow Icon -->
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
          :class="[
            isOn
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-white/5 text-neutral-500'
          ]"
        >
          <Lightbulb class="w-4 h-4" />
        </div>

        <!-- Brightness Trigger Button (Icon Only) -->
        <button
          v-if="isOn"
          @click.stop="openBrightness"
          title="Adjust Brightness"
          class="w-7 h-7 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 flex items-center justify-center transition-all active:scale-90"
        >
          <SunMedium class="w-3.5 h-3.5" />
        </button>

        <span
          v-else
          class="w-2 h-2 rounded-full bg-neutral-700 mr-1"
        />
      </div>

      <!-- Bottom: Friendly Name and Brightness % -->
      <div class="space-y-0.5 mt-1 min-w-0">
        <h4 class="text-xs font-bold text-white truncate leading-tight">
          {{ entity.attributes.friendly_name || entity.entity_id }}
        </h4>
        <p class="text-[10px] font-mono text-neutral-400 truncate leading-none">
          {{ isOn ? `${brightnessPercent}%` : 'Off' }}
        </p>
      </div>
    </div>

    <!-- Solid, Thumb-Friendly Brightness Modal (100% Solid Background, Zero Transparency) -->
    <div
      v-if="isAdjusting"
      @click.self="closeBrightness"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in duration-100"
    >
      <div class="w-full max-w-xs bg-neutral-900 border border-amber-400/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in zoom-in-95 duration-100 select-none">
        <!-- Modal Header -->
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-white truncate">
              {{ entity.attributes.friendly_name || entity.entity_id }}
            </h4>
            <p class="text-xs font-mono font-bold text-amber-300">
              {{ brightnessPercent }}% Brightness
            </p>
          </div>
          <button
            @click.stop="closeBrightness"
            class="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md active:scale-90"
          >
            <Check class="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <!-- Generous, Full-Width Touch Slider Track (Easy to Drag on Phone) -->
        <div
          ref="sliderRef"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          class="h-11 rounded-xl bg-neutral-800 border border-white/10 relative overflow-hidden cursor-pointer touch-none flex items-center select-none"
        >
          <!-- Active Filled Bar -->
          <div
            class="h-full bg-amber-400 transition-all duration-75 relative flex items-center"
            :style="{ width: `${brightnessPercent}%` }"
          >
            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-md" />
          </div>

          <div class="absolute inset-0 px-3 flex items-center justify-between text-xs font-semibold pointer-events-none text-neutral-300">
            <span class="flex items-center gap-1.5">
              <SunMedium class="w-4 h-4 text-amber-300" />
              <span>Slide to adjust</span>
            </span>
            <span class="font-mono text-white text-sm font-bold">{{ brightnessPercent }}%</span>
          </div>
        </div>

        <!-- Quick One-Tap Preset Chips -->
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="p in [25, 50, 75, 100]"
            :key="p"
            @click.stop="setPreset(p)"
            class="py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-90"
            :class="
              brightnessPercent === p
                ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-white/10'
            "
          >
            {{ p }}%
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
