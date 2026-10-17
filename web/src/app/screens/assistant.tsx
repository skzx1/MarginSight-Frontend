'use client';
import { useEffect, useRef, useState } from 'react';
import { request } from '../../lib/auth';
import type { AssistantAnswer, CatalogProduct, ChatMessage, FeatureProps } from '../../lib/types';
import { useLanguage } from '../language';
import { ProductSelect } from '../components/forms';
import { EvidencePanel } from '../components/ledger';
import { Icon } from '../ui';
import { enrichProducts, generateChatbotReply } from '../../lib/mock-data';

export default function Assistant({
  base,
  month,
  products: rawProducts,
  initialSku,
  draftRequest
}: FeatureProps & {
  products: CatalogProduct[];
  initialSku: string;
  draftRequest: number;
}) {
  const { t, locale } = useLanguage();
  const products = enrichProducts(rawProducts);

  const [sku, setSku] = useState(initialSku || products[0]?.sku || '');
  const [text, setText] = useState('');
  const [history, setHistory] = useState<Record<string, ChatMessage[]>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const locks = useRef(new Set<string>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = history[month] ?? [];
  const isPending = !!pending[month];

  // Auto-scroll on new message or when pending status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isPending]);

  // Initial draft prompt from other screens (e.g., clicking Ask from Products)
  useEffect(() => {
    if (initialSku) {
      setSku(initialSku);
      setText(t('askProfit'));
      inputRef.current?.focus();
    }
  }, [initialSku, draftRequest, t]);

  const send = async (explicitText?: string) => {
    const questionText = (explicitText !== undefined ? explicitText : text).trim();
    if (!questionText || locks.current.has(month)) return;

    const activeSku = sku || products[0]?.sku || 'GENERAL';
    const context = month;
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
      let answer: AssistantAnswer;
      try {
        answer = await request<AssistantAnswer>(base + '/assistant', {
          message: questionText,
          sku: activeSku,
          month: context
        });
      } catch {
        // Fallback to intelligent mock response if no backend is connected
        await new Promise(r => setTimeout(r, 600));
        answer = {
          answer: generateChatbotReply(questionText, products, locale),
          provider: 'deterministic-fallback'
        };
      }

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

  const promptChips = [
    t('promptProfitWeek'),
    t('promptTopProduct'),
    t('promptDiscountCheck'),
    t('promptBreakEven')
  ];

  return (
    <div className="modern-chat-container">
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
        </header>

        {/* Message Thread */}
        <div className="chat-messages-scroll" role="log" aria-live="polite" aria-label={t('assistant')}>
          {messages.length === 0 ? (
            <div className="modern-chat-empty">
              <div className="assistant-avatar-large" aria-hidden="true">
                <Icon name="assistant" />
              </div>
              <h2 className="chat-welcome-headline">{t('chatGreeting')}</h2>
              <p className="chat-welcome-desc">{t('welcomeBody')}</p>

              {/* 3-4 Suggested Prompts as Tappable Chips */}
              <div className="suggested-chips-container" role="region" aria-label={t('suggestedQuestions')}>
                <span className="chips-title">{t('suggestedQuestions')}:</span>
                <div className="chips-grid">
                  {promptChips.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggested-prompt-chip"
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
                        <strong>MarginSight Assistant</strong>
                        <span className="badge mock">
                          {t(msg.answer?.provider === 'deterministic-fallback' ? 'fallback' : 'aiAnswer')}
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
                          <p>{t('errorGeneric')}</p>
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
              maxLength={2000}
              className="chat-textarea"
            />
            <button
              type="submit"
              disabled={!text.trim() || isPending}
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
