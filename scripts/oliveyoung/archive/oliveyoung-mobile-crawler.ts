/**
 * 올리브영 리뷰 크롤러 - 모바일 버전
 *
 * 모바일 올리브영에서 리뷰를 수집 (API 응답이 더 안정적)
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-mobile-crawler.ts <상품코드> [최대페이지수]
 */

import { chromium, Browser, Page, devices } from 'playwright';
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
  console.log('🚀 올리브영 리뷰 크롤러 (모바일) 시작\n');
  console.log(`📦 상품코드: ${goodsNo}`);
  console.log(`📄 최대 페이지: ${maxPages}\n`);

  let productName = '';

  // 모바일 기기 에뮬레이션
  const iPhone = devices['iPhone 13'];

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  try {
    const context = await browser.newContext({
      ...iPhone,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
    });

    const page = await context.newPage();

    // WebDriver 감지 우회
    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
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
          const pageMatch = url.match(/page=(\d+)/);
          const pg = pageMatch ? pageMatch[1] : '?';
          const added = parseApiResponse(json);
          console.log(`📡 API 캡처 (page=${pg}): +${added}개, 총 ${capturedReviews.length}개`);
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

    // 1. 모바일 상품 페이지 로드
    const mobileUrl = `https://m.oliveyoung.co.kr/m/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
    console.log('📦 모바일 페이지 로딩 중...');
    console.log(`   URL: ${mobileUrl}`);

    await page.goto(mobileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // 상품명 추출
    try {
      const title = await page.title();
      if (title) {
        productName = title.split('|')[0].trim();
        console.log(`📍 상품명: ${productName}\n`);
      }
    } catch (e) {}

    // 2. 리뷰 탭으로 이동
    console.log('📖 리뷰 탭 클릭...');

    // 리뷰 탭 셀렉터 시도
    const tabSelectors = [
      'a[href*="tab=review"]',
      'button:has-text("리뷰")',
      'a:has-text("리뷰")',
      '[data-tab="review"]',
      '.tab_list a:nth-child(2)',
    ];

    for (const selector of tabSelectors) {
      try {
        const tab = page.locator(selector).first();
        if (await tab.count() > 0 && await tab.isVisible()) {
          await tab.click();
          console.log(`   탭 클릭: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    await delay(3000);
    console.log(`   초기 로딩: ${capturedReviews.length}개\n`);

    // 3. 스크롤로 더 많은 리뷰 로드
    console.log('📖 스크롤하며 리뷰 로딩...');

    let scrollAttempts = 0;
    let noNewCount = 0;
    const maxNoNew = 10;

    while (scrollAttempts < maxPages * 5 && noNewCount < maxNoNew) {
      const beforeCount = capturedReviews.length;

      // 스크롤 다운
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });

      await delay(1000);

      // "더보기" 버튼 찾아서 클릭
      try {
        const moreBtn = page.locator('button:has-text("더보기"), a:has-text("더보기"), [class*="more"]').first();
        if (await moreBtn.count() > 0 && await moreBtn.isVisible()) {
          await moreBtn.click();
          await delay(2000);
        }
      } catch (e) {}

      scrollAttempts++;

      if (capturedReviews.length > beforeCount) {
        noNewCount = 0;
      } else {
        noNewCount++;
      }

      // 진행 상황
      if (scrollAttempts % 20 === 0) {
        console.log(`   스크롤 ${scrollAttempts}: ${capturedReviews.length}/${totalReviewCount} (${Math.round(capturedReviews.length/Math.max(totalReviewCount,1)*100)}%)`);
      }

      // 목표 달성
      if (totalReviewCount > 0 && capturedReviews.length >= totalReviewCount * 0.95) {
        console.log('\n   거의 모든 리뷰 수집 완료!');
        break;
      }
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
사용법: npx ts-node scripts/oliveyoung-mobile-crawler.ts <상품코드> [최대페이지수]

예시:
  npx ts-node scripts/oliveyoung-mobile-crawler.ts A000000235842 200
    `);
    process.exit(1);
  }

  const goodsNo = args[0];
  const maxPages = parseInt(args[1]) || 200;

  // 초기화
  capturedReviews.length = 0;
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
