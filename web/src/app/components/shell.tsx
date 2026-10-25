'use client';
import { createContext, Fragment, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { logout } from '../../lib/auth';
import { MONTH_SCREENS, NAV_GROUPS, OWN_HEADER_SCREENS, PERIOD_SCREENS, SCREEN_TITLE_ID, createArrivalFocus, navState, nextDrawerOpen, parentScreen, type DrawerEvent } from '../../lib/navigation';
import { DETAIL_SCREENS, DETAIL_TITLE_ID, formatHash, parseHash, routeChange, type Route } from '../../lib/routes';
import type { Screen, Store } from '../../lib/types';
import { LanguageSwitch, useLanguage } from '../language';
import { Brand, Icon } from '../ui';
import { DataStatus } from './ledger';
import { Field, Select } from './forms';
import assistantStyles from './assistant.module.css';
import financeStyles from './finance.module.css';
export { parentScreen } from '../../lib/navigation';
/**
 * focus: arrival intent, the id of the element the destination screen focuses itself (A11), so the shell skips the h1.
 * detail: open a detail route (#products/<sku>, #orders/<key>); omitted = the screen itself (list).
 * replace: rewrite the current history entry instead of adding one (e.g. a deep link whose id was not found).
 */
export type NavigateOptions = { focus?: string; detail?: string | null; replace?: boolean };
const TABLET = '(min-width:768px) and (max-width:1023px)';
const withHash = (hash: string) => location.pathname + location.search + hash;
export function useNavigation() {
  const [route, setRoute] = useState<Route>({ screen: 'overview', detail: null });
  const current = useRef<Route>(route), guard = useRef<(() => boolean) | null>(null), arrival = useRef(createArrivalFocus());
  const registerGuard = useCallback((check: () => boolean) => { guard.current = check; return () => { if (guard.current === check) guard.current = null; }; }, []);
  const canLeave = useCallback(() => guard.current?.() ?? true, []);
  useEffect(() => {
    // Back/forward, refresh and typed URLs. A refused screen change restores the previous full hash (detail included).
    const read = () => {
      const next = parseHash(location.hash), change = routeChange(current.current, next);
      if (change === 'none') return;
      if (change === 'screen' && !canLeave()) { history.replaceState(history.state, '', withHash(formatHash(current.current))); return; }
      arrival.current.clear();
      current.current = next; setRoute(next);
    };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, [canLeave]);
  const navigate = useCallback((screen: Screen, options?: NavigateOptions) => {
    const next: Route = { screen, detail: DETAIL_SCREENS.includes(screen) ? options?.detail ?? null : null };
    const change = routeChange(current.current, next);
    if (change === 'none' || (change === 'screen' && !canLeave())) return;
    if (change === 'screen') arrival.current.set(options?.focus);
    current.current = next;
    const hash = formatHash(next);
    if (options?.replace) history.replaceState(history.state, '', withHash(hash));
    else if (location.hash !== hash) location.hash = hash.slice(1);
    setRoute(next);
  }, [canLeave]);
  /** The element id to focus for this arrival (the h1 unless the caller passed an intent); consumes the intent. */
  const takeArrivalFocus = useCallback(() => arrival.current.take(), []);
  return { screen: route.screen, detail: route.detail, navigate, registerGuard, canLeave, takeArrivalFocus };
}
const ScreenActionsSlot = createContext<HTMLElement | null>(null);
/** Renders a screen's own header actions (e.g. finance Export) into the shared page header. */
export function ScreenActions({ children }: { children: ReactNode }) {
  const slot = useContext(ScreenActionsSlot);
  return slot ? createPortal(children, slot) : null;
}
export function AppShell({ screen, navigate, stores, store, changeStore, month, changeMonth, guest, origin, canLeave, takeArrivalFocus, children, periodControl, assistantNav }: { screen: Screen; navigate: (screen: Screen) => void; stores: Store[]; store: Store; changeStore: (id: string) => void; month: string; changeMonth: (value: string) => void; guest: boolean; origin?: string; canLeave: () => boolean; takeArrivalFocus?: () => string; children: ReactNode; periodControl?: ReactNode; assistantNav?: ReactNode }) {
  const { t } = useLanguage();
  const parent = parentScreen(screen);
  const [drawerExpanded, setDrawerOpen] = useState(false);
  const drawer = useCallback((event: DrawerEvent) => setDrawerOpen(open => nextDrawerOpen(open, event)), []);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
  const drawerToggle = useRef<HTMLButtonElement>(null);
  const sharedHeader = !OWN_HEADER_SCREENS.includes(screen);
  useEffect(() => { document.title = t(screen) + ' · MarginShot'; }, [screen, t]);
  // Focus moves only when the screen changes (not on a language switch). An arrival intent (A11) hands focus to the screen.
  useEffect(() => {
    window.scrollTo(0, 0);
    // Arriving on a detail route that is already rendered (e.g. Back from the assistant to #products/<sku>) focuses the detail heading.
    const wanted = takeArrivalFocus?.() ?? SCREEN_TITLE_ID;
    const id = wanted === SCREEN_TITLE_ID && document.getElementById(DETAIL_TITLE_ID) ? DETAIL_TITLE_ID : wanted;
    const target = document.getElementById(id) ?? document.getElementById(SCREEN_TITLE_ID);
    if (target && document.activeElement !== target) target.focus({ preventScroll: true });
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps
  // Tablet drawer (768-1023, non-modal overlay): closes on screen change, nav choice, scrim click, Escape (focus → toggle) and leaving the tablet range.
  useEffect(() => { drawer('screenChange'); }, [screen, drawer]);
  useEffect(() => {
    if (!drawerExpanded) return;
    const media = window.matchMedia(TABLET);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !media.matches || document.querySelector('dialog[open]')) return;
      e.preventDefault(); drawer('escape'); drawerToggle.current?.focus();
    };
    const onMedia = () => { if (!media.matches) drawer('leaveTablet'); };
    document.addEventListener('keydown', onKey); media.addEventListener('change', onMedia);
    return () => { document.removeEventListener('keydown', onKey); media.removeEventListener('change', onMedia); };
  }, [drawerExpanded, drawer]);
  // <768 the tab bar can grow past --nav-height (a label wraps, e.g. EN "Ask assistant"); keep --nav-height equal to its real
  // height so the workspace padding, sticky composers and the store save dock never sit under it. >=768 the token applies.
  useEffect(() => {
    const nav = document.getElementById('main-navigation'), root = document.documentElement, mobile = window.matchMedia('(max-width:767px)');
    if (!nav) return;
    const sync = () => {
      // Consumers add env(safe-area-inset-bottom) themselves, so measure the bar without its bottom padding beyond the top one.
      const style = getComputedStyle(nav), height = nav.offsetHeight - parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
      if (mobile.matches && height > 0) root.style.setProperty('--nav-height', Math.ceil(height) + 'px'); else root.style.removeProperty('--nav-height');
    };
    const observer = new ResizeObserver(() => requestAnimationFrame(sync));
    observer.observe(nav); mobile.addEventListener('change', sync); sync();
    return () => { observer.disconnect(); mobile.removeEventListener('change', sync); root.style.removeProperty('--nav-height'); };
  }, []);
  const choose = (next: Screen) => { drawer('choose'); navigate(next); };
  return <ScreenActionsSlot.Provider value={actionsSlot}><div className={'app-shell' + (drawerExpanded ? ' drawer-expanded' : '') + (screen === 'overview' ? ' overview-shell' : '') + (screen === 'assistant' ? ' ' + assistantStyles.shell : '') + (screen === 'finance' ? ' ' + financeStyles.shell : '')}>
    <a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t('skip')}</a>
    <div className="topbar">
      <Brand />
      <div className="desktop-store" title={store.name ?? store.id}>
        <span className="drawer-store-mark" aria-hidden="true">{(store.name ?? store.id).slice(0, 1)}</span>
        <span className="drawer-store-name"><small>{t('store')}</small><strong>{store.name ?? store.id}</strong></span>
      </div>
      <button ref={drawerToggle} className="drawer-toggle secondary" type="button" aria-controls="main-navigation" aria-expanded={drawerExpanded} aria-label={t(drawerExpanded ? 'collapseNavigation' : 'expandNavigation')} title={t(drawerExpanded ? 'collapseNavigation' : 'expandNavigation')} onClick={() => drawer('toggle')}>
        <Icon name={drawerExpanded ? 'close' : 'menu'} /><span>{t('collapseNavigation')}</span>
      </button>
      <nav id="main-navigation" className="primary-nav" aria-label={t('mainNavigation')}>
        {NAV_GROUPS.map(group => <div key={group.id} className="nav-group">
          {group.heading && <span className="nav-group-heading">{t(group.heading)}</span>}
          {group.items.map(item => { const state = navState(item.screen, screen); return <Fragment key={item.screen}>
            <button type="button" aria-label={t(item.screen)} title={t(item.screen)} aria-current={state === 'page' ? 'page' : state === 'section' ? 'true' : undefined} className={[item.sub ? 'nav-sub' : '', state === 'page' ? 'active' : '', state === 'section' ? 'section-active' : ''].filter(Boolean).join(' ') || undefined} onClick={() => choose(item.screen)}>
              <Icon name={item.icon} /><span>{t(item.screen)}</span>
            </button>
            {item.screen === 'assistant' && screen === 'assistant' && assistantNav}
          </Fragment>; })}
        </div>)}
      </nav>
      <div className="sidebar-account" role="group" aria-label={t('navAccount')}>
        <span className="nav-group-heading">{t('navAccount')}</span>
        <LanguageSwitch />
        <button type="button" className="ghost sidebar-logout" onClick={() => { if (canLeave()) logout(); }}><Icon name="logout" /><span>{t('logout')}</span></button>
      </div>
    </div>
    {drawerExpanded && <div className="drawer-scrim" aria-hidden="true" onClick={() => drawer('scrim')} />}
    <main id="main-content" tabIndex={-1} className={'workspace ' + (screen === 'assistant' ? 'assistant-workspace' : '')}>
      {sharedHeader && <div className="context-bar" role="group" aria-label={t('screenContext')}>
        <div className="context-store"><Select label={t('store')} value={store.id} onChange={e => changeStore(e.target.value)}>{stores.map(item => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</Select></div>
        {origin === 'MOCK' && <DataStatus value="MOCK" />}
        {PERIOD_SCREENS.includes(screen) && periodControl && <div className="context-period">{periodControl}</div>}
      </div>}
      {guest && !['assistant','finance'].includes(screen) && <div className="demo-banner"><DataStatus value="MOCK" /><span>{t('demoBanner')}</span></div>}
      {sharedHeader && <header className="screen-header"><div>{parent !== screen && <button className="ghost back-link" onClick={() => navigate(parent)}>← {t(parent)}</button>}<span className="eyebrow">{store.name ?? store.id}</span><h1 id="screen-title" tabIndex={-1}>{t(screen)}</h1></div><div className="screen-header-actions">{MONTH_SCREENS.includes(screen) && <div className="context-controls"><Field label={t('month')} type="month" value={month} onChange={e => { if (e.target.value) changeMonth(e.target.value); }} /></div>}<div ref={setActionsSlot} className="screen-actions" /></div></header>}
      {children}
      {screen !== 'assistant' && <footer className="app-footer">MarginShot · {t('trustNote')}</footer>}</main>
  </div></ScreenActionsSlot.Provider>;
}
