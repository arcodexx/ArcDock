import { ref, onMounted, onUnmounted } from 'vue';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PIXEL_SHIFT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useAmoledProtection(isPausedGetter: () => boolean) {
  const isSleeping = ref(false);
  const pixelShift = ref({ x: 0, y: 0 });

  let inactivityTimer: number | null = null;
  let pixelShiftTimer: number | null = null;

  const resetInactivityTimer = () => {
    if (isSleeping.value) {
      wakeUp();
      return;
    }

    if (inactivityTimer) {
      window.clearTimeout(inactivityTimer);
    }

    // Only transition to sleep when playback is paused or inactive
    inactivityTimer = window.setTimeout(() => {
      if (isPausedGetter()) {
        isSleeping.value = true;
      } else {
        // If still playing, re-check in 1 minute
        resetInactivityTimer();
      }
    }, INACTIVITY_TIMEOUT_MS);
  };

  const wakeUp = () => {
    isSleeping.value = false;
    resetInactivityTimer();
  };

  const cyclePixelShift = () => {
    // Subtle cycling in -2px to +2px range to prevent static subpixel burn-in on OLED
    const shifts = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
    ];
    const randomIndex = Math.floor(Math.random() * shifts.length);
    pixelShift.value = shifts[randomIndex];
  };

  onMounted(() => {
    const activityEvents = ['pointerdown', 'touchstart', 'mousemove', 'keydown'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    // Start 10-minute micro pixel shift loop
    pixelShiftTimer = window.setInterval(cyclePixelShift, PIXEL_SHIFT_INTERVAL_MS);
  });

  onUnmounted(() => {
    const activityEvents = ['pointerdown', 'touchstart', 'mousemove', 'keydown'];
    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer);
    });

    if (inactivityTimer) window.clearTimeout(inactivityTimer);
    if (pixelShiftTimer) window.clearInterval(pixelShiftTimer);
  });

  return {
    isSleeping,
    wakeUp,
    pixelShift,
  };
}
