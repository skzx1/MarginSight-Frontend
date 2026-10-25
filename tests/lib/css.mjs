// Minimal CSS helpers for token tests: read :root custom properties and resolve var() chains.
// Lives in tests/lib/ so `tests/*.test.mjs` does not run it.
import { readFileSync } from 'node:fs';

export const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Custom properties declared in every top-level `:root{...}` block, last declaration wins.
export function rootProperties(css) {
  const props = new Map();
  for (const block of stripComments(css).matchAll(/(^|})\s*:root\s*\{([^}]*)\}/g)) {
    for (const decl of block[2].split(';')) {
      const match = decl.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]*?)\s*$/);
      if (match) props.set(match[1], match[2]);
    }
  }
  return props;
}

export const readRootProperties = path => rootProperties(readFileSync(path, 'utf8'));

// Replace every var(--name[, fallback]) with its resolved value. Throws on unknown names without a fallback and on cycles.
export function resolve(props, value, seen = []) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const start = value.indexOf('var(', i);
    if (start < 0) { out += value.slice(i); break; }
    out += value.slice(i, start);
    let depth = 0;
    let end = start + 3;
    for (; end < value.length; end++) {
      if (value[end] === '(') depth++;
      else if (value[end] === ')' && --depth === 0) break;
    }
    if (depth !== 0) throw new Error(`Unbalanced var() in: ${value}`);
    const inner = value.slice(start + 4, end);
    const comma = inner.indexOf(',');
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
    const fallback = comma < 0 ? null : inner.slice(comma + 1).trim();
    if (seen.includes(name)) throw new Error(`Cycle: ${[...seen, name].join(' -> ')}`);
    if (props.has(name)) out += resolve(props, props.get(name), [...seen, name]);
    else if (fallback != null) out += resolve(props, fallback, seen);
    else throw new Error(`Unknown custom property ${name}${seen.length ? ` (via ${seen.join(' -> ')})` : ''}`);
    i = end + 1;
  }
  return out.trim();
}

export const resolveProperty = (props, name) => resolve(props, `var(${name})`);
