# ArcDock ⚡📱

> **Turn any spare smartphone, tablet, or touch display into a dedicated Smart Desk Dock & Vehicle Touch Dashboard.**

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2026.11.2-41BDF5?style=flat-square&logo=home-assistant)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 💡 Why ArcDock? (The E-Waste Reincarnation)

Millions of old smartphones and tablets sit forgotten in desk drawers. Most of these devices feature vibrant OLED displays, multi-core processors, Wi-Fi, and Bluetooth that far outperform DIY microcontrollers.

**ArcDock** reincarnates these devices into a dedicated touch dock for your desk or vehicle—giving you glanceable control over music, smart desk IoT, developer activity, and delivery tracking without cluttering your workstation monitors.

---

## 🌟 The Philosophy: "Dedicated Hardware Dock"

Main monitors are for focused work; smartphones in pockets are notification traps. ArcDock is designed as an **ambient, purpose-built hardware dock** that lives permanently beside your keyboard or on your dashboard:

* **Audio Remote, Not Player:** Rather than playing music through tinny phone speakers, ArcDock acts as a touch controller commanding your external sound systems (**MacBook, Workstation, Car Audio, or Smart Speakers**) via Spotify Connect.
* **On-Device Home Assistant Core:** Runs natively directly on the phone in Termux Python with **0ms local loopback latency**—no Raspberry Pi, home server, or cloud bridge required.

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
(Spotify Connect Controller)           (On-Device Native HA Core)              (Live Ambient Dashboard)
• Zero local audio decoding            • 0ms local loopback                    • GitHub GraphQL Heatmap & Streaks
• Mac, Car & Hi-Fi output              • AC Climate stepper & modes            • Free ShipTrack Parcel Tracking
• Dynamic ambient radial backdrop      • Desk lighting scenes & room sync      • Open-Meteo Weather & Edge Ping
• Queue, playlists & track search      • Flash-safe commit intervals           • Standby Work Hub auto-switching
```

---

## ⚡ Quick Start: Deploy on Any Phone, Tablet, or Android Dock

ArcDock runs on **any Android device** (Google Pixel, Samsung Galaxy, OnePlus, Motorola, Xiaomi/Redmi, Lenovo Tab, Amazon Fire, or generic touch displays). It works on **standard factory stock Android** right out of the box—no custom ROM, unlocking, or root required!

### 1. Set Up On-Device Home Assistant
In **Termux** on your phone or tablet, run the 1-line installer:

```bash
curl -sL https://raw.githubusercontent.com/arcodexx/ArcDock/main/scripts/setup-phone-ha.sh | bash
```
*(This sets up Python 3, Bionic libc build toolchains, the high-performance `darkhttpd` static server, and native Home Assistant Core).*  
Once complete, start Home Assistant with `~/start-hass.sh` and complete onboarding at `http://localhost:8123` (or via computer browser with `adb forward tcp:8123 tcp:8123`).

