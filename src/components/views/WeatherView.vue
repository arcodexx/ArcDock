<script setup lang="ts">
import { ref } from 'vue';
import { useWeatherStore, getWeatherDescription, type GeocodingResult } from '@/stores/weather';
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
  Droplets,
  Wind,
  Thermometer,
  RefreshCw,
  MapPin,
  Settings,
  Search,
  Loader2,
  Navigation
} from 'lucide-vue-next';

const weatherStore = useWeatherStore();

const isConfigOpen = ref(false);
const searchQuery = ref(weatherStore.config.city);
const searchResults = ref<GeocodingResult[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);

const handleSearch = async () => {
  if (!searchQuery.value.trim() || searchQuery.value.trim().length < 2) return;
  isSearching.value = true;
  searchError.value = null;
  try {
    const results = await weatherStore.searchCities(searchQuery.value);
    searchResults.value = results;
    if (results.length === 0) {
      searchError.value = 'No matching cities found. Try another city name.';
    }
  } catch {
    searchError.value = 'City lookup failed. Check network connection.';
  } finally {
    isSearching.value = false;
  }
};

const handleSelectCity = (city: GeocodingResult) => {
  weatherStore.selectCity(city);
  searchQuery.value = city.admin1 ? `${city.name}, ${city.admin1}` : city.name;
  searchResults.value = [];
  searchError.value = null;
  isConfigOpen.value = false;
};

const toggleGps = () => {
  weatherStore.saveConfig({ useGeo: !weatherStore.config.useGeo });
};

