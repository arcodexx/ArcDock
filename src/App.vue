<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useNetworkStore } from '@/stores/network';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { WIDGET_CATALOG } from '@/stores/favorites';
import { useAmoledProtection } from '@/composables/useAmoledProtection';
import { useRoomSync } from '@/composables/useRoomSync';
import TopBar from '@/components/TopBar.vue';
import MediaBar from '@/components/MediaBar.vue';
import NowPlaying from '@/components/NowPlaying.vue';
import SplitPane from '@/components/SplitPane.vue';
import DeskIoTPanel from '@/components/DeskIoTPanel.vue';
import DeviceDrawer from '@/components/DeviceDrawer.vue';
import PlaylistDrawer from '@/components/PlaylistDrawer.vue';
import QueueDrawer from '@/components/QueueDrawer.vue';
import SearchDrawer from '@/components/SearchDrawer.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import OledScreensaver from '@/components/OledScreensaver.vue';
import ControlCenterDrawer from '@/components/ControlCenterDrawer.vue';
import FullScreenView from '@/components/FullScreenView.vue';
import WeatherView from '@/components/views/WeatherView.vue';
import GitHubView from '@/components/views/GitHubView.vue';
import DeliveryView from '@/components/views/DeliveryView.vue';
import ClimateView from '@/components/views/ClimateView.vue';
import LightsView from '@/components/views/LightsView.vue';
import NetworkView from '@/components/views/NetworkView.vue';
import FavoriteWidgetsPanel from '@/components/FavoriteWidgetsPanel.vue';
import StandbyWorkHub from '@/components/hub/StandbyWorkHub.vue';
import { Radio, Sparkles } from 'lucide-vue-next';

const spotify = useSpotifyStore();
const networkStore = useNetworkStore();
const ha = useHomeAssistantStore();

const mode = ref<'desk' | 'car'>((localStorage.getItem('arcdock_mode') as 'desk' | 'car') || 'desk');
useRoomSync(mode);

type DrawerType = 'playlists' | 'queue' | 'devices' | 'settings' | 'search' | null;
const activeDrawer = ref<DrawerType>(null);

// Control Center & Full Screen View State
const isControlCenterOpen = ref(false);
type FullScreenTarget = 'weather' | 'github' | 'deliveries' | 'climate' | 'lights' | 'network' | null;
const activeFullScreen = ref<FullScreenTarget>(null);

const { isSleeping, wakeUp, pixelShift } = useAmoledProtection(() => !spotify.isPlaying);

// ANTI-02: Suspend 10s network ping and 1s progress ticker during deep OLED sleep
watch(isSleeping, (sleeping) => {
  if (sleeping) {
    networkStore.stopMonitoring();
    spotify.stopPolling();
  } else {
    networkStore.startMonitoring();
    if (spotify.isAuthenticated) {
      spotify.startPolling();
    }
  }
});

// ANTI-03: Suspend Home Assistant WebSocket connection while in Car Mode
watch(
  mode,
  (newMode) => {
    if (newMode === 'car') {
      ha.disconnect();
    } else {
      ha.connect();
    }
  },
  { immediate: true }
);

const toggleMode = () => {
  mode.value = mode.value === 'desk' ? 'car' : 'desk';
  localStorage.setItem('arcdock_mode', mode.value);
  if (mode.value === 'car') {
    isControlCenterOpen.value = false;
    activeFullScreen.value = null;
    closeDrawer();
  }
};

const setMode = (newMode: 'desk' | 'car') => {
  mode.value = newMode;
  localStorage.setItem('arcdock_mode', newMode);
  if (newMode === 'car') {
    isControlCenterOpen.value = false;
    activeFullScreen.value = null;
    closeDrawer();
  }
};

const toggleDrawer = (type: DrawerType) => {
  activeDrawer.value = activeDrawer.value === type ? null : type;
};

const closeDrawer = () => {
  activeDrawer.value = null;
};

const handleOpenFullScreen = (target: NonNullable<FullScreenTarget>) => {
  isControlCenterOpen.value = false;
  activeFullScreen.value = target;
};

const closeFullScreen = () => {
  activeFullScreen.value = null;
};

const getFullScreenMeta = computed(() => {
  if (activeFullScreen.value && WIDGET_CATALOG[activeFullScreen.value]) {
    const meta = WIDGET_CATALOG[activeFullScreen.value];
    return { title: meta.title, subtitle: meta.subtitle };
  }
  return { title: 'Desk Hub', subtitle: '' };
});

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (activeFullScreen.value) {
      closeFullScreen();
    } else if (isControlCenterOpen.value) {
      isControlCenterOpen.value = false;
    } else {
      closeDrawer();
    }
  }
};

