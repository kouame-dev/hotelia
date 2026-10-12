import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { HotelDataProvider } from './context/HotelDataContext.tsx';
import { OfflineSyncProvider } from './context/OfflineSyncContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

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

