<script setup lang="ts">
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import ClimateCard from '@/components/cards/ClimateCard.vue';

const ha = useHomeAssistantStore();

const handleSetTemperature = (id: string, temp: number) => {
  ha.setTemperature(id, temp);
};

const handleSetHvacMode = (id: string, mode: string) => {
  ha.setHvacMode(id, mode);
};

const handleSetFanMode = (id: string, mode: string) => {
  ha.setFanMode(id, mode);
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-4">
    <ClimateCard
      v-for="climate in ha.climates"
      :key="climate.entity_id"
      :entity="climate"
      @set-temperature="handleSetTemperature"
      @set-hvac-mode="handleSetHvacMode"
      @set-fan-mode="handleSetFanMode"
    />
  </div>
</template>
