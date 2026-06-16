import { test, expect } from '@playwright/test';
import { capturePageDiagnostics, saveDiagnostics } from './helpers';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Infrastructure connectivity', () => {

  test('health endpoint returns ok with db and redis connected', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
    expect(body.scheduler).toBeDefined();
  });

  test('CORS headers allow frontend origin', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/health`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });
    expect(response.status()).toBe(200);
    const corsOrigin = response.headers()['access-control-allow-origin'];
    expect(corsOrigin).toBe('http://localhost:5173');
  });

  test('CORS headers allow production domain', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/health`, {
      headers: {
        Origin: 'https://cup-budd.pages.dev',
      },
    });
    expect(response.status()).toBe(200);
    const corsOrigin = response.headers()['access-control-allow-origin'];
    expect(corsOrigin).toBe('https://cup-budd.pages.dev');
  });

  test('teams endpoint returns data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/teams`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('app loads and calls health endpoint', async ({ page }) => {
    const diag = capturePageDiagnostics(page);

    await page.route(/\/api\/v1\/health/, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.db).toBe('ok');
      expect(body.redis).toBe('ok');
      await route.continue();
    });

    await page.goto('/');
    await expect(page).toHaveURL('/');
    await saveDiagnostics(test.info(), page, diag);
  });

});
