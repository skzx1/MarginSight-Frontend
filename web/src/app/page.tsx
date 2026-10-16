'use client';

import { useEffect, useRef, useState } from 'react';
import Preview from './preview';
import Onboarding from './onboarding';
import { Brand, Icon, EmptyState, Steps, PageIntro } from './ui';
import type { IconName } from './ui';
import DashboardSummary from './dashboard-summary';
import { demo, login, session, request, upload, download, logout, localMode, fullDemo, fullDemoMode } from '../lib/auth';

// Two-Level Navigation Structure
interface SubTab {
  view: number;
  label: string;
  icon: IconName;
  desc: string;
}

interface MainTab {
  id: string;
  label: string;
  icon: IconName;
  defaultView: number;
  subTabs: SubTab[];
}

const mainTabs: MainTab[] = [
  {
    id: 'overview',
    label: 'ภาพรวม & ยอดขาย',
    icon: 'overview',
    defaultView: 0,
    subTabs: [
      { view: 0, label: 'สรุปยอดขาย', icon: 'overview', desc: 'ดูยอดขาย กำไรสุทธิ และแนวโน้มสุขภาพการเงินของร้าน' },
      { view: 1, label: 'นำเข้ารายงาน', icon: 'upload', desc: 'นำเข้าไฟล์ยอดขาย ต้นทุน ออเดอร์ และค่าบริการ (CSV / Excel)' }
    ]
  },
  {
    id: 'products',
    label: 'สินค้า & ราคา',
    icon: 'products',
    defaultView: 2,
    subTabs: [
      { view: 2, label: 'รายการสินค้า', icon: 'products', desc: 'ตรวจดูราคาขาย ต้นทุนจริง และอัตรากำไร (Margin) ต่อชิ้น' },
      { view: 4, label: 'ลองราคา & ส่วนลด', icon: 'simulation', desc: 'ลองตั้งราคาและคำนวณส่วนลดก่อนตัดสินใจขายจริง' },
      { view: 6, label: 'สแกนบิลซื้อ (OCR)', icon: 'receipt', desc: 'ถ่ายภาพบิล AI ช่วยอ่านและกรอกต้นทุนให้อัตโนมัติ' },
      { view: 7, label: 'กฎค่าบริการ', icon: 'rules', desc: 'เก็บกฎและหลักฐานอัตราค่าบริการตามช่วงวันที่มีผล' }
    ]
  },
  {
    id: 'assistant',
    label: 'ผู้ช่วย AI',
    icon: 'assistant',
    defaultView: 5,
    subTabs: [
      { view: 5, label: 'ถามผู้ช่วย AI', icon: 'assistant', desc: 'ถามเรื่องกำไร ส่วนลด และจุดคุ้มทุนเป็นภาษาไทย' },
      { view: 9, label: 'เชื่อมต่อ LINE', icon: 'line', desc: 'ผูกช่องทางสนทนากับสิทธิ์ร้านของคุณเพื่อรับแจ้งเตือนและปรึกษาบอต' }
    ]
  },
  {
    id: 'orders',
    label: 'คำสั่งซื้อ',
    icon: 'orders',
    defaultView: 3,
    subTabs: [
      { view: 3, label: 'รายการออเดอร์', icon: 'orders', desc: 'ตรวจดูยอดขายและหลักฐานค่าธรรมเนียมต่อออเดอร์' },
      { view: 8, label: 'กระทบยอดเงินโอน', icon: 'reconcile', desc: 'เทียบยอดเงินโอนจริงกับประมาณการ และส่งออกผลตรวจ' }
    ]
  }
];

const menus = [
  'สรุปยอดขาย',
  'นำเข้ารายงาน',
  'รายการสินค้า & ต้นทุน',
  'รายการคำสั่งซื้อ',
  'ลองราคา & ส่วนลด',
  'ผู้ช่วยร้านค้า AI',
  'อ่านบิลซื้อ (OCR)',
  'กฎค่าบริการและแคมเปญ',
  'กระทบยอดเงินโอน',
  'เชื่อมต่อ LINE'
];

const descriptions = [
  'ดูยอดขาย กำไรสุทธิ และแนวโน้มสุขภาพการเงินของร้าน',
  'รวมสินค้า ต้นทุน ออเดอร์ และรายการเงินหักในที่เดียว',
  'ตรวจดูราคาขาย ต้นทุนจริง และอัตรากำไร (Margin) ต่อชิ้น',
  'ตรวจดูยอดขายและหลักฐานค่าธรรมเนียมต่อออเดอร์',
  'ลองตั้งราคาและคำนวณส่วนลดก่อนตัดสินใจขายจริง',
  'ถามเรื่องกำไร ส่วนลด และจุดคุ้มทุนเป็นภาษาไทย',
  'อ่านภาพบิลเป็นร่าง ตรวจสอบให้ครบ แล้วค่อยบันทึกต้นทุน',
  'เก็บกฎและหลักฐานอัตราค่าบริการตามช่วงวันที่มีผล',
  'เทียบยอดเงินโอนจริงกับประมาณการ และส่งออกผลตรวจ',
  'ผูกช่องทางสนทนากับสิทธิ์ร้านของคุณเพื่อรับแจ้งเตือน'
];

const localDate = (v: string) => new Date(Date.parse(v) + 7 * 3600000).toISOString().slice(0, 10);
const dateAt = (v: string) => new Date(v + 'T00:00:00+07:00').toISOString();
const money = (v: number | null | undefined) => v == null ? 'ไม่ทราบ' : new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(v / 100);

const status = (v: string) => ({
  COMPLETED: 'สำเร็จ',
  PARTIAL: 'มีแถวต้องตรวจ',
  FAILED: 'ไม่สำเร็จ',
  PROCESSING: 'กำลังนำเข้า',
  QUEUED: 'รอประมวลผล',
  UPLOADED: 'รอส่งไฟล์',
  REVIEW: 'รอตรวจบิล',
  MANUAL_REVIEW: 'กรอกข้อมูลบิลด้วยตนเอง',
  CONFIRMED: 'ยืนยันแล้ว',
  ESTIMATED: 'ประมาณการ',
  INCOMPLETE: 'ข้อมูลไม่ครบ',
  ACTUAL_FEES_CONFIRMED_COST: 'ค่าบริการที่บันทึกแล้ว'
})[v] ?? v;

function Badge({
  value
}: {
  value: string;
}) {
  const tone = value === 'MOCK' ? 'mock' : value === 'FAILED' ? 'danger' : ['INCOMPLETE', 'ESTIMATED', 'PARTIAL', 'QUEUED', 'PROCESSING', 'UPLOADED', 'REVIEW', 'MANUAL_REVIEW', 'UNVERIFIED'].includes(value) ? 'warn' : '';
  return <span className={'badge ' + tone}>{value === 'MOCK' ? 'ข้อมูลจำลอง' : value === 'REAL' ? 'ข้อมูลจริง' : status(value)}</span>;
}

