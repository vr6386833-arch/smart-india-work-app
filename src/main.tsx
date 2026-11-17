import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { CrashGuard } from './services/crashGuard';

// Initialize Android Play Store CrashGuard Engine
CrashGuard.init();

// Register Service Worker for Google Chrome PWA Installability (skip inside native Android Capacitor WebView)
const isNativeCapacitor =
  typeof window !== 'undefined' &&
  Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (isNativeCapacitor) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.warn('PWA Service Worker registration skipped:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
