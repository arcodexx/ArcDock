<script setup lang="ts">
import { ArrowLeft, X, Star, AlertTriangle } from 'lucide-vue-next';
import { useFavoritesStore, type WidgetType } from '@/stores/favorites';
import ThemeBackdrop from '@/components/theme/ThemeBackdrop.vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
  target?: WidgetType | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const favorites = useFavoritesStore();

const handleToggleFav = () => {
  if (props.target) {
    favorites.toggleFavorite(props.target);
  }
};
</script>

<template>
  <div
    class="fixed inset-0 z-[100] w-screen h-screen flex flex-col select-none overflow-hidden animate-in fade-in duration-150 relative"
    style="background-color: var(--dock-bg);"
  >
    <!-- Common Ambient Theme Backdrop (Mount Fuji, Apple, Retro, Cyberpunk) -->
    <ThemeBackdrop />

    <!-- Top Navigation Header -->
    <header
      class="h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 relative z-10 backdrop-blur-md transition-colors"
      style="background-color: var(--dock-card-bg); border-color: var(--dock-border); color: var(--dock-text-primary);"
    >
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="emit('close')"
          class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer shrink-0"
          title="Back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="truncate">
          <h2 class="text-base sm:text-lg font-bold text-white leading-tight truncate">{{ title }}</h2>
          <p v-if="subtitle" class="text-[11px] text-neutral-400 truncate">{{ subtitle }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- Favorite Widget Toggle Button -->
        <button
          v-if="target"
          @click="handleToggleFav"
          class="min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          :class="favorites.isFavorite(target)
            ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm'
            : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'"
          title="Pin this widget as a favorite on the playing right pane"
        >
          <Star class="w-4 h-4" :class="favorites.isFavorite(target) ? 'fill-amber-400 text-amber-400' : ''" />
          <span class="hidden sm:inline">{{ favorites.isFavorite(target) ? 'Pinned Favorite' : 'Mark Favorite' }}</span>
          <span class="text-[10px] opacity-80 font-mono">({{ favorites.favoriteWidgets.length }}/{{ favorites.maxFavorites }})</span>
        </button>

        <button
          @click="emit('close')"
          class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-neutral-400 hover:text-white cursor-pointer"
          title="Close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Notification Toast for Limit Reached -->
    <div
      v-if="favorites.alertMessage"
      class="px-4 py-2 bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-150"
    >
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 shrink-0" />
        <span>{{ favorites.alertMessage }}</span>
      </div>
      <button
        @click="favorites.clearAlert()"
        class="p-1 hover:text-white text-neutral-400 cursor-pointer text-xs font-bold"
      >
        Dismiss
      </button>
    </div>

    <!-- Content Slot with Clean Scrolling -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar relative z-10">
      <slot />
    </main>
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
