import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await registration.update();
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshed) {
        refreshed = true;
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
