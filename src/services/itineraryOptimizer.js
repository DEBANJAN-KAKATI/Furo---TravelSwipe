/**
 * ItineraryOptimizer - route ordering, trip auto-planning and day stats.
 * Uses Haversine distances with nearest-neighbour + 2-opt for each day and
 * a simple k-means pass to split saved places into geographic day clusters.
 */

const R = 6371;

export function haversineDistance(coords1, coords2) {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateTotalRouteDistance(places) {
  if (!places || places.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < places.length - 1; i++) {
    totalKm += haversineDistance(places[i].coords, places[i + 1].coords);
  }
  return totalKm;
}

/** Nearest-neighbour seed + 2-opt untangling. Keeps the first stop fixed. */
export function optimizeRouteOrder(places) {
  if (!places || places.length <= 2) return [...(places || [])];

  const unvisited = [...places];
  const route = [unvisited.shift()];
  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    unvisited.forEach((p, i) => {
      const d = haversineDistance(current.coords, p.coords);
      if (d < minDist) { minDist = d; nearestIdx = i; }
    });
    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let i = 1; i < route.length - 1; i++) {
      for (let k = i + 1; k < route.length; k++) {
        const d1 = haversineDistance(route[i - 1].coords, route[i].coords) +
          (k + 1 < route.length ? haversineDistance(route[k].coords, route[k + 1].coords) : 0);
        const d2 = haversineDistance(route[i - 1].coords, route[k].coords) +
          (k + 1 < route.length ? haversineDistance(route[i].coords, route[k + 1].coords) : 0);
        if (d2 < d1 - 0.01) {
          const segment = route.slice(i, k + 1).reverse();
          route.splice(i, segment.length, ...segment);
          improved = true;
        }
      }
    }
  }
  return route;
}

/**
 * Splits places into `days` geographic clusters (balanced so no day is
 * overloaded), then orders each day. Must-visit places are spread first.
 * @returns {Object} { day1: [ids], day2: [ids], ... }
 */
export function autoPlanTrip(places, days) {
  const n = Math.max(1, Math.min(days, places.length || 1));
  const plans = {};
  for (let d = 1; d <= days; d++) plans[`day${d}`] = [];
  if (!places.length) return plans;

  const located = places.filter(p => p.coords && !p.approxLocation);
  const floating = places.filter(p => !p.coords || p.approxLocation);

  // k-means++ style seeding: start with the most "central" must-visit, then farthest points
  const centroids = [];
  const pool = located.length ? located : places;
  centroids.push([...pool[0].coords]);
  while (centroids.length < n && centroids.length < pool.length) {
    let best = null, bestD = -1;
    pool.forEach(p => {
      const d = Math.min(...centroids.map(c => haversineDistance(c, p.coords)));
      if (d > bestD) { bestD = d; best = p; }
    });
    centroids.push([...best.coords]);
  }

  const cap = Math.ceil(located.length / centroids.length);
  let assignment = new Map();
  for (let iter = 0; iter < 12; iter++) {
    assignment = new Map();
    const loads = centroids.map(() => 0);
    // Assign closest-first so capacity limits push outliers to neighbours
    const pairs = [];
    located.forEach(p => centroids.forEach((c, ci) => pairs.push({ p, ci, d: haversineDistance(c, p.coords) })));
    pairs.sort((a, b) => a.d - b.d);
    pairs.forEach(({ p, ci }) => {
      if (assignment.has(p.id) || loads[ci] >= cap) return;
      assignment.set(p.id, ci);
      loads[ci]++;
    });
    // Recompute centroids
    centroids.forEach((c, ci) => {
      const members = located.filter(p => assignment.get(p.id) === ci);
      if (!members.length) return;
      c[0] = members.reduce((s, p) => s + p.coords[0], 0) / members.length;
      c[1] = members.reduce((s, p) => s + p.coords[1], 0) / members.length;
    });
  }

  const buckets = centroids.map(() => []);
  located.forEach(p => buckets[assignment.get(p.id) || 0].push(p));
  // Places without exact coordinates go to the lightest days
  floating.forEach(p => {
    const lightest = buckets.reduce((bi, b, i) => (b.length < buckets[bi].length ? i : bi), 0);
    buckets[lightest].push(p);
  });

  // Busiest clusters first, must-visits lead each day
  buckets
    .sort((a, b) => b.length - a.length)
    .forEach((bucket, i) => {
      const sorted = [...bucket].sort((a, b) => (b.status === 'must_visit') - (a.status === 'must_visit'));
      plans[`day${i + 1}`] = optimizeRouteOrder(sorted).map(p => p.id);
    });
  return plans;
}

