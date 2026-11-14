// Fronteras Galácticas — HERO: intro de despegue + escena 3D (Luna, Tierra, galaxia, órbita).
// Dueño: agente Hero. Exporta init(rootEl) y lo llama js/main.js con #hero-stage.
// Three.js se importa de forma perezosa para que la cuenta regresiva arranque al instante.

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const QUERY = new URLSearchParams(window.location.search);
const INTRO_KEY = 'fronteras:intro';
const KM_TIERRA_LUNA = 384400;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 4);

function rng(seed) { // mulberry32: mismo cielo en cada visita
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let booted = false;

export function init(stage) {
  const intro = document.getElementById('intro');
  if (!stage) { dismissIntro(intro); return; }
  if (booted) return;
  booted = true;

  const hero = stage.closest('.hero') || stage.parentElement;
  const flow = { revealed: false, fast: false, onReveal: null };
  const reveal = (fast) => {
    if (flow.revealed) return;
    flow.revealed = true;
    flow.fast = !!fast;
    hero.classList.add('hero--in');
    flow.onReveal?.();
  };

  try {
    if (!REDUCED) armCopy(hero);
    buildStage(stage);
  } catch (err) {
    console.warn('[hero] no se pudo preparar el escenario', err);
  }
  const scroll = trackScroll(hero);

  if (wantsIntro(intro)) {
    try {
      runIntro(intro, reveal);
    } catch (err) {
      console.warn('[hero] intro omitida', err);
      dismissIntro(intro);
      reveal(true);
    }
  } else {
    dismissIntro(intro);
    requestAnimationFrame(() => requestAnimationFrame(() => reveal(true)));
    setTimeout(() => reveal(true), 400); // por si la pestaña está en segundo plano
  }

  mountScene(stage, hero, scroll, flow).catch((err) => {
    console.warn('[hero] escena 3D no disponible, se usa el fondo de respaldo', err);
    stage.classList.add('hero-stage--fallback');
  });
}

/* ==========================================================================
   Texto del hero
   ========================================================================== */

// Envuelve cada línea del título para revelarla con máscara. El texto accesible no cambia.
function armCopy(hero) {
  const title = hero.querySelector('.hero-title');
  if (title && !title.querySelector('.hero-line')) {
    [...title.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (!text) return;
        const line = document.createElement('span');
        line.className = 'hero-line';
        const inner = document.createElement('span');
        inner.className = 'hero-line__in';
        inner.textContent = text;
        line.appendChild(inner);
        title.replaceChild(line, node);
        line.after(document.createTextNode(' '));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const inner = document.createElement('span');
        inner.className = 'hero-line__in';
        while (node.firstChild) inner.appendChild(node.firstChild);
        node.appendChild(inner);
        node.classList.add('hero-line');
      }
    });
  }
  hero.classList.add('hero--armed');
}

function buildStage(stage) {
  stage.insertAdjacentHTML('beforeend', `
    <div class="hero-shade"></div>
    <div class="hero-hud" aria-hidden="true">
      <i class="hero-mark"></i><i class="hero-mark"></i><i class="hero-mark"></i><i class="hero-mark"></i>
      <div class="hero-tag hero-tag--earth is-hidden" data-tag="earth" data-side="e">
        <i class="hero-tag__dot"></i><i class="hero-tag__lead"></i>
        <span class="hero-tag__txt"><b>Tierra</b>Acá ensayamos</span>
      </div>
      <div class="hero-tag hero-tag--moon is-hidden" data-tag="moon" data-side="ne">
        <i class="hero-tag__dot"></i><i class="hero-tag__lead"></i>
        <span class="hero-tag__txt"><b>Luna</b>Allá vamos</span>
      </div>
      <div class="hero-tag hero-tag--ship is-hidden" data-tag="ship" data-side="e">
        <i class="hero-tag__lead"></i>
        <span class="hero-tag__txt"><b>Nave de prueba</b><span data-km>000.000 km</span></span>
      </div>
      <div class="hero-cue">Iniciar descenso</div>
    </div>`);
}

// Progreso de scroll del hero (0 arriba → 1 cuando salió entero). ScrollTrigger si está; si no, a mano.
function trackScroll(hero) {
  const state = { p: 0 };
  const apply = (p) => {
    state.p = clamp(p, 0, 1);
    if (!REDUCED) hero.style.setProperty('--hero-p', state.p.toFixed(4));
  };
  const manual = () => {
    const r = hero.getBoundingClientRect();
    apply(-r.top / Math.max(1, r.height));
  };
  const ST = window.ScrollTrigger;
  if (window.gsap && ST) {
    try {
      window.gsap.registerPlugin(ST);
      ST.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });
      return state;
    } catch { /* cae al modo manual */ }
  }
  window.addEventListener('scroll', manual, { passive: true });
  window.addEventListener('resize', manual, { passive: true });
  manual();
  return state;
}

/* ==========================================================================
   Intro: cuenta regresiva de control de misión
   ========================================================================== */

function wantsIntro(intro) {
  if (!intro || REDUCED) return false;
  const forced = QUERY.get('intro');
  if (forced === '0') return false;
  if (forced === '1') return true;
  if (document.hidden || window.scrollY > 40 || window.location.hash.length > 1) return false;
  try {
    if (window.sessionStorage.getItem(INTRO_KEY)) return false;
    window.sessionStorage.setItem(INTRO_KEY, '1');
  } catch { /* almacenamiento bloqueado: la intro se muestra igual */ }
  return true;
}

function dismissIntro(intro) {
  if (!intro || intro.classList.contains('is-done')) return;
  intro.classList.add('is-out');
  intro.style.pointerEvents = 'none';
  setTimeout(() => intro.classList.add('is-done'), 450);
}

