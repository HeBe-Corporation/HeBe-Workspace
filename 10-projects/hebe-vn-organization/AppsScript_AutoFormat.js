/**
 * HEBE VN Organization Chart - Auto Formatter
 *
 * 사용법:
 * 1. Google Sheets 열기
 * 2. Extensions → Apps Script
 * 3. 이 코드 전체 복사 → 붙여넣기
 * 4. 저장 (Ctrl+S)
 * 5. 함수 선택: formatEntireSheet → Run
 */

// ========== 메인 함수 ==========

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

  // 6. 데이터 유효성 검사 (드롭다운)
  addDataValidation(sheet, lastRow);

  // 7. 하이퍼링크 설정
  addProfileLinks(sheet, lastRow);

  // 8. 행 고정
  sheet.setFrozenRows(1);

  // 9. 필터 추가
  if (lastRow > 1) {
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  }

  SpreadsheetApp.getUi().alert('✅ 포맷팅 완료!\n\nHEBE VN Organization Chart가 예쁘게 꾸며졌습니다.');
}

// ========== 헤더 스타일링 ==========

function formatHeader(sheet, lastCol) {
  var headerRange = sheet.getRange(1, 1, 1, lastCol);

  headerRange
    .setBackground('#1E3A5F')      // Dark Navy
    .setFontColor('#FFFFFF')        // White
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

  // Left align: ID, Name, Email, Notes
  sheet.getRange(2, 1, lastRow - 1, 2).setHorizontalAlignment('left');   // A-B
  sheet.getRange(2, 8, lastRow - 1, 1).setHorizontalAlignment('left');   // H: Email
  sheet.getRange(2, 17, lastRow - 1, 1).setHorizontalAlignment('left');  // Q: Notes

  // Center align: Department, Team, Level, Status, Brands
  sheet.getRange(2, 3, lastRow - 1, 4).setHorizontalAlignment('center'); // C-F
  sheet.getRange(2, 10, lastRow - 1, 3).setHorizontalAlignment('center'); // J-L: Brands
  sheet.getRange(2, 13, lastRow - 1, 4).setHorizontalAlignment('center'); // M-P
}

// ========== 조건부 서식 ==========

function applyConditionalFormatting(sheet, lastRow) {
  // 기존 조건부 서식 제거
  sheet.clearConditionalFormatRules();

  var rules = [];

  // ----- Department 색상 (Column C) -----
  var deptRange = sheet.getRange('C2:C' + lastRow);

  rules.push(createColorRule(deptRange, 'Executive', '#FFD700', '#000000'));
  rules.push(createColorRule(deptRange, 'Operations', '#8B4513', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Finance', '#228B22', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Commercial', '#4169E1', '#FFFFFF'));
  rules.push(createColorRule(deptRange, 'Marketing', '#9932CC', '#FFFFFF'));

  // ----- Status 색상 (Column P) -----
  var statusRange = sheet.getRange('P2:P' + lastRow);

  rules.push(createColorRule(statusRange, 'Active', '#32CD32', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Pending', '#808080', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Upcoming', '#1E90FF', '#FFFFFF'));
  rules.push(createColorRule(statusRange, 'Inactive', '#A9A9A9', '#FFFFFF'));

  // ----- 플레이스홀더 스타일 -----
  var placeholderRanges = [
    sheet.getRange('B2:B' + lastRow),  // Name
    sheet.getRange('H2:H' + lastRow),  // Email
    sheet.getRange('I2:I' + lastRow),  // Phone
    sheet.getRange('J2:L' + lastRow),  // Brands
    sheet.getRange('N2:N' + lastRow),  // Slack
    sheet.getRange('O2:O' + lastRow),  // Start Date
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
}

// ========== 하이퍼링크 ==========

function addProfileLinks(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    var id = sheet.getRange(i, 1).getValue();
    var linkCell = sheet.getRange(i, 13); // Column M

    if (id && linkCell.getValue() === 'Link') {
      linkCell.setFormula('=HYPERLINK("https://notion.so/hebe/' + id + '", "Link")');
      linkCell.setFontColor('#1E90FF');
    }
  }
}

// ========== 유틸리티 함수 ==========

// 수동으로 onEdit 트리거 설정 시 사용
function onEditTrigger(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();

  if (row === 1) return; // 헤더 무시

  // Status 변경 시 자동 색상 (이미 조건부 서식으로 처리되지만 백업)
  if (col === 16) {
    var value = range.getValue();
    var colors = {
      'Active': '#32CD32',
      'Pending': '#808080',
      'Upcoming': '#1E90FF',
      'Inactive': '#A9A9A9'
    };
    if (colors[value]) {
      range.setBackground(colors[value]).setFontColor('#FFFFFF');
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
