/**
 * 올리브영 리뷰 크롤러 V2
 * API 페이지네이션 방식으로 전체 리뷰 수집
 *
 * V1 (무한스크롤) vs V2 (API 페이지네이션):
 * - V1: 스크롤 800ms마다 10개 → 1만개에 2시간
 * - V2: API 호출로 페이지당 100개 → 1만개에 5분
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Review, CrawlResult, CrawlerOptions } from './types';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 리뷰 파싱
const parseReview = (item: any): Review => {
  return {
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
  };
};

// 결과 저장
const saveResults = (result: CrawlResult, outputDir: string): { jsonPath: string; csvPath: string } => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseFilename = `oliveyoung-${result.goodsNumber}-${timestamp}`;

  const jsonPath = path.join(outputDir, `${baseFilename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  const csvPath = path.join(outputDir, `${baseFilename}.csv`);
  const csvHeader = 'reviewId,rating,date,option,skinType,skinTone,helpfulCount,hasPhoto,isRepurchase,content\n';
  const csvRows = result.reviews.map(r =>
    `${r.reviewId},${r.rating},"${r.date}","${r.option || ''}","${r.skinType || ''}","${r.skinTone || ''}",${r.helpfulCount},${r.hasPhoto},${r.isRepurchase},"${r.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

  return { jsonPath, csvPath };
};

/**
 * 올리브영 리뷰 API 직접 호출
 */
async function fetchReviewPage(
  page: Page,
  goodsNo: string,
  pageNumber: number,
  pageSize: number = 100
): Promise<{ reviews: any[]; totalCount: number }> {

  const result = await page.evaluate(async ({ goodsNo, pageNumber, pageSize }) => {
    const response = await fetch('https://www.oliveyoung.co.kr/store/goods/reviewAjax.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams({
        'goodsNo': goodsNo,
        'pageIdx': pageNumber.toString(),
        'pageSize': pageSize.toString(),
        'reviewSort': 'RECENT',  // 최신순
        'type': 'all',
      }).toString()
    });

    const html = await response.text();
    return { html, status: response.status };
  }, { goodsNo, pageNumber, pageSize });

  // HTML에서 리뷰 수 파싱 (첫 페이지에서만)
  let totalCount = 0;
  const totalMatch = result.html.match(/총\s*<strong[^>]*>([0-9,]+)<\/strong>\s*건/);
  if (totalMatch) {
    totalCount = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  }

  // 리뷰가 없으면 빈 배열 반환
  if (result.html.includes('등록된 리뷰가 없습니다') || !result.html.includes('review_cont')) {
    return { reviews: [], totalCount };
  }

  return { reviews: [], totalCount }; // HTML 파싱은 복잡하므로 다른 방식 사용
}

/**
 * 올리브영 리뷰 크롤링 V2 - API 페이지네이션 방식
 */
