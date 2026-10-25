'use client';
import { useId, useState } from 'react';
import { request } from '../../lib/auth';
import { useAction } from '../../lib/use-resource';
import { bangkokDate, dateAt, money, parseBaht } from '../../lib/format';
import type { CatalogProduct, FeatureProps } from '../../lib/types';
import { useLanguage } from '../language';
import { ErrorNotice, Submit } from '../components/forms';
import { Icon } from '../ui';
import { productDraftPreview, saveProductAndCost } from '../../lib/catalog-actions';
import ProductCsvImport from '../components/product-csv-import';

type AddProductProps = FeatureProps & {
  existingProducts?: CatalogProduct[];
  onCancel: () => void;
  onSaved: (product: CatalogProduct) => void;
  onBatchSaved?: (products: CatalogProduct[]) => void;
};

export default function AddProductPage({
  base,
  month,
  guest,
  realStore,
  origin,
  existingProducts = [],
  onCancel,
  onSaved,
  onBatchSaved
}: AddProductProps) {
  const { t, locale } = useLanguage();
  const nameId = useId();
  const skuId = useId();
  const priceId = useId();
  const costId = useId();
  const qtyId = useId();
  const unitId = useId();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ชิ้น');
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const action = useAction();
  const [createdProduct, setCreatedProduct] = useState<CatalogProduct>();

  // Unsaved price/quantity are a clearly labelled pre-fee comparison, not shop profit.
  const draft = productDraftPreview(sellingPrice, cost, quantity);
  const priceVal = draft.priceSatang == null ? null : draft.priceSatang / 100;
  const costVal = draft.costSatang == null ? null : draft.costSatang / 100;
  const qtyVal = draft.count;
  const validPrice = priceVal !== null, validCost = costVal !== null, validQty = qtyVal !== null;
  const unitProfit = draft.differenceSatang == null ? null : draft.differenceSatang / 100;
  const marginPct = draft.marginPct;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError(t('invalid'));
      return;
    }

    if (!validPrice || !validCost || !validQty) {
      setValidationError(t('validationError'));
      return;
    }

    const cleanSku = createdProduct?.sku ?? (sku.trim() || 'SKU-' + crypto.randomUUID().slice(0, 8).toUpperCase());
    if (!/^[A-Za-z0-9_.-]{1,100}$/.test(cleanSku) || !unit.trim()) { setValidationError(t('invalid')); return; }
    const costSatang = parseBaht(cost);

    void action.run(async () => {
      const saved = await saveProductAndCost(request, base, {
        sku: cleanSku, name: name.trim(), unit: unit.trim(), costSatang,
        sellingPriceSatang: draft.priceSatang!, quantity: qtyVal!,
        effectiveFrom: dateAt(bangkokDate()), origin
      }, setCreatedProduct, createdProduct);
      setSuccess(true);
      onSaved(saved);

    });
  };

  return (
    <div className="add-product-full-page" role="region" aria-label={t('addProductTitle')}>
      <p className="screen-note">{t('addProductSubtitle')}</p>

      {/* Mode Switcher Tabs */}
      <div className="segmented add-product-tabs" role="tablist" aria-label={t('addProductTitle')}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manual'}
          aria-pressed={mode === 'manual'}
          className="secondary"
          onClick={() => setMode('manual')}
        >
          {t('addManualTab')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'csv'}
          aria-pressed={mode === 'csv'}
          className="secondary"
          onClick={() => setMode('csv')}
        >
          {t('addCsvTab')}
        </button>
      </div>

      {mode === 'csv' ? (
        <ProductCsvImport
          base={base}
          month={month}
          guest={guest}
          realStore={realStore}
          origin={origin}
          existingProducts={existingProducts}
          onImportComplete={imported => {
            if (onBatchSaved) onBatchSaved(imported);
            else imported.forEach(onSaved);
          }}
          onNavigateToProducts={onCancel}
        />
      ) : success ? (
        <div className="success-banner" role="status">
          <span className="success-icon" aria-hidden="true"><Icon name="check" /></span>
          <div>
            <h3>{t('productCreatedSuccess')}</h3>
            <p>{name} ({sku || 'SKU'})</p>
          </div>
        </div>
      ) : (
        <div className="add-product-layout">
          {/* Form Column */}
          <section className="add-product-form-panel">
            <form onSubmit={handleSubmit} noValidate>
              <fieldset disabled={action.busy}>
                {validationError && (
                  <div className="notice error-notice" role="alert">
                    <strong>{t('errorTitle')}</strong>
                    <p>{validationError}</p>
                  </div>
                )}
                <ErrorNotice error={action.error} />{createdProduct && !success && <p className="notice">{t('partialProductSave')}</p>}

                {/* Product Name */}
                <div className="form-field-group">
                  <label htmlFor={nameId} className="field-label required-label">
                    {t('productName')} <span className="req-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={nameId}
                    disabled={!!createdProduct}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="เช่น เสื้อยืดโอเวอร์ไซส์ คอตตอนแท้"
                    required
                    aria-required="true"
                    className="text-input"
                  />
                </div>

                {/* SKU & Unit Row */}
                <div className="form-two-col">
                  <div className="form-field-group">
                    <label htmlFor={skuId} className="field-label">
                      {t('sku')}
                    </label>
                    <input
                      id={skuId}
                    disabled={!!createdProduct}
                      type="text"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      placeholder="เช่น TSHIRT-OVS-01"
                      className="text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label htmlFor={unitId} className="field-label required-label">
                      {t('unit')} <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={unitId}
                    disabled={!!createdProduct}
                      type="text"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      placeholder="ชิ้น / ตัว / กล่อง"
                      required
                      aria-required="true"
                      className="text-input"
                    />
                  </div>
                </div>

                {/* Selling Price & Unit Cost Row (Numeric with THB Currency Prefix) */}
                <div className="form-two-col">
                  <div className="form-field-group">
                    <label htmlFor={priceId} className="field-label required-label">
                      {t('sellingPrice')} <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="currency-input-group">
                      <span className="currency-affix" aria-hidden="true">฿</span>
                      <input
                        id={priceId}
                        type="number"
                        min="0"
                        step="0.01"
                        value={sellingPrice}
                        onChange={e => setSellingPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        aria-required="true"
                        className="numeric-input"
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor={costId} className="field-label required-label">
                      {t('costPrice')} <span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <div className="currency-input-group">
                      <span className="currency-affix" aria-hidden="true">฿</span>
                      <input
                        id={costId}
                        type="number"
                        min="0"
                        step="0.01"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                        placeholder="0.00"
                        required
                        aria-required="true"
                        className="numeric-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="form-field-group">
                  <label htmlFor={qtyId} className="field-label required-label">
                    {t('stockQty')} <span className="req-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={qtyId}
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="0"
                    required
                    aria-required="true"
                    className="numeric-input"
                  />
                </div>

                {/* Actions: Save (Primary) and Cancel (Secondary) */}
                <div className="add-product-actions">
                  <Submit busy={action.busy}>
                    <Icon name="check" />
                    <span>{t('save')}</span>
                  </Submit>
                  <button
                    type="button"
                    className="secondary cancel-button"
                    onClick={onCancel}
                    disabled={action.busy}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </fieldset>
            </form>
          </section>

          {/* Live Profit Preview Column (Side-by-side on desktop) */}
          <aside className="add-product-preview-panel" aria-label={t('livePreview')}>
            <div className="preview-sticky-card">
              <div className="preview-card-header">
                <span className="preview-badge-icon" aria-hidden="true">
                  <Icon name="calculator" />
                </span>
                <div>
                  <h2 className="preview-title">{t('livePreview')}</h2>
                  <p className="caption">{t('livePreviewNote')}</p><p className="notice">{t('draftPriceNote')}</p>
                </div>
              </div>

              <p className="badge">{t('preFeeDifference')}</p>

              {/* Main Margin & Profit Highlight */}
              <div className="preview-main-metric">
                <span className="metric-eyebrow">{t('preFeeDifference')}</span>
                <strong
                  className={
                    'preview-profit-number tabular-num ' +
                    (unitProfit != null && unitProfit < 0 ? 'negative' : 'positive')
                  }
                >
                  {draft.differenceSatang != null ? (draft.differenceSatang < 0 ? '−' : draft.differenceSatang > 0 ? '+' : '') + '฿' + money(Math.abs(draft.differenceSatang), locale) : '—'}
                </strong>
                <span className="metric-margin-pct tabular-num">
                  {marginPct != null ? `${t('preFeeMargin')}: ${marginPct}%` : '—'}
                </span>
              </div>

              {/* Formula Visualization */}
              <div className="preview-formula-box">
                <div className="formula-item">
                  <small>{t('sellingPrice')}</small>
                  <strong className="tabular-num">
                    {draft.priceSatang != null ? '฿' + money(draft.priceSatang, locale) : '—'}
                  </strong>
                </div>
                <span className="formula-operator" aria-hidden="true">−</span>
                <div className="formula-item">
                  <small>{t('costPrice')}</small>
                  <strong className="tabular-num">
                    {draft.costSatang != null ? '฿' + money(draft.costSatang, locale) : '—'}
                  </strong>
                </div>
                <span className="formula-operator" aria-hidden="true">=</span>
                <div className="formula-item highlight-result">
                  <small>{t('preFeeDifference')}</small>
                  <strong className="tabular-num">
                    {draft.differenceSatang != null ? '฿' + money(draft.differenceSatang, locale) : '—'}
                  </strong>
                </div>
              </div>

              {/* Inventory Totals */}
              <dl className="preview-totals-list">
                <div className="preview-total-row">
                  <dt>{t('totalStockValue')} ({qtyVal || 0} {unit || 'ชิ้น'})</dt>
                  <dd className="tabular-num">
                    {draft.totalValueSatang != null ? '฿' + money(draft.totalValueSatang, locale) : '—'}
                  </dd>
                </div>
                <div className="preview-total-row">
                  <dt>{t('totalPreFeeDifference')}</dt>
                  <dd
                    className={
                      'tabular-num ' +
                      (draft.totalDifferenceSatang != null && draft.totalDifferenceSatang < 0 ? 'negative' : 'positive')
                    }
                  >
                    {draft.totalDifferenceSatang != null ? '฿' + money(draft.totalDifferenceSatang, locale) : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
