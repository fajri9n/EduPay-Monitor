-- =============================================================================
-- PROYEK: UduPay Monitor - Monitoring Pembayaran SPP & Anggaran Institusi
-- FILE: database/schema.sql
-- DIALECT: PostgreSQL (v14+)
-- ZONA WAKTU: Asia/Jakarta (TIMESTAMPTZ)
-- MATA UANG: Rupiah (DECIMAL 12,2 dan 14,2)
-- =============================================================================

-- Pastikan ekstensi yang dibutuhkan aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default timezone
SET timezone = 'Asia/Jakarta';

-- =============================================================================
-- 1. DROP EXISTING OBJECTS (Untuk Idempotensi Migrasi Bersih)
-- =============================================================================
DROP VIEW IF EXISTS view_overdue_bills CASCADE;
DROP VIEW IF EXISTS view_class_payment_status CASCADE;
DROP VIEW IF EXISTS view_monthly_cash_recap CASCADE;
DROP VIEW IF EXISTS view_daily_cash_recap CASCADE;
DROP VIEW IF EXISTS view_budget_realization CASCADE;

DROP TABLE IF EXISTS budget_expenditures CASCADE;
DROP TABLE IF EXISTS budget_allocations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS student_bills CASCADE;
DROP TABLE IF EXISTS parent_students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;

DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS verification_status_enum CASCADE;
DROP TYPE IF EXISTS payment_method_enum CASCADE;
DROP TYPE IF EXISTS notification_channel_enum CASCADE;
DROP TYPE IF EXISTS notification_status_enum CASCADE;

-- =============================================================================
-- 2. TIPE DATA ENUM
-- =============================================================================
CREATE TYPE payment_status_enum AS ENUM ('Unpaid', 'Partial', 'Paid', 'Overdue');
CREATE TYPE verification_status_enum AS ENUM ('Pending', 'Verified', 'Rejected');
CREATE TYPE payment_method_enum AS ENUM ('Transfer Bank', 'E-Wallet', 'Cash');
CREATE TYPE notification_channel_enum AS ENUM ('Email', 'WhatsApp');
CREATE TYPE notification_status_enum AS ENUM ('Sent', 'Failed', 'Pending');

-- =============================================================================
-- 3. TABEL MASTER: KELAS & STRUKTUR BIAYA
-- =============================================================================

-- Tabel Kelas
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    nama_kelas VARCHAR(50) NOT NULL,
    tingkat VARCHAR(20) NOT NULL,              -- Contoh: '10', '11', '12'
    tahun_ajaran VARCHAR(20) NOT NULL,          -- Contoh: '2024/2025'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Siswa
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    nis VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    class_id INT NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
    nama_orang_tua VARCHAR(100) NOT NULL,
    email_ortu VARCHAR(100) NOT NULL,
    no_hp_ortu VARCHAR(25) NOT NULL,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel fee_structures (Wajib: fee_id INT PK | fee_name VARCHAR(100) | amount DECIMAL(12,2) | due_date DATE)
CREATE TABLE fee_structures (
    fee_id SERIAL PRIMARY KEY,
    fee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    academic_year VARCHAR(20) DEFAULT '2024/2025',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fee_amount_positive CHECK (amount > 0)
);

-- =============================================================================
-- 4. AUTENTIKASI & OTORISASI (RBAC)
-- =============================================================================

-- Tabel Peran (Roles)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,      -- 'admin', 'bendahara', 'kepala_sekolah', 'orang_tua'
    deskripsi VARCHAR(255)
);

-- Tabel Pengguna (Users)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Relasi Multi Orang Tua ↔ Siswa (untuk akun login orang tua yang memiliki 1 atau lebih anak)
CREATE TABLE parent_students (
    parent_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'Orang Tua / Wali',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_user_id, student_id)
);

-- =============================================================================
-- 5. TABEL INTI TRANSAKSI KEUANGAN SPP
-- =============================================================================

-- Tabel Tagihan Siswa (student_bills)
-- Wajib: bill_id INT PK | student_id INT | fee_id INT FK→fee_structures | amount_due DECIMAL(12,2) | payment_status ENUM | created_at DATE
CREATE TABLE student_bills (
    bill_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    fee_id INT NOT NULL REFERENCES fee_structures(fee_id) ON DELETE RESTRICT,
    amount_due DECIMAL(12,2) NOT NULL,
    payment_status payment_status_enum NOT NULL DEFAULT 'Unpaid',
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_due_non_negative CHECK (amount_due >= 0),
    CONSTRAINT uq_student_fee UNIQUE (student_id, fee_id)
);

