/**
 * HEBE VN Organization Chart - Beauty Theme
 * 뷰티 회사에 맞는 부드러운 색상 조합
 */

function formatEntireSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // 1. 헤더 스타일링 (로즈 핑크)
  formatHeader(sheet, lastCol);

  // 2. 열 너비 설정
  setColumnWidths(sheet);

  // 3. 행 높이 설정
  setRowHeights(sheet, lastRow);

  // 4. 데이터 정렬
  alignData(sheet, lastRow, lastCol);

  // 5. 조건부 서식 (뷰티 테마)
  applyConditionalFormatting(sheet, lastRow);

  // 6. 데이터 유효성 검사
  addDataValidation(sheet, lastRow);

  // 7. Link 스타일
  styleLinkColumn(sheet, lastRow);

  // 8. 행 고정
  sheet.setFrozenRows(1);

  // 9. 교대 색상 (줄무늬)
  applyAlternatingColors(sheet, lastRow, lastCol);

  SpreadsheetApp.getUi().alert('✅ Beauty Theme 적용 완료!\n\n예쁜 HEBE 조직도가 완성되었습니다 🌸');
}

// ========== 헤더 스타일링 ==========

function formatHeader(sheet, lastCol) {
  var headerRange = sheet.getRange(1, 1, 1, lastCol);

  headerRange
    .setBackground('#E91E63')      // 핑크
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
    1: 80, 2: 130, 3: 95, 4: 100, 5: 145, 6: 75, 7: 85,
    8: 170, 9: 100, 10: 95, 11: 95, 12: 95, 13: 60, 14: 85, 15: 100, 16: 90, 17: 160
  };
  for (var col in widths) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  }
}

// ========== 행 높이 설정 ==========

function setRowHeights(sheet, lastRow) {
  for (var i = 2; i <= lastRow; i++) {
    sheet.setRowHeight(i, 32);
  }
}

// ========== 데이터 정렬 ==========

function alignData(sheet, lastRow, lastCol) {
  if (lastRow < 2) return;

  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange.setVerticalAlignment('middle');
  dataRange.setFontSize(10);

  // Left align
  sheet.getRange(2, 1, lastRow - 1, 2).setHorizontalAlignment('left');
  sheet.getRange(2, 5, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 8, lastRow - 1, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 17, lastRow - 1, 1).setHorizontalAlignment('left');

  // Center align
  sheet.getRange(2, 3, lastRow - 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, 6, lastRow - 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, 9, lastRow - 1, 5).setHorizontalAlignment('center');
  sheet.getRange(2, 14, lastRow - 1, 3).setHorizontalAlignment('center');
}

// ========== 조건부 서식 (뷰티 테마) ==========