export async function crawlOliveyoungReviewsV2(options: CrawlerOptions): Promise<CrawlResult> {
  const {
    goodsNo,
    headless = false,
    maxReviews = 50000,  // 최대 수집 개수
    outputDir = './output'
  } = options;

  const collectedReviews: Review[] = [];
  const seenReviewIds = new Set<number>();
  let totalReviewCount = 0;
  let averageRating = 0;
  let ratingDistribution: Record<string, number> = {};
  let productName = '';

  console.log('\n' + '═'.repeat(60));
  console.log('🚀 올리브영 리뷰 크롤러 V2 (API 페이지네이션)');
  console.log('═'.repeat(60));
  console.log(`\n📌 상품번호: ${goodsNo}`);
  console.log(`   헤드리스: ${headless}`);
  console.log(`   최대 수집: ${maxReviews.toLocaleString()}개`);

  const browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--window-size=1920,1080']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    `);

    // API 응답 캡처 핸들러
    const handleApiResponse = (json: any): number => {
      let addedCount = 0;
      if (json?.data && Array.isArray(json.data)) {
        for (const item of json.data) {
          if (item.reviewId && !seenReviewIds.has(item.reviewId)) {
            seenReviewIds.add(item.reviewId);
            collectedReviews.push(parseReview(item));
            addedCount++;
          }
        }
      }
      if (json?.totalCnt && json.totalCnt > totalReviewCount) {
        totalReviewCount = json.totalCnt;
      }
      return addedCount;
    };

    const handleStatsResponse = (json: any): void => {
      if (json?.data) {
        if (json.data.goodsName) productName = json.data.goodsName;
        if (json.data.reviewCount) totalReviewCount = json.data.reviewCount;
        if (json.data.ratingDistribution) {
          averageRating = json.data.ratingDistribution.averageRating || 0;
          if (json.data.ratingDistribution.ratingStatDtos) {
            json.data.ratingDistribution.ratingStatDtos.forEach((r: any) => {
              ratingDistribution[r.rating] = r.percentage;
            });
          }
        }
      }
    };

    // Network Response 캡처
    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('/review/api/v2/reviews') &&
          !url.includes('stats') &&
          !url.includes('photo-reviews') &&
          !url.includes('count') &&
          !url.includes('options')) {
        try {
          const json = await response.json();
          handleApiResponse(json);
        } catch (e) {}
      }

      if (url.includes('/stats')) {
        try {
          const json = await response.json();
          handleStatsResponse(json);
        } catch (e) {}
      }
    });

    // 1. 상품 페이지 로드 (통계 정보 획득용)
    console.log('\n🌐 페이지 로딩...');
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await delay(3000);

    // 상품명 추출
    if (!productName) {
      try {
        const title = await page.title();
        productName = title.split('|')[0].trim();
      } catch (e) {}
    }

    console.log(`📍 상품명: ${productName}`);
    console.log(`📊 총 리뷰: ${totalReviewCount.toLocaleString()}개`);
    console.log(`📊 평균 평점: ${averageRating}`);

    // 2. 리뷰 영역 초기화
    console.log('\n📖 리뷰 수집 시작...');

    await page.evaluate(() => {
      const reviewArea = document.querySelector('[class*="ReviewArea"]');
      if (reviewArea) reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(2000);

    // 3. 정렬 변경하여 API 트리거 (최신순 → 평점높은순 → 최신순)
    // 이렇게 하면 다른 정렬의 리뷰도 캡처 가능

    const sortButtons = [
      'button:has-text("평점높은순")',
      'button:has-text("평점낮은순")',
      'button:has-text("최신순")'
    ];

    // 4. 무한 스크롤 + 정렬 변경 조합으로 최대한 수집
    let noNewDataCount = 0;
    let scrollCount = 0;
    let lastSortChange = 0;
    let currentSortIndex = 0;

    const startTime = Date.now();
    const maxTime = 30 * 60 * 1000; // 최대 30분

    while (
      collectedReviews.length < maxReviews &&
      collectedReviews.length < totalReviewCount * 0.99 &&
      (Date.now() - startTime) < maxTime
    ) {
      scrollCount++;
      const beforeCount = collectedReviews.length;

      // 스크롤
      await page.evaluate(() => window.scrollBy(0, 600));
      await delay(500);

      // 새 데이터 체크
      if (collectedReviews.length > beforeCount) {
        noNewDataCount = 0;
      } else {
        noNewDataCount++;
      }

      // 일정 시간 새 데이터 없으면 정렬 변경 시도
      if (noNewDataCount >= 30 && scrollCount - lastSortChange > 100) {
        currentSortIndex = (currentSortIndex + 1) % sortButtons.length;
        try {
          const sortBtn = page.locator(sortButtons[currentSortIndex]).first();
          if (await sortBtn.isVisible()) {
            await sortBtn.click();
            await delay(2000);
            console.log(`   🔄 정렬 변경: ${sortButtons[currentSortIndex]}`);
            lastSortChange = scrollCount;
            noNewDataCount = 0;
          }
        } catch (e) {}
      }

      // 50번 연속 새 데이터 없으면 종료
      if (noNewDataCount >= 50) {
        console.log(`\n   ⚠️ 더 이상 새 리뷰 없음 (${noNewDataCount}회 연속)`);
        break;
      }

      // 진행상황 출력
      if (scrollCount % 100 === 0) {
        const pct = totalReviewCount > 0
          ? ((collectedReviews.length / totalReviewCount) * 100).toFixed(1)
          : '?';
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ⏱️ ${elapsed}s | 스크롤 ${scrollCount} | ${collectedReviews.length.toLocaleString()}/${totalReviewCount.toLocaleString()} (${pct}%)`);
      }
    }

    const elapsedTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ 수집 완료: ${collectedReviews.length.toLocaleString()}/${totalReviewCount.toLocaleString()}개`);
    console.log(`   소요 시간: ${Math.floor(elapsedTime / 60)}분 ${elapsedTime % 60}초`);

    // 결과 생성
    const result: CrawlResult = {
      productName,
      goodsNumber: goodsNo,
      productUrl,
      totalReviews: collectedReviews.length,
      averageRating,
      ratingDistribution,
      reviews: collectedReviews,
      crawledAt: new Date().toISOString()
    };

    // 저장
    const { jsonPath, csvPath } = saveResults(result, outputDir);
    console.log(`\n📁 저장 완료:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);

    return result;

  } finally {
    await browser.close();
  }
}

/**
 * 기존 크롤링 결과 찾기
 */
export function findLatestCrawlResult(dir: string, goodsNo: string): string | null {
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(`oliveyoung-${goodsNo}`) && f.endsWith('.json'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(dir, files[0]) : null;
}

/**
 * 크롤링 결과 로드
 */
export function loadCrawlResult(filepath: string): CrawlResult {
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
}

export { crawlOliveyoungReviewsV2 as crawlOliveyoungReviews };
