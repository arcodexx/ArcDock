# ArcDock — Master System Specification & Architecture Manual

> **Mission:** Repurposing any smartphone, tablet, or touch display (primary reference: Xiaomi Redmi Note 10 Pro, Snapdragon 732G, 6.67" 120Hz Super AMOLED) into a dedicated, high-performance ambient **Glass Remote** and smart desk dock running bare-metal on Android (LineageOS / Stock) with Termux (native Bionic Python) and Fully Kiosk Browser.

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
3. **Hardware & Battery Protection (The 80% Cap / Hysteresis Rule):**
   * The device stays docked 24/7. To completely prevent lithium pouch swelling, thermal degradation, and battery fires, ArcDock leverages Android's native **80% charging limit** (or a 60%–70% hysteresis loop via ACC / smart plug automation).
4. **Super AMOLED Burn-In Mitigation:**
   * AMOLED pixels degrade when displaying static elements. ArcDock includes a dual-defense system:
     * **OLED Ambient Screensaver:** Pure `#000000` true-black floating clock turns off pixels after 5 minutes of paused/idle state.
     * **Micro Pixel-Shifting:** Subtle 1–2px translate shifts every 10 minutes to protect static UI lines and button borders.
5. **Decoupled Architecture & Monorepo Appliance:**
   * The repository is organized as a single self-contained appliance.
   * Frontend: Pure Vite + Vue 3 static client bundle (~526 kB / 146 kB gzip). Zero backend Node/SSR server footprint.
   * IoT: Home Assistant Core daemon runs locally on-demand (Desk Mode only).

---

## 2. Hardware & Platform Specifications

| Component | Technical Detail |
| :--- | :--- |
| **Target Device** | Xiaomi Redmi Note 10 Pro (Codename: `sweet` / `sweetin`) |
| **SoC** | Qualcomm Snapdragon 732G (SM7150-AC) — 8 cores (2x Kryo 470 Gold @ 2.3 GHz + 6x Kryo 470 Silver @ 1.8 GHz) |
| **GPU** | Adreno 618 with hardware-accelerated Vulkan / OpenGL ES 3.2 |
| **RAM / Storage** | 6 GB or 8 GB LPDDR4X / 128 GB UFS 2.2 Flash |
| **Display** | 6.67" Super AMOLED, 2400 x 1080 (20:9), 120Hz refresh rate, HDR10 |
| **Primary OS (Recommended)** | **LineageOS 23.2 (Android 15+)** or **Stock Android** with official hardware drivers, native 120Hz AMOLED, and stable power management |
| **Kiosk Display Layer** | **Fully Kiosk Browser / Webview Kiosk** (Android, native 120fps) with auto-dimming sleep and ghost-click protection |
| **On-Device Server Engine** | **Home Assistant Core** running locally on-device directly on native Android Bionic libc via Termux Python (Zero PRoot / Zero emulation) |

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
     (Local on-device Termux daemon)   (Reclaims ~500MB-1GB RAM, 0% CPU)
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
* **Visual Theme Engine (`src/stores/theme.ts`, `src/types/theme.ts`, `src/style.css`):**
  * 5 Curated Artistic Worlds:
    1. `default`: Baseline Pure OLED Black with ColorThief real-time album art backlighting.
    2. `japan`: Anime Japan Zen daylight Ghibli aesthetic (`#FFF5F8`), bundled 1920x1077 Mount Fuji & Chureito Pagoda photography, Torii gate, steaming ramen bowl 🍜, drifting cherry blossom petals, sumi-ink typography (`#2D3142`), Yuzu gold & Matcha green accents.
    3. `apple`: macOS Sonoma liquid acrylic glass with fluid wallpaper and neon icon rings.
    4. `retro`: 1960s Dieter Rams Braun tabletop radio with horizontal AM/FM dial (`88–108 MHz`), red needle, and warm amber accents (`#D99B43`).
    5. `cyberpunk`: Night City Netrunner HUD with 45° chamfered cards, targeting reticle, CRT scanlines, and neon cyan/yellow/pink palette.
  * **Phone Dark Mode Immunity:** Enforces `color-scheme: only light !important;` on light themes to bypass Android Chrome/WebView Auto-Dark Mode algorithmic inversion.
* **AMOLED Protection & Screensaver Architecture (`useAmoledProtection.ts` & `OledScreensaver.vue`):**
  * Tracks touch/pointer/mouse events.
  * When paused/idle for > 5 minutes, activates `<OledScreensaver />`.
  * **True-Black Pixel Extinction:** Strictly isolated from theme overrides; forces pure `#000000` black in all themes to extinguish OLED pixels while idle.
  * **Theme Font Inheritance:** Clock digits dynamically adopt the active theme's font family (`Noto Sans JP`, `Space Mono`, `Chakra Petch`, `Plus Jakarta Sans`).
  * **Transient Ghost-Click Shield:** Raises an invisible shield (`z-[250]`) for 350ms upon screensaver wake, swallowing trailing synthesized touch events to eliminate accidental button presses on underlying widgets.
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

* **Primary Runtime (Android / LineageOS / Stock Android):**
  * **Engine:** Home Assistant Core running **bare-metal on native Android Bionic libc via Termux** (abandoned PRoot/udocker completely to eliminate `ptrace(PTRACE_GETEVENTMSG)` kernel Seccomp deadlocks).
  * **Execution:** Runs in an isolated virtual environment (`~/hass`) using native Termux Bionic-compiled packages (`python-cryptography`, `python-bcrypt`, `build-essential`, `uv`) and pre-built multiarch wheels installed via `scripts/setup-phone-ha.sh`.
  * **Service Address:** `http://127.0.0.1:8123` with loopback WebSocket at `ws://127.0.0.1:8123/api/websocket`.
  * **C++ Compiler & Pipeline Dependencies:** Pre-compiled wheels for voice pipeline and cryptography dependencies bypass compilation halts on mobile.
  * **Lean Headless Core (No D-Bus Crashes):** To prevent Bluetooth D-Bus and Scapy packet sniffer daemons from crashing on non-rooted Android, `default_config:` is explicitly avoided in favor of an explicit component list in `configuration.yaml`.
  * **Lifecycle & Stability Guards:**
    * **Phantom Process Killer Mitigation:** On Android 12–15, toggle **Settings → Developer Options → "Disable child process restrictions"** to ON.
    * **CPU Wake Lock:** `termux-wake-lock` prevents Android from idling the server CPU.
    * **Auto-Start on Boot:** Managed via `Termux:Boot` script in `~/.termux/boot/start-hass.sh`.
* **Flash Storage Protection (UFS 2.2 Longevity) & Clean Headless Core:**
  * Home Assistant's default SQLite configuration writes events continuously. To protect the phone's flash storage against write cycle exhaustion, `configuration.yaml` configures the recorder and essential domains:
    ```yaml
    # ArcDock Clean Core Configuration (Headless / Zero D-Bus / Flash Safe)
    frontend:
    history:
    logbook:
    recorder:
      commit_interval: 30 # Batch writes every 30 seconds instead of real-time disk thrashing
      purge_keep_days: 3  # Retain only 3 days of historical data
      exclude:
        domains:
          - media_player   # Prevent Spotify playback ticks from filling the database
          - camera

    sun:
    sensor:
    switch:
    light:
    climate:
    automation: !include automations.yaml
    script: !include scripts.yaml
    scene: !include scenes.yaml

    http:
      cors_allowed_origins:
        - http://127.0.0.1:3000
        - http://localhost:3000
        - http://127.0.0.1:8123
        - http://localhost:8123
    ```
* **Frontend Communication via WebSocket (`useHomeAssistantStore`):**
  * Protocol: WebSocket (`ws://127.0.0.1:8123/api/websocket` or network URL).
  * Library: `home-assistant-js-websocket`.
  * Live Reactive State: Real-time subscription to `HassEntities` with automatic reconnects and token persistence in `localStorage`.
* **On-Demand Lifecycle Controller:**
  * In **Desk Mode**: Home Assistant process is active on port 8123.
  * In **Car Mode**: Suspends the Home Assistant service, reclaiming ~500 MB–1 GB RAM, eliminating SQLite writes, and conserving 100% background CPU.
* **UI Architecture (Split-Grid on Landscape Display):**
  * `SplitPane.vue`: High-performance touch-draggable splitter (35%–72% width limits, persistent ratio in `localStorage`) with 1-tap chevron collapse and a discreet 20px edge reopen tab with buffer padding (`pr-8 sm:pr-10`) to keep Spotify controls unobstructed.
  * `MediaBar.vue`: Bounded inside the media pane so Spotify controls (Device Switcher, Sync, Search, Playlists, Queue) never bleed above the IoT surface.
  * `DeskIoTPanel.vue`: Compact landscape toolbar with connection status indicator, compact scenes icon dropdown (`Sparkles`), dedicated All-Off button (`Power`), and unified square tile grid (`LightCard.vue`, `SwitchCard.vue`).
  * `LightCard.vue`: Single-toggle square tile with solid opaque thumb-friendly brightness modal (100% opaque, 44px slider track, quick preset chips).
  * `TopBar.vue`: Slimmed to `h-11` with icon-only mode button and plain-language confirmation modal teleported directly to `document.body` (`<Teleport to="body">`, `z-[100]`) to ensure the middle dragger line never overlaps it.
  * `SettingsModal.vue`: Dedicated Full-Screen View (`fixed inset-0 w-screen h-screen`) with native mobile top bar and comfortable vertical scrolling.

---

### Subsystem 4: Hardware Health & Kiosk Deployment (Phase 3)

#### 1. 24/7 Battery Protection (Hysteresis & Charging Limits)
* **Built-in OS Protection:** LineageOS and modern Android ROMs include a native **Charging Control / Limit** setting in `Settings → Battery` to cap charging at **80%**, preventing lithium pouch expansion.
* **Root / ACC Hysteresis:** For rooted devices, **Advanced Charging Controller (ACC)** via Termux auto-probes the device charging driver (LN8000/BQ chip) and enforces a strict **60%–70% charge hysteresis loop**.

#### 2. Kiosk Display Launcher (Fully Kiosk Browser)
* **Configuration:** Fullscreen kiosk mode, WebGL hardware acceleration ON, screen stay awake on USB power ON, overscroll effects disabled. Delivers native **120Hz Super AMOLED** performance.
* **Dynamic Hardware Dimming:** ArcDock integrates directly with Fully Kiosk's JavaScript interface (`window.fully.setScreenBrightness(5)`) during OLED sleep, dropping display power draw and eliminating heat while docked on charge. Original day brightness is restored automatically upon wake.

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
* **Core Rule:** Users can pin their favorite widgets (`smartdesk`, `github`, `deliveries`, `weather`, `network`, `calendar`, `pomodoro`, `habits`, `timezones`, `clipboard`) to feature on the right pane while Spotify is actively playing.
* **Configurable Widget Limit:** Persisted in `localStorage['arcdock_max_favorites']` (selectable in Settings: 2 for Phones, 3 for Wide screens, 4 for Tablets). Enforces the user-chosen ceiling, preventing excessive vertical stacking on compact mobile screens.
* **Easy In-Context Pinning:**
  - In `FullScreenView.vue`: Header features a prominent `[ ⭐ Favorite (X/N) ]` toggle button.
  - In `ControlCenterDrawer.vue`: Every widget card features a star pin icon in the corner.
* **Zero Duplication on Standby:** When Spotify is paused, the right pane strictly renders Smart Desk environment controls (`DeskIoTPanel.vue`), complementing the left pane's work hub (`StandbyWorkHub.vue`) without any overlapping or duplicate cards.

#### 3. The Top-to-Down "Desk Control Center" Drawer
* **The Gesture:** Swiping down from anywhere on the Top Bar (or tapping the discreet central pull pill `━`) slides down a full-width pitch-black AMOLED drawer (`z-[90]`).
* **The Launcher Grid:** Displays the complete glanceable widget launcher grid with star favorite toggles and in-context full-screen expansions:
  1. `[ 🌦️ Weather Station ]`
  2. `[ 🐙 GitHub Activity Hub ]`
  3. `[ 📦 Indian Parcel Tracker ]`
  4. `[ ❄️ Smart Desk IoT (Climate & Lights) ]`
  5. `[ 📶 Network Latency Monitor ]`
  6. `[ 📅 Daily Agenda & Meeting Radar ]`
  7. `[ ⏱️ Focus Pomodoro Timer ]`
  8. `[ ✅ Daily Habits Tracker ]`
  9. `[ 🌍 World Clock & Timezones ]`
  10. `[ 📋 LAN Shared Clipboard ]`
* **Full-Screen View Pattern (`z-[100]`):** Tapping any card in the Control Center expands into a dedicated, unconstrained full-screen view (`fixed inset-0 w-screen h-screen`). Features a native mobile top bar (Back chevron `←`, Title, `[ ⭐ Favorite (X/N) ]`, and Close `×`).

#### 4. Contextual In-Widget Settings Architecture
Rather than cramming API keys and city searches into a distant centralized settings modal, each widget directly manages its own configuration in context inside its Full-Screen view:
* **Weather Station (`WeatherView.vue`):** Features a `[ ⚙️ Location ]` button in the header. Houses live Open-Meteo city search (Enter/Search triggers), matching locations list with coordinates, and GPS auto-location toggle. Selecting a city reloads the forecast on screen instantly.
* **GitHub Activity Hub (`GitHubView.vue`):** Features a `[ ⚙️ Account Credentials ]` button in the header to update username and personal access token with instant sync.
* **Domestic Courier Tracker (`DeliveryView.vue`):** Features `[ + Track Package ]` alongside free multi-carrier live shipment tracking (zero API keys required via ShipTrack).
* **Main Settings (`SettingsModal.vue`):** Freed up completely from widget clutter to focus strictly on system and hardware setup (Desk/Car profile, Lock PIN, 12h/24h toggle, Spotify PKCE, and Home Assistant Core connection).

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
    * **Public Unauthenticated Mode (Username only):** Uses official GitHub REST endpoints (`/users/{username}/events`, `/users/{username}/repos`, and `/search/issues`) with client-side event timestamp aggregation, bypassing third-party scrapers entirely.
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

### Subsystem 6: Desk Productivity, Shared LAN Utilities & Ambient Themes (Phase 5)

#### 1. Zero-Credentials Google Calendar & Agenda Engine (`calendar.ts` & `CalendarView.vue`)
* **The Corporate Privacy Challenge:**
  * When using a company-issued Google account, signing into Google directly on a personal repurposed phone or kiosk browser triggers corporate MDM (Mobile Device Management) policies, device enrollment prompts, or Google Workspace security blocks.
* **The Air-Gapped Architectural Solution:**
  * ArcDock operates with **zero corporate credentials** on the device via a dual-mode ingestion engine:
    1. **Mode A: Read-Only Private iCal (.ics URL):**
       * Users copy the standard "Secret address in iCal format" from their Google Calendar Web settings (`https://calendar.google.com/calendar/ical/<user>/private-<key>/basic.ics`).
       * ArcDock fetches the raw text feed via a local server bridge (Vite in dev, Caddy in prod) and parses `VEVENT` objects client-side using a zero-dependency/lightweight calendar parser.
       * Extracts: `summary` (title), `dtstart`, `dtend`, `location`, `description`, and auto-detects Google Meet / Zoom / Teams video URLs (`/https:\/\/(meet\.google\.com|.*\.zoom\.us|teams\.microsoft\.com)\/[^\s]+/`).
    2. **Mode B: Local Workstation LAN Push (`POST /api/calendar/sync`):**
       * For companies where external iCal sharing is strictly disabled by Workspace admin policies, a 10-line shell/AppleScript or Raycast script running on the user's authenticated work laptop queries the native macOS Calendar and pushes today's schedule as sanitized JSON to ArcDock's IP on the home Wi-Fi:
         ```json
         [
           { "title": "Design Sync", "start": "2026-11-15T10:00:00+05:30", "end": "2026-11-15T10:30:00+05:30", "meetUrl": "https://meet.google.com/abc-defg-hij" }
         ]
         ```
       * 100% air-gapped: ArcDock merely renders dumb local JSON.
* **Pre-Meeting Radar & UI Display:**
  * **Pre-Meeting Radar:** A visual countdown banner appears in `TopBar.vue` and Standby Hub when an event begins in `< 10 minutes` (*"Design Sync in 8m [ 📹 Join ]"*).
  * **Full-Screen Agenda View (`CalendarView.vue`):** Chronological timeline with a red horizontal line marking the current time, completed event dimming, and an in-context `[ ⚙️ Calendar Source ]` drawer.

#### 2. Smart Desk Pomodoro Timer with Home Assistant Scene Automation (`pomodoro.ts` & `PomodoroView.vue`)
* **State Machine:**
  * Modes: `idle` | `focus` | `short_break` | `long_break`.
  * Configurable intervals: Default 25m Focus / 5m Break; 50m Focus / 10m Break.
  * Local counters: Completed intervals today, total focus minutes today.
  * *Strict Design Constraint:* No automatic Spotify playlist resuming (music control remains manual).
* **Smart Home Synergy (Lighting & Climate Automation):**
  * When a Focus session starts:
    * Queries `useHomeAssistantStore` and activates the user-configured Focus Scene (`callService('scene', 'turn_on', { entity_id: 'scene.focus' })`) or dims ambient background strips and tunes the desk monitor lightbar to crisp cool-white (`4000K`), with AC comfort setpoint.
  * When a Break session starts:
    * Automatically triggers Relax Scene (`scene.relax`) switching room lighting to soft warm amber (`2700K`).
  * Gentle audio chime on transition via the browser Web Audio API oscillator.

#### 3. Daily Habit & Goal Tracker (`habits.ts` & `HabitsView.vue`)
* **Objective:** Replace phone habit apps that trigger notification distraction with an ambient, physical 1-tap desk ritual tracker.
* **Data Model:**
  ```typescript
  interface Habit {
    id: string;
    title: string;          // e.g. "2L Water", "Workout", "Read 15m"
    icon: string;           // emoji or Lucide icon
    completedDates: string[]; // ['2026-11-15', '2026-11-14', ...]
    streakDays: number;
  }
  ```
* **UI Pattern:**
  * **Compact Habit Card (`HabitCard.vue`):** Pinned on Standby Hub or Favorites panel. Touch-friendly check boxes with instant visual completion state.
  * **GitHub-Style 7-Day Dot Streak:** Displays a mini row of 7 colored dots representing the last week of consistency.
  * **Full-Screen Station (`HabitsView.vue`):** Manage habits, view monthly completion calendar, and configure reset schedules.

#### 4. Configurable World Clock & Team Timezone Ribbon (`timezones.ts` & `TimezoneBar.vue`)
* **Objective:** Instant glanceable awareness of remote team member, client, or manager working hours without mental UTC calculations.
* **Custom Slot Model:**
  * Users can configure arbitrary cities, IANA timezones (e.g. `Europe/Madrid`, `America/New_York`, `UTC`), and custom labels (e.g. *"Manager (Spain)"*, *"Tech Lead"*, *"Client HQ"*).
* **Dynamic Availability State:**
  * `🟢 Active Work` (09:00 - 18:00 local destination time): Green indicator.
  * `🟡 Off Hours / Evening` (18:00 - 23:00 local destination time): Amber indicator.
  * `🌙 Sleeping / Night` (23:00 - 09:00 local destination time): Indigo moon indicator.
* **Sync & Performance:** Tied to the central 60-second synchronized clock tick, producing zero background CPU thrashing.

#### 5. Web-Based Shared LAN Clipboard Architecture (`clipboard.ts` & `/clip` route)
* **The "Zero Third-Party Apps & Zero Client Scripts" Rule:**
  * Users should NOT be forced to install companion daemons, raycast extensions, or background scripts on laptops or secondary phones.
* **The Implementation:**
  * ArcDock exposes a lightweight mobile-responsive browser page at `/clip` (or static `public/clip.html`).
  * On a Mac, Windows PC, or iPhone/Android phone connected to the same Wi-Fi, open `http://<arcdock-ip>:3000/clip`.
  * The page provides a clean, autofocus text box with:
    * `[ Paste & Send to ArcDock ]`
    * `[ Copy Current ArcDock Clip ]`
  * Real-time bi-directional WebSocket connection between `/clip` web clients and the ArcDock frontend store (`useClipboardStore`).
  * Text pasted on any browser tab instantly syncs to the ArcDock screen with a large 1-tap `[ Copy ]` button and a rolling history of the last 5 clips (with auto-clear after 24h for security).

#### 6. Ambient Screensaver Themes (Clock Skins) & Daily Mindset Quote
* **Themeable AMOLED Screensaver (`OledScreensaver.vue`):**
  * When paused/idle for > 5 minutes, ArcDock transitions to the OLED screensaver with user-selected clock themes:
    1. **Retro Flip Clock:** Mechanical split-flap desk clock with 3D card-flip animations.
    2. **Word Clock:** Typographic word-search matrix highlighting natural language phrases.
    3. **Minimalist Typography Clock:** High-contrast pure `#000000` modern digital clock.
  * Theme switching via simple horizontal swipe across the screen while in sleep mode.
* **Daily Mindset / Stoic Quote on Screensaver:**
  * **Zero Widget Slot Penalty:** Daily motivational/stoic thoughts do not steal a functional dashboard slot; instead, they render directly beneath the clock face on the OLED screensaver.
  * Displayed in dimmed, low-contrast typography (`#666666`), ensuring pixels remain unlit/energy-efficient with zero OLED burn-in risk.
  * Reads from a curated offline quotes collection (`src/data/quotes.json`), rotating daily or upon tapping the quote.

#### 7. Future Hardware Backlog: Indoor Air Quality & CO2 Alert
* **Status:** On hold pending acquisition of physical Zigbee/Wi-Fi air sensor.
* **Entity Mapping:** Connects to Home Assistant `sensor.*_co2`, `sensor.*_voc`.
* **Visual Thresholds:** `< 800 ppm` (Fresh 🟢), `800–1400 ppm` (Elevated 🟡), `> 1400 ppm` (Ventilate Room 🔴).

---

### Subsystem 7: Visual Themes, Mobile OS Hardening & Deployment Multiplexing (Phase 6)

#### 1. Curated Visual Worlds Engine (`theme.ts` & `ThemeBackdrop.vue`)
* **Dynamic Material Themes:** Beyond basic dark mode, ArcDock includes 5 curated visual themes:
  1. **Default OLED:** Pure `#000000` canvas with ColorThief dynamic album art radial lighting.
  2. **Anime Japan Zen:** Daylight Ghibli morning atmosphere with local high-res photography of Mount Fuji, Chureito Pagoda, Torii shrine gate, steaming ramen bowl, drifting Sakura petals, and washi glass cards.
  3. **Apple Liquid Glass:** macOS Sonoma dynamic fluid wallpaper, specular light blooms, and high-contrast acrylic panels.
  4. **Simple Retro Radio:** 1960s Dieter Rams / Braun tabletop radio with horizontal AM/FM glass scale (`88–108 MHz`), illuminated red tuning needle, and warm amber controls.
  5. **Cyberpunk 2077 HUD:** Night City Netrunner HUD with 45° chamfered card polygons (`clip-path`), caution hazard stripes, rotating targeting reticle, CRT scanlines, and Katakana decals.
* **Mobile OS Dark Mode Immunity:** Enforces `color-scheme: only light !important;` and dynamic `<meta id="color-scheme-meta" content="only light">` when a light theme is active, preventing Android WebViews from forcibly inverting the page.

#### 2. AMOLED True-Black Screensaver & Ghost-Click Shield (`OledScreensaver.vue`)
* **OLED Pixel Extinction Isolation:** All light mode rules strictly exclude `.oled-screensaver`, guaranteeing `#000000` true black to power off OLED pixels.
* **Theme Font Inheritance:** Clock digits dynamically adopt the active theme's font family (`Noto Sans JP`, `Space Mono`, `Chakra Petch`, `Plus Jakarta Sans`) while keeping backgrounds completely off.
* **Ghost-Click Prevention Shield:** A transient 350ms invisible shield (`z-[250]`) intercepts and swallows trailing synthesized touch events when waking the screensaver, preventing accidental button triggers.

#### 3. OpenSSH Multiplexing & Deployment CLI (`scripts/dock.sh`)
* **ControlMaster Session Re-use:** Uses OpenSSH `ControlMaster=auto`, `ControlPath=/tmp/arcdock-ssh-*.sock`, and `ControlPersist=120s`. The user authenticates once with their SSH password; subsequent `scp` transfers and remote restart commands reuse the active socket without re-prompting. Clean teardown via shell trap.
* **Pre-flight Connectivity Check:** Verifies port 8022 before initiating builds. If unreachable via DHCP Wi-Fi lease changes, outputs an actionable banner with `npm run dock:ip <new-ip>`.

#### 4. Reverse-Chronological Parcel Logistics Engine (`delivery.ts`)
* **Newest-First Parcel Ordering:** Parcels are ordered with the newest shipment at index 0 (`parcels[0]`), displayed by default on the main desk dashboard and in Control Center.
* **Checkpoint Timeline Sorting:** Automatic timestamp parser (`getEventTimestamp`) and status classifier (`sortEventsNewestFirst`) place the latest transit checkpoint (`"In transit bag added to trip"`) at index 0 with the active green dot, cascading down to the earliest event (`"Order received"`) at the bottom.

#### 5. Background Polling Intervals & Network Warm-Up Engine
ArcDock balances live glanceability with API rate limits and battery conservation:

| Service | Refresh Interval | Strategy / Rate Limit Context |
| :--- | :--- | :--- |
| **Home Assistant** | **Instant (0ms)** | Real-time push over persistent WebSocket |
| **Spotify Remote** | **Every 2s / 5s** | Active playback tracking (2s playing, 5s paused) |
| **LAN Clipboard** | **Every 2.5s** | Instant copy/paste synchronization across LAN |
| **Network Ping** | **Every 10s** | Live ping to Cloudflare edge |
| **Weather** | **Every 15 min** | Open-Meteo ambient temperature and condition |
| **Calendar** | **Every 30 min** | 2 requests/hour (completely safe for Google/Outlook) |
| **GitHub** | **Every 1 hour** | 1–3 requests/hour (`< 3%` of unauthenticated limit) |
| **Parcels** | **Manual Only** | On-demand to prevent courier bot detection |

* **Zero-Touch Cold-Boot Warm-Up Sync:**
  * On device power-on, the browser web app starts up before Android finishes its Wi-Fi DHCP handshake.
  * Staggered retries run at **5s** and **15s** after boot.
  * Attaches a `window.addEventListener('online', ...)` listener that immediately triggers a full data fetch the millisecond Wi-Fi connects.

---

## 5. Security & Privacy
1. **Local-First & Client-Side:** No intermediary cloud server. ArcDock communicates directly between the browser and Spotify's official servers.
2. **Tokens Storage:** OAuth tokens and Client ID are stored in the browser's `localStorage` (`arcdock_spotify_tokens`, `arcdock_spotify_client_id`).
3. **Network Isolation:** Home Assistant WebSocket runs strictly on `127.0.0.1:8123`.
