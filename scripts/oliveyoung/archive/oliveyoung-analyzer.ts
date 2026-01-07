/**
 * 올리브영 리뷰 분석기 - CLI 진입점
 *
 * 사용법:
 *   npx ts-node scripts/oliveyoung-analyzer.ts <URL 또는 상품번호>
 *   npx ts-node scripts/oliveyoung-analyzer.ts https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842
 *   npx ts-node scripts/oliveyoung-analyzer.ts A000000235842
 *
 * 옵션:
 *   --headless    브라우저 숨김 모드 (기본: false)
 *   --skip-crawl  크롤링 건너뛰고 기존 데이터로 분석만
 *   --max-scrolls 최대 스크롤 횟수 (기본: 1000)
 */

import { parseOliveyoungInput, isValidInput, buildReviewPageUrl } from './lib/oliveyoung-url-parser';
import { crawlOliveyoungReviews, findLatestCrawlResult, loadCrawlResult } from './lib/oliveyoung-crawler';
import { analyzeReviews, analyzeImprovementOpportunities } from './lib/review-analyzer';
import { generateMarkdownReport } from './lib/report-generator';

interface CliOptions {
  input: string;
  headless: boolean;
  skipCrawl: boolean;
  maxScrolls: number;
}

// 인자 파싱
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    input: '',
    headless: false,
    skipCrawl: false,
    maxScrolls: 1000
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--skip-crawl') {
      options.skipCrawl = true;
    } else if (arg === '--max-scrolls' && args[i + 1]) {
      options.maxScrolls = parseInt(args[i + 1], 10);
      i++;
    } else if (!arg.startsWith('--')) {
      options.input = arg;
    }
  }

  return options;
}

// 도움말 출력
function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           올리브영 리뷰 분석기 (oliveyoung-analyzer)           ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  npx ts-node scripts/oliveyoung-analyzer.ts <URL 또는 상품번호> [옵션]

예시:
  npx ts-node scripts/oliveyoung-analyzer.ts https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842
  npx ts-node scripts/oliveyoung-analyzer.ts A000000235842
  npx ts-node scripts/oliveyoung-analyzer.ts A000000235842 --headless
  npx ts-node scripts/oliveyoung-analyzer.ts A000000235842 --skip-crawl

옵션:
  --headless      브라우저 숨김 모드 (기본: 보이기)
  --skip-crawl    크롤링 건너뛰고 기존 데이터로 분석만
  --max-scrolls   최대 스크롤 횟수 (기본: 1000)

출력:
  ./output/oliveyoung-{상품번호}-{날짜}.json   원본 데이터
  ./output/oliveyoung-{상품번호}-{날짜}.csv    CSV 형식
  ./output/{상품명}-review-analysis-{날짜}.md  분석 리포트
  `);
}

// 메인 함수
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // 도움말 요청
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options = parseArgs(args);

  // 입력 파싱
  const parsed = parseOliveyoungInput(options.input);

  if (!isValidInput(parsed)) {
    console.error('❌ 유효하지 않은 입력입니다.');
    console.error('   올리브영 URL 또는 상품번호(예: A000000235842)를 입력하세요.');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('   올리브영 리뷰 분석기');
  console.log('═'.repeat(60));
  console.log(`\n📌 상품번호: ${parsed.goodsNo}`);
  console.log(`   입력 형식: ${parsed.source}`);
  console.log(`   URL: ${buildReviewPageUrl(parsed.goodsNo)}`);

  let crawlResult;

  // 크롤링 또는 기존 데이터 로드
  if (options.skipCrawl) {
    console.log('\n⏭️  크롤링 건너뛰기 (--skip-crawl)');
    const latestFile = findLatestCrawlResult('./output', parsed.goodsNo);

    if (!latestFile) {
      console.error('❌ 기존 크롤링 데이터가 없습니다. 먼저 크롤링을 실행하세요.');
      process.exit(1);
    }

    console.log(`📂 기존 데이터 로드: ${latestFile}`);
    crawlResult = loadCrawlResult(latestFile);
  } else {
    console.log(`\n🚀 크롤링 시작...`);
    console.log(`   헤드리스: ${options.headless}`);
    console.log(`   최대 스크롤: ${options.maxScrolls}`);

    crawlResult = await crawlOliveyoungReviews({
      goodsNo: parsed.goodsNo,
      headless: options.headless,
      maxScrolls: options.maxScrolls,
      outputDir: './output'
    });
  }

  // 분석 수행
  console.log('\n📊 리뷰 분석 중...');
  const analysis = analyzeReviews(crawlResult);
  const improvements = analyzeImprovementOpportunities(crawlResult, analysis);

  // 분석 결과 요약 출력
  console.log('\n' + '─'.repeat(60));
  console.log('📈 분석 결과 요약');
  console.log('─'.repeat(60));
  console.log(`   총 리뷰: ${analysis.stats.totalReviews.toLocaleString()}개`);
  console.log(`   평균 평점: ${analysis.stats.averageRating}`);
  console.log(`   재구매율: ${analysis.stats.repurchaseRate}%`);
  console.log(`   사진 포함율: ${analysis.stats.photoRate}%`);

  console.log('\n   🟢 긍정 키워드 TOP 5:');
  analysis.keywords.positive.slice(0, 5).forEach(kw => {
    console.log(`      - ${kw.keyword}: ${kw.count}건 (${kw.percentage}%)`);
  });

  console.log('\n   🔴 부정 키워드 TOP 5:');
  analysis.keywords.negative.slice(0, 5).forEach(kw => {
    console.log(`      - ${kw.keyword}: ${kw.count}건 (${kw.percentage}%)`);
  });

  console.log('\n   💡 개선 기회:');
  improvements.slice(0, 3).forEach(imp => {
    console.log(`      - ${imp.issue}: ${imp.opportunity}`);
  });

  // 리포트 생성
  console.log('\n📝 리포트 생성 중...');
  const reportPath = generateMarkdownReport({
    crawlResult,
    analysis,
    improvements,
    outputDir: './output'
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 분석 완료!');
  console.log('═'.repeat(60));
  console.log(`\n📁 생성된 파일:`);
  console.log(`   📊 리포트: ${reportPath}`);
  console.log(`\n💡 리포트를 NotebookLM에 업로드하여 AI 인사이트를 얻으세요!`);
}

// 실행
main().catch(error => {
  console.error('\n❌ 오류 발생:', error.message);
  process.exit(1);
});
