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
import NetworkView from '@/components/views/NetworkView.vue';
import CalendarView from '@/components/views/CalendarView.vue';
import PomodoroView from '@/components/views/PomodoroView.vue';
import HabitsView from '@/components/views/HabitsView.vue';
import TimezoneView from '@/components/views/TimezoneView.vue';
import ClipboardView from '@/components/views/ClipboardView.vue';
import FavoriteWidgetsPanel from '@/components/FavoriteWidgetsPanel.vue';
import StandbyWorkHub from '@/components/hub/StandbyWorkHub.vue';
import ThemeBackdrop from '@/components/theme/ThemeBackdrop.vue';
import { useClipboardStore } from '@/stores/clipboard';
import { useScreensaverStore } from '@/stores/screensaver';
import { useThemeStore } from '@/stores/theme';
import { Radio, Clipboard } from 'lucide-vue-next';

const spotify = useSpotifyStore();
const networkStore = useNetworkStore();
const ha = useHomeAssistantStore();
const clipboardStore = useClipboardStore();
const screensaverStore = useScreensaverStore();
const themeStore = useThemeStore();

onMounted(() => {
  clipboardStore.startPolling();
});

onUnmounted(() => {
  clipboardStore.stopPolling();
});

const mode = ref<'desk' | 'car'>((localStorage.getItem('arcdock_mode') as 'desk' | 'car') || 'desk');
useRoomSync(mode);

type DrawerType = 'playlists' | 'queue' | 'devices' | 'settings' | 'search' | null;
const activeDrawer = ref<DrawerType>(null);

// Control Center & Full Screen View State
const isControlCenterOpen = ref(false);
type FullScreenTarget =
  | 'weather'
  | 'github'
  | 'deliveries'
  | 'smartdesk'
  | 'network'
  | 'calendar'
  | 'pomodoro'
  | 'habits'
  | 'timezones'
  | 'clipboard'
  | null;
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

const isWakingShieldActive = ref(false);

const handleScreensaverWake = () => {
  screensaverStore.closePreview();
  wakeUp();
  // Swallow trailing touch/click events for 350ms to prevent ghost clicks on underlying dock buttons
  isWakingShieldActive.value = true;
  setTimeout(() => {
    isWakingShieldActive.value = false;
  }, 350);
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
  // Japan Light Theme: Explicit light morning sky canvas so dark default never shows through
  if (themeStore.currentTheme === 'japan') {
    return {
      background: 'linear-gradient(180deg, #BAE0F5 0%, #D8ECF8 40%, #FFF0F3 80%, #FFF5F8 100%)',
    };
  }
  // Option A: In Default OLED mode, dynamic album art backlighting is used.
  if (themeStore.currentTheme === 'default') {
    if (spotify.dominantColors?.gradientCss) {
      return {
        background: spotify.dominantColors.gradientCss,
      };
    }
    return {
      background: 'radial-gradient(circle at 20% 30%, rgba(30, 32, 38, 0.6) 0%, rgba(12, 13, 15, 0.95) 70%, #000000 100%)',
    };
  }
  // In art-themed modes, the curated theme backdrop takes precedence
  return {};
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
    class="w-screen h-screen overflow-hidden flex flex-col relative select-none transition-colors duration-500"
    :data-theme="themeStore.currentTheme"
    :style="{
      ...backgroundGradientStyle,
      transform: `translate3d(${pixelShift.x}px, ${pixelShift.y}px, 0)`,
    }"
  >
    <!-- Ambient Themed Backdrop Layer -->
    <ThemeBackdrop />

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
            <!-- If Car Mode and authenticated: NowPlaying -->
            <NowPlaying v-if="mode === 'car' && spotify.isAuthenticated" />

            <!-- If Desk Mode and actively playing: NowPlaying -->
            <NowPlaying v-else-if="spotify.isAuthenticated && spotify.isPlaying" />

            <!-- In Desk Mode (whether Spotify is connected or not): Standby Work Hub -->
            <StandbyWorkHub
              v-else-if="mode === 'desk'"
              @open-settings="toggleDrawer('settings')"
              @open-full-screen="handleOpenFullScreen"
            />

            <!-- Car Mode when Spotify not yet connected -->
            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm mx-auto"
            >
              <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-spotify-green shadow-xl">
                <Radio class="w-8 h-8" />
              </div>
              <p class="text-xs text-neutral-400">
                Connect your Spotify account to control car playback.
              </p>
              <button
                @click="toggleDrawer('settings')"
                class="px-6 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-light text-black font-bold text-xs tracking-wide active:scale-95 transition-all cursor-pointer"
              >
                Connect Spotify
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
      <DeskIoTPanel v-if="activeFullScreen === 'smartdesk'" @collapse="closeFullScreen" class="border-none" />
      <NetworkView v-if="activeFullScreen === 'network'" />
      <CalendarView v-if="activeFullScreen === 'calendar'" />
      <PomodoroView v-if="activeFullScreen === 'pomodoro'" />
      <HabitsView v-if="activeFullScreen === 'habits'" />
      <TimezoneView v-if="activeFullScreen === 'timezones'" />
      <ClipboardView v-if="activeFullScreen === 'clipboard'" />
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

    <!-- Compact Top-Center LAN Clipboard Notification Pill -->
    <button
      v-if="clipboardStore.toast"
      @click="activeFullScreen = 'clipboard'; clipboardStore.dismissToast()"
      class="fixed top-2.5 left-1/2 -translate-x-1/2 z-[200] max-w-[85vw] sm:max-w-md bg-neutral-900/95 border border-violet-500/50 shadow-xl shadow-black/60 rounded-full py-1 px-3 flex items-center gap-2 backdrop-blur-md cursor-pointer animate-in fade-in slide-in-from-top-2 duration-200 hover:border-violet-400"
    >
      <div class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0"></div>
      <Clipboard class="w-3.5 h-3.5 text-violet-300 shrink-0" />
      <span class="text-[11px] font-bold text-white truncate shrink-0">{{ clipboardStore.toast.device }}:</span>
      <span class="text-[11px] text-neutral-300 font-mono truncate max-w-[150px] sm:max-w-[220px]">{{ clipboardStore.toast.text }}</span>
      <span class="text-[9px] text-violet-400 font-mono font-bold uppercase shrink-0">Tap to view</span>
    </button>

    <!-- OLED True-Black Screensaver (Ambient Clock) -->
    <OledScreensaver v-if="isSleeping || screensaverStore.isPreviewing" @wake="handleScreensaverWake" />

    <!-- Ghost Click Prevention Shield: Blocks accidental touch-through to underlying dock buttons on wake -->
    <div
      v-if="isWakingShieldActive"
      class="fixed inset-0 z-[250] bg-transparent cursor-default pointer-events-auto select-none"
      @click.stop.prevent
      @pointerdown.stop.prevent
      @pointerup.stop.prevent
      @touchstart.stop.prevent
      @touchend.stop.prevent
    />
  </main>
</template>
