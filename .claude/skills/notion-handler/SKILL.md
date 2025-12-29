---
name: notion-handler
description: Notion 데이터베이스/페이지 관리. "노션", "Notion", "DB 만들어", "데이터베이스", "페이지 추가", "설문 DB", "프로젝트 관리", "노션에 저장", "대시보드" 등을 언급하면 자동 실행.
allowed-tools: Bash, Read, Write
---

# Notion Handler Skill

## Prerequisites

### Required: NOTION_TOKEN 환경변수

토큰이 설정되어 있어야 합니다:
```bash
export NOTION_TOKEN="your_notion_token_here"
```

---

## 주요 기능

### 1. 데이터베이스 (Database)

#### DB 생성
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py create-db \
  --parent "페이지ID" \
  --title "DB 제목" \
  --properties '{"이름": "title", "회사": "rich_text", "상태": {"select": ["진행중", "완료"]}}'
```

#### DB 조회
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py query-db \
  --id "DB_ID" \
  --filter '{"property": "상태", "select": {"equals": "완료"}}'
```

#### DB 정보 확인
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py get-db --id "DB_ID"
```

---

### 2. 페이지 (Page)

#### 페이지 생성 (DB 항목)
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py create-page \
  --parent "DB_ID" \
  --properties '{"이름": "홍길동", "회사": "ABC Corp"}'
```

#### 페이지 조회
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py get-page --id "PAGE_ID"
```

#### 페이지 수정
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py update-page \
  --id "PAGE_ID" \
  --properties '{"상태": "완료"}'
```

---

### 3. 블록 (Block) - 대시보드용

#### 블록 추가
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py append-blocks \
  --id "PAGE_ID" \
  --blocks '[{"type": "heading_2", "text": "섹션 제목"}, {"type": "paragraph", "text": "내용"}]'
```

#### 블록 조회
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py get-blocks --id "PAGE_ID"
```

---

### 4. 검색

```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py search --query "검색어"
```

---

## 속성 타입 참조

| 타입 | 설명 | 예시 |
|------|------|------|
| `title` | 제목 (필수) | `"이름": "title"` |
| `rich_text` | 텍스트 | `"설명": "rich_text"` |
| `number` | 숫자 | `"연차": "number"` |
| `select` | 단일 선택 | `"상태": {"select": ["진행중", "완료"]}` |
| `multi_select` | 다중 선택 | `"태그": {"multi_select": ["A", "B"]}` |
| `checkbox` | 체크박스 | `"완료": "checkbox"` |
| `date` | 날짜 | `"마감일": "date"` |
| `email` | 이메일 | `"이메일": "email"` |
| `phone_number` | 전화번호 | `"연락처": "phone_number"` |
| `url` | URL | `"링크": "url"` |

---

## 사용 예시

### 설문 DB 생성
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py create-db \
  --parent "2bbd0f53623d80b49e3ed311fe1f6038" \
  --title "HFK Winter 2025 사전 설문" \
  --properties '{
    "이름": "title",
    "회사": "rich_text",
    "직무": "rich_text",
    "연차": "number",
    "AI 도구 경험": {"multi_select": ["ChatGPT", "Claude", "Copilot", "Gemini", "기타"]},
    "AI 활용 수준": {"select": ["입문", "초급", "중급", "고급"]},
    "기대 사항": "rich_text",
    "현재 업무 고충": "rich_text",
    "노트북 지참": "checkbox",
    "제출일": "date"
  }'
```

### 설문 응답 추가
```bash
python3 .claude/skills/notion-handler/scripts/notion_api.py create-page \
  --parent "DB_ID" \
  --properties '{
    "이름": "권오훈",
    "회사": "노동법률사무소 유록",
    "직무": "공인노무사",
    "연차": 7,
    "AI 도구 경험": ["ChatGPT"],
    "AI 활용 수준": "초급",
    "노트북 지참": true
  }'
```

---

## 보안

- `NOTION_TOKEN`은 환경변수로 관리
- 토큰을 코드나 문서에 하드코딩 금지

---

## Version History

- **v1.0.0 (2025-11-30)**: 초기 작성 - DB/페이지/블록/검색 지원
