// Datos del atlas. ESQUEMA (no cambiar nombres de campos; lo consumen worlds.js y sections.js):
//
// CRATERS (Tierra): {
//   id: 'wolfe-creek',            // slug único
//   name: 'Wolfe Creek',
//   place: 'Australia Occidental', // ubicación legible
//   region: 'polo-norte' | 'polo-sur' | 'asia' | 'america' | 'africa' | 'oceania',
//   lat: -19.17, lon: 127.80,     // grados decimales (S y O negativos)
//   diameterKm: 0.88,             // número (si es rango, el valor medio) o null
//   age: '~300.000 años',         // texto
//   origin: 'impacto' | 'volcanico' | 'incierto',
//   summary: '…',                 // 1–2 oraciones del PDF
//   twinId: 'moltke' | null,      // id en LUNAR_FEATURES
//   recommended: false,           // true para los 5 recomendados
//   nasaUse: '…' | null,          // pruebas/uso documentado si el PDF lo menciona
// }
//
// LUNAR_FEATURES (Luna): { id, name, lat, lon, diameterKm, kind: 'crater'|'mar'|'cuenca'|'polo', note }
// EUROPA_FEATURES (Europa, luna de Júpiter): { id, name, lat, lon, diameterKm, kind: 'crater'|'cuenca'|'caos'|'llanura', analog, note }
//   (longitudes O del PDF → negativas)

export const REGIONS = {
  'polo-norte': 'Polo Norte',
  'polo-sur': 'Polo Sur',
  asia: 'Asia',
  america: 'América',
  africa: 'África',
  oceania: 'Oceanía',
};

export const CRATERS = [
  { id: 'wolfe-creek', name: 'Wolfe Creek', place: 'Australia Occidental', region: 'oceania', lat: -19.17, lon: 127.80, diameterKm: 0.88, age: '~300.000 años', origin: 'impacto', summary: 'Circular, con borde elevado y fondo plano. De los cráteres terrestres mejor conservados.', twinId: 'moltke', recommended: true, nasaUse: 'Pruebas de inclinación y tracción de rovers en pendientes pronunciadas.' },
  { id: 'kalkkop', name: 'Kalkkop', place: 'Eastern Cape, Sudáfrica', region: 'africa', lat: -32.71, lon: 24.43, diameterKm: 1.2, age: '~250.000 años', origin: 'impacto', summary: 'Cráter simple muy erosionado, relleno por un paleolago. El único de la lista no usado por agencias espaciales.', twinId: 'linne', recommended: false, nasaUse: null },
];

export const LUNAR_FEATURES = [
  { id: 'moltke', name: 'Moltke', lat: -0.6, lon: 24.2, diameterKm: 6.5, kind: 'crater', note: 'Cráter simple en forma de cuenco, cerca del sitio del Apollo 11.' },
  { id: 'linne', name: 'Linné', lat: 27.7, lon: 11.8, diameterKm: 2.2, kind: 'crater', note: 'Cráter simple y joven en Mare Serenitatis.' },
];

export const EUROPA_FEATURES = [
  { id: 'pwyll', name: 'Cráter Pwyll', lat: -25.2, lon: -271.4, diameterKm: 26, kind: 'crater', analog: 'Cráteres lunares', note: 'Pulverizó el material alrededor creando un regolito de hielo brillante.' },
];
