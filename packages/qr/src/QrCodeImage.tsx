import { useEffect, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { generateQrSvg, svgToDataUrl, type QrRenderOptions } from './generate.js';

export interface QrCodeImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'alt'> {
  /** Absolute URL (or any string) encoded into the QR. */
  value: string;
  size?: number;
  alt?: string;
  renderOptions?: Omit<QrRenderOptions, 'width'>;
}

/**
 * Renders a QR as an `<img>` from SVG (crisp at any size, no canvas required).
 */
export function QrCodeImage({
  value,
  size = 192,
  alt = 'QR code',
  renderOptions,
  style,
  className,
  ...imgProps
}: QrCodeImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setError(null);

    void generateQrSvg(value, { width: size, ...renderOptions })
      .then((svg) => {
        if (!cancelled) setSrc(svgToDataUrl(svg));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, renderOptions?.margin, renderOptions?.darkColor, renderOptions?.lightColor, renderOptions?.errorCorrectionLevel]);

  const boxStyle: CSSProperties = {
    width: size,
    height: size,
    ...style,
  };

  if (error) {
    return (
      <div
        role="alert"
        className={className}
        style={{
          ...boxStyle,
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          textAlign: 'center',
          padding: 8,
        }}
      >
        {error}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        aria-busy="true"
        aria-label="Generating QR code"
        className={className}
        style={{
          ...boxStyle,
          background: 'rgba(128,128,128,0.15)',
          borderRadius: 8,
        }}
      />
    );
  }

  return (
    <img
      {...imgProps}
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={boxStyle}
      decoding="async"
    />
  );
}
