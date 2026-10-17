'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from './auth';
export function useResource<T>(path: string | null, poll = false) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: unknown; loading: boolean }>({ path, loading: !!path });
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    if (!path) return;
    const id = ++sequence.current;
    setState(old => ({ ...old, path, loading: !old.data, error: undefined }));
    try { const data = await request<T>(path); if (id === sequence.current) setState({ path, data, loading: false }); }
    catch (error) { if (id === sequence.current) setState(old => ({ ...old, path, loading: false, error })); }
  }, [path]);
  useEffect(() => { setState({ path, loading: !!path }); void reload(); return () => { sequence.current++; }; }, [path, reload]);
  useEffect(() => { if (!poll) return; const timer = setInterval(() => void reload(), 2500); return () => clearInterval(timer); }, [poll, reload]);
  return { ...(state.path === path ? state : { data: undefined, error: undefined, loading: !!path }), reload };
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(undefined);
    try { await action(); } catch (e) { if (active.current) setError(e); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return { busy, error, run, clearError: () => setError(undefined) };
}
