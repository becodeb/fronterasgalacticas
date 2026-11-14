// Fronteras Galácticas — video. Cada frame es función pura del tiempo: window.renderFrame(t).
import { CRATERS, LUNAR_FEATURES, REGIONS } from '../js/data/craters.js';
import {
  W, H, SCENES, S, DURATION, REGION_ORDER, GLOBO, CRATER_TIMES,
  DUEL_D, TOP_D, TOP_TRAVEL, BASE_POPS, LUNA_ROWS, MISION_POPS,
} from './timeline.mjs';

/* ------------------------------------------------------------------ */
/*  Tokens (css/tokens.css)                                            */
/* ------------------------------------------------------------------ */
const C = {
  void: '#05060A', void2: '#0B0D14', void3: '#12151F',
  line: 'rgba(236,232,223,.14)', lineStrong: 'rgba(236,232,223,.32)',
  paper: '#ECE8DF', dust: '#9A968C', signal: '#FF5B1F', signalSoft: 'rgba(255,91,31,.18)',
  tel: '#8FE3FF', sun: '#FFD27A',
};
const F = {
  serif: (s, it = false) => `${it ? 'italic ' : ''}400 ${s}px "Instrument Serif"`,
  body: (s, w = 500) => `${w} ${s}px "Manrope"`,
  mono: (s, w = 400) => `${w} ${s}px "IBM Plex Mono"`,
};

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const p = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const E = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  out5: (x) => 1 - Math.pow(1 - x, 5),
  in: (x) => x * x * x,
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  elastic: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const D2R = Math.PI / 180;
const fmtCoord = (lat, lon) => `${Math.abs(lat).toFixed(2).replace('.', ',')}°${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(2).replace('.', ',')}°${lon < 0 ? 'O' : 'E'}`;
const fmtKm = (d) => (d == null ? '—' : `${String(d).replace('.', ',')} km`);
const pad2 = (n) => String(n).padStart(2, '0');

const canvas = document.getElementById('film');
const out = canvas.getContext('2d');
const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
let c = layer.getContext('2d');

/* --- texto --- */
function T(str, x, y, font, color, o = {}) {
  c.save();
  c.font = font; c.fillStyle = color; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  c.letterSpacing = `${o.ls || 0}px`;
  c.globalAlpha *= o.a ?? 1;
  c.fillText(str, x, y);
  c.restore();
}
function tw(str, font, ls = 0) { c.save(); c.font = font; c.letterSpacing = `${ls}px`; const w = c.measureText(str).width; c.restore(); return w; }
// Etiqueta mono en mayúsculas con tracking amplio
function L(str, x, y, color = C.dust, size = 18, o = {}) {
  T(str.toUpperCase(), x, y, F.mono(size, o.w || 400), color, { ls: size * 0.16, ...o });
}
function wrap(str, font, maxW) {
  c.save(); c.font = font;
  const words = str.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  c.restore(); return lines;
}
function para(str, x, y, font, color, maxW, lh, o = {}) {
  const lines = wrap(str, font, maxW);
  lines.forEach((l, i) => T(l, x, y + i * lh, font, color, o));
  return lines.length;
}
// Texto mixto en una línea: [[str, font, color], ...]
function rich(parts, x, y, o = {}) {
  let total = 0; parts.forEach(([s, f]) => { total += tw(s, f); });
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  parts.forEach(([s, f, col]) => { T(s, cx, y, f, col, { a: o.a }); cx += tw(s, f); });
  return total;
}

/* --- trazos --- */
function line(x1, y1, x2, y2, color = C.line, w = 1, dash = null) {
  c.save(); c.strokeStyle = color; c.lineWidth = w; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
}
function circle(x, y, r, color, w = 1, dash = null, fill = null) {
  c.save(); c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (color) { c.strokeStyle = color; c.lineWidth = w; if (dash) c.setLineDash(dash); c.stroke(); }
  c.restore();
}
function cross(x, y, s = 8, color = C.lineStrong, w = 1) { line(x - s, y, x + s, y, color, w); line(x, y - s, x, y + s, color, w); }
function rrect(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function corners(x, y, w, h, s = 14, color = C.lineStrong) {
  c.save(); c.strokeStyle = color; c.lineWidth = 1.5; c.beginPath();
  c.moveTo(x, y + s); c.lineTo(x, y); c.lineTo(x + s, y);
  c.moveTo(x + w - s, y); c.lineTo(x + w, y); c.lineTo(x + w, y + s);
  c.moveTo(x + w, y + h - s); c.lineTo(x + w, y + h); c.lineTo(x + w - s, y + h);
  c.moveTo(x + s, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - s);
  c.stroke(); c.restore();
}
function reticle(x, y, r, color = C.signal, t = 0, a = 1) {
  c.save(); c.globalAlpha *= a;
  circle(x, y, r, color, 1.5);
  circle(x, y, r * 1.45, color, 1, [3, 7]);
  for (let i = 0; i < 4; i++) {
    const an = i * Math.PI / 2 + t * 0.4;
    line(x + Math.cos(an) * r * 0.55, y + Math.sin(an) * r * 0.55, x + Math.cos(an) * r * 1.25, y + Math.sin(an) * r * 1.25, color, 1.5);
  }
  circle(x, y, 3, null, 0, null, color);
  c.restore();
}
function stamp(str, x, y, rot, k, color = C.signal, size = 44) {
  if (k <= 0) return;
  const sc = lerp(2.2, 1, E.out5(clamp(k * 3)));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha *= clamp(k * 4);
  const font = F.mono(size, 500); const w = tw(str.toUpperCase(), font, size * 0.2) + size * 1.1;
  c.fillStyle = 'rgba(5,6,10,.86)'; c.fillRect(-w / 2, -size * 0.95, w, size * 1.9);
  c.strokeStyle = color; c.lineWidth = 3; c.strokeRect(-w / 2, -size * 0.95, w, size * 1.9);
  c.lineWidth = 1; c.strokeRect(-w / 2 + 7, -size * 0.95 + 7, w - 14, size * 1.9 - 14);
  T(str.toUpperCase(), size * 0.1, size * 0.34, font, color, { align: 'center', ls: size * 0.2 });
  c.restore();
}
// Cabecera de sección al estilo del sitio:  ——  02 / ATLAS
function sectionCode(str, x, y, a = 1) {
  c.save(); c.globalAlpha *= a;
  line(x, y - 6, x + 44, y - 6, C.signal, 1.5);
  L(str, x + 60, y, C.signal, 18);
  c.restore();
}

/* ------------------------------------------------------------------ */
/*  Esferas texturadas (proyección ortográfica por píxel)              */
/* ------------------------------------------------------------------ */
const TEX = {};
const IMG = {};
function loadImg(src) { return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(`No cargó ${src}`)); i.src = src; }); }
function toTex(img) {
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  return { w: cv.width, h: cv.height, d: x.getImageData(0, 0, cv.width, cv.height).data };
}
const sphereCache = new Map();
function sphereBuf(N) {
  if (sphereCache.has(N)) return sphereCache.get(N);
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'); const img = x.createImageData(N, N);
  const nx = new Float32Array(N * N), ny = new Float32Array(N * N), nz = new Float32Array(N * N), al = new Float32Array(N * N);
  const r = N / 2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = (i + 0.5 - r) / r, dy = -(j + 0.5 - r) / r, d2 = dx * dx + dy * dy, k = j * N + i;
    if (d2 < 1) { nx[k] = dx; ny[k] = dy; nz[k] = Math.sqrt(1 - d2); al[k] = clamp((1 - Math.sqrt(d2)) * r); }
  }
  const b = { cv, x, img, nx, ny, nz, al, N };
  sphereCache.set(N, b); return b;
}
function drawSphere(tex, cx, cy, R, lon0, lat0, o = {}) {
  if (R < 2) return;
  const N = Math.max(48, Math.min(Math.round(2 * R), o.maxN || 900));
  const b = sphereBuf(N); const { nx, ny, nz, al } = b; const data = b.img.data;
  let [lx, ly, lz] = o.light || [-0.55, 0.45, 0.7];
  const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
  const amb = o.amb ?? 0.07, gain = o.gain ?? 1.15, sat = o.sat ?? 1;
  const sp = Math.sin(lat0 * D2R), cp = Math.cos(lat0 * D2R), l0 = lon0 * D2R;
  const tw_ = tex.w, th = tex.h, td = tex.d, TAU = Math.PI * 2;
  for (let k = 0; k < N * N; k++) {
    const a = al[k], q = k * 4;
    if (a === 0) { data[q + 3] = 0; continue; }
    const x = nx[k], y = ny[k], z = nz[k];
    const y2 = y * cp + z * sp, z2 = -y * sp + z * cp;
    const lat = Math.asin(clamp(y2, -1, 1)), lon = l0 + Math.atan2(x, z2);
    let u = lon / TAU + 0.5; u -= Math.floor(u);
    const fx = u * tw_ - 0.5, fy = clamp((0.5 - lat / Math.PI) * th - 0.5, 0, th - 1.001);
    const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const xa = ((x0 % tw_) + tw_) % tw_, xb = (xa + 1) % tw_;
    const i00 = (y0 * tw_ + xa) * 4, i10 = (y0 * tw_ + xb) * 4, i01 = ((y0 + 1) * tw_ + xa) * 4, i11 = ((y0 + 1) * tw_ + xb) * 4;
    const w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay), w01 = (1 - ax) * ay, w11 = ax * ay;
    let r = td[i00] * w00 + td[i10] * w10 + td[i01] * w01 + td[i11] * w11;
    let g = td[i00 + 1] * w00 + td[i10 + 1] * w10 + td[i01 + 1] * w01 + td[i11 + 1] * w11;
    let bl = td[i00 + 2] * w00 + td[i10 + 2] * w10 + td[i01 + 2] * w01 + td[i11 + 2] * w11;
    if (sat !== 1) { const m = (r + g + bl) / 3; r = m + (r - m) * sat; g = m + (g - m) * sat; bl = m + (bl - m) * sat; }
    const dd = x * lx + y * ly + z * lz;
    let s = (dd + 0.15) / 0.6; s = s < 0 ? 0 : s > 1 ? 1 : s; s = s * s * (3 - 2 * s);
    const sh = (amb + (1 - amb) * s) * (0.62 + 0.38 * z) * gain;
    data[q] = r * sh; data[q + 1] = g * sh; data[q + 2] = bl * sh; data[q + 3] = a * 255;
  }
  b.x.putImageData(b.img, 0, 0);
  if (o.halo) {
    const gr = c.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * (o.haloR || 1.16));
    gr.addColorStop(0, o.halo); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R * (o.haloR || 1.16), 0, TAU); c.fill(); c.restore();
  }
  c.save(); c.imageSmoothingQuality = 'high'; c.drawImage(b.cv, cx - R, cy - R, R * 2, R * 2); c.restore();
}
const HALO_E = 'rgba(143,227,255,.30)';
const HALO_M = 'rgba(255,210,122,.16)';
function proj(lat, lon, cx, cy, R, lon0, lat0) {
  const la = lat * D2R, dl = (lon - lon0) * D2R, sp = Math.sin(lat0 * D2R), cp = Math.cos(lat0 * D2R);
  const x = Math.cos(la) * Math.sin(dl), y2 = Math.sin(la), z2 = Math.cos(la) * Math.cos(dl);
  const y = y2 * cp - z2 * sp, z = y2 * sp + z2 * cp;
  return { x: cx + x * R, y: cy - y * R, z };
}
const toVec = (lat, lon) => { const a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
const fromVec = ([x, y, z]) => { const n = Math.hypot(x, y, z); return { lat: Math.asin(y / n) / D2R, lon: Math.atan2(x, z) / D2R }; };
function slerp(a, b, t) {
  const va = toVec(a.lat, a.lon), vb = toVec(b.lat, b.lon);
  const dot = clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1), om = Math.acos(dot);
  if (om < 1e-4) return { lat: a.lat, lon: a.lon };
  const s = Math.sin(om), ka = Math.sin((1 - t) * om) / s, kb = Math.sin(t * om) / s;
  return fromVec([va[0] * ka + vb[0] * kb, va[1] * ka + vb[1] * kb, va[2] * ka + vb[2] * kb]);
}
function graticule(cx, cy, R, lon0, lat0, a = 0.12) {
  c.save(); c.strokeStyle = C.paper; c.globalAlpha *= a; c.lineWidth = 1;
  const seg = (pts) => {
    c.beginPath(); let pen = false;
    for (const q of pts) { if (q.z > 0.02) { if (pen) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); pen = true; } else pen = false; }
    c.stroke();
  };
  for (let la = -60; la <= 60; la += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 5) pts.push(proj(la, lo, cx, cy, R, lon0, lat0)); seg(pts); }
  for (let lo = -180; lo < 180; lo += 30) { const pts = []; for (let la = -90; la <= 90; la += 5) pts.push(proj(la, lo, cx, cy, R, lon0, lat0)); seg(pts); }
  c.restore();
}
// Anillo exterior con marcas, como el visor del atlas
function bezel(cx, cy, R, t, color = C.lineStrong) {
  circle(cx, cy, R, C.line, 1);
  c.save(); c.strokeStyle = color; c.lineWidth = 1; c.beginPath();
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2 + t * 0.05, r0 = i % 6 === 0 ? R - 12 : R - 5;
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  }
  c.stroke(); c.restore();
}

