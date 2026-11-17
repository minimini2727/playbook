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
  const km = tpl.mode === 'frame' && pg.tplBody === 'tkSplit' ? '' : pg.keyMsg;
  const keyHide = keyEl && !km ? tpl.els.filter(e => e.k !== 'rt' && e.k !== 'i' && inside2(e, keyEl) && e.h < 90 && e.w * e.h < W * H * .3) : [];
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
      else if (e0.slot === 'key') text = km || '';
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

/* =========================================================
   템플릿 디자인 시스템(TK) — 희망 레이아웃의 디자인 언어(필 헤더·라운드 패널·
   번호 원·퍼널·필 시사점 바·ExtraBold 위계)를 뽑아, 내용에 맞춰 레이아웃을 새로 짬
   ========================================================= */
const TK_NAMES = {tkPillCols: '템플릿: 필 헤더 컬럼', tkKpi: '템플릿: KPI 카드', tkSteps: '템플릿: 단계(번호 원)', tkFunnel: '템플릿: 퍼널+설명 행', tkTable: '템플릿: 필 헤더 표', tkSplit: '템플릿: 핵심 메시지+리스트', tkCompare: '템플릿: AS-IS → TO-BE', tkList: '템플릿: 라운드 행 리스트', tkGrid: '템플릿: 2×N 카드'};
function tkTok(P){
  const p = P.c1 || '#008247';
  return {p, dark: mix(p, '#000000', .45), mid: mix(p, '#000000', .22), soft: mix(p, '#FFFFFF', .88), panel: '#F5F6F5', line: '#E3E6E3', border: '#C8CCC9', ink: '#222222', sub: '#5B5F5B', mute: '#8A8F8A'};
}
const tkStart = (b, tot, k = .38) => b.y + Math.max(0, (b.h - tot) * k);
const tkFit = (b, need, min = .8) => Math.max(min, Math.min(1.12, b.h / Math.max(1, need)));
const TKL = {
  tkPillCols(E, items, b, P){
    const K = tkTok(P), n = Math.min(4, items.length || 1), g = 22, cw = (b.w - (n - 1) * g) / n, iw = cw - 56;
    const bl = items.slice(0, n).map(it => { const l = lines(it.d); return l.length ? l : [it.d || '']; });
    const need0 = Math.max(...bl.map(ls => ls.reduce((a, l) => a + tH(l, 15, iw, 1.5, 500) + 10, 0))) + (items.some(i => i.v) ? 50 : 0) + 44;
    const sc = tkFit({h: b.h - 48}, need0), ph = Math.min(b.h - 48, Math.max(170, need0 * Math.min(1, sc) + 10)), y0 = tkStart(b, 48 + ph);
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), hf = i === n - 1 && n > 2 ? K.p : K.dark;
      E.push(R(x, y0, cw, 34, hf, {r: 17}));
      E.push(T(x + 16, y0, cw - 32, 34, it.h, {size: 15, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', minScale: .7}));
      E.push(R(x, y0 + 48, cw, ph, K.panel, {r: 12, line: K.line}));
      let y = y0 + 48 + 24;
      if (it.v){ E.push(T(x + 28, y, iw, 40, it.v, {size: 30 * Math.min(1, sc), bold: true, color: K.p, lh: 1.2, minScale: .5})); y += 50; }
      bl[i].forEach(l => { const s = 15 * Math.min(1.08, sc), h = tH(l, s, iw - 14, 1.5, 500); if (y + h > y0 + 48 + ph - 12) return; E.push(EL(x + 28, y + s * .55, 6, 6, K.p)); E.push(T(x + 44, y, iw - 16, h, l, {size: s, color: '#333333', lh: 1.5, wt: 500})); y += h + 10; });
    });
  },
  tkKpi(E, items, b, P){
    const K = tkTok(P), n = Math.min(8, items.length || 1), cols = n <= 4 ? n : Math.ceil(n / 2), rows = n <= 4 ? 1 : 2, g = 16;
    const cw = (b.w - (cols - 1) * g) / cols, iw = cw - 40;
    const need = Math.max(...items.slice(0, n).map(it => 22 + tH(it.h, 17, iw, 1.3, 800) + 10 + (it.v ? 50 : 0) + tH(it.d, 13.5, iw, 1.5, 500) + 22));
    const ch = Math.min((b.h - (rows - 1) * g) / rows, Math.max(rows > 1 ? 150 : 200, need)), y0 = tkStart(b, ch * rows + g * (rows - 1));
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = y0 + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, K.panel, {r: 12}));
      let yy = y + 22; const hh = tH(it.h, 17, iw, 1.3, 800);
      E.push(T(x + 20, yy, iw, hh, it.h, {size: 17, bold: true, color: K.ink, lh: 1.3})); yy += hh + 8;
      if (it.v){ E.push(T(x + 20, yy, iw, 44, it.v, {size: 34, bold: true, color: K.p, lh: 1.2, minScale: .45})); yy += 50; }
      E.push(T(x + 20, yy, iw, y + ch - yy - 14, it.d, {size: 13.5, color: K.sub, lh: 1.5, wt: 500}));
    });
  },
  tkSteps(E, items, b, P){
    const K = tkTok(P), n = Math.min(6, items.length || 1), g = 18, cw = (b.w - (n - 1) * g) / n, iw = cw - 36, hi = n - 1;
    const need = Math.max(...items.slice(0, n).map(it => 20 + tH(it.h, 18, iw, 1.3, 800) + 10 + tH(it.d, 14, iw, 1.5, 500) + (it.v ? 44 : 0) + 18));
    const ch = Math.min(b.h - 70, Math.max(150, need + 10)), y0 = tkStart(b, 70 + ch), cy = y0 + 21;
    E.push(R(b.x + cw / 2, cy - 1, (n - 1) * (cw + g), 2, K.p));
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), cx = x + cw / 2, on = i === hi;
      E.push(EL(cx - 21, cy - 21, 42, 42, on ? K.p : '#FFFFFF', {line: K.p, lw: 2}));
      E.push(T(cx - 21, cy - 21, 42, 42, two(i + 1), {size: 13.5, bold: true, color: on ? '#FFFFFF' : K.p, align: 'center', valign: 'middle', lh: 1}));
      const y = y0 + 70;
      E.push(R(x, y, cw, ch, '#FFFFFF', {r: 12, line: on ? K.p : K.border, ...(on ? {lw: 2} : {})}));
      let yy = y + 20; const hh = tH(it.h, 18, iw, 1.3, 800);
      E.push(T(x + 18, yy, iw, hh, it.h, {size: 18, bold: true, color: on ? K.p : K.ink, lh: 1.3})); yy += hh + 10;
      E.push(T(x + 18, yy, iw, y + ch - yy - (it.v ? 52 : 16), it.d, {size: 14, color: K.sub, lh: 1.5, wt: 500}));
      if (it.v){ E.push(R(x + 14, y + ch - 42, cw - 28, 28, on ? K.p : K.soft, {r: 14})); E.push(T(x + 22, y + ch - 42, cw - 44, 28, it.v, {size: 12.5, bold: true, color: on ? '#FFFFFF' : K.p, align: 'center', valign: 'middle', minScale: .6})); }
    });
  },
  tkFunnel(E, items, b, P){
    const K = tkTok(P), n = Math.min(5, items.length || 1), g = 14, rh = Math.min(116, (b.h - (n - 1) * g) / n), fw = Math.min(430, b.w * .36);
    const y0 = tkStart(b, n * rh + (n - 1) * g), rx = b.x + fw + 48, rw = b.x + b.w - rx;
    items.slice(0, n).forEach((it, i) => {
      const y = y0 + i * (rh + g), inset = fw * .12, w0 = fw - i * inset * 2 * .9, x = b.x + (fw - w0) / 2, fill = mix(K.p, '#000000', n > 1 ? i / (n - 1) * .45 : 0);
      E.push(SH('trap-down', x, y, w0, rh, fill, {inset: inset * .9}));
      E.push(T(x + inset + 8, y, w0 - inset * 2 - 16, rh, it.h, {size: 18, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', lh: 1.25, minScale: .6}));
      E.push(R(x + w0 - inset * .5, y + rh / 2, rx - (x + w0 - inset * .5) - 6, 1.5, '#D2D4D2'));
      E.push(R(rx, y, rw, rh, K.panel, {r: 12}));
      const vw = it.v ? Math.min(250, rw * .32) : 0;
      if (it.v) E.push(T(rx + 26, y, vw - 20, rh, it.v, {size: 20, bold: true, color: K.p, valign: 'middle', lh: 1.25, minScale: .55}));
      E.push(T(rx + 26 + vw, y + 10, rw - 52 - vw, rh - 20, it.d, {size: 14.5, color: '#333333', valign: 'middle', lh: 1.5, wt: 500}));
    });
  },
  tkTable(E, items, b, P, pg){
    const K = tkTok(P), hasV = items.some(i => i.v), c1w = Math.min(250, b.w * .22), c3w = hasV ? Math.min(220, b.w * .19) : 0, c2w = b.w - c1w - c3w, hd = 36, g = 6;
    const hs0 = items.map(i => Math.max(tH(i.h, 15, c1w - 40, 1.35, 800), tH(i.d, 14, c2w - 40, 1.5, 500), tH(i.v, 14, c3w - 36, 1.35, 700)) + 22);
    const tot0 = hs0.reduce((a, c) => a + c, 0) + g * items.length, sc = Math.min(1, (b.h - hd - 8) / tot0), grow = sc < 1 ? 1 : Math.min(1.35, (b.h - hd - 8) * .8 / tot0);
    const hs = hs0.map(h => Math.max(sc < 1 ? 20 : 36, h * (sc < 1 ? sc : grow))), fs = Math.max(.7, Math.min(1, sc * 1.05));
    const head = pg.cols || ['구분', '내용', '비고'], y0 = tkStart(b, hd + 8 + hs.reduce((a, c) => a + c + g, 0), .3) - (sc < 1 ? 6 : 0);
    E.push(R(b.x, y0, b.w, hd, K.dark, {r: 18}));
    [[b.x + 22, c1w - 30, head[0]], [b.x + c1w + 20, c2w - 30, head[1]], ...(hasV ? [[b.x + c1w + c2w + 16, c3w - 30, head[2] || '']] : [])].forEach(([x, w, t]) => E.push(T(x, y0, w, hd, t, {size: 13.5, bold: true, color: '#FFFFFF', valign: 'middle'})));
    let y = y0 + hd + 8;
    items.forEach((it, i) => { const rh = hs[i];
      E.push(R(b.x, y, b.w, rh, i % 2 ? '#FFFFFF' : K.panel, {r: 10, ...(i % 2 ? {line: K.line} : {})}));
      E.push(T(b.x + 22, y, c1w - 34, rh, it.h, {size: 15 * fs, bold: true, color: K.ink, valign: 'middle', lh: 1.35}));
      E.push(T(b.x + c1w + 20, y, c2w - 36, rh, it.d, {size: 14 * fs, color: '#3A3D3A', valign: 'middle', lh: 1.5, wt: 500}));
      if (hasV) E.push(T(b.x + c1w + c2w + 16, y, c3w - 30, rh, it.v, {size: 14 * fs, bold: true, color: K.p, valign: 'middle', lh: 1.35}));
      y += rh + g; });
  },
  tkSplit(E, items, b, P, pg){
    const K = tkTok(P), lw = Math.min(370, b.w * .32), rx = b.x + lw + 40, rw = b.w - lw - 40, tw = rw - 58;
    E.push(R(b.x, b.y, lw, b.h, K.p, {r: 14}));
    E.push(T(b.x + 30, b.y + 30, lw - 60, 16, pg.tag || 'KEY MESSAGE', {size: 11, bold: true, color: '#FFFFFF', alpha: .7, ls: .8}));
    E.push(T(b.x + 30, b.y + 58, lw - 60, b.h - 90, pg.keyMsg || pg.subtitle || '', {size: 25, bold: true, color: '#FFFFFF', lh: 1.4, minScale: .6}));
    const hs0 = items.map(i => tH(i.h + (i.v ? '  ' + i.v : ''), 17.5, tw, 1.3, 800) + 6 + tH(i.d, 14, tw, 1.5, 500)), tot = hs0.reduce((a, c) => a + c, 0) + 34 * Math.max(0, items.length - 1);
    const sc = Math.min(1.1, Math.max(.82, b.h / Math.max(1, tot))), gap = Math.min(46, Math.max(20, (b.h - tot * Math.min(1, sc)) / Math.max(1, items.length))); let y = tkStart(b, tot * Math.min(1, sc) + gap * (items.length - 1), .3);
    items.forEach((it, k) => { const hh = tH(it.h + (it.v ? '  ' + it.v : ''), 17.5 * sc, tw, 1.3, 800), dh = tH(it.d, 14 * sc, tw, 1.5, 500);
      E.push(EL(rx, y - 2, 32, 32, '#FFFFFF', {line: K.p, lw: 2})); E.push(T(rx, y - 2, 32, 32, String(k + 1), {size: 13, bold: true, color: K.p, align: 'center', valign: 'middle', lh: 1}));
      E.push(T(rx + 50, y, tw, hh, it.h + (it.v ? '  ' + it.v : ''), {size: 17.5 * sc, bold: true, color: K.ink, lh: 1.3}));
      E.push(T(rx + 50, y + hh + 6, tw, dh + 4, it.d, {size: 14 * sc, color: K.sub, lh: 1.5, wt: 500}));
      y += hh + 6 + dh; if (k < items.length - 1){ E.push(R(rx + 50, y + gap / 2, tw, 1, K.line)); y += gap; } });
  },
  tkCompare(E, items, b, P){
    const K = tkTok(P), lab = 190, g = 44, cw = (b.w - lab - g) / 2, ax = b.x + lab, bx = ax + cw + g;
    const hs0 = items.map(i => Math.max(tH(i.h, 15, lab - 20, 1.35, 800), tH(i.v, 14, cw - 44, 1.5, 500), tH(i.d, 14, cw - 44, 1.5, 600)) + 26), tot = hs0.reduce((a, c) => a + c + 10, 0) + 46;
    const sc = Math.min(1, (b.h) / tot), hs = hs0.map(h => h * (sc < 1 ? sc : Math.min(1.3, b.h * .75 / tot))), y0 = tkStart(b, 46 + hs.reduce((a, c) => a + c + 10, 0), .3);
    E.push(R(ax, y0, cw, 34, K.mute, {r: 17})); E.push(T(ax, y0, cw, 34, 'AS-IS', {size: 14, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', ls: 1}));
    E.push(R(bx, y0, cw, 34, K.p, {r: 17})); E.push(T(bx, y0, cw, 34, 'TO-BE', {size: 14, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', ls: 1}));
    let y = y0 + 46;
    items.forEach((it, i) => { const rh = hs[i];
      E.push(T(b.x, y, lab - 18, rh, it.h, {size: 15, bold: true, color: K.ink, valign: 'middle', lh: 1.35}));
      E.push(R(ax, y, cw, rh, K.panel, {r: 10})); E.push(T(ax + 22, y, cw - 44, rh, it.v || '-', {size: 14, color: K.mute, valign: 'middle', lh: 1.5, wt: 500}));
      E.push(SH('chevron', ax + cw + 14, y + rh / 2 - 9, g - 28, 18, K.p));
      E.push(R(bx, y, cw, rh, K.soft, {r: 10})); E.push(T(bx + 22, y, cw - 44, rh, it.d, {size: 14, bold: true, color: K.dark, valign: 'middle', lh: 1.5}));
      y += rh + 10; });
  },
  tkList(E, items, b, P){
    const K = tkTok(P), lw = Math.min(300, b.w * .27), tw = b.w - lw - 70, g = 12;
    const hs0 = items.map(i => Math.max(tH(i.h, 17, lw - 70, 1.3, 800) + (i.v ? 26 : 0), tH(i.d, 14.5, tw, 1.5, 500)) + 30), tot = hs0.reduce((a, c) => a + c + g, 0);
    const sc = Math.min(1, b.h / tot), grow = sc < 1 ? 1 : Math.min(1.3, b.h * .8 / tot), hs = hs0.map(h => h * (sc < 1 ? sc : grow)), fs = Math.max(.8, Math.min(1.06, sc < 1 ? sc : grow * .95));
    let y = tkStart(b, hs.reduce((a, c) => a + c + g, 0) - g);
    items.forEach((it, i) => { const rh = hs[i];
      E.push(R(b.x, y, b.w, rh, K.panel, {r: 12}));
      E.push(EL(b.x + 22, y + rh / 2 - 16, 32, 32, i === 0 ? K.p : '#FFFFFF', {line: K.p, lw: 2})); E.push(T(b.x + 22, y + rh / 2 - 16, 32, 32, two(i + 1), {size: 12, bold: true, color: i === 0 ? '#FFFFFF' : K.p, align: 'center', valign: 'middle', lh: 1}));
      E.push(T(b.x + 70, y + (it.v ? 4 : 0), lw - 80, rh - (it.v ? 28 : 0), it.h, {size: 17 * fs, bold: true, color: K.p, valign: 'middle', lh: 1.3}));
      if (it.v) E.push(T(b.x + 70, y + rh - 32, lw - 80, 20, it.v, {size: 12.5, bold: true, color: K.mute}));
      E.push(R(b.x + lw + 10, y + 16, 1, rh - 32, K.border));
      E.push(T(b.x + lw + 34, y, tw, rh, it.d, {size: 14.5 * fs, color: '#333333', valign: 'middle', lh: 1.5, wt: 500}));
      y += rh + g; });
  },
  tkGrid(E, items, b, P){
    const K = tkTok(P), n = Math.min(6, items.length || 1), cols = n === 4 ? 2 : 3, rows = Math.ceil(n / cols), g = 16, cw = (b.w - (cols - 1) * g) / cols, ch = (b.h - (rows - 1) * g) / rows, iw = cw - 48;
    items.slice(0, n).forEach((it, i) => { const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, i === 0 ? K.p : K.panel, {r: 12}));
      const fg = i === 0 ? '#FFFFFF' : K.ink;
      E.push(T(x + 24, y + 22, 60, 20, two(i + 1), {size: 13, bold: true, color: i === 0 ? '#FFFFFF' : K.p}));
      if (it.v) E.push(T(x + 80, y + 22, iw - 56, 20, it.v, {size: 12.5, bold: true, color: i === 0 ? '#FFFFFF' : K.p, align: 'right', alpha: i === 0 ? .85 : 1}));
      const hh = tH(it.h, 18, iw, 1.3, 800); E.push(T(x + 24, y + 54, iw, hh, it.h, {size: 18, bold: true, color: fg, lh: 1.3}));
      E.push(T(x + 24, y + 64 + hh, iw, ch - 80 - hh, it.d, {size: 14, color: i === 0 ? '#FFFFFF' : K.sub, alpha: i === 0 ? .9 : 1, lh: 1.5, wt: 500})); });
  }
};
Object.assign(LAY, TKL);
if (typeof LAYOUTS !== 'undefined') Object.assign(LAYOUTS, TK_NAMES);

/* 내용에 맞춰 TK 레이아웃 고르기 (같은 섹션에서 연속 반복 피함) */
function tkPick(p, prev){
  const it = itemsOf(p), n = it.length, lay = p.tplBody && !/^tk/.test(p.tplBody) ? p.tplBody : (p.draft?.layout || p.layout || ''), withV = it.filter(i => i.v && isNum(i.v)).length;
  const c = [];
  if (/funnel|pyramid/.test(lay) && n >= 2 && n <= 5) c.push('tkFunnel');
  if (/compare/.test(lay) && it.some(i => i.v)) c.push('tkCompare');
  if (/process|timeline|vsteps|stepCards|cycle/.test(lay) && n >= 3 && n <= 6) c.push('tkSteps');
  if (/table|summary/.test(lay) || n >= 7) c.push('tkTable');
  if (withV >= Math.max(2, n * .6) && n >= 2 && n <= 8 && it.every(i => (i.d || '').length < 90)) c.push('tkKpi');
  if (/split|spec|hero|quote/.test(lay) && p.keyMsg && n <= 5) c.push('tkSplit');
  if (/twoCol|colCards/.test(lay) || (n >= 2 && n <= 4 && it.some(i => lines(i.d).length > 1))) c.push('tkPillCols');
  if (n >= 3 && n <= 6 && it.every(i => (i.d || '').length < 120)) c.push('tkGrid');
  if (n >= 2 && n <= 6) c.push('tkList', 'tkPillCols');
  if (n >= 3 && n <= 6) c.push('tkSteps');
  c.push('tkTable');
  const u = c.filter((v, i) => c.indexOf(v) === i);
  return u.find(v => v !== prev) || u[0];
}

/* ---------- 템플릿 디자인으로 표지·간지·브릿지·클로징도 통일 ---------- */
function tkFrame(){ return S.design?.useRef ? (S.refLayouts || []).find(t => t.use && t.v === 3 && t.mode === 'frame' && !t.weak && t.tag === 'body') : null; }
function tkChrome(tpl, it, P, opts = {}){ // 템플릿 머리말·꼬리말만
  const pg = {title: '', subtitle: '', keyMsg: '', items: []};
  const sp = designSpec({...it, label: opts.label ?? it.label}, pg, P, {...tpl, mode: 'frame', body: {x: 0, y: 150, w: W, h: 470}});
  sp.els = sp.els.filter(e => !(e.slot === 'title' || e.slot === 'sub'));
  return sp;
}
function tkSectionSpec(it, pg, P, tpl, kind){
  const K = tkTok(P), sp = tkChrome(tpl, it, P, {label: kind === 'divider' ? `${two(it.secNo || 0)} ${String(it.sec?.en || '').toUpperCase()}` : undefined}), E = sp.els;
  if (kind === 'divider'){
    const big = pg.title || it.secTitle || '', sub = pg.subtitle || '';
    E.push(T(MX + 8, 200, 300, 120, two(it.secNo || 0), {size: 110, bold: true, color: K.p, lh: 1}));
    E.push(R(MX + 12, 336, 64, 5, K.p, {r: 2.5}));
    if (it.sec?.en) E.push(T(MX + 12, 360, 700, 26, String(it.sec.en).toUpperCase(), {size: 16, bold: true, color: K.mute, ls: 1.5}));
    E.push(T(MX + 10, 392, W - MX * 2 - 300, 70, big, {size: 46, bold: true, color: K.ink, lh: 1.2, minScale: .6}));
    if (sub) E.push(T(MX + 12, 470, W - MX * 2 - 300, 70, sub, {size: 19, color: K.sub, lh: 1.5, wt: 300}));
    E.push(R(W - MX - 260, 200, 260, 340, K.panel, {r: 16}));
    const list = (it.sec?.pageList || []).filter(p => p.type !== 'divider').slice(0, 6);
    list.forEach((p, i) => { E.push(T(W - MX - 236, 226 + i * 50, 30, 22, two(i + 1), {size: 13, bold: true, color: K.p})); E.push(T(W - MX - 200, 222 + i * 50, 180, 44, p.title || '', {size: 13.5, color: '#333333', lh: 1.35, wt: 500, minScale: .7})); });
    if (!list.length) E.pop();
  } else { // bridge
    const main = pg.keyMsg || pg.title, sub = pg.keyMsg ? (pg.subtitle || pg.title) : pg.subtitle, items = itemsOf(pg);
    const mh = Math.min(170, tH(main, 38, W - 320, 1.35, 800));
    let y = Math.max(170, (H - (mh + 140 + (items.length ? 80 : 0))) / 2);
    E.push(R(W / 2 - 70, y, 140, 32, K.p, {r: 16})); E.push(T(W / 2 - 70, y, 140, 32, it.secTitle || 'KEY POINT', {size: 13, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', minScale: .6})); y += 56;
    E.push(T(160, y, W - 320, mh, main, {size: 38, bold: true, color: K.ink, align: 'center', lh: 1.35})); y += mh + 18;
    if (sub){ E.push(T(200, y, W - 400, 60, sub, {size: 18, color: K.sub, align: 'center', lh: 1.5, wt: 300})); y += 70; }
    if (items.length){ const ws = items.slice(0, 4), cw = 210, x0 = W / 2 - (ws.length * cw + (ws.length - 1) * 14) / 2; ws.forEach((w, i) => { E.push(R(x0 + i * (cw + 14), y, cw, 44, i === ws.length - 1 ? K.p : K.panel, {r: 22})); E.push(T(x0 + i * (cw + 14) + 10, y, cw - 20, 44, w.h || w.d, {size: 14, bold: true, color: i === ws.length - 1 ? '#FFFFFF' : K.dark, align: 'center', valign: 'middle', minScale: .6})); }); }
  }
  return sp;
}
function tkCoverSpec(it, P, tpl, closing){
  const K = tkTok(P), pr = S.project, sp = tkChrome(tpl, {no: 0, label: closing ? 'THANK YOU' : 'PROPOSAL'}, P), E = sp.els.filter(e => e.slot !== 'no');
  if (closing){
    E.push(T(MX, 250, W - MX * 2, 90, 'Thank you', {size: 72, bold: true, color: K.ink, align: 'center', lh: 1.1}));
    E.push(R(W / 2 - 32, 360, 64, 5, K.p, {r: 2.5}));
    E.push(T(MX, 388, W - MX * 2, 30, `${pr.proposer || 'MADUP'}${pr.owner ? '  ·  ' + pr.owner : ''}`, {size: 17, color: K.sub, align: 'center', wt: 500}));
  } else {
    E.push(R(MX + 6, 196, 150, 34, K.p, {r: 17})); E.push(T(MX + 6, 196, 150, 34, 'PROPOSAL', {size: 14, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', ls: 1}));
    E.push(T(MX + 4, 256, W - MX * 2 - 120, 150, pr.name || '퍼포먼스 마케팅 제안', {size: 54, bold: true, color: K.ink, lh: 1.22, minScale: .55}));
    E.push(R(MX + 6, 432, 64, 5, K.p, {r: 2.5}));
    E.push(T(MX + 6, 456, W - MX * 2 - 200, 34, pr.client || '', {size: 22, bold: true, color: K.dark}));
    E.push(T(MX + 6, 496, W - MX * 2 - 200, 28, `${pr.date || ''}${pr.proposer ? '  |  ' + pr.proposer : ''}`, {size: 16, color: K.sub, wt: 300}));
  }
  sp.els = E; return sp;
}

function tkTocSpec(it, P, tpl){
  const K = tkTok(P), sp = tkChrome(tpl, {no: it.no, label: 'INDEX'}, P), E = sp.els, secs = it.secs || [];
  E.push(T(MX, 82, 600, 50, '제안 목차', {size: 33, bold: true, color: '#000000'}));
  E.push(T(MX + 2, 132, 800, 30, S.project.client ? `${S.project.client} · ${S.project.name || ''}` : (S.project.name || ''), {size: 18, color: K.sub, wt: 300}));
  const n = secs.length, cols = n > 6 ? 2 : 1, per = Math.ceil(n / cols), g = 24, cw = (W - MX * 2 - (cols - 1) * g) / cols, rh = Math.min(70, 430 / Math.max(1, per));
  secs.forEach((s, i) => { const c = Math.floor(i / per), r = i % per, x = MX + c * (cw + g), y = 186 + r * rh;
    E.push(R(x, y, cw, rh - 10, r % 2 ? '#FFFFFF' : K.panel, {r: 12, ...(r % 2 ? {line: K.line} : {})}));
    E.push(EL(x + 16, y + (rh - 10) / 2 - 17, 34, 34, i === 0 ? K.p : '#FFFFFF', {line: K.p, lw: 2}));
    E.push(T(x + 16, y + (rh - 10) / 2 - 17, 34, 34, two(s.no), {size: 12.5, bold: true, color: i === 0 ? '#FFFFFF' : K.p, align: 'center', valign: 'middle', lh: 1}));
    E.push(T(x + 66, y, cw * .42, rh - 10, s.title, {size: 17, bold: true, color: K.ink, valign: 'middle', minScale: .7}));
    if (s.goal) E.push(T(x + 66 + cw * .42, y, cw * .58 - 86, rh - 10, s.goal, {size: 13, color: K.sub, valign: 'middle', lh: 1.35, wt: 500, minScale: .7})); });
  return sp;
}
