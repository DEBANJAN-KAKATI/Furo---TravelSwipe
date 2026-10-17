/**
 * WeatherService - live forecast from Open-Meteo (free, no API key).
 * Falls back to the destination's bundled weather when offline.
 */

import { storage } from './storageService.js';

const TTL_MS = 30 * 60 * 1000;

const CODES = [
  [[0], '☀️', 'Clear sky'],
  [[1], '🌤️', 'Mostly clear'],
  [[2], '⛅', 'Partly cloudy'],
  [[3], '☁️', 'Overcast'],
  [[45, 48], '🌫️', 'Foggy'],
  [[51, 53, 55, 56, 57], '🌦️', 'Drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', 'Rain'],
  [[71, 73, 75, 77, 85, 86], '🌨️', 'Snow'],
  [[95, 96, 99], '⛈️', 'Thunderstorm']
];

export function describeCode(code, isDay = 1) {
  const hit = CODES.find(([codes]) => codes.includes(code));
  if (!hit) return { icon: '🌤️', label: 'Fair' };
  let icon = hit[1];
  if (!isDay && code <= 1) icon = '🌙';
  return { icon, label: hit[2] };
}

export function isRainy(code) {
  return code >= 51 && code <= 99 && !(code >= 71 && code <= 77);
}

function advisoryFor(current, daily) {
  const today = daily[0];
  const tomorrow = daily[1];
  if (current && isRainy(current.code)) return 'Rain right now — indoor spots, cafés and markets are your friends.';
  if (today && today.rainChance >= 60) return `High chance of rain today (${today.rainChance}%). Keep an umbrella handy.`;
  if (tomorrow && tomorrow.rainChance >= 60) return `Rain likely tomorrow (${tomorrow.rainChance}%) — plan outdoor spots for today.`;
  if (current && current.temp >= 34) return 'Hot day — do outdoor spots early morning or after sunset, and stay hydrated.';
  if (current && current.temp <= 8) return 'Chilly out there — layer up for evening walks.';
  return 'Good conditions for exploring outdoors.';
}

function hhmm(iso) {
  if (!iso) return '';
  const t = iso.split('T')[1] || '';
  return t.slice(0, 5);
}

export async function getWeather(dest) {
  if (!dest || !dest.coords) return null;
  const cache = storage.getWeatherCache();
  const hit = cache[dest.id];
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.data;

  const [lat, lon] = dest.coords;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code,is_day,apparent_temperature' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
    '&timezone=auto&forecast_days=4';

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('weather ' + res.status);
    const json = await res.json();
    const c = json.current || {};
    const d = json.daily || {};
    const current = {
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      code: c.weather_code,
      ...describeCode(c.weather_code, c.is_day)
    };
    const daily = (d.time || []).map((date, i) => ({
      date,
      code: d.weather_code[i],
      ...describeCode(d.weather_code[i]),
      max: Math.round(d.temperature_2m_max[i]),
      min: Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max ? (d.precipitation_probability_max[i] || 0) : 0,
      sunrise: hhmm(d.sunrise[i]),
      sunset: hhmm(d.sunset[i])
    }));
    const data = {
      live: true,
      temp: `${current.temp}°C`,
      icon: current.icon,
      condition: current.label,
      feels: `${current.feels}°C`,
      code: current.code,
      sunset: daily[0] ? daily[0].sunset : '',
      sunrise: daily[0] ? daily[0].sunrise : '',
      advisory: advisoryFor(current, daily),
      daily
    };
    cache[dest.id] = { fetchedAt: Date.now(), data };
    storage.saveWeatherCache(cache);
    return data;
  } catch (e) {
    if (hit) return hit.data;
    return fallbackWeather(dest);
  }
}

export function fallbackWeather(dest) {
  const w = dest && dest.weather;
  if (!w) return null;
  return {
    live: false,
    temp: (w.temp || '').split('/')[0].trim(),
    icon: w.icon || '🌤️',
    condition: w.condition || '',
    sunset: w.sunset || '',
    advisory: w.advisory || '',
    daily: []
  };
}
