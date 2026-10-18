'use client';
import type { ReactNode } from 'react';
import { logout } from '../../lib/auth';
import type { Screen } from '../../lib/types';
import { LanguageSwitch, useLanguage } from '../language';
import { Icon, type IconName } from '../ui';
import { DataStatus } from './ledger';
import s from './store-settings.module.css';

function Lock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></svg>;
}

function LockedField({ id, label, value, type = 'text', placeholder, suffix }: { id: string; label: string; value: string; type?: string; placeholder?: string; suffix?: string }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label><div className={s.lockedInput}>
    <input id={id} type={type} value={value} placeholder={placeholder} disabled aria-describedby="store-settings-note" />
    {suffix && <span className={s.suffix} aria-hidden="true">{suffix}</span>}<span className={s.lock}><Lock /></span>
  </div></div>;
}

function CardHeading({ id, title, note, status }: { id: string; title: string; note?: string; status?: ReactNode }) {
  return <div className={s.cardHeading}><div><h2 id={id}>{title}</h2>{note && <p>{note}</p>}</div>{status}</div>;
}

export default function StoreSettings({ navigate, canCreate, create, storeName, guest }: {
  navigate: (screen: Screen) => void; canCreate: boolean; create: () => void; storeName: string; guest: boolean;
}) {
  const { t, locale } = useLanguage();
  const text = (th: string, en: string) => locale === 'th' ? th : en;
  const tools: { screen: Screen; icon: IconName; note: string }[] = [
    { screen: 'imports', icon: 'upload', note: text('นำเข้าด้วยแบบฟอร์ม CSV / XLSX', 'Import with a CSV / XLSX template') },
    { screen: 'receipts', icon: 'receipt', note: text('AI OCR · ตรวจบิลก่อนยืนยันต้นทุน', 'AI OCR · Review before confirming costs') },
    { screen: 'rules', icon: 'rules', note: text('ค่าคอมมิชชันและค่าบริการ', 'Commission and platform fees') },
    { screen: 'reconciliation', icon: 'reconcile', note: text('กระทบยอดเงินเข้า', 'Reconcile received payments') },
  ];
  const workflow = (screen: Screen, icon: IconName, label: string, note: string) => <button type="button" className={s.tool} key={screen} onClick={() => navigate(screen)}>
    <span className={s.toolIcon} aria-hidden="true"><Icon name={icon} /></span><span className={s.toolText}><strong>{label}</strong><small>{note}</small></span><span className={s.toolArrow} aria-hidden="true"><Icon name="arrow" /></span>
  </button>;

  return <div className={s.root}>
    <header className={s.pageHeader}><div><h1 id="screen-title" tabIndex={-1}>{t('store')}</h1><p>{t('settingsSubtitle')}</p></div>
      {guest && <div className={s.demoMeta}><DataStatus value="MOCK" /><span>{text('นำเข้าได้ 3 ไฟล์ · ผู้ช่วยและอ่านบิลรวม 3 ครั้งต่อรอบ', '3 imports · 3 assistant/receipt requests per session')}</span></div>}
    </header>

    <section className={s.card} aria-labelledby="store-data-title">
      <CardHeading id="store-data-title" title={t('dataTasks')} />
      <div className={s.toolGrid}>{tools.map(tool => workflow(tool.screen, tool.icon, t(tool.screen), tool.note))}</div>
    </section>

    <form className={s.sections} onSubmit={e => e.preventDefault()} aria-describedby="store-settings-note">
      <section className={s.card} aria-labelledby="store-profile-title">
        <CardHeading id="store-profile-title" title={t('shopProfile')} status={<span className={s.callout}><Lock />{text('ยังไม่เปิดให้บันทึก', 'Saving is not available yet')}</span>} />
        <p id="store-settings-note" className={s.settingsNote}>{t('settingsUnavailable')}</p>
        <div className={s.formGrid}>
          <LockedField id="settings-store-name" label={t('storeName')} value={storeName} />
          <LockedField id="settings-category" label={t('shopCategory')} value={t('retailGeneral')} />
          <LockedField id="settings-currency" label={t('currency')} value={t('thbCurrency')} />
          <LockedField id="settings-fiscal" label={t('fiscalPeriod')} value={t('monthlyCycle')} />
        </div>
      </section>

      <section className={s.card} aria-labelledby="store-preferences-title">
        <CardHeading id="store-preferences-title" title={t('notifications')} status={<span className={s.callout}><Lock />{text('ยังไม่ส่งการแจ้งเตือน', 'Notifications are not active')}</span>} />
        <div className={s.formGrid}>
          <div className={s.field}><span className={s.fieldLabel}>{t('language')}</span><div className={s.language}><LanguageSwitch /></div></div>
          <LockedField id="settings-alert-thresh" label={t('marginAlertThreshold')} value="15" type="number" suffix="%" />
          <LockedField id="settings-email" label={t('contactEmail')} value="" type="email" placeholder="name@example.com" />
          <fieldset className={s.reports} disabled aria-describedby="store-settings-note"><legend>{text('รายงานทางอีเมล', 'Email reports')}</legend>
            <label><input type="checkbox" name="dailyDigest" /><span>{t('dailyDigest')}</span></label>
            <label><input type="checkbox" name="weeklyDigest" /><span>{t('weeklyDigest')}</span></label>
          </fieldset>
        </div>
        <div className={s.cardFooter}><span>{text('บริการบันทึกการตั้งค่ายังไม่พร้อม', 'Settings saving is not available yet')}</span><button type="submit" className={s.save} disabled aria-describedby="store-settings-note"><Lock />{t('saveSettings')}</button></div>
      </section>
    </form>

    <section className={s.card} aria-labelledby="store-channels-title">
      <CardHeading id="store-channels-title" title={t('channels')} />
      <div className={s.toolGrid}>
        {workflow('line', 'line', 'LINE Official Account', t('lineNote'))}
        <div className={s.channelNote}><Icon name="products" /><div><strong>Shopee / Lazada / TikTok Shop</strong><p>{t('importNote')}</p></div></div>
      </div>
    </section>

    <section className={s.card} aria-labelledby="store-account-title">
      <CardHeading id="store-account-title" title={t('account')} />
      <div className={s.accountActions}>{canCreate && <button type="button" className={s.secondary} onClick={create}><Icon name="plus" />{t('createStore')}</button>}<button type="button" className={s.secondary} onClick={logout}><Icon name="logout" />{t('logout')}</button></div>
    </section>
  </div>;
}
