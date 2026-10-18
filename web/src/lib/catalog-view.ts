import type { CatalogProduct } from './types';

export type PriceFilter = 'all' | 'listed' | 'unlisted';
export type SortColumn = 'name' | 'price' | 'cost' | 'qty' | 'profit' | 'date';
export type ProductSort = `${SortColumn}${'Asc' | 'Desc'}`;
export const hasListedPrice = (product: CatalogProduct) => product.sellingPriceSatang != null;
export const hasProductCost = (product: CatalogProduct) => product.cost?.unitCostSatang != null;

// Sort recorded fields only. Unknown values remain unknown and sort last in
// either direction; a confirmed zero is a real value, including a free item.
export function selectCatalog(products: CatalogProduct[], query: string, price: PriceFilter, missingCost: boolean, sort: ProductSort, locale = 'th') {
  const term = query.trim().toLocaleLowerCase();
  const column = sort.replace(/Asc$|Desc$/, '') as SortColumn;
  const ascending = sort.endsWith('Asc');
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const value = (product: CatalogProduct) => ({
    name: product.name, price: product.sellingPriceSatang, cost: product.cost?.unitCostSatang,
    qty: product.quantity, profit: product.profitSatang, date: product.dateAdded || null,
  })[column];
  return products.filter(product => (!term || `${product.name} ${product.sku}`.toLocaleLowerCase().includes(term)) &&
    (price === 'all' || (price === 'listed' ? hasListedPrice(product) : !hasListedPrice(product))) &&
    (!missingCost || !hasProductCost(product)))
    .sort((a, b) => {
      const av = value(a), bv = value(b);
      if (av == null) return bv == null ? 0 : 1;
      if (bv == null) return -1;
      const difference = typeof av === 'number' && typeof bv === 'number' ? av - bv : collator.compare(String(av), String(bv));
      return ascending ? difference : -difference;
    });
}

export function searchParts(text: string, query: string) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const normalized = text.toLocaleLowerCase();
  let cursor = 0;
  let index = normalized.indexOf(term);
  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), match: false });
    parts.push({ text: text.slice(index, index + term.length), match: true });
    cursor = index + term.length;
    index = normalized.indexOf(term, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}
