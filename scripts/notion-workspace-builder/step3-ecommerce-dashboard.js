// Step 3: Ecommerce Dashboard (Pulse)
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

async function createPulsePage(parentId) {
  console.log('\n📊 Pulse 메인 페이지 생성 중...');

  const page = await api.createPage(parentId, 'Pulse - Ecommerce Hub', '📊');

  await api.appendBlocks(page.id, [
    api.calloutBlock('Ecommerce Team의 퍼포먼스를 실시간으로 추적하세요', '📊'),
    api.dividerBlock(),
    api.heading2Block('📈 Quick Stats'),
    api.paragraphBlock('각 섹션에서 채널별 성과를 확인할 수 있습니다.')
  ]);

  return page;
}

async function createAffiliateDB(parentId, brandsDbId) {
  console.log('\n🤝 Affiliate Partners Database 생성 중...');

  const properties = {
    'Partner Name': P.title(),
    'Platform': P.select([
      { name: 'Shopee Affiliate', color: 'orange' },
      { name: 'TikTok Affiliate', color: 'default' },
      { name: 'Lazada Affiliate', color: 'purple' }
    ]),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Brand Assignment': P.relation(brandsDbId),
    'Commission Rate': P.number('percent'),
    'Monthly GMV': P.number('dollar'),
    'Monthly Commission Paid': P.number('dollar'),
    'Status': P.select([
      { name: 'Active', color: 'green' },
      { name: 'Paused', color: 'yellow' },
      { name: 'Terminated', color: 'red' }
    ]),
    'Contract Start Date': P.date(),
    'Contract End Date': P.date(),
    'Top Performing SKUs': P.richText(),
    'Contact': P.email(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🤝 Affiliate Partners', '🤝', properties);
  return db;
}

async function createLivestreamDB(parentId, brandsDbId, kolDbId) {
  console.log('\n📺 Livestream Database 생성 중...');

  const properties = {
    'Stream Title': P.title(),
    'Host': P.relation(kolDbId),
    'Platform': P.select([
      { name: 'Shopee Live', color: 'orange' },
      { name: 'TikTok Live', color: 'default' },
      { name: 'Facebook Live', color: 'blue' }
    ]),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Stream Date': P.date(),
    'Duration (hrs)': P.number('number'),
    'Viewers Peak': P.number('number'),
    'Total Views': P.number('number'),
    'Orders During Stream': P.number('number'),
    'GMV Generated': P.number('dollar'),
    'Commission/Fee Paid': P.number('dollar'),
    'ROI': P.formula('if(prop("Commission/Fee Paid") > 0, prop("GMV Generated") / prop("Commission/Fee Paid"), 0)'),
    'Stream Recording Link': P.url(),
    'Status': P.select([
      { name: 'Scheduled', color: 'blue' },
      { name: 'Live', color: 'red' },
      { name: 'Completed', color: 'green' },
      { name: 'Cancelled', color: 'gray' }
    ]),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📺 Livestream Commerce', '📺', properties);
  return db;
}

async function createPaidAdsDB(parentId, brandsDbId) {
  console.log('\n📈 Paid Ads Campaign Database 생성 중...');

  const properties = {
    'Campaign Name': P.title(),
    'Platform': P.select([
      { name: 'Meta Ads', color: 'blue' },
      { name: 'TikTok Ads', color: 'default' },
      { name: 'Google Ads', color: 'green' },
      { name: 'Shopee Ads', color: 'orange' }
    ]),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Campaign Type': P.select([
      { name: 'Awareness', color: 'blue' },
      { name: 'Traffic', color: 'yellow' },
      { name: 'Conversion', color: 'green' },
      { name: 'Retargeting', color: 'purple' }
    ]),
    'Budget Source': P.select([
      { name: 'HQ Support', color: 'blue' },
      { name: 'HeBe Self-Investment', color: 'green' }
    ]),
    'Daily Budget': P.number('dollar'),
    'Total Spend': P.number('dollar'),
    'Impressions': P.number('number'),
    'Clicks': P.number('number'),
    'CTR': P.formula('if(prop("Impressions") > 0, prop("Clicks") / prop("Impressions") * 100, 0)'),
    'Conversions': P.number('number'),
    'Revenue': P.number('dollar'),
    'ROAS': P.formula('if(prop("Total Spend") > 0, prop("Revenue") / prop("Total Spend"), 0)'),
    'CPC': P.formula('if(prop("Clicks") > 0, prop("Total Spend") / prop("Clicks"), 0)'),
    'CPA': P.formula('if(prop("Conversions") > 0, prop("Total Spend") / prop("Conversions"), 0)'),
    'Start Date': P.date(),
    'End Date': P.date(),
    'Creative Assets': P.files(),
    'Decision Reason': P.richText(),
    'Learnings': P.richText(),
    'Status': P.select([
      { name: 'Draft', color: 'gray' },
      { name: 'Active', color: 'green' },
      { name: 'Paused', color: 'yellow' },
      { name: 'Completed', color: 'blue' }
    ])
  };

  const db = await api.createDatabase(parentId, '📈 Paid Ads Campaigns', '📈', properties);
  return db;
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
    // GMV by Channel
    'Shopee GMV': P.number('dollar'),
    'TikTok Shop GMV': P.number('dollar'),
    'Lazada GMV': P.number('dollar'),
    'Total GMV': P.number('dollar'),
    // Ad Spend
    'Total Ad Spend': P.number('dollar'),
    'Blended ROAS': P.number('number'),
    // KPI
    'Orders Count': P.number('number'),
    'AOV': P.number('dollar'),
    'New Customers': P.number('number'),
    'Returning Customers': P.number('number'),
    // Notes
    'Key Wins': P.richText(),
    'Challenges': P.richText(),
    'Next Month Focus': P.richText()
  };

  const db = await api.createDatabase(parentId, '🎯 Performance Hub', '🎯', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 3: Ecommerce Dashboard');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  const ids = loadCreatedIds();

  if (!ids.brandsDb || !ids.kolDb) {
    console.error('❌ Step 1을 먼저 실행해주세요');
    process.exit(1);
  }

  console.log(`\nBrands DB: ${ids.brandsDb}`);
  console.log(`KOL DB: ${ids.kolDb}`);

  try {
    // 1. Pulse 메인 페이지
    const pulse = await createPulsePage(parentId);
    await api.delay(500);

    // 2. Affiliate Program 섹션
    await api.appendBlocks(pulse.id, [
      api.dividerBlock(),
      api.heading1Block('🤝 Affiliate Program')
    ]);
    await api.delay(300);

    const affiliateDb = await createAffiliateDB(pulse.id, ids.brandsDb);
    await api.delay(500);

    // 3. Livestream Commerce 섹션
    await api.appendBlocks(pulse.id, [
      api.dividerBlock(),
      api.heading1Block('📺 Livestream Commerce')
    ]);
    await api.delay(300);

    const livestreamDb = await createLivestreamDB(pulse.id, ids.brandsDb, ids.kolDb);
    await api.delay(500);

    // 4. Paid Ads Central 섹션
    await api.appendBlocks(pulse.id, [
      api.dividerBlock(),
      api.heading1Block('📈 Paid Ads Central')
    ]);
    await api.delay(300);

    const paidAdsDb = await createPaidAdsDB(pulse.id, ids.brandsDb);
    await api.delay(500);

    // 5. Performance Hub 섹션
    await api.appendBlocks(pulse.id, [
      api.dividerBlock(),
      api.heading1Block('🎯 Performance Hub')
    ]);
    await api.delay(300);

    const performanceDb = await createPerformanceHubDB(pulse.id, ids.brandsDb);

    // ID 저장
    const newIds = {
      pulsePage: pulse.id,
      affiliateDb: affiliateDb.id,
      livestreamDb: livestreamDb.id,
      paidAdsDb: paidAdsDb.id,
      performanceHubDb: performanceDb.id
    };
    saveCreatedIds(newIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 3 완료! Pulse Dashboard 생성됨');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n생성된 IDs:');
    Object.entries(newIds).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
