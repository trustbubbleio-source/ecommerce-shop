/**
 * Production static server for the Vite SPA.
 * Adds HSTS + CSP and other security headers that Railway's SPA static
 * host (hikari) does not expose for configuration.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function buildCsp() {
  const api = (process.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const cdn = (process.env.VITE_ASSET_CDN_URL || '').replace(/\/$/, '');
  const connect = [
    "'self'",
    api,
    cdn,
    'https://api.stripe.com',
    'https://accounts.google.com',
    'https://nominatim.openstreetmap.org',
    'https://*.basemaps.cartocdn.com',
  ]
    .filter(Boolean)
    .join(' ');
  const media = ["'self'", cdn].filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' https://js.stripe.com https://accounts.google.com",
    // React/Leaflet inline styles need 'unsafe-inline' for style attributes.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `media-src ${media}`,
    `connect-src ${connect}`,
    'frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com',
    "worker-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; ');
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Content-Security-Policy': buildCsp(),
};

function isHttps(req) {
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') return proto.split(',')[0].trim() === 'https';
  return Boolean(req.socket?.encrypted);
}

function applySecurityHeaders(req, res) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  if (isHttps(req)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

async function sendFile(req, res, filePath, status = 200) {
  const data = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = status;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  applySecurityHeaders(req, res);
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = req.url || '/';
    if (urlPath === '/healthz') {
      applySecurityHeaders(req, res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    let filePath = safeJoin(DIST, urlPath === '/' ? '/index.html' : urlPath);
    if (!filePath) {
      applySecurityHeaders(req, res);
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
      await sendFile(req, res, filePath);
      return;
    } catch {
      // SPA fallback
    }

    await sendFile(req, res, path.join(DIST, 'index.html'));
  } catch (error) {
    console.error('[web] serve error', error);
    applySecurityHeaders(req, res);
    res.statusCode = 500;
    res.end('Internal server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[web] serving ${DIST} on :${PORT}`);
});
