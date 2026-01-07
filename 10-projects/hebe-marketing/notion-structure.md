# HeBe Marketing Hub - Notion Structure

> Notion에서 복사-붙여넣기로 바로 사용할 수 있는 구조

---

## Page Hierarchy

```
🌸 HeBe Marketing Hub
│
├── 📊 2026 Budget Overview
│   └── (Brand Budgets DB 임베드)
│
├── 💰 Brand Budgets [Database]
│   ├── View: 📊 Overview (전체)
│   ├── View: 🇻🇳 Vietnam
│   └── View: 🇰🇭 Cambodia
│
├── 📋 Monthly Plans [Database]
│   ├── View: 📋 All Plans
│   ├── View: ⏳ Pending Approval
│   ├── View: ✅ Approved
│   ├── View: 📅 Calendar
│   └── View: 🏷️ By Brand
│
├── 💰 Spending Tracker [Database]
│   ├── View: 💰 All Spending
│   ├── View: 📊 By Category
│   ├── View: 📅 This Month
│   └── View: 🏷️ By Brand
│
└── 📖 How to Use (가이드)
```

---

## Database 1: Brand Budgets

### Properties (속성)

| 속성명 | 타입 | 설정 |
|--------|------|------|
| Brand | Title | - |
| Country | Multi-select | `Vietnam`, `Cambodia` |
| Total Budget (KRW) | Number | Format: 원화 (₩) |
| Vietnam Cash | Number | Format: 원화 (₩) |
| Vietnam FOC | Number | Format: 원화 (₩) |
| Cambodia Cash | Number | Format: 원화 (₩) |
| Budget Type | Select | `본사지원`, `HeBe자체`, `FOC Only` |
| Payment Rule | Select | `월별고정`, `사용분지급` |
| Status | Select | `Active`, `Pending`, `Inactive` |
| Remarks | Text | - |

### Views

**📊 Overview**
- Type: Table
- Sort: Total Budget (Descending)
- Show all properties

**🇻🇳 Vietnam**
- Type: Table
- Filter: Country contains "Vietnam"
- Show: Brand, Vietnam Cash, Vietnam FOC, Payment Rule, Status

**🇰🇭 Cambodia**
- Type: Table
- Filter: Country contains "Cambodia"
- Show: Brand, Cambodia Cash, Payment Rule, Status

---

## Database 2: Monthly Plans

### Properties (속성)

| 속성명 | 타입 | 설정 |
|--------|------|------|
| Plan Title | Title | 예: "Medianswer VN - Jan 2026" |
| Brand | Relation | → Brand Budgets |
| Country | Select | `Vietnam`, `Cambodia` |
| Month | Date | - |
| Submitted By | Person | - |
| Approval Status | Select | `Draft`, `Submitted`, `Approved`, `Rejected`, `Revision` |
| Approved By | Person | - |
| Approved Date | Date | - |
| --- | --- | --- |
| Seeding | Number | ₩ |
| KOL/Influencer | Number | ₩ |
| Paid Ads | Number | ₩ |
| Live Commerce | Number | ₩ |
| Affiliate | Number | ₩ |
| Content Production | Number | ₩ |
| Offline/Popup | Number | ₩ |
| Trade Promo | Number | ₩ |
| Other | Number | ₩ |
| --- | --- | --- |
| Total Planned | Formula | `prop("Seeding") + prop("KOL/Influencer") + prop("Paid Ads") + prop("Live Commerce") + prop("Affiliate") + prop("Content Production") + prop("Offline/Popup") + prop("Trade Promo") + prop("Other")` |
| Total Spent | Rollup | → Spending Tracker, Sum of Amount |
| Remaining | Formula | `prop("Total Planned") - prop("Total Spent")` |
| Progress % | Formula | `round(prop("Total Spent") / prop("Total Planned") * 100)` |
| Notes | Text | - |

### Views

**📋 All Plans**
- Type: Table
- Sort: Month (Descending)

**⏳ Pending Approval**
- Type: Gallery
- Filter: Approval Status = "Submitted"
- Card preview: Notes

**✅ Approved**
- Type: Table
- Filter: Approval Status = "Approved"

**📅 Calendar**
- Type: Calendar
- Date property: Month

**🏷️ By Brand**
- Type: Board
- Group by: Brand

---

## Database 3: Spending Tracker

### Properties (속성)

