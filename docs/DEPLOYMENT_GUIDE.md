# ArcDock Universal Hardware Deployment Guide 📱⚡

> **Universal field deployment manual for converting ANY spare Android smartphone, tablet, or touch display into a dedicated, standalone ambient desk dock & IoT command kiosk.**

| Target Compatibility | Specification / Recommendations |
| :--- | :--- |
| **Supported Devices** | **Any Android Phone, Tablet, or Touch Display** (Google Pixel, Samsung Galaxy, OnePlus, Motorola, Xiaomi/Redmi/Poco, Lenovo Tab, Amazon Fire, etc.) |
| **Architecture** | **ARM64 (aarch64)** or **ARMv7 (armhf)** |
| **Android Version** | **Android 9.0 (Pie) through Android 16+** |
| **OS Mode** | **100% Stock Factory Android (No Root / No Flashing Required)** OR Custom ROMs (LineageOS, PixelExperience, crDroid, PostmarketOS) |
| **Minimum Hardware** | 2 GB RAM / 16 GB Storage / Wi-Fi 802.11n |
| **Recommended Hardware** | 4–6 GB RAM / AMOLED Display (for true black pixel turn-off) / 90–120Hz refresh |
| **Field Benchmark Reference** | Xiaomi Redmi Note 10 Pro (`sweet`, Snapdragon 732G, 6.67" 120Hz Super AMOLED, 6GB RAM, LineageOS 23.2) |

---

## 📑 Table of Contents
1. [Architectural Overview & Core Decisions](#1-architectural-overview--core-decisions)
2. [Physical Device Preparation & Android OS Setup (Any OEM / Stock or Custom ROM)](#2-physical-device-preparation--android-os-setup-any-oem--stock-or-custom-rom)
3. [The PRoot / Docker Emulation Fallacy on Android Kernels](#3-the-proot--docker-emulation-fallacy-on-android-kernels)
4. [Native Termux Python Architecture (Bare Metal)](#4-native-termux-python-architecture-bare-metal)
5. [The Build Toolchain & Android Bionic Patches](#5-the-build-toolchain--android-bionic-patches)
6. [Flash Storage Longevity (UFS / eMMC Safety) & Clean Headless Core](#6-flash-storage-longevity-ufs--emmc-safety--clean-headless-core)
7. [Zero-Touch Boot & Kiosk Mode Automation](#7-zero-touch-boot--kiosk-mode-automation)
8. [Workstation Deployment Automation & Dynamic IP Tooling (`dock.sh`)](#8-workstation-deployment-automation--dynamic-ip-tooling-docksh)
9. [Web Server Options in Termux: darkhttpd vs. arcdock_api.py](#9-web-server-options-in-termux-darkhttpd-vs-arcdock_apipy)
10. [Field Debugging & Real-World Troubleshooting Log](#10-field-debugging--real-world-troubleshooting-log)

---

## 1. Architectural Overview & Core Decisions

ArcDock is designed as a standalone, zero-touch ambient smart desk dock and passenger car kiosk. To meet the core requirement of running Home Assistant Core on-device without an external server, the system is architected to run directly on Android's native Linux layer:

```
┌─────────────────────────────────────────────────────────────────┐
│ Any Android Phone, Tablet, or Touch Display (Stock or Custom)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Fully Kiosk Browser / Chrome PWA ] (Fullscreen, Kiosk Mode)   │
│          │                                                      │
│          ▼ HTTP (localhost:3000)                                │
│  [ darkhttpd / arcdock_api.py ] Static Server + LAN Clipboard   │
│          │                                                      │
│          ▼ WebSocket & REST (localhost:8123)                    │
│  [ Home Assistant Core 2026.11.2 ] (Native Termux Python 3.14)  │
│          │                                                      │
│          ├── SQLite Database (Buffered 30s commit interval)      │
│          └── Bionic Libc Networking (Zero container overhead)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Physical Device Preparation & Android OS Setup (Any OEM / Stock or Custom ROM)

ArcDock is completely OEM-agnostic. You do **not** need a specific brand, and you do **not** need to install a custom ROM if you prefer not to.

### 2.1 Factory Stock Android vs. Custom ROM
* **Option A: Factory Stock Android (Recommended for Zero-Fuss Setup):**
  - **Works out of the box** on Samsung Galaxy, Google Pixel, Motorola, OnePlus, Xiaomi/Redmi, Lenovo tablets, and Amazon Fire tablets.
  - Requires **zero flashing, zero bootloader unlocking, and zero root permissions**.
  - Simply install **Termux** (from F-Droid) and **Fully Kiosk Browser** (or Chrome PWA), then run the setup script.
* **Option B: Clean Custom ROM (LineageOS, PixelExperience, crDroid, PostmarketOS):**
  - Recommended if your spare phone is bogged down by carrier bloatware or OEM background task killers.
  - Provides built-in kernel-level battery charging caps (e.g. 80%) to protect against battery swelling for 24/7 docked use.

### 2.2 Bootloader Unlocking Across OEMs (If Flashing a Custom ROM)
If you decide to flash LineageOS or a custom AOSP ROM:
* **Google Pixel / Motorola / OnePlus / Nothing / Sony:**
  - Turn ON `OEM Unlocking` and `USB Debugging` in Developer Options.
  - Reboot to bootloader (`adb reboot bootloader`) and run:
    ```bash
    fastboot flashing unlock
    # (or on older models: fastboot oem unlock)
    ```
  - Instant unlock with zero wait period.
* **Xiaomi / Redmi / Poco:**
  - Add your Xiaomi account under `Settings → Developer Options → Mi Unlock Status`.
  - Connect device in Fastboot mode (`Power + Volume Down`) and unlock using the official PC `miunlock` tool.
* **Samsung Galaxy:**
  - Turn ON `OEM Unlocking` in Developer Options.
  - Power down, hold both `Volume Up + Volume Down` while plugging into USB to enter Download Mode, then long-press `Volume Up` for Device Unlock Mode.
* **Amazon Fire Tablets & Generic Tablets:**
  - Use Fire Toolbox for Amazon debloating, or standard Fastboot / MTKClient for MediaTek-based generic Android displays.

### 2.3 Reference Benchmark Flashing (Xiaomi Redmi Note 10 Pro)
*As a concrete reference implementation, our primary test bench uses a Xiaomi Redmi Note 10 Pro (`sweet`):*
1. Downloaded LineageOS 23.2 recovery and nightly build:
   - Recovery: `lineage-23.2-recovery-sweet.img`
   - OS ROM: `lineage-23.2-nightly-sweet-signed.zip`
2. Flashed recovery and vendor boot partitions:
   ```bash
   fastboot flash boot boot.img
   fastboot flash recovery lineage-23.2-recovery-sweet.img
   fastboot reboot recovery
   ```
3. In LineageOS Recovery:
   - Selected `Factory Reset → Format data/cache`.
   - Selected `Apply update → Apply from ADB`.
   - On host workstation: `adb sideload lineage-23.2-nightly-sweet-signed.zip`.
4. Rebooted system into LineageOS.

### 2.4 Universal Android Settings & Power Longevity (Apply to ANY Device)
Regardless of device brand or OS, configure these settings for 24/7 docked reliability:
* **24/7 Battery Protection (Prevent Battery Swelling):**
  - **LineageOS / Custom ROMs:** Enable `Settings → Battery → Charging control → Limit charging at 80%`.
  - **Samsung Galaxy:** Enable `Settings → Battery → Protect Battery` (caps charge at 80% or 85%).
  - **Google Pixel:** Enable `Settings → Battery → Adaptive Charging`.
  - **Stock Android without built-in cap:** Plug the dock into a smart plug connected to Home Assistant, and create an automation: *Turn plug OFF when battery > 80%, Turn plug ON when battery < 20%*.
* **Display & Refresh Rate:**
  - If your device features a 90Hz or 120Hz display (e.g. Super AMOLED), enable `Settings → Display → Smooth Display` for ultra-fluid touch response.
  - Set Screen Timeout to maximum or enable Fully Kiosk Browser's "Keep Screen On While Connected".
* **Developer Options (Essential for All Android Devices):**
  - **USB Debugging:** ON (enables one-command deploys from your workstation via `dock.sh`).
  - **Stay awake while charging:** ON (keeps CPU active on the desk dock).
  - **Disable child process restrictions (Android 12+):** ON (vital! Prevents Android's Phantom Process Killer from terminating Termux background workers).
* **Battery Optimization Exemption:**
  - Under `Settings → Apps → Special app access → Battery optimization` (or individual App Info), set **Termux**, **Termux:Boot**, and **Fully Kiosk Browser** to **Unrestricted** (or "Don't optimize").
* **Display Over Other Apps:**
  - Grant permission to **Termux** and **Fully Kiosk Browser** so startup boot scripts can bring the dashboard to the foreground automatically.

---

## 3. The PRoot / Docker Emulation Fallacy on Android Kernels

Early installation attempts utilized `proot-distro` (Ubuntu ARM64) and `udocker`. Both failed fundamentally due to kernel-level Seccomp restrictions present on modern Android:
* **The Root Cause:** Devices running Linux kernels 4.x, 5.x, or 6.x under Android 10+ enforce strict modern Seccomp syscall filtering.
* **The Deadlock:** PRoot relies on `ptrace(PTRACE_GETEVENTMSG)` to intercept file and network syscalls. On Android with Seccomp, `ptrace` enters an uninterruptible kernel sleep (**State `D`**), freezing execution permanently at byte 0.
* **The Resolution:** Completely abandon PRoot and user-space emulation containers. Run Home Assistant Core and web servers **directly on native Android Bionic libc** via Termux Python and native C binaries. This architecture runs universally across all ARM64 and ARMv7 Android devices!

---

## 4. Native Termux Python Architecture (Bare Metal)

Running natively in Termux eliminates ptrace entirely. Python calls Android's Bionic libc directly, achieving native CPU speeds and rock-solid stability.

### Key Pre-compiled Termux Packages
Rather than compiling heavy C/Rust extensions from source, we leverage Termux's official native packages patched specifically for Android Bionic:
* `python-psutil`: Patched for Android `/proc` filesystem and SELinux.
* `python-cryptography` (v50.0.2): Pre-compiled native ARM64 `.so` linked against Termux OpenSSL.
* `python-bcrypt` (v5.0.0): Pre-compiled native ARM64 `.so`.
* `python-pillow`: Pre-compiled imaging library.

---

## 5. The Build Toolchain & Android Bionic Patches

### 5.1 Memory Capping for Rust Compilation
When building Python wheels that contain Rust crates on ARM64, the default Cargo configuration attempts to use all 8 CPU cores simultaneously, causing RAM usage to exceed 4.5 GB and triggering Android's Low Memory Killer (LMK).
* **Fix:** Export `export CARGO_BUILD_JOBS=2` in `~/.bashrc`. This keeps RAM usage strictly under 1.2 GB throughout all compilation stages.

### 5.2 Bypass Heavy Compilation with Multiarch Wheels
Certain packages (such as `uv` and `grpcio`) require thousands of C++/Rust files. We bypass compilation completely by downloading the pre-compiled `manylinux_2_17_aarch64` wheels from PyPI, renaming them to `py3-none-any.whl`, and installing them with `--no-deps`:
```bash
pip download --only-binary :all: --platform manylinux_2_17_aarch64 "uv==0.13.6"
mv uv-0.13.6-*.whl uv-0.13.6-py3-none-any.whl
pip install --no-deps uv-0.13.6-py3-none-any.whl
```

### 5.3 Home Assistant Android Platform Check Patch
Home Assistant's `homeassistant/__main__.py` includes an operating system validator that defaults to rejecting Android:
```python
def validate_os() -> None:
    if not sys.platform.startswith(("darwin", "linux")):
        sys.exit(1)
```
On Android, `sys.platform` returns `'android'`. We patch this line to allow Android natively:
```bash
sed -i 's/sys.platform.startswith(("darwin", "linux"))/sys.platform.startswith(("darwin", "linux", "android"))/g' ~/hass/lib/python3.14/site-packages/homeassistant/__main__.py
```

### 5.4 The Android Bionic Netd DNS Shim (`uv/__main__.py`)
Home Assistant Core hardcodes calls to `python -m uv pip install <package>` for downloading integration dependencies on the fly.
* **The Problem:** The `uv` binary is compiled with Rust's asynchronous DNS resolver (`hickory-dns`), which looks for `/etc/resolv.conf`. Android does not use `/etc/resolv.conf`; it resolves DNS through the Android Netd system daemon over local UNIX domain sockets. As a result, `uv pip` fails with `failed to lookup address information`.
* **The Solution:** Standard `pip` uses Python's native `socket.getaddrinfo()`, which calls Android Bionic libc directly and resolves DNS perfectly. We create a lightweight shim in `uv/__main__.py` that intercepts all `uv pip` calls from Home Assistant and routes them seamlessly through standard `pip`:

```python
import sys, subprocess, os

def _run():
    args = sys.argv[1:]
    if args and args[0] == "pip":
        pip_args = []
        skip_next = False
        for arg in args[1:]:
            if skip_next:
                skip_next = False
                continue
            if arg == "--index-strategy":
                skip_next = True
                continue
            if arg in ("unsafe-first-match", "--unsafe-first-match"):
                continue
            pip_args.append(arg)
        sys.exit(subprocess.run([sys.executable, "-m", "pip"] + pip_args).returncode)
    else:
        from uv import find_uv_bin
        uv = find_uv_bin()
        os.execvpe(uv, [uv] + args, os.environ)

if __name__ == "__main__":
    _run()
```

### 5.5 Voice Activity & Camera Acceleration (`pymicro_vad`, `pyspeex_noise`, `PyTurboJPEG`)
When Home Assistant loads integration schemas over WebSocket API (`handle_get_services`), it checks service definitions for `assist_pipeline` and `camera`.
* **The Problem:** Pre-built binary wheels for `pymicro_vad` and `pyspeex_noise` fail with `dlopen failed: cannot locate symbol "_ZNSt6__ndk113__hash_memoryEPKvm"` due to ABI differences in older NDK libc++.
* **The Solution:** Compile them natively against Termux's current Clang/libc++ toolchain with `--no-binary :all:`, and install `PyTurboJPEG` for JPEG image rendering:
```bash
pip install --no-binary :all: pymicro-vad pyspeex-noise PyTurboJPEG
```

---

## 6. Flash Storage Longevity (UFS / eMMC Safety) & Clean Headless Core

Smartphones and tablets utilize UFS or eMMC flash memory that is sensitive to high-frequency SQLite write cycles. Default Home Assistant installations (`default_config:`) also attempt to spawn Bluetooth D-Bus daemons and packet sniffer filters (`scapy`) that crash on non-rooted Android.

We enforce a lean, clean Core configuration in `~/.homeassistant/configuration.yaml`:
```yaml
# ArcDock Clean Core Configuration (Headless / Zero D-Bus / Flash Safe)

frontend:
history:
logbook:
recorder:
  commit_interval: 30
  purge_keep_days: 3
  exclude:
    domains:
      - media_player
      - camera

sun:
sensor:
switch:
light:
climate:
automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml

# Enable CORS for local ArcDock frontend
http:
  cors_allowed_origins:
    - http://127.0.0.1:3000
    - http://localhost:3000
    - http://127.0.0.1:8123
    - http://localhost:8123
```

---

## 7. Zero-Touch Boot & Auto-Launch Automation (100% Free / Zero Paid Licenses)

To achieve zero manual intervention after power-on or vehicle ignition without paying for Kiosk app licenses:

### 7.1 Android System Permissions
1. **Bypass Lock Screen on Power-On:**
   - Under `Settings → Security → Screen lock`, set Screen Lock to **None**.
   - In `Settings → Developer Options`, turn ON **Skip screen lock**.
2. **Foreground Activity Permission:**
   - Go to `Settings → Apps → Special app access → Display over other apps`.
   - Enable **Termux** and **Fully Kiosk Browser** (allows background boot scripts to launch the browser straight to the front).

### 7.2 Automated Background Startup (Termux:Boot)
1. Install **Termux:Boot** application from F-Droid.
2. Launch the Termux:Boot app once to register the Android system `BOOT_COMPLETED` broadcast receiver.
3. In Android `Settings → Apps → Termux:Boot → Battery`, set to **Unrestricted**.
4. Create the robust startup script `~/.termux/boot/start-arcdock.sh`:
   ```bash
   #!/data/data/com.termux/files/usr/bin/bash
   termux-wake-lock
   sshd
   
   # Start ArcDock + LAN Clipboard server
   python3 /data/data/com.termux/files/home/arcdock_api.py &
   
   # Start Home Assistant Core directly via virtualenv binary
   /data/data/com.termux/files/home/hass/bin/hass &
   
   # Launch browser into ArcDock dashboard
   sleep 3
   am start -a android.intent.action.VIEW -d "http://localhost:3000"
   ```
5. Set executable permissions: `chmod +x ~/.termux/boot/start-arcdock.sh`.

### 7.3 Fully Kiosk Browser Free Setup
1. Set **Start URL** to `http://localhost:3000`.
2. Under `Device Management → Orientation`, set to **Force Landscape**.
3. Under `Web Content Settings`, enable **Enable Text Selection**.
4. Under `Other Settings`, enable **Run on Device Boot** and **Keep Screen On While Connected**.

---

## 8. Workstation Deployment Automation & Dynamic IP Tooling (`dock.sh`)

To eliminate tedious manual SSH commands during active UI development, the repository includes a custom deployment harness (`scripts/dock.sh`):

### 8.1 Zero-Config Phone IP Management
DHCP routers often lease new IP addresses to mobile devices. Rather than hardcoding IP addresses inside deployment scripts, ArcDock persists the active phone IP in a `.phone_ip` file at the project root:
```bash
# Save new IP address
npm run dock:ip 192.168.1.30

# Output:
# ✅ Saved phone IP: 192.168.1.30 (future deploy/reload will target this IP)
```
Subsequent commands (`npm run deploy`, `npm run reload`) read from `.phone_ip` automatically.

### 8.2 Deployment Pipeline (`npm run deploy`)
Executing `npm run deploy` performs a 5-stage automated pipeline:
1. **Production Build:** Runs `vue-tsc && vite build` on the workstation, producing optimized static chunks in `dist/`.
2. **Directory Verification:** Ensures remote destination directories exist on the phone over Termux SSH port `8022`.
3. **Delta Asset Transfer:** Transfers only modified HTML, CSS, JavaScript chunks, manifest, and `arcdock_api.py` via `scp`.
4. **Graceful Server Respawn & Readiness Polling:**
   - Kills any existing Python processes bound to port 3000.
   - Launches `arcdock_api.py` in the background with stdout/stderr redirected to `~/arcdock.log`.
   - Actively polls port 3000 with `nc -z` up to 10 iterations to verify socket readiness before proceeding.
5. **Instant Screen Force-Refresh:** Sends an Android Intent via `am start` over SSH to force Fully Kiosk Browser to reload the page and display the new build immediately.

---

## 9. Web Server Options in Termux: darkhttpd vs. arcdock_api.py

To serve the ArcDock Vue 3 dashboard on Android via Termux, you have two options depending on your needs. The installer script (`setup-phone-ha.sh`) provisions both:

### 9.1 Option A: `darkhttpd` (Ultra-Fast C Static Daemon)
`darkhttpd` is a lightweight, zero-configuration static web server written in pure C for POSIX systems, officially distributed via Termux's package repository (`pkg install -y darkhttpd`).

* **Resource Footprint:**
  - Memory: **< 2 MB RAM**
  - Binary Size: **~50 KB**
  - CPU Overhead: Virtually **0.0%**
* **Usage:**
  ```bash
  darkhttpd ~/arcdock/dist --port 3000 &
  ```
* **Best Suited For:** Low-spec devices (1–2 GB RAM), older Android tablets, or when you only require pure static SPA delivery and do not need cross-device LAN clipboard features.
* **Limitations:** Does not support dynamic HTTP POST endpoints or custom REST APIs; purely serves files from disk.

### 9.2 Option B: `arcdock_api.py` (Unified Python 3 Server with LAN Clipboard — Recommended)
Implemented in **100% standard library Python 3** with zero external pip dependencies (`scripts/arcdock_api.py`). It extends static web serving with smart device integrations:

```
Client (Fully Kiosk / Laptop Browser)
   │
   ├── GET  /                   ──▶ Serves dist/index.html (SPA Entry)
   ├── GET  /assets/*           ──▶ Serves Vite JS/CSS chunks with MIME headers
   ├── GET  /clip               ──▶ Serves self-contained LAN Clipboard Web UI
   ├── GET  /api/clipboard      ──▶ Returns latest clipboard JSON payload
   ├── POST /api/clipboard      ──▶ Receives clip text from phone or laptop
   ├── GET  /api/system/info    ──▶ Returns LAN IP & active port for QR pairing
   └── POST /api/system/restart ──▶ Spawns background subshell to respawn server
```

* **Key Advantages over darkhttpd:**
  1. **Built-in LAN Clipboard (`/clip`):** Instant bi-directional copy/paste between phone dock, MacBook, and PC over LAN without cloud synchronization.
  2. **Device Discovery (`/api/system/info`):** Auto-detects the phone's local Wi-Fi IP and active port for pairing QR codes.
  3. **Touchscreen Server Restart (`/api/system/restart-server`):** Allows restarting the web server directly from the touchscreen UI without opening Termux terminal.
* **Usage:**
  ```bash
  python3 ~/arcdock_api.py &
  ```

### 9.3 Self-Contained Server Restart (`/api/system/restart-server`)
Allows the frontend to trigger a backend reload directly from the touch screen:
```python
def handle_restart_server(self):
    self.send_response(200)
    self.send_header('Content-Type', 'application/json')
    self.end_headers()
    self.wfile.write(json.dumps({"status": "restarting"}).encode('utf-8'))

    # Respawn in background subshell after short delay
    restart_cmd = (
        "sleep 0.5 && "
        "pkill -f 'python.*arcdock_api.py' || true && "
        "nohup python3 /data/data/com.termux/files/home/arcdock_api.py > ~/arcdock.log 2>&1 &"
    )
    subprocess.Popen(restart_cmd, shell=True)
```

---

## 10. Field Debugging & Real-World Troubleshooting Log

### 10.1 Issue 1: Python Scoping Bug (`UnboundLocalError: urllib`)
* **Symptom:** During deployment verification, port 3000 failed to start. Log showed:
  ```
  UnboundLocalError: cannot access local variable 'urllib' where it is not associated with a value
  ```
* **Root Cause:** A nested handler inside `do_GET` contained an inline `import urllib.request`. In Python, defining an import or assigning to a variable anywhere inside a function flags that identifier as a local variable across the entire function scope. Any prior reference to `urllib.parse` earlier in `do_GET` failed before reaching the import statement.
* **Resolution:** Moved all imports (`urllib.request`, `urllib.parse`, `json`, `subprocess`, `socket`) to top-level module scope in `scripts/arcdock_api.py`.

### 10.2 Issue 2: iCal Meeting 4.5-Hour Timezone Shift (Outlook / Google Calendar)
* **Symptom:** User's 3:30 PM IST meeting was displayed as 11:00 AM on the dock.
* **Root Cause:**
  1. The meeting was organized in Western Europe / CET (`W. Europe Standard Time` / `Europe/Paris`, UTC+1). 11:00 AM in UTC+1 equals 10:00 AM UTC, which equals **3:30 PM IST** (`+05:30`).
  2. The parser checked only for `kolkata|calcutta|india|ist`. For any other `TZID`, it stripped the timezone parameter and treated the raw string `11:00` as local Indian Standard Time!
  3. Additionally, `CalendarView.vue` contained raw template calls to `toLocaleTimeString([])` without explicit timezone options, causing Android WebView instances to fall back to UTC.
* **Resolution:**
  - Built dynamic `VTIMEZONE` block indexing with `TZOFFSETTO` parsing in `src/stores/calendar.ts`.
  - Added `KNOWN_TZ_OFFSETS` dictionary covering Windows and standard IANA timezone definitions.
  - Implemented `Intl.DateTimeFormat` offset calculation for arbitrary IANA timezones.
  - Added pre-computed `startTimeFormatted` and `endTimeFormatted` formatted strictly in `Asia/Kolkata`.

### 10.3 Issue 3: Stale Android WebView Disk Cache
* **Symptom:** Deploying new Vite bundles to the phone did not immediately reflect on Fully Kiosk Browser until a manual cache wipe.
* **Root Cause:** Android System WebView caches JavaScript and CSS aggressively even across page reloads.
* **Resolution:**
  - Added Fully Kiosk JavaScript interface call: `window.fully?.clearCache?.(true)`.
  - Appended timestamp query parameters (`?t=<Date.now()>`) during UI reload requests.
  - Built the **Dock Power & Restart Modal** (`DockPowerModal.vue`) directly into the header for one-tap cache-purged reloads.

### 10.4 Issue 4: Touch Target Ergonomics on Landscape Ambient Screen
* **Symptom:** UI buttons designed for desktop mouse clicks were frustratingly difficult to tap with a finger on the 6.67" phone display.
* **Constraint:** The landscape viewport height is approximately **360px**. Simply scaling up containers would push cards offscreen and introduce unwanted vertical page scrolling.
* **Resolution:**
  - Applied Google Material Design minimum touch target guidelines (**44–48dp**).
  - Enlarged critical interactive elements (AC stepper buttons to 44px, AC power to 40px, dropdown triggers to 40px, brightness trigger to 36px, settings/mode toggles to 40px).
  - Used internal padding and micro-scaling without expanding parent container bounding boxes, preserving the zero-scroll layout.

### 10.5 Issue 5: SmartThings / Samsung WindFree AC Integration
* **Architecture:** Samsung WindFree Air Conditioners connect via the official **SmartThings** integration in Home Assistant.
* **Configuration:**
  1. Generate a Personal Access Token in the Samsung SmartThings Developer Portal.
  2. In Home Assistant (`Settings → Devices & Services → Add Integration`), select **SmartThings**.
  3. The entity appears as `climate.<ac_name>` exposing target temperature, HVAC modes (`cool`, `dry`, `fan_only`, `heat`, `auto`), and fan modes (`auto`, `low`, `medium`, `high`, `windfree`).
  4. ArcDock automatically discovers `climate.*` entities through the Home Assistant WebSocket API and renders full touch controls in `ClimateCard.vue`.

### 10.6 Issue 6: Duplicate Meeting on Next Day (Cancelled Events & Multi-Calendar Collision)
* **Symptom:** A meeting appeared twice on the next day with the same data.
* **Root Cause:**
  1. When meetings are rescheduled or updated in Google Calendar/Outlook, exported `.ics` feeds often retain the old instance with `STATUS:CANCELLED` alongside the updated event. The parser had no check for `STATUS:CANCELLED`.
  2. Shared multi-calendar setups (e.g. personal and company calendars) can export duplicate VEVENTs.
* **Resolution:**
  - Added filter in `parseIcsText` to skip any event with `STATUS:CANCELLED`.
  - Added multi-key deduplication checking `(UID + StartTime)` and `(NormalizedTitle + StartTime)` within a 60-second window. Duplicate entries merge metadata (meeting URLs, descriptions) rather than rendering twice.

### 10.7 Issue 7: Cold-Boot Wi-Fi Delay & Zero-Touch Warm-Up Sync
* **Symptom:** After powering off and on the phone, widgets (Calendar, GitHub, Weather) stayed empty until manually refreshed.
* **Root Cause:** Fully Kiosk Browser loads `localhost:3000` within 1–3 seconds, but Android Wi-Fi DHCP handshake takes 5–15 seconds after a cold boot. Initial fetch attempts at 0s failed due to no network route.
* **Resolution:**
  - Added post-boot warm-up retries in `TopBar.vue` at **5 seconds** and **15 seconds** after mount.
  - Added `window.addEventListener('online', ...)` to trigger an immediate full sync the exact instant Wi-Fi connects.
  - Added in-store fallback retries (10s) in `calendar.ts` and `github.ts` if initial load fails on empty stores.
