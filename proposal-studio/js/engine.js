/* =========================================================
   Proposal Studio v2 — 내장 전략 엔진 (API 키 불필요)
   규칙 기반 전략가 — 흐름: 진단 → 과제 → 3트랙 전략 → 퍼널 → 매체 실행안 → 예산 → 크리에이티브 → KPI → 보고 → 최적화 → 사례 → 이슈 → 비용
   (문장·수치는 모두 자체 작성. 참고 제안서의 문구·수치·사례는 사용하지 않음)
   ========================================================= */

/* ---------- 업종 프리셋 ---------- */
const IND = {
  fashion: {name: '패션', kw: /패션|의류|의복|셔츠|니트|아우터|원피스|피케|데님|슈즈|신발|가방|잡화|어패럴|컬렉션|룩북/g, item: '시즌 대표 아이템', usp: '소재·핏·스타일링', cut: '착용컷·코디', offer: '멤버십 적립·무료 반품', colors: ['#14325C', '#2E7D6B', '#E0A93B'],
    season: [['3월', 'S/S 런칭', '신상 룩북 · 사전 모수 적재'], ['5월', '가정의 달', '선물 큐레이션 · 기프트 키워드'], ['7월', '여름 시즌오프', '재고 소진 · 리타겟 강화'], ['9월', 'F/W 런칭', '아우터·니트 선적재'], ['11월', '블랙프라이데이', '빅프로모션 일자별 예산'], ['12월', '연말 선물', '기프트·회원 재구매']]},
  beauty: {name: '뷰티', kw: /뷰티|화장품|코스메틱|스킨케어|세럼|크림|토너|앰플|선크림|메이크업|헤어|바디|클렌징|마스크팩/g, item: '대표 스킨케어', usp: '성분·효능·사용감', cut: '사용 루틴·텍스처 컷', offer: '샘플 증정·멤버십 포인트', colors: ['#7A3E5C', '#E8B4B8', '#2F6F73'],
    compliance: '화장품 표시·광고 실증 기준 — 기능성 표현·비포애프터·의약품 오인 표현 사전 검수',
    season: [['3월', '봄 리뉴얼', '신학기·환절기 진정 케어'], ['5월', '가정의 달', '기프트 세트'], ['6월', '선케어·올영세일', '세일 일정 연동 예산 선적재'], ['9월', '환절기', '보습 라인 전환'], ['11월', '블랙프라이데이', '대용량·세트 프로모션'], ['12월', '연말 기프트', '홀리데이 에디션']]},
  health: {name: '헬스케어', kw: /건강기능식품|건기식|영양제|유산균|의료기기|헬스케어|병원|클리닉|통증|마사지기|의료|더마|넥케어|목주름|홈케어/g, item: '대표 제품', usp: '효능 근거·사용 편의', cut: '사용 장면·근거 자료(심의 범위 내)', offer: '정기구독·첫구매 혜택', colors: ['#0F4C5C', '#5FB3B3', '#F2A541'],
    compliance: '의료기기·건강기능식품 광고 사전 심의 필수 — 효능·체험기 표현 제한, 심의필 번호 노출',
    season: [['1월', '새해 건강 결심', '신규 유입 집중'], ['2월', '설 선물', '효도·기프트'], ['5월', '가정의 달', '부모님 선물 키워드'], ['8월', '휴가 후 관리', '재구매 리마인드'], ['9월', '추석 선물', '세트 구성 프로모션'], ['11월', '블랙프라이데이', '정기구독 전환']]},
  food: {name: 'F&B', kw: /식품|음료|간편식|밀키트|커피|베이커리|F&B|스낵|과자|주류|건강식|도시락/g, item: '대표 메뉴', usp: '맛·간편함·원재료', cut: '조리·먹는 장면', offer: '첫구매 혜택·무료배송', colors: ['#B5462B', '#F2C14E', '#2F5D50'],
    season: [['2월', '설 명절', '선물 세트'], ['5월', '가정의 달', '기프트'], ['7월', '여름 시즌', '시원한 메뉴·캠핑'], ['9월', '추석 명절', '선물 세트 사전 예약'], ['11월', '블랙프라이데이', '대용량 묶음'], ['12월', '연말 홈파티', '파티 메뉴 큐레이션']]},
  living: {name: '리빙·가전', kw: /리빙|가구|인테리어|생활용품|침구|주방|가전|청소기|매트리스|조명/g, item: '대표 상품', usp: '공간 연출·기능·내구성', cut: '사용 공간 연출', offer: '무료 배송·설치·체험 혜택', colors: ['#2D3E50', '#C8A27C', '#6B9080'],
    season: [['3월', '이사·신혼 시즌', '공간별 큐레이션'], ['5월', '가정의 달', '선물·가전'], ['7월', '여름 가전', '냉방·제습'], ['9월', '가을 이사', '침구·수납'], ['11월', '블랙프라이데이', '고가 상품 할부 혜택'], ['12월', '연말 결산', '재고 소진']]},
  app: {name: '앱 서비스', kw: /앱\s*설치|어플|MAU|DAU|리텐션|앱\s*다운로드|플랫폼\s*앱|가입자/g, item: '핵심 서비스', usp: '핵심 기능·혜택', cut: '앱 UI 사용 장면', offer: '첫 이용 혜택', colors: ['#3D2C8D', '#7DE2D1', '#FF7A59'],
    season: [['1월', '신년 프로모션', '신규 가입 집중'], ['3월', '신학기', '타겟 확장'], ['6월', '상반기 결산', '리텐션 캠페인'], ['9월', '하반기 런칭', '신기능 UA'], ['11월', '연말 이벤트', '휴면 복귀'], ['12월', '연간 리캡', '바이럴']]},
  commerce: {name: '커머스', kw: null, item: '대표 상품', usp: '핵심 USP·혜택', cut: '사용 장면 컷', offer: '회원 혜택·무료배송', colors: ['#1F3A93', '#4C8BF5', '#FFB020'],
    season: [['2월', '설 명절', '선물 수요'], ['5월', '가정의 달', '기프트 큐레이션'], ['7월', '여름 시즌', '시즌 상품'], ['9월', '추석 명절', '선물 세트'], ['11월', '블랙프라이데이', '빅프로모션'], ['12월', '연말 결산', '회원 재구매']]}
};

/* ---------- 제안사 소개 템플릿 (사실 정보는 회사소개서 기준으로 직접 입력) ---------- */
const AGENCY = {
  note: '회사 수치·인증·사례는 최신 회사소개서 기준으로 입력하세요. 엔진은 구조와 문장 틀만 제공합니다.',
  hero: ['[대표 지표명 예: 연간 운영 규모]', '[이 수치가 광고주에게 의미하는 바를 한 문장으로]', '[수치 입력]'],
  points: [['[강점 1 예: 업종 운영 경험]', '[운영 브랜드 수·기간 등 근거]', '[수치]'], ['[강점 2 예: 데이터·기술 인력]', '[조직 규모와 역할]', '[수치]'], ['[강점 3 예: 장기 고객 비율]', '[유지율·재계약률 등]', '[수치]']],
  partners: [['네이버', '[파트너 등급·인증 입력]', '[등급]'], ['메타', '[파트너 등급·인증 입력]', '[등급]'], ['구글', '[파트너 등급·인증 입력]', '[등급]'], ['카카오', '[파트너 등급·인증 입력]', '[등급]'], ['틱톡', '[파트너 등급·인증 입력]', '[등급]'], ['기타 매체·어워드', '[수상·인증 입력]', '[연도]']],
  caps: [['매체 운영', '검색·디스플레이·소셜 매체를 하나의 목표 아래 통합 운영'], ['크리에이티브', '기획부터 이미지·영상 제작까지 내부에서 진행'], ['데이터 분석', '매체 데이터와 사이트 데이터를 합쳐 의사결정 근거 제공'], ['기술·자동화', '반복 업무 자동화로 분석·실행 시간 확보'], ['미디어 플래닝', '업종·시즌별 매체 조합과 예산 설계'], ['브랜드 전략', '브랜드 메시지와 퍼포먼스 메시지의 일관성 관리']],
  tools: [['[데이터 통합 솔루션명]', '여러 매체 데이터를 한 기준으로 모아 리포트를 자동화'], ['[운영 자동화 솔루션명]', '입찰·예산·상태 변경을 규칙 기반으로 자동 처리'], ['[소재 제작 지원 툴]', '규격 변환·베리에이션 제작 시간 단축'], ['[모니터링 툴]', '랜딩 오류·품절·지표 급변을 실시간 감지']]
};

