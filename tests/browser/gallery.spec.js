import { test, expect } from '@playwright/test';

test('native scroll moves through the artworks and ends at the studio form', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-ready','true');
  const start=await page.locator('#world').getAttribute('data-sc-verify-state');
  await page.mouse.wheel(0,650);
  await expect(page.locator('#world')).not.toHaveAttribute('data-sc-verify-state',start);
  await page.locator('#work-select').selectOption('3');
  await expect(page.locator('#work-title')).toHaveText('Woodland Mushrooms');
  await page.locator('#next').click();
  await expect(page.locator('#studio-list')).toBeVisible();
  await expect(page.locator('#work-select')).toHaveValue('4');
  await expect(page.locator('#next')).toBeDisabled();
  await expect(page.locator('.waitlist')).toBeVisible();
  await page.locator('#first-work').click();
  await expect(page.locator('#work-select')).toHaveValue('0');
  await expect(page.locator('#studio-list')).toBeHidden();
  expect(errors).toEqual([]);
});

test('click artwork, inspect the detail, then inquire without losing a form draft', async ({ page }) => {
  await page.goto('/#studio-list');
  await page.locator('#signup-email').fill('gallery-test@example.com');
  await page.locator('#work-select').selectOption('1');
  await expect(page.locator('#work-title')).toHaveText('Egret');
  await page.locator('#inspect').click();
  await page.locator('#detail-crop').click();
  await expect(page.locator('#detail-photo')).toHaveAttribute('src','art/egret-detail.png');
  await page.locator('#detail-inquire').click();
  await expect(page.locator('#studio-list')).toBeVisible();
  await expect(page.locator('#artwork-interest')).toHaveValue('Egret');
  await expect(page.locator('#signup-email')).toHaveValue('gallery-test@example.com');
  await expect(page.locator('#signup-email')).toBeFocused();
  await page.locator('#collection-mode').click();
  await expect(page.locator('#collection-form #studio-list')).toBeVisible();
  await page.locator('#walk-mode').click();
  await expect(page.locator('#form-mount #studio-list')).toBeVisible();
  await expect(page.locator('#signup-email')).toHaveValue('gallery-test@example.com');
});

test('clicking the rendered work opens the right detail and Escape preserves position', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#world')).toHaveAttribute('data-ready','true');
  const rect=await page.locator('#canvas').boundingBox();
  await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
  await expect(page.locator('#details')).toBeVisible();
  await expect(page.locator('#detail-title')).toHaveText('Lighthouse');
  const y=await page.evaluate(()=>scrollY);
  await page.keyboard.press('Escape');
  await expect(page.locator('#details')).toBeHidden();
  expect(await page.evaluate(()=>scrollY)).toBe(y);
});

test('compact collection and new photographs remain usable', async ({ page }) => {
  await page.setViewportSize({width:360,height:640});
  await page.goto('/#collection');
  await expect(page.locator('#works [data-work]')).toHaveCount(4);
  await page.getByRole('button',{name:'View Floral Study',exact:true}).click();
  await expect(page.locator('#detail-photo')).toHaveAttribute('src','art/floral-study.jpg');
  await expect(page.locator('#detail-note')).toContainText('Descriptive working title');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'View Woodland Mushrooms',exact:true}).click();
  await expect(page.locator('#detail-photo')).toHaveAttribute('src','art/woodland-mushrooms.jpg');
  await page.keyboard.press('Escape');
  await expect(page.locator('#collection-form #studio-list')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('reduced motion and failed WebGL keep the form in the collection', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/');
  await expect(page.locator('#world')).toBeHidden();
  await expect(page.locator('#canvas canvas')).toHaveCount(0);
  await expect(page.locator('#collection-form #studio-list')).toBeVisible();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/vendor/room.js',r=>r.abort()); await page.reload();
  await expect(page.locator('#fallback-note')).toContainText('could not open');
  await expect(page.locator('#world')).toBeHidden();
  await expect(page.locator('#collection-form #studio-list')).toBeVisible();
});

test('no-JavaScript visitors retain all photographs and the POST form', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto(process.env.GALLERY_URL||'http://127.0.0.1:4178');
  await expect(page.locator('#works img')).toHaveCount(4);
  await expect(page.locator('#signup-email')).toBeVisible();
  await expect(page.locator('.waitlist')).toHaveAttribute('method','POST');
  await expect(page.locator('.waitlist')).toHaveAttribute('action','https://formsubmit.co/steve.d.pennington@gmail.com');
  await context.close();
});
