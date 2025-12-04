-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 28, 2025 at 01:51 AM
-- Server version: 8.0.30
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `e-learn`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `buat_presensi_sesi` (IN `p_kode_mk` VARCHAR(20), IN `p_tanggal` DATE, IN `p_pertemuan_ke` TINYINT)   BEGIN
  DECLARE v_id_kelas INT;

  -- Ambil kelas dari mata_kuliah
  SELECT id_kelas INTO v_id_kelas FROM mata_kuliah WHERE kode_mk = p_kode_mk LIMIT 1;

  IF v_id_kelas IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mata kuliah / kelas tidak ditemukan';
  END IF;

  -- Insert presensi untuk tiap mahasiswa di kelas jika belum ada untuk tanggal tersebut
  INSERT IGNORE INTO presensi (id_mahasiswa, kode_mk, tanggal, pertemuan_ke, status)
  SELECT m.id_mahasiswa, p_kode_mk, p_tanggal, p_pertemuan_ke, 'Alfa'
  FROM mahasiswa m
  WHERE m.id_kelas = v_id_kelas;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `dosen`
--

CREATE TABLE `dosen` (
  `id_dosen` int NOT NULL,
  `user_id` int NOT NULL,
  `nip` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_dosen` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_dosen` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_lahir` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agama` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dosen`
--

INSERT INTO `dosen` (`id_dosen`, `user_id`, `nip`, `nama_dosen`, `email_dosen`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `alamat`, `no_hp`, `created_at`, `updated_at`) VALUES
(1, 2, '197801011999031001', 'Dr. Ahmad Wijaya, M.Kom', 'ahmad.wijaya@elearn.com', 'Jakarta', '1978-01-01', 'L', 'Islam', 'Jl. Pendidikan No. 10, Jakarta', '081234567890', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 3, '198505152010122001', 'Siti Nurhaliza, S.Kom, M.T', 'siti.nurhaliza@elearn.com', 'Bandung', '1985-05-15', 'P', 'Islam', 'Jl. Teknologi No. 25, Bandung', '081298765432', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 9, 'b3b3k4040', 'BebekDosen', 'bebekd@gmail.com', '', '2000-01-01', 'L', '', '', '', '2025-11-27 15:31:22', '2025-11-27 15:31:30');

-- --------------------------------------------------------

--
-- Table structure for table `face_registrations`
--

CREATE TABLE `face_registrations` (
  `id_registration` int NOT NULL,
  `nim` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `embedding_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Filename of .pkl file in embeddings folder',
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_verified` timestamp NULL DEFAULT NULL COMMENT 'Last successful face verification',
  `verification_count` int DEFAULT '0' COMMENT 'Total number of successful verifications',
  `failed_attempts` int DEFAULT '0' COMMENT 'Number of failed verification attempts',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Can be set to false to disable face login',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `face_registrations`
--

INSERT INTO `face_registrations` (`id_registration`, `nim`, `embedding_filename`, `registration_date`, `last_verified`, `verification_count`, `failed_attempts`, `is_active`, `updated_at`) VALUES
(4, 'E41253310', 'mahasiswa_tif_1.pkl', '2025-11-20 16:19:58', '2025-11-27 14:19:58', 25, 0, 1, '2025-11-27 16:19:58'),
(5, 'E41253311', 'mahasiswa_tif_2.pkl', '2025-11-22 16:19:58', '2025-11-27 11:19:58', 18, 0, 1, '2025-11-27 16:19:58'),
(6, 'E51253310', 'mahasiswa_mif_1.pkl', '2025-11-24 16:19:58', '2025-11-26 16:19:58', 12, 2, 1, '2025-11-27 16:19:58');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kuliah`
--

CREATE TABLE `jadwal_kuliah` (
  `id_jadwal` int NOT NULL,
  `id_kelas_mk` int NOT NULL,
  `hari` enum('Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam_mulai` time DEFAULT NULL,
  `jam_selesai` time DEFAULT NULL,
  `ruangan` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_kuliah`
--

INSERT INTO `jadwal_kuliah` (`id_jadwal`, `id_kelas_mk`, `hari`, `jam_mulai`, `jam_selesai`, `ruangan`, `created_at`, `updated_at`) VALUES
(1, 1, 'Senin', '08:00:00', '09:40:00', 'R-201', '2025-11-27 12:50:14', '2025-11-27 12:50:27'),
(2, 2, 'Senin', '10:00:00', '11:40:00', 'R-202', '2025-11-27 12:50:14', '2025-11-27 12:50:27'),
(3, 3, 'Selasa', '08:00:00', '09:40:00', 'Lab-1', '2025-11-27 12:50:14', '2025-11-27 12:50:27');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kuliah_backup`
--

CREATE TABLE `jadwal_kuliah_backup` (
  `id_jadwal` int NOT NULL DEFAULT '0',
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dosen` int NOT NULL,
  `id_kelas` int NOT NULL,
  `hari` enum('Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruangan` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_kuliah_backup`
--

INSERT INTO `jadwal_kuliah_backup` (`id_jadwal`, `kode_mk`, `id_dosen`, `id_kelas`, `hari`, `jam`, `ruangan`, `created_at`, `updated_at`) VALUES
(1, 'BD001', 1, 1, 'Senin', '08:00-09:40', 'R-201', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 'BS001', 1, 2, 'Senin', '10:00-11:40', 'R-202', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 'TK001', 2, 3, 'Selasa', '08:00-09:40', 'Lab-1', '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `id_kelas` int NOT NULL,
  `nama_kelas` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prodi` enum('TIF','MIF','TKK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun_angkatan` year DEFAULT NULL,
  `golongan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kelas`
--

INSERT INTO `kelas` (`id_kelas`, `nama_kelas`, `prodi`, `tahun_angkatan`, `golongan`, `created_at`, `updated_at`) VALUES
(1, 'TIF-2023-A', 'TIF', 2023, 'A', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 'MIF-2022-B', 'MIF', 2022, 'B', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 'TKK-2023-A', 'TKK', 2023, 'A', '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `kelas_mata_kuliah`
--

CREATE TABLE `kelas_mata_kuliah` (
  `id_kelas_mk` int NOT NULL,
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int NOT NULL,
  `id_dosen` int NOT NULL,
  `tahun_ajaran` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2024/2025',
  `semester_aktif` enum('Ganjil','Genap') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Ganjil',
  `status` enum('Aktif','Selesai','Batal') COLLATE utf8mb4_unicode_ci DEFAULT 'Aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kelas_mata_kuliah`
--

INSERT INTO `kelas_mata_kuliah` (`id_kelas_mk`, `kode_mk`, `id_kelas`, `id_dosen`, `tahun_ajaran`, `semester_aktif`, `status`, `created_at`, `updated_at`) VALUES
(1, 'BD001', 1, 1, '2024/2025', 'Ganjil', 'Aktif', '2025-11-27 12:50:27', '2025-11-27 12:50:27'),
(2, 'BS001', 2, 1, '2024/2025', 'Ganjil', 'Aktif', '2025-11-27 12:50:27', '2025-11-27 12:50:27'),
(3, 'TK001', 3, 2, '2024/2025', 'Ganjil', 'Aktif', '2025-11-27 12:50:27', '2025-11-27 12:50:27'),
(4, 'BD001', 2, 3, '2025/2026', 'Ganjil', 'Aktif', '2025-11-27 15:52:02', '2025-11-27 15:52:02'),
(6, 'BD001', 1, 2, '2025/2026', 'Ganjil', 'Aktif', '2025-11-27 16:36:07', '2025-11-27 16:37:28');

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa`
--

CREATE TABLE `mahasiswa` (
  `id_mahasiswa` int NOT NULL,
  `user_id` int NOT NULL,
  `nim` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int DEFAULT NULL,
  `tempat_lahir` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agama` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_mahasiswa` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mahasiswa`
--

INSERT INTO `mahasiswa` (`id_mahasiswa`, `user_id`, `nim`, `nama`, `id_kelas`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `alamat`, `no_hp`, `email_mahasiswa`, `created_at`, `updated_at`) VALUES
(1, 4, 'E41253310', 'Mahasiswa TIF 1', 1, 'Surabaya', '2005-03-10', 'L', 'Islam', 'Jl. Mahasiswa No. 1, Surabaya', '082111111111', 'mhs1@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 5, 'E41253311', 'Mahasiswa TIF 2', 1, 'Surabaya', '2005-05-20', 'P', 'Islam', 'Jl. Mahasiswa No. 2, Surabaya', '082122222222', 'mhs2@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 6, 'E51253310', 'Mahasiswa MIF 1', 2, 'Malang', '2004-07-15', 'L', 'Islam', 'Jl. Mahasiswa No. 3, Malang', '082133333333', 'mhs3@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(4, 7, 'E51253311', 'Mahasiswa MIF 2', 2, 'Malang', '2004-09-25', 'P', 'Kristen', 'Jl. Mahasiswa No. 4, Malang', '082144444444', 'mhs4@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(5, 8, 'E61253310', 'Mahasiswa TKK 1', 3, 'Gresik', '2005-01-18', 'L', 'Islam', 'Jl. Mahasiswa No. 5, Gresik', '082155555555', 'mhs5@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `mata_kuliah`
--

CREATE TABLE `mata_kuliah` (
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_mk` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sks` tinyint DEFAULT NULL,
  `semester` tinyint DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mata_kuliah`
--

INSERT INTO `mata_kuliah` (`kode_mk`, `nama_mk`, `sks`, `semester`, `deskripsi`, `created_at`, `updated_at`) VALUES
('BD001', 'Basis Data', 3, 3, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('BS001', 'Bisnis', 2, 4, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('TK001', 'Teknik Komputasi', 3, 5, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `mata_kuliah_backup`
--

CREATE TABLE `mata_kuliah_backup` (
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_mk` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dosen` int DEFAULT NULL,
  `sks` tinyint DEFAULT NULL,
  `semester` tinyint DEFAULT NULL,
  `id_kelas` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mata_kuliah_backup`
--

INSERT INTO `mata_kuliah_backup` (`kode_mk`, `nama_mk`, `id_dosen`, `sks`, `semester`, `id_kelas`, `created_at`, `updated_at`) VALUES
('BD001', 'Basis Data', 1, 3, 3, 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('BS001', 'Bisnis', 1, 2, 4, 2, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('TK001', 'Teknik Komputasi', 2, 3, 5, 3, '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `materi`
--

CREATE TABLE `materi` (
  `id_materi` int NOT NULL,
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `file_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL COMMENT 'id_dosen who uploaded this materi',
  `tanggal_upload` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materi`
--

INSERT INTO `materi` (`id_materi`, `kode_mk`, `id_kelas`, `minggu`, `judul`, `deskripsi`, `file_pdf`, `uploaded_by`, `tanggal_upload`) VALUES
(1, 'BD001', 1, 1, 'Pengenalan Basis Data', 'Materi pengenalan konsep basis data relasional', 'BD001_minggu1_intro.pdf', 1, '2025-11-13 18:12:11'),
(2, 'BD001', 1, 2, 'Normalisasi Database', 'Konsep normalisasi untuk efisiensi database', 'BD001_minggu2_normalisasi.pdf', 1, '2025-11-13 18:31:29'),
(5, 'BD001', 2, 1, 'coba', 'ini coba', 'km4_minggu1_19a9bf6b2a0649318ece0992916930cb.pdf', 3, '2025-11-27 15:53:01'),
(6, 'BD001', 1, 4, 'testing', 'testing2dosen', 'BD001_kelas1_minggu4_a0e8fd41b526413fa189b52df695eafe.pdf', 1, '2025-11-27 16:39:16'),
(7, 'BD001', 1, 4, 'siti yg upload', 'ini siti', 'BD001_kelas1_minggu4_889c8b87cd1547a5a48ba952cb1e06ac.pdf', 2, '2025-11-27 16:40:53'),
(8, 'BD001', 1, 3, 'contoh admad1', 'ini ahmad', 'BD001_kelas1_minggu3_13c230ff1bfb44a787221c7d0086b21c.pdf', 1, '2025-11-27 16:47:22');

-- --------------------------------------------------------

--
-- Table structure for table `materi_backup`
--

CREATE TABLE `materi_backup` (
  `id_materi` int NOT NULL DEFAULT '0',
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `file_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_upload` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materi_backup`
--

INSERT INTO `materi_backup` (`id_materi`, `kode_mk`, `minggu`, `judul`, `deskripsi`, `file_pdf`, `tanggal_upload`) VALUES
(1, 'BD001', 1, 'Pengenalan Basis Data', 'Materi pengenalan konsep basis data relasional', 'BD001_minggu1_intro.pdf', '2025-11-13 18:12:11'),
(2, 'BD001', 2, 'Normalisasi Database', 'Konsep normalisasi untuk efisiensi database', 'BD001_minggu2_normalisasi.pdf', '2025-11-13 18:31:29'),
(3, 'BD001', 3, 'SQL Lanjutan', 'Query SQL tingkat lanjut dengan JOIN', 'BD001_minggu3_sql_advanced.pdf', '2025-11-25 08:33:46');

-- --------------------------------------------------------

--
-- Table structure for table `materi_backup_20251127`
--

CREATE TABLE `materi_backup_20251127` (
  `id_materi` int NOT NULL DEFAULT '0',
  `id_kelas_mk` int NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `file_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_upload` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materi_backup_20251127`
--

INSERT INTO `materi_backup_20251127` (`id_materi`, `id_kelas_mk`, `minggu`, `judul`, `deskripsi`, `file_pdf`, `tanggal_upload`) VALUES
(1, 1, 1, 'Pengenalan Basis Data', 'Materi pengenalan konsep basis data relasional', 'BD001_minggu1_intro.pdf', '2025-11-13 18:12:11'),
(2, 1, 2, 'Normalisasi Database', 'Konsep normalisasi untuk efisiensi database', 'BD001_minggu2_normalisasi.pdf', '2025-11-13 18:31:29'),
(3, 1, 3, 'SQL Lanjutan', 'Query SQL tingkat lanjut dengan JOIN', 'BD001_minggu3_sql_advanced.pdf', '2025-11-25 08:33:46'),
(5, 4, 1, 'coba', 'ini coba', 'km4_minggu1_19a9bf6b2a0649318ece0992916930cb.pdf', '2025-11-27 15:53:01');

-- --------------------------------------------------------

--
-- Table structure for table `presensi`
--

CREATE TABLE `presensi` (
  `id_presensi` int NOT NULL,
  `id_mahasiswa` int NOT NULL,
  `id_kelas_mk` int NOT NULL,
  `tanggal` date NOT NULL,
  `pertemuan_ke` tinyint NOT NULL,
  `waktu_mulai` time DEFAULT NULL,
  `waktu_selesai` time DEFAULT NULL,
  `status` enum('Hadir','Belum Absen','Alfa') COLLATE utf8mb4_unicode_ci DEFAULT 'Belum Absen',
  `waktu_input` datetime DEFAULT NULL,
  `keterangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by_face` tinyint(1) DEFAULT '0' COMMENT 'True if verified via face recognition',
  `face_match_confidence` decimal(5,2) DEFAULT NULL COMMENT 'Match confidence score 0-100 from face API',
  `verification_photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to photo taken during verification',
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Android device model/OS info',
  `app_version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mobile app version used'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `presensi`
--

INSERT INTO `presensi` (`id_presensi`, `id_mahasiswa`, `id_kelas_mk`, `tanggal`, `pertemuan_ke`, `waktu_mulai`, `waktu_selesai`, `status`, `waktu_input`, `keterangan`, `verified_by_face`, `face_match_confidence`, `verification_photo_path`, `device_info`, `app_version`) VALUES
(1, 1, 1, '2025-11-25', 1, '13:38:00', '14:38:00', 'Hadir', '2025-11-25 13:40:00', NULL, 1, '95.50', 'uploads/face_verification/E41253310_20250127_080000.jpg', 'Samsung Galaxy S21 (Android 13)', '1.0.5'),
(2, 2, 1, '2025-11-25', 1, '13:38:00', '14:38:00', 'Hadir', '2025-11-25 13:42:00', NULL, 1, '89.75', 'uploads/face_verification/E41253311_20250127_080015.jpg', 'Xiaomi Redmi Note 10 (Android 12)', '1.0.5'),
(3, 1, 1, '2025-11-25', 2, '15:35:00', '16:35:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(4, 2, 1, '2025-11-25', 2, '15:35:00', '16:35:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `presensi_backup`
--

CREATE TABLE `presensi_backup` (
  `id_presensi` int NOT NULL DEFAULT '0',
  `id_mahasiswa` int NOT NULL,
  `kode_mk` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `pertemuan_ke` tinyint NOT NULL,
  `waktu_mulai` time DEFAULT NULL,
  `waktu_selesai` time DEFAULT NULL,
  `status` enum('Hadir','Belum Absen','Alfa') COLLATE utf8mb4_unicode_ci DEFAULT 'Belum Absen',
  `waktu_input` datetime DEFAULT NULL,
  `keterangan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `presensi_backup`
--

INSERT INTO `presensi_backup` (`id_presensi`, `id_mahasiswa`, `kode_mk`, `tanggal`, `pertemuan_ke`, `waktu_mulai`, `waktu_selesai`, `status`, `waktu_input`, `keterangan`) VALUES
(1, 1, 'BD001', '2025-11-25', 1, '13:38:00', '14:38:00', 'Hadir', '2025-11-25 13:40:00', NULL),
(2, 2, 'BD001', '2025-11-25', 1, '13:38:00', '14:38:00', 'Hadir', '2025-11-25 13:42:00', NULL),
(3, 1, 'BD001', '2025-11-25', 2, '15:35:00', '16:35:00', 'Alfa', NULL, NULL),
(4, 2, 'BD001', '2025-11-25', 2, '15:35:00', '16:35:00', 'Alfa', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','mahasiswa') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mahasiswa',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `username`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'superadmin', 'superadmin@elearn.com', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'super_admin', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 'ahmad.dosen', 'ahmad.wijaya@elearn.com', '$2b$12$J8PhBw/u53lx0BbvbMLyIu2yilwxOziUOAn3FxsfSTnqHHxpB2x5i', 'admin', 1, '2025-11-27 12:50:14', '2025-11-27 15:54:06'),
(3, 'siti.dosen', 'siti.nurhaliza@elearn.com', '$2b$12$Dz440.Tuh1QQN3i19AoFZezSFhSaLAUgb9sy2F/Ha.teNlH.wTPty', 'admin', 1, '2025-11-27 12:50:14', '2025-11-27 15:54:16'),
(4, 'mhs_tif_1', 'mhs1@kampus.ac.id', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'mahasiswa', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(5, 'mhs_tif_2', 'mhs2@kampus.ac.id', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'mahasiswa', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(6, 'mhs_mif_1', 'mhs3@kampus.ac.id', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'mahasiswa', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(7, 'mhs_mif_2', 'mhs4@kampus.ac.id', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'mahasiswa', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(8, 'mhs_tkk_1', 'mhs5@kampus.ac.id', '$2b$12$G5WdX2hCesBHLw0bkHbLB.lnKM3.HRF6/Mu10UQs9i2lNJVCGUwVO', 'mahasiswa', 1, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(9, 'BebekDosen', 'bebekd@gmail.com', '$2b$12$5CbaWkyi.dLX9ErwXKMOJuu2q/rCjO/Zq4v1tHbiMbE02oH26LCtS', 'admin', 1, '2025-11-27 15:31:22', '2025-11-27 15:31:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dosen`
--
ALTER TABLE `dosen`
  ADD PRIMARY KEY (`id_dosen`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nip` (`nip`);

--
-- Indexes for table `face_registrations`
--
ALTER TABLE `face_registrations`
  ADD PRIMARY KEY (`id_registration`),
  ADD UNIQUE KEY `nim` (`nim`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_nim` (`nim`);

--
-- Indexes for table `jadwal_kuliah`
--
ALTER TABLE `jadwal_kuliah`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD KEY `fk_jadwal_kelas_mk` (`id_kelas_mk`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id_kelas`);

--
-- Indexes for table `kelas_mata_kuliah`
--
ALTER TABLE `kelas_mata_kuliah`
  ADD PRIMARY KEY (`id_kelas_mk`),
  ADD UNIQUE KEY `unique_offering` (`kode_mk`,`id_kelas`,`tahun_ajaran`,`semester_aktif`),
  ADD KEY `id_kelas` (`id_kelas`),
  ADD KEY `id_dosen` (`id_dosen`);

--
-- Indexes for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD PRIMARY KEY (`id_mahasiswa`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nim` (`nim`),
  ADD KEY `id_kelas` (`id_kelas`);

--
-- Indexes for table `mata_kuliah`
--
ALTER TABLE `mata_kuliah`
  ADD PRIMARY KEY (`kode_mk`);

--
-- Indexes for table `materi`
--
ALTER TABLE `materi`
  ADD PRIMARY KEY (`id_materi`),
  ADD KEY `idx_mk_kelas` (`kode_mk`,`id_kelas`),
  ADD KEY `idx_mk_kelas_minggu` (`kode_mk`,`id_kelas`,`minggu`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`),
  ADD KEY `fk_materi_kelas` (`id_kelas`);

--
-- Indexes for table `presensi`
--
ALTER TABLE `presensi`
  ADD PRIMARY KEY (`id_presensi`),
  ADD UNIQUE KEY `unique_presensi_v2` (`id_mahasiswa`,`id_kelas_mk`,`tanggal`,`pertemuan_ke`),
  ADD KEY `fk_presensi_kelas_mk` (`id_kelas_mk`),
  ADD KEY `idx_face_verified` (`verified_by_face`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dosen`
--
ALTER TABLE `dosen`
  MODIFY `id_dosen` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `face_registrations`
--
ALTER TABLE `face_registrations`
  MODIFY `id_registration` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `jadwal_kuliah`
--
ALTER TABLE `jadwal_kuliah`
  MODIFY `id_jadwal` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id_kelas` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `kelas_mata_kuliah`
--
ALTER TABLE `kelas_mata_kuliah`
  MODIFY `id_kelas_mk` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  MODIFY `id_mahasiswa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `materi`
--
ALTER TABLE `materi`
  MODIFY `id_materi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `presensi`
--
ALTER TABLE `presensi`
  MODIFY `id_presensi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dosen`
--
ALTER TABLE `dosen`
  ADD CONSTRAINT `dosen_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `face_registrations`
--
ALTER TABLE `face_registrations`
  ADD CONSTRAINT `face_registrations_ibfk_1` FOREIGN KEY (`nim`) REFERENCES `mahasiswa` (`nim`) ON DELETE CASCADE;

--
-- Constraints for table `kelas_mata_kuliah`
--
ALTER TABLE `kelas_mata_kuliah`
  ADD CONSTRAINT `kelas_mata_kuliah_ibfk_1` FOREIGN KEY (`kode_mk`) REFERENCES `mata_kuliah` (`kode_mk`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kelas_mata_kuliah_ibfk_2` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kelas_mata_kuliah_ibfk_3` FOREIGN KEY (`id_dosen`) REFERENCES `dosen` (`id_dosen`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD CONSTRAINT `mahasiswa_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `mahasiswa_ibfk_2` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `materi`
--
ALTER TABLE `materi`
  ADD CONSTRAINT `fk_materi_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_materi_mata_kuliah` FOREIGN KEY (`kode_mk`) REFERENCES `mata_kuliah` (`kode_mk`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_materi_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `dosen` (`id_dosen`) ON DELETE SET NULL;

--
-- Constraints for table `presensi`
--
ALTER TABLE `presensi`
  ADD CONSTRAINT `presensi_ibfk_1` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa` (`id_mahasiswa`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
