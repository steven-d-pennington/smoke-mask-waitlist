import { test, expect } from '@playwright/test';

test('walkthrough navigation, detail focus and selected-artwork inquiry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#gallery-stage')).toHaveAttribute('data-state', 'ready');
  await expect(page.getByRole('button', { name: 'Previous artwork', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next artwork', exact: true }).click();
  await expect(page.locator('#stop-title')).toHaveText('Egret');
  await page.locator('#gallery-stage').focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: 'Next artwork', exact: true })).toBeDisabled();
  await expect(page.locator('#stop-type')).toContainText('Not an artwork');
  await page.locator('#view-work').click();
  await expect(page.locator('#art-dialog')).toBeVisible();
  await expect(page.locator('#detail-inquire')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#view-work')).toBeFocused();
  await page.locator('#stop-select').selectOption('1');
  await page.locator('#view-work').click();
  await page.locator('#detail-crop-toggle').click();
  await expect(page.locator('#detail-art img')).toHaveAttribute('src', 'art/egret-detail.png');
  await page.locator('#detail-crop-toggle').click();
  await expect(page.locator('#detail-art img')).toHaveAttribute('src', 'art/egret.png');
  await page.locator('#detail-inquire').click();
  await expect(page.locator('#art-dialog')).not.toBeVisible();
  await expect(page.locator('#artwork-interest')).toHaveValue('Egret');
  await expect(page.locator('#signup-email')).toBeFocused();
  await page.locator('#clear-interest').click();
  await expect(page.locator('#artwork-interest')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('phone collection stays within viewport and distinguishes mockups', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-mode=collection]').click();
  await expect(page.locator('#gallery-stage')).toBeHidden();
  await page.locator('[data-filter=original]').click();
  await expect(page.locator('.collection-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'View Lighthouse', exact: true }).click();
  await expect(page.locator('#detail-title')).toHaveText('Lighthouse');
  expect(await page.locator('#detail-art img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.keyboard.press('Escape');
  await page.locator('[data-filter=placeholder]').click();
  await expect(page.locator('.collection-card')).toHaveCount(4);
  await expect(page.locator('.collection-card img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-filter=all]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion starts in a usable collection without loading WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-mode=collection]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gallery-stage')).toBeHidden();
  await expect(page.locator('#room-canvas canvas')).toHaveCount(0);
  await expect(page.locator('.collection-card')).toHaveCount(6);
});

test('3D load failure falls back without hiding the real works', async ({ page }) => {
  await page.route('**/vendor/room.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#gallery-notice')).toBeVisible();
  await expect(page.locator('#gallery-stage')).toBeHidden();
  await expect(page.getByRole('button', { name: 'View Egret', exact: true })).toBeVisible();
});

test('switching away while the room loads preserves the chosen mode', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/vendor/room.js', async route => { await gate; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-mode=collection]').click();
  release();
  await expect(page.locator('#gallery-stage')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#gallery-stage')).toBeHidden();
  await expect(page.locator('[data-mode=collection]')).toHaveAttribute('aria-pressed', 'true');
});

test('no-JavaScript visitors can still view both originals and use signup', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.GALLERY_URL || 'http://127.0.0.1:4178');
  await expect(page.locator('#collection-grid img')).toHaveCount(2);
  await expect(page.locator('input[type=email]')).toBeVisible();
  await expect(page.locator('form')).toHaveAttribute('action', 'https://formsubmit.co/steve.d.pennington@gmail.com');
  await context.close();
});
