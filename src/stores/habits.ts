import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ReminderType = 'fixed' | 'hourly' | 'none';

export interface Habit {
  id: string;
  title: string;
  icon: string;
  reminderType?: ReminderType;
  reminderTime?: string; // "HH:MM" e.g. "14:00"
  hourlyInterval?: number; // e.g. 1 (every 1 hour), 2 (every 2 hours)
  hourlyStartHour?: number; // e.g. 9 (09:00)
  hourlyEndHour?: number; // e.g. 18 (18:00)
  targetCount?: number; // e.g. 8 glasses of water
  frequency?: 'daily' | 'weekdays';
  category?: 'health' | 'work' | 'mind' | 'fitness';
  completedDates: string[]; // YYYY-MM-DD
  createdAt: string;
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Drink Water (Hourly)',
    icon: '💧',
    reminderType: 'hourly',
    hourlyInterval: 1,
    hourlyStartHour: 9,
    hourlyEndHour: 18,
    targetCount: 8,
    frequency: 'daily',
    category: 'health',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    title: 'Posture & Stretch Break',
    icon: '🧘',
    reminderType: 'hourly',
    hourlyInterval: 2,
    hourlyStartHour: 10,
    hourlyEndHour: 18,
    frequency: 'weekdays',
    category: 'health',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    title: 'Daily Workout',
    icon: '🏋️',
    reminderType: 'fixed',
    reminderTime: '18:30',
    frequency: 'daily',
    category: 'fitness',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    title: 'Read 15 Mins',
    icon: '📚',
    reminderType: 'fixed',
    reminderTime: '21:00',
    frequency: 'daily',
    category: 'mind',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
];

export const useHabitsStore = defineStore('habits', () => {
  const STORAGE_KEY = 'arcdock_habits';

  const getLocalDateStr = (d = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadHabits = (): Habit[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse habits from storage', e);
    }
    return DEFAULT_HABITS;
  };

  const habits = ref<Habit[]>(loadHabits());

  const saveHabits = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits.value));
    } catch (e) {
      console.warn('Failed to save habits', e);
    }
  };

  const isCompletedToday = (habitId: string): boolean => {
    const today = getLocalDateStr();
    const habit = habits.value.find((h) => h.id === habitId);
    return habit ? habit.completedDates.includes(today) : false;
  };

  const toggleHabit = (habitId: string) => {
    const today = getLocalDateStr();
    habits.value = habits.value.map((habit) => {
      if (habit.id !== habitId) return habit;
      const completed = habit.completedDates.includes(today);
      const updatedDates = completed
        ? habit.completedDates.filter((d) => d !== today)
        : [...habit.completedDates, today];
      return { ...habit, completedDates: updatedDates };
    });
    saveHabits();
  };

  const addHabit = (
    title: string,
    icon = '🎯',
    reminderType: ReminderType = 'fixed',
    reminderTime?: string,
    hourlyInterval = 1,
    frequency: 'daily' | 'weekdays' = 'daily',
    category: 'health' | 'work' | 'mind' | 'fitness' = 'health'
  ) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      icon: icon.trim() || '🎯',
      reminderType,
      reminderTime: reminderType === 'fixed' && reminderTime ? reminderTime.trim() : undefined,
      hourlyInterval: reminderType === 'hourly' ? hourlyInterval : undefined,
      hourlyStartHour: reminderType === 'hourly' ? 9 : undefined,
      hourlyEndHour: reminderType === 'hourly' ? 18 : undefined,
      frequency,
      category,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    habits.value = [...habits.value, newHabit];
    saveHabits();
  };

  const deleteHabit = (habitId: string) => {
    habits.value = habits.value.filter((h) => h.id !== habitId);
    saveHabits();
  };

  const getReminderLabel = (habit: Habit): string => {
    if (habit.reminderType === 'hourly') {
      const interval = habit.hourlyInterval || 1;
      return `Every ${interval}h (9am-6pm)`;
    }
    if (habit.reminderTime) {
      return `At ${habit.reminderTime}`;
    }
    return '';
  };

  const getStreak = (habit: Habit): number => {
    let streak = 0;
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    let checkDate = new Date(now);
    if (!habit.completedDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = getLocalDateStr(checkDate);
      if (habit.completedDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getLast7Days = (habit: Habit): { date: string; dayLabel: string; completed: boolean }[] => {
    const result: { date: string; dayLabel: string; completed: boolean }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const dayLabel = d.toLocaleDateString([], { weekday: 'narrow' });
      result.push({
        date: dateStr,
        dayLabel,
        completed: habit.completedDates.includes(dateStr),
      });
    }

    return result;
  };

  // Due reminders calculation (fixed time or active hourly interval)
  const dueReminders = computed(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;

    return habits.value.filter((h) => {
      if (isCompletedToday(h.id)) return false;
      if (h.reminderType === 'hourly') {
        const start = h.hourlyStartHour ?? 9;
        const end = h.hourlyEndHour ?? 18;
        return currentHour >= start && currentHour < end;
      }
      if (h.reminderTime) {
        const [rh, rm] = h.reminderTime.split(':').map((n) => parseInt(n, 10));
        const reminderVal = rh * 60 + (rm || 0);
        return currentTimeVal >= reminderVal;
      }
      return false;
    });
  });

  const completionStats = computed(() => {
    const total = habits.value.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = habits.value.filter((h) => isCompletedToday(h.id)).length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  });

  return {
    habits,
    dueReminders,
    completionStats,
    isCompletedToday,
    toggleHabit,
    addHabit,
    deleteHabit,
    getStreak,
    getLast7Days,
    getReminderLabel,
  };
});
