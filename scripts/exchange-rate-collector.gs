/**
 * 환율 자동 수집 스크립트 v2.0
 *
 * 기능:
 * - 매일 2회 (09:00, 15:00 KST) 환율 자동 수집
 * - 최종 환율 = (월간최고 + 월평균×1.02) ÷ 2
 * - "환율" 시트에 기록
 *
 * 설정 방법:
 * 1. Google Sheets 열기
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 코드 전체 복사하여 붙여넣기
 * 4. 저장 후 "setupTriggers" 함수 1회 실행
 */

// ==================== 설정 ====================
const CONFIG = {
  SHEET_NAME: '환율',
  BUFFER_RATE: 1.02,  // 평균에 적용할 2% 버퍼
  TIMEZONE: 'Asia/Seoul'
};

// ==================== 메인 함수 ====================

/**
 * 환율 수집 (매일 2회 실행)
 */
function collectExchangeRates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // 시트가 없으면 생성
  if (!sheet) {
    sheet = createExchangeRateSheet(ss);
  }

  // 현재 시간
  const now = new Date();
  const dateStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const timeStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'HH:mm');

  // 환율 가져오기
  const usdKrw = getExchangeRate('USDKRW');
  const krwVnd = getKrwToVnd(usdKrw);

  if (!usdKrw || !krwVnd) {
    Logger.log('환율 가져오기 실패 - 스킵');
    return;
  }

  // 데이터 추가
  sheet.appendRow([
    dateStr,
    timeStr,
    usdKrw,
    krwVnd,
    'GOOGLEFINANCE'
  ]);

  // 월별 요약 업데이트 (중간값 방식)
  updateMonthlySummary(sheet);

  Logger.log(`환율 수집 완료: ${dateStr} ${timeStr} | USD/KRW: ${usdKrw} | KRW/VND: ${krwVnd}`);
}

/**
 * USD/KRW 환율 가져오기
 */
function getExchangeRate(pair) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let tempSheet = ss.getSheetByName('_temp_fx');

    if (!tempSheet) {
      tempSheet = ss.insertSheet('_temp_fx');
      tempSheet.hideSheet();
    }

    // GOOGLEFINANCE 함수로 환율 가져오기
    tempSheet.getRange('A1').setFormula(`=GOOGLEFINANCE("CURRENCY:${pair}")`);
    SpreadsheetApp.flush();
    Utilities.sleep(2000);

    const rate = tempSheet.getRange('A1').getValue();
    tempSheet.getRange('A1').clearContent();

    if (typeof rate === 'number' && rate > 0) {
      return Math.round(rate * 100) / 100;
    }
    return null;
  } catch (e) {
    Logger.log('환율 가져오기 실패: ' + e.message);
    return null;
  }
}

/**
 * KRW/VND 환산 (USD 경유)
 */
function getKrwToVnd(usdKrw) {
  try {
    const usdVnd = getExchangeRate('USDVND');
    if (usdKrw && usdVnd) {
      const krwVnd = usdVnd / usdKrw;
      return Math.round(krwVnd * 100) / 100;
    }
    return null;
  } catch (e) {
    Logger.log('KRW/VND 계산 실패: ' + e.message);
    return null;
  }
}

/**
 * 환율 시트 생성
 */
function createExchangeRateSheet(ss) {
  const sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  // 헤더 설정 (A~E: 일별 데이터)
  const headers = ['날짜', '시간', 'USD/KRW', 'KRW/VND', '소스'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4a86e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // 열 너비
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 100);
  sheet.setFrozenRows(1);

  // 월별 요약 섹션 (G~N열)
  const summaryHeaders = [
    '년월',
    '평균 USD/KRW',
    '최고 USD/KRW',
    '★적용 USD/KRW',
    '평균 KRW/VND',
    '최고 KRW/VND',
    '★적용 KRW/VND',
    '데이터수'
  ];
  sheet.getRange('G1').setValue('월별 요약 (중간값 방식)');
  sheet.getRange('G1:N1').merge().setBackground('#C19A5B').setFontColor('#fff').setFontWeight('bold');
  sheet.getRange('G2:N2').setValues([summaryHeaders]);
  sheet.getRange('G2:N2').setBackground('#f4b400').setFontWeight('bold');

  // 열 너비 조정
  for (let i = 7; i <= 14; i++) {
    sheet.setColumnWidth(i, 110);
  }

  // 공식 설명 추가
  sheet.getRange('G3').setNote('★적용 환율 = (최고 + 평균×1.02) ÷ 2\n환전 수수료와 변동성을 커버하는 중간값');

  return sheet;
}

/**
 * 월별 요약 업데이트 (중간값 방식)
 * 최종환율 = (월간최고 + 월평균×1.02) ÷ 2
 */
