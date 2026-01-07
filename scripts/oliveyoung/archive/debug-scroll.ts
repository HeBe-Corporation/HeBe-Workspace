/**
 * 올리브영 무한 스크롤 디버깅 - 리뷰 영역 끝까지 스크롤
 */

import { chromium } from 'playwright';

const main = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // API 캡처
  let apiCallCount = 0;
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') && url.includes('review') && !url.includes('stats') && !url.includes('count') && !url.includes('photo-reviews')) {
      apiCallCount++;
      console.log(`\n📡 API 호출 #${apiCallCount}: ${url.substring(0, 80)}...`);
      try {
        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          console.log(`   리뷰 ${json.data.length}개, 총 ${json.totalCnt || '?'}개`);
          if (json.pagination) {
            console.log(`   페이지: ${JSON.stringify(json.pagination)}`);
          }
        }
      } catch (e) {}
    }
  });

  await page.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  `);

  console.log('페이지 로딩...');
  await page.goto('https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(4000);

  // 리뷰 영역까지 스크롤
  console.log('\n리뷰 영역으로 스크롤...');
  await page.evaluate(() => {
    const reviewArea = document.querySelector('[class*="ReviewArea"], [class*="review-area"]');
    if (reviewArea) {
      reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await page.waitForTimeout(2000);

  // 리뷰 영역에서 계속 스크롤 (무한 스크롤 테스트)
  console.log('\n무한 스크롤 테스트 (20회)...');
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, 600);
    });
    await page.waitForTimeout(1500);

    // 현재 리뷰 개수 확인
    const reviewCount = await page.evaluate(() => {
      const reviews = document.querySelectorAll('[class*="ReviewList"] > div, [class*="review-item"], [class*="ReviewItem"]');
      return reviews.length;
    });
    console.log(`   스크롤 ${i + 1}: DOM 리뷰 ${reviewCount}개`);
  }

  // "더보기" 버튼 찾기
  console.log('\n더보기 버튼 검색...');
  const moreButtonInfo = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const moreButtons: string[] = [];
    buttons.forEach(btn => {
      const text = btn.textContent?.trim() || '';
      if (text.includes('더보기') || text.includes('더 보기') || text.includes('more') || text.includes('More')) {
        moreButtons.push(`"${text}" - class="${btn.className}"`);
      }
    });
    return moreButtons;
  });
  moreButtonInfo.forEach(b => console.log(`   ${b}`));

  // 리뷰 리스트 하단 HTML
  console.log('\n리뷰 영역 하단 분석...');
  const bottomHTML = await page.evaluate(() => {
    const reviewArea = document.querySelector('[class*="ReviewArea"], [class*="review-area"]');
    if (reviewArea) {
      // 마지막 자식 요소들
      const children = reviewArea.children;
      if (children.length > 0) {
        const lastChild = children[children.length - 1];
        return `마지막 요소: ${lastChild.tagName}.${lastChild.className}\nHTML: ${lastChild.innerHTML.substring(0, 500)}`;
      }
    }
    return '리뷰 영역 없음';
  });
  console.log(bottomHTML);

  // 스크린샷
  await page.screenshot({ path: 'output/debug-after-scroll.png' });
  console.log('\n스크린샷 저장: output/debug-after-scroll.png');

  console.log('\n완료!');
  await browser.close();
};

main().catch(console.error);
