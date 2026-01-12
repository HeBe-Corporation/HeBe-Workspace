---
description: Discover and activate relevant skills for your current task
argument-hint: [category|search-term] (optional)
---

# Skills Discovery Assistant

You are helping the user discover and activate relevant skills from their skills library at `~/.claude/skills/` and `.claude/skills/`.

## Your Task

**User's Request:** `$ARGUMENTS`

Follow these steps:

### 1. Read Skills Index

First, check both locations for skills:

```shell
# Project-level skills
ls -la .claude/skills/ 2>/dev/null

# User-level skills
ls -la ~/.claude/skills/ 2>/dev/null
```

### 2. Detect Project Context

Analyze the current directory to understand the project:

```shell
# List files to detect project type
ls -la | head -30

# Check for language/framework indicators
ls *.{json,md,go,py,rs,swift,zig,toml,yaml,yml} 2>/dev/null | head -20
```

**Technology Detection:**
- `package.json` → JavaScript/TypeScript/Node.js → Frontend skills
- `go.mod` → Go → TUI (Bubble Tea), API, or CLI skills
- `requirements.txt`, `pyproject.toml`, `uv.lock` → Python → uv, API, or ML skills
- `Cargo.toml` → Rust → TUI (Ratatui), systems programming
- `build.zig` → Zig → Zig-specific skills
- `*.swift`, `*.xcodeproj` → Swift/iOS → iOS skills
- `Dockerfile`, `docker-compose.yml` → Container skills

### 3. Analyze Conversation Context

Review the current conversation for:
- Technologies mentioned (frameworks, tools, databases)
- Problems discussed (performance, debugging, deployment)
- Explicit skill requests
- Work phase (planning, implementation, testing, deployment)

### 4. Provide Contextual Recommendations

Based on the argument provided:

**If NO ARGUMENT (default view):**

Display in this format:

```
━━━ SKILLS DISCOVERY ━━━

PROJECT-LEVEL SKILLS (.claude/skills/):
→ [skill-name] - [one-line description]
→ [skill-name] - [one-line description]

USER-LEVEL SKILLS (~/.claude/skills/):
→ [skill-name] - [one-line description]

COMMANDS:
/skills [name] - View specific skill details
/skills list - Show all available skills
```

**If ARGUMENT = skill name:**

Read and display the skill's SKILL.md file with:
- Name and description
- Trigger keywords
- Available tools
- Usage instructions

**If ARGUMENT = "list":**

Show all available skills from both locations:

```
━━━ ALL AVAILABLE SKILLS ━━━

PROJECT-LEVEL (.claude/skills/):
→ notion-handler - Notion DB/페이지 관리
→ google-calendar - 일정 조회/등록
→ transcript-organizer - 녹음 파일 정리
→ competitor-review-analyzer - 경쟁사 리뷰 분석
→ oliveyoung-analyzer - 올리브영 상품 분석

USER-LEVEL (~/.claude/skills/):
[List any skills found here]

[View skill details: /skills notion-handler]
```

### 5. Output Requirements

**Format Guidelines:**
- Use Unicode box drawing (━ ─ │) for section headers
- Keep output concise and actionable
- Use `→` for list items
- Include next steps
- Show file paths for reference

**Tone:**
- Helpful and direct (반말)
- Low noise, high signal
- Focus on relevance to current work

**DO NOT:**
- Modify any skill files
- Create new skills
- Make assumptions about skills you haven't read

### 6. Graceful Fallbacks

**If no skills found:**

```
스킬을 찾을 수 없어.

확인할 위치:
- .claude/skills/ (프로젝트 레벨)
- ~/.claude/skills/ (사용자 레벨)

스킬 만들기: /create-command
```

## Remember

- This is a **discovery tool** — help users find relevant skills
- Check both project and user-level skill directories
- Match skills to project context when possible
- Keep output concise and actionable
- Never modify the skills library
