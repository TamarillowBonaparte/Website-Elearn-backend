# Presensi Edit Feature Implementation Guide

## 📋 Overview

Fitur edit status presensi yang memungkinkan admin dan super_admin untuk mengubah status kehadiran mahasiswa dengan alasan yang valid (banding, sakit, dll).

## ✨ Features

### Role-Based Access Control
- ✅ Hanya **admin** (dosen) dan **super_admin** yang dapat mengedit status presensi
- ✅ Mahasiswa tidak dapat melihat tombol edit
- ✅ Role check di frontend dan backend

### Edit Capabilities
- ✅ Ubah status: Hadir ↔️ Belum Absen ↔️ Alfa
- ✅ Wajib memberikan keterangan/alasan perubahan
- ✅ Keterangan tersimpan di database untuk audit trail
- ✅ Tampilkan keterangan di tabel detail presensi

### UI/UX
- ✅ Tombol "Edit" di setiap baris mahasiswa (hanya untuk admin/super_admin)
- ✅ Modal edit dengan form yang jelas
- ✅ Validasi keterangan wajib diisi
- ✅ Info mahasiswa ditampilkan di modal
- ✅ Warning message tentang audit trail
- ✅ Notifikasi sukses/error setelah update

## 🗄️ Database Schema

### Table: `presensi`

```sql
ALTER TABLE presensi ADD COLUMN keterangan VARCHAR(255) NULL;
```

**Column Details:**
- `keterangan` - VARCHAR(255), nullable
- Menyimpan alasan perubahan status oleh admin

**Note:** Column `keterangan` sudah ada di database, tidak perlu migrasi tambahan.

## 🔧 Backend Implementation

### New API Endpoint

**PUT** `/presensi/admin/update-status/{id_presensi}`

**Query Parameters:**
- `status` (required) - "Hadir" | "Belum Absen" | "Alfa"
- `keterangan` (optional) - String, alasan perubahan

**Response:**
```json
{
  "message": "Status presensi berhasil diupdate oleh admin",
  "data": {
    "id_presensi": 123,
    "nim": "2101001",
    "nama": "Andi Saputra",
    "old_status": "Alfa",
    "new_status": "Hadir",
    "keterangan": "Mahasiswa mengajukan banding dengan surat keterangan sakit",
    "waktu_input": "2024-01-15T10:30:00"
  }
}
```

**File Modified:**
- `Backend_api-main/app/routes/presensi_route.py` - Added `admin_update_status_presensi` function

### Schema Updates

**File Modified:**
- `Backend_api-main/app/schemas/presensi_schema.py`
  - Added `keterangan: Optional[str]` to `PresensiDetailResponse`

### Route Updates

**File Modified:**
- `Backend_api-main/app/routes/presensi_route.py`
  - Updated GET `/presensi/detail/{id_kelas_mk}/{tanggal}/{pertemuan_ke}` to include `keterangan` field in response

## 🎨 Frontend Implementation

### File Modified

**Website-Elearn-main-main/src/pages/detailPresensiAbsen.jsx**

### New State Variables

```jsx
const [showEditModal, setShowEditModal] = useState(false);
const [editingPresensi, setEditingPresensi] = useState(null);
const [editForm, setEditForm] = useState({
  status: "",
  keterangan: ""
});

const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const isAdminOrSuperAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
```

### New Functions

1. **handleEditStatus(mahasiswa)**
   - Opens edit modal
   - Sets current mahasiswa data
   - Pre-fills form with current status and keterangan

2. **handleSaveEditStatus()**
   - Validates keterangan is not empty
   - Calls PUT `/presensi/admin/update-status/{id_presensi}` API
   - Shows success/error notification
   - Reloads presensi data

3. **handleCancelEdit()**
   - Closes modal
   - Resets form state

### UI Components Added

#### 1. Table Header - Added Columns
```jsx
<th>Keterangan</th>
{isAdminOrSuperAdmin && <th>Aksi</th>}
```