function updateMonthlySummary(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const now = new Date();
  const currentMonth = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');

  // 현재 월 데이터 수집
  let usdKrwValues = [];
  let krwVndValues = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][0];
    if (!rowDate) continue;

    try {
      const rowMonth = Utilities.formatDate(new Date(rowDate), CONFIG.TIMEZONE, 'yyyy-MM');
      if (rowMonth === currentMonth && data[i][2] && data[i][3]) {
        usdKrwValues.push(data[i][2]);
        krwVndValues.push(data[i][3]);
      }
    } catch (e) {
      continue;
    }
  }

  if (usdKrwValues.length === 0) return;

  // 통계 계산
  const avgUsdKrw = usdKrwValues.reduce((a, b) => a + b, 0) / usdKrwValues.length;
  const maxUsdKrw = Math.max(...usdKrwValues);
  const avgKrwVnd = krwVndValues.reduce((a, b) => a + b, 0) / krwVndValues.length;
  const maxKrwVnd = Math.max(...krwVndValues);

  // ★ 중간값 계산: (최고 + 평균×1.02) ÷ 2
  const finalUsdKrw = Math.round((maxUsdKrw + avgUsdKrw * CONFIG.BUFFER_RATE) / 2);
  const finalKrwVnd = Math.round(((maxKrwVnd + avgKrwVnd * CONFIG.BUFFER_RATE) / 2) * 100) / 100;

  // G열에서 현재 월 찾기 또는 추가
  const summaryStartRow = 3;
  const summaryCol = 7;

  let targetRow = summaryStartRow;
  const lastRow = Math.max(sheet.getLastRow(), summaryStartRow);

  for (let i = summaryStartRow; i <= lastRow + 1; i++) {
    const cellValue = sheet.getRange(i, summaryCol).getValue();
    if (cellValue === currentMonth) {
      targetRow = i;
      break;
    } else if (!cellValue || cellValue === '') {
      targetRow = i;
      break;
    }
  }

  // 요약 데이터 쓰기
  sheet.getRange(targetRow, summaryCol, 1, 8).setValues([[
    currentMonth,
    Math.round(avgUsdKrw),
    Math.round(maxUsdKrw),
    finalUsdKrw,  // ★적용 환율
    Math.round(avgKrwVnd * 100) / 100,
    Math.round(maxKrwVnd * 100) / 100,
    finalKrwVnd,  // ★적용 환율
    usdKrwValues.length
  ]]);

  // 적용 환율 셀 강조
  sheet.getRange(targetRow, 10).setBackground('#E8F5E9').setFontWeight('bold'); // J열
  sheet.getRange(targetRow, 13).setBackground('#E8F5E9').setFontWeight('bold'); // M열

  Logger.log(`월별 요약 업데이트: ${currentMonth}`);
  Logger.log(`  USD/KRW: 평균 ${Math.round(avgUsdKrw)} | 최고 ${Math.round(maxUsdKrw)} | ★적용 ${finalUsdKrw}`);
  Logger.log(`  KRW/VND: 평균 ${Math.round(avgKrwVnd*100)/100} | 최고 ${Math.round(maxKrwVnd*100)/100} | ★적용 ${finalKrwVnd}`);
}

// ==================== 트리거 설정 ====================

/**
 * 트리거 설정 (최초 1회 실행)
 */
function setupTriggers() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'collectExchangeRates') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매일 09:00 트리거
  ScriptApp.newTrigger('collectExchangeRates')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone(CONFIG.TIMEZONE)
    .create();

  // 매일 15:00 트리거
  ScriptApp.newTrigger('collectExchangeRates')
    .timeBased()
    .atHour(15)
    .everyDays(1)
    .inTimezone(CONFIG.TIMEZONE)
    .create();

  Logger.log('트리거 설정 완료: 매일 09:00, 15:00 (KST)');
}

/**
 * 트리거 삭제
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'collectExchangeRates') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('트리거 삭제 완료');
}

// ==================== 테스트 함수 ====================

/**
 * 수동으로 환율 수집 테스트
 */
function testCollectRates() {
  collectExchangeRates();
}

/**
 * 현재 환율만 확인 (시트에 기록 안 함)
 */
function testGetCurrentRates() {
  const usdKrw = getExchangeRate('USDKRW');
  const usdVnd = getExchangeRate('USDVND');

  if (usdKrw && usdVnd) {
    const krwVnd = usdVnd / usdKrw;
    Logger.log('=== 현재 환율 ===');
    Logger.log(`USD/KRW: ${usdKrw}`);
    Logger.log(`USD/VND: ${usdVnd}`);
    Logger.log(`KRW/VND: ${Math.round(krwVnd * 100) / 100}`);
  } else {
    Logger.log('환율 가져오기 실패');
  }
}

/**
 * 월별 요약만 업데이트
 */
function testUpdateSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (sheet) {
    updateMonthlySummary(sheet);
  } else {
    Logger.log('환율 시트가 없습니다. testCollectRates를 먼저 실행하세요.');
  }
}
