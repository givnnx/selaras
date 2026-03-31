import { test, expect } from './fixtures'

test.describe('Selaras Offline Extension E2E', () => {
  test('Ekstensi berhasil di-load dan mendapat ID', async ({
    page,
    extensionId,
  }) => {
    // Mengecek apakah extension id valid
    expect(extensionId).toBeDefined()
    expect(extensionId).toHaveLength(32)

    // Pergi ke halaman dashboard opsi bawaan chrome untuk membuktikan service worker ekstensi merespon
    await page.goto(`chrome-extension://${extensionId}/pages/options.html`)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('Switch Toggle berhasil disuntikkan di web Selaras', async ({
    page,
  }) => {
    // Buka target web asli (Asumsi user sudah bisa akses meskipun tidak login, minimal DOM body terbentuk)
    await page.goto('https://selaras.tubankab.go.id/private')

    // Tunggu komponen ekstensi (NavbarToggle) agar selesai dirender oleh React (ID ini datang dari script ekstensi)
    // Walaupun web asli mem-blok redirect di halaman auth, toggle harus tetap ada di Navbar jika ada Navbar
    // Atau jika web me-redirect ke login, DOM yang disuntikkan content script ada jika ada div.navbar

    // Test mengecek status navbar selaras
    const toggleRoot = page.locator('#selaras-navbar-toggle-root')

    // Tunggu sampai toggle muncul (karena kita sudah login via auth.setup)
    await toggleRoot.waitFor({ state: 'attached', timeout: 10000 })

    // Switch harus mati defaultnya
    const toggleButton = toggleRoot.locator('button[role="switch"]')
    await expect(toggleButton).toHaveAttribute('aria-checked', 'false')

    // Coba klik tombol untuk menyalakan mode offline
    await toggleButton.click()

    // Ekspektasi: Halaman berpindah (Redirect) dari https:// ke chrome-extension://
    await page.waitForURL(/^chrome-extension:\/\//)
    const newUrl = page.url()
    expect(newUrl).toContain('pages/offline.html')
  })
})
