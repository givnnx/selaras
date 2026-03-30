import React, { useEffect, useState } from 'react'

export const SyncOverlay: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Listener untuk perubahan status internet bawaan browser
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Listener khusus untuk status sinkronisasi yang akan kita trigger nanti
    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncEnd = () => setIsSyncing(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('selaras-sync-start', handleSyncStart)
    window.addEventListener('selaras-sync-end', handleSyncEnd)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('selaras-sync-start', handleSyncStart)
      window.removeEventListener('selaras-sync-end', handleSyncEnd)
    }
  }, [])

  return (
    <div className="fixed right-5 bottom-5 z-[9999] flex flex-col gap-2 font-sans">
      {/* Notifikasi saat Offline */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 font-bold text-white shadow-xl">
          <span>⚠️</span> Anda Offline. Data tersimpan aman di lokal.
        </div>
      )}

      {/* Notifikasi saat proses sinkronisasi ke server */}
      {isSyncing && (
        <div className="flex animate-pulse items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white shadow-xl">
          <span>🔄</span> Menyinkronkan data ke server...
        </div>
      )}
    </div>
  )
}
