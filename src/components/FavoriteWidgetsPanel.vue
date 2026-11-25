<script setup lang="ts">
import { computed } from 'vue';
import { useFavoritesStore, type WidgetType } from '@/stores/favorites';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore, COURIER_LIST } from '@/stores/delivery';
import { useWeatherStore, getWeatherDescription } from '@/stores/weather';
import { useNetworkStore } from '@/stores/network';
import ClimateCard from './cards/ClimateCard.vue';
import LightCard from './cards/LightCard.vue';
import CalendarCard from './widgets/CalendarCard.vue';
import PomodoroCard from './widgets/PomodoroCard.vue';
import HabitCard from './widgets/HabitCard.vue';
import TimezoneBar from './widgets/TimezoneBar.vue';
import ClipboardCard from './widgets/ClipboardCard.vue';
import {
  Star,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
  Github,
  GitPullRequest,
  Package,
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wifi,
  Zap,
  Coffee,
  Moon,
  Plus,
  RefreshCw
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-fullscreen', target: WidgetType): void;
  (e: 'open-all'): void;
  (e: 'collapse'): void;
}>();

const favorites = useFavoritesStore();
const ha = useHomeAssistantStore();
const github = useGitHubStore();
const delivery = useDeliveryStore();
const weather = useWeatherStore();
const network = useNetworkStore();

const primaryAc = computed(() => ha.climates[0] || null);
const displayedLights = computed(() => ha.lights.slice(0, 4));

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

const scenesList = [
  { id: 'scene.focus', name: 'Focus', icon: Zap, color: 'text-amber-400' },
  { id: 'scene.relax', name: 'Relax', icon: Coffee, color: 'text-orange-400' },
  { id: 'scene.night', name: 'Night', icon: Moon, color: 'text-blue-400' },
];

const getCourierName = (id: string) => {
  return COURIER_LIST.find((c) => c.id === id)?.name || id;
};

const getStageNumber = (status: string) => {
  switch (status) {
    case 'dispatched': return 1;
    case 'in_transit': return 2;
    case 'out_for_delivery': return 3;
    case 'delivered': return 4;
    default: return 2;
  }
};
</script>

