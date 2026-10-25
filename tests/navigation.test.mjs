import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTEXTUAL, MONTH_SCREENS, NAV_GROUPS, PERIOD_SCREENS, PRIMARY, SCREENS, headerBackTarget, isNavScreen, navState, parentScreen } from '../web/src/lib/navigation.ts';
import { copy } from '../web/src/lib/copy.ts';

const union = readFileSync(new URL('../web/src/lib/types.ts', import.meta.url), 'utf8').match(/export type Screen = ([^;]+);/)[1];
const unionScreens = [...union.matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]);
const navItems = NAV_GROUPS.flatMap(group => group.items);

test('SCREENS matches the Screen union exactly (no new routes)', () => {
  assert.deepEqual([...SCREENS].sort(), [...unionScreens].sort());
  assert.equal(SCREENS.length, 13);
});

test('parentScreen for every Screen value', () => {
  const expected = {
    overview: 'overview', products: 'products', finance: 'finance', assistant: 'assistant', store: 'store',
    orders: 'finance', reconciliation: 'finance',
    simulation: 'products', addProduct: 'products', playground: 'products',
    imports: 'store', rules: 'store', line: 'store',
  };
  assert.deepEqual(Object.keys(expected).sort(), [...SCREENS].sort());
  for (const screen of SCREENS) assert.equal(parentScreen(screen), expected[screen], screen);
  for (const screen of SCREENS) assert.ok(PRIMARY.includes(parentScreen(screen)), screen + ' parent must be a primary destination');
});

test('PRIMARY keeps the five existing tab bar / rail destinations in order', () => {
  assert.deepEqual([...PRIMARY], ['overview', 'products', 'finance', 'assistant', 'store']);
  assert.deepEqual(navItems.filter(item => !item.sub).map(item => item.screen), [...PRIMARY]);
});

test('every Screen is reachable: in the sidebar or on the documented contextual list', () => {
  for (const screen of SCREENS) assert.ok(isNavScreen(screen) || CONTEXTUAL.includes(screen), screen);
  assert.deepEqual([...CONTEXTUAL].sort(), ['addProduct', 'simulation']);
  for (const screen of CONTEXTUAL) assert.equal(isNavScreen(screen), false);
});

test('no sidebar item duplicates a Screen; sub-items sit under their parent group', () => {
  const screens = navItems.map(item => item.screen);
  assert.equal(new Set(screens).size, screens.length);
  for (const group of NAV_GROUPS) for (const item of group.items) {
    if (!item.sub) continue;
    assert.notEqual(parentScreen(item.screen), item.screen, item.screen);
  }
  const money = NAV_GROUPS.find(group => group.id === 'money').items.map(item => item.screen);
  assert.deepEqual(money, ['finance', 'orders', 'reconciliation']);
  const store = NAV_GROUPS.find(group => group.id === 'store').items.map(item => item.screen);
  assert.deepEqual(store, ['store', 'imports', 'rules', 'line']);
});

test('R2: the receipts page is removed and every group has a top-level item', () => {
  assert.equal(SCREENS.includes('receipts'), false);
  assert.equal(navItems.some(item => item.screen === 'receipts'), false);
  for (const group of NAV_GROUPS) assert.ok(group.items.some(item => !item.sub), group.id + ' needs a top-level item');
  assert.equal('receipts' in copy, false);
});

test('group headings exist in copy (TH + EN)', () => {
  for (const group of NAV_GROUPS) {
    if (!group.heading) continue;
    const pair = copy[group.heading];
    assert.ok(pair && pair[0] && pair[1], group.heading);
  }
  for (const key of ['navAccount', 'screenContext']) assert.ok(copy[key]?.[0] && copy[key]?.[1], key);
});

test('navState: exact screen is the page; parent of a sub-item is the section', () => {
  assert.equal(navState('orders', 'orders'), 'page');
  assert.equal(navState('finance', 'orders'), 'section');
  assert.equal(navState('overview', 'orders'), undefined);
  // screens that are not in the sidebar mark their parent as the page
  assert.equal(navState('products', 'addProduct'), 'page');
  assert.equal(navState('products', 'simulation'), 'page');
  assert.equal(navState('products', 'products'), 'page');
  assert.equal(navState('playground', 'products'), undefined);
  for (const screen of SCREENS) {
    const pages = navItems.filter(item => navState(item.screen, screen) === 'page');
    assert.equal(pages.length, 1, screen + ' has exactly one current page item');
    const current = PRIMARY.filter(item => navState(item, screen));
    assert.deepEqual(current, [parentScreen(screen)], screen + ' highlights its parent on the rail / tab bar');
  }
});

