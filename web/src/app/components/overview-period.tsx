'use client';
import type { OverviewPeriod, PeriodType } from '../../lib/overview-data';
import { useLanguage } from '../language';
import { Field, Select } from './forms';

export default function OverviewPeriodControl({ value, onChange }: { value: OverviewPeriod; onChange: (value: OverviewPeriod) => void }) {
  const { t } = useLanguage();
  return <div className="overview-period-control">
    <Select label={t('overviewPeriod')} value={value.type} onChange={e => onChange({ ...value, type: e.target.value as PeriodType })}>
      <option value="today">{t('today')}</option><option value="week">{t('thisWeek')}</option>
      <option value="month">{t('thisMonth')}</option><option value="custom">{t('customRange')}</option>
    </Select>
    {value.type === 'custom' && <div className="overview-date-range">
      <Field label={t('customStartDate')} type="date" value={value.start} max={value.end || undefined} onChange={e => onChange({ ...value, start: e.target.value })} required />
      <Field label={t('customEndDate')} type="date" value={value.end} min={value.start || undefined} onChange={e => onChange({ ...value, end: e.target.value })} required />
    </div>}
  </div>;
}
