'use client';
import { useEffect, useRef, useState } from 'react';
import { request } from '../../lib/auth';
import type { AssistantAnswer, CatalogProduct, ChatMessage, FeatureProps } from '../../lib/types';
import { useLanguage } from '../language';
import { ProductSelect, ErrorNotice } from '../components/forms';
import { EvidencePanel, Money } from '../components/ledger';
import { useResource } from '../../lib/use-resource';
import { MarketplaceControls } from '../components/marketplace-controls';
import {initialMarketplaceDraft,marketplaceRequest,type MarketplaceOptions,type MarketplaceDraft} from '../../lib/marketplace-context';
import { Icon } from '../ui';

export default function Playground({
  base,
  month,
  products: rawProducts,
  visible
}: FeatureProps & {
  products: CatalogProduct[];
  visible: boolean;
}) {
  const { t, locale } = useLanguage();
  const products = rawProducts;

  const [sku, setSku] = useState('');
  const [text, setText] = useState('');
  const [history, setHistory] = useState<Record<string, ChatMessage[]>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [marketplace, setMarketplace] = useState<MarketplaceDraft>({...initialMarketplaceDraft,platform:'shopee' as const});
  const [contextError, setContextError] = useState<unknown>();
  const options=useResource<MarketplaceOptions>(base+'/assistant-options');
  const contextKey=JSON.stringify([month,sku,marketplace]);
  const usingPlatform=marketplace.platform!=='recorded';

  const locks = useRef(new Set<string>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = history[contextKey] ?? [];
  const isPending = !!pending[contextKey];

  // Auto-scroll on new message or when pending status changes
  useEffect(() => {
    if (visible) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isPending, visible]);

  const send = async (explicitText?: string) => {
    const questionText = (explicitText !== undefined ? explicitText : text).trim();
    if (!questionText || !sku || locks.current.has(contextKey)) return;
    let scenario:ReturnType<typeof marketplaceRequest>;
    try { scenario=marketplaceRequest(marketplace,options.data); setContextError(undefined); }
    catch(error){setContextError(error);return;}
    const activeSku = sku;
    const context = contextKey;
    const id = crypto.randomUUID();

    locks.current.add(context);
    setPending(old => ({ ...old, [context]: true }));
    setHistory(old => ({
      ...old,
      [context]: [...(old[context] ?? []), { id, question: questionText, sku: activeSku }]
    }));

    if (explicitText === undefined) {
      setText('');
    }

    try {
      const answer = await request<AssistantAnswer>(base + (scenario?'/assistant-scenarios':'/assistant'), {
          message: questionText,
          sku: activeSku,
          month,
          ...(scenario?{scenario}:{})
        });

      setHistory(old => ({
        ...old,
        [context]: (old[context] ?? []).map(m => (m.id === id ? { ...m, answer } : m))
      }));
    } catch (error) {
      setHistory(old => ({
        ...old,
        [context]: (old[context] ?? []).map(m => (m.id === id ? { ...m, error } : m))
      }));
    } finally {
      locks.current.delete(context);
      setPending(old => ({ ...old, [context]: false }));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const promptChips = usingPlatform ? [t('askProfit'),t('askDiscount'),locale==='th'?'ราคาคุ้มทุนของสินค้านี้เท่าไร?':'What is the break-even price?',locale==='th'?'เทียบไม่เข้าแคมเปญกับเข้าแคมเปญ':'Compare without and with the selected campaigns'] : [
    t('promptProfitWeek'),
    t('promptTopProduct'),
    t('promptDiscountCheck'),
    t('promptBreakEven')
  ];

  return (
    <div className="modern-chat-container">
      <p className="notice">{locale==='th'?'พื้นที่ทดลองแพลตฟอร์มและแคมเปญ ผลเป็นประมาณการ ไม่เปลี่ยนออเดอร์หรือสมัครแคมเปญให้ร้าน':'Try platform and campaign assumptions. Estimates do not change orders or enroll your shop.'}</p>
      {/* Centered Readable Column Container */}
      <div className="modern-chat-column">
        {/* Chat Context Header */}
        <header className="chat-top-context">
          <div className="chat-context-controls">
            <div className="chat-sku-select">
              <ProductSelect products={products} value={sku} onChange={setSku} />
            </div>
            <span className="chat-month-tag">
              <Icon name="overview" />
              <span>{month}</span>
            </span>
          </div>
          <p className="caption chat-context-caption">{t('chatNote')}</p>
          <MarketplaceControls allowRecorded={false} draft={marketplace} change={value=>{setMarketplace(value);setContextError(undefined);}} options={options.data} loading={options.loading} error={options.error} reload={()=>void options.reload()}/>
          <ErrorNotice error={contextError}/>
          {usingPlatform&&<div className="marketplace-calculate"><button type="button" disabled={!sku||!marketplace.confirmed||isPending||!options.data} onClick={()=>void send(locale==='th'?'คำนวณกำไรตามแพลตฟอร์มและแคมเปญที่เลือก':'Calculate profit for the selected platform and campaigns')}>{locale==='th'?'คำนวณตามตัวเลือก':'Calculate selected scenario'}</button><small>{locale==='th'?'คำนวณด้วยสูตรโดยตรง ไม่เรียกโมเดล AI; ผลสำหรับสินค้าที่เลือกเท่านั้น':'Uses the deterministic engine without model inference; selected SKU only.'}</small></div>}
          <p className="caption">{locale==='th'?'เปลี่ยนสินค้า เดือน หรือเงื่อนไข จะแสดงประวัติของชุดตัวเลือกนั้นแยกกัน':'History is separated by product, month and selected assumptions.'}</p>
        </header>

        {/* Message Thread */}
        <div className="chat-messages-scroll" role="log" aria-live="polite" aria-label={'Playground'}>
          {messages.length === 0 ? (
            <div className="modern-chat-empty">
              <div className="assistant-avatar-large" aria-hidden="true">
                <Icon name="assistant" />
              </div>
              <h2 className="chat-welcome-headline">{locale==='th'?'ลองคำนวณก่อนตัดสินใจ':'Explore your next sale'}</h2>
              <p className="chat-welcome-desc">{locale==='th'?'เลือกสินค้า แพลตฟอร์ม และเงื่อนไข แล้วเทียบกำไรจากสูตรเดียวกับระบบ':'Choose a product, platform and assumptions to compare engine-calculated profit.'}</p>

              {/* 3-4 Suggested Prompts as Tappable Chips */}
              <div className="suggested-chips-container" role="region" aria-label={t('suggestedQuestions')}>
                <span className="chips-title">{t('suggestedQuestions')}:</span>
                <div className="chips-grid">
                  {promptChips.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggested-prompt-chip"
                      disabled={!sku||isPending||(usingPlatform&&!marketplace.confirmed)}
                      onClick={() => void send(prompt)}
                    >
                      <Icon name="sparkles" />
                      <span>{prompt}</span>
                      <span className="chip-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-bubbles-list">
              {messages.map(msg => (
                <div key={msg.id} className="chat-exchange">
                  {/* User Bubble */}
                  <div className="chat-bubble-user-row">
                    <div className="chat-bubble-user">
                      <div className="bubble-header-user">
                        <span>{t('you')}</span>
                        <small>{msg.sku} · {month}</small>
                      </div>
                      <p className="user-message-text">{msg.question}</p>
                    </div>
                  </div>

                  {/* Assistant Bubble */}
                  <div className="chat-bubble-assistant-row">
                    <div className="assistant-avatar-mini" aria-hidden="true">
                      <Icon name="assistant" />
                    </div>
                    <div className="chat-bubble-assistant">
                      <div className="bubble-header-assistant">
                        <strong>MarginShot Playground</strong>
                        <span className="badge mock">
                          {msg.answer?.provider==='deterministic-engine'?(locale==='th'?'คำนวณจากสูตร':'Calculation engine'):t(msg.answer?.provider === 'deterministic-fallback' ? 'fallback' : 'aiAnswer')}
                        </span>
                      </div>

                      {msg.answer ? (
                        <div className="assistant-answer-content">
                          <div className="formatted-answer-text">
                            {msg.answer.answer.split('\n').map((line, lineIdx) => {
                              if (!line.trim()) return <br key={lineIdx} />;
                              if (line.startsWith('### ') || line.startsWith('## ')) {
                                return <h4 key={lineIdx} className="answer-heading-text">{line.replace(/^#+\s*/, '')}</h4>;
                              }
                              if (line.startsWith('- ')) {
                                return (
                                  <p key={lineIdx} className="answer-bullet-line">
                                    <span className="bullet-dot">•</span>
                                    <span>{line.replace(/^- /, '')}</span>
                                  </p>
                                );
                              }
                              return <p key={lineIdx} className="answer-paragraph">{line}</p>;
                            })}
                          </div>

                          {msg.answer.scenarioContext&&<><p className="notice">{locale==='th'?'ผลลองคำนวณ ไม่ใช่ออเดอร์ที่เกิดขึ้นจริงหรือการสมัครแคมเปญ':'Hypothetical calculation, not an actual platform order or enrollment'} · {msg.answer.scenarioContext.platform} · {msg.answer.scenarioContext.sourceOrderId}</p>{!!msg.answer.result?.feeLines.length&&<details className="scenario-fee-lines"><summary>{locale==='th'?'ค่าธรรมเนียมแยกตามรายการที่คำนวณได้':'Calculated fee components'}</summary><p className="caption">{locale==='th'?'หากข้อมูลขาด รายการนี้ยังไม่ใช่ค่าธรรมเนียมทั้งหมด':'When inputs are incomplete, these are only the known components.'}</p><dl className="ledger-lines">{msg.answer.result.feeLines.map(f=><div key={f.id}><dt className="wrap">{f.type} · {f.id.replace('scenario-','').split('@')[0]}</dt><dd><Money value={f.amountSatang}/></dd></div>)}</dl></details>}</>}

                          {msg.answer.result?.profitSatang !== undefined && (
                            <details className="assistant-evidence-accordion">
                              <summary>{t('result')} / {t('evidence')}</summary>
                              <EvidencePanel result={msg.answer.result} />
                            </details>
                          )}
                        </div>
                      ) : msg.error ? (
                        <div className="notice error-notice">
                          <strong>{t('errorTitle')}</strong>
                          <ErrorNotice error={msg.error}/>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isPending && (
                <div className="chat-bubble-assistant-row typing-row" role="status" aria-label={t('typing')}>
                  <div className="assistant-avatar-mini" aria-hidden="true">
                    <Icon name="assistant" />
                  </div>
                  <div className="chat-bubble-assistant typing-bubble">
                    <div className="typing-dots" aria-hidden="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                    <span className="caption">{t('waiting')}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Pinned Bottom Composer */}
        <div className="chat-pinned-composer">
          <form
            className="composer-form"
            onSubmit={e => {
              e.preventDefault();
              void send();
            }}
          >
            <label htmlFor="chat-user-input" className="sr-only">
              {t('message')}
            </label>
            <textarea
              ref={inputRef}
              id="chat-user-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('message') + '...'}
              rows={2}
              maxLength={1500}
              className="chat-textarea"
            />
            <button
              type="submit"
              disabled={!text.trim() || !sku || isPending || (usingPlatform&&!marketplace.confirmed)}
              className="chat-send-button"
              aria-label={t('send')}
            >
              <Icon name="arrow" />
              <span>{t('send')}</span>
            </button>
          </form>
          <div className="composer-footer-hint">
            <small>{t('enterToSend')}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
