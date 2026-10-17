/**
 * DeckManager - swipe deck engine & gesture physics.
 *   Swipe right  → save to trip
 *   Swipe left   → pass
 *   Swipe up     → must-visit (super save)
 *   Swipe down   → maybe later
 *   Tap left/right edge → previous / next photo, tap middle → details
 */

import { imageService } from './imageService.js';
import { getDestination } from './destinationService.js';
import { storage } from './storageService.js';
import { audio } from './audioService.js';
import { groupSwipe } from './groupSwipeService.js';
import { haversineDistance, placeMapsUrl, directionsUrl, formatCost } from './itineraryOptimizer.js';
import { esc, safeUrl, haptic } from '../utils/ui.js';


const STYLE_BOOST = {
  'Culture & Foodie': { 'Places to Visit': 0.6, 'Food & Drink': 0.6, 'Shopping & Culture': 0.3 },
  'Adventurer': { 'Areas of Exploration': 0.8, 'Sights & Views': 0.7 },
  'Family with Kids': { 'Areas of Exploration': 0.6, 'Places to Visit': 0.4, 'Events & Gigs': -0.4 },
  'Luxury & Relaxation': { 'Food & Drink': 0.5, 'Sights & Views': 0.4, 'Shopping & Culture': 0.3 },
  'Backpacker & Budget': { 'Fun Quirks': 0.8, 'Secret Parking': 0.4, 'Food & Drink': 0.3, 'Events & Gigs': 0.3 }
};

const DIRECTIONS = {
  right: { fly: (dx, dy) => `translate3d(${Math.max(dx * 3, 900)}px, ${dy * 2 + 40}px, 0) rotate(28deg)` },
  left: { fly: (dx, dy) => `translate3d(${Math.min(dx * 3, -900)}px, ${dy * 2 + 40}px, 0) rotate(-28deg)` },
  up: { fly: (dx) => `translate3d(${dx * 2}px, -1100px, 0) rotate(${dx * 0.03}deg) scale(1.05)` },
  down: { fly: (dx) => `translate3d(${dx * 2}px, 1100px, 0) rotate(${-dx * 0.03}deg)` }
};

export class DeckManager {
  constructor(options = {}) {
    this.container = options.container;
    this.onSwipe = options.onSwipe || (() => {});
    this.onFlip = options.onFlip || (() => {});
    this.onEmpty = options.onEmpty || (() => {});
    this.onChange = options.onChange || (() => {});
    this.getUserCoords = options.getUserCoords || (() => null);

    this.destinationId = storage.getDestination();
    this.category = 'all';
    this.cards = [];
    this.index = 0;
    this.animating = false;
    this.topEl = null;
  }

  init() {
    this.loadDeck();
  }

  setDestination(destId) {
    this.destinationId = destId;
    this.category = 'all';
    this.loadDeck();
  }

  setCategory(category) {
    this.category = category;
    this.loadDeck();
  }

  get remaining() {
    return Math.max(0, this.cards.length - this.index);
  }

  getActiveCard() {
    return this.cards[this.index] || null;
  }

  // ------------------------------------------------------------- deck build

  /** Learned category affinity from this traveller's swipes. */
  affinity() {
    const aff = {};
    storage.getSwipeHistory().forEach(h => {
      const cat = h.place && h.place.category;
      if (!cat) return;
      const w = h.direction === 'up' ? 1.6 : h.direction === 'right' ? 1 : h.direction === 'down' ? 0.3 : -0.6;
      aff[cat] = (aff[cat] || 0) + w;
    });
    const max = Math.max(1, ...Object.values(aff).map(Math.abs));
    Object.keys(aff).forEach(k => { aff[k] = aff[k] / max; });
    return aff;
  }

