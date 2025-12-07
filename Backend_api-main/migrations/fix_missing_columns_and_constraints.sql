-- ====================================================================
-- SCRIPT PERBAIKAN URGENT - DATABASE e-learn Fix
-- Memperbaiki masalah CRITICAL yang akan menyebabkan error di website
-- Tanggal: 3 Desember 2025
-- ====================================================================

USE `e-learn`;

-- ====================================================================
-- CRITICAL FIX: Tambahkan Foreign Key pada tabel informasi
-- Tanpa ini, hapus user akan gagal atau menyebabkan orphan data
-- ====================================================================

ALTER TABLE `informasi`
ADD CONSTRAINT `fk_informasi_created_by` 
FOREIGN KEY (`created_by`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

-- ====================================================================
-- SELESAI
-- ====================================================================

SELECT 'Perbaikan CRITICAL selesai!' AS status;
SELECT 'Foreign key informasi.created_by berhasil ditambahkan' AS fix_applied;
