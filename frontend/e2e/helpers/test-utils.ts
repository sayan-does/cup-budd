import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface PageDiagnostics {
  consoleLogs: string[];
  consoleErrors: string[];
  pageErrors: string[];
  networkFailures: { url: string; status: number; body: string }[];
}

export function capturePageDiagnostics(page: Page): PageDiagnostics {
  const diag: PageDiagnostics = {
    consoleLogs: [],
    consoleErrors: [],
    pageErrors: [],
    networkFailures: [],
  };

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
      diag.consoleErrors.push(`[${msg.type()}] ${text}`);
    } else {
      diag.consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    diag.pageErrors.push(err.message);
  });

  page.on('response', (response) => {
    if (!response.ok()) {
      const url = response.url();
      response.text().then((body) => {
        diag.networkFailures.push({ url, status: response.status(), body });
      }).catch(() => {});
    }
  });

  return diag;
}

export function setupPageDiagnostics(page: Page, testInfo: TestInfo): PageDiagnostics {
  const diag = capturePageDiagnostics(page);

  testInfo.attach('console-logs', {
    body: '',
    contentType: 'text/plain',
  });

  return diag;
}

export async function saveDiagnostics(
  testInfo: TestInfo,
  page: Page,
  diag: PageDiagnostics,
  label?: string,
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = label ? `-${label}` : '';
  const dir = path.join('test-results', 'debug', testInfo.title.replace(/[^a-z0-9]/gi, '_'), suffix);

  fs.mkdirSync(dir, { recursive: true });

  const consolePath = path.join(dir, `console-${timestamp}.txt`);
  const lines = [
    '=== CONSOLE LOGS ===',
    ...diag.consoleLogs,
    '',
    '=== CONSOLE ERRORS ===',
    ...diag.consoleErrors,
    '',
    '=== PAGE ERRORS ===',
    ...diag.pageErrors,
    '',
    '=== NETWORK FAILURES ===',
    ...diag.networkFailures.map((nf) => `[${nf.status}] ${nf.url}\n${nf.body}`),
  ];
  fs.writeFileSync(consolePath, lines.join('\n'), 'utf-8');

  const screenshotPath = path.join(dir, `screenshot-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  if (diag.consoleErrors.length > 0 || diag.pageErrors.length > 0 || diag.networkFailures.length > 0) {
    console.log(`[DEBUG] Issues found for "${testInfo.title}":`);
    if (diag.consoleErrors.length > 0) console.log(`  Console errors: ${diag.consoleErrors.length}`);
    if (diag.pageErrors.length > 0) console.log(`  Page errors: ${diag.pageErrors.length}`);
    if (diag.networkFailures.length > 0) console.log(`  Network failures: ${diag.networkFailures.length}`);
    console.log(`  Details saved to: ${dir}`);
  }

  try {
    await testInfo.attach('debug-console', {
      body: lines.join('\n'),
      contentType: 'text/plain',
    });
    await testInfo.attach('debug-screenshot', {
      body: fs.readFileSync(screenshotPath),
      contentType: 'image/png',
    });
  } catch {
    // screenshot best-effort
  }
}

export async function diagnosePage(
  page: Page,
  testInfo: TestInfo,
  label?: string,
): Promise<void> {
  const html = await page.content();
  const url = page.url();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = label ? `-${label}` : '';
  const dir = path.join('test-results', 'debug', testInfo.title.replace(/[^a-z0-9]/gi, '_'), suffix);

  fs.mkdirSync(dir, { recursive: true });

  const htmlPath = path.join(dir, `page-${timestamp}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  const infoPath = path.join(dir, `info-${timestamp}.txt`);
  const info = [
    `URL: ${url}`,
    `Viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
    `Timestamp: ${timestamp}`,
  ];
  fs.writeFileSync(infoPath, info.join('\n'), 'utf-8');

  const screenshotPath = path.join(dir, `screenshot-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`[DIAG] Page state saved to: ${dir}`);
}

export function injectAuthenticatedUser(page: Page, overrides?: Record<string, unknown>): void {
  const base = {
    state: {
      email: 'test@example.com',
      userId: null,
      favoriteTeamId: 1,
      favoriteTeamName: 'Argentina',
      timezone: 'America/New_York',
      onboardingComplete: true,
      preferences: {
        match_reminders: true,
        goal_alerts: true,
        result_summaries: true,
      },
    },
    version: 0,
  };

  if (overrides) {
    Object.assign(base.state, overrides);
  }

  page.addInitScript((data) => {
    localStorage.setItem('cup-budd-user', JSON.stringify(data));
  }, base);
}

export async function setupApiMocks(page: Page, mocks?: { pattern: string; json: unknown }[]): Promise<void> {
  if (mocks) {
    for (const mock of mocks) {
      await page.route(new RegExp(mock.pattern), async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mock.json),
        });
      });
    }
  }
}
