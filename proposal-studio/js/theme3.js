/* =========================================================
   디자인 시스템 3 — 전문가형 테마 6종
   · 참고 원칙: 액션 타이틀(결론 한 문장) · 장표당 메시지 하나 · 같은 요소는 같은 자리
     · 출처 표기 · 모노톤 + 포인트 컬러 하나 · 핵심 수치는 크게(벤토/데이터 스토리텔링)
   · 테마 = 토큰(배경·잉크·패널·라운드·헤더·번호·시사점·크롬). 컴포넌트가 토큰을 읽어 그림
   · 로직(초안)도 같은 엔진으로 그려 회색 톤 시안으로 보이고, 워싱하면 테마·컬러가 입혀짐
   ========================================================= */
const DS3 = {
  consult: {name: '컨설팅 (MBB 스타일)', desc: '액션 타이틀 · 섹션 트래커 · 각진 패널 · 출처 각주', bg: '#FFFFFF', ink: '#14213D', sub: '#4B5563', mute: '#8B95A3', panel: '#F3F5F8', line: '#D8DEE6', r: 2, card: 'fill', head: 'bar', num: 'square', key: 'box', chrome: 'consult', tw: 800},
  swiss: {name: '스위스 미니멀', desc: '흰 바탕 · 검정 타이포 · 헤어라인 · 포인트 컬러 1개', bg: '#FFFFFF', ink: '#111111', sub: '#4A4A4A', mute: '#8A8A8A', panel: '#FFFFFF', line: '#D9D9D9', r: 0, card: 'rule', head: 'rule', num: 'plain', key: 'bar', chrome: 'swiss', tw: 800},
  bento: {name: '벤토 그리드', desc: '모듈 카드 · 큰 숫자 · 라운드 · 다크 시사점 카드', bg: '#F1F1EE', ink: '#151515', sub: '#55585C', mute: '#8E9196', panel: '#FFFFFF', line: '#E4E3DE', r: 18, card: 'fill', head: 'pill', num: 'circle', key: 'dark', chrome: 'bento', tw: 800},
  editorial: {name: '에디토리얼', desc: '페이퍼 톤 · 큰 번호 · 인용형 시사점 · 잡지 그리드', bg: '#FAF8F3', ink: '#1B1A17', sub: '#57534B', mute: '#948E82', panel: '#F2EEE5', line: '#DCD5C7', r: 4, card: 'rule', head: 'label', num: 'big', key: 'quote', chrome: 'editorial', tw: 800},
  dark: {name: '다크 프리미엄', desc: '차콜 배경 · 은은한 카드 · 밝은 포인트 컬러', bg: '#0E1116', ink: '#F4F6F8', sub: '#A8B0BB', mute: '#6E7782', panel: '#171C23', line: '#29303A', r: 14, card: 'fill', head: 'pill', num: 'circle', key: 'outline', chrome: 'dark', tw: 800, dark: true},
  madupTpl: {name: 'MADUP 템플릿 (업로드 PPT)', desc: '업로드한 MADUP 장표의 머리말·필 헤더·라운드 패널', bg: '#FFFFFF', ink: '#222222', sub: '#5B5F5B', mute: '#8A8F8A', panel: '#F5F6F5', line: '#E3E6E3', r: 12, card: 'fill', head: 'pill', num: 'circle', key: 'tplbar', chrome: 'tpl', tw: 800}
};
const DS3_DRAFT = {bg: '#FFFFFF', ink: '#2B2B2B', sub: '#5E5E5E', mute: '#9A9A9A', panel: '#F4F4F4', line: '#E2E2E2', r: 8, card: 'fill', head: 'pill', num: 'circle', key: 'box', chrome: 'draft', tw: 800};
const ds3On = () => !!DS3[S.design?.theme];
const ds3Frame = () => (S.refLayouts || []).find(t => t.v === 3 && t.mode === 'frame' && !t.weak && t.tag === 'body') || null;
function ds3Tok(P, draft){
  const t = draft ? DS3_DRAFT : DS3[S.design.theme] || DS3.consult;
  let p = draft ? '#3A3A3A' : (P.c1 || '#1F3A93');
  if (t.dark && lum(p) < .3) p = mix(p, '#FFFFFF', .35);
  if (!t.dark && lum(p) > .62) p = mix(p, '#000000', .3);
  const p2 = draft ? '#7A7A7A' : (P.c2 || mix(p, '#FFFFFF', .4));
  return {...t, p, p2, pDark: t.dark ? mix(p, '#000000', .25) : mix(p, '#000000', .38), soft: mix(p, t.bg, t.dark ? .82 : .9), onP: onC(p), draft: !!draft, theme: draft ? 'draft' : S.design.theme};
}
const ds3P = (K, P) => ({...P, c1: K.p, c2: K.p2, ink: K.ink, tint: K.soft, tint2: K.line, draft: K.draft});

