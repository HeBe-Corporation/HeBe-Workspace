# Skin Nerd R&D 자동 리서치 시스템

## 빠른 시작

### Git Bash에서 실행

```bash
# 1. 폴더로 이동
cd "/c/Users/mikae/.claude/HeBe-Workspace (MikaelKJK)/10-projects/skinnerd-research"

# 2. 실행 권한 부여 (최초 1회)
chmod +x *.sh

# 3-a. 빠른 테스트 (1시간)
./quick_test.sh

# 3-b. 24시간 리서치 (60분 간격)
./research_loop.sh 24 60

# 3-c. 48시간 리서치 (30분 간격)
./research_loop.sh 48 30

# 3-d. 심층 리서치
./deep_research.sh cleanser
./deep_research.sh mask
./deep_research.sh hydrogel
```

### 백그라운드 실행 (터미널 닫아도 계속)

```bash
nohup ./research_loop.sh 48 30 > output.log 2>&1 &
```

## 폴더 구조

```
skinnerd-research/
├── research_loop.sh   # 메인 자동 루프
├── deep_research.sh   # 제품별 심층 리서치
├── quick_test.sh      # 1시간 테스트
├── logs/              # 개별 질문 로그
└── reports/           # 최종 리포트
```

## 결과 확인

```bash
# 실시간 로그
tail -f logs/research_*.md

# 최종 리포트
cat reports/final_report_*.md
```

## 질문 수정

`research_loop.sh` 파일의 `QUESTIONS` 배열을 직접 편집해서 질문 추가/수정 가능.
