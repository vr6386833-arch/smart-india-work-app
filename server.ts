import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function isValidVerhoeff12(digits: string): boolean {
  if (!/^[2-9]\d{11}$/.test(digits)) return false;
  if (/^(\d)\1{11}$/.test(digits)) return false;
  let c = 0;
  const rev = digits.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][rev[i]]];
  }
  return c === 0;
}

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function normalizeOrigin(raw?: string): string {
  if (!raw) return '';
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return '';
  }
}

function buildAllowedOrigins(): Set<string> {
  const allowed = new Set<string>([
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  const appOrigin = normalizeOrigin(process.env.APP_URL);
  if (appOrigin) allowed.add(appOrigin);

  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);
  extra.forEach((origin) => allowed.add(origin));
  return allowed;
}

interface ReverseGeoResult {
  city: string;
  locality: string;
  fullAddress: string;
  fallback?: boolean;
}

const GEO_CACHE_MAX = 15000;
const GEO_CACHE_STALE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const GEO_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const geocodeCache = new Map<string, { value: ReverseGeoResult; cachedAtMs: number; expiresAtMs: number }>();
const inFlightGeocodes = new Map<string, Promise<ReverseGeoResult | null>>();

function setGeocodeCache(key: string, value: ReverseGeoResult) {
  if (geocodeCache.size >= GEO_CACHE_MAX) {
    const oldestKey = geocodeCache.keys().next().value;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  const now = Date.now();
  geocodeCache.set(key, { value, cachedAtMs: now, expiresAtMs: now + GEO_CACHE_TTL_MS });
}

function isRealConfiguredKey(val?: string): string {
  const clean = (val || '').trim();
  if (!clean || clean.startsWith('MY_') || clean.includes('your-live-backend')) return '';
  return clean;
}

async function fetchGoogleReverseGeocode(lat: number, lng: number, apiKey: string): Promise<ReverseGeoResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      `${lat},${lng}`
    )}&language=en&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{ long_name: string; types: string[] }>;
      }>;
    };
    if (data.status !== 'OK' || !data.results?.length) return null;
    const top = data.results[0];
    const comps = top.address_components || [];
    const findComp = (types: string[]) =>
      comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name || '';

    const city =
      findComp(['locality', 'administrative_area_level_2', 'administrative_area_level_1']) || 'India';
    const sublocality =
      findComp(['sublocality_level_2', 'sublocality_level_1', 'sublocality', 'neighborhood', 'route']) || '';
    const locality = Array.from(new Set([sublocality, city].filter(Boolean))).slice(0, 2).join(', ');
    return {
      city,
      locality: locality || top.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      fullAddress: top.formatted_address || locality || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOsmReverseGeocode(lat: number, lng: number): Promise<ReverseGeoResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'SmartIndiaWorkApp/1.0 (https://smartindiawork.in)',
        'Accept-Language': 'en-IN,en,hi',
      },
      signal: controller.signal,
    });
    if (!osmRes.ok) return null;
    const data = (await osmRes.json()) as { address?: Record<string, string>; display_name?: string };
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.state_district || addr.county || addr.state || '';
    const streetPart =
      addr.house_number && addr.road
        ? `${addr.house_number}, ${addr.road}`
        : addr.road || addr.neighbourhood || addr.residential || '';
    const areaPart = addr.suburb || addr.village || addr.town || addr.city_district || addr.locality || '';
    const postcode = addr.postcode || '';
    const localityParts = Array.from(new Set([streetPart, areaPart, city].filter(Boolean)));
    const fullParts = Array.from(new Set([streetPart, areaPart, city, postcode].filter(Boolean)));
    return {
      city: city || 'India',
      locality: localityParts.slice(0, 2).join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      fullAddress: fullParts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function resolveUpstreamGeocode(cacheKey: string, lat: number, lng: number): Promise<ReverseGeoResult | null> {
  let pending = inFlightGeocodes.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const mapsServerKey =
        isRealConfiguredKey(process.env.GOOGLE_MAPS_SERVER_KEY) ||
        isRealConfiguredKey(process.env.GOOGLE_MAPS_API_KEY);
      if (mapsServerKey) {
        const gResult = await fetchGoogleReverseGeocode(lat, lng, mapsServerKey);
        if (gResult) return gResult;
      }
      return fetchOsmReverseGeocode(lat, lng);
    })().finally(() => {
      inFlightGeocodes.delete(cacheKey);
    });
    inFlightGeocodes.set(cacheKey, pending);
  }
  return pending;
}

