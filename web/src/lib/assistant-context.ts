import type { CatalogProduct } from './types';
import type { ChatContext } from './assistant-sessions';

export function monthContext(month: string): ChatContext {
  const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0, 12);
  return { start: month + '-01', end: `${month}-${String(end.getDate()).padStart(2, '0')}`, sku: null };
}
const day = (date: Date) => date.toISOString().slice(0, 10);
export function contextPreset(preset: 'today' | 'week' | 'lastWeek' | 'month' | 'lastMonth', today: string): ChatContext {
  const d = new Date(today + 'T12:00:00Z');
  if (preset === 'today') return { start: today, end: today, sku: null };
  if (preset === 'month') return { ...monthContext(today.slice(0, 7)), end: today };
  if (preset === 'lastMonth') { d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return monthContext(day(d).slice(0, 7)); }
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  if (preset === 'week') return { start: day(d), end: today, sku: null };
  d.setUTCDate(d.getUTCDate() - 7); const start = day(d); d.setUTCDate(d.getUTCDate() + 6);
  return { start, end: day(d), sku: null };
}
export function resolveChatContext(question: string, current: ChatContext, products: CatalogProduct[], today: string): ChatContext {
  const next = { ...current }, q = question.toLocaleLowerCase();
  const presets = [
    ['lastWeek', /สัปดาห์ที่แล้ว|อาทิตย์ที่แล้ว|last week/i], ['week', /สัปดาห์นี้|อาทิตย์นี้|this week/i],
    ['lastMonth', /เดือนที่แล้ว|last month/i], ['month', /เดือนนี้|this month/i], ['today', /วันนี้|today/i]
  ] as const;
  for (const [preset, pattern] of presets) if (pattern.test(q)) { const period = contextPreset(preset, today); next.start = period.start; next.end = period.end; break; }
  const explicitMonth = q.match(/\b(20\d{2}-(?:0[1-9]|1[0-2]))\b/);
  if (explicitMonth) Object.assign(next, monthContext(explicitMonth[1]), { sku: next.sku });
  const matches = products.filter(p => {
    const sku = p.sku.toLocaleLowerCase(), name = p.name.toLocaleLowerCase();
    return (sku.length > 1 && q.includes(sku)) || (name.length > 2 && q.includes(name));
  });
  if (matches.length === 1) next.sku = matches[0].sku;
  if (/ทุกสินค้า|ทั้งร้าน|all products|whole store/i.test(q) || /สินค้าไหน|สินค้าตัวไหน|which product/i.test(q)) next.sku = null;
  return next;
}
export function contextLabel(context: ChatContext, locale: 'th' | 'en') {
  const formatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });
  const format = (date: string) => formatter.format(new Date(date + 'T12:00:00Z'));
  return context.start === context.end ? format(context.start) : `${format(context.start)} – ${format(context.end)}`;
}
export function answerReferenceLabel(context:ChatContext,catalogReferenceAt:string|undefined,locale:'th'|'en'){
  if(!catalogReferenceAt)return contextLabel(context,locale);
  const date=new Intl.DateTimeFormat(locale==='th'?'th-TH':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(catalogReferenceAt));
  return (locale==='th'?'ข้อมูลสินค้าปัจจุบัน ณ ':'Current product data as of ')+date;
}
