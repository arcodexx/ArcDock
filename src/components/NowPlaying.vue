<script setup lang="ts">
import { computed } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { formatDuration } from '@/utils/formatters';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  Plus,
  Check,
} from 'lucide-vue-next';

const spotify = useSpotifyStore();

const track = computed(() => spotify.currentTrack);
const isPlaying = computed(() => spotify.isPlaying);
const artworkUrl = computed(() => track.value?.album?.images?.[0]?.url || '');
const artistsString = computed(() => track.value?.artists?.map((a) => a.name).join(', ') || 'No Artist');

const progressPercent = computed(() => {
  if (!spotify.playback || !track.value || track.value.duration_ms === 0) return 0;
  return Math.min(100, Math.max(0, (spotify.playback.progress_ms / track.value.duration_ms) * 100));
});

const handleProgressBarClick = (event: MouseEvent) => {
  if (!track.value || track.value.duration_ms === 0) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const newProgressMs = percentage * track.value.duration_ms;
  spotify.seek(newProgressMs);
};
</script>

<template>
  <div class="flex-1 w-full flex items-center justify-center px-3 sm:px-6 pb-2 overflow-hidden">
    <!-- Active Playback View (Optimized for Landscape Phone Screens) -->
    <div
      v-if="track"
      class="w-full max-w-5xl grid grid-cols-12 gap-3 sm:gap-6 items-center justify-center h-full"
    >
      <!-- Left Column: Album Artwork (Scales from 140px on phone to 280px on larger screens) -->
      <div class="col-span-5 flex items-center justify-center">
        <div class="relative group aspect-square w-full max-w-[140px] sm:max-w-[200px] lg:max-w-[280px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 shrink-0">
          <img
            v-if="artworkUrl"
            :src="artworkUrl"
            :alt="track.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
            <Music class="w-12 h-12" />
          </div>
        </div>
      </div>

      <!-- Right Column: Metadata, Progress, Controls -->
      <div class="col-span-7 flex flex-col justify-center gap-2 sm:gap-4 min-w-0">
        <!-- Title, Artist & Like Button -->
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-0.5 min-w-0 flex-1">
            <h1 class="text-base sm:text-xl lg:text-3xl font-extrabold text-white tracking-tight line-clamp-1 leading-tight">
              {{ track.name }}
            </h1>
            <p class="text-xs sm:text-sm lg:text-base font-medium text-neutral-300 line-clamp-1">
              {{ artistsString }}
            </p>
            <p class="text-[10px] sm:text-xs text-neutral-500 line-clamp-1">
              {{ track.album.name }}
            </p>
          </div>

          <!-- Spotify Library Button (+ / Check) -->
          <button
            @click="spotify.toggleLikeCurrentTrack"
            class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full active:scale-90 transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-sm"
            :class="
              spotify.isCurrentTrackLiked
                ? 'bg-spotify-green text-black hover:bg-spotify-light shadow-md shadow-spotify-green/20'
                : 'border-2 border-neutral-400 text-neutral-400 hover:text-white hover:border-white'
            "
            :title="spotify.isCurrentTrackLiked ? 'Added to Liked Songs (tap to remove)' : 'Add to Liked Songs'"
          >
            <Check v-if="spotify.isCurrentTrackLiked" class="w-4 h-4 stroke-[3]" />
            <Plus v-else class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Progress Bar & Timestamps -->
        <div class="space-y-1 select-none">
          <div
            @click="handleProgressBarClick"
            class="py-2.5 -my-2.5 w-full cursor-pointer relative group flex items-center"
          >
            <div class="h-2 w-full bg-white/15 rounded-full overflow-hidden relative">
              <div
                class="h-full bg-white group-hover:bg-spotify-light rounded-full transition-all duration-150 relative"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
          </div>
          <div class="flex justify-between text-[10px] sm:text-xs font-semibold text-neutral-400 font-mono">
            <span>{{ formatDuration(spotify.playback?.progress_ms || 0) }}</span>
            <span>{{ formatDuration(track.duration_ms) }}</span>
          </div>
        </div>

        <!-- Primary Control Bar (Optimized for Touch Glanceability on Phone) -->
        <div class="flex items-center justify-between pt-1">
          <!-- Shuffle Button -->
          <button
            @click="spotify.toggleShuffle"
            class="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all relative cursor-pointer"
            :class="spotify.playback?.shuffle_state ? 'text-spotify-green' : 'text-neutral-400'"
            title="Toggle Shuffle"
          >
            <Shuffle class="w-4 h-4 sm:w-5 sm:h-5" />
            <span
              v-if="spotify.playback?.shuffle_state"
              class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-spotify-green"
            ></span>
          </button>

          <!-- Skip Previous -->
          <button
            @click="spotify.previous"
            class="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="Previous Track"
          >
            <SkipBack class="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>

          <!-- Big Play / Pause Primary Button -->
          <button
            @click="spotify.togglePlay"
            class="w-13 h-13 sm:w-16 sm:h-16 min-w-[52px] min-h-[52px] rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-white/10 cursor-pointer"
            title="Play / Pause"
          >
            <Pause v-if="isPlaying" class="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            <Play v-else class="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-0.5" />
          </button>

          <!-- Skip Next -->
          <button
            @click="spotify.next"
            class="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward class="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>

          <!-- Repeat Mode Button -->
          <button
            @click="spotify.cycleRepeat"
            class="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all relative cursor-pointer"
            :class="spotify.playback?.repeat_state !== 'off' ? 'text-spotify-green' : 'text-neutral-400'"
            title="Repeat Mode"
          >
            <Repeat1 v-if="spotify.playback?.repeat_state === 'track'" class="w-4 h-4 sm:w-5 sm:h-5" />
            <Repeat v-else class="w-4 h-4 sm:w-5 sm:h-5" />
            <span
              v-if="spotify.playback?.repeat_state !== 'off'"
              class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-spotify-green"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty / Idle State when connected but nothing is active -->
    <div
      v-else
      class="flex flex-col items-center justify-center text-center max-w-sm p-4 rounded-2xl bg-surface-100/40 border border-white/5 space-y-2"
    >
      <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neutral-500">
        <Music class="w-6 h-6" />
      </div>
      <div>
        <h2 class="text-base font-bold text-white">Playback Inactive</h2>
        <p class="text-xs text-neutral-400 mt-0.5">
          Open Spotify on any connected device or pick a playlist.
        </p>
      </div>
    </div>

    <!-- Toast notification for errors / permissions -->
    <div
      v-if="spotify.error"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-sm px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs flex items-center gap-2 shadow-2xl"
    >
      <span class="text-neutral-300 text-[11px]">{{ spotify.error }}</span>
      <button
        @click="spotify.error = null"
        class="text-neutral-400 hover:text-white p-0.5 font-bold text-xs"
      >
        ✕
      </button>
    </div>
  </div>
</template>
