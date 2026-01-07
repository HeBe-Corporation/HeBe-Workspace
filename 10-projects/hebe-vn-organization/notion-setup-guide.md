# Notion 조직도 세팅 가이드

## 🎨 디자인 컨셉

**테마:** Soft Pink & Clean White (뷰티 브랜드 느낌)
**폰트:** Notion 기본 (Serif for headers)
**아이콘:** Emoji + Notion 기본 아이콘

---

## 📐 페이지 구조

```
🌸 HEBE Vietnam
├── 💎 Leadership (Toggle)
├── 🏢 Teams (Gallery View - 카드형)
│   ├── 📦 Warehouse & Accounting
│   ├── 💼 Sales
│   ├── 🛒 E-Commerce
│   ├── 📱 Digital
│   └── 🎨 Marketing
├── 💖 Brands (Gallery View - 이미지 카드)
├── 👥 People Directory (Table View)
├── 📋 Approval Flow (Board View)
└── 🗓️ Quick Links (Embed)
```

---

## 🖼️ Notion 설정 방법

### 1. Cover Image
- **추천:** 그라데이션 핑크 또는 브랜드 사진
- **높이:** Full (페이지 상단 클릭 → Cover → Reposition)

### 2. Icon
- **추천:** 🌸 또는 HEBE 로고

### 3. Layout
- **Full width:** ON
- **Small text:** OFF (가독성)

---

## 🗂️ Database 설정

### People Directory DB

**Properties:**
| Property | Type | Options |
|----------|------|---------|
| Name | Title | |
| Photo | Files | 프로필 사진 |
| Team | Select | Accounting, Sales, E-Commerce, Digital, Marketing |
| Role | Select | CEO, Manager, Lead, Member |
| Level | Select | 대표, 팀장, 팀원 |
| Email | Email | |
| Phone | Phone | |
| Brands | Multi-select | Dasique, Unleashia, ISOI, AGE20's, Dr.Melaxin, MediAnswer, MARY&MAY, Innergarm |
| Reports To | Relation | → People Directory |
| Start Date | Date | |
| Slack ID | Text | |

**Views:**
1. **Gallery View** - 팀별 필터, 프로필 카드
2. **Table View** - 전체 리스트
3. **Board View** - 팀별 칸반

---

### Brands DB

**Properties:**
| Property | Type |
|----------|------|
| Name | Title |
| Logo | Files |
| Category | Select |
| Hero Product | Text |
| Description | Text |
| Color | Select (브랜드 컬러) |
| Team Members | Relation → People |

---

## 🎨 Color Palette (브랜드별)

```
Dasique      : #F5A5B8 (Soft Pink)
Unleashia    : #9B59B6 (Purple Glitter)
ISOI         : #E74C3C (Rose Red)
AGE20's      : #F39C12 (Gold)
Dr.Melaxin   : #3498DB (Medical Blue)
MediAnswer   : #E67E22 (Orange)
MARY & MAY   : #8B4513 (Brown)
Innergarm    : #2ECC71 (Fresh Green)
```

---

## 📦 Embed 활용

### Team Cards (Callout 활용)

Notion에서 `/callout` 입력 후:

```
💼 Sales Team
━━━━━━━━━━━━━━━━
👥 3 members
📊 Commission-based
🎯 Reports to: Mrs. Anna
```

### Brand Cards

```
🌸 Dasique
━━━━━━━━━━━━━━━━
Blooming Your Mood

Hero: Shadow Palette
Category: Mood Makeup
━━━━━━━━━━━━━━━━
```

---

## 🔗 Linked Database 활용

각 팀 페이지에서:
1. `/linked` 입력
2. People Directory 선택
3. Filter: Team = [해당 팀]
4. View: Gallery

→ 팀 페이지마다 해당 팀원만 보임

---

## ✨ Pro Tips

1. **Synced Blocks** - 공통 헤더/푸터를 synced block으로 만들어 재사용
2. **Template Button** - 새 직원 추가 템플릿
3. **Toggle** - 긴 내용은 toggle로 정리
4. **Divider** - `/divider`로 섹션 구분
5. **Column** - `/col` 로 2-3열 레이아웃

---

## 📱 Mobile 고려사항

- 2열까지만 (3열은 모바일에서 깨짐)
- 테이블보다 Gallery View 선호
- 긴 텍스트는 toggle로

