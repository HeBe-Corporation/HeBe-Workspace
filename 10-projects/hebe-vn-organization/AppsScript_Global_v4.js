/**
 * HEBE Global Organization Chart v4
 * 3개국 통합 (Korea, Vietnam, Cambodia)
 * Country, Department, Status 파스텔 색상
 */

function formatEntireSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // 1. 전체 흰색 초기화
  sheet.getRange(1, 1, lastRow, lastCol).setBackground('#FFFFFF');

  // 2. 헤더
  formatHeader(sheet, lastCol);

  // 3. 열 너비
  setColumnWidths(sheet);

  // 4. 행 높이
  setRowHeights(sheet, lastRow);

  // 5. 정렬
  alignData(sheet, lastRow, lastCol);

  // 6. 조건부 서식 (Country, Department, Status)
  applyConditionalFormatting(sheet, lastRow);

  // 7. 드롭다운
  addDataValidation(sheet, lastRow);

  // 8. 플레이스홀더
  stylePlaceholders(sheet, lastRow);

  // 9. Days 수식
  applyDaysFormula(sheet, lastRow);

  // 10. 행 고정
  sheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ Global Theme 적용 완료!\n\n🇰🇷 Korea + 🇻🇳 Vietnam + 🇰🇭 Cambodia\n\nHEBE Global Organization 완성! 🌏');
}

// ========== 헤더 ==========

function formatHeader(sheet, lastCol) {
  var header = sheet.getRange(1, 1, 1, lastCol);
  header
    .setBackground('#E91E63')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
}

// ========== 열 너비 ==========

function setColumnWidths(sheet) {
  var widths = {
    1: 70,   // A: ID
    2: 80,   // B: Country
    3: 120,  // C: Name
    4: 90,   // D: Department
    5: 90,   // E: Team
    6: 130,  // F: Role
    7: 70,   // G: Reports To
    8: 150,  // H: Email
    9: 100,  // I: Phone
    10: 90,  // J: Birthday
    11: 80,  // K: Brand 1
    12: 80,  // L: Brand 2
    13: 80,  // M: Brand 3
    14: 75,  // N: Platform 1
    15: 85,  // O: Platform 2
    16: 75,  // P: Platform 3
    17: 75,  // Q: Slack
    18: 90,  // R: Start Date
    19: 45,  // S: Days
    20: 75,  // T: Status
    21: 140  // U: Notes
  };
  for (var col in widths) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  }
}

// ========== 행 높이 ==========

function setRowHeights(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    sheet.setRowHeight(i, 30);
  }
}

// ========== 정렬 ==========

function alignData(sheet, lastRow, lastCol) {
  if (lastRow < 2) return;

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol);
  data.setVerticalAlignment('middle');
  data.setFontSize(10);

  // Left: Name, Role, Email, Notes
  sheet.getRange(2, 3, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 6, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 8, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 21, lastRow - 1, 1).setHorizontalAlignment('left');

  // Center: 나머지
  sheet.getRange(2, 1, lastRow - 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, 4, lastRow - 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, 7, lastRow - 1, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 9, lastRow - 1, 12).setHorizontalAlignment('center');
}

// ========== 조건부 서식 ==========

