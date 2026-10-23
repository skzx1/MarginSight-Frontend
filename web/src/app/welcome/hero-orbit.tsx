'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '../ui';
import s from './landing.module.css';

const satellites: { image?: string; icon?: IconName; ring: 'inner' | 'outer'; angle: number }[] = [
  { image: 'shopee.png', ring: 'inner', angle: 290 },
  { image: 'tiktok.png', ring: 'inner', angle: 70 },
  { image: 'lazada.png', ring: 'outer', angle: 270 },
  { image: 'line.png', ring: 'outer', angle: 90 },
  { icon: 'simulation', ring: 'inner', angle: 230 },
  { icon: 'products', ring: 'inner', angle: 130 },
];

export default function HeroOrbit() {
  const orbit = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = orbit.current;
    if (!element) return;
    let inView = false;
    const update = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return <div ref={orbit} className={s.heroCurves} data-running={active} aria-hidden="true">
      <i /><i /><i />
      {satellites.map((item, index) => <div key={index} className={s.orbitTrack} data-ring={item.ring} style={{ '--orbit-angle': `${item.angle}deg`, '--counter-angle': `${-item.angle}deg` } as CSSProperties}>
        <div className={s.orbitRotor}><div className={s.orbitAnchor}><span className={s.orbitBadge}>
          {item.image ? <img src={`/assets/images/${item.image}`} alt="" width="24" height="24" draggable={false} /> : <Icon name={item.icon!} />}
        </span></div></div>
      </div>)}
    </div>;
}
