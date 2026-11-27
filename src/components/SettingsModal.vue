<script setup lang="ts">
import { ref } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { useFavoritesStore } from '@/stores/favorites';
import { useScreensaverStore } from '@/stores/screensaver';
import { useThemeStore } from '@/stores/theme';
import { useTimezonesStore } from '@/stores/timezones';
import { useDemo } from '@/composables/useDemo';
import ThemeBackdrop from '@/components/theme/ThemeBackdrop.vue';
import {
  X,
  ArrowLeft,
  Key,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Radio,
  Armchair,
  Car,
  RefreshCw,
  Home,
  Lock,
  Star,
  Clock,
  Palette,
  Eye
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updateMode', mode: 'desk' | 'car'): void;
}>();

const props = defineProps<{
  mode: 'desk' | 'car';
}>();

const spotify = useSpotifyStore();
const ha = useHomeAssistantStore();
const favorites = useFavoritesStore();
const screensaver = useScreensaverStore();
const themeStore = useThemeStore();
const timezones = useTimezonesStore();
const { isDemo } = useDemo();

const handleTestScreensaver = () => {
  screensaver.testScreensaver();
  emit('close');
};

const localClientId = ref(spotify.clientId);
const copied = ref(false);

const handleSaveAndConnect = () => {
  if (!localClientId.value.trim()) return;
  spotify.saveClientId(localClientId.value);
  spotify.login();
};

const copyRedirectUri = async () => {
  try {
    await navigator.clipboard.writeText(spotify.redirectUri);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.warn('[Settings] Failed to copy redirect URI to clipboard:', err);
  }
};

const handleDisconnect = () => {
  spotify.logout();
  emit('close');
};

const deskPin = ref(localStorage.getItem('arcdock_desk_pin') || '0000');
const pinSaved = ref(false);

const saveDeskPin = () => {
  const clean = deskPin.value.trim().slice(0, 4);
  if (clean.length === 4) {
    localStorage.setItem('arcdock_desk_pin', clean);
    deskPin.value = clean;
    pinSaved.value = true;
    setTimeout(() => {
      pinSaved.value = false;
    }, 2000);
  }
};
</script>

