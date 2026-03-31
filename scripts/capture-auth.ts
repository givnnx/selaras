import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function captureSession() {
  const authFile = path.join(process.cwd(), 'playwright/.auth/user.json')
  const endpoint = 'http://localhost:9222'

  console.log('--- OPERASI PENUMPANG: MENYELINAP KE CHROME ---')
  console.log(`Mencoba menyambung ke: ${endpoint}`)

  try {
    // Hubungkan Playwright ke Chrome yang sedang Anda buka secara manual
    const browser = await chromium.connectOverCDP(endpoint)
    const context = browser.contexts()[0] || (await browser.newContext())
    const pages = context.pages()
    const page = pages.find((p) => p.url().includes('selaras')) || pages[0]

    if (!page) {
      console.error('ERROR: Tidak menemukan tab Selaras di Chrome Anda!')
      console.log('Pastikan tab login Selaras sudah Anda buka di Chrome.')
      process.exit(1)
    }

    console.log(`Terhubung ke Tab: ${page.url()}`)
    console.log('Menunggu Anda login secara manual (jika belum)...')

    // Tunggu sampai user berada di halaman private/dashboard
    await page.waitForURL(/.*private.*/, { timeout: 0 })

    console.log('LOGIN TERDETEKSI! Mengambil kunci sesi...')

    // Pastikan folder .auth ada
    const authDir = path.dirname(authFile)
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true })
    }

    // Simpan sesinya!
    await context.storageState({ path: authFile })

    console.log('--- BERHASIL! ---')
    console.log(`Sesi disimpan di: ${authFile}`)
    console.log(
      'Sekarang Anda bisa menutup jendela Chrome tersebut dan menjalankan: bun run test:e2e',
    )

    await browser.close()
  } catch (err) {
    console.error('--- GAGAL MENYAMBUNG ---')
    console.error(
      'Pastikan Anda sudah menjalankan Chrome dengan flag: --remote-debugging-port=9222',
    )
    console.error(err)
    process.exit(1)
  }
}

captureSession()
