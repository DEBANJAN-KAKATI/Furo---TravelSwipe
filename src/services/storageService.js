/**
 * StorageService - LocalStorage persistence for Furo.
 * Everything that belongs to a trip (saved, maybe, passed, day plans) is
 * scoped by destination so switching cities never mixes itineraries.
 */

const PREFIX = 'furo_';
const LEGACY_PREFIX = 'travelswipe_';

const KEYS = {
  DESTINATION: 'dest',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  SAVED_PLACES: 'saved',
  REJECTED_PLACES: 'rejected',
  MAYBE_PLACES: 'maybe',
  SWIPE_HISTORY: 'history',
  DAY_PLANS: 'day_plans_v2',
  UNLOCKED_BADGES: 'badges',
  NOTES: 'notes',
  VISITED: 'visited',
  COMMUNITY_SPOTS: 'community_spots',
  HYPES: 'hypes_v2',
  CUSTOM_DESTINATIONS: 'custom_destinations',
  WEATHER_CACHE: 'weather_cache',
  STATS: 'stats'
};

const MAX_HISTORY = 300;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Quota exceeded (usually large photos) - let the UI know
    window.dispatchEvent(new CustomEvent('furo:storage-error', { detail: e }));
    return false;
  }
}

class StorageService {
  constructor() {
    this.migrateLegacy();
  }

  /** One-time copy of TravelSwipe data so existing users keep their trips. */
  migrateLegacy() {
    try {
      if (localStorage.getItem(PREFIX + 'migrated') === '1') return;
      const legacyMap = {
        dest: 'dest', profile: 'profile', saved: 'saved', rejected: 'rejected',
        maybe: 'maybe', history: 'history', badges: 'badges',
        community_spots: 'community_spots', custom_destinations: 'custom_destinations'
      };
      Object.entries(legacyMap).forEach(([legacy, next]) => {
        const val = localStorage.getItem(LEGACY_PREFIX + legacy);
        if (val !== null && localStorage.getItem(PREFIX + next) === null) {
          if (legacy === 'dest') {
            localStorage.setItem(PREFIX + next, JSON.stringify(val));
          } else {
            localStorage.setItem(PREFIX + next, val);
          }
        }
      });
      const muted = localStorage.getItem(LEGACY_PREFIX + 'muted');
      if (muted !== null) {
        const s = read(KEYS.SETTINGS, {});
        s.muted = muted === 'true';
        write(KEYS.SETTINGS, s);
      }
      localStorage.setItem(PREFIX + 'migrated', '1');
    } catch (e) { /* storage unavailable */ }
  }

  // ---------------------------------------------------------------- basics
  getDestination() {
    return read(KEYS.DESTINATION, 'bengaluru') || 'bengaluru';
  }

  setDestination(destId) {
    write(KEYS.DESTINATION, destId);
  }

  getProfile() {
    return {
      travelStyle: 'Culture & Foodie',
      budgetTier: '₹₹',
      groupType: 'Couple',
      durationDays: 3,
      ...read(KEYS.PROFILE, {})
    };
  }

  saveProfile(profile) {
    write(KEYS.PROFILE, profile);
  }

  getSettings() {
    return {
      theme: 'dark',
      muted: false,
      haptics: true,
      onboarded: false,
      ...read(KEYS.SETTINGS, {})
    };
  }

  updateSettings(patch) {
    const next = { ...this.getSettings(), ...patch };
    write(KEYS.SETTINGS, next);
    return next;
  }

  getStats() {
    return { flips: 0, optimized: 0, groupMatches: 0, drops: 0, ...read(KEYS.STATS, {}) };
  }

  bumpStat(name, by = 1) {
    const s = this.getStats();
    s[name] = (s[name] || 0) + by;
    write(KEYS.STATS, s);
    return s[name];
  }

  // ------------------------------------------------------------- trip lists
  getSavedPlaces(destId = null) {
    const list = read(KEYS.SAVED_PLACES, []);
    return destId ? list.filter(p => p.destinationId === destId) : list;
  }

  saveSavedPlaces(list) {
    write(KEYS.SAVED_PLACES, list);
  }

  getMaybePlaces(destId = null) {
    const list = read(KEYS.MAYBE_PLACES, []);
    return destId ? list.filter(p => p.destinationId === destId) : list;
  }

  saveMaybePlaces(list) {
    write(KEYS.MAYBE_PLACES, list);
  }

