# 🚀 HEBE VN Organization - 설정 가이드

## Step 1: Google Sheets 생성 (5분)

### 1.1 CSV 업로드
1. [Google Sheets](https://sheets.google.com) 열기
2. **빈 스프레드시트** 생성
3. 이름: `HEBE VN Organization Chart`
4. **File → Import → Upload**
5. `HEBE_VN_Organization_v2.csv` 선택
6. Import location: **Replace current sheet**
7. **Import data**

---

## Step 2: Apps Script 적용 (3분)

### 2.1 스크립트 열기
1. **Extensions → Apps Script**
2. 기존 코드 전부 삭제

### 2.2 코드 복사
1. `AppsScript_AutoFormat.js` 파일 열기
2. **전체 선택 (Ctrl+A) → 복사 (Ctrl+C)**
3. Apps Script에 **붙여넣기 (Ctrl+V)**
4. **저장 (Ctrl+S)**

### 2.3 실행
1. 함수 선택: `formatEntireSheet`
2. **Run** 클릭
3. 권한 요청 시 → **허용**
4. 완료 알림 확인!

### 2.4 결과
- ✅ 헤더: Navy + White
- ✅ Department: 색상 뱃지
- ✅ Status: 색상 뱃지
- ✅ 플레이스홀더: 회색
- ✅ 드롭다운: 자동 생성
- ✅ 링크: 클릭 가능
- ✅ 필터: 활성화

---

## Step 3: Notion Database 생성 (10분)

### 3.1 새 페이지 생성
1. Notion 열기
2. `+ New page` → **Database - Full page**
3. 이름: `🌸 HEBE VN Staff Directory`

### 3.2 속성 추가

| Property | Type | Options |
|----------|------|---------|
| ID | Title | |
| Name | Text | |
| Department | Select | Executive, Operations, Finance, Commercial, Marketing |
| Team | Select | Leadership, Warehouse, Accounting, Sales, E-Commerce, Digital, Marketing, ABM, Media, Design, Content |
| Role | Text | |
| Level | Select | Executive, Lead, Member |
| Reports To | Text | (나중에 Relation으로 변경 가능) |
| Email | Email | |
| Phone | Phone | |
| Brand 1 | Select | Dasique, Unleashia, ISOI, AGE20's, Dr.Melaxin, MediAnswer, MARY & MAY, Innergarm |
| Brand 2 | Select | (동일) |
| Brand 3 | Select | (동일) |
| Profile Photo | Files | |
| Slack | Text | |
| Start Date | Date | |
| Status | Status | Active, Pending, Upcoming, Inactive |
| Notes | Text | |

### 3.3 Status 색상 설정
1. Status 속성 클릭
2. 각 옵션 색상 설정:
   - Active → 🟢 Green
   - Pending → ⚪ Gray
   - Upcoming → 🔵 Blue
   - Inactive → ⚫ Dark Gray

### 3.4 Views 생성
1. **Gallery View** - "Team Cards"
   - Card preview: Profile Photo
   - Group by: Team
2. **Table View** - "All Staff"
3. **Board View** - "By Status"
   - Group by: Status

---

## Step 4: Notion Integration 생성 (3분)

### 4.1 Integration 만들기
1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 열기
2. **+ New integration**
3. 이름: `HEBE Sheets Sync`
4. Associated workspace: 선택
5. **Submit**

### 4.2 Token 복사
1. **Internal Integration Secret** 복사
2. 안전한 곳에 저장 (비밀번호 관리자 등)

### 4.3 Database 연결
1. Notion Staff Directory 페이지 열기
2. 우측 상단 `...` → **Connections**
3. `HEBE Sheets Sync` 선택

---

## Step 5: Make 설정 (15분)

### 5.1 계정 생성
1. [make.com](https://make.com) 가입
2. 무료 플랜 선택 (1,000 ops/월)

### 5.2 Connections 추가

**Google Sheets:**
1. Apps → Google Sheets 검색
2. **Create a connection**
3. Google 계정 로그인 → 허용

**Notion:**
1. Apps → Notion 검색
2. **Create a connection**
3. Integration Token 붙여넣기

### 5.3 Scenario 생성

**새 Scenario 만들기:**

```
[Trigger: Google Sheets - Watch Rows]
        ↓
[Action: Notion - Create/Update Database Item]
```

**Google Sheets 설정:**
- Connection: 위에서 만든 것
- Spreadsheet: HEBE VN Organization Chart
- Sheet: Sheet1
- Trigger: Watch for new or updated rows
- Column range: A:Q

**Notion 설정:**
- Connection: 위에서 만든 것
- Database: HEBE VN Staff Directory
- Mapping:

| Sheets Column | Notion Property |
|---------------|-----------------|
| A (ID) | ID (Title) |
| B (Name) | Name |
| C (Department) | Department |
| D (Team) | Team |
| E (Role) | Role |
| F (Level) | Level |
| G (Reports To) | Reports To |
| H (Email) | Email |
| I (Phone) | Phone |
| J (Brand 1) | Brand 1 |
| K (Brand 2) | Brand 2 |
| L (Brand 3) | Brand 3 |
| N (Slack) | Slack |
| O (Start Date) | Start Date |
| P (Status) | Status |
| Q (Notes) | Notes |

### 5.4 Scenario 활성화
1. **Save**
2. **Turn ON** (하단 토글)
3. Schedule: Every 15 minutes (또는 원하는 간격)

---

## Step 6: 테스트 (5분)

### 6.1 Sheets에서 수정
1. Google Sheets 열기
2. 아무 직원 행 선택
3. Status를 `Pending` → `Active`로 변경
4. Notes에 테스트 메모 추가

### 6.2 Make 실행
1. Make Scenario 열기
2. **Run once** 클릭
3. 성공 확인

### 6.3 Notion 확인
1. Notion Staff Directory 열기
2. 해당 직원 카드 확인
3. 변경사항 반영되었는지 확인

---

## Step 7: 직원 공유 (3분)

### 7.1 Sheets 공유
1. Google Sheets **Share** 클릭
2. **Anyone with the link** → **Editor**
3. 링크 복사 → 직원들에게 전달

### 7.2 안내 메시지 (복사해서 사용)

```
📋 HEBE VN Organization Chart

안녕하세요! 조직도 정보 입력 부탁드립니다.

🔗 링크: [Sheets 링크]

✏️ 입력 항목:
- 이름 (Name)
- 이메일 (Email)
- 연락처 (Phone)
- 담당 브랜드 (Brand 1, 2, 3)
- 입사일 (Start Date)
- Slack ID

⚠️ 주의사항:
- ID, Department, Team, Role은 수정하지 마세요
- 드롭다운에서 선택해주세요
- 완료 후 Status를 "Active"로 변경해주세요

감사합니다! 🙏
```

---

## ✅ 체크리스트

- [ ] Google Sheets 생성 & CSV 업로드
- [ ] Apps Script 적용 & 실행
- [ ] Notion Database 생성
- [ ] Notion Integration 생성
- [ ] Make 계정 생성
- [ ] Make Connections 추가 (Sheets, Notion)
- [ ] Make Scenario 생성 & 활성화
- [ ] 테스트 완료
- [ ] 직원 공유

---

## 🆘 문제 해결

| 문제 | 해결 |
|------|------|
| Apps Script 권한 오류 | Advanced → Go to project (unsafe) |
| Make 연결 실패 | Token 재확인, Database 공유 확인 |
| Notion 업데이트 안됨 | Database ID 확인, Connection 확인 |
| 드롭다운 안 뜸 | Apps Script `refreshDropdowns` 실행 |

---

## 🎉 완료!

모든 설정이 끝나면:
- Sheets에서 데이터 입력 → Notion 자동 업데이트
- 예쁜 조직도 완성
- 직원들이 직접 정보 입력 가능

다음 단계:
- Looker Studio 대시보드 연결
- Slack 알림 추가
- 승인 워크플로우 구축

