/* =========================================================
   Proposal Studio v2 — 내장 전략 엔진 (API 키 불필요)
   매드업 레퍼런스 제안서(라코스테 2027, 131p) 구조·논리를 학습한 규칙 기반 전략가
   진단 → 과제(3트랙) → 플레이북 → 퍼널 맵 → 매체별 액션 → 예산 시나리오 → 크리에이티브 → KPI → 리포팅 → 최적화 → 사례 → 이슈 → 비용
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

/* ---------- 매드업 회사·사례 자료 (2026.11 라코스테 제안서 기준 — 최신화 확인) ---------- */
const MADUP = {
  src: '매드업 라코스테 제안서(2026.11) 기준 — 제출 전 최신 수치 확인',
  hero: ['2025년 취급고', '10년간 300배 성장 · 2026년 7월 코스닥 상장 · 커머스 고객의 성장이 곧 매드업의 성장', '3,830억'],
  points: [['장기 파트너십', '장기 고객사 50% 이상, 5년 이상 파트너십 30%', '50%+'], ['데이터·개발 조직', '약 50명 규모가 운영 전 과정을 지원 (리포트 자동화·AI 분석)', '50명'], ['AI 리포팅', '자체 AI 리포팅으로 분석 리소스 85% 절감 → 원인 분석·액션에 집중', '-85%']],
  partners: [['Google Premier Partner', '국내 상위 3% 대행사 · 신기능 베타 지원', '상위 3%'], ['Meta Badged Partner', '파트너십 최상위 Premium 티어 · 2021~2025', 'Premium'], ['네이버 프리미엄 파트너', 'SA/DA 통합 운영 · 분야별 최적화 데이터', 'Premium'], ['Kakao Premium Partner', '공식 대행사 중 20개사 한정 선정', 'TOP 20'], ['TikTok Deal Agency', '5년 연속 선정 · TAIP 참여사', '5년 연속'], ['Criteo 에이전시 어워즈', '5년 연속 수상 (2021~2025)', '5년 연속']],
  solutions: [['레버 엑스퍼트', '매체·3rd Party·트래커 데이터 통합 적재 → 리포트 자동화, 소재 자동 라벨링·성과 분석'], ['마일럿 (운영 자동화)', '네이버·메타·틱톡·카카오 운영 자동화, MCP로 변경 이력까지 추적 → 휴먼 에러 방지'], ['AI 크리에이티브', 'AI 스튜디오(룩북 대체)·템플릿 기반 소재 자동 제작·리사이징 봇'], ['GEO Schema', '상세페이지에 AI 검색 최적화 구조 생성 → AI 대화형 검색 가시성 확보']],
  org: [['퍼포먼스 마케팅', '국내 캠페인 기획·매체 운영'], ['크리에이티브 본부', '디자인·영상·AI CR·촬영 내재화'], ['데이터 컨설팅', 'Data-driven 광고 설계·분석'], ['솔루션 사업부문', 'Ad Ops·Service Platform 개발'], ['미디어렙', '매체 파트너십·미디어 플래닝'], ['글로벌·브랜드 본부', '글로벌 캠페인·풀퍼널 브랜드 캠페인']],
  awards: [['메타 에이전시 퍼스트 어워즈', '5년 연속 수상 (2021~2025)'], ['구글 검색광고 어워즈', '3년 연속 수상 (2023~2025)'], ['대한민국 디지털 광고대상', '2025 디지털 영상 부문 대상']],
  cases: [
    {ind: 'fashion', h: '패션 브랜드 G사', v: 'ROAS 151%', d: '광고 중단 없이 4주 만에 안정화, 채널별 분리 운영·자동화로 성수기 목표 초과 달성'},
    {ind: 'fashion', h: '패션 브랜드 M사', v: '스토어 ROAS +49%', d: '공식몰·브랜드스토어 역할 분리(90:10) — 18~24세 구매 비중 3%→17%'},
    {ind: 'commerce', h: '패션 플랫폼 L사', v: 'ROAS +52%', d: '쇼핑검색 목표 이원화(히어로=유입 / 상시=매출)로 CPC 급등 방지, 첫구매 CPA -30%'},
    {ind: 'commerce', h: '패션 플랫폼 M사', v: 'ROAS +170%', d: '분할 화보·페이크 카탈로그로 소재 확장, 신규 촬영 없이 CPA -40%'},
    {ind: 'fashion', h: '패션 브랜드 K사', v: '구매 +55%', d: '성과 데이터로 상품컷 우위 확인 → 상품 이미지 중심 소재 전환, CPA -35%'},
    {ind: 'commerce', h: '패션 플랫폼 S사', v: 'CVR +2.3%p', d: '첫구매↔재구매 카테고리 연결 타겟으로 기획전 운영, ROAS +80%p'}
  ]
};

