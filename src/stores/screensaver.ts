import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import quotesData from '@/data/quotes.json';

export type ScreensaverTheme = 'minimalist' | 'flip' | 'word';

export const useScreensaverStore = defineStore('screensaver', () => {
  const THEME_STORAGE_KEY = 'arcdock_screensaver_theme';
  const QUOTE_INDEX_KEY = 'arcdock_screensaver_quote_idx';

  // Theme state
  const theme = ref<ScreensaverTheme>(
    (localStorage.getItem(THEME_STORAGE_KEY) as ScreensaverTheme) || 'minimalist'
  );

  // Quote calculation (daily determinism by default)
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const storedIdx = localStorage.getItem(QUOTE_INDEX_KEY);
  const quoteIndex = ref<number>(
    storedIdx !== null ? parseInt(storedIdx, 10) : getDayOfYear() % quotesData.length
  );

  const currentQuote = computed(() => {
    const idx = Math.abs(quoteIndex.value) % quotesData.length;
    return quotesData[idx] || quotesData[0];
  });

  const nextQuote = () => {
    quoteIndex.value = (quoteIndex.value + 1) % quotesData.length;
    localStorage.setItem(QUOTE_INDEX_KEY, quoteIndex.value.toString());
  };

  const setTheme = (newTheme: ScreensaverTheme) => {
    theme.value = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const cycleTheme = () => {
    const themes: ScreensaverTheme[] = ['minimalist', 'flip', 'word'];
    const currentIdx = themes.indexOf(theme.value);
    const nextIdx = (currentIdx + 1) % themes.length;
    setTheme(themes[nextIdx]);
  };

  const isPreviewing = ref<boolean>(false);

  const testScreensaver = () => {
    isPreviewing.value = true;
  };

  const closePreview = () => {
    isPreviewing.value = false;
  };

  return {
    theme,
    currentQuote,
    isPreviewing,
    testScreensaver,
    closePreview,
    setTheme,
    cycleTheme,
    nextQuote,
  };
});
