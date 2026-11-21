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
const LAYOUTS = {list: '리스트', cards: '카드', process: '프로세스(화살표)', vsteps: '세로 단계', timeline: '타임라인', kpi: 'KPI 수치', hero: '빅넘버', split: '좌우 분할', twoCol: '2단 비교', compare: 'AS-IS → TO-BE', table: '표', funnel: '퍼널', pyramid: '피라미드', cycle: '순환 구조', hub: '허브(중심-연결)', venn: '교집합(벤)', matrix: '2×2 매트릭스', grid: '6칸 그리드', chart: '가로 막대', vbars: '세로 막대', quote: '인용·핵심 문장', spec: '매체: 스펙 시트', mediaFlow: '매체: 흐름도', mediaQuad: '매체: 4분면', summary: '요약표(현황→제안)', statBars: '막대 + 핵심 수치', colCards: '컬럼 카드(불릿)', stepCards: '단계 박스(불릿)', image: '이미지'};
/* 레이아웃별 항목 입력 안내: [h, v, d] */
const LAYOUT_HINT = {
  compare: ['비교 항목', 'AS-IS', 'TO-BE'], chart: ['항목', '비중(예: 35%)', '설명/금액'], funnel: ['퍼널 단계', 'KPI', '매체·역할'],
  timeline: ['시점/기간', '산출물', '실행 내용'], vsteps: ['단계명', '보조 라벨', '설명'], spec: ['구분(대상 등)', '', '내용'], mediaFlow: ['대상/소재/랜딩/평가/운영/일정', '', '내용 (운영은 줄바꿈으로 3개)'], mediaQuad: ['대상/소재/랜딩/평가/운영/일정', '', '내용 (운영은 줄바꿈으로 3개)'], kpi: ['지표명', '수치', '설명'], hero: ['지표명', '수치', '설명'],
  vbars: ['항목', '수치(예: 35%)', '설명'], cycle: ['단계명', '', '설명'], hub: ['연결 요소', '', '설명'], pyramid: ['단계명', '보조 라벨', '설명'], venn: ['원 이름', '', '설명'], quote: ['근거 제목', '수치', '설명'], twoCol: ['열 제목', '보조 라벨', '항목들 (줄바꿈으로 구분)'], summary: ['항목', '현황', '제안'], statBars: ['항목', '수치(예: -84%)', '설명'], colCards: ['카드 제목', '보조 라벨', '불릿 (줄바꿈으로 구분)'], stepCards: ['단계명', '기간/라벨', '불릿 (줄바꿈으로 구분)'],
  table: ['구분', '지표/수치', '내용'], default: ['항목명', '수치(선택)', '설명']
};
const KINDS = {strategy: '전략', company: '회사소개', brand: '브랜드 스터디', case: '케이스 스터디'};
const ROLES = {custom: '직접 구성', team: '운영 조직', playbook: '핵심 전략', media: '매체 전략·액션플랜', budget: '예산·시즌', creative: '크리에이티브', kpi: 'KPI·측정', report: '리포팅', optimize: '최적화·로드맵', tech: '기술·솔루션', issue: '이슈 대응', pricing: '비용', company: '회사소개', brand: '시장·브랜드 진단', case: '케이스 스터디'};
const STATUS = ['준비', '작성중', '검토', '제출', '수주', '실주', '보류'];
const URL_TYPES = ['자사몰', '공식몰', '네이버 스마트스토어', '네이버 브랜드스토어', '쿠팡', '올리브영', '무신사·29CM', '카카오 선물하기', '인스타그램', '유튜브', '기타'];
const MODELS = [['claude-sonnet-5-5', 'Claude Sonnet 5.5'], ['claude-opus-5-5', 'Claude Opus 5.5'], ['claude-haiku-5-5', 'Claude Haiku 5.5']];
const THEMES = {madup: 'MADUP 표준 (블루 글로우)', clean: '클린 (화이트)', band: '컬러 밴드 헤더', side: '사이드 바'};
const LIB_ROLES = ['company', 'team', 'report', 'tech', 'case', 'issue'];
const LIB_ID = '__library__';

