import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  SpotifyTokens,
  SpotifyPlaybackState,
  SpotifyDevice,
  SpotifyPlaylist,
  SpotifyTrack,
} from '@/types/spotify';
import {
  getSpotifyAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from '@/services/pkce';
import { SpotifyApiService } from '@/services/spotifyApi';
import { extractArtworkColors, type DominantColors } from '@/utils/colorExtractor';

const CLIENT_ID_KEY = 'arcdock_spotify_client_id';
const TOKENS_KEY = 'arcdock_spotify_tokens';

const loadSavedTokens = (): SpotifyTokens | null => {
  const raw = localStorage.getItem(TOKENS_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useSpotifyStore = defineStore('spotify', () => {
  const clientId = ref<string>(localStorage.getItem(CLIENT_ID_KEY) || '');
  const tokens = ref<SpotifyTokens | null>(loadSavedTokens());

  const playback = ref<SpotifyPlaybackState | null>(null);
  const devices = ref<SpotifyDevice[]>([]);
  const playlists = ref<SpotifyPlaylist[]>([]);
  const queue = ref<SpotifyTrack[]>([]);
  const isLoading = ref<boolean>(false);
  const isRefreshing = ref<boolean>(false);
  const error = ref<string | null>(null);
  const dominantColors = ref<DominantColors | null>(null);
  const isCurrentTrackLiked = ref<boolean>(false);

  let pollTimeout: number | null = null;
  let progressTickInterval: number | null = null;
  let lastProgressTickTime: number = Date.now();
  let lastArtworkUrl: string = '';
  let optimisticLockUntil: number = 0;
  let lastCheckedTrackId: string = '';

  const isAuthenticated = computed(() => !!tokens.value?.accessToken);
  const isPlaying = computed(() => !!playback.value?.is_playing);
  const currentTrack = computed(() => playback.value?.item || null);
  const activeDevice = computed(() => playback.value?.device || null);

  const redirectUri = computed(() => {
    const origin = window.location.origin;
    return `${origin}/callback`;
  });

  // Safe token getter with mutex to eliminate concurrent refresh race conditions
  let refreshPromise: Promise<SpotifyTokens | null> | null = null;

  const getValidToken = async (): Promise<string | null> => {
    if (!tokens.value) return null;

    // Refresh if expiring within 5 minutes
    if (Date.now() > tokens.value.expiresAt - 5 * 60 * 1000) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            console.log('[Spotify] Token expiring soon, refreshing silently...');
            const updatedTokens = await refreshAccessToken(tokens.value!.refreshToken, clientId.value);
            saveTokens(updatedTokens);
            return updatedTokens;
          } catch (err: any) {
            console.error('[Spotify] Silent refresh failed:', err);
            error.value = 'Session expired. Please reconnect.';
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const refreshed = await refreshPromise;
      if (!refreshed) return null;
    }

    return tokens.value.accessToken;
  };

  const api = new SpotifyApiService(getValidToken);

  const saveClientId = (id: string) => {
    clientId.value = id.trim();
    localStorage.setItem(CLIENT_ID_KEY, clientId.value);
  };

  const saveTokens = (newTokens: SpotifyTokens | null) => {
    tokens.value = newTokens;
    if (newTokens) {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));
    } else {
      localStorage.removeItem(TOKENS_KEY);
    }
  };

  const login = async () => {
    if (!clientId.value) {
      error.value = 'Please provide a Spotify Client ID first.';
      return;
    }
    error.value = null;
    const authUrl = await getSpotifyAuthUrl(clientId.value, redirectUri.value);
    window.location.href = authUrl;
  };

  const logout = () => {
    stopPolling();
    saveTokens(null);
    playback.value = null;
    devices.value = [];
    playlists.value = [];
    queue.value = [];
    dominantColors.value = null;
    lastArtworkUrl = '';
  };

  /**
   * Handle OAuth redirect callback
   */
  const handleAuthCallback = async (): Promise<boolean> => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const savedState = sessionStorage.getItem('arcdock_spotify_state');

    if (!code) return false;

    if (!state || state !== savedState) {
      error.value = 'Security error: OAuth state mismatch.';
      return false;
    }

    try {
      isLoading.value = true;
      const exchangedTokens = await exchangeCodeForTokens(code, clientId.value, redirectUri.value);
      saveTokens(exchangedTokens);

      // Clean up URL parameters without full page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      await fetchPlayback();
      startPolling();
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to exchange authorization code.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch current playback with optimistic lock protection
   */
  const fetchPlayback = async (): Promise<void> => {
    if (!isAuthenticated.value) return;

    try {
      const state = await api.getPlaybackState();
      
      if (Date.now() < optimisticLockUntil && playback.value && state) {
        // User recently took an action. Protect user's optimistic controls from stale Spotify CDN responses.
        if (state.item?.id !== playback.value.item?.id) {
          // Track changed (e.g. skip landed) — accept full server state
          playback.value = state;
        } else {
          // Same track: preserve optimistic playback, shuffle, repeat, and seek states
          const optPlaying = playback.value.is_playing;
          const optShuffle = playback.value.shuffle_state;
          const optRepeat = playback.value.repeat_state;
          const optProgress = playback.value.progress_ms;

          playback.value = state;
          if (playback.value) {
            playback.value.is_playing = optPlaying;
            playback.value.shuffle_state = optShuffle;
            playback.value.repeat_state = optRepeat;
            if (Math.abs(optProgress - state.progress_ms) < 5000) {
              playback.value.progress_ms = optProgress;
            }
          }
        }
      } else {
        playback.value = state;
      }

      // Sync wall-clock ticker to fresh Spotify timestamp
      lastProgressTickTime = Date.now();

      const artworkUrl = playback.value?.item?.album?.images?.[0]?.url;
      if (artworkUrl && artworkUrl !== lastArtworkUrl) {
        lastArtworkUrl = artworkUrl;
        extractArtworkColors(artworkUrl).then((colors) => {
          dominantColors.value = colors;
        });
      }

      const trackId = playback.value?.item?.id;
      if (trackId && trackId !== lastCheckedTrackId) {
        lastCheckedTrackId = trackId;
        checkCurrentTrackLiked(trackId);
      }
    } catch (err: any) {
      if (err.message?.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(err.message.split(':')[1], 10);
        scheduleNextPoll(seconds * 1000);
        return;
      }
      console.warn('[Spotify] Fetch playback error:', err);
    }
  };

  /**
   * Adaptive polling scheduler (4s playing, 6s paused, 10s idle)
   */
  const scheduleNextPoll = (delayMs?: number) => {
    if (pollTimeout) window.clearTimeout(pollTimeout);

    let nextDelay = delayMs;
    if (!nextDelay) {
      if (playback.value?.is_playing) {
        nextDelay = 4000; // 4 seconds during active playback
      } else if (playback.value) {
        nextDelay = 6000; // 6 seconds when paused
      } else {
        nextDelay = 10000; // 10 seconds when idle
      }
    }

    pollTimeout = window.setTimeout(async () => {
      await fetchPlayback();
      scheduleNextPoll();
    }, nextDelay);
  };

  const manualRefresh = async () => {
    isRefreshing.value = true;
    lastCheckedTrackId = ''; // Reset track ID to force fresh check of liked status
    try {
      await Promise.allSettled([
        fetchPlayback(),
        fetchDevices(),
        fetchQueue(),
      ]);
    } finally {
      setTimeout(() => {
        isRefreshing.value = false;
      }, 600);
    }
  };

  const startPolling = () => {
    stopPolling();
    fetchPlayback();
    scheduleNextPoll();

    // Local drift-free progress bar ticker (anchored to wall-clock time)
    lastProgressTickTime = Date.now();
    progressTickInterval = window.setInterval(() => {
      if (playback.value?.is_playing && playback.value.item) {
        const now = Date.now();
        const elapsed = now - lastProgressTickTime;
        lastProgressTickTime = now;

        const nextProgress = playback.value.progress_ms + elapsed;
        if (nextProgress <= playback.value.item.duration_ms) {
          playback.value.progress_ms = nextProgress;
        } else {
          // Track finished according to duration! Fetch new track immediately
          fetchPlayback();
        }
      }
    }, 1000);
  };

  const stopPolling = () => {
    if (pollTimeout) {
      window.clearTimeout(pollTimeout);
      pollTimeout = null;
    }
    if (progressTickInterval) {
      window.clearInterval(progressTickInterval);
      progressTickInterval = null;
    }
  };

  // Playback Control Actions with 3-second Optimistic Lock
  const togglePlay = async () => {
    if (!playback.value) return;
    const willPlay = !playback.value.is_playing;
    playback.value.is_playing = willPlay; // Instant optimistic update
    optimisticLockUntil = Date.now() + 3000; // Lock for 3s against stale polls

    try {
      if (willPlay) {
        await api.play();
      } else {
        await api.pause();
      }
    } catch (err: any) {
      // Revert on failure
      playback.value.is_playing = !willPlay;
      error.value = err.message;
    }
  };

  const pause = async () => {
    if (!playback.value || !playback.value.is_playing) return;
    playback.value.is_playing = false;
    optimisticLockUntil = Date.now() + 3000;
    try {
      await api.pause();
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const next = async () => {
    optimisticLockUntil = Date.now() + 2500;
    try {
      await api.next();
      setTimeout(fetchPlayback, 800);
      setTimeout(fetchQueue, 1000);
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const previous = async () => {
    optimisticLockUntil = Date.now() + 2500;
    try {
      await api.previous();
      setTimeout(fetchPlayback, 800);
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const seek = async (positionMs: number) => {
    if (!playback.value) return;
    playback.value.progress_ms = positionMs; // Optimistic
    optimisticLockUntil = Date.now() + 2500;
    try {
      await api.seek(positionMs);
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const toggleShuffle = async () => {
    if (!playback.value) return;
    const nextState = !playback.value.shuffle_state;
    playback.value.shuffle_state = nextState;
    optimisticLockUntil = Date.now() + 2500;
    try {
      await api.setShuffle(nextState);
    } catch (err: any) {
      playback.value.shuffle_state = !nextState;
      error.value = err.message;
    }
  };

  const cycleRepeat = async () => {
    if (!playback.value) return;
    const states: ('off' | 'context' | 'track')[] = ['off', 'context', 'track'];
    const currentIndex = states.indexOf(playback.value.repeat_state);
    const nextState = states[(currentIndex + 1) % states.length];
    playback.value.repeat_state = nextState;
    optimisticLockUntil = Date.now() + 2500;
    try {
      await api.setRepeat(nextState);
    } catch (err: any) {
      playback.value.repeat_state = states[currentIndex];
      error.value = err.message;
    }
  };

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices();
      devices.value = (data?.devices || []).filter((d) => d && d.id);
    } catch (err: any) {
      console.warn('[Spotify] Fetch devices error:', err);
      devices.value = [];
      throw err;
    }
  };

  const transferPlayback = async (deviceId: string) => {
    try {
      await api.transferPlayback(deviceId, true);
      setTimeout(fetchPlayback, 400);
      setTimeout(fetchDevices, 600);
    } catch (err: any) {
      error.value = err.message;
    }
  };

  const fetchPlaylists = async () => {
    try {
      const data = await api.getPlaylists(40);
      playlists.value = (data?.items || []).filter((p) => p && p.id);
    } catch (err: any) {
      console.warn('[Spotify] Fetch playlists error:', err);
      playlists.value = [];
      throw err;
    }
  };

  const playPlaylist = async (contextUri: string, offsetUri?: string) => {
    try {
      await api.play({
        context_uri: contextUri,
        offset: offsetUri ? { uri: offsetUri } : undefined,
      });
      setTimeout(fetchPlayback, 300);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  const playTrack = async (uri: string, contextUri?: string) => {
    try {
      if (contextUri) {
        await api.play({
          context_uri: contextUri,
          offset: { uri },
        });
      } else {
        await api.play({
          uris: [uri],
        });
      }
      setTimeout(fetchPlayback, 300);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  const addToQueue = async (uri: string) => {
    try {
      await api.addToQueue(uri);
      setTimeout(fetchQueue, 500);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  const fetchPlaylistTracks = async (playlist: SpotifyPlaylist | string): Promise<SpotifyTrack[]> => {
    try {
      const target = typeof playlist === 'string' ? playlist : playlist.id;
      const data = await api.getPlaylistTracks(target, 50);
      const items = data?.items || [];
      return items
        .map((item: any) => item?.track || item?.item || item)
        .filter((t: any) => t && (t.id || t.uri) && t.name);
    } catch (err: any) {
      console.warn('[Spotify] Fetch playlist tracks error:', err);
      throw err;
    }
  };

  const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
    if (!query.trim()) return [];
    try {
      const data = await api.searchTracks(query, 10);
      return (data?.tracks?.items || []).filter((t) => t && t.id);
    } catch (err: any) {
      console.warn('[Spotify] Search error:', err);
      throw err;
    }
  };

  const checkCurrentTrackLiked = async (trackId: string) => {
    if (!trackId) return;
    try {
      const res = await api.checkUserSavedTracks([trackId]);
      if (Array.isArray(res) && res.length > 0) {
        isCurrentTrackLiked.value = Boolean(res[0]);
      }
    } catch (err) {
      console.warn('[Spotify] Failed to check if track is saved:', err);
    }
  };

  const toggleLikeCurrentTrack = async () => {
    const track = playback.value?.item;
    if (!track) return;

    const willLike = !isCurrentTrackLiked.value;
    isCurrentTrackLiked.value = willLike; // Instant optimistic feedback

    try {
      if (willLike) {
        await api.saveTrackForUser(track.id);
      } else {
        await api.removeTrackForUser(track.id);
      }
      // Re-verify from Spotify after 400ms to guarantee state consistency
      setTimeout(() => {
        checkCurrentTrackLiked(track.id);
      }, 400);
    } catch (err: any) {
      // Revert on failure
      isCurrentTrackLiked.value = !willLike;
      console.warn('[Spotify] Failed to update track saved state:', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const data = await api.getQueue();
      const raw = (data?.queue || []).filter((t) => t && t.id);

      // Clean duplicates & loop artifacts:
      // Filter out trailing duplicates so songs already in queue or currently playing don't repeat endlessly
      const cleaned: SpotifyTrack[] = [];
      const seenIds = new Set<string>();
      const currentTrackId = playback.value?.item?.id;

      for (const track of raw) {
        // Skip if this track matches currently playing song (loop artifact)
        if (track.id === currentTrackId && cleaned.length > 0) {
          continue;
        }
        // Deduplicate songs that already appeared earlier in the queue
        if (seenIds.has(track.id)) {
          continue;
        }
        seenIds.add(track.id);
        cleaned.push(track);
      }

      queue.value = cleaned;
    } catch (err: any) {
      console.warn('[Spotify] Fetch queue error:', err);
    }
  };

  return {
    clientId,
    tokens,
    playback,
    devices,
    playlists,
    queue,
    isLoading,
    isRefreshing,
    error,
    dominantColors,
    isAuthenticated,
    isPlaying,
    isCurrentTrackLiked,
    currentTrack,
    activeDevice,
    redirectUri,
    saveClientId,
    login,
    logout,
    handleAuthCallback,
    fetchPlayback,
    startPolling,
    stopPolling,
    manualRefresh,
    togglePlay,
    pause,
    toggleLikeCurrentTrack,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeat,
    fetchDevices,
    transferPlayback,
    fetchPlaylists,
    fetchPlaylistTracks,
    playPlaylist,
    playTrack,
    addToQueue,
    searchTracks,
    fetchQueue,
  };
});
