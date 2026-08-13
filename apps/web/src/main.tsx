import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { LocaleSwitcher } from '@/features/locale-switcher/locale-switcher';

import '@/i18n/config';
import { router } from '@/router';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-background/95 px-6 py-3">
          <LocaleSwitcher />
        </header>
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  </StrictMode>,
);