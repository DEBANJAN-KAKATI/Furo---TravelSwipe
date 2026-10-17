# 🗺️ TravelSwipe — Implementation Plan
### A Tinder-Style Travel Discovery App (Plan Only — No Build)

---

## 1. Product Concept & Vision

**Working name:** *TravelSwipe* (or "WanderSwipe")

**Core idea:** A user enters or auto-detects a destination (city, park, temple, resort, beach, etc.). The app generates a deck of **swipeable cards** — each card is a place, activity, restaurant, or experience relevant to that destination, organized into subcategories. The user makes rapid decisions:

| Gesture | Action |
|---|---|
| **Swipe Right** ✅ | Accept — saved to the user's **"Exploration List"** (bucket/itinerary) |
| **Swipe Left** ❌ | Reject — card is discarded, preference signal is recorded |
| **Swipe Up / Tap Center** 🗺️ | Open the place directly in **Google Maps** (navigation intent) |
| **Swipe Down** 🔖 | "Maybe Later" — parked in a separate "Undecided" pile |
| **Tap card** ℹ️ | Flip card → detailed info panel with practical Q&A |
| **Long press** ⭐ | Super-save — marks as "Must Visit," pinned to top of itinerary |

---

## 2. Core Feature Set

### 2.1 Onboarding & Destination Input
- **Location search bar** — autocomplete via Google Places Autocomplete API.
- **Auto-detect current location** (GPS) with "Explore near me" mode.
- **Trip profile setup:** dates, budget tier, travel style (adventurer / foodie / culture / family / luxury / backpacker), group type (solo, couple, family with kids, friends).
- **Interest picker:** museums, nightlife, nature, temples, theme parks, food streets, shopping, hidden gems — this seeds the recommendation engine.

### 2.2 The Swipe Deck (Core Loop)
Each destination generates a deck of cards, grouped into **subcategories** (user can filter the deck by category or shuffle all):

| Category | Subcategories (examples) |
|---|---|
| 🏛️ **Places to Visit** | Landmarks, museums, historical sites, viewpoints, theme parks, zoos |
| 🍜 **Food & Drink** | Street food, fine dining, cafés, local specialties, food markets, bars |
| 🚗 **Travel / Transport** | Rides, rentals, day-trip routes, scenic drives, public transport hubs |
| 👀 **Sights & Views** | Photo spots, sunset points, observation decks, street art |
| 🧭 **Areas of Exploration** | Neighborhoods, old towns, hiking trails, markets, beaches |
| 🎉 **Events & Activities** | Festivals, shows, workshops, tours, water sports |
| 🛏️ **Stay (optional)** | Hotels/hostels matching budget tier |
| 🛍️ **Shopping** | Malls, bazaars, souvenir spots, artisan markets |

**Deck behaviors:**
- Cards show: hero photo, name, category badge, rating (★), price level ($–$$$$), distance from user/hotel, open/closed status, one-line hook ("Famous for sunset cliff views").
- **Undo button** — bring back last rejected card.
- **Category filter chips** at top of deck.
- **Deck exhaustion state** — "You've seen all 87 places in Kyoto 🎉" → prompt to expand radius or switch category.

### 2.3 The "Exploration" Hub (Saved Places)
This is where right-swipes live. Features:
- **Auto-organized by subcategory** (tabs: Visit / Eat / Explore / Photo Spots...).
- **Itinerary builder:** drag-and-drop saved cards into Day 1, Day 2, etc.
- **Smart day planner (optional AI):** clusters saved places by geographic proximity and opening hours, suggests an optimal route (traveling-salesman-lite routing via Google Directions API).
- **Map view of all saved places** with color-coded pins per category.
- **Shareable list:** export to friends (link/PDF), collaborative trip decks ("Swipe together" mode — group voting where a place is only saved if majority swipe right).
- **Offline access** for saved lists (cached data + offline maps link).

### 2.4 Card Detail Panel — The Practical Q&A System ⭐ (Key Feature)
This is what makes the app stand out: **context-aware practical questions with auto-fetched answers.** When a card flips open, the user sees a checklist of *relevant* questions with answers pulled from the web.

