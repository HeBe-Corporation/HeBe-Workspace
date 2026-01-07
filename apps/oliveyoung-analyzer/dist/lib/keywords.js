"use strict";
/**
 * 뷰티 리뷰 분석용 키워드 사전
 * 한국어(영어) 형식으로 표시
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKIN_TYPE_MAP = exports.NEGATIVE_KEYWORDS = exports.POSITIVE_KEYWORDS = exports.CATEGORY_TRANSLATIONS = exports.KEYWORD_TRANSLATIONS = void 0;
exports.formatKeyword = formatKeyword;
exports.formatCategory = formatCategory;
exports.getAllPositiveKeywords = getAllPositiveKeywords;
exports.getAllNegativeKeywords = getAllNegativeKeywords;
exports.findKeywordCategory = findKeywordCategory;
exports.getSkinTypeName = getSkinTypeName;
exports.isNegativeInPositiveContext = isNegativeInPositiveContext;
// 키워드 한→영 번역
exports.KEYWORD_TRANSLATIONS = {
    // 긍정 - texture
    '촉촉': 'moist', '수분': 'hydrating', '쫀쫀': 'bouncy', '부드러': 'soft',
    '탱탱': 'firm', '촉촉해': 'moisturizing', '보습': 'moisturizing',
    // 긍정 - effect
    '탄력': 'elasticity', '광': 'glow', '톤업': 'brightening', '리프팅': 'lifting',
    '진정': 'soothing', '개선': 'improvement', '효과': 'effective',
    // 긍정 - usability
    '간편': 'convenient', '노워시': 'no-wash', '빠른': 'fast', '간단': 'simple',
    '편리': 'easy', '쉬운': 'easy', '10초': '10-sec',
    // 긍정 - satisfaction
    '재구매': 'repurchase', '추천': 'recommend', '대란': 'best-seller',
    '인생템': 'HG product', '최고': 'best', '만족': 'satisfied', '좋아': 'love it',
    // 긍정 - makeup
    '화잘먹': 'makeup-friendly', '밀착': 'adherent', '지속력': 'long-lasting',
    '화장': 'makeup', '메이크업': 'makeup',
    // 긍정 - skincare
    '피부결': 'skin texture', '모공': 'pores', '각질': 'dead skin',
    '맑아': 'clear', '화사': 'radiant', '깨끗': 'clean',
    // 부정 - effect
    '효과없': 'ineffective', '기대이하': 'disappointing', '과대광고': 'overhyped',
    '아쉬': 'lacking', '별로': 'not great', '실망': 'disappointed', '모르겠': 'unsure',
    // 부정 - irritation
    '자극': 'irritation', '트러블': 'breakout', '따가': 'stinging',
    '붉어': 'redness', '뾰루지': 'pimple', '알러지': 'allergy',
    // 부정 - texture
    '끈적': 'sticky', '무거': 'heavy', '답답': 'stuffy', '기름': 'oily', '번들': 'greasy',
    // 부정 - smell
    '냄새': 'smell', '향': 'scent', '가스냄새': 'chemical smell', '거북': 'unpleasant',
    // 부정 - price
    '비싸': 'expensive', '가격': 'price', '비쌈': 'pricey', '아깝': 'not worth it',
    // 부정 - usability
    '불편': 'inconvenient', '어려': 'difficult', '번거': 'hassle'
};
// 카테고리 한→영 번역
exports.CATEGORY_TRANSLATIONS = {
    texture: '텍스처(Texture)',
    effect: '효과(Effect)',
    usability: '사용성(Usability)',
    satisfaction: '만족도(Satisfaction)',
    makeup: '메이크업(Makeup)',
    skincare: '스킨케어(Skincare)',
    irritation: '자극(Irritation)',
    smell: '향(Scent)',
    price: '가격(Price)',
    unknown: '기타(Others)'
};
// 긍정 키워드 (카테고리별)
exports.POSITIVE_KEYWORDS = {
    texture: ['촉촉', '수분', '쫀쫀', '부드러', '탱탱', '촉촉해', '보습'],
    effect: ['탄력', '광', '톤업', '리프팅', '진정', '개선', '효과'],
    usability: ['간편', '노워시', '빠른', '간단', '편리', '쉬운', '10초'],
    satisfaction: ['재구매', '추천', '대란', '인생템', '최고', '만족', '좋아'],
    makeup: ['화잘먹', '밀착', '지속력', '화장', '메이크업'],
    skincare: ['피부결', '모공', '각질', '맑아', '화사', '깨끗']
};
// 부정 키워드 (카테고리별)
exports.NEGATIVE_KEYWORDS = {
    effect: ['효과없', '기대이하', '과대광고', '아쉬', '별로', '실망', '모르겠'],
    irritation: ['자극', '트러블', '따가', '붉어', '뾰루지', '알러지'],
    texture: ['끈적', '무거', '답답', '기름', '번들'],
    smell: ['냄새', '향', '가스냄새', '거북'],
    price: ['비싸', '가격', '비쌈', '아깝'],
    usability: ['불편', '어려', '번거']
};
// 키워드를 한국어(영어) 형식으로 변환
function formatKeyword(keyword) {
    const eng = exports.KEYWORD_TRANSLATIONS[keyword];
    return eng ? `${keyword}(${eng})` : keyword;
}
// 카테고리를 한국어(영어) 형식으로 변환
function formatCategory(category) {
    return exports.CATEGORY_TRANSLATIONS[category] || category;
}
// 피부타입 코드 → 한글 매핑
exports.SKIN_TYPE_MAP = {
    'A01': '건성',
    'A02': '중성',
    'A03': '지성',
    'A04': '복합성',
    'A05': '민감성',
    'A06': '트러블성',
    'A07': '아토피성'
};
// 모든 긍정 키워드 배열 반환
function getAllPositiveKeywords() {
    return Object.values(exports.POSITIVE_KEYWORDS).flat();
}
// 모든 부정 키워드 배열 반환
function getAllNegativeKeywords() {
    return Object.values(exports.NEGATIVE_KEYWORDS).flat();
}
// 키워드가 속한 카테고리 찾기
function findKeywordCategory(keyword, isPositive) {
    const dict = isPositive ? exports.POSITIVE_KEYWORDS : exports.NEGATIVE_KEYWORDS;
    for (const [category, keywords] of Object.entries(dict)) {
        if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
            return category;
        }
    }
    return 'unknown';
}
// 피부타입 코드를 한글로 변환
function getSkinTypeName(code) {
    if (!code)
        return '미입력';
    return exports.SKIN_TYPE_MAP[code] || code;
}
// 부정 맥락 감지 (예: "자극 없음", "트러블 없음")
function isNegativeInPositiveContext(text, keyword) {
    const positiveContextPatterns = [
        `${keyword} 없`, `${keyword}없`, `${keyword} 안`,
        `${keyword}안`, `안 ${keyword}`, `없이`
    ];
    return positiveContextPatterns.some(pattern => text.includes(pattern));
}
//# sourceMappingURL=keywords.js.map