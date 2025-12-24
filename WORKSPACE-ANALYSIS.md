# IMI Workspace 분석 문서

> 작성일: 2025-12-18
> 용도: 워크스페이스 구조 및 기능 설명 (교육용)

## 1. 개요

**imi-workspace**는 비개발자를 위한 AI 작업 환경으로, Claude Code와 Johnny Decimal 시스템을 결합한 실전 PKM(Personal Knowledge Management) 워크스페이스입니다.

**용도**: Claude Code + PKM 시스템 교육용으로 제작

**핵심 철학**:
1. AI amplifies thinking, not just writing
2. File system = AI memory
3. Structure enables creativity
4. Iteration over perfection
5. Immediate usability

---

## 2. 폴더 구조 (Johnny Decimal 시스템)

```
imi-workspace/
├── .claude/              # Claude Code 확장 기능
│   ├── commands/         # 슬래시 커맨드 (18개)
│   ├── agents/           # 서브에이전트 (1개)
│   └── skills/           # 스킬스 (3개)
├── 00-inbox/             # 빠른 캡처 공간
├── 00-system/            # 시스템 설정 및 템플릿
│   ├── 01-templates/     # 재사용 템플릿 (7개)
│   ├── 02-scripts/       # 자동화 스크립트
│   └── 04-docs/          # 문서
├── 10-projects/          # 활성 프로젝트 (시한부)
│   └── 00-working-backwards-template/  # WB 프로젝트 템플릿
├── 20-operations/        # 비즈니스 운영 (지속적)
├── 30-knowledge/         # 지식 아카이브
├── 40-personal/          # 개인 노트
│   ├── 41-daily/         # Daily Notes
│   ├── 42-weekly/        # Weekly Reviews
│   ├── 45-ideas/         # 아이디어
│   └── 46-todos/         # 할 일 관리
├── 50-resources/         # 참고 자료
└── 90-archive/           # 완료/중단 항목
```

---

## 3. Slash Commands (18개)

### 초기 설정
| 커맨드 | 설명 |
|--------|------|
| `/setup-workspace` | 워크스페이스 초기 설정 |
| `/setup-google-calendar` | Google Calendar 연결 (OAuth) |
| `/setup-web-crawler` | Web Crawler + OCR 연결 |

### Daily Workflow
| 커맨드 | 설명 |
|--------|------|
| `/daily-note` | 오늘 Daily Note 생성/열기 (Google Calendar 자동 통합) |
| `/daily-review` | 어제/오늘 변경사항 분석 + Telegram Inbox 수집 + Todo 통합 |
| `/weekly-synthesis` | 주간 회고 생성 |

### 지식 관리
| 커맨드 | 설명 |
|--------|------|
| `/idea [카테고리]` | 대화에서 아이디어 추출 후 PKM에 저장 |
| `/todo` | 할 일 추가 |
| `/todos [today/project/overdue/stats]` | 할 일 목록 조회/관리 |
| `/inbox-processor` | Inbox 파일 정리 |

### AI 활용
| 커맨드 | 설명 |
|--------|------|
| `/thinking-partner` | AI와 대화하며 생각 발전 (소크라테스식 질문) |

### Project Management (Working Backwards)
| 커맨드 | 설명 |
|--------|------|
| `/working-backwards-pr` | Amazon PR/FAQ 문서 생성 (대화형, 45-60분) |
| `/generate-roadmap` | PR/FAQ 기반 역순 로드맵 생성 (20-30분) |

### 시스템
| 커맨드 | 설명 |
|--------|------|
| `/create-command` | 커스텀 명령어 생성 |
| `/push-all` | Git push |
| `/pull-all` | Git pull |

---

## 4. Skills (3개)

### 4.1 Google Calendar
**파일**: `.claude/skills/google-calendar/SKILL.md`

**기능**:
- gcalcli 기반 Google Calendar 통합
- 일정 조회, 검색, 등록, 수정, 삭제
- Daily Note 자동 통합 (`{{calendar_events}}` placeholder)

