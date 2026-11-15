import { watch, type Ref } from 'vue';
import { useSpotifyStore } from '@/stores/spotify';
import { useHomeAssistantStore } from '@/stores/homeAssistant';

/**
 * useRoomSync
 * Watches Spotify's dynamic extracted RGB album palette and syncs it
 * in real-time to active room lights (e.g. WiZ Bulbs, GoHigh Light Bars)
 * strictly adhering to the "Only If ON" safety rule, and only when in Desk Mode.
 */
export function useRoomSync(mode?: Ref<'desk' | 'car'>) {
  const spotify = useSpotifyStore();
  const ha = useHomeAssistantStore();

  const isDeskMode = () => !mode || mode.value === 'desk';

  watch(
    () => spotify.dominantColors?.primary,
    (primaryRgb) => {
      if (!primaryRgb || !isDeskMode()) return;
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
      if (enabled && isDeskMode() && spotify.dominantColors?.primary) {
        ha.syncLightsToColor(spotify.dominantColors.primary);
      }
    }
  );
}
