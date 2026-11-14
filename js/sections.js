// Contenido: interacciones livianas (termómetro lunar y acordeón).
// Todo funciona sin JS salvo el termómetro; el acordeón arranca con el primer panel abierto.

const HOT = 120;
const COLD = -246;

function lerp(a, b, t) { return a + (b - a) * t; }

// Color del termómetro: del amarillo solar (día) al celeste telemetría (noche).
function thermoColor(t) {
  const sun = [255, 210, 122];
  const tel = [143, 227, 255];
  return `rgb(${sun.map((c, i) => Math.round(lerp(c, tel[i], t))).join(',')})`;
}

function phaseLabel(t) {
  if (t < 0.12) return 'Pleno día lunar';
  if (t < 0.4) return 'Atardecer lunar';
  if (t < 0.6) return 'Entre el día y la noche';
  if (t < 0.88) return 'Cae la noche';
  return 'Pleno noche lunar';
}

function initThermo(root) {
  const range = root.querySelector('[data-thermo-range]');
  const value = root.querySelector('[data-thermo-value]');
  const phase = root.querySelector('[data-thermo-phase]');
  const fill = root.querySelector('[data-thermo-fill]');
  const bulb = root.querySelector('[data-thermo-bulb]');
  if (!range || !value) return;

  const update = () => {
    const t = Number(range.value) / 100;
    const temp = Math.round(lerp(HOT, COLD, t));
    const color = thermoColor(t);
    root.style.setProperty('--t', t.toFixed(3));
    value.textContent = String(temp).replace('-', '−');
    if (phase) phase.textContent = phaseLabel(t);
    if (fill) fill.style.backgroundColor = color;
    if (bulb) bulb.style.backgroundColor = color;
    const read = root.querySelector('.sec-thermo__read');
    if (read) read.style.color = color;
    range.setAttribute('aria-valuetext', `${temp < 0 ? 'menos ' + Math.abs(temp) : temp} grados Celsius, ${phaseLabel(t).toLowerCase()}`);
  };
  range.addEventListener('input', update);
  update();
}

function initAccordion(root) {
  const buttons = [...root.querySelectorAll('.sec-acc__btn')];
  const set = (btn, open) => {
    btn.setAttribute('aria-expanded', String(open));
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.hidden = !open;
  };
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => set(btn, btn.getAttribute('aria-expanded') !== 'true'));
    // Flechas arriba/abajo, Inicio y Fin para moverse entre cabeceras (patrón WAI-ARIA).
    btn.addEventListener('keydown', (e) => {
      const map = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      buttons[(map[e.key] + buttons.length) % buttons.length].focus();
    });
  });
}

export function init(doc = document) {
  const root = doc || document;
  root.querySelectorAll('[data-thermo]').forEach(initThermo);
  root.querySelectorAll('[data-acc]').forEach(initAccordion);
  window.dispatchEvent(new Event('fronteras:content-ready'));
}