**트리거 키워드**: "일정", "스케줄", "캘린더"

**핵심 명령어**:
```bash
gcalcli agenda                    # 오늘 일정
gcalcli agenda 2025-12-18         # 특정 날짜
gcalcli search "검색어"           # 일정 검색
gcalcli add --calendar "Work" --when "2025-12-18 14:00" --duration 60 --title "미팅"
```

---

### 4.2 Web Crawler + OCR
**파일**: `.claude/skills/web-crawler-ocr/SKILL.md`

**기능**:
- Firecrawl: 깨끗한 텍스트 추출 (광고/잡음 제거)
- Gemini OCR: 대용량 이미지 처리 (20MB, Claude 5MB 제한 우회)
- 완전한 마크다운 생성 (텍스트 + 이미지 분석)

**트리거 키워드**: "URL 분석", "크롤링", "웹사이트 분석", "경쟁사 분석", https:// 또는 http:// URL 제공 시

**실행**:
```bash
cd .claude/skills/web-crawler-ocr/scripts
python3 web-crawler.py "<URL>" "<output-path>"
```

---

### 4.3 Competitor Review Analyzer
**파일**: `.claude/skills/competitor-review-analyzer/SKILL.md`

**기능**:
- 다나와 상품 리뷰 크롤링
- AI 분석 (긍정/부정/키워드)
- 인사이트 도출 -> 액션 아이템 제안
- 구글 시트 업로드 (선택)

**트리거 키워드**: "경쟁사 분석", "리뷰 분석", "다나와 리뷰"

**워크플로우**:
```
입력(URL/상품명) -> 리뷰 크롤링 -> AI 분석 -> 인사이트 -> 액션 아이템 -> 마크다운 리포트
```

---

## 5. Agents (서브에이전트, 1개)

### Zettelkasten Linker
**파일**: `.claude/agents/zettelkasten-linker.md`

**역할**: PKM vault 종합 분석 및 큐레이션

**기능**:
1. **Quality Assessment**: 파일 품질 평가 (삭제/분할/유지)
   - DELETE: <50 words, 중복, 빈 파일
   - SPLIT: >2000 words, 여러 주제
   - KEEP: 50-2000 words, 단일 주제
2. **Link Suggestion**: 양방향 연결 제안 (>60% 관련성)
3. **Vault Health Report**: 개선 계획 생성

**호출 예시**:
```
"Analyze my entire PKM vault - suggest links, identify low-quality files"
"Read all my notes and tell me what to delete, split, or link together"
```

---

## 6. Templates (7개)

| 템플릿 | 용도 |
|--------|------|
| `daily-note-template.md` | 매일 작성하는 노트 (Google Calendar 자동 통합) |
| `weekly-review-template.md` | 주간 회고 |
| `Project Template.md` | 새 프로젝트 시작 |
| `pr-faq-template.md` | Amazon Working Backwards PR/FAQ |
| `interview-template.md` | 고객 인터뷰 가이드 |
| `Daily Note Template.md` | (레거시) |

### Daily Note 주요 섹션:
- 오늘의 우선순위 (Top 3 Tasks)
- Google Calendar 일정 + Money 알림
- 프로젝트 업데이트 (교육, IMI WORK, 카페 운영)
- 인사이트 & 아이디어
- Quick Notes (개인/가족, 매장 순회, 미팅)
- Daily Reflection

---

## 7. Working Backwards 프로젝트 템플릿

**위치**: `10-projects/00-working-backwards-template/`

**구조**:
```
00-working-backwards-template/
├── pr-document.md          # PR 작성
├── faq.md                  # FAQ 작성
├── roadmap.md              # 역순 로드맵
├── customer-research/      # 고객 인터뷰 노트
├── daily-progress/         # 일일 진행 기록
└── final-presentation/     # 최종 발표 자료
```

