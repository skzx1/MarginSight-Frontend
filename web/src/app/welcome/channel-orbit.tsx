'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Brand } from '../ui';
import s from './channel-orbit.module.css';

// Latest brief restricts artwork to /public/brands/. No approved files supplied there.
// Do not silently reuse assets/images or treat the LINE messaging logo as LINE Shop.
const channels:ReadonlyArray<{name:string;image:string|null;art:string;tint:string|null}> = [
 { name:'Shopee', image:null, art:'shopee', tint:null },
 { name:'Lazada', image:null, art:'lazada', tint:null },
 { name:'TikTok Shop', image:null, art:'tiktok', tint:null },
 { name:'LINE Shop', image:null, art:'placeholder', tint:null },
] as const;

export default function ChannelOrbit({locale, note, compact=false, hero=false, backdrop=false, children}:{locale:'th'|'en';note:string;compact?:boolean;hero?:boolean;backdrop?:boolean;children?:ReactNode}) {
 const root=useRef<HTMLDivElement>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [highlighted,setHighlighted]=useState<string|null>(null);
 const [paused,setPaused]=useState(false);
 const [motionAvailable,setMotionAvailable]=useState(false);
 const [failed,setFailed]=useState<string[]>([]);
 useEffect(()=>{
  const node=root.current;
  if(!node || !('IntersectionObserver' in window))return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false;
  const sync=()=>{
   const active=visible&&!motion.matches&&!document.hidden&&!node.closest('[inert]')&&getComputedStyle(node).visibility==='visible';
   node.dataset.moving=String(active);
   if(active)node.dataset.entered='true';
   setMotionAvailable(!motion.matches);
  };
  // Observe this visual, rather than the whole multi-beat sticky story.
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1});
  observer.observe(node);
  const storyStage=node.closest('[data-stage]');
  const storyObserver=storyStage?new MutationObserver(sync):null;
  if(storyStage)storyObserver?.observe(storyStage,{subtree:true,attributes:true,attributeFilter:['data-active','inert']});
  const outside=(event:PointerEvent)=>{if(!node.contains(event.target as Node))setSelected(null);};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
  sync();
  return()=>{observer.disconnect();storyObserver?.disconnect();document.removeEventListener('pointerdown',outside);document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);};
 },[]);

 return <div ref={root} className={`${s.orbitGroup} ${compact?s.compact:''} ${hero?s.hero:''} ${backdrop?s.backdrop:''}`} data-paused={paused||selected!==null} data-selected={selected??undefined}>
  <p className={s.intro}>{locale==='th'?'รองรับการนำเข้าข้อมูลจาก':'Supports importing data from'}</p>
  <div className={s.board}>
   <div className={s.plane} role="group" aria-label={locale==='th'?'ช่องทางขายที่รองรับ: Shopee, Lazada, TikTok Shop, LINE Shop':'Supported sales channels: Shopee, Lazada, TikTok Shop, LINE Shop'}>
   <div className={s.glow} aria-hidden="true"/>
   <div className={s.ring} aria-hidden="true"/><div className={`${s.ring} ${s.innerRing}`} aria-hidden="true"/>
   <div className={s.rotor}>
    {channels.map((channel,index)=>{
     const image=channel.image&&!failed.includes(channel.name)?channel.image:null;
     return <div key={channel.name} className={s.slot} data-slot={index}>
      <div className={s.upright}><div className={s.arrival} style={{'--arrival':`${index*90}ms`} as CSSProperties}>
       <button type="button" className={s.logoButton} data-art={channel.art} aria-label={channel.name} aria-pressed={selected===channel.name}
        onClick={()=>setSelected(selected===channel.name?null:channel.name)}
        onPointerEnter={event=>{if(event.pointerType==='mouse')setHighlighted(channel.name);}}
        onPointerLeave={event=>{if(event.pointerType==='mouse'){setSelected(null);setHighlighted(null);}}}
        onFocus={()=>setHighlighted(channel.name)}
        onBlur={()=>{setSelected(null);setHighlighted(null);}}
        onKeyDown={event=>{if(event.key==='Escape'){setSelected(null);event.currentTarget.blur();}}}>
        {image?<img src={image} alt={channel.name} width="96" height="96" decoding="async" onError={()=>setFailed(current=>current.includes(channel.name)?current:[...current,channel.name])}/>:<span className={s.placeholder}>{channel.name}</span>}
       </button>
      </div></div>
     </div>;
    })}
   </div>
   {/* Brand accents are overlays: only opacity changes; artwork remains untouched. */}
   {channels.filter(channel=>channel.tint).map(channel=><div key={channel.name} className={s.brandAccent} data-brand={channel.name} style={{'--brand-tint':channel.tint} as CSSProperties} aria-hidden="true"/>)}
   </div>
   {children?<div className={s.centerContent}>{children}</div>:<div className={s.center} aria-hidden="true"><Brand/></div>}
  </div>
  <div className={s.tooltipZone} aria-hidden="true"><span data-visible={Boolean(selected||highlighted)}>{selected||highlighted||'\u00a0'}</span></div>
  <p className={s.names} aria-hidden="true">{channels.map((channel,index)=><span key={channel.name}>{index>0?' · ':''}{channel.name}</span>)}</p>
  <div className={s.controlSlot}>{motionAvailable&&<button type="button" className={s.motionControl} aria-pressed={paused} onClick={()=>{setPaused(!paused);setSelected(null);}}>{locale==='th'?(paused?'เล่นการเคลื่อนไหว':'พักการเคลื่อนไหว'):(paused?'Resume motion':'Pause motion')}</button>}</div>
  <p className={s.importNote}>{note}</p>
 </div>;
}

export function ChannelStrip({locale}:{locale:'th'|'en'}) {
 const [failed,setFailed]=useState<string[]>([]);
 return <div className={s.strip}>
  <p>{locale==='th'?'รองรับการนำเข้าข้อมูลจาก':'Supports importing data from'}</p>
  <ul>{channels.map(channel=><li key={channel.name}><span className={s.stripLogo} data-art={channel.art} aria-hidden="true">
   {channel.image&&!failed.includes(channel.name)?<img src={channel.image} alt={channel.name} width="48" height="48" loading="lazy" onError={()=>setFailed(current=>[...current,channel.name])}/>:<span>{channel.name}</span>}
  </span><span>{channel.name}</span></li>)}<li><span className={s.stripLogo} aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10q3 4 6 0 3 4 6 0 3 4 6 0M9 21v-7h6v7"/></svg></span><span>{locale==='th'?'หน้าร้าน':'In-store'}</span></li></ul>
 </div>;
}