/* ---------- 매체 라이브러리 (c = 컨텍스트) ---------- */
function MEDIA_LIB(c){
  const {B, P, T, own, ind, kw} = c;
  const cross = c.indKey === 'beauty' ? '루틴 상품' : c.indKey === 'fashion' ? '코디 상품' : c.indKey === 'health' ? '함께 쓰는 관리 제품' : '연관 상품';
  return {
    naverBrand: {name: '네이버 브랜드검색', stage: 'mid', w: 12,
      head: `브랜드검색 영역을 ${B}의 첫 매장 입구처럼 설계합니다.`, sub: '검색 결과 첫 화면에서 가장 잘 팔리는 상품과 지금 받을 수 있는 혜택을 바로 보여줍니다.',
      role: `'${B}'를 이미 찾는 수요를 놓치지 않는 기본 방어선`, who: `'${B}' · '${B} ${P}' 등 브랜드 검색 고객`, what: `대표 상품 썸네일 + 이달의 ${own} 혜택 문구`, land: `${own} 메인 또는 이달의 기획전`,
      acts: ['검색 결과 화면(썸네일·문구)을 월별 프로모션 일정과 연동해 교체', `${own}과 다른 판매 채널의 브랜드 키워드 입찰 주체를 사전에 정리`, '브랜드검색 유입의 첫구매 비중을 월 단위로 확인해 소재 개선 근거로 활용'],
      kpi: 'CTR · 브랜드 유입 · 첫구매 비중', when: '착수 전 소재 확정 → 월 1회 이상 교체'},
    naverPL: {name: '네이버 파워링크', stage: 'mid', w: 8,
      head: `파워링크로 '${kw[0]}'처럼 고민 단계의 검색어를 공략합니다.`, sub: '브랜드를 모르는 고객이 쓰는 문제·상황 키워드를 묶어 효율 기준으로 관리합니다.',
      role: '브랜드명을 모르는 탐색 고객 확보', who: `'${kw[0]}' · '${kw[1]}' 검색 고객`, what: `${ind.usp}를 앞세운 제목 + 리뷰·가격 확장소재`, land: '문제 해결형 랜딩 (상품 상세 또는 기획전)',
      acts: ['키워드를 문제형·비교형·구매형 3그룹으로 나눠 입찰 상한을 다르게 설정', '전환 없는 검색어는 주 1회 제외 처리, 반응 키워드는 유사어로 확장', '그룹별 광고 문안 2종을 동시에 운영해 CTR 차이 비교'],
      kpi: 'CTR · CPC · 전환율', when: '4주 학습 후 그룹별 예산 재배분'},
    naverShop: {name: '네이버 쇼핑검색', stage: 'mid', w: 14,
      head: '쇼핑검색은 상품 정보의 품질이 곧 노출 경쟁력입니다.', sub: '상품명·대표 이미지·속성 데이터를 먼저 다듬고, 상품군별로 목표를 나눠 운영합니다.',
      role: '네이버 쇼핑 안에서 비교하는 고객 확보', who: '카테고리·제품군을 비교 검색하는 고객', what: '검색어가 반영된 상품명 + 정보형 대표 이미지', land: '상품 상세',
      acts: ['매출 상위 상품부터 상품명·카테고리·속성값 누락을 점검해 보완', '베스트 상품(매출 목표)과 신상품(노출 목표)을 캠페인으로 분리', '재고·가격 변동이 큰 상품은 입찰을 낮추거나 일시 중지하는 기준 마련'],
      kpi: '클릭수 · ROAS · 상품별 전환', when: '착수 2주 전 피드 점검 → 주간 상품 단위 리뷰'},
    gfa: {name: '네이버 GFA', stage: 'upper', w: 8,
      head: `네이버 메인·피드 지면에서 ${T}에게 ${B}를 먼저 보여줍니다.`, sub: '관심사·검색 이력으로 처음 만나는 고객을 넓게 확보하고, 반응한 사람을 다음 단계로 넘깁니다.',
      role: '네이버 안 신규 고객 접점 확대', who: `${T} · 관련 관심사 · 유사 검색 이력 보유자`, what: `${ind.cut} 중심 이미지·숏폼`, land: `${own} 기획전 · 브랜드 소개 페이지`,
      acts: ['관심사 타겟과 검색 이력 타겟을 나눠 반응 차이 비교', '조회·클릭 고객을 별도 오디언스로 저장해 전환 캠페인에 연결', '소재 2~3종 동시 운영 후 반응 낮은 안부터 교체'],
      kpi: '도달 · 클릭률 · 브랜드 검색량 변화', when: '첫 달 테스트 → 반응 지면 중심 확대'},
    gfaConv: {name: '네이버 GFA 전환', stage: 'low', w: 6,
      head: 'GFA 전환 캠페인으로 다녀간 고객에게 다시 말을 겁니다.', sub: '방문만 하고 떠난 고객에게 본 상품과 구매 이유를 순서대로 보여줍니다.',
      role: '방문 이탈 고객의 구매 전환', who: `${own}에서 상품을 보거나 담아 두고 떠난 고객`, what: '본 상품 카탈로그 + 구매 혜택 안내', land: '본 상품 상세',
      acts: ['이탈 후 경과일(3일·7일·14일)별로 메시지를 다르게 설정', '카탈로그 소재와 일반 배너 소재를 함께 운영해 효율 비교', '전환 스크립트·상품 피드 연동 상태를 런칭 전 점검'],
      kpi: '전환율 · CPA · ROAS', when: '상시 운영 · 주 단위 오디언스 점검'},
    metaReach: {name: '메타 숏폼 (신규 유입)', stage: 'upper', w: 12,
      head: `메타에서는 짧은 영상으로 ${T}의 관심을 먼저 끕니다.`, sub: '검색 전 단계의 고객에게 제품이 필요한 순간을 보여주고, 반응을 다음 캠페인의 재료로 씁니다.',
      role: '검색 이전 단계의 수요 만들기', who: `${T} · 관심사 확장 · 기존 구매자 유사 타겟`, what: `세로형 숏폼 (고민 상황 → ${ind.cut} → 제품)`, land: `${own} 대표 상품 · 브랜드 소개`,
      acts: ['영상 도입부(고객의 고민을 보여주는 첫 장면) 3종을 테스트', '크리에이터 콘텐츠를 브랜드 광고로 함께 집행해 신뢰도 확보', '영상 시청·참여 고객을 전환 캠페인 타겟으로 넘김'],
      kpi: '도달 · 영상 시청률 · 참여율', when: '격주 소재 리뷰 → 반응 소재 확대'},
    metaConv: {name: '메타 전환·카탈로그', stage: 'low', w: 16,
      head: '메타 전환 캠페인의 성과는 구매 데이터의 정확도에서 갈립니다.', sub: '전환 신호를 빠짐없이 보내고, 처음 사는 고객과 다시 사는 고객을 나눠 운영합니다.',
      role: '구매 전환 및 재구매 확대', who: '상품 조회·장바구니 고객, 기존 구매 고객', what: '다이내믹 카탈로그 + 리뷰·후기 강조 소재', land: '본 상품 상세',
      acts: ['전환 API(CAPI) 연동으로 구매 이벤트 누락 최소화', '신규 고객 캠페인과 재방문 고객 캠페인을 분리해 중복 노출 방지', `구매 고객에게는 ${cross}을 이어서 제안`],
      kpi: '구매 수 · CPA · ROAS', when: '런칭 전 이벤트 점검 → 상시 운영'},
    googleSearch: {name: '구글 검색·PMax', stage: 'mid', w: 8,
      head: '구글 검색과 쇼핑 지면에서 구매 의도가 높은 고객을 받습니다.', sub: '검색 광고와 상품 피드를 함께 운영하고, 브랜드·일반 키워드의 역할을 분리합니다.',
      role: '구글 내 구매 의도 고객 확보', who: '제품명·카테고리 검색 고객', what: '검색 광고 문안 + Merchant Center 상품 피드', land: '카테고리 · 상품 상세',
      acts: ['브랜드 캠페인과 일반 키워드 캠페인의 키워드 중복 제거', '상품 피드 승인 오류를 먼저 해결한 뒤 PMax 학습 시작', '검색어 보고서에서 성과 키워드를 찾아 일반 검색 캠페인에 추가'],
      kpi: 'ROAS · 전환수 · 신규 고객 비중', when: '피드 승인 → 4주 학습 → 확대'},
    demandGen: {name: '유튜브·Demand Gen', stage: 'upper', w: 6,
      head: '유튜브와 디스커버 지면에서 영상과 상품을 함께 보여줍니다.', sub: '관심 단계 고객에게 짧은 영상으로 이해시키고, 상품 정보로 바로 이어지게 합니다.',
      role: '영상 기반 관심 확대', who: '관련 검색어 사용자 · 유사 관심사', what: '쇼츠 영상 + 상품 이미지 연동', land: '상품 상세',
      acts: ['검색 키워드 기반 맞춤 세그먼트로 타겟 정의', '영상 길이별(6초·15초) 반응 비교', '영상 노출 이후 브랜드 검색 변화로 효과 판단'],
      kpi: '조회율 · 신규 방문 · 검색량 변화', when: '6주 테스트 후 지속 여부 결정'},
    kakao: {name: '카카오 비즈보드·채널', stage: 'low', w: 4,
      head: '카카오는 채널 친구를 브랜드 자산으로 쌓는 데 씁니다.', sub: '광고로 친구를 모으고, 이후에는 메시지로 재구매를 유도합니다.',
      role: '자체 고객 접점(채널 친구) 확보', who: '카카오톡 이용자 · 채널 친구 · 기존 구매 고객', what: '비즈보드 + 채널 메시지', land: '채널 친구 추가 · 이벤트 페이지',
      acts: ['프로모션 시기에 비즈보드로 채널 친구 모집', '구매 고객은 메시지 중심으로 관리해 광고비 중복 지출 방지', `친구 추가 혜택은 ${ind.offer} 등 업종에 맞게 설계`],
      kpi: '친구 수 · 메시지 클릭률 · 재구매율', when: '시즌 집중 집행 · 월 2회 메시지'},
    criteo: {name: '크리테오', stage: 'low', w: 8,
      head: '크리테오로 관심 상품을 다시 보여주고 함께 살 상품을 제안합니다.', sub: '방문 이력 기반 추천으로 구매 전환과 주문 금액을 함께 높입니다.',
      role: '리타겟 전환 및 객단가 개선', who: '상품 조회·장바구니·구매 고객', what: '추천 상품 배너 (다이내믹)', land: '추천 상품 상세',
      acts: ['다른 매체 리타겟 캠페인과 대상 기간을 나눠 중복 최소화', '상품 피드에 리뷰 수·혜택 정보 추가', '구매 고객에게 보완 상품 추천 로직 적용'],
      kpi: 'ROAS · 객단가 · 전환율', when: '상시 · 월간 성과 리뷰'},
    tiktok: {name: '틱톡', stage: 'upper', w: 5,
      head: '틱톡은 소액 테스트로 반응하는 콘텐츠 유형을 먼저 찾습니다.', sub: '여러 크리에이터 콘텐츠를 빠르게 시험하고, 반응이 확인된 영상에 예산을 모읍니다.',
      role: '젊은 타겟 대상 콘텐츠 실험', who: `${T} · 관심사 확장`, what: '크리에이터 리뷰·사용 영상', land: `${own} 대표 상품`,
      acts: ['콘텐츠 유형(리뷰·사용기·비교) 3가지를 동시에 테스트', '시청 지속률 상위 영상만 광고로 확장', '반응 좋은 메시지는 다른 매체 소재에도 반영'],
      kpi: '시청 지속률 · 클릭률 · 신규 도달', when: '6주 테스트 · 소규모 예산으로 시작'},
    coupang: {name: '쿠팡 광고', stage: 'mid', w: 10,
      head: '쿠팡에서는 검색 상위 노출과 리뷰 확보를 함께 관리합니다.', sub: '쿠팡 안에서 비교 구매하는 고객을 대상으로 상품 광고 효율을 관리합니다.',
      role: '쿠팡 내 구매 수요 확보', who: '쿠팡 검색 고객', what: '상품 광고 (자동·수동 키워드)', land: '쿠팡 상품 상세',
      acts: ['주력 상품은 수동 키워드, 나머지는 자동 캠페인으로 운영', '리뷰 수·평점이 일정 수준 이상인 상품에 예산 집중', `${own}과의 가격 정책 차이를 정기 점검`],
      kpi: '광고 ROAS · 전환 매출', when: '2주 학습 후 키워드 정리'},
    appUA: {name: '앱 설치 캠페인', stage: 'upper', w: 20,
      head: '앱 캠페인은 설치가 아니라 첫 구매를 목표로 최적화합니다.', sub: '매체별 성과를 같은 측정 도구(MMP)로 비교하고, 이탈 사용자는 재참여로 되돌립니다.',
      role: '설치 → 가입 → 첫 구매', who: '유사 타겟 · 관심사 · 휴면 사용자', what: '앱 전용 혜택 소재', land: '앱 스토어 → 상품 딥링크',
      acts: ['구글·메타·애플 검색광고별로 최적화 이벤트를 단계적으로 상향', 'MMP 기준으로 매체별 기여와 재방문율 비교', '휴면 사용자 대상 재참여 캠페인 운영'],
      kpi: 'CPI · 가입 CPA · 7일 재방문율', when: '4주 학습 → 최적화 이벤트 전환'}
  };
}
const STAGE = {upper: {k: 'T1', en: 'DISCOVER', ko: '발견', type: '확장 트랙', lb: 'Upper funnel', desc: '아직 모르는 고객에게 브랜드를 처음 보여줍니다'}, mid: {k: 'T2', en: 'DECIDE', ko: '선택', type: '전환 트랙', lb: 'Mid funnel', desc: '비교·검색 중인 고객이 우리를 고르게 합니다'}, low: {k: 'T3', en: 'RETURN', ko: '재방문', type: '유지 트랙', lb: 'Low funnel', desc: '다녀간 고객이 결제하고, 다시 찾게 만듭니다'}};

