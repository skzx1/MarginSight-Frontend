export function money(value: number | null | undefined, locale = 'th') {
  return value == null ? '—' : new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
}
export const bangkokDate = (value = new Date().toISOString()) => new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10);
export const dateAt = (value: string) => new Date(value + 'T00:00:00+07:00').toISOString();
// Parse input units only; financial calculations belong to the canonical engine.
export function parseBaht(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('MONEY_INPUT');
  const [whole, fraction = ''] = value.trim().split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount)) throw new Error('MONEY_INPUT');
  return amount;
}
