import { Pokeball } from '../../components/common/pokeball';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { SITE } from '../../config/site';
import { KioskMascot, KioskSpark } from './mascot';
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
      <span className="kiosk-screensaver-glow pointer-events-none absolute inset-0" aria-hidden />

      {/* Floating pokéballs */}
      <span className="kiosk-screensaver-ball kiosk-screensaver-ball-a pointer-events-none absolute text-red-500">
        <Pokeball className="size-16" />
      </span>
      <span className="kiosk-screensaver-ball kiosk-screensaver-ball-b pointer-events-none absolute text-white/80">
        <Pokeball className="size-12" />
      </span>
      <span className="kiosk-screensaver-ball kiosk-screensaver-ball-c pointer-events-none absolute text-yellow-300">
        <Pokeball className="size-14" />
      </span>

      {/* Sparks */}
      <KioskSpark className="kiosk-screensaver-spark kiosk-screensaver-spark-a pointer-events-none absolute size-10" />
      <KioskSpark className="kiosk-screensaver-spark kiosk-screensaver-spark-b pointer-events-none absolute size-8" />
      <KioskSpark className="kiosk-screensaver-spark kiosk-screensaver-spark-c pointer-events-none absolute size-12" />

      <span className="kiosk-screensaver-orbit pointer-events-none absolute inset-0">
        <span className="kiosk-screensaver-cluster">
          <img src={logo} alt={SITE.name} className="kiosk-screensaver-logo" draggable={false} />
          <KioskMascot className="kiosk-screensaver-mascot" />
        </span>
      </span>

      <span className="pointer-events-none absolute inset-x-0 bottom-16 text-center text-xl font-medium tracking-wide text-white/45">
        Touch to browse
      </span>
    </button>
  );
}
