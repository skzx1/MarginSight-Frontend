'use client';
import { useLanguage } from '../language';
import { deltaParts } from '../../lib/signed-money';
import { Icon } from '../ui';
import s from './delta.module.css';

/** Change against the previous period: a neutral triangle (up/down only; none when flat or without a baseline) + signed percent + "vs previous".
 *  Colour stays neutral: a rise in costs is not good news, so direction is not coloured. Screen readers hear the spoken form only. */
export function Delta({ change, unit, className = '' }: { change: number | null | undefined; unit: 'pct' | 'pp'; className?: string }) {
  const { locale } = useLanguage();
  const parts = deltaParts(change, unit, locale);
  return <span className={`${s.delta} ${className}`.trim()} data-dir={parts.dir}>
    {(parts.dir === 'up' || parts.dir === 'down') && <span className={s.glyph}><Icon name={parts.dir === 'up' ? 'trendUp' : 'trendDown'} /></span>}
    <span aria-hidden="true">{parts.text}</span>
    <span className="sr-only">{parts.spoken}</span>
  </span>;
}
