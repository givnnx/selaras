import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
chromium.use(stealth())

import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

// Muat file .env secara otomatis dari root project
dotenv.config()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toBeVisible();`
     */
    timeout: 10000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests for stability with extension loading */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Jalankan browser secara visual agar kita bisa melihat prosesnya */
    headless: false,

    /* MODUS SILUMAN: Sembunyikan fakta bahwa ini adalah robot */
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },

    /* Gunakan User-Agent yang terlihat seperti Chrome asli di Windows */
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for Playwright */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
