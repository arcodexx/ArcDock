import { watch } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useHomeAssistantStore } from '@/stores/homeAssistant';

/**
 * useRoomSync
 * Watches Spotify's dynamic extracted RGB album palette and syncs it
 * in real-time to active room lights (e.g. WiZ Bulbs, GoHigh Light Bars)
 * strictly adhering to the "Only If ON" safety rule.
 */
export function useRoomSync() {
  const spotify = useSpotifyStore();
  const ha = useHomeAssistantStore();

  watch(
    () => spotify.dominantColors?.primary,
    (primaryRgb) => {
      if (!primaryRgb) return;
      if (ha.roomSyncConfig.enabled) {
        ha.syncLightsToColor(primaryRgb);
      }
    },
    { immediate: true }
  );

  // Also sync when the user toggles room sync ON in Settings
  watch(
    () => ha.roomSyncConfig.enabled,
    (enabled) => {
      if (enabled && spotify.dominantColors?.primary) {
        ha.syncLightsToColor(spotify.dominantColors.primary);
      }
    }
  );
}
