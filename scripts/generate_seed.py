import random
from datetime import datetime, timedelta

random.seed(42)

first_names_male = [
    "Ahmad", "Budi", "Cahyo", "Dimas", "Eko", "Fajar", "Gilang", "Hadi", "Indra", "Joko",
    "Kurniawan", "Lukman", "Muhammad", "Naufal", "Oki", "Prasetyo", "Rian", "Surya", "Teguh", "Wahyu"
]
first_names_female = [
    "Aisyah", "Bunga", "Citra", "Dewi", "Erna", "Fitri", "Gita", "Hani", "Intan", "Juwita",
    "Kartika", "Lestari", "Maya", "Nurul", "Putri", "Ratna", "Sari", "Tri", "Utami", "Wulandari"
]
last_names = [
    "Pratama", "Saputra", "Wijaya", "Hidayat", "Santoso", "Setiawan", "Kusuma", "Nugroho",
    "Ramadhan", "Siregar", "Nasution", "Wibowo", "Permana", "Firmansyah", "Gunawan", "Hakim",
    "Irawan", "Mahendra", "Purnomo", "Raharjo", "Subagyo", "Utomo", "Yulianto", "Zulkarnain"
]
parent_titles = ["Bpk.", "Ibu"]

classes_data = [
    (1, "X MIPA 1", "10", "2024/2025"),
    (2, "X MIPA 2", "10", "2024/2025"),
    (3, "XI MIPA 1", "11", "2024/2025"),
    (4, "XI IPS 1", "11", "2024/2025"),
    (5, "XII MIPA 1", "12", "2024/2025")
]

fee_data = [
    (1, "SPP Bulan September 2024", 750000.00, "2024-09-10"),
    (2, "SPP Bulan Oktober 2024", 750000.00, "2024-10-10"),
    (3, "SPP Bulan November 2024", 750000.00, "2024-11-10")
]

methods = ["Transfer Bank", "E-Wallet", "Cash"]
method_weights = [0.55, 0.30, 0.15]

# Generate 100 students
students = []
student_id_counter = 1
for class_id in range(1, 6):
    for i in range(20):
        is_male = (i % 2 == 0)
        fname = random.choice(first_names_male if is_male else first_names_female)
        lname = random.choice(last_names)
        full_name = f"{fname} {lname}"
        
        nis = f"2024{student_id_counter:04d}"
        parent_name = f"{random.choice(parent_titles)} {random.choice(first_names_male)} {lname}"
        email_clean = f"ortu.{nis}@example.com"
        phone = f"0812{random.randint(10000000, 99999999)}"
        
        students.append({
            "student_id": student_id_counter,
            "nis": nis,
            "nama": full_name,
            "class_id": class_id,
            "nama_orang_tua": parent_name,
            "email_ortu": email_clean,
            "no_hp_ortu": phone,
            "status_aktif": True
        })
        student_id_counter += 1

# Generate 300 Bills (100 students x 3 fee structures)
bills = []
bill_id_counter = 1
for s in students:
    for f in fee_data:
        bills.append({
            "bill_id": bill_id_counter,
            "student_id": s["student_id"],
            "fee_id": f[0],
            "fee_name": f[1],
            "amount": f[2],
            "due_date": f[3],
            "amount_due": f[2], # will be adjusted by trigger in DB, but we set initial
            "payment_status": "Unpaid"
        })
        bill_id_counter += 1

# Generate 500 Transactions distributed across bills
# We want:
# - Some bills fully paid (1 full tx or 2 partial txs)
# - Some bills partial (1 partial tx)
# - Some bills pending
# - Some bills rejected
# - Some bills overdue/unpaid (no tx)
transactions = []
tx_id_counter = 1

# bcrypt hash for 'password123'
DEFAULT_BCRYPT = "$2a$10$w8T0tTfXmP2QkG6K1hKxwe19A0iWlXJzFfX7QeA7Fq1sWj7YxWz8O"

