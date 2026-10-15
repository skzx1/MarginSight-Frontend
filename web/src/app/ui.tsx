import type { ReactNode } from 'react';
export type IconName = 'overview' | 'upload' | 'products' | 'orders' | 'simulation' | 'assistant' | 'receipt' | 'rules' | 'reconcile' | 'line' | 'arrow' | 'check' | 'shield' | 'refresh' | 'logout' | 'menu' | 'close';
const paths: Record<IconName, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  upload: <path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
  products: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7 5.8l10 5.4" />,
  orders: <><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h3" /></>,
  simulation: <path d="M4 4v16h16M7 15l5-5 4 3 5-8m-5 0h5v5" />,
  assistant: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4" />,
  receipt: <path d="M5 3h14v19l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h3" />,
  rules: <><path d="m3 12 9-9h8a1 1 0 0 1 1 1v8l-9 9-9-9Z" /><circle cx="16" cy="8" r="1" /><path d="m8 11 5 5m-5 0 5-5" /></>,
  reconcile: <path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" />,
  line: <><path d="M21 11c0 5-5 8-10 8l-5 3 1-5c-3-1-4-3-4-6 0-5 4-8 9-8s9 3 9 8Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  refresh: <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />,
  logout: <path d="M9 4H4v16h5m0-8h12m-4-4 4 4-4 4" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />
};
export function Icon({
  name
}: {
  name: IconName;
}) {
  return <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Brand() {
  return <div className="brand"><span className="logo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 17V7l8 7 8-7v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>MarginSight<small>เห็นกำไร เข้าใจร้าน</small></span></div>;
}
export function EmptyState({
  icon = 'orders',
  title,
  children,
  action
}: {
  icon?: IconName;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{children}</p>{action}</div>;
}
export function Steps({
  items,
  current = 0
}: {
  items: string[];
  current?: number;
}) {
  return <ol className="steps" aria-label="ขั้นตอนการทำงาน">{items.map((item, i) => <li key={item} className={i <= current ? 'current' : ''}><span>{i < current ? <Icon name="check" /> : i + 1}</span>{item}</li>)}</ol>;
}
export function PageIntro({
  icon,
  title,
  children
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return <div className="page-intro"><span className="intro-icon"><Icon name={icon} /></span><div><h2>{title}</h2><p>{children}</p></div></div>;
}
