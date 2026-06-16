import { test, expect } from '@playwright/test';
import {
  capturePageDiagnostics,
  saveDiagnostics,
  injectAuthenticatedUser,
  MOCK_TEAM_DETAIL,
  MOCK_LIVE_MATCH,
} from './helpers';

test.describe('Home page', () => {

  test.beforeEach(async ({ page }) => {
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
  });

  test('renders home with team data', async ({ page }) => {
    const diag = capturePageDiagnostics(page);
    injectAuthenticatedUser(page);

    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Argentina').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Next Match')).toBeVisible();
    await expect(page.locator('text=Group Standing')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows live banner when team has live fixture', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams\/1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_TEAM_DETAIL,
          live_fixture: MOCK_LIVE_MATCH,
        }),
      });
    });

    injectAuthenticatedUser(page);
    await page.goto('/');
    await expect(page).toHaveURL('/');

    const liveBanner = page.locator('text=LIVE').first();
    await expect(liveBanner).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows pick-a-team empty state when no team selected', async ({ page }) => {
    const diag = capturePageDiagnostics(page);
    injectAuthenticatedUser(page, { favoriteTeamId: null, favoriteTeamName: null });

    await page.goto('/');
    await expect(page.locator('text=Pick a team')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Choose your favorite team to get started')).toBeVisible();

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows error state when team fetch fails', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams\/1/, async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });

    injectAuthenticatedUser(page);
    await page.goto('/');
    await expect(page.locator('text=Failed to load team data')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows no-upcoming-match empty state when no next fixture', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/teams\/1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_TEAM_DETAIL,
          next_fixture: null,
        }),
      });
    });

    injectAuthenticatedUser(page);
    await page.goto('/');
    await expect(page.locator('text=No upcoming match')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

  test('shows recent result section when finished match exists', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/matches/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 99,
            home_team: { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null },
            away_team: { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null },
            home_score: 2,
            away_score: 1,
            status: 'finished',
            stage: 'Group C',
            datetime: new Date(Date.now() - 86400000).toISOString(),
            venue: 'Lusail Stadium',
          },
        ]),
      });
    });

    injectAuthenticatedUser(page);
    await page.goto('/');
    await expect(page.locator('text=Recent Result')).toBeVisible({ timeout: 10000 });

    await saveDiagnostics(test.info(), page, diag);
  });

});
