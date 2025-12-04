# Elearn Mobile (Pengalaman Mahasiswa)

Elearn Mobile adalah aplikasi Android berbasis React Native yang menghubungkan mahasiswa dengan layanan kampus sehari-hari: login dengan NIM, presensi otomatis berbasis face recognition, akses materi pembelajaran, informasi resmi, jadwal kuliah, dan riwayat kehadiran. Seluruh tampilan dirancang agar mahasiswa umum yang bukan background IT bisa langsung memahami langkah-langkahnya.

## Fitur Utama dari Sisi Pengguna

- **Login satu akun**: Masuk dengan NIM dan password kampus. Sistem memberi tahu jika data tidak lengkap, menyimpan sesi, dan memeriksa apakah Anda sudah memiliki registrasi wajah.
- **Pelatihan face recognition (FaceCapture)**: Jika belum ada face embedding, aplikasi mengarahkan ke kamera depan dengan hitungan mundur, batas dan instruksi jelas, lalu mengunggah foto ke server untuk mengaktifkan presensi otomatis.
- **Beranda yang ringkas**: Panel utama menampilkan sapaan personal, rangkuman presensi hari ini, tombol cepat ke Informasi, Materi, dan Jadwal, serta preview dua materi terbaru. Tekan kartu presensi untuk langsung membuka kamera jika kelas sedang aktif.
- **Presensi berbasis kamera**: CameraScreen mendeteksi wajah secara manual atau otomatis setiap 5 detik, membandingkan dengan embedding Anda, memberi notifikasi jika cocok, lalu memanggil API untuk menandai kehadiran. Jika wajah tidak cocok, sistem meminta coba ulang.
- **Informasi resmi kampus**: InformasiList menampilkan daftar pengumuman dengan label prioritasi (Penting, Sedang, Info). Pilih satu kartu untuk baca detail lengkap dengan tanggal, gambar, dan deskripsi.
- **Materi kuliah dengan pelacakan mata**: Daftar Materi menampilkan materi per mata kuliah. Ketuk materi untuk membuka PDF lengkap (jika tersedia), kamera akan merekam durasi baca, fokus, gangguan, dan skor perhatian—atau otomatis simulasi ketika izin kamera tidak tersedia—sehingga dosen bisa memantau keterlibatan.
- **Jadwal harian**: Halaman Jadwal Kuliah memberi daftar terurut berdasarkan hari dan jam, memungkinkan filter per hari, dan menampilkan nama dosen, ruangan, dan kode MK dalam satu halaman.
- **Profil personal**: Lihat nama, NIM, kelas, email, serta foto profil. Ketuk foto untuk memperbarui embedding wajah (reset face capture). Tombol logout membersihkan sesi dan kembali ke login.
- **Riwayat presensi & statistik**: Halaman Presensi menampilkan statistik Hadir/Izin/Alfa dan daftar lengkap kehadiran dengan tanggal, status, waktu input, serta tombol refresh. Setiap status diberi warna agar mudah dibaca.
- **Navigasi cepat**: Ikon di bagian bawah (Beranda, Materi, Presensi, Profil) membuat akses antar fitur utama terasa seperti aplikasi jasa konsumen biasa.

## Alur Penggunaan yang Umum

1. **Login**: Masukkan NIM dan password. Bila face recognition belum aktif, segera jalankan FaceCapture untuk merekam wajah Anda.
2. **Beranda**: Lihat agenda presensi hari ini, notifikasi statis, dan navigasi cepat ke Informasi, Materi, atau Jadwal.
3. **Presensi**: Ketika dosen membuka sesi, tekan kartu yang muncul. CameraScreen akan memandu Anda menempatkan wajah di frame, mengenali secara manual/otomatis, lalu menandai kehadiran.
4. **Materi dan informasi**: Baca materi PDF lengkap dengan indikator waktu fokus, serta cek pengumuman terbaru beserta detail lengkapnya.
5. **Jadwal dan profil**: Lihat jadwal lengkap per hari dan perbarui foto profil atau logout melalui halaman Profil.
6. **Riwayat**: Cek statistik kumulatif dan daftar presensi untuk memantau catatan kehadiran.

## Catatan Teknis untuk Penanggung Jawab

- Aplikasi memakai API backend yang dikonfigurasi di `src/config/api.js` (default `http://10.97.85.147:8000`). Semua permintaan (login, jadwal, materi, informasi, face recognition, presensi) menggunakan token Bearer yang disimpan dengan `SessionManager`/`AsyncStorage`.
- Face detection memakai `react-native-vision-camera`, `CameraScreen` mengirim file ke endpoint `/face/recognize`, lalu memanggil `/presensi/update-status-face-recognition` dengan `id_presensi` dan `nim` untuk menandai hadir.
- FaceCapture menyimpan foto lokal sebelum upload, meminta izin kamera, menampilkan countdown, mengunggah ke `/face/register`, lalu mencatat embedding ke `/face-registration/register`.
- MateriEyeTracking memuat file PDF dari API `materi/file/{id}` dan merekam durasi serta skor fokus; jika tidak boleh akses kamera, ia beralih ke mode simulasi namun tetap menyimpan waktu belajar.
- Informasi menggunakan endpoint `/api/informasi/mobile/list` dan detail `/api/informasi/mobile/{id}` untuk menampilkan deskripsi, tanggal, gambar, dan periode informasi.

## Saran Penggunaan

- Pastikan izin kamera aktif untuk presensi dan materi agar fitur face recognition dan eye tracking berfungsi optimal.
- Periksa koneksi internet sebelum membuka materi atau informasi, karena sebagian file dimuat langsung dari server kampus.
- Gunakan tombol refresh (di Jadwal & Riwayat) saat mengalami penundaan data sehingga tampilan tidak menampilkan cache lama.
