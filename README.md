# ArcDock ⚡📱

> **Turn any spare smartphone, tablet, or touch display into a dedicated Smart Desk Dock & Vehicle Touch Dashboard.**

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 💡 Why ArcDock? (The E-Waste Reincarnation)

Millions of old smartphones and tablets sit forgotten in desk drawers. Most of these devices feature vibrant OLED displays, multi-core processors, Wi-Fi, and Bluetooth that far outperform DIY microcontrollers.

**ArcDock** reincarnates these devices into a dedicated touch dock for your desk or vehicle—giving you glanceable control over music, smart desk IoT, developer activity, and delivery tracking without cluttering your workstation monitors.

---

## 🌟 The Philosophy: "Dedicated Hardware Dock"

Main monitors are for focused work; smartphones in pockets are notification traps. ArcDock is designed as an **ambient, purpose-built hardware dock** that lives permanently beside your keyboard or on your dashboard:

* **Audio Remote, Not Player:** Rather than playing music through tinny phone speakers, ArcDock acts as a touch controller commanding your external sound systems (**MacBook, Workstation, Car Audio, or Smart Speakers**) via Spotify Connect.
* **Local-First & Independent:** Runs standalone with zero desktop companion apps required. It can even host **Home Assistant Core locally on the phone** via Termux PRoot with 0ms loopback latency.

```
                           ┌──────────────────────────────────────────────┐
                           │                   ArcDock                    │
                           │   Dedicated Touch Dock & Hardware Command    │
                           │       (Any Repurposed Touch Device)          │
                           └──────┬──────────────┬──────────────┬─────────┘
                                  │              │              │
        ┌─────────────────────────┘              │              └─────────────────────────┐
        ▼                                        ▼                                        ▼
🎵 Media Glass Remote                  🏠 Local IoT Core                       🛠️ Workstation Intelligence
(Spotify Connect Controller)           (On-Device Termux HA Core)              (Live Ambient Dashboard)
• Zero local audio decoding            • 0ms local loopback                    • GitHub GraphQL Heatmap & Streaks
• Mac, Car & Hi-Fi output              • AC Climate stepper & modes            • Free ShipTrack Parcel Tracking
• Dynamic ambient radial backdrop      • Desk lighting scenes & room sync      • Open-Meteo Weather & Edge Ping
• Queue, playlists & track search      • Zero-host-impact mock engine          • Standby Work Hub auto-switching
```

---

## 🚀 Core Capabilities

### 🔀 1. Adaptive Dual-State Canvas (Desk Mode)
* **While Music is Playing:** Left pane displays the full Spotify Glass Remote with dynamic ambient backdrop; right pane displays **up to 2 pinned favorite widgets** with 1-tap fullscreen expansion.
* **While Music is Paused / Idle:** Left pane automatically transforms into the **Standby Work Hub** (developer streak, commit counter, open PRs, parcel tracker, and a 1-tap `[ ▶ Resume Track ]` pill); right pane renders the **Desk IoT Command Panel**. Zero duplicate cards.

### 🎵 2. Spotify Glass Remote
* **Touch-First Glanceable UI:** Locked landscape viewport with responsive touch sizing and hardware-accelerated dynamic color extraction from album art.
* **PKCE OAuth 2.0 Security:** Direct client-to-Spotify authorization via Web Crypto API. No backend servers, proxy tokens, or exposed secrets.
* **Full Remote Drawers:** Live queue with loop deduplication, personal playlists drilldown, catalog track search, and 1-tap Spotify Connect device handover.

### 🏠 3. Smart Desk IoT & Climate Control
* **On-Device Home Assistant:** Capable of running Home Assistant Core directly on the phone inside Termux PRoot (Ubuntu ARM64) with 0ms latency—no Raspberry Pi or separate server needed.
* **Streamlined AC Card:** Real-time room temperature, large setpoint stepper, dedicated Power toggle, and downward-opening HVAC mode and fan speed selectors.
* **Desk Lighting & Scenes:** Individual light brightness sliders, room sync bi-directional toggles, and instant scene recall.

