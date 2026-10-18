import type {Dashboard} from './types';

export type DashboardCoverage={loaded:number;total:number;partial:boolean};
/** Monthly totals describe full months; detail responses may contain only 50 orders. */
export function dashboardCoverage(snapshots:Pick<Dashboard,'results'|'totalOrders'>[]):DashboardCoverage {
 const loaded=snapshots.reduce((sum,snapshot)=>sum+snapshot.results.length,0);
 const total=snapshots.reduce((sum,snapshot)=>sum+snapshot.totalOrders,0);
 return {loaded,total,partial:snapshots.some(snapshot=>snapshot.totalOrders>snapshot.results.length)};
}
