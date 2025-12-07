-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 05, 2025 at 12:08 AM
-- Server version: 8.0.30
-- PHP Version: 8.3.13

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
  `nip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_dosen` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_dosen` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_lahir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agama` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `no_hp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dosen`
--

INSERT INTO `dosen` (`id_dosen`, `user_id`, `nip`, `nama_dosen`, `email_dosen`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `agama`, `alamat`, `no_hp`, `created_at`, `updated_at`) VALUES
(1, 2, '197801011999031001', 'Dr. Ahmad Wijaya, M.Kom', 'ahmad.wijaya@elearn.com', 'Jakartaa', '1978-01-01', 'L', 'Islam', 'Jl. Pendidikan No. 10, Jakarta', '081234567890', '2025-11-27 12:50:14', '2025-12-04 12:07:24'),
(2, 3, '198505152010122001', 'Siti Nurhaliza, S.Kom, M.T', 'siti.nurhaliza@elearn.com', 'Bandung', '1985-05-15', 'P', 'Islam', 'Jl. Teknologi No. 25, Bandung', '081298765432', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 9, 'b3b3k4040', 'BebekDosen', 'bebekd@gmail.com', '', '2000-01-01', 'L', '', '', '', '2025-11-27 15:31:22', '2025-11-27 15:31:30'),
(4, 15, '123123123', 'dosenbaru', 'dosen@gmail.com', '', '2000-01-01', 'P', '', '', '', '2025-12-04 11:04:35', '2025-12-04 12:17:53'),
(5, 16, '14324403909', 'Ihya Ulumuddin A.Md', 'ihya@gmail.com', '', '2000-01-01', 'L', 'Konghucu', '', '', '2025-12-04 12:37:35', '2025-12-04 12:46:34');

-- --------------------------------------------------------

--
-- Table structure for table `face_registrations`
--

