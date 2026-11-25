<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useClipboardStore } from '@/stores/clipboard';
import { useDeviceInfoStore } from '@/stores/deviceInfo';
import QRCodeModal from '@/components/common/QRCodeModal.vue';
import { Clipboard, Copy, Check, Laptop, QrCode } from 'lucide-vue-next';

const clipboard = useClipboardStore();
const deviceInfo = useDeviceInfoStore();

defineEmits<{
  (e: 'expand'): void;
}>();

const copied = ref(false);
const showQrModal = ref(false);

const handleCopy = async () => {
  if (!clipboard.current?.text) return;
  const ok = await clipboard.copyToClipboard(clipboard.current.text);
  if (ok) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

onMounted(() => {
  clipboard.startPolling();
  deviceInfo.fetchDeviceInfo();
});

onUnmounted(() => {
  clipboard.stopPolling();
});
</script>

<template>
  <div
    @click="$emit('expand')"
    class="h-full flex flex-col justify-between cursor-pointer select-none group"
  >
    <!-- Header / Status Bar -->
    <div class="flex items-center justify-between pb-1 text-[11px] font-mono">
      <div class="flex items-center gap-1.5 text-neutral-400">
        <Clipboard class="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span class="font-bold text-white uppercase tracking-wider">LAN Clipboard</span>
      </div>

      <!-- Quick QR Code Trigger Button -->
      <button
        @click.stop="showQrModal = true"
        class="flex items-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 text-xs font-mono transition-all active:scale-95 cursor-pointer shadow-sm"
        title="Show QR Code & LAN Link"
      >
        <QrCode class="w-3.5 h-3.5 text-violet-400" />
        <span>/clip</span>
      </button>
    </div>

    <!-- Center Display -->
    <div class="flex-1 flex flex-col justify-center my-1 overflow-hidden">
      <div v-if="clipboard.current" class="space-y-1">
        <div class="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
          <span class="flex items-center gap-1 truncate">
            <Laptop class="w-3 h-3 text-violet-400 shrink-0" />
            <strong class="text-neutral-300 truncate">{{ clipboard.current.device }}</strong>
          </span>
          <span class="shrink-0 text-neutral-500">{{ new Date(clipboard.current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>

        <div class="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 font-mono text-xs text-neutral-200 line-clamp-2 break-all select-text">
          {{ clipboard.current.text }}
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-2 text-center">
        <p class="text-xs text-neutral-500">No clips yet.</p>
        <p class="text-[10px] text-neutral-600 font-mono mt-0.5">Open /clip on phone or laptop</p>
      </div>
    </div>

    <!-- Action Footer -->
    <div class="flex items-center justify-between pt-1 border-t border-neutral-800/40">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] font-mono text-neutral-500">
          {{ clipboard.history.length }} {{ clipboard.history.length === 1 ? 'clip' : 'clips' }}
        </span>
        <button
          @click.stop="showQrModal = true"
          class="text-[10px] font-mono text-violet-400/80 hover:text-violet-300 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Scan QR
        </button>
      </div>

      <button
        @click.stop="handleCopy"
        :disabled="!clipboard.current"
        class="flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-40 shadow-sm"
        :class="copied
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30'"
      >
        <Check v-if="copied" class="w-3.5 h-3.5" />
        <Copy v-else class="w-3.5 h-3.5" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </div>

    <!-- QR Code Scan Modal -->
    <QRCodeModal
      :show="showQrModal"
      title="LAN Clipboard"
      subtitle="Scan with your phone or laptop camera to copy & paste instantly"
      :url="deviceInfo.clipUrl"
      :badge="deviceInfo.ip + ':3000/clip'"
      @close="showQrModal = false"
    />
  </div>
</template>
