<script setup lang="ts">
import { onMounted } from 'vue';
import { useCalendarStore } from '@/stores/calendar';
import { Calendar, Clock, AlertCircle } from 'lucide-vue-next';

const calendar = useCalendarStore();

defineEmits<{
  (e: 'expand'): void;
}>();

onMounted(() => {
  calendar.fetchCalendar();
});
</script>

<template>
  <div
    @click="$emit('expand')"
    class="h-full flex flex-col justify-between cursor-pointer select-none group"
  >
    <!-- Date & Next Up Status Bar -->
    <div class="flex items-center justify-between pb-1 text-[11px] font-mono">
      <div class="flex items-center gap-1.5 text-neutral-400">
        <Calendar class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span class="font-bold text-white">{{ calendar.currentDateFormatted }}</span>
      </div>

      <!-- Radar or Time Status -->
      <div v-if="calendar.nextUpcomingEvent">
        <span
          v-if="calendar.nextUpcomingEvent.isOngoing"
          class="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Now</span>
        </span>
        <span
          v-else-if="calendar.nextUpcomingEvent.minutesUntil <= 30"
          class="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
        >
          <AlertCircle class="w-3 h-3" />
          <span>In {{ calendar.nextUpcomingEvent.minutesUntil }}m</span>
        </span>
        <span v-else class="text-[10px] text-neutral-500 font-mono">
          {{ calendar.nextUpcomingEvent.formattedTimeRange }}
        </span>
      </div>
    </div>

    <!-- Next Event Content -->
    <div v-if="calendar.nextUpcomingEvent" class="py-1">
      <h3 class="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
        {{ calendar.nextUpcomingEvent.title }}
      </h3>
      <div class="flex items-center justify-between pt-1 text-[10px] text-neutral-400 font-mono">
        <span class="truncate max-w-[140px]">{{ calendar.nextUpcomingEvent.location || 'Calendar Event' }}</span>
        <span class="font-bold text-neutral-300">
          {{ calendar.nextUpcomingEvent.isToday ? calendar.nextUpcomingEvent.formattedTimeRange : `${calendar.nextUpcomingEvent.dayLabel}, ${calendar.nextUpcomingEvent.formattedTimeRange}` }}
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex items-center gap-2 py-2 text-neutral-500 text-xs">
      <Clock class="w-4 h-4 text-neutral-600" />
      <span>No more events scheduled today</span>
    </div>

    <!-- Lean Footer -->
    <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-neutral-500 font-mono">
      <span>{{ calendar.todayEvents.length }} events today</span>
      <span v-if="calendar.useSampleEvents" class="text-amber-500/80">Sample Mode</span>
    </div>
  </div>
</template>