function runIntro(intro, reveal) {
  const STEP = 700; // ms entre T−3, T−2, T−1 y 0
  const log = [
    ['Propulsión', 'OK'],
    ['Guiado y navegación', 'OK'],
    ['Mate y termo', 'A bordo', true],
    ['Destino', 'Luna · 384.400 km'],
    ['Tripulación La LUNA', 'Lista'],
  ];
  const skipHint = window.matchMedia?.('(hover: none)').matches ? 'Tocá para saltar' : 'Clic, tecla o scroll para saltar';
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r0 = major ? 95.2 : 96.6;
    const c = Math.cos(a), s = Math.sin(a);
    ticks += `<line${major ? ' class="major"' : ''} x1="${(100 + c * r0).toFixed(2)}" y1="${(100 + s * r0).toFixed(2)}" x2="${(100 + c * 99).toFixed(2)}" y2="${(100 + s * 99).toFixed(2)}"/>`;
  }
  intro.innerHTML = `
    <div class="hero-intro__veil"></div>
    <div class="hero-intro__ui">
      <div class="hero-intro__head"><span>Control de misión · La LUNA</span><span>Secuencia de despegue · FG-2026</span></div>
      <div class="hero-intro__dial">
        <svg class="hero-intro__reticle" viewBox="0 0 200 200" aria-hidden="true">
          <line class="axis" x1="100" y1="-8" x2="100" y2="4"/><line class="axis" x1="100" y1="196" x2="100" y2="208"/>
          <line class="axis" x1="-8" y1="100" x2="4" y2="100"/><line class="axis" x1="196" y1="100" x2="208" y2="100"/>
          <circle class="track" cx="100" cy="100" r="92"/>
          <circle class="arc" cx="100" cy="100" r="92" pathLength="100"/>
          <g class="ticks">${ticks}</g>
        </svg>
        <div class="hero-intro__count"><span class="hero-intro__t">T−</span><span class="hero-intro__n">3</span></div>
        <div class="hero-intro__word">Cuenta regresiva</div>
      </div>
      <div class="hero-intro__foot">
        <ul class="hero-intro__log">${log.map(([k, v, fun]) => `<li${fun ? ' class="is-fun"' : ''}><span>${k}</span><b>${v}</b></li>`).join('')}</ul>
        <span class="hero-intro__skip">${skipHint}</span>
      </div>
    </div>
    <div class="hero-intro__ring"></div>`;
  intro.classList.add('is-live');

  const veil = intro.querySelector('.hero-intro__veil');
  const ring = intro.querySelector('.hero-intro__ring');
  const dial = intro.querySelector('.hero-intro__dial');
  const num = intro.querySelector('.hero-intro__n');
  const word = intro.querySelector('.hero-intro__word');
  const items = [...intro.querySelectorAll('.hero-intro__log li')];

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let phase = 'count';
  let raf = 0;

  const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchmove'];
  const onSkip = () => open(true);
  skipEvents.forEach((ev) => window.addEventListener(ev, onSkip, { passive: true }));

  const finish = () => {
    if (phase === 'done') return;
    phase = 'done';
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    skipEvents.forEach((ev) => window.removeEventListener(ev, onSkip));
    intro.classList.add('is-done');
    intro.style.pointerEvents = 'none';
    intro.innerHTML = '';
  };

  function open(fast) {
    if (phase !== 'count') return;
    phase = 'open';
    timers.forEach(clearTimeout);
    intro.classList.add('is-open');
    intro.style.pointerEvents = 'none';
    reveal(fast);

    const box = dial.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const maxR = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 24;
    const dur = fast ? 560 : 1150;
    const t0 = performance.now();
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const r = easeInOut(t) * maxR;
      const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${Math.max(0, r - 1).toFixed(1)}px, #000 ${(r + 1 + r * 0.03).toFixed(1)}px)`;
      veil.style.webkitMaskImage = mask;
      veil.style.maskImage = mask;
      ring.style.width = ring.style.height = `${(r * 2).toFixed(1)}px`;
      ring.style.opacity = (1 - t * t).toFixed(3);
      if (t < 1) raf = requestAnimationFrame(step); else finish();
    };
    raf = requestAnimationFrame(step);
    setTimeout(finish, dur + 900); // red de seguridad si rAF está pausado
  }

  const tick = (value) => {
    num.textContent = String(value);
    num.classList.remove('is-tick');
    void num.offsetWidth;
    num.classList.add('is-tick');
  };

  later(() => { intro.classList.add('is-counting'); tick(3); }, 60);
  later(() => tick(2), 60 + STEP);
  later(() => tick(1), 60 + STEP * 2);
  later(() => { tick(0); intro.classList.add('is-go'); word.textContent = 'Despegue'; }, 60 + STEP * 3);
  later(() => open(false), 60 + STEP * 3 + 540);
  items.forEach((li, i) => {
    later(() => li.classList.add('is-on'), 160 + i * 360);
    later(() => li.classList.add('is-ok'), 400 + i * 360);
  });
}

/* ==========================================================================
   Shaders
   ========================================================================== */

const GLSL_NOISE = /* glsl */`
float hash13(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
vec3 hash33(vec3 p){ p = fract(p*vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3. - 2.*f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1., 0., 0.)), f.x), mix(hash13(i + vec3(0., 1., 0.)), hash13(i + vec3(1., 1., 0.)), f.x), f.y),
    mix(mix(hash13(i + vec3(0., 0., 1.)), hash13(i + vec3(1., 0., 1.)), f.x), mix(hash13(i + vec3(0., 1., 1.)), hash13(i + vec3(1., 1., 1.)), f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float a = .5, s = 0.;
  for (int i = 0; i < 5; i++){ s += a*vnoise(p); p = p*2.03 + vec3(17.1, 3.7, 9.2); a *= .5; }
  return s;
}
`;

const VERT_QUAD = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`;

// Hornea una vez el relieve lunar (altura + albedo) en una textura equirectangular.
// Los cráteres se calculan en 3D sobre la esfera, así que no se deforman en los polos.
const FRAG_MOON_BAKE = /* glsl */`
varying vec2 vUv;
const float PI = 3.141592653589793;
${GLSL_NOISE}
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }

float craterShape(float t, float floorH, float peak){
  float cavity = t*t - 1.;
  float rx = min(t - 1.7, 0.);
  float rim = .42*rx*rx;
  return smax(smin(cavity, rim, .28), floorH, .22) + peak*exp(-t*t*34.);
}

// Capa de cráteres: una celda 3D de lado 1/f puede alojar un cráter cuyo centro se proyecta a la superficie.
float craterLayer(vec3 p, float f, float seed, float density, float floorH, float peak, inout float fresh){
  vec3 q = p*f;
  vec3 base = floor(q - .5);
  float h = 0.;
  for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) for (int k = 0; k < 2; k++){
    vec3 c = base + vec3(float(i), float(j), float(k));
    vec3 rnd = hash33(c + seed*7.13);
    vec3 ctr = c + .5 + (rnd - .5)*.5;
    float rl = length(ctr);
    if (abs(rl - f) > .25 || hash13(c.zxy*1.31 + seed*3.7) > density) continue;
    ctr *= f/rl;
    float sz = hash13(c.yzx + seed + 11.);
    float r = mix(.085, .29, sz*sz);
    float t = length(q - ctr)/r;
    if (t > 1.7) continue;
    float age = mix(.3, 1., hash13(c + seed*5.3 + 2.));
    h += craterShape(t, floorH, peak)*r*age;
    float young = step(.86, hash13(c + seed*1.9 + 4.2))*age;
    fresh += young*exp(-t*1.5)*(1. - smoothstep(1.1, 1.7, t));
  }
  return h/f;
}

// Cráter joven con rayos brillantes (tipo Tycho / Copérnico).
float rayCrater(vec3 p, vec3 c, float r, inout float rays){
  float d = acos(clamp(dot(p, c), -1., 1.));
  float t = d/r;
  vec3 e = normalize(p - c*dot(p, c) + 1e-6);
  float streak = vnoise(e*6. + c*13.)*vnoise(e*17. + c*5.);
  streak = smoothstep(.10, .42, streak);
  rays += exp(-t*.20)*streak*smoothstep(.8, 1.8, t)*.9 + exp(-t*.9)*smoothstep(.55, 1.15, t)*.8;
  if (t > 1.7) return 0.;
  return craterShape(t, -.5, .3)*r*.36;
}