  rank(pool) {
    const profile = storage.getProfile();
    const boost = STYLE_BOOST[profile.travelStyle] || {};
    const aff = this.affinity();
    const budget = (profile.budgetTier || '').length <= 1;
    const scored = pool.map(p => {
      let s = (typeof p.rating === 'number' ? p.rating : 4.4) - 4;
      s += boost[p.category] || 0;
      s += (aff[p.category] || 0) * 0.9;
      if (imageService.known(p).length) s += 0.35;
      if (p.isCommunity || p.author) s += 0.35;
      if (budget && (p.priceLevel === 'Free' || p.estimatedCostINR === 0)) s += 0.4;
      s += Math.random() * 1.1; // keep every session fresh
      return { p, s };
    }).sort((a, b) => b.s - a.s).map(x => x.p);

    // Gentle variety: avoid 3 cards of the same category in a row
    const out = [];
    const rest = [...scored];
    while (rest.length) {
      const last2 = out.slice(-2).map(p => p.category);
      let idx = 0;
      if (last2.length === 2 && last2[0] === last2[1]) {
        const alt = rest.findIndex(p => p.category !== last2[0]);
        if (alt > 0) idx = alt;
      }
      out.push(rest.splice(idx, 1)[0]);
    }
    return out;
  }

  loadDeck() {
    const dest = getDestination(this.destinationId);
    this.destinationId = dest.id;
    let pool = dest.places;
    if (this.category !== 'all') pool = pool.filter(p => p.category === this.category);

    const id = dest.id;
    const seen = new Set([
      ...storage.getRejectedPlaces(id).map(p => p.id),
      ...storage.getSavedPlaces(id).map(p => p.id),
      ...storage.getMaybePlaces(id).map(p => p.id)
    ]);
    this.poolSize = pool.length;
    this.cards = this.rank(pool.filter(p => !seen.has(p.id)));
    this.index = 0;
    this.container.innerHTML = '';
    this.topEl = null;
    this.render();
  }

  shuffleDeck() {
    if (this.remaining < 2) return false;
    const rest = this.cards.slice(this.index);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.cards = [...this.cards.slice(0, this.index), ...rest];
    this.container.innerHTML = '';
    this.topEl = null;
    this.render();
    audio.playFlip();
    return true;
  }

  // ---------------------------------------------------------------- render

  render() {
    const visible = this.cards.slice(this.index, this.index + 3);
    this.onChange(this.remaining);

    if (visible.length === 0) {
      this.container.innerHTML = '';
      this.topEl = null;
      this.onEmpty(this.container, { poolSize: this.poolSize, category: this.category });
      return;
    }
    this.container.querySelector('.deck-empty')?.remove();

    // Reuse existing elements so photos never flash between swipes
    const existing = new Map([...this.container.querySelectorAll('.swipe-card')].map(el => [el.dataset.id, el]));
    const keep = new Set(visible.map(p => p.id));
    existing.forEach((el, id) => { if (!keep.has(id) && !el.classList.contains('leaving')) el.remove(); });

    visible.forEach((place, i) => {
      let el = existing.get(place.id);
      if (!el || el.classList.contains('leaving')) {
        el = this.createCardElement(place);
        this.container.prepend(el);
      }
      el.style.zIndex = String(30 - i);
      el.classList.toggle('is-top', i === 0);
      el.dataset.depth = String(i);
      el.style.transition = '';
      el.style.transform = '';
      if (i === 0 && !el._bound) {
        this.attachGestures(el, place);
        el._bound = true;
      }
      if (i === 0) this.topEl = el;
    });

    // Find & preload real photos for the next few cards
    this.cards.slice(this.index + 1, this.index + 6).forEach(p => {
      imageService.resolve(p).then(imgs => {
        if (imgs[0]) { const img = new Image(); img.src = imgs[0]; }
      });
    });
  }

  distanceLabel(place) {
    const me = this.getUserCoords();
    if (!me || place.approxLocation || !place.coords) return '';
    const km = haversineDistance(me, place.coords);
    if (km > 300) return '';
    return km < 1 ? `${Math.round(km * 1000)} m from you` : `${km.toFixed(1)} km from you`;
  }

