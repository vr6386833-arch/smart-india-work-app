import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { Crosshair, Navigation, MapPin, ExternalLink, Clock } from 'lucide-react';
import { Language, LiveGeoLocation } from '../../types';
import { soundManager } from '../../services/soundEffects';

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (typeof process !== 'undefined' ? (process.env.GOOGLE_MAPS_API_KEY as string | undefined) : undefined) ||
  '';

// Geographic center of India (never jumps to a city metro station when GPS is still acquiring)
const NEUTRAL_INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };

interface PolylineLike {
  setMap: (map: unknown) => void;
  setOptions?: (opts: Record<string, unknown>) => void;
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

function formatAgo(updatedAtMs: number | undefined, language: Language): string {
  if (!updatedAtMs) return '';
  const diffSec = Math.max(0, Math.round((Date.now() - updatedAtMs) / 1000));
  if (diffSec < 12) return language === 'hi' ? 'अभी लाइव' : 'Just now';
  if (diffSec < 60) return language === 'hi' ? `${diffSec} सेकंड पहले` : `${diffSec}s ago`;
  const mins = Math.round(diffSec / 60);
  return language === 'hi' ? `${mins} मिनट पहले` : `${mins}m ago`;
}

interface LeafletFallbackMapProps {
  customerLoc: LiveGeoLocation | null;
  localWorkerLoc: LiveGeoLocation | null;
  customerName: string;
  destinationAddress: string;
  language: Language;
  isWorkerMode: boolean;
  recenterSignal: number;
  externalGoogleMapsUrl: string | null;
}

const LeafletFallbackMap: React.FC<LeafletFallbackMapProps> = ({
  customerLoc,
  localWorkerLoc,
  customerName,
  destinationAddress,
  language,
  isWorkerMode,
  recenterSignal,
  externalGoogleMapsUrl,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const workerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initCenter = customerLoc
      ? ([customerLoc.lat, customerLoc.lng] as [number, number])
      : isWorkerMode && localWorkerLoc
      ? ([localWorkerLoc.lat, localWorkerLoc.lng] as [number, number])
      : ([NEUTRAL_INDIA_CENTER.lat, NEUTRAL_INDIA_CENTER.lng] as [number, number]);

    const map = L.map(containerRef.current, {
      center: initCenter,
      zoom: customerLoc || (isWorkerMode && localWorkerLoc) ? 16 : 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
      workerMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const esc = (s: string) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const effectiveWorkerLoc = isWorkerMode ? localWorkerLoc : null;

    if (customerLoc) {
      const custLabel = isWorkerMode
        ? language === 'hi'
          ? 'ग्राहक लाइव'
          : 'Customer Live'
        : language === 'hi'
        ? 'मेरा फ़ोन'
        : 'My Phone';
      const custHtml = `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);">
        <div style="background:#e11d48;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;border:1.5px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.45);">
          📍 ${custLabel}
        </div>
        <div style="width:14px;height:14px;border-radius:50%;background:#f43f5e;border:2px solid #fff;margin-top:2px;box-shadow:0 0 0 4px rgba(244,63,94,.3);"></div>
      </div>`;
      const custIcon = L.divIcon({
        html: custHtml,
        className: 'siw-leaflet-pin',
        iconSize: [0, 0],
      });
      if (!customerMarkerRef.current) {
        customerMarkerRef.current = L.marker([customerLoc.lat, customerLoc.lng], { icon: custIcon }).addTo(map);
      } else {
        customerMarkerRef.current.setLatLng([customerLoc.lat, customerLoc.lng]);
        customerMarkerRef.current.setIcon(custIcon);
      }
      customerMarkerRef.current.bindPopup(
        `<div style="font-size:11px;"><strong>📍 ${esc(customerName)}</strong><br/>${esc(destinationAddress)}<br/><code>${customerLoc.lat.toFixed(5)}, ${customerLoc.lng.toFixed(5)}</code></div>`
      );
    } else if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
      customerMarkerRef.current = null;
    }

    if (effectiveWorkerLoc) {
      const wrkHtml = `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);">
        <div style="background:#059669;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;border:1.5px solid #fff;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.45);">
          🛵 ${language === 'hi' ? 'आप (कारीगर)' : 'You'}
        </div>
        <div style="width:13px;height:13px;border-radius:50%;background:#10b981;border:2px solid #fff;margin-top:2px;box-shadow:0 0 0 4px rgba(16,185,129,.35);"></div>
      </div>`;
      const wrkIcon = L.divIcon({
        html: wrkHtml,
        className: 'siw-leaflet-pin',
        iconSize: [0, 0],
      });
      if (!workerMarkerRef.current) {
        workerMarkerRef.current = L.marker([effectiveWorkerLoc.lat, effectiveWorkerLoc.lng], { icon: wrkIcon }).addTo(map);
      } else {
        workerMarkerRef.current.setLatLng([effectiveWorkerLoc.lat, effectiveWorkerLoc.lng]);
        workerMarkerRef.current.setIcon(wrkIcon);
      }
    } else if (workerMarkerRef.current) {
      workerMarkerRef.current.remove();
      workerMarkerRef.current = null;
    }

    if (customerLoc && effectiveWorkerLoc) {
      const pts: [number, number][] = [
        [effectiveWorkerLoc.lat, effectiveWorkerLoc.lng],
        [customerLoc.lat, customerLoc.lng],
      ];
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(pts, {
          color: '#10b981',
          weight: 4,
          dashArray: '8 6',
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(pts);
      }
      map.fitBounds(L.latLngBounds(pts), { padding: [44, 44], maxZoom: 16 });
    } else if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
      if (customerLoc) {
        map.setView([customerLoc.lat, customerLoc.lng], 16);
      } else if (effectiveWorkerLoc) {
        map.setView([effectiveWorkerLoc.lat, effectiveWorkerLoc.lng], 15);
      }
    } else if (customerLoc) {
      map.setView([customerLoc.lat, customerLoc.lng], 16);
    } else if (effectiveWorkerLoc) {
      map.setView([effectiveWorkerLoc.lat, effectiveWorkerLoc.lng], 15);
    }
  }, [
    customerLoc?.lat,
    customerLoc?.lng,
    localWorkerLoc?.lat,
    localWorkerLoc?.lng,
    customerName,
    destinationAddress,
    language,
    isWorkerMode,
    recenterSignal,
  ]);

  return (
    <div className="relative w-full h-full bg-slate-900">
      <div ref={containerRef} className="w-full h-full z-10" />
      {!customerLoc && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-4">
          <div className="bg-slate-950/90 border border-slate-700 rounded-2xl px-4 py-3 text-center max-w-xs shadow-xl backdrop-blur-sm pointer-events-auto space-y-2">
            <p className="text-xs font-bold text-white leading-snug">
              {isWorkerMode
                ? language === 'hi'
                  ? '📍 ग्राहक के फ़ोन की लाइव GPS लोकेशन प्रतीक्षारत है...'
                  : '📍 Waiting for Customer phone Live GPS...'
                : language === 'hi'
                ? '📍 आपके फ़ोन की सटीक GPS लोकेशन ली जा रही है — नीचे "मेरी लोकेशन अपडेट करें" दबाएं'
                : '📍 Fetching your phone exact GPS — tap button below to share'}
            </p>
            {isWorkerMode && externalGoogleMapsUrl && (
              <a
                href={externalGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{language === 'hi' ? 'Google Maps खोलें' : 'Open Google Maps'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ViewportAndRouteProps {
  customerLoc: LiveGeoLocation | null;
  localWorkerLoc: LiveGeoLocation | null;
  isWorkerMode: boolean;
  recenterSignal: number;
  onRouteInfo: (info: { distanceMeters: number; durationMillis: number } | null) => void;
}

const ViewportAndRouteLayer: React.FC<ViewportAndRouteProps> = ({
  customerLoc,
  localWorkerLoc,
  isWorkerMode,
  recenterSignal,
  onRouteInfo,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<PolylineLike[]>([]);
  const lastRouteKeyRef = useRef<string>('');
  const lastRouteTimeRef = useRef<number>(0);

  const effectiveWorkerLoc = isWorkerMode ? localWorkerLoc : null;

  useEffect(() => {
    if (!map) return;
    const g = (window as unknown as { google?: any }).google;
    if (!g?.maps) return;

    if (customerLoc && effectiveWorkerLoc) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: customerLoc.lat, lng: customerLoc.lng });
      bounds.extend({ lat: effectiveWorkerLoc.lat, lng: effectiveWorkerLoc.lng });
      map.fitBounds(bounds, { top: 52, right: 44, bottom: 52, left: 44 });
    } else if (customerLoc) {
      map.panTo({ lat: customerLoc.lat, lng: customerLoc.lng });
      if ((map.getZoom() || 0) < 15) map.setZoom(16);
    } else if (effectiveWorkerLoc) {
      map.panTo({ lat: effectiveWorkerLoc.lat, lng: effectiveWorkerLoc.lng });
      if ((map.getZoom() || 0) < 14) map.setZoom(15);
    }
  }, [
    map,
    customerLoc?.lat,
    customerLoc?.lng,
    effectiveWorkerLoc?.lat,
    effectiveWorkerLoc?.lng,
    recenterSignal,
  ]);

  useEffect(() => {
    if (!map || !routesLib || !customerLoc || !effectiveWorkerLoc) {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      onRouteInfo(null);
      return;
    }

    const coordKey = `${effectiveWorkerLoc.lat.toFixed(3)},${effectiveWorkerLoc.lng.toFixed(3)}->${customerLoc.lat.toFixed(3)},${customerLoc.lng.toFixed(3)}`;
    const now = Date.now();
    if (
      coordKey === lastRouteKeyRef.current &&
      now - lastRouteTimeRef.current < 25000 &&
      polylinesRef.current.length > 0
    ) {
      return;
    }
    lastRouteKeyRef.current = coordKey;
    lastRouteTimeRef.current = now;

    let cancelled = false;
    const RouteClass = (routesLib as unknown as { Route?: { computeRoutes?: (req: unknown) => Promise<{ routes?: any[] }> } }).Route;
    if (!RouteClass?.computeRoutes) return;

    RouteClass.computeRoutes({
      origin: { lat: effectiveWorkerLoc.lat, lng: effectiveWorkerLoc.lng },
      destination: { lat: customerLoc.lat, lng: customerLoc.lng },
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) return;

        polylinesRef.current.forEach((p) => p.setMap(null));
        const newPolylines: PolylineLike[] = primaryRoute.createPolylines?.() || [];
        newPolylines.forEach((poly) => {
          poly.setOptions?.({
            strokeColor: '#10b981',
            strokeOpacity: 0.92,
            strokeWeight: 5,
          });
          poly.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (typeof primaryRoute.distanceMeters === 'number') {
          onRouteInfo({
            distanceMeters: primaryRoute.distanceMeters,
            durationMillis: primaryRoute.durationMillis || 0,
          });
        }
      })
      .catch((err: unknown) => {
        const msg = String((err as { message?: string })?.message || err || '');
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('Quota') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        } else {
          console.warn('Routes API computeRoutes notice:', msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [map, routesLib, customerLoc, effectiveWorkerLoc, onRouteInfo]);

  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, []);

  return null;
};

interface GoogleLiveMapProps {
  customerLoc: LiveGeoLocation | null;
  localWorkerLoc?: LiveGeoLocation | null;
  customerName: string;
  destinationAddress: string;
  detectedCustomerPlace?: string;
  language: Language;
  mapTheme?: 'dark' | 'light';
  isWorkerMode?: boolean;
  heightClass?: string;
}

export const GoogleLiveMap: React.FC<GoogleLiveMapProps> = ({
  customerLoc,
  localWorkerLoc = null,
  customerName,
  destinationAddress,
  detectedCustomerPlace,
  language,
  mapTheme = 'dark',
  isWorkerMode = false,
  heightClass = 'h-64 sm:h-72',
}) => {
  const [customerMarkerRef, customerMarker] = useAdvancedMarkerRef();
  const [workerMarkerRef] = useAdvancedMarkerRef();
  const [openInfo, setOpenInfo] = useState<'customer' | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [routeInfo, setRouteInfo] = useState<{ distanceMeters: number; durationMillis: number } | null>(null);
  const [quotaReached, setQuotaReached] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaReached(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Strictly one-way: Customer never sees Worker GPS!
  const effectiveWorkerLoc = isWorkerMode ? localWorkerLoc : null;

  const straightKm = effectiveWorkerLoc && customerLoc ? haversineDistanceKm(effectiveWorkerLoc, customerLoc) : null;
  const displayDistanceKm =
    routeInfo?.distanceMeters && routeInfo.distanceMeters > 0
      ? (routeInfo.distanceMeters / 1000).toFixed(1)
      : straightKm !== null
      ? straightKm.toFixed(1)
      : null;

  const displayEtaMins =
    routeInfo?.durationMillis && routeInfo.durationMillis > 0
      ? Math.max(1, Math.round(routeInfo.durationMillis / 60000))
      : straightKm !== null
      ? Math.max(2, Math.round((straightKm / 24) * 60))
      : null;

  const defaultCenter = customerLoc
    ? { lat: customerLoc.lat, lng: customerLoc.lng }
    : effectiveWorkerLoc
    ? { lat: effectiveWorkerLoc.lat, lng: effectiveWorkerLoc.lng }
    : NEUTRAL_INDIA_CENTER;

  // Worker opens Google Maps directly to Customer's exact phone pin (lat,lng) — never to a metro guess!
  const externalGoogleMapsUrl = isWorkerMode
    ? customerLoc
      ? `https://www.google.com/maps/dir/?api=1&destination=${customerLoc.lat},${customerLoc.lng}&travelmode=driving`
      : null
    : customerLoc
    ? `https://www.google.com/maps/search/?api=1&query=${customerLoc.lat},${customerLoc.lng}`
    : null;

  const canRenderInteractiveMap = Boolean(MAPS_API_KEY) && !quotaReached;
  const resolvedPlaceText = detectedCustomerPlace || destinationAddress;

  return (
    <div className="relative w-full overflow-hidden bg-slate-950">
      {/* Live Telemetry Strip */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          {isWorkerMode && displayDistanceKm !== null ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
              <Navigation className="w-3 h-3" />
              <span>{displayDistanceKm} km</span>
              {displayEtaMins !== null && (
                <>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>~{displayEtaMins} min</span>
                </>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 font-semibold max-w-full truncate">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">
                {customerLoc
                  ? isWorkerMode
                    ? language === 'hi'
                      ? `✓ ग्राहक लाइव लोकेशन प्राप्त${customerLoc.accuracy ? ` (±${customerLoc.accuracy}m)` : ''}`
                      : `✓ Customer Live Pin Received${customerLoc.accuracy ? ` (±${customerLoc.accuracy}m)` : ''}`
                    : language === 'hi'
                    ? `✓ आपकी फ़ोन लोकेशन लाइव${customerLoc.accuracy ? ` (±${customerLoc.accuracy}m)` : ''}`
                    : `✓ Your Phone Location Live${customerLoc.accuracy ? ` (±${customerLoc.accuracy}m)` : ''}`
                  : isWorkerMode
                  ? language === 'hi'
                    ? 'ग्राहक के फ़ोन से लाइव लोकेशन आ रही है...'
                    : 'Waiting for customer live phone GPS...'
                  : language === 'hi'
                  ? 'फ़ोन की सटीक GPS लोकेशन ली जा रही है...'
                  : 'Acquiring exact phone GPS...'}
              </span>
            </span>
          )}
        </div>

        {externalGoogleMapsUrl && (
          <a
            href={externalGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playTap()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>
              {isWorkerMode
                ? language === 'hi'
                  ? 'Google Maps से रास्ता खोलें'
                  : 'Navigate in Google Maps'
                : language === 'hi'
                ? 'मेरी पिन मैप पर देखें'
                : 'View My Pin'}
            </span>
          </a>
        )}
      </div>

      {/* Real Interactive Map Canvas */}
      <div className={`relative w-full ${heightClass}`}>
        {canRenderInteractiveMap ? (
          <APIProvider
            apiKey={MAPS_API_KEY}
            language={language === 'hi' ? 'hi' : 'en'}
            region="IN"
            libraries={['marker', 'routes']}
          >
            <GoogleMap
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={defaultCenter}
              defaultZoom={customerLoc ? 16 : 5}
              gestureHandling="greedy"
              disableDefaultUI={true}
              zoomControl={true}
              colorScheme={mapTheme === 'dark' ? 'DARK' : 'LIGHT'}
              className="w-full h-full"
            >
              <ViewportAndRouteLayer
                customerLoc={customerLoc}
                localWorkerLoc={effectiveWorkerLoc}
                isWorkerMode={isWorkerMode}
                recenterSignal={recenterSignal}
                onRouteInfo={setRouteInfo}
              />

              {customerLoc && (
                <AdvancedMarker
                  ref={customerMarkerRef}
                  position={{ lat: customerLoc.lat, lng: customerLoc.lng }}
                  onClick={() => setOpenInfo('customer')}
                  title={`${customerName} (Live Phone)`}
                >
                  <div className="flex flex-col items-center cursor-pointer">
                    <div className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-lg border border-white/80 whitespace-nowrap mb-0.5">
                      📍 {isWorkerMode ? (language === 'hi' ? 'ग्राहक लाइव' : 'Customer Live') : (language === 'hi' ? 'मेरा फ़ोन' : 'My Phone')}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-4 ring-rose-500/30" />
                  </div>
                </AdvancedMarker>
              )}

              {customerLoc && openInfo === 'customer' && customerMarker && (
                <InfoWindow anchor={customerMarker} onCloseClick={() => setOpenInfo(null)}>
                  <div className="text-slate-900 text-xs p-0.5 space-y-0.5 max-w-[210px]">
                    <p className="font-bold">📍 {customerName}</p>
                    <p className="text-[11px] text-slate-700">{resolvedPlaceText}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {customerLoc.lat.toFixed(5)}, {customerLoc.lng.toFixed(5)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      {formatAgo(customerLoc.updatedAtMs, language)}
                    </p>
                  </div>
                </InfoWindow>
              )}

              {/* Local-only Worker self marker rendered ONLY inside Worker app for driving navigation */}
              {isWorkerMode && effectiveWorkerLoc && (
                <AdvancedMarker
                  ref={workerMarkerRef}
                  position={{ lat: effectiveWorkerLoc.lat, lng: effectiveWorkerLoc.lng }}
                  title="Your Phone (Navigation Only)"
                >
                  <div className="flex flex-col items-center">
                    <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-lg border border-white/80 whitespace-nowrap mb-0.5">
                      🛵 {language === 'hi' ? 'आप' : 'You'}
                    </div>
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg ring-4 ring-emerald-500/35" />
                  </div>
                </AdvancedMarker>
              )}
            </GoogleMap>
          </APIProvider>
        ) : (
          <LeafletFallbackMap
            customerLoc={customerLoc}
            localWorkerLoc={effectiveWorkerLoc}
            customerName={customerName}
            destinationAddress={resolvedPlaceText}
            language={language}
            isWorkerMode={isWorkerMode}
            recenterSignal={recenterSignal}
            externalGoogleMapsUrl={externalGoogleMapsUrl}
          />
        )}

        {(customerLoc || effectiveWorkerLoc) && (
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setRecenterSignal((s) => s + 1);
            }}
            className="absolute bottom-3 left-3 z-20 px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-white border border-slate-700 shadow-lg text-[10px] font-bold flex items-center gap-1.5"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'hi' ? 'पिन पर ज़ूम करें' : 'Re-center'}</span>
          </button>
        )}
      </div>

      {/* Strictly One-Way Customer Live Location Card (Never Shows Worker GPS to Customer) */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 text-[10px]">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-rose-300">
                📍{' '}
                {isWorkerMode
                  ? language === 'hi'
                    ? 'ग्राहक के फ़ोन की असली लाइव लोकेशन'
                    : 'Customer Real Live Phone Location'
                  : language === 'hi'
                  ? 'आपके फ़ोन की असली लाइव लोकेशन (कारीगर को भेजी जा रही)'
                  : 'Your Real Live Phone Location (Shared to Worker)'}
              </span>
              {customerLoc && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
            </div>
            <p className="text-slate-200 font-semibold mt-0.5 truncate">
              {resolvedPlaceText}
            </p>
            <p className="text-slate-400 font-mono text-[10px] mt-0.5 truncate">
              {customerLoc
                ? `${customerLoc.lat.toFixed(5)}, ${customerLoc.lng.toFixed(5)}${
                    customerLoc.accuracy ? ` • ±${customerLoc.accuracy}m` : ''
                  }`
                : language === 'hi'
                ? 'फ़ोन से GPS सिग्नल लिया जा रहा है...'
                : 'Waiting for phone GPS signal...'}
            </p>
          </div>

          {customerLoc && (
            <span className="text-[9px] text-emerald-400 font-bold shrink-0 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              {formatAgo(customerLoc.updatedAtMs, language)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
