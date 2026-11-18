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
import { Crosshair, Navigation, MapPin, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { Language, LiveGeoLocation } from '../../types';
import { soundManager } from '../../services/soundEffects';

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (typeof process !== 'undefined' ? (process.env.GOOGLE_MAPS_API_KEY as string | undefined) : undefined) ||
  '';

const DEFAULT_INDIA_CENTER = { lat: 28.6139, lng: 77.209 };

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
  if (diffSec < 10) return language === 'hi' ? 'अभी लाइव' : 'Just now';
  if (diffSec < 60) return language === 'hi' ? `${diffSec} सेकंड पहले` : `${diffSec}s ago`;
  const mins = Math.round(diffSec / 60);
  return language === 'hi' ? `${mins} मिनट पहले` : `${mins}m ago`;
}

interface ViewportAndRouteProps {
  customerLoc: LiveGeoLocation | null;
  workerLoc: LiveGeoLocation | null;
  recenterSignal: number;
  onRouteInfo: (info: { distanceMeters: number; durationMillis: number } | null) => void;
}

const ViewportAndRouteLayer: React.FC<ViewportAndRouteProps> = ({
  customerLoc,
  workerLoc,
  recenterSignal,
  onRouteInfo,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<PolylineLike[]>([]);
  const lastRouteKeyRef = useRef<string>('');
  const lastRouteTimeRef = useRef<number>(0);

  // Fit bounds cleanly when coordinates arrive or recenter button is pressed
  useEffect(() => {
    if (!map) return;
    const g = (window as unknown as { google?: any }).google;
    if (!g?.maps) return;

    if (customerLoc && workerLoc) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: customerLoc.lat, lng: customerLoc.lng });
      bounds.extend({ lat: workerLoc.lat, lng: workerLoc.lng });
      map.fitBounds(bounds, { top: 52, right: 44, bottom: 52, left: 44 });
    } else if (workerLoc) {
      map.panTo({ lat: workerLoc.lat, lng: workerLoc.lng });
      if ((map.getZoom() || 0) < 14) map.setZoom(15);
    } else if (customerLoc) {
      map.panTo({ lat: customerLoc.lat, lng: customerLoc.lng });
      if ((map.getZoom() || 0) < 14) map.setZoom(15);
    }
  }, [
    map,
    customerLoc?.lat,
    customerLoc?.lng,
    workerLoc?.lat,
    workerLoc?.lng,
    recenterSignal,
  ]);

  // Modern Routes API (Route.computeRoutes) polyline drawing with quota-safe throttling
  useEffect(() => {
    if (!map || !routesLib || !customerLoc || !workerLoc) {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      onRouteInfo(null);
      return;
    }

    // Avoid excessive API hits during minor GPS jitter (<120m within 25s)
    const coordKey = `${workerLoc.lat.toFixed(3)},${workerLoc.lng.toFixed(3)}->${customerLoc.lat.toFixed(3)},${customerLoc.lng.toFixed(3)}`;
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
      origin: { lat: workerLoc.lat, lng: workerLoc.lng },
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
  }, [map, routesLib, customerLoc, workerLoc, onRouteInfo]);

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
  workerLoc: LiveGeoLocation | null;
  customerName: string;
  workerName: string;
  destinationAddress: string;
  language: Language;
  mapTheme?: 'dark' | 'light';
  isWorkerMode?: boolean;
  heightClass?: string;
}

