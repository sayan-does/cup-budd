import { test } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  diagnosePage,
  MOCK_TEAMS,
} from './helpers';

test.describe('Page diagnostics', () => {

  test('diagnose onboarding team step rendering', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/onboarding');
    await page.waitForSelector('h1:has-text("Stay in the loop")', { timeout: 10000 });
    await page.fill('input[type="email"]', 'debug@test.com');
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('h1:has-text("Pick your team")', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Search teams..."]', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await saveDiagnostics(test.info(), page, diag, 'team-step');

    const teamCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return { total: buttons.length, texts: Array.from(buttons).map((b) => b.textContent) };
    });
    console.log('BUTTONS:', JSON.stringify(teamCount));
  });

  test('diagnose all routes', async ({ page }) => {
    const routes = ['/', '/onboarding', '/match/101', '/profile', '/matches', '/table'];
    const diag = capturePageDiagnostics(page);

    await page.addInitScript(() => {
      localStorage.setItem('cup-budd-user', JSON.stringify({
        state: {
          email: 'debug@test.com',
          favoriteTeamId: 1,
          favoriteTeamName: 'Argentina',
          onboardingComplete: true,
          preferences: { match_reminders: true, goal_alerts: true, result_summaries: true },
        },
        version: 0,
      }));
    });

    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(3000);
      await diagnosePage(page, test.info(), route.replace(/[/:]/g, '_'));
    }

    await saveDiagnostics(test.info(), page, diag, 'all-routes');
  });

});
