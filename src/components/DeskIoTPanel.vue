<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import LightCard from './cards/LightCard.vue';
import SwitchCard from './cards/SwitchCard.vue';
import ClimateCard from './cards/ClimateCard.vue';
import { 
  ChevronRight, 
  ChevronDown,
  Zap,
  Coffee,
  Moon,
  Power,
  Sparkles
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'collapse'): void;
}>();

const ha = useHomeAssistantStore();

const isSceneDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const displayedClimates = computed(() => {
  if (ha.pinnedEntityIds.length === 0) return ha.climates;
  return ha.climates.filter((c) => ha.pinnedEntityIds.includes(c.entity_id));
});

const displayedLights = computed(() => {
  if (ha.pinnedEntityIds.length === 0) return ha.lights;
  return ha.lights.filter((l) => ha.pinnedEntityIds.includes(l.entity_id));
});

const displayedSwitches = computed(() => {
  if (ha.pinnedEntityIds.length === 0) return ha.switches;
  return ha.switches.filter((s) => ha.pinnedEntityIds.includes(s.entity_id));
});

const scenesList = [
  { id: 'scene.focus', name: 'Focus', icon: Zap, color: 'text-amber-400' },
  { id: 'scene.relax', name: 'Relax & Warm', icon: Coffee, color: 'text-orange-400' },
  { id: 'scene.night', name: 'Night Mode', icon: Moon, color: 'text-blue-400' },
];

const handleToggleLight = (id: string) => {
  ha.toggleLight(id);
};

const handleSetBrightness = (id: string, percent: number) => {
  ha.setBrightness(id, percent);
};

const handleToggleSwitch = (id: string) => {
  ha.toggleSwitch(id);
};

const handleSetTemperature = (id: string, temp: number) => {
  ha.setTemperature(id, temp);
};

const handleSetHvacMode = (id: string, mode: string) => {
  ha.setHvacMode(id, mode);
};

const handleSetFanMode = (id: string, mode: string) => {
  ha.setFanMode(id, mode);
};

const handleSelectScene = (sceneId: string) => {
  ha.activateScene(sceneId);
  isSceneDropdownOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isSceneDropdownOpen.value = false;
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
  <aside class="h-full w-full flex flex-col bg-neutral-950/90 border-l border-white/10 select-none overflow-hidden">
    <!-- Panel Header: Uncluttered Minimal Toolbar (Zero Redundant Title Text) -->
    <header class="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/60 gap-1.5">
      <!-- Left: Smart Desk Label + Status Indicator -->
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-bold text-white tracking-wide">Smart Desk</span>
        <span
          v-if="ha.isMockMode"
          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25 shrink-0"
        >
          Mock Mode
        </span>
        <span
          v-else-if="ha.connectionStatus === 'connected'"
          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 shrink-0"
        >
          Live
        </span>
      </div>

      <!-- Right: Action Items (Scenes Dropdown + All-Off Button + Collapse Button) -->
      <div class="flex items-center gap-1 shrink-0" ref="dropdownRef">
        <!-- Compact Scenes Dropdown Trigger -->
        <div class="relative">
          <button
            @click.stop="isSceneDropdownOpen = !isSceneDropdownOpen"
            title="Quick Scenes"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-0.5 text-neutral-300 active:scale-95 cursor-pointer"
            :class="{ 'border-amber-400/50 bg-white/10 text-amber-300': isSceneDropdownOpen }"
          >
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            <ChevronDown class="w-2.5 h-2.5 text-neutral-400 transition-transform" :class="{ 'rotate-180': isSceneDropdownOpen }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isSceneDropdownOpen"
            class="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-neutral-900 border border-white/15 shadow-2xl p-1 z-40 animate-in fade-in zoom-in-95 duration-100"
          >
            <div class="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
              Scenes
            </div>
            <button
              v-for="scene in scenesList"
              :key="scene.id"
              @click="handleSelectScene(scene.id)"
              class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all active:scale-98"
              :class="[
                ha.activeSceneId === scene.id
                  ? 'bg-amber-400/20 text-amber-300 font-bold'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span class="flex items-center gap-2">
                <component :is="scene.icon" class="w-3.5 h-3.5" :class="scene.color" />
                <span class="text-[11px]">{{ scene.name }}</span>
              </span>
              <span v-if="ha.activeSceneId === scene.id" class="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
          </div>
        </div>

        <!-- Dedicated All-Off Button (Icon Only) -->
        <button
          @click="ha.activateScene('scene.all_off')"
          title="Turn All Off"
          class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20 active:scale-95 cursor-pointer"
        >
          <Power class="w-3.5 h-3.5" />
        </button>

        <!-- Collapse Panel Button -->
        <button
          @click="emit('collapse')"
          title="Collapse Panel"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/5 active:scale-95 cursor-pointer"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- Scrollable Content Grid (Square Tiles & Climate Card) -->
    <div class="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
      <div class="grid grid-cols-2 gap-2">
        <!-- Climate / AC Units -->
        <ClimateCard
          v-for="climate in displayedClimates"
          :key="climate.entity_id"
          :entity="climate"
          @set-temperature="handleSetTemperature"
          @set-hvac-mode="handleSetHvacMode"
          @set-fan-mode="handleSetFanMode"
          class="col-span-2"
        />

        <!-- Lights -->
        <LightCard
          v-for="light in displayedLights"
          :key="light.entity_id"
          :entity="light"
          @toggle="handleToggleLight"
          @set-brightness="handleSetBrightness"
        />

        <!-- Switches / Appliances -->
        <SwitchCard
          v-for="sw in displayedSwitches"
          :key="sw.entity_id"
          :entity="sw"
          @toggle="handleToggleSwitch"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
