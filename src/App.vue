<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useAmoledProtection } from '@/composables/useAmoledProtection';
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
import { Radio, Sparkles } from 'lucide-vue-next';

const spotify = useSpotifyStore();

const mode = ref<'desk' | 'car'>((localStorage.getItem('arcdock_mode') as 'desk' | 'car') || 'desk');

type DrawerType = 'playlists' | 'queue' | 'devices' | 'settings' | 'search' | null;
const activeDrawer = ref<DrawerType>(null);

const { isSleeping, wakeUp, pixelShift } = useAmoledProtection(() => !spotify.isPlaying);

const toggleMode = () => {
  mode.value = mode.value === 'desk' ? 'car' : 'desk';
  localStorage.setItem('arcdock_mode', mode.value);
};

const setMode = (newMode: 'desk' | 'car') => {
  mode.value = newMode;
  localStorage.setItem('arcdock_mode', newMode);
};

const toggleDrawer = (type: DrawerType) => {
  activeDrawer.value = activeDrawer.value === type ? null : type;
};

const closeDrawer = () => {
  activeDrawer.value = null;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeDrawer();
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
    <!-- Top System Bar: Operational Mode (Icon only) + Clock + Settings -->
    <TopBar
      :mode="mode"
      @toggle-mode="toggleMode"
      @open-settings="toggleDrawer('settings')"
    />

    <!-- Main Screen Content: Resizable & Collapsible Split-Grid in Desk Mode -->
    <div class="flex-1 w-full flex flex-col overflow-hidden relative">
      <SplitPane :disabled="mode === 'car'">
        <!-- Left Pane: Media Remote with Scoped Controls -->
        <template #left>
          <div class="h-full w-full flex flex-col overflow-hidden relative">
            <!-- Scoped Media Bar (Target Device + Search, Playlists, Queue strictly inside Spotify area) -->
            <MediaBar
              @toggle-playlists="toggleDrawer('playlists')"
              @toggle-queue="toggleDrawer('queue')"
              @toggle-search="toggleDrawer('search')"
              @toggle-devices="toggleDrawer('devices')"
            />

            <!-- Authenticated Spotify Player View -->
            <NowPlaying v-if="spotify.isAuthenticated" />

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
                class="px-8 py-4 rounded-2xl bg-spotify-green hover:bg-spotify-light text-black font-bold text-base tracking-wide active:scale-95 transition-all shadow-xl shadow-spotify-green/20"
              >
                Connect Spotify Account
              </button>
            </div>
          </div>
        </template>

        <!-- Right Pane: Smart Desk IoT Controls (Desk Mode Only) -->
        <template #right="{ collapse }">
          <DeskIoTPanel @collapse="collapse" />
        </template>
      </SplitPane>
    </div>

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
