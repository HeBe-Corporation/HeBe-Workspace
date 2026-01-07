/**
 * 올리브영 리뷰 크롤러 - URL 기반 페이지네이션
 *
 * 각 페이지를 새 URL로 로드하여 API 응답 캡처
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-url-pagination-crawler.ts <상품코드> [최대페이지수]
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface Review {
  reviewer: string;
  rating: number;
  date: string;
  content: string;
  skinType?: string;
  skinTone?: string;
  helpfulCount?: number;
  photoUrls?: any[];
  option?: string;
}

interface CrawlResult {
  productName: string;
  goodsNo: string;
  totalReviews: number;
  averageRating: number;
  reviews: Review[];
  crawledAt: string;
}

// 수집된 리뷰
let capturedReviews: Review[] = [];
let totalReviewCount = 0;
let avgRating = 0;
let capturedInThisPage = 0;

// 딜레이
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// 리뷰 파싱
const parseReview = (item: any): Review => {
  let reviewer = '익명';
  if (item.profileDto?.nickname) {
    reviewer = item.profileDto.nickname;
  }

  let date = item.createdDateTime || '';
  if (date && date.includes('T')) {
    date = date.split('T')[0].replace(/-/g, '.');
  }

  return {
    reviewer,
    rating: item.reviewScore || 5,
    date,
    content: item.content || '',
    skinType: item.profileDto?.skinType,
    skinTone: item.profileDto?.skinTone,
    helpfulCount: item.recommendCount || item.usefulPoint || 0,
    photoUrls: item.photoReviewList || [],
    option: item.goodsDto?.optionNm || '',
  };
};

// API 응답 파싱
const parseApiResponse = (json: any): number => {
  try {
    let reviewList: any[] = [];
    let addedCount = 0;

    if (json?.data && Array.isArray(json.data)) {
      reviewList = json.data;
    }

    if (json?.totalCnt) {
      totalReviewCount = json.totalCnt;
    }

    reviewList.forEach((item: any) => {
      const review = parseReview(item);

      const isDuplicate = capturedReviews.some(r =>
        r.content === review.content && r.date === review.date
      );

      if (!isDuplicate && review.content && review.content.length > 3) {
        capturedReviews.push(review);
        addedCount++;
      }
    });

    return addedCount;
  } catch (e) {
    return 0;
  }
};

// 메인 크롤링 함수
const crawlOliveyoungReviews = async (
  goodsNo: string,
  maxPages: number = 200,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 (URL 페이지네이션) 시작\n');
  console.log(`📦 상품코드: ${goodsNo}`);
  console.log(`📄 최대 페이지: ${maxPages}\n`);

  let productName = '';

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--window-size=1920,1080',
    ],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
    });

    const page = await context.newPage();

    // WebDriver 감지 우회
    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    `);

    // Network Response 캡처
    page.on('response', async (response) => {
      const url = response.url();

      // 리뷰 목록 API 캡처
      if (url.includes('/review/api/v2/reviews') &&
          url.includes('goodsNo=') &&
          !url.includes('stats') &&
          !url.includes('photo') &&
          !url.includes('summary')) {
        try {
          const json = await response.json();
          capturedInThisPage = parseApiResponse(json);
        } catch (e) {}
      }

      // 통계 API
      if (url.includes('/stats')) {
        try {
          const json = await response.json();
          if (json?.data?.totalCount) {
            totalReviewCount = json.data.totalCount;
          }
          if (json?.data?.averageScore) {
            avgRating = json.data.averageScore;
          }
        } catch (e) {}
      }
    });

    // 페이지별로 로드
    console.log('📖 페이지별 리뷰 수집 시작...\n');

    let consecutiveEmpty = 0;
    const maxEmpty = 3;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      capturedInThisPage = 0;

      // URL에 페이지 파라미터 추가
      const pageUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review&reviewPage=${pageNum}`;

      if (pageNum === 1) {
        console.log(`📦 페이지 ${pageNum} 로딩...`);
      } else {
        console.log(`   페이지 ${pageNum} 로딩...`);
      }

      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 상품명 (첫 페이지에서만)
      if (pageNum === 1) {
        try {
          const title = await page.title();
          if (title) {
            productName = title.split('|')[0].trim();
            console.log(`📍 상품명: ${productName}`);
          }
        } catch (e) {}
      }

      // 리뷰 로딩 대기
      await delay(2000);

      // 리뷰 탭 클릭 (필요시)
      if (pageNum === 1) {
        try {
          const reviewTab = page.locator('button:has-text("리뷰"), a:has-text("리뷰")').first();
          if (await reviewTab.count() > 0) {
            await reviewTab.click();
            await delay(2000);
          }
        } catch (e) {}

        console.log(`📊 총 리뷰: ${totalReviewCount}개`);
        console.log('');
      }

      // 스크롤 (리뷰 로딩 트리거)
      await page.evaluate(() => {
        window.scrollBy(0, 800);
      });
      await delay(1500);

      // 수집 결과
      if (capturedInThisPage > 0) {
        console.log(`   +${capturedInThisPage}개, 총 ${capturedReviews.length}/${totalReviewCount}`);
        consecutiveEmpty = 0;
      } else {
        console.log(`   새 리뷰 없음`);
        consecutiveEmpty++;

        if (consecutiveEmpty >= maxEmpty) {
          console.log('\n   연속 빈 페이지, 종료');
          break;
        }
      }

      // 목표 달성
      if (totalReviewCount > 0 && capturedReviews.length >= totalReviewCount) {
        console.log('\n   전체 리뷰 수집 완료!');
        break;
      }

      // 다음 페이지 대기
      await delay(500 + Math.random() * 500);
    }

    // 결과 저장
    const result: CrawlResult = {
      productName: productName || `상품 ${goodsNo}`,
      goodsNo,
      totalReviews: totalReviewCount || capturedReviews.length,
      averageRating: avgRating,
      reviews: capturedReviews,
      crawledAt: new Date().toISOString(),
    };

    // 저장
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // JSON 저장
    const jsonPath = path.join(outputDir, `oliveyoung-${goodsNo}-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

    // CSV 저장
    const csvPath = path.join(outputDir, `oliveyoung-${goodsNo}-${timestamp}.csv`);
    const csvHeader = 'reviewer,rating,date,skinType,skinTone,option,helpfulCount,content\n';
    const csvRows = capturedReviews.map(r =>
      `"${r.reviewer}",${r.rating},"${r.date}","${r.skinType || ''}","${r.skinTone || ''}","${r.option || ''}",${r.helpfulCount || 0},"${r.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
    ).join('\n');
    fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

    console.log(`\n✅ 수집 완료!`);
    console.log(`   총 리뷰: ${capturedReviews.length}개 / ${totalReviewCount}개`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);

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
사용법: npx ts-node scripts/oliveyoung-url-pagination-crawler.ts <상품코드> [최대페이지수]

예시:
  npx ts-node scripts/oliveyoung-url-pagination-crawler.ts A000000235842 200
    `);
    process.exit(1);
  }

  const goodsNo = args[0];
  const maxPages = parseInt(args[1]) || 200;

  // 초기화
  capturedReviews = [];
  totalReviewCount = 0;
  avgRating = 0;

  try {
    await crawlOliveyoungReviews(goodsNo, maxPages);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
