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
const MEDIA_RESEARCH = `[매체 전략 리서치: 겉핥기 금지, KPI 달성 기준으로 쓸 것]
목표는 "매체 소개"가 아니라 ROAS·CPA·CVR 목표를 실제로 맞추는 운영안이다. 매체마다 웹에서 직접 확인하고, 공식 문서와 실무자 글을 교차 확인한다.
- 대상 매체: RFP 매체 전부 + 이 브랜드에 효과가 있으면 메타·구글(유튜브)·네이버(검색·쇼핑·GFA·ADVoost)·카카오(비즈보드·모먼트)·크리테오(리타겟·커머스 미디어)·쿠팡 중 빠진 매체도 검토. RFP 범위 밖이면 "추가 제안"으로 구분하고 넣을지 말지 근거를 한 줄로.
- 공식 자료: Google Ads 고객센터·Google Ads & Commerce Blog, Meta 비즈니스 도움말·Meta for Business, 네이버 검색광고 공식 블로그·광고 고객센터(쇼핑검색·GFA·ADVoost), 카카오비즈니스 가이드, Criteo 도움말·블로그, 쿠팡 광고 센터
- 실무 자료(최근 12개월 우선): 아이보스·오픈애즈, 운영자 브런치·블로그, 대행사 리포트(메조미디어·나스미디어·AMPM 인사이트 등), Search Engine Land, Jon Loomer 등
[매체마다 반드시 쓸 것 — 매체 전략 = 타겟팅 어프로치 + 운영 실행안 + 소재 결합]
매체 장표를 소재 운영 위주로 쓰지 말 것. "이 매체 안에서 KPI를 맞추려면 누구를, 어떤 구조와 순서로, 어떤 소재를 붙여 운영하는가"로 쓴다. 소재는 따로 떼어 설명하지 말고 타겟·운영과 묶어서만 쓴다.
① KPI 목표: 매체 역할(퍼널 위치)과 목표 ROAS·CPA·CVR·CTR 수치. 근거는 업종 벤치마크(출처) 또는 "월 예산 ÷ 목표 CPA = 필요 전환 수" 역산. 근거 없는 숫자는 "(가정)"
② KPI 분해: ROAS = CTR × CVR × 객단가 ÷ CPC 로 쪼개 이 브랜드의 가장 약한 고리 하나를 지정하고, 아래 ③~⑤가 그 고리를 어떻게 올리는지 연결
③ 타겟팅 어프로치: 타겟을 세그먼트로 나누고(예: 1st party 구매·장바구니·상세 조회 / 유사·관심사 / 넓은 타겟 / 검색 의도별 키워드군) 세그먼트마다 역할·우선순위·예산 비중을 정함. 어떤 세그먼트로 시작해 어떤 조건이 되면 어디로 넓히는지(확장 순서), 무엇을 제외하는지(구매자·타 매체 리타겟 중복·저효율 지면), 신규 고객 비중을 어떻게 관리하는지
④ 운영 실행안: 캠페인·광고그룹 구조(세그먼트와 1:1로 맞출 것), 입찰 전략과 전환 시점, 학습에 필요한 주간 전환 수와 그에 맞춘 일 예산, 1주 차·2~4주 차·2개월 차에 각각 무엇을 하는지(누가·언제)
⑤ 타겟 × 소재 결합: 세그먼트마다 붙일 메시지·포맷·랜딩을 짝지은 매칭표(예: 상세 이탈 14일 → 사용 방법 15초 영상 → 상세 리뷰 영역). 같은 세그먼트 안에서 무엇을 A/B 하는지, 소재 피로도 기준과 교체 주기
⑥ 최근 1년 제품 변화 중 이 운영안에 실제로 쓰는 것만(날짜 포함)
⑦ 흔한 실수와 막는 방법 (학습 중 잦은 수정, 브랜드 키워드 잠식, 전환 중복 집계, 리타겟 과다 노출 등)
⑧ 증액·감액·중지·확장 기준: 세그먼트 단위 숫자 기준 (예: "유사 1% 세그먼트 7일 CPA가 목표 80% 이하면 3%로 확장, 예산 20% 증액")
⑨ 다른 대행사가 잘 안 하는, 이 브랜드만을 위한 타겟팅·운영 아이디어 1개
[매체 유형별 추가 장표 — 매체 장표 바로 다음에 layout "table"로 1장씩, mediaName 동일하게]
- 검색광고(네이버 파워링크·구글 검색): 키워드 그룹표. 검색 의도별 6~8개 그룹(브랜드 방어 / 속성 / 제품 유형 / 문제·용도 / 가격·비교 / 시즌 등), 그룹마다 예시 키워드 4~5개, 랜딩, v=목표 순위(구글은 일치 유형)·예산 비중. 공통 제외 키워드 행 포함. 경쟁사 상표 키워드 입찰 여부를 명시
- 쇼핑검색(네이버 쇼핑검색·ADVoost 쇼핑): 상품 성격별 그룹표. 상품군마다 그룹 1개, 그룹별 제외 키워드(성격이 다른 상품 검색·저의도·안전사고 검색)와 대표 검색어, v=예산 비중. 전 그룹 공통 제외 행과 "매주 검색어 리포트로 제외 키워드 보강" 운영 방식 명시
- 리타겟 매체(크리테오·GFA 리타겟·메타 리타겟·카카오 모먼트): 타겟팅 시나리오표 5~7개. 최근성(일수) × 행동 깊이(장바구니·상세·다회 조회) × 구매 후 주기(소진·크로스셀·시즌)로 쪼개고, 시나리오마다 메시지·랜딩, v=예산 비중·입찰 강도. 매체 간 기간·대상 분담과 빈도 상한 행 포함
- 업종 규제(심의, 금지 표현, 타겟·데이터 제한)는 매체별 제약과 대응까지.
- 확인한 사실은 source에 매체·문서명·날짜. 확인 못 한 기능·수치는 쓰지 말 것.
- 매체 장표는 매체당 1~2장, items는 KPI 목표(v에 수치) / 타겟팅 어프로치 / 운영 실행안(번호 3개) / 타겟 × 소재 결합 / 증감액 기준 / 일정·예산 순서. 매체 이름만 바꾸면 다른 브랜드에도 쓸 수 있는 문장은 다시 쓸 것.
- 매체 간 역할이 겹치면(예: 메타 리타겟과 크리테오, 네이버 쇼핑검색과 ADVoost) 누가 무엇을 맡는지와 중복 측정 방지책을 명시.`;
const MEDIA_LEVERS = `[매체별 KPI 레버 체크리스트 — 실무 기준, 최신 여부는 검색으로 재확인]
- 메타: 타겟은 넓게 두고 기존 고객·구매자 비중 상한으로 신규 확보, 1st party(상세·장바구니) 리타겟은 별도 캠페인 · 소재 다양성(컨셉이 다른 소재 묶음)이 타겟팅 역할 · 판매 캠페인은 넓은 타겟 + 기존 고객 비중 상한 · 광고세트 학습은 주 50전환 전후가 기준(미달 시 상위 이벤트나 예산 통합) · CAPI·이벤트 품질 점검 · 피로도는 빈도와 CTR 하락으로 판단
- 구글/유튜브: 검색은 브랜드·제품명 방어와 일반 키워드 분리 · PMax·Demand Gen은 피드 품질(제목·이미지·가격)과 전환 가치가 성과를 좌우 · 목표 ROAS는 실제 달성치 근처에서 시작해 단계적으로 조정 · 향상된 전환·오프라인 전환으로 신호 보강 · 유튜브는 조회 후 검색·전환 기여까지 평가
- 네이버: 키워드를 브랜드·제품명 / 문제 인식 / 비교·가격 / 선물 등 의도별로 묶어 그룹·입찰·랜딩을 따로 · 검색광고는 키워드 의도별 그룹·입찰, 쇼핑검색은 상품명·대표 이미지·리뷰 수가 CTR·CVR 좌우 · 브랜드검색으로 브랜드 키워드 방어 · GFA는 리타겟·유사 확장 · ADVoost 등 자동화 상품은 기존 캠페인과 잠식 여부 점검
- 카카오: 비즈보드는 도달·클릭 단가가 강점, 랜딩 전환율이 성패 · 모먼트 리타겟·카카오톡 채널 친구로 재접촉 · 메시지(알림톡·친구톡)는 첫 구매 후 리뷰·재구매 유도
- 크리테오: 상품 피드 기반 다이내믹 리타겟 · 메타·GFA 리타겟과 대상 중복과 기여 중복을 먼저 정리 · 장바구니·상세 이탈자 대상 · 빈도 상한과 최근성(일수) 기준으로 효율 관리
- 쿠팡: 자동 운영 → 목표 ROAS 기반 매출최적화로 전환하며 학습 기간 유지 · 대표 이미지·상품명·리뷰가 CVR 좌우 · 외부 측정 불가라 쿠팡 리포트와 판매 데이터 대조`;
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
${B.mediaDeep === false ? '' : MEDIA_RESEARCH + '\n' + MEDIA_LEVERS + '\n'}
${PLAYBOOK_RULES}
${eng}

