# Setup Workspace - 초기 설정 마법사

IMI Workspace를 처음 사용할 때 실행하는 간단한 설정 도구입니다.

## 수행 작업

### 0. CLAUDE.md 설정 (가장 중요!)

**Claude가 프로젝트 맥락을 이해하는 핵심 파일입니다.**

1. 템플릿 복사:
   ```bash
   cp CLAUDE.md.template CLAUDE.md
   ```

2. 본인 정보로 수정:
   - 이름, 역할
   - 워크스페이스 목적
   - 진행 중인 프로젝트

### 1. 환영 메시지
- IMI Workspace 소개
- Johnny Decimal 시스템 간단 설명

### 2. 사용자 정보 수집
- **이름만** 간단히 묻기
- 예: "안녕하세요! 이름이 무엇인가요?"

### 3. 필수 파일 생성
- `40-personal/41-daily/[오늘날짜].md` - 첫 Daily Note
- `40-personal/46-todos/active-todos.md` - 할 일 관리

### 4. 다음 단계 안내

주요 커맨드 소개:
- `/daily-note` - 매일 노트 작성
- `/thinking-partner` - AI 사고 파트너
- `/gather`, `/reframe`, `/truth` - 오케스트레이션 커맨드

README.md 참고 안내:
- Johnny Decimal 폴더 구조
- 프로젝트 시작 방법

## 실행 방법

```bash
/setup-workspace
```

## 중요: 이 커맨드는 하지 않습니다

- 프로젝트 폴더 자동 생성하지 않음
- 복잡한 질문하지 않음
- Git 설정하지 않음

→ **이유**: 사용자가 README.md를 보고 Johnny Decimal 구조를 이해한 후, 직접 또는 대화형으로 적절한 위치에 폴더를 만드는 것이 더 좋습니다.

## 재실행 가능

언제든 다시 실행 가능합니다. 기존 파일이 있으면 덮어쓰지 않습니다.

## 다음 단계

1. **CLAUDE.md 수정** - 본인 정보 입력 (가장 중요!)
2. **README.md 읽기** - 폴더 구조 이해
3. **첫 Daily Note 작성** - `/daily-note` 실행

**선택적: Skills 설정** (프로젝트 전용):
- **Google Calendar 연동** - `/setup-google-calendar` (5분 소요)
- 자세한 내용: `.claude/skills/README.md` 참고

> **프로젝트 스킬이란?**
> 이 워크스페이스에만 적용되는 skills입니다.
> 전역 스킬(`~/.claude/skills/`)과 독립적으로 작동합니다.