function defaultState(){
  return {
    v: 2, id: uid(), created: Date.now(), updated: Date.now(), step: 'input',
    project: {name: '', client: '', proposer: 'MADUP (매드업)', date: today(), status: '준비', due: '', pt: '', owner: '', budget: '', memo: ''},
    settings: {model: 'claude-sonnet-5-5', web: true},
    design: {theme: 'consult', brandColor: false},
    input: {
      rfp: [], sheets: [], gsheet: '', urls: [{type: '자사몰', url: ''}], product: '', brand: [], notes: '', competitors: '', currentMix: '',
      analysis: null,
      colors: [{hex: '#1F3A93', role: 'Main', name: 'Deep Navy', reason: ''}, {hex: '#4C8BF5', role: 'Sub', name: 'Sky Blue', reason: ''}, {hex: '#FFB020', role: 'Accent', name: 'Amber', reason: ''}],
      colorConcept: '',
      mediaMix: {unit: '월', total: 0, months: 12, scenario: 'base', rows: []},
      brief: {points: '', flow: [], preset: 'auto', mediaDeep: true, reorder: true}
    },
    template: {logo: null, logoW: 0, logoH: 0, logoPos: 'tr', coverBg: null, footer: 'MADUP', useDefaultLogo: true},
    refLayouts: [], useLibrary: true,
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
  o.input.brief = Object.assign(defaultState().input.brief, (s.input || {}).brief || {});
  o.input.mediaMix = Object.assign(defaultState().input.mediaMix, (s.input || {}).mediaMix || {});
  o.template = Object.assign(defaultState().template, s.template || {});
  o.refLayouts = s.refLayouts || [];
  o.design = Object.assign({theme: 'madup', brandColor: false}, s.design || {});
  if (typeof DS3 !== 'undefined' && !DS3[o.design.theme]) o.design.theme = 'consult';
  o.merge = Object.assign(defaultState().merge, s.merge || {});
  o.sections = (o.sections || []).map(x => ({...x, role: x.role && x.role !== 'custom' ? x.role : (x.kind && x.kind !== 'strategy' ? x.kind : (typeof inferRole === 'function' ? inferRole((x.title || '') + ' ' + (x.goal || '')) : 'custom'))}));
  if (!s.tplBuiltin && !o.isLibrary && typeof BUILTIN_TPLS !== 'undefined'){ o.refLayouts = [...BUILTIN_TPLS.map(t => JSON.parse(JSON.stringify(t))), ...o.refLayouts.filter(t => !t.builtin)]; o.tplBuiltin = true; o.design.useRef = true; }
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
  if (!LIST.some(p => p.id === LIB_ID)){ const L = newLibrary(); LIST.push(L); try { await DB.put(clone(L)); } catch(e){} }
  const cur = localStorage.getItem('ps_current');
  const found = LIST.find(p => p.id === cur) || [...LIST].filter(p => p.id !== LIB_ID).sort((a, b) => b.updated - a.updated)[0];
  if (found) S = found; else { S = normalize(defaultState()); LIST.push(S); }
  if (!S.step) S.step = 'input';
}
/* 기본 장표 라이브러리: 회사소개·조직·보고·기술·사례·이슈 — 모든 제안서에 기본값으로 들어감 */
function newLibrary(){
  const L = defaultState(); L.id = LIB_ID; L.isLibrary = true; L.step = 'logic';
  L.project.name = '기본 장표 라이브러리'; L.project.client = '(공통)'; L.project.status = '보류';
  L.sections = LIB_ROLES.map(r => ({id: uid(), kind: r === 'company' ? 'company' : r === 'case' ? 'case' : 'strategy', role: r, title: {company: '회사 소개 및 역량', team: '운영 조직 및 인력', report: '보고 체계', tech: '기술 및 솔루션 활용', case: '운영 사례', issue: '이슈 대응 및 커뮤니케이션'}[r], en: '', goal: '', pages: 2, divider: true, include: true, collapsed: false, pageList: []}));
  return L;
}
const LIB = () => LIST.find(p => p.id === LIB_ID);
function libSection(role){ const L = LIB(); const s = L && L.sections.find(x => x.role === role && x.pageList.length && x.include !== false); return s || null; }
function openProject(id, step){
  const p = LIST.find(x => x.id === id); if (!p) return;
  S = p; S.step = step || (S.step === 'manage' ? 'input' : S.step || 'input'); localStorage.setItem('ps_current', S.id); save(); render(); scrollTo(0, 0);
}
function newProject(){ const p = normalize(defaultState()); const t = S.template; if (t?.logo && !S.isLibrary) p.template = clone(t); LIST.push(p); S = p; S.step = 'input'; save(); render(); scrollTo(0, 0); }
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
const MADUP_PAL = {c1: '#0056E0', c2: '#4C86F0', c3: '#F05A5A', ink: '#0A2A66', tint: '#E8F0FE', tint2: '#D3DCEB'};
function palette(washed){
  if (!washed) return {c1: '#3A3A3A', c2: '#6B6B6B', c3: '#8C8C8C', ink: '#3A3A3A', tint: '#F3F3F3', tint2: '#E9E9E9', draft: true};
  const madup = (S.design?.theme || 'madup') === 'madup';
  if (madup && !S.design?.brandColor) return {...MADUP_PAL, madup: true};
  const cs = S.input.colors.map(c => validHex(c.hex) ? c.hex.toUpperCase() : '#333333');
  const c1 = cs[0], c2 = cs[1] || mix(c1, '#FFFFFF', .35), c3 = cs[2] || c2;
  const ink = lum(c1) > .35 ? mix(c1, '#000000', .45) : c1;
  return {c1, c2, c3, ink, tint: mix(c1, '#FFFFFF', .93), tint2: mix(c2, '#FFFFFF', .86), madup};
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
