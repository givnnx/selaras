import React, { useEffect, useState } from 'react'
import { getForceOfflineMode, setForceOfflineMode } from '@/lib/db'

export const NavbarToggle: React.FC = () => {
  const [isForceOffline, setIsForceOffline] = useState(false)

  useEffect(() => {
    // Initial fetch
    getForceOfflineMode().then(setIsForceOffline)

    // Deteksi sinkronisasi perubahan jika toggle diganti dari ekstensi
    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.force_offline_mode !== undefined) {
        setIsForceOffline(!!changes.force_offline_mode.newValue)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const toggleForceOffline = async () => {
    const newState = !isForceOffline
    setIsForceOffline(newState)
    await setForceOfflineMode(newState)

    // Redirect pintar untuk memindahkan user secara instan
    if (newState) {
      // Jika nyalakan offline, dan sedang berada di web asli, segera redirect ke versi offline
      if (window.location.hostname === 'selaras.tubankab.go.id') {
        const fullPath = window.location.pathname + window.location.search
        window.location.replace(
          chrome.runtime.getURL(
            `pages/offline.html?path=${encodeURIComponent(fullPath)}`,
          ),
        )
      }
    } else {
      // Jika matikan offline, dan sedang berada di layar offline ekstensi, segera redirect balik ke web asli
      if (window.location.protocol === 'chrome-extension:') {
        const params = new URLSearchParams(window.location.search)
        const path = params.get('path') || '/'
        window.location.replace(`https://selaras.tubankab.go.id${path}`)
      } else if (window.location.hostname === 'selaras.tubankab.go.id') {
        // Jika mematikan lewat web yang masih terbuka sesudah error, cukup refresh agar normal
        window.location.reload()
      }
    }
  }

  // Desain menyerupai nav-item di bootstrap
  return (
    <div
      className="nav-item d-flex align-items-center"
      style={{ height: '100%', margin: '0 10px', display: 'flex' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isForceOffline ? '#e0f2fe' : '#f3f4f6',
          border: `1px solid ${isForceOffline ? '#bae6fd' : '#e5e7eb'}`,
          borderRadius: '20px',
          padding: '4px 12px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isForceOffline ? '#0284c7' : '#6b7280',
            fontFamily: 'sans-serif',
          }}
        >
          {isForceOffline ? 'Simulasi Aktif' : 'Simulasi Offline'}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleForceOffline()
          }}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            height: '20px',
            width: '36px',
            borderRadius: '9999px',
            backgroundColor: isForceOffline ? '#2563eb' : '#9ca3af',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.2s',
          }}
          role="switch"
          aria-checked={isForceOffline}
        >
          <span
            style={{
              display: 'inline-block',
              height: '14px',
              width: '14px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              transform: isForceOffline
                ? 'translateX(18px)'
                : 'translateX(3px)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
