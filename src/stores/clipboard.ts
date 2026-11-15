import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ClipItem {
  id: string;
  text: string;
  device: string;
  timestamp: string;
}

export const useClipboardStore = defineStore('clipboard', () => {
  const STORAGE_KEY = 'arcdock_clipboard_cache';

  const loadCache = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse clipboard cache', e);
    }
    return { current: null, history: [] };
  };

  const cached = loadCache();
  const current = ref<ClipItem | null>(cached.current);
  const history = ref<ClipItem[]>(cached.history || []);
  const isSyncing = ref<boolean>(false);
  const lastSync = ref<Date>(new Date());
  const toast = ref<ClipItem | null>(null);
  let toastTimer: number | null = null;

  const dismissToast = () => {
    toast.value = null;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  };

  const showToast = (clip: ClipItem) => {
    toast.value = clip;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.value = null;
      toastTimer = null;
    }, 4500);
  };

  const saveCache = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: current.value, history: history.value }));
    } catch (e) {
      console.warn('Failed to save clipboard cache', e);
    }
  };

  const fetchClipboard = async () => {
    try {
      isSyncing.value = true;
      const res = await fetch('/api/clipboard');
      if (res.ok) {
        const data = await res.json();
        const prevId = current.value?.id;
        current.value = data.current;
        history.value = data.history || [];
        lastSync.value = new Date();
        saveCache();

        // Trigger notification if a new clip arrived from an external device
        if (prevId && data.current && data.current.id !== prevId && data.current.device !== 'ArcDock Screen') {
          showToast(data.current);
        }
      }
    } catch (e) {
      // Local fallback
    } finally {
      isSyncing.value = false;
    }
  };

  const pushClip = async (text: string, device = 'ArcDock Screen') => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      isSyncing.value = true;
      const res = await fetch('/api/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, device }),
      });

      if (res.ok) {
        const data = await res.json();
        current.value = data.current;
        history.value = data.history || [];
        lastSync.value = new Date();
        saveCache();
      }
    } catch (e) {
      // Local client-side fallback
      const localClip: ClipItem = {
        id: `clip-${Date.now()}`,
        text: trimmed,
        device,
        timestamp: new Date().toISOString(),
      };
      current.value = localClip;
      history.value = [localClip, ...history.value.filter((c) => c.text !== trimmed)].slice(0, 5);
      saveCache();
    } finally {
      isSyncing.value = false;
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch (e) {
      console.warn('Clipboard write failed:', e);
      return false;
    }
  };

  let pollInterval: number | null = null;
  const startPolling = () => {
    if (pollInterval) return;
    fetchClipboard();
    pollInterval = window.setInterval(fetchClipboard, 3000);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  return {
    current,
    history,
    isSyncing,
    lastSync,
    toast,
    dismissToast,
    showToast,
    fetchClipboard,
    pushClip,
    copyToClipboard,
    startPolling,
    stopPolling,
  };
});
