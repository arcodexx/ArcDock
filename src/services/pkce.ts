import type { SpotifyTokens } from '@/types/spotify';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
].join(' ');

/**
 * Generate cryptographically secure random string for code verifier and state
 */
export function generateRandomString(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

/**
 * SHA-256 hash using native Web Crypto API
 */
export async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64 URL encode according to RFC 7636
 */
export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Build Spotify Authorization URL with PKCE
 */
export async function getSpotifyAuthUrl(clientId: string, redirectUri: string): Promise<string> {
  const verifier = generateRandomString(64);
  const state = generateRandomString(32);

  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);

  sessionStorage.setItem('arcdock_spotify_verifier', verifier);
  sessionStorage.setItem('arcdock_spotify_state', state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: state,
    scope: SPOTIFY_SCOPES,
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange auth code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  redirectUri: string
): Promise<SpotifyTokens> {
  const verifier = sessionStorage.getItem('arcdock_spotify_verifier');
  if (!verifier) {
    throw new Error('Code verifier not found in session. Please start auth flow again.');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  sessionStorage.removeItem('arcdock_spotify_verifier');
  sessionStorage.removeItem('arcdock_spotify_state');

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh_token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type,
    scope: data.scope || SPOTIFY_SCOPES,
  };
}
