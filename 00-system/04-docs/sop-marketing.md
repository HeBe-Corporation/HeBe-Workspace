# 마케팅 SOP

> 캠페인/콘텐츠 캘린더, 일 성과 집계, 채널별 KPI

---

## 캠페인 네이밍 규칙

### 캠페인명
```
{countryCode}_{channel}_{objective}_{product}_{YYYYMM}_{owner}

예시:
VN_FB_SALES_COFFEE_202601_mika
KR_IG_BRAND_NEWMENU_202601_hovoo
KH_TT_TRAFFIC_STORE_202601_kim
```

### 채널 코드
| 코드 | 플랫폼 |
|------|--------|
| FB | Facebook |
| IG | Instagram |
| TT | TikTok |
| Google | Google Ads |
| YT | YouTube |
| Offline | 오프라인 |
| Other | 기타 |

### Objective 코드
| 코드 | 목적 |
|------|------|
| BRAND | 브랜딩 |
| TRAFFIC | 트래픽 |
| SALES | 판매 |
| LEAD | 리드 수집 |

---

## UTM 규칙

캠페인명과 1:1 매칭:

```
utm_source = channel (FB, IG, TT 등)
utm_medium = objective (BRAND, SALES 등)
utm_campaign = 전체 캠페인명

예:
?utm_source=FB
&utm_medium=SALES
&utm_campaign=VN_FB_SALES_COFFEE_202601_mika
```

---

## 일 성과 집계

### 필수 지표 (Sheets: marketing_daily)
- `date`
- `countryCode`
- `channel`
- `campaignName` / `campaignId`
- `spend`
- `clicks`
- `conversions`
- `revenue`

### 파생 지표
| 지표 | 공식 | 설명 |
|------|------|------|
| **CTR** | clicks / impressions | 클릭률 |
| **CPC** | spend / clicks | 클릭당 비용 |
| **CPA** | spend / conversions | 전환당 비용 |
| **CPL** | spend / leads | 리드당 비용 |
| **ROAS** | revenue / spend | 광고수익률 |

---

## 콘텐츠 캘린더 운영

### Notion: Marketing Calendar DB
1. 콘텐츠 기획 → `status: Planned`
2. 소재 제작 완료 → `status: Ready`
3. 발행 → `status: Posted`
4. 중단 → `status: Paused`

### 소재 라이브러리 (Drive)
```
Marketing/
├── KR/
│   ├── 2025-01/
│   │   ├── FB/
│   │   ├── IG/
│   │   └── TT/
├── VN/
└── KH/
```

Notion `assetLink` 필드에 Drive 링크 연결

---

## 회계 매칭 (중요)

광고비 전표에 반드시 기록:
- `campaignId` 또는 `campaignName`
- `department` = Marketing

이렇게 하면 Looker에서:
- 마케팅 비용 (from Sheets ledger)
- 마케팅 성과 (from Sheets marketing_daily)

같은 `campaignId`로 조인 가능

---

## 성과 집계 방법

### API 연동 가능할 때
```
Meta Ads API → 자동 수집 → marketing_daily
Google Ads API → 자동 수집 → marketing_daily
```

### API 연동 어려울 때
```
플랫폼에서 CSV 다운로드
  ↓
Sheets에 수동 입력
  ↓
Warehouse 적재
```

---

## 리포팅 주기

| 주기 | 내용 |
|------|------|
| **일간** | spend/clicks/conversions 기록 |
| **주간** | 채널별 ROAS 비교 |
| **월간** | 캠페인 Top/Bottom 분석, 예산 재배분 |

---

*Updated: 2025-12-29*
