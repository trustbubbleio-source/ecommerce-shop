import { configureApiClient } from '@akknerds/api-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
});

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
