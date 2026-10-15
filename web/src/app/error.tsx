'use client';
import {Brand,Icon} from './ui';

export default function ErrorPage({retry}:{error:Error&{digest?:string};retry:()=>void}){
 return <main className="login"><div className="auth-topbar"><Brand/></div><div className="onboarding-wrap"><section className="login-card" role="alert"><span className="auth-card-label">เปิดหน้านี้ไม่สำเร็จ</span><h1>ลองโหลดหน้านี้อีกครั้ง</h1><p>หากเพิ่งบันทึกหรือนำเข้าข้อมูล ให้ตรวจสถานะรายการก่อนส่งซ้ำ</p><button onClick={retry}><Icon name="refresh"/>ลองอีกครั้ง</button><a className="button-link secondary" href="/">กลับหน้าแรก</a></section></div></main>
}
