/**
 * Furo Concierge - on-device travel assistant.
 * Answers from the current city's deck, live weather and your saved trip.
 * Replies can carry place suggestions that the UI renders as savable chips.
 */

import { getDestination } from './destinationService.js';
import { storage } from './storageService.js';
import { haversineDistance, calculateDayStats } from './itineraryOptimizer.js';

const has = (q, ...words) => words.some(w => q.includes(w));

function text(p) {
  return `${p.name} ${p.subcategory} ${p.oneLineHook} ${(p.tags || []).join(' ')} ${p.category}`.toLowerCase();
}

function isFree(p) {
  return p.priceLevel === 'Free' || p.estimatedCostINR === 0 || /free/i.test(text(p));
}

export class AIConcierge {
  constructor(destinationId) {
    this.destinationId = destinationId;
    this.weather = null;
    this.userCoords = null;
  }

  setDestination(destinationId) {
    this.destinationId = destinationId;
    this.weather = null;
  }

  setWeather(w) { this.weather = w; }
  setUserCoords(c) { this.userCoords = c; }

  get dest() {
    return getDestination(this.destinationId);
  }

  getQuickPrompts() {
    const d = this.dest;
    return [
      `Top 3 must-sees in ${d.name}`,
      'Plan my day from my saved spots',
      'Sunset views',
      'Cheap local food',
      'Free things to do',
      'What if it rains?',
      'Nightlife & events',
      'Local etiquette & safety'
    ];
  }

  pick(filterFn, n = 4) {
    const saved = new Set(storage.getSavedPlaces(this.dest.id).map(p => p.id));
    return this.dest.places
      .filter(filterFn)
      .sort((a, b) => (saved.has(a.id) - saved.has(b.id)) || ((b.rating || 4.4) - (a.rating || 4.4)))
      .slice(0, n);
  }