function applyConditionalFormatting(sheet, lastRow) {
  sheet.clearConditionalFormatRules();
  var rules = [];

  // ===== Country (Column B) =====
  var countryRange = sheet.getRange('B2:B' + lastRow);

  // 🇰🇷 Korea - 파란색 (태극기)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Korea')
    .setBackground('#E3F2FD').setFontColor('#0D47A1')
    .setBold(true)
    .setRanges([countryRange]).build());

  // 🇻🇳 Vietnam - 빨간색/노란색 (베트남 국기)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Vietnam')
    .setBackground('#FFEBEE').setFontColor('#C62828')
    .setBold(true)
    .setRanges([countryRange]).build());

  // 🇰🇭 Cambodia - 빨간색/파란색 (캄보디아 국기)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Cambodia')
    .setBackground('#FCE4EC').setFontColor('#AD1457')
    .setBold(true)
    .setRanges([countryRange]).build());

  // ===== Department (Column D) =====
  var deptRange = sheet.getRange('D2:D' + lastRow);

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Executive')
    .setBackground('#FFF3E0').setFontColor('#E65100')
    .setRanges([deptRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Operations')
    .setBackground('#EFEBE9').setFontColor('#5D4037')
    .setRanges([deptRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Finance')
    .setBackground('#E8F5E9').setFontColor('#2E7D32')
    .setRanges([deptRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Commercial')
    .setBackground('#E3F2FD').setFontColor('#1565C0')
    .setRanges([deptRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Marketing')
    .setBackground('#F3E5F5').setFontColor('#7B1FA2')
    .setRanges([deptRange]).build());

  // ===== Status (Column T) =====
  var statusRange = sheet.getRange('T2:T' + lastRow);

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Active')
    .setBackground('#E8F5E9').setFontColor('#2E7D32')
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#FFF8E1').setFontColor('#F57F17')
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Upcoming')
    .setBackground('#E3F2FD').setFontColor('#1565C0')
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Inactive')
    .setBackground('#F5F5F5').setFontColor('#757575')
    .setRanges([statusRange]).build());

  sheet.setConditionalFormatRules(rules);
}

// ========== 드롭다운 ==========

function addDataValidation(sheet, lastRow) {
  if (lastRow < 2) return;

  // Country
  sheet.getRange('B2:B' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Korea', 'Vietnam', 'Cambodia'])
      .build());

  // Department
  sheet.getRange('D2:D' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Executive', 'Operations', 'Finance', 'Commercial', 'Marketing'])
      .build());

  // Team
  sheet.getRange('E2:E' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Leadership', 'Warehouse', 'Accounting', 'Sales', 'E-Commerce', 'Digital', 'Marketing', 'ABM', 'Media', 'Design', 'Content'])
      .build());

  // Status
  sheet.getRange('T2:T' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Pending', 'Upcoming', 'Inactive'])
      .build());

  // Brands
  sheet.getRange('K2:M' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['-', 'Dasique', 'Unleashia', 'ISOI', "AGE20's", 'Dr.Melaxin', 'MediAnswer', 'MARY & MAY', 'Innergarm', 'All Brands'])
      .build());
}

// ========== 플레이스홀더 ==========

function stylePlaceholders(sheet, lastRow) {
  var placeholders = ['email', 'phone', 'slack', 'yyyy-mm-dd', '-'];
  var data = sheet.getDataRange().getValues();

  for (var row = 1; row < data.length; row++) {
    for (var col = 0; col < data[row].length; col++) {
      var value = String(data[row][col]);
      if (placeholders.indexOf(value) !== -1) {
        sheet.getRange(row + 1, col + 1)
          .setFontColor('#BDBDBD')
          .setFontStyle('italic');
      }
    }
  }
}

// ========== Days 수식 ==========

function applyDaysFormula(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    var cell = sheet.getRange(i, 19); // Column S: Days
    cell.setFormula('=IF(R' + i + '="","",IF(R' + i + '="yyyy-mm-dd","",DATEDIF(R' + i + ',TODAY(),"D")))');
  }
}

// ========== 메뉴 ==========

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌏 HEBE Global')
    .addItem('🎨 전체 포맷팅', 'formatEntireSheet')
    .addItem('📊 Days 수식 적용', 'refreshDays')
    .addItem('🔄 색상 새로고침', 'refreshColors')
    .addItem('🔍 필터 추가', 'addFilter')
    .addToUi();
}

function refreshDays() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  applyDaysFormula(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ Days 수식이 적용되었습니다.');
}

function refreshColors() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  applyConditionalFormatting(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ 색상이 새로고침되었습니다.');
}

function addFilter() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  try {
    var existingFilter = sheet.getFilter();
    if (existingFilter) existingFilter.remove();
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
    SpreadsheetApp.getUi().alert('✅ 필터가 추가되었습니다.\n\nCountry로 필터링해보세요!');
  } catch (e) {
    SpreadsheetApp.getUi().alert('⚠️ 필터 추가 실패: ' + e.message);
  }
}
