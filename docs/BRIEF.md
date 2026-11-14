# Fronteras Galácticas — brief compartido para todos los agentes

Sitio del equipo **"La LUNA"** para el **NASA Space Apps Challenge 2026**.
Se publica en `https://fronterasgalacticas.becode.com.ar`. Entrega: 15/11/2026.

## Qué cuenta el sitio

El equipo buscó **lugares de la Tierra que se parecen a la Luna** para instalar
**bases de prueba lunares** (sitios análogos). Recopilaron cráteres de impacto y
volcánicos en los polos, Asia, América/Argentina, África y Oceanía, los compararon
con cráteres lunares "gemelos", estudiaron a fondo Kalkkop (Sudáfrica), revisaron
misiones análogas de la NASA (Apollo, Artemis, D-RATS, NEEMO, VIPER), qué necesita
una base lunar y qué datos busca la NASA. Recomiendan 5 sitios: Bajada del Diablo,
La Payunia (Argentina), Acraman, Woodleigh y Wolfe Creek (Australia).
Bonus: análogos helados en **Europa** (la luna de Júpiter).

Fuente única de verdad del contenido: `docs/pdf-texto.txt` (texto del PDF del equipo).
No inventes datos científicos. Si un dato del PDF es claramente erróneo, corregilo
con el valor conocido y dejá un comentario `// corregido:` en el código.

Idioma: **español** (neutro, cálido, con algo de humor espacial). Nada de inglés en la UI.

## Stack (sin build)

- HTML + CSS + ES modules nativos. **Sin bundler, sin npm en runtime.**
- Three.js vía importmap (ya declarado en `index.html`):
  `import * as THREE from 'three'` y `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`
  (three@0.170.0 desde jsdelivr).
- GSAP 3.12.5 + ScrollTrigger cargados globalmente (`window.gsap`, `window.ScrollTrigger`).
- Servido como estático por nginx. Probar local con:
  `python -m http.server <PUERTO> --directory C:\Users\gonib\Downloads\nasa2`
  (cada agente usa su propio puerto: hero 8101, mundos 8102, naves 8103, base 8104, contenido 8105).
- Verificación visual sin navegador interactivo: Chrome headless.
  `"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1440,900 --virtual-time-budget=6000 --screenshot=<scratch>\shot.png http://localhost:<PUERTO>/`
  (Si Chrome está en otra ruta, buscarlo. Guardá screenshots fuera del proyecto.)

## Dirección estética: "dossier de misión lunar"

Mezcla de **cartografía científica** (líneas finas, retículas, coordenadas, etiquetas
monoespaciadas, como un informe técnico de la NASA de los 60) con **cine espacial**
(negro profundo, luz rasante sobre la Luna, brillo cálido del Sol). Elegante y sobrio,
con momentos de asombro. Evitar: neón cyberpunk, gradientes violetas genéricos,
glassmorphism, emojis, fuentes "Orbitron".

Tokens (definidos en `css/tokens.css`, usarlos siempre vía `var(--...)`):

| token | valor | uso |
|---|---|---|
| `--void` | `#05060A` | fondo general |
| `--void-2` | `#0B0D14` | paneles |
| `--line` | `rgba(236,232,223,.14)` | bordes, retículas |
| `--paper` | `#ECE8DF` | texto principal |
| `--dust` | `#9A968C` | texto secundario (regolito) |
| `--signal` | `#FF5B1F` | acento principal (naranja señal, CTAs, marcadores) |
| `--signal-soft` | `rgba(255,91,31,.18)` | halos |
| `--telemetry` | `#8FE3FF` | datos, coordenadas, líneas de órbita |
| `--sun` | `#FFD27A` | luz solar, brillos |
| `--ice` | `#BFE6FF` | Europa / hielo |

Tipografías (Google Fonts, ya cargadas):
- Títulos: **Instrument Serif** (`var(--font-display)`), grandes, a veces en itálica.
- Texto: **Manrope** (`var(--font-body)`).
- Datos / etiquetas / coordenadas: **IBM Plex Mono** (`var(--font-mono)`), mayúsculas, tracking amplio.

Motivos recurrentes: coordenadas tipo `19.17°S · 127.80°E`, códigos de sección
`[ 03 / ATLAS ]`, retícula de puntos, crosshairs `+`, líneas de órbita punteadas.

## Reglas de convivencia (varios agentes en paralelo)

- **Cada agente toca SOLO sus archivos.** No edites `index.html`, `css/tokens.css`,
  `css/base.css` ni `js/main.js` salvo que tu encargo lo diga. Si necesitás un
  cambio ahí, explicalo en tu informe final y lo integra el agente principal.
- Cada módulo JS exporta `export function init(rootEl) { ... }` y lo llama `js/main.js`
  de forma perezosa cuando la sección se acerca al viewport. Debe:
  - funcionar si `rootEl` no existe (salir sin error),
  - pausar el render loop cuando no es visible (IntersectionObserver),
  - respetar `prefers-reduced-motion` (versión estática o muy suave),
  - manejar resize y `devicePixelRatio` (capado a 2),
  - andar bien en celular (375px) y no trabar en notebooks modestas
    (presupuesto: 60fps en GPU integrada; nada de post-processing pesado).
- Cada módulo trae su propio CSS en `css/<modulo>.css` (ya enlazado en `index.html`).
  Prefijá las clases con el nombre del módulo (`.worlds-…`, `.ships-…`, `.base-…`, `.hero-…`).
- Sin dependencias nuevas fuera de three/GSAP. Texturas: generar proceduralmente
  (canvas/shaders) o usar imágenes de dominio público de la NASA guardadas en
  `assets/` (máx ~600 KB c/u, preferir .jpg/.webp). Nada de hotlinking.
- Accesibilidad: controles con `aria-label`, foco visible, contenido clave también en texto.

## Archivos y dueños

| archivo | dueño |
|---|---|
| `index.html`, `css/tokens.css`, `css/base.css`, `js/main.js` | agente principal |
| `js/hero.js`, `css/hero.css` | Hero + intro (Fable) |
| `js/worlds.js`, `css/worlds.css` | Atlas de mundos (Fable) |
| `js/ships.js`, `css/ships.css` | Naves (Fable) |
| `js/base.js`, `css/base-lunar.css` | Base lunar interactiva (Fable) |
| `js/data/craters.js` | Datos (Sonnet) |
| `js/sections.js`, `css/sections.css`, contenido dentro de `<!-- CONTENIDO:... -->` en index.html | Contenido (Sonnet) |
