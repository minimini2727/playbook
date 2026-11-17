/* =========================================================
   Proposal Studio — 슬라이드 렌더러 (HTML 미리보기 = PPT = PDF 동일 좌표계 1280×720)
   · 텍스트는 캔버스로 실측해 줄바꿈을 미리 확정 → PPT에서도 같은 위치에서 줄이 바뀜
   · 박스보다 길면 글자 크기를 자동 축소 (잘림 방지)
   ========================================================= */
const W = 1280, H = 720, MX = 64;
const SP = {titleY: 86, titleH: 46, subY: 140, subH: 26, bodyY: 196, bodyEnd: 640, keyY: 596, keyH: 50, inner: 6};
let EXPORTING = false;
const R = (x, y, w, h, fill, o = {}) => ({k: 'r', x, y, w, h, fill, ...o});
const EL = (x, y, w, h, fill, o = {}) => ({k: 'e', x, y, w, h, fill, ...o});
const SH = (shape, x, y, w, h, fill, o = {}) => ({k: 's', shape, x, y, w, h, fill, ...o});
const T = (x, y, w, h, text, o = {}) => ({k: 't', x, y, w, h, text: String(text ?? ''), size: 16, color: '#111111', align: 'left', valign: 'top', lh: 1.4, ...o});
const IM = (x, y, w, h, data, o = {}) => ({k: 'i', x, y, w, h, data, ...o});

/* ---------- 텍스트 실측·줄바꿈 ---------- */
const MCTX = document.createElement('canvas').getContext('2d'); const MC = new Map();
const LS_EM = -0.02; // 자간 -2% (HTML·PPT 동일 적용)
function mw(s, size, wt){ const k = wt + '|' + s; let w = MC.get(k); if (w == null){ MCTX.font = `${wt} 100px Pretendard, 'Apple SD Gothic Neo', sans-serif`; w = MCTX.measureText(s).width / 100 + LS_EM * [...s].length; if (MC.size > 30000) MC.clear(); MC.set(k, w); } return w * size; }
function wrapPara(p, size, wt, w){
  if (!p) return [''];
  const out = []; let line = '';
  for (const t of p.split(' ')){
    const cand = line ? line + ' ' + t : t;
    if (mw(cand, size, wt) <= w){ line = cand; continue; }
    if (line) out.push(line);
    if (mw(t, size, wt) <= w){ line = t; continue; }
    let chunk = ''; for (const ch of t){ if (mw(chunk + ch, size, wt) > w && chunk){ out.push(chunk); chunk = ch; } else chunk += ch; } line = chunk;
  }
  out.push(line); return out;
}
const WT = e => e.bold ? 700 : e.light ? 300 : (e.wt || 400);
function layoutText(text, size, wt, w){ const paras = String(text ?? '').split('\n').map(p => wrapPara(p, size, wt, w * .97)); return paras; }
const PARA_GAP = .32;
function textHeight(paras, size, lh){ const n = paras.reduce((a, p) => a + p.length, 0); return n * size * lh + Math.max(0, paras.length - 1) * size * PARA_GAP; }
function tH(text, size, w, lh = 1.4, wt = 500){ if (!text) return 0; return Math.ceil(textHeight(layoutText(text, size, wt, w), size, lh)); }
function prepText(e){ // 박스에 맞춰 크기 확정
  let size = e.size, paras = layoutText(e.text, size, WT(e), e.w);
  const min = e.size * (e.minScale || .62);
  while (textHeight(paras, size, e.lh) > e.h * 1.02 && size > min){ size = Math.max(min, size * .94); paras = layoutText(e.text, size, WT(e), e.w); }
  return {size, paras};
}

function fitBox(nw, nh, x, y, w, h){ if (!nw || !nh) return {x, y, w, h}; const s = Math.min(w / nw, h / nh); const ww = nw * s, hh = nh * s; return {x: x + (w - ww) / 2, y: y + (h - hh) / 2, w: ww, h: hh}; }
const itemsOf = pg => (pg.items || []).filter(i => (i.h || i.d || i.v));
const pct = v => { const m = String(v || '').match(/-?[\d.]+/); return m ? parseFloat(m[0]) : 0; };
const isNum = v => /\d/.test(v || '') && !/^\[/.test(v || '');
const lines = s => String(s || '').split('\n').map(x => x.replace(/^\s*(\d+[).]|[-•·])\s*/, '').trim()).filter(Boolean);

/* ---------- 로고·공통 크롬 ---------- */
function logoFor(dark){
  const tp = S.template;
  if (tp.logo) return {data: tp.logo, w: tp.logoW, h: tp.logoH};
  if (tp.useDefaultLogo !== false && window.MADUP_LOGO) return {data: dark && onC(dark) === '#FFFFFF' ? MADUP_LOGO.white : MADUP_LOGO.color, w: MADUP_LOGO.w, h: MADUP_LOGO.h};
  return null;
}
function chromeMadup(E, it, P, dark){
  const lg = logoFor('#000000');
  if (lg){ const b = fitBox(lg.w, lg.h, W - MX - 96, 670, 96, 15); E.push(IM(W - MX - b.w, b.y, b.w, b.h, lg.data)); }
  else E.push(T(W - MX - 140, 668, 140, 18, S.template.footer || 'MADUP', {size: 13, bold: true, color: '#FFFFFF', align: 'right'}));
  if (!S.template.logo) E.push(T(W - MX - 200, 688, 200, 10, 'FOR YOUR INNOVATIVE GROWTH', {size: 6.5, bold: true, color: '#FFFFFF', align: 'right', ls: .6, alpha: .9}));
  if (it.label && !dark) E.push(T(W - MX - 420, 30, 420, 14, it.label.toUpperCase(), {size: 8.5, bold: true, color: '#8C8C8C', align: 'right', ls: .6}));
  if (it.no) E.push(T(MX, 690, 60, 12, two(it.no), {size: 8.5, bold: true, color: dark ? '#FFFFFF' : '#8C8C8C', alpha: dark ? .6 : 1}));
}
function chrome(E, it, P, dark, opts = {}){
  if (P.madup) return chromeMadup(E, it, P, dark);
  const tp = S.template, fg = dark ? onC(dark) : '#111111', pos = tp.logoPos || 'tr', lh = 20, lw = 128;
  const lx = pos.includes('l') ? MX : W - MX - lw, ly = pos.includes('t') ? 32 : H - 30 - lh;
  const lg = logoFor(dark || (opts.logoOn ? opts.logoOn : null));
  if (lg){ const b = fitBox(lg.w, lg.h, lx, ly, lw, lh); E.push(IM(pos.includes('r') ? W - MX - b.w : MX, b.y, b.w, b.h, lg.data)); }
  else E.push(T(lx, ly, lw, lh, tp.footer || 'MADUP', {size: 14, bold: true, color: dark ? fg : (opts.labelOn || P.ink), align: pos.includes('r') ? 'right' : 'left', valign: 'middle'}));
  if (it.label && !dark){ const labX = pos === 'tl' ? MX + 150 : MX; E.push(T(labX, 34, 760, 18, it.label, {size: 11, bold: true, color: opts.labelOn || P.ink, valign: 'middle', ls: .4})); }
  const fy = H - 30, subC = dark ? fg : '#98A2B3';
  if (pos !== 'bl') E.push(T(MX, fy, 640, 14, `${S.project.client || ''}${S.project.client ? '  |  ' : ''}${S.project.name || 'Performance Marketing Proposal'}`, {size: 9.5, light: true, color: subC, alpha: dark ? .7 : 1}));
  if (it.no && pos !== 'br') E.push(T(W - MX - 80, fy, 80, 14, two(it.no), {size: 10, bold: true, color: dark ? fg : P.ink, align: 'right', alpha: dark ? .8 : 1}));
}

/* ---------- 본문 세로 균형: 내용이 짧아 아래가 비면 본문 묶음을 시각적 중앙으로 ---------- */
function bodyBottom(e){
  if (e.k !== 't') return e.y + e.h;
  const {size, paras} = prepText(e), th = Math.min(e.h, textHeight(paras, size, e.lh));
  return e.valign === 'middle' ? e.y + (e.h + th) / 2 : e.valign === 'bottom' ? e.y + e.h : e.y + th;
}
function balanceBody(E, i0, box, layout){
  if (['image', 'quote', 'hero', 'cycle', 'hub', 'venn'].includes(layout)) return;
  const els = E.slice(i0); if (!els.length) return;
  const bot = Math.max(...els.map(bodyBottom)), gap = box.y + box.h - bot;
  if (gap < 70) return;
  const dy = Math.round(gap * .42);
  els.forEach(e => { e.y += dy; });
}

