'use client';

import { useRef } from 'react';
import { LanguageSwitch, useLanguage } from '../language';
import { Brand, Icon, type IconName } from '../ui';
import DiscountSimulator from './discount-simulator';
import HeroDepth from './hero-depth';
import s from './landing.module.css';

const channels = [{ name: 'Shopee', image: 'shopee.png' }, { name: 'Lazada', image: 'lazada.png' }, { name: 'TikTok Shop', image: 'tiktok.png' }, { name: 'LINE', image: 'line.png' }];
// Only enable this when an approved, real quote and attribution replace every placeholder.
const testimonial = { approved: false, quote: '[QUOTE]', name: '[NAME]', role: '[SHOP / ROLE]' };
// Pricing and contact/policy details are still "[TBD]". Keep them, and every link to them, hidden until real details are approved.
const pricingPublished = false;
const contactPublished = false;

export default function Landing() {
  const { locale } = useLanguage();
  const tr = (th: string, en: string) => locale === 'th' ? th : en;
  const menu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => { if (menu.current) menu.current.open = false; };
  const links = [['#simulator', tr('ลองคำนวณ', 'Calculator')], ['#features', tr('ช่วยอะไรได้บ้าง', 'Features')], ...(pricingPublished ? [['#pricing', tr('ราคา', 'Pricing')]] : []), ['#faq', tr('คำถามที่พบบ่อย', 'FAQ')]];
  const primary = <a className={s.primary} href="/login/">{tr('เปิดร้าน MarginShot', 'Open MarginShot')}<Icon name="arrow" /></a>;
  const features: { icon: IconName; title: string; body: string; link: string; href: string }[] = [
    { icon: 'simulation', title: tr('ลองลดราคา ก่อนตัดสินใจ', 'Check a discount before you commit'), body: tr('ใส่ราคา ต้นทุน ค่าส่ง และค่าธรรมเนียม แล้วดูว่าเหลือกำไรเท่าไร พร้อมราคาที่ช่วยให้ไม่ขาดทุน', 'Enter your price, product cost, shipping and fees. See what you keep and the price that covers those costs.'), link: tr('ลองคำนวณส่วนลด', 'Try the discount calculator'), href: '#simulator' },
    { icon: 'upload', title: tr('รวมยอดขายและต้นทุน', 'Bring sales and costs together'), body: tr('นำเข้า CSV / Excel ตามแบบ MarginShot ตรวจรายการ และเติมต้นทุนที่ขาด เพื่อเห็นตัวเลขร้านในที่เดียว', 'Import CSV / Excel using MarginShot templates. Review the records and fill in missing costs to see your shop in one place.'), link: tr('ดูตัวอย่างการนำเข้า', 'Explore importing'), href: '/login/' },
    { icon: 'assistant', title: tr('ถามเรื่องกำไร เป็นภาษาไทย', 'Ask about profit in plain language'), body: tr('ถามผู้ช่วยจากข้อมูลร้านและผลคำนวณ ดูที่มาของตัวเลข แล้วตรวจข้อมูลก่อนตัดสินใจขาย', 'Ask the assistant about shop records and calculation results. Follow the numbers back to their sources before deciding.'), link: tr('ลองใช้ผู้ช่วย', 'Explore the assistant'), href: '/login/' },
  ];
  const faqs = [
    [tr('ใช้กับช่องทางไหนได้บ้าง?', 'Which sales channels can I use?'), tr('ระบุช่องทางเป็น Shopee, Lazada, TikTok Shop, LINE หรือหน้าร้านได้ ใช้ CSV / Excel ตามแบบ MarginShot ยังไม่ได้ดึงข้อมูลอัตโนมัติหรือรองรับไฟล์ดั้งเดิมจากทุกแพลตฟอร์ม', 'Label records as Shopee, Lazada, TikTok Shop, LINE or in-store. Use MarginShot CSV / Excel templates. Automatic connections and native exports from every platform are not yet supported.')],
    [tr('ตัวเลขในเครื่องคิดนี้เป็นข้อมูลจริงไหม?', 'Are these calculator numbers real shop data?'), tr('เป็นตัวอย่างสำหรับลองคำนวณ อัตราค่าธรรมเนียม 15% เป็นค่าที่สมมติขึ้น คุณปรับตัวเลขได้ ผลไม่รวมค่าใช้จ่ายอื่นและภาษีที่ไม่ได้กรอก', 'These are example inputs you can change. The 15% fee is an assumption, not a platform rate. Results exclude other costs and taxes you have not entered.')],
    [tr('ยังไม่รู้ต้นทุน เริ่มใช้ได้ไหม?', 'Can I start without knowing every cost?'), tr('เพิ่มสินค้าไว้ก่อนได้ ระบบจะแจ้งว่าต้นทุนยังขาด กลับมาเติมข้อมูลให้ครบก่อนใช้ตัวเลขกำไรตัดสินใจ', 'You can add products first. Missing costs are flagged. Complete the information before relying on a profit figure.')],
    [tr('มีค่าใช้จ่ายเท่าไร?', 'How much does it cost?'), tr('ราคา แพ็กเกจ และโควตาการใช้งานยังอยู่ระหว่างกำหนด ตอนนี้เปิดร้าน MarginShot ได้ทันที', 'Pricing, plans and usage limits are still being defined. You can start by opening MarginShot.')],
  ];
  return <div className={`${s.page} ${s.depthPage}`}>
    <a className={s.skip} href="#main">{tr('ข้ามไปเนื้อหา', 'Skip to content')}</a>
    <header className={s.header}><div className={s.headerInner}>
      <a className={s.brand} href="#main" aria-label="MarginShot"><Brand /></a>
      <nav className={s.navigation} aria-label={tr('เมนูหลัก', 'Main navigation')}>{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className={s.headerActions}><div className={s.desktopLanguage}><LanguageSwitch /></div><a className={s.signIn} href="/login/">{tr('เข้าสู่ระบบ', 'Sign in')}</a><details className={s.mobileMenu} ref={menu} onKeyDown={event => { if (event.key === 'Escape') { closeMenu(); menu.current?.querySelector('summary')?.focus(); } }}><summary><Icon name="menu" /><span>{tr('เมนู', 'Menu')}</span></summary><nav aria-label={tr('เมนูมือถือ', 'Mobile navigation')}>{links.map(([href, label]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}<a href="/login/">{tr('เข้าสู่ระบบ', 'Sign in')}</a><LanguageSwitch /></nav></details></div>
    </div></header>
    <main id="main" tabIndex={-1}>
      <section className={`${s.hero} ${s.depthHero}`} aria-labelledby="hero-title">
        <div className={s.heroCopy}><p className={s.pill}><Icon name="calculator" />{tr('เห็นกำไร ก่อนตัดสินใจขาย', 'Know your profit before you sell')}</p><h1 id="hero-title">{tr('รู้กำไรจริงทุกออเดอร์', 'Know your real profit on every sale')}<span>{tr('ก่อนลดราคา', '— before you discount.')}</span></h1><p className={s.heroLead}>{tr('ยอดขายดี ไม่ได้แปลว่ามีกำไร รวมต้นทุน ค่าส่ง และค่าธรรมเนียมให้ครบ แล้วลองส่วนลดก่อนขายจริง', 'Strong sales do not always mean profit. Bring product costs, shipping and fees together, then try a discount before your next sale.')}</p><div className={s.actions}>{primary}<a className={s.secondary} href="#simulator"><Icon name="calculator" />{tr('ลองคำนวณส่วนลด', 'Try a discount')}</a></div></div>
        <HeroDepth locale={locale} />
      </section>
      <section className={s.heroProof} aria-label={tr('ตัวอย่างการดูกำไร', 'Example profit insights')}>
        <div className={s.heroStage}>
          <div className={s.alertStack}><article className={s.alertCard}><span className={s.alertIcon}><Icon name="calculator" /></span><div><p className={s.alertEyebrow}>{tr('เช็กก่อนลดราคา', 'CHECK BEFORE DISCOUNTING')}<span>{tr('ตัวอย่าง', 'Example')}</span></p><h2>{tr('ลด 15% อาจขายแล้วขาดทุน', '15% off can turn profit into a loss')}</h2><p>{tr('จาก ฿200 เหลือ ฿170 · ขาดทุน', '฿200 → ฿170 · Loss of')} <b>−฿5.50</b> {tr('ต่อชิ้น', 'per item')}</p><div className={s.alertFloor}><span>{tr('ราคาที่ไม่ขาดทุนในตัวอย่างนี้', 'Price that covers these example costs')}</span><strong>฿176.47</strong></div></div></article><div className={s.insightCard}><span className={s.iconTile}><Icon name="assistant" /></span><div><strong>{tr('เห็นเงินที่หัก ก่อนตั้งราคา', 'See the deductions before setting a price')}</strong><p>{tr('ต้นทุน ฿120 + ค่าส่ง ฿30 + ค่าธรรมเนียม ฿25.50', 'Cost ฿120 + shipping ฿30 + fees ฿25.50')}</p></div></div><p className={s.exampleCaption}><Icon name="calculator" />{tr('ตัวอย่างสมมติ · ค่าธรรมเนียม 15% ของราคาหลังลด', 'Illustrative example · 15% fee on the discounted price')}</p></div>
        </div>
      </section>
      <section className={s.channelStrip} aria-label={tr('ช่องทางขาย', 'Sales channels')}><div className={s.container}><p>{tr('รองรับการนำเข้าข้อมูลจาก', 'Import sales records from')}</p><div className={s.channelLogos}>{channels.map(channel => <div key={channel.name}><img src={`/assets/images/${channel.image}`} alt="" width="32" height="32" /><span>{channel.name}</span></div>)}<div><Icon name="products" /><span>{tr('หน้าร้าน', 'In-store')}</span></div></div><small>{tr('ใช้ไฟล์ตามแบบ MarginShot · ยังไม่เชื่อมต่อแพลตฟอร์มอัตโนมัติ', 'Use MarginShot file templates · No automatic platform connection')}</small></div></section>
      <section id="simulator" className={s.section} aria-labelledby="simulator-title"><div className={s.container}><div className={s.sectionHeading}><p className={s.eyebrow}>{tr('ลองคำนวณกำไร', 'DISCOUNT SIMULATOR')}</p><h2 id="simulator-title">{tr('ลดได้แค่ไหน', 'How far can you discount')}<br />{tr('ถึงยังเหลือกำไร?', 'and still make a profit?')}</h2><p>{tr('ปรับตัวเลข แล้วดูเงินที่เหลือทันที ก่อนเข้าร่วมโปรหรือเปลี่ยนราคาขาย', 'Adjust the numbers and see what you keep before joining a campaign or changing your price.')}</p></div><DiscountSimulator locale={locale} /></div></section>
      <section id="features" className={`${s.section} ${s.features}`} aria-labelledby="features-title"><div className={s.container}><div className={s.sectionHeading}><p className={s.eyebrow}>{tr('เครื่องมือสำหรับร้านเล็ก', 'TOOLS FOR YOUR SHOP')}</p><h2 id="features-title">{tr('เข้าใจตัวเลขร้าน', 'Understand your numbers.')}<br />{tr('ตัดสินใจขายได้ง่ายขึ้น', 'Make your next sale clearer.')}</h2><p>{tr('เริ่มจากข้อมูลที่มี แล้วค่อยเติมให้ครบ ไม่ต้องจำศัพท์บัญชี', 'Start with the records you have and fill in the gaps. No accounting vocabulary needed.')}</p></div><div className={s.featureGrid}>{features.map(feature => <article key={feature.icon}><span className={s.iconTile}><Icon name={feature.icon} /></span><h3>{feature.title}</h3><p>{feature.body}</p><a href={feature.href}>{feature.link}<Icon name="chevronRight" /></a></article>)}</div></div></section>
      {testimonial.approved && <section className={s.section}><div className={s.container}><figure className={s.testimonial}><blockquote>{testimonial.quote}</blockquote><figcaption>{testimonial.name} · {testimonial.role}</figcaption></figure></div></section>}
      {pricingPublished && <section id="pricing" className={`${s.section} ${s.pricing}`} aria-labelledby="pricing-title"><div className={s.container}><div><p className={s.eyebrow}>{tr('ราคาและแพ็กเกจ', 'PRICING')}</p><h2 id="pricing-title">{tr('รายละเอียดกำลังมา', 'Details are on their way')}</h2><p>{tr('ราคา แพ็กเกจ และโควตาการใช้งานยังอยู่ระหว่างกำหนด', 'Pricing, plans and usage limits are still being defined.')}</p></div><strong className={s.tbd}>[TBD]</strong></div></section>}
      <section id="faq" className={`${s.section} ${s.faq}`} aria-labelledby="faq-title"><div className={s.container}><div className={s.sectionHeading}><p className={s.eyebrow}>{tr('ก่อนเริ่มใช้งาน', 'BEFORE YOU START')}</p><h2 id="faq-title">{tr('คำถามที่พบบ่อย', 'A few things to know')}</h2></div><div className={s.faqList}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>)}</div></div></section>
      <section className={`${s.section} ${s.closing}`} aria-labelledby="closing-title"><div className={s.container}><h2 id="closing-title">{tr('รู้กำไรก่อนขายครั้งต่อไป', 'Know your profit before your next sale.')}</h2><p>{tr('ดูยอดขาย ต้นทุน และค่าธรรมเนียมของร้านในที่เดียว', 'Bring sales, costs and fees together in one place.')}</p><div className={s.actions}>{primary}<a className={s.textLink} href="#simulator">{tr('ลองคำนวณก่อน', 'Try the calculator first')}<Icon name="chevronRight" /></a></div></div></section>
    </main>
    <footer className={s.footer}><div className={s.container}><div className={s.footerGrid}><div className={s.footerBrand}><a className={s.brand} href="#main" aria-label="MarginShot"><Brand /></a><p>{tr('ตัวเลขที่เข้าใจง่าย สำหรับการดูแลร้านในทุกวัน', 'Clear numbers for the everyday work of your shop.')}</p></div><div><h2>{tr('เครื่องมือ', 'PRODUCT')}</h2><a href="#simulator">{tr('คำนวณส่วนลด', 'Discount calculator')}</a><a href="#features">{tr('ดูความสามารถ', 'Explore features')}</a></div><div><h2>{tr('ข้อมูลเพิ่มเติม', 'INFORMATION')}</h2>{pricingPublished && <a href="#pricing">{tr('ดูราคา', 'View pricing')}</a>}<a href="#faq">{tr('อ่านคำถามที่พบบ่อย', 'Read the FAQ')}</a></div>{contactPublished && <div><h2>{tr('ติดต่อและนโยบาย', 'CONTACT & POLICIES')}</h2><p>{tr('ช่องทางติดต่อ: [TBD]', 'Contact: [TBD]')}</p><p>{tr('นโยบายและเงื่อนไข: [TBD]', 'Privacy and terms: [TBD]')}</p></div>}</div><div className={s.footerBottom}><p>© {new Date().getFullYear()} MarginShot</p><LanguageSwitch /></div></div></footer>
  </div>;
}
