import {catalogSummary,type CatalogSummary} from './assistant-summary.ts';
import type { Calculation } from './types';
import {validMarketplaceDraft,type MarketplaceDraft} from './marketplace-context.ts';

export type ChatContext = { start: string; end: string; sku: string | null; marketplace?:MarketplaceDraft };
export type ChatResult = {
  label: string; profitSatang: number | null; revenueSatang?: number; marginPct?: number | null;
  beforeSatang?: number | null; afterSatang?: number | null; count?: number;
};
export type ChatReply = {
  text: string; source: 'recorded' | 'assistant' | 'fallback' | 'notice';
  context: ChatContext; note?: string; result?: ChatResult; calculation?: Calculation; catalogReferenceAt?: string; catalogSummary?:CatalogSummary;
};
export type ChatTurn = {
  id: string; question: string; requestQuestion?: string; createdAt: string; context: ChatContext;
  reply?: ChatReply; state: 'pending' | 'complete' | 'failed' | 'stopped';
};
export type ChatSession = {
  id: string; title: string; renamed?: boolean; createdAt: string; updatedAt: string;
  context: ChatContext; turns: ChatTurn[]; draft: string;
};
export type ChatArchive = { version: 1; activeId: string | null; sessions: ChatSession[] };
export interface ChatStorage { load(): ChatArchive; save(archive: ChatArchive): void; delete(id: string): ChatArchive }
const empty = (): ChatArchive => ({ version: 1, activeId: null, sessions: [] });
const validDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
export function validContext(v: unknown): v is ChatContext {
  if (!v || typeof v !== 'object') return false;
  const c = v as ChatContext;
  return validDate(c.start) && validDate(c.end) && c.start <= c.end && (c.sku === null || typeof c.sku === 'string' && c.sku.length <= 100)&& (c.marketplace===undefined||validMarketplaceDraft(c.marketplace));
}
export function sessionTitle(question: string) {
  const chars = Array.from(question.trim().replace(/\s+/g, ' '));
  return chars.slice(0, 48).join('') + (chars.length > 48 ? '…' : '');
}
export function createChat(context: ChatContext, now = new Date().toISOString()): ChatSession {
  return { id: crypto.randomUUID(), title: '', createdAt: now, updatedAt: now, context: { ...context }, turns: [], draft: '' };
}
export function historyGroup(timestamp: string, today: string): 'today' | 'yesterday' | 'week' | 'older' {
  const day = new Date(Date.parse(timestamp) + 7 * 3600000).toISOString().slice(0, 10);
  const age = Math.floor((Date.parse(today) - Date.parse(day)) / 86400000);
  return age <= 0 ? 'today' : age === 1 ? 'yesterday' : age <= 7 ? 'week' : 'older';
}
// Validate stored JSON before it can become UI state; never store credentials.
export function parseArchive(raw: string | null): ChatArchive {
  if (!raw) return empty();
  const value = JSON.parse(raw) as ChatArchive;
  if (value.version !== 1 || !Array.isArray(value.sessions)) throw Error('INVALID_CHAT_ARCHIVE');
  const sessions = value.sessions.map(session => {
    if (typeof session.id !== 'string' || typeof session.title !== 'string' || session.title.length > 120 || !validContext(session.context) ||
      !Number.isFinite(Date.parse(session.createdAt)) || !Number.isFinite(Date.parse(session.updatedAt)) || !Array.isArray(session.turns) ||
      typeof session.draft !== 'string' || session.draft.length > 1500) throw Error('INVALID_CHAT_SESSION');
    const turns = session.turns.map(turn => {
      if (typeof turn.id !== 'string' || typeof turn.question !== 'string' || turn.question.length > 1500 || (turn.requestQuestion !== undefined && (typeof turn.requestQuestion !== 'string' || turn.requestQuestion.length > 3200)) || !validContext(turn.context) ||
        !Number.isFinite(Date.parse(turn.createdAt)) || !['pending', 'complete', 'failed', 'stopped'].includes(turn.state) ||
        (turn.reply && (typeof turn.reply.text !== 'string' || !validContext(turn.reply.context) || !['recorded','assistant','fallback','notice'].includes(turn.reply.source)))) throw Error('INVALID_CHAT_TURN');
      if (turn.reply?.result && (typeof turn.reply.result.label !== 'string' || (turn.reply.result.profitSatang !== null && !Number.isFinite(turn.reply.result.profitSatang)) || ['revenueSatang','marginPct','beforeSatang','afterSatang','count'].some(key => { const value = turn.reply!.result![key as keyof ChatResult]; return value !== undefined && value !== null && !Number.isFinite(value); }))) throw Error('INVALID_CHAT_RESULT');
      if (turn.reply?.calculation && (!Array.isArray(turn.reply.calculation.items) || !Array.isArray(turn.reply.calculation.missingFields) || !Array.isArray(turn.reply.calculation.evidence))) throw Error('INVALID_CHAT_EVIDENCE');
      if(turn.reply?.catalogSummary!==undefined&&!catalogSummary(turn.reply.catalogSummary))throw Error('INVALID_CATALOG_SUMMARY');
      if(turn.reply?.catalogReferenceAt!==undefined&&(typeof turn.reply.catalogReferenceAt!=='string'||turn.reply.catalogReferenceAt.length>40||!Number.isFinite(Date.parse(turn.reply.catalogReferenceAt))))throw Error('INVALID_CATALOG_REFERENCE');
      return { ...turn, state: turn.state === 'pending' ? 'stopped' as const : turn.state };
    });
    return { ...session, turns };
  });
  if (new Set(sessions.map(s => s.id)).size !== sessions.length) throw Error('DUPLICATE_CHAT_SESSION');
  return { version: 1, activeId: sessions.some(s => s.id === value.activeId) ? value.activeId : sessions[0]?.id ?? null, sessions };
}
export function localChatStorage(key: string, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): ChatStorage {
  const load = () => parseArchive(storage.getItem(key));
  const save = (archive: ChatArchive) => storage.setItem(key, JSON.stringify(archive));
  return { load, save, delete(id) { const archive = load(); archive.sessions = archive.sessions.filter(s => s.id !== id); if (archive.activeId === id) archive.activeId = archive.sessions[0]?.id ?? null; save(archive); return archive; } };
}
export async function chatStorageKey(base: string): Promise<string> {
  const guest = sessionStorage.getItem('demoMode') === '1';
  const token = sessionStorage.getItem(guest ? 'demoToken' : 'token') ?? '';
  let identity = token;
  if (!guest) {
    try { const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))); if (typeof payload.sub === 'string') identity = payload.sub; } catch { /* Opaque local tokens get an isolated scope too. */ }
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${guest ? 'demo' : 'account'}|${identity}|${base}`));
  return 'marginsight:chat:v1:' + Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
