````markdown
# Informasi Feature Documentation

## Overview

Fitur untuk mengelola informasi/pengumuman yang ditampilkan di mobile app. Admin dan Super Admin dapat membuat, mengedit, dan menghapus informasi. User (mahasiswa dan dosen) dapat melihat informasi yang aktif sesuai dengan role mereka.

## Database Schema

### Table: `informasi`

| Column            | Type         | Description                                           |
| ----------------- | ------------ | ----------------------------------------------------- |
| `id`              | SERIAL       | Primary key (auto-increment)                          |
| `judul`           | VARCHAR(255) | Judul informasi                                       |
| `deskripsi`       | TEXT         | Konten/deskripsi informasi                            |
| `gambar_url`      | VARCHAR(500) | URL gambar informasi (optional)                       |
| `is_active`       | BOOLEAN      | Status aktif (TRUE = ditampilkan)                     |
| `priority`        | INTEGER      | Prioritas tampil (0-100, lebih tinggi = lebih atas)   |
| `tanggal_mulai`   | TIMESTAMP    | Tanggal mulai ditampilkan (NULL = langsung tampil)    |
| `tanggal_selesai` | TIMESTAMP    | Tanggal berhenti ditampilkan (NULL = tidak ada batas) |
| `target_role`     | ENUM         | Target audience ('all', 'mahasiswa', 'dosen')         |
| `created_by`      | INTEGER      | User ID yang membuat (FK ke user.id)                  |
| `created_at`      | TIMESTAMP    | Timestamp pembuatan                                   |
| `updated_at`      | TIMESTAMP    | Timestamp update terakhir (auto-update via trigger)   |

### Indexes

- `idx_informasi_is_active` - untuk filter aktif/tidak aktif
- `idx_informasi_priority` - untuk sorting berdasarkan prioritas
- `idx_informasi_created_at` - untuk sorting berdasarkan tanggal
- `idx_informasi_target_role` - untuk filter berdasarkan role
- `idx_informasi_active_priority_created` - composite index untuk query list
- `idx_informasi_date_range` - composite index untuk filter tanggal

## API Endpoints

### Admin Routes (Super Admin & Admin Only)

#### 1. Create Informasi

```http
POST /api/informasi/
Authorization: Bearer <token>
Content-Type: application/json

{
  "judul": "Judul Informasi",
  "deskripsi": "Deskripsi lengkap informasi",
  "gambar_url": "/uploads/informasi/image.jpg",  // optional
  "priority": 90,  // 0-100, default: 0
  "tanggal_mulai": "2025-01-01T00:00:00",  // optional
  "tanggal_selesai": "2025-12-31T23:59:59",  // optional
  "target_role": "all"  // "all", "mahasiswa", or "dosen"
}
```

**Response:**

```json
{
  "id": 1,
  "judul": "Judul Informasi",
  "deskripsi": "Deskripsi lengkap informasi",
  "gambar_url": "/uploads/informasi/image.jpg",
  "is_active": true,
  "priority": 90,
  "tanggal_mulai": "2025-01-01T00:00:00",
  "tanggal_selesai": "2025-12-31T23:59:59",
  "target_role": "all",
  "created_by": 1,
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-15T10:30:00"
}
```

#### 2. Upload Gambar

```http
POST /api/informasi/upload-gambar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>  // max 5MB, .jpg, .jpeg, .png, .gif, .webp
```

**Response:**

```json
{
  "success": true,
  "url": "/uploads/informasi/abc123def456.jpg",
  "filename": "abc123def456.jpg"
}
```

#### 3. Get All Informasi (Admin)

```http
GET /api/informasi/admin/list?page=1&per_page=10&is_active=true&target_role=all&search=keyword
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (default: 1) - halaman
- `per_page` (default: 10) - jumlah per halaman
- `is_active` (optional) - filter aktif/tidak
- `target_role` (optional) - filter berdasarkan target role
- `search` (optional) - search judul atau deskripsi

**Response:**

```json
{
  "total": 50,
  "page": 1,
  "per_page": 10,
  "total_pages": 5,
  "items": [...]
}
```

#### 4. Get Informasi by ID (Admin)

```http
GET /api/informasi/admin/{informasi_id}
Authorization: Bearer <token>
```

#### 5. Update Informasi

```http
PUT /api/informasi/{informasi_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "judul": "Judul Updated",  // optional
  "deskripsi": "Deskripsi updated",  // optional
  "is_active": false,  // optional
  "priority": 80,  // optional
  // ... other fields optional
}
```

#### 6. Delete Informasi

```http
DELETE /api/informasi/{informasi_id}
Authorization: Bearer <token>
```

### Mobile App Routes (All Authenticated Users)

#### 1. Get Active Informasi List

```http
GET /api/informasi/mobile/list?limit=20
Authorization: Bearer <token>
```

**Features:**

- Hanya menampilkan informasi dengan `is_active = true`
- Filter berdasarkan `tanggal_mulai` dan `tanggal_selesai`
- Filter berdasarkan `target_role` sesuai role user
- Sorted by `priority DESC`, `created_at DESC`

**Response:**

```json
[
  {
    "id": 1,
    "judul": "Selamat Datang",
    "deskripsi": "Selamat datang di aplikasi E-Learning",
    "gambar_url": "/uploads/informasi/image.jpg",
    "priority": 100,
    "created_at": "2025-01-15T10:30:00"
  },
  ...
]
```

#### 2. Get Informasi Detail

```http
GET /api/informasi/mobile/{informasi_id}
Authorization: Bearer <token>
```

**Features:**

- Check target role authorization
- Hanya tampilkan jika `is_active = true`

## Installation & Setup

### 1. Run Migration (MySQL)

```bash
# Windows PowerShell
Get-Content "D:\REACT PROJEK KELOMPOK SEMESTERAN\Update Ihya\Backend_api\migrations\create_informasi_table.sql" | mysql -u root e-learn

