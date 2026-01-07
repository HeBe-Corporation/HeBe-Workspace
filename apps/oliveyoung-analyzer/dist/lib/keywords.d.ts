/**
 * 뷰티 리뷰 분석용 키워드 사전
 * 한국어(영어) 형식으로 표시
 */
export declare const KEYWORD_TRANSLATIONS: Record<string, string>;
export declare const CATEGORY_TRANSLATIONS: Record<string, string>;
export declare const POSITIVE_KEYWORDS: Record<string, string[]>;
export declare const NEGATIVE_KEYWORDS: Record<string, string[]>;
export declare function formatKeyword(keyword: string): string;
export declare function formatCategory(category: string): string;
export declare const SKIN_TYPE_MAP: Record<string, string>;
export declare function getAllPositiveKeywords(): string[];
export declare function getAllNegativeKeywords(): string[];
export declare function findKeywordCategory(keyword: string, isPositive: boolean): string;
export declare function getSkinTypeName(code: string | null | undefined): string;
export declare function isNegativeInPositiveContext(text: string, keyword: string): boolean;
//# sourceMappingURL=keywords.d.ts.map