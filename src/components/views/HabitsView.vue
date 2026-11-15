<script setup lang="ts">
import { ref } from 'vue';
import { useHabitsStore, type ReminderType } from '@/stores/habits';
import { Target, CheckCircle2, Circle, Flame, Plus, Trash2, X, Bell, Clock } from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const habitsStore = useHabitsStore();

const showAddModal = ref(false);
const newTitle = ref('');
const selectedIcon = ref('🎯');
const reminderType = ref<ReminderType>('hourly');
const reminderTime = ref('14:00');
const hourlyInterval = ref(1);
const frequency = ref<'daily' | 'weekdays'>('daily');
const category = ref<'health' | 'work' | 'mind' | 'fitness'>('health');

const AVAILABLE_ICONS = ['💧', '🧘', '🏋️', '📚', '💻', '🚶', '🍎', '🎯', '⚡', '☕', '📖', '🚴'];

const PRESETS = [
  { title: 'Drink Water', icon: '💧', reminderType: 'hourly' as ReminderType, hourlyInterval: 1, category: 'health' as const, frequency: 'daily' as const },
  { title: 'Posture & Stretch', icon: '🧘', reminderType: 'hourly' as ReminderType, hourlyInterval: 2, category: 'health' as const, frequency: 'weekdays' as const },
  { title: 'Daily Workout', icon: '🏋️', reminderType: 'fixed' as ReminderType, reminderTime: '18:30', category: 'fitness' as const, frequency: 'daily' as const },
  { title: 'Read 15 Mins', icon: '📚', reminderType: 'fixed' as ReminderType, reminderTime: '21:00', category: 'mind' as const, frequency: 'daily' as const },
  { title: 'Standup Prep', icon: '💻', reminderType: 'fixed' as ReminderType, reminderTime: '09:30', category: 'work' as const, frequency: 'weekdays' as const },
];

const applyPreset = (preset: typeof PRESETS[0]) => {
  newTitle.value = preset.title;
  selectedIcon.value = preset.icon;
  reminderType.value = preset.reminderType;
  if (preset.hourlyInterval) hourlyInterval.value = preset.hourlyInterval;
  if (preset.reminderTime) reminderTime.value = preset.reminderTime;
  category.value = preset.category;
  frequency.value = preset.frequency;
};

const handleAddHabit = () => {
  if (!newTitle.value.trim()) return;
  habitsStore.addHabit(
    newTitle.value.trim(),
    selectedIcon.value,
    reminderType.value,
    reminderTime.value,
    hourlyInterval.value,
    frequency.value,
    category.value
  );
  newTitle.value = '';
  showAddModal.value = false;
};
</script>

