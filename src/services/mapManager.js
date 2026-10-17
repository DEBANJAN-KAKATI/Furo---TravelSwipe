/**
 * MapManager - Leaflet map with saved places, day routes and "you are here".
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDestination } from './destinationService.js';
import { storage } from './storageService.js';
import { placeMapsUrl, directionsUrl } from './itineraryOptimizer.js';
import { esc, safeUrl } from '../utils/ui.js';
import { imageService, placeImgSlot } from './imageService.js';

// Keyless Esri basemaps (CARTO now requires an API key)
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const TILES = {
  dark: [`${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`],
  light: [`${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`]
};
const ATTRIBUTION = 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors';

export const DAY_COLORS = ['#1f9bff', '#ff7a45', '#22c55e', '#e879f9', '#facc15', '#2dd4bf', '#f43f5e', '#a78bfa', '#fb923c', '#38bdf8', '#84cc16', '#f472b6', '#60a5fa', '#fbbf24'];

export class MapManager {
  constructor(containerId = 'leaflet-map') {
    this.containerId = containerId;
    this.map = null;
    this.tiles = null;
    this.markers = null;
    this.routeLine = null;
    this.meMarker = null;
    this.filter = 'saved'; // 'saved' | 'all' | 'dayN'
    this.showRoute = true;
    this.destinationId = null;
    this.onSave = null;
  }

  init(destinationId, theme = 'dark') {
    const el = document.getElementById(this.containerId);
    if (!el || this.map) return;
    const dest = getDestination(destinationId);
    this.destinationId = dest.id;
    this.map = L.map(el, { zoomControl: false, attributionControl: true }).setView(dest.coords, 12);
    this.map.attributionControl.setPrefix(false);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    this.setTheme(theme);
    this.markers = L.layerGroup().addTo(this.map);

    // Save straight from a popup
    this.map.on('popupopen', (e) => {
      imageService.hydrate(e.popup.getElement());
      const btn = e.popup.getElement().querySelector('[data-map-save]');
      if (btn) btn.addEventListener('click', () => {
        if (this.onSave) this.onSave(btn.getAttribute('data-map-save'));
        this.map.closePopup();
      }, { once: true });
    });
  }

  setTheme(theme) {
    if (!this.map) return;
    if (this.tiles) this.tiles.forEach(t => this.map.removeLayer(t));
    this.tiles = (TILES[theme] || TILES.dark).map((url, i) => L.tileLayer(url, {
      maxZoom: 19,
      maxNativeZoom: 16,
      attribution: i === 0 ? ATTRIBUTION : ''
    }).addTo(this.map));
  }

  setDestination(destinationId) {
    this.destinationId = destinationId;
    if (!this.map) return;
    const dest = getDestination(destinationId);
    this.map.setView(dest.coords, 12);
  }

  setFilter(filter) {
    this.filter = filter;
    this.render();
  }

  toggleRoute() {
    this.showRoute = !this.showRoute;
    this.render();
    return this.showRoute;
  }

  /** Call when the map view becomes visible. */
  refresh() {
    if (!this.map) return;
    requestAnimationFrame(() => {
      this.map.invalidateSize();
      this.render();
    });
  }

  pinIcon(place, label, color, faded) {
    return L.divIcon({
      className: 'furo-pin-wrap',
      html: `<div class="furo-pin ${faded ? 'faded' : ''} ${place.status === 'must_visit' ? 'must' : ''}" style="--pin:${color}">
               <span>${label ? esc(label) : esc(place.categoryIcon || '📍')}</span>
             </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32]
    });
  }

  popupHtml(place, saved) {
    return `
      <div class="map-pop">
        ${placeImgSlot(place, 'map-pop-img')}
        <div class="map-pop-body">
          <span class="map-pop-cat">${esc(place.categoryIcon)} ${esc(place.subcategory)}</span>
          <strong>${esc(place.name)}</strong>
          <span class="map-pop-sub">${esc(place.openStatus || '')}</span>
          <div class="map-pop-actions">
            <a href="${safeUrl(directionsUrl(place))}" target="_blank" rel="noopener noreferrer">🧭 Go</a>
            <a href="${safeUrl(placeMapsUrl(place))}" target="_blank" rel="noopener noreferrer">🗺️ Maps</a>
            ${saved ? '' : `<button type="button" data-map-save="${esc(place.id)}">♥ Save</button>`}
          </div>
        </div>
      </div>`;
  }

  /** Returns { shown, hiddenApprox } counts for the status line. */
  render() {
    if (!this.map || !this.markers) return { shown: 0 };
    this.markers.clearLayers();
    if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }

    const dest = getDestination(this.destinationId);
    const saved = storage.getSavedPlaces(dest.id);
    const savedIds = new Set(saved.map(p => p.id));
    const plans = storage.getDayPlans(dest.id);
    const dayOf = (id) => Object.keys(plans).find(d => (plans[d] || []).includes(id));

    let list = [];
    let routeIds = null;
    if (this.filter === 'all') {
      list = [...saved, ...dest.places.filter(p => !savedIds.has(p.id))];
    } else if (this.filter.startsWith('day')) {
      const byId = new Map(saved.map(p => [p.id, p]));
      routeIds = (plans[this.filter] || []).filter(id => byId.has(id));
      list = routeIds.map(id => byId.get(id));
    } else {
      list = saved;
    }

    const located = list.filter(p => p.coords && !p.approxLocation);
    const latLngs = [];
    located.forEach((place, i) => {
      const isSaved = savedIds.has(place.id);
      const day = dayOf(place.id);
      const dayNum = day ? parseInt(day.replace('day', ''), 10) : 0;
      const color = day ? DAY_COLORS[(dayNum - 1) % DAY_COLORS.length] : (isSaved ? '#1f9bff' : '#64748b');
      const label = routeIds ? String(i + 1) : '';
      const marker = L.marker(place.coords, { icon: this.pinIcon(place, label, color, !isSaved) })
        .bindPopup(this.popupHtml(place, isSaved), { maxWidth: 260, minWidth: 220 });
      this.markers.addLayer(marker);
      latLngs.push(place.coords);
    });

    if (routeIds && latLngs.length > 1 && this.showRoute) {
      const dayNum = parseInt(this.filter.replace('day', ''), 10);
      this.routeLine = L.polyline(latLngs, {
        color: DAY_COLORS[(dayNum - 1) % DAY_COLORS.length], weight: 4, opacity: 0.85, dashArray: '8 8'
      }).addTo(this.map);
    }

    if (latLngs.length > 1) this.map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 15 });
    else if (latLngs.length === 1) this.map.setView(latLngs[0], 15);
    else this.map.setView(dest.coords, 12);

    return { shown: located.length, hiddenApprox: list.length - located.length, total: list.length };
  }

  showMe(coords, center = true) {
    if (!this.map || !coords) return;
    if (this.meMarker) this.meMarker.setLatLng(coords);
    else {
      this.meMarker = L.marker(coords, {
        icon: L.divIcon({ className: 'furo-pin-wrap', html: '<div class="me-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }),
        zIndexOffset: 1000
      }).addTo(this.map);
    }
    if (center) this.map.setView(coords, 14);
  }
}

export const mapManager = new MapManager();
