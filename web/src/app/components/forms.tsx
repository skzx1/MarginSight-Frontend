'use client';
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { useLanguage } from '../language';
import type { CopyKey } from '../../lib/copy';
import type { CatalogProduct } from '../../lib/types';
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span id={id + '-label'}>{label}</span><input {...props} id={id} aria-labelledby={id + '-label'} aria-describedby={hint ? id + '-hint' : undefined} />{hint && <small id={id + '-hint'}>{hint}</small>}</label>;
}
export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) { const id = useId(); return <label className="field" htmlFor={id}><span id={id + '-label'}>{label}</span><select {...props} id={id} aria-labelledby={id + '-label'}>{children}</select></label>; }
export function ProductSelect({ products, value, onChange }: { products: CatalogProduct[]; value: string; onChange: (value: string) => void }) { const { t } = useLanguage(); return <Select label={t('products')} value={value} onChange={e => onChange(e.target.value)}><option value="">{t('selectProduct')}</option>{products.map(p => <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>)}</Select>; }
export function ErrorNotice({ error }: { error: unknown }) {
  const { t } = useLanguage();
  if (!error) return null;
  const code = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  let key: CopyKey = 'errorGeneric';
  if (code === 'MONEY_INPUT') key = 'moneyError';
  else if (/EXPIRED|UNAUTHORIZED/.test(code)) key = 'expired';
  else if (/LIMIT/.test(code)) key = 'quota';
  else if (/REVIEW_AGAIN/.test(code)) key = 'reviewAgain';
  else if (/INCOMPLETE|NO_ORDER|ONE_SKU/.test(code)) key = 'incomplete';
  else if (/FORBIDDEN/.test(code)) key = 'forbidden';
  else if (/FILE_INPUT|INVALID_FILE/.test(code)) key = 'fileError';
  else if (/INVALID_INPUT|ACKNOWLEDGEMENT|UNIT_MISMATCH|VERSION_ALREADY/.test(code)) key = 'invalid';
  return <div className="notice error-notice" role="alert"><strong>{t('errorTitle')}</strong><p>{t(key)}</p>{code && <details><summary>{t('details')}</summary><p className="wrap">{code}</p></details>}</div>;
}
export function Loading() { const { t } = useLanguage(); return <div className="loading-state" role="status"><span className="spinner" />{t('loading')}</div>; }
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <section className="empty-state"><span className="empty-mark" aria-hidden="true">—</span><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>; }
export function Submit({ busy, children, disabled }: { busy: boolean; children: ReactNode; disabled?: boolean }) { const { t } = useLanguage(); return <button type="submit" disabled={busy || disabled}>{busy ? t('working') : children}</button>; }
