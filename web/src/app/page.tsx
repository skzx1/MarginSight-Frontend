'use client';

import { useEffect, useRef, useState } from 'react';
import Preview from './preview';
import Onboarding from './onboarding';
import { Brand, Icon, EmptyState, Steps, PageIntro } from './ui';
import type { IconName } from './ui';
import DashboardSummary from './dashboard-summary';
import { demo, login, session, request, upload, download, logout, localMode, fullDemo, fullDemoMode } from '../lib/auth';

const menus = [
  'ภาพรวม & ยอดขาย',
  'นำเข้ารายงาน',
  'สินค้าและราคา',
  'คำสั่งซื้อ',
  'จำลองราคา & ส่วนลด',
  'ผู้ช่วย AI',
  'อ่านบิลซื้อ (OCR)',
  'กฎค่าบริการและแคมเปญ',
  'กระทบยอดเงินโอน',
  'เชื่อมต่อ LINE',
  'ศูนย์จัดการร้าน'
];

const menuIcons: IconName[] = [
  'overview',
  'upload',
  'products',
  'orders',
  'simulation',
  'assistant',
  'receipt',
  'rules',
  'reconcile',
  'line',
  'settings'
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
  'ผูกช่องทางสนทนากับสิทธิ์ร้านของคุณเพื่อรับแจ้งเตือน',
  'จัดการเอกสาร นำเข้ารายงาน ตรวจสอบยอดเงินโอน และตั้งค่าร้าน'
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
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
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
    // UI redesign state additions
    [productSearch, setProductSearch] = useState(''),
    [filterCost, setFilterCost] = useState<'all' | 'has_cost' | 'missing_cost'>('all'),
    [showAddProduct, setShowAddProduct] = useState(false),
    [showAddCost, setShowAddCost] = useState(false);

  const navigationRef = useRef<HTMLElement>(null),
    wasNavOpen = useRef(false);

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
    document.title = ready ? menus[view] + ' · MarginSight' : 'MarginSight — ดูกำไรจากข้อมูลจริง';
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

  // Filtered products list
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
      
      {/* Desktop / Off-canvas Sidebar */}
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

        <nav aria-label="หน้าจัดการร้าน">
          <span className="nav-caption">เมนูหลัก</span>
          {/* Core Primary Navigation (4 core items) */}
          {[
            { v: 0, label: 'ภาพรวม & ยอดขาย', icon: 'overview' as const },
            { v: 2, label: 'สินค้า & เช็กกำไร', icon: 'products' as const },
            { v: 5, label: 'ผู้ช่วย AI', icon: 'assistant' as const },
            { v: 3, label: 'คำสั่งซื้อ', icon: 'orders' as const }
          ].map(item => (
            <button
              key={item.v}
              aria-current={item.v === view ? 'page' : undefined}
              className={item.v === view ? 'active' : ''}
              onClick={() => {
                setData(null);
                setSelected(null);
                setView(item.v);
                setNavOpen(false);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}

          <span className="nav-caption" style={{ marginTop: 18 }}>การจัดการและตั้งค่า</span>
          {/* Store Management Hub & Technical Operations */}
          <button
            aria-current={view === 10 ? 'page' : undefined}
            className={view === 10 ? 'active' : ''}
            onClick={() => {
              setData(null);
              setSelected(null);
              setView(10);
              setNavOpen(false);
            }}
          >
            <Icon name="settings" />
            ศูนย์จัดการร้าน
          </button>
          {[
            { v: 1, label: 'นำเข้ารายงาน', icon: 'upload' as const },
            { v: 6, label: 'อ่านบิลซื้อ (OCR)', icon: 'receipt' as const },
            { v: 4, label: 'จำลองราคา & ส่วนลด', icon: 'simulation' as const },
            { v: 8, label: 'กระทบยอดเงินโอน', icon: 'reconcile' as const },
            { v: 7, label: 'กฎและแคมเปญ', icon: 'rules' as const },
            { v: 9, label: 'เชื่อมต่อ LINE', icon: 'line' as const }
          ].map(item => (
            <button
              key={item.v}
              aria-current={item.v === view ? 'page' : undefined}
              className={item.v === view ? 'active' : ''}
              style={{ fontSize: 12, paddingLeft: 24, minHeight: 38 }}
              onClick={() => {
                setData(null);
                setSelected(null);
                setView(item.v);
                setNavOpen(false);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
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

      {/* Main Workspace */}
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
            <span>พื้นที่ร้านค้า</span>
            <span>/</span>
            <strong>{menus[view] ?? 'ร้านของคุณ'}</strong>
          </div>
          <div className="topbar-right">
            <Badge value={guest ? 'MOCK' : storeInfo?.dataOrigin ?? 'REAL'} />
            <span className="topbar-store">{storeInfo?.name ?? 'ร้านของคุณ'}</span>
            <span className="store-avatar" aria-hidden="true">{(storeInfo?.name ?? 'M').slice(0, 1)}</span>
            <button
              className="ghost"
              style={{ padding: '6px 10px', minHeight: 36 }}
              aria-label="ศูนย์จัดการร้าน"
              onClick={() => setView(10)}
            >
              <Icon name="settings" />
            </button>
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
              <span className="eyebrow">{storeInfo?.name ?? 'ร้านของคุณ'}</span>
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

          {/* VIEW 0: ภาพรวม & วิเคราะห์ยอดขาย (Home / Sales & Profit Analytics) */}
          {view === 0 && data?.totalOrders === 0 && (
            <section>
              <h2>ร้านของคุณพร้อมแล้ว เริ่มจากข้อมูลที่มี</h2>
              <p>ยังไม่มีออเดอร์ในเดือนนี้ จึงยังไม่แสดงยอดกำไร เพิ่มสินค้าและต้นทุน แล้วนำเข้าออเดอร์กับรายการค่าบริการ</p>
              <div className="chips">
                <button onClick={() => setView(2)}>1. เพิ่มสินค้าและต้นทุน</button>
                <button className="secondary" onClick={() => {
                  setKind('orders');
                  setView(1);
                }}>
                  2. นำเข้ารายงาน
                </button>
              </div>
              <p className="muted">ใช้ไฟล์ตามแบบ MarginSight หรือเตรียมข้อมูลจากรายงานร้าน ระบบยังไม่ดึงรายงานจากแพลตฟอร์มอัตโนมัติ</p>
            </section>
          )}

          {view === 0 && data?.totalOrders > 0 && (
            <>
              <DashboardSummary data={data} products={products} onNavigate={setView} />
              <section>
                <h2>ออเดอร์ล่าสุด</h2>
                {data.totalOrders > data.results.length && (
                  <p>แสดงล่าสุด {data.results.length} จาก {data.totalOrders} ออเดอร์ ยอดรวมด้านบนคิดจากออเดอร์ข้อมูลครบทั้งหมดของเดือนที่เลือก</p>
                )}
                {data.incompleteOrders > 0 && (
                  <p className="notice">{data.incompleteOrders} ออเดอร์ยังข้อมูลไม่ครบ จึงยังไม่รวมในยอดกำไรด้านบน</p>
                )}
                {data.results.map((r: any) => (
                  <div className="order-row" key={r.inputHash}>
                    <div>
                      <strong>{r.orderId}</strong>
                      <p>{r.platform} · <Badge value={r.status} /></p>
                    </div>
                    <strong className={r.profitSatang < 0 ? 'negative' : ''}>
                      ฿{money(r.profitSatang)}
                    </strong>
                    <button className="secondary" onClick={() => setSelected(r)}>ดูหลักฐาน</button>
                  </div>
                ))}
                {selected && <Evidence result={selected} />}
              </section>
            </>
          )}

          {/* VIEW 2: สินค้าและราคา/กำไร (Products & Profit Margins) */}
          {view === 2 && (
            <>
              <PageIntro icon="products" title="เช็กราคา ต้นทุน และกำไรสินค้า">
                ดูต้นทุนปัจจุบัน เพิ่มสินค้า หรือจำลองการตั้งราคาเพื่อดูผลกำไรก่อนขายจริง
              </PageIntro>

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
                    🟢 มีต้นทุน ({products.filter(p => !!p.cost).length})
                  </button>
                  <button
                    className={'filter-chip' + (filterCost === 'missing_cost' ? ' active' : '')}
                    onClick={() => setFilterCost('missing_cost')}
                  >
                    🔴 ขาดต้นทุน ({products.filter(p => !p.cost).length})
                  </button>
                </div>
                <div className="chips">
                  <button onClick={() => setShowAddProduct(!showAddProduct)}>
                    <Icon name="plus" />
                    {showAddProduct ? 'ซ่อนฟอร์ม' : 'เพิ่มสินค้า'}
                  </button>
                  <button className="secondary" onClick={() => setShowAddCost(!showAddCost)}>
                    <Icon name="calculator" />
                    {showAddCost ? 'ซ่อนต้นทุน' : 'บันทึกต้นทุน'}
                  </button>
                  <button className="secondary" onClick={() => setView(6)}>
                    <Icon name="receipt" />
                    สแกนบิลซื้อ
                  </button>
                  <button className="secondary" onClick={() => setView(4)}>
                    <Icon name="simulation" />
                    ลองคำนวณราคา
                  </button>
                </div>
              </div>

              {/* Collapsible: Add Product Form */}
              {showAddProduct && (
                <div className="form-card">
                  <div className="form-card-head">
                    <h2>เพิ่มสินค้าใหม่</h2>
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

              {/* Collapsible: Add Cost Version Form */}
              {showAddCost && (
                <div className="form-card">
                  <div className="form-card-head">
                    <h2>บันทึกเวอร์ชันต้นทุน</h2>
                    <button className="ghost" onClick={() => setShowAddCost(false)}><Icon name="close" /></button>
                  </div>
                  <div className="form-grid">
                    {skuSelect}
                    <label>
                      ต้นทุนบาทต่อหน่วย
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitCost}
                        onChange={e => setUnitCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      วันเริ่มใช้
                      <input type="date" value={effective} onChange={e => setEffective(e.target.value)} />
                    </label>
                    <label>
                      หลักฐาน เช่น บิลซื้อ / ใบเสนอราคา
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

              {/* Product Cards Grid (Mobile/Desktop Friendly) */}
              <section>
                <div className="section-heading">
                  <div>
                    <h2>รายการสินค้า ({filteredProducts.length} รายการ)</h2>
                    <p>แตะสินค้าเพื่อลองราคาหรืออัปเดตต้นทุน</p>
                  </div>
                  <button className="secondary" onClick={() => {
                    setKind('products');
                    setView(1);
                  }}>
                    <Icon name="upload" />
                    นำเข้าไฟล์สินค้า
                  </button>
                </div>

                {!busy && filteredProducts.length === 0 && (
                  <EmptyState icon="products" title="ไม่พบสินค้าตามที่ค้นหา">
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
                          <strong className={!p.cost ? 'negative' : ''}>
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

          {/* VIEW 5: ผู้ช่วย AI (AI Shop Assistant Chat) */}
          {view === 5 && (
            <>
              <PageIntro icon="assistant" title="ผู้ช่วยคิดกำไรจากข้อมูลร้าน">
                ถามเป็นภาษาไทยเรื่องกำไร ส่วนลด หรือจุดคุ้มทุน คำนวณจากสูตรและข้อมูลร้านของคุณ
              </PageIntro>

              <div className="chat-container">
                <div className="chat-header">
                  <div className="chat-header-avatar">
                    <Icon name="assistant" />
                  </div>
                  <div className="chat-header-text">
                    <h3>ผู้ช่วยร้านค้า MarginSight</h3>
                    <p>พร้อมตอบคำถามทางการเงินและอธิบายกำไรให้เข้าใจง่าย</p>
                  </div>
                </div>

                <div className="chat-body">
                  <div className="chat-bubble ai">
                    สวัสดีครับคุณ <strong>{storeInfo?.name ?? 'เจ้าของร้าน'}</strong>! วันนี้มีข้อสงสัยเรื่องกำไร ชิ้นไหนขายดี หรืออยากลองตั้งราคาถามผมได้เลยครับ ตัวเลขคำนวณจากข้อมูลร้านและตรวจสอบได้เสมอครับ 💡
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
                              <summary>ดูสูตรคำนวณและหลักฐาน</summary>
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
                    <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>สินค้าที่ถาม:</span>
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
                      placeholder="พิมพ์คำถามของคุณ เช่น ตัวนี้ลด 10% จะยังเหลือกำไรกี่บาท..."
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

          {/* VIEW 3: รายการคำสั่งซื้อ (Orders & Records) */}
          {view === 3 && (
            <>
              <PageIntro icon="orders" title="ทุกออเดอร์มีที่มาและหลักฐาน">
                ตรวจรายการเงินหักและต้นทุน ก่อนยืนยันยอดค่าบริการที่ครบชุด
              </PageIntro>

              <section>
                <h2>รายการออเดอร์ประจำเดือน</h2>
                {!busy && data?.items?.length === 0 && (
                  <EmptyState title="ยังไม่มีออเดอร์ในเดือนนี้" action={<button onClick={() => setView(1)}><Icon name="upload" />นำเข้ารายงาน</button>}>
                    เลือกเดือนอื่น หรือนำเข้าออเดอร์และค่าบริการเพื่อเริ่มคำนวณ
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
                        ตรวจครบแล้ว ยืนยันค่าบริการ
                      </button>
                    )}
                    <button className="secondary" onClick={() => void act(async () => setSelected(await request(base + '/orders/' + o.key + '/calculation')))}>
                      คำนวณ / ดูหลักฐาน
                    </button>
                  </div>
                ))}
                {data?.next && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => void act(async () => setData(await request(base + '/orders?month=' + month + '&cursor=' + encodeURIComponent(data.next))))}>
                      หน้าถัดไป
                    </button>
                  </div>
                )}
                {selected && <Evidence result={selected} />}
              </section>
            </>
          )}

          {/* VIEW 4: จำลองราคา & ส่วนลด (Price Simulator) */}
          {view === 4 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(2)}>
                  <Icon name="arrow" /> กลับไปหน้าสินค้า
                </button>
              </div>

              <PageIntro icon="simulation" title="ลองก่อนลด ตัดสินใจก่อนขาย">
                ผลจำลองเป็นประมาณการตามต้นทุนและกฎที่มีผล ไม่ใช่ยอดเรียกเก็บจริงในอนาคต
              </PageIntro>

              <div className="simulator-box">
                <div className="section-heading">
                  <div>
                    <h2>ลดราคาแล้วยังไหวไหม?</h2>
                    <p>ตั้งสมมติฐานราคาหรือส่วนลดเพื่อดูผลกำไร</p>
                  </div>
                  <span className="badge warn">ประมาณการ</span>
                </div>
                <div className="form-grid">
                  {skuSelect}
                  <label>
                    ส่วนลด (%)
                    <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} />
                  </label>
                  <label>
                    หรือระบุราคาต่อหน่วย (บาท)
                    <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="เช่น 199.00" />
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
                  ลองคำนวณ
                </button>
              </div>

              {selected && (
                <section>
                  <h2>ผลจำลอง</h2>
                  <div style={{ margin: '14px 0' }}>
                    <span className="break-even-pill">
                      💡 ราคาที่คุ้มทุน (ไม่ขาดทุน): ฿{money(selected.breakEven.priceSatang)} ต่อหน่วย
                    </span>
                  </div>
                  <Evidence result={selected.scenario} />
                  <p className="muted">ส่วนต่าง TTR {selected.incrementalTtrPercentagePoints ?? 'ไม่ทราบ'} percentage points</p>
                </section>
              )}
            </>
          )}

          {/* VIEW 6: อ่านบิลซื้อ (Receipt OCR Multi-step Flow) */}
          {view === 6 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(10)}>
                  <Icon name="arrow" /> กลับไปศูนย์จัดการร้าน
                </button>
              </div>

              <PageIntro icon="receipt" title="จากภาพบิล สู่ต้นทุนที่ยืนยันแล้ว">
                AI อ่านเป็นร่าง คุณตรวจชื่อ จำนวน หน่วย และยอดเงินก่อนบันทึกทุกครั้ง
              </PageIntro>
              <Steps items={['อัปโหลดภาพ', 'ตรวจร่างและหน่วย', 'ยืนยันต้นทุน']} current={receiptId ? 1 : 0} />

              <section>
                <h2>1. อ่านบิลซื้อเพื่อช่วยเติมต้นทุน</h2>
                <p>อัปโหลดบิลซัพพลายเออร์ JPG/PNG ไม่เกิน 3 MB แล้วตรวจรายการและหน่วยก่อนยืนยัน หากอ่านไม่ได้ให้กรอกด้วยตนเอง</p>
                <div className="form-grid">
                  <label>
                    ภาพบิล
                    <input type="file" accept="image/jpeg,image/png" onChange={e => {
                      setFile(e.target.files?.[0]);
                      setMerchantAck(false);
                    }} />
                  </label>
                  <label>
                    ข้อมูล
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
                  ส่งบิลให้อ่าน
                </button>
              </section>

              <section>
                <h2>2. ตรวจบิลและยืนยันต้นทุน</h2>
                {!busy && !jobs.some(j => j.kind === 'receipt') && (
                  <EmptyState icon="receipt" title="ยังไม่มีบิลที่รอตรวจ">
                    อัปโหลดภาพบิลด้านบน แล้วเลือกบิลเพื่อตรวจร่างก่อนยืนยัน
                  </EmptyState>
                )}
                <label>
                  เลือกบิล
                  <select value={receiptId} onChange={e => setReceiptId(e.target.value)}>
                    <option value="">เลือกบิล</option>
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
                        <p className="notice">ร่างจาก AI · ต้องตรวจเทียบกับบิลต้นฉบับ</p>
                        <p>วันที่: {j.draft.date ?? 'อ่านไม่ได้'} · ยอดรวม: {j.draft.totalTHB ?? 'อ่านไม่ได้'} บาท</p>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>ชื่อที่อ่านได้</th>
                                <th>จำนวน</th>
                                <th>หน่วย</th>
                                <th>ยอดรายการ (บาท)</th>
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
                    {j.totalsMatch === false && <p className="notice">ยอดรายการไม่ตรงยอดรวม ต้องตรวจบิลก่อนยืนยัน</p>}
                  </div>
                ))}
                <div className="form-grid">
                  {skuSelect}
                  <label>
                    จำนวนแพ็ก / หน่วยในบิล
                    <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                  </label>
                  <label>
                    ชิ้นต่อแพ็ก
                    <input type="number" min="1" value={units} onChange={e => setUnits(e.target.value)} />
                  </label>
                  <label>
                    ยอดรวมรายการ (บาท)
                    <input value={total} onChange={e => setTotal(e.target.value)} />
                  </label>
                  <label>
                    วันเริ่มใช้
                    <input type="date" value={effective} onChange={e => setEffective(e.target.value)} />
                  </label>
                </div>
                <p>ปุ่มนี้หมายถึงตรวจ SKU จำนวน หน่วย และยอดเงินกับบิลแล้ว ระบบจะสร้างต้นทุนเวอร์ชันใหม่</p>
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
                  ตรวจแล้ว ยืนยันต้นทุน
                </button>
              </section>
            </>
          )}

          {/* VIEW 1: นำเข้ารายงาน (Import Files & Conflicts) */}
          {view === 1 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(10)}>
                  <Icon name="arrow" /> กลับไปศูนย์จัดการร้าน
                </button>
              </div>

              <PageIntro icon="upload" title="นำข้อมูลเข้าร้าน">
                เริ่มจากสินค้าและต้นทุน แล้วตามด้วยออเดอร์และรายการค่าบริการ
              </PageIntro>
              <Steps items={['เตรียมไฟล์', 'นำเข้าและตรวจ', 'ใช้ข้อมูลที่ยืนยัน']} />

              {guest && (
                <section>
                  <h2>ไฟล์ตัวอย่างสำหรับเดโม</h2>
                  <p>ทดลองนำเข้าได้ 3 ไฟล์ต่อรอบ ใช้ข้อมูลจำลองเท่านั้น</p>
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
                <h2>นำเข้ารายงานครั้งเดียว</h2>
                <p>{realStore ? 'นำเข้าข้อมูลจริงที่ร้านเตรียมตามแบบ MarginSight' : 'นำเข้าข้อมูลจำลองสำหรับร้านสาธิต'} · CSV/XLSX ไม่เกิน 1,000 แถว / 5 MB ต่อไฟล์</p>
                <div className="form-grid">
                  <label>
                    ประเภทข้อมูล
                    <select value={kind} onChange={e => setKind(e.target.value)}>
                      {[['products', 'สินค้า'], ['costs', 'ต้นทุน'], ['orders', 'ออเดอร์'], ['fees', 'รายการค่าบริการ'], ['adjustments', 'คืนเงิน / ปรับปรุง']].map(([v, t]) => (
                        <option key={v} value={v}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ไฟล์ CSV หรือ XLSX
                    <input type="file" accept=".csv,.xlsx" onChange={e => {
                      setFile(e.target.files?.[0]);
                      setMerchantAck(false);
                    }} />
                  </label>
                </div>
                {realStore && (
                  <label className="ack">
                    <input type="checkbox" checked={merchantAck} onChange={e => setMerchantAck(e.target.checked)} />
                    ข้อมูลนี้เป็นข้อมูลร้านที่ฉันมีสิทธิ์ใช้ และตรวจคอลัมน์/หน่วยตามแบบ MarginSight แล้ว
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
                  อัปโหลดและนำเข้า
                </button>
                <details style={{ marginTop: 14 }}>
                  <summary>รูปแบบคอลัมน์และไฟล์ตัวอย่าง</summary>
                  <p><a href={(realStore ? '/templates/' : '/fixtures/') + kind + '.csv'} download>ดาวน์โหลด{realStore ? 'แบบฟอร์มว่าง' : 'ตัวอย่าง'} {kind}.csv</a></p>
                  <p>ต้นทุนและรายรับเป็นบาททศนิยม 2 หลัก · วันที่ YYYY-MM-DD · ID ต้องคงเดิมเพื่อป้องกันรายการซ้ำ</p>
                </details>
              </section>

              <section>
                <h2>สถานะนำเข้า</h2>
                {!busy && !jobs.some(j => j.kind !== 'receipt') && (
                  <EmptyState icon="upload" title="ยังไม่มีรายงานที่นำเข้า">
                    เลือกประเภทข้อมูลและอัปโหลดไฟล์ด้านบน สถานะและแถวที่ต้องตรวจจะแสดงที่นี่
                  </EmptyState>
                )}
                <label>
                  เหตุผลการตรวจรับ / แก้ข้อขัดแย้ง
                  <input value={reviewReason} onChange={e => setReviewReason(e.target.value)} placeholder="ระบุหลักฐานและเหตุผลอย่างน้อย 10 ตัวอักษร" />
                </label>
                {jobs.filter(j => j.kind !== 'receipt').map(j => (
                  <div className="job" key={j.id}>
                    <strong>{j.fileName}</strong> <Badge value={j.status} />
                    <p>รับ {j.accepted ?? 0} · ซ้ำ {j.duplicate ?? 0} · ผิด {j.rejected ?? 0} · ขัดแย้ง {j.conflict ?? 0}</p>
                    {j.error && <p>{j.error}</p>}
                    <button className="secondary" disabled={busy} onClick={() => void act(async () => {
                      const v = await request(base + '/imports/' + j.id);
                      await download(v.downloadUrl);
                    })}>
                      ดาวน์โหลดต้นฉบับ
                    </button>
                    {['QUEUED', 'PROCESSING'].includes(j.status) && (
                      <button className="secondary" disabled={busy} onClick={() => void act(async () => {
                        await request(base + '/imports/' + j.id + '/retry', {});
                        await refresh();
                      })}>
                        ส่งงานค้างอีกครั้ง
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
                        ตรวจแล้ว รับเฉพาะแถวที่ถูกต้อง
                      </button>
                    )}
                    {j.review && <p>ตรวจรับโดย {j.review.reviewedBy}: {j.review.reason} · แถวที่ผิดยังแยกไว้</p>}
                    {j.errors?.length > 0 && (
                      <details>
                        <summary>ดูแถวที่ต้องแก้</summary>
                        <pre>{JSON.stringify(j.errors, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </section>

              <section>
                <h2>รายการข้อมูลขัดแย้ง</h2>
                {!busy && !conflicts.some(c => !c.resolution) && (
                  <EmptyState icon="check" title="ไม่มีข้อขัดแย้งที่รอตรวจ">
                    หากรายงานใหม่มีข้อมูลต่างจากเดิม ระบบจะแสดงให้เปรียบเทียบก่อนเลือกใช้
                  </EmptyState>
                )}
                {conflicts.filter(c => !c.resolution).map(c => (
                  <div className="job" key={c.id}>
                    <strong>{c.orderId ?? 'ข้อมูลสินค้า / ต้นทุน'} · {c.key}</strong>
                    <details>
                      <summary>เปรียบเทียบต้นฉบับกับรายงานใหม่</summary>
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
                        {choice === 'KEEP_EXISTING' ? 'คงข้อมูลเดิม' : 'ใช้ข้อมูลใหม่และเก็บประวัติเดิม'}
                      </button>
                    ))}
                  </div>
                ))}
              </section>
            </>
          )}

          {/* VIEW 7: กฎและแคมเปญ (Fee Rules & Admin Config) */}
          {view === 7 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(10)}>
                  <Icon name="arrow" /> กลับไปศูนย์จัดการร้าน
                </button>
              </div>

              <PageIntro icon="rules" title="รู้ว่าค่าบริการมาจากไหน">
                เก็บหลักฐาน อัตรา และช่วงเข้าร่วมแคมเปญแยกกัน ไม่เดาค่าบริการที่ยังไม่ทราบ
              </PageIntro>

              <section>
                <h2>กฎค่าบริการและช่วงเข้าร่วมแคมเปญ</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>กฎ</th>
                        <th>อัตรา</th>
                        <th>ขอบเขต</th>
                        <th>แหล่ง / สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.rules?.map((r: any) => (
                        <tr key={r.id + '#' + r.version}>
                          <td>{r.type}<small>{r.programId ?? 'กฎพื้นฐาน'}</small></td>
                          <td>{r.rateBps / 100}%</td>
                          <td>{r.scope}</td>
                          <td>{r.sourceRef}<small>{r.status}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3>หลักฐานเข้าร่วม</h3>
                {!busy && data?.rules?.length === 0 && <p className="notice">ยังไม่มีกฎค่าบริการที่บันทึกไว้ ระบบจะไม่เดาอัตราให้</p>}
                {!busy && data?.enrollments?.length === 0 && <p className="muted">ยังไม่มีหลักฐานเข้าร่วมแคมเปญที่บันทึกไว้</p>}
                {data?.enrollments?.map((e: any) => (
                  <p key={e.id}>{e.programId} · {localDate(e.effectiveFrom)} ถึง {e.effectiveTo ? localDate(e.effectiveTo) : 'ไม่ระบุ'} · {e.sourceRef}</p>
                ))}
              </section>

              <section>
                <h2>เพิ่มกฎหรือหลักฐานเข้าร่วม</h2>
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
                    ตัวอย่างกฎ
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
                    ตัวอย่างการเข้าร่วม
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
                  ข้อมูลเวอร์ชัน (JSON สำหรับผู้ดูแล)
                  <textarea className="json" value={json} onChange={e => setJson(e.target.value)} spellCheck={false} />
                </label>
                <button disabled={!json || busy} onClick={() => void act(async () => {
                  await request(base + '/' + ruleKind, JSON.parse(json));
                  await refresh();
                })}>
                  บันทึกเวอร์ชัน
                </button>
              </section>
            </>
          )}

          {/* VIEW 8: กระทบยอดเงินโอน (Reconciliation & Reports) */}
          {view === 8 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(10)}>
                  <Icon name="arrow" /> กลับไปศูนย์จัดการร้าน
                </button>
              </div>

              <PageIntro icon="reconcile" title="ตรวจยอดเงินโอนจริงให้ตรง">
                เปรียบเทียบค่าบริการประมาณการกับรายการหักจริง ก่อนส่งออกรายงาน
              </PageIntro>

              <section>
                <h2>กระทบยอดค่าบริการ</h2>
                {!busy && data?.items?.length === 0 && (
                  <EmptyState icon="reconcile" title="ยังไม่มีรายการให้กระทบยอด">
                    นำเข้าออเดอร์และรายการเงินหัก หรือเลือกเดือนที่มีข้อมูล
                  </EmptyState>
                )}
                <div className="table-scroll">
                  <table className="mobile-cards">
                    <thead>
                      <tr>
                        <th>ออเดอร์</th>
                        <th>ประมาณการ</th>
                        <th>รายการหักจริง</th>
                        <th>ส่วนต่าง</th>
                        <th>Payout สินค้า</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.items?.map((r: any) => (
                        <tr key={r.key}>
                          <td data-label="ออเดอร์">{r.orderId}</td>
                          <td data-label="ประมาณการ (บาท)">{money(r.estimatedFeeSatang)}</td>
                          <td data-label="รายการหักจริง (บาท)">{money(r.actualFeeSatang)}</td>
                          <td data-label="ส่วนต่าง (บาท)">{money(r.varianceSatang)}</td>
                          <td data-label="Payout สินค้า">{r.payoutReconciled === null ? 'ไม่มีหลักฐาน' : r.payoutReconciled ? 'ตรง' : 'ไม่ตรง'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="chips">
                  {['csv', 'xlsx'].map(format => (
                    <button key={format} className="secondary" onClick={() => void act(async () => {
                      const result = await request(base + '/reports/export?month=' + month + '&format=' + format);
                      await download(result.downloadUrl);
                    })}>
                      ส่งออก {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* VIEW 9: เชื่อม LINE (LINE Integration) */}
          {view === 9 && (
            <>
              <div className="hub-back-nav">
                <button className="hub-back-btn" onClick={() => setView(10)}>
                  <Icon name="arrow" /> กลับไปศูนย์จัดการร้าน
                </button>
              </div>

              <PageIntro icon="line" title="คุยกับร้านผ่าน LINE">
                การผูกบัญชีใช้สิทธิ์ร้านที่ยืนยันแล้ว และรหัสใช้ได้ครั้งเดียว
              </PageIntro>

              <section>
                <div className="connection-heading">
                  <span className="connection-icon"><Icon name="line" /></span>
                  <div>
                    <h2>ผูก LINE กับร้านที่คุณมีสิทธิ์</h2>
                    <span className={data?.line?.configured ? 'badge' : 'badge warn'}>
                      {data?.line?.configured ? 'ตั้งค่าช่องทางแล้ว' : 'ยังไม่พร้อมเชื่อมต่อ'}
                    </span>
                  </div>
                </div>
                <p>สร้างรหัสจากเว็บแล้วส่งให้บอต รหัสใช้ได้ครั้งเดียวและหมดอายุใน 5 นาที</p>
                <button disabled={busy || !data?.line?.configured} onClick={() => void act(async () => setLink(await request(base + '/line/link', {})))}>
                  สร้างรหัสผูก LINE
                </button>
                {link && (
                  <div className="answer">
                    <strong>LINK {link.code}</strong>
                    <p>{link.instruction}</p>
                  </div>
                )}
              </section>
            </>
          )}

          {/* VIEW 10: ศูนย์จัดการร้าน (Management & Settings Hub) */}
          {view === 10 && (
            <>
              <PageIntro icon="settings" title="ศูนย์จัดการร้านและเอกสาร">
                รวมงานนำเข้ารายงาน สแกนบิลซื้อ กระทบยอดเงินโอน และการตั้งค่าร้าน
              </PageIntro>

              <div className="hub-grid">
                <button className="hub-card" onClick={() => setView(1)}>
                  <div className="hub-card-icon">
                    <Icon name="upload" />
                  </div>
                  <div className="hub-card-content">
                    <strong>นำเข้ารายงาน (Import Files)</strong>
                    <p>อัปโหลดไฟล์สินค้า ต้นทุน ออเดอร์ และค่าบริการ (CSV / Excel)</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>

                <button className="hub-card" onClick={() => setView(6)}>
                  <div className="hub-card-icon">
                    <Icon name="receipt" />
                  </div>
                  <div className="hub-card-content">
                    <strong>สแกนบิลซื้อ (Receipt OCR)</strong>
                    <p>ถ่ายรูปบิลซัพพลายเออร์ AI ช่วยอ่านและกรอกต้นทุนอัตโนมัติ</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>

                <button className="hub-card" onClick={() => setView(4)}>
                  <div className="hub-card-icon">
                    <Icon name="simulation" />
                  </div>
                  <div className="hub-card-content">
                    <strong>จำลองราคา & วางแผนส่วนลด</strong>
                    <p>ลองลดราคา คำนวณกำไร และหาจุดคุ้มทุนก่อนจัดโปรโมชัน</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>

                <button className="hub-card" onClick={() => setView(8)}>
                  <div className="hub-card-icon">
                    <Icon name="reconcile" />
                  </div>
                  <div className="hub-card-content">
                    <strong>กระทบยอดเงินโอน (Reconciliation)</strong>
                    <p>ตรวจยอดเงินโอนจริงเทียบกับยอดประมาณการ ส่งออกรายงาน CSV/XLSX</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>

                <button className="hub-card" onClick={() => setView(7)}>
                  <div className="hub-card-icon">
                    <Icon name="rules" />
                  </div>
                  <div className="hub-card-content">
                    <strong>กฎค่าบริการและแคมเปญ</strong>
                    <p>ดูและบันทึกอัตราหักค่าธรรมเนียมของแต่ละแพลตฟอร์ม</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>

                <button className="hub-card" onClick={() => setView(9)}>
                  <div className="hub-card-icon">
                    <Icon name="line" />
                  </div>
                  <div className="hub-card-content">
                    <strong>เชื่อมต่อ LINE แจ้งเตือน</strong>
                    <p>ผูกบอต LINE เพื่อรับสรุปยอดขายและปรึกษาตัวเลขผ่านแชต</p>
                  </div>
                  <Icon name="chevronRight" />
                </button>
              </div>

              <section style={{ marginTop: 24 }}>
                <h2>ข้อมูลร้านค้า</h2>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{storeInfo?.name ?? 'ร้านของคุณ'}</strong>
                    <p className="muted">รหัสร้าน: {store} · สถานะ: {storeInfo?.personal ? 'ร้านส่วนตัว' : 'ร้านสาธิต'}</p>
                  </div>
                  <button className="secondary" onClick={() => setSetup(true)}>
                    <Icon name="plus" />
                    สร้างร้านใหม่
                  </button>
                </div>
              </section>
            </>
          )}

          <footer>
            <span>MarginSight · ทุกผลมีที่มาและแสดงข้อมูลที่ยังขาด<br />ข้อมูลจำลองใช้สาธิต ไม่ใช่อัตราค่าบริการแพลตฟอร์มจริง</span>
            <span className="foot-version">เห็นกำไร เข้าใจร้าน</span>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (pinned at bottom on small screens) */}
      <nav className="bottom-nav" aria-label="เมนูหลักสำหรับมือถือ">
        <button
          className={'bottom-nav-item' + (view === 0 ? ' active' : '')}
          onClick={() => { setView(0); setNavOpen(false); }}
          aria-label="ภาพรวม"
        >
          <Icon name="overview" />
          <span>ภาพรวม</span>
        </button>
        <button
          className={'bottom-nav-item' + (view === 2 ? ' active' : '')}
          onClick={() => { setView(2); setNavOpen(false); }}
          aria-label="สินค้า"
        >
          <Icon name="products" />
          <span>สินค้า</span>
        </button>
        <button
          className={'bottom-nav-item' + (view === 5 ? ' active' : '')}
          onClick={() => { setView(5); setNavOpen(false); }}
          aria-label="ถาม AI"
        >
          <Icon name="assistant" />
          <span>ถาม AI</span>
        </button>
        <button
          className={'bottom-nav-item' + (view === 3 ? ' active' : '')}
          onClick={() => { setView(3); setNavOpen(false); }}
          aria-label="ออเดอร์"
        >
          <Icon name="orders" />
          <span>ออเดอร์</span>
        </button>
        <button
          className={'bottom-nav-item' + ([1, 4, 6, 7, 8, 9, 10].includes(view) ? ' active' : '')}
          onClick={() => { setView(10); setNavOpen(false); }}
          aria-label="จัดการร้าน"
        >
          <Icon name="settings" />
          <span>จัดการร้าน</span>
        </button>
      </nav>
    </div>
  );
}
