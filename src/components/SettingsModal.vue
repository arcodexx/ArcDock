<script setup lang="ts">
import { ref } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
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
  SlidersHorizontal,
  Link2,
  AlertCircle,
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

const localClientId = ref(spotify.clientId);
const copied = ref(false);

// Local HA fields
const localHaUrl = ref(ha.haUrl);
const localHaToken = ref(ha.haToken);
const localMockMode = ref(ha.isMockMode);

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

const handleToggleMock = () => {
  localMockMode.value = !localMockMode.value;
  ha.setMockMode(localMockMode.value);
};

const handleSaveHaConfig = () => {
  ha.setConfig(localHaUrl.value, localHaToken.value);
};
</script>

<template>
  <!-- Full Screen Settings View (100% Opaque, Full Width & Height) -->
  <div class="fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
    <!-- Top Navigation Header -->
    <header class="h-14 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-950">
      <div class="flex items-center gap-3">
        <button
          @click="emit('close')"
          class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white"
          title="Back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white leading-tight">Settings</h2>
          <p class="text-[11px] text-neutral-400">ArcDock System Configuration</p>
        </div>
      </div>

      <button
        @click="emit('close')"
        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
        title="Close"
      >
        <X class="w-5 h-5" />
      </button>
    </header>

    <!-- Scrollable Settings Content Area -->
    <main class="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-2xl w-full mx-auto space-y-6 no-scrollbar">
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
      </section>

      <!-- Home Assistant IoT Configuration -->
      <section class="space-y-3 pt-4 border-t border-white/10">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Home class="w-4 h-4 text-amber-400" /> Home Assistant
          </label>

          <span
            v-if="ha.isMockMode"
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30"
          >
            Mock Engine (Safe)
          </span>
          <span
            v-else-if="ha.connectionStatus === 'connected'"
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
          >
            Connected
          </span>
          <span
            v-else-if="ha.connectionStatus === 'connecting'"
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
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

        <!-- Mock Mode Toggle Card -->
        <div class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="text-sm font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal class="w-4 h-4 text-amber-400" />
              <span>Use Mock Engine</span>
            </div>
            <p class="text-xs text-neutral-400">
              Simulates desk lights, scenes, and switches locally with zero system or network installation.
            </p>
          </div>
          <button
            @click="handleToggleMock"
            class="w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 focus:outline-none cursor-pointer"
            :class="localMockMode ? 'bg-amber-400' : 'bg-neutral-800 border border-white/10'"
            role="switch"
            :aria-checked="localMockMode"
          >
            <span
              class="block w-5.5 h-5.5 rounded-full bg-black shadow-md transform transition duration-200 ease-in-out"
              :class="localMockMode ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'"
            />
          </button>
        </div>

        <!-- Live Connection Inputs -->
        <div v-if="!localMockMode" class="space-y-3 p-3.5 rounded-2xl bg-neutral-900 border border-white/5">
          <div class="space-y-1.5">
            <label class="text-xs text-neutral-400 font-medium">Home Assistant URL</label>
            <div class="relative">
              <Link2 class="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="localHaUrl"
                type="text"
                placeholder="http://127.0.0.1:8123 or http://homeassistant.local:8123"
                class="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs text-neutral-400 font-medium">Long-Lived Access Token</label>
            <div class="relative">
              <Key class="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="localHaToken"
                type="password"
                placeholder="Bearer token from your HA Profile"
                class="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div v-if="ha.errorMessage" class="flex items-center gap-2 text-xs text-rose-400 pt-1">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ ha.errorMessage }}</span>
          </div>

          <button
            @click="handleSaveHaConfig"
            class="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Connect WebSocket
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

        <!-- Client ID input -->
        <div class="space-y-2">
          <label class="text-xs text-neutral-400 font-medium flex items-center justify-between">
            <span>Spotify Client ID</span>
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              class="text-spotify-light hover:underline flex items-center gap-1 text-[11px]"
            >
              Get one from Spotify Dashboard <ExternalLink class="w-3 h-3" />
            </a>
          </label>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <Key class="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="localClientId"
                type="text"
                placeholder="e.g. 4d7b2e987c..."
                class="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-spotify-green transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        <!-- Redirect URI Box -->
        <div class="p-3.5 rounded-2xl bg-neutral-900 border border-white/5 space-y-1.5">
          <div class="flex items-center justify-between text-xs text-neutral-400">
            <span>Required Redirect URI in Spotify Dashboard:</span>
            <button
              @click="copyRedirectUri"
              class="flex items-center gap-1 text-spotify-light hover:text-white transition-colors cursor-pointer"
            >
              <Check v-if="copied" class="w-3.5 h-3.5 text-spotify-green" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <div class="text-xs font-mono text-neutral-300 break-all select-all bg-black px-3 py-2 rounded-lg border border-white/5">
            {{ spotify.redirectUri }}
          </div>
          <div class="text-[11px] text-neutral-500 pt-1">
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
</style>
