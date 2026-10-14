import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { HotelDataProvider } from './context/HotelDataContext.tsx';
import { OfflineSyncProvider } from './context/OfflineSyncContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

// En mode développement dans l'iframe, désenregistrer les anciens service workers résiduels
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Une erreur critique est survenue dans l'application">
      <SettingsProvider>
        <OfflineSyncProvider>
          <HotelDataProvider>
            <App />
          </HotelDataProvider>
        </OfflineSyncProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
);

