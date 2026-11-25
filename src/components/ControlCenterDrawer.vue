<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { useNetworkStore } from '@/stores/network';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore, COURIER_LIST } from '@/stores/delivery';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { useFavoritesStore } from '@/stores/favorites';
import { useCalendarStore } from '@/stores/calendar';
import { usePomodoroStore } from '@/stores/pomodoro';
import { useHabitsStore } from '@/stores/habits';
import { useTimezonesStore } from '@/stores/timezones';
import { useClipboardStore } from '@/stores/clipboard';
import type { WidgetType } from '@/stores/favorites';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Github,
  Package,
  Wifi,
  ChevronUp,
  ExternalLink,
  Star,
  AlertTriangle,
  Calendar,
  Timer,
  Target,
  Globe,
  Clipboard,
  Home
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-fullscreen', target: WidgetType): void;
}>();

const weatherStore = useWeatherStore();
const networkStore = useNetworkStore();
const githubStore = useGitHubStore();
const deliveryStore = useDeliveryStore();
const ha = useHomeAssistantStore();
const favorites = useFavoritesStore();
const calendarStore = useCalendarStore();
const pomodoroStore = usePomodoroStore();
const habitsStore = useHabitsStore();
const timezonesStore = useTimezonesStore();
const clipboardStore = useClipboardStore();

// Weather icon helper
const getWeatherIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Sun': return Sun;
    case 'SunMedium': return SunMedium;
    case 'CloudSun': return CloudSun;
    case 'Cloud': return Cloud;
    case 'CloudFog': return CloudFog;
    case 'CloudDrizzle': return CloudDrizzle;
    case 'CloudRain': return CloudRain;
    case 'CloudSnow': return CloudSnow;
    case 'CloudLightning': return CloudLightning;
    default: return CloudSun;
  }
};

const activeLightsCount = computed(() => {
  return ha.lights.filter((l) => l.state === 'on').length;
});

const primaryAc = computed(() => {
  return ha.climates[0] || null;
});

const activeDelivery = computed(() => {
  return deliveryStore.activeParcel;
});

const getCourierName = (id: string) => {
  return COURIER_LIST.find((c) => c.id === id)?.name || id;
};
</script>

