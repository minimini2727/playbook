/* =========================================================
   희망 레이아웃 — "디자인 그대로" 모드
   · 업로드한 PPT 장표를 도형·폰트·색·위치까지 그대로 읽어오고(readPptx)
   · 제목/부제/시사점/반복 카드(항목) 자리의 문구만 로직 내용으로 바꿔 끼움
   · 원본 문구·수치·샘플 이미지는 쓰지 않음 (채우지 못한 칸은 숨기거나 비움)
   ========================================================= */
const PLACE_RE = /작성|영역|타이틀|title|내용|텍스트|입력|키워드|xx|○○|OO|sample|제목|부제|설명|소제목|서브|코멘트|여기|lorem/i;
const NUMV_RE = /^[\s\d.,%+±\-~약억만천원건배회개명주일월년p×xX:/()↑↓▲▼]+$/;
const DECO_RE = /^\s*(0?\d{1,2}|[›>»→·•|+\-]|STEP\s*\d+)\s*$/i;
const rtStr = e => (e.paras || []).map(p => p.runs.filter(r => r.t !== '\n').map(r => r.t).join('')).join('\n').trim();
const rtRun = e => (e.paras || []).flatMap(p => p.runs).find(r => r.t && r.t.trim() && r.t !== '\n') || e.paras?.[0]?.end || {sz: 14};
const rtSz = e => rtRun(e).sz || 14;
const cOf = e => ({x: e.x + e.w / 2, y: e.y + e.h / 2});
const inside2 = (m, t) => { const c = cOf(t); return c.x >= m.x - 1 && c.x <= m.x + m.w + 1 && c.y >= m.y - 1 && c.y <= m.y + m.h + 1; };

