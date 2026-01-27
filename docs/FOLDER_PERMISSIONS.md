# Folder Permissions Management Feature

## Overview
Fitur ini menambahkan kemampuan untuk mengelola akses **FULL_ACCESS** staff terhadap folder di sistem archive. 

**Konsep Permission:**
- ✅ **Semua staff** secara default sudah punya **VIEW_ONLY** access ke semua folder (tidak perlu setup)
- ✅ **Permission Record** di database hanya untuk staff yang punya **FULL_ACCESS**
- ✅ **Tidak ada record** = View Only (default semua staff)
- ✅ **Ada record FULL_ACCESS** = Staff bisa tambah/ubah/hapus di folder tersebut

## Fitur yang Ditambahkan

### 1. **Three-Dot Menu di Folder Card**
Di setiap folder card, terdapat menu three-dot (⋮) yang muncul saat hover. Menu ini menyediakan opsi:
- **Kelola Akses** 👥 - Membuka modal permission management untuk upgrade staff ke Full Access
- **Hapus Folder** 🗑️ - Menghapus folder (existing functionality)

**Lokasi:** `app/dashboard/officer/arsip/page.tsx` (baris ~900-945)

### 2. **Folder Permissions Modal**
Modal untuk mengelola **Full Access** dengan konsep:

**Permission Model:**
- 📖 **Default**: SEMUA staff otomatis punya **VIEW_ONLY** (bisa lihat semua folder)
- 🔓 **Upgrade**: Officer bisa upgrade staff tertentu ke **FULL_ACCESS** (bisa tambah/edit/hapus)
- 💾 **Database**: Hanya menyimpan staff yang punya FULL_ACCESS
- 🔙 **Downgrade**: Toggle OFF menghapus record, staff kembali ke VIEW_ONLY default

**Fitur Modal:**
- 📋 **List Semua Staff** - Menampilkan semua staff aktif dengan status akses mereka
- 🎚️ **Toggle Switch** - Switch untuk upgrade/downgrade antara VIEW_ONLY ↔ FULL_ACCESS
- ✅ **Check All Button** - Berikan FULL_ACCESS ke semua staff sekaligus atau hapus semua
- 📊 **Counter** - Berapa staff yang punya Full Access (X / Total)
- 💾 **Auto Save** - Toggle dan Check All langsung update database
- 🎨 **Visual Indicators**:
  - 👁️ **View Only** (Blue/Gray) - Default untuk semua staff
  - 🛡️ **Full Access** (Green) - Staff bisa tambah, ubah, hapus

**Komponen:** `app/components/archive/FolderPermissionsModal.tsx`

### 3. **Permission Selection in Create Folder Modal**
Di modal "Buat Folder", telah ditambahkan opsi untuk memberikan Full Access saat pembuatan folder. Saat ini UI sudah ada, namun fungsionalitas penuh akan dikembangkan lebih lanjut.

**Lokasi:** `app/dashboard/officer/arsip/page.tsx` (baris ~1290-1310)

## API Endpoints

### Existing Endpoints (sudah ada):
1. **GET `/api/archive/permissions?folderId={id}`**
   - Mengambil semua permission FULL_ACCESS untuk folder tertentu
   - Query: `folderId` (required), `staffNip` (optional)
   - Return: List staff yang punya FULL_ACCESS

2. **POST `/api/archive/permissions`**
   - Membuat atau update permission ke FULL_ACCESS
   - Body: `{ folderId, staffNip, accessLevel: "FULL_ACCESS", grantedById }`

3. **DELETE `/api/archive/permissions?id={permissionId}`**
   - Menghapus permission (staff kembali ke VIEW_ONLY default)

### New Endpoint (baru dibuat):
4. **GET `/api/users/staff`**
   - Mengambil list semua staff aktif
   - File: `app/api/users/staff/route.ts`

## Database Schema
Schema sudah ada di Prisma:
```prisma
model ArchiveFolderPermission {
  id            String                  @id @default(cuid())
  folderId      String
  folder        ArchiveFolder           @relation(...)
  staffNip      String
  staff         User                    @relation(...)
  accessLevel   ArchivePermissionLevel  @default(VIEW_ONLY)
  grantedById   String
  grantedAt     DateTime                @default(now())
  updatedAt     DateTime                @updatedAt
  
  @@unique([folderId, staffNip])
}

enum ArchivePermissionLevel {
  VIEW_ONLY    // Tidak digunakan (default behavior tanpa record)
  FULL_ACCESS  // Record hanya untuk ini
}
```

**Note:** Meskipun enum ada VIEW_ONLY, dalam prakteknya:
- **Tidak ada record** → Staff punya VIEW_ONLY (default)
- **Ada record dengan FULL_ACCESS** → Staff punya Full Access

## User Flow

