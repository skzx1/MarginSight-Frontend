'use client';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { bangkokDate } from '../../lib/format';
import { historyGroup, type ChatSession } from '../../lib/assistant-sessions';
import { historySessions } from '../../lib/assistant-history';
import { useLanguage } from '../language';
import { Icon } from '../ui';
import { assistantCopy, type AssistantCopyKey } from './assistant-copy';
import { ChatIcon, useAssistantContext } from './assistant-provider';
import s from './assistant-history.module.css';

function RowMenu({ chat }: { chat: ChatSession }) {
  const { openRenameModal, openDeleteModal } = useAssistantContext();
  const { locale } = useLanguage();
  const t = (key: AssistantCopyKey) => assistantCopy[key][locale === 'th' ? 0 : 1];
  const id = useId(), ref = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => { ref.current?.hidePopover(); trigger.current?.focus({ preventScroll: true }); };
  const toggle = () => {
    const menu = ref.current, button = trigger.current;
    if (!menu || !button) return;
    if (menu.matches(':popover-open')) { close(); return; }
    const rect = button.getBoundingClientRect(), width = 192, height = 106;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width)) + 'px';
    menu.style.top = (rect.bottom + height + 8 < window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)) + 'px';
    menu.showPopover(); menu.querySelector<HTMLButtonElement>('button')?.focus();
  };
  const menuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };
  return <>
    <button ref={trigger} type="button" className={s.menuButton} aria-label={`${t('actions')} · ${chat.title || t('untitled')}`} aria-haspopup="menu" aria-controls={id} aria-expanded={open} onClick={toggle}><ChatIcon name="dots" /></button>
    <div ref={ref} id={id} popover="auto" role="menu" aria-label={t('actions')} className={s.menu} onKeyDown={menuKey} onToggle={e => setOpen((e.nativeEvent as ToggleEvent).newState === 'open')}>
      <button type="button" role="menuitem" className={s.menuItem} onClick={() => { ref.current?.hidePopover(); openRenameModal(chat); }}><ChatIcon name="edit" />{t('rename')}</button>
      <button type="button" role="menuitem" className={s.menuItem} onClick={() => { ref.current?.hidePopover(); openDeleteModal(chat); }}><ChatIcon name="trash" />{t('delete')}</button>
    </div>
  </>;
}

export function AssistantHistory({ drawer = false }: { drawer?: boolean }) {
  const { archive, ready, active, selectChat, newChat, openDeleteModal, openAllHistory, storageError } = useAssistantContext();
  const { locale } = useLanguage();
  const t = (key: AssistantCopyKey) => assistantCopy[key][locale === 'th' ? 0 : 1];
  const [search, setSearch] = useState(''), [focusId, setFocusId] = useState<string | null>(active?.id ?? null);
  const list = useRef<HTMLDivElement>(null);
  const all = historySessions(archive.sessions), matches = historySessions(archive.sessions, search);
  const sessions = drawer ? all.slice(0, 8) : matches;
  const groups = ['today','yesterday','week','older'] as const;
  const ordered = groups.flatMap(group => sessions.filter(chat => historyGroup(chat.updatedAt, bangkokDate()) === group));
  const selectedFocus = ordered.some(chat => chat.id === focusId) ? focusId : ordered.some(chat => chat.id === active?.id) ? active!.id : ordered[0]?.id;
  useEffect(() => { setFocusId(active?.id ?? null); }, [active?.id]);
  const navigateRows = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-chat-row]')) return;
    if (event.key === 'Delete') {
      event.preventDefault(); const chat = ordered.find(item => item.id === target.dataset.chatRow); if (chat) openDeleteModal(chat); return;
    }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const nodes = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-chat-row]')];
    const index = nodes.indexOf(target as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1 : Math.max(0, Math.min(nodes.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    nodes[next]?.focus(); nodes[next]?.scrollIntoView({ block: 'nearest' });
  };
  return <div className={s.surface + (drawer ? ' ' + s.drawerNav : ' ' + s.fullHistory)} aria-label={t(drawer ? 'recentChats' : 'allHistoryTitle')}>
    <div className={s.historyTop}>
      <button type="button" className={s.newChat} onClick={newChat} disabled={!ready}><Icon name="plus" /><span>{t('newChat')}</span></button>
      {!drawer && <div className={s.searchWrap}><Icon name="search" /><input type="search" aria-label={t('searchHistory')} placeholder={t('searchHistory')} value={search} onChange={e => setSearch(e.target.value)} /></div>}
      {drawer && <h2 className={s.recentHeading}>{t('recentChats')}</h2>}
    </div>
    <div ref={list} className={s.list} onKeyDown={navigateRows} aria-busy={!ready}>
      {!ready ? <><span className="sr-only" role="status">{t('loading')}</span><div className={s.skeleton} aria-hidden="true">{[1,2,3].map(i => <div key={i}><i /><i /></div>)}</div></>
        : !sessions.length ? <div className={s.empty} role="status"><Icon name="line" /><strong>{t(search.trim() ? 'noSearchResults' : 'historyEmpty')}</strong>{search.trim() && <button type="button" className={s.clearSearch} onClick={() => setSearch('')}>{t('clearHistorySearch')}</button>}</div>
        : groups.map(group => {
          const items = sessions.filter(chat => historyGroup(chat.updatedAt, bangkokDate()) === group);
          return items.length ? <div key={group} className={s.group}><h3 className={s.groupLabel}>{t(group)}</h3><ul className={s.rows}>{items.map(chat => {
            const isActive = chat.id === active?.id;
            const preview = chat.turns.at(-1)?.reply?.text ?? chat.turns.at(-1)?.question ?? chat.draft;
            const format = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { ...(group === 'today' ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : { day: 'numeric', month: 'short' as const }), timeZone: 'Asia/Bangkok' });
            return <li key={chat.id} className={s.row + (isActive ? ' ' + s.active : '')}>
              <button type="button" className={s.rowOpen} data-chat-row={chat.id} tabIndex={selectedFocus === chat.id ? 0 : -1} onFocus={() => setFocusId(chat.id)} onClick={() => selectChat(chat.id)} aria-current={isActive ? 'true' : undefined} title={chat.title || t('untitled')}>
                <span className={s.rowTop}><span className={s.rowTitle}>{chat.title || t('untitled')}</span><time dateTime={chat.updatedAt} title={new Date(chat.updatedAt).toLocaleString(locale, { timeZone: 'Asia/Bangkok' })}>{format.format(new Date(chat.updatedAt))}</time></span>
                {preview && <span className={s.preview}>{preview}</span>}
              </button><RowMenu chat={chat} />
            </li>;
          })}</ul></div> : null;
        })}
    </div>
    {drawer ? <div className={s.historyBottom}><button type="button" className={s.viewAll} onClick={openAllHistory} disabled={!ready}><span>{t('viewAll')}</span><Icon name="chevronRight" /></button></div>
      : <div className={s.storageNote}><Icon name="shield" /><div>{t(storageError ? 'notSaved' : 'local')}<small>{t('localNote')}</small></div></div>}
  </div>;
}

export function AssistantDrawerNav() { return <AssistantHistory drawer />; }
