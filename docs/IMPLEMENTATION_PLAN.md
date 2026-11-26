# ArcDock — Implementation Plan & Roadmap

## Phase 1: Project Scaffolding & Spotify Glass Remote (Standalone) — [COMPLETED]

### Step 1.1: Project Scaffolding
- [x] Initialize Vite + Vue 3 (TypeScript, Pinia, Tailwind CSS).
- [x] Configure strict landscape layout (`100vw x 100vh`, fixed viewport, no scrollbars).
- [x] Establish design tokens (high contrast, touch-first sizing, dark mode primary, OLED `#000000` accents).
- [x] Configure Vite server for local kiosk access (`host: "127.0.0.1"`, `port: 3000`).

### Step 1.2: Spotify PKCE Authentication Subsystem
- [x] Implement PKCE helper utility (Crypto API: `code_verifier`, SHA-256 `code_challenge`).
- [x] Build OAuth redirect handler with state verification.
- [x] Implement token exchange (`/api/token`) and persistent storage in `localStorage`.
- [x] Implement silent token refresher (auto-refresh before expiration).
- [x] Create clean, touch-friendly Settings modal with Client ID management, copyable Redirect URI, one-click re-authorization, and disconnect.

### Step 1.3: Spotify Player Polling & Playback Engine
- [x] Build `useSpotifyStore` Pinia store.
- [x] Implement relaxed adaptive polling on `GET /v1/me/player` (4s active, 6s paused, 10s idle, 429 backoff) + manual sync/refresh button.
- [x] Build Playback Controls: Play / Pause, Skip Next, Skip Previous, Seek, Shuffle, Repeat.
- [x] Implement optimistic UI updates with 2.5s–3s lock protection to prevent stale CDN cache flickers.
- [x] Local smooth 1-second progress bar ticker with track-end auto-fetch.
- [x] Integrate lightweight album art palette extractor (`colorthief`) to render hardware-accelerated dynamic radial ambient gradients.

### Step 1.4: Spotify Extended Remote Features
- [x] Build Playlists Drawer (`GET /v1/me/playlists`, tracklist drilldown, instant Play All, individual track Play and Add to Queue).
- [x] Build Live Queue Drawer (`GET /v1/me/player/queue`, clean `seenIds` loop deduplication, "+ Add Songs" shortcut, jump to track).
- [x] Build Catalog Search Drawer (`GET /v1/search?type=track&limit=10`, debounced search, Play Now & + Add to Queue).
- [x] Build Modern Spotify Library Toggle (+ / ✓ Button): Migrated to unified `/v1/me/library` endpoints (`GET /me/library/contains`, `PUT /me/library`, `DELETE /me/library`) with instant optimistic feedback.
- [x] Build Device Switcher modal (`GET /v1/me/player/devices`, seamless playback transfer).

### Step 1.5: AMOLED Screen Care & OLED Sleep Mode
- [x] Implement Inactivity Detector (tracks touch/pointer events, 5-minute timeout when paused/idle).
- [x] Create True-Black OLED Ambient Clock view (`#000000` background).
- [x] Implement micro pixel-shift mechanism (1–2px translate every 10 mins).
- [x] Add touch-anywhere instant wakeup.

### Step 1.6: Code Review & Hardware Hardening (Tier 1 & Tier 2)
- [x] Remove `backdrop-brightness` CSS filters from all drawers to protect 120Hz GPU compositor budget.
- [x] Wall-clock progress bar ticker eliminating timer drift.
- [x] Extended optimistic lock protecting shuffle, repeat, and progress alongside playback state.
- [x] Abort redundant fallback requests immediately on 403 Forbidden playlists.
- [x] In-memory color extraction palette cache (30 items) with memory release.
- [x] Minute-synchronized digital clock (60s tick interval) reducing idle CPU wakeups by 60x.
- [x] Extract shared utilities: `formatDuration` and `getDeviceIcon`.
- [x] OAuth PKCE state length increased to 32 chars and clipboard error handling.

---

## Phase 2: Local Home Assistant Integration (Desk Mode) — [COMPLETED]

### Step 2.1: Local Docker Architecture & Lifecycle Controller
- [x] Create `docker/docker-compose.yml` defining `homeassistant` (`ghcr.io/home-assistant/home-assistant:stable`, host networking, volume mount to `/opt/arcdock/homeassistant/config`).
- [x] Implement local lifecycle controller script `scripts/ha-lifecycle.sh` (`start|stop|status|desk|car`) to manage container on mode switch with zero RAM/CPU in Car Mode.
- [x] Hook operational mode toggle in TopBar, SplitPane, and SettingsModal to cleanly switch profiles.

