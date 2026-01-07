/**
 * 올리브영 페이지네이션 구조 디버깅
 */

import { chromium } from 'playwright';

const main = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // WebDriver 감지 우회
  await page.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  `);

  console.log('페이지 로딩...');
  await page.goto('https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  // 페이지 끝까지 스크롤
  console.log('페이지 스크롤 중...');
  await page.evaluate(async () => {
    for (let i = 0; i < 10; i++) {
      window.scrollBy(0, 500);
      await new Promise(r => setTimeout(r, 300));
    }
  });

  await page.waitForTimeout(2000);

  // 리뷰 영역 찾기
  console.log('\n=== 리뷰 영역 분석 ===');
  const reviewSectionInfo = await page.evaluate(() => {
    const results: string[] = [];

    // 리뷰 관련 요소 찾기
    const selectors = [
      '#reviewInfo',
      '[class*="review"]',
      '[class*="Review"]',
      '[id*="review"]',
      '[data-tab="review"]',
    ];

    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        results.push(`${sel}: ${els.length}개 - ${Array.from(els).slice(0, 3).map(e => e.className || e.id).join(', ')}`);
      }
    });

    return results;
  });

  reviewSectionInfo.forEach(r => console.log(r));

  // 페이지네이션 요소 찾기
  console.log('\n=== 페이지네이션 분석 ===');
  const paginationInfo = await page.evaluate(() => {
    const results: string[] = [];

    const selectors = [
      '[class*="paging"]',
      '[class*="Paging"]',
      '[class*="Pagination"]',
      '[class*="pagination"]',
      '.pageing',
      'nav',
      '[role="navigation"]',
    ];

    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      els.forEach((el, i) => {
        const html = el.innerHTML.substring(0, 200);
        results.push(`${sel}[${i}] class="${el.className}" - ${html}...`);
      });
    });

    return results;
  });

  paginationInfo.forEach(r => console.log(r));

  // 리뷰 목록 영역의 페이지네이션 버튼 찾기
  console.log('\n=== 리뷰 페이지네이션 버튼 ===');
  const pagingButtons = await page.evaluate(() => {
    const results: string[] = [];

    // 숫자 버튼 (1, 2, 3...) 찾기
    const buttons = document.querySelectorAll('button, a');
    buttons.forEach(btn => {
      const text = btn.textContent?.trim();
      if (text && /^[0-9]+$/.test(text) && parseInt(text) <= 20) {
        const parent = btn.parentElement;
        results.push(`숫자버튼 "${text}": tag=${btn.tagName}, class="${btn.className}", parent="${parent?.className}"`);
      }
    });

    // "다음" 버튼 찾기
    buttons.forEach(btn => {
      const text = btn.textContent?.trim();
      if (text && (text.includes('다음') || text === '>' || text === '»')) {
        results.push(`다음버튼 "${text}": tag=${btn.tagName}, class="${btn.className}"`);
      }
    });

    return results;
  });

  pagingButtons.forEach(r => console.log(r));

  // 리뷰 영역 스크린샷
  console.log('\n스크린샷 저장 중...');
  await page.screenshot({ path: 'output/debug-full-page.png', fullPage: true });

  // 현재 보이는 화면 스크린샷
  await page.screenshot({ path: 'output/debug-viewport.png' });

  console.log('\n완료!');
  await browser.close();
};

main().catch(console.error);
