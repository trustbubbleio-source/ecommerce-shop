/** Safe stem for download filenames (no path/extension). */
export function sanitizeDownloadFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || 'product-qr';
}

function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Download a data URL or object URL as a file (browser only). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  triggerDownload(dataUrl, filename);
}

/** Download UTF-8 text (e.g. SVG markup) as a file (browser only). */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerDownload(objectUrl, filename);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadQrPng(args: {
  dataUrl: string;
  productName: string;
}): Promise<void> {
  const stem = sanitizeDownloadFilename(args.productName);
  downloadDataUrl(args.dataUrl, `${stem}-qr.png`);
}

export async function downloadQrSvg(args: {
  svg: string;
  productName: string;
}): Promise<void> {
  const stem = sanitizeDownloadFilename(args.productName);
  downloadTextFile(args.svg, `${stem}-qr.svg`, 'image/svg+xml;charset=utf-8');
}