### Step 2.2: Home Assistant WebSocket Client & Zero-Host Mock Engine
- [x] Install and configure `home-assistant-js-websocket`.
- [x] Build `useHomeAssistantStore` Pinia store:
  - Built-in Mock Engine enabled by default for safe local development without any host daemon or packages.
  - Realistic mock entities: `light.desk_lamp`, `light.screen_bar`, `light.ambient_strip`, `switch.desk_fan`, `scene.focus`, `scene.relax`, `scene.night`.
  - Live WebSocket client supporting `createLongLivedTokenAuth` and `createConnection`.
  - Subscribe to entity state changes (`subscribeEntities`) and execute service calls (`callService`).
- [x] Expand `SettingsModal.vue` with Home Assistant tab, live/mock mode toggle switch, URL, and Long-Lived Access Token configuration.

### Step 2.3: Resizable & Collapsible Smart Desk Split-Grid
- [x] Build `SplitPane.vue`:
  - Fluid touch/pointer drag resizing with clamped limits (35%–72%) and persistent ratio in `localStorage`.
  - One-tap collapse/expand with chevron and an ultra-discreet 20px edge reopen tab (`ChevronLeft`).
  - Added conditional right buffer padding (`pr-8 sm:pr-10`) when collapsed to keep Spotify controls unobstructed.
  - Auto-collapses to full-width Spotify remote in Car Mode.
- [x] Build Smart Lights & IoT UI Components:
  - `DeskIoTPanel.vue`: Compact landscape toolbar with status pill (`Mock Mode` / `Live`), compact scenes icon dropdown (`Sparkles`), and dedicated All-Off button (`Power`).
  - `LightCard.vue`: Single-toggle square card with a solid opaque thumb-friendly brightness modal (100% opaque, 44px slider track, quick preset chips).
  - `SwitchCard.vue`: Single-toggle square appliance card with animated fan/power icon and clean On/Off indicator.
  - `MediaBar.vue`: Dedicated Spotify sub-header mounted inside the media column, preventing controls from bleeding above the IoT panel.
  - `TopBar.vue`: Slimmed to `h-11` with icon-only mode toggle and plain-language confirmation modal teleported to `document.body` (`z-[100]`) to prevent dragger overlap.
  - `SettingsModal.vue`: Dedicated Full-Screen View (`fixed inset-0 w-screen h-screen bg-black`) with back navigation and clean vertical scrolling.
  - Responsive scaling of `NowPlaying.vue` for landscape phone dimensions (140px–200px artwork, compact controls).

---

## Phase 3: Hardware, OS & On-Device Kiosk Deployment
*(Primary target: Xiaomi Redmi Note 10 Pro / Any Android Device with native Termux Bionic Python)*

### Step 3.0: Bootloader Unlock Authorization & Initial Proof-of-Concept (POC) — [COMPLETED]
- [x] Link Mi Account and authorized phone number under MIUI Developer Options.
- [x] Register device with Xiaomi security servers (`code: 20036`); initiated mandatory 168-hour countdown (unlock date: November 21, 2026).
- [x] Verify on-device Home Assistant Core installation on Redmi Note 10 Pro via native Termux Bionic Python environment (abandoned PRoot due to kernel Seccomp `ptrace` deadlocks).
- [x] Identify and resolve Python/C++ voice pipeline dependency (`g++`, `pymicro-vad`, `pyspeex-noise`).
- [x] Configure and test ADB USB port forwarding (`adb forward tcp:8022` and `tcp:8123`) to eliminate wireless power-saving drops.
- [x] Connect real smart hardware (smart bulb) and confirm live local control.

### Step 3.1: LineageOS Flashing (Target Date: Nov 21, 2026) — [COMPLETED]
- [x] Run `miunlock` on fastboot upon completion of the 168-hour countdown timer.
- [x] Flash official LineageOS Recovery and LineageOS 23.2 (Android 15+) on Redmi Note 10 Pro (`sweet`).
- [x] Configure LineageOS Developer Options:
  - Toggle **"Disable child process restrictions"** to ON.
  - Toggle **"Stay awake while charging"** to ON.
  - Enable native battery **Charging limit (80%)** in `Settings → Battery`.

### Step 3.2: Turnkey On-Device Home Assistant Core Setup (LineageOS / Stock Android) — [COMPLETED]
- [x] Run automated setup script `scripts/setup-phone-ha.sh` in Termux (bare-metal Bionic Python, zero PRoot).
- [x] Verify `Termux:Boot` daemon autostart on phone reboot.
- [x] Verify UFS 2.2 flash storage longevity rules (`recorder: commit_interval: 30`, exclude `media_player`).

