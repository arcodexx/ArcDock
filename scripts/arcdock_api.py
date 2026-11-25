#!/usr/bin/env python3
"""
ArcDock Unified LAN Server & API Bridge
- Serves static dashboard assets (dist/)
- Serves standalone /clip portal
- Handles /api/clipboard (GET/POST) for instant cross-device sharing
- Handles /api/info (GET) with automatic LAN IP detection
"""

import os
import sys
import json
import time
import socket
import urllib.parse
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 3000
HA_PORT = 8123

# Determine dist directory location (must contain index.html)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
POSSIBLE_DIST_DIRS = [
    '/data/data/com.termux/files/home/arcdock/dist',
    os.path.expanduser('~/arcdock/dist'),
    os.path.join(SCRIPT_DIR, 'dist'),
    os.path.join(SCRIPT_DIR, '../dist'),
    os.path.join(os.getcwd(), 'dist'),
]

DIST_DIR = None
for p in POSSIBLE_DIST_DIRS:
    if os.path.isdir(p) and os.path.isfile(os.path.join(p, 'index.html')):
        DIST_DIR = os.path.abspath(p)
        break

if not DIST_DIR:
    # Fallback to any directory that exists
    for p in POSSIBLE_DIST_DIRS:
        if os.path.isdir(p):
            DIST_DIR = os.path.abspath(p)
            break

if not DIST_DIR:
    DIST_DIR = '/data/data/com.termux/files/home/arcdock/dist'

# Shared in-memory clipboard store
shared_clipboard = {
    "current": None,
    "history": []
}