/* ---------------- 컴포넌트 ---------------- */
const cardLine = K => K.dark || K.theme === 'bento' ? {} : {line: K.line}; // 밝은 테마 카드는 헤어라인 테두리로 면 구분
const C3 = {
  card(E, K, x, y, w, h, o = {}){
    const hi = !!o.hi;
    if (K.card === 'rule'){ E.push(R(x, y, w, hi ? 3 : 1.5, hi ? K.p : K.ink)); if (o.fillRule) E.push(R(x, y + 3, w, h - 3, K.panel)); return {on: K.ink, sub: K.sub, pad: 0, top: 18}; }
    if (hi){ const f = K.dark ? mix(K.p, K.bg, .5) : K.p; E.push(R(x, y, w, h, f, {r: K.r})); return {on: onC(f), sub: onC(f), pad: K.r >= 12 ? 24 : 20, top: K.r >= 12 ? 22 : 18, alpha: .86}; }
    E.push(R(x, y, w, h, K.panel, {r: K.r, ...cardLine(K)}));
    return {on: K.ink, sub: K.sub, pad: K.r >= 12 ? 24 : 20, top: K.r >= 12 ? 22 : 18};
  },
  head(E, K, x, y, w, h, text, o = {}){
    const hi = !!o.hi, st = K.head;
    if (st === 'pill'){ const f = hi ? K.p : (K.dark ? '#262D37' : K.pDark); E.push(R(x, y, w, h, f, {r: h / 2})); E.push(T(x + 14, y, w - 28, h, text, {size: 14.5, bold: true, color: onC(f), align: 'center', valign: 'middle', minScale: .65})); return; }
    if (st === 'bar'){ const f = hi ? K.p : K.pDark; E.push(R(x, y, w, h, f, {r: K.r})); E.push(T(x + 14, y, w - 28, h, text, {size: 14, bold: true, color: onC(f), valign: 'middle', minScale: .65})); return; }
    if (st === 'label'){ E.push(T(x, y, w, h, text, {size: 13, bold: true, color: hi ? K.p : K.sub, valign: 'bottom', ls: .6, minScale: .65})); E.push(R(x, y + h + 6, w, 1, K.line)); return; }
    E.push(T(x, y, w, h - 6, text, {size: 15.5, bold: true, color: K.ink, valign: 'bottom', minScale: .65})); E.push(R(x, y + h, w, 2, hi ? K.p : K.ink)); // rule
  },
  num(E, K, cx, cy, d, n, o = {}){
    const on = !!o.on, t = typeof n === 'number' ? two(n) : String(n);
    if (K.num === 'square'){ E.push(R(cx - d / 2, cy - d / 2, d, d, on ? K.p : K.pDark, {r: K.r})); E.push(T(cx - d / 2, cy - d / 2, d, d, t, {size: d * .36, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', lh: 1})); return; }
    if (K.num === 'plain'){ E.push(T(cx - d / 2, cy - d / 2, d * 1.4, d, t, {size: d * .5, bold: true, color: on ? K.p : K.ink, valign: 'middle', lh: 1})); return; }
    if (K.num === 'big'){ E.push(T(cx - d / 2, cy - d * .62, d * 2, d * 1.1, t, {size: d * .82, bold: true, color: K.p, alpha: on ? 1 : .55, valign: 'middle', lh: 1})); return; }
    E.push(EL(cx - d / 2, cy - d / 2, d, d, on ? K.p : K.bg, {line: K.p, lw: 2})); E.push(T(cx - d / 2, cy - d / 2, d, d, t, {size: d * .32, bold: true, color: on ? K.onP : K.p, align: 'center', valign: 'middle', lh: 1}));
  },
  chip(E, K, x, y, w, h, text, o = {}){
    const f = o.hi ? K.p : K.soft; E.push(R(x, y, w, h, f, {r: h / 2, ...(o.hi ? {} : {line: mix(K.p, K.bg, .72)})})); E.push(T(x + 8, y, w - 16, h, text, {size: 12.5, bold: true, color: o.hi ? K.onP : K.p, align: 'center', valign: 'middle', minScale: .6}));
  },
  key(E, K, x, y, w, h, text){
    const st = K.key;
    if (st === 'bar'){ E.push(R(x, y + 4, 4, h - 8, K.p)); E.push(T(x + 22, y, w - 30, h, text, {size: 17, bold: true, color: K.ink, valign: 'middle', minScale: .65})); return; }
    if (st === 'dark'){ E.push(R(x, y, w, h, '#151515', {r: Math.min(K.r, h / 2)})); E.push(EL(x + 22, y + h / 2 - 5, 10, 10, K.p)); E.push(T(x + 44, y, w - 66, h, text, {size: 16.5, bold: true, color: '#FFFFFF', valign: 'middle', minScale: .65})); return; }
    if (st === 'outline'){ E.push(R(x, y, w, h, K.bg, {r: h / 2, line: K.p})); E.push(T(x + 28, y, w - 56, h, text, {size: 16.5, bold: true, color: K.ink, valign: 'middle', minScale: .65})); return; }
    if (st === 'quote'){ E.push(T(x, y - 14, 40, h + 10, '“', {size: 54, bold: true, color: K.p, lh: 1})); E.push(T(x + 44, y, w - 50, h, text, {size: 18, bold: true, color: K.ink, valign: 'middle', minScale: .65})); E.push(R(x + 44, y + h + 4, 80, 2, K.p)); return; }
    if (st === 'tplbar'){ E.push(R(x - 16, y, w + 32, h, K.p, {r: h / 2})); E.push(T(x + 8, y, w - 16, h, text, {size: 16, bold: true, color: K.onP, valign: 'middle', minScale: .65})); return; }
    E.push(R(x, y, w, h, K.soft, {r: K.r})); E.push(R(x, y, 5, h, K.p)); // box
    E.push(T(x + 24, y, 90, h, K.draft ? '시사점' : 'SO WHAT', {size: 11.5, bold: true, color: K.p, valign: 'middle', ls: .8}));
    E.push(T(x + 120, y, w - 140, h, text, {size: 16, bold: true, color: K.ink, valign: 'middle', minScale: .65}));
  }
};

/* ---------------- 크롬(머리말·제목·꼬리말) ---------------- */
const GEO = {x: 60, w: W - 120, titleY: 70, bodyY: 168, keyY: 598, keyH: 46, bodyEnd: 640};
function ds3Logo(E, K, x, y, w, h, align = 'right'){
  const tp = S.template, lg = tp.logo ? {data: tp.logo, w: tp.logoW, h: tp.logoH} : (tp.useDefaultLogo !== false && typeof MADUP_LOGO !== 'undefined' ? {data: K.dark && MADUP_LOGO.white ? MADUP_LOGO.white : MADUP_LOGO.color, w: MADUP_LOGO.w, h: MADUP_LOGO.h} : null);
  if (lg){ const b = fitBox(lg.w, lg.h, x, y, w, h); E.push(IM(align === 'right' ? x + w - b.w : x, b.y, b.w, b.h, lg.data)); }
  else E.push(T(x, y, w, h, S.template.footer || 'MADUP', {size: 13, bold: true, color: K.ink, align, valign: 'middle'}));
}
function ds3Tracker(E, K, cur){
  let secs = typeof includedSecs === 'function' ? includedSecs() : []; if (!secs.length) return;
  if (secs.length > 7){ const ci = Math.max(0, secs.indexOf(cur)), st = Math.max(0, Math.min(secs.length - 7, ci - 3)); secs = secs.slice(st, st + 7); }
  const x0 = GEO.x, w = GEO.w - 150, cw = w / secs.length;
  const ac = lum(K.bg) < .4 ? K.ink : K.p, ic = lum(K.bg) < .4 ? mix(K.ink, K.bg, .45) : K.mute;
  secs.forEach((s, i) => { const on = s === cur; E.push(T(x0 + i * cw, 24, cw - 10, 16, s.title, {size: 10.5, bold: on, color: on ? ac : ic, minScale: .85})); E.push(R(x0 + i * cw, 44, cw - 10, on ? 3 : 1, on ? ac : K.line)); });
}
function ds3Chrome(E, K, it, o = {}){
  const sec = it.sec, lab = it.secNo ? `${two(it.secNo)}  ${(sec?.en || it.secTitle || '').toUpperCase()}` : (o.label || '');
  const no = it.no ? two(it.no) : '';
  const client = `${S.project.client || ''}${S.project.client && S.project.name ? '  ·  ' : ''}${S.project.name || ''}`;
  switch (K.chrome){
    case 'consult':
      if (sec) ds3Tracker(E, K, sec); else E.push(T(GEO.x, 24, 600, 16, lab, {size: 10.5, bold: true, color: K.mute, ls: .6}));
      ds3Logo(E, K, W - GEO.x - 110, 22, 110, 18);
      E.push(T(W - GEO.x - 60, 686, 60, 14, no, {size: 10, bold: true, color: K.ink, align: 'right'}));
      E.push(T(GEO.x, 686, 700, 14, client, {size: 9.5, color: K.mute}));
      break;
    case 'swiss':
      E.push(T(GEO.x, 26, 600, 16, lab, {size: 10.5, bold: true, color: K.ink, ls: 1.2}));
      E.push(R(GEO.x, 50, GEO.w, 1, K.ink));
      ds3Logo(E, K, W - GEO.x - 100, 24, 100, 16);
      E.push(T(GEO.x, 684, 700, 14, client, {size: 9.5, color: K.mute}));
      E.push(T(W - GEO.x - 80, 684, 80, 14, no, {size: 10.5, bold: true, color: K.ink, align: 'right'}));
      break;
    case 'bento':
      if (lab){ const lw = Math.min(420, mw(lab, 11, 700) + lab.length * .6 + 48); E.push(R(GEO.x, 24, lw, 26, K.panel, {r: 13})); E.push(EL(GEO.x + 12, 34, 6, 6, K.p)); E.push(T(GEO.x + 24, 24, lw - 28, 26, lab, {size: 11, bold: true, color: K.ink, valign: 'middle', ls: .5, minScale: .7})); }
      ds3Logo(E, K, W - GEO.x - 150, 28, 100, 18);
      if (no){ E.push(EL(W - GEO.x - 30, 22, 30, 30, K.panel)); E.push(T(W - GEO.x - 30, 22, 30, 30, no, {size: 10.5, bold: true, color: K.ink, align: 'center', valign: 'middle', lh: 1})); }
      E.push(T(GEO.x, 686, 700, 14, client, {size: 9.5, color: K.mute}));
      break;
    case 'editorial':
      E.push(T(GEO.x, 26, 600, 16, lab, {size: 10.5, bold: true, color: K.sub, ls: 1.4}));
      E.push(R(GEO.x, 50, GEO.w, .75, K.line));
      ds3Logo(E, K, W - GEO.x - 100, 24, 100, 16);
      E.push(T(GEO.x, 684, 700, 14, client, {size: 9.5, color: K.mute}));
      E.push(T(W - GEO.x - 120, 684, 120, 14, no ? `P. ${no}` : '', {size: 10, bold: true, color: K.sub, align: 'right', ls: .8}));
      break;
    case 'dark':
      E.push(EL(GEO.x, 31, 7, 7, K.p)); E.push(T(GEO.x + 16, 26, 600, 16, lab, {size: 10.5, bold: true, color: K.sub, ls: 1}));
      ds3Logo(E, K, W - GEO.x - 100, 24, 100, 16);
      E.push(R(GEO.x, 664, GEO.w, 1, K.line));
      E.push(T(GEO.x, 680, 700, 14, client, {size: 9.5, color: K.mute}));
      E.push(T(W - GEO.x - 80, 680, 80, 14, no, {size: 10.5, bold: true, color: K.sub, align: 'right'}));
      break;
    default: // draft
      E.push(T(GEO.x, 26, 600, 16, lab, {size: 10.5, bold: true, color: K.mute, ls: .8}));
      E.push(T(W - GEO.x - 80, 684, 80, 14, no, {size: 10, bold: true, color: K.mute, align: 'right'}));
  }
}
function ds3Title(E, K, pg){
  const tw = GEO.w - (K.chrome === 'editorial' ? 140 : 40);
  let ts = 29; while (ts > 22 && tH(pg.title, ts, tw, 1.25, 800) > ts * 1.3 + 2) ts -= 1;
  const th = Math.min(2, Math.round(tH(pg.title, ts, tw, 1.25, 800) / (ts * 1.25))) > 1 ? ts * 2.5 : ts * 1.3;
  const ty = th > ts * 1.5 ? GEO.titleY - 10 : GEO.titleY;
  E.push(T(GEO.x, ty, tw, th + 4, pg.title, {size: ts, bold: true, color: K.ink, lh: 1.25, minScale: .7}));
  if (pg.subtitle) E.push(T(GEO.x + 1, ty + th + 8, tw, 24, pg.subtitle, {size: 16, color: K.sub, lh: 1.4, wt: 400, minScale: .75}));
  if (K.chrome === 'consult') E.push(R(GEO.x, GEO.bodyY - 16, GEO.w, 1, K.line));
}

/* ---------------- 본문 페이지 ---------------- */
const MEDIA_TK_EARLY = {mediaKpi: 'tkKpiBoard', mediaRoad: 'tkRoad'};
const KEY_SELF = ['tkSplit', 'tkSpec', 'split', 'spec', 'hero', 'cycle', 'hub', 'quote', 'mediaQuad'];
function ds3BodyLayout(pg){
  if (pg.tkLayout && (TKL[pg.tkLayout] || MEDIA3[pg.tkLayout])) return pg.tkLayout;
  if (MEDIA_TK_EARLY[pg.layout]) return MEDIA_TK_EARLY[pg.layout];
  const l = String(pg.layout || '');
  if (l.startsWith('tk') && TKL[l]) return l;
  if (MEDIA_LAYOUTS.includes(l)) return {spec: 'tkSpec', mediaFlow: 'tkFlow', mediaQuad: 'tkQuad', mediaKpi: 'tkKpiBoard', mediaRoad: 'tkRoad'}[l];
  if (/^cr/.test(l) || l === 'image') return l;
  return tkPick({...pg, tplBody: undefined}, '');
}
function ds3PageSpec(it){
  const pg = it.page, draft = !pg.washed, P0 = palette(!draft), K = ds3Tok(P0, draft), P = ds3P(K, P0), E = [], items = itemsOf(pg);
  if (pg.type === 'divider') return ds3Divider(it, K);
  if (pg.type === 'bridge') return ds3Bridge(it, K);
  const lay = ds3BodyLayout(pg), keyOwn = KEY_SELF.includes(lay), showKey = !!pg.keyMsg && !keyOwn;
  if (K.chrome === 'tpl'){ const tf = ds3Frame(); if (tf) return designSpec(it, {...pg, tplBody: lay, _K: K}, P, {...tf, mode: 'frame'}); }
  ds3Chrome(E, K, it);
  ds3Title(E, K, pg);
  const bottom = showKey ? GEO.keyY - 22 : (pg.source ? GEO.bodyEnd - 8 : GEO.bodyEnd);
  let box = {x: GEO.x, y: GEO.bodyY, w: GEO.w, h: bottom - GEO.bodyY};
  if ((pg.image || pg.img) && lay !== 'image' && !/^cr/.test(lay)){ const bx = imgBoxes(pg, box); imgEl(E, pg, bx.img); box = bx.body; }
  if (!items.length && !/^cr|image|quote/.test(lay)) E.push(T(box.x, box.y, box.w, 40, '세부 항목을 추가하세요', {size: 16, color: K.mute}));
  else { const f = TKL[lay] || MEDIA3[lay]; if (f) f(E, items, box, P, pg, K); else { const i0 = E.length; (LAY[lay] || LAY.list)(E, items, box, P, pg); if (K.dark) darkify(E, i0, K); } }
  if (showKey) C3.key(E, K, GEO.x, GEO.keyY, GEO.w, GEO.keyH, pg.keyMsg);
  if (pg.source) E.push(T(GEO.x, showKey ? GEO.keyY + GEO.keyH + 10 : GEO.bodyEnd + 4, GEO.w - 260, 14, '출처: ' + pg.source, {size: 9.5, color: K.mute, minScale: .7}));
  return {bg: K.bg, els: E, ds3: true};
}

/* ---------------- 표지·목차·간지·브릿지·클로징 ---------------- */
function ds3Cover(K, closing){
  const E = [], pr = S.project, A = S.input.analysis, title = pr.name || '퍼포먼스 마케팅 제안', concept = A?.logic?.concept || '';
  const sp = {bg: K.bg, els: E, ds3: true};
  if (closing){
    if (K.chrome === 'consult' || K.chrome === 'dark'){ sp.bg = K.chrome === 'dark' ? K.bg : K.pDark; }
    const fg = onC(sp.bg);
    E.push(T(GEO.x, 260, GEO.w, 90, 'Thank you', {size: 76, bold: true, color: fg, align: 'center', lh: 1.1}));
    E.push(R(W / 2 - 30, 372, 60, 4, K.chrome === 'consult' ? '#FFFFFF' : K.p));
    E.push(T(GEO.x, 396, GEO.w, 28, `${pr.proposer || 'MADUP'}${pr.owner ? '  ·  ' + pr.owner : ''}`, {size: 17, color: fg, alpha: .75, align: 'center'}));
    ds3Logo(E, {...K, dark: lum(sp.bg) < .4}, W / 2 - 60, 600, 120, 22, 'center');
    return sp;
  }
  const meta = `${pr.client || ''}`, date = `${pr.date || ''}${pr.proposer ? '   |   ' + pr.proposer : ''}`;
  switch (K.chrome){
    case 'consult':
      E.push(R(W * .62, 0, W * .38, H, K.pDark));
      E.push(T(W * .62 + 48, 80, W * .38 - 96, 16, 'CONTENTS', {size: 11, bold: true, color: '#FFFFFF', alpha: .6, ls: 1.2}));
      (typeof includedSecs === 'function' ? includedSecs() : []).slice(0, 10).forEach((s, i) => { E.push(T(W * .62 + 48, 116 + i * 46, 40, 20, two(secNoOf(s) || i + 1), {size: 13, bold: true, color: '#FFFFFF', alpha: .55})); E.push(T(W * .62 + 92, 114 + i * 46, W * .38 - 140, 24, s.title, {size: 15, bold: true, color: '#FFFFFF', minScale: .7})); E.push(R(W * .62 + 48, 146 + i * 46, W * .38 - 96, 1, '#FFFFFF', {alpha: .15})); });
      ds3Logo(E, K, GEO.x, 60, 120, 22, 'left');
      E.push(T(GEO.x, 250, W * .62 - 120, 150, title, {size: 46, bold: true, color: K.ink, lh: 1.25, minScale: .6}));
      E.push(R(GEO.x, 420, 60, 4, K.p));
      E.push(T(GEO.x, 444, W * .62 - 120, 30, meta, {size: 22, bold: true, color: K.p}));
      E.push(T(GEO.x, 482, W * .62 - 120, 24, date, {size: 15, color: K.sub}));
      if (concept) E.push(T(GEO.x, 560, W * .62 - 120, 60, concept, {size: 15, color: K.sub, lh: 1.5, minScale: .7}));
      break;
    case 'bento': {
      ds3Logo(E, K, GEO.x, 52, 120, 22, 'left');
      E.push(R(GEO.x, 120, 700, 430, K.panel, {r: K.r}));
      E.push(T(GEO.x + 44, 160, 200, 28, 'PROPOSAL', {size: 12, bold: true, color: K.p, ls: 1.4}));
      E.push(T(GEO.x + 44, 200, 612, 170, title, {size: 46, bold: true, color: K.ink, lh: 1.22, minScale: .6}));
      E.push(T(GEO.x + 44, 446, 612, 30, meta, {size: 21, bold: true, color: K.ink}));
      E.push(T(GEO.x + 44, 484, 612, 24, date, {size: 14.5, color: K.sub}));
      const gx = GEO.x + 720, gw = W - GEO.x - gx;
      E.push(R(gx, 120, gw, 250, K.p, {r: K.r})); E.push(T(gx + 30, 140, gw - 60, 210, concept || meta, {size: 24, bold: true, color: K.onP, lh: 1.35, valign: 'bottom', minScale: .55}));
      E.push(R(gx, 384, (gw - 14) / 2, 166, '#151515', {r: K.r})); E.push(T(gx + 22, 400, (gw - 14) / 2 - 44, 30, 'MADUP', {size: 14, bold: true, color: '#FFFFFF'}));
      E.push(R(gx + (gw + 14) / 2, 384, (gw - 14) / 2, 166, K.soft, {r: K.r})); E.push(T(gx + (gw + 14) / 2 + 22, 400, (gw - 14) / 2 - 44, 30, pr.date || '', {size: 14, bold: true, color: K.p}));
      break; }
    case 'dark':
      sp.bgCss = `radial-gradient(1000px 640px at 88% 18%, ${mix(K.p, K.bg, .55)} 0%, ${K.bg} 62%)`;
      ds3Logo(E, K, GEO.x, 56, 120, 22, 'left');
      E.push(EL(GEO.x, 237, 8, 8, K.p)); E.push(T(GEO.x + 18, 230, 300, 22, 'PROPOSAL', {size: 12, bold: true, color: K.sub, ls: 1.6}));
      E.push(T(GEO.x, 266, 900, 160, title, {size: 54, bold: true, color: K.ink, lh: 1.2, minScale: .55}));
      E.push(T(GEO.x, 456, 900, 30, meta, {size: 22, bold: true, color: K.p}));
      E.push(T(GEO.x, 494, 900, 24, date, {size: 15, color: K.sub}));
      break;
    case 'editorial':
      ds3Logo(E, K, GEO.x, 52, 120, 22, 'left');
      E.push(T(GEO.x, 140, 600, 18, `${pr.client || ''} PROPOSAL  ·  ${(pr.date || '').slice(0, 4)}`, {size: 12, bold: true, color: K.sub, ls: 1.4}));
      E.push(R(GEO.x, 168, GEO.w, 1, K.ink));
      E.push(T(GEO.x, 196, 980, 210, title, {size: 60, bold: true, color: K.ink, lh: 1.15, minScale: .55}));
      E.push(R(GEO.x, 430, GEO.w, 1, K.line));
      E.push(T(GEO.x, 452, 700, 60, concept || meta, {size: 18, color: K.sub, lh: 1.5, minScale: .7}));
      E.push(T(W - GEO.x - 400, 452, 400, 24, meta, {size: 18, bold: true, color: K.p, align: 'right'}));
      E.push(T(W - GEO.x - 400, 484, 400, 22, date, {size: 13.5, color: K.sub, align: 'right'}));
      E.push(T(GEO.x - 6, 520, 1200, 200, 'PROPOSAL', {size: 150, bold: true, color: K.p, alpha: .07, lh: 1}));
      break;
    default: // swiss · draft
      ds3Logo(E, K, GEO.x, 52, 120, 22, 'left');
      E.push(R(GEO.x, 196, 90, 8, K.p));
      E.push(T(GEO.x, 230, 1000, 170, title, {size: 56, bold: true, color: K.ink, lh: 1.18, minScale: .55}));
      E.push(R(GEO.x, 600, GEO.w, 1, K.ink));
      E.push(T(GEO.x, 614, 600, 26, meta, {size: 18, bold: true, color: K.ink}));
      E.push(T(W - GEO.x - 500, 616, 500, 22, date, {size: 13.5, color: K.sub, align: 'right'}));
  }
  return sp;
}
function ds3Toc(it, K){
  const E = [], secs = it.secs || [];
  ds3Chrome(E, K, {no: it.no}, {label: 'CONTENTS'});
  ds3Title(E, K, {title: '제안 목차', subtitle: S.project.client ? `${S.project.client}  ·  ${S.project.name || ''}` : ''});
  const n = secs.length, cols = n > 6 ? 2 : 1, per = Math.ceil(n / cols), g = 40, cw = (GEO.w - (cols - 1) * g) / cols, rh = Math.min(64, 430 / Math.max(1, per));
  secs.forEach((s, i) => { const c = Math.floor(i / per), r = i % per, x = GEO.x + c * (cw + g), y = GEO.bodyY + 6 + r * rh;
    if (K.num === 'big') E.push(T(x, y, 70, rh - 10, two(s.no), {size: 30, bold: true, color: K.p, valign: 'middle', lh: 1}));
    else C3.num(E, K, x + 18, y + (rh - 10) / 2, 34, s.no, {on: i === 0});
    E.push(T(x + 64, y, cw * .44, rh - 10, s.title, {size: 18, bold: true, color: K.ink, valign: 'middle', minScale: .7}));
    if (s.goal) E.push(T(x + 64 + cw * .44, y, cw * .56 - 70, rh - 10, s.goal, {size: 13, color: K.sub, valign: 'middle', lh: 1.35, minScale: .7}));
    E.push(R(x, y + rh - 4, cw, 1, K.line)); });
  return {bg: K.bg, els: E, ds3: true};
}
function ds3Divider(it, K){ // 간지: 섹션 번호·제목만, 가운데 정렬로 좌우 균형 (페이지 목록 패널 없음)
  const E = [], pg = it.page, sec = it.sec, big = pg.title || it.secTitle || '', sub = pg.subtitle || '';
  let bg = K.bg; if (K.chrome === 'consult') bg = K.pDark; if (K.chrome === 'draft') bg = '#2B2B2B'; if (K.chrome === 'bento') bg = K.p;
  const fg = onC(bg), muted = mix(fg, bg, .38);
  const KK = {...K, bg, ink: fg, sub: muted, mute: muted, line: mix(fg, bg, .8), dark: lum(bg) < .4};
  ds3Chrome(E, KK, {...it, no: it.no}, {});
  const accent = lum(bg) < .4 || K.chrome === 'bento' ? fg : K.p, cw = Math.min(900, GEO.w - 120), cx = W / 2 - cw / 2;
  const ts = 46, th = Math.max(1, Math.min(2, Math.round(tH(big, ts, cw, 1.22, 800) / (ts * 1.22)))) * ts * 1.22, sh = sub ? Math.min(3, Math.ceil(tH(sub, 18, cw - 120, 1.55, 400) / 28)) * 28 : 0;
  const ns = K.chrome === 'editorial' ? 132 : 112, tot = ns + 30 + 26 + 18 + th + (sub ? 20 + sh : 0);
  let y = Math.max(110, (H - tot) / 2 - 6);
  E.push(T(cx, y, cw, ns, two(it.secNo || 0), {size: ns, bold: true, color: accent, align: 'center', lh: 1, alpha: K.chrome === 'editorial' ? .9 : 1})); y += ns + 18;
  E.push(R(W / 2 - 28, y, 56, 4, accent, {alpha: .9})); y += 22;
  if (sec?.en){ E.push(T(cx, y, cw, 18, String(sec.en).toUpperCase(), {size: 13, bold: true, color: muted, align: 'center', ls: 1.8})); } y += 30;
  E.push(T(cx, y, cw, th + 4, big, {size: ts, bold: true, color: fg, align: 'center', lh: 1.22, minScale: .6})); y += th + 20;
  if (sub) E.push(T(cx + 60, y, cw - 120, sh + 6, sub, {size: 18, color: muted, align: 'center', lh: 1.55, minScale: .7}));
  return {bg, els: E, ds3: true};
}
function ds3Bridge(it, K){
  const E = [], pg = it.page, items = itemsOf(pg), main = pg.keyMsg || pg.title, sub = pg.keyMsg ? (pg.subtitle || pg.title) : pg.subtitle;
  let bg = K.bg; if (K.chrome === 'bento') bg = '#151515'; if (K.chrome === 'consult') bg = K.soft;
  const fg = lum(bg) < .4 ? '#FFFFFF' : K.ink, muted = lum(bg) < .4 ? '#B8BEC6' : K.sub;
  ds3Chrome(E, {...K, bg, ink: fg, sub: muted, line: mix(fg, bg, .82), dark: lum(bg) < .4}, it);
  const mh = Math.min(190, tH(main, 40, W - 300, 1.35, 800)), tot = 40 + mh + (sub ? 70 : 0) + (items.length ? (items.some(i => i.h && i.d) ? 150 : 70) : 0);
  let y = Math.max(150, 120 + (520 - tot) / 2);
  E.push(T(150, y, W - 300, 22, it.secTitle || '', {size: 13, bold: true, color: K.p, align: 'center', ls: .8})); y += 40;
  E.push(T(150, y, W - 300, mh, main, {size: 40, bold: true, color: fg, align: 'center', lh: 1.35, minScale: .6})); y += mh + 22;
  if (sub){ E.push(T(200, y, W - 400, 50, sub, {size: 18, color: muted, align: 'center', lh: 1.5, minScale: .7})); y += 70; }
  if (items.length){ const ws = items.slice(0, 4), n = ws.length, g = 16, cw = Math.min(300, (W - 240 - (n - 1) * g) / n), x0 = W / 2 - (n * cw + (n - 1) * g) / 2, dk = lum(bg) < .4;
    const ch = Math.min(150, Math.max(64, ...ws.map(w => 44 + (w.d && w.h ? tH(w.d, 14.5, cw - 40, 1.5, 500) : 0))));
    ws.forEach((w, i) => { const x = x0 + i * (cw + g), hi = i === n - 1, f = hi ? K.p : dk ? '#FFFFFF' : K.bg === '#FFFFFF' ? K.panel : '#FFFFFF', on = hi ? onC(K.p) : dk ? '#FFFFFF' : K.ink;
      E.push(R(x, y, cw, ch, f, {r: Math.min(K.r, 14), ...(hi ? {} : dk ? {alpha: .08} : {line: K.line})}));
      E.push(T(x + 20, y + 16, cw - 40, 22, w.h || w.d, {size: 15, bold: true, color: hi ? on : K.p, minScale: .6}));
      if (w.d && w.h) E.push(T(x + 20, y + 44, cw - 40, ch - 54, w.d, {size: 14.5, color: hi ? on : dk ? '#D5DAE0' : K.sub, lh: 1.5, wt: 500, minScale: .7})); }); }
  return {bg, els: E, ds3: true};
}

/* ---------------- 본문 컴포넌트 레이아웃 (모든 테마 공용) ---------------- */
const K3 = (P, pg) => pg?._K || (typeof ds3On === 'function' && ds3On() ? ds3Tok(P, P.draft) : {...DS3.madupTpl, ...(() => { const p = P.c1 || '#008247'; return {p, p2: P.c2 || p, pDark: mix(p, '#000000', .38), soft: mix(p, '#FFFFFF', .9), onP: onC(p)}; })(), draft: !!P.draft, theme: 'madupTpl'});
const fitScale = (avail, need, lo = .78, hi = 1.22) => Math.max(lo, Math.min(hi, avail / Math.max(1, need)));
const bl = d => { const l = lines(d); return l.length ? l : (d ? [d] : []); };
const startY = (b, tot, k = .4) => b.y + Math.max(0, (b.h - tot) * k);
Object.assign(TKL, {
  tkPillCols(E, items, b, P, pg, K = K3(P, pg)){
    const n = Math.min(4, items.length || 1), g = 22, cw = (b.w - (n - 1) * g) / n, hd = 38, iw = cw - 48;
    const need = Math.max(...items.slice(0, n).map(it => (it.v ? 56 : 0) + bl(it.d).reduce((a, l) => a + tH(l, 15, iw - 18, 1.5, 500) + 10, 0))) + 48;
    const sc = fitScale(b.h - hd - 14, need, .8, 1.15), ph = Math.min(b.h - hd - 14, Math.max(180, need * Math.min(1, sc) + 20)), y0 = startY(b, hd + 14 + ph);
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), hi = i === n - 1 && n > 2;
      C3.head(E, K, x, y0, cw, hd, it.h, {hi});
      const c = C3.card(E, K, x, y0 + hd + 14, cw, ph, {fillRule: true});
      let y = y0 + hd + 14 + c.top + 4; const ix = x + (c.pad || 0) + (K.card === 'rule' ? 0 : 0), w2 = cw - (c.pad || 0) * 2;
      if (it.v){ E.push(T(ix, y, w2, 44, it.v, {size: 34 * Math.min(1.08, sc), bold: true, color: K.p, lh: 1.15, minScale: .5})); y += 54; }
      bl(it.d).forEach(l => { const s = 15 * Math.min(1.1, sc), h = tH(l, s, w2 - 18, 1.5, 500); if (y + h > y0 + hd + 14 + ph - 10) return; E.push(R(ix, y + s * .62, 6, 6, K.p, {r: K.card === 'rule' ? 0 : 3})); E.push(T(ix + 18, y, w2 - 18, h + 2, l, {size: s, color: c.on, lh: 1.5, wt: 500})); y += h + 10; });
    });
  },
  tkKpi(E, items, b, P, pg, K = K3(P, pg)){
    const n = Math.min(8, items.length || 1), cols = n <= 4 ? n : Math.ceil(n / 2), rows = n <= 4 ? 1 : 2, g = 18, cw = (b.w - (cols - 1) * g) / cols;
    const big = rows === 1, vs = big ? (n <= 3 ? 52 : 44) : 32;
    const ch = rows === 1 ? Math.min(b.h, Math.max(240, b.h * .66)) : (b.h - g) / 2, y0 = startY(b, ch * rows + g * (rows - 1));
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = y0 + Math.floor(i / cols) * (ch + g), hi = big && i === 0 && K.card === 'fill' && !K.draft;
      const c = C3.card(E, K, x, y, cw, ch, {hi, fillRule: true}), px = x + (c.pad || 0), iw = cw - (c.pad || 0) * 2;
      const hs = big ? 18 : 15.5, hh = tH(it.h, hs, iw, 1.3, 800), dh = Math.min(tH(it.d, 14, iw, 1.5, 500), ch * .38);
      E.push(T(px, y + c.top, iw, hh + 2, it.h, {size: hs, bold: true, color: c.on, lh: 1.3, minScale: .7}));
      if (it.v) E.push(T(px, y + ch - dh - (c.pad ? 22 : 12) - vs * 1.3 - 4, iw, vs * 1.3, it.v, {size: vs, bold: true, color: hi ? c.on : K.p, lh: 1.2, minScale: .4, valign: 'bottom'}));
      E.push(R(px, y + ch - dh - (c.pad ? 22 : 12) - 4, Math.min(iw, 40), 2, hi ? c.on : K.p, {alpha: hi ? .6 : 1}));
      E.push(T(px, y + ch - dh - (c.pad ? 18 : 8), iw, dh + 2, it.d, {size: 14, color: hi ? c.on : c.sub, alpha: hi ? .88 : 1, lh: 1.5, wt: 500, minScale: .75}));
    });
  },
  tkSteps(E, items, b, P, pg, K = K3(P, pg)){
    const n = Math.min(6, items.length || 1), g = 18, cw = (b.w - (n - 1) * g) / n, iw = cw - 40, hi = n - 1;
    const need = Math.max(...items.slice(0, n).map(it => 22 + tH(it.h, 18, iw, 1.3, 800) + 12 + tH(it.d, 14.5, iw, 1.5, 500) + (it.v ? 48 : 0) + 20));
    const ch = Math.min(b.h - 74, Math.max(170, need + 16)), y0 = startY(b, 74 + ch), cy = y0 + 22;
    if (K.num !== 'plain' && K.num !== 'big') E.push(R(b.x + cw / 2, cy - 1, (n - 1) * (cw + g), 2, K.p, {alpha: K.draft ? .5 : 1}));
    items.slice(0, n).forEach((it, i) => {
      const x = b.x + i * (cw + g), cx = x + cw / 2, on = i === hi;
      C3.num(E, K, K.num === 'big' || K.num === 'plain' ? x + 22 : cx, cy, 44, i + 1, {on});
      const y = y0 + 74, c = K.card === 'rule' ? C3.card(E, K, x, y, cw, ch, {hi: on}) : (E.push(R(x, y, cw, ch, K.dark ? K.panel : K.bg === '#FFFFFF' && K.panel === '#FFFFFF' ? '#FFFFFF' : K.panel, {r: K.r, line: on ? K.p : K.line, ...(on ? {lw: 2} : {})})), {on: K.ink, sub: K.sub, pad: 20, top: 20});
      const px = x + (c.pad || 0), w2 = cw - (c.pad || 0) * 2;
      let yy = y + c.top; const hh = tH(it.h, 18, w2, 1.3, 800);
      E.push(T(px, yy, w2, hh + 2, it.h, {size: 18, bold: true, color: on ? K.p : c.on, lh: 1.3, minScale: .7})); yy += hh + 12;
      E.push(T(px, yy, w2, y + ch - yy - (it.v ? 52 : 14), it.d, {size: 14.5, color: c.sub, lh: 1.5, wt: 500, minScale: .72}));
      if (it.v) C3.chip(E, K, px, y + ch - 44, w2, 30, it.v, {hi: on});
    });
  },
  tkFunnel(E, items, b, P, pg, K = K3(P, pg)){
    const n = Math.min(5, items.length || 1), g = 14, rh = Math.min(118, (b.h - (n - 1) * g) / n), fw = Math.min(420, b.w * .35), y0 = startY(b, n * rh + (n - 1) * g), rx = b.x + fw + 44, rw = b.x + b.w - rx;
    items.slice(0, n).forEach((it, i) => {
      const y = y0 + i * (rh + g), inset = fw * .11, w0 = fw - i * inset * 1.8, x = b.x + (fw - w0) / 2, fill = mix(K.p, K.dark ? '#000000' : '#000000', n > 1 ? i / (n - 1) * .42 : 0);
      E.push(SH('trap-down', x, y, w0, rh, fill, {inset: inset * .9}));
      E.push(T(x + inset + 6, y, w0 - inset * 2 - 12, rh, it.h, {size: 18, bold: true, color: onC(fill), align: 'center', valign: 'middle', lh: 1.25, minScale: .55}));
      E.push(R(x + w0 - inset * .45, y + rh / 2, rx - (x + w0 - inset * .45) - 6, 1.5, K.line));
      const c = C3.card(E, K, rx, y, rw, rh, {fillRule: true}), px = rx + (c.pad || 0), vw = it.v ? Math.min(240, rw * .3) : 0;
      if (it.v) E.push(T(px, y + 4, vw - 18, rh - 8, it.v, {size: 21, bold: true, color: K.p, valign: 'middle', lh: 1.25, minScale: .5}));
      E.push(T(px + vw, y + 8, rw - (c.pad || 0) * 2 - vw, rh - 16, it.d, {size: 15, color: c.on, valign: 'middle', lh: 1.5, wt: 500, minScale: .7}));
    });
  },
  tkTable(E, items, b, P, pg, K = K3(P, pg)){
    const hasV = items.some(i => i.v), c1w = Math.min(260, b.w * .23), c3w = hasV ? Math.min(230, b.w * .2) : 0, c2w = b.w - c1w - c3w, hd = 38, g = items.length > 8 ? 2 : 6, pad = items.length > 8 ? 10 : 22;
    const hs0 = items.map(i => Math.max(tH(i.h, 15, c1w - 40, 1.35, 800), tH(i.d, 14.5, c2w - 40, 1.5, 500), tH(i.v, 15, c3w - 36, 1.35, 800)) + pad);
    const tot0 = hs0.reduce((a, c) => a + c, 0), avail = b.h - hd - 8 - g * items.length, sc = Math.min(1, avail / tot0), grow = sc < 1 ? 1 : Math.min(1.4, avail * .86 / tot0);
    const hs = hs0.map(h => Math.max(sc < 1 ? 16 : 40, h * (sc < 1 ? sc : grow))), fs = Math.max(.7, Math.min(1.06, sc < 1 ? sc * 1.05 : 1 + (grow - 1) * .25));
    const head = pg.cols || ['구분', '내용', '비고'], y0 = startY(b, hd + 8 + hs.reduce((a, c) => a + c + g, 0), .3) - (sc < 1 ? 6 : 0);
    if (K.head === 'rule' || K.head === 'label'){ E.push(R(b.x, y0 + hd - 2, b.w, 2, K.ink)); }
    else E.push(R(b.x, y0, b.w, hd, K.pDark, {r: K.head === 'pill' ? hd / 2 : K.r}));
    const hc = K.head === 'rule' || K.head === 'label' ? K.ink : onC(K.pDark);
    [[b.x + 20, c1w - 30, head[0]], [b.x + c1w + 20, c2w - 30, head[1]], ...(hasV ? [[b.x + c1w + c2w + 16, c3w - 30, head[2] || '']] : [])].forEach(([x, w, t]) => E.push(T(x, y0, w, hd, t, {size: 13.5, bold: true, color: hc, valign: 'middle'})));
    let y = y0 + hd + 8;
    items.forEach((it, i) => { const rh = hs[i];
      if (K.card === 'rule') E.push(R(b.x, y + rh + g / 2 - .5, b.w, 1, K.line));
      else E.push(R(b.x, y, b.w, rh, i % 2 ? (K.dark ? K.bg : K.bg === '#FFFFFF' ? '#FFFFFF' : K.bg) : K.panel, {r: Math.min(K.r, 10), ...(i % 2 && !K.dark ? {line: K.line} : {})}));
      E.push(T(b.x + 20, y, c1w - 32, rh, it.h, {size: 15 * fs, bold: true, color: K.ink, valign: 'middle', lh: 1.35, minScale: .7}));
      E.push(T(b.x + c1w + 20, y, c2w - 36, rh, it.d, {size: 14.5 * fs, color: K.sub, valign: 'middle', lh: 1.5, wt: 500, minScale: .7}));
      if (hasV) E.push(T(b.x + c1w + c2w + 16, y, c3w - 30, rh, it.v, {size: 15 * fs, bold: true, color: K.p, valign: 'middle', lh: 1.35, minScale: .6}));
      y += rh + g; });
  },
  tkSplit(E, items, b, P, pg, K = K3(P, pg)){
    const lw = Math.min(380, b.w * .33), rx = b.x + lw + 44, rw = b.w - lw - 44, tw = rw - 60;
    const panelFill = K.card === 'rule' ? K.ink : K.dark ? mix(K.p, K.bg, .5) : K.p, pf = onC(panelFill);
    E.push(R(b.x, b.y, lw, b.h, panelFill, {r: K.r}));
    E.push(T(b.x + 32, b.y + 30, lw - 64, 16, pg.tag || 'KEY MESSAGE', {size: 11, bold: true, color: pf, alpha: .7, ls: 1}));
    E.push(T(b.x + 32, b.y + 60, lw - 64, b.h - 96, pg.keyMsg || pg.subtitle || '', {size: 27, bold: true, color: pf, lh: 1.38, minScale: .55}));
    const rows = items.map(i => ({t: i.h + (i.v ? '   ' + i.v : ''), d: i.d})), hs0 = rows.map(r => tH(r.t, 18, tw, 1.3, 800) + 8 + tH(r.d, 15, tw, 1.5, 500));
    const tot = hs0.reduce((a, c) => a + c, 0), sc = fitScale(b.h - 30 * (rows.length - 1), tot, .76, 1.15), gap = Math.min(48, Math.max(18, (b.h - tot * Math.min(1, sc)) / Math.max(1, rows.length)));
    let y = startY(b, tot * Math.min(1.1, sc) + gap * (rows.length - 1), .35);
    rows.forEach((r, k) => { const hh = tH(r.t, 18 * sc, tw, 1.3, 800), dh = tH(r.d, 15 * sc, tw, 1.5, 500);
      C3.num(E, K, rx + 17, y + 13, 34, k + 1, {on: false});
      E.push(T(rx + 56, y, tw, hh + 2, r.t, {size: 18 * sc, bold: true, color: K.ink, lh: 1.3}));
      E.push(T(rx + 56, y + hh + 8, tw, dh + 4, r.d, {size: 15 * sc, color: K.sub, lh: 1.5, wt: 500}));
      y += hh + 8 + dh; if (k < rows.length - 1){ E.push(R(rx + 56, y + gap / 2, tw, 1, K.line)); y += gap; } });
  },
  tkCompare(E, items, b, P, pg, K = K3(P, pg)){
    const lab = 200, g = 46, cw = (b.w - lab - g) / 2, ax = b.x + lab, bx = ax + cw + g;
    const hs0 = items.map(i => Math.max(tH(i.h, 15.5, lab - 22, 1.35, 800), tH(i.v, 14.5, cw - 48, 1.5, 500), tH(i.d, 14.5, cw - 48, 1.5, 700)) + 28), tot = hs0.reduce((a, c) => a + c + 10, 0) + 50;
    const sc = Math.min(1, b.h / tot), hs = hs0.map(h => h * (sc < 1 ? sc : Math.min(1.35, b.h * .8 / tot))), y0 = startY(b, 50 + hs.reduce((a, c) => a + c + 10, 0), .3);
    const mutedHead = {...K, pDark: K.dark ? '#3A424D' : '#8A9099', p: K.p};
    C3.head(E, mutedHead, ax, y0, cw, 36, 'AS-IS', {}); C3.head(E, K, bx, y0, cw, 36, 'TO-BE', {hi: true});
    let y = y0 + 50;
    items.forEach((it, i) => { const rh = hs[i];
      E.push(T(b.x, y, lab - 20, rh, it.h, {size: 15.5, bold: true, color: K.ink, valign: 'middle', lh: 1.35, minScale: .7}));
      E.push(R(ax, y, cw, rh, K.panel, {r: Math.min(K.r, 12), ...cardLine(K)})); E.push(T(ax + 24, y, cw - 48, rh, it.v || '-', {size: 14.5, color: K.mute, valign: 'middle', lh: 1.5, wt: 500, minScale: .7}));
      E.push(SH('chevron', ax + cw + 15, y + rh / 2 - 9, g - 30, 18, K.p));
      E.push(R(bx, y, cw, rh, K.soft, {r: Math.min(K.r, 12)})); E.push(T(bx + 24, y, cw - 48, rh, it.d, {size: 14.5, bold: true, color: K.dark ? K.ink : K.pDark, valign: 'middle', lh: 1.5, minScale: .7}));
      y += rh + 10; });
  },
  tkList(E, items, b, P, pg, K = K3(P, pg)){
    const lw = Math.min(320, b.w * .28), tw = b.w - lw - 76, g = K.card === 'rule' ? 0 : 12;
    const hs0 = items.map(i => Math.max(tH(i.h, 17.5, lw - 80, 1.3, 800) + (i.v ? 28 : 0), tH(i.d, 15, tw, 1.5, 500)) + 32), tot = hs0.reduce((a, c) => a + c + g, 0);
    const sc = Math.min(1, b.h / tot), grow = sc < 1 ? 1 : Math.min(1.3, b.h * .82 / tot), hs = hs0.map(h => h * (sc < 1 ? sc : grow)), fs = Math.max(.78, Math.min(1.08, sc < 1 ? sc : 1 + (grow - 1) * .35));
    let y = startY(b, hs.reduce((a, c) => a + c + g, 0) - g);
    items.forEach((it, i) => { const rh = hs[i];
      if (K.card === 'rule') E.push(R(b.x, y, b.w, i ? 1 : 2, i ? K.line : K.ink)); else E.push(R(b.x, y, b.w, rh, K.panel, {r: K.r, ...cardLine(K)}));
      C3.num(E, K, b.x + 38, y + rh / 2, 34, i + 1, {on: i === 0});
      E.push(T(b.x + 76, y + (it.v ? 6 : 0), lw - 80, rh - (it.v ? 34 : 0), it.h, {size: 17.5 * fs, bold: true, color: K.num === 'plain' ? K.ink : K.p, valign: 'middle', lh: 1.3, minScale: .7}));
      if (it.v) E.push(T(b.x + 76, y + rh - 34, lw - 80, 20, it.v, {size: 13, bold: true, color: K.mute, minScale: .6}));
      E.push(R(b.x + lw + 12, y + 16, 1, rh - 32, K.line));
      E.push(T(b.x + lw + 36, y, tw, rh, it.d, {size: 15 * fs, color: K.sub, valign: 'middle', lh: 1.5, wt: 500, minScale: .72}));
      y += rh + g; });
  },
  tkGrid(E, items, b, P, pg, K = K3(P, pg)){
    const n = Math.min(6, items.length || 1), cols = n === 4 ? 2 : Math.min(3, n), rows = Math.ceil(n / cols), g = 16, cw = (b.w - (cols - 1) * g) / cols, ch = (b.h - (rows - 1) * g) / rows;
    items.slice(0, n).forEach((it, i) => { const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g), hi = i === 0 && K.card === 'fill' && !K.draft;
      const c = C3.card(E, K, x, y, cw, ch, {hi, fillRule: true}), px = x + (c.pad || 0), iw = cw - (c.pad || 0) * 2;
      E.push(T(px, y + c.top, 60, 20, two(i + 1), {size: 13, bold: true, color: hi ? c.on : K.p}));
      if (it.v) E.push(T(px + 60, y + c.top, iw - 60, 20, it.v, {size: 13, bold: true, color: hi ? c.on : K.p, align: 'right', minScale: .6}));
      const hh = tH(it.h, 19, iw, 1.3, 800); E.push(T(px, y + c.top + 32, iw, hh + 2, it.h, {size: 19, bold: true, color: c.on, lh: 1.3, minScale: .7}));
      E.push(T(px, y + c.top + 44 + hh, iw, ch - c.top - 58 - hh, it.d, {size: 14.5, color: hi ? c.on : c.sub, alpha: hi ? .9 : 1, lh: 1.5, wt: 500, minScale: .72})); });
  },
  tkBars(E, items, b, P, pg, K = K3(P, pg)){ // 막대 하나만 강조(나머지 회색) — 데이터 스토리텔링
    const vals = items.map(i => parseFloat(String(i.v).replace(/[^\d.\-]/g, '')) || 0), mx = Math.max(...vals, 1), top = vals.indexOf(Math.max(...vals));
    const lw = Math.min(250, b.w * .22), bw = b.w * .5, dw = b.w - lw - bw - 40, rh = Math.min(64, (b.h - 8 * (items.length - 1)) / items.length), y0 = startY(b, items.length * (rh + 8));
    items.forEach((it, i) => { const y = y0 + i * (rh + 8), w2 = Math.max(6, bw * vals[i] / mx), on = i === top;
      E.push(T(b.x, y, lw - 16, rh, it.h, {size: 15.5, bold: true, color: K.ink, valign: 'middle', align: 'right', minScale: .65}));
      E.push(R(b.x + lw, y + rh * .2, w2, rh * .6, on ? K.p : (K.dark ? '#3A424D' : '#C9CED6'), {r: Math.min(4, K.r)}));
      E.push(T(b.x + lw + w2 + 10, y, 120, rh, it.v, {size: 17, bold: true, color: on ? K.p : K.sub, valign: 'middle', minScale: .6}));
      E.push(T(b.x + lw + bw + 40, y, dw, rh, it.d, {size: 14, color: K.sub, valign: 'middle', lh: 1.45, wt: 500, minScale: .7})); });
  },
  tkHero(E, items, b, P, pg, K = K3(P, pg)){
    const [h0, ...rest] = items, lw = b.w * .42;
    if (K.card !== 'rule') E.push(R(b.x, b.y, lw, b.h, K.panel, {r: K.r, ...cardLine(K)})); else E.push(R(b.x, b.y, lw, 3, K.p));
    E.push(T(b.x + 36, b.y + 34, lw - 72, 24, h0.h, {size: 17, bold: true, color: K.ink, minScale: .7}));
    E.push(T(b.x + 32, b.y + 70, lw - 64, Math.min(170, b.h * .45), h0.v || '', {size: 84, bold: true, color: K.p, lh: 1.05, minScale: .4}));
    E.push(T(b.x + 36, b.y + b.h - 120, lw - 72, 96, h0.d, {size: 15, color: K.sub, lh: 1.5, wt: 500, valign: 'bottom', minScale: .7}));
    TKL.tkList(E, rest.length ? rest : [h0], {x: b.x + lw + 32, y: b.y, w: b.w - lw - 32, h: b.h}, P, pg, K);
  }
});
Object.assign(LAY, TKL);
Object.assign(TK_NAMES, {tkBars: '템플릿: 막대 강조', tkHero: '템플릿: 큰 숫자 + 근거'});
if (typeof LAYOUTS !== 'undefined') Object.assign(LAYOUTS, TK_NAMES);

