/* =========================================================
   Proposal Studio v2 — core
   utils · state · storage(IndexedDB) · slide renderer · export · file parsing
   ========================================================= */
if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const two = n => String(n).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const today = () => { const d = new Date(); return `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`; };
const isoToday = () => new Date().toISOString().slice(0, 10);
const RAW = {}; // 원본 PDF base64 (메모리 전용)

const STEPS = [['manage', '제안 관리'], ['input', '인풋'], ['logic', '로직'], ['wash', '디자인 워싱'], ['check', '점검·취합']];
const PAGE_TYPES = {divider: '간지형', bridge: '브릿지형', strategy: '전략형', explain: '설명형'};
const LAYOUTS = {list: '리스트', cards: '카드', process: '프로세스', kpi: 'KPI 수치', hero: '빅넘버', split: '좌우 분할', spec: '스펙 시트(매체)', table: '표', compare: 'AS-IS → TO-BE', funnel: '퍼널', timeline: '타임라인', chart: '막대 차트', matrix: '2×2 매트릭스', grid: '6칸 그리드', image: '이미지'};
/* 레이아웃별 항목 입력 안내: [h, v, d] */
const LAYOUT_HINT = {
  compare: ['비교 항목', 'AS-IS', 'TO-BE'], chart: ['항목', '비중(예: 35%)', '설명/금액'], funnel: ['퍼널 단계', 'KPI', '매체·역할'],
  timeline: ['시점/기간', '산출물', '실행 내용'], spec: ['구분(누구에게 등)', '', '내용'], kpi: ['지표명', '수치', '설명'], hero: ['지표명', '수치', '설명'],
  table: ['구분', '지표/수치', '내용'], default: ['항목명', '수치(선택)', '설명']
};
const KINDS = {strategy: '전략', company: '회사소개', brand: '브랜드 스터디', case: '케이스 스터디'};
const ROLES = {custom: '직접 구성', team: '운영 조직', playbook: '핵심 전략', media: '매체 전략·액션플랜', budget: '예산·시즌', creative: '크리에이티브', kpi: 'KPI·측정', report: '리포팅', optimize: '최적화·로드맵', tech: '기술·솔루션', issue: '이슈 대응', pricing: '비용', company: '회사소개', brand: '시장·브랜드 진단', case: '케이스 스터디'};
const STATUS = ['준비', '작성중', '검토', '제출', '수주', '실주', '보류'];
const URL_TYPES = ['자사몰', '공식몰', '네이버 스마트스토어', '네이버 브랜드스토어', '쿠팡', '올리브영', '무신사·29CM', '카카오 선물하기', '인스타그램', '유튜브', '기타'];
const MODELS = [['claude-sonnet-5-5', 'Claude Sonnet 5.5'], ['claude-opus-5-5', 'Claude Opus 5.5'], ['claude-haiku-5-5', 'Claude Haiku 5.5']];
const THEMES = {clean: '클린 (화이트)', band: '컬러 밴드 헤더', side: '사이드 바'};

function defaultState(){
  return {
    v: 2, id: uid(), created: Date.now(), updated: Date.now(), step: 'input',
    project: {name: '', client: '', proposer: 'MADUP (매드업)', date: today(), status: '준비', due: '', pt: '', owner: '', budget: '', memo: ''},
    settings: {model: 'claude-sonnet-5-5', web: true},
    design: {theme: 'clean'},
    input: {
      rfp: [], urls: [{type: '자사몰', url: ''}], product: '', brand: [], notes: '', competitors: '', currentMix: '',
      analysis: null,
      colors: [{hex: '#1F3A93', role: 'Main', name: 'Deep Navy', reason: ''}, {hex: '#4C8BF5', role: 'Sub', name: 'Sky Blue', reason: ''}, {hex: '#FFB020', role: 'Accent', name: 'Amber', reason: ''}],
      colorConcept: ''
    },
    template: {logo: null, logoW: 0, logoH: 0, logoPos: 'tr', coverBg: null, footer: 'MADUP'},
    sections: [],
    checks: {typos: null, fit: null},
    merge: {cover: true, guide: true, toc: true, closing: true, done: false}
  };
}
function normalize(s){
  const d = defaultState();
  const o = Object.assign(d, s);
  o.project = Object.assign(defaultState().project, s.project || {});
  o.input = Object.assign(defaultState().input, s.input || {});
  o.design = Object.assign({theme: 'clean'}, s.design || {});
  o.merge = Object.assign(defaultState().merge, s.merge || {});
  o.sections = (o.sections || []).map(x => ({...x, role: x.role && x.role !== 'custom' ? x.role : (x.kind && x.kind !== 'strategy' ? x.kind : (typeof inferRole === 'function' ? inferRole((x.title || '') + ' ' + (x.goal || '')) : 'custom'))}));
  if (!o.id) o.id = uid();
  return o;
}

/* ---------------- IndexedDB (여러 제안서 관리) ---------------- */
const DB = {
  db: null,
  open(){ if (this.db) return Promise.resolve(this.db); return new Promise((res, rej) => { const r = indexedDB.open('proposal-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('projects', {keyPath: 'id'}); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
  async tx(mode, fn){ const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('projects', mode); const st = t.objectStore('projects'); const q = fn(st); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); },
  all(){ return this.tx('readonly', st => st.getAll()); },
  put(p){ return this.tx('readwrite', st => st.put(p)); },
  del(id){ return this.tx('readwrite', st => st.delete(id)); }
};
let S = defaultState();
let LIST = []; // 모든 제안서 (S는 LIST 안의 현재 항목과 동일 객체)
let MEDIA = [];
let saveT;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    S.updated = Date.now();
    try { await DB.put(clone(S)); localStorage.setItem('ps_current', S.id); }
    catch(e){ console.error(e); toast('저장 실패 — 상단 [내보내기]로 백업하세요'); }
  }, 400);
}
async function boot(){
  try {
    LIST = (await DB.all()).map(normalize);
    const legacy = localStorage.getItem('ps_state');
    if (legacy){ try { const o = normalize(JSON.parse(legacy)); if (!LIST.some(p => p.id === o.id)){ LIST.push(o); await DB.put(o); } } catch(e){} localStorage.removeItem('ps_state'); }
  } catch(e){ console.error(e); toast('브라우저 저장소(IndexedDB)를 사용할 수 없습니다 — 시크릿 모드인지 확인하세요', 5000); }
  const cur = localStorage.getItem('ps_current');
  const found = LIST.find(p => p.id === cur) || [...LIST].sort((a, b) => b.updated - a.updated)[0];
  if (found) S = found; else { S = defaultState(); LIST.push(S); }
  if (!S.step) S.step = 'input';
}
function openProject(id, step){
  const p = LIST.find(x => x.id === id); if (!p) return;
  S = p; S.step = step || (S.step === 'manage' ? 'input' : S.step || 'input'); localStorage.setItem('ps_current', S.id); save(); render(); scrollTo(0, 0);
}
function newProject(){ const p = defaultState(); const t = S.template; if (t?.logo) p.template = clone(t); LIST.push(p); S = p; S.step = 'input'; save(); render(); scrollTo(0, 0); }
const apiKey = () => localStorage.getItem('ps_key') || '';