<template>
  <aside class="h-full w-full flex flex-col bg-black/20 backdrop-blur-sm border-l border-white/10 select-none overflow-hidden">
    <!-- Header: Favorites Indicator + Open All Widgets + Collapse -->
    <header class="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/60 gap-1.5">
      <div class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25 flex items-center gap-1">
          <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>Favorites ({{ favorites.favoriteWidgets.length }}/{{ favorites.maxFavorites }})</span>
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Open All Widgets Drawer -->
        <button
          @click="emit('open-all')"
          class="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white font-bold text-xs tracking-wide active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          title="Open Control Center to access all widgets"
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-sky-400" />
          <span>All Widgets</span>
        </button>

        <!-- Collapse Panel Button -->
        <button
          @click="emit('collapse')"
          title="Collapse Panel"
          class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/5 active:scale-95 cursor-pointer"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Scrollable Favorites Body -->
    <div class="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-2 no-scrollbar">
      <!-- Empty state if 0 favorites -->
      <div
        v-if="favorites.favoriteWidgets.length === 0"
        class="h-full flex flex-col items-center justify-center p-6 text-center space-y-3"
      >
        <Star class="w-8 h-8 text-neutral-600" />
        <div class="space-y-1">
          <div class="text-xs font-bold text-white">No Favorite Widgets Pinned</div>
          <p class="text-[11px] text-neutral-400">
            Open All Widgets and tap the star icon to pin up to 2 widgets on your desk dashboard.
          </p>
        </div>
        <button
          @click="emit('open-all')"
          class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs active:scale-95 cursor-pointer"
        >
          Open All Widgets
        </button>
      </div>

      <!-- Render each pinned favorite widget -->
      <template v-else>
        <div
          v-for="widgetId in favorites.favoriteWidgets"
          :key="widgetId"
          class="rounded-2xl border border-white/10 bg-neutral-900/80 shadow-lg transition-all relative overflow-visible"
        >
          <!-- Widget Card Header: Title + Expand Button -->
          <div class="px-2.5 py-1 border-b border-white/5 flex items-center justify-between bg-black/40">
            <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span v-if="widgetId === 'smartdesk'">Smart Desk IoT</span>
              <span v-else-if="widgetId === 'github'">GitHub Developer Hub</span>
              <span v-else-if="widgetId === 'deliveries'">Domestic Parcel Tracker</span>
              <span v-else-if="widgetId === 'weather'">Desk Weather Station</span>
              <span v-else-if="widgetId === 'network'">Network Monitor</span>
              <span v-else-if="widgetId === 'calendar'">Daily Agenda</span>
              <span v-else-if="widgetId === 'pomodoro'">Focus Pomodoro</span>
              <span v-else-if="widgetId === 'habits'">Daily Habits</span>
              <span v-else-if="widgetId === 'timezones'">World Clock</span>
              <span v-else-if="widgetId === 'clipboard'">LAN Clipboard</span>
            </span>

            <button
              @click="emit('open-fullscreen', widgetId)"
              class="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Expand Full Screen"
            >
              <Maximize2 class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Widget Card Content -->
          <div class="p-2">
            <!-- 1. Unified Smart Desk IoT Widget (Climate + Scenes + Lights) -->
            <div v-if="widgetId === 'smartdesk'" class="space-y-2">
              <!-- Primary AC Climate -->
              <ClimateCard
                v-if="primaryAc"
                :entity="primaryAc"
                @set-temperature="(id, t) => ha.setTemperature(id, t)"
                @set-hvac-mode="(id, m) => ha.setHvacMode(id, m)"
                @set-fan-mode="(id, f) => ha.setFanMode(id, f)"
              />

              <!-- Quick Scenes Row -->
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="s in scenesList"
                  :key="s.id"
                  @click="ha.activateScene(s.id)"
                  class="min-h-[40px] px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-200 active:scale-95 cursor-pointer transition-all shadow-sm"
                >
                  <component :is="s.icon" class="w-3.5 h-3.5" :class="s.color" />
                  <span>{{ s.name }}</span>
                </button>
              </div>

              <!-- Primary Lights Grid -->
              <div v-if="displayedLights.length > 0" class="grid grid-cols-2 gap-1.5">
                <LightCard
                  v-for="l in displayedLights"
                  :key="l.entity_id"
                  :entity="l"
                  @toggle="(id) => ha.toggleLight(id)"
                  @set-brightness="(id, b) => ha.setBrightness(id, b)"
                />
              </div>

              <div v-if="!primaryAc && displayedLights.length === 0" class="text-xs text-neutral-500 py-3 text-center">
                Configure Home Assistant entities in Smart Desk settings.
              </div>
            </div>

            <!-- 3. GitHub Widget -->
            <div
              v-else-if="widgetId === 'github'"
              @click="emit('open-fullscreen', 'github')"
              class="space-y-2 cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Github class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {{ github.streakDays }} Day Streak
                    </div>
                    <div class="text-[10px] text-neutral-400">
                      {{ github.todayCommits }} pushed today
                    </div>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <GitPullRequest class="w-3 h-3" />
                  <span>{{ github.pendingPrs }} PRs</span>
                </span>
              </div>

              <!-- Mini 14-day ribbon -->
              <div class="flex items-center gap-1 pt-1">
                <div
                  v-for="(count, idx) in github.contributionGrid.slice(-14)"
                  :key="idx"
                  class="flex-1 h-3.5 rounded-sm"
                  :class="[
                    count === 0
                      ? 'bg-white/5'
                      : count <= 2
                      ? 'bg-purple-900/60'
                      : count <= 5
                      ? 'bg-purple-600'
                      : 'bg-purple-400 shadow-sm shadow-purple-500/50'
                  ]"
                  :title="`${count} commits`"
                />
              </div>
            </div>

            <!-- 4. Deliveries Widget -->
            <div
              v-else-if="widgetId === 'deliveries'"
              class="space-y-2"
            >
              <div v-if="delivery.parcels.length > 0" class="space-y-2">
                <div
                  v-for="parcel in delivery.parcels"
                  :key="parcel.id"
                  @click="delivery.selectParcel(parcel.id); emit('open-fullscreen', 'deliveries')"
                  class="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border transition-all cursor-pointer group space-y-2"
                  :class="delivery.activeParcel?.id === parcel.id ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-white/5'"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                        <Package class="w-4 h-4" />
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[130px]">
                          {{ parcel.title }}
                        </div>
                        <div class="text-[10px] text-neutral-400 truncate">
                          {{ getCourierName(parcel.courier) }} • {{ parcel.trackingNumber }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <span
                        v-if="parcel.estimatedDelivery"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25"
                      >
                        {{ parcel.estimatedDelivery }}
                      </span>
                      <button
                        @click.stop="delivery.refreshSingleParcel(parcel.id)"
                        :disabled="parcel.isLoading"
                        class="p-1 rounded-lg bg-white/5 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        :title="parcel.isLoading ? 'Connecting to courier...' : 'Sync tracking status'"
                      >
                        <RefreshCw class="w-3.5 h-3.5 text-amber-400" :class="{ 'animate-spin': parcel.isLoading }" />
                      </button>
                    </div>
                  </div>

                  <!-- 4-step progress bar -->
                  <div class="grid grid-cols-4 gap-1 pt-0.5">
                    <div
                      v-for="step in 4"
                      :key="step"
                      class="h-1.5 rounded-full"
                      :class="step <= getStageNumber(parcel.status) ? 'bg-amber-400 shadow-sm' : 'bg-white/10'"
                    />
                  </div>
                </div>
              </div>
              <div
                v-else
                @click="emit('open-fullscreen', 'deliveries')"
                class="text-xs text-neutral-400 py-3 text-center cursor-pointer hover:text-white transition-colors"
              >
                No active shipments. Click to track package.
              </div>
            </div>

            <!-- 5. Weather Widget -->
            <div
              v-else-if="widgetId === 'weather'"
              @click="emit('open-fullscreen', 'weather')"
              class="flex items-center justify-between cursor-pointer group"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <component
                    :is="getWeatherIcon(weather.weather?.weatherCode ?? 1)"
                    class="w-5 h-5"
                  />
                </div>
                <div>
                  <div class="flex items-baseline gap-1">
                    <span class="text-xl font-black text-white font-mono">
                      {{ weather.weather?.currentTemp ?? 26 }}°C
                    </span>
                    <span class="text-xs text-neutral-300 font-medium">
                      {{ weather.currentCondition.text }}
                    </span>
                  </div>
                  <div class="text-[10px] text-neutral-400">
                    Feels like {{ weather.weather?.feelsLike ?? 27 }}°C • {{ weather.weather?.city || 'Weather' }}
                  </div>
                </div>
              </div>

              <div class="text-right font-mono text-[11px] text-neutral-400">
                <div class="text-sky-300">H: {{ weather.weather?.daily[0]?.maxTemp ?? 30 }}°</div>
                <div class="text-neutral-500">L: {{ weather.weather?.daily[0]?.minTemp ?? 20 }}°</div>
              </div>
            </div>

            <!-- 6. Network Widget -->
            <div
              v-else-if="widgetId === 'network'"
              @click="emit('open-fullscreen', 'network')"
              class="flex items-center justify-between cursor-pointer group"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wifi class="w-5 h-5" />
                </div>
                <div>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-xl font-black text-white font-mono">
                      {{ network.pingMs }}ms
                    </span>
                    <span
                      class="text-xs font-bold capitalize"
                      :class="network.status === 'stable' ? 'text-emerald-400' : 'text-amber-400'"
                    >
                      {{ network.status }}
                    </span>
                  </div>
                  <div class="text-[10px] text-neutral-400">
                    DNS ping to Cloudflare (1.1.1.1)
                  </div>
                </div>
              </div>
            </div>

            <!-- 7. Calendar -->
            <CalendarCard
              v-else-if="widgetId === 'calendar'"
              @expand="emit('open-fullscreen', 'calendar')"
            />

            <!-- 8. Pomodoro -->
            <PomodoroCard
              v-else-if="widgetId === 'pomodoro'"
              @expand="emit('open-fullscreen', 'pomodoro')"
            />

            <!-- 9. Habits -->
            <HabitCard
              v-else-if="widgetId === 'habits'"
              @expand="emit('open-fullscreen', 'habits')"
            />

            <!-- 10. Timezones -->
            <TimezoneBar
              v-else-if="widgetId === 'timezones'"
              @expand="emit('open-fullscreen', 'timezones')"
            />

            <!-- 11. Clipboard -->
            <ClipboardCard
              v-else-if="widgetId === 'clipboard'"
              @expand="emit('open-fullscreen', 'clipboard')"
            />
          </div>
        </div>

        <!-- Add 2nd favorite prompt if only 1 is pinned -->
        <button
          v-if="favorites.favoriteWidgets.length === 1"
          @click="emit('open-all')"
          class="w-full py-3 rounded-2xl border border-dashed border-white/15 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4 text-amber-400" />
          <span>Pin 1 more favorite widget</span>
        </button>
      </template>
    </div>
  </aside>
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
