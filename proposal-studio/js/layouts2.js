/* =========================================================
   추가 디자인 테마 + 크리에이티브(이미지·영상) 레이아웃
   ========================================================= */
Object.assign(THEMES, {editorial: '에디토리얼 (굵은 상단 라인)', tint: '틴트 패널 (컬러 배경 + 흰 패널)', corner: '코너 포인트 (대각 장식)', darkhead: '다크 헤더 (차콜 타이틀 바)', frame: '프레임 (얇은 테두리)', mono: '모노 미니멀 (흑백 + 포인트)'});

/* ---------- 테마: 제목 영역 ---------- */
function themeTitle(theme, E, it, pg, P){
  const sn = it.secNo ? two(it.secNo) : '';
  switch (theme){
    case 'editorial':
      E.push(R(0, 0, W, 10, P.c1));
      if (sn) E.push(T(MX, 44, 90, 70, sn, {size: 54, bold: true, color: P.c1, lh: 1, alpha: .9}));
      E.push(T(MX + (sn ? 104 : 0), 48, W - MX * 2 - 120, 40, pg.title, {size: 29, bold: true, lh: 1.3}));
      if (pg.subtitle) E.push(T(MX + (sn ? 104 : 0), 92, W - MX * 2 - 120, 24, pg.subtitle, {size: 15.5, light: true, color: '#475467'}));
      E.push(R(MX, 134, W - MX * 2, 1, '#1D2939'));
      return {bodyY: 160, bg: '#FAFAF7'};
    case 'tint':
      E.push(R(36, 140, W - 72, H - 186, '#FFFFFF', {r: 18}));
      E.push(T(MX, 46, W - MX * 2, 40, pg.title, {size: 29, bold: true, color: P.ink, lh: 1.3}));
      if (pg.subtitle) E.push(T(MX, 92, W - MX * 2, 24, pg.subtitle, {size: 15.5, color: '#344054'}));
      return {bodyY: 172, bodyEnd: 620, bg: P.tint, padX: 92};
    case 'corner':
      E.push(SH('cornerTR', W - 260, 0, 260, 200, P.c1)); E.push(SH('cornerTR', W - 120, 0, 120, 92, P.c2, {alpha: .9}));
      E.push(T(MX, 52, W - MX * 2 - 240, 40, pg.title, {size: 30, bold: true, lh: 1.3}));
      E.push(R(MX, 100, 44, 4, P.c3 === P.c1 ? P.c2 : P.c3));
      if (pg.subtitle) E.push(T(MX, 114, W - MX * 2 - 240, 24, pg.subtitle, {size: 15.5, light: true, color: '#475467'}));
      return {bodyY: 170, logoOn: P.c1};
    case 'darkhead':
      E.push(R(0, 0, W, 150, '#1F2328')); E.push(R(MX, 146, 120, 4, P.c1));
      E.push(T(MX, 44, W - MX * 2 - 160, 42, pg.title, {size: 30, bold: true, color: '#FFFFFF', lh: 1.3}));
      if (pg.subtitle) E.push(T(MX, 92, W - MX * 2 - 160, 24, pg.subtitle, {size: 15.5, color: '#FFFFFF', alpha: .72}));
      return {bodyY: 182, labelOn: '#FFFFFF', logoOn: '#1F2328'};
    case 'frame':
      E.push(R(20, 20, W - 40, H - 40, '#FFFFFF', {line: P.c1, r: 4}));
      E.push(R(MX, 64, 12, 12, P.c1));
      E.push(T(MX + 24, 50, W - MX * 2 - 24, 40, pg.title, {size: 29, bold: true, lh: 1.3}));
      if (pg.subtitle) E.push(T(MX + 24, 96, W - MX * 2 - 24, 24, pg.subtitle, {size: 15.5, light: true, color: '#475467'}));
      return {bodyY: 158};
    case 'mono':
      E.push(R(MX, 54, 3, 70, P.c1));
      E.push(T(MX + 20, 50, W - MX * 2 - 20, 40, pg.title, {size: 29, bold: true, color: '#101010', lh: 1.3}));
      if (pg.subtitle) E.push(T(MX + 20, 96, W - MX * 2 - 20, 24, pg.subtitle, {size: 15.5, light: true, color: '#5A5A5A'}));
      return {bodyY: 160};
  }
  return null;
}
/* ---------- 테마: 간지 ---------- */
function themeDivider(theme, E, it, pg, P){
  const sn = it.secNo ? two(it.secNo) : '', title = pg.title || it.secTitle, sub = pg.subtitle, en = (it.sec?.en || '').toUpperCase();
  switch (theme){
    case 'editorial':
      E.push(R(0, 0, 520, H, P.c1)); E.push(T(MX, 150, 420, 260, sn, {size: 200, bold: true, color: onC(P.c1), lh: 1, alpha: .95}));
      if (en) E.push(T(580, 230, 620, 20, en, {size: 13, bold: true, color: P.ink, ls: 2}));
      E.push(T(580, 262, 640, 130, title, {size: 46, bold: true, lh: 1.25}));
      if (sub) E.push(T(580, 400, 600, 70, sub, {size: 17, light: true, color: '#475467', lh: 1.5}));
      return {bg: '#FAFAF7', on: P.c1};
    case 'tint':
      E.push(EL(W - 520, -120, 760, 760, P.tint2, {alpha: .9})); E.push(EL(W - 300, 380, 420, 420, P.c2, {alpha: .35}));
      E.push(T(MX, 220, 300, 24, sn ? `PART ${sn}` : '', {size: 15, bold: true, color: P.c1, ls: 2}));
      E.push(T(MX, 256, 760, 130, title, {size: 50, bold: true, color: P.ink, lh: 1.22}));
      if (sub) E.push(T(MX, 400, 700, 70, sub, {size: 17, color: '#344054', lh: 1.5}));
      return {bg: P.tint};
    case 'corner':
      E.push(SH('cornerTR', W - 620, 0, 620, H, P.c1)); E.push(SH('cornerBR', W - 340, H - 300, 340, 300, P.c2, {alpha: .85}));
      E.push(T(MX, 230, 200, 60, sn, {size: 48, bold: true, color: P.c1}));
      E.push(T(MX, 300, 640, 130, title, {size: 46, bold: true, lh: 1.25}));
      if (sub) E.push(T(MX, 440, 560, 70, sub, {size: 17, light: true, color: '#475467', lh: 1.5}));
      return {bg: '#FFFFFF'};
    case 'darkhead': case 'mono':
      const bg = theme === 'mono' ? '#111111' : '#1F2328';
      E.push(R(MX, 240, 6, 200, P.c1));
      E.push(T(MX + 36, 236, 400, 24, sn ? `SECTION ${sn}${en ? '  ·  ' + en : ''}` : en, {size: 13, bold: true, color: '#FFFFFF', alpha: .6, ls: 1.5}));
      E.push(T(MX + 36, 272, 900, 120, title, {size: 48, bold: true, color: '#FFFFFF', lh: 1.25}));
      if (sub) E.push(T(MX + 36, 396, 800, 60, sub, {size: 17, color: '#FFFFFF', alpha: .7, lh: 1.5}));
      return {bg, on: bg};
    case 'frame':
      E.push(R(20, 20, W - 40, H - 40, P.c1, {r: 4}));
      E.push(T(0, 230, W, 30, sn ? `— ${sn} —` : '', {size: 18, bold: true, color: onC(P.c1), align: 'center', alpha: .8, ls: 3}));
      E.push(T(160, 272, W - 320, 120, title, {size: 48, bold: true, color: onC(P.c1), align: 'center', lh: 1.25}));
      if (sub) E.push(T(240, 400, W - 480, 60, sub, {size: 17, color: onC(P.c1), align: 'center', alpha: .8, lh: 1.5}));
      return {bg: '#FFFFFF', on: P.c1};
  }
  return null;
}
/* ---------- 테마: 표지 ---------- */
function themeCover(theme, E, P){
  const A = S.input.analysis, name = S.project.name || `${S.project.client || '브랜드'} 퍼포먼스 마케팅 제안`, concept = A?.logic?.concept || '', meta = `${S.project.date || ''}  |  ${S.project.proposer || ''}`;
  switch (theme){
    case 'editorial':
      E.push(R(0, 0, W, 14, P.c1));
      E.push(T(MX, 90, 600, 20, 'PERFORMANCE MARKETING PROPOSAL', {size: 13, bold: true, color: P.c1, ls: 2}));
      E.push(T(MX, 150, 1000, 220, concept || name, {size: 56, bold: true, lh: 1.2, valign: 'bottom'}));
      E.push(R(MX, 404, W - MX * 2, 2, '#1D2939'));
      E.push(T(MX, 424, 900, 30, name, {size: 19, color: '#344054'}));
      E.push(T(MX, 630, 900, 20, meta, {size: 13, color: '#667085'}));
      return {bg: '#FAFAF7'};
    case 'tint':
      E.push(EL(W - 640, -200, 900, 900, P.c1, {alpha: .92})); E.push(EL(W - 260, 420, 400, 400, P.c2, {alpha: .8}));
      E.push(T(MX, 180, 640, 20, 'PROPOSAL', {size: 14, bold: true, color: P.c1, ls: 3}));
      E.push(T(MX, 214, 640, 200, concept || name, {size: 46, bold: true, color: P.ink, lh: 1.25}));
      E.push(T(MX, 440, 600, 30, name, {size: 18, color: '#344054'}));
      E.push(T(MX, 630, 700, 20, meta, {size: 13, color: '#475467'}));
      return {bg: P.tint};
    case 'corner':
      E.push(SH('cornerTR', W - 560, 0, 560, H, P.c1)); E.push(SH('cornerBR', W - 300, H - 280, 300, 280, P.c2, {alpha: .85}));
      E.push(T(MX, 200, 620, 220, concept || name, {size: 48, bold: true, lh: 1.25}));
      E.push(R(MX, 440, 56, 5, P.c3 === P.c1 ? P.c2 : P.c3));
      E.push(T(MX, 466, 600, 30, name, {size: 18, light: true, color: '#475467'}));
      E.push(T(MX, 630, 700, 20, meta, {size: 13, color: '#667085'}));
      return {bg: '#FFFFFF'};
    case 'darkhead': case 'mono':
      E.push(R(MX, 196, 8, 236, P.c1));
      E.push(T(MX + 40, 190, 900, 24, 'PERFORMANCE MARKETING PROPOSAL', {size: 13, bold: true, color: '#FFFFFF', alpha: .6, ls: 2}));
      E.push(T(MX + 40, 226, 960, 150, concept || name, {size: 50, bold: true, color: '#FFFFFF', lh: 1.22}));
      E.push(T(MX + 40, 392, 900, 30, name, {size: 18, color: '#FFFFFF', alpha: .75}));
      E.push(T(MX + 40, 630, 900, 20, meta, {size: 13, color: '#FFFFFF', alpha: .6}));
      return {bg: theme === 'mono' ? '#111111' : '#1F2328', on: '#1F2328'};
    case 'frame':
      E.push(R(20, 20, W - 40, H - 40, '#FFFFFF', {line: P.c1, r: 4})); E.push(R(20, H - 200, W - 40, 180, P.c1, {r: 4}));
      E.push(T(MX, 150, 1000, 230, concept || name, {size: 50, bold: true, lh: 1.22, valign: 'bottom'}));
      E.push(T(MX, 396, 1000, 30, name, {size: 18, light: true, color: '#475467'}));
      E.push(T(MX, H - 140, 900, 24, S.project.proposer || '', {size: 18, bold: true, color: onC(P.c1)}));
      E.push(T(MX, H - 108, 900, 20, S.project.date || '', {size: 13, color: onC(P.c1), alpha: .8}));
      return {bg: '#FFFFFF', on: P.c1};
  }
  return null;
}

