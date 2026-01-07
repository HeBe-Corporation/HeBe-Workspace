/**
 * 올리브영 리뷰 분석 스크립트
 */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('output/oliveyoung-A000000235842-2026-01-02T04-13-30.json', 'utf8'));

console.log('=== 기본 통계 ===');
console.log('총 리뷰:', data.reviews.length);
console.log('평균 평점:', data.averageRating);
console.log('평점 분포:', JSON.stringify(data.ratingDistribution));

// 옵션별 분포
const optionCount = {};
const optionRatings = {};
data.reviews.forEach(r => {
  const opt = r.option || '미지정';
  optionCount[opt] = (optionCount[opt] || 0) + 1;
  if (!optionRatings[opt]) optionRatings[opt] = [];
  optionRatings[opt].push(r.rating);
});

console.log('\n=== 옵션별 분포 ===');
Object.keys(optionCount).sort((a,b) => optionCount[b] - optionCount[a]).forEach(opt => {
  const avg = (optionRatings[opt].reduce((a,b)=>a+b,0) / optionRatings[opt].length).toFixed(2);
  console.log(opt + ':', optionCount[opt] + '개, 평균 ' + avg + '점');
});

// 피부타입별 분포
const skinTypes = {};
data.reviews.forEach(r => {
  const st = r.skinType || 'null';
  skinTypes[st] = (skinTypes[st] || 0) + 1;
});
console.log('\n=== 피부타입 분포 ===');
Object.keys(skinTypes).sort((a,b) => skinTypes[b] - skinTypes[a]).forEach(st => {
  const label = st === 'A01' ? '건성' : st === 'A02' ? '중성' : st === 'A03' ? '지성' : st === 'A04' ? '복합성' : st;
  console.log(label + ':', skinTypes[st] + '건');
});

// 재구매율
const repurchase = data.reviews.filter(r => r.isRepurchase).length;
console.log('\n=== 재구매 ===');
console.log('재구매:', repurchase + '건 (' + (repurchase/data.reviews.length*100).toFixed(1) + '%)');

// 사진 포함율
const hasPhoto = data.reviews.filter(r => r.hasPhoto).length;
console.log('사진 포함:', hasPhoto + '건 (' + (hasPhoto/data.reviews.length*100).toFixed(1) + '%)');

// 키워드 분석
console.log('\n=== 키워드 분석 ===');
const keywords = {
  '촉촉': 0, '수분': 0, '탄력': 0, '쫀쫀': 0, '광': 0,
  '진정': 0, '피부결': 0, '화장': 0, '간편': 0, '10초': 0,
  '버블': 0, '노워시': 0, '가성비': 0, '재구매': 0, '추천': 0,
  '향': 0, '냄새': 0, '자극': 0, '아쉬': 0, '별로': 0
};

data.reviews.forEach(r => {
  const content = r.content || '';
  Object.keys(keywords).forEach(kw => {
    if (content.includes(kw)) keywords[kw]++;
  });
});

Object.keys(keywords).sort((a,b) => keywords[b] - keywords[a]).forEach(kw => {
  if (keywords[kw] > 0) {
    const pct = (keywords[kw] / data.reviews.length * 100).toFixed(1);
    console.log(kw + ':', keywords[kw] + '건 (' + pct + '%)');
  }
});

// 부정 키워드 분석
console.log('\n=== 부정 키워드 ===');
const negKeywords = {
  '아쉬': 0, '별로': 0, '과대광고': 0, '효과없': 0, '실망': 0,
  '자극': 0, '트러블': 0, '냄새': 0, '비싸': 0, '가격': 0
};

data.reviews.forEach(r => {
  const content = r.content || '';
  Object.keys(negKeywords).forEach(kw => {
    if (content.includes(kw)) negKeywords[kw]++;
  });
});

Object.keys(negKeywords).sort((a,b) => negKeywords[b] - negKeywords[a]).forEach(kw => {
  if (negKeywords[kw] > 0) {
    console.log(kw + ':', negKeywords[kw] + '건');
  }
});

// 평점별 리뷰 샘플
console.log('\n=== 4점 이하 리뷰 샘플 ===');
data.reviews.filter(r => r.rating <= 4).slice(0, 10).forEach((r, i) => {
  console.log('\n[' + (i+1) + '] ' + r.rating + '점 - ' + r.option);
  console.log(r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''));
});

console.log('\n=== 분석 완료 ===');
