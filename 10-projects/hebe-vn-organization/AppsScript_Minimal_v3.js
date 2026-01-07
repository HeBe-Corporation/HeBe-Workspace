/**
 * HEBE VN Organization Chart v3 - Minimal Pastel Theme
 * Department와 Status만 파스텔 색상, 나머지는 깔끔한 흰색
 */

function formatEntireSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // 1. 전체 배경 흰색으로 초기화
  sheet.getRange(1, 1, lastRow, lastCol).setBackground('#FFFFFF');

  // 2. 헤더 스타일
  formatHeader(sheet, lastCol);

  // 3. 열 너비
  setColumnWidths(sheet);

  // 4. 행 높이
  setRowHeights(sheet, lastRow);

  // 5. 정렬
  alignData(sheet, lastRow, lastCol);

  // 6. 조건부 서식 (Department, Status만)
  applyConditionalFormatting(sheet, lastRow);

  // 7. 드롭다운
  addDataValidation(sheet, lastRow);

  // 8. 플레이스홀더 스타일
  stylePlaceholders(sheet, lastRow);

  // 9. Days 수식 (이미 CSV에 포함, 필요시 재적용)
  // applyDaysFormula(sheet, lastRow);

  // 10. 행 고정
  sheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ Minimal Pastel Theme 적용 완료!\n\n깔끔한 HEBE 조직도가 완성되었습니다 🌸');
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
    2: 120,  // B: Name
    3: 90,   // C: Department
    4: 90,   // D: Team
    5: 140,  // E: Role
    6: 70,   // F: Reports To
    7: 160,  // G: Email
    8: 100,  // H: Phone
    9: 90,   // I: Birthday
    10: 85,  // J: Brand 1
    11: 85,  // K: Brand 2
    12: 85,  // L: Brand 3
    13: 80,  // M: Platform 1
    14: 90,  // N: Platform 2
    15: 80,  // O: Platform 3
    16: 80,  // P: Slack
    17: 90,  // Q: Start Date
    18: 50,  // R: Days
    19: 80,  // S: Status
    20: 150  // T: Notes
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
  sheet.getRange(2, 2, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 5, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 7, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 20, lastRow - 1, 1).setHorizontalAlignment('left');

  // Center: 나머지
  sheet.getRange(2, 1, lastRow - 1, 1).setHorizontalAlignment('center'); // ID
  sheet.getRange(2, 3, lastRow - 1, 2).setHorizontalAlignment('center'); // Dept, Team
  sheet.getRange(2, 6, lastRow - 1, 1).setHorizontalAlignment('center'); // Reports To
  sheet.getRange(2, 8, lastRow - 1, 12).setHorizontalAlignment('center'); // Phone ~ Status
}

// ========== 조건부 서식 (파스텔) ==========

function applyConditionalFormatting(sheet, lastRow) {
  sheet.clearConditionalFormatRules();
  var rules = [];

  // ===== Department (Column C) - 파스텔 =====
  var deptRange = sheet.getRange('C2:C' + lastRow);

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Executive')
    .setBackground('#FCE4EC').setFontColor('#AD1457')
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

  // ===== Status (Column S) - 파스텔 =====
  var statusRange = sheet.getRange('S2:S' + lastRow);

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

  // Department
  sheet.getRange('C2:C' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Executive', 'Operations', 'Finance', 'Commercial', 'Marketing'])
      .build());

  // Team
  sheet.getRange('D2:D' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Leadership', 'Warehouse', 'Accounting', 'Sales', 'E-Commerce', 'Digital', 'Marketing', 'ABM', 'Media', 'Design', 'Content'])
      .build());

  // Status
  sheet.getRange('S2:S' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Pending', 'Upcoming', 'Inactive'])
      .build());

  // Brands
  sheet.getRange('J2:L' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['-', 'Dasique', 'Unleashia', 'ISOI', "AGE20's", 'Dr.Melaxin', 'MediAnswer', 'MARY & MAY', 'Innergarm', 'All Brands'])
      .build());
}

// ========== 플레이스홀더 스타일 ==========

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

// ========== Days 수식 적용 ==========

function applyDaysFormula(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    var cell = sheet.getRange(i, 18); // Column R: Days
    cell.setFormula('=IF(Q' + i + '="","",DATEDIF(Q' + i + ',TODAY(),"D"))');
  }
}

// ========== 메뉴 ==========

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌸 HEBE Tools')
    .addItem('🎨 전체 포맷팅', 'formatEntireSheet')
    .addItem('📊 Days 수식 적용', 'refreshDays')
    .addItem('🔄 색상 새로고침', 'refreshColors')
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
