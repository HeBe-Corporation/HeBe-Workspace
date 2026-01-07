/**
 * 올리브영 리뷰 크롤러 - 디버깅용
 *
 * 페이지 구조와 리뷰 로딩 방식 분석
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

const main = async () => {
  const goodsNo = process.argv[2] || 'A000000235842';
  console.log(`🔍 올리브영 리뷰 구조 분석 - 상품코드: ${goodsNo}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--window-size=1920,1080'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ko-KR',
    });

    const page = await context.newPage();

    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    `);

    // 모든 네트워크 요청 로깅
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('review') || url.includes('Review')) {
        console.log(`➡️ REQUEST: ${request.method()} ${url.substring(0, 100)}`);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/review/api/') && url.includes('reviews') &&
          !url.includes('stats') && !url.includes('photo') && !url.includes('summary') && !url.includes('count')) {
        try {
          const json = await response.json();
          console.log(`\n⬅️ RESPONSE: ${url.substring(0, 80)}...`);
          console.log(`   status: ${json?.status}, code: ${json?.code}`);
          console.log(`   totalCnt: ${json?.totalCnt}`);
          console.log(`   data length: ${json?.data?.length}`);

          if (json?.data && Array.isArray(json.data)) {
            let added = 0;
            json.data.forEach((item: any) => {
              const review = parseReview(item);
              const dup = capturedReviews.some(r => r.content === review.content);
              if (!dup && review.content) {
                capturedReviews.push(review);
                added++;
              }
            });
            console.log(`   새 리뷰: +${added}개, 총: ${capturedReviews.length}개`);
          }

          if (json?.totalCnt) totalReviewCount = json.totalCnt;
        } catch (e) {}
      }
    });

    // 페이지 로드
    const url = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    console.log(`📦 페이지 로딩: ${url}\n`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // 리뷰 탭 클릭
    console.log('\n📖 리뷰 탭 클릭...');
    const reviewTab = page.locator('button:has-text("리뷰")').first();
    if (await reviewTab.count() > 0) {
      await reviewTab.click();
      await delay(2000);
    }

    // 페이지네이션 HTML 확인
    console.log('\n📋 페이지네이션 구조 분석...');
    const paginationHTML = await page.evaluate(() => {
      // 페이지네이션 요소들 찾기
      const selectors = [
        '[class*="pagination"]',
        '[class*="Pagination"]',
        '[class*="paging"]',
        '[class*="page-nav"]',
        'nav[aria-label*="page"]',
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          return {
            selector: sel,
            html: el.outerHTML.substring(0, 1000),
            className: el.className,
          };
        }
      }

      // 페이지 버튼들 찾기
      const buttons = Array.from(document.querySelectorAll('button, a')).filter(
        (b) => /^\d+$/.test(b.textContent?.trim() || '') && (b as HTMLElement).offsetParent !== null
      );

      if (buttons.length > 0) {
        return {
          buttons: buttons.slice(0, 10).map(b => ({
            tag: b.tagName,
            text: b.textContent?.trim(),
            className: b.className,
          })),
        };
      }

      return { error: '페이지네이션을 찾을 수 없음' };
    });

    console.log('   결과:', JSON.stringify(paginationHTML, null, 2));

    // 리뷰 컨테이너 구조 확인
    console.log('\n📋 리뷰 영역 구조 분석...');
    const reviewAreaInfo = await page.evaluate(() => {
      const reviewSelectors = [
        '[class*="ReviewList"]',
        '[class*="review-list"]',
        '[class*="reviewList"]',
        '#reviewList',
        '[class*="prd_review"]',
        '#reviewInfo',
      ];

      for (const sel of reviewSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          return {
            selector: sel,
            className: el.className,
            childCount: el.children.length,
            scrollHeight: (el as HTMLElement).scrollHeight,
          };
        }
      }

      return { error: '리뷰 영역을 찾을 수 없음' };
    });

    console.log('   결과:', JSON.stringify(reviewAreaInfo, null, 2));

    // window 객체에서 리뷰 관련 함수/데이터 확인
    console.log('\n📋 전역 객체 분석...');
    const globalInfo = await page.evaluate(() => {
      const win = window as any;
      const result: any = {};

      // React/Redux 상태
      if (win.__REDUX_STORE__) result.hasRedux = true;
      if (win.__NEXT_DATA__) result.hasNext = true;
      if (win.__NUXT__) result.hasNuxt = true;

      // 올리브영 전역 객체
      const oyKeys = Object.keys(win).filter(k =>
        k.toLowerCase().includes('review') ||
        k.toLowerCase().includes('oliveyoung') ||
        k.toLowerCase().includes('goods')
      );
      if (oyKeys.length > 0) result.relevantGlobals = oyKeys;

      // API 관련 함수
      const funcKeys = Object.keys(win).filter(k => typeof win[k] === 'function');
      const apiFuncs = funcKeys.filter(k =>
        k.toLowerCase().includes('api') ||
        k.toLowerCase().includes('fetch') ||
        k.toLowerCase().includes('load')
      );
      if (apiFuncs.length > 0) result.apiFunctions = apiFuncs.slice(0, 20);

      return result;
    });

    console.log('   결과:', JSON.stringify(globalInfo, null, 2));

    // 클릭 이벤트 트리거 테스트
    console.log('\n📋 페이지 2 클릭 테스트...');

    // 방법 1: 숫자 2 버튼 찾기
    const page2Btn = page.locator('button:text-is("2"), a:text-is("2")').first();
    if (await page2Btn.count() > 0) {
      console.log('   페이지 2 버튼 발견!');
      const isVisible = await page2Btn.isVisible();
      console.log(`   visible: ${isVisible}`);

      if (isVisible) {
        const box = await page2Btn.boundingBox();
        console.log(`   위치: ${JSON.stringify(box)}`);

        await page2Btn.scrollIntoViewIfNeeded();
        await delay(500);
        console.log('   클릭 시도...');

        const beforeCount = capturedReviews.length;
        await page2Btn.click({ force: true });
        await delay(3000);

        console.log(`   클릭 후: ${capturedReviews.length}개 (이전: ${beforeCount}개)`);
      }
    } else {
      console.log('   페이지 2 버튼 없음');

      // 모든 버튼 나열
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).slice(0, 30).map(b => ({
          text: b.textContent?.trim().substring(0, 30),
          className: b.className.substring(0, 50),
        }));
      });
      console.log('   버튼 목록:', JSON.stringify(allButtons.filter(b => b.text), null, 2));
    }

    // 결과 저장
    console.log(`\n📊 최종 수집: ${capturedReviews.length}개 / ${totalReviewCount}개`);

    if (capturedReviews.length > 0) {
      const outputDir = './output';
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const jsonPath = path.join(outputDir, `debug-${goodsNo}-${timestamp}.json`);

      fs.writeFileSync(jsonPath, JSON.stringify({
        goodsNo,
        totalReviews: totalReviewCount,
        collected: capturedReviews.length,
        reviews: capturedReviews,
      }, null, 2), 'utf-8');

      console.log(`   저장: ${jsonPath}`);
    }

    // 5초 대기 후 종료
    console.log('\n⏳ 5초 후 종료...');
    await delay(5000);

  } finally {
    await browser.close();
  }
};

main().catch(console.error);