/* ---------------- 매체 실행안 3종 ---------------- */
const isMethod = h => /운영\s*방법|운영 방식|실행 방법|실행안|방법/.test(h || ''), isBudget = h => /예산|일정/.test(h || '');
const MEDIA3 = {
  tkSpec(E, items, b, P, pg, K = K3(P, pg)){
    const lw = Math.min(330, b.w * .28), rx = b.x + lw + 40, rw = b.w - lw - 40, labW = 118;
    const pf = K.card === 'rule' ? K.ink : K.dark ? mix(K.p, K.bg, .5) : K.p, pc = onC(pf);
    E.push(R(b.x, b.y, lw, b.h, pf, {r: K.r}));
    E.push(T(b.x + 30, b.y + 28, lw - 60, 16, pg.tag || pg.mediaName || 'MEDIA', {size: 11, bold: true, color: pc, alpha: .72, ls: 1, minScale: .6}));
    E.push(T(b.x + 30, b.y + 56, lw - 60, b.h - 150, pg.keyMsg || '', {size: 25, bold: true, color: pc, lh: 1.38, minScale: .55}));
    const bud = items.find(i => isBudget(i.h)); if (bud){ E.push(R(b.x + 30, b.y + b.h - 86, lw - 60, 1, pc, {alpha: .3})); E.push(T(b.x + 30, b.y + b.h - 72, lw - 60, 16, bud.h, {size: 11, bold: true, color: pc, alpha: .7})); E.push(T(b.x + 30, b.y + b.h - 52, lw - 60, 36, bud.d, {size: 17, bold: true, color: pc, lh: 1.3, minScale: .55})); }
    const rows = items.filter(i => i !== bud).map(r => r.v && !isMethod(r.h) ? {...r, d: r.v + '\n' + (r.d || '')} : r), hs0 = rows.map(r => Math.max(20, isMethod(r.h) ? bl(r.d).reduce((a, l) => a + tH(l, 15, rw - labW - 50, 1.45, 500) + 6, 0) : tH(r.d, 15, rw - labW - 20, 1.5, 500)) + 22), tot = hs0.reduce((a, c) => a + c, 0), sc = Math.min(1, b.h / tot), grow = sc < 1 ? 1 : Math.min(1.35, b.h * .9 / tot);
    let y = b.y + Math.max(0, (b.h - tot * (sc < 1 ? sc : grow)) * .3);
    rows.forEach((r, i) => { const rh = hs0[i] * (sc < 1 ? sc : grow), fs = sc < 1 ? Math.max(.74, sc) : 1;
      E.push(T(rx, y + 11, labW - 10, 22, r.h, {size: 13.5, bold: true, color: K.p, minScale: .6}));
      if (isMethod(r.h)){ let yy = y + 11; bl(r.d).forEach((l, k) => { const t = l.replace(/^\s*\d+[).]\s*/, ''), hh = tH(t, 15 * fs, rw - labW - 50, 1.45, 500); C3.num(E, {...K, num: K.num === 'big' ? 'plain' : K.num}, rx + labW + 12, yy + 10, 22, k + 1, {}); E.push(T(rx + labW + 34, yy, rw - labW - 40, hh + 2, t, {size: 15 * fs, color: K.ink, lh: 1.45, wt: 500})); yy += hh + 6; }); }
      else E.push(T(rx + labW, y + 11, rw - labW, rh - 18, r.d, {size: 15 * fs, color: K.ink, lh: 1.5, wt: 500, minScale: .7}));
      y += rh; if (i < rows.length - 1) E.push(R(rx, y, rw, 1, K.line)); });
  },
  tkFlow(E, items, b, P, pg, K = K3(P, pg)){ // 흐름 4~5단계 + 운영 방법 카드, 내용 높이에 맞춰 세로 가운데 배치
    const meth = items.find(i => isMethod(i.h)), bud = items.find(i => isBudget(i.h)), steps = items.filter(i => i !== meth && i !== bud).slice(0, 5);
    const n = steps.length || 1, g = 12, sw = (b.w - (n - 1) * g) / n, ms = meth ? bl(meth.d).map(l => l.replace(/^\s*\d+[).]\s*/, '')) : [], mw2 = (b.w - (Math.max(1, ms.length) - 1) * 16) / Math.max(1, ms.length);
    let fs = 15.5; const need = f => { const sh = 56 + Math.max(...steps.map(s => tH(s.d, f, sw - 16, 1.5, 500))) + 8, mh = ms.length ? 52 + Math.max(...ms.map(m => tH(m, f, mw2 - 44, 1.5, 500))) + 26 : 0; return {sh, mh, tot: sh + (ms.length ? 26 + 34 + mh : 0) + (bud ? 62 : 0)}; };
    let L = need(fs); while (L.tot > b.h && fs > 12.5){ fs -= .5; L = need(fs); }
    while (fs < 17 && need(fs + .5).tot < b.h * .78){ fs += .5; L = need(fs); }
    const extra = Math.max(0, b.h - L.tot), sh = L.sh + Math.min(70, extra * .3), mh = L.mh + Math.min(70, extra * .3);
    let y = b.y + Math.max(0, (b.h - (sh + (ms.length ? 26 + 34 + mh : 0) + (bud ? 62 : 0))) * .42);
    steps.forEach((s, i) => { const x = b.x + i * (sw + g);
      E.push(SH(i === 0 ? 'home' : 'chevron', x, y, sw + (i < n - 1 ? 10 : 0), 42, i === n - 1 ? K.p : (K.dark ? '#262D37' : K.pDark)));
      E.push(T(x + (i ? 26 : 18), y, sw - 44, 42, s.h, {size: 14.5, bold: true, color: '#FFFFFF', valign: 'middle', minScale: .6}));
      if (K.card !== 'rule') E.push(R(x, y + 50, sw, sh - 50, K.dark ? K.panel : K.bg === '#FFFFFF' ? '#FFFFFF' : K.panel, {r: Math.min(K.r, 10), ...cardLine(K)}));
      E.push(T(x + 14, y + 62, sw - 28, sh - 70, s.d, {size: fs, color: K.ink, lh: 1.5, wt: 500, minScale: .7})); });
    y += sh + 26;
    if (ms.length){
      C3.head(E, {...K, head: K.head === 'pill' || K.head === 'bar' ? 'label' : K.head}, b.x, y, 300, 22, meth.h, {hi: true}); y += 34;
      ms.forEach((m, k) => { const x = b.x + k * (mw2 + 16), c = C3.card(E, K, x, y, mw2, mh, {fillRule: true}), px = x + (c.pad || 0);
        C3.num(E, {...K, num: K.num === 'big' ? 'plain' : K.num}, px + 14, y + (c.top || 16) + 12, 28, k + 1, {on: k === 0});
        E.push(T(px, y + (c.top || 16) + 36, mw2 - (c.pad || 0) * 2, mh - (c.top || 16) - 44, m, {size: fs, color: c.on, lh: 1.5, wt: 500, minScale: .7})); });
      y += mh + 18; }
    if (bud){ const by = Math.min(b.y + b.h - 44, y); E.push(R(b.x, by, b.w, 44, K.soft, {r: Math.min(K.r, 22)})); E.push(T(b.x + 22, by, 140, 44, bud.h, {size: 13, bold: true, color: K.p, valign: 'middle'})); E.push(T(b.x + 160, by, b.w - 180, 44, bud.d, {size: 15, bold: true, color: K.dark ? K.ink : K.pDark, valign: 'middle', minScale: .6})); }
  },
  tkQuad(E, items, b, P, pg, K = K3(P, pg)){
    const meth = items.find(i => isMethod(i.h)), bud = items.find(i => isBudget(i.h)), q = items.filter(i => i !== meth && i !== bud).slice(0, 4);
    const lw = b.w * .62, g = 14, qw = (lw - g) / 2, qh = (b.h - g) / 2;
    q.forEach((it, i) => { const x = b.x + (i % 2) * (qw + g), y = b.y + Math.floor(i / 2) * (qh + g), c = C3.card(E, K, x, y, qw, qh, {fillRule: true}), px = x + (c.pad || 0), iw = qw - (c.pad || 0) * 2;
      const dh = Math.min(qh - c.top - 44, tH(it.d, 15.5, iw, 1.5, 500)), y1 = y + Math.max(c.top, (qh - 32 - dh) / 2); E.push(T(px, y1, iw, 22, it.h, {size: 14, bold: true, color: K.p, ls: .3})); if (it.v) E.push(T(px, y1, iw, 22, it.v, {size: 12.5, bold: true, color: K.mute, align: 'right', minScale: .6})); E.push(T(px, y1 + 32, iw, dh + 4, it.d, {size: 15.5, color: c.on, lh: 1.5, wt: 500, minScale: .7})); });
    const rx = b.x + lw + 32, rw = b.w - lw - 32, kh0 = pg.keyMsg ? Math.min(130, tH(pg.keyMsg, 20, rw - 8, 1.38, 800) + 30) : 0, mh0 = meth ? 30 + bl(meth.d).reduce((a, l) => a + tH(l.replace(/^\s*\d+[).]\s*/, ''), 15, rw - 40, 1.45, 500) + 12, 0) : 0;
    let y = b.y + Math.max(0, (b.h - (bud ? 76 : 0) - kh0 - mh0) * .3);
    if (pg.keyMsg){ const kh = kh0; E.push(R(rx, y, 4, kh - 20, K.p)); E.push(T(rx + 18, y, rw - 18, kh - 16, pg.keyMsg, {size: 20, bold: true, color: K.ink, lh: 1.38, minScale: .6})); y += kh; }
    if (meth){ E.push(T(rx, y, rw, 20, meth.h, {size: 13, bold: true, color: K.p, ls: .3})); y += 30; bl(meth.d).forEach((l, k) => { const t = l.replace(/^\s*\d+[).]\s*/, ''), hh = tH(t, 15, rw - 40, 1.45, 500); C3.num(E, {...K, num: K.num === 'big' ? 'plain' : K.num}, rx + 12, y + 11, 24, k + 1, {}); E.push(T(rx + 36, y, rw - 36, hh + 2, t, {size: 15, color: K.ink, lh: 1.45, wt: 500})); y += hh + 12; }); }
    if (bud){ const by = b.y + b.h - 60; E.push(R(rx, by, rw, 1, K.line)); E.push(T(rx, by + 10, rw, 16, bud.h, {size: 11.5, bold: true, color: K.mute})); E.push(T(rx, by + 28, rw, 30, bud.d, {size: 17, bold: true, color: K.p, minScale: .55})); }
  }
};
Object.assign(LAY, MEDIA3);

