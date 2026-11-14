# ArcDock ⚡📱

> **Turn your old smartphone, tablet, or touch screen into an ultra-responsive, dedicated "Glass Remote" desk and car dashboard.**

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 💡 Why ArcDock? (The E-Waste Reincarnation)

Millions of old smartphones and tablets sit forgotten in desk drawers. Most of these devices feature stunning high-resolution displays (many with 90Hz/120Hz OLED panels), fast multi-core processors, and built-in Wi-Fi and Bluetooth that far outperform typical DIY microcontrollers or Raspberry Pi setups.

By installing a lightweight operating system — either **LineageOS (Android 13/14) with Termux** for 100% factory hardware reliability and native 120Hz Super AMOLED acceleration, or a minimal Linux distribution (**[Nura / postmarketOS](https://nura.eco/)** with Cage Wayland Kiosk) — **ArcDock** transforms any spare mobile device into a permanent, lag-free smart dashboard for your desk or vehicle.

---

## 🌟 The Philosophy: "Glass Remote, Not Audio Player"

ArcDock is designed as a **Glass Remote**, not an audio player:

Instead of decoding audio streams or playing music through tinny phone speakers, ArcDock acts as a dedicated touch terminal to control external sound systems (**MacBook, Workstation, iPhone, Car Audio, or Smart Speakers**) via the Spotify Connect cloud ecosystem.

```
                     ┌────────────────────────────────────────┐
                     │                ArcDock                 │
                     │      (Any Repurposed Touch Device)     │
                     │  High-FPS / AMOLED Touch Controller    │
                     └──────────────────┬─────────────────────┘
                                        │ Spotify Connect (Web API / PKCE)
                                        ▼
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
     💻 Workstation / Mac       🚗 Car Bluetooth           🔊 Smart Speakers
        (Audio Output)             (Audio Output)            (Audio Output)
```

---

## 🚀 Features

### 🎵 1. Spotify Glass Remote (Standalone)
* **Glanceable Touch Interface:** Locked to a fixed landscape viewport (`100vw x 100vh`) with touch-first sizing, designed for effortless control while sitting at your desk or driving.
* **PKCE OAuth 2.0 Security:** Standard RFC 7636 Web Crypto API PKCE flow. Direct client-to-Spotify communication with no backend credentials or secrets exposed.
* **Modern Spotify Library Integration:** Instant save and remove with Spotify's modern **`+` (Plus)** and **`✓` (Check/Tick)** toggle, using Spotify's latest unified `/v1/me/library` API.
* **Dynamic Palette Extraction:** Real-time ambient radial gradients dynamically sampled from album art using Color Thief with hardware-accelerated CSS rendering.
* **Extended Remote Drawers:**
  * **Playlists Drawer:** Browse personal playlists, inspect tracklists, "Play All", or queue individual tracks.
  * **Live Queue Drawer:** Real-time hardware queue preview with loop deduplication and jump-to-track shortcuts.
  * **Catalog Search Drawer:** Instant debounced track search with one-tap "Play Now" and "+ Add to Queue".
  * **Device Switcher:** Instant Spotify Connect target handover (seamlessly switch playback between Mac, Phone, Car, or Speaker).
* **AMOLED & Display Longevity:**
  * **True-Black Screensaver:** Pure `#000000` floating OLED ambient clock turns off pixels completely after 5 minutes of inactivity when paused.
  * **Micro Pixel Shifting:** Subtle 1–2px translate shifts every 10 minutes to protect against burn-in on OLED/AMOLED screens.

### 🏠 2. Dual Operational Profiles & Smart Desk Grid (Desk vs. Car Mode)
* **Desk Mode (Split-Grid Command Center):**
  * **Resizable & Collapsible Split-Grid:** Fluid touch/pointer draggable splitter (`SplitPane.vue`) with persistent ratio in `localStorage` and a 1-tap discreet 20px edge reopen tab.
  * **Zero-Host-Impact Mock Engine:** Built-in reactive mock engine in `useHomeAssistantStore` providing simulated desk lights, fans, and scenes with 0ms latency—requiring zero software or daemon installation on development machines.
  * **Square Tile Controls:** Single-toggle square cards (`LightCard.vue`, `SwitchCard.vue`) with an on-demand solid opaque brightness modal (44px touch slider, quick presets).
  * **Compact Header Dropdown:** Space-saving quick scenes menu (`⚡ Focus`, `☕ Relax & Warm`, `🌙 Night Mode`) and a dedicated one-tap All-Off button.
  * **Scoped Media Controls:** Dedicated `MediaBar.vue` bounds Spotify controls strictly inside the music column, preventing them from hovering over the IoT panel.
  * **On-Device Home Assistant Core:** Runs locally on the phone inside Termux PRoot (Ubuntu 24.04 ARM64) with 0ms local loopback latency—no Mac, Raspberry Pi, or separate home server required.
* **Car Mode (Driving Kiosk):**
  * Automatically suspends the Home Assistant background service (`scripts/ha-lifecycle.sh`), zeroing background CPU, reclaiming **~500 MB–1 GB RAM**, and stopping flash disk writes.
  * Maximizes Spotify to 100% full screen with large, glanceable driving controls.
  * Mode switches are guarded by an intentional, plain-language confirmation dialog teleported to `document.body` for 100% solid z-index isolation.
* **Full-Screen Settings View:** Promoted from a cramped modal to a dedicated full-screen configuration surface (`SettingsModal.vue`) with back navigation and seamless scrolling.

### 🛡️ 3. 24/7 Battery Protection & Storage Longevity
* **Charge Limit / Hysteresis:** Phones kept plugged in 24/7 suffer from lithium cell swelling. ArcDock utilizes native charging limits (80% in LineageOS) or ACC (Advanced Charging Controller for 60%–70% hysteresis) to keep the battery healthy indefinitely.
* **Flash Storage Longevity (UFS 2.2):** Tuned Home Assistant `recorder` configuration (`commit_interval: 30`, excluding high-frequency media players) to reduce flash database writes by >95%.

---

## 📂 Project Structure

ArcDock is structured as a self-contained appliance repository:

```text
ArcDock/
├── docs/                        # Complete technical specifications & dev logs
│   ├── SYSTEM_SPEC.md           # Master technical architecture & API quirks
│   ├── IMPLEMENTATION_PLAN.md   # Step-by-step roadmap
│   └── AI_LOG.md                # Engineering decisions & change history
├── src/                         # Glass Remote frontend (Vue 3 + Vite)
│   ├── assets/                  # Branding and static media
│   ├── components/              # Touch UI components
│   │   ├── cards/               # Smart Desk tiles (LightCard, SwitchCard)
│   │   ├── DeskIoTPanel.vue     # Smart Desk IoT command surface & scene dropdown
│   │   ├── DeviceDrawer.vue     # Spotify Connect target handover drawer
│   │   ├── MediaBar.vue         # Scoped playback target & drawer navigation
│   │   ├── NowPlaying.vue       # Main landscape track view & playback controls
│   │   ├── OledScreensaver.vue  # True-black drifting AMOLED clock
│   │   ├── PlaylistDrawer.vue   # Personal playlist drilldown & instant playback
│   │   ├── QueueDrawer.vue      # Deduplicated upcoming hardware queue
│   │   ├── SearchDrawer.vue     # Debounced Spotify catalog track search
│   │   ├── SettingsModal.vue    # Full-screen system settings & HA configuration
│   │   ├── SplitPane.vue        # Touch-draggable resizable & collapsible split container
│   │   └── TopBar.vue           # Ultra-slim header with mode guard & digital clock
│   ├── composables/             # Vue composables (useAmoledProtection)
│   ├── services/                # Network layers (Spotify Web API, PKCE Web Crypto)
│   ├── stores/                  # Pinia stores (spotify, homeAssistant)
│   ├── types/                   # TypeScript definitions (spotify, homeAssistant)
│   ├── utils/                   # Color extraction, formatters, device icons
│   ├── App.vue                  # Root layout, dynamic ambient backdrop & split controller
│   └── main.ts                  # App entry point & Pinia initialization
├── docker/                      # Deployment definitions for target Linux phone
│   └── docker-compose.yml       # Home Assistant Core container specification
├── scripts/                     # Target deployment & hardware scripts
│   ├── setup-phone-ha.sh        # Turnkey on-device Home Assistant installer (Termux PRoot Ubuntu)
│   ├── ha-lifecycle.sh          # Container/service start/stop on Desk/Car mode switch
│   └── battery-guardian.sh      # 60%-70% charge threshold sysfs hysteresis watchdog
├── index.html                   # HTML entry locked to viewport-fit=cover
├── package.json                 # Node dependencies
├── tailwind.config.js           # Touch sizing, OLED palette, safe area tokens
└── vite.config.ts               # Vite bundler configuration
```

---

## 🛠️ Supported Hardware & Operating Systems

ArcDock is completely hardware-agnostic and will run on **any device capable of running a modern web browser or Wayland compositor**:

* **Operating Systems:**
  * **LineageOS / Android 13+ (Recommended & Tested):** 100% official hardware support, native 120Hz Super AMOLED rendering, and runs Home Assistant Core locally via Termux PRoot.
  * **[Nura (formerly postmarketOS)](https://nura.eco/) / Alpine Linux (Community / Experimental):** For advanced power users seeking a pure Linux Wayland kiosk (`cage`) with native Docker.
  * Any modern web browser (PWA on iPad, tablet, touch monitor, or old laptop).
* **Displays:** Any capacitive touchscreen (AMOLED, OLED, or LCD). Viewport is responsive and automatically adapts to 16:9, 18:9, 19.5:9, or 20:9 aspect ratios.
* **Reference Hardware:** Tested and verified on an 8-core Snapdragon 732G device *(Xiaomi Redmi Note 10 Pro / `sweet`)* running LineageOS with native 120Hz Super AMOLED GPU acceleration, but works seamlessly across any phone, tablet, or single-board computer.

---

## 💻 Quick Start & Local Development

### Prerequisites
* **Node.js** (v18 or higher) & **npm**
* A free or premium **[Spotify Developer Account](https://developer.spotify.com/dashboard)**

### 1. Installation
```bash
# Clone your repository
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock

# Install dependencies
npm install
```

### 2. Configure Spotify Developer Dashboard
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and click **Create App**:
   * **App Name:** `ArcDock` (or any name you prefer)
   * **Redirect URIs:** Add both:
     * `http://127.0.0.1:3000/callback`
     * `http://localhost:3000/callback`
   * **Which API/SDKs are you planning to use?:** Check **Web API**.
2. Go to **Settings -> User Management** (or *Users and Access*) and make sure your Spotify account email is listed.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. Tap **Settings** (gear icon in the top right), enter your **Client ID**, and tap **Authorize with Spotify**.

### 4. Build for Production Kiosk
```bash
npm run build
```
Generates a highly optimized, static client bundle in `dist/` (~158 kB) that requires zero Node.js runtime on your device.

---

## 📱 Target Hardware Deployment

ArcDock supports two primary deployment models depending on your hardware preferences:

### Method A: LineageOS / Android + Termux PRoot (Recommended)
This approach delivers **100% factory hardware driver reliability**, buttery-smooth **120Hz Super AMOLED** hardware acceleration, and native thermal/battery management without fighting experimental mainline kernel quirks.

1. **Prepare Phone Settings:**
   * Flash official **LineageOS 20/21 (Android 13/14)** on your device.
   * In **Developer Options**, enable:
     * **"Disable child process restrictions"** *(prevents Android's Phantom Process Killer from terminating background tasks)*.
     * **"Stay awake while charging"** *(keeps display & Wi-Fi at full performance while docked)*.
   * In **Display Settings**, lock the refresh rate to **120Hz**.
2. **Install Termux & Deploy Home Assistant:**
   * Install **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/) (do not use the deprecated Play Store build).
   * Set Termux battery usage to **"Unrestricted"**.
   * Run the turnkey installer from `scripts/setup-phone-ha.sh` inside Termux:
     ```bash
     termux-wake-lock
     pkg update -y && pkg install proot-distro curl -y
     curl -sL https://raw.githubusercontent.com/arcodexx/ArcDock/main/scripts/setup-phone-ha.sh | bash
     ```
   * Home Assistant Core will initialize inside an isolated Ubuntu 24.04 ARM64 PRoot container with pre-compiled wheels, flash-safe SQLite write batching, and local loopback on `http://127.0.0.1:8123`.
3. **Launch the Kiosk UI:**
   * Install **Fully Kiosk Browser** on the phone.
   * Lock orientation to **Landscape**, enable hardware WebGL acceleration, and point the start URL to your ArcDock bundle.

---

### Method B: Pure Linux Kiosk (Nura / postmarketOS + Cage) — [Community / Experimental / Untested]

> [!WARNING]
> **Experimental / Untested:** Mainline Linux support for the Redmi Note 10 Pro (`sweet`) is currently classified under Nura's Community tier with partial battery charging and PMIC driver support. Use this method only if you are comfortable debugging mainline device trees and kernel power management.

For users seeking a bare-metal Linux environment with native Docker:

1. **Install Kiosk Compositor & Browser:**
   ```bash
   # On Nura / postmarketOS / Alpine Linux:
   sudo apk add cage chromium tzdata
   ```
2. **Launch Kiosk:**
   ```bash
   cage -d -s -- chromium-browser \
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
     http://127.0.0.1:3000
   ```

---

## 🔋 24/7 Battery Protection & Dock Longevity

To prevent lithium cell swelling on devices docked 24/7:

* **On LineageOS / Android:** Enable the native **Charging limit (80%)** under `Settings → Battery`, or deploy **ACC (Advanced Charging Controller)** via Magisk/Termux to enforce a strict **60%–70% charge hysteresis loop**.
* **On Linux / Nura:** Deploy the kernel sysfs watchdog in `scripts/battery-guardian.sh` via a 60-second systemd timer to regulate `/sys/class/power_supply/battery/charging_enabled`.

---

## 🙏 Acknowledgements & Prior Art

* **[alexanderhale/home-assistant](https://github.com/alexanderhale/home-assistant)**: Immense credit to Alexander Hale for pioneering the concept of repurposing legacy Android hardware (a 2013 Google Nexus 7 tablet) into a dedicated on-device Home Assistant server and wall-mounted dashboard via Termux. ArcDock builds upon this proof-of-concept, adapting it to modern 64-bit multi-core Snapdragon hardware, 120Hz Super AMOLED displays, UFS flash longevity, and a dedicated Spotify Glass Remote interface.
* **[Home Assistant](https://www.home-assistant.io/)**: The gold standard in open-source, local-first home automation.
* **[Nura / postmarketOS](https://nura.eco/)** & **[Cage](https://github.com/cage-kiosk/cage)**: For inspiring mobile Linux and minimal Wayland kiosk computing.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details. Built for the open-source, maker, and self-hosted community.
