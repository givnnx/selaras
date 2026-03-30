import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ==========================================
// 1. Tipe Data (Interfaces)
// ==========================================
export interface AnggotaKeluarga {
  nik: string
  nama_lgkp: string
  [key: string]: any // Menampung sisa field dinamis dari form anggota
}

export interface SurveyDraft {
  form_id: string // String JWT Base64 dari URL
  updated_at: number
  is_synced: boolean
  content: Record<string, any> // Menampung 150+ field keluarga utama
  anggota_keluarga: AnggotaKeluarga[]
}

export interface UICache {
  pagePath: string
  html_main: string
  html_sidebar: string
  timestamp: number
}

export interface SelarasDB extends DBSchema {
  survey_drafts: {
    key: string
    value: SurveyDraft
  }
  ui_cache: {
    key: string
    value: UICache
  }
}

// ==========================================
// 2. Inisialisasi Database
// ==========================================
const DB_NAME = 'SelarasOfflineDB'
const DB_VERSION = 1

export async function initDB(): Promise<IDBPDatabase<SelarasDB>> {
  return openDB<SelarasDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('survey_drafts')) {
        db.createObjectStore('survey_drafts', { keyPath: 'form_id' })
      }
      if (!db.objectStoreNames.contains('ui_cache')) {
        db.createObjectStore('ui_cache', { keyPath: 'pagePath' })
      }
    },
  })
}

// ==========================================
// 3. Fungsi CRUD untuk Form Keluarga
// ==========================================
export async function saveSurveyDraft(draft: SurveyDraft) {
  const db = await initDB()
  draft.updated_at = Date.now()
  await db.put('survey_drafts', draft)
}

export async function getSurveyDraft(form_id: string) {
  const db = await initDB()
  return await db.get('survey_drafts', form_id)
}

// Fungsi khusus: Menambah/Update Anggota dari Modal ke dalam Draft Keluarga
export async function addAnggotaToDraft(
  form_id: string,
  anggota: AnggotaKeluarga,
) {
  const db = await initDB()
  let draft = await db.get('survey_drafts', form_id)

  // Jika draft keluarga utama belum ada saat tambah anggota, buat kerangkanya
  if (!draft) {
    draft = {
      form_id,
      updated_at: Date.now(),
      is_synced: false,
      content: {},
      anggota_keluarga: [],
    }
  }

  // Cek apakah NIK sudah ada (Update) atau belum (Insert baru)
  const existingIndex = draft.anggota_keluarga.findIndex(
    (a) => a.nik === anggota.nik,
  )
  if (existingIndex >= 0) {
    draft.anggota_keluarga[existingIndex] = anggota
  } else {
    draft.anggota_keluarga.push(anggota)
  }

  draft.updated_at = Date.now()
  await db.put('survey_drafts', draft)
}

// ==========================================
// 4. Fungsi CRUD untuk UI Cache (Mode Offline)
// ==========================================
export async function saveUICache(cache: UICache) {
  const db = await initDB()
  cache.timestamp = Date.now()
  await db.put('ui_cache', cache)
}

export async function getUICache(pagePath: string) {
  const db = await initDB()
  return await db.get('ui_cache', pagePath)
}
