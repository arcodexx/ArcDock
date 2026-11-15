import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
function setupBridgeMiddleware(middlewares: any) {
  middlewares.use(async (req: any, res: any, next: any) => {
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
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
})
