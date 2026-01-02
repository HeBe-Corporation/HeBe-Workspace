/**
 * 올리브영 리뷰 크롤러 - 페이지 리로드 방식
 *
 * 페이지를 리로드하면서 Network Intercept로 API 응답 캡처
 * 올리브영 리뷰 탭 클릭 시 API 호출됨 - 이를 활용
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-reload-crawler.ts <상품코드>
 */

import { chromium } from 'playwright';
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

// 메인 크롤링 함수
const crawlOliveyoungReviews = async (
  goodsNo: string,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 (리로드 방식) 시작\n');
  console.log(`📦 상품코드: ${goodsNo}\n`);

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
      if (url.includes('/review/api/') && url.includes('reviews') &&
          !url.includes('stats') && !url.includes('photo') && !url.includes('summary') && !url.includes('count')) {
        try {
          const json = await response.json();
          const pageMatch = url.match(/page=(\d+)/);
          const pg = pageMatch ? pageMatch[1] : '1';

          let reviewList: any[] = [];
          if (json?.data && Array.isArray(json.data)) {
            reviewList = json.data;
          }

          if (json?.totalCnt) {
            totalReviewCount = json.totalCnt;
          }

          let addedCount = 0;
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

          if (addedCount > 0 || pg === '1') {
            console.log(`📡 페이지 ${pg}: +${addedCount}개, 총 ${capturedReviews.length}/${totalReviewCount}`);
          }
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

    // 1. 상품 페이지 로드
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    console.log('📦 상품 페이지 로딩...');
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // 상품명
    try {
      const title = await page.title();
      if (title) {
        productName = title.split('|')[0].trim();
        console.log(`📍 상품명: ${productName}`);
      }
    } catch (e) {}

    // 2. 리뷰 탭 클릭
    console.log('\n📖 리뷰 탭 활성화...');
    try {
      const reviewTab = page.locator('button:has-text("리뷰")').first();
      if (await reviewTab.count() > 0) {
        await reviewTab.click();
        await delay(3000);
      }
    } catch (e) {}

    console.log(`   초기 로딩: ${capturedReviews.length}개\n`);

    // 3. 페이지네이션 영역 찾기 및 클릭
    console.log('📖 페이지네이션으로 추가 리뷰 수집...\n');

    // 먼저 리뷰 영역으로 스크롤
    await page.evaluate(() => {
      const reviewArea = document.querySelector('[class*="review"], [id*="review"]');
      if (reviewArea) {
        reviewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo(0, 1500);
      }
    });
    await delay(1000);

    // 페이지네이션 시도
    let currentPage = 1;
    let maxAttempts = 200;  // 최대 200 페이지 시도
    let noNewCount = 0;

    while (currentPage < maxAttempts && noNewCount < 5) {
      const beforeCount = capturedReviews.length;
      currentPage++;

      // 다음 페이지 버튼 시도
      let clicked = false;

      // 1. 숫자 버튼 찾기
      try {
        const pageNumSelectors = [
          `button:text-is("${currentPage}")`,
          `a:text-is("${currentPage}")`,
          `span:text-is("${currentPage}")`,
        ];

        for (const sel of pageNumSelectors) {
          const btn = page.locator(`[class*="page"] ${sel}, [class*="Pagination"] ${sel}`).first();
          if (await btn.count() > 0 && await btn.isVisible()) {
            await btn.scrollIntoViewIfNeeded();
            await delay(300);
            await btn.click();
            clicked = true;
            break;
          }
        }
      } catch (e) {}

      // 2. "다음" 버튼 시도
      if (!clicked) {
        try {
          const nextSelectors = [
            'button:has-text("다음")',
            'a:has-text("다음")',
            'button:has-text(">")',
            'a:has-text(">")',
            '[class*="next"]',
            '[aria-label*="next"]',
          ];

          for (const sel of nextSelectors) {
            const btn = page.locator(sel).first();
            if (await btn.count() > 0 && await btn.isVisible() && await btn.isEnabled()) {
              await btn.scrollIntoViewIfNeeded();
              await delay(300);
              await btn.click();
              clicked = true;
              break;
            }
          }
        } catch (e) {}
      }

      // 3. 스크롤 시도 (무한 스크롤 지원)
      if (!clicked) {
        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });
      }

      await delay(2000);

      // 결과 체크
      if (capturedReviews.length > beforeCount) {
        noNewCount = 0;
      } else {
        noNewCount++;
      }

      // 진행 상황 (10페이지마다)
      if (currentPage % 10 === 0) {
        console.log(`   페이지 ${currentPage}: ${capturedReviews.length}/${totalReviewCount} (${Math.round(capturedReviews.length/Math.max(totalReviewCount,1)*100)}%)`);
      }

      // 목표 달성
      if (totalReviewCount > 0 && capturedReviews.length >= totalReviewCount * 0.95) {
        console.log('\n   거의 모든 리뷰 수집 완료!');
        break;
      }
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
사용법: npx ts-node scripts/oliveyoung-reload-crawler.ts <상품코드>

예시:
  npx ts-node scripts/oliveyoung-reload-crawler.ts A000000235842
    `);
    process.exit(1);
  }

  const goodsNo = args[0];

  // 초기화
  capturedReviews = [];
  totalReviewCount = 0;
  avgRating = 0;

  try {
    await crawlOliveyoungReviews(goodsNo);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
