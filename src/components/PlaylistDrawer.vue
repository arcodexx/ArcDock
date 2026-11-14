<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { formatDuration } from '@/utils/formatters';
import type { SpotifyPlaylist, SpotifyTrack } from '@/types/spotify';
import {
  ListMusic,
  Play,
  Plus,
  Check,
  ChevronLeft,
  X,
  RefreshCw,
  AlertCircle,
  Music,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const spotify = useSpotifyStore();
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

// Selected playlist for drilldown
const selectedPlaylist = ref<SpotifyPlaylist | null>(null);
const playlistTracks = ref<SpotifyTrack[]>([]);
const isTracksLoading = ref(false);
const tracksError = ref<string | null>(null);
const queuedTrackUris = ref<Record<string, boolean>>({});

const loadPlaylists = async () => {
  isLoading.value = true;
  fetchError.value = null;
  try {
    await spotify.fetchPlaylists();
  } catch (err: any) {
    fetchError.value = err?.message || 'Failed to fetch playlists.';
  } finally {
    isLoading.value = false;
  }
};

const openPlaylistDetails = async (playlist: SpotifyPlaylist) => {
  selectedPlaylist.value = playlist;
  playlistTracks.value = [];
  isTracksLoading.value = true;
  tracksError.value = null;

  try {
    const tracks = await spotify.fetchPlaylistTracks(playlist);
    playlistTracks.value = tracks;
  } catch (err: any) {
    tracksError.value = err?.message || 'Failed to load tracks for this playlist.';
  } finally {
    isTracksLoading.value = false;
  }
};

const backToPlaylists = () => {
  selectedPlaylist.value = null;
  playlistTracks.value = [];
  tracksError.value = null;
};

const handlePlayPlaylistAll = async (uri: string) => {
  await spotify.playPlaylist(uri);
  emit('close');
};

const handlePlayTrackInPlaylist = async (trackUri: string) => {
  if (!selectedPlaylist.value) return;
  await spotify.playPlaylist(selectedPlaylist.value.uri, trackUri);
  emit('close');
};

const handleAddToQueue = async (track: SpotifyTrack) => {
  try {
    await spotify.addToQueue(track.uri);
    queuedTrackUris.value[track.uri] = true;
    setTimeout(() => {
      queuedTrackUris.value[track.uri] = false;
    }, 2000);
  } catch (err: any) {
    console.error('Add to queue failed:', err);
  }
};

onMounted(() => {
  loadPlaylists();
});
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-end bg-black/85"
  >
    <div class="w-full max-w-xl h-full bg-surface-100 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      
      <!-- ================= PLAYLIST DETAILS VIEW ================= -->
      <template v-if="selectedPlaylist">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <button
              @click="backToPlaylists"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white"
              title="Back to Playlists"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div class="min-w-0">
              <h2 class="text-lg font-bold text-white truncate">{{ selectedPlaylist.name }}</h2>
              <p class="text-xs text-neutral-400 truncate">
                {{ playlistTracks.length > 0 ? `${playlistTracks.length} songs` : 'Playlist Songs' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="handlePlayPlaylistAll(selectedPlaylist.uri)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-spotify-green hover:bg-spotify-light text-black text-xs font-bold active:scale-95 transition-all shadow-md"
              title="Play entire playlist"
            >
              <Play class="w-3.5 h-3.5 fill-current" /> Play All
            </button>
            <button
              @click="emit('close')"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Tracks List -->
        <div class="flex-1 overflow-y-auto py-4 space-y-2">
          <!-- Loading tracks -->
          <div
            v-if="isTracksLoading"
            class="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3"
          >
            <RefreshCw class="w-8 h-8 animate-spin text-spotify-green" />
            <span class="text-sm">Fetching playlist songs...</span>
          </div>

          <!-- Error state -->
          <div
            v-else-if="tracksError"
            class="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-4"
          >
            <AlertCircle class="w-8 h-8 text-amber-400" />
            <div>
              <div class="text-sm font-semibold text-white">
                {{ tracksError.includes('403') || tracksError.includes('Forbidden') ? 'Playlist Protected by Spotify' : 'Could Not Load Songs' }}
              </div>
              <div class="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                {{
                  tracksError.includes('403') || tracksError.includes('Forbidden')
                    ? 'Spotify restricts third-party apps in Development Mode from reading songs of playlists owned by other users. You can still stream this playlist directly to your target!'
                    : tracksError
                }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="!tracksError.includes('403')"
                @click="selectedPlaylist && openPlaylistDetails(selectedPlaylist)"
                class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold active:scale-95 transition-all"
              >
                Retry
              </button>
              <button
                v-if="selectedPlaylist"
                @click="handlePlayPlaylistAll(selectedPlaylist.uri)"
                class="px-5 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-light text-black text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Play class="w-4 h-4 fill-current" /> Play Entire Playlist
              </button>
            </div>
          </div>

          <!-- Empty tracks -->
          <div
            v-else-if="playlistTracks.length === 0"
            class="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-4"
          >
            <Music class="w-8 h-8 text-neutral-500" />
            <div>
              <div class="text-sm font-semibold text-white">No Individual Songs Loaded</div>
              <div class="text-xs text-neutral-400 mt-1 max-w-xs">
                Tap below to stream this playlist directly on your active device.
              </div>
            </div>
            <button
              v-if="selectedPlaylist"
              @click="handlePlayPlaylistAll(selectedPlaylist.uri)"
              class="px-5 py-2.5 rounded-xl bg-spotify-green hover:bg-spotify-light text-black text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Play class="w-4 h-4 fill-current" /> Play Entire Playlist
            </button>
          </div>

          <!-- Song Items -->
          <div
            v-for="(track, index) in playlistTracks"
            :key="track.id ? `${track.id}-${index}` : String(index)"
            class="w-full p-2.5 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
          >
            <!-- Left: Artwork & Details -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <span class="text-xs font-mono text-neutral-500 w-4 text-center shrink-0">
                {{ index + 1 }}
              </span>
              <div class="w-10 h-10 rounded bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative">
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
                </div>
              </div>
            </div>

            <!-- Right: Play & Add to Queue Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-xs text-neutral-500 font-mono hidden sm:inline mr-2">
                {{ formatDuration(track.duration_ms) }}
              </span>

              <!-- Add to Queue Button -->
              <button
                @click="handleAddToQueue(track)"
                class="p-2 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-neutral-300 hover:text-white"
                :title="queuedTrackUris[track.uri] ? 'Added to Queue' : 'Add to Queue'"
              >
                <Check v-if="queuedTrackUris[track.uri]" class="w-4 h-4 text-spotify-green" />
                <Plus v-else class="w-4 h-4" />
              </button>

              <!-- Play Now Button -->
              <button
                @click="handlePlayTrackInPlaylist(track.uri)"
                class="p-2 rounded-lg bg-spotify-green/20 hover:bg-spotify-green hover:text-black text-spotify-green active:scale-95 transition-all"
                title="Play Song Now"
              >
                <Play class="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-white/10 text-center text-xs text-neutral-500 shrink-0">
          Tap ▶ to play directly, or + to append to your live queue.
        </div>
      </template>

      <!-- ================= ALL PLAYLISTS VIEW ================= -->
      <template v-else>
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 class="text-xl font-bold text-white">Your Playlists</h2>
            <p class="text-xs text-neutral-400">Tap a playlist to view tracks or play</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="loadPlaylists"
              class="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white"
              title="Refresh Playlists"
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

        <!-- Playlists List -->
        <div class="flex-1 overflow-y-auto py-4 space-y-2">
          <!-- Loading State -->
          <div
            v-if="isLoading && (!spotify.playlists || spotify.playlists.length === 0)"
            class="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-3"
          >
            <RefreshCw class="w-8 h-8 animate-spin text-spotify-green" />
            <span class="text-sm">Loading your playlists from Spotify...</span>
          </div>

          <!-- Error State -->
          <div
            v-else-if="fetchError"
            class="flex flex-col items-center justify-center h-48 text-center p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3"
          >
            <AlertCircle class="w-8 h-8 text-red-400" />
            <div class="text-sm font-semibold">{{ fetchError }}</div>
            <button
              @click="loadPlaylists"
              class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!spotify.playlists || spotify.playlists.length === 0"
            class="flex flex-col items-center justify-center h-48 text-center text-neutral-500 text-sm space-y-3"
          >
            <ListMusic class="w-10 h-10 text-neutral-600" />
            <div>No playlists found on your Spotify account.</div>
            <button
              @click="loadPlaylists"
              class="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-neutral-400"
            >
              Refresh
            </button>
          </div>

          <!-- Playlist Items -->
          <div
            v-for="(playlist, index) in (spotify.playlists || []).filter(Boolean)"
            :key="playlist?.id || playlist?.uri || String(index)"
            class="w-full p-2.5 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 transition-all group cursor-pointer"
            @click="openPlaylistDetails(playlist)"
          >
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <div class="w-14 h-14 rounded-lg bg-neutral-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                <img
                  v-if="playlist?.images?.[0]?.url"
                  :src="playlist.images[0].url"
                  :alt="playlist?.name || 'Playlist'"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <ListMusic v-else class="w-6 h-6 text-neutral-600" />
              </div>

              <div class="min-w-0 flex-1 pr-2">
                <div class="font-bold text-sm text-white truncate group-hover:text-spotify-light">
                  {{ playlist?.name || 'Untitled Playlist' }}
                </div>
                <div class="text-xs text-neutral-400 truncate mt-0.5">
                  <span v-if="playlist?.tracks?.total">
                    {{ playlist.tracks.total }} tracks
                  </span>
                  <span v-else>
                    Tap to view songs
                  </span>
                  <span v-if="playlist?.owner?.display_name"> • By {{ playlist.owner.display_name }}</span>
                </div>
              </div>
            </div>

            <!-- Instant Play All shortcut button -->
            <button
              @click.stop="handlePlayPlaylistAll(playlist.uri)"
              class="p-2.5 rounded-xl bg-white/5 hover:bg-spotify-green hover:text-black text-neutral-400 active:scale-95 transition-all shrink-0"
              title="Play playlist immediately"
            >
              <Play class="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-white/10 text-center text-xs text-neutral-500 shrink-0">
          Tap any playlist to explore its songs, or tap ▶ to stream right away.
        </div>
      </template>
    </div>
  </div>
</template>