vec2 moonSurface(vec3 p){
  float mare = smoothstep(.49, .60, fbm(p*1.15 + vec3(2.3, 8.1, 4.4)) + .10*(fbm(p*5. + 3.) - .5));
  float fresh = 0., rays = 0.;
  float h = 0.;
  float rough = 1. - .7*mare;
  h += (fbm(p*3. + 1.7) - .5)*.030*rough;
  h += (fbm(p*13. + 7.) - .5)*.0065*rough;
  h += (fbm(p*55. + 3.) - .5)*.0022*(1. - .4*mare);
  h -= mare*.011;
  float old = 1. - .72*mare; // la lava de los mares tapó los cráteres viejos
  h += craterLayer(p, 2.2, 1., .60, -.28, .16, fresh)*.24*old;
  h += craterLayer(p, 4.5, 2., .72, -.40, .16, fresh)*.30*old;
  h += craterLayer(p, 9.0, 3., .80, -.62, .08, fresh)*.38*mix(1., .45, mare);
  h += craterLayer(p, 18., 4., .86, -1., 0., fresh)*.44*mix(1., .6, mare);
  h += craterLayer(p, 36., 5., .88, -1., 0., fresh)*.46*mix(1., .8, mare);
  h += craterLayer(p, 72., 6., .88, -1., 0., fresh)*.46;
#ifdef FINE
  h += craterLayer(p, 144., 7., .88, -1., 0., fresh)*.46;
#endif
  h += rayCrater(p, normalize(vec3(-.42, .30, .86)), .034, rays);
  h += rayCrater(p, normalize(vec3(.35, -.48, .80)), .026, rays);
  h += rayCrater(p, normalize(vec3(-.80, -.25, -.55)), .030, rays);
  h += rayCrater(p, normalize(vec3(.55, .62, -.56)), .022, rays);

  float alb = mix(.60, .21, mare);
  alb *= .84 + .32*fbm(p*6. + 1.7);
  alb *= .93 + .14*fbm(p*40. + 9.);
  alb += fresh*.22 + rays*.20;
  return vec2(h, clamp(alb, 0.03, 1.));
}

void main(){
  float th = (1. - vUv.y)*PI, ph = vUv.x*2.*PI;
  vec3 p = vec3(-cos(ph)*sin(th), cos(th), sin(ph)*sin(th));
  vec2 s = moonSurface(p);
#ifdef PACKED
  float v = clamp(s.x*10. + .5, 0., 1.)*255.;
  float hi = floor(v);
  gl_FragColor = vec4(hi/255., v - hi, s.y, 1.);
#else
  gl_FragColor = vec4(s.x, s.y, 0., 1.);
#endif
}
`;

const VERT_BODY = /* glsl */`
varying vec2 vUv;
varying vec3 vObjPos;
void main(){
  vUv = uv;
  vObjPos = position;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.);
}
`;

// Superficie lunar: normales por diferencias de altura, sombras proyectadas cerca del terminador
// y fotometría tipo Lommel-Seeliger (la Luna casi no se oscurece hacia el limbo).
const FRAG_MOON = /* glsl */`
varying vec2 vUv;
varying vec3 vObjPos;
uniform sampler2D uMap;
uniform vec2 uTexel;
uniform vec3 uSun, uCam, uEarth;
uniform float uBump, uExposure;
const float PI = 3.141592653589793;
${GLSL_NOISE}

#ifdef PACKED
float hOf(vec4 t){ return ((t.r*255. + t.g)/255. - .5)/10.; }
float aOf(vec4 t){ return t.b; }
#else
float hOf(vec4 t){ return t.r; }
float aOf(vec4 t){ return t.g; }
#endif
vec2 dirToUv(vec3 q){ return vec2(atan(q.z, -q.x)/(2.*PI), 1. - acos(clamp(q.y, -1., 1.))/PI); }