/* ---------- 본문 레이아웃 (box = {x,y,w,h}) ---------- */
function rowsFit(items, b, measure, gap, maxExtra = 18){
  for (const scale of [1.22, 1.15, 1.1, 1.05, 1, .93, .86, .8]){
    const hs = items.map(i => measure(i, scale)); const tot = hs.reduce((a, c) => a + c, 0) + gap * (items.length - 1);
    if (tot <= b.h || scale === .8){ const slack = Math.max(0, b.h - tot); return {hs, scale, gapX: items.length > 1 ? Math.min(maxExtra, slack / (items.length - 1) * .6) : 0}; }
  }
}
const NUM = (x, y, n, P, o = {}) => [EL(x, y, o.d || 28, o.d || 28, o.fill || P.c1), T(x, y, o.d || 28, o.d || 28, String(n), {size: o.size || 12.5, bold: true, color: onC(o.fill || P.c1), align: 'center', valign: 'middle', lh: 1})];
const LAY = {
  list(E, items, b, P){
    const hasV = items.some(i => i.v), vw = hasV ? 190 : 0, tw = b.w - 30 - vw;
    const {hs, scale, gapX} = rowsFit(items, b, (i, s) => (i.h ? tH(i.h, 18.5 * s, tw, 1.3, 700) + SP.inner : 0) + tH(i.d, 15.5 * s, tw, 1.5, 300), 22);
    let y = b.y;
    items.forEach((it, k) => {
      E.push(R(b.x, y + 7, 4, 16, P.c1, {r: 2}));
      let yy = y;
      if (it.h){ const hh = tH(it.h, 18.5 * scale, tw, 1.3, 700); E.push(T(b.x + 22, yy, tw, hh, it.h, {size: 18.5 * scale, bold: true, lh: 1.3})); yy += hh + SP.inner; }
      if (it.d) E.push(T(b.x + 22, yy, tw, tH(it.d, 15.5 * scale, tw, 1.5, 300), it.d, {size: 15.5 * scale, light: true, color: '#475467', lh: 1.5}));
      if (hasV && it.v) E.push(T(b.x + b.w - vw, y, vw, 28, it.v, {size: 20 * scale, bold: true, color: P.ink, align: 'right'}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(b.x + 22, y + 10 + gapX / 2, b.w - 22, 1, '#EAECF0')); y += 22 + gapX; }
    });
  },
  cards(E, items, b, P){
    const n = items.length || 1, cols = n <= 4 ? n : 3, rows = Math.min(2, Math.ceil(n / cols));
    const g = 18, cw = (b.w - (cols - 1) * g) / cols, pad = 26, iw = cw - pad * 2;
    const need = items.slice(0, cols * rows).map(it => 22 + 16 + (it.v ? tH(it.v, 28, iw, 1.2, 700) + 8 : 0) + tH(it.h, 19, iw, 1.3, 700) + 10 + tH(it.d, 14.5, iw, 1.55, 300));
    const ch = rows > 1 ? (b.h - g) / 2 : Math.min(b.h, Math.max(b.h * .58, Math.max(...need) * 1.22 + pad * 2 + 10));
    const sc = rows > 1 ? 1 : Math.min(1.22, Math.max(1, (ch - pad * 2 - 10) / Math.max(1, ...need)));
    items.slice(0, cols * rows).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, '#FFFFFF', {r: 14, line: P.draft ? '#E4E4E4' : P.tint2}));
      let yy = y + pad;
      E.push(T(x + pad, yy, 60, 22, two(i + 1), {size: 14, bold: true, color: P.c3 === P.c1 ? P.ink : P.ink}));
      E.push(R(x + pad + 30, yy + 10, iw - 30, 1, P.draft ? '#E4E4E4' : P.tint2)); yy += 22 + 16;
      if (it.v){ const vh = tH(it.v, 28 * sc, iw, 1.2, 700); E.push(T(x + pad, yy, iw, vh, it.v, {size: 28 * sc, bold: true, color: P.ink, lh: 1.2})); yy += vh + 8; }
      const hh = tH(it.h, 19 * sc, iw, 1.3, 700); E.push(T(x + pad, yy, iw, hh, it.h, {size: 19 * sc, bold: true, lh: 1.3})); yy += hh + 10;
      E.push(T(x + pad, yy, iw, y + ch - yy - pad + 4, it.d, {size: 14.5 * sc, light: true, color: '#475467', lh: 1.55}));
    });
  },
  process(E, items, b, P){
    const n = Math.min(6, items.length || 1), g = 12, sw = (b.w - (n - 1) * g) / n;
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + i * (sw + g), fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .12) : mix(P.c1, P.c2, n > 1 ? i / (n - 1) * .75 : 0);
      E.push(SH(i === 0 ? 'home' : 'chevron', x - (i ? 10 : 0), b.y, sw + (i ? 10 : 0) + (i < n - 1 ? 14 : 0), 66, fill));
      E.push(T(x + (i ? 22 : 18), b.y, sw - 40, 66, it.h, {size: 15.5, bold: true, color: onC(fill), valign: 'middle', lh: 1.25}));
      let yy = b.y + 66 + 22;
      E.push(T(x + 2, yy, 60, 16, `STEP ${two(i + 1)}`, {size: 10.5, bold: true, color: P.ink, ls: .5})); yy += 24;
      if (it.v){ E.push(T(x + 2, yy, sw - 10, 30, it.v, {size: 19, bold: true, color: P.ink})); yy += 36; }
      E.push(T(x + 2, yy, sw - 10, b.y + b.h - yy, it.d, {size: 14, light: true, color: '#475467', lh: 1.55}));
    });
  },
  kpi(E, items, b, P){
    const n = Math.min(4, items.length || 1), cw = b.w / n;
    const maxD = Math.max(...items.slice(0, 4).map(i => tH(i.d, 14.5, cw - 56, 1.5, 300)));
    const h = Math.min(b.h, Math.max(290, 170 + maxD + 30));
    E.push(R(b.x, b.y, b.w, h, P.draft ? '#F7F7F7' : P.tint, {r: 16}));
    items.slice(0, 4).forEach((it, i) => {
      const x = b.x + i * cw;
      if (i) E.push(R(x, b.y + 28, 1, h - 56, P.draft ? '#DDDDDD' : P.tint2));
      E.push(T(x + 30, b.y + 30, cw - 60, 60, it.v || '-', {size: 44, bold: true, color: P.ink, lh: 1.2, valign: 'middle', minScale: .5}));
      E.push(T(x + 30, b.y + 106, cw - 60, 26, it.h, {size: 17.5, bold: true, lh: 1.3}));
      E.push(T(x + 30, b.y + 140, cw - 60, h - 160, it.d, {size: 14.5, light: true, color: '#475467', lh: 1.5}));
    });
  },
  hero(E, items, b, P, pg){
    const f = items[0] || {}, rest = items.slice(1), lw = rest.length ? Math.min(500, b.w * .42) : b.w;
    E.push(T(b.x, b.y + 4, lw, 104, f.v || pg.keyMsg || '', {size: 80, bold: true, color: P.ink, lh: 1.1, minScale: .45}));
    E.push(R(b.x, b.y + 128, 36, 3, P.c3));
    const hh = tH(f.h, 22, lw - 20, 1.3, 700);
    E.push(T(b.x, b.y + 146, lw - 20, hh, f.h, {size: 22, bold: true, lh: 1.3}));
    E.push(T(b.x, b.y + 156 + hh, lw - 30, b.h - 170 - hh, f.d, {size: 15.5, light: true, color: '#475467', lh: 1.55}));
    if (!rest.length) return;
    const rx = b.x + lw + 44, rw = b.w - lw - 44;
    E.push(R(rx - 22, b.y, 1, b.h, '#EAECF0'));
    LAY.list(E, rest, {x: rx, y: b.y + 4, w: rw, h: b.h - 4}, P);
  },
  split(E, items, b, P, pg){
    const lw = Math.min(380, b.w * .34), fill = P.draft ? '#3A3A3A' : P.c1;
    E.push(R(b.x, b.y, lw, b.h, fill, {r: 16}));
    E.push(T(b.x + 32, b.y + 34, lw - 64, 16, 'KEY MESSAGE', {size: 10.5, bold: true, color: onC(fill), alpha: .65, ls: .8}));
    E.push(T(b.x + 32, b.y + 62, lw - 64, b.h - 96, pg.keyMsg || pg.subtitle || pg.title, {size: 24, bold: true, color: onC(fill), lh: 1.45}));
    const rx = b.x + lw + 40, rw = b.w - lw - 40, tw = rw - 48;
    const {hs, scale, gapX} = rowsFit(items, {h: b.h}, (i, s) => tH(i.h, 18.5 * s, tw, 1.3, 700) + SP.inner + tH(i.d, 15 * s, tw, 1.5, 300), 22);
    let y = b.y + 6;
    items.forEach((it, k) => {
      E.push(...NUM(rx, y, k + 1, P, {d: 26, size: 11.5, fill: P.draft ? '#3A3A3A' : P.c1}));
      const hh = tH(it.h, 18.5 * scale, tw, 1.3, 700);
      E.push(T(rx + 44, y + 1, tw, hh, it.h + (it.v ? `  ${it.v}` : ''), {size: 18.5 * scale, bold: true, lh: 1.3}));
      E.push(T(rx + 44, y + hh + SP.inner, tw, hs[k] - hh - SP.inner + 4, it.d, {size: 15 * scale, light: true, color: '#475467', lh: 1.5}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(rx + 44, y + 10 + gapX / 2, tw, 1, '#EAECF0')); y += 22 + gapX; }
    });
  },
  spec(E, items, b, P, pg){
    const lw = 286, fill = P.draft ? '#3A3A3A' : P.c1, fg = onC(fill);
    E.push(R(b.x, b.y, lw, b.h, fill, {r: 16}));
    E.push(T(b.x + 28, b.y + 30, lw - 56, 14, pg.tag || 'ROLE', {size: 10.5, bold: true, color: fg, alpha: .65, ls: .8}));
    E.push(T(b.x + 28, b.y + 56, lw - 56, b.h - 84, pg.keyMsg || pg.subtitle || '', {size: 21, bold: true, color: fg, lh: 1.45}));
    const rx = b.x + lw + 34, rw = b.w - lw - 34, lab = 104, tw = rw - lab - 18;
    const {hs, scale, gapX} = rowsFit(items, {h: b.h - 6}, (i, s) => Math.max(22, tH(i.d, 15 * s, tw, 1.5, 300)) + (i.v ? 24 : 0), 20, 14);
    let y = b.y + 2;
    items.forEach((it, k) => {
      E.push(T(rx, y + 1, lab, 20, it.h, {size: 13.5, bold: true, color: P.ink, lh: 1.5}));
      E.push(T(rx + lab + 18, y, tw, hs[k], it.d + (it.v ? `\n${it.v}` : ''), {size: 15 * scale, light: true, color: '#1D2939', lh: 1.5}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(rx, y + 9 + gapX / 2, rw, 1, '#EAECF0')); y += 20 + gapX; }
    });
  },
  table(E, items, b, P, pg){
    const hasV = items.some(i => i.v), hdr = 40, c1w = Math.min(250, b.w * .23), c3w = hasV ? Math.min(210, b.w * .19) : 0, c2w = b.w - c1w - c3w;
    const hf = P.draft ? '#3A3A3A' : P.c1;
    const hs0 = items.map(i => Math.max(tH(i.h, 15.5, c1w - 36, 1.35, 700), tH(i.d, 14.5, c2w - 36, 1.5, 300), tH(i.v, 14.5, c3w - 30, 1.35, 700)) + 24);
    const tot = hs0.reduce((a, c) => a + c, 0), sc = tot > b.h - hdr ? (b.h - hdr) / tot : 1;
    const fill = Math.min(items.length <= 3 ? 150 : 96, (b.h - hdr) / Math.max(1, items.length) * .9);
    const grow = sc < 1 ? 1 : Math.min(1.18, Math.max(1, fill / Math.max(...hs0) * .8));
    const hs = hs0.map(h => Math.max(34, sc < 1 ? h * sc : Math.max(h * grow, fill))), fs = sc < 1 ? Math.max(.8, sc) : grow;
    const head = pg.cols || ['구분', '내용', '비고'];
    const filled = P.madup, hc = filled ? '#FFFFFF' : P.ink;
    if (filled) E.push(R(b.x, b.y, b.w, hdr - 4, hf, {r: 2})); else E.push(R(b.x, b.y + hdr - 2, b.w, 2, hf));
    E.push(T(b.x + (filled ? 16 : 4), b.y, c1w - 24, hdr - 4, head[0], {size: 13, bold: true, color: hc, valign: 'middle'}));
    E.push(T(b.x + c1w + 18, b.y, c2w - 24, hdr - 4, head[1], {size: 13, bold: true, color: hc, valign: 'middle'}));
    if (hasV) E.push(T(b.x + c1w + c2w + 14, b.y, c3w - 20, hdr - 4, head[2] || '', {size: 13, bold: true, color: hc, valign: 'middle'}));
    let y = b.y + hdr;
    items.forEach((it, i) => {
      const rh = hs[i];
      if (i % 2) E.push(R(b.x, y, b.w, rh, P.draft ? '#F7F7F7' : P.tint));
      E.push(T(b.x + (P.madup ? 16 : 4), y, c1w - 28, rh, it.h, {size: 15.5 * fs, bold: true, valign: 'middle', lh: 1.35}));
      E.push(T(b.x + c1w + 18, y, c2w - 32, rh, it.d, {size: 14.5 * fs, light: true, color: '#344054', valign: 'middle', lh: 1.5}));
      if (hasV) E.push(T(b.x + c1w + c2w + 14, y, c3w - 22, rh, it.v, {size: 14.5 * fs, bold: true, color: P.ink, valign: 'middle', lh: 1.35}));
      y += rh; E.push(R(b.x, y - 1, b.w, 1, '#EAECF0'));
    });
  },
  compare(E, items, b, P){
    const lab = 190, g = 40, cw = (b.w - lab - g) / 2, hdr = 38;
    const hs0 = items.map(i => Math.max(tH(i.h, 15.5, lab - 20, 1.35, 700), tH(i.v, 14.5, cw - 40, 1.5, 300), tH(i.d, 14.5, cw - 40, 1.5, 400)) + 26);
    const tot = hs0.reduce((a, c) => a + c, 0), sc = tot > b.h - hdr - 8 ? (b.h - hdr - 8) / tot : 1, hs = hs0.map(h => h * sc);
    const ax = b.x + lab, bx = ax + cw + g, cf = P.draft ? '#3A3A3A' : P.c1;
    E.push(T(ax, b.y, cw, hdr, 'AS-IS', {size: 13, bold: true, color: '#667085', align: 'center', valign: 'middle', ls: 1.5}));
    E.push(R(ax, b.y + hdr - 2, cw, 2, '#D0D5DD'));
    E.push(T(bx, b.y, cw, hdr, 'TO-BE', {size: 13, bold: true, color: P.ink, align: 'center', valign: 'middle', ls: 1.5}));
    E.push(R(bx, b.y + hdr - 2, cw, 2, cf));
    let y = b.y + hdr + 8;
    items.forEach((it, i) => {
      const rh = hs[i];
      E.push(T(b.x, y, lab - 16, rh, it.h, {size: 15.5, bold: true, valign: 'middle', lh: 1.35}));
      E.push(R(ax, y + 4, cw, rh - 8, '#F2F4F7', {r: 10}));
      E.push(T(ax + 20, y + 4, cw - 40, rh - 8, it.v || '-', {size: 14.5, light: true, color: '#667085', valign: 'middle', lh: 1.5}));
      E.push(SH('arrow', ax + cw + 10, y + rh / 2 - 8, g - 20, 16, P.c3));
      E.push(R(bx, y + 4, cw, rh - 8, P.draft ? '#EFEFEF' : P.tint, {r: 10}));
      E.push(T(bx + 20, y + 4, cw - 40, rh - 8, it.d, {size: 14.5, color: '#101828', valign: 'middle', lh: 1.5}));
      y += rh;
    });
  },
  funnel(E, items, b, P){
    const n = Math.min(5, items.length || 1), g = 8, rh = Math.min(100, (b.h - (n - 1) * g) / n), fw = Math.min(520, b.w * .46);
    items.slice(0, 5).forEach((it, i) => {
      const inset = fw * .16 / Math.max(1, n - 1), w0 = fw - i * inset * 2, x = b.x + (fw - w0) / 2, y = b.y + i * (rh + g);
      const fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .15) : mix(P.c1, P.c2, n > 1 ? i / (n - 1) * .85 : 0);
      E.push(SH('trap-down', x, y, w0, rh, fill, {inset}));
      E.push(T(x + inset + 10, y, w0 - inset * 2 - 20, rh, it.h, {size: 17, bold: true, color: onC(fill), valign: 'middle', align: 'center', lh: 1.3}));
      const dx = b.x + fw + 40, dw = b.w - fw - 40;
      E.push(R(b.x + fw - inset * i + 6, y + rh / 2, dx - (b.x + fw - inset * i + 6) - 12, 1, '#D0D5DD'));
      E.push(EL(dx - 12, y + rh / 2 - 4, 8, 8, P.c3));
      if (it.v) E.push(T(dx + 6, y + 8, dw - 6, 20, it.v, {size: 12.5, bold: true, color: P.ink, ls: .3}));
      E.push(T(dx + 6, y + (it.v ? 32 : 0), dw - 6, rh - (it.v ? 32 : 0), it.d, {size: 14.5, light: true, color: '#344054', valign: it.v ? 'top' : 'middle', lh: 1.45}));
    });
  },
  timeline(E, items, b, P){
    const n = Math.min(6, items.length || 1), cw = b.w / n, ly = b.y + 64;
    E.push(R(b.x, ly + 7, b.w, 2, P.draft ? '#D0D0D0' : P.tint2));
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + i * cw;
      E.push(T(x, b.y, cw - 16, 46, it.h, {size: 18, bold: true, color: P.ink, valign: 'bottom', lh: 1.25}));
      E.push(EL(x, ly, 16, 16, '#FFFFFF', {line: i === 0 ? P.c3 : P.c1, lw: 3}));
      let yy = ly + 34;
      if (it.v){ const vh = tH(it.v, 12.5, cw - 44, 1.35, 700) + 12; E.push(R(x, yy, cw - 22, vh, P.draft ? '#F0F0F0' : P.tint, {r: 6})); E.push(T(x + 11, yy + 6, cw - 44, vh - 12, it.v, {size: 12.5, bold: true, color: P.ink, lh: 1.35})); yy += vh + 12; }
      E.push(T(x, yy, cw - 22, b.y + b.h - yy, it.d, {size: 14, light: true, color: '#344054', lh: 1.55}));
    });
  },
  vsteps(E, items, b, P){
    const n = items.length || 1, tw = b.w - 260;
    const {hs, scale, gapX} = rowsFit(items, b, (i, s) => Math.max(40, tH(i.d, 15 * s, tw, 1.5, 300) + 4), 18, 22);
    let y = b.y;
    E.push(R(b.x + 13, b.y + 14, 2, b.h - 28, P.draft ? '#D0D0D0' : P.tint2));
    items.forEach((it, k) => {
      E.push(...NUM(b.x, y, k + 1, P, {d: 28, size: 12, fill: k === 0 ? P.c3 : (P.draft ? '#3A3A3A' : P.c1)}));
      E.push(T(b.x + 48, y + 2, 190, 24, it.h, {size: 17, bold: true, lh: 1.3}));
      if (it.v) E.push(T(b.x + 48, y + 28, 190, 20, it.v, {size: 12.5, bold: true, color: P.ink}));
      E.push(T(b.x + 260, y + 3, tw, hs[k], it.d, {size: 15 * scale, light: true, color: '#344054', lh: 1.5}));
      y += hs[k] + 18 + gapX;
    });
  },
  chart(E, items, b, P){
    const lab = 220, val = 84, note = Math.min(300, b.w * .26), bw = b.w - lab - val - note - 30;
    const max = Math.max(...items.map(i => pct(i.v)), 1), n = items.length || 1, rh = Math.min(56, b.h / n);
    items.forEach((it, i) => {
      const y = b.y + i * rh, w = Math.max(6, bw * pct(it.v) / max), fill = P.draft ? '#5A5A5A' : (i === 0 ? P.c1 : mix(P.c1, P.c2, Math.min(1, i / n + .25)));
      E.push(T(b.x, y, lab - 16, rh - 10, it.h, {size: 15, bold: true, valign: 'middle', lh: 1.3}));
      E.push(R(b.x + lab, y + rh / 2 - 13, bw, 26, P.draft ? '#F2F2F2' : P.tint, {r: 13}));
      E.push(R(b.x + lab, y + rh / 2 - 13, w, 26, fill, {r: 13}));
      E.push(T(b.x + lab + bw + 12, y, val, rh - 10, it.v, {size: 17, bold: true, color: P.ink, valign: 'middle'}));
      E.push(T(b.x + lab + bw + val + 30, y, note, rh - 10, it.d, {size: 13, light: true, color: '#475467', valign: 'middle', lh: 1.35}));
    });
  },
  vbars(E, items, b, P){
    const n = Math.min(8, items.length || 1), cw = b.w / n, max = Math.max(...items.map(i => pct(i.v)), 1), base = b.y + b.h - 70, top = b.y + 30;
    E.push(R(b.x, base, b.w, 1, '#D0D5DD'));
    items.slice(0, 8).forEach((it, i) => {
      const bh = Math.max(4, (base - top - 26) * pct(it.v) / max), bw = Math.min(64, cw * .46), x = b.x + i * cw + (cw - bw) / 2;
      E.push(R(x, base - bh, bw, bh, P.draft ? '#5A5A5A' : (i === items.indexOf(items.reduce((a, c) => pct(c.v) > pct(a.v) ? c : a)) ? P.c1 : P.c2), {r: 6}));
      E.push(T(b.x + i * cw, base - bh - 28, cw, 22, it.v, {size: 16, bold: true, color: P.ink, align: 'center'}));
      E.push(T(b.x + i * cw + 4, base + 10, cw - 8, 22, it.h, {size: 13.5, bold: true, align: 'center', lh: 1.3}));
      E.push(T(b.x + i * cw + 4, base + 34, cw - 8, 34, it.d, {size: 11.5, light: true, color: '#667085', align: 'center', lh: 1.35}));
    });
  },
  matrix(E, items, b, P){
    const g = 16, cw = (b.w - g) / 2, ch = (b.h - g) / 2;
    items.slice(0, 4).forEach((it, i) => {
      const x = b.x + (i % 2) * (cw + g), y = b.y + Math.floor(i / 2) * (ch + g), hi = i === 0 && !P.draft;
      const fill = hi ? P.c1 : (P.draft ? '#F6F6F6' : P.tint), fg = onC(fill);
      E.push(R(x, y, cw, ch, fill, {r: 14}));
      E.push(T(x + 28, y + 24, cw - 56, 16, it.v || ['01', '02', '03', '04'][i], {size: 11.5, bold: true, color: hi ? fg : P.ink, alpha: hi ? .8 : 1, ls: .6}));
      const hh = tH(it.h, 20, cw - 56, 1.3, 700);
      E.push(T(x + 28, y + 48, cw - 56, hh, it.h, {size: 20, bold: true, color: hi ? fg : '#111111', lh: 1.3}));
      E.push(T(x + 28, y + 58 + hh, cw - 56, ch - 80 - hh, it.d, {size: 14.5, light: true, color: hi ? fg : '#475467', alpha: hi ? .9 : 1, lh: 1.5}));
    });
  },
  grid(E, items, b, P){
    const cols = 3, rows = Math.min(2, Math.ceil((items.length || 1) / 3)), g = 16, cw = (b.w - g * 2) / cols, ch = (b.h - g * (rows - 1)) / rows;
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, '#FFFFFF', {r: 14, line: P.draft ? '#E4E4E4' : P.tint2}));
      E.push(T(x + 24, y + 22, 40, 22, two(i + 1), {size: 15, bold: true, color: i % 3 === 1 ? P.c2 === P.c1 ? P.ink : mix(P.c2, '#000000', .25) : P.ink}));
      if (it.v) E.push(T(x + 70, y + 22, cw - 94, 22, it.v, {size: 12.5, bold: true, color: '#667085', align: 'right'}));
      const hh = tH(it.h, 17.5, cw - 48, 1.3, 700);
      E.push(T(x + 24, y + 58, cw - 48, hh, it.h, {size: 17.5, bold: true, lh: 1.3}));
      E.push(T(x + 24, y + 66 + hh, cw - 48, ch - 84 - hh, it.d, {size: 13.5, light: true, color: '#475467', lh: 1.55}));
    });
  },
  cycle(E, items, b, P, pg){
    const n = Math.min(6, Math.max(3, items.length)), cx = b.x + b.w * .32, cy = b.y + b.h / 2, Rr = Math.min(b.h / 2 - 34, 168);
    E.push(EL(cx - Rr, cy - Rr, Rr * 2, Rr * 2, '#FFFFFF', {line: P.draft ? '#D0D0D0' : P.tint2, lw: 2, nofill: true}));
    const cr = 74, cf = P.draft ? '#3A3A3A' : P.c1;
    E.push(EL(cx - cr, cy - cr, cr * 2, cr * 2, cf));
    E.push(T(cx - cr + 14, cy - cr + 10, cr * 2 - 28, cr * 2 - 20, pg.keyMsg || pg.tag || '', {size: 15.5, bold: true, color: onC(cf), align: 'center', valign: 'middle', lh: 1.35}));
    const lx = b.x + b.w * .64, lw = b.w - (lx - b.x);
    items.slice(0, n).forEach((it, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n, nx = cx + Rr * Math.cos(a), ny = cy + Rr * Math.sin(a), d = 46;
      E.push(EL(nx - d / 2, ny - d / 2, d, d, '#FFFFFF', {line: i === 0 ? P.c3 : P.c1, lw: 3}));
      E.push(T(nx - d / 2, ny - d / 2, d, d, two(i + 1), {size: 14, bold: true, color: P.ink, align: 'center', valign: 'middle', lh: 1}));
    });
    const {hs} = rowsFit(items.slice(0, n), b, (i, s) => tH(i.h, 17 * s, lw, 1.3, 700) + 4 + tH(i.d, 14 * s, lw - 40, 1.5, 300), 16);
    let y = b.y + Math.max(0, (b.h - hs.reduce((a, c) => a + c, 0) - 16 * (n - 1)) / 2);
    items.slice(0, n).forEach((it, i) => {
      E.push(T(lx, y, 34, 22, two(i + 1), {size: 14, bold: true, color: i === 0 ? mix(P.c3, '#000000', .2) : P.ink}));
      const hh = tH(it.h, 17, lw - 40, 1.3, 700);
      E.push(T(lx + 38, y, lw - 40, hh, it.h, {size: 17, bold: true, lh: 1.3}));
      E.push(T(lx + 38, y + hh + 4, lw - 40, hs[i] - hh, it.d, {size: 14, light: true, color: '#475467', lh: 1.5}));
      y += hs[i] + 16;
    });
  },
  hub(E, items, b, P, pg){
    const n = Math.min(6, items.length), cx = b.x + b.w / 2, cy = b.y + b.h / 2, cr = 92, cf = P.draft ? '#3A3A3A' : P.c1;
    E.push(EL(cx - cr - 14, cy - cr - 14, (cr + 14) * 2, (cr + 14) * 2, P.draft ? '#F0F0F0' : P.tint));
    E.push(EL(cx - cr, cy - cr, cr * 2, cr * 2, cf));
    E.push(T(cx - cr + 18, cy - cr + 16, cr * 2 - 36, cr * 2 - 32, pg.keyMsg || pg.tag || '', {size: 17, bold: true, color: onC(cf), align: 'center', valign: 'middle', lh: 1.35}));
    const left = items.slice(0, Math.ceil(n / 2)), right = items.slice(Math.ceil(n / 2), n), colW = (b.w - (cr + 14) * 2) / 2 - 70;
    [[left, b.x, 'right'], [right, b.x + b.w - colW, 'left']].forEach(([arr, x, al]) => {
      const rh = b.h / Math.max(1, arr.length);
      arr.forEach((it, i) => {
        const y = b.y + i * rh, mid = y + rh / 2;
        const hh = tH(it.h, 17, colW, 1.3, 700), dh = tH(it.d, 13.5, colW, 1.5, 300), top = mid - (hh + 4 + dh) / 2;
        E.push(T(x, top, colW, hh, it.h, {size: 17, bold: true, align: al, lh: 1.3}));
        E.push(T(x, top + hh + 4, colW, dh + 2, it.d, {size: 13.5, light: true, color: '#475467', align: al, lh: 1.5}));
        const lx1 = al === 'right' ? x + colW + 12 : cx + cr + 20, lx2 = al === 'right' ? cx - cr - 20 : x - 12;
        E.push(R(Math.min(lx1, lx2), mid, Math.abs(lx2 - lx1), 1.5, P.draft ? '#C0C0C0' : P.c2));
        E.push(EL((al === 'right' ? lx1 : lx2) - 4, mid - 4, 9, 9, P.c3));
      });
    });
  },
  pyramid(E, items, b, P){
    const n = Math.min(5, items.length || 1), g = 6, rh = (b.h - g * (n - 1)) / n, pw = Math.min(520, b.w * .46), step = pw / (2 * n);
    items.slice(0, n).forEach((it, i) => {
      const y = b.y + i * (rh + g), topW = step * 2 * i, botW = step * 2 * (i + 1), x = b.x + (pw - botW) / 2;
      const fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .15) : mix(P.c1, P.c2, n > 1 ? i / (n - 1) * .85 : 0);
      E.push(i === 0 ? SH('tri', x, y, botW, rh, fill) : SH('trap', x, y, botW, rh, fill, {inset: (botW - topW) / 2}));
      E.push(T(b.x + pw / 2 - (i === 0 ? botW * .3 : topW / 2), y + (i === 0 ? rh * .35 : 0), i === 0 ? botW * .6 : topW, i === 0 ? rh * .65 : rh, it.h, {size: i === 0 ? 14 : 16, bold: true, color: onC(fill), align: 'center', valign: 'middle', lh: 1.25}));
      const dx = b.x + pw + 40, dw = b.w - pw - 40;
      E.push(R(b.x + pw / 2 + botW / 2 + 8, y + rh / 2, dx - (b.x + pw / 2 + botW / 2 + 8) - 8, 1, '#D0D5DD'));
      if (it.v) E.push(T(dx, y + rh / 2 - 22, dw, 18, it.v, {size: 12, bold: true, color: P.ink}));
      E.push(T(dx, y + (it.v ? rh / 2 - 2 : 0), dw, it.v ? rh / 2 + 2 : rh, it.d, {size: 14, light: true, color: '#344054', valign: it.v ? 'top' : 'middle', lh: 1.45}));
    });
  },
  venn(E, items, b, P, pg){
    const r = Math.min(150, b.h / 2 - 20), cx = b.x + b.w * .3, cy = b.y + b.h / 2 + 8, off = r * .62;
    const pos = [[cx - off, cy - off * .55], [cx + off, cy - off * .55], [cx, cy + off * .6]];
    items.slice(0, 3).forEach((it, i) => { const [x, y] = pos[i]; E.push(EL(x - r, y - r, r * 2, r * 2, [P.c1, P.c2, P.c3][i], {alpha: P.draft ? .25 : .22})); });
    items.slice(0, 3).forEach((it, i) => { const [x, y] = pos[i], dx = [-r * .38, r * .38, 0][i], dy = [-r * .3, -r * .3, r * .38][i]; E.push(T(x + dx - 80, y + dy - 22, 160, 44, it.h, {size: 15.5, bold: true, color: P.ink, align: 'center', valign: 'middle', lh: 1.25})); });
    E.push(T(cx - 70, cy - 26, 140, 44, pg.tag || '', {size: 13, bold: true, color: '#101828', align: 'center', valign: 'middle', lh: 1.25}));
    const lx = b.x + b.w * .62, lw = b.w - (lx - b.x);
    LAY.list(E, items.slice(0, 3).map(i => ({h: i.h, d: i.d})), {x: lx, y: b.y + 10, w: lw, h: b.h - 20}, P);
  },
  quote(E, items, b, P, pg){
    E.push(T(b.x, b.y - 10, 80, 90, '“', {size: 110, bold: true, color: P.c3, lh: 1}));
    const q = pg.keyMsg || pg.subtitle || '', qh = Math.min(170, tH(q, 30, b.w - 140, 1.4, 700));
    E.push(T(b.x + 90, b.y + 16, b.w - 140, qh, q, {size: 30, bold: true, lh: 1.4}));
    const n = Math.min(4, items.length), cw = (b.w - 90 - (n - 1) * 24) / Math.max(1, n), y = b.y + qh + 70;
    items.slice(0, 4).forEach((it, i) => {
      const x = b.x + 90 + i * (cw + 24);
      E.push(R(x, y, cw, 2, i ? '#D0D5DD' : P.c1));
      E.push(T(x, y + 16, cw, 24, it.h, {size: 16, bold: true, lh: 1.3}));
      E.push(T(x, y + 46, cw, b.y + b.h - y - 46, it.d + (it.v ? `\n${it.v}` : ''), {size: 13.5, light: true, color: '#475467', lh: 1.5}));
    });
  },
  twoCol(E, items, b, P, pg){
    const g = 28, cw = (b.w - g) / 2;
    items.slice(0, 2).forEach((it, i) => {
      const x = b.x + i * (cw + g), hf = i ? (P.draft ? '#3A3A3A' : P.c1) : (P.draft ? '#8A8A8A' : P.c2);
      E.push(R(x, b.y, cw, 64, hf, {r: 12}));
      E.push(T(x + 26, b.y, cw - 52 - 120, 64, it.h, {size: 19, bold: true, color: onC(hf), valign: 'middle'}));
      if (it.v) E.push(T(x + cw - 26 - 140, b.y, 140, 64, it.v, {size: 14, bold: true, color: onC(hf), align: 'right', valign: 'middle'}));
      const ls = lines(it.d), tw = cw - 80;
      const {hs, scale, gapX} = rowsFit(ls.map(l => ({d: l})), {h: b.h - 120}, (o, s) => tH(o.d, 15.5 * s, tw, 1.5, 400), 14, 14);
      const need2 = Math.max(...items.slice(0, 2).map(o => { const l2 = lines(o.d); return l2.reduce((a, l) => a + tH(l, 15.5 * scale, tw, 1.5, 400), 0) + (l2.length - 1) * (14 + gapX); }));
      E.push(R(x, b.y + 76, cw, Math.min(b.h - 76, Math.max(150, need2 + 50)), P.draft ? '#F7F7F7' : P.tint, {r: 12}));
      let y = b.y + 100;
      ls.forEach((l, k) => { E.push(EL(x + 28, y + 8, 7, 7, hf)); E.push(T(x + 48, y, tw, hs[k], l, {size: 15.5 * scale, lh: 1.5, color: '#1D2939'})); y += hs[k] + 14 + gapX; });
    });
  },
  mediaFlow(E, items, b, P, pg){
    const get = re => items.find(i => re.test(i.h)) || {};
    const flow = [['대상', get(/대상|누구/)], ['소재', get(/소재|무엇/)], ['랜딩', get(/랜딩/)], ['평가', get(/지표|KPI|평가/)]];
    const ops = lines(get(/운영/).d), sch = get(/일정|예산/).d || '';
    const cw = (b.w + 12 * 3) / 4 - 12;
    flow.forEach(([lab, it], i) => {
      const x = b.x + i * (cw), fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .14) : mix(P.c1, P.c2, i / 3 * .8);
      E.push(SH(i ? 'chevron' : 'home', x, b.y, cw + 12, 48, fill));
      E.push(T(x + (i ? 30 : 20), b.y, cw - 40, 48, lab, {size: 14.5, bold: true, color: onC(fill), valign: 'middle'}));
      E.push(T(x + 4, b.y + 62, cw - 20, 92, it.d || '-', {size: 14, light: true, color: '#1D2939', lh: 1.5}));
    });
    const oy = b.y + 172;
    E.push(T(b.x, oy, 200, 20, '운영 방법', {size: 13, bold: true, color: P.ink, ls: .3}));
    E.push(R(b.x + 74, oy + 10, b.w - 74, 1, '#D0D5DD'));
    const n = Math.max(1, Math.min(3, ops.length)), ow = (b.w - (n - 1) * 20) / n;
    ops.slice(0, 3).forEach((o, i) => { const x = b.x + i * (ow + 20); E.push(...NUM(x, oy + 36, i + 1, P, {d: 26, size: 11.5, fill: P.draft ? '#3A3A3A' : P.c1})); E.push(T(x + 38, oy + 36, ow - 40, b.y + b.h - oy - 90, o, {size: 14.5, lh: 1.5, color: '#1D2939'})); });
    if (sch){ E.push(R(b.x, b.y + b.h - 40, b.w, 40, P.draft ? '#F3F3F3' : P.tint, {r: 8})); E.push(T(b.x + 18, b.y + b.h - 40, b.w - 36, 40, '일정·예산   ' + sch, {size: 13.5, bold: true, color: P.ink, valign: 'middle'})); }
  },
  mediaQuad(E, items, b, P, pg){
    const get = re => items.find(i => re.test(i.h)) || {};
    const quads = [['대상', get(/대상|누구/)], ['소재', get(/소재|무엇/)], ['랜딩', get(/랜딩/)], ['평가 지표', get(/지표|KPI|평가/)]];
    const ops = lines(get(/운영/).d), sch = get(/일정|예산/).d || '';
    const qw = b.w * .6, g = 14, cw = (qw - g) / 2, ch = (b.h - g) / 2;
    quads.forEach(([lab, it], i) => {
      const x = b.x + (i % 2) * (cw + g), y = b.y + Math.floor(i / 2) * (ch + g);
      E.push(R(x, y, cw, ch, P.draft ? '#F6F6F6' : P.tint, {r: 14}));
      const tx = i % 2 ? x + 70 : x + 26, ty = i < 2 ? y + 24 : y + 44;
      E.push(T(tx, ty, cw - 96, 18, lab, {size: 12.5, bold: true, color: P.ink, ls: .3}));
      E.push(T(tx, ty + 26, cw - 96, ch - 60, it.d || '-', {size: 14, light: true, color: '#1D2939', lh: 1.5}));
    });
    const cr = 62, cx = b.x + cw + g / 2, cy = b.y + ch + g / 2, cf = P.draft ? '#3A3A3A' : P.c1;
    E.push(EL(cx - cr - 8, cy - cr - 8, (cr + 8) * 2, (cr + 8) * 2, '#FFFFFF'));
    E.push(EL(cx - cr, cy - cr, cr * 2, cr * 2, cf));
    E.push(T(cx - cr + 10, cy - cr + 10, cr * 2 - 20, cr * 2 - 20, pg.mediaName || (pg.tag || '').split('·')[0] || '', {size: 14, bold: true, color: onC(cf), align: 'center', valign: 'middle', lh: 1.3}));
    const rx = b.x + qw + 36, rw = b.w - qw - 36;
    E.push(T(rx, b.y, rw, 20, '운영 방법', {size: 13, bold: true, color: P.ink, ls: .3}));
    E.push(R(rx, b.y + 28, rw, 2, cf));
    const {hs, gapX} = rowsFit(ops.map(o => ({d: o})), {h: b.h - 120}, (o, s) => tH(o.d, 14.5 * s, rw - 40, 1.5, 400), 14, 16);
    let y = b.y + 46;
    ops.forEach((o, i) => { E.push(...NUM(rx, y, i + 1, P, {d: 24, size: 11, fill: cf})); E.push(T(rx + 36, y + 1, rw - 40, hs[i], o, {size: 14.5, lh: 1.5, color: '#1D2939'})); y += hs[i] + 14 + gapX; });
    if (sch) E.push(T(rx, b.y + b.h - 54, rw, 54, sch, {size: 13, bold: true, color: P.ink, valign: 'bottom', lh: 1.45}));
  },
  summary(E, items, b, P, pg){ // 번호 원 + 항목 | 현황 | 제안(강조 열)
    const head = pg.cols || ['항목', '현황', '제안'], hdr = 32, c1w = Math.min(230, b.w * .22), c2w = (b.w - c1w) * .44, c3w = b.w - c1w - c2w;
    const hs0 = items.map(i => Math.max(tH(i.h, 14.5, c1w - 52, 1.35, 700), tH(i.v, 13, c2w - 30, 1.5, 300), tH(i.d, 13.5, c3w - 34, 1.5, 400)) + 22);
    const tot = hs0.reduce((a, c) => a + c, 0), sc = Math.min(1, (b.h - hdr) / tot), fill = Math.min(76, (b.h - hdr) / Math.max(1, items.length) * .85);
    const hs = hs0.map(h => sc < 1 ? h * sc : Math.max(h, fill));
    const x3 = b.x + c1w + c2w;
    E.push(T(b.x, b.y, c1w, hdr - 8, head[0], {size: 11.5, bold: true, color: '#8C8C8C'}));
    E.push(T(b.x + c1w + 14, b.y, c2w, hdr - 8, head[1], {size: 11.5, bold: true, color: '#8C8C8C'}));
    E.push(T(x3 + 16, b.y, c3w, hdr - 8, head[2], {size: 11.5, bold: true, color: P.c1}));
    E.push(R(b.x, b.y + hdr - 4, x3 - b.x, 1, '#C4C4C4'));
    const tot2 = hs.reduce((a, c) => a + c, 0);
    E.push(R(x3, b.y + hdr - 6, c3w, tot2 + 10, '#FFFFFF', {line: P.c1, r: 2}));
    E.push(R(x3, b.y + hdr - 6, c3w, 3, P.c1));
    let y = b.y + hdr;
    items.forEach((it, i) => {
      const rh = hs[i];
      E.push(...NUM(b.x, y + rh / 2 - 12, i + 1, P, {d: 24, size: 11, fill: P.ink}));
      E.push(T(b.x + 36, y, c1w - 52, rh, it.h, {size: 14.5 * Math.max(.85, sc), bold: true, valign: 'middle', lh: 1.35}));
      E.push(T(b.x + c1w + 14, y, c2w - 30, rh, it.v || '-', {size: 13 * Math.max(.85, sc), light: true, color: '#4D4D4D', valign: 'middle', lh: 1.5}));
      E.push(T(x3 + 16, y, c3w - 34, rh, it.d, {size: 13.5 * Math.max(.85, sc), color: '#181818', valign: 'middle', lh: 1.5}));
      y += rh; if (i < items.length - 1) E.push(R(b.x, y, x3 - b.x, 1, '#E4E7EC'));
    });
  },
  statBars(E, items, b, P, pg){ // 왼쪽 가로 막대 + 오른쪽 핵심 수치 3개
    const lw = b.w * .6, max = Math.max(...items.map(i => Math.abs(pct(i.v))), 1), n = items.length || 1, rh = Math.min(48, b.h / n), lab = 190, bw = lw - lab - 90;
    items.forEach((it, i) => {
      const y = b.y + i * rh, v = pct(it.v), w = Math.max(4, bw * Math.abs(v) / max), neg = v < 0;
      E.push(T(b.x, y, lab - 12, rh - 8, it.h, {size: 13, bold: true, align: 'right', valign: 'middle', lh: 1.3, color: '#333333'}));
      E.push(R(b.x + lab, y + rh / 2 - 11, w, 22, neg ? P.c3 : (i === 0 ? P.c1 : mix(P.c1, '#FFFFFF', .35))));
      E.push(T(b.x + lab + w + 8, y, 90, rh - 8, it.v, {size: 13, bold: true, color: neg ? P.c3 : P.ink, valign: 'middle'}));
    });
    const top = [...items].filter(i => isNum(i.v)).slice(0, 3), rx = b.x + lw + 40, rw = b.w - lw - 40, sh = b.h / Math.max(1, top.length);
    E.push(R(rx - 20, b.y, 1, b.h, '#E4E7EC'));
    top.forEach((it, i) => { const y = b.y + i * sh; E.push(T(rx, y + 4, rw, 44, it.v, {size: 34, bold: true, color: pct(it.v) < 0 ? P.c3 : P.c1, lh: 1.2})); E.push(T(rx, y + 50, rw, 20, it.h, {size: 13.5, bold: true, color: '#181818'})); E.push(T(rx, y + 72, rw, sh - 80, it.d, {size: 12, light: true, color: '#8C8C8C', lh: 1.45})); });
  },
  colCards(E, items, b, P){ // 상단 컬러 보더 카드 + 불릿
    const n = Math.min(4, items.length || 1), g = 16, cw = (b.w - (n - 1) * g) / n;
    const need = Math.max(...items.slice(0, n).map(it => 22 + Math.max(24, tH(it.h, 16.5, cw - 78, 1.3, 700)) + 26 + (it.v ? 24 : 0) + lines(it.d).reduce((a, l) => a + tH(l, 13.5, cw - 62, 1.5, 400) + 8, 0)));
    b = {...b, h: Math.min(b.h, Math.max(220, need + 30))};
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), acc = i === n - 1 && n >= 3 ? P.c3 : P.c1, bl = lines(it.d);
      E.push(R(x, b.y, cw, b.h, '#F5F6F8', {r: 4}));
      E.push(R(x, b.y, cw, 3, acc));
      E.push(T(x + 22, b.y + 22, 40, 22, two(i + 1), {size: 15, bold: true, color: acc}));
      E.push(T(x + 56, b.y + 22, cw - 78, 44, it.h, {size: 16.5, bold: true, color: '#181818', lh: 1.3}));
      let y = b.y + 22 + Math.max(24, tH(it.h, 16.5, cw - 78, 1.3, 700)) + 6;
      if (it.v){ E.push(T(x + 56, y, cw - 78, 18, it.v, {size: 12, bold: true, color: acc})); y += 24; }
      E.push(R(x + 22, y + 6, cw - 44, 1, '#D3DCEB')); y += 20;
      const tw = cw - 62;
      bl.forEach(l => { const lh = tH(l, 13.5, tw, 1.5, 400); if (y + lh > b.y + b.h - 14) return; E.push(R(x + 24, y + 9, 4, 4, '#8C8C8C', {r: 2})); E.push(T(x + 38, y, tw, lh, l, {size: 13.5, color: '#333333', lh: 1.5})); y += lh + 8; });
    });
  },
  stepCards(E, items, b, P){ // 헤더 띠 박스 + 화살표 단계
    const n = Math.min(6, items.length || 1), g = 26, cw = (b.w - (n - 1) * g) / n;
    const need = Math.max(...items.slice(0, n).map(it => 58 + (it.v ? 26 : 0) + lines(it.d).reduce((a, l) => a + tH(l, 13, cw - 46, 1.5, 400) + 7, 0)));
    b = {...b, h: Math.min(b.h, Math.max(200, need + 28))};
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), hf = i === n - 1 ? P.c3 : (P.draft ? '#3A3A3A' : P.c1);
      E.push(R(x, b.y, cw, b.h, '#FFFFFF', {r: 6, line: '#D3DCEB'}));
      E.push(R(x, b.y, cw, 44, hf, {r: 6}));
      E.push(T(x + 16, b.y, cw - 32, 44, it.h, {size: 14.5, bold: true, color: onC(hf), valign: 'middle', lh: 1.25}));
      let y = b.y + 58;
      if (it.v){ E.push(T(x + 16, y, cw - 32, 18, it.v, {size: 12, bold: true, color: P.ink})); y += 26; }
      lines(it.d).forEach(l => { const lh = tH(l, 13, cw - 46, 1.5, 400); if (y + lh > b.y + b.h - 10) return; E.push(R(x + 18, y + 8, 4, 4, '#8C8C8C', {r: 2})); E.push(T(x + 30, y, cw - 46, lh, l, {size: 13, color: '#333333', lh: 1.5})); y += lh + 7; });
      if (i < n - 1) E.push(SH('chevron', x + cw + 7, b.y + b.h / 2 - 10, 12, 20, '#C4C4C4'));
    });
  },
  image(E, items, b, P, pg){ imgEl(E, pg, b); }
};
const MEDIA_LAYOUTS = ['spec', 'mediaFlow', 'mediaQuad'];

