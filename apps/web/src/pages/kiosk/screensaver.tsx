import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { SITE } from '../../config/site';
import './screensaver.css';

/** Full-screen attract mode — tap anywhere to dismiss. */
export function KioskScreensaver({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      className="kiosk-screensaver fixed inset-0 z-[200] cursor-pointer border-0 bg-black p-0"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onDismiss();
      }}
      aria-label="Tap to browse the catalogue"
    >
      <span className="kiosk-screensaver-orbit pointer-events-none absolute inset-0">
        <img src={logo} alt={SITE.name} className="kiosk-screensaver-logo" draggable={false} />
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-16 text-center text-xl font-medium tracking-wide text-white/45">
        Touch to browse
      </span>
    </button>
  );
}
