import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardCoverage} from '../web/src/lib/dashboard-coverage.ts';

test('monthly detail truncation is detected even when other months are complete',()=>{
 assert.deepEqual(dashboardCoverage([{totalOrders:51,results:Array(50)},{totalOrders:2,results:Array(2)}]),{loaded:52,total:53,partial:true});
});
test('empty and fully loaded ranges do not invent missing orders',()=>{
 assert.deepEqual(dashboardCoverage([]),{loaded:0,total:0,partial:false});
 assert.deepEqual(dashboardCoverage([{totalOrders:0,results:[]},{totalOrders:2,results:Array(2)}]),{loaded:2,total:2,partial:false});
});