/* ---------- 이미지 자리 ---------- */
const IMG_MODES = {right: '오른쪽', left: '왼쪽', full: '본문 전체', free: '직접 배치'};
function imgBoxes(pg, box){
  const m = pg.img?.mode || 'right';
  if (m === 'full') return {img: {...box}, body: null};
  if (m === 'free') return {img: {x: pg.img.x ?? 760, y: pg.img.y ?? box.y, w: pg.img.w ?? 456, h: pg.img.h ?? box.h}, body: box};
  const iw = Math.round(box.w * (pg.img?.ratio || .42)), g = 32;
  return m === 'left' ? {img: {x: box.x, y: box.y, w: iw, h: box.h}, body: {...box, x: box.x + iw + g, w: box.w - iw - g}} : {img: {x: box.x + box.w - iw, y: box.y, w: iw, h: box.h}, body: {...box, w: box.w - iw - g}};
}
function imgEl(E, pg, ib){
  if (pg.image) E.push(IM(ib.x, ib.y, ib.w, ib.h, pg.image, {cover: pg.img?.fit !== 'contain', nw: pg.imageW, nh: pg.imageH, r: 12}));
  else if (!EXPORTING) { E.push(R(ib.x, ib.y, ib.w, ib.h, '#F8FAFC', {r: 12, line: '#98A2B3', dash: true})); E.push(T(ib.x, ib.y, ib.w, ib.h, '이미지 자리\n(업로드하면 여기에 배치)', {size: 15, light: true, color: '#98A2B3', align: 'center', valign: 'middle'})); }
}

