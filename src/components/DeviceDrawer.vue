<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { getDeviceIcon } from '@/utils/deviceIcons';
import {
  Check,
  RefreshCw,
  X,
  Volume2,
  AlertCircle,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const spotify = useSpotifyStore();
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

const loadDevices = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    await spotify.fetchDevices();
  } catch (err: any) {
    fetchError.value = err?.message || 'Failed to load devices.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDevices();
});

const handleSelectDevice = async (deviceId: string) => {
  await spotify.transferPlayback(deviceId);
  emit('close');
};
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-end bg-black/85"
  >
    <div class="w-full max-w-md h-full bg-surface-100 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-white">Audio Targets</h2>
          <p class="text-xs text-neutral-400">Select target device for Spotify Connect</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadDevices"
            class="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            title="Refresh Devices"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            title="Close Drawer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Device List -->
      <div class="flex-1 overflow-y-auto py-4 space-y-3">
        <!-- Loading State -->
        <div
          v-if="isLoading && (!spotify.devices || spotify.devices.length === 0)"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3"
        >
          <RefreshCw class="w-8 h-8 animate-spin text-spotify-green" />
          <span class="text-sm">Scanning for Spotify Connect devices...</span>
        </div>

        <!-- Error State -->
        <div
          v-else-if="fetchError"
          class="flex flex-col items-center justify-center h-48 text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3"
        >
          <AlertCircle class="w-8 h-8 text-red-400" />
          <div class="text-sm font-semibold">{{ fetchError }}</div>
          <button
            @click="loadDevices"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!spotify.devices || spotify.devices.length === 0"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-500 text-sm space-y-2"
        >
          <Laptop class="w-8 h-8 text-neutral-600" />
          <div>No active Spotify Connect devices found.</div>
          <div class="text-xs text-neutral-600">Open Spotify on your Mac, phone, or car to connect.</div>
        </div>

        <button
          v-for="device in (spotify.devices || []).filter(Boolean)"
          :key="device.id"
          @click="handleSelectDevice(device.id)"
          class="w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all border"
          :class="
            device.is_active
              ? 'bg-spotify-green/10 border-spotify-green/40 text-white'
              : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
          "
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="device.is_active ? 'bg-spotify-green text-black' : 'bg-white/10 text-neutral-400'"
            >
              <component :is="getDeviceIcon(device.type)" class="w-6 h-6" />
            </div>
            <div>
              <div class="font-bold text-base flex items-center gap-2">
                {{ device.name }}
                <span
                  v-if="device.is_active"
                  class="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-spotify-green text-black font-semibold"
                >
                  Active
                </span>
              </div>
              <div class="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>{{ device.type }}</span>
                <span v-if="device.volume_percent !== null" class="flex items-center gap-1">
                  • <Volume2 class="w-3 h-3 inline" /> {{ device.volume_percent }}%
                </span>
              </div>
            </div>
          </div>

          <Check v-if="device.is_active" class="w-6 h-6 text-spotify-green shrink-0" />
        </button>
      </div>

      <!-- Drawer Footer -->
      <div class="pt-4 border-t border-white/10 text-center text-xs text-neutral-500 shrink-0">
        Glass Remote — Audio streams directly through the chosen target.
      </div>
    </div>
  </div>
</template>