/* ---------- 숫자 파싱 ---------- */
function fmtWon(n){ if (!n) return ''; if (n >= 1e8) return `${(n / 1e8).toFixed(n % 1e8 ? 1 : 0).replace(/\.0$/, '')}억원`; return `${Math.round(n / 1e4).toLocaleString()}만원`; }
function parseBudget(t, months){
  const re = /(월|연간|연|총|분기)?\s*(?:평균|약|최대|기준)?\s*([\d][\d,.]*)\s*(억|천만|백만|만)\s*원?/g; let m;
  while ((m = re.exec(t))){
    const ctx = t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 8);
    if (!/예산|광고비|집행|매체비|비용|규모/.test(ctx)) continue;
    let n = parseFloat(m[2].replace(/,/g, '')) * {억: 1e8, 천만: 1e7, 백만: 1e6, 만: 1e4}[m[3]];
    const per = m[1] || (/월\s*(평균|예산)?|매월/.test(ctx) ? '월' : /연간|연\s|1년/.test(ctx) ? '연' : /총/.test(ctx) ? '총' : '');
    const mo = per === '월' ? n : per === '분기' ? n / 3 : per === '연' || per === '연간' ? n / 12 : per === '총' ? n / (months || 12) : (n >= 5e8 ? n / (months || 12) : n);
    return {monthly: Math.round(mo), raw: m[0].trim()};
  }
  return null;
}
function detectTOC(text){
  const ls = text.split('\n').map(s => s.trim());
  for (let i = 0; i < ls.length; i++){
    if (!/(제안서|제안)\s*(목차|구성|작성\s*(항목|요령|방법)|포함\s*(내용|사항)|내용\s*구성)|제안\s*요청\s*(내용|사항)|제안서\s*작성/.test(ls[i])) continue;
    const out = []; let last = 0;
    for (let j = i + 1; j < Math.min(ls.length, i + 40); j++){
      const m = ls[j].match(/^(\d{1,2}|[①-⑳]|[가-하]|[IVX]{1,4})\s*[.)\]]\s*(.{2,40})$/);
      if (m){ const n = /^\d+$/.test(m[1]) ? +m[1] : last + 1; if (out.length && n <= last) break; last = n; out.push(m[2].replace(/[:：].*$/, '').trim()); continue; }
      if (out.length >= 3 && ls[j] && !/^[-·•]/.test(ls[j])) break;
    }
    if (out.length >= 4) return out.slice(0, 14);
  }
  return null;
}

/* ---------- RFP·인풋 신호 추출 ---------- */
function signals(){
  const I = S.input, rfp = I.rfp.map(f => f.text).join('\n'), brandTxt = I.brand.map(f => f.text || '').join('\n');
  const all = [rfp, brandTxt, I.notes, I.product, I.competitors, I.currentMix, S.project.name, S.project.client, I.urls.map(u => u.type + ' ' + u.url).join('\n')].join('\n');
  let indKey = 'commerce', best = 0;
  for (const [k, v] of Object.entries(IND)){ if (!v.kw) continue; const n = (all.match(v.kw) || []).length; if (n > best){ best = n; indKey = k; } }
  const ind = IND[indKey];
  const bm = rfp.match(/(?:광고주|발주처|기관명|회사명|브랜드명?)\s*[:：]\s*([^\n,/()]{2,20})/);
  const B = (S.project.client || '').trim() || (bm ? bm[1].trim() : '') || '브랜드';
  const P = (I.product || '').split(/[,/·\n]/)[0].trim() || ind.item;
  const ageM = all.match(/([2-6]0)\s*(?:~|-|∼|–)\s*([2-6]0)\s*대/), ages = [...new Set((all.match(/[2-6]0대/g) || []))];
  let age = ageM ? `${ageM[1]}~${ageM[2]}대` : /2030|MZ/.test(all) ? '2030' : ages.slice(0, 2).join('·');
  const both = (all.match(/남녀|성별\s*무관/g) || []).length, fem = (all.match(/여성|여자/g) || []).length + both, mal = (all.match(/남성|남자/g) || []).length + both;
  const gender = fem && !mal ? '여성' : mal && !fem ? '남성' : fem && mal ? (fem > mal * 2 ? '여성 중심' : '남녀') : '';
  const T = [age, gender].filter(Boolean).join(' ') || '핵심 타겟';
  const young = /20대|2030|MZ|Z세대|20~/.test(all);
  const own = /공식몰/.test(all) ? '공식몰' : '자사몰';
  const ch = new Set();
  I.urls.forEach(u => { if (!u.url) return; if (/스마트스토어/.test(u.type) || /smartstore/.test(u.url)) ch.add('smartstore'); else if (/브랜드스토어/.test(u.type) || /brand\.naver/.test(u.url)) ch.add('brandstore'); else if (/쿠팡/.test(u.type) || /coupang/.test(u.url)) ch.add('coupang'); else if (/올리브영/.test(u.type)) ch.add('oliveyoung'); else if (/무신사|29/.test(u.type)) ch.add('platform'); else if (/자사몰|공식몰/.test(u.type)) ch.add('own'); });
  if (/자사몰|공식몰|카페24|고도몰|아임웹/.test(all)) ch.add('own');
  if (/스마트스토어/.test(all)) ch.add('smartstore'); if (/브랜드스토어/.test(all)) ch.add('brandstore'); if (/쿠팡/.test(all)) ch.add('coupang'); if (/올리브영/.test(all)) ch.add('oliveyoung'); if (/무신사|29CM|W컨셉|지그재그|에이블리/.test(all)) ch.add('platform');
  if (!ch.size) ch.add('own');
  const goals = {revenue: /매출|거래액|GMV|판매/.test(all), roas: /ROAS|ROI|광고\s*효율/.test(all), newc: /신규|첫\s*구매|유입|모객/.test(all), member: /회원|가입|CRM|재구매|리텐션|충성/.test(all), aware: /인지도|브랜딩|검색량|브랜드\s*인지|버즈/.test(all), app: /앱\s*설치|다운로드|MAU|DAU/.test(all)};
  const roasM = all.match(/ROAS\s*[:은는이가]?\s*(?:목표\s*)?([\d,]{2,5})\s*%/i);
  const growM = all.match(/(?:전년|전년도|작년)\s*(?:동기\s*)?대비\s*([\d.]{2,4})\s*%/) || all.match(/([\d.]{1,4})\s*%\s*(?:이상\s*)?(?:성장|증가|상승|신장)/);
  const cpaM = all.match(/CPA\s*[:은는]?\s*([\d,]+)\s*원/);
  const monM = all.match(/(\d{1,2})\s*개월/), rng = all.match(/(\d{1,2})\s*월\s*~\s*(?:\d{4}\s*년\s*)?(\d{1,2})\s*월/);
  const months = monM ? +monM[1] : rng ? ((+rng[2] - +rng[1] + 12) % 12) + 1 : 12;
  const yM = all.match(/20(2[6-9]|3\d)\s*년/); const year = yM ? '20' + yM[1] : String(new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0));
  const bud = parseBudget(all, months) || parseBudget(S.project.budget || '', months);
  const mediaRe = {naverBrand: /브랜드검색/, naverPL: /파워링크|네이버\s*(검색광고|SA)/, naverShop: /쇼핑\s*검색/, gfa: /GFA|성과형\s*디스플레이|네이버\s*(DA|디스플레이)|홈피드/, metaReach: /메타|페이스북|인스타그램|Meta|릴스/i, metaConv: /메타|페이스북|인스타그램|Meta/i, googleSearch: /구글|Google|PMax|퍼포먼스\s*맥스/i, demandGen: /유튜브|YouTube|Demand\s*Gen|디맨드/i, kakao: /카카오|비즈보드|모먼트|톡채널/, criteo: /크리테오|Criteo/i, tiktok: /틱톡|TikTok/i, coupang: /쿠팡/, appUA: /앱\s*(설치|광고|마케팅)|MMP|애드저스트|앱스플라이어|에어브릿지/};
  const mentioned = Object.keys(mediaRe).filter(k => mediaRe[k].test(rfp + '\n' + I.notes + '\n' + I.currentMix));
  const evals = []; const er = /([가-힣A-Za-z·&\s]{2,24}?)\s*[:(（]?\s*(\d{1,2})\s*점/g; let em;
  while ((em = er.exec(rfp)) && evals.length < 10){ const nm = em[1].replace(/^[\s\d.·-]+|[\s(:]+$/g, '').trim(); if (nm.length >= 2 && +em[2] <= 60 && !/총|합계|만점|이상|이하/.test(nm)) evals.push({name: nm, pts: +em[2]}); }
  evals.sort((a, b) => b.pts - a.pts);
  const painRe = /정체|감소|하락|역성장|부진|악화|저조|이탈|경쟁\s*심화|높아|상승한\s*CPA|효율\s*저하/;
  const pains = [...new Set((rfp + '\n' + I.notes).split(/\n|다\.\s/).map(s => s.trim()).filter(s => s.length > 6 && s.length < 160 && painRe.test(s)).map(s => s.replace(/^[\d.)\-·•\s]+/, '').replace(/^[-·•\s]*(배경|현황|문제점?|이슈)\s*[:：]\s*/, '')).flatMap(s => s.split(/\s*(?:,|및|그리고)\s*/)).map(s => s.trim()).filter(s => s.length > 3 && painRe.test(s)).map(s => s.slice(0, 40)))].slice(0, 5);
  const comp = (I.competitors || (all.match(/경쟁\s*(?:사|브랜드|업체)?\s*[:：]\s*([^\n]+)/) || [])[1] || '').split(/[,/·、]/).map(s => s.trim()).filter(s => s && s.length < 20).slice(0, 6);
  const mix = []; const mr = /([가-힣A-Za-z+ ]{2,14}?)\s*(\d{1,2}(?:\.\d)?)\s*%/g; let mm; while ((mm = mr.exec(I.currentMix || '')) && mix.length < 10) mix.push({name: mm[1].trim(), pct: +mm[2]});
  const dl = rfp.match(/(?:제출|마감|PT|발표|프레젠테이션)[^\n]{0,24}?(\d{1,2})\s*[./월]\s*(\d{1,2})/);
  const kwBase = indKey === 'fashion' ? [`여성 ${P.length < 8 ? P : '셔츠'}`, '데일리룩 추천', '선물 추천'] : [`${P} 추천`, `${P} 비교`, `${P} 후기`];
  return {
    indKey, ind, B, P, T, young, own, channels: [...ch], goals, roasT: roasM ? +roasM[1].replace(/,/g, '') : null, growth: growM ? growM[1] + '%' : null, cpaT: cpaM ? cpaM[1] : null,
    months, year, budget: bud?.monthly || null, budgetRaw: bud?.raw || '', mentioned, evals, pains, comp, mix,
    deadline: dl ? `${dl[1]}/${dl[2]}` : '', creative: /소재|크리에이티브|콘텐츠\s*제작|촬영|영상\s*제작|디자인/.test(rfp), reportPain: /리포트|보고/.test(I.notes) && /불만|부족|없었|아쉬|액션|만\s*많/.test(I.notes),
    toc: detectTOC(rfp), kw: kwBase, hasRFP: rfp.length > 50, research: I.analysis?.research || null
  };
}