### 🛠️ 4. Workstation & Logistics Intelligence
* **Accurate GitHub Activity Hub:** Dual-mode engine (official GraphQL `contributionCalendar` when authenticated, or public scraper when unauthenticated) ensuring the 14-day commit heatmap and dev streak match `github.com` with 100% precision. Includes profile banner, top repositories, and PR review counts.
* **Free Domestic Parcel Tracker:** Powered by the open-source **[ShipTrack](https://github.com/Aswincloud/shiptrack)** service. Zero API keys, zero subscription fees. Tracks Delhivery, Blue Dart, DTDC, India Post, Ekart, Xpressbees, Shadowfax, and more with an internal Vite dev bridge to eliminate CORS blocks.
* **Manual Per-Track Sync:** Every package card across the main hub, favorite panel, and full delivery view features an individual `[ 🔄 ]` sync button.
* **Weather & Network Monitor:** Live Open-Meteo forecasts with coordinate caching and multi-cloud edge latency ping badges (Cloudflare, Google, AWS) with direct 1-tap fullscreen access from the top bar.

### 🚗 5. Car Kiosk Mode (The "Backseat Jukebox" & Passenger Remote)
* **The Shared Roadtrip Problem:** When your primary phone is hooked to the car for GPS navigation and calls, passing it around for music isn't always your first choice. Built-in car displays also restrict searching while driving and can't be reached from the back seat.
* **Dedicated Passenger Remote:** Hand ArcDock to passengers or mount it in the rear as a dedicated music remote. Anyone can search songs and manage the queue via Spotify Connect without touching your phone or interrupting navigation.
* **PIN-Locked Profile:** Personal desk data (smart home, GitHub, parcels, and settings) is hidden and locked behind a 4-digit PIN (`0000` by default).
* **Resource Reclamation:** Suspends Home Assistant background services in the car, reclaiming **~500 MB–1 GB RAM**.

### 🔋 6. AMOLED & Battery Longevity
* **True-Black Screensaver:** Pure `#000000` floating OLED clock powers off pixels after 5 minutes of inactivity when paused.
* **Micro Pixel Shifting:** 1–2px translate shifts every 10 minutes to protect against OLED burn-in.
* **Charge Protection:** Supports LineageOS 80% charge limits or ACC (Advanced Charging Controller) 60%–70% hysteresis loops to prevent battery swelling for 24/7 docked use.

---

## 📚 Documentation

For in-depth architecture, API specifications, and dev logs, refer to the `docs/` folder:

* **[SYSTEM_SPEC.md](docs/SYSTEM_SPEC.md)** — Master technical architecture, API schemas, and hardware profiles.
* **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** — Phased roadmap and implementation tracker.
* **[AI_LOG.md](docs/AI_LOG.md)** — Exhaustive engineering log of architectural decisions and updates.

---

## 💻 Quick Start & Local Development

### Prerequisites
* **Node.js** (v18+) & **npm**
* A free or premium **[Spotify Developer Account](https://developer.spotify.com/dashboard)**

### 1. Installation
```bash
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock
npm install
```

### 2. Configure Spotify Developer App
1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Set Redirect URIs to both:
   * `http://127.0.0.1:3000/callback`
   * `http://localhost:3000/callback`
3. Under **User Management**, add your Spotify account email.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Tap **Settings** (gear icon), enter your **Client ID**, and tap **Authorize with Spotify**.

### 4. Build for Production Kiosk
```bash
npm run build
```
Builds an optimized, static client bundle in `dist/` (~94 kB gzipped) that runs from any static web server with zero Node.js runtime required on the target device.

---

## 📱 Target Hardware Deployment

ArcDock is designed to run on any mobile or touch device:

### Option A: LineageOS / Android + Termux PRoot (Recommended)
Delivers 100% factory hardware stability, GPU hardware acceleration, and runs Home Assistant Core locally:

1. Flash official **LineageOS 20/21** on your device.
2. In **Developer Options**, enable *"Disable child process restrictions"* and *"Stay awake while charging"*.
3. Install **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/), grant unrestricted battery, and run:
   ```bash
   termux-wake-lock
   pkg update -y && pkg install proot-distro curl -y
   curl -sL https://raw.githubusercontent.com/arcodexx/ArcDock/main/scripts/setup-phone-ha.sh | bash
   ```
4. Install **Fully Kiosk Browser** on the phone, set orientation to **Landscape**, and point the start URL to your ArcDock deployment.

### Option B: Community Linux Kiosk (Nura / postmarketOS + Cage)
For users running mainline Linux with a Wayland kiosk compositor (`cage`) running Chromium in `--kiosk` mode. See [docs/SYSTEM_SPEC.md](docs/SYSTEM_SPEC.md) for launch parameters.

---

## 🙏 Acknowledgements & Prior Art

* **[alexanderhale/home-assistant](https://github.com/alexanderhale/home-assistant)**: Immense credit to Alexander Hale for pioneering the concept of repurposing legacy Android hardware into an on-device Home Assistant server and wall dashboard via Termux.
* **[Aswincloud/shiptrack](https://github.com/Aswincloud/shiptrack)**: Huge credit to **Aswin** for creating ShipTrack, an open-source, free Indian logistics tracking backend with zero API keys required.
* **[Home Assistant](https://www.home-assistant.io/)**: The gold standard in open-source, local-first home automation.
* **[Nura / postmarketOS](https://nura.eco/)** & **[Cage](https://github.com/cage-kiosk/cage)**: Inspiration for mobile Linux and minimal Wayland kiosk computing.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details. Built for the open-source, maker, and self-hosted community.
