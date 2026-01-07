#!/bin/bash

# ============================================
# Skin Nerd 클렌저 집중 48시간 자동 리서치
# 클렌저 + 성분(Ingredients) 심층 분석
# ============================================

DURATION_HOURS=48
INTERVAL_MINUTES=30
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR" "$REPORT_DIR"

# 클렌저 집중 리서치 질문 (35개)
QUESTIONS=(
    # === 미백 클렌저 성분 분석 (10개) ===
    "미백 클렌저에 사용되는 Glutathione의 최적 농도, 안정화 방법, pH 조건을 상세히 분석해줘. 클렌저 제형에서의 효능 발현 메커니즘도 설명해줘."

    "Niacinamide를 클렌저에 적용할 때의 최적 농도(3-5% vs 10%), 다른 성분과의 호환성, 세정 후 피부 잔류율을 분석해줘."

    "Alpha Arbutin vs Beta Arbutin: 클렌저 제형에서의 안정성, 효능 차이, 권장 농도를 비교 분석해줘."

    "Tranexamic Acid를 클렌저에 적용할 때의 장단점, 최적 농도, 제형 안정성 확보 방법을 알려줘."

    "Vitamin C 유도체(AA2G, SAP, MAP, APPS) 중 클렌저 제형에 가장 적합한 종류와 그 이유를 설명해줘. 안정성과 침투율 비교 포함."

    "PDRN을 클렌저에 적용할 때의 분자량 고려사항, 최적 농도(0.01-0.1%), 세정 시간 내 효능 발현 가능성을 분석해줘."

    "Kojic Acid를 클렌저에 사용할 때의 안정성 문제, 변색 방지 방법, 다른 미백 성분과의 시너지를 설명해줘."

    "Licorice Root Extract(감초추출물)의 미백 성분(Glabridin, Liquiritin)별 효능 차이와 클렌저 적용 시 권장 농도를 알려줘."

    "Azelaic Acid를 클렌저 제형에 적용할 때의 용해도 문제 해결 방법, 최적 농도, 미백+여드름 이중 효과 구현 전략을 설명해줘."

    "미백 성분 조합 최적화: Glutathione + Niacinamide + Arbutin 3종 조합의 시너지 효과와 권장 배합 비율을 제안해줘."

    # === 동남아 시장 최적화 (8개) ===
    "동남아(베트남, 캄보디아, 태국) 고온고습 기후에서 클렌저의 텍스처 안정성 확보 방법과 권장 점도 범위를 알려줘."

    "동남아 소비자의 클렌저 선호도 조사: 폼 vs 젤 vs 오일 vs 밀크 타입별 시장 점유율과 선호 이유를 분석해줘."

    "동남아 각국의 미백 화장품 규제: 금지 성분, 허용 농도, 필수 표기사항을 국가별로 정리해줘."

    "베트남 Shopee, Lazada에서 인기 있는 미백 클렌저 TOP 10과 각각의 핵심 성분, 가격대를 분석해줘."

    "태국 Watson's, Boots에서 판매되는 프리미엄 미백 클렌저의 성분 구성과 마케팅 포인트를 분석해줘."

    "캄보디아 화장품 시장의 K-Beauty 클렌저 점유율, 인기 제품, 소비자 선호 포인트를 조사해줘."

    "동남아 시장에서 'Glow'를 강조하는 클렌저의 성분 구성 트렌드와 마케팅 키워드를 분석해줘."

    "열대 기후에서 끈적임 없이 촉촉함을 유지하는 클렌저 포뮬레이션 전략(Humectant vs Emollient 비율)을 제안해줘."

    # === 클렌저 텍스처/제형 (7개) ===
    "휘핑 클렌저(Whipped Cleanser)의 제조 원리, 핵심 성분, 텍스처 유지 방법을 상세히 설명해줘."

    "버블 클렌저 vs 폼 클렌저: 거품 생성 메커니즘, 세정력, 피부 자극도 비교와 각각의 장단점을 분석해줘."

    "젤 클렌저의 투명도 유지 방법, 겔화제 종류별 특성, 미백 성분 배합 시 주의사항을 알려줘."

    "오일 클렌저에 수용성 미백 성분을 안정적으로 배합하는 기술(나노에멀전, 마이크로캡슐 등)을 설명해줘."

    "밀크 클렌저의 유화 안정성 확보 방법, HLB 밸런스, 미백 성분 배합 전략을 알려줘."

    "클렌저의 pH 최적화: 미백 성분별 최적 pH 범위와 피부 pH(4.5-5.5) 밸런스 전략을 제안해줘."

    "Cotton Candy 컨셉에 맞는 클렌저 텍스처, 색상(파스텔 핑크/블루), 향료, 패키징 아이디어를 구체적으로 제안해줘."

    # === 경쟁사/시장 분석 (5개) ===
    "Arencia 클렌저의 전성분 분석, 핵심 기술, 소비자 반응을 조사하고 개선 포인트를 제안해줘."

    "2024-2025년 한국 미백 클렌저 시장 TOP 10 제품의 성분, 가격, 마케팅 전략을 비교 분석해줘."

    "일본 미백 클렌저(Hada Labo, FANCL, SK-II 등)의 성분 트렌드와 한국 제품과의 차별점을 분석해줘."

    "글로벌 클린뷰티 트렌드에 맞는 미백 클렌저 포뮬레이션: 비건, 크루얼티프리, 마이크로플라스틱 프리 구현 방법을 알려줘."

    "프리미엄 미백 클렌저(3만원 이상)와 매스 미백 클렌저(1만원 미만)의 성분 차이와 가격 정당화 요소를 분석해줘."

    # === OEM/제조 관련 (5개) ===
    "한국 OEM사 중 미백 클렌저 전문 업체 정보: 최소 MOQ, 특화 기술, 예상 원가를 조사해줘."

    "클렌저 OEM 생산 시 품질 관리 체크포인트: 미생물, 안정성, 사용감 테스트 항목을 정리해줘."

    "클렌저 원가 구조 분석: 원료비, 용기비, 인건비, 마진 구조와 가격대별 원료 선택 전략을 알려줘."

    "소량 생산(MOQ 1000개 이하) 가능한 클렌저 OEM 업체와 그들의 특화 기술을 조사해줘."

    "클렌저 Full Formula 제안: Skin Nerd 미백 클렌저의 전성분 리스트, 농도, 제형, 예상 원가, 차별화 포인트를 포함한 최종 제안서를 작성해줘."
)

