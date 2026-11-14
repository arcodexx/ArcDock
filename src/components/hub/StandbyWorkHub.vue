<script setup lang="ts">
import { computed } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore } from '@/stores/delivery';
import {
  Play,
  Github,
  GitPullRequest,
  Package,
  RefreshCw
} from 'lucide-vue-next';

const spotify = useSpotifyStore();
const github = useGitHubStore();
const delivery = useDeliveryStore();

const lastTrackTitle = computed(() => {
  return spotify.currentTrack?.name || 'Music';
});

const getStageNumber = (status: string) => {
  switch (status) {
    case 'dispatched': return 1;
    case 'in_transit': return 2;
    case 'out_for_delivery': return 3;
    case 'delivered': return 4;
    default: return 2;
  }
};

const handleResume = () => {
  spotify.togglePlay();
};
</script>

<template>
  <div class="h-full w-full flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden relative bg-black/60 backdrop-blur-md">
    <!-- Top & Middle: Work & Logistics Overview -->
    <div class="flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
      <!-- Section 1: Developer Activity Banner -->
      <div class="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Github class="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div class="text-xs sm:text-sm font-extrabold text-white">
                {{ github.streakDays }} Day Dev Streak
              </div>
              <div class="text-[10px] text-neutral-400">
                {{ github.todayCommits }} commits pushed today
              </div>
            </div>
          </div>

          <div class="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
            <GitPullRequest class="w-3.5 h-3.5" />
            <span>{{ github.pendingPrs }} PRs</span>
          </div>
        </div>

        <!-- Heatmap mini bar -->
        <div class="flex items-center gap-1 pt-0.5">
          <div
            v-for="(count, idx) in github.contributionGrid"
            :key="idx"
            class="flex-1 h-3.5 rounded"
            :class="[
              count === 0 ? 'bg-white/5' :
              count < 3 ? 'bg-emerald-950 border border-emerald-800/40' :
              count < 6 ? 'bg-emerald-700/80' : 'bg-emerald-400'
            ]"
          />
        </div>
      </div>

      <!-- Section 2: Active Parcel Milestone Tracker -->
      <div v-if="delivery.parcels.length > 0" class="space-y-2">
        <div
          v-for="parcel in delivery.parcels"
          :key="parcel.id"
          class="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Package class="w-3.5 h-3.5" />
              </div>
              <div class="truncate">
                <div class="text-xs font-bold text-white truncate">
                  {{ parcel.title }}
                </div>
                <div class="text-[10px] text-neutral-400 truncate">
                  {{ parcel.lastCheckpoint || 'Tracking in progress...' }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300">
                {{ parcel.status.replace('_', ' ') }}
              </span>
              <button
                @click.stop="delivery.refreshSingleParcel(parcel.id)"
                :disabled="parcel.isLoading"
                class="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                :title="parcel.isLoading ? 'Connecting to courier...' : 'Sync tracking status'"
              >
                <RefreshCw class="w-3 h-3 text-amber-400" :class="{ 'animate-spin': parcel.isLoading }" />
              </button>
            </div>
          </div>

          <!-- Milestone Bar -->
          <div class="grid grid-cols-4 gap-1.5 pt-0.5">
            <div
              class="h-1.5 rounded-full"
              :class="getStageNumber(parcel.status) >= 1 ? 'bg-amber-400' : 'bg-white/10'"
            />
            <div
              class="h-1.5 rounded-full"
              :class="getStageNumber(parcel.status) >= 2 ? 'bg-amber-400' : 'bg-white/10'"
            />
            <div
              class="h-1.5 rounded-full"
              :class="getStageNumber(parcel.status) >= 3 ? 'bg-amber-400' : 'bg-white/10'"
            />
            <div
              class="h-1.5 rounded-full"
              :class="getStageNumber(parcel.status) >= 4 ? 'bg-emerald-400' : 'bg-white/10'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Pinned Bar: 1-Tap Music Resumption Pill -->
    <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
        <span class="text-[11px] text-neutral-400 truncate font-medium">Standby Mode</span>
      </div>

      <button
        @click="handleResume"
        class="py-2 px-4 rounded-xl bg-spotify-green hover:bg-spotify-light text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20"
      >
        <Play class="w-3.5 h-3.5 fill-current" />
        <span class="truncate max-w-[160px]">Resume: {{ lastTrackTitle }}</span>
      </button>
    </div>
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
