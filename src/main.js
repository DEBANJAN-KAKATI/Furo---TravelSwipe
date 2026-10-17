/**
 * Furo - main application controller.
 * Discover (swipe deck) → Trip (day planner) → Map, plus bottom sheets for
 * cities, concierge, preferences, group mode, badges, city guide and drops.
 */

import { BADGES } from './data/badges.js';
import { storage } from './services/storageService.js';
import { audio } from './services/audioService.js';
import { DeckManager } from './services/deckManager.js';
import { mapManager, DAY_COLORS } from './services/mapManager.js';
import { groupSwipe } from './services/groupSwipeService.js';
import { AIConcierge } from './services/aiConcierge.js';
import { cityGenerator } from './services/cityGeneratorService.js';
import { reverseGeocode } from './services/placesService.js';
import { getWeather, fallbackWeather } from './services/weatherService.js';
import {
  getDestination, listDestinations, categoriesFor, invalidateDestination,
  repairLegacyData, BUILT_IN_IDS
} from './services/destinationService.js';
import {
  optimizeRouteOrder, autoPlanTrip, generateMultiStopGoogleMapsUrl, calculateDayStats,
  placeMapsUrl, directionsUrl, formatCost
} from './services/itineraryOptimizer.js';
import { esc, safeUrl, toast, haptic, plural, compressImage, getCurrentPosition } from './utils/ui.js';
import { imageService, placeImgSlot } from './services/imageService.js';

const SUGGESTED_CITIES = [
  { name: 'Pondicherry', icon: '🏖️', note: 'curated' },
  { name: 'Goa', icon: '🌴' },
  { name: 'Mumbai', icon: '🏙️' },
  { name: 'Jaipur', icon: '🏰' },
  { name: 'Shillong', icon: '🌲' },
  { name: 'Darjeeling', icon: '⛰️' },
  { name: 'Varanasi', icon: '🪔' },
  { name: 'Paris', icon: '🗼' },
  { name: 'Tokyo', icon: '🏯' }
];

const STYLES = [
  { id: 'Culture & Foodie', em: '🏛️', label: 'Culture & food' },
  { id: 'Adventurer', em: '🧗', label: 'Adventure' },
  { id: 'Family with Kids', em: '👨‍👩‍👧', label: 'Family' },
  { id: 'Luxury & Relaxation', em: '✨', label: 'Luxury' },
  { id: 'Backpacker & Budget', em: '🎒', label: 'Budget' }
];

const VIBES = [
  { id: 'Events & Gigs', em: '🎭', label: 'Event / gig' },
  { id: 'Food & Drink', em: '🍜', label: 'Food spot' },
  { id: 'Sights & Views', em: '🌅', label: 'View' },
  { id: 'Places to Visit', em: '💎', label: 'Hidden gem' },
  { id: 'Fun Quirks', em: '💡', label: 'Local hack' },
  { id: 'Secret Parking', em: '🅿️', label: 'Parking' }
];


const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const IS_WEBSITE = import.meta.env.MODE === 'web';

function telHref(num) {
  const digits = String(num || '').match(/[\d+]+/);
  return digits ? `tel:${digits[0]}` : '#';
}

function mdLite(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
}

class FuroApp {
  constructor() {
    repairLegacyData();
    this.destId = getDestination(storage.getDestination()).id;
    storage.setDestination(this.destId);
    this.view = 'discover';
    this.tripTab = 'saved';
    this.tripDay = 'all';
    this.mapFilter = 'saved';
    this.mapReady = false;
    this.userCoords = null;
    this.weather = null;
    this.sheetOpen = false;
    this.sheetOnClose = null;
    this.chatLog = [];
    this.concierge = new AIConcierge(this.destId);
    this.building = false;
  }

  get dest() {
    return getDestination(this.destId);
  }

  get days() {
    return Math.max(1, Math.min(14, parseInt(storage.getProfile().durationDays, 10) || 3));
  }

  // ===================================================================== init

  init() {
    this.applyTheme(storage.getSettings().theme);
    this.setupTopbar();
    this.setupDeck();
    this.setupTabs();
    this.setupTrip();
    this.setupMapView();
    this.setupSheetChrome();
    this.setupKeyboard();
    this.setupHistory();

    window.addEventListener('furo:storage-error', () => {
      toast('Storage is full — remove an old city or a large photo drop.', { icon: '⚠️', duration: 4000 });
    });

    matchMedia('(min-width: 1000px)').addEventListener('change', () => this.renderSides());

    this.refreshDestinationUI();
    this.loadWeather();
    this.checkBadges(true);

    if (!storage.getSettings().onboarded) this.showOnboarding();
    this.handleDeepLink();
  }

  /** Website links like /app/?city=Goa open straight into that city. */
  handleDeepLink() {
    const params = new URLSearchParams(location.search);
    const city = (params.get('city') || '').trim().slice(0, 80);
    const view = params.get('view');
    if (city || view) history.replaceState(history.state, '', location.pathname);
    if (['trip', 'map'].includes(view)) this.switchView(view);
    if (city) {
      storage.updateSettings({ onboarded: true });
      document.querySelector('.onboard')?.remove();
      this.openCitySheet();
      const input = document.getElementById('city-input');
      if (input) input.value = city;
      this.buildCity(city);
    }
  }

  applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f3f6fb' : '#030817');
    if (this.mapReady) mapManager.setTheme(t);
  }

  // ================================================================== top bar

  setupTopbar() {
    document.getElementById('brand-btn').addEventListener('click', () => this.switchView('discover'));
    document.getElementById('city-pill').addEventListener('click', () => this.openCitySheet());
    document.getElementById('weather-pill').addEventListener('click', () => this.openGuideSheet());
    document.getElementById('btn-concierge').addEventListener('click', () => this.openConcierge());
    document.getElementById('btn-menu').addEventListener('click', () => this.openMenu());
  }

  refreshDestinationUI() {
    const d = this.dest;
    imageService.register(d.places);
    imageService.register([...storage.getSavedPlaces(d.id), ...storage.getMaybePlaces(d.id), ...groupSwipe.getMatches(d.id)]
      .map(p => ({ ...p, cityName: p.cityName || d.name })));
    imageService.primeCity(d);
    document.getElementById('city-flag').textContent = d.flag || '📍';
    document.getElementById('city-name').textContent = d.name;
    document.getElementById('group-dot').hidden = !groupSwipe.isActive;
    this.renderWeatherPill();
    this.renderCategoryChips();
    this.updateCounters();
    this.renderSides();
    if (this.view === 'trip') this.renderTrip();
    if (this.view === 'map') this.renderMap();
  }

  async loadWeather() {
    const d = this.dest;
    this.weather = fallbackWeather(d);
    this.renderWeatherPill();
    const w = await getWeather(d);
    if (d.id !== this.destId) return; // city changed meanwhile
    if (w) this.weather = w;
    this.concierge.setWeather(this.weather);
    this.renderWeatherPill();
    this.renderSides();
  }

  renderWeatherPill() {
    const w = this.weather;
    document.getElementById('weather-icon').textContent = w ? w.icon : '🌤️';
    document.getElementById('weather-temp').textContent = w && w.temp ? w.temp.replace('C', '') : '--°';
  }

  // ===================================================================== deck

  setupDeck() {
    this.deck = new DeckManager({
      container: document.getElementById('deck'),
      getUserCoords: () => this.userCoords,
      onSwipe: (place, dir, match) => this.handleSwipe(place, dir, match),
      onFlip: () => { storage.bumpStat('flips'); this.checkBadges(); },
      onEmpty: (el, info) => this.renderDeckEmpty(el, info),
      onChange: () => this.updateUndoState()
    });
    this.deck.destinationId = this.destId;
    this.deck.init();

    const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
    on('act-pass', () => this.deck.triggerSwipe('left'));
    on('act-save', () => this.deck.triggerSwipe('right'));
    on('act-must', () => this.deck.triggerSwipe('up'));
    on('act-maybe', () => this.deck.triggerSwipe('down'));
    on('act-undo', () => this.undoSwipe());
  }

  undoSwipe() {
    if (this.deck.animating) {
      setTimeout(() => this.undoSwipe(), 320);
      return;
    }
    const res = this.deck.undo();
    if (!res) {
      toast('Nothing to undo yet');
      return;
    }
    const verb = { right: 'save', up: 'must-visit', down: 'maybe', left: 'pass' }[res.direction];
    toast(`Undid ${verb}: ${res.place.name}`, { icon: '↺' });
    this.updateCounters();
    if (this.view === 'trip') this.renderTrip();
  }

  updateUndoState() {
    const hasHistory = storage.getSwipeHistory(this.destId).length > 0;
    document.getElementById('act-undo').disabled = !hasHistory;
    const empty = this.deck && this.deck.remaining === 0;
    ['act-pass', 'act-save', 'act-must', 'act-maybe'].forEach(id => { document.getElementById(id).disabled = empty; });
  }

  handleSwipe(place, dir, match) {
    this.updateCounters();
    if (dir === 'up') {
      toast(`Must-visit: ${place.name}`, { icon: '⭐', action: { label: 'Undo', onClick: () => this.undoSwipe() } });
    } else if (dir === 'down') {
      toast('Parked in Maybe — find it in Trip', { icon: '🔖', action: { label: 'Undo', onClick: () => this.undoSwipe() } });
    } else if (dir === 'right' && storage.getSavedPlaces(this.destId).length === 1) {
      toast('First save! Your picks live in the Trip tab', { icon: '🎒' });
    }
    if (match && match.isMatch) {
      storage.bumpStat('groupMatches');
      const friends = match.voters.filter(v => !v.startsWith('You')).map(v => v.split(' ')[0]);
      setTimeout(() => toast(`Squad match! ${friends.join(' & ')} liked ${place.name} too`, { icon: '🎉', duration: 3500, wait: true }), 350);
    }
    this.checkBadges();
  }

  renderCategoryChips() {
    const el = document.getElementById('category-chips');
    const cats = categoriesFor(this.dest);
    if (!cats.some(c => c.id === this.deck.category)) this.deck.category = 'all';
    el.innerHTML = cats.map(c => `
      <button class="chip ${c.id === this.deck.category ? 'active' : ''}" data-cat="${esc(c.id)}" type="button" role="tab">
        <span>${c.icon}</span><span>${esc(c.label)}</span>
      </button>`).join('') +
      '<button class="chip" id="chip-shuffle" type="button" aria-label="Shuffle deck">🎲 <span>Shuffle</span></button>';

    el.querySelectorAll('[data-cat]').forEach(btn => btn.addEventListener('click', () => {
      el.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('active', b === btn));
      this.deck.setCategory(btn.dataset.cat);
      haptic(6);
    }));
    document.getElementById('chip-shuffle').addEventListener('click', () => {
      if (this.deck.shuffleDeck()) toast('Shuffled the deck', { icon: '🎲' });
    });
  }

  renderDeckEmpty(container, info) {
    const d = this.dest;
    const maybe = storage.getMaybePlaces(d.id).length;
    const passed = storage.getRejectedPlaces(d.id).length;
    const catLabel = categoriesFor(d).find(c => c.id === info.category);
    const filtered = info.category !== 'all';

    container.innerHTML = `
      <div class="deck-empty">
        <div class="big">${filtered ? '🧭' : '🎉'}</div>
        <h3>${filtered ? `That's every ${esc(catLabel ? catLabel.label.toLowerCase() : 'spot')} pick` : `You've seen all of ${esc(d.name)}`}</h3>
        <p>${filtered ? 'Switch back to all categories, or explore another city.' : `Nice work. ${plural(storage.getSavedPlaces(d.id).length, 'place')} saved — plan your days in the Trip tab.`}</p>
        <div class="stack">
          ${filtered ? '<button class="btn btn-primary" data-empty="all" type="button">Show all categories</button>' : '<button class="btn btn-primary" data-empty="trip" type="button">🎒 Plan my trip</button>'}
          ${maybe ? `<button class="btn btn-ghost" data-empty="maybe" type="button">🔖 Review Maybe pile (${maybe})</button>` : ''}
          ${passed ? `<button class="btn btn-ghost" data-empty="passed" type="button">↺ Bring back ${plural(passed, 'passed spot')}</button>` : ''}
          <button class="btn btn-ghost" data-empty="city" type="button">🌍 Explore another city</button>
        </div>
      </div>`;

    container.querySelectorAll('[data-empty]').forEach(btn => btn.addEventListener('click', () => {
      const a = btn.dataset.empty;
      if (a === 'all') { this.deck.setCategory('all'); this.renderCategoryChips(); }
      if (a === 'trip') this.switchView('trip');
      if (a === 'maybe') { this.tripTab = 'maybe'; this.switchView('trip'); }
      if (a === 'passed') this.restorePassed();
      if (a === 'city') this.openCitySheet();
    }));
  }

  restorePassed() {
    const n = storage.getRejectedPlaces(this.destId).length;
    storage.clearPassedForDestination(this.destId);
    this.deck.loadDeck();
    toast(n ? `Brought back ${plural(n, 'passed spot')}` : 'No passed spots in this city', { icon: '↺' });
  }

  updateCounters() {
    const n = storage.getSavedPlaces(this.destId).length;
    const badge = document.getElementById('trip-badge');
    const prev = badge.textContent;
    badge.textContent = n > 0 ? String(n) : '';
    if (prev !== badge.textContent && n > 0) {
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
    this.updateUndoState();
    this.renderSides();
  }

  /** Desktop side panels around the deck (hidden on phones via CSS). */
  renderSides() {
    const left = document.getElementById('side-city');
    const right = document.getElementById('side-trip');
    if (!left || !right || !this.deck || !matchMedia('(min-width: 1000px)').matches) return;
    const d = this.dest;
    const w = this.weather;
    const saved = storage.getSavedPlaces(d.id);
    const maybe = storage.getMaybePlaces(d.id).length;

    left.innerHTML = `
      <div class="panel">
        <div class="city-hero"><span class="flag">${esc(d.flag || '📍')}</span><div><b>${esc(d.name)}</b><small>${esc(d.country || '')}</small></div></div>
        <p>${esc(d.tagline || '')}</p>
        <div class="mini-stats">
          <div><b>${d.places.length}</b><span>spots</span></div>
          <div><b>${this.deck.remaining}</b><span>to swipe</span></div>
          <div><b>${saved.length}</b><span>saved</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-side="city">🌍 Change city</button>
      </div>
      ${w ? `<div class="panel">
        <h4>Weather <small>${w.live ? 'live' : 'typical'}</small></h4>
        <div class="wx-line"><span class="i">${w.icon}</span><div><b>${esc(w.temp)}</b> <span style="color:var(--text-2);font-weight:700;font-size:13px">${esc(w.condition)}</span></div></div>
        <p>${esc(w.advisory || '')}${w.sunset ? ` Sunset ${esc(w.sunset)}.` : ''}</p>
        <button class="btn btn-ghost btn-sm" type="button" data-side="guide">🛟 City guide & safety</button>
      </div>` : ''}
      <div class="panel">
        <h4>Explore more</h4>
        <div class="suggest-chips">${SUGGESTED_CITIES.filter(c => c.name.toLowerCase() !== d.name.toLowerCase()).slice(0, 6).map(c => `<button class="chip" type="button" data-side-city="${esc(c.name)}">${c.icon} ${esc(c.name)}</button>`).join('')}</div>
      </div>`;

    const recent = [...saved].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).slice(0, 6);
    right.innerHTML = `
      <div class="panel">
        <h4>Your trip <small>${plural(saved.length, 'place')}${maybe ? ` · ${maybe} maybe` : ''}</small></h4>
        ${recent.length ? `<div class="side-list">${recent.map(p => `
          <button class="side-item" type="button" data-side-place="${esc(p.id)}">
            ${placeImgSlot(p, 'side-img')}
            <span class="txt"><b>${p.status === 'must_visit' ? '⭐ ' : ''}${esc(p.name)}</b><small>${esc(p.categoryIcon || '')} ${esc(p.subcategory || '')}</small></span>
          </button>`).join('')}</div>` : '<p>Swipe right (or press →) on places you like. They will collect here.</p>'}
        <button class="btn btn-primary btn-sm" type="button" data-side="trip">🎒 Open trip planner</button>
      </div>
      <div class="panel">
        <h4>Keyboard</h4>
        <div class="kbd-grid">
          <kbd>→</kbd><span>Save</span>
          <kbd>←</kbd><span>Pass</span>
          <kbd>↑</kbd><span>Must-visit</span>
          <kbd>↓</kbd><span>Maybe later</span>
          <kbd>Space</kbd><span>Show details</span>
          <kbd>U</kbd><span>Undo</span>
          <kbd>M</kbd><span>Open in Maps</span>
        </div>
      </div>`;

    imageService.hydrate(right);
    const act = { city: () => this.openCitySheet(), guide: () => this.openGuideSheet(), trip: () => this.switchView('trip') };
    [left, right].forEach(panel => {
      panel.querySelectorAll('[data-side]').forEach(b => b.addEventListener('click', () => act[b.dataset.side]()));
      panel.querySelectorAll('[data-side-city]').forEach(b => b.addEventListener('click', () => {
        this.openCitySheet();
        document.getElementById('city-input').value = b.dataset.sideCity;
        this.buildCity(b.dataset.sideCity);
      }));
      panel.querySelectorAll('[data-side-place]').forEach(b => b.addEventListener('click', () => {
        this.openPlaceSheet(saved.find(p => p.id === b.dataset.sidePlace));
      }));
    });
  }

  // ===================================================================== tabs

  setupTabs() {
    document.querySelectorAll('.tab[data-view]').forEach(btn => {
      btn.addEventListener('click', () => this.switchView(btn.dataset.view));
    });
    document.getElementById('btn-drop').addEventListener('click', () => this.openDropSheet());
  }

  switchView(view, opts = {}) {
    if (view === this.view && !opts.force) {
      if (view === 'trip') document.getElementById('trip-scroll').scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const prev = this.view;
    this.view = view;
    document.querySelectorAll('.tab[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));

    // Android back button: leaving Discover pushes a history entry
    if (!opts.fromPop) {
      if (prev === 'discover' && view !== 'discover') history.pushState({ furoView: view }, '');
      else if (view === 'discover' && history.state && history.state.furoView) history.back();
      else if (history.state && history.state.furoView) history.replaceState({ furoView: view }, '');
    }

    if (view === 'trip') this.renderTrip();
    if (view === 'map') this.renderMap();
  }

  setupHistory() {
    window.addEventListener('popstate', () => {
      if (this.ignorePop) {
        this.ignorePop = false;
        return;
      }
      if (this.sheetOpen) {
        this.hideSheet();
        return;
      }
      if (this.view !== 'discover') this.switchView('discover', { fromPop: true });
    });
  }

  // ===================================================================== trip

  setupTrip() {
    document.getElementById('btn-share-trip').addEventListener('click', () => this.shareTrip());
  }

  tripPools() {
    const id = this.destId;
    const saved = storage.getSavedPlaces(id);
    return {
      saved,
      must: saved.filter(p => p.status === 'must_visit'),
      maybe: storage.getMaybePlaces(id),
      squad: groupSwipe.getMatches(id)
    };
  }

  dayPlans() {
    const plans = storage.getDayPlans(this.destId);
    const ids = new Set(storage.getSavedPlaces(this.destId).map(p => p.id));
    const out = {};
    for (let d = 1; d <= this.days; d++) out[`day${d}`] = (plans[`day${d}`] || []).filter(pid => ids.has(pid));
    return out;
  }

  renderTrip() {
    const d = this.dest;
    const pools = this.tripPools();
    const plans = this.dayPlans();
    const planned = new Set(Object.values(plans).flat());
    const stats = calculateDayStats(pools.saved);

    document.getElementById('trip-eyebrow').textContent = `${d.flag || '📍'} Your trip · ${plural(this.days, 'day')}`;
    document.getElementById('trip-title').textContent = d.name;
    document.getElementById('trip-stats').innerHTML = `
      <div class="stat"><b>${pools.saved.length}</b><span>saved</span></div>
      <div class="stat"><b>${planned.size}/${pools.saved.length}</b><span>planned</span></div>
      <div class="stat"><b>${esc(stats.formattedCost)}</b><span>est. cost</span></div>`;

    const tabs = [
      ['saved', 'Saved', pools.saved.length], ['must', '⭐ Must', pools.must.length],
      ['maybe', 'Maybe', pools.maybe.length], ['squad', 'Squad', pools.squad.length]
    ];
    const tabsEl = document.getElementById('trip-tabs');
    tabsEl.innerHTML = tabs.map(([id, label, n]) =>
      `<button type="button" data-tab="${id}" class="${this.tripTab === id ? 'active' : ''}">${label}<span class="n">${n}</span></button>`).join('');
    tabsEl.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      this.tripTab = b.dataset.tab;
      this.renderTrip();
    }));

    const planning = this.tripTab === 'saved' || this.tripTab === 'must';
    const strip = document.getElementById('day-strip');
    const tools = document.getElementById('day-tools');
    strip.hidden = !planning;
    tools.hidden = !planning;

    let list;
    if (planning) {
      if (this.tripDay !== 'all' && this.tripDay !== 'unplanned' && !plans[this.tripDay]) this.tripDay = 'all';
      const base = pools[this.tripTab];
      const dayChips = Object.keys(plans).map((key, i) => `
        <button class="chip ${this.tripDay === key ? 'active' : ''}" data-day="${key}" type="button">
          <span class="day-swatch" style="background:${DAY_COLORS[i % DAY_COLORS.length]}"></span>Day ${i + 1}<span class="count">${plans[key].length}</span>
        </button>`).join('');
      const unplannedCount = pools.saved.filter(p => !planned.has(p.id)).length;
      strip.innerHTML = `
        <button class="chip ${this.tripDay === 'all' ? 'active' : ''}" data-day="all" type="button">All</button>
        ${dayChips}
        <button class="chip ${this.tripDay === 'unplanned' ? 'active' : ''}" data-day="unplanned" type="button">Unplanned<span class="count">${unplannedCount}</span></button>`;
      strip.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => {
        this.tripDay = b.dataset.day;
        this.renderTrip();
      }));

      if (this.tripDay === 'all') {
        list = base;
      } else if (this.tripDay === 'unplanned') {
        list = base.filter(p => !planned.has(p.id));
      } else {
        const byId = new Map(base.map(p => [p.id, p]));
        list = plans[this.tripDay].map(pid => byId.get(pid)).filter(Boolean);
      }
      this.renderDayTools(tools, list, pools.saved, unplannedCount);
    } else {
      list = pools[this.tripTab];
    }

    this.renderTripList(list, plans);
  }

  renderDayTools(el, list, saved, unplannedCount) {
    if (this.tripDay === 'all') {
      el.className = saved.length >= 2 ? 'day-tools' : '';
      el.innerHTML = saved.length >= 2 ? `
        <div class="info"><b>Auto-plan</b> groups nearby places into ${plural(this.days, 'day')} and orders each day by the shortest route. Must-visits go first.</div>
        <button class="btn btn-primary btn-sm" id="btn-autoplan" type="button">✨ Auto-plan ${saved.length} places</button>
        <button class="btn btn-ghost btn-sm" id="btn-days" type="button">📅 ${plural(this.days, 'day')}</button>` : '';
      el.querySelector('#btn-autoplan')?.addEventListener('click', () => this.autoPlan());
      el.querySelector('#btn-days')?.addEventListener('click', () => this.openProfileSheet());
      return;
    }
    el.className = 'day-tools';
    if (this.tripDay === 'unplanned') {
      el.innerHTML = `<div class="info">${unplannedCount ? `<b>${plural(unplannedCount, 'place')}</b> not in a day yet. Pick a day on each one, or auto-plan everything.` : 'Everything is planned. 🎉'}</div>
        ${unplannedCount ? '<button class="btn btn-primary btn-sm" id="btn-autoplan" type="button">✨ Auto-plan</button>' : ''}`;
      el.querySelector('#btn-autoplan')?.addEventListener('click', () => this.autoPlan());
      return;
    }
    const s = calculateDayStats(list);
    const dayNum = this.tripDay.replace('day', '');
    el.innerHTML = list.length ? `
      <div class="info"><b>Day ${dayNum}:</b> ${plural(s.count, 'stop')} · ${s.formattedDistance} between stops · about <b>${s.formattedTime}</b> with visits · ${esc(s.formattedCost)}</div>
      ${list.length > 2 ? '<button class="btn btn-primary btn-sm" id="btn-optimize" type="button">⚡ Shortest order</button>' : ''}
      <a class="btn btn-ghost btn-sm" href="${safeUrl(generateMultiStopGoogleMapsUrl(list))}" target="_blank" rel="noopener noreferrer">🧭 Route in Maps</a>
      <button class="btn btn-ghost btn-sm" id="btn-day-map" type="button">🗺️ Map</button>`
      : `<div class="info">Day ${dayNum} is empty. Set a day on places from <b>All</b> or <b>Unplanned</b>.</div>`;
    el.querySelector('#btn-optimize')?.addEventListener('click', () => this.optimizeDay());
    el.querySelector('#btn-day-map')?.addEventListener('click', () => {
      this.mapFilter = this.tripDay;
      this.switchView('map');
    });
  }

  renderTripList(list, plans) {
    const el = document.getElementById('trip-list');
    const notes = storage.getNotes();
    const visited = storage.getVisited();
    const savedIds = new Set(storage.getSavedPlaces(this.destId).map(p => p.id));
    const inDay = this.tripDay.startsWith('day') && (this.tripTab === 'saved' || this.tripTab === 'must');
    const dayOf = (pid) => Object.keys(plans).find(k => plans[k].includes(pid)) || '';

    if (!list.length) {
      const msg = {
        saved: ['🎒', 'No saved places yet', 'Swipe right on spots you like and they will show up here.'],
        must: ['⭐', 'No must-visits yet', 'Swipe up (or tap ★) on a place you absolutely want to see.'],
        maybe: ['🔖', 'Maybe pile is empty', 'Swipe down on places you are unsure about to park them here.'],
        squad: ['🎉', 'No squad matches yet', groupSwipe.isActive ? 'Keep saving places — matches appear when your squad agrees.' : 'Turn on Swipe Together from the menu to match places with friends.']
      }[this.tripTab];
      const dayEmpty = inDay || this.tripDay === 'unplanned';
      el.innerHTML = `
        <div class="empty">
          <div class="big">${dayEmpty ? '📅' : msg[0]}</div>
          <h3>${dayEmpty ? 'Nothing here' : msg[1]}</h3>
          <p>${dayEmpty ? 'Use the day picker on your saved places, or auto-plan.' : msg[2]}</p>
          <button class="btn btn-primary" id="btn-go-swipe" type="button">Start swiping</button>
        </div>`;
      el.querySelector('#btn-go-swipe').addEventListener('click', () => this.switchView('discover'));
      return;
    }

    const dayOptions = (sel) => `<option value="">Unplanned</option>` +
      Object.keys(plans).map((k, i) => `<option value="${k}" ${sel === k ? 'selected' : ''}>Day ${i + 1}</option>`).join('');

    el.innerHTML = list.map((p, i) => {
      const day = dayOf(p.id);
      const dayIdx = day ? parseInt(day.replace('day', ''), 10) - 1 : -1;
      const isSaved = savedIds.has(p.id);
      const actions = (this.tripTab === 'maybe' || (this.tripTab === 'squad' && !isSaved))
        ? `<button class="mini" data-act="promote" type="button">♥ Save</button>
           ${this.tripTab === 'maybe' ? `<button class="mini" data-act="drop-maybe" type="button" aria-label="Remove">${ICON_TRASH}</button>` : ''}`
        : this.tripTab === 'squad'
          ? '<span class="trip-sub">✓ In your trip</span>'
          : `<select class="day-select" data-act="day" aria-label="Day">${dayOptions(day)}</select>
             ${inDay ? `<button class="mini" data-act="up" type="button" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ICON_UP}</button>
                        <button class="mini" data-act="down" type="button" aria-label="Move down" ${i === list.length - 1 ? 'disabled' : ''}>${ICON_DOWN}</button>` : ''}
             <button class="mini ${visited[p.id] ? 'on' : ''}" data-act="visited" type="button" aria-label="Mark visited">${ICON_CHECK}</button>
             <span class="spacer"></span>
             <button class="mini" data-act="remove" type="button" aria-label="Remove">${ICON_TRASH}</button>`;
      return `
        <div class="trip-item ${p.status === 'must_visit' ? 'must' : ''} ${visited[p.id] ? 'visited' : ''}" data-id="${esc(p.id)}">
          <div class="trip-thumb" data-act="open" style="--pin:${dayIdx >= 0 ? DAY_COLORS[dayIdx % DAY_COLORS.length] : 'var(--brand)'}">
            ${placeImgSlot(p)}
            ${inDay ? `<span class="order">${i + 1}</span>` : dayIdx >= 0 ? `<span class="order">D${dayIdx + 1}</span>` : ''}
          </div>
          <div class="trip-info">
            <h4 data-act="open">${p.status === 'must_visit' ? '<span class="must-star">★</span> ' : ''}${esc(p.name)}</h4>
            <div class="trip-sub">${esc(p.categoryIcon || '')} ${esc(p.subcategory || '')} · ${esc(formatCost(p) || p.duration || '')}</div>
            ${notes[p.id] ? `<div class="trip-note">📝 ${esc(notes[p.id])}</div>` : ''}
            <div class="trip-actions">${actions}</div>
          </div>
        </div>`;
    }).join('');

    imageService.hydrate(el);
    el.querySelectorAll('.trip-item').forEach(row => {
      const pid = row.dataset.id;
      const place = list.find(p => p.id === pid);
      row.querySelectorAll('[data-act]').forEach(ctrl => {
        const act = ctrl.dataset.act;
        if (act === 'day') {
          ctrl.addEventListener('change', () => this.assignDay(pid, ctrl.value));
          return;
        }
        ctrl.addEventListener('click', () => {
          if (act === 'open') this.openPlaceSheet(place);
          if (act === 'remove') this.removeSaved(pid, row);
          if (act === 'visited') this.toggleVisited(pid);
          if (act === 'up' || act === 'down') this.moveInDay(pid, act === 'up' ? -1 : 1);
          if (act === 'promote') this.promoteToSaved(place);
          if (act === 'drop-maybe') {
            storage.saveMaybePlaces(storage.getMaybePlaces().filter(p => p.id !== pid));
            this.renderTrip();
          }
        });
      });
    });
  }

  assignDay(placeId, day) {
    const plans = storage.getDayPlans(this.destId);
    Object.keys(plans).forEach(k => { plans[k] = (plans[k] || []).filter(id => id !== placeId); });
    if (day) {
      plans[day] = plans[day] || [];
      plans[day].push(placeId);
    }
    storage.saveDayPlans(this.destId, plans);
    haptic(6);
    this.renderTrip();
    if (day) toast(`Added to Day ${day.replace('day', '')}`, { icon: '📅' });
  }

  moveInDay(placeId, delta) {
    const plans = storage.getDayPlans(this.destId);
    const arr = plans[this.tripDay] || [];
    const i = arr.indexOf(placeId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    storage.saveDayPlans(this.destId, plans);
    this.renderTrip();
  }

  removeSaved(placeId, rowEl) {
    const saved = storage.getSavedPlaces();
    const place = saved.find(p => p.id === placeId);
    if (!place) return;
    const day = storage.getPlaceDay(this.destId, placeId);
    const dayList = day ? [...(storage.getDayPlans(this.destId)[day] || [])] : null;

    const commit = () => {
      storage.saveSavedPlaces(storage.getSavedPlaces().filter(p => p.id !== placeId));
      storage.removeFromDayPlans(this.destId, placeId);
      this.updateCounters();
      this.renderTrip();
    };
    if (rowEl) { rowEl.classList.add('removing'); setTimeout(commit, 220); } else commit();
    audio.playUndo();

    toast(`Removed ${place.name}`, {
      icon: '🗑️',
      action: {
        label: 'Undo',
        onClick: () => {
          const list = storage.getSavedPlaces();
          if (!list.some(p => p.id === placeId)) list.push(place);
          storage.saveSavedPlaces(list);
          if (day && dayList) {
            const plans = storage.getDayPlans(this.destId);
            plans[day] = dayList;
            storage.saveDayPlans(this.destId, plans);
          }
          this.updateCounters();
          this.renderTrip();
        }
      }
    });
  }

  toggleVisited(placeId) {
    const on = storage.toggleVisited(placeId);
    haptic(on ? 14 : 6);
    if (on) toast('Checked off — nice!', { icon: '✅' });
    this.renderTrip();
    this.checkBadges();
  }

  promoteToSaved(place) {
    const saved = storage.getSavedPlaces();
    if (!saved.some(p => p.id === place.id)) {
      saved.push({ ...place, status: 'saved', savedAt: Date.now(), destinationId: this.destId });
      storage.saveSavedPlaces(saved);
    }
    storage.saveMaybePlaces(storage.getMaybePlaces().filter(p => p.id !== place.id));
    audio.playSwipeRight();
    toast(`Saved ${place.name}`, { icon: '♥' });
    this.updateCounters();
    this.renderTrip();
    this.checkBadges();
  }

  autoPlan() {
    const saved = storage.getSavedPlaces(this.destId);
    if (saved.length < 2) {
      toast('Save at least 2 places to auto-plan', { icon: 'ℹ️' });
      return;
    }
    const before = storage.getDayPlans(this.destId);
    const plans = autoPlanTrip(saved, this.days);
    storage.saveDayPlans(this.destId, plans);
    storage.bumpStat('optimized');
    audio.playMatchFanfare();
    haptic(20);
    this.tripTab = 'saved';
    this.tripDay = 'day1';
    this.renderTrip();
    const used = Object.values(plans).filter(a => a.length).length;
    toast(`Planned ${saved.length} places across ${plural(used, 'day')}`, {
      icon: '✨',
      action: { label: 'Undo', onClick: () => { storage.saveDayPlans(this.destId, before); this.renderTrip(); } }
    });
    this.checkBadges();
  }

  optimizeDay() {
    const plans = storage.getDayPlans(this.destId);
    const saved = storage.getSavedPlaces(this.destId);
    const byId = new Map(saved.map(p => [p.id, p]));
    const ids = (plans[this.tripDay] || []).filter(id => byId.has(id));
    const before = calculateDayStats(ids.map(id => byId.get(id)));
    const optimized = optimizeRouteOrder(ids.map(id => byId.get(id)));
    plans[this.tripDay] = optimized.map(p => p.id);
    storage.saveDayPlans(this.destId, plans);
    const after = calculateDayStats(optimized);
    storage.bumpStat('optimized');
    audio.playMatchFanfare();
    const saving = before.totalDistKm - after.totalDistKm;
    toast(saving > 0.05 ? `Shorter route — saves ${saving.toFixed(1)} km` : 'Already the shortest order', { icon: '⚡' });
    this.renderTrip();
    this.checkBadges();
  }

  buildTripText() {
    const d = this.dest;
    const plans = this.dayPlans();
    const saved = storage.getSavedPlaces(d.id);
    const byId = new Map(saved.map(p => [p.id, p]));
    const notes = storage.getNotes();
    let out = `🧭 My ${d.name} trip — planned with Furo\n\n`;
    Object.keys(plans).forEach((k, i) => {
      const places = plans[k].map(id => byId.get(id)).filter(Boolean);
      if (!places.length) return;
      out += `📅 Day ${i + 1}\n`;
      places.forEach((p, j) => {
        out += `${j + 1}. ${p.status === 'must_visit' ? '⭐ ' : ''}${p.name}${notes[p.id] ? ` — ${notes[p.id]}` : ''}\n`;
      });
      out += `Route: ${generateMultiStopGoogleMapsUrl(places)}\n\n`;
    });
    const planned = new Set(Object.values(plans).flat());
    const rest = saved.filter(p => !planned.has(p.id));
    if (rest.length) {
      out += `📌 ${Object.values(plans).flat().length ? 'Also saved' : 'Saved places'}\n`;
      rest.forEach(p => { out += `• ${p.name} — ${placeMapsUrl(p)}\n`; });
      out += '\n';
    }
    out += `🚨 Emergency: Police ${d.emergency.police} · Ambulance ${d.emergency.ambulance}`;
    return out;
  }

  async shareTrip() {
    if (!storage.getSavedPlaces(this.destId).length) {
      toast('Save a few places first, then share your plan', { icon: 'ℹ️' });
      return;
    }
    const text = this.buildTripText();
    try {
      if (navigator.share) {
        await navigator.share({ title: `My ${this.dest.name} trip`, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Trip plan copied — paste it anywhere', { icon: '📋' });
    } catch (e) {
      toast('Could not share on this device', { icon: '⚠️' });
    }
  }

  // ====================================================================== map

  setupMapView() {
    mapManager.onSave = (placeId) => {
      const place = this.dest.places.find(p => p.id === placeId);
      if (place) {
        this.promoteToSaved(place);
        this.deck.removeById(place.id);
        this.renderMap();
      }
    };
    document.getElementById('btn-locate').addEventListener('click', () => this.locateMe(true));
  }

  ensureMap() {
    if (this.mapReady) return;
    mapManager.init(this.destId, storage.getSettings().theme);
    this.mapReady = true;
  }

  renderMap() {
    this.ensureMap();
    mapManager.setDestination(this.destId);
    const plans = this.dayPlans();
    if (this.mapFilter.startsWith('day') && !(plans[this.mapFilter] || []).length) this.mapFilter = 'saved';
    const chips = [
      ['saved', `♥ Saved`],
      ['all', '✨ All spots'],
      ...Object.keys(plans).filter(k => plans[k].length).map((k, i) => [k, `Day ${k.replace('day', '')}`])
    ];
    const el = document.getElementById('map-chips');
    el.innerHTML = chips.map(([id, label]) => {
      const dayIdx = id.startsWith('day') ? parseInt(id.replace('day', ''), 10) - 1 : -1;
      const sw = dayIdx >= 0 ? `<span class="day-swatch" style="background:${DAY_COLORS[dayIdx % DAY_COLORS.length]}"></span>` : '';
      return `<button class="chip ${this.mapFilter === id ? 'active' : ''}" data-mf="${id}" type="button">${sw}${label}</button>`;
    }).join('');
    el.querySelectorAll('[data-mf]').forEach(b => b.addEventListener('click', () => {
      this.mapFilter = b.dataset.mf;
      this.renderMap();
    }));

    mapManager.filter = this.mapFilter;
    requestAnimationFrame(() => {
      mapManager.map.invalidateSize();
      const res = mapManager.render();
      const status = document.getElementById('map-status');
      if (this.mapFilter === 'saved' && res.total === 0) status.textContent = 'No saved places yet — tap “All spots” to browse';
      else status.textContent = `${plural(res.shown, 'place')} on map${res.hiddenApprox ? ` · ${res.hiddenApprox} without exact pin` : ''}`;
      if (this.userCoords) mapManager.showMe(this.userCoords, false);
    });
  }

  async locateMe(center = false) {
    try {
      toast('Finding you…', { icon: '📍', duration: 1500 });
      this.userCoords = await getCurrentPosition();
      this.concierge.setUserCoords(this.userCoords);
      if (this.mapReady && center) mapManager.showMe(this.userCoords);
      return this.userCoords;
    } catch (e) {
      toast(e.message, { icon: '⚠️', duration: 3500 });
      return null;
    }
  }

  // =================================================================== sheets

  setupSheetChrome() {
    document.getElementById('backdrop').addEventListener('click', () => this.closeSheet());
    document.getElementById('sheet-close').addEventListener('click', () => this.closeSheet());
  }

  openSheet({ title, sub = '', tall = false, render, onClose }) {
    const sheet = document.getElementById('sheet');
    document.getElementById('sheet-title').textContent = title;
    document.getElementById('sheet-sub').textContent = sub;
    sheet.classList.toggle('tall', tall);
    const content = document.getElementById('sheet-content');
    content.innerHTML = '';
    if (this.sheetOnClose) { const fn = this.sheetOnClose; this.sheetOnClose = null; fn(); }
    this.sheetOnClose = onClose || null;
    render(content);
    if (!this.sheetOpen) {
      this.sheetOpen = true;
      history.pushState({ furoSheet: true, furoView: this.view !== 'discover' ? this.view : undefined }, '');
      sheet.classList.add('open');
      document.getElementById('backdrop').classList.add('show');
    }
  }

  closeSheet() {
    if (!this.sheetOpen) return;
    this.hideSheet();
    if (history.state && history.state.furoSheet) {
      this.ignorePop = true;
      history.back();
    }
  }

  hideSheet() {
    this.sheetOpen = false;
    document.getElementById('sheet').classList.remove('open');
    document.getElementById('backdrop').classList.remove('show');
    if (this.sheetOnClose) { const fn = this.sheetOnClose; this.sheetOnClose = null; fn(); }
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  }

  body(content, html, extraClass = '') {
    content.innerHTML = `<div class="sheet-body ${extraClass}">${html}</div>`;
    return content.firstElementChild;
  }

  // -------------------------------------------------------------- city sheet

  openCitySheet() {
    this.openSheet({
      title: 'Where to?',
      sub: 'Search any city in the world — Furo builds a deck of real places',
      tall: true,
      render: (content) => {
        const b = this.body(content, `
          <form class="search-row" id="city-form" autocomplete="off">
            <input type="search" id="city-input" placeholder="Search a city, town or island…" enterkeyhint="search" />
            <button class="btn btn-primary" type="submit" id="city-go">Build</button>
          </form>
          <div id="city-progress"></div>
          <button class="btn btn-ghost btn-block" id="city-near" type="button">📍 Explore near me</button>
          <div class="field-label">Try</div>
          <div class="suggest-chips">${SUGGESTED_CITIES.map(c => `<button class="chip" type="button" data-city="${esc(c.name)}">${c.icon} ${esc(c.name)}</button>`).join('')}</div>
          <div class="field-label">Your cities</div>
          <div class="city-list" id="city-list"></div>
          <p class="note">Live decks use Wikivoyage, Wikipedia and OpenStreetMap. They are saved on your device, so they work offline after the first build.</p>
        `);
        const input = b.querySelector('#city-input');
        b.querySelector('#city-form').addEventListener('submit', (e) => {
          e.preventDefault();
          this.buildCity(input.value);
        });
        b.querySelectorAll('[data-city]').forEach(btn => btn.addEventListener('click', () => {
          input.value = btn.dataset.city;
          this.buildCity(btn.dataset.city);
        }));
        b.querySelector('#city-near').addEventListener('click', () => this.buildNearMe());
        this.renderCityList();
      }
    });
  }

  renderCityList() {
    const el = document.getElementById('city-list');
    if (!el) return;
    const all = listDestinations();
    el.innerHTML = all.map(d => {
      const saved = storage.getSavedPlaces(d.id).length;
      const custom = !BUILT_IN_IDS.includes(d.id);
      return `
        <div class="city-row ${d.id === this.destId ? 'current' : ''}" data-dest="${esc(d.id)}" role="button" tabindex="0">
          <span class="flag">${esc(d.flag || '📍')}</span>
          <span class="txt"><b>${esc(d.name)}</b><small>${esc(d.tagline || d.country || '')}</small></span>
          <span class="count">${d.places.length} spots${saved ? ` · ♥${saved}` : ''}</span>
          ${custom && d.id !== this.destId ? `<button class="del" type="button" data-del="${esc(d.id)}" aria-label="Remove ${esc(d.name)}">✕</button>` : ''}
        </div>`;
    }).join('');
    el.querySelectorAll('.city-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) return;
        this.changeDestination(row.dataset.dest);
        this.closeSheet();
      });
    });
    el.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.armed) {
        storage.deleteCustomDestination(btn.dataset.del);
        invalidateDestination(btn.dataset.del);
        this.renderCityList();
        toast('City removed', { icon: '🗑️' });
      } else {
        btn.dataset.armed = '1';
        btn.textContent = 'Remove?';
        btn.style.width = 'auto';
        btn.style.padding = '0 10px';
        btn.style.color = 'var(--bad)';
        setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = '✕'; btn.style.cssText = ''; } }, 2500);
      }
    }));
  }

  findExistingCity(name) {
    const key = name.trim().toLowerCase();
    return listDestinations().find(d => d.name.toLowerCase() === key || d.id === key.replace(/[^a-z0-9]+/g, '-'));
  }

  async buildCity(rawName, presetGeo = null) {
    const name = (rawName || '').trim();
    if (!name || this.building) {
      if (!name) document.getElementById('city-input')?.focus();
      return;
    }
    const existing = !presetGeo && this.findExistingCity(name);
    if (existing && existing.places.length > 3) {
      this.changeDestination(existing.id);
      this.closeSheet();
      return;
    }
    this.building = true;
    const prog = document.getElementById('city-progress');
    const go = document.getElementById('city-go');
    if (go) go.disabled = true;
    const setProgress = (pct, msg) => {
      if (!prog) return;
      prog.innerHTML = `<div class="build-card"><b>Building ${esc(name)}…</b><p>${esc(msg)}</p><div class="progress"><div style="width:${pct}%"></div></div></div>`;
    };
    setProgress(5, 'Starting…');
    try {
      const dest = await cityGenerator.generateCityDeck(name, setProgress, presetGeo);
      audio.playMatchFanfare();
      this.changeDestination(dest.id);
      this.closeSheet();
      toast(`${dest.name}: ${dest.places.length} places ready to swipe`, { icon: dest.flag || '🌍', duration: 3200 });
      this.checkBadges();
    } catch (err) {
      if (prog) prog.innerHTML = `<div class="error-card">⚠️ ${esc(err.message || 'Something went wrong.')}</div>`;
    } finally {
      this.building = false;
      if (go) go.disabled = false;
    }
  }

  async buildNearMe() {
    const coords = await this.locateMe();
    if (!coords) return;
    const prog = document.getElementById('city-progress');
    if (prog) prog.innerHTML = '<div class="build-card"><b>Finding where you are…</b><div class="progress"><div style="width:8%"></div></div></div>';
    try {
      const geo = await reverseGeocode(coords[0], coords[1]);
      await this.buildCity(geo.name, geo);
    } catch (e) {
      if (prog) prog.innerHTML = `<div class="error-card">⚠️ ${esc(e.message || 'Could not work out your city.')}</div>`;
    }
  }

  changeDestination(destId) {
    if (destId === this.destId) return;
    this.destId = getDestination(destId).id;
    storage.setDestination(this.destId);
    this.concierge.setDestination(this.destId);
    this.chatLog = [];
    this.tripDay = 'all';
    this.mapFilter = 'saved';
    this.deck.setDestination(this.destId);
    this.refreshDestinationUI();
    this.loadWeather();
    if (this.view !== 'discover') this.switchView('discover');
    haptic(10);
  }

  // -------------------------------------------------------------------- menu

  openMenu() {
    const s = storage.getSettings();
    const unlocked = storage.getUnlockedBadges().length;
    const passed = storage.getRejectedPlaces(this.destId).length;
    this.openSheet({
      title: 'Menu',
      render: (content) => {
        const b = this.body(content, `
          <div class="menu-section">Trip</div>
          <div class="menu-list">
            <button class="menu-item" data-m="profile" type="button"><span class="em">🧳</span><span class="txt">Trip preferences<small>${esc(storage.getProfile().travelStyle)} · ${plural(this.days, 'day')}</small></span><span class="val">›</span></button>
            <button class="menu-item" data-m="group" type="button"><span class="em">👥</span><span class="txt">Swipe together<small>${groupSwipe.isActive ? 'On · room ' + esc(groupSwipe.roomCode) : 'Match places with friends'}</small></span><span class="val">›</span></button>
            <button class="menu-item" data-m="badges" type="button"><span class="em">🏆</span><span class="txt">Badges<small>${unlocked} of ${BADGES.length} unlocked</small></span><span class="val">›</span></button>
            <button class="menu-item" data-m="guide" type="button"><span class="em">🛟</span><span class="txt">City guide & safety<small>Weather, emergency numbers, etiquette</small></span><span class="val">›</span></button>
            <button class="menu-item" data-m="share" type="button"><span class="em">↗</span><span class="txt">Share trip plan</span><span class="val">›</span></button>
          </div>
          <div class="menu-section">App</div>
          <div class="menu-list">
            <button class="menu-item" data-m="theme" type="button"><span class="em">🌗</span><span class="txt">Dark mode</span><span class="switch ${s.theme !== 'light' ? 'on' : ''}"></span></button>
            <button class="menu-item" data-m="sound" type="button"><span class="em">🔊</span><span class="txt">Sound effects</span><span class="switch ${!audio.isMuted ? 'on' : ''}"></span></button>
            <button class="menu-item" data-m="haptics" type="button"><span class="em">📳</span><span class="txt">Vibration</span><span class="switch ${s.haptics ? 'on' : ''}"></span></button>
            <button class="menu-item" data-m="help" type="button"><span class="em">👆</span><span class="txt">How to swipe</span><span class="val">›</span></button>
          </div>
          <div class="menu-section">Data</div>
          <div class="menu-list">
            <button class="menu-item" data-m="passed" type="button"><span class="em">↺</span><span class="txt">Bring back passed cards<small>${plural(passed, 'card')} passed in ${esc(this.dest.name)}</small></span></button>
            <button class="menu-item" data-m="reset" type="button"><span class="em">🧹</span><span class="txt">Reset everything<small>Clears trips, cities and settings on this device</small></span></button>
          </div>
          ${IS_WEBSITE ? '<a class="btn btn-ghost btn-block" href="/">🏠 Furo website</a>' : ''}
          <p class="note" style="text-align:center">Furo · Places from Wikivoyage, Wikipedia & OpenStreetMap contributors · Weather by Open-Meteo</p>
        `);
        b.querySelectorAll('[data-m]').forEach(btn => btn.addEventListener('click', () => {
          const m = btn.dataset.m;
          const sw = btn.querySelector('.switch');
          if (m === 'profile') this.openProfileSheet();
          if (m === 'group') this.openGroupSheet();
          if (m === 'badges') this.openBadgesSheet();
          if (m === 'guide') this.openGuideSheet();
          if (m === 'share') { this.closeSheet(); this.shareTrip(); }
          if (m === 'theme') {
            const next = storage.getSettings().theme === 'light' ? 'dark' : 'light';
            storage.updateSettings({ theme: next });
            this.applyTheme(next);
            sw.classList.toggle('on', next === 'dark');
          }
          if (m === 'sound') {
            const muted = audio.toggleMute();
            sw.classList.toggle('on', !muted);
            if (!muted) audio.playSwipeRight();
          }
          if (m === 'haptics') {
            const next = !storage.getSettings().haptics;
            storage.updateSettings({ haptics: next });
            sw.classList.toggle('on', next);
            haptic(15);
          }
          if (m === 'help') { this.closeSheet(); this.showOnboarding(); }
          if (m === 'passed') { this.restorePassed(); this.closeSheet(); }
          if (m === 'reset') {
            if (btn.dataset.armed) {
              storage.resetAll();
              localStorage.removeItem('furo_group_matches');
              location.reload();
            } else {
              btn.dataset.armed = '1';
              btn.querySelector('.txt').innerHTML = '<span style="color:var(--bad)">Tap again to erase everything</span>';
            }
          }
        }));
      }
    });
  }

  // ----------------------------------------------------------------- profile

  openProfileSheet() {
    const p = storage.getProfile();
    let style = p.travelStyle, budget = (p.budgetTier || '₹₹').replace(/\$/g, '₹'), group = p.groupType, days = this.days;
    this.openSheet({
      title: 'Trip preferences',
      sub: 'Furo ranks your deck and plans days around these',
      render: (content) => {
        const b = this.body(content, `
          <div class="field"><span>Travel style</span>
            <div class="choice-grid" id="pf-style">${STYLES.map(s => `<button type="button" class="choice ${s.id === style ? 'active' : ''}" data-v="${esc(s.id)}"><span class="em">${s.em}</span>${esc(s.label)}</button>`).join('')}</div>
          </div>
          <div class="field"><span>Budget</span>
            <div class="seg-control" id="pf-budget">${['₹', '₹₹', '₹₹₹', '₹₹₹₹'].map(v => `<button type="button" class="${v === budget ? 'active' : ''}" data-v="${v}">${v}</button>`).join('')}</div>
          </div>
          <div class="field"><span>Travelling as</span>
            <div class="seg-control" id="pf-group">${['Solo', 'Couple', 'Friends Squad', 'Family'].map(v => `<button type="button" class="${v === group ? 'active' : ''}" data-v="${v}">${v === 'Friends Squad' ? 'Friends' : v}</button>`).join('')}</div>
          </div>
          <div class="field"><span>Trip length</span>
            <div class="stepper"><button type="button" id="pf-minus" aria-label="Fewer days">−</button><b id="pf-days">${plural(days, 'day')}</b><button type="button" id="pf-plus" aria-label="More days">+</button></div>
          </div>
          <button class="btn btn-primary btn-block" id="pf-save" type="button">Save preferences</button>
        `);
        const pick = (sel, cb) => b.querySelectorAll(`${sel} [data-v]`).forEach(btn => btn.addEventListener('click', () => {
          b.querySelectorAll(`${sel} [data-v]`).forEach(x => x.classList.toggle('active', x === btn));
          cb(btn.dataset.v);
        }));
        pick('#pf-style', v => { style = v; });
        pick('#pf-budget', v => { budget = v; });
        pick('#pf-group', v => { group = v; });
        const setDays = (n) => { days = Math.max(1, Math.min(14, n)); b.querySelector('#pf-days').textContent = plural(days, 'day'); };
        b.querySelector('#pf-minus').addEventListener('click', () => setDays(days - 1));
        b.querySelector('#pf-plus').addEventListener('click', () => setDays(days + 1));
        b.querySelector('#pf-save').addEventListener('click', () => {
          storage.saveProfile({ ...storage.getProfile(), travelStyle: style, budgetTier: budget, groupType: group, durationDays: days });
          this.closeSheet();
          this.deck.loadDeck();
          if (this.view === 'trip') this.renderTrip();
          toast('Saved — your deck is re-ranked for you', { icon: '✨' });
        });
      }
    });
  }

  // ------------------------------------------------------------------- group

  openGroupSheet() {
    this.openSheet({
      title: 'Swipe together',
      sub: 'When most of your squad likes a place, it becomes a match',
      render: (content) => {
        const draw = () => {
          const b = this.body(content, `
            <div class="room">
              <div class="note">Room code</div>
              <code>${esc(groupSwipe.roomCode)}</code>
              <div class="members">${groupSwipe.members.map(m => `<span>${m.avatar} ${esc(m.name)}</span>`).join('')}</div>
            </div>
            <button class="btn ${groupSwipe.isActive ? 'btn-ghost' : 'btn-primary'} btn-block" id="grp-toggle" type="button">${groupSwipe.isActive ? 'Turn off group mode' : 'Turn on group mode'}</button>
            <button class="btn btn-ghost btn-block" id="grp-share" type="button">↗ Invite friends</button>
            <p class="note">Preview mode: your squad's votes are simulated on this device based on their interests. Matches show up in Trip → Squad.</p>
          `);
          b.querySelector('#grp-toggle').addEventListener('click', () => {
            const on = groupSwipe.toggleGroupMode();
            document.getElementById('group-dot').hidden = !on;
            toast(on ? 'Group mode on — start swiping!' : 'Group mode off', { icon: '👥' });
            draw();
          });
          b.querySelector('#grp-share').addEventListener('click', async () => {
            const text = `Join my Furo squad for ${this.dest.name}! Room code: ${groupSwipe.roomCode}`;
            try {
              if (navigator.share) { await navigator.share({ title: 'Furo squad', text }); return; }
              await navigator.clipboard.writeText(text);
              toast('Invite copied', { icon: '📋' });
            } catch (e) { /* cancelled */ }
          });
        };
        draw();
      }
    });
  }

  // ------------------------------------------------------------------ badges

  badgeContext() {
    const all = storage.getSavedPlaces();
    const stats = storage.getStats();
    return {
      swipes: storage.getSwipeHistory().length,
      saved: all.length,
      food: all.filter(p => p.category === 'Food & Drink').length,
      heritage: all.filter(p => /(temple|shrine|church|mosque|heritage|palace|fort|cathedral|monastery|sacred|culture)/i.test(`${p.subcategory} ${(p.tags || []).join(' ')}`)).length,
      flips: stats.flips || 0,
      optimized: stats.optimized || 0,
      groupMatches: stats.groupMatches || 0,
      cities: new Set(all.map(p => p.destinationId)).size,
      drops: stats.drops || 0,
      visited: Object.keys(storage.getVisited()).length
    };
  }

  checkBadges(silent = false) {
    const unlocked = new Set(storage.getUnlockedBadges());
    const ctx = this.badgeContext();
    const fresh = BADGES.filter(b => !unlocked.has(b.id)).filter(b => {
      const [cur, target] = b.progress(ctx);
      return cur >= target;
    });
    if (!fresh.length) return;
    fresh.forEach(b => unlocked.add(b.id));
    storage.saveUnlockedBadges([...unlocked]);
    if (silent) return;
    const b = fresh[fresh.length - 1];
    setTimeout(() => {
      audio.playMatchFanfare();
      toast(`Badge unlocked: ${b.title}`, { icon: b.icon, wait: true, duration: 3000 });
    }, 600);
  }

  openBadgesSheet() {
    const unlocked = new Set(storage.getUnlockedBadges());
    const ctx = this.badgeContext();
    this.openSheet({
      title: 'Badges',
      sub: `${unlocked.size} of ${BADGES.length} unlocked`,
      render: (content) => {
        this.body(content, `<div class="badge-grid">${BADGES.map(b => {
          const [cur, target] = b.progress(ctx);
          const on = unlocked.has(b.id);
          return `<div class="badge-card ${on ? 'on' : ''}">
            <div class="em">${b.icon}</div><b>${esc(b.title)}</b><small>${esc(b.desc)}</small>
            <div class="bar"><div style="width:${on ? 100 : Math.round((cur / target) * 100)}%"></div></div>
          </div>`;
        }).join('')}</div>`);
      }
    });
  }

  // ------------------------------------------------------------------- guide

  openGuideSheet() {
    const d = this.dest;
    const w = this.weather;
    const days = w && w.daily ? w.daily.slice(0, 4) : [];
    const dayName = (iso, i) => i === 0 ? 'Today' : i === 1 ? 'Tmrw' : new Date(iso + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' });
    this.openSheet({
      title: `${d.name} guide`,
      sub: w && w.live ? 'Live weather from Open-Meteo' : 'Offline info',
      render: (content) => {
        this.body(content, `
          ${w ? `<div class="now-weather"><span class="i">${w.icon}</span><div><b>${esc(w.temp)}</b> <span style="color:var(--text-2);font-weight:700">${esc(w.condition)}</span>
            <p>${esc(w.advisory || '')}${w.sunset ? ` Sunset ${esc(w.sunset)}.` : ''}</p></div></div>` : ''}
          ${days.length ? `<div class="forecast">${days.map((x, i) => `<div class="fc"><div class="d">${dayName(x.date, i)}</div><div class="i">${x.icon}</div><div class="t">${x.min}° / ${x.max}°</div><div class="r">💧 ${x.rainChance}%</div></div>`).join('')}</div>` : ''}
          <div class="field-label">Emergency</div>
          <div class="sos">
            <a href="${telHref(d.emergency.police)}"><small>🚓 Police</small><b>${esc(d.emergency.police)}</b></a>
            <a href="${telHref(d.emergency.ambulance)}"><small>🚑 Ambulance</small><b>${esc(d.emergency.ambulance)}</b></a>
          </div>
          ${d.emergency.touristHelp ? `<div class="tip-card"><b>📞 Tourist help</b><p>${esc(d.emergency.touristHelp)}</p></div>` : ''}
          ${(d.etiquette || []).length ? `<div class="field-label">Local know-how</div>${d.etiquette.map(e => `<div class="tip-card"><b>${esc(e.icon)} ${esc(e.title)}</b><p>${esc(e.desc)}</p></div>`).join('')}` : ''}
        `);
      }
    });
  }

  // --------------------------------------------------------------- concierge

  openConcierge() {
    this.openSheet({
      title: 'Concierge',
      sub: `Ask anything about ${this.dest.name}`,
      tall: true,
      render: (content) => {
        content.innerHTML = `
          <div class="prompt-chips" id="cc-prompts">${this.concierge.getQuickPrompts().map(p => `<button class="chip" type="button">${esc(p)}</button>`).join('')}</div>
          <div class="sheet-body"><div class="chat" id="cc-chat"></div></div>
          <form class="chat-input" id="cc-form" autocomplete="off">
            <input type="text" id="cc-input" placeholder="e.g. cheap breakfast near the lake" enterkeyhint="send" />
            <button class="btn btn-primary" type="submit">Send</button>
          </form>`;
        const chat = content.querySelector('#cc-chat');
        if (!this.chatLog.length) {
          this.chatLog.push({ role: 'ai', text: `Hi! I know every spot in your ${this.dest.name} deck${this.weather && this.weather.live ? ' and today\'s weather' : ''}. Ask about food, views, rain plans, or say **plan my day**.` });
        }
        this.chatLog.forEach(m => this.renderChatMessage(chat, m));
        content.querySelectorAll('#cc-prompts .chip').forEach(btn => btn.addEventListener('click', () => this.askConcierge(btn.textContent, chat)));
        const input = content.querySelector('#cc-input');
        content.querySelector('#cc-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const q = input.value.trim();
          if (!q) return;
          input.value = '';
          this.askConcierge(q, chat);
        });
        this.scrollChat(chat);
      }
    });
  }

  scrollChat(chat) {
    const scroller = chat.closest('.sheet-body');
    requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; });
  }

  askConcierge(q, chat) {
    const me = { role: 'me', text: q };
    this.chatLog.push(me);
    this.renderChatMessage(chat, me);
    const typing = document.createElement('div');
    typing.className = 'bubble ai typing';
    typing.textContent = 'Thinking…';
    chat.appendChild(typing);
    this.scrollChat(chat);
    setTimeout(() => {
      typing.remove();
      const res = this.concierge.processQuery(q);
      const msg = { role: 'ai', text: res.reply, places: res.places || [], action: res.action };
      this.chatLog.push(msg);
      this.renderChatMessage(chat, msg);
      this.scrollChat(chat);
    }, 380);
  }

  renderChatMessage(chat, m) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${m.role}`;
    bubble.innerHTML = m.role === 'ai' ? mdLite(m.text) : esc(m.text);
    chat.appendChild(bubble);

    if (m.places && m.places.length) {
      const savedIds = new Set(storage.getSavedPlaces(this.destId).map(p => p.id));
      const wrap = document.createElement('div');
      wrap.className = 'suggest-places';
      wrap.innerHTML = m.places.map(p => `
        <div class="sp-row" data-id="${esc(p.id)}">
          ${placeImgSlot(p, 'sp-img')}
          <span class="txt"><b>${esc(p.name)}</b><small>${esc(p.categoryIcon || '')} ${esc(p.subcategory || '')}${p.bestTime ? ' · ' + esc(p.bestTime.split(' for ')[0]) : ''}</small></span>
          <button class="mini ${savedIds.has(p.id) ? 'on' : ''}" type="button" data-save>${savedIds.has(p.id) ? '✓ Saved' : '♥ Save'}</button>
        </div>`).join('');
      wrap.querySelectorAll('.sp-row').forEach(row => {
        const place = m.places.find(p => p.id === row.dataset.id);
        row.querySelector('[data-save]').addEventListener('click', (e) => {
          const btn = e.currentTarget;
          if (btn.classList.contains('on')) return;
          this.promoteToSaved(place);
          this.deck.removeById(place.id);
          btn.classList.add('on');
          btn.textContent = '✓ Saved';
        });
        row.querySelector('.txt').addEventListener('click', () => this.openPlaceSheet(place));
      });
      chat.appendChild(wrap);
      imageService.register(m.places);
      imageService.hydrate(wrap);
    }
    if (m.action && m.action.id === 'autoplan') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.type = 'button';
      btn.style.alignSelf = 'flex-start';
      btn.textContent = m.action.label;
      btn.addEventListener('click', () => {
        this.closeSheet();
        this.switchView('trip');
        this.autoPlan();
      });
      chat.appendChild(btn);
    }
  }

  // ------------------------------------------------------------- place sheet

  openPlaceSheet(place) {
    if (!place) return;
    const savedEntry = () => storage.getSavedPlaces(this.destId).find(p => p.id === place.id);
    this.openSheet({
      title: place.name,
      sub: `${place.categoryIcon || ''} ${place.subcategory || ''}`,
      tall: true,
      render: (content) => {
        const draw = () => {
          const saved = savedEntry();
          const plans = this.dayPlans();
          const day = Object.keys(plans).find(k => plans[k].includes(place.id)) || '';
          const visited = !!storage.getVisited()[place.id];
          const note = storage.getNotes()[place.id] || '';
          const b = this.body(content, `
            <div class="place-hero">${placeImgSlot(place)}${formatCost(place) ? `<span class="glass-pill">${esc(formatCost(place))}</span>` : ''}</div>
            <p class="back-hook">${esc(place.oneLineHook)}</p>
            <div class="btn-row">
              <a class="btn btn-primary" href="${safeUrl(directionsUrl(place))}" target="_blank" rel="noopener noreferrer">🧭 Navigate</a>
              <a class="btn btn-ghost" href="${safeUrl(placeMapsUrl(place))}" target="_blank" rel="noopener noreferrer">🗺️ Maps</a>
            </div>
            ${saved ? `
              <div class="row-2">
                <label class="field"><span>Day</span>
                  <select id="pl-day"><option value="">Unplanned</option>${Object.keys(plans).map((k, i) => `<option value="${k}" ${k === day ? 'selected' : ''}>Day ${i + 1}</option>`).join('')}</select>
                </label>
                <div class="field"><span>Status</span>
                  <button class="btn ${saved.status === 'must_visit' ? 'btn-primary' : 'btn-ghost'}" id="pl-must" type="button">${saved.status === 'must_visit' ? '★ Must-visit' : '☆ Make must-visit'}</button>
                </div>
              </div>
              <button class="btn ${visited ? 'btn-primary' : 'btn-ghost'} btn-block" id="pl-visited" type="button">${visited ? '✓ Visited' : 'Mark as visited'}</button>
              <label class="field"><span>My notes</span>
                <textarea id="pl-note" placeholder="Booking refs, what to order, who to meet…" maxlength="400">${esc(note)}</textarea>
                <small id="pl-note-status">Saved automatically</small>
              </label>` : `
              <button class="btn btn-primary btn-block" id="pl-save" type="button">♥ Save to my trip</button>`}
            <div class="facts">
              <div><span>Time needed</span><b>${esc(place.duration || '—')}</b></div>
              <div><span>Best time</span><b>${esc((place.bestTime || '—').split(' for ')[0])}</b></div>
              <div><span>Hours</span><b>${esc(place.openStatus || '—')}</b></div>
              <div><span>Where</span><b>${esc(place.distance || '—')}</b></div>
            </div>
            ${(place.qaList || []).length ? `<h4 class="back-sub">Good to know</h4><div class="qa-list">${place.qaList.map(item => `
              <div class="qa-item qa-${esc(item.status || 'tip')}">
                <div class="qa-q"><span class="qa-icon">${esc(item.icon || '💡')}</span>${esc(item.q)}</div>
                <div class="qa-a">${item.link ? `<a href="${safeUrl(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.a)}</a>` : esc(item.a)}</div>
                ${item.source ? `<div class="qa-src">${esc(item.source)}</div>` : ''}
              </div>`).join('')}</div>` : ''}
            ${saved ? `<button class="btn btn-danger btn-block" id="pl-remove" type="button">Remove from trip</button>` : ''}
          `);

          imageService.register([place]);
          imageService.hydrate(b);
          b.querySelector('#pl-save')?.addEventListener('click', () => {
            this.promoteToSaved(place);
            this.deck.removeById(place.id);
            draw();
          });
          b.querySelector('#pl-day')?.addEventListener('change', (e) => this.assignDay(place.id, e.target.value));
          b.querySelector('#pl-must')?.addEventListener('click', () => {
            const list = storage.getSavedPlaces();
            const entry = list.find(p => p.id === place.id);
            if (entry) entry.status = entry.status === 'must_visit' ? 'saved' : 'must_visit';
            storage.saveSavedPlaces(list);
            haptic(10);
            draw();
            if (this.view === 'trip') this.renderTrip();
          });
          b.querySelector('#pl-visited')?.addEventListener('click', () => { this.toggleVisited(place.id); draw(); });
          const noteEl = b.querySelector('#pl-note');
          if (noteEl) {
            let t;
            noteEl.addEventListener('input', () => {
              clearTimeout(t);
              b.querySelector('#pl-note-status').textContent = 'Saving…';
              t = setTimeout(() => {
                storage.setNote(place.id, noteEl.value);
                b.querySelector('#pl-note-status').textContent = 'Saved ✓';
              }, 400);
            });
            noteEl.addEventListener('blur', () => { storage.setNote(place.id, noteEl.value); });
          }
          b.querySelector('#pl-remove')?.addEventListener('click', () => {
            this.closeSheet();
            this.removeSaved(place.id);
          });
        };
        draw();
      },
      onClose: () => {
        const noteEl = document.getElementById('pl-note');
        if (noteEl) storage.setNote(place.id, noteEl.value);
        if (this.view === 'trip') this.renderTrip();
      }
    });
  }

  // -------------------------------------------------------------- drop spot

  openDropSheet() {
    const d = this.dest;
    const settings = storage.getSettings();
    let vibe = VIBES[0];
    let photo = '';
    let where = 'me';
    this.openSheet({
      title: 'Drop a spot',
      sub: `Share a gem, event or hack in ${d.name}`,
      tall: true,
      render: (content) => {
        const b = this.body(content, `
          <label class="field"><span>Name *</span><input id="dr-name" maxlength="70" placeholder="e.g. Rooftop jam at Church Street" /></label>
          <div class="field"><span>What is it?</span>
            <div class="choice-grid" id="dr-vibe">${VIBES.map((v, i) => `<button type="button" class="choice ${i === 0 ? 'active' : ''}" data-v="${i}"><span class="em">${v.em}</span>${esc(v.label)}</button>`).join('')}</div>
          </div>
          <label class="field"><span>Why go? *</span><input id="dr-hook" maxlength="140" placeholder="One punchy line — e.g. ₹20 chai with a river view" /></label>
          <div class="row-2">
            <label class="field"><span>Area *</span><input id="dr-area" maxlength="60" placeholder="Neighbourhood / landmark" /></label>
            <label class="field"><span>When</span><input id="dr-time" maxlength="40" placeholder="Fri 8 PM · 24/7" /></label>
          </div>
          <div class="field"><span>Location</span>
            <div class="seg-control" id="dr-where">
              <button type="button" class="active" data-v="me">📍 I'm here now</button>
              <button type="button" data-v="area">🔎 Search by area</button>
            </div>
            <small id="dr-where-note">Uses your GPS so the pin lands exactly here.</small>
          </div>
          <div class="field"><span>Photo</span>
            <button class="photo-zone" id="dr-photo" type="button"><span id="dr-photo-hint">📸 Add a photo you took here</span><img id="dr-photo-img" alt="" hidden /></button>
            <input type="file" id="dr-file" accept="image/*" hidden />
            <small>Optional. Without one, Furo shows real photos of this spot when it can find them.</small>
          </div>
          <label class="field"><span>Your handle</span><input id="dr-author" maxlength="30" value="${esc(settings.handle || '@local_legend')}" /></label>
          <button class="btn btn-primary btn-block" id="dr-submit" type="button">🚀 Drop it on the deck & map</button>
        `);
        b.querySelectorAll('#dr-vibe [data-v]').forEach(btn => btn.addEventListener('click', () => {
          b.querySelectorAll('#dr-vibe [data-v]').forEach(x => x.classList.toggle('active', x === btn));
          vibe = VIBES[+btn.dataset.v];
        }));
        b.querySelectorAll('#dr-where [data-v]').forEach(btn => btn.addEventListener('click', () => {
          b.querySelectorAll('#dr-where [data-v]').forEach(x => x.classList.toggle('active', x === btn));
          where = btn.dataset.v;
          b.querySelector('#dr-where-note').textContent = where === 'me'
            ? 'Uses your GPS so the pin lands exactly here.'
            : 'No GPS needed — Navigate will search Google Maps for the area you typed.';
        }));
        const img = b.querySelector('#dr-photo-img');
        const file = b.querySelector('#dr-file');
        b.querySelector('#dr-photo').addEventListener('click', () => file.click());
        file.addEventListener('change', async () => {
          const f = file.files && file.files[0];
          if (!f) return;
          try {
            photo = await compressImage(f);
            img.src = photo;
            img.hidden = false;
            b.querySelector('#dr-photo-hint').hidden = true;
          } catch (e) {
            toast(e.message, { icon: '⚠️' });
          }
        });
        b.querySelector('#dr-submit').addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const val = (id) => b.querySelector(id).value.trim();
          const name = val('#dr-name'), hook = val('#dr-hook'), area = val('#dr-area');
          const timing = val('#dr-time') || 'Anytime';
          const author = val('#dr-author') || '@local_legend';
          const missing = !name ? '#dr-name' : !hook ? '#dr-hook' : !area ? '#dr-area' : null;
          if (missing) {
            const el = b.querySelector(missing);
            el.focus();
            el.style.borderColor = 'var(--bad)';
            setTimeout(() => { el.style.borderColor = ''; }, 1500);
            toast('Fill in the name, why go, and area', { icon: '✏️' });
            return;
          }
          let coords = null;
          if (where === 'me') {
            btn.disabled = true;
            btn.textContent = 'Getting your location…';
            coords = await this.locateMe();
            btn.disabled = false;
            btn.textContent = '🚀 Drop it on the deck & map';
            if (!coords) return;
          }
          const handle = author.startsWith('@') ? author : `@${author}`;
          storage.updateSettings({ handle });
          const spot = {
            id: `ugc-${Date.now()}`,
            name,
            category: vibe.id,
            categoryIcon: vibe.em,
            subcategory: vibe.label,
            rating: null,
            priceLevel: '',
            distance: `${area}, ${d.name}`,
            openStatus: timing,
            bestTime: timing,
            duration: '1 - 2 hours',
            heroImage: photo,
            images: photo ? [photo] : [],
            cityName: d.name,
            oneLineHook: hook,
            coords: coords || d.coords,
            approxLocation: !coords,
            mapsQuery: `${area}, ${d.name}`,
            destinationId: d.id,
            tags: [vibe.label.replace(/\s+/g, ''), 'CommunityDrop'],
            author: { name: handle.slice(1), handle, avatar: vibe.em, role: 'Local' },
            hypes: 0,
            qaList: [
              { q: 'Who shared this?', a: `Dropped by ${handle} on Furo`, icon: '👤', status: 'verified', source: 'Community' },
              { q: 'When?', a: timing, icon: '⏰', status: 'tip', source: 'Community' },
              { q: 'Where?', a: `${area}, ${d.name}`, icon: '📍', status: 'tip', source: 'Community' }
            ]
          };
          if (!storage.saveCommunitySpot(spot)) return;
          storage.bumpStat('drops');
          invalidateDestination(d.id);
          this.closeSheet();
          this.renderCategoryChips();
          const fresh = getDestination(d.id).places.find(p => p.id === spot.id);
          if (fresh) this.deck.insertTop(fresh);
          this.switchView('discover');
          audio.playMatchFanfare();
          toast(`"${name}" is live on your deck & map`, { icon: '🚀' });
          this.checkBadges();
        });
      }
    });
  }

  // -------------------------------------------------------------- onboarding

  showOnboarding() {
    const el = document.createElement('div');
    el.className = 'onboard';
    el.innerHTML = `
      <img class="logo brand-logo-light" src="${asset('brand/furo-wordmark-light.png')}" alt="Furo" />
      <img class="logo brand-logo-dark" src="${asset('brand/furo-wordmark-dark.png')}" alt="Furo" />
      <h2>Swipe your way<br/>through any city</h2>
      <p>Real places, real photos. Save what you love, and Furo turns it into a day-by-day plan.</p>
      <div class="gestures">
        <div class="gesture"><div class="em">👉</div><b>Swipe right</b><small>Save to trip</small></div>
        <div class="gesture"><div class="em">👈</div><b>Swipe left</b><small>Pass</small></div>
        <div class="gesture"><div class="em">👆</div><b>Swipe up</b><small>Must-visit ⭐</small></div>
        <div class="gesture"><div class="em">👇</div><b>Swipe down</b><small>Maybe later</small></div>
      </div>
      <p style="font-size:13px">Tap a card's edges to flip photos · tap the middle for details</p>
      <button class="btn btn-primary" type="button">Start exploring</button>`;
    document.body.appendChild(el);
    el.querySelector('.btn').addEventListener('click', () => {
      storage.updateSettings({ onboarded: true });
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    });
  }

  // ---------------------------------------------------------------- keyboard

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.sheetOpen) { this.closeSheet(); return; }
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (this.sheetOpen || this.view !== 'discover' || document.querySelector('.onboard')) return;
      const keys = {
        ArrowRight: () => this.deck.triggerSwipe('right'),
        ArrowLeft: () => this.deck.triggerSwipe('left'),
        ArrowUp: () => this.deck.triggerSwipe('up'),
        ArrowDown: () => this.deck.triggerSwipe('down'),
        ' ': () => this.deck.flip(),
        Enter: () => this.deck.flip(),
        u: () => this.undoSwipe(),
        U: () => this.undoSwipe(),
        m: () => this.deck.openTopInMaps()
      };
      if (keys[e.key]) {
        e.preventDefault();
        keys[e.key]();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new FuroApp();
  app.init();
  window.furo = app;
});
