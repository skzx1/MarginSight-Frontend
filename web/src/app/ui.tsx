'use client';
import type { ReactNode } from 'react';
import { useLanguage } from './language';
export type IconName = 'overview' | 'upload' | 'products' | 'orders' | 'simulation' | 'assistant' | 'receipt' | 'rules' | 'reconcile' | 'line' | 'arrow' | 'check' | 'shield' | 'refresh' | 'logout' | 'menu' | 'close' | 'settings' | 'search' | 'calculator' | 'plus' | 'sparkles' | 'chevronRight' | 'warning' | 'info' | 'trendUp' | 'trendDown';
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
  close: <path d="m6 6 12 12M6 18 18 6" />,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  calculator: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" /></>,
  plus: <path d="M12 5v14m-7-7h14" />,
  sparkles: <path d="m12 3 1.9 4.8a2 2 0 0 0 1.3 1.3L20 11l-4.8 1.9a2 2 0 0 0-1.3 1.3L12 19l-1.9-4.8a2 2 0 0 0-1.3-1.3L4 11l4.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  warning: <path d="M12 3 2 20h20L12 3Zm0 7v4m0 3v.01" />,
  info: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8v.01" />,
  trendUp: <path d="m12 6 7 11H5l7-11Z" />,
  trendDown: <path d="m12 18 7-11H5l7 11Z" />
};
export function Icon({
  name
}: {
  name: IconName;
}) {
  return <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Brand() {
  const { t } = useLanguage();
  return <div className="brand"><span className="logo"><img src="/branding/marginshot-icon.svg" width="40" height="40" alt="" /></span><span>MarginShot<small>{t('tagline')}</small></span></div>;
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
  return <ol className="steps" aria-label="ขั้นตอนการทำงาน">{items.map((item, i) => <li key={item} className={i <= current ? 'current' : ''} aria-current={i === current ? 'step' : undefined}><span>{i < current ? <Icon name="check" /> : i + 1}</span>{item}</li>)}</ol>;
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
