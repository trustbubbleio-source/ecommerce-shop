import { useEffect } from 'react';
import { SITE } from '../config/site';

const SITE_TITLE = `${SITE.name} · Pokémon TCG Store`;
const DEFAULT_DESCRIPTION = SITE.description;

export interface DocumentMetaInput {
  title: string;
  description?: string;
  /** Absolute path on the site, e.g. `/shop`. Defaults to current pathname. */
  path?: string;
  /** Absolute image URL for Open Graph / Twitter. */
  image?: string;
  /** Search engine indexing hint. */
  robots?: 'index,follow' | 'noindex,nofollow';
  /** Open Graph type. */
  type?: 'website' | 'article' | 'product';
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  if (!path || path === '/') return base + '/';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Set document title + description + Open Graph / Twitter / canonical for the current route. */
export function useDocumentMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = SITE.ogImage,
  robots = 'index,follow',
  type = 'website',
}: DocumentMetaInput) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title === SITE.name ? SITE_TITLE : `${title} · ${SITE.name}`;
    const url = absoluteUrl(path ?? window.location.pathname);
    const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:site_name', SITE.name);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertLink('canonical', url);

    return () => {
      document.title = previousTitle || SITE_TITLE;
    };
  }, [title, description, path, image, robots, type]);
}

/** Back-compat title-only helper used by auth pages. */
export function usePageTitle(title: string) {
  useDocumentMeta({ title, robots: 'noindex,nofollow' });
}
