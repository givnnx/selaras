/**
 * Mengompresi file gambar menggunakan Canvas API browser.
 * * @param file Objek File asli dari input type="file"
 * @param maxWidth Lebar maksimal gambar hasil kompresi (default: 1200px)
 * @param quality Kualitas JPEG dari 0.0 hingga 1.0 (default: 0.7)
 * @returns Promise yang menghasilkan string Base64 (Data URL)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Pastikan file yang diunggah benar-benar gambar
    if (!file.type.startsWith('image/')) {
      reject(new Error('File bukan gambar'))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Hitung proporsi (aspect ratio) agar gambar tidak "gepeng"
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Gagal membuat context canvas 2D'))
          return
        }

        // Gambar ulang foto asli ke kanvas virtual dengan ukuran baru
        ctx.drawImage(img, 0, 0, width, height)

        // Ekspor menjadi string Base64 (format JPEG agar lebih kecil dari PNG)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }

      img.onerror = (err) => reject(err)
    }

    reader.onerror = (err) => reject(err)
  })
}
