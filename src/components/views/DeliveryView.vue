<script setup lang="ts">
import { ref } from 'vue';
import { useDeliveryStore, type CourierInfo } from '@/stores/delivery';
import {
  Plus,
  Trash2,
  Clock,
  MapPin,
  Check,
  RefreshCw,
  ExternalLink,
  Package,
  Navigation
} from 'lucide-vue-next';

const deliveryStore = useDeliveryStore();

const showAddModal = ref(false);
const isAdding = ref(false);
const newTitle = ref('');
const newTrackingNumber = ref('');
const newCourier = ref('delhivery');

const handleAdd = async () => {
  if (!newTrackingNumber.value.trim() || isAdding.value) return;
  isAdding.value = true;
  const t = newTitle.value;
  const num = newTrackingNumber.value;
  const c = newCourier.value;
  newTitle.value = '';
  newTrackingNumber.value = '';
  showAddModal.value = false;
  isAdding.value = false;
  await deliveryStore.addParcel(t, num, c);
};

const getStageNumber = (status: string) => {
  switch (status) {
    case 'dispatched': return 1;
    case 'in_transit': return 2;
    case 'out_for_delivery': return 3;
    case 'delivered': return 4;
    default: return 1;
  }
};

const getCourierName = (id: string) => {
  return deliveryStore.carriers.find((c: CourierInfo) => c.id === id)?.name || id.toUpperCase();
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header with Track New Package & Live Sync -->
    <div class="flex items-center justify-between p-5 rounded-3xl bg-neutral-900 border border-white/10">
      <div>
        <h3 class="text-base font-extrabold text-white flex items-center gap-2">
          <span>Domestic Deliveries</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            ShipTrack Live
          </span>
        </h3>
        <p class="text-xs text-neutral-400">Multi-carrier Indian courier tracker (Delhivery, Blue Dart, Ekart, Amazon, DTDC)</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="deliveryStore.parcels.length > 0"
          @click="deliveryStore.refreshParcels"
          :disabled="deliveryStore.isRefreshing"
          class="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Refresh All Package Checkpoints"
        >
          <RefreshCw class="w-4 h-4 text-emerald-400" :class="{ 'animate-spin': deliveryStore.isRefreshing }" />
          <span>{{ deliveryStore.isRefreshing ? 'Syncing...' : 'Sync Live' }}</span>
        </button>

        <button
          @click="showAddModal = true"
          class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/20"
        >
          <Plus class="w-4 h-4" />
          <span>Track Package</span>
        </button>
      </div>
    </div>

    <!-- Add Package Modal / Drawer -->
    <div v-if="showAddModal" class="p-5 rounded-3xl bg-neutral-900 border border-amber-500/40 space-y-4 animate-in fade-in duration-100">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Package class="w-4 h-4 text-amber-400" />
          <span>Register New Shipment</span>
        </h4>
        <button @click="showAddModal = false" class="text-neutral-400 hover:text-white text-xs">✕</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="space-y-1">
          <label class="text-[11px] text-neutral-400 font-medium">Package Label (Optional)</label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="e.g. Mechanical Keycaps"
            class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-neutral-400 font-medium">Tracking Number (AWB)</label>
          <input
            v-model="newTrackingNumber"
            type="text"
            placeholder="e.g. 420791991534"
            @keyup.enter="handleAdd"
            class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-neutral-400 font-medium">Supported Courier</label>
          <select
            v-model="newCourier"
            class="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option v-for="c in deliveryStore.carriers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1">
        <button
          @click="showAddModal = false"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
        >
          Cancel
        </button>
        <button
          @click="handleAdd"
          :disabled="isAdding"
          class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-400/20 disabled:opacity-50"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Save & Track Live</span>
        </button>
      </div>
    </div>

    <!-- Empty State when 0 packages -->
    <div
      v-if="deliveryStore.parcels.length === 0"
      class="p-12 rounded-3xl bg-neutral-900 border border-white/10 text-center space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
        <Package class="w-7 h-7" />
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-white">No shipments currently tracked</h4>
        <p class="text-xs text-neutral-400 max-w-sm mx-auto">
          Add your Indian courier AWB tracking number to monitor live transit checkpoints on your desk dashboard.
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
      >
        <Plus class="w-4 h-4" />
        <span>Track Package Now</span>
      </button>
    </div>

    <!-- Active Packages List -->
    <div v-else class="space-y-4">
      <div
        v-for="(parcel, index) in deliveryStore.parcels"
        :key="parcel.id"
        class="p-5 rounded-3xl bg-neutral-900 border space-y-4 transition-all"
        :class="deliveryStore.activeParcel?.id === parcel.id ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5' : 'border-white/10'"
        @click="deliveryStore.selectParcel(parcel.id)"
      >
        <!-- Package Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-white">{{ parcel.title }}</span>
              <span
                v-if="index === 0"
                class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
              >
                Newest
              </span>
              <span
                v-if="deliveryStore.activeParcel?.id === parcel.id"
                class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30"
              >
                Featured on Main Screen
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/25">
                {{ getCourierName(parcel.courier) }}
              </span>
              <!-- Querying Loader Badge -->
              <span
                v-if="parcel.isLoading"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 animate-pulse"
              >
                <RefreshCw class="w-3 h-3 animate-spin text-amber-400" />
                <span>Connecting to Courier...</span>
              </span>
              <span
                v-else-if="parcel.destination"
                class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-neutral-300 border border-white/10 flex items-center gap-1"
              >
                <Navigation class="w-2.5 h-2.5 text-neutral-400" />
                <span>{{ parcel.destination }}</span>
              </span>
            </div>
            <div class="text-xs font-mono text-neutral-400">
              AWB: {{ parcel.trackingNumber }}
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap justify-end">
            <!-- Individual Sync Button -->
            <button
              @click="deliveryStore.refreshSingleParcel(parcel.id)"
              :disabled="parcel.isLoading"
              class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              :title="parcel.isLoading ? 'Connecting to courier...' : 'Sync package status'"
            >
              <RefreshCw class="w-3.5 h-3.5 text-amber-400" :class="{ 'animate-spin': parcel.isLoading }" />
              <span>{{ parcel.isLoading ? 'Syncing...' : 'Sync' }}</span>
            </button>

            <a
              :href="deliveryStore.getCourierTrackingUrl(parcel.courier, parcel.trackingNumber)"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Open Official Live Tracking Page"
            >
              <ExternalLink class="w-3.5 h-3.5 text-neutral-400" />
              <span>Track on {{ getCourierName(parcel.courier) }}</span>
            </a>

            <span
              v-if="parcel.estimatedDelivery"
              class="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white/5 text-neutral-300 border border-white/10"
            >
              {{ parcel.estimatedDelivery }}
            </span>

            <button
              @click="deliveryStore.removeParcel(parcel.id)"
              class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
              title="Delete Tracking"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- 4-Stage Milestone Visual Progress Bar / Shimmer Loader -->
        <div class="pt-2 pb-2">
          <!-- Loading state shimmer -->
          <div v-if="parcel.isLoading" class="space-y-1.5">
            <div class="h-2 rounded-full bg-white/10 overflow-hidden relative">
              <div class="h-full bg-amber-400/80 w-1/3 rounded-full animate-pulse" />
            </div>
            <div class="text-[10px] text-center text-amber-300/80 font-bold uppercase tracking-wider">
              Syncing live carrier milestone...
            </div>
          </div>

          <!-- Real Progress Bar -->
          <div v-else class="grid grid-cols-4 gap-2 relative">
            <!-- Stage 1: Dispatched -->
            <div class="space-y-1.5 text-center">
              <div
                class="h-2 rounded-full transition-all"
                :class="getStageNumber(parcel.status) >= 1 ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-white/10'"
              />
              <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Dispatched</span>
            </div>

            <!-- Stage 2: In Transit -->
            <div class="space-y-1.5 text-center">
              <div
                class="h-2 rounded-full transition-all"
                :class="getStageNumber(parcel.status) >= 2 ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-white/10'"
              />
              <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">In Transit</span>
            </div>

            <!-- Stage 3: Out for Delivery -->
            <div class="space-y-1.5 text-center">
              <div
                class="h-2 rounded-full transition-all"
                :class="getStageNumber(parcel.status) >= 3 ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-white/10'"
              />
              <span
                class="text-[10px] font-bold uppercase tracking-wider"
                :class="parcel.status === 'out_for_delivery' ? 'text-amber-300 animate-pulse' : 'text-neutral-400'"
              >
                Out for Delivery
              </span>
            </div>

            <!-- Stage 4: Delivered -->
            <div class="space-y-1.5 text-center">
              <div
                class="h-2 rounded-full transition-all"
                :class="getStageNumber(parcel.status) >= 4 ? 'bg-emerald-400 shadow-sm' : 'bg-white/10'"
              />
              <span
                class="text-[10px] font-bold uppercase tracking-wider"
                :class="parcel.status === 'delivered' ? 'text-emerald-400 font-extrabold' : 'text-neutral-400'"
              >
                Delivered
              </span>
            </div>
          </div>
        </div>

        <!-- Checkpoint History Timeline or Loading State -->
        <div class="pt-2 border-t border-white/5 space-y-2">
          <!-- Active Loading State -->
          <div v-if="parcel.isLoading" class="py-6 flex flex-col items-center justify-center gap-2 text-center">
            <RefreshCw class="w-5 h-5 text-amber-400 animate-spin" />
            <div class="text-xs font-semibold text-white">Fetching live checkpoints from {{ getCourierName(parcel.courier) }}...</div>
            <div class="text-[11px] text-neutral-500 font-mono">AWB: {{ parcel.trackingNumber }}</div>
          </div>

          <!-- Real Events Timeline -->
          <template v-else-if="parcel.history.length > 0">
            <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3 text-amber-400" />
                <span>Checkpoint History</span>
              </span>
              <span class="text-[9px] font-mono text-neutral-500">
                {{ parcel.history.length }} Events Recorded
              </span>
            </div>

            <div class="space-y-2.5 pl-2 border-l border-white/10 max-h-56 overflow-y-auto no-scrollbar">
              <div
                v-for="(cp, idx) in parcel.history"
                :key="idx"
                class="relative pl-3 text-xs"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full absolute -left-[4px] top-1.5"
                  :class="idx === 0 ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-neutral-600'"
                />
                <div class="font-semibold flex items-center gap-1.5" :class="idx === 0 ? 'text-white' : 'text-neutral-300'">
                  <span>{{ cp.status }}</span>
                  <span
                    v-if="idx === 0"
                    class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/25"
                  >
                    Latest Checkpoint
                  </span>
                </div>
                <div class="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                  <span class="flex items-center gap-1">
                    <MapPin class="w-3 h-3 text-neutral-500" /> {{ cp.location }}
                  </span>
                  <span>•</span>
                  <span>{{ cp.time }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- No events recorded yet -->
          <div v-else class="py-4 text-center text-xs text-neutral-400">
            {{ parcel.lastCheckpoint || 'No checkpoints recorded by courier yet.' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
