'use client';
import { useEffect, useRef, useState } from 'react';
import { demo, fullDemo, fullDemoMode, localMode, login, request, session } from '../lib/auth';
import { bangkokDate } from '../lib/format';
import { useAction } from '../lib/use-resource';
import type { CatalogProduct, FeatureProps, PageResult, Store } from '../lib/types';
import { LanguageSwitch, useLanguage } from './language';
import { Brand, Icon } from './ui';
import { AppShell, useNavigation } from './components/shell';
import { ErrorNotice, Loading } from './components/forms';
import Onboarding from './onboarding';
import Preview from './preview';
import Overview from './screens/overview';
import Products, { Simulation } from './screens/products';
import AddProductPage from './screens/add-product';
import { Orders, Settlement } from './screens/orders';
import Assistant from './screens/assistant';
import Imports from './screens/imports';
import Receipts from './screens/receipts';
import Rules from './screens/rules';
import StoreHub, { LineConnection } from './screens/store';

function StoreWorkspace({ stores, store, changeStore, create }: { stores: Store[]; store: Store; changeStore: (id: string) => void; create: () => void }) {
  const { screen, navigate } = useNavigation();
  const { t } = useLanguage();
  const [month, setMonth] = useState(bangkokDate().slice(0, 7));
  const [products, setProducts] = useState<CatalogProduct[]>([]), [more, setMore] = useState<string>();
  const [loading, setLoading] = useState(true), [catalogError, setCatalogError] = useState<unknown>();
  const [selectedSku, setSelectedSku] = useState(''), [draftRequest, setDraftRequest] = useState(0);
  const version = useRef(0);
  const base = '/stores/' + encodeURIComponent(store.id);
  const guest = fullDemoMode();
  const props: FeatureProps = { base, month, guest, realStore: !!store.personal, origin: store.personal ? 'REAL' : store.dataOrigin ?? 'MOCK' };
  const refresh = async (targetSku?: string) => {
    const id = ++version.current; setLoading(true); setCatalogError(undefined);
    try {
      let result = await request<PageResult<CatalogProduct>>(base + '/products');
      const items = [...result.items];
      while (result.next && id === version.current && (items.length < products.length || (targetSku && !items.some(item => item.sku === targetSku)))) {
        result = await request<PageResult<CatalogProduct>>(base + '/products?cursor=' + encodeURIComponent(result.next));
        items.push(...result.items);
      }
      if (id === version.current) { setProducts(items); setMore(result.next); }
    }
    catch (e) { if (id === version.current) setCatalogError(e); }
    finally { if (id === version.current) setLoading(false); }
  };
  useEffect(() => { void refresh(); return () => { version.current++; }; }, [base, screen]);
  const loadMore = async () => {
    if (!more || loading) return;
    const id = ++version.current; setLoading(true); setCatalogError(undefined);
    try { const result = await request<PageResult<CatalogProduct>>(base + '/products?cursor=' + encodeURIComponent(more)); if (id === version.current) { setProducts(old => [...old, ...result.items.filter(p => !old.some(previous => previous.sku === p.sku))]); setMore(result.next); } }
    catch (e) { if (id === version.current) setCatalogError(e); }
    finally { if (id === version.current) setLoading(false); }
  };
  const ask = (sku: string) => { setSelectedSku(sku); setDraftRequest(n => n + 1); navigate('assistant'); };
  const simulate = (sku: string) => { setSelectedSku(sku); navigate('simulation'); };
  const key = store.id + '|' + month;
  return <AppShell screen={screen} navigate={navigate} stores={stores} store={store} changeStore={changeStore} month={month} changeMonth={setMonth} guest={guest}>
    {['products','addProduct','simulation','assistant','receipts'].includes(screen) && <><ErrorNotice error={catalogError} />{catalogError && <button className="secondary" onClick={() => void refresh()}>{t('retry')}</button>}{loading && <Loading />}{more && screen !== 'products' && screen !== 'addProduct' && <button className="secondary" disabled={loading} onClick={() => void loadMore()}>{t('next')} · {t('products')}</button>}</>}
    <div key={key} className={'screen-content screen-' + screen}>
      {screen === 'overview' && <Overview {...props} navigate={navigate} sampleMonth={() => setMonth('2026-10')} />}
      {screen === 'products' && <Products {...props} products={products} more={more} loadMore={() => void loadMore()} refresh={refresh} ask={ask} simulate={simulate} onAddProduct={() => navigate('addProduct')} />}
      {screen === 'addProduct' && <AddProductPage {...props} onCancel={() => navigate('products')} onSaved={newProd => { setProducts(old => [newProd, ...old.filter(p => p.sku !== newProd.sku)]); navigate('products'); }} />}
      {screen === 'simulation' && <Simulation {...props} products={products} initialSku={selectedSku} />}
      {screen === 'orders' && <Orders {...props} />}
      {screen === 'reconciliation' && <Settlement {...props} />}
      {screen === 'imports' && <Imports {...props} />}
      {screen === 'receipts' && <Receipts {...props} products={products} refreshProducts={refresh} />}
      {screen === 'rules' && <Rules {...props} />}
      {screen === 'line' && <LineConnection {...props} />}
      {screen === 'store' && <StoreHub navigate={navigate} canCreate={!guest && !stores.some(item => item.personal)} create={create} />}
    </div>
    <div hidden={screen !== 'assistant'}><Assistant {...props} products={products} initialSku={selectedSku} draftRequest={draftRequest} /></div>
  </AppShell>;
}