/* ---------- 크리에이티브 레이아웃 (이미지·영상 슬롯) ---------- */
Object.assign(LAYOUTS, {crHero: '크리에이티브: 대표 비주얼', crShorts: '크리에이티브: 숏폼 3컷(세로)', crGrid: '크리에이티브: 소재 라인업 4컷', crStory: '크리에이티브: 스토리보드', crAB: '크리에이티브: A/B 테스트안', crFeed: '크리에이티브: 피드 목업'});
const CR_LAYOUTS = ['crHero', 'crShorts', 'crGrid', 'crStory', 'crAB', 'crFeed'];
const CR_SLOTS = {crHero: 1, crShorts: 3, crGrid: 4, crStory: 6, crAB: 2, crFeed: 2};
Object.assign(LAYOUT_HINT, {crHero: ['항목(첫 항목=컨셉)', '포맷·규격', '설명'], crShorts: ['컷 제목', '길이·포맷', '장면 설명'], crGrid: ['소재명', '매체·규격', '메시지'], crStory: ['장면', '시간(예: 0~3초)', '화면·자막·내레이션'], crAB: ['안 이름(A안/B안)', '확인 지표', '메시지·차이점'], crFeed: ['매체·지면', '규격', '카피·CTA']});
function mediaSlot(E, pg, k, x, y, w, h, P, o = {}){
  const m = (pg.media || [])[k];
  if (o.phone){ E.push(R(x - 6, y - 6, w + 12, h + 12, '#101828', {r: 22})); }
  if (m?.data){
    E.push(IM(x, y, w, h, m.poster || m.data, {cover: true, nw: m.w, nh: m.h, r: o.phone ? 16 : (o.r ?? 10), video: m.video ? m : null}));
    if (m.video && !EXPORTING){ const d = Math.min(64, w * .22); E.push(EL(x + w / 2 - d / 2, y + h / 2 - d / 2, d, d, '#000000', {alpha: .55})); E.push(SH('triR', x + w / 2 - d * .14, y + h / 2 - d * .22, d * .4, d * .44, '#FFFFFF')); }
  } else {
    E.push(R(x, y, w, h, P.draft ? '#EFEFEF' : mix(P.c1, '#FFFFFF', .9), {r: o.phone ? 16 : (o.r ?? 10), ...(EXPORTING ? {} : {line: P.draft ? '#C9C9C9' : P.tint2, dash: true})}));
    E.push(T(x, y + h / 2 - 22, w, 44, EXPORTING ? (o.label || '') : `${o.label ? o.label + '\n' : ''}${o.video ? '이미지·영상' : '이미지'} 넣기`, {size: Math.min(15, w / 9), light: true, color: P.draft ? '#9A9A9A' : P.ink, align: 'center', valign: 'middle', alpha: .7}));
  }
}
const lineTxt = (it) => [it.v, it.d].filter(Boolean).join('\n');
Object.assign(LAY, {
  crHero(E, items, b, P, pg){
    const f = items[0] || {}, rest = items.slice(1), mw = Math.round(b.w * .58), mh = Math.min(b.h, Math.round(mw * 9 / 16));
    mediaSlot(E, pg, 0, b.x, b.y, mw, mh, P, {label: 'KEY VISUAL', video: true});
    const rx = b.x + mw + 36, rw = b.w - mw - 36;
    E.push(T(rx, b.y, rw, 16, 'CONCEPT', {size: 11, bold: true, color: P.ink, ls: 1.2}));
    const hh = tH(f.h, 25, rw, 1.32, 700); E.push(T(rx, b.y + 26, rw, hh, f.h || '', {size: 25, bold: true, lh: 1.32}));
    let y = b.y + 26 + hh + 12;
    if (f.d){ const dh = Math.min(150, tH(f.d, 15, rw, 1.55, 300)); E.push(T(rx, y, rw, dh, f.d, {size: 15, light: true, color: '#344054', lh: 1.55})); y += dh + 16; }
    E.push(R(rx, y, rw, 1, '#D0D5DD')); y += 14;
    const lab = 92, rowH = Math.max(34, (b.y + b.h - y) / Math.max(1, rest.length));
    rest.forEach(it => { E.push(T(rx, y, lab, rowH, it.h, {size: 13, bold: true, color: P.ink, lh: 1.4})); E.push(T(rx + lab, y, rw - lab, rowH, lineTxt(it), {size: 13.5, light: true, color: '#1D2939', lh: 1.45, minScale: .7})); y += rowH; });
  },
  crShorts(E, items, b, P, pg){
    const n = 3, capH = 120, g = 36, sh = Math.min(b.h - capH - 10, 420), sw = Math.round(sh * 9 / 16), tot = n * sw + (n - 1) * g;
    const textW = b.w - tot - 48, x0 = b.x + (textW >= 260 ? textW + 48 : (b.w - tot) / 2);
    if (textW >= 260){
      E.push(T(b.x, b.y + 4, textW, 16, 'SHORT-FORM', {size: 11, bold: true, color: P.ink, ls: 1.2}));
      E.push(T(b.x, b.y + 30, textW, 120, pg.keyMsg || pg.subtitle || '', {size: 22, bold: true, lh: 1.4}));
      const notes = items.slice(n); let y = b.y + 170;
      notes.forEach(it => { E.push(T(b.x, y, textW, 20, it.h, {size: 13.5, bold: true, color: P.ink})); const dh = tH(lineTxt(it), 13.5, textW, 1.5, 300); E.push(T(b.x, y + 22, textW, dh, lineTxt(it), {size: 13.5, light: true, color: '#344054', lh: 1.5})); y += 30 + dh; });
    }
    items.slice(0, n).concat(Array(Math.max(0, n - items.length)).fill({})).slice(0, n).forEach((it, i) => {
      const x = x0 + i * (sw + g);
      mediaSlot(E, pg, i, x, b.y + 6, sw, sh, P, {phone: true, label: `컷 ${i + 1}`, video: true});
      E.push(T(x - 8, b.y + sh + 26, sw + 16, 22, `${two(i + 1)}  ${it.h || ''}`, {size: 14.5, bold: true, lh: 1.3}));
      if (lineTxt(it)) E.push(T(x - 8, b.y + sh + 50, sw + 16, b.y + b.h - (b.y + sh + 50), lineTxt(it), {size: 12.5, light: true, color: '#475467', lh: 1.45, minScale: .7}));
    });
  },
  crGrid(E, items, b, P, pg){
    const n = 4, g = 20, cw = (b.w - g * (n - 1)) / n, capH = 150, sh = Math.min(cw, b.h - capH);
    for (let i = 0; i < n; i++){
      const it = items[i] || {}, x = b.x + i * (cw + g);
      mediaSlot(E, pg, i, x, b.y, cw, sh, P, {label: `소재 ${i + 1}`, video: true});
      E.push(T(x, b.y + sh + 14, cw, 24, it.h || '', {size: 17, bold: true, lh: 1.3}));
      if (it.v) E.push(T(x, b.y + sh + 42, cw, 18, it.v, {size: 12.5, bold: true, color: P.ink}));
      if (it.d) E.push(T(x, b.y + sh + (it.v ? 66 : 44), cw, b.y + b.h - (b.y + sh + (it.v ? 66 : 44)), it.d, {size: 14.5, light: true, color: '#475467', lh: 1.45, minScale: .7}));
    }
  },
  crStory(E, items, b, P, pg){
    const n = Math.max(4, Math.min(6, items.length || 4)), cols = n <= 4 ? 4 : 3, rows = Math.ceil(n / cols), g = 18;
    const cw = (b.w - g * (cols - 1)) / cols, rh = (b.h - g * (rows - 1)) / rows, ih = Math.min(cw * 9 / 16, rh - 96);
    for (let i = 0; i < n; i++){
      const it = items[i] || {}, x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (rh + g);
      mediaSlot(E, pg, i, x, y, cw, ih, P, {label: `S#${i + 1}`, r: 6});
      E.push(R(x, y + ih + 10, 46, 20, P.draft ? '#3A3A3A' : P.c1, {r: 3})); E.push(T(x, y + ih + 10, 46, 20, `S#${i + 1}`, {size: 10.5, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle'}));
      if (it.v) E.push(T(x + 54, y + ih + 10, cw - 54, 20, it.v, {size: 11.5, bold: true, color: P.ink, valign: 'middle'}));
      E.push(T(x, y + ih + 36, cw, rh - ih - 36, [it.h, it.d].filter(Boolean).join('\n'), {size: 14, light: true, color: '#1D2939', lh: 1.45, minScale: .65}));
    }
  },
  crAB(E, items, b, P, pg){
    const g = 40, cw = (b.w - g) / 2, ih = Math.min(cw * 9 / 16, b.h - 150);
    [0, 1].forEach(i => {
      const it = items[i] || {}, x = b.x + i * (cw + g), tag = i ? 'B' : 'A', fill = i ? (P.draft ? '#6B6B6B' : P.c2) : (P.draft ? '#3A3A3A' : P.c1);
      mediaSlot(E, pg, i, x, b.y + 34, cw, ih, P, {label: `${tag}안`, video: true});
      E.push(R(x, b.y, 64, 26, fill, {r: 13})); E.push(T(x, b.y, 64, 26, `${tag}안`, {size: 13, bold: true, color: onC(fill), align: 'center', valign: 'middle'}));
      E.push(T(x + 76, b.y, cw - 76, 26, it.h || '', {size: 16, bold: true, valign: 'middle'}));
      E.push(T(x, b.y + 46 + ih, cw, b.h - ih - 46 - (it.v ? 26 : 0), it.d || '', {size: 14, light: true, color: '#344054', lh: 1.5, minScale: .7}));
      if (it.v) E.push(T(x, b.y + b.h - 22, cw, 20, '확인 지표  ' + it.v, {size: 12.5, bold: true, color: P.ink}));
    });
    E.push(R(b.x + cw + g / 2, b.y + 34, 1, ih, '#D0D5DD'));
  },
  crFeed(E, items, b, P, pg){
    const n = 2, pw = 300, ph = Math.min(b.h, 470), g = 40;
    for (let i = 0; i < n; i++){
      const it = items[i] || {}, x = b.x + i * (pw + g), y = b.y;
      E.push(R(x, y, pw, ph, '#FFFFFF', {r: 18, line: '#D0D5DD'}));
      E.push(EL(x + 14, y + 14, 28, 28, P.draft ? '#BDBDBD' : P.c1)); E.push(T(x + 50, y + 14, pw - 64, 28, S.project.client || 'brand', {size: 12.5, bold: true, valign: 'middle'}));
      E.push(T(x + pw - 70, y + 14, 56, 28, 'Sponsored', {size: 9.5, color: '#98A2B3', align: 'right', valign: 'middle'}));
      const iy = y + 54, ih = Math.min(pw, ph - 54 - 52 - Math.min(110, tH(it.d || '', 12.5, pw - 28, 1.45, 500) + 14)); mediaSlot(E, pg, i, x, iy, pw, ih, P, {label: it.v || '1:1', r: 0, video: true});
      E.push(T(x + 14, iy + ih + 10, pw - 28, ph - ih - 54 - 56, it.d || '', {size: 12.5, color: '#1D2939', lh: 1.45, wt: 500, minScale: .7}));
      E.push(R(x + 14, y + ph - 42, pw - 28, 30, P.draft ? '#EDEDED' : P.tint, {r: 6})); E.push(T(x + 24, y + ph - 42, pw - 48, 30, it.h || '자세히 보기', {size: 12, bold: true, color: P.ink, valign: 'middle'}));
    }
    const rx = b.x + n * (pw + g) + 8, rw = b.w - (rx - b.x);
    if (rw > 200){
      E.push(T(rx, b.y + 4, rw, 16, 'FEED PLAN', {size: 11, bold: true, color: P.ink, ls: 1.2}));
      E.push(T(rx, b.y + 30, rw, 100, pg.keyMsg || pg.subtitle || '', {size: 20, bold: true, lh: 1.4}));
      let y = b.y + 30 + Math.min(110, tH(pg.keyMsg || pg.subtitle || '', 20, rw, 1.4, 700)) + 22;
      items.slice(0, n).forEach((it, i) => { const t = `${it.v ? it.v + '\n' : ''}${it.d || ''}`, dh = Math.min(120, tH(t, 13.5, rw - 36, 1.5, 500)); E.push(R(rx, y, rw, dh + 52, P.draft ? '#F4F4F4' : P.tint, {r: 10})); E.push(T(rx + 18, y + 14, rw - 36, 20, `시안 ${i + 1}  ·  ${it.h || ''}`, {size: 14, bold: true, color: P.draft ? '#2B2B2B' : P.c1, minScale: .6})); E.push(T(rx + 18, y + 40, rw - 36, dh + 4, t, {size: 13.5, color: '#344054', lh: 1.5, wt: 500, minScale: .7})); y += dh + 66; });
      items.slice(n).forEach(it => { E.push(R(rx, y + 6, 6, 6, P.draft ? '#3A3A3A' : P.c1)); E.push(T(rx + 16, y, rw - 16, 20, it.h, {size: 14, bold: true})); const dh = tH(lineTxt(it), 13.5, rw - 16, 1.5, 300); E.push(T(rx + 16, y + 22, rw - 16, dh, lineTxt(it), {size: 13.5, light: true, color: '#344054', lh: 1.5})); y += 34 + dh; });
    }
  }
});

/* ---------- 영상 → 포스터 프레임 ---------- */
function videoPoster(url){
  return new Promise(res => { const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.src = url;
    const done = () => { try { const s = Math.min(1, 1280 / (v.videoWidth || 1280)), cv = document.createElement('canvas'); cv.width = Math.round((v.videoWidth || 1280) * s); cv.height = Math.round((v.videoHeight || 720) * s); cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); res({data: cv.toDataURL('image/jpeg', .85), w: cv.width, h: cv.height}); } catch(e){ res(null); } };
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); }; v.onseeked = done; v.onerror = () => res(null); setTimeout(() => res(null), 8000); });
}
