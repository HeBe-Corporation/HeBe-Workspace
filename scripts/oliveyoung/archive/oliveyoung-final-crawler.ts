/**
 * 올리브영 리뷰 크롤러 - Network Intercept 방식 (최종)
 *
 * 브라우저를 실제로 스크롤하면서 자동 호출되는 API 응답을 캡처
 * 가장 안정적인 방식
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-final-crawler.ts <상품번호>
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 리뷰 데이터 타입
interface Review {
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

interface CrawlResult {
  productName: string;
  goodsNumber: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  reviews: Review[];
  crawledAt: string;
}

// 전역 상태
const collectedReviews: Review[] = [];
const seenReviewIds = new Set<number>();
let totalReviewCount = 0;
let averageRating = 0;
let ratingDistribution: { [key: number]: number } = {};
let productName = '';

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

// API 응답 처리
const handleApiResponse = (json: any): number => {
  let addedCount = 0;

  // 리뷰 데이터 추출
  if (json?.data && Array.isArray(json.data)) {
    for (const item of json.data) {
      if (item.reviewId && !seenReviewIds.has(item.reviewId)) {
        seenReviewIds.add(item.reviewId);
        collectedReviews.push(parseReview(item));
        addedCount++;
      }
    }
  }

  // 총 리뷰 수
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

// 결과 저장
const saveResults = (result: CrawlResult, outputDir: string): void => {
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

  console.log(`\n📁 저장 완료:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   CSV: ${csvPath}`);
};

// 메인 크롤링 함수
const crawlReviews = async (goodsNumber: string): Promise<CrawlResult> => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 올리브영 리뷰 크롤러 (Network Intercept)');
  console.log('='.repeat(60));
  console.log(`\n📌 상품번호: ${goodsNumber}\n`);

  // 상태 초기화
  collectedReviews.length = 0;
  seenReviewIds.clear();
  totalReviewCount = 0;
  averageRating = 0;
  ratingDistribution = {};
  productName = '';

  const browser = await chromium.launch({
    headless: false,
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
    console.log('🌐 페이지 로딩...');
    await page.goto(`https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNumber}&tab=review`, {
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
    console.log(`   초기 수집: ${collectedReviews.length}개\n`);

    // 2. 리뷰 영역으로 스크롤
    console.log('📖 리뷰 수집 중...');

    await page.evaluate(() => {
      const reviewArea = document.querySelector('[class*="ReviewArea"]');
      if (reviewArea) reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(2000);

    // 3. 무한 스크롤로 리뷰 로딩
    let noNewDataCount = 0;
    const maxNoNewData = 20;  // 연속 20회 새 데이터 없으면 종료
    let scrollCount = 0;
    const maxScrolls = 1000;  // 최대 1000번 스크롤

    while (noNewDataCount < maxNoNewData && scrollCount < maxScrolls) {
      scrollCount++;
      const beforeCount = collectedReviews.length;

      // 스크롤
      await page.evaluate(() => window.scrollBy(0, 500));
      await delay(800);

      // 새 데이터 체크
      if (collectedReviews.length > beforeCount) {
        noNewDataCount = 0;

        // 진행률 표시 (100개마다)
        if (collectedReviews.length % 100 < 10 && collectedReviews.length > 100) {
          console.log(`   🎯 ${collectedReviews.length}/${totalReviewCount} 수집 완료!`);
        }
      } else {
        noNewDataCount++;
      }

      // 95% 이상 수집하면 종료
      if (totalReviewCount > 0 && collectedReviews.length >= totalReviewCount * 0.95) {
        console.log(`\n   ✅ 95% 이상 수집 완료!`);
        break;
      }

      // 진행 상황 (200스크롤마다)
      if (scrollCount % 200 === 0) {
        const pct = totalReviewCount > 0 ? ((collectedReviews.length / totalReviewCount) * 100).toFixed(1) : '?';
        console.log(`   스크롤 ${scrollCount}: ${collectedReviews.length}/${totalReviewCount} (${pct}%)`);
      }
    }

    // 종료 이유
    if (noNewDataCount >= maxNoNewData) {
      console.log(`\n   ⚠️ 더 이상 새 리뷰 없음 (${noNewDataCount}회 연속)`);
    }

    console.log(`\n✅ 수집 완료: ${collectedReviews.length}/${totalReviewCount}개`);

    // 결과 생성
    const result: CrawlResult = {
      productName,
      goodsNumber,
      totalReviews: collectedReviews.length,
      averageRating,
      ratingDistribution,
      reviews: collectedReviews,
      crawledAt: new Date().toISOString()
    };

    // 저장
    saveResults(result, './output');

    return result;

  } finally {
    await browser.close();
    console.log('\n🏁 크롤링 완료!');
  }
};

// CLI 실행
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
사용법: npx ts-node scripts/oliveyoung-final-crawler.ts <상품번호>

예시:
  npx ts-node scripts/oliveyoung-final-crawler.ts A000000235842
    `);
    process.exit(1);
  }

  const goodsNumber = args[0];

  try {
    await crawlReviews(goodsNumber);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
