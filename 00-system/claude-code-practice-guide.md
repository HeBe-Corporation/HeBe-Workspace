# Claude Code 실습 가이드

> **준비물**: Claude Code 설치 완료, imi-workspace 클론

---

## Part 1: 환경 준비

### 1-1. imi-workspace 클론

```bash
git clone https://github.com/Rhim80/imi-workspace.git
cd imi-workspace
```

### 1-2. Claude Code 실행

```bash
claude
```

처음 실행하면 로그인이 필요합니다:
```
/login
```

### 1-3. 현재 위치 확인

Claude에게 물어보세요:
```
"지금 어느 폴더에 있어?"
```

---

## Part 2: 폴더 정리 실습

### 목표
Downloads 폴더 (또는 지정된 폴더)를 Claude Code로 정리하기

### 실습 순서

**Step 1**: 분석 요청
```
"~/Downloads 폴더를 분석해서 어떤 파일들이 있는지 정리해줘"
```

**Step 2**: 정리 계획 요청
```
"이 파일들을 유형별로 정리하는 계획을 세워줘"
```

**Step 3**: 실행 (선택)
```
"계획대로 정리해줘"
```

### 핵심 포인트
- Claude는 삭제 전 항상 확인을 요청합니다
- "되돌려줘"로 언제든 복구 가능
- 대화로 계획을 수정할 수 있습니다

---

## Part 3: 데이터 분석 실습

### 목표
CSV 파일을 자연어로 분석하기

### 3-1. 샘플 데이터 위치로 이동

터미널에서:
```bash
cd 50-resources/sample-data
claude
```

### 3-2. 판매 데이터 분석

**기본 분석**
```
"sample_sales_data.csv를 읽고 주요 인사이트를 알려줘"
```

**구체적 질문**
```
"지역별 매출을 비교해줘"
```

```
"가장 실적이 좋은 영업사원은 누구야?"
```

```
"제품별 판매 현황을 표로 정리해줘"
```

### 3-3. 고객 데이터 분석

```
"customer_data.csv에서 VIP 고객 (Lifetime_Value 상위 20%)을 찾아줘"
```

```
"산업별로 고객을 분류해줘"
```

### 3-4. 직원 설문 분석

```
"employee_survey_data.csv를 분석해서 부서별 만족도를 비교해줘"
```

```
"가장 개선이 필요한 영역은 뭐야?"
```

---

## Part 4: 도전 과제

아래 중 하나를 선택해서 Claude에게 요청해보세요:

1. **마케팅 분석**: "marketing_campaign_data.csv에서 ROI가 가장 높은 채널은?"

2. **재고 관리**: "inventory_data.csv에서 재주문이 필요한 품목을 찾아줘"

3. **종합 보고서**: "판매 데이터와 고객 데이터를 결합해서 분석해줘"

4. **시각화 요청**: "월별 매출 추이를 차트로 보여줘"

### 자유 실습

본인의 데이터가 있다면:
```
"[파일명]을 분석해줘"
```

---

## 유용한 명령어 모음

### 경로 관련
| 명령어 | 설명 |
|--------|------|
| `cd ~/Downloads` | Downloads 폴더로 이동 |
| `cd ..` | 상위 폴더로 이동 |
| `pwd` | 현재 위치 확인 |

### Claude Code 내부
| 명령어 | 설명 |
|--------|------|
| `/help` | 도움말 |
| `/clear` | 대화 초기화 |
| `Ctrl+C` | 작업 중단 |
| `exit` | Claude Code 종료 |

---

## 트러블슈팅

### "command not found: claude"
- Claude Code가 설치되지 않았습니다
- 설치: `curl -fsSL claude.ai/install.sh | bash`

### 로그인이 안 돼요
- `/login` 입력 후 브라우저에서 로그인
- Claude Pro 구독 필요 ($20/월)

### 파일을 못 찾아요
- 현재 위치 확인: "지금 어디야?"
- 전체 경로 사용: "~/Downloads/파일명.csv"

---

## 다음 단계

1. **본인 데이터로 실습**: 업무에서 사용하는 CSV, Excel 파일 분석
2. **Daily Note 활용**: `/daily-note` 명령어로 일일 기록
3. **자동화 탐색**: 반복 작업을 Claude Code로 자동화