### Step 3.3: ArcDock 120Hz Kiosk Display Setup — [COMPLETED]
- [x] Build static bundle: `npm run build` (outputs ~500 kB to `dist/`).
- [x] Configure **Fully Kiosk Browser** on phone:
  - Lock orientation to Landscape.
  - Enable hardware-accelerated WebGL and native 120Hz refresh rate.
  - Connect ArcDock to on-device Home Assistant loopback (`ws://127.0.0.1:8123/api/websocket`).
  - Integrated dynamic display dimming (`setScreenBrightness(5)`) during OLED sleep.

---

## Phase 4: Intermediate Polish & Advanced Desk Hub (During 7-Day Wait) — [COMPLETED]

### Step 4.1: Smart Room Immersion & Climate AC Integration — [COMPLETED]
- [x] **Dynamic Album Art Room-Sync:**
  - Build reactive watcher in `src/stores/spotify.ts` / composable bridging ColorThief palette to `useHomeAssistantStore`.
  - **Inviolable Rule:** Query target entities (`light.wiz_desk_lamp`, `light.gohigh_light_bars`). Only dispatch `callService('light', 'turn_on', { rgb_color: [r, g, b], transition: 2 })` if the light is **already ON**. If light is OFF, skip dispatch.
  - Add UI master toggle: *"Sync Room Lights to Album Art"* with target entity selector in `SettingsModal.vue`.
- [x] **SmartThings Climate/AC Card (`src/components/cards/ClimateCard.vue`):**
  - Connect to Home Assistant `climate.*` entity domain (e.g. `climate.bedroom_ac`).
  - Displays current room temperature & active target setpoint.
  - Large 44px thumb-friendly `+` / `−` increment buttons (0.5°C steps).
  - Mode selector pills: `Cool`, `Fan Only`, `Dry`, `Off` mapped to `climate.set_hvac_mode`.
  - Fan speed selector chips (`Auto`, `Low`, `Medium`, `High`).

### Step 4.2: Top-Down "Desk Control Center" Drawer & Full-Screen Views — [COMPLETED]
- [x] **Top-Down Drawer (`src/components/ControlCenterDrawer.vue`):**
  - Swipe down anywhere along the Top Bar or tap central pill `━` to slide down drawer (`z-[90]`).
  - Smooth hardware-accelerated CSS translate transition.
  - 6-card touch launcher grid: `[ 🌦️ Weather ]`, `[ 🐙 GitHub ]`, `[ 📦 Deliveries ]`, `[ ❄️ Smart AC ]`, `[ 💡 Lights ]`, `[ 📶 Network ]`.
  - Swipe up gesture or tap close bar to dismiss.
- [x] **Full-Screen View Expansion Pattern (`z-[100]`):**
  - Tapping any card in the Control Center expands into an unconstrained full-screen view (`fixed inset-0 w-screen h-screen bg-black`).
  - Top navigation bar: Back button `←`, Title, and Close `×`.

### Step 4.3: Dynamic Dual-State Layout Controller (Playing vs Paused Standby Hub) — [COMPLETED]
- [x] **State 1: Active Playing State (`is_playing === true`):**
  - Left Pane: Full Spotify Glass Remote with dynamic ColorThief ambient backdrop.
  - Right Pane: Clean 2-row layout:
    - Top Row (~65% height): Tabbed/Swipeable Widget card (`[🌦️ Weather] [🐙 GitHub] [📦 Packages]`).
    - Bottom Row (~35% height): Quick Action Bar for Desk Light toggle & AC quick pill (`[ ❄️ 24°C Cool ]`).
- [x] **State 2: Paused Work Hub State (`is_playing === false`):**
  - Left Pane: Developer & Logistics Work Hub (GitHub Daily Streak + PR review request list, Active Parcel tracker milestone bar).
  - Right Pane: Full Climate & Room Console (SmartThings AC touch controls, WiZ & GoHigh lighting tiles, ambient scenes).
  - Bottom Pinned Bar: Persistent digital clock + `[ ▶ Resume: Track Name ]` music resumption pill.

### Step 4.4: Desk Widgets Implementation — [COMPLETED]
- [x] **4.4.1: Desk Weather System (`src/stores/weather.ts` & `src/components/views/WeatherView.vue`):**
  - REST client for Open-Meteo free API (cached in `localStorage`, 30-min poll, no API keys).
  - Current temperature (°C), weather icon (Clear, Overcast, Rain, Haze, etc.), humidity %, Min/Max.
  - Full-screen view: 24-hour horizontal hourly forecast curve and 7-day outlook.
