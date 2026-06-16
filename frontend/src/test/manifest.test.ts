import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test, expect } from 'vitest';

test('manifest has required display mode', () => {
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../public/manifest.webmanifest'), 'utf-8'));
  expect(manifest.display).toBe('standalone');
});

test('manifest has required keys', () => {
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../public/manifest.webmanifest'), 'utf-8'));
  expect(manifest).toHaveProperty('name');
  expect(manifest).toHaveProperty('short_name');
  expect(manifest).toHaveProperty('description');
  expect(manifest).toHaveProperty('start_url', '/');
  expect(manifest).toHaveProperty('background_color');
  expect(manifest).toHaveProperty('theme_color');
  expect(manifest).toHaveProperty('orientation', 'portrait-primary');
  expect(manifest).toHaveProperty('icons');
});

test('icons include 512x512 maskable', () => {
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../public/manifest.webmanifest'), 'utf-8'));
  const maskable = manifest.icons.find(
    (i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && i.purpose === 'maskable',
  );
  expect(maskable).toBeDefined();
});
