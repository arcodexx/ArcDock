import { defineStore } from 'pinia';
import { ref } from 'vue';

export type WidgetType =
  | 'smartdesk'
  | 'github'
  | 'deliveries'
  | 'weather'
  | 'network'
  | 'calendar'
  | 'pomodoro'
  | 'habits'
  | 'timezones'
  | 'clipboard';

export interface WidgetMeta {
  id: WidgetType;
  title: string;
  subtitle: string;
  category: string;
}

export const WIDGET_CATALOG: Record<WidgetType, WidgetMeta> = {
  smartdesk: {
    id: 'smartdesk',
    title: 'Smart Desk IoT',
    subtitle: 'Climate, lighting & scenes',
    category: 'Environment',
  },
  github: {
    id: 'github',
    title: 'GitHub Activity Hub',
    subtitle: 'Streak, commits & PR requests',
    category: 'Productivity',
  },
  deliveries: {
    id: 'deliveries',
    title: 'Domestic Parcel Tracker',
    subtitle: 'Live courier package milestones',
    category: 'Logistics',
  },
  weather: {
    id: 'weather',
    title: 'Desk Weather Station',
    subtitle: 'Forecast via Open-Meteo',
    category: 'Glance',
  },
  network: {
    id: 'network',
    title: 'Network Monitor',
    subtitle: 'DNS ping & sparkline',
    category: 'Diagnostics',
  },
  calendar: {
    id: 'calendar',
    title: 'Daily Agenda',
    subtitle: 'Meetings & radar alert',
    category: 'Productivity',
  },
  pomodoro: {
    id: 'pomodoro',
    title: 'Focus Pomodoro',
    subtitle: 'Deep work & HA desk scenes',
    category: 'Productivity',
  },
  habits: {
    id: 'habits',
    title: 'Daily Habits',
    subtitle: '1-tap rituals & 7-day streak',
    category: 'Habits',
  },
  timezones: {
    id: 'timezones',
    title: 'World Clock',
    subtitle: 'Global cities & time difference',
    category: 'Glance',
  },
  clipboard: {
    id: 'clipboard',
    title: 'LAN Clipboard',
    subtitle: 'Cross-device web paste & copy',
    category: 'Utilities',
  },
};

const STORAGE_KEY = 'arcdock_favorite_widgets';
const MAX_FAVORITES_KEY = 'arcdock_max_favorites';

export const useFavoritesStore = defineStore('favorites', () => {
  const storedMax = localStorage.getItem(MAX_FAVORITES_KEY);
  const maxFavorites = ref<number>(storedMax ? Math.min(4, Math.max(2, parseInt(storedMax, 10))) : 2);

  const loadFavorites = (): WidgetType[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((id: string) => (id === 'climate' || id === 'lights') ? 'smartdesk' : id);
          const deduped = Array.from(new Set(migrated)) as WidgetType[];
          return deduped.slice(0, maxFavorites.value);
        }
      }
    } catch {}
    return ['weather', 'smartdesk'];
  };

  const favoriteWidgets = ref<WidgetType[]>(loadFavorites());
  const alertMessage = ref<string | null>(null);

  const setMaxFavorites = (count: number) => {
    const clamped = Math.min(4, Math.max(2, count));
    maxFavorites.value = clamped;
    localStorage.setItem(MAX_FAVORITES_KEY, clamped.toString());
    if (favoriteWidgets.value.length > clamped) {
      favoriteWidgets.value = favoriteWidgets.value.slice(0, clamped);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteWidgets.value));
    }
  };

  const isFavorite = (id: WidgetType): boolean => {
    return favoriteWidgets.value.includes(id);
  };

  const toggleFavorite = (id: WidgetType): boolean => {
    alertMessage.value = null;
    const index = favoriteWidgets.value.indexOf(id);
    if (index >= 0) {
      favoriteWidgets.value.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteWidgets.value));
      return true;
    } else {
      if (favoriteWidgets.value.length >= maxFavorites.value) {
        alertMessage.value = `Maximum ${maxFavorites.value} favorites reached. Unmark one first!`;
        return false;
      }
      favoriteWidgets.value.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteWidgets.value));
      return true;
    }
  };

  const clearAlert = () => {
    alertMessage.value = null;
  };

  return {
    favoriteWidgets,
    maxFavorites,
    alertMessage,
    isFavorite,
    toggleFavorite,
    setMaxFavorites,
    clearAlert,
  };
});
