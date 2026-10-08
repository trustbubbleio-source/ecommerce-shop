import type { ProductSeries } from '@akknerds/shared';
import { Link } from 'react-router-dom';
import exRuby from '../../assets/brands/exRubis.svg';
import megaEvolution from '../../assets/brands/mega-evolution.svg';
import scarletViolet from '../../assets/brands/scarlet-violet.svg';
import sunMoon from '../../assets/brands/sun-moon.svg';
import swordShield from '../../assets/brands/sword-shield.svg';
import xyEvolutions from '../../assets/brands/xyEvolustions.svg';
import './hero-series.css';

const SERIES_BRANDS: readonly {
  series: ProductSeries;
  src: string;
  glow: string;
  scale?: string;
}[] = [
  { series: 'Mega Evolution', src: megaEvolution, glow: '#f0dc0c' },
  { series: 'Scarlet & Violet', src: scarletViolet, glow: '#e85ad4', scale: 'h-[128%] w-[128%]' },
  { series: 'Sword & Shield', src: swordShield, glow: '#22d3ee' },
  { series: 'Sun & Moon', src: sunMoon, glow: '#fb923c' },
  { series: 'XY', src: xyEvolutions, glow: '#f59e0b' },
  { series: 'EX Ruby & Sapphire', src: exRuby, glow: '#fb7185', scale: 'h-[195%] w-[195%]' },
];

/** Series logos that open the shop with that series already selected. */
export function HeroSeriesShowcase() {
  return (
    <nav aria-label="Shop by series" className="w-full max-w-2xl">
      <ul className="grid grid-cols-2 items-center gap-x-6 gap-y-2">
        {SERIES_BRANDS.map((brand) => (
          <li key={brand.series}>
            <Link
              to={`/shop?series=${encodeURIComponent(brand.series)}`}
              aria-label={`Shop ${brand.series}`}
              className="focus-visible:ring-ring relative flex h-28 items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-32"
              style={{ ['--glow' as string]: brand.glow }}
            >
              <span className="hero-series__aura" aria-hidden="true" />
              <img
                src={brand.src}
                alt=""
                width={1254}
                height={1254}
                decoding="async"
                className={`hero-series__mark ${brand.scale ?? 'h-[175%] w-[175%]'} max-w-none object-contain`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
