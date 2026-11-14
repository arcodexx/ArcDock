# AI Activity & Decision Log (ArcDock)

This log tracks all architectural discussions, technical decisions, completed steps, and changes made during development.

---

## Log Entry: 2026-11-15 (Entry 22)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Auxiliary Widget Live Verification, GitHub Dual-Mode Heatmap, ShipTrack Free Parcel Tracking & Per-Track Manual Sync Architecture

### 1. User Requests & Context
1. **TopBar Weather Pill Routing:** TopBar weather pill was inadvertently opening the generic widget drawer instead of the full Weather Station (`WeatherView.vue`).
2. **GitHub Data Accuracy & Rich Profile:** GitHub data pulled from the user account was inaccurate (14-day heatmap did not match github.com profile due to REST `/events` limitations); user requested accurate metrics, developer profile information, top repositories, and PRs.
3. **Free & Zero-Token Indian Domestic Courier Tracker:** Replace paid commercial APIs (17TRACK, Ship24) and all mock/simulated data with the open-source [Aswincloud/shiptrack](https://github.com/Aswincloud/shiptrack) API (`https://shiptrack.aswincloud.com`).
4. **Manual Sync Controls:** Eliminate automated background polling; provide manual `[ 🔄 ]` sync controls on every parcel card in both the main view (`StandbyWorkHub`, `FavoriteWidgetsPanel`, `WidgetCardContainer`) and full widget view (`DeliveryView`).

### 2. Architectural Changes & Implementations

1. **TopBar Direct Full-Screen View Routing:**
   - In `src/components/TopBar.vue`, updated the Weather pill click handler to emit `openFullScreen('weather')` directly, bypassing the Control Center drawer.
   - Updated the Network Latency badge to emit `openFullScreen('network')` directly to inspect multi-cloud edge latency in `NetworkView.vue`.
   - Wired `@open-full-screen="handleOpenFullScreen"` on `TopBar` inside `src/App.vue`.

2. **GitHub Precision Engine & Developer Showcase (`src/stores/github.ts` & `GitHubView.vue`):**
   - *Problem:* GitHub REST `/events` endpoint only captures public events from the last 90 days and caps at 300 events; calculating a commit calendar from `/events` produces inaccurate heatmaps that diverge from `github.com`.
   - *Resolution:* Implemented a dual-mode precision engine:
     - **GraphQL Mode (when PAT token provided):** Queries `viewer { contributionsCollection { contributionCalendar { ... } } }` for 100% exact parity with official contribution graphs.
     - **Public Scraper Mode (when unauthenticated / username only):** Queries `https://github-contributions-api.jogruber.de/v4/{username}` to extract actual historical daily counts.
   - Enhanced `GitHubView.vue`:
     - **Developer Profile Banner:** Renders user avatar, bio, follower count, and public repository statistics.
     - **Interactive 14-Day Heatmap:** Renders daily squares with day-of-week abbreviations, exact commit counts, and tooltip hovers.
     - **Top Repositories Grid:** Displays user's top/pinned repositories with language color pills, star badges, and descriptions.
     - **Active Pull Requests:** Lists open PRs with branches and review request flags.

3. **ShipTrack Integration & Dev Server Bridge (`vite.config.ts` & `src/stores/delivery.ts`):**
   - *Problem:* `https://shiptrack.aswincloud.com/api/track/...` does not return `Access-Control-Allow-Origin` CORS headers, causing browser `fetch()` requests to fail even though the HTTP 200 JSON payload arrives. Additionally, external public CORS proxies are unreliable and rate-limited.
   - *Resolution:* Created a native same-origin server middleware in `vite.config.ts`:
     - Intercepts `/api/carriers` and `/api/track/:carrier/:trackingNumber`.
     - Makes server-to-server outbound requests via Node.js `https` module to `shiptrack.aswincloud.com`.
     - Returns responses directly to the client with `Access-Control-Allow-Origin: *`.
   - *Schema Normalization:* Corrected response parser to read `data.events` (ShipTrack format: `{ date, location, description }`), `data.destination`, `data.estimatedDelivery`, and `data.status`.
   - *Zero-Mock Sanitization:* Removed all `INITIAL_DEMO_PARCELS`, dummy checkpoints, simulation buttons, and 17TRACK/Ship24 configuration modals.

4. **Race Condition & Reactivity Fixes:**
   - *In-Flight Deletion Guard:* When a user deletes a package while a carrier fetch is in progress, the resolved promise previously re-saved the package to `localStorage`. Added an ID existence guard before calling `saveParcels()`.
   - *Vue 3 Reactivity Array Mapping:* Replaced in-place object mutations with cloned array mapping (`parcels.value = parcels.value.map(...)`), ensuring immediate DOM repaints without requiring browser reloads.
   - *Live Connecting Loader State:* When querying carriers, parcel cards display an animated pulse badge and spinning `RefreshCw` icon without rendering fake checkpoints.

5. **Per-Track Manual Sync Architecture across Main Views:**
   - Added individual `[ 🔄 ]` manual sync buttons on:
     - `src/components/hub/StandbyWorkHub.vue`: Every parcel item in the Standby Hub has an independent sync button next to its status pill.
     - `src/components/FavoriteWidgetsPanel.vue`: Every parcel item in the Favorites Panel has an individual sync button with `.stop` modifier to prevent bubbling to full-screen navigation.
     - `src/components/widgets/WidgetCardContainer.vue`: Packages tab displays all shipments with dedicated sync buttons.
     - `src/components/views/DeliveryView.vue`: Each package card features a dedicated `[ 🔄 Sync ]` button alongside carrier deep-linking and deletion.

6. **Dev Credits & Acknowledgements:**
   - Added prominent credits and links to [Aswincloud/shiptrack](https://github.com/Aswincloud/shiptrack) in `README.md` and `docs/SYSTEM_SPEC.md`.

### 3. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.43s.
- Bundle size: ~330.0 kB static (~93.8 kB gzipped).
- Dev server safely shut down after user verification.

---

## Log Entry: 2026-11-14 (Entry 21)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** AC Mode Redundancy Removal & Contextual In-Widget Settings Architecture

### 1. Architectural Changes Implemented
1. **Removed Redundant 'Off' from AC Mode Dropdown:**
   - *Problem:* `ClimateCard.vue` has a dedicated Power On/Off button. Leaving `'off'` as an option inside the Mode dropdown was confusing and redundant.
   - *Resolution:* Filtered out `'off'` from `hvacModesList` in `src/components/cards/ClimateCard.vue`. The dropdown now exclusively lists active operational modes (`Auto`, `Cool`, `Dry`, `Fan Only`, `Heat`). The dedicated Power button exclusively manages On/Off state.
2. **Contextual In-Widget Settings Architecture:**
   - *Problem:* Centralizing city searches, API keys, and personal access tokens inside the main system settings cluttered the kiosk settings and broke the user mental model (requiring leaving a widget to configure it).
   - *Resolution:* Moved all widget configurations directly into their respective Full-Screen views:
     - **Weather Station (`WeatherView.vue`):** Added a `[ ⚙️ Location ]` button in the header. Tapping opens an inline drawer with Open-Meteo city search (Enter/Search trigger), GPS auto-location toggle, and live coordinate display. Selecting a city instantly reloads the weather forecast on screen in real time.
     - **GitHub Activity Hub (`GitHubView.vue`):** Added a `[ ⚙️ Account Credentials ]` button in the header for fast, in-place updates of username and personal access token with instant sync.
     - **Domestic Courier Tracker (`DeliveryView.vue`):** Added a `[ ⚙️ Carrier API ]` button in the header alongside `[ + Track Package ]` to manage live 17TRACK/Ship24 API keys in context.
3. **Pure System Infrastructure Settings Modal:**
   - *Resolution:* Completely freed up `SettingsModal.vue`. It is now strictly focused on core system infrastructure:
     1. Operational Profile (Desk vs Car Mode)
     2. Desk Mode Lock PIN
     3. Spotify Web API (PKCE authorization & redirect URI)
     4. Home Assistant Connection (Server URL, Long-Lived Token, Mock mode, Room light sync, Pinned primary entities)

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.42s.
- Bundle size: ~307.8 kB static (~87.8 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 20)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** AC Card Vertical Streamlining, Downward Dropdown Anchoring & Dedicated Full-Screen Widget Settings Page

### 1. Refinements Implemented
1. **Removed Redundant "Target Setpoint" Label:**
   - In `ClimateCard.vue`, removed the text label `<span class="text-[8px] uppercase tracking-widest font-bold text-neutral-400">Target Setpoint</span>` beneath the target temperature display. The setpoint display (`24.0 °C`) nestled directly between the `-` and `+` steppers is immediately self-understood, eliminating ~15px of unnecessary vertical height.
2. **Downward Dropdown Anchoring & Overflow Fix:**
   - *Problem:* AC Mode and Fan Speed dropdowns opened upwards (`bottom-full`), which clipped past the top panel header and went off-screen.
   - *Resolution:* Changed popover positioning to open downwards (`top-full mt-1.5`) with compact bounds (`w-36 max-h-48 overflow-y-auto no-scrollbar`), semi-transparent backdrop blur (`bg-neutral-900/95 border-white/20`), and dynamic elevated stacking (`z-40 / z-50`). In `FavoriteWidgetsPanel.vue`, updated widget container classes to `overflow-visible relative` so popovers are never clipped by parent overflow boundaries.
3. **Dedicated Full-Screen Page for Widget Settings:**
   - *Problem:* Mixing Open-Meteo city search, GPS toggle, GitHub username/token, and Domestic Parcel API keys directly in the main Settings modal cluttered the primary system configuration (Operational Profiles, PIN lock, Spotify, HA integration).
   - *Resolution:* Architected a dedicated full-screen sub-view inside `SettingsModal.vue`:
     - **Main Settings View:** Replaced the long widget scroll with a sleek, high-visibility entry banner: `[ 📑 Configure Desk Widgets → ]`.
     - **Widgets Full-Screen Page:** Displays full-width, comfortable configuration cards for Weather Station (live city search, coordinate indicators, GPS auto-location), GitHub Hub (username, token), and Domestic Courier Tracker.
     - **Intuitive Back Navigation:** Header navigation dynamically adapts with a `< Back` button returning directly to system settings.

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.43s.
- Bundle size: ~310.0 kB static (~88.2 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 19)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Dynamic Geocoding Search, Streamlined AC Dropdowns & Favorite Widgets System

### 1. Features & Architectural Improvements Implemented
1. **Dynamic Open-Meteo Geocoding Search (Zero Hardcoding):**
   - *Problem:* Hardcoding coordinates for cities (like Jodhpur) is fragile and inflexible.
   - *Resolution:* Replaced all hardcoded city dictionaries in `src/stores/weather.ts` with direct Open-Meteo Geocoding API search (`searchCities` and `selectCity`). In `SettingsModal.vue`, users type a city and press Enter or tap Search. A dropdown displays real-time matching results with city name, state/admin1, country, and precise latitude/longitude. Selecting a result saves coordinates to `localStorage['arcdock_weather_config']` and immediately re-queries weather for that exact location worldwide.
2. **Streamlined ClimateCard with Mode & Fan Dropdowns:**
   - *Problem:* Displaying all 5 HVAC mode buttons and fan speeds simultaneously on the card face caused excessive vertical and horizontal crowding on landscape mobile screens.
   - *Resolution:* Redesigned `ClimateCard.vue` into a sleek, ultra-clean card:
     - Header: Friendly name, power status, and ambient room temperature readout.
     - Center: Target temperature stepper (`-` / `+`) with large font.
     - Bottom Controls:
       - Power toggle button.
       - Mode dropdown pill (`[ ❄️ Cool ▾ ]` or `[ ✨ Auto ▾ ]`): Opens a popover menu showing all available HVAC modes with icons and checkmark indicator.
       - Fan speed dropdown pill (`[ 💨 Auto ▾ ]`): Opens a popover menu with fan speeds.
     - Includes click-outside listener to automatically dismiss popovers.
3. **Favorite Widgets System (Max 2 Widgets):**
   - *Problem:* The user requested a flexible favorite widget system (max 2 pinned widgets) instead of fixed tabs or duplicate cards. Previously, when Spotify was paused, having a Hub button on the right duplicated the GitHub/Deliveries already visible on the left.
   - *Resolution:*
     - Created `src/stores/favorites.ts` to manage pinned favorite widgets (`climate`, `lights`, `github`, `deliveries`, `weather`, `network`), persisted in `localStorage['arcdock_favorite_widgets']` (default: `['climate', 'lights']`). Enforces a strict maximum of 2 favorites with warning alert if user attempts to mark a 3rd without unmarking one first.
     - In `FullScreenView.vue`: Added a `[ ⭐ Favorite ]` button in the header so any widget opened in full-screen can be toggled as a favorite.
     - In `ControlCenterDrawer.vue`: Added a star toggle icon on every widget card and a counter indicator `Favorites: (X/2)`.
     - Created `FavoriteWidgetsPanel.vue` for the right pane: When Spotify is PLAYING, renders the up to 2 pinned favorite widgets with quick expand buttons, plus an `[ ⋯ All Widgets ]` button.
     - **Non-Duplicated Standby Split-Grid:** When Spotify is PAUSED, the left side displays the Work Hub (`StandbyWorkHub.vue` - GitHub & Deliveries) and the right side displays Smart Desk IoT controls (`DeskIoTPanel.vue`). Zero duplicate cards across both panes!

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.43s.
- Bundle size: ~308.3 kB static (~87.8 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 18)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Car Mode Data Isolation, Official GitHub Icon, Jodhpur Geocoding & Right Pane Architectural Overhaul

### 1. User Feedback Addressed & Implemented
1. **Car Mode Strict Isolation in Paused State:**
   - *Problem:* In Car Mode, when Spotify was paused, the application fell back to `StandbyWorkHub.vue`, exposing GitHub commits, activity streak, and domestic parcel trackers to passengers in the car.
   - *Resolution:* In `src/App.vue`, conditioned the left canvas with `v-if="mode === 'car' || spotify.isPlaying"`. When `mode === 'car'`, the interface strictly renders `NowPlaying.vue` and `MediaBar.vue` regardless of whether playback is active or paused. `StandbyWorkHub` is strictly restricted to Desk Mode.
2. **Right-Side Clutter & Vertical Stacking Overhaul:**
   - *Problem:* On landscape mobile screens, stacking the tabbed widget container (weather, github, parcels) directly above the quick action bar (2 bulbs + AC controls) caused severe vertical clipping, overlapping buttons, and poor AC visibility. Furthermore, weather was already visible in the top bar pill, making the right-side weather tab redundant.
   - *Resolution:* Architected a clean, spacious two-panel system on the right:
     - **Smart Desk Controls (`DeskIoTPanel.vue`):** Dedicated full-height view with AC controls (now including `auto` mode with indigo accent) and smart light/switch tiles.
     - **Developer & Logistics Hub (`DeskHubPanel.vue`):** Dedicated view with GitHub activity (streak, commits, PR badge, 14-day ribbon) and domestic courier parcel tracker with milestone progress bars.
     - **Seamless 2-Way Switching:** Header button `[ 🐙 Hub ]` switches to the hub, and `[ 📚 Smart Desk ]` returns to desk controls. Redundant weather widgets were removed from the right pane.
3. **Official GitHub Mark:**
   - *Problem:* GitHub was previously represented by a flame icon (`Flame`).
   - *Resolution:* Replaced all instances of `Flame` with the official GitHub mark (`Github` from `lucide-vue-next`) across `TopBar.vue`, `SettingsModal.vue`, `ControlCenterDrawer.vue`, `GitHubView.vue`, `StandbyWorkHub.vue`, `DeskIoTPanel.vue`, and `DeskHubPanel.vue`.
4. **Weather Geocoding & Jodhpur Coordinate Resolution:**
   - *Problem:* Selecting "Jodhpur" returned inaccurate temperatures because the Open-Meteo weather API requires latitude and longitude coordinates. The store was previously retaining default coordinates (New Delhi / IP GPS) when saving city names.
   - *Resolution:* Added built-in coordinate mapping for Indian tech hubs and major cities in `src/stores/weather.ts` (including Jodhpur: `lat: 26.2868, lon: 73.0300`), along with an Open-Meteo geocoding search fallback. Saving a city now automatically disables GPS overriding (`useGeo = false`) and queries the exact city coordinates.
5. **Car Mode Security PIN Lock:**
   - *Problem:* When switching back to Desk Mode, personal controls and settings must be protected by a PIN lock.
   - *Resolution:* Added a 4-digit PIN unlock dialog (`z-[100]`) in `TopBar.vue` with numeric touch keypad, shake animation on error, and configurable PIN stored in `localStorage['arcdock_desk_pin']` (default: `0000`) managed via `SettingsModal.vue`.

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.42s.
- Bundle size: ~292.5 kB static (~84.6 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 17)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Ergonomic Screen Optimization, Dual-Direction Navigation & Car Mode Kiosk Lock

### 1. Issues Diagnosed & Solutions Implemented
1. **Vertical Clutter & Controls Overflowing Screen in Playing Mode:**
   - *Problem:* In phone landscape viewports (~360px physical height), stacking two separate boxes (`WidgetCardContainer` + `QuickActionBar`) each with their own headers, margins, and 54px buttons pushed the quick controls off the bottom edge. Furthermore, the tab bar in `WidgetCardContainer` overflowed horizontally in narrow split panes.
   - *Resolution:* Consolidated the header: moved the `[ 💡 Lights ]` grid toggle directly into the tab bar of `WidgetCardContainer.vue`, eliminating the redundant "Desk Overview" top row. Designed `QuickActionBar.vue` as a sleek, single-line strip (`h-10`) with compact buttons and inline AC stepper. This saved ~50px of vertical space, ensuring 100% of controls stay safely on screen with zero clipping.
2. **Two-Way Navigation Between Widgets & Lights Grid:**
   - *Problem:* When in Playing mode, clicking "Lights" switched the right pane to `DeskIoTPanel.vue`, but there was no way to return to the widget overview.
   - *Resolution:* Added `showWidgetsToggle` prop and emit to `DeskIoTPanel.vue`. When active, a prominent `[ 📑 Widgets ]` pill appears on the left of the header, allowing users to toggle back and forth effortlessly.
3. **Redundant Controls in Paused Standby State:**
   - *Problem:* When Spotify was paused, the top `MediaBar` remained visible on the left pane while `StandbyWorkHub.vue` was rendered below it, resulting in duplicate headers and redundant controls.
   - *Resolution:* Conditioned `MediaBar.vue` to render **only when `spotify.isPlaying` is true**. When paused, `StandbyWorkHub` expands to occupy the full left column without clutter. When playback resumes, `MediaBar` seamlessly returns.
4. **Climate AC "Auto" Mode Missing:**
   - *Problem:* `ClimateCard.vue` supported `off`, `cool`, `dry`, and `fan_only`, but lacked `auto` HVAC mode.
   - *Resolution:* Added `'auto'` mode support with dedicated `Sparkles` icon, indigo glowing badge, and updated `homeAssistant.ts` mock/service callers.
5. **Car Mode Privacy Kiosk & PIN Security Lock:**
   - *Problem:* In Car Mode, the dock should act as a pure automotive remote without exposing personal data (smart home, GitHub streaks, deliveries, system settings). Exiting Car Mode should be protected so passengers/valets cannot access personal controls.
   - *Resolution:*
     - Completely removed the `Settings` button, `Weather` pill, `Network` ping badge, and `ControlCenter` swipe/grab handles in Car Mode (`mode === 'car'`).
     - Added a secure **4-digit PIN Unlock Keypad** dialog (`z-[100]`) when attempting to switch from Car Mode back to Desk Mode.
     - Added PIN configuration in `SettingsModal.vue` (`arcdock_desk_pin`, default: `0000`).

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.43s.
- Bundle size: ~295.6 kB static (~84.8 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 16)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 4 — Intermediate Polish & Advanced Desk Hub Implementation

### 1. Key Milestones Completed
1. **Step 4.1: Smart Room Immersion & SmartThings Climate AC Integration:**
   - Implemented `useRoomSync.ts` composable bridging ColorThief dominant RGB palette extraction directly to Home Assistant light entities.
   - Enforced the strict **"Only If ON" safety rule**: ArcDock checks whether target lights (`light.wiz_desk_lamp`, `light.gohigh_light_bars`, `light.ambient_strip`) are currently `on`; if off, color dispatch is skipped to avoid turning room lights on unexpectedly.
   - Built `src/components/cards/ClimateCard.vue` with 44px thumb-friendly target buttons, 0.5°C step increments, HVAC mode pills (`Cool`, `Dry`, `Fan`, `Heat`, `Off`), fan speed selector (`Auto`, `Low`, `Medium`, `High`), and current room temperature readout.
   - Added mock and live WebSocket service callers for `set_temperature`, `set_hvac_mode`, and `set_fan_mode`.
2. **Step 4.2: Top-Down Desk Control Center Drawer & Full-Screen Expansion Pattern:**
   - Built `src/components/ControlCenterDrawer.vue` featuring a 6-card glanceable launcher grid (`Weather`, `GitHub`, `Deliveries`, `Smart AC`, `Lights`, `Network Monitor`).
   - Added pull-down touch gesture and discreet `━` grab pill on `TopBar.vue`.
   - Built reusable `src/components/FullScreenView.vue` (`fixed inset-0 w-screen h-screen bg-black z-[100]`) with back chevron and close controls.
3. **Step 4.3: Dynamic Dual-State Layout Controller:**
   - **Playing State (`is_playing === true`):** Left side renders full Spotify Glass Remote; right side renders `WidgetCardContainer.vue` (~65% height) + `QuickActionBar.vue` (~35% height) with quick toggles for Desk Lamp, Screen Bar, AC pill with inline step, and All-Off. Includes instant toggle to classic All-Lights grid.
   - **Paused Standby Hub (`is_playing === false`):** Left side transforms into `StandbyWorkHub.vue` featuring GitHub streak ribbon, PR review requests, and active parcel milestone tracker, with a persistent bottom-pinned `[ ▶ Resume: {Track} ]` pill. Right side expands to full room console `DeskIoTPanel.vue`.
4. **Step 4.4: Desk Widgets & API Stores:**
   - **Weather:** `src/stores/weather.ts` & `WeatherView.vue` using Open-Meteo REST API (HTML5 Geolocation + fallback city, 30-min cache, WMO weather interpretation, 24h hourly curve & 7-day forecast).
   - **Network Ping:** `src/stores/network.ts` & `NetworkView.vue` with 10s DNS ping probe and real-time status sparkline.
   - **GitHub Activity Hub:** `src/stores/github.ts` & `GitHubView.vue` tracking 14-day contribution heatmap, streak count, today's commits, and open review-requested PRs list.
   - **Indian Parcel Tracker:** `src/stores/delivery.ts` & `DeliveryView.vue` with multi-carrier tracking (*Delhivery, Blue Dart, DTDC, India Post, Ekart, Xpressbees, Shadowfax*), 3-stage visual progress milestone bar, checkpoint scan history, and custom shipment tracking modal.
5. **Step 4.5: Entity Favorites & PWA Manifest:**
   - Added "Pinned Desk Entities" multi-select in `SettingsModal.vue` to customize primary grid cards.
   - Created `public/manifest.json` and meta link tags in `index.html` for clean fullscreen landscape PWA execution.

### 2. Verification & Build
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.28s.
- Bundle size: ~289.7 kB static (~83.5 kB gzipped).

---

## Log Entry: 2026-11-14 (Entry 15)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 4 UI Architecture & Desk Control Center Specification

### 1. Architectural Decisions & UI Ergonomics Analysis
1. **Dynamic Playing vs Paused Standby Work Hub:**
   - *Problem Identified:* Having static light switch cards permanently occupying 50% of the screen while music is playing is a massive waste of AMOLED pixels (lights/AC are set once and rarely changed). Conversely, when music is paused, leaving the left pane as an idle player or giant clock wastes valuable screen estate.
   - *Resolution:* Implemented a context-aware Dual-State Canvas:
     - **Active Playing State (`is_playing === true`):** Left side is full Spotify Glass Remote; Right side is an uncluttered 2-row layout: Top ~65% is a tabbed/swipeable dynamic widget card (`Weather`, `GitHub`, `Deliveries`), Bottom ~35% is a 1-tap quick action row for Desk Light and AC.
     - **Paused Work Hub State (`is_playing === false`):** Left side transforms into the Developer & Logistics Work Hub (GitHub daily streak + PR reviews list, active parcel tracking bar); Right side expands into the full Room & Climate Command console (large AC controls, lighting, scenes); Bottom pinned bar displays clock + 1-tap music resumption pill (`▶ Resume`).
2. **Top-to-Down "Desk Control Center" Drawer & Full-Screen Views:**
   - *Problem Identified:* Phone landscape viewport is physically ~360–390 CSS pixels tall. Cramming 4–6 separate cards into the view causes microscopic typography and poor touch ergonomics.
   - *Resolution:* Created a top-down swipe drawer (accessible via pull-down gesture or top-bar handle pill `━`) housing a 6-card glanceable launcher. Tapping any card expands into a dedicated, unconstrained full-screen view (`fixed inset-0 w-screen h-screen bg-black z-[100]`), allowing detailed interactions (reading full PR titles, complete delivery checkpoints, 7-day hourly forecasts) with zero vertical cramping.
3. **Approved Feature Specifications:**
   - **Dynamic Album Art Room-Sync:** WiZ Bulbs & GoHigh light bars sync to ColorThief RGB palette. *Strict Inviolable Rule:* Sync is gated by checking if target lights are **already ON** (if lights are off during the day, do nothing).
   - **SmartThings Climate/AC Card (`ClimateCard.vue`):** Dedicated touch card with current temp, target setpoint, large 44px thumb `+` / `−` buttons, mode pills (`Cool`, `Fan`, `Off`), and fan speed selector.
   - **Desk Weather Station:** Open-Meteo REST API (zero API key, 30-min cache). Header pill + full-screen hourly/weekly curve.
   - **Network Latency Sparkline (`PingMonitor.vue`):** Real-time ping indicator to `1.1.1.1` (10s interval, health badge, spike alert >120ms).
   - **GitHub Activity Hub:** Daily contribution streak + today's commit count + PR review requests list.
   - **Indian Parcel Tracker:** Custom tracking ID input + Indian courier selector (*Delhivery, Blue Dart, DTDC, India Post, Ekart, Xpressbees, Shadowfax*) with 3-stage visual progress milestone bar.

### 2. Documentation Updates
- Updated `docs/SYSTEM_SPEC.md` with master technical specification for Subsystem 5 (Desk Control Center, dual-state canvas, full-screen pattern, and widget API specs).
- Updated `docs/IMPLEMENTATION_PLAN.md` with granular Step 4.1 through 4.5 task lists.

---

## Log Entry: 2026-11-14 (Entry 14)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** On-Device Proof of Concept (POC) Verification & Xiaomi Unlock Timer Initiation

### 1. Key Milestones Completed
1. **Xiaomi Bootloader Authorization Initiated:**
   - Account successfully verified with Xiaomi security servers.
   - Bound device IMEI to user's Mi Account and activated the mandatory 168-hour (7-day) server countdown (`code: 20036`).
   - Verified that SIM card can safely be removed while timer counts down on Xiaomi cloud servers.
2. **On-Device Home Assistant Core Runtime Proved:**
   - Deployed Ubuntu 24.04 ARM64 container inside Termux PRoot on the Redmi Note 10 Pro (`sweet`).
   - Configured Python 3 virtual environment and installed Home Assistant Core.
   - Solved C++ wheel compilation for voice/pipeline helpers (`g++`, `pymicro-vad`, `pyspeex-noise`).
   - Configured UFS 2.2 flash storage longevity rules (`recorder` commit interval 30s, purge 3 days).
   - Resolved MIUI Wi-Fi power-saving packet drops by establishing unbreakable `adb forward` USB tunneling on ports `8022` (SSH) and `8123` (HA HTTP/WebSocket).
3. **Hardware End-to-End Test:**
   - Connected real smart home hardware (smart bulb) and verified instantaneous on/off toggles via the on-device Home Assistant server.
   - Verified SmartThings cloud webhook requirement (`default_config`).

### 2. Next Steps While Timer Counts Down
- Frontend enhancements: Build a dedicated touch-friendly `ClimateCard.vue` for AC control, and an entity favorites picker in `SettingsModal.vue`.
- In 7 days: Finalize bootloader unlock via `miunlock` and flash official LineageOS 21.

---

## Log Entry: 2026-11-13 (Entry 13)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 3 Architecture Review & On-Device Deployment Strategy

### 1. Architectural Review & Ecosystem Research
1. **postmarketOS Rebranding to Nura & Hardware Status on `xiaomi-sweet`:**
   - Researched ecosystem updates: postmarketOS officially rebranded to **Nura** (`nura.eco`) in late September 2026.
   - For the Redmi Note 10 Pro (`xiaomi-sweet`, Snapdragon 732G / SM7150), device support is classified under the **Community** tier.
   - Identified key mainline kernel limitations: while screen, GPU acceleration (`freedreno`), and Wi-Fi function, **battery reporting and charging control are marked as Partial** due to hardware PMIC variations across batches (LN8000 vs. TI BQ chips). Fast charging does not work on mainline Linux, and standard sysfs nodes like `charging_enabled` require manual device-tree verification.
2. **Analysis of On-Device Home Assistant (The Alexander Hale Nexus 7 Precedent):**
   - Analyzed the community reference project [`alexanderhale/home-assistant`](https://github.com/alexanderhale/home-assistant) running Home Assistant Core on a 2013 Google Nexus 7 (Snapdragon S4 Pro, 2 GB RAM).
   - Confirmed that running Home Assistant directly on the phone is a proven, reliable architecture.
   - Evaluated hardware performance on the Redmi Note 10 Pro: with an 8-core Snapdragon 732G, 6–8 GB LPDDR4X RAM, and UFS 2.2 storage, the device will easily handle Home Assistant Core (~350–500 MB RAM) alongside the ArcDock UI (~180 MB) with over 4 GB of RAM headroom.
3. **Multi-Tiered Deployment Strategy Established:**
   - **Primary Path (Recommended):** **LineageOS 20/21 + Termux PRoot (Ubuntu 24.04 ARM64)**.
     - *Why:* Delivers 100% factory hardware reliability, native 120Hz Super AMOLED hardware acceleration, stable battery/thermal management, and zero risk of bricking.
     - *Mitigations Documented:*
       - Android 12+ Phantom Process Killer: Disabled via Developer Options (`Disable child process restrictions`) + `termux-wake-lock`.
       - Native Python compilation errors: Avoided by using Ubuntu PRoot with pre-compiled ARM64 system packages (`python3-cryptography`, `python3-cffi`, `python3-bcrypt`).
       - Flash storage wear: Tuned `recorder` in `configuration.yaml` (`commit_interval: 30`, exclude noisy `media_player` domain).
       - Battery preservation: LineageOS native 80% charging limit or ACC root daemon (60%–70% hysteresis).
   - **Secondary Path (Power-User):** **Nura + Cage Wayland Kiosk + Docker**. Retained as an alternative for pure Linux enthusiasts.

### 2. Documentation Updates
- Updated `docs/SYSTEM_SPEC.md` to reflect the multi-tiered platform architecture, on-device Termux PRoot execution model, and flash storage longevity protections.
- Updated `docs/IMPLEMENTATION_PLAN.md` with explicit Step 3.1–3.4 milestones for LineageOS + Termux PRoot deployment.
- Updated `README.md` to reflect the refined hardware-agnostic deployment tiers.
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Teleport Z-Index Isolation & Collapsed Edge Buffer

### 1. Issues Diagnosed & Resolved
1. **Middle Dragger Line Overlapping Confirmation Popup:**
   - *Problem:* The mode switch confirmation modal was rendered inside `TopBar.vue`, which is affected by `<main>`'s transform/stacking context. As a result, `SplitPane.vue`'s divider line (`z-20`) was rendering on top of the modal backdrop.
   - *Resolution:* Teleported the confirmation modal directly to `document.body` (`<Teleport to="body">`) with `z-[100]`. This breaks it out of all sub-component stacking contexts, guaranteeing the modal backdrop and dialog sit strictly above every element on the screen.
2. **Buffer Gap Between Collapsed Reopen Tab & Spotify Controls:**
   - *Problem:* When Smart Desk was collapsed, the left pane filled 100% width, causing Spotify skip and media controls to press directly against the edge reopen tab.
   - *Resolution:* Added conditional right padding (`pr-8 sm:pr-10`) to the left pane in `SplitPane.vue` when collapsed. This guarantees a clean 32px–40px buffer of empty space between Spotify controls and the reopen button.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.22s.
- Bundle size: ~204 kB static (~64.7 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 11)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Full-Screen Settings, 100% Opaque Dialogs & Minimalist Reopen Tab

### 1. Issues Diagnosed & Resolved
1. **100% Solid Opaque Mode Switch Backdrop:**
   - *Problem:* The mode confirmation modal used a semi-transparent `bg-black/85` backdrop, allowing background gradients and track text to visually bleed through.
   - *Resolution:* Replaced with a 100% solid, pitch-black backdrop (`bg-black`) with zero transparency. The dialog card is cleanly isolated with solid `bg-neutral-900 border border-white/20`.
2. **Settings Promoted to Full-Screen View:**
   - *Problem:* Settings previously opened inside a constrained floating modal card, feeling cramped on small landscape mobile displays.
   - *Resolution:* Converted `SettingsModal.vue` into a full-screen view (`fixed inset-0 w-screen h-screen bg-black`). Features a native mobile top bar (Back arrow, title, Close button) and a spacious, scrollable center container.
3. **Minimalist Reopen / Expand Tab:**
   - *Problem:* When collapsed, the tab on the right edge had vertical text, multiple icons, and wide padding that consumed excessive screen real estate.
   - *Resolution:* Replaced with an ultra-slim 20px tab (`w-5 h-12`) with a single subtle chevron (`<ChevronLeft class="w-3.5 h-3.5" />`). Flush against the right screen edge with zero clutter.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.17s.
- Bundle size: ~200 kB static (~63.3 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 10)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Solid Mobile Slider & Plain Language Simplification

### 1. Issues Diagnosed & Resolved
1. **Redundant "Smart Desk" Label Removed:**
   - As Spotify on the left carries no banner title, the "Smart Desk" text on the right panel was superfluous and consumed valuable header space.
   - Removed the title completely, keeping only the discreet `Mock Mode` / `Live` status badge on the left and the compact icon toolset on the right (`Scenes`, `All-Off`, `Collapse`).
2. **Solid Opaque Brightness Control (Zero Transparency & Mobile-Friendly):**
   - *Problem:* In-card brightness overlay had translucency and was squeezed inside a tiny 92px x 120px square tile, making it feel cramped and difficult for thumbs to slide.
   - *Resolution:* Converted the brightness control to a solid, thumb-friendly modal dialog with 100% opaque `#171717` (`bg-neutral-900`) backing (zero bleed-through).
   - Features a generous 44px-tall (`h-11`) touch slider track, large percentage readout, one-tap preset chips (`25%`, `50%`, `75%`, `100%`), and instant `✓` Done dismissal.
3. **Plain English Mode Switch Prompt (No Technical Jargon):**
   - *Problem:* Modal displayed overly technical details about container suspension, RAM reclamation, and disk writes.
   - *Resolution:* Simplified into clear, friendly language:
     - *Car Mode:* "Smart home controls will be turned off to keep the focus on music and driving."
     - *Desk Mode:* "Turn on your desk lights and smart home controls."

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.15s.
- Bundle size: ~200 kB static (~63.2 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 9)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Phone Landscape Scale & Micro-Viewport Optimization

### 1. Issues Diagnosed & Resolved
1. **Brightness Trigger Overflow & Double-Percentage Removed:**
   - *Problem:* In `LightCard.vue`, the top-right button displayed an icon plus text (e.g. `80%`), while the bottom subtitle simultaneously repeated `Active • 80%`. On narrow 2-column mobile cards, the button overflowed the card boundaries.
   - *Resolution:* Removed text from the top-right button: it is now a clean icon-only button (`SunMedium`). Below, the entity subtitle prints the percentage once (`80%` or `Off`) without redundant "Active" labels.
2. **Scenes Dropdown Overflow Fixed:**
   - *Problem:* The scenes dropdown button displayed full scene names (`Relax & Warm`), consuming ~120px in a ~280px mobile header and causing severe text clipping and horizontal overflow.
   - *Resolution:* Converted the trigger into an ultra-compact icon-only button with a spark icon (`Sparkles`) and subtle chevron (`~30px` total width). Full scene names are rendered inside the animated dropdown menu.
3. **Turn All Off Button Made Icon-Only:**
   - Removed the "All Off" text label. The button is now a high-visibility, compact rose icon button (`Power`, `~28px`), fitting comfortably in the header.
4. **Header Visibility & "Smart Desk [Mock]" Room Reclaimed:**
   - By trimming right-side header controls (Scenes, All-Off, Collapse) from `~220px` down to `~96px`, the left-side title "Smart Desk" and `[Mock]` badge now have `~180px+` of clear space, ensuring zero clipping on phone viewports.
5. **Ergonomic Landscape Phone Scaling for Player & Controls:**
   - In `NowPlaying.vue`, capped album art to `140px–200px` on phone viewports (down from 280px) and scaled typography, control button sizes (`w-12 h-12`), and vertical gaps (`gap-2 sm:gap-4`) so the entire player fits naturally inside the ~360px vertical height without scrollbars.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.14s.
- Bundle size: ~200 kB static (~63.3 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 8)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Spatial Partitioning, Confirmation Guard & UI Alignment

### 1. Issues Diagnosed & Resolved
1. **Dedicated "Turn All Off" Button Placed Outside Dropdown:**
   - Moved `Turn All Off` out of the scenes dropdown into a standalone high-visibility button in `DeskIoTPanel.vue`'s header (`Power` icon with rose accent). Provides instant 1-tap emergency/exit shutoff without opening menus.
2. **Icon-Only Mode Button with Confirmation Guard:**
   - Replaced verbose "Desk Mode / Car Mode" text in `TopBar.vue` with a compact, high-contrast icon button (`Armchair` for Desk, `Car` for Car).
   - Added an intentional confirmation dialog (`Switch to Car Mode?` / `Switch to Desk Mode?`) prior to toggling profiles. Prevents accidental server suspension (`docker stop homeassistant`) or unexpected RAM allocations during phone handling.
3. **Spatial Scoping of Spotify Controls (Fixing TopBar Bleed):**
   - *Problem:* Spotify controls (Search, Playlists, Queue, Target Device, Sync) were placed in the global TopBar, visually spanning above the Smart Desk IoT panel in Desk Mode.
   - *Resolution:* Extracted these controls into `MediaBar.vue`, placed strictly within the left `#left` slot of `SplitPane.vue`.
   - Result: All Spotify controls are permanently bounded inside the media column, dynamically adapting to splitter adjustments, and will never appear above the Smart Desk panel.
   - Slimmed the global `TopBar` down to `h-12` containing only system essentials: Mode icon button, Clock, and Settings gear.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.14s.
- Bundle size: ~201 kB static (~63.6 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 7)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Mobile Screen UX Optimization & Feedback Resolution

### 1. Issues Diagnosed & Resolved
1. **Dragger / Collapse Superimposition Fixed:**
   - *Problem:* A collapse button was centered directly on top of the divider bar in `SplitPane.vue`, causing touch conflicts and accidental collapse while dragging to resize.
   - *Resolution:* Removed the overlapping button from the drag track. The divider now features a clean, dedicated 16px touch strip with a tactile grip indicator and double-tap toggle. Collapse is cleanly initiated via the panel header button, eliminating any visual or touch overlap.
2. **Duplicate On/Off Buttons Eliminated:**
   - *Problem:* Cards had two clickable toggle points (a clickable icon on the left AND a switch button on the right).
   - *Resolution:* Removed the redundant toggle switches. The entire square tile acts as a unified, intuitive touch target.
3. **Square Card Style with In-Place Brightness Control:**
   - *Design:* Transformed `LightCard.vue` into a sleek square tile. Tapping toggles on/off. When on, a compact brightness pill (e.g. `80%`) appears.
   - *On-Demand Brightness Overlay:* Tapping the brightness badge opens an in-card overlay directly covering the tile with a thick, finger-friendly touch slider and quick presets (`25%`, `50%`, `75%`, `100%`) with instant `✓` Done dismissal.
   - Applied matching square tile styling to `SwitchCard.vue`.
4. **Quick Scenes Dropdown (Vertical Space Conservation):**
   - *Problem:* 4-button scene row consumed precious vertical height on the phone's ~360–400px landscape viewport.
   - *Resolution:* Converted Quick Scenes into a sleek dropdown selector in `DeskIoTPanel.vue`'s header (`⚡ Focus`, `☕ Relax & Warm`, `🌙 Night Mode`, `🛑 Turn All Off`), reclaiming ~70px of vertical space for the device grid.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.23s.
- Bundle size: ~198 kB static (~62.6 kB gzipped).

---

## Log Entry: 2026-11-13 (Entry 6)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 2 — Local Home Assistant Integration & Split-Grid UX

### 1. Architectural Decisions & Discussions
1. **Hybrid Split-Grid with Resizing & Collapse:**
   - In **Desk Mode**, the landscape screen splits into a dual command center: Spotify Media Remote on the left and Smart Desk IoT Panel on the right.
   - Built a touch-friendly draggable splitter (`SplitPane.vue`) allowing dynamic ratio resizing (35%–72%) with ratio persistence in `localStorage`.
   - Single-tap collapse via chevron or double-tap on the divider completely collapses the IoT pane to 0% width. A sleek floating edge tab (`Desk IoT 💡`) allows instant 1-tap expansion.
   - In **Car Mode**, the IoT panel is suspended/collapsed, and Spotify takes 100% full-screen width with glanceable controls.
2. **Zero-Host Impact & Safe Mock Engine:**
   - Designed `useHomeAssistantStore` with a built-in Mock Provider enabled by default.
   - Pre-loaded with realistic desk devices (`light.desk_lamp`, `light.screen_bar`, `light.ambient_strip`, `switch.desk_fan`, `scene.focus`, `scene.relax`, `scene.night`).
   - All brightness dragging, state toggling, and scene activations execute reactively with 0ms latency without installing any host daemons, homebrew packages, or background services on the developer's workstation.
   - Live WebSocket mode remains available via `home-assistant-js-websocket` (`createLongLivedTokenAuth`) when connecting to a remote or local instance.
3. **Deployment Artifacts for PostmarketOS:**
   - Created `docker/docker-compose.yml` defining Home Assistant Core container for the target phone.
   - Created `scripts/ha-lifecycle.sh` managing container startup in Desk Mode and suspension in Car Mode (~1GB RAM reclaimed).

### 2. Implementation Completed
- `src/types/homeAssistant.ts`: Typed entities, entity attributes, scenes, and connection statuses.
- `src/stores/homeAssistant.ts`: Pinia store with Mock Engine, live WebSocket client, service calls (`light.toggle`, `light.turn_on`, `switch.toggle`, `scene.turn_on`), and connection state management.
- `src/components/cards/LightCard.vue`: Card with on/off switch, warm light status, and fluid touch brightness slider (0%–100%).
- `src/components/cards/SwitchCard.vue`: Card with on/off switch and animated fan/power icon.
- `src/components/cards/ScenePill.vue`: Compact scene triggers with active status glow.
- `src/components/DeskIoTPanel.vue`: Scrollable desk command surface with scenes, lights, and appliances.
- `src/components/SplitPane.vue`: High-performance touch-resizable and collapsible split container.
- `src/components/SettingsModal.vue`: Added Home Assistant configuration panel (Mock Mode toggle, URL, Token, status badge).
- `src/App.vue`: Integrated `SplitPane` wrapping `NowPlaying` and `DeskIoTPanel`.
- `src/components/NowPlaying.vue`: Responsive spacing and control scaling for varying split-pane widths.

### 3. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.10s.
- Bundle size: ~198 kB uncompressed (~62.6 kB gzipped).
- Zero system dependencies or modifications installed on host machine.

---

## Log Entry: 2026-11-13 (Entry 5)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 1 — Code Review Refinement & Hardware Optimization

### 1. Code Review Implementations Completed
Following the external Phase 1 code review report, implemented the high-impact (Tier 1 & Tier 2) optimizations:
1. **GPU Compositor Optimization ([OPT-05]):** Replaced `backdrop-brightness-50` with clean solid `bg-black/85` across all drawers (`DeviceDrawer`, `PlaylistDrawer`, `QueueDrawer`, `SearchDrawer`, `SettingsModal`) to protect the target Adreno 618 mobile GPU from expensive readback passes and maintain a locked 120Hz refresh rate.
2. **Progress Bar Wall-Clock Sync ([OPT-03]):** Refactored local ticker in `src/stores/spotify.ts` to compute progress delta against `Date.now() - lastProgressTickTime`. Eliminates timer drift across long tracks.
3. **Comprehensive Optimistic Lock ([OPT-04]):** Extended `optimisticLockUntil` in `fetchPlayback` to preserve user-initiated `shuffle_state`, `repeat_state`, and optimistic progress alongside `is_playing`, preventing temporary CDN cache overwrites.
4. **Fast-Fail on 403 Playlists ([OPT-01]):** In `src/services/spotifyApi.ts`, immediate abort on `403 Forbidden` in `getPlaylistTracks` eliminates 2 redundant fallback requests (saving 2–3 seconds of latency).
5. **Color Extraction Palette Cache ([OPT-02]):** In `src/utils/colorExtractor.ts`, added a 30-item memory cache (`Map<string, DominantColors>`) and release `img.src = ''` after load to prevent redundant analysis and memory retention.
6. **Minute-Synchronized Clocks ([OPT-06]):** Synced digital clocks in `TopBar.vue` and `OledScreensaver.vue` to the next minute boundary and tick every 60,000ms instead of every 1000ms, reducing idle CPU wakeups by 60x.
7. **DRY Shared Utils ([AP-02, AP-03]):**
   - Extracted `formatDuration` to `src/utils/formatters.ts` and reused across `NowPlaying`, `QueueDrawer`, `PlaylistDrawer`, and `SearchDrawer`.
   - Extracted `getDeviceIcon` to `src/utils/deviceIcons.ts` and reused across `TopBar` and `DeviceDrawer`.
8. **Hardened Error Handling & Security ([SEC-02, SEC-07, DEAD-04]):**
   - Wrapped `navigator.clipboard.writeText` in `try/catch` in `SettingsModal.vue`.
   - Increased OAuth PKCE `state` parameter length from 16 to 32 characters in `src/services/pkce.ts`.
   - Fixed stale polling interval documentation comment in `src/stores/spotify.ts`.

### 2. Verification
- `npm run build` (`vue-tsc && vite build`) passed with 0 errors in 1.01s.
- Bundle size: ~158kB.
- Git status: uninitialized (no `.git` directory exists).

---

## Log Entry: 2026-11-13 (Entry 4)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 1 — Spotify Glass Remote Stabilization & Completion

### 1. Key Bugs Diagnosed & Resolved
1. **Empty `200 OK` Response Parse Failure:**
   - *Symptom:* Liking a song or tapping Play/Pause triggered an action on Spotify, but ArcDock immediately blinked back to the old button state (`+` instead of `✓`, or play instead of pause) and displayed `SyntaxError: Unexpected end of JSON input`.
   - *Root Cause:* Spotify endpoints (`PUT /v1/me/library`, `PUT /v1/me/player/play`, `PUT /v1/me/player/pause`) return HTTP `200 OK` with a 0-byte body. Blindly executing `response.json()` threw a syntax error, causing the action handler to treat the success as an error, revert optimistic state, and trigger error toasts.
   - *Fix:* In `src/services/spotifyApi.ts`, switched to reading `const text = await response.text()`. If `!text.trim()`, safely returns `null` without throwing.
2. **Spotify API 2024–2025 Endpoint Deprecations:**
   - *Legacy Library Endpoints Deprecated:* `GET /v1/me/tracks/contains`, `PUT /v1/me/tracks`, and `DELETE /v1/me/tracks` were killed by Spotify and return `403 Forbidden`.
   - *Migration to Unified Library API:* Migrated to `GET /v1/me/library/contains?uris=spotify:track:...`, `PUT /v1/me/library?uris=spotify:track:...`, and `DELETE /v1/me/library?uris=spotify:track:...`.
   - *Search Limit Cap:* Spotify restricts `limit` in `/v1/search` to a maximum of `10`. Any value > 10 throws `400 Bad Request`. Enforced `Math.min(10, ...)` clamp.
   - *Third-Party Playlist Protection:* Spotify restricts third-party apps in Development Mode from reading individual track items of curated/external playlists (`403 Forbidden`). Implemented friendly fallback card explaining the restriction with an instant "Play All" button. User playlists are parsed accurately via regex `/playlists\/([a-zA-Z0-9]+)/`.
3. **Modern Spotify UI Alignment (+ / ✓):**
   - Replaced legacy Heart icon with Spotify's modern library toggle: subtle circular border with `+` (Plus) when not saved, solid Spotify-green circle with bold `✓` (Check/Tick) when saved.
4. **Queue Display Duplication Artifacts:**
   - *Symptom:* Spotify's `GET /me/player/queue` response appends repeated loop instances of the currently playing track and playlist items.
   - *Fix:* Added `seenIds` deduplication in `src/stores/spotify.ts` and filtered trailing loop repeats matching the currently playing track ID.
5. **Button Double-Click & State Reversion (Polling Race):**
   - Implemented a 2.5s–3s optimistic lock (`optimisticLockUntil`) so background polling does not overwrite recently tapped state with stale Spotify CDN cache.
   - Relaxed polling to 4s (playing), 6s (paused), and 10s (idle) with a dedicated top-bar manual sync button.
6. **Drawer Backdrop Click Freeze:**
   - Replaced independent boolean flags with a mutually exclusive `activeDrawer` state machine, added backdrop `@click.self="emit('close')"` and `Escape` key dismissals, and protected against null `playlist.owner.display_name`.

### 2. Architectural Verification
- Architecture remains strictly a **Glass Remote** (controls external devices via Spotify Connect; zero audio decoding overhead on the dock phone).
- Production build verified: `npm run build` (`vue-tsc && vite build`) executes in ~1.01s with 0 errors. Static bundle size: ~158kB.
- Phase 1 officially signed off as complete and fully functional.

### 3. Next Actions (Phase 2 Resumption)
- Proceed to **Phase 2: Local Home Assistant Integration (Desk Mode)**.
  - Step 2.1: Local HA Docker compose configuration & lifecycle controller (`docker start` / `docker stop` on mode change).
  - Step 2.2: Home Assistant WebSocket client integration (`useHomeAssistant` store).
  - Step 2.3: Desk Mode Smart Lights & IoT control surface.

---

## Log Entry: 2026-11-13 (Entry 3)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Phase 1 — Project Scaffolding & Glass Remote Implementation

### 1. Framework Evaluation
* User inquired regarding **Nuxt 3 vs Alternatives**.
* Decided to stick with **Option A: Vite + Vue 3 SPA (Pinia, Tailwind CSS, TypeScript)**.
* Rationale: Nuxt 3 runs a persistent Node/Nitro SSR server consuming 80–150 MB extra RAM with GC pauses, which is counter-productive on an embedded kiosk with no SEO/multi-page requirements. Pure Vite SPA produces a ~130 kB static client bundle with zero backend RAM footprint.

### 2. Implementation Completed
* **Scaffolding:** Configured Vite (`host: 127.0.0.1`, `port: 3000`), Vue 3, TypeScript, Pinia, Tailwind CSS. Locked landscape viewport (`100vw x 100vh`, `overflow: hidden`, touch-friendly layout).
* **Spotify PKCE Subsystem:** Built Web Crypto API PKCE generator (`code_verifier`, SHA-256 `code_challenge`), auth code exchanger, and silent auto-refresher.
* **Spotify Remote Engine:** Built Pinia store with adaptive polling (1.5s active, 4s paused, 8s idle, 429 rate limit backoff) and optimistic UI updates.
* **Dynamic Palette Extraction:** Integrated `colorthief` with hardware-accelerated CSS radial gradients on `#app` background.
* **Extended Remote Drawers:** Built `DeviceDrawer` (Spotify Connect target handover), `PlaylistDrawer` (one-tap playlist playback), and `QueueDrawer` (upcoming tracks).
* **AMOLED Protection:** Implemented 5-minute idle true-black `#000000` screensaver clock + periodic 1–2px micro pixel shifting.
* **Verification:** Production build verified with `npm run build` (`vue-tsc && vite build`) passing cleanly in 929ms.

---

## Log Entry: 2026-11-13 (Entry 2)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Project Branding & Identity

### Project Naming
* **Official Name Chosen:** **ArcDock** (combining "Arc" from Utkarsh's GitHub identity with "Dock", symbolizing the desk/car bridge, power/IoT arc, and sleek curved aesthetic).
* Updated all documentation artifacts to reflect **ArcDock**.

---

## Log Entry: 2026-11-13 (Entry 1)
**Author:** Antigravity AI Assistant & Utkarsh  
**Phase:** Planning & Architecture Refinement

### 1. Discussion & Architectural Refinements
* **Reviewed Master Document:** Analyzed the initial `Redmi Smart Dock Master Architecture.md`.
* **Identified Critical Hardware Bug:**
  * Original spec used `echo 60 | sudo tee /sys/class/power_supply/battery/charge_control_limit_max`.
  * *Correction:* In Linux kernel / Qualcomm PMIC, `charge_control_limit_max` regulates charging current in $\mu\text{A}$, not percentage.
  * *Decision:* Implemented a user-space watchdog using `charging_enabled` (0/1) with a 60%–70% hysteresis loop to prolong battery health without cell fatigue.
* **Home Assistant Architecture Re-evaluation:**
  * Recognized the "Car Mode Paradox" (if the phone runs HA and leaves the house, home IoT leaves with it).
  * *User Clarification:* Home automation is only needed when sitting at the desk; no other home server exists. Snapdragon 732G (8 cores, 6-8GB RAM, UFS 2.2) is far more powerful than a Raspberry Pi 4.
  * *Decision:* Created an **On-Demand HA Lifecycle**. In **Desk Mode**, HA runs in Docker. In **Car Mode**, a one-tap trigger executes `docker stop homeassistant`, freeing ~1GB RAM and zeroing out background disk writes and CPU draw.
* **Kiosk Windowing Stack:**
  * Replaced heavy GNOME-based **Phosh** mobile desktop with **Cage** (Wayland Kiosk Compositor) to run Chromium fullscreen landscape with maximum GPU budget dedicated to 120Hz UI rendering.
* **OLED Screen Care:**
  * Added AMOLED burn-in protection: 5-minute idle true-black `#000000` ambient clock + periodic 1–2px micro pixel shifting.
* **Spotify Remote Scope Expansion:**
  * Leveraged Spotify Premium Web API to upgrade the controller from simple playback buttons to a full remote: Playlists drawer, Live Queue drawer, Liked Songs carousel, and seamless Device Switcher.
* **macOS Bridge Scope:**
  * Deferred macOS notification/calendar bridge to Phase 4 (Post-V1) as requested.

### 2. Artifacts Created
* Created [SYSTEM_SPEC.md](file:///Users/utkarsh/Sites/personal/Smart-Dock/docs/SYSTEM_SPEC.md) — Master Technical Architecture.
* Created [IMPLEMENTATION_PLAN.md](file:///Users/utkarsh/Sites/personal/Smart-Dock/docs/IMPLEMENTATION_PLAN.md) — Phase-by-phase actionable roadmap.
* Created [AI_LOG.md](file:///Users/utkarsh/Sites/personal/Smart-Dock/docs/AI_LOG.md) — Activity & decision log.

### 3. Current Status & Next Actions
* **Status:** Ready to begin **Phase 1, Step 1.1** (Vue 3 + Vite scaffolding, landscape CSS, Pinia, Tailwind).
* **Next Action:** Await user sign-off to initialize the project codebase.
