// Línea de tiempo compartida entre el render (navegador) y el audio (Node).
import { CRATERS } from '../js/data/craters.js';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const BPM = 120;
export const MUSIC_T0 = 4; // la música arranca en el despegue

export const SCENES = [
  { id: 'cuenta', d: 4, code: '00 / DESPEGUE' },
  { id: 'titulo', d: 4, code: '00 / INICIO' },
  { id: 'pregunta', d: 6, code: '01 / DESAFÍO' },
  { id: 'luna', d: 6.5, code: '01 / DESAFÍO' },
  { id: 'globo', d: 9, code: '02 / ATLAS' },
  { id: 'webAtlas', d: 2.5, code: '02 / ATLAS', web: true },
  { id: 'duelos', d: 12, code: '03 / GEMELOS' },
  { id: 'webGemelos', d: 2.5, code: '03 / GEMELOS', web: true },
  { id: 'top5', d: 10, code: '05 / TOP 5' },
  { id: 'base', d: 6.5, code: '07 / BASE LUNAR' },
  { id: 'webBase', d: 2.5, code: '07 / BASE LUNAR', web: true },
  { id: 'misiones', d: 5, code: '06 / MISIONES' },
  { id: 'equipo', d: 4, code: '10 / EQUIPO' },
  { id: 'cierre', d: 5, code: 'FIN / ALUNIZAJE' },
];
{
  let acc = 0;
  for (const s of SCENES) { s.t0 = acc; acc += s.d; s.t1 = acc; }
}
export const DURATION = SCENES[SCENES.length - 1].t1;
export const S = Object.fromEntries(SCENES.map((s) => [s.id, s]));

// --- Globo: orden de aparición por región ---
export const REGION_ORDER = ['polo-norte', 'asia', 'oceania', 'polo-sur', 'africa', 'america'];
export const GLOBO = { start: 0.5, per: 1.25, spread: 0.8 };
// Momento (relativo a la escena) en que aparece cada cráter
export const CRATER_TIMES = (() => {
  const out = [];
  REGION_ORDER.forEach((r, ri) => {
    const list = CRATERS.filter((c) => c.region === r);
    list.forEach((c, i) => out.push({ c, region: r, ri, t: GLOBO.start + ri * GLOBO.per + 0.25 + (i / Math.max(1, list.length)) * GLOBO.spread }));
  });
  return out;
})();

export const DUEL_D = 3;
export const TOP_D = 1.8;
export const TOP_TRAVEL = 0.75;
export const BASE_POPS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
export const LUNA_ROWS = [0.5, 2.5, 4.5];
export const MISION_POPS = [0.25, 0.5, 0.75, 1.0, 1.25];

// Eventos de sonido
export function cues() {
  const c = [];
  const add = (t, type, p = {}) => c.push({ t, type, ...p });
  // cuenta regresiva
  add(0, 'beep'); add(1, 'beep'); add(2, 'beep'); add(3, 'beepLong');
  [0.3, 0.9, 2.1, 2.7].forEach((t) => add(t, 'blip', { f: 1500 }));
  add(1.5, 'boing'); add(2.9, 'riser', { d: 1.1 });
  SCENES.forEach((s, i) => { if (i > 1) add(s.t0 - 0.18, 'whoosh'); });
  // pregunta
  for (let i = 0; i < 16; i++) add(S.pregunta.t0 + 0.3 + i * 0.12, 'tick');
  add(S.pregunta.t0 + 3, 'boing', { big: true });
  add(S.pregunta.t0 + 4.5, 'blip', { f: 1800 });
  // luna
  LUNA_ROWS.forEach((t, i) => add(S.luna.t0 + t, 'blip', { f: 1200 + i * 300 }));
  add(S.luna.t0 + 1.0, 'boing', { soft: true });
  // globo
  CRATER_TIMES.forEach((k, i) => add(S.globo.t0 + k.t, 'tick', { f: 900 + i * 22 }));
  add(S.globo.t0 + GLOBO.start + 6 * GLOBO.per, 'chime');
  // duelos
  for (let i = 0; i < 4; i++) {
    const t = S.duelos.t0 + i * DUEL_D;
    add(t + 0.02, 'whoosh'); add(t + 0.36, 'slam'); add(t + 2.0, 'stamp');
  }
  add(S.duelos.t0 + 3 * DUEL_D + 1.0, 'boing', { soft: true });
  // top 5
  for (let i = 0; i < 5; i++) {
    const t = S.top5.t0 + i * TOP_D;
    add(t + TOP_TRAVEL, 'ping', { f: 880 * Math.pow(2, i / 6) });
  }
  add(S.top5.t0 + 5 * TOP_D + 0.1, 'boing', { soft: true });
  // base
  add(S.base.t0, 'descent', { d: 1.2 }); add(S.base.t0 + 1.25, 'thud');
  BASE_POPS.forEach((t, i) => add(S.base.t0 + t, 'pop', { f: 420 * Math.pow(2, i / 6) }));
  add(S.base.t0 + 4.5, 'skid'); add(S.base.t0 + 5.25, 'boing', { big: true });
  // misiones
  MISION_POPS.forEach((t, i) => add(S.misiones.t0 + t, 'pop', { f: 500 * Math.pow(2, i / 5) }));
  // equipo
  for (let i = 0; i < 6; i++) add(S.equipo.t0 + 0.5 + i * 0.25, 'blip', { f: 1300 + i * 120 });
  // cierre
  add(S.cierre.t0 + 0.1, 'descent', { d: 1.1 }); add(S.cierre.t0 + 1.25, 'thud');
  add(S.cierre.t0 + 1.5, 'chime');
  return c.sort((a, b) => a.t - b.t);
}