### Kelola Permission dari Folder Card:
1. Hover pada folder card
2. Klik icon three-dot (⋮) di pojok kanan atas
3. Pilih "Kelola Akses"
4. Di modal:
   - Semua staff ditampilkan dengan status mereka (View Only atau Full Access)
   - Toggle switch untuk upgrade/downgrade individual staff
   - Toggle ON = Berikan FULL_ACCESS (insert record)
   - Toggle OFF = Kembali ke VIEW_ONLY (delete record)
   - **Check All Button**: Klik untuk berikan/hapus Full Access semua staff sekaligus
     - "Check All" = Berikan FULL_ACCESS ke semua staff
     - "Uncheck All" = Hapus semua Full Access (semua kembali View Only)
5. Perubahan otomatis tersimpan saat toggle atau Check All

### Buat Folder dengan Permission (UI Ready):
1. Klik "Buat Folder"
2. Isi nama dan keterangan folder
3. (Optional) Klik "Pilih Staff" di section "Akses Permission"
4. Klik "Buat Folder"

## Technical Implementation

### State Management (di page.tsx):
```typescript
// Permission modal state
const [showPermissionsModal, setShowPermissionsModal] = useState(false);
const [permissionsFolder, setPermissionsFolder] = useState<ArchiveFolder | null>(null);

// Create folder permission selection
const [selectedStaffForNewFolder, setSelectedStaffForNewFolder] = useState<Set<string>>(new Set());
```

### Key Functions:
- `getStaffAccessLevel(staffNip)` - Cek level akses staff (VIEW_ONLY jika no record, atau FULL_ACCESS)
- `toggleFullAccess(staffNip)` - Toggle antara VIEW_ONLY ↔ FULL_ACCESS (insert/delete record)

### Permission Logic:
```typescript
// Jika tidak ada permission record → VIEW_ONLY (default)
const getStaffAccessLevel = (staffNip: string): "VIEW_ONLY" | "FULL_ACCESS" => {
    const perm = permissions.find(p => p.staffNip === staffNip);
    return perm?.accessLevel || "VIEW_ONLY"; // Default VIEW_ONLY
};

// Toggle: 
// - FULL_ACCESS → VIEW_ONLY: Delete record
// - VIEW_ONLY → FULL_ACCESS: Insert/Update record
```

## UI/UX Features
✅ Smooth animations dengan Framer Motion
✅ Toggle switches yang responsive
✅ Loading states untuk setiap action
✅ Toast notifications untuk feedback
✅ Responsive dropdown menu
✅ Real-time Full Access count display
✅ Color-coded access indicators:
   - 👁️ Blue/Gray = View Only (default)
   - 🛡️ Green = Full Access
✅ Info box menjelaskan default behavior
✅ Premium design yang consistent dengan existing UI

## Access Control Behavior

### Default (Tanpa Permission Record):
- ✅ Staff bisa LIHAT semua folder
- ✅ Staff bisa DOWNLOAD files
- ❌ Staff TIDAK bisa upload
- ❌ Staff TIDAK bisa edit
- ❌ Staff TIDAK bisa delete

### Dengan FULL_ACCESS:
- ✅ Staff bisa LIHAT folder
- ✅ Staff bisa DOWNLOAD files
- ✅ Staff bisa UPLOAD ke folder
- ✅ Staff bisa EDIT/RENAME files
- ✅ Staff bisa DELETE files

## Future Enhancements (Recommended)
1. **Staff Selection in Create Folder** - Implementasi penuh untuk memberikan Full Access langsung saat buat folder
2. **Permission Inheritance** - Subfolder otomatis inherit permission dari parent
3. **Permission History** - Log siapa yang memberikan Full Access dan kapan
4. **Bulk Permission Management** - Kelola permission untuk multiple folders sekaligus
5. **Permission Templates** - Buat template Full Access yang bisa digunakan ulang
6. **Activity Log** - Track apa yang dilakukan staff dengan Full Access

## Testing Checklist
- [ ] Three-dot menu muncul saat hover folder
- [ ] Permission modal terbuka dengan benar
- [ ] Staff list loading dengan sempurna
- [ ] Semua staff default ditampilkan sebagai View Only
- [ ] Toggle switch bekerja (VIEW_ONLY ↔ FULL_ACCESS)
- [ ] Counter Full Access update real-time
- [ ] Toast notifications muncul untuk setiap action
- [ ] Modal close dengan ESC atau click outside
- [ ] No console errors
- [ ] Permission record ter-insert/delete di database dengan benar

## Files Modified/Created
**Created:**
- `app/components/archive/FolderPermissionsModal.tsx` - Modal untuk manage Full Access
- `app/api/users/staff/route.ts` - API untuk fetch staff list

**Modified:**
- `app/dashboard/officer/arsip/page.tsx` - Added three-dot menu, permission modal, state management

## Dependencies Used
- ✅ `motion/react` (Framer Motion)
- ✅ `react-hot-toast`
- ✅ `lucide-react` (MoreVertical, User, Shield, Eye icons)
- ✅ Prisma Client
- ✅ Next.js 14 App Router
