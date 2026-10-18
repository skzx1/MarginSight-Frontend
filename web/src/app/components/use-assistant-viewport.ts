'use client';
import { useEffect, type RefObject } from 'react';

// Mobile keyboards shrink the visual viewport even when the layout viewport stays
// the same size. Scope the adjustment to this app shell while Assistant is visible.
export function useAssistantViewport(visible: boolean, root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!visible) return;
    const shell = root.current?.closest<HTMLElement>('.app-shell'), viewport = window.visualViewport;
    if (!shell || !viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const mobile = window.matchMedia('(max-width:767px)').matches;
        shell.style.setProperty('--assistant-height', mobile ? `${viewport.height}px` : '100dvh');
        shell.style.setProperty('--assistant-top', mobile ? `${viewport.offsetTop}px` : '0px');
        shell.dataset.keyboardOpen = String(mobile && viewport.scale < 1.05 && window.innerHeight - viewport.height > 120);
      });
    };
    update(); viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update); window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); window.removeEventListener('resize', update); shell.style.removeProperty('--assistant-height'); shell.style.removeProperty('--assistant-top'); delete shell.dataset.keyboardOpen; };
  }, [visible, root]);
}
