import { initDB, type SurveyDraft } from '../lib/db'

export function initSyncManager() {
  // Jalankan sinkronisasi otomatis ketika browser mendeteksi internet kembali
  window.addEventListener('online', async () => {
    console.log(
      '🌐 [Selaras Offline] Internet kembali! Memulai sinkronisasi...',
    )
    await processSyncQueue()
  })
}

async function processSyncQueue() {
  const db = await initDB()

  // Ambil semua data yang belum tersinkronisasi
  const allDrafts = await db.getAll('survey_drafts')
  const pendingDrafts = allDrafts.filter((draft) => !draft.is_synced)

  if (pendingDrafts.length === 0) return

  // Trigger event agar React Overlay menampilkan tulisan "Menyinkronkan..."
  window.dispatchEvent(new CustomEvent('selaras-sync-start'))

  // Cari Token CSRF dari halaman saat ini
  const csrfInput = document.querySelector<HTMLInputElement>(
    'input[name="_token"]',
  )
  const csrfToken = csrfInput ? csrfInput.value : ''

  for (const draft of pendingDrafts) {
    try {
      // Ubah objek draft content kembali menjadi FormData
      const formData = new FormData()

      // Masukkan token CSRF terbaru
      if (csrfToken) formData.append('_token', csrfToken)

      // Masukkan sisa data input
      Object.entries(draft.content).forEach(([key, value]) => {
        if (key !== '_token') formData.append(key, value)
      })

      // Kirim ke endpoint Laravel secara asinkron
      const response = await fetch(
        'https://selaras.tubankab.go.id/survei/survei-keluarga',
        {
          method: 'POST',
          body: formData,
          // Header ini penting agar Laravel tahu ini request AJAX
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        },
      )

      if (response.ok) {
        // Jika sukses, tandai draft sebagai tersinkronisasi
        draft.is_synced = true
        await db.put('survey_drafts', draft)
        console.log(
          `✅ [Selaras Offline] Draft ${draft.form_id} berhasil disinkronisasi!`,
        )
      }
    } catch (error) {
      console.error(
        `❌ [Selaras Offline] Gagal menyinkronkan draft ${draft.form_id}`,
        error,
      )
    }
  }

  // Matikan notifikasi "Menyinkronkan..."
  window.dispatchEvent(new CustomEvent('selaras-sync-end'))
}
