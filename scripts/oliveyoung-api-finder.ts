/**
 * 올리브영 리뷰 API 구조 분석기
 * Network 탭에서 API URL/파라미터를 자동으로 캡처
 */

import { chromium } from 'playwright';

const main = async () => {
  console.log('🔍 올리브영 리뷰 API 분석 시작\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // WebDriver 감지 우회
  await page.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  `);

  // 모든 리뷰 관련 API 요청 캡처
  const apiCalls: any[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('review') || url.includes('Review')) {
      apiCalls.push({
        type: 'REQUEST',
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData(),
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('review') || url.includes('Review')) {
      try {
        const json = await response.json();
        apiCalls.push({
          type: 'RESPONSE',
          url: url,
          status: response.status(),
          data: json,
        });
      } catch (e) {
        // JSON 아닌 응답 무시
      }
    }
  });

  console.log('📦 페이지 로딩...');
  await page.goto('https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  // 리뷰 영역으로 스크롤
  console.log('📜 리뷰 영역 스크롤...');
  await page.evaluate(() => {
    const reviewArea = document.querySelector('[class*="ReviewArea"]');
    if (reviewArea) reviewArea.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(3000);

  // 몇 번 스크롤해서 추가 API 호출 캡처
  console.log('📜 추가 스크롤 (API 호출 캡처)...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
  }

  // 결과 분석
  console.log('\n' + '='.repeat(80));
  console.log('📡 캡처된 리뷰 API 목록');
  console.log('='.repeat(80));

  const reviewApis = apiCalls.filter(c =>
    c.type === 'RESPONSE' &&
    c.url.includes('/reviews') &&
    !c.url.includes('stats') &&
    !c.url.includes('count') &&
    !c.url.includes('photo-reviews') &&
    !c.url.includes('options')
  );

  if (reviewApis.length > 0) {
    const api = reviewApis[0];
    console.log('\n🎯 메인 리뷰 API 발견!\n');

    // URL 파싱
    const urlObj = new URL(api.url);
    console.log('📌 Base URL:', urlObj.origin + urlObj.pathname);
    console.log('\n📌 Query Parameters:');
    urlObj.searchParams.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    // 응답 구조 분석
    if (api.data) {
      console.log('\n📌 Response Structure:');
      console.log('   Keys:', Object.keys(api.data).join(', '));

      if (api.data.pagination) {
        console.log('\n📌 Pagination Info:');
        console.log('   ', JSON.stringify(api.data.pagination, null, 2).replace(/\n/g, '\n   '));
      }

      if (api.data.totalCnt) {
        console.log('\n📌 Total Reviews:', api.data.totalCnt);
      }

      if (api.data.data && Array.isArray(api.data.data) && api.data.data.length > 0) {
        console.log('\n📌 Review Item Keys:');
        console.log('   ', Object.keys(api.data.data[0]).join(', '));

        console.log('\n📌 Sample Review (first item):');
        const sample = api.data.data[0];
        console.log('   reviewId:', sample.reviewId);
        console.log('   reviewScore:', sample.reviewScore);
        console.log('   content:', sample.content?.substring(0, 100) + '...');
        console.log('   createdDateTime:', sample.createdDateTime);
        if (sample.profileDto) {
          console.log('   profileDto.skinType:', sample.profileDto.skinType);
          console.log('   profileDto.skinTone:', sample.profileDto.skinTone);
        }
      }
    }

    // API 호출 예시 생성
    console.log('\n' + '='.repeat(80));
    console.log('🔧 API 직접 호출 예시');
    console.log('='.repeat(80));
    console.log(`
fetch("${api.url}", {
  "headers": {
    "accept": "application/json",
    "accept-language": "ko-KR,ko;q=0.9",
  },
  "method": "GET"
})
.then(res => res.json())
.then(data => console.log(data));
`);

  } else {
    console.log('\n❌ 리뷰 API를 찾지 못했습니다.');
    console.log('캡처된 모든 API 호출:');
    apiCalls.forEach((c, i) => {
      console.log(`\n[${i + 1}] ${c.type}: ${c.url?.substring(0, 100)}...`);
    });
  }

  // 모든 API 정보 파일로 저장
  const fs = require('fs');
  fs.writeFileSync('./output/api-analysis.json', JSON.stringify(apiCalls, null, 2), 'utf-8');
  console.log('\n📁 전체 API 정보 저장: output/api-analysis.json');

  await browser.close();
  console.log('\n✅ 분석 완료!');
};

main().catch(console.error);
