-- =============================================================================
-- PROYEK: EduPay Monitor - Kumpulan Query Analitik Lengkap (F1 - F6)
-- FILE: database/queries.sql
-- DIALECT: PostgreSQL (v14+)
-- ZONA WAKTU: Asia/Jakarta
-- MATA UANG: Rupiah (IDR)
-- =============================================================================

-- =============================================================================
-- [F1] DASHBOARD STATISTIK STATUS PEMBAYARAN PER KELAS
-- =============================================================================

-- F1.1: Rekapitulasi Status Kelunasan (Lunas, Menunggak, Cicilan) per Kelas
-- Digunakan untuk grafik batang bertumpuk status pembayaran per kelas
SELECT
    c.class_id,
    c.nama_kelas,
    c.tingkat,
    c.tahun_ajaran,
    COUNT(sb.bill_id) AS total_tagihan,
    COUNT(CASE WHEN sb.payment_status = 'Paid' THEN 1 END) AS jumlah_lunas,
    COUNT(CASE WHEN sb.payment_status = 'Partial' THEN 1 END) AS jumlah_cicilan,
    COUNT(CASE WHEN sb.payment_status IN ('Unpaid', 'Overdue') THEN 1 END) AS jumlah_menunggak,
    SUM(fs.amount) AS total_target_rupiah,
    SUM(CASE WHEN sb.payment_status = 'Paid' THEN fs.amount ELSE (fs.amount - sb.amount_due) END) AS total_terkumpul_rupiah,
    SUM(sb.amount_due) AS total_tunggakan_rupiah,
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

-- F1.2: Distribusi Metode Pembayaran (Tunai vs Transfer Bank vs E-Wallet)
-- Digunakan untuk Donut Chart metode pembayaran pada dashboard
SELECT
    pt.payment_method,
    COUNT(pt.transaction_id) AS total_frekuensi,
    SUM(pt.amount_paid) AS total_nominal_rupiah,
    ROUND(
        (SUM(pt.amount_paid) / (SELECT SUM(amount_paid) FROM payment_transactions WHERE verification_status = 'Verified')) * 100,
        2
    ) AS persentase_pangsa
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
GROUP BY pt.payment_method
ORDER BY total_nominal_rupiah DESC;


-- =============================================================================
-- [F2] OVERDUE TRACKING (MENDEKATI H-7, H-3, H-1 & LEWAT JATUH TEMPO)
-- =============================================================================

-- F2.1: Daftar Tagihan Overdue & Pengingat H-7, H-3, H-1 dengan Jumlah Hari Keterlambatan
-- Diurutkan dari yang paling terlambat (prioritas penagihan tertinggi)
SELECT
    sb.bill_id,
    s.nis,
    s.nama AS nama_siswa,
    c.nama_kelas,
    s.nama_orang_tua,
    s.no_hp_ortu,
    fs.fee_name,
    fs.amount AS nominal_biaya,
    sb.amount_due AS sisa_tunggakan,
    fs.due_date,
    sb.payment_status,
    (CURRENT_DATE - fs.due_date) AS hari_keterlambatan,
    CASE
        WHEN fs.due_date < CURRENT_DATE THEN 'Lewat Jatuh Tempo (Overdue)'
        WHEN fs.due_date = CURRENT_DATE THEN 'Jatuh Tempo Hari Ini (H-0)'
        WHEN fs.due_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Reminder H-1'
        WHEN fs.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'Reminder H-3'
        WHEN fs.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Reminder H-7'
        ELSE 'Masa Aktif Normal'
    END AS status_urgensi
FROM student_bills sb
JOIN students s ON sb.student_id = s.student_id
JOIN classes c ON s.class_id = c.class_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0
  AND fs.due_date <= (CURRENT_DATE + INTERVAL '7 days')
ORDER BY (CURRENT_DATE - fs.due_date) DESC, sb.amount_due DESC;

-- F2.2: Rekapitulasi Tingkat Keparahan Overdue (1–7 hari, 8–30 hari, >30 hari)
SELECT
    CASE
        WHEN (CURRENT_DATE - fs.due_date) BETWEEN 1 AND 7 THEN '1 - 7 Hari (Sedang)'
        WHEN (CURRENT_DATE - fs.due_date) BETWEEN 8 AND 30 THEN '8 - 30 Hari (Tinggi)'
        WHEN (CURRENT_DATE - fs.due_date) > 30 THEN '> 30 Hari (Kritis)'
        ELSE 'Mendekati H-7 s/d Hari H'
    END AS rentang_urgensi,
    COUNT(sb.bill_id) AS jumlah_tagihan,
    SUM(sb.amount_due) AS total_nominal_tunggakan
FROM student_bills sb
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0 AND fs.due_date <= CURRENT_DATE
GROUP BY rentang_urgensi
ORDER BY MIN(CURRENT_DATE - fs.due_date) DESC;


-- =============================================================================
-- [F3] REKAPITULASI PENERIMAAN KAS HARIAN DAN BULANAN (VERIFIED ONLY)
-- =============================================================================

