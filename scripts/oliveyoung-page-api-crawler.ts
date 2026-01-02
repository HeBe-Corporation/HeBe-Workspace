/**
 * 올리브영 리뷰 크롤러 - 페이지 내 API 직접 호출
 *
 * 올리브영 페이지 내 스크립트를 활용하여 리뷰 API 호출
 * Network Intercept로 응답 캡처
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-page-api-crawler.ts <상품코드> [최대리뷰수]
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
const capturedReviews: Review[] = [];
let totalReviewCount = 0;
let avgRating = 0;

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
const parseApiResponse = (json: any): void => {
  try {
    let reviewList: any[] = [];

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
      }
    });
  } catch (e) {}
};

// 메인 크롤링 함수
const crawlOliveyoungReviews = async (
  goodsNo: string,
  maxReviews: number = 2000,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 시작\n');
  console.log(`📦 상품코드: ${goodsNo}`);
  console.log(`📄 최대 리뷰: ${maxReviews}개\n`);

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

      // 리뷰 목록 API만 캡처
      if (url.includes('/review/api/v2/reviews') &&
          url.includes('goodsNo=') &&
          !url.includes('stats') &&
          !url.includes('photo') &&
          !url.includes('summary')) {
        try {
          const json = await response.json();
          const pageMatch = url.match(/page=(\d+)/);
          const pg = pageMatch ? pageMatch[1] : '?';
          console.log(`📡 API 캡처 (page=${pg}): ${json?.data?.length || 0}개`);
          parseApiResponse(json);
          console.log(`   총 수집: ${capturedReviews.length}개`);
        } catch (e) {}
      }

      // 통계 API
      if (url.includes('/stats')) {
        try {
          const json = await response.json();
          if (json?.data?.totalCount) {
            totalReviewCount = json.data.totalCount;
            console.log(`📊 총 리뷰 수: ${totalReviewCount}`);
          }
          if (json?.data?.averageScore) {
            avgRating = json.data.averageScore;
          }
        } catch (e) {}
      }
    });

    // 1. 상품 페이지 로드
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    console.log('📦 상품 페이지 로딩 중...');
    await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);

    // 상품명 추출
    try {
      const title = await page.title();
      if (title) {
        productName = title.split('|')[0].trim();
        console.log(`📍 상품명: ${productName}\n`);
      }
    } catch (e) {}

    // 2. 리뷰 탭 클릭
    console.log('📖 리뷰 탭 클릭...');
    try {
      const reviewTab = page.locator('button:has-text("리뷰"), a:has-text("리뷰")').first();
      if (await reviewTab.count() > 0) {
        await reviewTab.click();
        await delay(3000);
      }
    } catch (e) {}

    console.log(`   초기 로딩: ${capturedReviews.length}개\n`);

    // 3. 페이지별로 리뷰 로드
    const pageSize = 10;
    const maxPages = Math.ceil(maxReviews / pageSize);
    let currentPage = 1;
    let noNewReviewsCount = 0;

    console.log('📖 페이지별 리뷰 수집 시작...');

    while (currentPage <= maxPages && noNewReviewsCount < 5) {
      const beforeCount = capturedReviews.length;

      // 방법 1: 페이지네이션 버튼 클릭
      const pageBtn = page.locator(`[class*="Pagination"] button:has-text("${currentPage}"), [class*="paging"] button:has-text("${currentPage}")`).first();

      if (await pageBtn.count() > 0 && await pageBtn.isVisible()) {
        try {
          await pageBtn.scrollIntoViewIfNeeded();
          await delay(300);
          await pageBtn.click();
          console.log(`   페이지 ${currentPage} 클릭`);
          await delay(2000);
        } catch (e) {
          console.log(`   페이지 ${currentPage} 클릭 실패`);
        }
      } else {
        // 방법 2: JavaScript로 직접 API 호출 트리거
        console.log(`   페이지 ${currentPage}: JS로 API 호출 시도`);

        await page.evaluate(async (params: { gNo: string, pg: number }) => {
          // 페이지 내 리뷰 로드 함수 호출 시도
          const win = window as any;

          // React/Redux 상태 업데이트 시도
          if (win.__NEXT_DATA__ || win.__NUXT__) {
            // Next.js/Nuxt 기반
            const event = new CustomEvent('loadMoreReviews', { detail: { page: params.pg } });
            window.dispatchEvent(event);
          }

          // XHR 직접 호출
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `https://m.oliveyoung.co.kr/review/api/v2/reviews?goodsNo=${params.gNo}&page=${params.pg}&size=10&sort=RECENT`, true);
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

        }, { gNo: goodsNo, pg: currentPage });

        await delay(2000);
      }

      // 새 리뷰 수집 체크
      if (capturedReviews.length > beforeCount) {
        console.log(`   수집: ${capturedReviews.length}개 (+${capturedReviews.length - beforeCount})`);
        noNewReviewsCount = 0;
      } else {
        noNewReviewsCount++;
        console.log(`   새 리뷰 없음 (${noNewReviewsCount}/5)`);
      }

      // 목표 달성 체크
      if (capturedReviews.length >= maxReviews) {
        console.log('\n   목표 달성!');
        break;
      }

      // 전체 리뷰 수집 체크
      if (totalReviewCount > 0 && capturedReviews.length >= totalReviewCount) {
        console.log('\n   전체 리뷰 수집 완료!');
        break;
      }

      currentPage++;
      await delay(500);
    }

    // 4. 결과 저장
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
사용법: npx ts-node scripts/oliveyoung-page-api-crawler.ts <상품코드> [최대리뷰수]

예시:
  npx ts-node scripts/oliveyoung-page-api-crawler.ts A000000235842 2000
    `);
    process.exit(1);
  }

  const goodsNo = args[0];
  const maxReviews = parseInt(args[1]) || 2000;

  // 초기화
  capturedReviews.length = 0;
  totalReviewCount = 0;
  avgRating = 0;

  try {
    await crawlOliveyoungReviews(goodsNo, maxReviews);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
