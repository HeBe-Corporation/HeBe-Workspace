/**
 * 올리브영 리뷰 크롤러 (개인 분석용)
 * Network Intercept 방식으로 리뷰 API 캡처
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-review-crawler.ts <상품URL> [최대페이지수]
 */

import { chromium, Browser, Page, Route, Request } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 리뷰 데이터 타입
interface Review {
  reviewer: string;
  rating: number;
  date: string;
  content: string;
  skinType?: string;
  skinTone?: string;
  helpfulCount?: number;
  photoUrls?: string[];
}

interface CrawlResult {
  productName: string;
  productUrl: string;
  totalReviews: number;
  averageRating: number;
  reviews: Review[];
  crawledAt: string;
}

// 수집된 리뷰 API 응답 저장
const capturedReviews: Review[] = [];
let productInfo = { name: '상품명 없음', rating: 0, totalReviews: 0 };

// 랜덤 딜레이
const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// 브라우저 설정
const launchBrowser = async (): Promise<Browser> => {
  return chromium.launch({
    headless: false,
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

  // Network Response 캡처 - 리뷰 API
  page.on('response', async (response) => {
    const url = response.url();

    // 올리브영 리뷰 API 패턴
    if (url.includes('/api/') && (url.includes('review') || url.includes('Review'))) {
      try {
        const json = await response.json();
        console.log(`📡 리뷰 API 캡처: ${url.substring(0, 100)}...`);

        // 디버그: API 응답 구조 출력
        if (url.includes('/reviews') && !url.includes('stats') && !url.includes('count') && !url.includes('photo')) {
          console.log(`   API 응답 키: ${Object.keys(json).join(', ')}`);
          if (json.data) {
            const isArray = Array.isArray(json.data);
            console.log(`   data는 배열: ${isArray}, 길이: ${isArray ? json.data.length : 'N/A'}`);
            if (isArray && json.data.length > 0) {
              console.log(`   첫 번째 리뷰 키: ${Object.keys(json.data[0]).join(', ')}`);
            }
          }
          if (json.totalCnt) {
            console.log(`   totalCnt: ${json.totalCnt}`);
          }
        }

        parseReviewApiResponse(json);
      } catch (e) {
        // JSON 파싱 실패 무시
      }
    }

    // 상품 정보 API
    if (url.includes('/api/') && url.includes('goods')) {
      try {
        const json = await response.json();
        if (json.goodsNm || json.name || json.productName) {
          productInfo.name = json.goodsNm || json.name || json.productName;
        }
      } catch (e) {}
    }
  });

  return page;
};

// 리뷰 API 응답 파싱
const parseReviewApiResponse = (json: any): void => {
  try {
    // 다양한 API 응답 구조 처리
    let reviewList: any[] = [];

    // 올리브영 API 구조: { data: { content: [...] } }
    if (json?.data?.content && Array.isArray(json.data.content)) {
      reviewList = json.data.content;
    }
    // 구조 1: { data: { list: [...] } }
    else if (json?.data?.list) {
      reviewList = json.data.list;
    }
    // 구조 2: { result: { reviews: [...] } }
    else if (json?.result?.reviews) {
      reviewList = json.result.reviews;
    }
    // 구조 3: { reviews: [...] }
    else if (json?.reviews) {
      reviewList = json.reviews;
    }
    // 구조 4: { content: [...] } - Spring Page 구조
    else if (json?.content && Array.isArray(json.content)) {
      reviewList = json.content;
    }
    // 구조 5: { list: [...] }
    else if (json?.list && Array.isArray(json.list)) {
      reviewList = json.list;
    }
    // 구조 6: 직접 배열
    else if (Array.isArray(json)) {
      reviewList = json;
    }
    // 구조 7: { data: [...] }
    else if (json?.data && Array.isArray(json.data)) {
      reviewList = json.data;
    }

    // 총 리뷰 수
    if (json?.totalCnt || json?.totalCount || json?.total || json?.data?.totalCount) {
      productInfo.totalReviews = json.totalCnt || json.totalCount || json.total || json.data?.totalCount;
    }

    // 각 리뷰 파싱 (올리브영 API 구조에 맞춤)
    reviewList.forEach((item: any) => {
      // 작성자 정보 (profileDto 내부)
      let reviewer = '익명';
      if (item.profileDto) {
        reviewer = item.profileDto.nickname || item.profileDto.memberNm || item.profileDto.memberId || '익명';
      } else {
        reviewer = item.memberNm || item.nickname || item.userId || item.memberId || item.writer || '익명';
      }

      // 날짜 포맷 처리
      let date = item.createdDateTime || item.regDt || item.createDate || item.date || '';
      if (date && date.includes('T')) {
        date = date.split('T')[0].replace(/-/g, '.');
      }

      const review: Review = {
        reviewer,
        rating: item.reviewScore || item.score || item.rating || item.starScore || item.point || 5,
        date,
        content: item.content || item.reviewContent || item.text || item.review || '',
        skinType: item.profileDto?.skinType || item.skinType || item.skinTypeCd,
        skinTone: item.profileDto?.skinTone || item.skinTone || item.skinToneCd,
        helpfulCount: item.recommendCount || item.helpCnt || item.likeCount || item.usefulPoint || 0,
      };

      // 이미지 (photoReviewList에서)
      if (item.photoReviewList && Array.isArray(item.photoReviewList)) {
        review.photoUrls = item.photoReviewList.map((p: any) => p.imageUrl || p.url || p).filter(Boolean);
      } else if (item.images || item.imageList || item.photoList) {
        review.photoUrls = item.images || item.imageList || item.photoList;
      }

      // 중복 체크 후 추가
      const isDuplicate = capturedReviews.some(r =>
        r.content === review.content ||
        (r.date === review.date && r.reviewer === review.reviewer)
      );

      if (!isDuplicate && review.content && review.content.length > 5) {
        capturedReviews.push(review);
      }
    });

    console.log(`   현재 수집된 리뷰: ${capturedReviews.length}개`);
  } catch (e) {
    console.error('API 파싱 오류:', e);
  }
};

// 스크롤 시뮬레이션
const smoothScroll = async (page: Page, distance: number): Promise<void> => {
  await page.evaluate(async (scrollDistance) => {
    await new Promise<void>((resolve) => {
      let totalScrolled = 0;
      const step = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        totalScrolled += step;
        if (totalScrolled >= scrollDistance) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }, distance);
};

// 리뷰 수집 (무한 스크롤 방식)
const collectReviews = async (page: Page, maxPages: number): Promise<void> => {
  console.log('📖 리뷰 수집 중...');

  // 목표 리뷰 수 (페이지당 10개 기준)
  const targetReviews = maxPages * 10;

  // 리뷰 영역으로 스크롤
  await page.evaluate(() => {
    const reviewArea = document.querySelector('[class*="ReviewArea"], [class*="review-area"]');
    if (reviewArea) {
      reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await randomDelay(2000, 3000);

  console.log(`   목표: ${targetReviews}개 리뷰`);
  console.log(`   초기 수집: ${capturedReviews.length}개`);

  let scrollCount = 0;
  let noNewDataCount = 0;
  const maxNoNewData = 10; // 연속 10회 새 데이터 없으면 종료
  const maxScrolls = maxPages * 3; // 최대 스크롤 횟수

  while (capturedReviews.length < targetReviews && noNewDataCount < maxNoNewData && scrollCount < maxScrolls) {
    scrollCount++;
    const beforeCount = capturedReviews.length;

    // 페이지 스크롤 (무한 스크롤 트리거)
    await page.evaluate(() => {
      window.scrollBy(0, 600);
    });

    // API 응답 대기
    await randomDelay(1200, 1800);

    // 새 리뷰가 수집되었는지 확인
    if (capturedReviews.length > beforeCount) {
      const newCount = capturedReviews.length - beforeCount;
      console.log(`   스크롤 ${scrollCount}: ${capturedReviews.length}개 (+${newCount})`);
      noNewDataCount = 0;
    } else {
      noNewDataCount++;
      if (noNewDataCount % 3 === 0) {
        console.log(`   스크롤 ${scrollCount}: 새 리뷰 없음 (${noNewDataCount}/${maxNoNewData})`);
      }
    }

    // 중간 진행 상황 (50개마다)
    if (capturedReviews.length > 0 && capturedReviews.length % 50 === 0 && capturedReviews.length !== beforeCount) {
      console.log(`   🎯 ${capturedReviews.length}개 수집 완료!`);
    }
  }

  // 종료 이유 출력
  if (capturedReviews.length >= targetReviews) {
    console.log(`\n   ✅ 목표 달성: ${capturedReviews.length}개`);
  } else if (noNewDataCount >= maxNoNewData) {
    console.log(`\n   ⚠️ 더 이상 새 리뷰 없음 (${noNewDataCount}회 연속)`);
  } else {
    console.log(`\n   ⚠️ 최대 스크롤 도달 (${scrollCount}회)`);
  }

  console.log(`   수집 완료: 총 ${capturedReviews.length}개 (스크롤 ${scrollCount}회)`);
};

// DOM에서 직접 리뷰 추출 (백업 방법)
const extractReviewsFromDOM = async (page: Page): Promise<void> => {
  console.log('📖 DOM에서 리뷰 추출 시도...');

  const domReviews = await page.evaluate(() => {
    const reviews: any[] = [];

    // innerText에서 리뷰 패턴 찾기
    const bodyText = document.body.innerText;
    const lines = bodyText.split('\n').filter(l => l.trim().length > 0);

    // 날짜 패턴 (yyyy.mm.dd)으로 리뷰 블록 식별
    let currentReview: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 날짜 패턴 발견
      if (/^\d{4}\.\d{2}\.\d{2}$/.test(line)) {
        if (currentReview && currentReview.content) {
          reviews.push(currentReview);
        }
        currentReview = {
          date: line,
          content: '',
          reviewer: '익명',
          rating: 5
        };

        // 이전 라인들에서 정보 추출
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const prevLine = lines[j].trim();

          // 리뷰 내용 (긴 텍스트)
          if (prevLine.length > 30 && !prevLine.includes('도움') && !prevLine.includes('신고')) {
            currentReview.content = prevLine;
          }

          // 작성자 (짧은 텍스트)
          if (prevLine.length >= 2 && prevLine.length <= 15 && !prevLine.match(/\d{4}/)) {
            currentReview.reviewer = prevLine;
          }
        }
      }
    }

    if (currentReview && currentReview.content) {
      reviews.push(currentReview);
    }

    return reviews;
  });

  // 중복 체크 후 추가
  domReviews.forEach(review => {
    const isDuplicate = capturedReviews.some(r => r.content === review.content);
    if (!isDuplicate && review.content && review.content.length > 10) {
      capturedReviews.push(review);
    }
  });

  console.log(`   DOM에서 추가 수집: ${domReviews.length}개, 총: ${capturedReviews.length}개`);
};

// 결과 저장
const saveResults = (result: CrawlResult, outputDir: string): string => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `oliveyoung-reviews-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');

  // CSV 저장
  const csvFilename = `oliveyoung-reviews-${timestamp}.csv`;
  const csvPath = path.join(outputDir, csvFilename);
  const csvHeader = 'reviewer,rating,date,content,skinType,helpfulCount\n';
  const csvRows = result.reviews.map(r =>
    `"${r.reviewer}",${r.rating},"${r.date}","${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}","${r.skinType || ''}",${r.helpfulCount || 0}`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8'); // BOM for Excel

  console.log(`\n✅ 저장 완료:`);
  console.log(`   JSON: ${filepath}`);
  console.log(`   CSV: ${csvPath}`);

  return filepath;
};

// 메인 크롤링 함수
const crawlOliveyoungReviews = async (
  productUrl: string,
  maxPages: number = 5,
  outputDir: string = './output'
): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 시작\n');
  console.log(`📌 URL: ${productUrl}`);
  console.log(`📄 최대 페이지: ${maxPages}\n`);

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

    console.log('📍 현재 URL:', page.url());
    console.log('📍 페이지 타이틀:', await page.title());

    // 상품명 추출
    try {
      const title = await page.title();
      if (title) {
        productInfo.name = title.split('|')[0].trim();
      }
    } catch (e) {}

    // 리뷰 수집
    await collectReviews(page, maxPages);

    // API에서 충분히 수집 못했으면 DOM에서 추출
    if (capturedReviews.length < 5) {
      await extractReviewsFromDOM(page);
    }

    // 스크린샷 저장
    await page.screenshot({ path: path.join(outputDir, 'final-screenshot.png') });

    const result: CrawlResult = {
      productName: productInfo.name,
      productUrl,
      totalReviews: productInfo.totalReviews || capturedReviews.length,
      averageRating: productInfo.rating || 0,
      reviews: capturedReviews,
      crawledAt: new Date().toISOString(),
    };

    console.log(`\n📊 수집 결과:`);
    console.log(`   상품명: ${result.productName}`);
    console.log(`   총 리뷰: ${result.reviews.length}개`);

    // 결과 저장
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
사용법: npx ts-node scripts/oliveyoung-review-crawler.ts <상품URL> [최대페이지수]

예시:
  npx ts-node scripts/oliveyoung-review-crawler.ts "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review"
  npx ts-node scripts/oliveyoung-review-crawler.ts "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842" 10
    `);
    process.exit(1);
  }

  const productUrl = args[0];
  const maxPages = parseInt(args[1]) || 5;

  try {
    await crawlOliveyoungReviews(productUrl, maxPages);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
