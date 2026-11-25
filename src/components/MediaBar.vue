<script setup lang="ts">
import { useSpotifyStore } from '@/stores/spotify';
import { getDeviceIcon } from '@/utils/deviceIcons';
import {
  ListMusic,
  ListOrdered,
  Search,
  RotateCw,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'togglePlaylists'): void;
  (e: 'toggleQueue'): void;
  (e: 'toggleSearch'): void;
  (e: 'toggleDevices'): void;
}>();

const spotify = useSpotifyStore();
</script>

<template>
  <div class="w-full flex items-center justify-between px-3 sm:px-4 py-1.5 shrink-0 z-10 select-none">
    <!-- Left: Target Device Pill & Manual Sync Button -->
    <div class="flex items-center gap-1.5 min-w-0">
      <button
        v-if="spotify.isAuthenticated"
        @click="emit('toggleDevices')"
        class="flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full bg-surface-200/80 hover:bg-surface-100 border border-white/10 active:scale-95 transition-all text-xs text-neutral-300 max-w-[140px] sm:max-w-[190px] cursor-pointer shadow-sm"
        title="Change Playback Target Device"
      >
        <component
          :is="getDeviceIcon(spotify.activeDevice?.type)"
          class="w-3.5 h-3.5 text-spotify-green animate-pulse-subtle shrink-0"
        />
        <span class="truncate font-medium text-[11px]">
          {{ spotify.activeDevice?.name || 'No Target' }}
        </span>
      </button>

      <!-- Manual Sync Button -->
      <button
        v-if="spotify.isAuthenticated"
        @click="spotify.manualRefresh"
        class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 active:scale-90 transition-all text-neutral-400 hover:text-white shrink-0 cursor-pointer"
        title="Sync Playback with Mac/Phone"
      >
        <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': spotify.isRefreshing }" />
      </button>
    </div>

    <!-- Right: Spotify Navigation (Search, Playlists, Queue) -->
    <div v-if="spotify.isAuthenticated" class="flex items-center gap-1.5 shrink-0">
      <button
        @click="emit('toggleSearch')"
        class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
        title="Search & Queue Songs"
      >
        <Search class="w-4 h-4 text-spotify-green" />
      </button>

      <button
        @click="emit('togglePlaylists')"
        class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
        title="Playlists"
      >
        <ListMusic class="w-4 h-4" />
      </button>

      <button
        @click="emit('toggleQueue')"
        class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
        title="Queue"
      >
        <ListOrdered class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
