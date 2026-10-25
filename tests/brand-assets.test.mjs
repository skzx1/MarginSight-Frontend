import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readRootProperties, resolve } from './lib/css.mjs';

// Brand surfaces (P5 a): the favicon is the app icon artwork, the browser theme colour is the canvas token,
// and every public asset that web/src points at exists. No snapshots of the artwork itself.
const SRC = 'web/src';
const PUBLIC = 'web/public';
const ICON = 'branding/marginshot-icon.svg';
const read = path => readFileSync(path, 'utf8');
const layout = read(join(SRC, 'app/layout.tsx'));

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const sources = walk(SRC).map(path => path.replaceAll('\\', '/'))
  .filter(path => /\.(css|tsx|ts)$/.test(path) && !/(^|\/)domain\.generated\./.test(path) && !path.endsWith('.d.ts'));
const publicFile = path => { const file = join(PUBLIC, path.replace(/^\//, '')); return existsSync(file) && statSync(file).isFile(); };

test('the favicon is the same artwork as the app icon used by Brand', () => {
  const icons = layout.match(/icons\s*:\s*\{\s*icon\s*:\s*'([^']+)'/);
  assert.ok(icons, 'layout.tsx metadata declares icons.icon');
  assert.equal(icons[1], '/favicon.svg');
  assert.ok(publicFile(icons[1]), 'web/public/favicon.svg exists');
  assert.ok(read(join(SRC, 'app/ui.tsx')).includes(`src="/${ICON}"`), 'Brand renders the app icon');
  assert.ok(readFileSync(join(PUBLIC, 'favicon.svg')).equals(readFileSync(join(PUBLIC, ICON))), 'favicon.svg is byte-identical to ' + ICON);
});

test('viewport themeColor equals the canvas token', () => {
  const theme = layout.match(/themeColor\s*:\s*'(#[0-9a-fA-F]{3,8})'/);
  assert.ok(theme, 'layout.tsx viewport declares a themeColor string');
  const props = readRootProperties(join(SRC, 'app/tokens.css'));
  const canvas = resolve(props, 'var(--color-bg-canvas)').trim();
  assert.match(canvas, /^#[0-9a-f]{3,8}$/i);
  assert.equal(theme[1].toLowerCase(), canvas.toLowerCase());
});

// Static references: quoted root paths with a file extension (src="/…", href="/…", '/…') and CSS url(/…).
const STATIC = /(['"`])(\/[\w./-]+\.(?:svg|png|jpe?g|webp|gif|ico|css|csv|xlsx|ttf|woff2?))\1/g;
const CSS_URL = /url\(\s*['"]?(\/[^)'"\s]+)['"]?\s*\)/g;
// Template references such as `/assets/images/${channel}.png`.
const TEMPLATE = /`(\/[\w./-]*\/)\$\{([^}]+)\}([\w.-]*)`/g;

test('every public asset referenced from web/src exists under web/public', () => {
  const missing = [], seen = new Set();
  for (const path of sources) {
    const text = read(path);
    const refs = [...text.matchAll(STATIC)].map(m => m[2]);
    if (path.endsWith('.css')) refs.push(...[...text.matchAll(CSS_URL)].map(m => m[1]));
    for (const ref of refs) { seen.add(ref); if (!publicFile(ref)) missing.push(`${path}: ${ref}`); }
  }
  assert.deepEqual(missing, []);
  for (const ref of ['/favicon.svg', '/' + ICON, '/fonts/fonts.css']) assert.ok(seen.has(ref), 'scan found ' + ref);
});

test('dynamic image references resolve for every listed channel', () => {
  const missing = [];
  let checked = 0;
  for (const path of sources) {
    const text = read(path);
    for (const [, dir, expression, suffix] of text.matchAll(TEMPLATE)) {
      assert.ok(existsSync(join(PUBLIC, dir)), `${path}: directory ${dir} exists`);
      // Names come from the file's own data: `image: 'x.png'` entries, or a `const channels = [...]` list.
      const names = /\.image$/.test(expression.trim())
        ? [...text.matchAll(/image\s*:\s*'([^']+)'/g)].map(m => m[1])
        : [...(text.match(new RegExp(`const\\s+${expression.trim()}s\\s*=\\s*\\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
      assert.ok(names.length, `${path}: values for \${${expression}} found`);
      for (const name of names) { checked++; if (!publicFile(dir + name + suffix)) missing.push(`${path}: ${dir}${name}${suffix}`); }
    }
  }
  assert.deepEqual(missing, []);
  assert.ok(checked >= 4, 'at least the four channel images are checked');
});
