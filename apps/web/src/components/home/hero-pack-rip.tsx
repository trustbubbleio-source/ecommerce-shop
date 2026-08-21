import { cn } from '@akknerds/ui';
import { useEffect, useState } from 'react';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { Pokeball } from '../common/pokeball';
import './hero-pack-rip.css';

type Phase = 'sealed' | 'ripping' | 'open';

const SEALED_MS = 2400;
const RIPPING_MS = 1100;
const OPEN_MS = 3800;

/**
 * Decorative hero animation with explicit phases:
 * sealed pack → vertical rip → peeled open (card revealed) → loop.
 */
export function HeroPackRip({ className }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>('sealed');

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;

    const schedule = (next: Phase, delay: number) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setPhase(next);
      }, delay);
    };

    // Kick the cycle from whatever phase we just entered
    if (phase === 'sealed') schedule('ripping', SEALED_MS);
    else if (phase === 'ripping') schedule('open', RIPPING_MS);
    else schedule('sealed', OPEN_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [phase]);

  return (
    <div className={cn('hero-pack', className)} data-phase={phase} aria-hidden="true">
      <div className="hero-pack__glow" />

      <div className="hero-pack__stage">
        <div className="hero-pack__card">
          <div className="hero-pack__card-frame">
            <div className="hero-pack__card-art">
              <img
                className="hero-pack__card-logo"
                src={logo}
                alt=""
                draggable={false}
              />
              <div className="hero-pack__card-foil" />
            </div>
            <div className="hero-pack__card-plate">
              <span className="hero-pack__card-name">One More Rip</span>
              <span className="hero-pack__card-rarity">Secret Rare</span>
            </div>
          </div>
        </div>

        <div className="hero-pack__sealed">
          <PackFace />
        </div>

        <div className="hero-pack__half hero-pack__half--left">
          <div className="hero-pack__face hero-pack__face--half">
            <PackFaceContent />
          </div>
        </div>
        <div className="hero-pack__half hero-pack__half--right">
          <div className="hero-pack__face hero-pack__face--half hero-pack__face--right">
            <PackFaceContent />
          </div>
        </div>

        <svg className="hero-pack__tear" viewBox="0 0 40 220" preserveAspectRatio="none">
          <path
            className="hero-pack__tear-path"
            d="M20 2 L14 18 L26 34 L12 52 L28 70 L10 88 L30 108 L14 126 L26 144 L12 162 L28 180 L16 198 L22 218"
          />
        </svg>

        <div className="hero-pack__sparks">
          <span className="hero-pack__spark" />
          <span className="hero-pack__spark" />
          <span className="hero-pack__spark" />
          <span className="hero-pack__spark" />
          <span className="hero-pack__spark" />
        </div>
      </div>
    </div>
  );
}

function PackFace() {
  return (
    <div className="hero-pack__face">
      <PackFaceContent />
    </div>
  );
}

function PackFaceContent() {
  return (
    <>
      <div className="hero-pack__stripe" />
      <div className="hero-pack__badge">
        <Pokeball />
      </div>
      <div className="hero-pack__wordmark">Booster Pack</div>
    </>
  );
}
