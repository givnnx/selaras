import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    // Arahkan Playwright untuk me-load folder ekstensi yang sudah di-build Bedframe (contoh: dist/chrome)
    // Pastikan `bun run build` atau `bun run dev` sudah dijalankan sebelumnya.
    // Gunakan path absolut dengan forward slashes (Chrome lebih suka ini di Windows)
    const pathToExtension = path
      .resolve(process.cwd(), 'dist', 'chrome')
      .replace(/\\/g, '/')
    const userDataDir = path.resolve(process.cwd(), '.test_clean_profile')

    console.log(`--- MEMUAT EKSTENSI DARI: ${pathToExtension} ---`)

    const context = await chromium.launchPersistentContext(userDataDir, {
      executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-gpu',
        '--allow-extensions-from-command-line',
      ],
    })

    // Beri waktu lebih lama untuk inisialisasi ekstensi
    await context
      .waitForEvent('serviceworker', { timeout: 20000 })
      .catch(() => null)

    let [background] = context.serviceWorkers()
    if (!background) {
      // Jika SW tidak ada, coba cek background pages (untuk manifest v2 / fallback)
      const backgrounds = context.backgroundPages()
      if (backgrounds.length > 0) background = backgrounds[0] as any
    }

    if (!background) {
      console.error('GAGAL: Ekstensi tidak terdeteksi di browser!')
      console.log('Membuka halaman diagnosa...')
      const diagPage = await context.newPage()
      await diagPage.goto('chrome://extensions')
      await diagPage.screenshot({ path: 'test-results/extension-diag.png' })
      throw new Error(
        'Ekstensi Selaras tidak berhasil dimuat. Cek screenshot: test-results/extension-diag.png',
      )
    }

    const extensionId = background.url().split('/')[2]
    console.log(`Ekstensi Selaras terdeteksi! ID: ${extensionId}`)

    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // Tunggu sampai service worker berjalan untuk merekam ID ekstensinya
    let [background] = context.serviceWorkers()
    if (!background) {
      background = await context.waitForEvent('serviceworker')
    }

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
})

export const expect = test.expect
