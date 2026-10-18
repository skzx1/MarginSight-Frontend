import type { ChatSession } from './assistant-sessions';

export function historySessions(sessions: ChatSession[], query = '') {
  const search = query.trim().toLocaleLowerCase();
  return sessions.filter(chat => chat.turns.length || chat.draft.trim() || chat.title.trim()).filter(chat => !search ||
    chat.title.toLocaleLowerCase().includes(search) || chat.draft.toLocaleLowerCase().includes(search) ||
    chat.turns.some(turn => turn.question.toLocaleLowerCase().includes(search) || turn.reply?.text.toLocaleLowerCase().includes(search)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