const backgroundGradientStyle = computed(() => {
  if (spotify.dominantColors?.gradientCss) {
    return {
      background: spotify.dominantColors.gradientCss,
    };
  }
  return {
    background: 'radial-gradient(circle at 20% 30%, rgba(30, 32, 38, 0.6) 0%, rgba(12, 13, 15, 0.95) 70%, #000000 100%)',
  };
});

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);

  // Check if returning from Spotify OAuth redirect
  const handled = await spotify.handleAuthCallback();
  if (!handled && spotify.isAuthenticated) {
    spotify.startPolling();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <main
    class="w-screen h-screen overflow-hidden flex flex-col relative bg-black select-none transition-colors duration-1000"
    :style="{
      ...backgroundGradientStyle,
      transform: `translate3d(${pixelShift.x}px, ${pixelShift.y}px, 0)`,
    }"
  >
    <!-- Top System Bar: Operational Mode + Grab Handle for Control Center + Settings -->
    <TopBar
      :mode="mode"
      @toggle-mode="toggleMode"
      @open-settings="toggleDrawer('settings')"
      @open-control-center="isControlCenterOpen = true"
      @open-full-screen="handleOpenFullScreen"
    />

    <!-- Main Screen Content: Resizable & Collapsible Split-Grid in Desk Mode -->
    <div class="flex-1 w-full flex flex-col overflow-hidden relative">
      <SplitPane :disabled="mode === 'car'">
        <!-- Left Pane: Media Remote or Paused Standby Hub -->
        <template #left>
          <div class="h-full w-full flex flex-col overflow-hidden relative">
            <!-- Scoped Media Bar: ONLY shown when Spotify is actively PLAYING or in CAR MODE -->
            <MediaBar
              v-if="mode === 'car' || spotify.isPlaying"
              @toggle-playlists="toggleDrawer('playlists')"
              @toggle-queue="toggleDrawer('queue')"
              @toggle-search="toggleDrawer('search')"
              @toggle-devices="toggleDrawer('devices')"
            />

            <!-- Dual-State Left Canvas: Active Playing vs Paused Standby -->
            <template v-if="spotify.isAuthenticated">
              <!-- Active Playing State (or Car Mode): Spotify Remote ONLY -->
              <NowPlaying v-if="mode === 'car' || spotify.isPlaying" />

              <!-- Paused Standby Hub State: Only in Desk Mode when Paused -->
              <StandbyWorkHub v-else />
            </template>

            <!-- Welcome / Setup View when not yet authenticated -->
            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-lg mx-auto"
            >
              <div class="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-spotify-green shadow-2xl">
                <Radio class="w-12 h-12" />
              </div>

              <div class="space-y-2">
                <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                  ArcDock <Sparkles class="w-6 h-6 text-amber-400" />
                </h1>
                <p class="text-sm text-neutral-400">
                  Smart Glass Remote & Dashboard. Connect your Spotify account to control playback on your MacBook, phone, or car audio.
                </p>
              </div>

              <button
                @click="toggleDrawer('settings')"
                class="px-8 py-4 rounded-2xl bg-spotify-green hover:bg-spotify-light text-black font-bold text-base tracking-wide active:scale-95 transition-all shadow-xl shadow-spotify-green/20 cursor-pointer"
              >
                Connect Spotify Account
              </button>
            </div>
          </div>
        </template>

        <!-- Right Pane: Dual-State Right Canvas in Desk Mode -->
        <template #right="{ collapse }">
          <!-- When Spotify is actively PLAYING: Display Pinned Favorite Widgets (up to 2) -->
          <FavoriteWidgetsPanel
            v-if="spotify.isPlaying"
            @open-fullscreen="handleOpenFullScreen"
            @open-all="isControlCenterOpen = true"
            @collapse="collapse"
          />

          <!-- When Spotify is PAUSED: Display Smart Desk IoT Environment (while Left Pane displays Work Hub) -->
          <DeskIoTPanel
            v-else
            @collapse="collapse"
          />
        </template>
      </SplitPane>
    </div>

    <!-- Top-Down Desk Control Center Drawer -->
    <ControlCenterDrawer
      v-if="isControlCenterOpen"
      @close="isControlCenterOpen = false"
      @open-fullscreen="handleOpenFullScreen"
    />

    <!-- Dedicated Full-Screen View Pattern (z-[100]) -->
    <FullScreenView
      v-if="activeFullScreen !== null"
      :title="getFullScreenMeta.title"
      :subtitle="getFullScreenMeta.subtitle"
      :target="activeFullScreen"
      @close="closeFullScreen"
    >
      <WeatherView v-if="activeFullScreen === 'weather'" />
      <GitHubView v-if="activeFullScreen === 'github'" />
      <DeliveryView v-if="activeFullScreen === 'deliveries'" />
      <ClimateView v-if="activeFullScreen === 'climate'" />
      <LightsView v-if="activeFullScreen === 'lights'" />
      <NetworkView v-if="activeFullScreen === 'network'" />
    </FullScreenView>

    <!-- Slide-over Drawers & Modals (Mutually Exclusive) -->
    <DeviceDrawer v-if="activeDrawer === 'devices'" @close="closeDrawer" />
    <PlaylistDrawer v-if="activeDrawer === 'playlists'" @close="closeDrawer" />
    <QueueDrawer
      v-if="activeDrawer === 'queue'"
      @close="closeDrawer"
      @open-search="toggleDrawer('search')"
    />
    <SearchDrawer v-if="activeDrawer === 'search'" @close="closeDrawer" />
    <SettingsModal
      v-if="activeDrawer === 'settings'"
      :mode="mode"
      @close="closeDrawer"
      @update-mode="setMode"
    />

    <!-- OLED True-Black Screensaver (Ambient Clock) -->
    <OledScreensaver v-if="isSleeping" @wake="wakeUp" />
  </main>
</template>
