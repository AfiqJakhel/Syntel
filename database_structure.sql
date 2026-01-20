-- ============================================
-- DATABASE STRUCTURE - SYNTEL
-- Sistem Login dengan NIP sebagai Primary Key
-- ============================================

-- Buat Database
CREATE DATABASE IF NOT EXISTS syntel
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE syntel;

-- ============================================
-- Tabel: users
-- Menyimpan data pegawai/pengguna sistem
-- ============================================

CREATE TABLE users (
    -- Primary Key: NIP (Nomor Induk Pegawai)
    nip VARCHAR(20) NOT NULL PRIMARY KEY COMMENT 'Nomor Induk Pegawai - Primary Key',
    
    -- Informasi Personal
    firstName VARCHAR(50) NOT NULL COMMENT 'Nama depan pegawai',
    lastName VARCHAR(50) NOT NULL COMMENT 'Nama belakang pegawai',
    
    -- Kredensial Login
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username untuk login (unique)',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email pegawai (unique)',
    password VARCHAR(255) NOT NULL COMMENT 'Password (hashed dengan bcrypt)',
    
    -- Kontak
    phone VARCHAR(20) NOT NULL COMMENT 'Nomor telepon',
    
    -- Persetujuan
    termsAccepted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status persetujuan Syarat & Ketentuan',
    
    -- Timestamps
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal pembuatan akun',
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Tanggal update terakhir',
    
    -- Indexes untuk performa query
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabel users/pegawai sistem Syntel';

-- ============================================
-- Sample Data (Data Dummy)
-- Password untuk semua user: password123
-- Hash bcrypt: $2a$10$...
-- ============================================

INSERT INTO users (nip, firstName, lastName, username, email, phone, password, termsAccepted) VALUES
('198501012010', 'Ahmad', 'Susanto', 'ahmad.susanto', 'ahmad.susanto@telkom.co.id', '081234567801', '$2a$10$YourHashedPasswordHere', TRUE),
('199203152015', 'Siti', 'Nurhaliza', 'siti.nurhaliza', 'siti.nurhaliza@telkom.co.id', '081234567802', '$2a$10$YourHashedPasswordHere', TRUE),
('198812202012', 'Budi', 'Santoso', 'budi.santoso', 'budi.santoso@telkom.co.id', '081234567803', '$2a$10$YourHashedPasswordHere', TRUE),
('199505102018', 'Dewi', 'Lestari', 'dewi.lestari', 'dewi.lestari@telkom.co.id', '081234567804', '$2a$10$YourHashedPasswordHere', TRUE),
('199010252013', 'Rudi', 'Hermawan', 'rudi.hermawan', 'rudi.hermawan@telkom.co.id', '081234567805', '$2a$10$YourHashedPasswordHere', TRUE);

-- ============================================
-- Queries Berguna
-- ============================================

-- Lihat semua users
SELECT nip, firstName, lastName, email, username, phone, createdAt 
FROM users 
ORDER BY createdAt DESC;

-- Cari user berdasarkan NIP
SELECT * FROM users WHERE nip = '198501012010';

-- Cari user berdasarkan email
SELECT * FROM users WHERE email = 'ahmad.susanto@telkom.co.id';

-- Lihat total pegawai
SELECT COUNT(*) as total_pegawai FROM users;

-- Lihat pegawai yang baru register (7 hari terakhir)
SELECT nip, firstName, lastName, email, createdAt 
FROM users 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY createdAt DESC;

-- Lihat pegawai berdasarkan tahun NIP
SELECT nip, firstName, lastName, SUBSTRING(nip, 1, 4) as tahun_masuk
FROM users
ORDER BY tahun_masuk;

-- ============================================
-- Maintenance Queries
-- ============================================

-- Reset password user (contoh)
-- Password baru harus di-hash dengan bcrypt terlebih dahulu
-- UPDATE users SET password = '$2a$10$NewHashedPassword' WHERE nip = '198501012010';

-- Hapus user
-- DELETE FROM users WHERE nip = '202301012023';

-- Update email user
-- UPDATE users SET email = 'new.email@telkom.co.id' WHERE nip = '198501012010';

-- ============================================
-- Security Notes
-- ============================================

/*
1. Password SELALU disimpan dalam bentuk HASHED (bcrypt)
   JANGAN PERNAH simpan password plain text!

2. NIP adalah primary key - harus UNIQUE dan TIDAK BOLEH NULL

3. Email dan Username juga UNIQUE - tidak boleh duplikat

4. Gunakan HTTPS untuk koneksi API di production

5. Implementasi rate limiting untuk mencegah brute force attack

6. Gunakan prepared statements untuk mencegah SQL injection
   (Prisma ORM sudah handle ini secara otomatis)
*/
