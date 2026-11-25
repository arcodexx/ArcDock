import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { type ThemeId, THEME_REGISTRY, THEME_IDS } from '@/types/theme';

const STORAGE_KEY = 'arcdock_theme';

export const useThemeStore = defineStore('theme', () => {
  // Load saved theme or fallback to 'default'
  const savedTheme = (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'default';
  const initialTheme: ThemeId = THEME_IDS.includes(savedTheme) ? savedTheme : 'default';

  const currentTheme = ref<ThemeId>(initialTheme);

  const currentThemeMeta = computed(() => {
    return THEME_REGISTRY[currentTheme.value] || THEME_REGISTRY.default;
  });

  const isLightMode = computed(() => {
    return currentThemeMeta.value.tone === 'light';
  });

  const applyDomAttributes = (themeId: ThemeId) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      root.setAttribute('data-theme', themeId);
      if (body) body.setAttribute('data-theme', themeId);
      
      const meta = THEME_REGISTRY[themeId] || THEME_REGISTRY.default;
      const themeColorMeta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
      const colorSchemeMeta = document.getElementById('color-scheme-meta') as HTMLMetaElement | null;
      
      const appEl = document.getElementById('app');
      if (appEl) appEl.setAttribute('data-theme', themeId);
      
      if (meta.tone === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark');
        root.style.colorScheme = 'only light';
        root.style.backgroundColor = '#FFF5F8';
        if (body) {
          body.classList.add('light-theme');
          body.classList.remove('dark');
          body.style.colorScheme = 'only light';
          body.style.backgroundColor = '#FFF5F8';
        }
        if (appEl) {
          appEl.style.backgroundColor = '#FFF5F8';
          appEl.style.colorScheme = 'only light';
        }
        if (themeColorMeta) themeColorMeta.content = '#FFF5F8';
        if (colorSchemeMeta) colorSchemeMeta.content = 'only light';
      } else {
        root.classList.remove('light-theme');
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        root.style.backgroundColor = meta.swatches[0] || '#000000';
        if (body) {
          body.classList.remove('light-theme');
          body.classList.add('dark');
          body.style.colorScheme = 'dark';
          body.style.backgroundColor = meta.swatches[0] || '#000000';
        }
        if (appEl) {
          appEl.style.backgroundColor = meta.swatches[0] || '#000000';
          appEl.style.colorScheme = 'dark';
        }
        if (themeColorMeta) themeColorMeta.content = meta.swatches[0] || '#000000';
        if (colorSchemeMeta) colorSchemeMeta.content = 'dark';
      }
    }
  };

  const setTheme = (themeId: ThemeId) => {
    if (!THEME_IDS.includes(themeId)) return;
    currentTheme.value = themeId;
    localStorage.setItem(STORAGE_KEY, themeId);
    applyDomAttributes(themeId);
  };

  // Initialize on store creation
  applyDomAttributes(initialTheme);

  return {
    currentTheme,
    currentThemeMeta,
    isLightMode,
    setTheme,
    themes: THEME_REGISTRY,
    themeList: THEME_IDS.map((id) => THEME_REGISTRY[id]),
  };
});
