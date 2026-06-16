import { test, expect } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  injectAuthenticatedUser,
  MOCK_USER_PROFILE,
  MOCK_TEAMS,
} from './helpers';

test.describe('Profile page', () => {

  test.beforeEach(async ({ page }) => {
    injectAuthenticatedUser(page);

    await page.route(/\/api\/v1\/users\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER_PROFILE),
      });
    });
  });

  test('renders profile with user info and team', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('text=test@example.com')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Argentina')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows push notification status', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('text=Push Status')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Not set up').or(page.locator('text=Enabled'))).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('renders notification preference toggles', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('text=Match reminders')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Goal alerts')).toBeVisible();
    await expect(page.locator('text=Full-time results')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows timezone info', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('text=America/New_York')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Timezone')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('toggles a notification preference', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    let prefsUpdated = false;
    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.route(/\/api\/v1\/users\/me\/preferences/, async (route) => {
      prefsUpdated = true;
      await route.fulfill({ status: 204 });
    });

    await page.goto('/profile');
    await page.waitForTimeout(2000);

    const toggles = page.locator('button[role="switch"]');
    const firstToggle = toggles.first();
    const initialChecked = await firstToggle.getAttribute('aria-checked');

    await firstToggle.click();
    await page.waitForTimeout(500);
    const newChecked = await firstToggle.getAttribute('aria-checked');
    expect(newChecked).not.toBe(initialChecked);

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows loading state when profile is loading', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TEAMS),
      });
    });

    await page.route(/\/api\/v1\/users\/me/, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER_PROFILE),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('text=Loading...')).toBeVisible({ timeout: 3000 });

    await saveDiagnostics(test.info(), page, diag);
  });

});
