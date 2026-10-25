'use client';
import {useState} from 'react';
import bank from '../../lib/merchant-questions.json';
import s from './assistant.module.css';
export function MerchantQuestions({locale,choose}:{locale:'th'|'en';choose:(question:string)=>void}){
 const [search,setSearch]=useState(''),[category,setCategory]=useState('all');
 const categories=[...new Map(bank.questions.map(q=>[q.category,q.categoryLabel])).entries()];
 const filtered=bank.questions.filter(q=>(category==='all'||q.category===category)&&q.text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 return <div className={s.dialogBody}><p className={s.dialogNote}>{locale==='th'?'เลือกคำถามเพื่อใส่ในช่องพิมพ์ แก้ไขก่อนส่งได้':'Choose a question to draft, then review before sending.'}</p><label className="sr-only" htmlFor="merchant-question-search">{locale==='th'?'ค้นหาคำถาม':'Search questions'}</label><input id="merchant-question-search" type="search" placeholder={locale==='th'?'ค้นหา เช่น กำไร ส่วนลด แคปชั่น':'Search questions'} value={search} onChange={e=>setSearch(e.target.value)}/><div className={s.presets} role="group" aria-label={locale==='th'?'หมวดคำถาม':'Question categories'}><button type="button" aria-pressed={category==='all'} className={s.secondary} onClick={()=>setCategory('all')}>{locale==='th'?'ทั้งหมด':'All'}</button>{categories.map(([id,label])=><button type="button" className={s.secondary} key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</div><p className={s.dialogNote} role="status">{filtered.length} / 100 {locale==='th'?'คำถาม':'questions'}</p><div className={s.productChoices}>{filtered.map(q=><button type="button" key={q.id} onClick={()=>choose(q.text)}><span>{q.text}<small>{q.categoryLabel}{q.requiresProduct?(locale==='th'?' · เลือกสินค้าที่ต้องการคำนวณ':' · Select a product'):''}</small></span><span aria-hidden="true">↗</span></button>)}</div></div>;
}
