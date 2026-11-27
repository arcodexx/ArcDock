import { ref } from 'vue';

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    (window as any).__ARCDOCK_IS_DEMO__ === true ||
    window.location.pathname.includes('demo')
  );
};

export function useDemo() {
  const isDemo = ref(isDemoMode());
  return { isDemo };
}