| 속성명 | 타입 | 설정 |
|--------|------|------|
| Item | Title | 지출 내역 |
| Monthly Plan | Relation | → Monthly Plans |
| Brand | Relation | → Brand Budgets |
| Category | Select | `Seeding`, `KOL/Influencer`, `Paid Ads`, `Live Commerce`, `Affiliate`, `Content Production`, `Offline/Popup`, `Trade Promo`, `Other` |
| Amount (KRW) | Number | ₩ |
| Amount (Local) | Number | - |
| Currency | Select | `KRW`, `VND`, `USD` |
| Date | Date | - |
| Receipt/Evidence | URL | Google Drive 링크 |
| Submitted By | Person | - |
| Approval Status | Select | `Pending`, `Approved`, `Rejected` |

### Views

**💰 All Spending**
- Type: Table
- Sort: Date (Descending)

**📊 By Category**
- Type: Board
- Group by: Category

**📅 This Month**
- Type: Table
- Filter: Date is within "This month"

**🏷️ By Brand**
- Type: Board
- Group by: Brand

---

## Color Scheme (뷰티 브랜드 느낌)

### Status Colors
| Status | Color |
|--------|-------|
| Draft | Gray |
| Submitted | Blue |
| Approved | Green |
| Rejected | Red |
| Revision | Orange |

### Brand Colors (제안)
| Brand | Color |
|-------|-------|
| Medianswer | Pink |
| Mary&May | Purple |
| AGE20'S | Red |
| ISOI | Green |
| WETTRUST | Blue |
| DR.Melaxin | Orange |
| UNLEASHIA | Yellow |
| Dasique | Brown |

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     MONTHLY CYCLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [담당자]                      [Mike]                        │
│                                                              │
│  1. Monthly Plan 작성          4. Plan 검토                  │
│     - 항목별 예산 입력            - Approved / Rejected       │
│     - Notes에 이유 설명                                       │
│                                                              │
│  2. Status → "Submitted"       5. 코멘트 추가 (필요시)        │
│                                                              │
│  3. 알림 (Notion 멘션)                                        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  [담당자 - 승인 후]                                           │
│                                                              │
│  6. 예산 집행                                                 │
│                                                              │
│  7. Spending Tracker에 기록                                   │
│     - 항목, 금액, 증빙 URL                                    │
│                                                              │
│  8. 잔액 자동 계산됨                                          │
│     (Remaining = Planned - Spent)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Copy-Paste Templates

### Brand Budgets 초기 데이터

아래 내용을 Notion DB에 입력:

| Brand | Country | Total | VN Cash | VN FOC | KH Cash | Type | Rule | Status |
|-------|---------|-------|---------|--------|---------|------|------|--------|
| Medianswer | Vietnam, Cambodia | 200,000,000 | 150,000,000 | 0 | 50,000,000 | 본사지원 | 사용분지급 | Active |
| Mary&May | Vietnam, Cambodia | 100,000,000 | 20,000,000 | 0 | 80,000,000 | 본사지원 | 사용분지급 | Active |
| AGE20'S | Vietnam | 300,000,000 | 210,000,000 | 90,000,000 | 0 | 본사지원 | 월별고정 | Active |
| ISOI | Vietnam | 120,000,000 | 100,000,000 | 20,000,000 | 0 | 본사지원 | 사용분지급 | Active |
| WETTRUST | Vietnam | 100,000,000 | 0 | 100,000,000 | 0 | 본사지원 | 사용분지급 | Active |
| DR.Melaxin | Vietnam | 300,000,000 | 300,000,000 | 0 | 0 | 본사지원 | 사용분지급 | Active |
| UNLEASHIA | Vietnam | 0 | 0 | 18,000,000 | 0 | FOC Only | 월별고정 | Active |
| Dasique | Vietnam, Cambodia | - | - | - | - | HeBe자체 | - | Active |

> UNLEASHIA FOC: 월 150만 × 12개월 = 1,800만원
> Dasique: 금액 미정 (Performance Marketing)

---

## Next Steps

1. [ ] Notion 워크스페이스 생성
2. [ ] "HeBe Marketing Hub" 페이지 생성
3. [ ] Brand Budgets DB 생성 + 데이터 입력
4. [ ] Monthly Plans DB 생성
5. [ ] Spending Tracker DB 생성
6. [ ] Views 설정
7. [ ] 팀 초대

---

*Created: 2026-01-05*
