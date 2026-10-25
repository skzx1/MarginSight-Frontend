import { request } from './auth.ts';
import {catalogSummary} from './assistant-summary.ts';
import {marketplacePayload} from './marketplace-context.ts';
import type { ChatContext, ChatReply } from './assistant-sessions';
import type { Calculation, CatalogProduct } from './types';

export type RecentMessage = { role: 'user' | 'assistant'; text: string };
type RoutedAnswer = {
  answer: string; provider: string; note?: string; calculation?: Calculation;
  decision: { route: 'FEE_PIPELINE' | 'NORMAL_CHAT' | 'CLARIFY'; confidence: number };
  result?: { profitSatang: number | null; revenueSatang?: number; marginPct?: number | null; count?: number;label?:string };
  context?:{start:string;end:string;sku:string|null};
  catalogScenario?: {at:string};
};
// Every message reaches the authorized server router. No browser keyword routing
// or financial formulas: the API owns RAG, imported-data queries and calculator.
export async function answerQuestion({ base, question, context, history = [], locale, signal }: {
  base: string; question: string; context: ChatContext; history?: RecentMessage[];
  products: CatalogProduct[]; locale: 'th' | 'en'; signal: AbortSignal;
}, api:typeof request=request): Promise<ChatReply> {
  const {marketplace,...scope}=context;
  const scenario=marketplace?marketplacePayload(marketplace):undefined;
  const answer = await api<RoutedAnswer>(base + '/assistant', {
    mode: 'chat', message: question.slice(0, 1500), history: history.slice(-5), context:scope,locale,...(scenario?{scenario}:{})
  }, signal);
  if(typeof answer.answer!=='string'||!['FEE_PIPELINE','NORMAL_CHAT','CLARIFY'].includes(answer.decision?.route))throw Error('INVALID_CHAT_ROUTING_RESPONSE');
  const effectiveContext=answer.context?{...context,...answer.context}:context;
  return {
    text: answer.answer, context:effectiveContext,...(answer.provider==='normal-chat'?{conversation:'general' as const}:{}),
    source: ['clarify', 'unavailable', 'fee-reference'].includes(answer.provider) ? 'notice' : answer.provider==='catalog-calculator'?'fallback':answer.provider === 'calculator' ? 'recorded' : 'assistant',
    note: answer.note, calculation: answer.calculation,
    ...(answer.catalogScenario?{catalogReferenceAt:answer.catalogScenario.at,catalogSummary:catalogSummary(answer.catalogScenario)}:{}),
    ...(answer.result ? { result: { ...answer.result, label: answer.result.label??(locale === 'th' ? 'ผลจากข้อมูลที่บันทึก' : 'Recorded calculation') } } : {})
  };
}