function titleBlock(E, it, pg, P){
  const theme = P.draft ? 'clean' : (S.design?.theme || 'madup');
  if (theme === 'madup'){
    E.push(T(MX, 36, W - MX * 2 - 240, 36, pg.title, {size: 25, bold: true, color: '#181818', lh: 1.3}));
    if (pg.subtitle) E.push(T(MX, 76, W - MX * 2 - 120, 22, pg.subtitle, {size: 13.5, color: '#4D4D4D', lh: 1.4}));
    return {bodyY: 124, madup: true};
  }
  if (theme === 'band'){
    E.push(R(0, 0, W, 182, P.c1));
    const fg = onC(P.c1);
    E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 32, bold: true, color: fg, lh: 1.3}));
    if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 17, light: true, color: fg, alpha: .88}));
    return {labelOn: fg, logoOn: P.c1, bodyY: 214};
  }
  if (theme === 'side'){
    E.push(R(0, 0, 12, H, P.c1)); E.push(R(0, 0, 12, 200, P.c3));
    E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 32, bold: true, lh: 1.3}));
    if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 17, light: true, color: P.ink}));
    return {bodyY: SP.bodyY};
  }
  const tt = typeof themeTitle === 'function' ? themeTitle(theme, E, it, pg, P) : null; if (tt) return tt;
  E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 32, bold: true, lh: 1.3}));
  if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 17, light: true, color: '#475467'}));
  return {bodyY: SP.bodyY};
}

