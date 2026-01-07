// Step 4: Sales Dashboard
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

async function createSalesDashboardPage(parentId) {
  console.log('\n💰 Sales Dashboard 메인 페이지 생성 중...');

  const page = await api.createPage(parentId, 'Sales Dashboard', '💰');

  await api.appendBlocks(page.id, [
    api.calloutBlock('판매 실적과 거래처 관리를 한 눈에', '💰'),
    api.dividerBlock(),
    api.heading2Block('📊 Overview'),
    api.paragraphBlock('국가별, 채널별 판매 현황을 추적합니다.')
  ]);

  return page;
}

async function createChannelSalesDB(parentId, brandsDbId) {
  console.log('\n📈 Channel Sales Database 생성 중...');

  const properties = {
    'Report ID': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Channel': P.select([
      { name: 'Shopee', color: 'orange' },
      { name: 'TikTok Shop', color: 'default' },
      { name: 'Lazada', color: 'purple' },
      { name: 'Offline/Retail', color: 'blue' },
      { name: 'Own Website', color: 'green' }
    ]),
    'Month': P.date(),
    'Gross Sales': P.number('dollar'),
    'Returns': P.number('dollar'),
    'Net Sales': P.number('dollar'),
    'Orders': P.number('number'),
    'AOV': P.number('dollar'),
    'Units Sold': P.number('number'),
    'Return Rate': P.number('percent'),
    'MoM Growth': P.number('percent'),
    'Top SKU': P.richText(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📈 Channel Sales', '📈', properties);
  return db;
}

async function createRetailPartnersDB(parentId, brandsDbId) {
  console.log('\n🏪 Retail Partners Database 생성 중...');

  const properties = {
    'Partner Name': P.title(),
    'Partner Type': P.select([
      { name: 'E-commerce Platform', color: 'blue' },
      { name: 'Offline Retailer', color: 'green' },
      { name: 'Distributor', color: 'purple' },
      { name: 'Franchise', color: 'orange' }
    ]),
    'Country': P.select([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Brands Carried': P.relation(brandsDbId),
    'Contract Status': P.select([
      { name: 'Active', color: 'green' },
      { name: 'Negotiating', color: 'yellow' },
      { name: 'Expired', color: 'red' },
      { name: 'On Hold', color: 'gray' }
    ]),
    'Contract Start': P.date(),
    'Contract End': P.date(),
    'Payment Terms': P.select([
      { name: 'Net 30', color: 'green' },
      { name: 'Net 60', color: 'yellow' },
      { name: 'Net 90', color: 'orange' },
      { name: 'COD', color: 'blue' }
    ]),
    'Commission/Margin': P.number('percent'),
    'Monthly Target': P.number('dollar'),
    'YTD Sales': P.number('dollar'),
    'Primary Contact': P.richText(),
    'Contact Email': P.email(),
    'Contact Phone': P.phoneNumber(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🏪 Retail Partners', '🏪', properties);
  return db;
}

async function createProductSalesDB(parentId, brandsDbId) {
  console.log('\n📦 Product Sales Tracker 생성 중...');

  const properties = {
    'SKU': P.title(),
    'Product Name': P.richText(),
    'Brand': P.relation(brandsDbId),
    'Category': P.select([
      { name: 'Skincare', color: 'green' },
      { name: 'Makeup', color: 'pink' },
      { name: 'Haircare', color: 'purple' },
      { name: 'Bodycare', color: 'blue' }
    ]),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Price (Local)': P.number('number'),
    'Price (USD)': P.number('dollar'),
    'Units Sold (MTD)': P.number('number'),
    'Revenue (MTD)': P.number('dollar'),
    'Units Sold (YTD)': P.number('number'),
    'Revenue (YTD)': P.number('dollar'),
    'Stock Level': P.number('number'),
    'Reorder Point': P.number('number'),
    'Stock Status': P.select([
      { name: 'In Stock', color: 'green' },
      { name: 'Low Stock', color: 'yellow' },
      { name: 'Out of Stock', color: 'red' },
      { name: 'Discontinued', color: 'gray' }
    ]),
    'Best Seller': P.checkbox(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📦 Product Sales', '📦', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 4: Sales Dashboard');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  const ids = loadCreatedIds();

  if (!ids.brandsDb) {
    console.error('❌ Step 1을 먼저 실행해주세요');
    process.exit(1);
  }

  try {
    // 1. Sales Dashboard 메인 페이지
    const salesDashboard = await createSalesDashboardPage(parentId);
    await api.delay(500);

    // 2. Channel Sales
    await api.appendBlocks(salesDashboard.id, [
      api.dividerBlock(),
      api.heading1Block('📈 Channel Sales')
    ]);
    await api.delay(300);

    const channelSalesDb = await createChannelSalesDB(salesDashboard.id, ids.brandsDb);
    await api.delay(500);

    // 3. Retail Partners
    await api.appendBlocks(salesDashboard.id, [
      api.dividerBlock(),
      api.heading1Block('🏪 Retail Partners')
    ]);
    await api.delay(300);

    const retailPartnersDb = await createRetailPartnersDB(salesDashboard.id, ids.brandsDb);
    await api.delay(500);

    // 4. Product Sales
    await api.appendBlocks(salesDashboard.id, [
      api.dividerBlock(),
      api.heading1Block('📦 Product Sales Tracker')
    ]);
    await api.delay(300);

    const productSalesDb = await createProductSalesDB(salesDashboard.id, ids.brandsDb);

    // ID 저장
    const newIds = {
      salesDashboardPage: salesDashboard.id,
      channelSalesDb: channelSalesDb.id,
      retailPartnersDb: retailPartnersDb.id,
      productSalesDb: productSalesDb.id
    };
    saveCreatedIds(newIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 4 완료! Sales Dashboard 생성됨');
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
