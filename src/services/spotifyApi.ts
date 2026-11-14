import type {
  SpotifyPlaybackState,
  SpotifyDevice,
  SpotifyPlaylist,
  SpotifyQueueResponse,
  SpotifyTrack,
} from '@/types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export class SpotifyApiService {
  private getAccessToken: () => Promise<string | null>;

  constructor(getAccessToken: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const url = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    // 429 Rate Limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 5;
      console.warn(`[Spotify API] Rate limited. Backing off for ${waitSeconds}s`);
      throw new Error(`RATE_LIMIT:${waitSeconds}`);
    }

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Spotify API error [${response.status}]: ${text}`);
    }

    // Handle 200 OK with empty body safely without throwing JSON parse error
    if (!text || !text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Get current playback state (active device, current track, progress, shuffle/repeat)
   */
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    return this.request<SpotifyPlaybackState>('/me/player');
  }

  /**
   * Resume or start playback
   */
  async play(options?: { context_uri?: string; uris?: string[]; offset?: { position?: number; uri?: string }; position_ms?: number }): Promise<void> {
    await this.request('/me/player/play', {
      method: 'PUT',
      body: options ? JSON.stringify(options) : undefined,
    });
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    await this.request('/me/player/pause', {
      method: 'PUT',
    });
  }

  /**
   * Skip to next track
   */
  async next(): Promise<void> {
    await this.request('/me/player/next', {
      method: 'POST',
    });
  }

  /**
   * Skip to previous track
   */
  async previous(): Promise<void> {
    await this.request('/me/player/previous', {
      method: 'POST',
    });
  }

  /**
   * Seek to position in track (ms)
   */
  async seek(positionMs: number): Promise<void> {
    await this.request(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, {
      method: 'PUT',
    });
  }

  /**
   * Toggle shuffle state
   */
  async setShuffle(state: boolean): Promise<void> {
    await this.request(`/me/player/shuffle?state=${state}`, {
      method: 'PUT',
    });
  }

  /**
   * Set repeat mode ('off' | 'track' | 'context')
   */
  async setRepeat(state: 'off' | 'track' | 'context'): Promise<void> {
    await this.request(`/me/player/repeat?state=${state}`, {
      method: 'PUT',
    });
  }

  /**
   * Set volume percent
   */
  async setVolume(volumePercent: number): Promise<void> {
    const vol = Math.max(0, Math.min(100, Math.round(volumePercent)));
    await this.request(`/me/player/volume?volume_percent=${vol}`, {
      method: 'PUT',
    });
  }

  /**
   * Get available Spotify Connect devices
   */
  async getDevices(): Promise<{ devices: SpotifyDevice[] }> {
    const res = await this.request<{ devices: SpotifyDevice[] }>('/me/player/devices');
    return res || { devices: [] };
  }

  /**
   * Transfer playback to another device
   */
  async transferPlayback(deviceId: string, play: boolean = true): Promise<void> {
    await this.request('/me/player', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    });
  }

  /**
   * Get user playlists
   */
  async getPlaylists(limit: number = 50): Promise<{ items: SpotifyPlaylist[] }> {
    const res = await this.request<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`);
    return res || { items: [] };
  }

  /**
   * Get tracks in a playlist
   */
  async getPlaylistTracks(
    playlistIdOrHref: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: any[]; total: number }> {
    let cleanId = playlistIdOrHref.replace('spotify:playlist:', '').trim();
    const urlMatch = cleanId.match(/playlists\/([a-zA-Z0-9]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    } else {
      cleanId = cleanId.split('?')[0].split('/').filter((s) => s && s !== 'tracks' && s !== 'items').pop() || cleanId;
    }

    // 1. Try modern /items endpoint (preferred for new Spotify apps)
    try {
      const itemsRes = await this.request<{ items: any[]; total: number }>(
        `/playlists/${cleanId}/items?limit=${limit}&offset=${offset}`
      );
      if (itemsRes && Array.isArray(itemsRes.items) && itemsRes.items.length > 0) {
        return itemsRes;
      }
    } catch (e: any) {
      if (e?.message?.includes('403')) {
        throw e; // Do not waste time retrying protected playlists
      }
      console.warn('[Spotify API] /items endpoint returned error, trying /playlists/{id}:', e?.message);
    }

    // 2. Try fetching full playlist object directly
    try {
      const fullRes = await this.request<{ tracks?: { items: any[]; total: number } }>(
        `/playlists/${cleanId}`
      );
      if (fullRes?.tracks?.items && Array.isArray(fullRes.tracks.items) && fullRes.tracks.items.length > 0) {
        return {
          items: fullRes.tracks.items,
          total: fullRes.tracks.total || fullRes.tracks.items.length,
        };
      }
    } catch (e: any) {
      if (e?.message?.includes('403')) {
        throw e;
      }
      console.warn('[Spotify API] /playlists/{id} returned error, trying /tracks:', e?.message);
    }

    // 3. Fallback to /tracks endpoint
    try {
      const tracksRes = await this.request<{ items: any[]; total: number }>(
        `/playlists/${cleanId}/tracks?limit=${limit}&offset=${offset}`
      );
      if (tracksRes && Array.isArray(tracksRes.items)) {
        return tracksRes;
      }
    } catch (e: any) {
      console.warn('[Spotify API] /tracks endpoint returned error:', e?.message);
      throw e;
    }

    return { items: [], total: 0 };
  }

  /**
   * Check if tracks are in current user's 'Liked Songs' / Library
   * Migrated from deprecated /me/tracks/contains to modern /me/library/contains
   */
  async checkUserSavedTracks(trackIds: string[]): Promise<boolean[]> {
    if (!trackIds.length) return [];
    const uris = trackIds
      .map((id) => (id.startsWith('spotify:track:') ? id : `spotify:track:${id}`))
      .map(encodeURIComponent)
      .join(',');

    const res = await this.request<boolean[]>(`/me/library/contains?uris=${uris}`);
    return res || [];
  }

  /**
   * Save a track to current user's 'Liked Songs' / Library
   * Migrated from deprecated PUT /me/tracks to modern PUT /me/library?uris=
   */
  async saveTrackForUser(trackId: string): Promise<void> {
    const uri = trackId.startsWith('spotify:track:') ? trackId : `spotify:track:${trackId}`;
    await this.request(`/me/library?uris=${encodeURIComponent(uri)}`, {
      method: 'PUT',
    });
  }

  /**
   * Remove a track from current user's 'Liked Songs' / Library
   * Migrated from deprecated DELETE /me/tracks to modern DELETE /me/library?uris=
   */
  async removeTrackForUser(trackId: string): Promise<void> {
    const uri = trackId.startsWith('spotify:track:') ? trackId : `spotify:track:${trackId}`;
    await this.request(`/me/library?uris=${encodeURIComponent(uri)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get user queue
   */
  async getQueue(): Promise<SpotifyQueueResponse | null> {
    return this.request<SpotifyQueueResponse>('/me/player/queue');
  }

  /**
   * Add a track to the playback queue
   */
  async addToQueue(uri: string): Promise<void> {
    await this.request(`/me/player/queue?uri=${encodeURIComponent(uri)}`, {
      method: 'POST',
    });
  }

  /**
   * Search tracks (Spotify limits search to a maximum of 10 items)
   */
  async searchTracks(query: string, limit: number = 10): Promise<{ tracks: { items: SpotifyTrack[]; total: number } }> {
    const cleanQuery = query.trim();
    const clampedLimit = Math.min(10, Math.max(1, limit));
    try {
      const res = await this.request<{ tracks?: { items: SpotifyTrack[]; total: number } }>(
        `/search?q=${encodeURIComponent(cleanQuery)}&type=track&limit=${clampedLimit}`
      );
      if (res && res.tracks && Array.isArray(res.tracks.items)) {
        return { tracks: res.tracks };
      }
      return { tracks: { items: [], total: 0 } };
    } catch (err: any) {
      console.error('[Spotify API] searchTracks error:', err);
      throw err;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{ id: string; display_name: string; images?: { url: string }[] }> {
    const res = await this.request<{ id: string; display_name: string; images?: { url: string }[] }>('/me');
    return res || { id: '', display_name: 'User' };
  }
}