/* ------------------------------------------------------------------ */
/*  Ilustraciones de línea                                             */
/* ------------------------------------------------------------------ */
const LP = {
  flameO: new Path2D('M49 109Q60 178 71 109Z'), flameI: new Path2D('M54.5 109Q60 146 65.5 109Z'),
  legs: new Path2D('M30 80 9 119M30 95 18 103M90 80l21 39M90 95l12 8M1 120.5h16M103 120.5h16'),
  nozzle: new Path2D('M53 96h14l6 13H47Z'), gold: new Path2D('M28 74h64v22H28Z'),
  goldThin: new Path2D('M38 74 28 86M50 74 31 96M62 74 43 96M74 74 55 96M86 74 67 96M92 81 79 96'),
  cabin: new Path2D('M44 30h32l13 13v20l-9 11H40l-9-11V43Z'), cabinThin: new Path2D('M31 57h21M68 57h21M54 59h12v15H54Z'),
  hatch: new Path2D('M52 22h16v8H52Z'), mast: new Path2D('M78 32 88 12'), dish: new Path2D('M82 8.5a7 7 0 0 0 12 6.5'),
  rcs: new Path2D('M31 48h-7m3.5-3.5v7M89 48h7m-3.5-3.5v7'),
};
// Módulo de descenso del sitio. Origen: centro de las patas (apoyo).
function lander(x, y, s, o = {}) {
  c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(s, s); c.translate(-60, -120.5);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const fl = o.flame || 0;
  if (fl > 0) {
    c.save(); c.translate(60, 109); c.scale(1, fl * (0.85 + 0.15 * Math.sin((o.t || 0) * 47))); c.translate(-60, -109);
    c.globalAlpha *= 0.9; c.fillStyle = C.signal; c.fill(LP.flameO); c.fillStyle = C.sun; c.fill(LP.flameI); c.restore();
  }
  if (o.flag) {
    c.save(); c.globalAlpha *= clamp(o.flag); c.strokeStyle = C.paper; c.lineWidth = 2;
    const fy = lerp(121, 86, E.out(clamp(o.flag)));
    c.beginPath(); c.moveTo(-16, 121); c.lineTo(-16, fy); c.stroke();
    c.fillStyle = C.signal; c.beginPath(); c.moveTo(-16, fy); c.lineTo(-35, fy + 5.5); c.lineTo(-16, fy + 11); c.closePath(); c.fill(); c.restore();
  }
  c.strokeStyle = C.paper; c.lineWidth = 2.2; c.stroke(LP.legs);
  c.fillStyle = C.void2; c.fill(LP.nozzle); c.stroke(LP.nozzle);
  c.fillStyle = '#2a2212'; c.fill(LP.gold); c.strokeStyle = C.sun; c.stroke(LP.gold); c.lineWidth = 1; c.stroke(LP.goldThin);
  c.strokeStyle = C.paper; c.lineWidth = 2.2; c.fillStyle = C.void2; c.fill(LP.cabin); c.stroke(LP.cabin);
  c.lineWidth = 1; c.stroke(LP.cabinThin); c.stroke(LP.rcs);
  c.lineWidth = 2.2; c.fillStyle = '#10222b'; c.beginPath(); c.arc(60, 44, 8, 0, 7); c.fill(); c.strokeStyle = C.tel; c.stroke();
  c.strokeStyle = C.paper; c.fillStyle = C.void2; c.fill(LP.hatch); c.stroke(LP.hatch); c.stroke(LP.mast);
  c.strokeStyle = C.tel; c.stroke(LP.dish);
  c.fillStyle = C.signal; c.beginPath(); c.arc(88, 12, 2, 0, 7); c.fill();
  c.restore();
}
function mate(x, y, s, t, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  // vapor
  c.strokeStyle = C.dust; c.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    c.beginPath();
    for (let k = 0; k <= 10; k++) { const yy = -82 - k * 5, xx = -12 + i * 14 + Math.sin(k * 0.9 + t * 3 + i * 2) * 4; if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
    c.save(); c.globalAlpha *= 0.6; c.stroke(); c.restore();
  }
  // bombilla
  c.strokeStyle = C.tel; c.lineWidth = 4; c.beginPath(); c.moveTo(6, -40); c.lineTo(42, -132); c.stroke();
  c.lineWidth = 7; c.beginPath(); c.moveTo(40, -127); c.lineTo(45, -140); c.stroke();
  // calabaza
  c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-30, -62); c.bezierCurveTo(-56, -40, -46, 0, 0, 0); c.bezierCurveTo(46, 0, 56, -40, 30, -62); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = C.sun; c.fillStyle = '#2a2212'; rrect(-33, -72, 66, 12, 3); c.fill(); c.stroke();
  // yerba
  c.fillStyle = C.dust; [[-18, -76], [-6, -79], [8, -77], [20, -76], [-12, -75], [14, -80]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 2.4, 0, 7); c.fill(); });
  c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(-36, -30); c.quadraticCurveTo(0, -18, 36, -30); c.stroke();
  c.restore();
}
function termo(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3;
  rrect(-26, -168, 52, 168, 7); c.fill(); c.stroke();
  rrect(-20, -200, 40, 34, 6); c.fill(); c.stroke();
  rrect(-10, -214, 20, 14, 3); c.fill(); c.stroke();
  c.fillStyle = C.signal; c.fillRect(-26, -120, 52, 16);
  c.strokeStyle = C.line; c.lineWidth = 2; line(-26, -60, 26, -60, C.lineStrong, 2); line(-26, -40, 26, -40, C.lineStrong, 2);
  c.strokeStyle = C.paper; c.lineWidth = 3; c.beginPath(); c.moveTo(26, -140); c.bezierCurveTo(52, -140, 52, -80, 26, -80); c.stroke();
  c.restore();
}
function rover(x, y, s, rot, wheel, t) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = C.paper; c.fillStyle = C.void2; c.lineWidth = 3;
  // suspensión
  c.beginPath(); c.moveTo(-46, -18); c.lineTo(-20, -46); c.lineTo(0, -18); c.moveTo(20, -46); c.lineTo(46, -18); c.stroke();
  rrect(-60, -74, 120, 30, 5); c.fill(); c.stroke();
  // panel
  c.fillStyle = '#10222b'; c.strokeStyle = C.tel; c.beginPath(); c.moveTo(-10, -80); c.lineTo(66, -92); c.lineTo(72, -82); c.lineTo(-4, -70); c.closePath(); c.fill(); c.stroke();
  c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-10 + i * 19, -80 - i * 3); c.lineTo(-4 + i * 19, -70 - i * 3); c.stroke(); }
  // mástil + cámara
  c.strokeStyle = C.paper; c.lineWidth = 3; c.fillStyle = C.void2;
  c.beginPath(); c.moveTo(-40, -74); c.lineTo(-40, -118); c.stroke();
  rrect(-62, -134, 36, 18, 4); c.fill(); c.stroke();
  c.fillStyle = C.signal; c.beginPath(); c.arc(-53, -125, 4.5 + Math.sin(t * 9) * 0.6, 0, 7); c.fill();
  // antena
  c.beginPath(); c.moveTo(40, -86); c.lineTo(52, -128); c.stroke(); c.fillStyle = C.sun; c.beginPath(); c.arc(52, -128, 3.5, 0, 7); c.fill();
  // ruedas
  [-46, 0, 46].forEach((wx) => {
    c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3; c.beginPath(); c.arc(wx, -18, 18, 0, 7); c.fill(); c.stroke();
    c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const a = wheel + i * Math.PI / 4; c.beginPath(); c.moveTo(wx + Math.cos(a) * 15, -18 + Math.sin(a) * 15); c.lineTo(wx - Math.cos(a) * 15, -18 - Math.sin(a) * 15); c.stroke(); }
    c.fillStyle = C.dust; c.beginPath(); c.arc(wx, -18, 3, 0, 7); c.fill();
  });
  c.restore();
}

