/**
 * 올리브영 전체 리뷰 크롤러
 * 여러 정렬 기준으로 수집하여 최대한 많은 리뷰 확보
 *
 * 전략:
 * 1. 최신순으로 수집 → 최근 리뷰
 * 2. 평점높은순으로 수집 → 5점 리뷰
 * 3. 평점낮은순으로 수집 → 1-2점 리뷰
 * 4. 중복 제거 후 합치기
 */

import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Review, CrawlResult } from './lib/types';
import { parseOliveyoungInput, isValidInput } from './lib/oliveyoung-url-parser';
import { analyzeReviews, analyzeImprovementOpportunities } from './lib/review-analyzer';
import { generateMarkdownReport } from './lib/report-generator';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 리뷰 파싱
const parseReview = (item: any): Review => ({
  reviewId: item.reviewId,
  content: item.content || '',
  rating: item.reviewScore || 5,
  date: item.createdDateTime || '',
  option: item.goodsDto?.optionName,
  skinType: item.profileDto?.skinType,
  skinTone: item.profileDto?.skinTone,
  helpfulCount: item.recommendCount || 0,
  hasPhoto: item.hasPhoto || false,
  isRepurchase: item.isRepurchase || false,
  photoUrls: item.photoReviewList?.map((p: any) => p.imagePath) || []
});

interface CrawlState {
  reviews: Map<number, Review>;
  totalCount: number;
  productName: string;
  averageRating: number;
}

/**
 * 특정 정렬로 리뷰 수집
 */
