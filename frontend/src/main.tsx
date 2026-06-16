import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

async function startApp() {
  // Enable MSW mocks only when explicitly opted-in in development.
  // Set VITE_USE_MOCKS=true in your .env (or leave unset to use the real backend).
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
      // eslint-disable-next-line no-console
      console.info('MSW worker started (dev mocks enabled)');
    } catch (e) {
      // MSW failed to start - fallback to real backend
      // eslint-disable-next-line no-console
      console.info('MSW not available, using real backend', e);
    }
  }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Register service worker only in production builds. In dev the dev server
// doesn't provide a real /sw.js and attempting to register returns HTML
// (text/html), which causes the MIME type error seen in the console.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    // Surface a warning but avoid crashing the app
    // eslint-disable-next-line no-console
    console.warn('Service worker registration failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
}

startApp();