function mapsPoint(p) {
  if (p.approxLocation && p.mapsQuery) return encodeURIComponent(p.mapsQuery);
  return encodeURIComponent(p.coords.join(','));
}

export function placeMapsUrl(p) {
  const q = p.approxLocation && p.mapsQuery ? p.mapsQuery : `${p.name} ${p.coords.join(',')}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function directionsUrl(p) {
  return `https://www.google.com/maps/dir/?api=1&destination=${mapsPoint(p)}`;
}

/** Multi-stop Google Maps directions URL (max 9 waypoints supported by Maps). */
export function generateMultiStopGoogleMapsUrl(places) {
  if (!places || places.length === 0) return '#';
  if (places.length === 1) return placeMapsUrl(places[0]);

  const stops = places.slice(0, 11);
  const origin = mapsPoint(stops[0]);
  const destination = mapsPoint(stops[stops.length - 1]);
  let waypointsParam = '';
  if (stops.length > 2) {
    waypointsParam = '&waypoints=' + stops.slice(1, -1).map(mapsPoint).join('%7C');
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}

export function placeCostINR(p) {
  if (typeof p.estimatedCostINR === 'number') return p.estimatedCostINR;
  if (typeof p.estimatedCostUSD === 'number') return Math.round(p.estimatedCostUSD * 85);
  return null;
}

export function formatCost(p) {
  const c = placeCostINR(p);
  if (c === null) return p.priceLevel || '';
  return c > 0 ? `₹${c.toLocaleString('en-IN')}` : 'Free';
}

/** Parses "1.5 - 2 hours" / "45 mins" into minutes (midpoint). */
export function durationMinutes(text) {
  if (!text) return 60;
  const nums = (text.match(/[\d.]+/g) || []).map(Number);
  if (!nums.length) return 60;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return /min/i.test(text) && !/hour/i.test(text) ? avg : avg * 60;
}

export function calculateDayStats(places) {
  if (!places || places.length === 0) {
    return { count: 0, totalDistKm: 0, totalCostINR: 0, unknownCost: 0, formattedDistance: '0 km', formattedTime: '—', formattedCost: '—' };
  }
  const totalDistKm = calculateTotalRouteDistance(places.filter(p => !p.approxLocation));
  // ~4 min per km in city traffic + 10 min buffer between stops
  const transitMin = Math.round(totalDistKm * 4 + (places.length - 1) * 10);
  const visitMin = places.reduce((s, p) => s + durationMinutes(p.duration), 0);
  const totalMin = transitMin + visitMin;

  let unknownCost = 0;
  const totalCostINR = places.reduce((sum, p) => {
    const c = placeCostINR(p);
    if (c === null) { unknownCost++; return sum; }
    return sum + c;
  }, 0);

  const h = Math.floor(totalMin / 60), m = Math.round(totalMin % 60);
  return {
    count: places.length,
    totalDistKm,
    totalCostINR,
    unknownCost,
    totalMinutes: totalMin,
    formattedDistance: `${totalDistKm.toFixed(1)} km`,
    formattedTime: h > 0 ? `${h}h ${m}m` : `${m}m`,
    formattedCost: totalCostINR > 0 ? `₹${totalCostINR.toLocaleString('en-IN')}${unknownCost ? '+' : ''}` : (unknownCost ? '—' : 'Free')
  };
}