void main(){
  vec3 p = normalize(vObjPos);
  vec3 east = normalize(vec3(p.z, 0., -p.x) + vec3(1e-5, 0., 0.));
  vec3 north = cross(p, east);
  vec3 V = normalize(uCam - p);
  vec3 L = uSun;

  vec4 t0 = texture2D(uMap, vUv);
  float h0 = hOf(t0);
  float hE = hOf(texture2D(uMap, vUv + vec2(uTexel.x, 0.)));
  float hW = hOf(texture2D(uMap, vUv - vec2(uTexel.x, 0.)));
  float hN = hOf(texture2D(uMap, vUv + vec2(0., uTexel.y)));
  float hS = hOf(texture2D(uMap, vUv - vec2(0., uTexel.y)));
  float sinT = max(sqrt(max(1. - p.y*p.y, 0.)), .06);
  vec2 g = vec2((hE - hW)/(4.*PI*uTexel.x*sinT), (hN - hS)/(2.*PI*uTexel.y));

  // micro-relieve procedural: mantiene el detalle cuando la textura se queda corta
  float fw = length(fwidth(p));
  float m1 = 1. - smoothstep(.22, .7, fw*150.);
  float m2 = 1. - smoothstep(.22, .7, fw*380.);
  if (m1 > .01){
    float e = .0016;
    vec3 pe = normalize(p + east*e), pn = normalize(p + north*e);
    float a0 = vnoise(p*150.)*m1 + vnoise(p*380. + 7.)*.45*m2;
    float aE = vnoise(pe*150.)*m1 + vnoise(pe*380. + 7.)*.45*m2;
    float aN = vnoise(pn*150.)*m1 + vnoise(pn*380. + 7.)*.45*m2;
    g += vec2(aE - a0, aN - a0)/e*.0014;
  }

  float facing = dot(p, V);
  float bump = uBump*mix(.45, 1., smoothstep(0., .35, facing));
  vec3 n = normalize(p - bump*(g.x*east + g.y*north));

  float ndl0 = dot(p, L);
  float ndl = dot(n, L);

  // sombras: se marcha hacia el Sol sobre el mapa de alturas
  float shadow = 1.;
  if (ndl0 > -.08 && ndl0 < .62){
    vec3 Lt = L - p*ndl0;
    float ll = max(length(Lt), 1e-4);
    vec3 dT = Lt/ll;
    float tanE = ndl0/ll;
    float occ = -1.;
    float s = 2.*PI*uTexel.x*1.6;
    for (int i = 0; i < 9; i++){
      vec3 q = normalize(p + dT*s);
      float hq = hOf(textureLod(uMap, dirToUv(q), float(i)*.42));
      occ = max(occ, ((hq - h0)*uBump*.45 - s*tanE - s*s*.5)/s);
      s *= 1.58;
    }
    shadow = mix(.035, 1., 1. - smoothstep(0., .10, occ));
  }

  float mu0 = max(ndl, 0.);
  float mu = max(dot(n, V), 0.);
  float ls = mu0/(mu0 + mu + 1e-3);
  float diff = mix(mu0, 2.*ls, .42);
  float gate = smoothstep(-.035, .05, ndl0);

  float alb = aOf(t0);
  vec3 tint = mix(vec3(.90, .93, 1.), vec3(1., .955, .89), smoothstep(.22, .62, alb));
  vec3 base = alb*tint;
  vec3 col = base*vec3(1., .93, .80)*diff*gate*shadow*1.8;
  // luz cenicienta: la Tierra ilumina apenas el lado nocturno
  float es = max(dot(n, uEarth)*.6 + .4, 0.);
  col += base*vec3(.30, .46, .72)*.020*es*(1. - gate*.8);

  col = 1. - exp(-col*uExposure);
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}
`;

const FRAG_EARTH = /* glsl */`
varying vec3 vObjPos;
uniform vec3 uSun, uCam;
uniform float uTime;
${GLSL_NOISE}
void main(){
  vec3 p = normalize(vObjPos);
  vec3 L = uSun;
  vec3 V = normalize(uCam - p);
  float lat = abs(p.y);

  float c = fbm(p*1.75 + vec3(4.2, 1.3, 7.7)) + .30*(fbm(p*4.6 + 2.1) - .5);
  float land = smoothstep(.495, .525, c);
  float n2 = fbm(p*6.5 + 9.);
  vec3 ocean = mix(vec3(.004, .028, .105), vec3(.012, .11, .26), smoothstep(.34, .50, c));
  vec3 veg = mix(vec3(.045, .12, .035), vec3(.13, .19, .06), n2);
  float dry = smoothstep(.42, .60, n2 + .22*(1. - min(abs(lat - .30)*4., 1.)));
  vec3 landc = mix(veg, vec3(.36, .27, .15), dry);
  vec3 col = mix(ocean, landc, land);
  col = mix(col, vec3(.84, .90, .96), smoothstep(.80, .88, lat + .09*(n2 - .5)));

  float a = uTime*.012;
  vec3 pc = vec3(p.x*cos(a) - p.z*sin(a), p.y, p.x*sin(a) + p.z*cos(a));
  float warp = fbm(pc*2.3 + 5.);
  float cl = fbm(pc*4.2 + vec3(warp*2.6, 0., warp*1.7) + 13.);
  cl = smoothstep(.47, .70, cl + .10*(1. - min(abs(lat - .52)*3., 1.)));
  col = mix(col, vec3(.93), cl*.94);

  float ndl = dot(p, L);
  float day = smoothstep(-.10, .20, ndl);
  float diff = max(ndl, 0.);
  vec3 R = reflect(-L, p);
  float spec = pow(max(dot(R, V), 0.), 42.)*(1. - land)*(1. - cl)*.85;
  vec3 lit = col*vec3(1., .96, .90)*(diff*1.75 + .03) + vec3(1., .88, .66)*spec;

  float mu = max(dot(p, V), 0.);
  float rim = pow(1. - mu, 2.4);
  vec3 atm = vec3(.22, .52, 1.)*(rim*1.5 + .10)*smoothstep(-.25, .35, ndl);
  vec3 dusk = vec3(1., .42, .16)*smoothstep(-.06, .08, ndl)*(1. - smoothstep(.08, .28, ndl))*.10;

  vec3 outc = lit*day + atm + dusk;
  outc = 1. - exp(-outc*1.35);
  gl_FragColor = vec4(outc, 1.);
  #include <colorspace_fragment>
}
`;

// Halo (atmósfera de la Tierra / brillo del limbo lunar): esfera un poco más grande, caras traseras, aditivo.
const VERT_HALO = /* glsl */`
varying vec3 vN;
varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  vN = normalize(normalMatrix*normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}
`;
const FRAG_HALO = /* glsl */`
varying vec3 vN;
varying vec3 vV;
uniform vec3 uColor, uSun;
uniform float uLimb, uPow, uGain, uDay0, uDay1;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  float nv = dot(n, v);
  float i = pow(smoothstep(0., uLimb, abs(nv)), uPow);
  vec3 nf = n - 2.*min(nv, 0.)*v;
  vec3 sunV = normalize((viewMatrix*vec4(uSun, 0.)).xyz);
  float day = smoothstep(uDay0, uDay1, dot(nf, sunV));
  gl_FragColor = vec4(uColor*i*day*uGain, 1.);
  #include <colorspace_fragment>
}
`;

const VERT_STARS = /* glsl */`
attribute float aSize;
attribute vec3 aColor;
attribute float aSeed;
uniform float uTime, uDpr, uTwinkle;
varying vec3 vColor;
void main(){
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mv;
  float tw = 1. - uTwinkle*(.5 + .5*sin(uTime*(.7 + aSeed*2.3) + aSeed*61.));
  float px = aSize*uDpr;
  gl_PointSize = max(px, 1.);
  vColor = aColor*tw*min(1., px);
}
`;
const FRAG_STARS = /* glsl */`
varying vec3 vColor;
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - .5)*2.;
  float a = smoothstep(1., 0., d);
  a *= a;
  gl_FragColor = vec4(vColor*a*uAlpha, 1.);
  #include <colorspace_fragment>
}
`;

const VERT_DOTS = /* glsl */`
uniform float uSize, uDpr;
void main(){
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = uSize*uDpr*clamp(6.5/-mv.z, .8, 1.55);
}
`;
const FRAG_DOTS = /* glsl */`
uniform vec3 uColor;
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - .5)*2.;
  float a = smoothstep(1., .55, d)*uAlpha;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;

/* ==========================================================================
   Escena 3D
   ========================================================================== */