### 2. Deploy ArcDock Frontend to Device
From your development workstation:
```bash
git clone https://github.com/arcodexx/ArcDock.git && cd ArcDock
npm install

# Save your device's Termux Wi-Fi IP (stored in .phone_ip for zero-config deploys)
npm run dock:ip 192.168.1.30

# One-command build, transfer assets, restart server, and force-refresh screen
npm run deploy
```
*(If your device's Wi-Fi router assigns a new DHCP IP later, simply run `npm run dock:ip <new-ip>` and deploy immediately without touching any configuration scripts).*

### 3. Launch the ArcDock Server & Connect
On your device in Termux, start the unified ArcDock server:
```bash
python3 ~/arcdock_api.py &
```
The built-in Python 3 server (`scripts/arcdock_api.py`) requires **zero external pip dependencies** and powers:
* Static dashboard delivery with automatic MIME type resolution and gzip readiness at `http://localhost:3000`.
* **`/clip` Web UI & `/api/clipboard` REST:** Instant cross-device copy/paste between phone dock, MacBook, and PC over LAN.
* **`/api/system/info`:** Auto-detects local Wi-Fi IP and active port for QR code pairing.
* **`/api/system/restart-server`:** Dispatches self-restart without requiring manual Termux terminal intervention.

*(💡 **Alternative Ultra-Lean C Server:** If you only need static dashboard delivery without the LAN clipboard API, you can also run `darkhttpd ~/arcdock/dist --port 3000 &`, which uses < 2 MB RAM).*

Open **Fully Kiosk Browser** (or Chrome) to **`http://localhost:3000`**, open ArcDock Settings (⚙️), and paste your Home Assistant Long-Lived Access Token.

### 4. Zero-Touch Auto-Boot Setup (100% Free / No Kiosk License Needed)
Configure your dock to turn on and display ArcDock automatically whenever powered or rebooted:
1. Install **Termux:Boot** from F-Droid. Open the Termux:Boot app once to register its receiver.
2. In Android **Settings → Apps → Special app access → Display over other apps**, grant permission to **Termux** and **Fully Kiosk Browser**.
3. Create `~/.termux/boot/start-arcdock.sh`:
   ```bash
   #!/data/data/com.termux/files/usr/bin/bash
   termux-wake-lock
   sshd
   python3 /data/data/com.termux/files/home/arcdock_api.py &
   /data/data/com.termux/files/home/hass/bin/hass &
   sleep 3
   am start -a android.intent.action.VIEW -d "http://localhost:3000"
   ```
   `chmod +x ~/.termux/boot/start-arcdock.sh`
4. Configure **Fully Kiosk Browser** (or Chrome PWA):
   - **Start URL:** `http://localhost:3000`
   - **Orientation:** Force Landscape (`Device Management → Orientation`)
   - **Enable Text Selection:** ON (`Web Content Settings`)
   - **Keep Screen On While Charging:** ON
   - **Run on Device Boot:** ON (`Other Settings`)
5. In Android **Settings → Security → Screen lock**, set to **None** (and enable **Skip screen lock** in Developer Options) for true instant-on power!

> 📖 **Need universal flashing guides, stock Android optimization, or low-level troubleshooting?**  
> See the exhaustive **[Universal Hardware Deployment Guide (docs/DEPLOYMENT_GUIDE.md)](docs/DEPLOYMENT_GUIDE.md)** for device setup across OEMs (Pixel, Samsung, OnePlus, Xiaomi, etc.), Kernel compatibility, Termux compiler optimizations, and UFS flash storage protection.

---

## 🎨 Visual Themes & Aesthetic Worlds Engine

ArcDock transforms beyond a standard dark dashboard into **5 curated artistic worlds** with custom backdrops, ambient lighting, typography, and card materials. The theme applies universally across all split panes, drawers, modal stations, and right-hand IoT panels:

| Theme | Mood & Concept | Base Palette | Typography | Ambient Scenery & Backing |
| :--- | :--- | :--- | :--- | :--- |
| **Default OLED** | Baseline Pure Black | `#000000` • `#10B981` | Plus Jakarta Sans | Real-time dynamic Spotify album art radial backlighting via ColorThief |
| **Anime Japan Zen** | Daylight Ghibli Morning | `#FFF5F8` • `#E84855` • `#7BA23F` | Noto Sans JP | Bundled high-res Mount Fuji photography, Chureito Pagoda, Torii gate, steaming ramen bowl 🍜, drifting Sakura petals |
| **Apple Liquid Glass** | macOS Sonoma Pro | Deep Abstract Cyan/Purple | Plus Jakarta Sans | Specular acrylic blooms, Sonoma liquid wallpaper, neon icon rings, high-contrast white labels |
| **Simple Retro Radio** | 1960s Dieter Rams Braun | `#141210` • `#D99B43` | Space Mono | Horizontal AM/FM glass tuning scale (`88–108 MHz`), illuminated red needle, bakelite chassis |
| **Cyberpunk 2077 HUD** | Night City Netrunner | `#08080C` • `#FCEE0A` • `#00F0FF` | Chakra Petch | 45° chamfered cards, caution hazard stripes, rotating targeting reticle, CRT scanlines, Katakana decals |

### ☀️ Mobile / OS Dark Mode Immunity
Mobile browsers and WebViews (such as Chrome on Android and Fully Kiosk) enforce **"Auto Dark Mode for Web Contents"** by default when the host phone is in Dark Mode, which would normally invert and darken light themes.
* ArcDock enforces **`color-scheme: only light !important;`** whenever a light theme is active, strictly adhering to the W3C Color Adjustment specification to instruct mobile browsers never to algorithmically invert or dim the page.
* Dynamically manages `<meta name="color-scheme" content="only light">` and `<meta name="theme-color">` on the fly for 100% theme fidelity regardless of phone OS settings.

### 🌑 AMOLED True-Black Screensaver & Ghost-Click Shield
* **100% OLED Pixel Extinction:** The screensaver (`.oled-screensaver`) is strictly isolated from parent theme color rules and forced to pure `#000000` black, turning off pixels completely on OLED displays while idle.
* **Theme Typography Inheritance:** Clock digits dynamically adopt the active theme's font family (`Noto Sans JP` in Japan mode, `Space Mono` in Retro mode, `Chakra Petch` in Cyberpunk mode) while preserving pitch-black backgrounds.
* **Transient Touch-Shield (Zero Ghost Clicks):** When tapping anywhere to wake the dock, a transient 350ms invisible shield (`z-[250]`) intercepts and swallows trailing synthesized touch/click events, completely eliminating accidental button presses on underlying widgets.

---

## 📱 Touch-First Ergonomics & Ambient Design

ArcDock is designed specifically for finger interaction on physical touchscreens rather than desktop mouse clicks:

* **Google Material Touch Targets:** Primary controls (temperature steppers, media toggles, power switches, dropdowns) meet or exceed the **44–48dp** guideline for accurate, miss-free finger taps.
* **Zero-Scroll Landscape Layout:** Tailored precisely for ~360–390px landscape viewport heights on 20:9 AMOLED displays (e.g., 6.67" Redmi Note 10 Pro). Content stays completely visible with zero accidental page scrolling.
* **Tactile Visual Feedback:** Every interactive element features rapid active micro-scaling (`active:scale-90` / `active:scale-95`) and high-contrast ambient glow cues.
* **Thumb-Accessible Edge Tab:** When the right IoT pane is collapsed, a `28 × 56 px` edge tab allows instant one-tap expansion without obscuring album artwork.

---

## 🗓️ Cross-Timezone Calendar Engine (iCal / Outlook / Google)

ArcDock features a robust client-side iCalendar parser capable of synchronizing live meeting schedules across multiple timezones:
* **Dynamic VTIMEZONE Parsing:** Parses embedded `BEGIN:VTIMEZONE` and `TZOFFSETTO` rules directly from raw `.ics` payloads.
* **Windows & IANA Normalization:** Recognizes corporate Outlook timezones (`W. Europe Standard Time`, `GMT Standard Time`, `Eastern Standard Time`) and IANA designations (`Europe/Paris`, `America/New_York`).
* **IST (Asia/Kolkata) Normalization:** Resolves international meeting offsets to your local display timezone with zero manual configuration.
* **Intelligent Deduplication & Ghost Filtering:** Automatically drops `STATUS:CANCELLED` meetings and merges duplicate invites (cross-calendar or recurrence exceptions) into a single card with full Google Meet/Zoom URLs.
* **Pre-Meeting Radar:** Highlights ongoing and imminent meetings with live countdown badges (`Now`, `15m`, `30m`).
* **Automated Background Refresh (Every 30 Minutes):** Periodically checks for newly scheduled or rescheduled meetings without manual intervention (at 2 requests/hour, well below external rate limits).

---

## ⚡ Background Polling Intervals & Network Warm-Up

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

### Zero-Touch Cold-Boot Warm-Up Sync
On device power-on, the browser web app starts up before Android finishes its Wi-Fi DHCP handshake. ArcDock solves this automatically:
* **Staggered Retries:** Runs warm-up syncs at **5 seconds** and **15 seconds** after boot.
* **Online Wakeup:** Attaches a `window.addEventListener('online', ...)` listener that immediately triggers a full data fetch the millisecond Wi-Fi connects.
* **No manual refresh is ever required after turning the dock on.**

---

## 🛠️ Dock Power & Remote Diagnostics Modal

Tap the 🔄 icon in the top bar to open the **Dock Power & Restart Modal**:
1. **Reload UI (Instant • ~1s):** Automatically calls `window.fully.clearCache(true)` to bypass Android WebView disk cache and immediately render freshly deployed code.
2. **Restart Home Assistant (Core • ~15s):** Reboots the local Home Assistant Core event loop and SQLite engine without rebooting the phone.
3. **Restart ArcDock Server (Server • ~3s):** Restarts the Python HTTP server on port 3000 to apply backend changes.

---

## 🔧 Troubleshooting & Field Guide

### 1. Phone IP Changed on Wi-Fi
If your router assigns a new IP address to the phone or the connection times out:
```bash
# Check current IP setting:
npm run dock:ip

# Update phone IP address (e.g. 192.168.1.35):
npm run dock:ip 192.168.1.35

# Deploy to phone with SSH multiplexing (prompts for SSH password only once!):
npm run deploy
```
> **Tip:** `npm run deploy` automatically performs a pre-flight connectivity check. If the phone IP is unreachable, it halts before building and prints clear instructions with your exact change command. With OpenSSH `ControlMaster` multiplexing enabled, you enter your SSH password once per deploy session—assets, server scripts, and restart commands reuse the active session seamlessly with zero password re-prompts.

### 2. Stale Frontend / Code Updates Not Showing on Phone
If you deploy new code but the phone screen still shows an older version:
* Tap the **Rotate (🔄)** button on the top right of the dashboard and select **Reload UI**. ArcDock communicates directly with the Fully Kiosk JavaScript interface to purge disk cache and append a timestamp bust parameter.
* Alternatively, run `npm run reload` from your Mac workstation.

### 3. Server Startup Errors (`UnboundLocalError`)
In `scripts/arcdock_api.py`, `urllib.request` and standard library modules are imported at the top-level scope to avoid Python local variable shadowing during concurrent HTTP requests.

### 4. Meeting Times Offset by Several Hours
Ensure your iCal feed URL is pasted in the Calendar settings drawer. ArcDock automatically resolves international organizer timezones (such as CET or Western Europe) to IST (`Asia/Kolkata`) using dynamic `VTIMEZONE` indexing.

---

## 💻 Workstation Local Development

```bash
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock
npm install
npm run dev
```

### Spotify Developer App Configuration
1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Set Redirect URIs to both:
   - `http://127.0.0.1:3000/callback`
   - `http://localhost:3000/callback`
3. Tap **Settings** (gear icon in ArcDock), enter your **Client ID**, and tap **Authorize with Spotify**.

---

## 🔋 AMOLED & Battery Longevity
* **80% Battery Charging Cap:** Built into LineageOS (`Settings → Battery → Charging control`) to eliminate battery swelling for 24/7 docked use.
* **True-Black Screensaver:** Pure `#000000` floating OLED clock powers off pixels after 5 minutes of inactivity when paused.
* **Micro Pixel Shifting:** 1–2px translate shifts every 10 minutes to protect against OLED burn-in.

---

## 📚 Technical Documentation
* **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** — Exhaustive hardware teardown, LineageOS flashing, and Termux engineering details.
* **[docs/SYSTEM_SPEC.md](docs/SYSTEM_SPEC.md)** — Master technical architecture, API schemas, and hardware profiles.
* **[docs/AI_LOG.md](docs/AI_LOG.md)** — Architectural decision log and debugging trajectory.

---

## 📄 License
Distributed under the **MIT License**. Built for the open-source, maker, and self-hosted community.
