// Orquestador: nav, revelado al scroll y carga perezosa de módulos.
// Cada módulo exporta init(rootEl). Si un módulo falla, el resto del sitio sigue andando.

const lazy = (selector, loader, rootMargin = '600px') => {
  const el = document.querySelector(selector);
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      loader()
        .then((m) => m.init(el))
        .catch((err) => console.error(`[fronteras] falló ${selector}:`, err));
    }
  }, { rootMargin });
  io.observe(el);
};

// Contenido (secciones de texto con interacciones simples)
import('./sections.js?v=1794697630').then((m) => m.init(document)).catch((e) => console.error('[fronteras] sections', e));

// Hero + intro arrancan de inmediato
import('./hero.js?v=1794697630').then((m) => m.init(document.getElementById('hero-stage'))).catch((e) => console.error('[fronteras] hero', e));

// Naves: capa global
import('./ships.js?v=1794697630').then((m) => m.init(document.getElementById('ships-layer'))).catch((e) => console.error('[fronteras] ships', e));

// Módulos pesados: al acercarse
lazy('#worlds-app', () => import('./worlds.js?v=1794697630'));
lazy('#base-app', () => import('./base.js?v=1794697630'));

// ---------- Nav ----------
const nav = document.getElementById('nav');
const toggle = nav.querySelector('.nav__toggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}));
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Sección activa en el nav
const links = [...nav.querySelectorAll('.nav__links a')];
const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.removeAttribute('aria-current'));
    byId.get(e.target.id)?.setAttribute('aria-current', 'true');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

// ---------- Revelado ----------
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  });
}, { rootMargin: '0px 0px -10% 0px' });
const observeReveals = () => document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => revealIO.observe(el));
observeReveals();
window.addEventListener('fronteras:content-ready', observeReveals);
