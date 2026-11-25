<script setup lang="ts">
import { computed } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useGitHubStore } from '@/stores/github';
import { useDeliveryStore } from '@/stores/delivery';
import { useCalendarStore } from '@/stores/calendar';
import { usePomodoroStore } from '@/stores/pomodoro';
import {
  Play,
  Pause,
  Timer,
  Github,
  GitPullRequest,
  Package,
  RefreshCw,
  Calendar,
  Radio
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'openSettings'): void;
  (e: 'openFullScreen', target: 'github' | 'deliveries' | 'calendar' | 'pomodoro'): void;
}>();

const spotify = useSpotifyStore();
const github = useGitHubStore();
const delivery = useDeliveryStore();
const calendar = useCalendarStore();
const pomodoro = usePomodoroStore();

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
      <!-- Section 0.5: Active Focus Session / Pomodoro -->
      <div
        v-if="pomodoro.phase !== 'idle'"
        @click="emit('openFullScreen', 'pomodoro')"
        class="p-3 rounded-2xl border space-y-1.5 transition-all cursor-pointer hover:border-rose-400/50"
        :class="pomodoro.phase === 'focus'
          ? 'bg-rose-950/30 border-rose-500/40'
          : 'bg-emerald-950/30 border-emerald-500/40'"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              :class="pomodoro.phase === 'focus' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'"
            >
              <Timer class="w-4 h-4" :class="{ 'animate-pulse': pomodoro.isRunning }" />
            </div>
            <div>
              <div class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{{ pomodoro.phaseLabel }}</span>
                <span class="text-[10px] font-mono opacity-80">({{ pomodoro.completedSessions }} completed)</span>
              </div>
              <div class="text-[10px] text-neutral-400 font-mono">
                {{ pomodoro.isRunning ? 'Countdown active' : 'Paused' }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-lg font-black font-mono text-white tracking-tight">
              {{ pomodoro.formattedTime }}
            </span>
            <button
              @click.stop="pomodoro.togglePlayPause"
              class="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              :class="pomodoro.isRunning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'"
            >
              <Pause v-if="pomodoro.isRunning" class="w-4 h-4" />
              <Play v-else class="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <!-- Section 1: Developer Activity Banner -->
      <div
        @click="emit('openFullScreen', 'github')"
        class="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2.5 cursor-pointer hover:border-purple-500/40 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
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

      <!-- Section 1.5: Upcoming Calendar Event -->
      <div
        v-if="calendar.nextUpcomingEvent"
        @click="emit('openFullScreen', 'calendar')"
        class="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5 cursor-pointer hover:border-blue-500/40 transition-colors"
      >
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 min-w-0 pr-2">
            <Calendar class="w-4 h-4 text-blue-400 shrink-0" />
            <span class="font-bold text-white truncate">{{ calendar.nextUpcomingEvent.title }}</span>
          </div>
          <span class="text-[10px] font-mono text-neutral-400 shrink-0">
            {{ calendar.nextUpcomingEvent.formattedTimeRange }}
          </span>
        </div>
        <div class="flex items-center justify-between pt-0.5 text-[10px]">
          <span class="text-neutral-400 font-mono">{{ calendar.nextUpcomingEvent.startDateFormatted }} • {{ calendar.nextUpcomingEvent.location || 'Calendar Event' }}</span>
          <span v-if="calendar.nextUpcomingEvent.isOngoing" class="font-bold text-emerald-400">Happening Now</span>
          <span v-else-if="calendar.nextUpcomingEvent.minutesUntil <= 30 && calendar.nextUpcomingEvent.minutesUntil >= 0" class="font-bold text-amber-400">In {{ calendar.nextUpcomingEvent.minutesUntil }}m</span>
          <span v-else class="text-neutral-400 font-mono">{{ calendar.nextUpcomingEvent.isToday ? 'Later today' : calendar.nextUpcomingEvent.dayLabel }}</span>
        </div>
      </div>

      <!-- Section 2: Active Parcel Milestone Tracker -->
      <div v-if="delivery.parcels.length > 0" class="space-y-2">
        <div
          v-for="parcel in delivery.parcels"
          :key="parcel.id"
          @click="emit('openFullScreen', 'deliveries')"
          class="p-3 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2 cursor-pointer hover:border-amber-500/40 transition-colors"
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
                class="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center active:scale-90"
                :title="parcel.isLoading ? 'Connecting to courier...' : 'Sync tracking status'"
              >
                <RefreshCw class="w-3.5 h-3.5 text-amber-400" :class="{ 'animate-spin': parcel.isLoading }" />
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

    <!-- Bottom Pinned Bar: 1-Tap Music Resumption / Connect Pill -->
    <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
        <span class="text-[11px] text-neutral-400 truncate font-medium">Standby Mode</span>
      </div>

      <button
        v-if="spotify.isAuthenticated"
        @click="handleResume"
        class="min-h-[44px] py-2.5 px-5 rounded-2xl bg-spotify-green hover:bg-spotify-light text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20"
      >
        <Play class="w-4 h-4 fill-current" />
        <span class="truncate max-w-[170px]">Resume: {{ lastTrackTitle }}</span>
      </button>

      <button
        v-else
        @click="emit('openSettings')"
        class="min-h-[44px] py-2.5 px-5 rounded-2xl bg-spotify-green hover:bg-spotify-light text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-spotify-green/20"
      >
        <Radio class="w-4 h-4" />
        <span>Connect Spotify</span>
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