const getWeatherIcon = (code: number) => {
  const desc = getWeatherDescription(code);
  switch (desc.icon) {
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

const formatHour = (isoTime: string) => {
  try {
    const d = new Date(isoTime);
    return d.toLocaleTimeString([], { hour: 'numeric' });
  } catch {
    return isoTime.slice(11, 16);
  }
};

const formatDay = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString([], { weekday: 'short' });
  } catch {
    return isoDate;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-5">
    <!-- Hero Current Weather Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
          <component :is="getWeatherIcon(weatherStore.weather?.weatherCode ?? 0)" class="w-10 h-10" />
        </div>
        <div class="truncate">
          <div class="flex items-baseline gap-2">
            <span class="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              {{ weatherStore.weather?.currentTemp ?? 25 }}°
            </span>
            <span class="text-lg sm:text-xl font-bold text-neutral-300">
              {{ weatherStore.currentCondition.text }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold mt-1 truncate">
            <MapPin class="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span class="truncate">{{ weatherStore.weather?.city || 'Weather Station' }}</span>
            <span v-if="weatherStore.config.lat && weatherStore.config.lon" class="text-[10px] text-neutral-500 font-mono shrink-0">
              ({{ weatherStore.config.lat.toFixed(2) }}°N, {{ weatherStore.config.lon.toFixed(2) }}°E)
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Pills & Action Buttons -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
        <div class="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[70px]">
          <div class="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
            <Thermometer class="w-3 h-3 text-amber-400" /> Feels
          </div>
          <div class="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
            {{ weatherStore.weather?.feelsLike ?? 26 }}°C
          </div>
        </div>

        <div class="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[70px]">
          <div class="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
            <Droplets class="w-3 h-3 text-blue-400" /> Humidity
          </div>
          <div class="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
            {{ weatherStore.weather?.humidity ?? 55 }}%
          </div>
        </div>

        <div class="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[70px]">
          <div class="text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-center gap-1">
            <Wind class="w-3 h-3 text-teal-400" /> Wind
          </div>
          <div class="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
            {{ weatherStore.weather?.windSpeed ?? 8 }} km/h
          </div>
        </div>

        <!-- Refresh Button -->
        <button
          @click="weatherStore.fetchWeather(true)"
          :disabled="weatherStore.isLoading"
          class="p-2.5 sm:p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white cursor-pointer"
          title="Refresh Forecast"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': weatherStore.isLoading }" />
        </button>

        <!-- Location Settings Toggle Button -->
        <button
          @click="isConfigOpen = !isConfigOpen"
          class="p-2.5 sm:p-3 rounded-2xl border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
          :class="isConfigOpen ? 'bg-sky-500/25 border-sky-400 text-sky-300' : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'"
          title="Configure City & Location Settings"
        >
          <Settings class="w-4 h-4 text-sky-400" />
          <span class="hidden sm:inline">Location</span>
        </button>
      </div>
    </div>

    <!-- Collapsible Location & City Configuration Card -->
    <div
      v-if="isConfigOpen"
      class="p-4 sm:p-5 rounded-3xl bg-neutral-900 border border-sky-500/30 shadow-2xl space-y-3.5 animate-in slide-in-from-top-2 duration-150"
    >
      <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div class="flex items-center gap-2">
          <Settings class="w-4 h-4 text-sky-400" />
          <h3 class="text-sm font-bold text-white">Weather Location Settings</h3>
        </div>

        <!-- GPS Auto-Location Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-neutral-400 flex items-center gap-1">
            <Navigation class="w-3 h-3 text-sky-400" />
            <span>GPS Auto-Location</span>
          </span>
          <button
            @click="toggleGps"
            class="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
            :class="weatherStore.config.useGeo ? 'bg-sky-400' : 'bg-white/10'"
          >
            <div
              class="w-3.5 h-3.5 rounded-full bg-black absolute top-0.5 transition-transform"
              :class="weatherStore.config.useGeo ? 'left-4.5' : 'left-0.5'"
            />
          </button>
        </div>
      </div>

      <!-- City Search Bar -->
      <div v-if="!weatherStore.config.useGeo" class="space-y-2">
        <label class="text-xs text-neutral-400 font-medium">Search City (Open-Meteo Geocoding)</label>
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Type city and press Enter (e.g. Jodhpur, Mumbai, Bengaluru)"
            @keydown.enter="handleSearch"
            class="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-400"
          />
          <button
            @click="handleSearch"
            :disabled="isSearching"
            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-bold text-xs active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
          >
            <Loader2 v-if="isSearching" class="w-3.5 h-3.5 animate-spin" />
            <Search v-else class="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        <!-- Search Results List -->
        <div v-if="searchResults.length > 0" class="mt-2 space-y-1 bg-neutral-950 border border-sky-500/30 rounded-2xl p-1.5 shadow-xl max-h-48 overflow-y-auto no-scrollbar">
          <div class="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-2 py-1">
            Matching Locations
          </div>
          <button
            v-for="item in searchResults"
            :key="item.id"
            @click="handleSelectCity(item)"
            class="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/20 text-left text-xs text-white flex items-center justify-between gap-2 transition-all cursor-pointer group"
          >
            <div class="flex items-center gap-2 min-w-0">
              <MapPin class="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <div class="truncate">
                <span class="font-bold text-white group-hover:text-sky-300">{{ item.name }}</span>
                <span v-if="item.admin1" class="text-neutral-400 text-[11px]">, {{ item.admin1 }}</span>
                <span v-if="item.country" class="text-neutral-500 text-[10px]"> ({{ item.country }})</span>
              </div>
            </div>
            <span class="text-[10px] font-mono text-neutral-400 shrink-0">
              {{ item.latitude }}°, {{ item.longitude }}°
            </span>
          </button>
        </div>

        <div v-if="searchError" class="text-xs text-amber-400 px-1 pt-1">
          {{ searchError }}
        </div>
      </div>
    </div>

    <!-- 24-Hour Horizontal Scrollable Hourly Forecast -->
    <div class="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-3">
      <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
        Next 24 Hours
      </h3>
      <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <div
          v-for="point in weatherStore.weather?.hourly || []"
          :key="point.time"
          class="flex flex-col items-center justify-between p-3 rounded-2xl bg-white/5 min-w-[70px] space-y-2 border border-white/5 shrink-0"
        >
          <span class="text-[11px] font-semibold text-neutral-400 font-mono">
            {{ formatHour(point.time) }}
          </span>
          <component :is="getWeatherIcon(point.code)" class="w-5 h-5 text-sky-400" />
          <span class="text-sm font-bold text-white font-mono">
            {{ point.temp }}°
          </span>
        </div>
      </div>
    </div>

    <!-- 7-Day Outlook -->
    <div class="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-3">
      <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
        7-Day Forecast
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="d in weatherStore.weather?.daily || []"
          :key="d.date"
          class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-neutral-300 w-12">{{ formatDay(d.date) }}</span>
            <component :is="getWeatherIcon(d.code)" class="w-4 h-4 text-sky-400" />
            <span class="text-xs text-neutral-400 font-medium">{{ getWeatherDescription(d.code).text }}</span>
          </div>
          <div class="flex items-center gap-2 font-mono text-xs font-bold">
            <span class="text-white">{{ d.maxTemp }}°</span>
            <span class="text-neutral-500">{{ d.minTemp }}°</span>
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
