import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  downloadQrPng,
  downloadQrSvg,
  sanitizeDownloadFilename,
} from './download.js';
import {
  generateQrPngDataUrl,
  generateQrSvg,
  type QrRenderOptions,
} from './generate.js';
import { QrCodeImage } from './QrCodeImage.js';
import { buildProductUrl } from './url.js';

export type ProductQrVariant = 'admin' | 'storefront';

export interface ProductQrCodeProps {
  /** Production storefront origin, e.g. https://www.onemorerip.cards */
  baseUrl: string;
  slug: string;
  productName: string;
  variant?: ProductQrVariant;
  size?: number;
  className?: string;
  /** Extra actions (e.g. “Open product”) rendered in the footer. */
  footer?: ReactNode;
  renderOptions?: Omit<QrRenderOptions, 'width'>;
}

export function ProductQrCode({
  baseUrl,
  slug,
  productName,
  variant = 'admin',
  size,
  className,
  footer,
  renderOptions,
}: ProductQrCodeProps) {
  const url = buildProductUrl(baseUrl, slug);
  const resolvedSize = size ?? (variant === 'admin' ? 200 : 128);
  const [busy, setBusy] = useState<'png' | 'svg' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const onDownloadPng = useCallback(async () => {
    setActionError(null);
    setBusy('png');
    try {
      const dataUrl = await generateQrPngDataUrl(url, {
        width: 1024,
        ...renderOptions,
      });
      await downloadQrPng({ dataUrl, productName });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'PNG download failed');
    } finally {
      setBusy(null);
    }
  }, [url, productName, renderOptions]);

  const onDownloadSvg = useCallback(async () => {
    setActionError(null);
    setBusy('svg');
    try {
      const svg = await generateQrSvg(url, { width: 512, ...renderOptions });
      await downloadQrSvg({ svg, productName });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'SVG download failed');
    } finally {
      setBusy(null);
    }
  }, [url, productName, renderOptions]);

  const onCopyLink = useCallback(async () => {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setActionError('Could not copy link');
    }
  }, [url]);

  const isAdmin = variant === 'admin';
  const title = isAdmin ? 'Product QR code' : 'Scan in store';
  const description = isAdmin
    ? 'Print this code for shelves or packing slips. It opens the live product page.'
    : 'Point your camera here to open this product on your phone.';

  return (
    <div
      className={className}
      data-variant={variant}
      data-testid="product-qr-code"
      style={{
        display: 'flex',
        flexDirection: isAdmin ? 'column' : 'row',
        gap: isAdmin ? 16 : 20,
        alignItems: isAdmin ? 'stretch' : 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: isAdmin ? 'center' : 'flex-start',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: '#ffffff',
            boxShadow: isAdmin ? 'none' : '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          <QrCodeImage
            value={url}
            size={resolvedSize}
            alt={`QR code for ${productName}`}
            renderOptions={renderOptions}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: isAdmin ? 15 : 14 }}>{title}</p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              opacity: 0.7,
              lineHeight: 1.45,
            }}
          >
            {description}
          </p>
        </div>

        {isAdmin && (
          <p
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 11,
              wordBreak: 'break-all',
              opacity: 0.75,
            }}
          >
            {url}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => void onDownloadPng()}
                disabled={busy !== null}
                aria-label={`Download PNG QR for ${productName}`}
              >
                {busy === 'png' ? 'Preparing…' : 'Download PNG'}
              </button>
              <button
                type="button"
                onClick={() => void onDownloadSvg()}
                disabled={busy !== null}
                aria-label={`Download SVG QR for ${productName}`}
              >
                {busy === 'svg' ? 'Preparing…' : 'Download SVG'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => void onCopyLink()}
            aria-label={`Copy product link for ${productName}`}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {footer}
        </div>

        {actionError && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: '#f87171' }}>
            {actionError}
          </p>
        )}

        {isAdmin && (
          <p style={{ margin: 0, fontSize: 11, opacity: 0.55 }}>
            File: {sanitizeDownloadFilename(productName)}-qr.png
          </p>
        )}
      </div>
    </div>
  );
}
