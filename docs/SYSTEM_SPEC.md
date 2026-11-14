# ArcDock — Master System Specification & Architecture Manual

> **Mission:** Repurposing the Xiaomi Redmi Note 10 Pro (*sweet*, Snapdragon 732G, 6.67" 120Hz Super AMOLED) into a dedicated, high-performance **Glass Remote** and smart dock running bare-metal Linux (postmarketOS + Cage Wayland Kiosk).

---

## 1. Core Philosophy & Design Commandments

Any agent or developer working on ArcDock **must adhere to these fundamental architectural tenets**:

1. **"Glass Remote, Not Audio Player":**
   * ArcDock is a dedicated touch-screen controller for external targets (**MacBook, iPhone, Car Audio, Smart Speakers**).
   * It **never** decodes audio streams or plays music through the phone's internal speakers.
   * Do not run audio playback daemons (like `spotifyd` or `spotify-soloist`) for remote control. Audio streaming wastes CPU, drains battery, generates heat, and misses catalog/playlist management APIs.
2. **120Hz Fluidity & Zero-Lag DOM:**
   * Hardware-accelerated CSS and minimal DOM trees.
   * **Strictly avoid expensive CSS filters** like `backdrop-filter: blur(...)` across large viewports on embedded mobile GPUs (Adreno 618), as they cause compositor frame drops below 120fps.
3. **Hardware & Battery Protection (The 60–70% Rule):**
   * The device stays docked 24/7. To completely prevent lithium pouch swelling, thermal degradation, and battery fires, a kernel sysfs watchdog strictly enforces a **60%–70% charge hysteresis loop**.
4. **Super AMOLED Burn-In Mitigation:**
   * AMOLED pixels degrade when displaying static elements. ArcDock includes a dual-defense system:
     * **OLED Ambient Screensaver:** Pure `#000000` true-black floating clock turns off pixels after 5 minutes of paused/idle state.
     * **Micro Pixel-Shifting:** Subtle 1–2px translate shifts every 10 minutes to protect static UI lines and button borders.
5. **Decoupled Architecture & Monorepo Appliance:**
   * The repository is organized as a single self-contained appliance.
   * Frontend: Pure Vite + Vue 3 static client bundle (158 kB). Zero backend Node/SSR server footprint.
   * IoT: Home Assistant Core container runs locally on-demand (Desk Mode only).

---

## 2. Hardware & Platform Specifications

| Component | Technical Detail |
| :--- | :--- |
| **Target Device** | Xiaomi Redmi Note 10 Pro (Codename: `sweet` / `sweetin`) |
| **SoC** | Qualcomm Snapdragon 732G (SM7150-AC) — 8 cores (2x Kryo 470 Gold @ 2.3 GHz + 6x Kryo 470 Silver @ 1.8 GHz) |
| **GPU** | Adreno 618 with hardware-accelerated Vulkan / OpenGL ES 3.2 |
| **RAM / Storage** | 6 GB or 8 GB LPDDR4X / 128 GB UFS 2.2 Flash |
| **Display** | 6.67" Super AMOLED, 2400 x 1080 (20:9), 120Hz refresh rate, HDR10 |
| **Primary OS (Recommended)** | **LineageOS 20/21 (Android 13/14)** with official hardware drivers, native 120Hz AMOLED, and stable power management |
| **Secondary OS (Power-User)** | **Nura** (formerly postmarketOS, Alpine edge / `qcom-sm7150` kernel, Community tier with partial battery charging support) |
| **Kiosk Display Layer** | **Fully Kiosk Browser / Webview Kiosk** (Android, native 120fps) or **Cage** (Wayland Kiosk Compositor, Linux) |
| **On-Device Server Engine** | **Home Assistant Core** running locally on-device inside **Termux PRoot (Ubuntu)** on Android, or via **Docker** on Linux |

---

## 3. Operational Profiles & Car Mode Kiosk Security

ArcDock features two distinct operational states toggled via the Top Bar or Settings:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ArcDock UI                                │
│                     (TopBar Operational Profile)                       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
            [ DESK MODE ]                      [ CAR MODE ]
                    │                                │
   • Home Wi-Fi (192.168.x.x)        • Mobile Hotspot / Portable Bluetooth
   • Spotify Remote (Mac/Speakers)   • Pure Automotive Spotify Remote
   • Home Assistant Core ACTIVE      • Home Assistant Core SUSPENDED
     (Local on-device daemon/Docker)   (Reclaims ~500MB-1GB RAM, 0% CPU)
   • Always-on Ambient UI            • Large glanceable controls only
   • Dual-State Split Grid           • SplitPane locked to 100% Left Pane
   • Wall USB-C Power (60-80%)       • 12V Car Charger / Battery
   • Full Developer & IoT Widgets    • 100% Strict Personal Data Isolation
   • Settings & Controls Unlocked    • Secured with 4-Digit Exit PIN Lock
```

### Car Mode Privacy & Strict Kiosk Security Isolation

#### 1. Real-World Driving Rationale: The "Backseat Jukebox" & Passenger Remote
When driving with others, the driver's primary phone is typically busy running GPS navigation (Google Maps / Waze) or connected to the car:
- Handing your main phone to passengers to pick music isn't always your first choice.
- In-car infotainment screens restrict typing and searching while driving, and passengers in the back seat can't reach them anyway.
ArcDock in **Car Mode** serves as a handy passenger remote. Anyone in the car can search songs and queue tracks to the car's speakers via Spotify Connect without touching the driver's phone or interrupting navigation, while personal desk data stays locked behind a PIN.

#### 2. Security & Privacy Guarantees
1. **Zero Personal Data Exposure:**
   - In Car Mode, whether playback is **active or paused**, the display strictly renders the Spotify music player (`NowPlaying.vue` and `MediaBar.vue`).
   - Under no circumstances does Car Mode render personal work or logistics widgets (no GitHub commit streaks, no domestic parcel tracking, no smart home controls, and no system settings).
2. **Hidden System Controls:**
   - The Settings button, Weather station pill, Network latency ping badge, and top-down Control Center grab handles are completely suppressed and hidden in `TopBar.vue` when `mode === 'car'`.
3. **4-Digit PIN Lock Protection:**
   - To prevent passengers, valets, or unauthorized users from switching the device back to Desk Mode and accessing personal home IoT or work information, exiting Car Mode requires entering a 4-digit PIN via a touch keypad modal (`z-[100]`) with error shake animation.
   - Configurable in `SettingsModal.vue` (`arcdock_desk_pin`, default: `0000`).

---

## 4. Software Subsystems & Technical Details

### Subsystem 1: Frontend ("The Glass")
* **Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Pinia, Tailwind CSS.
* **Layout Constraints:** Locked strictly to landscape (`100vw x 100vh`, fixed viewport, `overflow: hidden`, `user-select: none`).
* **Visual Theme:**
  * Base: Pitch black `#000000` and dark slate `#121212`.
  * Dynamic Ambient Backing: Real-time dominant color extraction from current album art using `colorthief`. Rendered via smooth radial CSS gradients on `#app`.
* **AMOLED Protection Implementation (`useAmoledProtection.ts`):**
  * Tracks touch/pointer/mouse events.
  * When paused/idle for > 5 minutes, activates `<OledScreensaver />` (true `#000000` background with drifting digital clock). Any tap wakes the UI instantly.
  * Every 10 minutes, applies a subtle offset `translate(Xpx, Ypx)` between -2px and +2px to the root container.

---

### Subsystem 2: Spotify Web API Engine (PKCE)

#### OAuth 2.0 PKCE Specification
* **Pattern:** RFC 7636 Authorization Code with Proof Key for Code Exchange (no client secrets stored or transmitted).
* **Endpoints:**
  * Auth: `https://accounts.spotify.com/authorize`
  * Token Exchange & Refresh: `https://accounts.spotify.com/api/token`
* **Redirect URIs:** Must be registered in Spotify Developer Dashboard:
  * `http://127.0.0.1:3000/callback`
  * `http://localhost:3000/callback`
* **Required Scopes:**
  ```text
  user-read-playback-state
  user-modify-playback-state
  user-read-currently-playing
  user-read-private
  user-read-email
  playlist-read-private
  playlist-read-collaborative
  user-library-read
  user-library-modify
  user-top-read
  ```

#### Critical Spotify API Quirks & Implementation Rules (DO NOT BREAK)
1. **Empty `200 OK` Bodies (`spotifyApi.ts`):**
   * `PUT /v1/me/library` (saving a track) and `PUT /v1/me/player/play|pause` return HTTP `200 OK` (or 204) with an **empty body (0 bytes)**.
   * **Rule:** Never call `response.json()` directly. Always read `const text = await response.text()`. If `!text || !text.trim()`, return `null`. Calling `.json()` on an empty body throws `SyntaxError: Unexpected end of JSON input` which will cause optimistic buttons to revert!
2. **Modern Unified Library Endpoints:**
   * Spotify permanently deprecated and removed legacy endpoints `GET /v1/me/tracks/contains`, `PUT /v1/me/tracks`, and `DELETE /v1/me/tracks` (they return `403 Forbidden`).
   * **Rule:** Always use Spotify's modern `/v1/me/library` endpoints:
     * Check saved status: `GET /v1/me/library/contains?uris=spotify:track:{id}`
     * Save track: `PUT /v1/me/library?uris=spotify:track:{id}`
     * Remove track: `DELETE /v1/me/library?uris=spotify:track:{id}`
3. **Search Endpoint Limit Cap:**
   * `GET /v1/search` strictly caps `limit` to a maximum of `10`. Any value > 10 throws `400 Bad Request: Invalid limit`.
   * **Rule:** Enforce `Math.min(10, Math.max(1, limit))`.
4. **Third-Party & Curated Playlist Protection (Development Mode):**
   * Spotify's API rejects reading track items from Spotify-curated or other users' playlists with `403 Forbidden` for apps in Development Mode.
   * User-owned playlists work properly when the ID is parsed with `/playlists\/([a-zA-Z0-9]+)/`.
   * **Rule:** Never crash on 403. For external playlists, display a friendly fallback card explaining the limitation and provide a direct "Play All" button (`context_uri`).
5. **No Native Queue Delete or Reorder:**
   * The Spotify Web API provides **no endpoints** to delete (`DELETE /me/player/queue`) or reorder items in the active queue.
   * **Rule:** Do not attempt to build synthetic local queues that intercept playback. Keep queue strictly native.
6. **Queue Loop Artifacts & Deduplication:**
   * `GET /v1/me/player/queue` fills with repeating loop tracks in repeat/autoplay mode.
   * **Rule:** Filter out trailing repeat duplicates of the currently playing track and tracks already in the queue using a `seenIds` set.
7. **Optimistic Locking vs. Polling Latency:**
   * Spotify's backend uses eventual consistency CDN caches. Background polling can return stale state that overwrites an action the user just tapped.
   * **Rule:** Use a 2.5s–3s lock (`optimisticLockUntil`) after any user action (Play, Pause, Skip, Like, Shuffle, Repeat, Seek). During this lock window, preserve user controls (`is_playing`, `shuffle_state`, `repeat_state`, `progress_ms`) unless the track ID changed (indicating a skip landed). Relax background polling to 4s (playing), 6s (paused), and 10s (idle). Provide a manual sync button in the Top Bar.
8. **Playlist 403 Fast-Fail:**
   * **Rule:** When fetching playlist tracks, if `/items` or `/playlists/{id}` returns a `403 Forbidden`, abort immediately and re-throw. Do not execute subsequent doomed fallback endpoints.

---

### Subsystem 3: Local Home Assistant Engine & Split-Grid UX (Phase 2 — Desk Mode)

#### Architectural Specification (On-Device Local Server)
ArcDock is designed as an all-in-one appliance: Home Assistant Core runs locally on the phone itself, eliminating any server requirements on your Mac or external hardware.

* **Primary Runtime (Android / LineageOS):**
  * **Engine:** Home Assistant Core inside **Termux PRoot (Ubuntu 24.04 ARM64)**.
  * **Execution:** Runs in an isolated Python 3 virtual environment (`~/hass-venv`) with pre-compiled ARM64 Debian/Ubuntu wheels (avoiding native compilation issues on mobile).
  * **Service Address:** `http://127.0.0.1:8123` with loopback WebSocket at `ws://127.0.0.1:8123/api/websocket`.
  * **C++ Compiler & Pipeline Dependencies:** Home Assistant's WebSocket API handler (`handle_get_services`) internally imports `assist_pipeline` during initial service catalog registration. This requires `g++` to compile `pymicro-vad` and `pyspeex-noise`. Pre-compiling these wheels ensures the WebSocket API loads immediately without hanging.
  * **Cloud & Webhook Integrations:** Cloud-connected smart devices (e.g. Samsung SmartThings for AC control) strictly require `default_config:` in `configuration.yaml` to enable `webhook:`, `zeroconf:`, and `ssdp:` discovery services.
  * **Lifecycle & Stability Guards:**
    * **Phantom Process Killer Mitigation:** On Android 14 (LineageOS 21), toggle **Settings → Developer Options → "Disable child process restrictions"** to ON.
    * **CPU Wake Lock:** `termux-wake-lock` prevents Android from idling the server CPU.
    * **Auto-Start on Boot:** Managed via `Termux:Boot` script in `~/.termux/boot/start-hass.sh`.
* **Secondary Runtime (Linux / Nura):**
  * **Container:** `ghcr.io/home-assistant/home-assistant:stable` running via Docker (`docker/docker-compose.yml`) with host networking.
* **Flash Storage Protection (UFS 2.2 Longevity):**
  * Home Assistant's default SQLite configuration writes events continuously. To protect the phone's flash storage against write cycle exhaustion, `configuration.yaml` configures the recorder:
    ```yaml
    default_config:

    recorder:
      commit_interval: 30 # Batch writes every 30 seconds instead of real-time disk thrashing
      purge_keep_days: 3  # Retain only 3 days of historical data
      exclude:
        domains:
          - media_player   # Prevent Spotify playback ticks from filling the database

    http:
      cors_allowed_origins:
        - http://127.0.0.1:3000
        - http://localhost:3000
        - http://127.0.0.1:8123
        - http://localhost:8123
    ```
* **Frontend Communication & Zero-Host Mock Engine (`useHomeAssistantStore`):**
  * Protocol: WebSocket (`ws://127.0.0.1:8123/api/websocket` or network URL).
  * Library: `home-assistant-js-websocket`.
  * **Safe Mock Engine:** Defaults to `isMockMode: true`, supplying realistic reactive desk entities (`light.desk_lamp`, `light.screen_bar`, `light.ambient_strip`, `switch.desk_fan`, `scene.focus`, `scene.relax`, `scene.night`) with 0ms local state updates, requiring zero backend services or system packages on development machines.
  * Live Mode: Supports user-configured Long-Lived Access Tokens and automatic WebSocket reconnection.
* **On-Demand Lifecycle Controller:**
  * In **Desk Mode**: Starts the Home Assistant process or container.
  * In **Car Mode**: Suspends the Home Assistant service, reclaiming ~500 MB–1 GB RAM, eliminating SQLite writes, and conserving 100% background CPU.
* **UI Architecture (Split-Grid on Landscape Display):**
  * `SplitPane.vue`: High-performance touch-draggable splitter (35%–72% width limits, persistent ratio in `localStorage`) with 1-tap chevron collapse and a discreet 20px edge reopen tab with buffer padding (`pr-8 sm:pr-10`) to keep Spotify controls unobstructed.
  * `MediaBar.vue`: Bounded inside the media pane so Spotify controls (Device Switcher, Sync, Search, Playlists, Queue) never bleed above the IoT surface.
  * `DeskIoTPanel.vue`: Compact landscape toolbar with status pill (`Mock` / `Live`), compact scenes icon dropdown (`Sparkles`), dedicated All-Off button (`Power`), and unified square tile grid (`LightCard.vue`, `SwitchCard.vue`).
  * `LightCard.vue`: Single-toggle square tile with solid opaque thumb-friendly brightness modal (100% opaque, 44px slider track, quick preset chips).
  * `TopBar.vue`: Slimmed to `h-11` with icon-only mode button and plain-language confirmation modal teleported directly to `document.body` (`<Teleport to="body">`, `z-[100]`) to ensure the middle dragger line never overlaps it.
  * `SettingsModal.vue`: Dedicated Full-Screen View (`fixed inset-0 w-screen h-screen bg-black`) with native mobile top bar and comfortable vertical scrolling.

---

### Subsystem 4: Hardware Health & Kiosk Deployment (Phase 3)

#### 1. 24/7 Battery Protection (Hysteresis & Charging Limits)
* **On LineageOS / Android (Recommended):**
  * **Method A (Built-in):** LineageOS includes a native **Charging Control / Limit** setting in `Settings → Battery` to cap charging at **80%**.
  * **Method B (Rooted / ACC):** Install **Advanced Charging Controller (ACC)** via Termux. ACC auto-probes the Redmi Note 10 Pro charging driver (LN8000 or BQ chip) and enforces a strict **60%–70% charge hysteresis loop**.
* **On Linux / Nura:**
  * Uses `scripts/battery-guardian.sh` via `/sys/class/power_supply/battery/charging_enabled` on a 60-second systemd timer.

#### 2. Kiosk Display Launcher
* **On Android (Recommended):**
  * Runs via **Fully Kiosk Browser** or an Android WebView kiosk.
  * Configuration: Fullscreen mode, WebGL hardware acceleration ON, screen stay awake while on USB power ON, overscroll effects disabled. Delivers native **120Hz Super AMOLED** performance.
* **On Linux / Nura:**
  * Runs via **Cage** Wayland compositor with Chromium flags (`scripts/launch-cage.sh`).
```bash
#!/bin/sh
# Launch ArcDock frontend in Cage Wayland compositor with Adreno GPU acceleration
exec cage -d -s -- chromium-browser \
  --kiosk \
  --ozone-platform=wayland \
  --enable-features=UseOzonePlatform \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --ignore-gpu-blocklist \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  http://127.0.0.1:3000
```

#### 3. Development & Tethering Bridge (ADB Port Forwarding)
To bypass aggressive OEM wireless power-saving sleep (such as MIUI's Wi-Fi packet throttling during display dimming), the development workstation communicates with the phone via USB cable using ADB port forwarding:
```bash
# Forward SSH terminal over physical USB cable
adb forward tcp:8022 tcp:8022

# Forward Home Assistant HTTP / WebSocket API over physical USB cable
adb forward tcp:8123 tcp:8123
```
This enables zero-latency, 100% reliable terminal access (`ssh u0_a...@localhost -p 8022`) and web access (`http://localhost:8123`) immune to network drops.

#### 4. Xiaomi Bootloader Unlock Governance (168-Hour Rule)
* **Binding Requirement:** The phone must have a SIM card with cellular data active to bind the account under `Settings → Additional settings → Developer options → Mi Unlock status`.
* **Server-Side Counter:** Xiaomi servers mandate a 168-hour (7-day) waiting cooldown (`code: 20036`).
* **Inviolable Rules During Cooldown:**
  1. Do NOT sign out of the Mi Account on the phone.
  2. Do NOT tap "Add account and device" again in Developer Options (doing so resets the timer back to 168 hours).
  3. Do NOT factory reset the phone.
  4. The physical SIM card CAN safely be removed after initial authorization; the timer is maintained server-side.

---

### Subsystem 5: Desk Control Center & Dynamic Standby Work Hub (Phase 4)

#### 1. Architectural Philosophy: The Landscape Mobile Ergonomic Challenge
A smartphone in landscape mode offers a wide canvas (~2400px physical / ~800–900px CSS) but a strictly constrained vertical height (~360–390 CSS pixels). 
Stacking 4–6 separate dashboard cards vertically on the right half creates microscopic typography and impossible touch targets. Furthermore, while music plays, nobody toggles light switches constantly; but when music is paused, leaving 50% of the screen as a static player or clock wastes valuable AMOLED real estate.

ArcDock resolves this with a **Dual-State Dynamic Canvas** and a **Top-Down Control Center Drawer**:

```
[ STATE 1: SPOTIFY PLAYING ]
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│                                              │ ⭐ PINNED FAVORITE WIDGETS (Up to 2 Cards)  │
│               SPOTIFY REMOTE                 │  [ ⭐ Favorites (2/2) ]      [ ⋯ All Widgets ]│
│           (Full Vibrant Immersion)           ├──────────────────────────────────────────────┤
│                                              │ 1. FAVORITE WIDGET #1 (e.g. SmartThings AC)  │
│   • Dynamic ColorThief ambient backdrop      │    [ − ] [ 24.0°C ] [ + ]                    │
│   • Scoped top MediaBar (Playlists/Queue)    │    [ ⏻ Power ] [ ❄️ Cool ▾ ] [ 💨 Auto ▾ ]    │
│   • NowPlaying: Album art, seeker, lyrics    ├──────────────────────────────────────────────┤
│   • Instant library toggle (+ / ✓)           │ 2. FAVORITE WIDGET #2 (e.g. Desk Lights)     │
│                                              │    [ Focus ] [ Relax ] [ Night ] quick scenes │
│                                              │    Desk Lamp & Ambient Strip slider tiles     │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘

[ STATE 2: SPOTIFY PAUSED / IDLE (STANDBY WORK & HOME DOCK) ]
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│       LEFT PANE: WORK & LOGISTICS HUB        │     RIGHT PANE: SMART DESK IOT ENVIRONMENT   │
│                                              │                                              │
│  🐙 GITHUB ACTIVITY                          │  ❄️ SMARTTHINGS AC CLIMATE                   │
│  • X commits today • Y-day streak            │  • Room Temp readout: 26.5°C                 │
│  • Pull requests awaiting review list        │  • Stepper [ − ] [ 24.0°C ] [ + ]            │
│  • 14-day contribution heatmap ribbon        │  • Downward Dropdowns: [ ❄️ Cool ▾ ] [ 💨 Auto ▾]│
│                                              │                                              │
│  📦 ACTIVE PARCEL DELIVERIES                 │  💡 DESK LIGHTS & SWITCHES                   │
│  • Multi-carrier milestone progress bar      │  • WiZ desk lamp, screen bar, GoHigh strip   │
│  • Latest hub scan checkpoint & ETA          │  • Quick scenes: Focus, Relax, Night         │
│                                              ├──────────────────────────────────────────────┤
│  ▶ Resume: Bohemian Rhapsody — Queen         │  ⏻ All Lights Off quick trigger              │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

#### 2. The Pinned Favorite Widgets System (`useFavoritesStore`)
* **Core Rule:** Users can pin **up to 2 favorite widgets** (`climate`, `lights`, `github`, `deliveries`, `weather`, `network`) to feature on the right pane while Spotify is actively playing.
* **Storage & Limit Enforcement:** Persisted in `localStorage['arcdock_favorite_widgets']` (default: `['climate', 'lights']`). Enforces a strict ceiling of 2 favorites; attempting to mark a 3rd displays an alert: *"Maximum 2 favorites reached. Unmark one first!"*.
* **Easy In-Context Pinning:**
  - In `FullScreenView.vue`: Header features a prominent `[ ⭐ Favorite (X/2) ]` toggle button.
  - In `ControlCenterDrawer.vue`: Every widget card features a star pin icon in the corner.
* **Zero Duplication on Standby:** When Spotify is paused, the right pane strictly renders Smart Desk environment controls (`DeskIoTPanel.vue`), complementing the left pane's work hub (`StandbyWorkHub.vue`) without any overlapping or duplicate cards.

#### 3. The Top-to-Down "Desk Control Center" Drawer
* **The Gesture:** Swiping down from anywhere on the Top Bar (or tapping a discreet central pull pill `━`) slides down a full-width pitch-black AMOLED drawer (`z-[90]`).
* **The Launcher Grid:** Displays a 6-card glanceable grid with star favorite toggles:
  1. `[ 🌦️ Weather Station ]`
  2. `[ 🐙 GitHub Activity & PRs ]`
  3. `[ 📦 Indian Parcel Tracker ]`
  4. `[ ❄️ SmartThings Climate AC ]`
  5. `[ 💡 All Lights & Scenes ]`
  6. `[ 📶 Network Latency Monitor ]`
* **Full-Screen View Pattern (`z-[100]`):** Tapping any card in the Control Center expands into a dedicated, unconstrained full-screen view (`fixed inset-0 w-screen h-screen bg-black`). Features a native mobile top bar (Back chevron `←`, Title, `[ ⭐ Favorite (X/2) ]`, and Close `×`).

#### 4. Contextual In-Widget Settings Architecture
Rather than cramming API keys and city searches into a distant centralized settings modal, each widget directly manages its own configuration in context inside its Full-Screen view:
* **Weather Station (`WeatherView.vue`):** Features a `[ ⚙️ Location ]` button in the header. Houses live Open-Meteo city search (Enter/Search triggers), matching locations list with coordinates, and GPS auto-location toggle. Selecting a city reloads the forecast on screen instantly.
* **GitHub Activity Hub (`GitHubView.vue`):** Features a `[ ⚙️ Account Credentials ]` button in the header to update username and personal access token with instant sync.
* **Domestic Courier Tracker (`DeliveryView.vue`):** Features a `[ ⚙️ Carrier API ]` button in the header alongside `[ + Track Package ]` to configure optional live tracking API keys (17TRACK/Ship24).
* **Main Settings (`SettingsModal.vue`):** Freed up completely from widget clutter to focus strictly on system and hardware setup (Desk/Car profile, Lock PIN, Spotify PKCE, and Home Assistant Core connection).

#### 5. Feature Specifications

##### Feature A: Dynamic Album Art Room-Sync (WiZ Bulbs & GoHigh Light Bars)
* **Objective:** Extend Spotify's dynamic visual immersion from the phone screen into the physical room.
* **Logic & Safety Rule:**
  * When Spotify track metadata changes, ArcDock retrieves the extracted dominant RGB palette from `useSpotifyStore`.
  * **The Inviolable "Only If ON" Rule:** ArcDock queries `useHomeAssistantStore` for the target lights (`light.wiz_desk_lamp`, `light.gohigh_light_bars`). 
  * If the light state is `off`, **do nothing** (strictly prevents room lights from unexpectedly turning on during bright daylight).
  * If the light state is `on`, calls Home Assistant:
    `callService('light', 'turn_on', { entity_id: targetEntities, rgb_color: [r, g, b], transition: 2 })`
* **Configuration:** Toggle switch in Settings: *"Sync Room Lights to Album Art"* with target entity multi-select.

##### Feature B: Streamlined SmartThings Climate & AC Control Card (`ClimateCard.vue`)
* **Objective:** Direct touch control over room air conditioner integrated via Home Assistant SmartThings integration.
* **Entity Type:** `climate.*` (e.g., `climate.bedroom_ac`).
* **Ergonomic Touch Controls:**
  * Current room temperature readout in header.
  * Target setpoint stepper: large `-` and `+` increment buttons with `24.0 °C` display (redundant "Target Setpoint" text removed).
  * Dedicated Power button (On/Off).
  * Mode dropdown pill (`[ ❄️ Cool ▾ ]` or `[ ✨ Auto ▾ ]`): Exclusively lists active operational modes (`Auto`, `Cool`, `Dry`, `Fan Only`, `Heat` — excluding redundant 'off'). Opens downwards (`top-full mt-1.5`) with compact bounds and frosted backdrop blur.
  * Fan speed dropdown pill (`[ 💨 Auto ▾ ]`): Opens downwards to select fan speed (`Auto`, `Low`, `Medium`, `High`).
  * Click-outside auto-dismissal.

##### Feature C: Desk Weather System (Open-Meteo REST Client)
* **Objective:** Real-time glanceable weather for desk planning with zero API keys or billing accounts.
* **API Engine:** Open-Meteo free API with dynamic geocoding city search (`https://geocoding-api.open-meteo.com/v1/search?name=...`) and forecast endpoints.
* **Refresh Rate:** Cached in `localStorage` and polled every 30 minutes.
* **Components:**
  * **Glanceable Header Pill:** Temp + weather icon (`28°C ⛅`) next to digital clock.
  * **Full-Screen Weather Station:** Displays current condition, feels-like temperature, humidity %, wind speed, 24-hour horizontal hourly curve, and 7-day Min/Max forecast, with contextual `[ ⚙️ Location ]` search drawer.
  * **Full-Screen Weather Station:** Displays current condition, feels-like temperature, humidity %, wind speed, 24-hour horizontal hourly curve, and 7-day Min/Max forecast.

##### Feature D: Network Latency Monitor (`PingMonitor.vue`)
* **Objective:** Visual early warning for network instability 5–10 seconds before video calls freeze or streams drop.
* **Mechanism:** Periodic lightweight fetch timing to `1.1.1.1` (or local gateway DNS) every 10 seconds.
* **Visual States:**
  * `🟢 Stable (< 50ms)`: Green dot with subtle sparkline.
  * `🟡 Elevated (50–120ms)`: Amber warning badge.
  * `🔴 Critical / Packet Loss (> 120ms or Timeout)`: Red pulsing indicator with latency readout (`185ms ⚠️`).

##### Feature E: GitHub Activity Hub
* **Objective:** Daily developer motivation and PR workflow tracking with pixel-accurate contribution metrics.
* **Architecture & Authentication:**
  * **Dual-Mode Precision Engine:**
    * **Authenticated Mode (Token provided):** Directly queries official GitHub GraphQL `contributionCalendar` (`viewer { contributionsCollection { contributionCalendar { ... } } }`) ensuring 100% exact parity with github.com profile.
    * **Public Unauthenticated Mode (Username only):** Uses the public `https://github-contributions-api.jogruber.de/v4/{username}` endpoint to retrieve exact historical daily contribution counts.
  * **Key Metrics:**
    * **Daily Contribution Streak:** Visual 14-day interactive contribution heatmap with exact day names, tooltips, and calculated active streak (`🔥 X days`).
    * **Today's Commit Counter:** Number of commits pushed today across repositories.
    * **User Profile Banner:** Avatar, bio, followers count, and public repository count.
    * **Top Repositories Grid:** Pinned/active repositories with language color dots, stars count, and descriptions.
    * **Pending Pull Requests Badge:** List of open PRs with branches and review statuses.

##### Feature F: Live Domestic Parcel Tracker (`DeliveryView.vue`)
* **Objective:** Real-time Indian domestic package delivery tracking with zero required API keys or subscription fees.
* **Powered By:** Open-source **ShipTrack** by Aswin (`https://shiptrack.aswincloud.com`).
* **Supported Carriers:** Dynamically fetched from `/api/carriers` (Delhivery, Blue Dart, DTDC, India Post Speed Post, Ekart, Xpressbees, Shadowfax, Amazon Shipping, etc.).
* **API Bridge & Same-Origin Architecture:**
  * To bypass browser CORS constraints without third-party proxy privacy risks, the Vite development server provides an internal outbound bridge (`shiptrack-dev-bridge` in `vite.config.ts`):
    * `GET /api/carriers` ➔ `https://shiptrack.aswincloud.com/api/carriers`
    * `GET /api/track/:carrier/:trackingNumber` ➔ `https://shiptrack.aswincloud.com/api/track/:carrier/:trackingNumber`
  * In production kiosk environments, this can be served via standard nginx/Caddy reverse proxy rules.
* **Response Schema Mapping:**
  ```json
  {
    "carrier": "delhivery",
    "trackingNumber": "420791991534",
    "status": "delivered",
    "estimatedDelivery": "14 Nov 2026, Afternoon",
    "destination": "Jodhpur",
    "events": [
      { "date": "...", "location": "...", "description": "..." }
    ],
    "fetchedAt": "2026-11-14T20:21:57.213Z"
  }
  ```
* **User Flow & Controls:**
  * Tap `+ Track Package` in Delivery View.
  * Select Courier from live-loaded list + Enter AWB / Tracking Number.
  * Card immediately switches to active connecting loader state (`parcel.isLoading: true`).
  * On response, checkpoints timeline (`events`), destination badge, estimated delivery pill, and status milestone are stored in `localStorage`.
  * **Manual Sync Buttons:** Every parcel card in `StandbyWorkHub.vue`, `FavoriteWidgetsPanel.vue`, `WidgetCardContainer.vue`, and `DeliveryView.vue` includes a manual `[ 🔄 ]` sync button to refresh that package on demand without polling spam.
  * Direct deep-link: `[ Track on <Courier> ]` opens the official carrier portal.

---

## 5. Security & Privacy
1. **Local-First & Client-Side:** No intermediary cloud server. ArcDock communicates directly between the browser and Spotify's official servers.
2. **Tokens Storage:** OAuth tokens and Client ID are stored in the browser's `localStorage` (`arcdock_spotify_tokens`, `arcdock_spotify_client_id`).
3. **Network Isolation:** Home Assistant WebSocket runs strictly on `127.0.0.1:8123`.
