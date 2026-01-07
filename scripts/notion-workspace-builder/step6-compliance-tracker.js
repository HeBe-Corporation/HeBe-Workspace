// Step 6: 위생허가 (Compliance) Tracker
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

async function createCompliancePage(parentId) {
  console.log('\n📋 Compliance Tracker 메인 페이지 생성 중...');

  const page = await api.createPage(parentId, 'Compliance & Permits', '📋');

  await api.appendBlocks(page.id, [
    api.calloutBlock('위생허가, 인증, 등록 현황을 추적합니다. D-90부터 갱신 알림!', '📋'),
    api.dividerBlock(),
    api.heading2Block('⚠️ 주요 기한'),
    api.paragraphBlock('만료 예정 허가증을 확인하세요.')
  ]);

  return page;
}

async function createPermitsDB(parentId, brandsDbId) {
  console.log('\n📜 Permits Database 생성 중...');

  const properties = {
    'Permit ID': P.title(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Permit Type': P.select([
      { name: 'Cosmetic Registration', color: 'pink' },
      { name: 'Import License', color: 'blue' },
      { name: 'Business License', color: 'green' },
      { name: 'FDA Approval', color: 'red' },
      { name: 'Product Notification', color: 'yellow' }
    ]),
    'Product/SKU': P.richText(),
    'Permit Number': P.richText(),
    'Issue Date': P.date(),
    'Expiry Date': P.date(),
    'Days Until Expiry': P.number('number'),
    'Renewal Status': P.select([
      { name: 'Valid', color: 'green' },
      { name: 'Renewal Started (D-90)', color: 'yellow' },
      { name: 'Urgent (D-30)', color: 'orange' },
      { name: 'Critical (D-7)', color: 'red' },
      { name: 'Expired', color: 'default' },
      { name: 'Renewed', color: 'blue' }
    ]),
    'Authority': P.richText(),
    'Application Date': P.date(),
    'Expected Approval': P.date(),
    'Document Files': P.files(),
    'Cost': P.number('dollar'),
    'Assigned To': P.people(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📜 Permits & Licenses', '📜', properties);
  return db;
}

async function createProductRegistrationDB(parentId, brandsDbId) {
  console.log('\n📦 Product Registration Database 생성 중...');

  const properties = {
    'Product Name': P.title(),
    'SKU': P.richText(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Category': P.select([
      { name: 'Skincare', color: 'green' },
      { name: 'Makeup', color: 'pink' },
      { name: 'Haircare', color: 'purple' },
      { name: 'Bodycare', color: 'blue' },
      { name: 'Supplement', color: 'orange' }
    ]),
    'Registration Status': P.select([
      { name: 'Not Started', color: 'gray' },
      { name: 'Document Prep', color: 'blue' },
      { name: 'Submitted', color: 'yellow' },
      { name: 'Under Review', color: 'orange' },
      { name: 'Approved', color: 'green' },
      { name: 'Rejected', color: 'red' },
      { name: 'Revision Needed', color: 'purple' }
    ]),
    'Submission Date': P.date(),
    'Expected Approval': P.date(),
    'Approval Date': P.date(),
    'Certificate Number': P.richText(),
    'Valid Until': P.date(),
    'Required Documents': P.multiSelect([
      { name: 'COA', color: 'blue' },
      { name: 'MSDS', color: 'green' },
      { name: 'GMP Certificate', color: 'purple' },
      { name: 'Free Sale Certificate', color: 'orange' },
      { name: 'Label Design', color: 'pink' },
      { name: 'Stability Test', color: 'yellow' }
    ]),
    'Documents Received': P.multiSelect([
      { name: 'COA', color: 'blue' },
      { name: 'MSDS', color: 'green' },
      { name: 'GMP Certificate', color: 'purple' },
      { name: 'Free Sale Certificate', color: 'orange' },
      { name: 'Label Design', color: 'pink' },
      { name: 'Stability Test', color: 'yellow' }
    ]),
    'Document Files': P.files(),
    'Registration Fee': P.number('dollar'),
    'Agent/Consultant': P.richText(),
    'Assigned To': P.people(),
    'Blockers': P.richText(),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '📦 Product Registration', '📦', properties);
  return db;
}

