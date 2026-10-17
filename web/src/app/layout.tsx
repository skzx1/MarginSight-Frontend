import './globals.css';
import { LanguageProvider } from './language';
export const metadata={title:'MarginSight — ดูกำไรจากข้อมูลจริง',description:'ผู้ช่วยร้านค้าหลายช่องทาง พร้อมหลักฐานต้นทุนและค่าบริการ',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><head><link rel="stylesheet" href="/fonts/fonts.css" /></head><body><LanguageProvider>{children}</LanguageProvider></body></html>}
