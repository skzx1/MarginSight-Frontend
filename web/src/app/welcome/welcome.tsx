'use client';

import { useEffect, useRef, useState } from 'react';
import { LanguageSwitch, useLanguage } from '../language';
import { Brand, Icon } from '../ui';
import { Money } from '../components/ledger';
import { channels, content } from './content';
import s from './welcome.module.css';

function ProfitNumber() {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(2586);
  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - start) / 750, 1);
        setValue(Math.round(2586 * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.5 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <span ref={ref} role="img" aria-label="฿2,586.00"><span aria-hidden="true"><Money value={value * 100} /></span></span>;
}

export default function Welcome() {
  const { locale } = useLanguage();
  const c = content[locale];
  const cta = (light = false) => <a href="/login/" className={`button-link ${s.cta} ${light ? s.lightCta : ''}`}>{c.cta}<Icon name="arrow" /></a>;
  const rows = [[c.costs, 140000], [c.fees, 52000], [c.shipping, 22000]] as const;

  return <div className={s.page}>
    <a className={s.skip} href="#main">{c.skip}</a>
    <header className={s.header}>
      <div className={s.headerInner}>
        <a className={s.brandLink} href="#main" aria-label="MarginSight"><Brand /></a>
        <nav className={s.navigation} aria-label={locale === 'th' ? 'เมนูเว็บไซต์' : 'Website navigation'}>
          {['how-it-works', 'assistant', 'pricing'].map((id, index) => <a key={id} href={`#${id}`}>{c.nav[index]}</a>)}
          <a href="/login/">{c.loginLabel}</a>
        </nav>
        <div className={s.headerActions}><LanguageSwitch />{cta()}</div>
      </div>
    </header>

    <main id="main" tabIndex={-1}>
      <section className={`${s.hero} ${s.container}`} aria-labelledby="hero-title">
        <div className={s.heroCopy}>
          <h1 id="hero-title">{c.headline[0]}<br />{c.headline[1]}<br /><span>{c.headline[2]}</span></h1>
          <p className={s.intro}>{c.intro}</p>
          <div className={s.actions}>{cta()}<a className={s.demoLink} href="#product-demo">{c.demo}<Icon name="arrow" /></a></div>
          <p className={s.smallNote}><Icon name="check" />{c.heroNote}</p>
        </div>
        <figure className={s.productFigure} id="product-demo">
          <figcaption>{c.demoLabel}</figcaption>
          <div className={s.dashboard}>
            <div className={s.dashboardBar}><span className={s.shopMark}><Icon name="overview" />{c.shop}</span><span className="badge mock">MOCK</span></div>
            <div className={s.dashboardBody}>
              <div className={s.dashboardHeading}><h2>{c.overview}</h2><span>{c.period}</span></div>
              <div className={s.dashboardTotals}>
                <div><span>{c.sales}</span><strong><Money value={472600} /></strong></div>
                <div className={s.heroProfit}><span>{c.keep}</span><strong><ProfitNumber /></strong><small>{c.recorded}</small></div>
              </div>
              <div className={s.miniStrip} aria-hidden="true"><span /><span /><span /><span /></div>
              <dl className={s.miniDeductions}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><Money value={value} /></dd></div>)}</dl>
              <div className={s.productListHeading}><span>{c.product}</span><span>{c.productProfit}</span></div>
              {[11100, 22100, 8900].map((value, index) => <div key={value} className={s.productRow}><span className={s.productGlyph}><Icon name="products" /></span><span>{c.products[index]}<small>{channels[index]}</small></span><strong><Money value={value} /></strong></div>)}
              <p className={s.selected}>{c.selected}</p>
              <div className={s.missing}><Icon name="receipt" /><div><strong>{c.missing}</strong><small>{c.missingNote}</small></div></div>
            </div>
          </div>
          <p className={s.figureNote}>{c.scope}</p>
        </figure>
      </section>

      <section className={s.problem} aria-labelledby="problem-title">
        <div className={s.container}>
          <div className={s.sectionIntro}><h2 id="problem-title">{c.problemTitle}</h2><p>{c.problemBody}</p></div>
          <div className={s.profitJourney}>
            <div className={s.journeySales}><span>{c.salesFlow}</span><strong><Money value={472600} /></strong></div>
            <div className={s.journeyDeductions}>{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>−<Money value={value} /></strong></div>)}</div>
            <div className={s.journeyProfit}><span>{c.profitFlow}</span><strong><Money value={258600} /></strong></div>
          </div>
          <div className={s.flowStrip} role="img" aria-label={locale === 'th' ? 'ยอดขาย 4,726 บาท แบ่งเป็นต้นทุน 1,400 ค่าบริการ 520 ค่าส่ง 220 และกำไร 2,586 บาท' : 'Sales of 4,726 baht: costs 1,400, fees 520, shipping 220 and profit 2,586 baht'}><span /><span /><span /><span /></div>
          <p className={s.flowNote}>{c.example} · {c.scope}</p>
        </div>
      </section>

      <section id="how-it-works" className={`${s.how} ${s.container}`} aria-labelledby="how-title">
        <div className={s.sectionIntro}><h2 id="how-title">{c.howTitle}</h2><p>{c.howBody}</p></div>
        <ol className={s.steps}>{c.steps.map(([title, body], index) => <li key={title}><span className={s.stepNumber}>{index + 1}</span><Icon name={(['upload', 'products', 'overview'] as const)[index]} /><h3>{title}</h3><p>{body}</p></li>)}</ol>
      </section>

      <section className={`${s.benefits} ${s.container}`} aria-labelledby="benefits-title">
        <h2 id="benefits-title">{c.benefitsTitle}</h2>
        <div className={s.featureRow}>
          <div className={s.featureCopy}><h3>{c.benefitOne}</h3><p>{c.benefitOneBody}</p></div>
          <div className={s.itemExample}>
            <div className={s.itemTitle}><Icon name="products" /><strong>{c.products[0]}</strong><span className="badge mock">MOCK</span></div>
            <dl><div><dt>{c.sales}</dt><dd><Money value={29000} /></dd></div><div><dt>{c.costs}</dt><dd>−<Money value={13000} /></dd></div><div><dt>{c.fees}</dt><dd>−<Money value={2900} /></dd></div><div><dt>{c.shipping}</dt><dd>−<Money value={2000} /></dd></div><div className={s.itemProfit}><dt>{c.productProfit}</dt><dd><Money value={11100} /></dd></div></dl>
          </div>
        </div>
        <div className={`${s.featureRow} ${s.reverse}`}>
          <div className={s.featureCopy}><h3>{c.benefitTwo}</h3><p>{c.benefitTwoBody}</p></div>
          <div className={s.channelExample}><p>{c.channelHeading}</p>{[...channels, c.inStore].map((name, index) => <div key={name}><span>{name}</span><span className={s.channelTrack} aria-hidden="true"><span style={{ width: `${[100, 77, 45, 24, 10][index]}%` }} /></span><strong><Money value={[101000, 78000, 45600, 24000, 10000][index]} /></strong></div>)}</div>
        </div>
        <div className={s.simpleFeature}><div><h3>{c.benefitThree}</h3><p>{c.benefitThreeBody}</p></div><div className={s.fileVisual}><Icon name="upload" /><strong>{c.fileName}</strong><span>{c.fileState}</span></div></div>
      </section>

      <section className={s.midCta} aria-labelledby="mid-title"><div className={s.container}><div><h2 id="mid-title">{c.midTitle}</h2><p>{c.midBody}</p></div>{cta()}</div></section>

      <section id="assistant" className={`${s.assistant} ${s.container}`} aria-labelledby="ai-title">
        <div className={s.featureCopy}><h2 id="ai-title">{c.aiTitle}</h2><p>{c.aiBody}</p><p className={s.lineNote}><Icon name="line" />{c.aiLine}</p></div>
        <div className={s.chat}>
          <div className={s.chatHeader}><span className={s.chatAvatar}><Icon name="assistant" /></span><div><strong>MarginSight</strong><small>{c.chatLabel}</small></div></div>
          <div className={s.chatBody}><p className={s.chatContext}>{c.chatProduct}</p><p className={s.chatQuestion}>{c.question}</p><div className={s.chatAnswer}><p>{c.answer}</p><div className={s.chatComparison}><div><span>{c.original}</span><strong className="money">฿9.00</strong></div><Icon name="arrow" /><div><span>{c.discounted}</span><strong className={`money ${s.loss}`}>{c.loss}</strong></div></div><p>{c.answerNote}</p><small>{c.evidence}</small></div></div>
        </div>
      </section>

      <section className={s.channelSection} aria-labelledby="channels-title"><div className={s.container}><h2 id="channels-title">{c.channelsTitle}</h2><p>{c.channelsBody}</p><ul className={s.sourceBadges}>{[...channels, c.inStore].map(name => <li key={name}>{name}</li>)}</ul><p className={s.channelNote}>{c.channelsNote}</p></div></section>

      <section id="pricing" className={`${s.pricing} ${s.container}`} aria-labelledby="pricing-title">
        <div className={s.sectionIntro}><h2 id="pricing-title">{c.pricingTitle}</h2><p>{c.pricingBody}</p></div>
        <div className={s.priceGrid}><article className={s.priceCard}><h3>{c.free}</h3><p className={s.price}>{c.freePrice}</p><p>{c.freeNote}</p><ul>{c.freeItems.map(item => <li key={item}><Icon name="check" />{item}</li>)}</ul>{cta()}</article><article className={`${s.priceCard} ${s.premium}`}><h3>{c.premium}</h3><p className={s.price}>{c.premiumPrice}</p><p>{c.premiumNote}</p><ul>{c.premiumItems.map(item => <li key={item}>{item}</li>)}</ul><span className={s.upcoming}>{c.upcoming}</span></article></div>
      </section>

      <section className={`${s.faq} ${s.container}`} aria-labelledby="faq-title"><h2 id="faq-title">{c.faqTitle}</h2><div>{c.faqs.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>)}</div></section>

      <section className={s.closing} aria-labelledby="close-title"><div className={s.container}><div className={s.closingStrip} aria-hidden="true"><span /><span /><span /><span /></div><h2 id="close-title">{c.closeTitle}</h2><p>{c.closeBody}</p><div className={s.actions}>{cta(true)}<a className={s.closingDemo} href="#product-demo">{c.demo}<Icon name="arrow" /></a></div><small>{c.closeNote}</small></div></section>
    </main>

    <footer className={`${s.footer} ${s.container}`}><div className={s.footerTop}><div><Brand /><p>{c.footerBody}</p></div><a className={s.demoLink} href="/login/">{c.app}<Icon name="arrow" /></a></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} MarginSight</span><details><summary>{c.contact}</summary><p>{c.contactBody}</p></details><details><summary>{c.legal}</summary><p>{c.legalBody}</p></details><LanguageSwitch /></div></footer>
  </div>;
}
