#!/bin/bash

# ============================================
# 빠른 테스트 (1시간, 10분 간격)
# 시스템이 잘 작동하는지 확인용
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧪 빠른 테스트 모드 (1시간, 10분 간격)"
echo "정상 작동 확인 후 research_loop.sh로 전체 실행하세요."
echo ""

cd "$SCRIPT_DIR"
./research_loop.sh 1 10
