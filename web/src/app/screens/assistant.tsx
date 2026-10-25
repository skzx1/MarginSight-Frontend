'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CatalogProduct, FeatureProps } from '../../lib/types';
import { bangkokDate } from '../../lib/format';
import { percent, profitParts } from '../../lib/signed-money';
import { contextLabel, contextPreset, resolveChatContext } from '../../lib/assistant-context';
import { answerQuestion } from '../../lib/assistant-service';
import { createChat, historyGroup, sessionTitle, validContext, type ChatContext, type ChatTurn } from '../../lib/assistant-sessions';
import { recentChats, startAskChat } from '../../lib/assistant-arrival';
import { enterAction } from '../../lib/composer-keys';
import { bangkokDayLabel, greetingBucket } from '../../lib/greeting';
import { useLanguage } from '../language';
import { Icon } from '../ui';
import { EvidencePanel, Money } from '../components/ledger';
import { ProfitAmount } from '../components/profit-amount';
import { assistantCopy, type AssistantCopyKey } from '../components/assistant-copy';
import { ChatIcon, useAssistantContext, type AssistantPanel } from '../components/assistant-provider';
import s from '../components/assistant.module.css';
import { AssistantHistory } from '../components/assistant-history';
import { useAssistantViewport } from '../components/use-assistant-viewport';

function Dialog({ title, kind, close, children }: { title: string; kind: AssistantPanel; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), returnTo = useRef<HTMLElement | null>(null);
  const drag = useRef<number | null>(null);
  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement;
    const dialog = ref.current; dialog?.showModal();
    return () => { dialog?.close(); if (returnTo.current?.isConnected) returnTo.current.focus({ preventScroll: true }); };
  }, [kind]);
  return <dialog ref={ref} className={s.dialog + (kind === 'sheet' || kind === 'allHistory' ? ' ' + s.sheetDialog : '')} aria-labelledby="assistant-dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }} onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const nodes = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea,select,a[href]')].filter(n => n.checkVisibility());
    const first = nodes[0], last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }}><div className={s.dialogHeader}>{(kind === 'sheet' || kind === 'allHistory') && <span className={s.dragHandle} aria-hidden="true" onPointerDown={e => { if (window.innerWidth >= 768) return; drag.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current !== null && ref.current) ref.current.style.transform = `translateY(${Math.max(0, e.clientY - drag.current)}px)`; }} onPointerUp={e => { const distance = drag.current === null ? 0 : e.clientY - drag.current; drag.current = null; ref.current?.style.removeProperty('transform'); if (distance > 90) close(); }} onPointerCancel={() => { drag.current = null; ref.current?.style.removeProperty('transform'); }} />}<h2 id="assistant-dialog-title">{title}</h2><button type="button" className={s.iconButton} aria-label={title + ' · ' + (document.documentElement.lang === 'en' ? 'Close' : 'ปิด')} onClick={close}><Icon name="close" /></button></div>{children}</dialog>;
}