**4주 워크플로우**:
- Week 1: PR/FAQ 작성 (`/working-backwards-pr`)
- Week 2: 로드맵 생성 (`/generate-roadmap`)
- Week 3-4: 실행 및 발표

---

## 8. 핵심 기능 연결도

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY WORKFLOW                           │
│  /daily-note -> Google Calendar Skill -> Daily Note 생성    │
│  /daily-review -> Telegram + Todo 통합 -> 우선순위 제안      │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                PROJECT MANAGEMENT                           │
│  /working-backwards-pr -> Thinking Partner 스타일 대화      │
│           │                                                 │
│           v                                                 │
│  /generate-roadmap -> PR/FAQ 기반 역순 로드맵               │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                KNOWLEDGE MANAGEMENT                         │
│  /idea -> 대화에서 인사이트 추출 -> 30-knowledge 저장        │
│  /todos -> 할 일 관리 -> active-todos.md                    │
│  Zettelkasten Linker -> 노트 연결 및 품질 관리              │
└─────────────────────────────────────────────────────────────┘
                              │
                              v
┌─────────────────────────────────────────────────────────────┐
│                    RESEARCH TOOLS                           │
│  Web Crawler + OCR -> 웹페이지 분석 -> 마크다운 저장         │
│  Competitor Review Analyzer -> 리뷰 분석 -> 인사이트 도출   │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 사용자 시작 가이드

### 최초 설정 (5분)
```bash
# 1. Clone
git clone https://github.com/Rhim80/imi-workspace.git
cd imi-workspace

# 2. 초기 설정
/setup-workspace

# 3. (선택) Google Calendar 연결
/setup-google-calendar

# 4. (선택) Web Crawler 설정
/setup-web-crawler
```

### 매일 사용
```bash
/daily-note          # 아침: 오늘 계획
/todos today         # 오늘 할 일 확인
/daily-review        # 저녁: 하루 정리
```

### Working Backwards 프로젝트
```bash
# 프로젝트 폴더 복사
cp -r 10-projects/00-working-backwards-template/ 10-projects/11-my-project/

# PR/FAQ 작성 (45-60분 대화형)
/working-backwards-pr

# 역순 로드맵 생성 (20-30분)
/generate-roadmap
```

---

## 10. 기술 스택 요약

| 구성요소 | 기술 |
|----------|------|
| PKM 구조 | Johnny Decimal 시스템 |
| 캘린더 | gcalcli (OAuth) |
| 웹 크롤링 | Firecrawl |
| 이미지 OCR | Gemini API (20MB 지원) |
| 리뷰 크롤링 | Firecrawl v2 + 다나와 |
| AI 에이전트 | Claude Code Subagents |
| 버전 관리 | Git |

---

## 11. Skills vs Commands vs Agents 비교

| 구분 | Skills | Commands | Agents |
|------|--------|----------|--------|
| **목적** | 외부 서비스 통합 | 내부 워크플로우 자동화 | 복잡한 다단계 작업 |
| **예시** | Google Calendar, Web Crawler | `/daily-note`, `/todos` | Zettelkasten Linker |
| **위치** | `.claude/skills/` | `.claude/commands/` | `.claude/agents/` |
| **설정** | OAuth, API 키 필요 | 설정 불필요 (즉시 사용) | 설정 불필요 |
| **호출** | 키워드 자동 감지 | `/command` 형식 | 자연어 요청 |

---

## 12. 주요 특징 요약

1. **비개발자 친화적**: CLI 환경이지만 자연어로 대화하며 사용
2. **체계적 구조**: Johnny Decimal로 AI가 이해하기 쉬운 폴더 구조
3. **Working Backwards 통합**: Amazon 방법론 기반 프로젝트 관리
4. **Daily Workflow 자동화**: 캘린더, Todo, 리뷰가 유기적으로 연결
5. **확장 가능**: Skills, Commands, Agents로 기능 확장 용이

---

**Made with Claude Code by hovoo (이림)**
F&B Professional x AI Practitioner
