# 회계(재무) SOP

> 전표(원장), 매입/매출(인보이스), 비용 분류, 월마감

---

## 월마감 체크리스트

### Week 1 (1~7일)
- [ ] 전월 미처리 전표 확인
- [ ] 은행/현금 잔액 대사

### Week 2 (8~14일)
- [ ] 매입/매출 인보이스 정리 (미지급/미수금)
- [ ] 환율 적용 (기준통화 변환)

### Week 3 (15~21일)
- [ ] 마케팅 비용 (광고비) 전표 매칭
- [ ] 세금/VAT 관련 자료 정리 (현지 룰)

### Week 4 (22~말일)
- [ ] P&L / Cashflow 초안 생성
- [ ] 경영 리포트 (Looker) 확인
- [ ] 증빙 링크 누락 점검

---

## 전표 입력 규칙

### 필수 원칙
1. **행 삭제 금지** - 무효 처리는 `status=Void`
2. **증빙 필수** - 모든 전표에 `evidenceUrl`
3. **campaignId 매칭** - 광고비는 마케팅 캠페인과 연결

### 입력 흐름
```
거래 발생
  ↓
Sheets에 전표 입력 (ledger_transactions)
  ↓
Drive에 증빙 업로드
  ↓
evidenceUrl 필드에 링크 연결
  ↓
월말 정산 시 검증
```

---

## 계정과목 (CoA) 구조

| 대분류 | 중분류 예시 |
|--------|-------------|
| **Revenue** | 매출, 기타수익 |
| **COGS** | 원재료, 직접비 |
| **Marketing** | 광고비, 프로모션 |
| **Payroll** | 급여 (Phase 4) |
| **Rent & Utilities** | 임대료, 공과금 |
| **Logistics** | 배송, 운송 |
| **Professional Fees** | 법률, 회계, 컨설팅 |
| **Tax & Duties** | 세금, 관세 |
| **Other Opex** | 기타 운영비 |

---

## 환율 정책

### 기준통화 선택
- **USD**: 글로벌 비교 용이
- **KRW**: 한국 본사 기준

### 적용 방법
| 방식 | 장점 | 단점 |
|------|------|------|
| 일별 환율 | 정확 | 관리 복잡 |
| 월평균 환율 | 간편 | 오차 발생 |

### 보고
- 월말 보고는 **항상 기준통화로 통일**

---

## 마케팅-회계 매칭 (중요)

광고비 전표 입력 시:
1. `department` = Marketing
2. `campaignId` 또는 `campaignName` 기록
3. Looker에서 "마케팅 비용"과 "마케팅 성과" 동일 키로 조인

```
Sheets: ledger_transactions.campaignId
   ↕ JOIN
Sheets: marketing_daily.campaignId
```

---

## 증빙 파일 규칙

### 파일명
```
{txnId}_{거래처}_{금액}.pdf
예: abc123_네이버광고_500000.pdf
```

### 저장 위치
```
{countryCode}/{entity}/Finance/{YYYY}/{MM}/
예: KR/Seoul-HQ/Finance/2025/01/
```

---

*Updated: 2025-12-29*
