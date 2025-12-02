-- Migration: Update Informasi Target Role Enum
-- Description: Ubah 'dosen' menjadi 'admin' untuk konsistensi dengan role di database
-- Author: System
-- Date: 2025-12-02

-- MySQL tidak bisa mengubah ENUM secara langsung, jadi kita perlu:
-- 1. Update existing data
-- 2. Modify column dengan ENUM baru

-- Step 1: Update existing data dari 'dosen' ke 'admin'
UPDATE informasi 
SET target_role = 'admin' 
WHERE target_role = 'dosen';

-- Step 2: Modify column dengan ENUM baru
ALTER TABLE informasi 
MODIFY COLUMN target_role ENUM('all', 'mahasiswa', 'admin') DEFAULT 'all' NOT NULL;

-- Verify changes
SELECT DISTINCT target_role FROM informasi;
