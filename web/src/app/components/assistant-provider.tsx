'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { ChatArchive, ChatContext, ChatSession } from '../../lib/assistant-sessions';
import { createChat } from '../../lib/assistant-sessions';
import { useChatSessions } from './use-chat-sessions';

export type AssistantPanel = 'period' | 'products' | 'campaigns' | 'questions' | 'rename' | 'delete' | 'allHistory' | 'sheet' | null;

export function ChatIcon({ name }: { name: 'history' | 'copy' | 'edit' | 'trash' | 'down' | 'stop' | 'calendar' | 'dots' | 'check' }) {
  const paths = {
    history: <path d="M3 11a9 9 0 1 1 2.7 7M3 4v7h7M12 7v5l3 2" />,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    edit: <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" />,
    trash: <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />,
    down: <path d="M12 4v16m-6-6 6 6 6-6" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    dots: <><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export interface AssistantContextValue {
  archive: ChatArchive;
  setArchive: React.Dispatch<React.SetStateAction<ChatArchive>>;
  updateSession: (id: string, update: (session: ChatSession) => ChatSession) => void;
  ready: boolean;
  active: ChatSession | undefined;
  storageError: boolean;
  retrySave: () => void;
  canRetrySave: boolean;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  panel: AssistantPanel;
  setPanel: (panel: AssistantPanel) => void;
  targetChat: ChatSession | null;
  setTargetChat: (chat: ChatSession | null) => void;
  openRenameModal: (chat: ChatSession) => void;
  openDeleteModal: (chat: ChatSession) => void;
  openAllHistory: () => void;
  openSheet: () => void;
  closePanel: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  focusInput: () => void;
  defaultContext: ChatContext;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistantContext() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistantContext must be used within AssistantProvider');
  return ctx;
}

export function AssistantProvider({
  base,
  defaultContext,
  children,
}: {
  base: string;
  defaultContext: ChatContext;
  children: ReactNode;
}) {
  const { archive, setArchive, updateSession, ready, active, storageError, retrySave, canRetrySave } = useChatSessions(base, defaultContext);
  const [panel, setPanel] = useState<AssistantPanel>(null);
  const [targetChat, setTargetChat] = useState<ChatSession | null>(null);
  const returnPanel = useRef<AssistantPanel>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  };

  const newChat = () => {
    const empty = archive.sessions.find(chat => !chat.turns.length && !chat.draft.trim());
    const chat = empty ? { ...empty, context: { ...defaultContext } } : createChat(defaultContext);
    setArchive(old => ({
      ...old,
      activeId: chat.id,
      sessions: empty ? old.sessions.map(item => item.id === chat.id ? chat : item) : [chat, ...old.sessions],
    }));
    setPanel(null);
    setTargetChat(null);
    returnPanel.current = null;
    focusInput();
  };

  const selectChat = (id: string) => {
    setArchive(old => ({ ...old, activeId: id }));
    setPanel(null);
    setTargetChat(null);
    returnPanel.current = null;
    focusInput();
  };

  const deleteChat = (id: string) => {
    const remaining = archive.sessions.filter(chat => chat.id !== id);
    const fallback = remaining[0] ?? createChat(defaultContext);
    setArchive({
      version: 1,
      activeId: active?.id === id ? fallback.id : (active?.id ?? fallback.id),
      sessions: remaining.length ? remaining : [fallback],
    });
    setPanel(returnPanel.current);
    returnPanel.current = null;
    setTargetChat(null);
  };

  const renameChat = (id: string, title: string) => {
    updateSession(id, chat => ({ ...chat, title: title.trim(), renamed: true }));
    setPanel(returnPanel.current);
    returnPanel.current = null;
    setTargetChat(null);
  };

  const openRenameModal = (chat: ChatSession) => {
    returnPanel.current = panel === 'sheet' || panel === 'allHistory' ? panel : null;
    setTargetChat(chat);
    setPanel('rename');
  };

  const openDeleteModal = (chat: ChatSession) => {
    returnPanel.current = panel === 'sheet' || panel === 'allHistory' ? panel : null;
    setTargetChat(chat);
    setPanel('delete');
  };

  const openAllHistory = () => {
    setPanel('allHistory');
  };

  const openSheet = () => {
    setPanel('sheet');
  };

  const closePanel = useCallback(() => {
    setPanel(returnPanel.current);
    returnPanel.current = null;
    setTargetChat(null);
  }, []);

  const value: AssistantContextValue = {
    archive,
    setArchive,
    updateSession,
    ready,
    active,
    storageError,
    retrySave,
    canRetrySave,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
    panel,
    setPanel,
    targetChat,
    setTargetChat,
    openRenameModal,
    openDeleteModal,
    openAllHistory,
    openSheet,
    closePanel,
    textareaRef,
    focusInput,
    defaultContext,
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

