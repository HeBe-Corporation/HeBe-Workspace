// Step 5: Accounting / P&L Dashboard
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

async function createAccountingPage(parentId) {
  console.log('\n📒 Accounting Dashboard 메인 페이지 생성 중...');

  const page = await api.createPage(parentId, 'Accounting & Finance', '📒');

  await api.appendBlocks(page.id, [
    api.calloutBlock('재무 현황과 비용 관리를 체계적으로', '📒'),
    api.dividerBlock(),
    api.heading2Block('💵 Financial Overview'),
    api.paragraphBlock('전표, 인보이스, 월마감 현황을 관리합니다.')
  ]);

  return page;
}

async function createTransactionsDB(parentId, brandsDbId) {
  console.log('\n📝 Transactions (전표) Database 생성 중...');

  const properties = {
    'Transaction ID': P.title(),
    'Date': P.date(),
    'Type': P.select([
      { name: 'Revenue', color: 'green' },
      { name: 'Expense', color: 'red' },
      { name: 'Transfer', color: 'blue' }
    ]),
    'Category': P.select([
      { name: 'Marketing - Seeding', color: 'pink' },
      { name: 'Marketing - KOL', color: 'pink' },
      { name: 'Marketing - Paid Ads', color: 'pink' },
      { name: 'Marketing - Offline', color: 'pink' },
      { name: 'Operations - Logistics', color: 'blue' },
      { name: 'Operations - Warehouse', color: 'blue' },
      { name: 'HR - Salary', color: 'purple' },
      { name: 'HR - Benefits', color: 'purple' },
      { name: 'Admin - Office', color: 'gray' },
      { name: 'Admin - Legal', color: 'gray' },
      { name: 'Sales - Commission', color: 'green' },
      { name: 'Sales - Revenue', color: 'green' }
    ]),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Amount (Local)': P.number('number'),
    'Currency': P.select([
      { name: 'KRW', color: 'blue' },
      { name: 'VND', color: 'orange' },
      { name: 'USD', color: 'green' },
      { name: 'KHR', color: 'purple' }
    ]),
    'Amount (USD)': P.number('dollar'),
    'Exchange Rate': P.number('number'),
    'Budget Source': P.select([
      { name: 'HQ Support', color: 'blue' },
      { name: 'HeBe Self-Investment', color: 'green' },
      { name: 'Local Budget', color: 'orange' }
    ]),
    'Vendor/Partner': P.richText(),
    'Description': P.richText(),
    'Evidence URL': P.url(),
    'Status': P.select([
      { name: 'Draft', color: 'gray' },
      { name: 'Pending Approval', color: 'yellow' },
      { name: 'Approved', color: 'green' },
      { name: 'Paid', color: 'blue' },
      { name: 'Void', color: 'red' }
    ]),
    'Approved By': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📝 Transactions', '📝', properties);
  return db;
}

async function createInvoicesDB(parentId, brandsDbId) {
  console.log('\n🧾 Invoices Database 생성 중...');

  const properties = {
    'Invoice Number': P.title(),
    'Type': P.select([
      { name: 'Receivable (AR)', color: 'green' },
      { name: 'Payable (AP)', color: 'red' }
    ]),
    'Partner Name': P.richText(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Issue Date': P.date(),
    'Due Date': P.date(),
    'Amount': P.number('dollar'),
    'Currency': P.select([
      { name: 'KRW', color: 'blue' },
      { name: 'VND', color: 'orange' },
      { name: 'USD', color: 'green' }
    ]),
    'Status': P.select([
      { name: 'Draft', color: 'gray' },
      { name: 'Sent', color: 'blue' },
      { name: 'Partial Paid', color: 'yellow' },
      { name: 'Paid', color: 'green' },
      { name: 'Overdue', color: 'red' },
      { name: 'Cancelled', color: 'default' }
    ]),
    'Paid Amount': P.number('dollar'),
    'Payment Date': P.date(),
    'Invoice File': P.files(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '🧾 Invoices', '🧾', properties);
  return db;
}

async function createMonthlyCloseDB(parentId, brandsDbId) {
  console.log('\n📅 Monthly Close Database 생성 중...');

  const properties = {
    'Period': P.title(),
    'Country': P.select([
      { name: 'Korea', color: 'blue' },
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Month': P.date(),
    // Revenue
    'Total Revenue': P.number('dollar'),
    'Revenue - Shopee': P.number('dollar'),
    'Revenue - TikTok': P.number('dollar'),
    'Revenue - Lazada': P.number('dollar'),
    'Revenue - Offline': P.number('dollar'),
    // COGS
    'COGS': P.number('dollar'),
    'Gross Profit': P.number('dollar'),
    'Gross Margin': P.number('percent'),
    // Operating Expenses
    'Marketing Expense': P.number('dollar'),
    'Operations Expense': P.number('dollar'),
    'HR Expense': P.number('dollar'),
    'Admin Expense': P.number('dollar'),
    'Total OpEx': P.number('dollar'),
    // Net
    'Operating Profit': P.number('dollar'),
    'Operating Margin': P.number('percent'),
    // Status
    'Status': P.select([
      { name: 'Open', color: 'blue' },
      { name: 'In Progress', color: 'yellow' },
      { name: 'Closed', color: 'green' }
    ]),
    'Close Date': P.date(),
    'Closed By': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📅 Monthly Close', '📅', properties);
  return db;
}

async function createBudgetVsActualDB(parentId, brandsDbId) {
  console.log('\n📊 Budget vs Actual Database 생성 중...');

  const properties = {
    'Budget Item': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Category': P.select([
      { name: 'Marketing', color: 'pink' },
      { name: 'Operations', color: 'blue' },
      { name: 'HR', color: 'purple' },
      { name: 'Admin', color: 'gray' }
    ]),
    'Quarter': P.select([
      { name: 'Q1', color: 'blue' },
      { name: 'Q2', color: 'green' },
      { name: 'Q3', color: 'yellow' },
      { name: 'Q4', color: 'red' }
    ]),
    'Year': P.number('number'),
    'Budget Amount': P.number('dollar'),
    'Actual Amount': P.number('dollar'),
    'Variance': P.number('dollar'),
    'Variance %': P.number('percent'),
    'Status': P.select([
      { name: 'On Track', color: 'green' },
      { name: 'At Risk', color: 'yellow' },
      { name: 'Over Budget', color: 'red' },
      { name: 'Under Budget', color: 'blue' }
    ]),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📊 Budget vs Actual', '📊', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 5: Accounting Dashboard');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  const ids = loadCreatedIds();

  if (!ids.brandsDb) {
    console.error('❌ Step 1을 먼저 실행해주세요');
    process.exit(1);
  }

  try {
    // 1. Accounting 메인 페이지
    const accountingPage = await createAccountingPage(parentId);
    await api.delay(500);

    // 2. Transactions
    await api.appendBlocks(accountingPage.id, [
      api.dividerBlock(),
      api.heading1Block('📝 Transactions (전표)')
    ]);
    await api.delay(300);

    const transactionsDb = await createTransactionsDB(accountingPage.id, ids.brandsDb);
    await api.delay(500);

    // 3. Invoices
    await api.appendBlocks(accountingPage.id, [
      api.dividerBlock(),
      api.heading1Block('🧾 Invoices')
    ]);
    await api.delay(300);

    const invoicesDb = await createInvoicesDB(accountingPage.id, ids.brandsDb);
    await api.delay(500);

    // 4. Monthly Close
    await api.appendBlocks(accountingPage.id, [
      api.dividerBlock(),
      api.heading1Block('📅 Monthly Close')
    ]);
    await api.delay(300);

    const monthlyCloseDb = await createMonthlyCloseDB(accountingPage.id, ids.brandsDb);
    await api.delay(500);

    // 5. Budget vs Actual
    await api.appendBlocks(accountingPage.id, [
      api.dividerBlock(),
      api.heading1Block('📊 Budget vs Actual')
    ]);
    await api.delay(300);

    const budgetVsActualDb = await createBudgetVsActualDB(accountingPage.id, ids.brandsDb);

    // ID 저장
    const newIds = {
      accountingPage: accountingPage.id,
      transactionsDb: transactionsDb.id,
      invoicesDb: invoicesDb.id,
      monthlyCloseDb: monthlyCloseDb.id,
      budgetVsActualDb: budgetVsActualDb.id
    };
    saveCreatedIds(newIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 5 완료! Accounting Dashboard 생성됨');
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
