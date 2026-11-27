/**
 * ArcDock Isolated Demo Mock Engine
 * 
 * Provides realistic, generic, and universally relatable mock data
 * for all subsystems (Spotify, Home Assistant, GitHub, Parcels, Calendar,
 * Timezones, Habits, Pomodoro, Weather) in Demo Mode.
 * 
 * Completely isolated from the main production app.
 */

export const DEMO_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="30" fill="%238B5CF6"/><circle cx="60" cy="46" r="22" fill="%23FFFFFF"/><path d="M26 100 C26 76 40 68 60 68 C80 68 94 76 94 100 Z" fill="%23FFFFFF"/></svg>`;

// Beautiful, high-contrast SVG album artwork data URL (generates rich ColorThief palettes)
export const DEMO_ALBUM_ART = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%237928CA" />
      <stop offset="45%" stop-color="%234338CA" />
      <stop offset="75%" stop-color="%2306B6D4" />
      <stop offset="100%" stop-color="%2310B981" />
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="%23F472B6" />
      <stop offset="60%" stop-color="%23EC4899" />
      <stop offset="100%" stop-color="%238B5CF6" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="500" height="500" fill="url(%23bg)" />
  <circle cx="250" cy="220" r="120" fill="url(%23sun)" />
  <path d="M0 380 Q 120 340 250 380 T 500 370 L 500 500 L 0 500 Z" fill="%230F172A" opacity="0.9" />
  <path d="M0 420 Q 160 380 320 420 T 500 400 L 500 500 L 0 500 Z" fill="%23030712" />
  <g stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
    <line x1="0" y1="440" x2="500" y2="440" />
    <line x1="0" y1="465" x2="500" y2="465" />
    <line x1="0" y1="485" x2="500" y2="485" />
    <line x1="250" y1="400" x2="50" y2="500" />
    <line x1="250" y1="400" x2="150" y2="500" />
    <line x1="250" y1="400" x2="250" y2="500" />
    <line x1="250" y1="400" x2="350" y2="500" />
    <line x1="250" y1="400" x2="450" y2="500" />
  </g>
  <text x="40" y="70" font-family="system-ui, sans-serif" font-weight="800" font-size="28" fill="%23FFFFFF" letter-spacing="2">SUNSET DRIVE</text>
  <text x="40" y="100" font-family="system-ui, sans-serif" font-weight="500" font-size="16" fill="rgba(255,255,255,0.7)" letter-spacing="4">NEON DREAMERS</text>
</svg>`;

export const DEMO_QUEUE_TRACKS = [
  {
    id: 'demo-track-1',
    name: 'Midnight City Lights',
    artists: [{ id: 'art-1', name: 'Neon Dreamers' }],
    album: {
      id: 'alb-1',
      name: 'Sunset Horizons',
      images: [{ url: DEMO_ALBUM_ART, width: 500, height: 500 }],
    },
    duration_ms: 214000,
  },
  {
    id: 'demo-track-2',
    name: 'Starlight Drift',
    artists: [{ id: 'art-2', name: 'Aura Soundscapes' }],
    album: {
      id: 'alb-2',
      name: 'Cosmic Journeys',
      images: [{ url: DEMO_ALBUM_ART, width: 500, height: 500 }],
    },
    duration_ms: 185000,
  },
  {
    id: 'demo-track-3',
    name: 'Coffee & Code',
    artists: [{ id: 'art-3', name: 'Chillout Lounge' }],
    album: {
      id: 'alb-3',
      name: 'Focus Sessions',
      images: [{ url: DEMO_ALBUM_ART, width: 500, height: 500 }],
    },
    duration_ms: 198000,
  },
  {
    id: 'demo-track-4',
    name: 'Endless Highway',
    artists: [{ id: 'art-4', name: 'Synthwave Collective' }],
    album: {
      id: 'alb-4',
      name: 'Night Run',
      images: [{ url: DEMO_ALBUM_ART, width: 500, height: 500 }],
    },
    duration_ms: 242000,
  },
];

let currentTrackIndex = 0;
let isPlayingState = true;
let progressMs = 68000;
let lastProgressTime = Date.now();

