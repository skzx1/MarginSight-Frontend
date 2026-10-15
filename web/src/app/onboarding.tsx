'use client';

import { useState } from 'react';
import { logout } from '../lib/auth';
import { Brand, Icon, Steps } from './ui';
export default function Onboarding({
  create,
  busy,
  error,
  back
}: {
  create: (name: string) => Promise<void>;
  busy: boolean;
  error: string;
  back?: () => void;
}) {
  const [name, setName] = useState('');
  return <main className="login"><div className="auth-topbar"><Brand /><span>เริ่มต้นใช้งานร้านส่วนตัว</span></div><div className="onboarding-wrap"><Steps items={['ตั้งชื่อร้าน', 'เพิ่มข้อมูล', 'ดูกำไร']} /><form className="login-card" onSubmit={e => {
        e.preventDefault();
        void create(name);
      }}><span className="auth-card-label">พื้นที่สำหรับร้านของคุณ</span><h1>เริ่มจากชื่อร้าน<br />แล้วค่อยเติมข้อมูลที่มี</h1><p>ร้านใหม่เริ่มจากข้อมูลว่าง เพิ่มสินค้า ต้นทุน และรายงานของคุณได้ทันที ไม่มีข้อมูลจำลองปะปน</p><label>ชื่อร้าน<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required placeholder="เช่น ร้านกระเป๋าของฉัน" autoComplete="organization" /></label><button disabled={busy || name.trim().length < 2} type="submit">{busy ? 'กำลังสร้างร้าน…' : 'สร้างร้านของฉัน'}<Icon name="arrow" /></button>{error && <p role="alert" className="notice">{error}</p>}<small><Icon name="shield" /> หนึ่งร้านส่วนตัวต่อบัญชี · ข้อมูลเข้าถึงได้เฉพาะผู้มีสิทธิ์ร้าน<br />ตรวจความครบถ้วนของต้นทุนและรายการเงินหักก่อนใช้ผลกำไร</small>{back && <button type="button" className="secondary" onClick={back}>กลับร้านที่มีอยู่</button>}<button type="button" className="ghost" onClick={logout}>ออกจากระบบ</button></form></div><div className="auth-bottom">MarginSight · เห็นกำไร เข้าใจร้าน</div></main>;
}
