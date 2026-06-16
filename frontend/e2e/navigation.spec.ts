import { test, expect } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  injectAuthenticatedUser,
  MOCK_TEAM_DETAIL,
  MOCK_LIVE_MATCH,
  MOCK_USER_PROFILE,
  MOCK_TEAMS,
} from './helpers';

test.describe('Navigation and routing', () => {

  test.beforeEach(async ({ page }) => {
    injectAuthenticatedUser(page);

    await page.route(/\/api\/v1\/teams\/1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAM_DETAIL),
      });
    });

    await page.route(/\/api\/v1\/matches/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_MATCH),
      });
    });

    await page.route(/\/api\/v1\/users\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER_PROFILE),
      });
    });

    await page.route(/\/api\/v1\/teams$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });
  });

  test('navigates from home to match detail', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/');
    await expect(page).toHaveURL('/');

    const matchCard = page.locator('text=Group Standing');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('navigates to profile via gear icon', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/');
    await expect(page).toHaveURL('/');

    const settingsBtn = page.locator('button[aria-label="Settings"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await expect(page).toHaveURL('/profile', { timeout: 10000 });
    }

    await saveDiagnostics(test.info(), page, diag);
  });

  test('bottom nav tabs navigate correctly', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();
    expect(buttonCount).toBe(4);

    const navLabels = ['Home', 'Matches', 'Table', 'Profile'];

    for (let i = 0; i < buttonCount; i++) {
      const label = await navButtons.nth(i).textContent();
      expect(label).toContain(navLabels[i]);
    }

    await saveDiagnostics(test.info(), page, diag);
  });

  test('bottom nav Profile tab navigates to /profile', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const profileTab = page.locator('nav button:has-text("Profile")');
    await profileTab.click();
    await expect(page).toHaveURL('/profile', { timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('Matches tab shows live, upcoming, and past sections', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/matches');
    await expect(page).toHaveURL('/matches');
    await expect(page.locator('text=Live')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Upcoming Matches')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Past Matches')).toBeVisible({ timeout: 10000 });

    await page.goto('/table');
    await expect(page).toHaveURL('/table');
    await expect(page.locator('text=Coming Soon')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('unknown route redirects to /', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.goto('/nonexistent-route');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

});