/* ------------------------------------------------------------------ */
/*  Fondo, HUD y marco de monitor                                      */
/* ------------------------------------------------------------------ */
const STARS = (() => { const r = rng(2026); return Array.from({ length: 520 }, () => ({ x: r() * W, y: r() * H, s: 0.4 + Math.pow(r(), 3) * 1.9, ph: r() * 7, f: 0.4 + r() * 1.6, warm: r() < 0.15 })); })();
function background(t) {
  out.globalAlpha = 1; out.fillStyle = C.void; out.fillRect(0, 0, W, H);
  const g = out.createRadialGradient(W * 0.72, H * 0.2, 0, W * 0.72, H * 0.2, W * 0.75);
  g.addColorStop(0, 'rgba(24,28,44,.55)'); g.addColorStop(1, 'rgba(5,6,10,0)');
  out.fillStyle = g; out.fillRect(0, 0, W, H);
  for (const s of STARS) {
    const x = (((s.x - t * (2 + s.s * 3)) % W) + W) % W;
    out.globalAlpha = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.f + s.ph))) * Math.min(1, s.s);
    out.fillStyle = s.warm ? C.sun : C.paper;
    out.beginPath(); out.arc(x, s.y, s.s * 0.75, 0, 7); out.fill();
  }
  // retícula de puntos
  out.globalAlpha = 0.07; out.fillStyle = C.paper;
  for (let y = 60; y < H; y += 80) for (let x = 60; x < W; x += 80) out.fillRect(x, y, 1.5, 1.5);
  out.globalAlpha = 1;
}
function hud(t, sc) {
  c = out; c.save(); c.globalAlpha *= 0.9;
  const m = 44;
  [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => cross(x, y, 9, C.lineStrong, 1));
  // marca del sitio
  circle(m + 34, m - 6 + 20, 7, C.paper, 1.5);
  L('Fronteras Galácticas', m + 52, m + 20, C.paper, 15, { w: 500 });
  L(`[ ${sc.code} ]`, W - m - 30, m + 20, C.signal, 15, { align: 'right' });
  const mm = Math.floor(t / 60), ss = t - mm * 60;
  L(`T+ ${pad2(mm)}:${ss.toFixed(2).padStart(5, '0')}`, m + 30, H - m - 12, C.tel, 15);
  if (!['titulo', 'pregunta', 'equipo', 'cierre'].includes(sc.id)) L('Equipo La LUNA · NASA Space Apps Challenge 2026', W - m - 30, H - m - 12, C.dust, 15, { align: 'right' });
  // progreso de misión
  c.fillStyle = C.line; c.fillRect(0, H - 4, W, 4);
  c.fillStyle = C.signal; c.fillRect(0, H - 4, W * t / DURATION, 4);
  c.restore(); c = layer.getContext('2d');
}
function monitor(img, lt, d, o) {
  const mw = 1400, mh = mw * 9 / 16, mx = (W - mw) / 2, my = 162, bar = 46;
  const k = E.out5(p(lt, 0, 0.5));
  c.save();
  c.translate(W / 2, my + mh / 2); c.scale(lerp(0.94, 1, k), lerp(0.94, 1, k)); c.translate(-W / 2, -(my + mh / 2));
  // carcasa
  c.fillStyle = C.void2; c.fillRect(mx - 14, my - bar - 14, mw + 28, mh + bar + 28);
  c.strokeStyle = C.lineStrong; c.lineWidth = 1; c.strokeRect(mx - 14, my - bar - 14, mw + 28, mh + bar + 28);
  corners(mx - 26, my - bar - 26, mw + 52, mh + bar + 52, 22, C.signal);
  // barra
  const blink = Math.sin(lt * 7) > -0.2;
  if (blink) circle(mx + 14, my - bar / 2 - 8, 6, null, 0, null, C.signal);
  L('Monitor de misión · en vivo', mx + 34, my - bar / 2 - 2, C.paper, 15, { w: 500 });
  L(o.chan, mx + mw / 2, my - bar / 2 - 2, C.dust, 15, { align: 'center' });
  L('fronterasgalacticas.becode.com.ar', mx + mw, my - bar / 2 - 2, C.tel, 15, { align: 'right' });
  // imagen con ken-burns
  c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip();
  const q = E.io(p(lt, 0, d));
  const z = lerp(o.z0, o.z1, q), fx = lerp(o.x0, o.x1, q), fy = lerp(o.y0, o.y1, q);
  const dw = mw * z, dh = mh * z;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, mx - (dw - mw) * fx, my - (dh - mh) * fy, dw, dh);
  // líneas de barrido + viñeta
  c.globalAlpha = 0.05; c.fillStyle = '#000'; for (let y = my; y < my + mh; y += 4) c.fillRect(mx, y, mw, 1);
  c.globalAlpha = 1;
  const sy = my + ((lt * 260) % (mh + 200)) - 100;
  const sg = c.createLinearGradient(0, sy - 60, 0, sy + 60); sg.addColorStop(0, 'rgba(143,227,255,0)'); sg.addColorStop(0.5, 'rgba(143,227,255,.05)'); sg.addColorStop(1, 'rgba(143,227,255,0)');
  c.fillStyle = sg; c.fillRect(mx, sy - 60, mw, 120);
  const vg = c.createLinearGradient(0, my + mh - 330, 0, my + mh); vg.addColorStop(0, 'rgba(5,6,10,0)'); vg.addColorStop(0.55, 'rgba(5,6,10,.88)'); vg.addColorStop(1, 'rgba(5,6,10,.97)');
  c.fillStyle = vg; c.fillRect(mx, my + mh - 330, mw, 330);
  c.restore();
  c.strokeStyle = C.line; c.strokeRect(mx, my, mw, mh);
  cross(mx + mw / 2, my + mh / 2, 12, 'rgba(236,232,223,.25)');
  // rótulo
  const a = E.out(p(lt, 0.25, 0.8)); const ty = my + mh - 52 + (1 - a) * 24;
  c.globalAlpha = a;
  L(o.kicker, mx + 44, ty - 64, C.signal, 17);
  rich(o.title, mx + 44, ty, {});
  c.restore();
}

/* ------------------------------------------------------------------ */
/*  Escenas                                                            */
/* ------------------------------------------------------------------ */
const SC = {};

// 0 · Cuenta regresiva (como la intro del sitio)
SC.cuenta = (lt, d, t) => {
  const cx = 960, cy = 470, R = 250;
  const open = E.in(p(lt, 3.05, 4));
  c.save(); c.globalAlpha = 1 - p(lt, 3.5, 4);
  L('Control de misión · La LUNA', 110, 150, C.dust, 17);
  L('Secuencia de despegue · FG-2026', W - 110, 150, C.dust, 17, { align: 'right' });
  // dial
  const RR = R * (1 + open * 5);
  circle(cx, cy, RR, C.lineStrong, 1.5);
  c.save(); c.strokeStyle = C.paper; c.beginPath();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, major = i % 5 === 0, r0 = RR * (major ? 1.035 : 1.05), r1 = RR * 1.075;
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  }
  c.globalAlpha *= 0.5; c.lineWidth = 1.5; c.stroke(); c.restore();
  line(cx, cy - RR * 1.16, cx, cy - RR * 1.09, C.signal, 2); line(cx, cy + RR * 1.09, cx, cy + RR * 1.16, C.signal, 2);
  line(cx - RR * 1.16, cy, cx - RR * 1.09, cy, C.signal, 2); line(cx + RR * 1.09, cy, cx + RR * 1.16, cy, C.signal, 2);
  // arco de progreso
  c.save(); c.strokeStyle = C.signal; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.arc(cx, cy, RR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p(lt, 0, 3)); c.stroke(); c.restore();
  // número
  const step = Math.min(3, Math.floor(lt)); const n = 3 - step; const f = lt - step;
  const pop = step < 3 ? lerp(1.18, 1, E.out5(clamp(f * 3))) : lerp(1.3, 1, E.out5(clamp(f * 3)));
  c.save(); c.translate(cx, cy + 20); c.scale(pop, pop); c.globalAlpha *= 1 - p(lt, 3.3, 3.8);
  if (n > 0) {
    const wT = tw('T−', F.serif(110)), wN = tw(String(n), F.serif(260));
    T('T−', -(wT + wN) / 2, 62, F.serif(110), C.dust);
    T(String(n), -(wT + wN) / 2 + wT + 6, 62, F.serif(260), C.paper);
  } else {
    T('0', 0, 62, F.serif(260), C.sun, { align: 'center' });
  }
  c.restore();
  L(n > 0 ? 'Cuenta regresiva' : '¡Despegue!', cx, cy + 150, n > 0 ? C.dust : C.signal, 19, { align: 'center', a: 1 - p(lt, 3.3, 3.8) });
  // bitácora
  const log = [['Propulsión', 'OK', 0.3], ['Guiado y navegación', 'OK', 0.9], ['Mate y termo', 'A bordo', 1.5, true], ['Destino', 'Luna · 384.400 km', 2.1], ['Tripulación La LUNA', 'Lista', 2.7]];
  log.forEach(([k, v, at, fun], i) => {
    const a = E.out(p(lt, at, at + 0.3)); if (a <= 0) return;
    const y = 800 + i * 40, x = 110 - (1 - a) * 20;
    c.save(); c.globalAlpha *= a;
    c.fillStyle = fun ? C.signal : C.tel; c.fillRect(x, y - 11, 8, 8);
    L(k, x + 24, y, fun ? C.sun : C.dust, 18);
    line(x + 330, y - 6, x + 430, y - 6, C.line, 1, [2, 6]);
    L(v, x + 450, y, fun ? C.signal : C.paper, 18, { w: 500 });
    c.restore();
  });
  // carga crítica: mate y termo
  const mk = p(lt, 1.5, 2.1);
  if (mk > 0) {
    const s = E.elastic(mk), bx = 1530, by = 640;
    c.save(); c.globalAlpha *= clamp(mk * 5) * (1 - p(lt, 3.2, 3.7));
    c.translate(bx, by); c.scale(s, s); c.translate(-bx, -by);
    line(bx - 170, by + 2, bx + 170, by + 2, C.lineStrong, 1);
    termo(bx - 70, by, 1.25);
    mate(bx + 70, by, 1.3, lt, Math.sin(lt * 5) * 0.03);
    corners(bx - 190, by - 300, 380, 330, 16, C.signal);
    L('Carga crítica', bx, by - 320, C.signal, 17, { align: 'center' });
    L('Mate y termo · a bordo', bx, by + 64, C.sun, 18, { align: 'center', w: 500 });
    c.restore();
  }
  c.restore();
  // destello de despegue
  const fl = p(lt, 3.0, 3.12) * (1 - p(lt, 3.12, 3.6));
  if (fl > 0) { c.save(); c.globalAlpha = fl * 0.22; c.fillStyle = C.sun; c.fillRect(0, 0, W, H); c.restore(); }
};

