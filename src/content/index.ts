import { initFormTracker, restoreFormFromDraft } from './formTracker'
import { initOfflineNavigation } from './domSnapshot'
import { initSyncManager } from './syncManager'

// Jalankan pelacak form dan auto-save
initFormTracker()

// Coba pulihkan data form jika ada (berguna saat pindah halaman secara offline)
restoreFormFromDraft()

// Jalankan pencegat navigasi offline
initOfflineNavigation()

// Jalankan pengelola sinkronisasi (saat internet kembali)
initSyncManager()
