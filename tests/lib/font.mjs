// Minimal TrueType/OpenType reader for font tests: name table, OS/2 weight class and cmap coverage.
// Ported from the redesign research inspector (G4 fontinfo.mjs). Lives in tests/lib/ so `tests/*.test.mjs` does not run it.
import { readFileSync } from 'node:fs';

export function readFont(path) {
  const b = readFileSync(path), u16 = o => b.readUInt16BE(o), u32 = o => b.readUInt32BE(o), i16 = o => b.readInt16BE(o);
  const tables = {};
  for (let i = 0; i < u16(4); i++) { const o = 12 + i * 16; tables[b.toString('latin1', o, o + 4)] = { off: u32(o + 8), len: u32(o + 12) }; }
  const names = {};
  if (tables.name) {
    const t = tables.name.off, count = u16(t + 2), store = t + u16(t + 4);
    for (let i = 0; i < count; i++) {
      const r = t + 6 + i * 12, pid = u16(r), eid = u16(r + 2), lid = u16(r + 4), nid = u16(r + 6), len = u16(r + 8), off = u16(r + 10);
      if (!(pid === 3 && eid === 1 && lid === 0x409)) continue;
      let s = ''; for (let k = 0; k < len; k += 2) s += String.fromCharCode(u16(store + off + k));
      names[nid] = s;
    }
  }
  const codepoints = new Set();
  if (tables.cmap) {
    const t = tables.cmap.off; let best = null;
    for (let i = 0; i < u16(t + 2); i++) {
      const pid = u16(t + 4 + i * 8), off = u32(t + 8 + i * 8), fmt = u16(t + off);
      if (fmt === 12 && best?.fmt !== 12) best = { off: t + off, fmt };
      else if (fmt === 4 && !best && (pid === 3 || pid === 0)) best = { off: t + off, fmt };
    }
    if (best?.fmt === 4) {
      const o = best.off, seg = u16(o + 6) / 2;
      for (let s = 0; s < seg; s++) {
        const end = u16(o + 14 + s * 2), start = u16(o + 16 + seg * 2 + s * 2), delta = i16(o + 16 + seg * 4 + s * 2), roOff = o + 16 + seg * 6 + s * 2, ro = u16(roOff);
        for (let c = start; c <= end && c !== 0xFFFF; c++) {
          let g; if (ro === 0) g = (c + delta) & 0xFFFF; else { g = u16(roOff + ro + (c - start) * 2); if (g) g = (g + delta) & 0xFFFF; }
          if (g) codepoints.add(c);
        }
      }
    } else if (best?.fmt === 12) {
      const o = best.off;
      for (let g = 0; g < u32(o + 12); g++) for (let c = u32(o + 16 + g * 12); c <= u32(o + 20 + g * 12); c++) codepoints.add(c);
    }
  }
  return { bytes: b.length, family: names[16] ?? names[1], subfamily: names[17] ?? names[2], version: names[5], weightClass: tables['OS/2'] ? u16(tables['OS/2'].off + 4) : null, variable: !!tables.fvar, codepoints };
}

/** The 87 assigned Thai code points: U+0E01-0E3A and U+0E3F-0E5B. */
export const THAI = [...Array(0x0E3A - 0x0E01 + 1).keys()].map(i => 0x0E01 + i).concat([...Array(0x0E5B - 0x0E3F + 1).keys()].map(i => 0x0E3F + i));
