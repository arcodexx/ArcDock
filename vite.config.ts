import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import os from 'os'

// In-memory LAN clipboard store
const sharedClipboard = {
  current: null as { id: string; text: string; device: string; timestamp: string } | null,
  history: [] as { id: string; text: string; device: string; timestamp: string }[],
};

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function setupBridgeMiddleware(middlewares: any) {
  middlewares.use(async (req: any, res: any, next: any) => {
    // CORS headers for local LAN access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Direct /clip URL routing
    if (req.url === '/clip' || req.url === '/clip/') {
      const clipHtmlPath = path.resolve(__dirname, './public/clip.html');
      if (fs.existsSync(clipHtmlPath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.statusCode = 200;
        res.end(fs.readFileSync(clipHtmlPath));
        return;
      }
    }

    // System restart endpoint mock
    if (req.url === '/api/system/restart-server' && req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'restarting' }));
      return;
    }

    // Direct /api/info device & LAN network info
    if (req.url === '/api/info') {
      const ip = getLocalIp();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ip,
          port: 3000,
          ha_port: 8123,
          ha_url: `http://${ip}:8123`,
          clip_url: `http://${ip}:3000/clip`,
        })
      );
      return;
    }

    // Shared Clipboard API
    if (req.url && req.url.startsWith('/api/clipboard')) {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(sharedClipboard));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const text = (data.text || '').trim();
            if (text && text.length <= 50000) {
              const newClip = {
                id: `clip-${Date.now()}`,
                text,
                device: data.device || 'Remote Device',
                timestamp: new Date().toISOString(),
              };
              sharedClipboard.current = newClip;
              sharedClipboard.history = [newClip, ...sharedClipboard.history.filter((c) => c.text !== text)].slice(0, 5);
            }
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(sharedClipboard));
          } catch (e: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }
    }

    // Google Calendar Feed Proxy & Push Receiver
    if (req.url && req.url.startsWith('/api/calendar/feed')) {
      try {
        const queryIdx = req.url.indexOf('?');
        if (queryIdx === -1) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
          return;
        }
        const params = new URLSearchParams(req.url.slice(queryIdx));
        const targetFeedUrl = params.get('url');

        if (!targetFeedUrl || !/^https?:\/\//i.test(targetFeedUrl)) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid feed URL' }));
          return;
        }

        const fetchRes = await fetch(targetFeedUrl);
        const icsText = await fetchRes.text();
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.statusCode = fetchRes.status;
        res.end(icsText);
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'Failed to fetch calendar feed: ' + err.message }));
      }
      return;
    }

    if (req.url && req.url.startsWith('/api/track/')) {
      const rawSubpath = req.url.replace(/^\/api\/track\//, '').split('?')[0];
      const decodedSubpath = decodeURIComponent(rawSubpath);
      
      // Strict validation: must be "carrier/trackingNumber" with alphanumeric, dash, and underscore only
      if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(decodedSubpath)) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid carrier or tracking number format' }));
        return;
      }

      const targetUrl = `https://shiptrack.aswincloud.com/api/track/${encodeURI(decodedSubpath)}`;
      try {
        const fetchRes = await fetch(targetUrl);
        const data = await fetchRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = fetchRes.status;
        res.end(data);
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 502;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.url && req.url.startsWith('/api/carriers')) {
      const targetUrl = 'https://shiptrack.aswincloud.com/api/carriers';
      try {
        const fetchRes = await fetch(targetUrl);
        const data = await fetchRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = fetchRes.status;
        res.end(data);
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 502;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    next();
  });
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'shiptrack-dev-bridge',
      configureServer(server) {
        setupBridgeMiddleware(server.middlewares);
      },
      configurePreviewServer(server) {
        setupBridgeMiddleware(server.middlewares);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
})
