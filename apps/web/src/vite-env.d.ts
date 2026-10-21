/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_ASSET_CDN_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** CARTO basemap key — required in production to avoid “missing API key” watermarks. */
  readonly VITE_CARTO_API_KEY?: string;
  /** Plausible site domain (e.g. www.onemorerip.cards). Analytics load only after cookie consent. */
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
