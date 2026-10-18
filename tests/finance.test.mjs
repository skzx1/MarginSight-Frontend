import test from 'node:test';
import assert from 'node:assert/strict';
import { financeTotals, financeDays, selectFinance, previousPeriod, readExpenses, financeCsv } from '../web/src/lib/finance-data.ts';
import { OVERVIEW_MOCK_ORDERS } from '../web/src/lib/overview-data.ts';
const orders = OVERVIEW_MOCK_ORDERS.map(o => ({ ...o, grossSatang:o.revenueSatang + 100, reductionsSatang:100, adsSatang:0, packagingSatang:o.otherCostSatang, commerceStatus:'COMPLETED', productProfits:[] }));
const expenses = [{ id:'1', category:'ads', channel:'Shopee', amountSatang:12345, date:'2026-10-17', note:'Campaign' }];
const period = { type:'month', start:'', end:'' };
test('finance ledger reconciles P&L, channels and daily totals after local expenses', () => {
  const all=financeTotals(orders,expenses);
  assert.equal(all.grossSatang-all.reductionsSatang,all.revenueSatang);
  assert.equal(all.revenueSatang-Object.values(all.categories).reduce((s,v)=>s+v,0),all.profitSatang);
  for(const group of [financeDays(orders,expenses),[...new Set(orders.map(o=>o.platform))].map(channel=>{const selected=selectFinance(orders,expenses,period,'2026-10-17',channel);return financeTotals(selected.orders,selected.expenses);})]) {
    for(const key of ['revenueSatang','profitSatang','totalCostsSatang','totalOrders'])assert.equal(group.reduce((s,d)=>s+d[key],0),all[key],key);
  }
});
test('period and channel select the same order and expense scope including boundaries',()=>{
  const result=selectFinance(orders,expenses,{type:'today',start:'',end:''},'2026-10-17','Shopee');
  assert.equal(result.expenses.length,1);assert.equal(result.orders.length,1);
  assert.equal(selectFinance(orders,expenses,period,'2026-10-17','LINE Shop').expenses.length,0);
  assert.deepEqual(previousPeriod({type:'custom',start:'2026-03-01',end:'2026-03-03'},'2026-10-17'),{type:'custom',start:'2026-02-26',end:'2026-02-28'});
});
test('missing costs remain unknown instead of fabricated profit; confirmed zero remains valid',()=>{
  const result=financeTotals([{...orders[0],productCostSatang:null,profitSatang:null,missingFields:['cost:TSHIRT-01']}],expenses);
  assert.equal(result.profitSatang,null);assert.equal(result.categories.product,null);assert.equal(result.missingCostOrders,1);
  assert.equal(financeTotals([],[]).profitSatang,0);
});
test('saved expenses reject malformed data, unknown channels, invalid dates and unsafe amounts',()=>{
  assert.deepEqual(readExpenses(JSON.stringify(expenses)),expenses);
  for(const patch of [{amountSatang:-1},{amountSatang:1.1},{date:'2026-02-30'},{channel:'unknown'},{category:'unknown'}])assert.throws(()=>readExpenses(JSON.stringify([{...expenses[0],...patch}])));
  assert.throws(()=>readExpenses('{broken'));assert.deepEqual(readExpenses(null),[]);
});
test('CSV preserves Thai, quotes and line breaks and neutralizes spreadsheet formulas',()=>{
  const csv=financeCsv([['ชื่อ','a"b','line\nbreak','=SUM(A1)','+cmd','@cmd',null],['บาท',125.5]]);
  assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"a""b"'));assert.ok(csv.includes('"\'=SUM(A1)"'));assert.ok(csv.includes('"125.5"'));
});
