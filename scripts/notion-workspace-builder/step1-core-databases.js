// Step 1: Core Databases (Brands, Countries, KOL/Influencer)
const config = require('./config');
const api = require('./notion-api');
const { PropertyBuilder: P } = api;

// 생성된 DB ID들을 저장
const createdIds = {};

async function createBrandsDatabase(parentId) {
  console.log('\n📦 Brands Database 생성 중...');

  const properties = {
    'Brand Name': P.title(),
    'Category': P.select([
      { name: 'Visual/Make-up', color: 'pink' },
      { name: 'Functional/Care', color: 'green' }
    ]),
    'Countries Active': P.multiSelect([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Registration Status': P.select([
      { name: 'Pending', color: 'yellow' },
      { name: 'In Progress', color: 'blue' },
      { name: 'Completed', color: 'green' }
    ]),
    'HQ Marketing Budget': P.number('dollar'),
    'HeBe Self-Investment': P.number('dollar'),
    'Status': P.select([
      { name: 'Active', color: 'green' },
      { name: 'Launching', color: 'blue' },
      { name: 'Planning', color: 'yellow' }
    ]),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📦 Brands', '📦', properties);
  createdIds.brandsDb = db.id;

  // 브랜드 데이터 입력
  console.log('  브랜드 데이터 입력 중...');
  await api.delay(300);

  for (const brand of config.brands) {
    const itemProps = {
      'Brand Name': { title: [{ text: { content: brand.name } }] },
      'Category': { select: { name: brand.category } },
      'Countries Active': { multi_select: [
        { name: 'Korea' },
        { name: 'Vietnam' },
        { name: 'Cambodia' }
      ]},
      'Registration Status': { select: { name: 'Completed' } },
      'Status': { select: { name: 'Active' } }
    };
    await api.createDatabaseItem(db.id, itemProps);
    console.log(`    ✓ ${brand.name}`);
    await api.delay(200);
  }

  return db;
}

async function createCountriesDatabase(parentId, brandsDbId) {
  console.log('\n🌍 Countries Database 생성 중...');

  const properties = {
    'Country Name': P.title(),
    'Flag': P.richText(),
    'Team Size': P.number('number'),
    'Primary Language': P.select([
      { name: 'Korean', color: 'blue' },
      { name: 'Vietnamese', color: 'orange' },
      { name: 'Khmer', color: 'purple' },
      { name: 'English', color: 'gray' }
    ]),
    'Active Brands': P.relation(brandsDbId),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🌍 Countries', '🌍', properties);
  createdIds.countriesDb = db.id;

  // 국가 데이터 입력
  console.log('  국가 데이터 입력 중...');
  await api.delay(300);

  for (const country of config.countries) {
    const itemProps = {
      'Country Name': { title: [{ text: { content: country.name } }] },
      'Flag': { rich_text: [{ text: { content: country.flag } }] },
      'Team Size': { number: country.teamSize },
      'Primary Language': { select: { name: country.language } }
    };
    await api.createDatabaseItem(db.id, itemProps);
    console.log(`    ✓ ${country.flag} ${country.name}`);
    await api.delay(200);
  }

  return db;
}

async function createKOLDatabase(parentId) {
  console.log('\n👤 KOL/Influencer Database 생성 중...');

  const properties = {
    'KOL Name': P.title(),
    'Platform': P.multiSelect([
      { name: 'TikTok', color: 'default' },
      { name: 'Instagram', color: 'pink' },
      { name: 'YouTube', color: 'red' },
      { name: 'Facebook', color: 'blue' }
    ]),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Follower Count': P.number('number'),
    'Engagement Rate': P.number('percent'),
    'Content Style': P.select([
      { name: 'Tutorial', color: 'blue' },
      { name: 'GRWM', color: 'pink' },
      { name: 'Review', color: 'green' },
      { name: 'Unboxing', color: 'yellow' },
      { name: 'Lifestyle', color: 'purple' }
    ]),
    'Tier': P.select([
      { name: 'Mega 1M+', color: 'red' },
      { name: 'Macro 100K-1M', color: 'orange' },
      { name: 'Micro 10K-100K', color: 'yellow' },
      { name: 'Nano 1K-10K', color: 'green' }
    ]),
    'Booking Fee Range': P.select([
      { name: 'Under $100', color: 'green' },
      { name: '$100-500', color: 'yellow' },
      { name: '$500-1000', color: 'orange' },
      { name: '$1000+', color: 'red' }
    ]),
    'Skin Type/Concerns': P.multiSelect([
      { name: 'Oily', color: 'yellow' },
      { name: 'Dry', color: 'orange' },
      { name: 'Combination', color: 'green' },
      { name: 'Sensitive', color: 'pink' },
      { name: 'Acne-prone', color: 'red' },
      { name: 'Anti-aging', color: 'purple' },
      { name: 'Brightening', color: 'blue' }
    ]),
    'Contact Email': P.email(),
    'Contact Phone': P.phoneNumber(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '👤 KOL/Influencer', '👤', properties);
  createdIds.kolDb = db.id;

  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 1: Core Databases');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  console.log(`\n메인 페이지: ${parentId}`);

  try {
    // 1. Brands Database
    const brandsDb = await createBrandsDatabase(parentId);
    await api.delay(500);

    // 2. Countries Database (with relation to Brands)
    const countriesDb = await createCountriesDatabase(parentId, brandsDb.id);
    await api.delay(500);

    // 3. KOL/Influencer Database
    const kolDb = await createKOLDatabase(parentId);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 1 완료!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n생성된 Database IDs:');
    console.log(`  Brands DB: ${createdIds.brandsDb}`);
    console.log(`  Countries DB: ${createdIds.countriesDb}`);
    console.log(`  KOL DB: ${createdIds.kolDb}`);

    // ID들을 JSON 파일로 저장
    const fs = require('fs');
    const idsPath = __dirname + '/created-ids.json';

    // 기존 파일 읽기
    let existingIds = {};
    try {
      existingIds = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
    } catch (e) {}

    // 업데이트
    existingIds = { ...existingIds, ...createdIds };
    fs.writeFileSync(idsPath, JSON.stringify(existingIds, null, 2));
    console.log(`\nID 저장됨: ${idsPath}`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  }
}

// 직접 실행시
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, createdIds };
