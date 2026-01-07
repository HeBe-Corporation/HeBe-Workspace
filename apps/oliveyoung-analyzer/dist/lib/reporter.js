"use strict";
/**
 * 마크다운 리포트 생성기
 * 한국어(영어) 형식의 상세 분석 보고서
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizedPath = createOrganizedPath;
exports.generateMarkdownReport = generateMarkdownReport;
exports.saveResults = saveResults;
const fs = require('fs');
const path = require('path');
const keywords_1 = require("./keywords");
// 제품 카테고리 매핑 (키워드 → 영문 카테고리)
const CATEGORY_MAP = {
    // 마스크팩
    '마스크': 'Mask Pack', '팩': 'Mask Pack', '시트': 'Sheet Mask', '패드': 'Toner Pad',
    '버블팩': 'Bubble Mask', '필오프': 'Peel-off Mask', '워시오프': 'Wash-off Mask',
    '슬리핑팩': 'Sleeping Pack', '슬리핑': 'Sleeping Pack', '나이트': 'Night Mask',
    // 스킨케어
    '세럼': 'Serum', '에센스': 'Essence', '앰플': 'Ampoule', '토너': 'Toner',
    '스킨': 'Toner', '로션': 'Lotion', '에멀전': 'Emulsion', '크림': 'Cream',
    '모이스처': 'Moisturizer', '수분': 'Hydrating', '보습': 'Moisturizing',
    // 클렌징
    '클렌징': 'Cleansing', '폼': 'Foam Cleanser', '오일': 'Cleansing Oil',
    '워터': 'Cleansing Water', '밀크': 'Cleansing Milk', '젤': 'Cleansing Gel',
    // 선케어
    '선크림': 'Sunscreen', '선': 'Sun Care', 'SPF': 'Sunscreen', '자외선': 'UV Protection',
    // 메이크업
    '파운데이션': 'Foundation', '쿠션': 'Cushion', '프라이머': 'Primer',
    '컨실러': 'Concealer', '파우더': 'Powder', '블러셔': 'Blusher', '립': 'Lip',
    // 아이케어
    '아이크림': 'Eye Cream', '아이': 'Eye Care', '눈가': 'Eye Care',
    // 기타
    '미스트': 'Mist', '페이스오일': 'Face Oil', '밤': 'Balm',
    '비타민': 'Vitamin', '레티놀': 'Retinol', '콜라겐': 'Collagen', '나노샷': 'Nano Shot'
};
// 브랜드 매핑 (한글 → 영문)
const BRAND_MAP = {
    '가쉬': 'Gash', '메디앤서': 'Mediancer', '달바': 'Dalba', '토리든': 'Torriden',
    '라운드랩': 'Round Lab', '아누아': 'Anua', '코스알엑스': 'COSRX', '이니스프리': 'Innisfree',
    '에뛰드': 'Etude', '미샤': 'Missha', '더페이스샵': 'The Face Shop', '네이처리퍼블릭': 'Nature Republic',
    '스킨푸드': 'Skinfood', '아이소이': 'Isoi', '닥터지': 'Dr.G', '센텔리안24': 'Centellian24',
    '웰라쥬': 'Wellage', '메디힐': 'Mediheal', '제이준': 'Jayjun', '파파레시피': 'Papa Recipe',
    '마녀공장': 'Manyo Factory', '아이오페': 'IOPE', '헤라': 'HERA', '설화수': 'Sulwhasoo',
    '비플레인': 'Beplain', '넘버즈인': 'Numbuzin', '아비브': 'Abib', '메이크프렘': 'Make Prem',
    '닥터자르트': 'Dr.Jart+', '피지오겔': 'Physiogel', '세타필': 'Cetaphil', '라로슈포제': 'La Roche-Posay',
    '시드물': 'Sidmool', '클리오': 'CLIO', '페리페라': 'Peripera', '롬앤': 'Rom&nd'
};
// 상품명에서 카테고리 추출
function extractCategory(productName) {
    const lowerName = productName.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
        if (productName.includes(keyword) || lowerName.includes(keyword.toLowerCase())) {
            return category;
        }
    }
    return 'Skincare'; // 기본값
}
// 상품명에서 브랜드 추출
function extractBrand(productName) {
    for (const [korean, english] of Object.entries(BRAND_MAP)) {
        if (productName.includes(korean)) {
            return english;
        }
    }
    // 브랜드를 찾지 못한 경우 상품명 첫 단어 사용
    const firstWord = productName.split(/[\s\[\]\/]/)[0].replace(/[^a-zA-Z가-힣]/g, '');
    if (firstWord && firstWord.length > 1) {
        return firstWord.substring(0, 15);
    }
    return 'Unknown';
}
// 날짜를 영문 형식으로 변환 (2nd.Jan.2026)
function formatDateEnglish(date) {
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    // 서수 접미사
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31)
        suffix = 'st';
    else if (day === 2 || day === 22)
        suffix = 'nd';
    else if (day === 3 || day === 23)
        suffix = 'rd';
    return `${day}${suffix}.${month}.${year}`;
}
// 체계적 폴더 경로 생성
function createOrganizedPath(productName, baseDir) {
    const category = extractCategory(productName);
    const brand = extractBrand(productName);
    const dateStr = formatDateEnglish(new Date());
    // 폴더 구조: 카테고리/브랜드/날짜
    const folderName = `${category} _ ${brand} _ ${dateStr}`;
    const fullPath = path.join(baseDir, category, brand, folderName);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
}
// 마크다운 리포트 생성
function generateMarkdownReport(options) {
    const { crawlResult, analysis, improvements, outputDir } = options;
    const { productName, goodsNumber, productUrl, totalReviews, averageRating } = crawlResult;
    const { stats, optionAnalysis, skinTypeDistribution, keywords, lowRatingReviews, highlightQuotes } = analysis;
    const date = new Date().toISOString().split('T')[0];
    let report = `# ${productName}
## 리뷰 분석 상세 보고서 (Review Analysis Report)

> **분석일(Date)**: ${date}
> **데이터 출처(Source)**: 올리브영(Olive Young)
> **분석 리뷰 수(Total Reviews)**: ${totalReviews.toLocaleString()}개

---

## 1. 상품 개요 (Product Overview)

| 항목(Item) | 내용(Content) |
|------------|---------------|
| 상품명(Product Name) | ${productName} |
| 상품번호(Product No.) | ${goodsNumber} |
| 상품 URL | [올리브영 바로가기](${productUrl}) |
| 총 리뷰 수(Total Reviews) | ${totalReviews.toLocaleString()}개 |
| 평균 평점(Avg. Rating) | ⭐ ${averageRating} / 5.0 |

---

## 2. 핵심 지표 (Key Metrics)

| 지표(Metric) | 수치(Value) | 설명(Description) |
|--------------|-------------|-------------------|
| 평균 평점(Avg. Rating) | ⭐ ${stats.averageRating.toFixed(1)} | 전체 리뷰 평균 |
| 재구매율(Repurchase Rate) | ${stats.repurchaseRate}% | ${stats.repurchaseCount.toLocaleString()}건 언급 |
| 사진 리뷰율(Photo Review Rate) | ${stats.photoRate}% | ${stats.photoCount.toLocaleString()}건 |
| 5점 비율(5-Star Rate) | ${totalReviews > 0 ? ((stats.ratingDistribution[5] || 0) / totalReviews * 100).toFixed(1) : 0}% | 최고 만족 |
| 1-2점 비율(Low Rating Rate) | ${totalReviews > 0 ? (((stats.ratingDistribution[1] || 0) + (stats.ratingDistribution[2] || 0)) / totalReviews * 100).toFixed(1) : 0}% | 불만족 고객 |

---

## 3. 평점 분포 (Rating Distribution)

| 별점(Rating) | 개수(Count) | 비율(%) | 그래프(Graph) |
|--------------|-------------|---------|---------------|
`;
    for (let i = 5; i >= 1; i--) {
        const count = stats.ratingDistribution[i] || 0;
        const pct = totalReviews > 0 ? ((count / totalReviews) * 100) : 0;
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        report += `| ${i}점 ⭐ | ${count.toLocaleString()}개 | ${pct.toFixed(1)}% | ${bar} |\n`;
    }
    report += `
---

## 4. 긍정 키워드 분석 (Positive Keywords Analysis)

> 고객들이 가장 많이 언급한 긍정적 표현입니다.

| 순위 | 키워드(Keyword) | 언급 수(Count) | 비율(%) | 카테고리(Category) |
|------|-----------------|----------------|---------|---------------------|
`;
    keywords.positive.forEach((kw, i) => {
        report += `| ${i + 1} | **${(0, keywords_1.formatKeyword)(kw.keyword)}** | ${kw.count.toLocaleString()}건 | ${kw.percentage}% | ${(0, keywords_1.formatCategory)(kw.category)} |\n`;
    });
    report += `
### 긍정 키워드 요약 (Positive Summary)
`;
    // 카테고리별 그룹핑
    const positiveByCategory = {};
    keywords.positive.forEach(kw => {
        if (!positiveByCategory[kw.category])
            positiveByCategory[kw.category] = [];
        positiveByCategory[kw.category].push((0, keywords_1.formatKeyword)(kw.keyword));
    });
    Object.entries(positiveByCategory).forEach(([cat, kws]) => {
        report += `- **${(0, keywords_1.formatCategory)(cat)}**: ${kws.slice(0, 4).join(', ')}\n`;
    });
    report += `
---

## 5. 부정 키워드 분석 (Negative Keywords Analysis)

> 개선이 필요한 부분을 파악할 수 있는 부정적 표현입니다.
> ※ "자극 없음", "트러블 안 남" 등 긍정적 맥락은 제외

| 순위 | 키워드(Keyword) | 언급 수(Count) | 비율(%) | 카테고리(Category) |
|------|-----------------|----------------|---------|---------------------|
`;
    keywords.negative.forEach((kw, i) => {
        report += `| ${i + 1} | **${(0, keywords_1.formatKeyword)(kw.keyword)}** | ${kw.count.toLocaleString()}건 | ${kw.percentage}% | ${(0, keywords_1.formatCategory)(kw.category)} |\n`;
    });
    report += `
---

## 6. 옵션별 분석 (Option Analysis)

| 옵션명(Option) | 리뷰 수(Reviews) | 평균 평점(Avg.) | 점유율(Share) |
|----------------|------------------|-----------------|---------------|
`;
    optionAnalysis.slice(0, 10).forEach(opt => {
        const ratingEmoji = opt.avgRating >= 4.5 ? '🟢' : opt.avgRating >= 4.0 ? '🟡' : '🔴';
        report += `| ${opt.name} | ${opt.count.toLocaleString()}개 | ${ratingEmoji} ${opt.avgRating} | ${opt.percentage}% |\n`;
    });
    report += `
---

## 7. 개선 기회 매트릭스 (Improvement Opportunities)

| 불만 유형(Issue) | 빈도(Freq.) | 신제품 기회(Opportunity) | 제안 액션(Action) |
|------------------|-------------|--------------------------|-------------------|
`;
    improvements.forEach(imp => {
        report += `| ${(0, keywords_1.formatCategory)(imp.issue)} | ${imp.frequency}건 | ${imp.opportunity} | ${imp.suggestedAction} |\n`;
    });
    if (improvements.length > 0 && improvements[0].sampleReviews.length > 0) {
        report += `
### 불만 리뷰 샘플 (Complaint Samples)
`;
        improvements.slice(0, 3).forEach(imp => {
            if (imp.sampleReviews.length > 0) {
                report += `\n**${(0, keywords_1.formatCategory)(imp.issue)}**\n`;
                imp.sampleReviews.slice(0, 2).forEach(sample => {
                    report += `> "${sample.substring(0, 100)}${sample.length > 100 ? '...' : ''}"\n\n`;
                });
            }
        });
    }
    report += `
---

## 8. 고객 언어 추출 (Customer Voice - Marketing Copy)

> 실제 리뷰에서 추출한 긍정적 표현 - 마케팅 카피로 활용 가능

`;
    highlightQuotes.forEach((quote, i) => {
        report += `${i + 1}. > "${quote}"\n\n`;
    });
    report += `
---

## 9. 저평점 리뷰 상세 (Low-Rating Reviews Detail)

> 1-3점 리뷰를 분석하여 개선점을 파악합니다.

`;
    lowRatingReviews.slice(0, 10).forEach((r, i) => {
        const ratingEmoji = r.rating === 1 ? '😡' : r.rating === 2 ? '😞' : '😐';
        report += `### [${i + 1}] ${ratingEmoji} ${r.rating}점 - ${r.option || '옵션 미지정'}
> ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}

`;
    });
    report += `
---

## 10. 종합 요약 (Executive Summary)

### 핵심 수치 (Key Numbers)
- **평균 평점(Avg. Rating)**: ⭐ ${averageRating}/5.0
- **총 리뷰(Total Reviews)**: ${totalReviews.toLocaleString()}개
- **재구매율(Repurchase Rate)**: ${stats.repurchaseRate}%

### 강점 (Strengths)
${keywords.positive.slice(0, 5).map(k => `- ${(0, keywords_1.formatKeyword)(k.keyword)} (${k.percentage}%)`).join('\n')}

### 개선점 (Areas for Improvement)
${keywords.negative.slice(0, 5).map(k => `- ${(0, keywords_1.formatKeyword)(k.keyword)} (${k.percentage}%)`).join('\n')}

### 한 줄 요약 (One-Line Summary)
> ${generateOneLiner(averageRating, keywords)}

---

*Generated by 올리브영 리뷰 분석기 (Olive Young Review Analyzer)*
*${new Date().toLocaleString('ko-KR')}*
`;
    // 파일 저장 - 조직화된 폴더 사용 (outputDir이 이미 조직화된 경로)
    const safeProductName = productName.replace(/[/\\?%*:|"<>\[\]]/g, '').substring(0, 40);
    const filename = `[분석보고서] ${safeProductName} (${date}).md`;
    const filepath = path.join(outputDir, filename);
    // outputDir이 이미 존재하지 않으면 생성
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(filepath, report, 'utf-8');
    return filepath;
}
// 한 줄 요약 생성
function generateOneLiner(avgRating, keywords) {
    const topStrength = keywords.positive[0] ? (0, keywords_1.formatKeyword)(keywords.positive[0].keyword) : '만족도';
    const topWeakness = keywords.negative[0] ? (0, keywords_1.formatKeyword)(keywords.negative[0].keyword) : '개선점';
    if (avgRating >= 4.5) {
        return `높은 만족도(${avgRating}점)의 "${topStrength}" 강점 제품. "${topWeakness}" 개선 시 시장 확대 가능.`;
    }
    else if (avgRating >= 4.0) {
        return `양호한 만족도(${avgRating}점). "${topStrength}" 유지하며 "${topWeakness}" 집중 개선 필요.`;
    }
    else {
        return `개선 필요(${avgRating}점). "${topWeakness}" 해결이 최우선 과제.`;
    }
}
// 결과 저장 (JSON, CSV) - 체계적 폴더 구조
function saveResults(crawlResult, baseDir) {
    // 체계적 폴더 경로 생성: Category/Brand/Category _ Brand _ Date/
    const organizedDir = createOrganizedPath(crawlResult.productName, baseDir);
    const date = new Date().toISOString().split('T')[0];
    const safeProductName = crawlResult.productName.replace(/[/\\?%*:|"<>\[\]]/g, '').substring(0, 40);
    // JSON - 조직화된 폴더에 저장
    const jsonPath = path.join(organizedDir, `[데이터] ${safeProductName} (${date}).json`);
    fs.writeFileSync(jsonPath, JSON.stringify(crawlResult, null, 2), 'utf-8');
    // CSV - 조직화된 폴더에 저장
    const csvPath = path.join(organizedDir, `[리뷰목록] ${safeProductName} (${date}).csv`);
    const csvHeader = 'reviewId,rating,date,option,skinType,helpfulCount,hasPhoto,isRepurchase,content\n';
    const csvRows = crawlResult.reviews.map(r => `${r.reviewId},${r.rating},"${r.date}","${r.option || ''}","${r.skinType || ''}",${r.helpfulCount},${r.hasPhoto},${r.isRepurchase},"${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`).join('\n');
    fs.writeFileSync(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf-8');
    return { jsonPath, csvPath, organizedDir };
}
//# sourceMappingURL=reporter.js.map