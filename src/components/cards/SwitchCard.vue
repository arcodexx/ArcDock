<script setup lang="ts">
import { computed } from 'vue';
import type { HassEntity } from '@/types/homeAssistant';
import { Fan, Power } from 'lucide-vue-next';

const props = defineProps<{
  entity: HassEntity;
}>();

const emit = defineEmits<{
  (e: 'toggle', entityId: string): void;
}>();

const isOn = computed(() => props.entity.state === 'on');

const isFan = computed(() => {
  const name = (props.entity.attributes.friendly_name || props.entity.entity_id).toLowerCase();
  return name.includes('fan');
});
</script>

<template>
  <div
    @click="emit('toggle', entity.entity_id)"
    class="relative min-h-[92px] p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none active:scale-[0.98]"
    :class="[
      isOn
        ? 'bg-emerald-500/15 border-emerald-400/40 shadow-sm'
        : 'bg-neutral-900/90 border-white/5'
    ]"
  >
    <!-- Top Row: Icon + State Dot -->
    <div class="flex items-center justify-between gap-1.5">
      <div
        class="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
        :class="[
          isOn
            ? 'bg-emerald-400 text-black shadow-sm'
            : 'bg-white/5 text-neutral-500'
        ]"
      >
        <component
          :is="isFan ? Fan : Power"
          class="w-4 h-4"
          :class="{ 'animate-spin': isFan && isOn }"
        />
      </div>

      <span
        class="w-2.5 h-2.5 rounded-full mr-1 transition-colors"
        :class="isOn ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-neutral-700'"
      />
    </div>

    <!-- Bottom: Friendly Name and Status (On/Off) -->
    <div class="space-y-0.5 mt-1 min-w-0">
      <h4 class="text-xs font-bold text-white truncate leading-tight">
        {{ entity.attributes.friendly_name || entity.entity_id }}
      </h4>
      <p class="text-[10px] font-mono text-neutral-400 truncate leading-none">
        {{ isOn ? 'On' : 'Off' }}
      </p>
    </div>
  </div>
</template>
