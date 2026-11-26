import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LiveGeoLocation } from '../types';
import { resolveApiUrl } from './apiConfig';
import { safeStorage } from '../services/safeStorage';

export interface ReverseGeocodedPlace {
  city: string;
  locality: string;
  fullAddress: string;
}

const GEO_STORAGE_KEY = 'smart_india_geo_cache_v1';
const GEO_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const geoCache = new Map<string, ReverseGeocodedPlace>();
const inFlightGeoLookups = new Map<string, Promise<ReverseGeocodedPlace | null>>();

function readStoredGeoCache(key: string): ReverseGeocodedPlace | null {
  try {
    const raw = safeStorage.getItem(GEO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, { place: ReverseGeocodedPlace; ts: number }>;
    const entry = parsed?.[key];
    if (entry && entry.place && Date.now() - entry.ts < GEO_CACHE_TTL_MS) {
      return entry.place;
    }
  } catch {}
  return null;
}

function writeStoredGeoCache(key: string, place: ReverseGeocodedPlace): void {
  try {
    const raw = safeStorage.getItem(GEO_STORAGE_KEY);
    const parsed: Record<string, { place: ReverseGeocodedPlace; ts: number }> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    parsed[key] = { place, ts: now };
    const entries = Object.entries(parsed)
      .filter(([, v]) => v && now - v.ts < GEO_CACHE_TTL_MS)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 80);
    safeStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

export function haversineDistanceKm(
  a?: Pick<LiveGeoLocation, 'lat' | 'lng'> | null,
  b?: Pick<LiveGeoLocation, 'lat' | 'lng'> | null
): number | null {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toLiveGeoLocation(lat: number, lng: number, coords: Position['coords'] | GeolocationCoordinates): LiveGeoLocation {
  const rawSpeed = coords.speed;
  const speedKmh =
    typeof rawSpeed === 'number' && !Number.isNaN(rawSpeed) && rawSpeed >= 0
      ? Math.round(rawSpeed * 3.6)
      : null;
  const heading =
    typeof coords.heading === 'number' && !Number.isNaN(coords.heading) && coords.heading >= 0
      ? Math.round(coords.heading)
      : null;
  const accuracy =
    typeof coords.accuracy === 'number' && !Number.isNaN(coords.accuracy)
      ? Math.round(coords.accuracy)
      : undefined;

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    accuracy,
    speedKmh,
    heading,
    updatedAtMs: Date.now(),
  };
}

export async function ensureLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        if (status.location !== 'granted') {
          const req = await Geolocation.requestPermissions({ permissions: ['location'] });
          return req.location === 'granted' ? 'granted' : 'denied';
        }
        return 'granted';
      }
      const req = await Geolocation.requestPermissions({ permissions: ['location'] });
      return req.location === 'granted' || req.coarseLocation === 'granted' ? 'granted' : 'denied';
    }
  } catch {
    // Fall back to standard browser Geolocation API below
  }

  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (res.state === 'denied') return 'denied';
      if (res.state === 'granted') return 'granted';
    } catch {
      // Ignore WebView permissions query quirks
    }
  }
  return 'prompt';
}

export async function getFreshPhoneGps(): Promise<LiveGeoLocation | null> {
  const perm = await ensureLocationPermission();
  if (perm === 'denied') return null;

  try {
    if (Capacitor.isNativePlatform()) {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 18000,
        maximumAge: 0,
      });
      return toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords);
    }
  } catch {
    // Fallback to navigator.geolocation below
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    let settled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        resolve(toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords));
      },
      () => {
        // Retry once with slightly longer timeout / fused network assist if pure GPS satellite timed out
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            if (settled) return;
            settled = true;
            resolve(toLiveGeoLocation(pos2.coords.latitude, pos2.coords.longitude, pos2.coords));
          },
          () => {
            if (!settled) {
              settled = true;
              resolve(null);
            }
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
        );
      },
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 0 }
    );
  });
}

