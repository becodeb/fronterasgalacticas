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
  // ---------- POLO NORTE (tabla del PDF) ----------
  { id: 'avak', name: 'Avak', place: 'Alaska, EE. UU.', region: 'polo-norte', lat: 71.24, lon: -156.50, diameterKm: 12, age: '~100 millones de años', origin: 'impacto', summary: 'Estructura situada en Alaska, catalogada como estructura de impacto. Hoy está cubierta por materiales geológicos posteriores.', twinId: null, recommended: false, nasaUse: null },
  { id: 'beyenchime-salaatin', name: 'Beyenchime-Salaatin', place: 'Siberia, Rusia', region: 'polo-norte', lat: 71.06, lon: 121.69, diameterKm: 8, age: 'Entre 1,8 y 66 millones de años', origin: 'impacto', summary: 'Estructura de Siberia asociada a un antiguo impacto. Su fecha de formación no se conoce con precisión.', twinId: null, recommended: false, nasaUse: null },
  { id: 'chukcha', name: 'Chukcha', place: 'Siberia, Rusia', region: 'polo-norte', lat: 75.70, lon: 97.80, diameterKm: 6, age: 'Menos de 70 millones de años', origin: 'impacto', summary: 'Pequeña estructura de impacto ubicada en Siberia, con una antigüedad estimada inferior a 70 millones de años.', twinId: null, recommended: false, nasaUse: null },
  { id: 'elgygytgyn', name: "El'gygytgyn", place: 'Chukotka, Rusia', region: 'polo-norte', lat: 67.50, lon: 172.08, diameterKm: 18, age: '~3,58 millones de años', origin: 'impacto', summary: 'Cráter de Siberia formado hace aproximadamente 3,58 millones de años. Actualmente contiene un lago que ocupa parte de su depresión.', twinId: null, recommended: false, nasaUse: null },
  { id: 'haughton', name: 'Haughton', place: 'Isla Devon, Canadá', region: 'polo-norte', lat: 75.38, lon: -89.65, diameterKm: 24, age: '~31 millones de años', origin: 'impacto', summary: 'Cráter de la isla Devon, formado hace aproximadamente 31 millones de años. Es especialmente conocido por su paisaje semejante al de Marte.', twinId: 'polo-sur-lunar', recommended: false, nasaUse: 'Sitio de pruebas análogas del programa Artemis (isla Devon, Canadá), análogo del Polo Sur lunar.' },
  { id: 'hiawatha', name: 'Hiawatha', place: 'Groenlandia', region: 'polo-norte', lat: 78.72, lon: -66.30, diameterKm: 31, age: '~58 millones de años', origin: 'impacto', summary: 'Estructura localizada debajo de un glaciar de Groenlandia. Se formó hace aproximadamente 58 millones de años por un impacto de asteroide.', twinId: null, recommended: false, nasaUse: null },
  { id: 'kara', name: 'Kara', place: 'Rusia', region: 'polo-norte', lat: 69.10, lon: 64.20, diameterKm: 65, age: '~70 millones de años', origin: 'impacto', summary: 'Cráter situado en Rusia, originado hace aproximadamente 70 millones de años por un gran impacto extraterrestre.', twinId: null, recommended: false, nasaUse: null },
  { id: 'mjolnir', name: 'Mjølnir', place: 'Mar de Barents, Noruega', region: 'polo-norte', lat: 73.49, lon: 29.02, diameterKm: 40, age: '~143 millones de años', origin: 'impacto', summary: 'Cráter submarino del mar de Barents, enterrado bajo sedimentos marinos. Se formó hace aproximadamente 143 millones de años.', twinId: null, recommended: false, nasaUse: null },
  { id: 'popigai', name: 'Popigai', place: 'Siberia, Rusia', region: 'polo-norte', lat: 71.65, lon: 111.18, diameterKm: 100, age: '~35,7 millones de años', origin: 'impacto', summary: 'Gigantesco cráter de Siberia formado por el impacto de un cuerpo extraterrestre hace aproximadamente 35,7 millones de años.', twinId: null, recommended: false, nasaUse: null },
  { id: 'tunnunik', name: 'Tunnunik', place: 'Canadá', region: 'polo-norte', lat: 72.48, lon: -113.97, diameterKm: 25, age: 'Menos de 350 millones de años', origin: 'impacto', summary: 'Cráter ubicado en Canadá, formado por un impacto extraterrestre hace millones de años. Actualmente presenta una importante erosión.', twinId: null, recommended: false, nasaUse: null },
  { id: 'ust-kara', name: 'Ust-Kara', place: 'Rusia', region: 'polo-norte', lat: 69.30, lon: 65.30, diameterKm: 25, age: '~73 millones de años', origin: 'impacto', summary: 'Estructura rusa relacionada con el área del impacto Kara. Se investiga si corresponde al mismo evento o a una estructura diferenciada.', twinId: null, recommended: false, nasaUse: null },

  // ---------- POLO SUR (el PDF no da coordenadas: valores aproximados de catálogos de posibles impactos) ----------
  { id: 'ross', name: 'Ross', place: 'Mar de Ross, Antártida', region: 'polo-sur', lat: -77.50, lon: 178.50, diameterKm: 550, age: 'Entre 34 y 23 millones de años (Oligoceno)', origin: 'incierto', summary: 'Enorme estructura propuesta en la región del mar de Ross. No hay pruebas suficientes para confirmar que sea un cráter meteorítico.', twinId: null, recommended: false, nasaUse: null },
  { id: 'wilkes-land', name: 'Wilkes Land', place: 'Antártida Oriental', region: 'polo-sur', lat: -70.00, lon: 120.00, diameterKm: 485, age: 'No determinada con certeza', origin: 'incierto', summary: 'Gran anomalía geológica bajo el hielo de la Antártida Oriental. Se investiga si fue causada por un meteorito o por procesos geológicos internos.', twinId: null, recommended: false, nasaUse: null },
  { id: 'bowers', name: 'Bowers', place: 'Antártida', region: 'polo-sur', lat: -71.20, lon: 176.00, diameterKm: 100, age: 'Desconocida', origin: 'incierto', summary: 'Estructura antártica propuesta como posible cráter de impacto. Su formación y antigüedad todavía no se conocen con certeza.', twinId: null, recommended: false, nasaUse: null },

  // ---------- ASIA ----------
  // corregido: en el PDF los encabezados de las dos tablas de Asia están mezclados; la tabla de Gobi (44°07'N 109°39'E, 1,3 km) es Tabun-Khara-Obo y su análogo lunar es Linné
  { id: 'tabun-khara-obo', name: 'Tabun-Khara-Obo', place: 'Provincia de Dornogovi, Desierto de Gobi, Mongolia', region: 'asia', lat: 44.12, lon: 109.65, diameterKm: 1.3, age: 'Post-Cretácico (entre 150 y 65 millones de años)', origin: 'impacto', summary: 'Cráter de 1,3 km con cresta de 20 a 30 m y ~200 m de profundidad, en un suelo desértico hiperárido con brechas de impacto y cuarzo chocado. Su análogo lunar es Linné.', twinId: 'linne', recommended: false, nasaUse: 'Pruebas de tracción, ascenso y descenso de rovers en pendientes empinadas, calibración de cámaras, LiDAR y espectrómetros, y ensayos de recolección de rocas en EVAs.' },
  // corregido: la tabla de Hapcheon (35°33'N 128°16'E, ~7 km) es Jeokjung–Chogye y su análogo lunar es Mersenius C (borde de Mare Humorum)
  { id: 'jeokjung-chogye', name: 'Jeokjung–Chogye', place: 'Condado de Hapcheon, Gyeongsang del Sur, Corea del Sur', region: 'asia', lat: 35.55, lon: 128.27, diameterKm: 7, age: '~63.000 a 520.000 años (Pleistoceno tardío)', origin: 'impacto', summary: 'Primer hallazgo de un cráter de impacto en la península coreana: ~7 km, con conos de choque, brechas polimícticas y cuarzo con deformación planar. Su análogo lunar es Mersenius C.', twinId: 'mersenius-c', recommended: false, nasaUse: 'Entrenamiento de astronautas en identificación de shatter cones, travesías a escala real con vehículos tripulados y ensayos de perforación y tomografía geofísica.' },

  // ---------- AMÉRICA ----------
  { id: 'chicxulub', name: 'Chicxulub', place: 'Península de Yucatán, México', region: 'america', lat: 21.40, lon: -89.52, diameterKm: 150, age: '~66 millones de años', origin: 'impacto', summary: 'Gran cráter de unos 150 km. En la Luna su gemelo es la cuenca de Korolev (437 km de diámetro y 5,43 km de profundidad).', twinId: 'korolev', recommended: false, nasaUse: null },
  { id: 'bajada-del-diablo', name: 'Bajada del Diablo', place: 'Chubut, Patagonia, Argentina', region: 'america', lat: -42.75, lon: -67.50, diameterKm: 0.25, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Campo de 189 cráteres de entre 100 y 400 m de diámetro en un área de 27 x 15 km. Su terreno se parece a varias zonas de la Luna, en especial Mare Imbrium.', twinId: 'mare-imbrium', recommended: true, nasaUse: null },
  { id: 'campo-del-cielo', name: 'Campo del Cielo', place: 'Chaco y Santiago del Estero, Argentina', region: 'america', lat: -27.63, lon: -61.70, diameterKm: null, age: '~4.500 años', origin: 'impacto', summary: 'Campo de cráteres que abarca unos 20.000 km². Es similar a los campos de cráteres de la Luna.', twinId: null, recommended: false, nasaUse: null },
  { id: 'rio-cuarto', name: 'Cráteres de Río Cuarto', place: 'Córdoba, Argentina', region: 'america', lat: -32.88, lon: -64.23, diameterKm: null, age: 'Holoceno (miles de años)', origin: 'impacto', summary: 'Campo de cráteres alargados en un área de unos 50 km. Su cráter lunar gemelo es Messier.', twinId: 'messier', recommended: false, nasaUse: null },
  { id: 'araguainha', name: 'Domo de Araguainha', place: 'Goiás / Mato Grosso, Brasil', region: 'america', lat: -16.78, lon: -52.98, diameterKm: 40, age: '~254 millones de años', origin: 'impacto', summary: 'Estructura de impacto de 40 km con un domo central. Su gemelo lunar es el cráter Eratóstenes.', twinId: 'eratostenes', recommended: false, nasaUse: null },
  { id: 'la-payunia', name: 'Campos de lava de La Payunia', place: 'Mendoza, Argentina', region: 'america', lat: -36.40, lon: -69.20, diameterKm: null, age: 'Cuaternario', origin: 'volcanico', summary: 'Campo volcánico de unos 4.500 km² con extensas coladas basálticas. Los mares de la Luna son similares a este ambiente; solo admite pruebas no invasivas por ser área protegida.', twinId: 'mare-tranquillitatis', recommended: true, nasaUse: null },

  // ---------- ÁFRICA: impactos confirmados ----------
  { id: 'agoudal', name: 'Agoudal', place: 'Alto Atlas, Marruecos', region: 'africa', lat: 31.99, lon: -5.50, diameterKm: null, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Sitio muy erosionado; se reconoce sobre todo por conos de fractura producidos por impacto.', twinId: null, recommended: false, nasaUse: null },
  { id: 'amguid', name: 'Amguid', place: 'Sahara, Argelia', region: 'africa', lat: 26.08, lon: 4.40, diameterKm: 0.45, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Cráter circular pequeño y bien preservado, de unos 450 m.', twinId: null, recommended: false, nasaUse: null },
  { id: 'aorounga', name: 'Aorounga', place: 'Chad', region: 'africa', lat: 19.10, lon: 19.25, diameterKm: 12.6, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Estructura erosionada de unos 12,6 km; parte de un grupo de anillos en el Sahara.', twinId: null, recommended: false, nasaUse: null },
  { id: 'aouelloul', name: 'Aouelloul', place: 'Mauritania', region: 'africa', lat: 20.25, lon: -12.67, diameterKm: 0.39, age: '~3 millones de años', origin: 'impacto', summary: 'Cráter de 390 m y unos 3 millones de años que produjo vidrio de impacto.', twinId: null, recommended: false, nasaUse: null },
  { id: 'bp', name: 'BP', place: 'Desierto de Libia', region: 'africa', lat: 25.32, lon: 24.31, diameterKm: 2, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Estructura enterrada o erosionada, de unos 2 km; su nombre procede de la exploración petrolera.', twinId: null, recommended: false, nasaUse: null },
  { id: 'bosumtwi', name: 'Bosumtwi', place: 'Ghana', region: 'africa', lat: 6.50, lon: -1.40, diameterKm: 10.5, age: '~1,07 millones de años', origin: 'impacto', summary: 'Cráter de 10,5 km ocupado por el lago Bosumtwi.', twinId: null, recommended: false, nasaUse: null },
  { id: 'gweni-fada', name: 'Gweni-Fada', place: 'Chad', region: 'africa', lat: 17.42, lon: 21.75, diameterKm: 14, age: 'Paleozoica (probable)', origin: 'impacto', summary: 'Gran estructura muy erosionada, de unos 14 km y edad paleozoica probable.', twinId: null, recommended: false, nasaUse: null },
  { id: 'kalkkop', name: 'Kalkkop', place: 'Eastern Cape, Sudáfrica', region: 'africa', lat: -32.71, lon: 24.43, diameterKm: 1.2, age: '~250.000 años', origin: 'impacto', summary: 'Cráter simple muy erosionado, relleno por un paleolago. El único de la lista no usado por agencias espaciales.', twinId: 'linne', recommended: false, nasaUse: null },
  { id: 'kamil', name: 'Kamil', place: 'Egipto', region: 'africa', lat: 22.02, lon: 26.09, diameterKm: 0.045, age: 'Muy reciente', origin: 'impacto', summary: 'Cráter muy reciente y nítido, de 45 m, asociado a fragmentos de meteorito de hierro.', twinId: null, recommended: false, nasaUse: null },
  { id: 'kgagodi', name: 'Kgagodi', place: 'Botsuana', region: 'africa', lat: -22.97, lon: 27.58, diameterKm: 3.5, age: 'Antigua', origin: 'impacto', summary: 'Estructura de unos 3,5 km, muy erosionada y antigua.', twinId: null, recommended: false, nasaUse: null },
  { id: 'luizi', name: 'Luizi', place: 'R. D. del Congo', region: 'africa', lat: -10.18, lon: 28.00, diameterKm: 17, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Estructura de 17 km reconocida por evidencias minerales de choque.', twinId: null, recommended: false, nasaUse: null },
  { id: 'morokweng', name: 'Morokweng', place: 'Sudáfrica', region: 'africa', lat: -26.46, lon: 23.53, diameterKm: 70, age: '~145 millones de años', origin: 'impacto', summary: 'Gran estructura enterrada de ~70 km que conserva restos del impactador.', twinId: null, recommended: false, nasaUse: null },
  // coordenadas de Nadir aproximadas (meseta de Guinea; el PDF no las da)
  { id: 'nadir', name: 'Nadir', place: 'Margen atlántico de Guinea', region: 'africa', lat: 8.15, lon: -17.50, diameterKm: 9.2, age: '~66 millones de años', origin: 'impacto', summary: 'Cráter submarino de ~9,2 km descubierto mediante datos sísmicos.', twinId: null, recommended: false, nasaUse: null },
  { id: 'oasis', name: 'Oasis', place: 'Desierto de Libia', region: 'africa', lat: 24.58, lon: 24.40, diameterKm: 18, age: 'Antigua', origin: 'impacto', summary: 'Estructura de unos 18 km, antigua y muy erosionada.', twinId: null, recommended: false, nasaUse: null },
  { id: 'ouarkziz', name: 'Ouarkziz', place: 'Argelia', region: 'africa', lat: 29.00, lon: -7.55, diameterKm: 3.5, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Estructura circular de ~3,5 km en el Sahara occidental argelino.', twinId: null, recommended: false, nasaUse: null },
  { id: 'roter-kamm', name: 'Roter Kamm', place: 'Namibia', region: 'africa', lat: -27.77, lon: 16.30, diameterKm: 2.5, age: '~3,7 millones de años', origin: 'impacto', summary: 'Cráter de 2,5 km, rojizo y parcialmente cubierto por dunas.', twinId: null, recommended: false, nasaUse: null },
  { id: 'talemzane', name: 'Talemzane', place: 'Argelia', region: 'africa', lat: 33.32, lon: 4.03, diameterKm: 1.75, age: 'Menos de 3 millones de años', origin: 'impacto', summary: 'Depresión circular de 1,75 km, de menos de 3 millones de años.', twinId: null, recommended: false, nasaUse: null },
  { id: 'tenoumer', name: 'Tenoumer', place: 'Mauritania', region: 'africa', lat: 22.92, lon: -10.40, diameterKm: 1.9, age: '~1,57 millones de años', origin: 'impacto', summary: 'Cráter de 1,9 km; antes se discutía si era volcánico.', twinId: null, recommended: false, nasaUse: null },
  { id: 'tin-bider', name: 'Tin Bider', place: 'Argelia', region: 'africa', lat: 27.60, lon: 5.12, diameterKm: 6, age: 'No indicada en el PDF', origin: 'impacto', summary: 'Estructura de 6 km, muy erosionada; se identifica por deformación de rocas.', twinId: null, recommended: false, nasaUse: null },
  { id: 'vredefort', name: 'Vredefort', place: 'Sudáfrica', region: 'africa', lat: -27.00, lon: 27.50, diameterKm: 300, age: '~2.023 millones de años', origin: 'impacto', summary: 'La mayor estructura de impacto conocida en la Tierra: originalmente ~300 km.', twinId: null, recommended: false, nasaUse: null },

  // ---------- ÁFRICA: volcánicos ----------
  { id: 'ngorongoro', name: 'Ngorongoro', place: 'Tanzania', region: 'africa', lat: -3.17, lon: 35.58, diameterKm: 22, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'En realidad es una enorme caldera de colapso, no un cráter simple; tiene unos 22 km de ancho y paredes de unos 610 m.', twinId: null, recommended: false, nasaUse: null },
  { id: 'empakaai', name: 'Empakaai', place: 'Tanzania', region: 'africa', lat: -2.91, lon: 35.94, diameterKm: null, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Caldera volcánica con un lago alcalino en el fondo, en las tierras altas de Ngorongoro.', twinId: null, recommended: false, nasaUse: null },
  { id: 'olmoti', name: 'Olmoti', place: 'Tanzania', region: 'africa', lat: -3.03, lon: 35.65, diameterKm: null, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Caldera erosionada del mismo complejo volcánico de Ngorongoro.', twinId: null, recommended: false, nasaUse: null },
  { id: 'ol-doinyo-lengai', name: 'Ol Doinyo Lengai', place: 'Tanzania', region: 'africa', lat: -2.76, lon: 35.91, diameterKm: null, age: 'Volcán activo', origin: 'volcanico', summary: 'Volcán activo con cráter de cumbre; único por sus lavas de carbonatita, inusualmente ricas en carbonatos.', twinId: null, recommended: false, nasaUse: null },
  { id: 'erta-ale', name: 'Erta Ale', place: 'Depresión de Danakil, Etiopía', region: 'africa', lat: 13.60, lon: 40.67, diameterKm: null, age: 'Volcán activo', origin: 'volcanico', summary: 'Volcán escudo basáltico con caldera y cráteres de pozo; famoso por sus lagos de lava.', twinId: null, recommended: false, nasaUse: null },
  { id: 'dendi', name: 'Dendi / lago Enyo', place: 'Etiopía', region: 'africa', lat: 9.20, lon: 38.00, diameterKm: null, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Complejo de caldera doble ocupado por un lago; originado por colapso volcánico.', twinId: null, recommended: false, nasaUse: null },
  { id: 'longonot', name: 'Longonot', place: 'Kenia', region: 'africa', lat: -0.92, lon: 36.45, diameterKm: 1.8, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Gran caldera con un cono interno que presenta un cráter circular de ~1,8 km.', twinId: null, recommended: false, nasaUse: null },
  { id: 'suswa', name: 'Suswa', place: 'Kenia', region: 'africa', lat: -1.18, lon: 36.35, diameterKm: 10, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Volcán escudo con caldera de 8 x 12 km y un anillo de fallas interno poco común.', twinId: null, recommended: false, nasaUse: null },
  { id: 'nyiragongo', name: 'Nyiragongo', place: 'R. D. del Congo', region: 'africa', lat: -1.52, lon: 29.25, diameterKm: 1.2, age: 'Volcán activo', origin: 'volcanico', summary: 'Estratovolcán activo con cráter de cumbre de ~1,2 km que alberga un lago de lava.', twinId: null, recommended: false, nasaUse: null },
  { id: 'nyamuragira', name: 'Nyamuragira', place: 'R. D. del Congo', region: 'africa', lat: -1.41, lon: 29.20, diameterKm: 2.15, age: 'Volcán activo', origin: 'volcanico', summary: 'Volcán escudo muy activo; su cima está truncada por una caldera de unos 2 x 2,3 km.', twinId: null, recommended: false, nasaUse: null },
  { id: 'lago-nyos', name: 'Lago Nyos', place: 'Camerún', region: 'africa', lat: 6.44, lon: 10.30, diameterKm: null, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Lago que llena un maar: cráter explosivo creado al interactuar magma y agua subterránea.', twinId: null, recommended: false, nasaUse: null },
  { id: 'trou-au-natron', name: 'Trou au Natron', place: 'Macizo de Tibesti, Chad', region: 'africa', lat: 20.97, lon: 16.58, diameterKm: null, age: 'No indicada en el PDF', origin: 'volcanico', summary: 'Gran caldera volcánica del macizo Tibesti, con depósitos salinos en el fondo.', twinId: null, recommended: false, nasaUse: null },

  // ---------- OCEANÍA ----------
  { id: 'acraman', name: 'Acraman', place: 'Australia Meridional', region: 'oceania', lat: -32.02, lon: 135.45, diameterKm: 90, age: '~590 millones de años', origin: 'impacto', summary: 'Formado por el impacto de un asteroide; es muy antiguo y está erosionado. Se compara con grandes cráteres lunares de impacto.', twinId: null, recommended: true, nasaUse: null },
  { id: 'tookoonooka', name: 'Tookoonooka', place: 'Queensland, Australia', region: 'oceania', lat: -27.07, lon: 142.83, diameterKm: 55, age: '~128 millones de años', origin: 'impacto', summary: 'Está enterrado bajo capas de rocas y sedimentos, por lo que no se observa claramente en la superficie.', twinId: null, recommended: false, nasaUse: null },
  { id: 'woodleigh', name: 'Woodleigh', place: 'Australia Occidental', region: 'oceania', lat: -26.05, lon: 114.67, diameterKm: 90, age: '~364 millones de años', origin: 'impacto', summary: 'Estructura de impacto muy antigua (60 a 120 km), cubierta y modificada por procesos geológicos; entra en el rango de algunos grandes cráteres lunares.', twinId: null, recommended: true, nasaUse: null },
  { id: 'gosses-bluff', name: 'Gosses Bluff', place: 'Territorio del Norte, Australia', region: 'oceania', lat: -23.82, lon: 132.30, diameterKm: 22, age: '~142 millones de años', origin: 'impacto', summary: 'Conserva un relieve circular central tras la erosión de gran parte del borde original (estructura original de ~20 km). Se parece a los cráteres lunares complejos.', twinId: null, recommended: false, nasaUse: null },
  { id: 'wolfe-creek', name: 'Wolfe Creek', place: 'Australia Occidental', region: 'oceania', lat: -19.17, lon: 127.80, diameterKm: 0.88, age: '~300.000 años', origin: 'impacto', summary: 'Circular, con borde elevado y fondo plano. De los cráteres terrestres mejor conservados.', twinId: 'moltke', recommended: true, nasaUse: 'Pruebas de inclinación y tracción de rovers en pendientes pronunciadas.' },
  { id: 'spider', name: 'Spider', place: 'Kimberley, Australia Occidental', region: 'oceania', lat: -16.73, lon: 126.05, diameterKm: 13, age: 'Entre 580 y 900 millones de años', origin: 'impacto', summary: 'Estructura de impacto muy antigua y erosionada, con deformación y elevación central. Se compara con cráteres lunares complejos.', twinId: null, recommended: false, nasaUse: null },
  { id: 'taupo', name: 'Caldera de Taupō', place: 'Nueva Zelanda', region: 'oceania', lat: -38.80, lon: 175.90, diameterKm: 35, age: '~25.500 años (gran caldera)', origin: 'volcanico', summary: 'Se originó por una enorme erupción volcánica y el posterior hundimiento del terreno, no por un meteorito.', twinId: null, recommended: false, nasaUse: null },
  { id: 'rotorua', name: 'Caldera de Rotorua', place: 'Nueva Zelanda', region: 'oceania', lat: -38.08, lon: 176.28, diameterKm: 22, age: '220.000–240.000 años', origin: 'volcanico', summary: 'Gran depresión volcánica ocupada en gran parte por el lago Rotorua.', twinId: null, recommended: false, nasaUse: null },
];

export const LUNAR_FEATURES = [
  { id: 'moltke', name: 'Moltke', lat: -0.6, lon: 24.2, diameterKm: 6.5, kind: 'crater', note: 'Cráter simple en forma de cuenco, cerca del sitio del Apollo 11.' },
  { id: 'linne', name: 'Linné', lat: 27.7, lon: 11.8, diameterKm: 2.2, kind: 'crater', note: 'Cráter simple y joven en Mare Serenitatis.' },
  // corregido: el PDF rotula estas coordenadas bajo Mare Serenitatis; 19°48'S 45°54'O corresponde a Mersenius C en el borde de Mare Humorum
  { id: 'mersenius-c', name: 'Mersenius C', lat: -19.8, lon: -45.9, diameterKm: 14, kind: 'crater', note: 'Cráter en el borde noreste de Mare Humorum, de 14 km y ~1,5 km de profundidad.' },
  { id: 'korolev', name: 'Korolev', lat: -4.4, lon: -157.4, diameterKm: 437, kind: 'cuenca', note: 'Cuenca de 437 km de diámetro y 5,43 km de profundidad en la cara oculta.' },
  { id: 'messier', name: 'Messier', lat: -1.9, lon: 47.6, diameterKm: 11, kind: 'crater', note: 'Cráter alargado en Mare Fecunditatis, famoso por su gemelo Messier A.' },
  { id: 'eratostenes', name: 'Eratóstenes', lat: 14.5, lon: -11.3, diameterKm: 58, kind: 'crater', note: 'Cráter complejo con picos centrales, en el borde de Mare Imbrium.' },
  { id: 'mare-imbrium', name: 'Mare Imbrium', lat: 32.8, lon: -15.6, diameterKm: 1123, kind: 'mar', note: 'Mar lunar de lava solidificada; el terreno de Bajada del Diablo se parece al de esta zona.' },
  { id: 'mare-tranquillitatis', name: 'Mare Tranquillitatis', lat: 8.5, lon: 31.4, diameterKm: 873, kind: 'mar', note: 'Mar lunar de basalto, sitio del Apollo 11.' },
  { id: 'mare-serenitatis', name: 'Mare Serenitatis', lat: 28.0, lon: 17.5, diameterKm: 707, kind: 'mar', note: 'Mar lunar donde se ubica el cráter Linné.' },
  { id: 'mare-humorum', name: 'Mare Humorum', lat: -24.4, lon: -38.6, diameterKm: 825, kind: 'mar', note: 'Mar lunar circular; en su borde noreste está Mersenius C.' },
  { id: 'shackleton', name: 'Shackleton', lat: -89.9, lon: 0, diameterKm: 21, kind: 'crater', note: 'Cráter del Polo Sur lunar con regiones en sombra permanente.' },
  { id: 'nobile', name: 'Nobile', lat: -85.2, lon: 53.3, diameterKm: 73, kind: 'crater', note: 'Cráter cercano al Polo Sur lunar, objetivo de la misión VIPER para buscar hielo de agua.' },
  { id: 'polo-sur-lunar', name: 'Polo Sur lunar', lat: -90, lon: 0, diameterKm: null, kind: 'polo', note: 'Terreno muy craterizado con crestas de luz rasante y sombras permanentes; análogo de Artemis.' },
  { id: 'fra-mauro', name: 'Fra Mauro', lat: -6.0, lon: -17.0, diameterKm: 95, kind: 'crater', note: 'Formación de tierras altas donde alunizó el Apollo 14.' },
  { id: 'descartes', name: 'Descartes', lat: -11.7, lon: 15.7, diameterKm: 48, kind: 'crater', note: 'Zona de tierras altas del Apollo 16.' },
];

export const EUROPA_FEATURES = [
  // Longitudes O del PDF normalizadas a -180..180 (lon = 360 - lonO cuando lonO > 180)
  // original PDF: 25,2; 271,4°O (-271,4 = +88,6)
  { id: 'pwyll', name: 'Cráter Pwyll', lat: -25.2, lon: 88.6, diameterKm: 26, kind: 'crater', analog: 'Cráteres lunares', note: 'Pulverizó el material alrededor creando un regolito de hielo brillante.' },
  // original PDF: 16; 334°O (-334 = +26)
  { id: 'callanish', name: 'Cuenca Callanish', lat: -16, lon: 26, diameterKm: 100, kind: 'cuenca', analog: 'Cuencas lunares', note: 'Gran estructura de anillos concéntricos formada cuando un objeto perforó la capa rígida de hielo hasta una capa más blanda.' },
  // original PDF: 1,7; 141,2°O (ya en rango; signo de latitud supuesto sur)
  { id: 'tycho', name: 'Cuenca Tycho', lat: -1.7, lon: -141.2, diameterKm: 140, kind: 'cuenca', analog: 'Cuencas lunares', note: 'Cuenca de impacto multianillo; sus fracturas concéntricas muestran dónde colapsó la litosfera helada.' },
  // original PDF: 9,7; 272,7°O (-272,7 = +87,3)
  { id: 'conamara-chaos', name: 'Conamara Chaos', lat: 9.7, lon: 87.3, diameterKm: null, kind: 'caos', analog: 'Mares lunares', note: 'Bloques de corteza de hielo fracturados que se recongelaron en una matriz de criolava; lo más cercano a los maria lunares. Está al norte del ecuador, cerca de Pwyll.' },
  { id: 'llanuras-ecuatoriales', name: 'Llanuras ecuatoriales', lat: 0, lon: 0, diameterKm: null, kind: 'llanura', analog: 'Regolito y exosfera', note: 'Franja entre 20°N y 20°S alrededor del globo (se marca en lat 0). Mayor radiación del cinturón de Júpiter: capa fina de polvo de hielo y sales bajo una débil exosfera de oxígeno.' },
];