/* 내용에 맞춰 레이아웃 고르기 (연속 반복 피함) */
tkPick = function(p, prev){
  const it = itemsOf(p), n = it.length, lay = p.draft?.layout || p.layout || '', withV = it.filter(i => i.v && isNum(i.v)).length, pct = it.filter(i => /%$/.test(String(i.v).trim())).length;
  if (MEDIA_LAYOUTS.includes(lay)) return {spec: 'tkSpec', mediaFlow: 'tkFlow', mediaQuad: 'tkQuad', mediaKpi: 'tkKpiBoard', mediaRoad: 'tkRoad'}[lay];
  const c = [];
  if (/chart|statBars/.test(lay) && pct >= 3) c.push('tkBars');
  if (/hero/.test(lay) && it[0]?.v && n >= 2) c.push('tkHero');
  if (/funnel|pyramid/.test(lay) && n >= 2 && n <= 5) c.push('tkFunnel');
  if (/compare|summary/.test(lay) && it.some(i => i.v)) c.push('tkCompare');
  if (/process|timeline|vsteps|stepCards|cycle/.test(lay) && n >= 3 && n <= 6) c.push('tkSteps');
  if (/table/.test(lay) || n >= 7) c.push('tkTable');
  if (withV >= Math.max(2, n * .6) && n >= 2 && n <= 8 && it.every(i => (i.d || '').length < 90)) c.push('tkKpi');
  if (/split|spec|hero|quote/.test(lay) && p.keyMsg && n <= 5) c.push('tkSplit');
  if (/twoCol|colCards/.test(lay) || (n >= 2 && n <= 4 && it.some(i => lines(i.d).length > 1))) c.push('tkPillCols');
  if (n >= 3 && n <= 6 && it.every(i => (i.d || '').length < 120)) c.push('tkGrid');
  if (n >= 2 && n <= 6) c.push('tkList', 'tkPillCols');
  if (n >= 3 && n <= 6) c.push('tkSteps');
  if (pct >= 3) c.push('tkBars');
  c.push('tkTable');
  const u = c.filter((v, i) => c.indexOf(v) === i);
  return u.find(v => v !== prev) || u[0];
};

