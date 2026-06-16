import { test, expect } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  injectAuthenticatedUser,
  MOCK_LIVE_MATCH,
  MOCK_FINISHED_MATCH,
} from './helpers';

test.describe('Match detail page', () => {

  test.beforeEach(async ({ page }) => {
    injectAuthenticatedUser(page);
  });

  test('renders live match with score and events', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_MATCH),
      });
    });

    await page.goto('/match/101');
    await expect(page).toHaveURL('/match/101');
    await expect(page.locator('text=LIVE')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Messi')).toBeVisible();
    await expect(page.locator('text=Match Statistics')).toBeVisible();
    await expect(page.locator('text=Match Timeline')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('renders finished match with full-time status and event timeline', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/102/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FINISHED_MATCH),
      });
    });

    await page.goto('/match/102');
    await expect(page.locator('text=Full Time')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Match Timeline')).toBeVisible();
    await expect(page.locator('text=Messi')).toBeVisible();
    await expect(page.locator('text=Di Maria')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows loading skeleton while fetching', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_MATCH),
      });
    });

    await page.goto('/match/101');
    const skeleton = page.locator('.space-y-4').first();
    await expect(skeleton).toBeVisible({ timeout: 3000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows error state when match fetch fails', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/999/, async (route) => {
      await route.fulfill({ status: 404, body: 'Not Found' });
    });

    await page.goto('/match/999');
    await expect(page.locator('text=Match not found').or(page.locator('text=Failed to load match'))).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows error state on network failure', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await route.abort();
    });

    await page.goto('/match/101');
    await expect(page.locator('text=Failed to load match')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('displays score correctly for live match', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_MATCH),
      });
    });

    await page.goto('/match/101');
    await expect(page.locator('text=1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=0')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows statistics bar when statistics data present', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches\/101/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIVE_MATCH),
      });
    });

    await page.goto('/match/101');
    await expect(page.locator('text=Possession')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Shots')).toBeVisible();
    await expect(page.locator('text=Yellow cards')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

});
