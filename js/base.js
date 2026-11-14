// Base lunar interactiva — "Armá tu base lunar".
// Escena 3D procedural (Three.js) + consola de misión con 4 modos:
// construcción por etapas, explorar, superficie y soporte vital.
// Contenido: docs/pdf-texto.txt (componentes, etapas, superficie, recursos).
// Parámetros de prueba opcionales: ?baseModo=explorar|superficie|soporte&baseEtapa=0..5&baseSel=<id>

/* ------------------------------------------------------------------ */
/* Datos (del PDF del equipo)                                          */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    title: 'Preparación del terreno', short: 'Terreno',
    text: 'Se selecciona un lugar adecuado y se despliegan robots. Antes de que llegue nadie, las máquinas nivelan el suelo y acondicionan la zona de aterrizaje.',
    note: 'Una plataforma pavimentada evita que cada nave que llega dispare polvo lunar contra el resto de la base.',
    items: ['Robots', 'Plataforma de aterrizaje', 'Barrera de regolito'],
  },
  {
    title: 'Instalación de energía', short: 'Energía',
    text: 'Se colocan los paneles solares y los sistemas de almacenamiento. Sin electricidad no funciona nada de lo que viene después.',
    note: 'Las baterías tienen que aguantar la noche lunar: unas dos semanas terrestres sin luz solar.',
    items: ['Campo de paneles solares', 'Baterías de alta capacidad'],
  },
  {
    title: 'Construcción de módulos', short: 'Módulos',
    text: 'Se envían los hábitats, el laboratorio y los equipos. Los módulos, inflables o rígidos, se cubren con regolito: el propio suelo lunar.',
    note: 'El regolito funciona como blindaje contra la radiación, los micrometeoritos y los cambios de temperatura.',
    items: ['Módulos habitables', 'Laboratorio', 'Esclusa de aire', 'Taller', 'Antena'],
  },
  {
    title: 'Instalación de soporte vital', short: 'Soporte vital',
    text: 'Se ponen en marcha los sistemas de agua, oxígeno y control térmico. La base empieza a respirar.',
    note: 'El circuito cerrado recicla más del 90 % del agua. Afuera, la temperatura va de 120 °C de día a −120 °C o menos de noche.',
    items: ['Depósitos de agua y oxígeno', 'Control térmico', 'Invernadero', 'Extracción de recursos'],
  },
  {
    title: 'Llegada de los astronautas', short: 'Tripulación',
    text: 'Llega la tripulación, comienzan las investigaciones y la base se amplía gradualmente.',
    note: 'Una base lunar permanente plenamente operativa todavía no existe: esto es un diseño conceptual.',
    items: ['4 astronautas', 'Vehículo de exploración', 'Primeras investigaciones'],
  },
];

const PARTS = [
  { id: 'hab', name: 'Módulos habitables', cat: 'Componente principal',
    what: 'Los espacios presurizados donde viven los astronautas.',
    use: 'Incluyen dormitorios, cocina, baños, zonas de descanso y áreas de trabajo.',
    fact: 'Pueden ser inflables o rígidos, y se cubren con regolito para protegerlos.' },
  { id: 'energia', name: 'Sistema de energía', cat: 'Componente principal',
    what: 'Paneles solares, baterías y, posiblemente, otras fuentes como reactores nucleares compactos.',
    use: 'Mantiene funcionando toda la base. Las baterías de alta capacidad cubren la noche lunar, que dura unas dos semanas terrestres.',
    fact: 'En los polos lunares los paneles pueden aprovechar luz casi continua.' },
  { id: 'eclss', name: 'Soporte vital', cat: 'Componente principal',
    what: 'Los sistemas de control ambiental que hacen habitable el interior.',
    use: 'Proporcionan oxígeno, regulan la presión y la temperatura, eliminan el dióxido de carbono y reciclan el agua.',
    fact: 'El circuito cerrado recicla más del 90 % del agua. Mirá el ciclo en la pestaña Soporte vital.' },
  { id: 'lab', name: 'Laboratorio', cat: 'Componente principal',
    what: 'El espacio para analizar rocas, estudiar el suelo lunar y hacer experimentos científicos.',
    use: 'También sirve para ensayar hardware espacial, resistencia de materiales y simulaciones de viajes a destinos como Marte.',
    fact: '' },
  { id: 'rover', name: 'Vehículos', cat: 'Componente principal',
    what: 'Rovers y drones para moverse por la superficie.',
    use: 'Transportan astronautas y carga, reconocen el terreno y permiten hacer pruebas remotas (telerrobótica).',
    fact: '' },
  { id: 'berma', name: 'Protección ambiental', cat: 'Componente principal',
    what: 'Blindaje contra la radiación, protección contra micrometeoritos y aislamiento térmico.',
    use: 'Las estructuras soportan el vacío y los cambios extremos de temperatura. El regolito se usa como protección adicional: cubre los módulos y frena el polvo que levantan las naves.',
    fact: 'El polvo lunar es abrasivo y tóxico: mantenerlo lejos es parte del diseño.' },
  { id: 'antena', name: 'Comunicaciones', cat: 'Componente principal',
    what: 'Antenas, computadoras, enlaces con la Tierra y sistemas de navegación.',
    use: 'Garantizan el enlace continuo con la Tierra y coordinan las operaciones en la superficie.',
    fact: '' },
  { id: 'pad', name: 'Plataforma de aterrizaje', cat: 'Logística',
    what: 'Una zona pavimentada o acondicionada para el arribo y despegue de naves.',
    use: 'Recibe suministros, equipos y tripulaciones, y evita la proyección dañina de polvo lunar durante los aterrizajes.',
    fact: 'Podría hacerse con materiales consolidados, como el hormigón lunar que estudia la ESA.' },
  { id: 'invernadero', name: 'Invernadero', cat: 'Otra instalación',
    what: 'Un módulo de cultivo, con sistemas hidropónicos o ensayos en suelo lunar.',
    use: 'Sirve para cultivar alimentos y estudiar el crecimiento de las plantas.',
    fact: '' },
  { id: 'tanques', name: 'Depósitos de agua y oxígeno', cat: 'Otra instalación',
    what: 'Las reservas de los dos recursos esenciales.',
    use: 'Almacenan agua y oxígeno para la tripulación. Del agua también puede salir combustible: hidrógeno y oxígeno.',
    fact: '' },
  { id: 'isru', name: 'Extracción de recursos', cat: 'Otra instalación · ISRU',
    what: 'Sistemas para extraer y procesar materiales locales.',
    use: 'Investigan cómo obtener agua del hielo lunar y producir oxígeno a partir del regolito; también metales y silicio para fabricar repuestos en el lugar.',
    fact: 'ISRU significa "uso de recursos in situ": vivir de lo que hay.' },
  { id: 'esclusa', name: 'Esclusa de aire', cat: 'Otra instalación',
    what: 'Una cámara de presurización entre el interior y el vacío.',
    use: 'Permite que astronautas y materiales entren y salgan sin despresurizar los módulos habitables.',
    fact: '' },
  { id: 'taller', name: 'Taller de reparación', cat: 'Otra instalación',
    what: 'El lugar donde se arregla todo lo que la Luna rompe.',
    use: 'Mantiene en condiciones los vehículos, las herramientas y los equipos.',
    fact: '' },
];

const SIZES = {
  pequena: { name: 'Pequeña', crew: '2–4', area: [1000, 5000] },
  mediana: { name: 'Mediana', crew: '4–8', area: [5000, 20000] },
  grande: { name: 'Grande', crew: '10–20', area: [20000, 100000] },
};

// Reparto del ejemplo de 10.000 m² (100 m × 100 m, 4 astronautas)
const ZONES = [
  { name: 'Módulos habitables y laboratorio', m2: 1000, color: 'var(--signal)', hex: 0xff5b1f, rect: [8, -46, 40, 25] },
  { name: 'Paneles solares y almacenamiento de energía', m2: 2000, color: 'var(--sun)', hex: 0xffd27a, rect: [-48, -48, 50, 40] },
  { name: 'Zona de vehículos y operaciones', m2: 2000, color: 'var(--telemetry)', hex: 0x8fe3ff, rect: [-2, 8, 50, 40] },
  { name: 'Protección, circulación y futuras ampliaciones', m2: 5000, color: 'var(--dust)', hex: 0xece8df, rect: [-50, -50, 100, 100] },
];

// Anclas 3D de cada ficha: a = posición de la etiqueta, ring = [x, z, radio], t = objetos que resalta
const HOT3D = {
  hab: { a: [37.5, 9, -31], ring: [31, -35, 14.5], t: ['hab'] },
  energia: { a: [-27, 8, -30], ring: [-24, -28, 28], t: ['solar', 'baterias'] },
  eclss: { a: [40, 8, -41], ring: [40.5, -41, 7], t: ['eclss'] },
  lab: { a: [18.5, 9.5, -31], ring: [18.5, -31, 7.2], t: ['lab'] },
  rover: { a: [2, 5.5, 1], ring: [2, 1, 4.6], t: ['rover'] },
  berma: { a: [17.6, 5.5, 14.6], ring: [30, 27, 20], t: ['berma'] },
  antena: { a: [15, 14, -41], ring: [15, -41, 4.2], t: ['antena'] },
  pad: { a: [30, 13, 27], ring: [30, 27, 13.4], t: ['pad', 'lander'] },
  invernadero: { a: [16, 5.5, -23.5], ring: [16, -23.5, 6.6], t: ['invernadero'] },
  tanques: { a: [38.5, 6.5, -23.5], ring: [38.5, -23.5, 7.6], t: ['tanques'] },
  isru: { a: [-27, 11, 24], ring: [-25.5, 24, 9.5], t: ['isru'] },
  esclusa: { a: [28, 6, -24.6], ring: [28, -24.2, 4.4], t: ['esclusa'] },
  taller: { a: [6, 7.5, 14], ring: [6, 14, 7.2], t: ['taller'] },
};

const nf = (n) => n.toLocaleString('es-AR');
const pad2 = (n) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/* Plantillas                                                          */
/* ------------------------------------------------------------------ */

const ICON = {
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" fill="currentColor"/></svg>',
  replay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3a5 5 0 1 1-4.6 3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M1.2 3.2 4 7l2.6-3.6z" fill="currentColor"/></svg>',
};

