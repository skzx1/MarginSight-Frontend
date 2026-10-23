'use client';

import { useState } from 'react';
import { calculateExample, exampleDefaults, validateExample, type ExampleKey } from '../../lib/landing-example';
import { money } from '../../lib/format';
import { Icon } from '../ui';
import s from './landing.module.css';

export default function DiscountSimulator({ locale }: { locale: 'th' | 'en' }) {
  const [fields, setFields] = useState(exampleDefaults);
  const tr = (th: string, en: string) => locale === 'th' ? th : en;
  const errors = validateExample(fields);
  let calculation: ReturnType<typeof calculateExample> | null = null;
  let failed = false;
  if (!Object.keys(errors).length) { try { calculation = calculateExample(fields); } catch { failed = true; } }
  const result = calculation?.result;
  const labels: Record<ExampleKey, string> = { price: tr('ราคาขาย (บาท)', 'Selling price (฿)'), cost: tr('ต้นทุนสินค้า (บาท)', 'Product cost (฿)'), shipping: tr('ค่าส่งที่ร้านจ่าย (บาท)', 'Your shipping cost (฿)'), fee: tr('ค่าธรรมเนียม (%)', 'Fee (%)'), discount: tr('ส่วนลด (%)', 'Discount (%)') };
  const errorText = (key: ExampleKey) => errors[key] === 'percent'
    ? tr(`กรอก 0–${key === 'fee' ? '99.99' : '100'} ทศนิยมไม่เกิน 2 ตำแหน่ง`, `Enter 0–${key === 'fee' ? '99.99' : '100'}, up to 2 decimal places.`)
    : tr(`กรอก ${key === 'price' ? '0.01' : '0'}–1,000,000 บาท ทศนิยมไม่เกิน 2 ตำแหน่ง`, `Enter ${key === 'price' ? '0.01' : '0'}–1,000,000 baht, up to 2 decimal places.`);
  const input = (key: ExampleKey) => <div className={s.field} key={key}>
    <label htmlFor={`example-${key}`}>{labels[key]}</label>
    <input id={`example-${key}`} type="text" inputMode="decimal" autoComplete="off" value={fields[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : key === 'fee' ? 'fee-note' : undefined} onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))} />
    {errors[key] && <p id={`error-${key}`} className={s.fieldError}>{errorText(key)}</p>}
  </div>;
  const profit = result?.profitSatang;
  const amount = (value: number | null | undefined) => value == null ? '—' : `${value < 0 ? '−' : ''}฿${money(Math.abs(value), locale)}`;
  const status = profit == null ? tr('รอข้อมูล', 'Awaiting inputs') : profit < 0 ? tr('ขาดทุน', 'Loss') : profit === 0 ? tr('คุ้มทุน', 'Break-even') : tr('มีกำไร', 'Profit');
  return <div className={s.simulator}>
    <div className={s.mobileResult} aria-hidden="true"><span>{status} / {tr('ชิ้น', 'item')}</span><strong>{amount(profit)}</strong></div>
    <div className={s.inputPanel}>
      <div className={s.inputIntro}><span className={s.iconTile}><Icon name="calculator" /></span><div><h3>{tr('ลองใส่ตัวเลขของสินค้า', 'Try your product numbers')}</h3><p>{tr('ตัวอย่าง · สินค้า 1 ชิ้น', 'Example · one item')}</p></div></div>
      <div className={s.inputGrid}>{(['price', 'cost', 'shipping', 'fee'] as ExampleKey[]).map(input)}</div>
      <div className={s.discountControl}>{input('discount')}<label className={s.srOnly} htmlFor="discount-range">{tr('เลื่อนปรับส่วนลด', 'Adjust discount')}</label><input id="discount-range" type="range" min="0" max="100" step="0.5" value={errors.discount ? 0 : Number(fields.discount)} aria-valuetext={errors.discount ? tr('รอส่วนลดที่ถูกต้อง', 'Awaiting a valid discount') : `${fields.discount}%`} onChange={event => setFields(previous => ({ ...previous, discount: event.target.value }))} /><div className={s.rangeLabels} aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div></div>
      <p id="fee-note" className={s.note}>{tr('ค่าธรรมเนียมคิดจากราคาหลังลด เป็นอัตราตัวอย่าง ไม่ใช่อัตราจริงของแพลตฟอร์ม', 'Fees apply to the discounted price. This is an example rate, not an actual platform rate.')}</p>
      <noscript><p>{tr('เปิด JavaScript เพื่อเปลี่ยนตัวเลขและคำนวณ ตัวเลขที่แสดงเป็นตัวอย่างเริ่มต้น', 'Enable JavaScript to change inputs and calculate. The displayed result is the initial example.')}</p></noscript>
    </div>
    <div className={s.resultPanel} aria-label={tr('ผลคำนวณตัวอย่าง', 'Example calculation result')}>
      <div className={s.resultSummary} role="status" aria-live="polite" aria-atomic="true"><div><p>{tr('กำไรหลังลดราคา / ชิ้น', 'Profit after discount / item')}</p><strong>{amount(profit)}</strong></div><span className={s.resultBadge}><Icon name={profit != null && profit >= 0 ? 'check' : 'calculator'} />{status}</span></div>
      {!calculation ? <p className={s.resultMessage}>{failed ? tr('คำนวณไม่ได้ ลองปรับตัวเลขอีกครั้ง', 'Could not calculate. Try adjusting the values.') : tr('กรอกตัวเลขให้ครบและแก้ช่องที่แจ้งเตือน เพื่อดูผลคำนวณใหม่', 'Complete the inputs and correct the highlighted fields to see an updated result.')}</p> : <>
        <dl className={s.resultLines}><div><dt>{tr('ราคาหลังลด', 'Discounted price')}</dt><dd>{amount(result?.revenueSatang)}</dd></div><div><dt>{tr('ต้นทุนสินค้า', 'Product cost')}</dt><dd>−{amount(result?.cogsSatang)}</dd></div><div><dt>{tr('ค่าส่งที่ร้านจ่าย', 'Your shipping cost')}</dt><dd>−{amount(result?.sellerShippingSatang)}</dd></div><div><dt>{tr('ค่าธรรมเนียม', 'Fee')} ({fields.fee}%)</dt><dd>−{amount(result?.feeSatang)}</dd></div></dl>
        <div className={s.safePrice}><span>{tr('ราคาต่ำสุดที่ไม่ขาดทุน', 'Lowest price that covers costs')}</span><strong>{amount(calculation.safePrice)}</strong></div>
        {calculation.safePrice === null && <p className={s.resultMessage}>{tr('หาราคาคุ้มทุนไม่ได้ในช่วงที่รองรับ ลองลดต้นทุนหรือค่าธรรมเนียม', 'No break-even price found in the supported range. Try lower costs or fees.')}</p>}
      </>}
      <p className={s.resultNote}>{tr('ตัวอย่าง · ปัดค่าธรรมเนียมเป็นสตางค์ ไม่รวมค่าใช้จ่ายอื่นและภาษีที่ไม่ได้กรอก', 'Example · Fees rounded to satang. Other costs and taxes you have not entered are excluded.')}</p>
    </div>
  </div>;
}
