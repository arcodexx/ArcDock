<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCalendarStore } from '@/stores/calendar';
import { Calendar, Video, Clock, RefreshCw, Settings, X, AlertCircle } from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const calendar = useCalendarStore();

const showSettingsDrawer = ref(false);
const inputUrl = ref(calendar.feedUrl);
const sampleToggle = ref(calendar.useSampleEvents);

const handleSaveSettings = () => {
  calendar.setUseSampleEvents(sampleToggle.value);
  if (!sampleToggle.value) {
    calendar.setFeedUrl(inputUrl.value);
  }
  showSettingsDrawer.value = false;
};

onMounted(() => {
  calendar.fetchCalendar();
});
</script>

<template>
  <div class="h-full flex flex-col p-3 sm:p-5 max-w-4xl mx-auto w-full select-none overflow-hidden relative">
    <!-- Compact Top Toolbar (No duplicate h2 header) -->
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-blue-400 shrink-0" />
        <span class="text-sm font-bold text-white font-mono">{{ calendar.currentDateFormatted }}</span>
        <span class="text-xs text-neutral-500 font-mono hidden sm:inline">• {{ calendar.events.length }} events scheduled</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="calendar.fetchCalendar"
          class="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Refresh calendar"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': calendar.isLoading }" />
        </button>

        <button
          @click="showSettingsDrawer = true"
          class="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold tracking-wide transition-colors"
          :class="showSettingsDrawer
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'"
        >
          <Settings class="w-3.5 h-3.5" />
          <span>Source</span>
        </button>
      </div>
    </div>

    <!-- Agenda Event Stream Grouped By Day -->
    <div class="flex-1 overflow-y-auto py-2 space-y-4 pr-1 custom-scrollbar">
      <div
        v-for="group in calendar.groupedEvents"
        :key="group.dateFormatted"
        class="space-y-2"
      >
        <!-- Date Header Divider -->
        <div class="flex items-center gap-2 pt-1 pb-1">
          <span
            class="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md"
            :class="group.isToday ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/60'"
          >
            {{ group.dayKey }}
          </span>
          <span class="text-[11px] text-neutral-400 font-mono">{{ group.dateFormatted }}</span>
          <div class="flex-1 h-px bg-neutral-800/60"></div>
          <span class="text-[10px] text-neutral-500 font-mono">{{ group.events.length }} {{ group.events.length === 1 ? 'event' : 'events' }}</span>
        </div>

        <!-- Event Cards in this Day Group -->
        <div
          v-for="event in group.events"
          :key="event.id"
          class="flex items-center justify-between p-3 rounded-2xl border transition-colors gap-3"
          :class="{
            'bg-blue-950/20 border-blue-500/40 shadow-sm shadow-blue-500/10': event.isOngoing,
            'bg-neutral-900/60 border-neutral-800/80': !event.isOngoing && !event.isPassed,
            'bg-neutral-950/40 border-neutral-900 opacity-60': event.isPassed,
          }"
        >
          <!-- Left Time & Details -->
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-950 border border-neutral-800/80 min-w-[70px] text-center">
              <span class="text-xs font-bold font-mono text-white">
                {{ new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>
              <span class="text-[10px] font-mono text-neutral-500">
                {{ new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="text-xs sm:text-sm font-bold text-white truncate">{{ event.title }}</h3>

                <span
                  v-if="event.isOngoing"
                  class="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse"
                >
                  Happening Now
                </span>
                <span
                  v-else-if="event.minutesUntil <= 30 && event.minutesUntil >= 0 && !event.isPassed"
                  class="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                >
                  <AlertCircle class="w-3 h-3" />
                  In {{ event.minutesUntil }}m
                </span>
              </div>

              <div class="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                <span v-if="event.location" class="truncate font-mono">{{ event.location }}</span>
                <span v-if="event.description" class="truncate text-neutral-500 max-w-sm">{{ event.description }}</span>
              </div>
            </div>
          </div>

          <!-- Right Platform Badge (No Join button) -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              v-if="event.location || event.meetUrl"
              class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300"
            >
              <Video class="w-3 h-3 text-blue-400" />
              <span>{{ event.meetUrl?.includes('zoom') ? 'Zoom' : event.meetUrl?.includes('teams') ? 'Teams' : event.location || 'Google Meet' }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="calendar.events.length === 0" class="text-center py-12 text-neutral-500 space-y-1">
        <Clock class="w-7 h-7 text-neutral-700 mx-auto mb-1" />
        <p class="text-xs font-semibold text-neutral-400">No events scheduled for {{ calendar.currentDateFormatted }}</p>
        <p class="text-[11px] text-neutral-600">Configure your private iCal link in Source settings or toggle Sample Mode.</p>
      </div>
    </div>

    <!-- Settings Drawer Modal -->
    <div
      v-if="showSettingsDrawer"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-md w-full space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <Settings class="w-4 h-4 text-blue-400" />
            <h3 class="text-base font-bold text-white">Calendar Source Settings</h3>
          </div>
          <button @click="showSettingsDrawer = false" class="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Sample Mode Toggle -->
        <div class="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div>
            <div class="text-xs font-bold text-white">Enable Sample Events</div>
            <div class="text-[10px] text-neutral-500">2 realistic test events to test radar UI</div>
          </div>
          <input
            v-model="sampleToggle"
            type="checkbox"
            class="w-5 h-5 accent-blue-500 rounded cursor-pointer"
          />
        </div>

        <!-- iCal Feed URL Input -->
        <div :class="{ 'opacity-50 pointer-events-none': sampleToggle }">
          <label class="block text-xs font-semibold text-neutral-300 mb-1">
            Private iCal Feed (.ics URL)
          </label>
          <input
            v-model="inputUrl"
            type="text"
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            class="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
          <div class="mt-2 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/60 text-[11px] text-neutral-400 space-y-1">
            <p class="font-semibold text-neutral-300">How to get this from Google Calendar:</p>
            <ol class="list-decimal list-inside space-y-0.5 text-neutral-500">
              <li>Open Google Calendar Web Settings on your computer.</li>
              <li>Under "Settings for my calendars", click your work/personal calendar.</li>
              <li>Scroll down to "Integrate calendar".</li>
              <li>Copy the <strong>"Secret address in iCal format"</strong>.</li>
            </ol>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="showSettingsDrawer = false"
            class="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSaveSettings"
            class="px-4 py-2 rounded-xl bg-blue-500 text-black font-semibold text-xs hover:bg-blue-400 transition-colors"
          >
            Save & Sync
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
