// HeBe Notion Workspace Builder - Master Script
// 전체 워크스페이스를 단계별로 구축합니다

const step1 = require('./step1-core-databases');
const step2 = require('./step2-marketing-dashboard');
const step3 = require('./step3-ecommerce-dashboard');
const step4 = require('./step4-sales-dashboard');
const step5 = require('./step5-accounting-dashboard');
const step6 = require('./step6-compliance-tracker');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║   🌸 HeBe Korea Notion Workspace Builder                      ║');
  console.log('║                                                               ║');
  console.log('║   K-Beauty Distribution Company                               ║');
  console.log('║   Korea | Vietnam | Cambodia                                  ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    // Step 1: Core Databases
    console.log('\n\n📦 STEP 1/6: Core Databases');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step1.main();
    await delay(1000);

    // Step 2: Marketing Dashboard
    console.log('\n\n🚀 STEP 2/6: Marketing Dashboard (LaunchPad)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step2.main();
    await delay(1000);

    // Step 3: Ecommerce Dashboard
    console.log('\n\n📊 STEP 3/6: Ecommerce Dashboard (Pulse)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step3.main();
    await delay(1000);

    // Step 4: Sales Dashboard
    console.log('\n\n💰 STEP 4/6: Sales Dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step4.main();
    await delay(1000);

    // Step 5: Accounting Dashboard
    console.log('\n\n📒 STEP 5/6: Accounting Dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step5.main();
    await delay(1000);

    // Step 6: Compliance Tracker
    console.log('\n\n📋 STEP 6/6: Compliance Tracker');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await step6.main();

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   ✅ 모든 워크스페이스 구축 완료!                              ║');
    console.log('║                                                               ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║                                                               ║');
    console.log('║   생성된 구조:                                                 ║');
    console.log('║                                                               ║');
    console.log('║   📦 Core DBs (Brands, Countries, KOL)                        ║');
    console.log('║   🚀 LaunchPad - Marketing Hub                                ║');
    console.log('║      └─ Seeding, KOL Booking, Offline Events                  ║');
    console.log('║   📊 Pulse - Ecommerce Hub                                    ║');
    console.log('║      └─ Affiliate, Livestream, Paid Ads, Performance          ║');
    console.log('║   💰 Sales Dashboard                                          ║');
    console.log('║      └─ Channel Sales, Retail Partners, Product Sales         ║');
    console.log('║   📒 Accounting & Finance                                     ║');
    console.log('║      └─ Transactions, Invoices, Monthly Close, Budget         ║');
    console.log('║   📋 Compliance & Permits                                     ║');
    console.log('║      └─ Permits, Product Registration, Tasks, Agents          ║');
    console.log('║                                                               ║');
    console.log(`║   총 소요시간: ${duration}초                                     ║`);
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    // ID 요약 출력
    const fs = require('fs');
    const ids = JSON.parse(fs.readFileSync(__dirname + '/created-ids.json', 'utf8'));
    console.log('\n📝 생성된 모든 ID:');
    console.log(JSON.stringify(ids, null, 2));

  } catch (error) {
    console.error('\n\n❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
