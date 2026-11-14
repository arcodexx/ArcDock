import { defineStore } from 'pinia';
import { ref } from 'vue';

export type PingStatus = 'stable' | 'elevated' | 'critical';

export const useNetworkStore = defineStore('network', () => {
  const pingMs = ref<number>(24);
  const status = ref<PingStatus>('stable');
  const history = ref<number[]>([22, 25, 24, 23, 26, 24, 25, 24]);
  const isOnline = ref<boolean>(navigator.onLine);

  let intervalId: number | null = null;

  const checkPing = async () => {
    if (!navigator.onLine) {
      isOnline.value = false;
      status.value = 'critical';
      pingMs.value = 999;
      return;
    }

    isOnline.value = true;
    const start = performance.now();

    try {
      // Lightweight fetch with cache busting to 1.1.1.1
      await fetch(`https://1.1.1.1/cdn-cgi/trace?_t=${Date.now()}`, {
        mode: 'no-cors',
        cache: 'no-store',
      });
      const duration = Math.round(performance.now() - start);
      pingMs.value = duration;

      if (duration < 60) {
        status.value = 'stable';
      } else if (duration <= 130) {
        status.value = 'elevated';
      } else {
        status.value = 'critical';
      }
    } catch {
      // Offline or network error
      pingMs.value = 999;
      status.value = 'critical';
    }

    history.value.push(pingMs.value);
    if (history.value.length > 20) {
      history.value.shift();
    }
  };

  const startMonitoring = () => {
    checkPing();
    if (!intervalId) {
      intervalId = window.setInterval(checkPing, 10_000);
    }
  };

  const stopMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    pingMs,
    status,
    history,
    isOnline,
    checkPing,
    startMonitoring,
    stopMonitoring,
  };
});