/* ---------------- 연결: 테마 선택 · 렌더 · 워싱 ---------------- */
for (const k of Object.keys(THEMES)) delete THEMES[k];
Object.entries(DS3).forEach(([k, v]) => { THEMES[k] = v.name; });
const _bsDS3 = buildSpec;
buildSpec = function(it){
  if (!ds3On() || (it.kind === 'page' && (it.page?.fixed || String(it.page?.layout || '').startsWith('tpl:')))) return _bsDS3(it);
  const K = ds3Tok(palette(true), false), tf = K.chrome === 'tpl' ? ds3Frame() : null;
  if (it.kind === 'guide') return _bsDS3(it);
  if (it.kind === 'cover' || it.kind === 'closing') return tf ? tkCoverSpec(it, palette(true), tf, it.kind === 'closing') : ds3Cover(K, it.kind === 'closing');
  if (it.kind === 'toc') return tf ? tkTocSpec(it, palette(true), tf) : ds3Toc(it, K);
  if (it.kind === 'page'){
    const pg = it.page;
    if (tf && pg.washed && (pg.type === 'divider' || pg.type === 'bridge')) return tkSectionSpec(it, pg, palette(true), tf, pg.type);
    return ds3PageSpec(it);
  }
  return _bsDS3(it);
};
const _washSec0 = washSections;
washSections = function(idxs){
  if (!ds3On()) return _washSec0(idxs);
  const secs = idxs.map(i => S.sections[i]).filter(s => s && s.pageList.length);
  if (!secs.length){ toast('워싱할 페이지가 없습니다 — 로직 단계에서 내용을 먼저 작성하세요'); return; }
  secs.forEach(sec => { let prev = ''; sec.pageList.forEach(p => {
    if (p.fixed) return;
    if (String(p.layout).startsWith('tpl:')) p.layout = p.tplBody || 'list';
    const base = p.washed ? (p.draft?.layout || p.layout) : p.layout;
    if (!p.washed) p.draft = clone({...p, draft: undefined});
    p.washed = true;
    if (p.type !== 'strategy' && p.type !== 'explain') return;
    const keep = /^cr/.test(base || '') || base === 'image';
    p.tkLayout = keep ? base : tkPick({...p, layout: base}, prev); prev = p.tkLayout;
  }); });
  save(); render(); toast(`디자인 워싱 완료 — ${DS3[S.design.theme].name} · 내용에 맞춰 레이아웃 변주`);
};
const _unwash0 = unwash;
unwash = function(p){ _unwash0(p); p.tkLayout = undefined; };
const _shuffle0 = shuffleLayout;
shuffleLayout = function(p){
  if (!ds3On()) return _shuffle0(p);
  const L = ['tkPillCols', 'tkKpi', 'tkSteps', 'tkFunnel', 'tkTable', 'tkSplit', 'tkCompare', 'tkList', 'tkGrid', 'tkBars', 'tkHero', 'tkSpec', 'tkFlow', 'tkQuad', 'tkKpiBoard', 'tkRoad'];
  const cur = p.tkLayout || ds3BodyLayout(p), i = L.indexOf(cur);
  if (!p.washed){ p.draft = clone({...p, draft: undefined}); p.washed = true; }
  p.tkLayout = L[(i + 1) % L.length];
};

