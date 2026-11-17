/* =========================================================
   Proposal Studio v2 — app (views · AI/Claude 연동 · events)
   ========================================================= */
function newSection(kind, title, goal = '', pages = 3, divider = true, role){ return {id: uid(), kind, role: role || (kind === 'strategy' ? 'custom' : kind), title, en: '', goal, pages, divider, include: true, collapsed: false, pageList: []}; }
function newPage(type = 'explain', o = {}){ const p = {id: uid(), type, layout: type === 'strategy' ? 'cards' : 'list', title: '', subtitle: '', keyMsg: '', items: [{h: '', d: '', v: ''}], image: null, washed: false, notes: '', tag: '', source: '', cols: null, ...o}; delete p.prio; p.id = uid(); if (typeof deAIPage === 'function') deAIPage(p); p.type = PAGE_TYPES[p.type] ? p.type : type; if (!LAYOUTS[p.layout] && !String(p.layout).startsWith('tpl:')) p.layout = 'list'; p.items = (p.items || []).map(i => ({h: i.h || '', d: i.d || '', v: i.v || ''})); return p; }

/* ---------- AI (선택: API 키) ---------- */
async function callClaude({system, content, maxTokens = 8000, web = false}){
  const key = apiKey(); if (!key) throw new Error('NOKEY');
  const body = {model: S.settings.model, max_tokens: maxTokens, system, messages: [{role: 'user', content}]};
  if (web) body.tools = [{type: 'web_search_20250305', name: 'web_search', max_uses: 8}];
  const r = await fetch('https://api.anthropic.com/v1/messages', {method: 'POST', headers: {'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'}, body: JSON.stringify(body)});
  if (!r.ok){ const t = await r.text(); if (web && r.status === 400 && /tool|web_search/i.test(t)) return callClaude({system, content, maxTokens, web: false}); let m = t; try { m = JSON.parse(t).error.message; } catch(e){} throw new Error(`API ${r.status}: ${m}`); }
  const j = await r.json(); return j.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}
function parseJSON(t){
  t = String(t).replace(/```(?:json)?/g, '');
  const a = Math.min(...['{', '['].map(c => { const i = t.indexOf(c); return i < 0 ? 1e9 : i; }));
  const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a >= 1e9 || b < 0) throw new Error('JSON을 찾지 못했습니다');
  return JSON.parse(t.slice(a, b + 1));
}
const cut = (s, n) => (s || '').length > n ? s.slice(0, n) + '\n…(이하 생략)' : (s || '');

/* ---------- 프롬프트 공통 규칙 (레퍼런스 플레이북) ---------- */
const PLAYBOOK_RULES = `[작성 규칙 — 반드시 따를 것]
0. 참고용으로 받은 다른 제안서가 있더라도 흐름·장표 구성만 참고하고, 그 문장·카피·수치·사례·캠페인명은 절대 재사용하지 말 것. 모든 문장은 이번 광고주에 맞게 새로 쓸 것.
1. 흐름: 현황 진단(시장·경쟁·고객·매체) → 과제 3개 → 3트랙 전략(DISCOVER 처음 알게 하기 / DECIDE 비교에서 선택받기 / RETURN 다시 오게 하기) → 퍼널별 매체 역할 → 매체별 실행안 → 예산 3안(효율 우선/균형/성장 우선) → 단계별 크리에이티브와 테스트 방식 → 최종 지표·관리 지표·측정 환경 → 보고 체계 → 대응 기준·1/3/6개월 로드맵·착수 준비 → 사례 → 이슈 대응 → 비용.
2. 장표 타이틀은 주장이 담긴 한 문장, subtitle은 근거나 방법 한 문장.
3. 매체별 실행안 장표는 layout "spec" — items: 대상 / 소재 / 랜딩 / 운영 방법(번호 3개) / 평가 지표 / 일정·예산. keyMsg=매체 역할 한 줄, tag="DISCOVER · 확장 트랙" 형식.
4. 숫자는 source에 출처(기관·매체명, 날짜)를 쓰고, 추정치는 "(가정)"·"(추정)" 표기. 회사 실적·인력명·단가처럼 모르는 사실은 지어내지 말고 "[입력 필요]".
5. 실행 주체·시점(누가/언제/어떻게)을 항상 명시. "무조건 성과 상승" 같은 단정 금지 — 전제 조건·리스크 병기.
6. 문체: 장표 본문은 개조식(~확보, ~운영, ~점검)으로 짧게. 한 항목 d는 40자 안팎, 여러 줄이면 줄바꿈으로 2~3줄. "혁신적인", "극대화", "시너지", "다양한", "효과적인", "~를 통해 ~를 실현" 같은 상투어와 말줄임표·이모지·em dash(—) 금지. 업계 실무자가 쓰는 구체 명사(매체명·지표·기간·금액)로 쓸 것.
7. 매체별 실행안은 매체마다 layout을 spec / mediaFlow / mediaQuad로 번갈아 써서 같은 모양이 연속되지 않게 할 것.
8. 밀도: strategy/explain 장표는 items 4~6개, 각 d는 줄바꿈 2~3줄(한 줄 25~40자). 한 줄짜리 빈약한 장표 금지. 각 장표에 이 브랜드 고유 정보(제품명·가격대·리뷰 표현·경쟁사명·판매 채널·시즌·RFP 문구) 최소 1개 포함. 다른 브랜드에 그대로 붙여도 말이 되는 문장은 다시 쓸 것.
9. 전략가 관점: 장표마다 "관찰(데이터·리서치 사실) → 의미(그래서 무엇이 문제인가) → 실행(누가·언제·무엇을)"이 보이게. 브랜드 진단에는 고객 행동 인사이트 3개와 구매 여정별 공백 장표를 반드시 포함.
10. 마무리 금지 표현: "~할 것입니다", "~하겠습니다", "기대됩니다", "성공적인 파트너", "함께 성장", "극대화", "시너지", "혁신", "최적의 솔루션", "다양한". keyMsg는 숫자·조건·근거가 들어간 판단 문장으로.
11. 크리에이티브 섹션: 이미지·영상을 넣을 장표로 구성. crHero(대표 비주얼+컨셉: 첫 항목 h=컨셉 문장, 이후 항목 h=라벨/d=내용), crShorts(숏폼 3컷: 항목 h=훅 유형, v=길이·비율, d=장면·자막), crGrid(소재 라인업 4종: h=트랙·소재명, v=매체·규격, d=메시지), crStory(스토리보드 4~6장면: h=장면, v=시간, d=화면·자막), crAB(A/B안 2개: h=안 이름, d=메시지·차이, v=확인 지표, keyMsg=가설), crFeed(피드 목업 2개: h=CTA, v=규격, d=본문 카피) 중 4개 이상 사용.
[layout 카탈로그 — items 필드 의미]
cards(병렬 2~4: h 제목, d 설명, v 수치) · process(단계 3~6: h 단계명, d 내용, v 산출물) · kpi(2~4: h 지표, v 수치, d 설명) · hero(첫 항목 v 큰 숫자 + 나머지 근거) · split(keyMsg 핵심 주장 + 근거 3~5) · spec(매체 실행안: h 라벨, d 내용) · table(5행 이상 비교: h 구분, d 내용, v 수치) · compare(h 항목, v AS-IS, d TO-BE) · funnel(h 단계, d 매체·역할, v 지표) · timeline(h 시점, d 실행, v 산출물) · chart(h 항목, v "35%", d 설명) · matrix(4칸: h, d, v 라벨) · grid(6칸) · list(기타)
추가 레이아웃: crHero · crShorts · crGrid · crStory · crAB · crFeed(위 11번 참조) · mediaFlow(매체: 대상→소재→랜딩→평가 흐름 + 운영 방법) · mediaQuad(매체: 4분면 + 운영 방법) · summary(현황→제안 요약표: h 항목, v 현황, d 제안) · statBars(막대+핵심 수치: h 항목, v 수치%, d 설명) · colCards(컬럼 카드: h 제목, d 줄바꿈 불릿 2~4줄) · stepCards(단계 박스: h 단계, d 줄바꿈 불릿)
page type: divider(간지) · bridge(논리 전환 한 문장, keyMsg가 크게 노출) · strategy(전략·실행) · explain(근거·설명)`;
const SYS_BASE = `너는 한국 디지털 퍼포먼스 마케팅 대행사의 10년차 제안 전략가다. 경쟁 PT에서 이겨야 하는 제안자 입장에서 판단한다.\n${PLAYBOOK_RULES}\n모든 출력은 한국어, 요청한 JSON만 출력한다.`;

function inputDump(maxRfp = 60000){
  const I = S.input;
  return `[프로젝트] ${S.project.name || '-'} / 광고주: ${S.project.client || '-'} / 제안사: ${S.project.proposer} / 마감: ${S.project.due || '-'}
[RFP 원문]
${cut(I.rfp.map(f => `■ ${f.name}\n${f.text}`).join('\n\n'), maxRfp) || '(없음)'}
[판매 채널 URL]
${I.urls.filter(u => u.url).map(u => `- ${u.type}: ${u.url}`).join('\n') || '(없음)'}
[주요 제품] ${I.product || '-'}
[경쟁사] ${I.competitors || '-'}
[현재 매체 비중·성과] ${I.currentMix || '-'}
[브랜드 자료]
${cut(I.brand.filter(f => f.text).map(f => `■ ${f.name}\n${f.text}`).join('\n\n'), 20000) || '(없음)'}
[제안자 주요사항]
${I.notes || '-'}`;
}
const JSON_SCHEMA = `{
 "research":{"marketHead":"시장 흐름 한 문장","market":[{"fact":"사실(20자 내)","value":"수치","note":"해석","source":"출처·날짜"}],"competitors":[{"name":"","price":"가격대","position":"포지션·특징"}],"compSource":"","channels":[{"channel":"판매처명","url":"","findings":["상세페이지에서 확인한 사실(가격·혜택·리뷰수·USP·메시지 문제점)"]}],"usp":[{"h":"","d":""}],"voice":["리뷰·커뮤니티 고객 언어"],"voiceHead":""},
 "rfpSummary":{"client":"","background":"","objective":"","kpi":"","budget":"","period":"","target":"","scope":"","evaluation":"","deadline":"","constraints":[""]},
 "priorities":[{"rank":1,"title":"제안 우선순위(제안자 판단, RFP 문장 복사 금지)","why":"왜 승부처인가","evidence":"근거 요약","angle":"제안서에서 풀 방식","weight":"상|중|하"}],
 "colors":[{"hex":"#RRGGBB","role":"Main","name":"","reason":""},{"hex":"#RRGGBB","role":"Sub","name":"","reason":""},{"hex":"#RRGGBB","role":"Accent","name":"","reason":""}],
 "colorConcept":"",
 "brandInsights":[""],
 "logic":{"concept":"제안 컨셉(캐치프레이즈)","message":"핵심 메시지","storyline":[{"title":"","point":""}]},
 "sections":[{"role":"company|team|brand|playbook|media|budget|creative|kpi|report|optimize|tech|case|issue|pricing|custom","title":"","en":"영문 섹션명","goal":"","divider":true,"pages":[{"type":"bridge|strategy|explain","layout":"","title":"","subtitle":"","keyMsg":"","tag":"","items":[{"h":"","d":"","v":""}],"source":"","notes":"발표자 노트"}]}]
}`;
function claudePromptAll(){
  const A = S.input.analysis, eng = A?.engine ? `\n[내장 엔진 초안 — 더 날카롭게 개선할 것]\n우선순위: ${(A.priorities || []).map(p => p.title).join(' / ')}\n매체 믹스: ${(A.mix || []).map(m => `${m.name} ${m.pct}%`).join(', ')}\n섹션: ${(A.sections || []).map(s => s.title).join(' / ')}` : '';
  return `너는 퍼포먼스 마케팅 대행사의 제안 전략가야. 아래 RFP와 인풋으로 실제 제출할 제안서의 로직과 장표 내용을 작성해줘.

[해야 할 일]
1) 웹 검색으로 최신 시장 데이터를 찾아(카테고리 온라인 거래 추이, 검색량 추이, 경쟁사 가격·광고 동향, 업계 트렌드) 출처·날짜와 함께 research에 정리.
2) 판매 채널 URL을 각각 직접 열어 상세페이지를 확인 — 가격, 혜택, 리뷰 수·평점, USP, 상세 메시지의 약점을 research.channels에 사실로 기록. 열 수 없으면 "확인 불가"라고 적을 것.
3) RFP를 제안자 입장에서 판단해 priorities를 작성 — RFP 문장을 그대로 옮기지 말고 "어디서 이겨야 하는지"를 판단.
4) RFP에 제안서 목차가 지정되어 있으면 sections 순서·제목을 그대로 따르고, 없으면 플레이북 흐름으로 구성. 각 섹션의 pages를 실제 장표 내용으로 채울 것(섹션당 2~8장, 매체별 액션 페이지는 매체당 1장).
5) 예산이 있으면 매체별 비중과 월 금액을 계산, 시나리오 3안 제시.

