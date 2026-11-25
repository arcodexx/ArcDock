#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# ArcDock — Target Phone Native Home Assistant Core Setup Script
# Architecture: Bare-Metal Android Bionic Python (Zero PRoot / Zero Deadlocks)
# Target Device: Xiaomi Redmi Note 10 Pro (sweet) / Any ARM64 Android Device
# ==============================================================================

set -e

echo "=========================================================="
echo "⚡ ArcDock: Initializing Native On-Device Home Assistant"
echo "=========================================================="

# 1. Acquire CPU Wake Lock to prevent Android from sleeping
echo "--> Acquiring CPU Wake Lock..."
termux-wake-lock

# 2. Update Termux Repositories
echo "--> Updating Termux package lists..."
pkg update -y

# 3. Install Native Pre-compiled Packages & Build Toolchain
echo "--> Installing native build tools & Bionic-patched libraries..."
pkg install -y \
    python \
    python-psutil \
    python-pillow \
    python-cryptography \
    python-bcrypt \
    build-essential \
    libffi \
    libjpeg-turbo \
    zlib \
    libsodium \
    c-ares \
    uv \
    git \
    curl \
    darkhttpd

# 4. Create Isolated Python Virtual Environment
echo "--> Initializing virtual environment (~/hass)..."
python3 -m venv --system-site-packages ~/hass
source ~/hass/bin/activate

# 5. Install Python Build Backends
echo "--> Installing wheel, setuptools, and build backends..."
pip install wheel setuptools maturin poetry-core flit-core cffi pybind11 cython

# 6. Install Pre-built ARM64 Wheels (Bypasses Slow Source Compilation)
echo "--> Installing pre-compiled multiarch wheels..."
# uv wheel
pip download --only-binary :all: --platform manylinux_2_17_aarch64 "uv==0.13.6"
mv uv-0.13.6-*.whl uv-0.13.6-py3-none-any.whl
pip install --no-deps uv-0.13.6-py3-none-any.whl
rm -f uv-*.whl

# grpcio wheel
pip download --only-binary :all: --platform manylinux_2_17_aarch64 grpcio
mv grpcio-*.whl grpcio-py3-none-any.whl
pip install --no-deps grpcio-py3-none-any.whl
rm -f grpcio-*.whl

# pycares & pynacl using system libraries
PYCARES_USE_SYSTEM_LIB=1 pip install --no-build-isolation pycares
SODIUM_INSTALL=system pip install --no-build-isolation pynacl

# 7. Install Home Assistant Core & Native Helper Libraries
echo "--> Installing Home Assistant Core..."
pip install --no-build-isolation homeassistant

echo "--> Installing voice activity & imaging helpers natively..."
pip install --no-binary :all: pymicro-vad pyspeex-noise PyTurboJPEG || true

# 8. Patch Android Platform Check
echo "--> Patching Home Assistant operating system check for Android..."
sed -i 's/sys.platform.startswith(("darwin", "linux"))/sys.platform.startswith(("darwin", "linux", "android"))/g' ~/hass/lib/python3.14/site-packages/homeassistant/__main__.py

# 9. Configure Android Bionic DNS Shim for Component Installation
echo "--> Configuring DNS shim for Home Assistant component manager..."
cat << 'EOF' > ~/hass/lib/python3.14/site-packages/uv/__main__.py
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
EOF

# 10. Configure Flash-Storage Safety & Clean Headless Core in configuration.yaml
echo "--> Creating clean core configuration.yaml..."
mkdir -p ~/.homeassistant

cat << 'CONFIG_EOF' > ~/.homeassistant/configuration.yaml
# ArcDock Clean Core Configuration (Headless / Zero D-Bus)

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

# Enable ArcDock touch dashboard CORS
http:
  cors_allowed_origins:
    - http://127.0.0.1:3000
    - http://localhost:3000
    - http://127.0.0.1:8123
    - http://localhost:8123
CONFIG_EOF

touch ~/.homeassistant/automations.yaml ~/.homeassistant/scripts.yaml ~/.homeassistant/scenes.yaml

# 11. Create Convenience Start Script
echo "--> Creating ~/start-hass.sh..."
cat << 'EOF' > ~/start-hass.sh
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
source /data/data/com.termux/files/home/hass/bin/activate
hass
EOF
chmod +x ~/start-hass.sh

echo "=========================================================="
echo "🎉 ArcDock Home Assistant Setup Complete!"
echo "Start Home Assistant by running: ~/start-hass.sh"
echo "Web interface will be available at: http://localhost:8123"
echo "=========================================================="