/* 기존(크리에이티브 등) 레이아웃을 다크 테마에 맞게 색 반전 */
function darkify(E, i0, K){
  const L = c => /^#[0-9A-F]{6}$/i.test(c || '') ? lum(c) : null;
  for (let i = i0; i < E.length; i++){ const e = E[i];
    if (e.k === 't'){ const l = L(e.color); if (l !== null && l < .35) e.color = K.ink; else if (l !== null && l < .6) e.color = K.sub; }
    else if (e.k === 'r' || e.k === 'e' || e.k === 's'){ const l = L(e.fill); if (l !== null && l > .82) e.fill = K.panel; const ll = L(e.line); if (ll !== null && ll > .7) e.line = K.line; }
  }
}

/* ---------------- 섹션별 테마·포인트 컬러 (전체 테마 위에 섹션 단위로 덮어쓰기) ---------------- */
const _bsSec = buildSpec;
buildSpec = function(it){
  const sec = it && it.kind === 'page' ? it.sec : null, th = sec && DS3[sec.theme] ? sec.theme : null, ac = sec && validHex(sec.accent || '') ? sec.accent : null;
  if (!th && !ac) return contrastFix(_bsSec(it));
  const g = S.design.theme, c0 = S.input.colors[0], h0 = c0 && c0.hex;
  if (th) S.design.theme = th;
  if (ac && c0) c0.hex = ac;
  try { return contrastFix(_bsSec(it)); } finally { S.design.theme = g; if (ac && c0) c0.hex = h0; }
};