CREATE TABLE `face_registrations` (
  `id_registration` int NOT NULL,
  `nim` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `embedding_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Filename of .pkl file in embeddings folder',
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `face_registrations`
--

INSERT INTO `face_registrations` (`id_registration`, `nim`, `embedding_filename`, `registration_date`, `updated_at`) VALUES
(8, 'E41253395', 'E41253395.pkl', '2025-11-30 07:37:53', '2025-11-30 07:37:53'),
(10, 'E41253336', 'E41253336.pkl', '2025-12-03 15:34:29', '2025-12-03 15:34:29'),
(12, 'E41253368', 'E41253368.pkl', '2025-12-04 10:44:15', '2025-12-04 10:44:15'),
(13, 'E41253319', 'E41253319.pkl', '2025-12-04 13:02:14', '2025-12-04 13:02:14'),
(14, 'E41253341', 'E41253341.pkl', '2025-12-04 13:05:14', '2025-12-04 13:05:14'),
(15, 'E41253329', 'E41253329.pkl', '2025-12-04 13:09:31', '2025-12-04 13:09:31'),
(16, 'E41253355', 'E41253355.pkl', '2025-12-04 13:11:48', '2025-12-04 13:11:48'),
(17, 'E41253394', 'E41253394.pkl', '2025-12-04 13:42:34', '2025-12-04 13:42:34');

-- --------------------------------------------------------

--
-- Table structure for table `informasi`
--

CREATE TABLE `informasi` (
  `id` int NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gambar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '0',
  `tanggal_mulai` datetime DEFAULT NULL COMMENT 'Kapan mulai ditampilkan (NULL = langsung)',
  `tanggal_selesai` datetime DEFAULT NULL COMMENT 'Kapan berhenti ditampilkan (NULL = tidak ada batas)',
  `target_role` enum('all','mahasiswa','dosen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `created_by` int NOT NULL COMMENT 'User ID yang membuat (admin/super_admin)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `informasi`
--

INSERT INTO `informasi` (`id`, `judul`, `deskripsi`, `gambar_url`, `is_active`, `priority`, `tanggal_mulai`, `tanggal_selesai`, `target_role`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Selamat Datang di E-Learning System', 'Selamat datang di platform e-learning kami. Silakan login untuk mengakses materi pembelajaran dan fitur presensi dengan face recognition.', NULL, 1, 100, NULL, NULL, 'all', 1, '2025-12-02 10:09:59', '2025-12-02 10:09:59'),
(2, 'Panduan Presensi Face Recognition', 'Untuk melakukan presensi, pastikan wajah Anda terlihat jelas di kamera. Sistem akan mendeteksi wajah Anda secara otomatis dan melakukan verifikasi dengan data yang terdaftar.', NULL, 1, 90, NULL, NULL, 'mahasiswa', 1, '2025-12-02 10:09:59', '2025-12-02 10:09:59'),
(3, 'Update: Fitur Berbagi Materi', 'Dosen sekarang dapat berbagi materi pembelajaran langsung di platform. Mahasiswa dapat mengakses materi yang dibagikan melalui menu Materi.', NULL, 1, 80, NULL, NULL, 'dosen', 1, '2025-12-02 10:09:59', '2025-12-02 10:09:59'),
(4, 'Judul Testing pengumuman', 'Testing deskripsi', NULL, 1, 90, '2025-12-02 18:32:00', '2025-12-03 18:32:00', 'all', 1, '2025-12-02 18:32:07', '2025-12-02 18:32:07'),
(7, 'Informasi Kelas Terbaru', 'Ada kelas baru yaitu PLJ TIF 2025 AB', NULL, 1, 99, '2025-12-04 19:41:00', '2025-12-05 19:41:00', 'all', 1, '2025-12-04 19:41:24', '2025-12-04 19:41:24');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kuliah`
--

CREATE TABLE `jadwal_kuliah` (
  `id_jadwal` int NOT NULL,
  `id_kelas_mk` int NOT NULL,
  `hari` enum('Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam_mulai` time DEFAULT NULL,
  `jam_selesai` time DEFAULT NULL,
  `ruangan` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_kuliah`
--

INSERT INTO `jadwal_kuliah` (`id_jadwal`, `id_kelas_mk`, `hari`, `jam_mulai`, `jam_selesai`, `ruangan`, `created_at`, `updated_at`) VALUES
(1, 1, 'Senin', '08:00:00', '09:40:00', 'R-201', '2025-11-27 12:50:14', '2025-11-27 12:50:27'),
(2, 2, 'Senin', '10:00:00', '11:40:00', 'R-202', '2025-11-27 12:50:14', '2025-11-27 12:50:27'),
(3, 3, 'Selasa', '08:00:00', '09:40:00', 'Lab-1', '2025-11-27 12:50:14', '2025-11-27 12:50:27'),
(5, 12, 'Kamis', '19:42:00', '22:42:00', 'Lab RSI', '2025-12-04 12:42:30', '2025-12-04 12:42:30');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_kuliah_backup`
--

CREATE TABLE `jadwal_kuliah_backup` (
  `id_jadwal` int NOT NULL DEFAULT '0',
  `kode_mk` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_dosen` int NOT NULL,
  `id_kelas` int NOT NULL,
  `hari` enum('Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jam` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruangan` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `nama_kelas` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prodi` enum('TIF','MIF','TKK') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun_angkatan` year DEFAULT NULL,
  `golongan` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kelas`
--

INSERT INTO `kelas` (`id_kelas`, `nama_kelas`, `prodi`, `tahun_angkatan`, `golongan`, `created_at`, `updated_at`) VALUES
(1, 'TIF-2023-A', 'TIF', '2023', 'A', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(2, 'MIF-2022-B', 'MIF', '2022', 'B', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(3, 'TKK-2023-A', 'TKK', '2023', 'A', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(5, 'PLJ-25-A', 'TIF', '2025', 'A', '2025-12-04 11:10:56', '2025-12-04 11:11:00'),
(6, 'PLJ-2025-BA', 'TIF', '2025', 'B', '2025-12-04 12:39:17', '2025-12-04 12:39:25');

-- --------------------------------------------------------

--
-- Table structure for table `kelas_mata_kuliah`
--

CREATE TABLE `kelas_mata_kuliah` (
  `id_kelas_mk` int NOT NULL,
  `kode_mk` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int NOT NULL,
  `id_dosen` int NOT NULL,
  `tahun_ajaran` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2024/2025',
  `semester_aktif` enum('Ganjil','Genap') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Ganjil',
  `status` enum('Aktif','Selesai','Batal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Aktif',
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
(6, 'BD001', 1, 2, '2025/2026', 'Ganjil', 'Aktif', '2025-11-27 16:36:07', '2025-11-27 16:37:28'),
(8, 'TK001', 1, 4, '2025/2026', 'Ganjil', 'Aktif', '2025-12-04 11:05:18', '2025-12-04 11:05:18'),
(11, 'ML001', 5, 1, '2025/2026', 'Ganjil', 'Aktif', '2025-12-04 12:11:19', '2025-12-04 12:11:19'),
(12, 'DL0001', 6, 5, '2025/2026', 'Genap', 'Aktif', '2025-12-04 12:40:36', '2025-12-04 12:40:36');

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa`
--

CREATE TABLE `mahasiswa` (
  `id_mahasiswa` int NOT NULL,
  `user_id` int NOT NULL,
  `nim` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int DEFAULT NULL,
  `tempat_lahir` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agama` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `no_hp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_mahasiswa` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
(5, 8, 'E61253310', 'Mahasiswa TKK 1', 3, 'Gresik', '2005-01-18', 'L', 'Islam', 'Jl. Mahasiswa No. 5, Gresik', '082155555555', 'mhs5@kampus.ac.id', '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
(6, 10, 'E41253336', 'Dani', 1, '', '2000-01-01', 'L', '', '', '', NULL, '2025-11-28 10:51:17', '2025-11-28 10:51:17'),
(8, 12, 'E41253395', 'Agung Bima Wahyu Abadi', 1, '', '2000-01-01', 'L', '', '', '', NULL, '2025-11-30 00:28:38', '2025-11-30 00:28:38'),
(9, 13, 'E41253394', 'Ihya Ulumuddin', 1, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 10:37:13', '2025-12-04 10:37:13'),
(10, 14, 'E41253368', 'Moh Alfianur Salsabil', 5, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 10:43:07', '2025-12-04 11:49:00'),
(11, 17, 'E41253378', 'Ihya Mahasiswa', 6, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 12:38:24', '2025-12-04 12:44:39'),
(12, 18, 'E41253319', 'Ahmad Hanafi', 6, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 12:59:15', '2025-12-04 12:59:15'),
(13, 19, 'E41253341', 'Firman Alamwalker', 6, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 13:04:43', '2025-12-04 13:04:43'),
(14, 20, 'E41253329', 'Muhammad Rizal Fahlevi', 6, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 13:08:48', '2025-12-04 13:08:48'),
(15, 21, 'E41253355', 'Nurul Fajri Maulidya', 6, '', '2000-01-01', 'L', '', '', '', NULL, '2025-12-04 13:10:38', '2025-12-04 13:10:38');

-- --------------------------------------------------------

--
-- Table structure for table `mata_kuliah`
--

CREATE TABLE `mata_kuliah` (
  `kode_mk` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_mk` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sks` tinyint DEFAULT NULL,
  `semester` tinyint DEFAULT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mata_kuliah`
--

INSERT INTO `mata_kuliah` (`kode_mk`, `nama_mk`, `sks`, `semester`, `deskripsi`, `created_at`, `updated_at`) VALUES
('BD001', 'Basis Data', 3, 3, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('BS001', 'Bisnis', 2, 4, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14'),
('DL0001', 'Deep Learning', 2, 4, 'Deep Learning1', '2025-12-04 12:39:58', '2025-12-04 12:40:10'),
('ML001', 'Machine Learning', 2, 4, 'asddd', '2025-12-04 11:15:40', '2025-12-04 11:44:37'),
('TK001', 'Teknik Komputasi', 3, 5, NULL, '2025-11-27 12:50:14', '2025-11-27 12:50:14');

-- --------------------------------------------------------

--
-- Table structure for table `materi`
--

CREATE TABLE `materi` (
  `id_materi` int NOT NULL,
  `kode_mk` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kelas` int NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL COMMENT 'id_dosen who uploaded this materi',
  `tanggal_upload` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materi`
--

INSERT INTO `materi` (`id_materi`, `kode_mk`, `id_kelas`, `minggu`, `judul`, `deskripsi`, `file_pdf`, `uploaded_by`, `tanggal_upload`) VALUES
(12, 'BS001', 2, 1, 'coba ', 'coba', 'BS001_kelas2_minggu1_55b470d216934c7fb7cb31519f893b99.pdf', 1, '2025-12-04 09:34:10'),
(13, 'TK001', 3, 1, 'cekasd', 'asfasf', 'TK001_kelas3_minggu1_37657d7efdfa40bbae67c803c0166b76.pdf', 2, '2025-12-04 09:42:06'),
(14, 'BS001', 2, 2, 'cobaasd', 'ini baru', 'BS001_kelas2_minggu2_4296357195b24de98c7669072058bbff.pdf', 1, '2025-12-04 11:21:51'),
(15, 'BD001', 1, 2, 'adsasdasd', 'asdasd', 'BD001_kelas1_minggu2_5bb78fc54eb5469c8c5be1a4a5955eff.pdf', 1, '2025-12-04 11:27:41'),
(16, 'ML001', 5, 1, 'asdasd2', 'dddd', 'ML001_kelas5_minggu1_5373882a808346bba6174f0c637f78e6.pdf', 4, '2025-12-04 11:45:35'),
(18, 'BD001', 1, 5, 'dfafa', 'dsgsd', 'BD001_kelas1_minggu5_3c2c91895dd142b88fc615aa64233fe8.pdf', 1, '2025-12-04 12:10:34'),
(19, 'DL0001', 6, 1, 'Materi Baru', 'Contoh Materi', 'DL0001_kelas6_minggu1_2c336f3c818f41c19f80ffff20a2746b.pdf', 5, '2025-12-04 12:45:22'),
(21, 'BD001', 1, 1, 'Materi Baru', 'Baru Buat', 'BD001_kelas1_minggu1_d6943f0e27e44fa1a9a5e8188f9def3f.pdf', 1, '2025-12-04 13:50:54');

-- --------------------------------------------------------

--
-- Table structure for table `materi_backup`
--

CREATE TABLE `materi_backup` (
  `id_materi` int NOT NULL DEFAULT '0',
  `kode_mk` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `file_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `status` enum('Hadir','Belum Absen','Alfa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Belum Absen',
  `waktu_input` datetime DEFAULT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_by_face` tinyint(1) DEFAULT '0' COMMENT 'True if verified via face recognition',
  `face_match_confidence` decimal(5,2) DEFAULT NULL COMMENT 'Match confidence score 0-100 from face API',
  `verification_photo_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to photo taken during verification',
  `device_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Android device model/OS info',
  `app_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mobile app version used'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `presensi`
--

INSERT INTO `presensi` (`id_presensi`, `id_mahasiswa`, `id_kelas_mk`, `tanggal`, `pertemuan_ke`, `waktu_mulai`, `waktu_selesai`, `status`, `waktu_input`, `keterangan`, `verified_by_face`, `face_match_confidence`, `verification_photo_path`, `device_info`, `app_version`) VALUES
(21, 1, 1, '2025-12-02', 15, '18:33:00', '18:50:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(22, 2, 1, '2025-12-02', 15, '18:33:00', '18:50:00', 'Alfa', NULL, '[Admin Edit]', 0, NULL, NULL, NULL, NULL),
(23, 6, 1, '2025-12-02', 15, '18:33:00', '18:50:00', 'Hadir', '2025-12-02 18:34:55', NULL, 0, NULL, NULL, NULL, NULL),
(24, 8, 1, '2025-12-02', 15, '18:33:00', '18:50:00', 'Hadir', '2025-12-04 18:47:18', '[Admin Edit]', 0, NULL, NULL, NULL, NULL),
(29, 1, 1, '2025-12-03', 17, '22:32:00', '23:33:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(30, 2, 1, '2025-12-03', 17, '22:32:00', '23:33:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(31, 6, 1, '2025-12-03', 17, '22:32:00', '23:33:00', 'Hadir', '2025-12-03 22:42:39', NULL, 0, NULL, NULL, NULL, NULL),
(32, 8, 1, '2025-12-03', 17, '22:32:00', '23:33:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(42, 1, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(43, 2, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(44, 6, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(45, 8, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(46, 9, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Alfa', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(47, 10, 1, '2025-12-04', 1, '17:44:00', '20:44:00', 'Hadir', '2025-12-04 17:45:30', NULL, 0, NULL, NULL, NULL, NULL),
(54, 1, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(55, 2, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(56, 6, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(57, 8, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(58, 9, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Hadir', '2025-12-04 20:42:51', NULL, 0, NULL, NULL, NULL, NULL),
(59, 10, 1, '2025-12-04', 2, '19:26:00', '23:26:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(60, 10, 9, '2025-12-04', 1, '19:49:00', '22:49:00', 'Hadir', '2025-12-04 18:49:38', '[Admin Edit]', 0, NULL, NULL, NULL, NULL),
(63, 1, 8, '2025-12-04', 1, '19:21:00', '22:21:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(64, 2, 8, '2025-12-04', 1, '19:21:00', '22:21:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(65, 6, 8, '2025-12-04', 1, '19:21:00', '22:21:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(66, 8, 8, '2025-12-04', 1, '19:21:00', '22:21:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(67, 9, 8, '2025-12-04', 1, '19:21:00', '22:21:00', 'Belum Absen', NULL, NULL, 0, NULL, NULL, NULL, NULL),
(68, 11, 12, '2025-12-04', 1, '19:45:00', '20:45:00', 'Belum Absen', NULL, '[Admin Edit]', 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `skor_materi`
--

CREATE TABLE `skor_materi` (
  `id_skor` int NOT NULL,
  `id_mahasiswa` int NOT NULL,
  `id_materi` int NOT NULL,
  `waktu_belajar` int DEFAULT '0',
  `waktu_fokus` int DEFAULT '0',
  `jumlah_gangguan` int DEFAULT '0',
  `skor_perhatian` int DEFAULT '0',
  `tracking_mode` enum('camera','simulated') NOT NULL,
  `session_start` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_end` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `skor_materi`
--

INSERT INTO `skor_materi` (`id_skor`, `id_mahasiswa`, `id_materi`, `waktu_belajar`, `waktu_fokus`, `jumlah_gangguan`, `skor_perhatian`, `tracking_mode`, `session_start`, `session_end`, `updated_at`) VALUES
(6, 6, 15, 30, 23, 7, 77, 'camera', '2025-12-04 04:27:47', '2025-12-04 04:28:51', '2025-12-04 11:28:53'),
(7, 9, 21, 30, 27, 3, 90, 'camera', '2025-12-04 07:52:53', '2025-12-04 07:53:56', '2025-12-04 14:53:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','mahasiswa') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mahasiswa',
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
(9, 'BebekDosen', 'bebekd@gmail.com', '$2b$12$5CbaWkyi.dLX9ErwXKMOJuu2q/rCjO/Zq4v1tHbiMbE02oH26LCtS', 'admin', 1, '2025-11-27 15:31:22', '2025-11-27 15:31:22'),
(10, 'E41253336', 'e41253336@student.polije.ac.id', '$2b$12$YB3BO9j4OnOP/9dcup8BVum7BsW9GNg1beXlJSyxBx98e71kjwski', 'mahasiswa', 1, '2025-11-28 10:51:17', '2025-11-28 10:51:17'),
(12, 'E41253395', 'e41253395@student.polije.ac.id', '$2b$12$uGrgo.Rqr5QbYkbbdaH/8eobEpX/A62Hyw/uIn8JxbTR3NMAOIG0m', 'mahasiswa', 1, '2025-11-30 00:28:38', '2025-11-30 00:28:38'),
(13, 'E41253394', 'e41253394@student.polije.ac.id', '$2b$12$jCQXhm2.D875emMPzfOV8eFxYdEEqD7tm77X1/13DHtddN2yk9vGq', 'mahasiswa', 1, '2025-12-04 10:37:13', '2025-12-04 10:37:13'),
(14, 'E41253368', 'e41253368@student.polije.ac.id', '$2b$12$D2hxT.esRHRLQWGLo09L5es6rSK9KzU3EORaPUZyF.kmY7r4mWaVG', 'mahasiswa', 1, '2025-12-04 10:43:07', '2025-12-04 10:43:07'),
(15, 'dosenbaru', 'dosen@gmail.com', '$2b$12$DedZKvbmNvm0ougrr8Sgce9hl5WlAdDav5jBuADxn7/tvkHrPSJ92', 'admin', 1, '2025-12-04 11:04:35', '2025-12-04 12:17:16'),
(16, 'ihya.dosen', 'ihya@gmail.com', '$2b$12$w33G9DmYnV6h/BuxO/Vau.Hgv2jNtaht2.SjdSYx6CRCKZmvfJPPC', 'admin', 1, '2025-12-04 12:37:35', '2025-12-04 12:43:54'),
(17, 'ihya,maha', 'ihyamaha@gmail.com', '$2b$12$bUxy9T.WY/aOz3tVk3dGVuDI0TrP4Ww0d7Pt5q7RRG8qjYwFtER1q', 'mahasiswa', 1, '2025-12-04 12:38:24', '2025-12-04 12:47:52'),
(18, 'E41253319', 'e41253319@student.polije.ac.id', '$2b$12$tOUn8oNA4stPglZF53VURu3xnx5K3JA9VcN.oBvCbXxGRgu.7/07S', 'mahasiswa', 1, '2025-12-04 12:59:15', '2025-12-04 12:59:15'),
(19, 'E41253341', 'e41253341@student.polije.ac.id', '$2b$12$YttIa3RH6uube5XhDETH7uc2/Pnkeer72w/pY/WoPgWy3iJl87nhO', 'mahasiswa', 1, '2025-12-04 13:04:43', '2025-12-04 13:04:43'),
(20, 'E41253329', 'e41253329@student.polije.ac.id', '$2b$12$8u8rMf9q0SsyuWnKGxdP5ugnsCL74A8Oxbpu74bEk.8HlAl9uPTki', 'mahasiswa', 1, '2025-12-04 13:08:48', '2025-12-04 13:08:48'),
(21, 'E41253355', 'e41253355@student.polije.ac.id', '$2b$12$wQ/phi2bPjFutp5flMywquODnROmzJ13bgPaBrxPyUJ4lsYSyRRaW', 'mahasiswa', 1, '2025-12-04 13:10:38', '2025-12-04 13:10:38');

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
  ADD KEY `idx_nim` (`nim`);

--
-- Indexes for table `informasi`
--
ALTER TABLE `informasi`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `skor_materi`
--
ALTER TABLE `skor_materi`
  ADD PRIMARY KEY (`id_skor`),
  ADD KEY `id_mahasiswa` (`id_mahasiswa`),
  ADD KEY `id_materi` (`id_materi`);

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
  MODIFY `id_dosen` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `face_registrations`
--
ALTER TABLE `face_registrations`
  MODIFY `id_registration` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `informasi`
--
ALTER TABLE `informasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `jadwal_kuliah`
--
ALTER TABLE `jadwal_kuliah`
  MODIFY `id_jadwal` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id_kelas` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `kelas_mata_kuliah`
--
ALTER TABLE `kelas_mata_kuliah`
  MODIFY `id_kelas_mk` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  MODIFY `id_mahasiswa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `materi`
--
ALTER TABLE `materi`
  MODIFY `id_materi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `presensi`
--
ALTER TABLE `presensi`
  MODIFY `id_presensi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `skor_materi`
--
ALTER TABLE `skor_materi`
  MODIFY `id_skor` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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

--
-- Constraints for table `skor_materi`
--
ALTER TABLE `skor_materi`
  ADD CONSTRAINT `skor_materi_ibfk_1` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa` (`id_mahasiswa`),
  ADD CONSTRAINT `skor_materi_ibfk_2` FOREIGN KEY (`id_materi`) REFERENCES `materi` (`id_materi`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
