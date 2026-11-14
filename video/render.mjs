// Render completo:  node render.mjs
//   1) capturas del sitio (si faltan, o con --shots)   2) audio procedural → out/audio.wav
//   3) frames con Chrome headless → frames/f_%05d.jpg  4) ffmpeg → out/fronteras-galacticas.mp4
// Opciones: --stills 1,5.5,12  (PNG sueltos en _tmp/)   --from 10 --to 20 (re-render parcial de frames)
//           --workers 4   --shots   --no-frames (solo audio + mux)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, launch, VIDEO_DIR } from './lib.mjs';
import { takeShots } from './shots.mjs';
import { writeAudio } from './audio.mjs';
import { FPS, W, H, DURATION } from './timeline.mjs';

const arg = (k, def) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? (process.argv[i + 1] ?? true) : def; };
const has = (k) => process.argv.includes(`--${k}`);
const FRAMES = path.join(VIDEO_DIR, 'frames'), OUT = path.join(VIDEO_DIR, 'out'), TMP = path.join(VIDEO_DIR, '_tmp');
[FRAMES, OUT, TMP].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const t00 = Date.now();

async function openFilm(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`${base}/video/index.html?capture=1`, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => window.filmReady);
  return page;
}
const grab = (page, t, type, q) => page.evaluate((t, type, q) => {
  window.renderFrame(t);
  return document.getElementById('film').toDataURL(type, q).split(',')[1];
}, t, type, q);

try {
  const need = ['hero', 'atlas', 'gemelos', 'base'].some((n) => !fs.existsSync(path.join(VIDEO_DIR, 'shots', `${n}.jpg`)));
  if (need || has('shots')) { console.log('· capturas del sitio'); await takeShots(base); }

  if (has('stills')) {
    const browser = await launch(); const page = await openFilm(browser);
    for (const s of String(arg('stills')).split(',')) {
      const t = parseFloat(s); const f = path.join(TMP, `still_${t.toFixed(2).padStart(5, '0')}.jpg`);
      fs.writeFileSync(f, Buffer.from(await grab(page, t, 'image/jpeg', 0.9), 'base64')); console.log(f);
    }
    await browser.close();
  } else {
    console.log('· audio'); writeAudio(path.join(OUT, 'audio.wav'));
    if (!has('no-frames')) {
      const total = Math.round(DURATION * FPS);
      const f0 = Math.max(0, Math.floor(parseFloat(arg('from', 0)) * FPS)), f1 = Math.min(total, Math.ceil(parseFloat(arg('to', DURATION)) * FPS));
      const workers = parseInt(arg('workers', 4), 10);
      console.log(`· frames ${f0}–${f1 - 1} de ${total} (${workers} procesos)`);
      let next = f0, done = 0;
      await Promise.all(Array.from({ length: workers }, async () => {
        const browser = await launch(); const page = await openFilm(browser);
        for (;;) {
          const f = next++; if (f >= f1) break;
          const b64 = await grab(page, f / FPS, 'image/jpeg', 0.94);
          fs.writeFileSync(path.join(FRAMES, `f_${String(f).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
          if (++done % 150 === 0) console.log(`  ${done}/${f1 - f0}  (${((Date.now() - t00) / 1000).toFixed(0)} s)`);
        }
        await browser.close();
      }));
    }
    console.log('· ffmpeg');
    const mp4 = path.join(OUT, 'fronteras-galacticas.mp4');
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%05d.jpg'), '-i', path.join(OUT, 'audio.wav'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '5500k', '-bufsize', '11000k', '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('ffmpeg falló');
    console.log(`OK → ${mp4}  (${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB, ${((Date.now() - t00) / 1000).toFixed(0)} s)`);
  }
} finally { server.close(); }