**How it works — a Question Template Engine:**
The system maps **place type → question set**. Examples:

**🎢 Theme Park / Amusement Park cards:**
- Check ticket prices? → live price from official site / Klook / GetYourGuide
- Find best rides? → top-rated rides from reviews + blogs
- Find food options? → on-site dining list
- Check park hours? → Google Places opening hours
- Avoid long lines timings? → crowd calendars / Queue-Times API
- Check weather forecast? → weather API for visit date
- Check height limits? → scraped from official ride pages
- Rent a locker? → availability + price
- Check parking rules? → parking info
- Download resort app? → deep link to official app
- Check crowd levels? → live "popular times" data
- Find photo spots? → tagged Instagram/flickr spots
- Look for discounts? → coupon aggregator scrape
- Check age restrictions?

**🛕 Temple / Religious Site cards:**
- Check dress code? → "Shoulders and knees covered required"
- Remove shoes here? → yes/no + where
- Check photography rules?
- Know prayer times? → linked to prayer time API (e.g., Aladhan API for mosques)
- Respect quiet zones?
- Cover my head? / Bring modesty shawl?
- Learn temple customs? → short etiquette summary
- Check entry fees?
- Turn off phone?
- Bring offering gifts?
- Know restricted areas?
- Walk clockwise around? (relevant for stupas, e.g., Boudhanath)
- Avoid leather items? (relevant for Jain temples)
- Wash hands first? / Face the altar?
- Hire local guide? → booking link
- Follow gender rules?
- Check festival dates? → best/worst days to visit

**🏖️ Beach cards:**
- Pack dry clothes? / Bring sunscreen & hat?
- Check tide times? → tide API
- Water quality / jellyfish warnings?
- Lifeguard on duty?
- Rent equipment (boards, umbrellas)?

**🥾 Hiking / Nature cards:**
- Trail difficulty & length?
- Permit required?
- Best season / weather window?
- Know meeting spot? (for guided treks)

**Universal questions (all cards):**
- Weather forecast for visit dates (OpenWeatherMap API)
- How to get there? → transport options + estimated cost/time
- Open now? / best time to visit?
- Estimated visit duration?
- Wheelchair accessible?
- Know meeting spot? (set a personal meetup pin)

**Answer sourcing strategy (3-tier):**
1. **Structured APIs:** Google Places (hours, ratings, price level), OpenWeatherMap, ticket platforms (Klook, GetYourGuide, Viator APIs), crowd data (Google "Popular Times" via scraping or BestTime.app API).
2. **Official-site scraping:** scheduled scrapers + per-place rule database for FAQs (dress codes, locker rental, height limits).
3. **LLM summarization:** an LLM pipeline ingests reviews (Google reviews, TripAdvisor) + blogs and generates concise answers to each question template, with a "last verified" timestamp and source citations. Human/editorial review for high-traffic places.

**Answer format:** each Q&A becomes a tappable chip: ✅ answered (green), ⚠️ uncertain (yellow, "verify on site"), ❓ no data yet. Users can tap to see the source.

### 2.5 Google Maps Integration (Middle Swipe)
- Swipe up / tap center button → `geo:` intent / Google Maps URL scheme with the place's coordinates — opens directly in navigation mode.
- In-app mini-map preview before committing.
- "Route through all my saved places" → generates a multi-stop Google Maps link.

---

## 3. Advanced / Differentiating Features (Phase 2+)

1. **Swipe Together (Group Mode):** shared deck for a travel group; matches appear when everyone swipes right (like "Tinder for groups").
2. **AI Concierge Chat:** "I have 3 hours near Shibuya and love ramen" → generates an instant mini-deck.
3. **Adaptive recommendation engine:** rejection signals train ranking (rejected museums → fewer museum cards). Cold start handled via onboarding profile.
4. **Budget tracker:** saved places' entry fees + estimated food costs auto-sum into a trip budget estimate.
5. **Crowd-aware scheduling:** itinerary builder warns "This temple is packed 10am–2pm on weekends — visit at 8am instead."
6. **AR mode (Phase 3):** point camera → nearby saved places float as markers.
7. **Trip memory book:** post-trip, generate a photo journal from visited (checked-in) saved places.
8. **Local deals feed:** push notifications for discounts near saved places.
9. **Safety layer:** travel advisories, scam warnings per area, emergency numbers, women-solo-traveler notes.
10. **Gamification:** streaks, badges ("Temple Explorer — visited 10 temples"), city completion %.
11. **Offline deck download:** pre-cache deck + Q&A before a trip.
12. **Voice/swipe accessibility mode.**

