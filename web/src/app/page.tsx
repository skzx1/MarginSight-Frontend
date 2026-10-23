import type { Metadata } from 'next';
import Welcome from './welcome/welcome';
import AuthCallback from './auth-callback';

export const metadata: Metadata = {
  title: 'MarginShot — รู้กำไรจริงทุกออเดอร์ ก่อนลดราคา',
  description: 'รวมยอดขาย ต้นทุนสินค้า ค่าธรรมเนียม และค่าส่งไว้ในที่เดียว ลองเปลี่ยนราคาก่อนขาย เพื่อดูว่าเหลือกำไรเท่าไร เริ่มจากไฟล์ตามแบบ MarginShot',
  openGraph: {
    title: 'MarginShot — รู้กำไรจริงทุกออเดอร์ ก่อนลดราคา',
    description: 'รวมข้อมูลการขายและต้นทุน ลองเปลี่ยนราคา แล้วดูว่าเหลือกำไรเท่าไร พร้อมตัวอย่างที่ตรวจตัวเลขได้',
    siteName: 'MarginShot', type: 'website', locale: 'th_TH', alternateLocale: ['en_US'],
  },
};

export default function Page() { return <><AuthCallback /><Welcome /></>; }
