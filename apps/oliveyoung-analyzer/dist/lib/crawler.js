"use strict";
/**
 * 올리브영 리뷰 크롤러
 * Multi-Sort 전략으로 최대한 많은 리뷰 수집
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGoodsNo = extractGoodsNo;
exports.crawlReviews = crawlReviews;
const { chromium } = require('playwright');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// 리뷰 파싱
function parseReview(item) {
    return {
        reviewId: item.reviewId,
        content: item.content || '',
        rating: item.reviewScore || 5,
        date: item.createdDateTime || '',
        option: item.goodsDto?.optionName,
        skinType: item.profileDto?.skinType,
        skinTone: item.profileDto?.skinTone,
        helpfulCount: item.recommendCount || 0,
        hasPhoto: item.hasPhoto || false,
        isRepurchase: item.isRepurchase || false,
        photoUrls: item.photoReviewList?.map((p) => p.imagePath) || []
    };
}
// URL에서 상품번호 추출
function extractGoodsNo(input) {
    // 상품번호 직접 입력 (A000000235842)
    const directMatch = input.match(/^A\d{12}$/i);
    if (directMatch)
        return input.toUpperCase();
    // URL에서 추출
    const urlMatch = input.match(/goodsNo=([A-Z0-9]+)/i);
    if (urlMatch)
        return urlMatch[1].toUpperCase();
    return null;
}
// 특정 정렬로 리뷰 수집
async function crawlWithSort(page, goodsNo, sortType, state, onProgress, maxScrolls = 4000) {
    const beforeCount = state.reviews.size;
    let noNewDataCount = 0;
    let scrollCount = 0;
    // API 응답 핸들러
    const handleResponse = async (response) => {
        const url = response.url();
        if (url.includes('/review/api/v2/reviews') &&
            !url.includes('stats') &&
            !url.includes('photo-reviews') &&
            !url.includes('count') &&
            !url.includes('options')) {
            try {
                const json = await response.json();
                if (json?.data && Array.isArray(json.data)) {
                    for (const item of json.data) {
                        if (item.reviewId && !state.reviews.has(item.reviewId)) {
                            state.reviews.set(item.reviewId, parseReview(item));
                        }
                    }
                }
                if (json?.totalCnt)
                    state.totalCount = json.totalCnt;
            }
            catch (e) { }
        }
        if (url.includes('/stats')) {
            try {
                const json = await response.json();
                if (json?.data) {
                    if (json.data.goodsName)
                        state.productName = json.data.goodsName;
                    if (json.data.ratingDistribution?.averageRating) {
                        state.averageRating = json.data.ratingDistribution.averageRating;
                    }
                }
            }
            catch (e) { }
        }
    };
    page.on('response', handleResponse);
    // 페이지 로드
    const productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    // 리뷰 영역으로 스크롤
    await page.evaluate(() => {
        const reviewArea = document.querySelector('[class*="ReviewArea"]');
        if (reviewArea)
            reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(2000);
    // 정렬 버튼 클릭
    if (sortType !== 'RECENT') {
        try {
            const sortText = sortType === 'HIGH_SCORE' ? '평점높은순' : '평점낮은순';
            const sortBtn = page.locator(`button:has-text("${sortText}")`).first();
            if (await sortBtn.isVisible()) {
                await sortBtn.click();
                await delay(2000);
            }
        }
        catch (e) { }
    }
    // 스크롤 수집
    while (noNewDataCount < 80 && scrollCount < maxScrolls) {
        scrollCount++;
        const prevCount = state.reviews.size;
        await page.evaluate(() => window.scrollBy(0, 800));
        await delay(250);
        if (state.reviews.size > prevCount) {
            noNewDataCount = 0;
        }
        else {
            noNewDataCount++;
        }
        // 진행률 업데이트 (20회마다)
        if (scrollCount % 20 === 0 && state.totalCount > 0) {
            const pct = Math.min(90, (state.reviews.size / state.totalCount) * 100);
            onProgress(`리뷰 수집: ${state.reviews.size.toLocaleString()}/${state.totalCount.toLocaleString()}개`, Math.round(pct));
        }
        // 95% 수집 시 종료
        if (state.totalCount > 0 && state.reviews.size >= state.totalCount * 0.95) {
            break;
        }
    }
    page.removeListener('response', handleResponse);
    return state.reviews.size - beforeCount;
}
// 메인 크롤링 함수
async function crawlReviews(goodsNo, onProgress) {
    const state = {
        reviews: new Map(),
        totalCount: 0,
        productName: '',
        averageRating: 0
    };
    onProgress('브라우저 시작 중...', 5);
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });
    try {
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        const page = await context.newPage();
        await page.addInitScript(`Object.defineProperty(navigator, 'webdriver', { get: () => undefined });`);
        // 1. 최신순 수집
        onProgress('최신순 리뷰 수집 중...', 10);
        await crawlWithSort(page, goodsNo, 'RECENT', state, onProgress, 3000);
        // 2. 평점높은순 수집
        onProgress('평점높은순 리뷰 수집 중...', 40);
        await crawlWithSort(page, goodsNo, 'HIGH_SCORE', state, onProgress, 2000);
        // 3. 평점낮은순 수집
        onProgress('평점낮은순 리뷰 수집 중...', 70);
        await crawlWithSort(page, goodsNo, 'LOW_SCORE', state, onProgress, 2000);
        await browser.close();
        const reviews = Array.from(state.reviews.values());
        onProgress(`수집 완료: ${reviews.length}개`, 90);
        return {
            productName: state.productName,
            goodsNumber: goodsNo,
            productUrl: `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`,
            totalReviews: reviews.length,
            averageRating: state.averageRating,
            ratingDistribution: {},
            reviews,
            crawledAt: new Date().toISOString()
        };
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=crawler.js.map