export default function Page() {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false), [configReady, setConfigReady] = useState(false), [preview, setPreview] = useState(false), [setup, setSetup] = useState(false), [expired, setExpired] = useState(false);
  const [stores, setStores] = useState<Store[]>([]), [storeId, setStoreId] = useState('');
  const action = useAction();
  const initialize = async () => { const data = await request<PageResult<Store>>('/me/stores'); setStores(data.items); setStoreId((data.items.find(item => item.personal) ?? data.items[0])?.id ?? ''); setExpired(false); setReady(true); };
  useEffect(() => {
    const onExpired = () => { setReady(false); setStores([]); setStoreId(''); setExpired(true); };
    window.addEventListener('auth-expired', onExpired);
    void action.run(async () => { const token = await session(); setConfigReady(true); if (token) await initialize(); });
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);
  if (preview) return <Preview back={() => setPreview(false)} />;
  if (!ready) return <main className="landing"><div className="public-topbar"><Brand /><LanguageSwitch /></div><div className="landing-content"><div className="landing-story"><span className="eyebrow">MARGINSIGHT / {t('tagline')}</span><h1>{t('welcome')}</h1><p className="lead">{t('welcomeBody')}</p><div className="landing-ledger" aria-hidden="true"><span>{t('revenue')}</span><span>− {t('costs')}</span><span>− {t('fees')}</span><strong>= {t('profit')}</strong></div><p className="caption">{t('scope')}</p></div><section className="entry-panel"><span className="entry-number">01 / MARGINSIGHT</span><h2>{t('trustNote')}</h2><button disabled={action.busy || !configReady} onClick={() => void action.run(async () => { await fullDemo(); await initialize(); })}>{action.busy ? t('working') : t('demo')}<Icon name="arrow" /></button><p className="caption">{t('demoNote')}</p><button className="secondary" onClick={() => setPreview(true)}>{t('preview')}</button><div className="entry-divider" /><button className="secondary" disabled={action.busy || !configReady} onClick={() => void action.run(() => login())}>{t('login')}</button><button className="ghost" disabled={action.busy || !configReady} onClick={() => void action.run(() => login(true))}>{t('signup')}</button>{configReady && localMode() && <button className="ghost" disabled={action.busy} onClick={() => void action.run(async () => { await demo(); await initialize(); })}>{t('localDemo')}</button>}{expired && <p className="notice">{t('expired')}</p>}<ErrorNotice error={action.error} />{!configReady && !action.busy && <button className="secondary" onClick={() => void action.run(async () => { await session(); setConfigReady(true); })}>{t('retry')}</button>}</section></div><footer className="public-footer">MarginSight · {t('outcomeNote')}</footer></main>;
  const store = stores.find(item => item.id === storeId);
  if (!store || setup) return <Onboarding busy={action.busy} error={action.error} back={stores.length ? () => setSetup(false) : undefined} create={name => action.run(async () => { const created = await request<Store>('/me/store', { name }); const data = await request<PageResult<Store>>('/me/stores'); setStores(data.items); setStoreId(created.id); setSetup(false); location.hash = 'overview'; })} />;
  return <StoreWorkspace key={store.id} stores={stores} store={store} changeStore={setStoreId} create={() => setSetup(true)} />;
}