// 1 · Título (como el hero)
SC.titulo = (lt, d, t) => {
  const k = E.out5(p(lt, 0, 1.6));
  const mx = lerp(1700, 1500, k), my = lerp(820, 660, k), mr = 520;
  drawSphere(TEX.luna, mx, my, mr, 20 + t * 1.2, 8, { light: [-0.75, 0.42, 0.5], halo: HALO_M, haloR: 1.08, amb: 0.03, maxN: 1040 });
  // Tierra + órbita punteada + nave de prueba
  const ex = 850, ey = 190, a = E.out(p(lt, 0.5, 1.3));
  c.save(); c.globalAlpha = a;
  drawSphere(TEX.tierra, ex, ey, 62, -60 + t * 6, 10, { light: [0.7, 0.3, 0.6], halo: HALO_E, haloR: 1.25 });
  line(ex + 70, ey + 4, ex + 116, ey + 4, C.tel, 1); circle(ex + 70, ey + 4, 3, C.tel, 1.2);
  L('Tierra', ex + 126, ey + 4, C.tel, 15, { w: 500 }); L('Acá ensayamos', ex + 126, ey + 26, C.dust, 13);
  c.strokeStyle = C.tel; c.lineWidth = 1.5; c.setLineDash([2, 9]); c.globalAlpha = a * 0.7;
  c.beginPath(); c.moveTo(ex + 50, ey + 50); c.bezierCurveTo(1120, 300, 950, 520, 1040, 700); c.stroke(); c.setLineDash([]);
  c.globalAlpha = a;
  const q = p(lt, 0.6, 4.2) * 0.62, B = (u) => {
    const P = [[ex + 50, ey + 50], [1120, 300], [950, 520], [1040, 700]], m = 1 - u;
    return [0, 1].map((i) => m * m * m * P[0][i] + 3 * m * m * u * P[1][i] + 3 * m * u * u * P[2][i] + u * u * u * P[3][i]);
  };
  const [sx, sy] = B(q);
  circle(sx, sy, 14, C.signalSoft, 8); circle(sx, sy, 5, null, 0, null, C.signal);
  line(sx + 12, sy, sx + 44, sy, C.signal, 1);
  L('Nave de prueba', sx + 54, sy + 2, C.signal, 14, { w: 500 });
  L(`${Math.round(q * 384400).toLocaleString('es-AR')} km`, sx + 54, sy + 22, C.dust, 13);
  c.restore();
  // título
  const x = 120;
  const ka = E.out(p(lt, 0.2, 0.8));
  c.save(); c.globalAlpha = ka; line(x, 352, x + 54, 352, C.signal, 1.5);
  L('NASA Space Apps Challenge 2026 · Equipo La LUNA', x + 70, 358, C.signal, 18); c.restore();
  const rise = (str, y, font, color, at, dx = 0) => {
    const r = E.out5(p(lt, at, at + 0.9)); if (r <= 0) return;
    c.save(); c.beginPath(); c.rect(0, y - 190, W, 235); c.clip();
    T(str, x + dx, y + (1 - r) * 200, font, color); c.restore();
  };
  rise('Fronteras', 560, F.serif(210), C.paper, 0.25);
  rise('Galácticas', 760, F.serif(210, true), C.sun, 0.5, 90);
  const sa = E.out(p(lt, 1.3, 1.9));
  c.save(); c.globalAlpha = sa;
  T('Buscamos en la Tierra los lugares que más', x, 868 + (1 - sa) * 16, F.body(31, 400), C.paper);
  T('se parecen a la Luna.', x, 912 + (1 - sa) * 16, F.body(31, 400), C.paper);
  c.restore();
};

// 2 · La pregunta
SC.pregunta = (lt, d, t) => {
  const PUNCH = 3;
  // la Luna, lejos
  const ma = E.out(p(lt, 0.1, 0.8));
  c.save(); c.globalAlpha = ma;
  const mxx = 300, myy = 250;
  drawSphere(TEX.luna, mxx, myy, 105, 10 + t * 2, 0, { light: [-0.7, 0.4, 0.55], halo: HALO_M, haloR: 1.2 });
  circle(mxx, myy, 150, C.line, 1, [2, 8]);
  line(mxx + 112, myy - 40, mxx + 190, myy - 80, C.tel, 1);
  L('La Luna', mxx + 200, myy - 84, C.tel, 16, { w: 500 });
  L('384.400 km · pasaje caro', mxx + 200, myy - 60, C.dust, 14);
  c.restore();
  // línea 1, tipeada
  const s1 = '¿Para qué ir a la Luna a probar…';
  const n1 = Math.floor(p(lt, 0.3, 2.2) * s1.length);
  const f1 = F.serif(104); const w1 = tw(s1, f1); const x1 = 960 - w1 / 2;
  T(s1.slice(0, n1), x1, 500, f1, C.paper);
  if (n1 < s1.length || (lt < PUNCH && Math.sin(lt * 10) > 0)) { const cw = tw(s1.slice(0, n1), f1); c.fillStyle = C.signal; c.fillRect(x1 + cw + 8, 425, 5, 84); }
  // remate
  const k = p(lt, PUNCH, PUNCH + 0.7);
  if (k > 0) {
    const s = E.elastic(k);
    c.save(); c.translate(960, 660); c.scale(lerp(0.5, 1, s), lerp(0.5, 1, s)); c.rotate((1 - s) * -0.06); c.globalAlpha = clamp(k * 6);
    T('…si la Luna ya está acá?', 0, 0, F.serif(138, true), C.sun, { align: 'center' });
    c.restore();
    const lw = E.out(p(lt, PUNCH + 0.3, PUNCH + 0.9)) * 420;
    line(960 - lw, 700, 960 + lw, 700, C.signal, 2);
  }
  // la Tierra asoma, centrada en la Patagonia
  const ek = E.out5(p(lt, PUNCH - 0.1, PUNCH + 0.9));
  if (ek > 0) {
    const ex = 1570, ey = lerp(1500, 990, ek), er = 300, elat = -60 + Math.sin(t * 0.5) * 1.5;
    drawSphere(TEX.tierra, ex, ey, er, -66, elat, { light: [-0.4, 0.6, 0.7], halo: HALO_E, haloR: 1.14, amb: 0.2 });
    const q = proj(-42.75, -67.5, ex, ey, er, -66, elat);
    const ra = p(lt, PUNCH + 0.7, PUNCH + 1.1);
    if (ra > 0) {
      reticle(q.x, q.y, 22 + (1 - E.out(ra)) * 40, C.signal, t, ra);
      c.save(); c.globalAlpha = ra;
      line(q.x - 30, q.y - 14, q.x - 120, q.y - 70, C.signal, 1);
      L('Acá nomás', q.x - 130, q.y - 92, C.signal, 17, { align: 'right', w: 500 });
      L(fmtCoord(-42.75, -67.5), q.x - 130, q.y - 68, C.dust, 14, { align: 'right' });
      c.restore();
    }
  }
  const tk = p(lt, PUNCH + 1.5, PUNCH + 1.9);
  if (tk > 0) L('[ Más cerca · más barato · con mate ]', 960, 780, C.tel, 20, { align: 'center', a: E.out(tk) });
};

// 3 · La Luna en datos
SC.luna = (lt, d, t) => {
  const cx = 470, cy = 580, R = 320;
  const k = E.out5(p(lt, 0, 1));
  sectionCode('01 / Desafío', 120, 150, k);
  rich([['Cómo es ', F.serif(84), C.paper], ['la Luna', F.serif(84, true), C.sun]], 120, 240, { a: k });
  c.save(); c.globalAlpha = k;
  const lon = -20 + t * 5;
  bezel(cx, cy, R + 34, t);
  drawSphere(TEX.luna, cx, cy, R * lerp(0.9, 1, k), lon, 6, { light: [0.8, 0.35, 0.5], halo: HALO_M, haloR: 1.07, amb: 0.04 });
  L('Luna · satélite natural', cx, cy + R + 70, C.dust, 15, { align: 'center' });
  L('Ø 3.474 km', cx, cy + R + 94, C.tel, 15, { align: 'center' });
  c.restore();
  const rows = [
    { v: [['1/6 ', F.serif(128), C.sun], ['g', F.serif(128, true), C.sun]], lab: 'Gravedad', q: 'Saltás seis veces más alto. El mate, también.', ay: cy - 170 },
    { v: [['Sin ', F.serif(104), C.paper], ['atmósfera', F.serif(104, true), C.sun]], lab: 'Aire', q: 'Ni viento, ni clima, ni nadie que te escuche silbar.', ay: cy },
    { v: [['120 °C ', F.serif(104), C.sun], ['/ ', F.serif(104), C.dust], ['−246 °C', F.serif(104), C.tel]], lab: 'De día / de noche', q: '366 grados de diferencia. Llevá abrigo. Y bermudas.', ay: cy + 170 },
  ];
  rows.forEach((r, i) => {
    const at = LUNA_ROWS[i]; const a = E.out5(p(lt, at, at + 0.6)); if (a <= 0) return;
    const y = 392 + i * 205, x = 960 + (1 - a) * 60;
    c.save(); c.globalAlpha = a;
    // línea de llamada desde la Luna
    const px = cx + Math.sqrt(Math.max(0, R * R - (r.ay - cy) ** 2)) * 0.82;
    circle(px, r.ay, 4, C.signal, 1.5);
    c.strokeStyle = C.lineStrong; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 6, r.ay); c.lineTo(880, y - 40); c.lineTo(930, y - 40); c.stroke();
    L(`0${i + 1}`, x, y - 104, C.signal, 16, { w: 500 }); L(r.lab, x + 46, y - 104, C.dust, 16);
    rich(r.v, x, y, {});
    T(r.q, x, y + 46, F.body(27, 400), C.paper, { a: 0.85 });
    c.restore();
    if (i < 2) line(960, y + 70, 1800, y + 70, C.line, 1);
  });
  // mate en 1/6 g
  const mk = p(lt, 0.9, 6.5);
  if (mk > 0) {
    const ph = ((lt - 0.9) % 2.4) / 2.4, hgt = 4 * ph * (1 - ph);
    const a = clamp((lt - 0.9) * 4);
    c.save(); c.globalAlpha = a;
    mate(1660, 396 - hgt * 190, 0.62, lt, Math.sin(lt * 1.3) * 0.25);
    line(1610, 400, 1710, 400, C.lineStrong, 1);
    c.restore();
  }
  // termómetro
  const tk = p(lt, LUNA_ROWS[2] + 0.2, LUNA_ROWS[2] + 1.4);
  if (tk > 0) {
    const x0 = 960, x1 = 1800, y = 892;
    c.save(); c.globalAlpha = clamp(tk * 4);
    const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.tel); g.addColorStop(0.55, C.dust); g.addColorStop(1, C.signal);
    c.fillStyle = C.line; c.fillRect(x0, y, x1 - x0, 6);
    c.fillStyle = g; c.fillRect(x0, y, (x1 - x0) * E.io(tk), 6);
    L('−246 °C', x0, y + 34, C.tel, 14); L('120 °C', x1, y + 34, C.signal, 14, { align: 'right' });
    c.restore();
  }
};

