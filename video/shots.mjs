// Capturas reales del sitio (local, ?intro=0) → video/shots/*.jpg
// Uso: node shots.mjs [--url https://fronterasgalacticas.becode.com.ar]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, sleep, VIDEO_DIR } from './lib.mjs';

const SHOTS = [
  { name: 'hero', hash: '', dy: 0, wait: 6000 },
  { name: 'atlas', hash: '#atlas', dy: 215, wait: 7000 },
  { name: 'gemelos', hash: '#gemelos', dy: 330, wait: 2500 },
  { name: 'ruta', hash: '#recomendados', dy: 250, wait: 4000 },
  { name: 'base', hash: '#base', dy: 200, wait: 7000 },
];

export async function takeShots(baseUrl) {
  const out = path.join(VIDEO_DIR, 'shots');
  fs.mkdirSync(out, { recursive: true });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1.5 });
    await page.goto(`${baseUrl}/?intro=0`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await sleep(2500);
    for (const s of SHOTS) {
      await page.evaluate(({ hash, dy }) => {
        const el = hash ? document.querySelector(hash) : null;
        const y = el ? el.getBoundingClientRect().top + window.scrollY : 0;
        window.scrollTo(0, Math.max(0, y - 40));
        window.scrollTo(0, Math.max(0, y + dy));
      }, s);
      await sleep(s.wait);
      await page.screenshot({ path: path.join(out, `${s.name}.jpg`), type: 'jpeg', quality: 90 });
      console.log('shot', s.name);
    }
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(VIDEO_DIR, 'shots.mjs')) {
  const i = process.argv.indexOf('--url');
  if (i > 0) await takeShots(process.argv[i + 1]);
  else {
    const { server, port } = await serve();
    await takeShots(`http://127.0.0.1:${port}`);
    server.close();
  }
}
