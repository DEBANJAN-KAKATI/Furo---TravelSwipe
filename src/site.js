/**
 * Furo website - landing page behaviour.
 * Links into the web app (served at /app/ in the website build).
 */

// In `vite dev` the app is the root page; in the website build it lives at /app/
const APP_URL = import.meta.env.DEV ? '/' : '/app/';

// Real photos of each place (Wikimedia Commons)
const WM = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
const CITIES = [
  { name: 'Pondicherry', note: 'Curated · Rock Beach & French Quarter', img: WM + '8/8c/Pondicherry-Rock_beach_aerial_view.jpg/960px-Pondicherry-Rock_beach_aerial_view.jpg' },
  { name: 'Bengaluru', note: 'Curated · Bangalore Palace & Lalbagh', img: WM + '8/8f/Bangalore_Mysore_Maharaja_Palace.jpg/960px-Bangalore_Mysore_Maharaja_Palace.jpg' },
  { name: 'Jaipur', note: 'Hawa Mahal, forts & bazaars', img: WM + '4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg' },
  { name: 'Darjeeling', note: 'Tiger Hill & tea gardens', img: WM + 'd/d8/Tiger_Hill_Darjeeling_West_Bengal_India_%283%29.JPG/960px-Tiger_Hill_Darjeeling_West_Bengal_India_%283%29.JPG' },
  { name: 'Shillong', note: 'Elephant Falls, lakes & cafés', img: WM + '3/36/Elephant_Falls_Meghalaya.jpg/960px-Elephant_Falls_Meghalaya.jpg' },
  { name: 'Paris', note: 'Eiffel Tower, museums & the Seine', img: WM + '8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/960px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg' },
  { name: 'Tokyo', note: 'Sensō-ji, neon & ramen', img: WM + '4/43/Sensoji_2023.jpg/960px-Sensoji_2023.jpg' }
];

const DEMO = [
  { title: 'Rock Beach Promenade', sub: '🕒 Open 24/7 · 📍 Pondicherry', pill: '🏖️ Seaside promenade', img: CITIES[0].img },
  { title: 'Hawa Mahal', sub: '🕒 09:00 – 16:30 · 📍 Jaipur', pill: '🏰 Palace of Winds', img: CITIES[2].img },
  { title: 'Tiger Hill Sunrise', sub: '🌅 Best at 05:00 · 📍 Darjeeling', pill: '⛰️ Viewpoint', img: CITIES[3].img },
  { title: 'Sensō-ji Temple', sub: '🕒 06:00 – 17:00 · Free', pill: '🛕 Historic temple', img: CITIES[6].img }
];

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const appLink = (city) => city ? `${APP_URL}?city=${encodeURIComponent(city)}` : APP_URL;

function setupLinks() {
  document.querySelectorAll('[data-app-link]').forEach(a => { a.href = appLink(); });
}

function setupNav() {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const btn = document.getElementById('menu-btn');
  const links = document.getElementById('nav-links');
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

function setupTheme() {
  document.getElementById('theme-btn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      const s = JSON.parse(localStorage.getItem('furo_settings') || '{}');
      s.theme = next;
      localStorage.setItem('furo_settings', JSON.stringify(s));
    } catch (e) { /* storage blocked */ }
  });
}

function setupSearch() {
  const form = document.getElementById('hero-search');
  const input = document.getElementById('hero-city');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (!city) { input.focus(); return; }
    location.href = appLink(city);
  });
}

function renderCities() {
  const grid = document.getElementById('city-grid');
  grid.innerHTML = CITIES.map(c => `
    <a class="city-card" href="${appLink(c.name)}">
      <img src="${esc(c.img)}" alt="" loading="lazy" />
      <span class="cc-go">Start swiping →</span>
      <div class="cc-body"><b>${esc(c.name)}</b><small>${esc(c.note)}</small></div>
    </a>`).join('') + `
    <a class="city-card search" href="#top" id="city-search-card">
      <span class="em">🔎</span><b>Anywhere else</b><small>Type any city in the search box</small>
    </a>`;
  document.getElementById('city-search-card').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('hero-city').focus(), 400);
  });
}

function runDemo() {
  const top = document.getElementById('demo-top');
  const cards = document.querySelectorAll('#demo-stack .demo-card');
  if (!top || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  DEMO.forEach(d => { const im = new Image(); im.src = d.img; });

  const apply = (el, d) => el.style.setProperty('--img', `url('${d.img}')`);
  const cycle = () => {
    top.classList.add('stamp');
    setTimeout(() => top.classList.add('fly'), 500);
    setTimeout(() => {
      i = (i + 1) % DEMO.length;
      const d = DEMO[i];
      top.classList.remove('fly', 'stamp');
      top.classList.add('reset');
      apply(top, d);
      apply(cards[1], DEMO[(i + 1) % DEMO.length]);
      apply(cards[0], DEMO[(i + 2) % DEMO.length]);
      document.getElementById('demo-title').textContent = d.title;
      document.getElementById('demo-sub').textContent = d.sub;
      top.querySelector('.demo-pill').textContent = d.pill;
      void top.offsetWidth;
      top.classList.remove('reset');
    }, 1150);
  };
  setInterval(cycle, 3400);
}

function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

/** Hide the APK button if the download isn't hosted alongside the site. */
async function checkApk() {
  const links = document.querySelectorAll('a[href="/download/Furo.apk"]');
  try {
    const res = await fetch('/download/Furo.apk', { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    if (res.ok && !type.includes('text/html')) return;
  } catch (e) { /* offline */ }
  links.forEach(a => { a.style.display = 'none'; });
}

document.addEventListener('DOMContentLoaded', () => {
  setupLinks();
  setupNav();
  setupTheme();
  setupSearch();
  renderCities();
  setupReveal();
  runDemo();
  checkApk();
});
