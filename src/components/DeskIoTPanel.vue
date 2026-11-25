<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import LightCard from './cards/LightCard.vue';
import SwitchCard from './cards/SwitchCard.vue';
import ClimateCard from './cards/ClimateCard.vue';
import HASettingsModal from './HASettingsModal.vue';
import { 
  ChevronRight, 
  ChevronDown,
  Zap,
  Coffee,
  Moon,
  Power,
  Sparkles,
  Settings
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'collapse'): void;
}>();

const ha = useHomeAssistantStore();

const isSceneDropdownOpen = ref(false);
const isSettingsOpen = ref(false);
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
        <button
          @click="isSettingsOpen = true"
          v-if="ha.connectionStatus === 'connected'"
          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 shrink-0 hover:bg-emerald-400/25 transition-colors cursor-pointer"
          title="Home Assistant Connected"
        >
          Live
        </button>
        <button
          @click="isSettingsOpen = true"
          v-else-if="ha.connectionStatus === 'connecting'"
          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-400/15 text-sky-300 border border-sky-400/25 shrink-0 hover:bg-sky-400/25 transition-colors cursor-pointer"
          title="Connecting..."
        >
          Connecting
        </button>
        <button
          @click="isSettingsOpen = true"
          v-else
          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0 hover:bg-neutral-700 transition-colors cursor-pointer"
          title="Home Assistant Disconnected - Tap to configure"
        >
          Offline
        </button>
      </div>

      <!-- Right: Action Items (Scenes Dropdown + All-Off + Settings + Collapse) -->
      <div class="flex items-center gap-1.5 shrink-0" ref="dropdownRef">
        <!-- Compact Scenes Dropdown Trigger -->
        <div class="relative">
          <button
            @click.stop="isSceneDropdownOpen = !isSceneDropdownOpen"
            title="Quick Scenes"
            class="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-0.5 text-neutral-300 active:scale-95 cursor-pointer"
            :class="{ 'border-amber-400/50 bg-white/10 text-amber-300': isSceneDropdownOpen }"
          >
            <Sparkles class="w-4 h-4 text-amber-400" />
            <ChevronDown class="w-3 h-3 text-neutral-400 transition-transform" :class="{ 'rotate-180': isSceneDropdownOpen }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isSceneDropdownOpen"
            class="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-neutral-900 border border-white/15 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-1"
          >
            <div class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
              Scenes
            </div>
            <button
              v-for="scene in scenesList"
              :key="scene.id"
              @click="handleSelectScene(scene.id)"
              class="w-full flex items-center justify-between min-h-[38px] px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all active:scale-98 cursor-pointer"
              :class="[
                ha.activeSceneId === scene.id
                  ? 'bg-amber-400/20 text-amber-300 font-bold'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span class="flex items-center gap-2">
                <component :is="scene.icon" class="w-4 h-4" :class="scene.color" />
                <span class="text-xs font-medium">{{ scene.name }}</span>
              </span>
              <span v-if="ha.activeSceneId === scene.id" class="w-2 h-2 rounded-full bg-amber-400" />
            </button>
          </div>
        </div>

        <!-- Dedicated All-Off Button (Icon Only) -->
        <button
          @click="ha.activateScene('scene.all_off')"
          title="Turn All Off"
          class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20 active:scale-95 cursor-pointer"
        >
          <Power class="w-4 h-4" />
        </button>

        <!-- Dedicated Home Assistant Settings Button -->
        <button
          @click="isSettingsOpen = true"
          title="Smart Desk & Home Assistant Settings"
          class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/5 active:scale-95 cursor-pointer"
        >
          <Settings class="w-4 h-4" />
        </button>

        <!-- Collapse Panel Button -->
        <button
          @click="emit('collapse')"
          title="Collapse Panel"
          class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/5 active:scale-95 cursor-pointer"
        >
          <ChevronRight class="w-4 h-4" />
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

    <!-- Dedicated Home Assistant Settings & LAN QR Modal -->
    <HASettingsModal
      :show="isSettingsOpen"
      @close="isSettingsOpen = false"
    />
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