async function createComplianceTasksDB(parentId, brandsDbId) {
  console.log('\n✅ Compliance Tasks Database 생성 중...');

  const properties = {
    'Task': P.title(),
    'Related Permit': P.richText(),
    'Brand': P.relation(brandsDbId),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Task Type': P.select([
      { name: 'New Registration', color: 'blue' },
      { name: 'Renewal', color: 'green' },
      { name: 'Amendment', color: 'yellow' },
      { name: 'Document Collection', color: 'purple' },
      { name: 'Follow-up', color: 'orange' }
    ]),
    'Priority': P.select([
      { name: 'Critical', color: 'red' },
      { name: 'High', color: 'orange' },
      { name: 'Medium', color: 'yellow' },
      { name: 'Low', color: 'green' }
    ]),
    'Due Date': P.date(),
    'Status': P.select([
      { name: 'To Do', color: 'gray' },
      { name: 'In Progress', color: 'blue' },
      { name: 'Waiting', color: 'yellow' },
      { name: 'Done', color: 'green' }
    ]),
    'Assigned To': P.people(),
    'Estimated Cost': P.number('dollar'),
    'Actual Cost': P.number('dollar'),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '✅ Compliance Tasks', '✅', properties);
  return db;
}

async function createAgentContactsDB(parentId) {
  console.log('\n👤 Agent Contacts Database 생성 중...');

  const properties = {
    'Agent Name': P.title(),
    'Company': P.richText(),
    'Country': P.select([
      { name: 'Vietnam', color: 'orange' },
      { name: 'Cambodia', color: 'purple' }
    ]),
    'Service Type': P.multiSelect([
      { name: 'Cosmetic Registration', color: 'pink' },
      { name: 'Import License', color: 'blue' },
      { name: 'FDA Filing', color: 'red' },
      { name: 'Legal Consultation', color: 'purple' },
      { name: 'Translation', color: 'green' }
    ]),
    'Expertise Level': P.select([
      { name: 'Highly Recommended', color: 'green' },
      { name: 'Good', color: 'blue' },
      { name: 'Average', color: 'yellow' },
      { name: 'Not Recommended', color: 'red' }
    ]),
    'Fee Structure': P.richText(),
    'Typical Timeline': P.richText(),
    'Email': P.email(),
    'Phone': P.phoneNumber(),
    'Website': P.url(),
    'Address': P.richText(),
    'Past Projects': P.number('number'),
    'Rating': P.select([
      { name: '⭐⭐⭐⭐⭐', color: 'green' },
      { name: '⭐⭐⭐⭐', color: 'blue' },
      { name: '⭐⭐⭐', color: 'yellow' },
      { name: '⭐⭐', color: 'orange' },
      { name: '⭐', color: 'red' }
    ]),
    'Notes': P.richText()
  };

  const db = await api.createDatabase(parentId, '👤 Agent Contacts', '👤', properties);
  return db;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HeBe Notion Workspace - Step 6: Compliance Tracker');
  console.log('═══════════════════════════════════════════════════════');

  const parentId = config.existingIds.mainPage;
  const ids = loadCreatedIds();

  if (!ids.brandsDb) {
    console.error('❌ Step 1을 먼저 실행해주세요');
    process.exit(1);
  }

  try {
    // 1. Compliance 메인 페이지
    const compliancePage = await createCompliancePage(parentId);
    await api.delay(500);

    // 2. Permits & Licenses
    await api.appendBlocks(compliancePage.id, [
      api.dividerBlock(),
      api.heading1Block('📜 Permits & Licenses')
    ]);
    await api.delay(300);

    const permitsDb = await createPermitsDB(compliancePage.id, ids.brandsDb);
    await api.delay(500);

    // 3. Product Registration
    await api.appendBlocks(compliancePage.id, [
      api.dividerBlock(),
      api.heading1Block('📦 Product Registration')
    ]);
    await api.delay(300);

    const productRegDb = await createProductRegistrationDB(compliancePage.id, ids.brandsDb);
    await api.delay(500);

    // 4. Compliance Tasks
    await api.appendBlocks(compliancePage.id, [
      api.dividerBlock(),
      api.heading1Block('✅ Compliance Tasks')
    ]);
    await api.delay(300);

    const complianceTasksDb = await createComplianceTasksDB(compliancePage.id, ids.brandsDb);
    await api.delay(500);

    // 5. Agent Contacts
    await api.appendBlocks(compliancePage.id, [
      api.dividerBlock(),
      api.heading1Block('👤 Agent Contacts')
    ]);
    await api.delay(300);

    const agentContactsDb = await createAgentContactsDB(compliancePage.id);

    // ID 저장
    const newIds = {
      compliancePage: compliancePage.id,
      permitsDb: permitsDb.id,
      productRegistrationDb: productRegDb.id,
      complianceTasksDb: complianceTasksDb.id,
      agentContactsDb: agentContactsDb.id
    };
    saveCreatedIds(newIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Step 6 완료! Compliance Tracker 생성됨');
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
