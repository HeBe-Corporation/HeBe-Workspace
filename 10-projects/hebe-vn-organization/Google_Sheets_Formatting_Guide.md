# Google Sheets 포맷팅 가이드

## 📥 Step 1: Import CSV

1. Google Sheets 열기
2. File → Import → Upload → `HEBE_VN_Staff_Directory.csv`
3. "Replace current sheet" 선택

---

## 🎨 Step 2: 헤더 스타일링

**Row 1 (헤더):**
- 배경색: `#FF6B9D` (HEBE Pink)
- 글자색: `#FFFFFF` (White)
- 글꼴: **Bold**
- 정렬: Center
- 행 높이: 40px
- Freeze Row 1

```
선택: Row 1 전체
Format → Text → Bold
Format → Align → Center
배경색: #FF6B9D
글자색: White
View → Freeze → 1 row
```

---

## 🏢 Step 3: Department별 색상 코딩

**조건부 서식 (Conditional Formatting):**

| Department | 배경색 | Hex Code |
|------------|--------|----------|
| Executive | 🟡 Gold | `#FFD700` |
| Operations | 🟤 Brown | `#D4A574` |
| Finance | 🟢 Green | `#90EE90` |
| Commercial | 🔵 Blue | `#87CEEB` |
| Marketing | 🟣 Purple | `#DDA0DD` |

**적용 방법:**
1. Column G (Department) 선택
2. Format → Conditional formatting
3. "Text contains" → "Executive" → 배경색 Gold
4. 각 Department별 반복

---

## 📊 Step 4: Level별 강조

| Level | 스타일 |
|-------|--------|
| Executive | Bold + Gold 배경 |
| Lead | Bold + 밑줄 |
| Member | Normal |

---

## 🔲 Step 5: 테두리 & 정렬

```
1. 전체 선택 (Ctrl+A)
2. Format → Borders → All borders
3. 테두리 색상: #E0E0E0 (Light Gray)

4. Column A, B: Left align
5. Column C-F: Center
6. Column K-N (Brands): Center
```

---

## 📐 Step 6: 열 너비 조정

| Column | 너비 | 내용 |
|--------|------|------|
| A | 100px | Employee ID |
| B | 150px | Full Name |
| C-D | 100px | Last/First Name |
| E | 180px | Email |
| F | 120px | Phone |
| G-H | 120px | Department/Team |
| I | 150px | Role |
| J | 80px | Level |
| K | 100px | Reports To |
| L-N | 120px | Brands |
| O | 100px | Start Date |
| P | 100px | Slack ID |
| Q | 200px | Notes |

---

## ✨ Step 7: 추가 꾸미기

### Data Validation (드롭다운)

**Department (Column G):**
```
Data → Data validation
Criteria: List of items
Executive, Operations, Finance, Commercial, Marketing
```

**Level (Column J):**
```
Executive, Lead, Member
```

**Brands (Column L-N):**
```
Dasique, Unleashia, ISOI, AGE20's, Dr.Melaxin, MediAnswer, MARY & MAY, Innergarm
```

### Alternating Colors (줄무늬)

```
Format → Alternating colors
Header: #FF6B9D
Color 1: #FFFFFF
Color 2: #FFF0F5 (Lavender Blush)
```

---

## 🖼️ 최종 예시

```
┌──────────┬─────────────┬──────────┬───────────┬─────────────┐
│ Employee │ Full Name   │ Dept     │ Team      │ Level       │
│ ID       │             │          │           │             │
├──────────┼─────────────┼──────────┼───────────┼─────────────┤
│ VN-001   │ Nguyen Anna │ Executive│ Leadership│ ★ Executive │
├──────────┼─────────────┼──────────┼───────────┼─────────────┤
│ VN-301   │ Nguyen Thoai│Commercial│ E-Commerce│ ◆ Lead      │
├──────────┼─────────────┼──────────┼───────────┼─────────────┤
│ VN-302   │ Tran Nguyen │Commercial│ E-Commerce│ • Member    │
└──────────┴─────────────┴──────────┴───────────┴─────────────┘
```

---

## 📱 Notion Embed

Sheets 완성 후:
1. File → Share → Get link
2. "Anyone with link can view"
3. Notion에서 `/embed` → URL 붙여넣기

---

## 💡 Pro Tips

1. **Filter View** 만들기 - 팀별/Level별 필터
2. **Named Range** - 브랜드 리스트 등 자주 쓰는 범위
3. **Protected Range** - 헤더/ID 컬럼 수정 방지
4. **IMPORTRANGE** - 다른 시트에서 참조할 때

