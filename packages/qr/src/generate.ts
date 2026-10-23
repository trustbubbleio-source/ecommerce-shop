import QRCode from 'qrcode';

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrRenderOptions {
  /** Output size in pixels (PNG width / SVG viewBox hint). Default 256. */
  width?: number;
  /** Quiet-zone modules. Default 2. */
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: QrErrorCorrectionLevel;
}

function assertContent(text: string): string {
  const value = text.trim();
  if (!value) {
    throw new Error('QR content is required');
  }
  return value;
}

function toQrOptions(options: QrRenderOptions = {}) {
  return {
    width: options.width ?? 256,
    margin: options.margin ?? 2,
    errorCorrectionLevel: options.errorCorrectionLevel ?? ('M' as const),
    color: {
      dark: options.darkColor ?? '#000000',
      light: options.lightColor ?? '#ffffff',
    },
  };
}

/** SVG markup — works in Node and the browser; best for crisp print. */
export async function generateQrSvg(text: string, options?: QrRenderOptions): Promise<string> {
  return QRCode.toString(assertContent(text), {
    type: 'svg',
    ...toQrOptions(options),
  });
}

/**
 * PNG data URL. Prefer in the browser (admin download).
 * Requires a canvas implementation in Node (not needed for SVG).
 */
export async function generateQrPngDataUrl(
  text: string,
  options?: QrRenderOptions,
): Promise<string> {
  return QRCode.toDataURL(assertContent(text), toQrOptions({ width: 512, ...options }));
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