-- F3.1: Rekap Penerimaan Kas Harian (30 Hari Terakhir)
SELECT
    DATE(pt.transaction_date) AS tanggal_transaksi,
    COUNT(pt.transaction_id) AS total_transaksi,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS kas_transfer,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS kas_ewallet,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS kas_tunai,
    SUM(pt.amount_paid) AS grand_total_harian
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
  AND pt.transaction_date >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY DATE(pt.transaction_date)
ORDER BY tanggal_transaksi DESC;

-- F3.2: Rekap Penerimaan Kas Bulanan (Tahun Berjalan)
SELECT
    TO_CHAR(pt.transaction_date, 'YYYY-MM') AS periode_bulan,
    COUNT(pt.transaction_id) AS total_transaksi,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS penerimaan_transfer,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS penerimaan_ewallet,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS penerimaan_tunai,
    SUM(pt.amount_paid) AS grand_total_kas
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
GROUP BY TO_CHAR(pt.transaction_date, 'YYYY-MM')
ORDER BY periode_bulan DESC;


-- =============================================================================
-- [F4] QUERY NOTIFIKASI OTOMATIS TUNGGAKAN KE ORANG TUA
-- =============================================================================

-- F4.1: Penarik Data Pengingat Otomatis untuk Scheduler Cron
SELECT
    sb.bill_id,
    s.student_id,
    s.nama AS nama_siswa,
    s.nis,
    c.nama_kelas,
    s.nama_orang_tua,
    s.no_hp_ortu,
    s.email_ortu,
    fs.fee_name,
    fs.due_date,
    sb.amount_due,
    (CURRENT_DATE - fs.due_date) AS hari_keterlambatan,
    CONCAT(
        'Yth. ', s.nama_orang_tua, ', tagihan ', fs.fee_name, ' siswa an. ', s.nama,
        ' (Kelas: ', c.nama_kelas, ') memiliki sisa tunggakan sebesar Rp ',
        TO_CHAR(sb.amount_due, 'FM999,999,999'), '. Jatuh tempo: ',
        TO_CHAR(fs.due_date, 'DD/MM/YYYY'),
        CASE
            WHEN fs.due_date < CURRENT_DATE THEN ' (Telah melewati batas jatuh tempo). Mohon segera melakukan pembayaran.'
            ELSE '. Harap selesaikan pembayaran sebelum tanggal jatuh tempo. Terima kasih.'
        END
    ) AS draft_pesan_whatsapp
FROM student_bills sb
JOIN students s ON sb.student_id = s.student_id
JOIN classes c ON s.class_id = c.class_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0
  AND (
      fs.due_date IN (CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE)
      OR (fs.due_date < CURRENT_DATE AND (CURRENT_DATE - fs.due_date) % 7 = 0)
  );


-- =============================================================================
-- [F5] MONITORING ALOKASI VS REALISASI ANGGARAN OPERASIONAL INSTITUSI
-- =============================================================================

-- F5.1: Pengawasan Penyerapan Anggaran per Kategori Belanja
SELECT
    ba.allocation_id,
    ba.kategori AS kategori_anggaran,
    ba.periode,
    ba.nominal_alokasi,
    COALESCE(SUM(be.nominal), 0) AS total_pengeluaran,
    ba.nominal_alokasi - COALESCE(SUM(be.nominal), 0) AS sisa_anggaran,
    ROUND(
        (COALESCE(SUM(be.nominal), 0) / NULLIF(ba.nominal_alokasi, 0)) * 100,
        2
    ) AS persentase_penyerapan,
    CASE
        WHEN (COALESCE(SUM(be.nominal), 0) / NULLIF(ba.nominal_alokasi, 0)) >= 0.90 THEN 'Kritis (>90%)'
        WHEN (COALESCE(SUM(be.nominal), 0) / NULLIF(ba.nominal_alokasi, 0)) >= 0.70 THEN 'Perhatian (70-89%)'
        ELSE 'Normal (<70%)'
    END AS status_budget
FROM budget_allocations ba
LEFT JOIN budget_expenditures be ON ba.allocation_id = be.allocation_id
GROUP BY ba.allocation_id, ba.kategori, ba.periode, ba.nominal_alokasi
ORDER BY persentase_penyerapan DESC;


-- =============================================================================
-- [F6] AUTENTIKASI, HAK AKSES RBAC (SUPER ADMIN, ADMIN, USER) & PENGATURAN WEB
-- =============================================================================

-- F6.1: Verifikasi Login Pengguna & Role Check
SELECT
    u.user_id,
    u.username,
    u.password_hash,
    u.nama_lengkap,
    u.email,
    r.role_name,
    u.student_id,
    u.is_active
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.username = 'superadmin' AND u.is_active = true;

-- F6.2: Mengambil Pengaturan Identitas & Rekening Website (Khusus Super Admin)
SELECT
    setting_id,
    institution_name,
    institution_motto,
    academic_year,
    system_date,
    address,
    phone,
    whatsapp_contact,
    email,
    bank_accounts,
    overdue_grace_days,
    maintenance_mode,
    updated_at
FROM system_settings
WHERE setting_id = 1;
