import { test, expect } from '@playwright/test';
const endpoint = '**/formsubmit.co/ajax/**';

test('interest chips are exclusive, clearable, and submit one value', async ({ page }) => {
  await page.goto('/#studio-list');
  await page.locator('[data-interest=originals]').click();
  await expect(page.locator('#interest-value')).toHaveValue('originals');
  await page.locator('[data-interest=prints]').click();
  await expect(page.locator('[data-interest=originals]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#interest-value')).toHaveValue('prints');
  await page.locator('[data-interest=prints]').click();
  await expect(page.locator('#interest-value')).toHaveValue('');
  await page.locator('[data-interest=both]').click();
  let payload;
  await page.route(endpoint, async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { success: 'true' } });
  });
  await page.locator('#signup-email').fill('gallery-test@example.com');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('#thank-you')).toBeVisible();
  expect(payload.interest).toBe('both');
  expect(payload.email).toBe('gallery-test@example.com');
  await expect(page.locator('.waitlist')).toBeHidden();
});

test('failed request preserves values, retries, and prevents duplicate pending sends', async ({ page }) => {
  await page.goto('/#studio-list');
  let requests = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(endpoint, async route => {
    requests += 1;
    if (requests === 1) { await gate; await route.fulfill({ status: 503, json: { success: false } }); }
    else await route.fulfill({ json: { success: true } });
  });
  await page.locator('#signup-email').fill('gallery-test@example.com');
  await page.locator('[data-interest=originals]').click();
  await page.locator('summary').click();
  await page.locator('textarea').fill('Please tell me about the lighthouse.');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('.waitlist')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#signup-email')).toBeDisabled();
  await expect(page.locator('[data-interest=prints]')).toBeDisabled();
  await page.locator('.waitlist').evaluate(form => form.dispatchEvent(new Event('submit', { cancelable: true })));
  release();
  await expect(page.locator('#form-error')).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.locator('#signup-email')).toHaveValue('gallery-test@example.com');
  await expect(page.locator('textarea')).toHaveValue('Please tell me about the lighthouse.');
  await expect(page.locator('#interest-value')).toHaveValue('originals');
  await expect(page.locator('#thank-you')).toBeHidden();
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('#thank-you')).toBeVisible();
  expect(requests).toBe(2);
});

test('activation or unsuccessful service responses do not become thank-you states', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ json: { success: false, message: 'Activate your form' } }));
  await page.goto('/#studio-list');
  await page.locator('#signup-email').fill('gallery-test@example.com');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.locator('#form-error')).toBeVisible();
  await expect(page.locator('#thank-you')).toBeHidden();
});
