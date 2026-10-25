'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import s from './hero-depth.module.css';

const channels = ['shopee', 'lazada', 'tiktok', 'line'] as const;
// Offset lanes leave the vanishing point visible as the camera passes each logo.
const lanes = [
  [-190, -125, -17, -10], [155, 135, 18, 12], [180, -115, 22, 8],
  [-155, 145, -20, -12], [25, -205, -12, 6], [35, 210, 16, -8],
  [-245, 5, -24, -6], [245, 20, 24, 12],
];

export default function HeroDepth({ locale }: { locale: 'th' | 'en' }) {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    let visible = false, frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { element.dataset.running = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty('--look-x', `${x * 7}deg`);
        element.style.setProperty('--look-y', `${-y * 5}deg`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.setProperty('--look-x', '0deg');
      element.style.setProperty('--look-y', '0deg');
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return <div ref={scene} className={s.scene} data-running="false" aria-hidden="true">
    <div className={s.haze} />
    <div className={s.perspective}>
      <div className={s.camera}>
        <div className={s.world}>
          <div className={s.floor} />
          {Array.from({ length: 7 }, (_, index) => <div key={`frame-${index}`} className={s.portal}
            style={{ '--delay': `${-index * 4}s` } as CSSProperties} />)}
          <div className={s.core}><img src="/branding/marginshot-icon.svg" alt="" width="100" height="100" draggable={false} /></div>
          {Array.from({ length: 16 }, (_, index) => {
            const [x, y, yaw, roll] = lanes[index % lanes.length];
            const channel = channels[index % channels.length];
            return <div key={index} className={s.flight} data-channel={channel} style={{
              '--x': `${x}px`, '--y': `${y}px`, '--yaw': `${yaw}deg`, '--roll': `${roll}deg`,
              '--delay': `${-index * 1.5}s`,
            } as CSSProperties}>
              <div className={s.logoTile}><img src={`/assets/images/${channel}.png`} alt="" width="110" height="110" draggable={false} /></div>
            </div>;
          })}
        </div>
      </div>
    </div>
    <div className={s.vignette} />
    <div className={s.sceneFooter}><p>{locale === 'th' ? 'มองให้ลึกกว่ายอดขาย' : 'Look beyond the sale.'}</p><span>Shopee · Lazada · TikTok Shop · LINE</span></div>
  </div>;
}