function hsl(c){ const n = parseInt(c.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60; } return {h, s, l}; }
const chromaC = c => { if (!c || !/^#[0-9A-F]{6}$/i.test(c)) return false; const q = hsl(c); return q.s > .22 && q.l > .06 && q.l < .97; };

/* ---------- 업로드 → 디자인 템플릿 ---------- */
async function parseDesignPptx(file, opts = {}){
  const slides = await readPptx(file, opts);
  return slides.map(sl => designTemplate(sl, file.name));
}
function designTemplate(sl, fname){
  const els = sl.els.map(e => ({...e}));
  const texts = els.filter(e => e.k === 'rt' && rtStr(e));
  const big = [...texts].sort((a, b) => rtSz(b) - rtSz(a));
  const dark = sl.bg && hsl(sl.bg).l < .25 && !sl.bgImg;
  const head = texts.filter(t => t.y < H * .2 && rtSz(t) >= 15).sort((a, b) => rtSz(b) - rtSz(a) || a.y - b.y);
  const isDiv = !head.length || (dark && big[0] && rtSz(big[0]) >= 26 && big[0].y > H * .15);
  const title = isDiv ? big[0] : head[0];
  const sub = title && texts.filter(t => t !== title && rtSz(t) < rtSz(title) && t.y >= title.y + title.h * .5 && t.y < title.y + title.h + 70 && Math.abs(cOf(t).x - cOf(title).x) < W * .35 + (title.w / 2)).sort((a, b) => a.y - b.y)[0];
  const label = texts.find(t => t !== title && t !== sub && t.y < (title ? title.y : H * .12) && t.y < H * .12 && rtSz(t) <= 24 && /INDEX|SECTION|작성|영역|목차|CHAPTER/i.test(rtStr(t)));
  const src = texts.find(t => ![title, sub, label].includes(t) && /출처|source/i.test(rtStr(t)) && t.y > H * .6);
  const barOf = t => els.find(e => (e.k === 'g' || e.k === 'r') && (e.fill || e.grad) && e.w > W * .5 && e.h < 90 && inside2(e, t));
  const key = texts.filter(t => t !== title && t !== sub && t !== src && t.y > H * .62 && (t.w > W * .55 || barOf(t)) && rtSz(t) >= 12 && t.y < H * .93).sort((a, b) => b.y - a.y)[0];
  const isNo = t => /^\d{1,3}$/.test(rtStr(t)) && (t.y > H * .88 || t.y < H * .06) && rtSz(t) < 20;
  const isFoot = t => (t.y > H * .91 || t.y + t.h < H * .07) && rtSz(t) < 11;
  const top = Math.max(title ? title.y + title.h - 4 : H * .18, sub ? sub.y + sub.h - 4 : 0), bot = H * .93, botF = Math.min(key ? key.y : H * .93, src ? src.y : H);
  const body = texts.filter(t => ![title, sub, label, key, src].includes(t) && !isNo(t) && !isFoot(t) && cOf(t).y > top && cOf(t).y < bot + 2);

  // 반복 컨테이너(카드) 찾기 — 같은 크기 도형이 2개 이상이고 본문 글을 품은 묶음
  const shapes = els.filter(e => (e.k === 'g' || e.k === 'r') && (e.fill || e.grad || e.line) && e.w > 40 && e.h > 22 && e.w * e.h < W * H * .45 && cOf(e).y > top - 10);
  const groups = {};
  shapes.forEach(s => { const k = `${Math.round(s.w / 10)}x${Math.round(s.h / 10)}`; (groups[k] = groups[k] || []).push(s); });
  let units = [], best = 0;
  Object.values(groups).filter(g => g.length >= 2 && g.length <= 12).forEach(g => {
    const cov = body.filter(t => g.some(s => inside2(s, t))).length;
    const score = cov * 10 + g.length + g[0].w * g[0].h / 1e5;
    if (cov >= g.length && score > best){ best = score; units = g; }
  });
  const rowTol = 20;
  units = [...units].sort((a, b) => Math.abs(a.y - b.y) < rowTol ? a.x - b.x : a.y - b.y);
  const byRow = units.length > 1 && units.every(u => Math.abs(u.y - units[0].y) < rowTol), byCol = units.length > 1 && units.every(u => Math.abs(u.x - units[0].x) < rowTol);
  const uMax = Math.max(14, ...body.filter(t => units.some(u => inside2(u, t))).map(rtSz));
  const near = (u, t) => Math.max(u.x - (t.x + t.w), t.x - (u.x + u.w), u.y - (t.y + t.h), t.y - (u.y + u.h)) < 220;
  const unitOf = t => { let k = units.findIndex(u => inside2(u, t)); if (k >= 0) return k; const c = cOf(t);
    if (rtSz(t) > uMax * 1.15 || PLACE_RE.test(rtStr(t)) && rtStr(t).length > 16) return -1;
    if (byRow) k = units.findIndex(u => c.x >= u.x - 6 && c.x <= u.x + u.w + 6);
    else if (byCol) k = units.findIndex(u => c.y >= u.y - 6 && c.y <= u.y + u.h + 6);
    return k >= 0 && near(units[k], t) ? k : -1; };

  // 슬롯 지정
  const set = (e, o) => Object.assign(e, o);
  if (title) set(title, {slot: 'title'}); if (sub) set(sub, {slot: 'sub'}); if (label) set(label, {slot: 'label'}); if (key) set(key, {slot: 'key'}); if (src) set(src, {slot: 'src'});
  texts.filter(isNo).forEach(t => set(t, {slot: 'no'}));
  const per = units.map(() => []);
  let heroUsed = !!key;
  body.forEach(t => { const k = unitOf(t); if (k >= 0) per[k].push(t); else if (!heroUsed && rtSz(t) >= 30 && !NUMV_RE.test(rtStr(t))){ heroUsed = true; set(t, {slot: 'key', maxH: t.h * 1.2}); } else set(t, {slot: DECO_RE.test(rtStr(t)) ? 'deco' : 'blank'}); });
  per.forEach((list, ui) => {
    list.sort((a, b) => Math.abs(a.y - b.y) < 8 ? a.x - b.x : a.y - b.y);
    const vs = list.filter(t => NUMV_RE.test(rtStr(t)) && /\d/.test(rtStr(t)) && rtStr(t).length <= 14);
    const rest = list.filter(t => !vs.includes(t));
    const deco = rest.filter(t => DECO_RE.test(rtStr(t)));
    const eng = rest.filter(t => /^[A-Z][A-Z\s&]{1,12}$/.test(rtStr(t)) && rtSz(t) <= 13); eng.forEach(t => set(t, {slot: 'blank'}));
    const cand = rest.filter(t => !deco.includes(t) && !eng.includes(t));
    const h = [...cand].sort((a, b) => (rtSz(b) + (rtRun(b).b ? 2 : 0)) - (rtSz(a) + (rtRun(a).b ? 2 : 0)) || a.y - b.y)[0];
    vs.forEach((t, i) => set(t, {slot: 'item', ui, role: i ? 'blankv' : 'v'}));
    deco.forEach(t => set(t, {slot: 'deco'}));
    const ds = cand.filter(t => t !== h);
    if (h) set(h, {slot: 'item', ui, role: 'h'});
    ds.forEach((t, i) => set(t, {slot: 'item', ui, role: 'd', ri: i, rn: ds.length}));
    // 아래로 쓸 수 있는 높이 (다음 글자 상자 또는 카드 바닥까지)
    list.forEach(t => { const below = list.filter(o => o !== t && o.y > t.y + 4 && o.x < t.x + t.w && o.x + o.w > t.x).map(o => o.y); const u = units[ui]; const lim = Math.min(...below, inside2(u, t) ? u.y + u.h - 6 : t.y + t.h * 2.2); t.maxH = Math.max(t.h, lim - t.y - 2); });
  });
  // 카드에 설명 자리가 없으면: 같은 열의 빈 패널(또는 카드 안 남는 공간)에 설명 상자를 만들어 줌
  const panels = Object.values(groups).find(g => g !== units && g.length === units.length && g.every(p => !texts.some(t => inside2(p, t))) && units.every(u => g.some(p => p.x < u.x + u.w && p.x + p.w > u.x && p.y >= u.y - 4)));
  const base = body.find(t => t.slot === 'item' && t.role === 'd') || body.find(t => rtSz(t) <= 16) || title;
  per.forEach((list, ui) => {
    if (list.some(t => t.role === 'd') || !base) return;
    const u = units[ui], pn = panels && panels.find(p => p.x < u.x + u.w && p.x + p.w > u.x);
    const hb = list.find(t => t.role === 'h'), y0 = pn ? pn.y + 22 : (hb ? hb.y + hb.h + 8 : u.y + 16), x0 = pn ? pn.x + 24 : u.x + 16, x1 = pn ? pn.x + pn.w - 24 : u.x + u.w - 16, y1 = pn ? pn.y + pn.h - 18 : u.y + u.h - 12;
    if (y1 - y0 < 40 || x1 - x0 < 80) return;
    const st = {...rtRun(base), sz: 15, b: false, c: hsl(sl.bg || '#FFFFFF').l < .4 ? '#FFFFFF' : '#333333', t: ''};
    const d = {k: 'rt', x: x0, y: y0, w: x1 - x0, h: y1 - y0, ins: [0, 0, 0, 0], anchor: 'top', wrap: true, paras: [{runs: [st], end: st, align: 'left', ln: {m: 1.25}, sb: 0, sa: 6, marL: 16, indent: -16, bu: {ch: '•', c: st.c}}], slot: 'item', ui, role: 'd', ri: 0, rn: 1, maxH: y1 - y0, synth: true};
    els.push(d); list.push(d);
  });
  units.forEach((u, i) => u.unit = i);
  // 다른 브랜드 샘플 이미지 → 이미지 자리로
  els.forEach(e => { if (e.k === 'i' && e.w * e.h > 3000 && cOf(e).y > top && cOf(e).y < botF && !(e.w < 160 && e.h < 50)) e.slot = 'img'; });
  [title, sub, label, key].forEach(t => { if (t) t.maxH = Math.max(t.h, t.slot === 'title' ? t.h * 1.6 : t.h * 1.3); });

  // 주 컬러 3개 (면적 가중)
  const freq = {};
  els.forEach(e => { const a = Math.max(200, e.w * e.h); [e.fill, e.line].forEach(c => { if (chromaC(c)) freq[c] = (freq[c] || 0) + a; }); (e.grad || []).forEach(s => { if (chromaC(s.c)) freq[s.c] = (freq[s.c] || 0) + a / 2; }); if (e.k === 'rt') e.paras.forEach(p => p.runs.forEach(r => { if (chromaC(r.c)) freq[r.c] = (freq[r.c] || 0) + 400; })); });
  const anchors = [];
  Object.entries(freq).sort((a, b) => b[1] - a[1]).forEach(([c]) => { if (anchors.length < 3 && anchors.every(a => Math.min(Math.abs(hsl(a).h - hsl(c).h), 360 - Math.abs(hsl(a).h - hsl(c).h)) > 28)) anchors.push(c); });
  const cnt = {h: units.length, d: per.reduce((a, l) => a + l.filter(t => t.role === 'd').length, 0), v: per.reduce((a, l) => a + l.filter(t => t.role === 'v').length, 0)};
  const blanks = body.filter(t => t.slot === 'blank').length, filled = body.filter(t => t.slot === 'item').length;
  const uSz = body.filter(t => t.slot === 'item').map(rtSz).sort((a, b) => a - b), med = uSz.length ? uSz[Math.floor(uSz.length / 2)] : 14;
  const weak = !isDiv && (dark || units.length && med < 11.5 || units.length && blanks > Math.max(2, filled * .3));
  const _w0 = (dark || med < 11.5 || !units.length || blanks > Math.max(2, filled * .3));
  const zone = [...units, ...body];
  const bodyBox = zone.length ? (() => { const x1 = Math.max(32, Math.min(...zone.map(z => z.x))), x2 = Math.min(W - 32, Math.max(...zone.map(z => z.x + z.w))); return {x: x1, y: top + 14, w: x2 - x1, h: Math.max(160, botF - top - 30)}; })() : {x: MX, y: top + 14, w: W - MX * 2, h: Math.max(160, botF - top - 30)};
  return {id: uid(), name: `${fname.replace(/\.pptx?$/i, '').slice(0, 14)} p${sl.no}`, slideNo: sl.no, tag: isDiv ? 'divider' : 'body', use: false, recolor: true, mode: !isDiv && !units.length ? 'frame' : 'design', weak, body: bodyBox, bodyLayout: 'table', chrome: false,
    bg: sl.bg || '#FFFFFF', bgGrad: sl.bgGrad || null, bgAng: sl.bgAng, bgImg: sl.bgImg || null, els, units: units.length, cnt, anchors, v: 3};
}

/* ---------- 색 바꾸기: 원본 주 컬러 → 제안서 팔레트 (명도 차이는 유지) ---------- */
function recolorFn(tpl, P){
  if (tpl.recolor === false || !tpl.anchors?.length) return c => c;
  const tg = [P.c1, P.c2, P.c3], cache = {};
  const hd = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 360 - d); };
  return c => {
    if (!c || !chromaC(c)) return c; if (cache[c]) return cache[c];
    const q = hsl(c); let bi = 0; tpl.anchors.forEach((a, i) => { if (hd(hsl(a).h, q.h) < hd(hsl(tpl.anchors[bi]).h, q.h)) bi = i; });
    const a = tpl.anchors[bi], la = hsl(a).l, t = tg[bi] || P.c1;
    if (hd(hsl(a).h, q.h) > 40) return cache[c] = c; // 동떨어진 색(경고 빨강 등)은 유지
    const out = q.l >= la ? mix(t, '#FFFFFF', Math.min(.96, (q.l - la) / Math.max(.05, 1 - la))) : mix(t, '#000000', Math.min(.9, (la - q.l) / Math.max(.05, la)));
    return cache[c] = out;
  };
}