#### 2. Table Body - Added Cells
```jsx
{/* Keterangan Cell */}
<td className="px-6 py-4 text-sm text-gray-600">
  {mahasiswa.keterangan ? (
    <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
      {mahasiswa.keterangan}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>

{/* Edit Button Cell (only for admin/super_admin) */}
{isAdminOrSuperAdmin && (
  <td className="px-6 py-4 whitespace-nowrap text-center">
    <button onClick={() => handleEditStatus(mahasiswa)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">
      <Edit2 className="h-3.5 w-3.5" /> Edit
    </button>
  </td>
)}
```

#### 3. Edit Modal
- **Header:** Title with Edit2 icon and close button
- **Mahasiswa Info Section:** Display NIM, Nama, and current status
- **Form Section:**
  - Status dropdown (Hadir, Belum Absen, Alfa)
  - Keterangan textarea (required)
- **Warning Box:** Audit trail notice
- **Action Buttons:** Cancel and Save buttons

### Icons Added

```jsx
import { Edit2, Save, X } from "lucide-react";
```

## 📝 Use Cases

### 1. Mahasiswa Mengajukan Banding
**Scenario:** Mahasiswa sakit tapi sudah terlambat untuk absen

**Steps:**
1. Admin membuka halaman detail presensi
2. Klik tombol "Edit" di baris mahasiswa yang bersangkutan
3. Ubah status dari "Alfa" ke "Hadir"
4. Isi keterangan: "Mahasiswa mengajukan banding dengan surat keterangan sakit dari RS. Surat diterima tanggal 15 Januari 2024"
5. Klik "Simpan"
6. Status berubah dan keterangan tersimpan

### 2. Kesalahan Sistem
**Scenario:** Mahasiswa sudah absen tapi sistem tidak tercatat

**Steps:**
1. Admin verifikasi data manual/rekaman kamera
2. Edit status dari "Belum Absen" ke "Hadir"
3. Keterangan: "Verified manually via CCTV recording. Student was present but face recognition failed."
4. Simpan perubahan

### 3. Mahasiswa Terlambat dengan Alasan Valid
**Scenario:** Mahasiswa terlambat karena kecelakaan di jalan

**Steps:**
1. Mahasiswa memberikan bukti (foto, berita, dll)
2. Admin edit status dari "Alfa" ke "Hadir"
3. Keterangan: "Terlambat karena kecelakaan di jalan raya. Bukti: foto lokasi kejadian dan berita online"
4. Simpan

## 🔒 Security & Validation

### Backend Validation
✅ Role check (hanya admin/super_admin)
✅ Presensi exists check
✅ Status enum validation ("Hadir", "Belum Absen", "Alfa")
✅ Mahasiswa data validation

### Frontend Validation
✅ Role-based UI rendering
✅ Keterangan required (tidak boleh kosong)
✅ Success/error handling
✅ Loading states

### Audit Trail
✅ Keterangan tersimpan di database
✅ Old status dan new status di-log di response
✅ Waktu update otomatis (waktu_input updated jika status → Hadir)

## 🧪 Testing Guide

### Test Case 1: Admin Edit Status Success
**Steps:**
1. Login sebagai admin/dosen
2. Buka halaman presensi → Lihat Detail
3. Klik tombol "Edit" pada mahasiswa dengan status "Alfa"
4. Ubah status ke "Hadir"
5. Isi keterangan: "Test banding mahasiswa"
6. Klik "Simpan"

**Expected Result:**
- ✅ Status berubah menjadi "Hadir"
- ✅ Keterangan muncul di kolom keterangan
- ✅ Notifikasi sukses muncul
- ✅ Modal tertutup
- ✅ Data ter-refresh

### Test Case 2: Validation - Keterangan Kosong
**Steps:**
1. Login sebagai admin
2. Klik "Edit" pada mahasiswa
3. Ubah status
4. Biarkan keterangan kosong
5. Klik "Simpan"

**Expected Result:**
- ❌ Notifikasi error: "Keterangan wajib diisi!"
- ❌ Form tidak submit
- ✅ Modal tetap terbuka

### Test Case 3: Role Check - Mahasiswa Cannot See Edit
**Steps:**
1. Login sebagai mahasiswa
2. Buka halaman presensi (jika ada akses)