  processQuery(query) {
    const d = this.dest;
    const q = query.toLowerCase();
    const w = this.weather;

    // Plan / itinerary from saved
    if (has(q, 'plan my', 'itinerary', 'schedule', 'plan a day', 'organise', 'organize', 'auto plan', 'auto-plan')) {
      const saved = storage.getSavedPlaces(d.id);
      if (saved.length < 2) {
        return { reply: `You've saved **${saved.length}** place${saved.length === 1 ? '' : 's'} in ${d.name} so far. Swipe right on a few more and I'll split them into days by neighbourhood, with the shortest route for each day.`, places: this.pick(() => true, 3) };
      }
      return { reply: `I can split your **${saved.length} saved places** into days, grouping nearby spots together and ordering each day for the shortest route. Tap **Auto-plan my trip** below.`, action: { label: '✨ Auto-plan my trip', id: 'autoplan' } };
    }

    // Trip summary
    if (has(q, 'summary', 'my trip', 'how many saved', 'what have i saved', 'budget')) {
      const saved = storage.getSavedPlaces(d.id);
      const stats = calculateDayStats(saved);
      return {
        reply: saved.length
          ? `Your ${d.name} trip so far: **${saved.length} saved**, ${saved.filter(p => p.status === 'must_visit').length} must-visits. Estimated tickets & food: **${stats.formattedCost}**. Time needed if you did them all: about **${stats.formattedTime}**.`
          : `Nothing saved in ${d.name} yet — swipe right on spots you like and I'll keep the tally.`,
        places: saved.slice(0, 3)
      };
    }

    // Weather / rain
    if (has(q, 'rain', 'weather', 'umbrella', 'hot', 'cold', 'indoor', 'forecast')) {
      const indoor = this.pick(p => ['Food & Drink', 'Shopping & Culture'].includes(p.category) || /(museum|gallery|indoor|temple|church|cathedral|mall|caf)/.test(text(p)));
      const now = w ? `Right now in ${d.name}: **${w.temp}, ${w.condition}** ${w.icon}. ${w.advisory}` : `I couldn't fetch live weather for ${d.name}, but here are solid indoor options.`;
      const days = w && w.daily && w.daily.length > 1
        ? '\n' + w.daily.slice(0, 3).map((day, i) => `• ${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}: ${day.icon} ${day.min}–${day.max}°C, rain ${day.rainChance}%`).join('\n')
        : '';
      return { reply: `${now}${days}\n\n☔ **Good rainy-day picks:**`, places: indoor };
    }

    // Sunset / views
    if (has(q, 'sunset', 'sunrise', 'view', 'photo', 'scenic', 'instagram', 'panorama')) {
      const views = this.pick(p => p.category === 'Sights & Views' || /(sunset|view|panoram|hill|lake|river|beach|rooftop|tower)/.test(text(p)));
      const sunset = w && w.sunset ? `Sunset today is around **${w.sunset}** — arrive 30–40 min early for golden hour. ` : '';
      return { reply: `${sunset}🌅 **Best views in ${d.name}:**`, places: views };
    }

    // Food
    if (has(q, 'food', 'eat', 'dish', 'hungry', 'breakfast', 'lunch', 'dinner', 'restaurant', 'cafe', 'café', 'coffee', 'veg')) {
      const cheap = has(q, 'cheap', 'budget', 'street', 'local');
      const veg = has(q, 'veg');
      const food = this.pick(p => p.category === 'Food & Drink' &&
        (!veg || /(veg|south indian|dosa|thali|udupi)/.test(text(p))) &&
        (!cheap || ['₹', 'Free', ''].includes(p.priceLevel || '') || (p.estimatedCostINR || 0) <= 300), 5);
      const list = food.length ? food : this.pick(p => p.category === 'Food & Drink', 5);
      return { reply: `🍜 **${cheap ? 'Budget-friendly' : 'Great'} ${veg ? 'vegetarian ' : ''}food in ${d.name}:**`, places: list };
    }

    // Free
    if (has(q, 'free', 'no cost', 'without money', 'zero')) {
      return { reply: `🆓 **Free things to do in ${d.name}:**`, places: this.pick(isFree, 5) };
    }

    // Nightlife
    if (has(q, 'night', 'party', 'bar', 'pub', 'club', 'music', 'gig', 'event', 'comedy', 'beer')) {
      return { reply: `🎭 **After-dark picks in ${d.name}:**`, places: this.pick(p => p.category === 'Events & Gigs' || /(night|bar|pub|brew|music|comedy|club|late)/.test(text(p)), 5) };
    }

    // Family
    if (has(q, 'kid', 'child', 'family')) {
      return { reply: `👨‍👩‍👧 **Family-friendly in ${d.name}:**`, places: this.pick(p => /(park|zoo|garden|museum|science|lake|safari|aquarium|boat|ropeway)/.test(text(p)), 5) };
    }

    // Nature
    if (has(q, 'nature', 'park', 'hike', 'trek', 'outdoor', 'walk', 'garden', 'lake')) {
      return { reply: `🌳 **Get outdoors in ${d.name}:**`, places: this.pick(p => p.category === 'Areas of Exploration' || /(park|garden|lake|trek|hill|forest|walk)/.test(text(p)), 5) };
    }

    // Near me
    if (has(q, 'near me', 'nearby', 'closest', 'around me')) {
      if (!this.userCoords) return { reply: 'Turn on **📍 Near me** in the city menu (or allow location) and I can sort spots by distance from you.' };
      const near = [...d.places].filter(p => !p.approxLocation)
        .sort((a, b) => haversineDistance(this.userCoords, a.coords) - haversineDistance(this.userCoords, b.coords)).slice(0, 5);
      return { reply: '📍 **Closest to you right now:**', places: near };
    }

    // Etiquette / safety
    if (has(q, 'etiquette', 'custom', 'dress', 'rule', 'tip', 'safety', 'safe', 'emergency', 'police', 'scam')) {
      return {
        reply: `🙏 **Local know-how for ${d.name}:**\n\n` +
          (d.etiquette || []).map(e => `• **${e.icon} ${e.title}:** ${e.desc}`).join('\n') +
          `\n\n🚨 **Emergency:** Police ${d.emergency.police} · Ambulance ${d.emergency.ambulance}${d.emergency.touristHelp ? ` · Tourist help ${d.emergency.touristHelp}` : ''}`
      };
    }

    // Must-sees
    if (has(q, 'top', 'must', 'best', 'first time', 'famous', 'popular', 'highlight')) {
      return { reply: `⭐ **Must-sees in ${d.name}:**`, places: this.pick(p => p.category === 'Places to Visit' || p.category === 'Sights & Views', 3) };
    }

    // Free-text search across the deck
    const words = q.split(/[^a-z0-9]+/).filter(x => x.length > 2 && !['the', 'and', 'for', 'where', 'what', 'can', 'find', 'show', 'with', 'are', 'any', 'some'].includes(x));
    if (words.length) {
      const hits = d.places
        .map(p => ({ p, s: words.filter(wd => text(p).includes(wd)).length }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 5)
        .map(x => x.p);
      if (hits.length) return { reply: `Here's what I found in ${d.name} for "${query}":`, places: hits };
    }

    return {
      reply: `I couldn't find a match for that in ${d.name}. Try asking about **food**, **views**, **free things**, **nightlife**, **rain plans**, or **plan my day**. Here are some crowd favourites:`,
      places: this.pick(() => true, 3)
    };
  }
}
