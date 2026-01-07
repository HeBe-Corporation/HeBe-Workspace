/**
 * HEBE VN Organization Chart - Auto Formatter v2
 * 에러 수정 버전
 */

function formatEntireSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // 1. 헤더 스타일링
  formatHeader(sheet, lastCol);

  // 2. 열 너비 설정
  setColumnWidths(sheet);

  // 3. 행 높이 설정
  setRowHeights(sheet, lastRow);

  // 4. 데이터 정렬
  alignData(sheet, lastRow, lastCol);

  // 5. 조건부 서식
  applyConditionalFormatting(sheet, lastRow);

  // 6. 데이터 유효성 검사 (드롭다운) - Link 열 제외
  addDataValidation(sheet, lastRow);

  // 7. 하이퍼링크 설정 (수정됨)
  addProfileLinks(sheet, lastRow);

  // 8. 행 고정
  sheet.setFrozenRows(1);

  // 9. 필터 추가
  try {
    var existingFilter = sheet.getFilter();
    if (existingFilter) {
      existingFilter.remove();
    }
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  } catch (e) {
    // 필터 이미 있으면 무시
  }

  SpreadsheetApp.getUi().alert('✅ 포맷팅 완료!\n\nHEBE VN Organization Chart가 예쁘게 꾸며졌습니다.');
}

// ========== 헤더 스타일링 ==========

function formatHeader(sheet, lastCol) {
  var headerRange = sheet.getRange(1, 1, 1, lastCol);

  headerRange
    .setBackground('#1E3A5F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 45);
}

// ========== 열 너비 설정 ==========

function setColumnWidths(sheet) {
  var widths = {
    1: 80,    // A: ID
    2: 140,   // B: Name
    3: 100,   // C: Department
    4: 110,   // D: Team
    5: 160,   // E: Role
    6: 80,    // F: Level
    7: 90,    // G: Reports To
    8: 180,   // H: Email
    9: 110,   // I: Phone
    10: 100,  // J: Brand 1
    11: 100,  // K: Brand 2
    12: 100,  // L: Brand 3
    13: 70,   // M: Profile Link
    14: 90,   // N: Slack
    15: 110,  // O: Start Date
    16: 100,  // P: Status
    17: 180   // Q: Notes
  };

  for (var col in widths) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  }
}

// ========== 행 높이 설정 ==========

function setRowHeights(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    sheet.setRowHeight(i, 35);
  }
}

// ========== 데이터 정렬 ==========

function alignData(sheet, lastRow, lastCol) {
  if (lastRow < 2) return;

  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange.setVerticalAlignment('middle');

  // Left align
  sheet.getRange(2, 1, lastRow - 1, 2).setHorizontalAlignment('left');
  sheet.getRange(2, 8, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 17, lastRow - 1, 1).setHorizontalAlignment('left');

  // Center align
  sheet.getRange(2, 3, lastRow - 1, 4).setHorizontalAlignment('center');
  sheet.getRange(2, 10, lastRow - 1, 3).setHorizontalAlignment('center');
  sheet.getRange(2, 13, lastRow - 1, 4).setHorizontalAlignment('center');
}

// ========== 조건부 서식 ==========