**Expected Result:**
- ❌ Tombol "Edit" tidak terlihat
- ❌ Kolom "Aksi" tidak terlihat

### Test Case 4: Backend API Direct Call
**cURL Command:**
```bash
curl -X PUT "http://localhost:8000/presensi/admin/update-status/1?status=Hadir&keterangan=Test%20banding" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Status presensi berhasil diupdate oleh admin",
  "data": {
    "id_presensi": 1,
    "nim": "2101001",
    "nama": "Andi Saputra",
    "old_status": "Alfa",
    "new_status": "Hadir",
    "keterangan": "Test banding",
    "waktu_input": "2024-01-15T10:30:00"
  }
}
```

## 📊 Database Query Examples

### Get All Presensi with Keterangan
```sql
SELECT 
  p.id_presensi,
  m.nim,
  m.nama,
  p.status,
  p.keterangan,
  p.waktu_input
FROM presensi p
JOIN mahasiswa m ON p.id_mahasiswa = m.id_mahasiswa
WHERE p.keterangan IS NOT NULL
ORDER BY p.waktu_input DESC;
```

### Get Edit History (Presensi with Keterangan)
```sql
SELECT 
  p.id_presensi,
  m.nim,
  m.nama,
  p.status,
  p.keterangan,
  p.waktu_input,
  km.nama_mk,
  k.nama_kelas
FROM presensi p
JOIN mahasiswa m ON p.id_mahasiswa = m.id_mahasiswa
JOIN kelas_mata_kuliah km ON p.id_kelas_mk = km.id_kelas_mk
JOIN mata_kuliah mk ON km.kode_mk = mk.kode_mk
JOIN kelas k ON km.id_kelas = k.id_kelas
WHERE p.keterangan IS NOT NULL
ORDER BY p.waktu_input DESC
LIMIT 50;
```

## 🚀 Deployment Checklist

### Backend
- ✅ Verify `keterangan` column exists in `presensi` table
- ✅ Restart backend server to load new endpoint
- ✅ Test API endpoint with Postman/cURL
- ✅ Check logs for any errors

### Frontend
- ✅ Build frontend: `npm run build`
- ✅ Test in development: `npm run dev`
- ✅ Verify role-based rendering
- ✅ Test edit functionality with different roles

### Database
- ✅ No migration needed (column already exists)
- ✅ Verify column type: VARCHAR(255)

## 📸 Screenshots

### Before Implementation
- Table hanya memiliki kolom: No, NIM, Nama, Status, Waktu Absen, Verifikasi Foto

### After Implementation
- Table ditambah kolom: **Keterangan**, **Aksi** (untuk admin/super_admin)
- Tombol "Edit" muncul di kolom Aksi (hanya untuk admin/super_admin)
- Modal edit dengan form lengkap
- Keterangan ditampilkan di kolom keterangan

## 🎯 Future Enhancements

1. **Edit History Log Table**
   - Create separate table to track all edit history
   - Store: who edited, when, old value, new value, reason

2. **Bulk Edit**
   - Allow admin to edit multiple students at once
   - Useful for mass corrections (e.g., system error affected multiple students)

3. **Approval Workflow**
   - Mahasiswa can request status change
   - Admin receives notification and can approve/reject
   - Automated workflow with email notifications

4. **Export Audit Report**
   - Generate PDF report of all edited presensi
   - Filter by date range, mata kuliah, kelas
   - Include keterangan in report

5. **Notification to Student**
   - Send email/notification to student when status is changed
   - Include keterangan so student knows the reason

## 📞 Support

For issues or questions:
- Check backend logs: `Backend_api-main/logs/`
- Check browser console for frontend errors
- Verify token is valid and user has correct role
- Ensure backend server is running on port 8000

## 📝 Notes

- Keterangan maksimal 255 karakter
- Perubahan status akan mempengaruhi statistik kehadiran
- Waktu_input otomatis diupdate jika status berubah menjadi "Hadir"
- Modal menggunakan animasi fadeIn dan scaleIn untuk UX yang smooth
- Role check dilakukan di frontend (UI) dan backend (API) untuk keamanan
