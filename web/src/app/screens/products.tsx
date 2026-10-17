'use client';
import { useId, useState } from 'react';
import { request } from '../../lib/auth';
import { useAction } from '../../lib/use-resource';
import { bangkokDate, dateAt, money, parseBaht } from '../../lib/format';
import type { CatalogProduct, FeatureProps, Scenario } from '../../lib/types';
import { useLanguage } from '../language';
import { Empty, ErrorNotice, Field, ProductSelect, Select, Submit } from '../components/forms';
import { EvidencePanel, Money } from '../components/ledger';
import { Icon } from '../ui';
import { enrichProducts } from '../../lib/mock-data';

type SortOption =
  | 'dateDesc'
  | 'dateAsc'
  | 'priceAsc'
  | 'priceDesc'
  | 'qtyDesc'
  | 'qtyAsc'
  | 'profitDesc'
  | 'profitAsc';

type CatalogProps = {
  products: CatalogProduct[];
  more?: string;
  loadMore: () => void;
  refresh: (targetSku?: string) => Promise<void>;
  ask: (sku: string) => void;
  simulate: (sku: string) => void;
  onAddProduct?: () => void;
  initialMissingCostsOnly?: boolean;
};

export default function Products({
  base,
  origin,
  products: rawProducts,
  more,
  loadMore,
  refresh,
  ask,
  simulate,
  onAddProduct,
  initialMissingCostsOnly = false
}: FeatureProps & CatalogProps) {
  const { t, locale } = useLanguage();
  const searchId = useId();
  const sortId = useId();
  const filterId = useId();

  const [search, setSearch] = useState('');
  const [missingCostsOnly, setMissingCostsOnly] = useState(initialMissingCostsOnly);
  const [priceFilter, setPriceFilter] = useState<'all' | 'listed' | 'unlisted'>('all');
  const [sort, setSort] = useState<SortOption>('dateDesc');
  const [selectedSku, setSelectedSku] = useState('');

  // Cost modal/form state
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [cost, setCost] = useState('');
  const [effective, setEffective] = useState(bangkokDate());
  const [source, setSource] = useState('');
  const action = useAction();

  // Ensure products have all required fields
  const products = enrichProducts(rawProducts);
  const product = products.find(p => p.sku === selectedSku);

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch =
      !search.trim() ||
      (p.name + ' ' + p.sku).toLowerCase().includes(search.toLowerCase().trim());

    const hasPrice = p.sellingPriceSatang != null && p.sellingPriceSatang > 0;
    const matchesPriceFilter =
      priceFilter === 'all' ||
      (priceFilter === 'listed' ? hasPrice : !hasPrice);

    return matchesSearch && matchesPriceFilter && (!missingCostsOnly || p.cost?.unitCostSatang == null);
  });

  // Sort products (one active at a time)
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'priceAsc': {
        const pa = a.sellingPriceSatang ?? Infinity;
        const pb = b.sellingPriceSatang ?? Infinity;
        return pa - pb;
      }
      case 'priceDesc': {
        const pa = a.sellingPriceSatang ?? -Infinity;
        const pb = b.sellingPriceSatang ?? -Infinity;
        return pb - pa;
      }
      case 'dateDesc': {
        return (b.dateAdded || '').localeCompare(a.dateAdded || '');
      }
      case 'dateAsc': {
        return (a.dateAdded || '').localeCompare(b.dateAdded || '');
      }
      case 'qtyDesc': {
        return (b.quantity ?? 0) - (a.quantity ?? 0);
      }
      case 'qtyAsc': {
        return (a.quantity ?? 0) - (b.quantity ?? 0);
      }
      case 'profitDesc': {
        const pfa = a.profitSatang ?? -Infinity;
        const pfb = b.profitSatang ?? -Infinity;
        return pfb - pfa;
      }
      case 'profitAsc': {
        const pfa = a.profitSatang ?? Infinity;
        const pfb = b.profitSatang ?? Infinity;
        return pfa - pfb;
      }
      default:
        return 0;
    }
  });

  const clearAllFilters = () => {
    setMissingCostsOnly(false);
    setSearch('');
    setPriceFilter('all');
  };

  const hasActiveFilters = search.trim().length > 0 || priceFilter !== 'all';

  // Toggle sort from table headers
  const toggleSort = (column: 'price' | 'date' | 'qty' | 'profit') => {
    if (column === 'price') {
      setSort(s => (s === 'priceAsc' ? 'priceDesc' : 'priceAsc'));
    } else if (column === 'date') {
      setSort(s => (s === 'dateDesc' ? 'dateAsc' : 'dateDesc'));
    } else if (column === 'qty') {
      setSort(s => (s === 'qtyDesc' ? 'qtyAsc' : 'qtyDesc'));
    } else if (column === 'profit') {
      setSort(s => (s === 'profitDesc' ? 'profitAsc' : 'profitDesc'));
    }
  };

  if (costFormOpen && product) {
    return (
      <div className="product-cost-view">
        <button
          className="ghost back-link"
          onClick={() => {
            setCostFormOpen(false);
            action.clearError();
          }}
        >
          ← {t('back')}
        </button>
        <h2>{t('addCost')}</h2>
        <form
          className="panel narrow"
          onSubmit={e => {
            e.preventDefault();
            void action.run(async () => {
              await request(base + '/products/' + encodeURIComponent(product.sku) + '/cost-versions', {
                sku: product.sku,
                unitCostSatang: parseBaht(cost),
                effectiveFrom: dateAt(effective),
                sourceRef: source.trim(),
                dataOrigin: origin,
                method: 'MERCHANT_CONFIRMED_UNIT_COST'
              });
              await refresh(product.sku);
              setCostFormOpen(false);
            });
          }}
        >
          <fieldset disabled={action.busy}>
            <p className="product-badge-info">
              <strong>{product.name}</strong> · {product.sku} ({product.unit})
            </p>
            <p className="caption">{t('costNote')}</p>
            <Field
              label={t('unitCost')}
              value={cost}
              onChange={e => setCost(e.target.value)}
              inputMode="decimal"
              required
            />
            <Field
              label={t('effective')}
              type="date"
              value={effective}
              onChange={e => setEffective(e.target.value)}
              required
            />
            <Field
              label={t('source')}
              value={source}
              onChange={e => setSource(e.target.value)}
              required
            />
            <ErrorNotice error={action.error} />
            <Submit busy={action.busy}>{t('save')}</Submit>
          </fieldset>
        </form>
      </div>
    );
  }

  if (product) {
    return (
      <div className="product-detail-view">
        <button className="ghost back-link" onClick={() => setSelectedSku('')}>
          ← {t('products')}
        </button>
        <section className="panel">
          <div className="product-detail-header">
            <div>
              <span className="eyebrow">{product.sku}</span>
              <h2>{product.name}</h2>
              <p className="caption">{t('unit')}: {product.unit} · {t('dateAdded')}: {product.dateAdded}</p>
            </div>
            <div>
              {product.sellingPriceSatang != null ? (
                <span className="product-price-highlight">
                  <Money value={product.sellingPriceSatang} />
                </span>
              ) : (
                <span className="badge warn">{t('priceNotListed')}</span>
              )}
            </div>
          </div>

          <dl className="ledger-lines">
            <div>
              <dt>{t('sellingPrice')}</dt>
              <dd>
                {product.sellingPriceSatang != null ? (
                  <Money value={product.sellingPriceSatang} />
                ) : (
                  <span className="badge warn">{t('priceNotListed')}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('costPrice')}</dt>
              <dd>
                {product.cost ? (
                  <Money value={product.cost.unitCostSatang} />
                ) : (
                  <span className="badge warn">{t('missingCost')}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('stockQty')}</dt>
              <dd>{product.quantity ?? 0} {product.unit}</dd>
            </div>
            <div>
              <dt>{t('unitProfit')}</dt>
              <dd className={(product.profitSatang ?? 0) >= 0 ? 'positive' : 'negative'}>
                {product.profitSatang != null ? (
                  <Money value={product.profitSatang} />
                ) : (
                  '—'
                )}
              </dd>
            </div>
            {product.cost && (
              <>
                <div>
                  <dt>{t('effective')}</dt>
                  <dd>{bangkokDate(product.cost.effectiveFrom)}</dd>
                </div>
                <div>
                  <dt>{t('version')}</dt>
                  <dd>{product.cost.version}</dd>
                </div>
                <div>
                  <dt>{t('source')}</dt>
                  <dd className="wrap">{product.cost.sourceRef}</dd>
                </div>
              </>
            )}
          </dl>

          <div className="actions">
            <button
              onClick={() => {
                setCost(product.cost ? String(product.cost.unitCostSatang / 100) : '');
                setSource(product.cost ? product.cost.sourceRef : '');
                setCostFormOpen(true);
              }}
            >
              {t('addCost')}
            </button>
            <button className="secondary" onClick={() => simulate(product.sku)}>
              {t('simulation')}
            </button>
            <button className="secondary" onClick={() => ask(product.sku)}>
              {t('askProduct')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="products-screen-content">
      {missingCostsOnly && <div className="active-filter-chips"><span className="filter-chip">{t('missingCost')}<button type="button" onClick={() => setMissingCostsOnly(false)} aria-label={t('clearFilters')}>✕</button></span></div>}
      {/* Top Action Header */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">{products.length} {t('loaded')}</span>
          <h2>{t('products')}</h2>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={() => {
            if (onAddProduct) onAddProduct();
            else location.hash = 'addProduct';
          }}
        >
          <Icon name="plus" />
          <span>+ {t('addProduct')}</span>
        </button>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="products-controls-bar">
        <div className="search-field-wrapper">
          <label htmlFor={searchId} className="sr-only">
            {t('search')}
          </label>
          <div className="search-input-group">
            <Icon name="search" />
            <input
              id={searchId}
              type="search"
              placeholder={t('search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label={t('close')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-sort-group">
          <label htmlFor={filterId} className="sr-only">
            {t('priceStatus')}
          </label>
          <select
            id={filterId}
            value={priceFilter}
            onChange={e => setPriceFilter(e.target.value as 'all' | 'listed' | 'unlisted')}
            className="filter-select"
          >
            <option value="all">{t('priceStatus')}: {t('all')}</option>
            <option value="listed">{t('priceStatus')}: {t('priceListed')}</option>
            <option value="unlisted">{t('priceStatus')}: {t('priceNotListed')}</option>
          </select>

          <label htmlFor={sortId} className="sr-only">
            {t('sortBy')}
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="dateDesc">{t('sortDateDesc')}</option>
            <option value="dateAsc">{t('sortDateAsc')}</option>
            <option value="priceAsc">{t('sortPriceAsc')}</option>
            <option value="priceDesc">{t('sortPriceDesc')}</option>
            <option value="profitDesc">{t('sortProfitDesc')}</option>
            <option value="profitAsc">{t('sortProfitAsc')}</option>
            <option value="qtyDesc">{t('sortQtyDesc')}</option>
            <option value="qtyAsc">{t('sortQtyAsc')}</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="active-filter-chips" role="region" aria-label="ตัวกรองที่เลือก">
          {search.trim() && (
            <span className="filter-chip">
              <span>{t('search')}: &quot;{search}&quot;</span>
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={`ล้างการค้นหา ${search}`}
              >
                ✕
              </button>
            </span>
          )}

          {priceFilter !== 'all' && (
            <span className="filter-chip">
              <span>
                {t('priceStatus')}: {priceFilter === 'listed' ? t('priceListed') : t('priceNotListed')}
              </span>
              <button
                type="button"
                onClick={() => setPriceFilter('all')}
                aria-label="ล้างตัวกรองสถานะราคา"
              >
                ✕
              </button>
            </span>
          )}

          <button
            type="button"
            className="ghost clear-all-btn"
            onClick={clearAllFilters}
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* Empty States */}
      {products.length === 0 ? (
        <Empty
          title={t('noProductsYet')}
          action={
            <button
              onClick={() => {
                if (onAddProduct) onAddProduct();
                else location.hash = 'addProduct';
              }}
            >
              + {t('addProduct')}
            </button>
          }
        />
      ) : sorted.length === 0 ? (
        <Empty
          title={t('noSearchResults')}
          action={
            <button className="secondary" onClick={clearAllFilters}>
              {t('clearFilters')}
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="products-table-container">
            <table className="products-table" aria-label={t('products')}>
              <thead>
                <tr>
                  <th scope="col" className="col-name">{t('productName')}</th>
                  <th
                    scope="col"
                    className="col-sortable col-price"
                    onClick={() => toggleSort('price')}
                  >
                    <span>{t('sellingPrice')}</span>
                    <span className="sort-indicator" aria-hidden="true">
                      {sort === 'priceAsc' ? '▲' : sort === 'priceDesc' ? '▼' : '⇅'}
                    </span>
                  </th>
                  <th scope="col" className="col-cost">{t('costPrice')}</th>
                  <th
                    scope="col"
                    className="col-sortable col-qty"
                    onClick={() => toggleSort('qty')}
                  >
                    <span>{t('stockQty')}</span>
                    <span className="sort-indicator" aria-hidden="true">
                      {sort === 'qtyAsc' ? '▲' : sort === 'qtyDesc' ? '▼' : '⇅'}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="col-sortable col-profit"
                    onClick={() => toggleSort('profit')}
                  >
                    <span>{t('unitProfit')}</span>
                    <span className="sort-indicator" aria-hidden="true">
                      {sort === 'profitAsc' ? '▲' : sort === 'profitDesc' ? '▼' : '⇅'}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="col-sortable col-date"
                    onClick={() => toggleSort('date')}
                  >
                    <span>{t('dateAdded')}</span>
                    <span className="sort-indicator" aria-hidden="true">
                      {sort === 'dateAsc' ? '▲' : sort === 'dateDesc' ? '▼' : '⇅'}
                    </span>
                  </th>
                  <th scope="col" className="col-action"><span className="sr-only">{t('details')}</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => (
                  <tr
                    key={p.sku}
                    className="product-table-row"
                    onClick={() => setSelectedSku(p.sku)}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setSelectedSku(p.sku);
                    }}
                  >
                    <td className="col-name">
                      <strong>{p.name}</strong>
                      <small className="sku-sub">{p.sku} · {p.unit}</small>
                    </td>
                    <td className="col-price">
                      {p.sellingPriceSatang != null ? (
                        <Money value={p.sellingPriceSatang} />
                      ) : (
                        <span className="badge warn calm-warning">
                          {t('priceNotListed')}
                        </span>
                      )}
                    </td>
                    <td className="col-cost">
                      {p.cost?.unitCostSatang != null ? (
                        <Money value={p.cost.unitCostSatang} />
                      ) : (
                        <span className="badge warn">{t('missingCost')}</span>
                      )}
                    </td>
                    <td className="col-qty">
                      <span className="tabular-num">{p.quantity ?? 0}</span> {p.unit}
                    </td>
                    <td className="col-profit">
                      {p.profitSatang != null ? (
                        <span className={(p.profitSatang >= 0 ? 'positive' : 'negative') + ' tabular-num'}>
                          <Money value={p.profitSatang} />
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="col-date">
                      <time dateTime={p.dateAdded}>{p.dateAdded}</time>
                    </td>
                    <td className="col-action" aria-hidden="true">
                      <span className="row-arrow">→</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="products-mobile-cards">
            {sorted.map(p => (
              <article
                key={p.sku}
                className="product-card"
                onClick={() => setSelectedSku(p.sku)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter') setSelectedSku(p.sku);
                }}
              >
                <div className="product-card-top">
                  <div>
                    <h3 className="product-card-title">{p.name}</h3>
                    <p className="caption">{p.sku} · {p.unit}</p>
                  </div>
                  <div>
                    {p.sellingPriceSatang != null ? (
                      <strong className="product-card-price">
                        <Money value={p.sellingPriceSatang} />
                      </strong>
                    ) : (
                      <span className="badge warn calm-warning">
                        {t('priceNotListed')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="product-card-metrics">
                  <div className="card-metric">
                    <span className="metric-label">{t('costPrice')}</span>
                    <span className="metric-val">
                      {p.cost ? <Money value={p.cost.unitCostSatang} /> : '—'}
                    </span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">{t('stockQty')}</span>
                    <span className="metric-val tabular-num">{p.quantity ?? 0}</span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">{t('unitProfit')}</span>
                    <span className={'metric-val ' + ((p.profitSatang ?? 0) >= 0 ? 'positive' : 'negative')}>
                      {p.profitSatang != null ? <Money value={p.profitSatang} /> : '—'}
                    </span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">{t('dateAdded')}</span>
                    <span className="metric-val caption">{p.dateAdded}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {more && (
        <div className="load-more-row">
          <button className="secondary" onClick={loadMore}>
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Simulation({
  base,
  month,
  products,
  initialSku
}: FeatureProps & { products: CatalogProduct[]; initialSku: string }) {
  const { t } = useLanguage();
  const [sku, setSku] = useState(initialSku || products[0]?.sku || '');
  const [mode, setMode] = useState('discount');
  const [discount, setDiscount] = useState('15');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState<Scenario>();
  const action = useAction();

  return (
    <>
      <p className="screen-note">{t('scenarioNote')}</p>
      <form
        className="panel narrow"
        onSubmit={e => {
          e.preventDefault();
          setResult(undefined);
          void action.run(async () => {
            setResult(
              await request<Scenario>(base + '/simulations?month=' + month, {
                sku,
                ...(mode === 'price'
                  ? { priceSatang: parseBaht(price) }
                  : { discountPct: Number(discount) })
              })
            );
          });
        }}
      >
        <fieldset disabled={action.busy}>
          <ProductSelect
            products={products}
            value={sku}
            onChange={value => {
              setSku(value);
              setResult(undefined);
            }}
          />
          <div className="segmented" role="group" aria-label={t('simulation')}>
            {['discount', 'price'].map(value => (
              <button
                type="button"
                className="secondary"
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setResult(undefined);
                }}
              >
                {t(value as 'discount' | 'price')}
              </button>
            ))}
          </div>
          {mode === 'price' ? (
            <Field
              label={t('price')}
              value={price}
              onChange={e => {
                setPrice(e.target.value);
                setResult(undefined);
              }}
              required
              inputMode="decimal"
            />
          ) : (
            <Field
              label={t('discount')}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discount}
              onChange={e => {
                setDiscount(e.target.value);
                setResult(undefined);
              }}
              required
            />
          )}
          <ErrorNotice error={action.error} />
          <Submit busy={action.busy} disabled={!sku}>
            {t('calculate')}
          </Submit>
        </fieldset>
      </form>

      {result && (
        <section aria-live="polite">
          <h2>{t('result')}</h2>
          {result.baseline && (
            <div className="comparison">
              <div>
                {t('before')}
                <strong><Money value={result.baseline.profitSatang} /></strong>
              </div>
              <div>
                {t('after')}
                <strong><Money value={result.scenario.profitSatang} /></strong>
              </div>
            </div>
          )}
          <EvidencePanel result={result.scenario} />
          <p>
            {t('breakEven')}: <Money value={result.breakEven.priceSatang} />
          </p>
          <p className="caption">{t('breakEvenNote')}</p>
        </section>
      )}
    </>
  );
}
