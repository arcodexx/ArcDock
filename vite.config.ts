import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'shiptrack-dev-bridge',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/track/')) {
            const subpath = req.url.replace(/^\/api\/track\//, '');
            const targetUrl = `https://shiptrack.aswincloud.com/api/track/${subpath}`;
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
