// Focus after deleting a chat from the history list (R2 §D): the row that took the deleted row's place (the next one),
// else the previous one, else null (the caller focuses New chat). `before` is the list order the user saw when they
// asked to delete; `after` is the list as rendered now (it may be filtered differently, e.g. a re-opened sheet).
export function focusAfterDelete(before: readonly string[], deletedId: string, after: readonly string[]): string | null {
  const present = new Set(after), index = before.indexOf(deletedId);
  if (index < 0) return null;
  for (let i = index + 1; i < before.length; i++) if (present.has(before[i])) return before[i];
  for (let i = index - 1; i >= 0; i--) if (present.has(before[i])) return before[i];
  return null;
}