TOTAL_QUESTIONS=${#QUESTIONS[@]}
END_TIME=$(($(date +%s) + DURATION_HOURS * 3600))

echo "============================================"
echo "🧴 Skin Nerd 클렌저 집중 48시간 리서치"
echo "============================================"
echo "시작: $(date)"
echo "종료 예정: $(date -d @$END_TIME 2>/dev/null || date -r $END_TIME)"
echo "질문 주기: ${INTERVAL_MINUTES}분"
echo "총 질문: ${TOTAL_QUESTIONS}개"
echo "로그: $LOG_DIR"
echo "============================================"

# 성분 리서치 파일 초기화
INGREDIENTS_FILE="$REPORT_DIR/cleanser_ingredients_${TIMESTAMP}.md"
{
    echo "# Skin Nerd 클렌저 성분(Ingredients) 리서치"
    echo "생성일시: $(date)"
    echo ""
    echo "---"
    echo ""
} > "$INGREDIENTS_FILE"

# 메인 루프
ITERATION=1
QUESTION_INDEX=0

while [ $(date +%s) -lt $END_TIME ]; do
    CURRENT_QUESTION="${QUESTIONS[$QUESTION_INDEX]}"
    LOG_FILE="$LOG_DIR/cleanser_${TIMESTAMP}_$(printf '%03d' $ITERATION).md"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔬 #${ITERATION} | $(date '+%H:%M:%S') | Q$((QUESTION_INDEX + 1))/${TOTAL_QUESTIONS}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 로그 파일 헤더
    {
        echo "# 클렌저 리서치 #${ITERATION}"
        echo "- 시간: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- 질문: $((QUESTION_INDEX + 1))/${TOTAL_QUESTIONS}"
        echo ""
        echo "## 질문"
        echo "$CURRENT_QUESTION"
        echo ""
        echo "## 응답"
        echo ""
    } > "$LOG_FILE"

    # Claude 호출
    FULL_PROMPT="$CURRENT_QUESTION

응답 형식:
1. 상세 분석 (구체적인 성분명, 농도, 근거 포함)
2. 핵심 인사이트 3줄 요약
3. 성분 리스트 (INCI명, 권장 농도, 역할)
4. 추가 조사 필요 포인트"

    RESPONSE=$(claude -p "$FULL_PROMPT" 2>&1)
    echo "$RESPONSE" >> "$LOG_FILE"

    # 성분 파일에 누적
    {
        echo "## Q$((QUESTION_INDEX + 1)): ${CURRENT_QUESTION:0:50}..."
        echo ""
        echo "$RESPONSE"
        echo ""
        echo "---"
        echo ""
    } >> "$INGREDIENTS_FILE"

    echo "✅ 저장: $(basename $LOG_FILE)"

    # 다음 질문
    QUESTION_INDEX=$(( (QUESTION_INDEX + 1) % TOTAL_QUESTIONS ))
    ITERATION=$((ITERATION + 1))

    # 대기
    if [ $(date +%s) -lt $END_TIME ]; then
        echo "⏳ ${INTERVAL_MINUTES}분 대기..."
        sleep $((INTERVAL_MINUTES * 60))
    fi
done

# 최종 리포트 생성
FINAL_REPORT="$REPORT_DIR/cleanser_final_report_${TIMESTAMP}.md"
{
    echo "# Skin Nerd 클렌저 48시간 리서치 최종 보고서"
    echo "- 생성: $(date)"
    echo "- 총 질문: $((ITERATION - 1))회"
    echo "- 기간: ${DURATION_HOURS}시간"
    echo ""
    echo "---"
    echo ""
    echo "# 전체 리서치 로그"
    echo ""
    for log in "$LOG_DIR"/cleanser_${TIMESTAMP}_*.md; do
        [ -f "$log" ] && cat "$log" && echo -e "\n---\n"
    done
} > "$FINAL_REPORT"

echo ""
echo "============================================"
echo "🏁 48시간 리서치 완료!"
echo "📊 최종 보고서: $FINAL_REPORT"
echo "🧪 성분 리서치: $INGREDIENTS_FILE"
echo "============================================"
