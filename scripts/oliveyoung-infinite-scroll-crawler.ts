/**
 * 올리브영 리뷰 크롤러 - 무한 스크롤 방식
 *
 * 리뷰 영역 내에서 스크롤하여 모든 리뷰 수집
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-infinite-scroll-crawler.ts <상품URL> [최대리뷰수]
 *
 * 예시:
 * npx ts-node scripts/oliveyoung-infinite-scroll-crawler.ts "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review" 2000
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
  productUrl: string;
  goodsNo: string;
  totalReviews: number;
  averageRating: number;
  reviews: Review[];
  crawledAt: string;
}

// 수집된 리뷰 저장
const capturedReviews: Review[] = [];
let productInfo = { name: '상품명 없음', rating: 0, totalReviews: 0 };

// 딜레이
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = (min: number, max: number): Promise<void> =>
  delay(Math.floor(Math.random() * (max - min + 1)) + min);

// 브라우저 설정
const launchBrowser = async (): Promise<Browser> => {
  return chromium.launch({
    headless: false,  // 디버깅용 false
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  });
};

// 페이지 설정 + Network Intercept
const setupPage = async (browser: Browser): Promise<Page> => {
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

    // 리뷰 API 캡처 (리뷰 목록 API만)
    if (url.includes('/review/api/v2/reviews') &&
        !url.includes('stats') &&
        !url.includes('count') &&
        !url.includes('photo') &&
        !url.includes('summary')) {
      try {
        const json = await response.json();
        console.log(`📡 리뷰 API 캡처: page=${getPageFromUrl(url)}`);
        parseReviewApiResponse(json);
      } catch (e) {
        // JSON 파싱 실패 무시
      }
    }

    // 통계 API
    if (url.includes('/stats')) {
      try {
        const json = await response.json();
        if (json?.data?.totalCount) {
          productInfo.totalReviews = json.data.totalCount;
          console.log(`   총 리뷰 수: ${productInfo.totalReviews}`);
        }
        if (json?.data?.averageScore) {
          productInfo.rating = json.data.averageScore;
        }
      } catch (e) {}
    }
  });

  return page;
};

// URL에서 페이지 번호 추출
const getPageFromUrl = (url: string): string => {
  const match = url.match(/page=(\d+)/);
  return match ? match[1] : '1';
};

// 리뷰 API 응답 파싱
const parseReviewApiResponse = (json: any): void => {
  try {
    let reviewList: any[] = [];

    // 올리브영 API 구조: { data: [...] }
    if (json?.data && Array.isArray(json.data)) {
      reviewList = json.data;
    } else if (json?.data?.content && Array.isArray(json.data.content)) {
      reviewList = json.data.content;
    }

    // 각 리뷰 파싱
    reviewList.forEach((item: any) => {
      // 작성자
      let reviewer = '익명';
      if (item.profileDto?.nickname) {
        reviewer = item.profileDto.nickname;
      }

      // 날짜
      let date = item.createdDateTime || '';
      if (date && date.includes('T')) {
        date = date.split('T')[0].replace(/-/g, '.');
      }

      const review: Review = {
        reviewer,
        rating: item.reviewScore || 5,
        date,
        content: item.content || '',
        skinType: item.profileDto?.skinType,
        skinTone: item.profileDto?.skinTone,
        helpfulCount: item.recommendCount || item.usefulPoint || 0,
        option: item.goodsDto?.optionNm || '',
      };

      // 이미지
      if (item.photoReviewList && Array.isArray(item.photoReviewList)) {
        review.photoUrls = item.photoReviewList;
      }

      // 중복 체크 (content + date로 체크)
      const isDuplicate = capturedReviews.some(r =>
        r.content === review.content && r.date === review.date
      );

      if (!isDuplicate && review.content && review.content.length > 3) {
        capturedReviews.push(review);
      }
    });

    console.log(`   현재 수집: ${capturedReviews.length}개`);
  } catch (e) {
    console.error('API 파싱 오류:', e);
  }
};

// 무한 스크롤로 리뷰 수집
const collectReviewsWithInfiniteScroll = async (
  page: Page,
  maxReviews: number
): Promise<void> => {
  console.log('📖 무한 스크롤 리뷰 수집 시작...\n');

  // 1. 리뷰 탭 클릭
  try {
    console.log('   리뷰 탭 찾는 중...');

    // 리뷰 탭 셀렉터들
    const tabSelectors = [
      'a[data-tab-target="tab-review"]',
      '[data-navi="review"]',
      'a:has-text("리뷰")',
      'button:has-text("리뷰")',
      '[class*="tab"] a:has-text("리뷰")',
      '#reviewInfo',
    ];

    let tabClicked = false;
    for (const selector of tabSelectors) {
      try {
        const tab = page.locator(selector).first();
        if (await tab.count() > 0 && await tab.isVisible()) {
          await tab.scrollIntoViewIfNeeded();
          await randomDelay(500, 1000);
          await tab.click();
          tabClicked = true;
          console.log(`   리뷰 탭 클릭 완료 (${selector})`);
          break;
        }
      } catch (e) {}
    }

    if (!tabClicked) {
      // URL에 tab=review 추가하고 새로고침
      const currentUrl = page.url();
      if (!currentUrl.includes('tab=review')) {
        const newUrl = currentUrl.includes('?')
          ? `${currentUrl}&tab=review`
          : `${currentUrl}?tab=review`;
        console.log('   URL로 리뷰 탭 이동...');
        await page.goto(newUrl, { waitUntil: 'domcontentloaded' });
      }
    }

    await randomDelay(2000, 3000);
  } catch (e) {
    console.log('   리뷰 탭 클릭 실패, 계속 진행...');
  }

  // 2. 리뷰 컨테이너 찾기
  console.log('   리뷰 영역 찾는 중...');

  const reviewContainerSelectors = [
    '[class*="ReviewList"]',
    '[class*="review-list"]',
    '[class*="reviewList"]',
    '#reviewList',
    '[data-review-list]',
    '.review_list',
    '[class*="prd_review"]',
    '#reviewInfo',
  ];

  let reviewContainer = null;
  for (const selector of reviewContainerSelectors) {
    try {
      const container = page.locator(selector).first();
      if (await container.count() > 0) {
        reviewContainer = container;
        console.log(`   리뷰 컨테이너 발견: ${selector}`);
        break;
      }
    } catch (e) {}
  }

  // 3. 초기 로딩 대기
  await randomDelay(3000, 4000);
  console.log(`   초기 로딩 완료: ${capturedReviews.length}개`);

  // 4. 무한 스크롤 실행
  let lastCount = 0;
  let noNewReviewsCount = 0;
  const maxNoNewReviews = 5;  // 5번 연속 새 리뷰 없으면 종료
  let scrollAttempts = 0;
  const maxScrollAttempts = 200;  // 최대 스크롤 시도

  while (capturedReviews.length < maxReviews &&
         noNewReviewsCount < maxNoNewReviews &&
         scrollAttempts < maxScrollAttempts) {

    scrollAttempts++;
    lastCount = capturedReviews.length;

    // 스크롤 방법 1: 페이지 전체 스크롤
    await page.evaluate(() => {
      window.scrollBy(0, 800);
    });

    // 스크롤 방법 2: 리뷰 컨테이너 내 스크롤 (있으면)
    if (reviewContainer) {
      try {
        await reviewContainer.evaluate((el: Element) => {
          el.scrollTop += 500;
        });
      } catch (e) {}
    }

    // API 응답 대기
    await randomDelay(800, 1500);

    // 진행 상황 로그
    if (scrollAttempts % 10 === 0) {
      console.log(`   스크롤 ${scrollAttempts}: ${capturedReviews.length}/${maxReviews} (${Math.round(capturedReviews.length/maxReviews*100)}%)`);
    }

    // 새 리뷰 체크
    if (capturedReviews.length === lastCount) {
      noNewReviewsCount++;

      // 추가 스크롤 시도
      await page.evaluate(() => {
        window.scrollBy(0, 1200);
      });
      await randomDelay(1500, 2500);

      // "더보기" 버튼 찾기
      try {
        const moreButtons = [
          'button:has-text("더보기")',
          'button:has-text("더 보기")',
          '[class*="more"]',
          '[class*="load-more"]',
          'button:has-text("more")',
        ];

        for (const selector of moreButtons) {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0 && await btn.isVisible()) {
            await btn.click();
            console.log(`   더보기 버튼 클릭`);
            await randomDelay(2000, 3000);
            noNewReviewsCount = 0;
            break;
          }
        }
      } catch (e) {}

    } else {
      noNewReviewsCount = 0;
    }

    // 페이지 끝 체크
    const isAtBottom = await page.evaluate(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      return scrollTop + clientHeight >= scrollHeight - 100;
    });

    if (isAtBottom && capturedReviews.length === lastCount) {
      console.log('   페이지 끝 도달');

      // 페이지네이션 버튼 체크 (무한 스크롤 + 페이지네이션 혼합일 수 있음)
      try {
        const nextBtn = page.locator('[class*="Pagination"] button:has-text("다음"), [class*="paging"] button:has-text("다음")').first();
        if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
          await nextBtn.click();
          console.log('   다음 페이지 클릭');
          await randomDelay(2000, 3000);
          noNewReviewsCount = 0;

          // 다시 맨 위로 스크롤
          await page.evaluate(() => window.scrollTo(0, 0));
          await randomDelay(1000, 2000);
        }
      } catch (e) {}
    }
  }

  console.log(`\n   수집 완료: 총 ${capturedReviews.length}개`);
  console.log(`   (목표: ${maxReviews}, 스크롤: ${scrollAttempts}회)`);
};

// 결과 저장
const saveResults = (result: CrawlResult, outputDir: string): string => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // JSON 저장
  const jsonPath = path.join(outputDir, `oliveyoung-${result.goodsNo}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  // CSV 저장
  const csvPath = path.join(outputDir, `oliveyoung-${result.goodsNo}-${timestamp}.csv`);
  const csvHeader = 'reviewer,rating,date,skinType,skinTone,option,helpfulCount,content\n';
  const csvRows = result.reviews.map(r =>
    `"${r.reviewer}",${r.rating},"${r.date}","${r.skinType || ''}","${r.skinTone || ''}","${r.option || ''}",${r.helpfulCount || 0},"${r.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

  console.log(`\n✅ 저장 완료:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   CSV: ${csvPath}`);

  return jsonPath;
};

// 메인 크롤링 함수
const crawlOliveyoungReviews = async (
  productUrl: string,
  maxReviews: number = 2000,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 (무한 스크롤) 시작\n');
  console.log(`📌 URL: ${productUrl}`);
  console.log(`📄 최대 리뷰: ${maxReviews}개\n`);

  // 상품코드 추출
  const goodsNoMatch = productUrl.match(/goodsNo=([A-Z0-9]+)/i);
  const goodsNo = goodsNoMatch ? goodsNoMatch[1] : 'unknown';
  console.log(`📦 상품코드: ${goodsNo}\n`);

  // 초기화
  capturedReviews.length = 0;
  productInfo = { name: '상품명 없음', rating: 0, totalReviews: 0 };

  const browser = await launchBrowser();

  try {
    const page = await setupPage(browser);

    // 페이지 로드
    console.log('📦 상품 페이지 로딩 중...');
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(3000, 5000);

    // 상품명 추출
    try {
      const title = await page.title();
      if (title) {
        productInfo.name = title.split('|')[0].trim();
      }
    } catch (e) {}

    console.log(`📍 상품명: ${productInfo.name}`);
    console.log(`📍 현재 URL: ${page.url()}\n`);

    // 무한 스크롤 수집
    await collectReviewsWithInfiniteScroll(page, maxReviews);

    // 스크린샷
    await page.screenshot({ path: path.join(outputDir, 'final-screenshot.png') });

    const result: CrawlResult = {
      productName: productInfo.name,
      productUrl,
      goodsNo,
      totalReviews: productInfo.totalReviews || capturedReviews.length,
      averageRating: productInfo.rating,
      reviews: capturedReviews,
      crawledAt: new Date().toISOString(),
    };

    console.log(`\n📊 수집 결과:`);
    console.log(`   상품명: ${result.productName}`);
    console.log(`   총 리뷰: ${result.reviews.length}개 / ${result.totalReviews}개`);

    saveResults(result, outputDir);

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
사용법: npx ts-node scripts/oliveyoung-infinite-scroll-crawler.ts <상품URL> [최대리뷰수]

예시:
  npx ts-node scripts/oliveyoung-infinite-scroll-crawler.ts "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review"
  npx ts-node scripts/oliveyoung-infinite-scroll-crawler.ts "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842" 2000
    `);
    process.exit(1);
  }

  const productUrl = args[0];
  const maxReviews = parseInt(args[1]) || 2000;

  try {
    await crawlOliveyoungReviews(productUrl, maxReviews);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
