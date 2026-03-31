import React, { useEffect, useState } from 'react'
import { getForceOfflineMode } from '@/lib/db'

export const SyncOverlay: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheMissPath, setCacheMissPath] = useState<string | null>(null)
  const [isForceOffline, setIsForceOffline] = useState(false)

  useEffect(() => {
    getForceOfflineMode().then(setIsForceOffline)

    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.force_offline_mode !== undefined) {
        setIsForceOffline(!!changes.force_offline_mode.newValue)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleCacheMiss = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail.path
      setCacheMissPath(path)
      // Auto-dismiss setelah 5 detik
      setTimeout(() => setCacheMissPath(null), 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('selaras-cache-miss', handleCacheMiss)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('selaras-cache-miss', handleCacheMiss)
    }
  }, [])

  const currentlyOffline = !isOnline || isForceOffline

  return (
    <div className="fixed right-5 bottom-5 z-[9999] flex flex-col gap-2 font-sans">
      {/* Notifikasi saat Offline Asli atau Simulasi */}
      {currentlyOffline && (
        <div
          className={`${isForceOffline ? 'bg-blue-600' : 'bg-yellow-500'} flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-white shadow-xl transition-all`}
        >
          <span>{isForceOffline ? '🌐' : '⚠️'}</span>{' '}
          {isForceOffline ? 'Simulasi Offline Aktif' : 'Anda Offline'}
        </div>
      )}

      {/* Notifikasi cache miss */}
      {cacheMissPath && (
        <div className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-xl">
          <span>❌</span>
          <span>
            Halaman <code className="font-mono text-xs">{cacheMissPath}</code>{' '}
            belum di-cache.
          </span>
          <button
            onClick={() => setCacheMissPath(null)}
            className="ml-auto text-white opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
