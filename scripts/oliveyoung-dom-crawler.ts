/**
 * 올리브영 리뷰 크롤러 - DOM 직접 추출 방식
 * HTML에서 리뷰 텍스트를 직접 긁어옴
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
  helpfulCount?: number;
}

interface CrawlResult {
  productName: string;
  productUrl: string;
  totalReviews: number;
  reviews: Review[];
  crawledAt: string;
}

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

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

// DOM에서 리뷰 추출
const extractReviewsFromDOM = async (page: Page): Promise<Review[]> => {
  return await page.evaluate(() => {
    const reviews: Review[] = [];

    // 방법 1: 리뷰 아이템 직접 선택
    const reviewItems = document.querySelectorAll('[class*="ReviewList"] > div, [class*="review-item"], [class*="ReviewItem"]');

    reviewItems.forEach((item) => {
      try {
        // 리뷰 내용
        const contentEl = item.querySelector('[class*="content"], [class*="text"], [class*="review-content"], p');
        const content = contentEl?.textContent?.trim() || '';

        // 날짜
        const dateEl = item.querySelector('[class*="date"], time, [class*="created"]');
        const date = dateEl?.textContent?.trim() || '';

        // 평점 (별점)
        const ratingEl = item.querySelector('[class*="rating"], [class*="star"], [class*="score"]');
        let rating = 5;
        if (ratingEl) {
          const ratingText = ratingEl.textContent || '';
          const match = ratingText.match(/(\d)/);
          if (match) rating = parseInt(match[1]);
        }

        // 작성자
        const authorEl = item.querySelector('[class*="author"], [class*="nickname"], [class*="user"]');
        const reviewer = authorEl?.textContent?.trim() || '익명';

        if (content && content.length > 10) {
          reviews.push({ reviewer, rating, date, content });
        }
      } catch (e) {}
    });

    // 방법 2: 텍스트 패턴으로 추출 (백업)
    if (reviews.length === 0) {
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      let currentReview: Partial<Review> | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 날짜 패턴 (2025.12.22 형식)
        if (/^\d{4}\.\d{2}\.\d{2}$/.test(line)) {
          if (currentReview && currentReview.content) {
            reviews.push(currentReview as Review);
          }
          currentReview = {
            date: line,
            content: '',
            reviewer: '익명',
            rating: 5
          };

          // 이전 라인에서 리뷰 내용 찾기
          for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
            const prevLine = lines[j];
            // 긴 텍스트는 리뷰 내용으로 추정
            if (prevLine.length > 30 && !prevLine.includes('도움') && !prevLine.includes('신고') && !prevLine.includes('올리브영')) {
              currentReview.content = prevLine;
              break;
            }
          }
        }
      }

      if (currentReview && currentReview.content) {
        reviews.push(currentReview as Review);
      }
    }

    return reviews;
  });
};

// 현재 보이는 모든 리뷰 텍스트 추출 (단순화)
const extractAllVisibleReviews = async (page: Page): Promise<Review[]> => {
  return await page.evaluate(() => {
    const reviews: Review[] = [];
    const seen = new Set<string>();

    // 모든 텍스트 노드에서 리뷰 패턴 찾기
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: string[] = [];
    let node: Node | null;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 20) {
        textNodes.push(text);
      }
    }

    // 날짜 패턴으로 리뷰 블록 식별
    const datePattern = /\d{4}\.\d{2}\.\d{2}/;

    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i];

      // 리뷰 내용으로 보이는 텍스트 (30자 이상, 특정 키워드 제외)
      if (text.length >= 30 &&
          !text.includes('올리브영') &&
          !text.includes('배송') &&
          !text.includes('장바구니') &&
          !text.includes('구매하기') &&
          !seen.has(text)) {

        seen.add(text);

        // 근처에서 날짜 찾기
        let date = '';
        for (let j = Math.max(0, i - 5); j < Math.min(textNodes.length, i + 5); j++) {
          const match = textNodes[j].match(datePattern);
          if (match) {
            date = match[0];
            break;
          }
        }

        reviews.push({
          reviewer: '익명',
          rating: 5,
          date,
          content: text
        });
      }
    }

    return reviews;
  });
};

// 메인 크롤링
const crawlReviews = async (productUrl: string, targetCount: number = 500): Promise<CrawlResult> => {
  console.log('🚀 올리브영 리뷰 크롤러 (DOM 방식) 시작\n');
  console.log(`📌 URL: ${productUrl}`);
  console.log(`🎯 목표: ${targetCount}개\n`);

  const browser = await launchBrowser();
  const allReviews: Review[] = [];
  const seenContents = new Set<string>();

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    await page.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    `);

    console.log('📦 페이지 로딩...');
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(3000, 4000);

    const productName = (await page.title()).split('|')[0].trim();
    console.log(`📍 상품명: ${productName}\n`);

    // 리뷰 영역으로 스크롤
    await page.evaluate(() => {
      const reviewArea = document.querySelector('[class*="ReviewArea"], [class*="review"]');
      if (reviewArea) {
        reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await randomDelay(2000, 3000);

    console.log('📖 리뷰 수집 중...');

    let scrollCount = 0;
    let noNewCount = 0;
    const maxNoNew = 15;

    while (allReviews.length < targetCount && noNewCount < maxNoNew) {
      scrollCount++;
      const beforeCount = allReviews.length;

      // DOM에서 리뷰 추출
      const pageReviews = await extractAllVisibleReviews(page);

      // 새 리뷰 추가 (중복 제거)
      for (const review of pageReviews) {
        const key = review.content.substring(0, 50);
        if (!seenContents.has(key) && review.content.length > 20) {
          seenContents.add(key);
          allReviews.push(review);
        }
      }

      // 스크롤
      await page.evaluate(() => window.scrollBy(0, 500));
      await randomDelay(800, 1200);

      // 진행 상황
      if (allReviews.length > beforeCount) {
        const newCount = allReviews.length - beforeCount;
        console.log(`   스크롤 ${scrollCount}: ${allReviews.length}개 (+${newCount})`);
        noNewCount = 0;
      } else {
        noNewCount++;
        if (noNewCount % 5 === 0) {
          console.log(`   스크롤 ${scrollCount}: 새 리뷰 없음 (${noNewCount}/${maxNoNew})`);
        }
      }

      // 50개마다 상태 표시
      if (allReviews.length > 0 && allReviews.length % 50 === 0 && allReviews.length !== beforeCount) {
        console.log(`   🎯 ${allReviews.length}개 수집!`);
      }
    }

    console.log(`\n✅ 수집 완료: ${allReviews.length}개 (스크롤 ${scrollCount}회)`);

    // 결과
    const result: CrawlResult = {
      productName,
      productUrl,
      totalReviews: allReviews.length,
      reviews: allReviews,
      crawledAt: new Date().toISOString()
    };

    // 저장
    const outputDir = './output';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonPath = path.join(outputDir, `oliveyoung-dom-${timestamp}.json`);
    const csvPath = path.join(outputDir, `oliveyoung-dom-${timestamp}.csv`);

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

    const csvHeader = 'reviewer,rating,date,content\n';
    const csvRows = allReviews.map(r =>
      `"${r.reviewer}",${r.rating},"${r.date}","${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ).join('\n');
    fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

    console.log(`\n📁 저장 완료:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);

    return result;

  } finally {
    await browser.close();
    console.log('\n🏁 완료!');
  }
};

// CLI
const main = async () => {
  const args = process.argv.slice(2);
  const url = args[0] || 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review';
  const target = parseInt(args[1]) || 500;

  await crawlReviews(url, target);
};

main().catch(console.error);
