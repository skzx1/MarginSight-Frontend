import test from 'node:test';
import assert from 'node:assert/strict';
import { DETAIL_SCREENS, formatHash, parseHash, sameRoute } from '../web/src/lib/routes.ts';
import { SCREENS } from '../web/src/lib/navigation.ts';

const route = (screen, detail = null) => ({ screen, detail });

test('backward compatible: every existing #<screen> hash parses to that screen and formats back unchanged', () => {
  assert.equal(SCREENS.length, 14);
  for (const screen of SCREENS) {
    assert.deepEqual(parseHash('#' + screen), route(screen), screen);
    assert.equal(formatHash(route(screen)), '#' + screen, screen);
    assert.equal(formatHash({ screen }), '#' + screen, screen + ' without a detail field');
    assert.deepEqual(parseHash(screen), route(screen), screen + ' without the leading #');
  }
});

test('unknown, empty or differently-cased screens fall back to overview (R06)', () => {
  for (const hash of ['', '#', '#nope', '#Products', '#products ', '#/products', '#nope/ABC', '#%70roducts']) assert.deepEqual(parseHash(hash), route('overview'), JSON.stringify(hash));
});

test('only products and orders carry a detail id', () => {
  assert.deepEqual([...DETAIL_SCREENS], ['products', 'orders']);
  for (const screen of SCREENS.filter(s => !DETAIL_SCREENS.includes(s))) {
    assert.deepEqual(parseHash('#' + screen + '/x'), route(screen), screen + ': sub-path ignored');
    assert.equal(formatHash(route(screen, 'x')), '#' + screen, screen + ': detail not written');
  }
});

test('detail ids are percent-encoded and decoded', () => {
  assert.deepEqual(parseHash('#products/ABC%2F1'), route('products', 'ABC/1'));
  assert.equal(formatHash(route('products', 'ABC/1')), '#products/ABC%2F1');
  assert.equal(formatHash(route('products', 'A#B')), '#products/A%23B');
  assert.equal(formatHash(route('products', 'A B')), '#products/A%20B');
  assert.equal(formatHash(route('products', '100%')), '#products/100%25');
  assert.equal(formatHash(route('orders', 'shopee:2026-10-01/77')), '#orders/shopee%3A2026-10-01%2F77');
  assert.equal(formatHash(route('products', 'สบู่-01')), '#products/' + encodeURIComponent('สบู่-01'));
  assert.match(formatHash(route('products', 'สบู่-01')), /^#products\/[A-Za-z0-9%\-]+$/, 'Thai is ASCII-encoded in the hash');
});

test('round trip: formatHash then parseHash returns the same route', () => {
  const ids = ['ABC-1', 'ABC/1', 'A#B', 'A B', ' leading', 'trailing ', '100%', '%41', 'a?b=c&d', 'สบู่ใบเตย 250g', 'ชุด/ของขวัญ#2', 'emoji 🎁', "o'k (1)*~!", 'a//b', '/'];
  for (const screen of DETAIL_SCREENS) for (const id of ids) {
    const hash = formatHash(route(screen, id));
    assert.deepEqual(parseHash(hash), route(screen, id), screen + ' ' + JSON.stringify(id));
    assert.ok(sameRoute(parseHash(hash), route(screen, id)));
  }
});

test('hand-typed and browser-normalised forms', () => {
  assert.deepEqual(parseHash('#products/ABC-1'), route('products', 'ABC-1'));
  assert.deepEqual(parseHash('#products/สบู่-01'), route('products', 'สบู่-01'), 'an unencoded Thai SKU still works');
  assert.deepEqual(parseHash('#products/A/B'), route('products', 'A/B'), 'an unencoded slash stays part of the id');
  assert.deepEqual(parseHash('#products/A%20B'), route('products', 'A B'));
  assert.deepEqual(parseHash('#products/A#B'), route('products', 'A#B'), 'a second # is part of the id');
});

test('empty id and trailing slashes mean the list', () => {
  for (const hash of ['#products/', '#products//', '#products/%20', '#products/%20%20', '#orders/']) {
    const parsed = parseHash(hash);
    assert.equal(parsed.detail, null, hash);
    assert.equal(formatHash(parsed), '#' + parsed.screen, hash);
  }
  assert.deepEqual(parseHash('#products/ABC/'), route('products', 'ABC'));
  assert.deepEqual(parseHash('#orders/77//'), route('orders', '77'));
  assert.equal(formatHash(route('products', '')), '#products');
  assert.equal(formatHash(route('products', '  ')), '#products');
});

test('malformed percent-encoding is kept verbatim (the screen then shows the list + a not-found notice)', () => {
  assert.deepEqual(parseHash('#products/%E0%B8'), route('products', '%E0%B8'));
  assert.deepEqual(parseHash('#products/50%'), route('products', '50%'));
});

test('sameRoute compares screen and detail', () => {
  assert.ok(sameRoute(route('products'), route('products')));
  assert.ok(!sameRoute(route('products'), route('products', 'A')));
  assert.ok(!sameRoute(route('products', 'A'), route('products', 'B')));
  assert.ok(!sameRoute(route('orders', 'A'), route('products', 'A')));
});

test('routeChange: the leave guard applies to screen changes only; list <-> detail is a detail change', async () => {
  const { routeChange } = await import('../web/src/lib/routes.ts');
  assert.equal(routeChange(route('products'), route('products')), 'none');
  assert.equal(routeChange(route('products', 'A'), parseHash(formatHash(route('products', 'A')))), 'none', 'own navigate echo');
  assert.equal(routeChange(route('products'), route('products', 'A')), 'detail');
  assert.equal(routeChange(route('products', 'A'), route('products')), 'detail');
  assert.equal(routeChange(route('products', 'A'), route('products', 'B')), 'detail');
  assert.equal(routeChange(route('store'), route('overview')), 'screen');
  assert.equal(routeChange(route('store'), route('products', 'A')), 'screen');
  assert.equal(routeChange(route('orders', 'K'), route('finance')), 'screen');
});

test('detailMayTakeFocus: only from body, the h1, a detail heading or the opening row', async () => {
  const { detailMayTakeFocus } = await import('../web/src/lib/routes.ts');
  assert.equal(detailMayTakeFocus(null, 'A'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'BODY', dataset: {} }, 'A'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'H1', id: 'screen-title', dataset: {} }, 'A'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'H2', id: 'detail-title', dataset: {} }, 'A'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'BUTTON', id: '', dataset: { sku: 'A' } }, 'A'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'BUTTON', id: '', dataset: { orderKey: 'K/1' } }, 'K/1'), true);
  assert.equal(detailMayTakeFocus({ tagName: 'BUTTON', id: '', dataset: { sku: 'B' } }, 'A'), false, 'another row');
  assert.equal(detailMayTakeFocus({ tagName: 'INPUT', id: 'search', dataset: {} }, 'A'), false, 'the person is typing elsewhere');
});