# Let's assign scenarios to the 300 bills:
# Bills 1..120: Fully paid with 1 transaction (120 txs)
for b in bills[0:120]:
    d_offset = random.randint(1, 25)
    tx_date = f"2024-09-{d_offset:02d} {random.randint(8,16):02d}:{random.randint(10,59):02d}:00"
    if b["fee_id"] == 2:
        tx_date = f"2024-10-{d_offset:02d} {random.randint(8,16):02d}:{random.randint(10,59):02d}:00"
    elif b["fee_id"] == 3:
        tx_date = f"2024-11-{min(d_offset, 3):02d} {random.randint(8,16):02d}:{random.randint(10,59):02d}:00"
        
    m = random.choices(methods, weights=method_weights)[0]
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": b["amount"],
        "payment_method": m,
        "transaction_date": tx_date,
        "verification_status": "Verified",
        "verified_by": 2, # Bendahara
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Bills 120..190: Fully paid with 2 partial transactions (70 bills * 2 = 140 txs)
for b in bills[120:190]:
    d1 = random.randint(1, 10)
    d2 = random.randint(11, 28)
    part1 = 350000.00
    part2 = 400000.00
    
    month = "09" if b["fee_id"] == 1 else ("10" if b["fee_id"] == 2 else "11")
    t1 = f"2024-{month}-{d1:02d} {random.randint(8,12):02d}:15:00"
    t2 = f"2024-{month}-{min(d2, 3 if month=='11' else 28):02d} {random.randint(13,17):02d}:45:00"
    
    m1 = random.choices(methods, weights=method_weights)[0]
    m2 = random.choices(methods, weights=method_weights)[0]
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": part1,
        "payment_method": m1,
        "transaction_date": t1,
        "verification_status": "Verified",
        "verified_by": 2,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": part2,
        "payment_method": m2,
        "transaction_date": t2,
        "verification_status": "Verified",
        "verified_by": 2,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Bills 190..235: Partial status (1 partial verified tx of Rp 350.000 or Rp 500.000) (45 txs)
for b in bills[190:235]:
    month = "09" if b["fee_id"] == 1 else ("10" if b["fee_id"] == 2 else "11")
    d = random.randint(1, 3 if month=='11' else 25)
    t = f"2024-{month}-{d:02d} {random.randint(9,15):02d}:30:00"
    amt = random.choice([350000.00, 500000.00])
    m = random.choices(methods, weights=method_weights)[0]
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": t,
        "verification_status": "Verified",
        "verified_by": 2,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Bills 235..275: Bills with Pending transactions (40 bills * 1 tx = 40 txs)
for b in bills[235:275]:
    month = "10" if b["fee_id"] == 2 else "11"
    d = random.randint(1, 3 if month=='11' else 28)
    t = f"2024-{month}-{d:02d} {random.randint(9,16):02d}:20:00"
    amt = random.choice([375000.00, 750000.00])
    m = random.choices(methods, weights=method_weights)[0]
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": t,
        "verification_status": "Pending",
        "verified_by": None,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Bills 275..300: Some rejected transactions (25 bills * 1 rejected tx = 25 txs)
for b in bills[275:300]:
    month = "09" if b["fee_id"] == 1 else ("10" if b["fee_id"] == 2 else "11")
    d = random.randint(1, 3 if month=='11' else 25)
    t = f"2024-{month}-{d:02d} {random.randint(9,16):02d}:10:00"
    m = random.choices(methods, weights=method_weights)[0]
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": 750000.00,
        "payment_method": m,
        "transaction_date": t,
        "verification_status": "Rejected",
        "verified_by": 2,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Total transactions so far: 120 + 140 + 45 + 40 + 25 = 370.
# We need ±500 transactions, so let's add 130 additional transactions to reach exactly 500!
# We can add historical re-try transactions, second pending transactions, or additional verified micro-payments.
for i in range(130):
    b = random.choice(bills[0:200]) # across bills
    status = random.choices(["Verified", "Pending", "Rejected"], weights=[0.70, 0.20, 0.10])[0]
    m = random.choices(methods, weights=method_weights)[0]
    amt = random.choice([250000.00, 350000.00, 500000.00])
    month = random.choice(["09", "10", "11"])
    d = random.randint(1, 3 if month=='11' else 28)
    t = f"2024-{month}-{d:02d} {random.randint(8,16):02d}:{random.randint(10,59):02d}:00"
    
    transactions.append({
        "transaction_id": tx_id_counter,
        "bill_id": b["bill_id"],
        "amount_paid": amt,
        "payment_method": m,
        "transaction_date": t,
        "verification_status": status,
        "verified_by": 2 if status in ["Verified", "Rejected"] else None,
        "proof_file": f"proof_tx_{tx_id_counter}.jpg",
        "ref": f"TRX-2024-{tx_id_counter:05d}"
    })
    tx_id_counter += 1

