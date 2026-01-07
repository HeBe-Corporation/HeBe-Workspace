/**
 * 마크다운 리포트 생성기
 * 한국어(영어) 형식의 상세 분석 보고서
 */
import { CrawlResult, BasicAnalysis, ImprovementOpportunity } from './types';
interface ReportOptions {
    crawlResult: CrawlResult;
    analysis: BasicAnalysis;
    improvements: ImprovementOpportunity[];
    outputDir: string;
}
export declare function createOrganizedPath(productName: string, baseDir: string): string;
export declare function generateMarkdownReport(options: ReportOptions): string;
export declare function saveResults(crawlResult: CrawlResult, baseDir: string): {
    jsonPath: string;
    csvPath: string;
    organizedDir: string;
};
export {};
//# sourceMappingURL=reporter.d.ts.map