<template>
  <div class="fixed inset-0 z-[90] flex flex-col justify-start select-none">
    <!-- Backdrop overlay -->
    <div
      @click="emit('close')"
      class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    />

    <!-- Sliding Drawer Panel from Top -->
    <div
      class="control-center-sheet relative w-full max-h-[92vh] border-b shadow-2xl p-4 sm:p-6 flex flex-col rounded-b-3xl z-10 animate-in slide-in-from-top duration-200 overflow-hidden"
    >
      <!-- Top Drag Bar / Dismiss handle -->
      <div class="flex items-center justify-between pb-3 border-b border-white/10 shrink-0 relative z-20">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
          <h2 class="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">Desk Control Center</h2>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25 flex items-center gap-1">
            <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Favorites: {{ favorites.favoriteWidgets.length }}/{{ favorites.maxFavorites }}</span>
          </span>
        </div>

        <button
          @click="emit('close')"
          class="drawer-dismiss-btn min-h-[38px] px-3.5 py-1.5 rounded-xl border font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Dismiss Drawer"
        >
          <span>Dismiss</span>
          <ChevronUp class="w-4 h-4" />
        </button>
      </div>

      <!-- Alert when 2 favorites reached and user tries to add 3rd -->
      <div
        v-if="favorites.alertMessage"
        class="mt-3 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in slide-in-from-top duration-150"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <span>{{ favorites.alertMessage }}</span>
        </div>
        <button
          @click="favorites.clearAlert()"
          class="text-neutral-400 hover:text-white text-xs font-bold px-1.5 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- 6-Card Touch Launcher Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-4 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y">
        <!-- 1. Weather Card -->
        <div
          @click="emit('open-fullscreen', 'weather')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('weather') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-sky-500/20 hover:border-sky-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <component :is="getWeatherIconComponent(weatherStore.currentCondition.icon)" class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Weather</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('weather')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('weather') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('weather') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-black text-white font-mono">
                {{ weatherStore.weather?.currentTemp ?? 26 }}°
              </span>
              <span class="text-xs text-neutral-400 font-medium">
                {{ weatherStore.currentCondition.text }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ weatherStore.weather?.city || 'Weather Station' }}
            </div>
          </div>
        </div>

        <!-- 2. GitHub Activity Card -->
        <div
          @click="emit('open-fullscreen', 'github')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('github') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-purple-500/20 hover:border-purple-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Github class="w-4 h-4 text-purple-300" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">GitHub</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('github')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('github') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('github') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-white font-mono">
                {{ githubStore.streakDays }}
              </span>
              <span class="text-xs text-orange-400 font-bold">Days Streak</span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ githubStore.todayCommits }} commits today • {{ githubStore.pendingPrs }} PRs
            </div>
          </div>
        </div>

        <!-- 3. Indian Parcel Tracker Card -->
        <div
          @click="emit('open-fullscreen', 'deliveries')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('deliveries') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-amber-500/20 hover:border-amber-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Package class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Parcels</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('deliveries')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('deliveries') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('deliveries') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1">
              <span class="text-lg font-bold text-white truncate max-w-[130px]">
                {{ activeDelivery?.title || 'No active parcel' }}
              </span>
            </div>
            <div class="text-[10px] font-semibold text-amber-300 truncate mt-0.5 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span class="truncate">{{ activeDelivery?.lastCheckpoint || (activeDelivery ? getCourierName(activeDelivery.courier) : 'All delivered') }}</span>
              <span v-if="activeDelivery?.estimatedDelivery" class="text-neutral-400 shrink-0">• {{ activeDelivery.estimatedDelivery }}</span>
            </div>
          </div>
        </div>

        <!-- 4. Unified Smart Desk IoT Card -->
        <div
          @click="emit('open-fullscreen', 'smartdesk')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-neutral-900 to-cyan-950/30 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('smartdesk') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-amber-500/20 hover:border-amber-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Home class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Smart Desk IoT</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('smartdesk')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('smartdesk') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('smartdesk') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline justify-between">
              <span v-if="primaryAc" class="text-xl font-black text-white font-mono">
                {{ primaryAc?.attributes.temperature ?? 24 }}°C
                <span class="text-[10px] font-bold text-cyan-300 uppercase ml-1">{{ primaryAc?.state ?? 'Cool' }}</span>
              </span>
              <span v-else class="text-xs text-neutral-400 font-bold">Smart Desk Active</span>
              <span class="text-xs text-amber-300 font-bold">
                {{ activeLightsCount }} Lights Active
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ ha.lights.length }} lights • {{ ha.climates.length }} climate units
            </div>
          </div>
        </div>

        <!-- 6. Network Latency Monitor Card -->
        <div
          @click="emit('open-fullscreen', 'network')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('network') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-emerald-500/20 hover:border-emerald-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Wifi class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Network</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('network')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('network') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('network') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-white font-mono">
                {{ networkStore.pingMs }}ms
              </span>
              <span
                class="text-xs font-bold capitalize"
                :class="[
                  networkStore.status === 'stable'
                    ? 'text-emerald-400'
                    : networkStore.status === 'elevated'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                ]"
              >
                {{ networkStore.status }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              Ping to 1.1.1.1 • Real-time
            </div>
          </div>
        </div>

        <!-- 7. Daily Calendar / Agenda Card -->
        <div
          @click="emit('open-fullscreen', 'calendar')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('calendar') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-blue-500/20 hover:border-blue-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Calendar class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Calendar</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('calendar')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('calendar') ? 'Unmark Favorite' : 'Mark Favorite'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('calendar') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5 truncate">
              <span class="text-base font-bold text-white truncate">
                {{ calendarStore.nextUpcomingEvent?.title || 'No Meetings' }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ calendarStore.nextUpcomingEvent ? calendarStore.nextUpcomingEvent.formattedTimeRange : 'Clear schedule' }}
            </div>
          </div>
        </div>

        <!-- 8. Focus Pomodoro Card -->
        <div
          @click="emit('open-fullscreen', 'pomodoro')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('pomodoro') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-rose-500/20 hover:border-rose-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Timer class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Pomodoro</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('pomodoro')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('pomodoro') ? 'Unmark Favorite' : 'Mark Favorite'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('pomodoro') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-white font-mono">
                {{ pomodoroStore.formattedTime }}
              </span>
              <span class="text-xs font-bold text-rose-400">
                {{ pomodoroStore.phaseLabel }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ pomodoroStore.completedSessions }} sessions today • HA sync
            </div>
          </div>
        </div>

        <!-- 9. Daily Habits Card -->
        <div
          @click="emit('open-fullscreen', 'habits')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('habits') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-emerald-500/20 hover:border-emerald-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Target class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">Habits</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('habits')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('habits') ? 'Unmark Favorite' : 'Mark Favorite'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('habits') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-white font-mono">
                {{ habitsStore.habits.filter((h) => habitsStore.isCompletedToday(h.id)).length }}/{{ habitsStore.habits.length }}
              </span>
              <span class="text-xs font-bold text-emerald-400">Done</span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              1-tap daily ritual streaks
            </div>
          </div>
        </div>

        <!-- 10. World Clock Card -->
        <div
          @click="emit('open-fullscreen', 'timezones')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('timezones') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-cyan-500/20 hover:border-cyan-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Globe class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">World Clock</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('timezones')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('timezones') ? 'Unmark Favorite' : 'Mark Favorite'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('timezones') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5 truncate">
              <span class="text-base font-bold text-white truncate">
                {{ timezonesStore.slots[0]?.city || 'World Clock' }}
              </span>
              <span class="text-xs font-mono text-cyan-400 font-bold">
                {{ timezonesStore.slots[0] ? timezonesStore.getTimeInfo(timezonesStore.slots[0].timezone).timeStr : '' }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ timezonesStore.slots.length }} configured cities
            </div>
          </div>
        </div>

        <!-- 11. LAN Clipboard Card -->
        <div
          @click="emit('open-fullscreen', 'clipboard')"
          class="launcher-card p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('clipboard') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-violet-500/20 hover:border-violet-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <Clipboard class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-white tracking-wide truncate">LAN Clipboard</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click.stop="favorites.toggleFavorite('clipboard')"
                class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                :title="favorites.isFavorite('clipboard') ? 'Unmark Favorite' : 'Mark Favorite'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('clipboard') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5 truncate">
              <span class="text-base font-bold text-white truncate font-mono">
                {{ clipboardStore.current?.text ? clipboardStore.current.text.slice(0, 20) : 'Empty' }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ clipboardStore.current ? `From ${clipboardStore.current.device}` : 'Open /clip to sync' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
