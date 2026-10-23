'use client';
import { useEffect, useRef, type MouseEvent } from 'react';
import { Icon } from '../ui';
import ChannelOrbit from './channel-orbit';
import { shopExample, type StoryCopy } from './story-content';
import s from './welcome.module.css';

export const baht = (value:number) => `${value < 0 ? '−' : ''}฿${Math.abs(value).toLocaleString('en-US')}`;

function ShopArt({label,quiet=false}:{label:string;quiet?:boolean}) {
 return <svg className={s.shopArt} viewBox="0 0 440 290" role="img" aria-label={label}>
  <ellipse cx="220" cy="275" rx="182" ry="8" fill="var(--pale)"/>
  <path d="M72 111h296v156H72z" fill="var(--surface)" stroke="var(--olive-deep)" strokeWidth="3"/>
  <path d="m62 109 28-62h260l28 62" fill="var(--pale)" stroke="var(--olive-deep)" strokeWidth="3" strokeLinejoin="round"/>
  {[0,1,2,3,4,5].map(i=><path key={i} d={`M${62+i*52.6} 109v15q26.3 25 52.6 0v-15`} fill={i%2?'var(--surface)':'var(--olive)'} stroke="var(--olive-deep)" strokeWidth="2"/>)}
  <rect x="128" y="22" width="184" height="40" rx="8" fill="var(--forest)"/>
  <path d="M182 49V34l14 11 14-11v15M230 34h28m-28 8h28m-28 7h18" stroke="var(--surface)" strokeWidth="3" fill="none" strokeLinecap="round"/>
  <path d="M110 152h54m-54 31h54" stroke="var(--pale)" strokeWidth="5"/>
  <rect x="116" y="158" width="18" height="22" rx="3" fill="var(--olive-light)"/><rect x="140" y="154" width="18" height="26" rx="3" fill="var(--pale)"/>
  <path d="M196 209v-26q0-27 29-27t29 27v26" fill="var(--olive)"/>
  <circle cx="225" cy="137" r="23" fill="var(--canvas)" stroke="var(--olive-deep)" strokeWidth="2"/>
  <path d="M203 136q-5-34 22-29t22 27l-9-11q-14 10-35 6" fill="var(--forest)"/>
  <path d={quiet?'M218 146h13':'M217 143q8 9 16 0'} fill="none" stroke="var(--olive-deep)" strokeWidth="2" strokeLinecap="round"/>
  <circle cx="216" cy="137" r="1.5" fill="var(--forest)"/><circle cx="234" cy="137" r="1.5" fill="var(--forest)"/>
  <rect x="95" y="208" width="250" height="59" rx="5" fill="var(--pale)" stroke="var(--olive-deep)" strokeWidth="2"/>
  <path d="M112 225h44m-44 9h27" stroke="var(--olive-deep)" strokeWidth="2" strokeLinecap="round"/>
  <g className={s.parcels}><path d="m285 173 23-12 23 12v34h-46z" fill="var(--surface)" stroke="var(--olive-deep)" strokeWidth="2"/><path d="M308 162v44m-23-33 23 13 23-13" fill="none" stroke="var(--olive-deep)" strokeWidth="2"/></g>
  {quiet&&<g><path d="m199 195 24-7 25 7v20l-25-6-24 6z" fill="var(--surface)" stroke="var(--olive-deep)" strokeWidth="2"/><path d="M223 189v20" stroke="var(--olive-deep)" strokeWidth="2"/></g>}
 </svg>;
}

function MoneyArt({label}:{label:string}) {
 return <svg className={s.moneyArt} viewBox="0 0 400 180" role="img" aria-label={label}>
  <g className={s.notes}><rect x="75" y="44" width="235" height="112" rx="12" transform="rotate(-7 192 100)" fill="var(--pale)" stroke="var(--olive-deep)" strokeWidth="2"/><rect x="82" y="57" width="235" height="112" rx="12" fill="var(--surface)" stroke="var(--olive-deep)" strokeWidth="2"/><rect x="96" y="70" width="207" height="86" rx="7" fill="var(--sage)" stroke="var(--olive)" strokeWidth="1.5"/><circle cx="200" cy="113" r="29" fill="var(--pale)"/><text x="200" y="127" textAnchor="middle" fill="var(--forest)" fontSize="39" fontFamily="Anuphan,sans-serif">฿</text></g>
  <g className={s.coins} fill="var(--pale)" stroke="var(--olive-deep)" strokeWidth="2">{[0,1,2].map(i=><g key={i} transform={`translate(${i*17},${-i*15})`}><ellipse cx="302" cy="157" rx="24" ry="9"/><path d="M278 148v9q24 18 48 0v-9"/><ellipse cx="302" cy="148" rx="24" ry="9"/></g>)}</g>
 </svg>;
}