/* ---------- 글 바꿔 끼우기 + 박스에 맞게 크기 조절 ---------- */
function rtFill(e, text, maxH){
  const lines0 = String(text).split('\n');
  const paras = lines0.map((ln, i) => { const p = e.paras[Math.min(i, e.paras.length - 1)]; const st = p.runs.find(r => r.t && r.t !== '\n') || p.end; return {...p, runs: [{...st, t: (p.bu ? ln.replace(/^\s*([•·\-–▪■]|\d+[).])\s*/, '') : ln) || ' '}]}; });
  const o = {...e, paras};
  const [l, t, r, b] = e.ins || [0, 0, 0, 0], w = Math.max(10, e.w - l - r), h = Math.max(8, (maxH || e.h) - t - b);
  const s0 = rtSz(o), wt = rtRun(o).b ? 700 : 400, p0 = paras[0];
  const lhOf = s => p0.ln?.px ? p0.ln.px * s / s0 : s * 1.2 * (p0.ln?.m || 1);
  let s = s0;
  const fits = s => e.wrap === false ? Math.max(...lines0.map(x => mw(x, s, wt))) <= w * 1.01 : layoutText(text, s, wt, w).reduce((a, q) => a + q.length, 0) * lhOf(s) + (paras.length - 1) * (p0.sa || 0) <= h * 1.04;
  while (!fits(s) && s > s0 * .55) s *= .94;
  if (s !== s0){ const k = s / s0; o.paras = paras.map(p => ({...p, runs: p.runs.map(r => ({...r, sz: +(r.sz * k).toFixed(2)})), ...(p.ln?.px ? {ln: {px: p.ln.px * k}} : {})})); }
  if (maxH && maxH > e.h && !fits(s0)) o.h = Math.min(maxH, Math.max(e.h, layoutText(text, s, wt, w).reduce((a, q) => a + q.length, 0) * lhOf(s) + t + b + 2));
  return o;
}