/* ---------- 매체 믹스·예산 ---------- */
function mediaMix(c){
  const L = MEDIA_LIB(c), sel = new Set(['naverBrand', 'naverShop', 'metaReach', 'metaConv', 'googleSearch']);
  if (c.channels.includes('own')) sel.add('gfaConv');
  if (c.goals.newc || c.young || c.goals.aware) sel.add('gfa');
  if (['health', 'beauty', 'living', 'commerce', 'food'].includes(c.indKey)) sel.add('naverPL');
  if ((c.budget || 0) >= 3e7 || c.mentioned.includes('criteo')) sel.add('criteo');
  if (c.goals.member || (c.budget || 0) >= 2e7 || c.mentioned.includes('kakao')) sel.add('kakao');
  if (c.young || c.mentioned.includes('tiktok')) sel.add('tiktok');
  if (c.goals.aware || (c.budget || 0) >= 5e7 || c.mentioned.includes('demandGen')) sel.add('demandGen');
  if (c.channels.includes('coupang')) sel.add('coupang');
  if (c.goals.app && c.indKey === 'app') sel.add('appUA');
  c.mentioned.forEach(k => sel.add(k));
  let keys = [...sel];
  if (c.budget && c.budget < 1.5e7){ const core = ['naverBrand', 'naverShop', 'metaConv', 'metaReach', 'naverPL', 'coupang', 'appUA']; keys = keys.filter(k => core.includes(k) || c.mentioned.includes(k)).slice(0, 5); }
  const order = {upper: 0, mid: 1, low: 2};
  return keys.map(k => ({key: k, ...L[k]})).sort((a, b) => order[a.stage] - order[b.stage]);
}
function allocate(mix, scenario){
  const f = {safe: {upper: .55, mid: 1.25, low: 1.15}, base: {upper: 1, mid: 1, low: 1}, push: {upper: 1.7, mid: .85, low: .9}}[scenario];
  const raw = mix.map(m => m.w * f[m.stage]), sum = raw.reduce((a, b) => a + b, 0);
  let pcts = raw.map(r => Math.max(2, Math.round(r / sum * 100)));
  const d = 100 - pcts.reduce((a, b) => a + b, 0); const mi = pcts.indexOf(Math.max(...pcts)); pcts[mi] += d;
  return mix.map((m, i) => ({...m, pct: pcts[i]}));
}
const stageSum = (al, st) => al.filter(m => m.stage === st).reduce((a, m) => a + m.pct, 0);

/* ---------- 전략가 분석 (인풋 → 우선순위·로직·섹션) ---------- */
function strategistAnalysis(){
  const c = signals(), mix = mediaMix(c), al = allocate(mix, 'base');
  const chMap = {own: c.own, smartstore: '스마트스토어', brandstore: '브랜드스토어', coupang: '쿠팡', oliveyoung: '올리브영', platform: '버티컬 플랫폼'};
  const chNames = c.channels.map(k => chMap[k]).filter(Boolean);
  const up = al.filter(m => m.stage === 'upper').map(m => m.name);
  const pri = [];
  if (c.evals.length){ const e = c.evals[0]; pri.push({title: `가장 큰 배점 '${e.name}'에 장표를 집중`, why: `평가표에서 ${e.pts}점으로 가장 큽니다. 이 항목의 완성도가 순위를 사실상 결정합니다.`, angle: `'${e.name}' 섹션을 가장 두껍게 구성하고, 다른 섹션에서도 이 항목으로 다시 연결되도록 흐름 설계`, evidence: `평가 배점: ${c.evals.slice(0, 5).map(x => x.name + ' ' + x.pts).join(' · ')}`, weight: '상'}); }
  if (c.roasT || c.growth) pri.push({title: `${c.roasT ? `ROAS ${c.roasT}%` : `매출 ${c.growth}`} 목표의 계산 근거 제시`, why: '목표 수치를 다시 적는 것만으로는 신뢰를 얻기 어렵습니다. 어떤 가정에서 그 숫자가 나오는지 보여줘야 합니다.', angle: '매출 = 유입 × 전환율 × 객단가로 분해하고, 단계별 개선 폭을 예산 시나리오와 연결', evidence: `RFP 목표: ${[c.roasT && 'ROAS ' + c.roasT + '%', c.growth && '성장 ' + c.growth, c.cpaT && 'CPA ' + c.cpaT + '원'].filter(Boolean).join(' · ')}`, weight: '상'});
  if (c.pains.length) pri.push({title: '현재 문제의 원인부터 짚고 시작', why: `RFP가 '${c.pains[0]}'을(를) 직접 언급했습니다. 원인 분석 없이 매체안으로 넘어가면 어느 대행사나 쓸 수 있는 제안이 됩니다.`, angle: '이슈별 원인 가설과 확인할 데이터를 표로 정리하고, 착수 후 한 달 안에 검증하겠다고 약속', evidence: `RFP 언급 이슈 ${c.pains.length}건`, weight: '상'});
  pri.push({title: `${c.T}의 신규 유입 경로 확보`, why: c.young ? '젊은 타겟은 검색창보다 숏폼·피드에서 제품을 처음 접하는 경우가 많습니다. 검색 광고만으로는 새 고객이 늘지 않습니다.' : '이미 브랜드를 아는 고객만 다시 잡는 구조에서는 성장 폭이 제한됩니다.', angle: `${up.slice(0, 3).join(' · ') || '상위 퍼널 매체'}로 처음 만나는 고객을 늘리고, 브랜드 검색량 변화로 효과를 확인`, evidence: `타겟 ${c.T}${c.goals.newc ? ' · RFP에 신규 유입 목표 언급' : ''}`, weight: c.goals.newc ? '상' : '중'});
  if (chNames.length > 1) pri.push({title: '판매 채널별 역할 정리', why: `${chNames.join(' · ')}이(가) 같은 고객·키워드를 두고 경쟁하면 광고비가 겹치고 성과 판단도 어려워집니다.`, angle: `채널별로 받을 고객과 키워드를 나누는 라우팅 표 제시 (${c.own}은 회원 관계 중심)`, evidence: `운영 채널: ${chNames.join(', ')}`, weight: '상'});
  if (c.creative) pri.push({title: '소재 테스트 운영 방식 구체화', why: '소재 제작이 과업에 포함돼 있습니다. 제작 물량보다 무엇을 기준으로 바꾸는지가 평가 포인트입니다.', angle: '퍼널 단계별 메시지 3종과 테스트·교체 기준을 수치로 제시', evidence: 'RFP 과업: 소재 기획·제작', weight: '중'});
  if (c.ind.compliance) pri.push({title: '광고 심의 리스크를 제작 단계에서 차단', why: `${c.ind.name} 업종은 표현 위반 시 광고 중단으로 이어져 성과 공백이 생깁니다.`, angle: '표현 체크리스트와 검수 단계를 제작 프로세스에 포함', evidence: `업종: ${c.ind.name}`, weight: '중'});
  pri.push({title: c.reportPain ? '보고서보다 실행 속도로 차별화' : '운영 체계를 숫자로 약속', why: c.reportPain ? '제안자 메모에 기존 운영의 실행력에 대한 불만이 있습니다. 바로 차별화 포인트가 됩니다.' : '대행사를 바꿀 때 광고주가 가장 걱정하는 것은 인수 기간의 성과 공백과 대응 속도입니다.', angle: '보고 주기마다 "다음에 할 일"을 함께 제출하고, 대응 시간 기준을 명시', evidence: c.reportPain ? '제안자 주요사항' : '운영·보고 과업', weight: c.reportPain ? '상' : '중'});
  if (c.budget) pri.push({title: `월 ${fmtWon(c.budget)}에 맞는 매체 수 설계`, why: c.budget < 3e7 ? '예산에 비해 매체가 많으면 매체마다 학습할 데이터가 부족해집니다.' : '예산이 클수록 시즌별 증감과 매체 간 이동 기준이 성과를 좌우합니다.', angle: `핵심 매체 ${mix.length}개, 신규 테스트 예산 별도 편성, 시즌 증액 시점 명시`, evidence: `RFP 예산: ${c.budgetRaw}`, weight: '중'});
  const priorities = pri.slice(0, 7).map((p, i) => ({...p, rank: i + 1}));
  const logic = {
    concept: `${c.B} ${c.year} 성장 설계안 — DISCOVER · DECIDE · RETURN`,
    message: `처음 보는 고객에게 ${c.B}를 알리고(DISCOVER), 비교하는 순간 선택받고(DECIDE), 한 번 산 고객이 다시 돌아오게(RETURN) 만듭니다.`,
    storyline: [
      {title: '현황 확인', point: c.pains.length ? `RFP가 언급한 '${c.pains[0]}'의 원인을 시장·경쟁·고객·매체 데이터로 확인` : '시장·경쟁·고객·매체 데이터로 현재 위치 확인'},
      {title: '과제 정의', point: '신규 고객 발견 · 비교 단계 선택 · 재방문 세 가지 과제로 압축'},
      {title: '전략 구조', point: `세 과제를 세 트랙으로 운영 — 확장 ${stageSum(al, 'upper')}% · 전환 ${stageSum(al, 'mid')}% · 유지 ${stageSum(al, 'low')}% (균형안)`},
      {title: '매체 실행', point: `${mix.length}개 매체의 대상·소재·랜딩·운영 방법·평가 지표·일정`},
      {title: '측정과 운영', point: '단일 측정 기준, 보고 주기별 실행 항목, 자동 대응 기준'},
      {title: '기대 효과', point: c.roasT ? `ROAS ${c.roasT}% 달성 경로와 시나리오별 예상 범위 (전제 조건 포함)` : '시나리오별 예상 범위와 전제 조건'}
    ]
  };
  const ins = [];
  if (chNames.length > 1) ins.push(`판매 채널이 ${chNames.length}개(${chNames.join(' · ')}) — 채널마다 받을 고객을 정하지 않으면 같은 고객에게 광고비를 중복으로 쓸 수 있습니다.`);
  if (c.mix.length){ const def = c.mix.filter(m => /브랜드|리타겟|크리테오|카탈로그/.test(m.name)).reduce((a, m) => a + m.pct, 0); ins.push(`현재 매체 비중에서 이미 아는 고객을 다시 잡는 영역이 약 ${Math.round(def)}% — ${def >= 50 ? '새 고객을 만드는 영역의 비중을 단계적으로 늘릴 여지가 큽니다.' : '구성 자체보다 매체별 운영 품질 개선이 우선입니다.'}`); }
  ins.push(c.young ? `${c.T}은(는) 제품을 검색하기 전에 숏폼·피드에서 먼저 접하는 경우가 많습니다. 검색 이전 단계의 접점이 필요합니다.` : `${c.T}은(는) 제품명보다 고민·상황 키워드로 먼저 검색합니다. 일반 키워드 구간을 확보해야 합니다.`);
  ins.push(`${c.ind.name} 업종의 구매 판단 기준은 ${c.ind.usp}입니다. 광고 메시지와 상세페이지 메시지를 이 기준으로 맞춰야 전환이 올라갑니다.`);
  if (c.ind.compliance) ins.push(`규제: ${c.ind.compliance}`);
  if (c.comp.length) ins.push(`경쟁사(${c.comp.join(', ')})와의 가격대·검색량·광고 노출 비교로 ${c.B}의 위치를 먼저 확인해야 합니다.`);
  const sum = {
    client: c.B, background: c.pains.slice(0, 3).join(' / ') || '(RFP 배경 확인 필요)',
    objective: [c.goals.revenue && '매출 확대', c.goals.roas && '광고 효율(ROAS) 개선', c.goals.newc && '신규 고객 유입', c.goals.member && '회원·재구매', c.goals.aware && '브랜드 인지도', c.goals.app && '앱 성장'].filter(Boolean).join(' · ') || '(목표 확인 필요)',
    kpi: [c.roasT && `ROAS ${c.roasT}%`, c.growth && `성장 ${c.growth}`, c.cpaT && `CPA ${c.cpaT}원`].filter(Boolean).join(' · ') || '(정량 KPI 미기재 → 제안에서 KPI 정의 필요)',
    budget: c.budget ? `월 ${fmtWon(c.budget)} (연 ${fmtWon(c.budget * c.months)})` : '(예산 미기재)', period: `${c.months}개월 (${c.year})`, target: c.T,
    scope: [`매체 운영 (${(c.mentioned.length ? c.mentioned : mix.map(m => m.key)).map(k => (MEDIA_LIB(c)[k] || {}).name).filter(Boolean).slice(0, 6).join(', ')})`, c.creative && '소재 기획·제작', '보고·최적화'].filter(Boolean).join(' / '),
    evaluation: c.evals.map(e => `${e.name} ${e.pts}점`).join(' · ') || '(평가 기준 미기재)', deadline: c.deadline || S.project.due || '', constraints: c.ind.compliance ? [c.ind.compliance] : []
  };
  const qs = [];
  if (!c.budget) qs.push('월·연 광고 예산과 대행 수수료 포함 여부');
  if (!c.roasT && !c.growth) qs.push('정량 목표(ROAS·매출·신규 고객 수)와 측정 기준');
  if (!c.mix.length) qs.push('현재 매체별 예산 비중과 최근 3~6개월 성과 (기준점 산정용)');
  qs.push('회원·구매 고객 데이터를 광고 타겟으로 활용할 수 있는 범위');
  if (c.creative) qs.push('월 소재 제작 수량, 촬영 포함 여부, 브랜드 검수 절차');
  return {rfpSummary: sum, priorities, colors: null, colorConcept: '', brandInsights: ins, logic, sections: planSections(c), questions: qs, engine: true, mix: al.map(m => ({key: m.key, name: m.name, stage: m.stage, pct: m.pct}))};
}

