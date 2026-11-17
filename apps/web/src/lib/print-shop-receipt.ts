const FRAME_ID = 'shop-receipt-print-frame';
const READY = 'shop-receipt-ready';

/** Load the shop receipt in a hidden iframe and open the system print dialog. */
export function printShopReceipt(href: string): void {
  document.getElementById(FRAME_ID)?.remove();

  const url = new URL(href, window.location.origin);
  url.searchParams.set('embed', '1');
  url.searchParams.delete('print');

  const iframe = document.createElement('iframe');
  iframe.id = FRAME_ID;
  iframe.title = 'Kvitto';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;inset:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('message', onMessage);
    iframe.remove();
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== iframe.contentWindow) return;
    if (event.data?.type !== READY) return;

    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }

    const previousTitle = document.title;
    document.title = ' ';
    const finish = () => {
      document.title = previousTitle;
      win.removeEventListener('afterprint', finish);
      cleanup();
    };
    win.addEventListener('afterprint', finish);
    win.focus();
    win.print();
    // Fallback if afterprint never fires.
    window.setTimeout(cleanup, 60_000);
  };

  window.addEventListener('message', onMessage);
  iframe.addEventListener('load', () => {
    // Ignore blank/error loads; ready signal comes from the React page.
  });
  document.body.appendChild(iframe);
  iframe.src = `${url.pathname}${url.search}`;
}

export const SHOP_RECEIPT_READY_MESSAGE = READY;
