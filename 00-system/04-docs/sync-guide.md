# 동기화(ETL) 가이드

> Notion/Sheets → Warehouse → Looker Studio

---

## 데이터 흐름

```
┌─────────────────────────────────────────────────────┐
│                    INPUT LAYER                       │
├─────────────────────────────────────────────────────┤
│  Notion                    Google Sheets            │
│  - Permits                 - ledger_transactions    │
│  - Entities                - invoices               │
│  - Renewal Tasks           - marketing_daily        │
│  - Marketing Calendar      - master_fx_rates        │
└───────────────┬─────────────────────┬───────────────┘
                │                     │
                ▼                     ▼
        sync-notion.ts         sync-sheets.ts
                │                     │
                └──────────┬──────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│                   WAREHOUSE                          │
│  (BigQuery / Postgres / 정규화된 Sheets)            │
├─────────────────────────────────────────────────────┤
│  Dimensions:              Facts:                    │
│  - dim_date               - fact_ledger             │
│  - dim_country            - fact_marketing          │
│  - dim_entity             - fact_permits            │
│  - dim_account            - fact_renewal_tasks      │
│  - dim_channel                                      │
│  - dim_campaign                                     │
└───────────────────────────┬─────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────┐
│                  LOOKER STUDIO                       │
│  - Compliance Overview                              │
│  - Finance (P&L / Cashflow)                         │
│  - Marketing Performance                            │
└─────────────────────────────────────────────────────┘
```

---

## 스크립트 위치

```
/scripts/
├── sync-notion.ts      # Notion → Warehouse
├── sync-sheets.ts      # Sheets → Warehouse
├── validate-data.ts    # 데이터 검증
└── backfill.ts         # 과거 데이터 채우기
```

---

## 동기화 주기

| 주기 | 대상 | 비고 |
|------|------|------|
| **1일 1회 (새벽)** | 전체 | 기본 스케줄 |
| **수동 실행** | 필요시 | 긴급 업데이트 |

---

## 설계 원칙

### 1. 증분 동기화
- `updatedAt` 기준으로 변경분만 가져오기
- 전체 동기화는 초기 설정 또는 backfill 시에만

### 2. Idempotent (멱등성)
- 같은 입력으로 2번 실행해도 결과 동일
- UPSERT 패턴 사용

### 3. 로그 필수
```
- 실행 시작/종료 시간
- 처리 건수
- 실패 레코드 (원인/재시도 여부)
```

---

## 실패 처리

| 오류 유형 | 대응 |
|----------|------|
| **API 오류** | 지수 백오프 (최대 3회 재시도) |
| **스키마 오류** | 즉시 중단 (사람이 수정) |
| **데이터 오류** | 해당 행만 스킵 + 오류 리포트 생성 |

---

## Warehouse 스키마 (스타 스키마)

### Dimensions
| 테이블 | 설명 |
|--------|------|
| `dim_date` | 날짜 |
| `dim_country` | 국가 (KR/KH/VN) |
| `dim_entity` | 사업장/법인 |
| `dim_account` | 계정과목 |
| `dim_channel` | 마케팅 채널 |
| `dim_campaign` | 캠페인 |
| `dim_vendor_customer` | 거래처 |

### Facts
| 테이블 | 설명 |
|--------|------|
| `fact_ledger_transactions` | 회계 원장 |
| `fact_marketing_daily` | 마케팅 일 성과 |
| `fact_permits` | 허가 상태 스냅샷 |
| `fact_renewal_tasks` | 갱신 태스크 |

---

## Row-level 권한

- 모든 테이블에 `countryCode` 포함
- 국가별 권한 분리 가능
- 민감 컬럼 (거래처 세부, 세금정보)은 별도 테이블로 분리 가능

---

## 실행 명령어

```bash
# Notion 동기화
npx ts-node scripts/sync-notion.ts

# Sheets 동기화
npx ts-node scripts/sync-sheets.ts

# 데이터 검증
npx ts-node scripts/validate-data.ts

# 과거 데이터 채우기 (주의: 시간 소요)
npx ts-node scripts/backfill.ts --from=2024-01-01 --to=2024-12-31
```

---

## 모니터링

### 확인 항목
- [ ] 동기화 성공/실패 여부
- [ ] 처리 건수 (예상 범위 내인지)
- [ ] 오류 리포트 확인
- [ ] Looker 대시보드 갱신 확인

### 알림 설정 (권장)
- 동기화 실패 시 Slack/Email 알림
- 처리 건수 이상 시 알림

---

*Updated: 2025-12-29*