export function getDemoPlaybackState() {
  if (isPlayingState) {
    const elapsed = Date.now() - lastProgressTime;
    lastProgressTime = Date.now();
    progressMs += elapsed;
    if (progressMs > DEMO_QUEUE_TRACKS[currentTrackIndex].duration_ms) {
      progressMs = 0;
      currentTrackIndex = (currentTrackIndex + 1) % DEMO_QUEUE_TRACKS.length;
    }
  } else {
    lastProgressTime = Date.now();
  }

  const currentTrack = DEMO_QUEUE_TRACKS[currentTrackIndex];

  return {
    is_playing: isPlayingState,
    progress_ms: progressMs,
    shuffle_state: false,
    repeat_state: 'off',
    item: {
      ...currentTrack,
      uri: `spotify:track:${currentTrack.id}`,
    },
    device: {
      id: 'dev-1',
      name: 'Workstation Audio',
      type: 'Speaker',
      volume_percent: 75,
      is_active: true,
    },
  };
}

export const DEMO_DEVICES = [
  { id: 'dev-1', name: 'Workstation Audio', type: 'Speaker', volume_percent: 75, is_active: true },
  { id: 'dev-2', name: 'Living Room Soundbar', type: 'Speaker', volume_percent: 60, is_active: false },
  { id: 'dev-3', name: 'Car Audio System', type: 'AudioDongle', volume_percent: 80, is_active: false },
  { id: 'dev-4', name: 'Wireless Headphones', type: 'CastAudio', volume_percent: 50, is_active: false },
];

export const DEMO_PLAYLISTS = [
  {
    id: 'pl-1',
    name: 'Deep Focus & Flow',
    description: 'Minimalist electronica and ambient beats for productive desk sessions',
    images: [{ url: DEMO_ALBUM_ART }],
    tracks: { total: 48 },
  },
  {
    id: 'pl-2',
    name: 'Chill Electronic Beats',
    description: 'Warm synths and smooth downtempo rhythms',
    images: [{ url: DEMO_ALBUM_ART }],
    tracks: { total: 64 },
  },
  {
    id: 'pl-3',
    name: 'Late Night Drive',
    description: 'Retro synthwave and cinematic melodies',
    images: [{ url: DEMO_ALBUM_ART }],
    tracks: { total: 36 },
  },
  {
    id: 'pl-4',
    name: 'Morning Acoustic',
    description: 'Gentle organic sounds to start the workday',
    images: [{ url: DEMO_ALBUM_ART }],
    tracks: { total: 28 },
  },
];

