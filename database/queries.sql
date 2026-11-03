-- =============================================================================
-- PROYEK: UduPay Monitor - Kumpulan Query Analitik (F1 - F5)
-- FILE: database/queries.sql
-- DIALECT: PostgreSQL (v14+)
-- ZONA WAKTU: Asia/Jakarta
-- MATA UANG: Rupiah (IDR)
-- =============================================================================

-- =============================================================================
-- [F1] DASHBOARD STATISTIK STATUS PEMBAYARAN PER KELAS
-- =============================================================================

-- F1.1: Rekapitulasi Status Kelunasan (Lunas, Menunggak, Cicilan) per Kelas
-- Mengelompokkan tagihan berdasarkan kelas dan status:
--   - Lunas (Paid)
--   - Cicilan (Partial)
--   - Menunggak (Unpaid & Overdue)
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

-- F1.2: Distribusi Metode Pembayaran (Tunai vs Transfer vs E-Wallet) per Kelas
-- Hanya menghitung transaksi yang telah diverifikasi (Verified)
SELECT
    c.nama_kelas,
    COUNT(CASE WHEN pt.payment_method = 'Cash' THEN 1 END) AS tx_cash_count,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS total_cash,
    COUNT(CASE WHEN pt.payment_method = 'Transfer Bank' THEN 1 END) AS tx_transfer_count,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS total_transfer,
    COUNT(CASE WHEN pt.payment_method = 'E-Wallet' THEN 1 END) AS tx_ewallet_count,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS total_ewallet,
    SUM(pt.amount_paid) AS total_keseluruhan
FROM classes c
JOIN students s ON c.class_id = s.class_id
JOIN student_bills sb ON s.student_id = sb.student_id
JOIN payment_transactions pt ON sb.bill_id = pt.bill_id
WHERE pt.verification_status = 'Verified'
GROUP BY c.class_id, c.nama_kelas
ORDER BY c.nama_kelas ASC;


-- =============================================================================
-- [F2] OVERDUE TRACKING (MENDEKATI & MELEWATI JATUH TEMPO)
-- =============================================================================

-- F2.1: Daftar Tagihan Overdue & Pengingat H-7, H-3, H-1 dengan Jumlah Hari Keterlambatan
-- Digunakan untuk alert sistem dan daftar prioritas penagihan
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
        ELSE 'Belum Jatuh Tempo'
    END AS status_urgensi
FROM student_bills sb
JOIN students s ON sb.student_id = s.student_id
JOIN classes c ON s.class_id = c.class_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0
  AND fs.due_date <= (CURRENT_DATE + INTERVAL '7 days')
ORDER BY
    (CURRENT_DATE - fs.due_date) DESC,
    sb.amount_due DESC;

-- F2.2: Ringkasan KPI Overdue Berdasarkan Rentang Hari Keterlambatan
SELECT
    CASE
        WHEN (CURRENT_DATE - fs.due_date) BETWEEN 1 AND 7 THEN '1 - 7 Hari'
        WHEN (CURRENT_DATE - fs.due_date) BETWEEN 8 AND 14 THEN '8 - 14 Hari'
        WHEN (CURRENT_DATE - fs.due_date) BETWEEN 15 AND 30 THEN '15 - 30 Hari'
        WHEN (CURRENT_DATE - fs.due_date) > 30 THEN '> 30 Hari (Kritis)'
        ELSE 'Mendekati H-7 s/d H-0'
    END AS rentang_keterlambatan,
    COUNT(sb.bill_id) AS total_tagihan_overdue,
    SUM(sb.amount_due) AS total_nominal_tunggakan
FROM student_bills sb
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0 AND fs.due_date <= CURRENT_DATE
GROUP BY rentang_keterlambatan
ORDER BY MIN(CURRENT_DATE - fs.due_date) DESC;


-- =============================================================================
-- [F3] REKAPITULASI PENERIMAAN KAS HARIAN DAN BULANAN (VERIFIED ONLY)
-- =============================================================================

-- F3.1: Rekapitulasi Penerimaan Kas Harian (7 Hari Terakhir / Rentang Custom)
SELECT
    DATE(pt.transaction_date) AS tanggal_transaksi,
    COUNT(pt.transaction_id) AS frekuensi_transaksi,
    SUM(CASE WHEN pt.payment_method = 'Transfer Bank' THEN pt.amount_paid ELSE 0 END) AS kas_transfer,
    SUM(CASE WHEN pt.payment_method = 'E-Wallet' THEN pt.amount_paid ELSE 0 END) AS kas_ewallet,
    SUM(CASE WHEN pt.payment_method = 'Cash' THEN pt.amount_paid ELSE 0 END) AS kas_tunai,
    SUM(pt.amount_paid) AS total_penerimaan_harian
