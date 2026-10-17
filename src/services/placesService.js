/**
 * PlacesService - builds real city decks from open data.
 *   • Nominatim (OpenStreetMap) for geocoding
 *   • Wikipedia GeoSearch for landmarks, photos and descriptions
 *   • Overpass (OpenStreetMap) for food, nightlife, parks, viewpoints & shops
 * No API keys required. Every request has a timeout and fails soft.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];


const EMERGENCY = {
  IN: { police: '112', ambulance: '108', touristHelp: '1363 (India Tourist Helpline)' },
  US: { police: '911', ambulance: '911' }, CA: { police: '911', ambulance: '911' },
  GB: { police: '999', ambulance: '999' }, IE: { police: '112', ambulance: '112' },
  AU: { police: '000', ambulance: '000' }, NZ: { police: '111', ambulance: '111' },
  JP: { police: '110', ambulance: '119' }, CN: { police: '110', ambulance: '120' },
  KR: { police: '112', ambulance: '119' }, TH: { police: '191', ambulance: '1669', touristHelp: '1155 (Tourist Police)' },
  SG: { police: '999', ambulance: '995' }, MY: { police: '999', ambulance: '999' },
  AE: { police: '999', ambulance: '998' }, ID: { police: '110', ambulance: '118' },
  PH: { police: '911', ambulance: '911' }, VN: { police: '113', ambulance: '115' },
  LK: { police: '119', ambulance: '1990' }, NP: { police: '100', ambulance: '102', touristHelp: '1144 (Tourist Police)' },
  BD: { police: '999', ambulance: '999' }, PK: { police: '15', ambulance: '1122' },
  BT: { police: '113', ambulance: '112' }, MV: { police: '119', ambulance: '102' },
  ZA: { police: '10111', ambulance: '10177' }, BR: { police: '190', ambulance: '192' },
  MX: { police: '911', ambulance: '911' }, TR: { police: '112', ambulance: '112' },
  EG: { police: '122', ambulance: '123' }, HK: { police: '999', ambulance: '999' }
};

const COUNTRY_TIPS = {
  IN: [
    { title: 'Temple footwear', desc: 'Remove shoes before entering temples and many homes. Most shrines have a shoe counter.', icon: '🛕' },
    { title: 'Autos & cabs', desc: 'Insist on the meter or book via an app. Night surcharges often apply after 22:00.', icon: '🛺' },
    { title: 'UPI everywhere', desc: 'QR/UPI payments work almost everywhere — carry a little cash for small stalls.', icon: '📱' }
  ],
  JP: [{ title: 'No tipping', desc: 'Tipping is not customary and may cause confusion.', icon: '💴' }],
  US: [{ title: 'Tipping', desc: 'Tip 15–20% at sit-down restaurants and bars.', icon: '💵' }],
  TH: [{ title: 'Temple dress', desc: 'Cover shoulders and knees at temples; remove shoes indoors.', icon: '🛕' }]
};

const UNIVERSAL_TIPS = [
  { title: 'Keep copies', desc: 'Keep a photo of your ID and bookings offline in case you lose signal.', icon: '🪪' },
  { title: 'Check hours', desc: 'Opening hours come from community map data — confirm on the day for festivals and holidays.', icon: '⏰' },
  { title: 'Respect locals', desc: 'Ask before photographing people, and follow posted rules at sacred sites.', icon: '🙏' }
];

// ------------------------------------------------------------------ helpers

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function flagFor(cc) {
  if (!cc || cc.length !== 2) return '📍';
  return String.fromCodePoint(...cc.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

export function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const pretty = (s) => (s || '').replace(/_/g, ' ').replace(/;/g, ', ').replace(/\b\w/g, c => c.toUpperCase());

// ---------------------------------------------------------------- geocoding

async function geocodeOpenMeteo(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=${encodeURIComponent(query)}`;
  const json = await fetchJson(url, {}, 10000);
  const results = (json && json.results) || [];
  if (results.length === 0) return null;
  // Prefer the most populated match ("Paris" → France, not Texas)
  const r = [...results].sort((a, b) => (b.population || 0) - (a.population || 0))[0];
  return {
    name: r.name,
    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    country: r.country || '',
    countryCode: (r.country_code || '').toUpperCase(),
    state: r.admin1 || '',
    coords: [r.latitude, r.longitude],
    type: r.feature_code
  };
}

export async function geocodeCity(query) {
  try {
    const hit = await geocodeOpenMeteo(query);
    if (hit) return hit;
  } catch (e) { /* fall through to Nominatim */ }
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&q=${encodeURIComponent(query)}`;
  const results = await fetchJson(url, { headers: { 'Accept': 'application/json' } }, 12000);
  if (!results || results.length === 0) return null;
  // Prefer populated places over random POIs with the same name
  const ranked = [...results].sort((a, b) => {
    const score = (r) => (['city', 'town', 'village', 'administrative', 'state', 'island'].includes(r.addresstype || r.type) ? 1 : 0) + (r.importance || 0);
    return score(b) - score(a);
  });
  const r = ranked[0];
  const addr = r.address || {};
  return {
    name: r.name || addr.city || addr.town || addr.state || query,
    displayName: r.display_name,
    country: addr.country || '',
    countryCode: (addr.country_code || '').toUpperCase(),
    state: addr.state || '',
    coords: [parseFloat(r.lat), parseFloat(r.lon)],
    type: r.addresstype || r.type
  };
}

export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const r = await fetchJson(url, {}, 10000);
    if (r && (r.city || r.locality)) {
      return {
        name: r.city || r.locality,
        country: r.countryName || '',
        countryCode: (r.countryCode || '').toUpperCase(),
        state: r.principalSubdivision || '',
        coords: [lat, lon]
      };
    }
  } catch (e) { /* fall through */ }
  const url = `${NOMINATIM}/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=en&lat=${lat}&lon=${lon}`;
  const r = await fetchJson(url, { headers: { 'Accept': 'application/json' } }, 12000);
  const addr = (r && r.address) || {};
  return {
    name: addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state || 'Near me',
    country: addr.country || '',
    countryCode: (addr.country_code || '').toUpperCase(),
    state: addr.state || '',
    coords: [lat, lon]
  };
}

// --------------------------------------------------------------- wikivoyage

const VOYAGE_TYPES = ['see', 'do', 'eat', 'drink', 'buy', 'listing'];

/** Splits template params on top-level pipes (ignores pipes inside [[ ]] / {{ }}). */
function splitParams(body) {
  const parts = [];
  let depth = 0, cur = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') { depth++; cur += two; i++; continue; }
    if ((two === '}}' || two === ']]') && depth > 0) { depth--; cur += two; i++; continue; }
    if (body[i] === '|' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += body[i];
  }
  parts.push(cur);
  return parts;
}

function cleanWiki(s) {
  return (s || '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{(?:[^{}|]*\|)*([^{}|]*)\}\}/g, '$1')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VOYAGE_SECTIONS = { see: 'see', do: 'do', eat: 'eat', drink: 'drink', buy: 'buy' };

export function parseVoyageListings(wikitext) {
  const out = [];
  // Index level-2 sections so we only keep See / Do / Eat / Drink / Buy listings
  const sections = [];
  const secRe = /^==\s*([^=\n]+?)\s*==\s*$/gm;
  let sm;
  while ((sm = secRe.exec(wikitext))) sections.push({ at: sm.index, name: sm[1].trim().toLowerCase() });
  const sectionAt = (idx) => {
    let cur = null;
    for (const s of sections) { if (s.at < idx) cur = s.name; else break; }
    return cur ? VOYAGE_SECTIONS[cur.split(/\s/)[0]] : null;
  };

  const re = /\{\{\s*(see|do|eat|drink|buy|listing)\s*(?=[\n|])/gi;
  let m;
  while ((m = re.exec(wikitext))) {
    const section = sectionAt(m.index);
    // Walk to the matching closing braces
    let depth = 1, i = m.index + 2;
    while (i < wikitext.length && depth > 0) {
      const two = wikitext.slice(i, i + 2);
      if (two === '{{') { depth++; i += 2; continue; }
      if (two === '}}') { depth--; i += 2; continue; }
      i++;
    }
    const inner = wikitext.slice(m.index + 2, i - 2);
    const [, ...params] = splitParams(inner);
    const f = {};
    params.forEach(p => {
      const eq = p.indexOf('=');
      if (eq > 0) f[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
    });
    re.lastIndex = i;
    if (!section) continue;
    let type = m[1].toLowerCase();
    if (type === 'listing') type = (f.type && VOYAGE_SECTIONS[f.type.toLowerCase()]) || section;
    if (!VOYAGE_TYPES.includes(type)) continue;
    const name = cleanWiki(f.name);
    if (!name) continue;
    const lat = parseFloat(f.lat), lon = parseFloat(f.long || f.lon);
    out.push({
      source: 'voyage',
      type,
      name,
      content: cleanWiki(f.content || f.description),
      hours: cleanWiki(f.hours),
      price: cleanWiki(f.price),
      address: cleanWiki(f.address),
      directions: cleanWiki(f.directions),
      phone: cleanWiki(f.phone),
      url: (f.url || '').trim(),
      wikipedia: (f.wikipedia || '').trim(),
      image: f.image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.image.trim())}?width=900` : null,
      coords: Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null
    });
    re.lastIndex = i;
  }
  return out;
}