/* ---------- 섹션 플랜 ---------- */
const ROLE_DEF = {
  company: ['회사 소개 및 역량', 'Company', '제안사의 규모·전문성·운영 역량'],
  team: ['운영 조직 및 인력', 'Team', '전담 인력 구성과 업무 분담'],
  brand: ['시장·브랜드 진단', 'Diagnosis', '시장·경쟁·고객·매체 진단과 과제 정의'],
  playbook: ['핵심 전략', 'Strategy', '3트랙 전략 구조와 퍼널 설계'],
  media: ['매체 전략 및 실행안', 'Media Plan', '퍼널 단계별 매체 역할과 매체별 실행 계획'],
  budget: ['예산 운영 계획', 'Budget', '예산 시나리오·매체 배분·시즌 운영'],
  creative: ['크리에이티브 전략', 'Creative', '단계별 메시지와 소재 테스트 방식'],
  kpi: ['KPI 및 성과 측정', 'KPI', '목표 지표·관리 지표·측정 환경'],
  report: ['보고 체계', 'Reporting', '보고 주기와 의사결정 방식'],
  optimize: ['최적화 및 실행 로드맵', 'Action Plan', '자동 대응 기준·단계별 로드맵·착수 준비'],
  tech: ['기술 및 솔루션 활용', 'Technology', '운영 효율을 높이는 도구와 자동화'],
  case: ['운영 사례', 'Case Study', '유사 업종 운영 사례'],
  issue: ['이슈 대응 및 커뮤니케이션', 'Communication', '이슈 단계별 대응과 소통 방식'],
  pricing: ['비용 제안', 'Pricing', '운영 범위와 비용 구조']
};
const ROLE_RE = {company: /회사|역량|일반\s*현황|기업\s*소개|업체\s*소개/, team: /조직|인력|투입|전담|인원/, brand: /시장|진단|현황\s*분석|환경\s*분석|브랜드\s*(이해|분석|스터디)/, playbook: /전략\s*방향|핵심\s*전략|제안\s*개요|컨셉|전략\s*제안|마케팅\s*전략/, media: /매체|미디어\s*전략|채널\s*전략|운영\s*전략|광고\s*운영|운영\s*방안/, budget: /예산|미디어\s*믹스|집행\s*계획|배분/, creative: /소재|크리에이티브|콘텐츠|제작/, kpi: /KPI|성과\s*(지표|분석|측정)|목표\s*설정|측정/, report: /리포트|보고/, optimize: /최적화|고도화|액션\s*플랜|실행\s*계획|로드맵/, tech: /기술|솔루션|툴|자동화/, case: /사례|레퍼런스|포트폴리오|실적/, issue: /이슈|커뮤니케이션|위기|대응/, pricing: /비용|가격|수수료|견적|계약/};
const kindOfRole = r => r === 'company' ? 'company' : r === 'brand' ? 'brand' : r === 'case' ? 'case' : 'strategy';
const inferRole = (t, used = new Set()) => Object.keys(ROLE_RE).find(k => !used.has(k) && ROLE_RE[k].test(t || '')) || 'custom';
function planSections(c){
  let roles;
  if (c.toc){
    const used = new Set();
    roles = c.toc.map(t => { const r = inferRole(t, used); used.add(r); return {role: r, title: t.replace(/^\s*[\d.]+\s*/, '')}; });
    if (!roles.some(r => r.role === 'brand')) roles.splice(Math.min(2, roles.length), 0, {role: 'brand', title: ROLE_DEF.brand[0], added: true});
    if (!roles.some(r => r.role === 'playbook')){ const mi = roles.findIndex(r => r.role === 'media'); roles.splice(mi >= 0 ? mi : roles.length, 0, {role: 'playbook', title: ROLE_DEF.playbook[0], added: true}); }
  } else roles = ['company', 'team', 'brand', 'playbook', 'media', 'budget', 'creative', 'kpi', 'report', 'optimize', 'tech', 'case', 'issue', 'pricing'].map(r => ({role: r, title: ROLE_DEF[r][0]}));
  const hasPB = roles.some(x => x.role === 'playbook');
  return roles.map(r => { const d = ROLE_DEF[r.role] || [r.title, '', '']; const n = enginePool(r.role, c, {title: r.title, hasPlaybook: hasPB}).length; return {role: r.role, title: r.title || d[0], en: d[1], goal: d[2] + (r.added ? ' (RFP 목차 외 추가 권장)' : ''), pages: n + (n >= 2 ? 1 : 0), divider: n >= 2}; });
}

