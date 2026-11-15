<script setup lang="ts">
import { useHabitsStore } from '@/stores/habits';
import { CheckCircle2, Circle, Flame, Bell } from 'lucide-vue-next';

const habitsStore = useHabitsStore();

defineEmits<{
  (e: 'expand'): void;
}>();
</script>

<template>
  <div
    @click="$emit('expand')"
    class="h-full flex flex-col justify-between cursor-pointer select-none group"
  >
    <!-- Top Stats Row -->
    <div class="flex items-center justify-between pb-1.5 text-[11px] font-mono border-b border-white/5">
      <div class="flex items-center gap-1.5">
        <span class="text-white font-bold">Today:</span>
        <span class="text-emerald-400 font-bold">
          {{ habitsStore.completionStats.completed }}/{{ habitsStore.completionStats.total }}
        </span>
        <span class="text-neutral-500 font-medium">({{ habitsStore.completionStats.percent }}%)</span>
      </div>

      <!-- Reminder Due Pill -->
      <div
        v-if="habitsStore.dueReminders.length > 0"
        class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold animate-pulse"
      >
        <Bell class="w-2.5 h-2.5" />
        <span>{{ habitsStore.dueReminders.length }} Due</span>
      </div>
    </div>

    <!-- Habit Items List (Compact) -->
    <div class="flex-1 overflow-y-auto space-y-1.5 py-1.5 pr-0.5 custom-scrollbar">
      <div
        v-for="habit in habitsStore.habits"
        :key="habit.id"
        @click.stop="habitsStore.toggleHabit(habit.id)"
        class="flex items-center justify-between p-1.5 rounded-xl bg-neutral-950/60 border border-neutral-800/50 hover:border-neutral-700/60 transition-colors"
      >
        <!-- Left: Icon + Title + Streak -->
        <div class="flex items-center gap-2 min-w-0 pr-1">
          <span class="text-sm select-none">{{ habit.icon }}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1">
              <span
                class="text-xs font-medium truncate"
                :class="habitsStore.isCompletedToday(habit.id) ? 'line-through text-neutral-500' : 'text-neutral-200'"
              >
                {{ habit.title }}
              </span>
              <span
                v-if="habitsStore.getStreak(habit) > 0"
                class="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded"
              >
                <Flame class="w-2.5 h-2.5" />
                {{ habitsStore.getStreak(habit) }}
              </span>

              <span
                v-if="habitsStore.getReminderLabel(habit)"
                class="text-[9px] text-neutral-400 font-mono"
              >
                {{ habitsStore.getReminderLabel(habit) }}
              </span>
            </div>

            <!-- 7-day mini dots ribbon -->
            <div class="flex items-center gap-1 mt-0.5">
              <span
                v-for="day in habitsStore.getLast7Days(habit)"
                :key="day.date"
                class="w-1.5 h-1.5 rounded-full transition-colors"
                :class="day.completed ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-neutral-800'"
              ></span>
            </div>
          </div>
        </div>

        <!-- Right: 1-Tap Toggle Checkbox -->
        <button
          @click.stop="habitsStore.toggleHabit(habit.id)"
          class="p-1 rounded-lg transition-transform active:scale-95 shrink-0"
          :class="habitsStore.isCompletedToday(habit.id) ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-400'"
        >
          <CheckCircle2 v-if="habitsStore.isCompletedToday(habit.id)" class="w-4 h-4" />
          <Circle v-else class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
