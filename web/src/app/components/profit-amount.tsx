'use client';
import { useLanguage } from '../language';
import { money } from '../../lib/format';
import s from './profit-amount.module.css';

/** Profit or loss shown with a sign and a text label, so the meaning never depends on colour alone. Colour is inherited from the surrounding context (light or dark panel). Display only. */
export function ProfitAmount({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  const { t, locale } = useLanguage();
  if (value == null) return <span className="money">—</span>;
  // Zero gets no label: "break-even" would be misleading for an empty store.
  if (value === 0) return <span className="money">{'฿' + money(0, locale)}</span>;
  const label = t(value < 0 ? 'signedLoss' : 'signedProfit');
  const sign = value < 0 ? '−' : '+';
  return <span className={`${s.amount} ${className}`.trim()}>
    <span className={s.label}>{label}</span>
    <span className="money">{sign}฿{money(Math.abs(value), locale)}</span>
  </span>;
}