/* ---------- 매체 라이브러리 (c = 컨텍스트) ---------- */
function MEDIA_LIB(c){
  const {B, P, T, own, ind, kw} = c;
  return {
    naverBrand: {name: '네이버 브랜드검색', stage: 'mid', w: 12,
      head: `브랜드검색은 '${B}'를 찾는 고객을 ${own}으로 확실히 받습니다.`, sub: `브랜드·브랜드+품목 키워드는 ${own}으로 일원화하고, 정액 고정비는 재계약 시점에 줄입니다.`,
      role: `'${B}' 검색 수요를 ${own} 매출로 — 브랜드 수요 방어`, who: `'${B}' · '${B} ${P}' 등 브랜드 검색 고객`, what: `신상·베스트 썸네일 + ${own} 전용 혜택(${ind.offer}) 문구`, land: `${own} 메인 · 시즌 기획전`,
      acts: [`브랜드·브랜드+품목 키워드는 ${own} 캠페인에서만 입찰 — 스토어와 동시 입찰로 인한 클릭 분산 방지`, '브랜드소식·썸네일을 시즌·프로모션 주기(월 2회)로 교체하고 CTR 전후 비교', '정액 상품은 비수기 단가 적용 시점에 재계약해 고정비 절감 검토'],
      kpi: '브랜드검색 CTR · 유입 수 · ROAS', when: 'D-7 소재 확정 → 월 단위 교체'},
    naverPL: {name: '네이버 파워링크', stage: 'mid', w: 8,
      head: '파워링크는 브랜드명을 모르는 탐색 고객을 비교 후보로 끌어옵니다.', sub: '브랜드 / 비브랜드 / 경쟁 키워드를 분리해 목표 순위와 입찰을 다르게 관리합니다.',
      role: '비브랜드 탐색 키워드로 비교 후보 진입', who: `'${kw[0]}' · '${kw[1]}' 등 품목·니즈 검색 고객`, what: `${ind.usp} 중심 확장소재 (가격·혜택·리뷰 수)`, land: '카테고리 · 상품 상세',
      acts: ['브랜드/비브랜드/경쟁 키워드 캠페인 분리 — 비브랜드는 목표 순위 3~5위로 효율 관리', '검색어 리포트 주간 점검: 전환 없는 키워드 제외, 신규 키워드 확장', '요일·시간대 매출 패턴에 맞춘 입찰 가중치 적용'],
      kpi: '비브랜드 클릭 · CPC · 전환율', when: '1개월 테스트 → 2개월차 확장'},
    naverShop: {name: '네이버 쇼핑검색', stage: 'mid', w: 14,
      head: '쇼핑검색은 비교가 시작되는 순간마다 상품을 먼저 올려둡니다.', sub: '상품명·이미지·속성 피드를 정비하고, 검색 의도별로 캠페인과 랜딩을 나눕니다.',
      role: '품목 비교 구간 점유 — 상품 정보가 곧 노출', who: '품목·카테고리를 비교하는 검색 고객', what: '상품명·이미지·속성이 정비된 상품 피드', land: '상품 상세 (네이버 멤버십 고객은 스토어)',
      acts: ['상품명 3요소(카테고리·핵심 속성·타겟) 정비 → 키워드 등록 없이 노출 키워드 확대', '의도별 캠페인 분리: 브랜드 / 브랜드+품목 / 시즌·선물 — 랜딩·입찰 목표를 다르게', '품절·가격 열세 SKU 입찰 자동 하향, 7~14일 주기 CTR 하락 소재 교체'],
      kpi: '쇼핑검색 ROAS · CTR · CVR', when: 'D-14 피드 정비 → 런칭 → 주간 소재 점검'},
    gfa: {name: '네이버 GFA (홈피드·클립)', stage: 'upper', w: 8,
      head: '네이버 신규 도달은 홈피드 → 클립 → 카페 홈피드 3단으로 넓힙니다.', sub: '처음 만나는 고객에게 시즌 비주얼로 각인하고, 반응 고객을 검색·전환 모수로 넘깁니다.',
      role: '네이버 첫 화면에서 처음 만나는 고객에게 각인', who: `${T} · 카테고리 관심사 · 경쟁 브랜드 관심층`, what: `시즌 대표 비주얼 → ${ind.cut}`, land: `${own} 컬렉션 · 기획전`,
      acts: ['홈피드(넓게 도달) → 클립(숏폼 각인) → 카페 홈피드(관심사) 3단 운영', '도달·조회 완료 고객을 리타겟 모수로 적재해 쇼핑검색·전환 캠페인과 연결', '2주 단위 소재 테스트, 브랜드 검색 리프트로 증분 판정'],
      kpi: '도달 · 조회 완료율 · 브랜드 검색 리프트', when: '1개월 도달 테스트 → 리프트 확인 후 확대'},
    gfaConv: {name: '네이버 GFA 전환·카탈로그', stage: 'low', w: 6,
      head: 'GFA 전환은 네이버 안에서 멈춘 고객을 다시 데려옵니다.', sub: '이탈 경과일별로 메시지를 나누고, 본 상품을 자동으로 다시 보여줍니다.',
      role: '네이버 내 이탈 고객 재방문 → 첫구매', who: `${own} 방문·상품 조회·장바구니 이탈 고객 (7·14·30일)`, what: '본 상품 자동 노출(카탈로그) + 회원 혜택 문구', land: '본 상품 상세',
      acts: ['카탈로그 판매 캠페인 상시 + 방문자 리타겟 전환 캠페인 병행', '이탈 경과일별 메시지 분리 (리마인드 → 혜택 → 대체 상품)', '전환 추적 스크립트·EP 연동 정합성을 착수 D-7에 점검'],
      kpi: '첫구매 전환율 · 장바구니→구매율', when: '상시 운영 · 주간 세그먼트 점검'},
    metaReach: {name: '메타 릴스 (신규 도달)', stage: 'upper', w: 12,
      head: `메타 신규 도달은 릴스 15초로 ${T}의 피드에 ${B}를 띄웁니다.`, sub: '검색하지 않는 고객은 릴스에서 만납니다. 훅 → 사용 장면 → 대표 상품 순으로 보여줍니다.',
      role: `검색하지 않는 ${T}를 피드에서 먼저 만나기`, who: `${T} · 경쟁 브랜드 관심 · 유사 타겟`, what: `릴스 15초: 0–3초 훅 → ${ind.cut} → 대표 상품`, land: `${own} 컬렉션 · 대표 상품`,
      acts: ['9:16 세로·사운드 온 릴스 전용 소재 — 첫 3초 안에 로고·무드로 스크롤 정지', '크리에이터 파트너십 광고로 브랜드 계정 밖 신규 도달 확보', '조회·참여 고객을 전환 캠페인 모수로 적재'],
      kpi: '도달 · ThruPlay · 검색 리프트', when: '2주 소재 테스트 → 승자 소재 확장'},
    metaConv: {name: '메타 전환·카탈로그', stage: 'low', w: 16,
      head: '메타는 비교 중인 고객을 구매로, 구매 고객을 재구매로 연결합니다.', sub: '카탈로그 광고와 CAPI로 "살 사람"을 정확히 찾고, 구매 후엔 다음 상품을 제안합니다.',
      role: '구매 직전 이탈 회수 + 재구매·교차구매', who: '상세 조회·장바구니 이탈 고객, 구매 고객 목록', what: '카탈로그(다이내믹) + 커스텀 피드 (할인율 대신 리뷰·혜택 배지)', land: '본 상품 상세',
      acts: ['픽셀 + CAPI(전환 API)로 구매 신호 유실 방지 → 학습 정확도 개선', 'Advantage+ 쇼핑(신규)과 리타겟 카탈로그(재방문) 역할 분리', `구매 고객에게 교차·상위 상품 제안 (${c.indKey === 'fashion' ? '코디' : c.indKey === 'beauty' ? '루틴' : '세트·연관'} 제안)`],
      kpi: '구매 CPA · ROAS · 재구매율', when: 'D-14 CAPI 세팅 → 상시 운영'},
    googleSearch: {name: '구글 검색·쇼핑(PMax)', stage: 'mid', w: 8,
      head: '구글은 검색과 쇼핑 지면에서 구매 직전 고객을 받습니다.', sub: '브랜드·비브랜드 캠페인을 제외 키워드로 나눠 잠식을 막고, 쇼핑 지면은 상품 피드로 점유합니다.',
      role: '구글 검색·쇼핑 지면의 구매 직전 고객 확보', who: '브랜드 / 비브랜드 검색 고객 (상호 제외 키워드로 분리)', what: '반응형 검색광고 + Merchant Center 상품 피드', land: '카테고리 · 상품 상세',
      acts: ['브랜드·비브랜드 캠페인 상호 제외 키워드 등록 — 같은 검색에 두 캠페인 동시 입찰 방지', 'Merchant Center 필수 속성(상품명·가격·재고·이미지) 정비 후 PMax로 쇼핑 지면 확보', '검색어 리포트 주간 검증, 전환 기여 키워드 중심 확장'],
      kpi: 'ROAS(GA4) · 신규 구매 비중', when: 'D-14 피드 연동 → 4주 학습 → 확장'},
    demandGen: {name: '구글 Demand Gen·유튜브', stage: 'upper', w: 6,
      head: '구글 검색이 끌어오고, Demand Gen이 상품으로 보여줍니다.', sub: '검색어 기반 세그먼트로 비교 중인 고객에게 숏츠·상품 피드를 노출합니다.',
      role: '유튜브·디스커버에서 관심 만들기', who: '검색 의도 세그먼트 · 경쟁 브랜드 관심층', what: '숏츠 세로 영상 + 상품 피드 연동 이미지', land: '상품 상세',
      acts: ['검색어 기반 맞춤 세그먼트로 비교 중인 고객 타겟', '숏츠 6초/15초 영상 A/B, 상품 피드 연동으로 클릭 → 상세 연결', '브랜드 검색 리프트·신규 방문으로 증분 판정'],
      kpi: '신규 방문 · 조회율 · 검색 리프트', when: '6주 테스트 → 리프트 확인 후 확대'},
    kakao: {name: '카카오 비즈보드·톡채널', stage: 'low', w: 4,
      head: '카카오는 시즌엔 비즈보드로 넓게, 평소엔 톡채널로 재구매를 만듭니다.', sub: '상시 광고비 대신 회원 메시지와 행사 기간 광고로만 운영합니다.',
      role: '친구 모수 적립 + 회원 재구매', who: '카카오톡 이용자(시즌) · 채널 친구·구매 고객(상시)', what: '시즌 런칭·기획전 비즈보드 + 회원 대상 브랜드 메시지', land: '채널홈 → 회원가입 · 기획전',
      acts: ['빅시즌(런칭·가정의 달·연말)에만 비즈보드 집행해 채널 친구 모수 적립', '구매 고객은 광고 대상에서 제외하고 톡채널 메시지로 재구매 유도', '친구 추가 혜택은 할인 대신 포인트·신상 소식으로'],
      kpi: '채널 친구 증가 · 메시지 CTR · 재구매', when: '시즌 D-14 집행 · 상시 메시지 월 2회'},
    criteo: {name: '크리테오', stage: 'low', w: 8,
      head: '크리테오는 본 상품 재노출과 추천 쇼케이스로 객단가까지 올립니다.', sub: '리타겟을 첫구매·재구매 트랙에 맞춰 다시 짜고, 신규 캠페인과 대상이 겹치지 않게 나눕니다.',
      role: '리타겟 재노출 + 추천으로 객단가 상승', who: '방문·조회·장바구니 고객, 구매 고객(교차)', what: '다이내믹 리타겟 배너 + 추천 상품 쇼케이스', land: '본 상품 · 추천 상품 상세',
      acts: ['리타겟을 첫구매/재구매 트랙에 맞춰 재구성 — 신규 캠페인과 대상 중복 제거', '할인 배지 대신 혜택·리뷰 배지로 피드 커스텀', '시즌 쇼케이스로 객단가 높은 상품 묶음 노출'],
      kpi: 'ROAS · 객단가 · 재구매율', when: '상시 · 월간 트랙별 리뷰'},
    tiktok: {name: '틱톡 (Spark Ads)', stage: 'upper', w: 5,
      head: '틱톡은 크리에이터 영상을 테스트하고, 반응이 검증된 소재만 키웁니다.', sub: '적은 예산으로 시작하는 신규 도달 — 6주차에 확대/중단을 판정합니다.',
      role: '크리에이터 영상 테스트 → 검증 소재 증폭', who: `${T} 중심 2030 · 관심사 확장`, what: `크리에이터 ${ind.cut} 영상 (할인 고지 없이)`, land: `${own} 컬렉션`,
      acts: ['1–2주: 시딩 또는 기존 영상 확보 → 3–4주: 6초 조회율 상위 영상만 선별', '검증 영상만 Spark Ads로 원본 그대로 증폭 (좋아요·댓글 함께 축적)', '6주차 확대/중단 판정 · 승자 소재를 메타로 이식'],
      kpi: '6초 조회율 · 완료율 · 신규 도달', when: '6주 테스트 (예산의 5% 내외)'},
    coupang: {name: '쿠팡 광고', stage: 'mid', w: 10,
      head: '쿠팡은 가격 비교 구매 수요를 상위 노출로 회수합니다.', sub: '베스트 SKU는 수동 키워드로, 롱테일은 스마트 광고로 — 자사몰과 가격 정책을 맞춥니다.',
      role: '쿠팡 내 비교 구매 수요 회수', who: '쿠팡 품목 검색·비교 고객', what: '상품 광고 (AI 스마트 광고 + 수동 키워드)', land: '쿠팡 상품 상세',
      acts: ['베스트 SKU 수동 키워드 캠페인 + 롱테일은 스마트 광고', '리뷰·평점 확보 상품 중심 입찰, 재고·가격 경쟁력 연동', `${own} 대비 가격 정책 가이드로 채널 간 갈등 방지`],
      kpi: '쿠팡 광고 ROAS · 전환 매출', when: '2주 학습 → 주간 키워드 정리'},
    appUA: {name: '앱 UA (구글 App·메타·ASA)', stage: 'upper', w: 20,
      head: '앱 UA는 설치에서 첫 구매까지 이어지는 이벤트로 최적화합니다.', sub: 'MMP 기준으로 매체별 기여와 리텐션을 같은 잣대로 측정합니다.',
      role: '설치 → 가입 → 첫 구매 UA', who: '유사 타겟 · 관심사 · 재참여 대상', what: '앱 전용 혜택 소재 (첫 구매 쿠폰·포인트)', land: '앱 스토어 → 딥링크 상품',
      acts: ['구글 App·메타 앱·ASA 매체별 이벤트 최적화 (설치→가입→구매)', 'MMP로 매체별 기여·리텐션 D1/D7 측정', '재참여 캠페인으로 휴면 유저 복귀'],
      kpi: 'CPI · 가입 CPA · D7 리텐션', when: '4주 학습 → 이벤트 최적화 전환'}
  };
}
const STAGE = {upper: {k: 'T1', en: 'FIND', ko: '창출형', lb: 'Upper funnel', desc: '처음 만나는 고객에게 노출 → 검색으로 연결'}, mid: {k: 'T2', en: 'WIN', ko: '수확형', lb: 'Mid funnel', desc: '찾아온 고객을 구매 채널로'}, low: {k: 'T3', en: 'KEEP', ko: '전환형', lb: 'Low funnel', desc: '방문 고객은 첫구매로 · 구매 고객은 재구매로'}};

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
  const pains = [...new Set((rfp + '\n' + I.notes).split(/\n|(?<=다\.)\s/).map(s => s.trim()).filter(s => s.length > 6 && s.length < 160 && painRe.test(s)).map(s => s.replace(/^[\d.)\-·•\s]+/, '').replace(/^[-·•\s]*(배경|현황|문제점?|이슈)\s*[:：]\s*/, '')).flatMap(s => s.split(/\s*(?:,|및|그리고)\s*/)).map(s => s.trim()).filter(s => s.length > 3 && painRe.test(s)).map(s => s.slice(0, 40)))].slice(0, 5);
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
  const ch = {own: c.own, smartstore: '스마트스토어', brandstore: '브랜드스토어', coupang: '쿠팡', oliveyoung: '올리브영', platform: '패션 플랫폼'};
  const chNames = c.channels.map(k => ch[k]).filter(Boolean);
  const pri = [];
  if (c.evals.length){ const e = c.evals[0]; pri.push({title: `배점 1순위 '${e.name}'에서 승부`, why: `평가표 최대 배점(${e.pts}점) — 여기서 차이를 못 내면 다른 항목으로 만회하기 어렵습니다.`, angle: `'${e.name}'을 진단→과제→전략→액션이 한 줄로 이어지는 논리로 보여주고, 장표 비중을 가장 크게 배정`, evidence: `평가 배점: ${c.evals.slice(0, 5).map(x => x.name + ' ' + x.pts).join(' · ')}`, weight: '상'}); }
  if (c.roasT || c.growth){ pri.push({title: `${c.roasT ? `ROAS ${c.roasT}%` : `매출 ${c.growth} 성장`} '달성 구조' 증명`, why: '목표 수치를 반복하는 제안은 많습니다. 평가위원은 "어떻게 거기까지 가는지"의 근거를 봅니다.', angle: '트랙별 KPI 트리 + 예산 시나리오 3안 + 월별 램프업으로 달성 경로를 숫자로 제시', evidence: `RFP 목표: ${[c.roasT && 'ROAS ' + c.roasT + '%', c.growth && '성장 ' + c.growth, c.cpaT && 'CPA ' + c.cpaT + '원'].filter(Boolean).join(' · ')}`, weight: '상'}); }
  if (c.pains.length){ pri.push({title: '정체 원인을 데이터로 먼저 짚기', why: '배경 이슈의 원인 진단 없이 매체 제안으로 넘어가면 "어디서나 하는 제안"이 됩니다.', angle: '검색량·매체 비중(수확형 vs 창출형)·경쟁 가격대로 원인 가설을 세우고, 착수 30일 검증 항목으로 연결', evidence: `RFP 배경: ${c.pains[0]}`, weight: '상'}); }
  pri.push({title: `${c.T} 신규 수요를 검색 밖에서 만들기`, why: `${c.B}를 이미 아는 고객만 다시 잡으면 성장은 멈춥니다. ${c.young ? '2030은 검색보다 숏폼·피드에서 탐색을 시작합니다.' : '신규 고객은 브랜드명이 아닌 품목·니즈로 검색합니다.'}`, angle: `창출형(FIND) 트랙 — ${mix.filter(m => m.stage === 'upper').map(m => m.name).slice(0, 3).join(' · ') || '상위 퍼널 매체'}로 신규 도달 → 검색 리프트로 증분 판정`, evidence: `타겟: ${c.T} · 목표: ${c.goals.newc ? '신규 유입 언급' : '매출 성장'}`, weight: c.goals.newc ? '상' : '중'});
  if (chNames.length > 1) pri.push({title: '판매 채널별 역할 분리', why: `${chNames.join(' · ')}가 같은 키워드에 입찰하면 클릭이 나뉘고 서로 잠식합니다.`, angle: `${c.own}은 회원·관계, ${chNames.filter(n => n !== c.own).join('·')}는 채널 내 구매 수요 — 키워드·랜딩 라우팅 규칙 제시`, evidence: `판매 채널: ${chNames.join(', ')}`, weight: '상'});
  if (c.creative) pri.push({title: '소재를 감이 아닌 "규칙"으로 운영', why: '소재 제작이 과업에 포함 — 제작 퀄리티보다 "무엇을 언제 바꾸는지"가 성과를 가릅니다.', angle: '트랙별 메시지 3종 + 2주 테스트 → 하위 25% 교체 → 승자 확장 규칙을 약속', evidence: 'RFP 과업 범위: 소재 기획·제작 포함', weight: '중'});
  if (c.ind.compliance) pri.push({title: '광고 심의 리스크 선제 관리', why: `${c.ind.name} 업종은 심의 위반 시 광고 중단·제재로 성과가 바로 멈춥니다.`, angle: c.ind.compliance, evidence: `업종: ${c.ind.name}`, weight: '중'});
  pri.push({title: c.reportPain ? '리포트가 아닌 "액션"을 약속' : '운영 안정성은 숫자로 약속', why: c.reportPain ? '제안자 메모: 기존 대행사의 리포트 중심 운영에 대한 불만 — 차별화 포인트입니다.' : '대행사 교체 시 광고주의 최대 걱정은 성과 공백과 대응 속도입니다.', angle: '데일리 코멘트(원인·액션) · 주간 액션 리포트 · Learning Log + SLA(긴급 당일 5시간) 명시', evidence: c.reportPain ? '제안자 주요사항' : '운영·리포팅 과업', weight: c.reportPain ? '상' : '중'});
  if (c.budget) pri.push({title: `월 ${fmtWon(c.budget)} 예산의 '집중' 설계`, why: c.budget < 3e7 ? '예산 대비 매체가 많으면 매체별 학습량이 부족해 효율이 안 납니다.' : '규모 있는 예산은 시즌 탄력 운영과 매체 간 이동 규칙이 성과를 가릅니다.', angle: `핵심 매체 ${mix.length}개 · 테스트 예산 7% 분리 · 시즌 D-14 선적재 · 주간 ±10% 이동 규칙`, evidence: `RFP 예산: ${c.budgetRaw}`, weight: '중'});
  const priorities = pri.slice(0, 7).map((p, i) => ({...p, rank: i + 1}));

  const ownTo = c.own;
  const logic = {
    concept: `${c.B} Growth Playbook ${c.year} — FIND · WIN · KEEP`,
    message: `새 고객을 검색 밖에서 찾고(FIND), 찾아온 수요를 ${ownTo}에서 잡고(WIN), 들어온 고객을 회원·재구매로 남깁니다(KEEP).`,
    storyline: [
      {title: '진단', point: c.pains.length ? `배경 이슈(${c.pains[0].slice(0, 26)}…)의 원인을 시장·경쟁·고객·매체 4축으로 확인` : '시장·경쟁·고객·매체 4축으로 현재 위치 진단'},
      {title: '과제', point: '가져오고(신규) · 지키고(브랜드 수요) · 남기는(회원·재구매) 3가지 과제로 정의'},
      {title: '전략', point: `3트랙 플레이북 — 창출 ${stageSum(al, 'upper')}% · 수확 ${stageSum(al, 'mid')}% · 전환 ${stageSum(al, 'low')}% 예산 구조`},
      {title: '매체 액션', point: `${mix.length}개 매체별 누구에게·무엇으로·어디로·어떻게·무엇으로 평가`},
      {title: '측정·운영', point: 'GA4·UTM 트랙 태깅, 데일리 코멘트·운영 룰 자동화, Learning Log'},
      {title: '기대 성과', point: c.roasT ? `ROAS ${c.roasT}% 이상 + 신규 유입 확대 (시나리오별 범위 제시)` : '시나리오별 KPI 범위와 전제 조건 제시'}
    ]
  };
  const ins = [];
  ins.push(`판매 채널 ${chNames.join(' · ')} — 채널별 역할을 나누지 않으면 같은 고객에게 광고비를 두 번 씁니다.`);
  if (c.mix.length){ const harvest = c.mix.filter(m => /브랜드|리타겟|크리테오|카탈로그|검색/.test(m.name)).reduce((a, m) => a + m.pct, 0); ins.push(`현재 매체 비중 중 수확형(브랜드검색·리타겟 등) 약 ${Math.round(harvest)}% — ${harvest >= 50 ? '이미 아는 고객 회수에 편중, 신규 창출 비중 재설계 필요' : '창출·수확 균형은 양호, 전환 트랙 고도화 여지'}`); }
  ins.push(c.young ? `${c.T}은 검색보다 릴스·숏폼에서 탐색을 시작 — 피드 접점을 먼저 점유한 브랜드가 검색까지 가져갑니다.` : `${c.T}은 품목·니즈 키워드로 비교 탐색 — 쇼핑검색·비브랜드 검색 구간 점유가 관건입니다.`);
  ins.push(`${c.ind.name} 업종 구매 결정 포인트는 ${c.ind.usp} — 할인율보다 "${c.ind.offer}"로 설득해야 마진과 브랜드를 함께 지킵니다.`);
  if (c.ind.compliance) ins.push(`광고 심의: ${c.ind.compliance}`);
  if (c.comp.length) ins.push(`경쟁 구도: ${c.comp.join(', ')} — 가격대·검색 점유·광고 투자 비교로 포지션 확인 필요`);
  ins.push('AI 검색(네이버 AI 브리핑·ChatGPT)으로 탐색이 분산 — 상세페이지 GEO 구조화가 새 노출 경로입니다.');

  const sum = {
    client: c.B, background: c.pains.slice(0, 2).join(' / ') || '(RFP 배경 확인 필요)',
    objective: [c.goals.revenue && '매출 확대', c.goals.roas && '광고 효율(ROAS) 개선', c.goals.newc && '신규 고객 유입', c.goals.member && '회원·재구매', c.goals.aware && '브랜드 인지도', c.goals.app && '앱 성장'].filter(Boolean).join(' · ') || '(목표 확인 필요)',
    kpi: [c.roasT && `ROAS ${c.roasT}%`, c.growth && `성장 ${c.growth}`, c.cpaT && `CPA ${c.cpaT}원`].filter(Boolean).join(' · ') || '(정량 KPI 미기재 → 제안 시 KPI 정의 필요)',
    budget: c.budget ? `월 ${fmtWon(c.budget)} (연 ${fmtWon(c.budget * c.months)})` : '(예산 미기재)', period: `${c.months}개월 (${c.year})`, target: c.T,
    scope: [`매체 운영 (${(c.mentioned.length ? c.mentioned : mix.map(m => m.key)).map(k => (MEDIA_LIB(c)[k] || {}).name).filter(Boolean).slice(0, 6).join(', ')})`, c.creative && '소재 기획·제작', '리포팅·최적화'].filter(Boolean).join(' / '),
    evaluation: c.evals.map(e => `${e.name} ${e.pts}점`).join(' · ') || '(평가 기준 미기재)', deadline: c.deadline || S.project.due || '', constraints: c.ind.compliance ? [c.ind.compliance] : []
  };
  const qs = [];
  if (!c.budget) qs.push('월/연 광고 예산 규모와 매체비·대행 수수료 포함 여부');
  if (!c.roasT && !c.growth) qs.push('정량 KPI(ROAS·매출·신규 고객) 목표치와 측정 기준(GA4 vs 매체)');
  if (!c.mix.length) qs.push('현재 매체별 예산 비중과 최근 3~6개월 성과 데이터 (기준선 산정용)');
  qs.push('공식몰/스토어 회원·CRM 데이터 활용 범위(고객 목록 업로드 동의)');
  if (c.creative) qs.push('소재 제작 범위(월 제작 수량·촬영 포함 여부)와 브랜드 가이드 검수 절차');

  return {rfpSummary: sum, priorities, colors: null, colorConcept: '', brandInsights: ins, logic, sections: planSections(c), questions: qs, engine: true, mix: al.map(m => ({key: m.key, name: m.name, stage: m.stage, pct: m.pct}))};
}

