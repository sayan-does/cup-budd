import { test, expect } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  injectAuthenticatedUser,
  MOCK_USER_STATE_ONBOARDING_INCOMPLETE,
} from './helpers';

const TEST_EMAIL = `e2e-${Date.now()}@test.com`;

test.describe('Onboarding flow', () => {

  test('redirects unauthenticated users from / to /onboarding', async ({ page }) => {
    const diag = capturePageDiagnostics(page);
    await page.addInitScript(() => localStorage.clear());

    await page.goto('/');
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('renders email step with validation', async ({ page }) => {
    const diag = capturePageDiagnostics(page);
    await page.addInitScript(() => localStorage.clear());

    await page.goto('/onboarding');
    await expect(page.locator('h1')).toHaveText('Stay in the loop', { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.fill('input[type="email"]', 'bad');
    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('completes full onboarding flow end-to-end', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null, emoji: '\u{1F1E6}\u{1F1F7}' },
          { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null, emoji: '\u{1F1EA}\u{1F1F8}' },
          { id: 3, name: 'Mexico', code: 'MEX', group: 'C', logo_url: null, emoji: '\u{1F1F2}\u{1F1FD}' },
          { id: 4, name: 'Saudi Arabia', code: 'KSA', group: 'C', logo_url: null, emoji: '\u{1F1F8}\u{1F1E6}' },
        ]),
      });
    });

    await page.route(/\/api\/v1\/users/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', email: TEST_EMAIL, favorite_team_id: 1 }),
      });
    });

    await page.route(/\/api\/v1\/users\/me\/team/, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await page.route(/\/api\/v1\/users\/me\/preferences/, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await page.addInitScript(() => localStorage.clear());

    await page.goto('/');
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('h1')).toHaveText('Stay in the loop', { timeout: 10000 });

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('h1')).toHaveText('Pick your team', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Search teams..."]', { timeout: 15000 });
    await page.fill('input[placeholder="Search teams..."]', 'Argentina');
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Argentina")').first().click();
    await page.locator('button:has-text("Continue with Argentina")').click();

    await page.locator('text=Skip for now').click();
    await page.locator('text=Skip for now').click();

    await expect(page.locator('h1')).toHaveText('What do you want to hear?', { timeout: 10000 });

    const toggles = page.locator('button[role="switch"]');
    const goalToggle = toggles.nth(1);
    await goalToggle.click();
    await expect(goalToggle).toHaveAttribute('aria-checked', 'false');

    await page.locator('button:has-text("Get started")').click();
    await page.waitForURL('/', { timeout: 15000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('handles API failure during user creation', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null },
        ]),
      });
    });

    await page.route(/\/api\/v1\/users/, async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.addInitScript(() => localStorage.clear());

    await page.goto('/onboarding');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('h1')).toHaveText('Pick your team', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Search teams..."]', { timeout: 15000 });
    await page.locator('button:has-text("Argentina")').first().click();
    await page.locator('button:has-text("Continue with Argentina")').click();
    await page.locator('text=Skip for now').click();
    await page.locator('text=Skip for now').click();

    await expect(page.locator('h1')).toHaveText('What do you want to hear?', { timeout: 10000 });
    await page.locator('button:has-text("Get started")').click();

    await expect(page.locator('text=Failed to create account')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

});
