import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface TimezoneSlot {
  id: string;
  label: string;
  city: string;
  timezone: string; // IANA string e.g. "Europe/Madrid"
}

export type AvailabilityStatus = 'working' | 'evening' | 'sleeping';

export interface TimezoneInfo {
  timeStr: string;
  dateStr: string;
  dayDelta: string; // "Today", "+1 Day", "-1 Day"
  hour: number;
  status: AvailabilityStatus;
  statusLabel: string;
  colorClass: string;
}

const DEFAULT_SLOTS: TimezoneSlot[] = [
  { id: 'tz-1', label: 'Manager', city: 'Madrid', timezone: 'Europe/Madrid' },
  { id: 'tz-2', label: 'US West', city: 'San Francisco', timezone: 'America/Los_Angeles' },
  { id: 'tz-3', label: 'US East', city: 'New York', timezone: 'America/New_York' },
  { id: 'tz-4', label: 'UK', city: 'London', timezone: 'Europe/London' },
];

export const useTimezonesStore = defineStore('timezones', () => {
  const STORAGE_KEY = 'arcdock_timezones';
  const FORMAT_KEY = 'arcdock_timezones_format';

  const timeFormat = ref<'12h' | '24h'>(
    (localStorage.getItem(FORMAT_KEY) as '12h' | '24h') || '12h'
  );

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  const setTimeFormat = (format: '12h' | '24h') => {
    timeFormat.value = format;
    localStorage.setItem(FORMAT_KEY, format);
  };

  const toggleTimeFormat = () => {
    setTimeFormat(timeFormat.value === '12h' ? '24h' : '12h');
  };

  const loadSlots = (): TimezoneSlot[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse timezone slots', e);
    }
    return DEFAULT_SLOTS;
  };

  const slots = ref<TimezoneSlot[]>(loadSlots());

  const saveSlots = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots.value));
    } catch (e) {
      console.warn('Failed to save timezones', e);
    }
  };

  const addSlot = (label: string, city: string, timezone: string) => {
    const newSlot: TimezoneSlot = {
      id: `tz-${Date.now()}`,
      label: label.trim() || city.trim(),
      city: city.trim(),
      timezone: timezone.trim(),
    };
    slots.value = [...slots.value, newSlot];
    saveSlots();
  };

  const updateSlot = (id: string, updates: Partial<Omit<TimezoneSlot, 'id'>>) => {
    slots.value = slots.value.map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveSlots();
  };

  const deleteSlot = (id: string) => {
    slots.value = slots.value.filter((s) => s.id !== id);
    saveSlots();
  };

  const getTimeInfo = (timezone: string, baseDate = new Date()): TimezoneInfo => {
    try {
      // Hour & minute in target timezone
      const timeFormatter = new Intl.DateTimeFormat([], {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat.value === '12h',
      });

      const hourFormatter = new Intl.DateTimeFormat([], {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat([], {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
      });

      const timeStr = timeFormatter.format(baseDate);
      const dateStr = dateFormatter.format(baseDate);
      const hour = parseInt(hourFormatter.format(baseDate), 10);

      // Day delta comparison
      const localDay = baseDate.getDate();
      const targetDayParts = new Intl.DateTimeFormat([], { timeZone: timezone, day: 'numeric' }).format(baseDate);
      const targetDay = parseInt(targetDayParts, 10);

      let dayDelta = 'Today';
      if (targetDay > localDay || (targetDay === 1 && localDay > 25)) {
        dayDelta = '+1 Day';
      } else if (targetDay < localDay || (localDay === 1 && targetDay > 25)) {
        dayDelta = '-1 Day';
      }

      // Working (9-18), Evening (18-23), Sleeping (23-9)
      let status: AvailabilityStatus = 'sleeping';
      let statusLabel = 'Sleeping';
      let colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

      if (hour >= 9 && hour < 18) {
        status = 'working';
        statusLabel = 'Working Hours';
        colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      } else if (hour >= 18 && hour < 23) {
        status = 'evening';
        statusLabel = 'Evening';
        colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      }

      return {
        timeStr,
        dateStr,
        dayDelta,
        hour,
        status,
        statusLabel,
        colorClass,
      };
    } catch {
      return {
        timeStr: '--:--',
        dateStr: '---',
        dayDelta: 'Today',
        hour: 12,
        status: 'sleeping',
        statusLabel: 'Invalid TZ',
        colorClass: 'text-neutral-500 bg-neutral-900 border-neutral-800',
      };
    }
  };

  const getLocalTimeInfo = (baseDate = new Date()): TimezoneInfo => {
    return getTimeInfo(localTimezone, baseDate);
  };

  return {
    slots,
    timeFormat,
    localTimezone,
    setTimeFormat,
    toggleTimeFormat,
    getLocalTimeInfo,
    addSlot,
    updateSlot,
    deleteSlot,
    getTimeInfo,
  };
});