/* ---------------- 매체 전략 레이아웃 추가 2종 (매체가 많아도 같은 모양이 반복되지 않게) ---------------- */
const mParts = items => {
  const f = re => items.find(i => re.test(i.h || ''));
  const exe = items.find(i => isMethod(i.h)), bud = items.find(i => isBudget(i.h)), kpi = f(/KPI|목표/), tgt = f(/타겟팅|^대상|타겟\s*$/), pair = f(/결합|매칭|^소재/), scale = f(/증감|증액|확장 기준|판단 기준|평가/);
  const used = [kpi, tgt, exe, pair, scale, bud].filter(Boolean), rest = items.filter(i => !used.includes(i));
  return {kpi, tgt, exe, pair, scale, bud, rest};
};
const fitFs = (fn, avail, hi = 15.5, lo = 12.5) => { let f = hi; while (f > lo && fn(f) > avail) f -= .5; return f; };
Object.assign(MEDIA3, {
  tkKpiBoard(E, items, b, P, pg, K = K3(P, pg)){ // 상단 KPI 보드 + 타겟팅 / 실행 / 소재 결합 3단
    const M = mParts(items), g = 16, topH = 118, kw = b.w * .36;
    const kc = C3.card(E, K, b.x, b.y, kw, topH, {hi: !K.draft && K.card === 'fill'}), kon = kc.on, kp = b.x + (kc.pad || 18);
    E.push(T(kp, b.y + 16, kw - 40, 16, 'KPI 목표', {size: 11.5, bold: true, color: kon, alpha: .8, ls: .8}));
    E.push(T(kp, b.y + 36, kw - 40, 48, M.kpi?.v || (pg.keyMsg || '').split('·').pop().trim() || '-', {size: 30, bold: true, color: K.card === 'fill' && !K.draft ? kon : K.p, lh: 1.15, minScale: .45}));
    if (M.kpi?.d) E.push(T(kp, b.y + 84, kw - 40, 28, bl(M.kpi.d)[0], {size: 13.5, color: kon, alpha: .9, wt: 500, minScale: .65}));
    const sx = b.x + kw + g, sw = b.w - kw - g, sc = C3.card(E, K, sx, b.y, sw, topH, {fillRule: true}), sp = sx + (sc.pad || 18), half = (sw - (sc.pad || 18) * 2 - 24) / 2;
    E.push(T(sp, b.y + 16, half, 16, M.scale?.h || '증감액 기준', {size: 11.5, bold: true, color: K.p, ls: .4}));
    E.push(T(sp, b.y + 38, half, topH - 48, M.scale?.d || '-', {size: 14, color: K.ink, lh: 1.45, wt: 500, minScale: .65}));
    E.push(R(sp + half + 12, b.y + 18, 1, topH - 36, K.line));
    E.push(T(sp + half + 24, b.y + 16, half, 16, M.bud?.h || 'KPI 병목', {size: 11.5, bold: true, color: K.p, ls: .4}));
    E.push(T(sp + half + 24, b.y + 38, half, topH - 48, M.bud?.d || bl(M.kpi?.d || '').slice(1).join('\n') || '-', {size: 14, color: K.ink, lh: 1.45, wt: 500, minScale: .65}));
    const cols = [[M.tgt?.h || '타겟팅 어프로치', M.tgt?.d || ''], [M.exe?.h || '운영 실행안', M.exe?.d || ''], [M.pair?.h || '타겟 × 소재 결합', [M.pair?.d, ...M.rest.map(r => `${r.h}: ${r.d}`)].filter(Boolean).join('\n')]];
    const cy = b.y + topH + 20, ch = b.y + b.h - cy, cw = (b.w - 2 * g) / 3, hd = 36;
    const fs = fitFs(f => Math.max(...cols.map(c => bl(c[1]).reduce((a, l) => a + tH(l.replace(/^\s*\d+[).]\s*/, ''), f, cw - 64, 1.5, 500) + 8, 0))), ch - hd - 34);
    cols.forEach(([h, d], i) => { const x = b.x + i * (cw + g);
      C3.head(E, K, x, cy, cw, hd, h, {hi: i === 1});
      const c = C3.card(E, K, x, cy + hd + 8, cw, ch - hd - 8, {fillRule: true}), px = x + (c.pad || 18); let y = cy + hd + 8 + (c.top || 16);
      bl(d).forEach((l, k) => { const t = l.replace(/^\s*\d+[).]\s*/, ''), th = tH(t, fs, cw - (c.pad || 18) * 2 - 28, 1.5, 500); if (y + th > cy + ch - 8) return;
        if (i === 1) C3.num(E, {...K, num: K.num === 'big' ? 'plain' : K.num}, px + 10, y + fs * .75, 22, k + 1, {}); else E.push(R(px + 2, y + fs * .6, 6, 6, K.p, {r: 3}));
        E.push(T(px + 26, y, cw - (c.pad || 18) * 2 - 26, th + 2, t, {size: fs, color: c.on, lh: 1.5, wt: 500})); y += th + 8; });
    });
  },
  tkRoad(E, items, b, P, pg, K = K3(P, pg)){ // 왼쪽 타겟·소재 결합 / 오른쪽 KPI 띠 + 실행 단계 타임라인 + 판단 기준
    const M = mParts(items), g = 20, lw = b.w * .34, rx = b.x + lw + g, rw = b.w - lw - g;
    const L = [[M.tgt?.h || '타겟팅 어프로치', M.tgt?.d || ''], [M.pair?.h || '타겟 × 소재 결합', [M.pair?.d, ...M.rest.map(r => `${r.h}: ${r.d}`)].filter(Boolean).join('\n')]];
    const lh = (b.h - 14) / 2, lfs = fitFs(f => Math.max(...L.map(c => tH(c[1], f, lw - 48, 1.5, 500))), lh - 60);
    L.forEach(([h, d], i) => { const y = b.y + i * (lh + 14), c = C3.card(E, K, b.x, y, lw, lh, {fillRule: true}), px = b.x + (c.pad || 18);
      E.push(T(px, y + (c.top || 16), lw - 40, 20, h, {size: 14.5, bold: true, color: K.p}));
      E.push(T(px, y + (c.top || 16) + 30, lw - (c.pad || 18) * 2, lh - (c.top || 16) - 40, d, {size: lfs, color: c.on, lh: 1.5, wt: 500, minScale: .7})); });
    // KPI 띠
    const kh = 64; E.push(R(rx, b.y, rw, kh, K.dark ? mix(K.p, K.bg, .5) : K.p, {r: Math.min(K.r, 14)})); const kf = onC(K.dark ? mix(K.p, K.bg, .5) : K.p);
    E.push(T(rx + 22, b.y, 90, kh, 'KPI 목표', {size: 12, bold: true, color: kf, alpha: .8, valign: 'middle'}));
    E.push(T(rx + 110, b.y, rw * .36, kh, M.kpi?.v || (pg.keyMsg || '').split('·').pop().trim() || '-', {size: 22, bold: true, color: kf, valign: 'middle', minScale: .5}));
    if (M.kpi?.d) E.push(T(rx + 120 + rw * .36, b.y + 6, rw - rw * .36 - 140, kh - 12, M.kpi.d, {size: 13, color: kf, alpha: .92, valign: 'middle', lh: 1.4, wt: 500, minScale: .6}));
    // 실행 타임라인
    const st = bl(M.exe?.d || '').map(l => l.replace(/^\s*\d+[).]\s*/, '')).slice(0, 4), n = Math.max(1, st.length), sw = (rw - (n - 1) * 14) / n, ty = b.y + kh + 26;
    E.push(T(rx, ty, 300, 18, M.exe?.h || '운영 실행안', {size: 13, bold: true, color: K.p, ls: .3}));
    const ly = ty + 42; if (n > 1) E.push(R(rx + sw / 2, ly - 1, (n - 1) * (sw + 14), 2, K.line));
    const botH = (M.scale || M.bud) ? 78 : 0, sh = b.y + b.h - botH - (botH ? 14 : 0) - (ly + 26);
    const sfs = fitFs(f => Math.max(...st.map(t => tH(t, f, sw - 32, 1.5, 500))), sh - 30);
    st.forEach((t, i) => { const x = rx + i * (sw + 14);
      C3.num(E, {...K, num: K.num === 'big' || K.num === 'plain' ? 'circle' : K.num}, x + sw / 2, ly, 30, i + 1, {on: i === 0});
      const c = C3.card(E, K, x, ly + 26, sw, sh, {fillRule: true});
      E.push(T(x + 16, ly + 26 + 16, sw - 32, sh - 28, t, {size: sfs, color: c.on, lh: 1.5, wt: 500, minScale: .7})); });
    if (botH){ const by = b.y + b.h - botH, bw = (rw - 14) / 2;
      [[M.scale?.h || '증감액 기준', M.scale?.d], [M.bud?.h || '일정·예산', M.bud?.d]].filter(x => x[1]).forEach(([h, d], i, arr) => { const w2 = arr.length === 1 ? rw : bw, x = rx + i * (bw + 14);
        E.push(R(x, by, w2, botH, K.soft, {r: Math.min(K.r, 12)})); E.push(T(x + 18, by + 12, w2 - 36, 16, h, {size: 11.5, bold: true, color: K.p, ls: .4}));
        E.push(T(x + 18, by + 32, w2 - 36, botH - 38, d, {size: 13.5, bold: true, color: K.dark ? K.ink : K.pDark, lh: 1.4, minScale: .6})); }); }
  }
});
Object.assign(LAY, {tkKpiBoard: MEDIA3.tkKpiBoard, tkRoad: MEDIA3.tkRoad, mediaKpi: MEDIA3.tkKpiBoard, mediaRoad: MEDIA3.tkRoad});
MEDIA_LAYOUTS.push('mediaKpi', 'mediaRoad');
Object.assign(LAYOUTS, {mediaKpi: '매체: KPI 보드 + 3단', mediaRoad: '매체: 실행 로드맵'});
Object.assign(TK_NAMES, {tkKpiBoard: '매체: KPI 보드', tkRoad: '매체: 실행 로드맵', tkSpec: TK_NAMES.tkSpec || '매체: 스펙 시트', tkFlow: TK_NAMES.tkFlow || '매체: 흐름도', tkQuad: TK_NAMES.tkQuad || '매체: 4분면'});
const MEDIA_TK = {spec: 'tkSpec', mediaFlow: 'tkFlow', mediaQuad: 'tkQuad', mediaKpi: 'tkKpiBoard', mediaRoad: 'tkRoad'};

