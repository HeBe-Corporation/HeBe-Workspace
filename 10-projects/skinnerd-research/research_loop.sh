#!/bin/bash

# ============================================
# Skin Nerd R&D 자동 리서치 루프
# 사용법: ./research_loop.sh [duration_hours] [interval_minutes]
# 예시: ./research_loop.sh 48 30  (48시간 동안 30분마다 실행)
# ============================================

DURATION_HOURS=${1:-24}  # 기본 24시간
INTERVAL_MINUTES=${2:-60}  # 기본 60분
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR" "$REPORT_DIR"

# 리서치 질문 배열
QUESTIONS=(
    # 클렌저 관련
    "Arencia 클렌저와 Whipped 클렌저의 핵심 성분을 비교 분석하고, 동남아 시장에 최적화된 미백 클렌저 포뮬레이션을 제안해줘. 특히 비끈적이면서 Glow를 낼 수 있는 성분 조합에 집중해줘."

    "Cotton Candy 컨셉에 맞는 클렌저 텍스처(휘핑, 버블, 젤, 폼 등) 중 동남아 고온고습 기후에 가장 적합한 제형과 그 이유를 설명해줘."

    "클렌저에 PDRN을 적용할 때의 장단점과 최적 농도, 제형 안정성 확보 방법을 알려줘."

    "미백 클렌저에 적용 가능한 최신 트렌드 성분 5가지와 각각의 작용 기전, 권장 농도를 알려줘."

    # 버블 마스크 관련
    "Gash 버블마스크의 성공 요인을 분석하고, 이를 개선한 미백+Glow 특화 버블마스크 컨셉을 제안해줘."

    "버블마스크에서 산소(O2) 버블 생성 메커니즘과 미백 성분의 효능 시너지 방법을 설명해줘."

    "Spicule(해면침)을 버블마스크에 적용할 때의 기술적 고려사항과 소비자 수용성을 분석해줘."

    "동남아 소비자가 선호하는 마스크팩 사용 경험(향, 텍스처, 시간 등)에 대한 인사이트를 제공해줘."

    # 하이드로겔 마스크 관련
    "하이드로겔 마스크의 기재(base material) 종류별 장단점을 비교하고, 미백+Glow에 최적화된 소재를 추천해줘."

    "100% Vegan 하이드로겔 마스크 제조가 가능한 소재와 미백 성분 조합을 제안해줘."

    "하이드로겔 마스크에 캡슐 기술(마이크로캡슐, 리포좀 등)을 적용한 혁신 사례와 Skin Nerd에 적용 가능한 아이디어를 제안해줘."

    "Jelly Mask 타입 하이드로겔의 흡수력을 극대화하면서 끈적임을 줄이는 포뮬레이션 전략을 알려줘."

    # 성분 심층 분석
    "Glutathione, Niacinamide, Arbutin, Tranexamic Acid 중 동남아 시장에서 가장 효과적인 미백 성분 조합과 그 근거를 제시해줘."

    "PDRN vs Exosome vs Salmon DNA: 재생/미백 효능 비교와 가격대비 효과 분석을 해줘."

    "동남아 각국(베트남, 캄보디아, 태국, 인도네시아)의 화장품 미백 성분 규제 현황을 정리해줘."

    # 시장/트렌드 분석
    "2024-2025 동남아 스킨케어 시장에서 가장 빠르게 성장하는 카테고리와 성분 트렌드를 분석해줘."

    "베트남 Shopee, Lazada에서 인기 있는 미백 제품들의 공통 성분과 마케팅 포인트를 분석해줘."

    "K-Beauty가 동남아에서 성공한 미백 제품 사례와 그 성공 요인을 분석해줘."

    # 제조/OEM 관련
    "한국 OEM사 중 버블마스크, 하이드로겔 마스크 전문 업체 정보와 최소 MOQ, 특화 기술을 조사해줘."

    "Cotton Candy 컨셉을 구현할 수 있는 패키징 디자인과 향료(fragrance) 옵션을 제안해줘."
)

# 현재 질문 인덱스 (순환)
QUESTION_INDEX=0
TOTAL_QUESTIONS=${#QUESTIONS[@]}

# 종료 시간 계산
END_TIME=$(($(date +%s) + DURATION_HOURS * 3600))

echo "============================================"
echo "Skin Nerd R&D 자동 리서치 시작"
echo "시작 시간: $(date)"
echo "종료 예정: $(date -d @$END_TIME 2>/dev/null || date -r $END_TIME)"
echo "질문 주기: ${INTERVAL_MINUTES}분"
echo "총 질문 수: ${TOTAL_QUESTIONS}개 (순환)"
echo "로그 폴더: $LOG_DIR"
echo "============================================"

# 메인 루프
ITERATION=1
while [ $(date +%s) -lt $END_TIME ]; do
    CURRENT_QUESTION="${QUESTIONS[$QUESTION_INDEX]}"
    LOG_FILE="$LOG_DIR/research_${TIMESTAMP}_$(printf '%03d' $ITERATION).md"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔬 반복 #${ITERATION} | $(date '+%Y-%m-%d %H:%M:%S')"
    echo "📋 질문 #$((QUESTION_INDEX + 1))/${TOTAL_QUESTIONS}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 결과 파일 헤더 작성
    {
        echo "# Research Log #${ITERATION}"
        echo "- 시간: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- 질문 번호: $((QUESTION_INDEX + 1))/${TOTAL_QUESTIONS}"
        echo ""
        echo "## 질문"
        echo "$CURRENT_QUESTION"
        echo ""
        echo "## Claude 응답"
        echo ""
    } > "$LOG_FILE"

    # Claude Code 호출
    FULL_PROMPT="$CURRENT_QUESTION

응답 마지막에 반드시 포함해줘:
1. 핵심 인사이트 3줄 요약
2. 추가 조사가 필요한 포인트
3. 다음에 물어볼 후속 질문 2개"

    claude -p "$FULL_PROMPT" >> "$LOG_FILE" 2>&1

    echo "✅ 결과 저장: $LOG_FILE"

    # 다음 질문으로
    QUESTION_INDEX=$(( (QUESTION_INDEX + 1) % TOTAL_QUESTIONS ))
    ITERATION=$((ITERATION + 1))

    # 대기 (마지막 반복이 아닌 경우)
    if [ $(date +%s) -lt $END_TIME ]; then
        echo "⏳ 다음 질문까지 ${INTERVAL_MINUTES}분 대기..."
        sleep $((INTERVAL_MINUTES * 60))
    fi
done

echo ""
echo "============================================"
echo "🏁 리서치 완료!"
echo "종료 시간: $(date)"
echo "총 반복 횟수: $((ITERATION - 1))"
echo "로그 위치: $LOG_DIR"
echo "============================================"

# 최종 리포트 생성
FINAL_REPORT="$REPORT_DIR/final_report_${TIMESTAMP}.md"
{
    echo "# Skin Nerd R&D 자동 리서치 최종 리포트"
    echo "- 생성일시: $(date)"
    echo "- 총 반복: $((ITERATION - 1))회"
    echo "- 소요시간: ${DURATION_HOURS}시간"
    echo ""
    echo "---"
    echo ""
    echo "# 전체 로그 요약"
    echo ""
    for log in "$LOG_DIR"/research_${TIMESTAMP}_*.md; do
        if [ -f "$log" ]; then
            echo "## $(basename "$log")"
            cat "$log"
            echo ""
            echo "---"
            echo ""
        fi
    done
} > "$FINAL_REPORT"

echo "📊 최종 리포트: $FINAL_REPORT"
