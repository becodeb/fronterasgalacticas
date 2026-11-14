// Atlas de mundos — explorador interactivo Tierra / Luna / Europa.
// Monta una "consola de cartografía" dentro de #worlds-app: globo 3D (Three.js),
// marcadores por lat/lon, filtros, lista accesible y ficha de cada cráter.
//
// Texturas (dominio público, reducidas y convertidas a .webp con ffmpeg):
//  - assets/worlds-tierra.webp  2048×1024 · NASA Blue Marble Next Generation (topografía + batimetría, dic. 2004)
//      https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
//      Crédito: NASA Earth Observatory (R. Stöckli). Imagen NASA, dominio público.
//  - assets/worlds-luna.webp    2048×1024 · NASA SVS "CGI Moon Kit", mapa de color LRO/LROC
//      https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif
//      Crédito: NASA's Scientific Visualization Studio. Dominio público.
//  - assets/worlds-europa.webp  2048×1024 · USGS Astrogeology, "Europa Voyager – Galileo SSI Global Mosaic 500m"
//      https://planetarymaps.usgs.gov/mosaic/Europa_Voyager_GalileoSSI_global_mosaic_500m.tif
//      (ficha: https://astrogeology.usgs.gov/search/map/europa_voyager_galileo_ssi_global_mosaic_500m)
//      Crédito: NASA/JPL/USGS. Sin restricciones de uso (dominio público). El mosaico es en grises:
//      el color helado con lineae rojizas se aplica en el shader.
//
// Integración con otras secciones:
//  - Enlace profundo:  ?atlas=tierra:wolfe-creek   |   ?atlas=luna:moltke   |   ?atlas=europa
//  - Evento:           window.dispatchEvent(new CustomEvent('fronteras:atlas-go', { detail: { world: 'tierra', id: 'kalkkop' } }))

import { CRATERS, LUNAR_FEATURES, EUROPA_FEATURES, REGIONS } from './data/craters.js';

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Formato ----------
const nfmt = (v, max = 2) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: max }).format(v);
const fmtKm = (d) => {
  if (!Number.isFinite(d)) return 'Sin dato';
  return `${nfmt(d, d < 10 ? 2 : d < 100 ? 1 : 0)} km`;
};
// "19.17°S · 127.80°E" (S y O negativos; en Europa las longitudes oeste llegan hasta 360°)
const fmtCoords = (lat, lon) =>
  `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'O' : 'E'}`;
// Europa se cartografía con longitud oeste de 0° a 360° (como en el informe): 88.6°E → 271.40°O
const coordsFor = (world, lat, lon) => fmtCoords(lat, world === 'europa' && lon > 0 ? lon - 360 : lon);

// ---------- Datos ----------
const ORIGIN_LABEL = { impacto: 'Impacto', volcanico: 'Volcánico', incierto: 'Origen incierto', hielo: 'Hielo' };
const KIND_LABEL = { crater: 'Cráter', mar: 'Mar lunar', cuenca: 'Cuenca', polo: 'Polo', caos: 'Terreno caótico', llanura: 'Llanura' };
const LUNAR_COLOR = { crater: 'impacto', cuenca: 'impacto', mar: 'volcanico', polo: 'hielo' };

const WORLDS = {
  tierra: {
    key: 'tierra', idx: '01', name: 'Tierra', sub: '3er planeta', prefix: 'T', radiusKm: 6371,
    tex: 'assets/worlds-tierra.webp', noun: ['cráter', 'cráteres'],
    lead: 'El banco de pruebas. Cada punto es un cráter o una región que estudiamos como posible sitio análogo para ensayar una base lunar.',
    facts: [['Diámetro', '12.742 km'], ['Gravedad', '1 g'], ['Atmósfera', 'Nitrógeno y oxígeno']],
  },
  luna: {
    key: 'luna', idx: '02', name: 'Luna', sub: 'Satélite natural', prefix: 'L', radiusKm: 1737.4,
    tex: 'assets/worlds-luna.webp', noun: ['rasgo lunar', 'rasgos lunares'],
    lead: 'El destino. Acá están los cráteres, mares y cuencas que usamos como referencia: los gemelos de los sitios terrestres.',
    facts: [['Diámetro', '3.474 km'], ['Gravedad', '1/6 g'], ['Atmósfera', 'Exosfera muy tenue'], ['Distancia', '384.400 km']],
  },
  europa: {
    key: 'europa', idx: '03', name: 'Europa', sub: 'Luna de Júpiter', prefix: 'E', radiusKm: 1560.8,
    tex: 'assets/worlds-europa.webp', noun: ['rasgo helado', 'rasgos helados'],
    lead: 'El bonus. En esta luna de Júpiter el hielo hace el trabajo de la roca: sus cráteres, cuencas y terrenos caóticos son análogos helados de la Luna.',
    facts: [['Diámetro', '3.122 km'], ['Gravedad', '0,13 g'], ['Superficie', 'Hielo de agua'], ['Orbita a', 'Júpiter']],
  },
};
const WORLD_KEYS = ['tierra', 'luna', 'europa'];

const sizeUnits = (d) => (Number.isFinite(d) && d > 0 ? 1 + 0.27 * (clamp(Math.log10(d), -1.5, 3.2) + 1.5) : 1.25);

function buildItems() {
  const ok = (o) => o && Number.isFinite(o.lat) && Number.isFinite(o.lon);
  const earth = (CRATERS || []).filter(ok).map((c) => ({
    key: `tierra:${c.id}`, world: 'tierra', id: c.id, name: c.name, lat: c.lat, lon: c.lon, diameterKm: c.diameterKm,
    colorKey: ORIGIN_LABEL[c.origin] ? c.origin : 'incierto', tag: ORIGIN_LABEL[c.origin] || ORIGIN_LABEL.incierto,
    recommended: !!c.recommended, raw: c,
    f: { region: c.region, origin: ORIGIN_LABEL[c.origin] ? c.origin : 'incierto', pick: c.recommended ? 'top' : 'resto' },
  }));
  const moon = (LUNAR_FEATURES || []).filter(ok).map((m) => ({
    key: `luna:${m.id}`, world: 'luna', id: m.id, name: m.name, lat: m.lat, lon: m.lon, diameterKm: m.diameterKm,
    colorKey: LUNAR_COLOR[m.kind] || 'incierto', tag: KIND_LABEL[m.kind] || 'Rasgo', recommended: false, raw: m,
    f: { kind: m.kind },
  }));
  const europa = (EUROPA_FEATURES || []).filter(ok).map((e) => ({
    key: `europa:${e.id}`, world: 'europa', id: e.id, name: e.name, lat: e.lat, lon: e.lon, diameterKm: e.diameterKm,
    colorKey: 'hielo', tag: KIND_LABEL[e.kind] || 'Rasgo', recommended: false, raw: e,
    f: { kind: e.kind },
  }));
  const byWorld = { tierra: earth, luna: moon, europa };
  for (const k of WORLD_KEYS) {
    byWorld[k].forEach((it, i) => {
      it.code = `${WORLDS[k].prefix}·${String(i + 1).padStart(2, '0')}`;
      it.units = sizeUnits(it.diameterKm) * (it.recommended ? 1.3 : 1);
      it.pass = true; it.visA = 1; it.sx = 0; it.sy = 0; it.front = false; it.on = false;
    });
    // Los recomendados al final: se dibujan arriba del resto.
    byWorld[k].sort((a, b) => Number(a.recommended) - Number(b.recommended));
  }
  return byWorld;
}

function filterGroups(key, items) {
  const present = (field) => new Set(items.map((it) => it.f[field]));
  if (key === 'tierra') {
    return [
      { key: 'region', label: 'Región', options: [['all', 'Todas'], ...Object.entries(REGIONS || {})] },
      { key: 'origin', label: 'Origen', dot: true, options: [['all', 'Todos'], ['impacto', 'Impacto'], ['volcanico', 'Volcánico'], ['incierto', 'Incierto']] },
      { key: 'pick', label: 'Selección', options: [['all', 'Todos'], ['top', 'Top 5 recomendados']] },
    ];
  }
  const kinds = [...present('kind')].filter(Boolean);
  return [{ key: 'kind', label: 'Tipo', dot: key === 'luna', options: [['all', 'Todos'], ...kinds.map((k) => [k, KIND_LABEL[k] || k])] }];
}

