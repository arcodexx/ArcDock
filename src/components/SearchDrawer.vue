<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { formatDuration } from '@/utils/formatters';
import type { SpotifyTrack } from '@/types/spotify';
import {
  Search,
  Play,
  Plus,
  Check,
  X,
  RefreshCw,
  Music,
  Sparkles,
  AlertCircle,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const spotify = useSpotifyStore();
const searchQuery = ref('');
const searchResults = ref<SpotifyTrack[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);
const queuedUris = ref<Record<string, boolean>>({});

let debounceTimer: number | null = null;

const performSearch = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    searchResults.value = [];
    searchError.value = null;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  searchError.value = null;

  try {
    const results = await spotify.searchTracks(query);
    searchResults.value = results;
  } catch (err: any) {
    searchError.value = err?.message || 'Search failed. Check network or permissions.';
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!newVal.trim()) {
    searchResults.value = [];
    searchError.value = null;
    return;
  }
  debounceTimer = window.setTimeout(performSearch, 400);
});

const handlePlayTrack = async (uri: string) => {
  await spotify.playTrack(uri);
  emit('close');
};

const handleAddToQueue = async (track: SpotifyTrack) => {
  try {
    await spotify.addToQueue(track.uri);
    queuedUris.value[track.uri] = true;
    setTimeout(() => {
      queuedUris.value[track.uri] = false;
    }, 2000);
  } catch (err: any) {
    console.error('Failed to add to queue:', err);
  }
};

const searchInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  searchInputRef.value?.focus();
});
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-end bg-black/85"
  >
    <div class="w-full max-w-xl h-full bg-surface-100 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      <!-- Search Drawer Header -->
      <div class="pb-4 border-b border-white/10 shrink-0 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <Search class="w-5 h-5 text-spotify-green" /> Search Spotify
            </h2>
            <p class="text-xs text-neutral-400">Find tracks to play immediately or add to your queue</p>
          </div>
          <button
            @click="emit('close')"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            title="Close Search"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Search Input Field -->
        <div class="relative">
          <Search class="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Type artist, song, or album and press Enter..."
            @keydown.enter="performSearch"
            class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-base text-white placeholder-neutral-500 focus:outline-none focus:border-spotify-green transition-colors font-sans"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''; searchResults = []; searchError = null"
            class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-white"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Search Results Area -->
      <div class="flex-1 overflow-y-auto py-4 space-y-2">
        <!-- Searching Indicator -->
        <div
          v-if="isSearching"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3"
        >
          <RefreshCw class="w-8 h-8 animate-spin text-spotify-green" />
          <span class="text-sm">Searching Spotify catalog...</span>
        </div>

        <!-- Error State -->
        <div
          v-else-if="searchError"
          class="flex flex-col items-center justify-center h-48 text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3"
        >
          <AlertCircle class="w-8 h-8 text-red-400" />
          <div class="text-sm font-semibold">{{ searchError }}</div>
          <button
            @click="performSearch"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            Retry Search
          </button>
        </div>

        <!-- Initial Blank State -->
        <div
          v-else-if="!searchQuery.trim()"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-500 text-sm space-y-2"
        >
          <Sparkles class="w-8 h-8 text-neutral-600" />
          <div>Type above to search millions of tracks.</div>
        </div>

        <!-- No Results State -->
        <div
          v-else-if="searchResults.length === 0"
          class="flex flex-col items-center justify-center h-48 text-center text-neutral-500 text-sm space-y-2"
        >
          <Music class="w-8 h-8 text-neutral-600" />
          <div>No songs matched "{{ searchQuery }}"</div>
        </div>

        <!-- Track Results List -->
        <div
          v-for="(track, index) in searchResults"
          :key="track.id ? `${track.id}-${index}` : String(index)"
          class="w-full p-2.5 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
        >
          <!-- Track Info -->
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-11 h-11 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                v-if="track?.album?.images?.[0]?.url"
                :src="track.album.images[0].url"
                :alt="track.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <Music v-else class="w-4 h-4 text-neutral-600" />
            </div>

            <div class="min-w-0 pr-2 flex-1">
              <div class="font-bold text-sm text-white truncate group-hover:text-spotify-light">
                {{ track.name }}
              </div>
              <div class="text-xs text-neutral-400 truncate">
                {{ track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist' }}
                <span v-if="track.album?.name" class="text-neutral-500"> • {{ track.album.name }}</span>
              </div>
            </div>
          </div>

          <!-- Actions: Add to Queue & Play Now -->
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-neutral-500 font-mono hidden sm:inline mr-1">
              {{ formatDuration(track.duration_ms) }}
            </span>

            <!-- Queue button -->
            <button
              @click="handleAddToQueue(track)"
              class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-neutral-300 hover:text-white flex items-center gap-1"
              :title="queuedUris[track.uri] ? 'Queued' : 'Add to Queue'"
            >
              <Check v-if="queuedUris[track.uri]" class="w-4 h-4 text-spotify-green" />
              <Plus v-else class="w-4 h-4" />
            </button>

            <!-- Play now button -->
            <button
              @click="handlePlayTrack(track.uri)"
              class="p-2.5 rounded-xl bg-spotify-green/20 hover:bg-spotify-green hover:text-black text-spotify-green active:scale-95 transition-all"
              title="Play Now"
            >
              <Play class="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-4 border-t border-white/10 text-center text-xs text-neutral-500 shrink-0">
        Tap ▶ to stream right away on your target, or + to append to your live queue.
      </div>
    </div>
  </div>
</template>
