'use client';
import { useLanguage } from '../language';
import { profitParts } from '../../lib/signed-money';
import s from './profit-amount.module.css';

/** Profit or loss shown with a sign and a text label, so the meaning never depends on colour alone. Colour is inherited from the surrounding context (light or dark panel). Display only.
 *  The visible text is hidden from screen readers; they hear the spoken form ("ขาดทุน 53.00 บาท"), so no "minus" is read aloud. */
export function ProfitAmount({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  const { locale } = useLanguage();
  const parts = profitParts(value, locale);
  const spoken = <span className="sr-only">{parts.spoken}</span>;
  // Zero gets no label: "break-even" would be misleading for an empty store.
  if (!parts.label) return <span className="money"><span aria-hidden="true">{parts.amount}</span>{spoken}</span>;
  return <span className={`${s.amount} ${className}`.trim()}>
    <span className={s.label} aria-hidden="true">{parts.label}</span>
    <span className="money" aria-hidden="true">{parts.amount}</span>
    {spoken}
  </span>;
}