// Carrier-NAT-safe rate limiter: allows 150 requests / 5 min per shared IP, and 12 tries / 10 min per Aadhaar number
const AADHAAR_IP_WINDOW_MS = 5 * 60 * 1000;
const AADHAAR_IP_MAX = 150;
const AADHAAR_DOC_WINDOW_MS = 10 * 60 * 1000;
const AADHAAR_DOC_MAX = 12;
const aadhaarIpHits = new Map<string, number[]>();
const aadhaarDocHits = new Map<string, number[]>();

function hitSlidingWindow(store: Map<string, number[]>, key: string, windowMs: number, maxHits: number): boolean {
  const now = Date.now();
  if (store.size > 3000) {
    for (const [k, hits] of store.entries()) {
      if (hits.every((t) => now - t > windowMs)) {
        store.delete(k);
      }
    }
  }
  const prev = (store.get(key) || []).filter((t) => now - t < windowMs);
  if (prev.length >= maxHits) {
    store.set(key, prev);
    return true;
  }
  prev.push(now);
  store.set(key, prev);
  return false;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = Number(process.env.PORT) || 3000;
  const allowedOrigins = buildAllowedOrigins();

  app.use('/api', (req, res, next) => {
    const reqOrigin = typeof req.headers.origin === 'string' ? normalizeOrigin(req.headers.origin) : '';
    const hostOrigin = req.headers.host ? `https://${req.headers.host}` : '';
    if (reqOrigin && (allowedOrigins.has(reqOrigin) || (hostOrigin && reqOrigin === hostOrigin))) {
      res.setHeader('Access-Control-Allow-Origin', reqOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  });

  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    const hasTurnServer = Boolean(isRealConfiguredKey(process.env.TURN_URL));
    const hasGoogleMapsServer = Boolean(
      isRealConfiguredKey(process.env.GOOGLE_MAPS_SERVER_KEY) || isRealConfiguredKey(process.env.GOOGLE_MAPS_API_KEY)
    );
    res.json({
      ok: true,
      service: 'smart-india-work-api',
      geocoderCacheSize: geocodeCache.size,
      hasTurnServer,
      hasGoogleMapsServer,
    });
  });

  app.get('/api/ice-servers', (_req, res) => {
    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];
    const rawTurnUrl = isRealConfiguredKey(process.env.TURN_URL);
    if (rawTurnUrl) {
      const turnUrls = rawTurnUrl
        .split(',')
        .map((u) => u.trim())
        .filter((u) => /^turns?:/.test(u));
      if (turnUrls.length > 0) {
        const username = isRealConfiguredKey(process.env.TURN_USERNAME);
        const credential = isRealConfiguredKey(process.env.TURN_CREDENTIAL);
        iceServers.push({
          urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
          ...(username ? { username } : {}),
          ...(credential ? { credential } : {}),
        });
      }
    }
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.json({ iceServers });
  });

  app.get('/api/reverse-geocode', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const now = Date.now();
    const cached = geocodeCache.get(cacheKey);
    if (cached && cached.expiresAtMs > now) {
      // Stale-while-revalidate after 7 days so users never wait or stop
      if (now - cached.cachedAtMs > GEO_CACHE_STALE_REFRESH_MS) {
        void resolveUpstreamGeocode(cacheKey, lat, lng).then((fresh) => {
          if (fresh) setGeocodeCache(cacheKey, fresh);
        });
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.json(cached.value);
    }

    try {
      const result = await resolveUpstreamGeocode(cacheKey, lat, lng);
      if (result) {
        setGeocodeCache(cacheKey, result);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.json(result);
      }
    } catch {
      // Fall through to non-blocking GPS fallback below
    }

    // Never fail with 502 if external geocoder is momentarily busy — return coordinate fallback cleanly
    if (cached) {
      return res.json(cached.value);
    }
    return res.json({
      city: 'India',
      locality: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      fullAddress: `GPS Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      fallback: true,
    });
  });

  app.post('/api/verify-aadhaar', async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const body = req.body as {
        imageDataUrl?: unknown;
        expectedName?: unknown;
        expectedAadhaar?: unknown;
      };

      const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
      const expectedName = typeof body?.expectedName === 'string' ? body.expectedName.trim() : '';
      const expectedAadhaar =
        typeof body?.expectedAadhaar === 'string'
          ? body.expectedAadhaar.replace(/\D/g, '').slice(0, 12)
          : '';

      if (
        hitSlidingWindow(aadhaarIpHits, clientIp, AADHAAR_IP_WINDOW_MS, AADHAAR_IP_MAX) ||
        (expectedAadhaar.length === 12 &&
          hitSlidingWindow(aadhaarDocHits, expectedAadhaar, AADHAAR_DOC_WINDOW_MS, AADHAAR_DOC_MAX))
      ) {
        return res.status(429).json({
          verified: false,
          serverUnavailable: true,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'सर्वर अभी व्यस्त है — 1 मिनट बाद पुनः प्रयास करें।',
          reasonEn: 'Verification server busy — please retry in a minute.',
        });
      }

      if (!expectedName || expectedName.length < 2) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'कृपया पहले अपना पूरा नाम दर्ज करें।',
          reasonEn: 'Please enter your full name first.',
        });
      }

      if (!isValidVerhoeff12(expectedAadhaar)) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'आधार नंबर अमान्य है (UIDAI चेकसम गलत है)। कृपया सही 12-अंकों का आधार नंबर डालें।',
          reasonEn: 'Invalid 12-digit Aadhaar number (UIDAI checksum mismatch).',
        });
      }

      const dataUrlMatch = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
        imageDataUrl
      );
      if (!dataUrlMatch) {
        return res.status(400).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'कृपया आधार कार्ड की सही फोटो (JPG/PNG) अपलोड करें।',
          reasonEn: 'Please upload a valid Aadhaar card image (JPG/PNG/WebP).',
        });
      }

      if (!aiClient) {
        return res.status(503).json({
          verified: false,
          isAadhaarCard: false,
          nameMatches: false,
          numberMatches: false,
          extractedName: '',
          extractedLast4Digits: '',
          reasonHi: 'आधार कार्ड OCR सत्यापन सेवा अभी कॉन्फ़िगर नहीं है।',
          reasonEn: 'Aadhaar OCR verification service is not configured on the server.',
        });
      }

      const mimeType = dataUrlMatch[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : dataUrlMatch[1].toLowerCase();
      const base64Data = dataUrlMatch[2];
      const expectedLast4 = expectedAadhaar.slice(-4);

      const promptText = [
        'Inspect this uploaded Indian identity document photo strictly.',
        `Worker applicant entered Name: "${expectedName}"`,
        `Worker applicant entered Aadhaar last 4 digits: "${expectedLast4}"`,
        '',
        'Rules:',
        '1) Set isAadhaarCard = true ONLY if this is genuinely a front or full Indian Aadhaar card (Government of India / Unique Identification Authority of India / Mera Aadhaar format with name, photo/QR, or 12-digit XXXX XXXX XXXX format). If it is a blank wall, random selfie, unrelated object, blurred unreadable blob, or non-Aadhaar paper, set isAadhaarCard = false.',
        '2) Extract extractedName as printed on the Aadhaar card (English or Hindi).',
        '3) Extract extractedLast4Digits (only the last 4 digits visible on the card; empty string if not legible).',
        '4) Set nameMatchesCard = true ONLY if extractedName reasonably matches the applicant entered Name (allow minor Hindi/English spelling differences, middle name, or case differences; set false if clearly a different person!).',
        '5) Set last4MatchesCard = true if extractedLast4Digits is empty/masked-cropped OR equals the applicant last 4 digits; set false ONLY if clear 4 digits are visible on card and DO NOT match the entered last 4 digits.',
      ].join('\n');

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: promptText },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAadhaarCard: { type: Type.BOOLEAN },
              extractedName: { type: Type.STRING },
              extractedLast4Digits: { type: Type.STRING },
              nameMatchesCard: { type: Type.BOOLEAN },
              last4MatchesCard: { type: Type.BOOLEAN },
              reasonHi: { type: Type.STRING },
              reasonEn: { type: Type.STRING },
            },
            required: [
              'isAadhaarCard',
              'extractedName',
              'extractedLast4Digits',
              'nameMatchesCard',
              'last4MatchesCard',
              'reasonHi',
              'reasonEn',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim()) as {
        isAadhaarCard?: boolean;
        extractedName?: string;
        extractedLast4Digits?: string;
        nameMatchesCard?: boolean;
        last4MatchesCard?: boolean;
        reasonHi?: string;
        reasonEn?: string;
      };

      const isAadhaarCard = Boolean(parsed.isAadhaarCard);
      const extractedName = (parsed.extractedName || '').trim();
      const extractedLast4Digits = (parsed.extractedLast4Digits || '').replace(/\D/g, '').slice(-4);
      const nameMatches = isAadhaarCard && Boolean(parsed.nameMatchesCard) && Boolean(extractedName);
      const numberMatches =
        isAadhaarCard &&
        (extractedLast4Digits.length === 4 ? extractedLast4Digits === expectedLast4 : Boolean(parsed.last4MatchesCard));

      const verified = isAadhaarCard && nameMatches && numberMatches;

      let reasonHi = parsed.reasonHi || '';
      let reasonEn = parsed.reasonEn || '';
      if (!isAadhaarCard) {
        reasonHi =
          'अपलोड की गई फोटो असली आधार कार्ड की नहीं है। कृपया अपने असली आधार कार्ड की साफ फोटो अपलोड करें।';
        reasonEn =
          'Uploaded photo does not look like a real Indian Aadhaar Card. Please upload a clear Aadhaar card front photo.';
      } else if (!nameMatches) {
        reasonHi = extractedName
          ? `आधार कार्ड पर नाम "${extractedName}" लिखा है, जो आपके डाले नाम "${expectedName}" से मेल नहीं खाता!`
          : 'आधार कार्ड पर नाम साफ नहीं दिख रहा है या आपके नाम से मेल नहीं खाता।';
        reasonEn = extractedName
          ? `Name on Aadhaar Card ("${extractedName}") does not match your entered name ("${expectedName}").`
          : 'Could not verify your name on the uploaded Aadhaar photo.';
      } else if (!numberMatches) {
        reasonHi = `आधार फोटो पर दिख रहे अंतिम 4 अंक (${extractedLast4Digits || '????'}) आपके डाले आधार नंबर (XXXX-${expectedLast4}) से मेल नहीं खाते।`;
        reasonEn = `Aadhaar number on photo (ending ${extractedLast4Digits || '????'}) does not match entered Aadhaar (ending ${expectedLast4}).`;
      } else {
        reasonHi = `✓ आधार कार्ड व नाम (${extractedName}) सफलतापूर्वक सत्यापित हो गया!`;
        reasonEn = `✓ Aadhaar Card & Name (${extractedName}) verified successfully!`;
      }

      return res.json({
        verified,
        isAadhaarCard,
        nameMatches,
        numberMatches,
        extractedName,
        extractedLast4Digits,
        reasonHi,
        reasonEn,
      });
    } catch (err) {
      console.error('Aadhaar verification error:', err);
      return res.status(502).json({
        verified: false,
        isAadhaarCard: false,
        nameMatches: false,
        numberMatches: false,
        extractedName: '',
        extractedLast4Digits: '',
        reasonHi: 'आधार फोटो जांचने में सर्वर त्रुटि आई — कृपया दोबारा प्रयास करें।',
        reasonEn: 'Failed to analyze Aadhaar photo. Please try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart India Work server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
