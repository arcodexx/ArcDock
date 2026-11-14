# AI Activity & Decision Log (ArcDock)

This log tracks all architectural discussions, technical decisions, completed steps, and changes made during development.

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
