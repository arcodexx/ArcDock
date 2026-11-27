import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';

// Purge any residual demo keys left in real localStorage from earlier demo testing
try {
  if (localStorage.getItem('arcdock_spotify_client_id') === 'demo_client_id') {
    localStorage.removeItem('arcdock_spotify_client_id');
    localStorage.removeItem('arcdock_spotify_tokens');
  }
  if (localStorage.getItem('arcdock_ha_mock') === 'true') {
    localStorage.removeItem('arcdock_ha_mock');
  }
  if (localStorage.getItem('arcdock_github_token') === 'demo_gh_token') {
    localStorage.removeItem('arcdock_github_token');
    localStorage.removeItem('arcdock_github_user');
  }
  if (localStorage.getItem('arcdock_calendar_feed_url') === 'https://demo.local/calendar.ics') {
    localStorage.removeItem('arcdock_calendar_feed_url');
    localStorage.removeItem('arcdock_calendar_sample');
  }
  const rawDeliveries = localStorage.getItem('arcdock_deliveries');
  if (rawDeliveries && rawDeliveries.includes('DL984729183IN')) {
    localStorage.removeItem('arcdock_deliveries');
  }
  const rawHabits = localStorage.getItem('arcdock_habits');
  if (rawHabits && rawHabits.includes('Drink 2L Water') && rawHabits.includes('habit-1')) {
    localStorage.removeItem('arcdock_habits');
  }
} catch {}

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = (err, _instance, info) => {
  console.error('[ArcDock Global Error Boundary]:', err, info);
};

app.use(pinia);
app.mount('#app');
