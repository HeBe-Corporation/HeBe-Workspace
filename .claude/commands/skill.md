---
description: Run a specific skill by name
argument-hint: <skill-name> [arguments]
---

# Skill Runner

Execute a specific skill from the skills library.

## Your Task

**User's Request:** `$ARGUMENTS`

### 1. Parse Arguments

Extract:
- `skill_name`: First argument (required)
- `skill_args`: Remaining arguments (optional)

If no skill name provided:
```
사용법: /skill <skill-name> [arguments]

사용 가능한 스킬 보기: /skills list
```

### 2. Find the Skill

Check both locations in order:

1. Project-level: `.claude/skills/{skill_name}/SKILL.md`
2. User-level: `~/.claude/skills/{skill_name}/SKILL.md`

```shell
# Check project-level first
cat ".claude/skills/$SKILL_NAME/SKILL.md" 2>/dev/null

# If not found, check user-level
cat ~/.claude/skills/$SKILL_NAME/SKILL.md 2>/dev/null
```

### 3. Execute the Skill

If skill found:
1. Read the SKILL.md file
2. Follow its instructions
3. Pass any additional arguments to the skill

If skill NOT found:
```
'$SKILL_NAME' 스킬을 찾을 수 없어.

확인한 위치:
- .claude/skills/$SKILL_NAME/SKILL.md
- ~/.claude/skills/$SKILL_NAME/SKILL.md

사용 가능한 스킬 보기: /skills list
```

### 4. Available Skills (Quick Reference)

**Project-level (.claude/skills/):**
- `notion-handler` - Notion DB/페이지 관리
- `google-calendar` - 일정 조회/등록
- `transcript-organizer` - 녹음 파일 정리
- `competitor-review-analyzer` - 경쟁사 리뷰 분석
- `oliveyoung-analyzer` - 올리브영 상품 분석

## Examples

```
/skill notion-handler
/skill google-calendar 오늘 일정
/skill transcript-organizer /path/to/file.txt
```

## Remember

- Skills are auto-triggered by keywords, but /skill lets you invoke them explicitly
- Pass the skill name exactly as the folder name
- Additional arguments are passed to the skill
