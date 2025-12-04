# Website Elearn (Dashboard Dosen & Admin)

Website Elearn adalah aplikasi web berbasis React + Vite yang berfungsi sebagai **dashboard untuk dosen dan super admin** dalam mengelola proses belajar-mengajar. Fokus utama website ini adalah pengelolaan presensi berbasis face recognition, materi kuliah, jadwal, informasi resmi, serta manajemen user (mahasiswa dan dosen). Penjelasan di bawah ditulis dengan bahasa yang mudah dipahami oleh pembaca umum, tanpa perlu latar belakang IT.

## Siapa Penggunanya?

- **Dosen**: Mengelola kelas yang diampu, membuat presensi, mengunggah materi, melihat statistik kehadiran.
- **Super Admin / Admin Prodi**: Mengatur data master (user, kelas, mata kuliah, jadwal), mengelola informasi kampus, dan memantau statistik global.

## Gambaran Alur Penggunaan

1. **Login ke sistem** menggunakan akun dosen/admin.
2. Setelah login, pengguna masuk ke **Dashboard** yang menampilkan ringkasan data penting (jumlah kelas, mahasiswa, materi, dan presensi terbaru).
3. Dari menu samping, pengguna dapat berpindah ke halaman **Presensi, Materi, Informasi, Jadwal Kuliah, User**, dan halaman lain sesuai peran.
4. Setiap halaman memiliki tombol aksi yang jelas seperti “Tambah”, “Edit”, “Hapus”, dan “Lihat Detail” untuk memudahkan pengelolaan.

## Fitur-Fitur Utama dari Sisi Pengguna

### 1. Login

- Halaman `Login` memungkinkan dosen/super admin masuk dengan **username** dan **password**.
- Jika kombinasi salah atau server tidak dapat diakses, sistem menampilkan pesan kesalahan yang mudah dipahami.
- Setelah login berhasil, **token** dan data pengguna disimpan di browser sehingga pengguna tidak perlu login berulang kali selama sesi masih aktif.

### 2. Dashboard Ringkasan

- Menampilkan **ringkasan angka penting** seperti:
  - Total kelas mata kuliah yang aktif.
  - Total mahasiswa.
  - Total materi yang sudah diunggah.
  - Jumlah presensi yang dibuat pada hari itu.
- Menampilkan tabel **“Presensi Terbaru”** (5 presensi terakhir) yang berisi:
  - Nama mata kuliah dan kelas.
  - Minggu/pertemuan ke berapa.
  - Tanggal pelaksanaan.
  - Jumlah hadir, alfa, dan persentase kehadiran dalam bentuk bar warna.
- Tujuannya agar dosen/super admin bisa **melihat kondisi terkini dengan cepat** tanpa perlu masuk ke tiap menu.

### 3. Manajemen Presensi

Halaman `Presensi` dipakai dosen untuk mengelola daftar presensi per pertemuan.

- **Generate Presensi Baru**:
  - Dosen memilih “Mata Kuliah & Kelas” yang diampu.
  - Mengisi minggu/pertemuan ke berapa, tanggal, jam mulai, dan jam selesai.
  - Sistem akan **membuat daftar presensi untuk seluruh mahasiswa** di kelas tersebut dengan status awal “Belum Hadir”.
  - Mahasiswa kemudian melakukan presensi melalui aplikasi mobile dengan face recognition.
- **Daftar Presensi yang Sudah Dibuat**:
  - Tabel menampilkan daftar semua presensi (mata kuliah, kelas, tanggal, pertemuan, rentang waktu).
  - Tersedia **filter** berdasarkan kelas mata kuliah dan minggu/pertemuan.
  - Dosen dapat menekan tombol **“Lihat Detail”** untuk membuka halaman rinci (status setiap mahasiswa).
  - Ada opsi **hapus presensi** dengan konfirmasi, jika presensi dibuat salah.

### 4. Manajemen Materi Kuliah

Halaman `Materi` membantu dosen memilih kelas mata kuliah untuk kemudian mengelola materi per-minggu.

- Menampilkan daftar **kelas mata kuliah yang diampu dosen**, lengkap dengan:
  - Nama mata kuliah dan kode MK.
  - Nama kelas dan program studi.
  - Tahun ajaran, semester, dan jumlah SKS.
- Dosen memilih satu kelas untuk masuk ke halaman detail minggu & materi (misalnya mengunggah PDF materi yang nantinya akan dibaca mahasiswa di aplikasi mobile dengan fitur eye-tracking).
- Sistem menonjolkan status “aktif” agar dosen tahu kelas mana yang sedang berjalan di semester ini.

