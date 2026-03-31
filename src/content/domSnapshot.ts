import {
  saveUICacheToStorage,
  getForceOfflineMode,
  type UICache,
} from '../lib/db'

// ==========================================
// Konfigurasi: Domain yang boleh di-cache
// ==========================================
const ALLOWED_HOSTNAMES = ['selaras.tubankab.go.id']

// State tersinkronisasi untuk mengecek mode offline secara realtime saat event klik (agar bisa preventDefault sinkron)
let isForceOfflineSync = false
getForceOfflineMode().then((val) => {
  isForceOfflineSync = val
})
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.force_offline_mode !== undefined) {
    isForceOfflineSync = !!changes.force_offline_mode.newValue
  }
})

function isAllowedHost(): boolean {
  return ALLOWED_HOSTNAMES.includes(window.location.hostname)
}

// ==========================================
// 1. Fungsi Mengambil "Snapshot" Tampilan Web
// ==========================================
export async function cacheCurrentUI(): Promise<void> {
  console.log('[Selaras Debug] Mencoba cache UI...', {
    hostname: window.location.hostname,
    online: navigator.onLine,
    forceOffline: isForceOfflineSync,
    path: window.location.pathname,
  })

  // Jangan cache jika bukan di domain Selaras
  if (!isAllowedHost()) {
    return
  }

  // Jika sedang offline mode, jangan memotret tampilan karena ini bakal me-replace snapshot asli dengan error page offline
  if (!navigator.onLine || isForceOfflineSync) {
    console.log(
      '[Selaras Debug] Sedang offline/mode simulasi, membatalkan cache.',
    )
    return
  }

  const currentPath = window.location.pathname + window.location.search
  const baseUrl = window.location.origin

  // ---- Kumpulkan semua CSS dari halaman ----
  const styleElements = document.querySelectorAll(
    'link[rel="stylesheet"], style',
  )
  const stylePromises = Array.from(styleElements).map(async (el) => {
    if (el.tagName === 'LINK') {
      const link = el as HTMLLinkElement
      try {
        const absoluteHref = new URL(link.href, baseUrl).href

        // Fetch CSS saat online untuk di-injeksi sebagai inline <style>
        try {
          const response = await fetch(absoluteHref)
          if (response.ok) {
            let cssText = await response.text()

            // Fix relative URLs di dalam CSS agar menggunakan absolut URL
            cssText = cssText.replace(
              /url\(['"]?(.*?)['"]?\)/g,
              (match, urlArg) => {
                if (
                  urlArg.startsWith('data:') ||
                  urlArg.startsWith('http://') ||
                  urlArg.startsWith('https://')
                ) {
                  return match
                }
                try {
                  const absoluteAssetUrl = new URL(urlArg, absoluteHref).href
                  return `url("${absoluteAssetUrl}")`
                } catch {
                  return match
                }
              },
            )

            return `<style data-source="${absoluteHref}">\n${cssText}\n</style>`
          }
        } catch (fetchErr) {
          console.warn(
            '[Selaras Debug] Gagal memuat CSS untuk cache:',
            absoluteHref,
            fetchErr,
          )
        }

        // Fallback jika fetch CSS diblokir CORS atau gagal
        return `<link rel="stylesheet" href="${absoluteHref}">`
      } catch {
        return el.outerHTML
      }
    }

    // Untuk <style> inline, proses URL internalnya
    let cssText = el.innerHTML
    cssText = cssText.replace(/url\(['"]?(.*?)['"]?\)/g, (match, urlArg) => {
      if (
        urlArg.startsWith('data:') ||
        urlArg.startsWith('http://') ||
        urlArg.startsWith('https://')
      ) {
        return match
      }
      try {
        const absoluteAssetUrl = new URL(urlArg, baseUrl).href
        return `url("${absoluteAssetUrl}")`
      } catch {
        return match
      }
    })
    return `<style>${cssText}</style>`
  })

  const collectedStylesArray = await Promise.all(stylePromises)
  const collectedStyles = collectedStylesArray.join('\n')

  console.log(
    `[Selaras Debug] CSS ditemukan dan diproses: ${styleElements.length} elemen style`,
  )

  // ---- Kumpulkan elemen konten utama ----
  const mainPanel =
    document.querySelector('.main-panel') ??
    document.querySelector('main') ??
    document.querySelector('#app') ??
    document.querySelector('#content') ??
    document.querySelector('.content-wrapper') ??
    document.body

  const sidebar =
    document.querySelector('.sidebar') ??
    document.querySelector('nav') ??
    document.querySelector('aside')

  console.log('[Selaras Debug] Elemen ditemukan:', {
    mainPanel: !!mainPanel,
    sidebar: !!sidebar,
    stylesCount: styleElements.length,
  })

  // Ambil isi penuh body dan class body agar layout CSS (misal wrapper) utuh
  const htmlBody = document.body.innerHTML
  const bodyClass = document.body.className

  const cacheData: UICache = {
    pagePath: currentPath,
    html_main: mainPanel.innerHTML,
    html_sidebar: sidebar?.innerHTML ?? '',
    html_body: htmlBody,
    body_class: bodyClass,
    html_head: collectedStyles,
    timestamp: Date.now(),
  }

  await saveUICacheToStorage(cacheData)
  console.log(
    `📸 [Selaras Offline] Tampilan halaman ${currentPath} berhasil di-cache (chrome.storage)! ` +
      `(${styleElements.length} CSS, ${Math.round(cacheData.html_main.length / 1024)}KB HTML)`,
  )
}

// ==========================================
// 2. Fungsi Mencegat Klik (Interceptor)
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

  // Dengarkan setiap klik di halaman (Gunakan fase capture agar mencegat klik sebelum React Router / SPA router bereaksi)
  document.addEventListener(
    'click',
    async (e) => {
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
        if (!navigator.onLine || isForceOfflineSync) {
          // JIKA SEDANG OFFLINE ATAU MODE SIMULASI OFFLINE AKTIF: Cegat navigasinya!
          e.preventDefault()
          e.stopPropagation() // Hentikan SPA/React Router client-side dari menangkap event ini

          const fullTargetPath = url.pathname + url.search
          // Redirect penuh ke halaman offline miliki ekstensi (Gunakan replace agar tidak nyangkut di BFCache)
          window.location.replace(
            chrome.runtime.getURL(
              `pages/offline.html?path=${encodeURIComponent(fullTargetPath)}`,
            ),
          )
        } else {
          // JIKA SEDANG ONLINE NORMAL: Cache halaman tujuan sebelum berpindah
          // (cache halaman SAAT INI sudah dilakukan saat load)
          await cacheCurrentUI()
        }
      }
    },
    { capture: true },
  )

  // ==========================================
  // Auto-Update Cache (Setiap 60 Detik)
  // ==========================================
  setInterval(() => {
    if (navigator.onLine && isAllowedHost() && !isForceOfflineSync) {
      cacheCurrentUI()
    }
  }, 60 * 1000)
}
