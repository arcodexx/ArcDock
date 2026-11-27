<script setup lang="ts">
import { ref } from 'vue';
import { useGitHubStore } from '@/stores/github';
import { useDemo } from '@/composables/useDemo';
import {
  Github,
  GitPullRequest,
  GitCommit,
  ExternalLink,
  Key,
  User,
  Check,
  RefreshCw,
  Settings,
  Star,
  GitFork,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  Flame
} from 'lucide-vue-next';

const githubStore = useGitHubStore();
const { isDemo } = useDemo();

const showConfig = ref(false);
const localUser = ref(githubStore.username);
const localToken = ref(githubStore.token);

const handleSaveConfig = () => {
  githubStore.saveCredentials(localUser.value, localToken.value);
  showConfig.value = false;
};

const getIntensityClass = (count: number) => {
  if (count === 0) return 'bg-white/5 border border-white/5 text-neutral-600';
  if (count < 3) return 'bg-emerald-950/80 border border-emerald-800/40 text-emerald-400';
  if (count < 6) return 'bg-emerald-700/80 border border-emerald-600/50 text-white font-bold';
  return 'bg-emerald-400 border border-emerald-300 text-black font-extrabold shadow-sm shadow-emerald-400/30';
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header: User Profile Banner / Quick Stats -->
    <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="relative shrink-0">
          <img
            v-if="githubStore.userProfile?.avatarUrl"
            :src="githubStore.userProfile.avatarUrl"
            :alt="githubStore.userProfile.name"
            class="w-14 h-14 rounded-2xl border-2 border-purple-500/30 object-cover shadow-md"
          />
          <div
            v-else
            class="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0"
          >
            <Github class="w-7 h-7 text-purple-300" />
          </div>
          <span class="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black absolute -bottom-1 -right-1" />
        </div>

        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-base font-extrabold text-white truncate">
              {{ githubStore.userProfile?.name || githubStore.username || 'GitHub Developer' }}
            </h3>
            <span v-if="githubStore.username" class="text-xs font-mono text-purple-400">
              @{{ githubStore.username }}
            </span>
          </div>

          <p v-if="githubStore.userProfile?.bio" class="text-xs text-neutral-400 line-clamp-1">
            {{ githubStore.userProfile.bio }}
          </p>

          <!-- Social counts pill row -->
          <div v-if="githubStore.userProfile" class="flex items-center gap-3 text-[11px] text-neutral-400 pt-0.5">
            <span class="flex items-center gap-1 font-semibold">
              <Users class="w-3.5 h-3.5 text-neutral-500" />
              <strong class="text-white">{{ githubStore.userProfile.followers }}</strong> followers
            </span>
            <span>•</span>
            <span class="flex items-center gap-1 font-semibold">
              <BookOpen class="w-3.5 h-3.5 text-neutral-500" />
              <strong class="text-white">{{ githubStore.userProfile.publicRepos }}</strong> repos
            </span>
            <span v-if="githubStore.userProfile.location">•</span>
            <span v-if="githubStore.userProfile.location" class="flex items-center gap-1 truncate text-neutral-400">
              <MapPin class="w-3 h-3 text-neutral-500" /> {{ githubStore.userProfile.location }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          @click="githubStore.fetchData"
          :disabled="githubStore.isLoading"
          class="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Refresh GitHub Data"
        >
          <RefreshCw class="w-4 h-4 text-purple-400" :class="{ 'animate-spin': githubStore.isLoading }" />
          <span class="hidden sm:inline">Sync Live</span>
        </button>

        <div
          v-if="isDemo"
          class="px-3.5 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          <span>Demo Activity</span>
        </div>

        <button
          v-else
          @click="showConfig = !showConfig"
          class="px-3.5 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          :class="showConfig ? 'bg-purple-500/25 border-purple-400 text-purple-300' : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'"
          title="Configure GitHub Username & Token"
        >
          <Settings class="w-4 h-4 text-purple-400" />
          <span>{{ showConfig ? 'Close' : 'Account' }}</span>
        </button>
      </div>
    </div>

    <!-- Configure Account Drawer -->
    <div v-if="!isDemo && showConfig" class="p-5 rounded-3xl bg-neutral-900 border border-purple-500/40 space-y-3 animate-in fade-in duration-100">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Github class="w-4 h-4 text-purple-400" />
          <span>GitHub Account Setup</span>
        </h4>
        <button @click="showConfig = false" class="text-neutral-400 hover:text-white text-xs">✕</button>
      </div>
      <p class="text-xs text-neutral-400">
        Enter your GitHub username to track live activity. Add an optional fine-grained Personal Access Token with only <span class="text-purple-300 font-medium">read-only permissions</span> for contribution calendar data and increased rate limits. ArcDock never requires write access.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div class="space-y-1">
          <label class="text-[11px] text-neutral-400 font-medium">GitHub Username</label>
          <div class="relative">
            <User class="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="localUser"
              type="text"
              placeholder="e.g. arcodexx"
              class="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-neutral-400 font-medium">Personal Access Token (optional, read-only)</label>
          <div class="relative">
            <Key class="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="localToken"
              type="password"
              placeholder="github_pat_... or ghp_..."
              class="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-1">
        <button
          @click="handleSaveConfig"
          class="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Save & Sync Live</span>
        </button>
      </div>
    </div>

    <!-- 3 Core Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Streak -->
      <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Flame class="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <div class="text-2xl font-black text-white font-mono leading-none">
            {{ githubStore.streakDays }} {{ githubStore.streakDays === 1 ? 'Day' : 'Days' }}
          </div>
          <div class="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mt-1">
            Active Daily Streak
          </div>
        </div>
      </div>

      <!-- Today's Commits -->
      <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <GitCommit class="w-6 h-6" />
        </div>
        <div>
          <div class="text-2xl font-black text-white font-mono leading-none">
            {{ githubStore.todayCommits }}
          </div>
          <div class="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mt-1">
            Contributions Today
          </div>
        </div>
      </div>

      <!-- Open Pull Requests -->
      <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <GitPullRequest class="w-6 h-6" />
        </div>
        <div>
          <div class="text-2xl font-black text-white font-mono leading-none">
            {{ githubStore.pendingPrs }}
          </div>
          <div class="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mt-1">
            Open Pull Requests
          </div>
        </div>
      </div>
    </div>

    <!-- 14-Day Exact Contribution Calendar Heatmap -->
    <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-emerald-400" />
          <span>14-Day Contribution Heatmap</span>
        </h3>
        <span v-if="githubStore.userProfile?.totalContributionsYear" class="text-xs font-mono font-bold text-neutral-400">
          <strong class="text-emerald-400">{{ githubStore.userProfile.totalContributionsYear }}</strong> contributions in past year
        </span>
      </div>

      <!-- 14 Days Column Grid with Day labels and Counts -->
      <div class="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-1">
        <div
          v-for="(day, idx) in githubStore.recentContributions"
          :key="idx"
          class="flex flex-col items-center gap-1 group"
        >
          <div class="text-[10px] font-mono text-neutral-400 font-bold uppercase">
            {{ day.dayName }}
          </div>
          <div
            class="w-full h-10 rounded-xl transition-all group-hover:scale-105 flex items-center justify-center text-xs font-mono"
            :class="getIntensityClass(day.count)"
            :title="`${day.count} contributions on ${day.displayDate}`"
          >
            {{ day.count > 0 ? day.count : '' }}
          </div>
          <div class="text-[9px] font-mono text-neutral-500 truncate max-w-full">
            {{ day.displayDate.split(' ')[1] }}
          </div>
        </div>
      </div>
    </div>

    <!-- Recently Active / Pinned Repositories Grid -->
    <div v-if="githubStore.topRepos.length > 0" class="p-5 rounded-3xl bg-neutral-900 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
          <BookOpen class="w-3.5 h-3.5 text-purple-400" />
          <span>Active Repositories</span>
        </h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          v-for="repo in githubStore.topRepos"
          :key="repo.name"
          :href="repo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all space-y-2 block group"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
              {{ repo.name }}
            </span>
            <span
              v-if="repo.isPrivate"
              class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/25 shrink-0"
            >
              Private
            </span>
          </div>

          <p v-if="repo.description" class="text-[11px] text-neutral-400 line-clamp-2">
            {{ repo.description }}
          </p>

          <div class="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <div class="flex items-center gap-1.5">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: repo.languageColor || '#3b82f6' }"
              />
              <span class="font-medium text-neutral-300">{{ repo.language }}</span>
            </div>

            <div class="flex items-center gap-3">
              <span v-if="repo.stars > 0" class="flex items-center gap-1">
                <Star class="w-3 h-3 text-amber-400" /> {{ repo.stars }}
              </span>
              <span v-if="repo.forks > 0" class="flex items-center gap-1">
                <GitFork class="w-3 h-3 text-neutral-400" /> {{ repo.forks }}
              </span>
              <span>{{ repo.pushedAt }}</span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <!-- Pull Requests List -->
    <div class="p-5 rounded-3xl bg-neutral-900 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
          <GitPullRequest class="w-3.5 h-3.5 text-purple-400" />
          <span>Active Pull Requests</span>
        </h3>
        <span class="text-xs font-mono font-bold text-neutral-400">
          {{ githubStore.prList.length }} Open
        </span>
      </div>

      <div v-if="githubStore.prList.length === 0" class="py-6 text-center text-xs text-neutral-500">
        No open pull requests found.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="pr in githubStore.prList"
          :key="pr.id"
          class="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between gap-4"
        >
          <div class="space-y-1 min-w-0">
            <div class="text-xs font-bold text-white truncate hover:text-purple-300">
              {{ pr.title }}
            </div>
            <div class="text-[11px] text-neutral-400 flex items-center gap-2">
              <span class="font-mono text-purple-300">{{ pr.repo }}</span>
              <span>•</span>
              <span>by @{{ pr.author }}</span>
              <span>•</span>
              <span>{{ pr.updatedAt }}</span>
            </div>
          </div>

          <a
            :href="pr.url"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-all shrink-0 cursor-pointer"
            title="Open PR on GitHub"
          >
            <ExternalLink class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