function getPath(o, p){ return p.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setPath(o, p, v){ const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }

/* ---------------- UI helpers ---------------- */
function toast(m, ms = 2800){ $$('.toast').forEach(x => x.remove()); const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), ms); }
function busy(msg, sub = ''){ let b = $('#busy'); if (!b){ b = document.createElement('div'); b.id = 'busy'; b.className = 'busy'; b.innerHTML = '<div class="bx"><div class="spin"></div><div class="msg"></div><div class="sub"></div></div>'; document.body.appendChild(b); } $('.msg', b).textContent = msg; $('.sub', b).textContent = sub; }
function unbusy(){ $('#busy')?.remove(); }
function modal(title, html, wide = true){ const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="mb" style="${wide ? '' : 'width:min(680px,100%)'}"><div class="mh"><h3>${title}</h3><button class="btn" data-close>닫기</button></div><div class="mc">${html}</div></div>`; m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); }); $('#layer').appendChild(m); return m; }
async function pool(arr, n, fn){ const out = []; let i = 0; const run = async () => { while (i < arr.length){ const k = i++; out[k] = await fn(arr[k], k); } }; await Promise.all(Array.from({length: Math.min(n, arr.length)}, run)); return out; }

/* ---------------- color utils ---------------- */
function hexRgb(h){ h = (h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b){ return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function mix(a, b, t){ const A = hexRgb(a), B = hexRgb(b); return rgbHex(...A.map((v, i) => v + (B[i] - v) * t)); }
function lum(h){ const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
const onC = c => lum(c) > .42 ? '#111111' : '#FFFFFF';
const validHex = h => /^#[0-9A-Fa-f]{6}$/.test(h || '');
function palette(washed){
  if (!washed) return {c1: '#3A3A3A', c2: '#6B6B6B', c3: '#8C8C8C', ink: '#3A3A3A', tint: '#F3F3F3', tint2: '#E9E9E9', draft: true};
  const cs = S.input.colors.map(c => validHex(c.hex) ? c.hex.toUpperCase() : '#333333');
  const c1 = cs[0], c2 = cs[1] || mix(c1, '#FFFFFF', .35), c3 = cs[2] || c2;
  const ink = lum(c1) > .35 ? mix(c1, '#000000', .45) : c1;
  return {c1, c2, c3, ink, tint: mix(c1, '#FFFFFF', .93), tint2: mix(c2, '#FFFFFF', .86)};
}

/* =========================================================
   SLIDE SPEC — 1280×720 좌표계 공유 (HTML 미리보기 = PPT)
   간격 표준: 타이틀 34/44 → 8 → 서브 18/26 → 28 → 본문 / 항목 간 16~20 / 라벨→설명 6
   ========================================================= */
const W = 1280, H = 720, MX = 64;
const SP = {titleY: 86, titleH: 46, subY: 140, subH: 26, bodyY: 196, bodyEnd: 640, keyY: 596, keyH: 50, gap: 18, inner: 6};
const R = (x, y, w, h, fill, o = {}) => ({k: 'r', x, y, w, h, fill, ...o});
const T = (x, y, w, h, text, o = {}) => ({k: 't', x, y, w, h, text: String(text ?? ''), size: 16, color: '#111111', align: 'left', valign: 'top', lh: 1.4, ...o});
const IM = (x, y, w, h, data, o = {}) => ({k: 'i', x, y, w, h, data, ...o});

/* 텍스트 높이 추정 (한글 0.93em, 영문/숫자 0.55~0.62em) */
function textW(s, size){ let w = 0; for (const ch of s) w += /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? size * .93 : /[A-Z0-9%@#]/.test(ch) ? size * .62 : /\s/.test(ch) ? size * .28 : size * .52; return w; }
function lines(text, size, w){ if (!text) return 0; return String(text).split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(textW(l, size) / Math.max(40, w - 4))), 0); }
const tH = (text, size, w, lh = 1.4) => Math.ceil(lines(text, size, w) * size * lh);

function fitBox(nw, nh, x, y, w, h){ if (!nw || !nh) return {x, y, w, h}; const s = Math.min(w / nw, h / nh); const ww = nw * s, hh = nh * s; return {x: x + (w - ww) / 2, y: y + (h - hh) / 2, w: ww, h: hh}; }
const itemsOf = pg => (pg.items || []).filter(i => (i.h || i.d || i.v));
const pct = v => { const m = String(v || '').match(/-?[\d.]+/); return m ? parseFloat(m[0]) : 0; };

function chrome(E, it, P, dark, opts = {}){
  const tp = S.template, fg = dark ? onC(dark) : '#111111';
  const subC = dark ? fg : '#98A2B3';
  const lh = 26, lw = 150, pos = tp.logoPos || 'tr';
  const lx = pos.includes('l') ? MX : W - MX - lw, ly = pos.includes('t') ? 30 : H - 28 - lh;
  if (tp.logo){ const b = fitBox(tp.logoW, tp.logoH, lx, ly, lw, lh); E.push(IM(pos.includes('r') ? W - MX - b.w : MX, b.y, b.w, b.h, tp.logo)); }
  else E.push(T(lx, ly, lw, lh, tp.footer || 'MADUP', {size: 15, bold: true, color: dark ? fg : (opts.labelOn || P.ink), align: pos.includes('r') ? 'right' : 'left', valign: 'middle', ls: .5}));
  if (it.label && !dark){ const labX = pos === 'tl' ? MX + 170 : (opts.labelX || MX); E.push(T(labX, 34, 760, 20, it.label, {size: 12, bold: true, color: opts.labelOn || P.ink, valign: 'middle', ls: .3})); }
  const fy = H - 32;
  if (pos !== 'bl') E.push(T(opts.labelX || MX, fy, 640, 16, `${S.project.client || ''}${S.project.client ? ' · ' : ''}${S.project.name || 'Performance Marketing Proposal'}`, {size: 10, light: true, color: subC, alpha: dark ? .7 : 1}));
  if (it.no && pos !== 'br') E.push(T(W - MX - 80, fy, 80, 16, two(it.no), {size: 11, bold: true, color: dark ? fg : P.ink, align: 'right', alpha: dark ? .8 : 1}));
}

/* ---------- body layouts (box = {x,y,w,h}) ---------- */
function rowsFit(items, b, measure, gap, maxExtra = 18){ // 공간이 남으면 글자·간격을 키우고, 넘치면 줄임
  for (const scale of [1.12, 1.06, 1, .92, .85, .78]){
    const hs = items.map(i => measure(i, scale)); const tot = hs.reduce((a, c) => a + c, 0) + gap * (items.length - 1);
    if (tot <= b.h || scale === .78){ const slack = Math.max(0, b.h - tot); return {hs, scale, gapX: items.length > 1 ? Math.min(maxExtra, slack / (items.length - 1) * .6) : 0}; }
  }
}
const LAY = {
  list(E, items, b, P){
    const hasV = items.some(i => i.v), vw = hasV ? 200 : 0, tw = b.w - 28 - vw;
    const {hs, scale, gapX} = rowsFit(items, b, (i, s) => (i.h ? tH(i.h, 19 * s, tw, 1.3) + SP.inner : 0) + tH(i.d, 16 * s, tw, 1.45), 24);
    let y = b.y;
    items.forEach((it, k) => {
      E.push(R(b.x, y + 8, 8, 8, P.c1, {r: 4}));
      let yy = y;
      if (it.h){ const hh = tH(it.h, 19 * scale, tw, 1.3); E.push(T(b.x + 26, yy, tw, hh, it.h, {size: 19 * scale, bold: true, lh: 1.3})); yy += hh + SP.inner; }
      if (it.d) E.push(T(b.x + 26, yy, tw, tH(it.d, 16 * scale, tw, 1.45), it.d, {size: 16 * scale, light: true, color: '#444444', lh: 1.45}));
      if (hasV && it.v) E.push(T(b.x + b.w - vw, y, vw, 30, it.v, {size: 22 * scale, bold: true, color: P.ink, align: 'right'}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(b.x + 26, y + 11 + gapX / 2, b.w - 26, 1, '#EAECF0')); y += 24 + gapX; }
    });
  },
  cards(E, items, b, P){
    const n = items.length || 1, cols = n <= 4 ? n : 3, rows = Math.min(2, Math.ceil(n / cols));
    const g = 20, cw = (b.w - (cols - 1) * g) / cols, pad = 26, iw = cw - pad * 2;
    const content = items.slice(0, cols * rows).map(it => 24 + 14 + (it.v ? tH(it.v, 30, iw, 1.2) + 8 : 0) + tH(it.h, 20, iw, 1.3) + 8 + tH(it.d, 15, iw, 1.5));
    const maxC = Math.max(...content) + pad * 2;
    const ch = rows > 1 ? (b.h - g) / 2 : Math.min(b.h, Math.max(220, maxC + 20));
    items.slice(0, cols * rows).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, P.draft ? '#F6F6F6' : P.tint, {r: 12}));
      E.push(R(x, y, cw, 5, i % 2 ? P.c2 : P.c1, {r: 3}));
      let yy = y + pad;
      E.push(T(x + pad, yy, 60, 24, two(i + 1), {size: 17, bold: true, color: P.ink})); yy += 24 + 14;
      if (it.v){ const vh = tH(it.v, 30, iw, 1.2); E.push(T(x + pad, yy, iw, vh, it.v, {size: 30, bold: true, color: P.ink, lh: 1.2})); yy += vh + 8; }
      const hh = tH(it.h, 20, iw, 1.3); E.push(T(x + pad, yy, iw, hh, it.h, {size: 20, bold: true, lh: 1.3})); yy += hh + 8;
      E.push(T(x + pad, yy, iw, y + ch - yy - pad + 6, it.d, {size: 15, light: true, color: '#555555', lh: 1.5}));
    });
  },
  process(E, items, b, P){
    const n = Math.min(6, items.length || 1), g = 14, sw = (b.w - (n - 1) * g) / n;
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + i * (sw + g), fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .12) : mix(P.c1, P.c2, n > 1 ? i / (n - 1) * .8 : 0);
      E.push(R(x, b.y, sw, 92, fill, {r: 10}));
      E.push(T(x + 18, b.y + 16, sw - 36, 16, `STEP ${two(i + 1)}`, {size: 11, bold: true, color: onC(fill), alpha: .75, ls: .5}));
      E.push(T(x + 18, b.y + 38, sw - 36, 44, it.h, {size: 17, bold: true, color: onC(fill), valign: 'top', lh: 1.3}));
      if (i < n - 1) E.push(T(x + sw - 2, b.y + 30, g + 4, 30, '›', {size: 26, bold: true, color: P.c3, align: 'center', valign: 'middle', lh: 1}));
      let yy = b.y + 92 + 18;
      if (it.v){ E.push(T(x + 2, yy, sw - 4, 34, it.v, {size: 22, bold: true, color: P.ink})); yy += 40; }
      E.push(T(x + 2, yy, sw - 4, b.y + b.h - yy, it.d, {size: 14.5, light: true, color: '#555555', lh: 1.5}));
    });
  },
  kpi(E, items, b, P){
    const n = Math.min(4, items.length || 1), cw = b.w / n;
    const maxD = Math.max(...items.slice(0, 4).map(i => tH(i.d, 15, cw - 56, 1.5)));
    const h = Math.min(b.h, Math.max(300, 78 + 18 + 30 + 8 + maxD + 40));
    E.push(R(b.x, b.y, b.w, h, P.draft ? '#F7F7F7' : P.tint, {r: 12}));
    items.slice(0, 4).forEach((it, i) => {
      const x = b.x + i * cw;
      if (i) E.push(R(x, b.y + 24, 1, h - 48, P.draft ? '#DDDDDD' : P.tint2));
      E.push(T(x + 28, b.y + 26, cw - 56, 64, it.v || '—', {size: 46, bold: true, color: P.ink, lh: 1.2, valign: 'middle'}));
      E.push(R(x + 28, b.y + 100, 28, 3, P.c3));
      E.push(T(x + 28, b.y + 114, cw - 56, 28, it.h, {size: 19, bold: true, lh: 1.3}));
      E.push(T(x + 28, b.y + 150, cw - 56, h - 170, it.d, {size: 15, light: true, color: '#555555', lh: 1.5}));
    });
  },
  hero(E, items, b, P, pg){
    const f = items[0] || {}, rest = items.slice(1), lw = rest.length ? Math.min(520, b.w * .44) : b.w;
    E.push(T(b.x, b.y + 8, lw, 110, f.v || pg.keyMsg || '', {size: 84, bold: true, color: P.ink, lh: 1.1}));
    E.push(R(b.x, b.y + 136, 40, 4, P.c3));
    const hh = tH(f.h, 24, lw - 20, 1.3);
    E.push(T(b.x, b.y + 156, lw - 20, hh, f.h, {size: 24, bold: true, lh: 1.3}));
    E.push(T(b.x, b.y + 156 + hh + 10, lw - 30, b.h - 170 - hh, f.d, {size: 16, light: true, color: '#555555', lh: 1.55}));
    if (!rest.length) return;
    const rx = b.x + lw + 40, rw = b.w - lw - 40;
    E.push(R(rx - 20, b.y, 1, b.h, '#EAECF0'));
    LAY.list(E, rest, {x: rx, y: b.y + 4, w: rw, h: b.h - 4}, P);
  },
  split(E, items, b, P, pg){
    const lw = Math.min(400, b.w * .36), fill = P.draft ? '#3A3A3A' : P.c1;
    E.push(R(b.x, b.y, lw, b.h, fill, {r: 14}));
    E.push(T(b.x + 34, b.y + 34, lw - 68, 18, 'KEY MESSAGE', {size: 11, bold: true, color: onC(fill), alpha: .7, ls: .8}));
    E.push(T(b.x + 34, b.y + 62, lw - 68, b.h - 96, pg.keyMsg || pg.subtitle || pg.title, {size: 26, bold: true, color: onC(fill), lh: 1.42}));
    const rx = b.x + lw + 40, rw = b.w - lw - 40, tw = rw - 52;
    const {hs, scale, gapX} = rowsFit(items, {h: b.h}, (i, s) => tH(i.h + (i.v ? '  ·  ' + i.v : ''), 19 * s, tw, 1.3) + SP.inner + tH(i.d, 15 * s, tw, 1.5), 22);
    let y = b.y + 6;
    items.forEach((it, k) => {
      E.push(T(rx, y, 44, 26, two(k + 1), {size: 19, bold: true, color: P.ink}));
      const hh = tH(it.h + (it.v ? '  ·  ' + it.v : ''), 19 * scale, tw, 1.3);
      E.push(T(rx + 52, y, tw, hh, it.h + (it.v ? `  ·  ${it.v}` : ''), {size: 19 * scale, bold: true, lh: 1.3}));
      E.push(T(rx + 52, y + hh + SP.inner, tw, hs[k] - hh - SP.inner, it.d, {size: 15 * scale, light: true, color: '#555555', lh: 1.5}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(rx + 52, y + 10 + gapX / 2, tw, 1, '#EAECF0')); y += 22 + gapX; }
    });
  },
  spec(E, items, b, P, pg){ // 매체 액션 플랜: 좌측 역할 패널 + 우측 라벨/내용 행
    const lw = 300, fill = P.draft ? '#3A3A3A' : P.c1, fg = onC(fill);
    E.push(R(b.x, b.y, lw, b.h, fill, {r: 14}));
    E.push(T(b.x + 28, b.y + 28, lw - 56, 16, pg.tag || 'ROLE', {size: 11, bold: true, color: fg, alpha: .7, ls: .8}));
    E.push(T(b.x + 28, b.y + 54, lw - 56, b.h - 82, pg.keyMsg || pg.subtitle || '', {size: 22, bold: true, color: fg, lh: 1.42}));
    const rx = b.x + lw + 32, rw = b.w - lw - 32, lab = 116, tw = rw - lab - 16;
    const {hs, scale, gapX} = rowsFit(items, {h: b.h - 8}, (i, s) => Math.max(22, tH(i.d, 15.5 * s, tw, 1.48)) + (i.v ? 26 : 0), 22, 16);
    let y = b.y + 4;
    items.forEach((it, k) => {
      E.push(T(rx, y, lab, 22, it.h, {size: 14 * Math.min(scale, 1.08), bold: true, color: P.ink, lh: 1.5}));
      E.push(T(rx + lab + 16, y, tw, hs[k], it.d + (it.v ? `\n${it.v}` : ''), {size: 15.5 * scale, light: true, color: '#333333', lh: 1.48}));
      y += hs[k];
      if (k < items.length - 1){ E.push(R(rx, y + 10 + gapX / 2, rw, 1, '#EAECF0')); y += 22 + gapX; }
    });
  },
  table(E, items, b, P){
    const hasV = items.some(i => i.v), hdr = 42, c1w = Math.min(260, b.w * .24), c3w = hasV ? Math.min(220, b.w * .2) : 0, c2w = b.w - c1w - c3w;
    const hf = P.draft ? '#3A3A3A' : P.c1;
    const hs0 = items.map(i => Math.max(tH(i.h, 16, c1w - 36, 1.35), tH(i.d, 15, c2w - 36, 1.45), tH(i.v, 15, c3w - 30, 1.35)) + 22);
    const tot = hs0.reduce((a, c) => a + c, 0), sc = tot > b.h - hdr ? (b.h - hdr) / tot : 1;
    const fill = Math.min(74, (b.h - hdr) / Math.max(1, items.length) * .82);
    const hs = hs0.map(h => Math.max(36, sc < 1 ? h * sc : Math.max(h, fill))), fs = sc < 1 ? Math.max(.82, sc) : (fill > 60 ? 1.06 : 1);
    E.push(R(b.x, b.y, b.w, hdr, hf, {r: 6}));
    const head = (b.colsHead || ['구분', '내용', '지표 / 수치']);
    E.push(T(b.x + 18, b.y, c1w - 24, hdr, head[0], {size: 14, bold: true, color: onC(hf), valign: 'middle'}));
    E.push(T(b.x + c1w + 18, b.y, c2w - 24, hdr, head[1], {size: 14, bold: true, color: onC(hf), valign: 'middle'}));
    if (hasV) E.push(T(b.x + c1w + c2w + 14, b.y, c3w - 20, hdr, head[2], {size: 14, bold: true, color: onC(hf), valign: 'middle'}));
    let y = b.y + hdr;
    items.forEach((it, i) => {
      const rh = hs[i];
      E.push(R(b.x, y, b.w, rh, i % 2 ? (P.draft ? '#F7F7F7' : P.tint) : '#FFFFFF'));
      E.push(T(b.x + 18, y, c1w - 30, rh, it.h, {size: 16 * fs, bold: true, valign: 'middle', lh: 1.35}));
      E.push(T(b.x + c1w + 18, y, c2w - 30, rh, it.d, {size: 15 * fs, light: true, color: '#3A3A3A', valign: 'middle', lh: 1.45}));
      if (hasV) E.push(T(b.x + c1w + c2w + 14, y, c3w - 22, rh, it.v, {size: 15 * fs, bold: true, color: P.ink, valign: 'middle', lh: 1.35}));
      y += rh;
    });
    E.push(R(b.x, y, b.w, 2, hf));
  },
  compare(E, items, b, P){
    const lab = 200, g = 44, cw = (b.w - lab - g) / 2, hdr = 40;
    const hs0 = items.map(i => Math.max(tH(i.h, 16, lab - 20, 1.35), tH(i.v, 15, cw - 40, 1.45), tH(i.d, 15, cw - 40, 1.45)) + 26);
    const tot = hs0.reduce((a, c) => a + c, 0), sc = tot > b.h - hdr - 8 ? (b.h - hdr - 8) / tot : 1;
    const hs = hs0.map(h => h * sc);
    const ax = b.x + lab, bx = ax + cw + g;
    E.push(R(ax, b.y, cw, hdr, '#E4E7EC', {r: 6})); E.push(T(ax, b.y, cw, hdr, 'AS-IS', {size: 14, bold: true, color: '#475467', align: 'center', valign: 'middle', ls: 1}));
    E.push(R(bx, b.y, cw, hdr, P.draft ? '#3A3A3A' : P.c1, {r: 6})); E.push(T(bx, b.y, cw, hdr, 'TO-BE', {size: 14, bold: true, color: onC(P.draft ? '#3A3A3A' : P.c1), align: 'center', valign: 'middle', ls: 1}));
    let y = b.y + hdr + 8;
    items.forEach((it, i) => {
      const rh = hs[i];
      E.push(T(b.x, y, lab - 16, rh, it.h, {size: 16 * Math.max(.85, sc), bold: true, valign: 'middle', lh: 1.35}));
      E.push(R(ax, y + 3, cw, rh - 6, '#F4F5F7', {r: 8}));
      E.push(T(ax + 20, y + 3, cw - 40, rh - 6, it.v || '-', {size: 15 * Math.max(.85, sc), light: true, color: '#667085', valign: 'middle', lh: 1.45}));
      E.push(T(ax + cw, y, g, rh, '→', {size: 22, bold: true, color: P.c3, align: 'center', valign: 'middle', lh: 1}));
      E.push(R(bx, y + 3, cw, rh - 6, P.draft ? '#EFEFEF' : P.tint, {r: 8}));
      E.push(T(bx + 20, y + 3, cw - 40, rh - 6, it.d, {size: 15 * Math.max(.85, sc), color: '#1D2939', valign: 'middle', lh: 1.45}));
      y += rh;
    });
  },
  funnel(E, items, b, P){
    const n = Math.min(5, items.length || 1), g = 10, rh = Math.min(104, (b.h - (n - 1) * g) / n), fw = Math.min(560, b.w * .5);
    items.slice(0, 5).forEach((it, i) => {
      const w = fw * (1 - i * (.32 / Math.max(1, n - 1))), x = b.x + (fw - w) / 2, y = b.y + i * (rh + g);
      const fill = P.draft ? mix('#3A3A3A', '#FFFFFF', i * .15) : mix(P.c1, P.c2, n > 1 ? i / (n - 1) * .85 : 0);
      E.push(R(x, y, w, rh, fill, {r: 10}));
      E.push(T(x + 22, y, w - 44, rh, it.h, {size: 19, bold: true, color: onC(fill), valign: 'middle', align: 'center', lh: 1.3}));
      const dx = b.x + fw + 36, dw = b.w - fw - 36;
      E.push(R(dx - 18, y + rh / 2, 10, 2, P.c3));
      if (it.v) E.push(T(dx, y + 8, dw, 22, it.v, {size: 13, bold: true, color: P.ink, ls: .3}));
      E.push(T(dx, y + (it.v ? 32 : 0), dw, rh - (it.v ? 32 : 0), it.d, {size: 15.5, light: true, color: '#333333', valign: it.v ? 'top' : 'middle', lh: 1.45}));
    });
  },
  timeline(E, items, b, P){
    const n = Math.min(6, items.length || 1), cw = b.w / n, ly = b.y + 70;
    E.push(R(b.x, ly, b.w, 3, P.draft ? '#D0D0D0' : P.tint2));
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + i * cw;
      E.push(T(x, b.y, cw - 16, 46, it.h, {size: 19, bold: true, color: P.ink, valign: 'bottom', lh: 1.25}));
      E.push(R(x, ly - 7, 17, 17, i === 0 ? P.c3 : P.c1, {r: 8.5}));
      let yy = ly + 34;
      if (it.v){ const vh = tH(it.v, 13, cw - 24, 1.35) + 10; E.push(R(x, yy, cw - 20, vh, P.draft ? '#F0F0F0' : P.tint, {r: 6})); E.push(T(x + 10, yy + 5, cw - 40, vh - 10, it.v, {size: 13, bold: true, color: P.ink, lh: 1.35})); yy += vh + 12; }
      E.push(T(x, yy, cw - 20, b.y + b.h - yy, it.d, {size: 14.5, light: true, color: '#444444', lh: 1.5}));
    });
  },
  chart(E, items, b, P){
    const lab = 230, val = 90, note = Math.min(300, b.w * .26), bw = b.w - lab - val - note - 30;
    const max = Math.max(...items.map(i => pct(i.v)), 1), n = items.length || 1, rh = Math.min(58, b.h / n);
    items.forEach((it, i) => {
      const y = b.y + i * rh, w = Math.max(6, bw * pct(it.v) / max), fill = P.draft ? '#5A5A5A' : (i === 0 ? P.c1 : mix(P.c1, P.c2, Math.min(1, i / n + .25)));
      E.push(T(b.x, y, lab - 16, rh - 10, it.h, {size: 16, bold: true, valign: 'middle', lh: 1.3}));
      E.push(R(b.x + lab, y + rh / 2 - 14, bw, 28, P.draft ? '#F2F2F2' : P.tint, {r: 6}));
      E.push(R(b.x + lab, y + rh / 2 - 14, w, 28, fill, {r: 6}));
      E.push(T(b.x + lab + bw + 12, y, val, rh - 10, it.v, {size: 18, bold: true, color: P.ink, valign: 'middle'}));
      E.push(T(b.x + lab + bw + val + 30, y, note, rh - 10, it.d, {size: 13.5, light: true, color: '#555555', valign: 'middle', lh: 1.35}));
    });
  },
  matrix(E, items, b, P){
    const g = 16, cw = (b.w - g) / 2, ch = (b.h - g) / 2;
    items.slice(0, 4).forEach((it, i) => {
      const x = b.x + (i % 2) * (cw + g), y = b.y + Math.floor(i / 2) * (ch + g), hi = i === 0 && !P.draft;
      const fill = hi ? P.c1 : (P.draft ? '#F6F6F6' : P.tint), fg = onC(fill);
      E.push(R(x, y, cw, ch, fill, {r: 12}));
      E.push(T(x + 28, y + 24, cw - 56, 18, it.v || ['PRIORITY 1', 'PRIORITY 2', 'PRIORITY 3', 'PRIORITY 4'][i], {size: 12, bold: true, color: hi ? fg : P.ink, alpha: hi ? .8 : 1, ls: .6}));
      const hh = tH(it.h, 21, cw - 56, 1.3);
      E.push(T(x + 28, y + 50, cw - 56, hh, it.h, {size: 21, bold: true, color: hi ? fg : '#111111', lh: 1.3}));
      E.push(T(x + 28, y + 58 + hh, cw - 56, ch - 80 - hh, it.d, {size: 15, light: true, color: hi ? fg : '#555555', alpha: hi ? .9 : 1, lh: 1.5}));
    });
  },
  grid(E, items, b, P){
    const cols = 3, rows = Math.min(2, Math.ceil((items.length || 1) / 3)), g = 18, cw = (b.w - g * 2) / cols, ch = (b.h - g * (rows - 1)) / rows;
    items.slice(0, 6).forEach((it, i) => {
      const x = b.x + (i % cols) * (cw + g), y = b.y + Math.floor(i / cols) * (ch + g);
      E.push(R(x, y, cw, ch, '#FFFFFF', {r: 12, line: P.draft ? '#E4E4E4' : P.tint2}));
      E.push(R(x + 24, y + 24, 36, 36, P.draft ? '#3A3A3A' : (i % 3 === 1 ? P.c2 : P.c1), {r: 18}));
      E.push(T(x + 24, y + 24, 36, 36, String(i + 1), {size: 15, bold: true, color: onC(P.draft ? '#3A3A3A' : (i % 3 === 1 ? P.c2 : P.c1)), align: 'center', valign: 'middle', lh: 1}));
      if (it.v) E.push(T(x + 72, y + 24, cw - 96, 36, it.v, {size: 14, bold: true, color: P.ink, align: 'right', valign: 'middle'}));
      const hh = tH(it.h, 18, cw - 48, 1.3);
      E.push(T(x + 24, y + 76, cw - 48, hh, it.h, {size: 18, bold: true, lh: 1.3}));
      E.push(T(x + 24, y + 82 + hh, cw - 48, ch - 100 - hh, it.d, {size: 14, light: true, color: '#555555', lh: 1.5}));
    });
  },
  image(E, items, b, P, pg){
    if (pg.image){ const f = fitBox(pg.imageW, pg.imageH, b.x, b.y, b.w, b.h); E.push(IM(f.x, f.y, f.w, f.h, pg.image)); }
    else { E.push(R(b.x, b.y, b.w, b.h, '#F4F4F4', {r: 12, line: '#D0D5DD'})); E.push(T(b.x, b.y, b.w, b.h, '이미지를 첨부하세요 (기존 회사소개·케이스 장표 캡처 등)', {size: 17, light: true, color: '#98A2B3', align: 'center', valign: 'middle'})); }
  }
};

function titleBlock(E, it, pg, P){
  const theme = P.draft ? 'clean' : (S.design?.theme || 'clean');
  if (theme === 'band'){
    E.push(R(0, 0, W, 182, P.c1));
    const fg = onC(P.c1);
    E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 34, bold: true, color: fg, lh: 1.3}));
    if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 18, light: true, color: fg, alpha: .88}));
    return {labelOn: fg, dark: null, bodyY: 214};
  }
  if (theme === 'side'){
    E.push(R(0, 0, 14, H, P.c1)); E.push(R(0, 0, 14, 200, P.c3));
    E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 34, bold: true, lh: 1.3}));
    if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 18, light: true, color: P.ink}));
    E.push(R(MX, SP.subY + SP.subH + 12, W - MX * 2, 1, '#EAECF0'));
    return {bodyY: SP.bodyY + 6};
  }
  E.push(R(MX, SP.titleY - 12, 32, 4, P.c1));
  E.push(T(MX, SP.titleY, W - MX * 2, SP.titleH, pg.title, {size: 34, bold: true, lh: 1.3}));
  if (pg.subtitle) E.push(T(MX, SP.subY, W - MX * 2, SP.subH, pg.subtitle, {size: 18, light: true, color: '#555555'}));
  return {bodyY: SP.bodyY};
}

function buildSpec(it){
  if (it.kind === 'cover') return coverSpec(it);
  if (it.kind === 'guide') return guideSpec(it);
  if (it.kind === 'toc') return tocSpec(it);
  if (it.kind === 'closing') return closingSpec(it);
  const E = [], pg = it.page, P = palette(pg.washed), items = itemsOf(pg);
  if (pg.type === 'divider'){
    const bg = P.draft ? '#2B2B2B' : P.c1, fg = onC(bg);
    if (!P.draft) E.push(R(W - 400, 0, 400, H, P.c2, {alpha: .2}));
    E.push(T(MX, 176, 700, 160, it.secNo ? two(it.secNo) : '', {size: 140, bold: true, color: fg, alpha: .22, lh: 1}));
    E.push(R(MX, 354, 64, 5, P.draft ? '#888888' : (Math.abs(lum(P.c3) - lum(bg)) > .08 ? P.c3 : fg)));
    E.push(T(MX, 378, 1000, 68, pg.title || it.secTitle, {size: 50, bold: true, color: fg, lh: 1.25}));
    if (pg.subtitle) E.push(T(MX, 454, 1000, 30, pg.subtitle, {size: 19, light: true, color: fg, alpha: .85}));
    if (items.length) E.push(T(MX, 500, 1100, 26, items.map(i => i.h).filter(Boolean).join('   |   '), {size: 14, light: true, color: fg, alpha: .7}));
    chrome(E, it, P, bg);
    return {bg, els: E};
  }
  if (pg.type === 'bridge'){
    const bg = P.draft ? '#F3F3F3' : P.tint;
    const main = pg.keyMsg || pg.title, mh = Math.min(200, tH(main, 38, W - 300, 1.35));
    const sub = pg.keyMsg ? (pg.subtitle || pg.title) : pg.subtitle;
    const sh = sub ? tH(sub, 18, W - 360, 1.5) : 0;
    const total = 22 + 18 + mh + (sub ? 18 + sh : 0) + (items.length ? 30 + 26 : 0);
    let y = Math.max(150, (H - total) / 2 - 10);
    E.push(T(MX, y, W - MX * 2, 22, it.secTitle || '', {size: 13, bold: true, color: P.ink, align: 'center', ls: .3})); y += 22 + 10;
    E.push(R(W / 2 - 24, y, 48, 4, P.c1)); y += 4 + 22;
    E.push(T(150, y, W - 300, mh, main, {size: 38, bold: true, align: 'center', lh: 1.35})); y += mh + 18;
    if (sub){ E.push(T(180, y, W - 360, sh, sub, {size: 18, light: true, color: '#555555', align: 'center', lh: 1.5})); y += sh + 30; }
    if (items.length) E.push(T(120, y, W - 240, 26, items.map(i => i.h || i.d).slice(0, 4).join('   ·   '), {size: 15, bold: true, color: P.ink, align: 'center'}));
    chrome(E, it, P);
    return {bg, els: E};
  }
  const tb = titleBlock(E, it, pg, P);
  const layout = pg.layout || (pg.type === 'strategy' ? 'cards' : 'list');
  const showKey = pg.keyMsg && !['split', 'spec', 'hero'].includes(layout);
  const top = tb.bodyY, bottom = showKey ? SP.keyY - 22 : SP.bodyEnd;
  let box = {x: MX, y: top, w: W - MX * 2, h: bottom - top};
  if (layout === 'table' && pg.cols) box.colsHead = pg.cols;
  if (pg.image && layout !== 'image'){ const f = fitBox(pg.imageW, pg.imageH, MX + 720, top, W - MX * 2 - 720, bottom - top); E.push(IM(f.x, f.y, f.w, f.h, pg.image)); box.w = 690; }
  if (!items.length && layout !== 'image') E.push(T(box.x, box.y, box.w, 40, '세부 항목을 추가하세요', {size: 16, light: true, color: '#98A2B3'}));
  else (LAY[layout] || LAY.list)(E, items, box, P, pg);
  if (showKey){
    const kf = P.draft ? '#3A3A3A' : P.c1;
    E.push(R(MX, SP.keyY, W - MX * 2, SP.keyH, kf, {r: 8}));
    E.push(R(MX, SP.keyY, 6, SP.keyH, P.draft ? '#888888' : P.c3, {r: 3}));
    E.push(T(MX + 28, SP.keyY, W - MX * 2 - 56, SP.keyH, pg.keyMsg, {size: 18, bold: true, color: onC(kf), valign: 'middle'}));
  }
  if (pg.source) E.push(T(MX, SP.bodyEnd + 10, W - MX * 2 - 100, 16, '출처: ' + pg.source, {size: 10, light: true, color: '#98A2B3'}));
  chrome(E, it, P, null, {labelOn: tb.labelOn});
  return {bg: '#FFFFFF', els: E};
}

function coverSpec(){
  const P = palette(true), E = [], tp = S.template, A = S.input.analysis;
  if (!tp.coverBg){ E.push(R(880, 0, 400, H, P.c1)); E.push(R(880, 520, 400, 200, P.c2)); E.push(R(840, 300, 80, 80, P.c3, {r: 40})); }
  E.push(T(MX, 200, 740, 22, 'PERFORMANCE MARKETING PROPOSAL', {size: 14, bold: true, color: P.ink, ls: 1}));
  E.push(T(MX, 232, 760, 130, S.project.name || `${S.project.client || '브랜드'} 퍼포먼스 마케팅 제안`, {size: 48, bold: true, lh: 1.25, valign: 'bottom'}));
  E.push(T(MX, 376, 760, 30, `${S.project.client || ''} 디지털 퍼포먼스 마케팅 운영 제안`, {size: 21, light: true, color: '#555555'}));
  if (A?.logic?.concept) E.push(T(MX, 416, 760, 56, A.logic.concept, {size: 18, bold: true, color: P.ink, lh: 1.45}));
  E.push(R(MX, 598, 36, 3, P.c1));
  E.push(T(MX, 612, 700, 48, `${S.project.date || ''}\n${S.project.proposer || ''}`, {size: 14, light: true, color: '#666666', lh: 1.5}));
  chrome(E, {}, P);
  return {bg: '#FFFFFF', bgImg: tp.coverBg || null, els: E};
}
function guideSpec(){
  const P = palette(true), E = [], cs = S.input.colors;
  E.push(R(MX, SP.titleY - 12, 32, 4, P.c1));
  E.push(T(MX, SP.titleY, 1100, SP.titleH, 'Color & Typography Guide', {size: 34, bold: true, lh: 1.3}));
  E.push(T(MX, SP.subY, 1150, SP.subH, S.input.colorConcept || '브랜드 채널·제품에서 도출한 제안서 메인 컬러칩', {size: 18, light: true, color: '#555555'}));
  const n = cs.length, g = 24, cw = (W - MX * 2 - (n - 1) * g) / n;
  cs.forEach((c, i) => {
    const x = MX + i * (cw + g), hex = validHex(c.hex) ? c.hex.toUpperCase() : '#333333';
    E.push(R(x, 200, cw, 160, hex, {r: 12, line: lum(hex) > .85 ? '#E4E7EC' : null}));
    E.push(T(x + 22, 218, cw - 44, 20, `0${i + 1}  ${c.role || ''}`, {size: 13, bold: true, color: onC(hex)}));
    E.push(T(x + 22, 316, cw - 44, 28, hex, {size: 21, bold: true, color: onC(hex)}));
    E.push(T(x, 374, cw, 24, c.name || '', {size: 17, bold: true}));
    E.push(T(x, 402, cw, 60, c.reason || ['메인 타이틀·간지·핵심 강조', '서브 그래픽·차트 보조', '포인트·수치 하이라이트'][i] || '', {size: 13.5, light: true, color: '#555555', lh: 1.5}));
  });
  E.push(R(MX, 484, W - MX * 2, 1, '#E4E7EC'));
  E.push(T(MX, 504, 300, 20, 'TYPOGRAPHY', {size: 12, bold: true, color: P.ink, ls: .6}));
  E.push(T(MX, 534, 560, 42, 'Pretendard Bold — 메인 타이틀', {size: 30, bold: true, lh: 1.3}));
  E.push(T(MX, 584, 560, 28, 'Pretendard Light — 서브 타이틀 · 본문 내용', {size: 19, light: true, color: '#444444'}));
  E.push(T(680, 534, 540, 80, '타이틀 34 Bold / 서브 18 Light / 본문 15–17 Light\n강조 수치는 Main 컬러, 키 메시지 바는 Main 배경 + Accent 포인트', {size: 14, light: true, color: '#555555', lh: 1.6}));
  chrome(E, {label: 'GUIDE'}, P);
  return {bg: '#FFFFFF', els: E};
}
function tocSpec(it){
  const P = palette(true), E = [], secs = it.secs || [], fg = onC(P.c1);
  E.push(R(0, 0, 380, H, P.c1));
  E.push(T(MX, 92, 300, 52, 'INDEX', {size: 42, bold: true, color: fg}));
  E.push(T(MX, 152, 280, 50, S.project.client ? `${S.project.client} 제안 목차` : '제안 목차', {size: 15, light: true, color: fg, alpha: .8}));
  const n = secs.length, cols = n > 7 ? 2 : 1, per = Math.ceil(n / cols), cw = (W - 440 - MX) / cols, rh = Math.min(66, 560 / Math.max(1, per));
  secs.forEach((s, i) => {
    const c = Math.floor(i / per), r = i % per, x = 440 + c * cw, y = 86 + r * rh;
    E.push(T(x, y, 56, 30, two(s.no) + '.', {size: 22, bold: true, color: P.ink}));
    E.push(T(x + 58, y + 2, cw - 80, 26, s.title, {size: 19, bold: true, lh: 1.3}));
    if (s.goal) E.push(T(x + 58, y + 30, cw - 80, rh - 34, s.goal, {size: 12.5, light: true, color: '#667085', lh: 1.4}));
  });
  chrome(E, {}, P);
  return {bg: '#FFFFFF', els: E};
}
function closingSpec(){
  const P = palette(true), E = [], fg = onC(P.c1);
  E.push(R(0, H - 160, W, 160, P.c2, {alpha: .3}));
  const A = S.input.analysis;
  E.push(T(0, 236, W, 100, 'Thank you', {size: 76, bold: true, color: fg, align: 'center', valign: 'middle'}));
  if (A?.logic?.message) E.push(T(200, 346, W - 400, 56, A.logic.message, {size: 18, light: true, color: fg, align: 'center', alpha: .9, lh: 1.5}));
  E.push(T(0, 420, W, 30, S.project.proposer || '', {size: 17, bold: true, color: fg, align: 'center', alpha: .85}));
  chrome(E, {}, P, P.c1);
  return {bg: P.c1, els: E};
}

/* ---- HTML render ---- */
function slideHTML(spec){
  const bg = spec.bgImg ? `background-color:${spec.bg};background-image:url(${spec.bgImg});` : `background:${spec.bg};`;
  let h = `<div class="slide" style="${bg}">`;
  for (const e of spec.els){
    const pos = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${e.alpha != null ? `opacity:${e.alpha};` : ''}`;
    if (e.k === 'r') h += `<div class="r" style="${pos}background:${e.fill};${e.r ? `border-radius:${e.r}px;` : ''}${e.line ? `box-shadow:inset 0 0 0 1px ${e.line};` : ''}"></div>`;
    else if (e.k === 'i') h += `<img class="im" style="${pos}" src="${e.data}">`;
    else if (e.text) h += `<div class="t" style="${pos}font-size:${e.size}px;font-weight:${e.bold ? 700 : e.light ? 300 : 400};color:${e.color};text-align:${e.align};justify-content:${e.valign === 'middle' ? 'center' : e.valign === 'bottom' ? 'flex-end' : 'flex-start'};line-height:${e.lh};${e.ls != null ? `letter-spacing:${e.ls}px;` : ''}"><span>${esc(e.text)}</span></div>`;
  }
  return h + '</div>';
}
function thumbHTML(it, w = 320){ const s = w / W; return `<div class="sw-wrap" style="width:${w}px;height:${Math.round(H * s)}px"><div style="transform:scale(${s});transform-origin:0 0;width:${W}px;height:${H}px">${slideHTML(buildSpec(it))}</div></div>`; }

