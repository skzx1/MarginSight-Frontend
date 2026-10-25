// Signed display of money and percentages (System R). Display only: wraps money() and never changes values.
// Negative numbers use the true minus sign U+2212, never an ASCII hyphen; -0 and values that round to zero have no sign.
import { money } from './format.ts';
import { copy, type CopyKey } from './copy.ts';

export type PL = 'gain' | 'loss' | 'zero' | 'missing';
export type DeltaDir = 'up' | 'down' | 'flat' | 'none';
const MINUS = '−';
const tr = (key: CopyKey, locale: string) => copy[key][locale === 'en' ? 1 : 0];
const known = (value: number | null | undefined): value is number => value != null && Number.isFinite(value);

/** Kind of a satang amount. Amounts are shown to the satang, so the sign follows the rounded satang (-0 is zero). */
export function plKind(satang: number | null | undefined): PL {
  if (!known(satang)) return 'missing';
  const rounded = Math.round(satang);
  return rounded === 0 ? 'zero' : rounded < 0 ? 'loss' : 'gain';
}
function formatBaht(satang: number | null | undefined, locale: string, plus: boolean) {
  const kind = plKind(satang);
  if (kind === 'missing') return '—';
  if (kind === 'zero') return '฿' + money(0, locale);
  return (kind === 'loss' ? MINUS : plus ? '+' : '') + '฿' + money(Math.abs(satang!), locale);
}
/** "+฿118.30" | "−฿53.00" | "฿0.00" | "—": a signed amount (profit, difference). */
export const signedBaht = (satang: number | null | undefined, locale = 'th') => formatBaht(satang, locale, true);
/** "฿118.30" | "−฿53.00" | "฿0.00" | "—": an ordinary amount (sales, costs); only a negative value carries a sign. */
export const baht = (satang: number | null | undefined, locale = 'th') => formatBaht(satang, locale, false);

export type ProfitParts = { kind: PL; label: string | null; amount: string; text: string; spoken: string; phrase: string };
/** Profit or loss level: one visible rule everywhere ("ขาดทุน −฿53.00"), plus screen-reader text and a prose phrase. */
export function profitParts(satang: number | null | undefined, locale = 'th'): ProfitParts {
  const kind = plKind(satang), amount = signedBaht(satang, locale);
  if (kind === 'missing') return { kind, label: null, amount, text: amount, spoken: tr('profitUnavailable', locale), phrase: amount };
  const digits = money(kind === 'zero' ? 0 : Math.abs(satang!), locale);
  if (kind === 'zero') return { kind, label: null, amount, text: amount, spoken: `${digits} ${tr('bahtUnit', locale)}`, phrase: amount };
  const loss = kind === 'loss', label = tr(loss ? 'signedLoss' : 'signedProfit', locale);
  return {
    kind, label, amount, text: `${label} ${amount}`,
    spoken: `${tr(loss ? 'spokenLoss' : 'spokenProfit', locale)} ${digits} ${tr('bahtUnit', locale)}`,
    phrase: `${tr(loss ? 'phraseLoss' : 'phraseProfit', locale)} ฿${digits}`
  };
}

const roundTo = (value: number, digits: number) => Number(value.toFixed(digits));
function formatPercent(value: number | null | undefined, digits: number, plus: boolean, suffix: string) {
  if (!known(value)) return '—';
  const rounded = roundTo(value, digits);
  if (rounded === 0) return (0).toFixed(digits) + suffix;
  return (rounded < 0 ? MINUS : plus ? '+' : '') + Math.abs(rounded).toFixed(digits) + suffix;
}
/** "+12.4%" | "−3.2%" | "0.0%" | "—". Rounds first: a value that rounds to zero has no sign. */
export const signedPercent = (value: number | null | undefined, _locale = 'th', digits = 1) => formatPercent(value, digits, true, '%');
/** "12.4%" | "−3.2%" | "0.0%" | "—": a share or ratio; only a negative value carries a sign. */
export const percent = (value: number | null | undefined, _locale = 'th', digits = 1) => formatPercent(value, digits, false, '%');

export type DeltaParts = { dir: DeltaDir; text: string; spoken: string };
/** Change against the previous period, in percent or percentage points. The direction is decided on the rounded value. */
export function deltaParts(change: number | null | undefined, unit: 'pct' | 'pp', locale = 'th', digits = 1): DeltaParts {
  if (!known(change)) { const none = tr('noBaseline', locale); return { dir: 'none', text: none, spoken: none }; }
  const suffix = unit === 'pp' ? tr('percentPoints', locale) : '%';
  const rounded = roundTo(change, digits);
  if (rounded === 0) return { dir: 'flat', text: `${formatPercent(0, digits, false, suffix)} · ${tr('deltaFlat', locale)}`, spoken: tr('deltaFlat', locale) };
  const up = rounded > 0, vs = tr('vsPrevious', locale);
  return {
    dir: up ? 'up' : 'down',
    text: `${formatPercent(rounded, digits, true, suffix)} · ${vs}`,
    spoken: `${tr(up ? 'deltaUp' : 'deltaDown', locale)} ${Math.abs(rounded).toFixed(digits)}${suffix} ${vs}`
  };
}
