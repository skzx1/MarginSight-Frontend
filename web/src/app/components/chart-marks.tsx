import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
/**
 * Measured CSS width of a chart <svg> (width:100%). The charts set viewBox = "0 0 <width> <height>", so one user unit is
 * one CSS pixel and 12px labels render at 12px at every viewport width (F1). Rounded down so the drawing never scales below 1:1.
 */
export function useChartWidth(fallback = 640) {
  const [node, ref] = useState<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(fallback);
  useIsoLayoutEffect(() => {
    if (!node) return;
    const update = () => { const next = Math.floor(node.getBoundingClientRect().width); if (next > 0) setWidth(current => current === next ? current : next); };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [ref, width] as const;
}

/** Measure series. Each has its own colour, dash and marker shape, so no series is identified by colour alone. */
export type Series = 'revenue' | 'cost' | 'profit';
const SHAPE: Record<Series, 'circle' | 'square' | 'triangle'> = { revenue: 'circle', cost: 'square', profit: 'triangle' };

/** A data point marker. Profit points below zero take the loss colour as well as sitting below the zero line. */
export function SeriesMark({ series, x, y, loss = false, children }: { series: Series; x: number; y: number; loss?: boolean; children?: ReactNode }) {
  const className = `series-mark mark-${loss ? 'loss' : series}`;
  const shape = SHAPE[series];
  if (shape === 'square') return <rect x={x - 3.5} y={y - 3.5} width="7" height="7" className={className}>{children}</rect>;
  if (shape === 'triangle') return <path d={`M${x} ${y - 5}L${x + 4.5} ${y + 3.5}H${x - 4.5}Z`} className={className}>{children}</path>;
  return <circle cx={x} cy={y} r="4" className={className}>{children}</circle>;
}

/** Legend swatch drawn with the same stroke and marker as the series line. */
export function SeriesSwatch({ series }: { series: Series }) {
  return <svg className="series-swatch" width="28" height="12" viewBox="0 0 28 12" aria-hidden="true" focusable="false">
    <line x1="1" x2="27" y1="6" y2="6" className={`series-line series-${series}`} /><SeriesMark series={series} x={14} y={6} />
  </svg>;
}
