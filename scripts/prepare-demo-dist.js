#!/usr/bin/env node

/**
 * Prepares a standalone, demo-only static bundle in dist-demo/
 * where demo.html is the root index.html.
 * Omits the production app (index.html) completely.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const outDir = path.resolve(rootDir, 'dist-demo');

if (!fs.existsSync(distDir)) {
  console.error('[Error] dist/ directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Clean and create dist-demo
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// 1. Root index.html is the demo showcase
fs.copyFileSync(path.join(distDir, 'demo.html'), path.join(outDir, 'index.html'));

// 2. Demo dock iframe
fs.copyFileSync(path.join(distDir, 'demo-dock.html'), path.join(outDir, 'demo-dock.html'));

// 3. Keep /demo/ routing functional
const demoSubDir = path.join(outDir, 'demo');
fs.mkdirSync(demoSubDir, { recursive: true });
fs.copyFileSync(path.join(distDir, 'demo.html'), path.join(demoSubDir, 'index.html'));

// 4. Copy assets directory
const assetsSrc = path.join(distDir, 'assets');
const assetsDest = path.join(outDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
}

// 5. Copy manifest if present
const manifestSrc = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, path.join(outDir, 'manifest.json'));
}

// 6. Copy favicon if present
const faviconSrc = path.join(distDir, 'favicon.ico');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, path.join(outDir, 'favicon.ico'));
}

console.log('✓ Successfully prepared demo-only bundle in dist-demo/ for GitHub Pages!');
