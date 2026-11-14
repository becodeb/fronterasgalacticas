// Banda sonora 100 % procedural (sin samples ni voces): synth espacial optimista + SFX.
// Uso directo: node audio.mjs  → out/audio.wav
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURATION, MUSIC_T0, S, cues } from './timeline.mjs';

const SR = 44100;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function synth() {
  const N = Math.ceil((DURATION + 0.05) * SR);
  const bus = () => [new Float32Array(N), new Float32Array(N)];
  const drums = bus(), bassB = bus(), padB = bus(), arpB = bus(), leadB = bus(), sfx = bus();
  const duck = new Float32Array(N).fill(1);
  const rnd = rng(62);

  // escribe una voz: fn(tt, i) → muestra mono
  const voice = (b, t0, dur, pan, fn) => {
    const i0 = Math.max(0, Math.round(t0 * SR)), n = Math.round(dur * SR);
    const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < n && i0 + i < N; i++) { const v = fn(i / SR, i); b[0][i0 + i] += v * gl; b[1][i0 + i] += v * gr; }
  };
  const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
  const tri = (ph) => 2 * Math.abs(saw(ph)) - 1;
  const env = (tt, a, d, dur) => Math.min(1, tt / a) * Math.exp(-tt / d) * Math.min(1, Math.max(0, (dur - tt) / 0.01));
  // paso bajo de un polo con estado en clausura
  const lp1 = (cut) => { let y = 0; return (x, c = cut) => { const k = 1 - Math.exp(-TAU * c / SR); y += k * (x - y); return y; }; };
  // filtro de estado variable (pasa banda)
  const svf = () => { let lo = 0, bd = 0; return (x, fc, q) => { const f = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR); lo += f * bd; const hi = x - lo - q * bd; bd += f * hi; return bd; }; };

  /* ---------- instrumentos ---------- */
  const kick = (t, v = 1) => {
    let ph = 0;
    voice(drums, t, 0.32, 0, (tt) => { const f = 46 + 120 * Math.exp(-tt * 28); ph += f / SR; return v * 0.95 * Math.sin(TAU * ph) * Math.exp(-tt * 9) + v * 0.2 * (rnd() - 0.5) * Math.exp(-tt * 300); });
    const i0 = Math.round(t * SR);
    for (let i = 0; i < 0.35 * SR && i0 + i < N; i++) duck[i0 + i] *= 1 - 0.6 * v * Math.exp(-(i / SR) * 8);
  };
  const hat = (t, v = 1, open = false) => { let p = 0; voice(drums, t, open ? 0.2 : 0.06, 0.25, (tt) => { const x = rnd() - 0.5; const h = x - p; p = x; return v * 0.22 * h * Math.exp(-tt * (open ? 16 : 70)); }); };
  const clap = (t, v = 1) => { const f = svf(); voice(drums, t, 0.22, -0.1, (tt) => { const e = Math.exp(-tt * 22) + 0.6 * Math.exp(-Math.abs(tt - 0.012) * 400) + 0.5 * Math.exp(-Math.abs(tt - 0.024) * 400); return v * 0.3 * f((rnd() - 0.5) * 2, 1500, 0.6) * e; }); };
  const bass = (t, dur, m, v = 1) => { const f = mtof(m), lp = lp1(500); voice(bassB, t, dur, 0, (tt) => { const ph = f * tt; return v * 0.34 * (lp(saw(ph) * 0.8 + saw(ph * 1.005) * 0.4, 280 + 900 * Math.exp(-tt * 14)) + 0.7 * Math.sin(TAU * ph * 0.5)) * env(tt, 0.004, 0.22, dur); }); };
  const pluck = (t, m, v = 1, pan = 0) => { const f = mtof(m); voice(arpB, t, 0.4, pan, (tt) => { const ph = f * tt; return v * 0.16 * (tri(ph) + 0.25 * Math.sign(Math.sin(TAU * ph)) * Math.exp(-tt * 30) + 0.3 * Math.sin(TAU * ph * 2)) * env(tt, 0.002, 0.11, 0.4); }); };
  const pad = (t, dur, notes, v = 1) => notes.forEach((m, k) => {
    const f = mtof(m), lp = lp1(900);
    voice(padB, t, dur + 0.5, (k - 1) * 0.5, (tt) => {
      const a = Math.min(1, tt / 0.35) * Math.min(1, Math.max(0, (dur + 0.5 - tt) / 0.5));
      return v * 0.075 * lp(saw(f * tt) + saw(f * 1.006 * tt + 0.3) + saw(f * 0.994 * tt + 0.7), 700 + 500 * Math.sin(tt * 1.3 + k)) * a;
    });
  });
  const lead = (t, dur, m, v = 1) => { const f = mtof(m); voice(leadB, t, dur + 0.25, 0.15, (tt) => { const ph = f * tt + 0.004 * f * Math.sin(TAU * 5.5 * tt) / 5.5; return v * 0.13 * (Math.sin(TAU * ph) + 0.35 * tri(ph * 2) + 0.15 * Math.sin(TAU * ph * 3)) * Math.min(1, tt / 0.008) * Math.exp(-tt * 4.5); }); };

  /* ---------- música ---------- */
  const CH = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]; // C G Am F
  const MEL = [[76, 0, 79, 0, 81, 79, 76, 0], [74, 0, 79, 0, 83, 79, 74, 0], [72, 0, 76, 0, 81, 76, 72, 0], [72, 0, 77, 0, 81, 79, 77, 76]];
  const ARP = [0, 2, 1, 2, 3, 2, 1, 2];
  const sect = (t) => {
    if (t < S.pregunta.t0) return 'intro';
    if (t < S.pregunta.t0 + 2.5) return 'light';
    if (t < S.pregunta.t0 + 3) return 'gap';
    if (t >= S.cierre.t0) return 'outro';
    for (const id of ['webAtlas', 'webGemelos', 'webBase']) if (t >= S[id].t0 && t < S[id].t1) return 'break';
    for (const id of ['duelos', 'top5', 'misiones']) if (t >= S[id].t0 && t < S[id].t1) return 'lead';
    return 'full';
  };
  const B = 0.5; // negra a 120 bpm
  for (let n = 0; MUSIC_T0 + n * B < DURATION - 0.01; n++) {
    const t = MUSIC_T0 + n * B, bar = Math.floor(n / 4), beat = n % 4, ch = CH[bar % 4], sc = sect(t);
    if (sc === 'gap') continue;
    if (sc === 'outro') {
      if (t === S.cierre.t0 || (beat === 0 && t < DURATION - 2)) pad(t, 2.4, [48, 55, 60, 64, 67], 1.2);
      continue;
    }
    // pad: una vez por compás (o al entrar a mitad de compás)
    if (beat === 0 || sect(t - B) === 'gap') pad(t, (4 - beat) * B, [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24], sc === 'break' ? 1.3 : 1);
    // arpegio en semicorcheas
    for (let s = 0; s < 4; s++) {
      const k = (beat * 4 + s) % 8, tones = [ch[0], ch[1], ch[2], ch[0] + 12], m = tones[ARP[k]] + 24;
      const v = sc === 'intro' ? Math.min(1, (t - MUSIC_T0) / 3 + 0.35) : sc === 'break' ? 0.75 : 0.85;
      pluck(t + s * B / 4, m, v * (s % 2 ? 0.7 : 1), s % 2 ? 0.45 : -0.45);
    }
    if (sc === 'intro') { if (t >= MUSIC_T0 + 2) { hat(t + B / 2, 0.7); if (t >= MUSIC_T0 + 3) { hat(t, 0.5); hat(t + B / 4, 0.4); hat(t + 3 * B / 4, 0.5); } } continue; }
    if (sc === 'break') { hat(t + B / 2, 0.5); if (beat === 0) bass(t, 0.9, ch[0] - 12, 0.7); continue; }
    kick(t, sc === 'light' ? 0.8 : 1);
    hat(t + B / 2, 1, beat === 3 && sc !== 'light');
    if (sc !== 'light') { hat(t + B / 4, 0.45); hat(t + 3 * B / 4, 0.45); if (beat % 2 === 1) clap(t); }
    bass(t, 0.2, ch[0] - 12, 0.75); bass(t + B / 2, 0.24, ch[0] - 12 + (beat === 3 ? 7 : 0), 1);
    if (sc === 'lead') { const mel = MEL[bar % 4]; [0, 1].forEach((h) => { const m = mel[beat * 2 + h]; if (m) lead(t + h * B / 2, 0.22, m); }); }
  }
  pad(0.05, 3.6, [36, 43, 48], 1.1); // zumbido de sala de control durante la cuenta
  // golpe de entrada + cierre
  kick(MUSIC_T0, 1.1);
  [72, 76, 79, 84, 88].forEach((m, i) => lead(S.cierre.t0 + 1.5 + i * 0.16, 1.2, m, 1.1));
  kick(S.cierre.t0, 1.1);

  /* ---------- efectos ---------- */
  const fx = {
    beep: (t) => voice(sfx, t, 0.16, 0, (tt) => 0.3 * Math.sin(TAU * 880 * tt) * Math.min(1, tt / 0.004) * Math.min(1, (0.16 - tt) / 0.02)),
    beepLong: (t) => voice(sfx, t, 0.7, 0, (tt) => 0.3 * (Math.sin(TAU * 1320 * tt) + 0.3 * Math.sin(TAU * 1760 * tt)) * Math.min(1, tt / 0.004) * Math.min(1, (0.7 - tt) / 0.25)),
    blip: (t, { f = 1500 }) => voice(sfx, t, 0.14, 0.3, (tt) => 0.14 * Math.sin(TAU * (tt < 0.06 ? f : f * 1.5) * tt) * Math.min(1, tt / 0.003) * Math.exp(-tt * 18)),
    tick: (t, { f = 1400 }) => voice(sfx, t, 0.05, (rnd() - 0.5) * 0.8, (tt) => 0.1 * Math.sin(TAU * f * tt) * Math.exp(-tt * 70)),
    boing: (t, { big, soft }) => { let ph = 0; const v = big ? 0.42 : soft ? 0.2 : 0.3, f0 = big ? 150 : 210; voice(sfx, t, 0.75, -0.1, (tt) => { const f = f0 * (1 + 1.3 * tt) * (1 + 0.42 * Math.sin(TAU * 10 * tt) * Math.exp(-tt * 3.2)); ph += f / SR; return v * (Math.sin(TAU * ph) + 0.4 * Math.sin(TAU * ph * 2) + 0.15 * Math.sin(TAU * ph * 3)) * Math.min(1, tt / 0.005) * Math.exp(-tt * 4.5); }); },
    whoosh: (t) => { const f = svf(); voice(sfx, t, 0.5, 0, (tt) => { const u = tt / 0.5; return 0.2 * f((rnd() - 0.5) * 2, 300 + 3200 * Math.sin(u * Math.PI) ** 2, 0.5) * Math.sin(u * Math.PI) ** 2; }); },
    riser: (t, { d = 1 }) => { const f = svf(); let ph = 0; voice(sfx, t, d, 0, (tt) => { const u = tt / d; ph += (200 + 1500 * u * u) / SR; return (0.12 * Math.sin(TAU * ph) + 0.22 * f((rnd() - 0.5) * 2, 500 + 5000 * u * u, 0.4)) * u * u * Math.min(1, (d - tt) / 0.03); }); },
    slam: (t) => { let ph = 0; voice(sfx, t, 0.5, 0, (tt) => { ph += (38 + 90 * Math.exp(-tt * 22)) / SR; return 0.55 * Math.sin(TAU * ph) * Math.exp(-tt * 7) + 0.25 * (rnd() - 0.5) * Math.exp(-tt * 28); }); },
    stamp: (t) => { let ph = 0; voice(sfx, t, 0.22, 0, (tt) => { ph += (90 + 140 * Math.exp(-tt * 50)) / SR; return 0.4 * Math.sin(TAU * ph) * Math.exp(-tt * 20) + 0.3 * (rnd() - 0.5) * Math.exp(-tt * 90); }); },
    ping: (t, { f = 880 }) => [0, 0.19].forEach((dl, k) => voice(sfx, t + dl, 0.7, k ? 0.6 : -0.3, (tt) => (k ? 0.08 : 0.2) * (Math.sin(TAU * f * tt) + 0.3 * Math.sin(TAU * f * 2.01 * tt)) * Math.min(1, tt / 0.003) * Math.exp(-tt * 7))),
    pop: (t, { f = 500 }) => { let ph = 0; voice(sfx, t, 0.2, 0, (tt) => { ph += f * (1 + 0.7 * Math.min(1, tt / 0.07)) / SR; return 0.26 * Math.sin(TAU * ph) * Math.min(1, tt / 0.003) * Math.exp(-tt * 20); }); },
    chime: (t) => [72, 76, 79, 84].forEach((m, i) => voice(sfx, t + i * 0.07, 1.0, (i - 1.5) * 0.4, (tt) => 0.13 * (Math.sin(TAU * mtof(m) * tt) + 0.4 * Math.sin(TAU * mtof(m) * 2.76 * tt) * Math.exp(-tt * 8)) * Math.min(1, tt / 0.003) * Math.exp(-tt * 4))),
    descent: (t, { d = 1.2 }) => { const f = svf(); let ph = 0; voice(sfx, t, d, 0, (tt) => { const u = tt / d; ph += (760 - 520 * u) / SR; return (0.1 * Math.sin(TAU * ph) * (0.7 + 0.3 * Math.sin(TAU * 14 * tt)) + 0.2 * f((rnd() - 0.5) * 2, 900 - 500 * u, 0.7)) * Math.min(1, tt / 0.15) * Math.min(1, (d - tt) / 0.08); }); },
    thud: (t) => { let ph = 0; voice(sfx, t, 0.4, 0, (tt) => { ph += (40 + 60 * Math.exp(-tt * 25)) / SR; return 0.5 * Math.sin(TAU * ph) * Math.exp(-tt * 9) + 0.2 * (rnd() - 0.5) * Math.exp(-tt * 20); }); },
    skid: (t) => { const f = svf(); let ph = 0; voice(sfx, t, 0.8, 0.3, (tt) => { const u = tt / 0.8; const fc = 1900 - 900 * u + 260 * Math.sin(TAU * 13 * tt); ph += fc / SR; return (0.22 * f((rnd() - 0.5) * 2, fc, 0.12) + 0.05 * saw(ph)) * Math.sin(u * Math.PI) ** 0.6; }); },
  };
  for (const q of cues()) if (fx[q.type] && q.t >= 0) fx[q.type](q.t, q);

  /* ---------- mezcla ---------- */
  // eco ping-pong para arpegio y melodía
  const echo = (b, dt, fb, mix) => {
    const d = Math.round(dt * SR), wl = new Float32Array(N), wr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const inL = b[0][i], inR = b[1][i];
      const dl = i >= d ? wr[i - d] : 0, dr = i >= d ? wl[i - d] : 0;
      wl[i] = inL + dl * fb; wr[i] = inR + dr * fb;
      b[0][i] = inL + dl * mix; b[1][i] = inR + dr * mix;
    }
  };
  echo(arpB, 0.375, 0.42, 0.4); echo(leadB, 0.25, 0.35, 0.3); echo(sfx, 0.19, 0.2, 0.12);
  const L = new Float32Array(N), R = new Float32Array(N);
  const gapA = S.pregunta.t0 + 2.55, gapB = S.pregunta.t0 + 2.98;
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, dk = duck[i];
    let g = 1;
    if (t > gapA - 0.05 && t < gapB + 0.02) g = t < gapA ? (gapA - t) / 0.05 : t > gapB ? (t - gapB) / 0.02 : 0; // silencio antes del remate
    for (let ch = 0; ch < 2; ch++) {
      const m = (drums[ch][i] + bassB[ch][i] * (0.4 + 0.6 * dk) + padB[ch][i] * (0.3 + 0.7 * dk) + arpB[ch][i] * (0.6 + 0.4 * dk) + leadB[ch][i]) * g * 0.85;
      const v = Math.tanh((m + sfx[ch][i] * 0.95) * 1.25);
      (ch ? R : L)[i] = v; if (Math.abs(v) > peak) peak = Math.abs(v);
    }
  }
  const norm = 0.92 / peak;
  for (let i = 0; i < N; i++) {
    const t = i / SR, f = Math.min(1, t / 0.02) * Math.min(1, Math.max(0, (DURATION - 0.05 - t) / 1.1));
    L[i] *= norm * f; R[i] *= norm * f;
  }
  return { L, R, N };
}

export function writeAudio(file) {
  const { L, R, N } = synth();
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  return file;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const f = writeAudio(path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'audio.wav'));
  console.log('audio →', f);
}
