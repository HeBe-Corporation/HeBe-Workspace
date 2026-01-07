/**
 * 올리브영 리뷰 크롤러
 * Multi-Sort 전략으로 최대한 많은 리뷰 수집
 */
import { CrawlResult, ProgressCallback } from './types';
export declare function extractGoodsNo(input: string): string | null;
export declare function crawlReviews(goodsNo: string, onProgress: ProgressCallback): Promise<CrawlResult>;
//# sourceMappingURL=crawler.d.ts.map