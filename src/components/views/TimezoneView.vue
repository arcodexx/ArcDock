<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTimezonesStore } from '@/stores/timezones';
import { useWeatherStore, type GeocodingResult } from '@/stores/weather';
import {
  Globe,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Clock,
  Sun,
  Sunset,
  Moon,
  Search,
  Loader2,
  Check
} from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const timezonesStore = useTimezonesStore();
const weatherStore = useWeatherStore();

const showAddModal = ref(false);
const searchQuery = ref('');
const searchResults = ref<GeocodingResult[]>([]);
const isSearching = ref(false);
const searchError = ref<string | null>(null);

const newCity = ref('');
const newLabel = ref('');
const newTimezone = ref('');

// Scrubber state (offset in hours from current time)
const hourOffset = ref(0);

const simulatedDate = computed(() => {
  const d = new Date();
  d.setHours(d.getHours() + hourOffset.value);
  return d;
});

// Country fallback mappings for instant country-level timezone lookups
const COUNTRY_MAP: Record<string, { name: string; country: string; timezone: string }[]> = {
  spain: [{ name: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' }, { name: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' }],
  germany: [{ name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' }, { name: 'Munich', country: 'Germany', timezone: 'Europe/Berlin' }],
  france: [{ name: 'Paris', country: 'France', timezone: 'Europe/Paris' }],
  uk: [{ name: 'London', country: 'United Kingdom', timezone: 'Europe/London' }],
  'united kingdom': [{ name: 'London', country: 'United Kingdom', timezone: 'Europe/London' }],
  usa: [{ name: 'New York', country: 'United States', timezone: 'America/New_York' }, { name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' }, { name: 'Chicago', country: 'United States', timezone: 'America/Chicago' }],
  us: [{ name: 'New York', country: 'United States', timezone: 'America/New_York' }, { name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' }],
  'united states': [{ name: 'New York', country: 'United States', timezone: 'America/New_York' }, { name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' }],
  india: [{ name: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' }, { name: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' }, { name: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' }],
  japan: [{ name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' }],
  australia: [{ name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' }, { name: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' }],
  singapore: [{ name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' }],
  canada: [{ name: 'Toronto', country: 'Canada', timezone: 'America/Toronto' }, { name: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' }],
  uae: [{ name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' }],
  dubai: [{ name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' }],
  italy: [{ name: 'Rome', country: 'Italy', timezone: 'Europe/Rome' }, { name: 'Milan', country: 'Italy', timezone: 'Europe/Rome' }],
  netherlands: [{ name: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' }],
  switzerland: [{ name: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich' }],
  ireland: [{ name: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin' }],
  brazil: [{ name: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' }],
  china: [{ name: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' }, { name: 'Beijing', country: 'China', timezone: 'Asia/Shanghai' }],
};

const handleSearchCities = async () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query || query.length < 2) return;
  isSearching.value = true;
  searchError.value = null;

  // Check country match first
  const matchedKey = Object.keys(COUNTRY_MAP).find((k) => k === query || query.includes(k) || k.includes(query));
  let fallbackResults: GeocodingResult[] = [];
  if (matchedKey) {
    fallbackResults = COUNTRY_MAP[matchedKey].map((c, i) => ({
      id: 999000 + i,
      name: c.name,
      latitude: 0,
      longitude: 0,
      country: c.country,
      timezone: c.timezone,
    }));
  }

  try {
    const apiResults = await weatherStore.searchCities(searchQuery.value);
    const combined = [
      ...fallbackResults,
      ...apiResults.filter((a) => !fallbackResults.some((f) => f.name.toLowerCase() === a.name.toLowerCase())),
    ];
    searchResults.value = combined;
    if (combined.length === 0) {
      searchError.value = 'No matching city or country found.';
    }
  } catch {
    searchResults.value = fallbackResults;
    if (fallbackResults.length === 0) {
      searchError.value = 'Lookup failed. Check connection.';
    }
  } finally {
    isSearching.value = false;
  }
};

const handleSelectFoundCity = (city: GeocodingResult) => {
  newCity.value = city.name;
  newTimezone.value = city.timezone && city.timezone !== 'auto'
    ? city.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  newLabel.value = city.country || '';
  searchResults.value = [];
  searchError.value = null;
};

const handleAddSlot = () => {
  if (!newCity.value.trim() || !newTimezone.value.trim()) return;
  timezonesStore.addSlot(newLabel.value.trim(), newCity.value.trim(), newTimezone.value.trim());
  newCity.value = '';
  newLabel.value = '';
  newTimezone.value = '';
  searchQuery.value = '';
  searchResults.value = [];
  showAddModal.value = false;
};
</script>

<template>
  <div class="h-full flex flex-col p-3 sm:p-5 max-w-4xl mx-auto w-full select-none overflow-hidden relative">
    <!-- Compact Top Toolbar (No duplicate h2 header) -->
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
      <div class="flex items-center gap-2">
        <Globe class="w-4 h-4 text-cyan-400 shrink-0" />
        <span class="text-xs sm:text-sm font-bold text-white font-mono">
          {{ timezonesStore.slots.length }} World Cities & Timezones
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="timezonesStore.toggleTimeFormat"
          class="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
          title="Toggle 12h / 24h format"
        >
          Format: {{ timezonesStore.timeFormat }}
        </button>

        <button
          @click="showAddModal = true"
          class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add City</span>
        </button>
      </div>
    </div>

    <!-- Ultra-Compact Meeting Planner / Time Scrubber -->
    <div class="px-3 py-1.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 mb-2 flex items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-1.5 shrink-0">
        <Clock class="w-3.5 h-3.5 text-cyan-400" />
        <span class="text-xs font-semibold text-neutral-300">Scrubber</span>
        <span v-if="hourOffset !== 0" class="text-xs font-mono text-cyan-400 font-bold">
          ({{ hourOffset > 0 ? `+${hourOffset}h` : `${hourOffset}h` }})
        </span>
      </div>

      <!-- Scrubber Slider -->
      <div class="flex-1 flex items-center gap-2 max-w-md">
        <span class="text-[10px] font-mono text-neutral-500">-12h</span>
        <input
          v-model.number="hourOffset"
          type="range"
          min="-12"
          max="12"
          step="1"
          class="flex-1 accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
        />
        <span class="text-[10px] font-mono text-neutral-500">+12h</span>
      </div>

      <button
        v-if="hourOffset !== 0"
        @click="hourOffset = 0"
        class="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 cursor-pointer"
      >
        <RotateCcw class="w-2.5 h-2.5" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Timezones List -->
    <div class="flex-1 overflow-y-auto py-1 space-y-1.5 pr-1 custom-scrollbar">
      <!-- Local Time (Home Base) Reference Card -->
      <div class="flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
        <div class="min-w-0 pr-3">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-cyan-300 truncate">Your Local Time</h3>
            <span class="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
              Home Base
            </span>
          </div>
          <div class="text-[10px] text-neutral-400 font-mono">
            {{ timezonesStore.localTimezone }} • {{ timezonesStore.getLocalTimeInfo(simulatedDate).dateStr }}
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex flex-col items-end">
            <div class="text-sm font-black font-mono text-cyan-300 tracking-tight">
              {{ timezonesStore.getLocalTimeInfo(simulatedDate).timeStr }}
            </div>
            <div
              class="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border mt-0.5"
              :class="timezonesStore.getLocalTimeInfo(simulatedDate).colorClass"
            >
              <Sun v-if="timezonesStore.getLocalTimeInfo(simulatedDate).status === 'working'" class="w-2 h-2" />
              <Sunset v-else-if="timezonesStore.getLocalTimeInfo(simulatedDate).status === 'evening'" class="w-2 h-2" />
              <Moon v-else class="w-2 h-2" />
              <span>{{ timezonesStore.getLocalTimeInfo(simulatedDate).statusLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-for="slot in timezonesStore.slots"
        :key="slot.id"
        class="flex items-center justify-between px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors"
      >
        <!-- Left: City & Label & Zone -->
        <div class="min-w-0 pr-3">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-white truncate">{{ slot.city }}</h3>
            <span class="text-[10px] font-medium text-neutral-300 bg-neutral-800/80 px-1.5 py-0.2 rounded border border-neutral-700/60">
              {{ slot.label }}
            </span>
          </div>
          <div class="text-[10px] text-neutral-400 font-mono">
            {{ slot.timezone }} • {{ timezonesStore.getTimeInfo(slot.timezone, simulatedDate).dateStr }} ({{ timezonesStore.getTimeInfo(slot.timezone, simulatedDate).dayDelta }})
          </div>
        </div>

        <!-- Right: Time & Status Pill & Actions -->
        <div class="flex items-center gap-2.5">
          <div class="flex flex-col items-end">
            <div class="text-sm font-black font-mono text-white tracking-tight">
              {{ timezonesStore.getTimeInfo(slot.timezone, simulatedDate).timeStr }}
            </div>
            <div
              class="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border mt-0.5"
              :class="timezonesStore.getTimeInfo(slot.timezone, simulatedDate).colorClass"
            >
              <Sun v-if="timezonesStore.getTimeInfo(slot.timezone, simulatedDate).status === 'working'" class="w-2 h-2" />
              <Sunset v-else-if="timezonesStore.getTimeInfo(slot.timezone, simulatedDate).status === 'evening'" class="w-2 h-2" />
              <Moon v-else class="w-2 h-2" />
              <span>{{ timezonesStore.getTimeInfo(slot.timezone, simulatedDate).statusLabel }}</span>
            </div>
          </div>

          <button
            @click="timezonesStore.deleteSlot(slot.id)"
            class="p-1 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove timezone"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div v-if="timezonesStore.slots.length === 0" class="text-center py-12 text-neutral-500 text-xs">
        No world cities added. Tap "Add City" to track global times!
      </div>
    </div>

    <!-- Add World Clock City Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div class="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 max-w-md w-full space-y-3.5 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-between pb-1 border-b border-neutral-800/80">
          <div class="flex items-center gap-2">
            <Globe class="w-4 h-4 text-cyan-400" />
            <h3 class="text-sm font-bold text-white">Add World Clock City</h3>
          </div>
          <button @click="showAddModal = false" class="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Searchable City Input (Just like weather widget) -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-neutral-400">Search Worldwide City or Country</label>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search city or country (e.g. Spain, Tokyo, Berlin)"
                class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                @keyup.enter="handleSearchCities"
              />
            </div>
            <button
              @click="handleSearchCities"
              :disabled="isSearching || !searchQuery.trim()"
              class="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
            >
              <Loader2 v-if="isSearching" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSearching ? 'Searching' : 'Search' }}</span>
            </button>
          </div>

          <p v-if="searchError" class="text-[11px] text-rose-400 mt-1">{{ searchError }}</p>

          <!-- Search Results Dropdown List -->
          <div
            v-if="searchResults.length > 0"
            class="mt-2 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden divide-y divide-neutral-800/60 max-h-44 overflow-y-auto custom-scrollbar"
          >
            <button
              v-for="res in searchResults"
              :key="res.id"
              type="button"
              @click="handleSelectFoundCity(res)"
              class="w-full text-left px-3.5 py-2 hover:bg-neutral-900 transition-colors flex items-center justify-between group"
            >
              <div>
                <span class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{{ res.name }}</span>
                <span class="text-[10px] text-neutral-400 ml-1.5">{{ res.admin1 ? `${res.admin1}, ` : '' }}{{ res.country }}</span>
              </div>
              <span class="text-[10px] font-mono text-neutral-500 group-hover:text-cyan-400">
                {{ res.timezone }}
              </span>
            </button>
          </div>
        </div>

        <!-- Selected City Configuration Form -->
        <div v-if="newCity" class="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 space-y-2.5 animate-in fade-in duration-150">
          <div class="flex items-center justify-between text-xs font-bold text-cyan-400 pb-1 border-b border-neutral-800/60">
            <span class="flex items-center gap-1.5">
              <Check class="w-3.5 h-3.5" />
              <span>Selected City</span>
            </span>
            <span class="font-mono text-[11px] text-neutral-400">{{ newTimezone }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-semibold text-neutral-400 mb-0.5">City Display Name</label>
              <input
                v-model="newCity"
                type="text"
                class="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-neutral-400 mb-0.5">Custom Label</label>
              <input
                v-model="newLabel"
                type="text"
                placeholder="e.g. Work, HQ, Friend"
                class="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            @click="showAddModal = false"
            class="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleAddSlot"
            :disabled="!newCity.trim() || !newTimezone.trim()"
            class="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs disabled:opacity-40 hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            Add to World Clock
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