- [x] **4.4.2: Network Latency Sparkline (`src/stores/network.ts` & `src/components/views/NetworkView.vue`):**
  - Lightweight HTTP/WebSocket ping timing to `1.1.1.1` (or local gateway DNS) every 10s.
  - Header badge: `24ms • 🟢 Stable`.
  - Amber warning for 50–120ms; red pulsing alert for > 120ms or packet loss.
- [x] **4.4.3: GitHub Activity Hub (`src/stores/github.ts` & `src/components/views/GitHubView.vue`):**
  - Client-side GitHub REST API integration with Personal Access Token in `localStorage`.
  - 14-day contribution square heatmap ribbon + current streak count (`🔥 18 days`).
  - Today's commit counter.
  - Pull request review requests counter (`review-requested:USER is:pr is:open`).
  - Full-screen view: interactive list of PR titles, repo names, and author handles.
- [x] **4.4.4: Indian Parcel Tracker (`src/stores/delivery.ts` & `src/components/views/DeliveryView.vue`):**
  - "+ Track Package" modal with custom Tracking Number input.
  - Indian Courier dropdown: *Delhivery, Blue Dart, DTDC, India Post (Speed Post), Ekart, Xpressbees, Shadowfax*.
  - Multi-carrier REST tracking client (17TRACK / Ship24 API).
  - 3-stage visual progress milestone bar (`Dispatched` ➔ `In Transit` ➔ `Out for Delivery` ➔ `Delivered`).
  - Full-screen view: complete transit checkpoint scan history with timestamps.

### Step 4.5: Entity Favorites & Grid Customizer — [COMPLETED]
- [x] Add "Pinned Desk Entities" selector in `SettingsModal.vue`.
- [x] Allow user to select specific lights, switches, and climate devices from HA to pin to the primary grid.
- [x] Add `manifest.json` and service worker for clean fullscreen PWA execution.

### Step 4.6: Ergonomic Screen Polish, Car Mode Kiosk Lock & In-Widget Contextual Settings — [COMPLETED]
- [x] **Car Mode Privacy & Strict Kiosk Security Isolation:**
  - Force `NowPlaying.vue` & `MediaBar.vue` in Car Mode at all times, whether playing or paused. Zero personal data exposure (no GitHub, no parcel milestones, no smart home controls).
  - Completely suppress Settings button, Weather pill, Ping badge, and Control Center grab handles in `TopBar.vue` when `mode === 'car'`.
  - Added 4-digit PIN unlock keypad dialog (`arcdock_desk_pin`, default: `0000`) required when switching from Car Mode back to Desk Mode.
- [x] **Pinned Favorite Widgets System (`src/stores/favorites.ts`):**
  - Built Pinia favorites store (`favoriteWidgets`, max 2 widgets limit, persisted in `localStorage['arcdock_favorite_widgets']`).
  - Added `[ ⭐ Favorite (X/2) ]` toggle button to `FullScreenView.vue` and star pin buttons on all cards in `ControlCenterDrawer.vue`.
  - Enforced max limit alert when user attempts to pin a 3rd widget.
  - Built `FavoriteWidgetsPanel.vue` for the right pane during active playback, rendering the up to 2 pinned favorite widgets with quick 1-tap full-screen expanders.
  - Zero duplication on standby: When paused, the left pane renders `StandbyWorkHub.vue` (GitHub & Parcels) while the right pane renders `DeskIoTPanel.vue` (Smart Desk Climate, Lights, Scenes).
- [x] **Streamlined SmartThings AC Card (`src/components/cards/ClimateCard.vue`):**
  - Removed redundant "Target Setpoint" text label beneath temperature numbers.
  - Replaced crowded mode and fan button rows with clean, downward-opening popover dropdowns (`top-full mt-1.5`).
  - Removed redundant `'off'` option from the Mode dropdown (active modes: `Auto`, `Cool`, `Dry`, `Fan Only`, `Heat`); dedicated Power button exclusively handles On/Off state.
  - Connected `'auto'` HVAC mode with indigo accent and `Sparkles` icon.
- [x] **Contextual In-Widget Settings Architecture:**
  - Integrated Open-Meteo live geocoding city search (Enter/Search triggers, GPS auto-location toggle, live coordinates) directly inside `WeatherView.vue` (`[ ⚙️ Location ]`).
  - Integrated GitHub username and Personal Access Token configuration directly inside `GitHubView.vue` (`[ ⚙️ Account Credentials ]`).
  - Integrated live carrier tracking API key directly inside `DeliveryView.vue` (`[ ⚙️ Carrier API ]`).
  - Decluttered `SettingsModal.vue` to focus 100% on core system and hardware setup (Profiles, Lock PIN, Spotify PKCE, Home Assistant connection).

---