  getRejectedPlaces(destId = null) {
    const list = read(KEYS.REJECTED_PLACES, []);
    return destId ? list.filter(p => !p.destinationId || p.destinationId === destId) : list;
  }

  saveRejectedPlaces(list) {
    write(KEYS.REJECTED_PLACES, list);
  }

  getSwipeHistory(destId = null) {
    const list = read(KEYS.SWIPE_HISTORY, []);
    return destId ? list.filter(h => h.destinationId === destId) : list;
  }

  saveSwipeHistory(history) {
    // Keep history light: no full place objects older than the cap
    write(KEYS.SWIPE_HISTORY, history.slice(-MAX_HISTORY));
  }

  // -------------------------------------------------------------- day plans
  getAllDayPlans() {
    return read(KEYS.DAY_PLANS, {});
  }

  getDayPlans(destId) {
    const all = this.getAllDayPlans();
    return all[destId] || {};
  }

  saveDayPlans(destId, plans) {
    const all = this.getAllDayPlans();
    all[destId] = plans;
    write(KEYS.DAY_PLANS, all);
  }

  /** Returns 'day1'.. or null */
  getPlaceDay(destId, placeId) {
    const plans = this.getDayPlans(destId);
    return Object.keys(plans).find(d => (plans[d] || []).includes(placeId)) || null;
  }

  removeFromDayPlans(destId, placeId) {
    const plans = this.getDayPlans(destId);
    Object.keys(plans).forEach(d => {
      plans[d] = (plans[d] || []).filter(id => id !== placeId);
    });
    this.saveDayPlans(destId, plans);
  }

  // ---------------------------------------------------------- notes & visits
  getNotes() {
    return read(KEYS.NOTES, {});
  }

  setNote(placeId, text) {
    const notes = this.getNotes();
    if (text && text.trim()) notes[placeId] = text.trim();
    else delete notes[placeId];
    write(KEYS.NOTES, notes);
  }

  getVisited() {
    return read(KEYS.VISITED, {});
  }

  toggleVisited(placeId) {
    const v = this.getVisited();
    if (v[placeId]) delete v[placeId];
    else v[placeId] = Date.now();
    write(KEYS.VISITED, v);
    return !!v[placeId];
  }

  // ------------------------------------------------------------ gamification
  getUnlockedBadges() {
    return read(KEYS.UNLOCKED_BADGES, []);
  }

  saveUnlockedBadges(badges) {
    write(KEYS.UNLOCKED_BADGES, badges);
  }

  // --------------------------------------------------------------- community
  getCommunitySpots(destinationId = null) {
    const list = read(KEYS.COMMUNITY_SPOTS, []);
    if (destinationId) {
      return list.filter(spot => spot.destinationId === destinationId);
    }
    return list;
  }

  saveCommunitySpot(spot) {
    const list = this.getCommunitySpots();
    list.unshift(spot);
    return write(KEYS.COMMUNITY_SPOTS, list);
  }

  getHypes() {
    return read(KEYS.HYPES, {});
  }

  /** Toggle a hype; returns true when the place is now hyped. */
  toggleHype(spotId) {
    const hypes = this.getHypes();
    if (hypes[spotId]) delete hypes[spotId];
    else hypes[spotId] = 1;
    write(KEYS.HYPES, hypes);
    return !!hypes[spotId];
  }

  // ------------------------------------------------------- custom destinations
  getCustomDestinations() {
    return read(KEYS.CUSTOM_DESTINATIONS, {});
  }

  saveCustomDestinations(dests) {
    return write(KEYS.CUSTOM_DESTINATIONS, dests);
  }

  deleteCustomDestination(destId) {
    const all = this.getCustomDestinations();
    delete all[destId];
    this.saveCustomDestinations(all);
  }

  // ---------------------------------------------------------------- weather
  getWeatherCache() {
    return read(KEYS.WEATHER_CACHE, {});
  }

  saveWeatherCache(cache) {
    write(KEYS.WEATHER_CACHE, cache);
  }

  // ------------------------------------------------------------------ resets
  /** Brings passed cards back for one destination only. */
  clearPassedForDestination(destId) {
    this.saveRejectedPlaces(this.getRejectedPlaces().filter(p => p.destinationId && p.destinationId !== destId));
    this.saveSwipeHistory(this.getSwipeHistory().filter(h => h.destinationId !== destId));
  }

  resetAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(PREFIX + 'migrated', '1');
  }
}

export const storage = new StorageService();