function lifeSVG() {
  // Ciclo simplificado de soporte vital. Colores: agua = telemetry, aire = paper, oxígeno/H₂ = sun, CO₂ = signal.
  const flows = [
    ['w', 'M56 48V104', 'orina', 61, 79],
    ['w', 'M68 140V204', '', 0, 0],
    ['w', 'M26 222H10V28H26', 'agua potable', 4, 128, -90],
    ['a', 'M132 48V104', 'aire de|cabina', 137, 74],
    ['a', 'M190 104V48', 'aire|purificado', 195, 74],
    ['o', 'M268 104V48', 'O₂', 274, 79],
    ['c', 'M160 140V204', 'CO₂', 165, 175],
    ['o', 'M252 140V204', 'H₂', 257, 175],
    ['w', 'M140 222H110', 'agua', 125, 216, 0, 'middle'],
    ['w', 'M68 240V268H310V122H294', 'agua', 190, 281, 0, 'middle'],
  ];
  const nodes = [
    [26, 104, 84, 36, 'Procesador', 'de orina', 'w'],
    [118, 104, 84, 36, 'Remoción', 'de CO₂', 'a'],
    [210, 104, 84, 36, 'Generador', 'de O₂', 'o'],
    [26, 204, 84, 36, 'Procesador', 'de agua', 'w'],
    [140, 204, 154, 36, 'Reducción de CO₂', '', 'c'],
  ];
  const mk = (k) => `<marker id="base-ar-${k}" viewBox="0 0 8 8" refX="6.4" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0 .8 7 4 0 7.2z" class="base-life__ah base-life__ah--${k}"/></marker>`;
  return `
  <svg class="base-life" viewBox="-6 0 326 292" role="img" aria-labelledby="base-life-t base-life-d">
    <title id="base-life-t">Ciclo simplificado de soporte vital</title>
    <desc id="base-life-d">La orina pasa por un procesador y vuelve como agua potable. El aire de cabina pasa por la remoción de dióxido de carbono y vuelve purificado. El generador de oxígeno entrega oxígeno a la cabina e hidrógeno a la reducción de dióxido de carbono, que devuelve agua.</desc>
    <defs>${['w', 'a', 'o', 'c'].map(mk).join('')}</defs>
    <rect class="base-life__cabin" x="26" y="8" width="268" height="40"/>
    <text class="base-life__cabin-t" x="160" y="25" text-anchor="middle">CABINA PRESURIZADA</text>
    <text class="base-life__sub" x="160" y="38" text-anchor="middle">4 ASTRONAUTAS</text>
    ${flows.map(([k, d, label, x, y, rot, anchor]) => `
      <path class="base-life__rail base-life__f--${k}" d="${d}"/>
      <path class="base-life__flow base-life__f--${k}" d="${d}" marker-end="url(#base-ar-${k})"/>
      ${label ? `<text class="base-life__lbl base-life__t--${k}" x="${x}" y="${y}" ${rot ? `transform="rotate(${rot} ${x} ${y})"` : ''} text-anchor="${anchor || (rot ? 'middle' : 'start')}">${label.split('|').map((l, i) => `<tspan x="${x}" dy="${i ? 9 : 0}">${l}</tspan>`).join('')}</text>` : ''}`).join('')}
    ${nodes.map(([x, y, w, h, l1, l2, k]) => `
      <rect class="base-life__node base-life__n--${k}" x="${x}" y="${y}" width="${w}" height="${h}"/>
      <text class="base-life__node-t" x="${x + w / 2}" y="${y + (l2 ? 15 : 21)}" text-anchor="middle">${l1.toUpperCase()}${l2 ? `<tspan x="${x + w / 2}" dy="11">${l2.toUpperCase()}</tspan>` : ''}</text>`).join('')}
  </svg>`;
}

function planSVG() {
  // Planta de la base de ejemplo (100 m × 100 m). Solo se usa como respaldo sin WebGL.
  const z = ZONES;
  const r = (i, cls) => `<rect class="${cls}" x="${z[i].rect[0]}" y="${z[i].rect[1]}" width="${z[i].rect[2]}" height="${z[i].rect[3]}" style="--c:${z[i].color}"/>`;
  return `
  <svg class="base-plan" viewBox="-56 -56 112 112" role="img" aria-label="Plano en planta de una base de 100 por 100 metros con sus cuatro zonas">
    ${r(3, 'base-plan__plot')}${r(0, 'base-plan__zone')}${r(1, 'base-plan__zone')}${r(2, 'base-plan__zone')}
    <circle class="base-plan__ink" cx="30" cy="27" r="12"/><circle class="base-plan__ink" cx="30" cy="27" r="4"/>
    <path class="base-plan__ink" d="M13 -31h30M28 -46v22M2 10h8v8h-8zM-34 18h14v12h-14z"/>
    ${[-42, -32, -22, -12].map((x) => [-43, -34, -25, -16].map((y) => `<rect class="base-plan__panel" x="${x - 3}" y="${y - 1.5}" width="6" height="3"/>`).join('')).join('')}
    <text x="-23" y="-2">ENERGÍA · 2.000 m²</text><text x="28" y="-48.5" text-anchor="middle">MÓDULOS · 1.000 m²</text>
    <text x="23" y="52" text-anchor="middle">OPERACIONES · 2.000 m²</text><text x="-27" y="40" text-anchor="middle">AMPLIACIONES</text>
  </svg>`;
}

