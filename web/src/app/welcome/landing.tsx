'use client';

import { useEffect, useRef, useState } from 'react';
import { LanguageSwitch, useLanguage } from '../language';
import { Brand, Icon } from '../ui';
import ChannelOrbit, { ChannelStrip } from './channel-orbit';
import { shopExample, storyContent, type StoryCopy } from './story-content';
import s from './landing.module.css';

const baht=(value:number)=>`${value<0?'−':''}฿${Math.abs(value).toLocaleString('en-US')}`;

/** Fixed illustration supplied in the brief, not a platform rate or financial engine. */
function DiscountExample({locale}:{locale:'th'|'en'}) {
 const ref=useRef<HTMLElement>(null);
 const [entered,setEntered]=useState(false);
 const tr=(th:string,en:string)=>locale==='th'?th:en;
 useEffect(()=>{
  if(!ref.current||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setEntered(true);observer.disconnect();}},{threshold:.25});
  observer.observe(ref.current);return()=>observer.disconnect();
 },[]);
 return <article ref={ref} id="discount-example" className={s.discountExample} data-entered={entered} aria-labelledby="discount-title" tabIndex={-1}>
  <div className={s.exampleHeading}><span className={s.exampleBrand}><Brand/></span><span>{tr('ตัวอย่าง · ต่อชิ้น','Example · per unit')}</span></div>
  <div className={s.exampleInputs}><span>{tr('ราคา','Price')} <b>฿200</b></span><span>{tr('ต้นทุนสินค้า','Product cost')} <b>฿120</b></span><span>{tr('ค่าส่ง','Shipping')} <b>฿30</b></span></div>
  <p className={s.assumption}>{tr('สมมติค่าธรรมเนียม 15% ของราคาขาย ไม่ใช่อัตราจริงของแพลตฟอร์ม','Assumed fee: 15% of selling price, not an actual platform rate.')}</p>
  <div className={s.profitComparison}><div><span>{tr('ขายราคาปกติ','At the normal price')}</span><strong><span className={s.srOnly}>฿20</span><span className={s.numberWindow} aria-hidden="true"><span className={s.numberReel}>{[0,5,10,15,20].map(n=><span key={n}>฿{n}</span>)}</span></span></strong><small>{tr('กำไรต่อชิ้น','profit per unit')}</small></div><div className={s.warning}><h2 id="discount-title">{tr('ลด 15% เหลือ ฿170','15% off → ฿170')}</h2><strong>−฿5.50</strong><small>{tr('ขาดทุนต่อชิ้น','loss per unit')}</small></div></div>
  <div className={s.safePrice}><span>{tr('ราคาที่ไม่ขาดทุน','Price that covers these costs')}</span><strong>฿176.47</strong></div>
  <div className={s.assistantSuggestion}><Icon name="assistant"/><p><b>{tr('ผู้ช่วยชี้ให้เห็น','Assistant example')}</b>{tr('ถ้าลดเกินประมาณ 11.8% จะขาดทุนต่อชิ้น','A discount above about 11.8% means a loss per unit.')}</p></div>
  <p className={s.exampleDisclaimer}>{tr('ตัวอย่างคงที่ · ปัดค่าธรรมเนียมเป็นสตางค์ · ยังไม่รวมค่าใช้จ่ายอื่นหรือภาษีที่ไม่ได้บันทึก','Static example · Fees rounded to satang · Other unrecorded costs and taxes excluded.')}</p>
 </article>;
}

function ProfitPreview({c,locale}:{c:StoryCopy;locale:'th'|'en'}) {
 return <div className={s.profitPreview}>
  <div className={s.previewHeading}><Icon name="overview"/><span>{c.mockTitle}</span><span>{c.example}</span></div>
  <div className={s.previewTotals}><div><span>{c.sales}</span><strong>{baht(shopExample.sales)}</strong></div><div><span>{c.profit}</span><strong>{baht(0)}</strong></div></div>
  <ul className={s.productRows}>{shopExample.products.map((row,index)=><li key={row.en}><span className={s.productIcon}><Icon name={index===0?'products':index===1?'orders':'receipt'}/></span><span>{row[locale]}</span><strong className={row.profit<0?s.loss:''}>{baht(row.profit)}</strong></li>)}</ul>
  <p className={s.previewFoot}>{c.example} · {c.mockPeriod} · {c.mockNote}</p>
 </div>;
}

