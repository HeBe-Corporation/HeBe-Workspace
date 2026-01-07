# Sheets ↔ Notion 자동화 가이드

## 🎯 목표

```
Google Sheets (데이터 입력)
        ↕️ 자동 동기화
Notion Database (비주얼 + 운영)
```

---

## 🛠️ 도구 비교

| 도구 | 가격 | 장점 | 단점 |
|------|------|------|------|
| **Make** | 무료 1,000 ops/월 | UI 쉬움, 템플릿 많음 | 복잡한 로직 어려움 |
| **n8n** | Self-host 무료 | 무제한, 커스텀 가능 | 설치 필요 |
| **Zapier** | 무료 100 tasks/월 | 가장 쉬움 | 비쌈, 제한 많음 |

**추천: Make** (시작하기 쉬움) 또는 **n8n** (장기적으로 저렴)

---

## 📋 Make 설정 가이드

### Step 1: 계정 & 연결

1. [make.com](https://make.com) 가입
2. Connections 추가:
   - Google Sheets (OAuth)
   - Notion (Internal Integration)

### Step 2: Notion Integration 생성

1. [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. "New Integration" 클릭
3. 이름: `HEBE Sheets Sync`
4. Capabilities: Read/Update/Insert content
5. **Integration Token 복사** (저장!)

### Step 3: Notion Database 설정

**Staff Directory DB 속성:**

| Property | Type | 설명 |
|----------|------|------|
| ID | Title | Employee ID |
| Name | Text | Full Name |
| Department | Select | Executive, Operations, Finance, Commercial, Marketing |
| Team | Select | Leadership, Warehouse, Accounting, Sales, E-Commerce, Digital, ABM, Media, Design, Content |
| Role | Text | Job Title |
| Level | Select | Executive, Lead, Member |
| Reports To | Relation | → Staff Directory |
| Email | Email | |
| Phone | Phone | |
| Brand 1 | Select | 브랜드 목록 |
| Brand 2 | Select | |
| Brand 3 | Select | |
| Profile Link | URL | Google Drive 프로필 |
| Slack | Text | Slack ID |
| Start Date | Date | |
| Status | Status | Active, Pending, Upcoming, Inactive |
| Notes | Text | |

### Step 4: Make Scenario 생성

**Trigger: Google Sheets → Watch Rows**
```
Spreadsheet: HEBE_VN_Organization
Sheet: Staff Directory
Trigger: When row is added or updated
```

**Action: Notion → Create/Update Database Item**
```
Database: Staff Directory
Mapping:
  - ID → Title (ID)
  - Name → Name
  - Department → Department (Select)
  - Team → Team (Select)
  - Role → Role
  - Level → Level (Select)
  - Email → Email
  - Status → Status
  ...
```

### Step 5: 역방향 동기화 (Notion → Sheets)

**Trigger: Notion → Watch Database Items**
```
Database: Staff Directory
Trigger: When item is updated
```

**Action: Google Sheets → Update Row**
```
Search: ID column = Notion ID
Update: Changed fields only
```

---

## 📋 n8n 설정 가이드

### Step 1: n8n 설치

**Option A: n8n Cloud**
```
https://n8n.io/cloud
월 $20부터
```

**Option B: Self-host (무료)**
```bash
# Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Step 2: Workflow 생성

```
[Google Sheets Trigger]
        ↓
[IF: Row Changed?]
        ↓
[Notion: Update/Create]
        ↓
[Slack: Notify] (optional)
```

### Step 3: n8n Workflow JSON

```json
{
  "name": "Sheets to Notion Sync",
  "nodes": [
    {
      "name": "Google Sheets Trigger",
      "type": "n8n-nodes-base.googleSheetsTrigger",
      "parameters": {
        "operation": "onRowAdded",
        "sheetId": "YOUR_SHEET_ID"
      }
    },
    {
      "name": "Notion",
      "type": "n8n-nodes-base.notion",
      "parameters": {
        "operation": "create",
        "databaseId": "YOUR_DATABASE_ID",
        "properties": {
          "ID": "={{ $json.ID }}",
          "Name": "={{ $json.Name }}",
          "Department": "={{ $json.Department }}",
          "Status": "={{ $json.Status }}"
        }
      }
    }
  ]
}
```

---

## 🎨 Google Sheets 스타일링 (Apps Script)

### 자동 색상 코딩

```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var col = range.getColumn();

  // Department 색상 (Column C)
  if (col == 3) {
    var value = range.getValue();
    var colors = {
      'Executive': '#FFD700',
      'Operations': '#D4A574',
      'Finance': '#90EE90',
      'Commercial': '#87CEEB',
      'Marketing': '#DDA0DD'
    };
    if (colors[value]) {
      range.setBackground(colors[value]);
    }
  }

  // Status 색상 (Column P)
  if (col == 16) {
    var value = range.getValue();
    var colors = {
      'Active': '#90EE90',
      'Pending': '#FFE4B5',
      'Upcoming': '#87CEEB',
      'Inactive': '#D3D3D3'
    };
    if (colors[value]) {
      range.setBackground(colors[value]);
    }
  }
}
```

### Link 자동 하이퍼링크

```javascript
function createProfileLinks() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var id = data[i][0]; // Column A: ID
    var linkCell = sheet.getRange(i + 1, 13); // Column M: Profile Link

    if (id && linkCell.getValue() == 'Link') {
      // Notion 페이지 링크로 연결
      var notionUrl = 'https://notion.so/hebe/' + id;
      linkCell.setFormula('=HYPERLINK("' + notionUrl + '", "Link")');
    }
  }
}
```

---

## 🔄 동기화 시나리오

### 1. 신규 직원 추가

```
1. Sheets에 새 행 추가
2. Make/n8n이 감지
3. Notion DB에 자동 생성
4. Slack 알림 (optional)
```

### 2. 정보 수정

```
1. Sheets에서 수정 (예: Status 변경)
2. Make/n8n이 감지
3. Notion 해당 항목 업데이트
```

### 3. Notion에서 수정

```
1. Notion에서 수정 (예: Brand 배정)
2. Make/n8n이 감지
3. Sheets 해당 행 업데이트
```

---

## 💰 비용 예상

| 시나리오 | Make | n8n Cloud | n8n Self-host |
|----------|------|-----------|---------------|
| 27명 직원, 월 100회 변경 | 무료 | 무료 | 무료 |
| 확장 (100명, 월 500회) | ~$9/월 | $20/월 | 무료 |

---

## ✅ 체크리스트

- [ ] Google Sheets 생성 & 포맷팅
- [ ] Notion Database 생성 & 속성 설정
- [ ] Notion Integration 생성
- [ ] Make/n8n 계정 생성
- [ ] Sheets → Notion 동기화 설정
- [ ] Notion → Sheets 역방향 동기화 설정
- [ ] 테스트: 새 행 추가
- [ ] 테스트: 수정 동기화
- [ ] Apps Script 색상 코딩 추가

---

## 🚀 다음 단계

1. **기본 동기화** 먼저 완성
2. **승인 워크플로우** 추가 (Sheets에서 승인 → Notion 상태 변경)
3. **Slack 연동** (변경사항 알림)
4. **대시보드** Looker Studio 연결

