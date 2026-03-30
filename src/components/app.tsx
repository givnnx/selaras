import { useState, useEffect } from 'react'

export function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleClose = () => {
    // Kirim pesan ke content script untuk menutup overlay
    window.parent.postMessage({ action: 'open-or-close-extension' }, '*')
  }

  return (
    <div className="bg-background flex h-full min-h-[400px] w-full min-w-[360px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Selaras Offline</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isOnline ? '🟢 Online' : '🟡 Offline'}
          </span>
        </div>
        <button
          id="selaras-close-btn"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          title="Tutup"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-4xl">{isOnline ? '☁️' : '💾'}</div>
        <div>
          <p className="font-semibold">
            {isOnline ? 'Koneksi aktif' : 'Mode Offline'}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {isOnline
              ? 'Data form akan tersimpan dan tersinkronisasi secara otomatis.'
              : 'Data form tersimpan aman di lokal. Akan dikirim saat internet kembali.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