// 4 · Buscamos su gemela en la Tierra
const REGION_CENTER = Object.fromEntries(REGION_ORDER.map((r) => {
  const v = [0, 0, 0]; CRATERS.filter((k) => k.region === r).forEach((k) => { const q = toVec(k.lat, k.lon); v[0] += q[0]; v[1] += q[1]; v[2] += q[2]; });
  return [r, fromVec(v)];
}));
function globoCam(lt) {
  const keys = REGION_ORDER.map((r, i) => ({ t: GLOBO.start + i * GLOBO.per, ...REGION_CENTER[r] }));
  keys.forEach((k) => { k.lat = clamp(k.lat, -62, 62); });
  if (lt <= keys[0].t) return slerp({ lat: 20, lon: -100 }, keys[0], E.io(p(lt, -0.4, keys[0].t)));
  for (let i = keys.length - 1; i >= 0; i--) {
    if (lt >= keys[i].t) {
      if (i === keys.length - 1) { const q = keys[i]; return { lat: q.lat, lon: q.lon + (lt - q.t) * 3 }; }
      return i === 0 && lt < keys[0].t ? keys[0] : slerp(keys[i], keys[i + 1], E.io(p(lt, keys[i].t + GLOBO.per * 0.45, keys[i + 1].t)));
    }
  }
  return keys[0];
}
SC.globo = (lt, d, t) => {
  const cx = 640, cy = 580, R = 350;
  const k = E.out5(p(lt, 0, 0.9));
  const cam = globoCam(lt);
  c.save(); c.globalAlpha = k;
  bezel(cx, cy, R + 40, t);
  drawSphere(TEX.tierra, cx, cy, R, cam.lon, cam.lat, { light: [-0.35, 0.5, 0.8], halo: HALO_E, haloR: 1.1, amb: 0.2, sat: 0.9 });
  graticule(cx, cy, R, cam.lon, cam.lat, 0.1);
  // marcadores
  let count = 0;
  for (const m of CRATER_TIMES) {
    const age = lt - m.t; if (age < 0) continue; count++;
    const q = proj(m.c.lat, m.c.lon, cx, cy, R, cam.lon, cam.lat); if (q.z < 0.03) continue;
    const vis = clamp(q.z * 4), pop = E.back(clamp(age * 4));
    c.save(); c.globalAlpha = k * vis;
    const col = m.c.recommended ? C.sun : C.signal;
    if (age < 0.7) circle(q.x, q.y, 6 + age * 60, col, 2 * (1 - age / 0.7));
    circle(q.x, q.y, 9 * pop, col, 1.5, null, 'rgba(5,6,10,.45)');
    circle(q.x, q.y, 3.6 * pop, null, 0, null, col);
    c.restore();
  }
  L(`Centro · ${fmtCoord(cam.lat, ((cam.lon + 540) % 360) - 180)}`, cx, cy + R + 78, C.tel, 15, { align: 'center' });
  L('Tierra · 3er planeta', cx, cy - R - 62, C.dust, 15, { align: 'center' });
  c.restore();
  // panel derecho
  const x = 1150;
  sectionCode('02 / Atlas', x, 170, k);
  T('Buscamos su gemela', x, 250, F.serif(74), C.paper, { a: k });
  T('en la Tierra', x, 326, F.serif(74, true), C.sun, { a: k });
  // contador
  const last = CRATER_TIMES.filter((m) => m.t <= lt).pop();
  const bump = last ? 1 + 0.06 * (1 - clamp((lt - last.t) * 8)) : 1;
  const done = lt > GLOBO.start + 6 * GLOBO.per;
  const fin = done ? 1 + 0.12 * (1 - E.out(clamp((lt - (GLOBO.start + 6 * GLOBO.per)) * 2))) : 1;
  c.save(); c.translate(x, 590); c.scale(bump * fin, bump * fin); c.globalAlpha = k;
  T(pad2(count), -8, 0, F.serif(290), done ? C.sun : C.paper);
  c.restore();
  const wN = tw('62', F.serif(290));
  L('cráteres', x + wN + 24, 500, C.dust, 20, { a: k }); L('analizados', x + wN + 24, 530, C.dust, 20, { a: k });
  if (done) L('· todos ·', x + wN + 24, 572, C.signal, 18, { a: E.out(p(lt, 8, 8.4)) });
  // regiones
  REGION_ORDER.forEach((r, i) => {
    const y = 672 + i * 43, at = GLOBO.start + i * GLOBO.per;
    const n = CRATER_TIMES.filter((m) => m.region === r && m.t <= lt).length;
    const tot = CRATER_TIMES.filter((m) => m.region === r).length;
    const active = lt >= at && lt < at + GLOBO.per, seen = lt >= at;
    c.save(); c.globalAlpha = k * (seen ? 1 : 0.35);
    if (active) { c.fillStyle = C.signalSoft; c.fillRect(x - 14, y - 27, 640, 40); c.fillStyle = C.signal; c.fillRect(x - 14, y - 27, 3, 40); }
    L(REGIONS[r], x + 6, y, active ? C.paper : seen ? C.dust : C.dust, 19, { w: active ? 500 : 400 });
    line(x + 230, y - 6, x + 230 + 300, y - 6, C.line, 1, [2, 6]);
    c.fillStyle = seen ? C.signal : C.line; c.fillRect(x + 230, y - 9, 300 * (n / 32), 5);
    L(pad2(n), x + 612, y, seen ? C.paper : C.dust, 19, { align: 'right', w: 500 });
    c.restore();
    if (r === 'africa' && n === tot && lt < at + GLOBO.per + 1.2) L('← se copó', x + 640, y, C.sun, 15, { a: E.out(p(lt, at + 1.1, at + 1.4)) * (1 - p(lt, at + GLOBO.per + 0.9, at + GLOBO.per + 1.2)) });
  });
};

// 5/7/10 · Tomas reales del sitio
SC.webAtlas = (lt, d) => monitor(IMG.atlas, lt, d, { chan: 'Canal 02 · Atlas', z0: 1.02, z1: 1.2, x0: 0.5, x1: 0.48, y0: 0.2, y1: 1, kicker: 'En la web · [ 02 / Atlas ]', title: [['Un atlas de ', F.serif(66), C.paper], ['tres mundos', F.serif(66, true), C.sun], ['  para girar con el mouse', F.body(26, 400), C.dust]] });
SC.webGemelos = (lt, d) => monitor(IMG.gemelos, lt, d, { chan: 'Canal 03 · Gemelos', z0: 1.22, z1: 1.08, x0: 0.3, x1: 0.42, y0: 0.25, y1: 0.4, kicker: 'En la web · [ 03 / Gemelos ]', title: [['Cada pareja, con su ', F.serif(66), C.paper], ['ficha técnica', F.serif(66, true), C.sun]] });
SC.webBase = (lt, d) => monitor(IMG.base, lt, d, { chan: 'Canal 07 · Base lunar', z0: 1.04, z1: 1.2, x0: 0.4, x1: 0.35, y0: 0.5, y1: 1, kicker: 'En la web · [ 07 / Base lunar ]', title: [['Y una base lunar ', F.serif(66), C.paper], ['para armar vos', F.serif(66, true), C.sun]] });

// 6 · Duelos de gemelos
const byId = (id) => CRATERS.find((k) => k.id === id);
const moonId = (id) => LUNAR_FEATURES.find((k) => k.id === id);
const DUELS = [
  { e: byId('wolfe-creek'), m: moonId('moltke'), ep: 'Australia Occidental', mp: 'Mare Tranquillitatis', quip: 'Para el equipo, el cráter lunar más parecido a Wolfe Creek.' },
  { e: byId('kalkkop'), m: moonId('linne'), ep: 'Eastern Cape, Sudáfrica', mp: 'Mare Serenitatis', quip: 'Nuestro caso de estudio: lo miramos con lupa.' },
  { e: byId('chicxulub'), m: moonId('korolev'), ep: 'Yucatán, México', mp: 'Cara oculta', quip: 'Categoría peso pesado: 150 km contra 437 km.' },
  { e: byId('tabun-khara-obo'), m: moonId('linne'), ep: 'Desierto de Gobi, Mongolia', mp: 'Mare Serenitatis', quip: '¿Linné otra vez? Sí: tiene gemelos en dos continentes.' },
];
SC.duelos = (lt, d, t) => {
  const i = Math.min(3, Math.floor(lt / DUEL_D)), u = lt - i * DUEL_D, D = DUELS[i];
  const inn = E.back(p(u, 0, 0.42)), outk = p(u, DUEL_D - 0.22, DUEL_D), a = clamp(p(u, 0, 0.15)) * (1 - (i < 3 ? outk : 0));
  const hit = u > 0.36 ? Math.exp(-(u - 0.36) * 9) : 0;
  const shx = Math.sin(u * 90) * hit * 14, shy = Math.cos(u * 77) * hit * 8;
  const R = 235, cy = 440;
  // cabecera
  L('Duelo de gemelos', 960, 148, C.dust, 17, { align: 'center' });
  for (let k = 0; k < 4; k++) { c.fillStyle = k === i ? C.signal : k < i ? C.dust : C.line; c.fillRect(960 - 86 + k * 46, 168, 34, 4); }
  c.save(); c.globalAlpha = a; c.translate(shx, shy);
  const side = (isE, o) => {
    const cx = isE ? 480 : 1440, off = (1 - inn) * (isE ? -700 : 700), col = isE ? C.tel : C.sun;
    c.save(); c.translate(off, 0);
    bezel(cx, cy, R + 30, t * (isE ? 1 : -1));
    const lon0 = o.lon + Math.sin(u * 0.8) * 2 - 3 + u * 2, lat0 = clamp(o.lat, -70, 70);
    drawSphere(isE ? TEX.tierra : TEX.luna, cx, cy, R, lon0, lat0, isE
      ? { light: [-0.3, 0.5, 0.8], halo: HALO_E, haloR: 1.1, amb: 0.22, sat: 0.9 }
      : { light: [0.6, 0.45, 0.65], halo: HALO_M, haloR: 1.08, amb: 0.1 });
    graticule(cx, cy, R, lon0, lat0, 0.08);
    const q = proj(o.lat, o.lon, cx, cy, R, lon0, lat0);
    const rk = p(u, 0.45, 0.85);
    reticle(q.x, q.y, 20 + (1 - E.out(rk)) * 50, C.signal, t, rk);
    L(isE ? 'Tierra' : 'Luna', cx, cy - R - 58, col, 20, { align: 'center', w: 500 });
    T(o.name, cx, cy + R + 118, F.serif(o.name.length > 12 ? 82 : 96, !isE), isE ? C.paper : C.sun, { align: 'center' });
    L(isE ? D.ep : D.mp, cx, cy + R + 164, col, 17, { align: 'center' });
    L(`Ø ${fmtKm(o.diameterKm)}  ·  ${fmtCoord(o.lat, o.lon)}`, cx, cy + R + 196, C.dust, 16, { align: 'center' });
    c.restore();
  };
  side(true, D.e); side(false, D.m);
  // VS
  const vk = p(u, 0.3, 0.6);
  if (vk > 0) {
    const s = lerp(3, 1, E.out5(vk));
    c.save(); c.translate(960, cy); c.scale(s, s); c.globalAlpha = a * clamp(vk * 3);
    circle(0, 0, 84, C.signal, 2, null, C.void); circle(0, 0, 98, C.signal, 1, [3, 7]);
    T('vs', 0, 34, F.serif(120, true), C.signal, { align: 'center' });
    c.restore();
    line(960 - 360 * E.out(vk), cy, 960 - 110, cy, C.signal, 1, [2, 8]); line(960 + 110, cy, 960 + 360 * E.out(vk), cy, C.signal, 1, [2, 8]);
  }
  stamp('Gemelos', 960, cy + 190, -0.09, p(u, 2.0, 2.5), C.signal, 40);
  const qa = E.out(p(u, 0.9, 1.3));
  T(D.quip, 960, 968 + (1 - qa) * 14, F.body(29, 400), C.paper, { align: 'center', a: qa });
  c.restore();
};

