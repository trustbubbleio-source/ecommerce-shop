import { createContext, useContext } from 'react';

/** Scroll container for kiosk IntersectionObservers (native lazy fails here). */
export const KioskScrollRootContext = createContext<HTMLElement | null>(null);

export function useKioskScrollRoot() {
  return useContext(KioskScrollRootContext);
}
