<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { HassEntity } from '@/types/homeAssistant';
import { 
  Snowflake, 
  Wind, 
  Droplets, 
  Flame, 
  Power, 
  Plus, 
  Minus, 
  Thermometer, 
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-vue-next';

const props = defineProps<{
  entity: HassEntity;
}>();

const emit = defineEmits<{
  (e: 'set-temperature', entityId: string, temp: number): void;
  (e: 'set-hvac-mode', entityId: string, mode: string): void;
  (e: 'set-fan-mode', entityId: string, mode: string): void;
}>();

const isModeMenuOpen = ref(false);
const isFanMenuOpen = ref(false);
const cardRef = ref<HTMLElement | null>(null);

const currentTemp = computed(() => {
  return props.entity.attributes.current_temperature ?? null;
});

const targetTemp = computed(() => {
  return props.entity.attributes.temperature ?? 24.0;
});

const minTemp = computed(() => props.entity.attributes.min_temp ?? 16);
const maxTemp = computed(() => props.entity.attributes.max_temp ?? 30);
const tempStep = computed(() => props.entity.attributes.target_temp_step ?? 0.5);

const currentHvacMode = computed(() => props.entity.state || 'off');
const currentFanMode = computed(() => props.entity.attributes.fan_mode || 'auto');

const isOff = computed(() => currentHvacMode.value === 'off');

const hvacModesList = computed(() => {
  const modes = props.entity.attributes.hvac_modes || ['cool', 'auto', 'dry', 'fan_only'];
  return modes.filter((m) => m !== 'off');
});

const fanModesList = computed(() => {
  return props.entity.attributes.fan_modes || ['auto', 'low', 'medium', 'high'];
});

const getHvacIcon = (mode: string) => {
  switch (mode) {
    case 'cool': return Snowflake;
    case 'auto': return Sparkles;
    case 'dry': return Droplets;
    case 'heat': return Flame;
    case 'fan_only': return Wind;
    default: return Power;
  }
};

const getHvacLabel = (mode: string) => {
  switch (mode) {
    case 'cool': return 'Cool';
    case 'auto': return 'Auto';
    case 'dry': return 'Dry';
    case 'heat': return 'Heat';
    case 'fan_only': return 'Fan';
    case 'off': return 'Off';
    default: return mode;
  }
};

const handleTempChange = (delta: number) => {
  const newTemp = Math.round((targetTemp.value + delta) / tempStep.value) * tempStep.value;
  const clamped = Math.max(minTemp.value, Math.min(maxTemp.value, Number(newTemp.toFixed(1))));
  emit('set-temperature', props.entity.entity_id, clamped);
};

const togglePower = () => {
  if (isOff.value) {
    emit('set-hvac-mode', props.entity.entity_id, 'cool');
  } else {
    emit('set-hvac-mode', props.entity.entity_id, 'off');
  }
  isModeMenuOpen.value = false;
  isFanMenuOpen.value = false;
};

const toggleModeMenu = () => {
  isModeMenuOpen.value = !isModeMenuOpen.value;
  if (isModeMenuOpen.value) isFanMenuOpen.value = false;
};

const toggleFanMenu = () => {
  isFanMenuOpen.value = !isFanMenuOpen.value;
  if (isFanMenuOpen.value) isModeMenuOpen.value = false;
};

const selectHvacMode = (mode: string) => {
  emit('set-hvac-mode', props.entity.entity_id, mode);
  isModeMenuOpen.value = false;
};

const selectFanMode = (mode: string) => {
  emit('set-fan-mode', props.entity.entity_id, mode);
  isFanMenuOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  if (cardRef.value && !cardRef.value.contains(e.target as Node)) {
    isModeMenuOpen.value = false;
    isFanMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    ref="cardRef"
    class="p-2.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none relative overflow-visible"
    :class="[
      isModeMenuOpen || isFanMenuOpen ? 'z-40' : 'z-10',
      isOff
        ? 'bg-neutral-900/90 border-white/5 text-neutral-400'
        : currentHvacMode === 'cool'
        ? 'bg-cyan-950/40 border-cyan-500/30 shadow-lg shadow-cyan-950/20 text-white'
        : currentHvacMode === 'auto'
        ? 'bg-indigo-950/40 border-indigo-500/30 shadow-lg shadow-indigo-950/20 text-white'
        : currentHvacMode === 'heat'
        ? 'bg-amber-950/40 border-amber-500/30 shadow-lg shadow-amber-950/20 text-white'
        : currentHvacMode === 'dry'
        ? 'bg-sky-950/40 border-sky-500/30 text-white'
        : 'bg-emerald-950/40 border-emerald-500/30 text-white'
    ]"
  >
    <!-- Header: Title + Ambient Current Temperature -->
    <div class="flex items-center justify-between gap-2 mb-1">
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
          :class="[
            isOff
              ? 'bg-white/5 text-neutral-500'
              : currentHvacMode === 'cool'
              ? 'bg-cyan-400 text-black shadow-sm'
              : currentHvacMode === 'auto'
              ? 'bg-indigo-400 text-black shadow-sm'
              : currentHvacMode === 'heat'
              ? 'bg-amber-400 text-black'
              : 'bg-emerald-400 text-black'
          ]"
        >
          <component :is="getHvacIcon(currentHvacMode)" class="w-4 h-4" />
        </div>
        <div class="truncate">
          <div class="text-xs font-bold leading-tight truncate">
            {{ entity.attributes.friendly_name || 'Air Conditioner' }}
          </div>
          <div class="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            {{ isOff ? 'Turned Off' : `${getHvacLabel(currentHvacMode)} Mode` }}
          </div>
        </div>
      </div>

      <!-- Current Room Temperature readout -->
      <div
        v-if="currentTemp !== null"
        class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-neutral-300 shrink-0"
        title="Current Room Temperature"
      >
        <Thermometer class="w-3.5 h-3.5 text-cyan-400" />
        <span>{{ currentTemp.toFixed(1) }}°C</span>
      </div>
    </div>

    <!-- Center: Temperature Target Adjustment Stepper -->
    <div class="flex items-center justify-between py-1 px-1">
      <!-- Minus Button (Finger friendly 44px hit area) -->
      <button
        @click.stop="handleTempChange(-0.5)"
        :disabled="isOff || targetTemp <= minTemp"
        class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-sm"
        title="Decrease Temperature"
      >
        <Minus class="w-5 h-5 text-white" />
      </button>

      <!-- Target Temperature Display -->
      <div class="flex items-center justify-center">
        <div class="flex items-baseline">
          <span class="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight" :class="isOff ? 'text-neutral-500' : 'text-white'">
            {{ targetTemp.toFixed(1) }}
          </span>
          <span class="text-sm font-semibold text-neutral-400 ml-0.5">°C</span>
        </div>
      </div>

      <!-- Plus Button (Finger friendly 44px hit area) -->
      <button
        @click.stop="handleTempChange(0.5)"
        :disabled="isOff || targetTemp >= maxTemp"
        class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-sm"
        title="Increase Temperature"
      >
        <Plus class="w-5 h-5 text-white" />
      </button>
    </div>

    <!-- Bottom Controls: Power Toggle + Mode Dropdown + Fan Dropdown -->
    <div class="pt-2 border-t border-white/5 flex items-center gap-2 relative">
      <!-- Power Button -->
      <button
        @click.stop="togglePower"
        class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
        :class="[
          !isOff
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
        ]"
        :title="isOff ? 'Turn AC On' : 'Turn AC Off'"
      >
        <Power class="w-4 h-4" />
      </button>

      <!-- Mode Dropdown Trigger Button -->
      <div class="relative flex-1">
        <button
          @click.stop="toggleModeMenu"
          class="w-full min-h-[40px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-98 cursor-pointer shadow-sm"
          :class="[
            isModeMenuOpen
              ? 'bg-white/20 border-white/40 text-white'
              : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
          ]"
        >
          <div class="flex items-center gap-1.5 truncate">
            <component :is="getHvacIcon(currentHvacMode)" class="w-4 h-4 text-cyan-400 shrink-0" />
            <span class="truncate">{{ getHvacLabel(currentHvacMode) }}</span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-neutral-400 transition-transform shrink-0" :class="{ 'rotate-180': isModeMenuOpen }" />
        </button>

        <!-- Mode Dropdown Popover Menu (Opens downwards) -->
        <div
          v-if="isModeMenuOpen"
          class="absolute top-full mt-1.5 left-0 w-36 max-h-48 overflow-y-auto bg-neutral-900/95 border border-white/20 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5 backdrop-blur-md"
        >
          <div class="text-[9px] uppercase font-bold text-neutral-400 px-2 py-1">AC Mode</div>
          <button
            v-for="m in hvacModesList"
            :key="m"
            @click.stop="selectHvacMode(m)"
            class="w-full min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer"
            :class="[
              currentHvacMode === m
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-neutral-300 hover:bg-white/10 hover:text-white'
            ]"
          >
            <div class="flex items-center gap-2">
              <component :is="getHvacIcon(m)" class="w-4 h-4" />
              <span>{{ getHvacLabel(m) }}</span>
            </div>
            <Check v-if="currentHvacMode === m" class="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      <!-- Fan Speed Dropdown Trigger Button -->
      <div v-if="!isOff && fanModesList.length > 1" class="relative flex-1">
        <button
          @click.stop="toggleFanMenu"
          class="w-full min-h-[40px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-98 cursor-pointer shadow-sm"
          :class="[
            isFanMenuOpen
              ? 'bg-white/20 border-white/40 text-white'
              : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
          ]"
        >
          <div class="flex items-center gap-1.5 truncate">
            <Wind class="w-4 h-4 text-sky-400 shrink-0" />
            <span class="truncate capitalize">{{ currentFanMode }}</span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-neutral-400 transition-transform shrink-0" :class="{ 'rotate-180': isFanMenuOpen }" />
        </button>

        <!-- Fan Speed Dropdown Popover Menu (Opens downwards) -->
        <div
          v-if="isFanMenuOpen"
          class="absolute top-full mt-1.5 right-0 w-32 max-h-48 overflow-y-auto bg-neutral-900/95 border border-white/20 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5 backdrop-blur-md"
        >
          <div class="text-[9px] uppercase font-bold text-neutral-400 px-2 py-1">Fan Speed</div>
          <button
            v-for="f in fanModesList"
            :key="f"
            @click.stop="selectFanMode(f)"
            class="w-full min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer capitalize"
            :class="[
              currentFanMode === f
                ? 'bg-sky-500/20 text-sky-300 font-bold'
                : 'text-neutral-300 hover:bg-white/10 hover:text-white'
            ]"
          >
            <span>{{ f }}</span>
            <Check v-if="currentFanMode === f" class="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
