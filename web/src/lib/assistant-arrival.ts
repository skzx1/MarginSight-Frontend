import { historySessions } from './assistant-history.ts';
import type { ChatSession } from './assistant-sessions';

// Recent conversations under the empty-state welcome (A7): up to six saved chats, newest first, not the open one.
export function recentChats(sessions: ChatSession[], activeId: string | null | undefined, limit = 6) {
  return historySessions(sessions).filter(chat => chat.id !== activeId).slice(0, limit);
}
