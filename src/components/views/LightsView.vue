<script setup lang="ts">
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import LightCard from '@/components/cards/LightCard.vue';
import SwitchCard from '@/components/cards/SwitchCard.vue';
import { Power } from 'lucide-vue-next';

const ha = useHomeAssistantStore();

const handleToggleLight = (id: string) => {
  ha.toggleLight(id);
};

const handleSetBrightness = (id: string, percent: number) => {
  ha.setBrightness(id, percent);
};

const handleToggleSwitch = (id: string) => {
  ha.toggleSwitch(id);
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header with All-Off Action -->
    <div class="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-white/10">
      <div class="text-xs text-neutral-400">
        {{ ha.lights.length }} lights & {{ ha.switches.length }} appliances
      </div>

      <button
        @click="ha.activateScene('scene.all_off')"
        class="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Power class="w-3.5 h-3.5" />
        <span>Turn All Off</span>
      </button>
    </div>

    <!-- Grid of All Lights & Switches -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <LightCard
        v-for="light in ha.lights"
        :key="light.entity_id"
        :entity="light"
        @toggle="handleToggleLight"
        @set-brightness="handleSetBrightness"
      />
      <SwitchCard
        v-for="sw in ha.switches"
        :key="sw.entity_id"
        :entity="sw"
        @toggle="handleToggleSwitch"
      />
    </div>
  </div>
</template>