  createCardElement(place) {
    const el = document.createElement('div');
    el.className = 'swipe-card';
    el.dataset.id = place.id;

    el._images = imageService.known(place);
    el._imageIndex = 0;

    const hyped = !!storage.getHypes()[place.id];
    const hypeCount = (place.hypes || 0) + (hyped ? 1 : 0);
    const price = formatCost(place) || '';
    const near = this.distanceLabel(place);
    const rating = typeof place.rating === 'number' ? `<span class="meta-chip">★ ${place.rating.toFixed(1)}</span>` : '';
    const open = place.openStatus ? `<span class="meta-chip">🕒 ${esc(place.openStatus.split('•')[0].trim().slice(0, 34))}</span>` : '';

    const byline = place.author
      ? `<span class="byline"><span class="byline-avatar">${esc(place.author.avatar || '👤')}</span>${esc(place.author.handle || place.author.name)}</span>`
      : place.source
        ? `<span class="byline">via ${esc(place.source)}</span>`
        : `<span class="byline"><img src="${import.meta.env.BASE_URL}brand/furo-icon-192.png" alt="" class="byline-logo"/>Furo pick</span>`;

    const qaHtml = (place.qaList || []).map(item => {
      const answer = item.link
        ? `<a href="${safeUrl(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.a)}</a>`
        : esc(item.a);
      return `
        <div class="qa-item qa-${esc(item.status || 'tip')}">
          <div class="qa-q"><span class="qa-icon">${esc(item.icon || '💡')}</span>${esc(item.q)}</div>
          <div class="qa-a">${answer}</div>
          ${item.source ? `<div class="qa-src">${esc(item.badge ? item.badge + ' · ' : '')}${esc(item.source)}</div>` : ''}
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="card-noimg">
            <span class="noimg-icon">${esc(place.categoryIcon || '📍')}</span>
            <span class="noimg-text">Finding photos of this place…</span>
          </div>
          <img alt="" class="card-img" draggable="false" />
          <div class="card-shade"></div>
          <div class="story-bar"></div>
          <div class="card-top">
            <span class="glass-pill">${esc(place.categoryIcon)} ${esc(place.subcategory)}</span>
            ${price ? `<span class="glass-pill">${esc(price)}</span>` : ''}
          </div>
          <div class="stamp stamp-right">SAVE</div>
          <div class="stamp stamp-left">PASS</div>
          <div class="stamp stamp-up">MUST GO</div>
          <div class="stamp stamp-down">MAYBE</div>
          <div class="card-body">
            <div class="card-byline-row">
              ${byline}
            </div>
            <h2 class="card-title">${esc(place.name)}</h2>
            <div class="card-meta">
              ${rating}${open}
              <span class="meta-chip">📍 ${esc(near || place.distance || '')}</span>
            </div>
            <p class="card-hook">${esc(place.oneLineHook)}</p>
            <div class="card-foot">
              <div class="card-tags">${(place.tags || []).slice(0, 3).map(t => `<span>#${esc(t)}</span>`).join('')}</div>
              <button class="hype-btn ${hyped ? 'on' : ''}" type="button" aria-label="Hype this spot">🔥 <b>${hypeCount || ''}</b></button>
              <button class="info-btn" type="button" aria-label="Show details">i</button>
            </div>
          </div>
        </div>

        <div class="card-face card-back">
          <div class="back-head">
            <div>
              <span class="back-cat">${esc(place.categoryIcon)} ${esc(place.subcategory)}</span>
              <h3>${esc(place.name)}</h3>
            </div>
            <button class="back-close" type="button" aria-label="Close details">✕</button>
          </div>
          <div class="back-scroll">
            <p class="back-hook">${esc(place.oneLineHook)}</p>
            <div class="facts">
              <div><span>Time needed</span><b>${esc(place.duration || '—')}</b></div>
              <div><span>Best time</span><b>${esc((place.bestTime || '—').split(' for ')[0])}</b></div>
              <div><span>Cost</span><b>${esc(price || 'Not listed')}</b></div>
              <div><span>Hours</span><b>${esc(place.openStatus || '—')}</b></div>
            </div>
            ${qaHtml ? `<h4 class="back-sub">Good to know</h4><div class="qa-list">${qaHtml}</div>` : ''}
            ${place.approxLocation ? '<p class="approx-note">📍 Exact pin not available — Navigate searches by name.</p>' : ''}
          </div>
          <div class="back-actions">
            <a class="btn btn-ghost" href="${safeUrl(directionsUrl(place))}" target="_blank" rel="noopener noreferrer">🧭 Navigate</a>
            <a class="btn btn-ghost" href="${safeUrl(placeMapsUrl(place))}" target="_blank" rel="noopener noreferrer">🗺️ Maps</a>
            <button class="btn btn-primary back-save" type="button">♥ Save</button>
          </div>
        </div>
      </div>
    `;

    const img = el.querySelector('.card-img');
    img.addEventListener('error', () => {
      // Drop a broken photo and fall back to the next one (or the placeholder)
      const bad = img.getAttribute('src');
      this.applyImages(el, (el._images || []).filter(u => u !== bad));
    });
    this.applyImages(el, el._images);
    if (imageService.needsLookup(place)) {
      imageService.resolve(place, { priority: true }).then(imgs => {
        if (el.isConnected) this.applyImages(el, imgs, true);
      });
    }
    return el;
  }

  /** Shows the place's photos on a card, or the no-photo placeholder. */
  applyImages(el, images, done = !imageService.needsLookup(this.cards.find(p => p.id === el.dataset.id) || {})) {
    el._images = (images || []).filter(Boolean);
    if (el._imageIndex >= el._images.length) el._imageIndex = 0;
    const img = el.querySelector('.card-img');
    const has = el._images.length > 0;
    el.classList.toggle('no-photo', !has);
    if (has) {
      const next = el._images[el._imageIndex];
      if (img.getAttribute('src') !== next) img.src = next;
    } else {
      img.removeAttribute('src');
      el.querySelector('.noimg-text').textContent = done ? 'No photo of this place yet' : 'Finding photos of this place…';
    }
    el.querySelector('.story-bar').innerHTML = el._images.length > 1
      ? el._images.map((_, i) => `<span class="${i === el._imageIndex ? 'on' : ''}"></span>`).join('')
      : '';
  }

  setImage(el, idx) {
    const imgs = el._images;
    if (!imgs || imgs.length < 2) {
      el.classList.remove('nudge');
      void el.offsetWidth;
      el.classList.add('nudge');
      return;
    }
    el._imageIndex = (idx + imgs.length) % imgs.length;
    const img = el.querySelector('.card-img');
    img.src = imgs[el._imageIndex];
    el.querySelectorAll('.story-bar span').forEach((s, i) => s.classList.toggle('on', i === el._imageIndex));
    audio.playPhotoTick();
  }

  flip(el = this.topEl) {
    if (!el) return;
    const place = this.cards.find(p => p.id === el.dataset.id);
    const flipped = el.classList.toggle('is-flipped');
    audio.playFlip();
    if (flipped && place) this.onFlip(place);
  }

  // --------------------------------------------------------------- gestures

  attachGestures(el, place) {
    const stop = (sel, fn) => {
      const node = el.querySelector(sel);
      if (!node) return;
      node.addEventListener('pointerdown', e => e.stopPropagation());
      node.addEventListener('click', e => { e.stopPropagation(); fn(e); });
    };

    stop('.info-btn', () => this.flip(el));
    stop('.back-close', () => this.flip(el));
    stop('.back-save', () => this.triggerSwipe('right'));
    stop('.hype-btn', () => {
      const on = storage.toggleHype(place.id);
      const btn = el.querySelector('.hype-btn');
      btn.classList.toggle('on', on);
      const n = (place.hypes || 0) + (on ? 1 : 0);
      btn.querySelector('b').textContent = n || '';
      if (on) { audio.playSwipeRight(); haptic(8); }
    });
    el.querySelectorAll('.back-actions a, .qa-a a').forEach(a => a.addEventListener('pointerdown', e => e.stopPropagation()));

    // Pull down on the details header to close them
    const head = el.querySelector('.back-head');
    let pullStart = null;
    head.addEventListener('pointerdown', e => { pullStart = e.clientY; e.stopPropagation(); });
    head.addEventListener('pointerup', e => {
      if (pullStart !== null && e.clientY - pullStart > 40) this.flip(el);
      pullStart = null;
    });

    let start = null;

    const onDown = (e) => {
      if (this.animating || el.classList.contains('is-flipped')) return;
      if (e.button !== undefined && e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, dy: 0, moved: false };
      const rect = el.getBoundingClientRect();
      start.rect = rect;
      start.pivot = (e.clientY - rect.top) / rect.height > 0.5 ? -1 : 1;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      el.classList.add('dragging');
    };

    const onMove = (e) => {
      if (!start) return;
      start.dx = e.clientX - start.x;
      start.dy = e.clientY - start.y;
      if (!start.moved && Math.hypot(start.dx, start.dy) > 7) start.moved = true;
      if (!start.moved) return;
      const rot = (start.dx / start.rect.width) * 18 * start.pivot;
      el.style.transform = `translate3d(${start.dx}px, ${start.dy}px, 0) rotate(${rot}deg)`;
      this.updateStamps(el, start.dx, start.dy);
      const progress = Math.min(1, Math.hypot(start.dx, start.dy) / 160);
      const next = this.container.querySelector('.swipe-card[data-depth="1"]');
      if (next) next.style.transform = `scale(${0.95 + progress * 0.05}) translateY(${12 - progress * 12}px)`;
    };

    const onUp = (e) => {
      if (!start) return;
      const s = start;
      start = null;
      el.classList.remove('dragging');
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      if (!s.moved) {
        // Tap: edges change photo, centre opens details
        const x = (s.x - s.rect.left) / s.rect.width;
        const y = (s.y - s.rect.top) / s.rect.height;
        if (y > 0.62) { this.flip(el); return; }
        if (x < 0.3) this.setImage(el, el._imageIndex - 1);
        else if (x > 0.7) this.setImage(el, el._imageIndex + 1);
        else this.flip(el);
        return;
      }

      const dt = Math.max(1, performance.now() - s.t);
      const vx = s.dx / dt, vy = s.dy / dt;
      const ax = Math.abs(s.dx), ay = Math.abs(s.dy);
      const thrX = s.rect.width * 0.28;
      const thrY = s.rect.height * 0.2;

      let dir = null;
      if (ay > ax) {
        if (s.dy < -thrY || (vy < -0.55 && ay > 40)) dir = 'up';
        else if (s.dy > thrY || (vy > 0.55 && ay > 40)) dir = 'down';
      } else if (ax > thrX || (Math.abs(vx) > 0.5 && ax > 40)) {
        dir = s.dx > 0 ? 'right' : 'left';
      }

      if (dir) {
        this.commit(dir, s.dx, s.dy);
      } else {
        el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.transform = '';
        this.clearStamps(el);
        const next = this.container.querySelector('.swipe-card[data-depth="1"]');
        if (next) { next.style.transition = 'transform 0.3s ease'; next.style.transform = ''; }
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  }

  updateStamps(el, dx, dy) {
    const set = (cls, v) => { const s = el.querySelector(cls); if (s) s.style.opacity = Math.max(0, Math.min(1, v)).toFixed(2); };
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const vertical = ay > ax;
    set('.stamp-right', !vertical && dx > 0 ? (dx - 20) / 80 : 0);
    set('.stamp-left', !vertical && dx < 0 ? (-dx - 20) / 80 : 0);
    set('.stamp-up', vertical && dy < 0 ? (-dy - 20) / 80 : 0);
    set('.stamp-down', vertical && dy > 0 ? (dy - 20) / 80 : 0);
  }

  clearStamps(el) {
    el.querySelectorAll('.stamp').forEach(s => { s.style.opacity = '0'; });
  }

  // ---------------------------------------------------------------- actions

  /** Button / keyboard entry point. */
  triggerSwipe(direction) {
    const map = { star: 'up', must: 'up' };
    const dir = map[direction] || direction;
    if (!DIRECTIONS[dir]) return;
    const el = this.topEl;
    if (!el || this.animating) return;
    if (el.classList.contains('is-flipped')) el.classList.remove('is-flipped');
    this.updateStamps(el, dir === 'right' ? 120 : dir === 'left' ? -120 : 0, dir === 'up' ? -120 : dir === 'down' ? 120 : 0);
    this.commit(dir, 0, 0);
  }

  commit(dir, dx, dy) {
    const place = this.getActiveCard();
    const el = this.topEl;
    if (!place || !el || this.animating) return;
    this.animating = true;

    el.classList.add('leaving');
    el.style.transition = 'transform 0.38s cubic-bezier(0.2, 0.7, 0.3, 1), opacity 0.38s ease';
    el.style.transform = DIRECTIONS[dir].fly(dx, dy);
    el.style.opacity = '0';

    ({ right: () => audio.playSwipeRight(), left: () => audio.playSwipeLeft(), up: () => audio.playSwipeUp(), down: () => audio.playSwipeDown() })[dir]();
    haptic(dir === 'up' ? 22 : 12);

    this.record(place, dir);
    const match = (dir === 'right' || dir === 'up') ? groupSwipe.registerSwipe(place, dir === 'up' ? 'star' : 'right') : null;

    this.index++;
    this.topEl = null;
    // Promote the next card immediately for a seamless feel
    this.render();
    setTimeout(() => {
      el.remove();
      this.animating = false;
    }, 300);
    this.onSwipe(place, dir, match);
  }

  record(place, dir) {
    const id = this.destinationId;
    const slim = { id: place.id, name: place.name, category: place.category };
    const history = storage.getSwipeHistory();
    history.push({ placeId: place.id, place: slim, direction: dir, destinationId: id, timestamp: Date.now() });
    storage.saveSwipeHistory(history);

    if (dir === 'right' || dir === 'up') {
      const saved = storage.getSavedPlaces();
      const existing = saved.find(p => p.id === place.id);
      const status = dir === 'up' ? 'must_visit' : 'saved';
      if (existing) existing.status = dir === 'up' ? 'must_visit' : existing.status;
      else saved.push({ ...place, status, savedAt: Date.now(), destinationId: id });
      storage.saveSavedPlaces(saved);
      // Moving out of "maybe" if it was there
      storage.saveMaybePlaces(storage.getMaybePlaces().filter(p => p.id !== place.id));
    } else if (dir === 'down') {
      const maybe = storage.getMaybePlaces();
      if (!maybe.some(p => p.id === place.id)) {
        maybe.push({ ...place, savedAt: Date.now(), destinationId: id });
        storage.saveMaybePlaces(maybe);
      }
    } else if (dir === 'left') {
      const rejected = storage.getRejectedPlaces();
      if (!rejected.some(p => p.id === place.id)) {
        rejected.push({ id: place.id, destinationId: id, timestamp: Date.now() });
        storage.saveRejectedPlaces(rejected);
      }
    }
  }

  /** Reverts the last swipe in this destination. Returns the restored place. */
  undo() {
    if (this.animating) return null;
    const all = storage.getSwipeHistory();
    let idx = -1;
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].destinationId === this.destinationId) { idx = i; break; }
    }
    if (idx < 0) return null;
    const last = all.splice(idx, 1)[0];
    storage.saveSwipeHistory(all);

    const pid = last.placeId;
    if (last.direction === 'right' || last.direction === 'up') {
      storage.saveSavedPlaces(storage.getSavedPlaces().filter(p => p.id !== pid));
      storage.removeFromDayPlans(this.destinationId, pid);
    } else if (last.direction === 'down') {
      storage.saveMaybePlaces(storage.getMaybePlaces().filter(p => p.id !== pid));
    } else if (last.direction === 'left') {
      storage.saveRejectedPlaces(storage.getRejectedPlaces().filter(p => p.id !== pid));
    }

    const place = getDestination(this.destinationId).places.find(p => p.id === pid);
    if (!place) return null;

    if (this.index > 0 && this.cards[this.index - 1] && this.cards[this.index - 1].id === pid) {
      this.index--;
    } else {
      this.cards = this.cards.filter((p, i) => i < this.index || p.id !== pid);
      this.cards.splice(this.index, 0, place);
    }
    this.render();
    const el = this.topEl;
    if (el) {
      const from = { right: 'translate3d(600px, 0, 0) rotate(20deg)', left: 'translate3d(-600px, 0, 0) rotate(-20deg)', up: 'translate3d(0, -700px, 0)', down: 'translate3d(0, 700px, 0)' }[last.direction];
      el.style.transition = 'none';
      el.style.transform = from || 'scale(0.8)';
      void el.offsetWidth;
      el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1.1)';
      el.style.transform = '';
    }
    audio.playUndo();
    haptic(8);
    return { place, direction: last.direction };
  }

  /** Drops a place from the remaining deck without reshuffling. */
  removeById(placeId) {
    const i = this.cards.findIndex((p, idx) => idx >= this.index && p.id === placeId);
    if (i < 0) return;
    this.cards.splice(i, 1);
    if (i === this.index && this.topEl) {
      this.topEl.remove();
      this.topEl = null;
    }
    this.render();
  }

  /** Puts a place on top of the deck (e.g. a fresh community drop). */
  insertTop(place) {
    this.cards = this.cards.filter((p, idx) => idx < this.index || p.id !== place.id);
    this.cards.splice(this.index, 0, place);
    this.render();
  }

  openTopInMaps() {
    const place = this.getActiveCard();
    if (place) window.open(placeMapsUrl(place), '_blank', 'noopener');
  }
}
