<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useClipboardStore } from '@/stores/clipboard';
import { useDeviceInfoStore } from '@/stores/deviceInfo';
import QRCodeModal from '@/components/common/QRCodeModal.vue';
import { Clipboard, Copy, Check, Send, RefreshCw, Laptop, Smartphone, Monitor, QrCode } from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const clipboard = useClipboardStore();
const deviceInfo = useDeviceInfoStore();

const newClipText = ref('');
const copiedId = ref<string | null>(null);
const showQrModal = ref(false);

const handleCopyText = async (id: string, text: string) => {
  const ok = await clipboard.copyToClipboard(text);
  if (ok) {
    copiedId.value = id;
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  }
};

const handleSendFromArcDock = async () => {
  if (!newClipText.value.trim()) return;
  await clipboard.pushClip(newClipText.value.trim(), 'ArcDock Screen');
  newClipText.value = '';
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
  <div class="h-full flex flex-col p-3 sm:p-5 max-w-4xl mx-auto w-full select-none overflow-hidden relative">
    <!-- Compact Top Toolbar (No duplicate h2 header) -->
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
      <div class="flex items-center gap-2">
        <Clipboard class="w-4 h-4 text-violet-400 shrink-0" />
        <span class="text-sm font-bold text-white font-mono">Shared LAN Clipboard</span>
        <span class="text-xs text-neutral-500 font-mono hidden sm:inline">• LAN :3000/clip</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="clipboard.fetchClipboard"
          class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 text-xs font-semibold tracking-wide transition-colors"
        >
          <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': clipboard.isSyncing }" />
          <span>Sync</span>
        </button>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
      <!-- Cross-Device Web Portal Banner -->
      <div class="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-violet-500/20 text-violet-300">
            <Monitor class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-white">Open on Laptop or Phone</div>
            <div class="text-[11px] text-neutral-300 font-mono mt-0.5">
              Navigate to <strong class="text-violet-300">/clip</strong> in your browser to paste or copy anytime.
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 text-xs font-mono bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-neutral-300">
            <span class="text-neutral-500">URL:</span>
            <span class="text-violet-400 font-semibold">{{ deviceInfo.ip }}:3000/clip</span>
          </div>
          <button
            @click="showQrModal = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            <QrCode class="w-3.5 h-3.5" />
            <span>Scan QR</span>
          </button>
        </div>
      </div>

      <!-- Active Clipboard Item -->
      <div class="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Current Clipboard</span>
          <div v-if="clipboard.current" class="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span class="flex items-center gap-1">
              <Laptop v-if="clipboard.current.device.includes('Mac') || clipboard.current.device.includes('Windows')" class="w-3.5 h-3.5 text-violet-400" />
              <Smartphone v-else-if="clipboard.current.device.includes('Phone') || clipboard.current.device.includes('iOS')" class="w-3.5 h-3.5 text-violet-400" />
              <Clipboard v-else class="w-3.5 h-3.5 text-violet-400" />
              <strong>{{ clipboard.current.device }}</strong>
            </span>
            <span>•</span>
            <span>{{ new Date(clipboard.current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>
        </div>

        <div
          v-if="clipboard.current"
          class="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-neutral-200 select-text whitespace-pre-wrap break-all max-h-48 overflow-y-auto"
        >
          {{ clipboard.current.text }}
        </div>
        <div v-else class="p-6 text-center text-xs text-neutral-500 font-mono">
          No clips active. Paste something from your computer or phone!
        </div>

        <div class="flex items-center justify-end">
          <button
            @click="handleCopyText('active', clipboard.current?.text || '')"
            :disabled="!clipboard.current"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            :class="copiedId === 'active'
              ? 'bg-emerald-500 text-black'
              : 'bg-violet-500 text-black hover:bg-violet-400'"
          >
            <Check v-if="copiedId === 'active'" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span>{{ copiedId === 'active' ? 'Copied to Dock Clipboard!' : 'Copy to Device Clipboard' }}</span>
          </button>
        </div>
      </div>

      <!-- Send from ArcDock -->
      <div class="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-3">
        <label class="block text-xs font-bold uppercase tracking-wider text-neutral-400">Send Text from ArcDock to LAN</label>
        <div class="flex items-center gap-2">
          <input
            v-model="newClipText"
            type="text"
            placeholder="Type text, code, or URL to push to your computer/phone..."
            class="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
            @keyup.enter="handleSendFromArcDock"
          />
          <button
            @click="handleSendFromArcDock"
            :disabled="!newClipText.trim()"
            class="flex items-center gap-1 px-4 py-2 rounded-xl bg-violet-500 text-black font-semibold text-xs disabled:opacity-40 hover:bg-violet-400 transition-colors"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Push</span>
          </button>
        </div>
      </div>

      <!-- History List -->
      <div class="space-y-2">
        <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Recent Clips (Last 5)</span>

        <div
          v-for="item in clipboard.history"
          :key="item.id"
          class="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
        >
          <div class="min-w-0 pr-3 flex-1">
            <p class="text-xs font-mono text-neutral-200 truncate">{{ item.text }}</p>
            <span class="text-[10px] text-neutral-500 font-mono">
              From {{ item.device }} • {{ new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>

          <button
            @click="handleCopyText(item.id, item.text)"
            class="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Copy snippet"
          >
            <Check v-if="copiedId === item.id" class="w-4 h-4 text-emerald-400" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>

        <div v-if="clipboard.history.length === 0" class="text-xs text-neutral-500 py-3 text-center font-mono">
          No history yet.
        </div>
      </div>
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
