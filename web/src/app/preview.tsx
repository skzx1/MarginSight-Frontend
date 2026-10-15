'use client';

import { useEffect, useState } from 'react';
import { preview } from '../lib/auth';
import { Brand, Icon, Steps } from './ui';
export default function Preview({
  back
}: {
  back: () => void;
}) {
  const [result, setResult] = useState<any>(),
    [price, setPrice] = useState('170.00'),
    [program, setProgram] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const raw = price.trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw Error('กรอกบาทไม่เกินสองตำแหน่ง');
      const [baht, cents = ''] = raw.split('.');
      setResult(await preview({
        priceSatang: Number(baht) * 100 + Number(cents.padEnd(2, '0')),
        program
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ติดต่อไม่ได้');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void run();
  }, []);
  const money = (v: number) => new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v / 100);
  return <main className="login"><div className="auth-topbar"><Brand /><button className="secondary" onClick={back}>กลับหน้าเริ่มต้น <Icon name="arrow" /></button></div><div className="preview-wrap"><Steps items={['ตั้งสมมติฐาน', 'คำนวณจากสูตร', 'ตรวจที่มาของกำไร']} /><section><div className="row"><span className="badge mock">ข้อมูลจำลอง · อ่านอย่างเดียว</span><span className="muted">สูตรเดียวกับระบบร้าน · หน้านี้เป็นตัวอย่างอ่านอย่างเดียว</span></div><h1>ลองตั้งราคา ดูกำไรก่อนขาย</h1><p className="preview-note">สินค้า MOCK 1 ชิ้น · ต้นทุน 130 บาท · แพ็ก 5 บาท · โฆษณา 10 บาท<br />ค่าบริการจำลอง 12% + 8% และโปรแกรม 3% เมื่อเลือกเข้าร่วม ไม่ใช่อัตราของแพลตฟอร์มจริง</p><div className="form-grid"><label>ราคาขายต่อชิ้น (บาท)<input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" /></label><label>โปรแกรมจำลอง<select value={program ? 'yes' : 'no'} onChange={e => setProgram(e.target.value === 'yes')}><option value="yes">เข้าโปรแกรม เพิ่มค่าบริการ 3%</option><option value="no">ไม่เข้าโปรแกรม</option></select></label></div><button disabled={busy} onClick={() => void run()}>{busy ? 'กำลังคำนวณ…' : 'ลองคำนวณ'}</button>{error && <p role="alert" className="notice">{error}</p>}{result && <><div className="metrics"><article><small>รายรับ</small><strong>฿{money(result.scenario.revenueSatang)}</strong></article><article><small>ค่าบริการ</small><strong>฿{money(result.scenario.feeSatang)}</strong></article><article><small>กำไรส่วนที่บันทึก</small><strong className={result.scenario.profitSatang < 0 ? 'negative' : 'positive'}>฿{money(result.scenario.profitSatang)}</strong></article><article><small>Margin</small><strong>{result.scenario.marginPct ?? '—'}%</strong></article></div><p>ค่าบริการ / รายรับ {result.scenario.platformFeeRatioPct ?? '—'}% · TTR รวมโฆษณา {result.scenario.ttr.percent ?? '—'}%</p><p>ราคาที่ตรวจแล้วไม่ขาดทุน ฿{money(result.breakEven.priceSatang)} · ทุกตัวเลขมาจากสูตร {result.scenario.formulaVersion}</p><details><summary>ที่มาของตัวเลข</summary><p>{result.scenario.evidence.join(' · ')}</p><p>ต้นทุนสินค้า + แพ็ก + โฆษณา = 145 บาท ไม่มีต้นทุนที่หักซ้ำกับส่วนลด ไม่มีข้อมูลร้านจริงในหน้านี้</p></details></>}<div className="chips"><button className="secondary" onClick={back}>กลับไปล็อกอินเพื่อใช้ระบบร้าน</button></div></section></div><div className="auth-bottom">ตัวอย่างอ่านอย่างเดียว · ไม่บันทึกลงร้านจริง · ค่าบริการจำลองไม่ใช่อัตราแพลตฟอร์ม</div></main>;
}
