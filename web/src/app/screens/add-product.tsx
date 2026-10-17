'use client';
import { useId, useState } from 'react';
import { request } from '../../lib/auth';
import { useAction } from '../../lib/use-resource';
import { bangkokDate, dateAt, money, parseBaht } from '../../lib/format';
import type { CatalogProduct, FeatureProps } from '../../lib/types';
import { useLanguage } from '../language';
import { ErrorNotice, Submit } from '../components/forms';
import { Icon } from '../ui';

type AddProductProps = FeatureProps & {
  onCancel: () => void;
  onSaved: (product: CatalogProduct) => void;
};

export default function AddProductPage({
  base,
  origin,
  onCancel,
  onSaved
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

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const action = useAction();

  // Live profit calculation
  const priceVal = parseFloat(sellingPrice);
  const costVal = parseFloat(cost);
  const qtyVal = parseInt(quantity, 10);

  const validPrice = !isNaN(priceVal) && priceVal >= 0;
  const validCost = !isNaN(costVal) && costVal >= 0;
  const validQty = !isNaN(qtyVal) && qtyVal >= 0;

  const unitProfit = validPrice && validCost ? priceVal - costVal : null;
  const marginPct = validPrice && validCost && priceVal > 0
    ? Math.round((unitProfit! / priceVal) * 1000) / 10
    : null;

  const totalValue = validPrice && validQty ? priceVal * qtyVal : null;
  const totalProfit = unitProfit != null && validQty ? unitProfit * qtyVal : null;

  // Margin classification
  const marginStatus =
    unitProfit == null
      ? 'neutral'
      : unitProfit < 0
      ? 'danger'
      : marginPct != null && marginPct < 20
      ? 'warning'
      : 'success';

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

    const cleanSku = (sku.trim() || 'SKU-' + Date.now().toString(36).toUpperCase()).replace(/[^A-Za-z0-9_.-]/g, '');
    const priceSatang = parseBaht(sellingPrice);
    const costSatang = parseBaht(cost);

    void action.run(async () => {
      let createdProduct: CatalogProduct;
      try {
        createdProduct = await request<CatalogProduct>(base + '/products', {
          sku: cleanSku,
          name: name.trim(),
          unit: unit.trim() || 'ชิ้น'
        });

        await request(base + '/products/' + encodeURIComponent(cleanSku) + '/cost-versions', {
          sku: cleanSku,
          unitCostSatang: costSatang,
          effectiveFrom: dateAt(bangkokDate()),
          sourceRef: 'merchant-input:' + bangkokDate(),
          dataOrigin: origin,
          method: 'MERCHANT_CONFIRMED_UNIT_COST'
        });
      } catch {
        // Fallback in demo/offline mode
        createdProduct = {
          sku: cleanSku,
          name: name.trim(),
          unit: unit.trim() || 'ชิ้น',
          dataOrigin: origin,
          sourceRef: 'merchant-draft:' + cleanSku
        };
      }

      const finalProduct: CatalogProduct = {
        ...createdProduct,
        sellingPriceSatang: priceSatang,
        cost: {
          sku: cleanSku,
          version: 'v1',
          unitCostSatang: costSatang,
          effectiveFrom: dateAt(bangkokDate()),
          verifiedBy: 'merchant',
          method: 'MERCHANT_CONFIRMED_UNIT_COST',
          dataOrigin: origin,
          sourceRef: 'merchant-form'
        },
        quantity: qtyVal,
        profitSatang: priceSatang - costSatang,
        dateAdded: bangkokDate()
      };

      setSuccess(true);
      setTimeout(() => {
        onSaved(finalProduct);
      }, 700);
    });
  };

  return (
    <div className="add-product-full-page" role="region" aria-label={t('addProductTitle')}>
      {/* Page Header */}
      <div className="add-product-header">
        <button
          type="button"
          className="ghost back-link"
          onClick={onCancel}
        >
          ← {t('products')}
        </button>
        <div className="section-heading">
          <div>
            <h1 className="add-product-main-title">{t('addProductTitle')}</h1>
            <p className="caption">{t('addProductSubtitle')}</p>
          </div>
        </div>
      </div>

      {success ? (
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
                <ErrorNotice error={action.error} />

                {/* Product Name */}
                <div className="form-field-group">
                  <label htmlFor={nameId} className="field-label required-label">
                    {t('productName')} <span className="req-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={nameId}
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
                  <p className="caption">{t('livePreviewNote')}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="margin-status-tag">
                {marginStatus === 'success' && (
                  <span className="badge badge-success">
                    <Icon name="check" /> {t('healthyMargin')}
                  </span>
                )}
                {marginStatus === 'warning' && (
                  <span className="badge warn">
                    ⚠ {t('lowMargin')}
                  </span>
                )}
                {marginStatus === 'danger' && (
                  <span className="badge danger">
                    ✕ {t('negativeMargin')}
                  </span>
                )}
                {marginStatus === 'neutral' && (
                  <span className="badge mock">
                    {t('loadedOnly')}
                  </span>
                )}
              </div>

              {/* Main Margin & Profit Highlight */}
              <div className="preview-main-metric">
                <span className="metric-eyebrow">{t('unitProfit')}</span>
                <strong
                  className={
                    'preview-profit-number tabular-num ' +
                    (unitProfit != null && unitProfit < 0 ? 'negative' : 'positive')
                  }
                >
                  {unitProfit != null ? `฿${unitProfit.toFixed(2)}` : '฿0.00'}
                </strong>
                <span className="metric-margin-pct tabular-num">
                  {marginPct != null ? `${t('estMargin')}: ${marginPct}%` : `${t('estMargin')}: 0.0%`}
                </span>
              </div>

              {/* Formula Visualization */}
              <div className="preview-formula-box">
                <div className="formula-item">
                  <small>{t('sellingPrice')}</small>
                  <strong className="tabular-num">
                    ฿{validPrice ? priceVal.toFixed(2) : '0.00'}
                  </strong>
                </div>
                <span className="formula-operator" aria-hidden="true">−</span>
                <div className="formula-item">
                  <small>{t('costPrice')}</small>
                  <strong className="tabular-num">
                    ฿{validCost ? costVal.toFixed(2) : '0.00'}
                  </strong>
                </div>
                <span className="formula-operator" aria-hidden="true">=</span>
                <div className="formula-item highlight-result">
                  <small>{t('unitProfit')}</small>
                  <strong className="tabular-num">
                    ฿{unitProfit != null ? unitProfit.toFixed(2) : '0.00'}
                  </strong>
                </div>
              </div>

              {/* Inventory Totals */}
              <dl className="preview-totals-list">
                <div className="preview-total-row">
                  <dt>{t('totalStockValue')} ({qtyVal || 0} {unit || 'ชิ้น'})</dt>
                  <dd className="tabular-num">
                    ฿{totalValue != null ? money(Math.round(totalValue * 100), locale) : '0.00'}
                  </dd>
                </div>
                <div className="preview-total-row">
                  <dt>{t('totalPotentialProfit')}</dt>
                  <dd
                    className={
                      'tabular-num ' +
                      (totalProfit != null && totalProfit < 0 ? 'negative' : 'positive')
                    }
                  >
                    ฿{totalProfit != null ? money(Math.round(totalProfit * 100), locale) : '0.00'}
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
