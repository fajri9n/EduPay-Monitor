import random
import json
from datetime import datetime, timedelta

random.seed(101)

# Fixed Anchor: 03 Nov 2026
ANCHOR_DATE = datetime(2026, 11, 3, 10, 0, 0)
DEFAULT_BCRYPT = "$2a$10$w8T0tTfXmP2QkG6K1hKxwe19A0iWlXJzFfX7QeA7Fq1sWj7YxWz8O"

classes_data = [
    (1, "X-A", "10", "2026/2027"),
    (2, "X-B", "10", "2026/2027"),
    (3, "XI-MIPA", "11", "2026/2027"),
    (4, "XI-IPS", "11", "2026/2027"),
    (5, "XII-MIPA", "12", "2026/2027"),
    (6, "XII-IPS", "12", "2026/2027")
]

male_names = [
    "Ahmad", "Budi", "Candra", "Dimas", "Eko", "Fajar", "Gilang", "Hafiz", "Ilham", "Joko",
    "Kurniawan", "Lukman", "Maulana", "Naufal", "Oktavian", "Prasetyo", "Rizky", "Surya", "Teguh", "Wahyu"
]
female_names = [
    "Aisyah", "Bunga", "Citra", "Dian", "Erna", "Fitriani", "Gita", "Hana", "Indah", "Juwita",
    "Kartika", "Lestari", "Maya", "Nurul", "Putri", "Ratna", "Sari", "Tiara", "Utami", "Wulandari"
]
last_names = [
    "Pratama", "Saputra", "Wijaya", "Hidayat", "Santoso", "Setiawan", "Kusuma", "Nugroho",
    "Ramadhan", "Siregar", "Nasution", "Wibowo", "Permana", "Firmansyah", "Gunawan", "Hakim",
    "Irawan", "Mahendra", "Purnomo", "Raharjo", "Subagyo", "Utomo", "Yulianto", "Zulkarnain"
]