// 8 · Top 5
const TOP = [
  { ...byId('bajada-del-diablo'), n: 'Bajada del Diablo', pl: 'Chubut · Patagonia · Argentina', note: 'Para rovers, habitabilidad análoga y pruebas geotécnicas.' },
  { ...byId('la-payunia'), n: 'La Payunia', pl: 'Mendoza · Argentina', note: 'Campos de lava para análogos visuales y pruebas de movilidad.' },
  { ...byId('acraman'), n: 'Cráter Acraman', pl: 'Australia Meridional', note: 'Análogo árido y remoto para sistemas robóticos.' },
  { ...byId('woodleigh'), n: 'Cráter Woodleigh', pl: 'Australia Occidental', note: 'Para pruebas de rovers y sistemas autónomos.' },
  { ...byId('wolfe-creek'), n: 'Cráter Wolfe Creek', pl: 'Australia Occidental', note: 'Investigación científica y pruebas robóticas pasivas.' },
];
const TOP_START = { lat: -8, lon: -40 };
function topShip(lt) {
  const i = Math.min(4, Math.floor(lt / TOP_D)), u = lt - i * TOP_D;
  const from = i === 0 ? TOP_START : TOP[i - 1], q = E.io(p(u, 0, TOP_TRAVEL));
  return { i, u, q, pos: slerp(from, TOP[i], q) };
}
SC.top5 = (lt, d, t) => {
  const cx = 600, cy = 580, R = 370;
  const END = 5 * TOP_D, fin = p(lt, END, END + 0.5);
  const k = E.out5(p(lt, 0, 0.8));
  const { i, u, q, pos } = topShip(Math.min(lt, END - 0.001));
  const cam = { lat: clamp(pos.lat + 6, -60, 60) - E.io(fin) * 10, lon: pos.lon + E.io(fin) * 6 };
  c.save(); c.globalAlpha = k;
  bezel(cx, cy, R + 40, t);
  drawSphere(TEX.tierra, cx, cy, R, cam.lon, cam.lat, { light: [-0.35, 0.5, 0.8], halo: HALO_E, haloR: 1.1, amb: 0.22, sat: 0.9 });
  graticule(cx, cy, R, cam.lon, cam.lat, 0.09);
  // ruta punteada recorrida
  c.save(); c.fillStyle = C.tel;
  const STEP = 0.02;
  for (let s = 0; s <= lt + 1e-6 && s < END; s += STEP) {
    const ss = topShip(s); if (ss.u > TOP_TRAVEL) continue;
    if (Math.round(s / STEP) % 2) continue;
    const m = proj(ss.pos.lat, ss.pos.lon, cx, cy, R, cam.lon, cam.lat); if (m.z < 0.05) continue;
    c.globalAlpha = k * clamp(m.z * 3) * 0.9; c.beginPath(); c.arc(m.x, m.y, 2.2, 0, 7); c.fill();
  }
  c.restore();
  // sitios
  TOP.forEach((s, j) => {
    const arrived = lt >= j * TOP_D + TOP_TRAVEL; if (!arrived) return;
    const age = lt - (j * TOP_D + TOP_TRAVEL);
    const m = proj(s.lat, s.lon, cx, cy, R, cam.lon, cam.lat); if (m.z < 0.05) return;
    c.save(); c.globalAlpha = k * clamp(m.z * 4);
    if (age < 0.9) circle(m.x, m.y, 10 + age * 90, C.sun, 2.5 * (1 - age / 0.9));
    circle(m.x, m.y, 13, C.sun, 2, null, 'rgba(5,6,10,.6)'); circle(m.x, m.y, 5, null, 0, null, C.signal);
    if (j !== i || fin > 0) { L(`0${j + 1}`, m.x + 20, m.y - 12, C.sun, 17, { w: 500 }); }
    c.restore();
  });
  // nave
  const sp = proj(pos.lat, pos.lon, cx, cy, R, cam.lon, cam.lat);
  const fly = Math.sin(q * Math.PI), hover = 26 + fly * 70 + Math.sin(t * 5) * 3;
  const landed = u > TOP_TRAVEL;
  c.save(); c.globalAlpha = k * (1 - fin);
  line(sp.x, sp.y - hover + 4, sp.x, sp.y - 16, C.signal, 1, [3, 5]);
  lander(sp.x, sp.y - hover, 0.95, { flame: landed ? 0.25 + 0.1 * Math.sin(t * 30) : 0.9, t, rot: (i === 0 ? 0.25 : (TOP[i].lon > (i ? TOP[i - 1].lon : -40) ? 0.3 : -0.3)) * fly });
  c.restore();
  c.restore();
  // panel
  const x = 1130;
  sectionCode('05 / Top 5', x, 170, k);
  rich([['Cinco sitios ', F.serif(62), C.paper], ['recomendados', F.serif(62, true), C.sun]], x, 246, { a: k });
  for (let j = 0; j < 5; j++) { const on = lt >= j * TOP_D + TOP_TRAVEL; c.fillStyle = j === i && fin === 0 ? C.signal : on ? C.dust : C.line; c.fillRect(x + j * 60, 286, 48, 4); }
  if (fin < 1) {
    const s = TOP[i], a = E.out5(p(u, 0.2, 0.7)) * (1 - p(u, TOP_D - 0.15, TOP_D)) * (1 - fin);
    const tr = u < TOP_TRAVEL;
    L(tr ? `Rumbo al sitio 0${i + 1} …` : `Sitio 0${i + 1} · nave posada`, x + 330, 292, tr ? C.tel : C.signal, 15, { a: k });
    c.save(); c.globalAlpha = a; c.translate((1 - a) * 40, 0);
    T(String(i + 1), x - 10, 610, F.serif(330), C.signal);
    const nx = x + 190;
    L(s.pl, nx, 440, C.tel, 17);
    T(s.n, nx, 530, F.serif(78), C.paper);
    L(fmtCoord(s.lat, s.lon), nx, 578, C.dust, 16);
    line(x, 660, x + 660, 660, C.line, 1);
    para(s.note, x, 716, F.body(30, 400), C.paper, 640, 44);
    c.restore();
  }
  if (fin > 0) {
    const a = E.out5(fin);
    c.save(); c.globalAlpha = a; c.translate(0, (1 - a) * 30);
    L('Resultado final', x, 440, C.dust, 18);
    rich([['Argentina ', F.serif(84), C.paper], ['2', F.serif(84), C.sun]], x, 540, {});
    rich([['Australia ', F.serif(84), C.paper], ['3', F.serif(84), C.sun]], x, 640, {});
    line(x, 690, x + 660, 690, C.line, 1);
    T('Pedimos el VAR. No hubo caso.', x, 746, F.body(30, 400), C.paper);
    c.restore();
  }
};

