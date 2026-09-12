import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { HotelDataProvider } from './context/HotelDataContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <HotelDataProvider>
        <App />
      </HotelDataProvider>
    </SettingsProvider>
  </StrictMode>,
);
