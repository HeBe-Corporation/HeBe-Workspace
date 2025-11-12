# Push All Git Repositories

모든 독립 Git 저장소를 한번에 commit 후 push합니다.

## 실행 순서

### Step 0: Daily Note 업데이트 (Commit 전 필수)
- `/daily-note` 슬래시 커맨드 실행
- 오늘 날짜 Daily Note가 자동으로 업데이트됨
- Daily Note 파일이 PKM 메인에 추가됨

### Step 1: Git Commit

**커밋 메시지**: "🔄 자동 업데이트"

**환경별 경로:**

1. **PKM 메인**
   - Windows: `c:\Users\hovoo\Documents\claude-projects\pkm\`
   - WSL: `/home/rhim/claude-projects/pkm/`
   - Mac: `/Users/rhim/Projects/pkm/`

2. **imi-workspace (GPTers 스터디용)**
   - Windows: `c:\Users\hovoo\Documents\claude-projects\imi-workspace\`
   - WSL: `/home/rhim/claude-projects/imi-workspace/`
   - Mac: `/Users/rhim/Projects/imi-workspace/`

### Step 2: Git Push

**순서:**
1. PKM 메인 push
2. imi-workspace push

## 지시사항

- **Step 0**: `/daily-note` 커맨드를 먼저 실행하세요
- **Step 1**: 각 저장소에서 `git add . && git commit -m "🔄 자동 업데이트"` 실행
  - 순서: PKM 메인 → imi-workspace
- **Step 2**: 각 저장소에서 `git push origin main` 실행 (명시적으로!)
  - 순서: PKM 메인 → imi-workspace
  - **중요**: `git push` 대신 `git push origin main`을 사용하여 확실하게 push
- 변경사항이 없는 경우 "변경사항 없음"을 알려주세요
- 각 단계의 성공/실패 여부를 명확히 알려주세요
- 모든 작업 완료 후 요약 리포트를 제공하세요

## 출력 예시

```
========================================
모든 Git 저장소 Push 시작
========================================

커밋 메시지: "🔄 자동 업데이트"

[Step 0] Daily Note 업데이트
✅ Daily Note 업데이트 완료

[Step 1] Commit 단계
[1/2] PKM 메인
✅ Commit 완료 (3 files changed)

[2/2] imi-workspace
ℹ️ 변경사항 없음

[Step 2] Push 단계
[1/2] PKM 메인
✅ Push 완료

[2/2] imi-workspace
ℹ️ Push 건너뜀 (변경사항 없음)

========================================
✅ 모든 작업 완료!
========================================
```
