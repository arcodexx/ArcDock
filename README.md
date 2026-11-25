# ArcDock ⚡📱

> **Turn any spare smartphone, tablet, or touch display into a dedicated Smart Desk Dock & Vehicle Touch Dashboard.**

[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2026.11.2-41BDF5?style=flat-square&logo=home-assistant)](https://www.home-assistant.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 💡 What is ArcDock?

Old smartphones and tablets often end up forgotten in drawers despite having vibrant OLED displays, multi-core processors, Wi-Fi, and Bluetooth that far outperform DIY microcontrollers.

**ArcDock** gives these devices a second life as an ambient, dedicated hardware touch dock right beside your keyboard or on your vehicle dashboard.

* **Audio Remote, Not Player:** Controls playback on your external speakers, MacBook, workstation, or car audio via Spotify Connect without using phone speakers.
* **On-Device Home Assistant Core:** Runs natively in Termux on the phone with **0ms local loopback latency**—no external server, cloud dependency, or Raspberry Pi required.
* **Ambient Workstation Hub:** Keeps your main monitors clutter-free by surfacing GitHub commits, meetings, delivery milestones, habit tracking, and timezones at a glance.

```
                           ┌──────────────────────────────────────────────┐
                           │                   ArcDock                    │
                           │   Dedicated Touch Dock & Hardware Command    │
                           │       (Any Repurposed Touch Device)          │
                           └──────┬──────────────┬──────────────┬─────────┘
                                  │              │              │
        ┌─────────────────────────┘              │              └─────────────────────────┐
        ▼                                        ▼                                        ▼
🎵 Media Remote                        🏠 Local IoT Core                       🛠️ Workstation Intelligence
(Spotify Connect Controller)           (On-Device Native HA Core)              (Live Ambient Dashboard)
• Zero audio decoding penalty          • 0ms local loopback                    • GitHub GraphQL Heatmap & Streaks
• Mac, Car & Hi-Fi speaker output      • AC Climate stepper & modes            • Multi-Carrier Delivery Tracking
• Dynamic album art radial backdrops   • Desk lighting scenes & room sync      • Cross-Timezone Agenda Radar
• Live Queue, playlists & search       • Flash-safe commit intervals           • Shared LAN Clipboard (/clip)
```

---

## 🎨 Visual Themes

ArcDock includes **5 curated aesthetic themes** that style the split panes, control drawer, and ambient scenery:

| Theme | Aesthetic & Mood | Style Highlights |
| :--- | :--- | :--- |
| **Default OLED** | Baseline Pure Black | Dynamic album art backlighting via ColorThief, true black canvas |
| **Anime Japan Zen** | Daylight Ghibli Morning | High-res Mount Fuji photography, Chureito Pagoda, Torii gate, washi glass cards |
| **Apple Liquid Glass** | macOS Sonoma Pro | Specular fluid wallpaper, frosted acrylic cards, neon icon accents |
| **Simple Retro Radio** | 1960s Dieter Rams Braun | Bakelite chassis, horizontal AM/FM glass tuning scale, warm amber meters |
| **Cyberpunk 2077 HUD** | Night City Netrunner | 45° chamfered cards, hazard stripes, rotating targeting reticle, CRT scanlines |

---

## 🚀 Quick Start

ArcDock runs on **any Android device** (Pixel, Samsung, OnePlus, Xiaomi/Redmi, Lenovo Tab, Amazon Fire, generic touch displays). It works on **standard factory stock Android** right out of the box—no custom ROM, unlocking, or root required.

### 1. Install Home Assistant on Device
In **Termux** on your device, run the 1-line installer:
```bash
curl -sL https://raw.githubusercontent.com/arcodexx/ArcDock/main/scripts/setup-phone-ha.sh | bash
```
Once complete, start Home Assistant with `~/start-hass.sh` and complete onboarding at `http://localhost:8123`.

### 2. Deploy from Your Workstation
From your computer:
```bash
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock
npm install

# Save your phone's Wi-Fi IP address (stored in .phone_ip for future deploys)
npm run dock:ip 192.168.1.30

# Build, transfer assets, restart server, and reload phone display
npm run deploy
```

> **Tip:** `npm run deploy` uses OpenSSH multiplexing to prompt for your SSH password only once per session and includes an automatic connectivity pre-flight check. If your router reassigns your device's IP, simply run `npm run dock:ip <new-ip>`.

### 3. Launch ArcDock & Open Kiosk
On your phone in Termux, start the server:
```bash
python3 ~/arcdock_api.py &
```
Open **Fully Kiosk Browser** (or Chrome) to **`http://localhost:3000`**, tap Settings (⚙️), and paste your Home Assistant access token.

---

## 💻 Workstation Local Development

```bash
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock
npm install
npm run dev
```

### Spotify Developer Setup
1. Create an application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Set Redirect URIs to both:
   - `http://127.0.0.1:3000/callback`
   - `http://localhost:3000/callback`
3. In ArcDock Settings, enter your **Client ID** and tap **Authorize with Spotify**.

---

## 🔋 AMOLED Care & Thermal Longevity

* **True-Black Screensaver:** Pure `#000000` floating clock completely powers off OLED pixels after 5 minutes of idle pause.
* **Auto-Dimming:** Automatically drops display brightness in Fully Kiosk during sleep to eliminate heat, restoring day brightness on wake.
* **Micro Pixel Shifting:** Micro-translates the clock every 10 minutes to protect against static OLED burn-in.
* **80% Battery Charging Cap:** Built-in Android/LineageOS setting (`Settings → Battery → Charging Control`) eliminates battery swelling for 24/7 docked use.

---

## 📚 Documentation & Technical Guides

Deep architectural specifications, hardware guides, and API documentation are maintained in the [`docs/`](docs/) directory:

* **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** — Exhaustive hardware teardown, OEM setup (Pixel, Samsung, Xiaomi), LineageOS flashing, Termux toolchain, and auto-boot guides.
* **[docs/SYSTEM_SPEC.md](docs/SYSTEM_SPEC.md)** — Master technical architecture, background polling intervals, API rate limits, data schemas, and hardware profiles.
* **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** — Phase-by-phase actionable roadmap and completed milestones.
* **[docs/AI_LOG.md](docs/AI_LOG.md)** — Comprehensive engineering and architectural decision log tracking all debugging and features.

---

## 📄 License

Distributed under the **MIT License**. Built for the open-source, maker, and self-hosted community.