/* ---- 구성 아이템 ---- */
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
async function exportPPTX(items, name){
  if (!window.PptxGenJS){ toast('PPT 라이브러리 로딩 실패 — 새로고침 후 다시 시도하세요'); return; }
  busy('PPT 생성 중…', `${items.length}장`);
  try {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = S.project.proposer || 'MADUP'; pptx.company = S.project.proposer || 'MADUP'; pptx.title = S.project.name || name;
    pptx.theme = {headFontFace: 'Pretendard', bodyFontFace: 'Pretendard Light'};
    for (const it of items){
      const spec = buildSpec(it), sl = pptx.addSlide();
      sl.background = spec.bgImg ? {data: stripData(spec.bgImg)} : {color: hx(spec.bg)};
      for (const e of spec.els){
        const base = {x: IN(e.x), y: IN(e.y), w: Math.max(.01, IN(e.w)), h: Math.max(.01, IN(e.h))};
        if (e.k === 'r') sl.addShape(e.r ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {...base, fill: {color: hx(e.fill), transparency: e.alpha != null ? Math.round((1 - e.alpha) * 100) : 0}, line: e.line ? {color: hx(e.line), width: .75} : {type: 'none'}, ...(e.r ? {rectRadius: Math.min(.5, e.r / Math.min(e.w, e.h))} : {})});
        else if (e.k === 'i') sl.addImage({...base, data: stripData(e.data)});
        else if (e.text) sl.addText(e.text, {...base, fontFace: e.bold ? 'Pretendard' : e.light ? 'Pretendard Light' : 'Pretendard', fontSize: +(e.size * .75).toFixed(1), bold: !!e.bold, color: hx(e.color), align: e.align, valign: e.valign, margin: 0, lineSpacingMultiple: +(e.lh / 1.2).toFixed(2), transparency: e.alpha != null ? Math.round((1 - e.alpha) * 100) : 0, ...(e.ls != null ? {charSpacing: e.ls * .75} : {}), wrap: true, fit: 'none'});
      }
      if (it.page?.notes) sl.addNotes(it.page.notes);
    }
    await pptx.writeFile({fileName: `${fname(name)}.pptx`});
    toast('PPT 다운로드 완료 — 열람 PC에 Pretendard 폰트가 있어야 동일하게 보입니다', 4200);
  } catch(e){ console.error(e); toast('PPT 생성 오류: ' + e.message); }
  unbusy();
}
async function fontsReady(){ try { await Promise.all(['700', '300', '400'].map(w => document.fonts.load(`${w} 20px Pretendard`))); await document.fonts.ready; } catch(e){} }
async function exportPDF(items, name){
  if (!window.html2canvas || !window.jspdf){ toast('PDF 라이브러리 로딩 실패 — 새로고침 후 다시 시도하세요'); return; }
  busy('PDF 생성 중…', '폰트·컬러를 고해상도로 고정 렌더링합니다');
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
  unbusy();
}
function printPDF(items, name){
  const w = window.open('', '_blank');
  if (!w){ toast('팝업이 차단되었습니다 — 팝업 허용 후 다시 시도'); return; }
  const css = $('#slidecss').textContent;
  w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(fname(name))}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css"><style>${css}@page{size:1280px 720px;margin:0}html,body{background:#fff;margin:0}.slide{page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${items.map(it => slideHTML(buildSpec(it))).join('')}<script>document.fonts.ready.then(()=>setTimeout(()=>print(),400))<\/script></body></html>`);
  w.document.close();
}

