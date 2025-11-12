# Pull All Git Repositories

모든 독립 Git 저장소를 한번에 pull합니다.

## 실행 순서

**환경별 경로:**

### 1. PKM 메인
- Windows: `c:\Users\hovoo\Documents\claude-projects\pkm\`
- WSL: `/home/rhim/claude-projects/pkm/`
- Mac: `/Users/rhim/Projects/pkm/`
- 명령: `git pull`

### 2. imi-workspace (GPTers 스터디용)
- Windows: `c:\Users\hovoo\Documents\claude-projects\imi-workspace\`
- WSL: `/home/rhim/claude-projects/imi-workspace/`
- Mac: `/Users/rhim/Projects/imi-workspace/`
- 명령: `git pull`

## 지시사항

- **Step 1**: PKM 메인 저장소에서 `git pull` 실행
- **Step 2**: imi-workspace 저장소에서 `git pull` 실행
- 변경사항이 없으면 "Already up to date" 표시
- 각 단계의 성공/실패 여부를 명확히 알려주세요
- 모든 작업 완료 후 요약 리포트를 제공하세요

## 출력 예시

```
========================================
모든 Git 저장소 Pull 시작
========================================

[Step 1] PKM 메인 pull
✅ Already up to date

[Step 2] imi-workspace pull
✅ Pull 완료 (2 files changed)

========================================
✅ 모든 저장소 동기화 완료!
========================================
```

## 참고

- PKM: 개인 지식 관리 시스템 (모든 프로젝트 통합됨)
- imi-workspace: GPTers 19기 스터디용 템플릿 저장소
