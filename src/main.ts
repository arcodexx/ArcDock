import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.config.errorHandler = (err, _instance, info) => {
  console.error('[ArcDock Global Error Boundary]:', err, info);
};

app.use(pinia);
app.mount('#app');
