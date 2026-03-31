// ==========================================
// Konfigurasi
// ==========================================
const ALLOWED_HOSTNAMES = ['selaras.tubankab.go.id']
const UI_CACHE_PREFIX = 'ui_cache:'

// ==========================================
// Event: Extension Installed
// ==========================================
chrome.runtime.onInstalled.addListener((details): void => {
  console.log('[service-worker.ts] > onInstalled', details)
})

// ==========================================
// Event: Browser Action Clicked (Toggle Overlay)
// ==========================================
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab): void => {
  chrome.tabs.sendMessage(
    tab.id ?? 0,
    {
      type: 'browser-action',
      action: 'open-or-close-extension',
    },
    (response) => {
      console.log('chrome.action.onClicked.addListener > response:', response)
    },
  )
})

// ==========================================
// Event: Navigasi Gagal → Redirect ke Halaman Offline
// ==========================================
chrome.webNavigation.onErrorOccurred.addListener(async (details) => {
  // Hanya intercept main frame (bukan iframe atau sub-resource)
  if (details.frameId !== 0) return

  let url: URL
  try {
    url = new URL(details.url)
  } catch {
    return
  }

  // Hanya untuk domain Selaras
  if (!ALLOWED_HOSTNAMES.includes(url.hostname)) return

  console.log(
    `[service-worker] Navigasi gagal ke ${url.pathname}${url.search}, mencari cache...`,
  )

  const fullPath = url.pathname + url.search

  // Cek apakah ada cache UI dasar untuk rute ini (dengan parameter query lengkap)
  const cacheKey = `${UI_CACHE_PREFIX}${fullPath}`
  const result = await chrome.storage.local.get(cacheKey)

  if (result[cacheKey]) {
    // Redirect ke halaman offline extension
    const offlinePage = chrome.runtime.getURL(
      `pages/offline.html?path=${encodeURIComponent(fullPath)}`,
    )

    console.log(`[service-worker] Cache ditemukan! Redirect ke ${offlinePage}`)
    chrome.tabs.update(details.tabId, { url: offlinePage })
  } else {
    console.log(
      `[service-worker] Tidak ada cache untuk ${url.pathname}. Biarkan error page.`,
    )
  }
})
