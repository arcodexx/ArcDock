<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronLeft } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    minLeftPercent?: number;
    maxLeftPercent?: number;
    defaultLeftPercent?: number;
    storageKey?: string;
  }>(),
  {
    disabled: false,
    minLeftPercent: 35,
    maxLeftPercent: 72,
    defaultLeftPercent: 58,
    storageKey: 'arcdock_split_ratio',
  }
);

const containerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

const savedRatio = localStorage.getItem(props.storageKey);
const leftPercent = ref<number>(
  savedRatio ? Math.max(props.minLeftPercent, Math.min(props.maxLeftPercent, parseFloat(savedRatio))) : props.defaultLeftPercent
);

const isCollapsed = ref<boolean>(false);

const effectiveLeftPercent = computed(() => {
  if (props.disabled || isCollapsed.value) {
    return 100;
  }
  return leftPercent.value;
});

const effectiveRightPercent = computed(() => {
  if (props.disabled || isCollapsed.value) {
    return 0;
  }
  return 100 - leftPercent.value;
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const expand = () => {
  isCollapsed.value = false;
};

const collapse = () => {
  isCollapsed.value = true;
};

defineExpose({
  collapse,
  expand,
  toggleCollapse,
  isCollapsed,
});

// Pointer drag handlers
const onPointerDown = (e: PointerEvent) => {
  if (props.disabled || isCollapsed.value) return;
  isDragging.value = true;
  (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const newPercent = (offsetX / rect.width) * 100;
  const clamped = Math.max(props.minLeftPercent, Math.min(props.maxLeftPercent, newPercent));
  leftPercent.value = Math.round(clamped * 10) / 10;
};

const onPointerUp = (e: PointerEvent) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  try {
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
  } catch {}
  localStorage.setItem(props.storageKey, String(leftPercent.value));
};
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full flex overflow-hidden relative select-none"
  >
    <!-- Left Pane (e.g. Spotify Remote) -->
    <div
      class="h-full overflow-hidden flex flex-col"
      :class="{
        'transition-[width,padding] duration-300 ease-out': !isDragging,
        'pr-8 sm:pr-10': !disabled && isCollapsed,
      }"
      :style="{ width: `${effectiveLeftPercent}%` }"
    >
      <slot name="left" />
    </div>

    <!-- Draggable Divider (Touch-friendly drag bar with zero overlapping buttons) -->
    <div
      v-if="!disabled && !isCollapsed"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick="toggleCollapse"
      class="w-4 -mx-2 h-full relative z-20 cursor-col-resize group touch-none flex items-center justify-center shrink-0"
      title="Drag to resize / Double-tap to collapse"
    >
      <!-- Visual line -->
      <div
        class="w-0.5 h-full transition-colors group-hover:bg-amber-400 group-active:bg-amber-400"
        :class="isDragging ? 'bg-amber-400' : 'bg-white/10'"
      />

      <!-- Tactile Centered Grip Indicator (No superimposed button) -->
      <div
        class="absolute w-1.5 h-12 rounded-full transition-all flex flex-col items-center justify-center gap-1 pointer-events-none"
        :class="isDragging ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-neutral-600/60 group-hover:bg-amber-400/80'"
      >
        <span class="w-0.5 h-1 rounded-full bg-black/50" />
        <span class="w-0.5 h-1 rounded-full bg-black/50" />
        <span class="w-0.5 h-1 rounded-full bg-black/50" />
      </div>
    </div>

    <!-- Right Pane (e.g. Desk IoT Panel) -->
    <div
      v-if="!disabled"
      class="h-full overflow-hidden flex flex-col"
      :class="{ 'transition-[width] duration-300 ease-out': !isDragging }"
      :style="{ width: `${effectiveRightPercent}%` }"
    >
      <slot name="right" :collapse="collapse" />
    </div>

    <!-- Discreet Floating Expand Tab when collapsed (Desk Mode only) -->
    <button
      v-if="!disabled && isCollapsed"
      @click="expand"
      title="Expand Desk Controls"
      class="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 rounded-l-xl bg-neutral-900 border-l border-y border-white/20 hover:border-amber-400/60 text-neutral-400 hover:text-amber-400 shadow-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer"
    >
      <ChevronLeft class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
