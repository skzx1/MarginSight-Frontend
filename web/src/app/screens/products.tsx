'use client';
import { useEffect, useRef, useState } from 'react';
import { request } from '../../lib/auth';
import { useAction } from '../../lib/use-resource';
import { bangkokDate, dateAt, parseBaht } from '../../lib/format';
import type { CatalogProduct, FeatureProps, Scenario } from '../../lib/types';
import { useLanguage } from '../language';
import { ErrorNotice, Field, ProductSelect, Select, Submit } from '../components/forms';
import { EvidencePanel, Money } from '../components/ledger';
import ProductCatalog, { focusProductRow, useProductCatalog } from '../components/product-catalog';
import { ProfitAmount } from '../components/profit-amount';
import {saveProductListing} from '../../lib/catalog-actions';
import { SCREEN_TITLE_ID } from '../../lib/navigation';
import { DETAIL_TITLE_ID, detailMayTakeFocus } from '../../lib/routes';
import { Icon } from '../ui';

type CatalogProps = {
  products: CatalogProduct[];
  more?: string;
  loadMore: () => void;
  refresh: (targetSku?: string) => Promise<void>;
  ask: (sku: string) => void;
  simulate: (sku: string) => void;
  onAddProduct?: () => void;
  initialMissingCostsOnly?: boolean;
  loading?: boolean;
  /** The open product (#products/<sku>, P4-G3) or null for the list; owned by the hash route. */
  detail: string | null;
  /** Open (sku) or close (null) the detail through the route; replace = no new history entry. */
  onDetail: (sku: string | null, options?: { replace?: boolean }) => void;
  /** The catalog request failed: an unresolved deep link is kept (retry may find it) instead of being reported as not found. */
  catalogFailed?: boolean;
  /** The SKU the last finished catalog search looked for (login/page.tsx refresh(targetSku)); a link is judged only after that search. */
  searchedSku?: string | null;
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
  initialMissingCostsOnly = false,
  loading = false,
  detail,
  onDetail,
  catalogFailed = false,
  searchedSku = null
}: FeatureProps & CatalogProps) {
  const { t, locale } = useLanguage();

  // Cost modal/form state
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [cost, setCost] = useState('');
  const [effective, setEffective] = useState(bangkokDate());
  const [source, setSource] = useState('');
  const action = useAction();
  const [listingOpen,setListingOpen]=useState(false);
  const [listingPrice,setListingPrice]=useState('');
  const [listingQuantity,setListingQuantity]=useState('');

  const catalog = useProductCatalog(rawProducts, initialMissingCostsOnly, locale);
  const products = catalog.products;
  const product = detail ? products.find(p => p.sku === detail) : undefined;
  // The cost and listing forms belong to one open product: a route change (link, Back/Forward) closes them.
  const [formsFor, setFormsFor] = useState(detail);
  if (formsFor !== detail) { setFormsFor(detail); setCostFormOpen(false); setListingOpen(false); }
  // A deep link is judged only after the catalog search for that SKU has finished (the list may be stale on arrival).
  const [linkMissing, setLinkMissing] = useState(false);
  useEffect(() => {
    if (!detail || product || loading || catalogFailed || searchedSku !== detail) return;
    setLinkMissing(true); onDetail(null, { replace: true });
  }, [detail, product, loading, catalogFailed, searchedSku, onDetail]);
  // Focus (G7 F2): opening a detail focuses its heading; closing it returns focus to the row that opened it.
  const showingDetail = !!product && !costFormOpen && !listingOpen;
  const openedSku = useRef<string | null>(null);
  useEffect(() => {
    if (showingDetail) {
      openedSku.current = product!.sku; setLinkMissing(false);
      if (detailMayTakeFocus(document.activeElement as HTMLElement | null, product!.sku)) document.getElementById(DETAIL_TITLE_ID)?.focus();
      return;
    }
    if (detail || !openedSku.current) return;
    const sku = openedSku.current; openedSku.current = null;
    if (!focusProductRow(sku)) document.getElementById(SCREEN_TITLE_ID)?.focus();
  }, [showingDetail, product?.sku, detail]); // eslint-disable-line react-hooks/exhaustive-deps

  if(listingOpen&&product)return <div className="product-cost-view">
    <button className="ghost back-link" disabled={action.busy} onClick={()=>{setListingOpen(false);action.clearError();}}>← {t('back')}</button>
    <h2>{t('editListing')}</h2>
    <form className="panel narrow" onSubmit={e=>{e.preventDefault();void action.run(async()=>{
      const fields:{sellingPriceSatang?:number;quantity?:number}={};
      if(listingPrice.trim()){const value=parseBaht(listingPrice);if(value>1e12)throw Error('MONEY_INPUT');fields.sellingPriceSatang=value;}
      if(listingQuantity.trim()){if(!/^\d+$/.test(listingQuantity.trim())||Number(listingQuantity)>1e6)throw Error('INVALID_INPUT');fields.quantity=Number(listingQuantity);}
      if(!Object.keys(fields).length)throw Error('INVALID_INPUT');
      await saveProductListing(request,base,product,fields);
      await refresh(product.sku);setListingOpen(false);
    });}}><fieldset disabled={action.busy}>
      <p><strong>{product.name}</strong> · {product.sku}</p><p className="caption">{t('listingNote')}</p>
      <Field label={t('sellingPrice')} value={listingPrice} inputMode="decimal" onChange={e=>setListingPrice(e.target.value)} />
      <Field label={t('stockQty')} value={listingQuantity} inputMode="numeric" onChange={e=>setListingQuantity(e.target.value)} />
      <ErrorNotice error={action.error}/><Submit busy={action.busy}>{t('save')}</Submit>
    </fieldset></form></div>;

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
    const unitProfit = product.profitSatang;
    return (
      <div className="product-detail-view">
        <button className="ghost back-link" onClick={() => onDetail(null)}>
          ← {t('products')}
        </button>
        <div className="product-detail-layout">
          <section className="panel product-detail-main" aria-labelledby={DETAIL_TITLE_ID}>
            <div className="product-detail-header">
              <span className="eyebrow">{product.sku}</span>
              <h2 id={DETAIL_TITLE_ID} tabIndex={-1}>{product.name}</h2>
              <p className="caption">{t('unit')}: {product.unit} · {t('dateAdded')}: {product.dateAdded}</p>
            </div>
            <dl className="product-detail-kpis">
              <div>
                <dt>{t('sellingPrice')}</dt>
                <dd>{product.sellingPriceSatang != null ? <Money value={product.sellingPriceSatang} /> : <span className="badge warn">{t('priceNotListed')}</span>}</dd>
              </div>
              <div>
                <dt>{t('costPrice')}</dt>
                <dd>{product.cost ? <Money value={product.cost.unitCostSatang} /> : <span className="badge warn">{t('missingCost')}</span>}</dd>
              </div>
              <div>
                <dt>{t('stockQty')}</dt>
                <dd>{product.quantity ?? '—'} <small>{product.unit}</small></dd>
              </div>
              <div>
                <dt>{t('unitProfit')}</dt>
                <dd className={unitProfit == null ? undefined : unitProfit < 0 ? 'negative' : 'positive'}>{unitProfit != null ? <ProfitAmount value={unitProfit} /> : '—'}</dd>
              </div>
            </dl>
            {product.cost && (
              <dl className="ledger-lines">
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
              </dl>
            )}
            <div className="actions">
              <button className="secondary" onClick={()=>{setListingPrice(product.sellingPriceSatang==null?'':String(product.sellingPriceSatang/100));setListingQuantity(product.quantity==null?'':String(product.quantity));action.clearError();setListingOpen(true);}}>{t('editListing')}</button>
              <button
                onClick={() => {
                  setCost(product.cost ? String(product.cost.unitCostSatang / 100) : '');
                  setSource(product.cost ? product.cost.sourceRef : '');
                  setCostFormOpen(true);
                }}
              >
                {t('addCost')}
              </button>
            </div>
          </section>
          <aside className="panel product-detail-aside" aria-labelledby="product-detail-tools">
            <h3 id="product-detail-tools">{t('productDetailTools')}</h3>
            <button className="secondary" onClick={() => simulate(product.sku)}>
              <Icon name="simulation" />{t('simulation')}
            </button>
            <button className="secondary" onClick={() => ask(product.sku)}>
              <Icon name="assistant" />{t('askProduct')}
            </button>
          </aside>
        </div>
      </div>
    );
  }

  return <>
    {/* Persistent live region: the notice is inserted into it after mount, so it is announced. */}
    <div role="status" aria-live="polite">{linkMissing && <p className="notice info"><Icon name="info" />{t('productLinkMissing')}</p>}</div>
    <ProductCatalog controls={catalog} loading={loading} more={more} loadMore={loadMore} onSelect={sku => onDetail(sku)} onAdd={() => {
      if (onAddProduct) onAddProduct();
      else location.hash = 'addProduct';
    }} />
  </>;
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
                <strong><ProfitAmount value={result.baseline.profitSatang} /></strong>
              </div>
              <div>
                {t('after')}
                <strong><ProfitAmount value={result.scenario.profitSatang} /></strong>
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