// 9 · La base lunar se arma
function grow(at, lt) { return E.back(p(lt, at, at + 0.45)); }
function callout(x, yTop, label, sub, lt, at, up = 0) {
  const a = E.out(p(lt, at + 0.15, at + 0.5)); if (a <= 0) return;
  const y1 = yTop - 26, y2 = yTop - 70 - up;
  c.save(); c.globalAlpha = a;
  line(x, y1, x, lerp(y1, y2, a), C.lineStrong, 1); circle(x, y1, 3, null, 0, null, C.signal);
  L(label, x, y2 - 34, C.paper, 16, { align: 'center', w: 500 });
  L(sub, x, y2 - 12, C.dust, 13, { align: 'center' });
  c.restore();
}
SC.base = (lt, d, t) => {
  const HY = 760; // horizonte
  const k = E.out5(p(lt, 0, 0.7));
  // suelo
  c.save(); c.globalAlpha = k;
  const g = c.createLinearGradient(0, HY, 0, H); g.addColorStop(0, '#2b2a28'); g.addColorStop(0.25, '#1a1a1b'); g.addColorStop(1, '#0a0a0c');
  c.fillStyle = g; c.beginPath(); c.moveTo(0, HY + 14); c.quadraticCurveTo(W / 2, HY - 14, W, HY + 14); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.strokeStyle = C.dust; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, HY + 14); c.quadraticCurveTo(W / 2, HY - 14, W, HY + 14); c.stroke();
  const r = rng(7);
  for (let n = 0; n < 26; n++) {
    const x = r() * W, y = HY + 40 + r() * r() * 260, w = 20 + r() * 90 * ((y - HY) / 200);
    c.strokeStyle = 'rgba(154,150,140,.28)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, w, w * 0.16, 0, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(x, y + 1, w * 0.8, w * 0.1, 0, Math.PI, 2 * Math.PI); c.stroke();
  }
  // Tierra en el cielo
  drawSphere(TEX.tierra, 1640, 250, 74, -60 + t * 3, -10, { light: [-0.6, 0.4, 0.6], halo: HALO_E, haloR: 1.3 });
  L('Tierra · 384.400 km', 1640, 366, C.tel, 13, { align: 'center' });
  c.restore();
  // título
  sectionCode('07 / Base lunar', 120, 170, k);
  rich([['Qué necesita ', F.serif(78), C.paper], ['una base lunar', F.serif(78, true), C.sun]], 120, 254, { a: k });
  const GY = HY + 6;
  // plataforma + nave
  const px = 330;
  c.save(); c.globalAlpha = k;
  c.strokeStyle = C.signal; c.lineWidth = 2; c.beginPath(); c.ellipse(px, GY + 22, 150, 20, 0, 0, 7); c.stroke();
  c.setLineDash([4, 8]); c.beginPath(); c.ellipse(px, GY + 22, 110, 14, 0, 0, 7); c.stroke(); c.setLineDash([]);
  c.restore();
  const dk = p(lt, 0, 1.25), ly = lerp(-160, GY + 18, E.out(dk));
  if (dk > 0.55 && dk < 1.6) { // polvo
    const dp = p(lt, 0.7, 1.9); c.save(); c.fillStyle = C.dust;
    const rr = rng(3); for (let n = 0; n < 26; n++) { const dir = n % 2 ? 1 : -1, sp = 60 + rr() * 220, hh = rr() * 50; c.globalAlpha = 0.5 * (1 - dp); c.beginPath(); c.arc(px + dir * sp * E.out(dp), GY + 16 - hh * Math.sin(dp * Math.PI), 2 + rr() * 5, 0, 7); c.fill(); }
    c.restore();
  }
  lander(px, ly, 1.5, { flame: dk < 1 ? 1.1 - dk * 0.5 : 0, t, flag: p(lt, 1.5, 2.1) });
  callout(px, GY - 190, 'Plataforma', 'aterrizaje y despegue', lt, BASE_POPS[0]);
  // módulos
  const mod = (x, at, fn) => { const s = grow(at, lt); if (s <= 0) return; c.save(); c.translate(x, GY); c.scale(lerp(0.6, 1, s), s); c.globalAlpha = clamp(p(lt, at, at + 0.12)); c.lineJoin = 'round'; c.lineCap = 'round'; fn(); c.restore(); };
  // hábitat (domo blindado)
  mod(700, BASE_POPS[1], () => {
    c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 120, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.lineWidth = 1; c.strokeStyle = C.lineStrong; for (let a = 1; a < 6; a++) { c.beginPath(); c.ellipse(0, 0, 120 * Math.cos(a * Math.PI / 12), 120, 0, Math.PI, 0); c.stroke(); }
    c.beginPath(); c.arc(0, 0, 80, Math.PI, 0); c.stroke();
    c.fillStyle = C.sun; [-56, -20, 20, 56].forEach((wx) => { c.globalAlpha *= 1; c.fillRect(wx - 9, -50, 18, 12); });
    c.fillStyle = C.void; c.strokeStyle = C.paper; c.lineWidth = 2.5; rrect(-18, -34, 36, 34, 4); c.fill(); c.stroke();
    c.strokeStyle = C.dust; c.lineWidth = 2; c.beginPath(); c.moveTo(-150, 0); c.quadraticCurveTo(-130, -40, -100, -62); c.moveTo(150, 0); c.quadraticCurveTo(130, -40, 100, -62); c.stroke();
  });
  callout(700, GY - 120, 'Hábitat blindado', 'protección y soporte vital', lt, BASE_POPS[1], 40);
  // esclusa
  mod(880, BASE_POPS[2], () => {
    c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3; rrect(-40, -62, 80, 62, 6); c.fill(); c.stroke();
    c.strokeStyle = C.tel; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -30, 19, 0, 7); c.stroke(); line(-19, -30, 19, -30, C.tel, 1.5);
    line(-70, -30, -40, -30, C.paper, 6);
  });
  callout(880, GY - 62, 'Esclusa', 'de aire', lt, BASE_POPS[2]);
  // invernadero
  mod(1070, BASE_POPS[3], () => {
    c.fillStyle = 'rgba(143,227,255,.07)'; c.strokeStyle = C.tel; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-95, 0); c.lineTo(-95, -30); c.quadraticCurveTo(0, -100, 95, -30); c.lineTo(95, 0); c.closePath(); c.fill(); c.stroke();
    c.lineWidth = 1; [-48, 0, 48].forEach((vx) => line(vx, 0, vx, -30 - (1 - Math.abs(vx) / 95) * 35 - 12, C.tel, 1));
    c.strokeStyle = C.sun; c.lineWidth = 2.5; [-70, -42, -14, 14, 42, 70].forEach((vx, n) => { const hh = 16 + (n % 3) * 5 + Math.sin(t * 2 + n) * 1.5; c.beginPath(); c.moveTo(vx, -2); c.lineTo(vx, -hh); c.moveTo(vx, -hh * 0.6); c.lineTo(vx - 7, -hh * 0.9); c.moveTo(vx, -hh * 0.75); c.lineTo(vx + 7, -hh * 1.05); c.stroke(); });
  });
  callout(1070, GY - 66, 'Invernadero', 'reciclaje y agricultura', lt, BASE_POPS[3], 90);
  // paneles solares
  mod(1300, BASE_POPS[4], () => {
    [-70, 0, 70].forEach((ox) => {
      line(ox, 0, ox, -52, C.paper, 3);
      c.save(); c.translate(ox, -58); c.rotate(-0.42); c.fillStyle = '#10222b'; c.strokeStyle = C.tel; c.lineWidth = 2.5; c.fillRect(-32, -22, 64, 44); c.strokeRect(-32, -22, 64, 44);
      c.lineWidth = 1; line(-11, -22, -11, 22, C.tel, 1); line(11, -22, 11, 22, C.tel, 1); line(-32, 0, 32, 0, C.tel, 1); c.restore();
    });
  });
  callout(1300, GY - 96, 'Energía', 'solar + almacenamiento', lt, BASE_POPS[4]);
  // antena
  mod(1510, BASE_POPS[5], () => {
    line(0, 0, 0, -120, C.paper, 3); line(-26, 0, 0, -44, C.paper, 2); line(26, 0, 0, -44, C.paper, 2);
    c.save(); c.translate(0, -124); c.rotate(-0.6 + Math.sin(t * 1.2) * 0.08);
    c.fillStyle = C.void2; c.strokeStyle = C.paper; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 44, 0.15, Math.PI - 0.15); c.closePath(); c.fill(); c.stroke();
    line(0, 4, 0, -30, C.paper, 2); c.fillStyle = C.signal; c.beginPath(); c.arc(0, -32, 5, 0, 7); c.fill(); c.restore();
  });
  { // ondas de la antena
    const a0 = p(lt, BASE_POPS[5] + 0.4, BASE_POPS[5] + 0.6);
    if (a0 > 0) for (let n = 0; n < 3; n++) { const ph = ((lt * 0.9 + n / 3) % 1); c.save(); c.globalAlpha = a0 * (1 - ph) * 0.8; c.strokeStyle = C.signal; c.lineWidth = 2; c.beginPath(); c.arc(1530, GY - 150, 30 + ph * 90, -1.25, -0.35); c.stroke(); c.restore(); }
  }
  callout(1510, GY - 170, 'Comunicaciones', 'y navegación', lt, BASE_POPS[5], 10);
  // rover que patina
  const r0 = 4.2;
  if (lt > r0) {
    const u = lt - r0, ry = 965;
    const drive = E.out(p(u, 0, 0.9)), skid = p(u, 0.35, 1.3);
    const x = lerp(2100, 1020, drive) - Math.sin(skid * Math.PI) * 60;
    const rot = Math.sin(skid * Math.PI * 3) * 0.32 * (1 - skid) - (u > 0.3 && u < 1.2 ? 0.12 * Math.sin(skid * Math.PI) : 0);
    // huellas
    c.save(); c.strokeStyle = 'rgba(154,150,140,.5)'; c.lineWidth = 3; c.setLineDash([10, 8]);
    [0, 14].forEach((oy) => { c.beginPath(); for (let s = 0; s <= 1.001; s += 0.04) { const uu = s * Math.min(u, 1.3); const dd = E.out(p(uu, 0, 0.9)), sk = p(uu, 0.35, 1.3); const xx = lerp(2100, 1020, dd) - Math.sin(sk * Math.PI) * 60, yy = ry + oy + Math.sin(sk * Math.PI * 3) * 16 * (1 - sk); if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); });
    c.restore();
    // polvo del derrape
    if (u > 0.3 && u < 1.5) { const rr = rng(11); c.save(); c.fillStyle = C.dust; for (let n = 0; n < 16; n++) { const dp = p(u, 0.3 + rr() * 0.3, 1.5); c.globalAlpha = 0.5 * (1 - dp) * (dp > 0 ? 1 : 0); c.beginPath(); c.arc(x + 40 + rr() * 220 * dp, ry - rr() * 60 * Math.sin(dp * Math.PI), 3 + rr() * 6, 0, 7); c.fill(); } c.restore(); }
    rover(x, ry, 1.35, rot, -drive * 40 + skid * 3, t);
    const sa = E.back(p(u, 1.05, 1.4));
    if (sa > 0) {
      c.save(); c.translate(x + 400, ry - 96); c.scale(sa, sa); c.globalAlpha = clamp(sa);
      c.fillStyle = C.void2; c.strokeStyle = C.signal; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-235, -36); c.lineTo(235, -36); c.lineTo(235, 36); c.lineTo(-235, 36); c.lineTo(-235, 14); c.lineTo(-268, 0); c.lineTo(-235, -10); c.closePath(); c.fill(); c.stroke();
      L('Rover 01: «Patiné. Todo bien.»', 0, 7, C.paper, 19, { align: 'center', w: 500 });
      c.restore();
    }
  }
};

