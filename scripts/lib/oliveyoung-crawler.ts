/**
 * 올리브영 리뷰 크롤러 모듈
 * Network Intercept 방식으로 API 응답 캡처
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Review, CrawlResult, CrawlerOptions } from './types';

// 딜레이 함수
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

  // JSON 저장
  const jsonPath = path.join(outputDir, `${baseFilename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  // CSV 저장
  const csvPath = path.join(outputDir, `${baseFilename}.csv`);
  const csvHeader = 'reviewId,rating,date,option,skinType,skinTone,helpfulCount,hasPhoto,isRepurchase,content\n';
  const csvRows = result.reviews.map(r =>
    `${r.reviewId},${r.rating},"${r.date}","${r.option || ''}","${r.skinType || ''}","${r.skinTone || ''}",${r.helpfulCount},${r.hasPhoto},${r.isRepurchase},"${r.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

  return { jsonPath, csvPath };
};

/**
 * 올리브영 리뷰 크롤링 메인 함수
 */
export async function crawlOliveyoungReviews(options: CrawlerOptions): Promise<CrawlResult> {
  const {
    goodsNo,
    headless = false,
    maxScrolls = 15000,  // 1만개 리뷰 수집을 위해 증가
    outputDir = './output'
  } = options;

  // 크롤링 상태
  const collectedReviews: Review[] = [];
  const seenReviewIds = new Set<number>();
  let totalReviewCount = 0;
  let averageRating = 0;
  let ratingDistribution: Record<string, number> = {};
  let productName = '';

  // API 응답 처리
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

  // 통계 API 응답 처리
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

  console.log('\n' + '='.repeat(60));
  console.log('🚀 올리브영 리뷰 크롤러');
  console.log('='.repeat(60));
  console.log(`\n📌 상품번호: ${goodsNo}`);
  console.log(`   헤드리스: ${headless}`);

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

    // Network Response 캡처
    page.on('response', async (response) => {
      const url = response.url();

      // 리뷰 목록 API
      if (url.includes('/review/api/v2/reviews') &&
          !url.includes('stats') &&
          !url.includes('photo-reviews') &&
          !url.includes('count') &&
          !url.includes('options')) {
        try {
          const json = await response.json();
          const added = handleApiResponse(json);
          if (added > 0) {
            const pct = totalReviewCount > 0 ? ((collectedReviews.length / totalReviewCount) * 100).toFixed(1) : '?';
            console.log(`   📡 +${added}개 → ${collectedReviews.length}/${totalReviewCount} (${pct}%)`);
          }
        } catch (e) {}
      }

      // 통계 API
      if (url.includes('/stats')) {
        try {
          const json = await response.json();
          handleStatsResponse(json);
        } catch (e) {}
      }
    });

    // 1. 상품 페이지 로드
    console.log('\n🌐 페이지 로딩...');
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await delay(4000);

    // 상품명 추출
    if (!productName) {
      try {
        const title = await page.title();
        productName = title.split('|')[0].trim();
      } catch (e) {}
    }

    console.log(`📍 상품명: ${productName}`);
    console.log(`📊 총 리뷰: ${totalReviewCount}개`);
    console.log(`📊 평균 평점: ${averageRating}`);

    // 2. 리뷰 영역으로 스크롤
    console.log('\n📖 리뷰 수집 중...');

    await page.evaluate(() => {
      const reviewArea = document.querySelector('[class*="ReviewArea"]');
      if (reviewArea) reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(2000);

    // 3. 무한 스크롤로 리뷰 로딩 (고속 모드)
    let noNewDataCount = 0;
    const maxNoNewData = 100;  // 100번 연속 새 데이터 없으면 종료 (기존 20)
    let scrollCount = 0;
    const startTime = Date.now();
    let lastProgressTime = startTime;

    console.log(`   🎯 목표: ${totalReviewCount.toLocaleString()}개 리뷰 수집`);

    while (noNewDataCount < maxNoNewData && scrollCount < maxScrolls) {
      scrollCount++;
      const beforeCount = collectedReviews.length;

      // 더 빠른 스크롤 (500 → 800px, delay 800ms → 300ms)
      await page.evaluate(() => window.scrollBy(0, 800));
      await delay(300);

      if (collectedReviews.length > beforeCount) {
        noNewDataCount = 0;
      } else {
        noNewDataCount++;
      }

      // 98% 이상 수집하면 종료
      if (totalReviewCount > 0 && collectedReviews.length >= totalReviewCount * 0.98) {
        console.log(`\n   ✅ 98% 이상 수집 완료!`);
        break;
      }

      // 30초마다 진행상황 출력 (매 200번 → 시간 기반)
      const now = Date.now();
      if (now - lastProgressTime >= 30000) {
        const pct = totalReviewCount > 0 ? ((collectedReviews.length / totalReviewCount) * 100).toFixed(1) : '?';
        const elapsed = Math.floor((now - startTime) / 1000);
        const rate = elapsed > 0 ? Math.round(collectedReviews.length / elapsed * 60) : 0;
        console.log(`   ⏱️ ${Math.floor(elapsed/60)}분${elapsed%60}초 | ${collectedReviews.length.toLocaleString()}/${totalReviewCount.toLocaleString()} (${pct}%) | ${rate.toLocaleString()}/분`);
        lastProgressTime = now;
      }

      // 연속 50번 새 데이터 없으면 페이지 새로고침 시도
      if (noNewDataCount === 50) {
        console.log(`   🔄 데이터 로딩 대기 중... (${noNewDataCount}회)`);
        await delay(2000);  // 2초 대기
      }
    }

    const elapsedTotal = Math.floor((Date.now() - startTime) / 1000);
    if (noNewDataCount >= maxNoNewData) {
      console.log(`\n   ⚠️ 더 이상 새 리뷰 없음 (${noNewDataCount}회 연속 대기 후 종료)`);
    }
    console.log(`   ⏱️ 총 소요시간: ${Math.floor(elapsedTotal/60)}분 ${elapsedTotal%60}초`)

    console.log(`\n✅ 수집 완료: ${collectedReviews.length}/${totalReviewCount}개`);

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
    console.log('\n🏁 크롤링 완료!');
  }
}

/**
 * 가장 최근 크롤링 결과 파일 찾기
 */
export function findLatestCrawlResult(outputDir: string = './output', goodsNo?: string): string | null {
  if (!fs.existsSync(outputDir)) return null;

  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('oliveyoung-') && f.endsWith('.json'))
    .filter(f => !goodsNo || f.includes(goodsNo))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(outputDir, files[0]) : null;
}

/**
 * 크롤링 결과 파일 로드
 */
export function loadCrawlResult(filePath: string): CrawlResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}
