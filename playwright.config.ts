import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Runs the full suite again under a real mobile viewport/touch
    // emulation profile -- added alongside Phase 8b's responsive layout
    // work, since the desktop-only project above wouldn't have caught a
    // layout regression at phone widths.
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