<template>
  <div class="h-full flex flex-col p-3 sm:p-5 max-w-4xl mx-auto w-full select-none overflow-hidden relative">
    <!-- Compact Top Toolbar (No duplicate h2 header) -->
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
      <div class="flex items-center gap-2">
        <Target class="w-4 h-4 text-emerald-400 shrink-0" />
        <span class="text-xs sm:text-sm font-bold text-white font-mono">
          {{ habitsStore.completionStats.completed }}/{{ habitsStore.completionStats.total }} Completed Today ({{ habitsStore.completionStats.percent }}%)
        </span>
        <span
          v-if="habitsStore.dueReminders.length > 0"
          class="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
        >
          <Bell class="w-2.5 h-2.5" />
          {{ habitsStore.dueReminders.length }} Due
        </span>
      </div>

      <button
        @click="showAddModal = true"
        class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold tracking-wide transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Habit</span>
      </button>
    </div>

    <!-- Habit List -->
    <div class="flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
      <div
        v-for="habit in habitsStore.habits"
        :key="habit.id"
        class="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors"
      >
        <!-- Left details -->
        <div class="flex items-center gap-3 min-w-0 pr-3">
          <span class="text-xl select-none">{{ habit.icon }}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3
                class="text-xs sm:text-sm font-semibold truncate"
                :class="habitsStore.isCompletedToday(habit.id) ? 'line-through text-neutral-500' : 'text-white'"
              >
                {{ habit.title }}
              </h3>
              <span
                v-if="habitsStore.getStreak(habit) > 0"
                class="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full"
              >
                <Flame class="w-2.5 h-2.5" />
                {{ habitsStore.getStreak(habit) }}d
              </span>
              <span
                v-if="habitsStore.getReminderLabel(habit)"
                class="flex items-center gap-1 text-[10px] text-neutral-400 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800"
              >
                <Bell class="w-2.5 h-2.5 text-amber-400/80" />
                {{ habitsStore.getReminderLabel(habit) }}
              </span>
            </div>

            <!-- 7-day mini calendar ribbon -->
            <div class="flex items-center gap-1.5 mt-1.5">
              <div
                v-for="day in habitsStore.getLast7Days(habit)"
                :key="day.date"
                class="flex flex-col items-center gap-0.5"
              >
                <span class="text-[8px] font-mono text-neutral-500">{{ day.dayLabel }}</span>
                <span
                  class="w-2.5 h-2.5 rounded-full transition-colors"
                  :class="day.completed ? 'bg-emerald-400 shadow-sm shadow-emerald-500/40' : 'bg-neutral-800'"
                ></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-2">
          <button
            @click="habitsStore.toggleHabit(habit.id)"
            class="p-1.5 rounded-xl transition-transform active:scale-95"
            :class="habitsStore.isCompletedToday(habit.id) ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 hover:text-white'"
          >
            <CheckCircle2 v-if="habitsStore.isCompletedToday(habit.id)" class="w-6 h-6" />
            <Circle v-else class="w-6 h-6" />
          </button>
          <button
            @click="habitsStore.deleteHabit(habit.id)"
            class="p-1.5 rounded-xl text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete habit"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div v-if="habitsStore.habits.length === 0" class="text-center py-12 text-neutral-500 text-xs">
        No habits configured yet. Tap "Add Habit" to create your first daily desk goal!
      </div>
    </div>

    <!-- Add Habit Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 max-w-sm w-full space-y-3 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white">Create New Habit</h3>
          <button @click="showAddModal = false" class="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Quick Presets -->
        <div>
          <label class="block text-[10px] font-semibold text-neutral-400 mb-1">Quick Presets</label>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="preset in PRESETS"
              :key="preset.title"
              type="button"
              @click="applyPreset(preset)"
              class="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 text-[10px] text-neutral-300 flex items-center gap-1 transition-colors"
            >
              <span>{{ preset.icon }}</span>
              <span>{{ preset.title }}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-neutral-400 mb-1">Habit Title</label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="e.g. Drink Water, Stretch, Read"
            class="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            @keyup.enter="handleAddHabit"
          />
        </div>

        <!-- Schedule Options -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-neutral-400">Reminder Schedule</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="reminderType = 'hourly'"
              class="py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              :class="reminderType === 'hourly'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'"
            >
              <Clock class="w-3.5 h-3.5" />
              <span>Hourly Interval</span>
            </button>
            <button
              type="button"
              @click="reminderType = 'fixed'"
              class="py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              :class="reminderType === 'fixed'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'"
            >
              <Bell class="w-3.5 h-3.5" />
              <span>Fixed Time</span>
            </button>
          </div>

          <!-- Hourly Config -->
          <div v-if="reminderType === 'hourly'" class="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-between">
            <span>Repeat interval:</span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                v-for="h in [1, 2]"
                :key="h"
                @click="hourlyInterval = h"
                class="px-2.5 py-0.5 rounded-lg border text-xs font-mono font-bold"
                :class="hourlyInterval === h ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-neutral-900 border-neutral-800 text-neutral-400'"
              >
                Every {{ h }}h
              </button>
              <span class="text-[10px] text-neutral-500 font-mono ml-1">(9am-6pm)</span>
            </div>
          </div>

          <!-- Fixed Time Config -->
          <div v-else-if="reminderType === 'fixed'" class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-neutral-500 mb-0.5">Time</label>
              <input
                v-model="reminderTime"
                type="time"
                class="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-neutral-500 mb-0.5">Frequency</label>
              <select
                v-model="frequency"
                class="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-neutral-400 mb-1">Select Icon</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="icon in AVAILABLE_ICONS"
              :key="icon"
              type="button"
              @click="selectedIcon = icon"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-colors"
              :class="selectedIcon === icon ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="showAddModal = false"
            class="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleAddHabit"
            :disabled="!newTitle.trim()"
            class="px-4 py-1.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs disabled:opacity-40 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Save Habit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
