import React, { useEffect, useState } from 'react'

// PENTING: Patch untuk Mencegah CPU SPIKE saat Development (Vite HMR Bug)
// CRXJS Vite Plugin memiliki bug di mana ia terjebak dalam loop tak terbatas
// jika koneksi websocket gagal di halaman chrome-extension:// yang memiliki query string (?path=...)
if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args: any[]) => {
    const msg = args[0] ? String(args[0]) : ''
    // Jika Vite gagal connect websocket, cegah ia mengeluh terus-menerus
    if (
      msg.includes('WebSocket') ||
      msg.includes("reading 'send'") ||
      msg.includes('failed to connect to websocket')
    ) {
      return
    }
    if (
      args[0] instanceof Error &&
      args[0].message.includes("reading 'send'")
    ) {
      return
    }
    originalError.apply(console, args)
  }

  window.addEventListener('unhandledrejection', (e) => {
    if (
      e.reason &&
      e.reason.message &&
      e.reason.message.includes("reading 'send'")
    ) {
      e.preventDefault() // Hentikan pelemparan error ke console.error yang memicu loop
    }
  })
}

import { createRoot } from 'react-dom/client'
import {
  getUICacheFromStorage,
  getAllCachedPaths,
  type UICache,
} from '@/lib/db'
import { restoreFormFromDraft, initFormTracker } from '@/content/formTracker'
import { NavbarToggle } from './NavbarToggle'
import { SyncOverlay } from './SyncOverlay'