function template() {
  const tabs = [['construccion', 'Construcción'], ['explorar', 'Explorar'], ['superficie', 'Superficie'], ['soporte', 'Soporte vital']];
  return `
<div class="base-console" data-mode="construccion">
  <p class="base-id"><span>[ 07 / BASE ]</span><span class="base-id__dim">4 astronautas · 100 m × 100 m · 1 hectárea</span></p>

  <div class="base-tabs" role="tablist" aria-label="Modos de la base lunar">
    ${tabs.map(([k, l], i) => `<button class="base-tab" role="tab" type="button" id="base-tab-${k}" data-mode="${k}" aria-controls="base-pane-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="base-tab__n">${pad2(i + 1)}</span>${l}</button>`).join('')}
  </div>

  <div class="base-stage">
    <div class="base-hud" aria-hidden="true">
      <i class="base-hud__c base-hud__c--tl"></i><i class="base-hud__c base-hud__c--tr"></i><i class="base-hud__c base-hud__c--bl"></i><i class="base-hud__c base-hud__c--br"></i>
      <span class="base-hud__r base-hud__r--tl">Sitio de ejemplo · terreno 100 × 100 m</span>
      <span class="base-hud__r base-hud__r--tr" data-ref="status">Terreno sin preparar</span>
    </div>
    <div class="base-labels" data-ref="labels"></div>
    <p class="base-hint" data-ref="hint">Arrastrá para girar la vista</p>

    <div class="base-view" role="group" aria-label="Controles de la vista">
      <button type="button" data-view="in" aria-label="Acercar">+</button>
      <button type="button" data-view="out" aria-label="Alejar">−</button>
      <button type="button" data-view="reset" aria-label="Volver a la vista inicial"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v4M8 11v4M1 8h4M11 8h4" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/></svg></button>
    </div>

    <div class="base-stepper" role="group" aria-label="Etapas de construcción">
      <button class="base-play" type="button" data-act="play" aria-label="Reproducir la construcción">${ICON.play}</button>
      <ol class="base-steps">
        ${STAGES.map((s, i) => `<li><button type="button" data-stage="${i + 1}" aria-label="Etapa ${i + 1}: ${s.title}"><span class="base-steps__n">${pad2(i + 1)}</span><span class="base-steps__t">${s.short}</span></button></li>`).join('')}
      </ol>
      <span class="base-stepper__bar" aria-hidden="true"><i data-ref="bar"></i></span>
    </div>

    <div class="base-fallback" data-ref="fallback" hidden>
      <p class="base-label">Vista 3D no disponible</p>
      <p class="base-text">Tu navegador no pudo iniciar los gráficos 3D, así que te dejamos el plano en planta. Todo el contenido sigue disponible en los paneles.</p>
      ${planSVG()}
    </div>
  </div>

  <div class="base-panel">
    <section class="base-pane" role="tabpanel" id="base-pane-construccion" aria-labelledby="base-tab-construccion" tabindex="0">
      <p class="base-label">Construcción por etapas</p>
      <div class="base-card" data-ref="stagecard" aria-live="polite"></div>
      <ol class="base-timeline">
        ${STAGES.map((s, i) => `<li><button type="button" data-stage="${i + 1}"><span class="base-timeline__n">${pad2(i + 1)}</span><span class="base-timeline__t">${s.title}</span></button></li>`).join('')}
      </ol>
      <div class="base-actions">
        <button type="button" class="base-btn" data-act="prev">Anterior</button>
        <button type="button" class="base-btn base-btn--main" data-act="play" data-ref="playtxt">Reproducir</button>
        <button type="button" class="base-btn" data-act="next">Siguiente</button>
      </div>
    </section>

    <section class="base-pane" role="tabpanel" id="base-pane-explorar" aria-labelledby="base-tab-explorar" tabindex="0" hidden>
      <p class="base-label">Explorar la base</p>
      <div class="base-card" data-ref="ficha" aria-live="polite"></div>
      <ul class="base-parts">
        ${PARTS.map((p, i) => `<li><button type="button" data-part="${p.id}"><span class="base-parts__n">${pad2(i + 1)}</span>${p.name}</button></li>`).join('')}
      </ul>
    </section>

    <section class="base-pane" role="tabpanel" id="base-pane-superficie" aria-labelledby="base-tab-superficie" tabindex="0" hidden>
      <p class="base-label">¿Cuánto terreno hace falta?</p>
      <div class="base-sizes" role="radiogroup" aria-label="Tamaño de la base">
        ${Object.entries(SIZES).map(([k, s]) => `<button type="button" role="radio" data-size="${k}" aria-checked="false"><b>${s.name}</b><span>${s.crew} astronautas</span></button>`).join('')}
      </div>
      <div class="base-sizeread" aria-live="polite">
        <div>
          <p class="base-big"><span data-ref="area"></span><small>m²</small></p>
          <p class="base-text" data-ref="areadesc"></p>
        </div>
        <svg class="base-scale" viewBox="0 0 100 100" aria-hidden="true" data-ref="scale"></svg>
      </div>
      <p class="base-label base-label--gap">Ejemplo · 4 astronautas · 100 m × 100 m = 10.000 m²</p>
      <div class="base-split" data-ref="split">
        ${ZONES.map((z, i) => `<button type="button" data-zone="${i}" style="--w:${z.m2 / 100}%;--c:${z.color}" aria-label="${z.name}: ${nf(z.m2)} metros cuadrados"><span>${z.m2 / 100}%</span></button>`).join('')}
      </div>
      <ul class="base-legend">
        ${ZONES.map((z, i) => `<li data-zone="${i}" style="--c:${z.color}"><i></i><span>${z.name}</span><b>${nf(z.m2)} m²</b></li>`).join('')}
      </ul>
      <p class="base-text base-text--small">Los módulos presurizados ocupan solo una parte. La superficie total depende sobre todo de los paneles solares, las distancias de seguridad, la zona de aterrizaje y la protección frente al polvo lunar.</p>
      <p class="base-disclaimer">Cifras orientativas para planificar el terreno, no medidas oficiales de una base ya construida.</p>
    </section>

    <section class="base-pane" role="tabpanel" id="base-pane-soporte" aria-labelledby="base-tab-soporte" tabindex="0" hidden>
      <p class="base-label">Soporte vital · ciclo simplificado</p>
      ${lifeSVG()}
      <ul class="base-loops">
        <li style="--c:var(--telemetry)"><i></i><span><b>Agua.</b> La orina pasa por un procesador y vuelve como agua potable.</span></li>
        <li style="--c:var(--paper)"><i></i><span><b>Aire.</b> Al aire de cabina se le quita el CO₂ y regresa purificado.</span></li>
        <li style="--c:var(--sun)"><i></i><span><b>Oxígeno.</b> El generador produce O₂ para respirar; el H₂ que sobra se usa para reducir el CO₂.</span></li>
      </ul>
      <p class="base-stat"><b>+90 %</b><span>del agua se recicla en un circuito cerrado. En la Luna no hay canilla.</span></p>
    </section>
  </div>
</div>`;
}

/* ------------------------------------------------------------------ */
/* init                                                                */
/* ------------------------------------------------------------------ */

export function init(root) {
  if (!root || root.dataset.baseReady) return;
  root.dataset.baseReady = '1';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(window.location.search);
  root.innerHTML = template();

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const ref = (k) => root.querySelector(`[data-ref="${k}"]`);
  const consoleEl = $('.base-console');
  const stageEl = $('.base-stage');
  const labelsEl = ref('labels');

  const state = { mode: 'construccion', stage: 0, playing: false, playT: 0, selected: null, size: 'mediana', zone: -1, touched: false };
  const STAGE_DUR = [0, 6.5, 7, 9, 8, 9];
  let S = null; // escena 3D (null si no hay WebGL)

  // --- etiquetas sobre la escena (las posiciona la escena 3D) ---
  const hotEls = {};
  PARTS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'base-hot'; b.dataset.part = p.id;
    b.setAttribute('aria-label', `${p.name}: ver ficha`);
    b.innerHTML = `<span class="base-hot__n">${pad2(i + 1)}</span><span class="base-hot__t">${p.name}</span>`;
    labelsEl.appendChild(b); hotEls[p.id] = b;
  });
  const zoneEls = ZONES.map((z, i) => {
    const d = document.createElement('span');
    d.className = 'base-zlabel'; d.dataset.zone = i; d.style.setProperty('--c', z.color);
    d.innerHTML = `<b>${nf(z.m2)} m²</b>${['Módulos + lab', 'Energía', 'Vehículos + operaciones', 'Protección · circulación · ampliaciones'][i]}`;
    labelsEl.appendChild(d); return d;
  });
  const sizeEls = ['mín', 'máx'].map((t) => {
    const d = document.createElement('span');
    d.className = 'base-slabel'; d.dataset.k = t; labelsEl.appendChild(d); return d;
  });

  /* ---------- Construcción ---------- */
  function renderStage() {
    const n = state.stage;
    const card = ref('stagecard');
    if (n === 0) {
      card.innerHTML = `<p class="base-card__n"><b>00</b> / 05</p><h3 class="base-h">Un terreno <em>vacío</em></h3>
        <p class="base-text">Una hectárea de regolito, cráteres y silencio. Una base lunar podría desarrollarse por etapas: dale a reproducir y mirá cómo se arma.</p>`;
    } else {
      const s = STAGES[n - 1];
      card.innerHTML = `<p class="base-card__n"><b>${pad2(n)}</b> / 05</p><h3 class="base-h">${s.title}</h3>
        <p class="base-text">${s.text}</p><p class="base-note">${s.note}</p>
        <ul class="base-chips">${s.items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
    }
    $$('[data-stage]').forEach((b) => {
      const k = +b.dataset.stage;
      b.classList.toggle('is-done', k < n);
      b.classList.toggle('is-active', k === n);
      if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    ref('status').textContent = state.mode !== 'construccion' ? 'Base completa · 5 etapas'
      : n === 0 ? 'Terreno sin preparar' : `Etapa ${pad2(n)} · ${STAGES[n - 1].short}`;
    $('[data-act="prev"]').disabled = n <= 1;
    $('[data-act="next"]').disabled = n >= 5;
  }
  function renderPlay() {
    const done = state.stage >= 5 && !state.playing;
    $('.base-play').innerHTML = state.playing ? ICON.pause : done ? ICON.replay : ICON.play;
    const label = state.playing ? 'Pausar' : done ? 'Repetir' : 'Reproducir';
    $('.base-play').setAttribute('aria-label', `${label} la construcción`);
    ref('playtxt').textContent = label;
    consoleEl.classList.toggle('is-playing', state.playing);
    ref('bar').style.transform = `scaleX(${state.playing ? Math.min(1, state.playT / STAGE_DUR[state.stage || 1]) : 0})`;
  }
  function setStage(n, animate = true) {
    state.stage = Math.max(0, Math.min(5, n));
    state.playT = 0;
    S?.setStage(state.stage, animate && !reduced);
    renderStage(); renderPlay();
  }
  function play() {
    state.playing = true;
    setStage(state.stage >= 5 ? 1 : state.stage + 1);
  }
  function pause() { state.playing = false; renderPlay(); }
  function tick(dt) {
    if (!state.playing || state.mode !== 'construccion') return;
    state.playT += dt;
    if (state.playT >= STAGE_DUR[state.stage]) {
      if (state.stage >= 5) { state.playing = false; state.playT = 0; renderPlay(); return; }
      setStage(state.stage + 1);
    } else {
      ref('bar').style.transform = `scaleX(${state.playT / STAGE_DUR[state.stage]})`;
    }
  }

  /* ---------- Explorar ---------- */
  function renderFicha() {
    const p = PARTS.find((x) => x.id === state.selected);
    const el = ref('ficha');
    if (!p) {
      el.innerHTML = `<p class="base-card__n"><b>${PARTS.length}</b> componentes</p><h3 class="base-h">Una base es un <em>sistema</em></h3>
        <p class="base-text">Tocá un punto sobre la escena o elegí un componente de la lista para ver qué es y para qué sirve.</p>`;
    } else {
      el.innerHTML = `<p class="base-card__n"><b>${pad2(PARTS.indexOf(p) + 1)}</b> · ${p.cat}</p><h3 class="base-h">${p.name}</h3>
        <dl class="base-dl"><dt>Qué es</dt><dd>${p.what}</dd><dt>Para qué sirve</dt><dd>${p.use}</dd></dl>
        ${p.fact ? `<p class="base-note">${p.fact}</p>` : ''}`;
    }
    $$('[data-part]').forEach((b) => {
      const on = b.dataset.part === state.selected;
      b.classList.toggle('is-active', on);
      if (b.closest('.base-parts')) b.setAttribute('aria-pressed', String(on));
    });
  }
  function select(id) {
    state.selected = state.selected === id ? null : id;
    renderFicha();
    S?.select(state.selected);
  }
  function hover(id) {
    $$('.base-hot').forEach((b) => b.classList.toggle('is-hover', b.dataset.part === id));
    S?.hover(id);
  }

  /* ---------- Superficie ---------- */
  function renderSize() {
    const s = SIZES[state.size];
    const side = s.area.map((a) => Math.round(Math.sqrt(a)));
    ref('area').textContent = `${nf(s.area[0])}–${nf(s.area[1])}`;
    ref('areadesc').textContent = `Para ${s.crew} astronautas: un cuadrado de entre ${side[0]} y ${side[1]} m de lado.`;
    $$('[data-size]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.size === state.size)));
    // Cuadrados a escala (lado máximo = 316 m)
    const k = 96 / Math.sqrt(100000);
    const sq = (a, cls) => { const w = Math.sqrt(a) * k; return `<rect class="${cls}" x="2" y="${98 - w}" width="${w}" height="${w}"/>`; };
    ref('scale').innerHTML = [100000, 20000, 5000, 1000].map((a) => sq(a, 'base-scale__ref')).join('')
      + `<path class="base-scale__band" fill-rule="evenodd" d="M2 98h${Math.sqrt(s.area[1]) * k}v${-Math.sqrt(s.area[1]) * k}h${-Math.sqrt(s.area[1]) * k}zM2 98h${Math.sqrt(s.area[0]) * k}v${-Math.sqrt(s.area[0]) * k}h${-Math.sqrt(s.area[0]) * k}z"/>`
      + sq(10000, 'base-scale__ex');
    sizeEls[0].innerHTML = `mín · ${nf(s.area[0])} m²`;
    sizeEls[1].innerHTML = `máx · ${nf(s.area[1])} m²`;
    S?.setSize(s.area.map(Math.sqrt));
  }
  function setZone(i) {
    state.zone = i;
    $$('[data-zone]').forEach((b) => b.classList.toggle('is-active', +b.dataset.zone === i));
    S?.setZone(i);
  }

  /* ---------- Modos ---------- */
  function setMode(mode, focusTab = false) {
    if (!document.getElementById(`base-pane-${mode}`)) return;
    state.mode = mode;
    consoleEl.dataset.mode = mode;
    $$('.base-tab').forEach((t) => {
      const on = t.dataset.mode === mode;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    $$('.base-pane').forEach((p) => { p.hidden = p.id !== `base-pane-${mode}`; });
    if (mode !== 'construccion') {
      // Fuera del modo construcción la base se muestra completa
      state.playing = false;
      if (state.stage !== 5) { state.stage = 5; S?.setStage(5, false); }
    }
    if (mode !== 'explorar') hover(null);
    ref('hint').textContent = mode === 'explorar' ? 'Tocá un punto para abrir su ficha' : mode === 'superficie' ? 'Vista en planta · cada color es una zona' : 'Arrastrá para girar la vista';
    renderStage(); renderPlay();
    S?.setMode(mode);
    if (mode === 'superficie') requestAnimationFrame(() => ref('split').classList.add('is-in'));
  }

  /* ---------- Eventos ---------- */
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t || !root.contains(t)) return;
    state.touched = true;
    if (t.dataset.mode) return setMode(t.dataset.mode);
    if (t.dataset.stage) { state.playing = false; return setStage(+t.dataset.stage); }
    if (t.dataset.act === 'play') return state.playing ? pause() : play();
    if (t.dataset.act === 'prev') { state.playing = false; return setStage(state.stage - 1); }
    if (t.dataset.act === 'next') { state.playing = false; return setStage(state.stage + 1); }
    if (t.dataset.part) return select(t.dataset.part);
    if (t.dataset.size) { state.size = t.dataset.size; return renderSize(); }
    if (t.dataset.zone) return setZone(state.zone === +t.dataset.zone ? -1 : +t.dataset.zone);
    if (t.dataset.view) return S?.view(t.dataset.view);
  });
  $('.base-tabs').addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    const tabs = $$('.base-tab');
    const i = tabs.findIndex((t) => t.dataset.mode === state.mode);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + keys[e.key] + tabs.length) % tabs.length;
    e.preventDefault(); setMode(tabs[j].dataset.mode, true);
  });
  const over = (e) => {
    const h = e.target.closest?.('.base-hot, .base-parts button');
    if (h) hover(h.dataset.part);
    const z = e.target.closest?.('.base-split [data-zone], .base-legend [data-zone]');
    if (z) S?.setZone(+z.dataset.zone);
  };
  const out = (e) => {
    if (e.target.closest?.('.base-hot, .base-parts button')) hover(null);
    if (e.target.closest?.('.base-split [data-zone], .base-legend [data-zone]')) S?.setZone(state.zone);
  };
  root.addEventListener('pointerover', over); root.addEventListener('pointerout', out);
  root.addEventListener('focusin', over); root.addEventListener('focusout', out);

  /* ---------- Estado inicial ---------- */
  renderStage(); renderPlay(); renderFicha(); renderSize();
  const pStage = params.has('baseEtapa') ? +params.get('baseEtapa') : null;
  const pMode = params.get('baseModo');
  if (reduced && pStage === null) state.stage = 5; // sin animaciones: base ya armada
  if (pStage !== null) { state.stage = Math.max(0, Math.min(5, pStage || 0)); state.touched = true; }
  renderStage(); renderPlay();

  // Reloj de respaldo para la reproducción si no hay escena 3D
  let fallbackTimer = 0;
  const startFallbackClock = () => { fallbackTimer = window.setInterval(() => tick(0.25), 250); };

  load3D().then((scene) => {
    S = scene;
    if (!S) { ref('fallback').hidden = false; consoleEl.classList.add('is-fallback'); startFallbackClock(); }
    S?.setStage(state.stage, false);
    S?.setSize(SIZES[state.size].area.map(Math.sqrt));
    renderStage();
    if (pMode) { state.touched = true; setMode(pMode); }
    if (params.get('baseSel')) { setMode('explorar'); select(params.get('baseSel')); }
    // Arranque automático la primera vez que la escena se ve bien
    if (!reduced && !state.touched) {
      const io = new IntersectionObserver((en) => {
        if (!en.some((x) => x.isIntersecting)) return;
        io.disconnect();
        if (!state.touched && state.stage === 0 && state.mode === 'construccion') play();
      }, { threshold: 0.35 });
      io.observe(stageEl);
    }
  });

  async function load3D() {
    try {
      const [THREE, { OrbitControls }] = await Promise.all([
        import('three'), import('three/addons/controls/OrbitControls.js'),
      ]);
      return createScene(THREE, OrbitControls, stageEl, {
        reduced, hotEls, zoneEls, sizeEls,
        onPick: (id) => { if (state.mode === 'explorar') { state.touched = true; if (id) select(id); } },
        onHover: (id) => { if (state.mode === 'explorar') hover(id); },
        onTick: tick,
      });
    } catch (err) {
      console.warn('[fronteras] base lunar: sin 3D, se muestra el respaldo.', err);
      return null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Escena 3D                                                           */
/* ------------------------------------------------------------------ */

function createScene(THREE, OrbitControls, host, opts) {
  const { reduced } = opts;
  const small = window.matchMedia('(max-width: 820px)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'base-canvas';
  canvas.setAttribute('aria-label', 'Escena 3D de una base lunar para cuatro astronautas');
  canvas.setAttribute('role', 'img');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('sin WebGL');
  host.prepend(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030408);
  const camera = new THREE.PerspectiveCamera(50, 1.5, 1, 9000);

  /* ---- utilidades ---- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ph = (p, a, b) => clamp((p - a) / (b - a));
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const outCubic = (t) => 1 - (1 - t) ** 3;
  const inCubic = (t) => t * t * t;
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const outBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
  const S0 = 0.0001; // escala "cero" segura
  let seed = 20261114;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1 + 5, y * 2.1 + 9) * 0.3 + vnoise(x * 4.3 + 1, y * 4.3 + 7) * 0.15;

  const tweens = new Set();
  const tween = (dur, update, { delay = 0, ease = (t) => t, done } = {}) => {
    if (reduced || dur <= 0) { update(1); done?.(); return null; }
    const t = { t: -delay, dur, update, ease, done }; tweens.add(t); return t;
  };

  const G = {
    box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
    cyl: (a, b, h, s = 10, open = false) => new THREE.CylinderGeometry(a, b, h, s, 1, open),
    sph: (r, w = 10, h = 6) => new THREE.SphereGeometry(r, w, h),
  };
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const beam = (parent, a, b, r, mat, seg = 6) => {
    const A = V(...a), B = V(...b); const len = A.distanceTo(B);
    const m = add(parent, G.cyl(r, r, len, seg), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), B.sub(A).normalize());
    return m;
  };
  const moundGeo = (s = 0) => {
    const g = new THREE.IcosahedronGeometry(1, 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + (hash(Math.round(x * 40) + s * 13.1, Math.round(y * 40) * 1.7 + Math.round(z * 40) * 3.1) - 0.5) * 0.2;
      p.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals(); return g;
  };

  /* ---- luces ---- */
  const SUN = V(-80, 48, 90).normalize();
  const sun = new THREE.DirectionalLight(0xfff6e8, 3.4);
  sun.position.copy(SUN).multiplyScalar(220);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 60, far: 420 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.12;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0x22344f, 0x1c1915, 0.55)); // luz de Tierra, muy tenue

  /* ---- terreno ---- */
  const craters = [];
  for (let i = 0; i < 46; i++) {
    const r = 3 + rnd() ** 2 * 15, x = (rnd() - 0.5) * 370, z = (rnd() - 0.5) * 370;
    if (Math.max(Math.abs(x), Math.abs(z)) < 58 + r * 1.6) continue;
    craters.push({ x, z, r, d: r * 0.2 });
  }
  craters.push({ x: -15, z: 19, r: 2.3, d: 0.4 }, { x: -33, z: 37, r: 1.8, d: 0.3 }, { x: 45, z: 1, r: 2, d: 0.35 }, { x: -44, z: 46, r: 2.6, d: 0.5 }, { x: 14, z: 44, r: 1.6, d: 0.3 });
  const hInner = (x, z) => {
    const m = Math.max(Math.abs(x), Math.abs(z));
    const flat = sstep(52, 86, m), edge = 1 - sstep(170, 198, m);
    let h = (fbm(x * 0.03 + 7, z * 0.03 + 3) - 0.5) * 7 * flat + (fbm(x * 0.2, z * 0.2) - 0.5) * 0.2;
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      if (d < 1.9) { if (d < 1) h -= c.d * (1 - d * d); h += c.d * 0.42 * Math.exp(-(((d - 1) / 0.28) ** 2)); }
    }
    return h * edge;
  };
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xa3a19d, roughness: 1, metalness: 0, flatShading: true, vertexColors: true });
  {
    const g = new THREE.PlaneGeometry(400, 400, small ? 120 : 160, small ? 120 : 160).rotateX(-Math.PI / 2);
    const p = g.attributes.position; const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, hInner(x, z));
      const c = 0.84 + (fbm(x * 0.06 + 2, z * 0.06) - 0.5) * 0.36;
      col.set([c, c * 0.985, c * 0.955], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, groundMat); m.receiveShadow = true; scene.add(m);

    const o = new THREE.PlaneGeometry(7000, 7000, 100, 100).rotateX(-Math.PI / 2);
    const q = o.attributes.position; const oc = new Float32Array(q.count * 3);
    for (let i = 0; i < q.count; i++) {
      const x = q.getX(i), z = q.getZ(i), r = Math.hypot(x, z);
      q.setY(i, -0.4 + sstep(210, 800, r) * (fbm(x * 0.0032 + 4, z * 0.0032) * 60 - 16));
      const c = 0.8 + (fbm(x * 0.004, z * 0.004 + 3) - 0.5) * 0.3; oc.set([c, c * 0.985, c * 0.955], i * 3);
    }
    o.setAttribute('color', new THREE.BufferAttribute(oc, 3)); o.computeVertexNormals();
    scene.add(new THREE.Mesh(o, groundMat));
  }

  /* ---- cielo: estrellas + Tierra ---- */
  {
    const n = small ? 700 : 1300; const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd() * Math.PI * 2, v = 0.03 + rnd() * 0.97, r = 5200, s = Math.sqrt(1 - v * v);
      pos.set([Math.cos(u) * s * r, v * r, Math.sin(u) * s * r], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6f5, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85 })));
  }
  const EARTH = V(-560, 300, -2300);
  {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#16407a'); gr.addColorStop(0.5, '#1f5c9e'); gr.addColorStop(1, '#143a70');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 256);
    const land = ['#4b7a45', '#6d8a4e', '#9a8a5a', '#b39c68', '#3f6a3c'];
    for (let i = 0; i < 34; i++) {
      x.fillStyle = land[i % land.length]; x.beginPath();
      x.ellipse(rnd() * 512, 40 + rnd() * 176, 12 + rnd() * 42, 8 + rnd() * 26, rnd() * 3, 0, 7); x.fill();
    }
    x.fillStyle = '#eef3f7'; x.fillRect(0, 0, 512, 14); x.fillRect(0, 240, 512, 16);
    for (let i = 0; i < 90; i++) {
      x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.45})`; x.beginPath();
      x.ellipse(rnd() * 512, rnd() * 256, 14 + rnd() * 50, 3 + rnd() * 9, (rnd() - 0.5) * 0.7, 0, 7); x.fill();
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const e = new THREE.Mesh(new THREE.SphereGeometry(105, 40, 24), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, emissive: 0x0b2040, emissiveIntensity: 0.35 }));
    e.position.copy(EARTH); e.rotation.set(0.4, 1.2, 0.2); scene.add(e);
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d');
    const rg = gx.createRadialGradient(64, 64, 26, 64, 64, 64);
    rg.addColorStop(0, 'rgba(120,180,255,.55)'); rg.addColorStop(0.5, 'rgba(90,150,255,.16)'); rg.addColorStop(1, 'rgba(90,150,255,0)');
    gx.fillStyle = rg; gx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.position.copy(EARTH); halo.scale.setScalar(470); halo.renderOrder = -1; scene.add(halo);
  }

  /* ---- componentes ---- */
  const comps = {}; const order = [];
  const lifeGlow = []; const blinkers = [];
  const craneMat = new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.7, flatShading: true });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, depthWrite: false });
  const darkMat = () => new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.9, flatShading: true });

  function mkComp(id, stage, x, z, dur = 2.6) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.visible = false; scene.add(g);
    const c = { id, stage, g, mats: [], p: 0, target: 0, dur, tw: null, hl: 0, hlT: 0, meshes: [], apply: (p) => { g.visible = p > 0; } };
    c.mat = (color, o = {}) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, flatShading: o.flat ?? true, ...(o.x || {}) });
      m.userData.e = new THREE.Color(o.e ?? 0x000000); m.emissive.copy(m.userData.e); c.mats.push(m); return m;
    };
    comps[id] = c; order.push(c); return c;
  }
  // Material emisivo que se enciende con el soporte vital (ventanas, luces)
  const glow = (color, k = 1.6, always = false) => {
    const m = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: color, emissiveIntensity: always ? k : 0, roughness: 0.4 });
    if (!always) lifeGlow.push([m, k]); return m;
  };
  const blink = (parent, x, y, z, color = 0xff5b1f, r = 0.28) => {
    const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: 2 });
    const s = add(parent, G.sph(r, 6, 4), m, x, y, z); s.castShadow = false;
    blinkers.push([m, rnd() * 6]); return s;
  };
  // "Grúa celeste": la nave de carga que baja cada elemento y se va
  const makeCrane = (parent) => {
    const g = new THREE.Group(); parent.add(g);
    add(g, G.cyl(2.1, 2.6, 0.9, 8), craneMat, 0, 0.45, 0);
    add(g, G.cyl(1.1, 1.3, 0.7, 6), craneMat, 0, 1.2, 0);
    g.userData.flames = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.78;
      beam(g, [Math.cos(a) * 2, 0.4, Math.sin(a) * 2], [Math.cos(a) * 3.4, 0.1, Math.sin(a) * 3.4], 0.14, craneMat, 4);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.4, 6).rotateX(Math.PI).translate(0, -1.2, 0), flameMat);
      f.position.set(Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4); g.add(f); g.userData.flames.push(f);
    }
    g.traverse((o) => { o.userData.nopick = true; o.castShadow = false; });
    return g;
  };
  const craneAt = (crane, y, p, a0 = 0.72) => {
    const away = inCubic(ph(p, a0, 1));
    crane.visible = p > 0 && p < 1;
    crane.position.y = y + away * 80;
    crane.userData.flames.forEach((f) => { f.scale.y = 0.6 + Math.random() * 0.7; });
  };
  const dropApply = (c, body, topH, H = 48) => {
    const crane = makeCrane(c.g);
    return (p) => {
      c.g.visible = p > 0;
      body.position.y = (1 - outCubic(ph(p, 0, 0.68))) * H;
      craneAt(crane, body.position.y + topH, p);
    };
  };

  // --- Etapa 1: sitio, plataforma, barrera y robots ---
  {
    const c = mkComp('sitio', 1, 0, 0, 1.6);
    const pts = [];
    const sq = [[-50, -50], [50, -50], [50, 50], [-50, 50]];
    sq.forEach((a, i) => { const b = sq[(i + 1) % 4]; pts.push(V(a[0], 0.3, a[1]), V(b[0], 0.3, b[1])); });
    for (let i = -40; i <= 40; i += 10) pts.push(V(i, 0.3, -50), V(i, 0.3, -47.6), V(i, 0.3, 50), V(i, 0.3, 47.6), V(-50, 0.3, i), V(-47.6, 0.3, i), V(50, 0.3, i), V(47.6, 0.3, i));
    const lm = new THREE.LineBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: 0.5 });
    c.g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lm));
    const pm = c.mat(0xd8d4cb);
    const posts = sq.map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); c.g.add(g); add(g, G.cyl(0.22, 0.3, 3, 6), pm, 0, 1.5, 0); blink(g, 0, 3.2, 0, 0x8fe3ff, 0.34); return g; });
    c.apply = (p) => { c.g.visible = p > 0; lm.opacity = 0.5 * p; posts.forEach((g, i) => g.scale.setScalar(Math.max(S0, outBack(ph(p, i * 0.1, 0.6 + i * 0.1))))); };
  }
  {
    const c = mkComp('pad', 1, 30, 27, 3.2);
    const body = new THREE.Group(); c.g.add(body);
    add(body, new THREE.CylinderGeometry(12, 12.5, 0.36, 28), c.mat(0x55524e, { flat: false, r: 0.95 }), 0, 0.18, 0).castShadow = false;
    const mark = c.mat(0xe6e1d6, { flat: false }); const warn = c.mat(0xff5b1f, { flat: false });
    const ring = (a, b, m) => { const r = add(body, new THREE.RingGeometry(a, b, 40), m, 0, 0.38, 0); r.rotation.x = -Math.PI / 2; r.castShadow = false; return r; };
    ring(7.6, 8.1, mark); ring(10.9, 11.3, warn); ring(0, 1.1, mark);
    [0, Math.PI / 2].forEach((a) => { const b = add(body, G.box(9, 0.04, 0.45), mark, 0, 0.39, 0); b.rotation.y = a + Math.PI / 4; b.castShadow = false; });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; blink(body, Math.cos(a) * 11.9, 0.55, Math.sin(a) * 11.9, 0xffd27a, 0.24); }
    c.apply = (p) => { c.g.visible = p > 0; const s = Math.max(S0, outCubic(ph(p, 0, 0.9))); body.scale.set(s, 1, s); };
  }
  {
    const c = mkComp('berma', 1, 30, 27, 3.4);
    const m = c.mat(0x827d74); const lumps = [];
    for (let i = 0; i < 12; i++) {
      const a = (156 + i * 13.5) * Math.PI / 180;
      const l = add(c.g, moundGeo(i), m, Math.cos(a) * 18.2, -0.2, Math.sin(a) * 18.2);
      l.userData.s = [3.6 + rnd() * 0.8, 2.3 + rnd() * 1.2, 2.2 + rnd() * 0.5]; l.rotation.y = -a + Math.PI / 2; lumps.push(l);
    }
    c.apply = (p) => { c.g.visible = p > 0; lumps.forEach((l, i) => { const k = outCubic(ph(p, i * 0.05, 0.45 + i * 0.05)); l.scale.set(l.userData.s[0], Math.max(S0, l.userData.s[1] * k), l.userData.s[2]); }); };
  }
  const robots = [];
  {
    const c = mkComp('robots', 1, 0, 0, 1.2);
    const body = c.mat(0xd3a03c), dark = darkMat(), steel = c.mat(0x9a9da3, { m: 0.3, r: 0.6 });
    [[30, -8, 13, 4.5, 0.2], [-26, 9, 10, 3.4, -0.26]].forEach(([cx, cz, rx, rz, w], i) => {
      const g = new THREE.Group(); c.g.add(g);
      add(g, G.box(1.7, 0.75, 2.5), body, 0, 0.95, 0);
      add(g, G.box(1.1, 0.5, 0.9), steel, 0, 1.55, -0.5);
      add(g, G.box(2.5, 0.85, 0.18), steel, 0, 0.55, 1.65);
      beam(g, [0.6, 0.9, 1.2], [0.6, 0.6, 1.6], 0.07, steel, 4); beam(g, [-0.6, 0.9, 1.2], [-0.6, 0.6, 1.6], 0.07, steel, 4);
      [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].forEach(([sx, sz]) => add(g, G.cyl(0.5, 0.5, 0.4, 8).rotateZ(Math.PI / 2), dark, sx * 0.95, 0.5, sz));
      beam(g, [0, 1.8, -0.6], [0, 2.9, -0.6], 0.05, steel, 4); blink(g, 0, 3, -0.6, 0xffd27a, 0.16);
      robots.push({ g, cx, cz, rx, rz, w, a: i * 2.2 });
    });
    c.apply = (p) => { c.g.visible = p > 0; robots.forEach((r, i) => r.g.scale.setScalar(Math.max(S0, outBack(ph(p, i * 0.3, 0.7 + i * 0.3))))); };
  }

  // --- Etapa 2: energía ---
  {
    const c = mkComp('solar', 2, 0, 0, 4.6);
    const cell = c.mat(0x284a80, { r: 0.32, m: 0.25, e: 0x06122a }); const frame = c.mat(0xcfd2d6, { r: 0.6, m: 0.3 });
    const ry = Math.atan2(SUN.x, SUN.z); const arrays = [];
    [-42, -32, -22, -12].forEach((x, ix) => [-43, -34, -25, -16].forEach((z, iz) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; c.g.add(g);
      const post = new THREE.Group(); g.add(post);
      add(post, G.cyl(0.18, 0.26, 2.9, 6), frame, 0, 1.45, 0); add(post, G.box(1.2, 0.2, 1.2), frame, 0, 0.1, 0);
      const tilt = new THREE.Group(); tilt.position.y = 2.95; tilt.rotation.x = 0.96; g.add(tilt);
      add(tilt, G.box(0.3, 0.2, 3.9), frame, 0, -0.12, 0);
      const wings = [-1, 1].map((s) => { const w = new THREE.Group(); tilt.add(w); add(w, G.box(3.5, 0.1, 3.8), cell, s * 1.85, 0, 0); add(w, G.box(3.5, 0.06, 0.08), frame, s * 1.85, 0.06, 0); return w; });
      arrays.push({ post, wings, d: (ix * 4 + iz) * 0.032 });
    }));
    c.apply = (p) => {
      c.g.visible = p > 0;
      arrays.forEach((a) => {
        const q = ph(p, a.d, a.d + 0.5);
        a.post.scale.y = Math.max(S0, outCubic(ph(q, 0, 0.45)));
        const w = Math.max(S0, outBack(ph(q, 0.38, 1)));
        a.wings.forEach((g) => { g.scale.x = w; g.visible = q > 0.38; });
      });
    };
  }
  {
    const c = mkComp('baterias', 2, -3, -27, 3);
    const body = new THREE.Group(); c.g.add(body);
    const sh = c.mat(0xdedad0), st = c.mat(0xff5b1f), fin = c.mat(0x9a9da3, { m: 0.3, r: 0.6 }), cable = darkMat();
    [-10.5, -3.5, 3.5, 10.5].forEach((z) => {
      add(body, G.box(2.7, 2.7, 5.6), sh, 0, 1.55, z); add(body, G.box(2.74, 0.35, 5.64), st, 0, 2.2, z);
      add(body, G.box(2.9, 0.2, 5.8), fin, 0, 0.1, z);
      [-1.6, 0, 1.6].forEach((dz) => add(body, G.box(2.2, 0.5, 0.12), fin, 0, 3.15, z + dz));
      add(body, G.box(0.06, 0.3, 0.3), glow(0x8fe3ff, 2.2, true), 1.38, 1.3, z + 2).castShadow = false;
    });
    add(body, G.box(0.3, 0.14, 26), cable, 1.8, 0.07, 0);
    add(body, G.box(14.5, 0.14, 0.3), cable, 9, 0.07, -4);
    c.apply = dropApply(c, body, 3.5);
  }

  // --- Etapa 3: módulos ---
  const capsule = (parent, len, r, mat) => {
    const g = new THREE.Group(); parent.add(g);
    add(g, G.cyl(r, r, len, 12).rotateZ(Math.PI / 2), mat);
    [-1, 1].forEach((s) => { add(g, G.sph(r, 12, 6), mat, s * len / 2, 0, 0).scale.x = 0.4; });
    return g;
  };
  const porthole = (g, x, y, r = 0.7) => { const w = add(g, new THREE.CircleGeometry(r, 10), glow(0xffd9a0, 1.8), x, y, 0); w.rotation.y = Math.sign(x) * Math.PI / 2; w.castShadow = false; return w; };
  {
    const c = mkComp('hab', 3, 28, -31, 5.4);
    const skin = c.mat(0xe9e5db, { r: 0.7 }), reg = c.mat(0x857f76), trim = c.mat(0xff5b1f);
    const node = new THREE.Group(); c.g.add(node);
    add(node, G.cyl(2.7, 3, 3.6, 10), skin, 0, 1.8, 0);
    add(node, G.sph(2.7, 10, 5), skin, 0, 3.6, 0).scale.y = 0.42;
    add(node, G.cyl(2.74, 2.74, 0.25, 10), trim, 0, 3.2, 0);
    add(node, G.cyl(0.7, 0.7, 0.3, 8), glow(0xffd9a0, 1.4), 0, 4.75, 0);
    const mods = [[9.5, 0, 0], [0, -9.5, Math.PI / 2]].map(([x, z, ry], i) => {
      const w = new THREE.Group(); w.position.set(x, 0, z); w.rotation.y = ry; c.g.add(w);
      const cap = capsule(w, 11, 2.6, skin); cap.position.y = 2.6;
      porthole(cap, 5.5 + 1.06, 0.2); add(cap, G.cyl(2.64, 2.64, 0.3, 12).rotateZ(Math.PI / 2), trim, 4.6, 0, 0);
      const mound = add(w, moundGeo(i + 20), reg, -0.4, -0.3, 0); mound.userData.s = [5.4, 6.3, 5.5];
      return { cap, mound, crane: makeCrane(w) };
    });
    const nodeCrane = makeCrane(c.g);
    c.apply = (p) => {
      c.g.visible = p > 0;
      node.position.y = (1 - outCubic(ph(p, 0, 0.26))) * 48; craneAt(nodeCrane, node.position.y + 4.9, Math.min(1, p / 0.42), 0.64);
      mods.forEach((m, i) => {
        const o = 0.12 + i * 0.1;
        const q = ph(p, o, o + 0.28); m.cap.visible = q > 0;
        m.cap.position.y = 2.6 + (1 - outCubic(q)) * 48;
        const inf = outBack(ph(p, o + 0.28, o + 0.52)); // se infla
        m.cap.scale.set(0.5 + 0.5 * inf, 0.3 + 0.7 * inf, 0.3 + 0.7 * inf);
        craneAt(m.crane, m.cap.position.y + 2, ph(p, o, o + 0.5), 0.6);
        const r = outCubic(ph(p, o + 0.5, o + 0.78)); // lo cubren con regolito
        m.mound.visible = r > 0; m.mound.scale.set(m.mound.userData.s[0] * (0.75 + 0.25 * r), Math.max(S0, m.mound.userData.s[1] * r), m.mound.userData.s[2] * (0.75 + 0.25 * r));
      });
    };
  }
  {
    const c = mkComp('lab', 3, 18.5, -31, 3);
    const body = new THREE.Group(); c.g.add(body);
    const metal = c.mat(0xb9bdc3, { m: 0.35, r: 0.5 }), rib = c.mat(0x8c9097, { m: 0.4, r: 0.5 }), trim = c.mat(0x8fe3ff, { r: 0.5 });
    add(body, G.cyl(2.5, 2.5, 10, 12).rotateZ(Math.PI / 2), metal, 0, 3.1, 0);
    add(body, G.sph(2.5, 12, 6), metal, -5, 3.1, 0).scale.x = 0.35;
    [-3.6, -1.2, 1.2, 3.6].forEach((x) => add(body, G.cyl(2.62, 2.62, 0.28, 12).rotateZ(Math.PI / 2), rib, x, 3.1, 0));
    add(body, G.cyl(2.56, 2.56, 0.5, 12).rotateZ(Math.PI / 2), trim, -4.6, 3.1, 0);
    [-3, 3].forEach((x) => { add(body, G.box(0.6, 1.2, 5.6), rib, x, 0.6, 0); });
    porthole(body, -5.9, 3.3, 0.8);
    add(body, G.box(2.2, 0.7, 1.6), rib, -1.5, 5.85, 0);
    beam(body, [-1.5, 6.2, 0], [-1.5, 8.6, 0], 0.07, rib, 4); add(body, G.box(0.9, 0.5, 0.1), trim, -1.5, 8.5, 0);
    const dish = add(body, new THREE.SphereGeometry(0.9, 8, 3, 0, Math.PI * 2, 0, 0.9), metal, 2, 6.6, 0); dish.rotation.x = Math.PI; dish.position.y = 7; dish.material.side = THREE.DoubleSide;
    beam(body, [2, 5.6, 0], [2, 6.2, 0], 0.08, rib, 4);
    c.apply = dropApply(c, body, 6.2);
  }
  {
    const c = mkComp('esclusa', 3, 28, -24.6, 2.8);
    const body = new THREE.Group(); c.g.add(body);
    const sh = c.mat(0xdcd8ce), trim = c.mat(0xff5b1f), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 });
    add(body, G.box(3.4, 3.1, 4.2), sh, 0, 1.95, 0);
    add(body, G.cyl(1.2, 1.2, 2.2, 8).rotateX(Math.PI / 2), sh, 0, 1.9, -3);
    add(body, G.cyl(1.25, 1.25, 0.22, 10).rotateX(Math.PI / 2), trim, 0, 1.9, 2.12);
    add(body, G.cyl(0.98, 0.98, 0.26, 10).rotateX(Math.PI / 2), darkMat(), 0, 1.9, 2.13);
    add(body, G.box(3.6, 0.2, 2.2), steel, 0, 0.5, 3.2);
    const ramp = add(body, G.box(2.2, 0.14, 2.4), steel, 0, 0.26, 5.3); ramp.rotation.x = 0.2;
    [-1.7, 1.7].forEach((x) => { beam(body, [x, 0.6, 2.3], [x, 1.7, 2.3], 0.05, steel, 4); beam(body, [x, 0.6, 4.2], [x, 1.7, 4.2], 0.05, steel, 4); beam(body, [x, 1.7, 2.3], [x, 1.7, 4.2], 0.05, steel, 4); });
    add(body, G.box(0.7, 0.2, 0.3), glow(0xffd9a0, 2), 0, 3.3, 2.15).castShadow = false;
    c.apply = dropApply(c, body, 3.6);
  }
  {
    const c = mkComp('antena', 3, 15, -41, 2.8);
    const steel = c.mat(0xa9adb3, { m: 0.35, r: 0.5 }), white = c.mat(0xeeeae0, { r: 0.6, flat: true, x: { side: THREE.DoubleSide } });
    add(c.g, G.box(2.2, 0.6, 2.2), steel, 0, 0.3, 0);
    const mast = new THREE.Group(); c.g.add(mast);
    add(mast, G.cyl(0.16, 0.28, 9, 6), steel, 0, 4.8, 0);
    [[1.4, 0, 1.4], [-1.4, 0, 1.4], [0, 0, -1.8]].forEach((b) => beam(mast, [0, 5, 0], [b[0], 0.5, b[2]], 0.05, steel, 4));
    const dir = EARTH.clone().sub(V(15, 9.5, -41)).normalize();
    const dish = new THREE.Group(); dish.position.set(0, 9.6, 0); c.g.add(dish);
    const bowl = new THREE.Group(); bowl.quaternion.setFromUnitVectors(V(0, -1, 0), dir); dish.add(bowl);
    add(bowl, new THREE.SphereGeometry(4.2, 12, 3, 0, Math.PI * 2, 0, 0.62), white, 0, -3.5, 0);
    beam(bowl, [0, 0.6, 0], [0, -1.6, 0], 0.07, steel, 4); add(bowl, G.cyl(0.25, 0.15, 0.4, 6), steel, 0, -1.7, 0);
    blink(c.g, 0, 9.5, 0, 0xff5b1f, 0.2);
    c.apply = (p) => { c.g.visible = p > 0; mast.scale.y = Math.max(S0, outCubic(ph(p, 0.05, 0.6))); dish.position.y = 9.6 * mast.scale.y; dish.scale.setScalar(Math.max(S0, outBack(ph(p, 0.5, 1)))); };
  }
  {
    const c = mkComp('taller', 3, 6, 14, 3);
    const body = new THREE.Group(); c.g.add(body);
    const sh = c.mat(0xcfcbc1, { x: { side: THREE.DoubleSide } }), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 }), trim = c.mat(0xff5b1f);
    add(body, G.box(8.6, 0.24, 8.6), steel, 0, 0.12, 0);
    add(body, new THREE.CylinderGeometry(4.1, 4.1, 8, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), sh, 0, 0.2, 0);
    const back = add(body, new THREE.CircleGeometry(4.1, 10, 0, Math.PI), sh, 4, 0.2, 0); back.rotation.y = Math.PI / 2;
    [-3.9, 0, 3.9].forEach((x) => { const r = add(body, new THREE.TorusGeometry(4.14, 0.1, 4, 10, Math.PI), steel, x, 0.2, 0); r.rotation.y = Math.PI / 2; });
    add(body, G.box(1.1, 1, 5), steel, 2.6, 0.75, 0); add(body, G.box(0.9, 0.5, 0.7), trim, 2.6, 1.5, 1.4);
    add(body, G.cyl(0.7, 0.7, 0.45, 8), darkMat(), 0.8, 0.5, -2.6);
    add(body, G.box(3.4, 0.14, 0.14), glow(0xffd9a0, 2), 0, 4, 0).castShadow = false;
    beam(body, [-4.6, 0.2, 3.6], [-4.6, 3.6, 3.6], 0.12, steel, 5); beam(body, [-4.6, 3.6, 3.6], [-6.8, 3, 3.6], 0.09, steel, 5); beam(body, [-6.8, 3, 3.6], [-6.8, 1.8, 3.6], 0.03, steel, 4);
    c.apply = dropApply(c, body, 4.4);
  }

  // --- Etapa 4: soporte vital ---
  {
    const c = mkComp('eclss', 4, 38.5, -41, 3.4);
    const body = new THREE.Group(); c.g.add(body);
    const sh = c.mat(0xe2ded4), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 }), trim = c.mat(0x8fe3ff, { r: 0.5 }), rad = c.mat(0xf2efe8, { r: 0.5, e: 0x15130f });
    add(body, G.box(4.6, 3, 4), sh, 0, 1.8, 0); add(body, G.box(4.64, 0.3, 4.04), trim, 0, 2.7, 0);
    add(body, G.box(5, 0.3, 4.4), steel, 0, 0.15, 0);
    [-1.2, 0, 1.2].forEach((x) => add(body, G.cyl(0.5, 0.5, 1.3, 8), steel, x, 3.9, -0.8));
    beam(body, [1.4, 3.3, 1], [1.4, 4.6, 1], 0.14, steel, 6);
    beam(body, [-0.8, 0.5, 2], [-0.8, 0.5, 5.6], 0.16, steel, 6); beam(body, [0.2, 0.5, 2], [0.2, 0.5, 5.6], 0.16, trim, 6);
    const rads = [3.9, 5.7].map((x) => { const g = new THREE.Group(); g.position.set(x, 0.3, 0); body.add(g); add(g, G.box(0.14, 4.2, 5.2), rad, 0, 2.5, 0); add(g, G.box(0.3, 0.4, 5.4), steel, 0, 0.2, 0); return g; });
    const base = dropApply(c, body, 4.6);
    c.apply = (p) => { base(Math.min(1, p / 0.72)); rads.forEach((g, i) => { g.scale.y = Math.max(S0, outBack(ph(p, 0.6 + i * 0.1, 0.9 + i * 0.1))); }); };
  }
  {
    const c = mkComp('tanques', 4, 38.5, -23.5, 3.2);
    const white = c.mat(0xe9e5db, { flat: false, r: 0.55 }), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 }), water = c.mat(0x8fe3ff, { r: 0.5 }), oxy = c.mat(0xbfe6ff, { r: 0.5 });
    add(c.g, G.box(13.6, 0.24, 4.6), steel, 0, 0.12, 0);
    const tanks = [-4.6, -1.5].map((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); c.g.add(g); add(g, G.sph(1.45, 12, 8), white, 0, 2.2, 0); add(g, G.cyl(1.47, 1.47, 0.4, 12), water, 0, 2.2, 0); add(g, G.cyl(0.9, 1.1, 0.9, 8, true), steel, 0, 0.65, 0); return g; });
    [1.6, 4.5].forEach((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); c.g.add(g); add(g, G.cyl(1.05, 1.05, 2.6, 12), white, 0, 2.3, 0); add(g, G.sph(1.05, 12, 6), white, 0, 3.6, 0); add(g, G.sph(1.05, 12, 6), white, 0, 1, 0); add(g, G.cyl(1.07, 1.07, 0.4, 12), oxy, 0, 3, 0); add(g, G.cyl(0.8, 1, 0.5, 8, true), steel, 0, 0.25, 0); tanks.push(g); });
    const pipes = new THREE.Group(); c.g.add(pipes);
    beam(pipes, [-5.6, 0.45, 1.7], [5.4, 0.45, 1.7], 0.13, steel, 6); beam(pipes, [0, 0.45, 1.7], [0, 0.45, -3.4], 0.13, steel, 6);
    c.apply = (p) => { c.g.visible = p > 0; tanks.forEach((g, i) => g.scale.setScalar(Math.max(S0, outBack(ph(p, 0.1 + i * 0.14, 0.5 + i * 0.14))))); pipes.scale.setScalar(Math.max(S0, outCubic(ph(p, 0.6, 1)))); };
  }
  {
    const c = mkComp('invernadero', 4, 16, -23.5, 4);
    const steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 });
    const film = c.mat(0xd9f2e4, { flat: false, r: 0.25, e: 0x0c2414, x: { transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false } });
    const soil = c.mat(0x3a332c);
    const leaf = new THREE.MeshStandardMaterial({ color: 0x4f9a4a, roughness: 0.8, flatShading: true, emissive: 0x2c7a30, emissiveIntensity: 0 }); lifeGlow.push([leaf, 0.75]);
    add(c.g, G.box(9.6, 0.3, 5.8), steel, 0, 0.15, 0);
    const shell = new THREE.Group(); shell.position.y = 0.3; c.g.add(shell);
    add(shell, new THREE.CylinderGeometry(2.7, 2.7, 9, 14, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), film).castShadow = false;
    [-4.5, 4.5].forEach((x) => { const e = add(shell, new THREE.CircleGeometry(2.7, 12, 0, Math.PI), film, x, 0, 0); e.rotation.y = Math.PI / 2; e.castShadow = false; });
    [-4.5, -1.5, 1.5, 4.5].forEach((x) => { const r = add(shell, new THREE.TorusGeometry(2.72, 0.09, 4, 12, Math.PI), steel, x, 0, 0); r.rotation.y = Math.PI / 2; });
    add(shell, G.box(8.4, 0.08, 0.2), glow(0xffe2b0, 2.4), 0, 2.45, 0).castShadow = false;
    const beds = [-1.5, 0, 1.5].map((z) => { const g = new THREE.Group(); g.position.set(0, 0.3, z); c.g.add(g); add(g, G.box(8, 0.45, 0.85), soil, 0, 0.22, 0); for (let i = 0; i < 8; i++) add(g, G.box(0.7, 0.5 + rnd() * 0.6, 0.6), leaf, -3.5 + i, 0.75, 0).castShadow = false; return g; });
    add(c.g, G.cyl(0.9, 0.9, 2.6, 8).rotateX(Math.PI / 2), c.mat(0xe2ded4), 0, 1.3, -3.9);
    const crane = makeCrane(c.g);
    c.apply = (p) => {
      c.g.visible = p > 0;
      const d = outCubic(ph(p, 0, 0.3)); c.g.position.y = (1 - d) * 48; craneAt(crane, 2.4, Math.min(1, p / 0.5), 0.62);
      const inf = outBack(ph(p, 0.3, 0.62)); shell.scale.set(1, Math.max(S0, 0.12 + 0.88 * inf), 0.5 + 0.5 * inf);
      beds.forEach((b, i) => { b.scale.y = Math.max(S0, outBack(ph(p, 0.6 + i * 0.08, 0.86 + i * 0.07))); });
    };
  }
  {
    const c = mkComp('isru', 4, -27, 24, 3.4);
    const body = new THREE.Group(); c.g.add(body);
    const steel = c.mat(0x9a9da3, { m: 0.4, r: 0.5 }), sh = c.mat(0xdcd8ce), trim = c.mat(0xff5b1f), reg = c.mat(0x7d776e);
    add(c.g, G.box(14, 0.22, 8.4), c.mat(0x6b6964), 1.5, 0.11, 0);
    [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]].forEach(([x, z], i, a) => { const n = a[(i + 1) % 4]; beam(body, [x - 3, 0.2, z], [x * 0.5 - 3, 8.4, z * 0.5], 0.1, steel, 4); beam(body, [x * 0.8 - 3, 3.4, z * 0.8], [n[0] * 0.8 - 3, 3.4, n[1] * 0.8], 0.06, steel, 4); beam(body, [x * 0.62 - 3, 6.2, z * 0.62], [n[0] * 0.62 - 3, 6.2, n[1] * 0.62], 0.06, steel, 4); });
    add(body, G.box(1.6, 0.6, 1.6), trim, -3, 8.6, 0); add(body, G.cyl(0.22, 0.22, 8, 6), darkMat(), -3, 4.2, 0);
    add(body, G.cyl(1.6, 1.6, 3.8, 10), sh, 3, 2.1, 0); add(body, G.cyl(1.64, 1.64, 0.5, 10), glow(0xff5b1f, 1.6), 3, 1.3, 0);
    add(body, G.cyl(1.7, 0.5, 1.7, 8), steel, 3, 5.2, 0);
    add(body, G.sph(1.15, 10, 6), sh, 6.6, 1.5, -1.6); add(body, G.sph(1.15, 10, 6), sh, 6.6, 1.5, 1.6);
    beam(body, [3, 1, 0], [6.6, 1, 0], 0.12, steel, 6); beam(body, [6.6, 1, -1.6], [6.6, 1, 1.6], 0.12, steel, 6);
    const belt = beam(body, [-0.6, 1, 2.8], [2.7, 6, 0.5], 0.2, steel, 4); belt.scale.set(2.4, 1, 0.5);
    add(body, moundGeo(40), reg, -1.2, -0.2, 3.2).scale.set(2.4, 1.5, 2.2);
    c.apply = dropApply(c, body, 9.2);
  }

  // --- Etapa 5: tripulación ---
  let landerFlame;
  {
    const c = mkComp('lander', 5, 30, 27, 6);
    const body = new THREE.Group(); c.g.add(body);
    const gold = c.mat(0xb48d42, { m: 0.35, r: 0.55 }), white = c.mat(0xebe7dd, { r: 0.6 }), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 });
    add(body, G.cyl(3.2, 3.7, 2.2, 8), gold, 0, 3.3, 0);
    add(body, G.cyl(0.6, 1.4, 1.5, 10, true), darkMat(), 0, 1.6, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a), sz = Math.sin(a);
      beam(body, [cx * 3, 3.6, sz * 3], [cx * 5.6, 0.5, sz * 5.6], 0.14, steel, 5); beam(body, [cx * 3.2, 2.4, sz * 3.2], [cx * 5.6, 0.5, sz * 5.6], 0.09, steel, 4);
      add(body, G.cyl(0.75, 0.75, 0.16, 8), steel, cx * 5.6, 0.44, sz * 5.6);
    }
    add(body, G.cyl(2.3, 2.7, 3.2, 10), white, 0, 6, 0); add(body, G.sph(2.3, 10, 5), white, 0, 7.6, 0).scale.y = 0.5;
    add(body, G.cyl(2.74, 2.74, 0.3, 10), c.mat(0xff5b1f), 0, 4.75, 0);
    [-0.9, 0.9].forEach((x) => { const w = add(body, G.box(0.9, 0.8, 0.1), glow(0xffd9a0, 1.8, true), x, 6.5, 2.45); w.castShadow = false; });
    beam(body, [0.4, 4.4, 2.9], [0.4, 0.5, 4.6], 0.05, steel, 4); beam(body, [-0.4, 4.4, 2.9], [-0.4, 0.5, 4.6], 0.05, steel, 4);
    add(body, G.cyl(0.7, 0.7, 0.5, 8), steel, 0, 8.9, 0);
    landerFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 9, 8).rotateX(Math.PI).translate(0, -4.5, 0), flameMat); landerFlame.position.y = 1.2; landerFlame.userData.nopick = true; body.add(landerFlame);
    c.apply = (p) => { c.g.visible = p > 0; const d = ph(p, 0, 0.86); body.position.y = (1 - outCubic(d)) * 150 + 0.36; landerFlame.visible = p > 0 && d < 1; landerFlame.scale.set(1, (0.5 + (1 - d) * 0.8) * (0.8 + Math.random() * 0.4), 1); };
  }
  const crew = [];
  {
    const c = mkComp('astronautas', 5, 0, 0, 2);
    const suit = c.mat(0xf1eee6, { r: 0.6 }), packM = c.mat(0xb9bdc3), visor = new THREE.MeshStandardMaterial({ color: 0xc79a3a, roughness: 0.25, metalness: 0.6, emissive: 0x3a2a08 });
    [[29.3, -18.2, 0.3], [26.4, -17, -0.5], [21, -12, -2], [0.5, 9.5, 1.2]].forEach(([x, z, ry], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; c.g.add(g);
      add(g, G.cyl(0.42, 0.36, 1, 8), suit, 0, 1.25, 0); add(g, G.box(0.3, 0.8, 0.34), suit, -0.2, 0.4, 0); add(g, G.box(0.3, 0.8, 0.34), suit, 0.2, 0.4, 0);
      add(g, G.box(0.22, 0.8, 0.24), suit, -0.56, 1.25, 0); add(g, G.box(0.22, 0.8, 0.24), suit, 0.56, 1.25, 0);
      add(g, G.box(0.7, 0.95, 0.36), packM, 0, 1.4, -0.42); add(g, G.sph(0.4, 8, 6), suit, 0, 2.1, 0); add(g, G.sph(0.3, 8, 6), visor, 0, 2.1, 0.17);
      crew.push(g);
    });
    c.apply = (p) => { c.g.visible = p > 0; crew.forEach((g, i) => g.scale.setScalar(Math.max(S0, outBack(ph(p, i * 0.18, 0.5 + i * 0.16))))); };
  }
  let rover; const wheels = [];
  const roverPath = new THREE.CatmullRomCurve3([[2, 1], [-20, -1], [-42, 2], [-46, 22], [-38, 42], [-14, 43], [-5, 30], [-5, 12]].map(([x, z]) => V(x, 0, z)), true, 'catmullrom', 0.5);
  const roverLen = roverPath.getLength(); let roverU = 0;
  {
    const c = mkComp('rover', 5, 0, 0, 1.4);
    rover = new THREE.Group(); c.g.add(rover);
    const white = c.mat(0xe9e5db, { r: 0.6 }), steel = c.mat(0x8c9097, { m: 0.4, r: 0.5 }), dark = darkMat(), trim = c.mat(0xff5b1f);
    add(rover, G.box(2.5, 0.5, 5.2), steel, 0, 1.15, 0);
    add(rover, G.box(2.6, 2, 3.7), white, 0, 2.4, -0.45); add(rover, G.box(2.64, 0.26, 3.74), trim, 0, 1.75, -0.45);
    const win = add(rover, G.box(2.2, 1.1, 0.2), new THREE.MeshStandardMaterial({ color: 0xc79a3a, roughness: 0.25, metalness: 0.5, emissive: 0x3a2a08 }), 0, 2.65, 1.5); win.rotation.x = -0.35;
    add(rover, G.box(2.4, 0.9, 1), white, 0, 1.85, 1.85);
    [-1, 1].forEach((s) => [-1.9, 0, 1.9].forEach((z) => wheels.push(add(rover, G.cyl(0.8, 0.8, 0.6, 9).rotateZ(Math.PI / 2), dark, s * 1.55, 0.8, z))));
    [-0.8, 0.8].forEach((x) => { add(rover, G.box(0.36, 0.22, 0.1), glow(0xfff1cf, 3, true), x, 1.6, 2.38).castShadow = false; });
    beam(rover, [0.9, 3.4, -1.8], [0.9, 5.2, -1.8], 0.04, steel, 4);
    const p0 = roverPath.getPointAt(0), t0 = roverPath.getTangentAt(0); rover.position.copy(p0); rover.rotation.y = Math.atan2(t0.x, t0.z);
    c.apply = (p) => { c.g.visible = p > 0; rover.scale.setScalar(Math.max(S0, outBack(ph(p, 0, 1)))); };
  }

  // Registrar mallas para picking
  const COMP2HOT = {};
  Object.entries(HOT3D).forEach(([id, h]) => h.t.forEach((k) => { COMP2HOT[k] = id; }));
  order.forEach((c) => { c.g.traverse((o) => { if (o.isMesh && !o.userData.nopick && COMP2HOT[c.id]) { o.userData.hot = COMP2HOT[c.id]; c.meshes.push(o); } }); c.apply(0); });

  /* ---- zonas (superficie) y cuadrados de tamaño ---- */
  const zoneGroup = new THREE.Group(); zoneGroup.visible = false; scene.add(zoneGroup);
  const zoneMats = ZONES.map((z, i) => {
    const [x, y, w, d] = z.rect;
    const m = new THREE.MeshBasicMaterial({ color: z.hex, transparent: true, opacity: 0, depthWrite: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), m); pl.position.set(x + w / 2, 0.5, y + d / 2); pl.renderOrder = i === 3 ? 5 : 6; zoneGroup.add(pl);
    const lm = new THREE.LineBasicMaterial({ color: z.hex, transparent: true, opacity: 0, depthTest: false });
    const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(x, 0.6, y), V(x + w, 0.6, y), V(x + w, 0.6, y + d), V(x, 0.6, y + d)]), lm); ln.renderOrder = 7; zoneGroup.add(ln);
    return { m, lm, base: i === 3 ? 0.07 : 0.3 };
  });
  const sqGeo = new THREE.BufferGeometry().setFromPoints([V(-0.5, 0, -0.5), V(0.5, 0, -0.5), V(0.5, 0, 0.5), V(-0.5, 0, 0.5)]);
  const sizeSq = [0x8fe3ff, 0xffd27a].map((col) => { const l = new THREE.LineLoop(sqGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, depthTest: false })); l.position.y = 0.8; l.renderOrder = 8; zoneGroup.add(l); return l; });
  let sizeSides = [70.7, 141.4]; let zoneK = 0; let zoneSel = -1;

  /* ---- anillo de selección ---- */
  const selRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff5b1f, transparent: true, opacity: 0.9, depthTest: false }));
  selRing.visible = false; selRing.renderOrder = 9; selRing.position.y = 0.5; scene.add(selRing);

  /* ---- cámara y controles ---- */
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.55, minPolarAngle: 0.12, maxPolarAngle: 1.46, minDistance: 40, maxDistance: 900 });
  canvas.style.touchAction = 'pan-y'; // en celular: deslizar vertical = scroll de la página
  let mode = 'construccion', viewKind = '', selected = null, hovered = null, lifeOn = 0, lifeT = 0, flying = null;
  const fit = () => clamp(1.08 / camera.aspect, 1, 1.7);
  const viewFor = (kind) => {
    const f = fit();
    if (kind === 'superficie') { const D = Math.max(118, Math.max(sizeSides[1], 100) * 1.12) * clamp(1.15 / camera.aspect, 1, 2.2); return { tgt: V(0, 0, 0), pos: V(0, D, D * 0.5) }; }
    if (kind === 'soporte') return { tgt: V(31, 3, -31), pos: V(31 + 30 * f, 3 + 24 * f, -31 + 44 * f) };
    return { tgt: V(3, f > 1.1 ? 12 : 5, -5), pos: V(3 + 53 * f, 5 + 25 * f, -5 + 80 * f) };
  };
  const flyTo = ({ pos, tgt }, dur = 1.5) => {
    if (flying) tweens.delete(flying);
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    controls.enabled = false;
    flying = tween(dur, (k) => { camera.position.lerpVectors(p0, pos, k); controls.target.lerpVectors(t0, tgt, k); }, { ease: inOut, done: () => { controls.enabled = true; flying = null; } });
    if (!flying) controls.enabled = true;
  };
  const kindOf = (m) => (m === 'superficie' || m === 'soporte' ? m : 'general');
  { const v = viewFor('general'); camera.position.copy(v.pos); controls.target.copy(v.tgt); viewKind = 'general'; }

  /* ---- etiquetas HTML proyectadas ---- */
  const tmp = V(0, 0, 0); let W = 1, H = 1;
  const place = (el, x, y, z, show) => {
    tmp.set(x, y, z).project(camera);
    const ok = show && tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
    el.style.visibility = ok ? 'visible' : 'hidden';
    if (ok) el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * H).toFixed(1)}px)`;
  };
  const placeLabels = () => {
    const ex = mode === 'explorar', su = mode === 'superficie';
    Object.entries(opts.hotEls).forEach(([id, el]) => { const a = HOT3D[id].a; place(el, a[0], a[1], a[2], ex); });
    const zc = [[28, 1, -33.5], [-23, 1, -28], [23, 1, 28], [-25, 1, 10]];
    opts.zoneEls.forEach((el, i) => place(el, zc[i][0], zc[i][1], zc[i][2], su && zoneK > 0.5));
    opts.sizeEls.forEach((el, i) => place(el, -sizeSides[i] / 2, 0.8, sizeSides[i] / 2, su && zoneK > 0.5));
  };

  /* ---- picking ---- */
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let pointerDirty = false, down = null;
  const pickAt = () => {
    const list = []; order.forEach((c) => { if (c.p > 0) list.push(...c.meshes); });
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(list, false)[0];
    return hit ? hit.object.userData.hot : null;
  };
  const setNdc = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  canvas.addEventListener('pointermove', (e) => { if (mode !== 'explorar' || e.pointerType === 'touch') return; setNdc(e); pointerDirty = true; });
  canvas.addEventListener('pointerleave', () => { if (hovered) { hovered = null; opts.onHover(null); canvas.style.cursor = ''; } });
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; host.classList.add('is-used'); });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || mode !== 'explorar') return;
    if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { setNdc(e); opts.onPick(pickAt()); }
    down = null;
  });

  /* ---- bucle ---- */
  const HL = [1, 0.36, 0.12];
  let time = 0;
  function update(dt) {
    time += dt;
    for (const t of tweens) {
      t.t += dt; if (t.t < 0) continue;
      const k = Math.min(1, t.t / t.dur); t.update(t.ease(k));
      if (k >= 1) { tweens.delete(t); t.done?.(); }
    }
    opts.onTick(dt);
    // luces de soporte vital
    lifeOn += (lifeT - lifeOn) * Math.min(1, dt * 1.6);
    lifeGlow.forEach(([m, k]) => { m.emissiveIntensity = k * lifeOn; });
    blinkers.forEach(([m, o]) => { m.emissiveIntensity = reduced ? 1.6 : (Math.sin(time * 3 + o) > 0.55 ? 2.6 : 0.25); });
    if (!reduced) {
      robots.forEach((r) => { r.a += dt * r.w; r.g.position.set(r.cx + Math.cos(r.a) * r.rx, 0, r.cz + Math.sin(r.a) * r.rz); r.g.rotation.y = Math.atan2(-Math.sin(r.a) * r.rx * Math.sign(r.w), Math.cos(r.a) * r.rz * Math.sign(r.w)); });
      if (comps.rover.p >= 1) {
        roverU = (((roverU + (dt * 4.2) / roverLen) % 1) + 1) % 1;
        const p = roverPath.getPointAt(roverU), t = roverPath.getTangentAt(roverU);
        rover.position.copy(p); rover.rotation.y = Math.atan2(t.x, t.z);
        wheels.forEach((w) => { w.rotation.x += dt * 5; });
      }
      crew.forEach((g, i) => { if (comps.astronautas.p >= 1) g.position.y = Math.abs(Math.sin(time * 1.4 + i * 1.7)) * 0.22; });
    } else {
      robots.forEach((r) => r.g.position.set(r.cx + r.rx, 0, r.cz));
    }
    HOT3D.rover.a[0] = rover.position.x; HOT3D.rover.a[2] = rover.position.z;
    HOT3D.rover.ring[0] = rover.position.x; HOT3D.rover.ring[1] = rover.position.z;
    HOT3D.pad.a[1] = comps.lander.p >= 1 ? 13 : 4;
    // resaltado
    order.forEach((c) => {
      const hot = COMP2HOT[c.id];
      c.hlT = mode === 'explorar' && hot ? (hot === hovered ? 1 : hot === selected ? 0.6 : 0) : 0;
      if (Math.abs(c.hlT - c.hl) < 0.004) return;
      c.hl += (c.hlT - c.hl) * Math.min(1, dt * 10);
      const k = c.hl * 0.34;
      c.mats.forEach((m) => m.emissive.setRGB(m.userData.e.r + HL[0] * k, m.userData.e.g + HL[1] * k, m.userData.e.b + HL[2] * k));
    });
    if (selRing.visible && selected) {
      const r = HOT3D[selected].ring; const s = r[2] * (1 + (reduced ? 0 : Math.sin(time * 2.4) * 0.025));
      selRing.position.set(r[0], 0.5, r[1]); selRing.scale.set(s, 1, s);
    }
    // zonas
    const zt = mode === 'superficie' ? 1 : 0;
    zoneK += (zt - zoneK) * Math.min(1, dt * 3.5); if (reduced) zoneK = zt;
    zoneGroup.visible = zoneK > 0.01;
    if (zoneGroup.visible) {
      zoneMats.forEach((z, i) => { const k = zoneSel < 0 ? 1 : zoneSel === i ? 1.8 : 0.35; z.m.opacity = z.base * k * zoneK; z.lm.opacity = Math.min(1, 0.85 * k) * zoneK; });
      sizeSq.forEach((l, i) => { l.material.opacity = 0.9 * zoneK; const s = l.scale.x + (sizeSides[i] - l.scale.x) * Math.min(1, dt * 5); l.scale.set(reduced ? sizeSides[i] : s, 1, reduced ? sizeSides[i] : s); });
    }
    if (pointerDirty) {
      pointerDirty = false; const id = pickAt();
      if (id !== hovered) { hovered = id; opts.onHover(id); canvas.style.cursor = id ? 'pointer' : ''; }
    }
    controls.update();
  }
  let running = false, raf = 0, last = 0, visible = false;
  const frame = (t) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((t - last) / 1000, 0, 0.1); last = t;
    update(dt); renderer.render(scene, camera); placeLabels();
  };
  const sync = () => {
    const on = visible && !document.hidden;
    if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
  };
  new IntersectionObserver((en) => { visible = en[en.length - 1].isIntersecting; sync(); }, { rootMargin: '80px' }).observe(host);
  document.addEventListener('visibilitychange', sync);

  const resize = () => {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    const before = camera.aspect; camera.aspect = W / H; camera.updateProjectionMatrix();
    if (Math.abs(before - camera.aspect) > 0.25 && !host.classList.contains('is-used')) { const v = viewFor(viewKind); camera.position.copy(v.pos); controls.target.copy(v.tgt); }
    if (!running) { renderer.render(scene, camera); placeLabels(); }
  };
  new ResizeObserver(resize).observe(host); resize();

  /* ---- API ---- */
  return {
    setStage(n, animate) {
      let i = 0;
      order.forEach((c) => {
        const on = c.stage <= n;
        if (on && c.target !== 1) {
          c.target = 1; if (c.tw) tweens.delete(c.tw);
          if (animate && c.stage === n) {
            c.p = 0.0001; c.apply(c.p);
            c.tw = tween(c.dur, (k) => { c.p = Math.max(0.0001, k); c.apply(c.p); }, { delay: 0.25 + i++ * 0.55 });
          } else { c.p = 1; c.apply(1); }
        } else if (!on && c.target !== 0) {
          c.target = 0; if (c.tw) tweens.delete(c.tw); c.tw = null; c.p = 0; c.apply(0);
        }
      });
      lifeT = n >= 4 ? 1 : 0; if (!animate) lifeOn = lifeT;
      if (!running) { renderer.render(scene, camera); placeLabels(); }
    },
    setMode(m) {
      mode = m; hovered = null; canvas.style.cursor = '';
      selRing.visible = m === 'explorar' && !!selected;
      const k = kindOf(m);
      if (k !== viewKind) { viewKind = k; flyTo(viewFor(k)); }
    },
    select(id) {
      selected = id; selRing.visible = mode === 'explorar' && !!id;
      if (!id) { viewKind = 'general'; return flyTo(viewFor('general'), 1.2); }
      const r = HOT3D[id].ring; const tgt = V(r[0], 2.5, r[1]);
      const dir = camera.position.clone().sub(controls.target); dir.y = Math.max(dir.y, dir.length() * 0.42); dir.normalize();
      const dist = clamp(r[2] * 5.5, 72, 130) * fit();
      viewKind = 'foco'; flyTo({ tgt, pos: tgt.clone().addScaledVector(dir, dist) }, 1.2);
    },
    hover(id) { hovered = id; },
    setSize(sides) { sizeSides = sides; if (mode === 'superficie') flyTo(viewFor('superficie'), 1.2); },
    setZone(i) { zoneSel = i; },
    view(a) {
      if (a === 'reset') { host.classList.remove('is-used'); viewKind = kindOf(mode); return flyTo(viewFor(viewKind), 1.1); }
      const off = camera.position.clone().sub(controls.target); const d = clamp(off.length() * (a === 'in' ? 0.78 : 1.28), 40, 900);
      flyTo({ tgt: controls.target.clone(), pos: controls.target.clone().addScaledVector(off.normalize(), d) }, 0.5);
    },
  };
}
