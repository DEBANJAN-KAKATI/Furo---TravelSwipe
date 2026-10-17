/**
 * ImageService - real photos of each place, never stock pictures.
 *
 * Order of sources (all keyless, CORS-enabled):
 *   1. Photos already attached to the place that are known to show it
 *      (Wikipedia/Wikivoyage/OSM images, user-uploaded drop photos,
 *      curated Wikimedia files whose name matches the place)
 *   2. The image of the matching Wikipedia article (validated by distance / name)
 *   3. Wikimedia Commons files whose title names the place
 *   4. Commons photos geotagged at the spot whose title names the place or area
 * Results are cached on the device. Places with no photo show a placeholder.
 */

import { haversineKm } from './placesService.js';

const CACHE_KEY = 'furo_images_v2';
const MISS_TTL = 2 * 24 * 3600 * 1000;
const MAX_IMAGES = 3;
const WIDTH = 900;

const STOP = new Set(('the and with near behind from into over under next opposite this that your our for '
  + 'road street lane marg main area city town centre center circle cross block stage layout '
  + 'temple park garden gardens beach market bazaar cafe café restaurant bar pub house hall '
  + 'view views point night late sunset sunrise secret hidden free local best famous legendary '
  + 'spot spots hack cart stall shop store club walk tour trip festival event gig open mic '
  + 'boulevard promenade hill hills lake river island museum gallery palace fort church '
  + 'bengaluru guwahati puducherry mumbai chennai kolkata india').split(' '));

const BAD_FILE = /(portrait|selfie|logo|\bmap\b|locator|flag|\.svg|icon|diagram|\bplan\b|girl|\bboy\b|woman|\bman\b|couple|wedding|bride|signature|coat of arms|fight|accident|protest march)/i;

// Old and new city names should match each other ("Bangalore Palace" = "Bengaluru Palace")
const ALIASES = [
  [/bangalore/g, 'bengaluru'], [/bombay/g, 'mumbai'], [/madras/g, 'chennai'],
  [/calcutta/g, 'kolkata'], [/pondicherry|pondy/g, 'puducherry'], [/mysore/g, 'mysuru'],
  [/gurgaon/g, 'gurugram'], [/trivandrum/g, 'thiruvananthapuram'], [/cochin/g, 'kochi'],
  [/benares|banaras/g, 'varanasi'], [/poona/g, 'pune'], [/gauhati/g, 'guwahati']
];
const norm = (s) => {
  let t = (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  ALIASES.forEach(([re, to]) => { t = t.replace(re, to); });
  return t;
};

export function keywords(text) {
  return [...new Set(norm(text).split(/[^a-z0-9]+/)
    .filter(w => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)))];
}

function strongWords(text) {
  return [...new Set(norm(text).split(/[^a-z0-9]+/).filter(w => w.length >= 3))];
}

const isStock = (u) => /images\.unsplash\.com|source\.unsplash/i.test(u || '');

/** Normalises Wikimedia thumbnail links to the long-standing upload host. */
function fixWikimedia(u) {
  return (u || '').replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/');
}

function fileTitleFromUrl(u) {
  try {
    const path = decodeURIComponent(new URL(u).pathname);
    const parts = path.split('/');
    // .../thumb/a/ab/File_name.jpg/1280px-File_name.jpg → File_name.jpg
    const i = parts.indexOf('thumb');
    return (i >= 0 ? parts[i + 3] : parts[parts.length - 1]).replace(/_/g, ' ');
  } catch (e) {
    return '';
  }
}

function titleMatches(title, words) {
  const t = norm(title);
  return words.some(w => t.includes(w));
}

let lastCall = 0;
let pausedUntil = 0;

