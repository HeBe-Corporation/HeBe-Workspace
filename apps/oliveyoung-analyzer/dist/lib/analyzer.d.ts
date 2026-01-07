/**
 * 리뷰 분석 모듈
 */
import { CrawlResult, BasicAnalysis, ImprovementOpportunity } from './types';
export declare function analyzeReviews(crawlResult: CrawlResult): BasicAnalysis;
export declare function analyzeImprovementOpportunities(crawlResult: CrawlResult, analysis: BasicAnalysis): ImprovementOpportunity[];
//# sourceMappingURL=analyzer.d.ts.map