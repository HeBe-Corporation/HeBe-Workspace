# Google Sheets 스키마

> Sheets는 "숫자 입력/정산" 최적. 스키마(헤더) 고정이 핵심.

---

## 필수 시트(탭) 목록

1. `ledger_transactions` - 회계 원장
2. `invoices` - 매입/매출 인보이스
3. `marketing_daily` - 마케팅 일 성과
4. `master_fx_rates` - 환율
5. `master_accounts` - 계정과목 CoA
6. `master_entities` - Entities 복제/참조용

---

## 1. ledger_transactions (회계 원장)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `txnId` | UUID | 거래 ID |
| `txnDate` | YYYY-MM-DD | 거래일 |
| `countryCode` | KR/KH/VN | 국가 |
| `entityId` | UUID | 사업장 ID |
| `department` | Text | Accounting/Marketing/Ops/Compliance |
| `accountCode` | Text | 계정 코드 |
| `accountName` | Text | 계정명 |
| `counterparty` | Text | 거래처 |
| `description` | Text | 적요 |
| `amountLocal` | Number | 현지 통화 금액 |
| `currency` | KRW/KHR/VND/USD | 통화 |
| `fxRate` | Number | 환율 |
| `amountBase` | Number | 기준통화 환산 금액 |
| `paymentMethod` | Text | Cash/Bank/Card/Other |
| `invoiceNo` | Text | 인보이스 번호 (optional) |
| `vatType` | Text | 부가세 유형 (optional) |
| `vatAmount` | Number | 부가세 금액 (optional) |
| `evidenceUrl` | URL | 증빙 Drive 링크 |
| `createdAt` | Datetime | 생성일 |
| `updatedAt` | Datetime | 수정일 |
| `status` | Active/Void | 상태 |

### 입력 규칙
- **행 삭제 금지** (무효는 `status=Void`)
- **헤더명 변경 금지**
- 날짜는 ISO 포맷
- 통화는 드롭다운 강제

---

## 2. marketing_daily (마케팅 일 성과)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `date` | YYYY-MM-DD | 날짜 |
| `countryCode` | KR/KH/VN | 국가 |
| `channel` | Text | FB/IG/TT/Google/YT 등 |
| `campaignName` | Text | 캠페인명 |
| `campaignId` | UUID | 캠페인 ID (가능하면) |
| `spend` | Number | 지출 |
| `impressions` | Number | 노출 |
| `clicks` | Number | 클릭 |
| `conversions` | Number | 전환 |
| `revenue` | Number | 매출 |
| `currency` | Text | 통화 |
| `createdAt` | Datetime | 생성일 |
| `updatedAt` | Datetime | 수정일 |

### 파생 지표 (계산 컬럼)
```
CTR = clicks / impressions
CPC = spend / clicks
CPA = spend / conversions
ROAS = revenue / spend
```

---

## 3. master_fx_rates (환율)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `date` | YYYY-MM-DD | 날짜 |
| `baseCurrency` | Text | 기준통화 (USD 또는 KRW) |
| `quoteCurrency` | Text | 표시통화 (KRW/KHR/VND 등) |
| `rate` | Number | 환율 |

### 환율 정책
- 기준통화(baseCurrency)는 1개로 고정 (권장: USD 또는 KRW)
- 적용 환율: 일별(정확) vs 월평균(간편) 중 정책 결정
- 월말 보고는 기준통화로 통일

---

## 4. master_accounts (계정과목 CoA)

최소 구조:
- Revenue
- COGS
- Marketing Expense
- Payroll (Phase 4)
- Rent & Utilities
- Logistics
- Professional Fees
- Tax & Duties
- Other Opex

---

## 증빙 규칙

- 모든 전표는 `evidenceUrl` (Drive 링크) 필수
- 예외: "소액현금" 정책으로 별도 정의
- 스캔본 파일명은 `txnId` 포함

---

*Updated: 2025-12-29*