/* ---------- 섹션 플랜 (RFP 목차가 있으면 그대로 따름) ---------- */
const ROLE_DEF = {
  company: ['회사 개요 및 퍼포먼스 마케팅 역량', 'Company & Capability', '매드업 성장·파트너십·조직·솔루션'],
  team: ['운영 조직 및 전담 인력 구성', 'Team & Organization', '전담 TF와 업무 분담(R&R)'],
  brand: ['시장·브랜드 진단', 'Diagnosis', '시장·경쟁·고객·매체 4축 진단과 과제 정의'],
  playbook: ['핵심 전략', 'Strategy', '3트랙 플레이북과 퍼널 맵'],
  media: ['매체 전략 & 매체별 액션 플랜', 'Media Strategy', '퍼널별 매체 역할과 매체별 실행안'],
  budget: ['예산·시즌 운영 계획', 'Budget & Season', '시나리오 3안 · 매체 배분 · 시즌 캘린더'],
  creative: ['크리에이티브 전략', 'Creative', '트랙별 메시지와 소재 테스트 규칙'],
  kpi: ['KPI 정의 및 성과 측정', 'KPI & Measurement', '결과·운영 KPI와 측정 환경'],
  report: ['리포트 및 성과 보고 체계', 'Reporting', '데일리~분기 보고 주기와 Learning Log'],
  optimize: ['최적화 & 실행 로드맵', 'Optimization & Action Plan', '운영 룰 · 1/3/6개월 로드맵 · 착수 체크리스트'],
  tech: ['기술 역량 및 솔루션 활용', 'Technology', '자체 솔루션·자동화로 운영 공수 절감'],
  case: ['유사 캠페인 운영 사례', 'Case Study', '유사 업종 성과 사례'],
  issue: ['이슈 대응 및 커뮤니케이션 플랜', 'Issue Response', '이슈 등급별 대응과 SLA'],
  pricing: ['비용 제안 및 계약 조건', 'Pricing', '운영 수수료·제작비·포함 솔루션']
};
const ROLE_RE = {company: /회사|역량|일반\s*현황|기업\s*소개|업체\s*소개/, team: /조직|인력|투입|전담|인원/, brand: /시장|진단|현황\s*분석|환경\s*분석|브랜드\s*(이해|분석)/, playbook: /전략\s*방향|핵심\s*전략|제안\s*개요|컨셉|전략\s*제안/, media: /매체|미디어\s*전략|채널\s*전략|운영\s*전략|광고\s*운영/, budget: /예산|미디어\s*믹스|집행\s*계획|배분/, creative: /소재|크리에이티브|콘텐츠|제작/, kpi: /KPI|성과\s*(지표|분석|측정)|목표\s*설정|측정/, report: /리포트|보고/, optimize: /최적화|고도화|액션\s*플랜|실행\s*계획/, tech: /기술|솔루션|툴|자동화/, case: /사례|레퍼런스|포트폴리오|실적/, issue: /이슈|커뮤니케이션|위기|대응/, pricing: /비용|가격|수수료|견적|계약/};
const kindOfRole = r => r === 'company' ? 'company' : r === 'brand' ? 'brand' : r === 'case' ? 'case' : 'strategy';
function planSections(c){
  let roles;
  if (c.toc){
    const used = new Set();
    roles = c.toc.map(t => { const r = Object.keys(ROLE_RE).find(k => !used.has(k) && ROLE_RE[k].test(t)) || 'custom'; used.add(r); return {role: r, title: t.replace(/^\s*[\d.]+\s*/, '')}; });
    if (!roles.some(r => r.role === 'brand')) roles.splice(Math.min(2, roles.length), 0, {role: 'brand', title: ROLE_DEF.brand[0], added: true});
    if (!roles.some(r => r.role === 'playbook')){ const mi = roles.findIndex(r => r.role === 'media'); roles.splice(mi >= 0 ? mi : roles.length, 0, {role: 'playbook', title: ROLE_DEF.playbook[0], added: true}); }
  } else roles = ['company', 'team', 'brand', 'playbook', 'media', 'budget', 'creative', 'kpi', 'report', 'optimize', 'tech', 'case', 'issue', 'pricing'].map(r => ({role: r, title: ROLE_DEF[r][0]}));
  return roles.map(r => { const d = ROLE_DEF[r.role] || [r.title, '', '']; const n = enginePool(r.role, c, {title: r.title, hasPlaybook: roles.some(x => x.role === 'playbook')}).length; return {role: r.role, title: r.title || d[0], en: d[1], goal: d[2] + (r.added ? ' (RFP 목차 외 추가 권장)' : ''), pages: n + (n >= 2 ? 1 : 0), divider: n >= 2}; });
}