FROM payment_transactions pt
WHERE pt.verification_status = 'Verified'
  AND pt.transaction_date >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY DATE(pt.transaction_date)
ORDER BY tanggal_transaksi DESC;

-- F3.2: Rekapitulasi Penerimaan Kas Bulanan (Tahun Berjalan)
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
-- [F4] QUERY NOTIFIKASI OTOMATIS KE ORANG TUA (CRON SCHEDULER & MANUAL)
-- =============================================================================

-- F4.1: Query Pemicu Penjadwal Notifikasi (H-7, H-3, H-1, dan Overdue)
-- Digunakan oleh worker backend / cron scheduler harian
SELECT
    sb.bill_id,
    s.student_id,
    s.nama AS nama_siswa,
    s.nis,
    c.nama_kelas,
    s.nama_orang_tua,
    s.email_ortu,
    s.no_hp_ortu,
    fs.fee_name,
    fs.due_date,
    sb.amount_due,
    (CURRENT_DATE - fs.due_date) AS hari_keterlambatan,
    CASE
        WHEN fs.due_date = CURRENT_DATE + INTERVAL '7 days' THEN 'REMINDER_H7'
        WHEN fs.due_date = CURRENT_DATE + INTERVAL '3 days' THEN 'REMINDER_H3'
        WHEN fs.due_date = CURRENT_DATE + INTERVAL '1 day' THEN 'REMINDER_H1'
        WHEN fs.due_date = CURRENT_DATE THEN 'REMINDER_H0'
        WHEN fs.due_date < CURRENT_DATE THEN 'OVERDUE_ALERT'
    END AS notification_event,
    -- Template Pesan WhatsApp Siap Kirim
    CONCAT(
        'Yth. ', s.nama_orang_tua, ', tagihan ', fs.fee_name, ' siswa an. ', s.nama,
        ' (Kelas: ', c.nama_kelas, ', NIS: ', s.nis, ') memiliki sisa pembayaran sebesar Rp ',
        TO_CHAR(sb.amount_due, 'FM999,999,999'), '. Jatuh tempo pada ',
        TO_CHAR(fs.due_date, 'DD/MM/YYYY'),
        CASE
            WHEN fs.due_date < CURRENT_DATE THEN CONCAT(' (Telah lewat ', (CURRENT_DATE - fs.due_date), ' hari). Mohon segera melakukan pembayaran.')
            ELSE '. Harap lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih.'
        END
    ) AS formatted_message_wa
FROM student_bills sb
JOIN students s ON sb.student_id = s.student_id
JOIN classes c ON s.class_id = c.class_id
JOIN fee_structures fs ON sb.fee_id = fs.fee_id
WHERE sb.amount_due > 0
  AND (
      fs.due_date IN (
          CURRENT_DATE + INTERVAL '7 days',
          CURRENT_DATE + INTERVAL '3 days',
          CURRENT_DATE + INTERVAL '1 day',
          CURRENT_DATE
      )
      OR (fs.due_date < CURRENT_DATE AND (CURRENT_DATE - fs.due_date) % 7 = 0) -- Kirim berkala tiap 7 hari keterlambatan
  );

-- F4.2: Rekapitulasi Performa & Status Pengiriman Notifikasi
SELECT
    nl.channel,
    nl.status_kirim,
    COUNT(nl.notification_id) AS jumlah,
    ROUND(
        (COUNT(nl.notification_id)::NUMERIC / NULLIF(SUM(COUNT(nl.notification_id)) OVER(PARTITION BY nl.channel), 0)) * 100,
        2
    ) AS persentase_keberhasilan
FROM notification_logs nl
GROUP BY nl.channel, nl.status_kirim
ORDER BY nl.channel, nl.status_kirim;


-- =============================================================================
-- [F5] MONITORING ALOKASI VS REALISASI ANGGARAN OPERASIONAL INSTITUSI
-- =============================================================================

-- F5.1: Ringkasan Alokasi vs Realisasi Belanja per Kategori Anggaran
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

-- F5.2: Rincian Pengeluaran Terbesar per Kategori untuk Audit Institusi
SELECT
    be.expenditure_id,
    ba.kategori,
    be.deskripsi,
    be.nominal,
    be.tanggal,
    be.bukti,
    ROUND((be.nominal / ba.nominal_alokasi) * 100, 2) AS rasio_terhadap_alokasi
FROM budget_expenditures be
JOIN budget_allocations ba ON be.allocation_id = ba.allocation_id
ORDER BY be.nominal DESC
LIMIT 10;

