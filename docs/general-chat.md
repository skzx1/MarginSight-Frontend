# General conversation and shop calculations

The assistant can answer general knowledge, translation, writing, code and brainstorming questions through the existing Qwen3 32B model. No training or fine-tuning was added.

## Usage

Ask a question in the same assistant screen; no product selection is needed for general conversation. Follow-up questions use up to four completed general exchanges from the current browser chat. All chat history remains viewable locally; this context window is not a usage quota.

Actual shop questions such as monthly profit, a discount or break-even keep the existing deterministic adapters and financial cards. General answers show their own AI provenance and never claim to be recorded shop amounts. Selected product, date and campaigns are not sent to the general model. General replies have no fabricated profit card or dated ledger reference.

## API contract

Use existing authorized `POST /stores/{store}/assistant` (or its existing MOCK guest equivalent) with `{ "mode": "chat", "message": "ช่วยเขียนคำทักทาย", "locale": "th", "history": [] }`. History is an alternating user/assistant array of `{role,text}`, at most eight messages, 1,500 characters each. System roles, extra keys/tools/SKU and malformed history are rejected.

The server returns `kind: STORE_DATA` without model generation for actual shop calculation requests; the web then uses its existing catalog or recorded-order path. General responses return `kind: GENERAL`, `provider: bedrock-chat`, model metadata and text. A provider failure returns an honest unavailable notice with no invented answer. Membership, guest origin/tenant binding, response escaping and normal Cognito protection remain in effect.

## Model boundary

General calls have no tools, fee retrieval, files, shop catalog, orders or live web search attached. User/history text is untrusted conversational content. Normal request deadlines, token/context sizes, AWS service quotas and the team credit budget remain; there are no daily/session usage quotas added by this feature. Generation is one call per general request, without automatic retries. Shop calculations continue to use exact integer satang/Decimal results; model-generated examples are conceptual, not verified merchant finance.

See status.md and verification.md for deployment/inference evidence and the existing external full-system blockers.
