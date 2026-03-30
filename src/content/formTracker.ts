import {
  getSurveyDraft,
  saveSurveyDraft,
  addAnggotaToDraft,
  type AnggotaKeluarga,
} from '../lib/db'
import { compressImage } from '../lib/compressor'

// ==========================================
// 1. Helper: Mengambil JWT (no_kk) dari URL
// ==========================================
export function getFormIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('no_kk')
}

// ==========================================
// 2. Fungsi Utama: Auto-Save Form
// ==========================================
export function initFormTracker() {
  const formId = getFormIdFromUrl()
  if (!formId) return // Berhenti jika bukan di halaman form survei

  // Targetkan form utama keluarga
  const formKeluarga = document.querySelector<HTMLFormElement>('#formKeluarga')

  if (formKeluarga) {
    // Event 'input' bereaksi setiap kali user mengetik atau memilih dropdown
    formKeluarga.addEventListener('input', async (e) => {
      const target = e.target as HTMLInputElement

      // Abaikan input file sementara (akan ditangani khusus oleh kompresor gambar)
      if (target && target.type === 'file') return

      // Kumpulkan 150+ data form secara otomatis
      const formData = new FormData(formKeluarga)
      const data = Object.fromEntries(formData.entries())

      // Ambil draft lama agar array anggota_keluarga tidak ter-overwrite (terhapus)
      const existingDraft = await getSurveyDraft(formId)

      await saveSurveyDraft({
        form_id: formId,
        updated_at: Date.now(),
        is_synced: false, // Menandakan data ini belum terkirim ke server
        content: data,
        anggota_keluarga: existingDraft ? existingDraft.anggota_keluarga : [],
      })

      console.log('✅ [Selaras Offline] Draft Keluarga tersimpan otomatis!')
    })

    formKeluarga.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement

      // Jika yang berubah adalah input file (foto)
      if (
        target &&
        target.type === 'file' &&
        target.files &&
        target.files.length > 0
      ) {
        try {
          // 1. Ambil file pertama
          const file = target.files[0]

          // 2. Kompres! (Akan mengecilkan file 5MB menjadi ~300KB)
          const base64String = await compressImage(file, 1200, 0.7)

          // 3. Simpan ke database (gabungkan ke object content draft)
          const formId = getFormIdFromUrl()
          if (formId) {
            const draft = await getSurveyDraft(formId)
            if (draft) {
              draft.content[target.name] = base64String // target.name = 'foto_rumah_depan' dll
              draft.updated_at = Date.now()
              await saveSurveyDraft(draft)
              console.log(
                `📸 [Selaras Offline] Foto ${target.name} dikompresi & disimpan!`,
              )
            }
          }
        } catch (error) {
          console.error('Gagal mengompresi foto:', error)
        }
      }
    })
  }

  // ==========================================
  // 3. Intersepsi Modal Anggota Keluarga
  // ==========================================
  const btnSimpanAnggota =
    document.querySelector<HTMLButtonElement>('#btnSimpanAnggota') //
  const formAnggota = document.querySelector<HTMLFormElement>('#formAnggota') //

  if (btnSimpanAnggota && formAnggota) {
    btnSimpanAnggota.addEventListener('click', async () => {
      // Pastikan form valid sebelum disimpan ke lokal
      if (!formAnggota.checkValidity()) return

      const formData = new FormData(formAnggota)
      const data = Object.fromEntries(formData.entries()) as Record<string, any>

      // Susun objek anggota
      const anggota: AnggotaKeluarga = {
        nik: (data.nik as string) || `BAYI_${Date.now()}`, // Fallback jika tidak punya NIK
        nama_lgkp: (data.nama_lgkp as string) || 'Tanpa Nama',
        ...data,
      }

      await addAnggotaToDraft(formId, anggota)
      console.log('✅ [Selaras Offline] Data Anggota masuk ke brankas lokal!')
    })
  }
}

// ==========================================
// 4. Fungsi Pemulihan (Auto-Fill) saat Online/Refresh
// ==========================================
export async function restoreFormFromDraft(): Promise<void> {
  const formId = getFormIdFromUrl()
  if (!formId) return

  const draft = await getSurveyDraft(formId)
  if (!draft || !draft.content) return

  console.log('🔄 [Selaras Offline] Memulihkan data dari draft lokal...')

  Object.keys(draft.content).forEach((key) => {
    // SANGAT PENTING: Jangan timpa token CSRF baru dari server dengan yang lama
    if (key === '_token') return

    // Cari input berdasarkan atribut 'name'
    const input = document.querySelector(`[name="${key}"]`) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement

    if (input) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        ;(input as HTMLInputElement).checked =
          input.value === draft.content[key]
      } else if (input.type !== 'file') {
        input.value = draft.content[key]
      }
    }
  })
}
