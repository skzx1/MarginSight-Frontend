// Axis layout for the SVG line charts (display only; never changes a value).
// The charts draw at one SVG user unit = one CSS pixel (the viewBox width is the measured element width), so a 12px
// label renders at 12px at every viewport width (criteria F1). This module picks round tick values, prints them with a
// true minus sign (U+2212, System R) and keeps only the date labels that fit the plot width without overlapping.

export const AXIS_FONT_PX = 12;
const MINUS = '−';
const STEPS = [1, 2, 5, 10, 20];

export type Ticks = { ticks: number[]; lo: number; hi: number };

/** Round tick values (1, 2 or 5 × 10^n apart) covering [min, max] with at most maxTicks ticks; 0 is a tick when the range crosses it. */
export function niceTicks(min: number, max: number, maxTicks = 5): Ticks {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [0, 1], lo: 0, hi: 1 };
  if (max <= min) max = min + 1;
  const count = Math.max(2, Math.floor(maxTicks));
  const magnitude = 10 ** Math.floor(Math.log10((max - min) / (count - 1)));
  let step = STEPS[STEPS.length - 1] * magnitude;
  for (const m of STEPS) {
    const candidate = m * magnitude;
    if (Math.ceil(max / candidate - 1e-9) - Math.floor(min / candidate + 1e-9) + 1 <= count) { step = candidate; break; }
  }
  const first = Math.floor(min / step + 1e-9), last = Math.ceil(max / step - 1e-9);
  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(Number((i * step).toPrecision(12)) || 0);
  return { ticks, lo: ticks[0], hi: ticks[ticks.length - 1] };
}

/** Compact axis number ("12.5K", "−410", "0"): a negative value carries U+2212, never an ASCII hyphen; a value that prints as 0 has no sign. */
export function axisNumber(value: number, locale = 'th'): string {
  if (!Number.isFinite(value)) return '—';
  const digits = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'th-TH', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(value));
  return value < 0 && /[1-9]/.test(digits) ? MINUS + digits : digits;
}

// Thai above/below marks (and the zero-width joiners) take no horizontal space.
const ZERO_WIDTH = /[ัิ-ฺ็-๎​-‍]/;
/** Conservative width estimate of a label in px (UI face at fontPx); slightly wider than the real glyphs so labels never touch. */
export function textWidth(label: string, fontPx = AXIS_FONT_PX): number {
  let em = 0;
  for (const char of label) em += ZERO_WIDTH.test(char) ? 0 : char === ' ' ? 0.3 : /[A-Z]/.test(char) ? 0.72 : 0.62;
  return Math.ceil(em * fontPx);
}

/** Indexes of the date labels to print: evenly spaced, at most maxLabels, the first and (when it fits) the last, never closer than labelWidth + gap. */
export function xLabelIndices(count: number, spacing: number, labelWidth: number, gap = 12, maxLabels = 8): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const step = Math.max(1, Math.ceil((labelWidth + gap) / Math.max(spacing, 1e-6)), Math.ceil((count - 1) / (Math.max(2, maxLabels) - 1)));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(i);
  const last = count - 1;
  if (out[out.length - 1] !== last) {
    if (out.length > 1 && last - out[out.length - 1] < step) out.pop();
    if ((last - out[out.length - 1]) * spacing >= labelWidth + gap) out.push(last);
  }
  return out;
}

export type ChartLayout = {
  width: number; height: number; left: number; right: number; top: number; plotBottom: number; plotWidth: number; plotHeight: number;
  ticks: { value: number; label: string }[]; lo: number; hi: number; labels: number[]; xLabelY: number;
  x: (index: number) => number; y: (value: number) => number;
};

/**
 * Pixel layout of a line chart drawn at 1 user unit = 1 CSS px. `min`/`max` are in display units (baht or percent).
 * The left margin fits the widest tick label, the right margin half a date label, and the number of ticks follows the plot height.
 */
export function chartLayout({ width, height, min, max, count, xLabelSample, locale = 'th' }: {
  width: number; height: number; min: number; max: number; count: number; xLabelSample: string; locale?: string;
}): ChartLayout {
  const font = AXIS_FONT_PX, labelGap = 10;
  const top = font, plotBottom = height - Math.ceil(font * 1.5) - labelGap, plotHeight = Math.max(1, plotBottom - top);
  const maxTicks = Math.min(6, Math.max(3, Math.floor(plotHeight / (font * 3)) + 1));
  const { ticks, lo, hi } = niceTicks(min, max, maxTicks);
  const labelled = ticks.map(value => ({ value, label: axisNumber(value, locale) }));
  const xLabelWidth = textWidth(xLabelSample);
  const right = Math.ceil(xLabelWidth / 2) + 4;
  const left = Math.max(Math.ceil(xLabelWidth / 2) + 4, Math.max(...labelled.map(t => textWidth(t.label))) + 10);
  const plotWidth = Math.max(1, width - left - right);
  const x = (index: number) => count <= 1 ? left + plotWidth / 2 : left + index / (count - 1) * plotWidth;
  const y = (value: number) => plotBottom - (value - lo) / (hi - lo) * plotHeight;
  const labels = xLabelIndices(count, count > 1 ? plotWidth / (count - 1) : plotWidth, xLabelWidth);
  return { width, height, left, right, top, plotBottom, plotWidth, plotHeight, ticks: labelled, lo, hi, labels, xLabelY: plotBottom + labelGap + font, x, y };
}
