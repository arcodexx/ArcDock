<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { formatDuration } from '@/utils/formatters';
import type { SpotifyTrack } from '@/types/spotify';
import {
  Music,
  X,
  RefreshCw,
  AlertCircle,
  Play,
  Search,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openSearch'): void;
}>();

const spotify = useSpotifyStore();
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

const loadQueue = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    await spotify.fetchQueue();
  } catch (err: any) {
    fetchError.value = err?.message || 'Failed to fetch queue.';
  } finally {
    isLoading.value = false;
  }
};

const handleJumpToTrack = async (track: SpotifyTrack) => {
  await spotify.playTrack(track.uri);
  setTimeout(loadQueue, 1000);
};

onMounted(() => {
  loadQueue();
});
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-end bg-black/85"
  >
    <div class="w-full max-w-xl h-full bg-surface-100 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-white">Live Queue</h2>
          <p class="text-xs text-neutral-400">Upcoming songs on your active device</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Quick Search Button to add songs -->
          <button
            @click="emit('openSearch')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-spotify-green hover:bg-spotify-light text-black text-xs font-bold active:scale-95 transition-all shadow-md"
            title="Search & Add to Queue"
          >
            <Search class="w-3.5 h-3.5" /> Add Songs
          </button>

          <button
            @click="loadQueue"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            title="Refresh Queue"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            @click="emit('close')"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            title="Close Drawer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Queue List -->
      <div class="flex-1 overflow-y-auto py-4 space-y-2">
        <!-- Loading State -->
        <div
          v-if="isLoading && (!spotify.queue || spotify.queue.length === 0)"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3"
        >
          <RefreshCw class="w-8 h-8 animate-spin text-spotify-green" />
          <span class="text-sm">Fetching upcoming tracks...</span>
        </div>

        <!-- Error State -->
        <div
          v-else-if="fetchError"
          class="flex flex-col items-center justify-center h-48 text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3"
        >
          <AlertCircle class="w-8 h-8 text-red-400" />
          <div class="text-sm font-semibold">{{ fetchError }}</div>
          <button
            @click="loadQueue"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!spotify.queue || spotify.queue.length === 0"
          class="flex flex-col items-center justify-center h-52 text-center text-neutral-500 text-sm space-y-3 p-6 rounded-2xl bg-white/5 border border-white/5"
        >
          <Music class="w-10 h-10 text-neutral-600" />
          <div>Queue is currently empty.</div>
          <div class="text-xs text-neutral-500 max-w-xs">
            Start a playlist, album, or search for any song to queue it up.
          </div>
          <button
            @click="emit('openSearch')"
            class="px-4 py-2 rounded-xl bg-spotify-green hover:bg-spotify-light text-black text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Search class="w-3.5 h-3.5" /> Search songs to add
          </button>
        </div>

        <!-- Queue Items -->
        <div
          v-for="(track, index) in (spotify.queue || []).filter(Boolean)"
          :key="track?.id ? `${track.id}-${index}` : String(index)"
          class="w-full p-2.5 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all group"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="text-xs font-mono text-neutral-500 w-5 text-center shrink-0">
              {{ index + 1 }}
            </span>
            <div class="w-10 h-10 rounded bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                v-if="track?.album?.images?.[0]?.url"
                :src="track.album.images[0].url"
                :alt="track?.name || 'Track'"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <Music v-else class="w-4 h-4 text-neutral-600" />
            </div>
            <div class="min-w-0 flex-1 pr-2">
              <div class="font-bold text-sm text-white truncate group-hover:text-spotify-light">
                {{ track?.name || 'Unknown Track' }}
              </div>
              <div class="text-xs text-neutral-400 truncate">
                {{ track?.artists?.map((a) => a.name).join(', ') || 'Unknown Artist' }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-neutral-500 font-mono hidden sm:inline mr-1">
              {{ formatDuration(track?.duration_ms) }}
            </span>

            <!-- Jump to track button -->
            <button
              @click="handleJumpToTrack(track)"
              class="p-2 rounded-lg bg-white/5 hover:bg-spotify-green hover:text-black text-neutral-300 active:scale-95 transition-all"
              title="Jump to this track"
            >
              <Play class="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-white/10 text-center text-xs text-neutral-500 shrink-0">
        Syncs in real-time with Spotify Connect. Tap <b>Add Songs</b> to append tracks to the queue.
      </div>
    </div>
  </div>
</template>
