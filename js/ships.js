// Naves — capa global (#ships-layer) + ruta de reconocimiento (#recomendados).
//  · Módulo de descenso que acompaña el scroll por el margen derecho y aluniza sobre el footer.
//  · Naves ambientales que cruzan el viewport (clic = tirabuzón + mensaje).
//  · initRoute(): mini mapa equirectangular con una nave que recorre los 5 sitios recomendados.
// Sin dependencias duras: SVG + requestAnimationFrame. GSAP suaviza la ruta si está cargado.

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (n) => Math.round(n).toLocaleString('es-AR');
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/*  Ilustraciones                                                      */
/* ------------------------------------------------------------------ */

const DUST = [
  [9, -30, -9, 0], [9, -46, -4, .05], [9, -20, -16, .1], [9, 16, -8, .04], [9, -58, -12, .12],
  [111, 30, -9, .02], [111, 46, -4, .07], [111, 20, -16, .1], [111, -16, -8, .05], [111, 58, -12, .14],
  [60, -12, -6, .08], [60, 12, -6, .1],
].map(([x, dx, dy, d]) => `<circle class="ships-dust" cx="${x}" cy="120" r="3.2" style="--dx:${dx}px;--dy:${dy}px;--d:${d}s"/>`).join('');

const LANDER_SVG = `
<svg class="ships-lander__svg" viewBox="0 0 120 124" fill="none" stroke-linecap="round" stroke-linejoin="round" focusable="false">
  <g class="ships-flame"><g class="ships-flame__flicker">
    <path class="ships-flame__outer" d="M49 109Q60 178 71 109Z"/>
    <path class="ships-flame__inner" d="M54.5 109Q60 146 65.5 109Z"/>
  </g></g>
  <g class="ships-dustcloud">${DUST}</g>
  <g class="ships-flag"><path d="M-16 121V86"/><path class="ships-flag__cloth" d="M-16 86l-19 5.5 19 5.5Z"/></g>
  <g class="ships-lander__legs">
    <path d="M30 80 9 119M30 95 18 103M90 80l21 39M90 95l12 8"/>
    <path d="M1 120.5h16M103 120.5h16"/>
  </g>
  <g class="ships-lander__hull">
    <path class="ships-fill" d="M53 96h14l6 13H47Z"/>
    <path class="ships-thin" d="M50.5 102.5h19"/>
    <path class="ships-fill ships-gold" d="M28 74h64v22H28Z"/>
    <path class="ships-thin ships-gold" d="M38 74 28 86M50 74 31 96M62 74 43 96M74 74 55 96M86 74 67 96M92 81 79 96"/>
    <path class="ships-fill" d="M44 30h32l13 13v20l-9 11H40l-9-11V43Z"/>
    <path class="ships-thin" d="M31 57h21M68 57h21M54 59h12v15H54Z"/>
    <circle class="ships-window" cx="60" cy="44" r="8"/>
    <path class="ships-thin ships-tel" d="M55.6 42.6a5 5 0 0 1 3.8-3.4"/>
    <path class="ships-fill" d="M52 22h16v8H52Z"/>
    <path d="M78 32 88 12"/>
    <path class="ships-tel" d="M82 8.5a7 7 0 0 0 12 6.5"/>
    <circle class="ships-dot" cx="88" cy="12" r="1.4"/>
    <path class="ships-thin" d="M31 48h-7m3.5-3.5v7M89 48h7m-3.5-3.5v7"/>
  </g>
</svg>`;

