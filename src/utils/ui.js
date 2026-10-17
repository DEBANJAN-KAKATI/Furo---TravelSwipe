/**
 * Small UI helpers shared across Furo: escaping, toasts, haptics.
 */

import { storage } from '../services/storageService.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow http(s), tel and data:image URLs into href/src attributes. */
export function safeUrl(url) {
  const u = String(url || '').trim();
  if (/^(https?:|tel:|data:image\/)/i.test(u)) return esc(u);
  return '#';
}

let toastTimer = null;
let actionUntil = 0;
let shownAt = 0;

/**
 * Shows a toast. Options: { action: { label, onClick }, duration, icon, wait }
 * `wait: true` toasts never interrupt a toast that offers an action (e.g. Undo).
 */
export function toast(message, options = {}) {
  const host = document.getElementById('toast');
  if (!host) return;
  if (options.wait) {
    // Let the current toast be read before replacing it
    const until = Math.max(actionUntil, host.classList.contains('show') ? shownAt + 1800 : 0);
    if (Date.now() < until) {
      setTimeout(() => toast(message, options), until - Date.now() + 250);
      return;
    }
  }
  clearTimeout(toastTimer);
  const { action, duration = action ? 4500 : 2600, icon = '' } = options;
  actionUntil = action ? Date.now() + duration : 0;
  host.innerHTML = `
    ${icon ? `<span class="toast-icon">${esc(icon)}</span>` : ''}
    <span class="toast-text">${esc(message)}</span>
    ${action ? `<button class="toast-action" type="button">${esc(action.label)}</button>` : ''}
  `;
  if (action) {
    host.querySelector('.toast-action').addEventListener('click', () => {
      host.classList.remove('show');
      actionUntil = 0;
      action.onClick();
    }, { once: true });
  }
  host.classList.remove('show');
  // restart animation
  void host.offsetWidth;
  host.classList.add('show');
  shownAt = Date.now();
  toastTimer = setTimeout(() => host.classList.remove('show'), duration);
}

export function haptic(ms = 12) {
  try {
    const active = !navigator.userActivation || navigator.userActivation.hasBeenActive;
    if (active && storage.getSettings().haptics && navigator.vibrate) navigator.vibrate(ms);
  } catch (e) { /* not supported */ }
}

export function plural(n, word, pluralWord) {
  return `${n} ${n === 1 ? word : (pluralWord || word + 's')}`;
}

/** Downscales an image file to a JPEG data URL so it fits in localStorage. */
export function compressImage(file, maxSide = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that photo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a supported image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function getCurrentPosition(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject(new Error(err.code === 1 ? 'Location permission was denied. Enable it in settings to use this.' : 'Could not get your location. Try again outdoors or check GPS.')),
      { enableHighAccuracy: false, timeout, maximumAge: 5 * 60 * 1000 }
    );
  });
}
