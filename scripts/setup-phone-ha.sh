#!/bin/bash
# ==============================================================================
# ArcDock — Target Phone Home Assistant Core Setup Script (Termux PRoot Ubuntu)
# Target Device: Xiaomi Redmi Note 10 Pro (sweet) / Any ARM64 Android Device
# ==============================================================================

set -e

echo "================================================"
echo "⚡ ArcDock: Initializing On-Device Home Assistant"
echo "================================================"

# 1. Acquire CPU Wake Lock to prevent Android from idling the installer
echo "--> Acquiring CPU Wake Lock..."
termux-wake-lock

# 2. Update Termux packages & install PRoot Distro
echo "--> Updating Termux base packages..."
pkg update -y && pkg upgrade -y
pkg install proot-distro curl wget git -y

# 3. Install Ubuntu 24.04 PRoot environment
if ! proot-distro list | grep -q "ubuntu.*installed"; then
    echo "--> Installing Ubuntu PRoot container..."
    proot-distro install ubuntu
else
    echo "--> Ubuntu PRoot container already installed."
fi

# 4. Generate the internal setup script to run inside Ubuntu PRoot
echo "--> Preparing internal Ubuntu environment..."

cat << 'EOF' > $PREFIX/var/lib/proot-distro/installed-rootfs/ubuntu/root/setup-hass-internal.sh
#!/bin/bash
set -e

echo "--> [Ubuntu] Updating system repositories..."
apt update && apt upgrade -y

echo "--> [Ubuntu] Installing Python 3 & pre-compiled cryptographic libraries..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-cryptography \
    python3-cffi \
    python3-bcrypt \
    libffi-dev \
    libssl-dev \
    libjpeg-dev \
    zlib1g-dev \
    gcc \
    g++ \
    curl \
    tzdata

echo "--> [Ubuntu] Creating isolated Python virtual environment (~/hass-venv)..."
if [ ! -d "/root/hass-venv" ]; then
    python3 -m venv /root/hass-venv
fi

source /root/hass-venv/bin/activate
pip install --upgrade pip wheel

echo "--> [Ubuntu] Installing Home Assistant Core and voice/audio pipeline helpers..."
pip install homeassistant pymicro-vad pyspeex-noise

echo "--> [Ubuntu] Creating flash-storage safe configuration.yaml..."
mkdir -p /root/.homeassistant

cat << 'CONFIG_EOF' > /root/.homeassistant/configuration.yaml
# ArcDock Flash-Safe Home Assistant Configuration
default_config:

# Optimize SQLite writes to protect phone UFS 2.2 flash lifespan
recorder:
  commit_interval: 30
  purge_keep_days: 3
  exclude:
    domains:
      - media_player

http:
  cors_allowed_origins:
    - http://127.0.0.1:3000
    - http://localhost:3000
    - http://127.0.0.1:8123
    - http://localhost:8123

frontend:
CONFIG_EOF

echo "--> [Ubuntu] Setup complete! You can start Home Assistant with: hass"
EOF

chmod +x $PREFIX/var/lib/proot-distro/installed-rootfs/ubuntu/root/setup-hass-internal.sh

# 5. Execute internal setup inside Ubuntu PRoot
echo "--> Launching Ubuntu PRoot to install Home Assistant..."
proot-distro login ubuntu -- /root/setup-hass-internal.sh

# 6. Create convenience startup script in Termux home
cat << 'EOF' > ~/start-arcdock-ha.sh
#!/bin/bash
echo "⚡ Starting ArcDock Home Assistant Core..."
termux-wake-lock
proot-distro login ubuntu -- /bin/bash -c "source /root/hass-venv/bin/activate && hass"
EOF

chmod +x ~/start-arcdock-ha.sh

echo "================================================"
echo "🎉 ArcDock Home Assistant Setup Complete!"
echo "================================================"
echo "To start Home Assistant at any time in Termux, run:"
echo "  ./start-arcdock-ha.sh"
echo ""
echo "Access the dashboard on your phone or local network at:"
echo "  http://localhost:8123"
echo "================================================"