// Naves ambientales: todas miran hacia +x, viewBox 64×32.
const AMBIENT = {
  cohete: `
    <g class="ships-flame__flicker ships-flame__flicker--x">
      <path class="ships-flame__outer" d="M14 12.4Q-4 16 14 19.6Z"/>
      <path class="ships-flame__inner" d="M14 14.2Q5 16 14 17.8Z"/>
    </g>
    <path class="ships-fill" d="M23 11 13 3.5V11M23 21 13 28.5V21"/>
    <path class="ships-fill" d="M14 11h26q10 1 16 5-6 4-16 5H14Z"/>
    <path class="ships-thin ships-sig" d="M29 11v10M32 11v10"/>
    <circle class="ships-window" cx="42" cy="16" r="2.6"/>`,
  satelite: `
    <path class="ships-fill ships-tel" d="M2 10h20v12H2ZM42 10h20v12H42Z"/>
    <path class="ships-thin ships-tel" d="M7 10v12M12 10v12M17 10v12M2 16h20M47 10v12M52 10v12M57 10v12M42 16h20"/>
    <path d="M22 16h4M38 16h4M32 9V5"/>
    <path class="ships-fill" d="M26 9h12v14H26Z"/>
    <path class="ships-sig" d="M27 3.6a5 3.6 0 0 0 10 0"/>
    <circle class="ships-dot" cx="32" cy="16" r="1.7"/>`,
  sonda: `
    <path class="ships-thin" d="M33 11 25 2.5M33 21l-8 8.5"/>
    <path d="M28 16H8"/>
    <path class="ships-thin" d="M13 13v6M19 13v6"/>
    <path class="ships-fill ships-gold" d="M2 13h6v6H2Z"/>
    <path class="ships-fill" d="M28 11h10v10H28Z"/>
    <path class="ships-fill" d="M38 4.5a13.5 13.5 0 0 1 0 23Z"/>
    <path class="ships-thin" d="M46 16h9"/>
    <circle class="ships-dot" cx="56.5" cy="16" r="1.5"/>`,
};

const MESSAGES = [
  'SEÑAL RECIBIDA · HOLA DESDE LA ÓRBITA',
  'COPIADO, TIERRA · SEGUIMOS BUSCANDO CRÁTERES',
  'TELEMETRÍA EN ORDEN · SALUDOS AL EQUIPO LA LUNA',
  'SEÑAL RECIBIDA · ACÁ ARRIBA NO HAY TRÁNSITO',
  'TIRABUZÓN COMPLETO · SIN MAREOS A BORDO',
];

/* ------------------------------------------------------------------ */
/*  init                                                               */
/* ------------------------------------------------------------------ */

export function init(root) {
  if (root && !root.dataset.shipsReady) {
    root.dataset.shipsReady = '1';
    try { initLayer(root); } catch (err) { console.error('[fronteras] ships/capa', err); }
  }
  const section = document.getElementById('recomendados');
  if (section) {
    try { initRoute(section); } catch (err) { console.error('[fronteras] ships/ruta', err); }
  }
}

/* ------------------------------------------------------------------ */
/*  Capa global: módulo de descenso + naves ambientales                */
/* ------------------------------------------------------------------ */

