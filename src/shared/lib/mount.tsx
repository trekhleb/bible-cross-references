import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/global.css';

/** Renders a page's root component into `#root`. */
export function mount(page: ReactNode): void {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element #root not found.');
  }
  createRoot(container).render(<StrictMode>{page}</StrictMode>);
}
