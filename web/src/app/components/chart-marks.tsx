import type { ReactNode } from 'react';

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