function initLayer(root) {
  const reduce = prefersReduced();
  const demo = /[?&]naves=demo\b/.test(location.search);
  root.classList.toggle('ships-layer--still', reduce);

  // ---------- Módulo de descenso ----------
  const lander = document.createElement('div');
  lander.className = 'ships-lander';
  lander.innerHTML = `
    <svg class="ships-lander__trail" viewBox="0 0 60 420" fill="none" focusable="false"><path d=""/></svg>
    <span class="ships-lander__alt"></span>
    <div class="ships-lander__tilt">${LANDER_SVG}</div>
    <span class="ships-lander__tag">Contacto · motor apagado</span>`;
  root.appendChild(lander);
  const trailPath = lander.querySelector('.ships-lander__trail path');
  const altEl = lander.querySelector('.ships-lander__alt');
  const tiltEl = lander.querySelector('.ships-lander__tilt');
  const flameEl = lander.querySelector('.ships-flame');

  const M = { vw: 0, vh: 0, max: 0, mobile: false, size: 46, h: 48, x: 0, top0: 88, landY: 0, amp: 0 };
  let needMeasure = true;

  function measure() {
    needMeasure = false;
    const de = document.documentElement;
    M.vw = de.clientWidth;
    M.vh = window.innerHeight;
    const docH = Math.max(de.scrollHeight, document.body.scrollHeight);
    M.max = Math.max(0, docH - M.vh);
    M.mobile = M.vw < 1360; // debajo de esto no hay margen libre: modo "solo alunizaje"
    const gutter = Math.max(clamp(M.vw * 0.04, 16, 56), (M.vw - 1280) / 2);
    M.size = M.mobile ? 38 : clamp(gutter - 10, 40, 60);
    M.h = M.size * 124 / 120;
    M.x = M.mobile ? M.vw - M.size - 14 : Math.min(M.vw - gutter / 2 - M.size / 2, M.vw - M.size - 4);
    M.amp = M.mobile ? 0 : clamp((gutter - M.size) / 2 - 2, 0, 7);
    const navH = parseFloat(getComputedStyle(de).getPropertyValue('--nav-h')) || 64;
    M.top0 = navH + 24;
    const footer = document.querySelector('.footer');
    const footTop = footer ? footer.getBoundingClientRect().top + window.scrollY : docH;
    // y (en viewport) del borde superior del footer cuando el scroll llega al final
    const ground = clamp(footTop - M.max, M.h + 90, M.vh - 6);
    M.landY = ground - M.h + 1;
    lander.style.width = `${M.size}px`;
    lander.style.height = `${M.h}px`;
    lander.classList.toggle('ships-lander--mobile', M.mobile);
  }

  const targetY = (s) => {
    if (M.mobile) return M.landY - Math.min(Math.max(M.max - s, 0), 400) * 0.25;
    const p = M.max > 0 ? clamp(s / M.max, 0, 1) : 1;
    return lerp(M.top0, M.landY, p);
  };
  const swayAt = (s) => Math.sin((s + targetY(s)) / 230) * M.amp;

  let landed = false;
  let lastAlt = '';
  const setLanded = (on) => {
    if (on === landed) return;
    landed = on;
    lander.classList.toggle('is-landed', on);
  };

  // ---------- Versión estática (prefers-reduced-motion) ----------
  if (reduce) {
    const still = () => {
      measure();
      const rem = M.max - window.scrollY;
      const on = rem <= 8;
      lander.style.opacity = on ? '1' : '0';
      lander.style.transform = `translate3d(${M.x.toFixed(1)}px, ${M.landY.toFixed(1)}px, 0)`;
      flameEl.style.transform = 'scaleY(0)';
      setLanded(on);
    };
    let queued = false;
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; still(); }); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('fronteras:content-ready', queue);
    still();
    return;
  }

  // ---------- Naves ambientales ----------
  const ships = [];
  const kinds = Object.keys(AMBIENT);
  let spawnIn = demo ? 400 : rand(3500, 6500);
  let msgIndex = 0;

  function spawn() {
    const kind = demo && !ships.length && !msgIndex ? 'cohete' : kinds[Math.floor(Math.random() * kinds.length)];
    const dir = Math.random() < 0.5 ? 1 : -1;
    const pad = 70;
    const y0 = rand(0.14, 0.7) * M.vh;
    const y1 = rand(0.14, 0.7) * M.vh;
    const a = { x: -pad, y: y0 };
    const b = { x: M.vw + pad, y: y1 };
    const [p0, p2] = dir > 0 ? [a, b] : [b, a];
    const bend = rand(0.14, 0.3) * M.vh * (Math.random() < 0.5 ? -1 : 1);
    const p1 = { x: M.vw * rand(0.3, 0.7), y: (y0 + y1) / 2 + bend * 1.6 };

    const el = document.createElement('div');
    el.className = `ships-amb ships-amb--${kind}`;
    el.innerHTML = `<svg viewBox="0 0 64 32" fill="none" stroke-linecap="round" stroke-linejoin="round" focusable="false">${AMBIENT[kind]}</svg>`;
    root.appendChild(el);
    const ship = {
      el, svg: el.firstElementChild, kind, dir, p0, p1, p2,
      t: 0, dur: (M.mobile ? rand(11000, 16000) : rand(17000, 26000)) * (kind === 'cohete' ? 0.8 : 1),
      spin: kind === 'satelite' ? rand(-0.012, 0.012) : 0, rot: rand(0, 360),
      trick: -1, x: 0, y: 0,
    };
    el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); doTrick(ship); });
    ships.push(ship);
    if (demo && ships.length === 1) setTimeout(() => doTrick(ship), 3200);
  }

  function doTrick(ship) {
    if (ship.trick >= 0) return;
    ship.trick = 0;
    ship.el.classList.add('is-tricking');
    const msg = document.createElement('div');
    msg.className = 'ships-msg';
    msg.textContent = MESSAGES[msgIndex++ % MESSAGES.length];
    root.appendChild(msg);
    const w = msg.offsetWidth;
    const h = msg.offsetHeight;
    const x = clamp(ship.x - w / 2, 12, Math.max(12, M.vw - w - 12));
    let y = ship.y - 74 - h;
    if (y < M.top0) y = ship.y + 64;
    msg.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
    msg.classList.add('is-on');
    setTimeout(() => msg.remove(), 3600);
  }

  function stepShips(dt) {
    spawnIn -= dt;
    const maxShips = M.mobile ? 1 : 2;
    if (spawnIn <= 0) {
      if (ships.length < maxShips) spawn();
      spawnIn = M.mobile ? rand(13000, 22000) : rand(8000, 15000);
    }
    for (let i = ships.length - 1; i >= 0; i--) {
      const sh = ships[i];
      const tricking = sh.trick >= 0;
      sh.t += (dt / sh.dur) * (tricking ? 0.35 : 1);
      if (sh.t >= 1) { sh.el.remove(); ships.splice(i, 1); continue; }
      const t = sh.t;
      const u = 1 - t;
      let x = u * u * sh.p0.x + 2 * u * t * sh.p1.x + t * t * sh.p2.x;
      let y = u * u * sh.p0.y + 2 * u * t * sh.p1.y + t * t * sh.p2.y;
      const tx = 2 * u * (sh.p1.x - sh.p0.x) + 2 * t * (sh.p2.x - sh.p1.x);
      const ty = 2 * u * (sh.p1.y - sh.p0.y) + 2 * t * (sh.p2.y - sh.p1.y);
      let angle = Math.atan2(ty, tx) * 180 / Math.PI;
      if (sh.spin) { sh.rot += sh.spin * dt; angle = sh.rot; }
      let scale = 1;
      if (tricking) {
        sh.trick += dt / 1700;
        const k = Math.min(sh.trick, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const th = e * Math.PI * 4; // dos vueltas
        const R = 26;
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len * sh.dir; const ny = tx / len * sh.dir; // normal "hacia arriba" de la trayectoria
        x += (tx / len) * R * Math.sin(th) - nx * R * (1 - Math.cos(th));
        y += (ty / len) * R * Math.sin(th) - ny * R * (1 - Math.cos(th));
        angle -= sh.dir * e * 720;
        scale = 1 + 0.22 * Math.sin(Math.PI * k);
        if (sh.trick >= 1) { sh.trick = -1; sh.el.classList.remove('is-tricking'); }
      }
      sh.x = x; sh.y = y;
      sh.el.style.transform = `translate3d(${(x - 30).toFixed(1)}px, ${(y - 30).toFixed(1)}px, 0)`;
      sh.svg.style.transform = `rotate(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)}, ${(scale * (sh.dir < 0 && !sh.spin ? -1 : 1)).toFixed(3)})`;
    }
  }

  // ---------- Bucle ----------
  let raf = 0;
  let last = 0;
  let prevS = window.scrollY;
  let vel = 0;   // px/ms suavizado
  let lag = 0;   // inercia vertical
  let sig = '';

  function stepLander(dt) {
    const s = window.scrollY;
    const rawV = (s - prevS) / dt;
    prevS = s;
    vel += (clamp(rawV, -6, 6) - vel) * Math.min(1, dt / 110);
    if (Math.abs(vel) < 0.0005) vel = 0;
    lag += (clamp(vel * 26, -34, 34) - lag) * Math.min(1, dt / 160);
    if (Math.abs(lag) < 0.02) lag = 0;

    const rem = M.max - s;
    const ty = targetY(s);
    const y = Math.min(ty - lag, M.landY);
    const x = M.x + (M.mobile ? 0 : swayAt(s));

    if (!landed && rem <= 4 && Math.abs(vel) < 0.04 && Math.abs(y - M.landY) < 1.2) setLanded(true);
    else if (landed && rem > 14) setLanded(false);

    const next = `${s}|${y.toFixed(1)}|${vel.toFixed(3)}|${landed}|${M.vw}|${M.max}`;
    if (next === sig) return;
    sig = next;

    const speed = Math.abs(vel);
    const tilt = landed ? 0 : clamp(vel * 8, -15, 15);
    lander.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    tiltEl.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
    flameEl.style.transform = `scaleY(${landed ? 0 : (0.4 + Math.min(speed * 0.75, 1.5)).toFixed(3)})`;
    lander.style.opacity = M.mobile ? clamp(1 - rem / 340, 0, 1).toFixed(2) : '';

    if (M.mobile) return;

    // Estela: puntos anclados al documento (quedan donde pasó la nave)
    const STEP = 16;
    const base = s + y;
    const sx = x - M.x;
    let d = '';
    const s0 = Math.floor(s / STEP) * STEP;
    for (let i = 0; i < 26; i++) {
      const sp = s0 - i * STEP;
      if (sp < 0) break;
      const dy = sp + targetY(sp) - base;
      if (dy > -M.h * 0.22) continue;
      if (dy < -420) break;
      d += `M${(30 + swayAt(sp) - sx).toFixed(1)} ${(420 + dy).toFixed(1)}h.01`;
    }
    trailPath.setAttribute('d', d);

    const p = M.max > 0 ? clamp(s / M.max, 0, 1) : 1;
    const alt = landed ? 'ALT 0 KM' : `ALT ${fmt(384400 * (1 - p))} KM`;
    if (alt !== lastAlt) { lastAlt = alt; altEl.textContent = alt; }
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = clamp(now - last, 1, 50);
    last = now;
    if (needMeasure) measure();
    stepLander(dt);
    stepShips(dt);
  }
  const start = () => {
    if (raf) return;
    last = performance.now();
    prevS = window.scrollY;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  const invalidate = () => { needMeasure = true; sig = ''; };
  window.addEventListener('resize', invalidate);
  window.addEventListener('load', invalidate);
  window.addEventListener('fronteras:content-ready', invalidate);
  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(document.body);

  measure();
  if (!document.hidden) start();
}

/* ------------------------------------------------------------------ */
/*  Ruta de reconocimiento (#recomendados)                             */
/* ------------------------------------------------------------------ */

const LON0 = -100, LON1 = 170, LAT0 = 2, LAT1 = -58;
const SX = 4, SY = 5.2;
const MAP_W = (LON1 - LON0) * SX;   // 1080
const MAP_H = (LAT0 - LAT1) * SY;   // 312
const px = (lon) => (lon - LON0) * SX;
const py = (lat) => (LAT0 - lat) * SY;

// label: [x, y, anchor] en píxeles de pantalla respecto del marcador
const SITES = [
  { name: 'Bajada del Diablo', lat: -42.8, lon: -67.5, label: [12, 22, 'start'] },
  { name: 'La Payunia', lat: -36.4, lon: -69.2, label: [13, -19, 'start'] },
  { name: 'Acraman', lat: -32.02, lon: 135.45, label: [0, 27, 'middle'] },
  { name: 'Woodleigh', lat: -26.05, lon: 114.66, label: [-15, 0, 'end'] },
  { name: 'Wolfe Creek', lat: -19.17, lon: 127.8, label: [-13, -19, 'end'] },
];
// Curvatura de cada tramo (desplazamiento del punto de control, en unidades del mapa)
const BENDS = [[-18, 0], [0, 172], [-4, -34], [-16, -22]];

// Contornos muy simplificados [lon, lat] — son decorativos, no cartografía.
const LAND = [
  // Sudamérica (al sur de ~2°N)
  [[-79, 6], [-80, 0.5], [-80.9, -1], [-80.3, -3.4], [-81.3, -4.7], [-81, -6], [-79.8, -7.3], [-78.5, -9.5], [-77.2, -12], [-76.2, -13.8], [-75, -15.5], [-72.5, -16.8], [-70.4, -18.4], [-70.1, -21], [-70.5, -25.5], [-71.4, -29.5], [-71.6, -33], [-73.2, -37], [-73.7, -41], [-74.3, -45], [-75.4, -48.5], [-74.2, -52.2], [-71.5, -53.8], [-69, -55.2], [-66.5, -55], [-65.2, -54.6], [-68.3, -52.6], [-69, -50.8], [-67.6, -49], [-65.8, -47.2], [-67.5, -46], [-65.4, -45], [-65.2, -43.2], [-63.6, -42.5], [-64.9, -40.8], [-62.2, -39], [-57.6, -38.2], [-56.7, -36.4], [-57.3, -35.3], [-58.4, -34.3], [-56, -34.9], [-53.4, -33.8], [-51, -31], [-48.7, -28.3], [-48.5, -25.8], [-46.3, -24], [-43.2, -23], [-41, -22], [-39.7, -19.5], [-39, -17], [-38.9, -13.5], [-37.3, -11.3], [-35, -8.5], [-35.2, -5.3], [-37.5, -4.6], [-40, -2.8], [-44.3, -2.5], [-48, -0.8], [-50, 0.5], [-51, 4], [-52, 6]],
  // África (al sur de ~2°N)
  [[9.7, 6], [9.5, 1], [9, -1], [11, -4], [12.2, -6], [13.3, -9], [13.8, -12.5], [12, -16], [11.8, -18], [14.5, -22.5], [15, -27], [17, -30.5], [18.3, -33], [18.5, -34.3], [20, -34.8], [23, -34], [25.7, -34], [28, -32.8], [30.5, -30.5], [32.5, -28.5], [32.9, -26], [35.5, -24], [35, -20.5], [37, -17.5], [40.5, -15.5], [40.5, -11], [39.3, -8], [39, -5], [40.5, -2.5], [42.5, -0.5], [46, 2.5], [48, 6]],
  // Madagascar
  [[49.3, -12], [50.5, -15.5], [49.5, -18], [47.8, -23], [47, -25], [45.2, -25.5], [43.7, -23.5], [44, -20], [44.3, -16.5], [46.5, -15.5], [48, -13.5]],
  // Australia
  [[114, -22], [113.5, -24.5], [113.2, -26], [114.5, -28.5], [115.5, -31.5], [115, -34.2], [117.8, -35], [120, -34], [123.5, -33.9], [126, -32.3], [129, -31.7], [131.2, -31.5], [134, -32.8], [135.5, -34.8], [137.8, -33], [138, -35.5], [140, -37.8], [143.5, -38.8], [146.3, -39], [148, -37.8], [150, -37.2], [150.8, -34.8], [152.5, -32.3], [153.5, -28.5], [153, -25.5], [151, -23.5], [149, -21], [146.3, -19], [146, -17], [145.3, -14.8], [143.5, -14.2], [142.5, -10.8], [141.7, -13], [141, -16.5], [139.5, -17.5], [137.5, -16], [135.5, -15], [136.5, -12.2], [133, -11.5], [131, -12.2], [129.5, -14.9], [128, -14.8], [126.5, -14], [124.5, -16.2], [122.2, -17.5], [122, -19], [119, -20], [116.5, -20.6]],
  // Tasmania
  [[144.7, -40.8], [148.2, -40.9], [148.2, -42.2], [147, -43.5], [146, -43.5], [145.2, -42.2]],
  // Sumatra (sur), Java, Borneo (sur), Nueva Guinea
  [[99.5, 4], [100.5, -1.5], [102, -4], [104.5, -5.8], [105.8, -5.8], [106, -3], [104, -1], [103.5, 4]],
  [[105.5, -6.5], [108.5, -6.7], [111, -6.5], [114.5, -7.7], [114.3, -8.6], [108, -7.8], [106, -7.2]],
  [[109, 4], [109.5, -0.5], [110.2, -2.8], [114, -3.5], [116, -4], [116.5, -1], [117.8, 1], [118, 4]],
  [[131, -0.8], [134, -0.8], [135.5, -3.3], [138, -1.7], [141, -2.6], [145, -4.5], [147.5, -6], [147, -7], [150.5, -10.5], [147, -9.5], [144, -7.7], [142.5, -9.2], [139, -8], [138, -5.5], [134, -4], [132.5, -2.8]],
];

const coordLabel = (lat, lon) =>
  `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'O' : 'E'}`;

function haversineKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function buildMapSVG() {
  const land = LAND.map((poly) => `M${poly.map(([lon, lat]) => `${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`).join('L')}Z`).join('');
  let grat = '';
  let gratText = '';
  for (let lon = -90; lon <= 150; lon += 30) {
    grat += `M${px(lon)} 0V${MAP_H}`;
    const tag = lon === 0 ? '0°' : `${Math.abs(lon)}°${lon < 0 ? 'O' : 'E'}`;
    gratText += `<text x="${px(lon) + 5}" y="${MAP_H - 7}">${tag}</text>`;
  }
  for (let lat = 0; lat >= -45; lat -= 15) {
    grat += `M0 ${py(lat)}H${MAP_W}`;
    gratText += `<text x="6" y="${py(lat) - 5}">${lat === 0 ? 'ECUADOR' : `${Math.abs(lat)}°S`}</text>`;
  }
  const pts = SITES.map((s) => ({ x: px(s.lon), y: py(s.lat) }));
  const legs = BENDS.map(([bx, by], i) => {
    const a = pts[i];
    const b = pts[i + 1];
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${((a.x + b.x) / 2 + bx).toFixed(1)} ${((a.y + b.y) / 2 + by).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  });
  const sites = SITES.map((s, i) => {
    const [lx, ly, anchor] = s.label;
    const n = String(i + 1).padStart(2, '0');
    return `
    <g class="ships-site" data-i="${i}" transform="translate(${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)})"><g class="ships-k">
      <circle class="ships-site__pulse" r="9"/>
      <circle class="ships-site__ring" r="9"/>
      <path class="ships-site__ticks" d="M-14 0h-4M14 0h4M0 -14v-4M0 14v4"/>
      <circle class="ships-site__dot" r="2.6"/>
      <text class="ships-site__name" x="${lx}" y="${ly}" text-anchor="${anchor}"><tspan class="ships-site__n">${n}</tspan> ${s.name.toUpperCase()}</text>
      <text class="ships-site__coords" x="${lx}" y="${ly + 12}" text-anchor="${anchor}">${coordLabel(s.lat, s.lon)}</text>
    </g></g>`;
  }).join('');

  return `
<svg class="ships-route__svg" viewBox="0 0 ${MAP_W} ${MAP_H}" fill="none" focusable="false" aria-hidden="true">
  <defs>
    <pattern id="ships-route-dots" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r=".85"/>
    </pattern>
  </defs>
  <path class="ships-route__grat" d="${grat}"/>
  <g class="ships-route__grat-text">${gratText}</g>
  <path class="ships-route__land" d="${land}"/>
  <path class="ships-route__plan" d="${legs.join('')}"/>
  ${legs.map((d) => `<path class="ships-route__done" d="${d}"/>`).join('')}
  ${sites}
  <g class="ships-route__ship"><g class="ships-k">
    <path class="ships-route__ship-flame" d="M-10 -2.6Q-21 0 -10 2.6Z"/>
    <path class="ships-route__ship-body" d="M-6 -4.4-11 -8v16l5-3.6M-10 -4.4H3Q10 -2.6 13 0 10 2.6 3 4.4H-10Z"/>
    <circle class="ships-route__ship-win" cx="4" cy="0" r="1.5"/>
  </g></g>
</svg>`;
}

export function initRoute(sectionEl) {
  if (!sectionEl) return;
  let el = sectionEl.querySelector('.ships-route');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ships-route';
    (sectionEl.querySelector('.section__inner') || sectionEl).appendChild(el);
  }
  if (el.dataset.shipsReady) return;
  el.dataset.shipsReady = '1';

  const reduce = prefersReduced();
  const legKm = SITES.slice(1).map((s, i) => haversineKm(SITES[i], s));
  const totalKm = legKm.reduce((a, b) => a + b, 0);

  if (!el.hasAttribute('role')) el.setAttribute('role', 'img');
  if (!el.hasAttribute('aria-label')) {
    el.setAttribute('aria-label', `Mapa esquemático de la ruta de reconocimiento entre los cinco sitios recomendados: ${SITES.map((s) => s.name).join(', ')}. Recorrido total aproximado: ${fmt(totalKm)} kilómetros.`);
  }

  el.insertAdjacentHTML('beforeend', `
    <div class="ships-route__hud" aria-hidden="true">
      <span class="ships-route__title">Ruta de reconocimiento · 5 sitios análogos</span>
      <span class="ships-route__leg"></span>
    </div>
    <div class="ships-route__viewport" aria-hidden="true"><div class="ships-route__pan">${buildMapSVG()}</div></div>
    <div class="ships-route__foot" aria-hidden="true">
      <span class="ships-route__km"></span>
      <span class="ships-route__bar"><i></i></span>
      <span class="ships-route__count"></span>
    </div>`);

  const viewport = el.querySelector('.ships-route__viewport');
  const pan = el.querySelector('.ships-route__pan');
  const svg = el.querySelector('.ships-route__svg');
  const done = [...el.querySelectorAll('.ships-route__done')];
  const siteEls = [...el.querySelectorAll('.ships-site')];
  const ship = el.querySelector('.ships-route__ship');
  const shipFlame = el.querySelector('.ships-route__ship-flame');
  const legEl = el.querySelector('.ships-route__leg');
  const kmEl = el.querySelector('.ships-route__km');
  const countEl = el.querySelector('.ships-route__count');
  const barEl = el.querySelector('.ships-route__bar i');
  const lens = done.map((p) => p.getTotalLength());
  const LEGS = done.length;
  const code = (i) => String(i + 1).padStart(2, '0');

  let viewW = 0;
  let panW = 0;
  let progress = -1;
  let shipX = 0;

  function layout() {
    viewW = viewport.clientWidth;
    panW = pan.offsetWidth;
    if (!panW) return;
    svg.style.setProperty('--k', (MAP_W / panW).toFixed(4));
    applyPan();
  }
  function applyPan() {
    const over = panW - viewW;
    const tx = over > 1 ? clamp(shipX * (panW / MAP_W) - viewW / 2, 0, over) : 0;
    pan.style.transform = tx ? `translate3d(${(-tx).toFixed(1)}px, 0, 0)` : '';
  }

  function render(P) {
    P = clamp(P, 0, 1);
    if (Math.abs(P - progress) < 0.0004) return;
    progress = P;
    const seg = P * LEGS;
    const i = Math.min(LEGS - 1, Math.floor(seg));
    const raw = seg - i;
    // pausa corta en cada sitio, después acelera y frena
    const f = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;

    done.forEach((p, j) => {
      const part = j < i ? 1 : j === i ? f : 0;
      p.style.strokeDasharray = `${(lens[j] * part).toFixed(1)} ${(lens[j] + 4).toFixed(1)}`;
      p.style.opacity = part > 0.001 ? '1' : '0';
    });
    const reached = P >= 0.999 ? LEGS : i + (f > 0.985 ? 1 : 0);
    siteEls.forEach((s, j) => {
      s.classList.toggle('is-on', j <= reached);
      s.classList.toggle('is-here', j === reached && (f < 0.02 || f > 0.985 || P >= 0.999));
    });

    const at = lens[i] * f;
    const pt = done[i].getPointAtLength(at);
    const a = done[i].getPointAtLength(Math.max(0, at - 1));
    const b = done[i].getPointAtLength(Math.min(lens[i], at + 1));
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    ship.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    const moving = f > 0.02 && f < 0.985 && P < 0.999;
    shipFlame.style.opacity = moving ? '1' : '0';
    shipX = pt.x;
    applyPan();

    const km = legKm.slice(0, i).reduce((s, v) => s + v, 0) + legKm[i] * f;
    if (P >= 0.999) legEl.textContent = `Recorrido completo · destino ${code(LEGS)} ${SITES[LEGS].name}`;
    else if (P <= 0.001) legEl.textContent = `En plataforma · ${code(0)} ${SITES[0].name}`;
    else legEl.textContent = `Tramo ${code(i)} → ${code(i + 1)} · ${SITES[i].name} → ${SITES[i + 1].name} · ${fmt(legKm[i])} km`;
    kmEl.textContent = `${fmt(km)} / ${fmt(totalKm)} km`;
    countEl.textContent = `${Math.min(reached + 1, SITES.length)} / ${SITES.length} sitios`;
    barEl.style.transform = `scaleX(${P.toFixed(4)})`;
  }

  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(viewport);
  else window.addEventListener('resize', layout);

  if (reduce) { el.classList.add('ships-route--still'); render(1); return; }
  render(0);

  // El avance sale de la posición real del mapa en el viewport (el alto del documento cambia
  // mientras cargan otras secciones, así que no se cachean posiciones). GSAP solo suaviza.
  const START = 0.82, END = 0.36; // centro del mapa, en fracción del alto del viewport
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const state = { p: 0 };
  let near = true;
  let queued = false;
  const update = () => {
    queued = false;
    const r = el.getBoundingClientRect();
    if (!r.height) return;
    const c = (r.top + r.height / 2) / window.innerHeight;
    const target = clamp((START - c) / (START - END), 0, 1);
    if (gsap && !document.hidden) {
      gsap.to(state, { p: target, duration: 0.7, ease: 'power2.out', overwrite: true, onUpdate: () => render(state.p) });
    } else {
      state.p = target;
      render(target);
    }
  };
  const queue = () => { if (near && !queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('fronteras:content-ready', queue);
  if (ST) ST.addEventListener('refresh', queue);
  if ('IntersectionObserver' in window) {
    // lejos del viewport no se mide nada; al salir se deja el estado final que corresponda
    new IntersectionObserver((entries) => {
      near = entries[entries.length - 1].isIntersecting;
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { rootMargin: '60% 0px 60% 0px' }).observe(el);
  }
  update();
}