## Phase 5: Desk Productivity Suite, Shared LAN Utilities & Ambient Themes — [COMPLETED]

### Step 5.1: Zero-Credentials Google Calendar & Agenda Widget — [COMPLETED]
- [x] **Architecture & Company Privacy Guarantee:**
  - Build `src/stores/calendar.ts` with complete isolation from corporate device enrollment / Google MDM policies.
  - Support **Dual Ingestion Engine**:
    - **Mode A (Private iCal URL):** Fetch read-only `.ics` calendar feed URL (e.g. Google Calendar Secret Address) via a local Vite/Caddy proxy bridge (`/api/calendar/feed`). Parse VEVENT components client-side to extract today's events (`summary`, `dtstart`, `dtend`, `location`, `description`, meeting links).
    - **Mode B (Local LAN Push / Webhook):** Provide a local HTTP receiver endpoint (`POST /api/calendar/sync`) allowing an external script or workstation shortcut (Mac/PC) on the local Wi-Fi to push sanitized daily schedule JSON directly without any credentials.
- [x] **UI & Glanceable Components:**
  - `src/components/views/CalendarView.vue`: Full-screen calendar station featuring today's chronological event timeline, current time horizontal indicator line, event details, and in-context `[ ⚙️ Calendar Source ]` configuration drawer.
  - `src/components/widgets/CalendarCard.vue`: Compact card for Favorite Widgets panel and Control Center drawer displaying the next upcoming meeting with visual countdown pill (e.g. *"Design Sync in 8m"*).
  - Meeting Radar integration in `TopBar.vue` and Standby Hub: Pulsing ambient amber badge when an event begins in < 10 minutes, with 1-tap view of the Google Meet / Zoom link.
  - Added calendar to `WIDGET_CATALOG`, favorites store (`useFavoritesStore`), and TopBar/Control Center launchers.

### Step 5.2: Smart Desk Pomodoro Timer with Home Assistant Automation — [COMPLETED]
- [x] **State Machine & Timing Engine (`src/stores/pomodoro.ts`):**
  - Implement reliable interval state machine: `idle | focus | short_break | long_break`.
  - Default presets: 25m Focus / 5m Break; 50m Focus / 10m Break; customizable session lengths.
  - Completed focus sessions counter & daily total focus time tracker (persisted in `localStorage`).
  - Web Audio API gentle ambient chime on phase transitions (focus completed, break completed).
  - *Explicit Requirement:* No automatic Spotify music playlist sync.
- [x] **Home Assistant Scene Link:**
  - Configurable automation hook:
    - On Focus Start: Dispatch `haStore.activateScene(focusSceneEntity)` (triggers cool white task lighting, AC focus setpoint).
    - On Break Start: Dispatch `haStore.activateScene(breakSceneEntity)` (triggers warm amber lighting).
  - Master toggle switch *"Automate Desk Scenes with Pomodoro"* and scene selector inside the Pomodoro in-widget settings.
- [x] **UI Components:**
  - `src/components/views/PomodoroView.vue`: Full-screen view with a large, high-contrast circular SVG countdown dial, thumb-friendly start/pause/reset/skip controls, session history, and scene settings.
  - `src/components/widgets/PomodoroCard.vue`: Compact favorite widget card with mini circular timer progress ring and 1-tap Play/Pause toggle.

### Step 5.3: Daily Habit & Goal Tracker — [COMPLETED]
- [x] **Habit Engine (`src/stores/habits.ts`):**
  - Pinia store managing daily micro-rituals (e.g., *2L Water, Workout, Read 15m, Side Project, Standup Prep*).
  - Persist daily completion states and timestamps in `localStorage['arcdock_habits']`.
  - Automated midnight rollover that archives completion into an interactive 7-day GitHub-style visual dot streak.
- [x] **UI Components:**
  - `src/components/views/HabitsView.vue`: Full-screen view with habit creation/editing modal (`[ + Add Habit ]`, name, emoji icon, category), streak statistics, and historical calendar view.
  - `src/components/widgets/HabitCard.vue`: Compact checklist card for Favorite Widgets panel and Standby Hub with 1-tap completion toggles and animated checkmark feedback.