/* =========================================================
   FILE PARSING
   ========================================================= */
const b64 = buf => { let s = '', b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
function readDataURL(file){ return new Promise((r, j) => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = j; f.readAsDataURL(file); }); }
function imgSize(src){ return new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([0, 0]); i.src = src; }); }
async function resizeImage(src, max = 1000, type = 'image/jpeg'){
  const [w, h] = await imgSize(src); if (!w) return {data: src, w: 0, h: 0};
  const s = Math.min(1, max / Math.max(w, h)), cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
  const ctx = cv.getContext('2d'); if (type === 'image/jpeg'){ ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
  const im = new Image(); im.src = src; await new Promise(r => { im.onload = r; if (im.complete) r(); });
  ctx.drawImage(im, 0, 0, cv.width, cv.height); return {data: cv.toDataURL(type, .88), w: cv.width, h: cv.height};
}
async function pptxText(buf){
  const zip = await JSZip.loadAsync(buf), num = n => +n.match(/(\d+)\.xml$/)[1];
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  let out = '';
  for (const n of slides){
    const xml = new DOMParser().parseFromString(await zip.file(n).async('string'), 'application/xml');
    const paras = [...xml.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).filter(Boolean);
    out += `\n[슬라이드 ${num(n)}]\n` + paras.join('\n');
  }
  return {text: out.trim(), pages: slides.length};
}
async function extractFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf'){
    const buf = await file.arrayBuffer();
    const keep = buf.byteLength < 9e6 ? b64(buf.slice(0)) : null;
    const pdf = await pdfjsLib.getDocument({data: buf}).promise; let out = '';
    for (let i = 1; i <= pdf.numPages; i++){ const p = await pdf.getPage(i); const tc = await p.getTextContent(); out += `\n[p.${i}]\n` + tc.items.map(t => t.str + (t.hasEOL ? '\n' : ' ')).join(''); }
    return {text: out.trim(), pages: pdf.numPages, pdfB64: keep};
  }
  if (ext === 'docx') return {text: (await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()})).value};
  if (ext === 'pptx') return await pptxText(await file.arrayBuffer());
  if (['txt', 'md', 'csv', 'tsv', 'json'].includes(ext)) return {text: await file.text()};
  if (/^(png|jpe?g|webp|gif)$/.test(ext)){ const r = await resizeImage(await readDataURL(file), 1000); return {image: r.data, w: r.w, h: r.h, text: ''}; }
  if (ext === 'ppt' || ext === 'doc') throw new Error('구버전(.ppt/.doc)은 브라우저에서 읽을 수 없어요. PPTX/DOCX 또는 PDF로 저장 후 올려주세요');
  throw new Error('지원하지 않는 형식입니다');
}
async function extractColors(srcs){
  const bins = {};
  for (const src of srcs){
    const im = new Image(); im.src = src; await new Promise(r => { im.onload = r; im.onerror = r; });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); c.drawImage(im, 0, 0, 64, 64);
    const d = c.getImageData(0, 0, 64, 64).data;
    for (let i = 0; i < d.length; i += 4){
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 28 || mx < 30 || mn > 235) continue;
      const k = `${r >> 5},${g >> 5},${b >> 5}`; (bins[k] = bins[k] || {n: 0, r: 0, g: 0, b: 0}); bins[k].n++; bins[k].r += r; bins[k].g += g; bins[k].b += b;
    }
  }
  return Object.values(bins).sort((a, b) => b.n - a.n).map(v => rgbHex(v.r / v.n, v.g / v.n, v.b / v.n))
    .filter((h, i, arr) => arr.slice(0, i).every(o => { const A = hexRgb(o), B = hexRgb(h); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) > 60; })).slice(0, 3);
}