function AnswerText({ text }: { text: string }) {
  return <div className={s.answerText}>{text.split('\n').map((line, i) => {
    const parts = line.replace(/^#{1,4}\s*/, '').split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part);
    return line.trim() ? <p key={i}>{parts}</p> : null;
  })}</div>;
}

export default function Assistant({ base, guest, origin, products, initialSku, draftRequest, defaultContext, visible, more, loadMore, catalogError, catalogLoading, retryCatalog, onDraftHandled }: FeatureProps & {
  products: CatalogProduct[]; initialSku: string; draftRequest: number; defaultContext: ChatContext; visible: boolean;
  more?: string; loadMore: () => void; catalogError?: unknown; catalogLoading: boolean; retryCatalog: () => void; onDraftHandled: () => void;
}) {
  const { locale } = useLanguage();
  const t = (key: AssistantCopyKey) => assistantCopy[key][locale === 'th' ? 0 : 1];
  const {
    archive, setArchive, updateSession, ready, active, storageError, retrySave, canRetrySave,
    deleteChat, renameChat, selectChat, panel, setPanel, targetChat,
    openRenameModal, openDeleteModal, openSheet, closePanel, textareaRef
  } = useAssistantContext();

  const [editingTitle, setEditingTitle] = useState(false);
  const [inlineTitleDraft, setInlineTitleDraft] = useState('');
  const inlineTitleInput = useRef<HTMLInputElement>(null);

  const [renameDraft, setRenameDraft] = useState('');
  useEffect(() => { if (panel === 'rename') setRenameDraft(targetChat?.title || active?.title || ''); }, [panel, targetChat?.id, targetChat?.title, active?.title]);
  const [productSearch, setProductSearch] = useState('');
  const [periodDraft, setPeriodDraft] = useState<ChatContext>(defaultContext);
  const [notice, setNotice] = useState<AssistantCopyKey | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [copied, setCopied] = useState('');

  const root = useRef<HTMLDivElement>(null);
  const composerWrap = useRef<HTMLDivElement>(null);
  useAssistantViewport(visible, root);
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true), forceBottom = useRef(false), draftHandled = useRef(0);
  const pending = useRef(new Map<string, { turnId: string; controller: AbortController }>());
  const activePending = active?.turns.some(turn => turn.state === 'pending') ?? false;
  // A1: compositionstart/end flag, for WebKit, which can deliver the committing Enter with isComposing=false.
  const composing = useRef(false);
  // A2/D4: on touch keyboards (pointer: coarse) Enter is a newline and the visible send button sends.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const query = matchMedia('(pointer:coarse)'), update = () => setCoarse(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  // A3: the greeting is computed on the client when the empty state shows (no build-time hour, no live ticking).
  const emptyChat = !active?.turns.length;
  const [greetingAt, setGreetingAt] = useState<Date | null>(null);
  useEffect(() => { if (visible && emptyChat) setGreetingAt(new Date()); }, [visible, emptyChat, active?.id]);

  const focusComposer = () => window.requestAnimationFrame(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.setSelectionRange(node.value.length, node.value.length);
  });

  useEffect(() => {
    const composer = composerWrap.current, host = root.current;
    if (!visible || !composer || !host) return;
    const observer = new ResizeObserver(() => host.style.setProperty('--composer-height', `${composer.getBoundingClientRect().height}px`));
    observer.observe(composer);
    return () => { observer.disconnect(); host.style.removeProperty('--composer-height'); };
  }, [visible]);

  useEffect(() => () => { for (const job of pending.current.values()) job.controller.abort(); }, []);
  useEffect(() => { if (!visible) closePanel(); }, [visible, closePanel]);

  useEffect(() => {
    if (!ready || !visible || !initialSku || !draftRequest || draftHandled.current === draftRequest) return;
    draftHandled.current = draftRequest;
    const chat = createChat({ ...defaultContext, sku: initialSku });
    chat.draft = locale === 'th' ? 'สินค้านี้เหลือกำไรเท่าไร?' : 'How much profit does this product make?';
    onDraftHandled();
    // A12: at the 100-chat limit (and no empty chat to reuse) say so and open history, instead of dropping the ask.
    if (!startAskChat(archive, chat)) { setNotice('askLimit'); setPanel('sheet'); return; }
    setArchive(old => startAskChat(old, chat) ?? old);
    // A11: this arrival focuses the composer (caret at the end of the prepared question), not the screen title.
    textareaRef.current?.focus({ preventScroll: true });
    focusComposer();
  }, [ready, visible, draftRequest, initialSku, defaultContext, locale, archive, setArchive, setPanel, onDraftHandled, textareaRef]);

  useEffect(() => {
    const node = textareaRef.current;
    if (node && visible) { node.style.height = '0px'; node.style.height = Math.min(160, Math.max(48, node.scrollHeight)) + 'px'; }
  }, [active?.draft, active?.id, visible, textareaRef]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node || !visible) return;
    let width = -1;
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.width === width) return;
      width = entries[0].contentRect.width;
      node.style.height = '0px'; node.style.height = Math.min(160, Math.max(48, node.scrollHeight)) + 'px';
    });
    observer.observe(node.parentElement!); return () => observer.disconnect();
  }, [visible, textareaRef]);

  useEffect(() => { nearBottom.current = true; setAtBottom(true); forceBottom.current = true; }, [active?.id, visible]);
  const lastTurn = active?.turns.at(-1);
  useEffect(() => {
    if (!visible || !scroll.current) return;
    if (nearBottom.current || forceBottom.current) { scroll.current.scrollTop = scroll.current.scrollHeight; forceBottom.current = false; }
  }, [active?.id, active?.turns.length, lastTurn?.state, visible]);

  useEffect(() => {
    if (editingTitle) {
      inlineTitleInput.current?.focus();
      inlineTitleInput.current?.select();
    }
  }, [editingTitle]);

  const changeContext = (context: ChatContext) => {
    if (active) updateSession(active.id, chat => ({ ...chat, context }));
    closePanel();
    textareaRef.current?.focus({ preventScroll: true });
  };

  const run = async (sessionId: string, turn: ChatTurn) => {
    const controller = new AbortController();
    pending.current.set(sessionId, { turnId: turn.id, controller });
    try {
      const reply = await answerQuestion({ base, question: turn.requestQuestion ?? turn.question, context: turn.context, products, locale, signal: controller.signal });
      if (!controller.signal.aborted) updateSession(sessionId, chat => ({ ...chat, updatedAt: new Date().toISOString(), turns: chat.turns.map(item => item.id === turn.id ? { ...item, reply, state: 'complete' } : item) }));
    } catch {
      if (!controller.signal.aborted) updateSession(sessionId, chat => ({ ...chat, turns: chat.turns.map(item => item.id === turn.id ? { ...item, state: 'failed' } : item) }));
    } finally { if (pending.current.get(sessionId)?.controller === controller) pending.current.delete(sessionId); }
  };

  const send = (explicit?: string) => {
    if (!active || pending.current.has(active.id)) return;
    const question = (explicit ?? active.draft).trim();
    if (!question) return;
    if (active.turns.length >= 200) { setNotice('turnLimit'); return; }
    const context = resolveChatContext(question, active.context, products, bangkokDate());
    const previous = active.turns.at(-1);
    const productOnly = products.some(p => [p.sku, p.name].some(v => v.toLocaleLowerCase() === question.toLocaleLowerCase()));
    const requestQuestion = productOnly && previous?.reply?.source === 'notice' && !previous.context.sku && /ลด|discount|คุ้มทุน|break.even/i.test(previous.question) ? previous.question + '\n' + question : undefined;
    const turn: ChatTurn = { id: crypto.randomUUID(), question, requestQuestion, createdAt: new Date().toISOString(), context, state: 'pending' };
    forceBottom.current = true; setNotice(null);
    updateSession(active.id, chat => ({ ...chat, context, draft: '', title: chat.title || sessionTitle(question), updatedAt: turn.createdAt, turns: [...chat.turns, turn] }));
    void run(active.id, turn);
  };

  const regenerate = (turn: ChatTurn) => {
    if (!active || pending.current.has(active.id)) return;
    updateSession(active.id, chat => ({ ...chat, turns: chat.turns.map(item => item.id === turn.id ? { ...item, state: 'pending', reply: undefined } : item) }));
    void run(active.id, { ...turn, state: 'pending' });
  };

  const stop = () => {
    if (!active) return;
    const job = pending.current.get(active.id); job?.controller.abort(); pending.current.delete(active.id);
    updateSession(active.id, chat => ({ ...chat, turns: chat.turns.map(turn => turn.id === job?.turnId ? { ...turn, state: 'stopped' } : turn) }));
  };

  const productLabel = (sku: string | null) => sku ? products.find(p => p.sku === sku)?.name ?? sku : t('all');
  const copy = async (turn: ChatTurn) => {
    if (!turn.reply) return;
    const reply = turn.reply, result = reply.result;
    const text = [reply.text, result && `${result.label}: ${result.profitSatang == null ? t('missing') : profitParts(result.profitSatang, locale).text}`, t('basedOn') + ': ' + contextLabel(reply.context, locale) + ' · ' + productLabel(reply.context.sku), reply.note].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(text); setCopied(turn.id); setTimeout(() => setCopied(''), 1800); } catch { setNotice('copyFailed'); }
  };
  const dateLabel = (context: ChatContext) => context.start === bangkokDate().slice(0, 7) + '-01' && context.end === bangkokDate() ? t('thisMonth') : contextLabel(context, locale);

  const saveInlineTitle = () => {
    if (active && inlineTitleDraft.trim() && inlineTitleDraft.trim() !== active.title) {
      renameChat(active.id, inlineTitleDraft.trim());
    }
    setEditingTitle(false);
  };

  const renderAnswer = (turn: ChatTurn) => {
    const reply = turn.reply;
    return <div className={s.assistantRow}><div className={s.assistantBody}>
      <div className={s.answerByline}>
        <span className={s.avatar} aria-hidden="true"><Icon name="assistant" /></span>
        <strong>{t('assistant')}</strong>
        {reply && reply.source !== 'recorded' && <small className={s.sourceTag}>{t(reply.source === 'assistant' ? 'ai' : reply.source === 'fallback' ? 'fallback' : 'notice')}</small>}
      </div>
      {turn.state === 'pending' ? <div className={s.typing} role="status"><span aria-hidden="true"><i /><i /><i /></span>{t('typing')}</div> : reply ? <>
        <AnswerText text={reply.text} />
        {reply.result && <div className={s.resultCard}><div className={s.resultMain}><span>{reply.result.label}</span><strong className={reply.result.profitSatang == null ? s.missing : reply.result.profitSatang < 0 ? s.loss : ''}>{reply.result.profitSatang == null ? t('missing') : <ProfitAmount value={reply.result.profitSatang} />}</strong></div>
          <dl>{reply.result.revenueSatang !== undefined && <div><dt>{t('revenue')}</dt><dd><Money value={reply.result.revenueSatang} /></dd></div>}{reply.result.marginPct !== undefined && <div><dt>{t('margin')}</dt><dd>{percent(reply.result.marginPct, locale)}</dd></div>}{reply.result.count !== undefined && <div><dt>{locale === 'th' ? 'จากออเดอร์' : 'Recorded orders'}</dt><dd>{reply.result.count} {t('orders')}</dd></div>}{reply.result.beforeSatang !== undefined && <><div><dt>{t('before')}</dt><dd><Money value={reply.result.beforeSatang} /></dd></div><div><dt>{t('after')}</dt><dd><Money value={reply.result.afterSatang} /></dd></div></>}</dl>
        </div>}
        <div className={s.answerFootnote}>
          <ChatIcon name="calendar" />
          <div><span>{t('basedOn')}: {contextLabel(reply.context, locale)} · {productLabel(reply.context.sku)}</span>
          {reply.note && <span className={s.footnoteNote}> · {reply.note}</span>}</div>
        </div>
        {reply.calculation && <details className={s.evidence}><summary>{t('evidence')}</summary><EvidencePanel result={reply.calculation} /></details>}
        <div className={s.messageActions}>
          <button type="button" className={s.quietAction} onClick={() => void copy(turn)} aria-label={t(copied === turn.id ? 'copied' : 'copy')} title={t(copied === turn.id ? 'copied' : 'copy')}>
            <ChatIcon name={copied === turn.id ? 'check' : 'copy'} /><span>{t(copied === turn.id ? 'copied' : 'copy')}</span>
          </button>
          {turn.id === lastTurn?.id && <button type="button" className={s.quietAction} onClick={() => regenerate(turn)} disabled={activePending} aria-label={t('regenerate')} title={t('regenerate')}>
            <Icon name="refresh" /><span>{t('regenerate')}</span>
          </button>}
        </div>
      </> : <div className={s.responseNotice} role={turn.state === 'failed' ? 'alert' : undefined}><p>{t(turn.state === 'stopped' ? 'stopped' : 'failed')}</p>{turn.state === 'stopped' && <small>{t('stopNote')}</small>}<button type="button" className={s.secondary} onClick={() => regenerate(turn)} disabled={activePending}><Icon name="refresh" />{t('retry')}</button></div>}
    </div></div>;
  };

  // Empty state (DA2 ledger layout + DC provenance): date line, time-of-day greeting, suggested questions as ledger
  // lines that say which data they read, then recent chats. A suggestion fills the composer; the user sends (A4).
  const prompts = [['profitPrompt', 'profitUses'], ['rankingPrompt', 'rankingUses'], ['discountPrompt', 'discountUses'], ['weekPrompt', 'weekUses']] as const;
  const fillDraft = (text: string) => { if (!active) return; updateSession(active.id, chat => ({ ...chat, draft: text })); focusComposer(); };
  const recentTime = (iso: string) => {
    const group = historyGroup(iso, bangkokDate());
    const time = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { ...(group === 'today' ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : { day: 'numeric', month: 'short' as const }), timeZone: 'Asia/Bangkok' }).format(new Date(iso));
    return group === 'today' ? `${t('today')} ${time}` : group === 'yesterday' ? t('yesterday') : time;
  };
  const renderWelcome = () => {
    const bucket = greetingAt && greetingBucket(greetingAt);
    const greet = bucket && t(bucket === 'morning' ? 'greetingMorning' : bucket === 'afternoon' ? 'greetingAfternoon' : bucket === 'evening' ? 'greetingEvening' : 'greetingLate');
    const recent = recentChats(archive.sessions, active?.id);
    // Each phrase is an unbreakable unit; lines break only between phrases (U+200B in the copy marks the Thai split).
    const phrases = [greet, ...t('greetingAsk').split('\u200B')].filter((part): part is string => Boolean(part));
    return <div className={s.welcome}>
      <p className={s.day}><span className={s.welcomeMark} aria-hidden="true"><Icon name="assistant" /></span>{greetingAt && <span>{bangkokDayLabel(greetingAt, locale)}</span>}</p>
      <h2>{phrases.map((part, i) => <span key={i}>{i === 1 && greet ? ' ' : i > 0 ? <wbr /> : null}<span className={s.phrase}>{part}</span></span>)}</h2>
      <p className={s.intro}>{t('intro')}</p>
      <div className={s.prompts} role="group" aria-label={t('prompts')}>{prompts.map(([key, uses]) => <button type="button" key={key} onClick={() => fillDraft(t(key))} disabled={!ready}>
        <span className={s.promptText}>{t(key)}</span><span className={s.promptLeader} aria-hidden="true" /><small>{t(uses)}</small><Icon name="chevronRight" />
      </button>)}</div>
      {recent.length > 0 && <section className={s.recent} aria-labelledby="assistant-recent-title"><h3 id="assistant-recent-title">{t('recentChats')}</h3><ul>{recent.map(chat => <li key={chat.id}>
        <button type="button" onClick={() => selectChat(chat.id)}><span>{chat.title || t('untitled')}</span><time dateTime={chat.updatedAt}>{recentTime(chat.updatedAt)}</time></button>
      </li>)}</ul></section>}
    </div>;
  };

  return <div className={s.root} ref={root}>
    <h1 id="screen-title" tabIndex={-1} className="sr-only">{t('assistant')}</h1>
    <div className={s.conversation}>
      <header className={s.chatHeader}>
        <div className={s.headerLeft}>
          {editingTitle ? (
            <form className={s.inlineTitleForm} onSubmit={e => { e.preventDefault(); saveInlineTitle(); }}>
              <input ref={inlineTitleInput} type="text" className={s.inlineTitleInput} value={inlineTitleDraft} onChange={e => setInlineTitleDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditingTitle(false); }} onBlur={saveInlineTitle} maxLength={120} aria-label={t('name')} />
              <button type="submit" className={s.inlineTitleCheck} aria-label={t('save')} title={t('save')}><ChatIcon name="check" /></button>
            </form>
          ) : (
            <button type="button" className={s.headerTitleBtn} onClick={() => { setInlineTitleDraft(active?.title || t('untitled')); setEditingTitle(true); }} title={t('tapToRename')} aria-label={`${active?.title || t('untitled')} · ${t('tapToRename')}`}>
              <span className={s.headerTitleText}>{active?.title || t('untitled')}</span>
              <span className={s.editHintIcon} aria-hidden="true"><ChatIcon name="edit" /></span>
            </button>
          )}
          {(guest || origin === 'MOCK') && <span className={s.mockBadge} title={locale === 'th' ? 'นำเข้าได้ 3 ไฟล์ · ผู้ช่วยและอ่านบิลรวม 3 ครั้งต่อรอบ' : '3 imports · 3 assistant/receipt requests per session'} tabIndex={0} role="note" aria-label={t('mock')}>{t('mock')}</span>}
        </div>
        <div className={s.headerRight}>
          <button type="button" className={s.historyHeaderButton} onClick={openSheet} aria-label={t('history')} aria-expanded={panel === 'sheet'} aria-haspopup="dialog"><ChatIcon name="history" /><span>{t('historyShort')}</span></button>
        </div>
      </header>
      {storageError && <div className={s.warning} role="status">{t('storageError')}{canRetrySave && <button type="button" onClick={retrySave}>{t('storageRetry')}</button>}</div>}
      {notice && <div className={s.warning} role="status">{t(notice)}</div>}
      <div className={s.messageScroll} ref={scroll} tabIndex={0} aria-label={t('assistant')} onScroll={e => { const el = e.currentTarget; const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90; nearBottom.current = near; setAtBottom(near); }}>
        <div className={s.messageColumn}>
          {!active?.turns.length ? renderWelcome() : <div className={s.turns}>{active.turns.map(turn => <article className={s.turn} key={turn.id}><div className={s.userRow}><div className={s.userBubble}><span className="sr-only">{t('you')}: </span>{turn.question}</div></div>{renderAnswer(turn)}</article>)}</div>}
        </div>
      </div>
      {!atBottom && !!active?.turns.length && <button type="button" className={s.jump} onClick={() => { if (scroll.current) scroll.current.scrollTo({ top: scroll.current.scrollHeight, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' }); }}><ChatIcon name="down" />{t('latest')}</button>}
      <div className={s.composerWrap} ref={composerWrap}><div className={s.composerColumn}>
        <form className={s.composer} onSubmit={e => { e.preventDefault(); send(); }}>
          <label htmlFor="assistant-input" className="sr-only">{t('input')}</label>
          <textarea ref={textareaRef} id="assistant-input" rows={1} maxLength={1500} value={active?.draft ?? ''} placeholder={t('placeholder')} title={t(coarse ? 'hintTouch' : 'hint')} enterKeyHint={coarse ? 'enter' : 'send'} disabled={!ready} onChange={e => { const draft = e.target.value; if (active) updateSession(active.id, chat => ({ ...chat, draft })); }}
            onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { window.setTimeout(() => { composing.current = false; }, 0); }}
            onKeyDown={e => { const action = enterAction({ key: e.key, shiftKey: e.shiftKey, isComposing: e.nativeEvent.isComposing, keyCode: e.keyCode }, { composing: composing.current, pending: activePending, coarse }); if (action === 'default') return; e.preventDefault(); if (action === 'send') send(); }} aria-describedby="assistant-context" />
          <div className={s.composerToolbar}>
            <div id="assistant-context" className={s.context} role="group" aria-label={t('using')}>
              <span className={s.contextLabel} aria-hidden="true">{t('using')}</span>
              <button type="button" disabled={!ready} aria-label={t('editPeriod')} aria-haspopup="dialog" aria-expanded={panel === 'period'} onClick={() => { setPeriodDraft(active?.context ?? defaultContext); setPanel('period'); }}><ChatIcon name="calendar" /><span>{dateLabel(active?.context ?? defaultContext)}</span><span className={s.contextChevron} aria-hidden="true"><Icon name="chevronRight" /></span></button>
              <button type="button" disabled={!ready} aria-label={t('editProduct')} aria-haspopup="dialog" aria-expanded={panel === 'products'} onClick={() => { setProductSearch(''); setPanel('products'); }}><Icon name="products" /><span>{productLabel(active?.context.sku ?? null)}</span><span className={s.contextChevron} aria-hidden="true"><Icon name="chevronRight" /></span></button>
            </div>
            {activePending ? <button type="button" className={s.send} onClick={stop} aria-label={t('stop')} title={t('stop')}><ChatIcon name="stop" /></button> : <button type="submit" className={s.send} disabled={!ready || !active?.draft.trim()} aria-label={t('send')} title={t('send')}><Icon name="arrow" /><span className={s.sendLabel} aria-hidden="true">{t('sendShort')}</span></button>}
          </div>
        </form>
      </div></div>
    </div>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{lastTurn?.state === 'complete' ? lastTurn.reply?.text : ''}{copied ? t('copied') : ''}</div>
    {panel && <Dialog kind={panel} title={t(panel === 'sheet' ? 'history' : panel === 'allHistory' ? 'allHistoryTitle' : panel === 'period' ? 'period' : panel === 'products' ? 'product' : panel === 'rename' ? 'renameTitle' : 'deleteTitle')} close={closePanel}>
      {panel === 'sheet' || panel === 'allHistory' ? <AssistantHistory /> : panel === 'period' ? <form className={s.dialogBody} onSubmit={e => { e.preventDefault(); if (validContext(periodDraft) && Date.parse(periodDraft.end) - Date.parse(periodDraft.start) <= 366 * 86400000) changeContext(periodDraft); }}><p className={s.dialogNote}>{t('optional')}</p><div className={s.presets}>{(['today','week','lastWeek','month','lastMonth'] as const).map(preset => <button type="button" key={preset} className={s.secondary} onClick={() => setPeriodDraft({ ...contextPreset(preset, bangkokDate()), sku: active?.context.sku ?? null })}>{t(preset === 'month' ? 'thisMonth' : preset === 'week' ? 'thisWeek' : preset)}</button>)}</div><div className={s.dateFields}><label>{t('from')}<input type="date" required value={periodDraft.start} onChange={e => setPeriodDraft(v => ({ ...v, start: e.target.value }))} /></label><label>{t('to')}<input type="date" required value={periodDraft.end} onChange={e => setPeriodDraft(v => ({ ...v, end: e.target.value }))} /></label></div>{(!validContext(periodDraft) || Date.parse(periodDraft.end) - Date.parse(periodDraft.start) > 366 * 86400000) && <p className={s.missing} role="status">{t('invalidRange')}</p>}<button type="submit" disabled={!validContext(periodDraft) || Date.parse(periodDraft.end) - Date.parse(periodDraft.start) > 366 * 86400000}>{t('apply')}</button></form>
        : panel === 'products' ? <div className={s.dialogBody}><p className={s.dialogNote}>{t('optional')}</p><label className="sr-only" htmlFor="assistant-product-search">{t('searchProducts')}</label><input id="assistant-product-search" type="search" placeholder={t('searchProducts')} value={productSearch} onChange={e => setProductSearch(e.target.value)} /><div className={s.productChoices}><button type="button" aria-pressed={!active?.context.sku} onClick={() => changeContext({ ...(active?.context ?? defaultContext), sku: null })}><Icon name="products" />{t('all')}</button>{products.filter(p => `${p.name} ${p.sku}`.toLocaleLowerCase().includes(productSearch.toLocaleLowerCase())).map(p => <button type="button" key={p.sku} aria-pressed={active?.context.sku === p.sku} onClick={() => changeContext({ ...(active?.context ?? defaultContext), sku: p.sku })}><span>{p.name}<small>{p.sku}</small></span><Icon name="chevronRight" /></button>)}{!products.some(p => `${p.name} ${p.sku}`.toLocaleLowerCase().includes(productSearch.toLocaleLowerCase())) && <p>{t('noProducts')}</p>}{catalogLoading && <p role="status">{t('typing')}</p>}{Boolean(catalogError) && <div role="alert"><p>{t('catalogError')}</p><button type="button" className={s.secondary} onClick={retryCatalog}>{t('retry')}</button></div>}{more && <button type="button" className={s.secondary} disabled={catalogLoading} onClick={loadMore}>{t('loadMore')}</button>}</div></div>
        : panel === 'rename' ? <form className={s.dialogBody} onSubmit={e => { e.preventDefault(); const target = targetChat || active; const title = renameDraft.trim(); if (target && title) renameChat(target.id, title); }}><label htmlFor="assistant-chat-name">{t('name')}</label><input id="assistant-chat-name" value={renameDraft} onChange={e => setRenameDraft(e.target.value)} maxLength={120} required autoFocus /><div className={s.dialogActions}><button type="button" className={s.secondary} onClick={closePanel}>{t('cancel')}</button><button type="submit">{t('save')}</button></div></form>
        : <div className={s.dialogBody}><p>{t('deleteBody')}</p><strong className={s.deleteName}>{targetChat?.title || active?.title || t('untitled')}</strong><div className={s.dialogActions}><button type="button" className={s.secondary} autoFocus onClick={closePanel}>{t('cancel')}</button><button type="button" className={s.deleteConfirmBtn} onClick={() => { const target = targetChat || active; if (target) deleteChat(target.id); }}>{t('delete')}</button></div></div>}
    </Dialog>}
  </div>;
}
