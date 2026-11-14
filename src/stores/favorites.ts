import { defineStore } from 'pinia';
import { ref } from 'vue';

export type WidgetType = 'climate' | 'lights' | 'github' | 'deliveries' | 'weather' | 'network';

export interface WidgetMeta {
  id: WidgetType;
  title: string;
  subtitle: string;
  category: string;
}

export const WIDGET_CATALOG: Record<WidgetType, WidgetMeta> = {
  climate: {
    id: 'climate',
    title: 'Smart AC Climate',
    subtitle: 'Setpoint & HVAC modes',
    category: 'Environment',
  },
  lights: {
    id: 'lights',
    title: 'Desk Lights & Scenes',
    subtitle: 'Lighting & ambient presets',
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
};

const STORAGE_KEY = 'arcdock_favorite_widgets';
const MAX_FAVORITES = 2;

export const useFavoritesStore = defineStore('favorites', () => {
  const loadFavorites = (): WidgetType[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, MAX_FAVORITES) as WidgetType[];
        }
      }
    } catch {}
    return ['climate', 'lights'];
  };

  const favoriteWidgets = ref<WidgetType[]>(loadFavorites());
  const alertMessage = ref<string | null>(null);

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
      if (favoriteWidgets.value.length >= MAX_FAVORITES) {
        alertMessage.value = `Maximum ${MAX_FAVORITES} favorites reached. Unmark one first!`;
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
    alertMessage,
    maxFavorites: MAX_FAVORITES,
    isFavorite,
    toggleFavorite,
    clearAlert,
  };
});
