# Resumable Chunked Upload - Syntel

## 📋 Overview

Sistem upload yang telah diimplementasikan menggunakan **Tus Protocol** untuk resumable chunked uploads. Ini memungkinkan file besar diupload dalam potongan kecil (chunks) dan dapat dilanjutkan jika koneksi terputus atau halaman di-refresh.

## 🎯 Fitur Utama

### ✅ Resumable Upload
- Upload dapat di-pause dan dilanjutkan kapan saja
- Jika koneksi internet terputus, upload otomatis dilanjutkan dari chunk terakhir
- Refresh halaman tidak akan menghapus progress upload
- Progress upload disimpan di browser storage

### ✅ Chunked Upload
- File besar dipotong menjadi chunks 5MB
- Setiap chunk diupload secara terpisah
- Jika satu chunk gagal, hanya chunk tersebut yang diulang
- Lebih reliable untuk file besar dan koneksi tidak stabil

### ✅ Background Processing
- File yang sudah selesai diupload via Tus akan diproses di background
- Otomatis diupload ke Cloudinary untuk storage permanen
- Metadata disimpan ke database
- File temporary Tus dihapus setelah berhasil diproses

## 🏗️ Arsitektur

```
┌─────────────┐
│   Browser   │
│  (Uppy.js)  │
└──────┬──────┘
       │ Chunked Upload (5MB chunks)
       ↓
┌─────────────────────┐
│  Tus Server         │
│  /api/upload/tus    │
│  (Temporary Storage)│
└──────┬──────────────┘
       │ File Complete
       ↓
┌─────────────────────┐
│  Processor API      │
│  /api/upload/       │
│  process-tus        │
└──────┬──────────────┘
       │
       ├──→ Upload to Cloudinary
       │
       └──→ Save to Database (Prisma)
```

## 📦 Dependencies

```json
{
  "@uppy/core": "^latest",
  "@uppy/dashboard": "^latest",
  "@uppy/tus": "^latest",
  "@tus/server": "^latest",
  "@tus/file-store": "^latest",
  "tus-js-client": "^latest"
}
```

## 🚀 Cara Penggunaan

### 1. Upload File

```tsx
import { ResumableUploadModal } from '@/app/components/upload/ResumableUploadModal';

<ResumableUploadModal
  onClose={() => setShowModal(false)}
  onComplete={(uploads) => {
    console.log('Uploads completed:', uploads);
    // Refresh data atau lakukan action lain
  }}
  uploaderId={currentUser.nip}
/>
```

### 2. Flow Upload

1. **User memilih file** di Uppy Dashboard
2. **Klik "Upload"** - File mulai diupload ke Tus server dalam chunks
3. **Progress tersimpan** di browser storage (IndexedDB)
4. **Jika refresh halaman**:
   - Uppy otomatis mendeteksi upload yang belum selesai
   - Upload dilanjutkan dari chunk terakhir
5. **Setelah upload selesai**:
   - File diproses via `/api/upload/process-tus`
   - Diupload ke Cloudinary
   - Metadata disimpan ke database
   - File temporary Tus dihapus

## 📁 File Structure

```
app/
├── api/
│   └── upload/
│       ├── tus/
│       │   └── [...path]/
│       │       └── route.ts          # Tus server endpoint
│       └── process-tus/
│           └── route.ts              # Cloudinary processor
├── components/
│   └── upload/
│       └── ResumableUploadModal.tsx  # Upload UI component
└── dashboard/
    └── officer/
        └── arsip/
            └── page.tsx              # Archive page (uses modal)

uploads/
└── tus/                              # Temporary Tus files
    ├── <upload-id>                   # File chunks
    └── <upload-id>.info              # Upload metadata
```

## ⚙️ Konfigurasi

### Tus Server (`/api/upload/tus/[...path]/route.ts`)

```typescript
const tusServer = new Server({
    path: '/api/upload/tus',
    datastore: new FileStore({ 
        directory: path.join(process.cwd(), 'uploads', 'tus')
    }),
    // Konfigurasi lainnya...
});
```

### Uppy Client (`ResumableUploadModal.tsx`)

```typescript
uppy.use(Tus, {
    endpoint: '/api/upload/tus/',
    chunkSize: 5 * 1024 * 1024,        // 5MB chunks
    retryDelays: [0, 1000, 3000, 5000], // Retry delays
    storeFingerprintForResuming: true,  // Enable resume
});
```

## 🔧 Troubleshooting

### Upload tidak bisa di-resume setelah refresh

**Solusi**: Pastikan `storeFingerprintForResuming: true` di konfigurasi Tus plugin.

### File tidak muncul di arsip setelah upload

**Solusi**: 
1. Check console untuk error di `/api/upload/process-tus`
2. Pastikan Cloudinary credentials sudah benar
3. Check database connection

### Tus files menumpuk di `uploads/tus/`

**Solusi**: File temporary seharusnya dihapus otomatis setelah diproses. Jika menumpuk, bisa dibuat cron job untuk cleanup:

```typescript
// Hapus file Tus yang lebih dari 24 jam
const cleanupOldTusFiles = () => {
    const tusDir = path.join(process.cwd(), 'uploads', 'tus');
    const files = fs.readdirSync(tusDir);
    const now = Date.now();
    
    files.forEach(file => {
        const filePath = path.join(tusDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > 24 * 60 * 60 * 1000) { // 24 hours
            fs.unlinkSync(filePath);
        }
    });
};
```

## 📊 Monitoring

### Check Upload Progress

Upload progress disimpan di browser's IndexedDB:
- Open DevTools → Application → IndexedDB → `uppy`
- Lihat `uploads` store untuk melihat active uploads

### Server Logs

```bash
# Development
npm run dev

# Check Tus server logs
# Logs akan muncul di console saat upload
```

## 🔐 Security Considerations

1. **File Size Limit**: Default 500MB, bisa diubah di restrictions
2. **File Type Validation**: Hanya allow image/*, video/*, dan dokumen
3. **Authentication**: Pastikan `uploaderId` valid
4. **Rate Limiting**: Pertimbangkan menambahkan rate limiting untuk upload endpoint

## 🎨 Customization

### Ubah Chunk Size

```typescript
uppy.use(Tus, {
    chunkSize: 10 * 1024 * 1024, // 10MB chunks
});
```

### Ubah File Size Limit

```typescript
const uppy = new Uppy({
    restrictions: {
        maxFileSize: 1000 * 1024 * 1024, // 1GB
    },
});
```

### Tambah File Type

```typescript
const uppy = new Uppy({
    restrictions: {
        allowedFileTypes: ['image/*', 'video/*', '.pdf', '.zip'],
    },
});
```

## 📝 Notes

- Tus protocol adalah standard industri untuk resumable uploads
- Uppy adalah library yang mature dan well-maintained
- File temporary di `uploads/tus/` harus di-gitignore
- Untuk production, pertimbangkan menggunakan cloud storage untuk Tus files (S3, GCS, dll)

## 🔗 Resources

- [Tus Protocol](https://tus.io/)
- [Uppy Documentation](https://uppy.io/docs/)
- [@tus/server](https://github.com/tus/tus-node-server)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
