'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CatalogProduct } from '../../lib/types';
import { recordedProducts } from '../../lib/catalog-actions';
import { hasListedPrice, hasProductCost, searchParts, selectCatalog, type PriceFilter, type ProductSort, type SortColumn } from '../../lib/catalog-view';
import { useLanguage } from '../language';
import { Icon } from '../ui';
import { Money } from './ledger';
import { catalogCopy } from './product-catalog-copy';
import s from './product-catalog.module.css';

export function useProductCatalog(raw: CatalogProduct[], initialMissingCost: boolean, locale: string) {
  const [search, updateSearch] = useState('');
  const [query, setQuery] = useState('');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [missingCost, setMissingCost] = useState(initialMissingCost);
  const [sort, setSort] = useState<ProductSort>('dateDesc');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 140);
    return () => clearTimeout(timer);
  }, [search]);
  const setSearch = (value: string) => { updateSearch(value); if (!value.trim()) setQuery(''); };
  const clear = () => { setSearch(''); setPrice('all'); setMissingCost(false); };
  const products = useMemo(() => recordedProducts(raw), [raw]);
  const visible = useMemo(() => selectCatalog(products, query, price, missingCost, sort, locale), [products, query, price, missingCost, sort, locale]);
  const toggleSort = (column: SortColumn) => {
    const first = (['date', 'qty', 'profit'].includes(column) ? 'Desc' : 'Asc');
    const option = `${column}${first}` as ProductSort;
    setSort(current => current === option ? `${column}${first === 'Asc' ? 'Desc' : 'Asc'}` : option);
  };
  return { search, query, setSearch, price, setPrice, missingCost, setMissingCost, sort, setSort, clear, products, visible, toggleSort };
}

function ControlIcon({ name }: { name: 'filter' | 'sort' | 'down' }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'filter' ? <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="var(--surface)" /><circle cx="15" cy="17" r="2" fill="var(--surface)" /></> : name === 'sort' ? <><path d="M8 4v16m-4-4 4 4 4-4M15 5h5m-5 6h4m-4 6h2" /></> : <path d="m7 10 5 5 5-5" />}</svg>;
}

function Match({ text, query }: { text: string; query: string }) {
  return <>{searchParts(text, query).map((part, index) => part.match ? <mark className={s.match} key={index}>{part.text}</mark> : part.text)}</>;
}

