<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { useNetworkStore } from '@/stores/network';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore, COURIER_LIST } from '@/stores/delivery';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { useFavoritesStore } from '@/stores/favorites';
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
  Snowflake,
  Lightbulb,
  Wifi,
  ChevronUp,
  ExternalLink,
  Star,
  AlertTriangle
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-fullscreen', target: 'weather' | 'github' | 'deliveries' | 'climate' | 'lights' | 'network'): void;
}>();

const weatherStore = useWeatherStore();
const networkStore = useNetworkStore();
const githubStore = useGitHubStore();
const deliveryStore = useDeliveryStore();
const ha = useHomeAssistantStore();
const favorites = useFavoritesStore();

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
  return deliveryStore.parcels[0] || null;
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
      class="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    />

    <!-- Sliding Drawer Panel from Top -->
    <div
      class="relative w-full max-h-[92vh] bg-neutral-950/95 border-b border-white/15 shadow-2xl p-4 sm:p-6 flex flex-col rounded-b-3xl z-10 animate-in slide-in-from-top duration-200 overflow-hidden"
    >
      <!-- Top Drag Bar / Dismiss handle -->
      <div class="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
          <h2 class="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">Desk Control Center</h2>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25 flex items-center gap-1">
            <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Favorites: {{ favorites.favoriteWidgets.length }}/2</span>
          </span>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold"
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
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-4 overflow-y-auto no-scrollbar">
        <!-- 1. Weather Card -->
        <div
          @click="emit('open-fullscreen', 'weather')"
          class="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('weather') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-sky-500/20 hover:border-sky-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <component :is="getWeatherIconComponent(weatherStore.currentCondition.icon)" class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('weather')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
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
          class="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('github') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-purple-500/20 hover:border-purple-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Github class="w-4 h-4 text-purple-300" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('github')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
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
          class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('deliveries') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-amber-500/20 hover:border-amber-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Package class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('deliveries')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
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
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{{ activeDelivery ? getCourierName(activeDelivery.courier) : 'All delivered' }}</span>
              <span class="text-neutral-400">• {{ activeDelivery?.estimatedDelivery || 'Up to date' }}</span>
            </div>
          </div>
        </div>

        <!-- 4. SmartThings AC Card -->
        <div
          @click="emit('open-fullscreen', 'climate')"
          class="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('climate') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-cyan-500/20 hover:border-cyan-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Snowflake class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('climate')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
                :title="favorites.isFavorite('climate') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('climate') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-black text-white font-mono">
                {{ primaryAc?.attributes.temperature ?? 24 }}°C
              </span>
              <span class="text-xs uppercase font-bold text-cyan-300">
                {{ primaryAc?.state ?? 'Cool' }}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              Room: {{ primaryAc?.attributes.current_temperature ?? 26.5 }}°C
            </div>
          </div>
        </div>

        <!-- 5. Lights & Scenes Card -->
        <div
          @click="emit('open-fullscreen', 'lights')"
          class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('lights') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-amber-500/20 hover:border-amber-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lightbulb class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('lights')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
                :title="favorites.isFavorite('lights') ? 'Unmark Favorite' : 'Mark Favorite (Max 2)'"
              >
                <Star class="w-4 h-4" :class="favorites.isFavorite('lights') ? 'fill-amber-400 text-amber-400' : 'text-neutral-500 hover:text-white'" />
              </button>
              <ExternalLink class="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="text-2xl font-black text-white font-mono">
                {{ activeLightsCount }}
              </span>
              <span class="text-xs text-amber-300 font-bold">Lights Active</span>
            </div>
            <div class="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
              {{ ha.lights.length }} configured • Tap to view all
            </div>
          </div>
        </div>

        <!-- 6. Network Latency Monitor Card -->
        <div
          @click="emit('open-fullscreen', 'network')"
          class="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900 border transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative"
          :class="favorites.isFavorite('network') ? 'border-amber-400/50 shadow-md shadow-amber-950/20' : 'border-emerald-500/20 hover:border-emerald-400/40'"
        >
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wifi class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click.stop="favorites.toggleFavorite('network')"
                class="p-1 rounded-lg hover:bg-white/10 transition-colors"
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
