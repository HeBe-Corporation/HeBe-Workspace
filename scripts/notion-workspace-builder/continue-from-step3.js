// Step 3 Performance Hub 만 추가하고 Step 4-6 실행
const config = require('./config');
const api = require('./notion-api');
const { PropertyBuilder: P } = api;
const fs = require('fs');

function loadCreatedIds() {
  try {
    return JSON.parse(fs.readFileSync(__dirname + '/created-ids.json', 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveCreatedIds(ids) {
  const existing = loadCreatedIds();
  fs.writeFileSync(__dirname + '/created-ids.json', JSON.stringify({ ...existing, ...ids }, null, 2));
}

async function createPerformanceHubDB(parentId, brandsDbId) {
  console.log('\n🎯 Performance Hub Database 생성 중...');

  const properties = {
    'Report Period': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Month': P.date(),
    'Shopee GMV': P.number('dollar'),
    'TikTok Shop GMV': P.number('dollar'),
    'Lazada GMV': P.number('dollar'),
    'Total GMV': P.number('dollar'),
    'Total Ad Spend': P.number('dollar'),
    'Blended ROAS': P.number('number'),
    'Orders Count': P.number('number'),
    'AOV': P.number('dollar'),
    'New Customers': P.number('number'),
    'Returning Customers': P.number('number'),
    'Key Wins': P.richText(),
    'Challenges': P.richText(),
    'Next Month Focus': P.richText()
  };

  const db = await api.createDatabase(parentId, '🎯 Performance Hub', '🎯', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Step 3 완료 + Step 4-6 실행');
  console.log('═══════════════════════════════════════════════════════');

  const ids = loadCreatedIds();

  // Step 3 완료: Performance Hub 추가
  console.log('\n📊 Step 3 마무리: Performance Hub 추가...');
  if (ids.pulsePage && !ids.performanceHubDb) {
    await api.appendBlocks(ids.pulsePage, [
      api.dividerBlock(),
      api.heading1Block('🎯 Performance Hub')
    ]);
    await api.delay(300);

    const performanceDb = await createPerformanceHubDB(ids.pulsePage, ids.brandsDb);
    saveCreatedIds({ performanceHubDb: performanceDb.id });
    console.log('✅ Performance Hub 추가 완료!');
  } else if (ids.performanceHubDb) {
    console.log('⏭️ Performance Hub 이미 존재');
  }
  await api.delay(500);

  // Step 4: Sales Dashboard
  console.log('\n\n💰 Step 4: Sales Dashboard 실행...');
  const step4 = require('./step4-sales-dashboard');
  await step4.main();
  await api.delay(1000);

  // Step 5: Accounting Dashboard
  console.log('\n\n📒 Step 5: Accounting Dashboard 실행...');
  const step5 = require('./step5-accounting-dashboard');
  await step5.main();
  await api.delay(1000);

  // Step 6: Compliance Tracker
  console.log('\n\n📋 Step 6: Compliance Tracker 실행...');
  const step6 = require('./step6-compliance-tracker');
  await step6.main();

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   ✅ 전체 워크스페이스 구축 완료!                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // 최종 ID 목록
  const finalIds = loadCreatedIds();
  console.log('\n📝 생성된 모든 Database IDs:');
  console.log(JSON.stringify(finalIds, null, 2));
}

main().catch(console.error);
