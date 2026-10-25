import {catalogSummary} from './assistant-summary.ts';
import { ApiError, request } from './auth.ts';
import { monthContext } from './assistant-context.ts';
import { orderDateTime, ordersInPeriod, periodMonths, summarizeOrders, type OverviewOrder } from './overview-data.ts';
import {isCatalogDiscountQuestion} from './assistant-routing.ts';
import {marketplaceRequest,type MarketplaceOptions} from './marketplace-context.ts';
import type { ChatContext, ChatReply } from './assistant-sessions';
import type { AssistantAnswer, Calculation, CatalogProduct, Dashboard } from './types';

// This adapter reads API-owned results. No fee, discount, or profit formulas live here.
export async function answerQuestion({ base, question, context, products, locale, signal, history=[] }: {
  base: string; question: string; context: ChatContext; products: CatalogProduct[]; locale: 'th' | 'en'; signal: AbortSignal; history?:{role:'user'|'assistant';text:string}[];
},api:typeof request=request): Promise<ChatReply> {
  const th = locale === 'th';
  const notice = (text: string): ChatReply => ({ text, context, source: 'notice' });
  // The server decides whether a request needs recorded data before any model generation.
  const chat=await api<{kind:'GENERAL'|'STORE_DATA';answer?:string;provider?:string}>(base+'/assistant',{mode:'chat',message:question.slice(0,1500),locale,history:history.slice(-8).map(row=>({...row,text:row.text.slice(0,1500)}))},signal);
  if(chat.kind==='GENERAL')return {text:chat.answer??(th?'ลองส่งคำถามอีกครั้งครับ':'Please try again.'),context,source:chat.provider==='bedrock-chat'?'assistant':'notice',conversation:'general'};
  if(chat.kind!=='STORE_DATA')throw Error('INVALID_CHAT_ROUTING_RESPONSE');
  const campaignQuestion=context.marketplace&&context.marketplace.platform!=='recorded'&&/แคมเปญ|โปรแกรม|campaign/i.test(question)&&!/เดือนนี้|สัปดาห์นี้|this month|this week/i.test(question);
  if(isCatalogDiscountQuestion(question)||campaignQuestion){
    if(!context.sku)return notice(th?'ต้องการลองลดราคาสินค้าไหนครับ? เลือกสินค้าก่อน ผมจะใช้ราคากับต้นทุนสินค้าปัจจุบัน ไม่ต้องมีออเดอร์ขาย':'Which product would you like to discount? Select a product. I will use its current catalog price and cost; a sales order is not required.');
    const options=context.marketplace&&context.marketplace.platform!=='recorded'?await api<MarketplaceOptions>(base+'/assistant-options',undefined,signal):undefined;
    const selection=context.marketplace?marketplaceRequest(context.marketplace,options):undefined;
    const answer=await api<AssistantAnswer & {catalogScenario:{basis:'CATALOG';at:string}}>(base+'/assistant/catalog-discount',{message:question.slice(0,1500),sku:context.sku,locale,...(selection?{scenario:selection}:{})},signal);
    return {text:answer.answer,context,source:'fallback',catalogReferenceAt:answer.catalogScenario.at,catalogSummary:catalogSummary(answer.catalogScenario),note:th?'ต่อ 1 หน่วย · หักเฉพาะรายการที่แสดง ยังไม่ใช่กำไรสุทธิ':'Per unit · Listed deductions only; not net profit or recorded sales.'};
  }
  const scenario = /คุ้มทุน|ขั้นต่ำ|break.even|โปรแกรม|แคมเปญ|campaign/i.test(question);
  if (scenario) {
    if (!context.sku) return notice(th ? 'อยากลองกับสินค้าตัวไหนครับ? พิมพ์ชื่อหรือ SKU ต่อได้เลย หรือแตะ “ทุกสินค้า” ใต้ช่องพิมพ์เพื่อเลือก ผมจะใช้ต้นทุนและค่าบริการที่บันทึกไว้คำนวณให้' : 'Which product would you like to try? Reply with its full name or SKU, or tap “All products” below the input. I’ll use its recorded costs and fees.');
    if (context.start.slice(0, 7) !== context.end.slice(0, 7)) return notice(th ? 'การจำลองราคาตอนนี้ใช้ข้อมูลได้ครั้งละหนึ่งเดือนครับ แตะช่วงวันที่ใต้ช่องพิมพ์เพื่อเลือกเดือน แล้วส่งคำถามอีกครั้งได้เลย' : 'Price scenarios currently use one month at a time. Choose a month below the input and ask again.');
    let answer: AssistantAnswer & { comparison?: { withoutProgram?: Calculation; withProgram?: Calculation } };
    try { answer = await api(base + '/assistant', { message: question.slice(0, 1500), sku: context.sku, month: context.start.slice(0, 7) }, signal); }
    catch (error) {
      if (error instanceof ApiError && ['SKU_HAS_NO_ORDER','SIMULATION_REQUIRES_SINGLE_SKU_ORDER'].includes(error.code)) return notice(th ? 'ยังไม่มีออเดอร์สินค้าเดียวที่ใช้จำลองได้ในเดือนนี้ครับ ลองเปลี่ยนสินค้า หรือดูออเดอร์และเติมข้อมูลก่อน' : 'There is no usable single-product order for this scenario in the selected month. Try another product or review its orders.');
      throw error;
    }
    const effective = { ...monthContext(context.start.slice(0, 7)), sku: context.sku };
    return { text: answer.answer, context: effective, source: answer.provider === 'deterministic-fallback' ? 'fallback' : 'assistant',
      note: th ? 'จำลองจากออเดอร์ล่าสุดของสินค้านี้ในเดือนที่ระบุ ไม่ใช่กำไรรวมทั้งช่วงวันที่' : 'Scenario for the latest order of this product in the stated month; not total profit over the date range.',
      calculation: answer.result,
      ...(answer.result ? { result: { label: th ? 'ผลคำนวณจากออเดอร์' : 'Order calculation', profitSatang: answer.result.profitSatang, revenueSatang: answer.result.revenueSatang, marginPct: answer.result.marginPct,
        ...(answer.comparison?.withoutProgram && answer.comparison.withProgram ? { beforeSatang: answer.comparison.withoutProgram.profitSatang, afterSatang: answer.comparison.withProgram.profitSatang } : {}) } } : {}) };
  }

  if(!/กำไร|ยอด|ขาย|profit|sales|revenue|earn/i.test(question))return notice(th?'อยากดูข้อมูลร้านส่วนไหนครับ? เช่น “กำไรเดือนนี้เท่าไร” หรือ “ลดราคา 20%” ผมจะใช้ข้อมูลที่บันทึกไว้คำนวณให้':'Which shop figure would you like to check? For example, monthly profit or a 20% discount.');
  const period = { type: 'custom' as const, start: context.start, end: context.end };
  const months = periodMonths(period, context.end);
  if (!months.length || months.length > 12) return notice(th ? 'เลือกช่วงวันที่ไม่เกิน 12 เดือน แล้วถามใหม่ได้เลยครับ' : 'Please choose a range of up to 12 months and ask again.');
  const snapshots: Dashboard[] = [];
  for (let i = 0; i < months.length; i += 3) {
    signal.throwIfAborted();
    snapshots.push(...await Promise.all(months.slice(i, i + 3).map(month => api<Dashboard>(`${base}/dashboard?month=${month}`, undefined, signal))));
  }
  const results = snapshots.flatMap(s => s.results);
  const partial = snapshots.some(s => s.totalOrders > s.results.length);
  const periodResults = results.filter(r => {
    const date = orderDateTime(r.orderAt);
    return date !== '—' && date.slice(0, 10) >= context.start && date.slice(0, 10) <= context.end;
  });
  const selected = periodResults.filter(r => !context.sku || r.items?.some(item => item.sku === context.sku));
  const mixed = !!context.sku && selected.some(r => r.items.some(i => i.sku !== context.sku));
  if (mixed) return notice(th ? 'มีออเดอร์ที่รวมสินค้าหลายตัวครับ ข้อมูลที่ส่งมายังแยกกำไรของสินค้านี้ไม่ได้ จึงไม่ใช้กำไรทั้งออเดอร์แทนกำไรสินค้า ลองถามยอดรวมทุกสินค้าได้ครับ' : 'Some orders contain several products. The available results do not split their profit by product. Ask about all products to see recorded order totals.');
  const asOrders = (values: Calculation[]): OverviewOrder[] => values.map(r => ({
    orderId: r.orderId, platform: r.platform, orderAt: r.orderAt, revenueSatang: r.revenueSatang,
    profitSatang: r.profitSatang, productCostSatang: r.cogsSatang,
    platformFeeSatang: r.missingFields?.some(f => f === 'base_fee_rules' || f.startsWith('rule:') || f.startsWith('cash_deduction')) ? null : r.feeSatang,
    shippingSatang: r.sellerShippingSatang, otherCostSatang: r.packagingSatang + r.adsSatang,
    productName: r.items?.map(i => i.sku).join(', ') ?? '', skus: r.items?.map(i => i.sku) ?? [], status: r.status, missingFields: r.missingFields
  }));
  const orders = ordersInPeriod(asOrders(selected), period, context.end);
  if (!orders.length) return notice(partial
    ? (th ? 'ยังไม่พบออเดอร์ที่ตรงกับคำถามในรายละเอียดที่โหลดมาครับ API ส่งรายละเอียดได้สูงสุด 50 ออเดอร์ต่อเดือน จึงยังสรุปไม่ได้ว่าทั้งช่วงไม่มียอดขาย' : 'No matching orders were found in the loaded details. The API returns up to 50 order details per month, so this does not mean the whole period had no sales.')
    : (th ? 'ยังไม่พบออเดอร์ในช่วงนี้ครับ กำไรเดือนนี้ต้องอิงยอดขายที่เกิดขึ้นจริง การเพิ่มสินค้าอย่างเดียวยังไม่ใช่ออเดอร์ ลองเปลี่ยนช่วงวันที่หรือนำเข้ารายงานขายก่อนได้ครับ ถ้าจะลองส่วนลด ถาม “ลดราคา 20%” ได้จากราคากับต้นทุนสินค้า โดยไม่ต้องมีออเดอร์' : 'No recorded orders were found for this period. Monthly profit needs actual sales; adding a product does not create an order. Change the period or import sales. For price planning, ask “discount 20%” using the catalog without an order.'));
  const scope = [th ? 'รวมเฉพาะต้นทุนและค่าใช้จ่ายที่บันทึกไว้' : 'Includes recorded costs and expenses only',
    ...(context.marketplace&&context.marketplace.platform!=='recorded'?[th?'แคมเปญที่เลือกใช้เฉพาะลองราคา ไม่ปรับกำไรจากออเดอร์จริง':'Campaign selection applies only to price planning, not recorded order profit']:[]),
    ...(partial ? [th ? 'API ส่งรายละเอียดได้สูงสุด 50 ออเดอร์ต่อเดือน ผลนี้ครอบคลุมเฉพาะออเดอร์ที่โหลดมา' : 'The API returns up to 50 order details per month. This result covers loaded orders only.'] : []),
    results.some(r => !r.orderAt) ? (th ? 'มีรายการที่ไม่มีวันที่ จึงยังนำมารวมในช่วงนี้ไม่ได้' : 'Records without dates could not be included.') : ''
  ].filter(Boolean).join(' · ');
  if (/สินค้าไหน|สินค้าตัวไหน|which product|most profit|least profit|best.?selling|กำไรดี|กำไรน้อย/i.test(question)) {
    const single = periodResults.filter(r => r.items?.length && new Set(r.items.map(i => i.sku)).size === 1);
    const groups = [...new Set(single.map(r => r.items[0].sku))].map(sku => ({ sku, stats: summarizeOrders(asOrders(single.filter(r => r.items[0].sku === sku))) }));
    const known = groups.filter(g => g.stats.profitSatang !== null);
    const low = /น้อย|ต่ำ|least|lowest/i.test(question);
    known.sort((a, b) => low ? a.stats.profitSatang! - b.stats.profitSatang! : b.stats.profitSatang! - a.stats.profitSatang!);
    if (!known.length) return notice(th ? 'ยังจัดอันดับกำไรสินค้าไม่ได้ครับ ต้องมีออเดอร์สินค้าเดียวที่มีต้นทุนและค่าบริการครบก่อน ออเดอร์รวมหลายสินค้ายังแยกกำไรต่อสินค้าไม่ได้' : 'There is not enough complete single-product order data to rank products yet. Mixed-product orders do not provide a product profit split.');
    const top = known[0], product = products.find(p => p.sku === top.sku);
    return { context, source: 'recorded', text: th ? `${product?.name ?? top.sku} มีกำไร${low ? 'น้อย' : 'มาก'}ที่สุดในกลุ่มที่ตรวจได้ครับ อันดับนี้รวมเฉพาะออเดอร์สินค้าเดียวที่มีข้อมูลครบ` : `${product?.name ?? top.sku} has the ${low ? 'lowest' : 'highest'} profit among the products we can check. Ranking uses complete single-product orders.`,
      note: scope + (periodResults.length !== single.length || known.length !== groups.length ? (th ? ' · ยังไม่รวมออเดอร์หลายสินค้าและกลุ่มที่ข้อมูลไม่ครบ' : ' · Mixed orders and incomplete groups are excluded') : ''),
      result: { label: product?.name ?? top.sku, profitSatang: top.stats.profitSatang, revenueSatang: top.stats.revenueSatang, marginPct: top.stats.marginPct, count: top.stats.totalOrders } };
  }
  const stats = summarizeOrders(orders);
  return { context, source: 'recorded', text: stats.profitSatang === null
    ? (th ? 'ยังสรุปกำไรครบทั้งช่วงไม่ได้ครับ บางออเดอร์ขาดต้นทุนหรือข้อมูลค่าบริการ ดูยอดขายที่บันทึกได้ด้านล่าง แล้วเติมข้อมูลให้ครบก่อนตัดสินใจ' : 'Profit is not complete for this period. Some orders are missing costs or fee information. Recorded sales are below; fill in the missing data before deciding.')
    : (th ? 'นี่คือกำไรจากออเดอร์ที่บันทึกไว้ในช่วงที่ถามครับ หักต้นทุนและค่าใช้จ่ายตามข้อมูลที่มีแล้ว ดูช่วงวันที่และขอบเขตประกอบตัวเลขได้ด้านล่าง' : 'Here is the recorded order profit for your selected period, after recorded costs and expenses. The dates and coverage are shown below.'),
    note: scope, result: { label: th ? 'กำไรจากข้อมูลที่บันทึก' : 'Recorded profit', profitSatang: stats.profitSatang, revenueSatang: stats.revenueSatang, marginPct: stats.marginPct, count: stats.totalOrders } };
}