/* ---------- 섹션별 페이지 생성 ---------- */
const PG = (type, layout, title, subtitle, items = [], o = {}) => ({type, layout, title, subtitle, keyMsg: o.keyMsg || '', items: items.map(i => Array.isArray(i) ? {h: i[0] || '', d: i[1] || '', v: i[2] || ''} : i), notes: o.notes || '', tag: o.tag || '', source: o.source || '', cols: o.cols || null, prio: o.prio || 2});
function enginePool(role, c, sec = {}){
  const {B, P, T, own, ind} = c, mix = mediaMix(c), al = allocate(mix, 'base'), RS = c.research;
  const bud = c.budget, amt = p => bud ? `월 ${fmtWon(bud * p / 100)}` : '';
  const track = st => STAGE[st];
  switch (role){
  case 'company': return [
    PG('strategy', 'hero', `${S.project.proposer?.includes('매드업') || /MADUP/i.test(S.project.proposer || '') ? '매드업은' : '우리는'} 커머스 브랜드의 성장을 함께 만들어 왔습니다.`, '숫자로 증명하는 퍼포먼스 마케팅 파트너', [MADUP.hero, ...MADUP.points], {notes: MADUP.src, prio: 1}),
    PG('strategy', 'grid', '주요 매체사의 최상위 공식 파트너입니다.', '네이버·메타·구글 등 주요 매체의 프리미엄 파트너 레벨 공인', MADUP.partners, {notes: MADUP.src, prio: 1}),
    PG('explain', 'grid', '크리에이티브부터 데이터·테크까지 한 조직 안에 있습니다.', `${B} 매출 성장에 필요한 액션을 빠르게 도출하는 조직 구조`, MADUP.org, {prio: 2}),
    PG('strategy', 'cards', '자체 솔루션을 운영에 포함해 제공합니다.', '엑스퍼트·마일럿을 주축으로 커머스·AI 크리에이티브 특화 솔루션까지', MADUP.solutions, {keyMsg: '※ 자체 솔루션은 별도 비용 없이 운영에 포함', prio: 2}),
    PG('explain', 'list', '수상 이력으로 성과와 크리에이티브를 인정받았습니다.', '메타·구글·크리테오 어워즈 및 디지털 광고대상', MADUP.awards, {prio: 3}),
    PG('bridge', 'list', '', '', [], {keyMsg: `${B}의 매출 성장과 브랜드 성장을 함께 만드는 퍼포먼스 마케팅 파트너`, prio: 3})
  ];
  case 'team': return [
    PG('strategy', 'grid', `${B} 전담 TF를 구성하겠습니다.`, 'AE 전담 조직 · 크리에이티브 · 데이터&테크 파트별 전문 인력', [['캠페인 총괄 [이름]', '전략 수립·KPI 관리·광고주 커뮤니케이션 총괄', '팀리드'], ['운영 PM [이름]', '일정·예산·프로모션 운영 관리', 'PM'], ['SA 운영 [이름]', '네이버·구글 검색·쇼핑검색 성과 관리', 'SA'], ['DA 운영 [이름]', '메타·GFA·크리테오 등 DA 성과 관리', 'DA'], ['크리에이티브 PM [이름]', '트랙별 소재 기획·제작·A/B 설계', 'CR'], ['데이터 분석 [이름]', 'GA4·UTM·픽셀 정합성, 대시보드·이상 감지', 'DATA']], {notes: '실제 투입 인력명·경력(담당 브랜드)으로 교체', prio: 1}),
    PG('explain', 'table', '역할과 승인 절차를 착수 전에 문서로 합의합니다.', `매체 운영·크리에이티브·데이터는 매드업이 실행하고, ${B}는 업무별 최종 승인`, [['연간·월간 예산·프로모션 일정', `매드업 제안 → ${B} 확정`, '승인'], ['매체 운영·입찰·예산 집행', '매드업 실행 · 주간 공유', '공유'], ['상품 피드·가격·재고·랜딩 점검', `매드업 점검 → ${B} MD 반영`, '실행'], ['소재 기획·제작·리사이징', '매드업 제작 → 브랜드 가이드 검수', '승인'], ['리포트·개선안', '매드업 작성 · 액션 합의', '승인']], {cols: ['업무', '프로세스', `${B} 역할`], prio: 2})
  ];
  case 'brand': {
    const out = [PG('bridge', 'list', `${B}의 다음 성장을 위해 시장·경쟁·고객·매체를 진단했습니다.`, '', [['시장'], ['경쟁'], ['고객'], ['매체']], {keyMsg: `${c.year}년, ${B}의 다음 단계 성장을 위해 시장의 흐름을 분석했습니다.`, prio: 2})];
    if (RS?.market?.length) out.push(PG('strategy', RS.market.some(m => m.value) ? 'kpi' : 'list', '시장은 이렇게 움직이고 있습니다.', RS.marketHead || `${ind.name} 카테고리 온라인 시장 흐름`, RS.market.slice(0, 4).map(m => [m.fact, m.note || m.source || '', m.value || '']), {source: RS.market.map(m => m.source).filter(Boolean).slice(0, 3).join(' · '), prio: 1}));
    else out.push(PG('explain', 'table', '4가지 관점으로 진단합니다.', '진단 항목과 확인 데이터 — 착수 전 리서치로 수치 확정', [['시장', `${ind.name} 카테고리 온라인 거래 추이 · 채널(플랫폼/공식몰) 이동`, '통계청 온라인쇼핑동향'], ['경쟁', `${c.comp.length ? c.comp.join('·') : '주요 경쟁 브랜드'} 가격대·검색 점유·광고 투자`, '네이버 데이터랩 · DART'], ['고객', `${c.T} 검색량·연령별 변화, 구매 여정`, '데이터랩 · 리스닝마인드'], ['매체', '현재 매체 비중(수확형 vs 창출형)과 효율 추이', '광고주 제공 데이터']], {cols: ['관점', '진단 내용', '데이터 소스'], notes: 'Claude 리서치 연동으로 실제 수치를 채우면 이 장표가 시장 데이터 장표로 교체됩니다.', prio: 1}));
    if (RS?.competitors?.length) out.push(PG('explain', 'table', `${B}의 경쟁 포지션을 확인했습니다.`, '가격대·검색 점유·포지션 비교', RS.competitors.slice(0, 6).map(x => [x.name, x.position || x.note || '', x.price || '']), {cols: ['브랜드', '포지션 · 특징', '가격대'], source: RS.compSource || '', prio: 1}));
    else if (c.comp.length) out.push(PG('explain', 'table', `${B}의 경쟁 구도를 정리했습니다.`, '경쟁사별 위협 포인트와 대응 방향', c.comp.map((x, i) => [x, (i === 0 ? '상위 대안으로 이탈을 끌어가는 브랜드 — 비교 구간에서 USP로 대응' : '가격·할인으로 수요를 막는 구간 — 혜택·가치 메시지로 대응') + '\n[가격대·검색량 확인 필요]']), {cols: ['경쟁사', '위협 포인트 · 대응'], prio: 2}));
    const DEF_H = [['신규 유입', '가설: 브랜드 수요 회수 매체에 예산 편중', '매체 비중 · 신규 방문 비중'], ['검색 수요', '가설: 2030 관심 감소, 경쟁 브랜드로 탐색 이동', '연령별 검색 점유'], ['전환', '가설: 상세·혜택 메시지가 비교 단계에서 약함', 'GA4 단계별 이탈'], ['채널', '가설: 판매 채널 간 같은 키워드 경쟁', '키워드별 채널 성과']];
    const hyp0 = c.pains.map(p => /정체|부진|역성장/.test(p) ? [p, '가설: 예산이 이미 아는 고객 회수(수확형)에 편중 → 신규 유입 부족', '매체 비중 · 신규 방문 비중'] : /검색|관심/.test(p) ? [p, '가설: 2030 신규 관심 감소, 경쟁 브랜드로 탐색 이동', '연령별 검색 점유'] : /효율|CPA|ROAS|하락/.test(p) ? [p, '가설: 소재 피로도 누적 + 입찰 경쟁 심화', '소재별 CTR 추이 · CPC'] : [p, '가설: 비교 구간(쇼핑검색·비브랜드)에서 노출 열세', '쇼핑검색 점유 · 가격 경쟁력']);
    const hyp = [...hyp0]; DEF_H.forEach(d => { if (hyp.length < 4 && !hyp.some(x => x[1] === d[1])) hyp.push(d); });
    out.push(PG('explain', 'table', '현재 이슈를 가설로 정리하고, 착수 30일 안에 검증합니다.', '이슈 → 원인 가설 → 확인 데이터', hyp, {cols: ['이슈', '원인 가설', '확인 데이터'], prio: 1}));
    if (c.channels.length > 1) out.push(PG('strategy', 'compare', '판매 채널마다 역할을 나눕니다.', `${own}은 회원 관계를 쌓고, 다른 채널은 각 채널 안의 구매 수요를 받습니다.`, c.channels.map(k => k === 'own' ? [own, '회원·재구매 관계 구축 · KPI 집계 기준 채널', '모든 채널이 같은 키워드로 경쟁'] : k === 'smartstore' || k === 'brandstore' ? [k === 'smartstore' ? '스마트스토어' : '브랜드스토어', '네이버 안 구매(N페이·가격비교)만 받는 보조 채널', `브랜드 키워드에서 ${own}과 클릭 분산`] : k === 'coupang' ? ['쿠팡', '쿠팡 내 비교 구매 수요 — 가격 정책·광고 상한 관리', '최저가 비교로 가격 경쟁'] : k === 'oliveyoung' ? ['올리브영', '올영세일·오프라인 연계 시즌 집중', '행사 기간 외 존재감 약함'] : ['패션 플랫폼', '플랫폼 기획전 연동, 신규 고객 접점', '플랫폼 할인 경쟁에 노출']), {prio: 1}));
    if (RS?.channels?.length) out.push(PG('explain', 'spec', '판매처 상세페이지에서 확인한 사실입니다.', '상세페이지·리뷰·혜택 구성 점검 결과', RS.channels.slice(0, 5).map(x => [x.channel, (x.findings || []).join('\n')]), {keyMsg: '상세페이지 메시지와 광고 메시지를 맞추는 것이 전환의 출발점', tag: 'CHANNEL CHECK', prio: 1}));
    if (RS?.usp?.length) out.push(PG('strategy', 'cards', `${P}의 구매 이유는 이것입니다.`, '상세페이지·리뷰에서 찾은 핵심 USP', RS.usp.slice(0, 4).map(u => typeof u === 'string' ? [u, ''] : [u.h || u.title, u.d || u.desc || '']), {prio: 1}));
    if (RS?.voice?.length) out.push(PG('explain', 'split', '고객은 이렇게 말합니다.', '리뷰·커뮤니티 고객 언어', RS.voice.slice(0, 4).map(v => typeof v === 'string' ? ['', v] : [v.h || '', v.d || v.text || '']), {keyMsg: RS.voiceHead || '고객의 언어를 광고 메시지로 옮깁니다', prio: 2}));
    out.push(PG('bridge', 'list', `${c.year}년 과제는 새 고객을 가져오고, 기존 고객을 지키고, 들어온 고객을 남기는 것입니다.`, '', [['01 가져오고 · 창출형'], ['02 지키고 · 수확형'], ['03 남기고 · 전환형']], {keyMsg: `${c.year}년 과제는 새 고객을 가져오고, 지키고, 회원으로 남기는 것입니다.`, prio: 1}));
    return out;
  }
  case 'playbook': {
    const tk = st => al.filter(m => m.stage === st);
    return [
      PG('strategy', 'cards', `${B} Growth Playbook ${c.year}`, '세 가지 과제를 세 개의 트랙으로 풉니다.', [
        ['FIND · 신규 수요 확보', `검색 밖 ${T} 신규 도달 → 브랜드 검색으로 연결 (${tk('upper').map(m => m.name).slice(0, 3).join(', ') || '상위 퍼널'})`, 'Traffic +10~15% (가정)'],
        ['WIN · 브랜드 수요 방어', `'${B}'·품목 검색 수요를 ${own} 매출로 (${tk('mid').map(m => m.name).slice(0, 3).join(', ')})`, c.roasT ? `ROAS ${c.roasT}%+` : 'ROAS +20%p (가정)'],
        ['KEEP · 회원·재구매 전환', `방문 고객은 첫구매로, 구매 고객은 재구매로 (${tk('low').map(m => m.name).slice(0, 3).join(', ')})`, 'CVR +0.2%p (가정)']
      ], {keyMsg: '목표치는 착수 1개월 기준선(Baseline) 확정 후 재산정합니다', notes: '가정 수치는 매드업 유사 업종 운영 경험 기반 범위 — 광고주 데이터 확인 후 확정', prio: 1}),
      PG('strategy', 'funnel', '퍼널 단계마다 매체의 역할을 정합니다.', '트랙별 매체 · KPI · 예산 비중 (균형형 기준)', ['upper', 'mid', 'low'].map(st => [`${track(st).en} · ${track(st).lb}`, `${track(st).desc}\n${tk(st).map(m => m.name).join(' · ') || '-'}`, `${track(st).ko} ${stageSum(al, st)}%  |  ${st === 'upper' ? '도달 · 검색 리프트' : st === 'mid' ? 'ROAS · CTR' : 'CVR · 재구매율'}`]), {prio: 1}),
      PG('strategy', 'matrix', '모든 매체에 같은 네 가지 원칙을 적용합니다.', '운영 원칙 — 매체가 달라도 고객은 같은 이야기를 듣습니다', [['할인 대신 혜택으로 설득', `할인율 대신 ${ind.offer}로 — 마진과 브랜드 가치를 함께 지킴`, 'PRINCIPLE 1'], [`브랜드 키워드는 ${own}으로`, '채널 간 같은 키워드 동시 입찰 금지 — 자기잠식 방지', 'PRINCIPLE 2'], ['소재는 규칙으로 교체', '2주 테스트 → 하위 25% 교체 → 승자 확장', 'PRINCIPLE 3'], ['하나의 측정 기준', 'GA4 + UTM 트랙 태깅(FIND/WIN/KEEP)으로 전략별 판정', 'PRINCIPLE 4']], {prio: 2})
    ];
  }
  case 'media': {
    const pages = [];
    if (!(sec.hasPlaybook ?? S.sections.some(s => s.role === 'playbook' && s.include !== false))) pages.push(...enginePool('playbook', c).slice(1, 2));
    pages.push(PG('explain', 'table', `${mix.length}개 매체로 퍼널 전체를 덮습니다.`, '매체별 역할 요약 — 상세 실행안은 다음 장부터', al.map(m => [m.name, m.role, `${track(m.stage).en} · ${m.pct}%`]), {cols: ['매체', '역할', '트랙 · 예산 비중'], prio: 1}));
    al.forEach(m => pages.push(PG('strategy', 'spec', m.head, m.sub, [['누구에게', m.who], ['무엇으로', m.what], ['랜딩', m.land], ['운영 방안', m.acts.map((a, i) => `${i + 1}) ${a}`).join('\n')], ['평가 KPI', m.kpi], ['실행 일정', m.when + (bud ? `  ·  예산 ${m.pct}% (${amt(m.pct)})` : `  ·  예산 비중 ${m.pct}%`)]], {keyMsg: m.role, tag: `${track(m.stage).en} · ${track(m.stage).lb.toUpperCase()}`, notes: `${m.name}: ${m.role}. 예산 비중은 균형형 시나리오 기준(가정).`, prio: 1})));
    return pages;
  }
  case 'budget': {
    const sc = {safe: allocate(mix, 'safe'), base: al, push: allocate(mix, 'push')};
    const tot = bud ? `월 ${fmtWon(bud)} 기준` : '예산 비중 기준 (금액은 예산 확정 후 산출)';
    return [
      PG('strategy', 'chart', '균형형 시나리오의 매체 배분입니다.', `${tot} · 시즌별 ±20~30% 탄력 운영`, al.map(m => [m.name, `${track(m.stage).ko}${bud ? ' · ' + amt(m.pct) : ''}`, m.pct + '%']), {keyMsg: `창출 ${stageSum(al, 'upper')}% · 수확 ${stageSum(al, 'mid')}% · 전환 ${stageSum(al, 'low')}% — 수확형 편중을 단계적으로 조정`, prio: 1}),
      PG('explain', 'table', '예산 시나리오 3안 중 균형형을 추천합니다.', '시나리오별 성격 · 트랙 비중 · 기대 효과 · 리스크', [
        ['보수형', `검증된 수확·전환 매체 중심 — 효율 안정, 신규 확보 제한 / 창출 ${stageSum(sc.safe, 'upper')}% · 수확 ${stageSum(sc.safe, 'mid')}% · 전환 ${stageSum(sc.safe, 'low')}%`, 'ROAS 우선'],
        ['균형형 (추천)', `수확 방어 + 창출 단계 확대 / 창출 ${stageSum(al, 'upper')}% · 수확 ${stageSum(al, 'mid')}% · 전환 ${stageSum(al, 'low')}%`, 'ROAS 유지 + 신규 확대'],
        ['공격형', `상위 퍼널 강화로 신규 수요 최대화 — 초기 ROAS 하락 감수 / 창출 ${stageSum(sc.push, 'upper')}% · 수확 ${stageSum(sc.push, 'mid')}% · 전환 ${stageSum(sc.push, 'low')}%`, '신규 유입 최대']
      ], {cols: ['시나리오', '구성 · 트랙 비중', '우선 목표'], keyMsg: '공격형은 2~3개월차 검색 리프트 확인 후 전환을 검토합니다', prio: 1}),
      PG('strategy', 'timeline', '시즌 피크 2~3주 전에 예산을 먼저 싣습니다.', `${ind.name} 업종 시즌 캘린더 — 수요가 오르기 전에 모수를 적재`, ind.season.map(s => [s[0], s[2], s[1]]), {keyMsg: 'D-14 ~ D-1 사전 모수 적재 → 피크 집중 → 잔류 기간 리타겟', prio: 2}),
      PG('strategy', 'process', '예산은 정해진 폭 안에서, 주기가 길수록 크게 조정합니다.', '매일은 막고, 매주·매월은 옮기고, 시즌에는 미리 싣습니다', [['DAILY · 차단', 'CPC 급등·전환 0·소진 속도 이상은 자동 룰로 즉시 차단', '±0%'], ['WEEKLY · 이동', '효율 상위 캠페인으로 매체 내 예산 이동', '±10%'], ['MONTHLY · 리밸런싱', '트랙·매체 간 비중 조정, 월간 리뷰에서 합의', '±20%'], ['SEASON · 선적재', '피크 D-14부터 상위 퍼널 예산 선적재', '+20~30%']], {prio: 2})
    ];
  }
  case 'creative': {
    const out = [
      PG('strategy', 'table', '퍼널별로 메시지 방향을 고정합니다.', '트랙별 WHY → HOW → 소재 · KPI', [
        ['FIND · 처음 만나는 고객', `WHY 할인보다 "알아보는 제품"에 반응 → HOW 대표 상품·브랜드 에셋으로 첫인상 선점 (${ind.cut})`, 'CTR · 신규 방문'],
        ['WIN · 비교 중인 고객', `WHY 비교 단계에서 고를 이유가 필요 → HOW ${ind.usp} USP와 ${own} 혜택을 한 장에`, 'CVR · 첫구매 CPA'],
        ['KEEP · 아는 고객·구매 고객', 'WHY 할인 유통으로 새기 쉬움 → HOW 할인율 대신 "다음에 살 이유"(회원 혜택·연관 상품)', '재구매율 · 객단가']
      ], {cols: ['트랙', '메시지 (WHY → HOW)', 'KPI'], prio: 1}),
      PG('strategy', 'process', '소재는 감이 아닌 규칙으로 교체합니다.', '테스트 규칙을 약속합니다 — 제작 범위·단가는 별도 협의', [['2주 테스트', '컨셉별 2~3안 동시 집행 (상품컷 vs 연출컷, AI vs 일반 컷)', 'A/B'], ['14일 판정', '하위 25% OFF · CTR 우수/CVR 저조 소재는 디벨롭', '하위 25%'], ['승자 확장', '승자 소재를 매체·사이즈·카피 베리에이션으로 확장', 'x3~5'], ['Learning Log', '결과를 다음 소재 기준에 반영 · 월간 리뷰 공유', '누적']], {prio: 1}),
      PG('explain', 'grid', '포맷별 소재 라인업', `${B} 소재 에셋 활용 계획`, [['숏폼 15초', '0–3초 훅 → 사용 장면 → 대표 상품', 'Reels·Shorts'], [ind.cut, '모델 화보 대신 실제 사용·착용 장면', '전 매체'], ['분할 화보·카탈로그', '기존 이미지 2·3분할 재가공 — 신규 촬영 없이 확장', 'DA'], ['리뷰·UGC', '고객 언어를 카피로, 크리에이터 영상 활용', 'Meta·TikTok'], ['AI 베리에이션', 'AI 이미지·리사이징으로 테스트 물량 확보', '전 매체'], ['시즌 기획전', '시즌 캘린더 D-14 선제작', 'GFA·카카오']], {prio: 2})
    ];
    if (ind.compliance) out.push(PG('explain', 'split', '광고 심의 리스크를 제작 단계에서 막습니다.', `${ind.name} 업종 표현 기준 체크리스트`, [['사전 심의', '심의 대상 소재는 심의필 획득 후 집행, 심의 번호 표기'], ['효능 표현', '실증 자료 범위 내 표현만 사용, 최상급·단정 표현 배제'], ['체험기·비포애프터', '매체·법령 기준 확인 후 사용 여부 결정'], ['검수 프로세스', '제작 → 매드업 1차 검수 → 광고주 법무/RA 최종 승인']], {keyMsg: ind.compliance, prio: 1}));
    return out;
  }
  case 'kpi': return [
    PG('strategy', 'kpi', `${B} KPI는 계정 전체 목표 3가지로 정의합니다.`, '결과 KPI는 GA4 기준으로 판정합니다', [['ROAS', 'GA4 구매 매출 ÷ 광고비 · 월간 판정', c.roasT ? `${c.roasT}%+` : '+20%p'], ['신규 유입', '신규 방문·첫구매 고객 수 · 창출형 트랙 증분', '+10~15%'], ['CVR · 재구매', '유입 대비 구매 전환·90일 재구매율', '+0.2%p']], {keyMsg: '목표치는 착수 1개월 기준선 확정 후 재산정 (가정 수치)', prio: 1}),
    PG('explain', 'table', '운영 KPI는 트랙별로 다른 잣대로 봅니다.', '상위 퍼널은 증분, 나머지는 GA4 기준 · UTM으로 트랙 구분', [['FIND (창출형)', '도달 · 조회 완료율 · 브랜드 검색 리프트', '증분 측정'], ['WIN (수확형)', 'CTR · CPC · ROAS · 첫구매 CPA', 'GA4 · 매체'], ['KEEP (전환형)', '장바구니→구매율 · 재구매율 · 객단가', 'GA4 코호트']], {cols: ['트랙', '운영 KPI', '측정 기준'], prio: 1}),
    PG('explain', 'list', '측정 환경을 착수 전에 정비합니다.', '데이터가 맞아야 판단이 맞습니다', [['GA4 전자상거래 이벤트', '구매·매출 이벤트 값을 실매출 기준과 일치시킴', 'D-14'], ['UTM 규칙', '트랙(FIND/WIN/KEEP)·매체·소재 단위 표준 태깅', 'D-10'], ['메타 픽셀 + CAPI', '서버 전송으로 구매 신호 유실 방지', 'D-10'], ['네이버·구글 전환 태그', '전환 스크립트·EP·Merchant Center 정합성 점검', 'D-7'], ['기준선(Baseline) 확정', '전년 동기·직전 3개월 기준으로 목표 재산정', '1개월차']], {prio: 2})
  ];
  case 'report': return [
    PG('explain', 'table', '보고는 숫자가 아니라 다음 액션으로 끝납니다.', '보고 주기별 내용과 시간', [['Daily', '자동 리포트 + 데일리 코멘트 (성과 진단 · 원인 · 제안)', '09:00 / 10:00'], ['Weekly', '매체·소재·KPI 달성률 + 다음 주 액션 플랜', '매주 월 12:00'], ['Monthly', 'KPI 진단 · 예산 리밸런싱 · Learning Log 리뷰', '익월 5영업일'], ['Quarterly', '전략 점검(QBR) · 다음 분기 테스트 로드맵', '분기 종료 후']], {cols: ['주기', '내용', '시간'], prio: 1}),
    PG('strategy', 'process', '제안 → 승인 → 검증 → 기록의 루프로 운영합니다.', '테스트 결과는 확대·유지·중단 판단으로 바로 연결', [['제안', '매드업이 가설과 테스트안 제안', ''], ['승인', `${B} 승인 · 일정 확정`, ''], ['검증', 'A/B 또는 전후 비교로 결과 판정', ''], ['기록', 'Learning Log에 남기고 다음 소재·입찰 기준에 반영', '']], {keyMsg: c.reportPain ? '리포트를 많이 보내는 것이 아니라, 매주 하나씩 실행하고 결과를 남깁니다' : 'AI 리포팅으로 집계 공수를 줄이고, 원인 분석과 액션에 시간을 씁니다', prio: 1})
  ];
  case 'optimize': return [
    PG('strategy', 'table', '데이터 변화에 즉시 대응하는 운영 룰을 미리 정합니다.', '조건 충족 시 자동 실행 — 광고비 누수를 막고 고효율 상품에 집중', [['CPC 급등', '3일 연속 +30% → 입찰 상한 하향 · 키워드 재점검', '자동'], ['전환 0 + 소진 50%', '광고 세트 일시 중지 · 랜딩 점검 알림', '자동'], ['CTR 7~14일 하락', '피로도 판정 → 소재 교체', '반자동'], ['품절 · 데드링크', '최저 입찰 전환 · 피드 OFF', '자동'], ['소진 속도 120% 초과', '페이싱 조정 · 담당자 알림', '자동'], ['ROAS 목표 -20% (2주)', '축소 → 개선 테스트 → 중단 3단계 처리', '수동 판단']], {cols: ['조건', '액션', '실행 방식'], prio: 1}),
    PG('strategy', 'timeline', '1개월 · 3개월 · 6개월 단위로 실행합니다.', '실행 로드맵 — 단계별 목표와 산출물', [['D-30 ~ D-1', '계정·태그·피드·캠페인 구조 세팅, 기준선 데이터 확보', '인수·세팅'], ['1개월', '소재·타겟 A/B 테스트, 학습 안정화 (성과 이탈 -20% 시 원복)', '테스트'], ['3개월', '승자 소재·매체 예산 확대, 창출형 비중 단계 상향', '확장'], ['6개월', 'CRM·회원 전환 트랙 고도화, 자동화 룰 정착', '고도화'], ['12개월', '연간 리뷰 · 다음 해 플레이북', '리뷰']], {prio: 1}),
    PG('explain', 'table', '착수 체크리스트 — 누가 · 언제 · 어떻게', '라이브 역산 인수 타임라인', [['계정·권한 이관', '매드업 AE · 광고주 마케팅팀 — 매체 계정 권한, 결제 수단 확인', 'D-21'], ['GA4·UTM·픽셀/CAPI', '매드업 데이터팀 — 이벤트 정합성 점검 · 서버 전송 세팅', 'D-14'], ['상품 피드 정비', '매드업 AE + 광고주 MD — 상품명·속성·이미지 정비', 'D-10'], ['런칭 소재 1차', '매드업 크리에이티브 → 광고주 승인', 'D-7'], ['캠페인 세팅·QA', '매드업 AE — 구조·제외 키워드·예산 페이싱', 'D-3'], ['라이브 & 모니터링', '매드업 AE·데이터 — 데일리 코멘트 시작', 'D-Day']], {cols: ['업무', '담당 · 방법', '시점'], prio: 1})
  ];
  case 'tech': return [
    PG('strategy', 'cards', '이 제안서의 숫자를 뽑은 도구 그대로 운영합니다.', '리서치 · 측정 · 운영 자동화 · GEO', MADUP.solutions, {prio: 1}),
    PG('explain', 'table', '5종 운영 자동화로 일 작업 공수를 줄입니다.', '사람이 인지하기 전에 시스템이 먼저 감지 — 확보된 시간은 신규 확장 테스트에', [['피드 검수', '상품 속성·이미지 오류 자동 감지', '매일'], ['데드링크·품절', '랜딩 오류·품절 감지 → 입찰 하향·OFF', '실시간'], ['입찰 산출', '키워드별 목표 순위 · 예측 입찰가', '매일'], ['소재 세팅', '규격별 리사이징·배치 자동화', '수시'], ['기획전 일정', '시즌·기획전 캠페인 ON/OFF 예약', 'D-1 체크']], {cols: ['자동화', '내용', '주기'], keyMsg: '반복 운영 리소스 약 70% 절감 (매드업 운영 기준)', prio: 2})
  ];
  case 'case': {
    const cs = [...MADUP.cases].sort((a, b) => (b.ind === c.indKey) - (a.ind === c.indKey));
    return [
      PG('strategy', 'cards', '유사 캠페인에서 이렇게 성과를 만들었습니다.', c.indKey === 'fashion' ? '패션 브랜드·플랫폼 운영 사례' : '커머스 운영 사례 (업종 유사 사례로 교체 권장)', cs.slice(0, 3).map(x => [x.h, x.d, x.v]), {notes: MADUP.src, prio: 1}),
      PG('strategy', 'cards', '같은 운영 방식을 적용하겠습니다.', '소재·타겟·채널 분리 사례', cs.slice(3, 6).map(x => [x.h, x.d, x.v]), {notes: MADUP.src, prio: 2})
    ];
  }
  case 'issue': return [
    PG('explain', 'table', '이슈는 3등급으로 나누고 등급별로 대응합니다.', '선제 공유 → 임시 조치 → 원인 파악 → 원복·재발 방지', [['긴급', '매체 장애 · 과금 오류 · 랜딩 다운 → 원인 파악 전이라도 즉시 공유, 매체 핫라인 1시간 내 연결', '즉시'], ['주의', '지표 급변(±30%) · 품절·가격 오류 → 당일 원인 분석·임시 조치', '당일'], ['일반', '소재 반려 · 세팅 요청 → 영업일 1일 내 처리', 'D+1']], {cols: ['등급', '상황 · 대응', '시간'], prio: 1}),
    PG('strategy', 'kpi', '서비스 수준은 숫자로 약속합니다.', 'SLA — 커뮤니케이션 채널·회의·문서 체계 포함', [['데일리 코멘트', '매일 오전 성과 진단·원인·제안', '11:00'], ['긴급 대응', '긴급 이슈 당일 조치', '5시간'], ['정규 요청', '신규 캠페인·소재 요청 리드타임', 'D-14'], ['성과 이탈 방지', '인수 후 성과 -20% 이탈 시 이전 세팅 원복', '-20%']], {prio: 1})
  ];
  case 'pricing': return [
    PG('explain', 'table', '비용 제안', '운영 범위와 비용 구조 — 금액은 협의 후 확정', [['매체 운영 대행', `${mix.length}개 매체 운영 · 최적화 · 리포팅`, '[수수료율 입력]'], ['소재 제작', '월 제작 수량·포맷 기준 (촬영 별도)', '[단가 입력]'], ['초기 세팅', '태그·픽셀 컨설팅, 피드 속성 고도화 (1개월분)', '무상'], ['자체 솔루션', '레버 엑스퍼트 · 마일럿 · GEO 점검', '운영 포함']], {cols: ['항목', '범위', '비용'], notes: '비용은 내부 승인 후 기입', prio: 1})
  ];
  default: return [PG('explain', 'list', sec.title || '추가 섹션', '이 섹션의 핵심 메시지를 입력하세요', [['핵심 주장', `${B}에 필요한 이유와 근거`], ['실행 방법', '누가 · 언제 · 어떻게'], ['기대 효과', '측정 지표와 목표 범위']], {prio: 2})];
  }
}
function generateEngine(sec){
  const c = signals();
  let pool = enginePool(sec.role || (sec.kind === 'strategy' ? 'custom' : sec.kind), c, sec);
  const N = Math.max(1, +sec.pages || pool.length), useDiv = sec.divider && N >= 2, room = N - (useDiv ? 1 : 0);
  if (pool.length > room){ const keep = new Set(pool.map((p, i) => [p.prio, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, room).map(x => x[1])); pool = pool.filter((p, i) => keep.has(i)); }
  while (pool.length < room) pool.push(PG('explain', 'list', `${sec.title} — 추가 페이지`, '[헤드 메시지 입력]', [['항목', '[내용 입력]']]));
  const out = pool.map(p => newPage(p.type, p));
  if (useDiv) out.unshift(newPage('divider', {title: sec.title, subtitle: sec.goal || '', items: (ROLE_DEF[sec.role]?.[2] || '').split(/[·,]/).filter(Boolean).slice(0, 4).map(h => ({h: h.trim(), d: '', v: ''}))}));
  return out;
}

/* ---------- 디자인 워싱 레이아웃 후보 ---------- */
function layoutCandidates(p){
  const it = itemsOf(p), n = it.length, hasV = it.filter(i => i.v && !/^\[/.test(i.v)).length >= Math.ceil(n / 2), pctV = it.filter(i => /^\s*\d+(\.\d+)?\s*%\s*$/.test(i.v || '')).length >= Math.max(2, n - 1);
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
