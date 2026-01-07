/**
 * 올리브영 리뷰 크롤러 - API 직접 호출 방식
 *
 * 사용법:
 * npx ts-node scripts/oliveyoung-api-crawler.ts <상품코드> [최대페이지수]
 *
 * 예시:
 * npx ts-node scripts/oliveyoung-api-crawler.ts A000000235842 50
 */

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
  photoUrls?: string[];
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

// 피부타입 코드 변환
const skinTypeMap: Record<string, string> = {
  'A01': '건성',
  'A02': '복합성',
  'A03': '지성',
  'A04': '중성',
  'A05': '민감성',
};

const skinToneMap: Record<string, string> = {
  'B01': '쿨톤',
  'B02': '웜톤',
  'B03': '뉴트럴',
};

// 랜덤 딜레이
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// API 호출
async function fetchReviews(goodsNo: string, page: number = 1, size: number = 20): Promise<any> {
  const url = `https://m.oliveyoung.co.kr/review/api/v2/reviews?goodsNo=${goodsNo}&page=${page}&size=${size}&sort=RECENT`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`,
    'Origin': 'https://www.oliveyoung.co.kr',
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// 리뷰 통계 조회
async function fetchStats(goodsNo: string): Promise<any> {
  const url = `https://m.oliveyoung.co.kr/review/api/v2/reviews/${goodsNo}/stats`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`,
  };

  try {
    const response = await fetch(url, { headers });
    if (response.ok) {
      return response.json();
    }
  } catch (e) {}
  return null;
}

// API 응답 파싱
function parseReview(item: any): Review {
  // 작성자
  let reviewer = '익명';
  if (item.profileDto?.nickname) {
    reviewer = item.profileDto.nickname;
  }

  // 날짜
  let date = item.createdDateTime || '';
  if (date.includes('T')) {
    date = date.split('T')[0].replace(/-/g, '.');
  }

  // 피부타입/톤
  const skinType = skinTypeMap[item.profileDto?.skinType] || item.profileDto?.skinType;
  const skinTone = skinToneMap[item.profileDto?.skinTone] || item.profileDto?.skinTone;

  // 옵션
  let option = '';
  if (item.goodsDto?.optionNm) {
    option = item.goodsDto.optionNm;
  }

  // 이미지
  let photoUrls: string[] = [];
  if (item.photoReviewList && Array.isArray(item.photoReviewList)) {
    photoUrls = item.photoReviewList.map((p: any) =>
      p.imagePath ? `https://image.oliveyoung.co.kr/uploads/images/goods/review/${p.imagePath}` : ''
    ).filter(Boolean);
  }

  return {
    reviewer,
    rating: item.reviewScore || 5,
    date,
    content: item.content || '',
    skinType,
    skinTone,
    helpfulCount: item.recommendCount || item.usefulPoint || 0,
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    option,
  };
}

// 메인 크롤링 함수
async function crawlOliveyoungReviews(
  goodsNo: string,
  maxPages: number = 50,
  outputDir: string = './output'
): Promise<CrawlResult> {
  console.log('🚀 올리브영 리뷰 API 크롤러 시작\n');
  console.log(`📌 상품코드: ${goodsNo}`);
  console.log(`📄 최대 페이지: ${maxPages}\n`);

  const reviews: Review[] = [];
  let totalReviews = 0;
  let avgRating = 0;
  let productName = '';

  // 1. 통계 조회
  console.log('📊 리뷰 통계 조회 중...');
  const stats = await fetchStats(goodsNo);
  if (stats?.data) {
    totalReviews = stats.data.totalCount || 0;
    avgRating = stats.data.averageScore || 0;
    console.log(`   총 리뷰: ${totalReviews}개, 평균: ${avgRating}점`);
  }

  // 2. 리뷰 수집
  console.log('\n📖 리뷰 수집 중...');

  const pageSize = 20;
  const actualMaxPages = Math.min(maxPages, Math.ceil(totalReviews / pageSize) || maxPages);

  for (let page = 1; page <= actualMaxPages; page++) {
    try {
      console.log(`   페이지 ${page}/${actualMaxPages} 로딩...`);

      const data = await fetchReviews(goodsNo, page, pageSize);

      if (data?.data && Array.isArray(data.data)) {
        const pageReviews = data.data.map(parseReview);

        // 중복 체크
        pageReviews.forEach((review: Review) => {
          const isDuplicate = reviews.some((r: Review) => r.content === review.content);
          if (!isDuplicate && review.content) {
            reviews.push(review);
          }
        });

        console.log(`   수집: ${reviews.length}개`);

        // 더 이상 데이터 없으면 종료
        if (data.data.length < pageSize) {
          console.log('   마지막 페이지 도달');
          break;
        }
      } else {
        console.log('   데이터 없음, 종료');
        break;
      }

      // API 부하 방지 딜레이
      await delay(500 + Math.random() * 500);

    } catch (error) {
      console.error(`   페이지 ${page} 오류:`, error);
      // 오류 시 잠시 대기 후 재시도
      await delay(2000);
    }
  }

  // 3. 결과 저장
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
    `"${r.reviewer}",${r.rating},"${r.date}","${r.skinType || ''}","${r.skinTone || ''}","${r.option || ''}",${r.helpfulCount || 0},"${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ).join('\n');
  fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');

  console.log(`\n✅ 수집 완료!`);
  console.log(`   총 리뷰: ${reviews.length}개`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   CSV: ${csvPath}`);

  return result;
}

// CLI
const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
사용법: npx ts-node scripts/oliveyoung-api-crawler.ts <상품코드> [최대페이지수]

상품코드는 URL에서 goodsNo= 뒤의 값입니다.
예: https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842
    → 상품코드: A000000235842

예시:
  npx ts-node scripts/oliveyoung-api-crawler.ts A000000235842
  npx ts-node scripts/oliveyoung-api-crawler.ts A000000235842 100
    `);
    process.exit(1);
  }

  const goodsNo = args[0];
  const maxPages = parseInt(args[1]) || 50;

  try {
    await crawlOliveyoungReviews(goodsNo, maxPages);
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
};

main();