### Step 5.4: Configurable World Clock & Team Timezone Bar — [COMPLETED]
- [x] **Timezone Engine (`src/stores/timezones.ts`):**
  - Manage a user-configurable list of team members, clients, or cities with IANA timezones (e.g., `Europe/Madrid`, `America/New_York`, `UTC`, `Asia/Tokyo`).
  - Customizable labels per slot (e.g., "Manager", "Client", "HQ", "Tech Lead").
  - Dynamic status classifier based on target city's current local hour:
    - `🟢 Active Working Hours` (09:00 - 18:00)
    - `🟡 Off Hours / Evening` (18:00 - 23:00)
    - `🌙 Night / Sleeping` (23:00 - 09:00)
  - Synchronized with the app's 60-second wall-clock ticker to prevent idle CPU wakeups.
  - **12h/24h Format Engine:** Defaults to 12-hour format with AM/PM (`'12h'`), with one-click toggles and `localStorage` persistence.
  - **Local Time Helper:** `getLocalTimeInfo` helper computing home base time, date, and availability status.
- [x] **UI Components:**
  - `src/components/widgets/TimezoneBar.vue`: Sleek horizontal ribbon displayed in the Favorite Widgets panel showing local home base time, 12h/24h toggle, city names, local time, and availability status pills in a compact footprint.
  - `src/components/views/TimezoneView.vue`: Full-screen timezone station featuring:
    - Dedicated "Your Local Time (Home Base)" reference card anchored at the top.
    - Ultra-compact single-row meeting planner scrubber slider (`-12h` to `+12h`) with quick Reset button.
    - Worldwide Search supporting both City and Country names (e.g. Spain, Germany, France, UK, USA, India, Japan, Australia, Canada, UAE) integrated with Open-Meteo geocoding.
    - Fixed search input left padding (`pl-9`) eliminating text-icon overlap.
    - Tightened card padding (`px-3 py-1.5`) optimized for landscape desk displays.

### Step 5.5: Web-Based Shared LAN Clipboard (Zero-Script Cross-Device Sync) — [COMPLETED]
- [x] **Server & Network Architecture:**
  - **Zero scripts on external devices:** No daemons, Raycast extensions, or native apps required on Mac, Windows, or iOS/Android.
  - Serve a lightweight, mobile-responsive web route at `/clip` (via static `public/clip.html` and Vite bridge middleware):
    - Clean browser page with a text area, "Paste & Push to ArcDock" button, and "Copy Current Clipboard" button.
  - Real-time LAN synchronization:
    - `/api/clipboard` REST and polling sync between `/clip` web clients and the ArcDock frontend store (`src/stores/clipboard.ts`).
    - Immediate bi-directional reactivity: Text pasted from a laptop or phone instantly updates the ArcDock dock display; text copied on ArcDock is instantly readable on the web client.
- [x] **UI Components:**
  - `src/components/views/ClipboardView.vue`: Full-screen clipboard manager displaying the current active clip in high-contrast text, 1-tap copy to phone clipboard, clear button, and a rolling history of the last 5 clips with timestamps.
  - `src/components/widgets/ClipboardCard.vue`: Compact favorite widget card with quick-copy button, truncated snippet preview, and QR code / link pill to open the `/clip` web page on any local device.

### Step 5.6: Ambient Screensaver Themes (Clock Skins) & Daily Mindset Quote — [COMPLETED]
- [x] **Custom Screensaver Theme Engine (`src/stores/screensaver.ts` & `src/components/OledScreensaver.vue`):**
  - Selectable clock face themes for the AMOLED idle screensaver:
    - **Theme 1: Retro Flip Clock** — Classic mechanical split-flap desk clock aesthetic with smooth CSS split cards.
    - **Theme 2: Word Clock** — Typographic grid lighting up natural language time (*"IT IS HALF PAST THREE"*).
    - **Theme 3: Minimalist Typography Clock** — Pure `#000000` true-black floating clock with ultra-clean modern typography.
  - Theme switching via 1-tap theme pill on screensaver.
  - Maintained 10-minute micro pixel-shift mechanism across all themes to guarantee zero AMOLED burn-in.
- [x] **Daily Mindset / Stoic Quote on Screensaver:**
  - Displayed directly on the OLED Screensaver beneath the clock face in dimmed, low-contrast text (`#666666`), saving 100% of favorite widget slots.
  - Curated offline JSON collection (`src/data/quotes.json`), rotating daily or upon tapping the quote.

### Step 5.8: Desk Usability, Layout & Landscape Sizing Polish — [COMPLETED]
- [x] **Screensaver Centralization:**
  - Removed interactive theme buttons from the ambient OLED screensaver (`OledScreensaver.vue`); clock skin selection and live preview testing are cleanly centralized in Settings.
- [x] **Landscape Sizing & Padding Optimization:**
  - Tightened `FavoriteWidgetsPanel.vue` headers (`py-1`), body padding (`p-1.5 sm:p-2`), and item gaps to prevent vertical overflow on landscape desk viewports (~360–390px).
  - Streamlined `TimezoneBar.vue` items with compact padding (`p-1 px-2`) and tighter spacing (`space-y-1`).
  - Replaced bulky ~110px time scrubber card in `TimezoneView.vue` with an ultra-compact ~32px single-line bar.
