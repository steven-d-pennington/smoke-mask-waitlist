import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: process.env.GALLERY_URL || 'http://127.0.0.1:4178', headless: true },
  webServer: process.env.GALLERY_URL ? undefined : {
    command: 'python3 -m http.server 4178 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4178', reuseExistingServer: !process.env.CI,
  },
});
