import {Brand,Icon} from './ui';

export default function NotFound(){
 return <main className="login"><div className="auth-topbar"><Brand/></div><div className="onboarding-wrap"><section className="login-card"><span className="auth-card-label">ไม่พบหน้า · 404</span><h1>หน้านี้อาจย้ายไปแล้ว</h1><p>กลับไปพื้นที่ร้านของคุณเพื่อเลือกเมนูที่ต้องการ หากยังไม่ได้เข้าสู่ระบบ คุณสามารถเริ่มจากหน้าแรกได้</p><a className="button-link" href="/">กลับหน้าแรก <Icon name="arrow"/></a></section></div></main>
}
