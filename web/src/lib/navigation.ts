// Workspace information architecture (G6 §1, G7 N1-N3). Pure data + helpers so tests can check reachability.
// Every destination is an existing hash route (lib/types.ts Screen); no new routes are added here.
import type { CopyKey } from './copy';
import type { Screen } from './types';
import type { IconName } from '../app/ui';

export const SCREENS: readonly Screen[] = ['playground', 'finance', 'overview', 'products', 'addProduct', 'assistant', 'store', 'orders', 'reconciliation', 'imports', 'receipts', 'rules', 'line', 'simulation'];

/** The five destinations of the mobile tab bar (<768) and the tablet rail (768-1023). */
export const PRIMARY: readonly Screen[] = ['overview', 'products', 'finance', 'assistant', 'store'];

export type NavItem = { screen: Screen; icon: IconName; sub?: true };
export type NavGroup = { id: string; heading?: CopyKey; items: NavItem[] };

/** Grouped sidebar (>=1024 and the tablet drawer). `sub` items are hidden on the rail and the tab bar. */
export const NAV_GROUPS: readonly NavGroup[] = [
  { id: 'overview', items: [{ screen: 'overview', icon: 'overview' }] },
  { id: 'products', heading: 'navGroupProducts', items: [{ screen: 'products', icon: 'products' }, { screen: 'playground', icon: 'simulation', sub: true }] },
  { id: 'money', heading: 'navGroupMoney', items: [{ screen: 'finance', icon: 'calculator' }, { screen: 'orders', icon: 'orders', sub: true }, { screen: 'reconciliation', icon: 'reconcile', sub: true }] },
  { id: 'data', heading: 'navGroupData', items: [{ screen: 'imports', icon: 'upload', sub: true }, { screen: 'receipts', icon: 'receipt', sub: true }, { screen: 'rules', icon: 'rules', sub: true }] },
  { id: 'assistant', heading: 'navGroupAssistant', items: [{ screen: 'assistant', icon: 'assistant' }] },
  { id: 'store', heading: 'navGroupStore', items: [{ screen: 'store', icon: 'settings' }, { screen: 'line', icon: 'line', sub: true }] },
];

/** Destinations reached only from page content (not listed in the sidebar). */
export const CONTEXTUAL: readonly Screen[] = ['addProduct', 'simulation'];

const PARENT: Partial<Record<Screen, Screen>> = {
  orders: 'finance', reconciliation: 'finance',
  simulation: 'products', addProduct: 'products', playground: 'products',
  imports: 'store', receipts: 'store', rules: 'store', line: 'store',
};

/** The primary destination a screen belongs to (rail/tab highlight and the "← parent" back link). */
export function parentScreen(screen: Screen): Screen { return PARENT[screen] ?? screen; }

export const isNavScreen = (screen: Screen) => NAV_GROUPS.some(group => group.items.some(item => item.screen === screen));

/**
 * Which nav item is current. `page` = the exact screen (or its parent when the screen is not in the sidebar);
 * `section` = the parent of a sub-item that is current (shown as active on the rail and the tab bar, where sub-items are hidden).
 */
export function navState(item: Screen, screen: Screen): 'page' | 'section' | undefined {
  const exact = isNavScreen(screen) ? screen : parentScreen(screen);
  if (item === exact) return 'page';
  if (item === parentScreen(screen)) return 'section';
  return undefined;
}

/** Screens whose shared top bar shows the overview period control (state shared by overview and finance). */
export const PERIOD_SCREENS: readonly Screen[] = ['overview', 'finance'];
/** Screens whose page header keeps the separate month control. */
export const MONTH_SCREENS: readonly Screen[] = ['orders', 'reconciliation', 'simulation', 'playground'];
/** Screens without the shared page header / top bar (the assistant has its own chat header). */
export const OWN_HEADER_SCREENS: readonly Screen[] = ['assistant'];

/** Default focus target when a screen is entered (G7 R01). */
export const SCREEN_TITLE_ID = 'screen-title';

/**
 * Arrival focus (A11). A caller may name the element the destination focuses itself (e.g. the assistant composer);
 * the shell then skips the h1 for that one arrival. Back/forward (hash) changes clear any pending intent.
 */
export function createArrivalFocus() {
  let pending: string | null = null;
  return {
    set(id?: string | null) { pending = id ?? null; },
    clear() { pending = null; },
    /** The id to focus for the arrival that just rendered; consumes the intent. */
    take(): string { const id = pending ?? SCREEN_TITLE_ID; pending = null; return id; },
  };
}

/** Tablet drawer (768-1023, non-modal overlay, G7 N3): only the toggle opens it; every other event closes it. */
export type DrawerEvent = 'toggle' | 'choose' | 'scrim' | 'escape' | 'screenChange' | 'leaveTablet';
export function nextDrawerOpen(open: boolean, event: DrawerEvent): boolean { return event === 'toggle' ? !open : false; }
