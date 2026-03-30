import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  getUICacheFromStorage,
  getAllCachedPaths,
  type UICache,
} from '@/lib/db'

function OfflinePage() {
  const [cache, setCache] = useState<UICache | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedPaths, setCachedPaths] = useState<string[]>([])
  const [pagePath, setPagePath] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const path = params.get('path') || '/'
    setPagePath(path)

    async function loadCache() {
      try {
        const data = await getUICacheFromStorage(path)
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
        } else {
          setError(`Tidak ada cache untuk halaman: ${path}`)
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
  }, [])

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

  const timeAgo = cache ? formatTimeAgo(cache.timestamp) : ''

  return (
    <div>
      {/* Banner Offline */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <span style={{ fontWeight: 'bold' }}>⚠️ Mode Offline</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Menampilkan cache dari: <strong>{pagePath}</strong>
            {timeAgo && ` • Disimpan ${timeAgo}`}
          </span>
        </div>
      </div>

      {/* Sidebar */}
      {cache?.html_sidebar && (
        <div dangerouslySetInnerHTML={{ __html: cache.html_sidebar }} />
      )}

      {/* Main Content */}
      <div dangerouslySetInnerHTML={{ __html: cache?.html_main ?? '' }} />
    </div>
  )
}

// ==========================================
// Utilitas
// ==========================================
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds} detik yang lalu`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit yang lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam yang lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari yang lalu`
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
