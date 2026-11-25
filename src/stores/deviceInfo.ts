import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useDeviceInfoStore = defineStore('deviceInfo', () => {
  const cachedIp = typeof localStorage !== 'undefined' ? localStorage.getItem('arcdock_lan_ip') : null;
  const initialIp = cachedIp || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : '127.0.0.1');

  const ip = ref<string>(initialIp);
  const port = ref<number>(3000);
  const haPort = ref<number>(8123);
  const isLoaded = ref<boolean>(false);
  const isFetching = ref<boolean>(false);

  const haUrl = computed(() => `http://${ip.value}:${haPort.value}`);
  const clipUrl = computed(() => `http://${ip.value}:${port.value}/clip`);

  const fetchDeviceInfo = async () => {
    if (isFetching.value) return;
    isFetching.value = true;

    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          ip.value = data.ip;
          if (data.ip !== '127.0.0.1' && data.ip !== 'localhost') {
            localStorage.setItem('arcdock_lan_ip', data.ip);
          }
        }
        if (data.port) port.value = data.port;
        if (data.ha_port) haPort.value = data.ha_port;
        isLoaded.value = true;
      }
    } catch {
      // Fallback: check if the browser is viewing through a LAN IP directly
      if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        ip.value = window.location.hostname;
        localStorage.setItem('arcdock_lan_ip', window.location.hostname);
      }
    } finally {
      isFetching.value = false;
    }
  };

  return {
    ip,
    port,
    haPort,
    isLoaded,
    isFetching,
    haUrl,
    clipUrl,
    fetchDeviceInfo,
  };
});
