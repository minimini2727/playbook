/* =========================================================
   Claude 심화 리서치 — 사람이 먼저 판단(브리프) → 프롬프트 확인·수정 → 결과 적용
   ========================================================= */
const FLOW_PRESETS = {
  auto: {name: '우선순위로 Claude가 판단', flow: []},
  creative: {name: '크리에이티브 우선', flow: ['크리에이티브 컨셉과 소재 전략 (승부처)', '고객·시장 진단: 소재의 근거', '매체별 소재 운영안', '테스트·확장 기준', '측정·리포트', '운영 조직·비용']},
  media: {name: '매체·효율 우선', flow: ['현황 진단: 매체·예산 효율', '퍼널별 매체 역할과 예산 배분', '매체별 실행안 (실무 디테일)', '크리에이티브 운영', 'KPI·측정', '운영·리포트·비용']},
  data: {name: '측정·데이터 우선', flow: ['측정 환경 진단 (GA4·CAPI·전환 API)', '지표 체계와 판단 기준', '매체 운영안', '크리에이티브 테스트 설계', '리포트·대응 체계', '조직·비용']},
  brand: {name: '브랜드 진단 우선', flow: ['브랜드·고객 진단 (인사이트 3개)', '제안 컨셉', '퍼널 전략', '매체 실행안', '크리에이티브', 'KPI·운영']},
  classic: {name: '전형적 흐름', flow: ['현황 진단', '과제와 전략', '미디어믹스·매체별 실행안', '크리에이티브', 'KPI·측정', '운영·리포트·비용']}
};
function briefText(){
  const B = S.input.brief || {};
  const flow = (B.flow || []).filter(f => f && f.trim());
  return [B.points ? `RFP 핵심 포인트(제안자 판단):\n${B.points}` : '', flow.length ? `제안 흐름(이 순서·비중으로 목차 구성):\n${flow.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : '', S.input.notes ? `기타 고려사항(OT·경쟁 PT·우리 강점):\n${S.input.notes}` : ''].filter(Boolean).join('\n\n');
}
function briefDraft(){
  const A = S.input.analysis?.engine === false ? S.input.analysis : strategistAnalysis(), R = A.rfpSummary || {};
  const L = [['목표', R.objective], ['KPI', R.kpi], ['예산', R.budget], ['기간', R.period], ['타겟', R.target], ['과업 범위', R.scope], ['평가 기준', R.evaluation]].filter(x => x[1] && !/^\s*\(/.test(String(x[1]))).map(([k, v]) => `- ${k}: ${String(v).replace(/\s+/g, ' ').slice(0, 120)}`);
  (R.constraints || []).filter(Boolean).slice(0, 3).forEach(c => L.push(`- 제약: ${c}`));
  (A.priorities || []).slice(0, 3).forEach((p, i) => L.push(`- 승부처 ${i + 1}: ${p.title}${p.angle ? ` → ${p.angle}` : ''}`));
  return L.join('\n');
}
const MEDIA_RESEARCH = `[매체 전략 리서치: 겉핥기 금지]
미디어믹스에 들어가는 매체마다 웹에서 직접 찾아 확인하고 장표에 녹일 것. 공식 문서만 보지 말고 실무자 글로 교차 확인한다.
- 공식 자료: Google Ads 고객센터·Google Ads & Commerce Blog, Meta 비즈니스 도움말·Meta for Business 소식, 네이버 검색광고 공식 블로그·네이버 광고 고객센터(GFA·쇼핑검색·ADVoost), 카카오비즈니스 가이드, Criteo 도움말·블로그, 쿠팡 광고 센터 등 해당 매체
- 실무 자료(최근 12개월 우선): 아이보스·오픈애즈 실무 글, 운영자 브런치·블로그 후기, 대행사 리포트(메조미디어·나스미디어 등), Search Engine Land, Jon Loomer 같은 해외 실무 블로그
- 매체마다 정리할 것: ① 이 브랜드에서 맡는 역할(퍼널 위치·KPI) ② 캠페인 구조(캠페인·광고그룹 나누는 기준, 입찰 전략, 학습에 필요한 전환 수·일 예산) ③ 타겟·시그널 설정 ④ 소재 포맷·규격과 이번 브랜드용 소재 아이디어 ⑤ 최근 1년 안의 제품 변화와 활용법(해당되는 것만) ⑥ 실무에서 자주 하는 실수와 막는 방법 ⑦ 평가 지표와 증액·감액 판단 기준 ⑧ 예산·일정 ⑨ 다른 대행사가 잘 안 하는, 이 브랜드만을 위한 운영 아이디어 1개
- 업종 규제(심의, 금지 표현, 타겟 제한)가 있으면 매체별 제약과 대응을 함께 쓸 것.
- 확인한 사실은 source에 매체·문서명·날짜를 쓰고, 확인하지 못한 기능·수치는 쓰지 말 것.
- 매체 장표는 매체당 1~2장. 매체 이름만 바꾸면 다른 브랜드에도 쓸 수 있는 문장이면 다시 쓸 것.`;
const ORDER_RULE = `[목차 순서: 우선순위 기반]
1) 먼저 priorities를 정한다. 2) sections 순서는 priorities가 정한다(전형적인 제안서 순서를 따르지 않아도 됨). 1순위 승부처 섹션을 회사소개 바로 다음, 또는 맨 앞에 둔다. 3) 각 섹션 goal에 어떤 우선순위를 푸는 섹션인지 적는다. 4) 우선순위가 낮은 일반 항목(운영·리포트·비용)은 뒤로 모으고 장수를 줄인다.`;

function claudePromptAll(){
  const A = S.input.analysis, B = S.input.brief || {}, bt = briefText();
  const eng = A?.engine ? `\n[내장 엔진 초안 — 참고만, 더 날카롭게 고칠 것]\n우선순위: ${(A.priorities || []).map(p => p.title).join(' / ')}\n매체 믹스: ${(A.mix || []).map(m => `${m.name} ${m.pct}%`).join(', ')}` : '';
  return `너는 한국 퍼포먼스 마케팅 대행사의 10년차 제안 전략가야. 경쟁 PT에서 이겨야 하는 입장에서, 아래 RFP와 제안자 브리프로 실제 제출할 제안서의 로직과 장표 내용을 작성해줘.

