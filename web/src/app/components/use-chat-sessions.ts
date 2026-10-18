'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { chatStorageKey, createChat, localChatStorage, type ChatArchive, type ChatContext, type ChatSession, type ChatStorage } from '../../lib/assistant-sessions';

export function useChatSessions(base: string, defaults: ChatContext) {
  const [archive, setArchive] = useState<ChatArchive>({ version: 1, activeId: null, sessions: [] });
  const [ready, setReady] = useState(false), [storageError, setStorageError] = useState(false);
  const store = useRef<ChatStorage | null>(null), initial = useRef(defaults);
  const latest = useRef(archive); latest.current = archive;
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const storage = localChatStorage(await chatStorageKey(base));
        const loaded = storage.load();
        if (!active) return;
        store.current = storage;
        if (!loaded.sessions.length) { const first = createChat(initial.current); loaded.sessions.push(first); loaded.activeId = first.id; }
        setArchive(loaded);
      } catch {
        if (!active) return;
        const first = createChat(initial.current);
        setArchive({ version: 1, activeId: first.id, sessions: [first] }); setStorageError(true);
      } finally { if (active) setReady(true); }
    })();
    return () => { active = false; store.current = null; };
  }, [base]);
  useEffect(() => {
    if (!ready || !store.current) return;
    try { store.current.save(archive); setStorageError(false); } catch { setStorageError(true); }
  }, [archive, ready]);
  const updateSession = useCallback((id: string, update: (session: ChatSession) => ChatSession) => setArchive(old => ({ ...old, sessions: old.sessions.map(s => s.id === id ? update(s) : s) })), []);
  const retrySave = () => { try { if (!store.current) return; store.current.save(latest.current); setStorageError(false); } catch { setStorageError(true); } };
  return { archive, setArchive, updateSession, ready, storageError, retrySave, canRetrySave: !!store.current,
    active: archive.sessions.find(s => s.id === archive.activeId) };
}