${PLAYBOOK_RULES}
${eng}

${inputDump()}

[출력] 설명 없이 아래 스키마의 JSON 코드블록 하나만 출력해. (대시보드에 그대로 붙여넣음)
${JSON_SCHEMA}`;
}
function claudePromptSection(sec){
  return `너는 퍼포먼스 마케팅 대행사의 제안 전략가야. 제안서의 "${sec.title}" 섹션 장표를 실제 제출 수준으로 고도화해줘. 필요하면 웹 검색으로 최신 데이터를 찾아 출처와 함께 반영해.

${PLAYBOOK_RULES}

[제안 맥락]
${ctxText()}

[섹션] 역할: ${ROLES[sec.role] || sec.role} / 목표: ${sec.goal} / 희망 페이지: ${sec.pages}장(간지 ${sec.divider ? '포함' : '없음'})
[현재 초안]
${JSON.stringify(sec.pageList.map(p => ({type: p.type, layout: p.layout, title: p.title, subtitle: p.subtitle, keyMsg: p.keyMsg, tag: p.tag, items: itemsOf(p)})))}

[출력] 설명 없이 JSON 코드블록 하나만: {"pages":[{"type":"","layout":"","title":"","subtitle":"","keyMsg":"","tag":"","items":[{"h":"","d":"","v":""}],"source":"","notes":""}]}`;
}
function ctxText(){
  const A = S.input.analysis || {}, I = S.input;
  return `광고주: ${S.project.client} / 제품: ${I.product} / 채널: ${I.urls.filter(u => u.url).map(u => u.type).join(', ')}
