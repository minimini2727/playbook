/* ============================================================
   스프레드시트 인풋 — 제안 로직·팩트북 시트를 읽어 자동화에 반영
   1) xlsx/csv/구글 시트 → 탭별 표
   2) 탭 유형 판별(로직·팩트북·매체·KPI·브랜드·경쟁·RFP·기타)
   3) 인풋 칸 자동 채움 · 로직 탭으로 섹션 바로 만들기 · 팩트를 진단 장표에 반영
   4) Claude 프롬프트에 [스프레드시트] + 활용 규칙을 넣음
   ============================================================ */
const SH_TYPES = {
  info: {n: '기본 정보', kw: /기본\s*정보|개요|프로젝트\s*정보|overview|광고주\s*정보/i},
  logic: {n: '제안 로직', kw: /로직|스토리|목차|구성안|장표|섹션|흐름|storyline|logic|outline|제안\s*구조|페이지/i},
  fact: {n: '팩트북', kw: /팩트|fact|시장|리서치|research|통계|데이터|조사|트렌드|인사이트|insight|리뷰|소비자/i},
  media: {n: '매체·예산', kw: /매체|미디어|media|채널|믹스|mix|예산|budget|집행|운영\s*안/i},
  kpi: {n: 'KPI·성과', kw: /kpi|목표|성과|roas|cpa|cvr|ctr|전환|매출\s*목표|실적/i},
  brand: {n: '브랜드·제품', kw: /브랜드|제품|상품|product|brand|usp|가격|라인업|sku/i},
  comp: {n: '경쟁사', kw: /경쟁|competitor|비교|벤치마크/i},
  rfp: {n: 'RFP·과업', kw: /rfp|과업|요구|평가|제안\s*요청|일정|조건/i},
  etc: {n: '기타 참고', kw: /$^/}
};
const shCell = v => String(v ?? '').replace(/\r/g, '').trim();
function shClean(grid){
  let g = grid.map(r => (r || []).map(shCell));
  g = g.filter(r => r.some(Boolean));
  const w = Math.max(0, ...g.map(r => r.length)), keep = [];
  for (let c = 0; c < w; c++) if (g.some(r => r[c])) keep.push(c);
  return g.map(r => keep.map(c => r[c] || '')).slice(0, 400).map(r => r.slice(0, 24).map(v => v.length > 600 ? v.slice(0, 600) + '…' : v));
}
/* ---------- xlsx 파서 (JSZip) ---------- */
async function parseXLSX(buf){
  const zip = await JSZip.loadAsync(buf), rd = async p => zip.file(p) ? await zip.file(p).async('string') : '';
  const X = s => new DOMParser().parseFromString(s, 'application/xml');
  const ss = [...X(await rd('xl/sharedStrings.xml')).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join(''));
  const rels = {}; [...X(await rd('xl/_rels/workbook.xml.rels')).getElementsByTagName('Relationship')].forEach(r => rels[r.getAttribute('Id')] = r.getAttribute('Target'));
  const wb = X(await rd('xl/workbook.xml')), out = [];
  for (const sh of [...wb.getElementsByTagName('sheet')]){
    if (sh.getAttribute('state') === 'hidden') continue;
    const rid = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    let t = rels[rid] || ''; t = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
    const doc = X(await rd(t)); if (!doc) continue;
    const grid = [], col = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; }, row = ref => +ref.replace(/[A-Z]+/g, '') - 1;
    for (const c of [...doc.getElementsByTagName('c')]){
      const r = c.getAttribute('r'); if (!r) continue; const ty = c.getAttribute('t'), v = c.getElementsByTagName('v')[0]?.textContent;
      let val = ty === 's' ? ss[+v] : ty === 'inlineStr' ? [...c.getElementsByTagName('t')].map(x => x.textContent).join('') : ty === 'b' ? (v === '1' ? 'TRUE' : 'FALSE') : (v ?? '');
      if (!ty && val !== '' && !isNaN(+val)){ const n = +val; val = Math.abs(n) < 1 && n !== 0 ? String(+(n.toFixed(4))) : String(+n.toFixed(2)); }
      const R0 = row(r), C0 = col(r); if (R0 > 600 || C0 > 40) continue; (grid[R0] = grid[R0] || [])[C0] = val;
    }
    for (const m of [...doc.getElementsByTagName('mergeCell')]){ // 병합 셀은 왼쪽 위 값으로 채움 (섹션 열 등)
      const [a, b] = (m.getAttribute('ref') || '').split(':'); if (!b) continue;
      const r1 = row(a), c1 = col(a), r2 = Math.min(row(b), 600), c2 = Math.min(col(b), 40), v = grid[r1]?.[c1]; if (!v) continue;
      for (let i = r1; i <= r2; i++) for (let j = c1; j <= c2; j++) if (i !== r1 || j !== c1){ if (j === c1) (grid[i] = grid[i] || [])[j] = v; }
    }
    out.push({name: sh.getAttribute('name') || `Sheet${out.length + 1}`, grid: shClean(Array.from(grid, r => r ? Array.from(r, x => x ?? '') : []))});
  }
  return out;
}
function parseCSV(text){
  const sep = (text.split('\n')[0].match(/\t/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? '\t' : ',';
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < text.length; i++){ const ch = text[i];
    if (q){ if (ch === '"' && text[i + 1] === '"'){ f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === sep){ r.push(f); f = ''; } else if (ch === '\n'){ r.push(f); rows.push(r); r = []; f = ''; } else if (ch !== '\r') f += ch; }
  if (f || r.length){ r.push(f); rows.push(r); }
  return shClean(rows);
}
/* ---------- 탭 분석 ---------- */
function shHeader(g){ for (let i = 0; i < Math.min(6, g.length); i++){ const r = g[i], f = r.filter(Boolean); if (f.length >= 2 && f.filter(v => isNaN(+v.replace(/[,%원]/g, ''))).length >= f.length * .7) return i; } return -1; }
function shClassify(name, g){
  const h = shHeader(g), head = [name, ...(g[h] || g[0] || []), ...(g.slice(0, 4).flat())].join(' ');
  let best = 'etc', sc = 0;
  for (const [k, t] of Object.entries(SH_TYPES)){ if (k === 'etc') continue; const s = (t.kw.test(name) ? (k === 'info' ? 9 : 3) : 0) + (head.match(new RegExp(t.kw.source, 'gi')) || []).length; if (s > sc){ sc = s; best = k; } }
  return best;
}
const shCol = (hdr, re) => hdr.findIndex(h => re.test(h || ''));
function shTab(name, grid){ const h = shHeader(grid); return {name, grid, header: h, type: shClassify(name, grid), use: true}; }
function shText(t, max = 14000){
  const g = t.grid; let s = `■ 시트 "${t.name}" — ${SH_TYPES[t.type]?.n || '기타'} · ${g.length}행\n`;
  g.forEach((r, i) => { s += (i === t.header ? '[헤더] ' : '') + r.map(v => v.replace(/\n/g, ' / ')).join(' | ') + '\n'; });
  return s.length > max ? s.slice(0, max) + '\n…(이하 생략)' : s;
}
const shTabs = () => (S.input.sheets || []).flatMap(f => f.tabs.filter(t => t.use));
function sheetsText(max = 45000){ const L = shTabs(); if (!L.length) return ''; const per = Math.max(3000, Math.floor(max / L.length)); return L.map(t => shText(t, per)).join('\n'); }
const shRows = t => t.grid.slice(t.header + 1);

/* 로직 탭 → 섹션/장표 */
function shLogic(t){
  const H = t.grid[t.header] || [], sc = shCol(H, /섹션|목차|파트|챕터|대분류|구분|section|part|chapter/i), pc = shCol(H, /장표|페이지|타이틀|제목|헤드|title|page|소분류|중분류/i);
  const cc = shCol(H, /내용|핵심|메시지|설명|포인트|요약|본문|content|message|body|로직/i), lc = shCol(H, /레이아웃|형식|구성|layout|format/i), nc = shCol(H, /비고|노트|근거|출처|source|note|자료/i);
  if (sc < 0 || pc < 0 || sc === pc) return null;
  const secs = [];
  shRows(t).forEach(r => { const s = r[sc] || secs.at(-1)?.title, ti = r[pc]; if (!s || !ti) return;
    let sec = secs.find(x => x.title === s); if (!sec){ sec = {title: s, role: '', goal: '', divider: true, pages: []}; secs.push(sec); }
    const body = cc >= 0 ? r[cc] : '', items = bl(body).map(l => { const [h, ...d] = l.replace(/^\s*[-·•]\s*/, '').split(/\s*[:：]\s*/); return d.length ? {h, d: d.join(': '), v: ''} : {h: l.replace(/^\s*[-·•]\s*/, ''), d: '', v: ''}; }).slice(0, 8);
    sec.pages.push({type: 'strategy', title: ti, subtitle: '', keyMsg: '', tag: '', items, source: nc >= 0 ? r[nc] : '', notes: lc >= 0 && r[lc] ? `레이아웃 요청: ${r[lc]}` : ''}); });
  return secs.length ? secs : null;
}
/* 팩트 탭 → research.market */
function shFacts(t){
  const H = t.grid[t.header] || [], fc = shCol(H, /항목|지표|팩트|fact|내용|구분|키워드|이슈/i), vc = shCol(H, /수치|값|value|데이터|규모|%|금액|비율/i), nc = shCol(H, /해석|의미|시사점|인사이트|note|insight|설명/i), sc = shCol(H, /출처|source|자료|링크|url/i);
  if (fc < 0) return [];
  return shRows(t).filter(r => r[fc]).slice(0, 30).map(r => ({fact: r[fc], value: vc >= 0 ? r[vc] : '', note: nc >= 0 ? r[nc] : '', source: sc >= 0 && r[sc] ? r[sc] : `팩트북: ${t.name}`}));
}
/* 인풋 칸 자동 채움 */
function shAutofill(force){
  const I = S.input, log = [], P = S.project, tabs = shTabs(), set = (o, k, v, lab) => { if (v && (force || !String(o[k] || '').trim())){ o[k] = v; log.push(lab); } };
  // 1) 라벨:값 형태(2열) — 프로젝트 정보
  tabs.forEach(t => t.grid.forEach(r => { if (r.filter(Boolean).length < 2) return; const k = r[0], v = r.find((x, i) => i > 0 && x) || '';
    if (/^(광고주|브랜드명?|클라이언트|client)$/i.test(k)) set(P, 'client', v, '광고주');
    else if (/^(제안서?\s*(명|타이틀|제목)|프로젝트명?)$/.test(k)) set(P, 'name', v, '제안서 타이틀');
    else if (/^(제출\s*)?마감(일)?$/.test(k) && /\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(v)) set(P, 'due', v.replace(/[./]/g, '-').match(/\d{4}-\d{1,2}-\d{1,2}/)[0].replace(/-(\d)(?!\d)/g, '-0$1'), '제출 마감');
    else if (/^(주요\s*)?(제품|상품|서비스)$/.test(k)) set(I, 'product', v, '주요 제품');
    else if (/^경쟁(사|브랜드)?$/.test(k)) set(I, 'competitors', v, '경쟁사'); }));
  // 2) 매체 탭 → 현재 매체 비중
  tabs.filter(t => t.type === 'media').some(t => { const H = t.grid[t.header] || [], mc = shCol(H, /매체|미디어|채널|media|상품/i), pc = shCol(H, /비중|%|share|비율/i), bc = shCol(H, /예산|금액|budget|비용/i);
    if (mc < 0 || (pc < 0 && bc < 0)) return false;
    const s = shRows(t).filter(r => r[mc] && !/합계|total|계$/i.test(r[mc])).slice(0, 12).map(r => `${r[mc]} ${pc >= 0 && r[pc] ? (/%/.test(r[pc]) ? r[pc] : (+r[pc] <= 1 ? Math.round(+r[pc] * 100) : r[pc]) + '%') : r[bc]}`).join(', ');
    set(I, 'currentMix', s, '현재 매체 비중·예산');
    const M = I.mediaMix, R = shRows(t).filter(r => r[mc] && !/합계|total|계$/i.test(r[mc])).slice(0, 12), num = v => +String(v || '').replace(/[^\d.]/g, '') || 0;
    if (R.length && (force || !M.rows.length)){
      const bud = R.map(r => bc >= 0 ? num(r[bc]) : 0), bs = bud.reduce((a, b) => a + b, 0);
      const pct = R.map((r, i) => pc >= 0 && r[pc] ? (/%/.test(r[pc]) ? num(r[pc]) : num(r[pc]) <= 1 ? Math.round(num(r[pc]) * 100) : num(r[pc])) : bs ? Math.round(bud[i] / bs * 100) : 0);
      const stage = n => /크리테오|리타겟|재구매|카카오|채널|CRM|모먼트/i.test(n) ? 'low' : /검색|SA|파워링크|쇼핑|브랜드|PMax|GFA/i.test(n) ? 'mid' : 'upper';
      M.rows = R.map((r, i) => ({id: uid(), key: '', name: r[mc], stage: stage(r[mc]), pct: pct[i]}));
      if (bs){ const won = bs >= 1e5 ? bs : bs * 1e4; M.total = Math.round(won / 1e4); M.unit = /총|전체|계약/.test(H[bc] || '') ? '총' : '월'; }
      log.push(`미디어믹스 ${R.length}개 매체`);
    }
    return true; });
  // 3) 브랜드·경쟁 탭 → 제품·경쟁사
  tabs.filter(t => t.type === 'brand').some(t => { const H = t.grid[t.header] || [], c = shCol(H, /제품|상품|product|sku|라인/i), pc = shCol(H, /가격|price|판매가/i); if (c < 0) return false;
    set(I, 'product', shRows(t).filter(r => r[c]).slice(0, 5).map(r => r[c] + (pc >= 0 && r[pc] ? ` (${r[pc]})` : '')).join(', '), '주요 제품'); return true; });
  tabs.filter(t => t.type === 'comp').some(t => { const H = t.grid[t.header] || [], c = shCol(H, /경쟁|브랜드|업체|회사|name|competitor/i); const L = shRows(t).map(r => r[c >= 0 ? c : 0]).filter(Boolean).slice(0, 6); set(I, 'competitors', L.join(', '), '경쟁사'); return L.length > 0; });
  // 4) URL
  tabs.forEach(t => t.grid.forEach(r => r.forEach((v, i) => { const m = String(v).match(/https?:\/\/[^\s|]+/); if (!m || I.urls.some(u => u.url === m[0])) return;
    const lab = [r[i - 1], r[0]].join(' '), ty = /쿠팡|coupang/i.test(m[0] + lab) ? '쿠팡' : /smartstore|brand\.naver|스마트스토어|네이버/i.test(m[0] + lab) ? '네이버 스마트스토어' : /자사몰|공식몰|홈페이지/.test(lab) ? '자사몰' : null;
    if (!ty || I.urls.filter(u => u.url).length >= 8) return; const e = I.urls.find(u => !u.url); if (e){ e.url = m[0]; e.type = URL_TYPES.includes(ty) ? ty : e.type; } else I.urls.push({type: URL_TYPES.includes(ty) ? ty : URL_TYPES[0], url: m[0]}); log.push('판매 채널 URL'); })));
  // 5) 로직 탭 → 제안 흐름(브리프)
  const lg = tabs.filter(t => t.type === 'logic').map(shLogic).find(Boolean), B = I.brief = I.brief || {flow: []};
  if (lg && (force || !(B.flow || []).filter(Boolean).length)){ B.flow = lg.map(s => s.title).slice(0, 12); log.push(`제안 흐름 ${B.flow.length}단계`); }
  if (B) B.customPrompt = ''; // 시트가 바뀌면 직접 고친 프롬프트는 다시 생성
  return [...new Set(log)];
}
/* ---------- 업로드 ---------- */
async function addSheets(files){
  const I = S.input; I.sheets = I.sheets || [];
  for (const f of files){
    busy('스프레드시트 분석 중…', f.name);
    try {
      const ext = f.name.split('.').pop().toLowerCase(); let tabs;
      if (ext === 'xlsx' || ext === 'xlsm') tabs = await parseXLSX(await f.arrayBuffer());
      else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') tabs = [{name: f.name.replace(/\.\w+$/, ''), grid: parseCSV(await f.text())}];
      else throw new Error(ext === 'xls' ? '구버전 .xls는 읽을 수 없어요 — 엑셀에서 .xlsx로 저장하거나 구글 시트에서 xlsx로 다운로드해 주세요' : 'xlsx · csv만 지원합니다');
      shPush(f.name, tabs);
    } catch(e){ console.error(e); toast(`${f.name}: ${e.message}`, 5000); }
  }
  unbusy(); save(); render();
}
function shPush(name, tabs){
  const T = tabs.filter(t => t.grid.length).map(t => shTab(t.name, t.grid));
  if (!T.length) throw new Error('내용이 있는 시트가 없습니다');
  S.input.sheets = (S.input.sheets || []).filter(x => x.name !== name); S.input.sheets.push({id: uid(), name, tabs: T, at: isoToday()});
  const log = shAutofill(false);
  toast(`${T.length}개 탭 분석 — ${T.map(t => `${t.name}(${SH_TYPES[t.type].n})`).join(', ')}${log.length ? ` · 자동 채움: ${log.join(', ')}` : ''}`, 6000);
}
async function addGSheet(url){
  const id = (url.match(/\/d\/([\w-]{20,})/) || [])[1]; if (!id){ toast('구글 시트 주소가 아닙니다'); return; }
  busy('구글 시트 불러오는 중…', '링크 공유가 "보기 가능"이어야 합니다');
  try {
    let tabs = null;
    try { const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`); if (r.ok) tabs = await parseXLSX(await r.arrayBuffer()); } catch(e){}
    if (!tabs){ const gid = (url.match(/gid=(\d+)/) || [])[1] || '0', r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`); if (!r.ok) throw new Error('불러오기 실패'); tabs = [{name: `구글시트 gid${gid}`, grid: parseCSV(await r.text())}]; toast('xlsx 전체 대신 현재 탭만 가져왔습니다 — 전체 탭은 파일 > 다운로드 > .xlsx 후 올려주세요', 6000); }
    shPush(`구글시트 ${id.slice(0, 6)}`, tabs); S.input.gsheet = '';
  } catch(e){ toast('구글 시트를 열 수 없습니다 — 공유를 "링크가 있는 모든 사용자 · 보기"로 바꾸거나 .xlsx로 다운로드해 올려주세요', 7000); }
  unbusy(); save(); render();
}
const _addFiles0 = addFiles;
addFiles = function(kind, files){ return kind === 'sheets' ? addSheets(files) : _addFiles0(kind, files); };

/* ---------- 화면 ---------- */
function vSheetCard(){
  const I = S.input, L = I.sheets || [], logicSecs = shTabs().filter(t => t.type === 'logic').map(shLogic).find(Boolean), facts = shTabs().filter(t => t.type === 'fact').flatMap(shFacts);
  return `<div class="card shcard"><h3><span class="n">A</span>제안 로직 · 팩트북 스프레드시트 <span class="tag" style="margin-left:6px">핵심 인풋</span></h3>
    <p class="hint">로직(목차·장표 구성)·팩트북(시장·경쟁·제품 수치)·매체/예산·KPI 탭을 자동으로 구분해 인풋 칸, 제안 흐름, 진단 장표, Claude 프롬프트에 반영합니다. 시트 값이 RFP·웹 검색보다 우선합니다.</p>
    <div class="grid2" style="grid-template-columns:1.4fr 1fr;align-items:stretch">
      <div class="drop" data-drop="sheets"><b>스프레드시트를 끌어놓거나 클릭</b>엑셀(.xlsx) · CSV — 여러 파일 가능<input type="file" multiple accept=".xlsx,.xlsm,.csv,.tsv,.xls" data-file="sheets"></div>
      <div><label class="f">또는 구글 시트 링크</label><div class="row">${inp('input.gsheet', 'https://docs.google.com/spreadsheets/d/…', 'url')}<button class="btn" data-act="shG">불러오기</button></div>
        <p class="hint mt8">공유 설정이 "링크가 있는 모든 사용자 · 보기"여야 합니다. 안 되면 파일 &gt; 다운로드 &gt; .xlsx로 올려주세요.</p></div>
    </div>
    ${L.length ? `<table class="shtbl mt12"><tr><th>파일 / 탭</th><th style="width:150px">판별 유형</th><th style="width:90px">크기</th><th>헤더(열 이름)</th><th style="width:60px">반영</th><th style="width:120px"></th></tr>
      ${L.map((f, i) => f.tabs.map((t, j) => `<tr class="${t.use ? '' : 'off'}"><td><b>${esc(t.name)}</b><div class="meta">${esc(f.name)}</div></td>
        <td><select data-bind="input.sheets.${i}.tabs.${j}.type">${Object.entries(SH_TYPES).map(([k, v]) => `<option value="${k}" ${t.type === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></td>
        <td class="meta">${t.grid.length}행 × ${t.grid[0]?.length || 0}열</td><td class="meta">${esc((t.grid[t.header] || t.grid[0] || []).filter(Boolean).slice(0, 7).join(' · '))}</td>
        <td><input type="checkbox" data-bind="input.sheets.${i}.tabs.${j}.use" ${t.use ? 'checked' : ''}></td>
        <td>${j === 0 ? `<button class="btn sm ghost bad" data-act="shDel" data-i="${i}">파일 삭제</button>` : ''}<button class="btn sm ghost" data-act="shView" data-i="${i}" data-j="${j}">보기</button></td></tr>`).join('')).join('')}</table>
      <div class="row mt12" style="flex-wrap:wrap;gap:8px">
        <button class="btn sm" data-act="shFill">시트 값으로 인풋 칸 다시 채우기</button>
        ${logicSecs ? `<button class="btn sm pri" data-act="shSecs">로직 탭 목차로 섹션 바로 만들기 (${logicSecs.length}섹션 · ${logicSecs.reduce((a, s) => a + s.pages.length, 0)}장)</button>` : ''}
        <span class="meta">${[logicSecs ? `로직: ${logicSecs.map(s => s.title).slice(0, 6).join(' → ')}` : '로직 탭에서 섹션·장표 열을 못 찾음(Claude 프롬프트로는 반영)', facts.length ? `팩트 ${facts.length}건 → 진단 장표` : ''].filter(Boolean).join(' · ')}</span></div>` : ''}
  </div>`;
}
Object.assign(ACT, {
  shG: () => addGSheet(S.input.gsheet || ''),
  shDel: b => { S.input.sheets.splice(+b.dataset.i, 1); save(); render(); },
  shFill: () => { const l = shAutofill(true); save(); render(); toast(l.length ? `자동 채움: ${l.join(', ')}` : '채울 수 있는 값을 찾지 못했습니다'); },
  shView: b => { const t = S.input.sheets[+b.dataset.i].tabs[+b.dataset.j]; modal(`${t.name} — ${SH_TYPES[t.type].n}`, `<div style="max-height:62vh;overflow:auto"><table class="shtbl">${t.grid.slice(0, 200).map((r, i) => `<tr>${r.map(v => `<${i === t.header ? 'th' : 'td'}>${esc(v)}</${i === t.header ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</table></div>`); },
  shSecs: () => {
    const secs = shTabs().filter(t => t.type === 'logic').map(shLogic).find(Boolean); if (!secs) return;
    if (S.sections.length && !confirm('지금 섹션을 로직 탭 목차로 바꿀까요? (기존 섹션은 사라집니다)')) return;
    const facts = shTabs().filter(t => t.type === 'fact').flatMap(shFacts);
    importClaude({sections: secs.map(s => ({...s, role: inferRole(s.title)}))}, true);
    if (facts.length){ const A = S.input.analysis; A.research = {...(A.research || {}), market: facts.slice(0, 12)}; }
    save(); S.step = 'logic'; render(); toast(`로직 탭 기준 ${secs.length}개 섹션을 만들었습니다 — 빈 내용은 Claude 심화 리서치로 채우세요`, 5000);
  }
});
/* ---------- 엔진·프롬프트 연결 ---------- */
const _inputDump0 = inputDump;
inputDump = function(max){ const t = sheetsText(); return _inputDump0(max) + (t ? `\n[스프레드시트 — 제안 로직·팩트북 (RFP보다 우선)]\n${t}` : ''); };
const SHEET_RULE = `[스프레드시트 활용 규칙 — RFP·웹 검색보다 우선]
- '제안 로직' 시트: 목차·장표 구성·핵심 메시지가 있으면 그 순서와 장표 단위를 그대로 따르고 빈 칸만 채워. 섹션 이름과 순서는 바꾸지 말고, 바꾸고 싶으면 notes에 제안만 남겨. [목차 순서] 규칙보다 이 시트가 우선이야.
- '팩트북' 시트: 시장·경쟁·제품·성과 수치는 시트 값을 먼저 쓰고 source에 "팩트북: 탭 이름"을 적어. 웹 검색 값과 다르면 시트 값을 쓰고 차이는 notes에 남겨. 시트에 없는 수치만 웹으로 찾아.
- '매체·예산' 시트: 매체 구성·비중·예산이 있으면 미디어믹스·mediaResearch·매체 장표의 기준값으로 써.
- 'KPI·성과' 시트: 목표·과거 실적 수치를 KPI 장표와 매체별 kpiTarget의 출발점으로 써. 과거 실적이 있으면 개선 폭을 근거와 함께 제시해.
- 시트 값을 바꾸거나 추정하면 "(가정)"을 붙여.
`;
const _cpa0 = claudePromptAll;
claudePromptAll = function(){ const p = _cpa0(); return shTabs().length ? p.replace('[해야 할 일]', SHEET_RULE + '\n[해야 할 일]') : p; };
const _sig0 = signals;
signals = function(){ const I = S.input, keep = I.notes; if (shTabs().length) I.notes = [keep, sheetsText(20000)].filter(Boolean).join('\n'); try { return _sig0(); } finally { I.notes = keep; } };
const _analyze0 = analyze;
analyze = async function(mode){
  const I = S.input;
  if (shTabs().length && !I.rfp.length && !I.notes && !I.brand.length && !I.product) I.product = I.product || ' ';
  await _analyze0(mode);
  const facts = shTabs().filter(t => t.type === 'fact').flatMap(shFacts);
  if (facts.length && I.analysis && !I.analysis.claude){ I.analysis.research = {...(I.analysis.research || {}), market: facts.slice(0, 12)}; save(); render(); }
  if (I.product === ' ') I.product = '';
};
