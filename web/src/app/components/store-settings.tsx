'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { logout } from '../../lib/auth';
import type { Screen } from '../../lib/types';
import { categories, currencies, reportingCycles, validateSettings, type SettingsDraft } from '../../lib/store-settings';
import { LanguageSwitch, useLanguage } from '../language';
import { Icon, type IconName } from '../ui';
import { useStoreSettings } from './use-store-settings';
import s from './store-settings.module.css';

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className={s.field}><label htmlFor={id}>{label}</label>{children}{hint && <small id={id + '-hint'}>{hint}</small>}{error && <p id={id + '-error'} className={s.fieldError} role="alert">{error}</p>}</div>;
}
function Heading({ id, title, note }: { id: string; title: string; note?: string }) {
  return <div className={s.cardHeading}><h2 id={id}>{title}</h2>{note && <p>{note}</p>}</div>;
}

export default function StoreSettings({ base, navigate, canCreate, create, storeName, guest, onNameSaved, registerGuard, canLeave }: {
  base: string; navigate: (screen: Screen) => void; canCreate: boolean; create: () => void; storeName: string; guest: boolean;
  onNameSaved: (name: string) => void; registerGuard: (check: () => boolean) => () => void; canLeave: () => boolean;
}) {
  const { t, locale, setLocale } = useLanguage();
  const text = (th: string, en: string) => locale === 'th' ? th : en;
  const state = useStoreSettings(base, storeName, locale, setLocale, onNameSaved);
  const { draft, ready, saving, dirty, update } = state;
  const [attempted, setAttempted] = useState(false), [touched, setTouched] = useState<Record<string, boolean>>({});
  const form = useRef<HTMLFormElement>(null), unsaved = useRef(false), leaving = useRef(false);
  useEffect(() => { unsaved.current = dirty; leaving.current = false; }, [dirty]);
  const leaveMessage = text('มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการออกจากหน้านี้และทิ้งการแก้ไขหรือไม่?', 'You have unsaved changes. Leave this page and discard your edits?');
  useEffect(() => registerGuard(() => {
    if (!unsaved.current || leaving.current) return true;
    if (!window.confirm(leaveMessage)) return false;
    leaving.current = true; state.cancel(); return true;
  }), [registerGuard, leaveMessage, state.cancel]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (unsaved.current && !leaving.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const errors = validateSettings(draft);
  const errorCopy = {
    requiredName: text('กรอกชื่อร้าน 1–120 ตัวอักษร', 'Enter a store name with 1–120 characters.'),
    invalidThreshold: text('กรอกตัวเลขตั้งแต่ 0 ถึง 100', 'Enter a number from 0 to 100.'),
    invalidEmail: text('ตรวจรูปแบบอีเมล เช่น name@example.com', 'Enter a valid email, such as name@example.com.'),
    requiredEmail: text('กรอกอีเมลสำหรับรายงานที่เลือก', 'Enter an email for the selected reports.'),
  };
  const error = (key: 'storeName' | 'marginThreshold' | 'email') => (attempted || touched[key]) && errors[key] ? errorCopy[errors[key]!] : undefined;
  const inputProps = (key: 'storeName' | 'marginThreshold' | 'email', id: string, hint = false) => ({
    id, 'aria-invalid': error(key) ? true as const : undefined,
    'aria-describedby': [hint ? id + '-hint' : '', error(key) ? id + '-error' : ''].filter(Boolean).join(' ') || undefined,
    onBlur: () => setTouched(old => ({ ...old, [key]: true })),
  });
  const tools: { screen: Screen; icon: IconName; note: string; usage?: string }[] = [
    { screen: 'imports', icon: 'upload', note: text('CSV / XLSX ตามแบบฟอร์ม', 'CSV / XLSX templates') },
    { screen: 'rules', icon: 'rules', note: text('ตรวจค่าบริการก่อนใช้', 'Review platform fees') },
  ];
  const categoryLabels: Record<SettingsDraft['category'], string> = {
    general: text('ค้าปลีกทั่วไป', 'General retail'), fashion: text('แฟชั่นและเสื้อผ้า', 'Fashion & clothing'), beauty: text('ความงามและสุขภาพ', 'Beauty & wellness'),
    food: text('อาหารและเครื่องดื่ม', 'Food & drinks'), home: text('ของใช้ในบ้าน', 'Home & living'), other: text('อื่น ๆ', 'Other'),
  };
  const cycleLabels = { monthly: text('รายเดือน', 'Monthly'), weekly: text('รายสัปดาห์', 'Weekly'), daily: text('รายวัน', 'Daily') };
  const header = <p className="screen-note">{t('settingsSubtitle')}</p>;

  if (!ready) return <div className={s.root}>{header}<div className={s.skeleton} role="status" aria-busy="true"><span className="sr-only">{text('กำลังโหลดการตั้งค่า', 'Loading settings')}</span><div /><div /><div /></div></div>;
  const cancel = () => { state.cancel(); setAttempted(false); setTouched({}); };

  return <div className={s.root}>{header}
    <section className={s.card} aria-labelledby="store-data-title"><Heading id="store-data-title" title={t('dataTasks')} note={text('เลือกเครื่องมือเพื่อเพิ่มข้อมูลและตรวจยอดของร้าน', 'Add store records and review your numbers with these tools.')} />
      <div className={s.toolGrid}>{tools.map(tool => <button type="button" className={s.tool} key={tool.screen} onClick={() => navigate(tool.screen)}>
        <span className={s.toolIcon} aria-hidden="true"><Icon name={tool.icon} /></span><strong>{t(tool.screen)}</strong><span className={s.toolDescription}>{tool.note}</span>
        {tool.usage && <small className={s.usage}>{tool.usage}</small>}<span className={s.toolAction}>{text('เปิดเครื่องมือ', 'Open tool')}<Icon name="arrow" /></span>
      </button>)}</div>
    </section>

    {state.recovered && <p className={s.infoNote} role="status">{text('การตั้งค่าที่เก็บไว้ไม่สมบูรณ์ จึงใช้ค่าเริ่มต้น คุณแก้ไขและบันทึกใหม่ได้', 'Saved settings could not be read. Defaults are shown; edit and save to replace them.')}</p>}
    {state.storageError && <p className={s.storageError} role="alert">{text('ยังอ่านหรือบันทึกการตั้งค่าในเบราว์เซอร์ไม่ได้ ตรวจสิทธิ์พื้นที่เก็บข้อมูลแล้วลองบันทึกอีกครั้ง การแก้ไขยังอยู่ในหน้านี้', 'Browser storage is unavailable. Check storage permissions and try saving again; your edits remain on this page.')}</p>}

    <form id="store-settings-form" ref={form} noValidate className={s.formsLayout} onSubmit={async e => {
      e.preventDefault(); setAttempted(true);
      if (Object.keys(errors).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
      await state.save();
    }}>
      <section className={s.card} aria-labelledby="store-profile-title"><Heading id="store-profile-title" title={t('shopProfile')} note={text('บันทึกการตั้งค่าไว้ในเบราว์เซอร์นี้ แยกตามบัญชีและร้าน', 'Preferences are saved in this browser for this account and store.')} />
        <div className={s.formGrid}>
          <Field id="settings-store-name" label={t('storeName')} error={error('storeName')} hint={text('ชื่อที่แสดงในหน้านี้ ไม่เปลี่ยนชื่อร้านบนเซิร์ฟเวอร์', 'Display name on this page; your server store name stays the same.')}><input {...inputProps('storeName', 'settings-store-name', true)} value={draft.storeName} onChange={e => update('storeName', e.target.value)} required maxLength={120} autoComplete="organization" /></Field>
          <Field id="settings-category" label={t('shopCategory')}><select id="settings-category" value={draft.category} onChange={e => update('category', e.target.value as SettingsDraft['category'])}>{categories.map(value => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></Field>
          <Field id="settings-currency" label={t('currency')} hint={text('เป็นค่าที่ต้องการเท่านั้น ตัวเลขการเงินจริงยังเป็น THB ไม่มีการแปลงเงิน', 'Preference only. Financial records remain in THB; no currency conversion.')}><select id="settings-currency" value={draft.currency} aria-describedby="settings-currency-hint" onChange={e => update('currency', e.target.value as SettingsDraft['currency'])}>{currencies.map(value => <option value={value} key={value}>{value === 'THB' ? text('บาทไทย · THB', 'Thai baht · THB') : value === 'USD' ? text('ดอลลาร์สหรัฐ · USD', 'US dollar · USD') : text('หยวนจีน · CNY', 'Chinese yuan · CNY')}</option>)}</select></Field>
          <Field id="settings-fiscal" label={t('fiscalPeriod')}><select id="settings-fiscal" value={draft.reportingCycle} onChange={e => update('reportingCycle', e.target.value as SettingsDraft['reportingCycle'])}>{reportingCycles.map(value => <option key={value} value={value}>{cycleLabels[value]}</option>)}</select></Field>
        </div>
      </section>

      <section className={s.card} aria-labelledby="store-preferences-title"><Heading id="store-preferences-title" title={t('notifications')} />
        <p className={s.infoNote}>{text('การแจ้งเตือนทางอีเมลยังเป็นตัวอย่าง ระบบยังไม่ส่งอีเมลจริง', 'Email notifications are a preview. No emails are sent yet.')}</p>
        <div className={s.formGrid}>
          <div className={s.field}><span className={s.fieldLabel}>{t('language')}</span><div className={s.language}><LanguageSwitch /></div></div>
          <Field id="settings-alert-thresh" label={text('เกณฑ์มาร์จิน (%)', 'Margin alert threshold (%)')} error={error('marginThreshold')}><div className={s.inputAffix}><input {...inputProps('marginThreshold', 'settings-alert-thresh')} type="number" min="0" max="100" step="any" inputMode="decimal" value={draft.marginThreshold} onChange={e => update('marginThreshold', e.target.value)} /><span aria-hidden="true">%</span></div></Field>
          <Field id="settings-email" label={t('contactEmail')} error={error('email')}><input {...inputProps('email', 'settings-email')} type="email" maxLength={254} autoComplete="email" value={draft.email} placeholder="name@example.com" onChange={e => update('email', e.target.value)} /></Field>
          <fieldset className={s.reports}><legend>{text('รายงานทางอีเมล', 'Email reports')}</legend><label><input type="checkbox" checked={draft.dailyDigest} onChange={e => update('dailyDigest', e.target.checked)} /><span>{t('dailyDigest')}</span></label><label><input type="checkbox" checked={draft.weeklyDigest} onChange={e => update('weeklyDigest', e.target.checked)} /><span>{t('weeklyDigest')}</span></label></fieldset>
        </div>
      </section>
    </form>

    <div className={s.additionalLayout}>
      <section className={s.card} aria-labelledby="store-channels-title"><Heading id="store-channels-title" title={t('channels')} /><button type="button" className={s.integration} onClick={() => navigate('line')}><Icon name="line" /><span><strong>LINE Official Account</strong><small>{t('lineNote')}</small></span><Icon name="arrow" /></button><p className={s.channelNote}>Shopee / Lazada / TikTok Shop · {t('importNote')}</p></section>
      <section className={s.card} aria-labelledby="store-account-title"><Heading id="store-account-title" title={t('account')} /><div className={s.accountActions}>{canCreate && <button type="button" className={s.secondary} onClick={() => { if (canLeave()) create(); }}><Icon name="plus" />{t('createStore')}</button>}<button type="button" className={s.secondary} onClick={() => { if (canLeave()) logout(); }}><Icon name="logout" />{t('logout')}</button></div></section>
    </div>

    {dirty && <div className={s.saveDock}><div className={s.saveBar} role="region" aria-label={text('การเปลี่ยนแปลงที่ยังไม่บันทึก', 'Unsaved settings')}><p>{text('มีการเปลี่ยนแปลงที่ยังไม่บันทึก', 'You have unsaved changes')}</p><div><button type="button" className={s.secondary} disabled={saving} onClick={cancel}>{text('ยกเลิก', 'Cancel')}</button><button type="submit" form="store-settings-form" className={s.save} disabled={saving}>{saving ? text('กำลังบันทึก…', 'Saving…') : t('saveSettings')}</button></div></div></div>}
    {state.success && <div className={s.toast} role="status"><Icon name="check" />{text('บันทึกการตั้งค่าในเบราว์เซอร์นี้แล้ว', 'Settings saved in this browser')}</div>}
  </div>;
}