test('period and month controls are on disjoint screens', () => {
  assert.deepEqual([...PERIOD_SCREENS], ['overview', 'finance']);
  for (const screen of MONTH_SCREENS) assert.ok(!PERIOD_SCREENS.includes(screen));
});

test('A11: an arrival intent replaces the h1 focus once; ordinary arrivals focus the h1', async () => {
  const { createArrivalFocus, SCREEN_TITLE_ID } = await import('../web/src/lib/navigation.ts');
  const focus = createArrivalFocus();
  assert.equal(SCREEN_TITLE_ID, 'screen-title');
  assert.equal(focus.take(), 'screen-title');
  focus.set('assistant-input');
  assert.equal(focus.take(), 'assistant-input');
  assert.equal(focus.take(), 'screen-title', 'the intent is consumed by one arrival');
  focus.set('assistant-input'); focus.clear();
  assert.equal(focus.take(), 'screen-title', 'back/forward clears a pending intent');
  focus.set(undefined);
  assert.equal(focus.take(), 'screen-title');
});

test('N3: the tablet drawer closes on nav choice, scrim, Escape, screen change and leaving the tablet range', async () => {
  const { nextDrawerOpen } = await import('../web/src/lib/navigation.ts');
  assert.equal(nextDrawerOpen(false, 'toggle'), true);
  assert.equal(nextDrawerOpen(true, 'toggle'), false);
  for (const event of ['choose', 'scrim', 'escape', 'screenChange', 'leaveTablet']) {
    assert.equal(nextDrawerOpen(true, event), false, event);
    assert.equal(nextDrawerOpen(false, event), false, event);
  }
});

test('P4-G3: the shell reads routes through lib/routes; a refused screen change restores the previous full hash', () => {
  const shell = readFileSync(new URL('../web/src/app/components/shell.tsx', import.meta.url), 'utf8');
  const read = shell.slice(shell.indexOf('const read = () =>'), shell.indexOf("window.addEventListener('hashchange', read)"));
  assert.match(read, /parseHash\(location\.hash\)/);
  assert.match(read, /change === 'screen' && !canLeave\(\)\) \{ history\.replaceState\(history\.state, '', withHash\(formatHash\(current\.current\)\)\); return; \}/);
  const navigate = shell.slice(shell.indexOf('const navigate = useCallback'), shell.indexOf('const takeArrivalFocus'));
  assert.match(navigate, /change === 'screen' && !canLeave\(\)/, 'navigate asks the guard once, for screen changes only');
  assert.match(navigate, /if \(change === 'screen'\) arrival\.current\.set\(options\?\.focus\)/, 'A11 intent is kept for screen arrivals');
  assert.doesNotMatch(shell, /location\.hash\.slice\(1\) as Screen/, 'no direct Screen cast of the hash');
});

test('R2 §K4: header back link targets the explicit parent, independent of history', () => {
  for (const screen of SCREENS) {
    const target = headerBackTarget(screen);
    if (parentScreen(screen) === screen) assert.equal(target, null, screen);
    else assert.deepEqual(target, { screen: parentScreen(screen), detail: null }, screen);
  }
  assert.deepEqual(headerBackTarget('imports'), { screen: 'store', detail: null });
  assert.deepEqual(headerBackTarget('rules'), { screen: 'store', detail: null });
  assert.deepEqual(headerBackTarget('line'), { screen: 'store', detail: null });
});

test('R2 D-R2-12: the header link hides only while an order detail is rendered', () => {
  assert.deepEqual(headerBackTarget('orders', { detailShown: false }), { screen: 'finance', detail: null });
  assert.equal(headerBackTarget('orders', { detailShown: true }), null);
  assert.deepEqual(headerBackTarget('reconciliation', { detailShown: true }), { screen: 'finance', detail: null });
  assert.equal(headerBackTarget('imports', { detailShown: true }), null);
  assert.deepEqual(headerBackTarget('imports', { detailShown: false }), { screen: 'store', detail: null });
});

test('R2 D-R2-13: simulation returns to its product when known, else to the products list', () => {
  assert.deepEqual(headerBackTarget('simulation', { simulationSku: 'ABC/1' }), { screen: 'products', detail: 'ABC/1' });
  assert.deepEqual(headerBackTarget('simulation', { simulationSku: '' }), { screen: 'products', detail: null });
  assert.deepEqual(headerBackTarget('simulation'), { screen: 'products', detail: null });
  assert.deepEqual(headerBackTarget('playground', { simulationSku: 'ABC' }), { screen: 'products', detail: null });
});
