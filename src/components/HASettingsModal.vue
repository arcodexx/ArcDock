<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useHomeAssistantStore } from '@/stores/homeAssistant';
import { useDeviceInfoStore } from '@/stores/deviceInfo';
import QRCodeModal from '@/components/common/QRCodeModal.vue';
import {
  X,
  Home,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Pin,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Wifi
} from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const ha = useHomeAssistantStore();
const deviceInfo = useDeviceInfoStore();

const localHaUrl = ref(ha.haUrl);
const localHaToken = ref(ha.haToken);
const showToken = ref(false);
const isSaved = ref(false);
const copiedUrl = ref(false);
const showQrModal = ref(false);

const haLanUrl = computed(() => deviceInfo.haUrl);

const handleSaveHaConfig = () => {
  ha.setConfig(localHaUrl.value, localHaToken.value);
  isSaved.value = true;
  setTimeout(() => {
    isSaved.value = false;
  }, 2000);
};

const copyLanUrl = async () => {
  try {
    await navigator.clipboard.writeText(haLanUrl.value);
    copiedUrl.value = true;
    setTimeout(() => {
      copiedUrl.value = false;
    }, 2000);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = haLanUrl.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copiedUrl.value = true;
    setTimeout(() => {
      copiedUrl.value = false;
    }, 2000);
  }
};

const toggleRoomSync = () => {
  ha.setRoomSyncConfig({ enabled: !ha.roomSyncConfig.enabled });
};

const toggleTargetEntity = (id: string) => {
  const current = [...ha.roomSyncConfig.targetEntityIds];
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(id);
  }
  ha.setRoomSyncConfig({ targetEntityIds: current });
};

const togglePinnedEntity = (id: string) => {
  const current = [...ha.pinnedEntityIds];
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(id);
  }
  ha.setPinnedEntities(current);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
};

