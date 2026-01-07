// Step 2: Marketing Dashboard (LaunchPad)
const config = require('./config');
const api = require('./notion-api');
const { PropertyBuilder: P } = api;
const fs = require('fs');

// ID 로드
function loadCreatedIds() {
  try {
    return JSON.parse(fs.readFileSync(__dirname + '/created-ids.json', 'utf8'));
  } catch (e) {
    return {};
  }
}

// ID 저장
function saveCreatedIds(ids) {
  const existing = loadCreatedIds();
  fs.writeFileSync(__dirname + '/created-ids.json', JSON.stringify({ ...existing, ...ids }, null, 2));
}

async function createLaunchPadPage(parentId) {
  console.log('\n🚀 LaunchPad 메인 페이지 생성 중...');

  const page = await api.createPage(parentId, 'LaunchPad - Marketing Hub', '🚀');

  // 인트로 블록 추가
  await api.appendBlocks(page.id, [
    api.calloutBlock('Marketing Team의 모든 활동을 한 곳에서 관리하세요', '🚀'),
    api.dividerBlock(),
    api.heading2Block('📍 Quick Links'),
    api.paragraphBlock('아래 섹션에서 각 업무를 관리할 수 있습니다.')
  ]);

  return page;
}

async function createRegularSeedingDB(parentId, brandsDbId, kolDbId) {
  console.log('\n📍 Regular Seeding Database 생성 중...');

  const properties = {
    'Seeding ID': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'KOL/KOC': P.relation(kolDbId),
    'Product SKUs': P.richText(),
    'Quantity': P.number('number'),
    'Shipping Date': P.date(),
    'Delivery Status': P.select([
      { name: 'Preparing', color: 'gray' },
      { name: 'Shipped', color: 'blue' },
      { name: 'Delivered', color: 'green' },
      { name: 'Posted', color: 'purple' }
    ]),
    'Post Deadline': P.date(),
    'Content Link': P.url(),
    'Assigned To': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📦 Regular Seeding', '📦', properties);
  return db;
}

async function createUGCSeedingDB(parentId, brandsDbId) {
  console.log('\n🎬 UGC Seeding Database 생성 중...');

  const properties = {
    'Campaign Name': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'UGC Type': P.select([
      { name: 'Paid UGC', color: 'green' },
      { name: 'Free UGC', color: 'blue' },
      { name: 'Contest', color: 'purple' }
    ]),
    'Recruitment Channel': P.multiSelect([
      { name: 'TikTok', color: 'default' },
      { name: 'Meta Ads', color: 'blue' },
      { name: 'Google Form', color: 'green' },
      { name: 'Instagram', color: 'pink' }
    ]),
    'Target Submissions': P.number('number'),
    'Received Submissions': P.number('number'),
    'Selected Content': P.number('number'),
    'Google Form Link': P.url(),
    'Content Rights': P.checkbox(),
    'Budget': P.number('dollar'),
    'Cost Per Content': P.formula('if(prop("Selected Content") > 0, prop("Budget") / prop("Selected Content"), 0)'),
    'Start Date': P.date(),
    'End Date': P.date(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🎬 UGC Seeding', '🎬', properties);
  return db;
}

async function createKOLBookingDB(parentId, brandsDbId, kolDbId) {
  console.log('\n🎯 KOL Booking Pipeline 생성 중...');

  const properties = {
    'Campaign Name': P.title(),
    'Brand': P.relation(brandsDbId),
    'KOL': P.relation(kolDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Status': P.select([
      { name: '🔍 Prospecting', color: 'gray' },
      { name: '📧 Outreach Sent', color: 'blue' },
      { name: '💬 Negotiating', color: 'yellow' },
      { name: '✅ Contracted', color: 'green' },
      { name: '🎬 Content in Production', color: 'orange' },
      { name: '✨ Published', color: 'purple' },
      { name: '💰 Payment Complete', color: 'pink' }
    ]),
    'Content Type': P.select([
      { name: 'Video Review', color: 'red' },
      { name: 'Photo Post', color: 'blue' },
      { name: 'Livestream', color: 'purple' },
      { name: 'Story/Reel', color: 'pink' }
    ]),
    'Platform': P.select([
      { name: 'TikTok', color: 'default' },
      { name: 'Instagram', color: 'pink' },
      { name: 'YouTube', color: 'red' },
      { name: 'Facebook', color: 'blue' }
    ]),
    'Budget': P.number('dollar'),
    'Contracted Fee': P.number('dollar'),
    'Outreach Date': P.date(),
    'Post Deadline': P.date(),
    'Content Link': P.url(),
    'Views': P.number('number'),
    'Likes': P.number('number'),
    'Comments': P.number('number'),
    'Assigned To': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🎯 KOL Booking Pipeline', '🎯', properties);
  return db;
}

async function createOfflineEventsDB(parentId, brandsDbId) {
  console.log('\n🎪 Offline Events Database 생성 중...');

  const properties = {
    'Event Name': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Event Type': P.select([
      { name: 'Pop-up Store', color: 'pink' },
      { name: 'Beauty Class', color: 'purple' },
      { name: 'Launch Event', color: 'red' },
      { name: 'Partnership', color: 'blue' }
    ]),
    'Venue': P.richText(),
    'Date Range': P.date(),
    'Budget': P.number('dollar'),
    'Expected Visitors': P.number('number'),
    'Actual Visitors': P.number('number'),
    'Media Coverage': P.checkbox(),
    'Photo Album': P.files(),
    'Status': P.select([
      { name: 'Planning', color: 'gray' },
      { name: 'Confirmed', color: 'blue' },
      { name: 'In Progress', color: 'yellow' },
      { name: 'Completed', color: 'green' },
      { name: 'Cancelled', color: 'red' }
    ]),
    'Assigned To': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🎪 Offline Events', '🎪', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 2: Marketing Dashboard');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  const ids = loadCreatedIds();

  if (!ids.brandsDb || !ids.kolDb) {
    console.error('❌ Step 1을 먼저 실행해주세요 (Brands DB, KOL DB 필요)');
    process.exit(1);
  }

  console.log(`\nBrands DB: ${ids.brandsDb}`);
  console.log(`KOL DB: ${ids.kolDb}`);

  try {
    // 1. LaunchPad 메인 페이지 생성
    const launchPad = await createLaunchPadPage(parentId);
    await api.delay(500);

    // 2. Seeding Hub 섹션
    await api.appendBlocks(launchPad.id, [
      api.dividerBlock(),
      api.heading1Block('📍 Seeding Hub')
    ]);
    await api.delay(300);

    const regularSeedingDb = await createRegularSeedingDB(launchPad.id, ids.brandsDb, ids.kolDb);
    await api.delay(500);

    const ugcSeedingDb = await createUGCSeedingDB(launchPad.id, ids.brandsDb);
    await api.delay(500);

    // 3. KOL Booking Central 섹션
    await api.appendBlocks(launchPad.id, [
      api.dividerBlock(),
      api.heading1Block('🎬 KOL Booking Central')
    ]);
    await api.delay(300);

    const kolBookingDb = await createKOLBookingDB(launchPad.id, ids.brandsDb, ids.kolDb);
    await api.delay(500);

    // 4. Offline Events 섹션
    await api.appendBlocks(launchPad.id, [
      api.dividerBlock(),
      api.heading1Block('🎪 Offline Events')
    ]);
    await api.delay(300);

    const offlineEventsDb = await createOfflineEventsDB(launchPad.id, ids.brandsDb);

    // ID 저장
    const newIds = {
      launchPadPage: launchPad.id,
      regularSeedingDb: regularSeedingDb.id,
      ugcSeedingDb: ugcSeedingDb.id,
      kolBookingDb: kolBookingDb.id,
      offlineEventsDb: offlineEventsDb.id
    };
    saveCreatedIds(newIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 2 완료! LaunchPad Dashboard 생성됨');
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