def get_lan_ip() -> str:
    """Detect active Wi-Fi LAN IP address without external lookups."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # 8.8.8.8:80 does not actually send packets but forces kernel to select outbound interface
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

class ArcDockRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local LAN network access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

        # Never cache HTML, API, JS or CSS responses on local dock (prevents stale WebView cache on device)
        clean_path = urllib.parse.urlparse(self.path).path
        if clean_path in ('/', '') or clean_path.endswith(('.html', '.js', '.css', '.json')) or clean_path.startswith(('/api/', '/assets/')):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')

        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        # /clip portal route
        if path in ('/clip', '/clip/'):
            clip_file = os.path.join(DIST_DIR, 'clip.html')
            if not os.path.isfile(clip_file):
                # Fallback check in parent or public dir
                clip_file = os.path.join(SCRIPT_DIR, '../public/clip.html')

            if os.path.isfile(clip_file):
                with open(clip_file, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(content)
                return

        # /api/info: Auto-detected IP and endpoints
        if path == '/api/info':
            lan_ip = get_lan_ip()
            response_data = {
                "ip": lan_ip,
                "port": PORT,
                "ha_port": HA_PORT,
                "ha_url": f"http://{lan_ip}:{HA_PORT}",
                "clip_url": f"http://{lan_ip}:{PORT}/clip"
            }
            body = json.dumps(response_data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
            return

        # /api/clipboard: Retrieve clips
        if path == '/api/clipboard':
            body = json.dumps(shared_clipboard).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
            return

        # /api/calendar/feed: Server-side CORS proxy for Google / Outlook / Apple iCal feeds
        if path == '/api/calendar/feed':
            query = urllib.parse.parse_qs(url_parts.query)
            target_url = query.get('url', [None])[0]
            if target_url and target_url.startswith('webcal://'):
                target_url = 'https://' + target_url[len('webcal://'):]
            if not target_url or not target_url.startswith(('http://', 'https://')):
                err = b'{"error": "Missing or invalid ?url= parameter"}'
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(err)
                return

            try:
                req = urllib.request.Request(
                    target_url,
                    headers={'User-Agent': 'Mozilla/5.0 (compatible; ArcDock/1.0; +https://github.com/arcodexx/ArcDock)'}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    ics_content = resp.read()
                    self.send_response(resp.status)
                    self.send_header('Content-Type', 'text/calendar; charset=utf-8')
                    self.send_header('Content-Length', str(len(ics_content)))
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    self.end_headers()
                    if self.command != 'HEAD':
                        self.wfile.write(ics_content)
                return
            except Exception as e:
                err_msg = json.dumps({"error": f"Failed to fetch calendar feed: {str(e)}"}).encode('utf-8')
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_msg)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(err_msg)
                return

        # /api/track/ and /api/carriers: ShipTrack parcel proxy
        if path.startswith('/api/track/') or path == '/api/carriers':
            if path == '/api/carriers':
                upstream_url = 'https://shiptrack.aswincloud.com/api/carriers'
            else:
                subpath = path[len('/api/track/'):]
                upstream_url = f'https://shiptrack.aswincloud.com/api/track/{subpath}'

            try:
                req = urllib.request.Request(
                    upstream_url,
                    headers={'User-Agent': 'ArcDock/1.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(data)))
                    self.end_headers()
                    if self.command != 'HEAD':
                        self.wfile.write(data)
                return
            except Exception as e:
                err_msg = json.dumps({"error": str(e)}).encode('utf-8')
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_msg)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(err_msg)
                return

        # SPA route fallback (Spotify OAuth /callback, deep links)
        target_path = os.path.join(DIST_DIR, path.lstrip('/'))
        if path.startswith('/callback') or not os.path.exists(target_path):
            index_file = os.path.join(DIST_DIR, 'index.html')
            if os.path.isfile(index_file):
                with open(index_file, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(content)
                return

        # Fallback to standard static file handling
        if self.command == 'HEAD':
            return super().do_HEAD()
        return super().do_GET()

    def do_POST(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        if path == '/api/clipboard':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                text = (data.get('text') or '').strip()
                if text and len(text) <= 50000:
                    device = data.get('device') or 'Remote Device'
                    new_clip = {
                        "id": f"clip-{int(time.time() * 1000)}",
                        "text": text,
                        "device": device,
                        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    }
                    shared_clipboard["current"] = new_clip
                    # Deduplicate and limit history to 5 items
                    filtered_history = [c for c in shared_clipboard["history"] if c.get("text") != text]
                    shared_clipboard["history"] = [new_clip] + filtered_history[:4]

                body = json.dumps(shared_clipboard).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        if path == '/api/system/restart-server':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(b'{"status": "restarting"}')

            def do_respawn():
                time.sleep(0.5)
                # Respawn server process cleanly
                os.execv(sys.executable, [sys.executable] + sys.argv)

            import threading
            threading.Thread(target=do_respawn).start()
            return

        self.send_response(404)
        self.end_headers()

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, 'SO_REUSEPORT'):
            try:
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            except Exception:
                pass
        super().server_bind()

def main():
    lan_ip = get_lan_ip()
    print("=" * 60, flush=True)
    print("  🚀 ArcDock Unified LAN Server", flush=True)
    print(f"  • Static Assets Root: {DIST_DIR}", flush=True)
    print(f"  • Local Dashboard:    http://localhost:{PORT}", flush=True)
    print(f"  • LAN Dashboard:      http://{lan_ip}:{PORT}", flush=True)
    print(f"  • LAN Clipboard:      http://{lan_ip}:{PORT}/clip", flush=True)
    print(f"  • Home Assistant LAN: http://{lan_ip}:{HA_PORT}", flush=True)
    print("=" * 60, flush=True)

    server = None
    for attempt in range(1, 11):
        try:
            server = ReusableHTTPServer(('0.0.0.0', PORT), ArcDockRequestHandler)
            break
        except OSError as e:
            if attempt == 10:
                print(f"FATAL: Could not bind to port {PORT} after 10 attempts: {e}", flush=True)
                raise
            print(f"Port {PORT} in TIME_WAIT ({e}). Retrying in 1s (attempt {attempt}/10)...", flush=True)
            time.sleep(1)

    try:
        print(f"ArcDock server listening on 0.0.0.0:{PORT}...", flush=True)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down ArcDock server...", flush=True)
        server.server_close()

if __name__ == '__main__':
    main()
