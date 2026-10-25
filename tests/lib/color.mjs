// Colour math for token tests: WCAG 2.x contrast, CIELAB/CIEDE2000, OKLab, Machado 2009 CVD simulation.
// Ported from the redesign research checker (G4 colorlib.mjs). Lives in tests/lib/ so `tests/*.test.mjs` does not run it.
// ---------- sRGB ----------
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = c => '#' + c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const toLin = (c, thr = 0.04045) => (c <= thr ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const lin = (h, thr) => hex2rgb(h).map(c => toLin(c, thr));
const Y = (h, thr) => { const [r, g, b] = lin(h, thr); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b, thr) => { const [x, y] = [Y(a, thr), Y(b, thr)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// sRGB-space mix (what color-mix(in srgb) and alpha compositing do)
const mix = (fg, pct, bg) => rgb2hex(hex2rgb(fg).map((v, i) => v * pct + hex2rgb(bg)[i] * (1 - pct)));

// ---------- CIELAB (D65, 2deg) ----------
const M = [[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]];
const WP = [0.95047, 1.0, 1.08883];
const linToLab = l => {
  const xyz = M.map(r => r[0] * l[0] + r[1] * l[1] + r[2] * l[2]);
  const e = 216 / 24389, k = 24389 / 27;
  const f = xyz.map((v, i) => { const t = v / WP[i]; return t > e ? Math.cbrt(t) : (k * t + 16) / 116; });
  return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
};
const lab = h => linToLab(lin(h));
const de76 = (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
// CIEDE2000 (Sharma, Wu, Dalal 2005), kL=kC=kH=1
function de2000(L1, L2) {
  const [l1, a1, b1] = L1, [l2, a2, b2] = L2, rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b, a) => { if (a === 0 && b === 0) return 0; const h = Math.atan2(b, a) / rad; return h < 0 ? h + 360 : h; };
  const h1 = hp(b1, ap1), h2 = hp(b2, ap2);
  const dL = l2 - l1, dC = Cp2 - Cp1;
  let dh = 0; if (Cp1 * Cp2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh / 2 * rad);
  const Lb = (l1 + l2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb = h1 + h2; if (Cp1 * Cp2 !== 0) { if (Math.abs(h1 - h2) > 180) hb += (h1 + h2 < 360 ? 360 : -360); hb /= 2; }
  const Tt = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.20 * Math.cos((4 * hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7));
  const Sl = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), Sc = 1 + 0.045 * Cpb, Sh = 1 + 0.015 * Cpb * Tt;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}
// OKLab (Ottosson 2020) from linear sRGB
const linToOk = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
};
const ok = h => linToOk(lin(h));
const dOk = (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
const lch = ([L, a, b]) => [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360];

// ---------- CVD simulation (linear RGB, clipped) ----------
const CVD = {
  'protan(Machado09,s=1)': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  'deutan(Machado09,s=1)': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  'tritan(Machado09,s=1)': [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
  'protan(Vienot99)': [[0.11238, 0.88762, 0.0], [0.11238, 0.88762, 0.0], [0.00401, -0.00401, 1.0]],
  'deutan(Vienot99)': [[0.29275, 0.70725, 0.0], [0.29275, 0.70725, 0.0], [-0.02234, 0.02234, 1.0]],
};
const sim = (h, m) => { const l = lin(h); return rgb2hex(m.map(r => toGam(Math.min(1, Math.max(0, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))))); };
export { hex2rgb, rgb2hex, lin, Y, cr, mix, lab, de76, de2000, ok, dOk, lch, CVD, sim, toGam, toLin };
