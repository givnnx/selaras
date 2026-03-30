import { getUICache, saveUICache, type UICache } from '../lib/db'

// ==========================================
// Konfigurasi: Domain yang boleh di-cache
// ==========================================
const ALLOWED_HOSTNAMES = ['selaras.tubankab.go.id']

function isAllowedHost(): boolean {
  return ALLOWED_HOSTNAMES.includes(window.location.hostname)
}

// ==========================================
// 1. Fungsi Mengambil "Snapshot" Tampilan Web
// ==========================================
export async function cacheCurrentUI(): Promise<void> {
  // Jangan cache jika bukan di domain Selaras
  if (!isAllowedHost()) return

  // Pastikan kita sedang online sebelum memotret UI
  if (!navigator.onLine) return

  const currentPath = window.location.pathname

  // Targetkan elemen utama web Selaras Tuban
  // Coba selector spesifik dulu, fallback ke body jika tidak ada
  const mainPanel =
    document.querySelector('.main-panel') ??
    document.querySelector('main') ??
    document.querySelector('#app') ??
    document.querySelector('#content')

  const sidebar =
    document.querySelector('.sidebar') ??
    document.querySelector('nav') ??
    document.querySelector('aside')

  if (!mainPanel) {
    console.warn(
      '⚠️ [Selaras Offline] Selector .main-panel / main / #app / #content tidak ditemukan. ' +
        'Cache dibatalkan. Periksa selector di domSnapshot.ts.',
    )
    return
  }

  const cacheData: UICache = {
    pagePath: currentPath,
    html_main: mainPanel.innerHTML,
    html_sidebar: sidebar?.innerHTML ?? '',
    timestamp: Date.now(),
  }

  await saveUICache(cacheData)
  console.log(
    `📸 [Selaras Offline] Tampilan halaman ${currentPath} berhasil di-cache!`,
  )
}

// ==========================================
// 2. Fungsi Memulihkan Tampilan dari Cache
// ==========================================
async function injectOfflineUI(targetPath: string): Promise<void> {
  const cache = await getUICache(targetPath)

  if (cache) {
    const mainPanel =
      document.querySelector('.main-panel') ??
      document.querySelector('main') ??
      document.querySelector('#app') ??
      document.querySelector('#content')

    if (mainPanel) {
      mainPanel.innerHTML = cache.html_main

      // Pulihkan sidebar jika ada dan cache-nya tersimpan
      if (cache.html_sidebar) {
        const sidebar =
          document.querySelector('.sidebar') ??
          document.querySelector('nav') ??
          document.querySelector('aside')
        if (sidebar) sidebar.innerHTML = cache.html_sidebar
      }

      // Update URL di address bar tanpa melakukan reload
      window.history.pushState({}, '', targetPath)

      console.log(
        `🔀 [Selaras Offline] Navigasi offline ke ${targetPath} berhasil.`,
      )

      // Picu ulang event agar plugin seperti Select2 atau script form bisa jalan lagi
      document.dispatchEvent(new CustomEvent('offline-ui-loaded'))
    }
  } else {
    console.warn(
      `⚠️ [Selaras Offline] Tidak ada cache untuk ${targetPath}. ` +
        'Halaman ini belum pernah dibuka saat online.',
    )
    // Tampilkan pesan di halaman, bukan alert() yang mengganggu
    window.dispatchEvent(
      new CustomEvent('selaras-cache-miss', { detail: { path: targetPath } }),
    )
  }
}

// ==========================================
// 3. Fungsi Mencegat Klik (Interceptor)
// ==========================================
export function initOfflineNavigation(): void {
  // Jangan aktifkan di luar domain Selaras
  if (!isAllowedHost()) return

  // Content script diinjeksi di document_idle (setelah load selesai).
  // Gunakan readyState check agar cacheCurrentUI tetap terpanggil
  // baik saat halaman sudah selesai maupun masih loading.
  if (document.readyState === 'complete') {
    // Halaman sudah selesai load saat content script diinjeksi
    cacheCurrentUI()
  } else {
    // Masih loading (injection awal atau reload cepat)
    window.addEventListener('load', () => cacheCurrentUI(), { once: true })
  }

  // Dengarkan setiap klik di halaman
  document.addEventListener('click', async (e) => {
    // Cari apakah yang diklik adalah link (tag <a>)
    const target = e.target as HTMLElement
    const link = target.closest('a')

    // Abaikan jika bukan link, atau link menuju domain lain, atau link dengan target "_blank"
    if (!link || !link.href || link.target === '_blank') return

    const url = new URL(link.href)

    // Pastikan link tersebut menuju domain yang sama
    if (
      ALLOWED_HOSTNAMES.includes(url.hostname) &&
      url.hostname === window.location.hostname
    ) {
      // JIKA SEDANG ONLINE: Cache halaman tujuan sebelum berpindah
      // (cache halaman SAAT INI sudah dilakukan saat load)
      if (navigator.onLine) {
        // Cache halaman saat ini ulang sebelum pindah (data terbaru)
        await cacheCurrentUI()
      } else {
        // JIKA SEDANG OFFLINE: Cegat navigasinya!
        e.preventDefault()
        await injectOfflineUI(url.pathname)
      }
    }
  })
}
