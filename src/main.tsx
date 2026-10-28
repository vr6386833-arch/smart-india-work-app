import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { CrashGuard } from './services/crashGuard';

// Initialize Android Play Store CrashGuard Engine
CrashGuard.init();

// Register Service Worker for Google Chrome PWA Installability & Offline Support
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ PWA Service Worker active with scope:', registration.scope);
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
