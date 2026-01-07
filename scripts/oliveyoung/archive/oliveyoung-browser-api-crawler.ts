/**
 * 올리브영 리뷰 크롤러 - 브라우저 내 API 호출 방식
 *
 * 브라우저 컨텍스트 내에서 API를 직접 호출하여 모든 리뷰 수집
 * (쿠키/세션이 자동으로 포함되어 403 우회)
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-browser-api-crawler.ts <상품코드> [최대리뷰수]
 *
 * 예시:
 * npx ts-node scripts/oliveyoung-browser-api-crawler.ts A000000235842 2000
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

// 딜레이
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// 브라우저 설정
const launchBrowser = async (): Promise<Browser> => {
  return chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--window-size=1920,1080',
    ],
  });
};

// 페이지 설정
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

  return page;
};

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
  maxReviews: number = 2000,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 (브라우저 API) 시작\n');
  console.log(`📦 상품코드: ${goodsNo}`);
  console.log(`📄 최대 리뷰: ${maxReviews}개\n`);

  const reviews: Review[] = [];
  let productName = '';
  let totalReviews = 0;
  let avgRating = 0;

  const browser = await launchBrowser();

  try {
    const page = await setupPage(browser);

    // 1. 상품 페이지 로드 (세션/쿠키 획득용)
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
    console.log('📦 상품 페이지 로딩 중...');
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // 상품명 추출
    try {
      const title = await page.title();
      if (title) {
        productName = title.split('|')[0].trim();
        console.log(`📍 상품명: ${productName}`);
      }
    } catch (e) {}

    // 2. 브라우저 내에서 통계 API 호출
    console.log('\n📊 리뷰 통계 조회 중...');
    const stats = await page.evaluate(async (gNo: string) => {
      try {
        const response = await fetch(`https://m.oliveyoung.co.kr/review/api/v2/reviews/${gNo}/stats`, {
          headers: {
            'Accept': 'application/json',
          }
        });
        return await response.json();
      } catch (e) {
        return null;
      }
    }, goodsNo);

    if (stats?.data) {
      totalReviews = stats.data.totalCount || 0;
      avgRating = stats.data.averageScore || 0;
      console.log(`   총 리뷰: ${totalReviews}개`);
      console.log(`   평균 평점: ${avgRating}점`);
    }

    // 3. 브라우저 내에서 리뷰 API 호출 (페이지별)
    console.log('\n📖 리뷰 수집 시작...');

    const pageSize = 20;
    const maxPages = Math.min(Math.ceil(maxReviews / pageSize), Math.ceil(totalReviews / pageSize) || 100);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`   페이지 ${pageNum}/${maxPages} 로딩...`);

      // 브라우저 내에서 fetch 실행
      const pageData = await page.evaluate(async (params: { gNo: string, pg: number, sz: number }) => {
        try {
          const url = `https://m.oliveyoung.co.kr/review/api/v2/reviews?goodsNo=${params.gNo}&page=${params.pg}&size=${params.sz}&sort=RECENT`;
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            }
          });
          return await response.json();
        } catch (e) {
          return null;
        }
      }, { gNo: goodsNo, pg: pageNum, sz: pageSize });

      if (pageData?.data && Array.isArray(pageData.data)) {
        const pageReviews = pageData.data.map(parseReview);

        // 중복 체크 후 추가
        pageReviews.forEach((review: Review) => {
          const isDuplicate = reviews.some(r =>
            r.content === review.content && r.date === review.date
          );
          if (!isDuplicate && review.content && review.content.length > 3) {
            reviews.push(review);
          }
        });

        console.log(`   수집: ${reviews.length}개`);

        // 마지막 페이지 체크
        if (pageData.data.length < pageSize) {
          console.log('   마지막 페이지 도달');
          break;
        }

        // 목표 달성 체크
        if (reviews.length >= maxReviews) {
          console.log('   목표 리뷰 수 달성');
          break;
        }
      } else {
        console.log('   데이터 없음, 종료');
        break;
      }

      // API 부하 방지 딜레이
      await delay(500 + Math.random() * 500);
    }

    // 4. 결과 저장
    const result: CrawlResult = {
      productName: productName || `상품 ${goodsNo}`,
      goodsNo,
      totalReviews: totalReviews || reviews.length,
      averageRating: avgRating,
      reviews,
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
    const csvRows = reviews.map(r =>
      `"${r.reviewer}",${r.rating},"${r.date}","${r.skinType || ''}","${r.skinTone || ''}","${r.option || ''}",${r.helpfulCount || 0},"${r.content.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
    ).join('\n');
    fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

    console.log(`\n✅ 수집 완료!`);
    console.log(`   총 리뷰: ${reviews.length}개 / ${totalReviews}개`);
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
사용법: npx ts-node scripts/oliveyoung-browser-api-crawler.ts <상품코드> [최대리뷰수]

상품코드는 URL에서 goodsNo= 뒤의 값입니다.
예: https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842
    → 상품코드: A000000235842

예시:
  npx ts-node scripts/oliveyoung-browser-api-crawler.ts A000000235842
  npx ts-node scripts/oliveyoung-browser-api-crawler.ts A000000235842 2000
    `);
    process.exit(1);
  }

  const goodsNo = args[0];
  const maxReviews = parseInt(args[1]) || 2000;

  try {
    await crawlOliveyoungReviews(goodsNo, maxReviews);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