/* ---------- 참고 PPT 기반 레이아웃 (tpl:ID) ---------- */
function tplById(id){ return (S.refLayouts || []).find(t => t.id === id); }
function tplSpec(it, pg, P, tpl){
  if (tpl.v === 3 && typeof designSpec === 'function') return designSpec(it, pg, P, tpl);
  const E = [], items = itemsOf(pg), cmap = tpl.recolor !== false && !P.draft ? tpl.cmap || {} : {};
  const col = c => c && cmap[c] ? [P.c1, P.c2, P.c3][cmap[c] - 1] : (c && P.draft && tpl.cmap?.[c] ? '#5A5A5A' : c);
  const fill = {title: pg.title, sub: pg.subtitle, key: pg.keyMsg, tag: pg.tag};
  const idx = {h: 0, d: 0, v: 0}, texts = [], used = [], unused = [];
  for (const e of tpl.els){ if (e.k !== 't') continue;
    const text = e.slot === 'deco' ? e.text : (e.slot in fill) ? fill[e.slot] : (items[idx[e.slot]++] || {})[e.slot];
    (text ? used : unused).push(e); texts.push([e, text]); }
  const inside = (m, t) => { const cx = t.x + t.w / 2, cy = t.y + t.h / 2; return cx >= m.x && cx <= m.x + m.w && cy >= m.y && cy <= m.y + m.h; };
  const near = (m, t, g = 24) => m.x < t.x + t.w + g && m.x + m.w > t.x - g && m.y < t.y + t.h + 4 && m.y + m.h > t.y - 4 && m.w * m.h <= t.w * t.h * 1.6;
  const big = m => m.w * m.h >= W * H * .3;
  for (const e of tpl.els){
    if (e.k === 't'){ const t = texts.find(x => x[0] === e)[1]; if (t) E.push({...e, text: t, color: col(e.color), minScale: .5}); continue; }
    if (!big(e) && unused.some(u => inside(e, u) || near(e, u)) && !used.some(u => u.slot !== 'deco' && (inside(e, u) || near(e, u, 4)))) continue; // 채우지 못한 칸의 상자는 숨김
    E.push({...e, fill: col(e.fill), line: col(e.line)});
  }
  const ibox = tpl.body || {x: MX, y: 124, w: W - MX * 2, h: 466};
  let body = tpl.body, late = null;
  if (pg.image || pg.img){ const bx = imgBoxes(pg, ibox); late = bx.img; if (body && pg.img?.mode !== 'free') body = bx.body; }
  if (tpl.mode === 'frame' && body && items.length){ const lay = pg.tplBody || tpl.bodyLayout || 'table'; (LAY[lay] || LAY.table)(E, items, body, P, pg); }
  if (late) imgEl(E, pg, late);
  if (tpl.chrome) chrome(E, it, P);
  else if (!tpl.els.some(e => e.k === 'i' && e.x > W * .7 && e.y > H * .82)){ const lg = logoFor(col(tpl.bg) || '#FFFFFF'); if (lg){ const bb = fitBox(lg.w, lg.h, 0, 0, 92, 14); E.push(IM(W - MX - bb.w, 678, bb.w, bb.h, lg.data)); } }
  return {bg: col(tpl.bg) || '#FFFFFF', bgImg: tpl.bgImg || null, els: E};
}
const tplFor = tag => (S.refLayouts || []).find(t => t.use && t.tag === tag);
function buildSpec(it){
  if (it.kind === 'page' && it.page?.fixed){ const F = it.page.fixed; return {bg: F.bg || '#FFFFFF', bgCss: F.bgGrad ? gradCSS(F.bgGrad, F.bgAng) : null, bgImg: F.bgImg || null, els: F.els, fx: true}; }
  if (it.kind === 'cover') return coverSpec(it);
  if (it.kind === 'guide') return guideSpec(it);
  if (it.kind === 'toc') return tocSpec(it);
  if (it.kind === 'closing') return closingSpec(it);
  const E = [], pg = it.page, P = palette(pg.washed), items = itemsOf(pg);
  if (String(pg.layout || '').startsWith('tpl:')){ const tpl = tplById(pg.layout.slice(4)); if (tpl) return tplSpec(it, pg, P, tpl); }
  if (pg.type === 'divider'){
    const dt = tplFor('divider');
    if (dt) return tplSpec(it, {...pg, title: pg.title || it.secTitle, tag: it.secNo ? two(it.secNo) : ''}, P, dt);
    if (P.madup){
      const en = it.sec?.en, big = en || pg.title || it.secTitle, sub = en ? (pg.title || it.secTitle) + (pg.subtitle ? '\n' + pg.subtitle : '') : pg.subtitle;
      E.push(T(0, 268, W, 18, it.secNo ? `SECTION ${two(it.secNo)}` : '', {size: 11, bold: true, color: '#FFFFFF', align: 'center', alpha: .75, ls: 1}));
      E.push(T(160, 296, W - 320, 70, big, {size: 44, color: '#FFFFFF', align: 'center', lh: 1.25, wt: 500}));
      if (sub) E.push(T(200, 380, W - 400, 50, sub, {size: 14.5, color: '#FFFFFF', align: 'center', alpha: .75, lh: 1.5}));
      chrome(E, it, P, '#000000');
      return {bg: '#000000', bgImg: MADUP_BG.divider, els: E};
    }
    if (!P.draft && typeof themeDivider === 'function'){ const td = themeDivider(S.design?.theme, E, it, pg, P); if (td){ chrome(E, it, P, td.on || null); return {bg: td.bg, els: E}; } }
    const bg = P.draft ? '#2B2B2B' : P.c1, fg = onC(bg);
    if (!P.draft) E.push(R(W - 360, 0, 360, H, P.c2, {alpha: .18}));
    E.push(T(MX, 190, 400, 30, it.secNo ? two(it.secNo) : '', {size: 22, bold: true, color: fg, alpha: .75, ls: 2}));
    E.push(R(MX, 232, 48, 3, P.draft ? '#888888' : (Math.abs(lum(P.c3) - lum(bg)) > .08 ? P.c3 : fg)));
    E.push(T(MX, 258, 1000, 130, pg.title || it.secTitle, {size: 48, bold: true, color: fg, lh: 1.25}));
    if (pg.subtitle) E.push(T(MX, 400, 900, 60, pg.subtitle, {size: 18, light: true, color: fg, alpha: .85, lh: 1.5}));
    if (items.length) E.push(T(MX, 480, 1100, 22, items.map(i => i.h).filter(Boolean).join('     '), {size: 13, light: true, color: fg, alpha: .7}));
    chrome(E, it, P, bg);
    return {bg, els: E};
  }
  if (pg.type === 'bridge'){
    const bg = P.draft ? '#F3F3F3' : P.madup ? '#FFFFFF' : P.tint;
    const main = pg.keyMsg || pg.title, mh = Math.min(200, tH(main, 34, W - 300, 1.4, 700));
    const sub = pg.keyMsg ? (pg.subtitle || pg.title) : pg.subtitle, sh = sub ? tH(sub, 17, W - 360, 1.5, 300) : 0;
    const total = 20 + 32 + mh + (sub ? 20 + sh : 0) + (items.length ? 36 + 22 : 0);
    let y = Math.max(140, (H - total) / 2 - 10);
    E.push(T(MX, y, W - MX * 2, 20, it.secTitle || '', {size: 12, bold: true, color: P.ink, align: 'center', ls: .3})); y += 20 + 12;
    E.push(R(W / 2 - 20, y, 40, 3, P.c1)); y += 3 + 22;
    E.push(T(150, y, W - 300, mh, main, {size: 34, bold: true, align: 'center', lh: 1.4})); y += mh + 20;
    if (sub){ E.push(T(180, y, W - 360, sh, sub, {size: 17, light: true, color: '#475467', align: 'center', lh: 1.5})); y += sh + 36; }
    if (items.length){ const ws = items.slice(0, 4).map(i => i.h || i.d), cw = 200, x0 = W / 2 - (ws.length * cw + (ws.length - 1) * 16) / 2; ws.forEach((w, i) => { E.push(R(x0 + i * (cw + 16), y, cw, 40, '#FFFFFF', {r: 20, line: P.draft ? '#D0D0D0' : P.tint2})); E.push(T(x0 + i * (cw + 16), y, cw, 40, w, {size: 13.5, bold: true, color: P.ink, align: 'center', valign: 'middle'})); }); }
    chrome(E, it, P);
    return {bg, bgImg: P.madup ? MADUP_BG.content : null, els: E};
  }
  const tb = titleBlock(E, it, pg, P);
  const layout = pg.layout || (pg.type === 'strategy' ? 'cards' : 'list');
  const showKey = pg.keyMsg && !['split', 'spec', 'hero', 'cycle', 'hub', 'quote', 'mediaQuad'].includes(layout);
  const keyY = tb.madup ? 590 : SP.keyY, keyH = tb.madup ? 38 : SP.keyH;
  const top = tb.bodyY, bottom = showKey ? keyY - 20 : (tb.bodyEnd || (tb.madup ? 630 : SP.bodyEnd));
  const px = tb.padX || MX;
  let box = {x: px, y: top, w: W - px * 2, h: bottom - top};
  let lateImg = null;
  if ((pg.image || pg.img) && layout !== 'image'){
    const bx = imgBoxes(pg, box);
    if (pg.img?.mode === 'free'){ const ib = bx.img, g = 28; lateImg = ib; // 직접 배치: 이미지와 겹치지 않는 쪽으로 본문 축소
      if (ib.x + ib.w / 2 > box.x + box.w / 2 && ib.x - g - box.x >= box.w * .4) box = {...box, w: ib.x - g - box.x};
      else if (ib.x + ib.w / 2 <= box.x + box.w / 2 && box.x + box.w - (ib.x + ib.w + g) >= box.w * .4) box = {...box, x: ib.x + ib.w + g, w: box.x + box.w - (ib.x + ib.w + g)};
      else if (ib.y - g - box.y >= 140) box = {...box, h: ib.y - g - box.y};
    } else { imgEl(E, pg, bx.img); box = bx.body; }
  }
  if (box){
    if (!items.length && !['image', 'quote'].includes(layout)) E.push(T(box.x, box.y, box.w, 40, '세부 항목을 추가하세요', {size: 16, light: true, color: '#98A2B3'}));
    else { const i0 = E.length; (LAY[layout] || LAY.list)(E, items, box, P, pg); if (!lateImg && !(pg.image || pg.img)) balanceBody(E, i0, box, layout); }
  }
  if (lateImg) imgEl(E, pg, lateImg);
  if (showKey && tb.madup){
    E.push(R(MX, keyY, W - MX * 2, keyH, P.tint, {r: 3}));
    E.push(R(MX, keyY, 4, keyH, P.c1));
    E.push(T(MX + 18, keyY, 60, keyH, '시사점', {size: 13, bold: true, color: P.c1, valign: 'middle'}));
    E.push(T(MX + 82, keyY, W - MX * 2 - 100, keyH, pg.keyMsg, {size: 13, color: '#181818', valign: 'middle', wt: 500}));
  } else if (showKey){
    const kf = P.draft ? '#3A3A3A' : P.c1;
    E.push(R(MX, SP.keyY, W - MX * 2, SP.keyH, kf, {r: 10}));
    E.push(T(MX + 28, SP.keyY, W - MX * 2 - 56, SP.keyH, pg.keyMsg, {size: 17, bold: true, color: onC(kf), valign: 'middle'}));
  }
  if (pg.source) E.push(T(MX, tb.madup ? 640 : SP.bodyEnd + 12, W - MX * 2 - 300, 14, '출처: ' + pg.source, {size: 9, light: true, color: '#8C8C8C'}));
  chrome(E, it, P, null, {labelOn: tb.labelOn, logoOn: tb.logoOn});
  return {bg: tb.bg || '#FFFFFF', bgImg: tb.madup ? MADUP_BG.content : null, els: E};
}

