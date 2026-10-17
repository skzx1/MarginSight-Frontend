'use client';
import { useEffect, useRef, useState } from 'react';
import { request } from './auth';
import { periodMonths, type OverviewPeriod } from './overview-data';
import type { Dashboard } from './types';

// The API owns calculations and exposes monthly snapshots. Read every month
// touched by the page's date range; never borrow the month from another screen.
export function useOverviewDashboard(base: string, period: OverviewPeriod, today: string, origin: 'MOCK' | 'REAL') {
  const months = periodMonths(period, today).join(',');
  const key = `${base}|${months}|${today}|${origin}`;
  const cache = useRef(new Map<string, Promise<Dashboard>>());
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data?: Dashboard; error?: unknown; loading: boolean }>({ key, loading: true });
  useEffect(() => {
    let active = true;
    setState({ key, loading: true });
    const read = (month: string) => {
      const path = `${base}/dashboard?month=${month}`;
      let pending = cache.current.get(path);
      if (!pending) {
        pending = request<Dashboard>(path).catch(error => { cache.current.delete(path); throw error; });
        cache.current.set(path, pending);
      }
      return pending;
    };
    void (async () => {
      try {
        const anchor = await read(today.slice(0, 7));
        if (!active) return;
        const selected = months ? months.split(',') : [];
        const results: Dashboard['results'] = [];
        // Bound concurrency and stop scheduling more work after the range changes.
        for (let index = 0; index < selected.length; index += 3) {
          if (!active) return;
          const batch = await Promise.all(selected.slice(index, index + 3).map(read));
          for (const snapshot of batch) results.push(...snapshot.results);
        }
        if (active) setState({ key, data: { ...anchor, results }, loading: false });
      } catch (error) { if (active) setState({ key, error, loading: false }); }
    })();
    return () => { active = false; };
  }, [key, base, months, today, origin, attempt]);
  const reload = () => { cache.current.clear(); setAttempt(value => value + 1); };
  return { ...(state.key === key ? state : { loading: true, data: undefined, error: undefined }), reload };
}
