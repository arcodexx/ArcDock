// 1. Initialize demo environment & in-memory storage BEFORE importing stores
import './demoInit';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import '@/style.css';
import { useThemeStore } from '@/stores/theme';
import { useSpotifyStore } from '@/stores/spotify';
import { useScreensaverStore } from '@/stores/screensaver';

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = (err, _instance, info) => {
  console.error('[ArcDock Demo Error Boundary]:', err, info);
};

app.use(pinia);
app.mount('#app');

// Bridge messages from parent showcase frame
window.addEventListener('message', (event) => {
  // Security: only accept messages from parent frame or same origin
  if (event.source !== window.parent && event.origin !== window.location.origin) return;

  const data = event.data;
  if (!data || typeof data !== 'object') return;

  try {
    const themeStore = useThemeStore();
    const spotifyStore = useSpotifyStore();
    const screensaverStore = useScreensaverStore();

    switch (data.type) {
      case 'SET_THEME':
        if (data.theme) {
          themeStore.setTheme(data.theme);
        }
        break;

      case 'TRIGGER_SCREENSAVER':
        screensaverStore.testScreensaver();
        break;

      case 'TOGGLE_PLAYBACK':
        spotifyStore.togglePlay();
        break;

      case 'NEXT_TRACK':
        spotifyStore.next();
        break;

      case 'PREV_TRACK':
        spotifyStore.previous();
        break;

      case 'TOGGLE_MODE': {
        const currentMode = localStorage.getItem('arcdock_mode') || 'desk';
        const nextMode = currentMode === 'desk' ? 'car' : 'desk';
        localStorage.setItem('arcdock_mode', nextMode);
        window.location.reload();
        break;
      }
    }
  } catch (err) {
    console.warn('[ArcDock Demo Bridge] Message handler warning:', err);
  }
});

// Notify parent frame that dock is ready
try {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'DOCK_READY' }, '*');
  }
} catch {}