${bt ? `[제안자 브리프: 사람이 판단한 내용이니 최우선으로 반영]\n${bt}\n` : ''}
[해야 할 일]
1) 웹 검색으로 최신 시장 데이터(카테고리 온라인 거래·검색량 추이, 경쟁사 가격·광고 동향, 업계 변화)를 찾아 출처·날짜와 함께 research에 정리.
2) 판매 채널 URL을 각각 직접 열어 상세페이지 확인: 가격, 혜택, 리뷰 수·평점, USP, 상세 메시지의 약점을 research.channels에 사실로 기록. 열 수 없으면 "확인 불가".
3) RFP와 브리프를 읽고 priorities 작성: RFP 문장을 옮기지 말고 "어디서 이겨야 하는지" 판단.
4) ${B.reorder === false ? 'RFP 목차 지정이 있으면 따르고, 없으면 우선순위를 고려해 구성.' : '아래 [목차 순서] 규칙대로 sections를 구성.'} 섹션당 2~8장, 각 장표를 실제 내용으로 채울 것.
5) 예산이 있으면 매체별 비중과 월 금액을 계산하고 3안 제시.
${B.mediaDeep === false ? '' : '6) 아래 [매체 전략 리서치]를 수행하고 결과를 mediaResearch와 매체 장표에 반영.\n'}
${B.reorder === false ? '' : ORDER_RULE + '\n'}
${B.mediaDeep === false ? '' : MEDIA_RESEARCH + '\n'}
${PLAYBOOK_RULES}
${eng}

${inputDump()}