onMounted(() => {
  deviceInfo.fetchDeviceInfo();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-2xl max-h-[92vh] rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/20">
                <Home class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm sm:text-base font-bold text-white tracking-wide">Smart Desk & Home Assistant</h2>
                  <span
                    v-if="ha.connectionStatus === 'connected'"
                    class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                  >
                    Live Connected
                  </span>
                  <span
                    v-else-if="ha.connectionStatus === 'connecting'"
                    class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30"
                  >
                    Connecting...
                  </span>
                  <span
                    v-else
                    class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                  >
                    Disconnected
                  </span>
                </div>
                <p class="text-[11px] text-neutral-400">
                  Manage connection parameters, room light sync & LAN access URLs
                </p>
              </div>
            </div>

            <button
              @click="emit('close')"
              class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close settings"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            <!-- 1. LAN Access & QR Code Section -->
            <section class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-2.5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="space-y-0.5">
                  <div class="text-xs font-bold text-white flex items-center gap-2">
                    <Wifi class="w-4 h-4 text-amber-400" />
                    <span>LAN Direct Access</span>
                  </div>
                  <p class="text-[11px] text-neutral-300">
                    Open Home Assistant Web UI on your laptop or phone on the same Wi-Fi.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="showQrModal = true"
                    class="flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <QrCode class="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </button>
                </div>
              </div>

              <!-- URL Bar -->
              <div class="flex items-center gap-2 p-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div class="flex-1 min-w-0 px-2 font-mono text-xs text-amber-300 font-semibold truncate select-all">
                  {{ haLanUrl }}
                </div>
                <button
                  @click="copyLanUrl"
                  class="shrink-0 flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                  :class="copiedUrl
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'"
                >
                  <Check v-if="copiedUrl" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedUrl ? 'Copied' : 'Copy' }}</span>
                </button>
                <a
                  :href="haLanUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
            </section>

            <!-- 2. HA Server Connection Credentials -->
            <section class="space-y-3 p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5">
              <div class="text-xs font-bold text-white uppercase tracking-wider text-neutral-400">
                Core Connection
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <Server class="w-3.5 h-3.5 text-amber-400" />
                  <span>Home Assistant URL (Local Core)</span>
                </label>
                <input
                  v-model="localHaUrl"
                  type="text"
                  placeholder="http://127.0.0.1:8123"
                  class="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs text-neutral-400 font-medium flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <Lock class="w-3.5 h-3.5 text-amber-400" />
                    <span>Long-Lived Access Token</span>
                  </span>
                  <button
                    @click="showToken = !showToken"
                    class="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <component :is="showToken ? EyeOff : Eye" class="w-3.5 h-3.5" />
                    <span>{{ showToken ? 'Hide' : 'Reveal' }}</span>
                  </button>
                </label>
                <input
                  v-model="localHaToken"
                  :type="showToken ? 'text' : 'password'"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  class="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span class="text-[11px] text-neutral-500">
                  Generate token in Home Assistant: Profile → Long-Lived Access Tokens.
                </span>
                <button
                  @click="handleSaveHaConfig"
                  class="min-h-[42px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs tracking-wide active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Check v-if="isSaved" class="w-4 h-4" />
                  <RefreshCw v-else-if="ha.connectionStatus === 'connecting'" class="w-4 h-4 animate-spin" />
                  <span>{{ isSaved ? 'Saved & Reconnecting...' : 'Save & Connect' }}</span>
                </button>
              </div>
            </section>

            <!-- 4. Room Immersion: Dynamic Album Art Light Sync -->
            <section class="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-3">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5 pr-4">
                  <div class="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5 text-amber-400" />
                    <span>Sync Room Lights to Album Art</span>
                  </div>
                  <div class="text-[11px] text-neutral-400">
                    Colors change with song artwork. <span class="text-amber-300/90 font-medium">Only affects lights that are already ON.</span>
                  </div>
                </div>
                <button
                  @click="toggleRoomSync"
                  class="w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0"
                  :class="ha.roomSyncConfig.enabled ? 'bg-amber-400' : 'bg-white/10'"
                >
                  <div
                    class="w-4 h-4 rounded-full bg-black absolute top-1 transition-transform"
                    :class="ha.roomSyncConfig.enabled ? 'left-6' : 'left-1'"
                  />
                </button>
              </div>

              <!-- Target Lights Multi-Select when enabled -->
              <div v-if="ha.roomSyncConfig.enabled" class="pt-3 border-t border-white/5 space-y-2">
                <span class="text-[10px] uppercase font-bold text-neutral-400">Target Lights</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    v-for="light in ha.lights"
                    :key="light.entity_id"
                    @click="toggleTargetEntity(light.entity_id)"
                    class="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                    :class="[
                      ha.roomSyncConfig.targetEntityIds.includes(light.entity_id)
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                    ]"
                  >
                    <span class="truncate">{{ light.attributes.friendly_name || light.entity_id }}</span>
                    <Check
                      v-if="ha.roomSyncConfig.targetEntityIds.includes(light.entity_id)"
                      class="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1"
                    />
                  </button>
                </div>
              </div>
            </section>

            <!-- 5. Pinned Primary Desk Entities -->
            <section class="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-3">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-white flex items-center gap-1.5">
                  <Pin class="w-3.5 h-3.5 text-amber-400" />
                  <span>Pinned Desk Entities</span>
                </div>
                <div class="text-[11px] text-neutral-400">
                  Select specific devices to feature on your primary grid (leave empty to show all).
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                <button
                  v-for="e in [...ha.climates, ...ha.lights, ...ha.switches]"
                  :key="e.entity_id"
                  @click="togglePinnedEntity(e.entity_id)"
                  class="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                  :class="[
                    ha.pinnedEntityIds.includes(e.entity_id)
                      ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 font-bold'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                  ]"
                >
                  <span class="truncate">{{ e.attributes.friendly_name || e.entity_id }}</span>
                  <Check
                    v-if="ha.pinnedEntityIds.includes(e.entity_id)"
                    class="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1"
                  />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>

    <!-- QR Code Scan Modal for Home Assistant -->
    <QRCodeModal
      :show="showQrModal"
      title="Home Assistant LAN Portal"
      subtitle="Scan with your phone or laptop camera to access Home Assistant"
      :url="haLanUrl"
      :badge="deviceInfo.ip + ':8123'"
      @close="showQrModal = false"
    />
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