function Evidence({
  result
}: {
  result: any;
}) {
  const feeUnknown = result.missingFields?.some((f: string) => f === 'base_fee_rules' || f.startsWith('rule:') || f.startsWith('cash_deduction_requires_classification:'));
  return (
    <div className="evidence">
      <div className="row">
        <Badge value={result.dataOrigin} />
        <Badge value={result.status} />
      </div>
      <div className="metrics">
        <article>
          <small>รายรับสินค้า</small>
          <strong>฿{money(result.revenueSatang)}</strong>
        </article>
        <article>
          <small>ค่าบริการ</small>
          <strong>฿{money(feeUnknown ? null : result.feeSatang)}</strong>
        </article>
        <article>
          <small>ต้นทุนสินค้า</small>
          <strong>฿{money(result.cogsSatang)}</strong>
        </article>
        <article>
          <small>กำไรส่วนที่บันทึก</small>
          <strong className={result.profitSatang == null ? '' : result.profitSatang < 0 ? 'negative' : 'positive'}>
            ฿{money(result.profitSatang)}
          </strong>
        </article>
      </div>
      <p>
        Margin {result.marginPct ?? 'ไม่ทราบ'}% · ค่าบริการ / รายรับ {result.platformFeeRatioPct ?? 'ไม่ทราบ'}% · TTR รวมโฆษณา {result.ttr?.percent ?? 'ไม่ทราบ'}%
      </p>
      <p className="muted">
        ยังไม่รวมค่าใช้จ่ายประจำร้านและภาษีเงินได้ · {result.feeStatus === 'ACTUAL' ? 'ใช้รายการค่าบริการที่บันทึก' : 'ประมาณตามกฎที่มีผล ณ วันขาย'}
      </p>
      {result.missingFields?.length > 0 && <p className="notice">ข้อมูลที่ขาด: {result.missingFields.join(', ')}</p>}
      {result.unmappedCharges?.length > 0 && (
        <div className="notice">
          <p>มีเงินหักที่ยังไม่จัดประเภท ระบบเก็บยอดไว้กระทบยอด แต่ยังไม่ใช้เป็นค่าใช้จ่ายหรือแสดงกำไร ให้ผู้ดูแลตรวจประเภทเงินหักและหลักฐานก่อน</p>
          {result.unmappedCharges.map((f: any) => (
            <p key={f.feeId}>{f.type}: {money(f.amountSatang)} บาท · {f.sourceRef}</p>
          ))}
        </div>
      )}
      {result.postedFees?.length > 0 && (
        <details open>
          <summary>รายการเงินหักที่นำเข้า: ตรวจความครบชุดก่อนยืนยัน</summary>
          <p>ยอดเหล่านี้เป็นรายการจากรายงาน ไม่ใช่อัตราที่ใช้ประมาณการด้านบน ตรวจประเภท ขอบเขต และหลักฐานก่อนยืนยัน</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th>ยอดบาท</th>
                  <th>ขอบเขต</th>
                  <th>หลักฐาน</th>
                </tr>
              </thead>
              <tbody>
                {result.postedFees.map((f: any) => (
                  <tr key={f.feeId}>
                    <td>{f.type}<small>{f.feeId}</small></td>
                    <td>{money(f.amountSatang)}</td>
                    <td>{f.scope}</td>
                    <td>{f.sourceRef} · {f.dataOrigin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <details>
        <summary>ดูที่มาของตัวเลขและเวอร์ชันต้นทุน</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ต้นทุน/ชิ้น</th>
                <th>ค่าบริการที่แบ่ง</th>
                <th>เวอร์ชันต้นทุน</th>
              </tr>
            </thead>
            <tbody>
              {result.items?.map((i: any) => (
                <tr key={i.lineId}>
                  <td>{i.sku}</td>
                  <td>{i.quantity}</td>
                  <td>{money(i.unitCostSatang)}</td>
                  <td>{money(i.allocatedFeeSatang)}</td>
                  <td className="wrap">{i.costVersion ?? 'ขาดต้นทุน'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{result.evidence?.join(' · ')}</p>
        <p>สูตร {result.formulaVersion} · snapshot {result.inputHash ?? 'scenario'}</p>
        {result.excludedCharges?.length > 0 && (
          <p>รายการที่แยกไว้นอกออเดอร์: {result.excludedCharges.join(', ')}</p>
        )}
      </details>
    </div>
  );
}

export default function Page() {
  const [navOpen, setNavOpen] = useState(false),
    [ruleKind, setRuleKind] = useState('fee-rules'),
    [setup, setSetup] = useState(false),
    [merchantAck, setMerchantAck] = useState(false),
    [newSku, setNewSku] = useState(''),
    [newProductName, setNewProductName] = useState(''),
    [newUnit, setNewUnit] = useState(''),
    [ready, setReady] = useState(false),
    [configReady, setConfigReady] = useState(false),
    [previewMode, setPreviewMode] = useState(false),
    [stores, setStores] = useState<any[]>([]),
    [store, setStore] = useState(''),
    [view, setView] = useState(0),
    [month, setMonth] = useState('2026-10'),
    [data, setData] = useState<any>(null),
    [products, setProducts] = useState<any[]>([]),
    [productsNext, setProductsNext] = useState<string>(),
    [sku, setSku] = useState('SKU-DEMO-01'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');

  const [message, setMessage] = useState(''),
    [answer, setAnswer] = useState<any>(),
    [file, setFile] = useState<File>(),
    [kind, setKind] = useState('orders'),
    [jobs, setJobs] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(),
    [discount, setDiscount] = useState('15'),
    [price, setPrice] = useState(''),
    [origin, setOrigin] = useState('MOCK'),
    [receiptId, setReceiptId] = useState(''),
    [qty, setQty] = useState(''),
    [units, setUnits] = useState(''),
    [total, setTotal] = useState(''),
    [effective, setEffective] = useState(''),
    [unitCost, setUnitCost] = useState(''),
    [source, setSource] = useState(''),
    [json, setJson] = useState(''),
    [link, setLink] = useState<any>(),
    [conflicts, setConflicts] = useState<any[]>([]),
    [reviewReason, setReviewReason] = useState(''),
    // UI state
    [productSearch, setProductSearch] = useState(''),
    [filterCost, setFilterCost] = useState<'all' | 'has_cost' | 'missing_cost'>('all'),
    [showAddProduct, setShowAddProduct] = useState(false),
    [showAddCost, setShowAddCost] = useState(false);

  const navigationRef = useRef<HTMLElement>(null),
    wasNavOpen = useRef(false);

  // Active Main Tab determination based on current view
  const activeMainTabIndex = [0, 1].includes(view)
    ? 0
    : [2, 4, 6, 7].includes(view)
    ? 1
    : [5, 9].includes(view)
    ? 2
    : 3;

  const currentMainTab = mainTabs[activeMainTabIndex];

  useEffect(() => {
    if (navOpen) navigationRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    else if (wasNavOpen.current) document.getElementById('menu-toggle')?.focus();
    wasNavOpen.current = navOpen;
    if (!navOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, [navOpen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 761px)');
    const close = () => {
      if (wide.matches) setNavOpen(false);
    };
    wide.addEventListener('change', close);
    return () => wide.removeEventListener('change', close);
  }, []);

  useEffect(() => {
    document.title = ready ? (menus[view] ?? 'MarginSight') + ' · MarginSight' : 'MarginSight — ดูกำไรจากข้อมูลจริง';
  }, [view, ready]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const contextKey = store + '|' + view + '|' + month;
  const contextRef = useRef(contextKey);
  contextRef.current = contextKey;
  const guest = fullDemoMode();
  const storeInfo = stores.find(s => s.id === store),
    realStore = storeInfo?.personal === true;
  const base = '/stores/' + store;

  const initialize = async () => {
    const v = await request('/me/stores');
    setStores(v.items);
    setStore((v.items.find((s: any) => s.personal) ?? v.items[0])?.id ?? '');
    setReady(true);
  };

  useEffect(() => {
    const expired = () => setReady(false);
    window.addEventListener('auth-expired', expired);
    session().then(async token => {
      setConfigReady(true);
      if (token) await initialize();
    }).catch(e => setError(e.message));
    return () => window.removeEventListener('auth-expired', expired);
  }, []);

  const refresh = async () => {
    if (!store) return;
    const key = contextKey,
      p = await request(base + '/products');
    if (contextRef.current !== key) return;
    setProducts(p.items);
    setProductsNext(p.next);
    if (!p.items.some((p: any) => p.sku === sku)) setSku(p.items[0]?.sku ?? '');
    let nextData: any;
    if (view === 0) nextData = await request(base + '/dashboard?month=' + month);
    if (view === 3) nextData = await request(base + '/orders?month=' + month);
    if (view === 7) nextData = {
      rules: (await request(base + '/fee-rules')).items,
      enrollments: (await request(base + '/enrollments')).items
    };
    if (view === 8) nextData = await request(base + '/reconciliation?month=' + month);
    if (view === 9) nextData = await request(base + '/integrations');
    if (contextRef.current !== key) return;
    if (nextData) setData(nextData);
    if (view === 1) {
      const c = await request(base + '/conflicts');
      if (contextRef.current !== key) return;
      setConflicts(c.items);
    }
    if ([1, 6].includes(view)) {
      const j = await request(base + '/jobs');
      if (contextRef.current !== key) return;
      setJobs(j.items);
    }
  };

  useEffect(() => {
    setData(null);
    setSelected(null);
    setAnswer(undefined);
    setLink(undefined);
    setJobs([]);
    setConflicts([]);
    setMerchantAck(false);
    setReceiptId('');
    setFile(undefined);
    setOrigin(realStore ? 'REAL' : storeInfo?.dataOrigin ?? 'MOCK');
    if (view === 1 && !['products', 'costs', 'orders', 'fees', 'adjustments'].includes(kind)) setKind('orders');
    if (store) void act(refresh);
  }, [view, store, month]);

  useEffect(() => {
    if (!store || ![1, 6].includes(view) || !jobs.some(j => ['PROCESSING', 'QUEUED'].includes(j.status))) return;
    const timer = setInterval(() => void refresh().catch(() => {}), 2500);
    return () => clearInterval(timer);
  }, [store, view, jobs]);

  const skuSelect = (
    <label>
      สินค้า
      <select value={sku} onChange={e => setSku(e.target.value)}>
        {products.map(p => (
          <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
        ))}
      </select>
    </label>
  );

  if (previewMode) return <Preview back={() => setPreviewMode(false)} />;

  if (!ready) {
    return (
      <main className="login">
        <div className="auth-topbar">
          <Brand />
          <span>ผู้ช่วยร้านค้าหลายช่องทาง</span>
        </div>
        <div className="auth-layout">
          <div className="auth-story">
            <span className="eyebrow"><Icon name="shield" /> ตัวเลขที่มีที่มา ทุกการตัดสินใจ</span>
            <h1>ขายดีแล้ว<br /><em>เหลือกำไรเท่าไร?</em></h1>
            <p>รวมต้นทุน ค่าบริการ และยอดขายของร้าน ให้คุณเข้าใจกำไรก่อนตั้งราคาและเข้าร่วมแคมเปญ</p>
            <div className="auth-points">
              <div><Icon name="check" /> นำเข้ารายงานครั้งเดียว ลดการกรอกซ้ำ</div>
              <div><Icon name="check" /> ดูต้นทุนและหลักฐานของแต่ละออเดอร์</div>
              <div><Icon name="check" /> ลองส่วนลด แล้วค่อยตัดสินใจ</div>
            </div>
            <div className="auth-illustration">
              <div><span>เส้นทางของข้อมูล</span><Icon name="simulation" /></div>
              <strong>รายรับ → ต้นทุน → กำไร</strong>
              <small>ข้อมูลครบจึงแสดงกำไร · ข้อมูลที่ขาดแสดงให้ตรวจ</small>
            </div>
          </div>
          <div className="login-card">
            <span className="auth-card-label">เริ่มต้นกับ MARGINSIGHT</span>
            <h2>เข้าใจร้านของคุณ<br />เริ่มจากข้อมูลที่มี</h2>
            <p>ลองใช้ระบบครบทุกเมนูด้วยร้านจำลองแยกเฉพาะรอบ ไม่ต้องสมัครบัญชี</p>
            <button disabled={busy || !configReady} onClick={() => void act(async () => {
              await fullDemo();
              await initialize();
            })}>
              {busy ? 'กำลังเปิดร้านเดโม…' : 'เข้าเดโมระบบเต็ม'}
              <Icon name="arrow" />
            </button>
            <button className="secondary" onClick={() => setPreviewMode(true)}>ลองคำนวณอย่างเดียว</button>
            <div className="auth-divider">สำหรับร้านของคุณ</div>
            <button className="secondary" disabled={busy} onClick={() => void act(() => login())}>
              เข้าสู่ระบบร้านค้า <Icon name="arrow" />
            </button>
            <button className="ghost" disabled={busy} onClick={() => void act(() => login(true))}>
              ยังไม่มีบัญชี? สมัครบัญชีใหม่
            </button>
            {configReady && localMode() && (
              <button className="secondary" disabled={busy} onClick={() => void act(async () => {
                await demo();
                await initialize();
              })}>
                ทดลองร้านข้อมูลจำลอง
              </button>
            )}
            {error && <p role="alert" className="notice">{error}</p>}
            <small>เดโมเป็นข้อมูลจำลอง ใช้ได้ 2 ชั่วโมง · ร้านจริงมีพื้นที่ส่วนตัวหลังเข้าสู่ระบบ</small>
          </div>
        </div>
        <div className="auth-bottom">AI ช่วยอ่านและอธิบาย · โปรแกรมคำนวณกำไรจากหลักฐาน · ข้อมูลที่ขาดจะไม่ถูกเติมเป็นศูนย์</div>
      </main>
    );
  }

  if (!store || setup) {
    return (
      <Onboarding
        busy={busy}
        error={error}
        back={stores.length ? () => setSetup(false) : undefined}
        create={name => act(async () => {
          const created = await request('/me/store', { name });
          const v = await request('/me/stores');
          setStores(v.items);
          setStore(created.id);
          setView(0);
          setSetup(false);
        })}
      />
    );
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase());
    if (!matchSearch) return false;
    if (filterCost === 'has_cost') return !!p.cost;
    if (filterCost === 'missing_cost') return !p.cost;
    return true;
  });

  return (
    <div className={'shell' + (navOpen ? ' nav-open' : '')}>
      <a className="skip-link" href="#main-content">ข้ามไปเนื้อหา</a>
      {navOpen && <button className="nav-overlay" aria-label="ปิดเมนู" tabIndex={-1} onClick={() => setNavOpen(false)} />}

      {/* Primary Sidebar Navigation (Clean 4 Core Tabs) */}
      <aside
        ref={navigationRef}
        id="store-navigation"
        role={navOpen ? 'dialog' : undefined}
        aria-modal={navOpen || undefined}
        aria-label="เมนูร้านค้า"
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setNavOpen(false);
            document.getElementById('menu-toggle')?.focus();
          }
          if (e.key === 'Tab' && navOpen) {
            const buttons = navigationRef.current?.querySelectorAll<HTMLButtonElement>('button');
            if (buttons?.length) {
              const first = buttons[0],
                last = buttons[buttons.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        }}
      >
        <div className="sidebar-brand">
          <Brand />
        </div>
        <button
          className="sidebar-close ghost"
          aria-label="ปิดเมนู"
          onClick={() => {
            setNavOpen(false);
            document.getElementById('menu-toggle')?.focus();
          }}
        >
          <Icon name="close" />
        </button>

        <nav aria-label="เมนูหลัก">
          <span className="nav-caption">เมนูร้านค้า</span>
          {mainTabs.map((mt, idx) => {
            const isActive = idx === activeMainTabIndex;
            return (
              <button
                key={mt.id}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setData(null);
                  setSelected(null);
                  setView(mt.defaultView);
                  setNavOpen(false);
                }}
              >
                <Icon name={mt.icon} />
                {mt.label}
              </button>
            );
          })}
        </nav>

        <div className="aside-foot">
          <div className="trust-card">
            <Icon name="shield" />
            <strong>กำไรที่ตรวจสอบได้</strong>
            <p>AI ช่วยอ่านและอธิบาย<br />โปรแกรมคำนวณจากข้อมูลร้าน</p>
          </div>
          <button className="ghost" onClick={logout}>
            <Icon name="logout" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="workspace" inert={navOpen || undefined}>
        <div className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu ghost"
              id="menu-toggle"
              aria-label="เปิดเมนู"
              aria-expanded={navOpen}
              aria-controls="store-navigation"
              onClick={() => setNavOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span>{currentMainTab.label}</span>
            <span>/</span>
            <strong>{menus[view]}</strong>
          </div>
          <div className="topbar-right">
            <Badge value={guest ? 'MOCK' : storeInfo?.dataOrigin ?? 'REAL'} />
            <span className="topbar-store">{storeInfo?.name ?? 'ร้านของคุณ'}</span>
            <span className="store-avatar" aria-hidden="true">{(storeInfo?.name ?? 'M').slice(0, 1)}</span>
          </div>
        </div>

        <main id="main-content" tabIndex={-1}>
          {guest && (
            <div className="demo-banner" role="status">
              <strong>เดโมระบบเต็ม · ข้อมูลจำลอง</strong>
              <span>เฉพาะรอบนี้ 2 ชั่วโมง · ใช้ไฟล์ตัวอย่าง · ผู้ช่วย/อ่านบิลรวม 3 ครั้ง · LINE ยังไม่เชื่อมจริง</span>
            </div>
          )}

          <header>
            <div>
              <span className="eyebrow">{currentMainTab.label}</span>
              <h1 id="page-title">{menus[view]}</h1>
              <p className="page-description">{descriptions[view]}</p>
            </div>
            <div className="row toolbar">
              <label>
                ร้าน
                <select
                  value={store}
                  onChange={e => {
                    setData(null);
                    setSelected(null);
                    setProducts([]);
                    setAnswer(undefined);
                    setLink(undefined);
                    setStore(e.target.value);
                  }}
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name ?? s.id}</option>
                  ))}
                </select>
              </label>
              <label>
                เดือน
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
              </label>
              <button className="secondary" aria-label="รีเฟรชข้อมูล" disabled={busy} onClick={() => void act(refresh)}>
                <Icon name="refresh" />
                <span className="refresh-label">รีเฟรช</span>
              </button>
            </div>
          </header>

          {/* Secondary Navigation (Sub-tabs / Segmented Control) */}
          <div className="subnav-container">
            <div className="subnav-pills" role="tablist" aria-label="เมนูย่อยของหน้านี้">
              {currentMainTab.subTabs.map(st => (
                <button
                  key={st.view}
                  role="tab"
                  aria-selected={view === st.view}
                  className={'subnav-pill' + (view === st.view ? ' active' : '')}
                  onClick={() => {
                    setData(null);
                    setSelected(null);
                    setView(st.view);
                  }}
                >
                  <Icon name={st.icon} />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {busy && (
            <div className="loading-state" role="status">
              <span className="spinner" aria-hidden="true" />
              กำลังทำรายการ…
            </div>
          )}
          {error && <p role="alert" className="notice">{error}</p>}
          {!guest && !stores.some(s => s.personal) && (
            <section>
              <h2>พร้อมเริ่มใช้ร้านของคุณ</h2>
              <p>ร้านสาธิตมีข้อมูลจำลอง สร้างร้านส่วนตัวว่างเพื่อเพิ่มข้อมูลของคุณ</p>
              <button onClick={() => setSetup(true)}>สร้างร้านของฉัน</button>
            </section>
          )}

          {/* ========================================================
              MAIN TAB 1: ภาพรวม & ยอดขาย
              Sub-tab 0: สรุปยอดขาย
              Sub-tab 1: นำเข้ารายงาน
             ======================================================== */}

          {/* VIEW 0: สรุปยอดขาย (Sales Dashboard) */}
          {view === 0 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="overview" /></span>
                <div className="guide-card-content">
                  <h3>สรุปกำไรและรายรับร้านของคุณ</h3>
                  <p>
                    ตัวเลขคำนวณจากออเดอร์และรายการหักที่มีข้อมูลครบถ้วนประจำเดือน {month}
                    {' '}หากยอดไม่ขึ้นหรือมีออเดอร์ใหม่ สามารถไปที่แท็บ <strong>&ldquo;นำเข้ารายงาน&rdquo;</strong> ด้านบนเพื่ออัปโหลดไฟล์เพิ่มได้ตลอดเวลา
                  </p>
                </div>
              </div>

              {data?.totalOrders === 0 ? (
                <section>
                  <h2>ร้านของคุณพร้อมแล้ว เริ่มจากข้อมูลที่มี</h2>
                  <p>ยังไม่มีออเดอร์ในเดือนนี้ จึงยังไม่แสดงยอดกำไร เพิ่มสินค้าและต้นทุน แล้วนำเข้าออเดอร์กับรายการค่าบริการ</p>
                  <div className="chips">
                    <button onClick={() => setView(2)}>1. ตรวจสอบสินค้าและต้นทุน</button>
                    <button className="secondary" onClick={() => setView(1)}>
                      2. นำเข้ารายงานยอดขาย
                    </button>
                  </div>
                  <p className="muted">ใช้ไฟล์ตามแบบ MarginSight หรือเตรียมข้อมูลจากรายงานร้าน ระบบยังไม่ดึงรายงานจากแพลตฟอร์มอัตโนมัติ</p>
                </section>
              ) : data?.totalOrders > 0 ? (
                <>
                  <DashboardSummary data={data} products={products} onNavigate={setView} />
                  <section>
                    <div className="section-heading">
                      <div>
                        <h2>รายการออเดอร์ล่าสุด</h2>
                        <p>ตรวจสอบหลักฐานกำไรและค่าบริการต่อออเดอร์</p>
                      </div>
                      <button className="secondary" onClick={() => setView(3)}>
                        <Icon name="orders" /> ดูทั้งหมด
                      </button>
                    </div>

                    {data.totalOrders > data.results.length && (
                      <p className="muted">
                        แสดงล่าสุด {data.results.length} จาก {data.totalOrders} ออเดอร์ ยอดรวมด้านบนคิดจากออเดอร์ข้อมูลครบทั้งหมดของเดือนที่เลือก
                      </p>
                    )}
                    {data.incompleteOrders > 0 && (
                      <p className="notice">
                        มี {data.incompleteOrders} ออเดอร์ที่ข้อมูลยังไม่ครบชุด ระบบจึงยังไม่รวมในกำไรสุทธิเพื่อความถูกต้อง
                      </p>
                    )}

                    {data.results.map((r: any) => (
                      <div className="order-row" key={r.inputHash}>
                        <div>
                          <strong>{r.orderId}</strong>
                          <p>{r.platform} · <Badge value={r.status} /></p>
                        </div>
                        <strong className={r.profitSatang < 0 ? 'negative' : 'positive'}>
                          ฿{money(r.profitSatang)}
                        </strong>
                        <button className="secondary" onClick={() => setSelected(r)}>
                          ดูหลักฐาน
                        </button>
                      </div>
                    ))}
                    {selected && <Evidence result={selected} />}
                  </section>
                </>
              ) : null}
            </>
          )}

          {/* VIEW 1: นำเข้ารายงาน (Import Reports) */}
          {view === 1 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="upload" /></span>
                <div className="guide-card-content">
                  <h3>นำเข้ารายงานเพื่อคำนวณกำไร</h3>
                  <p>
                    อัปโหลดรายงานยอดขาย ค่าบริการ หรือต้นทุนจาก Shopee, TikTok, Lazada ในรูปแบบ CSV หรือ Excel 
                    เพื่อให้ระบบนำไปคำนวณกำไรสุทธิและกระทบยอดเงินโอนโดยอัตโนมัติ
                  </p>
                </div>
              </div>

              <Steps items={['1. เตรียมไฟล์รายงาน', '2. นำเข้าและตรวจทาน', '3. นำข้อมูลไปใช้']} />

              {guest && (
                <section>
                  <h2>ไฟล์ตัวอย่างสำหรับทดลองเดโม</h2>
                  <p>คุณสามารถคลิกเพื่อดาวน์โหลดไฟล์ตัวอย่าง แล้วนำมาลองอัปโหลดในระบบได้ทันที</p>
                  <div className="chips">
                    {['products', 'costs', 'orders', 'fees', 'adjustments'].map(k => (
                      <a key={k} href={'/fixtures/' + k + '.csv'} download>
                        {({
                          products: 'สินค้า',
                          costs: 'ต้นทุน',
                          orders: 'ออเดอร์',
                          fees: 'ค่าบริการ',
                          adjustments: 'ปรับยอด'
                        } as Record<string, string>)[k]} CSV
                      </a>
                    ))}
                    <a href="/fixtures/orders.xlsx" download>ออเดอร์ XLSX</a>
                  </div>
                </section>
              )}

              <section>
                <h2>อัปโหลดรายงานใหม่</h2>
                <p>
                  {realStore ? 'นำเข้าข้อมูลร้านจริงตามแบบฟอร์ม MarginSight' : 'นำเข้าข้อมูลจำลองสำหรับร้านสาธิต'} · ไฟล์ละไม่เกิน 1,000 แถว หรือ 5 MB
                </p>
                <div className="form-grid">
                  <label>
                    ประเภทข้อมูลที่นำเข้า
                    <select value={kind} onChange={e => setKind(e.target.value)}>
                      {[['products', 'สินค้า'], ['costs', 'ต้นทุน'], ['orders', 'ออเดอร์ยอดขาย'], ['fees', 'รายการค่าบริการหัก'], ['adjustments', 'คืนเงิน / ปรับปรุงยอด']].map(([v, t]) => (
                        <option key={v} value={v}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    เลือกไฟล์ (CSV หรือ XLSX)
                    <input type="file" accept=".csv,.xlsx" onChange={e => {
                      setFile(e.target.files?.[0]);
                      setMerchantAck(false);
                    }} />
                  </label>
                </div>

                {realStore && (
                  <label className="ack">
                    <input type="checkbox" checked={merchantAck} onChange={e => setMerchantAck(e.target.checked)} />
                    ฉันได้ตรวจทานคอลัมน์และหน่วยเงินถูกต้องตามแบบฟอร์มแล้ว
                  </label>
                )}

                <button
                  disabled={!file || busy || (realStore && !merchantAck)}
                  onClick={() => void act(async () => {
                    const job = await request(base + '/imports', {
                      kind,
                      fileName: file!.name,
                      adapter: realStore ? 'merchant-v1' : 'mock-v1',
                      dataOrigin: realStore ? 'REAL' : 'MOCK',
                      acknowledgeOwnership: realStore && merchantAck
                    });
                    await upload(job.uploadUrl, file!, job.contentType);
                    await request(base + '/imports/' + job.id + '/complete', {});
                    await refresh();
                  })}
                >
                  <Icon name="upload" />
                  อัปโหลดและเริ่มประมวลผล
                </button>

                <details style={{ marginTop: 14 }}>
                  <summary>ดาวน์โหลดแบบฟอร์มเปล่าและคำแนะนำคอลัมน์</summary>
                  <p><a href={(realStore ? '/templates/' : '/fixtures/') + kind + '.csv'} download>ดาวน์โหลด{realStore ? 'แบบฟอร์มเปล่า' : 'ตัวอย่าง'} {kind}.csv</a></p>
                  <p>• ต้นทุนและรายรับเป็นบาททศนิยม 2 หลัก<br />• วันที่ในรูปแบบ YYYY-MM-DD (เช่น 2026-10-15)<br />• รหัสออเดอร์ต้องคงเดิมเพื่อป้องกันการบันทึกรายการซ้ำ</p>
                </details>
              </section>

              <section>
                <h2>ประวัติการนำเข้าและสถานะงาน</h2>
                {!busy && !jobs.some(j => j.kind !== 'receipt') && (
                  <EmptyState icon="upload" title="ยังไม่มีประวัติการนำเข้ารายงาน">
                    เลือกประเภทข้อมูลและอัปโหลดไฟล์ด้านบน รายการจะปรากฏที่นี่เพื่อตรวจทาน
                  </EmptyState>
                )}

                <label>
                  บันทึกเหตุผลการตรวจรับ / แก้ข้อขัดแย้ง
                  <input value={reviewReason} onChange={e => setReviewReason(e.target.value)} placeholder="เช่น ตรวจสอบเทียบกับสลิปโอนเงินแล้ว (อย่างน้อย 10 ตัวอักษร)" />
                </label>

                {jobs.filter(j => j.kind !== 'receipt').map(j => (
                  <div className="job" key={j.id}>
                    <div>
                      <strong>{j.fileName}</strong> <Badge value={j.status} />
                    </div>
                    <p>รับเข้า {j.accepted ?? 0} รายการ · ซ้ำ {j.duplicate ?? 0} · ไม่ถูกต้อง {j.rejected ?? 0} · มีข้อขัดแย้ง {j.conflict ?? 0}</p>
                    {j.error && <p className="notice">{j.error}</p>}
                    <div className="chips">
                      <button className="secondary" disabled={busy} onClick={() => void act(async () => {
                        const v = await request(base + '/imports/' + j.id);
                        await download(v.downloadUrl);
                      })}>
                        ดาวน์โหลดไฟล์เดิม
                      </button>
                      {['QUEUED', 'PROCESSING'].includes(j.status) && (
                        <button className="secondary" disabled={busy} onClick={() => void act(async () => {
                          await request(base + '/imports/' + j.id + '/retry', {});
                          await refresh();
                        })}>
                          ประมวลผลอีกครั้ง
                        </button>
                      )}
                      {j.status === 'PARTIAL' && (
                        <button disabled={busy || reviewReason.trim().length < 10} onClick={() => void act(async () => {
                          await request(base + '/imports/' + j.id + '/review', {
                            acknowledgeExcludedRows: true,
                            reason: reviewReason
                          });
                          await refresh();
                        })}>
                          ตรวจแล้ว: รับเฉพาะแถวที่ถูกต้อง
                        </button>
                      )}
                    </div>
                    {j.review && <p className="muted">ตรวจรับโดย {j.review.reviewedBy}: {j.review.reason}</p>}
                    {j.errors?.length > 0 && (
                      <details>
                        <summary>ดูรายการแถวที่ต้องแก้ไข ({j.errors.length} รายการ)</summary>
                        <pre>{JSON.stringify(j.errors, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </section>

              <section>
                <h2>รายการข้อมูลที่ขัดแย้ง</h2>
                {!busy && !conflicts.some(c => !c.resolution) && (
                  <EmptyState icon="check" title="ไม่มีข้อมูลขัดแย้ง">
                    ข้อมูลทั้งหมดตรงกันเรียบร้อย หากมีรายงานใหม่ที่มีข้อมูลต่างจากเดิม ระบบจะแจ้งให้เปรียบเทียบที่นี่
                  </EmptyState>
                )}
                {conflicts.filter(c => !c.resolution).map(c => (
                  <div className="job" key={c.id}>
                    <strong>{c.orderId ?? 'ข้อมูลสินค้า / ต้นทุน'} · {c.key}</strong>
                    <details>
                      <summary>ดูความแตกต่างระหว่างข้อมูลเดิมกับข้อมูลใหม่</summary>
                      <pre>{JSON.stringify({ existing: c.existing, incoming: c.incoming }, null, 2)}</pre>
                    </details>
                    {(['KEEP_EXISTING', 'USE_INCOMING'] as const).map(choice => (
                      <button
                        className="secondary"
                        key={choice}
                        disabled={busy || reviewReason.trim().length < 10 || (choice === 'USE_INCOMING' && c.key === 'HEADER')}
                        onClick={() => void act(async () => {
                          await request(base + '/conflicts/' + c.id + '/resolve', {
                            choice,
                            reason: reviewReason
                          });
                          await refresh();
                        })}
                      >
                        {choice === 'KEEP_EXISTING' ? 'ใช้ข้อมูลเดิม' : 'อัปเดตเป็นข้อมูลใหม่'}
                      </button>
                    ))}
                  </div>
                ))}
              </section>
            </>
          )}

          {/* ========================================================
              MAIN TAB 2: สินค้า & ราคา
              Sub-tab 0: รายการสินค้า
              Sub-tab 1: ลองราคา & ส่วนลด
              Sub-tab 2: สแกนบิลซื้อ (OCR)
              Sub-tab 3: กฎค่าบริการ
             ======================================================== */}

          {/* VIEW 2: รายการสินค้า (Products List & Costs) */}
          {view === 2 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="products" /></span>
                <div className="guide-card-content">
                  <h3>จัดการสินค้าและต้นทุน</h3>
                  <p>
                    ระบบจะนำต้นทุนต่อหน่วยไปคำนวณกำไรของทุกออเดอร์อัตโนมัติ หากสินค้าใดมีต้นทุนล็อตใหม่ 
                    คุณสามารถกด <strong>&ldquo;ใส่ต้นทุน&rdquo;</strong> หรือไปที่แท็บ <strong>&ldquo;สแกนบิลซื้อ&rdquo;</strong> เพื่อถ่ายรูปบิลได้ทันที
                  </p>
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="product-toolbar">
                <div className="search-box">
                  <Icon name="search" />
                  <input
                    type="search"
                    placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    aria-label="ค้นหาสินค้า"
                  />
                </div>
                <div className="filter-chips">
                  <button
                    className={'filter-chip' + (filterCost === 'all' ? ' active' : '')}
                    onClick={() => setFilterCost('all')}
                  >
                    ทั้งหมด ({products.length})
                  </button>
                  <button
                    className={'filter-chip' + (filterCost === 'has_cost' ? ' active' : '')}
                    onClick={() => setFilterCost('has_cost')}
                  >
                    🟢 มีต้นทุนแล้ว ({products.filter(p => !!p.cost).length})
                  </button>
                  <button
                    className={'filter-chip' + (filterCost === 'missing_cost' ? ' active' : '')}
                    onClick={() => setFilterCost('missing_cost')}
                  >
                    🔴 ยังไม่มีต้นทุน ({products.filter(p => !p.cost).length})
                  </button>
                </div>
                <div className="chips">
                  <button onClick={() => setShowAddProduct(!showAddProduct)}>
                    <Icon name="plus" />
                    {showAddProduct ? 'ปิดฟอร์ม' : 'เพิ่มสินค้าใหม่'}
                  </button>
                  <button className="secondary" onClick={() => setShowAddCost(!showAddCost)}>
                    <Icon name="calculator" />
                    {showAddCost ? 'ปิดฟอร์ม' : 'บันทึกต้นทุน'}
                  </button>
                  <button className="secondary" onClick={() => setView(6)}>
                    <Icon name="receipt" />
                    สแกนบิลซื้อ
                  </button>
                </div>
              </div>

              {/* Form: Add Product */}
              {showAddProduct && (
                <div className="form-card">
                  <div className="form-card-head">
                    <h2>เพิ่มสินค้าใหม่ในร้าน</h2>
                    <button className="ghost" onClick={() => setShowAddProduct(false)}><Icon name="close" /></button>
                  </div>
                  <div className="form-grid">
                    <label>
                      รหัสสินค้า (SKU)
                      <input value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="เช่น BAG-001" />
                    </label>
                    <label>
                      ชื่อสินค้า
                      <input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="เช่น กระเป๋าผ้าแคนวาส" />
                    </label>
                    <label>
                      หน่วยขาย
                      <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="เช่น ชิ้น หรือ แพ็ก" />
                    </label>
                  </div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <button
                      disabled={busy || !newSku || !newProductName.trim() || !newUnit.trim()}
                      onClick={() => void act(async () => {
                        const added = await request(base + '/products', {
                          sku: newSku,
                          name: newProductName,
                          unit: newUnit
                        });
                        setSku(added.sku);
                        setNewSku('');
                        setNewProductName('');
                        setNewUnit('');
                        setShowAddProduct(false);
                        await refresh();
                      })}
                    >
                      บันทึกสินค้า
                    </button>
                    <button className="ghost" onClick={() => setShowAddProduct(false)}>ยกเลิก</button>
                  </div>
                </div>
              )}

              {/* Form: Add Cost Version */}
              {showAddCost && (
                <div className="form-card">
                  <div className="form-card-head">
                    <h2>บันทึกต้นทุนสินค้า (เวอร์ชันใหม่)</h2>
                    <button className="ghost" onClick={() => setShowAddCost(false)}><Icon name="close" /></button>
                  </div>
                  <p className="muted">ต้นทุนใหม่จะเริ่มใช้ตั้งแต่วันที่กำหนด ออเดอร์ที่เกิดขึ้นก่อนหน้านี้จะยังคงใช้ต้นทุนเดิม</p>
                  <div className="form-grid">
                    {skuSelect}
                    <label>
                      ต้นทุนต่อหน่วย (บาท)
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitCost}
                        onChange={e => setUnitCost(e.target.value)}
                        placeholder="เช่น 120.50"
                      />
                    </label>
                    <label>
                      วันที่มีผลเริ่มใช้
                      <input type="date" value={effective} onChange={e => setEffective(e.target.value)} />
                    </label>
                    <label>
                      เอกสารอ้างอิง (เช่น เลขที่บิลซื้อ)
                      <input value={source} onChange={e => setSource(e.target.value)} placeholder="บิลซื้อเลขที่..." />
                    </label>
                    <label>
                      แหล่งข้อมูล
                      <select value={origin} disabled={realStore || guest} onChange={e => setOrigin(e.target.value)}>
                        <option value="MOCK">ข้อมูลจำลอง</option>
                        <option value="REAL">ข้อมูลจริง</option>
                      </select>
                    </label>
                  </div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <button
                      disabled={busy || !source || !unitCost || !effective}
                      onClick={() => void act(async () => {
                        const raw = unitCost.trim();
                        if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw Error('กรอกบาทไม่เกินสองตำแหน่ง');
                        const [baht, satang = ''] = raw.split('.');
                        await request(base + '/products/' + sku + '/cost-versions', {
                          sku,
                          unitCostSatang: Number(baht) * 100 + Number(satang.padEnd(2, '0')),
                          effectiveFrom: dateAt(effective),
                          sourceRef: source,
                          dataOrigin: origin,
                          method: 'MERCHANT_CONFIRMED_UNIT_COST'
                        });
                        setShowAddCost(false);
                        await refresh();
                      })}
                    >
                      บันทึกเวอร์ชันต้นทุน
                    </button>
                    <button className="ghost" onClick={() => setShowAddCost(false)}>ยกเลิก</button>
                  </div>
                </div>
              )}

              {/* Product Cards Grid */}
              <section>
                <div className="section-heading">
                  <div>
                    <h2>รายการสินค้าทั้งหมด ({filteredProducts.length} รายการ)</h2>
                    <p>แตะสินค้าเพื่อลองคำนวณราคา หรืออัปเดตต้นทุน</p>
                  </div>
                  <button className="secondary" onClick={() => {
                    setKind('products');
                    setView(1);
                  }}>
                    <Icon name="upload" />
                    นำเข้าไฟล์สินค้าพร้อมกัน
                  </button>
                </div>

                {!busy && filteredProducts.length === 0 && (
                  <EmptyState icon="products" title="ไม่พบสินค้าตามเงื่อนไขที่เลือก">
                    ลองพิมพ์คำค้นหาใหม่ หรือเพิ่มสินค้าจากปุ่มด้านบน
                  </EmptyState>
                )}

                <div className="product-card-grid">
                  {filteredProducts.map(p => (
                    <article className="product-card" key={p.sku}>
                      <div className="product-card-head">
                        <div>
                          <div className="product-card-title">{p.name}</div>
                          <span className="product-card-sku">{p.sku}</span>
                        </div>
                        <span className={'badge ' + (!p.cost ? 'warn' : 'mock')}>
                          {p.cost ? 'มีต้นทุน' : 'ยังไม่มีต้นทุน'}
                        </span>
                      </div>
                      <div className="product-card-stats">
                        <div className="product-card-stat-item">
                          <small>ต้นทุนต่อหน่วย</small>
                          <strong className={!p.cost ? 'negative' : 'positive'}>
                            {p.cost ? '฿' + money(p.cost.unitCostSatang) : 'ยังไม่ทราบ'}
                          </strong>
                        </div>
                        <div className="product-card-stat-item">
                          <small>หน่วยขาย / วันเริ่มใช้</small>
                          <strong>{p.unit} · {p.cost?.effectiveFrom ? localDate(p.cost.effectiveFrom) : '—'}</strong>
                        </div>
                      </div>
                      <div className="product-card-actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            setSku(p.sku);
                            setView(4);
                          }}
                        >
                          <Icon name="simulation" />
                          ลองราคา
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            setSku(p.sku);
                            setShowAddCost(true);
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                        >
                          <Icon name="plus" />
                          ใส่ต้นทุน
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {productsNext && (
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => void act(async () => {
                        const p = await request(base + '/products?cursor=' + encodeURIComponent(productsNext));
                        setProducts(prev => [...prev, ...p.items]);
                        setProductsNext(p.next);
                      })}
                    >
                      โหลดสินค้าหน้าถัดไป (+20 รายการ)
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* VIEW 4: ลองราคา & ส่วนลด (Price Simulator) */}
          {view === 4 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="simulation" /></span>
                <div className="guide-card-content">
                  <h3>จำลองกำไรก่อนจัดโปรโมชัน</h3>
                  <p>
                    ลองใส่ส่วนลดหรือราคาใหม่ เพื่อดูว่าหลังหักค่าธรรมเนียมแพลตฟอร์มและต้นทุนสินค้าแล้ว คุณจะเหลือกำไรจริงกี่บาท 
                    พร้อมคำนวณ <strong>&ldquo;จุดคุ้มทุน&rdquo;</strong> เพื่อไม่ให้ตั้งราคาจนขาดทุน
                  </p>
                </div>
              </div>

              <div className="simulator-box">
                <div className="section-heading">
                  <div>
                    <h2>ตั้งสมมติฐานราคา</h2>
                    <p>คำนวณตามต้นทุนจริงและกฎค่าบริการปัจจุบันของร้าน</p>
                  </div>
                  <span className="badge warn">ผลประมาณการ</span>
                </div>

                <div className="form-grid">
                  {skuSelect}
                  <label>
                    ลองใส่ส่วนลด (%)
                    <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} />
                  </label>
                  <label>
                    หรือระบุราคาขายต่อหน่วยที่ต้องการ (บาท)
                    <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="เช่น 249.00" />
                  </label>
                </div>

                <button
                  style={{ marginTop: 14 }}
                  disabled={busy || !sku}
                  onClick={() => void act(async () => setSelected(await request(base + '/simulations?month=' + month, {
                    sku,
                    ...(price ? {
                      priceSatang: Math.round(Number(price) * 100)
                    } : {
                      discountPct: Number(discount)
                    })
                  })))}
                >
                  <Icon name="calculator" />
                  คำนวณผลลัพธ์ทันที
                </button>
              </div>

              {selected && (
                <section>
                  <h2>ผลการจำลองราคา</h2>
                  <div style={{ margin: '14px 0' }}>
                    <span className="break-even-pill">
                      💡 ราคาคุ้มทุน (ราคาต่ำสุดที่ไม่ขาดทุน): ฿{money(selected.breakEven.priceSatang)} / ชิ้น
                    </span>
                  </div>
                  <Evidence result={selected.scenario} />
                  <p className="muted">ส่วนต่าง TTR รวมโฆษณา {selected.incrementalTtrPercentagePoints ?? 'ไม่ทราบ'} percentage points</p>
                </section>
              )}
            </>
          )}

          {/* VIEW 6: สแกนบิลซื้อ (Receipt OCR) */}
          {view === 6 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="receipt" /></span>
                <div className="guide-card-content">
                  <h3>สแกนบิลซื้อด้วย AI</h3>
                  <p>
                    ถ่ายภาพบิลซื้อจากซัพพลายเออร์ AI จะช่วยอ่านรายการสินค้า จำนวน และยอดเงินให้อัตโนมัติ 
                    คุณเพียงตรวจสอบความถูกต้องแล้วกดยืนยันเพื่อบันทึกเป็นต้นทุนใหม่ได้ทันที
                  </p>
                </div>
              </div>

              <Steps items={['1. อัปโหลดภาพบิล', '2. ตรวจสอบร่าง AI', '3. ยืนยันบันทึกต้นทุน']} current={receiptId ? 1 : 0} />

              <section>
                <h2>1. ส่งภาพบิลให้อ่าน</h2>
                <p>รองรับไฟล์ภาพ JPG หรือ PNG ขนาดไม่เกิน 3 MB (ภาพควรมองเห็นตัวหนังสือและยอดเงินชัดเจน)</p>
                <div className="form-grid">
                  <label>
                    เลือกภาพถ่ายบิล
                    <input type="file" accept="image/jpeg,image/png" onChange={e => {
                      setFile(e.target.files?.[0]);
                      setMerchantAck(false);
                    }} />
                  </label>
                  <label>
                    แหล่งข้อมูล
                    <select value={origin} disabled={realStore || guest} onChange={e => setOrigin(e.target.value)}>
                      <option value="MOCK">ข้อมูลจำลอง</option>
                      <option value="REAL">ข้อมูลจริง</option>
                    </select>
                  </label>
                </div>
                <button disabled={busy || !file} onClick={() => void act(async () => {
                  const j = await request(base + '/receipts', {
                    fileName: file!.name,
                    dataOrigin: origin
                  });
                  await upload(j.uploadUrl, file!, j.contentType);
                  await request(base + '/receipts/' + j.id + '/complete', {});
                  setReceiptId(j.id);
                  await refresh();
                })}>
                  <Icon name="receipt" />
                  ส่งภาพบิลให้ AI อ่าน
                </button>
              </section>

              <section>
                <h2>2. ตรวจสอบและยืนยันต้นทุน</h2>
                {!busy && !jobs.some(j => j.kind === 'receipt') && (
                  <EmptyState icon="receipt" title="ยังไม่มีภาพบิลที่ส่งอ่าน">
                    ถ่ายภาพหรือเลือกไฟล์บิลด้านบนเพื่อเริ่มต้น
                  </EmptyState>
                )}

                <label>
                  เลือกบิลที่ต้องการตรวจ
                  <select value={receiptId} onChange={e => setReceiptId(e.target.value)}>
                    <option value="">-- เลือกบิล --</option>
                    {jobs.filter(j => j.kind === 'receipt').map(j => (
                      <option key={j.id} value={j.id}>{j.fileName} — {status(j.status)}</option>
                    ))}
                  </select>
                </label>

                {jobs.filter(j => j.id === receiptId).map(j => (
                  <div key={j.id}>
                    <p><Badge value={j.status} />{j.error && ' ' + j.error}</p>
                    {j.draft && (
                      <div className="receipt-draft">
                        <p className="notice">ร่างจาก AI · โปรดตรวจทานเทียบกับบิลต้นฉบับก่อนยืนยัน</p>
                        <p><strong>วันที่ในบิล:</strong> {j.draft.date ?? 'อ่านไม่ได้'} · <strong>ยอดรวมทั้งบิล:</strong> {j.draft.totalTHB ?? 'อ่านไม่ได้'} บาท</p>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>ชื่อรายการที่อ่านได้</th>
                                <th>จำนวน</th>
                                <th>หน่วย</th>
                                <th>ยอดเงิน (บาท)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {j.draft.items?.map((item: any, i: number) => (
                                <tr key={i}>
                                  <td>{item.name ?? 'อ่านไม่ได้'}</td>
                                  <td>{item.quantity ?? 'อ่านไม่ได้'}</td>
                                  <td>{item.unit ?? 'อ่านไม่ได้'}</td>
                                  <td>{item.lineTotalTHB ?? 'อ่านไม่ได้'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {j.totalsMatch === false && <p className="notice">⚠️ ยอดรวมของแต่ละรายการไม่ตรงกับยอดรวมบิล กรุณาตรวจทานตัวเลขด้านล่าง</p>}
                  </div>
                ))}

                <div className="form-grid">
                  {skuSelect}
                  <label>
                    จำนวนหน่วยในบิล
                    <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="เช่น 10" />
                  </label>
                  <label>
                    ชิ้นต่อแพ็ก (ถ้าซื้อเป็นแพ็ก)
                    <input type="number" min="1" value={units} onChange={e => setUnits(e.target.value)} placeholder="1" />
                  </label>
                  <label>
                    ยอดรวมของรายการนี้ (บาท)
                    <input value={total} onChange={e => setTotal(e.target.value)} placeholder="เช่น 1200.00" />
                  </label>
                  <label>
                    วันเริ่มใช้ต้นทุนนี้
                    <input type="date" value={effective} onChange={e => setEffective(e.target.value)} />
                  </label>
                </div>

                <p className="muted">เมื่อกดยืนยัน ระบบจะคำนวณต้นทุนต่อชิ้นและสร้างเวอร์ชันต้นทุนใหม่ให้สินค้านี้ทันที</p>
                <button
                  disabled={!receiptId || busy || !qty || !units || !total || !effective}
                  onClick={() => void act(async () => {
                    await request(base + '/receipts/' + receiptId + '/confirm', {
                      effectiveFrom: dateAt(effective),
                      acknowledgeTotals: true,
                      items: [{
                        sku,
                        quantity: Number(qty),
                        unitsPerPack: Number(units),
                        lineTotalTHB: total
                      }]
                    });
                    await refresh();
                  })}
                >
                  <Icon name="check" />
                  ตรวจถูกต้องแล้ว บันทึกเป็นต้นทุน
                </button>
              </section>
            </>
          )}

          {/* VIEW 7: กฎค่าบริการและแคมเปญ (Fee Rules) */}
          {view === 7 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="rules" /></span>
                <div className="guide-card-content">
                  <h3>กฎค่าธรรมเนียมแพลตฟอร์ม</h3>
                  <p>
                    อัตราค่าบริการและแคมเปญที่ใช้คำนวณกำไรสุทธิของร้าน ระบบจะคิดตามอัตราที่มีผลจริง ณ วันที่เกิดออเดอร์
                  </p>
                </div>
              </div>

              <section>
                <h2>อัตราค่าบริการและแคมเปญปัจจุบัน</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ประเภทกฎ / แคมเปญ</th>
                        <th>อัตราหัก (%)</th>
                        <th>ขอบเขตการคิด</th>
                        <th>แหล่งข้อมูล / สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.rules?.map((r: any) => (
                        <tr key={r.id + '#' + r.version}>
                          <td>{r.type}<small>{r.programId ?? 'กฎพื้นฐาน'}</small></td>
                          <td><strong>{r.rateBps / 100}%</strong></td>
                          <td>{r.scope}</td>
                          <td>{r.sourceRef}<small>{r.status}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ marginTop: 20 }}>หลักฐานการเข้าร่วมแคมเปญ</h3>
                {!busy && data?.rules?.length === 0 && <p className="notice">ยังไม่มีกฎค่าบริการที่บันทึกไว้</p>}
                {!busy && data?.enrollments?.length === 0 && <p className="muted">ยังไม่มีรายการเข้าร่วมแคมเปญ</p>}
                {data?.enrollments?.map((e: any) => (
                  <p key={e.id}>{e.programId} · {localDate(e.effectiveFrom)} ถึง {e.effectiveTo ? localDate(e.effectiveTo) : 'ไม่ระบุ'} · {e.sourceRef}</p>
                ))}
              </section>

              <details style={{ marginTop: 20 }}>
                <summary>การตั้งค่ากฎเพิ่มเติม (สำหรับผู้ดูแลระบบ)</summary>
                <div className="form-card" style={{ marginTop: 14 }}>
                  <div className="chips">
                    <button className="secondary" onClick={() => {
                      setRuleKind('fee-rules');
                      setJson(JSON.stringify({
                        id: 'custom',
                        type: 'custom',
                        scope: 'PER_ORDER',
                        base: 'REVENUE',
                        rateBps: 0,
                        fixedSatang: 0,
                        vat: 'UNKNOWN',
                        status: 'UNVERIFIED',
                        effectiveFrom: dateAt(effective || localDate(new Date().toISOString())),
                        sourceRef: 'กรุณาใส่หลักฐาน',
                        sourceUrl: '',
                        dataOrigin: origin
                      }, null, 2));
                    }}>
                      โหลดตัวอย่างกฎ
                    </button>
                    <button className="secondary" onClick={() => {
                      setRuleKind('enrollments');
                      setJson(JSON.stringify({
                        programId: 'campaign',
                        effectiveFrom: dateAt(effective || localDate(new Date().toISOString())),
                        skus: [sku],
                        sourceRef: 'กรุณาใส่หลักฐาน',
                        dataOrigin: origin
                      }, null, 2));
                    }}>
                      โหลดตัวอย่างแคมเปญ
                    </button>
                  </div>
                  <label>
                    ประเภทข้อมูลที่จะบันทึก
                    <select value={ruleKind} onChange={e => {
                      setRuleKind(e.target.value);
                      setJson('');
                    }}>
                      <option value="fee-rules">กฎค่าบริการ</option>
                      <option value="enrollments">หลักฐานเข้าร่วมแคมเปญ</option>
                    </select>
                  </label>
                  <label className="editor-label">
                    ข้อมูลเวอร์ชัน (JSON)
                    <textarea className="json" value={json} onChange={e => setJson(e.target.value)} spellCheck={false} />
                  </label>
                  <button disabled={!json || busy} onClick={() => void act(async () => {
                    await request(base + '/' + ruleKind, JSON.parse(json));
                    await refresh();
                  })}>
                    บันทึกกฎใหม่
                  </button>
                </div>
              </details>
            </>
          )}

          {/* ========================================================
              MAIN TAB 3: ผู้ช่วย AI
              Sub-tab 0: ถามผู้ช่วย AI
              Sub-tab 1: เชื่อมต่อ LINE
             ======================================================== */}

          {/* VIEW 5: ถามผู้ช่วย AI (AI Chat) */}
          {view === 5 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="assistant" /></span>
                <div className="guide-card-content">
                  <h3>ผู้ช่วยคิดเลขและวิเคราะห์ร้าน</h3>
                  <p>
                    ถามเป็นภาษาไทยได้เลย เช่น ชิ้นนี้ลดราคาได้ไหม หรือราคาคุ้มทุนเท่าไร 
                    AI จะคำนวณจากสูตรและข้อมูลจริงของร้านคุณโดยไม่เดาตัวเลข
                  </p>
                </div>
              </div>

              <div className="chat-container">
                <div className="chat-header">
                  <div className="chat-header-avatar">
                    <Icon name="assistant" />
                  </div>
                  <div className="chat-header-text">
                    <h3>ผู้ช่วยร้านค้า MarginSight</h3>
                    <p>คำนวณจากสูตรและข้อมูลจริงของร้าน ตอบตรงไปตรงมา</p>
                  </div>
                </div>

                <div className="chat-body">
                  <div className="chat-bubble ai">
                    สวัสดีครับคุณ <strong>{storeInfo?.name ?? 'เจ้าของร้าน'}</strong>! วันนี้มีคำถามเรื่องราคาสินค้า โปรโมชัน หรืออยากรู้ว่าชิ้นไหนเหลือกำไรเท่าไร แตะเลือกคำถามด้านล่างหรือพิมพ์ถามได้เลยครับ 💡
                  </div>

                  {answer && (
                    <>
                      <div className="chat-bubble user">
                        {message || 'คำถามเกี่ยวกับสินค้า ' + sku}
                      </div>

                      <div className="chat-bubble ai">
                        <div style={{ marginBottom: 6 }}>
                          <Badge value={answer.provider === 'deterministic-fallback' ? 'สูตรคำนวณโดยตรง' : 'ผู้ช่วย AI'} />
                        </div>
                        <p style={{ margin: '6px 0', fontSize: 15, lineHeight: 1.6 }}>{answer.answer}</p>
                        {answer.reason && <small className="muted">{answer.reason}</small>}

                        {answer.result?.profitSatang !== undefined && (
                          <div className="chat-financial-card">
                            <strong style={{ fontSize: 13, color: 'var(--green-dark)' }}>📊 สรุปตัวเลขคำนวณ</strong>
                            <div className="chat-financial-metrics">
                              <article>
                                <small>รายรับสินค้า</small>
                                <strong>฿{money(answer.result.revenueSatang)}</strong>
                              </article>
                              <article>
                                <small>ค่าบริการแพลตฟอร์ม</small>
                                <strong>฿{money(answer.result.feeSatang)}</strong>
                              </article>
                              <article>
                                <small>ต้นทุนสินค้า</small>
                                <strong>฿{money(answer.result.cogsSatang)}</strong>
                              </article>
                              <article>
                                <small>กำไรสุทธิ</small>
                                <strong className={answer.result.profitSatang < 0 ? 'negative' : 'positive'}>
                                  ฿{money(answer.result.profitSatang)}
                                </strong>
                              </article>
                            </div>
                            <details style={{ marginTop: 8 }}>
                              <summary>ดูสูตรและที่มาของตัวเลข</summary>
                              <Evidence result={answer.result} />
                            </details>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="chat-input-area">
                  <div className="chat-prompt-chips">
                    {[
                      'ตัวนี้ลดสิบห้าเปอร์ยังไหวปะ',
                      'ราคาคุ้มทุนเท่าไหร่',
                      'กำไรตัวนี้มาจากอะไร',
                      'เข้าโปรแกรมกับไม่เข้าแบบไหนคุ้ม'
                    ].map(t => (
                      <button
                        key={t}
                        className="chat-prompt-chip"
                        onClick={() => setMessage(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>สินค้าที่ต้องการถาม:</span>
                    <select
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      style={{ fontSize: 13, padding: '6px 10px', height: 38 }}
                    >
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="chat-input-row">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="พิมพ์คำถามของคุณที่นี่..."
                      rows={2}
                    />
                    <button
                      disabled={!message || busy || !sku}
                      onClick={() => void act(async () => setAnswer(await request(base + '/assistant', {
                        message,
                        sku,
                        month
                      })))}
                    >
                      <Icon name="assistant" />
                      ส่งคำถาม
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW 9: เชื่อมต่อ LINE (LINE Integration) */}
          {view === 9 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="line" /></span>
                <div className="guide-card-content">
                  <h3>ปรึกษาผู้ช่วยผ่านแอป LINE</h3>
                  <p>
                    ผูกบัญชีร้านค้าของคุณกับ LINE Bot เพื่อรับสรุปยอดกำไรประจำวัน และสามารถพิมพ์ถามเรื่องต้นทุนหรือราคาได้โดยตรงจากมือถือ
                  </p>
                </div>
              </div>

              <div className="line-connect-box">
                <div className="connection-heading">
                  <span className="connection-icon"><Icon name="line" /></span>
                  <div>
                    <h2>ขั้นตอนการเชื่อมต่อ LINE</h2>
                    <span className={data?.line?.configured ? 'badge' : 'badge warn'}>
                      {data?.line?.configured ? 'ช่องทางพร้อมเชื่อมต่อ' : 'ระบบ LINE ยังไม่พร้อมใช้งาน'}
                    </span>
                  </div>
                </div>

                <div className="line-steps-grid">
                  <div className="line-step-item">
                    <div className="line-step-badge">1</div>
                    <strong>แอดเพื่อนบอต LINE</strong>
                    <p>เพิ่มเพื่อนบัญชี LINE ทางการของ MarginSight บนมือถือของคุณ</p>
                  </div>
                  <div className="line-step-item">
                    <div className="line-step-badge">2</div>
                    <strong>กดสร้างรหัสเชื่อมต่อ</strong>
                    <p>กดปุ่มด้านล่างเพื่อรับรหัสยืนยัน 6 หลัก (รหัสจะหมดอายุภายใน 5 นาที)</p>
                  </div>
                  <div className="line-step-item">
                    <div className="line-step-badge">3</div>
                    <strong>ส่งรหัสในแชต LINE</strong>
                    <p>พิมพ์รหัสที่ได้ส่งให้บอตในแชต LINE เพื่อเสร็จสิ้นการผูกร้านค้า</p>
                  </div>
                </div>

                <button
                  disabled={busy || !data?.line?.configured}
                  onClick={() => void act(async () => setLink(await request(base + '/line/link', {})))}
                >
                  <Icon name="line" />
                  สร้างรหัสผูกร้านกับ LINE
                </button>

                {link && (
                  <div className="answer" style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green-dark)', letterSpacing: 2 }}>
                      {link.code}
                    </div>
                    <p style={{ marginTop: 6 }}>{link.instruction}</p>
                    <small className="muted">รหัสนี้ใช้ได้เพียงครั้งเดียว และจะหมดอายุใน 5 นาที</small>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========================================================
              MAIN TAB 4: คำสั่งซื้อ
              Sub-tab 0: รายการออเดอร์
              Sub-tab 1: กระทบยอดเงินโอน
             ======================================================== */}

          {/* VIEW 3: รายการออเดอร์ (Orders List) */}
          {view === 3 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="orders" /></span>
                <div className="guide-card-content">
                  <h3>ตรวจสอบคำสั่งซื้อและค่าบริการ</h3>
                  <p>
                    ดูรายการออเดอร์ทั้งหมดในเดือนที่เลือก ตรวจสอบรายการเงินหัก และยืนยันความถูกต้องเมื่อแพลตฟอร์มสรุปยอดครบถ้วนแล้ว
                  </p>
                </div>
              </div>

              <section>
                <h2>รายการคำสั่งซื้อประจำเดือน</h2>
                {!busy && data?.items?.length === 0 && (
                  <EmptyState title="ยังไม่มีออเดอร์ในเดือนนี้" action={<button onClick={() => setView(1)}><Icon name="upload" />นำเข้ารายงาน</button>}>
                    เลือกเดือนอื่น หรือไปที่แท็บ &ldquo;นำเข้ารายงาน&rdquo; เพื่ออัปโหลดไฟล์ออเดอร์
                  </EmptyState>
                )}

                {data?.items?.map((o: any) => (
                  <div className="order-row" key={o.key}>
                    <div>
                      <strong>{o.orderId}</strong>
                      <p>{localDate(o.orderAt)} · {o.platform}</p>
                    </div>

                    {!o.feesConfirmed && selected?.orderId === o.orderId && selected?.platform === o.platform && selected?.postedFees?.length > 0 && (
                      <button className="secondary" onClick={() => void act(async () => {
                        setSelected(await request(base + '/orders/' + o.key + '/settle', {
                          confirmAllFeeLines: true,
                          expectedInputHash: selected.inputHash
                        }));
                        await refresh();
                      })}>
                        ตรวจครบแล้ว: ยืนยันค่าบริการ
                      </button>
                    )}

                    <button className="secondary" onClick={() => void act(async () => setSelected(await request(base + '/orders/' + o.key + '/calculation')))}>
                      ดูหลักฐาน / เงินหัก
                    </button>
                  </div>
                ))}

                {data?.next && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => void act(async () => setData(await request(base + '/orders?month=' + month + '&cursor=' + encodeURIComponent(data.next))))}>
                      โหลดหน้าถัดไป
                    </button>
                  </div>
                )}

                {selected && <Evidence result={selected} />}
              </section>
            </>
          )}

          {/* VIEW 8: กระทบยอดเงินโอน (Reconciliation) */}
          {view === 8 && (
            <>
              <div className="guide-card">
                <span className="guide-card-icon"><Icon name="reconcile" /></span>
                <div className="guide-card-content">
                  <h3>กระทบยอดเงินโอนจริงจากแพลตฟอร์ม</h3>
                  <p>
                    เปรียบเทียบค่าบริการประมาณการกับยอดหักจริงจากรายงานสเตตเมนต์ของแพลตฟอร์ม เพื่อดูว่ามีเงินหักที่เกินมาหรือไม่
                  </p>
                </div>
              </div>

              <section>
                <div className="section-heading">
                  <div>
                    <h2>เปรียบเทียบค่าบริการและเงินโอน (Payout)</h2>
                    <p>ตรวจสอบเฉพาะยอดรับสินค้าหลังหักค่าบริการ ยอดจริงต้องตรงถึงระดับสตางค์</p>
                  </div>
                  <div className="chips">
                    {['csv', 'xlsx'].map(format => (
                      <button key={format} className="secondary" onClick={() => void act(async () => {
                        const result = await request(base + '/reports/export?month=' + month + '&format=' + format);
                        await download(result.downloadUrl);
                      })}>
                        <Icon name="upload" />
                        ส่งออก {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {!busy && data?.items?.length === 0 && (
                  <EmptyState icon="reconcile" title="ยังไม่มีรายการให้กระทบยอดในเดือนนี้">
                    นำเข้าออเดอร์และรายการเงินหักในแท็บ &ldquo;นำเข้ารายงาน&rdquo; หรือเลือกเดือนอื่นที่มีข้อมูล
                  </EmptyState>
                )}

                <div className="table-scroll">
                  <table className="mobile-cards">
                    <thead>
                      <tr>
                        <th>เลขที่ออเดอร์</th>
                        <th>ค่าบริการประมาณการ</th>
                        <th>รายการหักจริง</th>
                        <th>ส่วนต่าง (บาท)</th>
                        <th>สถานะเงินโอน (Payout)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.items?.map((r: any) => (
                        <tr key={r.key}>
                          <td data-label="เลขที่ออเดอร์">{r.orderId}</td>
                          <td data-label="ค่าบริการประมาณการ">{money(r.estimatedFeeSatang)} บาท</td>
                          <td data-label="รายการหักจริง">{money(r.actualFeeSatang)} บาท</td>
                          <td data-label="ส่วนต่าง (บาท)">
                            <span className={r.varianceSatang !== 0 ? 'negative' : 'positive'}>
                              {money(r.varianceSatang)}
                            </span>
                          </td>
                          <td data-label="สถานะเงินโอน">
                            <span className={'badge ' + (r.payoutReconciled ? '' : 'warn')}>
                              {r.payoutReconciled === null ? 'ไม่มีหลักฐาน' : r.payoutReconciled ? 'ยอดตรง' : 'ยอดไม่ตรง'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <footer>
            <span>MarginSight · ทุกตัวเลขมีที่มาและแสดงข้อมูลที่ยังขาด<br />ข้อมูลจำลองใช้สาธิต ไม่ใช่อัตราค่าบริการแพลตฟอร์มจริง</span>
            <span className="foot-version">เห็นกำไร เข้าใจร้าน</span>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Clean 4 Core Tabs) */}
      <nav className="bottom-nav" aria-label="เมนูหลักสำหรับมือถือ">
        {mainTabs.map((mt, idx) => {
          const isActive = idx === activeMainTabIndex;
          return (
            <button
              key={mt.id}
              className={'bottom-nav-item' + (isActive ? ' active' : '')}
              onClick={() => {
                setView(mt.defaultView);
                setNavOpen(false);
              }}
              aria-label={mt.label}
            >
              <Icon name={mt.icon} />
              <span>{mt.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