### 5. Informasi Kampus (Super Admin)

Halaman `Informasi` dipakai **Super Admin** untuk menyebarkan pengumuman resmi ke dosen dan/atau mahasiswa.

- Menampilkan tabel daftar informasi berisi:
  - Judul informasi.
  - Potongan isi/penjelasan.
  - Nilai **priority** (seberapa penting).
  - Target penerima (semua, hanya mahasiswa, atau hanya dosen).
  - Status aktif/tidak aktif.
  - Waktu dibuat.
- Fitur yang tersedia:
  - **Tambah Informasi Baru** (isi judul, deskripsi, gambar opsional, prioritas, target penerima, periode aktif).
  - **Edit Informasi** jika ada salah penulisan atau perubahan konten.
  - **Hapus Informasi** dengan konfirmasi agar tidak salah hapus.
- Informasi yang aktif akan muncul di aplikasi mobile mahasiswa di menu Informasi.

### 6. Jadwal Kuliah Dosen

Halaman `Jadwal Kuliah` menampilkan dan (untuk Super Admin) mengelola jadwal perkuliahan.

- Dosen dapat melihat **jadwal kuliah lengkap** yang ia ampu:
  - Hari (Senin s/d Minggu).
  - Jam mulai dan jam selesai.
  - Ruangan.
  - Kelas dan mata kuliah terkait.
- Super Admin punya hak untuk:
  - **Tambah jadwal baru** (pilih kelas mata kuliah, hari, jam, ruangan).
  - **Edit** jadwal yang sudah ada jika ada perubahan ruangan atau jam.
  - **Hapus** jadwal yang tidak berlaku lagi.
- Pemberitahuan kesalahan tampil jelas jika terjadi masalah saat menyimpan atau menghapus.

### 7. Manajemen Pengguna (User)

Halaman `User` ditujukan untuk admin/super admin dalam mengelola akun dosen dan mahasiswa.

- Menampilkan daftar seluruh pengguna dengan informasi:
  - Nama lengkap.
  - Username.
  - Email.
  - Peran/role (Mahasiswa, Admin, Super Admin).
  - NIP (untuk dosen/admin) atau NIM dan kelas (untuk mahasiswa).
- Fitur yang tersedia:
  - **Tambah User Baru** dengan form yang memvalidasi isian wajib (nama, username, email, password, NIP/NIM, kelas untuk mahasiswa).
  - **Edit User** untuk memperbarui data profil atau memindahkan mahasiswa ke kelas lain.
  - **Hapus User** dengan dialog konfirmasi.
- Sistem juga mengecek masa berlaku token login dan menampilkan **peringatan** beberapa menit sebelum kadaluarsa, agar admin bisa login ulang tanpa terputus saat bekerja.

### 8. Halaman Lain (Profil, Detail, dsb.)

Selain halaman utama di atas, ada beberapa halaman pendukung seperti:

- **Detail Presensi**: Menampilkan daftar mahasiswa pada satu pertemuan lengkap dengan status Hadir/Alfa/Izin.
- **Detail Materi / Minggu**: Menampilkan daftar materi per minggu untuk satu kelas mata kuliah.
- **Profil Saya / Profil Dosen**: Menampilkan informasi profil dosen yang sedang login.

Semua halaman menggunakan desain yang konsisten: tabel yang rapi, tombol aksi di sisi kanan, dan warna yang menonjol untuk status penting (aktif/nonaktif, sukses/gagal, prioritas tinggi).

## Catatan Teknis Ringkas (Untuk Penanggung Jawab Teknis)

- Aplikasi dibangun dengan **React + Vite** dan **Tailwind CSS** untuk tampilan modern.
- Komunikasi dengan backend dilakukan melalui fungsi utilitas di `src/utils/apiUtils.js` atau langsung dengan `fetch/axios` ke API (contoh: `http://localhost:8000`).
- Data login disimpan menggunakan `localStorage` (`token`, `user`, `role`, `username`).
- Hak akses dibedakan berdasarkan `role` (mahasiswa, admin, super_admin) yang dikirim dari backend.

## Cara Menjalankan (Singkat)

Untuk tim teknis yang ingin menjalankan website ini secara lokal:

```bash
npm install
npm run dev
```

Pastikan backend FastAPI/servis API lain sudah berjalan pada alamat yang dikonfigurasi (umumnya `http://localhost:8000`).
