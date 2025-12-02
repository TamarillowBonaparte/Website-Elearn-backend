-- Migration: Create Informasi Table (MySQL)
-- Description: Tabel untuk menyimpan informasi/pengumuman yang ditampilkan di mobile app
-- Author: System
-- Date: 2025-12-02

-- Create informasi table
CREATE TABLE IF NOT EXISTS informasi (
    -- Primary Key
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Content Fields
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    gambar_url VARCHAR(500) NULL,
    
    -- Status & Display Control
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    priority INT DEFAULT 0 NOT NULL CHECK (priority >= 0 AND priority <= 100),
    
    -- Visibility Period
    tanggal_mulai DATETIME NULL COMMENT 'Kapan mulai ditampilkan (NULL = langsung)',
    tanggal_selesai DATETIME NULL COMMENT 'Kapan berhenti ditampilkan (NULL = tidak ada batas)',
    
    -- Target Audience
    target_role ENUM('all', 'mahasiswa', 'dosen') DEFAULT 'all' NOT NULL,
    
    -- Metadata
    created_by INT NOT NULL COMMENT 'User ID yang membuat (admin/super_admin)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    -- Indexes
    INDEX idx_informasi_is_active (is_active),
    INDEX idx_informasi_priority (priority),
    INDEX idx_informasi_created_at (created_at),
    INDEX idx_informasi_target_role (target_role),
    INDEX idx_informasi_created_by (created_by),
    INDEX idx_informasi_tanggal_mulai (tanggal_mulai),
    INDEX idx_informasi_tanggal_selesai (tanggal_selesai),
    INDEX idx_informasi_active_priority_created (is_active, priority, created_at),
    INDEX idx_informasi_date_range (is_active, tanggal_mulai, tanggal_selesai),
    
    -- Foreign Key
    CONSTRAINT fk_informasi_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id_user) 
        ON DELETE CASCADE,
    
    -- Date Range Constraint
    CONSTRAINT check_date_range 
        CHECK (tanggal_selesai IS NULL OR tanggal_mulai IS NULL OR tanggal_selesai > tanggal_mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO informasi (judul, deskripsi, priority, target_role, created_by) VALUES
('Selamat Datang di E-Learning System', 'Selamat datang di platform e-learning kami. Silakan login untuk mengakses materi pembelajaran dan fitur presensi dengan face recognition.', 100, 'all', 1),
('Panduan Presensi Face Recognition', 'Untuk melakukan presensi, pastikan wajah Anda terlihat jelas di kamera. Sistem akan mendeteksi wajah Anda secara otomatis dan melakukan verifikasi dengan data yang terdaftar.', 90, 'mahasiswa', 1),
('Update: Fitur Berbagi Materi', 'Dosen sekarang dapat berbagi materi pembelajaran langsung di platform. Mahasiswa dapat mengakses materi yang dibagikan melalui menu Materi.', 80, 'dosen', 1);

-- Verification queries
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS total_informasi FROM informasi;
