/* =========================================================
   UI 확장: 희망 레이아웃 · 미디어믹스 · 이미지 배치 · 기본 장표 라이브러리
   ========================================================= */
let REFALL = false;
const won = v => Math.round(v).toLocaleString('ko-KR');

/* ---------- 레이아웃 선택(기본 + 희망 레이아웃) ---------- */
function layoutSelect(base, p){
  const tpls = (S.refLayouts || []).filter(t => t.tag === 'body');
  const isT = String(p.layout).startsWith('tpl:'), t = isT && tplById(p.layout.slice(4));
  return `<select data-bind="${base}.layout">${Object.entries(LAYOUTS).map(([k, n]) => `<option value="${k}" ${p.layout === k ? 'selected' : ''}>${n}</option>`).join('')}${tpls.length ? `<optgroup label="희망 레이아웃">${tpls.map(t => `<option value="tpl:${t.id}" ${p.layout === 'tpl:' + t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</optgroup>` : ''}</select>${t && t.mode === 'frame' ? `<select data-bind="${base}.tplBody" title="템플릿 본문 영역 레이아웃">${Object.entries(LAYOUTS).filter(([k]) => !['image', 'spec', 'mediaFlow', 'mediaQuad'].includes(k)).map(([k, n]) => `<option value="${k}" ${(p.tplBody || t.bodyLayout) === k ? 'selected' : ''}>본문: ${n}</option>`).join('')}</select>` : ''}`;
}

/* ---------- 이미지 배치 ---------- */
function imgControls(base, si, pi, p){
  const on = !!(p.image || p.img);
  return `<label class="btn sm" style="position:relative;overflow:hidden">${p.image ? '이미지 교체' : '+ 이미지'}<input type="file" accept="image/*" data-pimg="${si}.${pi}" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>
  ${!p.image && !p.img ? `<button class="btn sm ghost" data-act="imgSlot" data-s="${si}" data-p="${pi}">이미지 자리 표시</button>` : ''}
  ${on ? `<select data-bind="${base}.img.mode" style="width:120px">${Object.entries(IMG_MODES).map(([k, n]) => `<option value="${k}" ${(p.img?.mode || 'right') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
  <select data-bind="${base}.img.fit" style="width:110px"><option value="cover" ${p.img?.fit !== 'contain' ? 'selected' : ''}>꽉 채우기</option><option value="contain" ${p.img?.fit === 'contain' ? 'selected' : ''}>전체 보이기</option></select>
  <button class="btn sm" data-act="imgEdit" data-s="${si}" data-p="${pi}">위치·크기 편집</button>
  <button class="btn sm ghost bad" data-act="imgDel" data-s="${si}" data-p="${pi}">이미지 삭제</button>` : ''}`;
}
function ensureImg(p){ if (!p.img) p.img = {mode: 'right', ratio: .42, fit: 'cover'}; return p.img; }
function openImgEditor(si, pi){
  const sec = S.sections[si], p = sec.pageList[pi], im = ensureImg(p);
  const sc = 0.62, w = Math.round(W * sc), h = Math.round(H * sc);
  // 현재 배치 박스를 계산해 직접 배치 기본값으로
  if (im.mode !== 'free' || im.x == null){ const box = {x: MX, y: 124, w: W - MX * 2, h: 520}; const b = imgBoxes({...p, img: {...im, mode: im.mode === 'free' ? 'right' : im.mode}}, box).img; Object.assign(im, {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h)}); }
  const m = modal('이미지 위치·크기 편집', `<div class="note info mb12">파란 상자를 끌어 위치를 옮기고, 오른쪽 아래 모서리로 크기를 바꿉니다. 저장하면 배치 방식이 <b>직접 배치</b>로 바뀝니다.</div>
    <div id="ied" style="position:relative;width:${w}px;height:${h}px;margin:0 auto;border:1px solid #E4E7EC;border-radius:8px;overflow:hidden">
      <div id="iedBg" style="position:absolute;inset:0;opacity:.55;pointer-events:none"></div>
      <div id="iedBox" style="position:absolute;border:2px solid #2E5BFF;background:rgba(46,91,255,.12);cursor:move;box-sizing:border-box">${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:${im.fit === 'contain' ? 'contain' : 'cover'};pointer-events:none;opacity:.9">` : ''}<div id="iedH" style="position:absolute;right:-7px;bottom:-7px;width:14px;height:14px;background:#2E5BFF;border-radius:3px;cursor:nwse-resize"></div></div>
    </div>
    <div class="row mt12" style="justify-content:center;gap:10px;font-size:13px"><span id="iedXY"></span><span class="sp"></span>
      <button class="btn sm" data-preset="right">오른쪽 절반</button><button class="btn sm" data-preset="left">왼쪽 절반</button><button class="btn sm" data-preset="full">본문 전체</button>
      <button class="btn pri" id="iedSave">저장</button></div>`, true);
  const tmp = {...p, image: null, img: null, layout: p.layout === 'image' ? 'list' : p.layout};
  m.querySelector('#iedBg').innerHTML = thumbHTML(pageItem(sec, tmp, pi + 1), w);
  const box = m.querySelector('#iedBox'), st = {...im};
  const draw = () => { Object.assign(box.style, {left: st.x * sc + 'px', top: st.y * sc + 'px', width: st.w * sc + 'px', height: st.h * sc + 'px'}); m.querySelector('#iedXY').textContent = `x ${st.x} · y ${st.y} · ${st.w}×${st.h}px`; };
  draw();
  let drag = null;
  box.addEventListener('pointerdown', e => { drag = {mode: e.target.id === 'iedH' ? 'size' : 'move', sx: e.clientX, sy: e.clientY, o: {...st}}; box.setPointerCapture(e.pointerId); e.preventDefault(); });
  box.addEventListener('pointermove', e => { if (!drag) return; const dx = (e.clientX - drag.sx) / sc, dy = (e.clientY - drag.sy) / sc;
    if (drag.mode === 'move'){ st.x = Math.round(Math.max(0, Math.min(W - st.w, drag.o.x + dx))); st.y = Math.round(Math.max(0, Math.min(H - st.h, drag.o.y + dy))); }
    else { st.w = Math.round(Math.max(60, Math.min(W - st.x, drag.o.w + dx))); st.h = Math.round(Math.max(40, Math.min(H - st.y, drag.o.h + dy))); }
    draw(); });
  box.addEventListener('pointerup', () => drag = null);
  m.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { const bx = {x: MX, y: 124, w: W - MX * 2, h: 520}; const r = imgBoxes({img: {mode: b.dataset.preset, ratio: .48}}, bx).img; Object.assign(st, {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h)}); draw(); });
  m.querySelector('#iedSave').onclick = () => { Object.assign(im, {x: st.x, y: st.y, w: st.w, h: st.h, mode: 'free'}); m.remove(); rr(); toast('이미지 위치를 저장했습니다'); };
}

/* ---------- 희망 레이아웃 (참고 PPT) ---------- */
function vRefLayouts(){
  const L = S.refLayouts || [];
  const card = (t, i) => {
    const spec = tplSpec({kind: 'page', label: '', no: 1, secNo: 1}, {title: '제목이 들어갈 자리', subtitle: '부제가 들어갈 자리', keyMsg: t.cnt?.h ? '' : '', items: Array.from({length: Math.max(3, t.cnt?.h || 3)}, (_, k) => ({h: `항목 ${k + 1}`, d: '설명 문장이 들어갑니다', v: `${(k + 1) * 10}%`}))}, palette(), t);
    const sc = 220 / W;
    return `<div class="tplc ${t.use ? 'on' : ''}">
      <div class="sw-wrap" style="width:220px;height:${Math.round(H * sc)}px"><div style="transform:scale(${sc});transform-origin:0 0;width:${W}px;height:${H}px">${slideHTML(spec)}</div></div>
      <div class="row mt8" style="gap:6px;flex-wrap:wrap"><label class="ck" style="display:flex;gap:4px;align-items:center;font-size:12.5px"><input type="checkbox" data-bind="refLayouts.${i}.use" ${t.use ? 'checked' : ''}>사용</label>
        <select data-bind="refLayouts.${i}.tag" style="width:78px;font-size:12px">${Object.entries(TPL_TAGS).map(([k, n]) => `<option value="${k}" ${t.tag === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select data-bind="refLayouts.${i}.mode" style="width:96px;font-size:12px"><option value="fill" ${t.mode === 'fill' ? 'selected' : ''}>칸 채우기</option><option value="frame" ${t.mode === 'frame' ? 'selected' : ''}>틀만 사용</option></select>
        <label class="ck" style="display:flex;gap:4px;align-items:center;font-size:12px"><input type="checkbox" data-bind="refLayouts.${i}.recolor" ${t.recolor !== false ? 'checked' : ''}>컬러 적용</label>
        <button class="btn sm ghost bad" data-act="tplDel" data-i="${i}">✕</button></div>
      <div style="font-size:11.5px;color:#667085;margin-top:4px">${esc(t.name)} · 항목 칸 ${t.cnt?.h || 0}개${t.mode === 'frame' ? ' · 본문은 로직 레이아웃으로 채움' : ''}</div></div>`;
  };
  return `<div class="card"><div class="ch"><div><h3>희망 레이아웃</h3><div class="sub">원하는 디자인의 PPT를 올리면 장표 틀(도형·배치·배경)만 가져와 템플릿으로 씁니다. 원본 문구는 쓰지 않습니다.</div></div>
    <label class="btn" style="position:relative;overflow:hidden">＋ PPTX 업로드<input type="file" accept=".pptx" id="refIn" multiple style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>
    ${L.length ? `<div class="row mb8" style="gap:8px"><span class="tag">${L.length}장 · 사용 ${L.filter(t => t.use).length}</span><button class="btn sm ghost" data-act="tplAll" data-v="1">전체 사용</button><button class="btn sm ghost" data-act="tplAll" data-v="0">전체 해제</button><button class="btn sm ghost bad" data-act="tplClear">모두 삭제</button><span class="sp"></span><span style="font-size:12px;color:#667085">사용으로 켠 본문 틀은 [디자인 워싱]에서 자동 배정되고, 로직의 레이아웃 선택에서도 고를 수 있습니다.</span></div>
    <div class="tplgrid">${L.map((t, i) => (REFALL || t.use || i < 16) ? card(t, i) : '').join('')}</div>${L.length > 16 && !REFALL ? `<div class="row mt8" style="justify-content:center"><button class="btn sm" data-act="tplMore">나머지 ${L.filter((t, i) => i >= 16 && !t.use).length}장 더 보기</button></div>` : ''}` : `<div class="drop" data-drop="ref"><b>희망 레이아웃 PPTX를 끌어 놓으세요</b><br>표지·간지·본문 장표를 자동으로 구분합니다</div>`}</div>`;
}
async function addRefFiles(files){
  const fs = files.filter(f => /\.pptx$/i.test(f.name)); if (!fs.length) return toast('PPTX 파일만 지원합니다');
  busy('희망 레이아웃 분석 중…', '도형·배치·배경을 템플릿으로 변환합니다');
  try { for (const f of fs){ const t = await parseRefPptx(f); S.refLayouts.push(...t); } toast(`레이아웃 ${S.refLayouts.length}장을 불러왔습니다. 쓸 장표를 [사용]으로 켜세요`); }
  catch(e){ toast('레이아웃 분석 실패: ' + e.message); }
  unbusy(); rr();
}

/* ---------- 미디어믹스 ---------- */
function mmRows(){ return S.input.mediaMix.rows; }
function mmRecommend(){
  const c = signals(), MM = S.input.mediaMix, keep = MM.rows; MM.rows = [];
  const al = allocate(mediaMixAuto(c), MM.scenario || 'base');
  MM.rows = al.map(m => ({id: uid(), key: m.key, name: m.name, stage: m.stage, pct: m.pct}));
  if (!MM.rows.length) MM.rows = keep;
}
function vMediaMix(){
  const M = S.input.mediaMix, rows = M.rows, totalWon = (+M.total || 0) * 1e4;
  const monthly = mmMonthly(), months = M.unit === '월' ? (+M.months || 12) : (+M.months || 12), sum = rows.reduce((a, r) => a + (+r.pct || 0), 0);
  const stTot = k => rows.filter(r => r.stage === k).reduce((a, r) => a + (+r.pct || 0), 0);
  const bar = rows.length ? `<div class="mixbar mt12">${rows.map((r, i) => `<div style="flex:${Math.max(.5, +r.pct || 0)};background:${['#2E5BFF', '#6C8CFF', '#00B8A9', '#F5A524', '#8B5CF6', '#EF4444', '#10B981', '#64748B'][i % 8]}" title="${esc(r.name)} ${r.pct}%">${(+r.pct || 0) >= 7 ? esc(r.name) + ' ' + r.pct + '%' : ''}</div>`).join('')}</div>` : '';
  return `<div class="card"><div class="ch"><div><h3>미디어믹스</h3><div class="sub">전체 예산과 매체별 비중을 정하면 금액이 자동 계산되고, 로직의 매체 전략·예산 장표에 그대로 반영됩니다.</div></div>
    <div class="row" style="gap:6px"><button class="btn sm" data-act="mmRec">✦ 추천 믹스 불러오기</button><button class="btn sm ghost" data-act="mmNorm" ${rows.length ? '' : 'disabled'}>비중 100% 맞추기</button></div></div>
    <div class="grid4">
      <div><label class="f">전체 예산 (만원)</label><input type="number" min="0" step="100" data-mm="total" value="${M.total || ''}" placeholder="예: 5000"></div>
      <div><label class="f">예산 기준</label><select data-mm="unit"><option ${M.unit === '월' ? 'selected' : ''}>월</option><option value="총" ${M.unit !== '월' ? 'selected' : ''}>총(계약 기간)</option></select></div>
      <div><label class="f">운영 기간 (개월)</label><input type="number" min="1" max="36" data-mm="months" value="${M.months || 12}"></div>
      <div><label class="f">추천 시나리오</label><select data-mm="scenario">${[['safe', '보수(전환 집중)'], ['base', '기본'], ['push', '공격(인지 확대)']].map(([v, n]) => `<option value="${v}" ${M.scenario === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    </div>
    ${totalWon ? `<div class="note info mt12">월 예산 <b>${won(monthly)}원</b> · 기간 합계 <b>${won(monthly * months)}원</b> (${months}개월)</div>` : `<div class="note mt12">예산을 입력하지 않으면 비중(%)만 장표에 표시됩니다. RFP에 예산이 있으면 엔진이 그 값을 씁니다.</div>`}
    ${rows.length ? `<table class="mmt mt12"><thead><tr><th style="width:34%">매체</th><th style="width:16%">퍼널 역할</th><th style="width:12%">비중(%)</th><th>월 금액</th><th>기간 합계</th><th style="width:40px"></th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td><input type="text" data-mmr="${i}.name" value="${esc(r.name)}"></td>
        <td><select data-mmr="${i}.stage">${Object.entries(STAGE).map(([k, s]) => `<option value="${k}" ${r.stage === k ? 'selected' : ''}>${s.ko} (${s.en})</option>`).join('')}</select></td>
        <td><input type="number" min="0" max="100" step="1" data-mmr="${i}.pct" value="${r.pct}"></td>
        <td class="num">${monthly ? won(monthly * (+r.pct || 0) / 100) + '원' : '-'}</td><td class="num">${monthly ? won(monthly * months * (+r.pct || 0) / 100) + '원' : '-'}</td>
        <td><button class="btn sm ghost bad" data-act="mmDel" data-i="${i}">✕</button></td></tr>`).join('')}
      <tr class="tot"><td>합계</td><td style="font-size:12px;color:#667085">발견 ${stTot('upper')} · 선택 ${stTot('mid')} · 재방문 ${stTot('low')}</td><td class="num ${sum === 100 ? '' : 'bad'}">${sum}%</td><td class="num">${monthly ? won(monthly * sum / 100) + '원' : '-'}</td><td class="num">${monthly ? won(monthly * months * sum / 100) + '원' : '-'}</td><td></td></tr>
    </tbody></table>${sum !== 100 ? `<div class="note bad mt8">비중 합계가 ${sum}%입니다. [비중 100% 맞추기]로 비율을 유지한 채 맞출 수 있습니다.</div>` : ''}${bar}` : `<div class="empty mt12"><b>매체가 없습니다</b>[✦ 추천 믹스 불러오기]로 RFP·업종 기준 기본 구성을 불러오거나 직접 추가하세요.</div>`}
    <div class="row mt12"><button class="btn sm" data-act="mmAdd">+ 매체 추가</button>${rows.length ? '<button class="btn sm ghost bad" data-act="mmClear">전체 비우기</button>' : ''}<span class="sp"></span>${rows.length && S.sections.length ? '<button class="btn sm pri" data-act="mmApply">로직의 매체·예산 섹션에 반영</button>' : ''}</div></div>`;
}

/* ---------- 기본 장표 라이브러리 ---------- */
function vLibraryCard(){
  const L = LIB(); if (!L) return '';
  const st = LIB_ROLES.map(r => { const s = L.sections.find(x => x.role === r); const pl = s ? s.pageList : []; return {r, n: pl.length, ppt: pl.filter(p => p.fixed).length, src: s?.srcFile || '', at: s?.srcAt || 0, thumb: pl[0] && s}; });
  return `<div class="card mt16"><div class="ch"><div><h3>기본 장표 라이브러리 <span class="tag">고정 섹션</span></h3><div class="sub">섹션별로 회사 PPT를 올리면 장표가 원본 그대로(도형·표·이미지·문구) 등록되고, 모든 제안서의 해당 섹션에 기본으로 들어갑니다. 제안서마다 [로직]에서 끄고 켤 수 있습니다.</div></div>
    <div class="row" style="gap:6px"><button class="btn" data-act="openLib">장표 확인·수정</button><label class="btn ghost" style="position:relative;overflow:hidden">JSON 불러오기<input type="file" accept=".json" id="libIn" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label><button class="btn ghost" data-act="libExport">백업 내보내기</button></div></div>
    <div class="libgrid">${st.map(x => `<div class="libc ${x.n ? 'on' : ''}" data-drop="lib:${x.r}">
      <b>${ROLES[x.r]}</b>
      ${x.thumb ? `<div class="sw-wrap" style="width:100%;aspect-ratio:16/9;margin:4px 0;overflow:hidden;border-radius:4px;border:1px solid #E4E7EC" data-libthumb="${x.r}"></div>` : ''}
      <span>${x.n ? `${x.n}장 등록${x.ppt ? ` · PPT ${x.ppt}장` : ''}` : '미등록 · 엔진 초안 사용'}</span>
      ${x.src ? `<span style="font-size:11px;word-break:break-all">${esc(x.src)}${x.at ? ' · ' + new Date(x.at).toLocaleDateString('ko-KR') : ''}</span>` : ''}
      <div class="row" style="gap:4px;margin-top:4px;flex-wrap:wrap"><label class="btn sm ${x.n ? '' : 'pri'}" style="position:relative;overflow:hidden">${x.n ? 'PPT 교체' : 'PPT 업로드'}<input type="file" accept=".pptx" data-libppt="${x.r}" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>${x.n ? `<button class="btn sm ghost bad" data-act="libClear" data-r="${x.r}">비우기</button>` : ''}</div>
    </div>`).join('')}</div>
    <div class="note mt12">PPTX 파일을 카드에 끌어 놓아도 됩니다. 파일 안의 모든 장표가 그 섹션에 순서대로 들어가고, 간지는 제안서 쪽에서 자동으로 붙습니다. 원본에 차트 개체가 있으면 빨간 점선으로 표시되니 이미지로 바꿔 올려 주세요. <b>.ppt(구버전)는 PowerPoint에서 .pptx로 저장 후</b> 올려 주세요.</div></div>`;
}
function libThumbs(){ const L = LIB(); if (!L) return; $$('[data-libthumb]').forEach(el => { const s = L.sections.find(x => x.role === el.dataset.libthumb); if (!s || !s.pageList[0]) return; const w = el.clientWidth || 180; el.innerHTML = `<div style="transform:scale(${w / W});transform-origin:0 0;width:${W}px;height:${H}px">${slideHTML(buildSpec({kind: 'page', page: s.pageList[0], label: '', no: 1}))}</div>`; }); }
async function libFromPptx(role, file){
  if (!/\.pptx$/i.test(file.name)) return toast('PPTX 파일만 지원합니다 (.ppt는 .pptx로 저장 후 업로드)');
  const L = LIB(); if (!L) return;
  const old = L.sections.find(x => x.role === role);
  if (old?.pageList.length && !confirm(`${ROLES[role]} 섹션의 기존 장표 ${old.pageList.length}장을 이 파일로 교체할까요?`)) return;
  busy(`${ROLES[role]} 장표 불러오는 중…`, file.name + (file.size > 8e7 ? ' · 용량이 커서 몇 분 걸릴 수 있습니다' : ''));
  try {
    const slides = await parseRefPptx(file, {raw: true, onProgress: (i, n) => busy(`${ROLES[role]} 장표 불러오는 중… (${i}/${n})`, file.name)});
    if (!slides.length) throw new Error('장표를 찾지 못했습니다');
    const pages = slides.map(sl => { const tx = sl.els.filter(e => e.k === 't' && e.text).sort((a, b) => b.size - a.size || a.y - b.y); const p = newPage('explain', {title: (tx.find(t => t.y < H * .25) || tx[0] || {}).text?.split('\n')[0]?.slice(0, 60) || `${ROLES[role]} ${sl.no}`, subtitle: '', items: []}); p.layout = 'fixed'; p.fixed = {bg: sl.bg, bgImg: sl.bgImg, els: sl.els}; p.washed = true; p.srcSlide = sl.no; return p; });
    const sec = old || (() => { const s = newSection(kindOfRole(role), ROLES[role], '', 1, true, role); s.en = ROLE_DEF[role]?.[1] || ''; L.sections.push(s); return s; })();
    sec.pageList = pages; sec.pages = pages.length; sec.divider = true; sec.srcFile = file.name; sec.srcAt = Date.now();
    L.updated = Date.now(); await DB.put(clone(L));
    const charts = pages.reduce((a, p) => a + p.fixed.els.filter(e => e.k === 'frame').length, 0);
    toast(`${ROLES[role]}: ${pages.length}장 등록${charts ? ` · 차트 ${charts}개는 이미지로 교체 필요` : ''}`, 4500);
  } catch(e){ toast('불러오기 실패: ' + e.message, 5000); }
  unbusy(); render();
}
function vFixedPage(sec, si, p, pi){
  const base = `sections.${si}.pageList.${pi}`, b = `data-s="${si}" data-p="${pi}"`;
  const tx = p.fixed.els.map((e, k) => [e, k]).filter(([e]) => e.k === 't' && e.text != null);
  const miss = p.fixed.els.filter(e => e.k === 'frame').length;
  return `<div class="pg"><div class="thumb" data-act="preview" ${b} data-thumb="${si}.${pi}">${thumbHTML(pageItem(sec, p, pi + 1), 340)}</div>
    <div class="pf">
      <div class="row" style="flex-wrap:wrap"><span class="tag">p${pi + 1}</span><span class="tag pri">원본 PPT 장표${p.srcSlide ? ' · ' + p.srcSlide + '번' : ''}</span>${miss ? `<span class="tag warn">차트 ${miss}개 교체 필요</span>` : ''}
        <span style="flex:1"></span>
        <button class="btn sm" data-act="pagePPT" ${b}>PPT</button><button class="btn sm" data-act="pagePDF" ${b}>PDF</button>
        <button class="btn sm ghost" data-act="pageMv" ${b} data-d="-1">▲</button><button class="btn sm ghost" data-act="pageMv" ${b} data-d="1">▼</button>
        <button class="btn sm ghost" data-act="pageDup" ${b}>복제</button><button class="btn sm ghost bad" data-act="pageDel" ${b}>삭제</button></div>
      <div class="note mt8" style="font-size:12.5px">디자인은 원본 그대로 유지됩니다. 문구만 아래에서 고칠 수 있습니다 (예: 연도·인원·실적 업데이트).</div>
      <details class="mt8" ${tx.length <= 8 ? 'open' : ''}><summary style="cursor:pointer;font-size:13px;color:#475467">텍스트 ${tx.length}개 수정</summary>
        ${tx.map(([e, k]) => `<textarea data-bind="${base}.fixed.els.${k}.text" rows="${Math.min(4, String(e.text).split('\n').length)}" style="margin-top:6px;${e.bold ? 'font-weight:700;' : ''}">${esc(e.text)}</textarea>`).join('')}
      </details>
      ${miss ? `<div class="row mt8"><label class="btn sm" style="position:relative;overflow:hidden">차트 자리에 이미지 넣기<input type="file" accept="image/*" data-fixedimg="${si}.${pi}" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>` : ''}
    </div></div>`;
}
function ensureLibSections(){
  const L = S; if (!L.isLibrary) return;
  LIB_ROLES.forEach(r => { if (!L.sections.some(s => s.role === r)){ const sec = newSection(kindOfRole(r), ROLES[r], '', 2, true, r); sec.en = ROLE_DEF[r]?.[1] || ''; L.sections.push(sec); } });
}

/* ---------- 액션 ---------- */
Object.assign(ACT, {
  imgSlot: b => { ensureImg(pgOf(b)); rr(); },
  imgEdit: b => openImgEditor(+b.dataset.s, +b.dataset.p),
  imgDel: b => { const p = pgOf(b); p.image = null; p.img = null; if (p.layout === 'image') p.layout = 'list'; rr(); },
  tplMore: () => { REFALL = true; render(); },
  tplDel: b => { S.refLayouts.splice(+b.dataset.i, 1); rr(); },
  tplAll: b => { S.refLayouts.forEach(t => t.use = b.dataset.v === '1'); rr(); },
  tplClear: () => { if (!confirm('불러온 레이아웃을 모두 삭제할까요?')) return; S.refLayouts = []; S.sections.forEach(s => s.pageList.forEach(p => { if (String(p.layout).startsWith('tpl:')) p.layout = p.tplBody || 'list'; })); rr(); },
  mmRec: () => { if (mmRows().length && !confirm('현재 매체 구성을 추천 믹스로 바꿀까요?')) return; mmRecommend(); rr(); toast('추천 믹스를 불러왔습니다. 비중은 직접 조정할 수 있습니다'); },
  mmNorm: () => { const R = mmRows(), s = R.reduce((a, r) => a + (+r.pct || 0), 0); if (!s) return; R.forEach(r => r.pct = Math.round((+r.pct || 0) / s * 100)); const d = 100 - R.reduce((a, r) => a + r.pct, 0); const mx = R.reduce((a, r, i) => r.pct > R[a].pct ? i : a, 0); R[mx].pct += d; rr(); },
  mmAdd: () => { mmRows().push({id: uid(), key: '', name: '새 매체', stage: 'mid', pct: 0}); rr(); },
  mmDel: b => { mmRows().splice(+b.dataset.i, 1); rr(); },
  mmClear: () => { S.input.mediaMix.rows = []; rr(); },
  mmApply: () => { const idx = S.sections.map((s, i) => ['media', 'budget'].includes(s.role) ? i : -1).filter(i => i >= 0); if (!idx.length) return toast('매체 전략·예산 섹션이 없습니다'); if (!confirm(`매체·예산 섹션 ${idx.length}개를 새 미디어믹스로 다시 작성할까요? (직접 고친 내용은 덮어씁니다)`)) return; busy('미디어믹스 반영 중…'); Promise.resolve().then(async () => { for (const i of idx) await genSection(i); }).finally(() => { unbusy(); rr(); toast('미디어믹스를 반영했습니다'); }); },
  openLib: () => { save(); openProject(LIB_ID, 'logic'); ensureLibSections(); rr(); },
  libClear: b => { const L = LIB(), s = L?.sections.find(x => x.role === b.dataset.r); if (!s || !confirm(`${ROLES[b.dataset.r]} 섹션 장표를 비울까요? (엔진 초안으로 돌아갑니다)`)) return; s.pageList = []; s.pages = 1; s.srcFile = ''; L.updated = Date.now(); DB.put(clone(L)).then(render); },
  libExport: () => { const L = LIB(); if (!L) return; const blob = new Blob([JSON.stringify({kind: 'proposal-studio-library', sections: L.sections}, null, 1)], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '기본장표_라이브러리.json'; a.click(); }
});

/* ---------- 입력 이벤트 ---------- */
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'refIn'){ await addRefFiles([...el.files]); el.value = ''; return; }
  if (el.id === 'libIn'){ const f = el.files[0]; el.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()); const L = LIB(); const secs = (j.sections || []).map(s => { const role = LIB_ROLES.includes(s.role) ? s.role : inferRole((s.title || '') + ' ' + (s.goal || '')); const sec = newSection(kindOfRole(role), s.title || ROLES[role], s.goal || '', 1, s.divider !== false, role); sec.en = s.en || ''; sec.pageList = (s.pageList || s.pages || []).map(p => newPage(p.type || 'explain', p)); sec.pages = sec.pageList.length; return sec; }).filter(s => LIB_ROLES.includes(s.role));
      secs.forEach(s => { const i = L.sections.findIndex(x => x.role === s.role); if (i >= 0) L.sections[i] = s; else L.sections.push(s); }); L.updated = Date.now(); await DB.put(clone(L)); render(); toast(`라이브러리 ${secs.length}개 섹션을 불러왔습니다`); } catch(er){ toast('불러오기 실패: ' + er.message); } return; }
  if (el.dataset.libppt){ const f = el.files[0]; el.value = ''; if (f) await libFromPptx(el.dataset.libppt, f); return; }
  if (el.dataset.fixedimg){ const [si, pi] = el.dataset.fixedimg.split('.').map(Number), f = el.files[0]; el.value = ''; if (!f) return; const p = S.sections[si].pageList[pi]; const fr = p.fixed.els.find(e => e.k === 'frame'); if (!fr) return; const r = await readDataURL(f).then(d => resizeImage(d, 1600)); Object.assign(fr, {k: 'i', data: r.data, cover: false}); rr(); return; }
  if (el.dataset.mm){ const k = el.dataset.mm, M = S.input.mediaMix; M[k] = el.type === 'number' ? Math.max(0, +el.value || 0) : el.value; if (k === 'scenario' && M.rows.length && confirm('시나리오에 맞춰 비중을 다시 계산할까요?')){ const c = signals(); const base = M.rows.map(r => ({...(MEDIA_LIB(c)[r.key] || {w: 8}), ...r, fixedPct: 0})); const al = allocate(base, el.value); M.rows.forEach((r, i) => r.pct = al[i].pct); } rr(); return; }
  if (el.dataset.mmr){ const [i, k] = el.dataset.mmr.split('.'), r = mmRows()[+i]; if (!r) return; r[k] = k === 'pct' ? Math.max(0, Math.min(100, +el.value || 0)) : el.value; rr(); return; }
});
document.addEventListener('drop', e => { const l = e.target.closest('[data-drop^="lib:"]'); if (l){ e.preventDefault(); e.stopImmediatePropagation(); l.classList.remove('over'); const f = [...e.dataTransfer.files][0]; if (f) libFromPptx(l.dataset.drop.slice(4), f); return; } const d = e.target.closest('[data-drop="ref"]'); if (!d) return; e.preventDefault(); e.stopImmediatePropagation(); addRefFiles([...e.dataTransfer.files]); }, true);

const _render0 = render; render = function(){ _render0.apply(this, arguments); if ($('[data-libthumb]')) requestAnimationFrame(libThumbs); };
boot().then(() => { if (S.isLibrary) ensureLibSections(); render(); fontsReady().then(() => render()); });
document.addEventListener('dragover', e => { const l = e.target.closest('[data-drop^="lib:"]'); if (l){ e.preventDefault(); l.classList.add('over'); } });
document.addEventListener('dragleave', e => { e.target.closest('[data-drop^="lib:"]')?.classList.remove('over'); });
