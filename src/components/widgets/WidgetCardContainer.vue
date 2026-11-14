<script setup lang="ts">
import { ref } from 'vue';
import { useWeatherStore, getWeatherDescription } from '@/stores/weather';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore } from '@/stores/delivery';
import {
  CloudSun,
  Sun,
  SunMedium,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Flame,
  Package,
  ExternalLink,
  MapPin,
  GitPullRequest,
  LayoutGrid,
  RefreshCw
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'expand', tab: 'weather' | 'github' | 'deliveries'): void;
  (e: 'switch-lights'): void;
}>();

const weatherStore = useWeatherStore();
const githubStore = useGitHubStore();
const deliveryStore = useDeliveryStore();

type WidgetTab = 'weather' | 'github' | 'deliveries';
const activeTab = ref<WidgetTab>('weather');

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
</script>

<template>
  <div class="h-full w-full flex flex-col bg-neutral-950/80 border border-white/10 rounded-2xl overflow-hidden select-none">
    <!-- Single Consolidated Tab Header: Tabs on Left + Expand & Lights Switcher on Right -->
    <div class="h-9 px-2.5 border-b border-white/5 flex items-center justify-between bg-black/50 shrink-0 gap-1.5">
      <!-- Left: Segmented Tabs (Never wraps or goes out of screen) -->
      <div class="flex items-center gap-1 min-w-0">
        <button
          @click="activeTab = 'weather'"
          class="h-6 px-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          :class="activeTab === 'weather' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-neutral-400 hover:text-white'"
          title="Weather"
        >
          <CloudSun class="w-3 h-3 text-sky-400" />
          <span>Weather</span>
        </button>

        <button
          @click="activeTab = 'github'"
          class="h-6 px-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          :class="activeTab === 'github' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-neutral-400 hover:text-white'"
          title="GitHub"
        >
          <Flame class="w-3 h-3 text-orange-400" />
          <span>GitHub</span>
        </button>

        <button
          @click="activeTab = 'deliveries'"
          class="h-6 px-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          :class="activeTab === 'deliveries' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-neutral-400 hover:text-white'"
          title="Packages"
        >
          <Package class="w-3 h-3 text-amber-400" />
          <span>Packages</span>
        </button>
      </div>

      <!-- Right: Action Pills (Expand to Full View + Switch to Full Lights Grid) -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          @click="emit('expand', activeTab)"
          class="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
          title="Expand to Full View"
        >
          <ExternalLink class="w-3 h-3" />
        </button>

        <button
          @click="emit('switch-lights')"
          class="h-6 px-2 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
          title="Switch to Full Smart Desk Grid"
        >
          <LayoutGrid class="w-3 h-3 text-amber-400" />
          <span>Lights</span>
        </button>
      </div>
    </div>

    <!-- Tab Content (Height-Budgeted & Responsive) -->
    <div class="flex-1 p-2.5 overflow-y-auto no-scrollbar flex flex-col justify-between">
      <!-- 1. Weather Tab -->
      <div v-if="activeTab === 'weather'" class="h-full flex flex-col justify-between space-y-1.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <component :is="getWeatherIcon(weatherStore.weather?.weatherCode ?? 0)" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-black text-white font-mono leading-none">
                  {{ weatherStore.weather?.currentTemp ?? 25 }}°
                </span>
                <span class="text-xs font-bold text-neutral-300">
                  {{ weatherStore.currentCondition.text }}
                </span>
              </div>
              <div class="text-[10px] text-neutral-400 font-medium flex items-center gap-1 mt-0.5">
                <MapPin class="w-3 h-3 text-sky-400" />
                <span class="truncate max-w-[120px]">{{ weatherStore.weather?.city || 'Local Forecast' }}</span>
              </div>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[11px] font-mono font-bold text-white block">Feels: {{ weatherStore.weather?.feelsLike ?? 26 }}°</span>
            <span class="text-[10px] text-neutral-400 block">Humidity: {{ weatherStore.weather?.humidity ?? 55 }}%</span>
          </div>
        </div>

        <!-- Next few hours horizontal pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
          <div
            v-for="pt in (weatherStore.weather?.hourly || []).slice(0, 5)"
            :key="pt.time"
            class="flex flex-col items-center p-1 rounded-lg bg-white/5 min-w-[45px] shrink-0 text-center"
          >
            <span class="text-[9px] text-neutral-400 font-mono">{{ pt.time.slice(11, 16) }}</span>
            <component :is="getWeatherIcon(pt.code)" class="w-3 h-3 text-sky-400 my-0.5" />
            <span class="text-[10px] font-bold text-white font-mono">{{ pt.temp }}°</span>
          </div>
        </div>
      </div>

      <!-- 2. GitHub Tab -->
      <div v-else-if="activeTab === 'github'" class="h-full flex flex-col justify-between space-y-1.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Flame class="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div class="text-lg font-black text-white font-mono leading-tight">
                {{ githubStore.streakDays }} Days Streak
              </div>
              <div class="text-[10px] text-neutral-400">
                {{ githubStore.todayCommits }} commits pushed today
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <GitPullRequest class="w-3.5 h-3.5" />
            <span>{{ githubStore.pendingPrs }} PRs</span>
          </div>
        </div>

        <!-- 14-day heatmap mini row -->
        <div class="flex items-center gap-1 pt-0.5">
          <div
            v-for="(count, idx) in githubStore.contributionGrid"
            :key="idx"
            class="flex-1 h-4 rounded transition-transform"
            :class="[
              count === 0 ? 'bg-white/5' :
              count < 3 ? 'bg-emerald-950 border border-emerald-800/40' :
              count < 6 ? 'bg-emerald-700/80' : 'bg-emerald-400'
            ]"
            :title="`${count} contributions`"
          />
        </div>
      </div>

      <!-- 3. Deliveries Tab -->
      <div v-else-if="activeTab === 'deliveries'" class="h-full flex flex-col justify-between space-y-1">
        <div v-if="deliveryStore.parcels.length > 0" class="space-y-1.5 overflow-y-auto no-scrollbar">
          <div
            v-for="p in deliveryStore.parcels"
            :key="p.id"
            class="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-1"
          >
            <div class="flex items-center justify-between gap-1.5">
              <div class="text-xs font-bold text-white truncate max-w-[130px]">
                {{ p.title }}
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300">
                  {{ p.status.replace('_', ' ') }}
                </span>
                <button
                  @click.stop="deliveryStore.refreshSingleParcel(p.id)"
                  :disabled="p.isLoading"
                  class="p-1 rounded bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                  :title="p.isLoading ? 'Connecting to courier...' : 'Sync tracking status'"
                >
                  <RefreshCw class="w-2.5 h-2.5 text-amber-400" :class="{ 'animate-spin': p.isLoading }" />
                </button>
              </div>
            </div>

            <div class="text-[10px] text-neutral-300 truncate">
              {{ p.lastCheckpoint || 'Tracking in progress...' }}
            </div>

            <div class="flex items-center justify-between text-[9px] text-neutral-400 pt-0.5 border-t border-white/5">
              <span class="font-mono">AWB: {{ p.trackingNumber }}</span>
              <span class="text-amber-300 font-semibold">{{ p.estimatedDelivery }}</span>
            </div>
          </div>
        </div>

        <div v-else class="h-full flex items-center justify-center text-xs text-neutral-500">
          No active shipments being tracked
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