function applyConditionalFormatting(sheet, lastRow) {
  sheet.clearConditionalFormatRules();

  var rules = [];

  // Department 색상 (Column C)
  var deptRange = sheet.getRange('C2:C' + lastRow);
  rules.push(createColorRule(deptRange, 'Executive', '#FFD700', '#000000'));
  rules.push(createColorRule(deptRange, 'Operations', '#8B4513', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Finance', '#228B22', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Commercial', '#4169E1', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Marketing', '#9932CC', '#FFFFFF'));

  // Status 색상 (Column P)
  var statusRange = sheet.getRange('P2:P' + lastRow);
  rules.push(createColorRule(statusRange, 'Active', '#32CD32', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Pending', '#808080', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Upcoming', '#1E90FF', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Inactive', '#A9A9A9', '#FFFFFF'));

  // 플레이스홀더 스타일
  var placeholderRanges = [
    sheet.getRange('B2:B' + lastRow),
    sheet.getRange('H2:H' + lastRow),
    sheet.getRange('I2:I' + lastRow),
    sheet.getRange('J2:L' + lastRow),
    sheet.getRange('N2:N' + lastRow),
    sheet.getRange('O2:O' + lastRow),
  ];

  var placeholders = ['-', 'email', 'phone', 'slack', 'yyyy-mm-dd'];

  placeholderRanges.forEach(function(range) {
    placeholders.forEach(function(text) {
      rules.push(createPlaceholderRule(range, text));
    });
  });

  sheet.setConditionalFormatRules(rules);
}

function createColorRule(range, text, bgColor, fontColor) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text)
    .setBackground(bgColor)
    .setFontColor(fontColor)
    .setBold(true)
    .setRanges([range])
    .build();
}

function createPlaceholderRule(range, text) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text)
    .setBackground('#F5F5F5')
    .setFontColor('#A0A0A0')
    .setItalic(true)
    .setRanges([range])
    .build();
}

// ========== 데이터 유효성 검사 ==========

function addDataValidation(sheet, lastRow) {
  if (lastRow < 2) return;

  // Department (Column C)
  var deptRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Executive', 'Operations', 'Finance', 'Commercial', 'Marketing'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('C2:C' + lastRow).setDataValidation(deptRule);

  // Team (Column D)
  var teamRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Leadership', 'Warehouse', 'Accounting', 'Sales', 'E-Commerce', 'Digital', 'Marketing', 'ABM', 'Media', 'Design', 'Content'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('D2:D' + lastRow).setDataValidation(teamRule);

  // Level (Column F)
  var levelRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Executive', 'Lead', 'Member'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F' + lastRow).setDataValidation(levelRule);

  // Status (Column P)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Pending', 'Upcoming', 'Inactive'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('P2:P' + lastRow).setDataValidation(statusRule);

  // Brands (Columns J, K, L)
  var brandRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['-', 'Dasique', 'Unleashia', 'ISOI', "AGE20's", 'Dr.Melaxin', 'MediAnswer', 'MARY & MAY', 'Innergarm', 'All Brands'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('J2:L' + lastRow).setDataValidation(brandRule);

  // Profile Link (Column M) - 유효성 검사 제거 (하이퍼링크용)
  sheet.getRange('M2:M' + lastRow).clearDataValidations();
}

// ========== 하이퍼링크 (수정됨) ==========

function addProfileLinks(sheet, lastRow) {
  // 먼저 M열의 데이터 유효성 검사 제거
  sheet.getRange('M2:M' + lastRow).clearDataValidations();

  for (var i = 2; i <= lastRow; i++) {
    var id = sheet.getRange(i, 1).getValue();
    var linkCell = sheet.getRange(i, 13); // Column M
    var currentValue = linkCell.getValue();

    if (id && (currentValue === 'Link' || currentValue === '')) {
      // 수식 대신 값으로 설정하고 스타일만 적용
      linkCell.setValue('Link');
      linkCell.setFontColor('#1E90FF');
      // 클릭 시 이동할 URL은 나중에 Notion 연동 후 설정
    }
  }
}

// ========== 메뉴 추가 ==========

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎨 HEBE Tools')
    .addItem('📊 전체 포맷팅', 'formatEntireSheet')
    .addItem('🔗 링크 새로고침', 'refreshLinks')
    .addItem('✅ 드롭다운 새로고침', 'refreshDropdowns')
    .addToUi();
}

function refreshLinks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  addProfileLinks(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ 링크가 새로고침되었습니다.');
}

function refreshDropdowns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  addDataValidation(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ 드롭다운이 새로고침되었습니다.');
}