async function mountScene(stage, hero, scroll, flow) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let gl = null;
  try {
    gl = canvas.getContext('webgl2', { antialias: dpr < 2, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' });
  } catch { gl = null; }
  if (!gl) { stage.classList.add('hero-stage--fallback'); return; }

  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x05060A, 1);
  stage.prepend(canvas);

  const FOV = 30;
  const TAN = Math.tan((FOV / 2) * Math.PI / 180);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 4000);
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const sunDir = V3(-0.80, 0.50, -0.30).normalize();
  const C = {
    paper: new THREE.Color('#ECE8DF'),
    sun: new THREE.Color('#FFD27A'),
    telemetry: new THREE.Color('#8FE3FF'),
    signal: new THREE.Color('#FF5B1F'),
  };
  const rand = rng(20261115);
  const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += rand(); return (s - 2) * 1.22; };

  let W = 1, H = 1, aspect = 1, portrait = 0;

  /* ---------- Luna ---------- */
  // 4096 px sólo en pantallas grandes: en un celular la Luna ocupa menos y 2048 alcanza
  let software = false;
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '');
    software = /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch { /* sin datos del renderer: se asume GPU real */ }
  const big = !software && Math.min(stage.clientWidth, stage.clientHeight) >= 600 && stage.clientHeight * dpr >= 700
    && renderer.capabilities.maxTextureSize >= 4096 && (navigator.deviceMemory ?? 8) >= 4;
  const TEX_W = big ? 4096 : 2048;
  const TEX_H = TEX_W / 2;
  // Altura en media precisión (RG16F) si la GPU deja renderizar a flotantes; si no, 16 bits repartidos en dos canales de 8.
  let packed = !(renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
  const makeMoonRT = () => {
    const rt = new THREE.WebGLRenderTarget(TEX_W, TEX_H, {
      depthBuffer: false,
      format: packed ? THREE.RGBAFormat : THREE.RGFormat,
      type: packed ? THREE.UnsignedByteType : THREE.HalfFloatType,
      colorSpace: THREE.NoColorSpace,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      magFilter: THREE.LinearFilter,
      minFilter: packed ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter,
      generateMipmaps: !packed,
    });
    if (!packed) rt.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return rt;
  };
  let moonRT = makeMoonRT();
  if (!packed) {
    // hay equipos que anuncian la extensión y después no completan el framebuffer
    renderer.setRenderTarget(moonRT);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    renderer.setRenderTarget(null);
    if (!complete) { moonRT.dispose(); packed = true; moonRT = makeMoonRT(); }
  }

  const defines = packed ? { PACKED: 1 } : {};
  const moonMat = new THREE.ShaderMaterial({
    defines,
    uniforms: {
      uMap: { value: moonRT.texture },
      uTexel: { value: new THREE.Vector2(1 / TEX_W, 1 / TEX_H) },
      uSun: { value: V3(1, 0, 0) },
      uCam: { value: V3(0, 0, 5) },
      uEarth: { value: V3(0, 0, 1) },
      uBump: { value: 1.9 },
      uExposure: { value: 1.3 },
    },
    vertexShader: VERT_BODY,
    fragmentShader: FRAG_MOON,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), moonMat);
  moon.rotation.set(0.18, -0.55, 0.12);
  scene.add(moon);

  const haloMat = (color, scale, pow, gain, day0, day1) => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color }, uSun: { value: sunDir },
      uLimb: { value: Math.sqrt(1 - 1 / (scale * scale)) }, uPow: { value: pow }, uGain: { value: gain },
      uDay0: { value: day0 }, uDay1: { value: day1 },
    },
    vertexShader: VERT_HALO,
    fragmentShader: FRAG_HALO,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const haloGeo = new THREE.SphereGeometry(1, 64, 48);
  const moonHalo = new THREE.Mesh(haloGeo, haloMat(new THREE.Color('#FFE2A8'), 1.10, 6.0, 0.11, -0.1, 0.8));
  moonHalo.scale.setScalar(1.10);
  scene.add(moonHalo);

  /* ---------- Tierra ---------- */
  const earth = new THREE.Group();
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: V3(1, 0, 0) }, uCam: { value: V3(0, 0, 5) }, uTime: { value: 0 } },
    vertexShader: VERT_BODY,
    fragmentShader: FRAG_EARTH,
  });
  const earthBall = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), earthMat);
  earthBall.rotation.set(0.25, 1.9, 0.41);
  const earthHalo = new THREE.Mesh(haloGeo, haloMat(new THREE.Color('#6FB4FF'), 1.26, 5.5, 1.25, -0.35, 0.45));
  earthHalo.scale.setScalar(1.26);
  earth.add(earthBall, earthHalo);
  scene.add(earth);
  const EARTH_DEPTH = 70;

  /* ---------- Estrellas (3 capas con parallax) ---------- */
  const starUniforms = { uTime: { value: 0 }, uDpr: { value: dpr } };
  const starMat = (alpha, twinkle) => new THREE.ShaderMaterial({
    uniforms: { ...starUniforms, uAlpha: { value: alpha }, uTwinkle: { value: REDUCED ? 0 : twinkle } },
    vertexShader: VERT_STARS,
    fragmentShader: FRAG_STARS,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pointsFrom = (pos, col, size, seed, material) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    const pts = new THREE.Points(geo, material);
    pts.frustumCulled = false;
    return pts;
  };
  // banda de la Vía Láctea: un círculo máximo inclinado que cruza la escena en diagonal
  const bandN = V3(0.52, 0.80, 0.30).normalize();
  const bandA = V3().crossVectors(bandN, V3(0, 0, 1)).normalize();
  const bandB = V3().crossVectors(bandN, bandA).normalize();
  const tmp = V3();
  const skyDir = (inBand) => {
    for (let k = 0; k < 60; k++) {
      if (inBand) {
        const a = rand() * Math.PI * 2;
        tmp.copy(bandA).multiplyScalar(Math.cos(a)).addScaledVector(bandB, Math.sin(a)).addScaledVector(bandN, gauss() * 0.13).normalize();
      } else {
        const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        tmp.set(r * Math.cos(a), r * Math.sin(a), z);
      }
      // sólo la parte del cielo que puede entrar en cuadro
      if (tmp.z < 0 && Math.abs(tmp.x / tmp.z) < 0.9 && Math.abs(tmp.y / tmp.z) < 0.9) return tmp;
    }
    return tmp.set(0, 0, -1);
  };
  const starColor = (out) => {
    const r = rand();
    if (r < 0.14) out.copy(C.sun); else if (r < 0.27) out.copy(C.telemetry); else out.copy(C.paper);
    return out.lerp(C.paper, rand() * 0.5);
  };
  const makeStars = (count, radius, sMin, sMax, bMin, band, alpha, twinkle) => {
    const pos = [], col = [], size = [], seed = [];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const d = skyDir(rand() < band);
      pos.push(d.x * radius, d.y * radius, d.z * radius);
      const b = lerp(bMin, 1, Math.pow(rand(), 1.7));
      starColor(c);
      col.push(c.r * b, c.g * b, c.b * b);
      size.push(lerp(sMin, sMax, Math.pow(rand(), 3)));
      seed.push(rand());
    }
    return pointsFrom(pos, col, size, seed, starMat(alpha, twinkle));
  };
  const starLayers = [
    { pts: makeStars(5200, 1500, 1.0, 2.2, 0.34, 0.55, 1, 0.35), k: 0.006 },
    { pts: makeStars(900, 1300, 1.6, 3.2, 0.5, 0.3, 1, 0.45), k: 0.013 },
    { pts: makeStars(90, 1100, 3.6, 7.0, 0.75, 0.1, 1, 0.3), k: 0.022 },
  ];
  starLayers.forEach((l) => scene.add(l.pts));

  /* ---------- Galaxia espiral ---------- */
  const galaxyPivot = new THREE.Group();
  const galaxy = new THREE.Group();
  galaxy.rotation.order = 'ZXY';
  {
    const pos = [], col = [], size = [], seed = [];
    const c = new THREE.Color();
    const N = 9000;
    for (let i = 0; i < N; i++) {
      let x, y, z, r, bulge = false;
      if (rand() < 0.16) { // bulbo
        r = Math.abs(gauss()) * 0.11;
        const a = rand() * Math.PI * 2;
        x = Math.cos(a) * r; z = Math.sin(a) * r; y = gauss() * 0.045 * (1 - r);
        bulge = true;
      } else { // brazos
        r = 0.07 + Math.pow(rand(), 0.75) * 0.93;
        const arm = Math.floor(rand() * 2) * Math.PI;
        const a = arm + Math.log(r / 0.07) * 1.7 + gauss() * (0.13 + 0.16 * (1 - r)) + (rand() < 0.2 ? gauss() * 0.9 : 0);
        const rr = r + gauss() * 0.025;
        x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = gauss() * 0.018 * (1.15 - r);
      }
      pos.push(x, y, z);
      const t = rand();
      c.copy(C.sun).lerp(C.paper, smooth(0.04, 0.5, r));
      if (r > 0.2 && t < 0.16) c.copy(C.telemetry).lerp(C.paper, rand() * 0.4);
      const b = (0.30 + 0.70 * Math.pow(1 - Math.min(r, 1), 1.3)) * (0.45 + 0.55 * rand()) * (bulge ? 0.5 : 1);
      col.push(c.r * b, c.g * b, c.b * b);
      size.push(lerp(1.1, 2.6, Math.pow(rand(), 2.2)));
      seed.push(rand());
    }
    const pts = pointsFrom(pos, col, size, seed, starMat(0.7, 0.2));
    galaxy.add(pts);
    galaxy.userData.pts = pts;
  }
  const glowTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const glowSprite = (color, opacity, attenuate = true) => new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: attenuate,
  }));
  const galaxyCore = glowSprite(C.sun, 0.34);
  galaxyCore.scale.setScalar(0.5);
  galaxy.add(galaxyCore);
  galaxyPivot.add(galaxy);
  scene.add(galaxyPivot);
  const GALAXY_DEPTH = 900;

  /* ---------- Trayectoria punteada + nave ---------- */
  const dotsMat = (color, size, alpha) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uSize: { value: size }, uDpr: { value: dpr }, uAlpha: { value: alpha } },
    vertexShader: VERT_DOTS,
    fragmentShader: FRAG_DOTS,
    transparent: true,
    depthWrite: false,
  });
  const pathGeo = new THREE.BufferGeometry();
  pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3), 3));
  const pathDots = new THREE.Points(pathGeo, dotsMat(C.telemetry, 2.1, 0.62));
  pathDots.frustumCulled = false;
  scene.add(pathDots);

  const shipHalo = glowSprite(C.signal, 0.95, false);
  const shipCore = glowSprite(new THREE.Color('#FFF1DC'), 1, false);
  scene.add(shipHalo, shipCore);
  const TRAIL = 14;
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TRAIL * 3), 3));
  {
    const col = [], size = [], seed = [];
    for (let i = 0; i < TRAIL; i++) {
      const f = 1 - i / TRAIL;
      col.push(C.signal.r * f, C.signal.g * f, C.signal.b * f);
      size.push(1.2 + 2.6 * f);
      seed.push(0);
    }
    trailGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    trailGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    trailGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  }
  const trailMat = starMat(1, 0);
  trailMat.depthTest = true;
  const trail = new THREE.Points(trailGeo, trailMat);
  trail.frustumCulled = false;
  scene.add(trail);

  // geometría de la trayectoria (se recalcula con el encuadre)
  const P = {
    E: V3(), M: V3(), aE: V3(), bE: V3(), aM: V3(), bM: V3(), rP: 1, rO: 1.3,
    s0: [0, 0], s1: [0, 0], s2: [0, 0], s3: [0, 0], d0: 1, d3: 1,
  };
  const T_EARTH = 0.14, T_XFER = 0.38, MOON_TURNS = 0.64, SHIP_PERIOD = 58;
  const ringE = (a, out) => out.copy(P.E).addScaledVector(P.aE, Math.cos(a) * P.rP).addScaledVector(P.bE, Math.sin(a) * P.rP);
  const ringM = (a, out) => out.copy(P.M).addScaledVector(P.aM, Math.cos(a) * P.rO).addScaledVector(P.bM, Math.sin(a) * P.rO);
  // transferencia: una cúbica dibujada en pantalla (así el arco siempre se lee bien) con profundidad interpolada
  const xfer = (s, out) => {
    const i = 1 - s;
    const b0 = i * i * i, b1 = 3 * i * i * s, b2 = 3 * i * s * s, b3 = s * s * s;
    const nx = P.s0[0] * b0 + P.s1[0] * b1 + P.s2[0] * b2 + P.s3[0] * b3;
    const ny = P.s0[1] * b0 + P.s1[1] * b1 + P.s2[1] * b2 + P.s3[1] * b3;
    const d = lerp(P.d0, P.d3, s * s * (3 - 2 * s));
    return out.set(nx * d * TAN, ny * d * TAN, -d);
  };
  const shipAt = (t, out) => {
    t = clamp(t, 0, 1);
    if (t < T_EARTH) return ringE((t / T_EARTH - 1) * Math.PI * 2, out);
    if (t < T_EARTH + T_XFER) return xfer((t - T_EARTH) / T_XFER, out);
    return ringM(Math.PI + ((t - T_EARTH - T_XFER) / (1 - T_EARTH - T_XFER)) * Math.PI * 2 * MOON_TURNS, out);
  };

  function buildPath() {
    const c = V3(), u = V3(), uL = V3(), sP = V3(), n = V3(), a = V3(), b = V3();
    const frame = (center, inc, outA, outB) => {
      c.copy(center).normalize().negate();                  // cuerpo → cámara
      uL.copy(u).addScaledVector(c, -u.dot(c)).normalize(); // Tierra→Luna tal como se ve en pantalla
      sP.crossVectors(c, uL).normalize();
      n.copy(c).multiplyScalar(Math.cos(inc)).addScaledVector(sP, Math.sin(inc)).normalize();
      outA.copy(uL);
      outB.crossVectors(n, outA).normalize();
    };
    P.E.copy(earth.position);
    P.M.copy(moon.position);
    u.copy(P.M).sub(P.E).normalize();
    P.rP = earth.scale.x * 1.6;
    P.rO = 1.3;
    frame(P.E, 1.05, P.aE, P.bE);
    frame(P.M, lerp(0.95, 0.88, portrait), P.aM, P.bM);

    // coordenadas de pantalla en unidades de tangente: x = X/(-Z·TAN), y = Y/(-Z·TAN)
    const scr = (v) => [v.x / (-v.z * TAN), v.y / (-v.z * TAN)];
    const dirOnScreen = (v, t) => {
      const p0 = scr(v), p1 = scr(b.copy(v).addScaledVector(t, 0.01 * -v.z));
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    };
    ringE(0, a);
    P.s0 = scr(a); P.d0 = -a.z;
    const t0 = dirOnScreen(a, P.bE);
    ringM(Math.PI, a);
    P.s3 = scr(a); P.d3 = -a.z;
    const t3 = dirOnScreen(a, n.copy(P.bM).negate());
    const reach = Math.hypot(P.s3[0] - P.s0[0], P.s3[1] - P.s0[1]) * 0.6;
    P.s1 = [P.s0[0] + t0[0] * reach, P.s0[1] + t0[1] * reach];
    P.s2 = [P.s3[0] - t3[0] * reach, P.s3[1] - t3[1] * reach];

    // puntos equiespaciados en pantalla (no en 3D) para que la línea punteada se lea pareja
    const out = [];
    const prev = { x: 0, y: 0 };
    const spacing = lerp(8.5, 7, portrait);
    const walk = (fn, from, to, steps) => {
      let acc = spacing;
      for (let i = 0; i <= steps; i++) {
        fn(lerp(from, to, i / steps), a);
        const sx = (a.x / (-a.z * TAN * aspect)) * W * 0.5;
        const sy = (a.y / (-a.z * TAN)) * H * 0.5;
        if (i > 0) acc += Math.hypot(sx - prev.x, sy - prev.y);
        prev.x = sx; prev.y = sy;
        if (acc >= spacing) {
          acc = 0;
          if (a.z < -0.5 && Math.abs(sx) < W * 1.1 && Math.abs(sy) < H * 1.1) out.push(a.x, a.y, a.z);
        }
      }
    };
    walk(ringE, 0, Math.PI * 2, 240);
    walk(xfer, 0, 1, 700);
    walk(ringM, 0, Math.PI * 2, 1200);
    pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  }

  /* ---------- Etiquetas HUD ---------- */
  const tags = {};
  stage.querySelectorAll('[data-tag]').forEach((el) => { tags[el.dataset.tag] = el; });
  const kmEl = tags.ship?.querySelector('[data-km]');
  const moonAnchor = V3();
  const proj = V3();
  const placeTag = (el, world, dx = 0, dy = 0) => {
    if (!el) return false;
    proj.copy(world).project(camera);
    const x = (proj.x * 0.5 + 0.5) * W + dx;
    const y = (-proj.y * 0.5 + 0.5) * H + dy;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    return proj.z < 1 && x > 8 && x < W - 8 && y > 8 && y < H - 8;
  };

  /* ---------- Encuadre (responsive) ---------- */
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    W = w; H = h; aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const k = smooth(0.72, 1.32, aspect); // 0 = retrato (celular), 1 = apaisado
    portrait = 1 - k;
    const place = (ax, ay, depth, out) => out.set(ax * depth * TAN * aspect, ay * depth * TAN, -depth);

    // diámetro de la Luna / alto de pantalla; en ventanas casi cuadradas se achica para no tapar el título
    const moonFrac = lerp(0.47, Math.min(0.97, 0.6 * aspect), k);
    const moonDepth = 1 / (TAN * moonFrac);
    place(lerp(0.74, 0.67, k), lerp(0.42, -0.36, k), moonDepth, moon.position);
    moonHalo.position.copy(moon.position);

    const earthFrac = lerp(0.066, 0.108, k);
    earth.scale.setScalar(earthFrac * EARTH_DEPTH * TAN);
    place(lerp(-0.62, -0.12, k), lerp(0.70, 0.55, k), EARTH_DEPTH, earth.position);

    place(lerp(-0.30, -0.52, k), lerp(0.20, 0.60, k), GALAXY_DEPTH, galaxy.position);
    galaxy.scale.setScalar(GALAXY_DEPTH * TAN * lerp(0.42, 0.66, k));
    galaxy.rotation.set(0.72, 0, lerp(-0.35, -0.42, k));

    const px = (n) => (n * 2 * TAN) / H; // px → escala de sprite sin atenuación
    shipHalo.scale.setScalar(px(26));
    shipCore.scale.setScalar(px(8));

    // punto de la Luna donde se ancla la etiqueta (apaisado: limbo superior; retrato: lado nocturno, que queda libre)
    const toCam = V3().copy(moon.position).normalize().negate();
    const right = V3().crossVectors(V3(0, 1, 0), toCam).normalize();
    const up = V3().crossVectors(toCam, right).normalize();
    if (k > 0.5) moonAnchor.copy(toCam).multiplyScalar(0.42).addScaledVector(up, 0.9).addScaledVector(right, -0.16);
    else moonAnchor.copy(toCam).multiplyScalar(0.8).addScaledVector(up, -0.46).addScaledVector(right, -0.36);
    moonAnchor.normalize().add(moon.position);
    if (tags.moon) tags.moon.dataset.side = k > 0.5 ? 'ne' : 'e';
    if (tags.earth) tags.earth.dataset.side = k > 0.5 ? 'e' : 's';

    buildPath();
  }

  /* ---------- Estado de animación ---------- */
  let time = 0;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let sp = scroll.p;
  let arrive = REDUCED ? 1 : 0;
  let arriveT0 = null;
  let arriveDur = 3.4;
  let kmStamp = -1;
  const camObj = V3(), q = new THREE.Quaternion(), shipPos = V3(), shipPrev = V3(), toShip = V3();

  const onPointer = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    tmx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    tmy = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
  };
  if (!REDUCED) window.addEventListener('pointermove', onPointer, { passive: true });

  function update(dt) {
    time += dt;
    const kM = 1 - Math.exp(-dt * 2.6);
    mx += (tmx - mx) * kM;
    my += (tmy - my) * kM;
    sp += (scroll.p - sp) * (1 - Math.exp(-dt * 7));
    if (REDUCED) sp = 0;
    if (arriveT0 !== null && arrive < 1) arrive = easeOut(clamp((performance.now() - arriveT0) / (arriveDur * 1000), 0, 1));
    const ar = 1 - arrive;
    const M = moon.position;

    // cámara: deriva lenta + parallax del mouse + llegada tras la intro + acercamiento al hacer scroll
    const yawMoon = -Math.atan2(M.x, -M.z), pitchMoon = Math.atan2(M.y, -M.z);
    camera.position.set(
      mx * 0.2 + Math.sin(time * 0.11) * 0.035 + M.x * 0.34 * sp - ar * 0.5,
      -my * 0.12 + Math.cos(time * 0.09) * 0.025 + M.y * 0.3 * sp - ar * 0.42,
      M.z * 0.32 * sp + ar * 3.4,
    );
    camera.rotation.set(
      -my * 0.006 + pitchMoon * 0.32 * sp - ar * 0.05,
      -mx * 0.009 + yawMoon * 0.36 * sp + ar * 0.07,
      sp * 0.07 - ar * 0.05,
    );
    camera.updateMatrixWorld();

    // cuerpos
    if (!REDUCED) {
      moon.rotation.y += dt * 0.0075;
      earthBall.rotation.y += dt * 0.022;
      galaxy.userData.pts.rotation.y -= dt * 0.006;
    }
    moon.updateMatrixWorld();
    q.copy(moon.quaternion).invert();
    moonMat.uniforms.uSun.value.copy(sunDir).applyQuaternion(q);
    moonMat.uniforms.uEarth.value.copy(earth.position).sub(M).normalize().applyQuaternion(q);
    moonMat.uniforms.uCam.value.copy(moon.worldToLocal(camObj.copy(camera.position)));
    earth.updateMatrixWorld(true);
    earthBall.getWorldQuaternion(q).invert();
    earthMat.uniforms.uSun.value.copy(sunDir).applyQuaternion(q);
    earthMat.uniforms.uCam.value.copy(earthBall.worldToLocal(camObj.copy(camera.position)));
    earthMat.uniforms.uTime.value = time;

    // cielo
    starUniforms.uTime.value = time;
    const drift = Math.sin(time * 0.017) * 0.02;
    starLayers.forEach((l) => l.pts.rotation.set(my * l.k + ar * 0.05, mx * l.k + drift + ar * 0.09, drift * 0.5));
    galaxyPivot.rotation.set(my * 0.006 + ar * 0.05, mx * 0.006 + drift + ar * 0.09, drift * 0.5);

    // nave
    const sf = (time / SHIP_PERIOD + 0.3) % 1;
    shipAt(sf, shipPos);
    const fade = smooth(0, 0.025, sf) * (1 - smooth(0.965, 1, sf));
    const pulse = 0.85 + 0.15 * Math.sin(time * 5);
    shipHalo.position.copy(shipPos);
    shipCore.position.copy(shipPos);
    shipHalo.material.opacity = 0.95 * fade * pulse;
    shipCore.material.opacity = fade;
    const tp = trailGeo.attributes.position;
    for (let i = 0; i < TRAIL; i++) {
      shipAt(Math.max(sf - i * 0.0016, 0), shipPrev);
      tp.setXYZ(i, shipPrev.x, shipPrev.y, shipPrev.z);
    }
    tp.needsUpdate = true;
    trailMat.uniforms.uAlpha.value = fade;

    // etiquetas
    const eR = (earth.scale.x / EARTH_DEPTH) * (H / (2 * TAN));
    const south = tags.earth?.dataset.side === 's';
    const eOk = placeTag(tags.earth, earth.position, south ? 0 : eR * 0.82, south ? eR * 0.6 : -eR * 0.58);
    tags.earth?.classList.toggle('is-hidden', !eOk || sp > 0.25);
    const mOk = placeTag(tags.moon, moonAnchor);
    tags.moon?.classList.toggle('is-hidden', !mOk || sp > 0.25);
    if (tags.ship) {
      const sOk = placeTag(tags.ship, shipPos);
      // ¿la nave quedó detrás de la Luna o de la Tierra?
      toShip.copy(shipPos).sub(camera.position);
      const dist = toShip.length();
      toShip.multiplyScalar(1 / dist);
      const hidden = (center, radius) => {
        camObj.copy(center).sub(camera.position);
        const along = camObj.dot(toShip);
        if (along < 0 || along > dist) return false;
        return camObj.lengthSq() - along * along < radius * radius;
      };
      const occluded = hidden(M, 1) || hidden(earth.position, earth.scale.x);
      tags.ship.classList.toggle('is-hidden', !sOk || occluded || fade < 0.6 || sp > 0.25);
      if (kmEl && time - kmStamp > 0.2) {
        kmStamp = time;
        const km = Math.round((shipPos.distanceTo(P.E) / P.E.distanceTo(P.M)) * KM_TIERRA_LUNA / 100) * 100;
        kmEl.textContent = `${String(Math.min(km, 999900)).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1.$2')} km`;
      }
    }
  }

  /* ---------- Horneado del relieve lunar (por franjas, para no trabar la intro) ---------- */
  const bakeDefines = { ...defines };
  if (big) bakeDefines.FINE = 1;
  const makeBakeMat = () => new THREE.ShaderMaterial({
    defines: bakeDefines,
    vertexShader: VERT_QUAD,
    fragmentShader: FRAG_MOON_BAKE,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
  const bakeScene = new THREE.Scene();
  const bakeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), makeBakeMat());
  bakeQuad.frustumCulled = false;
  bakeScene.add(bakeQuad);
  const bakeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const STRIPS = 12;
  let strip = 0;
  let ready = false;
  const bakeStep = () => {
    const y0 = Math.round((strip / STRIPS) * TEX_H);
    const y1 = Math.round(((strip + 1) / STRIPS) * TEX_H);
    moonRT.scissorTest = true;
    moonRT.scissor.set(0, y0, TEX_W, y1 - y0);
    moonRT.viewport.set(0, 0, TEX_W, TEX_H);
    renderer.setRenderTarget(moonRT);
    renderer.render(bakeScene, bakeCam);
    renderer.setRenderTarget(null);
    strip++;
    return strip >= STRIPS;
  };

  /* ---------- Bucle ---------- */
  let visible = true, running = false, rafId = 0, last = 0, lost = false;
  const dprLevels = [...new Set([dpr, Math.min(dpr, 1.5), Math.min(dpr, 1), 0.8])];
  let dprLevel = 0, warm = 0, avgMs = 16;
  const watchFrameRate = (ms) => {
    if (ms > 250) return;           // volvió de otra pestaña: no cuenta
    if (++warm < 40) return;        // los primeros cuadros compilan shaders
    avgMs += (ms - avgMs) * 0.06;
    if (warm % 50 === 0 && avgMs > 27 && dprLevel < dprLevels.length - 1) {
      dprLevel++;
      warm = 0;
      avgMs = 16;
      const v = dprLevels[dprLevel];
      renderer.setPixelRatio(v);
      starUniforms.uDpr.value = v;
      pathDots.material.uniforms.uDpr.value = v;
      layout();
    }
  };
  const renderOnce = () => { update(0); renderer.render(scene, camera); };
  const frame = (now) => {
    rafId = 0;
    if (!running) return;
    const ms = now - last;
    const dt = Math.min(0.05, Math.max(0, ms / 1000));
    last = now;
    watchFrameRate(ms);
    update(dt);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  };
  const sync = () => {
    const on = ready && !lost && visible && !document.hidden && !REDUCED;
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); rafId = requestAnimationFrame(frame); }
    else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  };
  const startArrival = () => {
    if (arriveT0 !== null || REDUCED) return;
    arriveT0 = performance.now();
    arriveDur = flow.fast ? 2.4 : 3.4;
  };
  const goLive = () => {
    ready = true;
    bakeQuad.material.dispose();
    bakeQuad.geometry.dispose();
    renderOnce();
    stage.classList.add('hero-stage--live');
    if (flow.revealed) startArrival(); else flow.onReveal = startArrival;
    sync();
  };
  const bakeLoop = () => {
    if (lost) return;
    let done = false;
    // con la pestaña oculta o sin animaciones, terminar de una
    const burst = REDUCED || document.hidden ? STRIPS : 1;
    for (let i = 0; i < burst && !done; i++) done = bakeStep();
    if (done) goLive(); else setTimeout(bakeLoop, 16);
  };

  layout();
  // Si la GPU compila shaders en paralelo, se espera a que terminen sin frenar la cuenta regresiva;
  // recién después se hornea la Luna.
  const parallel = renderer.extensions.has('KHR_parallel_shader_compile');
  const precompile = (s, c) => {
    if (parallel) return renderer.compileAsync(s, c);
    renderer.compile(s, c);
    return Promise.resolve();
  };
  renderer.setRenderTarget(moonRT);
  const bakeCompiled = precompile(bakeScene, bakeCam);
  renderer.setRenderTarget(null);
  Promise.race([
    Promise.all([bakeCompiled, precompile(scene, camera)]),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]).catch(() => {}).then(() => setTimeout(bakeLoop, 0));

  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    sync();
  }, { rootMargin: '80px' }).observe(hero);
  document.addEventListener('visibilitychange', sync);

  // ResizeObserver avisa antes de pintar: se reencuadra y se redibuja en el acto (setSize limpia el canvas)
  const onResize = () => {
    if (stage.clientWidth === W && stage.clientHeight === H) return;
    layout();
    if (ready && !lost) renderOnce();
  };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
  else window.addEventListener('resize', onResize, { passive: true });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    sync();
    stage.classList.remove('hero-stage--live');
    stage.classList.add('hero-stage--fallback');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    ready = false;
    strip = 0;
    stage.classList.remove('hero-stage--fallback');
    bakeQuad.material = makeBakeMat();
    bakeQuad.geometry = new THREE.PlaneGeometry(2, 2);
    setTimeout(bakeLoop, 0);
  });
}
