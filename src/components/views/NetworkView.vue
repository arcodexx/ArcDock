<script setup lang="ts">
import { useNetworkStore } from '@/stores/network';
import { Wifi, RefreshCw, Activity } from 'lucide-vue-next';

const networkStore = useNetworkStore();
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Big Stat Card -->
    <div class="p-6 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          :class="[
            networkStore.status === 'stable' ? 'bg-emerald-500/20 text-emerald-400' :
            networkStore.status === 'elevated' ? 'bg-amber-500/20 text-amber-400' :
            'bg-rose-500/20 text-rose-400'
          ]"
        >
          <Wifi class="w-8 h-8" />
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-white font-mono">
              {{ networkStore.pingMs }}
            </span>
            <span class="text-sm font-bold text-neutral-400">ms</span>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ml-2 border"
              :class="[
                networkStore.status === 'stable' ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300' :
                networkStore.status === 'elevated' ? 'bg-amber-400/15 border-amber-400/30 text-amber-300' :
                'bg-rose-400/15 border-rose-400/30 text-rose-300'
              ]"
            >
              {{ networkStore.status }}
            </span>
          </div>
          <div class="text-xs text-neutral-400 mt-1">
            Endpoint: Cloudflare Public DNS (1.1.1.1)
          </div>
        </div>
      </div>

      <button
        @click="networkStore.checkPing"
        class="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer active:scale-95 transition-all"
        title="Check Latency Now"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>

    <!-- History Sparkline / Bars -->
    <div class="p-6 rounded-3xl bg-neutral-900 border border-white/10 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Activity class="w-3.5 h-3.5 text-emerald-400" />
          <span>Recent Ping History (10s intervals)</span>
        </h3>
      </div>

      <div class="flex items-end gap-1.5 h-24 pt-4">
        <div
          v-for="(val, idx) in networkStore.history"
          :key="idx"
          class="flex-1 rounded-t-md transition-all relative group"
          :style="{ height: `${Math.min(100, Math.max(15, (val / 150) * 100))}%` }"
          :class="[
            val < 60 ? 'bg-emerald-400/80 hover:bg-emerald-300' :
            val <= 120 ? 'bg-amber-400/80 hover:bg-amber-300' :
            'bg-rose-500/80 hover:bg-rose-400'
          ]"
        >
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black px-1.5 py-0.5 rounded text-[9px] font-mono text-white font-bold border border-white/20 whitespace-nowrap z-10">
            {{ val }}ms
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