export default function ProductCatalog({ controls: v, loading = false, more, loadMore, onAdd, onSelect }: {
  controls: ReturnType<typeof useProductCatalog>; loading?: boolean; more?: string;
  loadMore: () => void; onAdd: () => void; onSelect: (sku: string) => void;
}) {
  const { t, locale } = useLanguage();
  const c = catalogCopy[locale];
  const searchId = useId(), dialogId = useId(), priceId = useId(), sortId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLButtonElement>(null), sortRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [panel, setPanel] = useState<'filter' | 'sort' | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const initialLoading = loading && v.products.length === 0;
  const activeCount = Number(v.price !== 'all') + Number(v.missingCost);
  const hasFilters = !!v.search.trim() || activeCount > 0;
  const counts = { total: v.products.length, price: v.products.filter(product => !hasListedPrice(product)).length, cost: v.products.filter(product => !hasProductCost(product)).length };
  const number = (value: number) => new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-GB').format(value);
  const sortOptions: { value: ProductSort; label: string }[] = [
    { value: 'dateDesc', label: t('sortDateDesc') }, { value: 'dateAsc', label: t('sortDateAsc') },
    { value: 'nameAsc', label: c.nameAsc }, { value: 'nameDesc', label: c.nameDesc },
    { value: 'priceAsc', label: t('sortPriceAsc') }, { value: 'priceDesc', label: t('sortPriceDesc') },
    { value: 'costAsc', label: c.costAsc }, { value: 'costDesc', label: c.costDesc },
    { value: 'qtyDesc', label: t('sortQtyDesc') }, { value: 'qtyAsc', label: t('sortQtyAsc') },
    { value: 'profitDesc', label: t('sortProfitDesc') }, { value: 'profitAsc', label: t('sortProfitAsc') },
  ];
  useEffect(() => {
    if (!panel || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const trigger = panel === 'filter' ? filterRef.current : sortRef.current;
    returnFocus.current = trigger;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    const position = () => {
      if (!trigger) return;
      const anchor = trigger.getBoundingClientRect();
      const desktop = matchMedia('(min-width:768px)').matches;
      const below = innerHeight - anchor.bottom - 24;
      if (desktop) dialog.style.maxHeight = `${Math.min(600, Math.max(240, below >= 240 ? below : anchor.top - 24))}px`;
      else dialog.style.removeProperty('max-height');
      const box = dialog.getBoundingClientRect();
      dialog.style.setProperty('--panel-left', `${Math.max(16, Math.min(anchor.right - box.width, innerWidth - box.width - 16))}px`);
      dialog.style.setProperty('--panel-top', `${Math.max(16, below >= 240 ? anchor.bottom + 8 : anchor.top - box.height - 8)}px`);
    };
    position(); window.addEventListener('resize', position);
    return () => { window.removeEventListener('resize', position); document.body.style.overflow = overflow; if (dialog.open) dialog.close(); };
  }, [panel]);
  const close = () => dialogRef.current?.close();
  const clearSearch = () => { v.setSearch(''); searchRef.current?.focus(); };
  const priceLabel = v.price === 'listed' ? t('priceListed') : t('priceNotListed');
  const profit = (product: CatalogProduct) => product.profitSatang == null ? <span className={s.unknown} aria-label={c.unknown}>—</span> : <span className={`${s.profit} ${product.profitSatang < 0 ? s.loss : ''}`}><Money value={product.profitSatang} /></span>;
  const price = (product: CatalogProduct) => hasListedPrice(product) ? <Money value={product.sellingPriceSatang} /> : <span className={s.warning}>{t('priceNotListed')}</span>;
  const cost = (product: CatalogProduct) => hasProductCost(product) ? <Money value={product.cost!.unitCostSatang} /> : <span className={s.warning}>{c.missingCost}</span>;
  const identity = (product: CatalogProduct) => <div className={s.identity}><span className={s.thumbnail} aria-hidden="true">{Array.from(product.name.trim())[0]?.toLocaleUpperCase() || 'M'}</span><div><strong><Match text={product.name} query={v.query} /></strong><small><Match text={product.sku} query={v.query} /><span> · {product.unit}</span></small><small className={s.inlineDate}>{t('dateAdded')}: {product.dateAdded || '—'}</small></div></div>;
  const columnHeader = (column: SortColumn, label: string, numeric = false, className = '') => <th scope="col" className={`${numeric ? s.numeric : ''} ${className}`} aria-sort={v.sort.startsWith(column) ? (v.sort.endsWith('Asc') ? 'ascending' : 'descending') : 'none'}><button type="button" className={s.sortHeader} onClick={() => v.toggleSort(column)}>{label}<span className={v.sort.startsWith(column) ? s.sorted : s.sortHint}><ControlIcon name="down" /></span></button></th>;

  return <div className={s.catalog}>
    <div className={s.heading}><p>{c.intro}</p><button type="button" onClick={onAdd}><Icon name="plus" />{t('addProduct')}</button></div>
    <div className={s.summary} aria-label={c.loadedScope} aria-busy={initialLoading}>
      <div className={s.summaryTotal}><strong>{initialLoading ? '—' : number(counts.total)}</strong><span>{c.loaded}</span></div>
      <button type="button" className={s.summaryAction} aria-pressed={v.price === 'unlisted'} disabled={initialLoading || (counts.price === 0 && v.price !== 'unlisted')} onClick={() => v.setPrice(v.price === 'unlisted' ? 'all' : 'unlisted')}><strong>{initialLoading ? '—' : number(counts.price)}</strong><span>{c.missingPrice}<Icon name="chevronRight" /></span></button>
      <button type="button" className={s.summaryAction} aria-pressed={v.missingCost} disabled={initialLoading || (counts.cost === 0 && !v.missingCost)} onClick={() => v.setMissingCost(!v.missingCost)}><strong>{initialLoading ? '—' : number(counts.cost)}</strong><span>{c.missingCost}<Icon name="chevronRight" /></span></button>
    </div>
    <div className={s.toolbar} role="search" aria-label={t('products')}>
      <div className={s.searchBox}><label className="sr-only" htmlFor={searchId}>{c.placeholder}</label><Icon name="search" /><input ref={searchRef} id={searchId} type="search" placeholder={c.placeholder} value={v.search} onChange={event => v.setSearch(event.target.value)} disabled={initialLoading} autoComplete="off" />{v.search && <button type="button" onClick={clearSearch} className={s.iconButton} aria-label={c.clearSearch}><Icon name="close" /></button>}</div>
      <div className={s.controlRow}><button ref={filterRef} type="button" className={s.control} disabled={initialLoading} aria-haspopup="dialog" aria-expanded={panel === 'filter'} aria-controls={dialogId} data-active={activeCount > 0} onClick={() => setPanel('filter')}><ControlIcon name="filter" /><span>{c.filter}</span>{activeCount > 0 && <span className={s.countBadge}>{activeCount}</span>}</button><button ref={sortRef} type="button" className={s.control} disabled={initialLoading} aria-haspopup="dialog" aria-expanded={panel === 'sort'} aria-controls={dialogId} onClick={() => setPanel('sort')}><ControlIcon name="sort" /><span>{c.sort}</span><ControlIcon name="down" /></button></div>
    </div>
    {hasFilters && <div className={s.chips} role="group" aria-label={c.active}>{[
      ...(v.search.trim() ? [{ label: `${c.searchChip}: ${v.search.trim()}`, clear: clearSearch }] : []),
      ...(v.price !== 'all' ? [{ label: priceLabel, clear: () => v.setPrice('all') }] : []),
      ...(v.missingCost ? [{ label: c.missingCost, clear: () => v.setMissingCost(false) }] : []),
    ].map(chip => <span className={s.chip} key={chip.label}><span>{chip.label}</span><button type="button" onClick={chip.clear} aria-label={`${c.remove}: ${chip.label}`}><Icon name="close" /></button></span>)}<button className={s.clearAll} type="button" onClick={v.clear}>{t('clearFilters')}</button></div>}
    <div className={s.resultInfo}><p role="status" aria-live="polite">{loading ? (initialLoading ? c.loading : c.updating) : <>{c.results} <strong>{number(v.visible.length)}</strong> {c.of} {number(counts.total)} {c.items}</>}</p><p>{c.sortPrefix} {sortOptions.find(option => option.value === v.sort)?.label}</p></div>
    {initialLoading ? <div className={s.skeleton} aria-hidden="true">{[0, 1, 2, 3].map(value => <div key={value}><span /><div><span /><span /></div><span /></div>)}</div> : v.visible.length === 0 ? <div className={s.empty}><span className={s.emptyIcon}><Icon name={v.products.length ? 'search' : 'products'} /></span><h2>{v.products.length ? c.emptyTitle : t('noProductsYet')}</h2><p>{v.products.length ? c.emptyBody : c.noProductsBody}</p>{v.products.length ? <div><button type="button" className="secondary" onClick={clearSearch} disabled={!v.search}>{c.clearSearch}</button>{activeCount > 0 && <button type="button" className={s.clearAll} onClick={v.clear}>{t('clearFilters')}</button>}</div> : <button type="button" onClick={onAdd}><Icon name="plus" />{t('addProduct')}</button>}</div> : <div className={s.list}>
      <div className={s.tableWrap}><table className={s.table} aria-label={t('products')}><thead><tr>{columnHeader('name', t('productName'))}{columnHeader('price', t('sellingPrice'), true)}{columnHeader('cost', t('costPrice'), true)}{columnHeader('qty', t('stockQty'), true)}{columnHeader('profit', t('unitProfit'), true)}{columnHeader('date', t('dateAdded'), false, s.dateColumn)}<th scope="col" className={s.actionColumn}><span className="sr-only">{t('details')}</span></th></tr></thead><tbody>{v.visible.map(product => <tr key={product.sku} onClick={() => onSelect(product.sku)}><td>{identity(product)}</td><td className={s.numeric}>{price(product)}</td><td className={s.numeric}>{cost(product)}</td><td className={`${s.numeric} ${s.quantity}`}>{product.quantity == null ? '—' : number(product.quantity)}</td><td className={s.numeric}>{profit(product)}</td><td className={s.dateColumn}>{product.dateAdded ? <time dateTime={product.dateAdded}>{product.dateAdded}</time> : '—'}</td><td className={s.actionColumn}><button type="button" className={s.openProduct} aria-label={`${c.details}: ${product.name}`} onClick={event => { event.stopPropagation(); onSelect(product.sku); }}><Icon name="chevronRight" /></button></td></tr>)}</tbody></table></div>
      <div className={s.cards}>{v.visible.map(product => <article className={s.card} key={product.sku}><button type="button" className={s.cardTitle} onClick={() => onSelect(product.sku)}>{identity(product)}<Icon name="chevronRight" /></button><dl className={s.metrics}><div><dt>{t('sellingPrice')}</dt><dd>{price(product)}</dd></div><div><dt>{t('costPrice')}</dt><dd>{cost(product)}</dd></div><div><dt>{t('stockQty')}</dt><dd className={s.quantity}>{product.quantity == null ? '—' : number(product.quantity)}<small> {product.unit}</small></dd></div><div><dt>{t('unitProfit')}</dt><dd>{profit(product)}</dd></div></dl><p className={s.cardDate}>{t('dateAdded')}: {product.dateAdded || '—'}</p></article>)}</div>
    </div>}
    <div className={s.listFooter}><p>{t('loadedOnly')}</p>{more && <button type="button" className="secondary" disabled={loading} onClick={loadMore}>{loading ? c.loading : t('next')}</button>}</div>
    <dialog ref={dialogRef} id={dialogId} className={s.dialog} aria-labelledby={`${dialogId}-title`} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')];
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClose={() => { setPanel(null); requestAnimationFrame(() => returnFocus.current?.focus()); }} onClick={event => { if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); }}>
      <div className={s.panelHeader}><h2 id={`${dialogId}-title`}>{panel === 'sort' ? c.sort : c.filter}</h2><button type="button" className={s.iconButton} aria-label={c.close} onClick={close}><Icon name="close" /></button></div>
      <div className={s.panelBody}>{panel === 'filter' ? <><fieldset><legend>{t('priceStatus')}</legend>{(['all', 'listed', 'unlisted'] as const).map(value => <label className={s.option} key={value}><input type="radio" name={priceId} checked={v.price === value} onChange={() => v.setPrice(value)} /><span>{value === 'all' ? t('all') : value === 'listed' ? t('priceListed') : t('priceNotListed')}</span>{v.price === value && <Icon name="check" />}</label>)}</fieldset><fieldset><legend>{c.costStatus}</legend><label className={s.option}><input type="checkbox" checked={v.missingCost} onChange={event => v.setMissingCost(event.target.checked)} /><span>{c.onlyMissingCost}</span></label></fieldset></> : <fieldset><legend className="sr-only">{t('sortBy')}</legend>{sortOptions.map(option => <label className={s.option} key={option.value}><input type="radio" name={sortId} checked={v.sort === option.value} onChange={() => v.setSort(option.value)} /><span>{option.label}</span>{v.sort === option.value && <Icon name="check" />}</label>)}</fieldset>}</div>
      <div className={s.panelFooter}>{panel === 'filter' && <button type="button" className={s.clearAll} disabled={!activeCount} onClick={() => { v.setPrice('all'); v.setMissingCost(false); }}>{t('clearFilters')}</button>}<button type="button" onClick={close}>{c.done}</button></div>
    </dialog>
  </div>;
}