export function ExampleDashboard({c,locale,cta}:{c:StoryCopy;locale:'th'|'en';cta:string}) {
 return <div className={s.mockDashboard}>
  <div className={s.mockHead}><span><Icon name="overview"/>{c.mockTitle}</span><small>{c.example}</small></div>
  <div className={s.mockTotals}><div><span>{c.sales}</span><strong>{baht(10000)}</strong></div><div><span>{c.profit}</span><strong>{baht(0)}</strong></div></div>
  <div className={s.mockTools}><fieldset className={s.mockTabs}><legend className={s.srOnly}>{c.productTab} / {c.channelTab}</legend>
   <input id="example-products" type="radio" name="example-view" value="products" defaultChecked/><label htmlFor="example-products">{c.productTab}</label>
   <input id="example-channels" type="radio" name="example-view" value="channels"/><label htmlFor="example-channels">{c.channelTab}</label>
  </fieldset><a className={s.cta} href="/login/">{cta}<Icon name="arrow"/></a></div>
  <div className={s.mockTables}>{[shopExample.products,shopExample.channels].map((records,i)=><table key={i} className={i===0?s.productTable:s.channelTable}>
   <caption className={s.srOnly}>{i===0?c.productTab:c.channelTab} · {c.mockPeriod}</caption>
   <thead><tr><th scope="col">{i===0?c.productTab:c.channelTab}</th><th scope="col">{c.tableSales}</th><th scope="col">{c.tableProfit}</th></tr></thead>
   <tbody>{records.map(row=><tr key={row.en}><th scope="row">{row[locale]}</th><td>{baht(row.sales)}</td><td><strong>{baht(row.profit)}</strong></td></tr>)}</tbody>
  </table>)}</div><small>{c.mockNote}</small>
 </div>;
}