---

## 4. Technical Architecture

### 4.1 Platform Strategy
| Option | Recommendation |
|---|---|
| **MVP:** PWA / responsive web app | Fastest to ship, swipe works great in browser, no app-store gate |
| **Phase 2:** React Native or Flutter app | Native gestures, offline storage, push notifications, maps intents |

**Suggested stack:**
- **Frontend:** Next.js (web) / React Native (mobile) — share logic; swipe via `react-tinder-card` / `react-native-deck-swiper` or custom gesture physics (Framer Motion / Reanimated).
- **Backend:** Node.js (NestJS) or Python (FastAPI) API server.
- **Database:** PostgreSQL + PostGIS (geo queries) + Redis (deck caching, sessions).
- **Vector search:** pgvector / Pinecone for semantic place matching ("romantic quiet spots").
- **LLM pipeline:** GPT/Claude API for Q&A generation and concierge; RAG over scraped FAQ corpus.
- **Infra:** Vercel + Railway/AWS; Cloudflare CDN for images; S3 for media.
- **Auth:** Clerk / Firebase Auth / Supabase Auth (Google, Apple, email).

### 4.2 Key External APIs
| Purpose | API |
|---|---|
| Places data, photos, hours, ratings | **Google Places API** (fallback: Foursquare, OpenStreetMap/Overpass) |
| Maps & navigation links | **Google Maps Platform** (URL scheme/intents, Directions, Distance Matrix) |
| Weather | OpenWeatherMap / Tomorrow.io |
| Tickets & tours | Klook, GetYourGuide, Viator affiliate APIs |
| Crowd data | BestTime.app API / Google Popular Times scraping |
| Prayer times | Aladhan API |
| Events | Ticketmaster, Eventbrite, PredictHQ (festivals) |
| Reviews sentiment | Google Reviews + LLM summarization |
| Currency/conversion | ExchangeRate API |
| Flights/hotels (later) | Amadeus / Skyscanner affiliate |

### 4.3 Data Model (core entities)
```
User (id, prefs, travel_style, budget_tier)
Destination (id, geo, country, timezone)
Place (id, name, category, subcategory, geo, hours,
       price_level, rating, source_refs[])
QuestionTemplate (id, question, applies_to_categories[], priority)
PlaceAnswer (place_id, question_id, answer, source, confidence, verified_at)
Deck (user_id, destination_id, generated_at, filters)
SwipeEvent (user_id, place_id, action[left/right/down], ts)   ← analytics gold
SavedPlace / ExplorationList (user_id, place_id, day_slot, status[maybe/must/visited])
Itinerary (user_id, destination_id, days[], optimized_route)
```

### 4.4 Recommendation / Deck Generation Pipeline
1. User enters destination → geocode.
2. Query Places API by category×subcategory grid within radius.
3. Enrich each place: hours, ratings, photos, crowd data, ticket links.
4. Attach relevant question templates per subcategory → fetch/generate answers (async, cache aggressively; answers cached per place for 7–30 days).
5. Rank deck by: user profile match, rating, distance, novelty (avoid duplicates from previous decks).
6. Serve deck in batches of 20 cards (prefetch next batch for buttery swiping).

### 4.5 System Flow
```
Search destination → Geocode → Deck Builder Service
   → Enrichment workers (hours/weather/tickets/crowd)
   → Q&A Engine (templates → API + scraper + LLM)
   → Ranker → Deck API → Client swipe UI
Swipe events → Preference model update → better next deck
Right swipes → Exploration Hub → Itinerary optimizer → Maps deep link
```

---