# Or using cmd
mysql -u root e-learn < "D:\REACT PROJEK KELOMPOK SEMESTERAN\Update Ihya\Backend_api\migrations\create_informasi_table.sql"
```

### 2. Verify Installation

```sql
-- Check table
SELECT * FROM informasi;

-- Check indexes
SHOW INDEX FROM informasi;
```

### 3. Test Endpoints

Use Postman or curl to test:

```bash
# Create informasi (need admin token)
curl -X POST http://localhost:8000/api/informasi/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "judul": "Test Informasi",
    "deskripsi": "Testing API",
    "priority": 50,
    "target_role": "all"
  }'

# Get informasi list (mobile)
curl -X GET http://localhost:8000/api/informasi/mobile/list \
  -H "Authorization: Bearer <user_token>"
```

## Usage Examples

### Create Informasi with Image

```python
# 1. Upload image first
POST /api/informasi/upload-gambar
file: <image_file>

# Response: {"url": "/uploads/informasi/abc123.jpg"}

# 2. Create informasi with image URL
POST /api/informasi/
{
  "judul": "Libur Semester",
  "deskripsi": "Libur semester dimulai tanggal 20 Desember",
  "gambar_url": "/uploads/informasi/abc123.jpg",
  "priority": 90,
  "tanggal_mulai": "2025-12-01T00:00:00",
  "tanggal_selesai": "2026-01-05T23:59:59",
  "target_role": "all"
}
```

### Schedule Future Informasi

```json
{
  "judul": "Pendaftaran KRS",
  "deskripsi": "Pendaftaran KRS semester genap akan dibuka",
  "priority": 100,
  "tanggal_mulai": "2025-01-20T00:00:00", // Mulai tampil 20 Jan
  "tanggal_selesai": "2025-01-31T23:59:59", // Berhenti tampil 31 Jan
  "target_role": "mahasiswa"
}
```

### Target Specific Role

```json
{
  "judul": "Rapat Dosen",
  "deskripsi": "Rapat evaluasi semester di ruang rapat",
  "priority": 80,
  "target_role": "dosen" // Hanya dosen yang lihat
}
```

## Features

✅ **CRUD Operations** - Create, Read, Update, Delete informasi
✅ **Image Upload** - Upload dan manage gambar dengan validasi
✅ **Role-based Access** - Admin/Super Admin untuk manage, semua user untuk view
✅ **Priority System** - Sorting berdasarkan prioritas (0-100)
✅ **Scheduled Display** - Set tanggal mulai dan selesai tampil
✅ **Target Audience** - Filter berdasarkan role (all, mahasiswa, dosen)
✅ **Pagination** - List dengan pagination di admin panel
✅ **Search** - Search judul dan deskripsi
✅ **Soft Delete Ready** - Struktur mendukung is_active flag
✅ **Auto Timestamp** - Auto update `updated_at` via trigger

## Security

- ✅ **Authentication** - Semua endpoint require JWT token
- ✅ **Authorization** - Role-based access control
- ✅ **File Upload Validation** - Size limit (5MB), type validation
- ✅ **Input Validation** - Pydantic schemas dengan validation
- ✅ **SQL Injection Protection** - SQLAlchemy ORM
- ✅ **XSS Protection** - Input sanitization via Pydantic

## Mobile App Integration

### Android Implementation Example

```kotlin
// 1. Get informasi list
suspend fun getInformasiList(): List<Informasi> {
    val response = apiService.getInformasiList(
        token = "Bearer ${getToken()}",
        limit = 20
    )
    return response.body() ?: emptyList()
}

// 2. Display in RecyclerView
data class Informasi(
    val id: Int,
    val judul: String,
    val deskripsi: String,
    val gambar_url: String?,
    val priority: Int,
    val created_at: String
)

// 3. Show detail
suspend fun getInformasiDetail(id: Int): Informasi? {
    val response = apiService.getInformasiDetail(
        token = "Bearer ${getToken()}",
        id = id
    )
    return response.body()
}
```

### React Native Implementation Example

```javascript
// 1. Fetch informasi list
const fetchInformasi = async () => {
  const token = await AsyncStorage.getItem("token");
  const response = await fetch(
    "http://localhost:8000/api/informasi/mobile/list?limit=20",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

// 2. Display in FlatList
<FlatList
  data={informasiList}
  renderItem={({ item }) => (
    <InformasiCard
      title={item.judul}
      description={item.deskripsi}
      image={item.gambar_url}
      priority={item.priority}
    />
  )}
  keyExtractor={(item) => item.id.toString()}
/>;
```

## Troubleshooting

### Issue: Foreign key constraint fails

```sql
-- Error: FK constraint "fk_informasi_created_by" fails
-- Solution: Pastikan user dengan id yang digunakan ada di tabel user

-- Check user exists
SELECT id_user, username, role FROM users WHERE id_user = 1;
```

### Issue: Image upload fails

```
Error: File size exceeds 5MB limit
Solution: Compress image atau increase limit di routes
```

## Future Enhancements

- [ ] **Read Status Tracking** - Track mana user sudah baca informasi
- [ ] **Push Notifications** - Kirim notif saat informasi baru
- [ ] **Rich Text Editor** - Support HTML formatting di deskripsi
- [ ] **Multiple Images** - Support multiple images per informasi
- [ ] **Categories** - Kategorisasi informasi (akademik, event, etc)
- [ ] **Comments** - User bisa comment di informasi
- [ ] **Likes/Reactions** - User bisa kasih reaction
- [ ] **Analytics** - Track views, clicks, engagement

## License

Internal use only - E-Learning System
````
