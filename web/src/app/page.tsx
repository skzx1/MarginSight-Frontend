import type { Metadata } from 'next';
import Welcome from './welcome/welcome';
import AuthCallback from './auth-callback';

export const metadata: Metadata = {
  title: 'MarginSight — เห็นกำไร เข้าใจร้าน',
  description: 'ยอดขายเยอะ ไม่ได้แปลว่ากำไรเยอะ ดูกำไรจากยอดขาย ต้นทุน ค่าบริการ และค่าจัดส่งในที่เดียว พร้อมผู้ช่วยภาษาไทย ลองดูตัวอย่าง MarginSight ได้เลย',
  openGraph: {
    title: 'MarginSight — เห็นกำไร เข้าใจร้าน',
    description: 'รู้ว่าแต่ละสินค้าขายแล้วเหลือเท่าไร รวมข้อมูลหลายช่องทาง และถามต่อเป็นภาษาไทย',
    siteName: 'MarginSight', type: 'website', locale: 'th_TH', alternateLocale: ['en_US'],
  },
};

export default function Page() { return <><AuthCallback /><Welcome /></>; }
