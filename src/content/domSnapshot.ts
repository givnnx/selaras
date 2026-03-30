import { getUICache, saveUICache, type UICache } from '../lib/db'

// ==========================================
// 1. Fungsi Mengambil "Snapshot" Tampilan Web
// ==========================================
export async function cacheCurrentUI(): Promise<void> {
  // Pastikan kita sedang online sebelum memotret UI
  if (!navigator.onLine) return

  const currentPath = window.location.pathname

  // Targetkan elemen utama web Selaras Tuban
  const mainPanel = document.querySelector('.main-panel')
  const sidebar = document.querySelector('.sidebar')

  if (mainPanel && sidebar) {
    const cacheData: UICache = {
      pagePath: currentPath,
      html_main: mainPanel.innerHTML,
      html_sidebar: sidebar.innerHTML,
      timestamp: Date.now(),
    }

    await saveUICache(cacheData)
    console.log(
      `📸 [Selaras Offline] Tampilan halaman ${currentPath} berhasil di-cache!`,
    )
  }
}

// ==========================================
// 2. Fungsi Memulihkan Tampilan dari Cache
// ==========================================
async function injectOfflineUI(targetPath: string): Promise<void> {
  const cache = await getUICache(targetPath)

  if (cache) {
    const mainPanel = document.querySelector('.main-panel')
    const sidebar = document.querySelector('.sidebar')

    if (mainPanel && sidebar) {
      // Ganti konten HTML saat ini dengan yang ada di cache
      mainPanel.innerHTML = cache.html_main
      sidebar.innerHTML = cache.html_sidebar

      // Update URL di address bar tanpa melakukan reload
      window.history.pushState({}, '', targetPath)

      console.log(
        `🔀 [Selaras Offline] Navigasi offline ke ${targetPath} berhasil.`,
      )

      // Catatan: Karena DOM baru saja diganti secara paksa,
      // kita harus memicu ulang event agar plugin seperti Select2 atau script form bisa jalan lagi.
      document.dispatchEvent(new CustomEvent('offline-ui-loaded'))
    }
  } else {
    alert(
      'Halaman ini belum pernah dibuka sebelumnya saat online. Tidak ada cache yang tersedia.',
    )
  }
}

// ==========================================
// 3. Fungsi Mencegat Klik (Interceptor)
// ==========================================
export function initOfflineNavigation(): void {
  // Simpan tampilan saat halaman pertama kali dimuat
  window.addEventListener('load', () => {
    cacheCurrentUI()
  })

  // Dengarkan setiap klik di halaman
  document.addEventListener('click', async (e) => {
    // Cari apakah yang diklik adalah link (tag <a>)
    const target = e.target as HTMLElement
    const link = target.closest('a')

    // Abaikan jika bukan link, atau link menuju domain lain, atau link dengan target "_blank"
    if (!link || !link.href || link.target === '_blank') return

    const url = new URL(link.href)

    // Pastikan link tersebut menuju domain yang sama (selaras.tubankab.go.id)
    if (url.hostname === window.location.hostname) {
      // JIKA SEDANG OFFLINE: Cegat navigasinya!
      if (!navigator.onLine) {
        e.preventDefault() // Batalkan request ke server Laravel
        await injectOfflineUI(url.pathname)
      }
      // Jika online, biarkan browser bekerja seperti biasa
    }
  })
}
