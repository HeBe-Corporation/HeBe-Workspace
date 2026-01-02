/**
 * 올리브영 URL 파서
 * URL, 상품번호 등 다양한 입력을 goodsNo로 변환
 */

export interface ParsedInput {
  goodsNo: string;
  source: 'full_url' | 'goods_no' | 'invalid';
  originalInput: string;
}

/**
 * 올리브영 입력을 파싱하여 상품번호 추출
 * @param input URL 또는 상품번호
 * @returns ParsedInput 객체
 */
export function parseOliveyoungInput(input: string): ParsedInput {
  const trimmed = input.trim();

  // 패턴 1: 전체 URL
  // https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842
  // https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000235842&tab=review
  const urlMatch = trimmed.match(/goodsNo=([A-Z]?\d{9,12})/i);
  if (urlMatch) {
    const code = urlMatch[1].toUpperCase();
    const goodsNo = code.startsWith('A') ? code : 'A' + code;
    return {
      goodsNo,
      source: 'full_url',
      originalInput: trimmed
    };
  }

  // 패턴 2: 상품번호만 (A000000235842 또는 000000235842)
  const codeMatch = trimmed.match(/^[A]?(\d{9,12})$/i);
  if (codeMatch) {
    const code = trimmed.toUpperCase();
    const goodsNo = code.startsWith('A') ? code : 'A' + codeMatch[1];
    return {
      goodsNo,
      source: 'goods_no',
      originalInput: trimmed
    };
  }

  // 유효하지 않은 입력
  return {
    goodsNo: '',
    source: 'invalid',
    originalInput: trimmed
  };
}

/**
 * 상품번호로 올리브영 리뷰 페이지 URL 생성
 * @param goodsNo 상품번호
 * @returns 리뷰 페이지 URL
 */
export function buildReviewPageUrl(goodsNo: string): string {
  return `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}&tab=review`;
}

/**
 * 상품번호로 올리브영 상품 페이지 URL 생성
 * @param goodsNo 상품번호
 * @returns 상품 페이지 URL
 */
export function buildProductPageUrl(goodsNo: string): string {
  return `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
}

/**
 * 입력이 유효한지 확인
 * @param parsed ParsedInput 객체
 * @returns 유효 여부
 */
export function isValidInput(parsed: ParsedInput): boolean {
  return parsed.source !== 'invalid' && parsed.goodsNo.length > 0;
}
