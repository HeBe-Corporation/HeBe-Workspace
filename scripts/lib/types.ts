/**
 * 올리브영 리뷰 크롤러 타입 정의
 */

// 개별 리뷰 데이터
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

// 크롤링 옵션
export interface CrawlerOptions {
  goodsNo: string;
  headless?: boolean;
  maxReviews?: number;
  maxScrolls?: number;
  outputDir?: string;
}

// 크롤링 결과
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

// 옵션별 분석
export interface OptionAnalysis {
  name: string;
  count: number;
  avgRating: number;
  percentage: number;
}

// 키워드 분석 결과
export interface KeywordAnalysis {
  keyword: string;
  count: number;
  percentage: number;
  category: string;
}

// 기본 분석 결과
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

// 개선 기회
export interface ImprovementOpportunity {
  issue: string;
  frequency: number;
  sampleReviews: string[];
  opportunity: string;
  suggestedAction: string;
}

// 전체 분석 리포트
export interface AnalysisReport {
  crawlResult: CrawlResult;
  analysis: BasicAnalysis;
  improvements: ImprovementOpportunity[];
  generatedAt: string;
}