async function crawlWithSort(
  page: Page,
  goodsNo: string,
  sortType: string,
  state: CrawlState,
  maxScrolls: number = 5000
): Promise<number> {

  const beforeCount = state.reviews.size;
  let noNewDataCount = 0;
  let scrollCount = 0;
  const startTime = Date.now();

  // API 응답 핸들러
  const handleResponse = async (response: any) => {
    const url = response.url();
    if (url.includes('/review/api/v2/reviews') &&
        !url.includes('stats') &&
        !url.includes('photo-reviews') &&
        !url.includes('count') &&
        !url.includes('options')) {
      try {
        const json = await response.json();
        if (json?.data && Array.isArray(json.data)) {
          for (const item of json.data) {
            if (item.reviewId && !state.reviews.has(item.reviewId)) {
              state.reviews.set(item.reviewId, parseReview(item));
            }
          }
        }
        if (json?.totalCnt) state.totalCount = json.totalCnt;
      } catch (e) {}
    }

    if (url.includes('/stats')) {
      try {
        const json = await response.json();
        if (json?.data) {
          if (json.data.goodsName) state.productName = json.data.goodsName;
          if (json.data.ratingDistribution?.averageRating) {
            state.averageRating = json.data.ratingDistribution.averageRating;
          }
        }
      } catch (e) {}
    }
  };

  page.on('response', handleResponse);

  // 페이지 로드
  const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await delay(3000);

  // 리뷰 영역으로 스크롤
  await page.evaluate(() => {
    const reviewArea = document.querySelector('[class*="ReviewArea"]');
    if (reviewArea) reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await delay(2000);

  // 정렬 버튼 클릭
  if (sortType !== 'RECENT') {
    try {
      const sortText = sortType === 'HIGH_SCORE' ? '평점높은순' : '평점낮은순';
      const sortBtn = page.locator(`button:has-text("${sortText}")`).first();
      if (await sortBtn.isVisible()) {
        await sortBtn.click();
        await delay(2000);
        console.log(`   📌 정렬 변경: ${sortText}`);
      }
    } catch (e) {
      console.log(`   ⚠️ 정렬 변경 실패`);
    }
  }

  // 스크롤 수집
  while (noNewDataCount < 80 && scrollCount < maxScrolls) {
    scrollCount++;
    const prevCount = state.reviews.size;

    await page.evaluate(() => window.scrollBy(0, 800));
    await delay(250);

    if (state.reviews.size > prevCount) {
      noNewDataCount = 0;
    } else {
      noNewDataCount++;
    }

    // 95% 수집 시 종료
    if (state.totalCount > 0 && state.reviews.size >= state.totalCount * 0.95) {
      console.log(`   ✅ 95% 달성!`);
      break;
    }

    // 30초마다 상태 출력
    if ((Date.now() - startTime) > 30000 && scrollCount % 100 === 0) {
      const pct = state.totalCount > 0 ? ((state.reviews.size / state.totalCount) * 100).toFixed(1) : '?';
      console.log(`   ⏱️ ${state.reviews.size.toLocaleString()}/${state.totalCount.toLocaleString()} (${pct}%)`);
    }
  }

  page.removeListener('response', handleResponse);

  const added = state.reviews.size - beforeCount;
  return added;
}

/**
 * 메인 크롤링 함수
 */
async function crawlAllReviews(goodsNo: string, headless: boolean = true): Promise<CrawlResult> {
  const state: CrawlState = {
    reviews: new Map(),
    totalCount: 0,
    productName: '',
    averageRating: 0
  };

  console.log('\n' + '═'.repeat(60));
  console.log('🚀 올리브영 전체 리뷰 크롤러 (Multi-Sort)');
  console.log('═'.repeat(60));
  console.log(`\n📌 상품번호: ${goodsNo}`);

  const browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    await page.addInitScript(`Object.defineProperty(navigator, 'webdriver', { get: () => undefined });`);

    // 1. 최신순 수집
    console.log('\n📖 [1/3] 최신순 수집...');
    const recentAdded = await crawlWithSort(page, goodsNo, 'RECENT', state, 4000);
    console.log(`   ✅ +${recentAdded.toLocaleString()}개 (총 ${state.reviews.size.toLocaleString()}개)`);

    // 2. 평점높은순 수집
    console.log('\n📖 [2/3] 평점높은순 수집...');
    const highAdded = await crawlWithSort(page, goodsNo, 'HIGH_SCORE', state, 4000);
    console.log(`   ✅ +${highAdded.toLocaleString()}개 (총 ${state.reviews.size.toLocaleString()}개)`);

    // 3. 평점낮은순 수집
    console.log('\n📖 [3/3] 평점낮은순 수집...');
    const lowAdded = await crawlWithSort(page, goodsNo, 'LOW_SCORE', state, 4000);
    console.log(`   ✅ +${lowAdded.toLocaleString()}개 (총 ${state.reviews.size.toLocaleString()}개)`);

    await browser.close();

    const reviews = Array.from(state.reviews.values());

    console.log('\n' + '─'.repeat(60));
    console.log(`📊 최종 수집: ${reviews.length.toLocaleString()}/${state.totalCount.toLocaleString()}개`);
    console.log(`   수집률: ${((reviews.length / state.totalCount) * 100).toFixed(1)}%`);

    return {
      productName: state.productName,
      goodsNumber: goodsNo,
      productUrl: `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`,
      totalReviews: reviews.length,
      averageRating: state.averageRating,
      ratingDistribution: {},
      reviews,
      crawledAt: new Date().toISOString()
    };

  } finally {
    await browser.close();
  }
}

/**
 * 결과 저장
 */
function saveResults(result: CrawlResult, outputDir: string): { jsonPath: string; csvPath: string } {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseFilename = `oliveyoung-${result.goodsNumber}-full-${timestamp}`;

  const jsonPath = path.join(outputDir, `${baseFilename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  const csvPath = path.join(outputDir, `${baseFilename}.csv`);
  const csvHeader = 'reviewId,rating,date,option,skinType,helpfulCount,hasPhoto,isRepurchase,content\n';
  const csvRows = result.reviews.map(r =>
    `${r.reviewId},${r.rating},"${r.date}","${r.option || ''}","${r.skinType || ''}",${r.helpfulCount},${r.hasPhoto},${r.isRepurchase},"${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

  return { jsonPath, csvPath };
}

// 메인
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('사용법: npx ts-node scripts/oliveyoung-full-crawler.ts <URL 또는 상품번호>');
    process.exit(1);
  }

  const parsed = parseOliveyoungInput(args[0]);
  if (!isValidInput(parsed)) {
    console.error('❌ 유효하지 않은 입력');
    process.exit(1);
  }

  const headless = args.includes('--headless');

  // 크롤링
  const crawlResult = await crawlAllReviews(parsed.goodsNo, headless);

  // 저장
  const { jsonPath, csvPath } = saveResults(crawlResult, './output');
  console.log(`\n📁 저장 완료:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   CSV: ${csvPath}`);

  // 분석
  console.log('\n📊 리뷰 분석 중...');
  const analysis = analyzeReviews(crawlResult);
  const improvements = analyzeImprovementOpportunities(crawlResult, analysis);

  // 리포트 생성
  const reportPath = generateMarkdownReport({
    crawlResult,
    analysis,
    improvements,
    outputDir: './output'
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 전체 프로세스 완료!');
  console.log('═'.repeat(60));
  console.log(`   📊 수집: ${crawlResult.totalReviews.toLocaleString()}개`);
  console.log(`   📝 리포트: ${reportPath}`);
}

main().catch(console.error);