# Budget Data
budget_allocations = [
    (1, "Operasional Belajar & Sarana Kelas", "2024/2025", 150000000.00),
    (2, "Gaji & Honorarium Pendidik Honorer", "2024/2025", 250000000.00),
    (3, "Pemeliharaan Fasilitas Laboratorium & IT", "2024/2025", 80000000.00),
    (4, "Pengembangan Ekstrakurikuler & OSIS", "2024/2025", 60000000.00),
    (5, "Utilitas Kantor (Listrik, Air, & Internet)", "2024/2025", 45000000.00)
]

expenditures = [
    (1, 1, "Pengadaan Spidol, Penghapus & Kertas Ujian", 12500000.00, "2024-07-20", "INV-BGT-001.pdf"),
    (2, 1, "Perbaikan Meja dan Kursi Kelas X MIPA 1", 8400000.00, "2024-08-15", "INV-BGT-002.pdf"),
    (3, 1, "Pengadaan Whiteboard Magnetik Baru 5 Unit", 7500000.00, "2024-09-05", "INV-BGT-003.pdf"),
    (4, 1, "Pengadaan Modul Pembelajaran Semester Ganjil", 21000000.00, "2024-10-02", "INV-BGT-004.pdf"),
    (5, 2, "Honorarium Guru Honorer Bulan Juli 2024", 28000000.00, "2024-07-28", "SLIP-HONOR-0724.pdf"),
    (6, 2, "Honorarium Guru Honorer Bulan Agustus 2024", 28000000.00, "2024-08-28", "SLIP-HONOR-0824.pdf"),
    (7, 2, "Honorarium Guru Honorer Bulan September 2024", 28500000.00, "2024-09-28", "SLIP-HONOR-0924.pdf"),
    (8, 2, "Honorarium Guru Honorer Bulan Oktober 2024", 28500000.00, "2024-10-28", "SLIP-HONOR-1024.pdf"),
    (9, 3, "Penggantian Router Mikrotik & Akses Poin Lab Komputer", 14500000.00, "2024-07-18", "INV-BGT-005.pdf"),
    (10, 3, "Upgrade RAM & SSD PC Laboratorium Komputer 20 Unit", 22000000.00, "2024-08-22", "INV-BGT-006.pdf"),
    (11, 3, "Perpanjangan Lisensi Antivirus & Software Edukasi", 9500000.00, "2024-09-12", "INV-BGT-007.pdf"),
    (12, 4, "Dana Latihan & Kostum Tim Futsal Sekolah", 6500000.00, "2024-08-10", "INV-BGT-008.pdf"),
    (13, 4, "Sponsorship Lomba Cerdas Cermat Kesiswaan", 8000000.00, "2024-09-18", "INV-BGT-009.pdf"),
    (14, 4, "Penyelenggaraan Latihan Dasar Kepemimpinan (LDK) OSIS", 18500000.00, "2024-10-14", "INV-BGT-010.pdf"),
    (15, 5, "Pembayaran Rekening Listrik PLN Bulan Juli 2024", 5200000.00, "2024-08-05", "PLN-0724.pdf"),
    (16, 5, "Langganan Internet Dedicated Fiber Optic Juli 2024", 4500000.00, "2024-08-06", "ISP-0724.pdf"),
    (17, 5, "Pembayaran Rekening Listrik PLN Bulan Agustus 2024", 5400000.00, "2024-09-05", "PLN-0824.pdf"),
    (18, 5, "Langganan Internet Dedicated Fiber Optic Agustus 2024", 4500000.00, "2024-09-06", "ISP-0824.pdf"),
    (19, 5, "Pembayaran Rekening Listrik PLN Bulan September 2024", 5150000.00, "2024-10-05", "PLN-0924.pdf"),
    (20, 5, "Langganan Internet Dedicated Fiber Optic September 2024", 4500000.00, "2024-10-06", "ISP-0924.pdf"),
    (21, 5, "Pembayaran Rekening Listrik PLN Bulan Oktober 2024", 5300000.00, "2024-11-02", "PLN-1024.pdf"),
    (22, 5, "Langganan Internet Dedicated Fiber Optic Oktober 2024", 4500000.00, "2024-11-03", "ISP-1024.pdf")
]