// =====================================================================
export async function init(root) {
  if (!root || root.dataset.worldsReady) return;
  root.dataset.worldsReady = '1';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isCompact = window.matchMedia('(max-width: 1099px)');
  const css = getComputedStyle(document.documentElement);
  const token = (n, fb) => (css.getPropertyValue(n).trim() || fb);
  const COLORS = {
    impacto: token('--signal', '#FF5B1F'), volcanico: token('--sun', '#FFD27A'),
    incierto: token('--dust', '#9A968C'), hielo: token('--ice', '#BFE6FF'),
    paper: token('--paper', '#ECE8DF'), void: token('--void', '#05060A'), telemetry: token('--telemetry', '#8FE3FF'),
  };

  const ITEMS = buildItems();
  const GROUPS = Object.fromEntries(WORLD_KEYS.map((k) => [k, filterGroups(k, ITEMS[k])]));
  const state = {
    world: 'tierra', sel: null, hover: null,
    filters: Object.fromEntries(WORLD_KEYS.map((k) => [k, Object.fromEntries(GROUPS[k].map((g) => [g.key, 'all']))])),
  };
  const items = () => ITEMS[state.world];
  const find = (world, id) => ITEMS[world]?.find((it) => it.id === id) || null;
  const twinsOf = (lunarId) => ITEMS.tierra.filter((it) => it.raw.twinId === lunarId);

  // ---------- DOM ----------
  const bezelTicks = (step, r0, r1, keep = () => true) => {
    let d = '';
    for (let a = 0; a < 360; a += step) {
      if (!keep(a)) continue;
      const c = Math.cos(a * D2R), sn = Math.sin(a * D2R);
      d += `M${(100 + r0 * c).toFixed(2)} ${(100 + r0 * sn).toFixed(2)}L${(100 + r1 * c).toFixed(2)} ${(100 + r1 * sn).toFixed(2)}`;
    }
    return d;
  };
  root.innerHTML = `
  <div class="worlds" data-world="tierra">
    <header class="worlds-bar">
      <div class="worlds-tabs" role="tablist" aria-label="Elegir mundo">
        ${WORLD_KEYS.map((k) => `
        <button class="worlds-tab" role="tab" type="button" id="worlds-tab-${k}" data-world="${k}" aria-controls="worlds-body" aria-selected="${k === 'tierra'}" tabindex="${k === 'tierra' ? 0 : -1}">
          <span class="worlds-tab__idx">${WORLDS[k].idx}</span>
          <span class="worlds-tab__name">${WORLDS[k].name}</span>
          <span class="worlds-tab__sub">· ${WORLDS[k].sub}</span>
        </button>`).join('')}
      </div>
      <p class="worlds-count"><b class="worlds-count__n">0</b> <span class="worlds-count__t">cráteres en pantalla</span> <span class="worlds-count__all"></span></p>
    </header>
    <div class="worlds-body" id="worlds-body" role="tabpanel">
      <aside class="worlds-rail" aria-label="Filtros y lista">
        <div class="worlds-filters"></div>
        <details class="worlds-listwrap">
          <summary><span class="worlds-listwrap__t">Lista</span> <span class="worlds-listwrap__n"></span></summary>
          <ul class="worlds-list"></ul>
        </details>
      </aside>
      <div class="worlds-stage">
        <canvas class="worlds-canvas" tabindex="0" role="application" aria-label="Globo 3D interactivo. Flechas para girar, más y menos para acercar o alejar. Todos los puntos están también en la lista de la consola."></canvas>
        <div class="worlds-hud" aria-hidden="true">
          <div class="worlds-bezel">
            <svg viewBox="0 0 200 200" focusable="false">
              <circle class="worlds-bezel__line" cx="100" cy="100" r="98.5"/>
              <g class="worlds-bezel__dial">
                <path class="worlds-bezel__minor" d="${bezelTicks(5, 96, 97.6, (a) => a % 30 !== 0)}"/>
                <path class="worlds-bezel__major" d="${bezelTicks(30, 93.4, 97.6)}"/>
              </g>
              <path class="worlds-bezel__mark" d="M100 5.6l-2.1-4.1h4.2z"/>
            </svg>
            <span class="worlds-bezel__c worlds-bezel__c--n">N</span>
            <span class="worlds-bezel__c worlds-bezel__c--e">E</span>
            <span class="worlds-bezel__c worlds-bezel__c--s">S</span>
            <span class="worlds-bezel__c worlds-bezel__c--o">O</span>
          </div>
          <i class="worlds-cross"></i>
          <i class="worlds-corner worlds-corner--tl"></i><i class="worlds-corner worlds-corner--tr"></i>
          <i class="worlds-corner worlds-corner--bl"></i><i class="worlds-corner worlds-corner--br"></i>
          <p class="worlds-read worlds-read--tl"><span class="worlds-read__k worlds-hud-world">Tierra · 3er planeta</span><span class="worlds-read__v worlds-hud-radius">R 6.371 KM</span></p>
          <p class="worlds-read worlds-read--tr"><span class="worlds-read__k">Centro</span><span class="worlds-read__v worlds-hud-center">—</span></p>
          <p class="worlds-read worlds-read--bl"><span class="worlds-read__k">Puntero</span><span class="worlds-read__v worlds-hud-pointer">—</span></p>
          <p class="worlds-read worlds-read--br"><span class="worlds-scale"><i class="worlds-scale__bar"></i></span><span class="worlds-read__v worlds-hud-scale">—</span></p>
        </div>
        <div class="worlds-labels" aria-hidden="true"></div>
        <p class="worlds-hint" aria-hidden="true"></p>
        <div class="worlds-zoom" role="group" aria-label="Controles del visor">
          <button type="button" data-zoom="in" aria-label="Acercar">+</button>
          <button type="button" data-zoom="out" aria-label="Alejar">−</button>
          <button type="button" data-zoom="reset" aria-label="Volver a la vista inicial"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 0v4M8 12v4M0 8h4M12 8h4"/></svg></button>
        </div>
      </div>
      <section class="worlds-panel" aria-label="Ficha"></section>
    </div>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const el = {
    app: $('.worlds'), body: $('.worlds-body'), tabs: [...root.querySelectorAll('.worlds-tab')], countN: $('.worlds-count__n'), countT: $('.worlds-count__t'),
    countAll: $('.worlds-count__all'), filters: $('.worlds-filters'), listWrap: $('.worlds-listwrap'), listN: $('.worlds-listwrap__n'),
    list: $('.worlds-list'), stage: $('.worlds-stage'), canvas: $('.worlds-canvas'), labels: $('.worlds-labels'), hint: $('.worlds-hint'),
    panel: $('.worlds-panel'), dial: $('.worlds-bezel__dial'), hudWorld: $('.worlds-hud-world'), hudRadius: $('.worlds-hud-radius'),
    hudCenter: $('.worlds-hud-center'), hudPointer: $('.worlds-hud-pointer'), hudScale: $('.worlds-hud-scale'), scaleBar: $('.worlds-scale__bar'),
  };
  el.listWrap.open = !isCompact.matches;
  const setText = (node, text) => { if (node && node.__t !== text) { node.__t = text; node.textContent = text; } };

  // ---------- Render de UI (independiente del 3D) ----------
  function applyFilters() {
    const f = state.filters[state.world];
    let n = 0;
    for (const it of items()) {
      it.pass = Object.entries(f).every(([k, v]) => v === 'all' || it.f[k] === v);
      if (it.pass) n++;
    }
    if (state.sel && !state.sel.pass) state.sel = null;
    return n;
  }

  function renderFilters() {
    const f = state.filters[state.world];
    el.filters.innerHTML = GROUPS[state.world].map((g) => `
      <fieldset class="worlds-fgroup">
        <legend>${g.label}</legend>
        <div class="worlds-chips">
          ${g.options.map(([v, label]) => {
            const n = v === 'all' ? items().length : items().filter((it) => it.f[g.key] === v).length;
            const dot = g.dot && v !== 'all' ? `<i class="worlds-dot" style="--c:${COLORS[state.world === 'luna' ? (LUNAR_COLOR[v] || 'incierto') : v] || COLORS.incierto}"></i>` : '';
            return `<button type="button" class="worlds-chip" data-group="${g.key}" data-value="${esc(v)}" aria-pressed="${f[g.key] === v}" ${n === 0 ? 'disabled' : ''}>${dot}${esc(label)}<small>${n}</small></button>`;
          }).join('')}
        </div>
      </fieldset>`).join('');
  }

  function renderList() {
    const w = WORLDS[state.world];
    const shown = items().filter((it) => it.pass).sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.name.localeCompare(b.name, 'es'));
    setText(el.listN, `${shown.length} ${shown.length === 1 ? w.noun[0] : w.noun[1]}`);
    el.list.innerHTML = shown.length
      ? shown.map((it) => `
        <li><button type="button" class="worlds-item" data-key="${esc(it.key)}" aria-current="${state.sel === it}">
          <i class="worlds-dot" style="--c:${COLORS[it.colorKey]}"></i>
          <span class="worlds-item__name">${esc(it.name)}</span>
          ${it.recommended ? '<span class="worlds-item__top">Top 5</span>' : ''}
          <span class="worlds-item__meta">${Number.isFinite(it.diameterKm) ? fmtKm(it.diameterKm) : esc(it.tag)}</span>
        </button></li>`).join('')
      : '<li class="worlds-list__empty">Nada coincide con esos filtros. Probá con otra combinación.</li>';
  }

  function markCurrent() {
    el.list.querySelectorAll('.worlds-item').forEach((b) => b.setAttribute('aria-current', String(!!state.sel && b.dataset.key === state.sel.key)));
  }

  function renderPanel(focus = false) {
    const w = WORLDS[state.world];
    const it = state.sel;
    el.panel.classList.toggle('has-sel', !!it);
    el.app.classList.toggle('is-sel', !!it);
    if (!it) {
      const tops = state.world === 'tierra' ? ITEMS.tierra.filter((c) => c.recommended) : [];
      el.panel.innerHTML = `
      <div class="worlds-ficha worlds-ficha--world">
        <div class="worlds-ficha__head"><span class="worlds-ficha__code">[ Mundo ${w.idx} / 03 ]</span></div>
        <h3 class="worlds-ficha__name">${w.name}</h3>
        <p class="worlds-ficha__place">${w.sub}</p>
        <p class="worlds-ficha__summary">${w.lead}</p>
        <dl class="worlds-data">${w.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        ${tops.length ? `<div class="worlds-tops"><span class="label">Los ${tops.length} recomendados</span>
          <ul>${tops.map((c) => `<li><button type="button" class="worlds-link" data-key="${esc(c.key)}"><i class="worlds-dot" style="--c:${COLORS[c.colorKey]}"></i>${esc(c.name)}<span>${esc(c.raw.place || '')}</span></button></li>`).join('')}</ul></div>` : ''}
        <p class="worlds-ficha__tip">Tocá un punto del globo o elegí uno de la lista para abrir su ficha.</p>
      </div>`;
      return;
    }
    const r = it.raw;
    const count = ITEMS[it.world].length;
    const head = `
      <div class="worlds-ficha__head">
        <span class="worlds-ficha__code">[ Ficha ${it.code} / ${String(count).padStart(2, '0')} ]</span>
        <button type="button" class="worlds-x" data-close aria-label="Cerrar ficha"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11"/></svg></button>
      </div>
      <h3 class="worlds-ficha__name" tabindex="-1">${esc(it.name)}</h3>`;
    const coords = `<p class="coords worlds-ficha__coords">${coordsFor(it.world, it.lat, it.lon)}</p>`;
    let body = '';
    if (it.world === 'tierra') {
      const twin = r.twinId ? find('luna', r.twinId) : null;
      body = `
        <p class="worlds-ficha__place">${esc(r.place || '')}</p>
        <p class="worlds-ficha__tags"><span class="tag tag--${it.colorKey}">${esc(it.tag)}</span>${it.recommended ? '<span class="worlds-badge">Recomendado · Top 5</span>' : ''}</p>
        ${coords}
        <dl class="worlds-data">
          <div><dt>Diámetro</dt><dd>${fmtKm(r.diameterKm)}</dd></div>
          <div><dt>Edad</dt><dd>${esc(r.age || 'Sin dato')}</dd></div>
          <div><dt>Región</dt><dd>${esc((REGIONS || {})[r.region] || '—')}</dd></div>
        </dl>
        ${r.summary ? `<p class="worlds-ficha__summary">${esc(r.summary)}</p>` : ''}
        ${r.nasaUse ? `<div class="worlds-note"><span class="label">Uso NASA</span><p>${esc(r.nasaUse)}</p></div>` : ''}
        ${twin ? `<button type="button" class="btn btn--signal worlds-go" data-go="${esc(twin.key)}">Ver gemelo lunar<span>→ ${esc(twin.name)}</span></button>` : ''}`;
    } else if (it.world === 'luna') {
      const twins = twinsOf(it.id);
      body = `
        <p class="worlds-ficha__place">Luna</p>
        <p class="worlds-ficha__tags"><span class="tag tag--${it.colorKey}">${esc(it.tag)}</span></p>
        ${coords}
        <dl class="worlds-data"><div><dt>Diámetro</dt><dd>${fmtKm(r.diameterKm)}</dd></div><div><dt>Tipo</dt><dd>${esc(it.tag)}</dd></div></dl>
        ${r.note ? `<p class="worlds-ficha__summary">${esc(r.note)}</p>` : ''}
        ${twins.length ? `<div class="worlds-note worlds-note--twin"><span class="label">Gemelo lunar de</span>
          ${twins.map((t) => `<p><strong>${esc(t.name)}</strong> · ${esc(t.raw.place || '')}</p>
          <button type="button" class="btn worlds-go worlds-go--back" data-go="${esc(t.key)}"><span>←</span>Volver a ${esc(t.name)}</button>`).join('')}</div>` : ''}`;
    } else {
      body = `
        <p class="worlds-ficha__place">Europa · luna de Júpiter</p>
        <p class="worlds-ficha__tags"><span class="tag tag--hielo">${esc(it.tag)}</span></p>
        ${coords}
        <dl class="worlds-data"><div><dt>Diámetro</dt><dd>${fmtKm(r.diameterKm)}</dd></div><div><dt>Tipo</dt><dd>${esc(it.tag)}</dd></div></dl>
        ${r.note ? `<p class="worlds-ficha__summary">${esc(r.note)}</p>` : ''}
        ${r.analog ? `<div class="worlds-note"><span class="label">Análogo helado de</span><p>${esc(r.analog)}</p></div>` : ''}`;
    }
    el.panel.innerHTML = `<article class="worlds-ficha" data-color="${it.colorKey}">${head}${body}</article>`;
    if (focus) el.panel.querySelector('.worlds-ficha__name')?.focus();
  }

  function renderChrome() {
    const w = WORLDS[state.world];
    el.app.dataset.world = state.world;
    el.tabs.forEach((t) => {
      const on = t.dataset.world === state.world;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    el.body.setAttribute('aria-labelledby', `worlds-tab-${state.world}`);
    setText(el.hudWorld, `${w.name} · ${w.sub}`);
    setText(el.hudRadius, `R ${nfmt(w.radiusKm, 0)} km`);
    setText(el.countAll, `/ ${items().length}`);
  }

  function setCount(n, onScreen = true) {
    const w = WORLDS[state.world];
    setText(el.countN, String(n));
    setText(el.countT, `${n === 1 ? w.noun[0] : w.noun[1]} ${onScreen ? 'en pantalla' : 'en la lista'}`);
  }

  // ---------- Acciones ----------
  let view = null; // se completa si hay WebGL

  function select(it, { fly = true, focus = false } = {}) {
    if (it && (it.world !== state.world || !it.pass)) return go(it.world, it.id, { focus }); // otro mundo, o lo oculta un filtro
    state.sel = it && it.pass ? it : null;
    renderPanel(focus);
    markCurrent();
    view?.sync();
    if (state.sel && fly) view?.flyTo(state.sel.lat, state.sel.lon, { focus: true });
    if (state.sel) el.panel.classList.remove('is-in'), void el.panel.offsetWidth, el.panel.classList.add('is-in');
  }

  function setFilter(group, value) {
    const f = state.filters[state.world];
    if (!(group in f)) return;
    f[group] = value;
    const n = applyFilters();
    renderFilters(); renderList(); renderPanel();
    if (!view) setCount(n, false);
    view?.sync();
    // Girar hacia el centro de lo filtrado
    const shown = items().filter((it) => it.pass);
    if (view && shown.length && value !== 'all' && !state.sel) view.flyToGroup(shown);
  }

  function go(worldKey, id = null, { focus = false, instant = false } = {}) {
    if (!WORLDS[worldKey]) return;
    const changed = worldKey !== state.world;
    if (changed) {
      state.world = worldKey; state.sel = null; state.hover = null;
    }
    let target = id ? find(worldKey, id) : null;
    if (target && !target.pass) { // si un filtro lo oculta, se limpian los filtros
      Object.keys(state.filters[worldKey]).forEach((k) => { state.filters[worldKey][k] = 'all'; });
    }
    const n = applyFilters();
    if (changed || target) { renderChrome(); renderFilters(); renderList(); }
    if (!view) setCount(n, false);
    if (target) state.sel = target;
    else if (changed) state.sel = null;
    renderPanel(focus);
    markCurrent();
    if (changed) view?.setWorld(worldKey, { target: state.sel, instant });
    else if (state.sel) { view?.sync(); view?.flyTo(state.sel.lat, state.sel.lon, { focus: true }); }
    if (state.sel) el.panel.classList.remove('is-in'), void el.panel.offsetWidth, el.panel.classList.add('is-in');
  }

  // ---------- Eventos de UI ----------
  el.tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => go(tab.dataset.world));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = el.tabs[(i + d + el.tabs.length) % el.tabs.length];
      next.focus(); go(next.dataset.world);
    });
  });
  el.filters.addEventListener('click', (e) => {
    const chip = e.target.closest('.worlds-chip');
    if (!chip || chip.disabled) return;
    const { group, value } = chip.dataset;
    setFilter(group, value);
    el.filters.querySelector(`.worlds-chip[data-group="${group}"][data-value="${CSS.escape(value)}"]`)?.focus({ preventScroll: true });
  });
  // En celular la ficha y la lista quedan debajo del globo: al elegir desde ahí, volver a mostrarlo
  const revealStage = () => {
    if (!isCompact.matches) return;
    const r = el.stage.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.45) el.app.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  };
  const byKey = (key) => { const [w, ...rest] = String(key).split(':'); return find(w, rest.join(':')); };
  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('.worlds-item');
    if (!b) return;
    const keyboard = e.detail === 0;
    select(byKey(b.dataset.key), { focus: keyboard });
    if (!keyboard) revealStage();
  });
  el.panel.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close],[data-go],[data-key]');
    if (!t) return;
    const keyboard = e.detail === 0;
    if (t.hasAttribute('data-close')) { select(null); if (keyboard) el.canvas.focus({ preventScroll: true }); return; }
    const it = byKey(t.dataset.go || t.dataset.key);
    if (!it) return;
    if (t.dataset.go) go(it.world, it.id, { focus: keyboard });
    else select(it, { focus: keyboard });
    if (!keyboard) revealStage();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.sel) { select(null); }
  });
  window.addEventListener('fronteras:atlas-go', (e) => {
    const d = e.detail || {};
    window.fronterasAtlasPending = null;
    if (WORLDS[d.world]) go(d.world, d.id || null);
  });

  // ---------- Estado inicial (con enlace profundo ?atlas=mundo:id) ----------
  // (o window.fronterasAtlasPending = { world, id } si otra sección pidió un punto antes de que cargara el atlas)
  const pending = window.fronterasAtlasPending;
  const deep = pending && WORLDS[pending.world] ? [pending.world, pending.id || ''] : (new URLSearchParams(location.search).get('atlas') || '').split(':');
  window.fronterasAtlasPending = null;
  if (WORLDS[deep[0]]) { state.world = deep[0]; }
  applyFilters();
  if (deep[1]) state.sel = find(state.world, deep.slice(1).join(':'));
  renderChrome(); renderFilters(); renderList(); renderPanel();
  setCount(items().length, false);

  // ---------- 3D ----------
  try {
    view = await createView();
  } catch (err) {
    console.warn('[fronteras] atlas sin 3D:', err);
    view = null;
    el.app.classList.add('is-flat');
    el.stage.insertAdjacentHTML('beforeend', `
      <div class="worlds-fallback" role="note">
        <p class="label">Visor 3D no disponible</p>
        <p>Este dispositivo no pudo iniciar el globo, pero el atlas sigue completo: usá los filtros y la lista para abrir la ficha de cada cráter, con sus coordenadas y su gemelo lunar.</p>
      </div>`);
    el.listWrap.open = true;
  }

  // =====================================================================
  async function createView() {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL no disponible');
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

    const renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    el.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    const scene = new THREE.Scene();
    const FOV = 32;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const tanHalf = Math.tan((FOV * D2R) / 2);
    const col = (hex) => new THREE.Color(hex);
    const motion = () => !reduceMotion.matches;

    // Distancia de cámara para que el globo ocupe la fracción f del lado menor del visor
    let W = 1, H = 1, DPR = 1;
    const fitDist = (f) => 1 / Math.sin(Math.atan(f * tanHalf * Math.min(1, W / H)));
    let dDefault = 4, dMin = 1.5, dMax = 8, dFocus = 3.6;

    // ---------- Estrellas ----------
    let seed = 20261115;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const stars = (() => {
      const N = 900; const pos = new Float32Array(N * 3); const mag = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u);
        pos.set([s * Math.cos(a) * 60, u * 60, s * Math.sin(a) * 60], i * 3);
        mag[i] = Math.pow(rnd(), 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: true,
        uniforms: { uPx: { value: 1 }, uColor: { value: col(COLORS.paper) } },
        vertexShader: `attribute float aMag; uniform float uPx; varying float vA;
          void main(){ vA = .35 + .65*aMag; gl_PointSize = (1.2 + 1.9*aMag) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uColor; varying float vA;
          void main(){
            float r = length(gl_PointCoord - .5);
            gl_FragColor = vec4(uColor, smoothstep(.5, .15, r) * vA * .8);
            #include <colorspace_fragment>
          }`,
      });
      const p = new THREE.Points(g, m); p.renderOrder = -1; p.frustumCulled = false;
      scene.add(p);
      return p;
    })();

    // ---------- Globo ----------
    const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
    const GLOBE_VERT = `
      varying vec2 vUv; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vP; varying float vLat;
      void main(){
        vUv = uv; vLat = normal.y;
        vec3 t = cross(vec3(0.,1.,0.), normal); t = length(t) < 1e-4 ? vec3(1.,0.,0.) : normalize(t);
        // t apunta al este (u creciente), b al norte (v creciente)
        vN = normalize(normalMatrix * normal);
        vT = normalize(normalMatrix * t);
        vB = normalize(normalMatrix * cross(normal, t));
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`;
    const GLOBE_FRAG = `
      precision highp float;
      uniform sampler2D uMap; uniform vec2 uTexel;
      uniform float uReveal, uOffset, uBump, uSat, uContrast, uPivot, uGamma, uSpec, uPole, uRamp, uRimPow, uRimStr;
      uniform vec3 uBase, uTint, uRim, uSunV, uRampLo, uRampMid, uRampHi, uNight;
      varying vec2 vUv; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vP; varying float vLat;
      float L(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
      void main(){
        vec2 uv = vec2(vUv.x + uOffset, vUv.y);
        vec3 tex = texture2D(uMap, uv).rgb;
        float l = L(tex);
        vec3 ng = normalize(vN);
        vec3 n = ng;
        if (uBump > 0.) {
          float lx = L(texture2D(uMap, uv + vec2(uTexel.x, 0.)).rgb) - L(texture2D(uMap, uv - vec2(uTexel.x, 0.)).rgb);
          float ly = L(texture2D(uMap, uv + vec2(0., uTexel.y)).rgb) - L(texture2D(uMap, uv - vec2(0., uTexel.y)).rgb);
          n = normalize(ng - uBump * uReveal * (lx * normalize(vT) + ly * normalize(vB)));
        }
        vec3 c = mix(vec3(l), tex, uSat);
        if (uRamp > 0.) {
          // Europa: hielo azulado; lo oscuro y las lineae (más oscuras que su entorno) viran al rojizo
          float lb = L(texture2D(uMap, uv, 3.5).rgb);
          float line = smoothstep(.012, .075, lb - l);
          float dark = 1. - smoothstep(.1, .3, l);
          vec3 ice = mix(uRampMid, uRampHi, smoothstep(.2, .56, l));
          c = mix(c, mix(ice, uRampLo, clamp(max(dark, line), 0., 1.) * .82), uRamp);
        }
        c = mix(c, uBase, smoothstep(uPole, uPole + .02, abs(vLat)));
        c = pow(max((c - uPivot) * uContrast + uPivot, 0.), vec3(uGamma)) * uTint;
        c = mix(uBase, c, uReveal);
        float ndl = dot(n, uSunV);
        float day = smoothstep(-.14, .5, ndl);
        vec3 V = normalize(-vP);
        vec3 lit = c * day * (.82 + .18 * max(ndl, 0.)) + c * uNight * (1. - day);
        float ocean = smoothstep(.01, .06, tex.b - max(tex.r, tex.g));
        vec3 Hh = normalize(uSunV + V);
        lit += vec3(1., .95, .85) * pow(max(dot(n, Hh), 0.), 42.) * uSpec * ocean * day * uReveal;
        float fres = pow(1. - max(dot(ng, V), 0.), uRimPow);
        lit += uRim * fres * uRimStr * (.12 + .88 * smoothstep(-.3, .5, dot(ng, uSunV)));
        gl_FragColor = vec4(lit, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`;
    const blank = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
    blank.needsUpdate = true;

    const LOOKS = {
      tierra: {
        base: '#16324f', sat: 0.9, contrast: 1.0, pivot: 0.18, gamma: 0.8, tint: [1.22, 1.2, 1.18], bump: 0, spec: 0.5, pole: 2, ramp: 0, offset: 0,
        rim: '#7fc4ff', rimPow: 3.2, rimStr: 0.6, night: [0.05, 0.075, 0.13], sun: [-0.6, 0.4, 0.69], atmosphere: '#86c8ff',
      },
      luna: {
        base: '#8c8a84', sat: 0.85, contrast: 1.6, pivot: 0.2, gamma: 1, tint: [1.05, 1.02, 0.97], bump: 2.4, spec: 0, pole: 2, ramp: 0, offset: 0,
        rim: '#ffffff', rimPow: 4, rimStr: 0.0, night: [0.03, 0.033, 0.045], sun: [-0.8, 0.32, 0.46], atmosphere: null,
      },
      europa: {
        // El mosaico USGS va de 0° a 360° E de izquierda a derecha: medio giro respecto del globo.
        base: '#b4c3cf', sat: 0, contrast: 1.15, pivot: 0.3, gamma: 1, tint: [1, 1, 1], bump: 1.6, spec: 0, pole: 0.965, ramp: 1, offset: 0.5,
        rampLo: '#7c4630', rampMid: '#a9bbca', rampHi: '#e6f0f9',
        rim: COLORS.hielo, rimPow: 3.6, rimStr: 0.32, night: [0.04, 0.055, 0.08], sun: [-0.72, 0.36, 0.56], atmosphere: null,
      },
    };

    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    function makeWorld(key) {
      const look = LOOKS[key];
      const group = new THREE.Group();
      group.visible = false;
      const uniforms = {
        uMap: { value: blank }, uTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) }, uReveal: { value: 0 },
        uOffset: { value: look.offset }, uBump: { value: look.bump }, uSat: { value: look.sat }, uContrast: { value: look.contrast }, uPivot: { value: look.pivot }, uGamma: { value: look.gamma },
        uSpec: { value: look.spec }, uPole: { value: look.pole }, uRamp: { value: look.ramp }, uRimPow: { value: look.rimPow }, uRimStr: { value: look.rimStr },
        uBase: { value: col(look.base) }, uTint: { value: new THREE.Vector3(...look.tint) }, uRim: { value: col(look.rim) },
        uSunV: { value: new THREE.Vector3(...look.sun).normalize() },
        uRampLo: { value: col(look.rampLo || '#000') }, uRampMid: { value: col(look.rampMid || '#888') }, uRampHi: { value: col(look.rampHi || '#fff') },
        uNight: { value: new THREE.Vector3(...look.night) },
      };
      const globe = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: GLOBE_VERT, fragmentShader: GLOBE_FRAG }));
      group.add(globe);

      if (look.atmosphere) {
        const R = 1.05;
        const atm = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
          side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uColor: { value: col(look.atmosphere) }, uSunV: uniforms.uSunV, uLimb: { value: Math.sqrt(1 - 1 / (R * R)) } },
          vertexShader: `varying vec3 vN; varying vec3 vP;
            void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `uniform vec3 uColor; uniform vec3 uSunV; uniform float uLimb; varying vec3 vN; varying vec3 vP;
            void main(){
              vec3 n = normalize(vN); vec3 V = normalize(-vP);
              float t = clamp(-dot(n, V) / uLimb, 0., 1.);
              float glow = pow(t, 2.6);
              float sun = smoothstep(-.45, .55, dot(normalize(vec3(n.xy, abs(n.z))), uSunV));
              gl_FragColor = vec4(uColor * glow * (.1 + .9 * sun) * .85, 1.);
              #include <colorspace_fragment>
            }`,
        }));
        atm.scale.setScalar(R);
        group.add(atm);
      }

      // Retícula de meridianos y paralelos cada 30°
      const pts = [];
      const ll = (lat, lon, r = 1.0025) => {
        const cl = Math.cos(lat * D2R);
        return [r * cl * Math.cos(lon * D2R), r * Math.sin(lat * D2R), -r * cl * Math.sin(lon * D2R)];
      };
      const seg = (a, b) => pts.push(...a, ...b);
      for (let lon = -180; lon < 180; lon += 30) for (let lat = -84; lat < 84; lat += 4) seg(ll(lat, lon), ll(lat + 4, lon));
      for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon < 180; lon += 4) seg(ll(lat, lon), ll(lat, lon + 4));
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const grat = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: col(COLORS.paper), transparent: true, opacity: key === 'luna' ? 0.1 : 0.085, depthWrite: false }));
      group.add(grat);

      if (key === 'europa') { // franja ecuatorial ±20° (llanuras ecuatoriales del informe)
        const bp = [];
        for (const lat of [-20, 20]) for (let lon = -180; lon < 180; lon += 4) bp.push(...ll(lat, lon, 1.003), ...ll(lat, lon + 2, 1.003));
        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
        group.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: col(COLORS.hielo), transparent: true, opacity: 0.4, depthWrite: false })));
      }

      // Marcadores: un solo draw call de sprites puntuales
      const its = ITEMS[key];
      const n = its.length;
      const pos = new Float32Array(n * 3), color = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
      const vis = new Float32Array(n), rec = new Float32Array(n), sel = new Float32Array(n), hot = new Float32Array(n);
      its.forEach((it, i) => {
        const p = ll(it.lat, it.lon, 1);
        it.vec = new THREE.Vector3(...p);
        pos.set(ll(it.lat, it.lon, 1.004), i * 3);
        const c = col(COLORS[it.colorKey]);
        color.set([c.r, c.g, c.b], i * 3);
        size[i] = 30 * it.units; phase[i] = rnd(); vis[i] = 1; rec[i] = it.recommended ? 1 : 0;
        it.i = i;
      });
      const mg = new THREE.BufferGeometry();
      mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      mg.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
      mg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      mg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
      mg.setAttribute('aVis', new THREE.BufferAttribute(vis, 1));
      mg.setAttribute('aRec', new THREE.BufferAttribute(rec, 1));
      mg.setAttribute('aSel', new THREE.BufferAttribute(sel, 1));
      mg.setAttribute('aHot', new THREE.BufferAttribute(hot, 1));
      const mUniforms = {
        uPx: { value: 1 }, uTime: { value: 0 }, uZoom: { value: 1 }, uScale: { value: 1 }, uAlpha: { value: 1 }, uMotion: { value: 1 },
        uPing: { value: 9 }, uPaper: { value: col(COLORS.paper) }, uVoid: { value: col(COLORS.void) },
      };
      const markers = new THREE.Points(mg, new THREE.ShaderMaterial({
        uniforms: mUniforms, transparent: true, depthTest: false, depthWrite: false,
        vertexShader: `
          attribute vec3 aColor; attribute float aSize, aPhase, aVis, aRec, aSel, aHot;
          uniform float uPx, uZoom, uScale;
          varying vec3 vColor; varying float vFade, vRec, vSel, vHot, vPhase, vPx;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.);
            vec3 n = normalize(normalMatrix * position);
            float facing = dot(n, normalize(-mv.xyz));
            vFade = smoothstep(.0, .16, facing) * aVis;
            vColor = aColor; vRec = aRec; vSel = aSel; vHot = aHot; vPhase = aPhase;
            vPx = aSize * uZoom * uScale * (1. + .35 * aSel + .12 * aHot) * uPx;
            gl_PointSize = vPx;
            gl_Position = projectionMatrix * mv;
            if (vFade < .01) gl_Position = vec4(2., 2., 2., 1.);
          }`,
        fragmentShader: `
          precision highp float;
          uniform float uTime, uMotion, uAlpha, uPing; uniform vec3 uPaper, uVoid;
          varying vec3 vColor; varying float vFade, vRec, vSel, vHot, vPhase, vPx;
          float band(float d, float w, float aa){ return 1. - smoothstep(w, w + aa, abs(d)); }
          void main(){
            vec2 p = gl_PointCoord * 2. - 1.; p.y = -p.y;
            float r = length(p);
            if (r > 1.) discard;
            float aa = 2.4 / vPx;                 // ~1 px en unidades del sprite
            float w = max(1.3 / vPx, .018);       // medio ancho de trazo
            float core = .14, ring = .34;
            float aCore = 1. - smoothstep(core - aa, core, r);
            float aRing = band(r - ring, w, aa);
            float t = mix(.45, fract(uTime * (.42 + .25 * vSel) + vPhase), uMotion);
            float aPulse = band(r - mix(ring, .95, t), w, aa) * (1. - t) * (1. - t) * mix(.55, .95, max(vRec, vSel));
            float aRing2 = vRec * band(r - .52, w, aa);
            vec2 ap = abs(p);
            float aTick = vRec * (1. - smoothstep(w, w + aa, min(ap.x, ap.y))) * step(.6, r) * step(r, .76);
            float ang = atan(p.y, p.x) + uTime * .5 * uMotion;
            float dash = smoothstep(.0, .08, abs(fract(ang / 6.2831853 * 8.) - .5) - .2);
            float aSel = vSel * band(r - .8, w * 1.4, aa) * dash;
            float pt = clamp(uPing / .9, 0., 1.);
            float aPing = vSel * band(r - mix(.2, .98, pt), w * 2., aa) * (1. - pt);
            float shadow = (1. - smoothstep(ring * .6, ring + .2, r)) * .5;
            float a = max(max(aCore, aRing), max(max(aPulse, aRing2), aTick));
            vec3 c = mix(vColor, uPaper, max(vSel, vHot) * aCore);
            float aTop = max(aSel, aPing);
            vec3 rgb = mix(uVoid, c, a);
            float alpha = a + shadow * (1. - a);
            rgb = mix(rgb, uPaper, aTop);
            alpha = max(alpha, aTop);
            gl_FragColor = vec4(rgb, alpha * vFade * uAlpha);
            #include <colorspace_fragment>
          }`,
      }));
      markers.renderOrder = 5; markers.frustumCulled = false;
      group.add(markers);
      scene.add(group);

      const w = { key, group, uniforms, mUniforms, mg, attrs: { vis, sel, hot }, items: its, loaded: false, loading: false, revealT: 0, dirty: true };
      return w;
    }

    const worlds = Object.fromEntries(WORLD_KEYS.map((k) => [k, makeWorld(k)]));

    function loadTexture(key) {
      const w = worlds[key];
      if (w.loaded || w.loading) return;
      w.loading = true;
      loader.load(WORLDS[key].tex, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.anisotropy = Math.min(8, maxAniso);
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        w.uniforms.uMap.value = tex;
        w.uniforms.uTexel.value.set(1 / tex.image.width, 1 / tex.image.height);
        w.loaded = true;
        // precarga del resto, de a uno
        const next = WORLD_KEYS.find((k) => !worlds[k].loaded && !worlds[k].loading);
        if (next) setTimeout(() => loadTexture(next), 300);
      }, undefined, () => { w.loading = false; console.warn('[fronteras] atlas: no cargó la textura de', key); });
    }

    // ---------- Controles ----------
    const controls = new OrbitControls(camera, el.canvas);
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.07;
    controls.zoomSpeed = 0.7; controls.autoRotateSpeed = 0.32;
    controls.minPolarAngle = 0.12; controls.maxPolarAngle = Math.PI - 0.12;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    // Vista inicial de cada mundo: Atlántico Sur (América y África a los lados), cara visible de la Luna, hemisferio de Pwyll y Conamara
    const HOME = { tierra: { lat: -14, lon: -38 }, luna: { lat: 6, lon: 6 }, europa: { lat: -6, lon: 66 } };
    const sph = (lat, lon) => ({ pol: clamp((90 - lat) * D2R, controls.minPolarAngle, controls.maxPolarAngle), az: Math.atan2(Math.cos(lon * D2R), -Math.sin(lon * D2R)) });

    let dragging = false, idleAt = 0, wheelActive = false, fly = null, tr = null, now = 0, touched = false;
    const stopInertia = () => { controls.enableDamping = false; controls.update(); controls.enableDamping = true; };
    controls.addEventListener('start', () => { dragging = true; fly = null; if (!touched) { touched = true; el.app.classList.add('is-touched'); } });
    controls.addEventListener('end', () => { dragging = false; idleAt = now + 4; });

    function flyToSph(pol, az, dist, dur) {
      stopInertia();
      const az0 = controls.getAzimuthalAngle(), pol0 = controls.getPolarAngle(), d0 = controls.getDistance();
      let dAz = (az - az0) % TAU; if (dAz > Math.PI) dAz -= TAU; if (dAz < -Math.PI) dAz += TAU;
      const ang = Math.hypot(dAz * Math.sin((pol0 + pol) / 2), pol - pol0);
      const d = dur ?? clamp(0.55 + ang * 0.55, 0.6, 1.7);
      fly = { az0, dAz, pol0, pol1: pol, d0, d1: clamp(dist ?? d0, dMin, dMax), t: 0, dur: motion() ? d : 0.001 };
    }
    function flyTo(lat, lon, { focus = false, dur } = {}) {
      const s = sph(lat, lon);
      const d0 = controls.getDistance();
      flyToSph(s.pol, s.az, focus ? Math.min(d0, dFocus) : d0, dur);
    }
    function flyToGroup(list) {
      const m = new THREE.Vector3();
      list.forEach((it) => m.add(it.vec));
      if (m.length() < 0.05) return;
      m.normalize();
      const lat = Math.asin(m.y) / D2R, lon = Math.atan2(-m.z, m.x) / D2R;
      const s = sph(lat, lon);
      flyToSph(s.pol, s.az, dDefault);
    }
    function zoomBy(f) { flyToSph(controls.getPolarAngle(), controls.getAzimuthalAngle(), controls.getDistance() * f, 0.35); }
    function resetView() { const h = HOME[state.world]; const s = sph(h.lat, h.lon); flyToSph(s.pol, s.az, dDefault, 1.1); }

    // ---------- Sincronía de marcadores ----------
    function sync() { worlds[state.world].dirty = true; if (state.sel) worlds[state.world].mUniforms.uPing.value = 0; }
    function updateMarkers(w, dt) {
      const { vis, sel, hot } = w.attrs;
      let moving = false;
      for (const it of w.items) {
        const target = it.pass ? 1 : 0;
        if (Math.abs(it.visA - target) > 0.002) { it.visA = motion() ? lerp(it.visA, target, Math.min(1, dt * 9)) : target; moving = true; } else it.visA = target;
        vis[it.i] = it.visA;
        sel[it.i] = state.sel === it ? 1 : 0;
        hot[it.i] = state.hover === it ? 1 : 0;
      }
      w.mg.attributes.aVis.needsUpdate = true; w.mg.attributes.aSel.needsUpdate = true; w.mg.attributes.aHot.needsUpdate = true;
      w.dirty = moving;
    }

    // ---------- Etiquetas ----------
    const labelEls = new Map();
    function labelFor(it) {
      let n = labelEls.get(it.key);
      if (!n) {
        n = document.createElement('span');
        n.className = `worlds-label${it.recommended ? ' worlds-label--top' : ''}`;
        n.textContent = it.name;
        n.style.setProperty('--c', COLORS[it.colorKey]);
        el.labels.appendChild(n);
        n.__w = n.offsetWidth; n.__h = n.offsetHeight;
        labelEls.set(it.key, n);
      }
      return n;
    }
    const shownLabels = new Set();
    function layoutLabels(w, zoomK) {
      const want = [];
      if (!tr) {
        if (state.sel && state.sel.on) want.push(state.sel);
        if (state.hover && state.hover.on && state.hover !== state.sel) want.push(state.hover);
        for (const it of w.items) if (it.recommended && it.on && it !== state.sel && it !== state.hover) want.push(it);
      }
      const placed = [];
      const next = new Set();
      for (const it of want) {
        const n = labelFor(it);
        const strong = it === state.sel || it === state.hover;
        const ringPx = 15 * it.units * zoomK * 0.36 * (it === state.sel ? 1.35 : 1) * (it.recommended ? 1.6 : 1.1);
        const off = ringPx + 8, lw = n.__w || 80, lh = n.__h || 16;
        const opts = [[off, -lh / 2, 'r'], [-off - lw, -lh / 2, 'l'], [off * 0.7, -off * 0.7 - lh, 'r'], [off * 0.7, off * 0.7, 'r'], [-off * 0.7 - lw, -off * 0.7 - lh, 'l'], [-off * 0.7 - lw, off * 0.7, 'l']];
        let pick = null;
        for (const [dx, dy, side] of opts) {
          const x = it.sx + dx, y = it.sy + dy;
          if (x < 4 || x + lw > W - 4 || y < 4 || y + lh > H - 4) continue;
          if (placed.some((r) => x < r.x + r.w + 4 && x + lw + 4 > r.x && y < r.y + r.h + 2 && y + lh + 2 > r.y)) continue;
          pick = { x, y, w: lw, h: lh, side }; break;
        }
        if (!pick && strong) pick = { x: clamp(it.sx + off, 4, W - lw - 4), y: clamp(it.sy - lh / 2, 4, H - lh - 4), w: lw, h: lh, side: 'r' };
        if (!pick) continue;
        placed.push(pick); next.add(n);
        n.style.transform = `translate3d(${pick.x.toFixed(1)}px,${pick.y.toFixed(1)}px,0)`;
        n.classList.toggle('is-strong', strong);
        if (!n.__on) { n.__on = true; n.classList.add('is-on'); }
      }
      for (const n of shownLabels) if (!next.has(n)) { n.__on = false; n.classList.remove('is-on', 'is-strong'); }
      shownLabels.clear(); next.forEach((n) => shownLabels.add(n));
    }

    // ---------- Puntero ----------
    const ptr = { x: 0, y: 0, inside: false, downX: 0, downY: 0, downT: 0, type: 'mouse' };
    const v3 = new THREE.Vector3(), camDir = new THREE.Vector3(), tmp = new THREE.Vector3();
    const localXY = (e) => { const r = el.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function nearest(x, y, type) {
      let best = null, bd = Infinity;
      const base = type === 'touch' ? 24 : 13;
      for (const it of items()) {
        if (!it.on) continue;
        const d = Math.hypot(it.sx - x, it.sy - y);
        const reach = Math.max(base, 15 * it.units * 0.4);
        if (d < reach && d - (it.recommended ? 3 : 0) < bd) { bd = d - (it.recommended ? 3 : 0); best = it; }
      }
      return best;
    }
    function setHover(it) {
      if (state.hover === it) return;
      state.hover = it; worlds[state.world].dirty = true;
      el.canvas.style.cursor = it ? 'pointer' : '';
    }
    el.canvas.addEventListener('pointermove', (e) => {
      [ptr.x, ptr.y] = localXY(e); ptr.inside = true; ptr.type = e.pointerType;
      if (!dragging && !tr && e.pointerType !== 'touch') setHover(nearest(ptr.x, ptr.y, 'mouse'));
    });
    el.canvas.addEventListener('pointerdown', (e) => {
      [ptr.downX, ptr.downY] = localXY(e); ptr.downT = performance.now(); ptr.type = e.pointerType;
      if (e.pointerType === 'mouse') { wheelActive = true; el.app.classList.add('is-zoomable'); }
    });
    el.canvas.addEventListener('pointerup', (e) => {
      const [x, y] = localXY(e);
      if (Math.hypot(x - ptr.downX, y - ptr.downY) > 7 || performance.now() - ptr.downT > 600 || tr) return;
      const it = nearest(x, y, e.pointerType);
      if (it) select(it);
    });
    el.stage.addEventListener('pointerleave', () => { ptr.inside = false; wheelActive = false; el.app.classList.remove('is-zoomable'); setHover(null); });
    // La rueda hace zoom solo si antes se hizo clic en el globo (o con Ctrl): así no secuestra el scroll de la página.
    el.stage.addEventListener('wheel', (e) => { if (!(wheelActive || e.ctrlKey || e.metaKey)) e.stopPropagation(); }, { capture: true, passive: true });
    el.canvas.addEventListener('keydown', (e) => {
      const step = 12 * D2R;
      const az = controls.getAzimuthalAngle(), pol = controls.getPolarAngle(), d = controls.getDistance();
      const moves = { ArrowLeft: [0, -step], ArrowRight: [0, step], ArrowUp: [-step, 0], ArrowDown: [step, 0] };
      if (moves[e.key]) {
        e.preventDefault();
        flyToSph(clamp(pol + moves[e.key][0], controls.minPolarAngle, controls.maxPolarAngle), az + moves[e.key][1], d, 0.3);
      } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(0.8); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(1.25); }
      else if (e.key === '0') { e.preventDefault(); resetView(); }
      idleAt = now + 6;
    });
    root.querySelector('.worlds-zoom').addEventListener('click', (e) => {
      const b = e.target.closest('[data-zoom]');
      if (!b) return;
      if (b.dataset.zoom === 'in') zoomBy(0.78); else if (b.dataset.zoom === 'out') zoomBy(1.28); else resetView();
      idleAt = now + 6;
    });
    setText(el.hint, window.matchMedia('(pointer: coarse)').matches ? 'Arrastrá para girar · pellizcá para zoom' : 'Arrastrá para girar · clic y rueda para acercar');

    // ---------- Cambio de mundo ----------
    let current = worlds[state.world];
    const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
    function place(w, x, y, z, s, alpha) {
      w.group.position.set(0, 0, 0).addScaledVector(right, x).addScaledVector(up, y).addScaledVector(fwd, z);
      w.group.scale.setScalar(s);
      w.mUniforms.uScale.value = s; w.mUniforms.uAlpha.value = alpha;
    }
    function settle(w, on) { w.group.visible = on; w.group.position.set(0, 0, 0); w.group.scale.setScalar(1); w.mUniforms.uScale.value = 1; w.mUniforms.uAlpha.value = on ? 1 : 0; }
    function finishTransition() {
      if (!tr) return;
      settle(tr.from, false); settle(tr.to, true);
      stars.rotation.y = tr.star0 + tr.starD;
      tr = null; el.app.classList.remove('is-transit');
    }
    function setWorld(key, { target = null, instant = false } = {}) {
      finishTransition();
      const to = worlds[key];
      if (to === current) return;
      const from = current;
      current = to;
      loadTexture(key);
      to.dirty = true; setHover(null);
      if (target) to.mUniforms.uPing.value = -1.2; // el "ping" arranca cuando el mundo ya llegó
      const dir = WORLD_KEYS.indexOf(key) > WORLD_KEYS.indexOf(from.key) ? 1 : -1;
      if (instant || !motion()) {
        settle(from, false); settle(to, true);
        const s = sph((target || HOME[key]).lat, (target || HOME[key]).lon);
        flyToSph(s.pol, s.az, target ? dFocus : dDefault, 0.001);
        return;
      }
      tr = { from, to, t: 0, dur: 1.7, dir, star0: stars.rotation.y, starD: -0.55 * dir };
      to.group.visible = true;
      el.app.classList.add('is-transit');
      // Viaje de cámara: gira hasta el destino mientras llega el mundo nuevo
      const s = sph((target || HOME[key]).lat, (target || HOME[key]).lon);
      flyToSph(s.pol, s.az, target ? dFocus : dDefault, target ? 1.9 : 1.7);
    }

    // ---------- Tamaño ----------
    let sizeDirty = true;
    new ResizeObserver(() => { sizeDirty = true; }).observe(el.stage);
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!sizeDirty && dpr === DPR) return;
      sizeDirty = false;
      const w = Math.max(1, el.stage.clientWidth), h = Math.max(1, el.stage.clientHeight);
      if (w === W && h === H && dpr === DPR) return;
      const ratio = controls.getDistance() / dDefault;
      W = w; H = h; DPR = dpr;
      renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      dDefault = fitDist(0.76); dFocus = fitDist(0.85); dMin = Math.min(1.6, dDefault * 0.6); dMax = fitDist(0.4);
      controls.minDistance = dMin; controls.maxDistance = dMax;
      camera.position.setLength(clamp(dDefault * (Number.isFinite(ratio) && ratio > 0 ? ratio : 1), dMin, dMax));
      stars.material.uniforms.uPx.value = DPR;
      for (const k of WORLD_KEYS) worlds[k].mUniforms.uPx.value = DPR;
    }

    // ---------- Bucle ----------
    let raf = 0, visible = false, last = 0, frame = 0;
    function tick(ms) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, last ? (ms - last) / 1000 : 0.016); last = ms; now += dt; frame++;
      resize();

      // cámara
      if (fly) {
        fly.t += dt;
        const k = clamp(fly.t / fly.dur, 0, 1), e = easeInOut(k);
        camera.position.setFromSphericalCoords(lerp(fly.d0, fly.d1, e), lerp(fly.pol0, fly.pol1, e), fly.az0 + fly.dAz * e);
        if (k >= 1) fly = null;
      }
      const dist = camera.position.length();
      controls.rotateSpeed = clamp(0.55 * (dist - 1) / (dDefault - 1), 0.12, 0.7);
      controls.autoRotate = motion() && !state.sel && !state.hover && !dragging && !fly && !tr && now > idleAt;
      controls.update(dt);
      camera.updateMatrixWorld();

      // transición entre mundos
      if (tr) {
        tr.t += dt;
        const k = clamp(tr.t / tr.dur, 0, 1);
        const o = easeIn(clamp(k / 0.55, 0, 1)), i = easeOut(clamp((k - 0.22) / 0.78, 0, 1));
        right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1); fwd.setFromMatrixColumn(camera.matrixWorld, 2).negate();
        place(tr.from, -3.6 * tr.dir * o, 0.5 * o, 9 * o, 1 - 0.6 * o, 1 - clamp(o * 2.5, 0, 1));
        place(tr.to, 3.6 * tr.dir * (1 - i), -0.5 * (1 - i), 9 * (1 - i), 0.4 + 0.6 * i, clamp((i - 0.55) / 0.45, 0, 1));
        tr.from.group.visible = o < 1; tr.to.group.visible = k > 0.22;
        stars.rotation.y = tr.star0 + tr.starD * easeInOut(k);
        if (k >= 1) finishTransition();
      }

      const w = current;
      if (w.loaded && w.uniforms.uReveal.value < 1) w.uniforms.uReveal.value = Math.min(1, w.uniforms.uReveal.value + dt * (motion() ? 1.6 : 99));
      if (w.dirty) updateMarkers(w, dt);
      // los marcadores crecen un poco al acercarse y se achican en visores chicos (celular)
      const zoomK = clamp(Math.pow(dDefault / dist, 0.22), 0.85, 1.3) * clamp(Math.min(W, H) / 640, 0.68, 1.08);
      w.mUniforms.uTime.value = now; w.mUniforms.uZoom.value = zoomK; w.mUniforms.uMotion.value = motion() ? 1 : 0;
      w.mUniforms.uPing.value += dt;

      // proyección de marcadores (para clic, hover, etiquetas y contador)
      camDir.copy(camera.position).normalize();
      let onScreen = 0;
      for (const it of w.items) {
        it.front = it.vec.dot(camDir) > 1 / dist + 0.02;
        v3.copy(it.vec).project(camera);
        it.sx = (v3.x * 0.5 + 0.5) * W; it.sy = (-v3.y * 0.5 + 0.5) * H;
        it.on = !tr && it.pass && it.front && it.sx > 0 && it.sx < W && it.sy > 0 && it.sy < H;
        if (it.on) onScreen++;
      }
      layoutLabels(w, zoomK);

      // lecturas del HUD (cada 3 cuadros alcanza)
      if (frame % 3 === 0) {
        setCount(tr ? 0 : onScreen, true);
        const clat = Math.asin(clamp(camDir.y, -1, 1)) / D2R, clon = Math.atan2(-camDir.z, camDir.x) / D2R;
        const show = (lat, lon) => coordsFor(state.world, lat, lon);
        setText(el.hudCenter, show(clat, clon));
        el.dial.style.transform = `rotate(${clon.toFixed(2)}deg)`;
        let ptxt = '—';
        if (ptr.inside && !tr) {
          tmp.set((ptr.x / W) * 2 - 1, -(ptr.y / H) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
          const b = camera.position.dot(tmp), c = dist * dist - 1, disc = b * b - c;
          if (disc >= 0) {
            const t = -b - Math.sqrt(disc);
            v3.copy(camera.position).addScaledVector(tmp, t);
            ptxt = show(Math.asin(clamp(v3.y, -1, 1)) / D2R, Math.atan2(-v3.z, v3.x) / D2R);
          } else ptxt = 'Espacio profundo';
        }
        setText(el.hudPointer, ptxt);
        const kmPerPx = ((2 * (dist - 1) * tanHalf) / H) * WORLDS[state.world].radiusKm;
        const raw = kmPerPx * 96, pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
        const nice = [1, 2, 5, 10].map((m) => m * pow10).reduce((a, b2) => (Math.abs(b2 - raw) < Math.abs(a - raw) ? b2 : a));
        setText(el.hudScale, `${nfmt(nice, 0)} km`);
        el.scaleBar.style.width = `${(nice / kmPerPx).toFixed(1)}px`;
      }

      renderer.render(scene, camera);
    }
    const wake = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); wake(); }, { rootMargin: '80px' }).observe(root);
    document.addEventListener('visibilitychange', wake);

    // ---------- Arranque ----------
    resize();
    const s0 = state.sel ? sph(state.sel.lat, state.sel.lon) : sph(HOME[state.world].lat, HOME[state.world].lon);
    camera.position.setFromSphericalCoords(state.sel ? dFocus : dDefault, s0.pol, s0.az);
    camera.lookAt(0, 0, 0);
    controls.update();
    settle(current, true);
    loadTexture(state.world);
    if (state.sel) current.mUniforms.uPing.value = -0.6;
    el.app.classList.add('is-3d');

    return { sync, flyTo, flyToGroup, setWorld, resetView };
  }
}
