/**
 * 뷰티 리뷰 분석용 키워드 사전
 * 긍정/부정 키워드 및 피부타입 매핑
 */

// 긍정 키워드 (카테고리별)
export const POSITIVE_KEYWORDS: Record<string, string[]> = {
  texture: ['촉촉', '수분', '쫀쫀', '부드러', '탱탱', '촉촉해', '보습'],
  effect: ['탄력', '광', '톤업', '리프팅', '진정', '개선', '효과'],
  usability: ['간편', '노워시', '빠른', '간단', '편리', '쉬운', '10초'],
  satisfaction: ['재구매', '추천', '대란', '인생템', '최고', '만족', '좋아'],
  makeup: ['화잘먹', '밀착', '지속력', '화장', '메이크업'],
  skincare: ['피부결', '모공', '각질', '맑아', '화사', '깨끗']
};

// 부정 키워드 (카테고리별)
export const NEGATIVE_KEYWORDS: Record<string, string[]> = {
  effect: ['효과없', '기대이하', '과대광고', '아쉬', '별로', '실망', '모르겠'],
  irritation: ['자극', '트러블', '따가', '붉어', '뾰루지', '알러지'],
  texture: ['끈적', '무거', '답답', '기름', '번들'],
  smell: ['냄새', '향', '가스냄새', '거북'],
  price: ['비싸', '가격', '비쌈', '아깝'],
  usability: ['불편', '어려', '번거']
};

// 피부타입 코드 → 한글 매핑
export const SKIN_TYPE_MAP: Record<string, string> = {
  'A01': '건성',
  'A02': '중성',
  'A03': '지성',
  'A04': '복합성',
  'A05': '민감성',
  'A06': '트러블성',
  'A07': '아토피성'
};

// 피부톤 코드 → 한글 매핑
export const SKIN_TONE_MAP: Record<string, string> = {
  'B01': '쿨톤',
  'B02': '웜톤',
  'B03': '뉴트럴',
  'B04': '밝은편',
  'B05': '보통',
  'B06': '어두운편'
};

/**
 * 모든 긍정 키워드 배열 반환
 */
export function getAllPositiveKeywords(): string[] {
  return Object.values(POSITIVE_KEYWORDS).flat();
}

/**
 * 모든 부정 키워드 배열 반환
 */
export function getAllNegativeKeywords(): string[] {
  return Object.values(NEGATIVE_KEYWORDS).flat();
}

/**
 * 키워드가 속한 카테고리 찾기
 */
export function findKeywordCategory(keyword: string, isPositive: boolean): string {
  const dict = isPositive ? POSITIVE_KEYWORDS : NEGATIVE_KEYWORDS;
  for (const [category, keywords] of Object.entries(dict)) {
    if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
      return category;
    }
  }
  return 'unknown';
}

/**
 * 피부타입 코드를 한글로 변환
 */
export function getSkinTypeName(code: string | null | undefined): string {
  if (!code) return '미입력';
  return SKIN_TYPE_MAP[code] || code;
}

/**
 * 피부톤 코드를 한글로 변환
 */
export function getSkinToneName(code: string | null | undefined): string {
  if (!code) return '미입력';
  return SKIN_TONE_MAP[code] || code;
}

/**
 * 텍스트에서 긍정/부정 키워드 감지 및 카운트
 */
export function analyzeKeywordsInText(text: string): {
  positive: Record<string, number>;
  negative: Record<string, number>;
} {
  const result = {
    positive: {} as Record<string, number>,
    negative: {} as Record<string, number>
  };

  // 긍정 키워드 분석
  for (const keywords of Object.values(POSITIVE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        result.positive[keyword] = (result.positive[keyword] || 0) + 1;
      }
    }
  }

  // 부정 키워드 분석
  for (const keywords of Object.values(NEGATIVE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        result.negative[keyword] = (result.negative[keyword] || 0) + 1;
      }
    }
  }

  return result;
}

/**
 * 부정 맥락 감지 (예: "자극 없음", "트러블 없음")
 * 부정어 + 긍정적 맥락 = 실제로는 긍정적 의미
 */
export function isNegativeInPositiveContext(text: string, keyword: string): boolean {
  const positiveContextPatterns = [
    `${keyword} 없`, `${keyword}없`, `${keyword} 안`,
    `${keyword}안`, `안 ${keyword}`, `없이`
  ];
  return positiveContextPatterns.some(pattern => text.includes(pattern));
}
