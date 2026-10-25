// What Enter does in the assistant composer (A1 IME guard, A2 touch keyboards). Pure, so it is unit-tested.
export type ComposerKey = { key: string; shiftKey: boolean; isComposing?: boolean; keyCode?: number };
export type ComposerState = { composing: boolean; pending: boolean; coarse: boolean };
// 'send': prevent the newline and send · 'hold': prevent the newline, do nothing (a reply is pending) · 'default': let the
// browser insert the newline or commit the IME text.
export type EnterAction = 'send' | 'hold' | 'default';

export function enterAction(event: ComposerKey, { composing, pending, coarse }: ComposerState): EnterAction {
  if (event.key !== 'Enter' || event.shiftKey) return 'default';
  // Thai/CJK input: the Enter that commits a composition is not a send. WebKit can report isComposing=false for that
  // Enter, so keyCode 229 and the compositionstart/end flag are checked as well.
  if (event.isComposing || event.keyCode === 229 || composing) return 'default';
  // Touch keyboards (pointer: coarse): Enter is a newline; the visible send button sends (owner decision D4).
  if (coarse) return 'default';
  return pending ? 'hold' : 'send';
}

export const shouldSend = (event: ComposerKey, state: ComposerState) => enterAction(event, state) === 'send';
