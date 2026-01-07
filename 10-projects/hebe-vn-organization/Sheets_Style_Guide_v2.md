# Google Sheets 스타일 가이드 v2

> 첨부한 이미지처럼 깔끔하게 만들기

---

## 🎨 컬러 팔레트

### 헤더
```
배경: #1E3A5F (Dark Navy)
글자: #FFFFFF (White)
```

### Department 뱃지
```
Executive   : #FFD700 (Gold)       - 글자 #000000
Operations  : #8B4513 (Brown)      - 글자 #FFFFFF
Finance     : #228B22 (Green)      - 글자 #FFFFFF
Commercial  : #4169E1 (Royal Blue) - 글자 #FFFFFF
Marketing   : #9932CC (Purple)     - 글자 #FFFFFF
```

### Team 뱃지 (Commercial 세부)
```
Sales       : #1E90FF (Blue)
E-Commerce  : #00CED1 (Cyan)
```

### Team 뱃지 (Marketing 세부)
```
Digital     : #9370DB (Medium Purple)
ABM         : #BA55D3 (Orchid)
Media       : #DA70D6 (Orchid)
Design      : #EE82EE (Violet)
Content     : #DDA0DD (Plum)
```

### Status 뱃지
```
Active      : #32CD32 (Lime Green) - 글자 #FFFFFF
Pending     : #808080 (Gray)       - 글자 #FFFFFF
Upcoming    : #1E90FF (Blue)       - 글자 #FFFFFF
Inactive    : #A9A9A9 (Dark Gray)  - 글자 #FFFFFF
```

### 플레이스홀더 (빈 칸)
```
배경: #F5F5F5 (Light Gray)
글자: #A0A0A0 (Gray)
텍스트: "email", "phone", "yyyy-mm-dd", "-"
```

---

## 📐 레이아웃

### 헤더 (Row 1)
```
높이: 40px
폰트: 12pt, Bold
정렬: Center
테두리: 없음 (깔끔하게)
```

### 데이터 행
```
높이: 35px
폰트: 11pt, Regular
정렬:
  - ID, Name: Left
  - Department, Team, Level, Status: Center
  - Email, Phone: Left
  - Brands: Center
  - Notes: Left
```

### 열 너비
```
A (ID)         : 80px
B (Name)       : 140px
C (Department) : 100px
D (Team)       : 100px
E (Role)       : 150px
F (Level)      : 80px
G (Reports To) : 80px
H (Email)      : 160px
I (Phone)      : 100px
J-L (Brands)   : 100px each
M (Profile)    : 60px
N (Slack)      : 80px
O (Start Date) : 100px
P (Status)     : 100px
Q (Notes)      : 150px
```

---

## 🔧 Google Sheets 설정

### 1. 조건부 서식 (Conditional Formatting)

**Department 열 (C):**
```
Format → Conditional formatting → Add rule

Rule 1:
- Range: C2:C100
- Format cells if: Text contains "Executive"
- Formatting style: Background #FFD700, Bold

Rule 2:
- Text contains "Operations" → Background #8B4513, White text

Rule 3:
- Text contains "Finance" → Background #228B22, White text

Rule 4:
- Text contains "Commercial" → Background #4169E1, White text

Rule 5:
- Text contains "Marketing" → Background #9932CC, White text
```

**Status 열 (P):**
```
Rule 1: Text contains "Active" → Background #32CD32, White text
Rule 2: Text contains "Pending" → Background #808080, White text
Rule 3: Text contains "Upcoming" → Background #1E90FF, White text
```

**플레이스홀더 (빈 칸 스타일):**
```
Rule: Text is exactly "email" → Background #F5F5F5, Gray text #A0A0A0
Rule: Text is exactly "phone" → Background #F5F5F5, Gray text #A0A0A0
Rule: Text is exactly "-" → Background #F5F5F5, Gray text #A0A0A0
Rule: Text contains "yyyy" → Background #F5F5F5, Gray text #A0A0A0
```

### 2. 데이터 유효성 검사 (Data Validation)

**Department (C열):**
```
Data → Data validation
Criteria: List of items
Executive, Operations, Finance, Commercial, Marketing
```

**Team (D열):**
```
Leadership, Warehouse, Accounting, Sales, E-Commerce, Digital, ABM, Media, Design, Content
```

**Level (F열):**
```
Executive, Lead, Member
```

**Status (P열):**
```
Active, Pending, Upcoming, Inactive
```

**Brands (J-L열):**
```
Dasique, Unleashia, ISOI, AGE20's, Dr.Melaxin, MediAnswer, MARY & MAY, Innergarm, -
```

### 3. 하이퍼링크 (Profile Link)

**M열 (Profile Link):**
```
=HYPERLINK("https://notion.so/hebe/"&A2, "Link")
```

이 수식을 M2에 넣고 아래로 드래그

### 4. 필터 뷰

```
Data → Create a filter
저장할 뷰:
- All Staff
- By Department
- Active Only
- Pending (입력 필요)
```

### 5. 행 고정

```
View → Freeze → 1 row
```

### 6. 시트 보호

```
Data → Protect sheets and ranges
- 헤더 행 (Row 1): 편집 불가
- ID 열 (Column A): 편집 불가
```

---

## 📱 최종 모습

```
┌────────┬──────────────┬───────────┬────────────┬─────────┬────────┐
│   ID   │    Name      │ Department│    Team    │  Status │  Link  │
├────────┼──────────────┼───────────┼────────────┼─────────┼────────┤
│ VN-001 │ Nguyen Anna  │ Executive │ Leadership │ Active  │  Link  │
│        │              │  (Gold)   │            │ (Green) │   ↗    │
├────────┼──────────────┼───────────┼────────────┼─────────┼────────┤
│ VN-301 │ Nguyen Thoai │Commercial │ E-Commerce │ Active  │  Link  │
│        │              │  (Blue)   │  (Cyan)    │ (Green) │   ↗    │
├────────┼──────────────┼───────────┼────────────┼─────────┼────────┤
│ VN-501 │ Nguyen Ly    │ Marketing │    ABM     │ Pending │  Link  │
│        │              │ (Purple)  │  (Orchid)  │ (Gray)  │   ↗    │
├────────┼──────────────┼───────────┼────────────┼─────────┼────────┤
│ VN-102 │      -       │ Operations│ Warehouse  │ Pending │  Link  │
│        │   (gray)     │  (Brown)  │            │ (Gray)  │   ↗    │
└────────┴──────────────┴───────────┴────────────┴─────────┴────────┘
```

---

## ✅ 체크리스트

- [ ] CSV Import
- [ ] 헤더 스타일링 (Navy + White)
- [ ] 열 너비 조정
- [ ] 행 높이 조정 (35px)
- [ ] Department 조건부 서식
- [ ] Status 조건부 서식
- [ ] 플레이스홀더 조건부 서식
- [ ] Data Validation 드롭다운
- [ ] Profile Link 하이퍼링크
- [ ] 필터 뷰 생성
- [ ] 헤더 행 고정
- [ ] 시트 보호

