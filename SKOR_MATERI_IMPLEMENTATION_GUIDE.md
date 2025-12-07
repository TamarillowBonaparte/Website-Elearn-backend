# 📊 Fitur Skor Materi - Eye Tracking Implementation Guide

## 🎯 Overview
Fitur **Skor Materi** memungkinkan dosen untuk melihat statistik dan detail performa mahasiswa dalam membaca materi pembelajaran. Sistem ini terintegrasi dengan eye-tracking pada aplikasi mobile untuk mengukur fokus dan perhatian mahasiswa.

---

## 🏗️ Arsitektur

### Database: Tabel `skor_materi`
```sql
CREATE TABLE `skor_materi` (
  `id_skor` int PRIMARY KEY AUTO_INCREMENT,
  `id_mahasiswa` int NOT NULL,
  `id_materi` int NOT NULL,
  `waktu_belajar` int DEFAULT 0,          -- Total waktu belajar (detik)
  `waktu_fokus` int DEFAULT 0,            -- Total waktu fokus (detik)
  `jumlah_gangguan` int DEFAULT 0,        -- Jumlah distraksi
  `skor_perhatian` int DEFAULT 0,         -- Skor 0-100
  `tracking_mode` ENUM('camera','simulated'),
  `session_start` timestamp DEFAULT CURRENT_TIMESTAMP,
  `session_end` timestamp NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`),
  FOREIGN KEY (`id_materi`) REFERENCES `materi`(`id_materi`) ON DELETE CASCADE
);
```

### Backend API Endpoints

#### 1. **GET /skor-materi/statistik/{id_materi}**
Mendapatkan statistik lengkap untuk materi tertentu.

**Response:**
```json
{
  "id_materi": 1,
  "judul_materi": "Pengenalan Basis Data",
  "total_mahasiswa_kelas": 25,
  "total_sudah_baca": 18,
  "total_belum_baca": 7,
  "rata_rata_skor": 85.5,
  "rata_rata_waktu_belajar": 1200,
  "rata_rata_fokus": 1080,
  "skor_tertinggi": 98,
  "skor_terendah": 65,
  "daftar_skor": [
    {
      "id_skor": 1,
      "id_mahasiswa": 1,
      "nim": "E41253310",
      "nama_mahasiswa": "Mahasiswa TIF 1",
      "skor_perhatian": 95,
      "waktu_belajar": 1500,
      "waktu_fokus": 1400,
      "jumlah_gangguan": 2,
      "tracking_mode": "camera",
      "session_start": "2025-12-03T10:30:00",
      "session_end": "2025-12-03T10:55:00"
    }
  ]
}
```

#### 2. **POST /skor-materi/**
Membuat record skor baru (dipanggil dari mobile app).

**Request Body:**
```json
{
  "id_mahasiswa": 1,
  "id_materi": 1,
  "waktu_belajar": 1200,
  "waktu_fokus": 1080,
  "jumlah_gangguan": 3,
  "skor_perhatian": 85,
  "tracking_mode": "camera"
}
```

#### 3. **GET /skor-materi/mahasiswa/{id_mahasiswa}**
Mendapatkan semua skor materi untuk mahasiswa tertentu.

#### 4. **PUT /skor-materi/{id_skor}**
Update skor materi (untuk update session_end).

#### 5. **DELETE /skor-materi/{id_skor}**
Hapus skor materi (untuk testing).

---

## 🎨 Frontend Implementation

### Lokasi Fitur
**File:** `src/pages/minggu.jsx`

### UI Components

#### 1. **Button "Lihat Skor"**
Ditambahkan pada setiap card materi yang sudah ter-expand:
```jsx
<button
  onClick={() => handleLihatSkor(materi)}
  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded text-xs"
>
  <BarChart3 className="h-3 w-3" />
  Lihat Skor Mahasiswa
</button>
```

#### 2. **Modal Statistik**
Modal full-screen dengan:
- **Header**: Judul materi
- **Summary Cards**: 5 kartu statistik
  - Total Mahasiswa
  - Sudah Membaca
  - Belum Membaca
  - Rata-rata Skor
  - Rata-rata Waktu
- **Tabel Detail**: List semua mahasiswa dengan skor lengkap
- **Keterangan**: Informasi tentang sistem eye-tracking

### State Management
```jsx
const [showSkorModal, setShowSkorModal] = useState(false);
const [skorData, setSkorData] = useState(null);
const [loadingSkor, setLoadingSkor] = useState(false);
```

### Helper Functions
```jsx
// Format waktu dari detik ke menit:detik
const formatWaktu = (detik) => {
  if (!detik) return '0:00';
  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;
  return `${menit}:${sisaDetik.toString().padStart(2, '0')}`;
};