# Write to database/seed.sql
with open("database/seed.sql", "w", encoding="utf-8") as f:
    f.write("-- =============================================================================\n")
    f.write("-- PROYEK: UduPay Monitor - Data Dummy Realistis (Seed Data)\n")
    f.write("-- TOTAL: 5 Kelas, 100 Siswa, 300 Tagihan, 500 Transaksi, 5 Alokasi Anggaran & Realisasi\n")
    f.write("-- =============================================================================\n\n")
    f.write("BEGIN;\n\n")

    # 1. Roles
    f.write("-- 1. ROLES\n")
    f.write("INSERT INTO roles (role_id, role_name, deskripsi) VALUES\n")
    f.write("  (1, 'admin', 'Administrator Sistem dengan akses konfigurasi penuh'),\n")
    f.write("  (2, 'bendahara', 'Pengelola transaksi kas, verifikasi bayar, dan laporan keuangan'),\n")
    f.write("  (3, 'kepala_sekolah', 'Monitoring rekapitulasi eksekutif, kas, tunggakan, dan anggaran'),\n")
    f.write("  (4, 'orang_tua', 'Melihat tagihan, histori pembayaran siswa, dan bukti bayar')\n")
    f.write("ON CONFLICT (role_id) DO NOTHING;\n\n")

    # 2. Users (Admin, Bendahara, Kepala Sekolah, dan Sampel Akun Ortu)
    f.write("-- 2. USERS (Password default semua akun: password123)\n")
    f.write("INSERT INTO users (user_id, username, password_hash, nama_lengkap, email, role_id) VALUES\n")
    f.write(f"  (1, 'admin', '{DEFAULT_BCRYPT}', 'System Administrator', 'admin@udupay.sch.id', 1),\n")
    f.write(f"  (2, 'bendahara', '{DEFAULT_BCRYPT}', 'Hj. Siti Aminah, S.E.', 'bendahara@udupay.sch.id', 2),\n")
    f.write(f"  (3, 'kepsek', '{DEFAULT_BCRYPT}', 'Drs. H. Mulyadi, M.Pd.', 'kepsek@udupay.sch.id', 3)")
    
    # 20 Sample Parent users
    user_id_c = 4
    for i in range(1, 21):
        s = students[i-1]
        u_name = f"ortu_{s['nis']}"
        f.write(f",\n  ({user_id_c}, '{u_name}', '{DEFAULT_BCRYPT}', '{s['nama_orang_tua']}', '{s['email_ortu']}', 4)")
        user_id_c += 1
    f.write("\nON CONFLICT (user_id) DO NOTHING;\n\n")

    # 3. Classes
    f.write("-- 3. CLASSES (5 Kelas)\n")
    f.write("INSERT INTO classes (class_id, nama_kelas, tingkat, tahun_ajaran) VALUES\n")
    cls_rows = [f"  ({c[0]}, '{c[1]}', '{c[2]}', '{c[3]}')" for c in classes_data]
    f.write(",\n".join(cls_rows) + "\nON CONFLICT (class_id) DO NOTHING;\n\n")

    # 4. Students
    f.write("-- 4. STUDENTS (100 Siswa)\n")
    f.write("INSERT INTO students (student_id, nis, nama, class_id, nama_orang_tua, email_ortu, no_hp_ortu, status_aktif) VALUES\n")
    s_rows = [f"  ({s['student_id']}, '{s['nis']}', '{s['nama']}', {s['class_id']}, '{s['nama_orang_tua']}', '{s['email_ortu']}', '{s['no_hp_ortu']}', true)" for s in students]
    f.write(",\n".join(s_rows) + "\nON CONFLICT (student_id) DO NOTHING;\n\n")

    # 5. Parent Students Relations
    f.write("-- 5. PARENT_STUDENTS (Relasi Orang Tua ↔ Siswa)\n")
    f.write("INSERT INTO parent_students (parent_user_id, student_id, relationship_type) VALUES\n")
    ps_rows = [f"  ({4 + i}, {i + 1}, 'Orang Tua / Wali')" for i in range(20)]
    f.write(",\n".join(ps_rows) + "\nON CONFLICT DO NOTHING;\n\n")

    # 6. Fee Structures
    f.write("-- 6. FEE STRUCTURES (3 Periode SPP)\n")
    f.write("INSERT INTO fee_structures (fee_id, fee_name, amount, due_date, academic_year) VALUES\n")
    fee_rows = [f"  ({f[0]}, '{f[1]}', {f[2]:.2f}, '{f[3]}', '2024/2025')" for f in fee_data]
    f.write(",\n".join(fee_rows) + "\nON CONFLICT (fee_id) DO NOTHING;\n\n")

    # 7. Student Bills
    f.write("-- 7. STUDENT BILLS (300 Tagihan)\n")
    f.write("INSERT INTO student_bills (bill_id, student_id, fee_id, amount_due, payment_status, created_at) VALUES\n")
    b_rows = [f"  ({b['bill_id']}, {b['student_id']}, {b['fee_id']}, {b['amount_due']:.2f}, 'Unpaid', '{b['due_date']}')" for b in bills]
    f.write(",\n".join(b_rows) + "\nON CONFLICT (bill_id) DO NOTHING;\n\n")

    # 8. Payment Transactions
    f.write("-- 8. PAYMENT TRANSACTIONS (500 Transaksi)\n")
    f.write("INSERT INTO payment_transactions (transaction_id, bill_id, amount_paid, payment_method, transaction_date, verification_status, verified_by, proof_file, reference_number) VALUES\n")
    tx_rows = []
    for tx in transactions:
        v_by = tx['verified_by'] if tx['verified_by'] is not None else "NULL"
        row = f"  ({tx['transaction_id']}, {tx['bill_id']}, {tx['amount_paid']:.2f}, '{tx['payment_method']}', '{tx['transaction_date']}', '{tx['verification_status']}', {v_by}, '{tx['proof_file']}', '{tx['ref']}')"
        tx_rows.append(row)
    f.write(",\n".join(tx_rows) + "\nON CONFLICT (transaction_id) DO NOTHING;\n\n")

    # 9. Budget Allocations & Expenditures
    f.write("-- 9. BUDGET ALLOCATIONS (5 Kategori Anggaran)\n")
    f.write("INSERT INTO budget_allocations (allocation_id, kategori, periode, nominal_alokasi) VALUES\n")
    bgt_rows = [f"  ({b[0]}, '{b[1]}', '{b[2]}', {b[3]:.2f})" for b in budget_allocations]
    f.write(",\n".join(bgt_rows) + "\nON CONFLICT (allocation_id) DO NOTHING;\n\n")

    f.write("-- 10. BUDGET EXPENDITURES (22 Realisasi Belanja Operasional)\n")
    f.write("INSERT INTO budget_expenditures (expenditure_id, allocation_id, deskripsi, nominal, tanggal, bukti) VALUES\n")
    exp_rows = [f"  ({e[0]}, {e[1]}, '{e[2]}', {e[3]:.2f}, '{e[4]}', '{e[5]}')" for e in expenditures]
    f.write(",\n".join(exp_rows) + "\nON CONFLICT (expenditure_id) DO NOTHING;\n\n")

    # 11. Notification Logs Dummy
    f.write("-- 11. NOTIFICATION LOGS (Contoh Log Pengiriman Notifikasi WhatsApp/Email)\n")
    f.write("INSERT INTO notification_logs (notification_id, bill_id, channel, recipient, status_kirim, isi_pesan, waktu_kirim) VALUES\n")
    notif_rows = [
        f"  (1, 1, 'WhatsApp', '081288291021', 'Sent', 'Pemberitahuan Tagihan SPP September 2024 sebesar Rp 750.000 telah terbit.', '2024-09-01 08:00:00+07')",
        f"  (2, 2, 'Email', 'ortu.20240001@example.com', 'Sent', 'Pengingat H-3 Tagihan SPP Oktober 2024 sebesar Rp 750.000.', '2024-10-07 09:00:00+07')",
        f"  (3, 3, 'WhatsApp', '081288291021', 'Sent', 'Pengingat H-1 Tagihan SPP November 2024 sebesar Rp 750.000 jatuh tempo besok.', '2024-11-09 08:30:00+07')",
        f"  (4, 280, 'WhatsApp', '081299881122', 'Failed', 'Peringatan Tunggakan SPP September 2024 belum lunas.', '2024-10-15 10:00:00+07')"
    ]
    f.write(",\n".join(notif_rows) + "\nON CONFLICT (notification_id) DO NOTHING;\n\n")

    # Update sequence values in PostgreSQL
    f.write("-- 12. RESET SEQUENCES AGAR AUTO INCREMENT AMAN\n")
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

    f.write("-- 13. SINKRONISASI STATUS OVERDUE PADA TAGIHAN YANG BELUM LUNAS\n")
    f.write("SELECT sp_refresh_overdue_bills();\n\n")

    f.write("COMMIT;\n")

print(f"Generated seed.sql successfully! Classes: 5, Students: {len(students)}, Bills: {len(bills)}, Transactions: {len(transactions)}")
