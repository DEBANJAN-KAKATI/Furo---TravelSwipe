<div align="center">

  <img src="public/brand/furo-icon-512.png" alt="Furo Logo" width="120" style="border-radius: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);" />

  # ✈️ Furo (TravelSwipe)
  ### *Swipe your next trip. Discover places, build itineraries, and explore.*

  [![Android Release](https://img.shields.io/badge/Android-APK%20v2.0-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/DEBANJAN-KAKATI/Furo---TravelSwipe)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

  <p align="center">
    <b>Furo</b> transforms travel discovery into a tactile, high-speed experience. Browse top landmarks, hidden culinary gems, scenic viewpoints, and cultural treasures with intuitive swipe gestures, automatically cluster your favorites into optimized day-by-day itineraries, and navigate on an interactive offline-ready map.
  </p>

  [📥 Download APK](#-download--install-apk) • [✨ Features](#-key-features) • [🕹️ Gestures](#️-swipe-gestures--controls) • [🛠️ Tech Stack](#️-tech-stack) • [🚀 Build from Source](#-build--development)

</div>

---

## 📖 App Overview & Descriptions

### ⚡ One-Liner
> **"Tinder meets Google Maps: Rapidly discover places with intuitive swipes, generate smart day-by-day travel routes, and explore any city with an AI concierge."**

### 🎯 Elevator Pitch
Traditional travel planning is bogged down by endless search tabs, scattered blog posts, and messy spreadsheets. **Furo (TravelSwipe)** reinvents trip planning with a gamified, card-based interface. Simply pick or search any global destination, and Furo deals a curated deck of sights, eateries, viewpoints, and cultural spots. Swipe right to save, swipe left to pass, swipe up to pin a "Must-Visit," or flip the card for real-world intel (dress codes, ticket pricing, peak hours, photo spots). Once curated, Furo’s smart day planner clusters your picks into optimal geographic routes with live weather and interactive map navigation.

### 🌟 App Store / Product Description
> **Stop researching. Start swiping.**
>
> Planning a trip shouldn't feel like office work. Whether you're exploring your own city or backpacking halfway across the globe, **Furo** makes trip discovery effortless and addictive.
>
> - **Swipe to Decide**: Intuitive Tinder-style card interface designed for rapid curation.
> - **Context-Aware Intel**: Tap any place card to flip into actionable travel Q&A—check dress codes, ticket prices, crowd timings, photography rules, and local etiquette.
> - **Automated Route Optimization**: Group saved attractions geographically to cut down transit time and construct seamless Day 1, Day 2, and Day 3 itineraries.
> - **Interactive Map with Custom Markers**: Real-time GPS location tracking, category filtering, and direct navigation links.
> - **Built-in AI Concierge**: Personalized suggestions, local tips, and tailored itineraries for any travel style or dietary preference.
> - **Collaborative Group Swiping**: Plan trips with friends through real-time swipe sessions where common right-swipes become your group itinerary.

---

## 📥 Download & Install APK

Pre-built release APKs are packaged in this repository ready for sideloading on Android devices:

| File | Description | Version | Size |
|---|---|---|---|
| 📦 **[`TravelSwipe.apk`](./TravelSwipe.apk)** | Optimized Production Release | `v2.0` | ~4.3 MB |
| 📦 **[`Furo.apk`](./Furo.apk)** | Full Release Build | `v2.0` | ~5.1 MB |

### 📲 Step-by-Step Installation on Android

1. **Download the APK**: Download [`TravelSwipe.apk`](./TravelSwipe.apk) or [`Furo.apk`](./Furo.apk) directly to your Android device or transfer it via USB.
2. **Enable Unknown Sources**:
   - On Android 8.0+: Settings > **Apps & notifications** > **Special app access** > **Install unknown apps** > Allow for your browser/file manager.
   - On older versions: Settings > **Security** > toggle **Unknown sources**.
3. **Open & Install**:
   - Tap the downloaded `.apk` in your Notification drawer or Files app.
   - Tap **Install** and accept the location permission for GPS map discovery.
4. **Launch & Swipe**: Open **Furo** from your app drawer and begin planning your trip!

---

## ✨ Key Features

### 1. 🎴 The Tinder-Style Swipe Deck
- **Card Feed**: High-resolution imagery, crowd ratings, price indicators, opening hours, and distance markers.
- **Micro-Haptics & Audio**: Rich audio feedback and subtle vibrations on every gesture.
- **Smart Category Filtering**: Filter cards on the fly by **Places to Visit**, **Food & Drink**, **Sights & Views**, **Activities**, **Nightlife**, and **Hidden Gems**.
- **Instant Undo**: Accidentally rejected a bucket-list spot? One tap restores the previous card.

### 2. ℹ️ Practical Q&A & Place Intel Drawer
Tap any card to uncover context-sensitive practical travel checklists:
- 🎢 **Attractions & Parks**: Peak waiting hours, ticketing links, ride rules, locker availability.
- 🛕 **Temples & Cultural Sites**: Strict dress codes, shoe removal etiquette, photography rules, prayer times.
- 🍜 **Dining & Street Food**: Signature dishes, vegetarian/halal options, reservation requirements, payment methods.

### 3. 🗺️ Smart Day Planner & Itinerary Optimizer
- **Clustered Day Schedules**: Organize saved places across multiple days (Day 1, Day 2, Day 3+).
- **TSP Routing**: Uses geographic proximity clustering to minimize cross-city travel back-and-forth.
- **Interactive Leaflet Map**: Color-coded category pins, route polylines, and one-tap Google Maps navigation.

### 4. 🤖 AI Travel Concierge
- Integrated AI assistant answering queries like:
  - *"Where can I find vegetarian street food near me?"*
  - *"Give me a 3-day slow-travel walking route."*
  - *"What are the safety and scam tips for this neighborhood?"*

### 5. 👥 Collaborative Group Swiping
- Generate room codes to swipe through cities together with travel companions.
- When two or more people swipe right on the same place, it triggers a **"Match!"** animation and automatically enters your shared itinerary.

### 6. 🌦️ Real-Time Weather & Live Cities
- Live temperature, conditions, and best times of the day to explore outdoor spots.
- Dynamic city generator allows querying and generating card decks for virtually any city worldwide via OpenStreetMap & Overpass APIs.

---

## 🕹️ Swipe Gestures & Controls

| Gesture / Key | Action | Result |
|:---:|:---:|---|
| **Swipe Right** / <kbd>→</kbd> | **Save** | Adds place to your **Trip Bucket** |
| **Swipe Left** / <kbd>←</kbd> | **Pass** | Skips place and records preference signal |
| **Swipe Up** / <kbd>↑</kbd> | **Must Visit** | Pins place to top of itinerary with a gold star ⭐ |
| **Swipe Down** / <kbd>↓</kbd> | **Maybe Later** | Saves to the secondary "Undecided" collection |
| **Tap Card** | **Flip / Intel** | Opens practical Q&A, reviews, and detailed info |
| **Undo Button** / <kbd>U</kbd> | **Undo** | Restores the last swiped card to the deck |

---

## 📱 APK Specifications

```yaml
Application Name: Furo (TravelSwipe)
Package Identifier: app.travelswipe
Current Version: 2.0 (VersionCode: 2)
Minimum SDK: Android 7.0 (API 24)
Target SDK: Android 14 (API 34)
Architecture: Universal (arm64-v8a, armeabi-v7a, x86_64)
APK File Size: ~4.3 MB - 5.1 MB
Permissions:
  - android.permission.INTERNET (Live data, weather, maps, images)
  - android.permission.ACCESS_FINE_LOCATION (Near me GPS discovery)
  - android.permission.ACCESS_COARSE_LOCATION (City-level positioning)
```

---

## 🛠️ Tech Stack

- **Client Core**: Modern Vanilla JavaScript (ES modules), HTML5 semantic structure.
- **Styling**: Vanilla CSS3 design system with dark/light mode tokens, glassmorphism, fluid typography (`Outfit` & `Plus Jakarta Sans`).
- **Mobile Container**: **Capacitor 8** Native Android runtime (`@capacitor/android`, `@capacitor/cli`, `@capacitor/core`).
- **Mapping & Geodata**: Leaflet.js, OpenStreetMap tiles, Overpass API.
- **Build Tooling**: Vite 6, Gradle 8.x.
- **Animations & Effects**: Canvas Confetti, CSS hardware-accelerated transforms, Web Audio API sound synthesis.

---

## 🚀 Build & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Android Studio](https://developer.android.com/studio) with Android SDK 34 (for APK compilation)
- Java Development Kit (JDK 17 or 21)

### 1. Web Development Server
```bash
# Clone the repository
git clone https://github.com/your-username/travelswipe.git
cd travelswipe

# Install dependencies
npm install

# Start Vite live dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Building Web Assets
```bash
# Production web bundle
npm run build

# Standalone preview
npm run preview
```

### 3. Compiling Android APK with Capacitor
```bash
# Sync web build into Android project
npm run android

# Open project in Android Studio
npx cap open android
```

Or build APK directly from command line:
```bash
cd android
./gradlew assembleDebug    # Outputs to app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease  # Outputs to app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 📂 Project Directory Structure

```text
TravelSwipe/
├── android/                   # Capacitor native Android Gradle project
│   ├── app/                   # Android Application module
│   └── build.gradle           # Root Gradle build script
├── public/                    # Static brand assets, PWA manifest, favicons
│   ├── brand/                 # App logos, adaptive icons, wordmarks
│   └── manifest.webmanifest   # Web app manifest
├── src/
│   ├── data/                  # Destination presets, place badges, metadata
│   ├── services/
│   │   ├── aiConcierge.js     # AI travel assistant
│   │   ├── audioService.js    # Sound effects & haptics
│   │   ├── cityGeneratorService.js # OpenStreetMap on-the-fly city deck generator
│   │   ├── deckManager.js     # Swipe physics & gesture engine
│   │   ├── destinationService.js   # City switcher & search
│   │   ├── groupSwipeService.js    # Multi-user synchronized swiping
│   │   ├── itineraryOptimizer.js   # Geographic TSP route planner
│   │   ├── mapManager.js      # Leaflet map rendering & pins
│   │   ├── placesService.js   # Place data & practical Q&A rules
│   │   ├── storageService.js  # LocalStorage persistence & offline caching
│   │   └── weatherService.js  # Live weather forecasting
│   ├── styles/
│   │   └── main.css           # Design tokens, themes, layout & animations
│   └── main.js                # Application entrypoint & view coordinator
├── Furo.apk                   # Pre-compiled Android application package
├── TravelSwipe.apk            # Release Android application package
├── index.html                 # Main single-page application markup
├── capacitor.config.json      # Capacitor project configuration
├── package.json               # Dependencies and scripts
└── vite.config.js             # Vite build configuration
```

---

## 🔒 Privacy & Permissions

Furo respects user privacy:
- **No Account Required**: Start swiping immediately; trip data is stored locally on your device.
- **Location Permission**: Used solely to center the map and calculate distance to nearby attractions. Location data is never transmitted to advertising trackers.
- **Offline First**: All saved places, day plans, and routes remain accessible even without an active internet connection.