- [x] **Modal & View Scrolling Fixes:**
  - Added vertical scrolling (`max-h-[85vh] overflow-y-auto custom-scrollbar`) to habit creation form modal in `HabitsView.vue`.
  - Added vertical scrolling to Add City modal in `TimezoneView.vue`.
- [x] **Top-Center Toast & Notifications:**
  - Converted the LAN Clipboard incoming notification in `App.vue` into a sleek, top-center pill with zero button clutter that opens the widget view on tap.
- [x] **Main View Navigation & Focus Mode:**
  - Connected direct click-to-expand navigation from `StandbyWorkHub.vue` cards (Pomodoro, GitHub, Calendar, Deliveries) directly to their full-screen views.
  - Added full-screen Zen/Deep Focus mode to `PomodoroView.vue` with glowing dial and distraction-free AMOLED display.

### Step 5.9: Future Hardware Backlog — Indoor Air Quality & CO2 Alert Card
- [ ] **Hardware-Dependent Integration:**
  - Status: *On Hold* until physical Zigbee / Wi-Fi room air quality sensor is acquired and integrated into Home Assistant.
  - Will connect to Home Assistant sensor domains (`sensor.*_co2`, `sensor.*_voc`, `sensor.*_humidity`).
  - Threshold alert styling: `< 800 ppm` (Fresh 🟢), `800 - 1400 ppm` (Elevated 🟡), `> 1400 ppm` (Ventilate Room / Brain Fog Alert 🔴).

---

## Phase 6: Visual Themes, Aesthetic Worlds & Mobile Hardware Hardening — [COMPLETED]

### Step 6.1: Theme Engine Architecture & Design Tokens
- [x] **Theme Registry (`src/types/theme.ts` & `src/stores/theme.ts`):**
  - Type-safe `ThemeId` registry (`'default' | 'japan' | 'apple' | 'retro' | 'cyberpunk'`).
  - Metadata definition: `id`, `name`, `emoji`, `tagline`, `tone` (`'dark' | 'light'`), `badgeBg`, `badgeText`, and swatch palettes.
  - Persistent storage in `localStorage ('arcdock_theme')`.
  - DOM attribute dispatcher `applyDomAttributes(themeId)` setting `[data-theme]`, `root.style.colorScheme`, and `#theme-color-meta`.
- [x] **Universal CSS Custom Properties (`src/style.css`):**
  - Established design tokens per theme: `--dock-bg`, `--dock-text-primary`, `--dock-text-muted`, `--dock-border`, `--dock-card-bg`, `--dock-card-border`, `--dock-card-radius`, `--dock-card-shadow`, `--dock-accent`, `--dock-font`.
  - Font families: `Plus Jakarta Sans`, `Noto Sans JP`, `Space Mono`, and `Chakra Petch`.

### Step 6.2: Curated Aesthetic Worlds Implementation
- [x] **1. Baseline OLED (`default`):**
  - Pure `#000000` true-black canvas with ColorThief dynamic album art backlighting.
- [x] **2. Anime Japan Zen (`japan`):**
  - Daylight Ghibli morning sky (`#FFF5F8` base with morning sky gradient).
  - Bundled local high-res 1920x1077 photograph of Mount Fuji, Chureito Pagoda, and cherry blossoms (`public/assets/images/mount_fuji.jpg`) with automatic CDN fallback.
  - Luminous washi milk-glass cards (`rgba(255, 255, 255, 0.88)` with `border: 1.5px solid rgba(255, 183, 197, 0.6)`).
  - Traditional red Torii shrine gate, steaming ramen bowl with chopsticks 🍜, and drifting sakura petals.
  - Sumi-e dark charcoal typography (`#2D3142`), Yuzu gold (`#F4A261`), and Matcha green (`#7BA23F`) active IoT states.
- [x] **3. Apple Liquid Glass (`apple`):**
  - macOS Sonoma dynamic fluid wallpaper with specular purple/cyan light blooms.
  - Ultra-frosted acrylic glass surfaces with high-contrast text (`rgba(255, 255, 255, 0.85)`).
  - Neon icon badge rings across Weather, GitHub, Parcels, Network, Calendar, and Pomodoro.
- [x] **4. Simple Retro Radio (`retro`):**
  - 1960s Dieter Rams / Braun tabletop radio styling.
  - Charcoal bakelite chassis (`#141210`) with horizontal AM/FM glass tuning scale docked below topbar (`88–108 MHz`), illuminated red needle, and AFC ON indicator.
  - High-contrast `#D99B43` warm amber drawer dismiss button and controls.