${inputDump()}

[출력] 설명 없이 아래 스키마의 JSON 코드블록 하나만 출력해. (대시보드에 그대로 붙여넣음)
${JSON_SCHEMA.replace(/\n}$/, `,
 "mediaResearch":[{"media":"","role":"퍼널 위치·KPI","kpiTarget":"목표 ROAS·CPA·CVR·CTR 수치와 근거(역산·벤치마크 출처)","kpiTree":"KPI 분해와 가장 약한 고리·올릴 레버","targeting":"세그먼트별 역할·우선순위·예산 비중, 확장 순서와 조건, 제외 타겟","structure":"운영 실행안: 캠페인 구조(세그먼트와 1:1)·입찰·학습 조건·주차별 실행","signals":"1st party 시그널·전환 신호 보강","creative":"타겟 × 소재 결합 매칭표(세그먼트→메시지·포맷→랜딩)와 A/B 대상","latest":"최근 제품 변화와 활용","pitfalls":"자주 하는 실수와 방지책","kpi":"평가 지표·증감액 기준","idea":"이 브랜드만의 운영 아이디어","sources":["매체·문서명·날짜"]}]
}`)}`;
}

/* ---------- 심화 리서치 창: ① 브리프 → ② 프롬프트 → ③ 적용 ---------- */
const PROMPT_VER = '2026-11-18c'; // 기본 프롬프트 규칙이 바뀌면 올림 → 예전에 직접 고친 프롬프트는 자동으로 무효화
const briefKey = () => { const B = S.input.brief || {}; return JSON.stringify([PROMPT_VER, B.points, B.flow, B.reorder, B.mediaDeep, S.input.notes]); };
const currentPrompt = () => { const B = S.input.brief || {}; return B.customPrompt && B.customFor === briefKey() ? B.customPrompt : claudePromptAll(); };
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
      <div class="row mb8"><b style="flex:1">Claude 답변(JSON) 붙여넣기</b><span class="hint" style="margin:0">붙여넣는 즉시 적용되고 JSON 파일로 저장됩니다 · 앞뒤 설명 문장은 자동 무시</span></div>
      <textarea id="js" style="min-height:50vh;font-size:12px" placeholder='{"research":{...}, "priorities":[...], "sections":[...]}'></textarea>
      <label class="ck mt12" style="display:flex;gap:6px;align-items:center;margin-top:12px"><input type="checkbox" id="withSec" checked>섹션·장표 내용까지 적용 (기존 로직 대체)</label>
      <div class="row mt12" style="justify-content:space-between;margin-top:12px"><button class="btn" data-step="2">← 프롬프트</button><button class="btn pri" id="apply">적용</button></div>`}`;
    bind();
  };
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
    on('apply', () => { if (applyClaudeJSON($('#js', m).value, {withSec: $('#withSec', m)?.checked})) m.remove(); });
    const ta = $('#js', m); if (ta) ta.addEventListener('paste', () => setTimeout(() => { if (applyClaudeJSON(ta.value, {withSec: $('#withSec', m)?.checked, quiet: true})) m.remove(); }, 30));
    const ps = $('#preset', m); if (ps) ps.onchange = () => { keep(); B.preset = ps.value; const f = FLOW_PRESETS[ps.value]?.flow || []; if (ps.value === 'auto' || !B.flow.filter(x => x.trim()).length || confirm('현재 흐름을 프리셋으로 바꿀까요?')) B.flow = [...f]; draw(); };
    m.querySelectorAll('[data-fm]').forEach(b => b.onclick = () => { keep(); const i = +b.dataset.fm, j = i + +b.dataset.d; if (j < 0 || j >= B.flow.length) return; [B.flow[i], B.flow[j]] = [B.flow[j], B.flow[i]]; draw(); });
    m.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { keep(); B.flow.splice(+b.dataset.fx, 1); draw(); });
  };
  draw();
};


/* ---------- 인풋 단계 전용: 프롬프트 → Claude → JSON 붙여넣기(자동 적용·파일 저장) ---------- */
function jsonStats(j){ const secs = j.sections || []; return {sections: secs.length, pages: secs.reduce((a, x) => a + (x.pages || []).length + (x.divider ? 1 : 0), 0), media: (j.mediaResearch || []).length}; }
function jsonFileName(){ return `${(S.project.client || 'proposal').replace(/[\\/:*?"<>|\s]+/g, '_')}_리서치_${isoToday().replace(/-/g, '')}_${new Date().toTimeString().slice(0, 5).replace(':', '')}.json`; }
function saveJSONFile(j, name){ const blob = new Blob([JSON.stringify(j, null, 1)], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function applyClaudeJSON(text, o = {}){
  let j; try { j = parseJSON(text); } catch(e){ if (!o.quiet || String(text || '').trim().length > 20) toast('JSON을 읽지 못했습니다 — Claude 답변 전체를 다시 붙여넣어 주세요 (' + e.message + ')', 5000); return false; }
  if (!j || (!j.sections && !j.priorities && !j.research)){ toast('제안 로직 JSON이 아닙니다 — research·priorities·sections가 있는 답변을 붙여넣으세요', 5000); return false; }
  importClaude(j, o.withSec !== false);
  const st = jsonStats(j), name = o.name || jsonFileName();
  S.input.claudeJson = {name, at: Date.now(), ...st, data: j};
  if (S.input.jsonAutoSave !== false && !o.noFile) saveJSONFile(j, name);
  if (S.project.status === '준비') S.project.status = '작성중';
  save(); render();
  toast(`적용 완료 — 섹션 ${st.sections}개 · ${st.pages}장${st.media ? ` · 매체 ${st.media}개` : ''}${S.input.jsonAutoSave !== false && !o.noFile ? ' · JSON 파일 저장됨' : ''}. 로직 단계에 자동 반영됐습니다`, 4500);
  return true;
}
async function genJsonAPI(){
  const prompt = currentPrompt();
  busy('Claude API로 JSON 생성 중…', '내 프롬프트 그대로 · 웹 검색 포함 2~5분');
  try { const t = await callClaude({system: SYS_BASE, content: prompt, maxTokens: 32000, web: S.settings.web !== false}); applyClaudeJSON(t); }
  catch(e){ toast(e.message === 'NOKEY' ? '설정에서 API 키를 넣어주세요' : '생성 실패: ' + e.message, 5000); }
  unbusy();
}
function vClaudeCard(){
  const C = S.input.claudeJson, B = S.input.brief || {}, hasBrief = !!(B.points || (B.flow || []).some(f => f && f.trim()));
  return `<div class="card" id="cjCard"><h3><span class="n">D</span>Claude 심화 리서치 → 제안 로직 JSON <span style="flex:1"></span>${C ? `<span class="tag ok">적용됨 · ${esc(C.name)}</span>` : '<span class="tag warn">미적용</span>'}</h3>
    <p class="hint">프롬프트와 JSON 적용은 여기서만 합니다. 붙여넣는 즉시 우선순위·로직·섹션·장표가 채워지고 로직 단계에 그대로 반영됩니다.</p>
    <div class="grid2" style="align-items:stretch">
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="cjstep"><b>① 브리프·프롬프트</b><span class="ks">${hasBrief ? '브리프 작성됨' : '브리프 미작성 — RFP 핵심 포인트와 제안 흐름을 먼저 적으면 결과가 훨씬 날카로워집니다'}${B.customPrompt && B.customFor === briefKey() ? ' · 직접 수정한 프롬프트 사용 중' : ''}</span>
          <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm" data-act="claudeAll">브리프 작성·프롬프트 편집</button></div></div>
        <div class="cjstep"><b>② 프롬프트 복사 → Claude에 붙여넣기</b><span class="ks">Claude가 웹 검색·상세페이지 확인 후 JSON 코드블록으로 답합니다</span>
          <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm pri" data-act="cjCopy">프롬프트 복사 (${currentPrompt().length.toLocaleString()}자)</button><a class="btn sm" href="https://claude.ai/new" target="_blank" rel="noopener">Claude 열기 ↗</a>${apiKey() ? '<button class="btn sm dark" data-act="cjApi">API로 바로 생성</button>' : ''}</div></div>
        ${C ? `<div class="cjstep" style="background:var(--okbg,#ECFDF3)"><b>적용된 JSON</b><span class="ks">${new Date(C.at).toLocaleString('ko-KR', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})} · 섹션 ${C.sections}개 · ${C.pages}장${C.media ? ` · 매체 리서치 ${C.media}개` : ''}</span>
          <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm" data-act="cjDown">JSON 파일 받기</button><button class="btn sm" data-act="cjReapply">다시 적용</button><button class="btn sm" data-act="tab" data-v="logic">로직 단계에서 보기 →</button></div></div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="row"><b style="flex:1">③ Claude 답변 붙여넣기 — 붙여넣는 즉시 적용·저장</b><button class="btn sm" data-act="cjClip">클립보드에서 가져오기</button></div>
        <textarea id="cjPaste" style="flex:1;min-height:170px;font-size:12px" placeholder="Claude 답변을 그대로 붙여넣으세요 (Ctrl+V). 앞뒤 설명 문장·코드블록 표시는 자동으로 무시합니다."></textarea>
        <div class="row" style="gap:12px;flex-wrap:wrap"><label class="ck" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-bind="input.jsonAutoSave" ${S.input.jsonAutoSave !== false ? 'checked' : ''}>적용할 때 JSON 파일로 자동 저장</label><span class="sp"></span><label class="btn sm ghost" style="cursor:pointer">.json 파일 불러오기<input type="file" accept=".json,application/json" id="cjFile" style="display:none"></label><button class="btn sm pri" data-act="cjApply">적용</button></div>
      </div>
    </div></div>`;
}
Object.assign(ACT, {
  cjCopy: async () => { const v = currentPrompt(); try { await navigator.clipboard.writeText(v); } catch(e){ const t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } toast('프롬프트 복사됨 — Claude에 붙여넣고, 답변을 ③에 붙여넣으세요'); },
  cjApply: () => applyClaudeJSON($('#cjPaste')?.value || ''),
  cjClip: async () => { try { const t = await navigator.clipboard.readText(); if (!t.trim()) return toast('클립보드가 비어 있습니다'); applyClaudeJSON(t); } catch(e){ toast('브라우저가 클립보드 읽기를 막았습니다 — 칸에 직접 붙여넣어 주세요', 4000); $('#cjPaste')?.focus(); } },
  cjApi: () => genJsonAPI(),
  cjDown: () => { const C = S.input.claudeJson; if (C?.data) saveJSONFile(C.data, C.name); },
  cjReapply: () => { const C = S.input.claudeJson; if (C?.data && confirm('저장된 JSON으로 우선순위·로직·섹션을 다시 채울까요? (로직 단계에서 고친 내용은 덮어씁니다)')) applyClaudeJSON(JSON.stringify(C.data), {name: C.name, noFile: true}); }
});
document.addEventListener('paste', e => { if (e.target && e.target.id === 'cjPaste') setTimeout(() => applyClaudeJSON(e.target.value, {quiet: true}), 30); });
document.addEventListener('change', e => { if (e.target && e.target.id === 'cjFile'){ const f = e.target.files[0]; if (f) f.text().then(t => applyClaudeJSON(t, {name: f.name, noFile: true})); e.target.value = ''; } });
document.addEventListener('change', e => { if (e.target && e.target.id === 'addBlank' && e.target.value){ const k = e.target.value; e.target.value = ''; ACT.addExtra({dataset: {k}}); } });
