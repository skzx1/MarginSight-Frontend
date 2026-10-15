import { Icon } from './ui';
const money = (v: number | null) => v === null ? 'ไม่ทราบ' : new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(v / 100);
export default function DashboardSummary({
  data,
  products,
  onNavigate
}: {
  data: any;
  products: any[];
  onNavigate: (view: number) => void;
}) {
  const missing = products.filter(p => !p.cost).length;
  const width = (value: number | null) => data.revenueSatang > 0 && value !== null ? Math.max(0, Math.min(100, value / data.revenueSatang * 100)) : 0;
  return <>
  <div className="row"><span className={'badge ' + (data.dataOrigin === 'MOCK' ? 'mock' : '')}>{data.dataOrigin === 'MOCK' ? 'ข้อมูลจำลอง' : 'ข้อมูลจริง'}</span><span className="section-label">{data.completeOrders} จาก {data.totalOrders} ออเดอร์มีข้อมูลครบ · ยังไม่รวมค่าใช้จ่ายประจำร้าน</span></div>
  <div className="metrics hero">
   <article className={data.profitSatang !== null && data.profitSatang < 0 ? 'negative-card' : ''}><div className="metric-label"><small>กำไรส่วนที่บันทึก</small><Icon name="simulation" /></div><strong>{data.profitSatang === null ? 'ไม่ทราบ' : '฿' + money(data.profitSatang)}</strong><span className="metric-foot">คำนวณเฉพาะออเดอร์ที่ข้อมูลครบ</span></article>
   <article><div className="metric-label"><small>รายรับสินค้า</small><Icon name="orders" /></div><strong>฿{money(data.revenueSatang)}</strong><span className="metric-foot">หลังส่วนลดที่ผู้ขายรับผิดชอบ</span></article>
   <article><div className="metric-label"><small>Margin</small><Icon name="overview" /></div><strong>{data.marginPct === null ? 'ไม่ทราบ' : data.marginPct + '%'}</strong><span className="metric-foot">กำไร / รายรับสินค้า</span></article>
   <article><div className="metric-label"><small>TTR รวมโฆษณา</small><Icon name="rules" /></div><strong>{data.ttrPct === null ? 'ไม่ทราบ' : data.ttrPct + '%'}</strong><span className="metric-foot">ค่าบริการ + โฆษณา / รายรับสินค้า</span></article>
  </div>
  {(missing > 0 || data.incompleteOrders > 0) && <div className="coverage"><p><strong>มีข้อมูลที่ต้องตรวจ</strong> · {missing > 0 ? `สินค้าที่โหลดมา ${missing} รายการยังไม่มีต้นทุน` : ''}{missing > 0 && data.incompleteOrders > 0 ? ' · ' : ''}{data.incompleteOrders > 0 ? `${data.incompleteOrders} ออเดอร์ยังไม่รวมในกำไร` : ''}</p><button onClick={() => onNavigate(missing > 0 ? 2 : 3)}>ตรวจข้อมูล <Icon name="arrow" /></button></div>}
  <div className="financial-overview">
   <section><div className="section-heading"><div><h2>จากยอดขาย เหลือเท่าไร?</h2><p>สรุปจากออเดอร์ที่ข้อมูลครบในเดือนที่เลือก</p></div><Icon name="simulation" /></div>
    {[{
          name: 'รายรับสินค้า',
          value: data.revenueSatang,
          tone: ''
        }, {
          name: 'ค่าบริการที่ใช้คำนวณ',
          value: data.feeSatang,
          tone: 'fee'
        }, {
          name: 'กำไรหลังต้นทุนและค่าใช้จ่ายที่บันทึก',
          value: data.profitSatang,
          tone: 'profit'
        }].map(r => <div key={r.name}><div className="flow-line"><span>{r.name}</span><strong className={r.value !== null && r.value < 0 ? 'negative' : 'money'}>{r.value === null ? 'ไม่ทราบ' : '฿' + money(r.value)}</strong></div><div className={'flow-track ' + r.tone} aria-hidden="true"><span style={{
              width: width(r.value) + '%'
            }} /></div></div>)}
    <p className="flow-caption">ความยาวแถบเทียบกับรายรับ · ไม่ใช่กราฟแนวโน้ม · ค่าบริการอาจเป็นยอดจริงหรือประมาณการตามหลักฐานของแต่ละออเดอร์</p>
   </section>
   <section><h2>ทำอะไรต่อดี?</h2>{[{
          view: 1,
          icon: 'upload' as const,
          title: 'นำเข้ารายงาน',
          text: 'CSV / XLSX ครั้งละไม่เกิน 1,000 แถว'
        }, {
          view: 4,
          icon: 'simulation' as const,
          title: 'ลองราคาและส่วนลด',
          text: 'ดูผลต่อกำไรก่อนตัดสินใจ'
        }, {
          view: 5,
          icon: 'assistant' as const,
          title: 'ถามผู้ช่วยร้านค้า',
          text: 'ถามเป็นภาษาไทย พร้อมที่มาของตัวเลข'
        }].map(a => <button className="quick-action" key={a.view} onClick={() => onNavigate(a.view)}><span className="action-icon"><Icon name={a.icon} /></span><span><strong>{a.title}</strong><small>{a.text}</small></span><Icon name="arrow" /></button>)}</section>
  </div>
 </>;
}