- [x] **5. Cyberpunk 2077 HUD (`cyberpunk`):**
  - Night City Netrunner HUD with 45° chamfered card polygons (`clip-path`).
  - Caution hazard stripes, rotating targeting reticle, CRT scanlines, and Katakana decals.
  - Tactical neon cyan (`#00F0FF`), hot pink (`#FF0055`), and Cyberpunk yellow (`#FCEE0A`).

### Step 6.3: Mobile OS Dark Mode Immunity Architecture
- [x] **`color-scheme: only light` Standard Enforced:**
  - Solved Android Chrome and WebView "Auto Dark Mode for Web Contents" algorithmic inversion that darkened light themes on phones in dark mode.
  - Dynamically updates `<meta id="color-scheme-meta" content="only light">` and sets CSS `color-scheme: only light !important;` on root, body, and app elements.
  - Full theme fidelity regardless of host device OS theme setting.

### Step 6.4: AMOLED True-Black Screensaver & Ghost-Click Shield
- [x] **Strict Screensaver Pixel Extinction Isolation:**
  - Added `.oled-screensaver` class and `:not(.oled-screensaver):not(.oled-screensaver *)` exemptions across all light mode overrides.
  - Screensaver is guaranteed 100% `#000000` pitch black across all themes to extinguish OLED pixels while idle.
  - Replaced Tailwind utility classes on flip flaps with explicit deep hex values (`#0E0E12` / `#1E1E26`).
- [x] **Dynamic Theme Font Family Inheritance:**
  - Clock face numbers and dates inherit active theme font family (`var(--dock-font)`):
    - Japan: `Noto Sans JP`
    - Retro Radio: `Space Mono`
    - Cyberpunk: `Chakra Petch`
    - Default & Apple: `Plus Jakarta Sans`
- [x] **Transient Ghost-Click Prevention Shield:**
  - Intercepts and swallows trailing touch/pointer click synthesis when waking the screensaver.
  - 350ms invisible shield (`z-[250]`) in `App.vue` prevents accidental execution of underlying dock buttons.

### Step 6.5: Performance & Scrolling Ergonomics
- [x] **60 FPS Drawer Momentum Scrolling:**
  - Stripped nested `backdrop-filter: blur(10px)` from launcher cards in scrolling lists.
  - Cards use fast alpha fills, eliminating GPU compositor re-sampling during scroll.
  - Native touch pan momentum with `overscroll-contain touch-pan-y` and `will-change: transform`.

### Step 6.6: Field Hardening, Deploy Ergonomics & Live Logistics Ordering — [COMPLETED]
- [x] **Dock Power Modal Landscape Screen Fit (`src/components/DockPowerModal.vue`):**
  - Constrained modal container to `max-h-[94vh] flex flex-col overflow-hidden` with responsive landscape padding (`p-3.5 sm:p-5`).
  - Added `flex-1 overflow-y-auto no-scrollbar` to actions container and streamlined card/button padding (`min-h-[38px] sm:min-h-[42px]`), guaranteeing zero screen clipping on 20:9 landscape smartphone displays.
- [x] **SSH Multiplexing & Unreachable IP Guidance (`scripts/dock.sh`):**
  - Configured OpenSSH connection multiplexing via `ControlMaster=auto`, `ControlPath=/tmp/arcdock-ssh-*.sock`, and `ControlPersist=120s`. Prompts for SSH password only once per deploy session; subsequent `scp` and `ssh` commands reuse the active socket.
  - Clean socket teardown via shell trap on `EXIT`, `INT`, and `TERM`.
  - Added pre-flight connectivity check: halts immediately with a clear, copy-pasteable `npm run dock:ip <new-ip>` instructional banner if the phone is unreachable via DHCP Wi-Fi changes.
  - Added formatted status output when running `npm run dock:ip`.
- [x] **Reverse-Chronological Parcel & Checkpoint Tracking Engine (`src/stores/delivery.ts`, `DeliveryView.vue`, `StandbyWorkHub.vue`, `ControlCenterDrawer.vue`):**
  - Implemented `sortParcelsNewestFirst()` and timestamp indexing: newest parcel is always displayed first and defaults to the active parcel on the main desk dashboard.
  - Implemented `sortEventsNewestFirst()` and `getEventTimestamp()`: carrier checkpoint history is sorted newest-to-oldest, ensuring the latest transit status (`"In transit bag added to trip"`) is at index 0 with the active green dot, while `"Order received"` is at the bottom.
  - Retroactively normalizes saved packages in `localStorage` on app startup.
  - Main dashboard and drawer now display the live transit checkpoint subtitle with matching green status indicators.