[출력] 설명 없이 아래 스키마의 JSON 코드블록 하나만 출력해. (대시보드에 그대로 붙여넣음)
${JSON_SCHEMA.replace(/\n}$/, `,
 "mediaResearch":[{"media":"","role":"퍼널 위치·KPI","structure":"캠페인 구조·입찰·학습 조건","signals":"타겟·시그널","creative":"포맷·규격·소재 아이디어","latest":"최근 제품 변화와 활용","pitfalls":"자주 하는 실수와 방지책","kpi":"평가 지표·증감액 기준","idea":"이 브랜드만의 운영 아이디어","sources":["매체·문서명·날짜"]}]
}`)}`;
}

/* ---------- 심화 리서치 창: ① 브리프 → ② 프롬프트 → ③ 적용 ---------- */
const _openBridge0 = openClaudeBridge;
openClaudeBridge = function(sec){
  if (sec) return _openBridge0(sec);
  const B = S.input.brief;
  let step = 1;
  const m = modal('Claude 심화 리서치 & 제안 로직', `<div id="rsbody"></div>`);
  const flowRows = () => (B.flow.length ? B.flow : ['']).map((f, i) => `<div class="row mb8"><span class="tag" style="min-width:26px;justify-content:center">${i + 1}</span><input type="text" data-fi="${i}" value="${esc(f)}" placeholder="예) 크리에이티브 컨셉과 소재 전략"><button class="btn sm ghost" data-fm="${i}" data-d="-1">▲</button><button class="btn sm ghost" data-fm="${i}" data-d="1">▼</button><button class="btn sm ghost bad" data-fx="${i}">✕</button></div>`).join('');
  const draw = () => {
    const prompt = step >= 2 ? (B.customPrompt && B.customFor === briefKey() ? B.customPrompt : claudePromptAll()) : '';
    $('#rsbody', m).innerHTML = `
      <div class="row mb12" style="gap:6px">${['① 브리프 작성 (사람 판단)', '② 프롬프트 확인·수정', '③ 결과 붙여넣기'].map((t, i) => `<button class="btn sm ${step === i + 1 ? 'pri' : 'ghost'}" data-step="${i + 1}">${t}</button>`).join('')}</div>
      ${step === 1 ? `
      <div class="note info mb12">Claude가 리서치하기 전에, 이 제안에서 무엇이 중요한지와 어떤 흐름으로 풀지를 먼저 적어주세요. 여기 쓴 내용이 프롬프트 맨 앞에 들어가 최우선으로 반영됩니다.</div>
      <div class="grid2">
        <div><div class="row mb8"><b style="flex:1">RFP 핵심 포인트</b><button class="btn sm" id="draftPts">RFP에서 초안 뽑기</button></div>
          <textarea id="pts" rows="12" placeholder="- 광고주가 진짜 원하는 것: 신규 고객 확보보다 재구매 ...&#10;- 평가에서 비중이 큰 항목: 크리에이티브 40%&#10;- 우리가 이길 포인트: 의료기기 심의 운영 경험 ...">${esc(B.points || '')}</textarea>
          <b class="mt12" style="display:block;margin-top:14px">기타 고려사항 <span class="ks">OT 내용·경쟁 PT·우리 강점·꼭 넣을 메시지</span></b>
          <textarea id="nts" rows="5" placeholder="예) 작년 대행사는 리포트만 많고 액션이 없었다는 불만 / 경쟁 3사 PT">${esc(S.input.notes || '')}</textarea></div>
        <div><div class="row mb8"><b style="flex:1">제안 흐름 (목차 순서)</b><select id="preset" style="width:200px">${Object.entries(FLOW_PRESETS).map(([k, v]) => `<option value="${k}" ${B.preset === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
          <p class="hint" style="margin:0 0 8px">위에서부터 제안서에 나오는 순서입니다. 비워두면 Claude가 우선순위를 보고 순서를 정합니다. 예) 크리에이티브가 중요하면 맨 위에.</p>
          <div id="flows">${flowRows()}</div><button class="btn sm" id="fadd">+ 단계 추가</button>
          <div class="mt12" style="margin-top:16px;display:grid;gap:8px">
            <label class="ck" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="reo" ${B.reorder !== false ? 'checked' : ''}>우선순위대로 목차 재배열 (전형적 순서 고집 안 함)</label>
            <label class="ck" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mdp" ${B.mediaDeep !== false ? 'checked' : ''}>매체별 실무 리서치 (공식 문서 + 실무 블로그·아티클 교차 확인)</label></div></div>
      </div>
      <div class="row mt12" style="justify-content:flex-end;margin-top:16px"><button class="btn pri" id="next1">프롬프트 만들기 →</button></div>` : step === 2 ? `
      <div class="note info mb12">브리프가 반영된 프롬프트입니다. 필요하면 직접 고친 뒤 복사해서 Claude(이 프로젝트 채팅)에 붙여넣으세요. Claude가 웹 검색·상세페이지 확인 후 JSON으로 답합니다.</div>
      <div class="row mb8"><b style="flex:1">프롬프트 (${prompt.length.toLocaleString()}자) · 직접 수정 가능</b><button class="btn sm ghost" id="resetP">초기화</button><button class="btn sm pri" id="cpy">복사</button><a class="btn sm" href="https://claude.ai/new" target="_blank" rel="noopener">Claude 열기 ↗</a></div>
      <textarea id="pr" style="min-height:56vh;font-size:12px;line-height:1.55">${esc(prompt)}</textarea>
      <div class="row mt12" style="justify-content:space-between;margin-top:14px"><button class="btn" data-step="1">← 브리프 수정</button><button class="btn pri" id="next2">Claude 답변 붙여넣기 →</button></div>` : `
      <div class="row mb8"><b style="flex:1">Claude 답변(JSON) 붙여넣기</b><span class="hint" style="margin:0">답변 앞뒤의 설명 문장은 자동으로 무시됩니다</span></div>
      <textarea id="js" style="min-height:50vh;font-size:12px" placeholder='{"research":{...}, "priorities":[...], "sections":[...]}'></textarea>
      <label class="ck mt12" style="display:flex;gap:6px;align-items:center;margin-top:12px"><input type="checkbox" id="withSec" checked>섹션·장표 내용까지 적용 (기존 로직 대체)</label>
      <div class="row mt12" style="justify-content:space-between;margin-top:12px"><button class="btn" data-step="2">← 프롬프트</button><button class="btn pri" id="apply">적용</button></div>`}`;
    bind();
  };
  const briefKey = () => JSON.stringify([B.points, B.flow, B.reorder, B.mediaDeep, S.input.notes]);
  const keep = () => {
    if ($('#pts', m)) B.points = $('#pts', m).value;
    if ($('#nts', m)) S.input.notes = $('#nts', m).value;
    if ($('#reo', m)) B.reorder = $('#reo', m).checked;
    if ($('#mdp', m)) B.mediaDeep = $('#mdp', m).checked;
    m.querySelectorAll('[data-fi]').forEach(x => { B.flow[+x.dataset.fi] = x.value; });
    if ($('#pr', m)){ const v = $('#pr', m).value; if (v !== claudePromptAll()){ B.customPrompt = v; B.customFor = briefKey(); } }
    save();
  };
  const bind = () => {
    m.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { keep(); step = +b.dataset.step; draw(); });
    const on = (id, f) => { const e = $('#' + id, m); if (e) e.onclick = f; };
    on('draftPts', () => { const d = briefDraft(); $('#pts', m).value = ($('#pts', m).value.trim() ? $('#pts', m).value.trim() + '\n' : '') + d; keep(); toast('RFP 기준 초안을 넣었습니다 — 판단에 맞게 고치세요'); });
    on('fadd', () => { keep(); B.flow.push(''); draw(); });
    on('next1', () => { keep(); step = 2; draw(); });
    on('next2', () => { keep(); step = 3; draw(); });
    on('resetP', () => { B.customPrompt = ''; save(); draw(); });
    on('cpy', async () => { keep(); const v = $('#pr', m).value; try { await navigator.clipboard.writeText(v); toast('프롬프트 복사됨 — Claude에 붙여넣으세요'); } catch(e){ $('#pr', m).select(); document.execCommand('copy'); toast('복사됨'); } });
    on('apply', () => { try { importClaude(parseJSON($('#js', m).value), $('#withSec', m)?.checked); m.remove(); save(); render(); toast('Claude 결과를 적용했습니다'); } catch(e){ toast('적용 실패: ' + e.message, 4500); } });
    const ps = $('#preset', m); if (ps) ps.onchange = () => { keep(); B.preset = ps.value; const f = FLOW_PRESETS[ps.value]?.flow || []; if (ps.value === 'auto' || !B.flow.filter(x => x.trim()).length || confirm('현재 흐름을 프리셋으로 바꿀까요?')) B.flow = [...f]; draw(); };
    m.querySelectorAll('[data-fm]').forEach(b => b.onclick = () => { keep(); const i = +b.dataset.fm, j = i + +b.dataset.d; if (j < 0 || j >= B.flow.length) return; [B.flow[i], B.flow[j]] = [B.flow[j], B.flow[i]]; draw(); });
    m.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { keep(); B.flow.splice(+b.dataset.fx, 1); draw(); });
  };
  draw();
};
