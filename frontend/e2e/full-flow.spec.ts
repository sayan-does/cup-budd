import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@test.com`;

const TEAMS_MOCK = [
  { id: 1, name: 'Argentina', flag: '🇦🇷', group_name: 'Group A', standing: null },
  { id: 2, name: 'Brazil', flag: '🇧🇷', group_name: 'Group A', standing: null },
  { id: 3, name: 'Spain', flag: '🇪🇸', group_name: 'Group B', standing: null },
  { id: 4, name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group_name: 'Group B', standing: null },
];

test.describe('Full onboarding flow', () => {
  test('completes full onboarding and lands on home', async ({ page }) => {
    // Mock API
    await page.route(/\/api\/v1\/teams/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEAMS_MOCK) });
    });
    await page.route(/\/api\/v1\/users/, async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: TEST_EMAIL }) });
    });
    await page.route(/\/api\/v1\/users\/me\/team/, async (route) => {
      await route.fulfill({ status: 204 });
    });
    await page.route(/\/api\/v1\/users\/me\/preferences/, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await page.addInitScript(() => localStorage.clear());

    // Step 0 — unauthenticated redirect to /onboarding
    await page.goto('/');
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('h1')).toHaveText('Stay in the loop', { timeout: 10000 });

    // Fill email
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button:has-text("Continue")');

    // Step 1 — Pick team
    await expect(page.locator('h1')).toHaveText('Pick your team', { timeout: 10000 });
    // Wait for team list to render (search input appears after teams load)
    await page.waitForSelector('input[placeholder="Search teams..."]', { timeout: 15000 });

    // Search for Argentina to find it fast
    await page.fill('input[placeholder="Search teams..."]', 'Argentina');
    await page.waitForTimeout(500);
    // Click the team button that contains the name
    await page.locator('button:has-text("Argentina")').first().click();
    await page.locator('button:has-text("Continue with Argentina")').click();

    // Step 2 — Install (skip)
    await page.locator('text=Skip for now').click();

    // Step 3 — Push notifications (skip)
    await page.locator('text=Skip for now').click();

    // Step 4 — Preferences
    await expect(page.locator('h1')).toHaveText('What do you want to hear?', { timeout: 10000 });

    // Toggle off "Goal alerts"
    const toggles = page.locator('button[role="switch"]');
    const goalToggle = toggles.nth(1);
    await goalToggle.click();
    await expect(goalToggle).toHaveAttribute('aria-checked', 'false');

    // Submit
    await page.locator('button:has-text("Get started")').click();

    // Wait for redirect to home and verify team name in header
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('text=Argentina').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows validation errors during onboarding', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/onboarding');
    await expect(page.locator('h1')).toHaveText('Stay in the loop', { timeout: 10000 });

    // Type an invalid email, then click Continue
    await page.fill('input[type="email"]', 'bad');
    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('shows home for returning authenticated user', async ({ page }) => {
    // Set up localStorage as if user completed onboarding
    // Must use addInitScript so data exists before React hydrates
    await page.addInitScript(() => {
      const data = {
        state: {
          email: 'returning@test.com',
          userId: null,
          favoriteTeamId: 1,
          favoriteTeamName: 'Argentina',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          onboardingComplete: true,
          preferences: {
            match_reminders: true,
            goal_alerts: true,
            result_summaries: true,
          },
        },
        version: 0,
      };
      localStorage.setItem('cup-budd-user', JSON.stringify(data));
    });

    await page.goto('/');
    // GuardedRoute should see the hydrated email and not redirect
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('text=Argentina').first()).toBeVisible({ timeout: 10000 });
  });
});
