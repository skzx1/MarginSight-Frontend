'use client';
import { useState } from 'react';
import { logout, request } from '../../lib/auth';
import { useAction, useResource } from '../../lib/use-resource';
import type { FeatureProps, Screen } from '../../lib/types';
import { LanguageSwitch, useLanguage } from '../language';
import { ErrorNotice, Loading } from '../components/forms';
import { Icon, type IconName } from '../ui';

export default function StoreHub({
  navigate,
  canCreate,
  create,
  storeName
}: {
  navigate: (screen: Screen) => void;
  canCreate: boolean;
  create: () => void;
  storeName: string;
}) {
  const { t } = useLanguage();

  // Settings form states
  const [shopName, setShopName] = useState(storeName);
  const [shopCategory, setShopCategory] = useState('retailGeneral');
  const [contactEmail, setContactEmail] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('15');
  const [dailyDigest, setDailyDigest] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const dataRows: [Screen, IconName, string][] = [
    ['imports', 'upload', 'พร้อมนำเข้า CSV/XLSX'],
    ['receipts', 'receipt', 'AI OCR บิลซื้อ'],
    ['rules', 'rules', 'ค่าคอมมิชชันและค่าบริการ'],
    ['reconciliation', 'reconcile', 'กระทบยอดเงินเข้า']
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

  };

  return (
    <div className="settings-page-full">
      {/* Settings Subtitle */}
      <div className="settings-intro">
        <p className="caption">{t('settingsSubtitle')}</p>
      </div>

      <p className="notice">{t('settingsUnavailable')}</p>

      <form onSubmit={handleSave} className="settings-sections-layout">
        {/* Section 1: Shop Profile */}
        <section className="settings-card-section">
          <div className="settings-card-header">
            <span className="settings-section-icon" aria-hidden="true"><Icon name="settings" /></span>
            <div>
              <h2>{t('shopProfile')}</h2>
              <p className="caption">{t('setupNote')}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="field-item">
              <label htmlFor="settings-store-name" className="field-label">
                {t('storeName')}
              </label>
              <input disabled
                id="settings-store-name"
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="field-item">
              <label htmlFor="settings-category" className="field-label">
                {t('shopCategory')}
              </label>
              <select disabled
                id="settings-category"
                value={shopCategory}
                onChange={e => setShopCategory(e.target.value)}
                className="select-input"
              >
                <option value="retailGeneral">{t('retailGeneral')}</option>
              </select>
            </div>

            <div className="field-item">
              <label htmlFor="settings-currency" className="field-label">
                {t('currency')}
              </label>
              <input disabled
                id="settings-currency"
                type="text"
                value={t('thbCurrency')}
                className="text-input disabled-input"
              />
            </div>

            <div className="field-item">
              <label htmlFor="settings-fiscal" className="field-label">
                {t('fiscalPeriod')}
              </label>
              <input disabled
                id="settings-fiscal"
                type="text"
                value={t('monthlyCycle')}
                className="text-input disabled-input"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Notifications & Preferences */}
        <section className="settings-card-section">
          <div className="settings-card-header">
            <span className="settings-section-icon" aria-hidden="true"><Icon name="sparkles" /></span>
            <div>
              <h2>{t('notifications')}</h2>
              <p className="caption">{t('trustNote')}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="field-item">
              <label className="field-label">{t('language')}</label>
              <div className="language-switch-wrapper">
                <LanguageSwitch />
              </div>
            </div>

            <div className="field-item">
              <label htmlFor="settings-email" className="field-label">
                {t('contactEmail')}
              </label>
              <input disabled
                id="settings-email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="field-item">
              <label htmlFor="settings-alert-thresh" className="field-label">
                {t('marginAlertThreshold')}
              </label>
              <div className="input-with-affix">
                <input disabled
                  id="settings-alert-thresh"
                  type="number"
                  min="0"
                  max="100"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  className="numeric-input"
                />
                <span className="affix">%</span>
              </div>
            </div>

            <div className="field-item checkbox-grid-item">
              <label className="settings-checkbox-label">
                <input disabled
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={e => setDailyDigest(e.target.checked)}
                />
                <span>{t('dailyDigest')}</span>
              </label>

              <label className="settings-checkbox-label">
                <input disabled
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={e => setWeeklyDigest(e.target.checked)}
                />
                <span>{t('weeklyDigest')}</span>
              </label>
            </div>
          </div>

          <div className="section-save-row">
            <button type="submit" disabled className="button-primary">
              <Icon name="check" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </section>

        {/* Section 3: Data Sync & Operations */}
        <section className="settings-card-section">
          <div className="settings-card-header">
            <span className="settings-section-icon" aria-hidden="true"><Icon name="upload" /></span>
            <div>
              <h2>{t('dataTasks')}</h2>
              <p className="caption">{t('loadedOnly')}</p>
            </div>
          </div>

          <div className="settings-link-cards-grid">
            {dataRows.map(([screenKey, icon, note]) => (
              <button
                type="button"
                className="settings-link-card"
                key={screenKey}
                onClick={() => navigate(screenKey)}
              >
                <div className="link-card-left">
                  <span className="link-icon-box" aria-hidden="true">
                    <Icon name={icon} />
                  </span>
                  <div>
                    <strong>{t(screenKey)}</strong>
                    <small>{note}</small>
                  </div>
                </div>
                <div className="link-card-right">
                  <span className="badge">{t('details')}</span>
                  <Icon name="arrow" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Channels & Integrations */}
        <section className="settings-card-section">
          <div className="settings-card-header">
            <span className="settings-section-icon" aria-hidden="true"><Icon name="line" /></span>
            <div>
              <h2>{t('channels')}</h2>
              <p className="caption">{t('lineNote')}</p>
            </div>
          </div>

          <div className="settings-link-cards-grid">
            <button
              type="button"
              className="settings-link-card"
              onClick={() => navigate('line')}
            >
              <div className="link-card-left">
                <span className="link-icon-box line-icon-box" aria-hidden="true">
                  <Icon name="line" />
                </span>
                <div>
                  <strong>LINE Official Account</strong>
                  <small>{t('lineNote')}</small>
                </div>
              </div>
              <div className="link-card-right">
                <span className="badge">{t('details')}</span>
                <Icon name="arrow" />
              </div>
            </button>

            <div className="settings-static-channel-card">
              <div className="link-card-left">
                <span className="link-icon-box" aria-hidden="true">
                  <Icon name="products" />
                </span>
                <div>
                  <strong>Shopee / Lazada / TikTok Shop</strong>
                  <small>{t('importNote')}</small>
                </div>
              </div>
              <div className="link-card-right">
                <span className="badge mock">{t('mock')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Account & Actions */}
        <section className="settings-card-section">
          <div className="settings-card-header">
            <span className="settings-section-icon" aria-hidden="true"><Icon name="shield" /></span>
            <div>
              <h2>{t('account')}</h2>
              <p className="caption">{t('trustNote')}</p>
            </div>
          </div>

          <div className="account-actions-row">
            {canCreate && (
              <button
                type="button"
                className="secondary create-store-btn"
                onClick={create}
              >
                <Icon name="plus" />
                <span>{t('createStore')}</span>
              </button>
            )}

            <button
              type="button"
              className="secondary logout-btn"
              onClick={logout}
            >
              <Icon name="logout" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export function LineConnection({ base, guest }: FeatureProps) {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useResource<{ line?: { configured?: boolean } }>(
    base + '/integrations'
  );
  const [link, setLink] = useState<{ code: string; instruction: string }>();
  const action = useAction();

  return (
    <div className="line-connection-page">
      <p className="screen-note">{t('lineNote')}</p>
      <ErrorNotice error={error || action.error} />
      {Boolean(error) && (
        <button className="secondary" onClick={() => void reload()}>
          {t('retry')}
        </button>
      )}
      {loading && <Loading />}

      <section className="panel line-panel">
        <div className="line-icon-large" aria-hidden="true">
          <Icon name="line" />
        </div>
        <h2>{t(data?.line?.configured ? 'configured' : 'notConfigured')}</h2>
        <p>{guest ? t('guestLine') : t('linkSteps')}</p>

        <button
          disabled={guest || !data?.line?.configured || action.busy}
          onClick={() => void action.run(async () => setLink(await request(base + '/line/link', {})))}
          className="button-primary"
        >
          {t('linkCode')}
        </button>

        {link && (
          <div className="link-code-box">
            <strong>{link.code}</strong>
            <p>{link.instruction}</p>
          </div>
        )}
      </section>
    </div>
  );
}
