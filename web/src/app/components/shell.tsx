'use client';
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Screen, Store } from '../../lib/types';
import { useLanguage } from '../language';
import { Brand, Icon, type IconName } from '../ui';
import { DataStatus } from './ledger';
import { Field, Select } from './forms';
import assistantStyles from './assistant.module.css';
import financeStyles from './finance.module.css';
export const primary: { screen: Screen; icon: IconName }[] = [{ screen: 'overview', icon: 'overview' }, { screen: 'products', icon: 'products' }, { screen: 'finance', icon: 'calculator' }, { screen: 'assistant', icon: 'assistant' }, { screen: 'playground', icon: 'simulation' }, { screen: 'store', icon: 'settings' }];
const screens: Screen[] = ['playground','finance','overview','products','addProduct','assistant','store','orders','reconciliation','imports','receipts','rules','line','simulation'];
export function parentScreen(screen: Screen): Screen { if (['orders','reconciliation'].includes(screen)) return 'overview'; if (['simulation','addProduct'].includes(screen)) return 'products'; if (['imports','receipts','rules','line'].includes(screen)) return 'store'; return screen; }
export function useNavigation() {
  const [screen, setScreen] = useState<Screen>('overview');
  const current = useRef<Screen>('overview'), guard = useRef<(() => boolean) | null>(null);
  const registerGuard = useCallback((check: () => boolean) => { guard.current = check; return () => { if (guard.current === check) guard.current = null; }; }, []);
  const canLeave = useCallback(() => guard.current?.() ?? true, []);
  useEffect(() => {
    const read = () => {
      const candidate = location.hash.slice(1) as Screen, next = screens.includes(candidate) ? candidate : 'overview';
      if (next !== current.current && !canLeave()) { history.replaceState(history.state, '', location.pathname + location.search + '#' + current.current); return; }
      current.current = next; setScreen(next);
    };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, [canLeave]);
  const navigate = useCallback((next: Screen) => {
    if (next === current.current || !canLeave()) return;
    current.current = next; if (location.hash !== '#' + next) location.hash = next; setScreen(next);
  }, [canLeave]);
  return { screen, navigate, registerGuard, canLeave };
}
export function AppShell({ screen, navigate, stores, store, changeStore, month, changeMonth, guest, children, overviewControls, assistantNav }: { screen: Screen; navigate: (screen: Screen) => void; stores: Store[]; store: Store; changeStore: (id: string) => void; month: string; changeMonth: (value: string) => void; guest: boolean; children: ReactNode; overviewControls?: ReactNode; assistantNav?: ReactNode }) {
  const { t } = useLanguage();
  const parent = parentScreen(screen);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const drawerToggle = useRef<HTMLButtonElement>(null);
  const lastScreen = useRef<Screen | null>(null);
  useEffect(() => { document.title = t(screen) + ' · MarginShot'; if (screen === 'store' && lastScreen.current === screen) return; lastScreen.current = screen; document.getElementById('screen-title')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [screen, t]);
  return <div className={'app-shell' + (drawerExpanded ? ' drawer-expanded' : '') + (screen === 'overview' ? ' overview-shell' : '') + (screen === 'assistant' ? ' ' + assistantStyles.shell : '') + (screen === 'finance' ? ' ' + financeStyles.shell : '')}>
    <a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t('skip')}</a>
    <div className="topbar" onKeyDown={e => {
      if (e.key === 'Escape' && drawerExpanded && window.matchMedia('(min-width:768px) and (max-width:1023px)').matches) {
        e.preventDefault(); setDrawerExpanded(false); drawerToggle.current?.focus();
      }
    }}>
      <Brand />
      <div className="desktop-store" title={store.name ?? store.id}>
        <span className="drawer-store-mark" aria-hidden="true">{(store.name ?? store.id).slice(0, 1)}</span>
        <span className="drawer-store-name"><small>{t('store')}</small><strong>{store.name ?? store.id}</strong></span>
      </div>
      <button ref={drawerToggle} className="drawer-toggle secondary" type="button" aria-controls="main-navigation" aria-expanded={drawerExpanded} aria-label={t(drawerExpanded ? 'collapseNavigation' : 'expandNavigation')} title={t(drawerExpanded ? 'collapseNavigation' : 'expandNavigation')} onClick={() => setDrawerExpanded(value => !value)}>
        <Icon name={drawerExpanded ? 'close' : 'menu'} /><span>{t('collapseNavigation')}</span>
      </button>
      <nav id="main-navigation" className="primary-nav" aria-label={t('mainNavigation')}>
        {primary.map(item => <Fragment key={item.screen}>
          <button aria-label={t(item.screen)} title={t(item.screen)} aria-current={parent === item.screen ? 'page' : undefined} className={parent === item.screen ? 'active' : ''} onClick={() => navigate(item.screen)}>
            <Icon name={item.icon} /><span>{t(item.screen)}</span>
          </button>
          {item.screen === 'assistant' && screen === 'assistant' && assistantNav}
        </Fragment>)}
      </nav>
    </div>
    <main id="main-content" tabIndex={-1} className={'workspace ' + (screen === 'assistant' ? 'assistant-workspace' : '')}>
      {guest && !['assistant','finance'].includes(screen) && <div className="demo-banner"><DataStatus value="MOCK" /><span>{t('demoBanner')}</span></div>}
      {!['assistant','finance'].includes(screen) && <header className="screen-header"><div>{parent !== screen && <button className="ghost back-link" onClick={() => navigate(parent)}>← {t(parent)}</button>}<span className="eyebrow">{store.name ?? store.id}</span><h1 id="screen-title" tabIndex={-1}>{t(screen)}</h1></div><div className="context-controls"><Select label={t('store')} value={store.id} onChange={e => changeStore(e.target.value)}>{stores.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</Select>{screen === 'overview' ? overviewControls : ['orders','reconciliation','simulation','playground'].includes(screen) && <Field label={t('month')} type="month" value={month} onChange={e => { if (e.target.value) changeMonth(e.target.value); }} />}</div></header>}
      {children}
      {screen !== 'assistant' && <footer className="app-footer">MarginShot · {t('trustNote')}</footer>}</main>
  </div>;
}
