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
*(Primary target: Xiaomi Redmi Note 10 Pro with LineageOS + Termux PRoot; Alternate: Nura/postmarketOS)*

### Step 3.0: Bootloader Unlock Authorization & Initial Proof-of-Concept (POC) — [COMPLETED / IN PROGRESS]
- [x] Link Mi Account and authorized phone number under MIUI Developer Options.
- [x] Register device with Xiaomi security servers (`code: 20036`); initiated mandatory 168-hour countdown (unlock date: November 21, 2026).
- [x] Verify on-device Home Assistant Core installation on Redmi Note 10 Pro via Termux PRoot Ubuntu 24.04 ARM64.
- [x] Identify and resolve Python/C++ voice pipeline dependency (`g++`, `pymicro-vad`, `pyspeex-noise`).
- [x] Configure and test ADB USB port forwarding (`adb forward tcp:8022` and `tcp:8123`) to eliminate wireless power-saving drops.
- [x] Connect real smart hardware (smart bulb) and confirm live local control.

### Step 3.1: LineageOS Flashing (Target Date: Nov 21, 2026)
- [ ] Run `miunlock` on fastboot upon completion of the 168-hour countdown timer.
- [ ] Flash official LineageOS Recovery and LineageOS 21 (Android 14) on Redmi Note 10 Pro (`sweet`).
- [ ] Configure LineageOS Developer Options:
  - Toggle **"Disable child process restrictions"** to ON.
  - Toggle **"Stay awake while charging"** to ON.
  - Enable native battery **Charging limit (80%)** in `Settings → Battery`.

### Step 3.2: Turnkey On-Device Home Assistant Core Setup (LineageOS)
- [ ] Run automated setup script `scripts/setup-phone-ha.sh` in Termux.
- [ ] Verify `Termux:Boot` daemon autostart on phone reboot.
- [ ] Verify UFS 2.2 flash storage longevity rules (`recorder: commit_interval: 30`, exclude `media_player`).

### Step 3.3: ArcDock 120Hz Kiosk Display Setup
- [ ] Build static bundle: `npm run build` (outputs ~200 kB to `dist/`).
- [ ] Configure **Fully Kiosk Browser** on phone:
  - Lock orientation to Landscape.
  - Enable hardware-accelerated WebGL and native 120Hz refresh rate.
  - Connect ArcDock to on-device Home Assistant loopback (`ws://127.0.0.1:8123/api/websocket`).

### Step 3.4: Alternative Pure Linux Reference (Nura / Cage Kiosk)
- [ ] Maintain `scripts/launch-cage.sh` and `docker/docker-compose.yml` for power-users running Nura/Alpine Linux.

---

## Phase 4: Intermediate Polish & Smart Device Enhancements (During 7-Day Wait)
- [ ] **Climate & AC Control Card (`ClimateCard.vue`):** Dedicated touch-first tile for HVAC/Air Conditioner control (target temperature slider, Cool/Heat/Fan mode toggles) for SmartThings AC integration.
- [ ] **Entity Favorites & Grid Customizer:** Entity selector in `SettingsModal.vue` allowing user to pin specific desk lights, switches, and AC units to the dashboard.
- [ ] **PWA & Offline Service Worker:** Add `manifest.json` and service worker for clean fullscreen "Add to Home Screen" execution.
- [ ] **macOS Companion Helper (Optional):** Lightweight local daemon bridging Mac system volume, lock, and mute controls to the dock.
- [ ] macOS Notification & Calendar daemon (lightweight Go daemon bridging local notifications to dock toast via WebSocket).
- [ ] Proximity sensor / double-tap wake gestures using Qualcomm hardware sensor HAL.
- [ ] Local weather / ambient sensor dashboard widgets.
