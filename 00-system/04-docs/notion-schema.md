# Notion DB 스키마

> Notion은 "업무 운영 UI". 스키마 변경은 보수적으로.

---

## Databases 목록 (최소 구성)

1. `Permits` - 위생허가/인증
2. `Entities` - 법인/지점/사업장
3. `Renewal Tasks` - 갱신 태스크
4. `Vendors & Customers` - 거래처
5. `Marketing Calendar` - 콘텐츠/캠페인 운영
6. `SOP / Docs` - 운영 문서/서식 모음

---

## 1. Entities DB (기준정보)

**목적**: 국가별 사업장/법인 단위 표준화

| 필드 | 타입 | 설명 |
|------|------|------|
| `entityId` | Text | UUID |
| `countryCode` | Select | KR/KH/VN |
| `entityName` | Title | 사업장명 |
| `entityType` | Select | HQ/Branch/Store/Factory/Warehouse/Online |
| `address` | Text | 주소 |
| `manager` | Person | 담당자 |
| `status` | Select | Active/Inactive |
| `driveRootFolder` | URL | Google Drive 폴더 |
| `notes` | Text | 비고 |

---

## 2. Permits DB (위생허가/인증)

| 필드 | 타입 | 설명 |
|------|------|------|
| `permitId` | Text | UUID |
| `countryCode` | Select | KR/KH/VN |
| `entity` | Relation | → Entities |
| `permitType` | Select | 영업신고/식품안전/수입허가 등 |
| `permitName` | Title | 허가명 |
| `authority` | Text | 발급 기관 |
| `status` | Select | Draft/Submitted/Approved/Rejected/Expired |
| `issueDate` | Date | 발급일 |
| `expiryDate` | Date | 만료일 |
| `renewalStartDate` | Date | 갱신 시작일 (보통 expiryDate - 90d) |
| `owner` | Person | 담당자 |
| `department` | Select | Compliance/Ops |
| `driveFolder` | URL | 증빙 폴더 |
| `evidenceLinks` | URL/Files | 증빙 파일 |
| `permitNo` | Text | 공식 번호 |
| `riskLevel` | Select | Low/Medium/High |
| `lastSyncedAt` | Date | 마지막 동기화 |
| `tags` | Multi-select | 태그 |
| `notes` | Text | 비고 |

### 권장 뷰
- "만료 임박(D-90)" 필터 뷰
- "국가별(KR/KH/VN)" 보드
- "상태별" 보드

---

## 3. Renewal Tasks DB (갱신 태스크)

| 필드 | 타입 | 설명 |
|------|------|------|
| `renewalTaskId` | Text | UUID |
| `permit` | Relation | → Permits |
| `countryCode` | Rollup | 국가 |
| `entity` | Rollup | 사업장 |
| `dueDate` | Date | 기한 |
| `status` | Select | NotStarted/InProgress/Blocked/Done |
| `owner` | Person | 담당자 |
| `checklist` | Text/Sub-items | 체크리스트 |
| `blockers` | Text | 블로커 |
| `evidenceLinks` | URL | 증빙 |
| `priority` | Select | P0/P1/P2 |
| `createdAt` | Date | 생성일 |
| `updatedAt` | Date | 수정일 |

---

## 4. Marketing Calendar DB

| 필드 | 타입 | 설명 |
|------|------|------|
| `contentId` | Text | UUID |
| `countryCode` | Select | KR/KH/VN |
| `channel` | Select | FB/IG/TT/Google/YT/Offline/Other |
| `publishDate` | Date | 발행일 |
| `assetLink` | URL | 소재 링크 (Drive/Notion/URL) |
| `captionCopy` | Text | 캡션/카피 |
| `status` | Select | Planned/Ready/Posted/Paused |
| `campaign` | Relation/Text | 캠페인 연결 |
| `owner` | Person | 담당자 |
| `notes` | Text | 비고 |

> 캠페인 DB를 따로 만들면 더 좋다 (Phase 2)

---

## ID 규칙

- 모든 핵심 레코드는 UUID 사용
- 사람이 만드는 "번호(invoiceNo, permitNo)"는 중복 가능 → ID로 구분
- 예: `permitId`, `renewalTaskId`, `txnId`, `invoiceId`, `campaignId`

---

*Updated: 2025-12-29*
