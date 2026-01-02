# Looker Studio 대시보드 가이드

> 경영/운영 리포트 (표준 지표로만 표시)

---

## 대시보드 3종

### 1. Compliance Overview (위생허가)
### 2. Finance (P&L / Cashflow)
### 3. Marketing Performance

---

## 1. Compliance Overview

### 주요 위젯

| 위젯 | 설명 |
|------|------|
| **만료 임박 허가** | D-90/60/30/14/7 단계별 카운트 |
| **국가별 커버리지** | KR/KH/VN별 유효 허가 비율 |
| **리스크 분포** | High/Medium/Low 파이차트 |
| **오늘 기준 만료 리스트** | 테이블 (permitName, entity, expiryDate) |

### 필터
- `countryCode`: KR, KH, VN, All
- `entityType`: HQ, Branch, Store 등
- `status`: Approved, Expired 등

### 데이터 소스
```
fact_permits
  JOIN dim_entity
  JOIN dim_country
```

---

## 2. Finance (P&L / Cashflow)

### 주요 위젯

| 위젯 | 설명 |
|------|------|
| **월별 매출/비용/영업이익** | 라인차트 (트렌드) |
| **국가별 비용 구조** | 스택 바차트 |
| **부서별 비용** | 도넛차트 |
| **미지급/미수금 Aging** | 테이블 (30/60/90일 구분) |
| **환율 영향** | 기준통화 대비 변동 |

### 필터
- `countryCode`: KR, KH, VN, All
- `department`: Accounting, Marketing, Ops 등
- `period`: 월별, 분기별, 연도별

### 데이터 소스
```
fact_ledger_transactions
  JOIN dim_account
  JOIN dim_entity
  JOIN dim_country
  JOIN master_fx_rates
```

---

## 3. Marketing Performance

### 주요 위젯

| 위젯 | 설명 |
|------|------|
| **채널별 Spend/Revenue/ROAS** | 라인차트 (추이) |
| **캠페인 Top 10** | 테이블 (ROAS 기준) |
| **캠페인 Bottom 10** | 테이블 (개선 필요) |
| **국가별 KPI 비교** | 바차트 (동일 기준통화) |
| **일별 성과** | 히트맵 또는 라인차트 |

### 필터
- `countryCode`: KR, KH, VN, All
- `channel`: FB, IG, TT, Google, YT 등
- `period`: 일별, 주별, 월별

### 데이터 소스
```
fact_marketing_daily
  JOIN dim_campaign
  JOIN dim_channel
  JOIN dim_country
```

---

## 지표 정의 (표준)

| 지표 | 공식 | 설명 |
|------|------|------|
| **ROAS** | revenue / spend | 광고수익률 |
| **CPA** | spend / conversions | 전환당 비용 |
| **CPL** | spend / leads | 리드당 비용 |
| **CTR** | clicks / impressions | 클릭률 |
| **CPC** | spend / clicks | 클릭당 비용 |

> 모든 대시보드에서 동일한 공식 사용

---

## 권한 설정

### Row-level Security
- `countryCode` 기준 필터링
- KR 담당자는 KR 데이터만
- 경영진은 All 접근

### 대시보드 공유
| 역할 | 접근 범위 |
|------|----------|
| 경영진 | 3개 대시보드 전체 |
| 국가 매니저 | 해당 국가만 |
| 부서 담당자 | 해당 부서/도메인만 |

---

## 새로고침 주기

| 대시보드 | 주기 | 비고 |
|----------|------|------|
| Compliance | 1일 1회 | 새벽 동기화 후 |
| Finance | 1일 1회 | 월말은 수시 |
| Marketing | 1일 1회 | 캠페인 기간엔 수시 |

---

## 대시보드 URL 관리

```
Looker Studio 대시보드 링크:
- Compliance: [URL]
- Finance: [URL]
- Marketing: [URL]

(실제 URL은 생성 후 기록)
```

---

## 체크리스트

### 대시보드 생성 시
- [ ] 데이터 소스 연결 확인
- [ ] 필터 작동 확인
- [ ] 권한 설정 확인
- [ ] 새로고침 주기 설정

### 월간 점검
- [ ] 데이터 정합성 확인
- [ ] 누락 데이터 없는지
- [ ] 지표 계산 정확한지

---

*Updated: 2025-12-29*
