import '@testing-library/jest-dom/vitest';
import { configureApiClient } from '@akknerds/api-client';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
window.HTMLElement.prototype.scrollIntoView = vi.fn();

globalThis.ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.HTMLElement.prototype.hasPointerCapture ||= () => false;
window.HTMLElement.prototype.setPointerCapture ||= () => {};
window.HTMLElement.prototype.releasePointerCapture ||= () => {};