function applyConditionalFormatting(sheet, lastRow) {
  sheet.clearConditionalFormatRules();
  var rules = [];

  // ===== Department 색상 (부드러운 파스텔) =====
  var deptRange = sheet.getRange('C2:C' + lastRow);

  // Executive - 로즈 골드
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Executive')
    .setBackground('#F8BBD9')
    .setFontColor('#880E4F')
    .setBold(true)
    .setRanges([deptRange]).build());

  // Operations - 웜 베이지
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Operations')
    .setBackground('#D7CCC8')
    .setFontColor('#4E342E')
    .setBold(true)
    .setRanges([deptRange]).build());

  // Finance - 민트 그린
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Finance')
    .setBackground('#C8E6C9')
    .setFontColor('#1B5E20')
    .setBold(true)
    .setRanges([deptRange]).build());

  // Commercial - 스카이 블루
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Commercial')
    .setBackground('#BBDEFB')
    .setFontColor('#0D47A1')
    .setBold(true)
    .setRanges([deptRange]).build());

  // Marketing - 라벤더
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Marketing')
    .setBackground('#E1BEE7')
    .setFontColor('#4A148C')
    .setBold(true)
    .setRanges([deptRange]).build());

  // ===== Team 색상 (Department 내 세부) =====
  var teamRange = sheet.getRange('D2:D' + lastRow);

  // Leadership
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Leadership')
    .setBackground('#FCE4EC')
    .setFontColor('#AD1457')
    .setRanges([teamRange]).build());

  // Warehouse
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Warehouse')
    .setBackground('#EFEBE9')
    .setFontColor('#5D4037')
    .setRanges([teamRange]).build());

  // Accounting
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Accounting')
    .setBackground('#E8F5E9')
    .setFontColor('#2E7D32')
    .setRanges([teamRange]).build());

  // Sales
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Sales')
    .setBackground('#E3F2FD')
    .setFontColor('#1565C0')
    .setRanges([teamRange]).build());

  // E-Commerce
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('E-Commerce')
    .setBackground('#E1F5FE')
    .setFontColor('#0277BD')
    .setRanges([teamRange]).build());

  // Digital
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Digital')
    .setBackground('#EDE7F6')
    .setFontColor('#512DA8')
    .setRanges([teamRange]).build());

  // Marketing (team)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Marketing')
    .setBackground('#F3E5F5')
    .setFontColor('#7B1FA2')
    .setRanges([teamRange]).build());

  // ABM
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('ABM')
    .setBackground('#F8BBD0')
    .setFontColor('#C2185B')
    .setRanges([teamRange]).build());

  // Media
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Media')
    .setBackground('#FFCCBC')
    .setFontColor('#D84315')
    .setRanges([teamRange]).build());

  // Design
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Design')
    .setBackground('#FFE0B2')
    .setFontColor('#E65100')
    .setRanges([teamRange]).build());

  // Content
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Content')
    .setBackground('#FFF9C4')
    .setFontColor('#F9A825')
    .setRanges([teamRange]).build());

  // ===== Level 색상 =====
  var levelRange = sheet.getRange('F2:F' + lastRow);

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Executive')
    .setBackground('#FF80AB')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([levelRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Lead')
    .setBackground('#CE93D8')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([levelRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Member')
    .setBackground('#B0BEC5')
    .setFontColor('#37474F')
    .setRanges([levelRange]).build());

  // ===== Status 색상 =====
  var statusRange = sheet.getRange('P2:P' + lastRow);

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Active')
    .setBackground('#A5D6A7')
    .setFontColor('#1B5E20')
    .setBold(true)
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#FFCC80')
    .setFontColor('#E65100')
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Upcoming')
    .setBackground('#81D4FA')
    .setFontColor('#01579B')
    .setRanges([statusRange]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Inactive')
    .setBackground('#BDBDBD')
    .setFontColor('#424242')
    .setRanges([statusRange]).build());

  // ===== 플레이스홀더 (회색) =====
  var placeholderRanges = [
    sheet.getRange('B2:B' + lastRow),
    sheet.getRange('H2:H' + lastRow),
    sheet.getRange('I2:I' + lastRow),
    sheet.getRange('J2:L' + lastRow),
    sheet.getRange('N2:N' + lastRow),
    sheet.getRange('O2:O' + lastRow),
  ];

  ['-', 'email', 'phone', 'slack', 'yyyy-mm-dd'].forEach(function(text) {
    placeholderRanges.forEach(function(range) {
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(text)
        .setBackground('#FAFAFA')
        .setFontColor('#BDBDBD')
        .setItalic(true)
        .setRanges([range]).build());
    });
  });

  sheet.setConditionalFormatRules(rules);
}

// ========== 데이터 유효성 검사 ==========

function addDataValidation(sheet, lastRow) {
  if (lastRow < 2) return;

  sheet.getRange('C2:C' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Executive', 'Operations', 'Finance', 'Commercial', 'Marketing'])
      .build());

  sheet.getRange('D2:D' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Leadership', 'Warehouse', 'Accounting', 'Sales', 'E-Commerce', 'Digital', 'Marketing', 'ABM', 'Media', 'Design', 'Content'])
      .build());

  sheet.getRange('F2:F' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Executive', 'Lead', 'Member'])
      .build());

  sheet.getRange('P2:P' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Active', 'Pending', 'Upcoming', 'Inactive'])
      .build());

  sheet.getRange('J2:L' + lastRow).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['-', 'Dasique', 'Unleashia', 'ISOI', "AGE20's", 'Dr.Melaxin', 'MediAnswer', 'MARY & MAY', 'Innergarm', 'All Brands'])
      .build());

  // Link 열 유효성 제거
  sheet.getRange('M2:M' + lastRow).clearDataValidations();
}

// ========== Link 스타일 ==========

function styleLinkColumn(sheet, lastRow) {
  var linkRange = sheet.getRange('M2:M' + lastRow);
  linkRange.clearDataValidations();
  linkRange.setFontColor('#E91E63');
  linkRange.setFontWeight('bold');
}

// ========== 교대 색상 (줄무늬) ==========

function applyAlternatingColors(sheet, lastRow, lastCol) {
  // 기존 밴딩 제거
  var bandings = sheet.getBandings();
  for (var i = 0; i < bandings.length; i++) {
    bandings[i].remove();
  }

  // 새 밴딩 적용 (부드러운 핑크 줄무늬)
  if (lastRow > 1) {
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.PINK, false, false);
  }
}

// ========== 메뉴 ==========

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌸 HEBE Tools')
    .addItem('🎨 Beauty Theme 적용', 'formatEntireSheet')
    .addItem('🔄 색상만 새로고침', 'refreshColors')
    .addItem('📋 드롭다운 새로고침', 'refreshDropdowns')
    .addToUi();
}

function refreshColors() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  applyConditionalFormatting(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ 색상이 새로고침되었습니다.');
}

function refreshDropdowns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  addDataValidation(sheet, sheet.getLastRow());
  SpreadsheetApp.getUi().alert('✅ 드롭다운이 새로고침되었습니다.');
}