/** Wikimedia API call with pacing; backs off for a while when rate-limited. */
async function api(host, params, timeout = 9000, retry = true) {
  const wait = Math.max(0, lastCall + 250 - Date.now(), pausedUntil - Date.now());
  lastCall = Date.now() + wait;
  if (wait) await new Promise(r => setTimeout(r, wait));
  const url = `https://${host}/w/api.php?format=json&origin=*&${params}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) {
      const after = parseInt(res.headers.get('retry-after') || '8', 10);
      pausedUntil = Date.now() + Math.min(30, Math.max(3, after)) * 1000;
      if (retry) return api(host, params, timeout, false);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const compact = (s) => norm(s).replace(/[^a-z0-9]/g, '');

/** Short search phrase: "Bangalore Palace (Wadiyar Royal Estate)" → "Bangalore Palace" */
function shortName(name) {
  return (name || '').split(/[(@&:|–—]| - /)[0].replace(/[#"]/g, ' ').trim();
}

/** How well a Wikipedia title names this place: 2 = clearly the place, 1 = shares a key word, 0 = no. */
function titleScore(title, place, nameWords) {
  const t = title.replace(/\(.*?\)/g, ' ').replace(/,.*$/, '');
  // Match against the main part of the name only, not the bit in brackets
  const main = shortName(place.name);
  const tc = compact(t);
  if (tc.length >= 4 && compact(main).includes(tc)) return 2;
  const tw = strongWords(t);
  const nw = strongWords(main);
  if (tw.length && tw.every(w => nw.includes(w)) && (tw.length >= 2 || !STOP.has(tw[0]))) return 2;
  // Only words from the main part of the name count ("Vidyarthi Bhavan (Basavanagudi)" ≠ "Basavanagudi")
  const primary = keywords(shortName(place.name));
  if (primary.some(w => norm(t).includes(w))) return 1;
  return 0;
}

function pickArticle(articles, place, nameWords) {
  return articles
    .map(a => ({ a, score: titleScore(a.title, place, nameWords), km: a.coords ? haversineKm(place.coords, a.coords) : 9 }))
    .filter(x => (x.score === 2 && x.km < 3) || (x.score === 1 && x.km < 0.8))
    .sort((x, y) => y.score - x.score || x.km - y.km)[0];
}

class ImageService {
  constructor() {
    this.registry = new Map();
    this.inflight = new Map();
    this.queue = [];
    this.active = 0;
    this.listeners = new Set();
    this.hints = new Map();     // placeId → {image,title} | null from the city-wide Wikipedia pass
    this.primes = new Map();    // destinationId → Promise
    try {
      localStorage.removeItem('furo_images_v1');
      this.cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch (e) { this.cache = {}; }
  }

  persist() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        const entries = Object.entries(this.cache);
        if (entries.length > 1500) {
          entries.sort((a, b) => b[1].t - a[1].t);
          this.cache = Object.fromEntries(entries.slice(0, 1200));
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
      } catch (e) { /* storage full: keep in memory */ }
    }, 400);
  }

  register(places) {
    (places || []).forEach(p => { if (p && p.id) this.registry.set(p.id, { ...(this.registry.get(p.id) || {}), ...p }); });
  }

  onUpdate(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Photos attached to the place that we trust to depict it. */
  ownImages(place) {
    const list = [...(place.images || []), place.heroImage].filter(Boolean);
    const out = [];
    const nameWords = keywords(place.name);
    list.forEach(raw => {
      const u = fixWikimedia(raw);
      if (isStock(u) || out.includes(u)) return;
      if (/^data:image\//.test(u)) { out.push(u); return; }
      if (place.source) { out.push(u); return; } // live data: image came from the place's own record
      // Curated Wikimedia links: keep only files that are named after the place
      if (/wikimedia\.org/.test(u) && titleMatches(fileTitleFromUrl(u), nameWords)) out.push(u);
    });
    return out;
  }

  /** Best images known right now (sync). */
  known(place) {
    if (!place) return [];
    const own = this.ownImages(place);
    const hit = this.cache[place.id];
    const found = hit ? hit.u : [];
    return [...new Set([...own, ...found])].slice(0, MAX_IMAGES);
  }

  first(place) {
    return this.known(place)[0] || '';
  }

  needsLookup(place) {
    const hit = this.cache[place.id];
    if (hit && (hit.u.length || Date.now() - hit.t < MISS_TTL)) return false;
    return this.ownImages(place).length < MAX_IMAGES;
  }

  /** Resolves real photos for a place (queued, cached). */
  resolve(place, { priority = false } = {}) {
    if (!place || !place.id) return Promise.resolve([]);
    this.register([place]);
    if (!this.needsLookup(place)) return Promise.resolve(this.known(place));
    if (this.inflight.has(place.id)) return this.inflight.get(place.id);
    const p = new Promise(res => {
      const job = { place, res };
      if (priority) this.queue.unshift(job); else this.queue.push(job);
      this.pump();
    });
    this.inflight.set(place.id, p);
    return p;
  }

  pump() {
    while (this.active < 3 && this.queue.length) {
      const { place, res } = this.queue.shift();
      this.active++;
      const prime = this.primes.get(place.destinationId) || Promise.resolve();
      prime.catch(() => {}).then(() => this.lookup(place))
        .catch(() => [])
        .then(found => {
          this.cache[place.id] = { u: found, t: Date.now() };
          this.persist();
          this.inflight.delete(place.id);
          const imgs = this.known(place);
          res(imgs);
          if (found.length) this.listeners.forEach(fn => fn(place.id, imgs));
        })
        .finally(() => { this.active--; this.pump(); });
    }
  }

  /**
   * One Wikipedia pass for a whole city: list geotagged articles around the
   * centre, match them to places by name, then batch-fetch their photos.
   * Saves several requests per card.
   */
  primeCity(dest) {
    if (!dest || !dest.coords || this.primes.has(dest.id)) return this.primes.get(dest && dest.id);
    const run = (async () => {
      const places = dest.places.filter(p => p.coords && !p.approxLocation && this.needsLookup(p));
      if (!places.length) return;
      const j = await api('en.wikipedia.org', `action=query&list=geosearch&gsradius=10000&gslimit=500&gscoord=${dest.coords[0]}%7C${dest.coords[1]}`, 12000);
      const articles = ((j.query && j.query.geosearch) || []).map(a => ({ title: a.title, coords: [a.lat, a.lon] }));
      const covered = places.filter(p => haversineKm(dest.coords, p.coords) < 9);
      const matched = new Map();
      covered.forEach(p => {
        const best = pickArticle(articles, p, keywords(p.name));
        matched.set(p.id, best ? best.a.title : null);
      });
      const titles = [...new Set([...matched.values()].filter(Boolean))];
      const thumbs = new Map();
      for (let i = 0; i < titles.length; i += 40) {
        const batch = titles.slice(i, i + 40).map(encodeURIComponent).join('%7C');
        const r = await api('en.wikipedia.org', `action=query&prop=pageimages&piprop=thumbnail&pithumbsize=${WIDTH}&pilimit=max&titles=${batch}`, 12000);
        Object.values((r.query && r.query.pages) || {}).forEach(pg => {
          if (pg.thumbnail && !/\.svg/i.test(pg.thumbnail.source)) thumbs.set(pg.title, pg.thumbnail.source);
        });
      }
      // In dense cities the 500-article list doesn't reach everything, so a miss there
      // only counts as final when the list was complete.
      const complete = articles.length < 500;
      matched.forEach((title, id) => {
        if (title && thumbs.has(title)) this.hints.set(id, { image: thumbs.get(title), title });
        else if (complete) this.hints.set(id, null);
      });
    })();
    this.primes.set(dest.id, run);
    run.catch(() => {});
    return run;
  }

  async lookup(place) {
    const city = place.cityName || place.destinationName || '';
    const nameWords = keywords(place.name);
    const areaWords = keywords((place.distance || '').split(/[·•|,]/)[0]);
    const hasCoords = Array.isArray(place.coords) && !place.approxLocation;
    const found = [];
    const seen = new Set();
    const add = (u) => {
      if (!u || isStock(u)) return;
      const key = fileTitleFromUrl(u).replace(/^\d+px-/, '').toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      found.push(u);
    };

    const hint = this.hints.get(place.id);
    let article = hint || await this.wikipediaImage(place, city, nameWords, hasCoords, { skipGeo: hint === null }).catch(() => null);
    // "Comedy Open Mic @ Koramangala" → the venue after the @ is the place to picture
    const venue = (place.name.split('@')[1] || '').trim();
    if (!article && venue) {
      article = await this.wikipediaImage({ ...place, name: venue }, city, keywords(venue), hasCoords).catch(() => null);
    }
    if (article) add(article.image);

    if (found.length < MAX_IMAGES && hasCoords) {
      const words = [...nameWords, ...areaWords, ...(article ? keywords(article.title) : [])];
      (await this.commonsNearby(place.coords, words).catch(() => [])).forEach(add);
    }
    if (found.length < 2 && nameWords.length) {
      (await this.commonsSearch(shortName(place.name), city, nameWords).catch(() => [])).forEach(add);
    }

    if (found.length < 2 && venue && keywords(venue).length) {
      (await this.commonsSearch(venue, city, keywords(venue)).catch(() => [])).forEach(add);
    }
    return found.slice(0, MAX_IMAGES);
  }

  async wikipediaImage(place, city, nameWords, hasCoords, { skipGeo = false } = {}) {
    const cityN = norm(city);
    const usable = (p) => p.thumbnail && !/\.svg/i.test(p.thumbnail.source) &&
      norm(p.title) !== cityN && !/^(list of|tourism in|culture of|history of|economy of|transport in)/.test(norm(p.title));

    // 1. Articles geotagged right around the place, matched by name
    if (hasCoords && !skipGeo) {
      const j = await api('en.wikipedia.org', 'action=query&list=geosearch&gsradius=2000&gslimit=300' +
        `&gscoord=${place.coords[0]}%7C${place.coords[1]}`);
      const articles = ((j.query && j.query.geosearch) || []).map(a => ({ title: a.title, coords: [a.lat, a.lon] }));
      const best = pickArticle(articles, place, nameWords);
      if (best) {
        const r = await api('en.wikipedia.org', `action=query&prop=pageimages&piprop=thumbnail&pithumbsize=${WIDTH}&titles=${encodeURIComponent(best.a.title)}`);
        const pg = Object.values((r.query && r.query.pages) || {})[0];
        if (pg && usable(pg)) return { image: pg.thumbnail.source, title: pg.title };
      }
    }

    // 2. Text search on a short form of the name
    const q = shortName(place.name);
    if (!q) return null;
    const j = await api('en.wikipedia.org', 'action=query&generator=search&gsrlimit=5&prop=pageimages%7Ccoordinates' +
      `&piprop=thumbnail&pithumbsize=${WIDTH}&gsrsearch=${encodeURIComponent(`${q} ${city}`.trim())}`);
    const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index).filter(usable);
    for (const p of pages) {
      const score = titleScore(p.title, place, nameWords);
      if (p.coordinates && hasCoords) {
        const km = haversineKm(place.coords, [p.coordinates[0].lat, p.coordinates[0].lon]);
        if (km < 2.5 && score > 0) return { image: p.thumbnail.source, title: p.title };
      } else if (score === 2) {
        return { image: p.thumbnail.source, title: p.title };
      }
    }
    return null;
  }

  async commonsSearch(name, city, nameWords) {
    const q = `${nameWords.slice(0, 4).join(' ')} ${city}`.trim();
    const j = await api('commons.wikimedia.org', 'action=query&generator=search&gsrnamespace=6&gsrlimit=10' +
      `&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=${WIDTH}&gsrsearch=${encodeURIComponent(q)}`);
    return Object.values((j.query && j.query.pages) || {})
      .sort((a, b) => a.index - b.index)
      .filter(p => p.imageinfo && /image\/(jpeg|png|webp)/.test(p.imageinfo[0].mime))
      .filter(p => !BAD_FILE.test(p.title) && titleMatches(p.title, nameWords))
      .map(p => p.imageinfo[0].thumburl || p.imageinfo[0].url)
      .slice(0, MAX_IMAGES);
  }

  async commonsNearby(coords, words) {
    if (!words.length) return [];
    const j = await api('commons.wikimedia.org', 'action=query&generator=geosearch&ggsnamespace=6&ggsradius=150&ggslimit=25' +
      `&ggscoord=${coords[0]}%7C${coords[1]}&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=${WIDTH}`);
    return Object.values((j.query && j.query.pages) || {})
      .filter(p => p.imageinfo && /image\/(jpeg|png|webp)/.test(p.imageinfo[0].mime))
      .filter(p => !BAD_FILE.test(p.title) && titleMatches(p.title, words))
      .map(p => p.imageinfo[0].thumburl || p.imageinfo[0].url)
      .slice(0, MAX_IMAGES);
  }

  /**
   * Fills every `.pimg[data-place-img]` inside root with the place's photo,
   * looking it up if needed. Elements without a photo keep their placeholder.
   */
  hydrate(root = document) {
    root.querySelectorAll('.pimg[data-place-img]').forEach(el => {
      const place = this.registry.get(el.dataset.placeImg);
      if (!place) return;
      const set = (url) => {
        if (!url || el.dataset.src === url) return;
        el.dataset.src = url;
        let img = el.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.alt = '';
          img.loading = 'lazy';
          img.addEventListener('error', () => { img.remove(); el.classList.remove('has-img'); });
          el.prepend(img);
        }
        img.src = url;
        el.classList.add('has-img');
      };
      const now = this.first(place);
      if (now) set(now);
      if (this.needsLookup(place)) this.resolve(place).then(imgs => set(imgs[0]));
    });
  }
}

export const imageService = new ImageService();

/** Markup for a photo slot that hydrate() fills in. */
export function placeImgSlot(place, cls = '') {
  const id = String(place.id).replace(/"/g, '');
  const icon = String(place.categoryIcon || '📍').replace(/"/g, '');
  return `<div class="pimg ${cls}" data-place-img="${id}" data-icon="${icon}"></div>`;
}