// Fetch data skor
const handleLihatSkor = async (materiData) => {
  setLoadingSkor(true);
  setShowSkorModal(true);
  setSkorData(null);

  try {
    const data = await apiGet(`/skor-materi/statistik/${materiData.id_materi}`);
    setSkorData(data);
  } catch (error) {
    console.error("Error fetching skor:", error);
    showNotification('error', 'Gagal mengambil data skor');
    setShowSkorModal(false);
  } finally {
    setLoadingSkor(false);
  }
};
```

---

## 🎯 Fitur Utama

### 1. **Statistik Real-time**
- Total mahasiswa di kelas
- Jumlah yang sudah/belum membaca
- Rata-rata skor perhatian
- Rata-rata waktu belajar dan fokus
- Skor tertinggi dan terendah

### 2. **Detail Per Mahasiswa**
Tabel menampilkan:
- NIM & Nama Mahasiswa
- Skor Perhatian (0-100) dengan color coding:
  - 🟢 Hijau: Skor ≥ 80 (Excellent)
  - 🟡 Kuning: Skor 60-79 (Good)
  - 🔴 Merah: Skor < 60 (Needs Improvement)
- Waktu Belajar (format menit:detik)
- Waktu Fokus (format menit:detik)
- Jumlah Gangguan dengan badge:
  - 🟢 0 gangguan: Excellent
  - 🟡 1-3 gangguan: Good
  - 🔴 >3 gangguan: Needs Attention
- Mode Tracking (camera/simulated)

### 3. **Visual Indicators**
- Icon untuk setiap metrik
- Color-coded badges untuk skor
- Progress bars untuk kelengkapan
- Loading states dengan spinner

---

## 📱 Mobile App Integration (Future)

### Flow Mahasiswa:
1. Mahasiswa membuka materi di app
2. App meminta izin kamera untuk eye-tracking
3. Selama membaca, sistem track:
   - Total durasi belajar
   - Durasi fokus ke layar
   - Jumlah distraksi (mata lepas dari layar)
4. Saat selesai, app menghitung skor berdasarkan:
   ```
   Skor = (waktu_fokus / waktu_belajar) * 100 - (jumlah_gangguan * 2)
   ```
5. App POST ke `/skor-materi/` dengan data lengkap

### Fallback Mode:
- **Simulated Mode**: Jika kamera tidak tersedia
- Sistem tetap track waktu belajar tanpa eye-tracking
- Skor dihitung hanya dari durasi

---

## 🧪 Testing Guide

### 1. **Insert Data Testing**
```sql
-- Insert skor untuk testing
INSERT INTO skor_materi (id_mahasiswa, id_materi, waktu_belajar, waktu_fokus, jumlah_gangguan, skor_perhatian, tracking_mode)
VALUES 
(1, 1, 1200, 1080, 2, 88, 'camera'),
(2, 1, 1500, 1350, 1, 92, 'camera'),
(3, 1, 900, 720, 5, 72, 'camera');
```

### 2. **Test API dengan cURL**
```bash
# Get statistik
curl http://localhost:8000/skor-materi/statistik/1

# Create skor baru
curl -X POST http://localhost:8000/skor-materi/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_mahasiswa": 1,
    "id_materi": 1,
    "waktu_belajar": 1200,
    "waktu_fokus": 1080,
    "jumlah_gangguan": 2,
    "skor_perhatian": 88,
    "tracking_mode": "camera"
  }'
```

### 3. **Test Frontend**
1. Login sebagai dosen
2. Masuk ke halaman Materi
3. Pilih mata kuliah
4. Pilih minggu dengan materi
5. Expand materi card
6. Klik button "📊 Lihat Skor Mahasiswa"
7. Verifikasi modal muncul dengan data statistik

---

## 🔒 Security & Validation

### Backend Validasi:
- ✅ Mahasiswa harus terdaftar di kelas yang sama dengan materi
- ✅ Tidak boleh duplicate skor untuk mahasiswa + materi yang sama
- ✅ Skor perhatian harus 0-100
- ✅ Foreign key cascade delete (hapus materi = hapus skor)

### Frontend Protection:
- ✅ Hanya dosen yang bisa melihat skor
- ✅ Loading state untuk UX
- ✅ Error handling dengan notification
- ✅ Empty state jika belum ada data

---

## 📊 Interpretasi Skor

### Rentang Skor:
- **90-100**: Excellent (sangat fokus, minimal distraksi)
- **80-89**: Very Good (fokus baik, sedikit distraksi)
- **70-79**: Good (cukup fokus, beberapa distraksi)
- **60-69**: Fair (fokus kurang, banyak distraksi)
- **< 60**: Needs Improvement (sangat kurang fokus)

### Metrik Penting:
1. **Waktu Fokus vs Waktu Belajar**: 
   - Ideal: > 90% waktu belajar adalah fokus
   
2. **Jumlah Gangguan**:
   - Excellent: 0-2 kali
   - Good: 3-5 kali
   - High: > 5 kali

3. **Tracking Mode**:
   - Camera: Skor lebih akurat (real eye-tracking)
   - Simulated: Skor berdasarkan durasi saja

---

## 🚀 Deployment Checklist

- [x] Model database created
- [x] Backend API routes implemented
- [x] Schema validation added
- [x] Frontend UI implemented
- [x] Error handling added
- [x] Loading states added
- [ ] Mobile app integration (future)
- [ ] Export to Excel feature (future enhancement)
- [ ] Real-time updates (future enhancement)

---

## 🔮 Future Enhancements

1. **Export Data**
   - Export ke Excel/CSV
   - PDF Report per mahasiswa
   
2. **Advanced Analytics**
   - Grafik trend skor per mahasiswa
   - Perbandingan antar kelas
   - Heat map fokus mahasiswa
   
3. **Notifikasi**
   - Alert untuk mahasiswa dengan skor rendah
   - Reminder untuk mahasiswa belum membaca
   
4. **Gamifikasi**
   - Badge untuk skor tertinggi
   - Leaderboard per kelas
   - Achievement system

---

## 📞 Support

Untuk pertanyaan atau issue:
- Backend API: Check `/docs` untuk Swagger documentation
- Frontend: Check browser console untuk error details
- Database: Verify foreign keys dan constraints

**Status:** ✅ Ready for Testing (Backend + Frontend Complete)
