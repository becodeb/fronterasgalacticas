// Utilidades compartidas: servidor estático + Chrome headless.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const VIDEO_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SITE_DIR = path.resolve(VIDEO_DIR, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wav': 'audio/wav',
};

export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(SITE_DIR, p);
    if (!file.startsWith(SITE_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('404'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok({ server, port: server.address().port })));
}

export function findChrome() {
  const c = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) throw new Error('No encontré Chrome. Definí CHROME_PATH.');
  return hit;
}

export function launch(extra = []) {
  return puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', '--disable-gpu-vsync',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...extra],
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
