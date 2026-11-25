<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, QrCode, Wifi } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const qrDataUrl = ref<string>('');
const isCopied = ref<boolean>(false);
const error = ref<string | null>(null);

const generateQr = async () => {
  if (!props.url) return;
  try {
    error.value = null;
    qrDataUrl.value = await QRCode.toDataURL(props.url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err: any) {
    error.value = err?.message || 'Failed to render QR Code';
  }
};

watch(() => [props.url, props.show], () => {
  if (props.show) {
    generateQr();
  }
}, { immediate: true });

const copyUrl = async () => {
  if (!props.url) return;
  try {
    await navigator.clipboard.writeText(props.url);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = props.url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
};

onMounted(() => {
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
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-lg max-h-[94vh] rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl p-4 sm:p-5 flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Top Bar: Header & Close Button -->
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-amber-400/15 text-amber-400 border border-amber-400/20">
                <QrCode class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-white tracking-wide leading-tight">{{ title }}</h3>
                <p class="text-[11px] text-neutral-400">
                  {{ subtitle || 'Scan with your camera on the same Wi-Fi' }}
                </p>
              </div>
            </div>

            <button
              @click="emit('close')"
              class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Horizontal Landscape Body (Side-by-side QR and Details) -->
          <div class="flex flex-row items-center gap-4 py-1 flex-1 min-h-0">
            <!-- Left: QR Code Display Frame (Crisp 144px frame) -->
            <div class="p-2 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                :alt="title"
                class="w-36 h-36 object-contain block"
              />
              <div
                v-else
                class="w-36 h-36 flex items-center justify-center text-[10px] font-mono text-neutral-500"
              >
                Generating...
              </div>
            </div>

            <!-- Right: Badge, URL & Action Buttons -->
            <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5 space-y-2">
              <div class="space-y-1">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-neutral-300">
                  <Wifi class="w-3 h-3 text-amber-400" />
                  <span>{{ badge || 'LAN Access' }}</span>
                </div>
                <p class="text-[11px] text-neutral-300 leading-snug">
                  Point your phone or laptop camera at this QR code to connect instantly.
                </p>
              </div>

              <!-- URL Bar & Actions -->
              <div class="flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900 border border-white/10">
                <div class="flex-1 min-w-0 px-2 font-mono text-xs text-amber-300 font-semibold truncate select-all">
                  {{ url }}
                </div>
                <button
                  @click="copyUrl"
                  class="shrink-0 flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                  :class="isCopied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'"
                >
                  <Check v-if="isCopied" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ isCopied ? 'Copied' : 'Copy' }}</span>
                </button>
                <a
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>

              <!-- Helper note -->
              <p class="text-[10px] text-neutral-500 font-mono">
                Requires both devices on the same Wi-Fi
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
