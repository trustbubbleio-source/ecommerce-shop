import { useEffect } from 'react';

const SITE_TITLE = 'One More Rip · Pokémon TCG Store';

/** Set a per-route document title; restores the default on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · One More Rip`;
    return () => {
      document.title = previous || SITE_TITLE;
    };
  }, [title]);
}