/* ---------------- 매체 이름 인식 · 미디어믹스 매체별 장표 보장 ---------------- */
const MEDIA_GROUPS = [['네이버', /네이버|브랜드\s*검색|쇼핑\s*검색|파워링크|GFA|ADVoost/i], ['쿠팡', /쿠팡/], ['메타', /메타|META|Meta|페이스북|인스타그램|릴스/], ['구글·유튜브', /구글|Google|유튜브|YouTube|Demand\s*Gen|PMax|디맨드/i], ['카카오', /카카오|비즈보드|모먼트/], ['크리테오', /크리테오|Criteo/i], ['틱톡', /틱톡|TikTok/i], ['당근', /당근/], ['토스', /토스/], ['앱', /앱\s*설치|MMP|애플\s*검색/]];
const mediaGroup = t => (MEDIA_GROUPS.find(([, re]) => re.test(t || '')) || [''])[0];
function pageMedia(p){ if (p.mediaName) return p.mediaName; for (const t of [p.title, p.tag, p.keyMsg, (p.notes || '').slice(0, 40)]){ const g = mediaGroup(t); if (g) return g; } return ''; }
const isMediaPage = p => (p.type === 'strategy' || p.type === 'explain') && (MEDIA_LAYOUTS.includes(p.layout) || (!!p.mediaName && !/^cr/.test(p.layout || '')));
function mixMediaList(){
  const rows = (S.input.mediaMix?.rows || []).filter(r => r.name && (+r.pct || 0) > 0);
  if (rows.length) return rows.map(r => r.name);
  const MR = S.input.analysis?.mediaResearch || S.input.claudeJson?.data?.mediaResearch;
  if (MR?.length) return MR.map(m => m.media).filter(Boolean);
  try { return allocate(mediaMix(signals()), 'base').map(m => m.name); } catch(e){ return []; }
}
const LIB_KEY = {'네이버': 'naverShop', '쿠팡': 'coupang', '메타': 'metaConv', '구글·유튜브': 'demandGen', '카카오': 'kakao', '크리테오': 'criteo', '틱톡': 'tiktok', '앱': 'appUA'};
function mediaPageFromLib(name){ // 내장 매체 라이브러리로 매체 장표 1장 (KPI 목표 · 타겟팅 · 실행안 · 소재 결합 · 증감액 기준)
  let c, L; try { c = signals(); L = MEDIA_LIB(c); } catch(e){ return null; }
  const g = mediaGroup(name), key = Object.keys(L).find(k => L[k].name === name) || (/브랜드\s*검색/.test(name) ? 'naverBrand' : /파워링크|검색광고/.test(name) ? 'naverPL' : /GFA/.test(name) ? 'gfaConv' : /PMax|구글\s*검색/.test(name) ? 'googleSearch' : LIB_KEY[g]), m = key && L[key]; if (!m) return null;
  const K = mediaKPI({...m, name}), row = (S.input.mediaMix?.rows || []).find(r => r.name === name), pct = row ? +row.pct || 0 : 0, mon = typeof mmMonthly === 'function' ? mmMonthly() : 0, stg = STAGE[row?.stage || m.stage] || STAGE.mid;
  const amt = pct && mon ? ` (월 ${Math.round(mon * pct / 100 / 1e4).toLocaleString()}만 원)` : '';
  return {layout: 'spec', title: `${name}: ${m.head}`, subtitle: m.sub, keyMsg: `${m.role} · ${K.target}`, tag: `${stg.en}  ${stg.type}`, mediaName: name, notes: `${name}은 ${K.lever.split('\n')[0]} 쪽부터 손봅니다.`,
    items: [{h: 'KPI 목표', d: K.lever, v: K.target}, {h: '타겟팅 어프로치', d: `${m.who}\n${K.tgt}`}, {h: '운영 실행안', d: m.acts.map((a, k) => `${k + 1}) ${a}`).join('\n')}, {h: '타겟 × 소재 결합', d: `${m.who.split(',')[0]} → ${m.what} → ${m.land}`}, {h: '증감액 기준', d: K.scale}, {h: '일정·예산', d: m.when + (pct ? `, 비중 ${pct}%${amt}` : '')}]};
}
function syncMediaPages(sec, o = {}){
  if (!sec || sec.role !== 'media') return 0;
  sec.pageList.forEach(p => { if ((p.type === 'strategy' || p.type === 'explain') && !p.mediaName){ const m = pageMedia(p); if (m && (MEDIA_LAYOUTS.includes(p.layout) || /^(네이버|쿠팡|메타|구글|유튜브|카카오|크리테오|틱톡)/.test(p.title || ''))) p.mediaName = m; } });
  const have = new Set(sec.pageList.filter(p => p.mediaName).map(p => mediaGroup(p.mediaName) || p.mediaName));
  const want = mixMediaList(), missing = want.filter(n => !have.has(mediaGroup(n) || n));
  let added = 0;
  if (missing.length && typeof generateEngine === 'function'){
    missing.forEach(n => { const g = mediaGroup(n) || n, src = mediaPageFromLib(n);
      const pg = src ? newPage('strategy', src) : newPage('strategy', {layout: 'spec', title: `${n} 운영 전략 [작성 필요]`, subtitle: 'KPI 목표를 맞추기 위한 타겟팅 · 운영 실행안 · 소재 결합', keyMsg: '', mediaName: n, items: [{h: 'KPI 목표', d: '[가장 약한 KPI와 레버]', v: '[목표 수치]'}, {h: '타겟팅 어프로치', d: '[세그먼트·우선순위·확장 순서·제외]'}, {h: '운영 실행안', d: '1) [캠페인 구조]\n2) [입찰·학습 예산]\n3) [주차별 실행]'}, {h: '타겟 × 소재 결합', d: '[세그먼트 → 메시지·포맷 → 랜딩]'}, {h: '증감액 기준', d: '[세그먼트 단위 숫자 기준]'}, {h: '일정·예산', d: '[월 예산·일정]'}]});
      have.add(g); sec.pageList.push(pg); added++; });
  }
  // 매체 장표 레이아웃 5종을 순서대로 배정 (같은 모양 연속 금지)
  let k = 0; sec.pageList.forEach(p => { if (p.mediaName && (MEDIA_LAYOUTS.includes(p.layout) || !p.layout) && (p.type === 'strategy' || p.type === 'explain')){ p.layout = MEDIA_LAYOUTS[k % MEDIA_LAYOUTS.length]; if (p.washed) p.tkLayout = MEDIA_TK[p.layout]; if (p.draft) p.draft.layout = p.layout; k++; } });
  sec.pages = sec.pageList.length;
  return added;
}
function syncAllMediaPages(){ let a = 0; S.sections.filter(s => s.role === 'media').forEach(s => { a += syncMediaPages(s); }); return a; }
const _importClaude0 = importClaude;
importClaude = function(j, withSec){ _importClaude0(j, withSec); if (j.mediaResearch) S.input.analysis.mediaResearch = j.mediaResearch; if (withSec) syncAllMediaPages(); };
const _genSection0 = genSection;
genSection = async function(si, quiet){ await _genSection0(si, true); const sec = S.sections[si]; if (sec?.role === 'media') syncMediaPages(sec); if (!quiet){ save(); render(); toast(`"${sec?.title}" ${sec?.pageList.length || 0}장 작성 완료`); } };
ACT.mediaSync = b => { const sec = S.sections[+b.dataset.s]; const n = syncMediaPages(sec); save(); render(); toast(n ? `미디어믹스 기준 빠진 매체 ${n}개 장표를 추가했습니다` : '미디어믹스의 모든 매체가 장표에 있습니다 — 레이아웃만 매체별로 다시 배정했습니다', 4000); };

/* 매체 장표 우상단 매체명 표시 (모든 테마 공통) */
function mediaBadge(spec, it){
  const pg = it.page; if (!spec || !spec.els || spec.fx || !pg?.mediaName || !(pg.type === 'strategy' || pg.type === 'explain')) return spec;
  const ts = spec.els.filter(e => e.k === 't' && e.y < 140 && e.y > 40 && e.size >= 21 && !e.ls).sort((a, b) => b.size - a.size)[0];
  const name = pg.mediaName, dark = lum(spec.bg || '#FFFFFF') < .4, c1 = pg.washed ? (palette(true).c1 || '#1F3A93') : '#3A3A3A', fill = dark && lum(c1) < .35 ? mix(c1, '#FFFFFF', .3) : c1;
  const pw = Math.min(260, mw(name, 14, 700) + mw('MEDIA', 10, 700) + 56), ph = 32, x = W - 60 - pw, y = ts ? ts.y + Math.max(0, (Math.min(ts.h, ts.size * 1.3) - ph) / 2) : 72;
  if (ts && ts.x + ts.w > x - 16) ts.w = Math.max(300, x - 16 - ts.x);
  const sub = spec.els.find(e => e.k === 't' && ts && e !== ts && e.y > ts.y && e.y < ts.y + 120 && e.size < ts.size && e.size >= 14); if (sub && sub.x + sub.w > x - 16) sub.w = Math.max(300, x - 16 - sub.x);
  spec.els.push(R(x, y, pw, ph, fill, {r: ph / 2}));
  spec.els.push(T(x + 16, y, 52, ph, 'MEDIA', {size: 10, bold: true, color: onC(fill), alpha: .75, valign: 'middle', ls: .8, keepColor: true}));
  spec.els.push(R(x + 64, y + 9, 1, ph - 18, onC(fill), {alpha: .4}));
  spec.els.push(T(x + 74, y, pw - 86, ph, name, {size: 14, bold: true, color: onC(fill), valign: 'middle', minScale: .6, keepColor: true}));
  return spec;
}
const _bsMedia = buildSpec;
buildSpec = function(it){ const sp = _bsMedia(it); return it && it.kind === 'page' ? mediaBadge(sp, it) : sp; };
