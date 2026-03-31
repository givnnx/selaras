import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(process.cwd(), 'playwright/.auth/user.json')

setup('Log in to Selaras', async ({ page }) => {
  const loginUrl =
    process.env.SELARAS_LOGIN_URL || 'https://selaras.tubankab.go.id/auth/login'
  const email = process.env.SELARAS_EMAIL
  const password = process.env.SELARAS_PASSWORD

  console.log(`--- SISTEM LOGIN HYBRID AKTIF ---`)
  console.log(`Mengakses halaman login: ${loginUrl}`)
  await page.goto(loginUrl)

  console.log(
    'Sila lakukan login secara MANUAL pada jendela browser yang terbuka.',
  )
  console.log('Robot akan menunggu hingga Anda berhasil masuk ke Dashboard...')

  try {
    // Beri waktu 5 menit untuk login manual
    await page.waitForURL(/.*private.*/, { timeout: 300000, waitUntil: 'load' })

    console.log(
      'LOGIN MANUAL TERDETEKSI! Menyimpan sesi untuk otomasi berikutnya...',
    )
    // Kasih jeda sebentar agar cookie benar-benar tersimpan di browser
    await page.waitForTimeout(2000)
    await page.context().storageState({ path: authFile })
    console.log('Sesi berhasil disimpan di: playwright/.auth/user.json')
  } catch (error) {
    console.error('Waktu tunggu login manual habis (5 menit).')
    throw error
  }
})
