/**
 * 올리브영 리뷰 분석기 - Electron 메인 프로세스
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

// lib 모듈 import
import { crawlReviews, extractGoodsNo } from './lib/crawler';
import { analyzeReviews, analyzeImprovementOpportunities } from './lib/analyzer';
import { generateMarkdownReport, saveResults } from './lib/reporter';
import {
  formatKeyword,
  formatCategory,
  CATEGORY_TRANSLATIONS
} from './lib/keywords';

let mainWindow: any = null;
let browserInstalled = false;

// Playwright 브라우저 설치 확인 및 설치
async function ensurePlaywrightBrowser(): Promise<boolean> {
  if (browserInstalled) return true;

  try {
    // chromium 실행 파일 존재 확인
    const { chromium } = require('playwright');
    const browserPath = chromium.executablePath();
    const fs = require('fs');

    if (fs.existsSync(browserPath)) {
      browserInstalled = true;
      return true;
    }
  } catch (e) {
    // 브라우저 없음
  }

  // 브라우저 설치 필요
  return new Promise((resolve) => {
    const result = dialog.showMessageBoxSync({
      type: 'info',
      title: '브라우저 설치 필요 (Browser Installation Required)',
      message: '크롤링에 필요한 브라우저를 설치합니다.\n(Installing browser required for crawling.)\n\n약 150MB 다운로드 - 1~2분 소요됩니다.',
      buttons: ['설치 (Install)', '취소 (Cancel)'],
      defaultId: 0
    });

    if (result === 1) {
      resolve(false);
      return;
    }

    // 설치 진행
    try {
      mainWindow?.webContents.send('progress', {
        message: '브라우저 설치 중... (Installing browser...)',
        percent: 10
      });

      // npx playwright install chromium 실행
      const npmPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      execSync(`${npmPath} playwright install chromium`, {
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' }
      });

      browserInstalled = true;
      dialog.showMessageBoxSync({
        type: 'info',
        title: '설치 완료 (Installation Complete)',
        message: '브라우저 설치가 완료되었습니다!\n(Browser installation complete!)'
      });
      resolve(true);
    } catch (error: any) {
      dialog.showErrorBox(
        '설치 실패 (Installation Failed)',
        `브라우저 설치에 실패했습니다.\n(Browser installation failed.)\n\n수동 설치: npx playwright install chromium\n\n${error.message}`
      );
      resolve(false);
    }
  });
}

// 윈도우 생성
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: '올리브영 리뷰 분석기',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 핸들러: 분석 실행
ipcMain.handle('analyze', async (_event: any, input: string) => {
  const goodsNo = extractGoodsNo(input);
  if (!goodsNo) {
    return { success: false, error: '유효하지 않은 URL 또는 상품번호입니다. (Invalid URL or product number.)' };
  }

  const sendProgress = (msg: string, percent: number) => {
    mainWindow?.webContents.send('progress', { message: msg, percent });
  };

  // 브라우저 설치 확인
  const browserReady = await ensurePlaywrightBrowser();
  if (!browserReady) {
    return { success: false, error: '브라우저가 설치되지 않았습니다. (Browser not installed.)' };
  }

  try {
    // 1. 크롤링
    const crawlResult = await crawlReviews(goodsNo, sendProgress);

    if (crawlResult.reviews.length === 0) {
      return { success: false, error: '리뷰를 수집하지 못했습니다.' };
    }

    // 2. 분석
    sendProgress('리뷰 분석 중...', 92);
    const analysis = analyzeReviews(crawlResult);
    const improvements = analyzeImprovementOpportunities(crawlResult, analysis);

    // 3. 저장 - 체계적 폴더 구조 사용
    sendProgress('파일 저장 중...', 95);
    const baseDir = path.join(app.getPath('documents'), '올리브영분석');
    const { jsonPath, csvPath, organizedDir } = saveResults(crawlResult, baseDir);
    const reportPath = generateMarkdownReport({
      crawlResult,
      analysis,
      improvements,
      outputDir: organizedDir  // 조직화된 폴더 경로 전달
    });

    sendProgress('완료!', 100);

    // 감성 분석 계산
    const positiveCount = crawlResult.reviews.filter((r: any) => r.rating >= 4).length;
    const negativeCount = crawlResult.reviews.filter((r: any) => r.rating <= 2).length;
    const neutralCount = crawlResult.reviews.length - positiveCount - negativeCount;

    // 피부고민 분석
    const skinConcerns: Record<string, number> = {};
    crawlResult.reviews.forEach((r: any) => {
      if (r.skinConcern) {
        skinConcerns[r.skinConcern] = (skinConcerns[r.skinConcern] || 0) + 1;
      }
    });

    // 카테고리별 키워드 정리
    const categories: Record<string, any> = {};
    const allKeywords = [...analysis.keywords.positive, ...analysis.keywords.negative];

    Object.keys(CATEGORY_TRANSLATIONS).forEach(cat => {
      const catKeywords = allKeywords
        .filter((kw: any) => kw.category === cat)
        .map((kw: any) => ({
          ...kw,
          formatted: formatKeyword(kw.keyword)
        }));

      if (catKeywords.length > 0) {
        categories[cat] = {
          name: formatCategory(cat),
          items: catKeywords
        };
      }
    });

    // 개선 기회 정리
    const improvementsList = improvements.slice(0, 4).map((imp: any) => ({
      title: imp.opportunity,
      description: imp.suggestedAction,
      count: imp.frequency,
      issue: imp.issue
    }));

    return {
      success: true,
      data: {
        productName: crawlResult.productName,
        totalReviews: crawlResult.totalReviews,
        averageRating: crawlResult.averageRating,
        analysis: {
          stats: {
            totalReviews: analysis.stats.totalReviews,
            averageRating: analysis.stats.averageRating.toFixed(1),
            repurchaseRate: analysis.stats.repurchaseRate.toFixed(1),
            photoRate: analysis.stats.photoRate.toFixed(1)
          },
          ratingDistribution: analysis.stats.ratingDistribution,
          sentiment: {
            positive: positiveCount,
            neutral: neutralCount,
            negative: negativeCount
          },
          keywords: {
            positive: analysis.keywords.positive.slice(0, 10).map((kw: any) => ({
              ...kw,
              formatted: formatKeyword(kw.keyword)
            })),
            negative: analysis.keywords.negative.slice(0, 10).map((kw: any) => ({
              ...kw,
              formatted: formatKeyword(kw.keyword)
            }))
          },
          categories,
          skinTypes: analysis.skinTypeDistribution,
          skinConcerns,
          improvements: improvementsList,
          quotes: analysis.highlightQuotes || [],
          lowRatingReviews: analysis.lowRatingReviews || []
        },
        paths: { jsonPath, csvPath, reportPath }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || '알 수 없는 오류' };
  }
});

// IPC 핸들러: 폴더 열기
ipcMain.handle('open-folder', async (_event: any, folderPath: string) => {
  shell.openPath(path.dirname(folderPath));
});

// IPC 핸들러: 파일 열기
ipcMain.handle('open-file', async (_event: any, filePath: string) => {
  shell.openPath(filePath);
});