RFP 요약: ${JSON.stringify(A.rfpSummary || {})}
우선순위: ${(A.priorities || []).map(p => `${p.rank}. ${p.title} — ${p.angle || ''}`).join(' | ')}
로직: ${A.logic?.concept || ''} / ${A.logic?.message || ''} / ${(A.logic?.storyline || []).map(s => s.title + ':' + s.point).join(' → ')}
인사이트: ${(A.brandInsights || []).join(' | ')}
리서치: ${A.research ? cut(JSON.stringify(A.research), 4000) : '-'}
제안자 메모: ${cut(I.notes, 1500)}`;
}
function openClaudeBridge(sec){
  const prompt = sec ? claudePromptSection(sec) : claudePromptAll();
  const m = modal(sec ? `Claude로 "${esc(sec.title)}" 고도화` : 'Claude 심화 리서치 & 제안 로직 (API 키 불필요)', `
    <div class="note info mb12">① 아래 프롬프트를 복사 → ② Claude 앱(이 프로젝트 채팅)에 붙여넣기 — Claude가 웹 검색·판매처 상세페이지 확인 후 JSON을 답합니다 → ③ 답변의 JSON을 아래 칸에 붙여넣고 [적용]</div>
    <div class="grid2">
      <div><div class="row mb8"><b style="flex:1">① 프롬프트 (${prompt.length.toLocaleString()}자)</b><button class="btn sm pri" id="cpy">복사</button><a class="btn sm" href="https://claude.ai/new" target="_blank" rel="noopener">Claude 열기 ↗</a></div><textarea readonly id="pr" style="min-height:52vh;font-size:11.5px">${esc(prompt)}</textarea></div>
      <div><div class="row mb8"><b style="flex:1">③ Claude 답변(JSON) 붙여넣기</b></div><textarea id="js" style="min-height:44vh;font-size:11.5px" placeholder='{"research":{...}, "priorities":[...], "sections":[...]}'></textarea>
        ${sec ? '' : `<label class="ck mt12" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="withSec" checked>섹션·장표 내용까지 적용 (기존 로직 대체)</label>`}
        <div class="row mt12"><button class="btn pri" id="apply">적용</button><span class="hint" style="margin:0">답변 앞뒤의 설명 문장은 자동으로 무시됩니다</span></div></div>
    </div>`);
  $('#cpy', m).onclick = async () => { try { await navigator.clipboard.writeText(prompt); toast('프롬프트 복사됨 — Claude에 붙여넣으세요'); } catch(e){ $('#pr', m).select(); document.execCommand('copy'); toast('복사됨'); } };
  $('#apply', m).onclick = () => {
    try {
      const j = parseJSON($('#js', m).value);
      if (sec){ const pages = (j.pages || j.sections?.[0]?.pages || []); if (!pages.length) throw new Error('pages 배열이 없습니다'); sec.pageList = pages.map(p => newPage(p.type, p)); sec.pages = sec.pageList.length; }
      else importClaude(j, $('#withSec', m)?.checked);
      m.remove(); save(); render(); toast('Claude 결과를 적용했습니다');
    } catch(e){ toast('적용 실패: ' + e.message, 4500); }
  };
}
function importClaude(j, withSec){
  const base = S.input.analysis || strategistAnalysis();
  const merged = {...base, ...Object.fromEntries(Object.entries(j).filter(([k, v]) => v != null && k !== 'sections'))};
  merged.engine = false; merged.claude = true;
  applyAnalysis(merged);
  if (j.sections?.length){
    S.input.analysis.sections = j.sections.map(s => ({role: s.role || 'custom', title: s.title, en: s.en || '', goal: s.goal || '', pages: (s.pages || []).length + (s.divider ? 1 : 0), divider: !!s.divider}));
    if (withSec){
      S.sections = j.sections.map(s => { const role = ROLES[s.role] && s.role !== 'custom' ? s.role : inferRole(s.title + ' ' + (s.goal || '')); const sec = newSection(kindOfRole(role), s.title, s.goal || '', 1, !!s.divider, role); sec.en = s.en || ''; const pages = (s.pages || []).map(p => newPage(p.type, p)); if (sec.divider) pages.unshift(newPage('divider', {title: s.title, subtitle: s.goal || '', items: []})); sec.pageList = pages; sec.pages = pages.length; return sec; });
    }
  }
}

/* ---------- 1) 인풋 분석 ---------- */
async function analyze(mode){
  const I = S.input;
  if (!I.rfp.length && !I.notes && !I.brand.length && !I.product){ toast('RFP 또는 제품·주요사항을 먼저 입력하세요'); return; }
  if (mode === 'api'){ await analyzeAPI(); return; }
  busy('전략가 분석 중…', 'RFP 신호 추출 → 우선순위 판단 → 로직·섹션 설계');
  await new Promise(r => setTimeout(r, 60));
  try {
    const res = strategistAnalysis();
    const imgs = I.brand.filter(f => f.image).map(f => f.image);
    const cols = imgs.length ? await extractColors(imgs) : [];
    const ind = signals().ind;
    const src = cols.length >= 2 ? cols : ind.colors;
    res.colors = src.slice(0, 3).map((h, i) => ({hex: h, role: ['Main', 'Sub', 'Accent'][i], name: '', reason: cols.length >= 2 ? '브랜드 이미지에서 추출' : `${ind.name} 업종 기본 팔레트 — 브랜드 컬러로 교체 권장`}));
    res.colorConcept = cols.length >= 2 ? '브랜드 이미지 대표색 기반' : `${ind.name} 업종 톤 (브랜드 로고·상세 이미지를 올리면 자동 추출)`;
    const keep = I.analysis?.research; applyAnalysis(res); if (keep) S.input.analysis.research = keep;
    toast('분석 완료 — 우선순위·로직을 확인하고 [로직 단계]로 이동하세요');
  } catch(e){ console.error(e); toast('분석 오류: ' + e.message, 5000); }
  unbusy(); save(); render();
}
async function analyzeAPI(){
  busy('Claude API로 분석 중…', '웹 검색 포함 1~3분');
  try {
    const content = [];
    S.input.rfp.filter(f => f.scanned && RAW[f.id]).slice(0, 2).forEach(f => content.push({type: 'document', source: {type: 'base64', media_type: 'application/pdf', data: RAW[f.id]}, title: f.name}));
    S.input.brand.filter(f => f.image).slice(0, 6).forEach(f => content.push({type: 'image', source: {type: 'base64', media_type: f.image.split(';')[0].slice(5), data: f.image.split(',')[1]}}));
    content.push({type: 'text', text: claudePromptAll()});
    const j = parseJSON(await callClaude({system: SYS_BASE, content, maxTokens: 32000, web: S.settings.web}));
    importClaude(j, true); toast('API 분석 완료');
  } catch(e){ toast(e.message === 'NOKEY' ? '[설정]에서 API 키를 입력하세요' : '분석 실패: ' + e.message, 5000); }
  unbusy(); save(); render();
}
function applyAnalysis(res){
  res.priorities = (res.priorities || []).map((p, i) => ({rank: i + 1, title: '', why: '', evidence: '', angle: '', weight: '중', ...p, rank: i + 1}));
  if (Array.isArray(res.colors) && res.colors.length) S.input.colors = res.colors.slice(0, 3).map((c, i) => ({hex: validHex(c.hex) ? c.hex.toUpperCase() : S.input.colors[i]?.hex || '#333333', role: c.role || ['Main', 'Sub', 'Accent'][i], name: c.name || '', reason: c.reason || ''}));
  if (res.colorConcept) S.input.colorConcept = res.colorConcept;
  res.logic = res.logic || {concept: '', message: '', storyline: []};
  res.logic.storyline = res.logic.storyline || [];
  res.brandInsights = res.brandInsights || [];
  S.input.analysis = res;
  if (S.project.status === '준비') S.project.status = '작성중';
}

/* ---------- 2) 로직 ---------- */
function createSkeleton(){
  const A = S.input.analysis || strategistAnalysis();
  if (!S.input.analysis) applyAnalysis(A);
  const plan = (A.sections && A.sections.length) ? A.sections : planSections(signals());
  S.sections = plan.map(s => { const role = ROLES[s.role] && s.role !== 'custom' ? s.role : inferRole(s.title + ' ' + (s.goal || '')); const sec = newSection(kindOfRole(role), s.title, s.goal || '', Math.max(1, +s.pages || 3), s.divider ?? (+s.pages >= 3), role); sec.en = s.en || ROLE_DEF[role]?.[1] || ''; return sec; });
}
async function genSection(si, quiet){
  const sec = S.sections[si]; if (!sec) return;
  if (apiKey() && S.settings.apiGen){
    if (!quiet) busy(`"${sec.title}" 작성 중… (API)`);
    try { const j = parseJSON(await callClaude({system: SYS_BASE, maxTokens: 8000, content: claudePromptSection(sec)})); sec.pageList = (j.pages || []).map(p => newPage(p.type, p)); }
    catch(e){ toast(`API 실패 → 내장 엔진으로 작성: ${e.message}`, 4000); sec.pageList = generateEngine(sec); }
    if (!quiet){ unbusy(); save(); render(); }
    return;
  }
  try { sec.pageList = generateEngine(sec); }
  catch(e){ console.error(e); toast(`"${sec.title}" 작성 중 오류: ${e.message}`, 5000); return; }
  if (!quiet){ save(); render(); toast(`"${sec.title}" ${sec.pageList.length}장 작성 완료`); }
}
async function genAll(){
  if (!S.sections.length){ toast('먼저 [로직 작성]으로 섹션을 만드세요'); return; }
  if (S.sections.some(s => s.pageList.length) && !confirm('이미 작성된 섹션도 다시 작성됩니다. 계속할까요?')) return;
  const idx = S.sections.map((s, i) => i).filter(i => S.sections[i].include !== false);
  busy('전체 섹션 작성 중…', `0 / ${idx.length}`); let d = 0;
  try { await pool(idx, apiKey() && S.settings.apiGen ? 3 : 1, async i => { await genSection(i, true); busy('전체 섹션 작성 중…', `${++d} / ${idx.length}`); }); }
  catch(e){ console.error(e); toast('작성 중 오류: ' + e.message, 5000); }
  unbusy(); save(); render();
  const n = S.sections.reduce((a, s) => a + s.pageList.length, 0); toast(n ? `전체 섹션 작성 완료 — 총 ${n}장` : '작성된 장표가 없습니다 — 인풋을 확인하세요', 3500);
}

/* ---------- 3) 디자인 워싱 ---------- */
function washPage(p, prev){
  if (p.fixed) return prev;
  if (!p.washed) p.draft = clone({...p, draft: undefined});
  if (p.type === 'strategy' || p.type === 'explain'){
    const c = layoutCandidates(p);
    const deliberate = p.layout !== 'list';
    const keepCur = deliberate || (c.includes(p.layout) && p.layout !== 'list' && p.layout !== prev);
    if (!keepCur) p.layout = c.find(l => l !== prev && l !== 'list') || c[0];
  }
  p.washed = true;
  return p.layout;
}
function washSections(idxs){
  const secs = idxs.map(i => S.sections[i]).filter(s => s && s.pageList.length);
  if (!secs.length){ toast('워싱할 페이지가 없습니다 — 로직 단계에서 내용을 먼저 작성하세요'); return; }
  const tpls = S.design.useRef ? (S.refLayouts || []).filter(t => t.use && t.tag === 'body') : []; let ti = 0;
  secs.forEach(sec => { let prev = ''; sec.pageList.forEach(p => {
    if (!p.fixed && tpls.length && (p.type === 'strategy' || p.type === 'explain') && !MEDIA_LAYOUTS.includes(p.layout)){
      const n = itemsOf(p).length, fit = tpls.filter(t => t.mode === 'frame' || (t.cnt.h >= n && t.cnt.h <= n + 2) || (t.cnt.d >= n && t.cnt.d <= n + 2));
      if (fit.length){ if (!p.washed) p.draft = clone({...p, draft: undefined}); if (!p.tplBody && !String(p.layout).startsWith('tpl:')) p.tplBody = p.layout; p.layout = 'tpl:' + fit[ti++ % fit.length].id; p.washed = true; prev = p.layout; return; }
    }
    prev = (p.type === 'strategy' || p.type === 'explain') ? washPage(p, prev) : (washPage(p, prev), prev); }); });
  save(); render(); toast('디자인 워싱 완료 — 컬러칩·레이아웃 변주·Pretendard 위계 적용');
}
function shuffleLayout(p){ if (String(p.layout).startsWith('tpl:')) p.layout = p.tplBody || 'list'; const c = layoutCandidates(p).concat(['cards', 'colCards', 'split', 'list', 'table', 'grid', 'summary', 'stepCards']).filter((v, i, a) => a.indexOf(v) === i && v !== 'image'); const i = c.indexOf(p.layout); p.layout = c[(i + 1) % c.length]; if (!p.washed){ p.draft = clone({...p, draft: undefined}); p.washed = true; } }
function unwash(p){ if (p.draft){ const d = p.draft; Object.assign(p, d); p.draft = null; } p.washed = false; }

/* ---------- 4) 점검 ---------- */
function allFields(){
  const out = [];
  S.sections.forEach((s, si) => s.pageList.forEach((p, pi) => {
    const ref = `${si}.${pi}`, lb = `${s.title} · p${pi + 1}`;
    ['title', 'subtitle', 'keyMsg'].forEach(f => p[f] && out.push({ref, label: lb, field: f, text: p[f]}));
    p.items.forEach((it, ii) => ['h', 'd', 'v'].forEach(f => it[f] && out.push({ref, label: lb, field: `items.${ii}.${f}`, text: it[f]})));
  }));
  return out;
}
const TYPO_RULES = [[/되요/g, '돼요'], [/됬/g, '됐'], [/몇일/g, '며칠'], [/금새/g, '금세'], [/왠만/g, '웬만'], [/역활/g, '역할'], [/할께/g, '할게'], [/않되/g, '안 되'], [/희안/g, '희한'], [/어떻해/g, '어떻게 해'], [/내노라/g, '내로라'], [/오랫만/g, '오랜만'], [/일일히/g, '일일이'], [/곰곰히/g, '곰곰이'], [/깨끗히/g, '깨끗이'], [/설겆이/g, '설거지'], [/  +/g, ' '], [/\.\.(?!\.)/g, '.'], [/ ,/g, ','], [/(\S{2,}) \1(?=\s|$)/g, '$1'], [/컨텐츠/g, '콘텐츠'], [/메세지/g, '메시지'], [/리타게팅/g, '리타겟팅'], [/타게팅/g, '타겟팅'], [/어플리케이션/g, '애플리케이션']];
async function typoCheck(){
  const F = allFields(); if (!F.length){ toast('점검할 내용이 없습니다'); return; }
  let issues = [];
  F.forEach(f => TYPO_RULES.forEach(([re, to]) => { const m = f.text.match(re); if (m) m.forEach(b => { const a = b.replace(new RegExp(re.source), to); if (a !== b && !issues.some(x => x.ref === f.ref && x.field === f.field && x.before === b)) issues.push({...f, before: b, after: a, reason: '맞춤법·표기 통일'}); }); }));
  const terms = {}; F.forEach(f => (f.text.match(/[A-Za-z]{3,}/g) || []).forEach(w => { const k = w.toLowerCase(); (terms[k] = terms[k] || new Set()).add(w); }));
  Object.values(terms).filter(s => s.size > 1).forEach(s => { const arr = [...s], main = arr[0]; F.forEach(f => arr.slice(1).forEach(v => { if (new RegExp(`\\b${v}\\b`).test(f.text)) issues.push({...f, before: v, after: main, reason: `영문 표기 통일 (${arr.join(' / ')})`}); })); });
  if (apiKey()){
    busy('AI 교정 중…');
    try { const list = F.map((f, i) => ({i, t: f.text})); const res = parseJSON(await callClaude({system: '한국어 교정 전문가. 맞춤법·띄어쓰기·오탈자·용어 불일치만. JSON만.', maxTokens: 6000, content: `점검해. {"issues":[{"i":번호,"before":"원문 부분 문자열","after":"","reason":""}]}\n${JSON.stringify(list)}`})); (res.issues || []).forEach(x => { if (F[x.i] && F[x.i].text.includes(x.before) && x.before !== x.after) issues.push({...F[x.i], before: x.before, after: x.after, reason: x.reason}); }); } catch(e){}
    unbusy();
  }
  S.checks.typos = issues.map(x => ({...x, id: uid()}));
  save(); render(); toast(`점검 완료 — ${issues.length}건`);
}
function applyTypo(x){ const [si, pi] = x.ref.split('.').map(Number), p = S.sections[si]?.pageList[pi]; if (!p) return; const cur = getPath(p, x.field); if (typeof cur === 'string') setPath(p, x.field, cur.replace(x.before, x.after)); S.checks.typos = S.checks.typos.filter(t => t.id !== x.id); }
function fitCheck(){
  const A = S.input.analysis; if (!A?.priorities?.length){ toast('인풋 단계에서 우선순위를 먼저 도출하세요'); return; }
  const pages = []; S.sections.forEach((s, si) => s.include !== false && s.pageList.forEach((p, pi) => pages.push({id: `${si}.${pi}`, sec: s.title, text: [p.title, p.subtitle, p.keyMsg, ...itemsOf(p).map(i => `${i.h} ${i.d} ${i.v}`)].join(' ')})));
  if (!pages.length){ toast('점검할 페이지가 없습니다'); return; }
  const stop = /^(으로|에서|하고|하는|있는|합니다|위한|대한|제안|전략|운영|관리|기반|통해|확인|그리고|먼저)$/;
  const tok = s => [...new Set((s || '').replace(/[^\w가-힣%\s]/g, ' ').split(/\s+/).map(w => w.replace(/(을|를|이|가|은|는|의|로|와|과|에|도)$/, '')).filter(w => w.length >= 2 && !stop.test(w)))];
  const items = A.priorities.map(p => {
    const ks = tok(p.title + ' ' + (p.angle || ''));
    const scored = pages.map(pg => ({pg, n: ks.filter(k => pg.text.includes(k)).length})).filter(x => x.n >= Math.min(2, ks.length)).sort((a, b) => b.n - a.n);
    const cov = Math.min(100, Math.round((scored.length ? 40 : 0) + Math.min(60, scored.length * 12)));
    const gap = !scored.length ? '이 우선순위를 직접 다루는 장표가 없습니다' : scored.length < 3 ? '언급은 있으나 근거·실행 장표가 부족합니다' : '';
    const sug = !scored.length ? `"${p.title}"을 타이틀로 한 장표를 핵심 전략/관련 섹션에 추가 — ${p.angle || ''}` : scored.length < 3 ? `근거 데이터(출처 포함)와 실행 일정 장표 보강` : '';
    return {rank: p.rank, title: p.title, coverage: cov, pages: scored.slice(0, 5).map(x => x.pg.id), gap, suggestion: sug};
  });
  const req = ['예산', 'KPI', '일정', '리포트', '소재', '조직'].filter(k => !pages.some(p => p.text.includes(k)));
  S.checks.fit = {overall: `우선순위 ${items.length}개 중 ${items.filter(i => i.coverage >= 70).length}개가 충분히 반영되었습니다. ${items.some(i => i.coverage < 40) ? '반영이 약한 항목부터 보강하세요.' : '전반적으로 우선순위 흐름이 유지됩니다.'}`, score: Math.round(items.reduce((a, b) => a + b.coverage, 0) / items.length), items, missing: req.map(k => `${k} 관련 장표`)};
  save(); render();
}

/* =========================================================
   RENDER
   ========================================================= */
function renderSteps(){
  $('#steps').innerHTML = STEPS.map(([k, n], i) => `<button class="${S.step === k ? 'on' : ''}" data-act="tab" data-v="${k}"><b>${i === 0 ? '☰' : i}</b><span>${n}</span></button>`).join('');
  $('#keydot').className = 'keydot' + (apiKey() ? ' on' : '');
  $('#curp').textContent = S.step === 'manage' ? '' : (S.project.client || S.project.name || '새 제안');
}
function render(){
  const y = scrollY; renderSteps();
  $('#app').innerHTML = ({manage: vManage, input: vInput, logic: vLogic, wash: vWash, check: vCheck})[S.step || 'input']();
  scrollTo(0, y);
}
const inp = (path, ph = '', type = 'text', extra = '') => `<input type="${type}" data-bind="${path}" value="${esc(getPath(S, path))}" placeholder="${esc(ph)}" ${extra}>`;
const ta = (path, ph = '', rows = 3) => `<textarea data-bind="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(getPath(S, path))}</textarea>`;