async function fetchVoyagePage(title) {
  const url = `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&origin=*&redirects=1`;
  const json = await fetchJson(url, {}, 15000);
  if (!json.parse) return null;
  return { title: json.parse.title, wikitext: (json.parse.wikitext && json.parse.wikitext['*']) || '' };
}

async function fetchVoyageListings(cityName) {
  const main = await fetchVoyagePage(cityName);
  if (!main) return [];
  let listings = parseVoyageListings(main.wikitext);
  if (listings.length < 45) {
    // Big cities split listings into district articles
    const subs = [...new Set(main.wikitext.split(`[[${main.title}/`).slice(1).map(s => s.split(/[|\]#]/)[0].trim()))]
      .filter(Boolean).slice(0, 4);
    const pages = await Promise.allSettled(subs.map(s => fetchVoyagePage(`${main.title}/${s}`)));
    pages.forEach(p => {
      if (p.status === 'fulfilled' && p.value) listings.push(...parseVoyageListings(p.value.wikitext));
    });
  }
  return listings;
}

// --------------------------------------------------------------- wikipedia

const WIKI_EXCLUDE_DESC = /^(state|city|town|census town|suburb|village|district|neighbourhood|neighborhood|locality|area|cantonment|municipality|human settlement|capital)\b|(constituency|university|institute|school|college|hospital|airport|railway station|metro station|bus station|company|bank|diocese|government|ministry|stadium|cricket ground|hotel)/i;
const WIKI_EXCLUDE_TITLE = /(university|college|school|institute|constituency|hospital|airport|station|district)/i;

async function fetchWikipediaPlaces(center, cityName) {
  const [lat, lon] = center;
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    `&generator=geosearch&ggscoord=${lat}%7C${lon}&ggsradius=10000&ggslimit=80` +
    '&prop=pageimages%7Ccoordinates%7Cdescription%7Cextracts%7Cinfo&inprop=url&colimit=max' +
    '&piprop=thumbnail&pithumbsize=900&pilimit=max&exintro=1&explaintext=1&exsentences=2&exlimit=20';
  const json = await fetchJson(url, {}, 15000);
  const pages = Object.values((json.query && json.query.pages) || {});
  const city = (cityName || '').toLowerCase();
  return pages
    .filter(p => p.coordinates && p.coordinates[0])
    .filter(p => p.title.toLowerCase() !== city)
    .filter(p => !WIKI_EXCLUDE_DESC.test(p.description || '') && !WIKI_EXCLUDE_TITLE.test(p.title))
    .map(p => ({
      source: 'wiki',
      pageId: p.pageid,
      name: p.title,
      description: p.description || '',
      extract: p.extract || '',
      image: p.thumbnail ? p.thumbnail.source : null,
      url: p.fullurl,
      coords: [p.coordinates[0].lat, p.coordinates[0].lon]
    }));
}

// ---------------------------------------------------------------- overpass

function overpassQuery([lat, lon]) {
  const a = (r) => `(around:${r},${lat},${lon})`;
  return `[out:json][timeout:25];
(
  nwr["tourism"~"^(attraction|museum|gallery|zoo|theme_park|aquarium)$"]["name"]${a(9000)};
  nwr["historic"~"^(monument|castle|fort|memorial|ruins|archaeological_site|palace)$"]["name"]${a(9000)};
  nwr["amenity"="place_of_worship"]["name"]["wikidata"]${a(9000)};
)->.sights;
.sights out center tags 70;
(
  nwr["tourism"="viewpoint"]["name"]${a(15000)};
  nwr["natural"~"^(peak|beach|waterfall)$"]["name"]${a(15000)};
)->.views;
.views out center tags 30;
(
  nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]${a(8000)};
  nwr["natural"="water"]["name"]["wikidata"]${a(10000)};
)->.parks;
.parks out center tags 40;
(
  nwr["amenity"~"^(restaurant|cafe|ice_cream|food_court)$"]["name"]["cuisine"]${a(3500)};
)->.food;
.food out center tags 160;
(
  nwr["amenity"~"^(bar|pub|nightclub|theatre|arts_centre|cinema)$"]["name"]${a(5000)};
)->.night;
.night out center tags 60;
(
  nwr["amenity"="marketplace"]["name"]${a(8000)};
  nwr["shop"~"^(mall|department_store|books|craft|gift|art|antiques)$"]["name"]${a(6000)};
)->.shops;
.shops out center tags 50;`;
}

async function fetchOsmPlaces(center) {
  const body = 'data=' + encodeURIComponent(overpassQuery(center));
  let lastErr;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const json = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      }, 14000);
      return (json.elements || [])
        .map(el => {
          const c = el.type === 'node' ? [el.lat, el.lon] : el.center ? [el.center.lat, el.center.lon] : null;
          if (!c || !el.tags || !el.tags.name) return null;
          return { source: 'osm', osmId: `${el.type[0]}${el.id}`, name: el.tags['name:en'] || el.tags.name, tags: el.tags, coords: c };
        })
        .filter(Boolean);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Overpass unavailable');
}

// ---------------------------------------------------------- classification

function classifyOsm(t) {
  const am = t.amenity, tour = t.tourism, leis = t.leisure, nat = t.natural, hist = t.historic;
  if (['restaurant', 'cafe', 'ice_cream', 'food_court', 'fast_food'].includes(am)) {
    const isCafe = am === 'cafe' || am === 'ice_cream';
    return { category: 'Food & Drink', icon: isCafe ? '☕' : '🍽️', pool: isCafe ? 'cafe' : 'food', type: pretty(am === 'ice_cream' ? 'Ice cream & desserts' : am) };
  }
  if (['bar', 'pub', 'nightclub'].includes(am)) return { category: 'Events & Gigs', icon: am === 'nightclub' ? '🪩' : '🍻', pool: 'nightlife', type: pretty(am) };
  if (['theatre', 'arts_centre', 'cinema'].includes(am)) return { category: 'Events & Gigs', icon: '🎭', pool: 'nightlife', type: pretty(am) };
  if (am === 'marketplace' || t.shop) return { category: 'Shopping & Culture', icon: '🛍️', pool: 'urban', type: am === 'marketplace' ? 'Market' : pretty(t.shop) };
  if (tour === 'viewpoint' || nat === 'peak') return { category: 'Sights & Views', icon: nat === 'peak' ? '⛰️' : '🌅', pool: 'views', type: nat === 'peak' ? 'Peak' : 'Viewpoint' };
  if (nat === 'beach') return { category: 'Areas of Exploration', icon: '🏖️', pool: 'beach', type: 'Beach' };
  if (nat === 'waterfall') return { category: 'Sights & Views', icon: '💧', pool: 'nature', type: 'Waterfall' };
  if (leis || nat === 'water' || tour === 'zoo') return { category: 'Areas of Exploration', icon: tour === 'zoo' ? '🦁' : '🌳', pool: 'nature', type: pretty(tour === 'zoo' ? 'zoo' : leis || 'lake') };
  if (am === 'place_of_worship') {
    const rel = t.religion;
    const icon = rel === 'hindu' ? '🛕' : rel === 'muslim' ? '🕌' : rel === 'christian' ? '⛪' : rel === 'buddhist' ? '☸️' : rel === 'sikh' ? '🪯' : '🛕';
    return { category: 'Places to Visit', icon, pool: 'heritage', type: rel ? `${pretty(rel)} shrine` : 'Place of worship' };
  }
  if (tour === 'museum' || tour === 'gallery') return { category: 'Places to Visit', icon: '🖼️', pool: 'heritage', type: pretty(tour) };
  if (hist) return { category: 'Places to Visit', icon: '🏰', pool: 'heritage', type: pretty(hist) };
  return { category: 'Places to Visit', icon: '🏛️', pool: 'heritage', type: pretty(tour || 'Attraction') };
}

function classifyWiki(w) {
  const text = `${w.description} ${w.name}`.toLowerCase();
  if (/(market|bazaar|mall|shopping)/.test(text)) return { category: 'Shopping & Culture', icon: '🛍️', pool: 'urban', type: 'Market' };
  if (/(beach)/.test(text)) return { category: 'Areas of Exploration', icon: '🏖️', pool: 'beach', type: 'Beach' };
  if (/(park|garden|lake|reserve|sanctuary|forest|wetland|river|island)/.test(text)) return { category: 'Areas of Exploration', icon: '🌳', pool: 'nature', type: pretty(w.description || 'Nature spot') };
  if (/(hill|viewpoint|peak|mountain|waterfall|falls)/.test(text)) return { category: 'Sights & Views', icon: '⛰️', pool: 'views', type: pretty(w.description || 'Scenic spot') };
  if (/(temple|mandir|church|cathedral|mosque|masjid|gurdwara|monastery|shrine|basilica)/.test(text)) return { category: 'Places to Visit', icon: '🛕', pool: 'heritage', type: pretty(w.description || 'Shrine') };
  if (/(museum|gallery)/.test(text)) return { category: 'Places to Visit', icon: '🖼️', pool: 'heritage', type: pretty(w.description || 'Museum') };
  if (/(theatre|auditorium|cinema|club|pub)/.test(text)) return { category: 'Events & Gigs', icon: '🎭', pool: 'nightlife', type: pretty(w.description || 'Venue') };
  return { category: 'Places to Visit', icon: '🏛️', pool: 'heritage', type: pretty(w.description || 'Landmark') };
}

const BEST_TIME = {
  'Food & Drink': 'Lunch (12–14h) or dinner (19–21h)',
  'Events & Gigs': 'Evenings after 19:00',
  'Sights & Views': 'Sunrise or the hour before sunset',
  'Areas of Exploration': 'Early morning or late afternoon',
  'Shopping & Culture': 'Late morning to evening',
  'Places to Visit': 'Morning, before the crowds'
};

const DURATION = {
  'Food & Drink': '45 min - 1.5 hours',
  'Events & Gigs': '2 - 3 hours',
  'Sights & Views': '45 min - 1 hour',
  'Areas of Exploration': '1 - 2 hours',
  'Shopping & Culture': '1 - 2 hours',
  'Places to Visit': '1 - 2 hours'
};

function commonsImage(tags) {
  const img = tags.image;
  if (img && /^https?:\/\/.+\.(jpe?g|png|webp)$/i.test(img)) return img;
  const wc = tags.wikimedia_commons;
  if (wc && /^File:/i.test(wc)) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(wc.replace(/^File:/i, ''))}?width=900`;
  }
  return null;
}

function osmQa(tags, cls, centreKm) {
  const qa = [];
  const src = 'OpenStreetMap';
  if (tags.opening_hours) {
    qa.push({ q: 'When is it open?', a: tags.opening_hours.replace(/;/g, ' · '), status: 'verified', badge: 'Hours', icon: '⏰', source: src });
  }
  if (tags.fee) {
    const free = tags.fee === 'no';
    qa.push({ q: 'Is there an entry fee?', a: free ? 'No entry fee listed.' : (tags.charge ? `Yes — ${tags.charge}.` : 'Yes, an entry fee applies.'), status: free ? 'verified' : 'caution', badge: free ? 'Free entry' : 'Paid entry', icon: '🎟️', source: src });
  }
  if (tags.cuisine) {
    qa.push({ q: 'What do they serve?', a: pretty(tags.cuisine), status: 'verified', badge: 'Cuisine', icon: '🍴', source: src });
  }
  if (tags['diet:vegetarian'] || tags['diet:vegan']) {
    const v = tags['diet:vegan'] === 'yes' || tags['diet:vegan'] === 'only' ? 'Vegan options available.' :
      tags['diet:vegetarian'] === 'only' ? 'Pure vegetarian.' : tags['diet:vegetarian'] === 'yes' ? 'Vegetarian options available.' : 'Limited vegetarian choice.';
    qa.push({ q: 'Vegetarian friendly?', a: v, status: 'tip', badge: 'Diet', icon: '🥗', source: src });
  }
  if (tags.outdoor_seating === 'yes') qa.push({ q: 'Outdoor seating?', a: 'Yes, there is outdoor seating.', status: 'tip', badge: 'Al fresco', icon: '🌤️', source: src });
  if (tags.wheelchair) {
    const map = { yes: 'Wheelchair accessible.', limited: 'Partially wheelchair accessible.', no: 'Not wheelchair accessible.' };
    qa.push({ q: 'Wheelchair access?', a: map[tags.wheelchair] || pretty(tags.wheelchair), status: tags.wheelchair === 'no' ? 'caution' : 'verified', badge: 'Access', icon: '♿', source: src });
  }
  const web = tags.website || tags['contact:website'];
  if (web) qa.push({ q: 'Official website', a: web, link: web, status: 'verified', badge: 'Website', icon: '🔗', source: src });
  const phone = tags.phone || tags['contact:phone'];
  if (phone) qa.push({ q: 'Phone number', a: phone, link: `tel:${phone.split(';')[0].replace(/\s/g, '')}`, status: 'verified', badge: 'Call', icon: '📞', source: src });
  qa.push({ q: 'How far is it?', a: `About ${centreKm.toFixed(1)} km from the centre. Tap Navigate for live directions.`, status: 'tip', badge: 'Getting there', icon: '🧭', source: 'Furo' });
  return qa;
}

function classifyVoyage(v) {
  const text = `${v.name} ${v.content}`.toLowerCase();
  if (v.type === 'eat') {
    const cafe = /(caf[eé]|coffee|bakery|tea|dessert|ice cream|sweet)/.test(text);
    return { category: 'Food & Drink', icon: cafe ? '☕' : '🍽️', pool: cafe ? 'cafe' : 'food', type: cafe ? 'Café' : 'Restaurant' };
  }
  if (v.type === 'drink') {
    const cafe = /(caf[eé]|coffee|tea|juice)/.test(text) && !/(bar|pub|beer|cocktail|brew)/.test(text);
    return cafe
      ? { category: 'Food & Drink', icon: '☕', pool: 'cafe', type: 'Café' }
      : { category: 'Events & Gigs', icon: '🍻', pool: 'nightlife', type: /(club|dj|danc)/.test(text) ? 'Nightclub' : 'Bar & pub' };
  }
  if (v.type === 'buy') return { category: 'Shopping & Culture', icon: '🛍️', pool: 'urban', type: /(market|bazaar)/.test(text) ? 'Market' : 'Shopping' };
  if (/(viewpoint|view point|sunset|sunrise|panoram|peak|waterfall|falls)/.test(text)) return { category: 'Sights & Views', icon: '🌅', pool: 'views', type: 'Scenic spot' };
  if (/(beach)/.test(text)) return { category: 'Areas of Exploration', icon: '🏖️', pool: 'beach', type: 'Beach' };
  if (/(park|garden|lake|trek|hike|trail|forest|sanctuary|reserve|boating|cycling|walk)/.test(text)) return { category: 'Areas of Exploration', icon: '🌳', pool: 'nature', type: v.type === 'do' ? 'Outdoor activity' : 'Nature spot' };
  if (v.type === 'do') {
    if (/(music|concert|theatre|theater|show|festival|club|comedy|cinema|dance)/.test(text)) return { category: 'Events & Gigs', icon: '🎭', pool: 'nightlife', type: 'Show & event' };
    return { category: 'Areas of Exploration', icon: '🧭', pool: 'nature', type: 'Activity' };
  }
  if (/(museum|gallery)/.test(text)) return { category: 'Places to Visit', icon: '🖼️', pool: 'heritage', type: 'Museum' };
  if (/(temple|mandir|church|cathedral|mosque|masjid|gurdwara|monastery|shrine)/.test(text)) return { category: 'Places to Visit', icon: '🛕', pool: 'heritage', type: 'Sacred site' };
  if (/(fort|palace|castle|tomb|ruins|monument)/.test(text)) return { category: 'Places to Visit', icon: '🏰', pool: 'heritage', type: 'Heritage site' };
  return { category: 'Places to Visit', icon: '🏛️', pool: 'heritage', type: 'Landmark' };
}

function voyageQa(v, km) {
  const qa = [];
  const src = 'Wikivoyage';
  if (v.hours) qa.push({ q: 'When is it open?', a: v.hours, status: 'verified', badge: 'Hours', icon: '⏰', source: src });
  if (v.price) {
    const free = /^(free|no charge|none)/i.test(v.price);
    qa.push({ q: 'How much does it cost?', a: v.price, status: free ? 'verified' : 'caution', badge: free ? 'Free' : 'Price', icon: '🎟️', source: src });
  }
  if (v.address || v.directions) qa.push({ q: 'Where exactly is it?', a: [v.address, v.directions].filter(Boolean).join(' — '), status: 'tip', badge: 'Location', icon: '📍', source: src });
  if (v.phone) qa.push({ q: 'Phone number', a: v.phone, link: `tel:${v.phone.split(/[,;]/)[0].replace(/[^\d+]/g, '')}`, status: 'verified', badge: 'Call', icon: '📞', source: src });
  if (v.url && /^https?:/.test(v.url)) qa.push({ q: 'Official website', a: v.url, link: v.url, status: 'verified', badge: 'Website', icon: '🔗', source: src });
  if (km !== null) qa.push({ q: 'How far is it?', a: `About ${km.toFixed(1)} km from the centre. Tap Navigate for live directions.`, status: 'tip', badge: 'Getting there', icon: '🧭', source: 'Furo' });
  return qa;
}

function firstSentence(text, max = 170) {
  if (!text) return '';
  let s = text.split(/(?<=[.!?])\s/)[0];
  if (s.length > max) s = s.slice(0, max - 3).trim() + '…';
  return s;
}

function buildPlace(destId, raw, idx, centre, cityName) {
  const cls = raw.source === 'wiki' ? classifyWiki(raw) : raw.source === 'voyage' ? classifyVoyage(raw) : classifyOsm(raw.tags);
  const tags = raw.tags || {};
  const approx = !raw.coords;
  const coords = raw.coords || centre;
  const km = approx ? null : haversineKm(centre, coords);
  const area = tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
  const realImage = raw.image || commonsImage(tags);
  // Only photos of this exact place — more are looked up later by imageService
  const images = realImage ? [realImage] : [];

  let hook = '';
  if (raw.source === 'voyage') hook = firstSentence(raw.content);
  else if (raw.extract) hook = firstSentence(raw.extract);
  else if (tags.description) hook = firstSentence(tags.description);
  if (!hook && raw.description) hook = pretty(raw.description);
  if (!hook && tags.cuisine) hook = `${cls.type} serving ${pretty(tags.cuisine).toLowerCase()}${area ? ` in ${area}` : ''}`;
  if (!hook) hook = `${cls.type}${area ? ` in ${area}` : ''} in ${cityName}`;

  let qa;
  if (raw.source === 'wiki') {
    qa = [
      { q: "What's the story?", a: raw.extract || raw.description || 'See Wikipedia for background.', status: 'verified', badge: 'Background', icon: '📖', source: 'Wikipedia' },
      { q: 'Read more', a: 'Open the Wikipedia article', link: raw.url, status: 'tip', badge: 'Wikipedia', icon: '🔗', source: 'Wikipedia' },
      { q: 'How far is it?', a: `About ${km.toFixed(1)} km from the centre. Tap Navigate for live directions.`, status: 'tip', badge: 'Getting there', icon: '🧭', source: 'Furo' }
    ];
  } else if (raw.source === 'voyage') {
    qa = voyageQa(raw, km);
    if (raw.content && raw.content.length > hook.length + 10) {
      qa.unshift({ q: 'Why go?', a: raw.content, status: 'verified', badge: 'Traveller tip', icon: '💬', source: 'Wikivoyage' });
    }
  } else {
    qa = osmQa(tags, cls, km);
  }

  const free = tags.fee === 'no' || ['park', 'garden'].includes(tags.leisure) || tags.tourism === 'viewpoint' || !!tags.natural ||
    !!(raw.price && /^(free|no charge)/i.test(raw.price));
  const tagChips = [cls.type, area, tags.cuisine ? pretty(tags.cuisine.split(';')[0]) : '', free ? 'Free' : '']
    .filter(Boolean).slice(0, 4).map(s => s.replace(/\s+/g, ''));

  const openStatus = tags.opening_hours ? tags.opening_hours.split(';')[0]
    : raw.hours ? firstSentence(raw.hours, 60) : 'Hours not listed';

  const id = raw.source === 'wiki' ? `${destId}-wiki-${raw.pageId}`
    : raw.source === 'voyage' ? `${destId}-wv-${slugify(raw.name)}`
    : `${destId}-osm-${raw.osmId}`;

  return {
    id,
    name: raw.name,
    category: cls.category,
    categoryIcon: cls.icon,
    subcategory: cls.type,
    rating: null,
    reviewsCount: null,
    priceLevel: free ? 'Free' : '',
    estimatedCostINR: free ? 0 : undefined,
    distance: approx ? (raw.address || cityName) : (area ? `${area} · ${km.toFixed(1)} km` : `${km.toFixed(1)} km from centre`),
    openStatus,
    bestTime: BEST_TIME[cls.category],
    duration: DURATION[cls.category],
    heroImage: images[0] || '',
    images,
    stockPhoto: !realImage,
    cityName,
    approxLocation: approx,
    mapsQuery: `${raw.name}, ${raw.address ? raw.address + ', ' : ''}${cityName}`,
    oneLineHook: hook,
    coords,
    tags: tagChips,
    qaList: qa,
    source: raw.source === 'wiki' ? 'Wikipedia' : raw.source === 'voyage' ? 'Wikivoyage' : 'OpenStreetMap',
    score: (raw.source === 'voyage' ? 4 : 0) + (realImage ? 3 : 0) + (tags.wikidata || raw.source === 'wiki' ? 2 : 0) +
      Object.keys(tags).length * 0.15 + (raw.content ? Math.min(2, raw.content.length / 150) : 0) - (km || 3) * 0.08
  };
}

function dedupe(places) {
  const out = [];
  for (const p of places) {
    const key = slugify(p.name);
    const dup = out.find(o => {
      const k2 = slugify(o.name);
      if (k2 === key) return true;
      const near = !o.approxLocation && !p.approxLocation && haversineKm(o.coords, p.coords) < 0.3;
      return near && (k2.includes(key) || key.includes(k2));
    });
    if (!dup) { out.push(p); continue; }
    // Merge the best of both records
    if (dup.stockPhoto && !p.stockPhoto) Object.assign(dup, { images: p.images, heroImage: p.heroImage, stockPhoto: false });
    if (dup.approxLocation && !p.approxLocation) Object.assign(dup, { coords: p.coords, approxLocation: false, distance: p.distance });
    if (p.source === 'Wikipedia' && dup.source !== 'Wikipedia') {
      dup.qaList = [...dup.qaList.filter(q => q.q !== 'How far is it?'), ...p.qaList.filter(q => q.source === 'Wikipedia'), ...dup.qaList.filter(q => q.q === 'How far is it?')];
    }
  }
  return out;
}

const QUOTAS = {
  'Places to Visit': 24,
  'Food & Drink': 20,
  'Areas of Exploration': 12,
  'Sights & Views': 8,
  'Events & Gigs': 10,
  'Shopping & Culture': 8
};

function withDeadline(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('deadline')), ms))]);
}

/**
 * Builds a full destination object for any place on Earth.
 * @param {{name, country, countryCode, coords, state}} geo
 */
export async function buildLiveDestination(geo, onProgress = () => {}) {
  const destId = slugify(`${geo.name}`) || `place-${Date.now()}`;
  onProgress(25, `Found ${geo.name}${geo.country ? ', ' + geo.country : ''}. Fetching landmarks & local spots…`);

  const osmPromise = fetchOsmPlaces(geo.coords);
  osmPromise.catch(() => {});
  const [voyageRes, wikiRes] = await Promise.allSettled([
    fetchVoyageListings(geo.name),
    fetchWikipediaPlaces(geo.coords, geo.name)
  ]);
  onProgress(60, 'Checking OpenStreetMap for cafés, parks and viewpoints…');
  // OSM is a bonus: don't keep the user waiting if the public servers are busy
  const osmRes = await withDeadline(osmPromise, 7000).then(v => ({ status: 'fulfilled', value: v }), e => ({ status: 'rejected', reason: e }));
  onProgress(80, 'Sorting the best spots and pulling photos…');

  const voyage = voyageRes.status === 'fulfilled' ? voyageRes.value : [];
  const wiki = wikiRes.status === 'fulfilled' ? wikiRes.value : [];
  const osm = osmRes.status === 'fulfilled' ? osmRes.value : [];
  if (voyage.length === 0 && wiki.length === 0 && osm.length === 0) {
    throw new Error("Couldn't reach travel data. Check your internet connection and try again.");
  }

  // Drop Wikivoyage listings that are far outside the area (district pages can wander)
  const voyageNear = voyage.filter(v => !v.coords || haversineKm(geo.coords, v.coords) < 60);

  const built = [...voyageNear, ...wiki, ...osm].map((r, i) => buildPlace(destId, r, i, geo.coords, geo.name));
  const unique = dedupe(built.sort((a, b) => b.score - a.score));

  const byCat = {};
  unique.forEach(p => { (byCat[p.category] = byCat[p.category] || []).push(p); });
  let places = [];
  Object.entries(QUOTAS).forEach(([cat, n]) => { places.push(...(byCat[cat] || []).slice(0, n)); });
  if (places.length < 70) {
    const chosen = new Set(places.map(p => p.id));
    places.push(...unique.filter(p => !chosen.has(p.id)).slice(0, 80 - places.length));
  }
  places = places.map(({ score, ...p }) => p);

  if (places.length === 0) throw new Error(`No places found around ${geo.name}. Try a bigger town nearby.`);

  onProgress(95, `Assembled ${places.length} real places…`);

  const cc = geo.countryCode;
  const sources = [voyage.length && 'Wikivoyage', wiki.length && 'Wikipedia', osm.length && 'OpenStreetMap'].filter(Boolean);
  return {
    id: destId,
    name: geo.name,
    country: geo.country,
    countryCode: cc,
    flag: flagFor(cc),
    tagline: `${places.length} real spots from ${sources.join(', ')}${geo.state ? ' · ' + geo.state : ''}`,
    coords: geo.coords,
    source: 'live',
    builtAt: Date.now(),
    emergency: EMERGENCY[cc] || { police: '112', ambulance: '112' },
    etiquette: [...(COUNTRY_TIPS[cc] || []), ...UNIVERSAL_TIPS],
    weather: null,
    places
  };
}
