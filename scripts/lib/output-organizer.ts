/**
 * Output Organizer - 결과물 자동 폴더 정리 유틸리티
 *
 * 사용법:
 *   import { getOutputPath, ensureOutputDir } from './lib/output-organizer';
 *   const outputPath = getOutputPath('oliveyoung', 'data', 'A000000204014');
 *   // => output/oliveyoung/2026-01/A000000204014.json
 */

import * as fs from 'fs';
import * as path from 'path';

// 프로젝트 타입 정의
export type ProjectType = 'oliveyoung' | 'danawa' | 'competitor' | 'other';
export type OutputType = 'data' | 'analysis' | 'temp';

// 워크스페이스 루트 경로
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');
const OUTPUT_ROOT = path.join(WORKSPACE_ROOT, 'output');

/**
 * 현재 날짜 기반 폴더명 생성 (YYYY-MM)
 */
function getDateFolder(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 출력 경로 생성
 * @param project - 프로젝트 타입 (oliveyoung, danawa, etc.)
 * @param type - 출력 타입 (data, analysis, temp)
 * @param filename - 파일명 (확장자 제외)
 * @param extension - 파일 확장자 (기본: json)
 * @returns 전체 파일 경로
 */
export function getOutputPath(
  project: ProjectType,
  type: OutputType,
  filename: string,
  extension: string = 'json'
): string {
  const dateFolder = getDateFolder();

  // temp 타입은 archive 폴더로
  if (type === 'temp') {
    return path.join(OUTPUT_ROOT, 'archive', `${filename}.${extension}`);
  }

  // data와 analysis는 프로젝트/날짜 폴더로
  return path.join(OUTPUT_ROOT, project, dateFolder, `${filename}.${extension}`);
}

/**
 * 출력 디렉토리 생성 (없으면 생성)
 * @param outputPath - 파일 전체 경로
 */
export function ensureOutputDir(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 파일 저장 (자동 폴더 생성 포함)
 * @param project - 프로젝트 타입
 * @param type - 출력 타입
 * @param filename - 파일명
 * @param data - 저장할 데이터
 * @param extension - 파일 확장자
 * @returns 저장된 파일 경로
 */
export function saveOutput(
  project: ProjectType,
  type: OutputType,
  filename: string,
  data: string | object,
  extension: string = 'json'
): string {
  const outputPath = getOutputPath(project, type, filename, extension);
  ensureOutputDir(outputPath);

  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log(`[OutputOrganizer] 저장됨: ${outputPath}`);
  return outputPath;
}

/**
 * 타임스탬프 포함 파일명 생성
 * @param prefix - 파일명 접두사
 * @returns 타임스탬프가 포함된 파일명
 */
export function getTimestampedFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}`;
}

// 편의 함수들
export const oliveyoung = {
  /**
   * 올리브영 크롤링 데이터 저장
   */
  saveData: (productCode: string, data: object, format: 'json' | 'csv' = 'json') => {
    const filename = getTimestampedFilename(productCode);
    return saveOutput('oliveyoung', 'data', filename, data, format);
  },

  /**
   * 올리브영 분석 결과 저장
   */
  saveAnalysis: (productName: string, content: string) => {
    const filename = `${productName}-analysis`;
    return saveOutput('oliveyoung', 'analysis', filename, content, 'md');
  },

  /**
   * 출력 경로만 가져오기 (저장 X)
   */
  getPath: (productCode: string, format: 'json' | 'csv' = 'json') => {
    const filename = getTimestampedFilename(productCode);
    return getOutputPath('oliveyoung', 'data', filename, format);
  }
};

export default {
  getOutputPath,
  ensureOutputDir,
  saveOutput,
  getTimestampedFilename,
  oliveyoung
};
