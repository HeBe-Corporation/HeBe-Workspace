/**
 * 리뷰 분석 모듈
 */

import { Review, CrawlResult, BasicAnalysis, OptionAnalysis, KeywordAnalysis, ImprovementOpportunity } from './types';
import {
  getAllPositiveKeywords,
  getAllNegativeKeywords,
  getSkinTypeName,
  findKeywordCategory,
  isNegativeInPositiveContext,
  NEGATIVE_KEYWORDS
} from './keywords';

// 리뷰 데이터 기본 분석
export function analyzeReviews(crawlResult: CrawlResult): BasicAnalysis {
  const { reviews } = crawlResult;
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return createEmptyAnalysis();
  }

  const stats = calculateStats(reviews);
  const optionAnalysis = analyzeByOption(reviews);
  const skinTypeDistribution = analyzeSkinTypes(reviews);
  const keywords = analyzeKeywords(reviews);
  const lowRatingReviews = reviews
    .filter(r => r.rating <= 3)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 20);
  const highlightQuotes = extractHighlightQuotes(reviews);

  return {
    stats,
    optionAnalysis,
    skinTypeDistribution,
    keywords,
    lowRatingReviews,
    highlightQuotes
  };
}

// 빈 분석 결과
function createEmptyAnalysis(): BasicAnalysis {
  return {
    stats: {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {},
      repurchaseRate: 0,
      repurchaseCount: 0,
      photoRate: 0,
      photoCount: 0
    },
    optionAnalysis: [],
    skinTypeDistribution: {},
    keywords: { positive: [], negative: [] },
    lowRatingReviews: [],
    highlightQuotes: []
  };
}

// 기본 통계 계산
function calculateStats(reviews: Review[]): BasicAnalysis['stats'] {
  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });

  const repurchaseCount = reviews.filter(r => r.isRepurchase).length;
  const photoCount = reviews.filter(r => r.hasPhoto).length;

  return {
    totalReviews,
    averageRating: Math.round(avgRating * 100) / 100,
    ratingDistribution,
    repurchaseRate: Math.round((repurchaseCount / totalReviews) * 1000) / 10,
    repurchaseCount,
    photoRate: Math.round((photoCount / totalReviews) * 1000) / 10,
    photoCount
  };
}

// 옵션별 분석
function analyzeByOption(reviews: Review[]): OptionAnalysis[] {
  const optionMap = new Map<string, { count: number; totalRating: number }>();

  reviews.forEach(r => {
    const opt = r.option || '미지정';
    const current = optionMap.get(opt) || { count: 0, totalRating: 0 };
    current.count++;
    current.totalRating += r.rating;
    optionMap.set(opt, current);
  });

  return Array.from(optionMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgRating: Math.round((data.totalRating / data.count) * 100) / 100,
      percentage: Math.round((data.count / reviews.length) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);
}

// 피부타입 분포
function analyzeSkinTypes(reviews: Review[]): Record<string, number> {
  const skinMap: Record<string, number> = {};
  reviews.forEach(r => {
    const skinType = getSkinTypeName(r.skinType);
    skinMap[skinType] = (skinMap[skinType] || 0) + 1;
  });
  return skinMap;
}

// 키워드 분석
function analyzeKeywords(reviews: Review[]): { positive: KeywordAnalysis[]; negative: KeywordAnalysis[] } {
  const totalReviews = reviews.length;
  const positiveCount: Record<string, number> = {};
  const negativeCount: Record<string, number> = {};

  const allPositive = getAllPositiveKeywords();
  const allNegative = getAllNegativeKeywords();

  reviews.forEach(r => {
    const content = r.content;

    allPositive.forEach(keyword => {
      if (content.includes(keyword)) {
        positiveCount[keyword] = (positiveCount[keyword] || 0) + 1;
      }
    });

    allNegative.forEach(keyword => {
      if (content.includes(keyword) && !isNegativeInPositiveContext(content, keyword)) {
        negativeCount[keyword] = (negativeCount[keyword] || 0) + 1;
      }
    });
  });

  const positive: KeywordAnalysis[] = Object.entries(positiveCount)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: Math.round((count / totalReviews) * 1000) / 10,
      category: findKeywordCategory(keyword, true)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const negative: KeywordAnalysis[] = Object.entries(negativeCount)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: Math.round((count / totalReviews) * 1000) / 10,
      category: findKeywordCategory(keyword, false)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return { positive, negative };
}

// 하이라이트 문구 추출
function extractHighlightQuotes(reviews: Review[]): string[] {
  const quotes: string[] = [];

  const topReviews = reviews
    .filter(r => r.rating === 5 && r.content.length >= 50)
    .sort((a, b) => b.helpfulCount - a.helpfulCount)
    .slice(0, 10);

  topReviews.forEach(r => {
    const sentences = r.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const highlights = sentences.filter(s =>
      s.includes('좋아') || s.includes('최고') || s.includes('대박') ||
      s.includes('인생템') || s.includes('추천') || s.includes('만족')
    );

    if (highlights.length > 0) {
      quotes.push(highlights[0].trim());
    } else if (sentences.length > 0) {
      quotes.push(sentences[0].trim());
    }
  });

  return [...new Set(quotes)].slice(0, 5);
}

// 개선 기회 분석
export function analyzeImprovementOpportunities(crawlResult: CrawlResult, analysis: BasicAnalysis): ImprovementOpportunity[] {
  const { reviews } = crawlResult;
  const opportunities: ImprovementOpportunity[] = [];

  const categoryIssues: Record<string, { count: number; samples: string[] }> = {};

  Object.entries(NEGATIVE_KEYWORDS).forEach(([category, keywords]) => {
    categoryIssues[category] = { count: 0, samples: [] };

    reviews.forEach(r => {
      const content = r.content;
      keywords.forEach(keyword => {
        if (content.includes(keyword) && !isNegativeInPositiveContext(content, keyword)) {
          categoryIssues[category].count++;
          if (categoryIssues[category].samples.length < 3) {
            const sentence = content.split(/[.!?]+/).find(s => s.includes(keyword));
            if (sentence) categoryIssues[category].samples.push(sentence.trim());
          }
        }
      });
    });
  });

  const issueToOpportunity: Record<string, { opportunity: string; action: string }> = {
    effect: {
      opportunity: '효과 체감이 명확한 고기능성 제품',
      action: '임상 데이터 기반 효과 입증, Before/After 콘텐츠 제작'
    },
    irritation: {
      opportunity: '민감성 피부용 저자극 라인',
      action: '피부 테스트 강화, "무자극 인증" 마케팅'
    },
    texture: {
      opportunity: '가벼운 텍스처의 산뜻한 사용감',
      action: '제형 개선 R&D, "무겁지 않은" USP 강조'
    },
    smell: {
      opportunity: '향 개선 또는 무향 옵션',
      action: '무향 라인 출시, 천연 향료 사용'
    },
    price: {
      opportunity: '가성비 라인 또는 용량 다양화',
      action: '소용량 체험팩, 대용량 리필팩 출시'
    },
    usability: {
      opportunity: '사용법 단순화, 편의성 개선',
      action: '사용법 가이드 영상, 패키지 UX 개선'
    }
  };

  Object.entries(categoryIssues)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([category, data]) => {
      const mapping = issueToOpportunity[category];
      if (mapping) {
        opportunities.push({
          issue: category,
          frequency: data.count,
          sampleReviews: data.samples,
          opportunity: mapping.opportunity,
          suggestedAction: mapping.action
        });
      }
    });

  return opportunities;
}