function coverSpec(){
  const P = palette(true), E = [], tp = S.template, A = S.input.analysis;
  const ct = tplFor('cover'); if (ct) return tplSpec({}, {title: A?.logic?.concept || S.project.name, subtitle: S.project.name || S.project.client, keyMsg: `${S.project.date}  |  ${S.project.proposer}`, items: []}, P, ct);
  if (P.madup && !tp.coverBg){
    E.push(R(MX, 54, 76, 22, P.c1, {r: 3})); E.push(T(MX, 54, 76, 22, 'PROPOSAL', {size: 10, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', ls: .6}));
    E.push(T(MX, 128, 820, 130, A?.logic?.concept || S.project.name || `${S.project.client || '브랜드'} 퍼포먼스 마케팅 제안`, {size: 40, bold: true, color: '#181818', lh: 1.32}));
    E.push(T(MX, 432, 900, 26, S.project.name || `${S.project.client || ''} 디지털 마케팅 운영 제안`, {size: 16, bold: true, color: '#333333'}));
    if (A?.logic?.message) E.push(T(MX, 462, 900, 44, A.logic.message, {size: 13, color: '#4D4D4D', lh: 1.5}));
    E.push(T(MX, 640, 700, 16, `${S.project.date || ''}  |  ${S.project.proposer || ''}`, {size: 10.5, color: '#8C8C8C'}));
    chrome(E, {}, P);
    return {bg: '#FFFFFF', bgImg: MADUP_BG.content, els: E};
  }
  if (!tp.coverBg && typeof themeCover === 'function'){ const tc = themeCover(S.design?.theme, E, P); if (tc){ chrome(E, {}, P, tc.on || null); return {bg: tc.bg, els: E}; } }
  if (!tp.coverBg){ E.push(R(880, 0, 400, H, P.c1)); E.push(R(880, 520, 400, 200, P.c2)); }
  E.push(T(MX, 206, 740, 20, 'PERFORMANCE MARKETING PROPOSAL', {size: 13, bold: true, color: P.ink, ls: 1.2}));
  E.push(T(MX, 236, 760, 130, S.project.name || `${S.project.client || '브랜드'} 퍼포먼스 마케팅 제안`, {size: 46, bold: true, lh: 1.25, valign: 'bottom'}));
  E.push(T(MX, 378, 760, 30, `${S.project.client || ''} 디지털 마케팅 운영 제안`, {size: 20, light: true, color: '#475467'}));
  if (A?.logic?.concept) E.push(T(MX, 418, 760, 56, A.logic.concept, {size: 17, bold: true, color: P.ink, lh: 1.45}));
  E.push(R(MX, 598, 32, 3, P.c1));
  E.push(T(MX, 612, 700, 46, `${S.project.date || ''}\n${S.project.proposer || ''}`, {size: 13.5, light: true, color: '#667085', lh: 1.5}));
  chrome(E, {}, P);
  return {bg: '#FFFFFF', bgImg: tp.coverBg || null, els: E};
}
function guideSpec(){
  const P = palette(true), E = [], cs = S.input.colors;
  E.push(T(MX, SP.titleY, 1100, SP.titleH, 'Color & Typography Guide', {size: 32, bold: true, lh: 1.3}));
  E.push(T(MX, SP.subY, 1150, SP.subH, S.input.colorConcept || '브랜드 채널·제품 기준 메인 컬러칩', {size: 17, light: true, color: '#475467'}));
  const n = cs.length, g = 24, cw = (W - MX * 2 - (n - 1) * g) / n;
  cs.forEach((c, i) => {
    const x = MX + i * (cw + g), hex = validHex(c.hex) ? c.hex.toUpperCase() : '#333333';
    E.push(R(x, 200, cw, 160, hex, {r: 14, line: lum(hex) > .85 ? '#E4E7EC' : null}));
    E.push(T(x + 22, 218, cw - 44, 18, `0${i + 1}  ${c.role || ''}`, {size: 12, bold: true, color: onC(hex)}));
    E.push(T(x + 22, 318, cw - 44, 26, hex, {size: 20, bold: true, color: onC(hex)}));
    E.push(T(x, 374, cw, 24, c.name || '', {size: 16, bold: true}));
    E.push(T(x, 402, cw, 60, c.reason || ['메인 타이틀·간지·핵심 강조', '서브 그래픽·차트 보조', '포인트·수치 하이라이트'][i] || '', {size: 13, light: true, color: '#475467', lh: 1.5}));
  });
  E.push(R(MX, 484, W - MX * 2, 1, '#E4E7EC'));
  E.push(T(MX, 504, 300, 18, 'TYPOGRAPHY', {size: 11, bold: true, color: P.ink, ls: .8}));
  E.push(T(MX, 532, 560, 40, 'Pretendard Bold  메인 타이틀', {size: 28, bold: true, lh: 1.3}));
  E.push(T(MX, 582, 560, 28, 'Pretendard Light  서브 타이틀 · 본문', {size: 18, light: true, color: '#344054'}));
  E.push(T(680, 532, 540, 80, '타이틀 32 Bold / 서브 17 Light / 본문 14~16 Light\n강조 수치는 Main, 포인트는 Accent 컬러', {size: 13.5, light: true, color: '#475467', lh: 1.6}));
  chrome(E, {label: 'GUIDE'}, P);
  return {bg: '#FFFFFF', els: E};
}
function tocSpec(it){
  const P = palette(true), E = [], secs = it.secs || [], fg = onC(P.c1);
  if (P.madup){
    E.push(T(MX, 60, 400, 20, 'INDEX', {size: 12, bold: true, color: P.c1, ls: 1.2}));
    E.push(T(MX, 86, 600, 40, '제안 목차', {size: 28, bold: true, color: '#181818'}));
    const n = secs.length, cols = n > 6 ? 2 : 1, per = Math.ceil(n / cols), cw = (W - MX * 2) / cols, rh = Math.min(64, 440 / Math.max(1, per));
    secs.forEach((s, i) => { const c = Math.floor(i / per), r = i % per, x = MX + c * cw, y = 170 + r * rh; E.push(T(x, y, 60, 30, two(s.no), {size: 22, bold: true, color: P.c1})); E.push(T(x + 60, y + 3, cw - 100, 26, s.title, {size: 17, bold: true, color: '#181818'})); if (s.goal) E.push(T(x + 60, y + 31, cw - 100, 18, s.goal, {size: 11.5, color: '#8C8C8C'})); E.push(R(x, y + rh - 8, cw - 40, 1, '#E4E7EC')); });
    chrome(E, {}, P);
    return {bg: '#FFFFFF', bgImg: MADUP_BG.content, els: E};
  }
  E.push(R(0, 0, 380, H, P.c1));
  E.push(T(MX, 92, 300, 50, 'INDEX', {size: 40, bold: true, color: fg}));
  E.push(T(MX, 150, 280, 50, S.project.client ? `${S.project.client} 제안 목차` : '제안 목차', {size: 14, light: true, color: fg, alpha: .8}));
  const n = secs.length, cols = n > 7 ? 2 : 1, per = Math.ceil(n / cols), cw = (W - 440 - MX) / cols, rh = Math.min(64, 560 / Math.max(1, per));
  secs.forEach((s, i) => {
    const c = Math.floor(i / per), r = i % per, x = 440 + c * cw, y = 86 + r * rh;
    E.push(T(x, y, 50, 28, two(s.no), {size: 20, bold: true, color: P.ink}));
    E.push(T(x + 52, y + 2, cw - 76, 26, s.title, {size: 18, bold: true, lh: 1.3}));
    if (s.goal) E.push(T(x + 52, y + 30, cw - 76, rh - 34, s.goal, {size: 12, light: true, color: '#667085', lh: 1.4}));
  });
  chrome(E, {}, P, null, {logoOn: null});
  return {bg: '#FFFFFF', els: E};
}
function closingSpec(){
  const P = palette(true), E = [], fg = onC(P.c1);
  const ct = tplFor('closing'); if (ct) return tplSpec({}, {title: '감사합니다', subtitle: S.project.proposer, items: []}, P, ct);
  if (P.madup){
    E.push(T(0, 300, W, 60, '감사합니다', {size: 40, color: '#FFFFFF', align: 'center', valign: 'middle', wt: 500}));
    E.push(T(0, 372, W, 22, S.project.proposer || '', {size: 13, color: '#FFFFFF', align: 'center', alpha: .7}));
    chrome(E, {}, P, '#000000');
    return {bg: '#000000', bgImg: MADUP_BG.divider, els: E};
  }
  E.push(R(0, H - 160, W, 160, P.c2, {alpha: .3}));
  const A = S.input.analysis;
  E.push(T(0, 236, W, 100, 'Thank you', {size: 72, bold: true, color: fg, align: 'center', valign: 'middle'}));
  if (A?.logic?.message) E.push(T(200, 346, W - 400, 56, A.logic.message, {size: 17, light: true, color: fg, align: 'center', alpha: .9, lh: 1.5}));
  E.push(T(0, 420, W, 30, S.project.proposer || '', {size: 16, bold: true, color: fg, align: 'center', alpha: .85}));
  chrome(E, {}, P, P.c1);
  return {bg: P.c1, els: E};
}

/* ---------- HTML 렌더 ---------- */
function shapePoints(e){
  const {w, h} = e, d = Math.min(w, h) * .5;
  switch (e.shape){
    case 'chevron': return `0,0 ${w - d},0 ${w},${h / 2} ${w - d},${h} 0,${h} ${d},${h / 2}`;
    case 'home': return `0,0 ${w - d},0 ${w},${h / 2} ${w - d},${h} 0,${h}`;
    case 'arrow': { const hd = Math.min(w * .5, h * .9); return `0,${h * .3} ${w - hd},${h * .3} ${w - hd},0 ${w},${h / 2} ${w - hd},${h} ${w - hd},${h * .7} 0,${h * .7}`; }
    case 'poly': return e.pts.map(p => p.join(',')).join(' ');
    case 'triR': return `0,0 ${w},${h / 2} 0,${h}`;
    case 'cornerTR': return `0,0 ${w},0 ${w},${h}`;
    case 'cornerBR': return `${w},0 ${w},${h} 0,${h}`;
    case 'tri': return `0,${h} ${w / 2},0 ${w},${h}`;
    case 'trap': { const t = e.inset ?? Math.min(w, h) * .25; return `${t},0 ${w - t},0 ${w},${h} 0,${h}`; }
    case 'trap-down': { const t = e.inset ?? Math.min(w, h) * .25; return `0,0 ${w},0 ${w - t},${h} ${t},${h}`; }
  }
  return `0,0 ${w},0 ${w},${h} 0,${h}`;
}
function slideHTML(spec){
  const bg = spec.bgImg ? `background-color:${spec.bg};background-image:url(${spec.bgImg});${spec.fx ? 'background-size:100% 100%;' : ''}` : `background:${spec.bgCss || spec.bg};`;
  let h = `<div class="slide" style="${bg}">`;
  for (const e of spec.els){
    const pos = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${e.alpha != null ? `opacity:${e.alpha};` : ''}`;
    if (e.k === 'g'){ h += fxGeomHTML(e); continue; }
    if (e.k === 'rt'){ h += fxTextHTML(e); continue; }
    if (e.k === 'i' && (e.stretch || e.rot || e.round || e.shd || e.soft)){ h += `<img class="im" style="${pos}${fxTransform(e)}${fxFilter(e)}object-fit:fill;${e.round ? 'border-radius:50%;' : e.r ? `border-radius:${e.r}px;` : ''}" src="${e.data}">`; continue; }
    if (e.k === 'frame'){ if (!EXPORTING) h += `<div class="r" style="${pos}border:2px dashed #F04438;box-sizing:border-box;display:flex;align-items:center;justify-content:center;color:#F04438;font-size:16px">원본 차트 · 이미지로 교체 필요</div>`; }
    else if (e.k === 'r') h += `<div class="r" style="${pos}background:${e.nofill ? 'transparent' : e.fill};${e.r ? `border-radius:${e.r}px;` : ''}${e.line ? (e.dash ? `border:2px dashed ${e.line};box-sizing:border-box;` : `box-shadow:inset 0 0 0 1px ${e.line};`) : ''}"></div>`;
    else if (e.k === 'e') h += `<div class="r" style="${pos}border-radius:50%;background:${e.nofill ? 'transparent' : e.fill};${e.line ? `border:${e.lw || 1}px solid ${e.line};box-sizing:border-box;` : ''}"></div>`;
    else if (e.k === 's') h += `<svg class="r" style="${pos}overflow:visible" width="${e.w}" height="${e.h}" viewBox="0 0 ${e.w} ${e.h}"><polygon points="${shapePoints(e)}" fill="${e.fill}"/></svg>`;
    else if (e.k === 'i') h += `<img class="im" style="${pos}${e.r ? `border-radius:${e.r}px;` : ''}object-fit:${e.cover ? 'cover' : 'contain'}" src="${e.data}">`;
    else if (e.text){
      const {size, paras} = prepText(e);
      const ls = e.ls != null ? e.ls + 'px' : LS_EM + 'em';
      h += `<div class="t" style="${pos}font-size:${size}px;font-weight:${WT(e)};color:${e.color};text-align:${e.align};justify-content:${e.valign === 'middle' ? 'center' : e.valign === 'bottom' ? 'flex-end' : 'flex-start'};line-height:${e.lh};letter-spacing:${ls}">${paras.map((p, i) => `<p style="margin:0 0 ${i < paras.length - 1 ? size * PARA_GAP : 0}px">${p.map(esc).join('<br>')}</p>`).join('')}</div>`;
    }
  }
  return h + '</div>';
}
function thumbHTML(it, w = 320){ const s = w / W; return `<div class="sw-wrap" style="width:${w}px;height:${Math.round(H * s)}px"><div style="transform:scale(${s});transform-origin:0 0;width:${W}px;height:${H}px">${slideHTML(buildSpec(it))}</div></div>`; }

/* ---------- 구성 아이템 ---------- */
function includedSecs(){ return S.sections.filter(s => s.include !== false); }
function secNoOf(sec){ const i = includedSecs().indexOf(sec); return i < 0 ? 0 : i + 1; }
function pageItem(sec, pg, no){ const sn = secNoOf(sec); return {kind: 'page', page: pg, sec, secNo: sn, secTitle: sec.title, label: `${sn ? two(sn) + '  ' : ''}${sec.en ? sec.en.toUpperCase() + '  |  ' : ''}${sec.title}`, no}; }
function sectionItems(sec){ return sec.pageList.map((p, i) => pageItem(sec, p, i + 1)); }
function assemble(){
  const out = [], m = S.merge;
  if (m.cover) out.push({kind: 'cover'});
  if (m.guide) out.push({kind: 'guide'});
  if (m.toc) out.push({kind: 'toc', secs: includedSecs().map(s => ({no: secNoOf(s), title: s.title, goal: s.goal}))});
  includedSecs().forEach(sec => sec.pageList.forEach(p => out.push(pageItem(sec, p, 0))));
  if (m.closing) out.push({kind: 'closing'});
  out.forEach((it, i) => { if (it.kind === 'page') it.no = i + 1; });
  return out;
}

/* =========================================================
   EXPORT — PPTX / PDF
   ========================================================= */
const IN = px => +(px / 96).toFixed(3);
const hx = c => (c || '#000000').replace('#', '').toUpperCase();
const stripData = d => d.replace(/^data:/, '');
const fname = n => `${(S.project.client || 'proposal')}_${n}`.replace(/[\\/:*?"<>|\s]+/g, '_');
/* 가독성 보정 — 본문 영역의 너무 작은 글자를 키우고, 박스가 모자라면 prepText가 원래 크기까지만 줄임 */
const READ_MIN = 13.5;
function readable(spec){
  if (!spec || spec.fx || !spec.els) return spec;
  spec.els = spec.els.map(e => {
    if (e.k !== 't' || !e.text || e.ls != null || e.y < 64 || e.y + e.h > 664) return e;
    if (e.size >= READ_MIN || e.size < 11.5 || e.text.length < 12) return e;
    return {...e, size: READ_MIN, minScale: Math.min(1, e.size * (e.minScale || .62) / READ_MIN)};
  });
  return spec;
}
async function coverCrop(e){ // object-fit:cover 결과를 미리 잘라 PPT에 동일하게
  if (!e.cover || !e.nw) return e.data;
  const im = new Image(); im.src = e.data; await new Promise(r => { im.onload = r; im.onerror = r; if (im.complete) r(); });
  const tr = e.w / e.h, ir = im.naturalWidth / im.naturalHeight; let sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight;
  if (ir > tr){ sw = sh * tr; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / tr; sy = (im.naturalHeight - sh) / 2; }
  const cv = document.createElement('canvas'); cv.width = Math.min(1600, Math.round(sw)); cv.height = Math.round(cv.width / tr);
  cv.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, cv.width, cv.height); return cv.toDataURL('image/jpeg', .9);
}
/* PPT 폰트 모드 — Pretendard(디자인 동일, 설치 필요) / 맑은 고딕(설치 없이 어느 PC에서나 안 깨짐) */
const PPT_FONTS = {
  pretendard: {face: e => e.bold ? 'Pretendard' : e.light ? 'Pretendard Light' : 'Pretendard', lh: 1.2, spc: true, slack: .06, note: 'PPT 다운로드 완료 — 열람 PC에 Pretendard 폰트가 설치돼 있어야 화면과 동일합니다'},
  malgun: {face: () => '맑은 고딕', lh: 1.32, spc: false, slack: .12, note: 'PPT 다운로드 완료 — 맑은 고딕으로 저장해 어느 PC에서나 깨지지 않습니다'}
};
let FM = PPT_FONTS.pretendard;
async function exportPPTX(items, name){
  if (!window.PptxGenJS){ toast('PPT 라이브러리 로딩 실패 — 새로고침 후 다시 시도하세요'); return; }
  busy('PPT 생성 중…', `${items.length}장`); EXPORTING = true;
  try {
    await fontsReady();
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = S.project.proposer || 'MADUP'; pptx.company = S.project.proposer || 'MADUP'; pptx.title = S.project.name || name;
    FM = PPT_FONTS[S.template.pptFont] || PPT_FONTS.pretendard;
    pptx.theme = {headFontFace: FM.face({bold: true}), bodyFontFace: FM.face({light: true})};
    for (const it of items){
      const spec = buildSpec(it), sl = pptx.addSlide();
      sl.background = spec.bgImg ? {data: stripData(spec.bgImg)} : {color: hx(spec.bg)};
      for (const e of spec.els){
        const base = {x: IN(e.x), y: IN(e.y), w: Math.max(.01, IN(e.w)), h: Math.max(.01, IN(e.h))};
        const tr = e.alpha != null ? Math.round((1 - e.alpha) * 100) : 0;
        if (e.k === 'frame') continue;
        if (e.k === 'g' || e.k === 'rt'){ await fxToPPT(sl, pptx, e, IN, hx); continue; }
        if (e.k === 'i' && e.video?.vdata){ sl.addMedia({x: IN(e.x), y: IN(e.y), w: IN(e.w), h: IN(e.h), type: 'video', data: e.video.vdata.replace(/^data:/, ''), cover: e.video.poster || e.data}); continue; }
        if (e.k === 'i' && (e.stretch || e.rot)){ sl.addImage({x: IN(e.x), y: IN(e.y), w: Math.max(.01, IN(e.w)), h: Math.max(.01, IN(e.h)), data: stripData(e.data), ...(e.rot ? {rotate: e.rot} : {}), ...(e.fh ? {flipH: true} : {}), ...(e.fv ? {flipV: true} : {}), ...(e.round ? {rounding: true} : {}), ...(e.shd ? {shadow: {type: 'outer', blur: +(e.shd.blur * .75).toFixed(1), offset: +(e.shd.dist * .75).toFixed(1), angle: Math.round(e.shd.dir), color: hx(e.shd.c), opacity: +(e.shd.a ?? .35).toFixed(2)}} : {})}); continue; }
        if (e.k === 'r') sl.addShape(e.r ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {...base, fill: e.nofill ? {color: 'FFFFFF', transparency: 100} : {color: hx(e.fill), transparency: tr}, line: e.line ? {color: hx(e.line), width: .75, dashType: e.dash ? 'dash' : 'solid'} : {type: 'none'}, ...(e.r ? {rectRadius: IN(Math.min(e.r, Math.min(e.w, e.h) / 2))} : {})});
        else if (e.k === 'e') sl.addShape(pptx.ShapeType.ellipse, {...base, fill: e.nofill ? {color: 'FFFFFF', transparency: 100} : {color: hx(e.fill), transparency: tr}, line: e.line ? {color: hx(e.line), width: (e.lw || 1) * .75} : {type: 'none'}});
        else if (e.k === 's'){
          const pts = shapePoints(e).split(' ').map(q => { const [px, py] = q.split(',').map(Number); return {x: IN(px), y: IN(py)}; });
          sl.addShape(pptx.ShapeType.custGeom, {...base, fill: {color: hx(e.fill), transparency: tr}, line: {type: 'none'}, points: [...pts, {close: true}]});
        }
        else if (e.k === 'i') sl.addImage({...base, data: stripData(await coverCrop(e)), ...(e.r ? {rounding: false} : {})});
        else if (e.text){
          const {size, paras} = prepText(e), pt = +(size * .75).toFixed(1);
          const runs = []; paras.forEach((ls, pi) => ls.forEach((ln, li) => { const last = pi === paras.length - 1 && li === ls.length - 1; runs.push({text: ln || ' ', options: {breakLine: !last, paraSpaceAfter: !last && li === ls.length - 1 ? +(size * PARA_GAP * .75).toFixed(1) : 0}}); }));
          // 폰트 메트릭 차이로 줄이 다시 꺾이지 않도록 정렬 방향으로 여유 폭 확보(슬라이드 밖으로는 안 나감)
          const slack = Math.min(IN(Math.max(12, e.w * (FM.slack))), 1.2), sx = e.align === 'center' ? slack / 2 : e.align === 'right' ? slack : 0;
          const bx = Math.max(0, base.x - sx), bw = Math.min(13.333 - bx, base.w + slack);
          sl.addText(runs, {...base, x: bx, w: bw, fontFace: FM.face(e), fontSize: pt, bold: !!e.bold, color: hx(e.color), align: e.align, valign: e.valign, margin: 0, lineSpacingMultiple: +(e.lh / FM.lh).toFixed(2), transparency: tr, charSpacing: FM.spc ? (e.ls != null ? e.ls * .75 : +(LS_EM * size * .75).toFixed(2)) : (e.ls != null && e.ls > 0 ? e.ls * .75 : 0), lang: 'ko-KR', wrap: paras.reduce((a, q) => a + q.length, 0) > 1, fit: 'none'});
        }
      }
      if (it.page?.notes) sl.addNotes(it.page.notes);
    }
    await pptx.writeFile({fileName: `${fname(name)}.pptx`});
    toast(FM.note, 4600);
  } catch(e){ console.error(e); toast('PPT 생성 오류: ' + e.message); }
  EXPORTING = false; unbusy();
}
async function fontsReady(){ try { await Promise.all(['700', '300', '400'].map(w => document.fonts.load(`${w} 20px Pretendard`))); await document.fonts.ready; MC.clear(); } catch(e){} }
async function exportPDF(items, name){
  if (!window.html2canvas || !window.jspdf){ toast('PDF 라이브러리 로딩 실패 — 새로고침 후 다시 시도하세요'); return; }
  busy('PDF 생성 중…', '폰트·컬러를 고해상도로 고정 렌더링합니다'); EXPORTING = true;
  try {
    await fontsReady();
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF({orientation: 'landscape', unit: 'px', format: [W, H], hotfixes: ['px_scaling'], compress: true});
    const host = $('#offscreen');
    for (let i = 0; i < items.length; i++){
      busy('PDF 생성 중…', `${i + 1} / ${items.length}`);
      host.innerHTML = slideHTML(buildSpec(items[i]));
      const cv = await html2canvas(host.firstChild, {scale: 2, backgroundColor: '#FFFFFF', useCORS: true, logging: false});
      if (i) pdf.addPage([W, H], 'landscape');
      pdf.addImage(cv.toDataURL('image/jpeg', .93), 'JPEG', 0, 0, W, H);
    }
    host.innerHTML = '';
    pdf.save(`${fname(name)}.pdf`);
    toast('PDF 다운로드 완료');
  } catch(e){ console.error(e); toast('PDF 생성 오류: ' + e.message); }
  EXPORTING = false; unbusy();
}
function printPDF(items, name){
  const w = window.open('', '_blank');
  if (!w){ toast('팝업이 차단되었습니다 — 팝업 허용 후 다시 시도'); return; }
  EXPORTING = true; const body = items.map(it => slideHTML(buildSpec(it))).join(''); EXPORTING = false;
  const css = $('#slidecss').textContent;
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(fname(name))}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css"><style>${css}@page{size:1280px 720px;margin:0}html,body{background:#fff;margin:0}.slide{page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${body}<script>document.fonts.ready.then(()=>setTimeout(()=>print(),400))<\/script></body></html>`);
  w.document.close();
}

/* buildSpec 래퍼 — 모든 HTML·PPT·PDF 출력에 가독성 보정 적용 */
const _buildSpec0 = buildSpec;
buildSpec = function(it){ return readable(_buildSpec0(it)); };
