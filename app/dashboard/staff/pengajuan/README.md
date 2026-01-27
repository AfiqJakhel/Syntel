# Halaman Pengajuan Konten

Halaman ini menampilkan daftar assignment dan pengajuan konten untuk staff.

## Struktur File

```
app/dashboard/staff/pengajuan/
├── page.tsx                          # Halaman utama pengajuan
├── components/
│   └── AssignmentCard.tsx           # Komponen card untuk assignment
├── [id]/
│   └── page.tsx                     # Halaman detail & upload assignment
└── buat/
    └── page.tsx                     # Halaman buat pengajuan baru
```

## Fitur

### 1. Halaman Utama (`/dashboard/staff/pengajuan`)
- Menampilkan grid card assignment dari officer
- Tombol "Buat Pengajuan" untuk membuat pengajuan baru
- Status badge (Revisi) untuk assignment yang perlu direvisi
- Loading state saat fetch data

### 2. Assignment Card
- Thumbnail konten
- Badge tipe konten (FLYER, INSTRUCTION, dll)
- Badge status revisi
- Informasi assigned by dan deadline
- Feedback revisi (jika ada)
- Tombol action berbeda untuk status pending vs revision

### 3. Halaman Detail Assignment (`/dashboard/staff/pengajuan/[id]`)
- Info lengkap assignment di sidebar
- Form upload dengan:
  - Judul submission
  - Deskripsi (opsional)
  - File upload (drag & drop area)
- Feedback revisi ditampilkan jika status revision

### 4. Halaman Buat Pengajuan (`/dashboard/staff/pengajuan/buat`)
- Form untuk membuat pengajuan baru tanpa assignment
- Field:
  - Judul konten (required)
  - Tipe konten (required) - dropdown dengan pilihan:
    - Instagram Post
    - Instagram Carousel
    - Instagram Reels
    - Instagram Story
    - TikTok Post
    - YouTube Video
    - Poster
    - Dokumen Internal
  - Deskripsi (opsional)
  - File upload (required)

## Design System

### Colors
- Primary: Red (#DC2626 / red-600)
- Background: Gray-50
- Cards: White dengan border gray-100
- Text: Gray-900 (heading), Gray-600 (body), Gray-500 (meta)

### Components
- Buttons: Rounded-lg dengan shadow dan hover effects
- Cards: Rounded-xl dengan subtle shadow dan hover:shadow-xl
- Inputs: Border gray-300 dengan focus:ring-red-500
- Upload area: Border-dashed dengan hover effect

### Typography
- Heading: Font-bold, text-3xl
- Subheading: Font-bold, text-lg
- Body: Text-sm
- Meta: Text-xs

## TODO - Integrasi API

Saat ini menggunakan mock data. Perlu diintegrasikan dengan API:

1. **Fetch Assignments** (`/dashboard/staff/pengajuan`)
   ```typescript
   GET /api/assignments
   Response: Assignment[]
   ```

2. **Fetch Assignment Detail** (`/dashboard/staff/pengajuan/[id]`)
   ```typescript
   GET /api/assignments/:id
   Response: Assignment
   ```

3. **Submit Pengajuan**
   ```typescript
   POST /api/submissions
   Body: {
     title: string
     description?: string
     contentType: ContentType
     file: File
     instructionId?: string
   }
   ```

4. **Upload File**
   - Implementasi upload ke Cloudinary
   - Progress indicator
   - Error handling

## Navigasi

- Dari sidebar: Klik "Pengajuan Konten" → `/dashboard/staff/pengajuan`
- Dari card: Klik card atau tombol action → `/dashboard/staff/pengajuan/[id]`
- Dari header: Klik "Buat Pengajuan" → `/dashboard/staff/pengajuan/buat`
- Back button: `router.back()` di semua halaman detail

## Responsive Design

- Desktop: Grid 3 kolom untuk cards
- Tablet: Grid 2 kolom
- Mobile: Grid 1 kolom
- Sidebar: Collapsible di mobile