export default function Landing() {
 const {locale}=useLanguage(),c=storyContent[locale];
 const tr=(th:string,en:string)=>locale==='th'?th:en;
 const start=tr('ลองใช้ฟรี','Try for free');
 const menu=useRef<HTMLDetailsElement>(null);
 const links=[['#story',tr('รู้จัก MarginSight','Product')],['#how',tr('วิธีใช้งาน','How it works')],['#benefits',tr('ช่วยอะไรได้บ้าง','Benefits')],['#pricing',tr('แพ็กเกจ','Pricing')],['#faq',tr('คำถามที่พบบ่อย','FAQ')]];
 const closeMenu=()=>{if(menu.current)menu.current.open=false;};
 const primary=<a className={s.primary} href="/login/">{start}<Icon name="arrow"/></a>;
 return <div className={s.page}>
  <a href="#main" className={s.skip}>{tr('ข้ามไปเนื้อหา','Skip to content')}</a>
  <header className={s.header}><div className={s.headerInner}>
   <a href="#main" aria-label="MarginSight" className={s.brand}><Brand/></a>
   <nav className={s.navigation} aria-label={tr('เมนูหลัก','Main navigation')}>{links.map(([href,label])=><a key={href} href={href}>{label}</a>)}</nav>
   <div className={s.headerActions}><div className={s.desktopLanguage}><LanguageSwitch/></div><a className={s.signIn} href="/login/">{tr('เข้าสู่ระบบ','Sign in')}</a><a className={s.headerCta} href="/login/">{start}</a><details ref={menu} className={s.mobileMenu} onKeyDown={event=>{if(event.key==='Escape'){closeMenu();menu.current?.querySelector('summary')?.focus();}}}><summary aria-label={tr('เปิดเมนู','Open menu')}><Icon name="menu"/></summary><nav aria-label={tr('เมนูมือถือ','Mobile navigation')}>{links.map(([href,label])=><a key={href} href={href} onClick={closeMenu}>{label}</a>)}<a href="/login/">{tr('เข้าสู่ระบบ','Sign in')}</a><LanguageSwitch/></nav></details></div>
  </div></header>
  <main id="main" tabIndex={-1}>
   <section className={s.hero} aria-labelledby="hero-title">
    <ChannelOrbit locale={locale} note={c.channelNote} backdrop>
     <div className={s.heroContent}><div className={s.heroCopy}>
      <p className={s.heroBadge}><Icon name="calculator"/>{tr('คำนวณกำไรต่อสินค้า · เริ่มจากไฟล์ของร้าน','Product profit · Start with your shop files')}</p>
      <h1 id="hero-title">{tr('รู้กำไรจริงทุกออเดอร์','See your real profit on every order,')}<span>{tr('ก่อนลดราคา','before you discount.')}</span></h1>
      <p>{tr('รวมยอดขาย ต้นทุน และเงินที่ถูกหักไว้ในที่เดียว ลองเปลี่ยนราคาก่อนขาย จะได้รู้ว่าเหลือกำไรเท่าไร','Bring sales, costs and deductions into one place. Try a different price before selling to see what you would keep.')}</p>
      <div className={s.actions}>{primary}<a href="#discount-example" className={s.secondary}>{tr('ดูตัวอย่าง','See the example')}<Icon name="chevronRight"/></a></div>
     </div><DiscountExample locale={locale}/></div>
    </ChannelOrbit>
   </section>
   <div className={s.channelStrip}><div className={s.container}><ChannelStrip locale={locale}/></div></div>

   <section id="story" className={`${s.section} ${s.story}`} aria-labelledby="story-title"><div className={s.container}><div className={s.sectionHeading}><h2 id="story-title">{tr('ขายดี แล้วเงินหายไปไหน?','Selling well. Where did the money go?')}</h2><p>{tr('ตัวอย่างหนึ่งวันของร้านเล็ก เมื่อรวมเงินที่จ่ายออกครบ','One illustrative shop day, with all recorded costs brought together.')}</p></div><ol className={s.storyFlow}>
    <li><Icon name="products"/><h3>{tr('ขายของ','Sell goods')}</h3><p>{tr('ออเดอร์มาจากหลายช่องทาง','Orders arrive across channels')}</p></li>
    <li><strong>฿10,000</strong><h3>{tr('เงินเข้า','Get paid')}</h3><p>{tr('ยอดขายก่อนหักค่าใช้จ่าย','Sales before costs')}</p></li>
    <li><Icon name="calculator"/><h3>{tr('ลองคิดให้ครบ','Add up the costs')}</h3><p>{tr('ต้นทุน ฿6,200 · ค่าธรรมเนียม ฿1,500 · ค่าส่ง ฿900 · โฆษณา ฿1,400','Costs ฿6,200 · Fees ฿1,500 · Shipping ฿900 · Ads ฿1,400')}</p></li>
    <li><strong>฿0</strong><h3>{tr('ขายดี แต่ไม่เหลือกำไร','Strong sales, no profit')}</h3><p>{tr('เงินเข้าเท่ากับเงินที่จ่าย','Sales and costs balance out')}</p></li>
    <li><Brand/><h3>{tr('เห็นว่าชิ้นไหนคุ้ม','See which items earn')}</h3><p>{tr('รวมข้อมูล แล้วดูกำไรแยกสินค้า','Bring records together, inspect each product')}</p><a href="#shop-example">{tr('ดูภาพรวมตัวอย่าง','See the shop example')}<Icon name="arrow"/></a></li>
   </ol></div></section>

   <section id="shop-example" className={`${s.section} ${s.overview}`} aria-labelledby="example-title"><div className={s.container}>
    <div className={s.sectionHeading}><h2 id="example-title">{tr('เห็นยอดขาย พร้อมเงินที่เหลือจริง','Your sales. And what is really left.')}</h2></div>
    <div className={s.overviewStage}><div className={s.overviewPreview}><div className={s.windowBar}><span/><span/><span/><span>MarginSight · {c.example}</span></div><ProfitPreview c={c} locale={locale}/></div>
     <div className={s.ledger}><div className={s.ledgerHeading}><Icon name="calculator"/><h3>{tr('ยอดขาย ไม่ใช่กำไร','Sales are not profit')}</h3><span>{c.example}</span></div>
      <dl><div className={s.salesLine}><dt>{c.sales}</dt><dd>{baht(shopExample.sales)}</dd></div>{c.costLabels.map((label,index)=><div key={label}><dt>{label}</dt><dd>−{baht(shopExample.costs[index])}</dd></div>)}<div className={s.netLine}><dt>{c.profit}</dt><dd>{baht(0)}</dd></div></dl>
      <p>{tr('ขายดี แล้วเหลือเท่าไร? เริ่มจากเห็นเงินที่หักไป','Selling well? Start by seeing what comes out.')}</p>
     </div>
    </div><p className={s.scope}>{c.scope}</p>
   </div></section>

   <section id="how" className={`${s.section} ${s.features}`} aria-labelledby="features-title"><div className={s.container}>
    <div className={s.sectionHeading}><h2 id="features-title">{c.howTitle}</h2><p>{c.howLead}</p></div>
    <ol className={s.featureGrid}>{c.steps.map(([title,body],index)=><li key={title}><span className={s.featureIcon}><Icon name={index===0?'upload':index===1?'receipt':'overview'}/></span><h3>{title}</h3><p>{body}</p><span className={s.featureDetail}>{[tr('CSV / Excel · ตรวจรายการก่อนนำเข้า','CSV / Excel · Review before importing'),tr('ต้นทุนที่ขาด แสดงให้รู้ว่าไม่ครบ','Missing costs are clearly flagged'),tr('ดูสินค้าและช่องทาง พร้อมที่มาของตัวเลข','Products, channels and source records')][index]}</span></li>)}</ol>
   </div></section>

   <section id="benefits" className={`${s.section} ${s.benefits}`} aria-labelledby="benefits-title"><div className={`${s.container} ${s.benefitsLayout}`}><h2 id="benefits-title">{c.benefitsTitle}</h2><ul>{c.benefits.map(([title,body])=><li key={title}><Icon name="check"/><div><h3>{title}</h3><p>{body}</p></div></li>)}</ul></div></section>

   <section id="assistant" className={`${s.section} ${s.assistant}`} aria-labelledby="assistant-title"><div className={`${s.container} ${s.assistantPanel}`}>
    <div className={s.assistantCopy}><span className={s.assistantMark}><Icon name="assistant"/></span><h2 id="assistant-title">{tr('ถามต่อจากตัวเลข','Go from numbers')}<br/>{tr('ด้วยภาษาที่คุณคุ้นเคย','to a conversation.')}</h2><p>{tr('อยากรู้ว่าตัวไหนคุ้ม หรือควรตรวจอะไรต่อ ลองถามผู้ช่วยจากข้อมูลและผลคำนวณของร้าน','Ask what is worth selling or what to check next. The assistant uses your shop records and calculation results.')}</p><a href="/login/" className={s.lightLink}>{start}<Icon name="arrow"/></a><small>{c.aiNote}</small></div>
    <div className={s.chatExample} aria-label={tr('ตัวอย่างบทสนทนา ไม่ใช่คำตอบสดจาก AI','Illustrative conversation, not a live AI response')}><p className={s.chatCaption}>{tr('ตัวอย่างบทสนทนา','Illustrative conversation')}</p><p className={s.question}>{tr('วันนี้ตัวไหนขายแล้วคุ้ม?','Which product was worth selling today?')}</p><div className={s.answer}><span><Icon name="assistant"/>MarginSight</span><p>{tr('ในข้อมูลตัวอย่าง กระเป๋าผ้าเหลือกำไร ฿500 ส่วนแก้วเซรามิกขาดทุน ฿700 ลองตรวจต้นทุนและเงินหักของแก้วก่อนตัดสินใจขายต่อ','In this example, canvas bags leave ฿500 profit, while ceramic mugs lose ฿700. Check the mug costs and deductions before deciding what to sell next.')}</p><a href="#shop-example">{tr('ดูตัวเลขที่ใช้ในตัวอย่าง','See the example records')}<Icon name="chevronRight"/></a></div></div>
   </div></section>

   <section id="pricing" className={`${s.section} ${s.pricing}`} aria-labelledby="pricing-title"><div className={s.container}>
    <div className={s.sectionHeading}><h2 id="pricing-title">{c.pricingTitle}</h2><p>{c.pricingNote}</p></div>
    <div className={s.planGrid}>{[false,true].map(premium=><article key={String(premium)} className={s.plan}><h3>{premium?c.premium:c.free}</h3><strong>{premium?c.premiumPrice:c.freePrice}</strong><ul>{(premium?c.premiumItems:c.freeItems).map(item=><li key={item}><Icon name="check"/>{item}</li>)}</ul></article>)}</div>
   </div></section>
   <section id="faq" className={`${s.section} ${s.faq}`} aria-labelledby="faq-title"><div className={`${s.container} ${s.faqGrid}`}><h2 id="faq-title">{c.faqTitle}</h2><div>{c.faqs.map(([title,body])=><details key={title}><summary>{title}<Icon name="plus"/></summary><p>{body}</p></details>)}</div></div></section>
   <section className={`${s.section} ${s.closing}`} aria-labelledby="closing-title"><div className={s.container}><h2 id="closing-title">{tr('ขายต่ออย่างเข้าใจ','Make your next sale')}<br/>{tr('เริ่มจากเห็นกำไรให้ชัด','with your numbers in sight.')}</h2><p>{c.closeBody}</p><div className={s.actions}>{primary}<a className={s.textLink} href="#how">{tr('ดูตัวอย่างก่อน','See an example first')}<Icon name="chevronRight"/></a></div><small>{c.closeNote}</small></div></section>
  </main>
  <footer className={s.footer}><div className={s.container}><div className={s.footerGrid}><div className={s.footerBrand}><Brand/><p>{c.footer}</p></div><div><h3>{tr('รู้จัก MarginSight','Explore MarginSight')}</h3><a href="#how">{tr('วิธีใช้งาน','How it works')}</a><a href="#benefits">{tr('ความสามารถ','Features')}</a><a href="#pricing">{tr('แพ็กเกจ','Plans')}</a></div><div><h3>{tr('ข้อมูลก่อนเริ่ม','Before you start')}</h3><a href="/templates/orders.csv" download>{tr('แบบฟอร์มยอดขาย CSV','Sales CSV template')}</a><a href="/templates/costs.csv" download>{tr('แบบฟอร์มต้นทุน CSV','Cost CSV template')}</a><details><summary>{c.privacy}</summary><p>{c.privacyDetail}</p></details><details><summary>{c.contact}</summary><p>{c.contactDetail}</p></details></div></div><div className={s.footerBottom}><span>© MarginSight</span><p>{tr('ชื่อและโลโก้ช่องทางเป็นของเจ้าของเครื่องหมายการค้า ไม่ได้แสดงถึงการเป็นพันธมิตร การรับรอง หรือการเชื่อมต่ออย่างเป็นทางการ','Channel names and logos belong to their owners. No partnership, endorsement or official integration is implied.')}</p></div></div></footer>
 </div>;
}
