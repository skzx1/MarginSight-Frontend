// Hash routes with an optional detail id (P4-G3, D5): #<screen> and, for detail screens, #<screen>/<encoded id>.
// Pure parse/format so tests can pin the URL contract. Plain #<screen> hashes keep working unchanged; no new Screen values.
import { SCREENS } from './navigation.ts';
import type { Screen } from './types';

/** Screens whose detail view has a URL: #products/<sku> and #orders/<order key>. */
export const DETAIL_SCREENS: readonly Screen[] = ['products', 'orders'];

/** `detail` is the decoded id (a product SKU or an order key), or null for the screen itself. */
export type Route = { screen: Screen; detail: string | null };

const isScreen = (value: string): value is Screen => (SCREENS as readonly string[]).includes(value);
const decode = (value: string) => { try { return decodeURIComponent(value); } catch { return value; } };

/**
 * location.hash → route. Unknown or empty screen → overview. A sub-path on a screen without details is ignored.
 * The id is everything after the first "/" (trailing slashes dropped), percent-decoded; an empty or blank id means no detail.
 * Malformed percent-encoding is kept verbatim, so the screen reports it as "not found" like any other unknown id.
 */
export function parseHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const slash = raw.indexOf('/');
  const head = slash < 0 ? raw : raw.slice(0, slash);
  if (!isScreen(head)) return { screen: 'overview', detail: null };
  if (slash < 0 || !DETAIL_SCREENS.includes(head)) return { screen: head, detail: null };
  const detail = decode(raw.slice(slash + 1).replace(/\/+$/, ''));
  return { screen: head, detail: detail.trim() ? detail : null };
}

/** Route → hash ("#products/ABC%2F1"). The id is percent-encoded, so "/", "#", "%", spaces and Thai survive a round trip. */
export function formatHash(route: { screen: Screen; detail?: string | null }): string {
  const detail = route.detail && route.detail.trim() && DETAIL_SCREENS.includes(route.screen) ? route.detail : null;
  return '#' + route.screen + (detail ? '/' + encodeURIComponent(detail) : '');
}

export const sameRoute = (a: Route, b: Route) => a.screen === b.screen && a.detail === b.detail;

/**
 * What a route change means for the shell: 'none' (e.g. the hashchange our own navigate() caused), 'detail'
 * (list ↔ detail on the same screen: no leave guard, no h1 focus; the screen manages focus) or 'screen'
 * (ask canLeave() once; on refusal restore the previous full hash; the arrival focuses the h1 or its intent).
 */
export function routeChange(from: Route, to: Route): 'none' | 'detail' | 'screen' {
  return sameRoute(from, to) ? 'none' : from.screen === to.screen ? 'detail' : 'screen';
}

/** Id of a detail view's heading (product name, order id): focused when the detail opens, and on arrival at a detail route. */
export const DETAIL_TITLE_ID = 'detail-title';
