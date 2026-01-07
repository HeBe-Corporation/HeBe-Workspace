/**
 * Claude Code 세션 히스토리 백업 스크립트
 *
 * 사용법: npx ts-node scripts/backup-sessions.ts
 *
 * 기능:
 * - 모든 세션 파일을 읽어서 백업
 * - 읽기 쉬운 마크다운 형식으로 변환
 * - 날짜별 폴더에 저장
 */

import * as fs from 'fs';
import * as path from 'path';

const CLAUDE_DIR = path.join(process.env.USERPROFILE || '', '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const BACKUP_DIR = path.join(process.cwd(), '90-archive', 'claude-sessions');

interface SessionMessage {
  type: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  };
  timestamp?: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n');
  }
  return '';
}

function parseSessionFile(filePath: string): { messages: Array<{ role: string; content: string; timestamp?: string }>; firstTimestamp?: Date } {
  const messages: Array<{ role: string; content: string; timestamp?: string }> = [];
  let firstTimestamp: Date | undefined;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const data: SessionMessage = JSON.parse(line);

        if (data.type === 'user' || data.type === 'assistant') {
          const msg = data.message;
          if (msg && msg.content) {
            const text = extractContent(msg.content);
            if (text.trim()) {
              messages.push({
                role: data.type,
                content: text,
                timestamp: data.timestamp
              });

              if (!firstTimestamp && data.timestamp) {
                firstTimestamp = new Date(data.timestamp);
              }
            }
          }
        }
      } catch {
        // 파싱 실패한 줄은 스킵
      }
    }
  } catch (err) {
    console.error(`파일 읽기 실패: ${filePath}`, err);
  }

  return { messages, firstTimestamp };
}

function formatAsMarkdown(sessionId: string, messages: Array<{ role: string; content: string }>, timestamp?: Date): string {
  const dateStr = timestamp ? timestamp.toISOString().split('T')[0] : 'unknown-date';
  const timeStr = timestamp ? timestamp.toTimeString().split(' ')[0] : '';

  let md = `# Claude Session: ${sessionId}\n\n`;
  md += `- **Date**: ${dateStr} ${timeStr}\n`;
  md += `- **Messages**: ${messages.length}\n\n`;
  md += `---\n\n`;

  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Claude';
    md += `## ${role}\n\n`;
    md += `${msg.content}\n\n`;
    md += `---\n\n`;
  }

  return md;
}

function backupSessions() {
  console.log('🔍 Claude 세션 백업 시작...\n');

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(`❌ 프로젝트 디렉토리를 찾을 수 없음: ${PROJECTS_DIR}`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const backupPath = path.join(BACKUP_DIR, today);
  ensureDir(backupPath);

  // 원본 JSONL 백업 폴더
  const rawBackupPath = path.join(backupPath, 'raw');
  ensureDir(rawBackupPath);

  const projectDirs = fs.readdirSync(PROJECTS_DIR);
  let totalSessions = 0;
  let totalMessages = 0;

  for (const projectDir of projectDirs) {
    const projectPath = path.join(PROJECTS_DIR, projectDir);

    if (!fs.statSync(projectPath).isDirectory()) continue;

    const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const stats = fs.statSync(filePath);

      // 빈 파일 스킵
      if (stats.size === 0) continue;

      // agent 파일 스킵 (서브에이전트)
      if (file.startsWith('agent-')) continue;

      const sessionId = file.replace('.jsonl', '');
      const { messages, firstTimestamp } = parseSessionFile(filePath);

      if (messages.length === 0) continue;

      // 원본 JSONL 복사
      const rawDest = path.join(rawBackupPath, `${projectDir}_${file}`);
      fs.copyFileSync(filePath, rawDest);

      // 마크다운 변환
      const markdown = formatAsMarkdown(sessionId, messages, firstTimestamp);
      const mdPath = path.join(backupPath, `${sessionId}.md`);
      fs.writeFileSync(mdPath, markdown, 'utf-8');

      totalSessions++;
      totalMessages += messages.length;

      console.log(`✅ ${sessionId}: ${messages.length}개 메시지`);
    }
  }

  // 요약 파일 생성
  const summary = `# Claude Sessions Backup Summary

- **백업 날짜**: ${today}
- **총 세션 수**: ${totalSessions}
- **총 메시지 수**: ${totalMessages}
- **백업 위치**: ${backupPath}

## 파일 목록

${fs.readdirSync(backupPath)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .map(f => `- [${f}](./${f})`)
  .join('\n')}
`;

  fs.writeFileSync(path.join(backupPath, 'README.md'), summary, 'utf-8');

  console.log(`\n✨ 백업 완료!`);
  console.log(`   📁 위치: ${backupPath}`);
  console.log(`   📊 세션: ${totalSessions}개`);
  console.log(`   💬 메시지: ${totalMessages}개`);
}

// 실행
backupSessions();