-- Tabel Transaksi Pembayaran (payment_transactions)
-- Wajib: transaction_id BIGINT PK | bill_id INT FK→student_bills | amount_paid DECIMAL(12,2) |
-- payment_method VARCHAR(50) ('Transfer Bank','E-Wallet','Cash') | transaction_date DATETIME |
-- verification_status ENUM('Pending','Verified','Rejected')
CREATE TABLE payment_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES student_bills(bill_id) ON DELETE RESTRICT,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_status verification_status_enum NOT NULL DEFAULT 'Pending',
    verified_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason VARCHAR(255),
    proof_file VARCHAR(255),
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_paid_positive CHECK (amount_paid > 0),
    CONSTRAINT chk_payment_method_valid CHECK (payment_method IN ('Transfer Bank', 'E-Wallet', 'Cash'))
);

-- =============================================================================
-- 6. TABEL LOG & NOTIFIKASI
-- =============================================================================

-- Tabel Log Notifikasi (notification_logs)
CREATE TABLE notification_logs (
    notification_id BIGSERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES student_bills(bill_id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    status_kirim VARCHAR(20) NOT NULL,
    isi_pesan TEXT NOT NULL,
    waktu_kirim TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notif_channel CHECK (channel IN ('Email', 'WhatsApp')),
    CONSTRAINT chk_notif_status CHECK (status_kirim IN ('Sent', 'Failed', 'Pending'))
);

-- Tabel Audit Trail (audit_logs)
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    aksi VARCHAR(50) NOT NULL,
    tabel VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    nilai_lama JSONB,
    nilai_baru JSONB,
    waktu TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 7. TABEL ANGGARAN OPERASIONAL INSTITUSI
-- =============================================================================

-- Tabel Alokasi Anggaran (budget_allocations)
CREATE TABLE budget_allocations (
    allocation_id SERIAL PRIMARY KEY,
    kategori VARCHAR(100) NOT NULL,
    periode VARCHAR(20) NOT NULL,              -- Misal: '2024/2025' atau '2024-Q3'
    nominal_alokasi DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_budget_allocation_positive CHECK (nominal_alokasi > 0)
);

-- Tabel Realisasi Pengeluaran Anggaran (budget_expenditures)
CREATE TABLE budget_expenditures (
    expenditure_id SERIAL PRIMARY KEY,
    allocation_id INT NOT NULL REFERENCES budget_allocations(allocation_id) ON DELETE RESTRICT,
    deskripsi VARCHAR(255) NOT NULL,
    nominal DECIMAL(14,2) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    bukti VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_budget_expenditure_positive CHECK (nominal > 0)
);

-- =============================================================================
-- 8. INDEX UNTUK PERFORMA QUERY TINGGI
-- =============================================================================

-- Index Kebutuhan Wajib & Filter Pelaporan
CREATE INDEX idx_fee_structures_due_date ON fee_structures(due_date);
CREATE INDEX idx_student_bills_payment_status ON student_bills(payment_status);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(transaction_date);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(verification_status);

-- Composite & Foreign Key Indexes
CREATE INDEX idx_student_bills_student ON student_bills(student_id);
CREATE INDEX idx_student_bills_fee ON student_bills(fee_id);
CREATE INDEX idx_student_bills_status_due ON student_bills(payment_status, created_at);
CREATE INDEX idx_payment_transactions_bill ON payment_transactions(bill_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_nis ON students(nis);
CREATE INDEX idx_budget_expenditures_alloc ON budget_expenditures(allocation_id);
CREATE INDEX idx_budget_expenditures_tgl ON budget_expenditures(tanggal);
CREATE INDEX idx_notification_logs_bill ON notification_logs(bill_id);
CREATE INDEX idx_audit_logs_waktu ON audit_logs(waktu);

-- =============================================================================
-- 9. TRIGGER: OTOMASISASI SISA TAGIHAN & STATUS PEMBAYARAN
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_update_bill_status_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_target_bill_id INT;
    v_fee_amount DECIMAL(12,2);
    v_due_date DATE;
    v_total_verified_paid DECIMAL(12,2);
    v_new_amount_due DECIMAL(12,2);
    v_new_status payment_status_enum;
BEGIN
    -- Menentukan bill_id target
    IF (TG_OP = 'DELETE') THEN
        v_target_bill_id := OLD.bill_id;
    ELSE
        v_target_bill_id := NEW.bill_id;
    END IF;

    -- Mengambil nominal awal dan jatuh tempo tagihan
    SELECT fs.amount, fs.due_date
    INTO v_fee_amount, v_due_date
    FROM student_bills sb
    JOIN fee_structures fs ON sb.fee_id = fs.fee_id
    WHERE sb.bill_id = v_target_bill_id;

    -- Menghitung total transaksi yang sudah di-Verified
    SELECT COALESCE(SUM(amount_paid), 0)
    INTO v_total_verified_paid
    FROM payment_transactions
    WHERE bill_id = v_target_bill_id
      AND verification_status = 'Verified';

    -- Menghitung sisa tagihan (amount_due tidak boleh minus)
    v_new_amount_due := GREATEST(0, v_fee_amount - v_total_verified_paid);

    -- Logika Penentuan Status Pembayaran:
    -- 1. Lunas jika v_new_amount_due <= 0
    -- 2. Jika sisa > 0 dan sudah lewat due_date -> Overdue
    -- 3. Jika sisa > 0 dan sudah ada cicilan yang verified -> Partial
    -- 4. Jika belum ada pembayaran verified sama sekali -> Unpaid
    IF v_new_amount_due <= 0 THEN
        v_new_status := 'Paid';
    ELSIF v_due_date < CURRENT_DATE THEN
        v_new_status := 'Overdue';
    ELSIF v_total_verified_paid > 0 THEN
        v_new_status := 'Partial';
    ELSE
        v_new_status := 'Unpaid';
    END IF;

    -- Update tabel student_bills
    UPDATE student_bills
    SET
        amount_due = v_new_amount_due,
        payment_status = v_new_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = v_target_bill_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger terpasang saat INSERT, UPDATE verification_status/amount_paid, atau DELETE transaksi
CREATE TRIGGER trg_sync_bill_on_transaction
AFTER INSERT OR UPDATE OF verification_status, amount_paid OR DELETE
ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION fn_update_bill_status_on_transaction();

-- Stored Procedure Scheduler Harian: Mengubah status menjadi 'Overdue' jika melewati due_date
CREATE OR REPLACE FUNCTION sp_refresh_overdue_bills()
RETURNS INT AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE student_bills sb
    SET
        payment_status = 'Overdue',
        updated_at = CURRENT_TIMESTAMP
    FROM fee_structures fs
    WHERE sb.fee_id = fs.fee_id
      AND fs.due_date < CURRENT_DATE
      AND sb.amount_due > 0
      AND sb.payment_status != 'Paid'
      AND sb.payment_status != 'Overdue';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. TRIGGER: AUDIT TRAIL OTOMATIS TRANSAKSI PEMBAYARAN
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_audit_payment_transactions()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, aksi, tabel, record_id, nilai_lama, nilai_baru, waktu)
        VALUES (
            NEW.verified_by,
            'VERIFICATION_UPDATE',
            'payment_transactions',
            NEW.transaction_id::TEXT,
            to_jsonb(OLD),
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, aksi, tabel, record_id, nilai_lama, nilai_baru, waktu)
        VALUES (
            NEW.verified_by,
            'INSERT_TRANSACTION',
            'payment_transactions',
            NEW.transaction_id::TEXT,
            NULL,
            to_jsonb(NEW),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_payment_transactions
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION fn_audit_payment_transactions();

-- =============================================================================
-- 11. VIEW ANALITIK DATABASE
-- =============================================================================

-- View V1: Rekapitulasi Kas Harian (F3) - Hanya Transaksi Verified
CREATE OR REPLACE VIEW view_daily_cash_recap AS
SELECT
    DATE(pt.transaction_date) AS tanggal,
    COUNT(pt.transaction_id) AS total_transaksi,
    SUM(pt.amount_paid) AS total_penerimaan,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS penerimaan_transfer,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS penerimaan_ewallet,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS penerimaan_cash
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
GROUP BY DATE(pt.transaction_date)
ORDER BY tanggal DESC;

-- View V2: Rekapitulasi Kas Bulanan (F3) - Hanya Transaksi Verified
CREATE OR REPLACE VIEW view_monthly_cash_recap AS
SELECT
    TO_CHAR(pt.transaction_date, 'YYYY-MM') AS periode_bulan,
    COUNT(pt.transaction_id) AS total_transaksi,
    SUM(pt.amount_paid) AS total_penerimaan,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS penerimaan_transfer,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS penerimaan_ewallet,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS penerimaan_cash
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
GROUP BY TO_CHAR(pt.transaction_date, 'YYYY-MM')
ORDER BY periode_bulan DESC;

-- View V3: Rekap Status Pembayaran per Kelas (F1)
CREATE OR REPLACE VIEW view_class_payment_status AS
SELECT
    c.class_id,
    c.nama_kelas,
    c.tingkat,
    c.tahun_ajaran,
    COUNT(sb.bill_id) AS total_tagihan,
    COUNT(CASE WHEN sb.payment_status = 'Paid' THEN 1 END) AS jumlah_lunas,
    COUNT(CASE WHEN sb.payment_status = 'Partial' THEN 1 END) AS jumlah_cicilan,
    COUNT(CASE WHEN sb.payment_status IN ('Unpaid', 'Overdue') THEN 1 END) AS jumlah_menunggak,
    SUM(fs.amount) AS total_target_nominal,
    SUM(CASE WHEN sb.payment_status = 'Paid' THEN fs.amount ELSE (fs.amount - sb.amount_due) END) AS total_nominal_terbayar,
    SUM(sb.amount_due) AS total_nominal_tunggakan,
    ROUND(
        (COUNT(CASE WHEN sb.payment_status = 'Paid' THEN 1 END)::NUMERIC / NULLIF(COUNT(sb.bill_id), 0)) * 100,
        2
    ) AS persentase_kelunasan
FROM classes c
JOIN students s ON c.class_id = s.class_id
JOIN student_bills sb ON s.student_id = sb.student_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
GROUP BY c.class_id, c.nama_kelas, c.tingkat, c.tahun_ajaran
ORDER BY c.tingkat ASC, c.nama_kelas ASC;

-- View V4: Overdue Tracking & Tagihan Mendekati Jatuh Tempo (F2)
CREATE OR REPLACE VIEW view_overdue_bills AS
SELECT
    sb.bill_id,
    s.student_id,
    s.nis,
    s.nama AS nama_siswa,
    c.nama_kelas,
    s.nama_orang_tua,
    s.email_ortu,
    s.no_hp_ortu,
    fs.fee_id,
    fs.fee_name,
    fs.amount AS nominal_asli,
    sb.amount_due AS sisa_tunggakan,
    fs.due_date,
    sb.payment_status,
    (CURRENT_DATE - fs.due_date) AS hari_keterlambatan,
    CASE
        WHEN fs.due_date < CURRENT_DATE THEN 'Lewat Jatuh Tempo'
        WHEN fs.due_date = CURRENT_DATE THEN 'Jatuh Tempo Hari Ini (H-0)'
        WHEN fs.due_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Mendekati H-1'
        WHEN fs.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'Mendekati H-3'
        WHEN fs.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Mendekati H-7'
        ELSE 'Masa Aktif Normal'
    END AS kategori_urgensi
FROM student_bills sb
JOIN students s ON sb.student_id = s.student_id
JOIN classes c ON s.class_id = c.class_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0
ORDER BY fs.due_date ASC, sb.amount_due DESC;

-- View V5: Realisasi vs Alokasi Anggaran (F5)
CREATE OR REPLACE VIEW view_budget_realization AS
SELECT
    ba.allocation_id,
    ba.kategori,
    ba.periode,
    ba.nominal_alokasi,
    COALESCE(SUM(be.nominal), 0) AS total_realisasi,
    ba.nominal_alokasi - COALESCE(SUM(be.nominal), 0) AS sisa_anggaran,
    ROUND(
        (COALESCE(SUM(be.nominal), 0) / ba.nominal_alokasi) * 100,
        2
    ) AS persentase_realisasi
FROM budget_allocations ba
LEFT JOIN budget_expenditures be ON ba.allocation_id = be.allocation_id
GROUP BY ba.allocation_id, ba.kategori, ba.periode, ba.nominal_alokasi
ORDER BY ba.kategori ASC;

