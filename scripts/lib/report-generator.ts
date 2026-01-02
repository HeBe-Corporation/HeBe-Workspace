/**
 * 마크다운 리포트 생성기
 * 신제품 개발 인사이트 중심의 분석 보고서 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import { CrawlResult, BasicAnalysis, ImprovementOpportunity } from './types';
import { getSkinTypeName } from './keywords';

interface ReportOptions {
  crawlResult: CrawlResult;
  analysis: BasicAnalysis;
  improvements: ImprovementOpportunity[];
  outputDir?: string;
}

/**
 * 마크다운 리포트 생성
 */
export function generateMarkdownReport(options: ReportOptions): string {
  const { crawlResult, analysis, improvements, outputDir = './output' } = options;
  const { productName, goodsNumber, productUrl, totalReviews, averageRating } = crawlResult;
  const { stats, optionAnalysis, skinTypeDistribution, keywords, lowRatingReviews, highlightQuotes } = analysis;

  const date = new Date().toISOString().split('T')[0];

  let report = `# ${productName} 리뷰 분석 리포트

> 분석일: ${date}
> 데이터 출처: 올리브영
> 분석 리뷰 수: ${totalReviews.toLocaleString()}개

---

## 1. 상품 개요

| 항목 | 내용 |
|------|------|
| 상품명 | ${productName} |
| 상품번호 | ${goodsNumber} |
| 상품 URL | [올리브영 바로가기](${productUrl}) |
| 총 리뷰 수 | ${totalReviews.toLocaleString()}개 |
| 평균 평점 | ${averageRating} / 5.0 |

---

## 2. 리뷰 통계

### 2.1 평점 분포

| 별점 | 개수 | 비율 |
|------|------|------|
`;

  // 평점 분포 테이블
  for (let i = 5; i >= 1; i--) {
    const count = stats.ratingDistribution[i] || 0;
    const pct = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(1) : '0';
    report += `| ${i}점 | ${count.toLocaleString()}개 | ${pct}% |\n`;
  }

  report += `
### 2.2 옵션별 분석

| 옵션 | 리뷰 수 | 평균 평점 | 비율 |
|------|---------|-----------|------|
`;

  optionAnalysis.forEach(opt => {
    report += `| ${opt.name} | ${opt.count.toLocaleString()}개 | ${opt.avgRating} | ${opt.percentage}% |\n`;
  });

  report += `
### 2.3 기타 지표

| 지표 | 수치 |
|------|------|
| 재구매 언급 | ${stats.repurchaseCount.toLocaleString()}건 (${stats.repurchaseRate}%) |
| 사진 포함 | ${stats.photoCount.toLocaleString()}건 (${stats.photoRate}%) |

---

## 3. 긍정 키워드 분석 (유지해야 할 강점)

| 키워드 | 언급 수 | 비율 | 카테고리 |
|--------|---------|------|----------|
`;

  keywords.positive.forEach(kw => {
    report += `| ${kw.keyword} | ${kw.count.toLocaleString()}건 | ${kw.percentage}% | ${kw.category} |\n`;
  });

  report += `
### 핵심 강점 요약
`;

  // 카테고리별 그룹핑
  const positiveByCategory = keywords.positive.reduce((acc, kw) => {
    if (!acc[kw.category]) acc[kw.category] = [];
    acc[kw.category].push(kw.keyword);
    return acc;
  }, {} as Record<string, string[]>);

  Object.entries(positiveByCategory).forEach(([cat, kws]) => {
    report += `- **${cat}**: ${kws.slice(0, 3).join(', ')}\n`;
  });

  report += `
---

## 4. 부정 키워드 분석 (개선 기회)

| 키워드 | 언급 수 | 비율 | 카테고리 |
|--------|---------|------|----------|
`;

  keywords.negative.forEach(kw => {
    report += `| ${kw.keyword} | ${kw.count.toLocaleString()}건 | ${kw.percentage}% | ${kw.category} |\n`;
  });

  report += `
**주의**: "자극", "트러블" 등은 "자극 없음", "트러블 안 남" 등 긍정적 맥락 제외 후 카운트

---

## 5. 개선 기회 매트릭스 (신제품 개발 인사이트)

| 불만 유형 | 빈도 | 신제품 기회 | 제안 액션 |
|-----------|------|-------------|-----------|
`;

  improvements.forEach(imp => {
    report += `| ${imp.issue} | ${imp.frequency}건 | ${imp.opportunity} | ${imp.suggestedAction} |\n`;
  });

  report += `
### 불만 유형별 실제 리뷰 샘플
`;

  improvements.slice(0, 5).forEach(imp => {
    if (imp.sampleReviews.length > 0) {
      report += `\n#### ${imp.issue}\n`;
      imp.sampleReviews.forEach(sample => {
        report += `> "${sample.substring(0, 100)}${sample.length > 100 ? '...' : ''}"\n\n`;
      });
    }
  });

  report += `
---

## 6. 고객 언어 추출 (마케팅 카피 활용)

실제 리뷰에서 추출한 긍정적 표현:

`;

  highlightQuotes.forEach((quote, i) => {
    report += `${i + 1}. > "${quote}"\n\n`;
  });

  report += `
---

## 7. 저평점 리뷰 분석 (개선 필수 항목)

### 4점 이하 리뷰 샘플
`;

  lowRatingReviews.slice(0, 10).forEach((r, i) => {
    report += `
#### [${i + 1}] ${r.rating}점 - ${r.option || '옵션 미지정'}
> ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}

`;
  });

  report += `
---

## 8. SWOT 분석

### Strengths (강점)
`;

  // 상위 긍정 키워드 기반 강점
  keywords.positive.slice(0, 5).forEach(kw => {
    report += `- **${kw.keyword}** (${kw.percentage}% 언급)\n`;
  });

  report += `
### Weaknesses (약점)
`;

  // 상위 부정 키워드 기반 약점
  keywords.negative.slice(0, 5).forEach(kw => {
    report += `- **${kw.keyword}** (${kw.percentage}% 언급)\n`;
  });

  report += `
### Opportunities (기회)
`;

  improvements.slice(0, 3).forEach(imp => {
    report += `- ${imp.opportunity}\n`;
  });

  report += `
### Threats (위협)
- 경쟁 제품과의 직접 비교 리뷰 존재
- 과대광고 인식 가능성
- 높은 기대치 대비 효과 체감 차이

---

## 9. 신제품 개발 제안

### 9.1 추천 신제품 컨셉

**타겟**: ${findTopSkinType(skinTypeDistribution)} 피부 고객

**USP 제안**:
`;

  // 강점 기반 USP
  const topStrength = keywords.positive[0];
  const topWeakness = keywords.negative[0];

  report += `- 기존 강점 "${topStrength?.keyword || '촉촉함'}" 유지\n`;
  report += `- "${topWeakness?.keyword || '효과'}" 불만 해소를 위한 개선\n`;

  report += `
### 9.2 개선 우선순위

| 우선순위 | 항목 | 이유 |
|----------|------|------|
`;

  improvements.slice(0, 3).forEach((imp, i) => {
    report += `| ${i + 1} | ${imp.issue} | ${imp.frequency}건 언급 |\n`;
  });

  report += `
---

## 10. 액션 아이템

### 즉시 실행 (Quick Win)
`;

  improvements.slice(0, 2).forEach(imp => {
    report += `- [ ] ${imp.suggestedAction}\n`;
  });

  report += `
### 중기 과제 (1-3개월)
- [ ] 저평점 리뷰 응대 및 개선 피드백 수집
- [ ] 옵션별 만족도 차이 원인 분석
- [ ] 마케팅 메시지 리뷰 언어 기반 최적화

### 장기 과제 (3개월+)
- [ ] 신제품 R&D (개선 기회 기반)
- [ ] 임상 데이터 확보
- [ ] 프리미엄 라인 출시 검토

---

## 11. 요약

### 핵심 수치
- **평균 평점**: ${averageRating}/5.0
- **총 리뷰**: ${totalReviews.toLocaleString()}개
- **재구매율**: ${stats.repurchaseRate}%
- **핵심 강점**: ${keywords.positive.slice(0, 3).map(k => k.keyword).join(', ')}
- **주요 개선점**: ${keywords.negative.slice(0, 3).map(k => k.keyword).join(', ')}

### 한 줄 요약
> ${generateOneLiner(crawlResult, analysis)}

---

*Generated by oliveyoung-analyzer*
*Data source: 올리브영 (${totalReviews.toLocaleString()} reviews analyzed)*
`;

  // 파일 저장
  const safeProductName = productName.replace(/[/\\?%*:|"<>]/g, '').substring(0, 50);
  const filename = `${safeProductName}-review-analysis-${date}.md`;
  const filepath = path.join(outputDir, filename);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(filepath, report, 'utf-8');
  console.log(`📝 리포트 저장: ${filepath}`);

  return filepath;
}

/**
 * 가장 많은 피부타입 찾기
 */
function findTopSkinType(distribution: Record<string, number>): string {
  const sorted = Object.entries(distribution)
    .filter(([key]) => key !== '미입력')
    .sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? sorted[0][0] : '모든';
}

/**
 * 한 줄 요약 생성
 */
function generateOneLiner(crawlResult: CrawlResult, analysis: BasicAnalysis): string {
  const { averageRating } = crawlResult;
  const topStrength = analysis.keywords.positive[0]?.keyword || '만족도';
  const topWeakness = analysis.keywords.negative[0]?.keyword || '개선점';

  if (averageRating >= 4.5) {
    return `높은 만족도(${averageRating}점)의 "${topStrength}" 강점 제품, "${topWeakness}" 개선 시 시장 확대 가능`;
  } else if (averageRating >= 4.0) {
    return `양호한 만족도(${averageRating}점), "${topStrength}" 유지하며 "${topWeakness}" 집중 개선 필요`;
  } else {
    return `개선 필요(${averageRating}점), "${topWeakness}" 해결이 최우선 과제`;
  }
}