export function watchExactPhoneGps(
  onLocation: (loc: LiveGeoLocation) => void,
  onError?: (err: { code: number; message: string }) => void
): () => void {
  let stopped = false;
  let capWatchId: string | null = null;
  let webWatchId: number | null = null;
  let bestRecentFix: { accuracy: number; timeMs: number } | null = null;

  const emitIfAccurate = (loc: LiveGeoLocation) => {
    if (stopped) return;
    const acc = loc.accuracy ?? 50;
    const now = Date.now();

    // Prevent coarse cell-tower/Wi-Fi bounce (e.g. snapping to nearby Metro station)
    // from overwriting a recent pinpoint GPS fix!
    if (
      bestRecentFix &&
      now - bestRecentFix.timeMs < 45000 &&
      bestRecentFix.accuracy <= 120 &&
      acc > 350 &&
      acc > bestRecentFix.accuracy * 3
    ) {
      return;
    }

    if (!bestRecentFix || acc <= bestRecentFix.accuracy || now - bestRecentFix.timeMs >= 45000) {
      bestRecentFix = { accuracy: acc, timeMs: now };
    }
    onLocation(loc);
  };

  const start = async () => {
    const perm = await ensureLocationPermission();
    if (stopped) return;
    if (perm === 'denied') {
      onError?.({ code: 1, message: 'Location permission denied' });
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        // Immediate high-accuracy initial fix
        Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 16000,
          maximumAge: 0,
        })
          .then((pos) => {
            if (pos) {
              emitIfAccurate(toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords));
            }
          })
          .catch(() => {});

        capWatchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          },
          (pos, err) => {
            if (stopped) return;
            if (err) {
              const msg = err instanceof Error ? err.message : String(err);
              const isPerm = /denied|permission/i.test(msg);
              onError?.({ code: isPerm ? 1 : 2, message: msg });
              return;
            }
            if (pos) {
              emitIfAccurate(toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords));
            }
          }
        );
        return;
      } catch {
        // Fall through to web navigator.geolocation if plugin bridge unavailable
      }
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.({ code: 2, message: 'Geolocation not supported' });
      return;
    }

    // Immediate fresh pinpoint GPS read (never return stale cache from minutes ago)
    navigator.geolocation.getCurrentPosition(
      (pos) => emitIfAccurate(toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords)),
      () => {},
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 0 }
    );

    // Continuous high-accuracy watch (never permanently downgrades to coarse network/metro tower)
    webWatchId = navigator.geolocation.watchPosition(
      (pos) => emitIfAccurate(toLiveGeoLocation(pos.coords.latitude, pos.coords.longitude, pos.coords)),
      (err) => {
        if (stopped) return;
        if (err.code === 1) {
          onError?.({ code: 1, message: err.message });
        } else {
          onError?.({ code: err.code, message: err.message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  void start();

  return () => {
    stopped = true;
    if (capWatchId !== null) {
      Geolocation.clearWatch({ id: capWatchId }).catch(() => {});
      capWatchId = null;
    }
    if (webWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(webWatchId);
      } catch {}
      webWatchId = null;
    }
  };
}

function parseOsmNominatimPlace(data: any, lat: number, lng: number): ReverseGeocodedPlace | null {
  if (!data || typeof data !== 'object') return null;
  const addr = data.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.state_district ||
    addr.county ||
    addr.state ||
    '';
  const streetPart =
    addr.house_number && addr.road
      ? `${addr.house_number}, ${addr.road}`
      : addr.road || addr.neighbourhood || addr.residential || '';
  const areaPart =
    addr.suburb ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    addr.locality ||
    '';
  const postcode = addr.postcode || '';

  const localityParts = [streetPart, areaPart, city].filter(Boolean);
  const uniqueLocality = Array.from(new Set(localityParts)).slice(0, 2).join(', ');
  const fullParts = [streetPart, areaPart, city, postcode].filter(Boolean);
  const uniqueFull = Array.from(new Set(fullParts)).join(', ');

  if (!uniqueFull && typeof data.display_name === 'string') {
    return {
      city: city || 'India',
      locality: data.display_name.split(',').slice(0, 2).join(',').trim(),
      fullAddress: data.display_name,
    };
  }

  if (!uniqueFull) {
    return {
      city: city || 'India',
      locality: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }

  return {
    city: city || 'India',
    locality: uniqueLocality || uniqueFull,
    fullAddress: uniqueFull,
  };
}

export async function reverseGeocodePhoneCoords(
  lat: number,
  lng: number
): Promise<ReverseGeocodedPlace | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const memCached = geoCache.get(key);
  if (memCached) return memCached;

  const diskCached = readStoredGeoCache(key);
  if (diskCached) {
    geoCache.set(key, diskCached);
    return diskCached;
  }

  const existingPromise = inFlightGeoLookups.get(key);
  if (existingPromise) return existingPromise;

  const lookupPromise = (async (): Promise<ReverseGeocodedPlace | null> => {
    let backendFallback: ReverseGeocodedPlace | null = null;
    // 1. Try cached backend proxy first (handles 5,000+ concurrent users via shared server cache + optional Google Maps)
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 4500);
      const res = await fetch(
        resolveApiUrl(`/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`),
        { signal: controller.signal }
      );
      window.clearTimeout(t);
      if (res.ok) {
        const json = (await res.json()) as Partial<ReverseGeocodedPlace> & { fallback?: boolean };
        if (json.fullAddress || json.locality) {
          const result: ReverseGeocodedPlace = {
            city: json.city || 'India',
            locality: json.locality || json.fullAddress || key,
            fullAddress: json.fullAddress || json.locality || key,
          };
          if (!json.fallback) {
            geoCache.set(key, result);
            writeStoredGeoCache(key, result);
            return result;
          }
          backendFallback = result;
        }
      }
    } catch {
      // Running inside offline APK or backend unreachable; try direct Nominatim fallback below
    }

    // 2. Direct OpenStreetMap Nominatim fallback
    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en-IN,en,hi' },
          signal: controller.signal,
        }
      );
      window.clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const parsed = parseOsmNominatimPlace(data, lat, lng);
        if (parsed) {
          geoCache.set(key, parsed);
          writeStoredGeoCache(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Graceful fallback
    }

    return backendFallback;
  })();

  inFlightGeoLookups.set(key, lookupPromise);
  try {
    return await lookupPromise;
  } finally {
    inFlightGeoLookups.delete(key);
  }
}
