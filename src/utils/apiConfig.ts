import { Capacitor } from '@capacitor/core';
import { safeStorage } from '../services/safeStorage';

const API_BASE_STORAGE_KEY = 'smart_india_api_base_url_v1';

function sanitizeBaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('your-live-backend-url') || trimmed.includes('MY_APP_URL')) {
    return '';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.origin;
    }
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '10.0.2.2')
    ) {
      return parsed.origin;
    }
    return '';
  } catch {
    return '';
  }
}

export function isRunningInsideNativeShell(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // Ignore bridge errors in pure SSR/test environments
  }
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (protocol === 'capacitor:' || protocol === 'ionic:') return true;
    // Capacitor Android uses https://localhost without port
    if (protocol === 'https:' && hostname === 'localhost' && !port) return true;
  }
  return false;
}

export function getConfiguredApiBaseUrl(): string {
  const fromStorage = sanitizeBaseUrl(safeStorage.getItem(API_BASE_STORAGE_KEY));
  if (fromStorage) return fromStorage;

  const envObj = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const fromViteEnv = sanitizeBaseUrl(envObj.VITE_API_BASE_URL || envObj.VITE_APP_URL);
  return fromViteEnv;
}

export function setConfiguredApiBaseUrl(url: string): boolean {
  const clean = sanitizeBaseUrl(url);
  if (!clean) return false;
  safeStorage.setItem(API_BASE_STORAGE_KEY, clean);
  return true;
}

/**
 * Resolves an API path (`/api/...`):
 * - In Web mode (hosted on Express / Cloud Run), keeps relative `/api/...` (same-origin).
 * - In standalone Capacitor APK mode (`https://localhost` / `capacitor://localhost`),
 *   prefixes with `VITE_API_BASE_URL` if configured so APK talks to live backend.
 */
export function resolveApiUrl(apiPath: string): string {
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (isRunningInsideNativeShell()) {
    const base = getConfiguredApiBaseUrl();
    if (base) {
      return `${base}${normalizedPath}`;
    }
  }
  return normalizedPath;
}
