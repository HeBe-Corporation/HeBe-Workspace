#!/bin/bash

# ============================================
# 특정 제품/주제에 대한 심층 리서치
# 사용법: ./deep_research.sh [cleanser|mask|hydrogel]
# ============================================

PRODUCT_TYPE=${1:-"cleanser"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$REPORT_DIR/deep_research_${PRODUCT_TYPE}_${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

echo "🔬 $PRODUCT_TYPE 심층 리서치 시작..."

# 다단계 질문 체인
case $PRODUCT_TYPE in
    "cleanser")
        PROMPTS=(
            "Step 1: 2024-2025년 한국에서 가장 인기 있는 미백 클렌저 TOP 10과 각각의 핵심 성분을 분석해줘."
            "Step 2: 위 분석을 바탕으로, 동남아 고온고습 기후에 적합한 클렌저 포뮬레이션의 핵심 요소를 정리해줘."
            "Step 3: Cotton Candy 컨셉에 맞는 클렌저의 텍스처, 향, 색상, 패키징 아이디어를 구체적으로 제안해줘."
            "Step 4: 최종적으로 Skin Nerd 미백 클렌저의 Full Formula 제안서를 작성해줘. 성분, 농도, 제형, 예상 원가, 차별화 포인트 포함."
        )
        ;;
    "mask")
        PROMPTS=(
            "Step 1: 버블마스크의 작동 원리와 Gash 제품의 성분 분석을 해줘."
            "Step 2: 버블마스크에 미백 성분을 효과적으로 배합하는 방법과 주의사항을 알려줘."
            "Step 3: Spicule을 버블마스크에 적용한 혁신 사례와 기술적 가능성을 분석해줘."
            "Step 4: Skin Nerd 버블마스크 Full Formula와 제품 컨셉 기획서를 작성해줘."
        )
        ;;
    "hydrogel")
        PROMPTS=(
            "Step 1: 프리미엄 하이드로겔 마스크 시장의 글로벌 트렌드와 혁신 기술을 분석해줘."
            "Step 2: Vegan 하이드로겔 소재의 종류와 각각의 특성, 미백 성분 호환성을 분석해줘."
            "Step 3: Jelly 타입 하이드로겔에서 흡수력과 Glow를 동시에 구현하는 포뮬레이션 전략을 제안해줘."
            "Step 4: Skin Nerd 프리미엄 하이드로겔 마스크 Full Formula와 제품 기획서를 작성해줘."
        )
        ;;
    *)
        echo "❌ 알 수 없는 제품 타입: $PRODUCT_TYPE"
        echo "사용 가능: cleanser, mask, hydrogel"
        exit 1
        ;;
esac

# 결과 파일 초기화
{
    echo "# Skin Nerd $PRODUCT_TYPE 심층 리서치 리포트"
    echo "생성일시: $(date)"
    echo ""
    echo "---"
    echo ""
} > "$OUTPUT_FILE"

# 순차적 질문 실행
CONTEXT=""
TOTAL_STEPS=${#PROMPTS[@]}

for i in "${!PROMPTS[@]}"; do
    PROMPT="${PROMPTS[$i]}"
    STEP_NUM=$((i + 1))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Step ${STEP_NUM}/${TOTAL_STEPS}: ${PROMPT:0:60}..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    {
        echo "## Step ${STEP_NUM}: ${PROMPT}"
        echo ""
    } >> "$OUTPUT_FILE"

    # 이전 컨텍스트를 포함하여 질문
    if [ -n "$CONTEXT" ]; then
        FULL_PROMPT="[이전 단계 분석 요약]
$CONTEXT

---

현재 질문: $PROMPT

이전 단계의 분석을 참고하여 답변해줘. 구체적인 성분명, 농도, 근거를 포함해줘."
    else
        FULL_PROMPT="$PROMPT

구체적인 성분명, 농도, 근거를 포함해서 상세하게 답변해줘."
    fi

    # Claude 호출 및 결과 저장
    RESPONSE=$(claude -p "$FULL_PROMPT" 2>&1)

    echo "$RESPONSE" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # 컨텍스트 누적 (마지막 응답의 핵심만)
    CONTEXT="$CONTEXT

[Step ${STEP_NUM} 핵심]
$(echo "$RESPONSE" | head -50)"

    echo "✅ Step ${STEP_NUM} 완료"

    # 다음 단계 전 잠시 대기 (API 부하 방지)
    if [ $STEP_NUM -lt $TOTAL_STEPS ]; then
        echo "⏳ 5초 대기..."
        sleep 5
    fi
done

echo ""
echo "============================================"
echo "🏁 심층 리서치 완료!"
echo "📊 리포트: $OUTPUT_FILE"
echo "============================================"
