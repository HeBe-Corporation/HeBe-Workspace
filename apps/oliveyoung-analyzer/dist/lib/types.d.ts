/**
 * 올리브영 리뷰 분석기 타입 정의
 */
export interface Review {
    reviewId: number;
    content: string;
    rating: number;
    date: string;
    option?: string;
    skinType?: string;
    skinTone?: string;
    helpfulCount: number;
    hasPhoto: boolean;
    isRepurchase: boolean;
    photoUrls: string[];
}
export interface CrawlResult {
    productName: string;
    goodsNumber: string;
    productUrl: string;
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<string, number>;
    reviews: Review[];
    crawledAt: string;
}
export interface OptionAnalysis {
    name: string;
    count: number;
    avgRating: number;
    percentage: number;
}
export interface KeywordAnalysis {
    keyword: string;
    count: number;
    percentage: number;
    category: string;
}
export interface BasicAnalysis {
    stats: {
        totalReviews: number;
        averageRating: number;
        ratingDistribution: Record<number, number>;
        repurchaseRate: number;
        repurchaseCount: number;
        photoRate: number;
        photoCount: number;
    };
    optionAnalysis: OptionAnalysis[];
    skinTypeDistribution: Record<string, number>;
    keywords: {
        positive: KeywordAnalysis[];
        negative: KeywordAnalysis[];
    };
    lowRatingReviews: Review[];
    highlightQuotes: string[];
}
export interface ImprovementOpportunity {
    issue: string;
    frequency: number;
    sampleReviews: string[];
    opportunity: string;
    suggestedAction: string;
}
export interface CrawlState {
    reviews: Map<number, Review>;
    totalCount: number;
    productName: string;
    averageRating: number;
}
export type ProgressCallback = (message: string, percent: number) => void;
//# sourceMappingURL=types.d.ts.map