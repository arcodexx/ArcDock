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

Old smartphones and tablets often end up forgotten in drawers despite having great screens, Wi-Fi, and capable processors.

**ArcDock** gives these devices a second life as a dedicated, ambient touch dock beside your keyboard or on your vehicle dashboard.

* **Audio Remote, Not Player:** Controls playback on any connected device (speakers, computer, TV, or car audio) via Spotify Connect without playing audio through the phone.
* **On-Device Home Assistant:** Runs directly on the phone in Termux—no external server, cloud dependency, or Raspberry Pi required.
* **Desk Dashboard:** Shows your GitHub activity, upcoming meetings, package deliveries, habits, and timezones at a glance.

```
                           ┌──────────────────────────────────────────────┐
                           │                   ArcDock                    │
                           │          Dedicated Smart Touch Dock          │
                           │        (Any Repurposed Touch Device)         │
                           └──────┬──────────────┬──────────────┬─────────┘
                                  │              │              │
        ┌─────────────────────────┘              │              └─────────────────────────┐
        ▼                                        ▼                                        ▼
🎵 Media Remote                        🏠 Local IoT Core                       🛠️ Desk Dashboard
(Spotify Connect Controller)           (On-Device Native HA Core)              (Live Glanceable Cards)
• Controls any connected device        • Runs locally on device                • GitHub Commits & Streaks
• Dynamic album art backdrops          • AC Climate & temperature              • Package Delivery Tracking
• Queue, playlists & search            • Desk lights & room sync               • Calendar & Meeting Radar
• Synchronized lyrics                  • 100% offline & local                  • Shared LAN Clipboard (/clip)
```

---

## ✨ Features

* **Spotify Remote:** Controls playback on any device (computer, speakers, TV, car) with album art, queue, search, playlists, and lyrics.
* **Smart Desk IoT:** Controls AC temperature/modes and desk lights via Home Assistant running on the device.
* **Control Center Drawer:** Swipe down from the top to open any widget full-screen or pin your favorites.
* **Calendar & Meetings:** Shows upcoming events from your calendar (.ics) with a countdown and 1-tap Google Meet/Zoom links.
* **GitHub Tracker:** Shows today's commit count, contribution streak, open PRs, and recent activity.
* **Parcel Tracking:** Track shipments across Indian couriers (Delhivery, Blue Dart, DTDC, Speed Post, Ekart).
* **Weather:** Current temperature, conditions, hourly forecast, and location search.
* **Network Monitor:** Live ping latency and connection stability indicator.
* **Pomodoro Timer:** Focus and break timer that can trigger desk lighting scenes.
* **Habit Tracker:** Daily habit checklist with a 7-day streak view.
* **World Clock:** Track time across multiple cities with working hours indicator and 12h/24h toggle.
* **Shared Clipboard:** Paste text from any laptop or phone on your Wi-Fi at `/clip` to view and copy it on the dock.
* **OLED Screensaver:** Standby clock with burn-in protection, multiple clock styles, and daily quotes.
* **Car Mode:** Full-screen music remote that hides personal widgets and locks with a PIN.
* **Themes:** 5 visual styles (Default OLED, Japan Zen, Apple Glass, Retro Radio, and Cyberpunk).

---

## 🚀 Quick Start

ArcDock runs on almost any Android phone or tablet. It works on regular stock Android right out of the box—no rooting, bootloader unlocking, or custom ROMs required.

### 1. Install Home Assistant on the Device
In **Termux** on your phone, run the installer:
```bash
curl -sL https://raw.githubusercontent.com/arcodexx/ArcDock/main/scripts/setup-phone-ha.sh | bash
```
Once complete, start Home Assistant with `~/start-hass.sh` and set up your account at `http://localhost:8123`.

### 2. Deploy from Your Computer
From your computer:
```bash
git clone https://github.com/arcodexx/ArcDock.git
cd ArcDock
npm install

# Save your phone's Wi-Fi IP address (stored in .phone_ip for future deploys)
npm run dock:ip -- 192.168.1.30

# Build and deploy to the phone
npm run deploy
```

> **Tip:** If your phone's IP address changes, update it with `npm run dock:ip -- <new-ip>`.

### 3. Launch ArcDock & Open Kiosk
On your phone in Termux, start the server:
```bash
python3 ~/arcdock_api.py &
```
Open **Fully Kiosk Browser** (or Chrome) to **`http://localhost:3000`**, tap Settings (⚙️), and paste your Home Assistant token.

---

## 💻 Local Development

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

## 🔋 Screen & Battery Care

* **True-Black Screensaver:** Turns off OLED pixels with a pure black clock after 5 minutes of inactivity.
* **Auto-Dimming:** Dims the screen during sleep to keep the phone cool while charging, restoring brightness on wake.
* **Pixel Shifting:** Moves the clock slightly every 10 minutes to prevent screen burn-in.
* **Battery Protection:** Recommends using Android's built-in 80% charging limit (`Settings → Battery → Charging Control`) for 24/7 docked use.

---

## 📚 Documentation

Detailed setup instructions and technical specifications are in the [`docs/`](docs/) folder:

* **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** — Step-by-step phone setup, OEM guides, and Termux toolchain details.
* **[docs/SYSTEM_SPEC.md](docs/SYSTEM_SPEC.md)** — Architecture reference, data schemas, and polling intervals.
* **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** — Project roadmap and completed phases.
* **[docs/AI_LOG.md](docs/AI_LOG.md)** — Engineering decision log and debugging notes.

---

## 📄 License

Distributed under the **MIT License**. Built for the open-source and self-hosted community.