/* ---------- 장표 그리기 ---------- */
function designSpec(it, pg, P, tpl){
  const items = itemsOf(pg), rc = recolorFn(tpl, P.draft ? {c1: '#3A3A3A', c2: '#8A8A8A', c3: '#5A5A5A'} : P);
  const units = tpl.els.filter(e => e.unit != null), used = units.filter(u => u.unit < items.length);
  const hideBox = units.filter(u => u.unit >= items.length);
  const keyEl = tpl.els.find(e => e.slot === 'key');
  const keyHide = keyEl && !pg.keyMsg ? tpl.els.filter(e => e.k !== 'rt' && e.k !== 'i' && inside2(e, keyEl) && e.h < 90 && e.w * e.h < W * H * .3) : [];
  const frame = tpl.mode === 'frame' && tpl.body, inBody = e => frame && cOf(e).y > tpl.body.y - 6 && cOf(e).y < tpl.body.y + tpl.body.h + 6 && !['title', 'sub', 'label', 'key', 'no', 'src'].includes(e.slot);
  const imgs = [pg.image, ...(pg.media || []).map(m => m && m.data)].filter(Boolean); let ii = 0;
  const E = [], emptied = [];
  const colorRuns = e => ({...e, paras: e.paras.map(p => ({...p, runs: p.runs.map(r => ({...r, c: rc(r.c)})), end: p.end ? {...p.end, c: rc(p.end.c)} : p.end, ...(p.bu?.c ? {bu: {...p.bu, c: rc(p.bu.c)}} : {})}))});
  const itemVal = (e, item) => {
    if (e.role === 'h') return item.h || '';
    if (e.role === 'v') return item.v || '';
    if (e.role === 'd'){ if (e.rn <= 1) return item.d || ''; const ls = lines(item.d); if (ls.length <= 1) return e.ri === 0 ? item.d || '' : ''; const per = Math.ceil(ls.length / e.rn); return ls.slice(e.ri * per, (e.ri + 1) * per).join('\n'); }
    return '';
  };
  for (const e0 of tpl.els){
    if (inBody(e0)) continue;
    if (!frame && hideBox.some(u => u === e0 || (e0.unit == null && inside2(u, e0) && !used.some(v => inside2(v, e0))))) continue;
    if (!frame && e0.slot === 'item' && e0.ui >= items.length) continue;
    if (keyHide.includes(e0)) continue;
    if (e0.k === 'rt'){
      let text = null;
      if (e0.slot === 'title') text = pg.title || '';
      else if (e0.slot === 'sub') text = pg.subtitle || '';
      else if (e0.slot === 'label') text = String(it.label || it.secTitle || '').split('|')[0].trim();
      else if (e0.slot === 'key') text = pg.keyMsg || '';
      else if (e0.slot === 'no') text = it.no ? two(it.no) : '';
      else if (e0.slot === 'item') text = itemVal(e0, items[e0.ui] || {});
      else if (e0.slot === 'blank') text = '';
      else if (e0.slot === 'src') text = pg.source ? '출처: ' + pg.source : '';
      if (text === null){ E.push(colorRuns(e0)); continue; }
      if (!text){ emptied.push(e0); continue; }
      E.push(colorRuns(rtFill(e0, text, e0.maxH)));
      continue;
    }
    if (e0.slot === 'img'){
      const src = imgs[ii++];
      if (src) E.push({k: 'i', x: e0.x, y: e0.y, w: e0.w, h: e0.h, data: src, cover: true, nw: e0.w, nh: e0.h});
      else { E.push(R(e0.x, e0.y, e0.w, e0.h, P.draft ? '#F2F2F2' : mix(P.c1, '#FFFFFF', .9), {line: P.draft ? '#C4C4C4' : P.tint2, dash: true, r: 6})); if (e0.w > 90 && e0.h > 40) E.push(T(e0.x, e0.y, e0.w, e0.h, '이미지', {size: 12, color: '#98A2B3', align: 'center', valign: 'middle'})); }
      continue;
    }
    if (e0.k === 'g') E.push({...e0, fill: rc(e0.fill), line: rc(e0.line), grad: e0.grad ? e0.grad.map(s => ({...s, c: rc(s.c)})) : e0.grad});
    else E.push({...e0, ...(e0.fill ? {fill: rc(e0.fill)} : {}), ...(e0.line ? {line: rc(e0.line)} : {})});
  }
  // 글이 빠진 작은 칩·라벨 도형은 함께 숨김
  const filledT = E.filter(e => e.k === 'rt');
  for (let i = E.length - 1; i >= 0; i--){ const e = E[i]; if ((e.k === 'g' || e.k === 'r') && e.w * e.h < 14000 && emptied.some(t => inside2(e, t)) && !filledT.some(t => inside2(e, t))) E.splice(i, 1); }
  if (frame){ let box = tpl.body, late = null; const lay = pg.tplBody || tpl.bodyLayout || 'table';
    if ((pg.image || pg.img) && lay !== 'image'){ const bx = imgBoxes(pg, box); if (pg.img?.mode === 'free') late = bx.img; else { imgEl(E, pg, bx.img); box = bx.body; } }
    if (items.length || lay === 'image' || /^cr/.test(lay)) (LAY[lay] || LAY.table)(E, items, box, P, pg);
    if (late) imgEl(E, pg, late); }
  return {bg: rc(tpl.bg) || '#FFFFFF', bgCss: tpl.bgGrad ? gradCSS(tpl.bgGrad.map(s => ({...s, c: rc(s.c)})), tpl.bgAng) : null, bgImg: tpl.bgImg || null, els: E, fx: true};
}

/* ---------- MADUP 기본 템플릿: 대시보드에 내장, 처음 열 때 자동 등록 ---------- */
function loadBuiltinTpls(force){
  if (typeof BUILTIN_TPLS === 'undefined') return 0;
  S.refLayouts = (S.refLayouts || []).filter(t => !t.builtin);
  S.refLayouts.unshift(...BUILTIN_TPLS.map(t => JSON.parse(JSON.stringify(t))));
  S.tplBuiltin = true; S.design = S.design || {}; S.design.useRef = true;
  return BUILTIN_TPLS.length;
}