<template>
  <!-- Full Screen Settings View -->
  <div
    class="fixed inset-0 z-50 w-screen h-screen flex flex-col select-none overflow-hidden animate-in fade-in duration-150 relative"
    style="background-color: var(--dock-bg);"
  >
    <ThemeBackdrop />

    <!-- Top Navigation Header -->
    <header
      class="h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 relative z-10 backdrop-blur-md transition-colors"
      style="background-color: var(--dock-card-bg); border-color: var(--dock-border); color: var(--dock-text-primary);"
    >
      <div class="flex items-center gap-3">
        <button
          @click="emit('close')"
          class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
          title="Back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white leading-tight">Settings</h2>
          <p class="text-[11px] text-neutral-400">ArcDock System & Hardware Configuration</p>
        </div>
      </div>

      <button
        @click="emit('close')"
        class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white cursor-pointer"
        title="Close"
      >
        <X class="w-5 h-5" />
      </button>
    </header>

    <!-- Scrollable Settings Content Area -->
    <main class="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-2xl w-full mx-auto space-y-6 no-scrollbar relative z-10">
      <!-- Mode Selector -->
      <section class="space-y-2.5">
        <label class="text-xs font-bold uppercase tracking-wider text-neutral-400">Operational Profile</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            @click="emit('updateMode', 'desk')"
            class="p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer"
            :class="
              props.mode === 'desk'
                ? 'bg-blue-500/10 border-blue-500 text-white shadow-sm'
                : 'bg-neutral-900 border-white/5 hover:bg-neutral-800 text-neutral-400'
            "
          >
            <Armchair class="w-5 h-5 mt-0.5 text-blue-400 shrink-0" />
            <div>
              <div class="font-bold text-sm">Desk Mode</div>
              <div class="text-xs text-neutral-400 mt-0.5">Spotify Remote + Smart Desk IoT (Split-Grid)</div>
            </div>
          </button>

          <button
            @click="emit('updateMode', 'car')"
            class="p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer"
            :class="
              props.mode === 'car'
                ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                : 'bg-neutral-900 border-white/5 hover:bg-neutral-800 text-neutral-400'
            "
          >
            <Car class="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
            <div>
              <div class="font-bold text-sm">Car Mode</div>
              <div class="text-xs text-neutral-400 mt-0.5">Full-screen Spotify Remote; IoT suspended</div>
            </div>
          </button>
        </div>

        <!-- Car Kiosk Lock PIN Configuration -->
        <div v-if="!isDemo" class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <Lock class="w-3.5 h-3.5 text-amber-400" />
              <span>Desk Mode Lock PIN</span>
            </div>
            <div class="text-[11px] text-neutral-400">
              Required to exit Car Mode back into Desk Mode (Default: 0000).
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <input
              v-model="deskPin"
              type="password"
              maxlength="4"
              placeholder="0000"
              class="settings-input w-24 h-10 rounded-xl px-2.5 py-2 text-sm text-center tracking-widest font-mono focus:outline-none"
            />
            <button
              @click="saveDeskPin"
              class="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              {{ pinSaved ? 'Saved!' : 'Save' }}
            </button>
          </div>
        </div>

        <!-- Max Pinned Favorites (Customization & Tablet Fit) -->
        <div class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <Star class="w-3.5 h-3.5 text-amber-400" />
              <span>Max Pinned Favorites (Right Pane)</span>
            </div>
            <span class="text-[10px] text-neutral-400 font-mono">Limit: {{ favorites.maxFavorites }} widgets</span>
          </div>
          <p class="text-[11px] text-neutral-400">
            Set the maximum number of simultaneous favorite cards displayed on the right pane while music plays. Phone landscape fits 2; larger tablets comfortably fit 3 or 4.
          </p>
          <div class="flex items-center gap-2 pt-1">
            <button
              v-for="count in [2, 3, 4]"
              :key="count"
              @click="favorites.setMaxFavorites(count)"
              type="button"
              class="flex-1 min-h-[42px] py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              :class="favorites.maxFavorites === count
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'"
            >
              <span>{{ count }} Widgets</span>
              <span class="text-[9px] opacity-70">
                {{ count === 2 ? '(Phone)' : count === 3 ? '(Wide)' : '(Tablet)' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Time Display Format (12h vs 24h) -->
        <div class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-amber-400" />
              <span>Time Display Format</span>
            </div>
            <span class="text-[10px] text-neutral-400 font-mono">
              TopBar & Screensaver
            </span>
          </div>
          <p class="text-[11px] text-neutral-400">
            Choose whether the top system bar and ambient OLED screensaver display 12-hour (AM/PM) or 24-hour digital time.
          </p>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              @click="timezones.setTimeFormat('12h')"
              class="min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              :class="timezones.timeFormat === '12h'
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-md shadow-amber-400/10'
                : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'"
            >
              <span>12-Hour</span>
              <span class="text-[10px] font-mono opacity-80">(05:47 PM)</span>
            </button>
            <button
              type="button"
              @click="timezones.setTimeFormat('24h')"
              class="min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              :class="timezones.timeFormat === '24h'
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-md shadow-amber-400/10'
                : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'"
            >
              <span>24-Hour</span>
              <span class="text-[10px] font-mono opacity-80">(17:47)</span>
            </button>
          </div>
        </div>

        <!-- OLED Screensaver & Clock Themes -->
        <div class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-cyan-400" />
              <span>OLED Screensaver & Clock Themes</span>
            </div>
            <button
              @click="handleTestScreensaver"
              type="button"
              class="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Immediately test screensaver on display"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Test Screensaver</span>
            </button>
          </div>
          <p class="text-[11px] text-neutral-400">
            Choose your ambient standby clock theme. Tap "Test Screensaver" to preview immediately, or cycle themes via the pill at the bottom of the screensaver.
          </p>
          <div class="flex items-center gap-2 pt-1">
            <button
              v-for="t in ([
                { id: 'minimalist', label: 'Minimalist' },
                { id: 'flip', label: 'Retro Flip' },
                { id: 'word', label: 'Word Clock' }
              ] as const)"
              :key="t.id"
              @click="screensaver.setTheme(t.id)"
              type="button"
              class="flex-1 min-h-[42px] py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              :class="screensaver.theme === t.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white'"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Visual Themes & Aesthetics -->
      <section class="space-y-3 pt-4 border-t border-white/10">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Palette class="w-4 h-4 text-pink-400" /> Visual Theme & Style
          </label>
          <span
            class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/10"
            :style="{ backgroundColor: themeStore.currentThemeMeta.badgeBg, color: themeStore.currentThemeMeta.badgeText }"
          >
            {{ themeStore.currentThemeMeta.name }}
          </span>
        </div>

        <p class="text-[11px] text-neutral-400">
          Transform your desk dock into distinct artistic worlds with custom backdrops, materials, and palettes.
        </p>

        <!-- Visual Theme Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-for="t in themeStore.themeList"
            :key="t.id"
            @click="themeStore.setTheme(t.id)"
            type="button"
            class="theme-card p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer relative overflow-hidden"
            :class="themeStore.currentTheme === t.id
              ? 'bg-white/20 border-white/50 shadow-lg ring-1 ring-white/40'
              : 'bg-neutral-900/80 border-white/5 hover:bg-neutral-800/80'"
          >
            <!-- Theme Emoji Box -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/10 shadow-sm"
              :style="{ backgroundColor: t.tone === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)' }"
            >
              {{ t.emoji }}
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="font-bold text-xs truncate">{{ t.name }}</span>
                <span v-if="themeStore.currentTheme === t.id" class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              </div>
              <div class="text-[10px] text-neutral-400 truncate mt-0.5">{{ t.tagline }}</div>

              <!-- Color Swatches -->
              <div class="flex items-center gap-1 mt-1.5">
                <span
                  v-for="(hex, idx) in t.swatches"
                  :key="idx"
                  class="w-3 h-3 rounded-full border border-white/20 shadow-xs"
                  :style="{ backgroundColor: hex }"
                ></span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Spotify Configuration -->
      <section class="space-y-3 pt-4 border-t border-white/10">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Radio class="w-4 h-4 text-spotify-green" /> Spotify Web API (PKCE)
          </label>
          <span
            v-if="spotify.isAuthenticated"
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green border border-spotify-green/30"
          >
            Connected
          </span>
          <span
            v-else
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
          >
            Not Connected
          </span>
        </div>

        <!-- In Demo Mode: Hide whole Spotify configuration form -->
        <div v-if="isDemo" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-bold text-emerald-300 uppercase tracking-wider">Simulated Spotify Remote</span>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">
            In this demo preview, playback, track catalog, playlists, live queues, and device targets are preloaded with sample data. No Client ID or Spotify authorization is required.
          </p>
        </div>

        <!-- In Production: Full Configuration Form -->
        <template v-else>
          <!-- Client ID input -->
          <div class="space-y-2">
            <label class="text-xs font-medium flex items-center justify-between" style="color: var(--dock-text-primary);">
              <span>Spotify Client ID</span>
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                class="hover:underline flex items-center gap-1 text-[11px]"
                style="color: var(--dock-accent);"
              >
                Get one from Spotify Dashboard <ExternalLink class="w-3 h-3" />
              </a>
            </label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <Key class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" style="color: var(--dock-text-muted);" />
                <input
                  v-model="localClientId"
                  type="text"
                  placeholder="e.g. 4d7b2e987c..."
                  class="settings-input w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Redirect URI Box -->
          <div class="p-3.5 rounded-2xl space-y-1.5" style="background-color: var(--dock-card-bg); border: 1px solid var(--dock-card-border); box-shadow: var(--dock-card-shadow);">
            <div class="flex items-center justify-between text-xs" style="color: var(--dock-text-muted);">
              <span>Required Redirect URI in Spotify Dashboard:</span>
              <button
                @click="copyRedirectUri"
                class="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                style="color: var(--dock-accent);"
              >
                <Check v-if="copied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copied ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <div class="text-xs font-mono break-all select-all px-3 py-2 rounded-lg" style="background-color: var(--dock-recessed-bg); border: 1px solid var(--dock-recessed-border); color: var(--dock-text-primary);">
              {{ spotify.redirectUri }}
            </div>
            <div class="text-[11px] pt-1" style="color: var(--dock-text-muted);">
              Add this exact URL to "Redirect URIs" in your Spotify App settings.
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex items-center gap-3">
            <button
              v-if="!spotify.isAuthenticated"
              @click="handleSaveAndConnect"
              class="flex-1 py-3 px-4 rounded-xl bg-spotify-green hover:bg-spotify-light text-black font-bold text-sm tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-spotify-green/20 cursor-pointer"
            >
              Authorize with Spotify (PKCE)
            </button>

            <template v-else>
              <button
                @click="handleSaveAndConnect"
                class="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw class="w-4 h-4" /> Re-authorize
              </button>

              <button
                @click="handleDisconnect"
                class="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-sm tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut class="w-4 h-4" /> Disconnect
              </button>
            </template>
          </div>
        </template>
      </section>

      <!-- Home Assistant Info Section -->
      <section class="space-y-3 pt-4 border-t border-white/10">
        <div v-if="isDemo" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Home class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Simulated Smart Desk IoT</span>
            </div>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Mock Active
            </span>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">
            Home Assistant is running in local simulation with preloaded desk lights, brightness sliders, and SmartThings climate control. Real token and URL configuration are disabled in this web preview.
          </p>
        </div>

        <div v-else class="p-4 rounded-2xl bg-neutral-900 border border-white/5 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Home class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold text-white uppercase tracking-wider">Home Assistant IoT</span>
            </div>
            <span
              v-if="ha.connectionStatus === 'connected'"
              class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
            >
              Connected
            </span>
            <span
              v-else-if="ha.connectionStatus === 'connecting'"
              class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30"
            >
              Connecting...
            </span>
            <span
              v-else
              class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
            >
              Disconnected
            </span>
          </div>
          <p class="text-xs text-neutral-400">
            Home Assistant configuration, credentials, room sync, and LAN QR codes are now managed directly inside the <strong class="text-amber-400 font-medium">Smart Desk</strong> widget (tap the ⚙️ icon in its header).
          </p>
        </div>
      </section>
    </main>
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

.settings-input {
  background-color: var(--dock-recessed-bg, rgba(0, 0, 0, 0.6));
  border: 1px solid var(--dock-recessed-border, rgba(255, 255, 255, 0.1));
  color: var(--dock-text-primary, #ffffff);
}
.settings-input::placeholder {
  color: var(--dock-text-muted, #737373);
  opacity: 0.8;
}
.settings-input:focus {
  border-color: var(--dock-accent, #10B981) !important;
  box-shadow: 0 0 0 1px var(--dock-accent, #10B981) !important;
}
</style>