// 11 · Misiones análogas de la NASA
const MIS = [
  { n: 'Apollo', pl: 'Arizona · Hawái · Ontario', q: 'Los astronautas practicaron en cráteres y volcanes de la Tierra.' },
  { n: 'Artemis', pl: 'Arizona · Nevada · isla Devon', q: 'Ensaya el Polo Sur lunar… en el Ártico canadiense.' },
  { n: 'D-RATS', pl: 'Black Point, Arizona', q: 'Rovers y caminatas espaciales simuladas sobre lava.' },
  { n: 'NEEMO', pl: 'Aquarius, Florida', q: 'Para simular 1/6 g se fueron a vivir al fondo del mar.' },
  { n: 'VIPER', pl: 'Lab. SLOPE, Ohio · Hawái', q: 'Un rover que entrena para no patinar. Tomá nota, Rover 01.' },
];
SC.misiones = (lt, d, t) => {
  const k = E.out5(p(lt, 0, 0.6));
  sectionCode('06 / Misiones', 120, 170, k);
  rich([['La NASA ya lo hace: ', F.serif(78), C.paper], ['ensaya acá antes de ir allá', F.serif(78, true), C.sun]], 120, 258, { a: k });
  const cw = 320, gap = 20, y0 = 370, ch = 500;
  MIS.forEach((m, i) => {
    const at = MISION_POPS[i], s = E.back(p(lt, at, at + 0.4)); if (s <= 0) return;
    const x = 120 + i * (cw + gap);
    c.save(); c.translate(x + cw / 2, y0 + ch / 2); c.scale(lerp(0.8, 1, s), lerp(0.8, 1, s)); c.translate(-cw / 2, -ch / 2); c.globalAlpha = clamp(p(lt, at, at + 0.15));
    c.fillStyle = C.void2; c.fillRect(0, 0, cw, ch); c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(0, 0, cw, ch);
    corners(0, 0, cw, ch, 12, C.lineStrong);
    c.fillStyle = C.signal; c.fillRect(0, 0, cw * E.out(p(lt, at + 0.1, at + 0.6)), 3);
    L(`0${i + 1}`, 28, 54, C.signal, 18, { w: 500 });
    // insignia: órbita punteada
    const ox = cw - 70, oy = 64;
    circle(ox, oy, 26, C.lineStrong, 1, [2, 5]); circle(ox, oy, 9, C.dust, 1.5);
    const an = t * 1.4 + i; circle(ox + Math.cos(an) * 26, oy + Math.sin(an) * 26, 4, null, 0, null, C.tel);
    T(m.n, 28, 190, F.serif(78), C.paper);
    L('Base en la Tierra', 28, 244, C.dust, 13);
    para(m.pl.toUpperCase(), 28, 274, F.mono(16, 500), C.tel, cw - 96, 24, { ls: 2 });
    line(28, 332, cw - 28, 332, C.line, 1);
    para(m.q, 28, 378, F.body(24, 400), C.paper, cw - 56, 35);
    c.restore();
  });
  L('Fuentes: NASA Technical Reports Server · NASA Analog Missions', 120, 930, C.dust, 14, { a: E.out(p(lt, 1.8, 2.3)) });
};

// 12 · Equipo
const TEAM = ['Elisa Cadoppi', 'Santiago Boezio', 'Matías Elena', 'Santiago Marín', 'Valentina Battistela', 'Matías Llansó'];
SC.equipo = (lt, d, t) => {
  const k = E.out5(p(lt, 0, 0.7));
  c.save(); c.globalAlpha = k;
  drawSphere(TEX.luna, 330, 900, 420, 40 + t * 2, 20, { light: [0.3, 0.85, 0.4], halo: HALO_M, haloR: 1.06, amb: 0.02 });
  c.restore();
  sectionCode('10 / Equipo', 120, 170, k);
  rich([['Equipo ', F.serif(120), C.paper], ['La LUNA', F.serif(120, true), C.sun]], 120, 300, { a: k });
  T('Seis personas, una misión y un montón', 120, 372, F.body(29, 400), C.paper, { a: k * 0.9 });
  T('de pestañas abiertas.', 120, 414, F.body(29, 400), C.paper, { a: k * 0.9 });
  const x = 960;
  L('Tripulación', x, 300, C.dust, 16, { a: k });
  line(x, 322, 1800, 322, C.lineStrong, 1);
  TEAM.forEach((n, i) => {
    const at = 0.5 + i * 0.25, a = E.out5(p(lt, at, at + 0.5)); if (a <= 0) return;
    const y = 400 + i * 84;
    c.save(); c.globalAlpha = a; c.translate((1 - a) * 50, 0);
    L(`0${i + 1}`, x, y - 8, C.signal, 16, { w: 500 });
    T(n, x + 70, y, F.serif(66), C.paper);
    if (i === 5) { const w = tw(n, F.serif(66)); L('( C )', x + 70 + w + 26, y - 8, C.signal, 18, { w: 500 }); }
    c.restore();
    line(x, y + 24, 1800, y + 24, C.line, 1);
  });
  L('NASA Space Apps Challenge 2026', x, 936, C.tel, 17, { a: E.out(p(lt, 2.2, 2.7)) });
};

// 13 · Cierre
SC.cierre = (lt, d, t) => {
  const k = E.out5(p(lt, 0, 0.7));
  // mini monitor con el hero del sitio
  const mw = 900, mh = mw * 9 / 16, mx = (W - mw) / 2, my = 120;
  c.save(); c.globalAlpha = k; c.translate(0, (1 - k) * 30);
  c.fillStyle = C.void2; c.fillRect(mx - 10, my - 10, mw + 20, mh + 20); c.strokeStyle = C.lineStrong; c.lineWidth = 1; c.strokeRect(mx - 10, my - 10, mw + 20, mh + 20);
  corners(mx - 22, my - 22, mw + 44, mh + 44, 20, C.signal);
  c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip();
  const z = lerp(1.0, 1.07, E.io(p(lt, 0, d)));
  c.imageSmoothingQuality = 'high'; c.drawImage(IMG.hero, mx - (mw * z - mw) * 0.12, my - (mh * z - mh) * 0.5, mw * z, mh * z);
  c.restore();
  if (Math.sin(lt * 7) > -0.2) circle(mx + 22, my + 24, 6, null, 0, null, C.signal);
  c.restore();
  // URL
  const url = 'fronterasgalacticas.becode.com.ar', f = F.mono(58, 500);
  const n = Math.floor(p(lt, 0.3, 1.1) * url.length), w = tw(url, f), x0 = 960 - w / 2, y = 800;
  L('Recorré el sitio completo', 960, 712, C.signal, 18, { align: 'center', a: k });
  T(url.slice(0, n), x0, y, f, C.paper);
  if (n < url.length || Math.sin(lt * 9) > 0) { c.fillStyle = C.signal; c.fillRect(x0 + tw(url.slice(0, n), f) + 6, y - 50, 24, 58); }
  const lw = E.out(p(lt, 0.2, 1.1));
  line(960 - (w / 2 + 110) * lw, y + 34, 960 + (w / 2 + 210) * lw, y + 34, C.lineStrong, 1.5);
  // la nave aluniza sobre la línea
  const dk = p(lt, 0.1, 1.25), lx = 960 + w / 2 + 130, ly = lerp(-140, y + 33, E.out(dk));
  lander(lx, ly, 0.92, { flame: dk < 1 ? 1.1 - dk * 0.6 : 0, t, flag: p(lt, 1.5, 2.0) });
  if (dk >= 1) { const a = p(lt, 1.25, 2.0); c.save(); c.fillStyle = C.dust; const rr = rng(5); for (let q = 0; q < 12; q++) { const dir = q % 2 ? 1 : -1; c.globalAlpha = 0.5 * (1 - a); c.beginPath(); c.arc(lx + dir * (30 + rr() * 80) * E.out(a), y + 30 - rr() * 22 * Math.sin(a * Math.PI), 2 + rr() * 3, 0, 7); c.fill(); } c.restore(); }
  const a2 = E.out(p(lt, 1.5, 2.1));
  T('Nos vemos en la Luna. O en la Patagonia, que queda más cerca.', 960, 912 + (1 - a2) * 14, F.serif(46, true), C.sun, { align: 'center', a: a2 });
  L('Equipo La LUNA · NASA Space Apps Challenge 2026', 960, 968, C.dust, 16, { align: 'center', a: E.out(p(lt, 1.9, 2.5)) });
};

/* ------------------------------------------------------------------ */
/*  Compositor                                                         */
/* ------------------------------------------------------------------ */
const FADE_IN = 0.3, FADE_OUT = 0.22;
function renderFrame(t) {
  t = clamp(t, 0, DURATION - 1e-4);
  background(t);
  const sc = SCENES.find((s) => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];
  const lt = t - sc.t0;
  c = layer.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, W, H);
  c.save(); SC[sc.id](lt, sc.d, t); c.restore();
  let a = 1, z = 1;
  if (sc.id !== 'cuenta') { const i = E.out(p(lt, 0, FADE_IN)); a *= i; z = lerp(1.025, 1, i); }
  else a *= p(lt, 0, 0.4);
  if (sc.id !== 'cierre') { const o = p(lt, sc.d - FADE_OUT, sc.d); a *= 1 - o; if (sc.id !== 'cuenta') z *= lerp(1, 0.985, o); }
  out.save(); out.globalAlpha = a; out.translate(W / 2, H / 2); out.scale(z, z); out.translate(-W / 2, -H / 2);
  out.drawImage(layer, 0, 0); out.restore();
  // viñeta
  const vg = out.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, W * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
  out.fillStyle = vg; out.fillRect(0, 0, W, H);
  if (sc.id !== 'cuenta') { out.save(); out.globalAlpha = sc.id === 'titulo' ? p(lt, 0.3, 1) : 1; hud(t, sc); out.restore(); }
  // fundido final
  const end = p(t, DURATION - 0.7, DURATION - 0.05);
  if (end > 0) { out.globalAlpha = end; out.fillStyle = C.void; out.fillRect(0, 0, W, H); out.globalAlpha = 1; }
}

/* ------------------------------------------------------------------ */
/*  Arranque                                                           */
/* ------------------------------------------------------------------ */
async function boot() {
  const faces = [F.serif(100), F.serif(100, true), F.body(30, 400), F.body(30, 500), F.body(30, 700), F.mono(20, 400), F.mono(20, 500)];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'Áé°Ø−¿«abc123')));
  await document.fonts.ready;
  const [tierra, luna, hero, atlas, gemelos, base] = await Promise.all([
    '../assets/worlds-tierra.webp', '../assets/worlds-luna.webp', './shots/hero.jpg', './shots/atlas.jpg', './shots/gemelos.jpg', './shots/base.jpg',
  ].map(loadImg));
  TEX.tierra = toTex(tierra); TEX.luna = toTex(luna);
  Object.assign(IMG, { hero, atlas, gemelos, base });
  window.renderFrame = renderFrame;
  window.FILM = { duration: DURATION, scenes: SCENES };
  const qs = new URLSearchParams(location.search);
  if (qs.has('capture')) { document.body.classList.add('capture'); renderFrame(0); return; }
  if (qs.has('t')) { renderFrame(parseFloat(qs.get('t'))); return; }
  // vista previa en tiempo real
  const audio = new Audio('./out/audio.wav'); let t0 = performance.now(); let useAudio = false;
  audio.addEventListener('canplaythrough', () => { audio.play().then(() => { useAudio = true; }).catch(() => {}); }, { once: true });
  const loop = () => { const t = useAudio ? audio.currentTime : ((performance.now() - t0) / 1000) % DURATION; renderFrame(t); requestAnimationFrame(loop); };
  loop();
}
window.filmReady = boot();