# Generate 120 students (20 per class)
students = []
student_id = 1
for c in classes_data:
    for i in range(20):
        is_male = (i % 2 == 0)
        fname = random.choice(male_names if is_male else female_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        if student_id == 1:
            full_name = "Budi Pratama"
            parent_name = "Bambang Pratama"
        else:
            title = "Bpk. " if random.random() > 0.3 else "Ibu "
            parent_name = f"{title}{random.choice(male_names)} {lname}"
            
        nis = f"2026{student_id:04d}"
        email_clean = f"ortu.{nis}@example.com"
        phone = f"0812{random.randint(10000000, 99999999)}"
        
        students.append({
            "student_id": student_id,
            "nis": nis,
            "nama": full_name,
            "class_id": c[0],
            "kelas": c[1],
            "nama_orang_tua": parent_name,
            "email_ortu": email_clean,
            "no_hp_ortu": phone,
            "status_aktif": True
        })
        student_id += 1

# Fee structures
fee_structures = [
    (1, "SPP Bulan Juni 2026", 650000.00, "2026-06-10"),
    (2, "SPP Bulan Juli 2026", 650000.00, "2026-07-10"),
    (3, "SPP Bulan Agustus 2026", 650000.00, "2026-08-10"),
    (4, "SPP Bulan September 2026", 650000.00, "2026-09-10"),
    (5, "SPP Bulan Oktober 2026", 650000.00, "2026-10-10"),
    (6, "SPP Bulan November 2026", 650000.00, "2026-11-10"), # H-7 due date
    (7, "Iuran Kegiatan & Praktikum Lab", 950000.00, "2026-11-06"), # H-3 due date
    (8, "Iuran Ujian Akhir Semester Ganjil", 500000.00, "2026-11-04") # H-1 due date
]

# Generate bills
bills = []
bill_id = 1
for s in students:
    for fid in [4, 5, 6]:
        fee = next(f for f in fee_structures if f[0] == fid)
        created = (datetime.strptime(fee[3], "%Y-%m-%d") - timedelta(days=25)).strftime("%Y-%m-%d")
        bills.append({
            "bill_id": bill_id,
            "student_id": s["student_id"],
            "fee_id": fid,
            "amount_due": fee[2],
            "payment_status": "Unpaid",
            "created_at": created
        })
        bill_id += 1

# H-3 and H-1 urgent alerts
for s in students[0:15]:
    bills.append({
        "bill_id": bill_id,
        "student_id": s["student_id"],
        "fee_id": 7,
        "amount_due": 950000.00,
        "payment_status": "Unpaid",
        "created_at": "2026-10-15"
    })
    bill_id += 1

for s in students[15:25]:
    bills.append({
        "bill_id": bill_id,
        "student_id": s["student_id"],
        "fee_id": 8,
        "amount_due": 500000.00,
        "payment_status": "Unpaid",
        "created_at": "2026-10-20"
    })
    bill_id += 1

# Transactions: 500 records
methods = ["Transfer Bank", "E-Wallet", "Cash"]
method_weights = [0.55, 0.30, 0.15]
transactions = []
tx_id = 1

# Group 1: 150 bills paid in full (150 txs)
for b in bills[0:150]:
    fee = next(f for f in fee_structures if f[0] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    due = datetime.strptime(fee[3], "%Y-%m-%d")
    tx_date = due - timedelta(days=random.randint(1, 15), hours=random.randint(1, 10))
    if tx_date > ANCHOR_DATE:
        tx_date = ANCHOR_DATE - timedelta(hours=random.randint(2, 40))
        
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": fee[2],
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "verified_by": 2,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Group 2: 70 bills paid in 2 partial txs (140 txs)
for b in bills[150:220]:
    fee = next(f for f in fee_structures if f[0] == b["fee_id"])
    p1 = 300000.00
    p2 = fee[2] - p1
    m1 = random.choices(methods, weights=method_weights)[0]
    m2 = random.choices(methods, weights=method_weights)[0]
    
    due = datetime.strptime(fee[3], "%Y-%m-%d")
    t1 = due - timedelta(days=random.randint(10, 20))
    t2 = due - timedelta(days=random.randint(1, 5))
    if t2 > ANCHOR_DATE: t2 = ANCHOR_DATE - timedelta(days=1)
    if t1 > t2: t1 = t2 - timedelta(days=5)
    
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": p1,
        "payment_method": m1,
        "transaction_date": t1.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "verified_by": 2,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1
    
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": p2,
        "payment_method": m2,
        "transaction_date": t2.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "verified_by": 2,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Group 3: 40 bills with 1 partial payment (40 txs)
for b in bills[220:260]:
    m = random.choices(methods, weights=method_weights)[0]
    amt = random.choice([250000.00, 300000.00, 400000.00])
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(2, 45), hours=random.randint(1, 10))
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Verified",
        "verified_by": 2,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Group 4: 45 bills with Pending transactions (45 txs)
for b in bills[260:305]:
    fee = next(f for f in fee_structures if f[0] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    tx_date = ANCHOR_DATE - timedelta(hours=random.randint(1, 48))
    amt = random.choice([fee[2], 350000.00])
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Pending",
        "verified_by": None,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Group 5: 35 bills with Rejected transactions (35 txs)
for b in bills[305:340]:
    fee = next(f for f in fee_structures if f[0] == b["fee_id"])
    m = random.choices(methods, weights=method_weights)[0]
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(2, 20))
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": fee[2],
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": "Rejected",
        "verified_by": 2,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Group 6: 90 remaining transactions to reach exactly 500
for i in range(90):
    b = random.choice(bills[0:220])
    status = random.choices(["Verified", "Pending", "Rejected"], weights=[0.75, 0.15, 0.10])[0]
    m = random.choices(methods, weights=method_weights)[0]
    amt = random.choice([200000.00, 250000.00, 300000.00, 350000.00])
    tx_date = ANCHOR_DATE - timedelta(days=random.randint(1, 150), hours=random.randint(1, 12))
    transactions.append({
        "transaction_id": tx_id,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": tx_date.strftime("%Y-%m-%d %H:%M:%S"),
        "verification_status": status,
        "verified_by": 2 if status in ["Verified", "Rejected"] else None,
        "ref": f"TRX-2026-{tx_id:05d}",
        "proof": f"bukti_{tx_id}.jpg"
    })
    tx_id += 1

# Budget Data
budget_allocations = [
    (1, "Gaji Guru & Tenaga Kependidikan", "2026/2027", 320000000.00),
    (2, "Utilitas Listrik, Air & Internet", "2026/2027", 55000000.00),
    (3, "Sarana & Prasarana Laboratorium", "2026/2027", 95000000.00),
    (4, "Kegiatan Kesiswaan & OSIS", "2026/2027", 70000000.00),
    (5, "Pengadaan ATK & Modul Pembelajaran", "2026/2027", 45000000.00)
]

expenditures = [
    (1, 1, "Gaji & Honorarium Pendidik Bulan Juli 2026", 45000000.00, "2026-07-28", "BKT-GJI-0726.pdf"),
    (2, 1, "Gaji & Honorarium Pendidik Bulan Agustus 2026", 45000000.00, "2026-08-28", "BKT-GJI-0826.pdf"),
    (3, 1, "Gaji & Honorarium Pendidik Bulan September 2026", 46500000.00, "2026-09-28", "BKT-GJI-0926.pdf"),
    (4, 1, "Gaji & Honorarium Pendidik Bulan Oktober 2026", 46500000.00, "2026-10-28", "BKT-GJI-1026.pdf"),
    (5, 2, "Tagihan Listrik PLN Juli 2026", 6200000.00, "2026-08-04", "PLN-0726.pdf"),
    (6, 2, "Langganan Internet Dedicated Fiber Optic Juli 2026", 4800000.00, "2026-08-05", "ISP-0726.pdf"),
    (7, 2, "Tagihan Listrik PLN Agustus 2026", 6450000.00, "2026-09-04", "PLN-0826.pdf"),
    (8, 2, "Langganan Internet Dedicated Fiber Optic Agustus 2026", 4800000.00, "2026-09-05", "ISP-0826.pdf"),
    (9, 2, "Tagihan Listrik PLN September 2026", 6300000.00, "2026-10-04", "PLN-0926.pdf"),
    (10, 2, "Langganan Internet Dedicated Fiber Optic September 2026", 4800000.00, "2026-10-05", "ISP-0926.pdf"),
    (11, 2, "Tagihan Listrik PLN Oktober 2026", 6500000.00, "2026-11-02", "PLN-1026.pdf"),
    (12, 3, "Peremajaan 15 Unit PC Lab Komputer & SSD", 38000000.00, "2026-08-15", "INV-LAB-01.pdf"),
    (13, 3, "Pengadaan Mikroskop Binokuler Lab Biologi 4 Unit", 18500000.00, "2026-09-12", "INV-LAB-02.pdf"),
    (14, 3, "Perpanjangan Lisensi Software Cisco & OS Lab", 14000000.00, "2026-10-18", "INV-LAB-03.pdf"),
    (15, 4, "Penyelenggaraan Masa Pengenalan Lingkungan Sekolah (MPLS)", 16500000.00, "2026-07-22", "KEG-MPLS.pdf"),
    (16, 4, "Peringatan HUT RI & Lomba Kemerdekaan Antar Kelas", 12000000.00, "2026-08-18", "KEG-HUTRI.pdf"),
    (17, 4, "Latihan Dasar Kepemimpinan Siswa (LDKS) OSIS", 19500000.00, "2026-10-12", "KEG-LDKS.pdf"),
    (18, 5, "Pengadaan Kertas HVS, Tinta & Toner Printer Kantor", 8500000.00, "2026-08-08", "ATK-01.pdf"),
    (19, 5, "Cetak Buku Panduan Siswa & Modul Kurikulum Merdeka", 22000000.00, "2026-09-02", "ATK-02.pdf"),
    (20, 5, "Pengadaan Spidol Whiteboard & Perlengkapan Kelas", 6500000.00, "2026-10-09", "ATK-03.pdf")
]

# Write out database/seed.sql
with open("database/seed.sql", "w", encoding="utf-8") as f:
    f.write("-- =============================================================================\n")
    f.write("-- PROYEK: EduPay Monitor - Seed Data Realistis (PostgreSQL)\n")
    f.write("-- TOTAL: 6 Kelas, 120 Siswa, 385 Tagihan, 500 Transaksi, 5 Alokasi Anggaran, 3 Role Utama\n")
    f.write("-- ANCHOR DATE: 03 Nov 2026\n")
    f.write("-- =============================================================================\n\n")
    f.write("BEGIN;\n\n")

    # 1. ROLES (3 TINGKATAN: SUPER ADMIN, ADMIN, USER)
    f.write("-- 1. ROLES (RBAC 3 TINGKATAN)\n")
    f.write("INSERT INTO roles (role_id, role_name, deskripsi) VALUES\n")
    f.write("  (1, 'super_admin', 'Super Administrator dengan hak akses mutlak mengubah seluruh website dan data'),\n")
    f.write("  (2, 'admin', 'Administrator Operasional untuk memonitor kasir, verifikasi bukti bayar, dan tagihan'),\n")
    f.write("  (3, 'user', 'Pengguna umum (siswa/orang tua) untuk melihat dan membayar tagihan pribadi')\n")
    f.write("ON CONFLICT (role_id) DO NOTHING;\n\n")

    # 2. USERS DEMO
    f.write("-- 2. USERS DEMO (Password default: password123)\n")
    f.write("INSERT INTO users (user_id, username, password_hash, nama_lengkap, email, role_id, student_id) VALUES\n")
    f.write(f"  (1, 'superadmin', '{DEFAULT_BCRYPT}', 'Prof. Dr. Ir. H. Raden Mas Bagus, M.Sc.', 'superadmin@edupay.sch.id', 1, NULL),\n")
    f.write(f"  (2, 'admin', '{DEFAULT_BCRYPT}', 'Suryadi Wibisono, S.Kom.', 'admin@edupay.sch.id', 2, NULL),\n")
    f.write(f"  (3, 'user', '{DEFAULT_BCRYPT}', 'Budi Pratama (Siswa Kelas X-A)', 'budi.pratama@siswa.edupay.sch.id', 3, 1),\n")
    f.write(f"  (4, 'bendahara', '{DEFAULT_BCRYPT}', 'Hj. Siti Aminah, S.E.', 'bendahara@edupay.sch.id', 2, NULL),\n")
    f.write(f"  (5, 'kepsek', '{DEFAULT_BCRYPT}', 'Drs. H. Mulyadi, M.Pd.', 'kepsek@edupay.sch.id', 2, NULL),\n")
    f.write(f"  (6, 'ortu', '{DEFAULT_BCRYPT}', 'Bambang Pratama (Wali Budi Pratama)', 'ortu.20260001@example.com', 3, 1)\n")
    f.write("ON CONFLICT (user_id) DO NOTHING;\n\n")

    # 3. SYSTEM SETTINGS
    bank_json = json.dumps([
        {"bank": "Bank Mandiri", "accountNo": "123-00-9876543-1", "holder": "Yayasan Nusantara Mandiri"},
        {"bank": "BCA", "accountNo": "882-019-2831", "holder": "Yayasan Nusantara Mandiri"},
        {"bank": "BRI Virtual Account", "accountNo": "7001-2026-0001", "holder": "EduPay Virtual Account"}
    ])
    f.write("-- 3. SYSTEM SETTINGS (Kontrol Penuh Website)\n")
    f.write("INSERT INTO system_settings (setting_id, institution_name, institution_motto, academic_year, system_date, address, phone, whatsapp_contact, email, bank_accounts, overdue_grace_days, maintenance_mode, updated_by) VALUES\n")
    f.write(f"  (1, 'SMA Nusantara Mandiri', 'Unggul, Berkarakter & Berdaya Saing Global', '2026/2027', '2026-11-03', 'Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan', '(021) 7890-1234', '0812-3456-7890', 'info@edupay.sch.id', '{bank_json}'::jsonb, 3, false, 1)\n")
    f.write("ON CONFLICT (setting_id) DO NOTHING;\n\n")

    # 4. CLASSES
    f.write("-- 4. CLASSES (6 Kelas)\n")
    f.write("INSERT INTO classes (class_id, nama_kelas, tingkat, tahun_ajaran) VALUES\n")
    c_rows = [f"  ({c[0]}, '{c[1]}', '{c[2]}', '{c[3]}')" for c in classes_data]
    f.write(",\n".join(c_rows) + "\nON CONFLICT (class_id) DO NOTHING;\n\n")

    # 5. STUDENTS
    f.write("-- 5. STUDENTS (120 Siswa)\n")
    f.write("INSERT INTO students (student_id, nis, nama, class_id, nama_orang_tua, email_ortu, no_hp_ortu, status_aktif) VALUES\n")
    s_rows = [f"  ({s['student_id']}, '{s['nis']}', '{s['nama']}', {s['class_id']}, '{s['nama_orang_tua']}', '{s['email_ortu']}', '{s['no_hp_ortu']}', true)" for s in students]
    f.write(",\n".join(s_rows) + "\nON CONFLICT (student_id) DO NOTHING;\n\n")

    # 6. FEE STRUCTURES
    f.write("-- 6. FEE STRUCTURES (8 Periode/Biaya)\n")
    f.write("INSERT INTO fee_structures (fee_id, fee_name, amount, due_date, academic_year) VALUES\n")
    fee_rows = [f"  ({f[0]}, '{f[1]}', {f[2]:.2f}, '{f[3]}', '2026/2027')" for f in fee_structures]
    f.write(",\n".join(fee_rows) + "\nON CONFLICT (fee_id) DO NOTHING;\n\n")

    # 7. STUDENT BILLS
    f.write("-- 7. STUDENT BILLS (385 Tagihan Siswa)\n")
    f.write("INSERT INTO student_bills (bill_id, student_id, fee_id, amount_due, payment_status, created_at) VALUES\n")
    b_rows = [f"  ({b['bill_id']}, {b['student_id']}, {b['fee_id']}, {b['amount_due']:.2f}, 'Unpaid', '{b['created_at']}')" for b in bills]
    f.write(",\n".join(b_rows) + "\nON CONFLICT (bill_id) DO NOTHING;\n\n")

    # 8. PAYMENT TRANSACTIONS
    f.write("-- 8. PAYMENT TRANSACTIONS (500 Transaksi Finansial)\n")
    f.write("INSERT INTO payment_transactions (transaction_id, bill_id, amount_paid, payment_method, transaction_date, verification_status, verified_by, proof_file, reference_number) VALUES\n")
    tx_rows = []
    for tx in transactions:
        v_by = tx['verified_by'] if tx['verified_by'] is not None else "NULL"
        row = f"  ({tx['transaction_id']}, {tx['bill_id']}, {tx['amount_paid']:.2f}, '{tx['payment_method']}', '{tx['transaction_date']}', '{tx['verification_status']}', {v_by}, '{tx['proof']}', '{tx['ref']}')"
        tx_rows.append(row)
    f.write(",\n".join(tx_rows) + "\nON CONFLICT (transaction_id) DO NOTHING;\n\n")

    # 9. BUDGET ALLOCATIONS & EXPENDITURES
    f.write("-- 9. BUDGET ALLOCATIONS (5 Alokasi Anggaran)\n")
    f.write("INSERT INTO budget_allocations (allocation_id, kategori, periode, nominal_alokasi) VALUES\n")
    bgt_rows = [f"  ({b[0]}, '{b[1]}', '{b[2]}', {b[3]:.2f})" for b in budget_allocations]
    f.write(",\n".join(bgt_rows) + "\nON CONFLICT (allocation_id) DO NOTHING;\n\n")

    f.write("-- 10. BUDGET EXPENDITURES (20 Realisasi Belanja Operasional)\n")
    f.write("INSERT INTO budget_expenditures (expenditure_id, allocation_id, deskripsi, nominal, tanggal, bukti) VALUES\n")
    exp_rows = [f"  ({e[0]}, {e[1]}, '{e[2]}', {e[3]:.2f}, '{e[4]}', '{e[5]}')" for e in expenditures]
    f.write(",\n".join(exp_rows) + "\nON CONFLICT (expenditure_id) DO NOTHING;\n\n")

    # 11. NOTIFICATION LOGS
    f.write("-- 11. NOTIFICATION LOGS\n")
    f.write("INSERT INTO notification_logs (notification_id, bill_id, channel, recipient, status_kirim, isi_pesan, waktu_kirim) VALUES\n")
    notif_rows = [
        f"  (1, 361, 'WhatsApp', '081288291021', 'Sent', 'Pemberitahuan: Tagihan SPP Bulan November 2026 siswa an. Budi Pratama (Kelas X-A) sebesar Rp 650.000 akan jatuh tempo pada 10 Nov 2026 (H-7). Harap melakukan pembayaran tepat waktu.', '2026-11-03 08:30:00+07')",
        f"  (2, 372, 'Email', 'ortu.20260012@example.com', 'Sent', 'Pemberitahuan: Iuran Kegiatan & Praktikum Lab sebesar Rp 950.000 jatuh tempo pada 06 Nov 2026 (H-3). Silakan selesaikan transaksi melalui portal EduPay.', '2026-11-03 08:35:12+07')",
        f"  (3, 380, 'WhatsApp', '081299110022', 'Sent', 'Pemberitahuan: Iuran Ujian Akhir Semester Ganjil sebesar Rp 500.000 jatuh tempo besok (04 Nov 2026 / H-1).', '2026-11-03 09:10:00+07')",
        f"  (4, 240, 'WhatsApp', '081233445566', 'Failed', 'Peringatan: Tagihan SPP Bulan Oktober 2026 telah melewati jatuh tempo 24 hari. Mohon segera melunasi tunggakan.', '2026-11-02 10:15:00+07')"
    ]
    f.write(",\n".join(notif_rows) + "\nON CONFLICT (notification_id) DO NOTHING;\n\n")

    # 12. RESET SEQUENCES
    f.write("-- 12. RESET AUTO-INCREMENT SEQUENCES\n")
    f.write("SELECT setval('classes_class_id_seq', (SELECT MAX(class_id) FROM classes));\n")
    f.write("SELECT setval('students_student_id_seq', (SELECT MAX(student_id) FROM students));\n")
    f.write("SELECT setval('fee_structures_fee_id_seq', (SELECT MAX(fee_id) FROM fee_structures));\n")
    f.write("SELECT setval('student_bills_bill_id_seq', (SELECT MAX(bill_id) FROM student_bills));\n")
    f.write("SELECT setval('payment_transactions_transaction_id_seq', (SELECT MAX(transaction_id) FROM payment_transactions));\n")
    f.write("SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));\n")
    f.write("SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));\n")
    f.write("SELECT setval('budget_allocations_allocation_id_seq', (SELECT MAX(allocation_id) FROM budget_allocations));\n")
    f.write("SELECT setval('budget_expenditures_expenditure_id_seq', (SELECT MAX(expenditure_id) FROM budget_expenditures));\n")
    f.write("SELECT setval('notification_logs_notification_id_seq', (SELECT MAX(notification_id) FROM notification_logs));\n\n")

    # 13. REFRESH OVERDUE STATUS
    f.write("-- 13. SINKRONISASI STATUS OVERDUE TERAKHIR\n")
    f.write("SELECT sp_refresh_overdue_bills();\n\n")

    f.write("COMMIT;\n")

print(f"Generated seed.sql successfully! Classes: {len(classes_data)}, Students: {len(students)}, Bills: {len(bills)}, Transactions: {len(transactions)}")