function OfflinePage() {
  const [cache, setCache] = useState<UICache | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedPaths, setCachedPaths] = useState<string[]>([])

  useEffect(() => {
    // Gunakan cara loss-less untuk mengekstrak path dari URL query,
    // karena URLSearchParams bisa merusak tanda '+' (menjadi spasi) dan memotong string jika ada karakter ambigu
    let rawSearch = window.location.search
    if (rawSearch.startsWith('?path=')) {
      rawSearch = rawSearch.substring(6) // potong '?path='
    }
    const rawPath = rawSearch ? decodeURIComponent(rawSearch) : '/'

    async function loadCache() {
      try {
        let data = await getUICacheFromStorage(rawPath)

        // --- FALLBACK PENCARIAN CACHE ---
        if (!data) {
          const paths = await getAllCachedPaths()
          const matchedPath = paths.find((p) => {
            try {
              return (
                p === rawPath ||
                decodeURIComponent(p) === rawPath ||
                p === encodeURIComponent(rawPath)
              )
            } catch {
              return false
            }
          })
          if (matchedPath) {
            data = await getUICacheFromStorage(matchedPath)
          } else {
            // Fallback Ekstrem: Jika ini URL form yang panjang dan kacau tokennya,
            // ambil struktur HTML dari sembarang "keluarga/form" yang ada agar halamannya tetap tampil!
            const basePath = rawPath.split('?')[0]
            if (basePath.includes('/survei-keluarga/form')) {
              const fallbackPath = paths.find((p) => p.startsWith(basePath))
              if (fallbackPath) data = await getUICacheFromStorage(fallbackPath)
            }
          }
        }

        if (data) {
          setCache(data)

          // Injeksi CSS dari halaman asli ke <head> agar styling tidak hancur
          if (data.html_head) {
            const styleContainer = document.createElement('div')
            styleContainer.innerHTML = data.html_head
            Array.from(styleContainer.children).forEach((child) => {
              document.head.appendChild(child.cloneNode(true))
            })
            console.log(
              '[Selaras Offline] CSS berhasil di-injeksi ke halaman offline.',
            )
          }

          // Pulihkan class tag <body> agar struktur layout bawaan web berfungsi
          if (data.body_class) {
            document.body.className = data.body_class
          }
        } else {
          setError(`Tidak ada struktur UI cache untuk rute: ${rawPath}`)
          const paths = await getAllCachedPaths()
          setCachedPaths(paths)
        }
      } catch (err) {
        setError(`Gagal memuat cache: ${String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadCache()

    // Interceptor klik khusus untuk halaman offline
    // Mencegah link dalam HTML cache mengarah ke URL asli atau 404 pada local extension
    const handleOfflineClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (!link || !link.href || link.target === '_blank') return

      try {
        const url = new URL(link.href)

        // Biarkan link yang mengarah secara eksplisit ke ?path=... (navigasi di dalam ekstensi UI)
        if (url.searchParams.has('path')) return

        // Cek target hostname: jika link menuju domain ekstensi (relative path web asli) atau selaras
        const isInternalHost =
          url.hostname === window.location.hostname ||
          url.hostname === 'selaras.tubankab.go.id'

        if (isInternalHost) {
          e.preventDefault()
          const fullTargetPath = url.pathname + url.search
          // Arahkan kembali ke tampilan offline ekstensi lewat param ?path=
          window.location.replace(`?path=${encodeURIComponent(fullTargetPath)}`)
        }
      } catch (err) {
        // Abaikan error parse URL
      }
    }

    document.addEventListener('click', handleOfflineClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleOfflineClick, {
        capture: true,
      })
    }
  }, []) // <- the end of first useEffect

  // Efek untuk memanggil data form IndexedDB ke dalam form HTML yang berhasil di-render
  useEffect(() => {
    if (cache && !loading) {
      setTimeout(() => {
        restoreFormFromDraft().catch((err) => {
          console.warn('[Selaras Offline] Gagal merestore form:', err)
        })
        initFormTracker() // PENTING: Pasang alat penyedot ketikan agar bisa menyimpan ke IndexedDB saat Offline!
      }, 50)
    }
  }, [cache, loading])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}>⏳</div>
        <p>Memuat halaman dari cache...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={{ fontSize: '3rem' }}>📡</div>
          <h1 style={styles.title}>Mode Offline</h1>
          <p style={styles.subtitle}>{error}</p>

          {cachedPaths.length > 0 && (
            <div style={styles.cachedList}>
              <h3 style={{ marginBottom: '0.5rem' }}>
                Halaman yang tersedia offline:
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {cachedPaths.map((p) => (
                  <li key={p} style={{ marginBottom: '0.25rem' }}>
                    <a
                      href={`?path=${encodeURIComponent(p)}`}
                      style={styles.link}
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cachedPaths.length === 0 && (
            <p style={styles.hint}>
              Kunjungi halaman Selaras saat online untuk menyimpan cache.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <style>{`
        /* Sembunyikan switch dan overlay MATI bawaan dari cache HTML orisinil */
        #root #selaras-navbar-toggle-root, 
        #root #selaras-offline-overlay-root { 
          display: none !important; 
        }
      `}</style>

      {/* UI Kendali Mengambang untuk Mode Offline (HIDUP) */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '350px',
          zIndex: 999999,
        }}
      >
        <NavbarToggle />
      </div>

      <SyncOverlay />

      {cache?.html_body ? (
        /* Render utuh seluruh struktur <body> web aslinya */
        <div dangerouslySetInnerHTML={{ __html: cache.html_body }} />
      ) : (
        <>
          {/* Fallback rendering untuk perangkat yang menyimpan versi cache lama */}
          {cache?.html_sidebar && (
            <div dangerouslySetInnerHTML={{ __html: cache.html_sidebar }} />
          )}
          <div dangerouslySetInnerHTML={{ __html: cache?.html_main ?? '' }} />
        </>
      )}
    </div>
  )
}

// ==========================================
// Inline Styles (tanpa CSS framework)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
  },
  spinner: {
    fontSize: '3rem',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  errorCard: {
    background: '#fff',
    borderRadius: '1rem',
    padding: '2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    maxWidth: '480px',
    width: '100%',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '1rem 0 0.5rem',
  },
  subtitle: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  cachedList: {
    textAlign: 'left' as const,
    background: '#f4f4f5',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1rem',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
  },
  hint: {
    color: '#888',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
  banner: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  btnReturn: {
    padding: '0.5rem 1rem',
    background: '#fff',
    color: '#d97706',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
}

// ==========================================
// Mount
// ==========================================
const container = document.getElementById('root')
if (container) {
  const rootKey = '__react_root__'
  if (!(window as any)[rootKey]) {
    ;(window as any)[rootKey] = createRoot(container)
  }
  ;(window as any)[rootKey].render(<OfflinePage />)
}