## 5. UX / Design Guidelines
- **Gesture physics:** spring-based, card rotation proportional to drag; colored overlays (green "SAVE" / red "NOPE" / blue "MAP") fade in with drag distance.
- **One-thumb zone:** all actions reachable with thumb; center-bottom buttons as gesture alternatives (accessibility).
- **Card info hierarchy:** photo → name → rating/price/distance strip → one-line hook → "Flip for practical tips."
- **Haptics:** light tick on threshold cross, stronger on commit.
- **Dark mode + offline-first caching** of images (progressive loading).
- **Localization:** the app is inherently global — i18n from day one (react-i18next), RTL support later.

---

## 6. Monetization Plan
- **Freemium:** free = 1 active destination deck + 20 saves; **Pro (~$4.99/mo):** unlimited decks, offline mode, AI itinerary optimizer, group swipe, crowd-avoidance alerts.
- **Affiliate revenue:** ticket bookings (Klook/GetYourGuide ~5–8%), hotels, eSIMs, travel insurance.
- **B2B:** sponsored placement for local businesses (clearly labeled), tourism boards.

---

## 7. Roadmap & Phases

| Phase | Duration | Deliverables |
|---|---|---|
| **0. Research & validation** | 2–3 wks | Competitor analysis (Culture Trip, Wanderlog, Tripadvisor, Mindtrip), API cost/limit audit, landing page + waitlist test |
| **1. MVP (web PWA)** | 8–10 wks | Search → deck → swipe → save → Google Maps link; 3 categories; Google Places data; basic Q&A chips (top 10 universal questions); auth; exploration list |
| **2. Q&A Engine v1** | 4–6 wks | Question templates for temple/theme-park/beach/food verticals; LLM answer pipeline; source citations |
| **3. Mobile app (React Native)** | 8 wks | Native gestures, push notifications, offline deck, group swipe |
| **4. Smart itinerary + budget** | 4 wks | Day planner, route optimization, cost estimator |
| **5. Growth features** | ongoing | AI concierge, deals feed, gamification, social sharing, affiliate integrations |

**Suggested MVP scope cut:** Launch with **2–3 tourist-heavy cities** (e.g., Bangkok, Tokyo, Paris) where the Q&A database is hand-verified — quality over coverage wins early trust.

---

## 8. Costs & Risks

**Costs (rough monthly at MVP scale, ~1k users):**
- Google Places API: ~$200–800 (biggest variable — cache hard, use Field Masks, session-based pricing).
- Maps loads: ~$50–150. Weather: free tier. LLM for Q&A: ~$100–300. Infra: ~$100–200.

**Key risks & mitigations:**
| Risk | Mitigation |
|---|---|
| Google Places API cost spirals | Aggressive caching (30-day place data), batch prefetch, restrict fields |
| Q&A answers go stale/wrong (hallucinations) | Confidence scores, "last verified" timestamps, source links, editorial review for top places, user "report wrong info" button |
| Legal: scraping official sites / ToS | Prefer licensed APIs & affiliate feeds; scraping only where permissible; LLM answers cite sources |
| Deck quality in low-data regions | Seed with OpenStreetMap + curated editorial lists |
| Swipe fatigue | Smart ranking so best cards come early; category filters; "surprise me" shuffle |

---

## 9. Success Metrics (KPIs)
- Deck engagement: swipes/session, right-swipe rate, undo rate.
- Save→visit conversion: % of saved places later opened in Maps.
- Q&A utility: chip-tap rate, "info was helpful" votes.
- Retention: D7/D30, trips planned per user, group-deck invites.

---

## 10. Summary
The plan delivers a **Tinder-style swipe deck for travel discovery** with three signature moves:
1. **Subcategorized place decks** generated per destination.
2. A **context-aware practical Q&A engine** (ticket prices, dress codes, crowd timing, temple etiquette, etc.) sourced from APIs + web + LLM with citations.
3. A **three-gesture system** — left rejects, right saves to the Exploration Hub with itinerary building, and middle/up opens Google Maps navigation.

Start as a PWA MVP with 2–3 hand-curated cities, then expand to native mobile, group swiping, AI itineraries, and affiliate monetization.