/** Native scrolling, no wheel/touch interception. CSS owns layout; JS only selects scenes and numeric states. */
export default function ShopStory({c,locale,cta,demo}:{c:StoryCopy;locale:'th'|'en';cta:string;demo:string}) {
 const root=useRef<HTMLElement>(null);
 const seeExample=(event:MouseEvent<HTMLAnchorElement>)=>{
  const node=root.current;if(!node?.dataset.enhanced)return;
  event.preventDefault();
  const bounds=node.getBoundingClientRect(),stage=node.querySelector<HTMLElement>('[data-stage]')!;
  window.scrollTo({top:scrollY+bounds.top-document.querySelector('header')!.clientHeight+(bounds.height-stage.clientHeight)*.24,behavior:'auto'});
  // Wait for scene selection before focusing a target that was previously inert.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const target=node.querySelector<HTMLElement>('#story-example');
   if(root.current===node&&target?.closest('[data-active=true]'))target.focus({preventScroll:true});
  }));
 };
 useEffect(()=>{
  const node=root.current;if(!node || !('IntersectionObserver' in window))return;
  const panels=Array.from(node.querySelectorAll<HTMLElement>('[data-beat]'));
  const money=node.querySelector<HTMLElement>('[data-sales-number]');
  const left=node.querySelector<HTMLElement>('[data-remaining-number]');
  const ledger=node.querySelector<HTMLElement>('[data-cost-step]');
  const progress=node.querySelector<HTMLElement>('[data-progress]');
  const dots=Array.from(node.querySelectorAll<HTMLElement>('[data-dot]'));
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,enabled=false,visible=false,disposed=false,active=-1;
  const reset=()=>{enabled=false;delete node.dataset.enhanced;panels.forEach(p=>{p.inert=false;delete p.dataset.active;});if(money)money.textContent=baht(10000);if(left)left.textContent=baht(0);if(ledger)ledger.dataset.costStep='4';};
  const update=()=>{
   frame=0;if(!enabled)return;
   const bounds=node.getBoundingClientRect(),stage=node.querySelector<HTMLElement>('[data-stage]')!;
   const header=document.querySelector('header')!.getBoundingClientRect().height;
   const p=Math.max(0,Math.min(1,(header-bounds.top)/(bounds.height-stage.clientHeight)));
   const index=Math.min(4,Math.floor(p*5)),local=Math.min(1,p*5-index);
   if(index!==active){active=index;panels.forEach((panel,i)=>{panel.dataset.active=String(i===index);panel.inert=i!==index;});dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');});}
   node.style.setProperty('--beat-progress',String(local));
   if(progress)progress.style.transform=`scaleX(${p})`;
   if(money)money.textContent=baht(Math.round(10000*Math.min(1,local*2.5)));
   const step=index===2?Math.min(4,Math.floor(local*5)):4;
   if(ledger)ledger.dataset.costStep=String(step);
   if(left)left.textContent=baht(shopExample.balances[step]);
  };
  const queue=()=>{if(enabled&&visible&&!frame)frame=requestAnimationFrame(update);};
  const measure=()=>{
   reset();active=-1;
   // Short viewports / enlarged text keep the fully readable static document.
   if(motion.matches || innerHeight<650 || document.documentElement.clientWidth<320)return;
   const height=parseFloat(getComputedStyle(panels[0]).minHeight);
   if(!Number.isFinite(height)||height<=0||panels.some(p=>p.getBoundingClientRect().height>height+2))return;
   node.dataset.enhanced='true';enabled=true;update();
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;queue();},{rootMargin:'100px'});observer.observe(node);
  // Reserve the same five scene heights before enhancement; wait for final font metrics.
  void document.fonts.ready.then(()=>{if(!disposed)measure();});
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',measure);motion.addEventListener('change',measure);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',queue);window.removeEventListener('resize',measure);motion.removeEventListener('change',measure);reset();};
 },[locale]);
 return <section ref={root} id="story" className={s.story} aria-label={locale==='th'?'ยอดขายดี แล้วเหลือเท่าไร?':'Strong sales. What do you keep?'}>
  <div className={`${s.srOnly} ${s.storySummary}`}><p>{c.fullEquation}</p><ol>{c.beats.map(([title,sentence])=><li key={title}>{title}. {sentence}</li>)}</ol></div>
  <div data-stage className={s.stage}>
   <div className={s.storyToolbar}><span>{c.example} · ฿10,000</span><a href="#after-story">{c.skipStory}<Icon name="arrow"/></a></div>
   {c.beats.map(([title,sentence],i)=><article data-beat={i} className={`${s.beat} ${i===0?s.orbitBeat:''}`} key={i}>
    <div className={s.beatCopy}><span className={s.stepLabel}>0{i+1} / 05</span>{i===0?<h1>{title}</h1>:<h2>{title}</h2>}<p>{sentence}</p>
     {i===0&&<a className={s.secondary} href="#story-example" onClick={seeExample}>{demo}<Icon name="arrow"/></a>}
    </div>
    <div className={s.beatVisual} id={i===1?'story-example':undefined} tabIndex={i===1?-1:undefined}>
     {i===0&&<ChannelOrbit locale={locale} note={c.channelNote}/>}
     {i===1&&<div className={s.moneyScene}><span>{c.sales} · {c.example}</span><strong data-sales-number aria-hidden="true">{baht(10000)}</strong><span className={s.srOnly}>{baht(10000)}</span><MoneyArt label={c.moneyArt}/></div>}
     {i===2&&<div className={s.costLedger} data-cost-step="4"><div className={s.ledgerHeading}><Icon name="calculator"/><span>{c.sales}</span><strong>{baht(10000)}</strong></div><ol>{c.costLabels.map((label,j)=><li key={label} data-cost={j}><span>{label}</span><strong>−{baht(shopExample.costs[j])}</strong><Icon name="check"/></li>)}</ol><div className={s.remaining}><span>{c.remaining}</span><strong data-remaining-number aria-hidden="true">{baht(0)}</strong><span className={s.srOnly}>{c.fullEquation}</span></div><div className={s.balanceTrack} aria-hidden="true"><span/></div></div>}
     {i===3&&<div className={s.zeroScene}><span>{c.profit}</span><strong>{baht(0)}</strong><p>{c.zeroNote}</p><ShopArt label={c.zeroArt} quiet/><small>{c.zeroHelper}</small></div>}
     {i===4&&<ExampleDashboard c={c} locale={locale} cta={cta}/>}
    </div>
   </article>)}
   <div className={s.storyProgress}><span>{c.scroll}</span><ol aria-label={c.progress}>{c.beats.map(([title],i)=><li data-dot key={title} aria-label={`${i+1}. ${title}`}/>)}</ol><div className={s.progressTrack} aria-hidden="true"><span data-progress/></div></div>
  </div>
 </section>;
}