export const GoogleLiveMap: React.FC<GoogleLiveMapProps> = ({
  customerLoc,
  workerLoc,
  customerName,
  workerName,
  destinationAddress,
  language,
  mapTheme = 'dark',
  isWorkerMode = false,
  heightClass = 'h-64 sm:h-72',
}) => {
  const [customerMarkerRef, customerMarker] = useAdvancedMarkerRef();
  const [workerMarkerRef, workerMarker] = useAdvancedMarkerRef();
  const [openInfo, setOpenInfo] = useState<'customer' | 'worker' | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [routeInfo, setRouteInfo] = useState<{ distanceMeters: number; durationMillis: number } | null>(null);
  const [quotaReached, setQuotaReached] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaReached(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const straightKm = haversineDistanceKm(workerLoc, customerLoc);
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

  const defaultCenter = workerLoc
    ? { lat: workerLoc.lat, lng: workerLoc.lng }
    : customerLoc
    ? { lat: customerLoc.lat, lng: customerLoc.lng }
    : DEFAULT_INDIA_CENTER;

  const targetCoords = isWorkerMode ? customerLoc : workerLoc || customerLoc;
  const externalGoogleMapsUrl = targetCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetCoords.lat},${targetCoords.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`;

  const canRenderInteractiveMap = Boolean(MAPS_API_KEY) && !quotaReached;

  return (
    <div className="relative w-full overflow-hidden bg-slate-950">
      {/* Live Distance / ETA Telemetry Pill Strip */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          {displayDistanceKm !== null ? (
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>
                {customerLoc || workerLoc
                  ? language === 'hi'
                    ? 'दूसरे फोन के GPS की प्रतीक्षा...'
                    : 'Waiting for other phone GPS...'
                  : language === 'hi'
                  ? 'दोनों फोन पर GPS चालू करें'
                  : 'Enable GPS on both phones'}
              </span>
            </span>
          )}
        </div>

        <a
          href={externalGoogleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => soundManager.playTap()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold transition-colors shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          <span>{language === 'hi' ? 'Google Maps ऐप खोलें' : 'Open Maps App'}</span>
        </a>
      </div>

      {/* Real Interactive Google Map Canvas */}
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
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI={true}
              zoomControl={true}
              colorScheme={mapTheme === 'dark' ? 'DARK' : 'LIGHT'}
              className="w-full h-full"
            >
              <ViewportAndRouteLayer
                customerLoc={customerLoc}
                workerLoc={workerLoc}
                recenterSignal={recenterSignal}
                onRouteInfo={setRouteInfo}
              />

              {customerLoc && (
                <AdvancedMarker
                  ref={customerMarkerRef}
                  position={{ lat: customerLoc.lat, lng: customerLoc.lng }}
                  onClick={() => setOpenInfo('customer')}
                  title={`${customerName} (Customer)`}
                >
                  <div className="flex flex-col items-center cursor-pointer">
                    <div className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-lg border border-white/80 whitespace-nowrap mb-0.5">
                      🏠 {language === 'hi' ? 'ग्राहक' : 'Customer'}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-lg ring-4 ring-rose-500/30" />
                  </div>
                </AdvancedMarker>
              )}

              {customerLoc && openInfo === 'customer' && customerMarker && (
                <InfoWindow anchor={customerMarker} onCloseClick={() => setOpenInfo(null)}>
                  <div className="text-slate-900 text-xs p-0.5 space-y-0.5 max-w-[190px]">
                    <p className="font-bold">🏠 {customerName}</p>
                    <p className="text-[11px] text-slate-600 truncate">{destinationAddress}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {customerLoc.lat.toFixed(5)}, {customerLoc.lng.toFixed(5)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      {formatAgo(customerLoc.updatedAtMs, language)}
                    </p>
                  </div>
                </InfoWindow>
              )}

              {workerLoc && (
                <AdvancedMarker
                  ref={workerMarkerRef}
                  position={{ lat: workerLoc.lat, lng: workerLoc.lng }}
                  onClick={() => setOpenInfo('worker')}
                  title={`${workerName} (Worker)`}
                >
                  <div className="flex flex-col items-center cursor-pointer">
                    <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-lg border border-white/80 whitespace-nowrap mb-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>👷 {workerName.split(' ')[0]}</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg ring-4 ring-emerald-500/35" />
                  </div>
                </AdvancedMarker>
              )}

              {workerLoc && openInfo === 'worker' && workerMarker && (
                <InfoWindow anchor={workerMarker} onCloseClick={() => setOpenInfo(null)}>
                  <div className="text-slate-900 text-xs p-0.5 space-y-0.5 max-w-[190px]">
                    <p className="font-bold">👷 {workerName}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {workerLoc.lat.toFixed(5)}, {workerLoc.lng.toFixed(5)}
                    </p>
                    {typeof workerLoc.speedKmh === 'number' && (
                      <p className="text-[10px] text-blue-700 font-semibold">
                        Speed: {workerLoc.speedKmh} km/h
                      </p>
                    )}
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      {formatAgo(workerLoc.updatedAtMs, language)}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900/90 space-y-2">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            <p className="text-xs font-bold text-white">
              {quotaReached
                ? language === 'hi'
                  ? 'Google Maps दैनिक कोटा सीमा पूरी हो गई है'
                  : 'Google Maps daily quota limit reached'
                : language === 'hi'
                ? 'Google Maps Key लोड हो रही है — नीचे से नेविगेशन खोलें'
                : 'Google Maps key pending — use external Maps navigation'}
            </p>
            <a
              href={externalGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'Google Maps ऐप में रास्ता खोलें' : 'Open Route in Google Maps App'}</span>
            </a>
          </div>
        )}

        {/* Re-center Camera Button */}
        {canRenderInteractiveMap && (customerLoc || workerLoc) && (
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setRecenterSignal((s) => s + 1);
            }}
            className="absolute bottom-3 left-3 z-20 px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-white border border-slate-700 shadow-lg text-[10px] font-bold flex items-center gap-1.5"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'hi' ? 'दोनों पिन देखें' : 'Re-center'}</span>
          </button>
        )}
      </div>

      {/* Two-Phone Live GPS Coordinates Summary Row */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950 border-t border-slate-800/80 text-[10px]">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-300">🏠 {language === 'hi' ? 'ग्राहक GPS' : 'Customer GPS'}</span>
            {customerLoc && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <p className="text-slate-300 font-mono mt-0.5 truncate">
            {customerLoc ? `${customerLoc.lat.toFixed(4)}, ${customerLoc.lng.toFixed(4)}` : language === 'hi' ? 'अभी बंद / प्रतीक्षारत' : 'Waiting...'}
          </p>
          {customerLoc && (
            <p className="text-[9px] text-slate-500 mt-0.5">{formatAgo(customerLoc.updatedAtMs, language)}</p>
          )}
        </div>

        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300">👷 {language === 'hi' ? 'कारीगर GPS' : 'Worker GPS'}</span>
            {workerLoc && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <p className="text-slate-300 font-mono mt-0.5 truncate">
            {workerLoc ? `${workerLoc.lat.toFixed(4)}, ${workerLoc.lng.toFixed(4)}` : language === 'hi' ? 'अभी बंद / प्रतीक्षारत' : 'Waiting...'}
          </p>
          {workerLoc && (
            <p className="text-[9px] text-slate-500 mt-0.5">{formatAgo(workerLoc.updatedAtMs, language)}</p>
          )}
        </div>
      </div>
    </div>
  );
};