export function generateDemoIcs(): string {
  const now = new Date();
  
  // Format iCal date string: YYYYMMDDTHHmmssZ
  const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Event 1: Today, starting in 12 minutes (so Meeting Radar pulses amber!)
  const e1Start = new Date(now.getTime() + 12 * 60 * 1000);
  const e1End = new Date(e1Start.getTime() + 30 * 60 * 1000);

  // Event 2: Today, in 2.5 hours
  const e2Start = new Date(now.getTime() + 150 * 60 * 1000);
  const e2End = new Date(e2Start.getTime() + 45 * 60 * 1000);

  // Event 3: Tomorrow at 11:00 AM
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  tomorrow.setHours(11, 0, 0, 0);
  const e3End = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ArcDock Demo//Desk Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:demo-ev-1@arcdock.local
DTSTAMP:${toIcsDate(now)}
DTSTART:${toIcsDate(e1Start)}
DTEND:${toIcsDate(e1End)}
SUMMARY:Project Team Sync
DESCRIPTION:Weekly sprint milestones review and deliverable sync.\\nJoin: https://meet.google.com/demo-meet
LOCATION:Google Meet
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:demo-ev-2@arcdock.local
DTSTAMP:${toIcsDate(now)}
DTSTART:${toIcsDate(e2Start)}
DTEND:${toIcsDate(e2End)}
SUMMARY:Client Architecture Review
DESCRIPTION:System design presentation and technical walkthrough.\\nZoom: https://zoom.us/j/demo-meeting
LOCATION:Zoom Meeting
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:demo-ev-3@arcdock.local
DTSTAMP:${toIcsDate(now)}
DTSTART:${toIcsDate(tomorrow)}
DTEND:${toIcsDate(e3End)}
SUMMARY:Product Planning & UX Review
DESCRIPTION:Reviewing upcoming features and interface design polish.
LOCATION:Design Studio
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

export function seedDemoLocalStorage() {
  // Spotify Mock Auth
  localStorage.setItem('arcdock_spotify_client_id', 'demo_client_id');
  localStorage.setItem(
    'arcdock_spotify_tokens',
    JSON.stringify({
      accessToken: 'demo_access_token_valid',
      refreshToken: 'demo_refresh_token_valid',
      expiresAt: Date.now() + 365 * 24 * 3600 * 1000, // Valid for 1 year
    })
  );

  // Home Assistant: mockMode
  localStorage.setItem('arcdock_ha_mock', 'true');

  // Calendar
  localStorage.setItem('arcdock_calendar_feed_url', 'https://demo.local/calendar.ics');
  localStorage.setItem('arcdock_calendar_sample', 'true');

  // GitHub
  localStorage.setItem('arcdock_github_token', 'demo_gh_token');
  localStorage.setItem('arcdock_github_user', 'developer');

  // Deliveries (2 generic shipments with reverse-chronological checkpoints)
  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
  
  localStorage.setItem(
    'arcdock_deliveries',
    JSON.stringify([
      {
        id: `pkg-${Date.now()}`,
        title: 'Mechanical Keyboard',
        trackingNumber: 'DL984729183IN',
        courier: 'delhivery',
        status: 'out_for_delivery',
        estimatedDelivery: 'Today by 6:00 PM',
        destination: 'Home Desk',
        lastCheckpoint: 'Out for delivery with delivery agent',
        createdAt: Date.now() - 3600 * 1000,
        history: [
          { time: `Today, ${d1}`, location: 'Local Distribution Hub', status: 'Out for delivery with delivery agent' },
          { time: `Yesterday, 21:40`, location: 'City Central Sorting Facility', status: 'Arrived at destination delivery center' },
          { time: `${yesterday}, 14:15`, location: 'National Freight Hub', status: 'In transit - bag dispatched to local hub' },
          { time: `${yesterday}, 09:30`, location: 'Origin Warehouse', status: 'Manifest created & order picked up' },
        ],
      },
      {
        id: `pkg-${Date.now() - 5000}`,
        title: 'Desk Audio Interface',
        trackingNumber: 'BD551928374',
        courier: 'bluedart',
        status: 'in_transit',
        estimatedDelivery: 'Tomorrow',
        destination: 'Workstation',
        lastCheckpoint: 'In transit - forwarded to destination hub',
        createdAt: Date.now() - 7200 * 1000,
        history: [
          { time: `Yesterday, 18:20`, location: 'Regional Transit Center', status: 'In transit - forwarded to destination hub' },
          { time: `${yesterday}, 11:00`, location: 'Origin Center', status: 'Pickup completed from seller facility' },
        ],
      },
    ])
  );

  // Timezones
  localStorage.setItem(
    'arcdock_timezones',
    JSON.stringify([
      { id: 'tz-1', label: 'HQ', city: 'New York', timezone: 'America/New_York' },
      { id: 'tz-2', label: 'Design Lead', city: 'London', timezone: 'Europe/London' },
      { id: 'tz-3', label: 'Remote Team', city: 'Tokyo', timezone: 'Asia/Tokyo' },
      { id: 'tz-4', label: 'Engineering', city: 'San Francisco', timezone: 'America/Los_Angeles' },
    ])
  );
  localStorage.setItem('arcdock_timezones_format', '12h');

  // Habits: complete 2 out of 4 today
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  localStorage.setItem(
    'arcdock_habits',
    JSON.stringify([
      {
        id: 'habit-1',
        title: 'Drink 2L Water',
        icon: '💧',
        category: 'health',
        completedDates: [yesterdayStr, todayStr],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'habit-2',
        title: '30m Focus Session',
        icon: '🎯',
        category: 'work',
        completedDates: [yesterdayStr, todayStr],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'habit-3',
        title: 'Posture & Stretch Break',
        icon: '🧘',
        category: 'health',
        completedDates: [yesterdayStr],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'habit-4',
        title: 'Review Daily Goals',
        icon: '📝',
        category: 'mind',
        completedDates: [],
        createdAt: new Date().toISOString(),
      },
    ])
  );

  // Default theme
  if (!localStorage.getItem('arcdock_theme')) {
    localStorage.setItem('arcdock_theme', 'default');
  }

  // Pre-cached Weather (Instant startup, prevents network hanging)
  localStorage.setItem(
    'arcdock_weather_config',
    JSON.stringify({ city: 'Tokyo', lat: 35.6762, lon: 139.6503, useGeo: false })
  );
  localStorage.setItem(
    'arcdock_weather_cache',
    JSON.stringify({
      temperature: 24,
      relativeHumidity: 48,
      apparentTemperature: 24.5,
      weatherCode: 0,
      hourly: [
        { time: '12:00', temp: 24, code: 0 },
        { time: '13:00', temp: 25, code: 0 },
        { time: '14:00', temp: 26, code: 0 },
        { time: '15:00', temp: 25, code: 0 },
        { time: '16:00', temp: 24, code: 0 },
        { time: '17:00', temp: 23, code: 0 },
      ],
      daily: [
        { date: 'Today', minTemp: 18, maxTemp: 28, code: 0 },
        { date: 'Tomorrow', minTemp: 19, maxTemp: 29, code: 0 },
      ],
      lastUpdated: Date.now(),
    })
  );

  // Favorite widgets on right pane
  if (!localStorage.getItem('arcdock_favorite_widgets')) {
    localStorage.setItem('arcdock_favorite_widgets', JSON.stringify(['calendar', 'pomodoro']));
  }
}

/**
 * Registers the Demo Fetch Interceptor
 * Intercepts external calls in the demo window and returns rich mock data
 */
export function installDemoMockEngine() {
  seedDemoLocalStorage();

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // 1. Spotify Web API Endpoints
    if (url.includes('api.spotify.com/v1')) {
      // Playback State
      if (url.includes('/me/player') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify(getDemoPlaybackState()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Play action
      if (url.includes('/me/player/play')) {
        isPlayingState = true;
        lastProgressTime = Date.now();
        return new Response(null, { status: 204 });
      }

      // Pause action
      if (url.includes('/me/player/pause')) {
        isPlayingState = false;
        return new Response(null, { status: 204 });
      }

      // Next / Previous action
      if (url.includes('/me/player/next')) {
        currentTrackIndex = (currentTrackIndex + 1) % DEMO_QUEUE_TRACKS.length;
        progressMs = 0;
        lastProgressTime = Date.now();
        return new Response(null, { status: 204 });
      }
      if (url.includes('/me/player/previous')) {
        currentTrackIndex = (currentTrackIndex - 1 + DEMO_QUEUE_TRACKS.length) % DEMO_QUEUE_TRACKS.length;
        progressMs = 0;
        lastProgressTime = Date.now();
        return new Response(null, { status: 204 });
      }

      // Devices
      if (url.includes('/me/player/devices')) {
        return new Response(JSON.stringify({ devices: DEMO_DEVICES }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Queue
      if (url.includes('/me/player/queue')) {
        return new Response(
          JSON.stringify({
            currently_playing: DEMO_QUEUE_TRACKS[currentTrackIndex],
            queue: DEMO_QUEUE_TRACKS.filter((_, idx) => idx !== currentTrackIndex),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Playlists
      if (url.includes('/me/playlists')) {
        return new Response(JSON.stringify({ items: DEMO_PLAYLISTS }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Library contains
      if (url.includes('/me/library/contains')) {
        return new Response(JSON.stringify([true]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Library save / remove
      if (url.includes('/me/library')) {
        return new Response(null, { status: 200 });
      }

      // Search
      if (url.includes('/search')) {
        return new Response(
          JSON.stringify({
            tracks: {
              items: DEMO_QUEUE_TRACKS,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Calendar iCal Feed Proxy
    if (url.includes('/api/calendar/feed') || url.includes('demo.local/calendar.ics')) {
      return new Response(generateDemoIcs(), {
        status: 200,
        headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
      });
    }

    // 3. GitHub GraphQL & Search
    if (url.includes('api.github.com/graphql')) {
      const now = new Date();
      // Generate 14 days of contributions
      const contributionDays = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        contributionDays.push({
          date: d.toISOString().split('T')[0],
          contributionCount: i === 0 ? 8 : Math.floor(Math.random() * 6) + 2,
          color: '#10B981',
        });
      }

      const mockGql = {
        data: {
          user: {
            login: 'developer',
            name: 'Desk Engineer',
            avatarUrl: DEMO_AVATAR,
            bio: 'Building open-source desk gadgets & ambient interfaces',
            location: 'Global / Remote',
            followers: { totalCount: 142 },
            following: { totalCount: 89 },
            repositories: {
              nodes: [
                {
                  name: 'core-dashboard',
                  description: 'High performance touch dashboard and hardware remote',
                  stargazerCount: 328,
                  forkCount: 42,
                  primaryLanguage: { name: 'TypeScript', color: '#3178C6' },
                  url: 'https://github.com',
                  pushedAt: new Date().toISOString(),
                  isPrivate: false,
                },
                {
                  name: 'ambient-iot-bridge',
                  description: 'Minimal local bridge connecting lighting and climate',
                  stargazerCount: 184,
                  forkCount: 19,
                  primaryLanguage: { name: 'Python', color: '#3572A5' },
                  url: 'https://github.com',
                  pushedAt: new Date(Date.now() - 86400000).toISOString(),
                  isPrivate: false,
                },
              ],
            },
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 842,
                weeks: [{ contributionDays }],
              },
            },
          },
        },
      };

      return new Response(JSON.stringify(mockGql), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GitHub PR Search
    if (url.includes('api.github.com/search/issues')) {
      const mockPrs = {
        total_count: 2,
        items: [
          {
            id: 101,
            title: 'feat: optimize touch responsiveness on 120Hz panels',
            html_url: 'https://github.com',
            user: { login: 'alex-dev' },
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            repository_url: 'https://api.github.com/repos/org/core-dashboard',
          },
          {
            id: 102,
            title: 'fix: gracefully reconnect local websocket on network wake',
            html_url: 'https://github.com',
            user: { login: 'sara-iot' },
            updated_at: new Date(Date.now() - 14400000).toISOString(),
            repository_url: 'https://api.github.com/repos/org/ambient-iot-bridge',
          },
        ],
      };
      return new Response(JSON.stringify(mockPrs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GitHub REST Fallback: User Profile
    if (url.includes('api.github.com/users') && !url.includes('/repos') && !url.includes('/events')) {
      const mockUser = {
        login: 'developer',
        name: 'Desk Engineer',
        avatar_url: DEMO_AVATAR,
        bio: 'Building open-source desk gadgets & ambient interfaces',
        location: 'Global / Remote',
        followers: 142,
        following: 89,
        public_repos: 42,
      };
      return new Response(JSON.stringify(mockUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GitHub REST Fallback: User Repos
    if (url.includes('api.github.com/users') && url.includes('/repos')) {
      const mockRepos = [
        {
          id: 1,
          name: 'core-dashboard',
          description: 'High performance touch dashboard and hardware remote',
          stargazers_count: 328,
          forks_count: 42,
          language: 'TypeScript',
          html_url: 'https://github.com',
          pushed_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'ambient-iot-bridge',
          description: 'Minimal local bridge connecting lighting and climate',
          stargazers_count: 184,
          forks_count: 19,
          language: 'Python',
          html_url: 'https://github.com',
          pushed_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      return new Response(JSON.stringify(mockRepos), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GitHub REST Fallback: User Events
    if (url.includes('api.github.com/users') && url.includes('/events')) {
      const now = new Date();
      const mockEvents = [
        {
          id: 'ev-1',
          type: 'PushEvent',
          repo: { name: 'org/core-dashboard' },
          payload: { commits: [{ message: 'feat: optimize 120Hz touch pacing' }] },
          created_at: new Date(now.getTime() - 3600000).toISOString(),
        },
        {
          id: 'ev-2',
          type: 'PullRequestEvent',
          repo: { name: 'org/ambient-iot-bridge' },
          payload: { action: 'opened', pull_request: { title: 'refactor: simplify websocket reconnection' } },
          created_at: new Date(now.getTime() - 14400000).toISOString(),
        },
      ];
      return new Response(JSON.stringify(mockEvents), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Shared LAN Clipboard Mock
    if (url.includes('/api/clipboard')) {
      const mockClip = {
        current: {
          id: 'clip-demo-1',
          text: 'https://github.com/arcodexx/ArcDock',
          device: 'Laptop Browser',
          timestamp: new Date().toISOString(),
        },
        history: [
          {
            id: 'clip-demo-1',
            text: 'https://github.com/arcodexx/ArcDock',
            device: 'Laptop Browser',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'clip-demo-2',
            text: 'Meeting Room Passcode: 4829',
            device: 'Mobile Phone',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      };
      return new Response(JSON.stringify(mockClip), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Simulated Device Info (Prevents LAN IP leakage)
    if (url.includes('/api/info')) {
      return new Response(
        JSON.stringify({
          ip: '192.168.1.100',
          port: 3000,
          ha_port: 8123,
          ha_url: 'http://192.168.1.100:8123',
          clip_url: 'http://192.168.1.100:3000/clip',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Delivery Carriers & Tracking Mock
    if (url.includes('/api/carriers')) {
      return new Response(
        JSON.stringify({
          carriers: [
            { id: 'delhivery', name: 'Delhivery', trackingUrl: 'https://www.delhivery.com/track/package/' },
            { id: 'bluedart', name: 'Blue Dart', trackingUrl: 'https://www.bluedart.com' },
            { id: 'ekart', name: 'Ekart Logistics', trackingUrl: 'https://ekartlogistics.com' },
            { id: 'amazon', name: 'Amazon Shipping', trackingUrl: 'https://track.amazon.in' },
            { id: 'dtdc', name: 'DTDC Express', trackingUrl: 'https://www.dtdc.in' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('/api/track/')) {
      const now = new Date();
      const d1 = new Date(now.getTime() - 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return new Response(
        JSON.stringify({
          status: 'out_for_delivery',
          estimatedDelivery: 'Today by 6:00 PM',
          destination: 'Home Desk',
          lastCheckpoint: 'Out for delivery with delivery agent',
          history: [
            { time: `Today, ${d1}`, location: 'Local Distribution Hub', status: 'Out for delivery with delivery agent' },
            { time: 'Yesterday, 21:40', location: 'City Central Sorting Facility', status: 'Arrived at destination delivery center' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Strict Demo Sandbox: Block any unexpected external calls to Spotify or Home Assistant
    if (url.includes('api.spotify.com') || url.includes('127.0.0.1:8123') || url.includes(':8123')) {
      return new Response(JSON.stringify({ error: 'Blocked by Demo Sandbox' }), { status: 403 });
    }

    // Network ping to 1.1.1.1 mock
    if (url.includes('1.1.1.1')) {
      return new Response('fl=demo\nh=1.1.1.1\nstatus=ok\n', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Open-Meteo Weather Mock
    if (url.includes('open-meteo.com')) {
      return new Response(
        JSON.stringify({
          current: {
            temperature_2m: 24,
            relative_humidity_2m: 48,
            apparent_temperature: 24.5,
            is_day: 1,
            precipitation: 0,
            weather_code: 0,
            wind_speed_10m: 8.5,
          },
          hourly: {
            time: Array.from({ length: 24 }, (_, i) => new Date(Date.now() + i * 3600000).toISOString()),
            temperature_2m: [22, 23, 24, 25, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18, 19, 20, 21, 22, 23, 24, 25, 24, 23, 22],
            weather_code: Array(24).fill(0),
          },
          daily: {
            time: Array.from({ length: 7 }, (_, i) => new Date(Date.now() + i * 86400000).toISOString().split('T')[0]),
            weather_code: [0, 1, 2, 0, 0, 1, 0],
            temperature_2m_max: [28, 29, 27, 28, 29, 30, 28],
            temperature_2m_min: [18, 19, 18, 17, 18, 19, 18],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to original fetch for real resources with 4-second timeout guard
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await originalFetch(input, { ...init, signal: init?.signal || controller.signal });
      clearTimeout(timer);
      return res;
    } catch {
      return new Response(JSON.stringify({ error: 'Network error or timeout' }), { status: 504 });
    }
  };
}