/* ---------- 관리 탭 ---------- */
function stageOf(p){ const pages = p.sections.reduce((a, s) => a + s.pageList.length, 0), washed = p.sections.reduce((a, s) => a + s.pageList.filter(x => x.washed).length, 0); return {pages, st: [!!p.input.analysis, pages > 0, pages > 0 && washed === pages, !!p.merge.done]}; }
function dday(d){ if (!d) return ''; const t = Math.round((new Date(d) - new Date(isoToday())) / 864e5); return t === 0 ? 'D-DAY' : t > 0 ? `D-${t}` : `D+${-t}`; }
let MF = {q: '', st: '', sort: 'due'};
function vManage(){
  const L = LIST.filter(p => p.id !== LIB_ID).filter(p => (!MF.st || p.project.status === MF.st) && (!MF.q || `${p.project.client} ${p.project.name} ${p.project.owner}`.toLowerCase().includes(MF.q.toLowerCase())));
  L.sort((a, b) => MF.sort === 'due' ? ((a.project.due || '9999') > (b.project.due || '9999') ? 1 : -1) : b.updated - a.updated);
  const PL = LIST.filter(p => p.id !== LIB_ID);
  const act = PL.filter(p => ['준비', '작성중', '검토'].includes(p.project.status)).length, soon = PL.filter(p => { const d = dday(p.project.due); return d && /D-[0-7]$|D-DAY/.test(d) && !['제출', '수주', '실주'].includes(p.project.status); }).length;
  const won = PL.filter(p => p.project.status === '수주').length, lost = PL.filter(p => p.project.status === '실주').length;
  return `<h2 class="pt">제안 관리</h2><p class="pd">모든 제안서를 한곳에서 보고, 언제든 열어서 수정합니다. 데이터는 이 브라우저(IndexedDB)에 저장되며 [내보내기]로 백업·공유할 수 있습니다.</p>
  <div class="grid4 mb12">${[['전체 제안', PL.length, ''], ['진행 중', act, '준비·작성중·검토'], ['마감 임박', soon, '7일 이내'], ['수주율', won + lost ? Math.round(won / (won + lost) * 100) + '%' : '-', `수주 ${won} · 실주 ${lost}`]].map(k => `<div class="card kpi"><div class="kl">${k[0]}</div><div class="kv">${k[1]}</div><div class="ks">${k[2]}</div></div>`).join('')}</div>
  <div class="card"><div class="toolbar"><button class="btn pri" data-act="newProject">＋ 새 제안</button><button class="btn" data-act="importProject">가져오기(JSON)</button><span class="sp"></span>
    <input type="text" id="mq" placeholder="광고주·제안명·담당 검색" value="${esc(MF.q)}" style="width:220px">
    <select id="mst" style="width:120px"><option value="">전체 상태</option>${STATUS.map(s => `<option ${MF.st === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <select id="msort" style="width:120px"><option value="due" ${MF.sort === 'due' ? 'selected' : ''}>마감일순</option><option value="upd" ${MF.sort === 'upd' ? 'selected' : ''}>최근 수정순</option></select></div>
  ${L.length ? `<div style="overflow:auto"><table class="list mg"><tr><th style="width:96px">상태</th><th>광고주 · 제안명</th><th style="width:150px">제출 마감</th><th style="width:130px">PT일</th><th style="width:110px">담당</th><th style="width:150px">진행</th><th style="width:150px">메모</th><th style="width:96px">수정일</th><th style="width:210px"></th></tr>
  ${L.map(p => { const g = stageOf(p), cur = p.id === S.id, pid = `data-pid="${p.id}"`; return `<tr class="${cur ? 'cur' : ''}">
    <td><select data-pf="status" ${pid} class="st st-${STATUS.indexOf(p.project.status)}">${STATUS.map(s => `<option ${p.project.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    <td><a href="#" data-act="openP" ${pid} class="pn"><b>${esc(p.project.client || '(광고주 미입력)')}</b><span>${esc(p.project.name || '제안명 미입력')}</span></a></td>
    <td><input type="date" data-pf="due" ${pid} value="${esc(p.project.due)}"><span class="dd">${dday(p.project.due)}</span></td>
    <td><input type="date" data-pf="pt" ${pid} value="${esc(p.project.pt)}"></td>
    <td><input type="text" data-pf="owner" ${pid} value="${esc(p.project.owner)}" placeholder="담당자"></td>
    <td><div class="dots">${['인풋', '로직', '워싱', '취합'].map((n, i) => `<i class="${g.st[i] ? 'on' : ''}" title="${n}"></i>`).join('')}</div><span class="ks">${g.pages}p</span></td>
    <td><input type="text" data-pf="memo" ${pid} value="${esc(p.project.memo)}" placeholder="메모"></td>
    <td class="ks">${new Date(p.updated).toLocaleDateString('ko-KR', {month: '2-digit', day: '2-digit'})}</td>
    <td style="white-space:nowrap"><button class="btn sm pri" data-act="openP" ${pid}>열기</button> <button class="btn sm" data-act="openP" data-step="check" ${pid}>미리보기</button> <button class="btn sm ghost" data-act="dupP" ${pid}>복제</button> <button class="btn sm ghost" data-act="expP" ${pid}>내보내기</button> <button class="btn sm ghost bad" data-act="delP" ${pid}>삭제</button></td></tr>`; }).join('')}</table></div>` : `<div class="empty"><b>제안서가 없습니다</b>[＋ 새 제안]으로 시작하세요.</div>`}</div>${vLibraryCard()}`;
}

/* ---------- 인풋 ---------- */
function fileList(kind){
  return `<div class="files">${S.input[kind].map((f, i) => `<div class="file">${f.image ? `<img src="${f.image}">` : '<span class="tag">' + esc(f.name.split('.').pop().toUpperCase()) + '</span>'}<span class="nm">${esc(f.name)}</span><span class="meta">${f.image ? '이미지' : `${(f.text || '').length.toLocaleString()}자${f.pages ? ` · ${f.pages}p` : ''}`}</span>${f.scanned ? '<span class="tag warn" title="텍스트가 거의 없는 PDF">스캔본</span>' : ''}${f.image ? '' : `<button class="btn sm" data-act="viewFile" data-k="${kind}" data-i="${i}">텍스트 확인</button>`}<button class="btn sm ghost bad" data-act="delFile" data-k="${kind}" data-i="${i}">삭제</button></div>`).join('')}</div>`;
}
function vInput(){
  const I = S.input, A = I.analysis;
  return `
  <h2 class="pt">1. 인풋 — RFP·브랜드 자료를 넣으면 전략가 엔진이 우선순위와 로직을 판단합니다</h2>
  <p class="pd">API 키 없이 즉시 분석합니다. 웹 검색·판매처 상세페이지 확인이 필요하면 <b>Claude 심화 리서치</b>로 Claude 앱에서 이어서 진행하세요.</p>
  <div class="card"><h3>프로젝트 정보</h3>
    <div class="grid3" style="grid-template-columns:2fr 1.2fr 1.2fr 1fr 1fr 1fr">
      <div><label class="f">제안서 타이틀</label>${inp('project.name', '예) 2027 디지털 광고 운영 제안')}</div>
      <div><label class="f">광고주 / 브랜드</label>${inp('project.client', '예) 브랜드명')}</div>
      <div><label class="f">제안사</label>${inp('project.proposer')}</div>
      <div><label class="f">제출 마감</label>${inp('project.due', '', 'date')}</div>
      <div><label class="f">PT일</label>${inp('project.pt', '', 'date')}</div>
      <div><label class="f">담당</label>${inp('project.owner', '담당자')}</div>
    </div></div>
  <div class="grid2">
    <div class="card"><h3><span class="n">A</span>RFP 업로드</h3><p class="hint">PDF · PPTX · DOCX · TXT (여러 개 가능)</p>
      <div class="drop" data-drop="rfp"><b>RFP 파일을 끌어놓거나 클릭</b>PDF / PPT(X) / WORD(DOCX)<input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md" data-file="rfp"></div>${fileList('rfp')}</div>
    <div class="card"><h3><span class="n">B</span>판매 채널 URL</h3><p class="hint">자사몰·네이버 스토어·쿠팡 등 복수 입력 — Claude 심화 리서치에서 상세페이지를 직접 확인합니다</p>
      ${I.urls.map((u, i) => `<div class="row mb8"><select data-bind="input.urls.${i}.type" style="width:170px">${URL_TYPES.map(t => `<option ${u.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>${inp(`input.urls.${i}.url`, 'https://', 'url')}<button class="btn sm ghost bad" data-act="delUrl" data-i="${i}">✕</button></div>`).join('')}
      <button class="btn sm" data-act="addUrl">+ 채널 추가</button>
      <div class="grid2 mt12"><div><label class="f">주요 제품 / 서비스</label>${inp('input.product', '예) 대표 제품명, 가격대')}</div><div><label class="f">경쟁사</label>${inp('input.competitors', '예) 경쟁 브랜드 A, B')}</div></div>
      <div class="mt12"><label class="f">현재 매체 비중·성과 (있으면)</label>${inp('input.currentMix', '예) 브랜드검색 30%, 메타 40%, 구글 20% ...')}</div></div>
  </div>
  <div class="grid2">
    <div class="card"><h3><span class="n">C</span>브랜드 자료</h3><p class="hint">브랜드북·소개서·성과 리포트(문서), 로고·제품·상세 이미지(컬러칩 자동 추출)</p>
      <div class="drop" data-drop="brand"><b>브랜드 자료를 끌어놓거나 클릭</b>PDF / PPTX / DOCX / TXT / PNG·JPG<input type="file" multiple accept=".pdf,.pptx,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp" data-file="brand"></div>${fileList('brand')}</div>
    <div class="card"><h3><span class="n">D</span>주요사항 (제안자 메모)</h3><p class="hint">OT 내용, 광고주 페인포인트, 경쟁 PT 정보, 우리 강점, 꼭 넣을 메시지</p>
      ${ta('input.notes', '예) OT: 작년 대행사는 리포트만 많고 액션이 없었다는 불만 / 경쟁 3사 PT / 신제품 3월 런칭', 9)}</div>
  </div>
  <div class="cta"><button class="btn pri big" data-act="claudeAll">✦ Claude 심화 리서치 — 웹 검색·상세페이지 기반 우선순위·로직·섹션</button>${apiKey() ? '<button class="btn big" data-act="analyzeApi">API로 바로 분석</button>' : ''}</div>
  <div style="text-align:center;margin:-10px 0 18px"><button class="btn sm ghost" data-act="analyze">Claude 없이 즉시 초안 만들기 (내장 엔진)</button></div>
  ${vColors()}
  ${vRefLayouts()}
  ${vMediaMix()}
  ${A ? vAnalysis() : ''}`;
}
function vColors(){
  const I = S.input;
  return `<div class="card"><h3><span class="n">E</span>메인 컬러칩 (최대 3개) · PPT 맨 앞 컬러 가이드 자동 생성</h3><p class="hint">브랜드 이미지를 올리면 대표색을 추출하고, 없으면 업종 팔레트를 제안합니다. 칩을 클릭해 변경하세요.</p>
    <div class="row" style="align-items:flex-start;gap:18px;flex-wrap:wrap">
      <div class="chips" style="flex:1;min-width:420px">${I.colors.map((c, i) => `<div class="chip"><div class="sw" style="background:${validHex(c.hex) ? c.hex : '#333'}"><input type="color" value="${validHex(c.hex) ? c.hex : '#333333'}" data-bind="input.colors.${i}.hex"></div><div class="bd"><div class="row mb8"><input type="text" data-bind="input.colors.${i}.hex" value="${esc(c.hex)}" style="font-weight:700;width:96px"><input type="text" data-bind="input.colors.${i}.role" value="${esc(c.role)}" style="width:80px"><button class="btn sm ghost bad" data-act="delColor" data-i="${i}" ${I.colors.length < 2 ? 'disabled' : ''}>✕</button></div>${inp(`input.colors.${i}.name`, '컬러명')}<textarea data-bind="input.colors.${i}.reason" rows="2" placeholder="선정 근거 / 사용처" style="margin-top:6px;min-height:44px;font-size:12px">${esc(c.reason)}</textarea></div></div>`).join('')}
      ${I.colors.length < 3 ? `<button class="btn" data-act="addColor" style="height:80px">+ 컬러 추가</button>` : ''}</div>
      <div><div class="thumb" data-act="previewSpecial" data-k="guide">${thumbHTML({kind: 'guide'}, 340)}</div><div class="row mt12" style="justify-content:flex-end"><button class="btn sm" data-act="guidePPT">가이드 PPT</button><button class="btn sm" data-act="guidePDF">가이드 PDF</button></div></div>
    </div>
    <div class="mt12"><label class="f">컬러 컨셉</label>${inp('input.colorConcept', '예) 신뢰감 있는 네이비 + 제품 포인트 컬러')}</div></div>`;
}
function vAnalysis(){
  const A = S.input.analysis, R0 = A.rfpSummary || {}, RS = A.research;
  const KV = [['client', '광고주'], ['background', '배경'], ['objective', '목표'], ['kpi', 'KPI'], ['budget', '예산'], ['period', '기간'], ['target', '타겟'], ['scope', '과업 범위'], ['evaluation', '평가 기준'], ['deadline', '일정']];
  return `
  <div class="note ${A.claude ? 'info' : ''} mb12">${A.claude ? '✦ Claude 리서치 결과가 반영된 분석입니다.' : '내장 전략가 엔진 분석입니다 — 시장 수치·상세페이지 사실은 <b>Claude 심화 리서치</b>로 보강하면 진단 장표가 실제 데이터로 채워집니다.'}</div>
  <div class="card"><h3><span class="n">F</span>제안 우선순위 — 제안자 관점 판단</h3><p class="hint">RFP 문장을 옮긴 것이 아니라 "어디서 이겨야 하는지"를 판단한 결과입니다. 로직·섹션·최종 점검의 기준이 됩니다.</p>
    <div class="prio h"><div>#</div><div>우선순위</div><div>왜 승부처인가</div><div>제안서에서 풀 방식</div><div>가중치</div><div></div></div>
    ${(A.priorities || []).map((p, i) => `<div class="prio"><div class="rk">${i + 1}</div><div><input type="text" data-bind="input.analysis.priorities.${i}.title" value="${esc(p.title)}" style="font-weight:700;margin-bottom:4px"><div class="ev">${esc(p.evidence || '')}</div></div><textarea data-bind="input.analysis.priorities.${i}.why">${esc(p.why)}</textarea><textarea data-bind="input.analysis.priorities.${i}.angle">${esc(p.angle)}</textarea><select data-bind="input.analysis.priorities.${i}.weight">${['상', '중', '하'].map(w => `<option ${p.weight === w ? 'selected' : ''}>${w}</option>`).join('')}</select><div class="row" style="gap:2px"><button class="btn sm ghost" data-act="prioMv" data-i="${i}" data-d="-1">▲</button><button class="btn sm ghost" data-act="prioMv" data-i="${i}" data-d="1">▼</button><button class="btn sm ghost bad" data-act="prioDel" data-i="${i}">✕</button></div></div>`).join('')}
    <button class="btn sm mt12" data-act="prioAdd">+ 우선순위 추가</button></div>
  <div class="card"><h3><span class="n">G</span>제안 로직</h3>
    <div class="grid2 mb12"><div><label class="f">제안 컨셉</label>${inp('input.analysis.logic.concept')}</div><div><label class="f">핵심 메시지</label>${inp('input.analysis.logic.message')}</div></div>
    <label class="f">스토리라인</label>
    ${A.logic.storyline.map((s, i) => `<div class="story"><div class="ix">${i + 1}</div>${inp(`input.analysis.logic.storyline.${i}.title`, '단계')}<textarea data-bind="input.analysis.logic.storyline.${i}.point" rows="1">${esc(s.point)}</textarea><button class="btn sm ghost bad" data-act="storyDel" data-i="${i}">✕</button></div>`).join('')}
    <button class="btn sm" data-act="storyAdd">+ 단계 추가</button>
    <div class="note info mt12">매체 구성과 예산은 위 <b>미디어믹스</b> 항목에서 조정합니다.</div>
    <div class="cta mt12"><button class="btn dark big" data-act="goLogic">로직 단계로 → 섹션 구성</button></div></div>
  <div class="grid2">
    <div class="card"><h3><span class="n">H</span>RFP 핵심 요약</h3>
      <table class="kv">${KV.map(([k, n]) => `<tr><th>${n}</th><td><textarea data-bind="input.analysis.rfpSummary.${k}" rows="1">${esc(R0[k] || '')}</textarea></td></tr>`).join('')}</table>
      ${(A.questions || []).length ? `<div class="note info mt12"><b>광고주 확인 필요</b><br>${A.questions.map(q => '• ' + esc(q)).join('<br>')}</div>` : ''}</div>
    <div class="card"><h3><span class="n">I</span>브랜드·시장 인사이트</h3>
      ${(A.brandInsights || []).map((b, i) => `<div class="row mb8"><textarea data-bind="input.analysis.brandInsights.${i}" rows="2">${esc(b)}</textarea><button class="btn sm ghost bad" data-act="delIns" data-i="${i}">✕</button></div>`).join('')}
      <button class="btn sm" data-act="addIns">+ 인사이트 추가</button>
      ${RS ? `<div class="mt12"><label class="f">Claude 리서치 데이터</label><div class="rs">${(RS.market || []).map(m => `<div>📊 ${esc(m.fact)} <b>${esc(m.value || '')}</b> <span class="ks">${esc(m.source || '')}</span></div>`).join('')}${(RS.channels || []).map(c => `<div>🛒 <b>${esc(c.channel)}</b> — ${esc((c.findings || []).join(' / '))}</div>`).join('')}${(RS.competitors || []).map(c => `<div>⚔ <b>${esc(c.name)}</b> ${esc(c.price || '')} · ${esc(c.position || '')}</div>`).join('')}</div></div>` : ''}</div>
  </div>`;
}

/* ---------- 로직 ---------- */
function vLogic(){
  const A = S.input.analysis, total = includedSecs().reduce((a, s) => a + (s.pageList.length || +s.pages || 0), 0);
  const head = `<h2 class="pt">2. 로직 — 섹션별로 실제 장표 내용까지 작성합니다</h2><p class="pd">[로직 작성] → 섹션별 희망 페이지 수 조정 → [전체 자동 작성] → 타이틀·내용 수정/삭제/추가 · 페이지 유형(간지/브릿지/전략/설명)·레이아웃 지정</p>`;
  if (!S.sections.length) return head + `<div class="card empty"><b>아직 섹션이 없습니다</b>${A ? (A.sections?.length ? `분석에서 설계한 ${A.sections.length}개 섹션으로 구성합니다${signals().toc ? ' (RFP 지정 목차를 따름)' : ''}.` : '') : '인풋 분석 없이도 기본 퍼포먼스 제안 구조로 시작할 수 있어요.'}<div class="cta mt12"><button class="btn pri big" data-act="buildLogic">▶ 로직 작성</button></div></div>`;
  let h = head + `<div class="toolbar card" style="padding:12px 16px"><button class="btn" data-act="buildLogic">↻ 로직 재작성</button><button class="btn pri" data-act="genAll">✦ 전체 섹션 자동 작성</button><button class="btn dark" data-act="claudeAll">Claude로 전체 고도화</button><span class="sp"></span><span class="tag pri">포함 ${includedSecs().length}섹션 · 약 ${total}p</span><button class="btn sm" data-act="addExtra" data-k="company">+ 회사소개</button><button class="btn sm" data-act="addExtra" data-k="brand">+ 브랜드 스터디</button><button class="btn sm" data-act="addExtra" data-k="case">+ 케이스 스터디</button></div>`;
  if (S.isLibrary) h += `<div class="note mb12"><b>기본 장표 라이브러리 편집 중</b> — 여기서 만든 장표가 모든 제안서의 회사 소개·조직·보고 체계·기술·사례·이슈 대응 섹션에 기본값으로 들어갑니다. [✦ 자동 작성]으로 틀을 만든 뒤 회사 자료로 채우세요.</div>`;
  else h += `<div class="row mb12" style="gap:12px"><label class="ck" style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-bind="useLibrary" ${S.useLibrary !== false ? 'checked' : ''}>고정 섹션은 <b>기본 장표 라이브러리</b> 사용</label><button class="btn sm ghost" data-act="openLib">라이브러리 편집</button></div>`;
  if (A?.logic?.concept) h += `<div class="note info mb12"><b>컨셉</b> ${esc(A.logic.concept)} &nbsp;·&nbsp; <b>메시지</b> ${esc(A.logic.message || '')}</div>`;
  h += `<div class="ins"><button class="btn sm" data-act="insSec" data-at="0">+ 섹션 추가</button></div>`;
  S.sections.forEach((sec, si) => { h += vSection(sec, si) + `<div class="ins"><button class="btn sm" data-act="insSec" data-at="${si + 1}">+ 섹션 추가</button></div>`; });
  return h;
}
function vSection(sec, si){
  const sn = secNoOf(sec), extra = sec.kind !== 'strategy', b = `data-s="${si}"`;
  return `<div class="sec ${extra ? 'extra' : ''}">
    <div class="sec-h"><span class="no">${sn ? two(sn) : '—'}</span><span class="kind ${sec.kind}">${KINDS[sec.kind]}${extra ? ' · 별도 공간' : ''}</span>
      <input class="tt" type="text" data-bind="sections.${si}.title" value="${esc(sec.title)}">
      <select data-bind="sections.${si}.role" title="엔진이 쓸 섹션 유형" style="width:150px">${Object.entries(ROLES).map(([k, n]) => `<option value="${k}" ${sec.role === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label class="ck">희망 <input class="pc" type="number" min="1" max="40" data-bind="sections.${si}.pages" value="${sec.pages}">p</label>
      <label class="ck"><input type="checkbox" data-bind="sections.${si}.divider" ${sec.divider ? 'checked' : ''}>간지</label>
      <label class="ck"><input type="checkbox" data-bind="sections.${si}.include" ${sec.include !== false ? 'checked' : ''}>포함</label>
      <button class="btn sm pri" data-act="genSec" ${b}>${sec.pageList.length ? '↻ 재작성' : '✦ 자동 작성'}</button>
      <button class="btn sm" data-act="claudeSec" ${b} title="Claude 앱으로 이 섹션 고도화">Claude↗</button>
      <button class="btn sm" data-act="secPPT" ${b} ${sec.pageList.length ? '' : 'disabled'}>PPT</button><button class="btn sm" data-act="secPDF" ${b} ${sec.pageList.length ? '' : 'disabled'}>PDF</button>
      <button class="btn sm ghost" data-act="secMv" ${b} data-d="-1">▲</button><button class="btn sm ghost" data-act="secMv" ${b} data-d="1">▼</button>
      <button class="btn sm ghost" data-act="secFold" ${b}>${sec.collapsed ? '펼치기' : '접기'}</button><button class="btn sm ghost bad" data-act="secDel" ${b}>삭제</button></div>
    <div class="sec-g"><input type="text" data-bind="sections.${si}.goal" value="${esc(sec.goal)}" placeholder="섹션 목표 / 증명할 논지"></div>
    ${sec.collapsed ? `<div class="pages"><div class="gallery">${sec.pageList.map((p, pi) => `<div data-act="preview" ${b} data-p="${pi}" style="cursor:zoom-in">${thumbHTML(pageItem(sec, p, pi + 1), 170)}</div>`).join('')}</div></div>` :
    `<div class="pages">${sec.pageList.length ? sec.pageList.map((p, pi) => vPage(sec, si, p, pi)).join('') : `<div class="empty" style="padding:20px">희망 페이지 수를 정하고 <b style="display:inline;font-size:14px">✦ 자동 작성</b>을 누르세요 — 실제 장표 내용이 채워집니다</div>`}
      <div class="row" style="justify-content:center"><button class="btn sm" data-act="addPage" ${b} data-t="explain">+ 페이지</button><button class="btn sm" data-act="addPage" ${b} data-t="divider">+ 간지</button><button class="btn sm" data-act="addPage" ${b} data-t="bridge">+ 브릿지</button></div></div>`}
  </div>`;
}
function vPage(sec, si, p, pi){
  if (p.fixed) return vFixedPage(sec, si, p, pi);
  const base = `sections.${si}.pageList.${pi}`, b = `data-s="${si}" data-p="${pi}"`, content = p.type === 'strategy' || p.type === 'explain';
  const hint = LAYOUT_HINT[p.layout] || LAYOUT_HINT.default;
  return `<div class="pg"><div class="thumb" data-act="preview" ${b} data-thumb="${si}.${pi}">${thumbHTML(pageItem(sec, p, pi + 1), 340)}</div>
    <div class="pf">
      <div class="row" style="flex-wrap:wrap"><span class="tag">p${pi + 1}</span>
        <select data-bind="${base}.type">${Object.entries(PAGE_TYPES).map(([k, n]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        ${content ? layoutSelect(base, p) : ''}
        ${p.washed ? '<span class="tag ok">워싱</span>' : '<span class="tag">초안</span>'}
        <span style="flex:1"></span>
        <button class="btn sm" data-act="pagePPT" ${b}>PPT</button><button class="btn sm" data-act="pagePDF" ${b}>PDF</button>
        <button class="btn sm ghost" data-act="pageMv" ${b} data-d="-1">▲</button><button class="btn sm ghost" data-act="pageMv" ${b} data-d="1">▼</button>
        <button class="btn sm ghost" data-act="pageDup" ${b}>복제</button><button class="btn sm ghost bad" data-act="pageDel" ${b}>삭제</button></div>
      <input type="text" data-bind="${base}.title" value="${esc(p.title)}" placeholder="메인 타이틀 (주장이 담긴 한 문장)" style="font-weight:700">
      <input type="text" data-bind="${base}.subtitle" value="${esc(p.subtitle)}" placeholder="서브 타이틀 (근거·방법)">
      ${p.type !== 'divider' ? `<div class="row"><input type="text" data-bind="${base}.keyMsg" value="${esc(p.keyMsg)}" placeholder="${p.type === 'bridge' ? '브릿지 핵심 문장 (크게 노출)' : '키 메시지 (하단 강조 바 / 좌측 패널)'}" style="flex:3">${content ? `<input type="text" data-bind="${base}.source" value="${esc(p.source)}" placeholder="출처" style="flex:1">` : ''}</div>` : ''}
      <div class="items"><div class="it ih"><div></div><div>${hint[0]}</div><div>${hint[1]}</div><div>${hint[2]}</div><div></div></div>${p.items.map((it, ii) => `<div class="it"><div class="ix">${ii + 1}</div><input type="text" data-bind="${base}.items.${ii}.h" value="${esc(it.h)}" placeholder="${hint[0]}"><input type="text" data-bind="${base}.items.${ii}.v" value="${esc(it.v)}" placeholder="${hint[1] || '-'}"><textarea data-bind="${base}.items.${ii}.d" rows="${Math.min(5, Math.max(1, (it.d || '').split('\n').length))}" placeholder="${hint[2]}">${esc(it.d)}</textarea><button class="btn sm ghost bad" data-act="itemDel" ${b} data-i="${ii}">✕</button></div>`).join('')}</div>
      <div class="row" style="flex-wrap:wrap"><button class="btn sm" data-act="itemAdd" ${b}>+ 항목</button>${content && !CR_LAYOUTS.includes(p.layout) ? imgControls(base, si, pi, p) : ''}<span style="flex:1"></span></div>${CR_LAYOUTS.includes(p.layout) ? crControls(si, pi, p) : ''}
      <details><summary style="font-size:12px;color:var(--sub);cursor:pointer">발표자 노트</summary><textarea data-bind="${base}.notes" rows="2">${esc(p.notes)}</textarea></details>
    </div></div>`;
}

/* ---------- 워싱 ---------- */
function vWash(){
  const pages = S.sections.reduce((a, s) => a + s.pageList.length, 0), washed = S.sections.reduce((a, s) => a + s.pageList.filter(p => p.washed).length, 0);
  let h = `<h2 class="pt">3. 디자인 워싱 — 초안을 제안서 디자인으로 디벨롭합니다</h2><p class="pd">내용 구조에 맞는 레이아웃 자동 선택(15종) · 연속 장표 레이아웃 변주 · 인풋 컬러칩 · Pretendard 위계(타이틀 Bold / 서브·본문 Light) · 표준 간격</p>`;
  if (!pages) return h + `<div class="card empty"><b>워싱할 페이지가 없습니다</b>로직 단계에서 내용을 먼저 작성하세요.<div class="cta mt12"><button class="btn" data-act="tab" data-v="logic">로직 단계로</button></div></div>`;
  h += `<div class="toolbar card" style="padding:12px 16px"><button class="btn pri" data-act="washAll">✦ 전체 디자인 워싱</button><button class="btn" data-act="unwashAll">초안으로 되돌리기</button>
    <label class="ck" style="display:flex;gap:6px;align-items:center;margin-left:8px">테마 <select data-bind="design.theme" style="width:160px">${Object.entries(THEMES).map(([k, n]) => `<option value="${k}" ${S.design.theme === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    ${S.design.theme === 'madup' ? `<label class="ck" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-bind="design.brandColor" ${S.design.brandColor ? 'checked' : ''}>브랜드 컬러칩 적용</label>` : ''}
    ${(S.refLayouts || []).some(t => t.use && t.tag === 'body') ? `<label class="ck" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-bind="design.useRef" ${S.design.useRef ? 'checked' : ''}>희망 레이아웃 적용</label>` : ''}
    <span class="sp"></span><span style="display:flex;gap:4px;align-items:center">${S.input.colors.map(c => `<span title="${esc(c.role)} ${esc(c.hex)}" style="width:22px;height:22px;border-radius:6px;background:${c.hex};box-shadow:0 0 0 1px var(--line)"></span>`).join('')}</span>
    <span class="tag ${washed === pages ? 'ok' : 'warn'}">워싱 ${washed} / ${pages}p</span><button class="btn sm" data-act="tab" data-v="input">컬러칩 수정</button></div>`;
  S.sections.forEach((sec, si) => {
    if (!sec.pageList.length) return;
    h += `<div class="card"><h3><span class="kind ${sec.kind}">${KINDS[sec.kind]}</span>${esc(sec.title)} <span style="flex:1"></span><button class="btn sm pri" data-act="washSec" data-s="${si}">이 섹션 워싱</button><button class="btn sm" data-act="secPPT" data-s="${si}">PPT</button><button class="btn sm" data-act="secPDF" data-s="${si}">PDF</button></h3>
      <div class="gallery">${sec.pageList.map((p, pi) => `<div class="gi"><div data-act="preview" data-s="${si}" data-p="${pi}" style="cursor:zoom-in">${thumbHTML(pageItem(sec, p, pi + 1), 290)}</div><div class="lb"><span>p${pi + 1} · ${PAGE_TYPES[p.type]}${p.type === 'strategy' || p.type === 'explain' ? ' · ' + LAYOUTS[p.layout] : ''}</span><span class="row" style="gap:4px">${p.type === 'strategy' || p.type === 'explain' ? `<button class="btn sm ghost" data-act="shuffle" data-s="${si}" data-p="${pi}" title="다른 레이아웃">⟳ 레이아웃</button>` : ''}${p.washed ? `<button class="btn sm ghost" data-act="unwashPage" data-s="${si}" data-p="${pi}">되돌리기</button>` : '<span class="tag">초안</span>'}</span></div></div>`).join('')}</div></div>`;
  });
  return h;
}

/* ---------- 점검·취합 ---------- */
function vCheck(){
  const T0 = S.checks.typos, F0 = S.checks.fit, m = S.merge;
  return `<h2 class="pt">4. 점검 및 취합 — 최종본을 만듭니다</h2><p class="pd">오탈자 · 우선순위 부합도를 점검한 뒤 섹션을 한 번에 취합해 PPT/PDF 최종본을 추출합니다.</p>
  <div class="grid2">
    <div class="card"><h3><span class="n">1</span>오탈자 점검 <span style="flex:1"></span><button class="btn sm pri" data-act="typo">점검 실행</button>${T0?.length ? '<button class="btn sm" data-act="typoAll">모두 적용</button>' : ''}</h3>
      ${T0 == null ? '<p class="hint" style="margin:0">맞춤법·띄어쓰기·외래어 표기(콘텐츠·메시지·타겟팅)·영문 표기 불일치를 찾습니다.</p>' : !T0.length ? '<div class="note info">발견된 오탈자가 없습니다 ✓</div>' :
      `<div style="max-height:420px;overflow:auto"><table class="list"><tr><th>위치</th><th>수정</th><th></th></tr>${T0.map(x => `<tr><td style="font-size:12px;color:var(--sub);width:30%">${esc(x.label)}<br><span class="tag">${esc(x.field)}</span></td><td><del>${esc(x.before)}</del> → <ins>${esc(x.after)}</ins><div style="font-size:11px;color:var(--mute)">${esc(x.reason || '')}</div></td><td style="white-space:nowrap"><button class="btn sm" data-act="typoOne" data-id="${x.id}">적용</button><button class="btn sm ghost" data-act="typoSkip" data-id="${x.id}">무시</button></td></tr>`).join('')}</table></div>`}</div>
    <div class="card"><h3><span class="n">2</span>우선순위 부합 점검 <span style="flex:1"></span><button class="btn sm pri" data-act="fit">점검 실행</button></h3>
      ${F0 == null ? '<p class="hint" style="margin:0">인풋에서 확정한 우선순위가 장표에 반영됐는지 점검하고 보강안을 제시합니다.</p>' :
      `<div class="row mb12"><div style="font-size:30px;font-weight:800;color:var(--pri)">${F0.score ?? '-'}</div><div style="font-size:12px;color:var(--sub);flex:1">${esc(F0.overall || '')}</div></div>
      ${(F0.items || []).map(x => `<div class="mb12"><div class="row" style="justify-content:space-between"><b>${x.rank}. ${esc(x.title)}</b><span class="tag ${x.coverage >= 70 ? 'ok' : x.coverage >= 40 ? 'warn' : 'bad'}">${x.coverage}%</span></div><div class="bar" style="margin:5px 0"><i style="width:${x.coverage}%;background:${x.coverage >= 70 ? 'var(--ok)' : x.coverage >= 40 ? 'var(--warn)' : 'var(--bad)'}"></i></div><div style="font-size:12px;color:var(--sub)">${(x.pages || []).map(id => { const [si, pi] = String(id).split('.').map(Number); const s = S.sections[si]; return s ? `<a href="#" data-act="preview" data-s="${si}" data-p="${pi}">${esc(s.title)} p${pi + 1}</a>` : ''; }).join(', ') || '연결 장표 없음'}${x.gap ? `<br>부족: ${esc(x.gap)}` : ''}${x.suggestion ? `<br><b>보강:</b> ${esc(x.suggestion)}` : ''}</div></div>`).join('')}
      ${(F0.missing || []).length ? `<div class="note">누락 가능: ${F0.missing.map(esc).join(', ')}</div>` : ''}`}</div>
  </div>
  <div class="card"><h3><span class="n">3</span>제안서 취합 & 최종본 추출</h3>
    <div class="row mb12" style="flex-wrap:wrap;gap:16px">
      ${[['cover', '표지'], ['guide', '컬러 가이드 (맨 앞)'], ['toc', '목차(INDEX)'], ['closing', '클로징']].map(([k, n]) => `<label class="ck" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-bind="merge.${k}" ${m[k] ? 'checked' : ''}>${n}</label>`).join('')}
      <span style="flex:1"></span><button class="btn pri" data-act="merge">✦ 섹션 취합 → 하나의 제안서</button></div>
    <div class="note mb12"><b>폰트·컬러 깨짐 방지</b><br>• <b>PDF(고화질)</b>: 화면과 동일하게 폰트·컬러 고정(텍스트 선택 불가). <b>인쇄용 PDF</b>: 브라우저 인쇄 → "PDF로 저장"(배경 그래픽 체크)으로 텍스트가 살아있는 벡터 PDF.<br>• <b>PPT</b>: 폰트 내장 불가 — 열람 PC에 <a href="https://github.com/orioncactus/pretendard/releases" target="_blank">Pretendard</a>(Bold·Light) 설치 필요. 컬러는 HEX로 고정.</div>
    ${m.done ? vMerged() : ''}</div>`;
}
function vMerged(){
  const list = assemble();
  return `<div class="toolbar"><span class="tag pri">총 ${list.length}장</span><span class="sp"></span><button class="btn dark" data-act="finalPPT">⬇ 최종 PPT</button><button class="btn dark" data-act="finalPDF">⬇ 최종 PDF (고화질)</button><button class="btn" data-act="finalPrint">인쇄용 PDF (벡터)</button></div>
    <div class="gallery">${list.map((it, i) => `<div class="gi"><div data-act="previewFinal" data-i="${i}" style="cursor:zoom-in">${thumbHTML(it, 230)}</div><div class="lb"><span>${two(i + 1)} · ${it.kind === 'page' ? esc(it.secTitle) : ({cover: '표지', guide: '컬러 가이드', toc: '목차', closing: '클로징'})[it.kind]}</span>${it.kind === 'page' && !it.page.washed ? '<span class="tag warn">초안</span>' : ''}</div></div>`).join('')}</div>`;
}

/* ---------- 미리보기 ---------- */
function openPreview(list, idx){
  let i = idx;
  const m = modal('미리보기', '<div class="pv"></div>');
  const draw = () => { const it = list[i], w = Math.min(1120, innerWidth - 110); $('.pv', m).innerHTML = `<div class="row mb12" style="justify-content:space-between"><div class="row"><button class="btn sm" data-nav="-1" ${i ? '' : 'disabled'}>◀ 이전</button><span class="tag">${i + 1} / ${list.length}</span><button class="btn sm" data-nav="1" ${i < list.length - 1 ? '' : 'disabled'}>다음 ▶</button></div><div class="row"><button class="btn sm" data-x="ppt">이 페이지 PPT</button><button class="btn sm" data-x="pdf">이 페이지 PDF</button></div></div>${thumbHTML(it, w)}`; };
  m.addEventListener('click', e => { const n = e.target.closest('[data-nav]'); if (n){ i = Math.max(0, Math.min(list.length - 1, i + +n.dataset.nav)); draw(); } const x = e.target.closest('[data-x]'); if (x) (x.dataset.x === 'ppt' ? exportPPTX : exportPDF)([list[i]], `page${two(i + 1)}`); });
  m.tabIndex = 0; m.focus(); m.addEventListener('keydown', e => { if (e.key === 'ArrowRight' && i < list.length - 1){ i++; draw(); } if (e.key === 'ArrowLeft' && i){ i--; draw(); } if (e.key === 'Escape') m.remove(); });
  draw();
}

/* ---------- 설정 ---------- */
function openSettings(){
  const tp = S.template;
  const m = modal('설정 — PPT 템플릿 · (선택) AI API', `
    <div class="grid2">
      <div class="card"><h3>PPT 양식 (회사 템플릿)</h3>
        <p class="hint" style="margin:0 0 10px">회사 양식(.pptx)을 올리면 로고 등 이미지를 추출합니다. 로고는 모든 장표에 고정되고, 표지 배경도 지정할 수 있어요.</p>
        <div class="drop" style="padding:14px"><b>템플릿 PPTX 업로드</b><input type="file" accept=".pptx,.potx" id="tplIn"></div>
        <div class="row mt12"><label class="btn sm" style="position:relative;overflow:hidden">로고 이미지 직접 업로드<input type="file" accept="image/*" id="logoIn" style="position:absolute;inset:0;opacity:0"></label>
          ${tp.logo ? `<img src="${tp.logo}" style="height:28px;max-width:140px;object-fit:contain;background:#f4f4f4;border-radius:4px;padding:2px"><button class="btn sm ghost bad" id="logoDel">로고 제거</button>` : '<span class="tag">로고 없음 → 텍스트 워드마크</span>'}</div>
        <div class="grid2 mt12"><div><label class="f">로고 위치</label><select data-bind="template.logoPos">${[['tr', '우측 상단'], ['tl', '좌측 상단'], ['br', '우측 하단'], ['bl', '좌측 하단']].map(([v, n]) => `<option value="${v}" ${tp.logoPos === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label class="f">워드마크 텍스트</label>${inp('template.footer')}</div></div>
        <div class="row mt12">${tp.coverBg ? `<span class="tag ok">표지 배경 지정됨</span><button class="btn sm ghost bad" id="coverDel">표지 배경 제거</button>` : '<span class="tag">표지 배경: 기본 디자인</span>'}</div>
        <div class="media" id="mediaGrid">${MEDIA.map((md, i) => `<div class="m"><img src="${md.data}"><div style="margin:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(md.name)}</div><button class="btn sm" data-ml="${i}">로고</button> <button class="btn sm" data-mc="${i}">표지</button></div>`).join('')}</div></div>
      <div class="card"><h3>AI API (선택 사항)</h3>
        <div class="note info mb12">API 키 없이도 내장 전략가 엔진 + <b>Claude 심화 리서치</b>(Claude 앱에 붙여넣기)로 모든 기능을 쓸 수 있습니다. 키를 넣으면 분석·섹션 작성을 이 화면에서 바로 Claude API로 실행합니다.</div>
        <label class="f">Anthropic API 키</label><input type="password" id="sKey" value="${esc(apiKey())}" placeholder="sk-ant-...">
        <p class="hint" style="margin:6px 0 12px">이 브라우저에만 저장되며 api.anthropic.com으로만 전송됩니다.</p>
        <label class="f">모델</label><select data-bind="settings.model">${MODELS.map(([v, n]) => `<option value="${v}" ${S.settings.model === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <label class="ck mt12" style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-bind="settings.apiGen" ${S.settings.apiGen ? 'checked' : ''}>섹션 자동 작성도 API 사용 (끄면 내장 엔진)</label>
        <label class="ck mt12" style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" data-bind="settings.web" ${S.settings.web ? 'checked' : ''}>API 분석 시 웹 검색 사용</label>
        <div class="row mt12"><button class="btn pri" id="sSave">키 저장</button><button class="btn" id="sTest">연결 테스트</button><button class="btn ghost bad" id="sDel">키 삭제</button></div></div>
    </div>`);
  $('#sSave', m).onclick = () => { localStorage.setItem('ps_key', $('#sKey', m).value.trim()); renderSteps(); toast('API 키 저장됨'); };
  $('#sDel', m).onclick = () => { localStorage.removeItem('ps_key'); $('#sKey', m).value = ''; renderSteps(); toast('API 키 삭제됨'); };
  $('#sTest', m).onclick = async () => { localStorage.setItem('ps_key', $('#sKey', m).value.trim()); renderSteps(); busy('연결 테스트 중…'); try { const t = await callClaude({system: 'JSON만', content: '{"ok":true} 를 그대로 출력', maxTokens: 50}); toast(/ok/.test(t) ? `연결 성공 ✓` : '응답: ' + t.slice(0, 60)); } catch(e){ toast(e.message === 'NOKEY' ? '키를 입력하세요' : e.message, 5000); } unbusy(); };
  const reopen = () => { m.remove(); openSettings(); save(); render(); };
  $('#tplIn', m).onchange = async e => { const f = e.target.files[0]; if (!f) return; busy('템플릿 분석 중…'); try { MEDIA = await templateMedia(f); toast(`이미지 ${MEDIA.length}개 추출 — 로고로 쓸 이미지를 고르세요`); } catch(er){ toast('템플릿 읽기 실패: ' + er.message); } unbusy(); reopen(); };
  $('#logoIn', m).onchange = async e => { const f = e.target.files[0]; if (!f) return; await setLogo(await readDataURL(f)); reopen(); };
  $('#logoDel', m) && ($('#logoDel', m).onclick = () => { tp.logo = null; reopen(); });
  $('#coverDel', m) && ($('#coverDel', m).onclick = () => { tp.coverBg = null; reopen(); });
  $('#mediaGrid', m).onclick = async e => { const l = e.target.closest('[data-ml]'), c = e.target.closest('[data-mc]'); if (l){ await setLogo(MEDIA[+l.dataset.ml].data); reopen(); } if (c){ tp.coverBg = (await resizeImage(MEDIA[+c.dataset.mc].data, 1600)).data; reopen(); } };
}
async function setLogo(d){ const r = await resizeImage(d, 600, 'image/png'); S.template.logo = r.data; S.template.logoW = r.w; S.template.logoH = r.h; save(); }
async function templateMedia(file){
  const zip = await JSZip.loadAsync(await file.arrayBuffer()), out = [], used = new Set();
  for (const n of Object.keys(zip.files).filter(n => /^ppt\/(slideMasters|slideLayouts|slides)\/_rels\/.*\.rels$/.test(n))){ const x = await zip.file(n).async('string'); (x.match(/Target="\.\.\/media\/[^"]+"/g) || []).forEach(t => used.add(t.slice(18, -1))); }
  const files = Object.keys(zip.files).filter(n => /^ppt\/media\/.+\.(png|jpe?g|gif|svg)$/i.test(n)).sort((a, b) => used.has(b.split('/').pop()) - used.has(a.split('/').pop()));
  for (const n of files.slice(0, 40)){ const ext = n.split('.').pop().toLowerCase(); const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : 'image/' + ext; out.push({name: n.split('/').pop(), data: `data:${mime};base64,` + await zip.file(n).async('base64')}); }
  return out;
}
async function addFiles(kind, files){
  for (const f of files){
    busy('파일 읽는 중…', f.name);
    try { const r = await extractFile(f), id = uid(); if (r.pdfB64) RAW[id] = r.pdfB64; S.input[kind].push({id, name: f.name, size: f.size, text: r.text || '', pages: r.pages || 0, image: r.image || null, scanned: r.pages && (r.text || '').replace(/\[p\.\d+\]|\s/g, '').length < r.pages * 40}); }
    catch(e){ toast(`${f.name}: ${e.message}`, 4000); }
  }
  unbusy(); save(); render();
}
function downloadJSON(p){ const blob = new Blob([JSON.stringify(p, null, 1)], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(p.project.client || 'proposal').replace(/[\\/:*?"<>|\s]+/g, '_')}_${isoToday().replace(/-/g, '')}.json`; a.click(); }

/* =========================================================
   EVENTS
   ========================================================= */
const sec = b => S.sections[+b.dataset.s];
const pgOf = b => sec(b)?.pageList[+b.dataset.p];
const mv = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
const rr = () => { save(); render(); };
const LP = b => LIST.find(p => p.id === b.dataset.pid);
const ACT = {
  tab: b => { S.step = b.dataset.v; save(); render(); scrollTo(0, 0); },
  goLogic: () => { S.step = 'logic'; save(); render(); scrollTo(0, 0); },
  settings: () => openSettings(),
  newProject: () => newProject(),
  openP: (b, e) => { e.preventDefault(); openProject(b.dataset.pid, b.dataset.step); },
  dupP: b => { const p = clone(LP(b)); p.id = uid(); p.created = p.updated = Date.now(); p.project.name = (p.project.name || '') + ' (복제)'; p.project.status = '준비'; LIST.push(p); DB.put(clone(p)); render(); toast('복제했습니다'); },
  delP: async b => { const p = LP(b); if (!confirm(`"${p.project.client || p.project.name || '제안'}"을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return; await DB.del(p.id); LIST = LIST.filter(x => x !== p); if (S === p){ S = LIST[0] || defaultState(); if (!LIST.length) LIST.push(S); S.step = 'manage'; } render(); },
  expP: b => downloadJSON(LP(b)),
  importProject: () => $('#jsonIn').click(),
  exportCur: () => downloadJSON(S),
  addUrl: () => { S.input.urls.push({type: '네이버 스마트스토어', url: ''}); rr(); },
  delUrl: b => { S.input.urls.splice(+b.dataset.i, 1); if (!S.input.urls.length) S.input.urls.push({type: '자사몰', url: ''}); rr(); },
  delFile: b => { const f = S.input[b.dataset.k].splice(+b.dataset.i, 1)[0]; if (f) delete RAW[f.id]; rr(); },
  viewFile: b => { const k = b.dataset.k, i = +b.dataset.i, f = S.input[k][i]; modal(esc(f.name) + ' — 추출 텍스트', `<p class="hint">표·이미지 속 글자가 누락됐다면 여기서 직접 보완하세요.</p><textarea data-bind="input.${k}.${i}.text" style="min-height:60vh;font-size:12px">${esc(f.text)}</textarea>`); },
  analyze: () => analyze(), analyzeApi: () => analyze('api'),
  claudeAll: () => openClaudeBridge(), claudeSec: b => openClaudeBridge(sec(b)),
  addColor: () => { S.input.colors.push({hex: '#888888', role: ['Main', 'Sub', 'Accent'][S.input.colors.length], name: '', reason: ''}); rr(); },
  delColor: b => { S.input.colors.splice(+b.dataset.i, 1); rr(); },
  guidePPT: () => exportPPTX([{kind: 'guide'}], 'color_guide'),
  guidePDF: () => exportPDF([{kind: 'guide'}], 'color_guide'),
  previewSpecial: b => openPreview([{kind: b.dataset.k}], 0),
  prioMv: b => { const P = S.input.analysis.priorities; mv(P, +b.dataset.i, +b.dataset.d); P.forEach((p, i) => p.rank = i + 1); rr(); },
  prioDel: b => { const P = S.input.analysis.priorities; P.splice(+b.dataset.i, 1); P.forEach((p, i) => p.rank = i + 1); rr(); },
  prioAdd: () => { const P = S.input.analysis.priorities = S.input.analysis.priorities || []; P.push({rank: P.length + 1, title: '', why: '', evidence: '직접 추가', angle: '', weight: '중'}); rr(); },
  addIns: () => { S.input.analysis.brandInsights.push(''); rr(); },
  delIns: b => { S.input.analysis.brandInsights.splice(+b.dataset.i, 1); rr(); },
  storyAdd: () => { S.input.analysis.logic.storyline.push({title: '', point: ''}); rr(); },
  storyDel: b => { S.input.analysis.logic.storyline.splice(+b.dataset.i, 1); rr(); },
  buildLogic: () => { if (S.sections.some(s => s.pageList.length) && !confirm('기존 섹션과 작성 내용이 초기화됩니다. 로직을 다시 구성할까요?')) return; createSkeleton(); rr(); toast('섹션 구성 완료 — 희망 페이지 수를 조정한 뒤 [전체 섹션 자동 작성]'); },
  genAll: () => genAll(),
  genSec: b => { if (sec(b).pageList.length && !confirm('이 섹션 내용을 다시 작성할까요?')) return; genSection(+b.dataset.s); },
  secMv: b => { mv(S.sections, +b.dataset.s, +b.dataset.d); rr(); },
  secDel: b => { if (confirm(`"${sec(b).title}" 섹션을 삭제할까요?`)){ S.sections.splice(+b.dataset.s, 1); rr(); } },
  secFold: b => { sec(b).collapsed = !sec(b).collapsed; rr(); },
  insSec: b => { S.sections.splice(+b.dataset.at, 0, newSection('strategy', '새 섹션', '', 2, false, 'custom')); rr(); },
  addExtra: b => { const k = b.dataset.k, s = newSection(k, ROLE_DEF[k][0], ROLE_DEF[k][2], 3, true, k); s.en = ROLE_DEF[k][1]; if (k === 'case') S.sections.push(s); else S.sections.unshift(s); rr(); },
  secPPT: b => exportPPTX(sectionItems(sec(b)), `S${two(secNoOf(sec(b)))}_${sec(b).title}`),
  secPDF: b => exportPDF(sectionItems(sec(b)), `S${two(secNoOf(sec(b)))}_${sec(b).title}`),
  pagePPT: b => exportPPTX([pageItem(sec(b), pgOf(b), +b.dataset.p + 1)], `${sec(b).title}_p${+b.dataset.p + 1}`),
  pagePDF: b => exportPDF([pageItem(sec(b), pgOf(b), +b.dataset.p + 1)], `${sec(b).title}_p${+b.dataset.p + 1}`),
  addPage: b => { const t = b.dataset.t, s = sec(b); s.pageList.push(newPage(t, t === 'divider' ? {title: s.title, subtitle: s.goal, items: []} : {})); rr(); },
  pageMv: b => { mv(sec(b).pageList, +b.dataset.p, +b.dataset.d); rr(); },
  pageDup: b => { const p = clone(pgOf(b)); p.id = uid(); sec(b).pageList.splice(+b.dataset.p + 1, 0, p); rr(); },
  pageDel: b => { sec(b).pageList.splice(+b.dataset.p, 1); rr(); },
  itemAdd: b => { pgOf(b).items.push({h: '', d: '', v: ''}); rr(); },
  itemDel: b => { pgOf(b).items.splice(+b.dataset.i, 1); rr(); },
  imgDel: b => { const p = pgOf(b); p.image = null; if (p.layout === 'image') p.layout = 'list'; rr(); },
  preview: (b, e) => { e.preventDefault(); const s = sec(b); if (s) openPreview(sectionItems(s), +b.dataset.p); },
  previewFinal: b => openPreview(assemble(), +b.dataset.i),
  washAll: () => washSections(S.sections.map((s, i) => i)),
  washSec: b => washSections([+b.dataset.s]),
  shuffle: b => { shuffleLayout(pgOf(b)); rr(); },
  unwashAll: () => { if (!confirm('모든 페이지를 워싱 전 초안으로 되돌릴까요?')) return; S.sections.forEach(s => s.pageList.forEach(unwash)); rr(); },
  unwashPage: b => { unwash(pgOf(b)); rr(); },
  typo: () => typoCheck(),
  typoOne: b => { const x = S.checks.typos.find(t => t.id === b.dataset.id); if (x) applyTypo(x); rr(); },
  typoSkip: b => { S.checks.typos = S.checks.typos.filter(t => t.id !== b.dataset.id); rr(); },
  typoAll: () => { [...S.checks.typos].forEach(applyTypo); rr(); toast('모두 적용했습니다'); },
  fit: () => fitCheck(),
  merge: () => { if (!includedSecs().some(s => s.pageList.length)){ toast('취합할 페이지가 없습니다'); return; } S.merge.done = true; if (S.project.status === '준비' || S.project.status === '작성중') S.project.status = '검토'; rr(); toast(`제안서 취합 완료 — 총 ${assemble().length}장`); },
  finalPPT: () => exportPPTX(assemble(), 'final_proposal'),
  finalPDF: () => exportPDF(assemble(), 'final_proposal'),
  finalPrint: () => printPDF(assemble(), 'final_proposal')
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = ACT[b.dataset.act]; if (f) f(b, e); });

const thumbT = {};
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'mq'){ MF.q = el.value; clearTimeout(thumbT.mq); thumbT.mq = setTimeout(() => { render(); const q = $('#mq'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); return; }
  const p = el.dataset.bind; if (!p) return;
  if (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'number' || el.type === 'color' || el.type === 'date') return;
  setPath(S, p, el.value); if (S.project.status === '준비' && /^sections|^input\.analysis/.test(p)) S.project.status = '작성중'; save();
  if (/^input\.colors\.\d+\.hex$/.test(p) && validHex(el.value)){ const sw = el.closest('.chip')?.querySelector('.sw'); if (sw) sw.style.background = el.value; }
  const m = p.match(/^sections\.(\d+)\.pageList\.(\d+)\./);
  if (m){ const key = m[1] + '.' + m[2]; clearTimeout(thumbT[key]); thumbT[key] = setTimeout(() => { const t = $(`[data-thumb="${key}"]`), s = S.sections[+m[1]]; if (t && s) t.innerHTML = thumbHTML(pageItem(s, s.pageList[+m[2]], +m[2] + 1), 340); }, 250); }
  if (p === 'project.client' || p === 'project.name') renderSteps();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'mst'){ MF.st = el.value; render(); return; }
  if (el.id === 'msort'){ MF.sort = el.value; render(); return; }
  if (el.dataset.pf){ const p = LIST.find(x => x.id === el.dataset.pid); if (p){ p.project[el.dataset.pf] = el.value; p.updated = Date.now(); DB.put(clone(p)); if (el.dataset.pf !== 'memo' && el.dataset.pf !== 'owner') render(); } return; }
  if (el.dataset.file){ addFiles(el.dataset.file, [...el.files]); el.value = ''; return; }
  if (el.dataset.pimg){ const [si, pi] = el.dataset.pimg.split('.').map(Number), f = el.files[0]; if (!f) return; readDataURL(f).then(d => resizeImage(d, 1600)).then(r => { const p = S.sections[si].pageList[pi]; p.image = r.data; p.imageW = r.w; p.imageH = r.h; if (!p.img) p.img = {mode: 'right', ratio: .42, fit: 'cover'}; rr(); }); return; }
  const p = el.dataset.bind; if (!p) return;
  let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Math.max(1, +el.value || 1) : el.value;
  if (el.type === 'color') v = v.toUpperCase();
  setPath(S, p, v);
  if (/pageList\.\d+\.type$/.test(p)){ const pg = getPath(S, p.replace(/\.type$/, '')); if (v === 'strategy' && ['list', 'table'].includes(pg.layout)) pg.layout = 'cards'; }
  save();
  if (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'number' || el.type === 'color' || el.type === 'date' || /colors/.test(p)){ if (!el.closest('.modal') || /template|settings/.test(p)) render(); }
});
document.addEventListener('dragover', e => { const d = e.target.closest('.drop'); if (d){ e.preventDefault(); d.classList.add('over'); } });
document.addEventListener('dragleave', e => { e.target.closest('.drop')?.classList.remove('over'); });
document.addEventListener('drop', e => { const d = e.target.closest('[data-drop]'); if (!d) return; e.preventDefault(); d.classList.remove('over'); addFiles(d.dataset.drop, [...e.dataTransfer.files]); });
$('#jsonIn').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const s = normalize(JSON.parse(await f.text())); if (LIST.some(p => p.id === s.id)) s.id = uid(); LIST.push(s); await DB.put(clone(s)); openProject(s.id, 'input'); toast('제안서를 가져왔습니다'); } catch(er){ toast('가져오기 실패: ' + er.message); } e.target.value = ''; });


