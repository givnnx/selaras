// Sync Manager dinonaktifkan

export function initSyncManager() {
  // Fitur Auto-Sync ke server kini telah dimatikan sesuai permintaan user.
  // Data draf akan dibiarkan tersimpan di IndexedDB agar petugas secara sadar
  // menekan tombol 'Simpan' sendiri di website resmi Selaras saat Online.
  console.log('[Selaras Offline] Fitur Background Auto-Sync dinonaktifkan.')
}