/* ---------- 섹션별 장표 생성 ---------- */
const PG = (type, layout, title, subtitle, items = [], o = {}) => ({type, layout, title, subtitle, keyMsg: o.keyMsg || '', items: items.map(i => Array.isArray(i) ? {h: i[0] || '', d: i[1] || '', v: i[2] || ''} : i), notes: o.notes || '', tag: o.tag || '', source: o.source || '', cols: o.cols || null, prio: o.prio || 2});
function enginePool(role, c, sec = {}){
  const {B, P, T, own, ind} = c, mix = mediaMix(c), al = allocate(mix, 'base'), RS = c.research, A = S.input.analysis || {};
  const bud = c.budget, amt = p => bud ? `월 ${fmtWon(bud * p / 100)}` : '';
  const st = k => STAGE[k], tk = k => al.filter(m => m.stage === k);
  const prop = (S.project.proposer || '제안사').replace(/\s*\(.*\)/, '');
  switch (role){
  case 'company': return [
    PG('strategy', 'hero', `${prop}가 ${B}의 파트너로 적합한 이유`, '규모 · 전문성 · 운영 역량을 숫자로 정리했습니다', [AGENCY.hero, ...AGENCY.points], {notes: AGENCY.note, prio: 1}),
    PG('strategy', 'grid', '주요 매체와의 파트너십', '매체사 인증 등급과 협업 범위', AGENCY.partners, {notes: AGENCY.note, prio: 1}),
    PG('explain', 'grid', '기획부터 실행까지 한 팀 안에서 해결합니다', `${B} 프로젝트에 투입되는 역량 구성`, AGENCY.caps, {prio: 2}),
    PG('strategy', 'cards', '운영에 함께 쓰는 자체 도구', '분석과 실행 속도를 높이는 솔루션 (명칭·기능은 회사 기준으로 수정)', AGENCY.tools, {notes: AGENCY.note, prio: 2}),
    PG('bridge', 'list', '', '', [], {keyMsg: `${B}의 다음 성장 단계를 데이터와 실행으로 함께 만들겠습니다.`, prio: 3})
  ];
  case 'team': return [
    PG('strategy', 'grid', `${B} 전담 인력 구성`, '전략 · 운영 · 제작 · 데이터 담당을 고정 배치합니다', [['총괄 [이름·직급]', '전략 방향과 목표 관리, 광고주 커뮤니케이션 창구', 'Lead'], ['운영 매니저 [이름]', '매체 일정·예산 집행·프로모션 운영', 'Ops'], ['검색 매체 담당 [이름]', '네이버·구글 검색과 쇼핑 영역 운영', 'Search'], ['디스플레이·소셜 담당 [이름]', '메타·GFA 등 피드 매체 운영', 'Social'], ['크리에이티브 담당 [이름]', '소재 기획·제작·테스트 설계', 'Creative'], ['데이터 담당 [이름]', '측정 환경 관리, 성과 분석과 이상 징후 감지', 'Data']], {notes: '실제 투입 인력의 이름·경력으로 교체', prio: 1}),
    PG('explain', 'table', '누가 실행하고 누가 결정하는지 미리 정합니다', `실행은 ${prop}, 최종 결정은 ${B}`, [['예산·프로모션 계획', `${prop} 초안 작성 → ${B} 확정`, '결정'], ['매체 세팅·입찰·예산 집행', `${prop} 실행 → 주간 보고`, '공유'], ['상품 정보·가격·재고', `${prop} 점검 → ${B} 반영`, '협업'], ['소재 기획·제작', `${prop} 제작 → ${B} 검수`, '승인'], ['성과 분석·개선안', `${prop} 작성 → 실행 여부 협의`, '결정']], {cols: ['업무', '진행 방식', `${B} 역할`], prio: 2})
  ];
  case 'brand': {
    const out = [PG('bridge', 'list', '', `시장 · 경쟁 · 고객 · 매체, 네 가지 데이터를 봤습니다.`, [['시장'], ['경쟁'], ['고객'], ['매체']], {keyMsg: `제안에 앞서, ${B}가 지금 어디에 서 있는지부터 확인했습니다.`, prio: 2})];
    if (RS?.market?.length) out.push(PG('strategy', RS.market.some(m => m.value) ? 'kpi' : 'list', RS.marketHead || `${ind.name} 시장의 흐름`, '최근 데이터로 본 카테고리 변화', RS.market.slice(0, 4).map(m => [m.fact, m.note || m.source || '', m.value || '']), {source: RS.market.map(m => m.source).filter(Boolean).slice(0, 3).join(' · '), prio: 1}));
    else out.push(PG('explain', 'table', '진단은 네 가지 질문에서 출발합니다', '각 질문에 답할 데이터와 출처 — 착수 전 수치를 확정합니다', [['시장', `${ind.name} 카테고리 온라인 수요는 커지는가, 어디로 이동하는가`, '통계청 온라인쇼핑동향 · 업계 리포트'], ['경쟁', `${c.comp.length ? c.comp.join('·') : '주요 경쟁 브랜드'}와 비교해 가격·노출·검색량은 어떤가`, '데이터랩 · 공시 · 매체 노출 확인'], ['고객', `${c.T}의 검색·구매 행동은 어떻게 바뀌었나`, '데이터랩 · 검색 트렌드 툴 · 리뷰'], ['매체', '지금 예산은 새 고객과 기존 고객 중 어디에 더 쓰이는가', '광고주 운영 데이터']], {cols: ['구분', '확인할 질문', '데이터 출처'], notes: 'Claude 심화 리서치로 실제 수치를 채우면 시장 데이터 장표로 바뀝니다.', prio: 1}));
    if (RS?.competitors?.length) out.push(PG('explain', 'table', `경쟁 브랜드와 비교한 ${B}의 위치`, '가격대와 포지션 비교', RS.competitors.slice(0, 6).map(x => [x.name, x.position || x.note || '', x.price || '']), {cols: ['브랜드', '포지션 · 특징', '가격대'], source: RS.compSource || '', prio: 1}));
    else if (c.comp.length) out.push(PG('explain', 'table', `${B}가 신경 써야 할 경쟁 구도`, '경쟁사별로 빼앗길 수 있는 지점과 대응 방향', c.comp.map((x, i) => [x, (i === 0 ? '같은 고객을 두고 직접 비교되는 브랜드 — 비교 단계에서 차별점을 분명히 제시' : '가격 경쟁이 일어나는 구간 — 가격보다 가치·혜택 메시지로 대응') + '\n[가격대·검색량 확인 필요]']), {cols: ['경쟁사', '위협 요인 · 대응 방향'], prio: 2}));
    const H = p => /정체|부진|역성장/.test(p) ? [p, '새 고객 유입 영역보다 기존 수요 회수 영역에 예산이 몰려 있을 가능성', '매체별 예산 비중 · 신규 방문 비중'] : /검색|관심/.test(p) ? [p, '핵심 타겟의 관심이 경쟁 브랜드나 다른 카테고리로 옮겨 갔을 가능성', '연령별 검색 점유 · 경쟁사 검색 추이'] : /효율|CPA|ROAS|하락/.test(p) ? [p, '같은 소재 반복 노출로 반응이 떨어졌거나 입찰 경쟁이 심해졌을 가능성', '소재별 CTR 추이 · CPC 변화'] : [p, '비교 검색 단계에서 노출이나 메시지 경쟁력이 약할 가능성', '쇼핑 영역 노출 점유 · 가격 비교'];
    const DEF = [['신규 고객', '새 고객 유입 영역의 예산 비중이 낮을 가능성', '매체별 예산 비중 · 신규 방문 비중'], ['검색 수요', '핵심 타겟의 관심이 경쟁 브랜드로 이동했을 가능성', '연령별 검색 점유'], ['구매 전환', '상세페이지 메시지가 광고 메시지와 다를 가능성', '단계별 이탈률'], ['판매 채널', '채널끼리 같은 키워드에서 경쟁하고 있을 가능성', '키워드별 채널 성과']];
    const hyp = c.pains.map(H); DEF.forEach(d => { if (hyp.length < 4 && !hyp.some(x => x[1] === d[1])) hyp.push(d); });
    out.push(PG('explain', 'table', '드러난 이슈마다 원인 가설을 세웠습니다', '착수 후 한 달 안에 데이터로 확인하고 전략을 조정합니다', hyp, {cols: ['이슈', '원인 가설', '확인할 데이터'], prio: 1}));
    if (c.channels.length > 1) out.push(PG('strategy', 'compare', '판매 채널마다 맡을 역할을 정합니다', `${own}은 회원 관계를, 나머지 채널은 각 채널 안의 구매 수요를 맡습니다`, c.channels.map(k => k === 'own' ? [own, '회원 가입·재구매 등 장기 관계 형성, 성과 측정의 기준 채널', '모든 채널이 같은 고객을 두고 경쟁'] : k === 'smartstore' || k === 'brandstore' ? [k === 'smartstore' ? '스마트스토어' : '브랜드스토어', '네이버 안에서 결제까지 끝내려는 고객을 받는 채널', `브랜드 키워드에서 ${own}과 겹침`] : k === 'coupang' ? ['쿠팡', '빠른 배송·가격 비교 고객 대응, 광고 상한 별도 관리', '가격 경쟁에 끌려가기 쉬움'] : k === 'oliveyoung' ? ['올리브영', '행사 시즌 집중 운영, 오프라인 인지와 연결', '행사 기간 외 노출 공백'] : ['버티컬 플랫폼', '플랫폼 기획전과 연계한 신규 고객 접점', '플랫폼 할인 경쟁에 노출']), {prio: 1}));
    if (RS?.channels?.length) out.push(PG('explain', 'spec', '판매처 상세페이지 점검 결과', '가격·혜택·리뷰·메시지를 직접 확인했습니다', RS.channels.slice(0, 5).map(x => [x.channel, (x.findings || []).join('\n')]), {keyMsg: '광고에서 약속한 내용이 상세페이지에서 바로 확인돼야 구매로 이어집니다', tag: 'CHANNEL CHECK', prio: 1}));
    if (RS?.usp?.length) out.push(PG('strategy', 'cards', `고객이 ${P}을(를) 사는 이유`, '상세페이지와 리뷰에서 확인한 핵심 구매 요인', RS.usp.slice(0, 4).map(u => typeof u === 'string' ? [u, ''] : [u.h || u.title, u.d || u.desc || '']), {prio: 1}));
    if (RS?.voice?.length) out.push(PG('explain', 'split', '고객이 실제로 쓰는 말', '리뷰·커뮤니티에서 모은 표현', RS.voice.slice(0, 4).map(v => typeof v === 'string' ? ['', v] : [v.h || '', v.d || v.text || '']), {keyMsg: RS.voiceHead || '광고 문구는 고객의 말에서 가져옵니다', prio: 2}));
    out.push(PG('bridge', 'list', '', '', [['DISCOVER · 처음 알게 하기'], ['DECIDE · 비교에서 선택받기'], ['RETURN · 다시 오게 하기']], {keyMsg: `진단 결과, ${B}에게 필요한 일은 세 가지로 정리됩니다.`, prio: 1}));
    return out;
  }
  case 'playbook': return [
    PG('strategy', 'cards', `${B} 성장 설계안 — 세 개의 트랙`, '과제 하나에 트랙 하나, 트랙마다 목표 지표를 따로 둡니다', [
      ['DISCOVER · 처음 알게 하기', `검색하기 전의 ${T}에게 먼저 노출하고 브랜드 검색으로 이어지게 합니다 (${tk('upper').map(m => m.name).slice(0, 3).join(', ') || '상위 퍼널 매체'})`, '신규 방문 +10~15% (가정)'],
      ['DECIDE · 비교에서 선택받기', `제품을 비교하는 순간 ${B}가 보이고 고를 이유가 보이게 합니다 (${tk('mid').map(m => m.name).slice(0, 3).join(', ')})`, c.roasT ? `ROAS ${c.roasT}%+` : 'ROAS 개선 (가정)'],
      ['RETURN · 다시 오게 하기', `다녀간 고객은 결제까지, 결제한 고객은 다음 주문까지 이어지게 합니다 (${tk('low').map(m => m.name).slice(0, 3).join(', ')})`, '전환율 · 재구매율 개선 (가정)']
    ], {keyMsg: '목표 수치는 착수 후 첫 달 데이터로 기준점을 잡은 뒤 다시 확정합니다', notes: '(가정) 수치는 업계 일반 범위 기반 예시 — 광고주 데이터 확인 후 조정', prio: 1}),
    PG('strategy', 'funnel', '퍼널 단계별로 매체의 역할을 나눕니다', '트랙별 매체 구성 · 관리 지표 · 예산 비중 (균형안 기준)', ['upper', 'mid', 'low'].map(k => [`${st(k).en} · ${st(k).lb}`, `${st(k).desc}\n${tk(k).map(m => m.name).join(' · ') || '-'}`, `${st(k).type} ${stageSum(al, k)}%  |  ${k === 'upper' ? '도달 · 검색량 변화' : k === 'mid' ? 'ROAS · CTR' : '전환율 · 재구매율'}`]), {prio: 1}),
    PG('strategy', 'matrix', '모든 매체에 공통으로 적용하는 운영 원칙', '매체가 달라도 판단 기준은 하나로 맞춥니다', [['한 고객에게 한 메시지', '고객이 어느 단계에 있는지에 맞춰 메시지 하나만 보여줍니다', 'RULE 1'], ['채널 간 경쟁 금지', '판매 채널마다 받을 고객과 키워드를 정해 서로 입찰하지 않게 합니다', 'RULE 2'], ['작게 시험하고 크게 키우기', '새 매체·소재는 소액 테스트 후 기준을 넘을 때만 확대합니다', 'RULE 3'], ['하나의 성과 기준', '매체별 자체 리포트 대신 통합 분석 도구 기준으로 판단합니다', 'RULE 4']], {prio: 2})
  ];
  case 'media': {
    const pages = [];
    if (!(sec.hasPlaybook ?? S.sections.some(s => s.role === 'playbook' && s.include !== false))) pages.push(...enginePool('playbook', c).slice(1, 2));
    pages.push(PG('explain', 'table', `${mix.length}개 매체로 퍼널 전체를 운영합니다`, '매체별 역할 요약 — 매체별 실행안은 다음 장부터', al.map(m => [m.name, m.role, `${st(m.stage).en} · ${m.pct}%`]), {cols: ['매체', '역할', '트랙 · 예산 비중'], prio: 1}));
    al.forEach(m => pages.push(PG('strategy', 'spec', m.head, m.sub, [['대상', m.who], ['소재', m.what], ['랜딩', m.land], ['운영 방법', m.acts.map((a, i) => `${i + 1}) ${a}`).join('\n')], ['평가 지표', m.kpi], ['일정·예산', m.when + (bud ? `  ·  ${m.pct}% (${amt(m.pct)})` : `  ·  예산 비중 ${m.pct}%`)]], {keyMsg: m.role, tag: `${st(m.stage).en} · ${st(m.stage).type}`, notes: `${m.name}: ${m.role}. 예산 비중은 균형안 기준(가정).`, prio: 1})));
    return pages;
  }
  case 'budget': {
    const sc = {safe: allocate(mix, 'safe'), push: allocate(mix, 'push')};
    return [
      PG('strategy', 'chart', '추천안(균형안)의 매체별 예산 배분', bud ? `월 ${fmtWon(bud)} 기준 · 시즌에 따라 증감` : '예산 비중 기준 — 금액은 예산 확정 후 산출', al.map(m => [m.name, `${st(m.stage).type}${bud ? ' · ' + amt(m.pct) : ''}`, m.pct + '%']), {keyMsg: `확장 ${stageSum(al, 'upper')}% · 전환 ${stageSum(al, 'mid')}% · 유지 ${stageSum(al, 'low')}% — 성과를 보며 확장 트랙 비중을 단계적으로 조정`, prio: 1}),
      PG('explain', 'table', '예산은 세 가지 안으로 준비했습니다', '안별 성격과 트랙 비중, 그리고 감수해야 할 점', [
        ['효율 우선안', `이미 성과가 검증된 검색·리타겟 중심 — 안정적이지만 신규 고객 증가는 제한적 / 확장 ${stageSum(sc.safe, 'upper')}% · 전환 ${stageSum(sc.safe, 'mid')}% · 유지 ${stageSum(sc.safe, 'low')}%`, '단기 ROAS'],
        ['균형안 (추천)', `현재 효율을 지키면서 신규 유입 매체를 단계적으로 확대 / 확장 ${stageSum(al, 'upper')}% · 전환 ${stageSum(al, 'mid')}% · 유지 ${stageSum(al, 'low')}%`, 'ROAS 유지 + 신규 확대'],
        ['성장 우선안', `신규 유입 매체 비중을 크게 늘림 — 초기 2~3개월은 ROAS 하락 가능 / 확장 ${stageSum(sc.push, 'upper')}% · 전환 ${stageSum(sc.push, 'mid')}% · 유지 ${stageSum(sc.push, 'low')}%`, '신규 고객 최대화']
      ], {cols: ['안', '구성과 트랙 비중', '우선 목표'], keyMsg: '균형안으로 시작해 3개월 차 성과를 보고 성장 우선안 전환 여부를 함께 결정합니다', prio: 1}),
      PG('strategy', 'timeline', '수요가 오르기 전에 예산을 먼저 늘립니다', `${ind.name} 업종 연간 시즌 일정과 운영 포인트`, ind.season.map(s => [s[0], s[2], s[1]]), {keyMsg: '시즌 시작 2주 전부터 신규 유입 매체 예산을 늘려 관심 고객을 미리 확보합니다', prio: 2}),
      PG('strategy', 'process', '예산 조정은 주기별로 범위를 정해 둡니다', '조정 주기가 길수록 움직이는 폭을 크게 가져갑니다', [['일 단위 · 이상 지출 차단', '비정상적인 단가 상승·전환 누락은 즉시 멈춤', '0%'], ['주 단위 · 매체 내 조정', '같은 매체 안에서 성과 좋은 캠페인으로 이동', '±10%'], ['월 단위 · 매체 간 조정', '월간 리뷰에서 트랙·매체 비중 재조정', '±20%'], ['시즌 · 사전 증액', '시즌 2주 전부터 확장 트랙 예산 증액', '+20~30%']], {prio: 2})
    ];
  }
  case 'creative': {
    const out = [
      PG('strategy', 'table', '퍼널 단계마다 소재가 답해야 할 질문이 다릅니다', '단계별 핵심 질문 → 메시지 방향 → 확인 지표', [
        ['DISCOVER · 처음 보는 고객', `"이게 왜 나한테 필요하지?" → 고객이 겪는 상황을 먼저 보여주고 ${ind.cut}로 해결 장면 제시`, 'CTR · 시청률'],
        ['DECIDE · 비교하는 고객', `"왜 이 제품이어야 하지?" → ${ind.usp} 근거와 리뷰를 한 화면에`, '전환율 · CPA'],
        ['RETURN · 이미 써 본 고객', `"다시 살 이유가 있나?" → 사용 후 변화, ${ind.offer}, 함께 쓰면 좋은 제품`, '재구매율 · 객단가']
      ], {cols: ['단계', '고객의 질문 → 메시지 방향', '확인 지표'], prio: 1}),
      PG('strategy', 'process', '소재 테스트는 같은 순서로 반복합니다', '가설 → 비교 → 판단 → 기록 (제작 수량·단가는 별도 협의)', [['가설 세우기', '이번 테스트에서 무엇을 확인할지 한 문장으로 정함', '테스트 시트'], ['동시 집행', '같은 조건에서 2~3안을 함께 노출', '최소 2안'], ['판단', '노출량 기준을 채운 뒤 지표로 우열 판단', '기준 충족 시'], ['확대와 기록', '우수안은 사이즈·카피 변형으로 확대, 결과는 테스트 기록에 누적', '월간 공유']], {prio: 1}),
      PG('explain', 'grid', '소재 포맷 구성', `${B} 소재 라인업`, [['숏폼 영상', '고민 장면 → 해결 → 제품 순서의 세로형 영상', '피드·숏폼'], [ind.cut, '실제 사용 장면 위주의 이미지', '전 매체'], ['리뷰·후기형', '구매 고객의 표현을 그대로 살린 카피', '전환 캠페인'], ['비교·정보형', '성분·기능·가격을 한눈에 비교', '검색·쇼핑'], ['변형 소재', '우수 소재를 사이즈·카피만 바꿔 빠르게 확장', '전 매체'], ['시즌 소재', '시즌 일정에 맞춰 사전 제작', '시즌 캠페인']], {prio: 2})
    ];
    if (ind.compliance) out.push(PG('explain', 'split', '광고 심의 기준을 제작 단계에 포함합니다', `${ind.name} 업종 표현 점검 항목`, [['사전 심의', '심의 대상 소재는 심의 통과 후 집행하고 필요 시 심의 번호 표기'], ['효능 표현', '근거 자료가 있는 범위 안에서만 표현, 단정·최상급 표현 배제'], ['체험·전후 비교', '매체 정책과 관련 법령을 확인한 뒤 사용 여부 결정'], ['검수 순서', '제작 → 내부 1차 검수 → 광고주 최종 승인']], {keyMsg: ind.compliance, prio: 1}));
    return out;
  }
  case 'kpi': return [
    PG('strategy', 'kpi', `${B}의 최종 목표 지표 3가지`, '모든 매체 성과는 이 세 지표로 모아서 판단합니다', [['ROAS', '통합 분석 도구 기준 매출 ÷ 광고비, 월 단위 판단', c.roasT ? `${c.roasT}%+` : '[목표 협의]'], ['신규 고객', '처음 방문·처음 구매한 고객 수', '+10~15% (가정)'], ['전환율 · 재구매', '방문 대비 구매 비율과 90일 내 재구매율', '개선 (가정)']], {keyMsg: '목표 수치는 착수 첫 달 데이터로 기준점을 잡은 뒤 확정합니다', prio: 1}),
    PG('explain', 'table', '트랙별로 매일 보는 관리 지표는 다릅니다', '최종 목표와 별도로, 운영 판단에 쓰는 지표', [['DISCOVER', '도달 · 영상 시청률 · 브랜드 검색량 변화', '노출 전후 비교'], ['DECIDE', 'CTR · CPC · ROAS · 첫구매 CPA', '통합 분석 도구'], ['RETURN', '장바구니 → 구매 전환율 · 재구매율 · 객단가', '고객 단위 분석']], {cols: ['트랙', '관리 지표', '측정 방법'], prio: 1}),
    PG('explain', 'list', '측정 환경부터 바로잡습니다', '데이터가 틀리면 모든 판단이 틀립니다 — 런칭 전 점검 항목', [['구매 이벤트 점검', '분석 도구의 구매·매출 값이 실제 주문 데이터와 일치하는지 확인', '착수 전'], ['UTM 규칙', '트랙·매체·소재 단위로 이름 규칙 통일', '착수 전'], ['서버 전환 연동', '메타 CAPI 등 서버 전송으로 전환 누락 최소화', '런칭 전'], ['매체 전환 태그', '네이버·구글 전환 스크립트와 상품 피드 연동 확인', '런칭 전'], ['기준점 설정', '전년 동기·최근 3개월 데이터로 목표 재산정', '첫 달']], {prio: 2})
  ];
  case 'report': return [
    PG('explain', 'table', '보고마다 "다음에 할 일"을 함께 드립니다', '보고 주기별 내용 — 시간은 협의 후 확정', [['일간', '핵심 지표 요약 + 이상 징후 알림 + 당일 조치 내용', '[시간 협의]'], ['주간', '매체·소재별 성과 + 다음 주 실행 항목 3가지', '[요일 협의]'], ['월간', '목표 달성률, 예산 조정안, 테스트 결과 정리', '[일정 협의]'], ['분기', '전략 점검과 다음 분기 테스트 계획', '[일정 협의]']], {cols: ['주기', '내용', '시점'], prio: 1}),
    PG('strategy', 'process', '보고는 결정과 실행으로 이어지는 구조로 운영합니다', '보고 → 결정 → 실행 → 결과 공유', [['보고', '성과와 원인, 제안 사항 정리', ''], ['결정', `${B}와 실행 여부·우선순위 합의`, ''], ['실행', '합의된 항목을 일정 안에 반영', ''], ['결과 공유', '다음 보고에서 실행 결과를 먼저 보고', '']], {keyMsg: c.reportPain ? '보고서의 양이 아니라, 보고 후 실제로 바뀐 것으로 평가받겠습니다' : '반복 집계는 자동화하고, 분석과 실행에 시간을 씁니다', prio: 1})
  ];
  case 'optimize': return [
    PG('strategy', 'table', '자주 생기는 상황은 대응 기준을 미리 정해 둡니다', '조건이 맞으면 바로 조치 — 기준값은 착수 후 데이터로 확정 (예시)', [['단가 급등', '며칠 연속 CPC가 크게 오르면 입찰 상한 조정과 키워드 점검', '자동 알림'], ['전환 없는 지출', '전환 없이 일정 금액 이상 소진되면 해당 광고 일시 중지', '자동'], ['반응 저하', '같은 소재의 CTR이 계속 떨어지면 교체', '주간 점검'], ['품절·링크 오류', '해당 상품 광고 즉시 중지 후 복구 시 재개', '자동'], ['예산 과소진', '일 예산 대비 소진 속도가 빠르면 배분 조정', '자동 알림'], ['목표 미달 지속', '축소 → 개선 테스트 → 중단 순서로 판단', '월간 리뷰']], {cols: ['상황', '대응', '방식'], prio: 1}),
    PG('strategy', 'timeline', '1개월 · 3개월 · 6개월 실행 로드맵', '단계별 목표와 주요 산출물', [['착수 전 4주', '계정·측정·피드 점검, 캠페인 구조 설계, 기준 데이터 확보', '준비'], ['1개월', '소재·타겟 테스트, 매체 학습 안정화', '안정화'], ['3개월', '검증된 소재·매체 중심으로 예산 확대, 확장 트랙 비중 조정', '확장'], ['6개월', '재구매·회원 트랙 고도화, 자동 대응 기준 정착', '고도화'], ['12개월', '연간 성과 리뷰와 다음 해 계획', '리뷰']], {prio: 1}),
    PG('explain', 'table', '착수 준비 — 누가 · 언제 · 무엇을', '런칭일 기준 역산 일정', [['계정·권한 확인', `${prop} 운영 담당 + ${B} 마케팅팀 — 매체 계정 권한·결제 정보`, 'D-28'], ['측정 환경 점검', `${prop} 데이터 담당 — 구매 이벤트·전환 연동 확인`, 'D-21'], ['상품 피드 정비', `${prop} 운영 담당 + ${B} 상품 담당 — 상품명·속성·이미지`, 'D-14'], ['런칭 소재 준비', `${prop} 크리에이티브 → ${B} 검수`, 'D-10'], ['캠페인 세팅·검수', `${prop} 운영 담당 — 구조·타겟·예산 점검`, 'D-3'], ['런칭·집중 모니터링', `${prop} 운영·데이터 담당 — 첫 2주 일간 점검`, 'D-Day']], {cols: ['업무', '담당 · 내용', '시점'], prio: 1})
  ];
  case 'tech': return [
    PG('strategy', 'cards', '운영 효율을 높이는 도구를 함께 씁니다', '분석과 반복 작업 시간을 줄여 실행에 집중합니다 (명칭은 회사 기준으로 수정)', AGENCY.tools, {prio: 1}),
    PG('explain', 'table', '반복 업무는 자동화로 처리합니다', '사람이 놓치기 쉬운 부분을 시스템이 먼저 감지', [['데이터 수집', '매체·분석 도구 데이터 자동 수집과 정리', '매일'], ['이상 감지', '지표 급변·소진 이상 자동 알림', '실시간'], ['상품 상태 연동', '품절·가격 변동 시 광고 상태 자동 변경', '실시간'], ['소재 변환', '매체별 규격에 맞춘 소재 변환', '수시'], ['일정 예약', '기획전·시즌 캠페인 시작·종료 예약', '일정별']], {cols: ['영역', '내용', '주기'], prio: 2})
  ];
  case 'case': return [
    PG('strategy', 'cards', '비슷한 과제를 해결한 경험', `${ind.name} 또는 유사 업종 사례 (회사 실적으로 입력)`, [['[업종] [브랜드] 사례 1', '과제: [ ] / 실행: [ ] / 결과: [ ]', '[핵심 성과]'], ['[업종] [브랜드] 사례 2', '과제: [ ] / 실행: [ ] / 결과: [ ]', '[핵심 성과]'], ['[업종] [브랜드] 사례 3', '과제: [ ] / 실행: [ ] / 결과: [ ]', '[핵심 성과]']], {notes: '회사 공식 사례로 입력 — 수치는 광고주 동의 범위 내에서 지수화 권장', prio: 1}),
    PG('explain', 'process', `사례에서 검증한 방식을 ${B}에 이렇게 적용합니다`, '사례 → 공통점 → 적용 계획', [['과제의 공통점', `[사례와 ${B} 과제의 공통점]`, ''], ['검증된 방식', '[사례에서 효과가 확인된 실행]', ''], [`${B} 적용`, '[이번 제안에서 어떻게 쓰는지]', ''], ['예상 효과', '[범위 + 전제 조건]', '']], {prio: 2})
  ];
  case 'issue': return [
    PG('explain', 'table', '이슈는 영향도에 따라 세 단계로 대응합니다', '알림 → 임시 조치 → 원인 분석 → 재발 방지', [['Level 1 (긴급)', '광고 중단·과금 오류·사이트 장애 — 원인 확인 전이라도 즉시 공유하고 임시 조치', '즉시'], ['Level 2 (주의)', '지표 급변·상품 정보 오류 — 당일 원인 분석과 조치 결과 공유', '당일'], ['Level 3 (일반)', '소재 반려·세팅 변경 요청 — 정해진 기한 내 처리', '[기한 협의]']], {cols: ['단계', '상황 · 대응', '대응 시간'], prio: 1}),
    PG('strategy', 'kpi', '소통 기준을 숫자로 약속합니다', '서비스 기준 (제안값 — 협의 후 확정)', [['긴급 이슈 첫 응답', '인지 후 첫 공유까지 걸리는 시간', '[30분]'], ['정기 보고', '일간·주간 보고 발송 시점', '[협의]'], ['신규 요청 처리', '캠페인·소재 요청 처리 기간', '[영업일 기준]'], ['인수 기간 성과 관리', '전환 기간 성과 하락 시 대응 기준', '[협의]']], {prio: 1})
  ];
  case 'pricing': return [
    PG('explain', 'table', '비용 제안', '운영 범위와 비용 구조 — 금액은 협의 후 확정', [['매체 운영 대행', `${mix.length}개 매체 운영 · 최적화 · 보고`, '[수수료율]'], ['소재 제작', '월 제작 수량·포맷 기준 (촬영 별도)', '[단가]'], ['초기 세팅', '측정 환경·상품 피드 점검', '[조건]'], ['솔루션 사용', '분석·자동화 도구', '[조건]']], {cols: ['항목', '범위', '비용'], notes: '비용은 내부 승인 후 기입', prio: 1})
  ];
  default: return customPool(c, sec);
  }
}
/* 직접 구성 섹션: 제목·목표와 분석 결과로 실제 내용 작성 */
function customPool(c, sec){
  const A = S.input.analysis || {}, title = sec.title || '추가 섹션', words = (title + ' ' + (sec.goal || '')).replace(/[^\w가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  const rel = (A.priorities || []).filter(p => words.some(w => (p.title + p.angle + p.why).includes(w)));
  const pr = (rel.length ? rel : (A.priorities || [])).slice(0, 4);
  const out = [];
  out.push(PG('strategy', 'split', `${title}: 핵심 방향`, sec.goal || `${c.B}에 필요한 이유와 실행 방법`, pr.length ? pr.map(p => [p.title, p.angle || p.why]) : [['왜 필요한가', `${c.B}의 현재 상황에서 이 항목이 중요한 이유`], ['무엇을 하는가', '실행 항목과 담당'], ['어떻게 확인하는가', '성과 지표와 확인 시점']], {keyMsg: A.logic?.message || `${c.B}의 목표 달성을 위한 ${title}`, prio: 1}));
  out.push(PG('strategy', 'timeline', `${title} 실행 계획`, '단계별 실행 내용과 산출물', [['준비', `${title} 관련 현황 점검과 기준 설정`, '점검표'], ['1개월', '우선 과제 실행과 초기 결과 확인', '중간 보고'], ['3개월', '효과 확인된 방식 확대', '확대안'], ['6개월', '운영 방식 정착과 고도화', '결과 보고']], {prio: 2}));
  return out;
}
function generateEngine(sec){
  const c = signals();
  let role = sec.role && sec.role !== 'custom' ? sec.role : inferRole(sec.title + ' ' + (sec.goal || ''));
  if (sec.kind && sec.kind !== 'strategy' && role === 'custom') role = sec.kind;
  let pool = enginePool(role, c, sec);
  const N = Math.max(1, +sec.pages || pool.length), useDiv = sec.divider && N >= 2, room = N - (useDiv ? 1 : 0);
  if (pool.length > room){ const keep = new Set(pool.map((p, i) => [p.prio, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, room).map(x => x[1])); pool = pool.filter((p, i) => keep.has(i)); }
  if (pool.length < room){ const extra = customPool(c, sec); let k = 0; while (pool.length < room && k < extra.length) pool.push(extra[k++]); }
  const out = pool.map(p => newPage(p.type, p));
  if (useDiv) out.unshift(newPage('divider', {title: sec.title, subtitle: sec.goal || '', items: (ROLE_DEF[role]?.[2] || '').split(/[·,]/).filter(Boolean).slice(0, 4).map(h => ({h: h.trim(), d: '', v: ''}))}));
  return out;
}

/* ---------- 디자인 워싱 레이아웃 후보 ---------- */
function layoutCandidates(p){
  const it = itemsOf(p), n = it.length, hasV = it.filter(i => i.v && !/^\[/.test(i.v) && /\d/.test(i.v)).length >= Math.ceil(n / 2), pctV = it.filter(i => /^\s*\d+(\.\d+)?\s*%\s*$/.test(i.v || '')).length >= Math.max(2, n - 1);
  const seq = it.some(i => /STEP|단계|D-|개월|주차|\d+\s*월|→|Daily|Weekly|Monthly/i.test(i.h + ' ' + (i.v || '')));
  const c = [];
  if (p.layout === 'image') return ['image'];
  if (p.layout === 'spec' || p.layout === 'compare' || p.layout === 'funnel') c.push(p.layout);
  if (pctV && n >= 3) c.push('chart');
  if (hasV && n <= 4) c.push('kpi', 'hero');
  if (seq) c.push(n <= 6 ? 'timeline' : 'table', 'process');
  if (n === 4) c.push('matrix', 'cards');
  if (n >= 5 && n <= 6) c.push('grid', 'table');
  if (n >= 7) c.push('table', 'list');
  if (n >= 2 && n <= 3) c.push('cards', 'split');
  if (p.keyMsg && n <= 5) c.push('split');
  c.push('list', 'table');
  return [...new Set(c)];
}
