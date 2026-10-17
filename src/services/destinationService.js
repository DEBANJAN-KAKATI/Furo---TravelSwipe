/**
 * DestinationService - single source of truth for destination data.
 * Merges built-in cities, generated cities and community drops, and
 * normalises categories so filters work the same everywhere.
 */

import { DESTINATIONS, CATEGORIES, CATEGORY_ALIASES } from '../data/destinations.js';
import { storage } from './storageService.js';

export const BUILT_IN_IDS = ['bengaluru', 'guwahati'];

const CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id));
const CATEGORY_ICONS = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]));

export function normalizeCategory(cat) {
  if (!cat) return 'Places to Visit';
  if (CATEGORY_IDS.has(cat)) return cat;
  return CATEGORY_ALIASES[cat] || 'Places to Visit';
}

export function categoryIcon(cat) {
  return CATEGORY_ICONS[normalizeCategory(cat)] || '📍';
}

function normalizePlace(place, destId, cityName) {
  return {
    rating: 4.5,
    reviewsCount: 0,
    tags: [],
    qaList: [],
    duration: '1 - 2 hours',
    bestTime: 'Anytime',
    openStatus: 'Hours not listed',
    distance: '',
    oneLineHook: '',
    ...place,
    category: normalizeCategory(place.category),
    categoryIcon: place.categoryIcon || categoryIcon(place.category),
    subcategory: place.subcategory || place.category || 'Spot',
    destinationId: destId,
    cityName: place.cityName || cityName
  };
}

const cache = new Map();

export function invalidateDestination(destId) {
  if (destId) cache.delete(destId);
  else cache.clear();
}

export function getRawDestination(destId) {
  const custom = storage.getCustomDestinations();
  return custom[destId] || DESTINATIONS[destId] || null;
}

/** Returns a destination with normalized places (community drops first). */
export function getDestination(destId) {
  if (cache.has(destId)) return cache.get(destId);
  const raw = getRawDestination(destId) || DESTINATIONS.bengaluru;
  const id = raw.id;
  const community = storage.getCommunitySpots(id).map(p => normalizePlace({ ...p, isCommunity: true }, id, raw.name));
  const places = [...community, ...(raw.places || []).map(p => normalizePlace(p, id, raw.name))];
  const dest = {
    weather: null,
    etiquette: [],
    emergency: { police: '112', ambulance: '108' },
    flag: '📍',
    country: '',
    tagline: '',
    ...raw,
    places
  };
  cache.set(id, dest);
  return dest;
}

export function listDestinations() {
  const custom = storage.getCustomDestinations();
  const ids = [...BUILT_IN_IDS, ...Object.keys(custom).filter(id => !BUILT_IN_IDS.includes(id))];
  return ids.map(id => getDestination(id));
}

export function findPlaceAnywhere(placeId) {
  for (const d of listDestinations()) {
    const p = d.places.find(pl => pl.id === placeId);
    if (p) return p;
  }
  return null;
}

/** Categories that actually exist in a destination, with counts. */
export function categoriesFor(dest) {
  const counts = {};
  dest.places.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  return CATEGORIES
    .filter(c => c.id === 'all' || counts[c.id])
    .map(c => ({ ...c, count: c.id === 'all' ? dest.places.length : counts[c.id] }));
}

/**
 * Fixes data saved by older versions: entries without destinationId, flat
 * day plans and categories that the filters didn't know about.
 */
export function repairLegacyData() {
  const destOf = (placeId) => {
    for (const d of listDestinations()) {
      if (d.places.some(p => p.id === placeId)) return d.id;
    }
    if (placeId.startsWith('blr-')) return 'bengaluru';
    if (placeId.startsWith('ghy-')) return 'guwahati';
    return null;
  };

  const fixList = (list) => {
    let changed = false;
    const out = list.map(item => {
      const pid = item.id || item.placeId;
      let next = item;
      if (!item.destinationId && pid) {
        const did = destOf(pid);
        if (did) { next = { ...next, destinationId: did }; changed = true; }
      }
      if (item.category && item.category !== normalizeCategory(item.category)) {
        next = { ...next, category: normalizeCategory(item.category) };
        changed = true;
      }
      return next;
    });
    return { out, changed };
  };

  const s = fixList(storage.getSavedPlaces());
  if (s.changed) storage.saveSavedPlaces(s.out);
  const m = fixList(storage.getMaybePlaces());
  if (m.changed) storage.saveMaybePlaces(m.out);
  const r = fixList(storage.getRejectedPlaces());
  if (r.changed) storage.saveRejectedPlaces(r.out);
  const h = fixList(storage.getSwipeHistory());
  if (h.changed) storage.saveSwipeHistory(h.out);

  // Old flat day plans: { day1: [...], day2: [...] }
  try {
    const legacy = localStorage.getItem('travelswipe_day_plans');
    if (legacy && !localStorage.getItem('furo_day_plans_migrated')) {
      const flat = JSON.parse(legacy) || {};
      Object.entries(flat).forEach(([day, ids]) => {
        (ids || []).forEach(pid => {
          const did = destOf(pid);
          if (!did) return;
          const plans = storage.getDayPlans(did);
          plans[day] = plans[day] || [];
          if (!plans[day].includes(pid)) plans[day].push(pid);
          storage.saveDayPlans(did, plans);
        });
      });
      localStorage.setItem('furo_day_plans_migrated', '1');
    }
  } catch (e) { /* ignore */ }
}
