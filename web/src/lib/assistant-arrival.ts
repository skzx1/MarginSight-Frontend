import { historySessions } from './assistant-history.ts';
import type { ChatArchive, ChatSession } from './assistant-sessions';

export const SESSION_LIMIT = 100;

// "Ask about this product" (A12): open the prepared chat. At the session limit an unused empty chat is reused;
// with none left the result is null, so the caller shows the limit notice and opens history instead of dropping it.
export function startAskChat(archive: ChatArchive, chat: ChatSession): ChatArchive | null {
  if (archive.sessions.length < SESSION_LIMIT) return { ...archive, activeId: chat.id, sessions: [chat, ...archive.sessions] };
  const empty = archive.sessions.find(item => !item.turns.length && !item.draft.trim());
  if (!empty) return null;
  const reused = { ...chat, id: empty.id };
  return { ...archive, activeId: reused.id, sessions: archive.sessions.map(item => item.id === empty.id ? reused : item) };
}

// Recent conversations under the empty-state welcome (A7): up to six saved chats, newest first, not the open one.
export function recentChats(sessions: ChatSession[], activeId: string | null | undefined, limit = 6) {
  return historySessions(sessions).filter(chat => chat.id !== activeId).slice(0, limit);
}
